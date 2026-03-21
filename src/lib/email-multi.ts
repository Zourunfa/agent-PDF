// 多邮件服务支持
import nodemailer from 'nodemailer';
import dns from 'dns';

// 强制使用 IPv4
dns.setDefaultResultOrder('ipv4first');

let transporter: nodemailer.Transporter | null = null;
let emailProvider: string = 'none';

// 初始化邮件服务
export function initializeEmailService() {
  const emailService = process.env.EMAIL_SERVICE?.toLowerCase();

  // Gmail 配置
  if (emailService === 'gmail') {
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2'
      },
      family: 4,
      connectionTimeout: 15000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });
    emailProvider = 'Gmail';
    console.log('[Email] 邮件服务已配置：Gmail SMTP (端口 465)');
  }

  // QQ 邮箱配置（中国用户推荐）
  else if (emailService === 'qq') {
    transporter = nodemailer.createTransport({
      host: 'smtp.qq.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false
      },
      family: 4,
      connectionTimeout: 15000,
    });
    emailProvider = 'QQ Mail';
    console.log('[Email] 邮件服务已配置：QQ Mail SMTP');
  }

  // 163 邮箱配置
  else if (emailService === '163') {
    transporter = nodemailer.createTransport({
      host: 'smtp.163.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false
      },
      family: 4,
      connectionTimeout: 15000,
    });
    emailProvider = '163 Mail';
    console.log('[Email] 邮件服务已配置：163 Mail SMTP');
  }

  // 126 邮箱配置
  else if (emailService === '126') {
    transporter = nodemailer.createTransport({
      host: 'smtp.126.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false
      },
      family: 4,
      connectionTimeout: 15000,
    });
    emailProvider = '126 Mail';
    console.log('[Email] 邮件服务已配置：126 Mail SMTP');
  }

  // SendGrid 配置（国际服务）
  else if (emailService === 'sendgrid') {
    transporter = nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 465,
      secure: true,
      auth: {
        user: 'apikey',
        pass: process.env.EMAIL_PASSWORD,
      },
      family: 4,
      connectionTimeout: 15000,
    });
    emailProvider = 'SendGrid';
    console.log('[Email] 邮件服务已配置：SendGrid SMTP');
  }

  // Mailgun 配置（国际服务）
  else if (emailService === 'mailgun') {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SMTP_HOST || 'smtp.mailgun.org',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      family: 4,
      connectionTimeout: 15000,
    });
    emailProvider = 'Mailgun';
    console.log('[Email] 邮件服务已配置：Mailgun SMTP');
  }

  else {
    console.log('[Email] 未配置邮件服务或服务类型不支持');
    console.log('[Email] 支持的服务：gmail, qq, 163, 126, sendgrid, mailgun');
  }
}

// 初始化邮件服务
initializeEmailService();

export function getEmailProvider(): string {
  return emailProvider;
}

// 导出原有的发送函数（兼容）
export { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail, isEmailServiceAvailable } from './email';
