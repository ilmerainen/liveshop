import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Chat } from './entities/chat.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { ChatUser } from './entities/chat-user.entity';
import { ChatGateway } from './chat.gateway';
import { MsgLike } from './entities/msg-like.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Chat, ChatMessage, ChatUser, MsgLike])],
  providers: [ChatService, UserService, ChatGateway],
})
export class ChatModule {}
