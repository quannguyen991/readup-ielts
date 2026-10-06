import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';

import { useFocusDecks, useStudySnapshot } from '@/components/travel/useTravel';
import { recordAnswer, seenKeys } from '@/components/travel/record';
import { QuestionRunner, type RunResult } from '@/components/travel/ui/QuestionRunner';
import { CoinGlyph, GameButton, PixelPanel, StampGlyph, StarsRow, T } from '@/components/travel/ui/kit';
import { getSouvenir } from '@/data/travel/souvenirs';
import { buildReplyQuestion, replyPool, type VisitQuestion } from '@/services/travel/content';
import { pickVisitQuestions, seedFor } from '@/services/travel/pick';
import { TRAVEL_ECONOMY } from '@/services/travel/economy';
import type { Level, PoiKind } from '@/services/travel/types';
import type { Bi } from '@/i18n/useL';
import { bi, useL } from '@/i18n/useL';
import { CITIES } from '@/services/travel/world';
import { useTravelStore } from '@/store/useTravelStore';
import type { VisitResult } from '@/services/travel/rewards';
import { getPoiContent } from '@/data/travel/pois';
import { useAuthStore } from '@/store/useAuthStore';
import { VisitSpeakingPractice } from './VisitSpeakingPractice';
import { TravelConversation } from './TravelConversation';
import { buildContextualSpeakingPrompts, contextualVocabularyFor, type ContextualVocabularyItem, type SpeakingTargetBand } from '@/services/travel/contextual-speaking';
import type { TravelConversationContext } from '@/services/travel/conversation';
import { playSfx } from '@/services/audio/sfx-ui';

type Session = { questions: VisitQuestion[]; level: Level; runNo: number };
type Outcome = { result: VisitResult; correct: number; total: number };
type PracticeMode = 'conversation' | 'speaking' | 'vocab' | 'both' | 'ielts';
type ReplyScenario = Extract<VisitQuestion, { type: 'reply' }>;

const STAFF: Partial<Record<PoiKind, Bi>> = {
  airport: { vi: 'Nhân viên sân bay', en: 'Airport staff' },
  station: { vi: 'Nhân viên nhà ga', en: 'Station staff' },
  hotel: { vi: 'Lễ tân', en: 'Receptionist' },
  restaurant: { vi: 'Nhân viên phục vụ', en: 'Server' },
  cafe: { vi: 'Nhân viên pha chế', en: 'Barista' },
  market: { vi: 'Người bán hàng', en: 'Shopkeeper' },
  museum: { vi: 'Hướng dẫn viên bảo tàng', en: 'Museum guide' },
  garden: { vi: 'Nhân viên hướng dẫn', en: 'Park guide' },
  landmark: { vi: 'Hướng dẫn viên', en: 'Local guide' },
  secret: { vi: 'Hướng dẫn viên', en: 'Local guide' },
};

