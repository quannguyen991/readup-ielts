import { test } from 'node:test';
import assert from 'node:assert/strict';

import { findCityOwner, fetchHubRows, listCities, namesOf, readHubBase, shortId, userIdRange, type Admin } from './city-server';

/**
 * Khung giả của Supabase: chỉ đủ cho các truy vấn của API thành phố, và CẮT 1.000
 * dòng mỗi lần đọc y như PostgREST thật (không báo lỗi).
 */
type Row = Record<string, unknown>;
function fakeAdmin(tables: Record<string, Row[]>) {
  const calls: { table: string; op: string; arg?: unknown }[] = [];
  const admin = {
    from(table: string) {
      let rows = [...(tables[table] ?? [])];
      let cols = '*';
      let from = 0;
      let to = 999;
      let ranged = false;
      const q = {
        select(c: string) {
          cols = c;
          return q;
        },
        eq(col: string, v: unknown) {
          rows = rows.filter((r) => r[col] === v);
          return q;
        },
        in(col: string, vs: unknown[]) {
          calls.push({ table, op: 'in', arg: vs.length });
          rows = rows.filter((r) => vs.includes(r[col]));
          return q;
        },
        gte(col: string, v: string) {
          calls.push({ table, op: 'gte', arg: v });
          rows = rows.filter((r) => String(r[col]) >= v);
          return q;
        },
        lte(col: string, v: string) {
          rows = rows.filter((r) => String(r[col]) <= v);
          return q;
        },
        order(col: string) {
          rows.sort((a, b) => (String(a[col]) < String(b[col]) ? -1 : 1));
          return q;
        },
        range(a: number, b: number) {
          from = a;
          to = b;
          ranged = true;
          return q;
        },
        then(resolve: (v: { data: Row[]; error: null }) => unknown) {
          calls.push({ table, op: ranged ? 'page' : 'read', arg: from });
          const page = rows.slice(from, Math.min(to, from + 999) + 1); // tối đa 1.000 dòng một lần
          const out = page.map((r) => project(r, cols));
          return Promise.resolve({ data: out, error: null }).then(resolve);
        },
      };
      return q;
    },
  };
  return { admin: admin as unknown as Admin, calls };
}

function project(r: Row, cols: string): Row {
  if (cols === '*') return r;
  const out: Row = {};
  for (const raw of cols.split(',').map((c) => c.trim())) {
    const m = /^(\w+):payload->>?(\w+)$/.exec(raw);
    if (m) out[m[1]!] = (r.payload as Row | null)?.[m[2]!] ?? null;
    else out[raw] = r[raw];
  }
  return out;
}

const uuid = (n: number) => {
  const h = n.toString(16).padStart(8, '0');
  return `${h}-1111-4222-8333-${n.toString(16).padStart(12, '0')}`;
};
const AT = '2026-10-01T05:00:00.000Z';
const hubRow = (n: number, wood: number, extra: Row = {}): Row => ({
  user_id: uuid(n),
  store_key: 'city_hub',
  payload: { total: { wood }, day: '2026-10-01', dayUnits: wood, recent: [{ id: `c${n}`, at: AT, m: { wood } }], notes: [], ids: [`c${n}`], ...extra },
});

test('mã rút gọn → khoảng uuid chứa đúng người đó', () => {
  const id = uuid(0xabcdef12);
  const r = userIdRange(shortId(id))!;
  assert.ok(r.lo <= id && id <= r.hi);
  assert.equal(userIdRange('xyz'), null);
  assert.equal(userIdRange('ABCDEF012345'), null);
  assert.equal(userIdRange('abcdef01234'), null);
});

test('tìm chủ thành phố: vẫn thấy khi bảng có hơn 1.000 thành phố (không đọc cả bảng)', async () => {
  const rows: Row[] = Array.from({ length: 2500 }, (_, i) => ({ user_id: uuid(i + 1), store_key: 'city', payload: {} }));
  const { admin, calls } = fakeAdmin({ user_state: rows });
  for (const n of [1, 1200, 2499, 2500]) {
    assert.equal(await findCityOwner(admin, shortId(uuid(n))), uuid(n));
  }
  assert.equal(await findCityOwner(admin, 'ffffffffffff'), null);
  assert.equal(await findCityOwner(admin, 'not-an-id'), null);
  assert.ok(calls.some((c) => c.op === 'gte'));
});

