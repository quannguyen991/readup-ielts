import test from 'node:test';
import assert from 'node:assert/strict';

import { generateKeyPair } from './keys';
import { signPayload, verifyPayload } from './sign';

const PAYLOAD = {
  did: 'did:key:z6MkExample',
  skills: [
    { key: 'reading:inference', status: 'confirmed', transfers: 2 },
    { key: 'reading:detail', status: 'probing', transfers: 0 },
  ],
  issuedAt: '2026-09-07T00:00:00Z',
};

test('ký rồi kiểm thì hợp lệ', () => {
  const { privateKey, did } = generateKeyPair();
  const proof = signPayload(PAYLOAD, privateKey);
  assert.deepEqual(verifyPayload(PAYLOAD, proof, did), { ok: true });
});

test('chữ ký mang tiền tố multibase "z"', () => {
  const { privateKey } = generateKeyPair();
  assert.match(signPayload(PAYLOAD, privateKey), /^z[1-9A-HJ-NP-Za-km-z]+$/);
});

test('thứ tự khoá lúc dựng object không đổi chữ ký', () => {
  const { privateKey } = generateKeyPair();
  const a = signPayload({ x: 1, y: 2 }, privateKey);
  const b = signPayload({ y: 2, x: 1 }, privateKey);
  assert.equal(a, b);
});

/* ------------------------------------------------- những thứ PHẢI bị bắt */

test('sửa một giá trị là chữ ký hỏng', () => {
  const { privateKey, did } = generateKeyPair();
  const proof = signPayload(PAYLOAD, privateKey);
  const tampered = { ...PAYLOAD, skills: [{ key: 'reading:inference', status: 'confirmed', transfers: 99 }] };
  const got = verifyPayload(tampered, proof, did);
  assert.equal(got.ok, false);
});

test('nâng "probing" lên "confirmed" là chữ ký hỏng', () => {
  /*
    Đây là cách gian lận rõ ràng nhất với một chứng chỉ năng lực: sửa trạng thái
    một kỹ năng trong file JSON rồi nộp đi. Test này khoá đúng chỗ đó.
  */
  const { privateKey, did } = generateKeyPair();
  const proof = signPayload(PAYLOAD, privateKey);
  const cheated = {
    ...PAYLOAD,
    skills: PAYLOAD.skills.map((s) => ({ ...s, status: 'confirmed' })),
  };
  assert.equal(verifyPayload(cheated, proof, did).ok, false);
});

test('thêm một kỹ năng chưa từng có là chữ ký hỏng', () => {
  const { privateKey, did } = generateKeyPair();
  const proof = signPayload(PAYLOAD, privateKey);
  const padded = {
    ...PAYLOAD,
    skills: [...PAYLOAD.skills, { key: 'reading:vocabulary', status: 'confirmed', transfers: 5 }],
  };
  assert.equal(verifyPayload(padded, proof, did).ok, false);
});

test('bỏ hẳn một trường là chữ ký hỏng', () => {
  const { privateKey, did } = generateKeyPair();
  const proof = signPayload(PAYLOAD, privateKey);
  const { issuedAt, ...without } = PAYLOAD;
  void issuedAt;
  assert.equal(verifyPayload(without, proof, did).ok, false);
});

test('chữ ký của người khác không dùng được cho DID này', () => {
  const alice = generateKeyPair();
  const bob = generateKeyPair();
  const proof = signPayload(PAYLOAD, alice.privateKey);
  assert.equal(verifyPayload(PAYLOAD, proof, bob.did).ok, false);
});

/* ------------------- đầu vào rác: BÁO LỖI, không được ném ra ngoài */

test('DID hỏng thì trả về lý do, không ném lỗi', () => {
  const { privateKey } = generateKeyPair();
  const proof = signPayload(PAYLOAD, privateKey);
  const got = verifyPayload(PAYLOAD, proof, 'did:web:example.com');
  assert.equal(got.ok, false);
  if (!got.ok) assert.match(got.reason, /DID/i);
});

test('chữ ký hỏng thì trả về lý do, không ném lỗi', () => {
  const { did } = generateKeyPair();
  for (const bad of ['', 'z', 'khong-phai-multibase', 'z000OOO']) {
    const got = verifyPayload(PAYLOAD, bad, did);
    assert.equal(got.ok, false, `phải từ chối "${bad}"`);
  }
});

test('payload không canonical hoá được thì trả về lý do, không ném lỗi', () => {
  const { did } = generateKeyPair();
  const got = verifyPayload({ a: 1.5 }, 'zabc', did);
  assert.equal(got.ok, false);
});

test('ký payload không canonical hoá được thì NÉM lỗi', () => {
  // Ngược với lúc kiểm: lúc ký, dữ liệu là của mình, hỏng thì phải hỏng to
  // tiếng ngay tại chỗ chứ không im lặng tạo ra một chữ ký vô nghĩa.
  const { privateKey } = generateKeyPair();
  assert.throws(() => signPayload({ a: new Date() }, privateKey));
});
