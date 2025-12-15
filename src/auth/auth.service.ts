import { BadRequestException, ConflictException, ForbiddenException, Injectable } from '@nestjs/common';
import * as argon from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { User } from 'generated/prisma/client';
import { authenticator } from 'otplib';
import { UserService } from '../user/user.service';
import { toDataURL } from 'qrcode';
import { EmailService } from '../email/email.service';
import { OtpUtil } from 'src/common/utils/otp.util';
import { SignInDto, SignupDto } from './dto';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwt: JwtService,
        private config: ConfigService,
        private userService: UserService,
        private emailService: EmailService
    ) { }

    async getUserDataAfterSignIn(userId: number){
        
    }


    async generateTwoFactorAuthenticationSecret(user: User) {
        const secret = authenticator.generateSecret();
        const otpauthUrl = authenticator.keyuri(
            user.email,
            this.config.get('TWO_FACTOR_AUTHENTICATION_APP_NAME') || 'MyApp',
            secret
        );
        await this.userService.setTwoFactorAuthenticationSecret(secret, user.id);
        return { secret, otpauthUrl };
    }
    async generateQrCodeDataUrl(otpAuthUrl: string) {
        return toDataURL(otpAuthUrl);
    }

    isTwoFactorAuthenticationCodeValid(twoFactorAuthenticationCode: string, user: User) {
        if (!user.twoFactorAuthenticationSecret) {
            return false;
        }

        return authenticator.verify({
            token: twoFactorAuthenticationCode,
            secret: user.twoFactorAuthenticationSecret,
        });
    }

    async turnOnTwoFactorAuthentication(userId: number) {
        return this.prisma.user.update({
            where: { id: userId },
            data: { isTwoFactorAuthenticationEnabled: true },
        });
    }


    async turnOffTwoFactorAuthentication(userId: number) {
        return this.prisma.user.update({
            where: { id: userId },
            data: {
                isTwoFactorAuthenticationEnabled: false,
                twoFactorAuthenticationSecret: null,
            },
        });
    }

    async loginWith2fa(user: User): Promise<{ access_token: string; isTwoFactorAuthenticationEnabled?: boolean }> {
        return this.signToken(
            user.id,
            user.email,
            user.isTwoFactorAuthenticationEnabled,
            true // Now 2FA authenticated
        );
    }

    async signup(dto: SignupDto) {
        try {
            const userExists = await this.prisma.user.findFirst({ where: { email: dto.email } });
            if (userExists)
                throw new ConflictException('Email Already in user');

            const hash = await argon.hash(dto.password);
            // Generate OTP for email verification
            const otp = OtpUtil.generateOTP();
            const otpExpiry = OtpUtil.getExpiryTime(
                parseInt(this.config.get('OTP_EXPIRY_MINUTES') || '10')
            );

            const user = await this.prisma.user.create({
                data: {
                    email: dto.email,
                    passwordHash: hash,
                    emailVerificationToken: otp,
                    emailVerificationExpires: otpExpiry,
                    isEmailVerified: false,
                    phoneNumber: dto.phoneNumber,
                    firstName: dto.firstName,
                    lastName: dto.lastName,
                },
            });

            // Send verification email
            await this.emailService.sendVerificationEmail(user.email, otp);

            return {
                message: 'Signup successful. Please check your email to verify your account.',
                email: user.email,
            };
        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    throw new ForbiddenException('Email already exists');
                }
            }
            throw error;
        }
    }

    async signin(dto: SignInDto):
        Promise<{ access_token: string; isTwoFactorAuthenticationEnabled?: boolean }> {
        const user = await this.prisma.user.findUnique({
            where: {
                email: dto.email,
            },
        });
        if (!user) throw new ForbiddenException('User does not exist');

        const isMatch = await argon.verify(user.passwordHash, dto.password);
        if (!isMatch) throw new ForbiddenException('Invalid password');

        // Check if email is verified
        if (!user.isEmailVerified) {
            await this.resendVerificationOtp(dto.email);
            throw new ForbiddenException(
                'Please verify your email before signing in. Check your inbox for the new OTP.'
            );
        }

        // Return token with 2FA status
        return this.signToken(
            user.id,
            user.email,
            user.isTwoFactorAuthenticationEnabled,
            false
        );
    }

    async verifyEmail(email: string, otp: string) {
        const user = await this.prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            throw new BadRequestException('User not found');
        }

        if (user.isEmailVerified) {
            throw new BadRequestException('Email is already verified');
        }

        if (!user.emailVerificationToken) {
            throw new BadRequestException('No verification token found. Please request a new OTP.');
        }

        if (user.emailVerificationToken !== otp) {
            throw new BadRequestException('Invalid OTP');
        }

        if (OtpUtil.isExpired(user.emailVerificationExpires as Date)) {
            throw new BadRequestException('OTP has expired. Please request a new one.');
        }

        // Mark email as verified and clear the token
        await this.prisma.user.update({
            where: { email },
            data: {
                isEmailVerified: true,
                emailVerificationToken: null,
                emailVerificationExpires: null,
            },
        });

        return {
            message: 'Email verified successfully. You can now sign in.',
        };
    }


    async resendVerificationOtp(email: string) {
        const user = await this.prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            throw new BadRequestException('User not found');
        }

        if (user.isEmailVerified) {
            throw new BadRequestException('Email is already verified');
        }

        const otp = OtpUtil.generateOTP();
        const otpExpiry = OtpUtil.getExpiryTime(
            parseInt(this.config.get('OTP_EXPIRY_MINUTES') || '10')
        );

        await this.prisma.user.update({
            where: { email },
            data: {
                emailVerificationToken: otp,
                emailVerificationExpires: otpExpiry,
            },
        });

        await this.emailService.sendVerificationEmail(email, otp);

        return {
            message: 'Verification OTP has been resent to your email.',
        };
    }



    async signToken(
        userId: number,
        email: string,
        isTwoFactorAuthenticationEnabled: boolean,
        isTwoFactorAuthenticated: boolean,
    ): Promise<{ access_token: string; isTwoFactorAuthenticationEnabled?: boolean }> {
        const payload = {
            sub: userId,
            email,
            isTwoFactorAuthenticationEnabled,
            isTwoFactorAuthenticated,
        };

        const secret = this.config.get('JWT_SECRET');
        const token = await this.jwt.signAsync(payload, {
            expiresIn: '1h',
            secret: secret,
        });

        return {
            access_token: token,
            isTwoFactorAuthenticationEnabled,
        };
    }


    async isEmailInUse(email: string): Promise<boolean> {
        const user = await this.prisma.user.findFirst({
            where: { email },
            select: { id: true },
        });
        return user === null;
    }
}
