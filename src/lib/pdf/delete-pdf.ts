/**
 * PDF Deletion Utilities
 * Handles deleting PDFs and cascading deletion of related data
 */

import { createClient } from '@/lib/supabase/server';

export interface DeletePDFResult {
  success: boolean;
  pdfId: string;
  messagesDeleted: number;
  conversationsDeleted: number;
}

/**
 * Delete a PDF and all its associated data
 * Cascading delete: PDF → Conversations → Messages
 */
export async function deletePDF(pdfId: string, userId: string): Promise<DeletePDFResult> {
  const supabase = createClient();

  console.log('[deletePDF] Starting PDF deletion:', { pdfId, userId });

  try {
    // Verify user owns the PDF
    const { data: pdfData, error: pdfError } = await supabase
      .from('user_pdfs')
      .select('id, filename')
      .eq('id', pdfId)
      .eq('user_id', userId)
      .single();

    if (pdfError) {
      if (pdfError.code === 'PGRST116') {
        throw new Error('PDF not found or access denied');
      }
      throw pdfError;
    }

    console.log('[deletePDF] PDF verified:', (pdfData as any).filename);

    // Get conversation count before deletion
    const { count: conversationCount, error: convCountError } = await supabase
      .from('pdf_conversations')
      .select('id', { count: 'exact', head: true })
      .eq('pdf_id', pdfId)
      .eq('user_id', userId);

    if (convCountError) throw convCountError;

    console.log('[deletePDF] Found', conversationCount, 'conversations');

    // Get message count before deletion
    const { count: messageCount, error: msgCountError } = await supabase
      .from('conversation_messages')
      .select('id', { count: 'exact', head: true })
      .eq('pdf_id', pdfId)
      .eq('user_id', userId);

    if (msgCountError) throw msgCountError;

    console.log('[deletePDF] Found', messageCount, 'messages');

    // Delete messages (will cascade from conversations)
    const { error: deleteMessagesError } = await supabase
      .from('conversation_messages')
      .delete()
      .eq('pdf_id', pdfId)
      .eq('user_id', userId);

    if (deleteMessagesError) throw deleteMessagesError;

    console.log('[deletePDF] Messages deleted');

    // Delete conversations
    const { error: deleteConversationsError } = await supabase
      .from('pdf_conversations')
      .delete()
      .eq('pdf_id', pdfId)
      .eq('user_id', userId);

    if (deleteConversationsError) throw deleteConversationsError;

    console.log('[deletePDF] Conversations deleted');

    // Delete PDF
    const { error: deletePDFError } = await supabase
      .from('user_pdfs')
      .delete()
      .eq('id', pdfId)
      .eq('user_id', userId);

    if (deletePDFError) throw deletePDFError;

    console.log('[deletePDF] PDF deleted successfully');

    return {
      success: true,
      pdfId,
      messagesDeleted: messageCount || 0,
      conversationsDeleted: conversationCount || 0,
    };
  } catch (error) {
    console.error('[deletePDF] Error deleting PDF:', error);
    throw error;
  }
}

/**
 * Delete all PDFs for a user (admin/cleanup function)
 */
export async function deleteAllUserPDFs(userId: string): Promise<DeletePDFResult[]> {
  const supabase = createClient();

  console.log('[deleteAllUserPDFs] Starting deletion of all PDFs for user:', userId);

  try {
    // Get all PDFs for user
    const { data: pdfs, error: getPDFsError } = await supabase
      .from('user_pdfs')
      .select('id')
      .eq('user_id', userId);

    if (getPDFsError) throw getPDFsError;

    console.log('[deleteAllUserPDFs] Found', pdfs?.length || 0, 'PDFs to delete');

    // Delete each PDF
    const results: DeletePDFResult[] = [];

    for (const pdf of (pdfs as any[]) || []) {
      try {
        const result = await deletePDF(pdf.id, userId);
        results.push(result);
      } catch (error) {
        console.error('[deleteAllUserPDFs] Error deleting PDF:', pdf.id, error);
        // Continue with next PDF
      }
    }

    console.log('[deleteAllUserPDFs] Deleted', results.length, 'PDFs');

    return results;
  } catch (error) {
    console.error('[deleteAllUserPDFs] Error deleting all PDFs:', error);
    throw error;
  }
}

/**
 * Soft delete a PDF (mark as deleted without removing data)
 * Useful for audit trails
 */
export async function softDeletePDF(pdfId: string, userId: string): Promise<void> {
  const supabase = createClient();

  console.log('[softDeletePDF] Soft deleting PDF:', { pdfId, userId });

  try {
    const { error } = await (supabase
      .from('user_pdfs')
      .update({
        parse_status: 'failed', // Mark as failed to indicate deletion
        updated_at: new Date().toISOString(),
      } as any) as any)
      .eq('id', pdfId)
      .eq('user_id', userId);

    if (error) throw error;

    console.log('[softDeletePDF] PDF soft deleted successfully');
  } catch (error) {
    console.error('[softDeletePDF] Error soft deleting PDF:', error);
    throw error;
  }
}
