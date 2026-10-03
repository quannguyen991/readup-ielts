import React, { useMemo, useState } from 'react';
import { HEADER_ART_MIN } from '@/components/three/hero-star-policy';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

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
import { bi, useL, type Bi } from '@/i18n/useL';

type LobbyMode = Exclude<SessionMode, 'q'>;

const MODES: { key: LobbyMode; title: string; hint: Bi }[] = [
  { key: 'full', title: 'Full test', hint: { vi: '11–14 phút · Part 1 → 2 → 3', en: '11–14 min · Part 1 → 2 → 3' } },
  { key: 'p1', title: 'Part 1', hint: { vi: '1–2 câu cùng chủ đề · AI góp ý · nói lại', en: '1–2 questions per topic · AI feedback · try again' } },
  { key: 'p2', title: 'Part 2', hint: { vi: '1 phút chuẩn bị · nói 2 phút', en: '1 min to prepare · speak for 2 min' } },
  { key: 'p3', title: 'Part 3', hint: { vi: '4–5 phút · thảo luận mở rộng', en: '4–5 min · extended discussion' } },
];

const CRIT_ICON: Record<CriterionKey, { icon: React.ComponentProps<typeof SealIcon>['name']; color: string; short: Bi }> = {
  fc: { icon: 'chat', color: '#A8843F', short: { vi: 'Trôi chảy', en: 'Fluency' } },
  lr: { icon: 'book', color: '#22A06B', short: { vi: 'Vốn từ', en: 'Vocabulary' } },
  gr: { icon: 'pencil', color: '#F0703F', short: { vi: 'Ngữ pháp', en: 'Grammar' } },
  pr: { icon: 'volume', color: '#B07A3A', short: { vi: 'Phát âm ~', en: 'Pronunciation ~' } },
};

const pick = <T,>(list: T[]): T => list[Math.floor(Math.random() * list.length)]!;

/**
 * SẢNH PHÒNG LUYỆN NÓI — dạng bento, ít chữ (người dùng 01/10/2026: "nhiều chữ
 * và rối, sửa đi", kèm ảnh tham khảo khối màu lớn, số to, sticker). Khối chính
 * là GIÁM KHẢO AI (quả cầu giọng nói): chọn phần thi rồi chạm để vào phòng.
 * Chủ đề mặc định ngẫu nhiên; ai muốn chọn thì mở danh sách trong khối Chủ đề.
 */
