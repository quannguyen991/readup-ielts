import React, { useMemo, useState } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Appear } from '@/components/motion/Motion';
import { Icon } from '@/components/ui/Icon';
import { SealIcon } from '@/components/illust/HeroArt';
import { Label, Sticker } from '@/components/illust/Sticker';
import { CuteChat, CuteMic, CuteTrophy, Motion, Sparkles } from '@/components/illust/CuteMore';
import { bandTone, fmtBand, fmtDate, MODE_LABEL, useMicSupport } from '@/components/speaking/SpeakingKit';
import { VoiceOrb } from '@/components/speaking/VoiceOrb';
import { CUE_CARDS, PART1_TOPICS, type SessionMode } from '@/services/speaking/bank';
import { CRITERIA, type CriterionKey } from '@/services/speaking/grade';
import { useSpeakingStore } from '@/store/useSpeakingStore';

type LobbyMode = Exclude<SessionMode, 'q'>;

const MODES: Array<{ key: LobbyMode; title: string; hint: string }> = [
  { key: 'full', title: 'Full test', hint: '11–14 phút · Part 1 → 2 → 3' },
  { key: 'p1', title: 'Part 1', hint: '3–4 phút · 4 câu về bản thân' },
  { key: 'p2', title: 'Part 2', hint: '1 phút chuẩn bị · nói 2 phút' },
  { key: 'p3', title: 'Part 3', hint: '4–5 phút · thảo luận mở rộng' },
];

const CRIT_ICON: Record<CriterionKey, { icon: React.ComponentProps<typeof SealIcon>['name']; color: string; short: string }> = {
  fc: { icon: 'chat', color: '#A8843F', short: 'Trôi chảy' },
  lr: { icon: 'book', color: '#22A06B', short: 'Vốn từ' },
  gr: { icon: 'pencil', color: '#F0703F', short: 'Ngữ pháp' },
  pr: { icon: 'volume', color: '#B07A3A', short: 'Phát âm ~' },
};

const pick = <T,>(list: T[]): T => list[Math.floor(Math.random() * list.length)]!;

/**
 * SẢNH PHÒNG LUYỆN NÓI — dạng bento, ít chữ (người dùng 01/10/2026: "nhiều chữ
 * và rối, sửa đi", kèm ảnh tham khảo khối màu lớn, số to, sticker). Khối chính
 * là GIÁM KHẢO AI (quả cầu giọng nói): chọn phần thi rồi chạm để vào phòng.
 * Chủ đề mặc định ngẫu nhiên; ai muốn chọn thì mở danh sách trong khối Chủ đề.
 */
