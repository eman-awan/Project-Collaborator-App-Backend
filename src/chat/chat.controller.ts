import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { JwtGuard } from '../auth/guard';
import { ChatService } from './chat.service';

@UseGuards(JwtGuard)
@Controller('chat')
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Post('token')
  async getStreamToken(@Req() req) {
    const userId = req.user.id; // JWT gives this

    return this.chatService.generateToken(userId);
  }
}
