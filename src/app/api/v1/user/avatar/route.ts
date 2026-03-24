import { UserController } from '@/controllers/user.controller';

const controller = new UserController();

export async function POST(req: Request) {
  return controller.uploadAvatar(req as any);
}

export async function DELETE(req: Request) {
  return controller.deleteAvatar(req as any);
}
