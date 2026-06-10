import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import {
  SendMessageDto,
  RecommendFormationsDto,
  GenerateJustificationDto,
} from './dto/chat.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('message')
  async sendMessage(
    @Body() dto: SendMessageDto,
    @CurrentUser() user: any,
  ) {
    return this.chatService.processMessage(user.id, dto.message);
  }

  @Post('recommend-formations')
  async recommendFormations(
    @Body() dto: RecommendFormationsDto,
    @CurrentUser() user: any,
  ) {
    return this.chatService.recommendFormations(user.id, dto.need);
  }

  @Post('generate-justification')
  async generateJustification(
    @Body() dto: GenerateJustificationDto,
    @CurrentUser() user: any,
  ) {
    return this.chatService.generateJustification(
      user.id,
      dto.formationName,
      dto.domain,
      dto.context,
    );
  }

  @Get('history')
  async getHistory(@CurrentUser() user: any) {
    return this.chatService.getHistory(user.id);
  }
}
