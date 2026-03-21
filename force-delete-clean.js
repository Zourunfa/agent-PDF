// 强制清理用户的所有数据，然后删除 auth.users
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const userId = '612e5e77-b5ab-4643-b823-3fd5277d6151';

// 按照正确的删除顺序
const deleteOrder = [
  'conversation_messages',
  'pdf_conversations',
  'user_pdfs',
  'quota_usage',
  'quota_operations',
  'user_quotas',
  'user_sessions',
  'user_security_log', // 必须在 user_profiles 和 auth.users 之前删除
  'user_profiles',
];

(async () => {
  console.log('=== 强制删除用户数据 ===');
  console.log('用户 ID:', userId);
  console.log('');

  for (const table of deleteOrder) {
    try {
      console.log(`删除 ${table}...`);
      const { data, error, count } = await supabase
        .from(table)
        .delete()
        .eq('user_id', userId)
        .select('*', { count: 'exact' });

      if (error) {
        console.log(`  ❌ 失败: ${error.message}`);
      } else {
        console.log(`  ✓ 已删除 ${count || 0} 条数据`);
      }
    } catch (e) {
      console.log(`  ❌ 异常: ${e.message}`);
    }
  }

  // 最后删除 auth.users
  console.log('\n删除 auth.users...');
  try {
    const { error } = await supabase.auth.admin.deleteUser(userId);
    
    if (error) {
      console.log(`  ❌ 失败: ${error.message}`);
      console.log(`\n完整错误:`, error);
    } else {
      console.log(`  ✓ auth.users 已删除`);
    }
  } catch (e) {
    console.log(`  ❌ 异常: ${e.message}`);
  }

  // 验证
  console.log('\n=== 验证 ===');
  const { data: authUsers } = await supabase.auth.admin.listUsers();
  const user = authUsers?.users?.find(u => u.id === userId);
  
  if (user) {
    console.log('❌ 用户仍然存在于 auth.users');
  } else {
    console.log('✅ 用户已完全删除');
  }
})();
