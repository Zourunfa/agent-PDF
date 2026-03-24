import { AuthController } from '@/controllers/auth.controller';

const controller = new AuthController();

export async function GET() {
  return controller.me();
}
