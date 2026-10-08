import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { TravelPage } from '@/components/travel/ui/TravelPage';
import { GameButton, PixelPanel, T } from '@/components/travel/ui/kit';
import { CAMPUS_LEGEND, STUDY_CAMPUSES, type CampusRoom, type StudyCampus } from '@/data/study-abroad-campus';
import { STUDY_ABROAD_CHAPTERS } from '@/data/study-abroad-campaign';
import { bi, useL } from '@/i18n/useL';

const TILE: Record<string, { bg: string; glyph: string }> = {
  '.': { bg: '#EADBB8', glyph: '' },
  _: { bg: '#BBD9A0', glyph: '' },
  S: { bg: '#8DC07A', glyph: '⚽' },
  '~': { bg: '#9FCBE3', glyph: '' },
  T: { bg: '#7FAE6C', glyph: '🌳' },
  '#': { bg: '#D8C4A4', glyph: '' },
  G: { bg: '#9C7656', glyph: '🚪' },
  L: { bg: '#E3D3AE', glyph: '📚' },
  C: { bg: '#F0C8A0', glyph: '🍜' },
};
const DOOR_BG = '#C7875E';
const cellStyle = { flex: 1, aspectRatio: 1, alignItems: 'center' as const, justifyContent: 'center' as const };

export default function StudyAbroadCampusScreen() {
  const { id: raw } = useLocalSearchParams<{ id: string }>();
  const { L, locale } = useL();
  const id = Array.isArray(raw) ? raw[0] : raw;
  const campus = STUDY_CAMPUSES.find((entry) => entry.id === id);
  return (
    <TravelPage title={campus ? bi(campus.name, locale) : L('Khuôn viên', 'Campus')} back="/quest/study-abroad" backLabel={L('Hành trình', 'Journey')}>
      {campus ? (
        <CampusView key={campus.id} campus={campus} />
      ) : (
        <PixelPanel inner={{ padding: 18, gap: 12 }}>
          <Text className="font-strong" style={{ color: T.ink, fontSize: 16 }}>{L('Không tìm thấy trường này.', 'This campus does not exist.')}</Text>
          <GameButton label={L('Về hành trình', 'Back to journey')} onPress={() => router.replace('/quest/study-abroad' as never)} />
        </PixelPanel>
      )}
      <View style={{ height: 24 }} />
    </TravelPage>
  );
}

