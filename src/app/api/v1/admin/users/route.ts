import { AdminController } from '@/controllers/admin.controller';

const controller = new AdminController();

export async function GET(req: Request) {
  return controller.getUserList(req as any);
}
