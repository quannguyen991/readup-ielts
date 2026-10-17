/**
 * Sinh giọng đọc tự nhiên cho bài nghe TOEIC/TOEFL bằng Gemini TTS.
 *
 *   npx tsx --env-file=.env.local scripts/intl/gen-tts.ts          → chỉ in ước tính, KHÔNG gọi API
 *   npx tsx --env-file=.env.local scripts/intl/gen-tts.ts --run    → gọi API và ghi tệp
 *
 * Mặc định là chế độ xem trước. Mỗi đoạn là một lượt gọi; tệp đã có thì bỏ qua.
 */
import { mkdirSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { collectAudioUnits, estimateAudio } from '../../src/data/intl/audio-units';
import { pcm16ToWav } from '../../src/services/intl/wav';

const MODEL = process.env.INTL_TTS_MODEL ?? 'gemini-2.5-flash-preview-tts';
const VOICE = process.env.INTL_TTS_VOICE ?? 'Aoede';
const OUT_DIR = join(process.cwd(), 'public', 'audio', 'intl');
const MANIFEST = join(process.cwd(), 'src', 'data', 'intl', 'audio-manifest.json');
const run = process.argv.includes('--run');

async function synthesize(text: string, key: string): Promise<Uint8Array> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`;
  const body = {
    contents: [{ parts: [{ text }] }],
    generationConfig: {
      responseModalities: ['AUDIO'],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE } } },
    },
  };
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (res.ok) {
      const json = (await res.json()) as { candidates?: { content?: { parts?: { inlineData?: { data?: string } }[] } }[] };
      const data = json.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!data) throw new Error('Gemini trả về không có âm thanh');
      const bytes = new Uint8Array(Buffer.from(data, 'base64'));
      const isWav = bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46;
      return isWav ? bytes : pcm16ToWav(bytes);
    }
    if (res.status !== 429 && res.status < 500) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
    await new Promise((r) => setTimeout(r, 15000 * attempt));
  }
  throw new Error('Gemini: hết lượt thử lại');
}

async function main() {
  const units = collectAudioUnits();
  const est = estimateAudio(units);
  console.log(`Đoạn cần sinh: ${est.units}`);
  console.log(`Số từ: ${est.words} · thời lượng ước tính: ${Math.round(est.seconds / 60)} phút`);
  console.log(`Chi phí ở mức trả phí (ước tính, ${MODEL}): ~${est.usdPaid.toFixed(2)} USD`);
  console.log(`Gói miễn phí: giới hạn theo ngày, có thể mất vài ngày để chạy hết.`);

  if (!run) {
    console.log('\nChế độ xem trước: chưa gọi API. Thêm --run để sinh âm thanh.');
    return;
  }

  const key = (process.env.GEMINI_TTS_API_KEYS ?? '').split(',')[0]?.trim();
  if (!key) throw new Error('Thiếu GEMINI_TTS_API_KEYS trong .env.local');
  mkdirSync(OUT_DIR, { recursive: true });

  const done: string[] = [];
  for (const unit of units) {
    const file = join(OUT_DIR, `${unit.id}.wav`);
    if (!existsSync(file)) {
      const wav = await synthesize(unit.text, key);
      writeFileSync(file, wav);
      console.log(`✓ ${unit.id}`);
      await new Promise((r) => setTimeout(r, 7000));
    }
    done.push(unit.id);
  }
  writeFileSync(MANIFEST, JSON.stringify({ voice: VOICE, model: MODEL, clips: done }, null, 2) + '\n');
  console.log(`Xong. Đã ghi ${done.length} đoạn và ${MANIFEST}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
