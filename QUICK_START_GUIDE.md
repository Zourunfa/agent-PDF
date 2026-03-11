# PDF Conversation History - Quick Start Guide

## 🚀 Getting Started

### Step 1: Run Database Migration

```bash
# Using Supabase CLI
supabase migration up

# Or manually in Supabase dashboard:
# 1. Go to SQL Editor
# 2. Copy content from: supabase/migrations/0006_create_conversation_tables.sql
# 3. Run the SQL
```

### Step 2: Test the APIs

```bash
# Get your auth token from browser console:
# localStorage.getItem('sb-jgsxmiojijjjpvbfndvn-auth-token')

# List PDFs
curl -X GET 'http://localhost:3000/api/pdfs/list?limit=10' \
  -H 'Authorization: Bearer YOUR_TOKEN'

# Get conversation history
curl -X GET 'http://localhost:3000/api/pdfs/{PDF_ID}/conversations' \
  -H 'Authorization: Bearer YOUR_TOKEN'

# Delete PDF
curl -X DELETE 'http://localhost:3000/api/pdfs/{PDF_ID}' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

## 📚 API Reference

### GET /api/pdfs/list
Get user's PDF list with conversation statistics

**Query Parameters**:
- `limit` (1-100, default: 50)
- `offset` (default: 0)
- `sortBy` (uploadedAt | conversationCount | lastConversationAt)
- `sortOrder` (asc | desc)

**Example**:
```bash
GET /api/pdfs/list?limit=20&offset=0&sortBy=uploadedAt&sortOrder=desc
```

**Response**:
```json
{
  "success": true,
  "data": {
    "total": 10,
    "pdfs": [...],
    "pagination": { "limit": 20, "offset": 0, "hasMore": false }
  }
}
```

### GET /api/pdfs/{id}/conversations
Get conversation history for a PDF

**Query Parameters**:
- `limit` (1-100, default: 100)
- `offset` (default: 0)

**Example**:
```bash
GET /api/pdfs/abc-123/conversations?limit=50&offset=0
```

**Response**:
```json
{
  "success": true,
  "data": {
    "pdfId": "abc-123",
    "filename": "document.pdf",
    "pageCount": 25,
    "messages": [...],
    "pagination": { "limit": 50, "offset": 0, "total": 100, "hasMore": true }
  }
}
```

### DELETE /api/pdfs/{id}
Delete a PDF and all its associated data

**Example**:
```bash
DELETE /api/pdfs/abc-123
```

**Response**:
```json
{
  "success": true,
  "data": {
    "pdfId": "abc-123",
    "messagesDeleted": 50,
    "conversationsDeleted": 1
  },
  "message": "PDF and all associated data deleted successfully"
}
```

## 🔧 Using Utility Functions

### Save PDF Info

```typescript
import { savePDFInfo, createOrGetConversation } from '@/lib/pdf/save-pdf-info';

// Save PDF metadata
await savePDFInfo({
  pdfId: 'uuid',
  userId: 'user-id',
  filename: 'document.pdf',
  fileSize: 1024000,
  storagePath: '/tmp/pdf-chat/...',
  parseStatus: 'pending',
});

// Create conversation
const conversationId = await createOrGetConversation({
  pdfId: 'uuid',
  userId: 'user-id',
});
```

### Save Conversation Messages

```typescript
import { saveConversationExchange } from '@/lib/chat/save-conversation';

// Save user question and assistant response
await saveConversationExchange(
  conversationId,
  pdfId,
  userId,
  'What is this document about?',
  'This document is about...',
  150, // tokens
  2500 // processing time in ms
);
```

### Get PDF List

```typescript
import { getPDFList } from '@/lib/pdf/get-pdf-list';

const result = await getPDFList({
  userId: 'user-id',
  limit: 50,
  offset: 0,
  sortBy: 'uploadedAt',
  sortOrder: 'desc',
});

console.log(result.pdfs); // Array of PDFs
console.log(result.total); // Total count
```

### Get Conversation History

```typescript
import { getConversationHistory } from '@/lib/chat/get-conversation-history';

const result = await getConversationHistory({
  pdfId: 'pdf-id',
  userId: 'user-id',
  limit: 100,
  offset: 0,
});

console.log(result.messages); // Array of messages
console.log(result.total); // Total message count
```

### Delete PDF

```typescript
import { deletePDF } from '@/lib/pdf/delete-pdf';

