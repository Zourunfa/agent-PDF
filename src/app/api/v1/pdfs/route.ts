import { PDFController } from '@/controllers/pdf.controller';

const controller = new PDFController();

export async function POST(req: Request) {
  return controller.upload(req as any);
}

export async function GET(req: Request) {
  return controller.getList(req as any);
}
