import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { mergeEnvFile } from '../src/lib/env-file';

/**
 * Dựng toàn bộ hạ tầng đăng nhập trên Supabase, chạy một lệnh.
 *
 *   npx tsx scripts/provision-supabase.ts --token sbp_xxxxxxxx
 *
 * VÌ SAO CÓ FILE NÀY: bật đăng nhập theo tài liệu là bảy bước bấm tay trong ba
 * console khác nhau, và sai một bước thì triệu chứng đều giống nhau — nút bấm
 * không làm gì. Script này làm hết bằng Management API, chỉ chừa lại đúng thứ
 * mà API không làm được: TẠO TÀI KHOẢN. Bạn tạo tài khoản, lấy một token, phần
 * còn lại tự chạy.
 *
 * Nó làm gì:
 *   1. dựng project mới ở Singapore (hoặc dùng lại project cũ cùng tên)
 *   2. đợi database khoẻ
 *   3. đẩy toàn bộ migration trong supabase/migrations/, có sổ ghi đã chạy cái nào
 *   4. khai Site URL + Redirect URL cho cả web, localhost và app native
 *   5. đổi mẫu email sang MÃ 6 SỐ thay vì liên kết ma thuật
 *   6. ghi .env.local
 *   7. (kèm --vercel) đẩy biến môi trường lên Vercel
 *
 * CHẠY LẠI ĐƯỢC. Mỗi bước tự kiểm trạng thái trước khi làm, nên lỡ đứt mạng
 * giữa chừng thì chạy lại là xong, không tạo project thứ hai.
 *
 * KHÔNG IN KHOÁ RA MÀN HÌNH — chỉ in tên biến và độ dài. Log của terminal hay
 * bị chụp màn hình gửi đi hỏi bài.
 */

// Cho phép trỏ sang server giả để chạy thử trọn luồng — không có đường nào khác
// để kiểm script này mà không tạo project thật.
const API = process.env.SUPABASE_API_URL ?? 'https://api.supabase.com';
const ROOT = process.cwd();
const ENV_PATH = join(ROOT, '.env.local');
const MIGRATIONS_DIR = join(ROOT, 'supabase', 'migrations');

/** Singapore — gần Việt Nam nhất trong các region của Supabase. */
const REGION = 'ap-southeast-1';
/** Tên dùng khi phải tạo project mới. Project sẵn có thì giữ nguyên tên của nó. */
const PROJECT_NAME = 'readup';
const SITE_URL = 'https://readup-ielts.vercel.app';

/**
 * Mọi địa chỉ mà luồng OAuth được phép quay về.
 *
 * Thiếu dòng nào thì đăng nhập ở đúng môi trường đó kẹt ở trang trắng, và
 * Supabase không báo lỗi gì dễ hiểu — nên khai thừa còn hơn khai thiếu.
 */
const REDIRECT_URLS = [
  `${SITE_URL}/auth/callback`,
  'http://localhost:8081/auth/callback',
  'http://localhost:8081/**',
  'readupielts://auth/callback',
];

type Json = Record<string, unknown>;

let TOKEN = '';

/**
 * Dừng script kèm lời giải thích.
 *
 * Ném lỗi chứ không gọi `process.exit()`: trên Windows, thoát trong lúc còn một
 * socket keep-alive của fetch làm libuv in ra một dòng "Assertion failed" trông
 * y như crash, ngay dưới thông báo lỗi thật — đủ để tưởng script hỏng chứ không
 * phải token sai.
 */
class SetupError extends Error {}

function fail(message: string): never {
  throw new SetupError(message);
}

async function api<T>(
  path: string,
  init: { method?: string; body?: Json } = {},
): Promise<{ ok: true; data: T } | { ok: false; status: number; error: string }> {
  const res = await fetch(`${API}${path}`, {
    method: init.method ?? 'GET',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });

  const text = await res.text();
  if (!res.ok) {
    return { ok: false, status: res.status, error: text.slice(0, 400) };
  }
  return { ok: true, data: (text ? JSON.parse(text) : null) as T };
}

