/**
 * Bộ kiểm chứng chỉ ĐỘC LẬP — chạy được khi ReadUp không còn tồn tại.
 *
 *   npx tsx scripts/verify-credential.ts credential.json
 *   cat credential.json | npx tsx scripts/verify-credential.ts
 *
 * VÌ SAO NÓ PHẢI Ở NGOÀI APP. Một hệ thống tự nhận là kiểm chứng được mà chỉ tự
 * nó kiểm được thì không kiểm chứng được. Tệp này không import gì từ tầng app,
 * không gọi mạng, không cần khoá, không cần tài khoản: nó đọc một file JSON và
 * làm toán trên chữ ký. Trường học nào cầm được file là kiểm được, kể cả khi
 * dự án này đã chết từ lâu.
 *
 * XUẤT RA TIẾNG ANH, có chủ ý. Đây đúng là mặt mà `src/i18n/keys.ts` đã khoanh:
 * phần để người ngoài đọc được cơ chế — giám khảo, giáo viên nước ngoài, người
 * muốn tự kiểm. Nội dung học liệu vẫn tiếng Việt; cơ chế thì không.
 *
 * QUAN TRỌNG NHẤT: nó phải NÓI RA NHỮNG GÌ NÓ KHÔNG KIỂM ĐƯỢC. Một biên nhận chỉ
 * toàn dấu ✓ đọc như một tấm bằng, mà đó đúng là hiểu lầm mà cả cơ chế này sinh
 * ra để chặn.
 */
import { readFileSync } from 'node:fs';

import { verifyCredential, type CredentialReport } from '../src/services/credential/vc';

/**
 * Bản tiếng Anh của từng mã lỗi.
 *
 * Nguồn sự thật là MÃ, không phải câu chữ: app dựng câu tiếng Việt từ cùng mã ấy
 * (`FAILURE_VI`, `CREDENTIAL_FAILURE_VI`). Bảng này khai đủ mọi mã — thêm mã mới
 * mà quên dịch thì TypeScript bắt ngay tại đây chứ không đợi tới lúc chạy.
 */
const FAILURE_EN: Readonly<Record<NonNullable<Extract<CredentialReport, { ok: false }>['code']>, string>> =
  Object.freeze({
    'not-an-object': 'not a JSON object',
    'missing-proof': 'no proof block',
    'missing-proof-value': 'proof block has no proofValue',
    'wrong-type': 'not a ReadUpEvidenceCredential',
    'missing-issuer': 'no issuer',
    'missing-subject': 'no credentialSubject.id',
    'issuer-not-subject':
      'issuer differs from credentialSubject.id — this credential type is self-issued, so they must match',
    'bad-did': 'the DID could not be read',
    'proof-not-multibase': 'signature is missing the multibase "z" prefix (base58btc)',
    'proof-undecodable': 'signature could not be base58-decoded',
    'proof-bad-length': 'signature is the wrong length',
    'payload-not-canonical': 'content could not be canonicalised',
    'signature-malformed': 'signature is not a valid Ed25519 signature',
    'signature-mismatch': 'SIGNATURE DOES NOT MATCH — the content was altered after signing, or a different key signed it',
  });

function readInput(argv: string[]): string {
  const path = argv.find((a) => !a.startsWith('-'));
  if (path) return readFileSync(path, 'utf8');
  try {
    return readFileSync(0, 'utf8');
  } catch {
    console.error('Usage: verify-credential <file.json>   (or pipe JSON on stdin)');
    process.exit(2);
  }
}

function parse(text: string): unknown | { parseError: string } {
  try {
    return JSON.parse(text) as unknown;
  } catch (err) {
    return { parseError: (err as Error).message };
  }
}

/** Những điều chữ ký KHÔNG chứng minh. Luôn in ra, không có cờ nào tắt được. */
const CANNOT_CHECK: readonly string[] = Object.freeze([
  'that the holder did not cheat while answering — a signature covers the record, not the exam room',
  'that any institution recognises this credential — it is self-issued by the learner',
  'that the cited item labels exist, until the public label corpus is published',
]);

function report(result: CredentialReport): number {
  if (!result.ok) {
    console.log(`✗ INVALID — ${FAILURE_EN[result.code]}`);
    return 1;
  }

  console.log(`✓ signature valid          ${result.did}`);
  console.log(
    `✓ ${result.skills} skill${result.skills === 1 ? '' : 's'} recorded, ` +
      `${result.confirmed} confirmed by transfer to a different source`,
  );

  if (result.itemLabels.length > 0) {
    console.log(`· ${result.itemLabels.length} provenance labels cited`);
  } else {
    console.log('· no provenance labels cited');
  }

  console.log('');
  console.log('This does NOT establish:');
  for (const line of CANNOT_CHECK) console.log(`  ⚠ ${line}`);
  return 0;
}

const raw = parse(readInput(process.argv.slice(2)));
if (raw !== null && typeof raw === 'object' && 'parseError' in raw) {
  console.log(`✗ INVALID — not valid JSON: ${(raw as { parseError: string }).parseError}`);
  process.exit(1);
}
process.exit(report(verifyCredential(raw)));
