// 游客配额不足提示模态框
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Check, Gift, FileText, History, Zap, Headphones } from 'lucide-react';

interface GuestLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GuestLimitModal({ isOpen, onClose }: GuestLimitModalProps) {
  const benefits = [
    {
      icon: FileText,
      title: '无限PDF上传和AI对话',
      description: '不再受次数限制，自由使用',
    },
    {
      icon: History,
      title: '保存您的文档历史',
      description: '随时随地查看历史记录',
    },
    {
      icon: Zap,
      title: '多设备同步使用',
      description: '手机、电脑、平板无缝切换',
    },
    {
      icon: Headphones,
      title: '专属客户支持',
      description: '遇到问题随时联系我们',
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-indigo-100">
            <Gift className="h-8 w-8 text-blue-600" />
          </div>
          <DialogTitle className="text-center text-2xl">您已体验完免费次数！</DialogTitle>
          <DialogDescription className="text-center pt-2">注册账户，享受更多权益</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100">
                <benefit.icon className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{benefit.title}</p>
                <p className="text-xs text-gray-500">{benefit.description}</p>
              </div>
              <Check className="h-4 w-4 text-green-500 shrink-0 mt-1" />
            </div>
          ))}
        </div>

        <DialogFooter className="flex-col gap-3">
          <Button asChild className="w-full">
            <Link href="/register">立即注册（免费）</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/login">已有账户？登录</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
