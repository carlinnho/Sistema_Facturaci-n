import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateProductoDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre del producto es obligatorio.' })
  @MaxLength(150)
  nombre: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  codigo_barras?: string;

  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El precio debe ser numérico con hasta 2 decimales.' },
  )
  @IsPositive({ message: 'El precio debe ser mayor a 0.' })
  @Type(() => Number)
  precio: number;

  @IsInt()
  @Min(0, { message: 'El stock mínimo no puede ser negativo.' })
  @Type(() => Number)
  stock_minimo: number;

  @IsInt()
  @Min(0, { message: 'El stock actual no puede ser negativo.' })
  @Type(() => Number)
  stock_actual: number;

  @IsInt()
  @IsPositive({ message: 'Debe especificar una categoría válida.' })
  @Type(() => Number)
  id_categoria: number;
}
