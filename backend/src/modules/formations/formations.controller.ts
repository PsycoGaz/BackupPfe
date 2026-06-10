import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { FormationsService } from './formations.service';
import { CreateFormationDto, UpdateFormationDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../common/enums';

@Controller('formations')
@UseGuards(JwtAuthGuard)
export class FormationsController {
  constructor(private readonly formationsService: FormationsService) {}

  @Get()
  async findAll() {
    return this.formationsService.findAll();
  }

  @Get('domains')
  async getDomains() {
    return this.formationsService.getDomains();
  }

  @Post('domains')
  @UseGuards(RolesGuard)
  @Roles(UserRole.RH, UserRole.ADMIN)
  async createDomain(@Body() body: { name: string }) {
    return this.formationsService.createDomain(body.name);
  }

  @Patch('domains/rename')
  @UseGuards(RolesGuard)
  @Roles(UserRole.RH, UserRole.ADMIN)
  async renameDomain(@Body() body: { oldName: string; newName: string }) {
    return this.formationsService.renameDomain(body.oldName, body.newName);
  }

  @Delete('domains/:name')
  @UseGuards(RolesGuard)
  @Roles(UserRole.RH, UserRole.ADMIN)
  async deleteDomain(@Param('name') name: string) {
    return this.formationsService.deleteDomain(name);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.formationsService.findById(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.RH, UserRole.ADMIN)
  async create(@Body() dto: CreateFormationDto) {
    return this.formationsService.create(dto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.RH, UserRole.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateFormationDto,
  ) {
    return this.formationsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.RH, UserRole.ADMIN)
  async remove(@Param('id') id: string) {
    await this.formationsService.remove(id);
    return { message: 'Formation supprimée' };
  }
}
