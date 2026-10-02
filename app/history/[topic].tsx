import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { HistoryImage } from '@/components/history/HistoryImage';
import { NarrationPlayer } from '@/components/history/NarrationPlayer';
import { glossKey, SceneReader } from '@/components/history/SceneReader';
import { QuestionsCard, SceneSources, VocabCard } from '@/components/history/SceneExtras';
import { SceneTimeline } from '@/components/history/SceneTimeline';
import { Card, Chip, H, LinkButton, Segmented } from '@/components/history/ui';
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
import { HISTORY_DISCLAIMER, IMAGE_CREDIT, IMAGE_CREDIT_EN, type DisplayLang, type Scene, type TopicBundle } from '@/services/history/types';
import { useHistoryStore } from '@/store/useHistoryStore';

const WEB = Platform.OS === 'web';

/**
 * /history/[topic] — một chủ đề lịch sử song ngữ. Mỗi lần xem MỘT cảnh: dòng thời gian ở trên, khu đọc song
 * ngữ bên trái, ảnh dính bên phải (màn ≥ 1100px) hoặc ảnh phía trên cảnh (điện thoại), thanh thuyết minh dính
 * đáy. Dữ liệu đi qua cổng xuất bản (`services/history/gating.ts`); trang không chứa chữ lịch sử nào.
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
          <Text style={{ fontFamily: readingFont.sansHeavy, fontSize: 22, color: H.ink }}>{L('Không tìm thấy chủ đề này', 'We could not find this topic')}</Text>
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
          <Text style={{ fontFamily: readingFont.sansHeavy, fontSize: 26, lineHeight: 32, color: H.ink }}>{bundle.topic.titleVi}</Text>
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

  const done = completedCount({ topics: { [topic.id]: progress ?? { updatedAt: '', scenes: {} } } }, topic.id, ids);
  const displayLang = prefs.displayLang;
  const rightW = Math.min(460, Math.max(340, Math.round((width - 248 - 96) * 0.4)));
  const playingScene = nar.playing;

  const imageCard = scene.image ? (
    <View style={wide ? ({ position: 'sticky', top: 24, width: rightW, alignSelf: 'flex-start', gap: 10 } as object) : { gap: 10 }}>
      <HistoryImage file={scene.image.file} alt={en ? scene.image.altEn : scene.image.altVi}>
        <View pointerEvents="none" style={{ position: 'absolute', left: 10, top: 10, flexDirection: 'row', gap: 6 }}>
          <Chip label={`${L('Cảnh', 'Scene')} ${scene.n}`} tone="accent" />
          {playingScene ? <Chip label={L('Đang nghe', 'Playing')} tone="good" /> : null}
        </View>
      </HistoryImage>
      <View style={{ gap: 4, paddingHorizontal: 4 }}>
        <Text style={{ fontFamily: readingFont.sansSemi, fontSize: 14, lineHeight: 20, color: H.body }}>
          {displayLang === 'en' ? scene.image.captionEn : scene.image.captionVi}
        </Text>
        {displayLang === 'both' ? <Text style={{ fontFamily: readingFont.literata, fontStyle: 'italic', fontSize: 13, lineHeight: 19, color: H.muted }}>{scene.image.captionEn}</Text> : null}
        {scene.image.isGeneralIllustration ? (
          <Text style={{ fontFamily: readingFont.sansSemi, fontSize: 12.5, color: H.warn }}>
            {L('Minh hoạ khái quát một giai đoạn, không phải một ngày cụ thể.', 'A general illustration of a period, not one specific day.')}
          </Text>
        ) : null}
        <Text style={{ fontFamily: readingFont.sans, fontSize: 12, color: H.muted }}>{displayLang === 'en' ? IMAGE_CREDIT_EN : scene.image.credit || IMAGE_CREDIT}</Text>
      </View>
    </View>
  ) : null;

  return (
    <Screen>
      {dev && topic.id === 'dev-fixture' ? (
        <View style={{ marginBottom: 12, backgroundColor: '#FDE7E4', borderRadius: 12, padding: 10 }}>
          <Text style={{ fontFamily: readingFont.sansBold, fontSize: 13, color: '#8A2A1C' }}>DEV FIXTURE — dữ liệu mẫu dựng giao diện, KHÔNG phải nội dung lịch sử.</Text>
        </View>
      ) : null}

      {/* ---------------------------------------------------------- đầu trang */}
      <Card style={{ gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Pressable accessibilityRole="link" onPress={() => (router.canGoBack() ? router.back() : router.replace('/history' as never))} style={{ minHeight: 44, justifyContent: 'center' }}>
            <Text style={{ fontFamily: readingFont.sansBold, fontSize: 13.5, color: H.accent }}>← {L('Lịch sử Việt Nam', 'Vietnamese history')}</Text>
          </Pressable>
          <Chip tone="accent" label={topic.periodLabel} />
        </View>
        <Text accessibilityRole="header" style={{ fontFamily: readingFont.sansHeavy, fontSize: wide ? 34 : 26, lineHeight: wide ? 40 : 32, letterSpacing: -0.7, color: H.ink }}>
          {topic.titleVi}
        </Text>
        <Text style={{ fontFamily: readingFont.literata, fontStyle: 'italic', fontSize: wide ? 20 : 17, lineHeight: wide ? 28 : 24, color: H.muted }}>{topic.titleEn}</Text>
        <Text style={{ fontFamily: readingFont.sans, fontSize: 15, lineHeight: 23, color: H.body, maxWidth: 780 }}>{en ? topic.summary.en : topic.summary.vi}</Text>

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

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <View style={{ flexGrow: 1, flexBasis: 200, maxWidth: 420, gap: 4 }}>
            <Text style={{ fontFamily: readingFont.sansSemi, fontSize: 12.5, color: H.muted }}>
              {L(`Đã đọc ${done}/${scenes.length} cảnh`, `${done}/${scenes.length} scenes read`)}
            </Text>
            <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: scenes.length, now: done }} style={{ height: 6, borderRadius: 3, backgroundColor: H.tint }}>
              <View style={{ width: `${(done / scenes.length) * 100}%`, height: 6, borderRadius: 3, backgroundColor: H.accent }} />
            </View>
          </View>
        </View>
      </Card>

      {/* ----------------------------------------------------- dòng thời gian */}
      <View nativeID="history-timeline" style={{ marginTop: 16 }}>
        <SceneTimeline scenes={scenes} activeId={scene.id} playingId={nar.playing || nar.tts ? scene.id : null} completed={completed} onSelect={(id) => listen(id)} />
      </View>

      {/* ----------------------------------------------------------- nội dung */}
      <View style={{ marginTop: 12, flexDirection: wide ? 'row' : 'column', gap: wide ? 28 : 16, alignItems: 'flex-start' }}>
        <View style={{ flex: wide ? 1 : undefined, width: wide ? undefined : '100%', minWidth: 0, gap: 16 }}>
          {/* điện thoại: không hiện ảnh (người dùng muốn nhẹ, tập trung chữ + nghe) */}

          <Segmented<DisplayLang>
            label={L('Ngôn ngữ hiển thị', 'Display language')}
            value={displayLang}
            onChange={(v) => setPrefs({ displayLang: v })}
            options={[
              { key: 'en', label: 'English' },
              { key: 'vi', label: 'Tiếng Việt' },
              { key: 'both', label: L('Song ngữ', 'Bilingual') },
            ]}
          />

          <SceneReader
            scene={scene}
            total={scenes.length}
            lang={displayLang}
            fontSize={fontSize}
            playingParagraph={nar.paragraphId}
            playingScene={playingScene}
            evidenceParagraph={evidence}
            onWord={(paragraph) => (p) => setPick({ ...p, paragraph })}
          />

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
        </View>

        {wide ? imageCard : null}
      </View>

      <View style={{ marginTop: 20 }}>
        <VerificationPanel bundle={bundle} scenes={scenes} />
      </View>

      <Text style={{ marginTop: 18, fontFamily: readingFont.sans, fontSize: 12.5, lineHeight: 19, color: H.muted, textAlign: 'center' }}>{L(HISTORY_DISCLAIMER.vi, HISTORY_DISCLAIMER.en)}</Text>

      {/* Phải là con TRỰC TIẾP của khung cuộn thì `position: sticky` mới dính đáy suốt trang. */}
      <NarrationPlayer
          nar={nar}
          scene={scene}
          total={scenes.length}
          speed={prefs.speed}
          onSpeed={(s) => setPrefs({ speed: s })}
          lang={nar.lang}
          onLang={(l) => setPrefs({ narrationLang: l })}
          autoAdvance={prefs.autoAdvance}
          onAutoAdvance={(on) => setPrefs({ autoAdvance: on })}
          onPrev={prevId ? () => listen(prevId) : null}
          onNext={nextId ? () => listen(nextId) : null}
        />

      <WordPopover pick={pick} table={wordTable} articleId={`history:${scene.id}`} articleTitle={scene.titleEn} paragraphIndex={pick?.paragraph ?? null} onClose={() => setPick(null)} />
    </Screen>
  );
}

