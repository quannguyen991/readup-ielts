import React, { useMemo, useState } from 'react';
import { Platform, Pressable, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { TaskShell } from '@/components/layout/TaskShell';
import { Confetti } from '@/components/motion/Confetti';
import { PageTransition } from '@/components/motion/Motion';
import { TranslationCover } from '@/components/sentence/DictationCover';
import { LearnSticker } from '@/components/sentence/LearnSticker';
import { LessonCard } from '@/components/sentence/LessonCard';
import { SentenceHero } from '@/components/sentence/SentenceHero';
import { StructureBreakdown } from '@/components/sentence/StructureBreakdown';
import { Button, Icon } from '@/components/ui';
import { ESSAYS, essayItemId, essaySource, getEssay, type Essay } from '@/data/essays';
import { checkExpression, hintFor, markText, type ExpressCheck, type ExpressHint } from '@/services/sentence/expression-check';
import { gradeDictation } from '@/services/sentence/dictation-grade';
import { itemState, setProgress } from '@/services/sentence/learn-status';
import { useLearnStats, useSentenceStore } from '@/store/useSentenceStore';
import { paper } from '@/theme/tokens';
import { useL } from '@/i18n/useL';

/**
 * DỊCH ESSAY DÀI TỪNG CÂU — cả bài tiếng Việt hiện ra, câu đang dịch được tô sáng; người
 * học dịch từng câu, nhận khối Feedback (bản gợi ý tô xanh/đỏ so với bản dịch mẫu, danh
 * sách điểm cần sửa bằng tiếng Việt, nhận xét, độ chính xác), sửa rồi nộp lại hoặc sang câu.
 * Chấm bằng luật (`expression-check.ts`), không gọi AI.
 */

export default function EssayScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const essay = typeof id === 'string' ? getEssay(id) : undefined;
  if (!essay) {
    return (
      <PageTransition routeKey="essay-lib">
        <LibraryView />
      </PageTransition>
    );
  }
  return <EssayRunner key={essay.id} essay={essay} />;
}

const LEVEL_NAME: Record<string, { vi: string; en: string }> = {
  B1: { vi: 'B1 · Trung cấp', en: 'B1 · Intermediate' },
  B2: { vi: 'B2 · Trên trung cấp', en: 'B2 · Upper-intermediate' },
  C1: { vi: 'C1 · Nâng cao', en: 'C1 · Advanced' },
};

function LibraryView() {
  const { L, en } = useL();
  const stats = useLearnStats();
  const [group, setGroup] = useState<string>('all');
  const books = useMemo(() => [...new Set(ESSAYS.map((e) => /^rd-cam(\d+)-/.exec(e.id)?.[1]).filter((x): x is string => !!x))].sort((a, b) => Number(a) - Number(b)), []);
  const shown = useMemo(
    () => ESSAYS.filter((e) => (group === 'all' ? true : group === 'text' ? e.kind !== 'reading' : e.id.startsWith(`rd-cam${group}-`))),
    [group],
  );
  const chips: { key: string; label: string }[] = [
    { key: 'all', label: L(`Tất cả ${ESSAYS.length}`, `All ${ESSAYS.length}`) },
    { key: 'text', label: L('Bài văn', 'Essays') },
    ...books.map((b) => ({ key: b, label: `Cambridge ${b}` })),
  ];
  return (
    <TaskShell backHref="/sentence" backLabel={L('Quay lại Luyện câu', 'Back to Sentence practice')} variant="full" title={L('Dịch essay dài', 'Long essay translation')} subtitle="Sentence by sentence" icon="note" tone="paper">
      <SentenceHero kind="essay" title={L('Dịch Essay', 'Essay Lab')} sub={L('Dịch cả bài văn dài từng câu một, nhận góp ý chi tiết sau mỗi câu.', 'Translate a long text one sentence at a time with feedback after each.')} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 20 }}>
        {chips.map((c) => (
          <Pressable key={c.key} accessibilityRole="button" onPress={() => setGroup(c.key)} style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, borderWidth: 2, borderColor: group === c.key ? '#2A22B5' : '#C9C2EE', backgroundColor: group === c.key ? '#2A22B5' : '#FFFFFF' }}>
            <Text className="font-nun-heavy" style={{ fontSize: 14, color: group === c.key ? '#FFFFFF' : '#2B2350' }}>{c.label}</Text>
          </Pressable>
        ))}
      </View>
      <View className="mt-4 flex-row flex-wrap" style={{ gap: 16 }}>
        {shown.map((e, i) => {
          const ids = e.sentences.map((_, k) => essayItemId(e.id, k));
          const status = setProgress(stats, 'essay', ids);
          const lv = LEVEL_NAME[e.level];
          return (
            <View key={e.id} style={{ flexGrow: 1, flexBasis: 280, maxWidth: 440 }}>
              <LessonCard
                number={i + 1}
                level={e.level}
                levelLabel={lv ? (en ? lv.en : lv.vi) : e.level}
                icon="note"
                title={e.title}
                blurb={e.blurb}
                meta={[
                  { icon: 'list', label: L(`${e.sentences.length} câu`, `${e.sentences.length} sentences`) },
                  { icon: 'note', label: L(`${e.paragraphSizes.length} đoạn`, `${e.paragraphSizes.length} paragraphs`) },
                  ...(essaySource(e.id) ? [{ icon: 'book' as const, label: essaySource(e.id)! }] : []),
                ]}
                done={0}
                status={status}
                bleed
                visualHeight={112}
                visual={(tone) => <TranslationCover tone={tone} pairs={e.sentences} level={e.level} seed={i + 3} />}
                onPress={() => router.push(`/sentence/essay?id=${e.id}` as never)}
              />
            </View>
          );
        })}
      </View>
    </TaskShell>
  );
}

