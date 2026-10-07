import { readFile } from 'node:fs/promises';
import path from 'node:path';

type SourcePage = { page: number; text: string; reviewLines: Array<{ confidence: number; original: string }> };
type SourceTest = {
  id: string;
  title: string;
  source: string;
  section?: 'Reading' | 'Listening';
  questionCount?: number;
  pages: SourcePage[];
  supportPages: SourcePage[];
  answerKey?: Record<string, string | string[]>;
  pdfAsset?: string;
  sourceUrl?: string;
  audioFiles?: string[];
  answerKeyVerified?: boolean;
};
type PrivateOcrBundle = { tests: SourceTest[]; reviewPages: number[] };
type GradeResult = { number: number; answer: string; expected: string; correct: boolean };

const privateDir = path.join(process.cwd(), '.local-private', 'ielts-ocr');
const jsonHeaders = { 'cache-control': 'no-store', 'content-type': 'application/json; charset=utf-8' };

async function readBundle(): Promise<PrivateOcrBundle | null> {
  try {
    return JSON.parse(await readFile(path.join(privateDir, 'source-tests.json'), 'utf8')) as PrivateOcrBundle;
  } catch {
    return null;
  }
}

export async function GET(request: Request): Promise<Response> {
  const bundle = await readBundle();
  if (!bundle) return Response.json({ error: 'Chưa nhập dữ liệu OCR cục bộ.' }, { status: 404 });

  const asset = new URL(request.url).searchParams.get('asset');
  if (asset) return servePrivateAsset(request, bundle, asset);

  return Response.json({
    reviewPages: bundle.reviewPages,
    tests: bundle.tests.map(({ id, title, source, section, questionCount, pages, supportPages, answerKey, pdfAsset, sourceUrl, audioFiles, answerKeyVerified }) => ({
      id, title, source, section, questionCount: questionCount ?? 40,
      pageCount: pages.length, supportPageCount: supportPages.length,
      hasAnswerKey: Boolean(answerKey), answerKeyVerified: answerKeyVerified ?? false,
      hasPdf: Boolean(pdfAsset || sourceUrl), audioCount: audioFiles?.length ?? 0,
    })),
  }, { headers: jsonHeaders });
}

export async function POST(request: Request): Promise<Response> {
  const bundle = await readBundle();
  if (!bundle) return Response.json({ error: 'Chưa nhập dữ liệu OCR cục bộ.' }, { status: 404 });
  const body = await request.json().catch(() => ({})) as { id?: unknown; submitted?: unknown; answers?: unknown };
  if (typeof body.id !== 'string') return Response.json({ error: 'Thiếu mã đề.' }, { status: 400 });
  const test = bundle.tests.find((item) => item.id === body.id);
  if (!test) return Response.json({ error: 'Không tìm thấy đề.' }, { status: 404 });

  const submitted = body.submitted === true;
  const answers = submitted ? sanitizeAnswers(body.answers, test.questionCount ?? 40) : {};
  return Response.json({
    test: {
      id: test.id, title: test.title, source: test.source, section: test.section,
      questionCount: test.questionCount ?? 40, pages: test.pages,
      pdfAsset: test.pdfAsset, sourceUrl: test.sourceUrl, audioFiles: test.audioFiles ?? [],
    },
    supportPages: submitted ? test.supportPages : [],
    grade: submitted ? gradeTest(test, answers) : null,
  }, { headers: jsonHeaders });
}

async function servePrivateAsset(request: Request, bundle: PrivateOcrBundle, requestedName: string): Promise<Response> {
  // Only basenames explicitly referenced by the private test manifest can be served.
  const allowed = new Set(bundle.tests.flatMap((test) => [test.pdfAsset, ...(test.audioFiles ?? [])].filter((v): v is string => typeof v === 'string')));
  if (!allowed.has(requestedName) || path.basename(requestedName) !== requestedName) {
    return Response.json({ error: 'Không tìm thấy tệp nguồn.' }, { status: 404 });
  }

  try {
    const bytes = await readFile(path.join(privateDir, requestedName));
    const contentType = requestedName.toLowerCase().endsWith('.pdf') ? 'application/pdf'
      : requestedName.toLowerCase().endsWith('.m4a') ? 'audio/mp4' : 'audio/mpeg';
    const range = request.headers.get('range');
    const match = range?.match(/^bytes=(\d*)-(\d*)$/);
    const headers = new Headers({
      'accept-ranges': 'bytes', 'cache-control': 'private, no-store',
      'content-type': contentType, 'content-disposition': 'inline',
    });
    if (match) {
      const start = match[1] ? Number(match[1]) : 0;
      const end = match[2] ? Math.min(Number(match[2]), bytes.length - 1) : bytes.length - 1;
      if (start > end || start >= bytes.length) return new Response(null, { status: 416 });
      headers.set('content-range', `bytes ${start}-${end}/${bytes.length}`);
      headers.set('content-length', String(end - start + 1));
      return new Response(new Uint8Array(bytes.subarray(start, end + 1)), { status: 206, headers });
    }
    headers.set('content-length', String(bytes.length));
    return new Response(new Uint8Array(bytes), { headers });
  } catch {
    return Response.json({ error: 'Tệp nguồn chưa có trên máy này.' }, { status: 404 });
  }
}

function sanitizeAnswers(raw: unknown, count: number): Record<string, string> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    const number = Number(key);
    if (Number.isInteger(number) && number >= 1 && number <= count && typeof value === 'string') out[String(number)] = value.slice(0, 120).trim();
  }
  return out;
}

function normalizeAnswer(value: string): string {
  return value.normalize('NFKC').toLocaleLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
}

function gradeTest(test: SourceTest, answers: Record<string, string>): null | { score: number; total: number; results: GradeResult[]; verified: boolean } {
  if (!test.answerKey) return null;
  const total = test.questionCount ?? 40;
  const results = Array.from({ length: total }, (_, index) => {
    const number = index + 1;
    const given = answers[String(number)] ?? '';
    const rawExpected = test.answerKey?.[String(number)] ?? '';
    const expectedList = (Array.isArray(rawExpected) ? rawExpected : [rawExpected]).filter(Boolean);
    const correct = Boolean(given) && expectedList.some((expected) => normalizeAnswer(expected) === normalizeAnswer(given));
    return { number, answer: given, expected: expectedList.join(' / '), correct };
  });
  return { score: results.filter((item) => item.correct).length, total, results, verified: test.answerKeyVerified ?? false };
}
