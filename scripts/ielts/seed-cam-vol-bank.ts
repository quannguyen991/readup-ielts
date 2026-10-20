import { spawnSync } from 'node:child_process';

// Import source pages; never invent passages or reuse an unrelated answer key.
const result = spawnSync('python', ['scripts/ielts/rebuild-source-bank.py'], { stdio: 'inherit' });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
