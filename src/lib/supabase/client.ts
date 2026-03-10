// Supabase 浏览器客户端
// 用于客户端组件的 Supabase 客户端实例

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './database.types';

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// 导出单例客户端
export const supabase = createClient();
