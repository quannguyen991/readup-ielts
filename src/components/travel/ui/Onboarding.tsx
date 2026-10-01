/**
 * Màn giới thiệu lần đầu: ba slide một câu, rồi đặt tên + chọn áo, nhận 2 vé.
 */
import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { bi, useL } from '@/i18n/useL';
import { TRAVEL_ECONOMY } from '@/services/travel/economy';
import { useTravelStore } from '@/store/useTravelStore';
import { GameButton, PixelPanel, PlaneGlyph, StampGlyph, T, TicketGlyph } from './kit';
import { OUTFITS, Traveller } from './Traveller';

export function Onboarding() {
  const { L, locale } = useL();
  const finish = useTravelStore((s) => s.finishOnboarding);
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [outfit, setOutfit] = useState(0);

  const slides: { art: React.ReactNode; title: string; line: string }[] = [
    { art: <TicketGlyph size={64} />, title: L('Làm bài, đổi vé', 'Study, earn tickets'), line: L('Mỗi bài làm đúng là một bước tới tấm vé máy bay.', 'Every right answer brings you closer to a flight.') },
    { art: <PlaneGlyph size={64} color={T.navy} rotate={-30} />, title: L('Bay đi khắp nơi', 'Fly around the world'), line: L('Mỗi nơi bạn ghé là một bài tiếng Anh thật.', 'Each place you visit is a real English lesson.') },
    { art: <StampGlyph size={64} />, title: L('Đóng dấu hộ chiếu', 'Stamp your passport'), line: L('Hoàn thành thành phố để nhận con dấu và quà.', 'Finish a city to earn its stamp and a souvenir.') },
  ];

  if (step < 3) {
    const s = slides[step]!;
    return (
      <PixelPanel style={{ maxWidth: 520, alignSelf: 'center', width: '100%' }} inner={{ alignItems: 'center', padding: 24, gap: 12 }}>
        <View style={{ height: 76, justifyContent: 'center' }}>{s.art}</View>
        <Text className="font-heavy" style={{ fontSize: 22, color: T.ink, textAlign: 'center' }}>
          {s.title}
        </Text>
        <Text className="font-sans" style={{ fontSize: 16, color: T.muted, textAlign: 'center' }}>
          {s.line}
        </Text>
        <View style={{ flexDirection: 'row', gap: 6, marginVertical: 6 }}>
          {slides.map((_, i) => (
            <View key={i} style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: i === step ? T.gold : T.line }} />
          ))}
        </View>
        <GameButton label={L('Tiếp', 'Next')} onPress={() => setStep(step + 1)} />
      </PixelPanel>
    );
  }

  return (
    <PixelPanel style={{ maxWidth: 520, alignSelf: 'center', width: '100%' }} inner={{ padding: 24, gap: 14 }}>
      <Text className="font-heavy" style={{ fontSize: 22, color: T.ink, textAlign: 'center' }}>
        {L('Tên và áo của bạn', 'Your name and coat')}
      </Text>
      <TextInput
        value={name}
        onChangeText={(t) => setName(t.slice(0, 24))}
        placeholder={L('Tên lữ khách', 'Traveller name')}
        placeholderTextColor="#9A927E"
        accessibilityLabel={L('Tên lữ khách', 'Traveller name')}
        maxLength={24}
        style={{ minHeight: 48, borderWidth: 2, borderColor: T.navy, borderRadius: 6, backgroundColor: '#FFFFFF', paddingHorizontal: 14, fontSize: 17, color: T.ink }}
      />
      <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'center' }}>
        {OUTFITS.map((o, i) => (
          <Pressable
            key={i}
            accessibilityRole="button"
            accessibilityState={{ selected: outfit === i }}
            accessibilityLabel={bi(o.name, locale)}
            onPress={() => setOutfit(i)}
            style={{ flex: 1, maxWidth: 130, alignItems: 'center', gap: 6, paddingVertical: 12, borderRadius: 6, borderWidth: 2, borderColor: outfit === i ? T.navy : T.line, backgroundColor: outfit === i ? T.paperDeep : 'transparent' }}
          >
            <Traveller outfit={i} size={44} />
            <Text className="font-strong" style={{ fontSize: 13, color: T.ink }}>
              {bi(o.name, locale)}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <TicketGlyph size={22} />
        <Text className="font-strong" style={{ fontSize: 16, color: T.ink }}>
          {L(`Tặng bạn ${TRAVEL_ECONOMY.welcomeTickets} vé miễn phí`, `${TRAVEL_ECONOMY.welcomeTickets} free tickets for you`)}
        </Text>
      </View>
      <GameButton label={L('Bắt đầu hành trình', 'Start the trip')} onPress={() => finish({ name: name.trim() || L('Lữ khách', 'Traveller'), outfit })} />
    </PixelPanel>
  );
}
