/**
 * Phần dưới đường mòn của Lộ trình học: YÊU CẦU RIÊNG + LỊCH HỌC.
 *
 * - Chọn phần muốn tập trung → thêm bài cùng loại ở trình độ kế tiếp.
 * - Gõ nhu cầu → AI chọn bài có thật trong app (dùng `/api/search/ai`, chung bộ
 *   đếm lượt "Hỏi AI" của thanh tìm kiếm) → thêm thành bài theo yêu cầu.
 * - Lịch: bài chưa xong của trình độ + bài thêm, xếp vào ngày học theo số phút.
 */
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { Icon } from '@/components/ui/Icon';
import { targetHref, type PathExam, type PathLevel, type PathNode } from '@/data/learning-path';
import { useL } from '@/i18n/useL';
import type { NodeStatus } from '@/services/learning-path/progress';
import {
  FOCUS_OPTIONS,
  KIND_MINUTES,
  buildSchedule,
  fitsExam,
  interleave,
  requestId,
  type FocusId,
  type RequestItem,
  type ScheduleDay,
  type ScheduleItem,
} from '@/services/learning-path/schedule';
import { shortlistIds } from '@/services/search/ai';
import { getCatalog, getEntry } from '@/services/search/catalog';
import { useAuthStore } from '@/store/useAuthStore';
import { useLearningPathStore } from '@/store/useLearningPathStore';
import { todayKey } from '@/store/persist';
import { P } from './PathUi';

const MINUTE_OPTIONS = [30, 45, 60, 90, 120];
const WEEK = [1, 2, 3, 4, 5, 6, 0];
const DAY_VI = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const DAY_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const SHOW_DAYS = 14;

type Props = {
  exam: PathExam;
  level: PathLevel;
  statuses: Record<string, NodeStatus | undefined>;
  /** Bài thêm theo phần tập trung (đã lọc bài xong). */
  focusExtra: PathNode[];
  /** Nhịp học + ngày thi từ "Lộ trình của tôi", nếu đã lập. */
  plan: { minutesPerDay: number; studyDays: number[]; examIso: string | null } | null;
  compact: boolean;
};

