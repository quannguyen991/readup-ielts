import assert from 'node:assert/strict';
import { test } from 'node:test';

import { countEvents, toCsv } from './event-csv';

test('gom theo ngày, sự kiện, nguồn và chiến dịch; thiếu utm thì ghi (không rõ)', () => {
  const counts = countEvents([
    { at: '2026-10-22T08:00:00Z', name: 'sign_up', utm_source: 'instagram', utm_campaign: 'writing', signed_in: true },
    { at: '2026-10-22T09:00:00Z', name: 'sign_up', utm_source: 'instagram', utm_campaign: 'writing', signed_in: true },
    { at: '2026-10-22T10:00:00Z', name: 'start_lesson', utm_source: null, utm_campaign: null, signed_in: false },
  ]);
  assert.deepEqual(counts, [
    { day: '2026-10-22', name: 'sign_up', utm_source: 'instagram', utm_campaign: 'writing', count: 2 },
    { day: '2026-10-22', name: 'start_lesson', utm_source: '(không rõ)', utm_campaign: '(không rõ)', count: 1 },
  ]);
});

test('CSV có BOM, tiêu đề, và ô có dấu phẩy được bọc ngoặc kép', () => {
  const csv = toCsv([{ day: '2026-10-22', name: 'sign_up', utm_source: 'a,b', utm_campaign: 'c"d', count: 3 }]);
  assert.ok(csv.startsWith('﻿ngày,sự kiện'));
  assert.ok(csv.includes('2026-10-22,sign_up,"a,b","c""d",3'));
});
