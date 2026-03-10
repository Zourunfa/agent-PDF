// 游客配额指示器组件
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Gift } from 'lucide-react';

interface GuestQuota {
  remaining: number;
  limit: number;
  used: number;
  canProceed: boolean;
}

export function GuestQuotaIndicator() {
  const [quota, setQuota] = useState<GuestQuota | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchQuota() {
      try {
        const response = await fetch('/api/guest/quota');
        const data = await response.json();
        if (data.success) {
          setQuota(data);
        }
      } catch (error) {
        console.error('Error fetching guest quota:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchQuota();
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse flex items-center gap-2">
        <div className="h-6 w-24 bg-gray-200 rounded-full"></div>
      </div>
    );
  }

  if (!quota) {
    return null;
  }

  const percentage = (quota.remaining / quota.limit) * 100;
  const variant =
    quota.remaining > 1 ? 'default' : quota.remaining === 1 ? 'secondary' : 'destructive';

  const variantStyles = {
    default: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
    secondary: 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100',
    destructive: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100',
  };

  if (quota.remaining === 0) {
    return (
      <Badge className={variantStyles[variant]} variant="outline">
        <Gift className="h-3 w-3 mr-1" />
        <span>已达体验上限</span>
        <Link href="/register">
          <Button size="sm" variant="ghost" className="ml-2 h-6 text-xs">
            注册账户
          </Button>
        </Link>
      </Badge>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Badge className={variantStyles[variant]} variant="outline">
        <Gift className="h-3 w-3 mr-1" />
        <span>剩余 {quota.remaining} 次免费体验</span>
      </Badge>
      {quota.remaining <= 1 && (
        <Link href="/register">
          <Button size="sm" variant="ghost" className="h-7 text-xs">
            注册账户
          </Button>
        </Link>
      )}
    </div>
  );
}
