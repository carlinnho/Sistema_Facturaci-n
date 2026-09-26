import {
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ChatbotService } from './chatbot.service';
import { ChatbotMensajeDto } from './dto/chatbot-mensaje.dto';

@Controller('chatbot')
@UseGuards(JwtAuthGuard)
export class ChatbotController {
  constructor(private readonly chatbot: ChatbotService) {}

  @Post('mensaje')
  @HttpCode(200)
  mensaje(
    @Body() dto: ChatbotMensajeDto,
    @Req() request: { user: { id: number; rol: number } },
  ) {
    return this.chatbot.responder(dto.mensaje, request.user);
  }
}
