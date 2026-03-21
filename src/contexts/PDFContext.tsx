/**
 * PDF Context Provider
 */

'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { PDFFile, ParseStatus, UploadStatus } from '@/types/pdf';

interface PDFContextType {
  pdfs: Map<string, PDFFile>;
  activePdfId: string | null;
  uploadProgress: Map<string, number>;
  parseStatus: Map<string, ParseStatus>;

  // Actions
  addPDF: (pdf: PDFFile) => void;
  removePDF: (id: string) => void;
  setActivePdf: (id: string | null) => void;
  updateUploadProgress: (pdfId: string, progress: number) => void;
  updateParseStatus: (pdfId: string, status: ParseStatus) => void;
  updatePdfContent: (pdfId: string, content: string, pageCount: number) => void;
}

const PDFContext = createContext<PDFContextType | null>(null);

export function usePDF() {
  const context = useContext(PDFContext);
  if (!context) {
    throw new Error('usePDF must be used within PDFProvider');
  }
  return context;
}

interface PDFProviderProps {
  children: React.ReactNode;
}

export function PDFProvider({ children }: PDFProviderProps) {
  const [pdfs, setPdfs] = useState<Map<string, PDFFile>>(new Map());
  const [activePdfId, setActivePdfId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Map<string, number>>(new Map());
  const [parseStatus, setParseStatus] = useState<Map<string, ParseStatus>>(new Map());

  const addPDF = useCallback((pdf: PDFFile) => {
    setPdfs((prev) => new Map(prev).set(pdf.id, pdf));
    setParseStatus((prev) => new Map(prev).set(pdf.id, pdf.parseStatus));
  }, []);

  const removePDF = useCallback(
    async (id: string) => {
      try {
        // Call API to delete PDF
        const response = await fetch(`/api/pdfs/${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const error = await response.json();
          console.error('[PDFContext] Failed to delete PDF:', error);
          throw new Error(error.error?.message || '删除失败');
        }

        console.log('[PDFContext] PDF deleted successfully:', id);
      } catch (error) {
        console.error('[PDFContext] Error deleting PDF:', error);
        throw error;
      } finally {
        // Always clear local state
        setPdfs((prev) => {
          const next = new Map(prev);
          next.delete(id);
          return next;
        });
        setUploadProgress((prev) => {
          const next = new Map(prev);
          next.delete(id);
          return next;
        });
        setParseStatus((prev) => {
          const next = new Map(prev);
          next.delete(id);
          return next;
        });
        if (activePdfId === id) {
          setActivePdfId(null);
        }
      }
    },
    [activePdfId]
  );

  const setActivePdf = useCallback((id: string | null) => {
    setActivePdfId(id);
  }, []);

  const updateUploadProgress = useCallback((pdfId: string, progress: number) => {
    setUploadProgress((prev) => new Map(prev).set(pdfId, progress));
  }, []);

  const updateParseStatus = useCallback((pdfId: string, status: ParseStatus) => {
    setParseStatus((prev) => new Map(prev).set(pdfId, status));
    setPdfs((prev) => {
      const pdf = prev.get(pdfId);
      if (pdf) {
        const next = new Map(prev);
        next.set(pdfId, { ...pdf, parseStatus: status });
        return next;
      }
      return prev;
    });
  }, []);

  const updatePdfContent = useCallback((pdfId: string, content: string, pageCount: number) => {
    setPdfs((prev) => {
      const pdf = prev.get(pdfId);
      if (pdf) {
        const next = new Map(prev);
        next.set(pdfId, {
          ...pdf,
          textContent: content,
          pageCount,
          parseStatus: ParseStatus.COMPLETED,
        });
        return next;
      }
      return prev;
    });
    setParseStatus((prev) => new Map(prev).set(pdfId, ParseStatus.COMPLETED));
  }, []);

  const value: PDFContextType = {
    pdfs,
    activePdfId,
    uploadProgress,
    parseStatus,
    addPDF,
    removePDF,
    setActivePdf,
    updateUploadProgress,
    updateParseStatus,
    updatePdfContent,
  };

  return <PDFContext.Provider value={value}>{children}</PDFContext.Provider>;
}
