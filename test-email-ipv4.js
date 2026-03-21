// 测试邮件发送（强制 IPv4）
const nodemailer = require('nodemailer');
require('dotenv').config({ path: '.env.local' });

// 强制使用 IPv4
process.env.NODE_OPTIONS = '--dns-result-order=ipv4first';

async function testEmail() {
  console.log('=== 测试邮件发送 ===');
  console.log('Email User:', process.env.EMAIL_USER);
  console.log('Email Service:', process.env.EMAIL_SERVICE);
  console.log('');

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false
    },
    // 强制 IPv4
    family: 4,
    connectionTimeout: 10000,
    greetingTimeout: 5000,
    socketTimeout: 10000,
  });

  console.log('尝试连接 Gmail SMTP...');

  try {
    // 验证连接
    await transporter.verify();
    console.log('✅ SMTP 连接成功！');

    // 发送测试邮件
    const info = await transporter.sendMail({
      from: `"PDF AI Chat" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: '测试邮件 - IPv4 连接',
      text: '这是一封测试邮件，确认 IPv4 连接正常工作。',
    });

    console.log('✅ 邮件发送成功！');
    console.log('Message ID:', info.messageId);
  } catch (error) {
    console.error('❌ 失败:', error.message);

    if (error.message.includes('2404:6800:4008') || error.message.includes('EHOSTUNREACH')) {
      console.log('');
      console.log('⚠️  仍然是 IPv6 连接错误！');
      console.log('');
      console.log('解决方案：');
      console.log('1. 在 ~/.npmrc 中添加：')
      console.log('   prefer-online=true');
      console.log('   fetch-retries=2');
      console.log('');
      console.log('2. 或者使用其他邮件服务（如 Mailgun、SendGrid）');
    }
  }
}

testEmail();
