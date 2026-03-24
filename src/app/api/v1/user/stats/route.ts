import { UserController } from '@/controllers/user.controller';

const controller = new UserController();

export async function GET(req: Request) {
  return controller.getStats(req as any);
}