export default function SpeakingLobby() {
  const { L, locale, en } = useL();
  const attempts = useSpeakingStore((s) => s.attempts);
  const mic = useMicSupport();
  const { width } = useWindowDimensions();
  const wide = width >= 1000;

  // `?mode=p1` — đường dẫn từ bài giáo viên giao (`services/classes/assignments.ts`).
  // `&p1=` / `&cue=` — đường dẫn từ Lộ trình học (`app/lo-trinh-hoc.tsx`) mở đúng chủ đề của bài.
  const { mode: modeParam, p1: p1Param, cue: cueParam } = useLocalSearchParams<{ mode?: string; p1?: string; cue?: string }>();
  const [mode, setMode] = useState<LobbyMode>(() => MODES.find((m) => m.key === modeParam)?.key ?? 'p1');
  const [p1Topic, setP1Topic] = useState(() => PART1_TOPICS.find((t) => t.id === p1Param)?.id ?? 'p1-weather');
  const [cue, setCue] = useState(() => CUE_CARDS.find((c) => c.id === cueParam)?.id ?? pick(CUE_CARDS).id);
  const [exam, setExam] = useState(modeParam === 'full');
  const [questionCount, setQuestionCount] = useState<1 | 2>(2);
  const [typedChoice, setTypedChoice] = useState(false);
  const [choosing, setChoosing] = useState(true);
  const typed = mic === false || typedChoice;

  const graded = useMemo(() => attempts.filter((a) => !a.typed && a.grade?.overall != null), [attempts]);
  const lastGrade = graded[0]?.grade ?? null;
  const modeInfo = MODES.find((m) => m.key === mode)!;
  const p1Found = PART1_TOPICS.find((t) => t.id === p1Topic);
  const cueFound = CUE_CARDS.find((c) => c.id === cue);
  const p1Title = (en ? p1Found?.titleEn : `${p1Found?.titleEn} · ${p1Found?.titleVi}`) ?? '';
  const cueTitle = (en ? cueFound?.card.text : cueFound?.titleVi) ?? '';

  const start = () => {
    const q = new URLSearchParams({ mode, p1: p1Topic, cue, exam: exam ? '1' : '0', typed: typed ? '1' : '0' });
    if (mode === 'p1' && !exam) { q.set('count', String(questionCount)); q.set('coach', '1'); }
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
              {L('Phòng luyện nói.', 'Speaking room.')}
            </Text>
          </View>
          {width >= HEADER_ART_MIN ? (
            <Motion kind="float">
              <Sticker tilt={8}>
                <CuteMic size={72} />
              </Sticker>
            </Motion>
          ) : null}
        </View>
      </Appear>

      {/* ------------------------------------------------ hàng 1: giám khảo + band */}
      <View style={row}>
        <Appear style={{ flex: wide ? 2 : undefined }}>
          <View style={[CARD, { backgroundColor: '#0B1A2E', alignItems: 'center' }]}>
            <Sparkles count={6} />
            <View style={{ alignSelf: 'stretch', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text className="font-heavy" style={{ fontSize: 24, color: '#FFFFFF' }}>
                {L(exam ? 'Giám khảo AI.' : 'Luyện cùng Aoede.', exam ? 'AI examiner.' : 'Practise with Aoede.')}
              </Text>
              <Label text={L('Nói cùng AI 🎙️', 'Talk with AI 🎙️')} color="#FACC15" ink="#1A1405" tilt={4} size={12} />
            </View>
            <View style={{ marginTop: 10 }}>
              <VoiceOrb
                state="idle"
                size={wide ? 190 : 160}
                onPress={mic === null ? undefined : start}
                label={L(exam ? 'Chạm để vào phòng thi' : 'Bắt đầu luyện chủ đề đã chọn', exam ? 'Tap to enter the exam room' : 'Practise the selected topic')}
              />
            </View>
            <Text className="font-strong" style={{ marginTop: 10, fontSize: 14, color: 'rgba(255,255,255,0.75)' }}>
              {mic === false
                ? L('Trình duyệt này không nghe được — dùng Chrome/Edge, hoặc gõ phím', "This browser can't listen — use Chrome/Edge, or type instead")
                : L('Chạm vào giám khảo để bắt đầu', 'Tap the examiner to start')}
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
                    onPress={() => { setMode(m.key); setExam(m.key === 'full'); }}
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
              {bi(modeInfo.hint, locale)}
            </Text>

            {mode === 'p1' && !exam ? (
              <View style={{ marginTop: 12, alignItems: 'center', gap: 10 }}>
                <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', gap: 8 }}>
                  {([1, 2] as const).map((n) => (
                    <Pressable key={n} accessibilityRole="radio" aria-checked={questionCount === n} onPress={() => setQuestionCount(n)} style={{ borderRadius: 999, paddingHorizontal: 18, paddingVertical: 10, backgroundColor: questionCount === n ? '#22A06B' : 'rgba(255,255,255,0.08)' }}>
                      <Text className="font-strong" style={{ color: '#FFFFFF' }}>{L(`${n} câu mỗi lượt`, `${n} per round`)}</Text>
                    </Pressable>
                  ))}
                </View>
                <Text className="font-sans" style={{ color: '#C7D2E0', fontSize: 13, textAlign: 'center' }}>{L('Trả lời → bài mẫu & phân tích AI → sửa ý → nói lại', 'Answer → model answer & AI feedback → improve → speak again')}</Text>
              </View>
            ) : null}

            <View style={{ marginTop: 16, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 10 }}>
              <Pressable
                accessibilityRole="button"
                onPress={start}
                disabled={mic === null}
                style={({ hovered }: { hovered?: boolean }) => ({ flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 999, paddingHorizontal: 24, paddingVertical: 13, backgroundColor: hovered ? '#FDE68A' : '#FACC15' }) as object}
              >
                <Icon name="mic" size={18} color="#1A1405" />
                <Text className="font-heavy" style={{ fontSize: 16, color: '#1A1405' }}>
                  {typed ? L('Bắt đầu (gõ phím)', 'Start (typing)') : exam ? L('Vào phòng thi', 'Enter the exam room') : L('Luyện chủ đề này', 'Practise this topic')}
                </Text>
              </Pressable>
              <Switch on={exam} onPress={() => setExam((v) => !v)} text={L('Thi thật', 'Exam mode')} />
              {mic ? <Switch on={typedChoice} onPress={() => setTypedChoice((v) => !v)} text={L('Gõ phím', 'Type')} /> : null}
            </View>
          </View>
        </Appear>

        <Appear index={1} style={{ flex: wide ? 1 : undefined }}>
          <View style={[CARD, { backgroundColor: '#F2B632', minHeight: wide ? '100%' : undefined }]}>
            <Text className="font-strong" style={{ fontSize: 12, letterSpacing: 1.4, color: '#5A3B00' }}>
              {L('BAND NÓI GẦN NHẤT', 'LATEST SPEAKING BAND')}
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
              {graded.length
                ? L(`${graded.length} lượt đã chấm · ${attempts.length} lượt luyện`, `${graded.length} graded · ${attempts.length} practice sessions`)
                : L('Chưa có điểm — nói thử một Part 1 nhé', 'No score yet — try a Part 1')}
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
              {L('Chủ đề.', 'Topics.')}
            </Text>
            <View style={{ marginTop: 12, gap: 8 }}>
              {mode === 'full' || mode === 'p1' ? <TopicPill k="PART 1" v={p1Title} /> : null}
              {mode !== 'p1' ? <TopicPill k={mode === 'p3' ? 'PART 3' : 'PART 2'} v={cueTitle} /> : null}
            </View>
            <View style={{ marginTop: 12, flexDirection: 'row', gap: 8 }}>
              <SmallBtn icon="refresh" text={L('Đổi ngẫu nhiên', 'Shuffle')} onPress={shuffle} />
              <SmallBtn icon={choosing ? 'chevron-down' : 'chevron-right'} text={L('Tự chọn', 'Choose')} onPress={() => setChoosing((v) => !v)} />
            </View>
            {choosing ? (
              <View style={{ marginTop: 12, gap: 10 }}>
                {mode === 'full' || mode === 'p1' ? (
                  <ChipList items={PART1_TOPICS.map((t) => ({ id: t.id, text: en ? t.titleEn : `${t.titleEn} · ${t.titleVi}` }))} value={p1Topic} onPick={setP1Topic} />
                ) : null}
                {mode !== 'p1' ? <ChipList items={CUE_CARDS.map((c) => ({ id: c.id, text: en ? c.card.text : c.titleVi }))} value={cue} onPick={setCue} /> : null}
              </View>
            ) : null}
          </View>
        </Appear>

        <Appear index={3} style={{ flex: wide ? 1 : undefined }}>
          <View style={[CARD, { backgroundColor: '#F0703F' }]}>
            <Text className="font-heavy" style={{ fontSize: 24, color: '#FFFFFF' }}>
              {L('4 tiêu chí.', '4 criteria.')}
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
                      {bi(meta.short, locale)}
                    </Text>
                  </View>
                );
              })}
            </View>
            <Text className="font-sans" style={{ marginTop: 10, fontSize: 12, color: 'rgba(255,255,255,0.85)' }}>
              {L('~ Phát âm là ước lượng: AI chỉ đọc chữ máy nghe được.', '~ Pronunciation is an estimate: the AI only sees the text the recogniser heard.')}
            </Text>
          </View>
        </Appear>

        <Appear index={4} style={{ flex: wide ? 1 : undefined }}>
          <View style={[CARD, { backgroundColor: '#B07A3A' }]}>
            <Text className="font-heavy" style={{ fontSize: 24, color: '#FFFFFF' }}>
              {L('Lượt gần đây.', 'Recent sessions.')}
            </Text>
            <View style={{ marginTop: 12, gap: 8 }}>
              {attempts.length === 0 ? (
                <View style={{ borderRadius: 18, padding: 14, backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Sticker tilt={-6}>
                    <CuteChat size={40} />
                  </Sticker>
                  <Text className="font-semi" style={{ flex: 1, fontSize: 14, color: '#334155' }}>
                    {L('Chưa có lượt nào.', 'No sessions yet.')}
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
                          {fmtDate(a.finishedAt)} · {L(`${a.metrics.words} từ`, `${a.metrics.words} words`)}
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
        {L(
          'Câu hỏi do Band 9 tự soạn theo khuôn IELTS. Điểm AI là ước lượng để luyện tập. Chrome đổi giọng thành chữ qua dịch vụ của Google; Band 9 không ghi âm.',
          "Questions are written by Band 9 in the IELTS format. AI scores are practice estimates. Chrome turns your voice into text via Google's service; Band 9 records no audio.",
        )}
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