type Round = { text: string; check: ExpressCheck };

function EssayRunner({ essay }: { essay: Essay }) {
  const { L } = useL();
  const stats = useLearnStats();
  const record = useSentenceStore((s) => s.recordItem);
  const total = essay.sentences.length;
  const [index, setIndex] = useState(() => {
    const i = essay.sentences.findIndex((_, k) => itemState(stats, 'essay', essayItemId(essay.id, k)) !== 'learned');
    return i < 0 ? 0 : i;
  });
  const [text, setText] = useState('');
  const [rounds, setRounds] = useState<Round[]>([]);
  const [hintLevel, setHintLevel] = useState(0);
  const [revealed, setRevealed] = useState(false);
  // Điểm tốt nhất từng câu trong lượt này → độ chính xác chung.
  const [scores, setScores] = useState<Record<number, number>>({});

  const s = essay.sentences[index]!;
  const target = useMemo(() => ({ id: essayItemId(essay.id, index), en: s.en, vi: s.vi }), [essay.id, index, s.en, s.vi]);
  const last = rounds[rounds.length - 1] ?? null;
  const passed = last?.check.passed === true;
  const finished = passed || revealed;
  const hints: ExpressHint[] = useMemo(
    () => ([1, 2, 3] as const).slice(0, hintLevel).map((lv) => hintFor(target, lv, last?.check ?? null)),
    [hintLevel, target, last],
  );
  const done = essay.sentences.every((_, k) => itemState(stats, 'essay', essayItemId(essay.id, k)) === 'learned');
  const scored = Object.values(scores);
  const accuracy = scored.length ? Math.round((scored.reduce((a, b) => a + b, 0) / scored.length) * 100) : null;

  const submit = () => {
    if (!text.trim() || finished) return;
    const check = checkExpression(target, text);
    setRounds((r) => [...r, { text, check }]);
    const score = check.passed ? 1 : Math.max(0, check.coverage - 0.25 * check.errorCount);
    setScores((m) => ({ ...m, [index]: Math.max(m[index] ?? 0, score) }));
    record('essay', target.id, score, check.passed);
  };

  const next = () => {
    if (index + 1 < total) {
      setIndex(index + 1);
      setText('');
      setRounds([]);
      setHintLevel(0);
      setRevealed(false);
    } else {
      router.replace('/sentence/essay' as never);
    }
  };

  // Bốn đoạn văn tiếng Việt, câu đang dịch tô hồng đậm, câu đã qua đậm vừa, câu chưa tới mờ.
  const paragraphs = useMemo(() => {
    const out: { text: string; index: number }[][] = essay.paragraphSizes.map(() => []);
    essay.sentences.forEach((x, i) => out[x.paragraph]!.push({ text: x.vi, index: i }));
    return out;
  }, [essay]);

  return (
    <TaskShell
      backHref="/sentence/essay"
      backLabel={L('Về danh sách bài', 'Back to essays')}
      title={essay.title}
      subtitle={essay.titleEn}
      icon="note"
      tone="paper"
      right={
        <View className="rounded-pill border border-brand-soft bg-white px-3.5 py-1.5">
          <Text className="font-strong text-label text-paper-body">{index + 1} / {total}</Text>
        </View>
      }
    >
      {passed ? <Confetti seed={target.id} silent /> : null}
      {/* thanh tiến độ */}
      <View style={{ height: 10, borderRadius: 999, backgroundColor: '#E4DEFB', overflow: 'hidden' }}>
        <View style={{ height: 10, borderRadius: 999, width: `${(index / total) * 100}%`, backgroundColor: '#8B6CF0' }} />
      </View>

      <View className="mt-4 gap-4 lg:flex-row">
        <View className="lg:flex-1">
          <View className="rounded-card border border-brand-soft bg-white p-5">
            <View className="flex-row flex-wrap items-center gap-2">
              <LearnSticker state={done ? 'learned' : 'learning'} learned={Object.keys(scores).length} total={total} size="sm" />
              <Text className="font-sans text-label text-paper-muted">{L('Dịch câu được tô sáng', 'Translate the highlighted sentence')}</Text>
            </View>
            <View className="mt-3 gap-3.5">
              {paragraphs.map((p, pi) => (
                <Text key={pi} className="font-sans text-bodyLg" style={{ lineHeight: 28 }}>
                  {p.map((x) => (
                    <Text
                      key={x.index}
                      style={
                        x.index === index
                          ? { color: '#E5287A', fontWeight: '800', backgroundColor: '#FFE4F1' }
                          : x.index < index
                            ? { color: '#4B4670' }
                            : { color: '#A9A4C4' }
                      }
                    >
                      {x.text}{' '}
                    </Text>
                  ))}
                </Text>
              ))}
            </View>
          </View>

          <TextInput
            value={text}
            onChangeText={setText}
            editable={!finished}
            multiline
            placeholder={L('Nhập bản dịch tiếng Anh của câu được tô sáng…', 'Enter your English translation of the highlighted sentence…')}
            placeholderTextColor={paper.muted}
            accessibilityLabel={L('Bản dịch của bạn', 'Your translation')}
            className="mt-3 min-h-[96px] rounded-panel border bg-white p-3.5 font-sans text-bodyLg text-paper-ink"
            style={{ borderColor: passed ? '#16A34A' : last ? '#F59E0B' : '#F5C451', borderWidth: 2 }}
            onKeyPress={(e) => {
              const ne = e.nativeEvent as unknown as { key?: string; shiftKey?: boolean };
              if (ne.key === 'Enter' && !ne.shiftKey) {
                (e as unknown as { preventDefault?: () => void }).preventDefault?.();
                if (finished) next();
                else submit();
              }
            }}
          />
          <View className="mt-3 flex-row flex-wrap items-center gap-2">
            <Button label={L('Thoát', 'Quit')} variant="brandOutline" size="sm" iconLeft="arrow-right" onPress={() => router.replace('/sentence/essay' as never)} />
            <View className="flex-1" />
            {!finished ? (
              <>
                <Button label={hintLevel === 0 ? L('Gợi ý', 'Hint') : L('Gợi ý tiếp', 'More hint')} variant="brandOutline" size="sm" iconLeft="sparkle" disabled={hintLevel >= 3} onPress={() => setHintLevel((h) => Math.min(3, h + 1))} />
                <Button label={L('Xem đáp án', 'Answer')} variant="brandOutline" size="sm" iconLeft="info" onPress={() => { setRevealed(true); record('essay', target.id, 0, false); }} />
                <Button label={rounds.length ? L('Nộp lại', 'Resubmit') : L('Nộp bài', 'Submit')} variant="brand" iconRight="check" disabled={!text.trim()} onPress={submit} />
              </>
            ) : (
              <Button label={index + 1 === total ? L('Hoàn thành', 'Finish') : L('Câu tiếp theo', 'Next sentence')} variant="brand" iconRight="arrow-right" onPress={next} />
            )}
          </View>
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
        </View>

        <View className="gap-3 lg:w-[40%]">
          <View className="flex-row gap-3">
            <View className="flex-1 items-center rounded-panel bg-white p-3" style={{ borderWidth: 1, borderColor: '#EEE9FF' }}>
              <Icon name="target" size={18} color="#16A34A" strokeWidth={2.4} />
              <Text className="mt-1 font-heavy text-paper-ink" style={{ fontSize: 18 }}>{accuracy === null ? '—' : `${accuracy}%`}</Text>
              <Text className="font-sans text-label text-paper-muted">{L('Độ chính xác', 'Accuracy')}</Text>
            </View>
            <View className="flex-1 items-center rounded-panel bg-white p-3" style={{ borderWidth: 1, borderColor: '#EEE9FF' }}>
              <Icon name="check" size={18} color="#8B6CF0" strokeWidth={2.4} />
              <Text className="mt-1 font-heavy text-paper-ink" style={{ fontSize: 18 }}>{Object.values(scores).filter((v) => v >= 1).length}/{total}</Text>
              <Text className="font-sans text-label text-paper-muted">{L('Câu đạt', 'Passed')}</Text>
            </View>
          </View>

          <View className="rounded-card border border-brand-soft bg-white p-4">
            <Text className="font-strong text-cardTitle text-paper-ink">Feedback</Text>
            {last ? <EssayFeedback round={last} model={s.en} /> : (
              <Text className="mt-2 font-sans text-body text-paper-muted">{L('Nộp bài để nhận góp ý chi tiết cho câu này.', 'Submit to get detailed feedback on this sentence.')}</Text>
            )}
            {revealed ? (
              <View className="mt-3 rounded-panel p-3" style={{ backgroundColor: '#F1F5F9' }}>
                <Text className="font-strong text-label text-paper-muted">{L('Đáp án mẫu', 'Model translation')}</Text>
                <Text className="mt-0.5 font-heavy text-bodyLg text-paper-ink">{s.en}</Text>
              </View>
            ) : null}
            {finished ? <StructureBreakdown text={s.en} vi={s.vi} /> : null}
          </View>
        </View>
      </View>
    </TaskShell>
  );
}