test('Trung tâm: cộng đủ MỌI người góp dù hơn 1.000 dòng (không bị cắt im lặng)', async () => {
  const rows: Row[] = Array.from({ length: 2300 }, (_, i) => hubRow(i + 1, 2));
  const { admin } = fakeAdmin({ user_state: rows, profiles: [] });
  assert.equal((await fetchHubRows(admin)).length, 2300);
  const base = await readHubBase(admin, new Date(AT));
  assert.equal(base.snapshot.total.wood, 4600);
  assert.equal(base.snapshot.people, 2300);
  assert.equal(base.rows.length, 2300);
  assert.equal(base.snapshot.updatedAt, AT);
});

test('Trung tâm: chỉ tra tên cho người hiện ra, theo lô ≤ 100 id; tên email không lộ', async () => {
  const rows: Row[] = Array.from({ length: 1500 }, (_, i) => hubRow(i + 1, i + 1, i === 1499 ? { notes: [{ text: 'chào cả nhà', at: AT }] } : {}));
  const profiles: Row[] = [
    { id: uuid(1500), display_name: 'Lan Anh' },
    { id: uuid(1499), display_name: 'someone@example.com' },
    { id: uuid(1498), display_name: 'sample.user' },
    { id: uuid(3), display_name: 'Người Không Hiện' },
  ];
  const { admin, calls } = fakeAdmin({ user_state: rows, profiles });
  const { snapshot } = await readHubBase(admin, new Date(AT));
  const asked = calls.filter((c) => c.table === 'profiles' && c.op === 'in').map((c) => c.arg as number);
  assert.ok(asked.length >= 1 && asked.every((n) => n <= 100), JSON.stringify(asked));
  assert.ok(asked.reduce((a, b) => a + b, 0) <= 100, 'không tra tên cả nghìn người');
  const top = snapshot.contributors;
  assert.equal(top[0]!.name, 'Lan Anh');
  assert.match(top[1]!.name, /^Học viên /, 'tên có @ không lộ');
  assert.match(top[2]!.name, /^Học viên /, 'tên kiểu tài khoản không lộ');
  assert.equal(snapshot.board[0]!.name, 'Lan Anh');
  for (const n of [...snapshot.contributors, ...snapshot.activity, ...snapshot.board]) assert.ok(!n.name.includes('@') && n.name !== '');
  // Chuỗi JSON của snapshot không chứa uuid đầy đủ hay email.
  const json = JSON.stringify(snapshot);
  assert.ok(!json.includes('@'));
  assert.ok(!/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/.test(json));
});

test('Trung tâm: chưa ai góp → bản tổng hợp rỗng, tháp 1 đang xây tầng 1', async () => {
  const { admin } = fakeAdmin({ user_state: [], profiles: [] });
  const { snapshot } = await readHubBase(admin, new Date(AT));
  assert.equal(snapshot.people, 0);
  assert.deepEqual(snapshot.contributors, []);
  assert.equal(snapshot.progress.floorsBuilt, 0);
  assert.equal(snapshot.progress.current, 0);
  assert.deepEqual(snapshot.districts, []);
});

test('danh sách thành phố: hạng đúng theo công học dù người đứng đầu nằm ngoài 1.000 dòng đầu', async () => {
  const sites = [{ id: 's' }];
  const rows: Row[] = Array.from({ length: 1800 }, (_, i) => ({
    user_id: uuid(i + 1),
    store_key: 'city',
    payload: { terrain: { kind: 'plains', seed: 1 }, sites, era: 2, lifetime: i === 1750 ? 99999 : i, name: i === 1750 ? 'Đô thị số 1' : null },
  }));
  const { admin } = fakeAdmin({ user_state: rows, profiles: [] });
  const list = await listCities(admin, 5);
  assert.equal(list.length, 5);
  assert.equal(list[0]!.name, 'Đô thị số 1');
  assert.equal(list[0]!.id, shortId(uuid(1751)));
  assert.ok(list.every((c) => !c.name.includes('@')));
});

test('tra tên: chia lô, bỏ trùng, ẩn tên không đủ điều kiện hiển thị', async () => {
  const ids = Array.from({ length: 250 }, (_, i) => uuid(i + 1));
  const profiles: Row[] = ids.map((id, i) => ({ id, display_name: i % 2 ? 'Minh Châu' : 'abc@x.com' }));
  const { admin, calls } = fakeAdmin({ profiles });
  const names = await namesOf(admin, [...ids, ...ids]);
  const sizes = calls.filter((c) => c.op === 'in').map((c) => c.arg as number);
  assert.deepEqual(sizes, [100, 100, 50]);
  assert.equal(names.size, 125);
  assert.equal(names.get(ids[1]!), 'Minh Châu');
  assert.equal(names.get(ids[0]!), undefined);
});
