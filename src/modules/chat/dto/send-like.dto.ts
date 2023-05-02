import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SendLikeDto {
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsNotEmpty()
  @IsString()
  chatId: string;
}
