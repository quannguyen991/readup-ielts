import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Kiểm cấu hình đăng nhập, chạy bằng `npm run setup:check`.
 *
 * Lý do tồn tại: bật được đăng nhập cần vài giá trị đặt đúng chỗ, và khi thiếu
 * một trong số đó thì triệu chứng đều giống nhau — nút bấm không làm gì, hoặc
 * lỗi tiếng Anh khó hiểu. Script này nói thẳng đang thiếu cái nào và điền vào
 * đâu, thay vì bắt đọc lại tài liệu từ đầu.
 *
 * KHÔNG BAO GIỜ IN GIÁ TRỊ KHOÁ RA MÀN HÌNH. Chỉ in tên biến, độ dài, và vài ký
 * tự đầu của URL — vừa đủ để nhận ra dán nhầm dòng, không đủ để lộ gì khi ai đó
 * chụp màn hình hỏi bài.
 */

type Check = {
  name: string;
  ok: boolean;
  detail: string;
  fix?: string;
};

const ROOT = process.cwd();
const ENV_PATH = join(ROOT, '.env.local');

function readEnv(): Record<string, string> {
  if (!existsSync(ENV_PATH)) return {};
  const out: Record<string, string> = {};
  for (const line of readFileSync(ENV_PATH, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const at = trimmed.indexOf('=');
    if (at <= 0) continue;
    out[trimmed.slice(0, at).trim()] = trimmed.slice(at + 1).trim().replace(/^["']|["']$/g, '');
  }
  return out;
}

function checkUrl(env: Record<string, string>): Check {
  const value = env.EXPO_PUBLIC_SUPABASE_URL ?? '';
  if (!value) {
    return {
      name: 'EXPO_PUBLIC_SUPABASE_URL',
      ok: false,
      detail: 'chưa có',
      fix: 'Supabase → Settings → API → Project URL',
    };
  }
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(value)) {
    return {
      name: 'EXPO_PUBLIC_SUPABASE_URL',
      ok: false,
      detail: `sai dạng (${value.slice(0, 24)}…)`,
      fix: 'Phải có dạng https://<ref>.supabase.co — không kèm đường dẫn phía sau',
    };
  }
  return { name: 'EXPO_PUBLIC_SUPABASE_URL', ok: true, detail: value };
}

/**
 * Khoá Supabase là JWT ba phần. Đọc phần payload để biết đây là `anon` hay
 * `service_role` — dán nhầm hai khoá này cho nhau là lỗi hay gặp nhất, và hậu
 * quả nặng: `service_role` bỏ qua RLS, để lọt vào bundle client là mất sạch.
 */
function roleOfJwt(token: string): string | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[1]!, 'base64').toString('utf8')) as {
      role?: string;
    };
    return payload.role ?? null;
  } catch {
    return null;
  }
}

function checkKey(env: Record<string, string>, name: string, expectedRole: string): Check {
  const value = env[name] ?? '';
  if (!value) {
    return { name, ok: false, detail: 'chưa có', fix: 'Supabase → Settings → API' };
  }

  const role = roleOfJwt(value);
  if (role === null) {
    return { name, ok: false, detail: 'không phải JWT hợp lệ', fix: 'Copy lại đủ chuỗi, đừng cắt' };
  }
  if (role !== expectedRole) {
    return {
      name,
      ok: false,
      detail: `đây là khoá "${role}", không phải "${expectedRole}"`,
      fix:
        expectedRole === 'anon'
          ? 'Dán nhầm service_role vào biến công khai — NGUY HIỂM, khoá này bỏ qua RLS và sẽ nằm trong bundle. Đổi ngay.'
          : 'Dán nhầm anon key vào biến server. Lấy khoá service_role.',
    };
  }
  return { name, ok: true, detail: `${role}, ${value.length} ký tự` };
}

function main(): void {
  const env = readEnv();
  const hasFile = existsSync(ENV_PATH);

  console.log('\nKiểm cấu hình đăng nhập\n' + '─'.repeat(52));

  if (!hasFile) {
    console.log('✗ Không thấy .env.local');
    console.log('  Tạo bằng: cp .env.example .env.local\n');
  }

  const checks: Check[] = [
    checkUrl(env),
    checkKey(env, 'EXPO_PUBLIC_SUPABASE_ANON_KEY', 'anon'),
    checkKey(env, 'SUPABASE_SERVICE_KEY', 'service_role'),
  ];

  for (const check of checks) {
    console.log(`${check.ok ? '✓' : '✗'} ${check.name.padEnd(32)} ${check.detail}`);
    if (!check.ok && check.fix) console.log(`  → ${check.fix}`);
  }

  const ready = checks.every((c) => c.ok);
  console.log('─'.repeat(52));

  if (ready) {
    console.log('Đủ để đăng nhập bằng EMAIL ở localhost.\n');
    console.log('Nếu chưa đẩy lược đồ và khai địa chỉ quay về, chạy lệnh này — nó làm hết');
    console.log('và chạy lại được bao nhiêu lần cũng không sao:\n');
    console.log('  npm run setup:supabase -- --token sbp_...\n');
    console.log('Thêm --vercel để đẩy luôn biến môi trường lên bản deploy.\n');
    console.log('Google / Facebook / SMS cần thêm bước riêng — xem');
    console.log('docs/tai-khoan-va-bao-mat.md mục 5.3 đến 5.6.\n');
  } else {
    console.log('Chưa đủ — nhưng đừng điền tay. Một lệnh làm hết:\n');
    console.log('  1. Đăng nhập supabase.com (bằng GitHub là nhanh nhất)');
    console.log('  2. https://supabase.com/dashboard/account/tokens → Generate new token');
    console.log('  3. npm run setup:supabase -- --token sbp_...\n');
    console.log('Lệnh đó tự tạo project, đẩy lược đồ, khai địa chỉ quay về và ghi .env.local.\n');
  }

  process.exitCode = ready ? 0 : 1;
}

main();
