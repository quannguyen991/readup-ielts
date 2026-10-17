import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { HistoryImmersiveStage } from '@/components/history/HistoryImmersiveStage';
import { glossKey } from '@/components/history/SceneReader';
import { QuestionsCard, SceneSources, VocabCard } from '@/components/history/SceneExtras';
import { Card, Chip, H, LinkButton } from '@/components/history/ui';
import { useNarration, type Narration } from '@/components/history/useNarration';
import { VerificationPanel } from '@/components/history/VerificationPanel';
import { Screen } from '@/components/layout/Screen';
import { WordPopover } from '@/components/reader/WordPopover';
import type { WordPick } from '@/components/reader/HoverGloss';
import { devEnabled, getBundle } from '@/data/history';
import { useL } from '@/i18n/useL';
import { readingFont, useReadingFonts } from '@/lib/readingFonts';
import { playSfx } from '@/services/audio/sfx-ui';
import { neighbour, narrationLangs } from '@/services/history/audio-core';
import { indexClaims, visibleScenes } from '@/services/history/gating';
import { completedCount, resumeScene } from '@/services/history/progress';
import { HISTORY_DISCLAIMER, type DisplayLang, type Scene, type TopicBundle } from '@/services/history/types';
import { useHistoryStore } from '@/store/useHistoryStore';

const WEB = Platform.OS === 'web';

/**
 * /history/[topic] — một chủ đề lịch sử song ngữ. Mỗi cảnh có khung video toàn màn hình,
 * lời kể/timeline ở trên và script song ngữ ở khu vực cuộn ngay bên dưới.
 * Dữ liệu đi qua cổng xuất bản (`services/history/gating.ts`); trang không chứa chữ lịch sử nào.
 */
export default function HistoryTopicRoute() {
  const { topic, scene, dev } = useLocalSearchParams<{ topic?: string; scene?: string; dev?: string }>();
  useReadingFonts();
  const { L } = useL();
  const isDev = devEnabled(dev);
  const id = Array.isArray(topic) ? topic[0] : topic;
  const sceneParam = Array.isArray(scene) ? scene[0] : scene;
  const bundle = id ? getBundle(id, isDev) : undefined;
  const scenes = useMemo(() => (bundle ? visibleScenes(bundle) : []), [bundle]);

  if (!bundle) {
    return (
      <Screen>
        <Card style={{ maxWidth: 520, alignSelf: 'center' }}>
          <Text style={{ fontFamily: readingFont.display, fontWeight: '700', fontSize: 24, color: H.ink }}>{L('Không tìm thấy chủ đề này', 'We could not find this topic')}</Text>
          <Text style={{ marginTop: 8, fontFamily: readingFont.sans, fontSize: 14.5, lineHeight: 22, color: H.muted }}>{L('Chủ đề có thể chưa được xuất bản.', 'It may not be published yet.')}</Text>
          <LinkButton style={{ marginTop: 16, alignSelf: 'flex-start' }} strong label={L('Về mục Lịch sử', 'Back to History')} onPress={() => router.replace('/history' as never)} />
        </Card>
      </Screen>
    );
  }
  if (scenes.length === 0) {
    return (
      <Screen>
        <Card style={{ maxWidth: 640, alignSelf: 'center', gap: 10 }}>
          <Chip tone="warn" label={L('Sắp ra mắt', 'Coming soon')} />
          <Text style={{ fontFamily: readingFont.display, fontWeight: '700', fontSize: 28, lineHeight: 36, color: H.ink }}>{bundle.topic.titleVi}</Text>
          <Text style={{ fontFamily: readingFont.literata, fontStyle: 'italic', fontSize: 17, color: H.muted }}>{bundle.topic.titleEn}</Text>
          <Text style={{ fontFamily: readingFont.sans, fontSize: 14.5, lineHeight: 22, color: H.body }}>
            {L('Chủ đề này đang được biên soạn và kiểm chứng nguồn. Chưa có cảnh nào được xuất bản.', 'This topic is still being written and fact-checked. No scene has been published yet.')}
          </Text>
          <LinkButton style={{ alignSelf: 'flex-start' }} label={L('Về mục Lịch sử', 'Back to History')} onPress={() => router.replace('/history' as never)} />
        </Card>
      </Screen>
    );
  }
  return <TopicView key={bundle.topic.id} bundle={bundle} scenes={scenes} sceneParam={sceneParam} dev={isDev} />;
}