export function VisitDialogue({ poiId, onClose }: { poiId: string; onClose: () => void }) {
  const poi = getPoiContent(poiId);
  const { L, locale } = useL();
  const win = useWindowDimensions();
  const progress = useTravelStore((s) => s.poi[poiId]);
  const seen = useTravelStore((s) => s.seen);
  const complete = useTravelStore((s) => s.completeVisit);
  const accessToken = useAuthStore((s) => s.session?.access_token ?? null);
  const snap = useStudySnapshot();
  const focus = useFocusDecks();
  const [phase, setPhase] = useState<'setup' | 'conversation' | 'speaking' | 'run' | 'ielts' | 'result'>('setup');
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [mode, setMode] = useState<PracticeMode>('conversation');
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [targetBand, setTargetBand] = useState<SpeakingTargetBand>('7');
  const [journeyIndex, setJourneyIndex] = useState(0);
  const [journeyAnswers, setJourneyAnswers] = useState<Map<string, string>>(new Map());
  const [adaptivePromptId, setAdaptivePromptId] = useState<string | null>(null);
  const entrance = useRef(new Animated.Value(0)).current;
  const spokenAnswers = useRef<Map<string, string>>(new Map());

  const close = useCallback(() => {
    playSfx('modalClose');
    onClose();
  }, [onClose]);

  useEffect(() => {
    playSfx('modalOpen');
    const animation = Animated.timing(entrance, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [entrance, poiId]);

  const journeyPrompts = useMemo(() => {
    if (!poi) return [];
    const prompts = buildContextualSpeakingPrompts(poi.kind, targetBand);
    if (!adaptivePromptId) return prompts;
    const adaptive = prompts.find((prompt) => prompt.id === adaptivePromptId && prompt.part === 3);
    if (!adaptive) return prompts;
    let replaced = false;
    return prompts.map((prompt) => {
      if (!replaced && prompt.part === 3) {
        replaced = true;
        return adaptive;
      }
      return prompt;
    });
  }, [adaptivePromptId, poi, targetBand]);
  const journeyVocabulary = useMemo(() => (poi ? contextualVocabularyFor(poi.kind) : []), [poi]);

  const scenarios = useMemo<ReplyScenario[]>(() => {
    if (!poi) return [];
    const pool = replyPool(poi.content.decks, poi.kind).filter((item) => item.line.trim().length > 0);
    const unique = new Set<string>();
    const contextual = pool.filter((item) => {
      const signature = item.setup.trim().toLocaleLowerCase();
      if (!signature || unique.has(signature)) return false;
      unique.add(signature);
      return true;
    });
    return contextual.slice(0, 4).map((item, index) =>
      buildReplyQuestion(item, seedFor(`${poi.id}:dialogue:${item.id}`, (progress?.runs ?? 0) + index + 1)),
    );
  }, [poi, progress?.runs]);

  const [selectedScenarioIds, setSelectedScenarioIds] = useState<string[]>(() =>
    scenarios.slice(0, Math.min(3, scenarios.length)).map((scenario) => scenario.id),
  );

  useEffect(() => {
    spokenAnswers.current = new Map();
  }, [poiId, scenarios]);

  const createSession = useCallback((): Session => {
    if (!poi) return { questions: [], level: 1, runNo: 1 };

    const level = (progress?.level ?? poi.content.level) as Level;
    const runNo = (progress?.runs ?? 0) + 1;
    const nowMs = Date.now();
    const count = poi.questions ?? TRAVEL_ECONOMY.visit.questions;
    const input = {
      poi,
      level,
      runNo,
      seen,
      nowMs,
      focusDecks: focus.decks,
      ...snap,
    };

    // Mở lượt bằng một câu đáp đã được biên soạn đúng chủ đề của địa điểm.
    const pool = replyPool(poi.content.decks, poi.kind);
    const withStaffLine = pool.filter((item) => item.line.trim().length > 0);
    const roleplayPool = withStaffLine.length ? withStaffLine : pool;
    const fresh = roleplayPool.filter((item) => {
      const at = seen?.[item.id];
      return at === undefined || nowMs - Date.parse(at) >= TRAVEL_ECONOMY.seenWindowMs;
    });
    const available = fresh.length ? fresh : roleplayPool;
    const nearestLevel = available.length
      ? Math.min(...available.map((item) => Math.abs(item.level - level)))
      : 0;
    const candidates = available.filter((item) => Math.abs(item.level - level) === nearestLevel);
    const rng = seedFor(poi.id + ':conversation', runNo);
    const item = candidates.length ? candidates[Math.floor(rng() * candidates.length)] : undefined;
    const opening = item ? buildReplyQuestion(item, rng) : undefined;

    const mixed = pickVisitQuestions({
      ...input,
      count: count + (opening ? 1 : 0),
    });
    const remaining = mixed.filter((q) => !opening || q.key !== opening.key);
    const questions = [
      ...(opening ? [opening] : []),
      ...remaining.slice(0, Math.max(0, count - (opening ? 1 : 0))),
    ];

    return { questions, level, runNo };
  }, [poi, progress, seen, focus.decks, snap]);

  const [session, setSession] = useState<Session>(() => createSession());

  const activeScenarios = useMemo(
    () => scenarios.filter((scenario) => selectedScenarioIds.includes(scenario.id)),
    [scenarios, selectedScenarioIds],
  );

  const finish = useCallback(
    (run: RunResult) => {
      if (!poi) return;
      const result = complete({
        poiId,
        correct: run.correct,
        total: run.total,
        playedLevel: session.level,
        keys: seenKeys(session.questions),
      });
      if (!result) return;
      setOutcome({ result, correct: run.correct, total: run.total });
      setPhase('result');
    },
    [complete, poi, poiId, session],
  );

  const finishSpeaking = useCallback(
    (answers: Map<string, string>) => {
      if (!poi || activeScenarios.length === 0) return;
      const correct = activeScenarios.filter((scenario) => wordCount(answers.get(scenario.id) ?? '') >= 3).length;
      const result = complete({
        poiId,
        correct,
        total: activeScenarios.length,
        playedLevel: session.level,
        keys: seenKeys(activeScenarios),
      });
      if (!result) return;
      setOutcome({ result, correct, total: activeScenarios.length });
      setPhase('result');
    },
    [activeScenarios, complete, poi, poiId, session.level],
  );

  const finishIeltsJourney = useCallback((answers: Map<string, string>) => {
    if (!poi || journeyPrompts.length === 0) return;
    const correct = journeyPrompts.filter((prompt) => {
      const words = wordCount(answers.get(prompt.id) ?? '');
      return words >= (prompt.part === 1 ? 3 : prompt.part === 2 ? 50 : 20);
    }).length;
    const result = complete({
      poiId,
      correct,
      total: journeyPrompts.length,
      playedLevel: session.level,
      keys: journeyPrompts.map((prompt) => `ielts:${poiId}:${prompt.id}`),
    });
    if (!result) return;
    setOutcome({ result, correct, total: journeyPrompts.length });
    setPhase('result');
  }, [complete, journeyPrompts, poi, poiId, session.level]);

  const startPractice = useCallback(() => {
    setOutcome(null);
    setScenarioIndex(0);
    spokenAnswers.current = new Map();
    setJourneyIndex(0);
    setJourneyAnswers(new Map());
    setAdaptivePromptId(null);
    setPhase(mode === 'conversation' ? 'conversation' : mode === 'vocab' ? 'run' : mode === 'ielts' ? 'ielts' : 'speaking');
  }, [mode]);

  const advanceIeltsJourney = useCallback(async (transcript: string) => {
    const current = journeyPrompts[journeyIndex];
    if (!current) return;
    const answers = new Map(journeyAnswers);
    answers.set(current.id, transcript);
    setJourneyAnswers(answers);
    if (current.part === 2 && accessToken) {
      try {
        const response = await fetch('/api/speaking/follow-up', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({ questionId: `context:${poiId}:${current.id}`, transcript, targetBand }),
        });
        if (response.ok) {
          const data = (await response.json()) as { questionId?: unknown };
          if (typeof data.questionId === 'string') setAdaptivePromptId(data.questionId);
        }
      } catch {
        // Continue with the curated question bank when the adaptive service is unavailable.
      }
    }
    if (journeyIndex + 1 < journeyPrompts.length) setJourneyIndex((index) => index + 1);
    else finishIeltsJourney(answers);
  }, [accessToken, finishIeltsJourney, journeyAnswers, journeyIndex, journeyPrompts, poiId, targetBand]);

  const advanceScenario = useCallback(
    (transcript: string) => {
      const current = activeScenarios[scenarioIndex];
      if (!current) return;
      const nextAnswers = new Map(spokenAnswers.current);
      nextAnswers.set(current.id, transcript);
      spokenAnswers.current = nextAnswers;

      if (scenarioIndex + 1 < activeScenarios.length) {
        setScenarioIndex((index) => index + 1);
      } else if (mode === 'both') {
        setPhase('run');
      } else {
        finishSpeaking(nextAnswers);
      }
    },
    [activeScenarios, finishSpeaking, mode, scenarioIndex],
  );

  if (!poi) return null;

  const compact = win.width < 720;
  const panelWidth = compact ? Math.max(0, win.width - 16) : Math.min(620, Math.max(390, Math.round(win.width * 0.35)));
  const panelHeight = compact ? Math.round(win.height * 0.53) : Math.max(300, Math.min(740, win.height - 28));
  const left = compact ? 8 : undefined;
  const role = bi(STAFF[poi.kind] ?? { vi: 'Nhân viên', en: 'Staff member' }, locale);
  const conversationContext: TravelConversationContext = {
    cityId: poi.city,
    poiId,
    npcId: `staff-${poi.kind}-${poiId}`,
    persona: 'staff',
    displayName: STAFF[poi.kind] ?? { vi: 'Nhân viên', en: 'Staff member' },
  };

  const replay = () => {
    setSession(createSession());
    setOutcome(null);
    setMode(mode);
    spokenAnswers.current = new Map();
    setJourneyIndex(0);
    setJourneyAnswers(new Map());
    setAdaptivePromptId(null);
    setPhase('setup');
  };

  const toggleScenario = (id: string) => {
    setSelectedScenarioIds((selected) =>
      selected.includes(id)
        ? selected.filter((x) => x !== id)
        : selected.length >= 3
          ? selected
          : [...selected, id],
    );
  };

  const quizQuestions = session.questions.filter((question) => question.type !== 'reply');
  const practiceQuestions = quizQuestions.length ? quizQuestions : session.questions;

  return (
    <>
      <View
        pointerEvents="auto"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 40,
          backgroundColor: 'rgba(7, 11, 24, 0.12)',
        }}
      />
      {Platform.OS === 'web' ? <EscapeToClose onClose={close} /> : null}
      <View
        pointerEvents="box-none"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 41 }}
      >
        <Animated.View
          accessible
          accessibilityViewIsModal
          accessibilityLabel={L('Cuộc trò chuyện tại', 'Conversation at') + ' ' + bi(poi.name, locale)}
          style={[{
            position: 'absolute',
            left,
            right: compact ? 8 : 16,
            bottom: compact ? 'calc(8px + env(safe-area-inset-bottom, 0px))' as unknown as number : 'calc(16px + env(safe-area-inset-bottom, 0px))' as unknown as number,
            width: panelWidth,
            maxHeight: panelHeight,
          }, { opacity: entrance, transform: [{ translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }] }]}
        >
          <PixelPanel tone="navy" inner={{ padding: 13, gap: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  borderWidth: 2,
                  borderColor: T.gold,
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text className="font-heavy" style={{ fontSize: 18, color: T.goldLight }}>…</Text>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text className="font-heavy" style={{ fontSize: 12, letterSpacing: 1, color: T.goldLight }}>
              {phase === 'setup' ? L('GẶP GỠ TẠI ĐỊA ĐIỂM', 'MEET SOMEONE HERE') : phase === 'ielts' ? L('HÀNH TRÌNH IELTS SPEAKING', 'CONTEXTUAL IELTS SPEAKING') : phase === 'conversation' ? L('TRÒ CHUYỆN TỰ DO VỚI AI', 'OPEN AI CONVERSATION') : L('HỘI THOẠI TẠI ĐỊA ĐIỂM', 'IN-CONTEXT CONVERSATION')}
                </Text>
                <Text className="font-heavy" numberOfLines={1} style={{ fontSize: 17, color: T.cream }}>
                  {bi(poi.name, locale)}
                </Text>
                <Text className="font-sans" style={{ fontSize: 14, color: HUD_DIM }}>
                  {role}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={L('Đóng hội thoại', 'Close conversation')}
                onPress={close}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: 'rgba(243,237,225,0.45)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text className="font-heavy" style={{ fontSize: 22, color: T.cream }}>×</Text>
              </Pressable>
            </View>
            <Text className="font-sans" style={{ fontSize: 14, lineHeight: 20, color: T.cream }}>
              {phase === 'setup'
                ? L(`Xin chào! Tôi là ${role}. Bạn có thể tự trò chuyện với AI, luyện IELTS theo địa điểm này hoặc ôn từ vựng.`, `Hi! I'm your ${role}. You can start an open conversation with AI, practise IELTS for this place, or review vocabulary.`)
                : phase === 'speaking'
                  ? L(`Tình huống ${scenarioIndex + 1}/${activeScenarios.length} · Hãy trả lời nhân viên như khi đi du lịch thật.`, `Situation ${scenarioIndex + 1}/${activeScenarios.length} · Reply as you would while travelling.`)
                  : phase === 'conversation'
                    ? L('Bạn có thể hỏi bất cứ điều gì về nơi này hoặc trả lời tự nhiên như đang gặp nhân viên thật.', 'Ask your own questions about this place or respond naturally as if you were speaking to a real staff member.')
                  : phase === 'ielts' && journeyPrompts[journeyIndex]
                    ? L(`Part ${journeyPrompts[journeyIndex]!.part} · Câu ${journeyIndex + 1}/${journeyPrompts.length} · mục tiêu ${targetBand}`, `Part ${journeyPrompts[journeyIndex]!.part} · Question ${journeyIndex + 1}/${journeyPrompts.length} · target ${targetBand}`)
                  : L('Làm thử thách từ vựng để nhận sao, xu và mở điểm tiếp theo.', 'Finish the vocabulary challenge to earn stars, coins, and unlock the next stop.')}
            </Text>
          </PixelPanel>

          <ScrollView
            style={{ maxHeight: Math.max(120, panelHeight - 112), marginTop: 8 }}
            contentContainerStyle={{ paddingBottom: 4, gap: 8 }}
            keyboardShouldPersistTaps="handled"
          >
            {phase === 'setup' ? (
              <SetupCard
                mode={mode}
                onMode={setMode}
                scenarios={scenarios}
                selectedIds={selectedScenarioIds}
                onToggleScenario={toggleScenario}
                targetBand={targetBand}
                onTargetBand={setTargetBand}
                journeyAvailable={journeyPrompts.length > 0}
                vocabulary={journeyVocabulary}
                onStart={startPractice}
                startDisabled={mode === 'ielts' ? journeyPrompts.length === 0 : mode === 'conversation' || mode === 'vocab' ? false : activeScenarios.length === 0}
              />
            ) : phase === 'conversation' ? (
              <TravelConversation key={`${poiId}:${session.runNo}`} context={conversationContext} embedded />
            ) : phase === 'speaking' && activeScenarios[scenarioIndex] ? (
              <VisitSpeakingPractice
                key={`${session.runNo}:${activeScenarios[scenarioIndex]!.id}`}
                poiId={poiId}
                scenario={activeScenarios[scenarioIndex]!}
                staffRole={role}
                index={scenarioIndex + 1}
                total={activeScenarios.length}
                accessToken={accessToken}
                onContinue={advanceScenario}
              />
            ) : phase === 'run' ? (
              <QuestionRunner
                key={String(session.runNo) + (practiceQuestions[0]?.id ?? '')}
                questions={practiceQuestions}
                onAnswer={recordAnswer}
                onFinish={finish}
                finishLabel={L('Nhận thưởng', 'See rewards')}
              />
            ) : phase === 'ielts' && journeyPrompts[journeyIndex] ? (
              <VisitSpeakingPractice
                key={`${session.runNo}:${journeyPrompts[journeyIndex]!.id}`}
                poiId={poiId}
                prompt={journeyPrompts[journeyIndex]!}
                targetBand={targetBand}
                partStart={journeyIndex === 0 || journeyPrompts[journeyIndex - 1]?.part !== journeyPrompts[journeyIndex]!.part}
                staffRole={role}
                index={journeyIndex + 1}
                total={journeyPrompts.length}
                accessToken={accessToken}
                onContinue={advanceIeltsJourney}
              />
            ) : outcome ? (
              <ResultCard
                outcome={outcome}
                onReplay={replay}
                onClose={close}
                vocabulary={mode === 'ielts' ? journeyVocabulary : undefined}
              />
            ) : null}
          </ScrollView>
        </Animated.View>
      </View>
    </>
  );
}

