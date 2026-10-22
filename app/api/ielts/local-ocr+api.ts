import { readFile } from 'node:fs/promises';
import path from 'node:path';
import externalCatalog from '@/data/ielts-external-tests.json';
import { CAM_VOL_TEST_PACKAGES, testPackageToSourceTest } from '@/data/ielts-cam-vol-bank';
import { canonicalSourceTestId, compareSourceTests, hasCompleteKey, prepareSourceTest, type SourceTest } from '@/services/ielts/source-catalog';

type PrivateOcrBundle = { tests: SourceTest[]; reviewPages: number[] };
type GradeResult = { number: number; answer: string; expected: string; correct: boolean };

const privateDir = path.join(process.cwd(), '.local-private', 'ielts-ocr');
const jsonHeaders = { 'cache-control': 'no-store', 'content-type': 'application/json; charset=utf-8' };
const publicExternalVolumes = [10, 11, 12, 13, 14, 15, 16, 21];

function externalSourceOnlyTests(): SourceTest[] {
  return publicExternalVolumes.flatMap((volume) => (['Listening', 'Reading'] as const).flatMap((section) => {
    const sectionSlug = section.toLowerCase();
    return Array.from({ length: 4 }, (_, index) => {
      const testNumber = index + 1;
      return {
        id: `cambridge-${volume}-${sectionSlug}-${testNumber}`,
        title: `Cambridge IELTS ${volume} · ${section} Test ${testNumber}`,
        source: `Cambridge IELTS ${volume}`,
        section,
        questionCount: 40,
        pages: [],
        supportPages: [],
        sourceUrl: `https://navsenglish.com/ielts/${sectionSlug}/test?slug=cambridge-${volume}-academic-${sectionSlug}-test-${testNumber}&ref=vankhongluoi`,
        audioFiles: [],
        answerKeyVerified: false,
        externalOnly: false,
      };
    });
  }));
}

async function readBundle(): Promise<PrivateOcrBundle | null> {
  const externalTests = externalCatalog.tests as SourceTest[];
  let raw: PrivateOcrBundle | null = null;
  try {
    raw = JSON.parse(await readFile(path.join(privateDir, 'source-tests.json'), 'utf8')) as PrivateOcrBundle;
  } catch {
    try {
      raw = JSON.parse(await readFile(path.join(process.cwd(), 'src', 'data', 'ielts-source-tests.json'), 'utf8')) as PrivateOcrBundle;
    } catch {
      raw = null;
    }
  }
  if (raw) {
    const testMap = new Map(externalTests.map((test) => [test.id, test]));
    for (const test of raw.tests) testMap.set(test.id, prepareSourceTest(test));
    return { tests: [...testMap.values()].sort(compareSourceTests), reviewPages: raw.reviewPages ?? [] };
  }
  return { tests: [...externalTests, ...externalSourceOnlyTests()].sort(compareSourceTests), reviewPages: [] };
}

export async function GET(request: Request): Promise<Response> {
  const bundle = await readBundle();
  if (!bundle) return Response.json({ error: 'Chưa nhập dữ liệu OCR cục bộ.' }, { status: 404 });

  const asset = new URL(request.url).searchParams.get('asset');
  if (asset) return servePrivateAsset(request, bundle, asset);

  return Response.json({
    reviewPages: bundle.reviewPages,
    tests: bundle.tests.map(({ id, title, source, section, questionCount, answerMode, responseLabels, pages, supportPages, answerKey, pdfAsset, sourceUrl, audioFiles, audioCloudUrl, answerKeyVerified, externalOnly, parts, missingComponents }) => ({
      id, title, source, section, questionCount: questionCount ?? 40,
      answerMode, responseLabels,
      pageCount: pages.length, supportPageCount: supportPages.length,
      hasAnswerKey: Boolean(answerKey || supportPages.length), answerKeyVerified: answerKeyVerified ?? false,
      hasPdf: Boolean(pdfAsset || sourceUrl), audioCount: audioFiles?.length ?? 0,
      audioCloudUrl,
      externalOnly: externalOnly ?? false,
      partCount: parts?.length ?? 0, missingComponents: missingComponents ?? [],
    })),
  }, { headers: jsonHeaders });
}

