import test from 'node:test';
import assert from 'node:assert/strict';

import {
  base58btcDecode,
  base58btcEncode,
  didKeyFromPublicKey,
  generateKeyPair,
  KeyError,
  publicKeyFromDidKey,
} from './keys';

/* ------------------------------------------------------------------ base58 */

test('base58: vector quen thuộc "hello world"', () => {
  assert.equal(base58btcEncode(new TextEncoder().encode('hello world')), 'StV1DL6CwTryKyV');
});

test('base58: byte 0 ở đầu thành ký tự "1", mỗi byte một ký tự', () => {
  // Quy tắc riêng của base58btc: số 0 đứng đầu không mang giá trị nên phép chia
  // cơ số mất chúng. Phải đếm và bù lại, nếu không thì hai khoá khác nhau ra
  // cùng một chuỗi.
  assert.equal(base58btcEncode(new Uint8Array([0])), '1');
  assert.equal(base58btcEncode(new Uint8Array([0, 0])), '11');
  assert.equal(base58btcEncode(new Uint8Array([0, 0, 1])), '112');
});

test('base58: mảng rỗng ra chuỗi rỗng, và ngược lại', () => {
  assert.equal(base58btcEncode(new Uint8Array([])), '');
  assert.deepEqual(base58btcDecode(''), new Uint8Array([]));
});

test('base58: mã hoá rồi giải mã ra đúng byte ban đầu', () => {
  for (let n = 0; n < 40; n += 1) {
    const bytes = new Uint8Array(n);
    for (let i = 0; i < n; i += 1) bytes[i] = (i * 37 + n * 11) % 256;
    assert.deepEqual(base58btcDecode(base58btcEncode(bytes)), bytes, `hỏng ở độ dài ${n}`);
  }
});

test('base58: byte 0 ở đầu sống sót qua vòng mã hoá — giải mã', () => {
  const bytes = new Uint8Array([0, 0, 0, 9, 200, 3]);
  assert.deepEqual(base58btcDecode(base58btcEncode(bytes)), bytes);
});

test('base58: từ chối ký tự dễ nhìn nhầm (0, O, I, l)', () => {
  for (const bad of ['0', 'O', 'I', 'l']) {
    assert.throws(() => base58btcDecode(`abc${bad}def`), KeyError, `phải từ chối "${bad}"`);
  }
});

/* ----------------------------------------------------------------- did:key */

test('did:key sinh ra luôn bắt đầu bằng did:key:z6Mk', () => {
  /*
    Không phải quy ước cho đẹp. Tiền tố multicodec của ed25519-pub là 0xed 0x01,
    và 34 byte bắt đầu bằng hai byte đó luôn base58 ra chuỗi mở đầu "6Mk". Nên
    một DID ed25519 hợp lệ mà không khớp mẫu này là dấu hiệu mã hoá sai.
  */
  for (let i = 0; i < 20; i += 1) {
    const { did } = generateKeyPair();
    assert.match(did, /^did:key:z6Mk[1-9A-HJ-NP-Za-km-z]+$/, `DID sai dạng: ${did}`);
  }
});

test('did:key giải ra đúng khoá công khai đã đưa vào', () => {
  const { publicKey, did } = generateKeyPair();
  assert.deepEqual(publicKeyFromDidKey(did), publicKey);
});

test('did:key luôn dài 32 byte khoá công khai', () => {
  const { did } = generateKeyPair();
  assert.equal(publicKeyFromDidKey(did).length, 32);
});

test('hai lần sinh khoá cho hai DID khác nhau', () => {
  assert.notEqual(generateKeyPair().did, generateKeyPair().did);
});

test('từ chối DID sai phương thức', () => {
  const { did } = generateKeyPair();
  assert.throws(() => publicKeyFromDidKey(did.replace('did:key:', 'did:web:')), KeyError);
});

test('từ chối DID không có tiền tố multibase "z"', () => {
  const { did } = generateKeyPair();
  assert.throws(() => publicKeyFromDidKey(did.replace('did:key:z', 'did:key:f')), KeyError);
});

test('từ chối khoá không phải ed25519 — sai mã multicodec', () => {
  // 0xec 0x01 là x25519-pub: đúng độ dài, sai loại. Nhận nhầm thì kiểm chữ ký
  // sẽ luôn trượt mà không nói được vì sao.
  const wrong = new Uint8Array(34);
  wrong[0] = 0xec;
  wrong[1] = 0x01;
  assert.throws(() => publicKeyFromDidKey(`did:key:z${base58btcEncode(wrong)}`), KeyError);
});

test('từ chối khoá sai độ dài', () => {
  const short = new Uint8Array(20);
  short[0] = 0xed;
  short[1] = 0x01;
  assert.throws(() => publicKeyFromDidKey(`did:key:z${base58btcEncode(short)}`), KeyError);
});

test('khoá riêng 32 byte, khoá công khai 32 byte', () => {
  const { privateKey, publicKey } = generateKeyPair();
  assert.equal(privateKey.length, 32);
  assert.equal(publicKey.length, 32);
});

test('didKeyFromPublicKey từ chối khoá sai độ dài', () => {
  assert.throws(() => didKeyFromPublicKey(new Uint8Array(31)), KeyError);
});
