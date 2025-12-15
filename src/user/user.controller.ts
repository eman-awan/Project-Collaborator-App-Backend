import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { GetUser } from '../auth/decorator';
import type { User } from '../../generated/prisma';
import { EditUserDto } from './dto';
import { Jwt2faGuard, JwtGuard } from '../auth/guard';

@UseGuards(JwtGuard)
@Controller('users')
export class UserController {
    constructor(private userService: UserService) {}

    @Get()
async getAllUsers(@GetUser() user: User) {
  return this.userService.findAllExcept(user.id);
}
    @Patch('me')
    updateUser(@GetUser('id') userId: number, @Body() dto: EditUserDto) {
        return this.userService.updateUser(userId, dto);
    }

    @Get('me')
    getMe(@GetUser() user: User) {
        return user;
    }

    @UseGuards(Jwt2faGuard)
    @Get('sensitive-data')
    getSensitiveData(@GetUser() user: User) {
        return {
            message: 'This is sensitive data',
            user,
        };
    }
}
