// 强制删除用户的所有数据
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const userId = 'ca9912fb-0616-4706-a823-48f6cdbfb7f7';

// 按照依赖关系顺序删除
const deleteOrder = [
  'conversation_messages',  // 依赖 pdf_conversations
  'pdf_conversations',      // 依赖 user_pdfs
  'user_pdfs',              // 独立
  'quota_usage',            // 独立
  'quota_operations',       // 独立
  'user_quotas',            // 独立
  'user_sessions',          // 独立
  'user_security_log',      // 独立
  'user_profiles',          // 依赖 auth.users（但最后删）
];

(async () => {
  console.log('=== 强制删除用户数据 ===');
  console.log('用户 ID:', userId);
  console.log('');

  for (const table of deleteOrder) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .delete()
        .eq('user_id', userId)
        .select('*', { count: 'exact' });

      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✓ ${table}: 删除 ${count || 0} 条数据`);
      }
    } catch (e) {
      console.log(`❌ ${table}: ${e.message}`);
    }
  }

  // 最后删除 auth.users
  console.log('');
  console.log('=== 删除 auth.users ===');
  try {
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) {
      console.log('❌ auth.users:', error.message);
    } else {
      console.log('✓ auth.users: 用户已删除');
    }
  } catch (e) {
    console.log('❌ auth.users:', e.message);
  }

  console.log('');
  console.log('=== 验证 ===');
  const { data: authUsers } = await supabase.auth.admin.listUsers();
  const user = authUsers?.users?.find(u => u.id === userId);
  if (user) {
    console.log('❌ 用户仍然存在！');
  } else {
    console.log('✅ 用户已完全删除');
  }
})();
