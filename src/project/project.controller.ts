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
import { ProjectService } from './project.service';
import { CreateProjectDto, UpdateProjectDto } from './dto';
import { JwtGuard } from '../auth/guard';
import { GetUser } from '../auth/decorator';

@UseGuards(JwtGuard)
@Controller('projects')
export class ProjectController {
  constructor(private projectService: ProjectService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createProject(@GetUser('id') userId: number, @Body() dto: CreateProjectDto) {
    return this.projectService.createProject(userId, dto);
  }

  @Get()
  getAllProjects(@GetUser('id') userId: number) {
    return this.projectService.getAllProjects(userId);
  }

  @Get('my-projects')
  getUserProjects(@GetUser('id') userId: number) {
    return this.projectService.getUserProjects(userId);
  }

  @Get(':id')
  getProjectById(@Param('id', ParseIntPipe) projectId: number) {
    return this.projectService.getProjectById(projectId);
  }

  @Patch(':id')
  updateProject(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) projectId: number,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectService.updateProject(userId, projectId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteProject(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) projectId: number,
  ) {
    return this.projectService.deleteProject(userId, projectId);
  }

  @Patch(':id/archive')
  archiveProject(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) projectId: number,
  ) {
    return this.projectService.archiveProject(userId, projectId);
  }

  @Patch(':id/unarchive')
  unarchiveProject(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) projectId: number,
  ) {
    return this.projectService.unarchiveProject(userId, projectId);
  }
}