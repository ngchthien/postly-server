import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  password: string;

  @Prop()
  roles?: string[];

  @Prop()
  bio?: string;

  // You can add more fields like firstName, lastName, photo, etc.
}

export const UserSchema = SchemaFactory.createForClass(User);
