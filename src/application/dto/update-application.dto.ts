import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { ApplicationStatus } from 'generated/prisma/client';

export class UpdateApplicationDto {
  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @IsOptional()
  @IsString()
  reasonForJoining?: string;

  @IsOptional()
  @IsString()
  availability?: string;

  @IsOptional()
  @IsEnum(ApplicationStatus)
  status?: ApplicationStatus;
}
