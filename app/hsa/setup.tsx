import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { MonthCalendar } from '@/components/hsa/MonthCalendar';
import { Chip, DarkButton, INK, LINE, MUTED, OptionTile, STAGE_TONES, SoftButton, StageShell, WindowCard, stageLabels, useWide } from '@/components/hsa/stage';
import type { CatPose } from '@/components/mascot/CatSticker';
import { Icon } from '@/components/ui/Icon';
import type { HsaLevel } from '@/data/hsa';
import { bi, useL } from '@/i18n/useL';
import { CRITERIA } from '@/services/hsa/criteria';
import { daysUntil } from '@/services/hsa/plan';
import { GRADES, MINUTES, REASONS, SELF_LEVELS, START_TIMES, STUDY_DAYS, TARGETS, type HsaGrade, type HsaProfile, type HsaReason } from '@/services/hsa/profile';
import { shiftDay } from '@/services/hsa/dates';
import { todayKey } from '@/store/persist';
import { useHsaStore } from '@/store/useHsaStore';

const TONE = STAGE_TONES.about;
const TOTAL = 6;
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
const POSES: CatPose[] = ['wave', 'cheer', 'think', 'read', 'sit', 'write'];

type ExamChoice = 'near' | 'mid' | 'none' | 'date';
type Draft = {
  grade: HsaGrade | null;
  reason: HsaReason | null;
  target: number;
  focus: HsaProfile['focus'];
  selfLevel: HsaLevel | null;
  minutes: number;
  days: number;
  examChoice: ExamChoice | null;
  examDate: string | null;
  startTime: string | null;
};

const fmt = (day: string) => `${day.slice(8, 10)}/${day.slice(5, 7)}/${day.slice(0, 4)}`;

