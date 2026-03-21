const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

(async () => {
  console.log('=== 验证数据库用户 ===');
  
  // 检查 auth.users
  const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers();
  
  if (listError) {
    console.log('❌ 获取失败:', listError.message);
  } else {
    console.log('✓ auth.users 总数:', authUsers.users?.length || 0);
    
    if (authUsers.users && authUsers.users.length > 0) {
      console.log('\n用户列表:');
      authUsers.users.forEach(u => {
        console.log(`  - ${u.email} (${u.id})`);
        console.log(`    验证状态: ${u.email_confirmed_at ? '已验证' : '未验证'}`);
      });
    }
  }

  // 检查 user_profiles
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('*');
  
  console.log('\n✓ user_profiles 总数:', profiles?.length || 0);
  
  if (profiles && profiles.length > 0) {
    console.log('\n用户资料列表:');
    profiles.forEach(p => {
      console.log(`  - ${p.email} (${p.id})`);
      console.log(`    姓名: ${p.name}, 角色: ${p.role}`);
    });
  }
})();
