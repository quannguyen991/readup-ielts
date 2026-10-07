import type { BrowserBookFile } from './import-book';

const MAX_FILE_BYTES = 25 * 1024 * 1024;
const MAX_PAGES = 1200;
const MAX_EXTRACTED_CHARACTERS = 4_000_000;

export async function extractBookPages(file: BrowserBookFile): Promise<string[]> {
  if (file.size > MAX_FILE_BYTES) throw new Error('Tệp vượt quá 25 MB. Hãy chọn từng phần sách nhỏ hơn.');
  const extension = file.name.toLowerCase().split('.').pop();
  if (extension === 'txt' || extension === 'md') {
    const text = (await file.text()).replace(/\r/g, '').trim();
    if (!text) throw new Error('Tệp không có nội dung chữ để đọc.');
    return ensureSize(splitText(text));
  }
  if (extension !== 'pdf') throw new Error('Hiện hỗ trợ sách PDF có lớp văn bản hoặc tệp TXT.');

  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = '/vendor/pdf.worker.min.mjs';
  const document = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  if (document.numPages > MAX_PAGES) throw new Error('Sách có quá nhiều trang để nhập cùng lúc.');

  const pages: string[] = [];
  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    const lines: string[] = [];
    let line = '';
    for (const item of content.items) {
      if (!('str' in item)) continue;
      line += item.str;
      if (item.hasEOL) {
        if (line.trim()) lines.push(line.trim());
        line = '';
      } else if (item.str && !item.str.endsWith(' ')) {
        line += ' ';
      }
    }
    if (line.trim()) lines.push(line.trim());
    pages.push(...splitLongPage(cleanPage(lines.join('\n'))));
  }

  const visibleText = pages.join('').replace(/\s/g, '');
  if (visibleText.length < 120) {
    throw new Error('PDF này có vẻ là ảnh quét, chưa có lớp văn bản. Hãy dùng bản PDF có thể bôi chọn chữ hoặc OCR trước.');
  }
  return ensureSize(pages);
}

function cleanPage(text: string): string {
  return text
    .replace(/-\n(?=\p{Ll})/gu, '')
    .replace(/\n(?!\n)/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n\n')
    .trim();
}

function splitText(text: string): string[] {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((part) => part.replace(/\s*\n\s*/g, ' ').trim())
    .filter(Boolean);
  const pages: string[] = [];
  for (const paragraph of paragraphs) {
    for (let start = 0; start < paragraph.length; start += 1800) pages.push(paragraph.slice(start, start + 1800));
  }
  return pages;
}

function splitLongPage(page: string): string[] {
  const chunks: string[] = [];
  for (let start = 0; start < page.length; start += 8000) {
    const hardEnd = Math.min(page.length, start + 8000);
    const end = hardEnd < page.length ? (page.lastIndexOf(' ', hardEnd) > start ? page.lastIndexOf(' ', hardEnd) : hardEnd) : hardEnd;
    chunks.push(page.slice(start, end).trim());
    start = end - 8000;
  }
  return chunks.filter(Boolean);
}

function ensureSize(pages: string[]): string[] {
  const characterCount = pages.reduce((total, page) => total + page.length, 0);
  if (characterCount > MAX_EXTRACTED_CHARACTERS) {
    throw new Error('Sách này quá dài để lưu an toàn trên trình duyệt. Hãy nhập từng phần hoặc một vài chương.');
  }
  return pages;
}
