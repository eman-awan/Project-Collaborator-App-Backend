import { IsString, IsNotEmpty, IsOptional, IsInt, IsEnum } from 'class-validator';
import { TaskStatus, Priority } from 'generated/prisma/client';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  title: string;

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
  @IsNotEmpty()
  projectId: number;

  @IsInt()
  @IsOptional()
  assigneeId?: number;
}
