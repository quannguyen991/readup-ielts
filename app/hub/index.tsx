import React, { useMemo, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { HubScreen } from '@/components/hub/HubScreen';
import { GLASS_CARD, HUB, TAG_COLOR } from '@/components/hub/theme';
import { Icon, type IconName } from '@/components/ui/Icon';
import { dailyTasks, dayKeyOf, streakDays, weekStrip } from '@/services/hub/daily';
import { GRAMMAR_TOTAL, PHONEME_TOTAL, ROLEPLAY_TOTAL, journeyRatio } from '@/services/hub/journey';
import { useHubStore } from '@/store/useHubStore';

const WEEKDAYS = ['CN', 'Th 2', 'Th 3', 'Th 4', 'Th 5', 'Th 6', 'Th 7'];

export default function HubToday() {
  const today = dayKeyOf(new Date());
  const doneByDay = useHubStore((s) => s.doneByDay);
  const phonemeBest = useHubStore((s) => s.phonemeBest);
  const lessonsHub = useHubStore((s) => s.lessonsDone);
  const roleplayDone = useHubStore((s) => s.roleplayDone);
  const doneToday = doneByDay[today] ?? [];
  const tasks = useMemo(
    () => dailyTasks(today, { phonemeBest, lessonsDone: lessonsHub, roleplayDone }),
    [today, phonemeBest, lessonsHub, roleplayDone],
  );
  const strip = weekStrip(doneByDay, today);
  const streak = streakDays(doneByDay, today);
  const [info, setInfo] = useState(false);
  const ratio = journeyRatio({
    phonemesMastered: Object.values(phonemeBest).filter((s) => s >= 80).length,
    lessonsPassed: Object.keys(lessonsHub).length,
    roleplaysPassed: Object.keys(roleplayDone).length,
  });

  return (
    <HubScreen title="Hôm nay" subtitle="Luyện một chút mỗi ngày, chuỗi sẽ dài ra.">
      {/* Chuỗi tuần */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {strip.map((d) => {
          const label = WEEKDAYS[new Date(`${d.day}T12:00:00`).getDay()] ?? '';
          return (
            <View key={d.day} style={{ alignItems: 'center', gap: 6 }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: d.done ? 'rgba(184,149,90,0.28)' : HUB.glass, borderWidth: 1, borderColor: d.done ? HUB.blue : HUB.line }}>
                <Icon name="flame" size={18} color={d.done ? HUB.blue : HUB.muted} strokeWidth={2} />
              </View>
              <Text style={{ color: d.isToday ? HUB.ink : HUB.muted, fontSize: 11, fontWeight: d.isToday ? '700' : '500' }}>{label}</Text>
            </View>
          );
        })}
      </View>

      {/* Nhiệm vụ hôm nay */}
      <View style={[GLASS_CARD, { padding: 16, gap: 10 }]}>
        <Text style={{ color: HUB.ink, fontSize: 17, fontWeight: '800' }}>Nhiệm vụ hôm nay</Text>
        <Text style={{ color: HUB.muted, fontSize: 12 }}>
          {doneToday.length}/{tasks.length} hoàn thành · {streak > 0 ? `chuỗi ${streak} ngày` : 'làm một việc để bắt đầu chuỗi'}
        </Text>
        {tasks.map((t) => {
          const done = doneToday.includes(t.id);
          const icon: IconName = t.kind === 'roleplay' ? 'briefcase' : 'book';
          return (
            <Pressable
              key={t.id}
              accessibilityRole="button"
              accessibilityLabel={t.title}
              onPress={() => router.push(t.route as never)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12, backgroundColor: HUB.glassStrong, borderWidth: 1, borderColor: HUB.line }}
            >
              <Icon name={icon} size={18} color={done ? HUB.green : HUB.blue} />
              <Text numberOfLines={2} style={{ flex: 1, color: HUB.ink, fontSize: 14, fontWeight: '600' }}>{t.title}</Text>
              <Text style={{ color: done ? HUB.green : HUB.muted, fontSize: 12, fontWeight: '700' }}>{done ? '1/1' : '0/1'}</Text>
              <Icon name="chevron-right" size={16} color={HUB.muted} />
            </Pressable>
          );
        })}
      </View>

      {/* Hành trình */}
      <View style={[GLASS_CARD, { padding: 16, gap: 12 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ color: HUB.ink, fontSize: 17, fontWeight: '800' }}>Hành trình của bạn</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Điều kiện thăng cấp" onPress={() => setInfo(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, borderWidth: 1, borderColor: HUB.line }}>
            <Text style={{ color: HUB.ink, fontSize: 12, fontWeight: '700' }}>B2 → C1</Text>
            <Icon name="info" size={13} color={HUB.muted} />
          </Pressable>
        </View>
        <View style={{ height: 14, borderRadius: 7, backgroundColor: HUB.glassStrong, overflow: 'hidden' }}>
          <View style={{ width: `${Math.round(ratio * 100)}%`, height: 14, borderRadius: 7, backgroundColor: HUB.blue }} />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ color: HUB.body, fontSize: 13 }}>Tiến độ CEFR B2</Text>
          <Text style={{ color: HUB.body, fontSize: 13, fontWeight: '700' }}>{Math.round(ratio * 100)}%</Text>
        </View>
      </View>

      {/* Công cụ AI */}
      <Text style={{ color: HUB.ink, fontSize: 17, fontWeight: '800' }}>Công cụ AI</Text>
      <View style={{ gap: 10 }}>
        {TOOLS.map((tool) => (
          <Pressable
            key={tool.title}
            accessibilityRole="button"
            accessibilityLabel={tool.title}
            onPress={() => router.push((tool.route ?? '/hub/meeting') as never)}
            style={[GLASS_CARD, { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 }]}
          >
            <View style={{ width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: HUB.glassStrong }}>
              <Icon name={tool.icon} size={22} color={tool.color} />
            </View>
            <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <Text style={{ color: HUB.ink, fontSize: 15, fontWeight: '700' }}>{tool.title}</Text>
                {tool.tag ? <Text style={{ color: TAG_COLOR[tool.tag], fontSize: 10, fontWeight: '800', borderWidth: 1, borderColor: TAG_COLOR[tool.tag], borderRadius: 999, paddingHorizontal: 6, paddingVertical: 1 }}>{tool.tag}</Text> : null}
                {!tool.route ? <Text style={{ color: HUB.muted, fontSize: 10, fontWeight: '700' }}>SẮP CÓ</Text> : null}
              </View>
              <Text style={{ color: HUB.muted, fontSize: 12 }}>{tool.desc}</Text>
            </View>
            <Icon name="chevron-right" size={18} color={HUB.muted} />
          </Pressable>
        ))}
      </View>

      <Modal visible={info} transparent animationType="fade" onRequestClose={() => setInfo(false)}>
        <Pressable onPress={() => setInfo(false)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <View style={[GLASS_CARD, { backgroundColor: HUB.paper, padding: 20, gap: 10, maxWidth: 420 }]}>
            <Text style={{ color: HUB.ink, fontSize: 17, fontWeight: '800' }}>Điều kiện thăng cấp</Text>
            <Text style={{ color: HUB.body, fontSize: 14, lineHeight: 21 }}>
              {`Đạt ít nhất 80 điểm ở ${PHONEME_TOTAL} âm vị, hoàn thành ${GRAMMAR_TOTAL} bài ngữ pháp từ A1 đến C và ${ROLEPLAY_TOTAL} kịch bản nhập vai. Thanh tiến độ là ước lượng từ việc luyện tập trên máy này, không phải kết quả thi.`}
            </Text>
            <Text style={{ color: HUB.muted, fontSize: 12 }}>Chạm để đóng.</Text>
          </View>
        </Pressable>
      </Modal>
    </HubScreen>
  );
}

