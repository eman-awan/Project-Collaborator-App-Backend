import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { Jwt2faStrategy, JwtStrategy } from "./strategy";
import { UserModule } from '../user/user.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [JwtModule.register({}), UserModule, EmailModule],
  controllers: [AuthController],
  providers: [AuthService,JwtStrategy, Jwt2faStrategy],
})
export class AuthModule {}
