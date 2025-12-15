export class OtpUtil {
    static generateOTP(length: number = 4): string {
        const digits = '0123456789';
        let otp = '';
        
        for (let i = 0; i < length; i++) {
            otp += digits[Math.floor(Math.random() * digits.length)];
        }
        
        return otp;
    }

    static getExpiryTime(minutes: number): Date {
        const now = new Date();
        now.setMinutes(now.getMinutes() + minutes);
        return now;
    }

    static isExpired(expiryDate: Date): boolean {
        return new Date() > expiryDate;
    }
}