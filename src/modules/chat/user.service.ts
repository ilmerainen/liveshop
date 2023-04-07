import { Injectable } from '@nestjs/common';
import { ChatUser } from './entities/chat-user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(ChatUser)
    private readonly chatUserRepo: Repository<ChatUser>,
  ) {}

  async getOne(criteria: Partial<ChatUser>): Promise<ChatUser | null> {
    const user = await this.chatUserRepo.findOne({
      where: criteria,
    });

    return user || null;
  }
}
