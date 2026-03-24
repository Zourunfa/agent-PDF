import { PDFController } from '@/controllers/pdf.controller';

const controller = new PDFController();

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return controller.getById(req as any, { params });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return controller.delete(req as any, { params });
}
