import { createWorker } from 'tesseract.js';
// @ts-ignore
import PDFParser from 'pdf2json';
import { extractRawText } from 'mammoth';

export async function parseFile(file: File): Promise<{ content: string; type: string }> {
  try {
    const fileName = file.name.toLowerCase();
    const fileType = file.type;

    // PDF files
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      return await parsePDF(file);
    }

    // Image files (PNG, JPG, GIF, etc.)
    if (fileType.startsWith('image/') || /\.(png|jpg|jpeg|gif|webp)$/i.test(fileName)) {
      return await parseImage(file);
    }

    // Audio files
    if (fileType.startsWith('audio/') || /\.(mp3|wav|m4a|aac|ogg|flac|wma)$/i.test(fileName)) {
      return await parseAudio(file);
    }

    // Video files
    if (fileType.startsWith('video/') || /\.(mp4|webm|avi|mkv|mov|flv|wmv)$/i.test(fileName)) {
      return await parseVideo(file);
    }

    // DOCX files
    if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        fileName.endsWith('.docx')) {
      return await parseDOCX(file);
    }

    // PowerPoint files
    if (fileType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
        fileType === 'application/vnd.ms-powerpoint' ||
        /\.(ppt|pptx)$/i.test(fileName)) {
      return await parsePowerPoint(file);
    }

    // Plain text files
    if (fileType === 'text/plain' || /\.(txt|md|markdown|log)$/i.test(fileName)) {
      return await parseText(file);
    }

    // JSON files
    if (fileType === 'application/json' || fileName.endsWith('.json')) {
      const text = await file.text();
      try {
        const json = JSON.parse(text);
        return { content: JSON.stringify(json, null, 2), type: 'json' };
      } catch {
        return { content: text, type: 'json' };
      }
    }

    // CSV files
    if (fileType === 'text/csv' || fileName.endsWith('.csv')) {
      return await parseText(file);
    }

    // Unknown type - try to read as text
    try {
      const text = await file.text();
      return { content: text, type: 'text' };
    } catch {
      return { content: '[File could not be parsed]', type: 'unknown' };
    }
  } catch (error) {
    console.error(`Error parsing file ${file.name}:`, error);
    return { content: `[Error parsing file: ${error instanceof Error ? error.message : 'Unknown error'}]`, type: 'error' };
  }
}

async function parsePDF(file: File): Promise<{ content: string; type: string }> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const nodeBuffer = Buffer.from(arrayBuffer);
    
    // Use pdf2json to parse the PDF
    const pdfParser = new PDFParser();
    
    // Create a promise that resolves when parsing is complete
    const extractedText = await new Promise<string>((resolve, reject) => {
      let extractedContent = '';
      
      pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
        // Extract text from parsed PDF data
        try {
          if (pdfData?.Pages) {
            for (const page of pdfData.Pages) {
              if (page.Texts) {
                for (const textItem of page.Texts) {
                  if (textItem.R && textItem.R[0]?.T) {
                    // Decode text (it's often encoded in PDF)
                    const decodedText = decodeURIComponent(textItem.R[0].T);
                    extractedContent += decodedText + ' ';
                  }
                }
              }
              extractedContent += '\n'; // Page break
            }
          }
          resolve(extractedContent.trim());
        } catch (e) {
          reject(e);
        }
      });
      
      pdfParser.on('pdfParser_dataError', (error: any) => {
        reject(new Error(`PDF parsing error: ${error}`));
      });
      
      // Start parsing
      try {
        pdfParser.parseBuffer(nodeBuffer);
      } catch (error) {
        reject(error);
      }
    });

    // Clean and reconstruct the extracted text
    const cleanedText = cleanPDFText(extractedText);

    // Check if extraction was successful
    if (!cleanedText || cleanedText.length === 0 || cleanedText.startsWith('[WARNING')) {
      // PDF is likely image-based or complex, suggest cloud services
      return {
        content: `[PDF: ${file.name}]\n\n[NOTE: This PDF appears to contain images or has complex encoding that makes local text extraction difficult.]\n\nFor reliable text extraction from image-based PDFs, use:\n1. AWS Textract: https://aws.amazon.com/textract/ (free tier: 1000 pages/month)\n2. Google Cloud Document AI: https://cloud.google.com/document-ai (free tier: 500 pages/month)\n3. CloudConvert API: https://cloudconvert.com/\n\n[Attempted extraction:]\n${cleanedText || 'No readable text found'}`,
        type: 'pdf'
      };
    }

    return {
      content: cleanedText,
      type: 'pdf'
    };
  } catch (error) {
    console.error('PDF parsing error:', error);
    return {
      content: `[PDF: ${file.name}]\n\n[Error extracting text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}]\n\nThis PDF may have encryption or unsupported encoding. For reliable extraction, use:\n- AWS Textract: https://aws.amazon.com/textract/\n- Google Cloud Document AI: https://cloud.google.com/document-ai/\n- CloudConvert API: https://cloudconvert.com/`,
      type: 'pdf'
    };
  }
}

