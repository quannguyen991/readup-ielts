import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { HubScreen } from '@/components/hub/HubScreen';
import { GLASS_CARD, BAND_COLOR, HUB } from '@/components/hub/theme';
import { markTaskDone } from '@/components/hub/hooks';
import { useListen } from '@/components/hub/useListen';
import { useMicAudio } from '@/components/hub/useMicAudio';
import { Icon } from '@/components/ui/Icon';
import { phonemeBySymbol } from '@/services/hub/phonemes';
import { scoreTranscript, type WordScore } from '@/services/hub/pronounce';
import { requestDetailed, type DetailedResult } from '@/services/hub/pronounce-client';
import { dayKeyOf } from '@/services/hub/daily';
import { speak } from '@/services/hub/speak';
import { encodeWav16k } from '@/services/hub/wav';
import type { Assessment } from '@/services/hub/pronunciation-service';
import { useAuthStore } from '@/store/useAuthStore';
import { useHubStore } from '@/store/useHubStore';

/** Trang luyện một âm: nghe mẫu, nói theo từng từ, chấm theo chữ, và (khi bật) chấm chi tiết từng âm. */
export default function PhonemePage() {
  const { symbol: raw } = useLocalSearchParams<{ symbol: string }>();
  const symbol = decodeURIComponent(raw ?? '');
  const phoneme = phonemeBySymbol(symbol);
  const listen = useListen();
  const audio = useMicAudio();
  const token = useAuthStore((s) => s.session?.access_token ?? null);
  const recordPhoneme = useHubStore((s) => s.recordPhoneme);
  const [target, setTarget] = useState(0);
  const [result, setResult] = useState<ReturnType<typeof scoreTranscript> | null>(null);
  const [detailed, setDetailed] = useState<DetailedResult | null>(null);
  const [busy, setBusy] = useState(false);
  const wavRef = useRef<Uint8Array | null>(null);

  const words = useMemo(() => phoneme?.examples.map((e) => e[0]) ?? [], [phoneme]);

  // Khi micro vừa dừng và có chữ, chấm theo chữ (chạy sau khi render, không trong lúc vẽ).
  const pendingFinish = useRef(false);
  useEffect(() => {
    if (!listen.listening && pendingFinish.current && listen.text.trim()) {
      pendingFinish.current = false;
      finish();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listen.listening, listen.text]);

  if (!phoneme) {
    return (
      <HubScreen title="Không tìm thấy âm" back>
        <Text style={{ color: HUB.body }}>Âm này chưa có trong lộ trình.</Text>
      </HubScreen>
    );
  }

  const word = words[target % words.length] ?? '';

  const startAll = async () => {
    setResult(null);
    setDetailed(null);
    wavRef.current = null;
    await audio.start();
    listen.start();
  };

  const stopAll = async () => {
    pendingFinish.current = true;
    const { samples, sampleRate } = await audio.stop();
    wavRef.current = samples.length > 0 ? encodeWav16k(samples, sampleRate) : null;
    listen.stop();
  };

  const finish = () => {
    const r = scoreTranscript(word, listen.text);
    setResult(r);
    recordPhoneme(phoneme.symbol, r.overall);
    if (r.overall >= 60) markTaskDone(dayKeyOf(new Date()), `phoneme:${phoneme.symbol}`);
  };

  const scoreDetailed = async () => {
    if (!wavRef.current) return;
    setBusy(true);
    const r = await requestDetailed(word, wavRef.current, token);
    setDetailed(r);
    setBusy(false);
  };

  return (
    <HubScreen title={`Âm /${phoneme.symbol}/`} subtitle={phoneme.group === 'consonant' ? 'Phụ âm' : phoneme.group === 'diphthong' ? 'Nguyên âm đôi' : 'Nguyên âm đơn'} back>
      <View style={[GLASS_CARD, { padding: 16, gap: 10 }]}>
        <Text style={{ color: HUB.ink, fontSize: 30, fontWeight: '800' }}>/{phoneme.symbol}/</Text>
        <Text style={{ color: HUB.body, fontSize: 14, lineHeight: 21 }}>{phoneme.tipVi}</Text>
        {phoneme.viTrap ? (
          <Text style={{ color: HUB.amber, fontSize: 13, lineHeight: 19 }}>
            {phoneme.viTrap === 'final' ? 'Người Việt hay quên bật âm này ở cuối từ.' : 'Âm này dễ bị lẫn với một âm gần giống.'}
          </Text>
        ) : null}
      </View>

      <View style={[GLASS_CARD, { padding: 14, gap: 10 }]}>
        <Text style={{ color: HUB.ink, fontSize: 15, fontWeight: '800' }}>Ví dụ</Text>
        {phoneme.examples.map(([w, ipa]) => (
          <Pressable key={w} accessibilityRole="button" accessibilityLabel={`Nghe ${w}`} onPress={() => speak(w)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 }}>
            <Icon name="volume" size={18} color={HUB.blue} />
            <Text style={{ color: HUB.ink, fontSize: 16, fontWeight: '700' }}>{w}</Text>
            <Text style={{ color: HUB.muted, fontSize: 14 }}>{ipa}</Text>
          </Pressable>
        ))}
      </View>

      <View style={[GLASS_CARD, { padding: 14, gap: 12 }]}>
        <Text style={{ color: HUB.ink, fontSize: 15, fontWeight: '800' }}>Luyện nói</Text>
        <Text style={{ color: HUB.body, fontSize: 14 }}>
          Nói to từ: <Text style={{ color: HUB.ink, fontWeight: '800', fontSize: 18 }}>{word}</Text>
        </Text>
        {!listen.supported ? (
          <Text style={{ color: HUB.amber, fontSize: 13 }}>Trình duyệt này không có bộ nhận giọng. Hãy mở bằng Chrome trên máy tính hoặc Android.</Text>
        ) : null}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={listen.listening ? 'Dừng ghi' : 'Bắt đầu nói'}
            disabled={!listen.supported}
            onPress={() => (listen.listening ? void stopAll() : void startAll())}
            style={{ flex: 1, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: listen.listening ? HUB.red : HUB.blue }}
          >
            <Text style={{ color: '#fff', fontWeight: '800' }}>{listen.listening ? 'Dừng' : 'Nhấn để nói'}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => { setResult(null); setDetailed(null); setTarget((t) => t + 1); listen.stop(); }} style={{ paddingHorizontal: 16, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: HUB.glassStrong, borderWidth: 1, borderColor: HUB.line }}>
            <Text style={{ color: HUB.ink, fontWeight: '700' }}>Từ khác</Text>
          </Pressable>
        </View>
        {listen.text ? <Text style={{ color: HUB.body, fontSize: 14 }}>Máy nghe được: {listen.text}</Text> : null}

        {result ? (
          <View style={{ gap: 8 }}>
            <Text style={{ color: HUB.ink, fontSize: 18, fontWeight: '800' }}>Điểm {result.overall}/100 (theo chữ)</Text>
            <WordLine words={result.words} />
            <Text style={{ color: HUB.muted, fontSize: 12 }}>Điểm theo chữ máy nghe được, dùng để luyện tập chứ không phải band chính thức.</Text>
          </View>
        ) : null}

        {wavRef.current && result ? (
          <Pressable accessibilityRole="button" disabled={busy} onPress={() => void scoreDetailed()} style={{ height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: HUB.violet, opacity: busy ? 0.6 : 1 }}>
            <Text style={{ color: '#fff', fontWeight: '800' }}>{busy ? 'Đang chấm…' : 'Chấm chi tiết từng âm'}</Text>
          </Pressable>
        ) : null}

        {detailed ? <DetailedView r={detailed} /> : null}
      </View>
    </HubScreen>
  );
}

