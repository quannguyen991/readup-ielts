import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { parseEnvFile } from '../src/lib/env-file';

/**
 * Cộng sao thưởng (bonusStars) cho một tài khoản, bằng cách cập nhật payload
 * `game` trong bảng `user_state` trên Supabase.
 *
 *   npx tsx scripts/add-stars.ts --email ban@example.com --stars 10000
 *
 * Chạy bằng SUPABASE_SERVICE_KEY trong `.env.local`. Khoá đó bỏ qua RLS.
 */

const ROOT = process.cwd();
const ENV_PATH = join(ROOT, '.env.local');

class SetupError extends Error {}
const fail = (message: string): never => {
  throw new SetupError(message);
};

function arg(name: string): string | undefined {
  const args = process.argv.slice(2);
  const at = args.indexOf(`--${name}`);
  return at >= 0 ? args[at + 1] : undefined;
}

async function main() {
  if (!existsSync(ENV_PATH)) fail('Không thấy .env.local.');
  const env = parseEnvFile(readFileSync(ENV_PATH, 'utf8'));

  const url = env.EXPO_PUBLIC_SUPABASE_URL ?? '';
  const service = env.SUPABASE_SERVICE_KEY ?? '';
  if (!url || !service) fail('Thiếu EXPO_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_KEY.');

  const email = (arg('email') ?? '').trim().toLowerCase();
  if (!email.includes('@')) fail('Thiếu --email hợp lệ.');

  const stars = Number(arg('stars') ?? '0');
  if (!Number.isInteger(stars) || stars <= 0) fail('--stars phải là số nguyên dương.');

  const headers = {
    apikey: service,
    Authorization: `Bearer ${service}`,
    'Content-Type': 'application/json',
  };

  // ---------------------------------------------------------------- tìm user
  // Tải nhiều trang để không bỏ sót (filter phía server có thể không nhạy cảm với chữ hoa)
  let user: { id: string; email?: string } | null = null;
  for (let page = 1; page <= 10 && !user; page++) {
    const found = await fetch(
      `${url}/auth/v1/admin/users?page=${page}&per_page=100`,
      { headers },
    );
    if (!found.ok) fail(`Không đọc được danh sách người dùng (HTTP ${found.status}).`);
    const list = (await found.json()) as { users?: Array<{ id: string; email?: string }> };
    const users = list.users ?? [];
    if (users.length === 0) break;
    user = users.find((u) => (u.email ?? '').toLowerCase() === email) ?? null;
  }
  if (!user) {
    fail(`Không tìm thấy tài khoản ${email} trong hệ thống.`);
    throw new Error('Unreachable');
  }

  console.log(`▸ Tìm thấy: ${email} (${user.id})`);

  // --------------------------------------------------------- đọc user_state
  const stateRes = await fetch(
    `${url}/rest/v1/user_state?user_id=eq.${user.id}&store_key=eq.game&select=payload`,
    { headers },
  );
  if (!stateRes.ok) fail(`Không đọc được user_state (HTTP ${stateRes.status}).`);
  const stateRows = (await stateRes.json()) as Array<{ payload: Record<string, unknown> }>;
  const existing = stateRows[0]?.payload ?? {};
  const oldBonus = (existing['bonusStars'] as number | undefined) ?? 0;
  const newBonus = oldBonus + stars;

  console.log(`  bonusStars hiện tại : ${oldBonus}`);
  console.log(`  cộng thêm           : ${stars}`);
  console.log(`  bonusStars mới      : ${newBonus}`);

  // ---------------------------------------------------- cập nhật / tạo mới
  const newPayload = { ...existing, bonusStars: newBonus };
  let updateRes: Response;

  if (stateRows.length > 0) {
    // upsert
    updateRes = await fetch(
      `${url}/rest/v1/user_state?user_id=eq.${user.id}&store_key=eq.game`,
      {
        method: 'PATCH',
        headers: { ...headers, Prefer: 'return=representation' },
        body: JSON.stringify({ payload: newPayload }),
      },
    );
  } else {
    // chưa có hàng — tạo mới
    updateRes = await fetch(`${url}/rest/v1/user_state`, {
      method: 'POST',
      headers: { ...headers, Prefer: 'return=representation' },
      body: JSON.stringify({ user_id: user.id, store_key: 'game', payload: newPayload }),
    });
  }

  if (!updateRes.ok) {
    const body = await updateRes.text();
    fail(`Không cập nhật được (HTTP ${updateRes.status}): ${body.slice(0, 300)}`);
  }

  // ------------------------------------------------------- ghi audit log
  const audit = await fetch(`${url}/rest/v1/admin_audit`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      actor_id: null,
      target_id: user.id,
      action: 'add_bonus_stars',
      before: { bonusStars: oldBonus },
      after: { bonusStars: newBonus },
      note: `cộng ${stars} sao bằng scripts/add-stars.ts`,
    }),
  });
  if (!audit.ok) console.log(`  ⚠ Đã cập nhật nhưng KHÔNG ghi được nhật ký (HTTP ${audit.status}).`);

  console.log(`\n✓ Đã cộng ${stars} ⭐ vào tài khoản ${email}`);
  console.log(`  Số dư bonusStars mới: ${newBonus}`);
}

main().catch((err: unknown) => {
  process.exitCode = 1;
  if (err instanceof SetupError) {
    console.error(`\n✖ ${err.message}\n`);
    return;
  }
  console.error('\n✖ Lỗi ngoài dự tính:\n', err);
});
