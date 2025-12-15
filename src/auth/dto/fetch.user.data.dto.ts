import { IsNumber, Min } from "class-validator";


export class FetchUserDataDto{

  @IsNumber()
  @Min(0, {message: 'User Id must be greater than 0'})
  id: number;
}