/** Gọi API và dừng hẳn nếu hỏng — dùng cho những bước không có đường vòng. */
async function must<T>(label: string, path: string, init?: { method?: string; body?: Json }) {
  const res = await api<T>(path, init);
  if (!res.ok) fail(`${label} hỏng (HTTP ${res.status}).\n  ${res.error}`);
  return res.data;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------- .env.local

/**
 * Ghi đè đúng những dòng cần đổi, giữ nguyên phần còn lại của file.
 *
 * Viết đè cả file là cách nhanh nhất để xoá mất OPENAI_API_KEY của người dùng,
 * nên phần trộn nằm ở `src/lib/env-file.ts` và có test riêng.
 */
function upsertEnv(values: Record<string, string>) {
  const existing = existsSync(ENV_PATH) ? readFileSync(ENV_PATH, 'utf8') : '';
  writeFileSync(ENV_PATH, mergeEnvFile(existing, values), 'utf8');
}

// ------------------------------------------------------------------ các bước

/**
 * Tìm organization — CHỈ gọi khi thật sự phải tạo project mới.
 *
 * `/v1/organizations` trả rỗng khi token được cấp phạm vi tổ chức nhưng không
 * tick quyền đọc Organizations. Đó không phải lỗi: gần như mọi thứ script này
 * làm đều ở tầng project. Nên khi danh sách rỗng, lấy org từ chính project đang
 * có — nó mang sẵn `organization_id`.
 */
async function resolveOrganizationId(projects: Project[], wanted?: string): Promise<string> {
  const orgs = await must<Array<{ id: string; name: string }>>(
    'Đọc danh sách tổ chức',
    '/v1/organizations',
  );

  if (orgs.length > 0) {
    const org = wanted ? orgs.find((o) => o.id === wanted || o.name === wanted) : orgs[0];
    if (!org) fail(`Không thấy tổ chức "${wanted}". Có: ${orgs.map((o) => o.name).join(', ')}`);
    if (orgs.length > 1 && !wanted) {
      console.log(`  (có ${orgs.length} tổ chức, dùng "${org.name}" — đổi bằng --org <tên>)`);
    }
    return org.id;
  }

  const fromProject = projects.find((p) => p.organization_id)?.organization_id;
  if (fromProject) {
    console.log(`  (token không đọc được danh sách tổ chức, lấy org từ project sẵn có)`);
    return fromProject;
  }

  fail(
    'Không tìm được tổ chức nào.\n' +
      '  Tài khoản chưa có organization: vào supabase.com/dashboard, ô chọn org góc\n' +
      '  trên bên trái → New organization (gói Free), rồi chạy lại.\n' +
      '  Nếu đã có rồi thì token thiếu quyền đọc Organizations — tạo token mới có\n' +
      '  tick quyền đó, hoặc tạo sẵn một project trong dashboard rồi chạy lại.',
  );
}

type Project = {
  id: string;
  name: string;
  region: string;
  status: string;
  organization_id?: string;
};

/**
 * Chọn project để dựng lược đồ lên, tạo mới nếu chưa có cái nào hợp.
 *
 * Thứ tự ưu tiên, và lý do:
 *   1. `--project <tên>` — người dùng nói rõ thì nghe.
 *   2. project tên `readup` — do chính script này tạo lần trước.
 *   3. ĐÚNG MỘT project đang có — Supabase tự tạo một project lúc đăng ký, và
 *      tạo thêm cái thứ hai chỉ để đó là đốt mất một trong hai suất của gói free.
 *   4. tạo mới — chỉ tới đây mới cần biết organization.
 */
async function resolveProject(explicitName: string | undefined, wantedOrg?: string) {
  const projects = await must<Project[]>('Đọc danh sách project', '/v1/projects');

  const byName = explicitName
    ? projects.find((p) => p.name === explicitName)
    : projects.find((p) => p.name === PROJECT_NAME);

  if (byName) {
    console.log(`  dùng lại project "${byName.name}" (${byName.id}, ${byName.status})`);
    return { project: byName, dbPass: null as string | null };
  }
  if (explicitName) {
    fail(
      `Không thấy project tên "${explicitName}".` +
        (projects.length ? ` Đang có: ${projects.map((p) => p.name).join(', ')}` : ' Chưa có project nào.'),
    );
  }

  if (projects.length === 1) {
    const only = projects[0]!;
    console.log(`  dùng project sẵn có "${only.name}" (${only.id}, ${only.region})`);
    console.log('  (muốn dựng project riêng thì Ctrl+C rồi thêm --project readup-moi)');
    return { project: only, dbPass: null as string | null };
  }
  if (projects.length > 1) {
    fail(
      `Có ${projects.length} project nhưng không cái nào tên "${PROJECT_NAME}": ` +
        `${projects.map((p) => p.name).join(', ')}.\n  Chọn một bằng --project <tên>.`,
    );
  }

  const orgId = await resolveOrganizationId(projects, wantedOrg);

  // Mật khẩu database sinh ngẫu nhiên: người dùng không bao giờ phải gõ nó
  // (mọi thứ đi qua API key), nhưng vẫn phải lưu lại để còn nối psql sau này.
  const dbPass = randomPassword();

  console.log(`  tạo project "${PROJECT_NAME}" ở ${REGION}…`);
  const created = await must<Project>('Tạo project', '/v1/projects', {
    method: 'POST',
    body: { name: PROJECT_NAME, organization_id: orgId, region: REGION, db_pass: dbPass },
  });
  return { project: created, dbPass };
}

function randomPassword(): string {
  const alphabet = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint8Array(32);
  globalThis.crypto.getRandomValues(bytes);
  return [...bytes].map((b) => alphabet[b % alphabet.length]).join('');
}

async function waitHealthy(ref: string) {
  const deadline = Date.now() + 8 * 60_000;
  let last = '';
  while (Date.now() < deadline) {
    const res = await api<Project>(`/v1/projects/${ref}`);
    if (res.ok) {
      const status = res.data.status;
      if (status !== last) {
        console.log(`  trạng thái: ${status}`);
        last = status;
      }
      if (status === 'ACTIVE_HEALTHY') return;
      if (status === 'INACTIVE' || status.includes('FAILED')) {
        fail(`Project dừng ở trạng thái ${status}. Xem dashboard để biết vì sao.`);
      }
    }
    await sleep(5_000);
  }
  fail('Đợi quá 8 phút mà database chưa khoẻ. Chạy lại script — nó sẽ dùng lại project vừa tạo.');
}

async function getKeys(ref: string) {
  type Key = { name: string; api_key: string };
  // `reveal=true` là bắt buộc ở bản API mới; bản cũ bỏ qua tham số thừa này.
  const keys = await must<Key[]>('Lấy API key', `/v1/projects/${ref}/api-keys?reveal=true`);
  const anon = keys.find((k) => k.name === 'anon')?.api_key;
  const service = keys.find((k) => k.name === 'service_role')?.api_key;
  if (!anon || !service) {
    fail(`Không thấy đủ anon + service_role trong danh sách key (${keys.map((k) => k.name).join(', ')}).`);
  }
  return { anon, service };
}

async function runSql(ref: string, query: string) {
  return api<unknown>(`/v1/projects/${ref}/database/query`, { method: 'POST', body: { query } });
}

/**
 * Đẩy migration, có sổ ghi.
 *
 * Bảng `schema_migrations` khiến chạy lại script là vô hại. Không có nó thì lần
 * chạy thứ hai sẽ đâm vào `create type … already exists` và dừng giữa chừng,
 * đúng lúc người dùng hoảng nhất.
 */
async function applyMigrations(ref: string) {
  const init = await runSql(
    ref,
    `create table if not exists public.schema_migrations (
       version text primary key,
       applied_at timestamptz not null default now()
     );`,
  );
  if (!init.ok) fail(`Không tạo được bảng schema_migrations (HTTP ${init.status}).\n  ${init.error}`);

  const applied = await runSql(ref, 'select version from public.schema_migrations;');
  const done = new Set<string>(
    applied.ok && Array.isArray(applied.data)
      ? (applied.data as Array<{ version: string }>).map((r) => r.version)
      : [],
  );

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  let ran = 0;
  for (const file of files) {
    if (done.has(file)) {
      console.log(`  · ${file} — đã có`);
      continue;
    }
    const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf8');
    const res = await runSql(ref, sql);
    if (!res.ok) {
      fail(
        `Migration ${file} hỏng (HTTP ${res.status}).\n  ${res.error}\n\n` +
          `Các migration trước đã chạy xong và được ghi sổ, nên sửa xong chạy lại script là tiếp đúng chỗ này.`,
      );
    }
    const mark = await runSql(
      ref,
      `insert into public.schema_migrations (version) values ('${file}') on conflict do nothing;`,
    );
    if (!mark.ok) fail(`Chạy được ${file} nhưng không ghi sổ được. Dừng để tránh chạy lại lần hai.`);
    console.log(`  ✓ ${file}`);
    ran += 1;
  }
  return { ran, total: files.length };
}

/**
 * Khai địa chỉ quay về, độ dài mã, và cố cài mẫu email mã 6 số.
 *
 * HAI LỜI GỌI RIÊNG, cố ý. Cấu hình lõi (Site URL, redirect, độ dài mã) chạy
 * được ở mọi gói; riêng mẫu email thì gói free dùng SMTP mặc định sẽ trả 400:
 *
 *   "Email template modification is not available for free tier projects
 *    using the default email provider."
 *
 * Gộp chung một PATCH thì lỗi của mẫu email kéo đổ cả những thứ vốn đặt được —
 * đó chính là bug ở bản đầu: Site URL không được ghi chỉ vì mẫu email bị chê.
 *
 * Trả về chế độ email mà app phải chạy theo: cài được `{{ .Token }}` thì `code`,
 * không thì `link`. Mẫu mặc định của Supabase CHỈ có `{{ .ConfirmationURL }}`,
 * nên ở chế độ free mà vẫn bày ô nhập mã là hứa một thứ không bao giờ tới.
 */
async function configureAuth(ref: string): Promise<'link' | 'code'> {
  const core: Json = {
    site_url: SITE_URL,
    uri_allow_list: REDIRECT_URLS.join(','),
    external_email_enabled: true,
    mailer_otp_exp: 600,
    // Mặc định của Supabase là 8; màn `app/auth/otp.tsx` nhận đúng 6 và tự nộp
    // khi đủ 6 số, nên lệch con số này là gõ xong mã vẫn không đăng nhập được.
    mailer_otp_length: 6,
  };

  const res = await api(`/v1/projects/${ref}/config/auth`, { method: 'PATCH', body: core });
  if (res.ok) {
    console.log('  ✓ Site URL + 4 redirect URL, mã 6 số, hết hạn 10 phút');
  } else {
    console.log(`  ⚠ Không đặt được cấu hình lõi (HTTP ${res.status}).`);
    console.log('     Vào Authentication → URL Configuration và điền tay:');
    console.log(`       Site URL: ${SITE_URL}`);
    for (const url of REDIRECT_URLS) console.log(`       Redirect: ${url}`);
  }

  const template = await api(`/v1/projects/${ref}/config/auth`, {
    method: 'PATCH',
    body: {
      mailer_templates_magic_link_subject: 'Mã đăng nhập ReadUp',
      mailer_templates_magic_link_content:
        '<h2>Mã đăng nhập ReadUp</h2>' +
        '<p>Nhập mã này vào app:</p>' +
        '<p style="font-size:28px;font-weight:700;letter-spacing:4px">{{ .Token }}</p>' +
        '<p>Mã có hiệu lực 10 phút. Không phải bạn yêu cầu thì bỏ qua email này.</p>',
    },
  });

  if (template.ok) {
    console.log('  ✓ email gửi MÃ 6 SỐ');
    return 'code';
  }

  const freeTier = template.error.includes('not available for free tier');
  console.log(
    freeTier
      ? '  · gói free không sửa được mẫu email → email sẽ gửi LIÊN KẾT đăng nhập'
      : `  ⚠ không đặt được mẫu email (HTTP ${template.status}) → dùng LIÊN KẾT`,
  );
  console.log('     (app tự chuyển sang màn "bấm liên kết trong email", vẫn đăng nhập được)');
  console.log('     Muốn dùng mã 6 số thì nối SMTP riêng rồi chạy lại script này.');
  return 'link';
}

// ---------------------------------------------------------------------- main

async function main() {
  const args = process.argv.slice(2);
  const arg = (name: string) => {
    const i = args.indexOf(`--${name}`);
    return i >= 0 ? args[i + 1] : undefined;
  };

  TOKEN = arg('token') ?? process.env.SUPABASE_ACCESS_TOKEN ?? '';
  if (!TOKEN) {
    fail(
      'Thiếu token.\n\n' +
        '  1. Đăng nhập supabase.com (đăng nhập bằng GitHub là nhanh nhất)\n' +
        '  2. Mở https://supabase.com/dashboard/account/tokens → Generate new token\n' +
        '  3. Chạy lại:  npx tsx scripts/provision-supabase.ts --token sbp_...\n\n' +
        'Token này là chìa khoá toàn tài khoản Supabase — dùng xong nên thu hồi ở đúng trang đó.',
    );
  }
  if (!TOKEN.startsWith('sbp_')) {
    fail('Token phải bắt đầu bằng "sbp_". Bạn đang dán nhầm anon key hay service key.');
  }

  console.log('\n▸ Project');
  const { project, dbPass } = await resolveProject(arg('project'), arg('org'));
  const ref = project.id;

  console.log('\n▸ Đợi database khoẻ (project mới mất 2–4 phút)');
  await waitHealthy(ref);
  console.log('  ✓ sẵn sàng');

  console.log('\n▸ API key');
  const keys = await getKeys(ref);
  console.log(`  ✓ anon (${keys.anon.length} ký tự) + service_role (${keys.service.length} ký tự)`);

  console.log('\n▸ Lược đồ');
  const { ran, total } = await applyMigrations(ref);
  console.log(`  ✓ ${ran} migration mới / ${total} tổng`);

  console.log('\n▸ Cấu hình đăng nhập');
  const emailMode = await configureAuth(ref);

  console.log('\n▸ Ghi .env.local');
  upsertEnv({
    EXPO_PUBLIC_SUPABASE_URL: `https://${ref}.supabase.co`,
    EXPO_PUBLIC_SUPABASE_ANON_KEY: keys.anon,
    EXPO_PUBLIC_EMAIL_AUTH_MODE: emailMode,
    SUPABASE_SERVICE_KEY: keys.service,
    ...(dbPass ? { SUPABASE_DB_PASSWORD: dbPass } : {}),
  });
  console.log('  ✓ xong (.env.local đã nằm trong .gitignore)');

  console.log('\n─────────────────────────────────────────────');
  console.log(`Project:  https://supabase.com/dashboard/project/${ref}`);
  console.log('Tiếp theo:');
  console.log('  npm run setup:check          # kiểm lại một lượt');
  console.log('  npm run web                  # thử đăng nhập bằng email ở localhost');
  console.log('');
  console.log('Đưa lên bản deploy (cần Vercel CLI đã đăng nhập):');
  console.log('  npx tsx scripts/provision-supabase.ts --token <token> --vercel');
  console.log(
    emailMode === 'link'
      ? '\nĐăng nhập email = BẤM LIÊN KẾT trong email (gói free không sửa được mẫu email).'
      : '\nĐăng nhập email = nhập MÃ 6 SỐ.',
  );
  console.log('');

  if (args.includes('--vercel')) {
    await pushToVercel({
      EXPO_PUBLIC_SUPABASE_URL: `https://${ref}.supabase.co`,
      EXPO_PUBLIC_SUPABASE_ANON_KEY: keys.anon,
      EXPO_PUBLIC_EMAIL_AUTH_MODE: emailMode,
      SUPABASE_SERVICE_KEY: keys.service,
    });
  }
}

/**
 * Đẩy biến lên Vercel.
 *
 * `SUPABASE_SERVICE_KEY` CHỈ đặt ở production. Preview URL ai đoán được cũng
 * vào được, mà khoá này bỏ qua toàn bộ RLS.
 */
async function pushToVercel(values: Record<string, string>) {
  const { spawnSync } = await import('node:child_process');
  console.log('▸ Vercel');

  for (const [key, value] of Object.entries(values)) {
    const envs = key === 'SUPABASE_SERVICE_KEY' ? ['production'] : ['production', 'preview'];
    for (const env of envs) {
      spawnSync('npx', ['--no-install', 'vercel', 'env', 'rm', key, env, '--yes'], {
        stdio: 'ignore',
        shell: true,
      });
      const res = spawnSync('npx', ['--no-install', 'vercel', 'env', 'add', key, env], {
        input: `${value}\n`,
        stdio: ['pipe', 'ignore', 'pipe'],
        shell: true,
      });
      console.log(res.status === 0 ? `  ✓ ${key} → ${env}` : `  ✖ ${key} → ${env}`);
    }
  }
  console.log('\n  Deploy lại để bản web nhận biến mới:');
  console.log('    npx vercel deploy --prod\n');
}

main().catch((err: unknown) => {
  process.exitCode = 1;
  if (err instanceof SetupError) {
    console.error(`\n✖ ${err.message}\n`);
    return;
  }
  console.error('\n✖ Lỗi ngoài dự tính:\n', err);
});
