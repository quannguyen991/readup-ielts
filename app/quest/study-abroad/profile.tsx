import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { Traveller, OUTFITS } from '@/components/travel/ui/Traveller';
import { GameButton, PixelPanel, T } from '@/components/travel/ui/kit';
import { TravelPage } from '@/components/travel/ui/TravelPage';
import { bi, useL } from '@/i18n/useL';
import { useTravelReady } from '@/components/travel/useTravel';
import { useTravelStore } from '@/store/useTravelStore';

export default function StudyAbroadProfileScreen() {
  const ready = useTravelReady();
  const { L, locale } = useL();
  const prefs = useTravelStore((state) => state.prefs);
  const setPrefs = useTravelStore((state) => state.setPrefs);
  return (
    <TravelPage title={L('Hồ sơ du học', 'Student profile')} back="/quest/study-abroad" backLabel={L('Hành trình', 'Journey')}>
      {!ready ? null : (
        <>
          <PixelPanel tone="navy" inner={{ padding: 18, alignItems: 'center', gap: 9 }}>
            <Traveller outfit={prefs.outfit} size={88} />
            <Text className="font-heavy" style={{ color: T.goldLight, fontSize: 21 }}>{prefs.name || L('Du học sinh', 'Exchange student')}</Text>
            <Text className="font-sans" style={{ color: T.cream, fontSize: 13, textAlign: 'center', lineHeight: 19 }}>
              {L('Ngoại hình này cũng được dùng cho nhân vật trên bản đồ du ngoạn.', 'This look is also used by your character on the travel map.')}
            </Text>
          </PixelPanel>

          <PixelPanel style={{ marginTop: 14 }} inner={{ padding: 16, gap: 10 }}>
            <Text className="font-heavy" style={{ color: T.ink, fontSize: 18 }}>{L('Tên trên thẻ sinh viên', 'Name on your student card')}</Text>
            {ready ? <NameEditor initialName={prefs.name} onSave={(value) => setPrefs({ name: value || L('Du học sinh', 'Exchange student') })} /> : null}
          </PixelPanel>

          <PixelPanel style={{ marginTop: 14 }} inner={{ padding: 16, gap: 11 }}>
            <Text className="font-heavy" style={{ color: T.ink, fontSize: 18 }}>{L('Chọn trang phục', 'Choose an outfit')}</Text>
            <Text className="font-sans" style={{ color: T.muted, fontSize: 13, lineHeight: 19 }}>
              {L('Chọn áo khoác cho hành trình học tập. Trang phục được lưu và xuất hiện khi bạn di chuyển trong thành phố.', 'Choose a jacket for your student journey. Your outfit is saved and appears as you move around each city.')}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9 }}>
              {OUTFITS.map((outfit, index) => {
                const active = prefs.outfit === index;
                return (
                  <Pressable
                    key={outfit.name.en}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    onPress={() => setPrefs({ outfit: index })}
                    style={{ flexGrow: 1, flexBasis: 125, alignItems: 'center', gap: 7, padding: 12, borderRadius: 10, borderWidth: 2, borderColor: active ? T.goldDark : T.line, backgroundColor: active ? '#F7EDDA' : '#FFFFFF' }}
                  >
                    <Traveller outfit={index} size={48} />
                    <Text className="font-semi" style={{ color: T.ink, fontSize: 13, textAlign: 'center' }}>{bi(outfit.name, locale)}</Text>
                    {active ? <Text className="font-semi" style={{ color: T.good, fontSize: 11 }}>{L('Đang mặc', 'Wearing')}</Text> : null}
                  </Pressable>
                );
              })}
            </View>
          </PixelPanel>

          <View style={{ marginTop: 14 }}>
            <GameButton label={L('Về phòng ký túc xá', 'Visit the dorm room')} tone="gold" onPress={() => router.push('/quest/study-abroad/dorm' as never)} />
          </View>
        </>
      )}
      <View style={{ height: 24 }} />
    </TravelPage>
  );
}

function NameEditor({ initialName, onSave }: { initialName: string; onSave: (name: string) => void }) {
  const { L } = useL();
  const [name, setName] = useState(initialName);
  return (
    <>
      <TextInput
        value={name}
        onChangeText={setName}
        maxLength={24}
        placeholder={L('Tên nhân vật', 'Character name')}
        placeholderTextColor={T.muted}
        accessibilityLabel={L('Tên nhân vật', 'Character name')}
        style={{ minHeight: 48, paddingHorizontal: 12, borderWidth: 1.5, borderColor: T.line, borderRadius: 9, backgroundColor: '#FFFFFF', color: T.ink, fontSize: 15 }}
      />
      <GameButton label={L('Lưu tên', 'Save name')} tone="navy" onPress={() => onSave(name.trim().slice(0, 24))} />
    </>
  );
}
