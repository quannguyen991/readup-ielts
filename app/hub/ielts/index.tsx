import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { HubScreen } from '@/components/hub/HubScreen';
import { GLASS_CARD, HUB } from '@/components/hub/theme';
import { Icon } from '@/components/ui/Icon';
import { CRITERIA_INFO, IELTS_LESSONS, STAGES, lessonsOfStage } from '@/data/hub/ielts-speaking';
import { useHubStore } from '@/store/useHubStore';

const CRITERIA_LABEL: Record<string, string> = {
  fluency: 'Lưu loát',
  lexical: 'Vốn từ',
  grammar: 'Ngữ pháp',
  pronunciation: 'Phát âm',
};

/** Lộ trình luyện nói IELTS: 5 chặng, 20 bài, mỗi bài đánh dấu xong khi hoàn thành. */
export default function IeltsRoadmap() {
  const done = useHubStore((s) => s.ieltsDone);
  const doneCount = IELTS_LESSONS.filter((l) => done[l.id]).length;

  return (
    <HubScreen title="Lộ trình IELTS Speaking" subtitle={`Đã xong ${doneCount}/${IELTS_LESSONS.length} bài`} back>
      <View style={[GLASS_CARD, { padding: 16, gap: 10 }]}>
        <View style={{ height: 10, borderRadius: 5, backgroundColor: HUB.glassStrong, overflow: 'hidden' }}>
          <View style={{ width: `${Math.round((doneCount / IELTS_LESSONS.length) * 100)}%`, height: 10, borderRadius: 5, backgroundColor: HUB.blue }} />
        </View>
        <Text style={{ color: HUB.body, fontSize: 13, lineHeight: 19 }}>
          Mỗi chặng có 4 bài. Làm theo thứ tự: mỗi bài có cụm từ, bài tập ghi âm, bài mẫu và danh sách tự kiểm.
        </Text>
        <Pressable accessibilityRole="button" onPress={() => router.push('/hub/tutor/ielts-examiner' as never)} style={{ height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: HUB.blue, flexDirection: 'row', gap: 8 }}>
          <Icon name="sparkle" size={16} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '800' }}>Thi thử với Giám khảo IELTS</Text>
        </Pressable>
      </View>

      {STAGES.map((stage) => {
        const lessons = lessonsOfStage(stage.id);
        const stageDone = lessons.filter((l) => done[l.id]).length;
        return (
          <View key={stage.id} style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ color: HUB.ink, fontSize: 17, fontWeight: '800' }}>Band {stage.band} · {stage.titleVi}</Text>
                <Text style={{ color: HUB.muted, fontSize: 12, marginTop: 2 }}>{stage.goalVi}</Text>
              </View>
              <Text style={{ color: HUB.body, fontSize: 12, fontWeight: '700' }}>{stageDone}/{lessons.length}</Text>
            </View>
            {lessons.map((l) => {
              const isDone = Boolean(done[l.id]);
              return (
                <Pressable
                  key={l.id}
                  accessibilityRole="button"
                  accessibilityLabel={l.title}
                  onPress={() => router.push(`/hub/ielts/${l.id}` as never)}
                  style={[GLASS_CARD, { padding: 14, gap: 6 }]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{ width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: isDone ? 'rgba(46,125,79,0.18)' : HUB.glassStrong }}>
                      <Text style={{ color: isDone ? '#2E7D4F' : HUB.ink, fontWeight: '800' }}>{l.order}</Text>
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={{ color: HUB.ink, fontSize: 15, fontWeight: '700' }}>{l.title}</Text>
                      <Text style={{ color: HUB.muted, fontSize: 12 }}>{l.goal}</Text>
                    </View>
                    {isDone ? <Icon name="check" size={18} color="#2E7D4F" /> : <Icon name="chevron-right" size={18} color={HUB.muted} />}
                  </View>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {l.criteria.map((c) => (
                      <Text key={c} style={{ color: HUB.body, fontSize: 11, borderWidth: 1, borderColor: HUB.line, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 }}>
                        {CRITERIA_LABEL[c]}
                      </Text>
                    ))}
                  </View>
                </Pressable>
              );
            })}
          </View>
        );
      })}

      <Text style={{ color: HUB.ink, fontSize: 17, fontWeight: '800' }}>Bốn tiêu chí giám khảo chấm</Text>
      {CRITERIA_INFO.map((c) => (
        <View key={c.key} style={[GLASS_CARD, { padding: 14, gap: 6 }]}>
          <Text style={{ color: HUB.ink, fontSize: 15, fontWeight: '700' }}>{c.titleVi}</Text>
          {c.checkVi.map((line) => (
            <Text key={line} style={{ color: HUB.body, fontSize: 13, lineHeight: 19 }}>• {line}</Text>
          ))}
        </View>
      ))}
    </HubScreen>
  );
}
