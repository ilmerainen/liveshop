import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ChatMessage } from './chat-message.entity';
import { ChatUserRole } from '../types';

@Entity()
export class ChatUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  role: ChatUserRole;

  @Column({
    default: false,
  })
  blocked: boolean;

  // #region Relations

  @OneToMany(() => ChatMessage, (message) => message.user, {
    onDelete: 'CASCADE',
  })
  messages?: ChatMessage[];

  // #endregion
}
