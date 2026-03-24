import { AdminController } from '@/controllers/admin.controller';

const controller = new AdminController();

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return controller.getUserById(req as any, { params });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return controller.deleteUser(req as any, { params });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return controller.updateUserQuota(req as any, { params });
}
