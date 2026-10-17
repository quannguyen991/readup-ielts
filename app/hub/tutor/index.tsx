import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { HubScreen } from '@/components/hub/HubScreen';
import { BADGE_STYLES, GLASS_CARD, HUB } from '@/components/hub/theme';
import { CuteBook, CuteCalendar, CuteCloud, CuteGlobe, CutePencil, CutePlane } from '@/components/illust/Cute';
import {
  CuteBulb,
  CuteCalculator,
  CuteChat,
  CuteFlame,
  CuteHeadphones,
  CuteMagnifier,
  CuteMic,
  CuteNotebook,
  CutePlant,
  CuteRocket,
  CuteStar,
  CuteTrophy,
} from '@/components/illust/CuteMore';
import { Icon } from '@/components/ui/Icon';
import { useL } from '@/i18n/useL';
import { TUTORS, type Tutor, type TutorTag } from '@/services/hub/tutors';
import { tutorCopy } from '@/services/hub/tutors-en';

type Art = (p: { size?: number }) => React.ReactElement;

/** Minh hoạ cho từng gia sư: lấy từ bộ Cute, không dùng emoji. */
const TUTOR_ART: Record<string, Art> = {
  grammar: CuteBook,
  'speech-analysis': CuteMic,
  vocab: CuteNotebook,
  pronounce: CuteHeadphones,
  meeting: CuteCalendar,
  interview: CuteChat,
  'public-speaking': CuteStar,
  presentation: CuteBulb,
  sales: CuteRocket,
  dating: CutePlant,
  travel: CutePlane,
  negotiation: CuteCalculator,
  conflict: CuteCloud,
  'leader-comms': CuteTrophy,
  storytelling: CutePencil,
  leadership: CuteFlame,
  'ielts-examiner': CuteMagnifier,
  profile: CuteGlobe,
  phone: CuteChat,
  diary: CuteNotebook,
};

/** Gia sư đã có màn riêng trong app: bấm vào mở đúng màn đó, không đi qua phòng hội thoại AI chung. */
const OWN_SCREEN: Record<string, string> = {
  grammar: '/hub/tutor/grammar',
  'speech-analysis': '/hub/analyze',
  pronounce: '/hub/learn',
  meeting: '/hub/meeting',
};

/**
 * Đích của một dòng: màn riêng nếu có; gia sư `soon` (chưa sẵn sàng) mở màn "đang chuẩn bị";
 * còn lại vào phòng hội thoại AI dùng vai của gia sư đó.
 */
function tutorRoute(t: Tutor): string {
  if (OWN_SCREEN[t.id]) return OWN_SCREEN[t.id]!;
  if (t.status === 'soon') return `/hub/tutor/coming/${t.id}`;
  return `/hub/tutor/${t.id}`;
}

function tagPill(tag: TutorTag): { text: string; style: { bg: string; text: string; border: string } } {
  if (tag === 'MỚI' || tag === 'NEW') return { text: 'NEW', style: BADGE_STYLES.NEW };
  if (tag === 'BETA') return { text: 'BETA', style: BADGE_STYLES.BETA };
  if (tag === 'PREMIUM') return { text: 'PREMIUM', style: BADGE_STYLES.PREMIUM };
  return { text: 'BAND 9', style: BADGE_STYLES.PREMIUM };
}

function TagPill({ tag }: { tag: TutorTag }) {
  const p = tagPill(tag);
  return (
    <View
      style={{
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: 999,
        backgroundColor: p.style.bg,
        borderWidth: 1,
        borderColor: p.style.border,
      }}
    >
      <Text style={{ color: p.style.text, fontSize: 10, fontWeight: '800', letterSpacing: 0.3 }}>{p.text}</Text>
    </View>
  );
}

/** Danh sách gia sư kiểu ELSA: minh hoạ, tên, badge, mô tả ngắn và mũi tên. */
export default function TutorList() {
  const { L } = useL();
  return (
    <HubScreen
      title={L('Gia sư', 'Tutors')}
      subtitle={L(`${TUTORS.length} gia sư AI theo mục tiêu của bạn`, `${TUTORS.length} AI tutors for your goals`)}
    >
      <View style={{ gap: 10 }}>
        {TUTORS.map((t) => (
          <TutorRow key={t.id} t={t} />
        ))}
      </View>

      <View style={{ paddingVertical: 12, alignItems: 'center' }}>
        <Text style={{ color: HUB.muted, fontSize: 13, fontWeight: '600' }}>
          {L('Sẽ sớm có thêm gia sư mới.', 'More tutors are coming soon.')}
        </Text>
      </View>
    </HubScreen>
  );
}

function TutorRow({ t }: { t: Tutor }) {
  const { en } = useL();
  const copy = tutorCopy(t, en);
  const Art = TUTOR_ART[t.id] ?? CuteStar;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={copy.name}
      onPress={() => router.push(tutorRoute(t) as never)}
      style={[GLASS_CARD, { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 }]}
    >
      <View
        style={{
          width: 60,
          height: 60,
          borderRadius: 18,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: HUB.goldSoft,
        }}
      >
        <Art size={44} />
      </View>

      <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Text style={{ color: HUB.ink, fontSize: 15, fontWeight: '800' }}>{copy.name}</Text>
          {t.tag ? <TagPill tag={t.tag} /> : null}
        </View>
        <Text numberOfLines={2} style={{ color: HUB.muted, fontSize: 12, lineHeight: 17 }}>
          {copy.desc}
        </Text>
      </View>

      <Icon name="chevron-right" size={18} color={HUB.muted} />
    </Pressable>
  );
}
