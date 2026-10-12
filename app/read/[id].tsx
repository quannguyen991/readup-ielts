import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import type { QuestionType } from '@/types/database';
import * as Speech from 'expo-speech';
import { englishVoice } from '@/services/audio/voice';
import * as WebBrowser from 'expo-web-browser';

import { PASSAGE_CONTAINER_ID, PassageView, sentenceAround, highlightRanges, snapToWords, type ReaderTool } from '@/components/reader/PassageView';
import { QuestionPanel, type QuestionPanelHandle } from '@/components/reader/QuestionPanel';
import { ExamTopBar, FloatingTools, QuestionNav, SplitPane, ToolRail } from '@/components/reader/exam/ExamChrome';
import { NotesPanel, SettingsPanel } from '@/components/reader/exam/ExamPanels';
import { EXAM, PAPER_THEMES } from '@/components/reader/exam/exam-theme';
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

/**
 * Màn luyện Reading — bố cục PHÒNG THI.
 *
 * Thanh trên kiểu đề thi máy: dải số câu (đã làm tô đen, đánh dấu có chấm vàng),
 * màu giấy, mặt chữ, cỡ chữ, toàn màn hình, đồng hồ, nút "Kiểm Tra". Dưới là hai
 * tấm giấy viền mực đặt cạnh nhau, MỖI TẤM CUỘN RIÊNG: bài đọc bên trái, câu hỏi
 * bên phải — người làm bài cuộn bài đi tìm bằng chứng mà câu hỏi vẫn đứng yên.
 *
 * Khác màn đọc báo song ngữ (tờ báo, không viền, không đồng hồ): ở đây người học
 * đang LÀM ĐỀ, nên mọi thứ nhắc tới thời gian và số câu còn lại đều nằm trong tầm mắt.
 *
 * Màn hẹp chỉ đủ một tấm, nên thanh trên có thêm hai thẻ Bài đọc / Câu hỏi; bấm
 * "khoanh bằng chứng" ở câu hỏi thì tự chuyển sang thẻ Bài đọc.
 */
