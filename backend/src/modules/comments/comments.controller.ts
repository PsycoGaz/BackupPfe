import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('comments')
@UseGuards(JwtAuthGuard)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get(':requestId')
  async findByRequest(@Param('requestId') requestId: string) {
    return this.commentsService.findByRequest(requestId);
  }

  @Post(':requestId')
  async create(
    @Param('requestId') requestId: string,
    @Body('content') content: string,
    @CurrentUser() user: any,
  ) {
    return this.commentsService.create(requestId, user.id, content);
  }
}
