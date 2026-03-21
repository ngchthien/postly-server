import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message, MessageDocument } from './schemas/message.schema';
import { Conversation, ConversationDocument } from './schemas/conversation.schema';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    @InjectModel(Conversation.name) private conversationModel: Model<ConversationDocument>,
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
