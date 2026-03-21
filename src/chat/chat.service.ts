import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message, MessageDocument } from './schemas/message.schema';
import { Conversation, ConversationDocument } from './schemas/conversation.schema';
import { CreateMessageDto } from './dto/create-message.dto';
import { UsersService } from '../users/users.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    @InjectModel(Conversation.name) private conversationModel: Model<ConversationDocument>,
    private usersService: UsersService,
    private notificationsService: NotificationsService,
  ) {}

  async getOrCreateConversation(user1Id: string, user2Id: string): Promise<string> {
    const participants = [new Types.ObjectId(user1Id), new Types.ObjectId(user2Id)];
    
    let conversation = await this.conversationModel.findOne({
      participants: { $all: participants, $size: 2 }
    });

    if (!conversation) {
      conversation = new this.conversationModel({
        participants,
      });
      await conversation.save();
    }

    return conversation._id.toString();
  }

  async getConversations(userId: string): Promise<ConversationDocument[]> {
    return this.conversationModel
      .find({ participants: new Types.ObjectId(userId) })
      .populate('participants', 'name avatar')
      .populate('lastMessage')
      .sort({ updatedAt: -1 })
      .exec();
  }

  async createMessage(
    senderId: string,
    createMessageDto: CreateMessageDto,
  ): Promise<MessageDocument> {
    const newMessage = new this.messageModel({
      senderId: new Types.ObjectId(senderId),
      receiverId: createMessageDto.receiverId
        ? new Types.ObjectId(createMessageDto.receiverId)
        : undefined,
      roomId: createMessageDto.roomId,
      content: createMessageDto.content,
    });
    
    await newMessage.save();

    // Send push notification to receiver
    try {
      const sender = await this.usersService.findById(senderId);
      let receiverId = createMessageDto.receiverId;

      if (!receiverId && createMessageDto.roomId) {
        const conversation = await this.conversationModel.findById(createMessageDto.roomId).exec();
        if (conversation) {
          receiverId = conversation.participants.find(p => p.toString() !== senderId)?.toString();
        }
      }

      if (receiverId) {
        const receiver = await this.usersService.findById(receiverId);
        if (receiver?.fcmToken) {
          await this.notificationsService.sendPushNotification(
            receiver.fcmToken,
            sender?.name || 'New Message',
            createMessageDto.content,
            {
              senderId,
              roomId: createMessageDto.roomId || '',
            }
          );
        }
      }
    } catch (error) {
      console.error('Failed to send push notification:', error);
    }

    if (createMessageDto.roomId && Types.ObjectId.isValid(createMessageDto.roomId)) {
      await this.conversationModel.findByIdAndUpdate(
        createMessageDto.roomId,
        { lastMessage: newMessage._id, updatedAt: new Date() }
      );
    }

    return newMessage;
  }

  async getMessages(roomId: string): Promise<MessageDocument[]> {
    return this.messageModel
      .find({ roomId })
      .sort({ createdAt: 1 })
      .populate('senderId', 'name avatar') // adjust fields as needed
      .exec();
  }
}
