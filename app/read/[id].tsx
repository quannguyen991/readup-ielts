import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import type { QuestionType } from '@/types/database';
import * as Speech from 'expo-speech';
import { englishVoice } from '@/services/audio/voice';
import * as WebBrowser from 'expo-web-browser';

import { PASSAGE_CONTAINER_ID, PassageView, sentenceAround, highlightRanges, snapToWords, type ReaderTool } from '@/components/reader/PassageView';
import { QuestionPanel, type QuestionPanelHandle } from '@/components/reader/QuestionPanel';
import { SplitPane } from '@/components/reader/exam/ExamChrome';
import { ExamClock } from '@/components/exam/ExamClock';
import { NotesPanel, SettingsPanel } from '@/components/reader/exam/ExamPanels';
import { useTextSelection } from '@/components/reader/useTextSelection';
import { WordSheet, type WordSheetTarget } from '@/components/reader/WordSheet';
import { ChatPanel } from '@/components/reader/ChatPanel';
import type { EvidenceMark } from '@/services/proofloop/types';
import { readingSkillFor } from '@/services/mastery/reading-skill';
import { observeSkill } from '@/store/useMasteryStore';
import { useBilingual } from '@/components/reader/useBilingual';
import { CrossFade } from '@/components/motion/Motion';
import { Badge, Button, Card } from '@/components/ui';
import { readingFont, useReadingFonts } from '@/lib/readingFonts';
import { getArticleById, getArticleWithBody, isReadable, type Article, type ArticleMeta } from '@/data/articles';
import { lemmatize } from '@/services/dictionary/lookup';
import { gradeQuestions } from '@/services/questions/grade';
import { useQuestionStore } from '@/store/useQuestionStore';
import { useReaderStore } from '@/store/useReaderStore';
import { rawScoreToBand, useStudyStore, type AttemptRecord } from '@/store/useStudyStore';
import { useUserArticleStore } from '@/store/useUserArticleStore';
import { useVocabStore } from '@/store/useVocabStore';
import { color, type HighlightColorKey } from '@/theme/tokens';
import { useGameStore } from '@/store/useGameStore';
import { useL } from '@/i18n/useL';
import { examLayout } from '@/lib/mobile/exam-layout';
import { useExamDraft, useExamWebTweaks, useKeyboardInset, useLeaveGuard } from '@/lib/mobile/useMobileExam';
import { groupIntoBlocks } from '@/components/reader/QuestionBlocks';

// Modern IELTS UI Components
import { IeltsExamHeader } from '@/components/reader/ielts/IeltsExamHeader';
import { IeltsPassageToolbar } from '@/components/reader/ielts/IeltsPassageToolbar';
import { IeltsBottomBar, type QuestionNavItem } from '@/components/reader/ielts/IeltsBottomBar';
import { IeltsScoreModal } from '@/components/reader/ielts/IeltsScoreModal';

export default function ReadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ReadSession key={id} />;
}

