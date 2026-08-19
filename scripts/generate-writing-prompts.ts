import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { validateChartData } from '../src/lib/writing/chart-data';
import {
  generateTask1Prompts,
  generateTask2Prompts,
} from '../src/services/writing/task2-generator';

/**
 * Sinh kho đề Writing xuống seed JSON.
 *
 * Chạy: `npm run writing:prompts`
 *
 * Mọi đề Task 1 phải qua `validateChartData` trước khi ghi. Có đề hỏng thì dừng
 * hẳn chứ không ghi một phần: seed ghi dở còn khó lần ra hơn là không ghi gì.
 */

const OUT = join(process.cwd(), 'src/data/seed/writing/index.json');

function main(): void {
  const task1 = generateTask1Prompts();
  const task2 = generateTask2Prompts();

  const bad: string[] = [];
  for (const p of task1) {
    const r = validateChartData(p.chartData);
    if (!r.ok) bad.push(`${p.id}: ${r.reason}`);
  }
  if (bad.length > 0) {
    console.error('Có đề Task 1 không hợp lệ, KHÔNG ghi seed:');
    for (const line of bad) console.error('  -', line);
    process.exit(1);
  }

  const all = [...task1, ...task2];
  const ids = new Set(all.map((p) => p.id));
  if (ids.size !== all.length) {
    console.error('Có id trùng nhau, KHÔNG ghi seed.');
    process.exit(1);
  }

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, `${JSON.stringify(all, null, 2)}\n`, 'utf8');

  const byKind = new Map<string, number>();
  for (const p of task1) {
    const k = p.chartKind ?? '?';
    byKind.set(k, (byKind.get(k) ?? 0) + 1);
  }
  const byEssay = new Map<string, number>();
  for (const p of task2) {
    const k = p.essayKind ?? '?';
    byEssay.set(k, (byEssay.get(k) ?? 0) + 1);
  }

  console.log(`Đã ghi ${all.length} đề vào ${OUT}`);
  console.log(`  Task 1: ${task1.length} — ${[...byKind].map(([k, v]) => `${k} ${v}`).join(', ')}`);
  console.log(`  Task 2: ${task2.length} — ${[...byEssay].map(([k, v]) => `${k} ${v}`).join(', ')}`);
}

main();
