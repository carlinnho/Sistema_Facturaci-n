import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  ValidateNested,
} from 'class-validator';

export class RestockItemDto {
  @IsInt()
  @IsNotEmpty()
  @Type(() => Number)
  id_producto: number;

  /**
   * Positivo (+) = entrada de stock.
   * Negativo (-) = salida / ajuste de inventario.
   * El SP valida que no resulte en stock negativo.
   */
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  cantidad: number;
}

export class RestockMultipleDto {
  @IsArray()
  @ArrayMinSize(1, {
    message: 'Debe incluir al menos un ítem para reposición.',
  })
  @ValidateNested({ each: true })
  @Type(() => RestockItemDto)
  items: RestockItemDto[];
}
