import React, { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { TaskShell } from '@/components/layout/TaskShell';
import { Confetti } from '@/components/motion/Confetti';
import { PageTransition } from '@/components/motion/Motion';
import { SentenceHero } from '@/components/sentence/SentenceHero';
import { LearnSticker } from '@/components/sentence/LearnSticker';
import { Badge, Button, Icon } from '@/components/ui';
import { DICTATION_SETS, getDictationSet } from '@/data/dictation-sets';
import { PARAGRAPH_PROMPTS, getParagraphPrompt, type ParagraphPrompt } from '@/data/paragraph-prompts';
import { markText } from '@/services/sentence/expression-check';
import { setProgress } from '@/services/sentence/learn-status';
import { reviewParagraph, splitSentences, type ParagraphReview, type ParagraphTask, type SentenceReview } from '@/services/sentence/paragraph-review';
import { getStructure } from '@/services/sentence/structure-bank';
import { useLearnStats, useSentenceStore } from '@/store/useSentenceStore';
import { paper } from '@/theme/tokens';
import { useL } from '@/i18n/useL';

/**
 * VIẾT CẢ ĐOẠN — nhận đề (ngữ cảnh hoặc một đoạn tiếng Việt để dịch), viết cả
 * đoạn, rồi nhận góp ý TỪNG CÂU (lỗi ngữ pháp, chính tả, từ vựng, mạch lạc, cấu
 * trúc, cách viết tốt hơn) và nhận xét cả đoạn. Chấm bằng luật, không gọi AI.
 *
 * Hai loại đề, cùng một bộ chấm:
 *   - `?id=pp-…`  đề tự do (đề + dàn ý + từ khoá + đoạn mẫu);
 *   - `?set=set-…` dịch cả đoạn: đoạn tiếng Việt là bản dịch 12 câu của một bộ chép
 *     chính tả, mỗi câu của người học còn được đối chiếu với câu mẫu tương ứng.
 */

type Loaded = {
  task: ParagraphTask;
  title: string;
  mode: 'free' | 'translate';
  brief: string;
  viParagraph?: string;
  outline?: string[];
  keywords?: string[];
  structures?: string[];
  model: string;
};

function load(id?: string, setId?: string): Loaded | null {
  if (setId) {
    const set = getDictationSet(setId);
    if (!set) return null;
    return {
      mode: 'translate',
      title: set.title,
      brief: 'Dịch cả đoạn sang tiếng Anh, giữ đúng thứ tự câu.',
      viParagraph: set.sentences.map((s) => s.vi).join(' '),
      model: set.sentences.map((s) => s.en).join(' '),
      task: { id: set.id, minSentences: set.sentences.length, models: set.sentences },
    };
  }
  const p = id ? getParagraphPrompt(id) : undefined;
  if (!p) return null;
  return {
    mode: 'free',
    title: p.title,
    brief: p.brief,
    outline: p.outline,
    keywords: p.keywords,
    structures: p.structures,
    model: p.model,
    task: { id: p.id, minSentences: p.minSentences, keywords: p.keywords, structures: p.structures },
  };
}

export default function ParagraphScreen() {
  const { id, set } = useLocalSearchParams<{ id?: string; set?: string }>();
  const loaded = load(typeof id === 'string' ? id : undefined, typeof set === 'string' ? set : undefined);
  if (!loaded) {
    return (
      <PageTransition routeKey="para-lib">
        <LibraryView />
      </PageTransition>
    );
  }
  return <Runner key={loaded.task.id} data={loaded} />;
}

// ------------------------------------------------------------------ thư viện

const LEVEL_TONE: Record<string, { bg: string; ink: string }> = {
  B1: { bg: '#E6F6F4', ink: '#0F766E' },
  B2: { bg: '#EEF1F6', ink: '#0F1D33' },
  C1: { bg: '#FFE4E6', ink: '#BE123C' },
  A2: { bg: '#DCFCE7', ink: '#15803D' },
};

function LibraryView() {
  const { L } = useL();
  const stats = useLearnStats();
  const [tab, setTab] = useState<'free' | 'translate'>('free');
  const sets = useMemo(() => DICTATION_SETS, []);
  return (
    <TaskShell
      backHref="/sentence"
      backLabel={L('Quay lại Luyện câu', 'Back to Sentence practice')}
      variant="full"
      title={L('Viết cả đoạn', 'Paragraph writing')}
      subtitle="Sentence-by-sentence feedback"
      icon="note"
      tone="paper"
    >
      <View className="mb-5">
        <SentenceHero
          kind="paragraph"
          title={L('Viết Cả Đoạn', 'Paragraph')}
          sub={L('Viết cả đoạn, nhận góp ý từng câu và nhận xét cả đoạn.', 'Write a whole paragraph and get feedback sentence by sentence.')}
          secondary={{ label: L('Dịch essay dài', 'Long essays'), onPress: () => router.push('/sentence/essay' as never) }}
        />
      </View>
      <View className="mb-4 flex-row flex-wrap gap-2">
        <Button label={L('Đề tự viết', 'Free writing')} size="sm" variant={tab === 'free' ? 'brand' : 'brandOutline'} onPress={() => setTab('free')} />
        <Button label={L('Dịch cả đoạn', 'Translate a paragraph')} size="sm" variant={tab === 'translate' ? 'brand' : 'brandOutline'} onPress={() => setTab('translate')} />
      </View>

      <View className="flex-row flex-wrap" style={{ gap: 14 }}>
        {tab === 'free'
          ? PARAGRAPH_PROMPTS.map((p) => (
              <PromptCard
                key={p.id}
                title={p.title}
                level={p.level}
                blurb={p.brief}
                meta={L(`${p.minSentences}+ câu`, `${p.minSentences}+ sentences`)}
                state={setProgress(stats, 'paragraph', [p.id])}
                onPress={() => router.push(`/sentence/paragraph?id=${p.id}` as never)}
              />
            ))
          : sets.map((s) => (
              <PromptCard
                key={s.id}
                title={s.title}
                level={s.level}
                blurb={s.blurb}
                meta={L(`${s.sentences.length} câu`, `${s.sentences.length} sentences`)}
                state={setProgress(stats, 'paragraph', [s.id])}
                onPress={() => router.push(`/sentence/paragraph?set=${s.id}` as never)}
              />
            ))}
      </View>
    </TaskShell>
  );
}

function PromptCard({ title, level, blurb, meta, state, onPress }: { title: string; level: string; blurb: string; meta: string; state: ReturnType<typeof setProgress>; onPress: () => void }) {
  const tone = LEVEL_TONE[level] ?? LEVEL_TONE.B1!;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      className="rounded-[20px] bg-white p-4"
      style={{ flexGrow: 1, flexBasis: 260, maxWidth: 420, minHeight: 150, borderWidth: 1, borderColor: '#F3F0FB' }}
    >
      <View className="flex-row items-center gap-2">
        <View className="rounded-pill px-2.5 py-0.5" style={{ backgroundColor: tone.bg }}>
          <Text className="font-heavy" style={{ fontSize: 12, color: tone.ink }}>{level}</Text>
        </View>
        <Text className="font-sans text-label text-paper-muted">{meta}</Text>
        <View className="flex-1" />
        <LearnSticker state={state.state} size="sm" />
      </View>
      <Text className="mt-2.5 font-heavy text-ink" style={{ fontSize: 17, lineHeight: 22 }} numberOfLines={2}>{title}</Text>
      <Text className="mt-1 font-sans text-label text-muted" style={{ lineHeight: 18 }} numberOfLines={3}>{blurb}</Text>
    </Pressable>
  );
}

