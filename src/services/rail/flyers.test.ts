import test from 'node:test';
import assert from 'node:assert/strict';

import { FLYER_FRAMES, FLYER_META, FLYERS, flyerById, flyerPixels, isFlyerId, SH, SW, type FlyerOpts } from './flyers';

const OPTS: Record<string, FlyerOpts> = {
  day: { tint: (c) => c, lit: false, rain: false, snow: false, outline: '#000000' },
  night: { tint: (c) => c, lit: true, rain: false, snow: false, outline: '#000000' },
  rain: { tint: (c) => c, lit: true, rain: true, snow: false, outline: '#000000' },
  snow: { tint: (c) => c, lit: false, rain: false, snow: true, outline: '#000000' },
};

test('tám nhân vật, id hợp lệ và có thông số hoạt cảnh', () => {
  assert.equal(FLYERS.length, 8);
  for (const f of FLYERS) {
    assert.ok(isFlyerId(f.id));
    assert.ok(FLYER_META[f.id].fps > 0);
    assert.equal(flyerById(f.id).id, f.id);
  }
  assert.equal(flyerById('tau-hoa').id, 'plane');
  assert.equal(isFlyerId('train'), false);
});

test('mọi khung của mọi nhân vật nằm gọn trong lưới, chừa chỗ cho viền 1 điểm ảnh', () => {
  const bad: string[] = [];
  for (const f of FLYERS)
    for (const [name, o] of Object.entries(OPTS))
      for (let fr = 0; fr < FLYER_FRAMES; fr++) {
        const d = flyerPixels(f.id, fr, o);
        let n = 0;
        for (let y = 0; y < SH; y++)
          for (let x = 0; x < SW; x++)
            if (d[y * SW + x]) {
              n++;
              if (x < 1 || y < 1 || x > SW - 2 || y > SH - 2) bad.push(`${f.id}/${name}/${fr}:(${x},${y})`);
            }
        if (n <= 300) bad.push(`${f.id}/${name}/${fr}: gần như trống (${n})`);
      }
  assert.deepEqual([...new Set(bad.map((b) => b.split('/').slice(0, 1).join() + ' ' + b.split(':')[1]))].slice(0, 30), []);
});

test('khung hoạt cảnh thật sự khác nhau (vỗ cánh, lửa, phi nước đại)', () => {
  for (const f of FLYERS) {
    const a = flyerPixels(f.id, 0, OPTS.day!).join('|');
    const diff = [1, 2, 3].filter((fr) => flyerPixels(f.id, fr, OPTS.day!).join('|') !== a).length;
    assert.ok(diff >= 2, `${f.id}: các khung quá giống nhau`);
  }
});
