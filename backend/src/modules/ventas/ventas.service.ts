import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateVentaDto, TipoComprobante } from './dto/create-venta.dto';
import { SunatService } from '../sunat/sunat.service';
import { DatabaseService } from '../database/database.service';

// ─── Tipos internos ───────────────────────────────────────────────────────────

interface ProductoRow {
  id: number;
  sku: string;
  nombre: string;
  precio: number;
  stock_actual: number;
}

export interface ClienteInfo {
  nombre: string;
  documento: string;
  direccion?: string;
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const API_BASE = 'https://api.decolecta.com/v1';

@Injectable()
export class VentasService {
  private readonly logger = new Logger(VentasService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly configService: ConfigService,
    private readonly sunatService: SunatService,
  ) {}

  // ═══════════════════════════════════════════════════════════════════════════
  // CREAR VENTA
  // ═══════════════════════════════════════════════════════════════════════════

  async crearVenta(dto: CreateVentaDto, idUsuario: number) {
    const conn = await this.db.getConnection();

    try {
      await conn.beginTransaction();

      // ── 1. Bloquear filas de productos y validar stock ─────────────────────
      const ids = dto.detalles.map((d) => d.id_producto);

      const [productosResult] = await conn.query(
        `SELECT id, sku, nombre, precio, stock_actual
         FROM productos
         WHERE id IN (?)
         FOR UPDATE`,
        [ids],
      );
      const productos = productosResult as any as ProductoRow[];

      if (productos.length !== ids.length) {
        const encontrados = new Set(productos.map((p) => p.id));
        const faltantes = ids.filter((id) => !encontrados.has(id));
        throw new NotFoundException(
          `Los siguientes productos no existen en la base de datos: [${faltantes.join(', ')}]`,
        );
      }

      const productoMap = new Map(productos.map((p) => [p.id, p]));

      for (const detalle of dto.detalles) {
        const prod = productoMap.get(detalle.id_producto)!;
        if (prod.stock_actual < detalle.cantidad) {
          throw new BadRequestException(
            `Stock insuficiente para "${prod.nombre}". ` +
              `Disponible: ${prod.stock_actual}, solicitado: ${detalle.cantidad}.`,
          );
        }
      }

      // ── 2. Calcular montos ─────────────────────────────────────────────────
      let totalVenta = 0;

      const detallesCalculados = dto.detalles.map((detalle) => {
        const prod = productoMap.get(detalle.id_producto)!;
        const precioNetoFinal = detalle.precio_unitario - detalle.descuento;
        const subtotalFilaFinal = parseFloat(
          (precioNetoFinal * detalle.cantidad).toFixed(2),
        );

        totalVenta += subtotalFilaFinal;

        return {
          id_producto: detalle.id_producto,
          sku_producto: prod.sku,
          nombre_producto: prod.nombre,
          cantidad: detalle.cantidad,
          precio_unitario: detalle.precio_unitario,
          descuento: detalle.descuento,
          subtotal: subtotalFilaFinal,
        };
      });

      const esFacturable =
        dto.tipo_comprobante === TipoComprobante.FACTURA ||
        dto.tipo_comprobante === TipoComprobante.BOLETA;

      const total = parseFloat(totalVenta.toFixed(2));

      const baseImponible = esFacturable
        ? parseFloat((total / 1.18).toFixed(2))
        : total;

      const igv = esFacturable
        ? parseFloat((total - baseImponible).toFixed(2))
        : 0;

      // ── 3. Insertar cabecera de venta ──────────────────────────────────────
      const [resultVenta]: [any, any] = await conn.query(
        `INSERT INTO ventas
           (id_usuario, id_medio_pago, tipo_comprobante,
            tipo_doc_cliente, documento_cliente, nombre_cliente, direccion_cliente,
            moneda, subtotal, igv, total, estado_emision, fecha_emision)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'PEN', ?, ?, ?, 'BORRADOR', CURDATE())`,
        [
          idUsuario,
          dto.id_medio_pago,
          dto.tipo_comprobante,
          dto.tipo_doc_cliente,
          dto.documento_cliente ?? null,
          dto.nombre_cliente ?? 'Público General',
          dto.direccion_cliente ?? null,
          baseImponible,
          igv,
          total,
        ],
      );

      const idVenta: number = resultVenta.insertId;

      // ── 4. Insertar detalles ───────────────────────────────────────────────
      for (const det of detallesCalculados) {
        await conn.query(
          `INSERT INTO detalle_ventas
             (id_venta, id_producto, sku_producto, nombre_producto,
              cantidad, precio_unitario, descuento, subtotal)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            idVenta,
            det.id_producto,
            det.sku_producto,
            det.nombre_producto,
            det.cantidad,
            det.precio_unitario,
            det.descuento,
            det.subtotal,
          ],
        );
      }

      // ── 5. Descontar stock ─────────────────────────────────────────────────
      for (const det of detallesCalculados) {
        await conn.query(
          `UPDATE productos SET stock_actual = stock_actual - ? WHERE id = ?`,
          [det.cantidad, det.id_producto],
        );
      }

      await conn.commit();

      this.logger.log(
        `Venta #${idVenta} creada por usuario #${idUsuario}. Total: S/ ${total}`,
      );

      // ── 6. Armar objeto de respuesta ───────────────────────────────────────
      const respuestaVenta = {
        id_venta: idVenta,
        tipo_comprobante: dto.tipo_comprobante,
        subtotal: baseImponible,
        igv,
        total,
        estado: 'BORRADOR',
        detalles: detallesCalculados,
        documento_cliente: dto.documento_cliente,
        nombre_cliente: dto.nombre_cliente ?? 'Público General',
        tipo_doc_cliente: dto.tipo_doc_cliente,
      };

      // ── 7. Generar, firmar y enviar a SUNAT (solo para comprobantes electrónicos)
      if (esFacturable) {
        // Ejecutamos en segundo plano para no bloquear la respuesta al frontend.
        // Si la comunicación con SUNAT falla, la venta ya está guardada en BD
        // y puede reintentarse. El estado en BD queda como 'BORRADOR' hasta
        // que se actualice con la respuesta del CDR.
        this.procesarEnvioSunat(respuestaVenta, conn).catch((err) =>
          this.logger.error('Error en proceso asíncrono SUNAT:', err),
        );
      }

      return respuestaVenta;
    } catch (error) {
      await conn.rollback();

      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      this.logger.error('Error al crear venta, se ejecutó ROLLBACK.', error);
      throw new InternalServerErrorException(
        'Ocurrió un error interno al procesar la venta.',
      );
    } finally {
      conn.release();
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PROCESO SUNAT (ejecutado en background, no bloquea la respuesta HTTP)
  // ═══════════════════════════════════════════════════════════════════════════

  private async procesarEnvioSunat(respuestaVenta: any, conn: any) {
    try {
      // Necesitamos una nueva conexión aquí porque la conexión del request
      // ya fue liberada en el bloque finally del método crearVenta.
      const connSunat = await this.db.getConnection();

      try {
        const [empresaRows]: any = await connSunat.query(
          'SELECT * FROM detalle_empresa LIMIT 1',
        );
        const empresa = empresaRows[0];

        if (!empresa) {
          this.logger.warn(
            'No se encontró información de la empresa. No se puede generar el XML.',
          );
          return;
        }

        // A. Generar XML crudo
        const xmlCrudo = this.sunatService.generarXMLComprobante(
          respuestaVenta,
          empresa,
        );

        // B. Firmar el XML
        const xmlFirmado = this.sunatService.firmarXML(xmlCrudo);

        // C. Construir identificadores para el nombre del archivo
        const isFactura = respuestaVenta.tipo_comprobante === 'FACTURA';
        const tipoDocCode = isFactura ? '01' : '03';
        const serie = isFactura ? 'F001' : 'B001';
        const numero = respuestaVenta.id_venta.toString().padStart(8, '0');
        const idComprobante = `${serie}-${numero}`;

        // Auditoría: imprimimos el XML firmado antes de enviarlo
        console.log('\n========== XML FIRMADO PARA AUDITORÍA ==========');
        console.log(xmlFirmado);
        console.log('=================================================\n');

        // D. Enviar a SUNAT BETA y obtener el estado del CDR
        const cdrStatus = await this.sunatService.enviarASunatBETA(
          xmlFirmado,
          empresa.ruc,
          idComprobante,
          tipoDocCode,
        );

        // E. Actualizar el estado de emisión en la BD según la respuesta del CDR
        //    CDR aceptado: cdrStatus comienza con "La Factura/Boleta numero..."
        //    CDR rechazado: contiene un código de error de 4 dígitos
        if (cdrStatus) {
          const fueAceptado =
            cdrStatus.toLowerCase().includes('aceptad') ||
            cdrStatus.startsWith('0') === false; // ResponseCode "0" = aceptado

          const nuevoEstado = fueAceptado ? 'ACEPTADO' : 'RECHAZADO';

          await connSunat.query(
            `UPDATE ventas SET estado_emision = ?, cdr_respuesta = ? WHERE id = ?`,
            [nuevoEstado, cdrStatus, respuestaVenta.id_venta],
          );

          this.logger.log(
            `Venta #${respuestaVenta.id_venta} → Estado SUNAT: ${nuevoEstado}`,
          );
        }
      } finally {
        connSunat.release();
      }
    } catch (error) {
      this.logger.error(
        `Error en procesarEnvioSunat para venta #${respuestaVenta.id_venta}`,
        error,
      );
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BUSCAR CLIENTE POR DNI / RUC
  // ═══════════════════════════════════════════════════════════════════════════

  async buscarCliente(
    tipo: 'DNI' | 'RUC',
    documento: string,
  ): Promise<ClienteInfo> {
    const apiToken = this.configService.get<string>('APIS_NET_TOKEN');

    if (!apiToken) {
      this.logger.error('Falta configurar el Token de Decolecta en el .env');
      throw new InternalServerErrorException(
        'Error de configuración en el servidor de facturación.',
      );
    }

    if (tipo === 'DNI' && !/^\d{8}$/.test(documento)) {
      throw new BadRequestException(
        'El DNI debe tener exactamente 8 dígitos numéricos.',
      );
    }
    if (tipo === 'RUC' && !/^\d{11}$/.test(documento)) {
      throw new BadRequestException(
        'El RUC debe tener exactamente 11 dígitos numéricos.',
      );
    }

    const endpoint =
      tipo === 'DNI'
        ? `${API_BASE}/reniec/dni?numero=${documento}`
        : `${API_BASE}/sunat/ruc?numero=${documento}`;

    try {
      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 404 || response.status === 422) {
        throw new NotFoundException(
          `No se encontró ningún registro para el ${tipo}: ${documento}.`,
        );
      }

      if (!response.ok) {
        throw new InternalServerErrorException(
          `Error al consultar la API de ${tipo}. Código HTTP: ${response.status}.`,
        );
      }

      const data = await response.json();

      if (tipo === 'DNI') {
        return {
          nombre:
            data.full_name ??
            `${data.first_name ?? ''} ${data.first_last_name ?? ''} ${data.second_last_name ?? ''}`.trim(),
          documento: data.document_number ?? documento,
        };
      } else {
        return {
          nombre: data.razon_social ?? '',
          documento: data.numero_documento ?? documento,
          direccion: data.direccion ?? undefined,
        };
      }
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      this.logger.error(
        `Error de red al consultar ${tipo} ${documento}`,
        error,
      );
      throw new InternalServerErrorException(
        'No se pudo conectar con el servicio de consulta de clientes.',
      );
    }
  }

  // ── OBTENER SIGUIENTE TICKET ─────────────────────────────────────────────
  async obtenerSiguienteTicket(): Promise<number> {
    try {
      const [rows]: any = await this.db.query(
        'SELECT id FROM ventas ORDER BY id DESC LIMIT 1',
      );

      // CASO 1: Es un Array estándar
      if (Array.isArray(rows) && rows.length > 0) {
        return Number(rows[0].id) + 1;
      }

      // CASO 2: El driver devolvió el objeto directamente (Tu caso actual)
      if (rows && !Array.isArray(rows) && rows.id) {
        return Number(rows.id) + 1;
      }

      // Si la tabla está vacía (primera venta del sistema)
      return 1;
    } catch (error) {
      this.logger.error('Error crítico en SQL al obtener ticket:', error);
      return 1;
    }
  }
}
