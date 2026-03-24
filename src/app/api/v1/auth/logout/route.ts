import { AuthController } from '@/controllers/auth.controller';

const controller = new AuthController();

export async function POST() {
  return controller.logout();
}
