import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import * as ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit'; // <-- CORREGIDO

@Injectable()
export class ReportesService {
  private readonly logger = new Logger(ReportesService.name);

  constructor(private readonly db: DatabaseService) {}

  // ==================================================================
  // 1. OBTENER HISTORIAL DE VENTAS
  // ==================================================================
  async getHistorial() {
    try {
      const query = `
        SELECT v.id, v.numero_comprobante, v.fecha_creacion, v.nombre_cliente, 
               v.documento_cliente, v.tipo_comprobante, v.total, 
               u.nombres AS cajero, mp.nombre AS medio_pago
        FROM ventas v
        INNER JOIN usuarios u ON v.id_usuario = u.id
        INNER JOIN medios_pago mp ON v.id_medio_pago = mp.id
        ORDER BY v.fecha_creacion DESC
      `;
      return await this.db.query(query, []);
    } catch (error) {
      this.logger.error('Error al obtener historial', error);
      throw new InternalServerErrorException(
        'Error al obtener el historial de ventas',
      );
    }
  }

  // ==================================================================
  // 2. OBTENER KPIs DEL DASHBOARD
  // ==================================================================
  async getDashboard() {
    try {
      const [
        [ventasTiempo],
        topProductos,
        [horaPico],
        [topCategoria],
        ventasTrabajador,
        topClientes,
        ventasMetodo,
      ] = await Promise.all([
        // 1. Total de ventas (Hoy, Semana, Mes)
        this.db.query(`
          SELECT 
            COALESCE(SUM(CASE WHEN DATE(fecha_creacion) = CURDATE() THEN total ELSE 0 END), 0) AS ventas_hoy,
            COALESCE(SUM(CASE WHEN YEARWEEK(fecha_creacion, 1) = YEARWEEK(CURDATE(), 1) THEN total ELSE 0 END), 0) AS ventas_semana,
            COALESCE(SUM(CASE WHEN MONTH(fecha_creacion) = MONTH(CURDATE()) AND YEAR(fecha_creacion) = YEAR(CURDATE()) THEN total ELSE 0 END), 0) AS ventas_mes
          FROM ventas
        `),

        // 2. Ranking de Todos los Productos (Quitamos WHERE p.activo para evitar el error 500)
        this.db.query(`
          SELECT 
            p.nombre AS nombre_producto, 
            p.sku,
            COALESCE(SUM(dv.cantidad), 0) AS cantidad_total, 
            COALESCE(SUM(dv.subtotal), 0) AS ingresos
          FROM productos p
          LEFT JOIN detalle_ventas dv ON p.id = dv.id_producto
          GROUP BY p.id, p.nombre, p.sku
          ORDER BY cantidad_total DESC
        `),

        // 3. Hora pico de ventas
        this.db.query(`
          SELECT HOUR(fecha_creacion) AS hora, COUNT(*) AS total_ventas
          FROM ventas 
          GROUP BY HOUR(fecha_creacion) 
          ORDER BY total_ventas DESC LIMIT 1
        `),
        // 4. Categoría más vendida
        this.db.query(`
          SELECT c.nombre AS categoria, SUM(dv.cantidad) AS cantidad_vendida
          FROM detalle_ventas dv
          JOIN productos p ON dv.id_producto = p.id
          JOIN categorias c ON p.id_categoria = c.id
          GROUP BY c.id ORDER BY cantidad_vendida DESC LIMIT 1
        `),
        // 5. Total de ventas por trabajadores
        this.db.query(`
          SELECT u.nombres, u.apellidos, SUM(v.total) AS total_recaudado, COUNT(v.id) AS cantidad_ventas
          FROM ventas v JOIN usuarios u ON v.id_usuario = u.id
          GROUP BY u.id ORDER BY total_recaudado DESC
        `),
        // 6. Cliente que más compra
        this.db.query(`
          SELECT documento_cliente, nombre_cliente, SUM(total) AS total_comprado, COUNT(id) AS cantidad_compras
          FROM ventas 
          WHERE documento_cliente IS NOT NULL AND tipo_doc_cliente != 'SIN_DOC'
          GROUP BY documento_cliente, nombre_cliente 
          ORDER BY total_comprado DESC LIMIT 5
        `),
        // 7. Ventas por método de pago
        this.db.query(`
          SELECT mp.nombre AS metodo, SUM(v.total) AS total_recaudado, COUNT(v.id) AS cantidad_ventas
          FROM ventas v JOIN medios_pago mp ON v.id_medio_pago = mp.id
          GROUP BY mp.id ORDER BY total_recaudado DESC
        `),
      ]);

      return {
        ventas_tiempo: ventasTiempo,
        top_productos: topProductos,
        hora_pico: horaPico,
        top_categoria: topCategoria,
        ventas_trabajador: ventasTrabajador,
        top_clientes: topClientes,
        ventas_metodo: ventasMetodo,
      };
    } catch (error) {
      this.logger.error('Error al generar Dashboard', error);
      throw new InternalServerErrorException(
        'Error al generar métricas del Dashboard',
      );
    }
  }