function cleanPDFText(rawText: string): string {
  let text = rawText;

  // Step 1: Remove control characters
  text = text.replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ');

  // Step 2: CRITICAL - Remove sequences of 3+ identical characters
  // This eliminates artifact patterns like "GGGGGGGGG", "FFFFFFFF", "BBBBB", etc.
  text = text.replace(/([A-Za-z0-9])\1{2,}/g, ' '); 

  // Step 3: Remove repeating sequences of 2 characters (e.g. "ABABAB", " . . . ")
  text = text.replace(/([A-Za-z0-9\s]{2,})\1{3,}/g, ' ');

  // Step 4: [REMOVED] Was overly aggressive and deleted spaced-out text

  // Step 5: REFINED space removal for spaced-out text (e.g., "L E C T U R E" or "we wi ll")
  // Reconstructs words that have spaces between fragments
  for (let i = 0; i < 5; i++) {
    const before = text;
    // Join 1-2 character fragments separated by a single space
    // We avoid joining 3+ char words to prevent "the cat" -> "thecat"
    // Use lookbehind/ahead for boundaries to be safe
    text = text.replace(/(\b[A-Za-z0-9]{1,2})\s([A-Za-z0-9]{1,2}\b)/g, '$1$2');
    if (text === before) break;
  }

  // Step 6: Remove punctuation that's spaced weird (artifact cleanup)
  text = text
    .replace(/[ \t]+([.,:;!?)])/g, '$1')
    .replace(/\([ \t]+/g, '(')
    .replace(/[ \t]+\)/g, ')')
    .replace(/[ \t]+\[/g, '[')
    .replace(/\][ \t]+/g, ']');

  // Step 7: Normalize whitespace while PRESERVING NEWLINES
  text = text
    .replace(/[ \t]+/g, ' ') // Multiple spaces/tabs -> single space
    .replace(/ \n/g, '\n')   // Space before newline
    .replace(/\n /g, '\n')   // Space after newline
    .replace(/\n\n\n+/g, '\n\n'); // Multiple newlines -> double

  // Step 8: Filter out lines that are mostly garbage
  text = text
    .split('\n')
    .map((line: string) => line.trim())
    .filter((line: string) => {
      if (line.length === 0) return true; // Keep blank lines
      if (line.length < 3) return false; // Remove tiny lines

      // Calculate real content ratio
      const alphanumericCount = (line.match(/[A-Za-z0-9]/g) || []).length;
      const textLength = line.length;

      // Keep lines where 50%+ of characters are alphanumeric/punctuation
      // This is aggressive but filters out most noise while keeping code
      const contentRatio = (alphanumericCount + (line.match(/[.,:;()[\]\-]/g) || []).length) / textLength;
      return contentRatio > 0.4;
    })
    .join('\n');

  // Step 9: Final sanity check - if we have almost no text left, PDF is too damaged
  text = text.trim();
  if (text.length < 150) {
    text = '[WARNING: PDF extraction produced minimal valid content.]\n\n' + text +
      '\n\n[This PDF may be image-based or corrupted. Consider using AWS Textract or Google Document AI for better results.]';
  }

  return text;
}

async function parseImage(file: File): Promise<{ content: string; type: string }> {
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const worker = await createWorker('eng', undefined, {
      logger: (m) => {
        // Suppress verbose logging
      }
    });

    const { data: { text } } = await worker.recognize(buffer);
    await worker.terminate();

    return {
      content: text.trim() || '[Image contains no readable text]',
      type: 'image'
    };
  } catch (error) {
    console.error('Image OCR error:', error);
    return {
      content: `[Error extracting image text via OCR: ${error instanceof Error ? error.message : 'Unknown error'}]`,
      type: 'image'
    };
  }
}

