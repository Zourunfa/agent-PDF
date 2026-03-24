import { ConversationRepository } from '@/repositories/conversation.repository';
import { PDFRepository } from '@/repositories/pdf.repository';
import { QuotaRepository } from '@/repositories/quota.repository';
import { QuotaExceededError, NotFoundError, AIServiceError } from '@/lib/utils/errors';
import type { SendMessageDTO, SendMessageResult, ChatMessage } from '@/dtos/chat.dto';
import type { Message } from '@/models/conversation.model';

/**
 * 聊天服务
 * 处理 AI 对话相关的业务逻辑
 */
export class ChatService {
  constructor(
    private convRepo: ConversationRepository = new ConversationRepository(),
    private pdfRepo: PDFRepository = new PDFRepository(),
    private quotaRepo: QuotaRepository = new QuotaRepository()
  ) {}

  /**
   * 发送消息并获取 AI 回复
   */
  async sendMessage(
    userId: string,
    dto: SendMessageDTO
  ): Promise<SendMessageResult> {
    // 1. 检查 PDF 是否存在且属于用户
    const pdf = await this.pdfRepo.findById(dto.pdfId, userId);
    if (!pdf) {
      throw new NotFoundError('PDF not found or access denied');
    }

    // 2. 检查配额
    const quotaResult = await this.quotaRepo.checkQuota(userId, 'ai_calls_daily');
    if (!quotaResult.allowed) {
      throw new QuotaExceededError(
        quotaResult.reason || 'Daily AI calls limit exceeded',
        {
          quotaType: 'ai_calls_daily',
          limit: quotaResult.limit,
          current: quotaResult.current,
        }
      );
    }

    // 3. 创建或获取对话
    const conversation = await this.convRepo.createOrGet(dto.pdfId, userId);

    // 4. 保存用户消息
    const userMessage = await this.convRepo.addMessage({
      conversationId: conversation.id,
      pdfId: dto.pdfId,
      userId,
      role: 'user',
      content: dto.message,
    });

    // 5. 调用 AI 服务获取回复
    let assistantContent: string;
    try {
      assistantContent = await this.callAIService(dto.message, pdf.textContent);
    } catch (error) {
      // AI 服务失败，记录但不删除用户消息
      throw new AIServiceError(
        error instanceof Error ? error.message : 'Failed to get AI response'
      );
    }

    // 6. 保存 AI 回复
    const assistantMessage = await this.convRepo.addMessage({
      conversationId: conversation.id,
      pdfId: dto.pdfId,
      userId,
      role: 'assistant',
      content: assistantContent,
    });

    // 7. 消耗配额
    await this.quotaRepo.consumeQuota(userId, 'ai_calls_daily', 1);

    // 8. 返回结果
    return {
      conversationId: conversation.id,
      userMessage: {
        id: userMessage.id,
        role: 'user',
        content: userMessage.content,
        createdAt: userMessage.createdAt,
      },
      assistantMessage: {
        id: assistantMessage.id,
        role: 'assistant',
        content: assistantMessage.content,
        createdAt: assistantMessage.createdAt,
      },
    };
  }

  /**
   * 获取对话历史
   */
  async getConversationHistory(
    userId: string,
    pdfId: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<{
    conversationId: string;
    pdfId: string;
    messages: ChatMessage[];
    total: number;
    hasMore: boolean;
  }> {
    // 1. 检查 PDF 是否存在且属于用户
    const pdf = await this.pdfRepo.findById(pdfId, userId);
    if (!pdf) {
      throw new NotFoundError('PDF not found or access denied');
    }

    // 2. 获取对话
    const conversation = await this.convRepo.findByPdfId(pdfId, userId);
    if (!conversation) {
      return {
        conversationId: '',
        pdfId,
        messages: [],
        total: 0,
        hasMore: false,
      };
    }

    // 3. 获取消息列表
    const { messages, total } = await this.convRepo.getMessages(conversation.id, {
      limit: options.limit || 50,
      offset: options.offset || 0,
      sortOrder: 'asc',
    });

    return {
      conversationId: conversation.id,
      pdfId,
      messages: messages.map((msg) => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
        createdAt: msg.createdAt,
      })),
      total,
      hasMore: (options.offset || 0) + messages.length < total,
    };
  }

  /**
   * 删除对话历史
   */
  async deleteConversation(
    userId: string,
    pdfId: string
  ): Promise<{ message: string }> {
    // 1. 检查 PDF 是否存在且属于用户
    const pdf = await this.pdfRepo.findById(pdfId, userId);
    if (!pdf) {
      throw new NotFoundError('PDF not found or access denied');
    }

    // 2. 删除对话及其消息
    await this.convRepo.deleteByPdf(pdfId, userId);

    return {
      message: 'Conversation deleted successfully',
    };
  }

  /**
   * 调用 AI 服务
   * 这是一个抽象方法，实际实现需要集成具体的 AI 服务
   */
  private async callAIService(
    userMessage: string,
    pdfContext: string | null
  ): Promise<string> {
    // 这里需要集成实际的 AI 服务
    // 例如：OpenAI、Claude、通义千问等

    // 临时返回一个占位符响应
    // 实际实现中应该调用 AI API
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: userMessage,
        context: pdfContext,
      }),
    });

    if (!response.ok) {
      throw new AIServiceError('AI service request failed');
    }

    const data = await response.json();
    return data.response || data.message || 'Sorry, I could not generate a response.';
  }
}
