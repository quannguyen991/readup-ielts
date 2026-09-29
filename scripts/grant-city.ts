import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { parseEnvFile } from '../src/lib/env-file';
import { MATERIAL_KINDS } from '../src/services/city/materials';
import { SAMPLE_TERRAIN, sampleCity } from '../src/services/city/sample-city';
import { EMPTY_CITY, type CityPayload } from '../src/services/city/sync';

/**
 * Cấp THÀNH PHỐ TRI THỨC cho một tài khoản (để thử / trình diễn): đặt số vật
 * liệu tối thiểu, và tuỳ chọn thay thành phố bằng đô thị mẫu Kỷ 5 đã xây sẵn.
 *
 *   npx tsx scripts/grant-city.ts --email ban@example.com --materials 1000 --sample --name "Thành phố của Quân" [--dry]
 *
 * Ghi vào payload `city` của bảng `user_state` bằng SUPABASE_SERVICE_KEY trong
 * `.env.local` (khoá đó bỏ qua RLS — không in ra). `lifetime` được nâng để bản
 * trên máy chủ THẮNG khi gộp với thành phố đang lưu ở máy người dùng
 * (`mergeCity`). Có ghi nhật ký vào `admin_audit`.
 */

const ENV_PATH = join(process.cwd(), '.env.local');

class SetupError extends Error {}
const fail = (message: string): never => {
  throw new SetupError(message);
};
const arg = (name: string): string | undefined => {
  const args = process.argv.slice(2);
  const at = args.indexOf(`--${name}`);
  return at >= 0 ? args[at + 1] : undefined;
};
const flag = (name: string) => process.argv.includes(`--${name}`);

async function main() {
  if (!existsSync(ENV_PATH)) fail('Không thấy .env.local.');
  const env = parseEnvFile(readFileSync(ENV_PATH, 'utf8'));
  const url = env.EXPO_PUBLIC_SUPABASE_URL ?? '';
  const service = env.SUPABASE_SERVICE_KEY ?? '';
  if (!url || !service) fail('Thiếu EXPO_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_KEY.');

  const email = (arg('email') ?? '').trim().toLowerCase();
  if (!email.includes('@')) fail('Thiếu --email hợp lệ.');
  const materials = Number(arg('materials') ?? '0');
  if (!Number.isInteger(materials) || materials < 0) fail('--materials phải là số nguyên không âm.');
  const useSample = flag('sample');
  const name = arg('name');
  const dry = flag('dry');

  const headers = { apikey: service, Authorization: `Bearer ${service}`, 'Content-Type': 'application/json' };

  // ---------------------------------------------------------------- tìm user (khớp ĐÚNG email, không in danh sách người khác)
  let user: { id: string; email?: string } | null = null;
  for (let page = 1; page <= 20 && !user; page++) {
    const res = await fetch(`${url}/auth/v1/admin/users?page=${page}&per_page=100`, { headers });
    if (!res.ok) fail(`Không đọc được danh sách người dùng (HTTP ${res.status}).`);
    const users = ((await res.json()) as { users?: Array<{ id: string; email?: string }> }).users ?? [];
    if (users.length === 0) break;
    user = users.find((u) => (u.email ?? '').toLowerCase() === email) ?? null;
  }
  if (!user) {
    fail(`Không tìm thấy tài khoản ${email}.`);
    throw new Error('unreachable');
  }
  console.log(`▸ Tài khoản: ${email} (${user.id})`);

  // ---------------------------------------------------------------- đọc thành phố hiện có
  const stateRes = await fetch(`${url}/rest/v1/user_state?user_id=eq.${user.id}&store_key=eq.city&select=payload`, { headers });
  if (!stateRes.ok) fail(`Không đọc được user_state (HTTP ${stateRes.status}).`);
  const rows = (await stateRes.json()) as Array<{ payload: CityPayload }>;
  const before = rows[0]?.payload ?? null;
  // Chỉ giữ các trường của phiên bản hiện tại (payload cũ có thể mang trường của bản thử nghiệm trước).
  const base: CityPayload = { ...EMPTY_CITY };
  if (before) for (const k of Object.keys(EMPTY_CITY) as (keyof CityPayload)[]) if (before[k] !== undefined) (base as Record<string, unknown>)[k] = before[k];

  let next: CityPayload = { ...base, inventory: { ...EMPTY_CITY.inventory, ...(base.inventory ?? {}) } };
  if (useSample) {
    const c = sampleCity();
    next = { ...next, terrain: { ...SAMPLE_TERRAIN }, regions: [...c.regions], roads: { ...c.roads }, works: {}, zones: {}, sites: c.sites.map((s) => ({ ...s })), era: 5, priority: null };
  }
  if (name) next.name = name.trim().slice(0, 40);
  for (const k of MATERIAL_KINDS) next.inventory[k] = Math.max(next.inventory[k] ?? 0, materials);
  next.lifetime = (base.lifetime ?? 0) + 100_000;
  next.updatedAt = new Date().toISOString();

  const summary = (p: CityPayload | null) =>
    p ? { terrain: p.terrain, era: p.era, name: p.name, sites: p.sites?.length ?? 0, inventory: p.inventory, lifetime: p.lifetime } : null;
  console.log('  trước:', JSON.stringify(summary(before)));
  console.log('  sau  :', JSON.stringify(summary(next)));
  if (dry) {
    console.log('\n(--dry: chưa ghi gì)');
    return;
  }

  const res = rows.length
    ? await fetch(`${url}/rest/v1/user_state?user_id=eq.${user.id}&store_key=eq.city`, { method: 'PATCH', headers, body: JSON.stringify({ payload: next }) })
    : await fetch(`${url}/rest/v1/user_state`, { method: 'POST', headers, body: JSON.stringify({ user_id: user.id, store_key: 'city', payload: next }) });
  if (!res.ok) fail(`Không ghi được (HTTP ${res.status}): ${(await res.text()).slice(0, 300)}`);

  const audit = await fetch(`${url}/rest/v1/admin_audit`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      actor_id: null,
      target_id: user.id,
      action: 'grant_city',
      before: summary(before),
      after: summary(next),
      note: `grant-city.ts: vật liệu ≥ ${materials}${useSample ? ', thành phố mẫu Kỷ 5' : ''}${name ? `, tên "${name}"` : ''}`,
    }),
  });
  if (!audit.ok) console.log(`  ⚠ Đã ghi nhưng KHÔNG ghi được nhật ký (HTTP ${audit.status}).`);
  console.log('\n✓ Xong. Mở lại app (hoặc tải lại trang) để máy đồng bộ về.');
}

main().catch((err: unknown) => {
  process.exitCode = 1;
  if (err instanceof SetupError) console.error(`\n✖ ${err.message}\n`);
  else console.error('\n✖ Lỗi ngoài dự tính:\n', err);
});
