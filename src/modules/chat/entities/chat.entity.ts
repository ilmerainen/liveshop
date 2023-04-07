import { CreateDateColumn, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { ChatMessage } from './chat-message.entity';

@Entity()
export class Chat {
  @PrimaryColumn('varchar')
  id: string;

  @CreateDateColumn()
  createdAt: string;

  // #region Relations

  @OneToMany(() => ChatMessage, (message) => message.chat, {
    onDelete: 'CASCADE',
  })
  messages?: ChatMessage[];

  // #endregion
}
