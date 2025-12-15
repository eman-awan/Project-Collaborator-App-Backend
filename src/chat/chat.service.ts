import { Injectable } from '@nestjs/common';
import { StreamChat } from 'stream-chat';

@Injectable()
export class ChatService {
  private client: StreamChat;

  constructor() {
    this.client = StreamChat.getInstance(
      process.env.STREAM_API_KEY!,
      process.env.STREAM_API_SECRET!
    );
  }

  async generateToken(userId: number) {
    const token = this.client.createToken(String(userId));
    return { streamToken: token };
  }
}
