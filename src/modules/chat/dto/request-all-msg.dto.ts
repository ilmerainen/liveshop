import { IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';

export class RequestAllMessagesDto {
  @IsNotEmpty()
  chatId: string;

  @IsNumber()
  @Min(1)
  @IsOptional()
  before: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  after: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  count?: number;
}
