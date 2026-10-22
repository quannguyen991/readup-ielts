import React from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';

import { HistoryImage } from '@/components/history/HistoryImage';
import { NarrationPlayer } from '@/components/history/NarrationPlayer';
import { SceneReader } from '@/components/history/SceneReader';
import { SceneTimeline } from '@/components/history/SceneTimeline';
import { LinkButton, Segmented } from '@/components/history/ui';
import { useL } from '@/i18n/useL';
import { readingFont } from '@/lib/readingFonts';
import type { DisplayLang, NarrationLang, Scene, Topic } from '@/services/history/types';

import type { Narration } from './useNarration';

type Props = {
  topic: Topic;
  scene: Scene;
  scenes: Scene[];
  activeId: string;
  completed: ReadonlySet<string>;
  playingId: string | null;
  playingScene: boolean;
  displayLang: DisplayLang;
  onDisplayLang: (lang: DisplayLang) => void;
  onBack: () => void;
  onSceneSelect: (id: string) => void;
  fontSize: number;
  playingParagraph: string | null;
  evidenceParagraph: string | null;
  onWord: (paragraph: number) => (word: import('@/components/reader/HoverGloss').WordPick) => void;
  nar: Narration;
  total: number;
  speed: number;
  onSpeed: (speed: number) => void;
  onNarrationLang: (lang: NarrationLang) => void;
  autoAdvance: boolean;
  onAutoAdvance: (on: boolean) => void;
  onPrev: (() => void) | null;
  onNext: (() => void) | null;
};

const LANG_OPTIONS: { key: DisplayLang; label: string }[] = [
  { key: 'vi', label: 'Tiếng Việt' },
  { key: 'en', label: 'English' },
  { key: 'both', label: 'Song ngữ' },
];

/** A single-scene cinematic reader: artwork, timeline, narration and paired text stay together. */
export function HistoryCinematicStage({
  topic,
  scene,
  scenes,
  activeId,
  completed,
  playingId,
  playingScene,
  displayLang,
  onDisplayLang,
  onBack,
  onSceneSelect,
  fontSize,
  playingParagraph,
  evidenceParagraph,
  onWord,
  nar,
  total,
  speed,
  onSpeed,
  onNarrationLang,
  autoAdvance,
  onAutoAdvance,
  onPrev,
  onNext,
}: Props) {
  const { L } = useL();
  const { width } = useWindowDimensions();
  const wide = width >= 1000;
  const image = scene.image;

  return (
    <View style={{ width: '100%', backgroundColor: '#171711', paddingTop: 18, paddingBottom: 24 }}>
      <View style={{ width: '94%', maxWidth: 1160, alignSelf: 'center', gap: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={L('Quay lại mục Lịch sử', 'Back to History')}
            onPress={onBack}
            style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: 'rgba(244,239,225,0.42)', alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ color: '#F3F0FB', fontFamily: readingFont.sansBold, fontSize: 21 }}>←</Text>
          </Pressable>
          <View style={{ flex: 1, minWidth: 220 }}>
            <Text style={{ color: '#D5C59D', fontFamily: readingFont.sansBold, fontSize: 12, letterSpacing: 1.2 }}>
              {topic.periodLabel.toUpperCase()} · {L(`CẢNH ${scene.n}/${total}`, `SCENE ${scene.n}/${total}`)}
            </Text>
            <Text numberOfLines={1} style={{ color: '#F3F0FB', fontFamily: readingFont.sansHeavy, fontSize: wide ? 22 : 19, marginTop: 3 }}>
              {scene.titleVi}
            </Text>
          </View>
          <Segmented
            value={displayLang}
            options={LANG_OPTIONS}
            onChange={onDisplayLang}
            label={L('Ngôn ngữ hiển thị', 'Display language')}
          />
        </View>

        <View style={{ flexDirection: wide ? 'row' : 'column', alignItems: 'flex-start', gap: 16 }}>
          <View style={{ flex: 1, width: wide ? undefined : '100%', minWidth: 0, gap: 12 }}>
            <View style={{ overflow: 'hidden', borderRadius: 16, backgroundColor: '#282820', borderWidth: 1, borderColor: 'rgba(225,214,185,0.24)' }}>
              {image ? (
                <HistoryImage file={image.file} alt={displayLang === 'vi' ? image.altVi : image.altEn}>
                  <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: 16, backgroundColor: 'rgba(15,15,13,0.48)' }}>
                    <Text style={{ color: '#F1DDAE', fontFamily: readingFont.sansBold, fontSize: 12, letterSpacing: 0.8 }}>
                      {scene.dateLabel[displayLang === 'vi' ? 'vi' : 'en']}
                    </Text>
                    <Text numberOfLines={2} style={{ color: '#FFFFFF', fontFamily: readingFont.sansHeavy, fontSize: wide ? 24 : 20, lineHeight: wide ? 30 : 26, marginTop: 5 }}>
                      {displayLang === 'en' ? scene.titleEn : scene.titleVi}
                    </Text>
                  </View>
                  <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: 'rgba(15,15,13,0.68)' }}>
                    <Text style={{ color: '#F3F0FB', fontFamily: readingFont.sans, fontSize: 12, lineHeight: 17 }}>
                      {displayLang === 'vi' ? image.captionVi : image.captionEn}
                    </Text>
                    <Text style={{ color: '#D6D0C1', fontFamily: readingFont.sans, fontSize: 10.5, marginTop: 3 }}>
                      {displayLang === 'vi' ? image.credit : image.credit}
                    </Text>
                  </View>
                </HistoryImage>
              ) : (
                <View style={{ aspectRatio: 16 / 9, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                  <Text style={{ color: '#D5C59D', fontFamily: readingFont.sansSemi, textAlign: 'center' }}>
                    {L('Cảnh này chưa có ảnh minh họa.', 'No illustration is available for this scene yet.')}
                  </Text>
                </View>
              )}
            </View>

            <View style={{ paddingHorizontal: 10, paddingVertical: 8, borderRadius: 14, backgroundColor: '#F3F0FB', gap: 8 }}>
              <SceneTimeline scenes={scenes} activeId={activeId} playingId={playingId} completed={completed} onSelect={onSceneSelect} />
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
              />
            </View>
          </View>

          <View style={{ flex: 1, width: wide ? undefined : '100%', minWidth: 0 }}>
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
          </View>
        </View>

        <LinkButton label={L('← Về mục Lịch sử', '← Back to History')} onPress={onBack} style={{ alignSelf: 'flex-start' }} />
      </View>
    </View>
  );
}
