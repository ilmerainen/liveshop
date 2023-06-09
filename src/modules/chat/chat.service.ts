import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, MoreThan, Repository } from 'typeorm';
import { Socket } from 'socket.io';
import { parse } from 'cookie';
import { ChatMessage } from './entities/chat-message.entity';
import { UserService } from './user.service';
import { WsException } from '@nestjs/websockets';
import { ChatUser } from './entities/chat-user.entity';
import { ICursorPaginationOptions } from '../../utils/types/pagination-options';
import { Chat } from './entities/chat.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatMessage)
    private readonly chatMessagesRepo: Repository<ChatMessage>,
    @InjectRepository(ChatUser)
    private readonly chatUserRepo: Repository<ChatUser>,
    @InjectRepository(Chat)
    private readonly chatRepo: Repository<Chat>,
    private readonly userService: UserService,
  ) {}

  readonly GET_ALL_MESSAGES_LIMIT = 50;

  async getUserFromSocket(socket: Socket) {
    const cookie = socket.handshake.headers.cookie;
    const { userId } = parse(cookie);
    const user = await this.userService.getOne({ id: userId });

    if (!user) {
      throw new WsException('Invalid credentials.');
    }

    return user;
  }

  async getChat(criteria: Pick<Chat, 'id'>): Promise<Chat> {
    return this.chatRepo.findOne({
      where: criteria,
    });
  }

  async createChat(data: Pick<Chat, 'id'>): Promise<Chat> {
    const created = await this.chatRepo.save(data);
    return created;
  }

  async createChatIfNotExists(data: Pick<Chat, 'id'>): Promise<Chat> {
    const found = await this.getChat({
      id: data.id,
    });

    if (!found) {
      return this.createChat(data);
    }

    return found;
  }

  async getAllMessages(
    criteria: { chatId: string },
    pagination?: ICursorPaginationOptions,
  ) {
    const qb = await this.chatMessagesRepo
      .createQueryBuilder('msg')
      .where(criteria)
      .leftJoinAndSelect('msg.user', 'user')
      .leftJoinAndSelect('msg.reply', 'reply')
      .leftJoinAndSelect('reply.user', 'replyUser');

    if (pagination.before || pagination.after) {
      const { count, before, after } = pagination;

      qb.andWhere({
        id: before ? LessThan(before) : MoreThan(after),
      });
      qb.orderBy({
        ['msg.id']: before ? 'DESC' : 'ASC',
      });
      qb.take(count);
    } else {
      qb.orderBy({
        ['msg.id']: 'DESC',
      }).take(pagination?.count || this.GET_ALL_MESSAGES_LIMIT);
    }

    const result = await qb.getMany();
    return result;
  }

  async createMessage(
    data: Pick<ChatMessage, 'content' | 'chatId' | 'userId' | 'replyTo'>,
  ) {
    const msg = await this.chatMessagesRepo.save(data);
    const found = await this.chatMessagesRepo.findOne({
      where: { id: msg.id },
      relations: ['user', 'reply', 'reply.user'],
    });
    return found;
  }

  async createUser(data: Pick<ChatUser, 'name' | 'role'>) {
    const user = await this.chatUserRepo.save(data);
    return user;
  }

  async getUser(id: string) {
    const user = await this.chatUserRepo.findOneBy({
      id,
    });
    return user || null;
  }

  async blockMessage(
    criteria: { id: number },
    data: Partial<ChatMessage>,
  ): Promise<boolean> {
    const { affected } = await this.chatMessagesRepo.update(criteria, data);
    return affected > 0;
  }
}
