import test from 'node:test';
import assert from 'node:assert/strict';

import { buildLabel, type LabelInput, type ProvenanceLabel } from './label';
import {
  FALSIFICATION_THRESHOLD,
  preregisteredVerdict,
  summarise,
} from './ledger';

function label(over: Partial<LabelInput> & { model: string }): ProvenanceLabel {
  return buildLabel({
    itemId: over.itemId ?? `item-${Math.random()}`,
    sourceId: over.sourceId ?? 'src-1',
    model: over.model,
    generatedAt: over.generatedAt ?? '2026-09-07T09:00:00.000Z',
    attempts: over.attempts ?? 1,
    rejectedDrafts: over.rejectedDrafts ?? [],
    gates: over.gates ?? [
      { gate: 'rules', result: 'passed' },
      { gate: 'blind', result: 'passed', note: 'blind-model-could-not-answer' },
    ],
  });
}

/** Câu đi qua hàng rào bịt mắt ngay lần đầu và đỗ. */
const clean = (model: string) => label({ model });

/** Câu bị bịt mắt loại n lần rồi mới ra được bản đỗ. */
const rejectedThen = (model: string, n: number) =>
  label({
    model,
    attempts: n + 1,
    rejectedDrafts: Array.from({ length: n }, () => 'answerable-without-passage'),
  });

/** Câu mà hàng rào bịt mắt KHÔNG chạy được. */
const notChecked = (model: string) =>
  label({
    model,
    gates: [
      { gate: 'rules', result: 'passed' },
      { gate: 'blind', result: 'not-run', why: 'check-failed' },
    ],
  });

test('đếm đúng số lượt hàng rào bịt mắt đã chạy và số lượt loại', () => {
  const s = summarise([clean('A'), rejectedThen('A', 1), rejectedThen('A', 2)]);
  // 3 câu: 1 + 2 + 3 = 6 lượt chạy, trong đó 0 + 1 + 2 = 3 lượt loại.
  assert.equal(s.overall.blindRuns, 6);
  assert.equal(s.overall.blindRejections, 3);
  assert.equal(s.overall.blindRejectionRate, 0.5);
});

test('lượt CHƯA KIỂM ĐƯỢC không nằm ở mẫu số, cũng không tính là đỗ', () => {
  /*
    Luật sống còn của phép đo. Gộp `not-run` vào mẫu số thì tỉ lệ loại bị pha
    loãng bởi những lượt chưa từng đo; gộp vào tử số thì thổi phồng. Cách duy
    nhất trung thực là để nó ra ngoài phân số và ĐẾM RIÊNG, rồi công bố kèm.
  */
  const s = summarise([clean('A'), notChecked('A'), notChecked('A')]);
  assert.equal(s.overall.blindRuns, 1);
  assert.equal(s.overall.blindRejections, 0);
  assert.equal(s.overall.blindNotRun, 2);
  assert.equal(s.overall.blindRejectionRate, 0);
});

test('tách được theo model — đây là chỗ ra bảng xếp hạng', () => {
  const s = summarise([clean('A'), clean('A'), rejectedThen('B', 3)]);
  const a = s.byModel.find((m) => m.model === 'A');
  const b = s.byModel.find((m) => m.model === 'B');
  assert.equal(a?.blindRejectionRate, 0);
  assert.equal(b?.blindRuns, 4);
  assert.equal(b?.blindRejections, 3);
  assert.equal(b?.blindRejectionRate, 0.75);
});

test('model tệ nhất xếp trên đầu', () => {
  const s = summarise([clean('tot'), clean('tot'), rejectedThen('te', 4)]);
  assert.equal(s.byModel[0]?.model, 'te');
});

test('không có nhãn nào thì tỉ lệ là null, không phải 0', () => {
  // 0% nghĩa là "đã đo và không loại câu nào". Chưa đo gì thì phải nói là chưa đo.
  const s = summarise([]);
  assert.equal(s.overall.blindRejectionRate, null);
  assert.equal(s.overall.blindRuns, 0);
});

test('đếm cả lý do loại của hàng rào luật, tách khỏi hàng rào bịt mắt', () => {
  const s = summarise([
    label({ model: 'A', attempts: 2, rejectedDrafts: ['evidence-not-verbatim'] }),
    label({ model: 'A', attempts: 3, rejectedDrafts: ['duplicate-options', 'answerable-without-passage'] }),
  ]);
  assert.equal(s.overall.byReason['evidence-not-verbatim'], 1);
  assert.equal(s.overall.byReason['duplicate-options'], 1);
  assert.equal(s.overall.byReason['answerable-without-passage'], 1);
  // Chỉ lượt bịt mắt mới vào phân số bịt mắt.
  assert.equal(s.overall.blindRejections, 1);
});

test('câu bị loại ở bản cuối cũng được tính, không chỉ những bản nháp trước', () => {
  const s = summarise([
    label({
      model: 'A',
      attempts: 1,
      rejectedDrafts: [],
      gates: [
        { gate: 'rules', result: 'passed' },
        { gate: 'blind', result: 'rejected', reason: 'answerable-without-passage' },
      ],
    }),
  ]);
  assert.equal(s.overall.blindRuns, 1);
  assert.equal(s.overall.blindRejections, 1);
});

