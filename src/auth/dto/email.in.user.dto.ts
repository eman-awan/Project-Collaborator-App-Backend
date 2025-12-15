import { IsEmail, IsNotEmpty } from "class-validator";



export class EmailInUseDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}