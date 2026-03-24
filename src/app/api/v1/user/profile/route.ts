import { UserController } from '@/controllers/user.controller';

const controller = new UserController();

export async function GET(req: Request) {
  return controller.getProfile(req as any);
}

export async function PATCH(req: Request) {
  return controller.updateProfile(req as any);
}
