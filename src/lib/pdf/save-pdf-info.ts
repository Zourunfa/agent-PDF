/**
 * PDF Information Saving Utilities
 * Handles saving PDF metadata and creating conversation records
 */

import { createClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';

export interface SavePDFInfoParams {
  pdfId: string;
  userId: string;
  filename: string;
  fileSize: number;
  storagePath: string;
  pageCount?: number;
  textSummary?: string;
  parseStatus?: 'pending' | 'parsing' | 'completed' | 'failed';
}

export interface CreateConversationParams {
  pdfId: string;
  userId: string;
}

/**
 * Save PDF information to database
 * Updates existing record if PDF already exists
 */
export async function savePDFInfo(params: SavePDFInfoParams) {
  const supabase = createClient();
  const {
    pdfId,
    userId,
    filename,
    fileSize,
    storagePath,
    pageCount,
    textSummary,
    parseStatus = 'pending',
  } = params;

  console.log('[savePDFInfo] Saving PDF info:', {
    pdfId,
    userId,
    filename,
    fileSize,
    parseStatus,
  });

  try {
    // Check if PDF already exists
    const { data: existingPDF, error: fetchError } = await supabase
      .from('user_pdfs')
      .select('id')
      .eq('id', pdfId)
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 = no rows found (expected for new PDFs)
      throw fetchError;
    }

    if (existingPDF) {
      // Update existing PDF
      console.log('[savePDFInfo] Updating existing PDF:', pdfId);
      const { error: updateError } = await (supabase
        .from('user_pdfs')
        .update({
          filename,
          file_size: fileSize,
          storage_path: storagePath,
          page_count: pageCount,
          text_summary: textSummary,
          parse_status: parseStatus,
          updated_at: new Date().toISOString(),
        } as any) as any)
        .eq('id', pdfId)
        .eq('user_id', userId);

      if (updateError) throw updateError;
      console.log('[savePDFInfo] PDF updated successfully');
    } else {
      // Insert new PDF
      console.log('[savePDFInfo] Creating new PDF record:', pdfId);
      const { error: insertError } = await (supabase
        .from('user_pdfs')
        .insert(
          [
            {
              id: pdfId,
              user_id: userId,
              filename,
              file_size: fileSize,
              storage_path: storagePath,
              page_count: pageCount,
              text_summary: textSummary,
              parse_status: parseStatus,
              pinecone_namespace: userId,
            },
          ] as any
        ) as any);

      if (insertError) throw insertError;
      console.log('[savePDFInfo] PDF created successfully');
    }

    return { success: true, pdfId };
  } catch (error) {
    console.error('[savePDFInfo] Error saving PDF info:', error);
    throw error;
  }
}

/**
 * Create or get a conversation record for a PDF
 * Returns existing conversation if one already exists
 */
export async function createOrGetConversation(
  params: CreateConversationParams
): Promise<string> {
  const supabase = createClient();
  const { pdfId, userId } = params;

  console.log('[createOrGetConversation] Creating/getting conversation:', {
    pdfId,
    userId,
  });

  try {
    // Check if conversation already exists
    const { data: existingConversation, error: fetchError } = await supabase
      .from('pdf_conversations')
      .select('id')
      .eq('pdf_id', pdfId)
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 = no rows found (expected for new conversations)
      throw fetchError;
    }

    if (existingConversation) {
      console.log('[createOrGetConversation] Using existing conversation:', existingConversation.id);
      return existingConversation.id;
    }

    // Create new conversation
    const conversationId = uuidv4();
    console.log('[createOrGetConversation] Creating new conversation:', conversationId);

    const { error: insertError } = await (supabase
      .from('pdf_conversations')
      .insert(
        [
          {
            id: conversationId,
            pdf_id: pdfId,
            user_id: userId,
            message_count: 0,
            last_message_at: null,
          },
        ] as any
      ) as any);

    if (insertError) throw insertError;
    console.log('[createOrGetConversation] Conversation created successfully');

    return conversationId;
  } catch (error) {
    console.error('[createOrGetConversation] Error creating conversation:', error);
    throw error;
  }
}

/**
 * Update PDF parse status
 */
export async function updatePDFParseStatus(
  pdfId: string,
  userId: string,
  status: 'pending' | 'parsing' | 'completed' | 'failed',
  pageCount?: number,
  textSummary?: string
) {
  const supabase = createClient();

  console.log('[updatePDFParseStatus] Updating parse status:', {
    pdfId,
    status,
    pageCount,
  });

  try {
    const updateData: Record<string, any> = {
      parse_status: status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'completed') {
      updateData.parsed_at = new Date().toISOString();
      if (pageCount !== undefined) updateData.page_count = pageCount;
      if (textSummary !== undefined) updateData.text_summary = textSummary;
    }

    const { error } = await (supabase
      .from('user_pdfs')
      .update(updateData as any) as any)
      .eq('id', pdfId)
      .eq('user_id', userId);

    if (error) throw error;
    console.log('[updatePDFParseStatus] Parse status updated successfully');

    return { success: true };
  } catch (error) {
    console.error('[updatePDFParseStatus] Error updating parse status:', error);
    throw error;
  }
}
