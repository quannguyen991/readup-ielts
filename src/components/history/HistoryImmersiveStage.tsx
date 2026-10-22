import React from 'react';
import { Platform, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { useIsFocused } from 'expo-router';

import { Icon } from '@/components/ui';
import { useL } from '@/i18n/useL';
import { readingFont } from '@/lib/readingFonts';
import type { DisplayLang, NarrationLang, Scene, Topic } from '@/services/history/types';
import type { WordPick } from '@/components/reader/HoverGloss';

import { HistoryImage } from './HistoryImage';
import { NarrationPlayer } from './NarrationPlayer';
import { SceneAtmosphereToggle } from './SceneAtmosphereToggle';
import { SceneReader } from './SceneReader';
import { SceneTimeline } from './SceneTimeline';
import { HistorySceneFilm } from './HistorySceneFilm';
import { Segmented } from './ui';
import { historyBackgroundSequence } from './sceneBackgrounds';
import type { Narration } from './useNarration';

const WEB = Platform.OS === 'web';

type Props = {
  topic: Topic;
  scene: Scene;
  scenes: Scene[];
  activeId: string;
  completed: ReadonlySet<string>;
  playingId: string | null;
  playingScene: boolean;
  displayLang: DisplayLang;
  onDisplayLang: (value: DisplayLang) => void;
  onBack: () => void;
  onSceneSelect: (id: string) => void;
  fontSize: number;
  playingParagraph: string | null;
  evidenceParagraph: string | null;
  onWord: (paragraphIndex: number) => (pick: WordPick) => void;
  nar: Narration;
  total: number;
  speed: number;
  onSpeed: (speed: number) => void;
  onNarrationLang: (lang: NarrationLang) => void;
  autoAdvance: boolean;
  onAutoAdvance: (enabled: boolean) => void;
  onPrev: (() => void) | null;
  onNext: (() => void) | null;
};

/** Khung video toàn màn hình; phần script song ngữ được đặt ngay dưới để đọc khi cuộn xuống. */
export function HistoryImmersiveStage(props: Props) {
  const {
    topic, scene, scenes, activeId, completed, playingId, playingScene, displayLang,
    onDisplayLang, onBack, onSceneSelect, fontSize, playingParagraph, evidenceParagraph,
    onWord, nar, total, speed, onSpeed, onNarrationLang, autoAdvance, onAutoAdvance, onPrev, onNext,
  } = props;
  const { L, en } = useL();
  const { width, height } = useWindowDimensions();
  const isFocused = useIsFocused();
  const desktop = width >= 900;
  const stageHeight = Math.max(height, 640);
  const panelWidth = desktop ? Math.min(700, Math.max(420, Math.round(width * 0.4))) : Math.max(0, width - 24);
  const timelineLeft = desktop ? panelWidth + 48 : 12;
  const image = scene.image;
  const videoSequence = historyBackgroundSequence(scene.n);
  const videoBase = videoSequence?.[0];
  const playerWidth = Math.min(720, Math.max(0, width - 32));

  return (
    <>
    <View nativeID="history-timeline" style={{ width: '100%', height: stageHeight, ...(WEB ? { minHeight: '100dvh' as never } : { minHeight: stageHeight }), overflow: 'hidden', backgroundColor: '#202119' }}>
      {image ? (
        <HistoryImage
          immersive
          file={image.file}
          alt={en ? image.altEn : image.altVi}
          sceneId={scene.id}
          motion={scene.motion}
          motionActive={isFocused}
          videoBase={videoBase}
          videoSequence={videoSequence}
        >
          <View
            pointerEvents="none"
            style={[
              { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
              WEB
                ? ({
                    backgroundImage:
                      'linear-gradient(90deg, rgba(12,14,13,.44) 0%, rgba(12,14,13,.18) 43%, rgba(12,14,13,0) 76%), linear-gradient(0deg, rgba(9,11,10,.42) 0%, rgba(9,11,10,0) 25%, rgba(9,11,10,0) 84%, rgba(9,11,10,.27) 100%)',
                  } as object)
                : null,
            ]}
          />

          <Pressable
            accessibilityRole="link"
            accessibilityLabel={L('Quay lại mục Lịch sử', 'Back to History')}
            onPress={onBack}
            style={{ position: 'absolute', zIndex: 8, top: 22, left: 22, minHeight: 46, maxWidth: desktop ? panelWidth : '48%', flexDirection: 'row', alignItems: 'center', gap: 9, borderRadius: 16, paddingHorizontal: 13, backgroundColor: 'rgba(16,18,17,.58)', borderWidth: 1, borderColor: 'rgba(255,255,255,.25)' }}
          >
            <Icon name="chevron-left" size={18} color="#F3F0FB" strokeWidth={2.5} />
            <View style={{ minWidth: 0 }}>
              <Text numberOfLines={1} style={{ fontFamily: readingFont.sansBold, fontSize: 13, color: '#F3F0FB' }}>{L('Lịch sử Việt Nam', 'Vietnamese history')}</Text>
              <Text numberOfLines={1} style={{ fontFamily: readingFont.sans, fontSize: 11.5, color: 'rgba(255,248,234,.76)' }}>{topic.periodLabel} · {topic.titleEn}</Text>
            </View>
          </Pressable>

          <View
            style={{
              position: 'absolute', zIndex: 7, top: desktop ? 22 : 80, right: desktop ? undefined : 18, left: timelineLeft, width: desktop ? 396 : undefined,
              paddingHorizontal: 0, paddingVertical: 0,
              backgroundColor: 'transparent', borderWidth: 0,
            }}
          >
            <SceneTimeline scenes={scenes} activeId={activeId} playingId={playingId} completed={completed} onSelect={onSceneSelect} compact />
          </View>

          <View style={{ position: 'absolute', zIndex: 8, left: '50%', bottom: 20, width: playerWidth, transform: [{ translateX: -playerWidth / 2 }] }}>
            <NarrationPlayer
              nar={nar}
              scene={scene}
              total={total}
              speed={speed}
              onSpeed={onSpeed}
              lang={nar.lang}
              onLang={onNarrationLang}
              autoAdvance={autoAdvance}
              onAutoAdvance={onAutoAdvance}
              onPrev={onPrev}
              onNext={onNext}
              immersive
            />
          </View>

          <View style={{ position: 'absolute', zIndex: 8, right: 22, top: 22, maxWidth: desktop ? 360 : 184, alignItems: 'flex-end' }}>
            <SceneAtmosphereToggle sceneId={scene.id} ambience={scene.motion?.ambience} compact={!desktop} screenActive={isFocused} />
          </View>
          <View style={{ position: 'absolute', zIndex: 8, right: 22, bottom: desktop ? 136 : 142, maxWidth: desktop ? 360 : 184, alignItems: 'flex-end', gap: 3 }}>
            <View style={{ alignItems: 'flex-end', gap: 3, maxWidth: '100%' }}>
              <Text numberOfLines={3} style={{ fontFamily: readingFont.sansSemi, fontSize: desktop ? 12.5 : 11, lineHeight: desktop ? 17 : 14, color: '#F3F0FB', textAlign: 'right', textShadowColor: 'rgba(0,0,0,.78)', textShadowRadius: 9 }}>
                {image.captionVi}
              </Text>
              {image.isGeneralIllustration ? (
                <Text style={{ fontFamily: readingFont.sans, fontSize: desktop ? 11 : 10, color: 'rgba(255,249,236,.88)', textAlign: 'right', textShadowColor: 'rgba(0,0,0,.78)', textShadowRadius: 8 }}>
                  Minh hoạ khái quát một giai đoạn.
                </Text>
              ) : null}
              <Text style={{ fontFamily: readingFont.sans, fontSize: desktop ? 10.5 : 9.5, color: 'rgba(255,249,236,.82)', textAlign: 'right', textShadowColor: 'rgba(0,0,0,.78)', textShadowRadius: 8 }}>
                {image.credit || 'Minh họa pixel tái dựng, không phải ảnh tư liệu'}
              </Text>
            </View>
          </View>
        </HistoryImage>
      ) : (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#F3F0FB', fontFamily: readingFont.sansSemi }}>{L('Cảnh này chưa có ảnh minh hoạ.', 'This scene has no illustration yet.')}</Text>
        </View>
      )}
    </View>
    <View nativeID="history-story-script" style={{ width: '100%', alignItems: 'center', paddingHorizontal: width < 640 ? 16 : 28, paddingTop: 26, paddingBottom: 8, gap: 12 }}>
      <View style={{ width: '100%', maxWidth: 980, gap: 12 }}>
        <Segmented<DisplayLang>
          label={L('Ngôn ngữ hiển thị', 'Display language')}
          value={displayLang}
          onChange={onDisplayLang}
          options={[
            { key: 'en', label: 'English' },
            { key: 'vi', label: 'Tiếng Việt' },
            { key: 'both', label: L('Song ngữ', 'Bilingual') },
          ]}
        />
        <SceneReader
          scene={scene}
          total={total}
          lang={displayLang}
          fontSize={fontSize}
          playingParagraph={playingParagraph}
          playingScene={playingScene}
          evidenceParagraph={evidenceParagraph}
          onWord={onWord}
        />
        {scene.video ? <HistorySceneFilm film={scene.video} /> : null}
      </View>
    </View>
    </>
  );
}