export function PathPlanner({ exam, level, statuses, focusExtra, plan, compact }: Props) {
  const { L, en } = useL();
  const focus = useLearningPathStore((s) => s.focus[exam]) ?? [];
  const toggleFocus = useLearningPathStore((s) => s.toggleFocus);
  const allRequests = useLearningPathStore((s) => s.requests);
  const addRequests = useLearningPathStore((s) => s.addRequests);
  const removeRequest = useLearningPathStore((s) => s.removeRequest);
  const manual = useLearningPathStore((s) => s.manual);
  const toggleManual = useLearningPathStore((s) => s.toggleManual);
  const rhythmStored = useLearningPathStore((s) => s.rhythm);
  const setRhythm = useLearningPathStore((s) => s.setRhythm);
  const token = useAuthStore((s) => s.session?.access_token ?? null);

  const requests = useMemo(() => allRequests.filter((r) => r.exam === exam), [allRequests, exam]);
  const planMinutes = plan?.minutesPerDay;
  const planDays = plan?.studyDays;
  const rhythm = useMemo(
    () => rhythmStored ?? (planMinutes && planDays ? { minutesPerDay: planMinutes, studyDays: planDays } : { minutesPerDay: 60, studyDays: [1, 2, 3, 4, 5, 6] }),
    [rhythmStored, planMinutes, planDays],
  );

  const [ask, setAsk] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ text: string; link?: { label: string; href: string } } | null>(null);
  const [showAll, setShowAll] = useState(false);

  const t = (b: { vi: string; en: string }) => (en ? b.en : b.vi);

  /* ------------------------------------------------ hỏi AI */
  const findForMe = async () => {
    const q = ask.trim();
    if (q.length < 3 || busy) return;
    setBusy(true);
    setNote(null);
    try {
      const pool = getCatalog().filter((e) => e.exam === exam || e.exam === 'both');
      const ids = shortlistIds(`${q} ${exam === 'sat' ? 'SAT' : 'IELTS'}`, pool);
      const res = await fetch('/api/search/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ query: `${q} (${exam === 'sat' ? 'SAT' : 'IELTS'})`, ids }),
      });
      const body = (await res.json().catch(() => ({}))) as { picks?: { id: string; reason: string }[]; error?: string; quota?: boolean; signIn?: boolean; note?: string };
      if (!res.ok) {
        setNote({
          text: body.error ?? L('Chưa tìm được, thử lại sau.', "Couldn't search, try again later."),
          link: body.signIn ? { label: L('Đăng nhập', 'Sign in'), href: '/auth/sign-in' } : body.quota ? { label: L('Nâng cấp', 'Upgrade'), href: '/upgrade' } : undefined,
        });
        return;
      }
      const items: RequestItem[] = (body.picks ?? [])
        .map((p) => ({ entry: getEntry(p.id), reason: p.reason ?? '' }))
        .filter((p) => !!p.entry && !p.entry.id.startsWith('lp:') && p.entry.kind !== 'page')
        .map(({ entry, reason }) => ({
          id: requestId(entry!.id),
          exam,
          title: entry!.title,
          href: entry!.href,
          reason,
          minutes: KIND_MINUTES[entry!.kind] ?? 20,
          ask: q,
        }));
      if (items.length === 0) {
        setNote({ text: body.note ?? L('AI chưa tìm được bài phù hợp. Thử nói cụ thể hơn.', "The AI found nothing that fits. Try being more specific.") });
        return;
      }
      addRequests(items);
      setAsk('');
      setNote({ text: L(`Đã thêm ${items.length} bài vào lịch.`, `Added ${items.length} lessons to your schedule.`) });
    } catch {
      setNote({ text: L('Mất kết nối, thử lại sau.', 'Connection lost, try again later.') });
    } finally {
      setBusy(false);
    }
  };

  /* ------------------------------------------------ lịch */
  const today = todayKey();
  const schedule = useMemo(() => {
    const main: ScheduleItem[] = level.parts
      .flatMap((p) => p.nodes)
      .filter((n) => statuses[n.id]?.state !== 'done')
      .map((n) => ({ id: n.id, title: n.title, minutes: n.minutes, href: targetHref(n.target) }));
    const extra: ScheduleItem[] = [
      ...requests.filter((r) => !manual[r.id]).map((r) => ({ id: r.id, title: r.title, minutes: r.minutes, href: r.href, extra: true })),
      ...focusExtra.map((n) => ({ id: n.id, title: n.title, minutes: n.minutes, href: targetHref(n.target), extra: true })),
    ];
    return buildSchedule(interleave(main, extra), { startIso: today, ...rhythm });
  }, [level, statuses, requests, manual, focusExtra, rhythm, today]);
  const fit = fitsExam(schedule, plan?.examIso, today, rhythm.studyDays);
  const days = showAll ? schedule.days : schedule.days.slice(0, SHOW_DAYS);
  const fmt = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
  const dayName = (iso: string) => (en ? DAY_EN : DAY_VI)[new Date(`${iso}T00:00:00Z`).getUTCDay()]!;

  return (
    <View style={{ marginTop: 28, gap: 16 }}>
      {/* ------------------------------------------------ yêu cầu riêng */}
      <Paper>
        <Head n="04" title={L('Yêu cầu riêng', 'Your requests')} compact={compact} />
        <Label text={L('MUỐN TẬP TRUNG', 'FOCUS ON')} />
        <View style={{ marginTop: 8, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {FOCUS_OPTIONS[exam].map((o) => {
            const on = focus.includes(o.id);
            return (
              <Pressable
                key={o.id}
                accessibilityRole="checkbox"
                aria-checked={on}
                onPress={() => toggleFocus(exam, o.id as FocusId)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, borderWidth: 1, borderColor: on ? P.gold : P.line, backgroundColor: on ? '#FBF3E2' : '#FFFFFF' }}
              >
                <Square on={on} />
                <Text className="font-strong" style={{ fontSize: 14, color: P.navy }}>
                  {t(o.label)}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {focus.length > 0 ? (
          <Text className="font-sans" style={{ marginTop: 8, fontSize: 13, color: P.muted }}>
            {focusExtra.length > 0
              ? L(`+${focusExtra.length} bài ở trình độ kế tiếp đã vào lịch.`, `+${focusExtra.length} next-level lessons added to the schedule.`)
              : L('Bạn đang ở trình độ cao nhất.', 'You are at the top level.')}
          </Text>
        ) : null}

        <Label text={L('NHU CẦU KHÁC', 'ANYTHING ELSE')} top={18} />
        <View style={{ marginTop: 8, flexDirection: compact ? 'column' : 'row', gap: 8 }}>
          <TextInput
            value={ask}
            onChangeText={setAsk}
            onSubmitEditing={() => void findForMe()}
            placeholder={exam === 'sat' ? L('VD: yếu hàm số bậc hai, câu từ nối', 'e.g. weak at quadratics and transitions') : L('VD: luyện nghe điền số, chủ đề môi trường', 'e.g. listening for numbers, environment topic')}
            placeholderTextColor="#A39A86"
            maxLength={300}
            style={{ flex: compact ? undefined : 1, height: 44, borderWidth: 1, borderColor: P.line, borderRadius: 10, paddingHorizontal: 12, fontSize: 15, color: P.navy, backgroundColor: '#FFFFFF' }}
          />
          <Pressable
            accessibilityRole="button"
            disabled={busy || ask.trim().length < 3}
            onPress={() => void findForMe()}
            style={{ height: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 10, paddingHorizontal: 16, backgroundColor: P.navy, opacity: busy || ask.trim().length < 3 ? 0.55 : 1 }}
          >
            {busy ? <ActivityIndicator size="small" color={P.goldLight} /> : <Icon name="sparkle" size={16} color={P.goldLight} />}
            <Text className="font-heavy" style={{ fontSize: 14, color: '#FFFFFF' }}>
              {L('AI tìm bài', 'Find with AI')}
            </Text>
          </Pressable>
        </View>
        {note ? (
          <Text className="font-sans" style={{ marginTop: 8, fontSize: 13, color: P.muted }}>
            {note.text}
            {note.link ? (
              <Text className="font-strong" style={{ color: P.goldDeep }} onPress={() => router.push(note.link!.href as never)}>
                {'  '}
                {note.link.label} →
              </Text>
            ) : null}
          </Text>
        ) : null}

        {requests.length > 0 ? (
          <View style={{ marginTop: 12, borderTopWidth: 1, borderColor: P.line }}>
            {requests.map((r) => {
              const done = !!manual[r.id];
              return (
                <View key={r.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderColor: P.line }}>
                  <Pressable accessibilityRole="checkbox" aria-checked={done} accessibilityLabel={L('Đã xong', 'Done')} onPress={() => toggleManual(r.id)}>
                    <Square on={done} />
                  </Pressable>
                  <Pressable accessibilityRole="link" onPress={() => router.push(r.href as never)} style={{ flex: 1, minWidth: 0 }}>
                    <Text className="font-strong" numberOfLines={1} style={{ fontSize: 14, color: P.navy, textDecorationLine: done ? 'line-through' : 'none' }}>
                      {t(r.title)}
                    </Text>
                    {r.reason ? (
                      <Text className="font-sans" numberOfLines={1} style={{ fontSize: 12, color: P.muted }}>
                        {r.reason}
                      </Text>
                    ) : null}
                  </Pressable>
                  <Pressable accessibilityRole="button" accessibilityLabel={L('Bỏ bài này', 'Remove')} onPress={() => removeRequest(r.id)} hitSlop={8}>
                    <Icon name="close" size={14} color={P.muted} />
                  </Pressable>
                </View>
              );
            })}
          </View>
        ) : null}
      </Paper>

      {/* ------------------------------------------------ lịch học */}
      <Paper>
        <Head n="05" title={L('Lịch học', 'Study schedule')} compact={compact} />
        <Label text={L('MỖI BUỔI', 'EACH SESSION')} />
        <View style={{ marginTop: 8, flexDirection: 'row', borderRadius: 12, borderWidth: 1, borderColor: P.line, backgroundColor: '#FFFFFF', padding: 3, gap: 3 }}>
          {MINUTE_OPTIONS.map((m) => {
            const on = rhythm.minutesPerDay === m;
            return (
              <Pressable key={m} accessibilityRole="button" aria-selected={on} onPress={() => setRhythm({ ...rhythm, minutesPerDay: m })} style={{ flex: 1, alignItems: 'center', borderRadius: 9, paddingVertical: 8, backgroundColor: on ? P.navy : 'transparent' }}>
                <Text className="font-strong" style={{ fontSize: 13, color: on ? P.goldLight : P.navy }}>
                  {`${m}'`}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Label text={L('NGÀY HỌC', 'STUDY DAYS')} top={14} />
        <View style={{ marginTop: 8, flexDirection: 'row', gap: 6 }}>
          {WEEK.map((d) => {
            const on = rhythm.studyDays.includes(d);
            return (
              <Pressable
                key={d}
                accessibilityRole="checkbox"
                aria-checked={on}
                accessibilityLabel={(en ? DAY_EN : DAY_VI)[d]}
                onPress={() => {
                  const next = on ? rhythm.studyDays.filter((x) => x !== d) : [...rhythm.studyDays, d];
                  if (next.length > 0) setRhythm({ ...rhythm, studyDays: next });
                }}
                style={{ flex: 1, maxWidth: 52, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: on ? P.navy : P.line, backgroundColor: on ? P.navy : '#FFFFFF' }}
              >
                <Text className="font-strong" style={{ fontSize: 13, color: on ? P.goldLight : P.muted }}>
                  {(en ? DAY_EN : DAY_VI)[d]!.slice(0, en ? 2 : 3)}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {rhythmStored && plan ? (
          <Pressable accessibilityRole="button" onPress={() => setRhythm(null)} style={{ marginTop: 8, alignSelf: 'flex-start' }}>
            <Text className="font-semi" style={{ fontSize: 13, color: P.goldDeep }}>
              {L('Theo "Lộ trình của tôi"', 'Use "My study plan"')}
            </Text>
          </Pressable>
        ) : null}

        {/* tóm tắt */}
        <View style={{ marginTop: 16, borderRadius: 12, backgroundColor: P.navy, padding: 14, gap: 4 }}>
          {schedule.endIso ? (
            <>
              <Text className="font-heavy" style={{ fontSize: 17, color: '#FFFFFF' }}>
                {L(`${schedule.days.length} buổi · xong ${fmt(schedule.endIso)}/${schedule.endIso.slice(0, 4)}`, `${schedule.days.length} sessions · done by ${fmt(schedule.endIso)}/${schedule.endIso.slice(0, 4)}`)}
              </Text>
              {fit.ok ? (
                plan?.examIso ? (
                  <Text className="font-sans" style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>
                    {L(`Kịp trước ngày thi ${fmt(plan.examIso)}.`, `Finishes before your exam on ${fmt(plan.examIso)}.`)}
                  </Text>
                ) : null
              ) : (
                <Text className="font-strong" style={{ fontSize: 13, color: P.goldLight }}>
                  {fit.needMinutes
                    ? L(`Chưa kịp ngày thi. Cần khoảng ${fit.needMinutes}' mỗi buổi.`, `Not before your exam. You need about ${fit.needMinutes} min per session.`)
                    : L('Chưa kịp ngày thi.', 'Not before your exam.')}
                </Text>
              )}
            </>
          ) : (
            <Text className="font-heavy" style={{ fontSize: 16, color: '#FFFFFF' }}>
              {L('Đã xong hết bài của trình độ này.', 'Every lesson at this level is done.')}
            </Text>
          )}
        </View>

        {/* các ngày */}
        <View style={{ marginTop: 12 }}>
          {days.map((d) => (
            <DayRow key={d.iso} day={d} today={d.iso === today} label={`${dayName(d.iso)} ${fmt(d.iso)}`} t={t} />
          ))}
        </View>
        {schedule.days.length > SHOW_DAYS ? (
          <Pressable accessibilityRole="button" onPress={() => setShowAll((v) => !v)} style={{ marginTop: 10, alignSelf: 'center' }}>
            <Text className="font-strong" style={{ fontSize: 13, color: P.goldDeep }}>
              {showAll ? L('Thu gọn', 'Show less') : L(`Xem cả ${schedule.days.length} buổi`, `Show all ${schedule.days.length} sessions`)}
            </Text>
          </Pressable>
        ) : null}
      </Paper>
    </View>
  );
}

function DayRow({ day, today, label, t }: { day: ScheduleDay; today: boolean; label: string; t: (b: { vi: string; en: string }) => string }) {
  const { L } = useL();
  return (
    <View style={{ flexDirection: 'row', gap: 12, paddingVertical: 10, borderTopWidth: 1, borderColor: P.line }}>
      <View style={{ width: 64 }}>
        <Text className="font-heavy" style={{ fontSize: 13, color: today ? P.goldDeep : P.navy }}>
          {today ? L('Hôm nay', 'Today') : label}
        </Text>
        <Text className="font-semi" style={{ fontSize: 12, color: P.muted }}>
          {`${day.minutes}'`}
        </Text>
      </View>
      <View style={{ flex: 1, minWidth: 0, flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {day.items.map((it) => (
          <Pressable
            key={it.id}
            accessibilityRole="link"
            disabled={!it.href}
            onPress={() => it.href && router.push(it.href as never)}
            style={({ hovered }: { hovered?: boolean }) => ({ flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: it.extra ? P.goldLight : P.line, backgroundColor: hovered ? '#FBF6EA' : it.extra ? '#FBF3E2' : '#FFFFFF', maxWidth: '100%' })}
          >
            {it.extra ? <Icon name="plus" size={11} color={P.goldDeep} /> : null}
            <Text className="font-semi" numberOfLines={1} style={{ fontSize: 13, color: P.navy, flexShrink: 1 }}>
              {t(it.title)}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function Paper({ children }: { children: React.ReactNode }) {
  return <View style={{ borderRadius: 22, backgroundColor: P.paper, borderWidth: 1, borderColor: P.line, padding: 20 }}>{children}</View>;
}

function Head({ n, title, compact }: { n: string; title: string; compact: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: compact ? 10 : 16, marginBottom: 12 }}>
      <Text className="font-heavy" style={{ fontSize: compact ? 13 : 20, letterSpacing: compact ? 1.6 : 0, color: P.gold }}>
        {n}
      </Text>
      <Text className="font-heavy" style={{ fontSize: 19, color: P.navy }}>
        {title}
      </Text>
    </View>
  );
}

function Label({ text, top = 0 }: { text: string; top?: number }) {
  return (
    <Text className="font-strong" style={{ marginTop: top, fontSize: 12, letterSpacing: 1.2, color: P.goldDeep }}>
      {text}
    </Text>
  );
}

function Square({ on }: { on: boolean }) {
  return (
    <View style={{ width: 20, height: 20, borderRadius: 5, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: on ? P.gold : '#C9B78F', backgroundColor: on ? P.gold : 'transparent' }}>
      {on ? <Icon name="check" size={13} color="#FFFFFF" strokeWidth={3} /> : null}
    </View>
  );
}
