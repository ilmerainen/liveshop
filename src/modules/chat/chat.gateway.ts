import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { ChatMessageDto } from './dto/chat-message.dto';
import { RequestAllMessagesDto } from './dto/request-all-msg.dto';
import { WebsocketExceptionsFilter } from '../../filters';
import { Logger, UseFilters, UsePipes, ValidationPipe } from '@nestjs/common';
import { AckResponseDto } from './dto/ack-response.dto';
import { plainToClass } from 'class-transformer';
import { ChatUser } from './entities/chat-user.entity';
import { BlockMsgDto } from './dto/block-msg.dto';
import { ChatUserRole } from './types';
import { CreateChatDto } from './dto/create-chat.dto';

@UsePipes(new ValidationPipe())
@UseFilters(WebsocketExceptionsFilter)
@WebSocketGateway({
  namespace: 'chat',
  cors: true,
})
export class ChatGateway {
  private readonly logger = new Logger(ChatGateway.name);

  constructor(private readonly chatService: ChatService) {}

  @WebSocketServer()
  server: Server;

  @SubscribeMessage('send_message')
  async listenForMessages(@MessageBody() payload: ChatMessageDto) {
    let userId = payload.userId;
    let user: ChatUser;

    if (userId) {
      user = await this.chatService.getUser(userId);
    } else if (payload.username) {
      user = await this.chatService.createUser({
        name: payload.username,
        role: payload.role,
      });
      userId = user.id;
    }

    if (!user) {
      const resData: AckResponseDto = {
        success: false,
        data: {},
      };
      return plainToClass(AckResponseDto, resData);
    }

    const message = await this.chatService.createMessage({
      chatId: payload.chatId,
      content: payload.content,
      userId,
      replyTo: payload.replyTo,
    });
    const reply = message.reply;
    this.server.to(`room:${payload.chatId}`).emit(
      'receive_new_message',
      JSON.stringify({
        ...message,
        user,
        reply: reply
          ? {
              username: reply.user.name,
              content: reply.content,
            }
          : null,
      }),
    );

    const resData: AckResponseDto = {
      data: {
        userId,
      },
      success: true,
    };
    return JSON.stringify(plainToClass(AckResponseDto, resData));
  }

  @SubscribeMessage('create_room')
  async createRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: CreateChatDto,
  ) {
    const chat = await this.chatService.createChatIfNotExists({
      id: payload.id,
    });
    try {
      await socket.join(`room:${chat.id}`);
    } catch {
      this.logger.error('createRoom: socket.join error');
    }

    return chat;
  }

  @SubscribeMessage('request_all_messages')
  async requestAllMessages(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: RequestAllMessagesDto,
  ) {
    const chat = await this.chatService.getChat({
      id: payload.chatId,
    });

    if (!chat) {
      throw new WsException('Chat with this ID not found');
    }

    this.validateRequestAllMsgPayload(payload);
    try {
      await socket.join(`room:${chat.id}`);
    } catch {
      this.logger.error('requestAllMessages: socket.join error');
    }

    const messages = await this.chatService.getAllMessages(
      {
        chatId: payload.chatId,
      },
      {
        before: payload.before,
        count: payload.count,
      },
    );

    return JSON.stringify(
      plainToClass(AckResponseDto, {
        success: true,
        data: {
          messages: messages.map(({ reply, ...msg }) => ({
            ...msg,
            reply: reply
              ? {
                  username: reply.user.name,
                  content: reply.content,
                }
              : null,
          })),
        },
      }),
    );
  }

  @SubscribeMessage('block_message')
  async blockMessage(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: BlockMsgDto,
  ) {
    const user = await this.chatService.getUser(payload.userId);

    if (!user) {
      throw new WsException('User not found');
    }

    if (user.role !== ChatUserRole.vendor) {
      throw new WsException('Operation is not permitted');
    }
    const blockedMsgContent = 'Blocked message';
    const result = await this.chatService.blockMessage(
      {
        id: payload.msgId,
      },
      {
        content: blockedMsgContent,
      },
    );

    if (!result) {
      throw new WsException('An error occurred during blocking a user');
    }

    this.server.to(`room:${payload.chatId}`).emit(
      'block_message',
      JSON.stringify({
        id: payload.msgId,
        content: blockedMsgContent,
      }),
    );
  }

  validateRequestAllMsgPayload(payload: RequestAllMessagesDto): void {
    const isValid = [payload.before, payload.after].filter((a) => a).length < 2;

    if (!isValid) {
      throw new WsException('Should be passed one of ["before", "after"]');
    }
  }
}
