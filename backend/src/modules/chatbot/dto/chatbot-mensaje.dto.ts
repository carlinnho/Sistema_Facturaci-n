import { IsString, Matches, MaxLength } from 'class-validator';

export class ChatbotMensajeDto {
  @IsString()
  @MaxLength(500)
  @Matches(/\S/, { message: 'Escribe una consulta.' })
  mensaje: string;
}
