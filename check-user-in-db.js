// 检查数据库中的用户数据
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const email = '1804491927@qq.com';

(async () => {
  console.log('=== 检查用户数据 ===');
  console.log('邮箱:', email);
  console.log('');

  // 1. 检查 auth.users
  console.log('[1] 检查 auth.users...');
  const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers();
  
  if (listError) {
    console.log('❌ 获取 auth.users 失败:', listError.message);
  } else {
    console.log('✓ auth.users 总数:', authUsers.users?.length || 0);
    
    const targetAuthUser = authUsers.users?.find(u => u.email === email);
    if (targetAuthUser) {
      console.log('✓ 找到用户:');
      console.log('   ID:', targetAuthUser.id);
      console.log('   Email:', targetAuthUser.email);
      console.log('   Created:', targetAuthUser.created_at);
      console.log('   Email Confirmed:', targetAuthUser.email_confirmed_at);
    } else {
      console.log('❌ 未找到用户');
    }
    
    // 显示所有用户
    if (authUsers.users && authUsers.users.length > 0) {
      console.log('\n所有 auth.users:');
      authUsers.users.forEach(u => {
        console.log(`  - ${u.email} (${u.id})`);
      });
    }
  }

  // 2. 检查 user_profiles
  console.log('\n[2] 检查 user_profiles...');
  const { data: profiles, error: profilesError } = await supabase
    .from('user_profiles')
    .select('*');
  
  if (profilesError) {
    console.log('❌ 获取 user_profiles 失败:', profilesError.message);
  } else {
    console.log('✓ user_profiles 总数:', profiles?.length || 0);
    
    const targetProfile = profiles?.find(p => p.email === email);
    if (targetProfile) {
      console.log('✓ 找到用户资料:');
      console.log('   ID:', targetProfile.id);
      console.log('   Email:', targetProfile.email);
      console.log('   Name:', targetProfile.name);
      console.log('   Role:', targetProfile.role);
      console.log('   Email Verified:', targetProfile.email_verified);
    } else {
      console.log('❌ 未找到用户资料');
    }
    
    // 显示所有用户资料
    if (profiles && profiles.length > 0) {
      console.log('\n所有 user_profiles:');
      profiles.forEach(p => {
        console.log(`  - ${p.email} (${p.id})`);
      });
    }
  }

  // 3. 尝试直接通过 ID 获取用户
  if (targetAuthUser) {
    console.log('\n[3] 直接通过 ID 获取用户...');
    const { data: userById, error: getByIdError } = await supabase.auth.admin.getUserById(targetAuthUser.id);
    
    if (getByIdError) {
      console.log('❌ getUserById 失败:', getByIdError.message);
    } else {
      console.log('✓ getUserById 成功:', userById.user?.email);
    }
  }
})();
