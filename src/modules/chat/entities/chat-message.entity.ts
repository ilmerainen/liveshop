import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Chat } from './chat.entity';
import { ChatUser } from './chat-user.entity';
import { MsgLike } from './msg-like.entity';
import { MessageType } from '../types';

@Entity()
export class ChatMessage {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column('varchar')
  chatId: string;

  @Index()
  @Column('uuid')
  userId: string;

  @Column('varchar')
  content: string;

  @Index()
  @Column('int', {
    nullable: true,
  })
  replyTo?: number;

  @Column({
    type: 'enum',
    enum: MessageType,
    default: MessageType.text,
  })
  type: MessageType;

  @CreateDateColumn()
  createdAt: string;

  // #region Relations

  @ManyToOne(() => Chat, (chat) => chat.messages)
  chat?: Chat;

  @ManyToOne(() => ChatUser)
  user?: ChatUser;

  @ManyToOne(() => ChatMessage)
  @JoinColumn({
    name: 'replyTo',
  })
  reply?: ChatMessage;

  @OneToMany(() => MsgLike, (like) => like.message)
  likes?: MsgLike[];

  // #endregion
}