// ----------------------------------------------------------------- làm bài

function Runner({ data }: { data: Loaded }) {
  const { L } = useL();
  const addParagraph = useSentenceStore((s) => s.addParagraph);
  // Chọn nguyên mảng rồi lọc bằng useMemo: bộ chọn trả MẢNG MỚI mỗi lần sẽ làm zustand render vô hạn.
  const allParagraphs = useSentenceStore((s) => s.paragraphs);
  const history = useMemo(() => allParagraphs.filter((p) => p.promptId === data.task.id), [allParagraphs, data.task.id]);
  const stats = useLearnStats();
  const state = setProgress(stats, 'paragraph', [data.task.id]).state;
  const [text, setText] = useState('');
  const [review, setReview] = useState<ParagraphReview | null>(null);
  const [showModel, setShowModel] = useState(false);
  const [submittedText, setSubmittedText] = useState('');

  const live = useMemo(() => splitSentences(text), [text]);
  const wordsLive = text.trim() ? text.trim().split(/\s+/).length : 0;

  const submit = () => {
    if (!text.trim()) return;
    const r = reviewParagraph(data.task, text);
    setReview(r);
    setSubmittedText(text);
    addParagraph({ promptId: data.task.id, text, sentences: r.sentenceCount, cleanSentences: r.cleanCount, words: r.wordCount, minSentences: data.task.minSentences });
  };

  return (
    <TaskShell
      backHref="/sentence/paragraph"
      backLabel={L('Về danh sách đề', 'Back to prompts')}
      title={L('Viết cả đoạn', 'Paragraph writing')}
      subtitle={data.title}
      icon="note"
      tone="paper"
    >
      <View className="gap-4 lg:flex-row">
        <View className="lg:flex-1">
          <View className="overflow-hidden rounded-card border border-brand-soft bg-white p-5">
            {review?.passed ? <Confetti seed={data.task.id} silent /> : null}
            <View className="flex-row flex-wrap items-center gap-2">
              <LearnSticker state={review?.passed ? 'learned' : history.length > 0 ? (state === 'learned' ? 'learned' : 'learning') : 'new'} />
              {history.length > 0 ? <Text className="font-sans text-label text-paper-muted">{L(`Đã nộp ${history.length} lần`, `${history.length} submissions`)}</Text> : null}
            </View>
            <Text className="mt-3 font-heavy text-paper-ink" style={{ fontSize: 21, lineHeight: 28 }}>{data.title}</Text>
            {data.mode === 'translate' ? (
              <View className="mt-2 rounded-panel p-3.5" style={{ backgroundColor: '#F3F0FB' }}>
                <Text className="font-strong text-label text-paper-muted">{L('Dịch đoạn này sang tiếng Anh', 'Translate this paragraph into English')}</Text>
                <Text className="mt-1 font-sans text-bodyLg text-paper-ink" style={{ lineHeight: 26 }}>{data.viParagraph}</Text>
              </View>
            ) : (
              <Text className="mt-1 font-sans text-bodyLg text-paper-body">{data.brief}</Text>
            )}
            {data.outline ? (
              <View className="mt-3 gap-1">
                {data.outline.map((o, i) => (
                  <Text key={i} className="font-sans text-body text-paper-body">{i + 1}. {o}</Text>
                ))}
              </View>
            ) : null}
            {data.keywords ? (
              <View className="mt-3 flex-row flex-wrap gap-1.5">
                {data.keywords.map((k) => (
                  <View key={k} className="rounded-pill px-2.5 py-1" style={{ backgroundColor: '#E0ECFF' }}>
                    <Text className="font-strong" style={{ fontSize: 12.5, color: '#1D4ED8' }}>{k}</Text>
                  </View>
                ))}
                {(data.structures ?? []).map((s) => (
                  <View key={s} className="rounded-pill px-2.5 py-1" style={{ backgroundColor: '#EEE9FF' }}>
                    <Text className="font-strong" style={{ fontSize: 12.5, color: '#3B2E8A' }}>{getStructure(s)?.vi ?? s}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            <TextInput
              value={text}
              onChangeText={setText}
              multiline
              placeholder={L('Viết đoạn văn tiếng Anh của bạn ở đây…', 'Write your English paragraph here…')}
              placeholderTextColor={paper.muted}
              accessibilityLabel={L('Đoạn văn của bạn', 'Your paragraph')}
              className="mt-4 rounded-panel border bg-white p-3.5 font-sans text-bodyLg text-paper-ink"
              style={{ minHeight: 190, borderColor: paper.brandSoft, borderWidth: 2, textAlignVertical: 'top' }}
            />
            <View className="mt-2 flex-row flex-wrap items-center gap-2">
              <Badge label={L(`${wordsLive} từ`, `${wordsLive} words`)} tone="neutral" />
              <Badge
                label={L(`${live.length}/${data.task.minSentences} câu`, `${live.length}/${data.task.minSentences} sentences`)}
                tone={live.length >= data.task.minSentences ? 'success' : 'warning'}
              />
            </View>
            <View className="mt-3 flex-row flex-wrap items-center gap-2">
              <Button label={review ? L('Nộp lại', 'Submit again') : L('Nộp bài', 'Submit')} variant="brand" iconRight="check" disabled={!text.trim()} onPress={submit} />
              <Button label={showModel ? L('Ẩn bài mẫu', 'Hide model') : L('Xem bài mẫu', 'Show model')} variant="brandOutline" size="sm" iconLeft="info" onPress={() => setShowModel((v) => !v)} />
            </View>

            {showModel ? (
              <View className="mt-3 rounded-panel p-3.5" style={{ backgroundColor: '#F1F5F9' }}>
                <Text className="font-strong text-label text-paper-muted">{L('Bài mẫu để đối chiếu — đừng chép nguyên', 'Model for comparison — do not copy it')}</Text>
                <Text className="mt-1 font-sans text-bodyLg text-paper-ink" style={{ lineHeight: 26 }}>{data.model}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View className="gap-4 lg:w-[46%]">
          {review ? <ReviewPanel review={review} text={submittedText} mode={data.mode} /> : <EmptyReview />}
        </View>
      </View>
    </TaskShell>
  );
}

function EmptyReview() {
  const { L } = useL();
  return (
    <View className="rounded-card border border-brand-soft bg-white p-5">
      <Text className="font-strong text-cardTitle text-paper-ink">{L('Góp ý', 'Feedback')}</Text>
      <Text className="mt-2 font-sans text-body text-paper-muted">
        {L('Nộp bài để nhận góp ý từng câu và nhận xét cả đoạn.', 'Submit to get per-sentence feedback and an overall review.')}
      </Text>
    </View>
  );
}

const STAR = ['#CBD5E1', '#F59E0B', '#F59E0B', '#16A34A'] as const;

function ReviewPanel({ review, text, mode }: { review: ParagraphReview; text: string; mode: 'free' | 'translate' }) {
  const { L } = useL();
  const allIssues = useMemo(() => review.sentences.flatMap((s) => s.issues), [review]);
  const segs = useMemo(() => markText(text, allIssues), [text, allIssues]);
  return (
    <View className="gap-4">
      <View className="rounded-card border border-brand-soft bg-white p-5">
        <Text className="font-strong text-cardTitle text-paper-ink">{L('Nhận xét cả đoạn', 'Overall review')}</Text>
        <Text className="mt-1 font-sans text-label text-paper-muted">
          {L(`${review.sentenceCount} câu · ${review.wordCount} từ · ${review.cleanCount} câu sạch lỗi`, `${review.sentenceCount} sentences · ${review.wordCount} words · ${review.cleanCount} clean`)}
        </Text>
        <View className="mt-3 gap-2.5">
          {review.criteria.map((c) => (
            <View key={c.key}>
              <View className="flex-row items-center gap-2">
                <Text className="flex-1 font-strong text-body text-paper-ink">{c.label}</Text>
                <View className="flex-row gap-0.5">
                  {[1, 2, 3].map((n) => (
                    <Icon key={n} name={n <= c.score ? 'star-fill' : 'star'} size={15} color={n <= c.score ? STAR[c.score] : '#CBD5E1'} />
                  ))}
                </View>
              </View>
              <Text className="font-sans text-label text-paper-muted">{c.note}</Text>
            </View>
          ))}
        </View>
        {review.goodVi.length > 0 ? (
          <View className="mt-3 gap-1">
            {review.goodVi.map((g, i) => (
              <Text key={i} className="font-sans text-body" style={{ color: '#15803D' }}>✓ {g}</Text>
            ))}
          </View>
        ) : null}
        {review.improveVi.length > 0 ? (
          <View className="mt-2 gap-1">
            {review.improveVi.map((g, i) => (
              <Text key={i} className="font-sans text-body" style={{ color: '#92400E' }}>→ {g}</Text>
            ))}
          </View>
        ) : null}
        <View className="mt-3 rounded-panel p-3" style={{ backgroundColor: '#EEE9FF' }}>
          <Text className="font-strong text-label" style={{ color: '#3B2E8A' }}>{L('Việc nên làm ngay', 'Do this first')}</Text>
          <Text className="mt-0.5 font-sans text-body text-paper-ink">{review.priorityVi}</Text>
        </View>
        {review.passed ? (
          <View className="mt-3 flex-row items-center gap-2">
            <Icon name="check" size={18} color="#16A34A" strokeWidth={2.6} />
            <Text className="font-strong text-body" style={{ color: '#15803D' }}>{L('Đạt — bài được tính là đã học.', 'Passed — counted as learned.')}</Text>
          </View>
        ) : null}
      </View>

      <View className="rounded-card border border-brand-soft bg-white p-5">
        <Text className="font-strong text-cardTitle text-paper-ink">{L('Bài của bạn, đã đánh dấu', 'Your text, marked up')}</Text>
        <Text className="mt-2 font-sans text-bodyLg text-paper-ink" style={{ lineHeight: 28 }}>
          {segs.map((s, i) =>
            s.issue ? (
              <Text key={i} style={{ color: s.issue.severity === 'error' ? '#BE123C' : '#B45309', fontWeight: '700', textDecorationLine: 'underline' }}>{s.text}</Text>
            ) : (
              <Text key={i}>{s.text}</Text>
            ),
          )}
        </Text>
      </View>

      <View className="gap-3">
        <Text className="font-strong text-cardTitle text-paper-ink">{L('Góp ý từng câu', 'Sentence by sentence')}</Text>
        {review.sentences.map((s) => (
          <SentenceCard key={s.index} s={s} mode={mode} />
        ))}
      </View>
    </View>
  );
}

function SentenceCard({ s, mode }: { s: SentenceReview; mode: 'free' | 'translate' }) {
  const { L } = useL();
  const errors = s.issues.filter((i) => i.severity === 'error').length;
  return (
    <View className="rounded-card bg-white p-4" style={{ borderWidth: 1.5, borderColor: errors === 0 ? '#86D9A3' : '#FDA4AF' }}>
      <View className="flex-row items-start gap-2">
        <View className="h-6 w-6 items-center justify-center rounded-pill" style={{ backgroundColor: errors === 0 ? '#DCFCE7' : '#FFE4E6' }}>
          <Text className="font-heavy" style={{ fontSize: 12, color: errors === 0 ? '#15803D' : '#BE123C' }}>{s.index + 1}</Text>
        </View>
        <Text className="flex-1 font-strong text-bodyLg text-paper-ink">{s.text}</Text>
      </View>

      {s.issues.length > 0 ? (
        <View className="mt-2.5 gap-1.5">
          {s.issues.map((i) => (
            <View key={i.id} className="flex-row items-start gap-2">
              <View className="mt-1.5 h-2 w-2 rounded-pill" style={{ backgroundColor: i.severity === 'error' ? '#E11D48' : '#F59E0B' }} />
              <View className="flex-1">
                <Text className="font-sans text-body text-paper-ink">{i.vi}</Text>
                {i.fix ? <Text className="font-strong text-label" style={{ color: '#15803D' }}>→ {i.fix}</Text> : null}
              </View>
            </View>
          ))}
        </View>
      ) : (
        <Text className="mt-2 font-sans text-body" style={{ color: '#15803D' }}>✓ {L('Không có lỗi ngữ pháp hay chính tả rõ ràng.', 'No clear grammar or spelling errors.')}</Text>
      )}

      {s.vocab.length > 0 ? (
        <View className="mt-2 gap-1">
          {s.vocab.map((v, i) => (
            <Text key={i} className="font-sans text-body text-paper-body">
              <Text className="font-strong" style={{ color: '#1D4ED8' }}>{L('Từ vựng', 'Vocabulary')}: </Text>
              {v.kind === 'upgrade'
                ? L(`"${v.text}" khá chung — thử ${v.better?.map((b) => `"${b}"`).join(', ')}.`, `"${v.text}" is generic — try ${v.better?.map((b) => `"${b}"`).join(', ')}.`)
                : L(`"${v.text}" lặp nhiều lần trong đoạn — đổi từ hoặc dùng đại từ.`, `"${v.text}" repeats across the paragraph — vary it.`)}
            </Text>
          ))}
        </View>
      ) : null}

      {s.coherence.length > 0 ? (
        <View className="mt-1.5 gap-0.5">
          {s.coherence.map((c, i) => (
            <Text key={i} className="font-sans text-label text-paper-muted">{L('Mạch lạc', 'Cohesion')}: {c}</Text>
          ))}
        </View>
      ) : null}

      {s.structures.length > 0 ? (
        <View className="mt-2 flex-row flex-wrap gap-1.5">
          {s.structures.map((n) => (
            <View key={n} className="rounded-pill px-2.5 py-0.5" style={{ backgroundColor: '#EEE9FF' }}>
              <Text className="font-strong" style={{ fontSize: 12, color: '#3B2E8A' }}>{n}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {mode === 'translate' && s.versus ? (
        <View className="mt-2.5 rounded-panel p-2.5" style={{ backgroundColor: '#F1F5F9' }}>
          <Text className="font-strong text-label text-paper-muted">{L('So với câu mẫu', 'Versus the model')}</Text>
          <Text className="mt-0.5 font-sans text-body text-paper-ink">{s.versus.summaryVi}</Text>
          {s.versus.missing.length > 0 ? (
            <Text className="font-sans text-label" style={{ color: '#92400E' }}>
              {L('Còn thiếu', 'Missing')}: {s.versus.missing.slice(0, 4).map((m) => (m.vi ? `${m.word} (${m.vi})` : m.word)).join(', ')}
            </Text>
          ) : null}
        </View>
      ) : null}

      {s.rewrite ? (
        <View className="mt-2.5 rounded-panel p-2.5" style={{ backgroundColor: '#F3F0FB' }}>
          <Text className="font-strong text-label" style={{ color: '#6A4BD9' }}>{L('Cách viết khác', 'A better way')} · {s.rewrite.label}</Text>
          <Text className="mt-0.5 font-sans text-body text-paper-ink">{s.rewrite.en}</Text>
        </View>
      ) : null}
    </View>
  );
}

export type { ParagraphPrompt };