function EssayFeedback({ round, model }: { round: Round; model: string }) {
  const { L } = useL();
  const { check, text } = round;
  const diff = useMemo(() => gradeDictation(model, text), [model, text]);
  const segs = useMemo(() => markText(text, check.issues), [text, check.issues]);
  const ok = check.passed;
  return (
    <View className="mt-2 gap-3" accessibilityLiveRegion="polite">
      {/* Suggestion: bản mẫu, từ bạn thiếu tô xanh, từ thừa tô đỏ gạch */}
      <View className="rounded-panel p-3" style={{ backgroundColor: '#F6F4FD' }}>
        <Text className="font-strong" style={{ fontSize: 13, color: '#B83280' }}>Suggestion</Text>
        <Text className="mt-1 font-sans text-bodyLg text-paper-ink" style={{ lineHeight: 26 }}>
          {diff.tokens.map((t, i) => (
            <Text
              key={i}
              style={
                t.status === 'missing'
                  ? { color: '#15803D', fontWeight: '800' }
                  : t.status === 'extra'
                    ? { color: '#BE123C', fontWeight: '800', textDecorationLine: 'line-through' }
                    : undefined
              }
            >
              {t.word}{' '}
            </Text>
          ))}
        </Text>
        <Text className="mt-1 font-sans text-label text-paper-muted">{L('Xanh: từ còn thiếu so với bản mẫu · Đỏ gạch: từ thừa hoặc sai', 'Green: missing vs the model · Red: extra or wrong')}</Text>
      </View>

      <View>
        <Text className="font-strong text-label text-paper-muted">{L('Điểm cần sửa', 'Suggested improvements')}</Text>
        {check.issues.length === 0 && check.missing.length === 0 && check.structureOk ? (
          <Text className="mt-1 font-sans text-body" style={{ color: '#15803D' }}>✓ {L('Không có lỗi ngữ pháp hay chính tả rõ ràng.', 'No clear grammar or spelling errors.')}</Text>
        ) : (
          <View className="mt-1 gap-1.5">
            {check.issues.slice(0, 5).map((i) => (
              <Text key={i.id} className="font-sans text-body text-paper-ink">
                <Text style={{ color: i.severity === 'error' ? '#BE123C' : '#B45309', fontWeight: '700' }}>• {i.found}</Text> — {i.vi}
                {i.fix ? <Text style={{ color: '#15803D', fontWeight: '700' }}>  → {i.fix}</Text> : null}
              </Text>
            ))}
            {check.missing.length > 0 ? (
              <Text className="font-sans text-body text-paper-ink">
                • {L('Còn thiếu ý', 'Missing ideas')}: {check.missing.slice(0, 4).map((m) => (m.vi ? `${m.word} (${m.vi})` : m.word)).join(', ')}
              </Text>
            ) : null}
            {!check.structureOk && check.required ? (
              <Text className="font-sans text-body text-paper-ink">• {L('Cấu trúc nên dùng', 'Structure to use')}: {check.required.vi}</Text>
            ) : null}
          </View>
        )}
      </View>

      <View className="rounded-panel p-3" style={{ backgroundColor: ok ? '#DCFCE7' : '#FEF3C7' }}>
        <Text className="font-strong" style={{ fontSize: 13, color: ok ? '#15803D' : '#92400E' }}>{L('Nhận xét', 'Comment')}</Text>
        <Text className="mt-0.5 font-sans text-body text-paper-ink">{check.summaryVi}</Text>
        {check.goodVi.length > 0 && !ok ? <Text className="font-sans text-label text-paper-muted">✓ {check.goodVi.join(' ')}</Text> : null}
        <Text className="mt-1 font-sans text-label text-paper-muted">
          {L(`Ý ${Math.round(check.coverage * 100)}% · ${check.errorCount} lỗi`, `Ideas ${Math.round(check.coverage * 100)}% · ${check.errorCount} errors`)}
        </Text>
      </View>
      <Text className="font-sans text-label text-paper-muted" selectable={Platform.OS === 'web'}>{segs.map((x) => x.text).join('')}</Text>
    </View>
  );
}
