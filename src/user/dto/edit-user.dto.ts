import { IsEnum, IsOptional, IsString } from "class-validator";
import { Availability } from "generated/prisma/wasm";

export class EditUserDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsEnum(Availability, { message: `Invalid availability status it must of one of ${Object.values(Availability).join(', ')}` })
  availability?: Availability;
}