function WordLine({ words }: { words: WordScore[] }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
      {words.map((w, i) => (
        <Text key={`${w.target}-${i}`} style={{ color: BAND_COLOR[w.band], fontSize: 16, fontWeight: '700' }}>
          {w.target} ({w.score})
        </Text>
      ))}
    </View>
  );
}

function DetailedView({ r }: { r: DetailedResult }) {
  if (!r.ok) {
    return <Text style={{ color: HUB.amber, fontSize: 13, lineHeight: 19 }}>{r.message}</Text>;
  }
  return <Assessed a={r.assessment} />;
}

function Assessed({ a }: { a: Assessment }) {
  const color = (score: number) => (score >= 85 ? HUB.green : score >= 60 ? HUB.amber : HUB.red);
  return (
    <View style={{ gap: 10 }}>
      <Text style={{ color: HUB.ink, fontSize: 15, fontWeight: '800' }}>Chi tiết từ máy chủ</Text>
      <Text style={{ color: HUB.body, fontSize: 13 }}>
        {`Chính xác ${a.overall.accuracy ?? '—'} · lưu loát ${a.overall.fluency ?? '—'} · đầy đủ ${a.overall.completeness ?? '—'}`}
      </Text>
      {a.words.map((w, i) => (
        <View key={`${w.word}-${i}`} style={{ gap: 4 }}>
          <Text style={{ color: color(w.accuracy), fontSize: 15, fontWeight: '700' }}>
            {w.word} · {Math.round(w.accuracy)}{w.errorType && w.errorType !== 'None' ? ` · ${w.errorType}` : ''}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {w.phonemes.map((p, k) => (
              <Text key={`${p.phoneme}-${k}`} style={{ color: color(p.accuracy), fontSize: 12, fontWeight: '700', borderWidth: 1, borderColor: color(p.accuracy), borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2 }}>
                {p.phoneme} {Math.round(p.accuracy)}
              </Text>
            ))}
          </View>
        </View>
      ))}
      {a.words.length === 0 ? <Text style={{ color: HUB.muted, fontSize: 12 }}>Máy chủ không nhận ra câu này. Nói rõ và thử lại.</Text> : null}
    </View>
  );
}
