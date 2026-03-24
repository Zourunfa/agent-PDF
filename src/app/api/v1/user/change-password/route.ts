import { UserController } from '@/controllers/user.controller';

const controller = new UserController();

export async function POST(req: Request) {
  return controller.changePassword(req as any);
}
