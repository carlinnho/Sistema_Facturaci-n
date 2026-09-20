import { IsString, IsOptional, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateProveedorDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre del proveedor es obligatorio.' })
  @MaxLength(150)
  nombre: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsString()
  @IsOptional()
  @MaxLength(15)
  telefono_whatsapp?: string;

  @IsString()
  @IsOptional()
  @MaxLength(15)
  telefono_fijo?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  correo?: string;
}
