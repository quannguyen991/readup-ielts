/**
 * Tìm user theo email — dùng để debug khi grant/add-stars không tìm thấy.
 * npx tsx scripts/find-user.ts --email you@example.com
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseEnvFile } from '../src/lib/env-file';

const ROOT = process.cwd();
const ENV_PATH = join(ROOT, '.env.local');

function arg(name: string) {
  const args = process.argv.slice(2);
  const at = args.indexOf(`--${name}`);
  return at >= 0 ? args[at + 1] : undefined;
}

async function main() {
  const env = parseEnvFile(readFileSync(ENV_PATH, 'utf8'));
  const url = env.EXPO_PUBLIC_SUPABASE_URL!;
  const service = env.SUPABASE_SERVICE_KEY!;
  const headers = { apikey: service, Authorization: `Bearer ${service}` };

  const email = (arg('email') ?? '').trim().toLowerCase();

  // Thử exact filter
  const r1 = await fetch(
    `${url}/auth/v1/admin/users?page=1&per_page=100`,
    { headers },
  );
  const data = (await r1.json()) as { users?: Array<{ id: string; email?: string; created_at?: string }> };
  const users = data.users ?? [];

  console.log(`Tổng users trả về: ${users.length}`);
  users.forEach(u => console.log(`  id=${u.id}  email=${u.email}`));

  if (email) {
    const match = users.filter(u => (u.email ?? '').toLowerCase().includes(email.split('@')[0]!));
    console.log(`\nKhớp với "${email}":`, match);
  }
}

main().catch(console.error);
