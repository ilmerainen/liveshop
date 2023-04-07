import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Chat } from './chat.entity';
import { ChatUser } from './chat-user.entity';

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

  // #endregion
}
