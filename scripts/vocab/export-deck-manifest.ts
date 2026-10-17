// Xuất danh sách mọi bộ từ vựng (slug + tên) ra scripts/vocab/deck-manifest.json.
// Chạy lại khi thêm hoặc đổi bộ, rồi chạy scripts/vocab/gen-covers-svg.mjs.
// Chạy: npx tsx scripts/vocab/export-deck-manifest.ts
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { SAT_MATH_VOCAB_LESSONS, SAT_VERBAL_VOCAB_LESSONS } from '../../src/data/lessons/vocab-lessons';
import { VFI_DECKS } from '../../src/data/vocab-for-ielts';
import { VFIA_DECKS } from '../../src/data/vocab-for-ielts-advanced';
import { LISTENING_DECKS } from '../../src/data/vocab-listening';
import { GLOBAL_SUCCESS_DECKS, VOCAB_TOPICS } from '../../src/data/vocab-topics';
import { DESTINATION_DECKS } from '../../src/data/destination-vocab';
import { DAILY_TALK_TOPICS } from '../../src/data/vocab-daily';
import { unitsFor } from '../../src/data/intl/units';

type Row = { slug: string; source: string; en: string; vi: string };
const out: Row[] = [];
const add = (slug: string, source: string, en: string | undefined, vi: string | undefined) =>
  out.push({ slug, source, en: en ?? '', vi: vi ?? '' });

for (const t of VOCAB_TOPICS as any[]) add(t.slug, 'topic', t.name, t.nameVi);
for (const t of GLOBAL_SUCCESS_DECKS as any[]) add(t.slug, 'global', t.name ?? t.nameVi, t.nameVi);
for (const t of VFI_DECKS as any[]) add(t.slug, 'vfi', t.name, t.blurb);
for (const t of VFIA_DECKS as any[]) add(t.slug, 'vfia', t.name, t.blurb);
for (const t of LISTENING_DECKS as any[]) add(t.slug, 'listening', t.name, t.nameVi);
for (const t of DESTINATION_DECKS as any[]) add(t.slug, 'destination', t.name, t.nameVi);
for (const l of SAT_MATH_VOCAB_LESSONS as any[]) add(l.slug, 'satMath', l.title, l.title);
for (const l of SAT_VERBAL_VOCAB_LESSONS as any[]) add(l.slug, 'satVerbal', l.title, l.title);
for (const t of DAILY_TALK_TOPICS as any[]) add(t.slug, 'daily', t.name, t.nameVi);
for (const exam of ['toeic', 'toefl'] as const)
  for (const u of unitsFor(exam) as any[]) add(`${exam}-unit-${u.index}`, exam, `Unit ${u.index} ${u.title?.en ?? ''}`, `Unit ${u.index} ${u.title?.vi ?? u.title ?? ''}`);

const seen = new Set<string>();
const unique = out.filter((d) => (seen.has(d.slug) ? false : (seen.add(d.slug), true)));
const here = dirname(fileURLToPath(import.meta.url));
writeFileSync(join(here, 'deck-manifest.json'), JSON.stringify(unique, null, 1), 'utf8');
console.log(`ok: ${unique.length} bộ (đã bỏ ${out.length - unique.length} trùng)`);
