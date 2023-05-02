import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { ChatUserRole, MessageType } from '../types';

export class ChatMessageDto {
  @IsNotEmpty()
  @IsString()
  chatId: string;

  @IsNotEmpty()
  @IsString()
  content: string;

  @IsNotEmpty()
  @IsEnum(MessageType)
  type: MessageType = MessageType.text;

  @IsNotEmpty()
  @IsOptional()
  username?: string;

  @IsNotEmpty()
  @IsOptional()
  userId?: string;

  @IsNotEmpty()
  @IsEnum(ChatUserRole)
  role: ChatUserRole;

  @IsOptional()
  @IsNumber()
  replyTo?: number;
}
