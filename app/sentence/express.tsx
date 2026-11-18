import React, { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { TaskShell } from '@/components/layout/TaskShell';
import { Confetti } from '@/components/motion/Confetti';
import { CrossFade, PageTransition } from '@/components/motion/Motion';
import { DictationLibrary } from '@/components/sentence/DictationLibrary';
import { LearnSticker } from '@/components/sentence/LearnSticker';
import { SentenceHero } from '@/components/sentence/SentenceHero';
import { StructureBreakdown } from '@/components/sentence/StructureBreakdown';
import { TranslationLibrary } from '@/components/sentence/TranslationLibrary';
import { Badge, Button, Icon } from '@/components/ui';
import { expressSetOf } from '@/services/sentence/express-items';
import { checkExpression, hintFor, markText, type ExpressCheck, type ExpressHint, type ExpressTarget } from '@/services/sentence/expression-check';
import { itemState } from '@/services/sentence/learn-status';
import { useLearnStats, useSentenceStore } from '@/store/useSentenceStore';
import { paper } from '@/theme/tokens';
import { useL } from '@/i18n/useL';

/**
 * TỰ DIỄN ĐẠT — đọc nghĩa tiếng Việt, tự viết câu tiếng Anh theo ý mình, nhận xét,
 * sửa, nộp lại… cho tới khi câu đúng, đủ ý và đúng cấu trúc đích mới được qua.
 *
 * Khác bài Dịch câu (phải tái tạo ĐÚNG câu mẫu): ở đây nhiều câu khác chữ vẫn
 * đúng. Chấm bằng luật (`expression-check.ts`), nên có ba lối thoát để không ai
 * bị kẹt: gợi ý tăng dần (1→3), xem đáp án (mức 4, không tính là đã học), và
 * bỏ qua câu.
 */

type Round = { text: string; check: ExpressCheck };

export default function ExpressScreen() {
  const { set: setParam } = useLocalSearchParams<{ set?: string }>();
  const chosen = typeof setParam === 'string' ? expressSetOf(setParam) : null;

  if (!chosen) {
    return (
      <PageTransition routeKey="express-lib">
        <LibraryView />
      </PageTransition>
    );
  }
  return <SetRunner key={chosen.id} setId={chosen.id} title={chosen.title} items={chosen.items} />;
}

function LibraryView() {
  const { L } = useL();
  const [tab, setTab] = useState<'dictation' | 'translation'>('dictation');
  return (
    <TaskShell
      backHref="/sentence"
      backLabel={L('Quay lại Luyện câu', 'Back to Sentence practice')}
      variant="full"
      title={L('Tự diễn đạt', 'Write it your way')}
      subtitle="Rewrite until it is right"
      icon="pencil"
      tone="paper"
    >
      <View className="mb-5">
        <SentenceHero
          kind="express"
          title={L('Tự Diễn Đạt', 'Write It')}
          sub={L('Đọc nghĩa tiếng Việt, tự viết câu tiếng Anh, sửa cho tới khi đúng.', 'Read the Vietnamese, write your own English, and fix it until it is right.')}
          secondary={{ label: L('Viết cả đoạn', 'Paragraph writing'), onPress: () => router.push('/sentence/paragraph' as never) }}
        />
      </View>
      <View className="mb-3 flex-row flex-wrap gap-2">
        {(
          [
            ['dictation', L('Bộ chép chính tả', 'Dictation sets')],
            ['translation', L('Bộ dịch câu', 'Translation sets')],
          ] as const
        ).map(([key, label]) => (
          <Button key={key} label={label} size="sm" variant={tab === key ? 'brand' : 'brandOutline'} onPress={() => setTab(key)} />
        ))}
      </View>
      {tab === 'dictation' ? <DictationLibrary heading={false} express /> : <TranslationLibrary express />}
    </TaskShell>
  );
}

function SetRunner({ setId, title, items }: { setId: string; title: string; items: ExpressTarget[] }) {
  const { L } = useL();
  const stats = useLearnStats();
  // Mở lại bài thì nhảy tới câu đầu tiên chưa "đã học", khỏi làm lại câu cũ.
  const [index, setIndex] = useState(() => {
    const i = items.findIndex((it) => itemState(stats, 'express', it.id) !== 'learned');
    return i < 0 ? 0 : i;
  });
  const [done, setDone] = useState(false);

  const learnedNow = items.filter((it) => itemState(stats, 'express', it.id) === 'learned').length;

  if (done) {
    return (
      <PageTransition routeKey="express-done">
        <TaskShell backHref="/sentence/express" backLabel={L('Về danh sách bộ', 'Back to sets')} title={L('Xong bộ này', 'Set complete')} subtitle="Write it your way" icon="pencil" tone="paper">
          <View className="items-center rounded-card border border-brand-soft bg-white py-7">
            <Text className="font-heavy text-hero text-paper-ink">{learnedNow}/{items.length}</Text>
            <Text className="mt-1 font-sans text-body text-paper-muted">{L('câu đã tự viết đúng', 'sentences written correctly')}</Text>
          </View>
          <View className="mt-4 flex-row flex-wrap gap-2">
            <Button label={L('Làm lại từ đầu', 'Start again')} variant="brand" iconLeft="refresh" onPress={() => { setIndex(0); setDone(false); }} />
            <Button label={L('Chọn bộ khác', 'Choose another set')} variant="brandOutline" onPress={() => router.replace('/sentence/express' as never)} />
          </View>
        </TaskShell>
      </PageTransition>
    );
  }

  const item = items[index]!;
  return (
    <CrossFade swapKey={`ex-${item.id}`} style={{ flex: 1 }}>
      <ExpressItemView
        key={item.id}
        setId={setId}
        title={title}
        item={item}
        index={index}
        total={items.length}
        onPrev={index > 0 ? () => setIndex(index - 1) : undefined}
        onNext={() => (index + 1 < items.length ? setIndex(index + 1) : setDone(true))}
      />
    </CrossFade>
  );
}

function ExpressItemView({
  title,
  item,
  index,
  total,
  onPrev,
  onNext,
}: {
  setId: string;
  title: string;
  item: ExpressTarget;
  index: number;
  total: number;
  onPrev?: () => void;
  onNext: () => void;
}) {
  const { L } = useL();
  const stats = useLearnStats();
  const record = useSentenceStore((s) => s.recordExpressRound);
  const prior = useSentenceStore((s) => s.express[item.id]);
  const [text, setText] = useState('');
  const [rounds, setRounds] = useState<Round[]>([]);
  const [hintLevel, setHintLevel] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const last = rounds[rounds.length - 1] ?? null;
  const passed = last?.check.passed === true;
  const finished = passed || revealed;
  const state = itemState(stats, 'express', item.id);
  const hints: ExpressHint[] = useMemo(
    () => ([1, 2, 3] as const).slice(0, Math.min(3, hintLevel)).map((lv) => hintFor(item, lv, last?.check ?? null)),
    [hintLevel, item, last],
  );

  const submit = () => {
    if (!text.trim() || finished) return;
    const check = checkExpression(item, text);
    setRounds((r) => [...r, { text, check }]);
    record(item.id, { text, errors: check.errorCount, passed: check.passed }, hintLevel);
  };

  const showAnswer = () => {
    setRevealed(true);
    setHintLevel(3);
    // Mở đáp án mà chưa nộp lần nào: ghi một lượt trống để nhãn là "đang học" chứ không còn "chưa học".
    if (rounds.length === 0) record(item.id, { text: '', errors: 0, passed: false }, 4);
  };

  return (
    <TaskShell
      backHref="/sentence/express"
      backLabel={L('Về danh sách bộ', 'Back to sets')}
      title={L('Tự diễn đạt', 'Write it your way')}
      subtitle={title}
      icon="pencil"
      tone="paper"
      right={
        <View className="rounded-pill border border-brand-soft bg-white px-3.5 py-1.5">
          <Text className="font-strong text-label text-paper-body">{index + 1} / {total}</Text>
        </View>
      }
    >
      <View className="overflow-hidden rounded-card border border-brand-soft bg-white p-5">
        {passed ? <Confetti seed={item.id} silent /> : null}

        <View className="flex-row flex-wrap items-center gap-2">
          <LearnSticker state={passed ? 'learned' : rounds.length > 0 || prior ? 'learning' : state} />
          {prior && prior.rounds.length > 0 && rounds.length === 0 ? (
            <Text className="font-sans text-label text-paper-muted">{L(`Đã thử ${prior.rounds.length} lần trước đây`, `${prior.rounds.length} earlier tries`)}</Text>
          ) : null}
        </View>

        <Text className="mt-3 font-strong uppercase tracking-wide text-paper-muted" style={{ fontSize: 12 }}>{L('Viết bằng tiếng Anh', 'Say this in English')}</Text>
        <Text className="mt-1 font-heavy text-paper-ink" style={{ fontSize: 22, lineHeight: 30 }}>{item.vi}</Text>

        <TargetLine item={item} />

        <TextInput
          value={text}
          onChangeText={setText}
          editable={!finished}
          multiline
          placeholder={L('Viết câu tiếng Anh của bạn…', 'Write your English sentence…')}
          placeholderTextColor={paper.muted}
          accessibilityLabel={L('Câu tiếng Anh của bạn', 'Your English sentence')}
          // Enter nộp bài (Shift+Enter xuống dòng) — câu chỉ một dòng nên Enter là thao tác tự nhiên nhất.
          onKeyPress={(e) => {
            const ne = e.nativeEvent as unknown as { key?: string; shiftKey?: boolean };
            if (ne.key === 'Enter' && !ne.shiftKey) {
              (e as unknown as { preventDefault?: () => void }).preventDefault?.();
              submit();
            }
          }}
          className="mt-4 min-h-[88px] rounded-panel border bg-white p-3.5 font-sans text-bodyLg text-paper-ink"
          style={{ borderColor: passed ? '#16A34A' : last ? '#F59E0B' : paper.brandSoft, borderWidth: 2 }}
        />

        {!finished ? (
          <View className="mt-3 flex-row flex-wrap items-center gap-2">
            <Button label={rounds.length === 0 ? L('Nộp bài', 'Submit') : L('Nộp lại', 'Submit again')} variant="brand" iconRight="check" disabled={!text.trim()} onPress={submit} />
            <Button
              label={hintLevel === 0 ? L('Gợi ý', 'Hint') : hintLevel < 3 ? L('Gợi ý tiếp', 'More hint') : L('Đã mở hết gợi ý', 'No more hints')}
              variant="brandOutline"
              iconLeft="sparkle"
              disabled={hintLevel >= 3}
              onPress={() => setHintLevel((h) => Math.min(3, h + 1))}
            />
            <Button label={L('Xem đáp án', 'Show answer')} variant="brandOutline" size="sm" iconLeft="info" onPress={showAnswer} />
          </View>
        ) : null}

        {hints.length > 0 ? (
          <View className="mt-3 gap-2">
            {hints.map((h) => (
              <View key={h.level} className="rounded-panel p-3" style={{ backgroundColor: '#FFF7E0', borderWidth: 1, borderColor: '#F5C451' }}>
                <Text className="font-strong" style={{ fontSize: 12, color: '#92400E' }}>{L(`Gợi ý ${h.level}`, `Hint ${h.level}`)} · {h.title}</Text>
                <Text className="mt-0.5 font-sans text-body text-paper-ink">{h.body}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {last ? <FeedbackPanel round={last} /> : null}

        {revealed ? (
          <View className="mt-4 rounded-panel p-3.5" style={{ backgroundColor: '#F1F5F9' }}>
            <Text className="font-strong text-label text-paper-muted">{L('Đáp án mẫu — câu này chưa tính là đã học', 'Model answer — not counted as learned')}</Text>
            <Text className="mt-1 font-heavy text-bodyLg text-paper-ink">{item.en}</Text>
          </View>
        ) : null}

        {finished ? (
          <>
            {passed ? (
              <View className="mt-4 flex-row items-center gap-2">
                <Icon name="check" size={19} color="#16A34A" strokeWidth={2.6} />
                <Text className="font-strong text-bodyLg" style={{ color: '#15803D' }}>
                  {rounds.length === 1 ? L('Đạt ngay lần đầu!', 'Right the first time!') : L(`Đạt sau ${rounds.length} lần nộp.`, `Passed after ${rounds.length} submissions.`)}
                </Text>
              </View>
            ) : null}
            <View className="mt-3 rounded-panel bg-paper-canvas p-3.5">
              <Text className="font-sans text-label text-paper-muted">{L('Câu mẫu', 'Model sentence')}</Text>
              <Text className="mt-0.5 font-strong text-bodyLg text-paper-ink">{item.en}</Text>
            </View>
            <StructureBreakdown text={item.en} id={item.id} />
          </>
        ) : null}

        {rounds.length > 1 ? <History rounds={rounds} /> : null}

        <View className="mt-5 flex-row gap-2">
          <Button label={L('Câu trước', 'Previous')} variant="brandOutline" size="sm" iconLeft="chevron-left" disabled={!onPrev} onPress={() => onPrev?.()} />
          <View className="flex-1" />
          <Button
            label={finished ? (index + 1 === total ? L('Xem kết quả', 'See results') : L('Câu tiếp theo', 'Next sentence')) : L('Bỏ qua câu này', 'Skip')}
            variant={finished ? 'brand' : 'brandOutline'}
            size={finished ? 'md' : 'sm'}
            iconRight="arrow-right"
            onPress={onNext}
          />
        </View>
      </View>
    </TaskShell>
  );
}

function TargetLine({ item }: { item: ExpressTarget }) {
  const { L } = useL();
  const req = useMemo(() => hintFor(item, 2, null), [item]);
  const label = req.body.split(':')[0] ?? '';
  return (
    <View className="mt-3 flex-row items-center gap-2 self-start rounded-pill px-3 py-1.5" style={{ backgroundColor: '#EEE9FF' }}>
      <Icon name="target" size={14} color="#3B2E8A" strokeWidth={2.2} />
      <Text className="font-strong" style={{ fontSize: 13, color: '#3B2E8A' }} numberOfLines={1}>
        {L('Cấu trúc đích', 'Target')}: {label}
      </Text>
    </View>
  );
}

const VERDICT_STYLE: Record<string, { bg: string; ink: string; border: string }> = {
  pass: { bg: '#DCFCE7', ink: '#15803D', border: '#86D9A3' },
  fix: { bg: '#FFE4E6', ink: '#BE123C', border: '#FDA4AF' },
  short: { bg: '#FEF3C7', ink: '#92400E', border: '#F5C451' },
  meaning: { bg: '#FEF3C7', ink: '#92400E', border: '#F5C451' },
  structure: { bg: '#E0ECFF', ink: '#1D4ED8', border: '#93B4F8' },
  empty: { bg: '#F1F5F9', ink: '#475569', border: '#CBD5E1' },
};

function FeedbackPanel({ round }: { round: Round }) {
  const { L } = useL();
  const { check, text } = round;
  const st = VERDICT_STYLE[check.verdict] ?? VERDICT_STYLE.empty!;
  const segs = useMemo(() => markText(text, check.issues), [text, check.issues]);
  return (
    <View className="mt-4 rounded-panel p-3.5" style={{ backgroundColor: st.bg, borderWidth: 1.5, borderColor: st.border }} accessibilityLiveRegion="polite">
      <Text className="font-heavy text-bodyLg" style={{ color: st.ink }}>{check.summaryVi}</Text>

      {check.issues.length > 0 ? (
        <Text className="mt-2.5 font-sans text-bodyLg text-paper-ink">
          {segs.map((s, i) =>
            s.issue ? (
              <Text key={i} style={{ color: s.issue.severity === 'error' ? '#BE123C' : '#B45309', fontWeight: '700', textDecorationLine: 'underline', textDecorationStyle: 'wavy' as never }}>
                {s.text}
              </Text>
            ) : (
              <Text key={i}>{s.text}</Text>
            ),
          )}
        </Text>
      ) : null}

      {check.issues.length > 0 ? (
        <View className="mt-2.5 gap-1.5">
          {check.issues.slice(0, 6).map((i) => (
            <View key={i.id} className="flex-row items-start gap-2">
              <View className="mt-1.5 h-2 w-2 rounded-pill" style={{ backgroundColor: i.severity === 'error' ? '#E11D48' : '#F59E0B' }} />
              <View className="flex-1">
                <Text className="font-sans text-body text-paper-ink">{i.vi}</Text>
                {i.fix && i.kind !== 'vietnamese' ? <Text className="font-strong text-label" style={{ color: '#15803D' }}>→ {i.fix}</Text> : null}
                {i.fix && i.kind === 'vietnamese' ? <Text className="font-strong text-label" style={{ color: '#15803D' }}>→ {i.fix}</Text> : null}
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {check.missing.length > 0 && check.verdict !== 'pass' ? (
        <View className="mt-3">
          <Text className="font-strong text-label text-paper-muted">{L('Ý còn thiếu so với đề', 'Ideas still missing')}</Text>
          <View className="mt-1 flex-row flex-wrap gap-1.5">
            {check.missing.slice(0, 5).map((m) => (
              <View key={m.word} className="rounded-pill bg-white px-2.5 py-1" style={{ borderWidth: 1, borderColor: '#F5C451' }}>
                <Text className="font-sans" style={{ fontSize: 13, color: '#92400E' }}>{m.word}{m.vi ? ` · ${m.vi}` : ''}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <View className="mt-3 flex-row flex-wrap items-center gap-1.5">
        <Badge label={L(`Ý ${Math.round(check.coverage * 100)}%`, `Ideas ${Math.round(check.coverage * 100)}%`)} tone={check.coverage >= 0.8 ? 'success' : check.coverage >= 0.55 ? 'warning' : 'danger'} />
        <Badge label={check.errorCount === 0 ? L('Không lỗi', 'No errors') : L(`${check.errorCount} lỗi`, `${check.errorCount} errors`)} tone={check.errorCount === 0 ? 'success' : 'danger'} />
        {check.required ? <Badge label={check.structureOk ? L('Đúng cấu trúc', 'Structure OK') : L('Chưa đúng cấu trúc', 'Wrong structure')} tone={check.structureOk ? 'success' : 'warning'} /> : null}
      </View>
      {check.goodVi.length > 0 && check.verdict !== 'pass' ? <Text className="mt-2 font-sans text-label text-paper-muted">✓ {check.goodVi.join(' ')}</Text> : null}
    </View>
  );
}

function History({ rounds }: { rounds: Round[] }) {
  const { L } = useL();
  const [open, setOpen] = useState(false);
  return (
    <View className="mt-4 rounded-panel border border-brand-soft">
      <Pressable accessibilityRole="button" aria-expanded={open} onPress={() => setOpen((v) => !v)} className="flex-row items-center gap-2 px-3.5 py-2.5">
        <Icon name="clock" size={15} color="#6A4BD9" />
        <Text className="flex-1 font-strong text-body text-paper-ink">{L(`Các lần sửa (${rounds.length})`, `Your revisions (${rounds.length})`)}</Text>
        <Icon name={open ? 'chevron-up' : 'chevron-down'} size={15} color="#94A3B8" />
      </Pressable>
      {open ? (
        <View className="gap-2 px-3.5 pb-3.5">
          {rounds.map((r, i) => (
            <View key={i} className="flex-row items-start gap-2">
              <Text className="font-strong text-label text-paper-muted" style={{ width: 22 }}>{i + 1}.</Text>
              <View className="flex-1">
                <Text className="font-sans text-body text-paper-ink">{r.text}</Text>
                <Text className="font-sans text-label" style={{ color: r.check.passed ? '#15803D' : '#BE123C' }}>{r.check.summaryVi}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
