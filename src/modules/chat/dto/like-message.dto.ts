import { IsEnum, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';
import { LikeMsgAction } from '../types';

export class LikeMessageDto {
  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsNotEmpty()
  @IsString()
  chatId: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  messageId: number;

  @IsEnum(LikeMsgAction)
  action: LikeMsgAction = LikeMsgAction.add;
}
