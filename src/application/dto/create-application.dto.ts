import { IsArray, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateApplicationDto {
  @IsNotEmpty()
  @IsInt()
  projectId: number;

  @IsNotEmpty()
  @IsString()
  role: string; // e.g., "Developer", "Designer", "Project Manager"

  @IsArray()
  @IsString({ each: true })
  skills: string[]; // Array of skills/expertise

  @IsOptional()
  @IsString()
  reasonForJoining?: string; // Motivation and interests

  @IsOptional()
  @IsString()
  availability?: string; // e.g., "Part-time", "Full-time", "Specific hours"
}
