import { AuthController } from '@/controllers/auth.controller';

const controller = new AuthController();

export async function POST(req: Request) {
  return controller.forgotPassword(req as any);
}
