import { AdminController } from '@/controllers/admin.controller';

const controller = new AdminController();

export async function POST(req: Request) {
  return controller.login(req as any);
}
