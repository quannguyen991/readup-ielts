/**
 * Generate and upload ready-to-play Aoede audio for the 40 Band 9 Original
 * Listening tests. Re-running skips objects that are already in Supabase.
 *
 * Run with: node --import tsx scripts/listening/pregenerate_original_audio.ts
 * Optional: --limit=1 for a single sample, --only=band9-topic-01, --dry-run, --force.
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { config } from 'dotenv';

config({ path: resolve(process.cwd(), '.env.local') });

const BUCKET = 'listening-audio';
const TMP_ROOT = join(tmpdir(), 'readup-band9-listening-audio');
const AUDIO_PROMPT = [
  'Natural English listening practice.',
  'Clear, relaxed, easy-to-follow pace.',
].join(' ');

type AudioResponse = {
  steps?: { type?: string; content?: { type?: string; data?: string; mime_type?: string }[] }[];
};

function wavFromPcm(pcm: Buffer): Buffer {
  if (pcm.length < 4800 || pcm.length % 2 || pcm.length > 64_000_000) throw new Error('Invalid PCM audio size.');
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(pcm.length + 36, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(24_000, 24);
  header.writeUInt32LE(48_000, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

function publicUrl(base: string, objectPath: string): string {
  const encoded = objectPath.split('/').map(encodeURIComponent).join('/');
  return base + '/storage/v1/object/public/' + BUCKET + '/' + encoded;
}

function storagePath(audio: string, base: string): string {
  const prefix = base + '/storage/v1/object/public/' + BUCKET + '/';
  return audio.startsWith(prefix) ? decodeURIComponent(audio.slice(prefix.length)) : audio.replace(/^\/+/, '');
}

async function synthesize(text: string, keys: string[], model: string, startKey: number): Promise<{ wav: Buffer; nextKey: number }> {
  let lastStatus = 0;
  const turns = text.split('\n').map((line) => {
    const match = /^\[([^\]]+)\]\s*(.*)$/.exec(line);
    return { speaker: match?.[1] ?? 'Narrator', text: match?.[2] ?? line };
  });
  if (['gemini-3.1-flash-tts-preview', 'gemini-2.5-pro-preview-tts', 'gemini-3.8-flash-tts'].includes(model)) {
    const transcript = turns.map((turn) => turn.text.trim()).filter(Boolean).join('\n');
    const prompt = [
      'Read the transcript aloud verbatim in English using the Aoede voice.',
      'Use a clear, natural IELTS listening pace, with relaxed delivery and brief pauses between turns.',
      'Do not speak these instructions or any speaker labels.',
      'Transcript:',
      transcript,
    ].join('\n\n');
    for (let offset = 0; offset < keys.length; offset++) {
      const keyIndex = (startKey + offset) % keys.length;
      const apiKey = keys[keyIndex];
      if (!apiKey) continue;
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent', {
        method: 'POST',
        signal: AbortSignal.timeout(180_000),
        headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            responseModalities: ['AUDIO'],
            speechConfig: { voiceConfig: model === 'gemini-3.8-flash-tts' ? { voice: 'Aoede' } : { prebuiltVoiceConfig: { voiceName: 'Aoede' } } },
          },
        }),
      });
      if (!response.ok) {
        lastStatus = response.status;
        if ([401, 403, 429, 500, 503].includes(response.status)) continue;
        const detail = (await response.text()).slice(0, 240);
        throw new Error('Gemini speech request failed with HTTP ' + response.status + ': ' + detail);
      }
      const result = await response.json() as {
        candidates?: Array<{ content?: { parts?: Array<{ inlineData?: { data?: string } }> } }>;
      };
      const audioData = result.candidates?.[0]?.content?.parts?.find((part) => part.inlineData?.data)?.inlineData?.data;
      if (!audioData) throw new Error('Gemini returned no audio.');
      const bytes = Buffer.from(audioData, 'base64');
      const wav = bytes.subarray(0, 4).toString('ascii') === 'RIFF' ? bytes : wavFromPcm(bytes);
      return { wav, nextKey: (keyIndex + 1) % keys.length };
    }
    throw new Error('All configured Gemini keys are unavailable (last HTTP status ' + lastStatus + ').');
  }
  const originalSpeakers = [...new Set(turns.map((turn) => turn.speaker))];
  const speakers = originalSpeakers.length > 2 ? [originalSpeakers[0]!, 'Other speakers'] : originalSpeakers;
  const speakerFor = (name: string) => originalSpeakers.length > 2 && name !== originalSpeakers[0] ? 'Other speakers' : name;
  const multiSpeaker = speakers.length > 1;
  for (let offset = 0; offset < keys.length; offset++) {
    const keyIndex = (startKey + offset) % keys.length;
    const apiKey = keys[keyIndex];
    if (!apiKey) throw new Error('No Gemini TTS API key is configured.');
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
      method: 'POST',
      signal: AbortSignal.timeout(180_000),
      headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        model,
        input: [{
          type: 'user_input',
          content: turns.map((turn) => ({
            type: 'text',
            text: turn.text,
            annotations: [multiSpeaker
              ? { type: 'speech_metadata', speaker: speakerFor(turn.speaker), style: AUDIO_PROMPT }
              : { type: 'speech_metadata', style: AUDIO_PROMPT }],
          })),
        }
        ],
        response_format: { type: 'audio' },
        generation_config: {
          speech_config: multiSpeaker
            ? { mode: 'conversational', speakers: speakers.map((speaker) => ({ speaker, voice: 'Aoede' })) }
            : [{ voice: 'Aoede' }],
        },
      }),
    });
    if (!response.ok) {
      lastStatus = response.status;
      if ([401, 403, 429, 500, 503].includes(response.status)) continue;
      const detail = (await response.text()).slice(0, 240);
      throw new Error('Gemini speech request failed with HTTP ' + response.status + ': ' + detail);
    }
    const result = (await response.json()) as AudioResponse;
    const audio = result.steps
      ?.filter((step) => step.type === 'model_output')
      .flatMap((step) => step.content ?? [])
      .filter((item) => item.type === 'audio' && item.data)
      .at(-1);
    if (!audio?.data) throw new Error('Gemini returned no audio.');
    const bytes = Buffer.from(audio.data, 'base64');
    const wav = bytes.subarray(0, 4).toString('ascii') === 'RIFF' ? bytes : wavFromPcm(bytes);
    return { wav, nextKey: (keyIndex + 1) % keys.length };
  }
  throw new Error('All configured Gemini keys are unavailable (last HTTP status ' + lastStatus + ').');
}

async function existsRemotely(url: string): Promise<boolean> {
  const response = await fetch(url, { headers: { range: 'bytes=0-0' } });
  if (response.ok) {
    await response.arrayBuffer();
    return true;
  }
  const body = await response.text();
  if (response.status === 404 || body.includes('NoSuchKey')) return false;
  throw new Error('Could not check audio storage (HTTP ' + response.status + ').');
}

async function upload(base: string, key: string, objectPath: string, filePath: string): Promise<void> {
  const url = base + '/storage/v1/object/' + BUCKET + '/' + objectPath.split('/').map(encodeURIComponent).join('/');
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      apikey: key,
      authorization: 'Bearer ' + key,
      'content-type': 'audio/mpeg',
      'cache-control': 'max-age=86400',
      'x-upsert': 'true',
    },
    body: readFileSync(filePath),
  });
  if (!response.ok) throw new Error('Audio upload failed (HTTP ' + response.status + ').');
}

async function main(): Promise<void> {
  const base = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').replace(/\/+$/, '');
  const serviceKey = process.env.SUPABASE_SERVICE_KEY ?? '';
  const keys = [...new Set((process.env.GEMINI_TTS_API_KEYS ?? process.env.GEMINI_API_KEY ?? '').split(/[\s,]+/).filter(Boolean))];
  const voice = JSON.parse(readFileSync(resolve('src/data/pronunciation-voice.json'), 'utf8')) as { model: string };
  if (!base || !serviceKey || !keys.length) throw new Error('Set Supabase and Gemini TTS credentials in .env.local first.');

  const args = process.argv.slice(2);
  const only = args.find((arg) => arg.startsWith('--only='))?.slice('--only='.length);
  const onlySectionValue = Number(args.find((arg) => arg.startsWith('--section='))?.slice('--section='.length));
  const onlySection = Number.isInteger(onlySectionValue) && onlySectionValue > 0 ? onlySectionValue : null;
  const requestedLimit = Number(args.find((arg) => arg.startsWith('--limit='))?.slice('--limit='.length) ?? Number.POSITIVE_INFINITY);
  const limit = Number.isFinite(requestedLimit) && requestedLimit >= 0 ? requestedLimit : Number.POSITIVE_INFINITY;
  const model = args.find((arg) => arg.startsWith('--model='))?.slice('--model='.length) ?? process.env.GEMINI_PREGENERATE_MODEL ?? voice.model;
  const force = args.includes('--force');
  const dryRun = args.includes('--dry-run');
  const { ORIGINAL_TOPIC_TESTS } = await import('../../src/data/listening-tests/original-topics');
  const tests = ORIGINAL_TOPIC_TESTS.filter((test) => !only || test.id === only);
  if (only && !tests.length) throw new Error('Unknown Band 9 Original test: ' + only);
  const sections = tests.flatMap((test) => test.sections.map((section) => ({ test, section }))).filter(({ section }) => !onlySection || section.n === onlySection);
  const missing = (await Promise.all(sections.map(async (item) => {
    const objectPath = storagePath(item.section.audio, base);
    return !force && await existsRemotely(publicUrl(base, objectPath)) ? null : { ...item, objectPath };
  }))).filter((item): item is NonNullable<typeof item> => item !== null);
  const targets = missing.slice(0, limit);
  if (dryRun) {
      console.log('Would prepare ' + targets.length + ' of ' + sections.length + ' section recordings with ' + model + '; ' + (sections.length - missing.length) + ' are already ready.');
    return;
  }

  mkdirSync(TMP_ROOT, { recursive: true });
  let cursor = 0;
  let generated = 0;
  let failure: string | null = null;
  const worker = async (workerIndex: number) => {
    let nextKey = workerIndex % keys.length;
    while (!failure) {
      const index = cursor++;
      if (index >= targets.length) return;
      const { test, section, objectPath } = targets[index]!;
      console.log('Preparing ' + test.id + ' · Section ' + section.n + ' (' + (index + 1) + '/' + targets.length + ')');
      try {
        const text = section.transcript.map((line) => line.speaker ? '[' + line.speaker + '] ' + line.text : line.text).join('\n');
        const audio = await synthesize(text, keys, model, nextKey);
        nextKey = audio.nextKey;

        const safeName = objectPath.replace(/[^a-z0-9.-]+/gi, '_');
        const wavPath = join(TMP_ROOT, safeName.replace(/\.mp3$/i, '.wav'));
        const mp3Path = join(TMP_ROOT, safeName);
        mkdirSync(dirname(wavPath), { recursive: true });
        try {
          writeFileSync(wavPath, audio.wav);
          const converted = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', wavPath, '-ac', '1', '-ar', '24000', '-c:a', 'libmp3lame', '-b:a', '64k', mp3Path], { encoding: 'utf8' });
          if (converted.status !== 0) throw new Error('ffmpeg could not encode Section ' + section.n + '.');
          const probe = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp3Path], { encoding: 'utf8' });
          const duration = Number(probe.stdout.trim());
          if (probe.status !== 0 || !Number.isFinite(duration) || duration < 10) throw new Error('Generated Section ' + section.n + ' has invalid duration.');
          if (readFileSync(mp3Path).byteLength >= 10 * 1024 * 1024) throw new Error('Generated section exceeds the Supabase per-file size limit.');
          await upload(base, serviceKey, objectPath, mp3Path);
          generated++;
          console.log('Ready ' + test.id + ' · Section ' + section.n + ' · ' + Math.round(duration) + 's');
        } finally {
          rmSync(wavPath, { force: true });
          rmSync(mp3Path, { force: true });
        }
      } catch (error) {
        failure = test.id + ' · Section ' + section.n + ': ' + (error instanceof Error ? error.message : 'Audio generation failed.');
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(3, targets.length) }, (_, index) => worker(index)));
  if (failure) throw new Error(failure);
  console.log('Done: ' + generated + ' generated, ' + (sections.length - missing.length) + ' already ready.');
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Audio generation failed.');
  process.exitCode = 1;
});
