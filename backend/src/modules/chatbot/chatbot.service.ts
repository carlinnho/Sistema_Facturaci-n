import {
  ForbiddenException,
  HttpException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { OpenRouterService } from './openrouter.service';
import { AYUDA_CHATBOT, CHATBOT_PROMPT_VERSION } from './chatbot.prompts';

type Fila = Record<string, string | number | null>;
export interface ChatbotRespuesta {
  respuesta: string;
  fuente: string;
  consultadoEn: string;
  periodo?: string;
  columnas?: string[];
  filas?: Fila[];
  aviso?: string;
  resumenIA?: string;
  resumenVentas?: Fila;
}

const normalizar = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
const dinero = (value: unknown) => `S/ ${Number(value).toFixed(2)}`;
const LIMITE = 20;
const PRIVADO =
  /\b(ventas|vendimos|vendido[s]?|vendio|vendieron|recaudado|recaudamos|recaudacion|ingresos|reporte[s]?|proveedor\w*|agotado[s]?|reponer|reposicion|critico[s]?|bajo[s]?)\b/;
const VENTAS =
  /\b(ventas|vendimos|vendido[s]?|vendio|vendieron|recaudado|recaudamos|recaudacion|ingresos|reporte[s]?)\b/;

@Injectable()
export class ChatbotService {
  private readonly pendientes = new Set<number>();

  constructor(
    private readonly db: DatabaseService,
    private readonly openrouter: OpenRouterService,
  ) {}

  async responder(
    mensaje: string,
    user: { id: number; rol: number },
  ): Promise<ChatbotRespuesta> {
    if (![1, 2].includes(user.rol))
      throw new ForbiddenException('Selecciona un perfil autorizado.');
    if (this.pendientes.has(user.id))
      throw new HttpException(
        'Espera a que termine tu consulta anterior.',
        429,
      );
    this.pendientes.add(user.id);
    try {
      return await this.consultar(mensaje.trim(), user.rol);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new ServiceUnavailableException(
        'No fue posible consultar la base de datos. Intenta nuevamente.',
      );
    } finally {
      this.pendientes.delete(user.id);
    }
  }

  private local(respuesta: string, fuente = 'Asistente POS'): ChatbotRespuesta {
    return { respuesta, fuente, consultadoEn: new Date().toISOString() };
  }

  private async consultar(
    mensaje: string,
    rol: number,
  ): Promise<ChatbotRespuesta> {
    const text = normalizar(mensaje);
    const ayuda = /^(?:por favor\s+)?(?:como|donde|ayuda|explica\w*)\b/.test(
      text.replace(/^[¿¡]+/, ''),
    );
    if (
      /\b(anade|anadir|anademe|agrega|agregar|agregame|crea|crear|creame|registra|registrar|registrame|elimina|eliminar|borra|borrar|modifica|modificar|actualiza|actualizar|cambia|cambiar|compra|comprar|envia|enviar|importa|importar|aumenta|aumentar|descuenta|descontar|quita|quitar|insert|update|delete|drop|alter)\b/.test(
        text,
      ) &&
      !ayuda
    ) {
      return this.local(
        'Este chatbot solo consulta informacion. No registra ventas ni modifica productos, precios o stock.',
      );
    }
    if (rol !== 1 && PRIVADO.test(text)) {
      throw new ForbiddenException(
        'Las consultas de ventas, proveedores y alertas de inventario requieren un perfil administrador.',
      );
    }
    if (ayuda) {
      if (/\b(ticket|impres\w*|imprimir|comprobante|papel)\b/.test(text))
        return this.local(AYUDA_CHATBOT.ticket, 'Guia del sistema');
      if (/\b(perfil\w*)\b/.test(text))
        return this.local(AYUDA_CHATBOT.perfil, 'Guia del sistema');
      if (/\b(proveedor\w*)\b/.test(text))
        return this.local(AYUDA_CHATBOT.proveedores, 'Guia del sistema');
      if (/\b(inventario)\b/.test(text) && rol === 1)
        return this.local(AYUDA_CHATBOT.inventario, 'Guia del sistema');
      if (VENTAS.test(text) && rol === 1)
        return this.local(AYUDA_CHATBOT.ventas, 'Guia del sistema');
      return this.local(AYUDA_CHATBOT.productos, 'Guia del sistema');
    }
    if (
      /\b(margen\w*|ganancia\w*|costo\w*|ubicacion|gondola|pasillo|predic\w*|pronostic\w*)\b/.test(
        text,
      )
    ) {
      return this.local(
        'Por ahora puedo consultar precios, stock y, para administradores, ventas y contactos de proveedores. Esta consulta no esta incluida en la primera fase.',
      );
    }
    if (/\b(proveedor\w*)\b/.test(text)) {
      if (
        /\b(producto|abastece|asociado|relacionado|suministra|marca)\b/.test(
          text,
        )
      ) {
        return this.local(
          'No hay una relacion producto-proveedor registrada. Puedes buscar un proveedor por su nombre para consultar sus datos de contacto.',
        );
      }
      const term = this.termino(text, true);
      if (!term)
        return this.local(
          'Indica el nombre del proveedor. Por ejemplo: "Telefono del proveedor Acme".',
        );
      const rows = await this.db.query<Fila>(
        `SELECT nombre, telefono_whatsapp, telefono_fijo, correo FROM proveedores
         WHERE activo = 1 AND nombre LIKE ? ESCAPE '!' ORDER BY nombre, id LIMIT 21`,
        [this.patron(term)],
      );
      return this.resultados(
        rows.map((r) => ({
          Proveedor: r.nombre,
          WhatsApp: r.telefono_whatsapp || 'No registrado',
          Telefono: r.telefono_fijo || 'No registrado',
          Correo: r.correo || 'No registrado',
        })),
        'Proveedores',
        'Contactos registrados',
      );
    }
    if (VENTAS.test(text)) return this.ventas(text);
    if (
      /\b(agotado[s]?|reponer|reposicion|critico[s]?)\b|\b(stock|existencias|inventario)\s+(bajo[s]?|minimo)|\bbajo[s]?\s+(stock|inventario)\b/.test(
        text,
      )
    ) {
      // Toda ruta de datos administrativos valida el rol antes de consultar.
      if (rol !== 1)
        throw new ForbiddenException(
          'Las alertas de inventario requieren un perfil administrador.',
        );
      const agotados = /\bagotado[s]?\b/.test(text);
      const rows = await this.db.query<Fila>(
        `SELECT nombre, sku, stock_actual, stock_minimo FROM productos
         WHERE fecha_borrado IS NULL AND estado = 'disponible'
         AND ${agotados ? 'stock_actual <= 0' : 'stock_actual <= stock_minimo'}
         ORDER BY stock_actual, nombre, id LIMIT 21`,
      );
      return this.resultados(
        rows.map((r) => ({
          Producto: r.nombre,
          SKU: r.sku,
          Stock: r.stock_actual,
          Minimo: r.stock_minimo,
          Estado: Number(r.stock_actual) <= 0 ? 'Agotado' : 'Bajo stock',
        })),
        'Inventario',
        agotados
          ? 'Productos agotados'
          : 'Productos con stock igual o inferior al minimo',
      );
    }
    if (
      /\b(precio[s]?|cuesta[n]?|vale|stock|disponib\w*|quedan?|tenemos|tienen|hay|producto[s]?|existencias|cantidad|buscar|busca)\b/.test(
        text,
      )
    ) {
      const term = this.termino(text);
      if (!term)
        return this.local(
          'Indica el nombre, SKU o codigo de barras del producto. Por ejemplo: "Stock de leche".',
        );
      const tokens = term.split(/\s+/).slice(0, 8);
      const conditions = tokens
        .map(() => "nombre LIKE ? ESCAPE '!'")
        .join(' AND ');
      const rows = await this.db.query<Fila>(
        `SELECT nombre, sku, precio, stock_actual FROM productos
         WHERE fecha_borrado IS NULL AND estado = 'disponible'
         AND (sku = ? OR codigo_barras = ? OR (${conditions}))
         ORDER BY (sku = ? OR codigo_barras = ? OR nombre = ?) DESC, nombre, id LIMIT 21`,
        [term, term, ...tokens.map((t) => this.patron(t)), term, term, term],
      );
      const mapped = rows.map((r) => ({
        Producto: r.nombre,
        SKU: r.sku,
        Precio: dinero(r.precio),
        Stock: r.stock_actual,
        Disponibilidad: Number(r.stock_actual) > 0 ? 'Disponible' : 'Agotado',
      }));
      if (mapped.length > 1) {
        return this.tabla(
          mapped,
          'Productos',
          'Encontre varias coincidencias. Indica el SKU o el nombre completo del producto que buscas.',
        );
      }
      return this.resultados(
        mapped,
        'Productos',
        'Precio y stock del producto',
      );
    }
    return this.local(
      'Puedes preguntar por el precio o stock de un producto y por el uso del sistema. Los administradores tambien pueden consultar ventas de hoy, esta semana o este mes, productos con bajo stock y contactos de proveedores.',
    );
  }

  private termino(text: string, proveedor = false): string {
    const quoted = text.match(/["“]([^"”]+)["”]/);
    if (quoted) return quoted[1].trim();
    const stopwords = new Set(
      (
        'hola buenos dias buenas tardes noches por favor me puedes podria podrias decir dime muestra mostrar consultar consulta saber quiero necesito cual cuales cuanto cuanta cuantos cuantas es son el la los las un una unos unas de del en al a y que tiene tienen tenemos hay queda quedan disponible disponibles disponibilidad unidades producto productos precio precios stock cuesta cuestan vale existencias cantidad buscar busca codigo barras sku actual actualmente hoy' +
        (proveedor
          ? ' proveedor proveedores telefono telefonos contacto contactos whatsapp correo datos informacion'
          : '')
      ).split(' '),
    );
    return text
      .replace(/[¿?¡!.,:;]/g, ' ')
      .split(/\s+/)
      .filter((word) => word && !stopwords.has(word))
      .join(' ')
      .slice(0, 150);
  }

  private patron(term: string): string {
    return `%${term.replace(/[!%_]/g, '!$&')}%`;
  }

  private tabla(
    filas: Fila[],
    fuente: string,
    respuesta: string,
    periodo?: string,
  ): ChatbotRespuesta {
    return {
      ...this.local(respuesta, fuente),
      periodo,
      columnas: filas.length ? Object.keys(filas[0]) : [],
      filas: filas.slice(0, LIMITE),
      ...(filas.length > LIMITE
        ? {
            aviso: `Se muestran los primeros ${LIMITE} resultados. Precisa tu consulta para reducir la lista.`,
          }
        : {}),
    };
  }

  private async resultados(
    filas: Fila[],
    fuente: string,
    titulo: string,
    periodo?: string,
    resumenVentas?: Fila,
  ): Promise<ChatbotRespuesta> {
    if (!filas.length && !resumenVentas)
      return {
        ...this.local(
          'No se encontraron resultados para esta consulta.',
          fuente,
        ),
        periodo,
      };
    const result = this.tabla(filas, fuente, titulo, periodo);
    if (resumenVentas) result.resumenVentas = resumenVentas;
    const redaccion = await this.openrouter.resumir({
      tarea: titulo,
      fuente,
      periodo,
      consultadoEn: result.consultadoEn,
      filas: result.filas,
      resumenVentas,
      listaParcial: filas.length > LIMITE,
      version: CHATBOT_PROMPT_VERSION,
    });
    return {
      ...result,
      resumenIA: redaccion.texto,
      aviso:
        [result.aviso, redaccion.aviso].filter(Boolean).join(' ') || undefined,
    };
  }

  private async ventas(text: string): Promise<ChatbotRespuesta> {
    // Periodos calendario de Lima; FROM_UNIXTIME respeta la zona de la sesion MySQL.
    const periodos = ['hoy', 'semana', 'mes'].filter((p) =>
      new RegExp(`\\b${p}\\b`).test(text),
    );
    if (
      periodos.length !== 1 ||
      /\b(ayer|pasad\w*|anterior\w*|ultim\w*|desde|hasta|entre|enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b|\d/.test(
        text,
      )
    ) {
      return this.local(
        'Elige un solo periodo: hoy, esta semana o este mes. Por ejemplo: "Cuanto vendimos hoy".',
      );
    }
    const permitidas = new Set(
      'hola buenos dias por favor puedes podrias me dame dime decir muestra muestrame mostrar ver consultar consulta quiero quisiera necesito saber cual cuales que cuanto cuanta cuantos cuantas fue fueron es son se ha han hemos el la los las lo de del en al a y hoy dia esta este semana mes actual acumulado resumen reporte reportes total totales vendido vendidos vendimos vendio vendieron ventas venta numero cantidad operaciones transacciones dinero recaudado recaudamos recaudacion ingresos productos producto mas menos top ranking unidades registradas registrado registrados realizadas lista listado un una tambien'.split(
        ' ',
      ),
    );
    const palabras = text
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(Boolean);
    if (palabras.some((palabra) => !permitidas.has(palabra))) {
      return this.local(
        'Puedo consultar ingresos totales, numero de operaciones y productos mas o menos vendidos de hoy, esta semana o este mes, juntos o por separado. Los filtros por producto, cliente, cajero o medio de pago aun no estan disponibles.',
      );
    }
    const now = new Date();
    const day = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Lima',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now);
    const start = new Date(`${day}T00:00:00-05:00`);
    if (periodos[0] === 'semana')
      start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7));
    if (periodos[0] === 'mes') start.setUTCDate(1);
    const format = new Intl.DateTimeFormat('es-PE', {
      timeZone: 'America/Lima',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const periodo = `${format.format(start)} al ${format.format(now)} (America/Lima, hasta la hora de consulta)`;
    const params = [
      Math.floor(start.getTime() / 1000),
      Math.floor(now.getTime() / 1000),
    ];
    const filter =
      "v.fecha_creacion >= FROM_UNIXTIME(?) AND v.fecha_creacion <= FROM_UNIXTIME(?) AND v.estado_emision <> 'ANULADO' AND v.moneda = 'PEN'";
    const menos = /\bmenos (?:se )?(?:vendidos?|vendio|vendieron)\b/.test(text);
    const mas =
      /\bmas (?:se )?(?:vendidos?|vendio|vendieron)\b/.test(text) ||
      (!menos && /\b(top|ranking)\b/.test(text));
    const resumen =
      (!mas && !menos) ||
      /\b(ingresos|recaudado|recaudamos|recaudacion|resumen|operaciones|transacciones)\b|\btotal(?:es)? (?:de )?(?:ventas|vendido)\b|\bcuanto (?:se )?(?:vendimos|vendio)\b/.test(
        text,
      );
    let resumenVentas: Fila | undefined;
    if (resumen) {
      const [row] = await this.db.query<Fila>(
        `SELECT COUNT(*) AS operaciones, COALESCE(SUM(v.total), 0) AS total FROM ventas v WHERE ${filter}`,
        params,
      );
      resumenVentas = {
        'Total vendido': dinero(row?.total ?? 0),
        Operaciones: Number(row?.operaciones ?? 0),
      };
    }
    if (!mas && !menos) {
      return this.resultados(
        [resumenVentas!],
        'Ventas en soles, sin anuladas',
        'Ingresos totales por ventas registradas',
        periodo,
      );
    }

    const filas: Fila[] = [];
    const titulos: string[] = [];
    if (mas) {
      const limite = /\bproducto mas vendido\b/.test(text) ? 1 : 5;
      const rows = await this.db.query<Fila>(
        `SELECT MAX(dv.sku_producto) AS sku, MAX(dv.nombre_producto) AS nombre, SUM(dv.cantidad) AS unidades
         FROM detalle_ventas dv JOIN ventas v ON v.id = dv.id_venta WHERE ${filter}
         GROUP BY dv.id_producto ORDER BY unidades DESC, sku, nombre LIMIT ${limite}`,
        params,
      );
      filas.push(
        ...rows.map((r) => ({
          ...(menos ? { Ranking: 'Mas vendidos' } : {}),
          Producto: r.nombre,
          SKU: r.sku,
          Unidades: Number(r.unidades),
        })),
      );
      titulos.push(
        rows.length
          ? limite === 1
            ? 'Producto mas vendido por unidades'
            : 'Hasta 5 productos mas vendidos por unidades'
          : 'No hay productos con ventas registradas en el periodo',
      );
    }
    if (menos) {
      const limite = /\bproducto menos vendido\b/.test(text) ? 1 : 5;
      // El periodo se filtra dentro del agregado para conservar productos sin ventas.
      const rows = await this.db.query<Fila>(
        `SELECT p.sku, p.nombre, COALESCE(s.unidades, 0) AS unidades
         FROM productos p
         LEFT JOIN (
           SELECT dv.id_producto, SUM(dv.cantidad) AS unidades
           FROM detalle_ventas dv JOIN ventas v ON v.id = dv.id_venta
           WHERE ${filter} GROUP BY dv.id_producto
         ) s ON s.id_producto = p.id
         WHERE p.fecha_borrado IS NULL AND p.estado = 'disponible'
           AND p.fecha_creacion <= FROM_UNIXTIME(?)
         ORDER BY unidades ASC, p.sku, p.nombre LIMIT ${limite}`,
        [...params, params[1]],
      );
      filas.push(
        ...rows.map((r) => ({
          ...(mas ? { Ranking: 'Menos vendidos' } : {}),
          Producto: r.nombre,
          SKU: r.sku,
          Unidades: Number(r.unidades),
        })),
      );
      titulos.push(
        rows.length
          ? `${limite === 1 ? 'Producto activo menos vendido' : 'Hasta 5 productos activos menos vendidos'} por unidades (incluye cero ventas)`
          : 'No hay productos activos para el ranking de menos vendidos',
      );
    }
    return this.resultados(
      filas,
      'Ventas en soles, sin anuladas',
      [
        ...(resumen ? ['Ingresos totales por ventas registradas'] : []),
        ...titulos,
      ].join('. '),
      periodo,
      resumenVentas,
    );
  }
}
