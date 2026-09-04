import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { PLAN_ORDER, type PlanId } from '../src/lib/billing/plans';
import { parseEnvFile } from '../src/lib/env-file';

/**
 * Cấp gói và vai trò cho một email, chạy từ máy phát triển.
 *
 *   npm run grant -- --email ban@example.com --plan max --role admin --forever
 *   npm run grant -- --email ai-do@example.com --plan pro --months 12
 *
 * VÌ SAO KHÔNG DÙNG TRANG /admin: con gà và quả trứng. Trang admin đòi tài khoản
 * có `role = 'admin'`, mà admin ĐẦU TIÊN thì chưa ai cấp được. Script này là
 * đường vào duy nhất cho lần đầu; sau đó dùng trang admin cho tiện.
 *
 * Nó cũng TẠO SẴN tài khoản nếu email chưa từng đăng nhập — nhờ vậy chủ app mở
 * app lên là đã có gói, không phải đăng nhập một lượt rồi mới cấp được.
 *
 * Chạy bằng SUPABASE_SERVICE_KEY trong `.env.local`. Khoá đó bỏ qua RLS, nên
 * script này chỉ chạy ở máy, không bao giờ ở client.
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
const flag = (name: string) => process.argv.slice(2).includes(`--${name}`);

async function main() {
  if (!existsSync(ENV_PATH)) fail('Không thấy .env.local. Chạy `npm run setup:supabase` trước.');
  const env = parseEnvFile(readFileSync(ENV_PATH, 'utf8'));

  const url = env.EXPO_PUBLIC_SUPABASE_URL ?? '';
  const service = env.SUPABASE_SERVICE_KEY ?? '';
  if (!url || !service) {
    fail('Thiếu EXPO_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_KEY trong .env.local.');
  }

  const email = (arg('email') ?? '').trim().toLowerCase();
  if (!email.includes('@')) fail('Thiếu --email, hoặc email không hợp lệ.');

  const plan = (arg('plan') ?? 'max') as PlanId;
  if (!PLAN_ORDER.includes(plan)) fail(`Gói không hợp lệ. Chỉ nhận: ${PLAN_ORDER.join(', ')}.`);

  const role = arg('role') ?? 'user';
  if (role !== 'user' && role !== 'admin') fail("--role chỉ nhận 'user' hoặc 'admin'.");

  const forever = flag('forever') || plan === 'free';
  const months = forever ? null : Number(arg('months') ?? 12);
  if (!forever && (!Number.isInteger(months) || months! < 1)) {
    fail('--months phải là số nguyên dương, hoặc dùng --forever.');
  }

  const headers = {
    apikey: service,
    Authorization: `Bearer ${service}`,
    'Content-Type': 'application/json',
  };

  // ---------------------------------------------------------------- tìm user
  //
  // Lọc phía máy chủ bằng `?email=` thay vì tải hết rồi tìm: danh sách người
  // dùng sẽ dài dần, còn lệnh này thì phải chạy được mãi.
  const found = await fetch(
    `${url}/auth/v1/admin/users?page=1&per_page=1&email=${encodeURIComponent(email)}`,
    { headers },
  );
  if (!found.ok) fail(`Không đọc được danh sách người dùng (HTTP ${found.status}).`);
  const list = (await found.json()) as { users?: Array<{ id: string; email?: string }> };
  let user = (list.users ?? []).find((u) => (u.email ?? '').toLowerCase() === email) ?? null;

  if (user) {
    console.log(`▸ Đã có tài khoản ${email}`);
  } else {
    console.log(`▸ Chưa có ${email} — tạo mới`);
    const created = await fetch(`${url}/auth/v1/admin/users`, {
      method: 'POST',
      headers,
      // `email_confirm: true` để không phải bấm liên kết xác nhận. Không đặt mật
      // khẩu: app không dùng mật khẩu, đăng nhập bằng liên kết gửi qua email.
      body: JSON.stringify({ email, email_confirm: true }),
    });
    const body = (await created.json()) as { id?: string; msg?: string; message?: string };
    const id = body.id;
    if (!created.ok || !id) {
      // `throw` thẳng chứ không gọi `fail()`: TypeScript chỉ thu hẹp kiểu qua
      // một hàm trả `never` khi hàm đó được khai báo với chú thích kiểu tường
      // minh, mà `fail` là arrow const nên không đủ điều kiện.
      throw new SetupError(
        `Không tạo được tài khoản (HTTP ${created.status}): ${body.msg ?? body.message ?? ''}`,
      );
    }
    user = { id, email };
  }

  // --------------------------------------------------------------- đặt gói
  const now = new Date();
  let expiresAt: string | null = null;
  if (!forever) {
    const until = new Date(now);
    until.setMonth(until.getMonth() + months!);
    expiresAt = until.toISOString();
  }

  const patch = {
    plan,
    plan_started_at: plan === 'free' ? null : now.toISOString(),
    plan_expires_at: expiresAt,
    role,
  };

  const beforeRes = await fetch(
    `${url}/rest/v1/profiles?id=eq.${user!.id}&select=plan,plan_started_at,plan_expires_at,role`,
    { headers },
  );
  const beforeRow = beforeRes.ok ? ((await beforeRes.json()) as unknown[])[0] ?? null : null;

  const res = await fetch(`${url}/rest/v1/profiles?id=eq.${user!.id}`, {
    method: 'PATCH',
    headers: { ...headers, Prefer: 'return=representation' },
    body: JSON.stringify(patch),
  });
  const rows = (await res.json()) as unknown;
  if (!res.ok) fail(`Không cập nhật được hồ sơ (HTTP ${res.status}): ${JSON.stringify(rows).slice(0, 300)}`);
  if (Array.isArray(rows) && rows.length === 0) {
    // Trigger `handle_new_user` lẽ ra tạo hồ sơ ngay khi có user. Rỗng ở đây
    // nghĩa là trigger hỏng — nói thẳng, đừng báo thành công.
    fail(
      `Tài khoản có nhưng KHÔNG CÓ HỒ SƠ trong bảng profiles (user_id ${user!.id}).\n` +
        '  Trigger handle_new_user không chạy. Kiểm lại migration 20260822000100_user_state.sql.',
    );
  }

  /*
    Ghi nhật ký cả khi cấp từ CLI.

    Bỏ qua bước này một lần rồi: tài khoản được cấp tay không có dòng nào giải
    thích vì sao nó là Max, nên câu dọn dẹp trong migration 20260902000200 —
    dùng để hạ những tài khoản tự nâng gói qua lỗ hổng — hạ luôn nó. Một hàng
    dữ liệu không có lời giải thích đi kèm thì sớm muộn cũng bị hiểu nhầm.

    `actor_id` để NULL vì lệnh này không có phiên đăng nhập nào đứng sau.
  */
  const audit = await fetch(`${url}/rest/v1/admin_audit`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      actor_id: null,
      target_id: user!.id,
      action: 'set_plan',
      before: beforeRow,
      after: patch,
      note: `cấp bằng scripts/grant-account.ts trên máy phát triển`,
    }),
  });
  if (!audit.ok) {
    console.log(`  ⚠ gói đã đổi nhưng KHÔNG ghi được nhật ký (HTTP ${audit.status}).`);
  }

  console.log(`  ✓ gói   : ${plan}${expiresAt ? ` (hết hạn ${expiresAt.slice(0, 10)})` : ' — không hết hạn'}`);
  console.log(`  ✓ vai trò: ${role}`);
  console.log(`\nĐăng nhập bằng chính email này ở /auth/sign-in là thấy ngay.`);
  console.log(`user_id: ${user!.id}\n`);
}

main().catch((err: unknown) => {
  process.exitCode = 1;
  if (err instanceof SetupError) {
    console.error(`\n✖ ${err.message}\n`);
    return;
  }
  console.error('\n✖ Lỗi ngoài dự tính:\n', err);
});
