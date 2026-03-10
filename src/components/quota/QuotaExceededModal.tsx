'use client';

/**
 * Quota Exceeded Modal Component
 *
 * 当用户配额用完时显示的提示弹窗
 */

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Upload, MessageSquare, Check, Zap, Headphones } from 'lucide-react';

interface QuotaExceededModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotaType: 'upload' | 'chat';
  quotaLimit: number;
  used: number;
}

export function QuotaExceededModal({
  isOpen,
  onClose,
  quotaType,
  quotaLimit,
  used,
}: QuotaExceededModalProps) {
  const router = useRouter();

  const title = quotaType === 'upload' ? '上传次数已达上限' : '聊天次数已达上限';
  const description =
    quotaType === 'upload' ? '您今天的 PDF 上传次数已达上限' : '您今天的 AI 聊天次数已达上限';

  const icon = quotaType === 'upload' ? Upload : MessageSquare;

  const benefits = [
    {
      icon: Upload,
      title: '每日 100 次 PDF 上传',
      description: '免费版仅 10 次',
    },
    {
      icon: MessageSquare,
      title: '每日 1000 次 AI 聊天',
      description: '免费版仅 50 次',
    },
    {
      icon: Headphones,
      title: '优先技术支持',
      description: '专属客户服务',
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-yellow-100 to-orange-100">
            <AlertTriangle className="h-6 w-6 text-yellow-600" />
          </div>
          <DialogTitle className="text-center text-xl">{title}</DialogTitle>
          <DialogDescription className="text-center pt-2">{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 配额统计 */}
          <div className="flex items-center justify-between rounded-lg border bg-slate-50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                <icon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">今日使用</p>
                <p className="text-xs text-gray-500">
                  {quotaType === 'upload' ? 'PDF 上传' : 'AI 聊天'}
                </p>
              </div>
            </div>
            <Badge variant="destructive" className="text-sm">
              {used} / {quotaLimit}
            </Badge>
          </div>

          {/* 升级提示 */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <h4 className="mb-3 text-sm font-semibold text-blue-900">
              升级到高级账户，解锁更多权益
            </h4>
            <div className="space-y-3">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-blue-600 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900">{benefit.title}</p>
                    <p className="text-xs text-blue-700">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col gap-3">
          <Button onClick={() => router.push('/pricing')} className="w-full">
            查看定价方案
          </Button>
          <Button onClick={onClose} variant="outline" className="w-full">
            稍后再说
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
