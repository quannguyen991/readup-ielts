import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

import { MATH_SKILL_DOMAIN } from './types';
import type { MathDomain, MathSkill } from './types';

/**
 * Enum trong migration và union trong `types.ts` là hai bản chép của cùng một
 * danh sách — cùng lý do đã ghi ở `src/lib/writing/enum-parity.test.ts`: sửa
 * một bên quên bên kia thì lỗi chỉ lộ ra khi thật sự nối Supabase.
 *
 * Module Math có thêm một chỗ chép ba lần: ánh xạ kỹ năng → domain nằm ở
 * `MATH_SKILL_DOMAIN` (TypeScript) và ở ràng buộc `math_items_domain_matches_skill`
 * (SQL). Hai bên lệch nhau thì app ghi được dữ liệu mà Supabase từ chối, hoặc
 * tệ hơn là thống kê theo domain đếm sai mà không có gì báo.
 */

const SQL = readFileSync(
  join(process.cwd(), 'supabase/migrations/20260821000100_math.sql'),
  'utf8',
);

const TYPES = readFileSync(join(process.cwd(), 'src/lib/math/types.ts'), 'utf8');

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
  ['math_domain', 'MathDomain'],
  ['math_skill', 'MathSkill'],
  ['math_format', 'MathFormat'],
  ['math_difficulty', 'MathDifficulty'],
  ['math_session_mode', 'MathSessionMode'],
  ['math_error_tag', 'MathErrorTag'],
];

for (const [sqlName, tsName] of PAIRS) {
  test(`enum ${sqlName} khớp union ${tsName}`, () => {
    assert.deepEqual(tsUnion(tsName), sqlEnum(sqlName));
  });
}

test('bộ đối chiếu thật sự đọc được dữ liệu, không phải so hai mảng rỗng', () => {
  // Nếu regex hỏng thì cả hai bên cùng ra mảng rỗng và mọi test trên đều xanh
  // một cách vô nghĩa. Chốt lại bằng một giá trị đã biết.
  assert.ok(sqlEnum('math_skill').includes('right_triangles_trig'));
  assert.ok(tsUnion('MathSkill').includes('right_triangles_trig'));
  assert.equal(sqlEnum('math_skill').length, 19);
});

// ------------------------------------------------- ánh xạ kỹ năng → domain

/**
 * Đọc ánh xạ từ ràng buộc SQL:
 *
 *     when skill in ('a', 'b') then 'algebra'::math_domain
 *     ...
 *     else 'geometry_trig'::math_domain
 *
 * Nhánh `else` gom mọi kỹ năng chưa được liệt kê, nên phải suy ra bằng phần bù
 * chứ không đọc thẳng được.
 */
function sqlSkillDomain(): Record<string, string> {
  const block = SQL.match(/constraint math_items_domain_matches_skill check \(([\s\S]*?)\n  \)/);
  assert.ok(block?.[1], 'Không tìm thấy ràng buộc math_items_domain_matches_skill.');

  const map: Record<string, string> = {};
  const branches = [...block[1].matchAll(/when skill in \(([^)]*)\) then '([a-z_]+)'::math_domain/g)];
  assert.ok(branches.length > 0, 'Không đọc được nhánh when nào — regex hỏng.');

  for (const branch of branches) {
    const domain = branch[2] ?? '';
    for (const skill of [...(branch[1] ?? '').matchAll(/'([^']+)'/g)]) {
      map[skill[1] ?? ''] = domain;
    }
  }

  const fallback = block[1].match(/else '([a-z_]+)'::math_domain/);
  assert.ok(fallback?.[1], 'Ràng buộc thiếu nhánh else.');
  for (const skill of sqlEnum('math_skill')) {
    if (!(skill in map)) map[skill] = fallback[1];
  }

  return map;
}

test('MATH_SKILL_DOMAIN khớp ràng buộc math_items_domain_matches_skill', () => {
  const fromSql = sqlSkillDomain();
  const fromTs = MATH_SKILL_DOMAIN as Record<string, MathDomain>;

  assert.deepEqual(Object.keys(fromTs).sort(), Object.keys(fromSql).sort());
  for (const [skill, domain] of Object.entries(fromTs)) {
    assert.equal(fromSql[skill], domain, `Kỹ năng ${skill} bị xếp khác domain giữa TS và SQL.`);
  }
});

test('tỷ trọng bốn domain đúng như đề thật', () => {
  // Không phải kiểm chính tả: bài chẩn đoán chia câu theo số kỹ năng của từng
  // domain, nên đếm sai ở đây là bộ đề chẩn đoán lệch khỏi cấu trúc đề thi.
  const count: Record<MathDomain, number> = {
    algebra: 0,
    advanced_math: 0,
    problem_solving_data: 0,
    geometry_trig: 0,
  };
  for (const skill of Object.keys(MATH_SKILL_DOMAIN) as MathSkill[]) {
    count[MATH_SKILL_DOMAIN[skill]] += 1;
  }

  assert.deepEqual(count, {
    algebra: 5,
    advanced_math: 3,
    problem_solving_data: 7,
    geometry_trig: 4,
  });
});
