import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { HubScreen } from '@/components/hub/HubScreen';
import { GLASS_CARD, HUB, TAG_COLOR } from '@/components/hub/theme';
import { Icon } from '@/components/ui/Icon';
import { TUTORS, type Tutor } from '@/services/hub/tutors';

export default function TutorList() {
  const live = TUTORS.filter((t) => t.status === 'live');
  const soon = TUTORS.filter((t) => t.status === 'soon');

  return (
    <HubScreen title="Gia sư" subtitle="Gia sư AI luyện theo từng tình huống">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Làm chủ ngữ pháp tiếng Anh"
        onPress={() => router.push('/hub/tutor/grammar' as never)}
        style={[GLASS_CARD, { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 }]}
      >
        <View style={{ width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: HUB.glassStrong }}>
          <Icon name="book" size={22} color={HUB.blue} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ color: HUB.ink, fontSize: 15, fontWeight: '700' }}>Làm chủ ngữ pháp tiếng Anh</Text>
          <Text style={{ color: HUB.muted, fontSize: 12 }}>Lộ trình A1 đến C, có bài học và câu hỏi đầy đủ ở A1.</Text>
        </View>
        <Icon name="chevron-right" size={18} color={HUB.muted} />
      </Pressable>

      <Text style={{ color: HUB.ink, fontSize: 16, fontWeight: '800' }}>Đang sẵn sàng</Text>
      <View style={{ gap: 10 }}>
        {live.map((t) => <TutorRow key={t.id} t={t} />)}
      </View>

      {soon.length > 0 ? (
        <>
          <Text style={{ color: HUB.ink, fontSize: 16, fontWeight: '800' }}>Sắp có</Text>
          <View style={{ gap: 10 }}>
            {soon.map((t) => <TutorRow key={t.id} t={t} />)}
          </View>
        </>
      ) : null}
    </HubScreen>
  );
}

function TutorRow({ t }: { t: Tutor }) {
  const live = t.status === 'live';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t.name}
      disabled={!live}
      onPress={() => live && router.push(`/hub/tutor/${t.id}` as never)}
      style={[GLASS_CARD, { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, opacity: live ? 1 : 0.6 }]}
    >
      <View style={{ width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: HUB.glassStrong }}>
        <Icon name="sparkle" size={18} color={live ? HUB.violet : HUB.muted} />
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Text style={{ color: HUB.ink, fontSize: 15, fontWeight: '700' }}>{t.name}</Text>
          {t.tag ? <Text style={{ color: TAG_COLOR[t.tag], fontSize: 10, fontWeight: '800', borderWidth: 1, borderColor: TAG_COLOR[t.tag], borderRadius: 999, paddingHorizontal: 6, paddingVertical: 1 }}>{t.tag}</Text> : null}
        </View>
        <Text style={{ color: HUB.muted, fontSize: 12, lineHeight: 17 }}>{t.desc}</Text>
      </View>
      {live ? <Icon name="chevron-right" size={18} color={HUB.muted} /> : <Text style={{ color: HUB.muted, fontSize: 10, fontWeight: '700' }}>SẮP CÓ</Text>}
    </Pressable>
  );
}
