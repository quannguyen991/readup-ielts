import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { LionMascot } from '@/components/mascot/LionMascot';
import { HubScreen } from '@/components/hub/HubScreen';
import { GLASS_CARD, HUB } from '@/components/hub/theme';
import { CoinIcon } from '@/components/ui/CoinIcon';
import { Icon } from '@/components/ui/Icon';
import { SPEAKING_TOPICS } from '@/data/hub/speaking-topics';
import { useHubStore } from '@/store/useHubStore';
import { themedHex } from '@/theme/palette-state';

/** Chọn chủ đề để nói cùng Leo, giám khảo AI. Mỗi chủ đề là một buổi sáu câu như bài thi. */
export default function LivePicker() {
  const done = useHubStore((s) => s.topicsDone);
  return (
    <HubScreen title="Nói cùng Leo" subtitle="Giám khảo AI hỏi, bạn trả lời bằng giọng nói" back padBottom={140}>
      <LinearGradient
        colors={[themedHex('#F3F0FB'), themedHex('#F6E3AE')]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 24, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14 }}
      >
        <LionMascot pose="wave" size={88} />
        <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
          <Text style={{ color: HUB.ink, fontSize: 17, fontWeight: '800' }}>Leo sẽ hỏi bạn như giám khảo thật</Text>
          <Text style={{ color: HUB.body, fontSize: 13, lineHeight: 19 }}>
            Sáu câu theo đúng thứ tự thi. Mỗi câu trả lời được đo tốc độ, từ đệm và ngập ngừng; cuối buổi có bản phân tích chi tiết.
          </Text>
        </View>
      </LinearGradient>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {SPEAKING_TOPICS.map((t) => (
          <Pressable
            key={t.id}
            accessibilityRole="button"
            accessibilityLabel={`Nói cùng Leo về ${t.titleVi}`}
            onPress={() => router.push(`/hub/live/${t.id}` as never)}
            style={[GLASS_CARD, { flexBasis: '47%', flexGrow: 1, minWidth: 150, padding: 14, gap: 8 }]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <CoinIcon name={done[t.id] ? 'achievements' : 'friends'} size={44} />
              <Icon name="chevron-right" size={16} color={HUB.muted} />
            </View>
            <Text style={{ color: HUB.ink, fontSize: 15, fontWeight: '800' }}>{t.titleVi}</Text>
            <Text style={{ color: HUB.muted, fontSize: 12 }}>{t.title}</Text>
          </Pressable>
        ))}
      </View>
    </HubScreen>
  );
}
