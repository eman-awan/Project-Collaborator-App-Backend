import { IsString, IsOptional, IsInt, IsEnum } from 'class-validator';
import { TaskStatus, Priority } from 'generated/prisma/client';

export class UpdateTaskDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @IsEnum(Priority)
  @IsOptional()
  priority?: Priority;

  @IsInt()
  @IsOptional()
  assigneeId?: number;
}