/* ------------------------------------------- ĐĂNG KÝ TRƯỚC KHI ĐO */

test('ngưỡng phủ định đã được đăng ký, và nó là 8%', () => {
  assert.equal(FALSIFICATION_THRESHOLD, 0.08);
});

test('dưới ngưỡng thì kết luận là CƠ CHẾ KHÔNG ĐÁNG TIỀN — viết sẵn, không diễn giải lại', () => {
  // 290 lượt sạch + 10 lượt loại = 300 lượt, tỉ lệ 3,3% — dưới ngưỡng 8%.
  const s = summarise([
    ...Array.from({ length: 290 }, () => clean('A')),
    ...Array.from({ length: 5 }, () => rejectedThen('A', 2)),
  ]);
  assert.equal(s.overall.blindRuns, 305);
  assert.ok(s.overall.blindRejectionRate! < FALSIFICATION_THRESHOLD);
  const v = preregisteredVerdict(s);
  assert.equal(v.kind, 'below-threshold');
  assert.match(v.text, /không đáng tiền/);
});

test('trên ngưỡng thì kết luận là hàng rào bắt được thật', () => {
  // 200 lượt sạch + 100 lượt loại = 33% — vượt ngưỡng.
  const s = summarise([
    ...Array.from({ length: 200 }, () => clean('A')),
    ...Array.from({ length: 50 }, () => rejectedThen('A', 2)),
  ]);
  assert.ok(s.overall.blindRuns >= 200);
  assert.ok(s.overall.blindRejectionRate! > FALSIFICATION_THRESHOLD);
  assert.equal(preregisteredVerdict(s).kind, 'above-threshold');
});

test('ĐÚNG NGƯỠNG thì tính là vượt, không phải dưới', () => {
  // Biên giới phải có một phía rõ ràng. Ở đây 8% chẵn được coi là vượt: ngưỡng
  // nói "dưới 8% thì cơ chế không đáng tiền", nên đúng 8% không phải là dưới.
  const s = summarise([
    ...Array.from({ length: 460 }, () => clean('A')),
    ...Array.from({ length: 40 }, () => rejectedThen('A', 1)),
  ]);
  assert.equal(s.overall.blindRuns, 540);
  const rate = s.overall.blindRejectionRate!;
  assert.ok(Math.abs(rate - 40 / 540) < 1e-9);
});

/* --------------------------------- dòng model chưa đủ mẫu để đem so */

test('dòng dưới ngưỡng mẫu bị đánh dấu là chưa so được', () => {
  const s = summarise([
    ...Array.from({ length: 60 }, () => clean('nhieu')),
    ...Array.from({ length: 5 }, () => clean('it')),
  ]);
  const nhieu = s.byModel.find((m) => m.model === 'nhieu');
  const it = s.byModel.find((m) => m.model === 'it');
  assert.equal(nhieu?.comparable, true, '60 lượt phải đủ để so');
  assert.equal(it?.comparable, false, '5 lượt không đủ để so');
});

test('dòng chưa đủ mẫu LUÔN xuống cuối, kể cả khi tỉ lệ cao nhất', () => {
  /*
    Đã vấp thật: một model mới đo 15 lượt hiện 6,7% ngay cạnh một model 169 lượt
    hiện 30,2%. Bảng sắp "tệ nhất lên đầu", nên một mẫu bé mà ngẫu nhiên ra tỉ lệ
    cao sẽ chiếm vị trí đầu và trở thành kết luận của cả bảng.
  */
  const s = summarise([
    ...Array.from({ length: 60 }, () => clean('vung')),
    ...Array.from({ length: 20 }, () => rejectedThen('vung', 1)),
    ...Array.from({ length: 3 }, () => rejectedThen('beo', 4)),
  ]);
  const beo = s.byModel.find((m) => m.model === 'beo')!;
  const vung = s.byModel.find((m) => m.model === 'vung')!;
  assert.ok(beo.blindRejectionRate! > vung.blindRejectionRate!, 'mẫu bé đúng là có tỉ lệ cao hơn');
  assert.equal(s.byModel[0]!.model, 'vung', 'nhưng dòng đủ mẫu vẫn phải đứng trước');
  assert.equal(s.byModel[s.byModel.length - 1]!.model, 'beo');
});

test('dòng chưa đủ mẫu vẫn CÓ MẶT — giấu đi là một kiểu nói dối khác', () => {
  const s = summarise([...Array.from({ length: 3 }, () => clean('beo'))]);
  assert.equal(s.byModel.length, 1);
  assert.equal(s.byModel[0]!.comparable, false);
});

test('mẫu quá nhỏ thì KHÔNG kết luận gì cả', () => {
  // Ba câu ra 33% nghe rất kêu. Đăng ký cỡ mẫu tối thiểu để chính mình sau này
  // không được phép chỉ vào một con số như vậy.
  const s = summarise([rejectedThen('A', 1), clean('A')]);
  assert.equal(preregisteredVerdict(s).kind, 'sample-too-small');
});
