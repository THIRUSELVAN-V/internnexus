/**
 * Temporary text extraction helper for PDF and DOCX files.
 * Processes the binary file in memory, extracts readable text strings,
 * and immediately discards the file buffer.
 * No files, blobs, or Base64 data are stored.
 */

export async function extractTextFromResumeFile(file: File): Promise<string> {
  if (!file) {
    throw new Error('No file provided.');
  }

  // Validate file size (Max 5MB)
  const MAX_SIZE_BYTES = 5 * 1024 * 1024;
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error('File size exceeds 5MB limit. Please upload a smaller PDF or DOCX file.');
  }

  const fileNameLower = file.name.toLowerCase();
  const isPdf = fileNameLower.endsWith('.pdf') || file.type === 'application/pdf';
  const isDocx =
    fileNameLower.endsWith('.docx') ||
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    fileNameLower.endsWith('.doc');

  if (!isPdf && !isDocx) {
    throw new Error('Invalid file format. Please upload a PDF or DOCX document.');
  }

  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  if (bytes.length === 0) {
    throw new Error('Selected file is empty.');
  }

  let extractedText = '';

  if (isPdf) {
    extractedText = extractTextFromPdfBuffer(bytes);
  } else {
    extractedText = extractTextFromDocxBuffer(bytes);
  }

  // Fallback text extraction if text density is low
  if (!extractedText || extractedText.trim().length < 20) {
    extractedText = extractRawPrintableText(bytes);
  }

  if (!extractedText || extractedText.trim().length < 15) {
    throw new Error('Could not extract readable text from resume. Please ensure the document is not password protected or a scanned image.');
  }

  return extractedText.trim();
}

/**
 * Extract printable ASCII/UTF-8 strings from binary array
 */
function extractTextFromPdfBuffer(bytes: Uint8Array): string {
  const textDecoder = new TextDecoder('utf-8', { fatal: false });
  const rawString = textDecoder.decode(bytes);

  // Extract text within PDF text objects (BT ... ET) or stream segments
  const textMatches: string[] = [];
  const btRegex = /BT([\s\S]*?)ET/g;
  let match;

  while ((match = btRegex.exec(rawString)) !== null) {
    const streamContent = match[1];
    // Extract strings inside parentheses (Tj / TJ operators)
    const stringLiteralRegex = /\((.*?)\)/g;
    let strMatch;
    while ((strMatch = stringLiteralRegex.exec(streamContent)) !== null) {
      if (strMatch[1] && strMatch[1].length > 1) {
        textMatches.push(strMatch[1]);
      }
    }
  }

  if (textMatches.length > 5) {
    return textMatches.join(' ').replace(/\\([()\\])/g, '$1');
  }

  return extractRawPrintableText(bytes);
}

/**
 * Extract text from DOCX XML text nodes (<w:t>...</w:t>)
 */
function extractTextFromDocxBuffer(bytes: Uint8Array): string {
  const textDecoder = new TextDecoder('utf-8', { fatal: false });
  const rawString = textDecoder.decode(bytes);

  const textNodes: string[] = [];
  const wtRegex = /<w:t[^>]*>(.*?)<\/w:t>/g;
  let match;

  while ((match = wtRegex.exec(rawString)) !== null) {
    if (match[1]) {
      textNodes.push(match[1]);
    }
  }

  if (textNodes.length > 0) {
    return textNodes.join(' ');
  }

  return extractRawPrintableText(bytes);
}

/**
 * Fallback scanner for clean printable strings
 */
function extractRawPrintableText(bytes: Uint8Array): string {
  const printableChars: string[] = [];
  let currentChunk: string[] = [];

  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    // Printable ASCII space (32) to ~ (126), line breaks (10, 13, 9)
    if ((byte >= 32 && byte <= 126) || byte === 10 || byte === 13 || byte === 9) {
      currentChunk.push(String.fromCharCode(byte));
    } else {
      if (currentChunk.length >= 3) {
        printableChars.push(currentChunk.join(''));
      }
      currentChunk = [];
    }
  }

  if (currentChunk.length >= 3) {
    printableChars.push(currentChunk.join(''));
  }

  const rawText = printableChars.join(' ');
  // Filter noise & PDF metadata markers
  const filteredWords = rawText
    .split(/\s+/)
    .filter((word) => !word.startsWith('/Type') && !word.startsWith('/Font') && !word.startsWith('/ProcSet') && word.length > 1);

  return filteredWords.join(' ');
}
