import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './chatbot.service';
import { OpenRouterService } from './openrouter.service';

@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [ChatbotController],
  providers: [ChatbotService, OpenRouterService],
})
export class ChatbotModule {}
