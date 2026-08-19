import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

/**
 * Enum trong migration và union trong `types.ts` là hai bản chép của cùng một
 * danh sách. Sửa một bên quên bên kia thì lỗi chỉ lộ ra khi thật sự nối
 * Supabase — có thể là vài tháng sau, lúc đã quên mất vì sao. Test này bắt
 * ngay ở `npm test`.
 */

const SQL = readFileSync(
  join(process.cwd(), 'supabase/migrations/20260819000100_writing.sql'),
  'utf8',
);

const TYPES = readFileSync(join(process.cwd(), 'src/lib/writing/types.ts'), 'utf8');

/** Đọc các giá trị của `create type <name> as enum (...)`. */
function sqlEnum(name: string): string[] {
  const m = SQL.match(new RegExp(`create type ${name} as enum \\(([^)]*)\\)`, 'i'));
  const body = m?.[1];
  assert.ok(body, `Không tìm thấy enum ${name} trong migration.`);
  return [...body.matchAll(/'([^']+)'/g)].map((x) => x[1] ?? '').sort();
}

/** Đọc các chuỗi literal của `export type X = 'a' | 'b';` (có thể xuống dòng). */
function tsUnion(name: string): string[] {
  const m = TYPES.match(new RegExp(`export type ${name} =([^;]*);`));
  const body = m?.[1];
  assert.ok(body, `Không tìm thấy union ${name} trong types.ts.`);
  return [...body.matchAll(/'([^']+)'/g)].map((x) => x[1] ?? '').sort();
}

const PAIRS: Array<[string, string]> = [
  ['writing_task', 'WritingTask'],
  ['task1_chart', 'Task1Chart'],
  ['task2_essay', 'Task2Essay'],
  ['writing_mode', 'WritingMode'],
  ['drill_part', 'DrillPart'],
];

for (const [sqlName, tsName] of PAIRS) {
  test(`enum ${sqlName} khớp union ${tsName}`, () => {
    assert.deepEqual(tsUnion(tsName), sqlEnum(sqlName));
  });
}

test('bộ đối chiếu thật sự đọc được dữ liệu, không phải so hai mảng rỗng', () => {
  // Nếu regex hỏng thì cả hai bên cùng ra mảng rỗng và mọi test trên đều xanh
  // một cách vô nghĩa. Chốt lại bằng một giá trị đã biết.
  assert.ok(sqlEnum('task1_chart').includes('process'));
  assert.ok(tsUnion('Task1Chart').includes('process'));
  assert.equal(sqlEnum('drill_part').length, 6);
});
