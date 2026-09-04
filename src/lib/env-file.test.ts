import assert from 'node:assert/strict';
import { test } from 'node:test';

import { mergeEnvFile, parseEnvFile } from './env-file';

const EXISTING = [
  '# Created by Vercel CLI',
  'VERCEL_OIDC_TOKEN=abc',
  '',
  '# Nap tu D:\\Claude\\.secrets',
  'OPENAI_API_KEY=sk-secret',
  'OPENAI_BASE_URL=https://proxy.example',
  '',
].join('\n');

test('không xoá biến không liên quan', () => {
  const out = parseEnvFile(
    mergeEnvFile(EXISTING, { EXPO_PUBLIC_SUPABASE_URL: 'https://x.supabase.co' }),
  );
  assert.equal(out.OPENAI_API_KEY, 'sk-secret');
  assert.equal(out.OPENAI_BASE_URL, 'https://proxy.example');
  assert.equal(out.VERCEL_OIDC_TOKEN, 'abc');
  assert.equal(out.EXPO_PUBLIC_SUPABASE_URL, 'https://x.supabase.co');
});

test('giữ nguyên comment', () => {
  const out = mergeEnvFile(EXISTING, { A: '1' });
  assert.ok(out.includes('# Created by Vercel CLI'));
  assert.ok(out.includes('# Nap tu D:\\Claude\\.secrets'));
});

test('khoá đã có thì sửa tại chỗ, không sinh dòng trùng', () => {
  const out = mergeEnvFile(EXISTING, { OPENAI_API_KEY: 'sk-moi' });
  const hits = out.split('\n').filter((l) => l.startsWith('OPENAI_API_KEY='));
  assert.equal(hits.length, 1, 'trùng khoá là bom hẹn giờ: dòng sau thắng khi đọc');
  assert.equal(hits[0], 'OPENAI_API_KEY=sk-moi');
});

test('chạy lại lần hai cho ra đúng kết quả lần đầu', () => {
  const values = { EXPO_PUBLIC_SUPABASE_URL: 'https://x.supabase.co', SUPABASE_SERVICE_KEY: 'sk' };
  const once = mergeEnvFile(EXISTING, values);
  assert.equal(mergeEnvFile(once, values), once);
});

test('file rỗng vẫn ra file hợp lệ', () => {
  const out = mergeEnvFile('', { A: '1', B: '2' });
  assert.deepEqual(parseEnvFile(out), { A: '1', B: '2' });
  assert.ok(!out.startsWith('\n'), 'không mở đầu bằng dòng trắng thừa');
});

test('giá trị chứa dấu bằng không bị cắt', () => {
  // JWT và connection string đều có thể chứa '='; cắt ở dấu '=' đầu tiên mới đúng.
  const out = parseEnvFile(mergeEnvFile('', { K: 'a=b=c' }));
  assert.equal(out.K, 'a=b=c');
});

test('bỏ qua dòng rác thay vì ném lỗi', () => {
  assert.deepEqual(parseEnvFile('rác không có dấu bằng\n\n# chú thích\nA=1'), { A: '1' });
});