/** Bước 1 của luồng HSA: sáu câu hỏi để dựng hồ sơ, rồi chuyển sang bài test đầu vào. */
export default function HsaSetupScreen() {
  const { L, locale } = useL();
  const wide = useWide();
  const saved = useHsaStore((s) => s.profile);
  const setProfile = useHsaStore((s) => s.setProfile);
  const today = todayKey();

  const [q, setQ] = useState(0);
  const [d, setD] = useState<Draft>(() => ({
    grade: saved?.grade ?? null,
    reason: saved?.reason ?? null,
    target: saved?.target ?? 35,
    focus: saved?.focus ?? 'all',
    selfLevel: saved?.selfLevel ?? null,
    minutes: saved?.minutesPerDay ?? 45,
    days: saved?.daysPerWeek ?? 6,
    examChoice: saved ? (saved.examDate ? 'date' : 'none') : null,
    examDate: saved?.examDate ?? null,
    startTime: saved?.startTime ?? null,
  }));
  const patch = (p: Partial<Draft>) => setD((prev) => ({ ...prev, ...p }));

  const ready = [d.grade !== null, d.reason !== null, d.selfLevel !== null, true, d.examChoice !== null, d.startTime !== null][q]!;

  const finish = () => {
    if (!d.grade || !d.reason || !d.selfLevel || !d.startTime || !d.examChoice) return;
    setProfile({
      grade: d.grade,
      reason: d.reason,
      target: d.target,
      focus: d.focus,
      selfLevel: d.selfLevel,
      minutesPerDay: d.minutes,
      daysPerWeek: d.days,
      examDate: d.examChoice === 'none' ? null : d.examDate,
      startTime: d.startTime,
      createdAt: new Date().toISOString(),
    });
    router.replace('/hsa/placement' as never);
  };
  const next = () => (q === TOTAL - 1 ? finish() : setQ(q + 1));
  const back = () => (q === 0 ? router.canGoBack() ? router.back() : router.replace('/hsa' as never) : setQ(q - 1));

  const titles = [
    { t: L('Bạn hiện đang là', 'You are currently'), l: L('Band 9 cần vài thông tin về bạn để xây lộ trình chính xác hơn.', 'Band 9 needs a few details to build a more accurate plan.') },
    { t: L('Mục tiêu của bạn', 'Your goal'), l: L('Điểm mục tiêu, kỹ năng cần cao nhất và lý do thi.', 'Target score, the skill you most need, and why you are taking it.') },
    { t: L('Tiếng Anh của bạn lúc này', 'Your English right now'), l: L('Chọn mức gần đúng nhất. Bài test đầu vào sẽ đo lại chính xác.', 'Pick the closest level. The entry test will measure it properly.') },
    { t: L('Mỗi ngày học được bao lâu?', 'How long can you study each day?'), l: L('Kế hoạch chia bài vừa với thời gian bạn thật sự có.', 'Your plan is sized to the time you really have.') },
    { t: L('Dự định thi khi nào?', 'When do you plan to sit the exam?'), l: L('Câu quan trọng nhất: cùng mục tiêu mà còn 2 tháng hay 6 tháng thì kế hoạch khác hẳn.', 'The most important one: the same goal with 2 months or 6 months left needs a very different plan.') },
    { t: L('Bạn quen học vào lúc nào?', 'When do you usually study?'), l: L('Mỗi ngày kế hoạch xếp giờ bắt đầu theo khung này.', 'Each day’s plan starts at this time.') },
  ];
  const hints = [
    L('Chọn một đáp án', 'Choose one'),
    d.reason ? L(`Mục tiêu ${d.target}/50`, `Target ${d.target}/50`) : L('Chọn mục tiêu, kỹ năng và lý do thi', 'Choose a target, a skill and a reason'),
    L('Chọn một mức', 'Choose a level'),
    L(`Khoảng ${Math.round((d.minutes * d.days) / 6) / 10} giờ mỗi tuần`, `About ${Math.round((d.minutes * d.days) / 6) / 10} hours a week`),
    L('Chọn mốc hoặc ngày trên lịch', 'Choose a range or a date on the calendar'),
    L('Chọn khung giờ', 'Choose a time'),
  ];

  const cols = wide ? 2 : 1;
  const tileW = wide ? '49%' : '100%';

  return (
    <Screen>
      <View className="w-full self-center" style={{ maxWidth: 1080 }}>
        <StageShell
          tone={TONE}
          step={1}
          progress={q / TOTAL}
          labels={stageLabels(L, wide)}
          eyebrow={`About you · ${L('Câu', 'Question')} ${q + 1}/${TOTAL}`}
          title={titles[q]!.t}
          line={titles[q]!.l}
          pose={POSES[q]}
        >
          <WindowCard frame={TONE.frame}>
            {q === 0 ? (
              <Grid cols={cols} w={tileW}>
                {GRADES.map((g, i) => (
                  <OptionTile key={g.id} letter={LETTERS[i]!} title={bi(g.label, locale)} selected={d.grade === g.id} accent={TONE.accent} onPress={() => patch({ grade: g.id })} />
                ))}
              </Grid>
            ) : null}

            {q === 1 ? (
              <View style={{ gap: 16 }}>
                <View style={{ flexDirection: wide ? 'row' : 'column', gap: 16 }}>
                  <View style={{ flex: wide ? 1 : undefined, borderRadius: 16, borderWidth: 2, borderColor: LINE, padding: 14 }}>
                    <Text className="font-nun-heavy" style={{ fontSize: 13, color: INK }}>
                      {L('Điểm mục tiêu phần Tiếng Anh (số câu đúng trên 50)', 'English-section target (correct answers out of 50)')}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                      <Text className="font-nun-heavy" style={{ fontSize: 44, lineHeight: 50, color: TONE.accent }}>
                        {d.target}
                        <Text style={{ fontSize: 16, color: MUTED }}> /50</Text>
                      </Text>
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <Step label="−" onPress={() => patch({ target: Math.max(TARGETS[0]!, d.target - 5) })} />
                        <Step label="+" dark onPress={() => patch({ target: Math.min(TARGETS[TARGETS.length - 1]!, d.target + 5) })} />
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 6, marginTop: 10 }}>
                      {TARGETS.map((t) => (
                        <Pressable key={t} accessibilityRole="button" accessibilityLabel={String(t)} onPress={() => patch({ target: t })} style={{ flex: 1 }}>
                          <View style={{ height: 12, borderRadius: 6, backgroundColor: t === d.target ? TONE.accent : t < d.target ? '#CFC6EE' : '#F0EEF6' }} />
                          <Text className="font-nun-heavy" style={{ textAlign: 'center', fontSize: 12, color: t === d.target ? TONE.accent : MUTED, marginTop: 4 }}>
                            {t}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                  <View style={{ flex: wide ? 1 : undefined }}>
                    <Text className="font-nun-heavy" style={{ fontSize: 13, color: INK, marginBottom: 8 }}>
                      {L('Kỹ năng bạn cần điểm cao nhất?', 'Which skill do you need most?')}
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                      {CRITERIA.map((c) => (
                        <Chip key={c.id} label={bi(c.title, locale).split(' & ')[0]!} selected={d.focus === c.id} accent={TONE.accent} onPress={() => patch({ focus: c.id })} />
                      ))}
                      <Chip label={L('Đều nhau', 'All equally')} selected={d.focus === 'all'} accent={TONE.accent} onPress={() => patch({ focus: 'all' })} />
                    </View>
                  </View>
                </View>
                <View>
                  <Text className="font-nun-heavy" style={{ fontSize: 13, color: INK, marginBottom: 8 }}>
                    {L('Thi HSA để làm gì?', 'Why are you taking the HSA?')}
                  </Text>
                  <Grid cols={cols} w={tileW}>
                    {REASONS.map((r, i) => (
                      <OptionTile key={r.id} letter={LETTERS[i]!} title={bi(r.label, locale)} selected={d.reason === r.id} accent={TONE.accent} onPress={() => patch({ reason: r.id })} />
                    ))}
                  </Grid>
                </View>
              </View>
            ) : null}

            {q === 2 ? (
              <Grid cols={cols} w={tileW}>
                {SELF_LEVELS.map((l, i) => (
                  <OptionTile key={l.id} letter={LETTERS[i]!} title={`${bi(l.title, locale)} · ${l.id}`} line={bi(l.line, locale)} selected={d.selfLevel === l.id} accent={TONE.accent} onPress={() => patch({ selfLevel: l.id })} />
                ))}
              </Grid>
            ) : null}

            {q === 3 ? (
              <View style={{ gap: 18 }}>
                <View>
                  <Text className="font-nun-heavy" style={{ fontSize: 13, color: INK, marginBottom: 8 }}>
                    {L('Số phút mỗi ngày', 'Minutes per day')}
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {MINUTES.map((m) => (
                      <Chip key={m} label={`${m} ${L('phút', 'min')}`} selected={d.minutes === m} accent={TONE.accent} onPress={() => patch({ minutes: m })} />
                    ))}
                  </View>
                </View>
                <View>
                  <Text className="font-nun-heavy" style={{ fontSize: 13, color: INK, marginBottom: 8 }}>
                    {L('Số ngày học mỗi tuần', 'Study days per week')}
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {STUDY_DAYS.map((n) => (
                      <Chip key={n} label={`${n} ${L('ngày', 'days')}`} selected={d.days === n} accent={TONE.accent} onPress={() => patch({ days: n })} />
                    ))}
                  </View>
                </View>
              </View>
            ) : null}

            {q === 4 ? (
              <View style={{ gap: 14 }}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  <Chip label={L('1–3 tháng', '1–3 months')} selected={d.examChoice === 'near'} accent={TONE.accent} onPress={() => patch({ examChoice: 'near', examDate: shiftDay(today, 60) })} />
                  <Chip label={L('3–6 tháng', '3–6 months')} selected={d.examChoice === 'mid'} accent={TONE.accent} onPress={() => patch({ examChoice: 'mid', examDate: shiftDay(today, 135) })} />
                  <Chip label={L('Chưa có lịch', 'No date yet')} selected={d.examChoice === 'none'} accent={TONE.accent} onPress={() => patch({ examChoice: 'none', examDate: null })} />
                </View>
                <View style={{ flexDirection: wide ? 'row' : 'column-reverse', gap: 12 }}>
                  <View style={{ flex: wide ? 1 : undefined }}>
                    <MonthCalendar
                      value={d.examDate}
                      min={today}
                      accent={TONE.accent}
                      onChange={(day) => patch({ examChoice: 'date', examDate: day })}
                      labels={{
                        month: (y, m) => (locale === 'en' ? new Date(y, m, 1).toLocaleString('en', { month: 'long', year: 'numeric' }) : `Tháng ${m + 1} · ${y}`),
                        weekdays: locale === 'en' ? ['M', 'T', 'W', 'T', 'F', 'S', 'S'] : ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
                      }}
                    />
                  </View>
                  <View style={{ flex: wide ? 1 : undefined, borderRadius: 16, backgroundColor: '#F3F0FB', padding: wide ? 16 : 12, justifyContent: 'center' }}>
                    <Text className="font-nun-heavy" style={{ fontSize: 13, color: MUTED }}>
                      {L('Ngày thi đã chọn', 'Chosen exam date')}
                    </Text>
                    <Text className="font-nun-heavy" style={{ fontSize: wide ? 28 : 24, lineHeight: wide ? 34 : 30, color: INK, marginTop: 2 }}>
                      {d.examChoice === 'none' ? L('Chưa có lịch', 'No date yet') : d.examDate ? `${d.examChoice === 'date' ? '' : '≈ '}${fmt(d.examDate)}` : '—'}
                    </Text>
                    <Text className="font-nun-strong" style={{ fontSize: 13, lineHeight: 19, color: MUTED, marginTop: 6 }}>
                      {d.examChoice === 'none'
                        ? L('Không sao. Kế hoạch sẽ đi theo nhịp đều, bạn thêm ngày thi sau cũng được.', 'No problem. Your plan keeps a steady pace, and you can add the date later.')
                        : d.examDate
                          ? L(`Còn khoảng ${daysUntil(d.examDate, today)} ngày.${d.examChoice === 'date' ? '' : ' Đây là ước chừng, chọn ngày chính xác trên lịch khi bạn đã đăng ký thi.'}`, `About ${daysUntil(d.examDate, today)} days left.${d.examChoice === 'date' ? '' : ' This is an estimate; pick the exact date on the calendar once you are registered.'}`)
                          : L('Chọn một mốc ở trên hoặc một ngày trên lịch.', 'Choose a range above or a day on the calendar.')}
                    </Text>
                  </View>
                </View>
              </View>
            ) : null}

            {q === 5 ? (
              <Grid cols={cols} w={tileW}>
                {START_TIMES.map((s, i) => (
                  <OptionTile key={s.time} letter={LETTERS[i]!} title={bi(s.label, locale)} selected={d.startTime === s.time} accent={TONE.accent} onPress={() => patch({ startTime: s.time })} />
                ))}
              </Grid>
            ) : null}

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 18, paddingTop: 14, borderTopWidth: 1, borderColor: LINE }}>
              <SoftButton label={L('Quay lại', 'Back')} icon="chevron-left" onPress={back} />
              {wide ? (
                <Text className="font-nun-strong" style={{ fontSize: 13, color: MUTED }}>
                  {hints[q]}
                </Text>
              ) : null}
              <DarkButton label={q === TOTAL - 1 ? L('Hoàn tất', 'Finish') : L('Tiếp tục', 'Continue')} disabled={!ready} onPress={next} />
            </View>
          </WindowCard>
        </StageShell>
      </View>
    </Screen>
  );
}

function Grid({ cols, w, children }: { cols: number; w: string; children: React.ReactNode }) {
  const items = React.Children.toArray(children);
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 }}>
      {items.map((c, i) => (
        <View key={i} style={{ width: cols === 1 ? '100%' : (w as `${number}%`) }}>
          {c}
        </View>
      ))}
    </View>
  );
}

function Step({ label, dark, onPress }: { label: string; dark?: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={{ width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: dark ? INK : '#F3F2F7' }}>
      <Text className="font-nun-heavy" style={{ fontSize: 20, color: dark ? '#FFFFFF' : INK }}>
        {label}
      </Text>
    </Pressable>
  );
}
