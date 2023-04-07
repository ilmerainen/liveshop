import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from './chat.service';

describe('Chat', () => {
  let provider: ChatService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChatService],
    }).compile();

    provider = module.get<ChatService>(ChatService);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
