/**
 * Sinh toàn bộ icon / thumbnail / illustration qua OpenAI API và lưu vào
 * Supabase Storage. Chạy một lần; lần sau chỉ sinh những thứ còn thiếu.
 *
 *   npm run assets:plan                    # xem sẽ sinh gì, không gọi API
 *   npm run assets:generate                # sinh tất cả những gì chưa có
 *   npm run assets:generate -- --kind illustration
 *   npm run assets:generate -- --key nav/library --force
 */
import 'dotenv/config';

import { ASSET_CATALOG, type AssetKind, type AssetSpec } from '../src/services/ai/asset-catalog';
import { ensureAsset } from '../src/services/ai/assets';
import { AiError } from '../src/services/ai/errors';

type Args = {
  plan: boolean;
  force: boolean;
  kind?: AssetKind;
  key?: string;
  concurrency: number;
};

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const specs = selectSpecs(args);

  if (specs.length === 0) {
    console.error('Không có tài nguyên nào khớp bộ lọc.');
    process.exitCode = 1;
    return;
  }

  if (args.plan) {
    console.log(`Kế hoạch: ${specs.length} tài nguyên\n`);
    for (const spec of specs) {
      console.log(`- [${spec.kind}] ${spec.key} (${spec.size})`);
      console.log(`  ${spec.prompt.slice(0, 120)}…\n`);
    }
    return;
  }

  requireEnv();

  console.log(`Bắt đầu: ${specs.length} tài nguyên, ${args.concurrency} luồng song song.\n`);

  const stats = { created: 0, cached: 0, failed: 0 };
  const failures: Array<{ key: string; message: string }> = [];

  await runWithConcurrency(specs, args.concurrency, async (spec) => {
    try {
      const result = await ensureAsset(spec, { force: args.force, log: (m) => console.log(m) });
      if (result.cached) {
        stats.cached += 1;
        console.log(`✓ cache  ${spec.key}`);
      } else {
        stats.created += 1;
        console.log(`✓ sinh   ${spec.key} → ${result.asset.public_url ?? result.asset.storage_path}`);
      }
    } catch (err) {
      stats.failed += 1;
      const message = err instanceof AiError ? `${err.code}: ${err.message}` : String(err);
      failures.push({ key: spec.key, message });
      console.error(`✗ lỗi    ${spec.key} — ${message}`);
    }
  });

  console.log(
    `\nXong. Sinh mới ${stats.created} · dùng cache ${stats.cached} · lỗi ${stats.failed}.`,
  );

  if (failures.length > 0) {
    console.log('\nChạy lại lệnh này để thử tiếp những mục lỗi (mục đã xong sẽ dùng cache):');
    for (const f of failures) console.log(`  - ${f.key}: ${f.message}`);
    process.exitCode = 1;
  }
}

function parseArgs(argv: string[]): Args {
  const args: Args = { plan: false, force: false, concurrency: 3 };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--plan' || arg === '--dry-run') args.plan = true;
    else if (arg === '--force') args.force = true;
    else if (arg === '--kind') args.kind = argv[++i] as AssetKind;
    else if (arg === '--key') args.key = argv[++i];
    else if (arg === '--concurrency') args.concurrency = Math.max(1, Number(argv[++i]) || 3);
  }

  return args;
}

function selectSpecs(args: Args): AssetSpec[] {
  return ASSET_CATALOG.filter((spec) => {
    if (args.kind && spec.kind !== args.kind) return false;
    if (args.key && spec.key !== args.key) return false;
    return true;
  });
}

function requireEnv(): void {
  const required = [
    'OPENAI_API_KEY',
    'OPENAI_BASE_URL',
    'SUPABASE_SERVICE_KEY',
    'EXPO_PUBLIC_SUPABASE_URL',
  ];
  const missing = required.filter((name) => !process.env[name]);

  if (missing.length > 0) {
    console.error(
      `Thiếu biến môi trường: ${missing.join(', ')}.\n` +
        'Copy .env.example sang .env.local và điền giá trị, rồi chạy lại.',
    );
    process.exit(1);
  }
}

/** Chạy song song có giới hạn để không bị proxy rate-limit. */
async function runWithConcurrency<T>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  let cursor = 0;

  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      const item = items[index];
      if (item !== undefined) await worker(item);
    }
  });

  await Promise.all(runners);
}

main().catch((err: unknown) => {
  console.error('Script dừng do lỗi không xử lý được:', err);
  process.exit(1);
});
