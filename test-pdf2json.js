// Test pdf2json
import PDFParser from 'pdf2json';
import fs from 'fs';

const testFile = process.argv[2];

if (!testFile) {
  console.log('Usage: node test-pdf2json.js <pdf-file-path>');
  process.exit(1);
}

console.log('Testing pdf2json with:', testFile);

const pdfParser = new PDFParser(null, true);

pdfParser.on("pdfParser_dataError", errData => {
  console.error('Parse error:', errData);
});

pdfParser.on("pdfParser_dataReady", pdfData => {
  console.log('Success! Pages:', pdfData.Pages?.length || 0);
  if (pdfData.Pages && pdfData.Pages[0]) {
    console.log('First page texts:', pdfData.Pages[0].Texts?.length || 0);
  }
});

const buffer = fs.readFileSync(testFile);
pdfParser.parseBuffer(buffer);