  // ==================================================================
  // 3. EXPORTAR HISTORIAL (EXCEL SIMPLE)
  // ==================================================================
  async exportHistorialExcel(): Promise<Buffer> {
    const ventas = await this.getHistorial();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Historial');

    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Comprobante', key: 'numero_comprobante', width: 20 },
      { header: 'Fecha', key: 'fecha_creacion', width: 25 },
      { header: 'Cliente', key: 'nombre_cliente', width: 35 },
      { header: 'Documento', key: 'documento_cliente', width: 15 },
      { header: 'Total (S/)', key: 'total', width: 15 },
      { header: 'Cajero', key: 'cajero', width: 20 },
      { header: 'Medio de Pago', key: 'medio_pago', width: 20 },
    ];

    worksheet.addRows(ventas);
    return (await workbook.xlsx.writeBuffer()) as unknown as Buffer;
  }

  // ==================================================================
  // 4. EXPORTAR DASHBOARD (PDF CON DISEÑO)
  // ==================================================================
  async exportDashboardPdf(): Promise<Buffer> {
    const data = await this.getDashboard();

    return new Promise((resolve) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Cabecera Elegante
      doc.rect(0, 0, 600, 100).fill('#1e3a8a');
      doc
        .fillColor('#ffffff')
        .fontSize(24)
        .text('REPORTE GERENCIAL DE VENTAS', 50, 40, { align: 'center' });

      doc
        .fillColor('#333333')
        .fontSize(10)
        .text(
          `Fecha de emisión: ${new Date().toLocaleDateString('es-PE')}`,
          50,
          120,
          { align: 'right' },
        );

      doc
        .fontSize(16)
        .fillColor('#1e3a8a')
        .text('1. Resumen Financiero', 50, 150);
      doc.moveTo(50, 170).lineTo(550, 170).strokeColor('#e5e7eb').stroke();

      doc.fontSize(12).fillColor('#000000');
      doc.text(`Ventas de Hoy: S/ ${data.ventas_tiempo.ventas_hoy}`, 50, 190);
      doc.text(
        `Ventas esta Semana: S/ ${data.ventas_tiempo.ventas_semana}`,
        50,
        210,
      );
      doc.text(`Ventas este Mes: S/ ${data.ventas_tiempo.ventas_mes}`, 50, 230);

      doc.fontSize(16).fillColor('#1e3a8a').text('2. Insights Clave', 50, 270);
      doc.moveTo(50, 290).lineTo(550, 290).strokeColor('#e5e7eb').stroke();

      doc.fontSize(12).fillColor('#000000');
      doc.text(
        `Hora Pico de Ventas: ${data.hora_pico?.hora || 0}:00 Hrs`,
        50,
        310,
      );
      doc.text(
        `Categoría Estrella: ${data.top_categoria?.categoria || 'N/A'}`,
        50,
        330,
      );

      doc
        .fontSize(16)
        .fillColor('#1e3a8a')
        .text('3. Top 5 Productos Más Vendidos', 50, 370);
      doc.moveTo(50, 390).lineTo(550, 390).strokeColor('#e5e7eb').stroke();

      let yProd = 410;
      doc.fontSize(10).fillColor('#555555');

      // <-- CORRECCIÓN: .slice(0,5) para que no deforme el PDF con listas gigantes
      data.top_productos.slice(0, 5).forEach((p, i) => {
        doc.text(
          `${i + 1}. ${p.nombre_producto} - ${p.cantidad_total} unidades (S/ ${p.ingresos})`,
          50,
          yProd,
        );
        yProd += 20;
      });

      doc
        .fontSize(16)
        .fillColor('#1e3a8a')
        .text('4. Rendimiento por Trabajador', 50, yProd + 20);
      doc
        .moveTo(50, yProd + 40)
        .lineTo(550, yProd + 40)
        .strokeColor('#e5e7eb')
        .stroke();

      let yTrab = yProd + 60;
      doc.fontSize(10).fillColor('#555555');
      data.ventas_trabajador.forEach((t) => {
        doc.text(
          `${t.nombres} ${t.apellidos}: S/ ${t.total_recaudado} (${t.cantidad_ventas} ventas)`,
          50,
          yTrab,
        );
        yTrab += 20;
      });

      doc
        .fontSize(8)
        .fillColor('#9ca3af')
        .text(
          'Documento generado automáticamente por el Sistema POS',
          50,
          780,
          { align: 'center' },
        );

      doc.end();
    });
  }
}
