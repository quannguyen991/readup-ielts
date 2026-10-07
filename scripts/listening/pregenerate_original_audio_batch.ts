/**
 * Bulk-generate the remaining Band 9 Original Listening section audio with
 * Gemini's Batch API, then convert and upload each result to Supabase Storage.
 *
 * Run with: node --import tsx scripts/listening/pregenerate_original_audio_batch.ts
 * Optional: --limit=1 to process one section first, --job=batches/... to resume.
 */
import { createReadStream, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { config } from 'dotenv';

config({ path: resolve(process.cwd(), '.env.local'), quiet: true });

const MODEL = 'gemini-3.8-flash-lite-tts';
const BUCKET = 'listening-audio';
const TMP_ROOT = join(tmpdir(), 'readup-band9-listening-audio-batch');
const MANIFEST_PATH = join(TMP_ROOT, 'batch-manifest.json');
const STYLE = 'Natural English listening practice. Clear, relaxed, easy-to-follow pace.';

type Target = {
  key: string;
  testId: string;
  section: number;
  objectPath: string;
};

function publicUrl(base: string, objectPath: string): string {
  return base + '/storage/v1/object/public/' + BUCKET + '/' + objectPath.split('/').map(encodeURIComponent).join('/');
}

function storagePath(audio: string, base: string): string {
  const prefix = base + '/storage/v1/object/public/' + BUCKET + '/';
  return audio.startsWith(prefix) ? decodeURIComponent(audio.slice(prefix.length)) : audio.replace(/^\/+/, '');
}

async function checkExists(url: string): Promise<boolean> {
  const response = await fetch(url, { headers: { range: 'bytes=0-0' } });
  if (response.ok) {
    await response.arrayBuffer();
    return true;
  }
  const body = await response.text();
  if (response.status === 404 || body.includes('NoSuchKey')) return false;
  throw new Error('Could not check audio storage (HTTP ' + response.status + ').');
}

async function apiJson(url: string, apiKey: string, init?: RequestInit): Promise<any> {
  const response = await fetch(url, {
    ...init,
    headers: { 'x-goog-api-key': apiKey, ...(init?.headers ?? {}) },
    signal: AbortSignal.timeout(180_000),
  });
  const text = await response.text();
  if (!response.ok) throw new Error('Gemini API failed with HTTP ' + response.status + ': ' + text.slice(0, 500));
  return JSON.parse(text);
}

async function uploadBatchInput(apiKey: string, inputPath: string): Promise<string> {
  const input = readFileSync(inputPath);
  const metadata = await fetch('https://generativelanguage.googleapis.com/upload/v1beta/files', {
    method: 'POST',
    headers: {
      'x-goog-api-key': apiKey,
      'x-goog-upload-protocol': 'resumable',
      'x-goog-upload-command': 'start',
      'x-goog-upload-header-content-length': String(input.length),
      'x-goog-upload-header-content-type': 'application/jsonl',
      'content-type': 'application/json',
    },
    body: JSON.stringify({ file: { display_name: 'band9-listening-audio-batch' } }),
  });
  if (!metadata.ok) throw new Error('Could not start Gemini batch-file upload (HTTP ' + metadata.status + ').');
  const uploadUrl = metadata.headers.get('x-goog-upload-url');
  if (!uploadUrl) throw new Error('Gemini did not return the resumable upload address.');
  const finished = await fetch(uploadUrl, {
    method: 'POST',
    headers: { 'x-goog-upload-offset': '0', 'x-goog-upload-command': 'upload, finalize', 'content-type': 'application/jsonl' },
    body: input,
    signal: AbortSignal.timeout(180_000),
  });
  const result = await finished.json();
  if (!finished.ok || !result.file?.name) throw new Error('Could not upload Gemini batch input (HTTP ' + finished.status + ').');
  return result.file.name as string;
}

function makeGenerateRequest(section: any): Record<string, unknown> {
  const sourceTurns: Array<{ speaker?: string; text: string }> = section.transcript;
  const sourceSpeakerNames = [...new Set(sourceTurns.map((turn) => turn.speaker ?? 'Narrator'))];
  const speakerNames = sourceSpeakerNames.length > 2 ? [sourceSpeakerNames[0]!, 'Other speakers'] : sourceSpeakerNames;
  const speakerFor = (name: string) => sourceSpeakerNames.length > 2 && name !== sourceSpeakerNames[0] ? 'Other speakers' : name;
  const turns = sourceTurns.map((turn) => {
    const name = turn.speaker ?? 'Narrator';
    const text = turn.text.trim();
    return {
      text,
      speech_metadata: speakerNames.length > 1
        ? { speaker: speakerFor(name), style: STYLE }
        : { style: STYLE },
    };
  }).filter((turn) => turn.text.length > 0);
  const voiceConfig = speakerNames.length > 1
    ? {
      multiSpeakerVoiceConfig: {
        speakerVoiceConfigs: speakerNames.map((speaker) => ({
          speaker,
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Aoede' } },
        })),
      },
    }
    : { voiceConfig: { voice: 'Aoede' } };
  return {
    contents: [{ role: 'user', parts: turns }],
    generationConfig: { responseModalities: ['AUDIO'], speechConfig: voiceConfig },
  };
}

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

async function uploadMp3(base: string, serviceKey: string, item: Target, wav: Buffer): Promise<void> {
  const safeName = item.objectPath.replace(/[^a-z0-9.-]+/gi, '_');
  const wavPath = join(TMP_ROOT, safeName.replace(/\.mp3$/i, '.wav'));
  const mp3Path = join(TMP_ROOT, safeName);
  mkdirSync(dirname(wavPath), { recursive: true });
  try {
    writeFileSync(wavPath, wav);
    const converted = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', wavPath, '-ac', '1', '-ar', '24000', '-c:a', 'libmp3lame', '-b:a', '64k', mp3Path], { encoding: 'utf8' });
    if (converted.status !== 0) throw new Error('ffmpeg could not encode ' + item.key + '.');
    const probe = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp3Path], { encoding: 'utf8' });
    const duration = Number(probe.stdout.trim());
    if (probe.status !== 0 || !Number.isFinite(duration) || duration < 10) throw new Error('Generated audio has invalid duration for ' + item.key + '.');
    if (readFileSync(mp3Path).byteLength >= 10 * 1024 * 1024) throw new Error('Generated section exceeds Supabase per-file size limit.');
    const url = base + '/storage/v1/object/' + BUCKET + '/' + item.objectPath.split('/').map(encodeURIComponent).join('/');
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        apikey: serviceKey,
        authorization: 'Bearer ' + serviceKey,
        'content-type': 'audio/mpeg',
        'cache-control': 'max-age=86400',
        'x-upsert': 'true',
      },
      body: readFileSync(mp3Path),
      signal: AbortSignal.timeout(120_000),
    });
    if (!response.ok) throw new Error('Audio upload failed (HTTP ' + response.status + ').');
    console.log('Ready ' + item.testId + ' · Section ' + item.section + ' · ' + Math.round(duration) + 's');
  } finally {
    rmSync(wavPath, { force: true });
    rmSync(mp3Path, { force: true });
  }
}

