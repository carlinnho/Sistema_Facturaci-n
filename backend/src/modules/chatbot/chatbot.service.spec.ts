import {
  ForbiddenException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { DatabaseService } from '../database/database.service';
import { OpenRouterService } from './openrouter.service';

describe('Chatbot de consulta', () => {
  const admin = { id: 1, rol: 1 };
  const cajero = { id: 2, rol: 2 };
  let db: { query: jest.Mock };
  let ia: { resumir: jest.Mock };
  let service: ChatbotService;

  beforeEach(() => {
    db = { query: jest.fn().mockResolvedValue([]) };
    ia = {
      resumir: jest.fn().mockResolvedValue({ texto: 'Resumen de prueba.' }),
    };
    service = new ChatbotService(
      db as unknown as DatabaseService,
      ia as unknown as OpenRouterService,
    );
  });
  afterEach(() => jest.useRealTimers());

  it.each([
    'Cuanto vendimos hoy',
    'Total de ingresos y producto mas vendido esta semana',
    'Listado de productos menos vendidos este mes',
    'Productos mas vendidos esta semana',
    'Stock minimo',
    'Productos con bajo stock',
    'Productos agotados',
    'Telefono del proveedor Acme',
  ])('impide datos administrativos al cajero: %s', async (consulta) => {
    await expect(service.responder(consulta, cajero)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(db.query).not.toHaveBeenCalled();
    expect(ia.resumir).not.toHaveBeenCalled();
  });

  it.each([
    'Anade 20 productos',
    'Actualiza el stock de arroz',
    'Elimina un proveedor',
    'INSERT INTO productos',
    'Registra una venta',
  ])('no ejecuta escrituras: %s', async (consulta) => {
    const result = await service.responder(consulta, admin);
    expect(result.respuesta).toContain('solo consulta');
    expect(db.query).not.toHaveBeenCalled();
    expect(ia.resumir).not.toHaveBeenCalled();
  });

  it('rechaza roles desconocidos', async () => {
    await expect(
      service.responder('Stock de leche', { id: 3, rol: 99 }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('consulta productos con parametros y envia solo campos permitidos a la IA', async () => {
    db.query.mockResolvedValue([
      {
        nombre: 'Leche Gloria',
        sku: 'LEC-001',
        stock_actual: 7,
        precio: '5.50',
        password_hash: 'no-enviar',
      },
    ]);
    const result = await service.responder(
      '¿Cuánto stock queda de leche?',
      cajero,
    );
    expect(db.query.mock.calls[0][0]).toContain('fecha_borrado IS NULL');
    expect(db.query.mock.calls[0][1]).toContain('%leche%');
    expect(result.filas?.[0]).toMatchObject({ Stock: 7, Precio: 'S/ 5.50' });
    expect(JSON.stringify(ia.resumir.mock.calls)).not.toContain(
      'password_hash',
    );
    expect(result.resumenIA).toBe('Resumen de prueba.');
  });

  it('no interpola SQL ni interpreta comodines en el nombre', async () => {
    await service.responder('Precio de "50%_ O\'Brien"', cajero);
    const [sql, params] = db.query.mock.calls[0];
    expect(sql).not.toContain("o'brien");
    expect(params).toContain('%50!%!_%');
    expect(params).toContain("%o'brien%");
  });

  it('pide precisar coincidencias y limita la lista sin enviarla a IA', async () => {
    db.query.mockResolvedValue(
      Array.from({ length: 21 }, (_, i) => ({
        nombre: `Leche ${i}`,
        sku: `LEC-${i}`,
        stock_actual: i,
        precio: 5,
      })),
    );
    const result = await service.responder('Stock de leche', cajero);
    expect(result.respuesta).toContain('varias coincidencias');
    expect(result.filas).toHaveLength(20);
    expect(result.aviso).toContain('primeros 20');
    expect(ia.resumir).not.toHaveBeenCalled();
  });

  it('informa ausencia de datos sin llamar al modelo', async () => {
    const result = await service.responder(
      'Precio de producto inexistente',
      cajero,
    );
    expect(result.respuesta).toContain('No se encontraron');
    expect(ia.resumir).not.toHaveBeenCalled();
  });

  it('filtra bajo stock en SQL y distingue agotados', async () => {
    db.query.mockResolvedValue([
      { nombre: 'Arroz', sku: 'ARR-001', stock_actual: 0, stock_minimo: 5 },
    ]);
    const result = await service.responder('Productos con bajo stock', admin);
    expect(db.query.mock.calls[0][0]).toContain('stock_actual <= stock_minimo');
    expect(result.filas?.[0].Estado).toBe('Agotado');
  });

  it('muestra contactos faltantes sin inventarlos', async () => {
    db.query.mockResolvedValue([
      {
        nombre: 'Acme',
        telefono_whatsapp: null,
        telefono_fijo: '',
        correo: null,
      },
    ]);
    const result = await service.responder(
      'Telefono del proveedor Acme',
      admin,
    );
    expect(result.filas?.[0].Telefono).toBe('No registrado');
  });

  it('no inventa una relacion producto-proveedor', async () => {
    const result = await service.responder(
      'Que proveedor abastece este producto',
      admin,
    );
    expect(result.respuesta).toContain('No hay una relacion');
    expect(db.query).not.toHaveBeenCalled();
  });

  it.each([
    'Ventas',
    'Ventas ayer',
    'Ventas de la semana pasada',
    'Ventas desde hoy hasta el mes pasado',
    'Ventas del 20/09/2026',
  ])('pide un periodo compatible: %s', async (consulta) => {
    const result = await service.responder(consulta, admin);
    expect(result.respuesta).toContain('Elige un solo periodo');
    expect(db.query).not.toHaveBeenCalled();
  });

  it.each([
    ['hoy', '2026-09-27T05:00:00Z'],
    ['esta semana', '2026-09-21T05:00:00Z'],
    ['este mes', '2026-09-01T05:00:00Z'],
  ])(
    'calcula %s segun Lima incluso si UTC ya cambio de dia',
    async (periodo, inicio) => {
      jest.useFakeTimers().setSystemTime(new Date('2026-09-28T02:00:00Z'));
      db.query.mockResolvedValue([{ total: '125.70', operaciones: 4 }]);
      const result = await service.responder(
        `Cuanto vendimos ${periodo}`,
        admin,
      );
      expect(db.query.mock.calls[0][1]).toEqual([
        Date.parse(inicio) / 1000,
        Date.parse('2026-09-28T02:00:00Z') / 1000,
      ]);
      expect(db.query.mock.calls[0][0]).toContain(
        "estado_emision <> 'ANULADO'",
      );
      expect(db.query.mock.calls[0][0]).toContain("moneda = 'PEN'");
      expect(result.filas?.[0]).toEqual({
        'Total vendido': 'S/ 125.70',
        Operaciones: 4,
      });
      expect(result.periodo).toContain('27/09/2026');
    },
  );

  it('calcula ranking por unidades con el mismo filtro temporal', async () => {
    db.query.mockResolvedValue([
      { sku: 'ARR-001', nombre: 'Arroz', unidades: '24' },
    ]);
    const result = await service.responder(
      'Productos mas vendidos esta semana',
      admin,
    );
    expect(db.query.mock.calls[0][0]).toContain('SUM(dv.cantidad)');
    expect(db.query.mock.calls[0][0]).toContain('LIMIT 5');
    expect(result.filas?.[0].Unidades).toBe(24);
  });

  it.each(['semana', 'mes'])(
    'acepta ingresos totales de la %s',
    async (periodo) => {
      db.query.mockResolvedValue([{ total: '1250.70', operaciones: 12 }]);
      const result = await service.responder(
        `Cuanto es el total de ingresos en la ${periodo}`,
        admin,
      );
      expect(result.filas?.[0]).toEqual({
        'Total vendido': 'S/ 1250.70',
        Operaciones: 12,
      });
      expect(db.query).toHaveBeenCalledTimes(1);
    },
  );

  it('responde la pregunta combinada exacta del usuario con total global y un producto', async () => {
    db.query
      .mockResolvedValueOnce([{ total: '650.50', operaciones: 8 }])
      .mockResolvedValueOnce([
        { sku: 'ARR-001', nombre: 'Arroz', unidades: '14' },
      ]);
    const result = await service.responder(
      'Cuanto es el total de ingresos y el producto más vendido en la semana',
      admin,
    );
    expect(result.resumenVentas).toEqual({
      'Total vendido': 'S/ 650.50',
      Operaciones: 8,
    });
    expect(result.filas?.[0]).toMatchObject({
      Producto: 'Arroz',
      Unidades: 14,
    });
    expect(db.query.mock.calls[1][0]).toContain('LIMIT 1');
    expect(db.query.mock.calls[1][1]).toEqual(db.query.mock.calls[0][1]);
    expect(ia.resumir).toHaveBeenCalledTimes(1);
    expect(ia.resumir.mock.calls[0][0].resumenVentas).toEqual(
      result.resumenVentas,
    );
  });

  it('conserva ingresos cero cuando no existen productos vendidos', async () => {
    db.query
      .mockResolvedValueOnce([{ total: '0', operaciones: 0 }])
      .mockResolvedValueOnce([]);
    const result = await service.responder(
      'Total de ingresos y producto mas vendido este mes',
      admin,
    );
    expect(result.resumenVentas?.['Total vendido']).toBe('S/ 0.00');
    expect(result.filas).toEqual([]);
    expect(result.respuesta).toContain('No hay productos con ventas');
  });

  it('lista menos vendidos incluyendo productos activos sin ventas', async () => {
    db.query.mockResolvedValue([
      { sku: 'ARR-001', nombre: 'Arroz', unidades: '0' },
      { sku: 'LEC-001', nombre: 'Leche', unidades: '1' },
    ]);
    const result = await service.responder(
      'Dame el listado de productos menos vendidos en el mes',
      admin,
    );
    const [sql, params] = db.query.mock.calls[0];
    expect(sql).toContain('LEFT JOIN');
    expect(sql).toContain('COALESCE(s.unidades, 0)');
    expect(sql).toContain('p.fecha_borrado IS NULL');
    expect(sql).toContain("p.estado = 'disponible'");
    expect(sql).toContain('unidades ASC');
    expect(sql).toContain('LIMIT 5');
    expect(params).toHaveLength(3);
    expect(result.filas?.map((fila) => fila.Unidades)).toEqual([0, 1]);
    expect(result.respuesta).toContain('incluye cero ventas');
  });

  it('muestra el menos vendido en singular', async () => {
    await service.responder('Cual es el producto menos vendido hoy', admin);
    expect(db.query.mock.calls[0][0]).toContain('LIMIT 1');
  });

  it('combina ingresos y ambos rankings sin mezclar sus columnas', async () => {
    db.query
      .mockResolvedValueOnce([{ total: '40.00', operaciones: 2 }])
      .mockResolvedValueOnce([{ nombre: 'Leche', sku: 'LEC-001', unidades: 8 }])
      .mockResolvedValueOnce([
        { nombre: 'Arroz', sku: 'ARR-001', unidades: 0 },
      ]);
    const result = await service.responder(
      'Total de ingresos y listado de productos mas vendidos y menos vendidos hoy',
      admin,
    );
    expect(result.resumenVentas?.['Total vendido']).toBe('S/ 40.00');
    expect(result.filas?.map((fila) => fila.Ranking)).toEqual([
      'Mas vendidos',
      'Menos vendidos',
    ]);
    expect(result.columnas).toEqual(['Ranking', 'Producto', 'SKU', 'Unidades']);
  });

  it('conserva los datos si no hay resumen IA', async () => {
    db.query.mockResolvedValue([
      { nombre: 'Arroz', sku: 'ARR-001', precio: 4, stock_actual: 10 },
    ]);
    ia.resumir.mockResolvedValue({ aviso: 'Limite de uso' });
    const result = await service.responder('Stock de arroz', cajero);
    expect(result.filas?.[0].Stock).toBe(10);
    expect(result.aviso).toBe('Limite de uso');
    expect(result.resumenIA).toBeUndefined();
  });

  it('da ayuda operativa sin acceder a la base de datos', async () => {
    const result = await service.responder('¿Como imprimir un ticket?', cajero);
    expect(result.fuente).toBe('Guia del sistema');
    expect(result.respuesta).toContain('no repitas el cobro');
    expect(db.query).not.toHaveBeenCalled();
  });

  it('oculta errores internos y libera la consulta despues de un fallo', async () => {
    db.query.mockRejectedValueOnce(new Error('SQL con datos privados'));
    await expect(
      service.responder('Stock de leche', cajero),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    await expect(
      service.responder('Stock de leche', cajero),
    ).resolves.toBeDefined();
  });

  it('acepta consultas sobre ventas registradas sin confundirlas con escrituras', async () => {
    db.query.mockResolvedValue([{ total: '10.00', operaciones: 1 }]);
    const result = await service.responder('Ventas registradas hoy', admin);
    expect(result.filas?.[0].Operaciones).toBe(1);
  });

  it.each([
    'Ventas de arroz hoy',
    'Ventas por cajero hoy',
    'Ventas con Yape esta semana',
  ])(
    'no devuelve totales globales cuando se pide un filtro no admitido: %s',
    async (consulta) => {
      const result = await service.responder(consulta, admin);
      expect(result.respuesta).toContain('filtros');
      expect(db.query).not.toHaveBeenCalled();
    },
  );

  it('evita consultas simultaneas del mismo perfil', async () => {
    let resolve!: (rows: unknown[]) => void;
    db.query.mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    const pending = service.responder('Stock de leche', cajero);
    await expect(
      service.responder('Stock de arroz', cajero),
    ).rejects.toMatchObject({ status: 429 });
    resolve([]);
    await pending;
  });
});
