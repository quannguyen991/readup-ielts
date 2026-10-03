import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createAoedeGenerator, pcmToWav } from './voice-server';

const pcm = new Uint8Array(4800).fill(3);
const good = () => Response.json({ candidates: [{ content: { parts: [{ inlineData: { mimeType: 'audio/L16;codec=pcm;rate=24000', data: Buffer.from(pcm).toString('base64') } }] } }] });

test('Aoede wraps the full PCM in a 24kHz mono WAV instead of fading away the speech', () => {
  const wav = pcmToWav(pcm);
  assert.equal(Buffer.from(wav.slice(0, 4)).toString(), 'RIFF');
  assert.equal(new DataView(wav.buffer).getUint32(24, true), 24000);
  assert.deepEqual(wav.slice(44), pcm);
  assert.throws(() => pcmToWav(new Uint8Array(4)));
  assert.throws(() => pcmToWav(new Uint8Array(4800)));
});

test('quota exhaustion moves to the next key and always requests Aoede on the configured free TTS model', async () => {
  const calls: string[] = [];
  const generate = createAoedeGenerator(['dummy-a', 'dummy-b'], async (url, init) => {
    assert.match(String(url), /gemini-2\.5-flash-preview-tts:generateContent$/);
    const body = JSON.parse(init!.body as string);
    assert.equal(body.generationConfig.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName, 'Aoede');
    calls.push((init!.headers as Record<string, string>)['x-goog-api-key']!);
    return calls.length === 1 ? new Response('', { status: 429 }) : good();
  });
  assert.equal((await generate('What is your favourite season?')).length, pcm.length + 44);
  assert.deepEqual(calls, ['dummy-a', 'dummy-b']);
});

test('concurrent reads of the same sample share one generation and cached playback costs no new call', async () => {
  let calls = 0;
  const generate = createAoedeGenerator(['dummy'], async () => { calls++; return good(); });
  const [a, b] = await Promise.all([generate('I prefer spring.'), generate('I prefer spring.')]);
  assert.equal(a, b);
  assert.equal(await generate('I prefer spring.'), a);
  assert.equal(calls, 1);
});

test('provider text errors cannot be returned as audio, and failures do not poison the sample cache', async () => {
  let calls = 0;
  const generate = createAoedeGenerator(['dummy'], async () => ++calls === 1 ? Response.json({ candidates: [] }) : good());
  await assert.rejects(generate('An answer.'), /Missing speech/);
  assert.ok((await generate('An answer.')).length > 44);
  await assert.rejects(createAoedeGenerator([])('An answer.'), /unavailable/);
});
