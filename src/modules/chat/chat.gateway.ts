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
import { ChatUserRole, MessageType } from './types';
import { CreateChatDto } from './dto/create-chat.dto';
import { SendLikeDto } from './dto/send-like.dto';
import { LikeMessageDto } from './dto/like-message.dto';

@UsePipes(
  new ValidationPipe({
    transform: true,
  }),
)
@UseFilters(WebsocketExceptionsFilter)
@WebSocketGateway({
  namespace: 'chat',
  cors: true,
})
export class ChatGateway {
  private readonly stickersFolderUrl =
    'https://liveshopping.fra1.cdn.digitaloceanspaces.com/stickers/';
  private readonly logger = new Logger(ChatGateway.name);

  constructor(private readonly chatService: ChatService) {}

  @WebSocketServer()
  server: Server;

  @SubscribeMessage('send_message')
  async listenForMessages(@MessageBody() payload: ChatMessageDto) {
    this.validateSendMessage(payload);

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
      type: payload.type,
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
              type: reply.type,
            }
          : null,
        likes: message.likesMeta,
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

  private validateSendMessage(payload: ChatMessageDto) {
    if (payload.type === MessageType.text && payload.content.length >= 200) {
      throw new WsException(
        'Content of type "text" should be <= 200 characters',
      );
    }

    if (
      payload.type === MessageType.sticker &&
      payload.content.length >= 3000
    ) {
      throw new WsException(
        'Content of type "sticker" should be <= 3000 characters',
      );
    }

    if (
      payload.type === MessageType.sticker &&
      !payload.content.startsWith(this.stickersFolderUrl)
    ) {
      throw new WsException('Denied URL');
    }
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
        userId: payload.userId,
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
                  type: reply.type,
                }
              : null,
            likes: msg.likesMeta,
          })),
        },
      }),
    );
  }

  @SubscribeMessage('send_like')
  sendLike(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: SendLikeDto,
  ) {
    socket.to(`room:${payload.chatId}`).emit(
      'send_like',
      JSON.stringify({
        userId: payload.userId,
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

  @SubscribeMessage('like_message')
  async likeMessage(
    @MessageBody() payload: LikeMessageDto,
    @ConnectedSocket() socket: Socket,
  ) {
    const count = await this.chatService.likeMessage({
      messageId: payload.messageId,
      userId: payload.userId,
      action: payload.action,
    });
    socket.to(`room:${payload.chatId}`).emit(
      'like_message',
      JSON.stringify({
        messageId: payload.messageId,
        userId: payload.userId,
        count,
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
