import { Controller, Get, Param, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('conversation')
  async getOrCreateConversation(@Request() req, @Body('userId') userId: string) {
    const currentUserId = req.user.userId || req.user.sub || req.user.id;
    const conversationId = await this.chatService.getOrCreateConversation(currentUserId, userId);
    return { conversationId };
  }

  @Get('conversations')
  async getConversations(@Request() req) {
    const currentUserId = req.user.userId || req.user.sub || req.user.id;
    return this.chatService.getConversations(currentUserId);
  }

  @Get(':roomId/messages')
  async getMessages(@Param('roomId') roomId: string) {
    return this.chatService.getMessages(roomId);
  }
}
