// 直接测试 Supabase Admin API
const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('=== 测试 Supabase Admin API ===');
console.log('URL:', url);
console.log('Key 长度:', key?.length);

const supabase = createClient(url, key, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

(async () => {
  try {
    console.log('\n调用 listUsers()...');
    const { data, error } = await supabase.auth.admin.listUsers();
    
    console.log('\n=== 结果 ===');
    console.log('Error:', error);
    console.log('User Count:', data?.users?.length || 0);
    console.log('Users:', data?.users?.map(u => ({ id: u.id, email: u.email })));
    console.log('Total:', data?.total);
    console.log('Aud:', data?.aud);
  } catch (e) {
    console.error('异常:', e.message);
  }
})();