function CampusView({ campus }: { campus: StudyCampus }) {
  const { L, locale } = useL();
  const [door, setDoor] = useState<CampusRoom['door']>(campus.rooms[0]?.door ?? '1');
  const chapter = STUDY_ABROAD_CHAPTERS.find((entry) => entry.id === campus.chapter);
  return (
    <>
      <PixelPanel tone="navy" inner={{ padding: 18, gap: 9 }}>
        <Text className="font-heavy" style={{ color: T.goldLight, fontSize: 11, letterSpacing: 1 }}>
          {chapter
            ? L(`CHẶNG ${chapter.id} · ${bi(chapter.title, locale).toUpperCase()}`, `CHAPTER ${chapter.id} · ${bi(chapter.title, locale).toUpperCase()}`)
            : L('TRƯỜNG THÊM ĐỂ KHÁM PHÁ', 'BONUS CAMPUS TO EXPLORE')}
        </Text>
        <Text className="font-heavy" style={{ color: T.goldLight, fontSize: 21 }}>{bi(campus.name, locale)}</Text>
        <Text className="font-semi" style={{ color: T.cream, fontSize: 13 }}>{bi(campus.city, locale)} · {bi(campus.country, locale)}</Text>
        <Text className="font-sans" style={{ color: T.cream, fontSize: 14, lineHeight: 21 }}>{bi(campus.tagline, locale)}</Text>
      </PixelPanel>

      <PixelPanel tone="paper" style={{ marginTop: 14 }} inner={{ padding: 12, gap: 10 }}>
        <Text className="font-heavy" style={{ color: T.ink, fontSize: 16 }}>{L('Mặt bằng khuôn viên', 'Campus grounds')}</Text>
        <CampusMap campus={campus} selectedDoor={door} onPickDoor={setDoor} />
        <CampusLegend />
        <Text className="font-sans" style={{ color: T.muted, fontSize: 11, lineHeight: 16 }}>
          {L('Bản đồ chỉ để chơi, không phải mặt bằng thật của trường.', 'The map is for play only, not a real floor plan.')}
        </Text>
      </PixelPanel>

      <View style={{ marginTop: 14, gap: 10 }}>
        <Text className="font-heavy" style={{ color: T.ink, fontSize: 16 }}>{L('Phòng học (chạm để chọn)', 'Classrooms (tap to pick)')}</Text>
        {campus.rooms.map((room) => (
          <RoomCard key={room.door} room={room} selected={room.door === door} onPress={() => setDoor(room.door)} />
        ))}
      </View>

      <View style={{ marginTop: 14, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <GameButton label={L('Về hành trình', 'Back to journey')} tone="gold" onPress={() => router.push('/quest/study-abroad' as never)} />
      </View>
    </>
  );
}

function CampusMap({ campus, selectedDoor, onPickDoor }: { campus: StudyCampus; selectedDoor: CampusRoom['door']; onPickDoor: (door: CampusRoom['door']) => void }) {
  const { locale } = useL();
  return (
    <View style={{ borderRadius: 8, borderWidth: 2, borderColor: T.navy, overflow: 'hidden' }}>
      {campus.map.map((row, r) => (
        <View key={r} style={{ flexDirection: 'row' }}>
          {Array.from(row).map((tile, c) => {
            const room = campus.rooms.find((entry) => entry.door === tile);
            if (room) {
              const selected = room.door === selectedDoor;
              return (
                <Pressable
                  key={c}
                  accessibilityRole="button"
                  accessibilityLabel={bi(room.name, locale)}
                  accessibilityState={{ selected }}
                  onPress={() => onPickDoor(room.door)}
                  style={[cellStyle, { backgroundColor: selected ? T.goldLight : DOOR_BG }]}
                >
                  <Text style={{ fontSize: 11 }}>{room.glyph}</Text>
                </Pressable>
              );
            }
            const style = TILE[tile];
            return (
              <View key={c} style={[cellStyle, { backgroundColor: style?.bg ?? '#FFFFFF' }]}>
                <Text style={{ fontSize: 10 }}>{style?.glyph ?? ''}</Text>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

function CampusLegend() {
  const { L, locale } = useL();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {Object.entries(CAMPUS_LEGEND).map(([tile, label]) => (
        <View key={tile} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 14, height: 14, borderRadius: 3, backgroundColor: TILE[tile]?.bg ?? '#FFFFFF', borderWidth: 1, borderColor: T.line }} />
          <Text className="font-sans" style={{ color: T.muted, fontSize: 12 }}>{bi(label, locale)}</Text>
        </View>
      ))}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <View style={{ width: 14, height: 14, borderRadius: 3, backgroundColor: DOOR_BG }} />
        <Text className="font-sans" style={{ color: T.muted, fontSize: 12 }}>{L('Cửa phòng học', 'Classroom door')}</Text>
      </View>
    </View>
  );
}

function RoomCard({ room, selected, onPress }: { room: CampusRoom; selected: boolean; onPress: () => void }) {
  const { L, locale } = useL();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 11, padding: 11, borderRadius: 10, borderWidth: 1.5, borderColor: selected ? T.goldDark : T.line, backgroundColor: selected ? '#F7EDDA' : T.paper }}
    >
      <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: selected ? T.goldLight : T.navy }}>
        <Text style={{ fontSize: 19 }}>{room.glyph}</Text>
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text className="font-strong" style={{ color: T.ink, fontSize: 14 }}>{bi(room.name, locale)}</Text>
        <Text className="font-sans" style={{ color: T.muted, fontSize: 12, lineHeight: 17 }}>{bi(room.subject, locale)} · {bi(room.desc, locale)}</Text>
        <Text className="font-semi" style={{ color: T.goldDark, fontSize: 11 }}>{L(`Cửa số ${room.door}`, `Door ${room.door}`)}</Text>
      </View>
    </Pressable>
  );
}
