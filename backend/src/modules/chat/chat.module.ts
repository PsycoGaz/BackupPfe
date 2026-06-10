import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { GeminiService } from './gemini.service';
import { ChatMessage } from './chat-message.entity';
import { Formation } from '../formations/formation.entity';
import { TrainingRequest } from '../training-requests/training-request.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ChatMessage, Formation, TrainingRequest])],
  controllers: [ChatController],
  providers: [ChatService, GeminiService],
  exports: [ChatService],
})
export class ChatModule {}
