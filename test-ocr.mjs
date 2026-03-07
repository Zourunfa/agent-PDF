// Quick OCR test
import fs from 'fs';
import { parsePDF } from './src/lib/pdf/parser.ts';

const testFile = process.argv[2];

if (!testFile) {
  console.log('Usage: node test-ocr.mjs <pdf-file-path>');
  process.exit(1);
}

console.log('Testing OCR with:', testFile);

try {
  const buffer = fs.readFileSync(testFile);
  console.log('File loaded, size:', buffer.length, 'bytes\n');
  
  const result = await parsePDF(buffer);
  
  console.log('\n✓ Success!');
  console.log('Pages:', result.pages);
  console.log('Characters:', result.text.length);
  console.log('OCR processed:', result.info.ocrProcessed || false);
  console.log('\nFirst 200 characters:');
  console.log(result.text.substring(0, 200));
} catch (error) {
  console.error('\n✗ Error:', error.message);
  process.exit(1);
}
