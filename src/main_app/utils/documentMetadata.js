/**
 * Utility functions for document metadata extraction, cleaning, and author validation.
 */

const FORBIDDEN_AUTHORS = new Set([
  'unknown',
  'unknown author',
  'n/a',
  'na',
  'none',
  'null',
  'undefined',
  'uploaded by user',
  'unnamed',
  'admin',
  'administrator',
  'user',
  'author',
  'default',
  'root',
  'owner'
]);

const FORBIDDEN_PATTERNS = [
  /^adobe/i,
  /^microsoft/i,
  /^word/i,
  /^canva/i,
  /^distiller/i,
  /^acrobat/i,
  /^latex/i,
  /^pdf/i,
  /^scanner/i,
  /^scan/i,
  /^hp digital/i,
  /^abbyy/i,
  /^ghostscript/i,
  /^quartz/i,
  /^coreldraw/i,
  /^indesign/i,
  /^mac os/i,
  /^windows/i,
  /^prince /i,
  /^wkhtmltopdf/i,
  /^calibre/i,
  /^pdf24/i,
  /^pdfcreator/i,
  /^fpdf/i,
  /^tcpdf/i,
  /^reportlab/i,
  /^writer/i,
  /^libreoffice/i,
  /^openoffice/i,
  /\.com$/i,
  /\.org$/i,
  /\.net$/i,
  /^http/i
];

/**
 * Checks whether an author string is a genuine author name (not Unknown, N/A, or software generator name).
 */
export function isValidAuthor(author) {
  if (!author || typeof author !== 'string') return false;
  const trimmed = author.trim();
  if (trimmed.length < 2 || trimmed.length > 80) return false;
  
  const lower = trimmed.toLowerCase();
  if (FORBIDDEN_AUTHORS.has(lower)) return false;

  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(trimmed)) return false;
  }

  // Must contain at least one valid letter
  if (!/[a-zA-Z\u00C0-\u024F\u1E00-\u1EFF]/.test(trimmed)) return false;

  return true;
}

/**
 * Clean up an author string. Returns cleaned string or null if invalid.
 */
export function cleanAuthor(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const cleaned = raw
    .replace(/^["'“”‘’\(\)\[\]]+|["'“”‘’\(\)\[\]]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return isValidAuthor(cleaned) ? cleaned : null;
}

/**
 * Heuristic filename author extractor:
 * Handles common ebook naming conventions:
 * - "Ernest Hemingway - The Old Man and the Sea.pdf"
 * - "The Old Man and the Sea by Ernest Hemingway.pdf"
 * - "Achebe, Chinua - There Was A Country.pdf"
 */
export function extractAuthorFromFilename(filename) {
  if (!filename || typeof filename !== 'string') return null;

  // Strip extension and common promotional tags
  const cleanName = filename
    .replace(/\.(pdf|epub|docx|doc|txt|rtf)$/i, '')
    .replace(/\s*\((?:PDFDrive|Z-Library|OceanofPDF(?:\.com)?|Libgen|b-ok|\d+)\)/gi, '')
    .replace(/\s*\[(?:PDFDrive|Z-Library|OceanofPDF(?:\.com)?|Libgen)\]/gi, '')
    .replace(/_+/g, ' ')
    .trim();

  // Pattern 1: "Title by Author"
  const byMatch = cleanName.match(/(?:^|\s+)by\s+([A-Z][a-zA-Z\s\.\-']+)$/i);
  if (byMatch && isValidAuthor(byMatch[1])) {
    return cleanAuthor(byMatch[1]);
  }

  // Pattern 2: "Author - Title"
  if (cleanName.includes(' - ')) {
    const parts = cleanName.split(' - ').map(s => s.trim());
    if (parts.length >= 2) {
      // Check if parts[0] looks like an author (e.g. 1-4 words, starts with letter, no digits)
      const candidate0 = parts[0];
      if (/^[A-Za-z\s\.\,\-']+$/.test(candidate0) && candidate0.split(/\s+/).length <= 4 && !/\d/.test(candidate0)) {
        // Check for "Lastname, Firstname" format
        if (candidate0.includes(',')) {
          const [last, first] = candidate0.split(',').map(s => s.trim());
          if (first && last) {
            const combined = `${first} ${last}`;
            if (isValidAuthor(combined)) return cleanAuthor(combined);
          }
        }
        if (isValidAuthor(candidate0)) {
          return cleanAuthor(candidate0);
        }
      }

      // Check if parts[1] is the author (e.g. "Title - Author")
      const candidate1 = parts[1];
      if (/^[A-Za-z\s\.\,\-']+$/.test(candidate1) && candidate1.split(/\s+/).length <= 4 && !/\d/.test(candidate1)) {
        if (isValidAuthor(candidate1)) {
          return cleanAuthor(candidate1);
        }
      }
    }
  }

  return null;
}
