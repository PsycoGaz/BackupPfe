import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { DecisionsService } from './decisions.service';
import { DecisionDto } from './dto/decision.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../../common/enums';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class DecisionsController {
  constructor(private readonly decisionsService: DecisionsService) {}

  // --- Manager endpoints ---

  @Get('manager/tasks')
  @Roles(UserRole.MANAGER)
  async getManagerTasks(@CurrentUser() user: any) {
    return this.decisionsService.getManagerTasks(user.id);
  }

  @Post('manager/tasks/:requestId/approve')
  @Roles(UserRole.MANAGER)
  async approveAsManager(
    @Param('requestId') requestId: string,
    @Body() dto: DecisionDto,
    @CurrentUser() user: any,
  ) {
    return this.decisionsService.approveAsManager(
      requestId,
      user.id,
      dto.comment || null,
    );
  }

  @Post('manager/tasks/:requestId/reject')
  @Roles(UserRole.MANAGER)
  async rejectAsManager(
    @Param('requestId') requestId: string,
    @Body() dto: DecisionDto,
    @CurrentUser() user: any,
  ) {
    return this.decisionsService.rejectAsManager(
      requestId,
      user.id,
      dto.comment || null,
    );
  }

  // --- RH endpoints ---

  @Get('rh/tasks')
  @Roles(UserRole.RH)
  async getRhTasks() {
    return this.decisionsService.getRhTasks();
  }

  @Post('rh/tasks/:requestId/approve')
  @Roles(UserRole.RH)
  async approveAsRh(
    @Param('requestId') requestId: string,
    @Body() dto: DecisionDto,
    @CurrentUser() user: any,
  ) {
    return this.decisionsService.approveAsRh(
      requestId,
      user.id,
      dto.comment || null,
    );
  }

  @Post('rh/tasks/:requestId/reject')
  @Roles(UserRole.RH)
  async rejectAsRh(
    @Param('requestId') requestId: string,
    @Body() dto: DecisionDto,
    @CurrentUser() user: any,
  ) {
    return this.decisionsService.rejectAsRh(
      requestId,
      user.id,
      dto.comment || null,
    );
  }
}
