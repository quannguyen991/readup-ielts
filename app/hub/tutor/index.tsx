import React from 'react';
import { Text, View, useWindowDimensions } from 'react-native';

import { HubScreen } from '@/components/hub/HubScreen';
import { PASTEL_INK, PASTEL_INK_SOFT, TutorRow } from '@/components/hub/TutorCards';
import { useL } from '@/i18n/useL';
import { TUTORS, soonTutors } from '@/services/hub/tutors';
import { tutorCopy } from '@/services/hub/tutors-en';

/** Danh sách gia sư theo phong cách trang Luyện nói: thẻ pastel, nhãn, mức, kỹ năng chính. */
export default function TutorList() {
  const { L, en } = useL();
  const { width } = useWindowDimensions();
  const wide = width >= 720;
  const live = TUTORS.filter((t) => t.status === 'live');
  const soon = soonTutors();

  return (
    <HubScreen
      title={L('Gia sư', 'Tutors')}
      subtitle={L(`${live.length} gia sư AI theo mục tiêu của bạn`, `${live.length} AI tutors for your goals`)}
    >
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {live.map((t, i) => (
          <TutorRow key={t.id} t={t} index={i} wide={wide} />
        ))}
      </View>

      {soon.length > 0 ? (
        <View style={{ gap: 6 }}>
          <Text style={{ color: PASTEL_INK, fontSize: 15, fontWeight: '900' }}>{L('Sắp có', 'Coming soon')}</Text>
          <Text style={{ color: PASTEL_INK_SOFT, fontSize: 12, fontWeight: '700', lineHeight: 18 }}>
            {soon.map((t) => tutorCopy(t, en).name).join(' · ')}
          </Text>
        </View>
      ) : null}

      <View style={{ paddingVertical: 8, alignItems: 'center' }}>
        <Text style={{ color: PASTEL_INK_SOFT, fontSize: 13, fontWeight: '600' }}>
          {L('Sẽ sớm có thêm gia sư mới.', 'More tutors are coming soon.')}
        </Text>
      </View>
    </HubScreen>
  );
}
