import React, { useMemo } from 'react';
import { Platform, ScrollView, Text, View } from 'react-native';

import { HoverGlossText, type InlineGloss, type WordPick } from '@/components/reader/HoverGloss';
import { useL } from '@/i18n/useL';
import { parseInline } from '@/lib/inlineMarkup';
import { readingFont } from '@/lib/readingFonts';
import type { DisplayLang, Scene } from '@/services/history/types';

import { Card, Chip, Eyebrow, H, pickLang } from './ui';
import { historyPoster } from './posterTheme';

const WEB = Platform.OS === 'web';

export const glossKey = (w: string) => w.toLowerCase().replace(/[^a-z0-9'-]/g, '');

/** Nghĩa soạn riêng cho các từ vựng của cảnh — hiện ngay khi rê chuột, trước cả từ điển chung. */
export function sceneGlosses(scene: Scene): Record<string, InlineGloss> {
  const map: Record<string, InlineGloss> = {};
  for (const v of scene.vocab) map[glossKey(v.word)] = { word: v.word, meaningVi: v.meaningVi, pos: v.pos };
  return map;
}

function Rich({ text, style }: { text: string; style: object }) {
  const runs = useMemo(() => parseInline(text), [text]);
  return (
    <Text style={style}>
      {runs.map((r, i) => (
        <Text key={i} style={{ fontStyle: r.italic ? 'italic' : 'normal', fontWeight: r.bold ? '700' : undefined }}>
          {r.text}
        </Text>
      ))}
    </Text>
  );
}

/**
 * Khu đọc của MỘT cảnh: tiêu đề, mốc thời gian, nhãn giai đoạn, rồi các cặp đoạn Việt–Anh GHÉP THEO MÃ ĐOẠN
 * (cùng `id`), xếp chồng để mắt luôn thấy hai bản của cùng một đoạn kề nhau. Rê chuột vào từ tiếng Anh → nghĩa;
 * bấm → thẻ chi tiết + lưu vào Sổ từ (xem `WordPopover`).
 */
export function SceneReader({
  scene,
  total,
  lang,
  fontSize = 17,
  playingParagraph,
  playingScene,
  evidenceParagraph,
  onWord,
  immersive = false,
  bodyMaxHeight,
}: {
  scene: Scene;
  total: number;
  lang: DisplayLang;
  fontSize?: number;
  /** Đoạn đang đọc — CHỈ có khi audio có mốc câu thật. */
  playingParagraph: string | null;
  /** Cảnh này đang được thuyết minh (mức cảnh, luôn đúng dù không có mốc câu). */
  playingScene: boolean;
  evidenceParagraph: string | null;
  onWord: (paragraphIndex: number) => (p: WordPick) => void;
  /** Tờ giấy kính nổi trên tranh toàn màn hình. */
  immersive?: boolean;
  /** Giới hạn riêng vùng đoạn văn để phần đầu cảnh và nút nghe luôn ở trong tầm tay. */
  bodyMaxHeight?: number;
}) {
  const { L } = useL();
  const glosses = useMemo(() => sceneGlosses(scene), [scene]);
  const showEn = lang !== 'vi';
  const showVi = lang !== 'en';
  const paragraphs = scene.paragraphs.map((p, i) => {
    const hl = playingParagraph === p.id;
    const ev = evidenceParagraph === p.id;
    return (
      <View
        key={p.id}
        nativeID={`hp-${p.id}`}
        style={[
          {
            marginTop: 8,
            paddingVertical: 10,
            paddingLeft: 14,
            paddingRight: 10,
            borderRadius: 12,
            borderLeftWidth: 3,
              borderLeftColor: ev ? (immersive ? historyPoster.gold : '#6A4BD9') : hl || playingScene ? (immersive ? historyPoster.red : H.accent) : 'transparent',
              backgroundColor: ev ? (immersive ? 'rgba(244,184,35,.34)' : '#F3F0FB') : hl ? (immersive ? 'rgba(244,184,35,.18)' : H.tint) : 'transparent',
            gap: 8,
          },
          WEB ? ({ transition: 'background-color .25s, border-color .25s' } as object) : null,
        ]}
      >
        {showEn ? (
          <HoverGlossText
            text={p.en}
            bundled={glosses}
            fontFamily={readingFont.literata}
            fontSize={fontSize}
            lineHeight={fontSize * 1.7}
            color={immersive ? historyPoster.ink : H.body}
            onWordPress={onWord(i)}
          />
        ) : null}
        {showVi ? (
          <Rich
            text={p.vi}
            style={{
              fontFamily: readingFont.sans,
              fontSize: showEn ? fontSize - 2 : fontSize,
              lineHeight: (showEn ? fontSize - 2 : fontSize) * 1.65,
              color: immersive ? historyPoster.olive : showEn ? H.muted : H.body,
            }}
          />
        ) : null}
      </View>
    );
  });

  return (
    <Card
      id="history-reader"
      style={{
        padding: 0,
        overflow: 'hidden',
        ...(immersive
          ? {
              borderRadius: 4,
              backgroundColor: historyPoster.cream,
              borderColor: historyPoster.deepRed,
              borderLeftWidth: 12,
              borderLeftColor: historyPoster.red,
              ...(WEB ? ({ backdropFilter: 'none', boxShadow: '10px 10px 0 rgba(11,19,12,.55)' } as object) : {}),
            }
          : {}),
      }}
    >
      {playingScene ? <View accessibilityLabel={L('Đang thuyết minh cảnh này', 'Narrating this scene')} style={{ height: 3, backgroundColor: H.accent }} /> : null}
      <View style={{ padding: immersive ? 18 : 20, paddingBottom: 8, gap: 10 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
          <Eyebrow poster={immersive}>{`${L('Cảnh', 'Scene')} ${scene.n}/${total}`}</Eyebrow>
          <Chip poster={immersive} label={pickLang(lang, scene.dateLabel.vi, scene.dateLabel.en)} tone="accent" />
          {scene.periodNote ? <Chip poster={immersive} label={pickLang(lang, scene.periodNote.vi, scene.periodNote.en)} tone="warn" /> : null}
          {playingScene ? <Chip poster={immersive} label={L('Đang thuyết minh', 'Now narrating')} tone="good" /> : null}
        </View>
        <Text accessibilityRole="header" style={{ fontFamily: readingFont.display, fontWeight: '700', fontSize: immersive ? 30 : 29, lineHeight: immersive ? 36 : 36, letterSpacing: -0.45, color: immersive ? historyPoster.deepRed : H.ink }}>
          {pickLang(lang, scene.titleVi, scene.titleEn)}
        </Text>
        {lang === 'both' ? <Text style={{ fontFamily: readingFont.literata, fontStyle: 'italic', fontSize: 17, lineHeight: 24, color: immersive ? historyPoster.olive : H.muted }}>{scene.titleEn}</Text> : null}
        <Text style={{ fontFamily: readingFont.sansMedium, fontSize: 13.5, lineHeight: 20, color: immersive ? historyPoster.red : H.muted }}>
          {L('Địa điểm: ', 'Place: ')}
          {pickLang(lang, scene.place.vi, scene.place.en)}
          {scene.place.modernNote ? ` — ${pickLang(lang, scene.place.modernNote.vi, scene.place.modernNote.en)}` : ''}
        </Text>
      </View>

      {immersive ? (
        <ScrollView style={{ maxHeight: bodyMaxHeight, flexGrow: 0 }} contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 16 }} nestedScrollEnabled showsVerticalScrollIndicator={false}>
          {paragraphs}
        </ScrollView>
      ) : (
        <View style={{ paddingHorizontal: 12, paddingBottom: 16 }}>{paragraphs}</View>
      )}
    </Card>
  );
}
