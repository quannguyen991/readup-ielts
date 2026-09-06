import test from 'node:test';
import assert from 'node:assert/strict';

import type { Ledger, SkillRecord } from '@/services/mastery/types';
import { generateKeyPair } from './keys';
import { buildCredential, verifyCredential, CREDENTIAL_TYPE } from './vc';

function rec(over: Partial<SkillRecord> & { domain: SkillRecord['skill']['domain']; key: string }): SkillRecord {
  return {
    skill: { domain: over.domain, key: over.key },
    status: over.status ?? 'confirmed',
    lastState: over.lastState ?? 'aligned-correct',
    lastSourceId: over.lastSourceId ?? 'wiki-coral-reef',
    observations: over.observations ?? 6,
    observed: over.observed ?? 4,
    transfers: over.transfers ?? 2,
    updatedAt: over.updatedAt ?? '2026-09-06T10:00:00.000Z',
  };
}

const LEDGER: Ledger = {
  'reading:inference': rec({ domain: 'reading', key: 'inference' }),
  'reading:locate': rec({ domain: 'reading', key: 'locate', status: 'probing', transfers: 0, observed: 2 }),
  'sat-math:linear_equations_one_var': rec({
    domain: 'sat-math',
    key: 'linear_equations_one_var',
    status: 'needs-probe',
    transfers: 0,
  }),
  'reading:unseen': rec({ domain: 'reading', key: 'unseen', status: 'unobserved', observed: 0, transfers: 0 }),
};

/* --------------------------------------------------------------- hình dạng */

test('mang đúng ngữ cảnh và kiểu của W3C VC', () => {
  const { did, privateKey } = generateKeyPair();
  const vc = buildCredential({ ledger: LEDGER, did, privateKey });

  assert.ok(vc['@context'].includes('https://www.w3.org/ns/credentials/v2'));
  assert.ok(vc.type.includes('VerifiableCredential'));
  assert.ok(vc.type.includes(CREDENTIAL_TYPE));
});

test('người học vừa là người cấp vừa là chủ thể — chứng chỉ tự cấp', () => {
  const { did, privateKey } = generateKeyPair();
  const vc = buildCredential({ ledger: LEDGER, did, privateKey });
  assert.equal(vc.issuer, did);
  assert.equal(vc.credentialSubject.id, did);
});

test('proof là DataIntegrityProof, trỏ về đúng khoá đã ký', () => {
  const { did, privateKey } = generateKeyPair();
  const vc = buildCredential({ ledger: LEDGER, did, privateKey });
  assert.equal(vc.proof.type, 'DataIntegrityProof');
  assert.equal(vc.proof.proofPurpose, 'assertionMethod');
  assert.ok(vc.proof.verificationMethod.startsWith(did));
});

/* ----------------------------------------------------------- nội dung ruột */

test('KHÔNG mang lastSourceId — đó là dấu vết đã học bài nào', () => {
  const { did, privateKey } = generateKeyPair();
  const vc = buildCredential({ ledger: LEDGER, did, privateKey });
  assert.ok(!JSON.stringify(vc).includes('wiki-coral-reef'));
});

test('bỏ kỹ năng chưa quan sát được — sổ trống không phải một tuyên bố', () => {
  /*
    `unobserved` nghĩa là CHƯA ĐO, không phải "đo rồi và kém". Đưa nó vào chứng
    chỉ thì người đọc sẽ đếm nó như một kỹ năng đã kiểm và trượt.
  */
  const { did, privateKey } = generateKeyPair();
  const vc = buildCredential({ ledger: LEDGER, did, privateKey });
  const keys = vc.credentialSubject.skills.map((s) => s.id);
  assert.ok(!keys.includes('reading:unseen'));
  assert.equal(keys.length, 3);
});

test('ghi rõ số lần chuyển giao, không chỉ ghi trạng thái', () => {
  const { did, privateKey } = generateKeyPair();
  const vc = buildCredential({ ledger: LEDGER, did, privateKey });
  const inf = vc.credentialSubject.skills.find((s) => s.id === 'reading:inference');
  assert.equal(inf?.transfers, 2);
  assert.equal(inf?.status, 'confirmed');
});

test('kỹ năng sắp theo id — hai lần dựng cho cùng một chuỗi ký', () => {
  const { did, privateKey } = generateKeyPair();
  const a = buildCredential({ ledger: LEDGER, did, privateKey, issuedAt: '2026-09-07T00:00:00.000Z' });
  const b = buildCredential({ ledger: LEDGER, did, privateKey, issuedAt: '2026-09-07T00:00:00.000Z' });
  assert.equal(a.proof.proofValue, b.proof.proofValue);
});

test('mang được nhãn xuất xứ của những câu đã dựng nên kết luận', () => {
  const { did, privateKey } = generateKeyPair();
  const vc = buildCredential({
    ledger: LEDGER,
    did,
    privateKey,
    itemLabels: { 'reading:inference': ['a3f0', '91c2'] },
  });
  const inf = vc.credentialSubject.skills.find((s) => s.id === 'reading:inference');
  assert.deepEqual(inf?.itemLabels, ['a3f0', '91c2']);
});

/* ------------------------------------------------------------------ kiểm */

test('chứng chỉ vừa dựng thì kiểm ra hợp lệ', () => {
  const { did, privateKey } = generateKeyPair();
  const vc = buildCredential({ ledger: LEDGER, did, privateKey });
  const got = verifyCredential(vc);
  assert.equal(got.ok, true);
  if (got.ok) {
    assert.equal(got.did, did);
    assert.equal(got.confirmed, 1);
    assert.equal(got.skills, 3);
  }
});

test('sửa trạng thái một kỹ năng là bị bắt', () => {
  const { did, privateKey } = generateKeyPair();
  const vc = buildCredential({ ledger: LEDGER, did, privateKey });
  const cheated = structuredClone(vc);
  cheated.credentialSubject.skills[1]!.status = 'confirmed';
  assert.equal(verifyCredential(cheated).ok, false);
});

test('đổi DID chủ thể sang người khác là bị bắt', () => {
  const { did, privateKey } = generateKeyPair();
  const other = generateKeyPair();
  const vc = buildCredential({ ledger: LEDGER, did, privateKey });
  const stolen = structuredClone(vc);
  stolen.credentialSubject.id = other.did;
  assert.equal(verifyCredential(stolen).ok, false);
});

test('issuer khác chủ thể thì từ chối — chứng chỉ này theo thiết kế là tự cấp', () => {
  const { did, privateKey } = generateKeyPair();
  const other = generateKeyPair();
  const vc = buildCredential({ ledger: LEDGER, did, privateKey });
  const odd = structuredClone(vc);
  odd.issuer = other.did;
  const got = verifyCredential(odd);
  assert.equal(got.ok, false);
});

test('đầu vào rác thì trả về lý do, không ném lỗi', () => {
  for (const bad of [null, 42, 'chuỗi', {}, { proof: {} }, []]) {
    const got = verifyCredential(bad);
    assert.equal(got.ok, false, `phải từ chối ${JSON.stringify(bad)}`);
    if (!got.ok) assert.ok(got.reason.length > 0);
  }
});

test('thiếu proof thì nói thiếu proof', () => {
  const { did, privateKey } = generateKeyPair();
  const vc = buildCredential({ ledger: LEDGER, did, privateKey });
  const { proof, ...withoutProof } = vc;
  void proof;
  const got = verifyCredential(withoutProof);
  assert.equal(got.ok, false);
  if (!got.ok) assert.match(got.reason, /proof/i);
});
