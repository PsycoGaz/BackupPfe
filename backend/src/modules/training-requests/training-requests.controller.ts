import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { TrainingRequestsService } from './training-requests.service';
import {
  CreateTrainingRequestDto,
  CreateTeamTrainingRequestDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../../common/enums';

@Controller('training-requests')
@UseGuards(JwtAuthGuard)
export class TrainingRequestsController {
  constructor(
    private readonly trainingRequestsService: TrainingRequestsService,
  ) {}

  @Get()
  async findAll(@CurrentUser() user: any) {
    return this.trainingRequestsService.findAllForUser(user.id, user.role);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.trainingRequestsService.findByIdForUser(id, user.id, user.role);
  }

  @Post()
  async create(
    @Body() dto: CreateTrainingRequestDto,
    @CurrentUser() user: any,
  ) {
    return this.trainingRequestsService.createIndividual(
      dto,
      user.id,
      user.role,
    );
  }

  @Post('team')
  @UseGuards(RolesGuard)
  @Roles(UserRole.MANAGER)
  async createTeamRequest(
    @Body() dto: CreateTeamTrainingRequestDto,
    @CurrentUser() user: any,
  ) {
    return this.trainingRequestsService.createTeamRequest(dto, user.id);
  }

  @Patch(':id/cancel')
  async cancel(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.trainingRequestsService.cancelRequest(id, user.id);
  }
}
