import { ChatController } from '@/controllers/chat.controller';

const controller = new ChatController();

export async function POST(req: Request) {
  return controller.sendMessage(req as any);
}
