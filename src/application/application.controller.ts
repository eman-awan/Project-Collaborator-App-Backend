import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApplicationService } from './application.service';
import { CreateApplicationDto, UpdateApplicationDto } from './dto';
import { JwtGuard } from '../auth/guard';
import { GetUser } from '../auth/decorator';

@UseGuards(JwtGuard)
@Controller('applications')
export class ApplicationController {
  constructor(private applicationService: ApplicationService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createApplication(
    @GetUser('id') userId: number,
    @Body() dto: CreateApplicationDto,
  ) {
    return this.applicationService.createApplication(userId, dto);
  }

  @Get('my-applications')
  getUserApplications(@GetUser('id') userId: number) {
    return this.applicationService.getUserApplications(userId);
  }

  @Get('project/:projectId')
  getProjectApplications(
    @Param('projectId', ParseIntPipe) projectId: number,
    @GetUser('id') userId: number,
  ) {
    return this.applicationService.getProjectApplications(projectId, userId);
  }

  @Get(':id')
  getApplicationById(@Param('id', ParseIntPipe) applicationId: number) {
    return this.applicationService.getApplicationById(applicationId);
  }

  @Patch(':id')
  updateApplication(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) applicationId: number,
    @Body() dto: UpdateApplicationDto,
  ) {
    return this.applicationService.updateApplication(
      userId,
      applicationId,
      dto,
    );
  }

  @Patch(':id/accept')
  acceptApplication(
    @Param('id', ParseIntPipe) applicationId: number,
    @GetUser('id') userId: number,
  ) {
    return this.applicationService.acceptApplication(applicationId, userId);
  }

  @Patch(':id/reject')
  rejectApplication(
    @Param('id', ParseIntPipe) applicationId: number,
    @GetUser('id') userId: number,
  ) {
    return this.applicationService.rejectApplication(applicationId, userId);
  }

  @Patch(':id/withdraw')
  withdrawApplication(
    @Param('id', ParseIntPipe) applicationId: number,
    @GetUser('id') userId: number,
  ) {
    return this.applicationService.withdrawApplication(applicationId, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteApplication(
    @Param('id', ParseIntPipe) applicationId: number,
    @GetUser('id') userId: number,
  ) {
    return this.applicationService.deleteApplication(applicationId, userId);
  }
}
