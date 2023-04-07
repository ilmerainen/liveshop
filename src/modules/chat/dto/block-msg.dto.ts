import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class BlockMsgDto {
  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  msgId: number;

  @IsNotEmpty()
  @IsString()
  chatId: number;
}
