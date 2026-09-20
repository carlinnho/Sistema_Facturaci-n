import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

// ─── Enum mirrors ────────────────────────────────────────────────────────────

export enum TipoComprobante {
  SIMPLE = 'SIMPLE',
  BOLETA = 'BOLETA',
  FACTURA = 'FACTURA',
}

export enum TipoDocCliente {
  DNI = 'DNI',
  RUC = 'RUC',
  CE = 'CE',
  PASAPORTE = 'PASAPORTE',
  SIN_DOC = 'SIN_DOC',
}

// ─── Detalle (línea de producto) ─────────────────────────────────────────────

export class DetalleVentaDto {
  @IsInt({ message: 'id_producto debe ser un número entero.' })
  @IsPositive({ message: 'id_producto debe ser un número positivo.' })
  id_producto: number;

  @IsInt({ message: 'cantidad debe ser un número entero.' })
  @Min(1, { message: 'La cantidad mínima es 1.' })
  cantidad: number;

  /**
   * Precio real cobrado al cliente (puede diferir del precio en catálogo
   * si existe una promoción puntual autorizada).
   */
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'precio_unitario debe tener máximo 2 decimales.' },
  )
  @IsPositive({ message: 'precio_unitario debe ser mayor a 0.' })
  precio_unitario: number;

  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'descuento debe tener máximo 2 decimales.' },
  )
  @Min(0, { message: 'descuento no puede ser negativo.' })
  descuento: number = 0;
}

// ─── Cabecera de Venta ────────────────────────────────────────────────────────

export class CreateVentaDto {
  @IsInt({ message: 'id_medio_pago debe ser un número entero.' })
  @IsPositive({ message: 'id_medio_pago debe ser un número positivo.' })
  id_medio_pago: number;

  @IsEnum(TipoComprobante, {
    message: `tipo_comprobante debe ser uno de: ${Object.values(TipoComprobante).join(', ')}.`,
  })
  tipo_comprobante: TipoComprobante = TipoComprobante.SIMPLE;

  @IsEnum(TipoDocCliente, {
    message: `tipo_doc_cliente debe ser uno de: ${Object.values(TipoDocCliente).join(', ')}.`,
  })
  tipo_doc_cliente: TipoDocCliente = TipoDocCliente.SIN_DOC;

  /**
   * DNI (8 dígitos) o RUC (11 dígitos). Requerido cuando tipo_doc_cliente
   * no es SIN_DOC.
   */
  @ValidateIf((o) => o.tipo_doc_cliente !== TipoDocCliente.SIN_DOC)
  @IsString()
  @MaxLength(15, {
    message: 'documento_cliente no puede superar 15 caracteres.',
  })
  documento_cliente?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150, {
    message: 'nombre_cliente no puede superar 150 caracteres.',
  })
  nombre_cliente?: string = 'Público General';

  /**
   * Dirección requerida obligatoriamente para FACTURA (normativa SUNAT).
   */
  @ValidateIf((o) => o.tipo_comprobante === TipoComprobante.FACTURA)
  @IsNotEmpty({ message: 'direccion_cliente es obligatoria para FACTURA.' })
  @IsString()
  @MaxLength(250)
  direccion_cliente?: string;

  @ValidateNested({ each: true })
  @Type(() => DetalleVentaDto)
  detalles: DetalleVentaDto[];
}
