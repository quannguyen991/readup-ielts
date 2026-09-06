/**
 * Dựng phiếu để NGƯỜI THẬT làm đối chứng cho model bịt mắt.
 *
 *   npx tsx scripts/build-human-check.ts --items 100 --out data/provenance/phieu
 *
 * VÌ SAO BƯỚC NÀY KHÔNG BỎ ĐƯỢC. Không có nó thì cả phép đo là AI chấm AI: một
 * model tuyên bố về hành vi của model khác, và không có gì neo tuyên bố ấy vào
 * thế giới. Cho người thật làm đúng những câu ấy, cũng không cho đọc bài, rồi so
 * hai bên — đó là chỗ con số có nghĩa hoặc mất nghĩa.
 *
 * PHẢI HỎI ĐÚNG CÂU ĐÃ HỎI MODEL. Model được hỏi hai thứ: trả lời là gì, và có
 * tự cho là xác định được không. Phiếu này hỏi người y hệt hai thứ đó. Đổi câu
 * hỏi đi — ví dụ hỏi "câu này có hay không" — là đo một thứ khác rồi so với một
 * thứ khác nữa.
 *
 * PHẢI TRỘN CẢ CÂU ĐÃ BỊ LOẠI LẪN CÂU ĐÃ ĐỖ. Chỉ đưa câu model loại thì đo được
 * mỗi tỉ lệ báo động giả, không đo được tỉ lệ bỏ lọt — mà bỏ lọt mới là hỏng
 * nguy hiểm hơn: nó để một câu vô dụng đi thẳng tới người học.
 *
 * n = 3–8 người. Cỡ ấy KHÔNG đỡ nổi một nghiên cứu học tập, nhưng thừa sức đỡ
 * một chỉ số đồng thuận — đó là lý do việc của các bạn ấy là việc này chứ không
 * phải việc kia.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { gateStatus, type ProvenanceLabel } from '../src/services/provenance/label';

type Item = {
  itemId: string;
  type: string;
  prompt: string;
  options: string[] | null;
  correctAnswer: string;
  labelId: string;
};

function flag(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1]! : fallback;
}

function readJsonl<T>(path: string): T[] {
  if (!existsSync(path)) return [];
  return readFileSync(path, 'utf8')
    .split('\n')
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l) as T);
}

/** Băm tất định: cùng đầu vào ra cùng phiếu, để hai lần dựng so được với nhau. */
function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

const ESC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ESC[c]!);
}

const LABELS_3 = ['TRUE / YES', 'FALSE / NO', 'NOT GIVEN'];

function renderItem(item: Item, n: number): string {
  const isThreeWay = item.type === 'true_false_not_given' || item.type === 'yes_no_not_given';
  const choices = isThreeWay ? LABELS_3 : (item.options ?? []);

  const options = choices.length
    ? `<ol class="opts">${choices.map((o) => `<li>${esc(o)}</li>`).join('')}</ol>`
    : '<p class="freetext">Viết câu trả lời của bạn:</p><div class="rule"></div>';

  return `<li class="item">
  <p class="stem"><span class="n">${n}.</span> ${esc(item.prompt)}</p>
  ${options}
  <div class="answers">
    <span>Đáp án bạn chọn: <b class="box"></b></span>
    <span class="determinable">Bạn có chắc không, hay đoán?
      &nbsp;<b class="box"></b> chắc &nbsp;&nbsp; <b class="box"></b> đoán</span>
  </div>
</li>`;
}

const CSS = `
/* 12,5pt vì phiếu này in ra giấy để làm tay. Không kết bộ phông bằng serif:
   phông serif mặc định trên Windows thiếu glyph tiếng Việt và làm vỡ dấu. */
* { box-sizing: border-box; }
body { font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
       font-size: 12.5pt; line-height: 1.5; color: #111; max-width: 720px;
       margin: 0 auto; padding: 24px; }
h1 { font-size: 17pt; margin: 0 0 4px; }
.sub { color: #555; margin: 0 0 18px; }
.brief { background: #f4f6fb; border-left: 3px solid #2563EB; padding: 12px 16px;
         margin: 0 0 24px; }
.brief p { margin: 6px 0; }
ol.items { list-style: none; padding: 0; counter-reset: none; }
li.item { margin: 0 0 26px; padding: 0 0 18px; border-bottom: 1px solid #e4e6ee;
          page-break-inside: avoid; }
.stem { margin: 0 0 8px; }
.n { font-weight: 700; margin-right: 6px; }
ol.opts { margin: 6px 0 10px 0; padding-left: 26px; }
ol.opts li { margin: 3px 0; }
.freetext { margin: 6px 0 4px; color: #555; }
.rule { border-bottom: 1px solid #999; height: 20px; margin-bottom: 8px; }
.answers { display: flex; flex-wrap: wrap; gap: 18px; font-size: 11pt; color: #333; }
.box { display: inline-block; width: 22px; height: 16px; border: 1px solid #666;
       vertical-align: -3px; }
@media print { body { padding: 0; } .brief { break-inside: avoid; } }
`;

