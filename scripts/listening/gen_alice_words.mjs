// Sinh clip giọng Alice (ElevenLabs qua Vibi) cho các từ vựng CHƯA có clip Aoede.
// Ra: public/audio/words/alice/<slug>-<hash>.mp3 + index.json (từ thường → tên tệp), cùng định dạng kho Aoede.
// Khoá đọc từ D:/Claude/.secrets/vibi.key (không đưa vào mã). Có thể chạy lại: từ đã có thì bỏ qua.
//   node scripts/listening/gen_alice_words.mjs [--limit N] [--concurrency 3]
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..', '..');
const KEY = fs.readFileSync('D:/Claude/.secrets/vibi.key', 'utf8').trim();
const VOICE_ID = 'Xb7hH8MSUJpSbSDYk0k2'; // Alice - Clear, Engaging Educator (ElevenLabs)
const API = 'https://api.vibi.pro/v1';
const OUT = path.join(ROOT, 'public', 'audio', 'words', 'alice');
const INDEX = path.join(OUT, 'index.json');
const LOG = path.join(ROOT, 'scripts', 'listening', '_alice_run.log');

const args = process.argv.slice(2);
const opt = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);
const LIMIT = Number(opt('--limit', '0')) || Infinity;
const CONC = Number(opt('--concurrency', '2'));

const log = (msg) => {
  const line = `${new Date().toISOString()} ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG, line + '\n');
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (w) => w.trim().toLowerCase();
const fileFor = (word) => {
  const slug = norm(word).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'word';
  const hash = crypto.createHash('sha1').update(norm(word)).digest('hex').slice(0, 6);
  return `${slug}-${hash}.mp3`;
};

class StopRun extends Error {}

async function tts(word) {
  const body = {
    text: word,
    model_id: 'eleven_multilingual_v2',
    language_code: 'en',
    voice_settings: { stability: 0.5, similarity_boost: 0.75, speed: 1.0 },
  };
  let res = await fetch(`${API}/text-to-speech/${VOICE_ID}`, {
    method: 'POST',
    headers: { 'xi-api-key': KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if ([401, 402, 403].includes(res.status)) throw new StopRun(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  if (res.status === 429) throw new Error('rate limited');
  if (!res.ok) throw new Error(`POST ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const { id } = await res.json();
  for (let i = 0; i < 60; i++) {
    await sleep(3000);
    const h = await fetch(`${API}/history/${id}`, { headers: { 'xi-api-key': KEY } });
    const j = await h.json();
    if (j.status === 'completed') {
      const url = typeof j.result === 'string' ? j.result : j.result?.audio_url || j.result?.url;
      const audio = await fetch(url);
      if (!audio.ok) throw new Error(`audio ${audio.status}`);
      return Buffer.from(await audio.arrayBuffer());
    }
    if (j.status === 'failed' || j.status === 'error') throw new Error(`task ${id} failed: ${JSON.stringify(j).slice(0, 200)}`);
  }
  throw new Error(`task ${id} timeout`);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const aoede = JSON.parse(fs.readFileSync(path.join(ROOT, 'public', 'audio', 'words', 'aoede', 'index.json'), 'utf8'));
  const have = new Set(Object.keys(aoede).map(norm));
  const index = fs.existsSync(INDEX) ? JSON.parse(fs.readFileSync(INDEX, 'utf8')) : {};
  const missing = [...new Set(JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts', 'listening', 'vocab-missing-words.json'), 'utf8')).map(norm))];
  // Tệp đã có trên đĩa nhưng chưa kịp ghi vào index (dừng giữa chừng) thì nhận lại, không sinh lại.
  for (const w of missing) {
    const name = fileFor(w);
    if (!have.has(w) && !(w in index) && fs.existsSync(path.join(OUT, name))) index[w] = name;
  }
  const todo = missing.filter((w) => !have.has(w) && !(w in index) && w.length > 0).slice(0, LIMIT);
  log(`cần sinh ${todo.length} clip Alice (đã có ${Object.keys(index).length} trong kho Alice)`);

  let done = 0;
  let failed = 0;
  let stop = false;
  let cursor = 0;
  const save = () => fs.writeFileSync(INDEX, JSON.stringify(index, null, 1), 'utf8');

  async function worker() {
    while (!stop && cursor < todo.length) {
      const word = todo[cursor++];
      try {
        // Bị giới hạn tốc độ (429) thì chờ dài dần rồi thử lại cùng từ, không bỏ qua.
        let buf = null;
        for (let attempt = 1; !buf; attempt++) {
          try {
            buf = await tts(word);
          } catch (e) {
            if (e instanceof StopRun) throw e;
            if (e.message === 'rate limited' && attempt < 8) {
              await sleep(20000 * attempt);
              continue;
            }
            throw e;
          }
        }
        const name = fileFor(word);
        fs.writeFileSync(path.join(OUT, name), buf);
        index[word] = name;
        done++;
        if (done % 25 === 0) {
          save();
          log(`xong ${done}/${todo.length}, lỗi ${failed}`);
        }
      } catch (e) {
        if (e instanceof StopRun) {
          stop = true;
          log(`DỪNG: ${e.message}`);
          break;
        }
        failed++;
        log(`lỗi "${word}": ${e.message}`);
        await sleep(5000);
      }
    }
  }

  await Promise.all(Array.from({ length: CONC }, worker));
  save();
  log(`kết thúc: xong ${done}, lỗi ${failed}, còn lại ${todo.length - cursor + (stop ? 0 : 0)} chưa chạy`);
}

main().catch((e) => {
  log(`FATAL ${e.stack || e}`);
  process.exit(1);
});