const HUD_DIM = '#BBC3D1';

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function EscapeToClose({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);
  return null;
}

function SetupCard({
  mode,
  onMode,
  scenarios,
  selectedIds,
  onToggleScenario,
  targetBand,
  onTargetBand,
  journeyAvailable,
  vocabulary,
  onStart,
  startDisabled,
}: {
  mode: PracticeMode;
  onMode: (mode: PracticeMode) => void;
  scenarios: ReplyScenario[];
  selectedIds: string[];
  onToggleScenario: (id: string) => void;
  targetBand: SpeakingTargetBand;
  onTargetBand: (band: SpeakingTargetBand) => void;
  journeyAvailable: boolean;
  vocabulary: ContextualVocabularyItem[];
  onStart: () => void;
  startDisabled: boolean;
}) {
  const { L, locale } = useL();
  const choices: { id: PracticeMode; vi: string; en: string; noteVi: string; noteEn: string }[] = [
    { id: 'conversation', vi: 'Trò chuyện tự do với AI', en: 'Open AI conversation', noteVi: 'Tự hỏi, trả lời và dẫn dắt hội thoại với nhân viên AI.', noteEn: 'Ask your own questions and lead a conversation with the AI staff member.' },
    { id: 'ielts', vi: 'Hành trình IELTS', en: 'Contextual IELTS', noteVi: 'Đi trọn Part 1 → cue card Part 2 → Part 3 ngay tại địa điểm này.', noteEn: 'Follow Part 1 → Part 2 cue card → Part 3 in this location.' },
    { id: 'speaking', vi: 'Luyện speaking', en: 'Speaking', noteVi: 'Nghe, trả lời, nhận góp ý và thử lại.', noteEn: 'Listen, reply, get feedback, and try again.' },
    { id: 'vocab', vi: 'Ôn từ vựng', en: 'Vocabulary', noteVi: 'Ôn từ qua thử thách tại địa điểm.', noteEn: 'Review words with a place-based challenge.' },
    { id: 'both', vi: 'Kết hợp cả hai', en: 'Both', noteVi: 'Luyện hội thoại rồi làm thử thách từ.', noteEn: 'Practise the dialogue, then review vocabulary.' },
  ];

  return (
    <PixelPanel inner={{ padding: 16, gap: 13 }}>
      <View>
        <Text className="font-heavy" style={{ fontSize: 19, color: T.ink }}>
          {L('Hôm nay bạn muốn học gì?', 'What would you like to practise?')}
        </Text>
        <Text className="font-sans" style={{ fontSize: 14, lineHeight: 20, color: T.muted, marginTop: 3 }}>
          {mode === 'ielts'
            ? L('Luyện theo một mạch hội thoại, dùng câu hỏi gắn với địa điểm và câu chuyện của bạn.', 'Practise one connected conversation with questions tied to this place and your own story.')
            : mode === 'conversation'
              ? L('Tự mở lời, hỏi điều bạn thật sự muốn biết và trò chuyện tiếp theo phản hồi của nhân vật.', 'Start the conversation yourself, ask what you really want to know, and keep it going from the character’s replies.')
              : L('Bạn có thể chọn tối đa 3 tình huống trong cùng một địa điểm.', 'Choose up to three situations at this location.')}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {choices.filter((choice) => choice.id !== 'ielts' || journeyAvailable).map((choice) => {
          const selected = mode === choice.id;
          return (
            <Pressable
              key={choice.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onMode(choice.id)}
              style={{ flexGrow: 1, flexBasis: 180, minHeight: 82, padding: 12, borderRadius: 9, borderWidth: 2, borderColor: selected ? T.goldDark : T.line, backgroundColor: selected ? 'rgba(183,139,57,0.13)' : '#FFFFFF', gap: 4 }}
            >
              <Text className="font-heavy" style={{ fontSize: 15, color: T.ink }}>{L(choice.vi, choice.en)}</Text>
              <Text className="font-sans" style={{ fontSize: 12.5, lineHeight: 17, color: T.muted }}>{L(choice.noteVi, choice.noteEn)}</Text>
            </Pressable>
          );
        })}
      </View>

      {mode === 'ielts' ? (
        <View style={{ gap: 8 }}>
          <Text className="font-strong" style={{ fontSize: 14, color: T.goldDark }}>
            {L('Band mục tiêu · chỉ điều chỉnh độ sâu câu hỏi, không quyết định điểm chấm', 'Target band · adjusts question depth, never your score')}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {(['5.5-6', '7', '8-9'] as const).map((band) => {
              const selected = targetBand === band;
              return (
                <Pressable
                  key={band}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  onPress={() => onTargetBand(band)}
                  style={{ minHeight: 44, minWidth: 88, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 15, borderRadius: 8, borderWidth: 1.5, borderColor: selected ? T.goldDark : T.line, backgroundColor: selected ? 'rgba(183,139,57,0.14)' : '#FFFFFF' }}
                >
                  <Text className="font-heavy" style={{ color: selected ? T.goldDark : T.ink, fontSize: 14 }}>{band}</Text>
                </Pressable>
              );
            })}
          </View>
          <Text className="font-sans" style={{ fontSize: 13, lineHeight: 18, color: T.muted }}>
            {L('Câu hỏi gắn với nơi bạn đang đứng. Part 2 có 1 phút chuẩn bị và tối đa 2 phút nói; câu Part 3 nối tiếp chủ đề bạn vừa kể.', 'Questions are tied to this place. Part 2 gives you one minute to prepare and up to two minutes to speak; Part 3 follows the story you just told.')}
          </Text>
          <View style={{ padding: 11, borderRadius: 8, backgroundColor: 'rgba(183,139,57,0.08)', gap: 5 }}>
            <Text className="font-strong" style={{ fontSize: 13, color: T.goldDark }}>{L('Cụm từ theo bối cảnh', 'Phrases for this setting')}</Text>
            {vocabulary.map((item) => (
                <Text key={item.phrase} className="font-sans" style={{ color: T.ink, fontSize: 13, lineHeight: 18 }}>
                <Text className="font-semi">{item.phrase}</Text>{' · '}{bi(item.meaning, locale)}
              </Text>
            ))}
          </View>
        </View>
      ) : null}

      {mode === 'speaking' || mode === 'both' ? (
        <View style={{ gap: 8 }}>
          <Text className="font-strong" style={{ fontSize: 14, color: T.goldDark }}>
            {L('Chọn bối cảnh hội thoại', 'Choose conversation situations')}
          </Text>
          {scenarios.map((scenario, index) => {
            const selected = selectedIds.includes(scenario.id);
            return (
              <Pressable
                key={scenario.id}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected }}
                onPress={() => onToggleScenario(scenario.id)}
                style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 11, borderRadius: 8, borderWidth: 1.5, borderColor: selected ? T.goldDark : T.line, backgroundColor: selected ? 'rgba(183,139,57,0.12)' : '#FFFFFF' }}
              >
                <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: selected ? T.goldDark : T.muted, backgroundColor: selected ? T.goldDark : 'transparent', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
                  <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '800' }}>{selected ? '✓' : index + 1}</Text>
                </View>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text className="font-semi" style={{ fontSize: 14, color: T.ink }}>{scenario.setup}</Text>
                  <Text className="font-sans" style={{ fontSize: 14, lineHeight: 19, color: T.goldDark }}>{'“'}{scenario.line}{'”'}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <GameButton
        label={mode === 'vocab' ? L('Bắt đầu ôn từ', 'Start vocabulary practice') : L('Bắt đầu luyện', 'Start practice')}
        onPress={onStart}
        disabled={startDisabled}
      />
    </PixelPanel>
  );
}

