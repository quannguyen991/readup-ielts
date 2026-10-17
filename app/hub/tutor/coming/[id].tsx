import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { HubScreen } from '@/components/hub/HubScreen';
import { GLASS_CARD, HUB } from '@/components/hub/theme';
import { CuteBulb } from '@/components/illust/CuteMore';
import { Icon } from '@/components/ui/Icon';
import { useL } from '@/i18n/useL';
import { tutorById } from '@/services/hub/tutors';
import { tutorCopy } from '@/services/hub/tutors-en';

/**
 * Màn "đang chuẩn bị" cho gia sư chưa sẵn sàng (status: 'soon'). Không để nút chết: nói rõ
 * gia sư này để làm gì, và chỉ cách luyện kỹ năng đó bằng các màn đang chạy.
 */
export default function ComingSoonTutor() {
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const { L, en } = useL();
  const tutor = tutorById(String(id));

  if (!tutor) {
    return (
      <HubScreen title={L('Gia sư', 'Tutors')} back>
        <Panel>
          <Text style={{ color: HUB.ink, fontSize: 16, fontWeight: '800' }}>{L('Không tìm thấy gia sư này', 'This tutor could not be found')}</Text>
          <Text style={{ color: HUB.body, fontSize: 13, lineHeight: 19 }}>
            {L('Quay lại danh sách để chọn gia sư khác.', 'Go back to the list to pick another tutor.')}
          </Text>
          <Ghost label={L('Về danh sách gia sư', 'Back to tutors')} onPress={() => router.replace('/hub/tutor' as never)} />
        </Panel>
      </HubScreen>
    );
  }

  const copy = tutorCopy(tutor, en);
  const steps = [
    L('Mở gia sư đang sẵn sàng ở danh sách: phòng hội thoại AI dùng được ngay.', 'Open a tutor that is ready in the list: the AI conversation room works right away.'),
    L('Luyện cùng kỹ năng bằng Phân tích giọng nói hoặc Gia sư phát âm để nghe lại giọng của mình.', 'Practise the same skill with Speech analysis or the Pronunciation tutor to hear your own voice.'),
    L('Mục này sẽ mở khi có đủ nội dung và phòng luyện. Quay lại danh sách để xem khi nào có.', 'This tutor opens once its content and practice room are ready. Check the list to see when.'),
  ];

  return (
    <HubScreen title={copy.name} subtitle={L('Đang chuẩn bị', 'Coming soon')} back padBottom={140}>
      <Panel>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View style={{ width: 72, height: 72, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: HUB.goldSoft }}>
            <CuteBulb size={52} />
          </View>
          <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
            <View style={{ alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999, backgroundColor: '#FEF3C7' }}>
              <Text style={{ color: '#B45309', fontSize: 11, fontWeight: '800' }}>{L('ĐANG CHUẨN BỊ', 'COMING SOON')}</Text>
            </View>
            <Text style={{ color: HUB.body, fontSize: 14, lineHeight: 21 }}>{copy.desc}</Text>
          </View>
        </View>
      </Panel>

      <Panel>
        <Text style={{ color: HUB.ink, fontSize: 15, fontWeight: '800' }}>{L('Trong lúc chờ, bạn có thể', 'While you wait, you can')}</Text>
        {steps.map((s, i) => (
          <View key={i} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
            <View style={{ width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E0F2FE' }}>
              <Text style={{ color: '#0369A1', fontSize: 12, fontWeight: '800' }}>{i + 1}</Text>
            </View>
            <Text style={{ flex: 1, color: HUB.body, fontSize: 14, lineHeight: 21 }}>{s}</Text>
          </View>
        ))}
      </Panel>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4 }}>
        <Icon name="info" size={14} color={HUB.muted} />
        <Text style={{ flex: 1, color: HUB.muted, fontSize: 12, lineHeight: 17 }}>
          {L('Chưa có ngày ra mắt cụ thể cho mục này.', 'No release date has been set for this tutor yet.')}
        </Text>
      </View>

      <Ghost label={L('Xem gia sư đang sẵn sàng', 'See tutors that are ready')} onPress={() => router.replace('/hub/tutor' as never)} />
    </HubScreen>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return <View style={[GLASS_CARD, { padding: 16, gap: 12 }]}>{children}</View>;
}

function Ghost({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={{
        height: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: HUB.blue,
        backgroundColor: '#FFFFFF',
      }}
    >
      <Text style={{ color: HUB.blue, fontSize: 15, fontWeight: '800' }}>{label}</Text>
    </Pressable>
  );
}
