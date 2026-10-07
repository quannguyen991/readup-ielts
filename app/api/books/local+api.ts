import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const localBooks = [
  { id: 'sapiens', title: 'Sapiens: A Brief History of Humankind', author: 'Yuval Noah Harari' },
  { id: 'homo-deus', title: 'Homo Deus: A Brief History of Tomorrow', author: 'Yuval Noah Harari' },
  { id: '21-lessons', title: '21 Lessons for the 21st Century', author: 'Yuval Noah Harari' },
  { id: 'nexus', title: 'Nexus: A Brief History of Information Networks', author: 'Yuval Noah Harari' },
] as const;

const jsonHeaders = {
  'cache-control': 'private, no-store, max-age=0',
  'x-robots-tag': 'noindex, nofollow, noarchive',
};

function isLocalDevelopment(request: Request): boolean {
  if (process.env.NODE_ENV !== 'development') return false;
  const hostname = new URL(request.url).hostname.toLowerCase();
  const hostHeader = ((request.headers.get('host') ?? '').split(':')[0] ?? '').toLowerCase();
  const allowed = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);
  return allowed.has(hostname) && (!hostHeader || allowed.has(hostHeader));
}

async function readPrivateBook(id: string) {
  if (!localBooks.some((book) => book.id === id)) return null;
  const file = path.join(process.cwd(), '.local-private', 'books', 'processed', `${id}.json`);
  try {
    return JSON.parse(await readFile(file, 'utf8')) as {
      id: string;
      title: string;
      author: string;
      pagesEn: string[];
      pagesVi: string[];
    };
  } catch {
    return null;
  }
}

export async function GET(request: Request): Promise<Response> {
  if (!isLocalDevelopment(request)) return Response.json({ error: 'Local book library is unavailable.' }, { status: 404, headers: jsonHeaders });
  const id = new URL(request.url).searchParams.get('id');
  if (id) {
    const book = await readPrivateBook(id);
    if (!book) return Response.json({ error: 'Book text is not ready on this device.' }, { status: 404, headers: jsonHeaders });
    return Response.json(book, { headers: jsonHeaders });
  }

  const processedPath = path.join(process.cwd(), '.local-private', 'books', 'processed');
  const files = new Set(await readdir(processedPath).catch(() => []));
  const books = [];
  for (const metadata of localBooks) {
    if (!files.has(`${metadata.id}.json`)) continue;
    const book = await readPrivateBook(metadata.id);
    if (!book) continue;
    books.push({ id: book.id, title: book.title, author: book.author, englishPages: book.pagesEn.length, vietnamesePages: book.pagesVi.length });
  }
  return Response.json({ books }, { headers: jsonHeaders });
}
