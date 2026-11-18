import React, { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { ActionTile, IpaGrid, useCourseFonts, PC, PhonemeHero, SectionCard, StageStrip } from '@/components/hub/PhonemeCourse';
import { useListen } from '@/components/hub/useListen';
import { Screen } from '@/components/layout/Screen';
import { Icon } from '@/components/ui/Icon';
import { PHONEMES } from '@/services/hub/phonemes';
import { nextToPractice, practicedCount } from '@/services/hub/phoneme-levels';
import { scoreTranscript, type WordScore } from '@/services/hub/pronounce';
import { speak } from '@/services/hub/speak';
import { useHubStore } from '@/store/useHubStore';

type VietL1Error = {
  id: string;
  title: string;
  badge: string;
  badSample: string;
  goodSample: string;
  targetPhonemes: string[];
  drillSentence: string;
  tipVi: string;
};

const VIET_L1_ERRORS: VietL1Error[] = [
  {
    id: 'final-consonants',
    title: 'Quên bật phụ âm cuối',
    badge: 'LỖI #1',
    badSample: 'I like white rice → "Ai lai oai rai"',
    goodSample: 'I like (/k/) white (/t/) rice (/s/)',
    targetPhonemes: ['p', 't', 'k', 's', 'z', 'tʃ'],
    drillSentence: 'Please take this packet back to the desk.',
    tipVi: 'Khép hàm cho /s/, chặn hơi ở cuống họng cho /k/, chặn hơi đầu lưỡi cho /t/.',
  },
  {
    id: 'viet-tones',
    title: 'Gắn thanh điệu vào tiếng Anh',
    badge: 'LỖI #2',
    badSample: 'Comfortable → "Côm-phọt-tây-bồ"',
    goodSample: 'ˈkʌmftəbl (nhấn âm 1, các âm sau lướt nhẹ)',
    targetPhonemes: ['ə', 'ʌ'],
    drillSentence: 'This comfortable sofa is surprisingly affordable.',
    tipVi: 'Rút ngắn các âm không nhấn bằng /ə/, đừng gắn dấu thanh.',
  },
  {
    id: 'regional-confusion',
    title: 'Lẫn âm theo vùng miền',
    badge: 'LỖI #3',
    badSample: 'Light và Night → cả hai thành "Nai"',
    goodSample: '/laɪt/ (đầu lưỡi chạm lợi trên) và /naɪt/ (hơi qua mũi)',
    targetPhonemes: ['l', 'n', 's', 'ʃ'],
    drillSentence: 'She sells sea shells on the shiny seashore.',
    tipVi: '/l/: đầu lưỡi ấn vào mặt sau răng trên. /n/: hơi rung lên vòm mũi.',
  },
  {
    id: 'extra-schwa',
    title: 'Thêm âm "ờ" thừa',
    badge: 'LỖI #4',
    badSample: 'A good book → "A gút-đờ búc-cờ"',
    goodSample: 'A good (/d/ chặn hơi) book (/k/ ngắt hơi)',
    targetPhonemes: ['t', 'd', 'k', 'g'],
    drillSentence: 'Look at that black cat in the street.',
    tipVi: 'Chỉ chặn luồng hơi tại vị trí âm, không thả hơi thành "ờ".',
  },
];

export default function HubLearn() {
  useCourseFonts();
  const best = useHubStore((s) => s.phonemeBest);
  const practiced = practicedCount(best);
  const next = nextToPractice(best);

  // Cửa sổ luyện lỗi người Việt
  const [activeL1Error, setActiveL1Error] = useState<VietL1Error | null>(null);
  const [drill, setDrill] = useState<{ overall: number; words: WordScore[]; heard: string } | null>(null);
  const [drillNote, setDrillNote] = useState<string | null>(null);
  const pendingFinish = useRef(false);
  const listen = useListen();

  const resetDrill = () => {
    pendingFinish.current = false;
    setDrill(null);
    setDrillNote(null);
  };

  const handleStartL1Drill = (error: VietL1Error) => {
    listen.stop();
    resetDrill();
    setActiveL1Error(error);
  };

  const closeDrill = () => {
    listen.stop();
    resetDrill();
    setActiveL1Error(null);
  };

  // Chấm khi micro đã dừng và bộ nhận giọng đã trả bản chữ: đối chiếu chữ máy nghe được với câu mẫu
  // (cùng cách chấm với trang luyện từng âm). Không nghe được gì thì báo thật, không bịa điểm.
  useEffect(() => {
    if (listen.listening || !pendingFinish.current || !activeL1Error) return;
    pendingFinish.current = false;
    if (!listen.supported) {
      setDrillNote('Trình duyệt này chưa hỗ trợ nhận giọng. Hãy mở bằng Chrome.');
      return;
    }
    const heard = listen.text.trim();
    if (!heard) {
      setDrillNote('Chưa nghe thấy giọng bạn. Kiểm tra micro rồi đọc lại.');
      return;
    }
    const r = scoreTranscript(activeL1Error.drillSentence, heard);
    setDrill({ overall: r.overall, words: r.words, heard });
  }, [listen.listening, listen.text, listen.supported, activeL1Error]);

  const toggleDrillMic = () => {
    if (listen.listening) {
      listen.stop();
      return;
    }
    resetDrill();
    pendingFinish.current = true;
    listen.start();
  };

  const go = (route: string) => router.push(route as never);

  return (
    <Screen>
      <PhonemeHero
        practiced={practiced}
        total={PHONEMES.length}
        nextSymbol={next?.symbol}
        onNext={() => next && go(`/hub/phoneme/${encodeURIComponent(next.symbol)}`)}
      />

      <StageStrip best={best} />

      <IpaGrid best={best} highlightSymbol={next?.symbol} onOpen={(symbol) => go(`/hub/phoneme/${encodeURIComponent(symbol)}`)} onSpeak={(word) => speak(word)} />

      <SectionCard title="Lỗi người Việt hay mắc">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {VIET_L1_ERRORS.map((err) => (
            <ActionTile key={err.id} badge={err.badge} title={err.title} onPress={() => handleStartL1Drill(err)} />
          ))}
        </View>
      </SectionCard>

      <SectionCard title="Bài tập">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          <ActionTile title="Phát âm từ" coin="missions" onPress={() => go('/hub/phoneme/p')} />
          <ActionTile title="Trọng âm" coin="missions" onPress={() => go('/hub/games/stress')} />
          <ActionTile title="Ngữ điệu" coin="progress" onPress={() => go('/hub/pitch')} />
          <ActionTile title="Cặp âm dễ nhầm" coin="listening" onPress={() => go('/hub/games/minimal-pairs')} />
          <ActionTile title="Hội thoại" coin="friends" onPress={() => go('/hub/scenarios')} />
          <ActionTile title="Nói theo video" coin="speaking" onPress={() => go('/hub/short')} />
          <ActionTile title="Kiểm tra chương" coin="achievements" onPress={() => go('/hub/games/boss')} />
        </View>
      </SectionCard>

      <SectionCard title="IELTS Speaking">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          <ActionTile title="Lộ trình Speaking 5.0 → 9.0" coin="path" onPress={() => go('/hub/ielts')} />
          <ActionTile title="12 chủ đề" coin="speaking" onPress={() => go('/hub/topics')} />
          <ActionTile title="Nói cùng Leo" coin="friends" onPress={() => go('/hub/live')} />
        </View>
      </SectionCard>

      <Modal visible={Boolean(activeL1Error)} animationType="fade" transparent onRequestClose={closeDrill}>
        <View style={{ flex: 1, backgroundColor: 'rgba(36, 31, 77, 0.5)', justifyContent: 'center', padding: 16 }}>
          {activeL1Error ? (
            <View style={{ alignSelf: 'center', width: '100%', maxWidth: 520, maxHeight: '92%', padding: 20, gap: 14, borderRadius: 28, backgroundColor: '#FFFFFF', boxShadow: '0 20px 60px rgba(36, 31, 77, 0.3)' } as object}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontFamily: PC.body, fontWeight: '700', fontSize: 13, color: '#BE123C' }}>{activeL1Error.badge}</Text>
                  <Text style={{ fontFamily: PC.display, fontWeight: '400', fontSize: 22, color: PC.ink }}>{activeL1Error.title}</Text>
                </View>
                <Pressable accessibilityRole="button" accessibilityLabel="Đóng" onPress={closeDrill} style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F4F1FC' }}>
                  <Icon name="close" size={18} color={PC.muted} />
                </Pressable>
              </View>

              <View style={{ gap: 8 }}>
                <View style={{ padding: 12, borderRadius: 16, backgroundColor: '#FFF1F3' }}>
                  <Text style={{ fontFamily: PC.body, fontWeight: '500', fontSize: 15, color: PC.ink }}>✗  {activeL1Error.badSample}</Text>
                </View>
                <View style={{ padding: 12, borderRadius: 16, backgroundColor: '#EAF9F0' }}>
                  <Text style={{ fontFamily: PC.body, fontWeight: '600', fontSize: 15, color: PC.ink }}>✓  {activeL1Error.goodSample}</Text>
                </View>
              </View>

              <View style={{ padding: 14, borderRadius: 18, backgroundColor: '#F4F0FF', gap: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ fontFamily: PC.body, fontWeight: '600', fontSize: 13, color: PC.muted }}>Đọc to câu này</Text>
                  <Pressable accessibilityRole="button" accessibilityLabel="Nghe câu mẫu" onPress={() => speak(activeL1Error.drillSentence)} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <Icon name="volume" size={15} color={PC.teal} />
                    <Text style={{ fontFamily: PC.body, fontWeight: '700', fontSize: 14, color: PC.teal }}>Nghe mẫu</Text>
                  </Pressable>
                </View>
                <Text style={{ fontFamily: PC.display, fontWeight: '700', fontSize: 20, lineHeight: 27, color: PC.ink }}>{activeL1Error.drillSentence}</Text>
                <Text style={{ fontFamily: PC.body, fontWeight: '400', fontSize: 14, lineHeight: 20, color: PC.muted }}>{activeL1Error.tipVi}</Text>
              </View>

              {drill ? (
                <View style={{ padding: 14, borderRadius: 18, gap: 10, backgroundColor: drill.overall >= 85 ? '#EAF9F0' : drill.overall >= 60 ? '#FEF6E3' : '#FFF1F3' }}>
                  <Text style={{ fontFamily: PC.display, fontWeight: '400', fontSize: 26, color: drill.overall >= 85 ? '#15803D' : drill.overall >= 60 ? '#B45309' : '#BE123C' }}>{drill.overall}%</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {drill.words.map((w, i) => (
                      <View key={`${w.target}-${i}`} style={{ paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999, backgroundColor: w.band === 'good' ? '#D1F5DF' : w.band === 'fair' ? '#FCE9B8' : '#FFD3DA' }}>
                        <Text style={{ fontFamily: PC.body, fontWeight: '600', fontSize: 13, color: w.band === 'good' ? '#15803D' : w.band === 'fair' ? '#B45309' : '#BE123C' }}>{w.target}</Text>
                      </View>
                    ))}
                  </View>
                  <Text style={{ fontFamily: PC.body, fontSize: 13, lineHeight: 18, color: PC.muted }}>Máy nghe được: {drill.heard}. Điểm so khớp chữ, không chấm từng âm.</Text>
                </View>
              ) : drillNote ? (
                <View style={{ padding: 14, borderRadius: 18, backgroundColor: '#FEF6E3' }}>
                  <Text style={{ fontFamily: PC.body, fontWeight: '600', fontSize: 14, lineHeight: 20, color: '#B45309' }}>{drillNote}</Text>
                </View>
              ) : null}

              <Pressable
                accessibilityRole="button"
                onPress={toggleDrillMic}
                style={{ height: 54, borderRadius: 27, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: listen.listening ? '#EF4444' : PC.purple }}
              >
                <Icon name={listen.listening ? 'close' : 'mic'} size={20} color="#fff" />
                <Text style={{ fontFamily: PC.body, fontWeight: '700', fontSize: 16, color: '#fff' }}>{listen.listening ? 'Dừng và chấm' : 'Đọc thử'}</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </Modal>
    </Screen>
  );
}
