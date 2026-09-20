import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UpdateCategoriaDto {
  @IsString({ message: 'El nombre debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El nombre de la categoría es obligatorio.' })
  @MaxLength(100, { message: 'El nombre no puede superar los 100 caracteres.' })
  nombre: string;
}
