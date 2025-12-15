import { Injectable } from '@nestjs/common';
import { EditUserDto } from './dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
    constructor(private prisma: PrismaService) {}

    async setTwoFactorAuthenticationSecret(secret: string, userId: number) {
        return this.prisma.user.update({
            where: { id: userId },
            data: { twoFactorAuthenticationSecret: secret },
        });
    }
    async getAllUsers(currentUserId: number) {
    return this.prisma.user.findMany({
        where: {
            NOT: { id: currentUserId },   // exclude yourself
        },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            isOnboarded: true
        },
    });
}   async findAllExcept(currentUserId: number) {
  return this.prisma.user.findMany({
    where: {
      NOT: { id: currentUserId },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  });
}


    findOne(email: string) {
        return this.prisma.user.findUnique({
            where: { email },
        });
    }

    findById(id: number) {
        return this.prisma.user.findUnique({
            where: { id },
        });
    }

    updateUser(userId:number,dto: EditUserDto) {
        const user = this.prisma.user.update({
            where: {
                id: userId,
            },
            data: {
                ...dto,
            },
        });
        delete (user as any).passwordHash;
        return user;
    }
}