export default function ReadScreen() {
  // `from`: hub Mock Test gọi sang. Có nó thì bài này là một passage của thi thử.
  const { id, types, mode, from } = useLocalSearchParams<{ id: string; types?: string; mode?: string; from?: string }>();
  const { L, en } = useL();

  /*
    Đơn hàng dạng câu đến từ bộ lọc ở màn Luyện tập, đi qua URL.

    Đi qua URL chứ không qua một store dùng chung: bộ lọc là ý muốn cho LẦN MỞ
    BÀI NÀY, không phải thiết lập vĩnh viễn của người dùng. Để trong store thì
    một lần lọc hôm nay sẽ âm thầm đổi mọi bài đọc tuần sau mà không ai nhớ vì sao.
  */
  const requestedTypes = useMemo(
    () => (types ? (types.split(',').filter(Boolean) as QuestionType[]) : undefined),
    [types],
  );
  const userArticle = useUserArticleStore((s) => (id ? s.articles[id] : undefined));

  // Bài tự dán không nằm trong seed nên phải tra cả hai nguồn.
  const meta = useMemo<ArticleMeta | undefined>(
    () => (id ? getArticleById(id) : undefined) ?? userArticle,
    [id, userArticle],
  );

  // Toàn văn nằm trong bodies/chunk-NN.json, nạp lười — chỉ lấy khi bài thật
  // sự đọc được. Bài chỉ tiêu đề không có chunk nào để nạp.
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
  // Cờ "đang tải" đọc THẲNG từ store chứ không giữ một bản sao cục bộ. Store là
  // nơi thật sự biết bộ đề của bài này đang được lấy hay không (nó đặt cờ ngay
  // trong `ensureSet`, kèm cả hạn chờ); giữ thêm một `useState` ở đây chỉ là bản
  // sao chép tay, và cứ mỗi lần mở bài lại tốn một lượt render để bật nó lên.
  const loadingQuestions = useQuestionStore((s) => (id ? (s.loading[id] ?? false) : false));
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [marked, setMarked] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [sheet, setSheet] = useState<WordSheetTarget | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [highlightColor, setHighlightColor] = useState<HighlightColorKey>('yellow');
  const [phraseMode, setPhraseMode] = useState(false);
  /**
   * Công cụ đang bật. Mặc định 'read': chạm vào bài không làm gì, như đề thật.
   * Thẻ dịch chỉ bật ở 'vocab'; tô màu chỉ ở 'highlight' (người dùng chốt 26/09/2026).
   */
  const [tool, setTool] = useState<ReaderTool>('read');
  const [phraseAnchor, setPhraseAnchor] = useState<{
    paragraphIndex: number;
    tokenIndex: number;
    word: string;
  } | null>(null);
  /*
    PROOFLOOP — bằng chứng người học tự khoanh cho từng câu.

    Đây là vế thứ hai của phép so ở `services/proofloop/state.ts`; vế thứ nhất
    (`evidenceParagraphIndex`) đã nằm sẵn trong mọi bộ đề. Không có vế này thì
    đáp án đúng và đoán trúng nhìn giống hệt nhau.

    Dùng lại chế độ chọn cụm có sẵn: khi `evidenceFor` khác null, lần chạm hai
    đầu cụm tiếp theo ghi vào đây thay vì mở thẻ nghĩa.
  */
  const [evidenceMarks, setEvidenceMarks] = useState<Record<string, EvidenceMark>>({});
  const [evidenceFor, setEvidenceFor] = useState<string | null>(null);

  const [speakingParagraph, setSpeakingParagraph] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);

  // Bố cục phòng thi: màu giấy, mặt chữ, thẻ bài/câu hỏi trên màn hẹp.
  const { width: winW, height: winH } = useWindowDimensions();
  const [paperKey, setPaperKey] = useState<string>('white');
  const [fontKey, setFontKey] = useState<string>('serif');
  const [narrowTab, setNarrowTab] = useState<'passage' | 'questions'>('passage');
  const [notesOpen, setNotesOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  /** Số câu (từ 1) đang là câu hiện tại — dải số câu và huy hiệu tô nổi nó. */
  const [activeQ, setActiveQ] = useState(1);
  const qScroll = useRef<ScrollView>(null);
  const panelRef = useRef<QuestionPanelHandle>(null);
  useReadingFonts();

  // Mốc đặt trong effect, không phải trong `useRef(Date.now())`: đối số của useRef
  // được tính ngay trong lúc render. Mốc này chỉ đọc ở handler nên đặt muộn một
  // nhịp không ảnh hưởng gì, mà lại đúng hơn — nó là lúc bài đọc thật sự hiện ra.
  const startedAt = useRef(0);

  /*
    ĐIỆN THOẠI: chặn kéo-để-tải-lại, tự lưu nháp đáp án, hỏi lại trước khi thoát.
    Nháp lưu 500ms sau lần đổi cuối (không ghi theo từng phím) và ghi ngay khi
    ẩn tab / đóng trang — vuốt nhầm quay lại hay hệ điều hành dọn tab nền không
    còn làm mất bài đang làm dở.
  */
  useExamWebTweaks();
  const keyboardInset = useKeyboardInset();
  const [done, setDone] = useState(false);
  const draftState = useMemo(() => ({ answers, marked }), [answers, marked]);
  const onRestoreDraft = useCallback((d: { answers: Record<string, string>; marked: Record<string, boolean> }) => {
    setAnswers((prev) => (Object.keys(prev).length ? prev : d.answers));
    setMarked((prev) => (Object.keys(prev).length ? prev : d.marked));
  }, []);
  const draft = useExamDraft('read', id, draftState, !done, onRestoreDraft);
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
  useLeaveGuard(hasAnswers && !done, askLeave);
  // Các hàm truyền xuống bài đọc phải ĐỨNG YÊN giữa các lượt render, để việc chọn
  // một đáp án không bắt hàng trăm ô chữ của bài dựng lại (PassageView là memo).
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

  // Đánh dấu các từ trong bài là "đã gặp" để lần sau tô nhạt sẵn.
  //
  // Hoãn một nhịp chứ không chạy thẳng trong effect. Hai lý do, và cả hai đều là
  // lý do thật chứ không phải để chiều lint: (1) đây là ghi vào store từ vựng
  // ngay giữa lượt commit của màn đọc, kéo theo một lượt render nữa trước khi
  // người đọc kịp thấy chữ nào; (2) việc tách 400 từ rồi tra nguyên thể là phần
  // tính toán nặng nhất lúc mở bài, mà nó KHÔNG cần xong trước khi bài hiện ra.
  useEffect(() => {
    if (!article?.bodyText) return;
    const body = article.bodyText;
    const defer = setTimeout(() => {
      const lemmas = [...new Set((body.toLowerCase().match(/[a-z]{4,}/g) ?? []).slice(0, 400))].map(
        lemmatize,
      );
      markSeen(lemmas);
    }, 0);
    return () => clearTimeout(defer);
  }, [article?.id, article?.bodyText, markSeen]);

  useEffect(() => {
    if (!article || !isReadable(article)) return;
    /*
      `mode=mixed` là nhánh LUYỆN XEN KẼ DẠNG BÀI.

      Bộ đề thường đi thành khối như đề thật. Nhánh này cố tình trộn dạng, vì lúc
      mới học thì nhận ra mình đang gặp dạng gì cũng là một kỹ năng, mà khối đề
      đồng nhất che mất nó.
    */
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

  /** Tô đoạn [start, end) của một đoạn văn: nới cho trọn từ, vệt mới thay vệt cũ chồng lên nó. */
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

  /**
   * Kéo bôi ở chế độ highlight: đọc vùng bôi của trình duyệt, quy ra vị trí ký
   * tự trong TỪNG đoạn văn nó đi qua (bôi vắt hai đoạn thì tô cả hai), rồi xoá
   * vùng bôi để vệt màu hiện ra ngay — không để lớp bôi xanh của trình duyệt che.
   */
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

    // Đang khoanh bằng chứng thì ghi vào đó, KHÔNG mở thẻ nghĩa: người học đang
    // trả lời câu hỏi, mở thẻ nghĩa lúc này là cắt ngang việc họ đang làm.
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

  /**
   * Bôi đen bất kỳ chỗ nào trong bài → mở luôn thẻ nghĩa cho đúng cụm đó, kèm
   * nguyên câu chứa nó làm ngữ cảnh. Không phải bật chế độ gì trước.
   *
   * Gọi ở đây, trước mấy nhánh return sớm bên dưới, vì hook không được nằm sau
   * điều kiện. `article` chưa nạp xong thì bỏ qua.
   */
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
      // Bôi vắt qua hai đoạn thì không quy về đoạn nào được; ghi đoạn đầu để
      // phần "Lưu từ" vẫn có chỗ neo.
      paragraphIndex: paragraphIndex === -1 ? 0 : paragraphIndex,
      mode: selectionMode(selected),
    });
    },
    tool !== 'read',
  );

  /*
    Phím tắt H / N / T như đề thi máy: Highlight, Notes, Tra từ. Bỏ qua khi đang
    gõ vào ô nhập (ô điền đáp án, ô ghi chú) hoặc có phím bổ trợ.
  */
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;
      const k = e.key.toLowerCase();
      const flip = (next: ReaderTool) => {
        setTool((cur) => (cur === next ? 'read' : next));
        if (!evidenceFor) {
          setPhraseMode(false);
          setPhraseAnchor(null);
        }
      };
      if (k === 'h') flip('highlight');
      else if (k === 't') flip('vocab');
      else if (k === 'n') {
        setNotesOpen((o) => !o);
        setSettingsOpen(false);
      } else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [evidenceFor]);

  if (!meta) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas p-6">
        <Text className="font-strong text-cardTitle text-ink">{L('Không tìm thấy bài đọc.', 'Passage not found.')}</Text>
        <Button label={L('Về Library', 'Back to Library')} className="mt-4" onPress={() => router.push('/library' as never)} />
      </View>
    );
  }

  if (!isReadable(meta)) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas p-6">
        <Card className="max-w-[520px]">
          <Badge label={L('Link đề chính thức', 'Official test link')} tone="warning" />
          <Text className="mt-3 font-strong text-sectionTitle text-ink">{meta.title}</Text>
          <Text className="mt-2 font-sans text-body text-muted">{meta.summary}</Text>
          <Text className="mt-3 font-sans text-label text-subtle">
            {L(
              `Bài từ nguồn có bản quyền (${meta.sourceName}) nên app không lưu toàn văn. Bấm để đọc trên trang gốc.`,
              `This passage is copyrighted (${meta.sourceName}), so the app doesn't store the full text. Tap to read it on the original site.`,
            )}
          </Text>
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

  // Metadata có nhưng không nạp được toàn văn: file chunk thiếu hoặc hỏng.
  // Báo rõ thay vì render một bài rỗng.
  if (!article) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas p-6">
        <Card className="max-w-[520px]">
          <Text className="font-strong text-sectionTitle text-ink">{meta.title}</Text>
          <Text className="mt-2 font-sans text-body text-muted">
            {L(
              'Không nạp được toàn văn của bài này. Chạy lại `npm run ingest` để dựng lại kho bài.',
              'Could not load the full text of this passage. Run `npm run ingest` again to rebuild the library.',
            )}
          </Text>
          <Button
            label={L('Về Library', 'Back to Library')}
            className="mt-4"
            onPress={() => router.push('/library' as never)}
          />
        </Card>
      </View>
    );
  }

  const questions = questionSet?.questions ?? [];
  const answeredCount = questions.filter((q) => Boolean(answers[q.id])).length;

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
    // Đổi công cụ thì bỏ dở việc chọn cụm — trừ khi đang khoanh bằng chứng cho một câu hỏi.
    if (!evidenceFor) {
      setPhraseMode(false);
      setPhraseAnchor(null);
    }
  };

  const submit = () => {
    setSubmitting(true);
    setDone(true);
    draft.clear();

    // Chấm cả bộ một lượt: dạng gõ chữ theo bộ chuẩn hoá của Listening + giới hạn số
    // từ, nhóm "Choose TWO" theo tập đáp án.
    const graded = gradeQuestions(questions, answers);

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
        // `undefined` khi người học không khoanh gì: KHÔNG ĐO, khác với đo rồi
        // thấy sai. Đừng thay bằng `null` cho gọn — hai thứ đó dẫn tới hai
        // trạng thái khác nhau ở tầng phân loại.
        evidenceMark: evidenceMarks[q.id],
      };
    });

    /*
      Gửi từng câu lên SỔ BẰNG CHỨNG.

      Trước đây màn này khoanh bằng chứng, tính trạng thái và hiện huy hiệu — rồi
      dừng ở đó. Không có gì chảy lên `services/mastery`, nên trang Sổ bằng chứng
      trống trơn với người chỉ luyện Reading, màn giáo viên không bao giờ thấy khó
      khăn Reading của lớp, và phiên 1 của giao thức chạy thử ("Reading with
      evidence marking → baseline ledger") không sinh nổi một dòng dữ liệu.

      `sourceId` là id bài đọc, và phải đúng là nó: điều kiện chuyển giao so hai
      `sourceId` với nhau, nên đặt bừa một chuỗi mới mỗi lượt sẽ khiến mọi phép
      thử đều "đạt chuyển giao" và cả cơ chế mất nghĩa.
    */
    const observedAt = new Date().toISOString();
    for (const q of questions) {
      const skillKey = readingSkillFor(q.type);
      // Ngữ pháp thuần không có "đoạn đỡ đáp án" nên không vào sổ. Xem reading-skill.ts.
      if (skillKey === null) continue;

      const mark = evidenceMarks[q.id];
      const truthIndex = q.evidenceParagraphIndex;

      observeSkill({
        skill: { domain: 'reading', key: skillKey },
        sourceId: article.id,
        answerCorrect: graded[q.id] ?? false,
        pointer: mark ? { kind: 'paragraph', index: mark.paragraphIndex } : null,
        // Bộ đề cũ có câu không kèm đối chứng — `passage_tier` đã bỏ ràng buộc
        // not null. Không có đối chứng thì không so được, và bộ phân loại sẽ ghi
        // `unobserved` chứ không đoán bù.
        truth: Number.isInteger(truthIndex) ? { kind: 'paragraph', index: truthIndex } : null,
        at: observedAt,
      });
    }

    const correct = attempts.filter((a) => a.isCorrect).length;
    const durationMs = Date.now() - startedAt.current;
    // Mã = bài đọc: nộp lại cùng bài không cộng đá / ca lần nữa (Thành Phố Tri Thức).
    useGameStore.getState().awardBatch(correct, attempts.length, 'read', `read:${article.id}`);

    const sessionId = addSession({
      articleId: article.id,
      articleTitle: article.title,
      exam: article.exam,
      mode: from ? 'mock_test' : 'practice',
      mockKey: from || undefined,
      rawScore: correct,
      total: attempts.length,
      accuracy: attempts.length === 0 ? 0 : Math.round((correct / attempts.length) * 100),
      // Band là thang riêng của IELTS — bài SAT không quy đổi được.
      estimatedBand: article.exam === 'sat' ? null : rawScoreToBand(correct, attempts.length),
      durationMs,
      attempts,
    });

    setProgress(article.id, 100, article.paragraphs.length - 1);

    /*
      Chỉ ghi tốc độ đọc khi con số CÓ THỂ LÀ THẬT.

      Ngưỡng cũ là 12 giây, nên ai mở bài rồi bấm nộp sớm sẽ tạo ra "1045
      từ/phút" và con số đó nằm lại trong trang Tiến độ như một thành tích. Người
      đọc nhanh nhất cũng chỉ quanh 400 từ/phút; ngoài khoảng 60–600 thì đó không
      phải tốc độ đọc, đó là nhiễu — và nhiễu thì đừng lưu, đừng hiện.

      `durationMs` tính cả thời gian trả lời câu hỏi nên nó vốn đã rộng tay; càng
      không có lý do chấp nhận thêm giá trị vô lý.
    */
    const minutes = durationMs / 60000;
    if (minutes > 0 && article.wordCount) {
      const wpm = article.wordCount / minutes;
      if (wpm >= 60 && wpm <= 600) logWpm(wpm);
    }

    setSubmitting(false);
    // Trong Mock Test thì về hub để làm phần kế tiếp; bài chấm xem lại được từ hub.
    if (from) router.replace(from as never);
    else router.push(`/review/${sessionId}` as never);
  };

  const lay = examLayout(winW, winH);
  const split = lay.split;
  const wide = lay.toolRail;
  const phone = winW < 700;
  const theme = PAPER_THEMES.find((t) => t.key === paperKey) ?? PAPER_THEMES[0]!;
  const passageFont = EXAM_FONTS.find((f) => f.key === fontKey) ?? EXAM_FONTS[0]!;
  const pad = wide ? 28 : phone ? 16 : 20;
  const allAnswered = questions.length > 0 && answeredCount >= questions.length;

  const toggleFullscreen = () => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen?.();
  };

  /** Nộp bài: còn câu bỏ trống thì hỏi lại một lần, như đề thi máy. */
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
    // Màn hẹp vừa đổi thẻ nên khung câu hỏi chưa kịp gắn; chờ một nhịp rồi cuộn.
    setTimeout(
      () => {
        const y = panelRef.current?.positionOf(n);
        if (y !== null && y !== undefined) qScroll.current?.scrollTo({ y: Math.max(0, y + pad - 12), animated: true });
      },
      split ? 0 : 60,
    );
  };

  const toggleNotes = () => {
    setNotesOpen((o) => !o);
    setSettingsOpen(false);
  };

  const toolRail = (
    <ToolRail
      row={false}
      tool={tool}
      notesOpen={notesOpen}
      onPick={pickTool}
      onNotes={toggleNotes}
      highlightColor={highlightColor}
      onHighlightColor={setHighlightColor}
      hasHighlights={articleHighlights.length > 0}
      onClearHighlights={() => clearHighlights(article.id)}
      phraseMode={phraseMode}
      onTogglePhrase={() => {
        setPhraseMode((p) => !p);
        setPhraseAnchor(null);
      }}
    />
  );

  const passagePane = (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: theme.bg }}>
      {wide ? toolRail : null}
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: pad, paddingTop: wide ? 22 : 14, paddingBottom: wide ? 48 : 150, alignItems: 'center' }}
      >
        <View style={{ width: '100%', maxWidth: 720 }}>
          <Text
            style={{
              textAlign: 'center',
              fontFamily: passageFont.title,
              fontWeight: '700',
              fontSize: Math.round(24 * fontScale),
              lineHeight: Math.round(32 * fontScale),
              color: theme.ink,
            }}
          >
            {article.title}
          </Text>

          {tool !== 'read' ? (
            <Text style={{ marginTop: 8, textAlign: 'center', fontSize: 14, color: theme.muted }}>
              {tool === 'highlight'
                ? L('Bôi chữ hoặc chạm một câu để tô · chạm vào vệt tô để xoá.', 'Select text or tap a sentence to highlight · tap a highlight to remove it.')
                : L('Chạm vào từ để xem nghĩa · giữ lâu để giải thích cả câu.', 'Tap a word for its meaning · long-press to explain a sentence.')}
            </Text>
          ) : null}
          {bilingual.error ? (
            <Text style={{ marginTop: 8, textAlign: 'center', fontSize: 14, color: color.danger }}>{bilingual.error}</Text>
          ) : null}

          <View style={{ marginTop: 18 }}>
            <PassageView
              translations={bilingual.on ? bilingual.paragraphs : null}
              paragraphs={article.paragraphs}
              fontScale={fontScale}
              fontFamily={passageFont.body}
              textColor={theme.body}
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
              baseSize={wide ? 16 : 16}
            />
          </View>

          {article.attribution ? (
            <Text style={{ marginTop: 24, fontFamily: passageFont.title, fontStyle: 'italic', fontSize: 12, color: theme.muted }}>
              {article.attribution}
            </Text>
          ) : null}
        </View>
      </ScrollView>
      {wide ? null : (
        <FloatingTools
          tool={tool}
          notesOpen={notesOpen}
          onPick={pickTool}
          onNotes={toggleNotes}
          highlightColor={highlightColor}
          onHighlightColor={setHighlightColor}
          hasHighlights={articleHighlights.length > 0}
          onClearHighlights={() => clearHighlights(article.id)}
          phraseMode={phraseMode}
          onTogglePhrase={() => {
            setPhraseMode((p) => !p);
            setPhraseAnchor(null);
          }}
        />
      )}
    </View>
  );

  const questionsPane = (
    <View style={{ flex: 1, backgroundColor: EXAM.white }}>
      <ScrollView ref={qScroll} style={{ flex: 1 }} contentContainerStyle={{ padding: pad, paddingTop: wide ? 24 : 16, paddingBottom: 64 + keyboardInset }} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
        {loadingQuestions && questions.length === 0 ? (
          <View className="items-center py-10">
            <ActivityIndicator color={EXAM.accent} />
            <Text className="mt-2 font-sans text-body text-muted">{L('Đang chuẩn bị bộ đề…', 'Preparing questions…')}</Text>
          </View>
        ) : (
          <QuestionPanel
            ref={panelRef}
            questions={questions}
            layout={mode === 'mixed' ? 'mixed' : 'blocks'}
            answers={answers}
            marked={marked}
            activeNumber={activeQ}
            onActivate={setActiveQ}
            onAnswer={onAnswerQ}
            onToggleMark={onToggleMarkQ}
            evidenceMarks={evidenceMarks}
            evidenceFor={evidenceFor}
            onStartEvidence={(questionId) => {
              setEvidenceFor(questionId);
              setPhraseAnchor(null);
              setPhraseMode(true);
              if (!split) setNarrowTab('passage');
            }}
            onClearEvidence={onClearEvidenceQ}
          />
        )}

        {/*
          Bộ đề IELTS nay dựng bằng luật ngay trên máy, nên "offline" không còn
          là dấu hiệu hỏng — nó là đường chính. Chỉ SAT mới cần lời nhắc này.
        */}
        {questionSet?.generatedBy === 'offline' && article.exam === 'sat' ? (
          <Text className="mt-4 font-sans text-label text-subtle">
            {L(
              'Không gọi được AI nên bộ đề này sinh offline từ chính bài đọc, chỉ có Words in Context và Inferences. Tải lại trang để lấy đủ năm dạng của SAT.',
              'AI was unavailable, so this set was generated offline from the passage and only has Words in Context and Inferences. Reload the page to get all five SAT question types.',
            )}
          </Text>
        ) : null}
      </ScrollView>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: EXAM.page }}>
      <ExamTopBar
        narrow={phone}
        compact={lay.compactHeight}
        paused={paused}
        onTogglePause={() => setPaused((p) => !p)}
        onExit={() => router.back()}
        notesOpen={notesOpen}
        onNotes={toggleNotes}
        settingsOpen={settingsOpen}
        onSettings={() => {
          setSettingsOpen((o) => !o);
          setNotesOpen(false);
        }}
        onTutor={() => setChatOpen(true)}
      />

      <View style={{ flex: 1, minHeight: 0 }}>
        {split ? (
          <SplitPane left={passagePane} right={questionsPane} />
        ) : (
          <CrossFade swapKey={`tab-${narrowTab}`} style={{ flex: 1 }}>
            {narrowTab === 'passage' ? passagePane : questionsPane}
          </CrossFade>
        )}
      </View>

      <QuestionNav
        items={questions.map((q) => ({ id: q.id, answered: Boolean(answers[q.id]), marked: Boolean(marked[q.id]) }))}
        current={activeQ}
        onJump={jumpTo}
        onFinish={finish}
        allAnswered={allAnswered}
        submitting={submitting}
        narrow={!split}
        compact={lay.compactHeight}
        tab={narrowTab}
        onTab={setNarrowTab}
      />

      {notesOpen ? (
        <NotesPanel
          notes={articleNotes}
          onClose={() => setNotesOpen(false)}
          onRemove={removeNote}
          onAdd={(body) => addNote({ articleId: article.id, articleTitle: article.title, paragraphIndex: null, body })}
        />
      ) : null}
      {settingsOpen ? (
        <SettingsPanel
          onClose={() => setSettingsOpen(false)}
          paperKey={paperKey}
          onPaper={setPaperKey}
          fonts={EXAM_FONTS}
          fontKey={fontKey}
          onFont={setFontKey}
          fontPx={Math.round(16 * fontScale)}
          onFontSize={(d) => setFontScale(fontScale + d)}
          bilingual={{ on: bilingual.on, loading: bilingual.loading, toggle: () => void bilingual.toggle() }}
          speaking={speakingParagraph !== null}
          onSpeak={() => speakParagraph(speakingParagraph === null ? 0 : speakingParagraph)}
          onStopSpeak={() => {
            Speech.stop();
            setSpeakingParagraph(null);
          }}
          ttsRate={ttsRate}
          onRate={setTtsRate}
          onFullscreen={Platform.OS === 'web' ? toggleFullscreen : null}
        />
      ) : null}

      <WordSheet target={sheet} articleId={article.id} articleTitle={article.title} onClose={() => setSheet(null)} />

      <ChatPanel articleId={article.id} visible={chatOpen} onClose={() => setChatOpen(false)} />
    </View>
  );
}

/**
 * Bôi một từ thì tra từ, bôi vài từ thì tra cả cụm, bôi nguyên câu thì giải
 * thích ngữ pháp — ba chế độ này đã có sẵn trong WordSheet, ở đây chỉ chọn đúng
 * chế độ theo thứ người đọc vừa bôi.
 */
function selectionMode(selected: string): WordSheetTarget['mode'] {
  const words = selected.trim().split(/\s+/).length;
  if (words === 1) return 'word';
  // Có dấu kết câu ở giữa, hoặc quá dài để còn là một collocation.
  if (words > 8 || /[.!?]/.test(selected.slice(0, -1))) return 'sentence';
  return 'phrase';
}

/* ====================================================================== */
/*                          bộ phận của bố cục phòng thi                    */
/* ====================================================================== */

const EXAM_FONTS = [
  { key: 'serif', label: 'Fraunces', title: readingFont.fraunces, body: readingFont.fraunces },
  { key: 'lora', label: 'Lora', title: readingFont.body, body: readingFont.body },
  { key: 'sans', label: 'Jakarta', title: readingFont.sans, body: readingFont.sans },
] as const;