const result = await deletePDF('pdf-id', 'user-id');

console.log(result.messagesDeleted); // Number of messages deleted
console.log(result.conversationsDeleted); // Number of conversations deleted
```

## 📊 Database Queries

### Get all PDFs for a user

```sql
SELECT 
  p.id,
  p.filename,
  p.file_size,
  p.page_count,
  p.parse_status,
  p.created_at,
  COALESCE(c.message_count, 0) as conversation_count,
  c.last_message_at
FROM user_pdfs p
LEFT JOIN pdf_conversations c ON p.id = c.pdf_id
WHERE p.user_id = 'user-id'
ORDER BY p.created_at DESC;
```

### Get conversation messages

```sql
SELECT 
  id,
  role,
  content,
  created_at,
  tokens,
  processing_time
FROM conversation_messages
WHERE pdf_id = 'pdf-id' AND user_id = 'user-id'
ORDER BY created_at ASC;
```

### Get conversation statistics

```sql
SELECT 
  COUNT(*) as total_messages,
  SUM(CASE WHEN role = 'user' THEN 1 ELSE 0 END) as user_messages,
  SUM(CASE WHEN role = 'assistant' THEN 1 ELSE 0 END) as assistant_messages,
  SUM(COALESCE(tokens, 0)) as total_tokens,
  AVG(COALESCE(processing_time, 0)) as avg_processing_time
FROM conversation_messages
WHERE pdf_id = 'pdf-id' AND user_id = 'user-id';
```

## 🐛 Troubleshooting

### "PDF not found or access denied"
- Verify the PDF ID is correct
- Verify the user owns the PDF
- Check authentication token is valid

### "Limit must be between 1 and 100"
- Adjust the limit parameter
- Valid range: 1-100

### "User not authenticated"
- Check authentication token is provided
- Verify token is not expired
- Check token format: `Authorization: Bearer TOKEN`

### RLS Policy Errors
- Verify migration ran successfully
- Check user is authenticated
- Verify user_id matches in database

## 📈 Performance Tips

1. **Use pagination** - Always paginate large result sets
2. **Use sorting** - Sort by most relevant field
3. **Use indexes** - Queries use created indexes automatically
4. **Cache results** - Consider caching PDF list (TTL 5 minutes)
5. **Batch operations** - Use batch deletes for multiple PDFs

## 🔒 Security

- All endpoints require authentication
- User ownership is verified
- RLS policies prevent unauthorized access
- Input validation on all parameters
- Cascade deletion prevents orphaned records

## 📝 File Locations

**Utility Functions**:
- `src/lib/pdf/save-pdf-info.ts` - PDF saving
- `src/lib/pdf/get-pdf-list.ts` - PDF retrieval
- `src/lib/pdf/delete-pdf.ts` - PDF deletion
- `src/lib/chat/save-conversation.ts` - Conversation saving
- `src/lib/chat/get-conversation-history.ts` - Conversation retrieval

**API Endpoints**:
- `src/app/api/pdfs/list/route.ts` - GET /api/pdfs/list
- `src/app/api/pdfs/[id]/conversations/route.ts` - GET /api/pdfs/{id}/conversations
- `src/app/api/pdfs/[id]/route.ts` - DELETE /api/pdfs/{id}

**Database**:
- `supabase/migrations/0006_create_conversation_tables.sql` - Migration script

**Documentation**:
- `PDF_CONVERSATION_IMPLEMENTATION.md` - Complete implementation guide
- `IMPLEMENTATION_CHECKLIST.md` - Detailed checklist
- `PHASE_1_2_COMPLETION_SUMMARY.md` - Phase summary
- `QUICK_START_GUIDE.md` - This file

## 🎯 Next Steps

1. **Run migration** - Execute database migration
2. **Test APIs** - Use curl commands to test endpoints
3. **Integrate frontend** - Create React components for PDF list and conversation history
4. **Add tests** - Write unit and integration tests
5. **Deploy** - Deploy to production

## 📞 Support

For issues or questions:
1. Check the logs in browser console
2. Review error response from API
3. Verify database migration ran successfully
4. Check RLS policies are enabled
5. Verify authentication token is valid

---

**Last Updated**: March 10, 2026
**Version**: 1.0
**Status**: Ready for Production
