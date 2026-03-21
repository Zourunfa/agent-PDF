// 验证 JWT token 内容
function parseJWT(token) {
  const parts = token.split('.');
  if (parts.length !== 3) return { error: 'Invalid JWT format' };
  
  const payload = parts[1];
  const decoded = Buffer.from(payload, 'base64').toString();
  return JSON.parse(decoded);
}

const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impnc3htaW9qaWpqanB2YmZuZHZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwODI5NzIsImV4cCI6MjA4ODY1ODk3Mn0.n8ZaSzQDH-LVPB2Y7j6mv4AT0iwuCUE_riP4jowsnts';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impnc3htaW9qaWpqanB2YmZuZHZuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzA4Mjk3MiwiZXhwIjoyMDg4NjU4OTcyfQ.czbJkR1r-QnvaBR1WV3SkeP88379ANf9fA9RUE3dNEs';

console.log('=== Anon Key 解析 ===');
const anonPayload = parseJWT(anonKey);
console.log(JSON.stringify(anonPayload, null, 2));

console.log('\n=== Service Role Key 解析 ===');
const servicePayload = parseJWT(serviceRoleKey);
console.log(JSON.stringify(servicePayload, null, 2));

console.log('\n=== 验证 ===');
console.log('Project Ref:', anonPayload.ref);
console.log('Anon Role:', anonPayload.role);
console.log('Service Role:', servicePayload.role);
console.log('是否指向同一项目:', anonPayload.ref === servicePayload.ref ? '✅ 是' : '❌ 否');

console.log('\n=== 对比 .env.local ===');
const fs = require('fs');
const envPath = '/Users/a1804491927/Code/open-source/agent-PDF/.env.local';
const envContent = fs.readFileSync(envPath, 'utf-8');
const currentServiceKey = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();

if (currentServiceKey) {
  const currentPayload = parseJWT(currentServiceKey);
  console.log('当前配置的 ref:', currentPayload.ref);
  console.log('Dashboard 的 ref:', servicePayload.ref);
  console.log('Ref 是否一致:', currentPayload.ref === servicePayload.ref ? '✅ 一致' : '❌ 不一致');
  console.log('Key 是否一致:', currentServiceKey === serviceRoleKey ? '✅ 完全一致' : '❌ 不一致');
} else {
  console.log('❌ 未找到 SUPABASE_SERVICE_ROLE_KEY');
}