export async function POST(request: Request): Promise<Response> {
  const bundle = await readBundle();
  if (!bundle) return Response.json({ error: 'Chưa nhập dữ liệu OCR cục bộ.' }, { status: 404 });
  const body = await request.json().catch(() => ({})) as { id?: unknown; submitted?: unknown; answers?: unknown };
  const requestedId = typeof body.id === 'string' ? body.id : '';
  const test = bundle.tests.find((item) => item.id === canonicalSourceTestId(requestedId));
  if (!test || !requestedId) return Response.json({ error: 'Không tìm thấy đề.' }, { status: 404 });

  const submitted = body.submitted === true;
  const answers = submitted ? sanitizeAnswers(body.answers, test.questionCount ?? 40, test.answerMode === 'long' ? 10000 : 120) : {};
  return Response.json({
    test: {
      id: test.id, title: test.title, source: test.source, section: test.section,
      questionCount: test.questionCount ?? 40, answerMode: test.answerMode, responseLabels: test.responseLabels, pages: test.pages,
      pdfAsset: test.pdfAsset, sourceStartPage: test.sourceStartPage ?? 1,
      sourceUrl: test.sourceUrl, audioFiles: test.audioFiles ?? [], audioCloudUrl: test.audioCloudUrl, externalOnly: test.externalOnly ?? false,
      parts: test.parts ?? [], missingComponents: test.missingComponents ?? [],
    },
    supportPages: submitted ? test.supportPages : [],
    grade: submitted ? gradeTest(test, answers) : null,
  }, { headers: jsonHeaders });
}

async function servePrivateAsset(request: Request, bundle: PrivateOcrBundle, requestedName: string): Promise<Response> {
  // Only basenames explicitly referenced by the private test manifest can be served.
  const allowed = new Set(bundle.tests.flatMap((test) => [test.pdfAsset, ...(test.audioFiles ?? []), ...test.pages.map((p) => p.imageAsset), ...test.supportPages.map((p) => p.imageAsset)].filter((v): v is string => typeof v === 'string')));
  if (!allowed.has(requestedName) || path.basename(requestedName) !== requestedName) {
    return Response.json({ error: 'Không tìm thấy tệp nguồn.' }, { status: 404 });
  }

  try {
    const bytes = await readFile(path.join(privateDir, requestedName));
    const contentType = requestedName.toLowerCase().endsWith('.webp') ? 'image/webp' : requestedName.toLowerCase().endsWith('.pdf') ? 'application/pdf'
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

function sanitizeAnswers(raw: unknown, count: number, maxLength: number): Record<string, string> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    const number = Number(key);
    if (Number.isInteger(number) && number >= 1 && number <= count && typeof value === 'string') out[String(number)] = value.slice(0, maxLength).trim();
  }
  return out;
}

function normalizeAnswer(value: string): string {
  return value.normalize('NFKC').toLocaleLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
}

function gradeTest(test: SourceTest, answers: Record<string, string>): null | { score: number; total: number; results: GradeResult[]; verified: boolean; bandEstimate: number | null } {
  if (!hasCompleteKey(test)) return null;
  const total = test.questionCount ?? 40;
  const results = Array.from({ length: total }, (_, index) => {
    const number = index + 1;
    const given = answers[String(number)] ?? '';
    const rawExpected = test.answerKey?.[String(number)] ?? '';
    const expectedList = (Array.isArray(rawExpected) ? rawExpected : [rawExpected]).filter(Boolean);
    const correct = Boolean(given) && expectedList.some((expected) => normalizeAnswer(expected) === normalizeAnswer(given));
    return { number, answer: given, expected: expectedList.join(' / '), correct };
  });
  const score = results.filter((item) => item.correct).length;
  const verified = test.answerKeyVerified ?? false;
  const bandEstimate = verified && total === 40 && (test.section === 'Reading' || test.section === 'Listening')
    ? estimateIeltsBand(score, test.section, results.some((item) => item.answer))
    : null;
  return { score, total, results, verified, bandEstimate };
}

function estimateIeltsBand(score: number, section: 'Reading' | 'Listening', attempted: boolean): number {
  if (!attempted) return 0;
  const listening = [
    [39, 9], [37, 8.5], [35, 8], [32, 7.5], [30, 7], [26, 6.5], [23, 6],
    [18, 5.5], [16, 5], [13, 4.5], [10, 4], [8, 3.5], [6, 3], [4, 2.5], [3, 2], [2, 1.5], [0, 1],
  ] as const;
  const reading = [
    [39, 9], [37, 8.5], [35, 8], [33, 7.5], [30, 7], [27, 6.5], [23, 6],
    [19, 5.5], [15, 5], [13, 4.5], [10, 4], [8, 3.5], [6, 3], [4, 2.5], [3, 2], [2, 1.5], [0, 1],
  ] as const;
  const thresholds = section === 'Listening' ? listening : reading;
  return thresholds.find(([minimum]) => score >= minimum)?.[1] ?? 1;
}
