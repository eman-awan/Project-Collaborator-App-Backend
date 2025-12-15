import { IsString, IsNotEmpty, Length } from "class-validator";

export class TwoFactorCodeDto {
    @IsString()
    @IsNotEmpty()
    @Length(6, 6)
    twoFactorAuthenticationCode: string;
}