/**
 * Rút kho nhãn thành một tệp tóm tắt đủ nhỏ để commit và để trang web đọc.
 *
 *   npx tsx scripts/export-provenance-summary.ts
 *
 * VÌ SAO TÁCH LÀM HAI. Kho nhãn thô sinh ra bằng lời gọi model, nặng dần theo
 * mỗi lần đo, và nằm trong `.gitignore` — nó là DỮ LIỆU, không phải mã nguồn.
 * Nhưng trang đài quan sát phải chạy được trên bản deploy, nơi không có tệp ấy.
 * Tệp tóm tắt là chỗ giao nhau: vài kilobyte, commit được, và mang đúng những
 * con số đã công bố.
 *
 * TÓM TẮT KHÔNG ĐƯỢC LÀM ĐẸP SỐ LIỆU. Nó chép nguyên `summarise()` cộng phán
 * quyết đã đăng ký trước, kể cả khi phán quyết ấy là "mẫu quá nhỏ, không kết
 * luận gì". Một trang nói thẳng rằng nó chưa đủ dữ liệu đáng tin hơn một trang
 * có số.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

import type { ProvenanceLabel } from '../src/services/provenance/label';
import {
  FALSIFICATION_THRESHOLD,
  MIN_SAMPLE,
  preregisteredVerdict,
  summarise,
} from '../src/services/provenance/ledger';

function flag(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1]! : fallback;
}

const labelsPath = flag('labels', 'data/provenance/labels.jsonl');
const outPath = flag('out', 'src/data/provenance-summary.json');

const labels: ProvenanceLabel[] = existsSync(labelsPath)
  ? readFileSync(labelsPath, 'utf8')
      .split('\n')
      .filter((l) => l.trim())
      .map((l) => JSON.parse(l) as ProvenanceLabel)
  : [];

const summary = summarise(labels);
const verdict = preregisteredVerdict(summary);

/** Ngày đo, lấy từ chính các nhãn — không lấy ngày chạy script. */
const dates = labels.map((l) => l.generatedAt).sort();

const out = {
  note: 'Sinh bằng scripts/export-provenance-summary.ts. Đừng sửa tay.',
  exportedAt: new Date().toISOString(),
  measuredFrom: dates[0] ?? null,
  measuredTo: dates[dates.length - 1] ?? null,
  preregistration: {
    threshold: FALSIFICATION_THRESHOLD,
    minSample: MIN_SAMPLE,
    /* Ghi kèm để người đọc tự kiểm được thứ tự: hằng số này nằm trong
       `ledger.ts` và đã được commit trước lần đo đầu tiên. */
    registeredIn: 'src/services/provenance/ledger.ts',
  },
  verdict,
  overall: summary.overall,
  byModel: summary.byModel,
};

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, `${JSON.stringify(out, null, 2)}\n`, 'utf8');

const pct = summary.overall.blindRejectionRate;
console.log(`Đã ghi ${outPath}`);
console.log(`  ${summary.overall.items} câu · ${summary.overall.blindRuns} lượt kiểm`);
console.log(`  tỉ lệ loại: ${pct === null ? 'chưa đo' : `${(pct * 100).toFixed(1)}%`}`);
console.log(`  phán quyết: [${verdict.kind}]`);
