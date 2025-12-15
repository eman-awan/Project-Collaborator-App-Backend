import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class Jwt2faStrategy extends PassportStrategy(Strategy, 'jwt-2fa') {
    constructor(
        private config: ConfigService,
        private prisma: PrismaService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: config.get('JWT_SECRET') || 'superSecret',
        });
    }

    async validate(payload: {
        sub: number;
        email: string;
        isTwoFactorAuthenticationEnabled: boolean;
        isTwoFactorAuthenticated: boolean;
    }) {
        const user = await this.prisma.user.findUnique({
            where: {
                id: payload.sub,
            },
        });

        if (!user) {
            throw new UnauthorizedException('Unauthorized: No user found.');
        }

        // If 2FA is not enabled, return user
        if (!user.isTwoFactorAuthenticationEnabled) {
            throw new UnauthorizedException('2FA authentication required');
        }

        // If 2FA is enabled, check if user completed 2FA authentication
        if (payload.isTwoFactorAuthenticationEnabled) {
            return user;
        }

        // If 2FA is enabled but not authenticated, deny access
        throw new UnauthorizedException('2FA authentication required');
    }
}