function ReadSession() {
  const { id, types, mode, from, until, review } = useLocalSearchParams<{
    id: string;
    types?: string;
    mode?: string;
    from?: string;
    until?: string;
    review?: string;
  }>();
  const runEnd = until && Number.isFinite(Number(until)) ? Number(until) : undefined;
  const { L } = useL();

  const requestedTypes = useMemo(
    () => (types ? (types.split(',').filter(Boolean) as QuestionType[]) : undefined),
    [types],
  );
  const userArticle = useUserArticleStore((s) => (id ? s.articles[id] : undefined));

  const meta = useMemo<ArticleMeta | undefined>(
    () => (id ? getArticleById(id) : undefined) ?? userArticle,
    [id, userArticle],
  );

  const article = useMemo<Article | undefined>(() => {
    if (!meta || !isReadable(meta)) return undefined;
    return (id ? getArticleWithBody(id) : undefined) ?? userArticle;
  }, [id, meta, userArticle]);

  const fontScale = useReaderStore((s) => s.fontScale);
  const bilingual = useBilingual(id ?? '');
  const setFontScale = useReaderStore((s) => s.setFontScale);
  const ttsRate = useReaderStore((s) => s.ttsRate);
  const setTtsRate = useReaderStore((s) => s.setTtsRate);
  const addHighlight = useReaderStore((s) => s.addHighlight);
  const clearHighlights = useReaderStore((s) => s.clearHighlights);
  const removeHighlight = useReaderStore((s) => s.removeHighlight);
  const highlights = useReaderStore((s) => s.highlights);
  const addNote = useReaderStore((s) => s.addNote);
  const removeNote = useReaderStore((s) => s.removeNote);
  const notes = useReaderStore((s) => s.notes);

  const statusOf = useVocabStore((s) => s.statusOf);
  const markSeen = useVocabStore((s) => s.markSeen);

  const setProgress = useStudyStore((s) => s.setProgress);
  const addSession = useStudyStore((s) => s.addSession);
  const logWpm = useStudyStore((s) => s.logWpm);
  const logStudyTime = useStudyStore((s) => s.logStudyTime);

  const ensureSet = useQuestionStore((s) => s.ensureSet);
  const mixedSet = useQuestionStore((s) => s.mixedSet);
  const questionSet = useQuestionStore((s) => (id ? s.sets[id] : undefined));
  const loadingQuestions = useQuestionStore((s) => (id ? (s.loading[id] ?? false) : false));

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [marked, setMarked] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [sheet, setSheet] = useState<WordSheetTarget | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [highlightColor, setHighlightColor] = useState<HighlightColorKey>('yellow');
  const [phraseMode, setPhraseMode] = useState(false);
  const [tool, setTool] = useState<ReaderTool>('read');
  const [showToolbar, setShowToolbar] = useState(false);
  const [phraseAnchor, setPhraseAnchor] = useState<{
    paragraphIndex: number;
    tokenIndex: number;
    word: string;
  } | null>(null);

  const [evidenceMarks, setEvidenceMarks] = useState<Record<string, EvidenceMark>>({});
  const [evidenceFor, setEvidenceFor] = useState<string | null>(null);

  const [speakingParagraph, setSpeakingParagraph] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);

  // Review & Grading Mode State
  const [isReviewMode, setIsReviewMode] = useState(Boolean(review));
  const [gradedMap, setGradedMap] = useState<Record<string, boolean>>({});
  const [lastScore, setLastScore] = useState<{ correct: number; total: number; band: number | null } | null>(null);
  const [scoreModalVisible, setScoreModalVisible] = useState(false);
  const [locateEvidence, setLocateEvidence] = useState(true);

  const { width: winW, height: winH } = useWindowDimensions();
  const [narrowTab, setNarrowTab] = useState<'passage' | 'questions'>('passage');
  const [notesOpen, setNotesOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeQ, setActiveQ] = useState(1);

  const pScroll = useRef<ScrollView>(null);
  const qScroll = useRef<ScrollView>(null);
  const panelRef = useRef<QuestionPanelHandle>(null);
  useReadingFonts();

  const startedAt = useRef(0);

  useExamWebTweaks();
  const keyboardInset = useKeyboardInset();
  const [done, setDone] = useState(false);
  const draftState = useMemo(() => ({ answers, marked }), [answers, marked]);
  const onRestoreDraft = useCallback((d: { answers: Record<string, string>; marked: Record<string, boolean> }) => {
    setAnswers((prev) => (Object.keys(prev).length ? prev : d.answers));
    setMarked((prev) => (Object.keys(prev).length ? prev : d.marked));
  }, []);
  const draft = useExamDraft('read', id, draftState, !done && !isReviewMode, onRestoreDraft);
  const hasAnswers = useMemo(() => Object.values(answers).some((v) => v.trim() !== ''), [answers]);
  const askLeave = useCallback(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return true;
    return window.confirm(
      L(
        'Thoát khỏi bài đang làm? Đáp án đã chọn vẫn được lưu nháp 12 giờ.',
        'Leave this exercise? Your answers stay saved as a draft for 12 hours.',
      ),
    );
  }, [L]);
  useLeaveGuard(hasAnswers && !done && !isReviewMode, askLeave);

  const passageHandlers = useRef<{
    word: (w: string, s: string, p: number) => void;
    longPress: (s: string, p: number) => void;
    phrase: (p: number, t: number, tok: string) => void;
    range: (p: number, a: number, b: number) => void;
  } | null>(null);
  const onWord = useCallback((w: string, s2: string, p: number) => passageHandlers.current?.word(w, s2, p), []);
  const onLongPress = useCallback((s2: string, p: number) => passageHandlers.current?.longPress(s2, p), []);
  const onPhrase = useCallback((p: number, t: number, tok: string) => passageHandlers.current?.phrase(p, t, tok), []);
  const onRange = useCallback((p: number, a: number, b: number) => passageHandlers.current?.range(p, a, b), []);
  const onAnswerQ = useCallback((qid: string, a: string) => setAnswers((prev) => (prev[qid] === a ? prev : { ...prev, [qid]: a })), []);
  const onToggleMarkQ = useCallback((qid: string) => setMarked((prev) => ({ ...prev, [qid]: !prev[qid] })), []);
  const onClearEvidenceQ = useCallback(
    (qid: string) =>
      setEvidenceMarks((prev) => {
        const next = { ...prev };
        delete next[qid];
        return next;
      }),
    [],
  );

  const articleHighlights = useMemo(
    () => highlights.filter((h) => h.articleId === article?.id),
    [highlights, article?.id],
  );
  const articleNotes = useMemo(() => notes.filter((n) => n.articleId === article?.id), [notes, article?.id]);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  // Restore previous attempt if opened with ?review=sessionId
  useEffect(() => {
    if (review) {
      const s = useStudyStore.getState().sessions.find((x) => x.id === review || x.articleId === id);
      if (s) {
        const restoredAnswers: Record<string, string> = {};
        const graded: Record<string, boolean> = {};
        for (const att of s.attempts) {
          if (att.userAnswer) restoredAnswers[att.questionId] = att.userAnswer;
          graded[att.questionId] = att.isCorrect;
        }
        setAnswers(restoredAnswers);
        setGradedMap(graded);
        setLastScore({ correct: s.rawScore, total: s.total, band: s.estimatedBand });
        setIsReviewMode(true);
      }
    }
  }, [review, id]);

  useEffect(() => {
    if (!article?.bodyText) return;
    const body = article.bodyText;
    const defer = setTimeout(() => {
      const lemmas = [...new Set((body.toLowerCase().match(/[a-z]{4,}/g) ?? []).slice(0, 400))].map(lemmatize);
      markSeen(lemmas);
    }, 0);
    return () => clearTimeout(defer);
  }, [article?.id, article?.bodyText, markSeen]);

  useEffect(() => {
    if (!article || !isReadable(article)) return;
    if (mode === 'mixed') {
      void mixedSet(article);
      return;
    }
    void ensureSet(article, requestedTypes ? { types: requestedTypes } : {});
  }, [article, ensureSet, mixedSet, mode, requestedTypes]);

  useEffect(() => {
    return () => {
      Speech.stop();
      const minutes = Math.round((Date.now() - startedAt.current) / 60000);
      if (minutes > 0) logStudyTime('reading_library', minutes);
    };
  }, [logStudyTime]);

  function applyHighlight(paragraphIndex: number, rawStart: number, rawEnd: number) {
    if (!article) return;
    const text = article.paragraphs[paragraphIndex];
    if (!text) return;
    const { start, end } = snapToWords(text, rawStart, rawEnd);
    if (end - start < 2) return;
    const mine = articleHighlights.filter((h) => h.paragraphIndex === paragraphIndex);
    for (const r of highlightRanges(text, mine)) {
      if (r.start < end && start < r.end) removeHighlight(r.id);
    }
    addHighlight({
      articleId: article.id,
      paragraphIndex,
      text: text.slice(start, end),
      start,
      color: highlightColor,
      note: null,
      evidenceForQuestionId: null,
    });
  }

  function highlightDomSelection() {
    if (Platform.OS !== 'web' || typeof document === 'undefined' || !article) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
    const range = sel.getRangeAt(0);
    const paras = Array.from(document.querySelectorAll(`#${PASSAGE_CONTAINER_ID} [data-para]`)) as HTMLElement[];
    for (const el of paras) {
      if (!range.intersectsNode(el)) continue;
      const index = Number(el.dataset.para);
      const offsetOf = (node: Node, offset: number) => {
        const r = document.createRange();
        r.selectNodeContents(el);
        r.setEnd(node, offset);
        return r.toString().length;
      };
      const start = el.contains(range.startContainer) ? offsetOf(range.startContainer, range.startOffset) : 0;
      const end = el.contains(range.endContainer) ? offsetOf(range.endContainer, range.endOffset) : (el.textContent ?? '').length;
      applyHighlight(index, start, end);
    }
    sel.removeAllRanges();
  }

  const handleWordPress = (word: string, sentence: string, paragraphIndex: number) => {
    setSheet({ word, sentence, paragraphIndex, mode: 'word' });
  };

  const handlePhraseToken = (paragraphIndex: number, tokenIndex: number, token: string) => {
    if (!article) return;
    if (!phraseAnchor || phraseAnchor.paragraphIndex !== paragraphIndex) {
      setPhraseAnchor({ paragraphIndex, tokenIndex, word: token });
      return;
    }

    const paragraph = article.paragraphs[paragraphIndex] ?? '';
    const start = paragraph.indexOf(phraseAnchor.word);
    const endWordPos = paragraph.indexOf(token, start);
    const phrase =
      start >= 0 && endWordPos >= 0
        ? paragraph.slice(start, endWordPos + token.length)
        : `${phraseAnchor.word} ${token}`;

    if (evidenceFor) {
      const startOffset = start >= 0 ? start : 0;
      setEvidenceMarks((prev) => ({
        ...prev,
        [evidenceFor]: {
          paragraphIndex,
          phrase,
          startOffset,
          endOffset: startOffset + phrase.length,
        },
      }));
      setEvidenceFor(null);
      setPhraseAnchor(null);
      setPhraseMode(false);
      return;
    }

    setSheet({
      word: phrase,
      sentence: sentenceAround(paragraph, start >= 0 ? start : 0),
      paragraphIndex,
      mode: 'phrase',
    });
    setPhraseAnchor(null);
    setPhraseMode(false);
  };

  useEffect(() => {
    passageHandlers.current = {
      word: handleWordPress,
      longPress: (sentence, paragraphIndex) => setSheet({ word: sentence, sentence, paragraphIndex, mode: 'sentence' }),
      phrase: handlePhraseToken,
      range: applyHighlight,
    };
  });

  useTextSelection(
    PASSAGE_CONTAINER_ID,
    (selected) => {
      if (!article) return;
      if (tool === 'highlight') {
        highlightDomSelection();
        return;
      }

      const paragraphIndex = article.paragraphs.findIndex((p) => p.includes(selected));
      const paragraph = paragraphIndex === -1 ? undefined : article.paragraphs[paragraphIndex];

      setSheet({
        word: selected,
        sentence: paragraph ? sentenceAround(paragraph, paragraph.indexOf(selected)) : selected,
        paragraphIndex: paragraphIndex === -1 ? 0 : paragraphIndex,
        mode: selectionMode(selected),
      });
    },
    tool !== 'read',
  );

  if (!meta) {
    return (
      <View className="flex-1 items-center justify-center bg-white p-6">
        <Text className="text-base font-bold text-gray-900">{L('Không tìm thấy bài đọc.', 'Passage not found.')}</Text>
        <Button label={L('Về Library', 'Back to Library')} className="mt-4" onPress={() => router.push('/library' as never)} />
      </View>
    );
  }

  if (!isReadable(meta)) {
    return (
      <View className="flex-1 items-center justify-center bg-white p-6">
        <Card className="max-w-[520px]">
          <Badge label={L('Link đề chính thức', 'Official test link')} tone="warning" />
          <Text className="mt-3 font-bold text-base text-gray-900">{meta.title}</Text>
          <Text className="mt-2 text-sm text-gray-600">{meta.summary}</Text>
          <Button
            label={L('Mở link gốc', 'Open original link')}
            iconRight="arrow-right"
            className="mt-4"
            onPress={() => void WebBrowser.openBrowserAsync(meta.sourceUrl)}
          />
        </Card>
      </View>
    );
  }

  if (!article) {
    return (
      <View className="flex-1 items-center justify-center bg-white p-6">
        <Card className="max-w-[520px]">
          <Text className="font-bold text-base text-gray-900">{meta.title}</Text>
          <Text className="mt-2 text-sm text-gray-500">
            {L('Không nạp được toàn văn của bài này.', 'Could not load the full text of this passage.')}
          </Text>
          <Button label={L('Về Library', 'Back to Library')} className="mt-4" onPress={() => router.push('/library' as never)} />
        </Card>
      </View>
    );
  }

  const questions = questionSet?.questions ?? [];
  const answeredCount = questions.filter((q) => Boolean(answers[q.id])).length;
  const blocks = useMemo(() => groupIntoBlocks(questions), [questions]);

  // Current active question
  const currentQuestion = questions[activeQ - 1];

  // Auto-scroll passage to evidence when in review mode
  useEffect(() => {
    if (isReviewMode && locateEvidence && currentQuestion) {
      const pIdx = currentQuestion.evidenceParagraphIndex;
      if (pIdx !== undefined && Platform.OS === 'web' && typeof document !== 'undefined') {
        const el = document.getElementById(`passage-para-${pIdx}`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [activeQ, isReviewMode, locateEvidence, currentQuestion]);

  const speakParagraph = (index: number) => {
    const paragraph = article.paragraphs[index];
    if (!paragraph) return;

    Speech.stop();
    setSpeakingParagraph(index);
    Speech.speak(paragraph, {
      language: 'en-US',
      voice: englishVoice(),
      rate: ttsRate,
      onDone: () => setSpeakingParagraph(null),
      onStopped: () => setSpeakingParagraph(null),
    });
  };

  const pickTool = (next: ReaderTool) => {
    setTool((cur) => (cur === next && next !== 'read' ? 'read' : next));
    if (!evidenceFor) {
      setPhraseMode(false);
      setPhraseAnchor(null);
    }
  };

  const submit = () => {
    if (done || submitting) return;
    setSubmitting(true);
    setDone(true);
    draft.clear();

    const graded = gradeQuestions(questions, answers);
    setGradedMap(graded);

    const attempts: AttemptRecord[] = questions.map((q) => {
      const userAnswer = answers[q.id]?.trim() ?? '';
      return {
        questionId: q.id,
        type: q.type,
        userAnswer: userAnswer || null,
        correctAnswer: q.correctAnswer,
        isCorrect: graded[q.id] ?? false,
        timeSpentMs: 0,
        markedForReview: Boolean(marked[q.id]),
        evidenceMark: evidenceMarks[q.id],
      };
    });

    const observedAt = new Date().toISOString();
    for (const q of questions) {
      const skillKey = readingSkillFor(q.type);
      if (skillKey === null) continue;
      const mark = evidenceMarks[q.id];
      const truthIndex = q.evidenceParagraphIndex;

      observeSkill({
        skill: { domain: 'reading', key: skillKey },
        sourceId: article.id,
        answerCorrect: graded[q.id] ?? false,
        pointer: mark ? { kind: 'paragraph', index: mark.paragraphIndex } : null,
        truth: Number.isInteger(truthIndex) ? { kind: 'paragraph', index: truthIndex } : null,
        at: observedAt,
      });
    }

    const correct = attempts.filter((a) => a.isCorrect).length;
    const durationMs = Date.now() - startedAt.current;
    useGameStore.getState().awardBatch(correct, attempts.length, 'read', `read:${article.id}`);

    const band = article.exam === 'sat' ? null : rawScoreToBand(correct, attempts.length);

    addSession({
      articleId: article.id,
      articleTitle: article.title,
      exam: article.exam,
      mode: from ? 'mock_test' : 'practice',
      mockKey: from || undefined,
      rawScore: correct,
      total: attempts.length,
      accuracy: attempts.length === 0 ? 0 : Math.round((correct / attempts.length) * 100),
      estimatedBand: band,
      durationMs,
      attempts,
    });

    setProgress(article.id, 100, article.paragraphs.length - 1);

    const minutes = durationMs / 60000;
    if (minutes > 0 && article.wordCount) {
      const wpm = article.wordCount / minutes;
      if (wpm >= 60 && wpm <= 600) logWpm(wpm);
    }

    setSubmitting(false);

    // Enter review mode side-by-side
    setLastScore({ correct, total: attempts.length, band });
    setScoreModalVisible(true);
    setIsReviewMode(true);
    setActiveQ(1);
  };

  const lay = examLayout(winW, winH);
  const split = lay.split;

  const cycleSize = () => {
    const next = SIZE_STEPS.find((s) => s > fontScale + 0.01);
    setFontScale(next ?? SIZE_STEPS[0]);
  };

  const finish = () => {
    const left = questions.length - answeredCount;
    if (left <= 0) {
      submit();
      return;
    }
    const msg = L(`Còn ${left} câu chưa trả lời. Vẫn nộp bài?`, `${left} question(s) unanswered. Submit anyway?`);
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(msg)) submit();
      return;
    }
    Alert.alert(L('Nộp bài', 'Submit'), msg, [
      { text: L('Làm tiếp', 'Keep going'), style: 'cancel' },
      { text: L('Nộp bài', 'Submit'), onPress: submit },
    ]);
  };

  const jumpTo = (n: number) => {
    setActiveQ(n);
    if (!split) setNarrowTab('questions');

    setTimeout(() => {
      const y = panelRef.current?.positionOf(n);
      if (y !== null && y !== undefined) {
        qScroll.current?.scrollTo({ y: Math.max(0, y - 24), animated: true });
      }
    }, split ? 0 : 60);

    if (isReviewMode && locateEvidence) {
      const q = questions[n - 1];
      if (q && q.evidenceParagraphIndex !== undefined && Platform.OS === 'web' && typeof document !== 'undefined') {
        const el = document.getElementById(`passage-para-${q.evidenceParagraphIndex}`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  // Block Navigation (Screenshot 1: 7-13 ->)
  const currentBlockIndex = blocks.findIndex((b) => activeQ >= b.from && activeQ <= b.to);
  const currentBlock = blocks[currentBlockIndex >= 0 ? currentBlockIndex : 0];
  const prevBlock = currentBlockIndex > 0 ? blocks[currentBlockIndex - 1] : undefined;
  const nextBlock = currentBlockIndex >= 0 && currentBlockIndex < blocks.length - 1 ? blocks[currentBlockIndex + 1] : undefined;

  const handlePrevNav = () => {
    if (isReviewMode) {
      jumpTo(Math.max(1, activeQ - 1));
    } else if (prevBlock) {
      jumpTo(prevBlock.from);
    }
  };

  const handleNextNav = () => {
    if (isReviewMode) {
      jumpTo(Math.min(questions.length, activeQ + 1));
    } else if (nextBlock) {
      jumpTo(nextBlock.from);
    } else {
      finish();
    }
  };

  const navItems: QuestionNavItem[] = useMemo(() => {
    return questions.map((q, i) => ({
      id: q.id,
      number: i + 1,
      answered: Boolean(answers[q.id]?.trim()),
      marked: Boolean(marked[q.id]),
      isCorrect: isReviewMode ? Boolean(gradedMap[q.id]) : undefined,
    }));
  }, [questions, answers, marked, isReviewMode, gradedMap]);

  /* -------------------------------- PASSAGE PANE -------------------------------- */
  const passagePane = (
    <View className="flex-1 bg-white border-r border-gray-200">
      {/* Optional toolbar toggle */}
      {showToolbar ? (
        <IeltsPassageToolbar
          tool={tool}
          onPickTool={pickTool}
          onNotes={() => setNotesOpen((o) => !o)}
          notesOpen={notesOpen}
          highlightColorDot={highlightColor === 'yellow' ? '#FDE047' : highlightColor === 'green' ? '#86EFAC' : '#FCA5A5'}
          hasHighlights={articleHighlights.length > 0}
          onClearHighlights={() => clearHighlights(article.id)}
        />
      ) : null}

      {/* Passage Scrollable Body */}
      <ScrollView
        ref={pScroll}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 32, paddingTop: 24, paddingBottom: 64 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="w-full">
          {/* Article Title (Sans-serif bold, exact like Image 1) */}
          <Text className="text-[19px] font-bold text-gray-900 mb-3 tracking-tight">
            {article.title}
          </Text>

          {/* Passage View (Sans-serif font, line-height 1.65) */}
          <View className="mt-1">
            <PassageView
              translations={bilingual.on ? bilingual.paragraphs : null}
              paragraphs={article.paragraphs}
              fontScale={fontScale}
              textColor="#1F2937"
              highlights={articleHighlights}
              statusOf={statusOf}
              onWordPress={onWord}
              onSentenceLongPress={onLongPress}
              phraseMode={phraseMode}
              phraseAnchor={phraseAnchor}
              onPhraseToken={onPhrase}
              speakingParagraph={speakingParagraph}
              tool={tool}
              onHighlightRange={onRange}
              onHighlightPress={removeHighlight}
              letters={article.exam !== 'sat' && article.paragraphs.length > 2}
              baseSize={13.5}
              activeEvidence={
                isReviewMode && locateEvidence && currentQuestion
                  ? {
                      paragraphIndex: currentQuestion.evidenceParagraphIndex,
                      text: currentQuestion.evidenceText,
                      questionNumber: activeQ,
                    }
                  : null
              }
            />
          </View>

          {article.attribution ? (
            <Text className="mt-8 text-xs italic text-gray-400">
              {article.attribution}
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );

  /* -------------------------------- QUESTIONS PANE -------------------------------- */
  const questionsPane = (
    <View className="flex-1 bg-white">
      <ScrollView
        ref={qScroll}
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 24,
          paddingBottom: 64 + keyboardInset,
        }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        {loadingQuestions && questions.length === 0 ? (
          <View className="items-center py-16">
            <ActivityIndicator color="#DC2626" size="large" />
            <Text className="mt-3 text-sm font-semibold text-gray-500">
              Đang tải bộ câu hỏi IELTS…
            </Text>
          </View>
        ) : (
          <QuestionPanel
            ref={panelRef}
            questions={questions}
            layout={mode === 'mixed' ? 'mixed' : 'blocks'}
            answers={answers}
            marked={marked}
            activeNumber={activeQ}
            onActivate={jumpTo}
            onAnswer={onAnswerQ}
            onToggleMark={onToggleMarkQ}
            isReviewMode={isReviewMode}
            gradedResults={gradedMap}
            paragraphs={article.paragraphs}
            locateEvidence={locateEvidence}
            onToggleLocateEvidence={setLocateEvidence}
          />
        )}
      </ScrollView>
    </View>
  );

  /* -------------------------------- MOBILE TABS -------------------------------- */
  const narrowTabs = (
    <View className="flex-row gap-2 p-1 rounded-xl bg-gray-100 mx-3 mt-2 border border-gray-200">
      {(['passage', 'questions'] as const).map((t) => (
        <Pressable
          key={t}
          accessibilityRole="tab"
          aria-selected={narrowTab === t}
          onPress={() => setNarrowTab(t)}
          className={`flex-1 h-8 rounded-lg items-center justify-center ${
            narrowTab === t ? 'bg-white shadow-2xs' : ''
          }`}
        >
          <Text
            className={`text-xs font-bold ${
              narrowTab === t ? 'text-gray-900' : 'text-gray-500'
            }`}
          >
            {t === 'passage'
              ? 'Bài đọc'
              : `Câu hỏi ${questions.length ? `(${answeredCount}/${questions.length})` : ''}`}
          </Text>
        </Pressable>
      ))}
    </View>
  );

  return (
    <View className="flex-1 bg-white">
      {/* 1. Header (IELTS Top Bar - exactly matching screenshot) */}
      <IeltsExamHeader
        title={article.title}
        subtitle="Làm bài passage 1"
        onExit={() => {
          if (isReviewMode) {
            router.push('/practice' as never);
          } else {
            finish();
          }
        }}
        timerSlot={
          isReviewMode ? null : runEnd !== undefined ? (
            <ExamClock endAt={runEnd} onExpire={() => submit()} />
          ) : (
            <ExamClock paused={paused} onToggle={() => setPaused((p) => !p)} />
          )
        }
        onCycleSize={cycleSize}
        isReviewMode={isReviewMode}
        scoreText={
          lastScore
            ? `${lastScore.correct}/${lastScore.total} Đúng ${lastScore.band ? '· Band ' + lastScore.band : ''}`
            : undefined
        }
        onToggleFlag={() => setShowToolbar((v) => !v)}
        isFlagged={showToolbar}
      />

      {/* 2. Split Screen / Responsive Body */}
      <View className="flex-1 min-h-0">
        {split ? (
          <SplitPane
            left={passagePane}
            right={questionsPane}
          />
        ) : (
          <View className="flex-1 min-h-0">
            {narrowTabs}
            <CrossFade swapKey={`tab-${narrowTab}`} style={{ flex: 1, minHeight: 0 }}>
              {narrowTab === 'passage' ? passagePane : questionsPane}
            </CrossFade>
          </View>
        )}
      </View>

      {/* 3. Bottom Bar (Image 1, 2, 4) */}
      <IeltsBottomBar
        items={navItems}
        activeNumber={activeQ}
        onSelectNumber={jumpTo}
        isReviewMode={isReviewMode}
        passageTitle="Passage 1"
        totalScore={lastScore ? { correct: lastScore.correct, total: lastScore.total } : undefined}
        onPrev={handlePrevNav}
        onNext={handleNextNav}
        onSubmit={finish}
        submitting={submitting}
        hasPrev={isReviewMode ? activeQ > 1 : Boolean(prevBlock)}
        hasNext={isReviewMode ? activeQ < questions.length : true}
        nextLabel={
          isReviewMode
            ? 'Tiếp'
            : nextBlock
              ? `${nextBlock.from} - ${nextBlock.to} →`
              : 'Nộp bài'
        }
        prevLabel={
          isReviewMode
            ? 'Trước'
            : prevBlock
              ? `← ${prevBlock.from} - ${prevBlock.to}`
              : undefined
        }
        onShowSummary={() => {
          if (isReviewMode && lastScore) {
            setScoreModalVisible(true);
          }
        }}
      />

      {/* 4. Score Result Modal */}
      <IeltsScoreModal
        visible={scoreModalVisible}
        score={lastScore?.correct ?? 0}
        total={lastScore?.total ?? questions.length}
        estimatedBand={lastScore?.band ?? null}
        onReviewDetail={() => setScoreModalVisible(false)}
        onRetake={() => {
          setScoreModalVisible(false);
          setIsReviewMode(false);
          setAnswers({});
          setGradedMap({});
          setDone(false);
          setActiveQ(1);
        }}
        onClose={() => setScoreModalVisible(false)}
      />

      {/* Notes & Word sheet */}
      {notesOpen ? (
        <NotesPanel
          notes={articleNotes}
          onClose={() => setNotesOpen(false)}
          onRemove={removeNote}
          onAdd={(body) => addNote({ articleId: article.id, articleTitle: article.title, paragraphIndex: null, body })}
        />
      ) : null}

      <WordSheet target={sheet} articleId={article.id} articleTitle={article.title} onClose={() => setSheet(null)} />
      <ChatPanel articleId={article.id} visible={chatOpen} onClose={() => setChatOpen(false)} />
    </View>
  );
}

function selectionMode(selected: string): WordSheetTarget['mode'] {
  const words = selected.trim().split(/\s+/).length;
  if (words === 1) return 'word';
  if (words > 8 || /[.!?]/.test(selected.slice(0, -1))) return 'sentence';
  return 'phrase';
}

const SIZE_STEPS = [0.9, 1, 1.15, 1.3] as const;