function renderSheet(items: Item[]): string {
  return `<!doctype html>
<html lang="vi"><head><meta charset="utf-8">
<title>Phiếu đối chứng — câu hỏi không kèm bài đọc</title>
<style>${CSS}</style></head><body>
<h1>Phiếu đối chứng</h1>
<p class="sub">${items.length} câu hỏi · không có bài đọc kèm theo · khoảng 25–30 phút</p>

<div class="brief">
  <p><b>Việc của bạn:</b> trả lời từng câu dưới đây. <b>Bạn sẽ KHÔNG được đọc bài</b>
     mà những câu này lấy ra từ đó. Đó là chủ ý, không phải nhầm lẫn.</p>
  <p><b>Trả lời sai không sao cả.</b> Chúng tôi không đo bạn. Chúng tôi đang đo
     những câu hỏi này: câu nào trả lời được mà không cần đọc bài thì câu đó
     không đo được kỹ năng đọc hiểu, và chúng tôi cần biết có bao nhiêu câu như vậy.</p>
  <p><b>Ô "chắc hay đoán" quan trọng ngang đáp án.</b> Đoán trúng cũng là đoán.
     Đánh dấu "chắc" chỉ khi bạn thấy mình biết chắc mà không cần bài.</p>
  <p><b>Đừng tra cứu gì cả</b> — không Google, không hỏi AI. Kiến thức sẵn có của
     bạn chính là thứ đang được đo.</p>
</div>

<ol class="items">
${items.map((it, i) => renderItem(it, i + 1)).join('\n')}
</ol>
</body></html>`;
}

function main(): void {
  const labelsPath = flag('labels', 'data/provenance/labels.jsonl');
  const itemsFile = labelsPath.replace(/\.jsonl$/, '') + '.items.jsonl';
  const want = Number.parseInt(flag('items', '100'), 10);
  const outDir = flag('out', 'data/provenance/phieu');

  const labels = readJsonl<ProvenanceLabel>(labelsPath);
  const items = readJsonl<Item>(itemsFile);
  if (items.length === 0) {
    throw new Error(`Chưa có nội dung câu hỏi ở ${itemsFile} — chạy measure-item-validity trước.`);
  }

  const byId = new Map(labels.map((l) => [l.itemId, l]));

  /*
    Chia hai rổ theo phán quyết của model, rồi lấy một nửa mỗi rổ.

    Lấy ngẫu nhiên trong toàn bộ sẽ ra một phiếu gần như toàn câu đã đỗ, vì câu
    đỗ đông hơn hẳn. Lúc ấy đo được tỉ lệ báo động giả mà gần như không đo được
    tỉ lệ bỏ lọt — trong khi bỏ lọt mới là kiểu hỏng để một câu vô dụng đi thẳng
    tới người học.
  */
  const rejected: Item[] = [];
  const passed: Item[] = [];
  for (const it of items) {
    const label = byId.get(it.itemId);
    if (!label) continue;
    const status = gateStatus(label, 'blind');
    if (status === 'rejected') rejected.push(it);
    else if (status === 'passed') passed.push(it);
  }

  const bySeed = (a: Item, b: Item) => hash(a.itemId) - hash(b.itemId);
  rejected.sort(bySeed);
  passed.sort(bySeed);

  const half = Math.floor(want / 2);
  const takeRejected = rejected.slice(0, Math.min(half, rejected.length));
  const takePassed = passed.slice(0, Math.min(want - takeRejected.length, passed.length));
  const chosen = [...takeRejected, ...takePassed].sort(bySeed);

  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'phieu.html'), renderSheet(chosen), 'utf8');
  writeFileSync(
    join(outDir, 'dap-an.json'),
    JSON.stringify(
      {
        note: 'KHÔNG đưa tệp này cho người làm phiếu.',
        builtAt: new Date().toISOString(),
        items: chosen.map((it, i) => ({
          n: i + 1,
          itemId: it.itemId,
          correctAnswer: it.correctAnswer,
          modelVerdict: gateStatus(byId.get(it.itemId)!, 'blind'),
        })),
      },
      null,
      2,
    ),
    'utf8',
  );

  console.log(`Phiếu: ${join(outDir, 'phieu.html')}`);
  console.log(`  ${chosen.length} câu — ${takeRejected.length} câu model đã LOẠI, ${takePassed.length} câu model đã cho ĐỖ`);
  if (takeRejected.length < half) {
    console.log(`  ⚠ chỉ có ${rejected.length} câu bị loại trong kho; phiếu lệch về phía câu đỗ.`);
  }
  console.log(`Đáp án: ${join(outDir, 'dap-an.json')}  (không đưa cho người làm)`);
}

main();
