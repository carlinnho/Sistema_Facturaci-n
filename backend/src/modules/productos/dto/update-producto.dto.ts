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

// Idéntico a CreateProductoDto pero sin stock_actual
// (el stock se gestiona exclusivamente por sp_actualizar_stock)
export class UpdateProductoDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre del producto es obligatorio.' })
  @MaxLength(150)
  nombre: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  codigo_barras?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Type(() => Number)
  precio: number;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  stock_minimo: number;

  @IsInt()
  @IsPositive()
  @Type(() => Number)
  id_categoria: number;
}
