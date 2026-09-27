import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import type { QuestionType } from '@/types/database';
import * as Speech from 'expo-speech';
import { englishVoice } from '@/services/audio/voice';
import * as WebBrowser from 'expo-web-browser';

import { PASSAGE_CONTAINER_ID, PassageView, sentenceAround, highlightRanges, snapToWords, type ReaderTool } from '@/components/reader/PassageView';
import { QuestionPanel } from '@/components/reader/QuestionPanel';
import { useTextSelection } from '@/components/reader/useTextSelection';
import { WordSheet, type WordSheetTarget } from '@/components/reader/WordSheet';
import { ChatPanel } from '@/components/reader/ChatPanel';
import type { EvidenceMark } from '@/services/proofloop/types';
import { readingSkillFor } from '@/services/mastery/reading-skill';
import { observeSkill } from '@/store/useMasteryStore';
import { useBilingual } from '@/components/reader/useBilingual';
import { CrossFade } from '@/components/motion/Motion';
import { Badge, Button, Card, Icon } from '@/components/ui';
import { readingFont, useReadingFonts } from '@/lib/readingFonts';
import {
  getArticleById,
  getArticleWithBody,
  isReadable,
  readingLevelLabel,
  tierLabel,
  topicLabel,
  type Article,
  type ArticleMeta,
} from '@/data/articles';
import { lemmatize } from '@/services/dictionary/lookup';
import { useQuestionStore } from '@/store/useQuestionStore';
import { useReaderStore } from '@/store/useReaderStore';
import { rawScoreToBand, useStudyStore, type AttemptRecord } from '@/store/useStudyStore';
import { useUserArticleStore } from '@/store/useUserArticleStore';
import { useVocabStore } from '@/store/useVocabStore';
import { LightGrid } from '@/components/layout/LightGrid';
import { HoverPressable } from '@/components/ui/HoverPressable';
import { color, highlightColors, type HighlightColorKey } from '@/theme/tokens';
import { useGameStore } from '@/store/useGameStore';

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
  const { id, types, mode } = useLocalSearchParams<{ id: string; types?: string; mode?: string }>();

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
  const [secondsLeft, setSecondsLeft] = useState(20 * 60);
  const [paused, setPaused] = useState(false);

  // Bố cục phòng thi: màu giấy, mặt chữ, thẻ bài/câu hỏi trên màn hẹp.
  const { width: winW, height: winH } = useWindowDimensions();
  const [paperKey, setPaperKey] = useState<string>('white');
  const [fontKey, setFontKey] = useState<string>('serif');
  const [narrowTab, setNarrowTab] = useState<'passage' | 'questions'>('passage');
  const [toolbarH, setToolbarH] = useState(64);
  useReadingFonts();

  // Mốc đặt trong effect, không phải trong `useRef(Date.now())`: đối số của useRef
  // được tính ngay trong lúc render. Mốc này chỉ đọc ở handler nên đặt muộn một
  // nhịp không ảnh hưởng gì, mà lại đúng hơn — nó là lúc bài đọc thật sự hiện ra.
  const startedAt = useRef(0);
  const articleHighlights = useMemo(
    () => highlights.filter((h) => h.articleId === article?.id),
    [highlights, article?.id],
  );

  // Đồng hồ đếm ngược, tạm dừng được.
  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [paused]);

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

  if (!meta) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas p-6">
        <Text className="font-strong text-cardTitle text-ink">Không tìm thấy bài đọc.</Text>
        <Button label="Về Library" className="mt-4" onPress={() => router.push('/library' as never)} />
      </View>
    );
  }

  if (!isReadable(meta)) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas p-6">
        <Card className="max-w-[520px]">
          <Badge label="Link đề chính thức" tone="warning" />
          <Text className="mt-3 font-strong text-sectionTitle text-ink">{meta.title}</Text>
          <Text className="mt-2 font-sans text-body text-muted">{meta.summary}</Text>
          <Text className="mt-3 font-sans text-label text-subtle">
            Bài từ nguồn có bản quyền ({meta.sourceName}) nên app không lưu toàn văn. Bấm để đọc
            trên trang gốc.
          </Text>
          <Button
            label="Mở link gốc"
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
            Không nạp được toàn văn của bài này. Chạy lại `npm run ingest` để dựng lại kho bài.
          </Text>
          <Button
            label="Về Library"
            className="mt-4"
            onPress={() => router.push('/library' as never)}
          />
        </Card>
      </View>
    );
  }

  const questions = questionSet?.questions ?? [];
  const answeredCount = Object.values(answers).filter(Boolean).length;

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

  const handleWordPress = (word: string, sentence: string, paragraphIndex: number) => {
    setSheet({ word, sentence, paragraphIndex, mode: 'word' });
  };

  const handlePhraseToken = (paragraphIndex: number, tokenIndex: number, token: string) => {
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

  const submit = () => {
    setSubmitting(true);

    const attempts: AttemptRecord[] = questions.map((q) => {
      const userAnswer = answers[q.id]?.trim() ?? '';
      return {
        questionId: q.id,
        type: q.type,
        userAnswer: userAnswer || null,
        correctAnswer: q.correctAnswer,
        isCorrect: isAnswerCorrect(userAnswer, q.correctAnswer),
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
        answerCorrect: isAnswerCorrect(answers[q.id]?.trim() ?? '', q.correctAnswer),
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
    useGameStore.getState().awardBatch(correct, attempts.length, 'read');

    const sessionId = addSession({
      articleId: article.id,
      articleTitle: article.title,
      exam: article.exam,
      mode: 'practice',
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
    router.push(`/review/${sessionId}` as never);
  };

  const wide = winW >= 1024;
  const theme = PAPER_THEMES.find((t) => t.key === paperKey) ?? PAPER_THEMES[0]!;
  const passageFont = EXAM_FONTS.find((f) => f.key === fontKey) ?? EXAM_FONTS[0]!;
  const paneHeight = Math.max(420, winH - toolbarH - (wide ? 36 : 28));
  const pad = wide ? 36 : 20;

  const toggleFullscreen = () => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen?.();
  };

  const passagePane = (
    <ExamSheet bg={theme.bg}>
      <ScrollView contentContainerStyle={{ padding: pad, paddingBottom: 72 }}>
        <Text style={{ fontFamily: readingFont.mono, fontSize: 11, letterSpacing: 1.8, color: theme.muted }}>
          {(article.exam === 'sat' ? 'SAT READING' : 'READING PASSAGE').toUpperCase()} · QUESTIONS 1–{questions.length || '…'}
        </Text>

        <Text
          style={{
            marginTop: 14,
            textAlign: 'center',
            fontFamily: passageFont.title,
            fontWeight: '700',
            fontSize: Math.round(26 * fontScale),
            lineHeight: Math.round(34 * fontScale),
            color: theme.ink,
          }}
        >
          {article.title}
        </Text>

        <Text style={{ marginTop: 6, textAlign: 'center', fontFamily: passageFont.title, fontStyle: 'italic', fontSize: 14, color: theme.muted }}>
          {[
            article.exam === 'sat' ? 'SAT' : article.track === 'academic' ? 'IELTS Academic' : 'IELTS General Training',
            article.cefrLevel,
            readingLevelLabel(article),
            tierLabel(article.passageTier ?? null),
            `${article.wordCount} từ`,
            topicLabel(article.topic),
          ]
            .filter(Boolean)
            .join(' · ')}
        </Text>

        {/* Công cụ đọc — một hàng mảnh, không tranh chỗ với bài */}
        <View className="mt-5 flex-row flex-wrap items-center gap-1.5 border-y py-2.5" style={{ borderColor: theme.rule }}>
          <ToolPill
            label={bilingual.loading ? 'Đang dịch…' : bilingual.on ? 'Tắt song ngữ' : 'Song ngữ'}
            active={bilingual.on}
            disabled={bilingual.loading}
            onPress={() => void bilingual.toggle()}
          />
          <ToolPill label="Đọc to" onPress={() => speakParagraph(speakingParagraph === null ? 0 : speakingParagraph)} />
          {speakingParagraph !== null ? (
            <ToolPill
              label="Dừng"
              onPress={() => {
                Speech.stop();
                setSpeakingParagraph(null);
              }}
            />
          ) : null}
          <View className="mx-1 h-5 w-px" style={{ backgroundColor: theme.rule }} />
          <ToolPill label="Đọc" active={tool === 'read'} onPress={() => pickTool('read')} />
          <ToolPill label="Highlight" active={tool === 'highlight'} onPress={() => pickTool('highlight')} />
          <ToolPill label="Tra từ" active={tool === 'vocab'} onPress={() => pickTool('vocab')} />
          {tool === 'highlight' ? (
            <>
              <View className="mx-1 h-5 w-px" style={{ backgroundColor: theme.rule }} />
              {(Object.keys(highlightColors) as HighlightColorKey[]).map((key) => (
                <Pressable
                  key={key}
                  accessibilityRole="button"
                  onPress={() => setHighlightColor(key)}
                  accessibilityLabel={`Bút ${highlightColors[key].label}`}
                  aria-selected={highlightColor === key}
                  className="h-6 w-6 items-center justify-center rounded-pill"
                  style={{ borderWidth: 2, borderColor: highlightColor === key ? EXAM_ACCENT : 'transparent' }}
                >
                  <View className="h-4 w-4 rounded-pill" style={{ backgroundColor: highlightColors[key].dot }} />
                </Pressable>
              ))}
              {articleHighlights.length > 0 ? <ToolPill label="Xoá hết highlight" onPress={() => clearHighlights(article.id)} /> : null}
            </>
          ) : null}
          {tool === 'vocab' ? (
            <ToolPill
              label={phraseMode ? 'Đang chọn cụm…' : 'Chọn cụm'}
              active={phraseMode}
              onPress={() => {
                setPhraseMode((p) => !p);
                setPhraseAnchor(null);
              }}
            />
          ) : null}
        </View>
        <Text style={{ marginTop: 6, fontSize: 12, color: theme.muted }}>
          {tool === 'highlight'
            ? 'Kéo chuột bôi đoạn muốn tô · chạm một từ để tô cả câu · chạm vào vệt đã tô để xoá.'
            : tool === 'vocab'
              ? 'Chạm vào từ để xem nghĩa · bôi đen để tra cả cụm · giữ lâu để giải thích cả câu.'
              : 'Đang ở chế độ đọc: chạm vào bài không mở gì. Bật Highlight hoặc Tra từ khi cần.'}
        </Text>

        {bilingual.error ? (
          <Text className="mt-2 font-sans text-label" style={{ color: color.danger }}>
            {bilingual.error}
          </Text>
        ) : null}

        <View className="mt-6">
          <PassageView
            translations={bilingual.on ? bilingual.paragraphs : null}
            paragraphs={article.paragraphs}
            fontScale={fontScale}
            fontFamily={passageFont.body}
            textColor={theme.body}
            highlights={articleHighlights}
            statusOf={statusOf}
            onWordPress={handleWordPress}
            onSentenceLongPress={(sentence, paragraphIndex) =>
              setSheet({ word: sentence, sentence, paragraphIndex, mode: 'sentence' })
            }
            phraseMode={phraseMode}
            phraseAnchor={phraseAnchor}
            onPhraseToken={handlePhraseToken}
            speakingParagraph={speakingParagraph}
            tool={tool}
            onHighlightRange={applyHighlight}
            onHighlightPress={removeHighlight}
          />
        </View>

        {article.attribution ? (
          <Text style={{ marginTop: 28, fontFamily: passageFont.title, fontStyle: 'italic', fontSize: 12.5, color: theme.muted }}>
            {article.attribution}
          </Text>
        ) : null}

        {/* Công cụ phụ ở cuối bài */}
        <View className="mt-6 flex-row flex-wrap items-center gap-1.5 border-t pt-3" style={{ borderColor: theme.rule }}>
          <ToolPill
            label="Ghi chú"
            onPress={() =>
              addNote({
                articleId: article.id,
                articleTitle: article.title,
                paragraphIndex: null,
                body: `Ghi chú cho "${article.title}"`,
              })
            }
          />
          <View className="flex-1" />
          <Text style={{ fontSize: 11, color: theme.muted, marginRight: 4 }}>Tốc độ đọc</Text>
          {[0.75, 1, 1.5, 2].map((rate) => (
            <ToolPill key={rate} label={`${rate}x`} active={ttsRate === rate} onPress={() => setTtsRate(rate)} />
          ))}
        </View>
      </ScrollView>
    </ExamSheet>
  );

  const questionsPane = (
    <ExamSheet bg={theme.bg}>
      <ScrollView contentContainerStyle={{ padding: pad, paddingBottom: 72 }}>
        <View style={{ borderWidth: 1, borderColor: EXAM_LINE, borderRadius: 18, padding: wide ? 22 : 14, backgroundColor: '#FFFFFF' }}>
          {loadingQuestions && questions.length === 0 ? (
            <View className="items-center py-10">
              <ActivityIndicator color={EXAM_ACCENT} />
              <Text className="mt-2 font-sans text-body text-muted">Đang chuẩn bị bộ đề…</Text>
            </View>
          ) : (
            <QuestionPanel
              bare
              questions={questions}
              layout={mode === 'mixed' ? 'mixed' : 'blocks'}
              answers={answers}
              marked={marked}
              submitting={submitting}
              onAnswer={(questionId, answer) => setAnswers((prev) => ({ ...prev, [questionId]: answer }))}
              onToggleMark={(questionId) => setMarked((prev) => ({ ...prev, [questionId]: !prev[questionId] }))}
              onSubmit={submit}
              evidenceMarks={evidenceMarks}
              evidenceFor={evidenceFor}
              onStartEvidence={(questionId) => {
                setEvidenceFor(questionId);
                setPhraseAnchor(null);
                setPhraseMode(true);
                if (!wide) setNarrowTab('passage');
              }}
              onClearEvidence={(questionId) =>
                setEvidenceMarks((prev) => {
                  const next = { ...prev };
                  delete next[questionId];
                  return next;
                })
              }
            />
          )}
        </View>

        {/*
          Bộ đề IELTS nay dựng bằng luật ngay trên máy, nên "offline" không còn
          là dấu hiệu hỏng — nó là đường chính. Chỉ SAT mới cần lời nhắc này.
        */}
        {questionSet?.generatedBy === 'offline' && article.exam === 'sat' ? (
          <Text className="mt-3 font-sans text-label text-subtle">
            Không gọi được AI nên bộ đề này sinh offline từ chính bài đọc, chỉ có Words in Context và Inferences.
            Tải lại trang để lấy đủ năm dạng của SAT.
          </Text>
        ) : null}
      </ScrollView>
    </ExamSheet>
  );

  return (
    <LightGrid>
      <View className="flex-1 px-3 pt-3 lg:px-6">
        {/* ------------------------------------------------------ thanh phòng thi */}
        <View onLayout={(e) => setToolbarH(e.nativeEvent.layout.height)}>
          <View className="flex-row flex-wrap items-center gap-2 rounded-card bg-white px-3 py-2.5" style={examSticker}>
            <Pressable
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Quay lại"
              className="h-9 w-9 items-center justify-center rounded-md"
              style={{ borderWidth: 1, borderColor: EXAM_LINE }}
            >
              <View style={{ transform: [{ rotate: '180deg' }] }}>
                <Icon name="arrow-right" size={16} color={EXAM_INK} strokeWidth={2.4} />
              </View>
            </Pressable>

            <View className="rounded-md px-2.5 py-1.5" style={{ backgroundColor: EXAM_ACCENT }}>
              <Text style={{ fontSize: 12, fontWeight: '800', color: '#FFFFFF' }}>{article.exam === 'sat' ? 'SAT' : 'READING'}</Text>
            </View>

            {/* dải số câu: đã trả lời thì tô đen, đánh dấu xem lại có chấm vàng */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxWidth: wide ? 560 : '100%' }}>
              <View className="flex-row items-center gap-1">
                {questions.map((q, i) => {
                  const done = Boolean(answers[q.id]);
                  return (
                    <View
                      key={q.id}
                      className="h-6 min-w-6 items-center justify-center rounded-pill px-1"
                      style={{ borderWidth: 1, backgroundColor: done ? EXAM_ACCENT : '#FFFFFF', borderColor: done ? EXAM_ACCENT : EXAM_LINE }}
                    >
                      <Text style={{ fontSize: 10.5, fontWeight: '700', color: done ? '#FFFFFF' : EXAM_INK }}>{i + 1}</Text>
                      {marked[q.id] ? (
                        <View className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-pill" style={{ backgroundColor: '#F2B84B' }} />
                      ) : null}
                    </View>
                  );
                })}
              </View>
            </ScrollView>
            <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#64748B' }}>
              {answeredCount}/{questions.length}
            </Text>

            <View className="flex-1" />

            {!wide ? (
              <View className="flex-row rounded-md p-0.5" style={{ backgroundColor: '#EEF2F7' }}>
                {(['passage', 'questions'] as const).map((t) => (
                  <Pressable
                    key={t}
                    accessibilityRole="tab"
                    aria-selected={narrowTab === t}
                    onPress={() => setNarrowTab(t)}
                    className="rounded-md px-2.5 py-1.5"
                    style={{ backgroundColor: narrowTab === t ? EXAM_ACCENT : 'transparent' }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '700', color: narrowTab === t ? '#FFFFFF' : EXAM_INK }}>
                      {t === 'passage' ? 'Bài đọc' : 'Câu hỏi'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}

            {/* màu giấy */}
            <View className="flex-row items-center gap-1">
              {PAPER_THEMES.map((t) => (
                <Pressable
                  key={t.key}
                  accessibilityRole="button"
                  accessibilityLabel={`Giấy ${t.label}`}
                  aria-selected={paperKey === t.key}
                  onPress={() => setPaperKey(t.key)}
                  className="h-6 w-6 rounded-md"
                  style={{ backgroundColor: t.bg, borderWidth: paperKey === t.key ? 2.5 : 1, borderColor: paperKey === t.key ? EXAM_ACCENT : EXAM_LINE }}
                />
              ))}
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Đổi mặt chữ"
              onPress={() => {
                const i = EXAM_FONTS.findIndex((f) => f.key === fontKey);
                setFontKey(EXAM_FONTS[(i + 1) % EXAM_FONTS.length]!.key);
              }}
              className="h-8 flex-row items-center gap-1.5 rounded-md px-2.5"
              style={{ borderWidth: 1, borderColor: EXAM_LINE }}
            >
              <Text style={{ fontFamily: passageFont.title, fontSize: 12.5, color: EXAM_INK }}>{passageFont.label}</Text>
              <Icon name="chevron-down" size={12} color={EXAM_INK} strokeWidth={2.4} />
            </Pressable>

            <View className="h-8 flex-row items-center rounded-md" style={{ borderWidth: 1, borderColor: EXAM_LINE }}>
              <Pressable accessibilityLabel="Giảm cỡ chữ" onPress={() => setFontScale(fontScale - 0.1)} className="px-2">
                <Text style={{ fontSize: 14, fontWeight: '800', color: EXAM_INK }}>−</Text>
              </Pressable>
              <Text style={{ fontSize: 12, fontWeight: '700', color: EXAM_INK, minWidth: 34, textAlign: 'center' }}>
                {Math.round(15 * fontScale)}px
              </Text>
              <Pressable accessibilityLabel="Tăng cỡ chữ" onPress={() => setFontScale(fontScale + 0.1)} className="px-2">
                <Text style={{ fontSize: 14, fontWeight: '800', color: EXAM_INK }}>+</Text>
              </Pressable>
            </View>

            {Platform.OS === 'web' ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Toàn màn hình"
                onPress={toggleFullscreen}
                className="h-8 w-8 items-center justify-center rounded-md"
                style={{ borderWidth: 1, borderColor: EXAM_LINE }}
              >
                <Text style={{ fontSize: 14, color: EXAM_INK }}>⤢</Text>
              </Pressable>
            ) : null}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={paused ? 'Chạy tiếp đồng hồ' : 'Tạm dừng đồng hồ'}
              onPress={() => setPaused((p) => !p)}
              className="h-9 flex-row items-center gap-1.5 rounded-md px-3"
              style={{ borderWidth: 1, borderColor: EXAM_LINE }}
            >
              <View className="h-2 w-2 rounded-pill" style={{ backgroundColor: paused ? '#D97706' : '#16A34A' }} />
              <Text style={{ fontSize: 13, fontWeight: '800', color: EXAM_INK, fontVariant: ['tabular-nums'] }}>
                {formatTime(secondsLeft)}
              </Text>
            </Pressable>

            <HoverPressable
              accessibilityRole="button"
              onPress={submit}
              disabled={submitting || questions.length === 0}
              className="h-9 items-center justify-center rounded-md px-4"
              style={({ hovered }) => ({
                backgroundColor: hovered ? '#4A7FE8' : EXAM_ACCENT,
                opacity: questions.length === 0 ? 0.5 : 1,
              })}
            >
              <Text style={{ fontSize: 14, fontWeight: '800', color: '#FFFFFF' }}>{submitting ? 'Đang chấm…' : 'Nộp bài'}</Text>
            </HoverPressable>
          </View>
        </View>

        {/* ------------------------------------------------------ hai tấm */}
        {wide ? (
          <View className="mt-4 flex-row gap-4" style={{ height: paneHeight }}>
            <View style={{ flex: 1, flexBasis: 0 }}>{passagePane}</View>
            <View style={{ flex: 1, flexBasis: 0 }}>{questionsPane}</View>
          </View>
        ) : (
          <View className="mt-3" style={{ height: paneHeight }}>
            <CrossFade swapKey={`tab-${narrowTab}`} style={{ flex: 1 }}>
              {narrowTab === 'passage' ? passagePane : questionsPane}
            </CrossFade>
          </View>
        )}
      </View>

      {/* Nút trợ giảng nổi */}
      <Pressable
        onPress={() => setChatOpen(true)}
        accessibilityLabel="Mở trợ giảng"
        className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-pill"
        style={{ backgroundColor: EXAM_ACCENT, boxShadow: '0 12px 32px rgba(37,99,235,0.35)' } as never}
      >
        <Icon name="chat" size={24} color={color.white} strokeWidth={1.9} />
      </Pressable>

      <WordSheet target={sheet} articleId={article.id} articleTitle={article.title} onClose={() => setSheet(null)} />

      <ChatPanel articleId={article.id} visible={chatOpen} onClose={() => setChatOpen(false)} />
    </LightGrid>
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

/** So đáp án khoan dung: bỏ qua hoa thường, dấu câu và mạo từ thừa. */
export function isAnswerCorrect(userAnswer: string, correctAnswer: string): boolean {
  const normalize = (text: string) =>
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\b(the|a|an)\b/g, '')
      .replace(/\s+/g, ' ')
      .trim();

  const user = normalize(userAnswer);
  const correct = normalize(correctAnswer);

  return user.length > 0 && user === correct;
}

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/* ====================================================================== */
/*                          bộ phận của bố cục phòng thi                    */
/* ====================================================================== */

/*
  Phòng thi mang MÀU CỦA READUP, không mượn áo của app khác.

  Bản trước là nền lưới rêu, giấy kem, viền mực đen dày với bóng lệch cứng và
  nút "Kiểm Tra" vàng — đẹp, nhưng giống IELTS Dictionary tới mức người dùng
  nhận ra ngay. Giờ: nền xám xanh trơn, tấm giấy trắng viền mảnh bóng mềm, màu
  nhấn là xanh của cả app. Chỗ nào cần đập vào mắt (nút Nộp bài, câu đã làm)
  thì dùng EXAM_ACCENT; còn lại để chữ và bài đọc nói.
*/
const EXAM_INK = '#1E293B';
const EXAM_LINE = '#D7DEE8';
const EXAM_ACCENT = '#5B8BEE';

const PAPER_THEMES = [
  { key: 'white', label: 'trắng', bg: '#FFFFFF', ink: '#1C1B16', body: '#35342C', muted: '#8B8878', rule: '#ECE8DA' },
  { key: 'cream', label: 'kem', bg: '#FBF6E9', ink: '#1F1B12', body: '#3A3527', muted: '#8E8672', rule: '#EAE2CC' },
  { key: 'sepia', label: 'ngà', bg: '#F3E7CF', ink: '#33281A', body: '#4A3C2A', muted: '#8F7B5E', rule: '#E2D2B2' },
  { key: 'mint', label: 'xanh nhạt', bg: '#EDF3E4', ink: '#1F2A12', body: '#33402A', muted: '#76826A', rule: '#D9E3C9' },
] as const;

const EXAM_FONTS = [
  { key: 'serif', label: 'Fraunces', title: readingFont.fraunces, body: readingFont.fraunces },
  { key: 'lora', label: 'Lora', title: readingFont.body, body: readingFont.body },
  { key: 'sans', label: 'Jakarta', title: readingFont.sans, body: readingFont.sans },
] as const;

/** Tấm giấy phòng thi: viền mảnh, bóng mềm. */
const examSticker = {
  borderWidth: 1,
  borderColor: EXAM_LINE,
  ...(Platform.OS === 'web'
    ? ({ boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 14px 36px rgba(15,23,42,0.07)' } as object)
    : { elevation: 3 }),
};

function ExamSheet({ bg, children }: { bg: string; children: React.ReactNode }) {
  return (
    <View className="flex-1 overflow-hidden rounded-card" style={[examSticker, { backgroundColor: bg }]}>
      {children}
    </View>
  );
}

function ToolPill({
  label,
  active = false,
  disabled = false,
  onPress,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <HoverPressable
      accessibilityRole="button"
      aria-selected={active} aria-disabled={disabled}
      disabled={disabled}
      onPress={onPress}
      className="rounded-pill px-3 py-1"
      style={({ hovered }) => ({
        borderWidth: 1,
        borderColor: active ? EXAM_ACCENT : EXAM_LINE,
        backgroundColor: active ? EXAM_ACCENT : hovered ? '#F1F5F9' : '#FFFFFF',
        opacity: disabled ? 0.6 : 1,
      })}
    >
      <Text style={{ fontSize: 13, fontWeight: '700', color: active ? '#FFFFFF' : EXAM_INK }}>{label}</Text>
    </HoverPressable>
  );
}
