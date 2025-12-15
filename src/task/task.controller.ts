import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TaskService } from './task.service';
import { CreateTaskDto, UpdateTaskDto, CreateCommentDto, UpdateCommentDto } from './dto';
import { JwtGuard } from '../auth/guard';
import { GetUser } from '../auth/decorator';

@UseGuards(JwtGuard)
@Controller('tasks')
export class TaskController {
  constructor(private taskService: TaskService) {}

  // ===================== TASK ENDPOINTS =====================

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createTask(@GetUser('id') userId: number, @Body() dto: CreateTaskDto) {
    return this.taskService.createTask(userId, dto);
  }

  @Get('my-tasks')
  getMyTasks(@GetUser('id') userId: number) {
    return this.taskService.getMyTasks(userId);
  }

  @Get('project/:projectId')
  getProjectTasks(
    @Param('projectId', ParseIntPipe) projectId: number,
    @GetUser('id') userId: number,
  ) {
    return this.taskService.getProjectTasks(projectId, userId);
  }

  @Get(':id')
  getTaskById(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('id') userId: number,
  ) {
    return this.taskService.getTaskById(id, userId);
  }

  @Patch(':id')
  updateTask(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('id') userId: number,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.taskService.updateTask(id, userId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteTask(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('id') userId: number,
  ) {
    return this.taskService.deleteTask(id, userId);
  }

  // ===================== COMMENT ENDPOINTS =====================

  @Post('comments')
  @HttpCode(HttpStatus.CREATED)
  createComment(@GetUser('id') userId: number, @Body() dto: CreateCommentDto) {
    return this.taskService.createComment(userId, dto);
  }

  @Get(':taskId/comments')
  getTaskComments(
    @Param('taskId', ParseIntPipe) taskId: number,
    @GetUser('id') userId: number,
  ) {
    return this.taskService.getTaskComments(taskId, userId);
  }

  @Patch('comments/:id')
  updateComment(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('id') userId: number,
    @Body() dto: UpdateCommentDto,
  ) {
    return this.taskService.updateComment(id, userId, dto);
  }

  @Delete('comments/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteComment(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('id') userId: number,
  ) {
    return this.taskService.deleteComment(id, userId);
  }
}