function ResultCard({
  outcome,
  onReplay,
  onClose,
  vocabulary,
}: {
  outcome: Outcome;
  onReplay: () => void;
  onClose: () => void;
  vocabulary?: ContextualVocabularyItem[];
}) {
  const { L, locale } = useL();
  const { result, correct, total } = outcome;
  const souvenir = result.souvenir ? getSouvenir(result.souvenir) : undefined;
  const title =
    result.stars === 3 ? L('Xuất sắc!', 'Excellent!') : result.stars === 2 ? L('Đạt!', 'Passed!') : L('Lượt sau sẽ tốt hơn', 'Keep practising');

  return (
    <PixelPanel tone="navy" inner={{ padding: 20, gap: 12, alignItems: 'center' }}>
      <Text className="font-heavy" style={{ fontSize: 24, color: T.goldLight, textAlign: 'center' }}>
        {title}
      </Text>
      <StarsRow n={result.stars} size={28} />
      <Text className="font-strong" style={{ fontSize: 16, color: T.cream }}>
        {L(correct + '/' + total + ' câu đúng', correct + '/' + total + ' correct')}
      </Text>
      {vocabulary?.length ? (
        <View style={{ alignSelf: 'stretch', padding: 12, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.08)', gap: 5 }}>
          <Text className="font-heavy" style={{ color: T.goldLight, fontSize: 14 }}>{L('Ôn lại cụm từ tại địa điểm này', 'Review phrases from this location')}</Text>
          {vocabulary.slice(0, 4).map((item) => (
              <Text key={item.phrase} className="font-sans" style={{ color: T.cream, fontSize: 13, lineHeight: 18 }}>
              <Text className="font-semi">{item.phrase}</Text>{' · '}{bi(item.meaning, locale)}
            </Text>
          ))}
        </View>
      ) : null}
      {result.coins > 0 ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <CoinGlyph size={22} />
          <Text className="font-heavy" style={{ fontSize: 18, color: T.goldLight }}>+{result.coins}</Text>
        </View>
      ) : null}
      {souvenir ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: T.paper, padding: 10, borderRadius: 6 }}>
          <Text style={{ fontSize: 28 }}>{souvenir.glyph}</Text>
          <View>
            <Text className="font-strong" style={{ fontSize: 15, color: T.ink }}>{bi(souvenir.name, locale)}</Text>
            <Text className="font-sans" style={{ fontSize: 14, color: T.muted }}>{L('Quà mới trong vali', 'New in your suitcase')}</Text>
          </View>
        </View>
      ) : null}
      {result.stamp ? (
        <View style={{ alignItems: 'center', gap: 4 }}>
          <StampGlyph size={64} color={T.goldLight} />
          <Text className="font-heavy" style={{ fontSize: 15, color: T.goldLight, textAlign: 'center' }}>
            {L('Đã nhận con dấu ', 'Passport stamp: ') + bi(CITIES[result.stamp].name, locale) + ' · +' + result.bonusTickets + ' ' + L('vé', 'tickets')}
          </Text>
        </View>
      ) : null}
      {result.passed ? (
        <Text className="font-sans" style={{ fontSize: 14, lineHeight: 20, textAlign: 'center', color: T.cream }}>
          {L('Điểm tiếp theo đã được mở trên bản đồ.', 'The next stop is now open on the map.')}
        </Text>
      ) : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginTop: 4 }}>
        <GameButton tone="paper" label={L('Luyện lại', 'Play again')} onPress={onReplay} />
        <GameButton label={L('Trở lại bản đồ', 'Back to the map')} onPress={onClose} />
      </View>
    </PixelPanel>
  );
}
