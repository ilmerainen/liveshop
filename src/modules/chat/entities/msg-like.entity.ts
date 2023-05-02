import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ChatMessage } from './chat-message.entity';
import { ChatUser } from './chat-user.entity';

@Entity()
@Index(['messageId', 'userId'], {
  unique: true,
})
export class MsgLike {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('uuid')
  userId: string;

  @Column('int')
  messageId: number;

  @CreateDateColumn()
  createdAt: Date;

  // #region Relations

  @ManyToOne(() => ChatMessage, {
    onDelete: 'CASCADE',
  })
  message?: ChatMessage;

  @ManyToOne(() => ChatUser, {
    onDelete: 'CASCADE',
  })
  user?: ChatUser;

  // #endregion
}
