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

/*
  TÁCH THEO DẠNG CÂU, nối từ tệp nội dung chứ không lấy trong nhãn.

  Dạng câu là thuộc tính của CÂU HỎI, không phải của hồ sơ xuất xứ — nhét nó vào
  nhãn sẽ đổi băm id và bắt phải đo lại toàn bộ kho. Nối ở đây thì miễn phí.

  Và tách ra là bắt buộc chứ không phải cho đẹp: đo thật cho thấy nhận định
  True/False rò rỉ gần một nửa trong khi trắc nghiệm chỉ hơn 8%. Một con số gộp
  giấu mất đúng phần dùng được — biết dạng nào không nên để AI sinh.
*/
type Item = { itemId: string; type: string };

const itemsPath = labelsPath.replace(/\.jsonl$/, '') + '.items.jsonl';
const typeOf = new Map<string, string>(
  existsSync(itemsPath)
    ? readFileSync(itemsPath, 'utf8')
        .split('\n')
        .filter((l) => l.trim())
        .map((l) => {
          const it = JSON.parse(l) as Item;
          return [it.itemId, it.type] as const;
        })
    : [],
);

const perType = new Map<string, { blindRuns: number; blindRejections: number }>();
for (const label of labels) {
  const type = typeOf.get(label.itemId);
  if (!type) continue;
  const blind = label.gates.find((g) => g.gate === 'blind');
  if (!blind || blind.result === 'not-run') continue;
  const bucket = perType.get(type) ?? { blindRuns: 0, blindRejections: 0 };
  bucket.blindRuns += 1;
  if (blind.result === 'rejected') bucket.blindRejections += 1;
  perType.set(type, bucket);
}

const byType = [...perType.entries()]
  .map(([type, v]) => ({
    type,
    ...v,
    blindRejectionRate: v.blindRuns === 0 ? null : v.blindRejections / v.blindRuns,
  }))
  .sort((a, b) => (b.blindRejectionRate ?? -1) - (a.blindRejectionRate ?? -1));

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
  byType,
};

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, `${JSON.stringify(out, null, 2)}\n`, 'utf8');

const pct = summary.overall.blindRejectionRate;
console.log(`Đã ghi ${outPath}`);
console.log(`  ${summary.overall.items} câu · ${summary.overall.blindRuns} lượt kiểm`);
console.log(`  tỉ lệ loại: ${pct === null ? 'chưa đo' : `${(pct * 100).toFixed(1)}%`}`);
console.log(`  phán quyết: [${verdict.kind}]`);
