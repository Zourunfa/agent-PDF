// 检查用户的所有依赖数据
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const userId = '612e5e77-b5ab-4643-b823-3fd5277d6151';
const email = '1804491927@qq.com';

const tables = [
  'conversation_messages',
  'pdf_conversations',
  'user_pdfs',
  'quota_usage',
  'quota_operations',
  'user_quotas',
  'user_sessions',
  'user_security_log',
  'user_profiles',
];

(async () => {
  console.log('=== 检查用户依赖数据 ===');
  console.log('用户 ID:', userId);
  console.log('用户邮箱:', email);
  console.log('');

  const dependencies = [];

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
        dependencies.push({ table, count });
      } else {
        console.log(`✓ ${table}: 无数据`);
      }
    } catch (e) {
      console.log(`❌ ${table}: ${e.message}`);
    }
  }

  // 检查 auth.users
  console.log('\n=== 检查 auth.users ===');
  const { data: authUsers } = await supabase.auth.admin.listUsers();
  const authUser = authUsers?.users?.find(u => u.id === userId);
  
  if (authUser) {
    console.log('⚠️  auth.users: 用户存在');
    console.log('   邮箱:', authUser.email);
    console.log('   创建时间:', authUser.created_at);
  } else {
    console.log('✓ auth.users: 用户不存在');
  }

  // 总结
  console.log('\n=== 总结 ===');
  const totalDeps = dependencies.reduce((sum, d) => sum + d.count, 0);
  console.log(`需要清理的依赖数据总数: ${totalDeps}`);
  
  if (dependencies.length > 0) {
    console.log('\n包含数据的表:');
    dependencies.forEach(d => {
      console.log(`  - ${d.table}: ${d.count} 条`);
    });
    console.log('\n❌ 必须先清理这些数据才能删除 auth.users！');
  } else {
    console.log('\n✓ 所有依赖数据已清理，可以安全删除 auth.users');
  }
})();
