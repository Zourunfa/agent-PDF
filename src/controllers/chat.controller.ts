import { NextRequest, NextResponse } from 'next/server';
import { ChatService } from '@/services/chat.service';
import { AuthService } from '@/services/auth.service';
import { handleError } from '@/middlewares/error-handler.middleware';
import { successResponse } from '@/lib/utils/response';
import { SendMessageSchema, GetConversationHistorySchema } from '@/dtos/chat.dto';
import { UnauthorizedError } from '@/lib/utils/errors';

/**
 * 聊天控制器
 * 处理 AI 对话相关的 HTTP 请求
 */
export class ChatController {
  private chatService: ChatService;
  private authService: AuthService;

  constructor() {
    this.chatService = new ChatService();
    this.authService = new AuthService();
  }

  /**
   * 获取当前用户 ID
   */
  private async getCurrentUserId(): Promise<string> {
    const user = await this.authService.getCurrentUser();
    if (!user) {
      throw new UnauthorizedError('请先登录');
    }
    return user.id;
  }

  /**
   * POST /api/v1/chat - 发送消息
   */
  async sendMessage(req: NextRequest): Promise<NextResponse> {
    try {
      const userId = await this.getCurrentUserId();

      const body = await req.json();
      const validated = SendMessageSchema.parse(body);

      const result = await this.chatService.sendMessage(userId, validated);

      return successResponse(result, 201);
    } catch (error) {
      return handleError(error);
    }
  }

  /**
   * GET /api/v1/pdfs/[id]/conversations - 获取对话历史
   */
  async getConversationHistory(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ): Promise<NextResponse> {
    try {
      const userId = await this.getCurrentUserId();
      const { id: pdfId } = await params;

      const searchParams = req.nextUrl.searchParams;
      const options = {
        limit: parseInt(searchParams.get('limit') || '50'),
        offset: parseInt(searchParams.get('offset') || '0'),
      };

      const result = await this.chatService.getConversationHistory(
        userId,
        pdfId,
        options
      );

      return successResponse(result);
    } catch (error) {
      return handleError(error);
    }
  }

  /**
   * DELETE /api/v1/pdfs/[id]/conversations - 删除对话历史
   */
  async deleteConversation(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ): Promise<NextResponse> {
    try {
      const userId = await this.getCurrentUserId();
      const { id: pdfId } = await params;

      const result = await this.chatService.deleteConversation(userId, pdfId);

      return successResponse(result);
    } catch (error) {
      return handleError(error);
    }
  }
}
