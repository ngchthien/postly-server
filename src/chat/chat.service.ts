import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message, MessageDocument } from './schemas/message.schema';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
  ) {}

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
    return newMessage.save();
  }

  async getMessages(roomId: string): Promise<MessageDocument[]> {
    return this.messageModel
      .find({ roomId })
      .sort({ createdAt: 1 })
      .populate('senderId', 'name avatar') // adjust fields as needed
      .exec();
  }
}
