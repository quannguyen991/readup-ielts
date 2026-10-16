/**
 * Chấm phát âm chi tiết (từng từ, từng âm) qua dịch vụ đánh giá phát âm của Azure Speech.
 *
 * Chỉ chạy trên máy chủ, khoá nằm trong biến môi trường `AZURE_SPEECH_KEY` và
 * `AZURE_SPEECH_REGION`. Không có khoá thì `isConfigured()` là false và route trả về
 * "chưa bật" — app vẫn dùng chấm theo chữ như cũ.
 */

export type PhonemeScore = { phoneme: string; accuracy: number };
export type WordAssessment = {
  word: string;
  accuracy: number;
  errorType: string;
  phonemes: PhonemeScore[];
};
export type Assessment = {
  status: string;
  overall: { accuracy: number | null; fluency: number | null; completeness: number | null; pron: number | null };
  words: WordAssessment[];
};

export function isConfigured(env: Record<string, string | undefined> = process.env): boolean {
  return Boolean(env.AZURE_SPEECH_KEY && env.AZURE_SPEECH_REGION);
}

/** Tiêu đề yêu cầu: JSON mô tả câu chuẩn và cách chấm, mã hoá base64. */
export function pronunciationHeader(referenceText: string): string {
  const json = JSON.stringify({
    ReferenceText: referenceText,
    GradingSystem: 'HundredMark',
    Granularity: 'Phoneme',
    Dimension: 'Comprehensive',
    EnableMiscue: true,
  });
  return Buffer.from(json, 'utf8').toString('base64');
}

function num(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

/**
 * Đọc phản hồi của Azure. Chịu được cả hai dạng: điểm nằm trong `PronunciationAssessment`
 * của từ, hoặc nằm thẳng trên từ (phiên bản cũ). Trường thiếu thì để null, không đoán.
 */
export function parseAssessment(json: unknown): Assessment {
  const root = (json ?? {}) as Record<string, unknown>;
  const status = typeof root.RecognitionStatus === 'string' ? root.RecognitionStatus : 'Unknown';
  const best = Array.isArray(root.NBest) ? (root.NBest[0] as Record<string, unknown> | undefined) : undefined;
  const pa = (best?.PronunciationAssessment ?? {}) as Record<string, unknown>;
  const overall = {
    accuracy: num(pa.AccuracyScore),
    fluency: num(pa.FluencyScore),
    completeness: num(pa.CompletenessScore),
    pron: num(pa.PronScore),
  };
  const rawWords = Array.isArray(best?.Words) ? (best!.Words as Record<string, unknown>[]) : [];
  const words: WordAssessment[] = rawWords.map((w) => {
    const wpa = (w.PronunciationAssessment ?? w) as Record<string, unknown>;
    const phonemes = Array.isArray(w.Phonemes)
      ? (w.Phonemes as Record<string, unknown>[]).map((p) => {
          const ppa = (p.PronunciationAssessment ?? p) as Record<string, unknown>;
          return { phoneme: typeof p.Phoneme === 'string' ? p.Phoneme : '?', accuracy: num(ppa.AccuracyScore) ?? 0 };
        })
      : [];
    return {
      word: typeof w.Word === 'string' ? w.Word : '',
      accuracy: num(wpa.AccuracyScore) ?? 0,
      errorType: typeof wpa.ErrorType === 'string' ? wpa.ErrorType : 'None',
      phonemes,
    };
  });
  return { status, overall, words };
}

/** Gọi dịch vụ với một WAV 16 kHz. Lỗi mạng hoặc HTTP ném ra để route hoàn lượt. */
export async function assessPronunciation(
  wav: Uint8Array,
  referenceText: string,
  env: Record<string, string | undefined> = process.env,
): Promise<Assessment> {
  const region = env.AZURE_SPEECH_REGION!;
  const url = `https://${region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US&format=detailed`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25_000);
  try {
    const res = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Ocp-Apim-Subscription-Key': env.AZURE_SPEECH_KEY!,
        'Content-Type': 'audio/wav; codecs=audio/pcm; samplerate=16000',
        Accept: 'application/json',
        'Pronunciation-Assessment': pronunciationHeader(referenceText),
      },
      body: wav.buffer.slice(wav.byteOffset, wav.byteOffset + wav.byteLength) as ArrayBuffer,
    });
    if (!res.ok) throw new Error(`azure_http_${res.status}`);
    return parseAssessment(await res.json());
  } finally {
    clearTimeout(timer);
  }
}
