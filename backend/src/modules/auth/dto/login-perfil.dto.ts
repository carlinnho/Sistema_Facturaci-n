import { IsNumber, IsString, IsOptional, IsNotEmpty, MaxLength } from 'class-validator';

export class LoginPerfilDto {
  @IsNumber()
  @IsNotEmpty()
  id_usuario: number;

  @IsString()
  @IsOptional()
  @MaxLength(6)
  pin?: string;
}
