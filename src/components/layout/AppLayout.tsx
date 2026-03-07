/**
 * App Layout Component - 现代极简风格
 */

"use client";

import React from "react";
import { PDFProvider } from "@/contexts/PDFContext";
import { ChatProvider } from "@/contexts/ChatContext";
import { PDFList } from "@/components/pdf/PDFList";
import { PDFViewer } from "@/components/pdf/PDFViewer";
import { PDFUploader } from "@/components/pdf/PDFUploader";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { FileText } from "lucide-react";

interface AppLayoutProps {
  children?: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <PDFProvider>
      <ChatProvider>
        <div className="flex h-screen flex-col bg-gradient-to-br from-gray-50 to-gray-100">
          {/* Header - 现代设计 */}
          <header className="h-16 border-b border-gray-200/80 bg-white/80 backdrop-blur-xl shadow-sm">
            <div className="flex h-full items-center justify-between px-8">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-9 w-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg shadow-blue-500/30">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">PDF AI Chat</h1>
                  <p className="text-xs text-gray-500">智能文档对话助手</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="px-3 py-1.5 bg-gradient-to-r from-blue-50 to-purple-50 rounded-full border border-blue-100">
                  <span className="text-xs font-medium text-blue-700">通义千问驱动</span>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <div className="flex flex-1 overflow-hidden">
            {/* Left Panel - PDF */}
            <div className="w-1/2 overflow-hidden flex flex-col bg-white border-r border-gray-200">
              {/* PDF Upload */}
              <div className="p-6">
                <PDFUploader />
              </div>

              {/* PDF List */}
              <div className="px-6 pb-4">
                <PDFList />
              </div>

              {/* PDF Viewer */}
              <div className="flex-1 overflow-auto px-6 pb-6">
                <PDFViewer />
              </div>
            </div>

            {/* Right Panel - Chat */}
            <div className="w-1/2 overflow-hidden flex flex-col bg-gradient-to-br from-gray-50 to-white">
              <ChatInterface />
            </div>
          </div>
        </div>
      </ChatProvider>
    </PDFProvider>
  );
}