async function parseAudio(file: File): Promise<{ content: string; type: string }> {
  try {
    const buffer = await file.arrayBuffer();
    // Extract basic audio metadata
    const audioMetadata = new DataView(buffer);
    const fileSize = buffer.byteLength;
    const duration = estimateAudioDuration(buffer);

    // If Google Cloud Speech API key is available, we could transcribe here
    const speechAPIKey = process.env.GOOGLE_CLOUD_SPEECH_API_KEY;

    if (speechAPIKey) {
      // Transcription would go here (requires API setup)
      return {
        content: `[Audio file: ${file.name} | Duration: ~${duration}s | Size: ${(fileSize / 1024 / 1024).toFixed(1)}MB]\n\n[Audio transcription requires complete Google Cloud Speech API setup. Please add real API credentials to .env.local]`,
        type: 'audio'
      };
    } else {
      return {
        content: `[Audio file: ${file.name} | Duration: ~${duration}s | Size: ${(fileSize / 1024 / 1024).toFixed(1)}MB]\n\n[To transcribe audio, set GOOGLE_CLOUD_SPEECH_API_KEY in .env.local]`,
        type: 'audio'
      };
    }
  } catch (error) {
    console.error('Audio parsing error:', error);
    return {
      content: `[Error processing audio file: ${error instanceof Error ? error.message : 'Unknown error'}]`,
      type: 'audio'
    };
  }
}

async function parseVideo(file: File): Promise<{ content: string; type: string }> {
  try {
    const buffer = await file.arrayBuffer();
    const fileSize = buffer.byteLength;

    // Extract basic video metadata from file
    const videoMetadata = extractVideoMetadata(buffer);

    return {
      content: `[Video file: ${file.name} | Size: ${(fileSize / 1024 / 1024).toFixed(1)}MB]\n\n[Video processing requires:\n1. Video frame extraction (ffmpeg)\n2. OCR on frames for text\n3. Audio track extraction and transcription]\n\nTo enable video processing:\n1. Install ffmpeg: brew install ffmpeg\n2. Configure GOOGLE_CLOUD_SPEECH_API_KEY for audio extraction`,
      type: 'video'
    };
  } catch (error) {
    console.error('Video parsing error:', error);
    return {
      content: `[Error processing video file: ${error instanceof Error ? error.message : 'Unknown error'}]`,
      type: 'video'
    };
  }
}

async function parseDOCX(file: File): Promise<{ content: string; type: string }> {
  try {
    const buffer = await file.arrayBuffer();
    const result = await extractRawText({ arrayBuffer: buffer });
    return {
      content: result.value.trim() || '[DOCX contains no readable text]',
      type: 'docx'
    };
  } catch (error) {
    console.error('DOCX parsing error:', error);
    return {
      content: `[Error extracting DOCX text: ${error instanceof Error ? error.message : 'Unknown error'}]`,
      type: 'docx'
    };
  }
}

async function parsePowerPoint(file: File): Promise<{ content: string; type: string }> {
  try {
    // PowerPoint files are ZIP archives with XML content
    // For now, provide a helpful message
    return {
      content: `[PowerPoint file: ${file.name}]\n\n[PowerPoint processing requires:\n1. ZIP extraction of .pptx\n2. XML parsing of slide content\n3. Image extraction and OCR from slides]\n\nTo enable PowerPoint parsing:\n1. Install unzipper: npm install unzipper\n2. Implement XML parsing for slide content]`,
      type: 'powerpoint'
    };
  } catch (error) {
    console.error('PowerPoint parsing error:', error);
    return {
      content: `[Error processing PowerPoint file: ${error instanceof Error ? error.message : 'Unknown error'}]`,
      type: 'powerpoint'
    };
  }
}

async function parseText(file: File): Promise<{ content: string; type: string }> {
  try {
    const text = await file.text();
    return {
      content: text.trim() || '[File is empty]',
      type: 'text'
    };
  } catch (error) {
    console.error('Text parsing error:', error);
    return {
      content: `[Error reading text file: ${error instanceof Error ? error.message : 'Unknown error'}]`,
      type: 'text'
    };
  }
}

// Helper functions for metadata extraction

function estimateAudioDuration(buffer: ArrayBuffer): number {
  // Very rough estimation based on common audio bitrates
  const sizeInBytes = buffer.byteLength;
  const assumedBitrateKbps = 128; // Assume 128 kbps average
  const durationSeconds = Math.floor((sizeInBytes * 8) / (assumedBitrateKbps * 1000));
  return durationSeconds;
}

function extractVideoMetadata(buffer: ArrayBuffer): Record<string, any> {
  // Look for common video container signatures
  const view = new DataView(buffer);
  const fileSize = buffer.byteLength;

  let format = 'unknown';
  let duration = 0;

  // Check for MP4 signature (ftyp box)
  if (fileSize > 8) {
    const boxType = String.fromCharCode(
      view.getUint8(4),
      view.getUint8(5),
      view.getUint8(6),
      view.getUint8(7)
    );
    if (boxType === 'ftyp') {
      format = 'MP4';
    }
  }

  // Rough duration estimate based on file size
  // Average video bitrate is typically 1-5 Mbps
  duration = Math.floor(fileSize / (2 * 1024 * 1024)); // Assume 2 Mbps

  return { format, duration, fileSize };
}
