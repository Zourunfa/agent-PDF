// 检查用户在所有表中的数据
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const userId = 'ca9912fb-0616-4706-a823-48f6cdbfb7f7';
const tables = [
  'user_profiles',
  'user_pdfs',
  'pdf_conversations',
  'conversation_messages',
  'user_quotas',
  'quota_usage',
  'quota_operations',
  'user_sessions',
  'user_security_log',
];

(async () => {
  console.log('=== 检查用户数据残留 ===');
  console.log('用户 ID:', userId);
  console.log('用户邮箱: 1804491927@qq.com');
  console.log('');

  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else if (count > 0) {
        console.log(`⚠️  ${table}: ${count} 条数据`);
      } else {
        console.log(`✓ ${table}: 无数据`);
      }
    } catch (e) {
      console.log(`❌ ${table}: ${e.message}`);
    }
  }

  // 检查 auth.users
  console.log('');
  console.log('=== 检查 auth.users ===');
  const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers();
  if (!listError) {
    const user = authUsers.users.find(u => u.id === userId);
    if (user) {
      console.log('⚠️  auth.users: 用户存在');
      console.log('   邮箱:', user.email);
      console.log('   创建时间:', user.created_at);
      console.log('   邮箱验证:', user.email_confirmed_at);
    } else {
      console.log('✓ auth.users: 用户不存在');
    }
  } else {
    console.log('❌ 无法查询 auth.users:', listError.message);
  }
})();
