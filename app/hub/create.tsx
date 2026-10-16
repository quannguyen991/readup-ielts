import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { HubScreen } from '@/components/hub/HubScreen';
import { GLASS_CARD, HUB } from '@/components/hub/theme';
import { clean } from '@/services/hub/persona';

const TONES = ['thân thiện', 'nghiêm khắc', 'hài hước', 'học thuật', 'bình tĩnh'];

/** Tự đặt vai cho gia sư: nhân vật, giọng, tình huống và mục tiêu. */
export default function CreateTutor() {
  const [role, setRole] = useState('');
  const [tone, setTone] = useState(TONES[0]!);
  const [situation, setSituation] = useState('');
  const [goal, setGoal] = useState('');
  const [error, setError] = useState<string | null>(null);

  const start = () => {
    const r = clean(role);
    const s = clean(situation);
    if (r.length < 3 || s.length < 5) {
      setError('Cần ghi rõ nhân vật (ít nhất 3 ký tự) và tình huống (ít nhất 5 ký tự).');
      return;
    }
    router.push({
      pathname: '/hub/tutor/[id]',
      params: { id: 'custom', role: r, tone, situation: s, goal: clean(goal) },
    } as never);
  };

  return (
    <HubScreen title="Tạo của riêng tôi" subtitle="Đặt nhân vật và tình huống, rồi nói chuyện như thật" back>
      <View style={[GLASS_CARD, { padding: 16, gap: 12 }]}>
        <Text style={{ color: HUB.ink, fontSize: 14, fontWeight: '800' }}>Nhân vật</Text>
        <TextInput value={role} onChangeText={setRole} placeholder="ví dụ: chủ quán cà phê ở Sydney" placeholderTextColor={HUB.muted} maxLength={160} style={{ height: 44, borderRadius: 10, paddingHorizontal: 12, color: HUB.ink, backgroundColor: HUB.glassStrong }} />

        <Text style={{ color: HUB.ink, fontSize: 14, fontWeight: '800' }}>Giọng điệu</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {TONES.map((t) => {
            const on = t === tone;
            return (
              <Pressable key={t} accessibilityRole="button" accessibilityState={{ selected: on }} onPress={() => setTone(t)} style={{ paddingHorizontal: 12, height: 36, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? HUB.violet : HUB.glassStrong, borderWidth: 1, borderColor: on ? HUB.violet : HUB.line }}>
                <Text style={{ color: HUB.ink, fontSize: 13, fontWeight: '700' }}>{t}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={{ color: HUB.ink, fontSize: 14, fontWeight: '800' }}>Tình huống</Text>
        <TextInput value={situation} onChangeText={setSituation} placeholder="ví dụ: khách hỏi vì sao đơn hàng bị chậm" placeholderTextColor={HUB.muted} maxLength={160} multiline style={{ minHeight: 60, borderRadius: 10, padding: 12, color: HUB.ink, backgroundColor: HUB.glassStrong, textAlignVertical: 'top' }} />

        <Text style={{ color: HUB.ink, fontSize: 14, fontWeight: '800' }}>Mục tiêu của bạn (tuỳ chọn)</Text>
        <TextInput value={goal} onChangeText={setGoal} placeholder="ví dụ: xin lỗi và đề xuất giải pháp" placeholderTextColor={HUB.muted} maxLength={160} style={{ height: 44, borderRadius: 10, paddingHorizontal: 12, color: HUB.ink, backgroundColor: HUB.glassStrong }} />

        {error ? <Text style={{ color: HUB.red, fontSize: 13 }}>{error}</Text> : null}
        <Pressable accessibilityRole="button" onPress={start} style={{ height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: HUB.blue }}>
          <Text style={{ color: '#fff', fontWeight: '800' }}>Bắt đầu hội thoại</Text>
        </Pressable>
      </View>
    </HubScreen>
  );
}
