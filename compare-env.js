// 对比环境变量
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('=== 脚本环境变量 ===');
console.log('URL:', url);
console.log('Key 长度:', key?.length);
console.log('Key 前30字符:', key?.substring(0, 30));

// 解析 JWT
const parts = key.split('.');
if (parts.length === 3) {
  const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
  console.log('Key Payload:');
  console.log('  iss:', payload.iss);
  console.log('  ref:', payload.ref);
  console.log('  role:', payload.role);
}

// 测试 API
const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false }
});

(async () => {
  console.log('\n=== 测试 listUsers ===');
  const { data, error } = await supabase.auth.admin.listUsers();
  console.log('返回用户数:', data?.users?.length || 0);
  console.log('错误:', error?.message);
})();
