/**
 * App Layout Component - 科幻风格
 */

"use client";

import React from "react";
import { PDFProvider } from "@/contexts/PDFContext";
import { ChatProvider } from "@/contexts/ChatContext";
import { PDFList } from "@/components/pdf/PDFList";
import { PDFViewer } from "@/components/pdf/PDFViewer";
import { PDFUploader } from "@/components/pdf/PDFUploader";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { FileText, Zap } from "lucide-react";

interface AppLayoutProps {
  children?: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <PDFProvider>
      <ChatProvider>
        <div className="flex h-screen flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
          {/* Header - 科幻风格 */}
          <header className="h-16 glass-strong border-b border-cyan-500/20 relative overflow-hidden">
            {/* 扫描线动画 */}
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />
            
            <div className="relative flex h-full items-center justify-between px-8">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full animate-pulse-glow" />
                  <div className="relative flex items-center justify-center h-10 w-10 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-lg neon-glow-cyan">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-lg font-bold neon-text-cyan tracking-wider">PDF AI CHAT</h1>
                  <p className="text-xs text-cyan-400/60">智能文档分析系统</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-4 py-2 glass rounded-full neon-border-cyan">
                  <Zap className="h-3 w-3 text-cyan-400" />
                  <span className="text-xs font-medium text-cyan-400">通义千问驱动</span>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <div className="flex flex-1 overflow-hidden">
            {/* Left Panel - PDF */}
            <div className="w-1/2 overflow-hidden flex flex-col glass border-r border-cyan-500/20">
              <div className="p-6">
                <PDFUploader />
              </div>

              <div className="px-6 pb-4">
                <PDFList />
              </div>

              <div className="flex-1 overflow-auto px-6 pb-6 scrollbar-thin">
                <PDFViewer />
              </div>
            </div>

            {/* Right Panel - Chat */}
            <div className="w-1/2 overflow-hidden flex flex-col glass">
              <ChatInterface />
            </div>
          </div>
        </div>
      </ChatProvider>
    </PDFProvider>
  );
}
