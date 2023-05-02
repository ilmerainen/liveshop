import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class RequestAllMessagesDto {
  @IsString()
  @IsNotEmpty()
  chatId: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  userId: string;

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