function TopicView({ bundle, scenes, sceneParam, dev }: { bundle: TopicBundle; scenes: Scene[]; sceneParam?: string; dev: boolean }) {
  const { L, en } = useL();
  const { width } = useWindowDimensions();
  const wide = width >= 1100;
  const topic = bundle.topic;
  const ids = useMemo(() => scenes.map((s) => s.id), [scenes]);
  const claims = useMemo(() => indexClaims(bundle.claims), [bundle]);

  const prefs = useHistoryStore((s) => s.prefs);
  const setPrefs = useHistoryStore((s) => s.setPrefs);
  const progress = useHistoryStore((s) => s.topics[topic.id]);
  const openScene = useHistoryStore((s) => s.open);
  const completeScene = useHistoryStore((s) => s.complete);
  const answer = useHistoryStore((s) => s.answer);

  const [activeId, setActiveId] = useState<string>(() => {
    if (sceneParam && ids.includes(sceneParam)) return sceneParam;
    return resumeScene({ topics: useHistoryStore.getState().topics }, topic.id, ids) ?? ids[0]!;
  });
  const scene = scenes.find((s) => s.id === activeId) ?? scenes[0]!;
  const completed = useMemo(() => new Set(ids.filter((id) => progress?.scenes[id]?.completedAt)), [ids, progress]);
  const answers = progress?.scenes[scene.id]?.answers ?? {};

  const [evidence, setEvidence] = useState<string | null>(null);
  const [pick, setPick] = useState<(WordPick & { paragraph: number }) | null>(null);
  const [goalsOpen, setGoalsOpen] = useState(wide);
  const [fontSize] = useState(17);

  // Nghĩa soạn riêng của cảnh cho thẻ tra từ (khớp danh sách "Từ vựng của cảnh"); từ khác rơi về từ điển chung.
  const wordTable = useMemo(
    () => Object.fromEntries(scene.vocab.map((v) => [glossKey(v.word), { ipa: v.ipa, pos: v.pos, defEn: '', meaningVi: v.meaningVi, example: '', synonyms: [] as string[] }])),
    [scene],
  );
  const sources = useMemo(() => scene.sourceIds.map((id) => bundle.sources.find((s) => s.id === id)).filter((s): s is NonNullable<typeof s> => !!s), [bundle, scene]);

  const goTo = useCallback(
    (id: string, scroll = true) => {
      setActiveId(id);
      setEvidence(null);
      setPick(null);
      try {
        router.setParams({ scene: id });
      } catch {
        /* màn chưa gắn xong — bỏ qua */
      }
      if (scroll && WEB && typeof document !== 'undefined') {
        requestAnimationFrame(() => {
          const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
          document.getElementById('history-timeline')?.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
        });
      }
    },
    [],
  );

  // Điều hướng ngoài (back / liên kết ?scene=) đổi cảnh theo — xử lý ngay trong lượt vẽ.
  const [seenParam, setSeenParam] = useState(sceneParam);
  if (sceneParam !== seenParam) {
    setSeenParam(sceneParam);
    if (sceneParam && ids.includes(sceneParam) && sceneParam !== activeId) {
      setActiveId(sceneParam);
      setEvidence(null);
    }
  }
  // Ghi nhận cảnh đang mở (mọi đường đổi cảnh đều đi qua đây).
  useEffect(() => {
    openScene(topic.id, scene.id);
  }, [openScene, topic.id, scene.id]);

  const narRef = useRef<Narration | null>(null);
  const nar = useNarration({
    topic,
    scenes,
    sceneId: scene.id,
    lang: prefs.narrationLang,
    speed: prefs.speed,
    onSceneChange: (id) => goTo(id),
    onEnded: (id) => {
      completeScene(topic.id, id);
      if (useHistoryStore.getState().prefs.autoAdvance) {
        const n = neighbour(ids, id, 1);
        if (n) narRef.current?.playScene(n);
      }
    },
  });
  useEffect(() => {
    narRef.current = nar;
  });

  const prevId = neighbour(ids, scene.id, -1);
  const nextId = neighbour(ids, scene.id, 1);
  /** Bấm cảnh trên dòng thời gian / thanh phát: mở cảnh và nghe từ đầu (thao tác của người dùng, không phải tự phát). */
  const listen = (id: string) => {
    const target = scenes.find((s) => s.id === id);
    if (target && narrationLangs(target).length > 0) nar.playScene(id);
    else goTo(id);
  };
  /** Bấm cảnh trước/sau ở cuối khu đọc: chỉ chuyển cảnh; đã bật thuyết minh thì nghe tiếp. */
  const step = (id: string) => (nar.armed ? listen(id) : goTo(id));

  const done = completedCount({ topics: { [topic.id]: progress ?? { updatedAt: '', scenes: {} } } }, topic.id, topic.sceneIds);
  const displayLang = prefs.displayLang;
  const playingScene = nar.playing;

  return (
    <ScrollView
      className="flex-1"
      style={[
        { backgroundColor: '#F2F0E9' },
        WEB ? ({
          backgroundImage: 'linear-gradient(rgba(134,116,78,.065) 1px, transparent 1px), linear-gradient(90deg, rgba(134,116,78,.065) 1px, transparent 1px)',
          backgroundSize: '36px 36px',
        } as object) : null,
      ]}
      contentContainerStyle={[
        { paddingBottom: 36, backgroundColor: '#F2F0E9' },
        WEB ? ({
          backgroundImage: 'linear-gradient(rgba(134,116,78,.065) 1px, transparent 1px), linear-gradient(90deg, rgba(134,116,78,.065) 1px, transparent 1px)',
          backgroundSize: '36px 36px',
        } as object) : null,
      ]}
      showsVerticalScrollIndicator={false}
    >
      {dev && topic.id === 'dev-fixture' ? (
        <View style={{ alignSelf: 'center', marginTop: 12, maxWidth: 1160, width: '94%', backgroundColor: '#FDE7E4', borderRadius: 12, padding: 10 }}>
          <Text style={{ fontFamily: readingFont.sansBold, fontSize: 13, color: '#8A2A1C' }}>DEV FIXTURE — dữ liệu mẫu dựng giao diện, KHÔNG phải nội dung lịch sử.</Text>
        </View>
      ) : null}

      <HistoryImmersiveStage
        topic={topic}
        scene={scene}
        scenes={scenes}
        activeId={scene.id}
        completed={completed}
        playingId={nar.playing || nar.tts ? scene.id : null}
        playingScene={playingScene}
        displayLang={displayLang}
        onDisplayLang={(v) => setPrefs({ displayLang: v })}
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/history' as never))}
        onSceneSelect={(id) => listen(id)}
        fontSize={fontSize}
        playingParagraph={nar.paragraphId}
        evidenceParagraph={evidence}
        onWord={(paragraph) => (p) => setPick({ ...p, paragraph })}
        nar={nar}
        total={topic.sceneIds.length}
        speed={prefs.speed}
        onSpeed={(s) => setPrefs({ speed: s })}
        onNarrationLang={(l) => setPrefs({ narrationLang: l })}
        autoAdvance={prefs.autoAdvance}
        onAutoAdvance={(on) => setPrefs({ autoAdvance: on })}
        onPrev={prevId ? () => listen(prevId) : null}
        onNext={nextId ? () => listen(nextId) : null}
      />

      <View
        pointerEvents="none"
        style={[
          { height: 34, marginTop: -34 },
          WEB
            ? ({ backgroundImage: 'linear-gradient(180deg, rgba(242,240,233,0), #F2F0E9)' } as object)
            : { backgroundColor: '#F2F0E9' },
        ]}
      />

      <View style={{ width: '100%', maxWidth: 1160, alignSelf: 'center', paddingHorizontal: width < 640 ? 16 : 28, paddingTop: 28, gap: 16 }}>
        <Card style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Chip tone="accent" label={topic.periodLabel} />
            <Text style={{ fontFamily: readingFont.sansSemi, fontSize: 12.5, color: H.muted }}>
              {L(`Đã đọc ${done}/${topic.sceneIds.length} cảnh · ${scenes.length}/${topic.sceneIds.length} cảnh sẵn sàng`, `${done}/${topic.sceneIds.length} scenes read · ${scenes.length}/${topic.sceneIds.length} scenes ready`)}
            </Text>
          </View>
          <Text accessibilityRole="header" style={{ fontFamily: readingFont.display, fontWeight: '700', fontSize: wide ? 32 : 27, lineHeight: wide ? 40 : 35, letterSpacing: -0.45, color: H.ink }}>
            {topic.titleVi}
          </Text>
          <Text style={{ fontFamily: readingFont.literata, fontStyle: 'italic', fontSize: wide ? 19 : 16, lineHeight: wide ? 26 : 23, color: H.muted }}>{topic.titleEn}</Text>
          <Text style={{ fontFamily: readingFont.sans, fontSize: 15, lineHeight: 23, color: H.body }}>{en ? topic.summary.en : topic.summary.vi}</Text>

          <Pressable accessibilityRole="button" aria-expanded={goalsOpen} onPress={() => setGoalsOpen((o) => !o)} style={{ minHeight: 44, justifyContent: 'center' }}>
            <Text style={{ fontFamily: readingFont.sansBold, fontSize: 14, color: H.ink }}>
              {L('Bạn sẽ học được gì', 'What you will learn')} {goalsOpen ? '−' : '+'}
            </Text>
          </Pressable>
          {goalsOpen ? (
            <View style={{ gap: 6 }}>
              {topic.objectives.map((o, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: 8 }}>
                  <Text style={{ color: H.accent, fontFamily: readingFont.sansBold }}>•</Text>
                  <Text style={{ flex: 1, fontFamily: readingFont.sans, fontSize: 14.5, lineHeight: 21, color: H.body }}>{en ? o.en : o.vi}</Text>
                </View>
              ))}
            </View>
          ) : null}
          <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: topic.sceneIds.length, now: done }} style={{ height: 5, borderRadius: 3, backgroundColor: H.tint }}>
            <View style={{ width: `${(done / topic.sceneIds.length) * 100}%`, height: 5, borderRadius: 3, backgroundColor: H.accent }} />
          </View>
        </Card>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
          {completed.has(scene.id) ? (
            <Chip tone="good" label={L('✓ Đã đọc xong cảnh này', '✓ Scene read')} />
          ) : (
            <LinkButton
              label={L('Đánh dấu đã đọc xong', 'Mark as read')}
              onPress={() => {
                playSfx('success');
                completeScene(topic.id, scene.id);
              }}
            />
          )}
          <View style={{ flex: 1 }} />
          <LinkButton label={`← ${L('Cảnh trước', 'Previous')}`} disabled={!prevId} onPress={() => prevId && step(prevId)} />
          <LinkButton strong label={`${L('Cảnh sau', 'Next')} →`} disabled={!nextId} onPress={() => nextId && step(nextId)} />
        </View>

        <VocabCard scene={scene} />
        <QuestionsCard
          scene={scene}
          lang={displayLang}
          answers={answers}
          onEvidence={setEvidence}
          onAnswer={(qid, choice) => answer(topic.id, scene.id, qid, choice)}
        />
        <SceneSources scene={scene} sources={sources} claims={claims} />
        <VerificationPanel bundle={bundle} scenes={scenes} />
        <Text style={{ marginTop: 2, marginBottom: 12, fontFamily: readingFont.sans, fontSize: 12.5, lineHeight: 19, color: H.muted, textAlign: 'center' }}>{L(HISTORY_DISCLAIMER.vi, HISTORY_DISCLAIMER.en)}</Text>
      </View>

      <WordPopover pick={pick} table={wordTable} articleId={`history:${scene.id}`} articleTitle={scene.titleEn} paragraphIndex={pick?.paragraph ?? null} onClose={() => setPick(null)} />
    </ScrollView>
  );
}
