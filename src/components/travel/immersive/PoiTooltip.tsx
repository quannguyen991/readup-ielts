import React from 'react';
import { Text, View, useWindowDimensions } from 'react-native';

import { getVocabTopic } from '@/data/vocab-topics';
import { REPLY_THEME_LABEL, themeOfDeck } from '@/data/travel/replies';
import { getSouvenir } from '@/data/travel/souvenirs';
import type { PoiContent } from '@/data/travel/pois';
import { bi, useL } from '@/i18n/useL';
import { hasHistoryGuide } from '@/data/history';
import { HUD, KIND_GLYPH } from './hudKit';

/** Tên các bộ học của một địa điểm ("bạn sẽ học gì"): chủ đề từ vựng, câu đáp tình huống, bài nghe. */
export function learnLabels(poi: PoiContent, locale: 'vi' | 'en'): string[] {
  const out: string[] = [];
  for (const d of poi.content.decks) {
    const theme = themeOfDeck(d);
    if (theme) out.push(`${locale === 'vi' ? 'Hội thoại' : 'Conversation'}: ${bi(REPLY_THEME_LABEL[theme], locale)}`);
    else {
      const t = getVocabTopic(d);
      out.push(t ? (locale === 'vi' ? t.nameVi : t.name) : d);
    }
  }
  return out.slice(0, 4);
}

/** Khung chú thích khi rê chuột / chạm một địa điểm: tên, học gì, phần thưởng, lý do khoá. */
export function PoiTooltip({ poi, at, locked, needs, stars }: { poi: PoiContent; at: { x: number; y: number }; locked: boolean; needs?: PoiContent; stars: number }) {
  const { L, locale } = useL();
  const win = useWindowDimensions();
  const w = 260;
  const x = Math.max(8, Math.min(win.width - w - 8, at.x + 16));
  const y = Math.max(8, Math.min(win.height - 170, at.y + 16));
  const sv = poi.reward.souvenir ? getSouvenir(poi.reward.souvenir) : undefined;
  const labels = learnLabels(poi, locale);
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: x, top: y, width: w, zIndex: 20, padding: 10, gap: 4, borderRadius: 10, backgroundColor: HUD.bg, borderWidth: 1.5, borderColor: HUD.border }}>
      <Text className="font-strong" style={{ fontSize: 15, color: HUD.text }}>
        {locked ? '🔒' : (KIND_GLYPH[poi.kind] ?? '📍')} {bi(poi.name, locale)}
      </Text>
      {poi.action ? (
        <Text className="font-sans" style={{ fontSize: 14, color: HUD.dim }}>
          {poi.action === 'customs' ? L('Đổi vé, ôn từ, kiểm tra hải quan.', 'Tickets, word review and customs checks.') : L('Ra bản đồ thế giới để bay.', 'Open the world map to fly.')}
        </Text>
      ) : (
        <>
          {labels.length ? (
            <Text className="font-sans" style={{ fontSize: 14, color: HUD.dim }}>
              {L('Học: ', 'Learn: ')}
              {labels.join(' · ')}
            </Text>
          ) : null}
          <Text className="font-strong" style={{ fontSize: 14, color: HUD.gold }}>
            {'★'.repeat(stars)}
            {'☆'.repeat(3 - stars)}  ·  ●{poi.reward.coins}
            {sv ? `  ·  ${sv.glyph} ${bi(sv.name, locale)}` : ''}
          </Text>
        </>
      )}
      {hasHistoryGuide(poi.id) ? (
        <Text className="font-strong" style={{ fontSize: 14, color: HUD.gold }}>
          {'📜 '}
          {L('Người hướng dẫn kể lịch sử nơi này', 'A guide tells the history here')}
        </Text>
      ) : null}
      <Text className="font-sans" style={{ fontSize: 14, color: locked ? '#F2A99E' : HUD.dim }}>
        {locked ? (needs ? L(`Khoá — cần đạt ${needs.name.vi} (2 sao) trước`, `Locked — pass ${needs.name.en} (2 stars) first`) : L('Đang khoá', 'Locked')) : L('Bấm để đi tới', 'Click to walk there')}
      </Text>
    </View>
  );
}
