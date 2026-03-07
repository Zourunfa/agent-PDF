/**
 * App Layout Component - 极简艺术风格
 */

"use client";

import React from "react";
import { PDFProvider } from "@/contexts/PDFContext";
import { ChatProvider } from "@/contexts/ChatContext";
import { PDFList } from "@/components/pdf/PDFList";
import { PDFViewer } from "@/components/pdf/PDFViewer";
import { PDFUploader } from "@/components/pdf/PDFUploader";
import { ChatInterface } from "@/components/chat/ChatInterface";

interface AppLayoutProps {
  children?: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <PDFProvider>
      <ChatProvider>
        <div className="flex h-screen flex-col bg-background">
          {/* Header - 极简设计 */}
          <header className="h-14 border-b border-border/50 bg-background/80 backdrop-blur-sm">
            <div className="flex h-full items-center justify-between px-6">
              <div className="flex items-center gap-3">
                <div className="h-6 w-6 bg-foreground rounded-sm opacity-90" />
                <h1 className="text-sm font-medium tracking-wide opacity-70">
                  PDF · AI
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground/60">千问驱动</span>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <div className="flex flex-1 overflow-hidden">
            {/* Left Panel - PDF */}
            <div className="w-1/2 border-r border-border/30 overflow-hidden flex flex-col">
              {/* PDF Upload */}
              <div className="p-5">
                <PDFUploader />
              </div>

              {/* PDF List */}
              <div className="px-5 pb-3">
                <PDFList />
              </div>

              {/* PDF Viewer */}
              <div className="flex-1 overflow-auto px-5 pb-5 scrollbar-thin">
                <PDFViewer />
              </div>
            </div>

            {/* Right Panel - Chat */}
            <div className="w-1/2 overflow-hidden flex flex-col bg-secondary/30">
              <ChatInterface />
            </div>
          </div>
        </div>
      </ChatProvider>
    </PDFProvider>
  );
}
