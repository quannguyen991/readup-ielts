import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { bi, useL } from '@/i18n/useL';
import { hasHistoryGuide } from '@/data/history';
import type { PoiContent } from '@/data/travel/pois';
import { StarsRow, T } from '../ui/kit';
import { Drawer } from './Drawer';
import { KIND_GLYPH } from './hudKit';
import type { TravelState } from '@/services/travel/types';

export type PlaceRow = { poi: PoiContent; unlocked: boolean; stars: number; runs: number; recommended: boolean; needs?: PoiContent };

/** Ngăn "Địa điểm": tìm kiếm, trạng thái từng nơi, "Đi tới" (tự đi) và "Vào". Thay cho danh sách thẻ dưới bản đồ. */
export function PlacesDrawer({
  rows,
  onClose,
  onGo,
  onEnter,
  onFocus,
}: {
  rows: PlaceRow[];
  state: Pick<TravelState, 'poi'>;
  onClose: () => void;
  onGo: (id: string) => void;
  onEnter: (id: string) => void;
  onFocus: (id: string | null) => void;
}) {
  const { L, locale } = useL();
  const [q, setQ] = useState('');
  const list = useMemo(() => {
    const k = q.trim().toLowerCase();
    if (!k) return rows;
    return rows.filter((r) => `${r.poi.name.vi} ${r.poi.name.en} ${r.poi.kind}`.toLowerCase().includes(k));
  }, [rows, q]);
  return (
    <Drawer
      title={L('Địa điểm', 'Places')}
      onClose={onClose}
      header={
        <View style={{ padding: 10, borderBottomWidth: 1, borderColor: T.line }}>
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder={L('Tìm địa điểm…', 'Search places…')}
            placeholderTextColor={T.muted}
            accessibilityLabel={L('Tìm địa điểm', 'Search places')}
            style={{ minHeight: 44, borderWidth: 2, borderColor: T.navy, borderRadius: 6, paddingHorizontal: 12, fontSize: 15, color: T.ink, backgroundColor: '#fff' }}
          />
        </View>
      }
    >
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 10, gap: 8 }}>
        {list.length === 0 ? (
          <Text className="font-sans" style={{ fontSize: 14, color: T.muted, padding: 10 }}>
            {L('Không có địa điểm khớp.', 'No matching places.')}
          </Text>
        ) : null}
        {list.map((r) => {
          const act = r.poi.action;
          return (
            <View
              key={r.poi.id}
              {...({ onMouseEnter: () => onFocus(r.poi.id), onMouseLeave: () => onFocus(null) } as object)}
              style={{ borderWidth: 2, borderColor: r.recommended ? T.gold : T.navy, borderRadius: 8, backgroundColor: r.recommended ? '#FBF1D3' : T.paper, opacity: r.unlocked ? 1 : 0.7, padding: 10, gap: 6 }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 18 }}>{r.unlocked ? (KIND_GLYPH[r.poi.kind] ?? '📍') : '🔒'}</Text>
                <Text className="font-strong" style={{ flex: 1, fontSize: 15, color: T.ink }}>
                  {bi(r.poi.name, locale)}
                </Text>
                {r.recommended ? (
                  <Text className="font-strong" style={{ fontSize: 14, color: T.goldDark }}>
                    {L('Gợi ý', 'Next')}
                  </Text>
                ) : null}
              </View>
              {hasHistoryGuide(r.poi.id) ? (
                <Text className="font-strong" style={{ fontSize: 14, color: T.goldDark }}>
                  {'📜 '}
                  {L('Có người hướng dẫn kể lịch sử', 'A guide can tell its history')}
                </Text>
              ) : null}
              {!act ? <StarsRow n={r.stars} size={15} /> : null}
              {!r.unlocked && r.needs ? (
                <Text className="font-sans" style={{ fontSize: 14, color: T.muted }}>
                  {L(`Cần đạt ${r.needs.name.vi} trước`, `Pass ${r.needs.name.en} first`)}
                </Text>
              ) : null}
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => onGo(r.poi.id)}
                  style={{ flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 6, borderWidth: 2, borderColor: T.navy, backgroundColor: T.paper }}
                >
                  <Text className="font-strong" style={{ fontSize: 14, color: T.navy }}>
                    {L('Đi tới', 'Go there')}
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  disabled={!r.unlocked}
                  onPress={() => onEnter(r.poi.id)}
                  style={{ flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 6, borderWidth: 2, borderColor: T.navy, backgroundColor: r.unlocked ? T.gold : '#E4DCC8' }}
                >
                  <Text className="font-strong" style={{ fontSize: 14, color: r.unlocked ? T.navy : T.muted }}>
                    {act === 'customs' ? L('Mở quầy vé', 'Open counter') : act === 'gate' ? L('Ra bản đồ', 'World map') : r.unlocked ? (r.runs ? L('Làm lại', 'Play again') : L('Vào', 'Enter')) : L('Chưa mở', 'Locked')}
                  </Text>
                </Pressable>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </Drawer>
  );
}