async function main(): Promise<void> {
  const base = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').replace(/\/+$/, '');
  const serviceKey = process.env.SUPABASE_SERVICE_KEY ?? '';
  const apiKeys = [...new Set((process.env.GEMINI_TTS_API_KEYS ?? process.env.GEMINI_API_KEY ?? '').split(/[\s,]+/).filter(Boolean))];
  if (!base || !serviceKey || !apiKeys.length) throw new Error('Set Supabase and Gemini TTS credentials in .env.local first.');
  let apiKey = apiKeys[0]!;
  mkdirSync(TMP_ROOT, { recursive: true });

  const { ORIGINAL_TOPIC_TESTS } = await import('../../src/data/listening-tests/original-topics');
  const testSections = ORIGINAL_TOPIC_TESTS.flatMap((test: any) => test.sections.map((section: any) => ({ test, section })));
  const jobArg = process.argv.slice(2).find((arg) => arg.startsWith('--job='))?.slice('--job='.length);
  let manifest: { jobName: string; targets: Target[] };

  if (jobArg) {
    manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) as typeof manifest;
    manifest.jobName = jobArg;
  } else {
    const exists = await Promise.all(testSections.map(({ section }: any) => checkExists(publicUrl(base, storagePath(section.audio, base)))));
    const missing = testSections.filter((_: any, index: number) => !exists[index]);
    const limitValue = Number(process.argv.slice(2).find((arg) => arg.startsWith('--limit='))?.slice('--limit='.length) ?? Number.POSITIVE_INFINITY);
    const limit = Number.isFinite(limitValue) && limitValue >= 0 ? limitValue : Number.POSITIVE_INFINITY;
    const targets = missing.slice(0, limit).map(({ test, section }: any) => ({
      key: test.id + '-s' + section.n,
      testId: test.id,
      section: section.n,
      objectPath: storagePath(section.audio, base),
    }));
    if (!targets.length) {
      console.log('All ' + testSections.length + ' Band 9 section recordings are already ready.');
      return;
    }

    const jsonlPath = join(TMP_ROOT, 'band9-audio-requests.jsonl');
    const requestLines = targets.map((item, index) => {
      const source = testSections.find(({ test, section }: any) => test.id === item.testId && section.n === item.section)!.section;
      return JSON.stringify({ key: item.key, request: makeGenerateRequest(source) });
    });
    writeFileSync(jsonlPath, requestLines.join('\n') + '\n', 'utf8');
    let created: any;
    let lastBatchError: unknown;
    for (const candidateKey of apiKeys) {
      try {
        const inputFileName = await uploadBatchInput(candidateKey, jsonlPath);
        created = await apiJson('https://generativelanguage.googleapis.com/v1beta/models/' + MODEL + ':batchGenerateContent', candidateKey, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ batch: { display_name: 'Band9 Listening Aoede audio', input_config: { file_name: inputFileName } } }),
        });
        apiKey = candidateKey;
        break;
      } catch (error) {
        lastBatchError = error;
      }
    }
    if (!created) throw lastBatchError;
    if (!created.name) throw new Error('Gemini did not return a batch job name.');
    manifest = { jobName: created.name as string, targets };
    writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
    rmSync(jsonlPath, { force: true });
    console.log('Submitted ' + targets.length + ' sections to Gemini batch audio generation.');
  }

  console.log('Audio generation job: ' + manifest.jobName);
  const completedStates = new Set(['JOB_STATE_SUCCEEDED', 'JOB_STATE_FAILED', 'JOB_STATE_CANCELLED', 'JOB_STATE_EXPIRED']);
  let batch: any;
  let lastState = '';
  while (true) {
    batch = await apiJson('https://generativelanguage.googleapis.com/v1beta/' + manifest.jobName, apiKey);
    const state = batch.metadata?.state ?? batch.state;
    if (state !== lastState) {
      console.log('Gemini batch status: ' + state);
      lastState = state;
    }
    if (completedStates.has(state)) break;
    await new Promise((resolveWait) => setTimeout(resolveWait, 20_000));
  }
  if ((batch.metadata?.state ?? batch.state) !== 'JOB_STATE_SUCCEEDED') {
    throw new Error('Gemini audio batch ended in state ' + (batch.metadata?.state ?? batch.state) + ': ' + JSON.stringify(batch.error ?? batch.metadata?.error ?? {}).slice(0, 500));
  }

  const outputFile = batch.response?.responsesFile ?? batch.dest?.fileName;
  if (!outputFile) throw new Error('Gemini batch succeeded without a result JSONL file.');
  const outputUrl = 'https://generativelanguage.googleapis.com/download/v1beta/' + outputFile + ':download?alt=media';
  const outputResponse = await fetch(outputUrl, { headers: { 'x-goog-api-key': apiKey }, signal: AbortSignal.timeout(180_000) });
  if (!outputResponse.ok) throw new Error('Could not download Gemini audio results (HTTP ' + outputResponse.status + ').');
  const outputPath = join(TMP_ROOT, 'band9-audio-responses.jsonl');
  writeFileSync(outputPath, Buffer.from(await outputResponse.arrayBuffer()));

  const targetsByKey = new Map(manifest.targets.map((item) => [item.key, item]));
  let uploaded = 0;
  const rl = createInterface({ input: createReadStream(outputPath), crlfDelay: Infinity });
  for await (const line of rl) {
    if (!line.trim()) continue;
    const itemResult = JSON.parse(line);
    const itemKey = itemResult.key ?? itemResult.metadata?.key;
    const target = targetsByKey.get(itemKey);
    if (!target) continue;
    if (itemResult.error) throw new Error('Gemini could not prepare ' + target.key + ': ' + JSON.stringify(itemResult.error).slice(0, 400));
    const response = itemResult.response ?? itemResult;
    const audio = response.candidates?.[0]?.content?.parts?.find((part: any) => part.inlineData?.data)?.inlineData?.data;
    if (!audio) throw new Error('Gemini returned no audio for ' + target.key + '.');
    const encodedAudio = Buffer.from(audio, 'base64');
    const wav = encodedAudio.subarray(0, 4).toString('ascii') === 'RIFF' ? encodedAudio : wavFromPcm(encodedAudio);
    await uploadMp3(base, serviceKey, target, wav);
    uploaded++;
  }
  rmSync(outputPath, { force: true });
  if (uploaded !== manifest.targets.length) throw new Error('Uploaded ' + uploaded + ' of ' + manifest.targets.length + ' batch results.');
  rmSync(MANIFEST_PATH, { force: true });
  console.log('Done: ' + uploaded + ' section recordings are ready.');
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Batch audio generation failed.');
  process.exitCode = 1;
});