export default function SpeakingLobby() {
  const attempts = useSpeakingStore((s) => s.attempts);
  const mic = useMicSupport();
  const { width } = useWindowDimensions();
  const wide = width >= 1000;

  const [mode, setMode] = useState<LobbyMode>('full');
  const [p1Topic, setP1Topic] = useState(() => pick(PART1_TOPICS).id);
  const [cue, setCue] = useState(() => pick(CUE_CARDS).id);
  const [exam, setExam] = useState(true);
  const [typedChoice, setTypedChoice] = useState(false);
  const [choosing, setChoosing] = useState(false);
  const typed = mic === false || typedChoice;

  const graded = useMemo(() => attempts.filter((a) => !a.typed && a.grade?.overall != null), [attempts]);
  const lastGrade = graded[0]?.grade ?? null;
  const modeInfo = MODES.find((m) => m.key === mode)!;
  const p1Title = PART1_TOPICS.find((t) => t.id === p1Topic)?.titleVi ?? '';
  const cueTitle = CUE_CARDS.find((c) => c.id === cue)?.titleVi ?? '';

  const start = () => {
    const q = new URLSearchParams({ mode, p1: p1Topic, cue, exam: exam ? '1' : '0', typed: typed ? '1' : '0' });
    router.push(`/speaking/room?${q.toString()}` as never);
  };
  const shuffle = () => {
    setP1Topic(pick(PART1_TOPICS).id);
    setCue(pick(CUE_CARDS).id);
  };

  const row = { flexDirection: wide ? 'row' : 'column', gap: 16, marginTop: 16 } as const;

  return (
    <Screen>
      <Appear>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text className="font-strong" style={{ fontSize: 12, letterSpacing: 1.6, color: '#475569' }}>
              IELTS SPEAKING
            </Text>
            <Text className="font-heavy" style={{ fontSize: wide ? 40 : 30, color: '#0F172A' }}>
              Phòng luyện nói.
            </Text>
          </View>
          <Motion kind="float">
            <Sticker tilt={8}>
              <CuteMic size={wide ? 72 : 52} />
            </Sticker>
          </Motion>
        </View>
      </Appear>

      {/* ------------------------------------------------ hàng 1: giám khảo + band */}
      <View style={row}>
        <Appear style={{ flex: wide ? 2 : undefined }}>
          <View style={[CARD, { backgroundColor: '#0B1A2E', alignItems: 'center' }]}>
            <Sparkles count={6} />
            <View style={{ alignSelf: 'stretch', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text className="font-heavy" style={{ fontSize: 24, color: '#FFFFFF' }}>
                Giám khảo AI.
              </Text>
              <Label text="Nói cùng AI 🎙️" color="#FACC15" ink="#1A1405" tilt={4} size={12} />
            </View>
            <View style={{ marginTop: 10 }}>
              <VoiceOrb state="idle" size={wide ? 190 : 160} onPress={mic === null ? undefined : start} label="Chạm để vào phòng thi" />
            </View>
            <Text className="font-strong" style={{ marginTop: 10, fontSize: 14, color: 'rgba(255,255,255,0.75)' }}>
              {mic === false ? 'Trình duyệt này không nghe được — dùng Chrome/Edge, hoặc gõ phím' : 'Chạm vào giám khảo để bắt đầu'}
            </Text>

            {/* chọn phần thi */}
            <View accessibilityRole="radiogroup" style={{ marginTop: 16, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
              {MODES.map((m) => {
                const on = m.key === mode;
                return (
                  <Pressable
                    key={m.key}
                    accessibilityRole="radio"
                    aria-checked={on}
                    onPress={() => setMode(m.key)}
                    style={{ borderRadius: 999, paddingHorizontal: 16, paddingVertical: 9, backgroundColor: on ? '#FFFFFF' : 'rgba(255,255,255,0.08)' }}
                  >
                    <Text className="font-strong" style={{ fontSize: 14, color: on ? '#0F172A' : '#FFFFFF' }}>
                      {m.title}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text className="font-sans" style={{ marginTop: 8, fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
              {modeInfo.hint}
            </Text>

            <View style={{ marginTop: 16, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 10 }}>
              <Pressable
                accessibilityRole="button"
                onPress={start}
                disabled={mic === null}
                style={({ hovered }: { hovered?: boolean }) => ({ flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 999, paddingHorizontal: 24, paddingVertical: 13, backgroundColor: hovered ? '#FDE68A' : '#FACC15' }) as object}
              >
                <Icon name="mic" size={18} color="#1A1405" />
                <Text className="font-heavy" style={{ fontSize: 16, color: '#1A1405' }}>
                  {typed ? 'Bắt đầu (gõ phím)' : 'Vào phòng thi'}
                </Text>
              </Pressable>
              <Switch on={exam} onPress={() => setExam((v) => !v)} text="Thi thật" />
              {mic ? <Switch on={typedChoice} onPress={() => setTypedChoice((v) => !v)} text="Gõ phím" /> : null}
            </View>
          </View>
        </Appear>

        <Appear index={1} style={{ flex: wide ? 1 : undefined }}>
          <View style={[CARD, { backgroundColor: '#F2B632', minHeight: wide ? '100%' : undefined }]}>
            <Text className="font-strong" style={{ fontSize: 12, letterSpacing: 1.4, color: '#5A3B00' }}>
              BAND NÓI GẦN NHẤT
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginTop: 6 }}>
              <Text className="font-heavy" style={{ fontSize: 88, lineHeight: 92, color: '#1A1405' }}>
                {fmtBand(lastGrade?.overall ?? null)}
              </Text>
              <Text className="font-heavy" style={{ fontSize: 22, color: '#5A3B00', marginBottom: 12, marginLeft: 4 }}>
                /9
              </Text>
            </View>
            <Text className="font-semi" style={{ fontSize: 14, color: '#5A3B00' }}>
              {graded.length ? `${graded.length} lượt đã chấm · ${attempts.length} lượt luyện` : 'Chưa có điểm — nói thử một Part 1 nhé'}
            </Text>
            <MiniBars bands={graded.slice(0, 8).map((a) => a.grade!.overall as number).reverse()} />
            <View style={{ position: 'absolute', right: 14, bottom: 14 }} aria-hidden>
              <Motion kind="wobble">
                <Sticker tilt={10}>
                  <CuteTrophy size={58} />
                </Sticker>
              </Motion>
            </View>
          </View>
        </Appear>
      </View>

      {/* ------------------------------------------------ hàng 2: chủ đề · tiêu chí · lịch sử */}
      <View style={row}>
        <Appear index={2} style={{ flex: wide ? 1 : undefined }}>
          <View style={[CARD, { backgroundColor: '#22A06B' }]}>
            <Text className="font-heavy" style={{ fontSize: 24, color: '#FFFFFF' }}>
              Chủ đề.
            </Text>
            <View style={{ marginTop: 12, gap: 8 }}>
              {mode === 'full' || mode === 'p1' ? <TopicPill k="PART 1" v={p1Title} /> : null}
              {mode !== 'p1' ? <TopicPill k={mode === 'p3' ? 'PART 3' : 'PART 2'} v={cueTitle} /> : null}
            </View>
            <View style={{ marginTop: 12, flexDirection: 'row', gap: 8 }}>
              <SmallBtn icon="refresh" text="Đổi ngẫu nhiên" onPress={shuffle} />
              <SmallBtn icon={choosing ? 'chevron-down' : 'chevron-right'} text="Tự chọn" onPress={() => setChoosing((v) => !v)} />
            </View>
            {choosing ? (
              <View style={{ marginTop: 12, gap: 10 }}>
                {mode === 'full' || mode === 'p1' ? (
                  <ChipList items={PART1_TOPICS.map((t) => ({ id: t.id, text: t.titleVi }))} value={p1Topic} onPick={setP1Topic} />
                ) : null}
                {mode !== 'p1' ? <ChipList items={CUE_CARDS.map((c) => ({ id: c.id, text: c.titleVi }))} value={cue} onPick={setCue} /> : null}
              </View>
            ) : null}
          </View>
        </Appear>

        <Appear index={3} style={{ flex: wide ? 1 : undefined }}>
          <View style={[CARD, { backgroundColor: '#F0703F' }]}>
            <Text className="font-heavy" style={{ fontSize: 24, color: '#FFFFFF' }}>
              4 tiêu chí.
            </Text>
            <View style={{ marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {CRITERIA.map((c) => {
                const meta = CRIT_ICON[c.key];
                const band = lastGrade?.criteria[c.key]?.band ?? null;
                return (
                  <View key={c.key} style={{ flexBasis: '46%', flexGrow: 1, borderRadius: 18, padding: 12, backgroundColor: '#FFFFFF' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <SealIcon name={meta.icon} color={meta.color} size={32} />
                      <Text className="font-heavy" style={{ fontSize: 26, color: '#0F172A' }}>
                        {fmtBand(band)}
                      </Text>
                    </View>
                    <Text className="font-strong" style={{ marginTop: 4, fontSize: 13, color: '#334155' }} numberOfLines={1}>
                      {meta.short}
                    </Text>
                  </View>
                );
              })}
            </View>
            <Text className="font-sans" style={{ marginTop: 10, fontSize: 12, color: 'rgba(255,255,255,0.85)' }}>
              ~ Phát âm là ước lượng: AI chỉ đọc chữ máy nghe được.
            </Text>
          </View>
        </Appear>

        <Appear index={4} style={{ flex: wide ? 1 : undefined }}>
          <View style={[CARD, { backgroundColor: '#B07A3A' }]}>
            <Text className="font-heavy" style={{ fontSize: 24, color: '#FFFFFF' }}>
              Lượt gần đây.
            </Text>
            <View style={{ marginTop: 12, gap: 8 }}>
              {attempts.length === 0 ? (
                <View style={{ borderRadius: 18, padding: 14, backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Sticker tilt={-6}>
                    <CuteChat size={40} />
                  </Sticker>
                  <Text className="font-semi" style={{ flex: 1, fontSize: 14, color: '#334155' }}>
                    Chưa có lượt nào.
                  </Text>
                </View>
              ) : (
                attempts.slice(0, 4).map((a) => {
                  const band = a.typed ? null : (a.grade?.overall ?? null);
                  const tone = bandTone(band);
                  return (
                    <Pressable
                      key={a.id}
                      accessibilityRole="link"
                      onPress={() => router.push(`/speaking/result/${a.id}` as never)}
                      style={{ borderRadius: 18, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', gap: 10 }}
                    >
                      <View style={{ width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: tone.bg }}>
                        <Text className="font-heavy" style={{ fontSize: 15, color: tone.fg }}>
                          {fmtBand(band)}
                        </Text>
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text className="font-strong" style={{ fontSize: 14, color: '#0F172A' }} numberOfLines={1}>
                          {MODE_LABEL[a.mode]} · {a.titleVi}
                        </Text>
                        <Text className="font-sans" style={{ fontSize: 12, color: '#64748B' }} numberOfLines={1}>
                          {fmtDate(a.finishedAt)} · {a.metrics.words} từ
                        </Text>
                      </View>
                    </Pressable>
                  );
                })
              )}
            </View>
          </View>
        </Appear>
      </View>

      <Text className="font-sans" style={{ marginTop: 16, marginBottom: 32, fontSize: 12, color: '#64748B' }}>
        Câu hỏi do Band 9 tự soạn theo khuôn IELTS. Điểm AI là ước lượng để luyện tập. Chrome đổi giọng thành chữ qua dịch vụ của Google; Band 9 không ghi âm.
      </Text>
    </Screen>
  );
}

const CARD = { borderRadius: 32, padding: 22, overflow: 'hidden' } as const;

function Switch({ on, onPress, text }: { on: boolean; onPress: () => void; text: string }) {
  return (
    <Pressable accessibilityRole="switch" aria-checked={on} onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 9, backgroundColor: 'rgba(255,255,255,0.08)' }}>
      <View style={{ width: 34, height: 20, borderRadius: 10, padding: 2, justifyContent: 'center', backgroundColor: on ? '#22A06B' : 'rgba(255,255,255,0.25)' }}>
        <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: '#FFFFFF', alignSelf: on ? 'flex-end' : 'flex-start' }} />
      </View>
      <Text className="font-strong" style={{ fontSize: 13, color: '#FFFFFF' }}>
        {text}
      </Text>
    </Pressable>
  );
}

function TopicPill({ k, v }: { k: string; v: string }) {
  return (
    <View style={{ borderRadius: 18, padding: 12, backgroundColor: '#FFFFFF' }}>
      <Text className="font-strong" style={{ fontSize: 11, letterSpacing: 1.4, color: '#22A06B' }}>
        {k}
      </Text>
      <Text className="font-heavy" style={{ fontSize: 16, color: '#0F172A' }} numberOfLines={2}>
        {v}
      </Text>
    </View>
  );
}

function SmallBtn({ icon, text, onPress }: { icon: React.ComponentProps<typeof Icon>['name']; text: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: 'rgba(0,0,0,0.18)' }}>
      <Icon name={icon} size={14} color="#FFFFFF" />
      <Text className="font-strong" style={{ fontSize: 13, color: '#FFFFFF' }}>
        {text}
      </Text>
    </Pressable>
  );
}

function ChipList({ items, value, onPick }: { items: { id: string; text: string }[]; value: string; onPick: (id: string) => void }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
      {items.map((it) => {
        const on = it.id === value;
        return (
          <Pressable key={it.id} accessibilityRole="radio" aria-checked={on} onPress={() => onPick(it.id)} style={{ borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: on ? '#FFFFFF' : 'rgba(255,255,255,0.18)' }}>
            <Text className="font-semi" style={{ fontSize: 12, color: on ? '#14532D' : '#FFFFFF' }}>
              {it.text}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Cột band các lượt gần nhất (cũ → mới). */
function MiniBars({ bands }: { bands: number[] }) {
  if (bands.length === 0) return <View style={{ height: 70 }} />;
  return (
    <View style={{ marginTop: 14, height: 70, flexDirection: 'row', alignItems: 'flex-end', gap: 6, paddingRight: 70 }}>
      {bands.map((b, i) => (
        <View key={i} style={{ flex: 1, maxWidth: 22, height: `${Math.max(12, (b / 9) * 100)}%`, borderRadius: 6, backgroundColor: i === bands.length - 1 ? '#1A1405' : 'rgba(26,20,5,0.3)' }} />
      ))}
    </View>
  );
}