const TOOLS: { title: string; desc: string; icon: IconName; color: string; route?: string; tag?: 'NEW' | 'BETA' }[] = [
  { title: 'Phân tích giọng nói', desc: 'Ghi âm và xem giọng bạn nghe thế nào: tốc độ, từ đệm, ngập ngừng, đa dạng từ.', icon: 'mic', color: HUB.blue, route: '/hub/analyze', tag: 'NEW' },
  { title: 'Điều chỉnh giọng nói', desc: 'Nghe mẫu, đọc theo và xem đường lên xuống giọng của bạn.', icon: 'volume', color: HUB.green, route: '/hub/pitch' },
  { title: 'Video ngắn', desc: 'Lướt các câu luyện nói ngắn, nghe và nói theo, có mẹo phát âm.', icon: 'play', color: HUB.violet, route: '/hub/short', tag: 'BETA' },
  { title: 'Nói đuổi', desc: 'Đọc theo câu mẫu có chữ chạy theo giọng, chỉnh được tốc độ.', icon: 'chat', color: HUB.amber, route: '/hub/shadow', tag: 'BETA' },
  { title: 'Từ điển', desc: 'Tra từ để xem phiên âm, nghĩa và nghe phát âm mẫu.', icon: 'search', color: HUB.orange, route: '/hub/dictionary' },
  { title: 'Trợ lý cuộc họp', desc: 'Dán phần bạn đã nói trong cuộc họp để nhận phản hồi về từ đệm, lặp từ và đa dạng từ.', icon: 'briefcase', color: HUB.muted, route: '/hub/meeting', tag: 'NEW' },
];
