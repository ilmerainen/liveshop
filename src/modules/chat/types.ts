import { ChatMessage } from './entities/chat-message.entity';

export enum ChatUserRole {
  vendor = 'vendor',
  user = 'user',
}

export enum LikeMsgAction {
  add = 'add',
  delete = 'delete',
}

export type LikesOutput = {
  count: number;
  likedByMe: boolean;
};

export type MessageWithLikes = ChatMessage & {
  likesMeta: LikesOutput;
};

export enum MessageType {
  sticker = 'sticker',
  text = 'text',
}
