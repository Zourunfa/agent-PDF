// 检查当前配置
const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.log('❌ .env.local 文件不存在');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf-8');
const supabaseUrl = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1];
const serviceKey = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1];

console.log('=== 当前配置 ===');
console.log('Supabase URL:', supabaseUrl || '❌ 未设置');
console.log('Service Key 长度:', serviceKey?.length || 0);
console.log('Service Key 格式:', serviceKey?.includes('.') ? '✅ 正确' : '❌ 错误');
console.log('');
console.log('⚠️ 请确认这个 URL 是你看到用户数据的项目！');
console.log('如果不是，需要修改 .env.local 中的 NEXT_PUBLIC_SUPABASE_URL');
