import pronunciationVoice from '@/data/pronunciation-voice.json';

/** SERVER ONLY: Gemini credentials never reach the browser. */
export function pcmToWav(pcm: Uint8Array): Uint8Array {
  if (pcm.length < 4800 || pcm.length % 2 || pcm.length > 8_640_000) throw new Error('Invalid speech audio');
  const samples = new DataView(pcm.buffer, pcm.byteOffset, pcm.byteLength);
  let square = 0;
  for (let i = 3840; i < pcm.length; i += 2) square += samples.getInt16(i, true) ** 2;
  if (Math.sqrt(square / Math.max(1, (pcm.length - 3840) / 2)) < 104) throw new Error('Silent speech audio');
  const out = new Uint8Array(44 + pcm.length);
  const header = new DataView(out.buffer);
  const ascii = (at: number, text: string) => [...text].forEach((c, i) => { out[at + i] = c.charCodeAt(0); });
  ascii(0, 'RIFF'); header.setUint32(4, pcm.length + 36, true); ascii(8, 'WAVE');
  ascii(12, 'fmt '); header.setUint32(16, 16, true); header.setUint16(20, 1, true);
  header.setUint16(22, 1, true); header.setUint32(24, 24000, true); header.setUint32(28, 48000, true);
  header.setUint16(32, 2, true); header.setUint16(34, 16, true); ascii(36, 'data');
  header.setUint32(40, pcm.length, true); out.set(pcm, 44);
  return out;
}

export function createAoedeGenerator(keys: string[], fetcher: typeof fetch = fetch) {
  const cache = new Map<string, Uint8Array>();
  const pending = new Map<string, Promise<Uint8Array>>();
  let cacheBytes = 0;
  let firstKey = 0;
  return async (text: string): Promise<Uint8Array> => {
    const saved = cache.get(text);
    if (saved) return saved;
    const running = pending.get(text);
    if (running) return running;
    const job = (async () => {
      const started = Date.now();
      for (let n = 0; n < keys.length; n++) {
        const i = (firstKey + n) % keys.length;
        const remaining = 40_000 - (Date.now() - started);
        if (remaining <= 0) break;
        const response = await fetcher(`https://generativelanguage.googleapis.com/v1beta/models/${pronunciationVoice.model}:generateContent`, {
          method: 'POST', signal: AbortSignal.timeout(remaining),
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': keys[i]! },
          body: JSON.stringify({ contents: [{ parts: [{ text: `Read the following English text exactly as written, in a clear, natural, relaxed voice. Do not add any introduction or explanation.\n\n${text}` }] }],
            generationConfig: { maxOutputTokens: 32768, responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: pronunciationVoice.name } } } } }),
        });
        if (!response.ok) {
          if ([429, 403, 500, 503].includes(response.status)) continue;
          throw new Error('Speech service unavailable');
        }
        const data = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ inlineData?: { data?: string; mimeType?: string } }> } }> };
        const audio = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData)?.inlineData;
        if (!audio?.data || !audio.mimeType?.startsWith('audio/')) throw new Error('Missing speech audio');
        const pcm = Uint8Array.from(Buffer.from(audio.data, 'base64'));
        const wav = pcmToWav(pcm);
        firstKey = i;
        while (cacheBytes + wav.length > 16_000_000 && cache.size) {
          const oldest = cache.keys().next().value!;
          cacheBytes -= cache.get(oldest)!.length; cache.delete(oldest);
        }
        cache.set(text, wav); cacheBytes += wav.length;
        return wav;
      }
      throw new Error('Aoede is temporarily unavailable');
    })();
    pending.set(text, job);
    try { return await job; } finally { pending.delete(text); }
  };
}
