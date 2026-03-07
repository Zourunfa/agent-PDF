import type { Metadata } from "next";
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import "./globals.css";

export const metadata: Metadata = {
  title: "PDF AI Chat - 智能文档对话助手",
  description: "上传 PDF 文档并与 AI 进行智能对话",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <AntdRegistry>
          <ConfigProvider
            locale={zhCN}
            theme={{
              token: {
                colorPrimary: '#6366F1',
                colorSuccess: '#10B981',
                colorWarning: '#F59E0B',
                colorError: '#EF4444',
                colorInfo: '#3B82F6',
                borderRadius: 8,
                fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              },
            }}
          >
            {children}
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
