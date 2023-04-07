import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ChatUserRole } from '../types';

export class ChatMessageDto {
  @IsNotEmpty()
  @IsString()
  chatId: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  content: string;

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
