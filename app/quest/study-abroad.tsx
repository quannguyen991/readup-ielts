import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { TravelPage } from '@/components/travel/ui/TravelPage';
import { GameButton, PixelPanel, T } from '@/components/travel/ui/kit';
import { bi, useL } from '@/i18n/useL';
import { STUDY_ABROAD_CHAPTERS, STUDY_ABROAD_MISSIONS } from '@/data/study-abroad-campaign';
import { useStudyAbroadStore } from '@/store/useStudyAbroadStore';
import { useGameStore } from '@/store/useGameStore';
import { pronounce } from '@/services/audio/pronounce';
import { MissionStage } from '@/components/study-abroad/MissionStage';

export default function StudyAbroadCampaignScreen() {
  const { L, locale } = useL();
  const completed = useStudyAbroadStore((state) => state.completed);
  const completeMission = useStudyAbroadStore((state) => state.completeMission);
  const next = STUDY_ABROAD_MISSIONS.find((mission) => !completed.includes(mission.id));
  const activeChapter = next?.chapter ?? 5;
  const [selectedId, setSelectedId] = useState(next?.id ?? STUDY_ABROAD_MISSIONS.at(-1)?.id ?? 'arrival');
  const [stageOpen, setStageOpen] = useState(false);
  const [justDone, setJustDone] = useState<string | null>(null);
  const selected = useMemo(() => STUDY_ABROAD_MISSIONS.find((mission) => mission.id === selectedId), [selectedId]);
  const progress = completed.length;
  const learned = STUDY_ABROAD_MISSIONS.filter((mission) => completed.includes(mission.id));
  // Chặng vừa xong trọn vẹn ở nhiệm vụ đang xem: hiện lời chúc đúng lúc người học vừa làm xong.
  const finishedChapter = justDone && selected && STUDY_ABROAD_MISSIONS.filter((m) => m.chapter === selected.chapter).every((m) => completed.includes(m.id))
    ? STUDY_ABROAD_CHAPTERS.find((c) => c.id === selected.chapter)
    : undefined;
  const currentNext = next?.id ?? null;
  const cityMapPath = `/quest/du-ngoan/${selected ? (['singapore', 'london', 'paris', 'tokyo', 'newyork'] as const)[selected.chapter - 1] : 'singapore'}`;

  const chooseMission = (id: string) => {
    const mission = STUDY_ABROAD_MISSIONS.find((item) => item.id === id);
    if (!mission || (mission.id !== currentNext && !completed.includes(mission.id))) return;
    setSelectedId(id);
    // Đang ở trong cảnh thì sang nhiệm vụ mới là vào cảnh mới luôn (key đổi nên cảnh dựng lại từ bản đồ xa).
    setStageOpen(true);
  };

  /** Trả lời đúng lần đầu: ghi nhiệm vụ + XP thật của hệ game (kèm combo, quái, sao). */
  const solve = (id: string): number => {
    completeMission(id);
    setJustDone(id);
    return useGameStore.getState().answer(true, 'vocab', { key: `abroad:${id}` })?.xpGained ?? 0;
  };
  const nextAfter = selected
    ? STUDY_ABROAD_MISSIONS.find((mission, i) => i > STUDY_ABROAD_MISSIONS.findIndex((m) => m.id === selected.id) && !completed.includes(mission.id))
    : undefined;

  return (
    <TravelPage title={L('Học kỳ quanh thế giới', 'Study Abroad World Tour')} back="/quest/du-ngoan" backLabel={L('Bản đồ du ngoạn', 'Travel map')}>
      <PixelPanel tone="navy" inner={{ padding: 18, gap: 10 }}>
        <Text className="font-heavy" style={{ color: T.goldLight, fontSize: 23 }}>{L('Học kỳ trao đổi', 'The exchange semester')}</Text>
        <Text className="font-sans" style={{ color: T.cream, fontSize: 15, lineHeight: 22 }}>
          {L('Bạn nhận học bổng trao đổi và phải thích nghi qua ba thành phố. Nói chuyện với nhân viên, bạn học và giảng viên để mở chặng tiếp theo.', 'You have won an exchange scholarship and must find your feet in three cities. Talk with staff, classmates, and lecturers to unlock each next stop.')}
        </Text>
        <View style={{ height: 9, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.14)', overflow: 'hidden' }} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: STUDY_ABROAD_MISSIONS.length, now: progress }}>
          <View style={{ width: `${(progress / STUDY_ABROAD_MISSIONS.length) * 100}%`, height: '100%', backgroundColor: T.goldLight }} />
        </View>
        <Text className="font-semi" style={{ color: T.cream, fontSize: 13 }}>{progress}/{STUDY_ABROAD_MISSIONS.length} {L('nhiệm vụ', 'missions')}</Text>
      </PixelPanel>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 12 }}>
        <GameButton label={L('Hồ sơ & trang phục', 'Profile & outfit')} tone="paper" onPress={() => router.push('/quest/study-abroad/profile' as never)} />
        <GameButton label={L('Phòng ký túc xá', 'Dorm room')} tone="gold" onPress={() => router.push('/quest/study-abroad/dorm' as never)} />
      </View>

      <View style={{ marginTop: 16, gap: 14 }}>
        {STUDY_ABROAD_CHAPTERS.map((chapter) => {
          const missions = STUDY_ABROAD_MISSIONS.filter((mission) => mission.chapter === chapter.id);
          const chapterOpen = chapter.id <= activeChapter || missions.every((mission) => completed.includes(mission.id));
          return (
            <PixelPanel key={chapter.id} inner={{ padding: 14, gap: 10 }}>
              <View className="flex-row flex-wrap items-baseline justify-between gap-2">
                <Text className="font-heavy" style={{ color: T.ink, fontSize: 17 }}>{L(`Chặng ${chapter.id} · `, `Chapter ${chapter.id} · `)}{bi(chapter.title, locale)}</Text>
                <Text className="font-sans" style={{ color: T.muted, fontSize: 12 }}>{missions.filter((mission) => completed.includes(mission.id)).length}/{missions.length}</Text>
              </View>
              <Text className="font-sans" style={{ color: T.muted, fontSize: 13, lineHeight: 19 }}>{bi(chapter.subtitle, locale)}</Text>
              <View style={{ gap: 7 }}>
                {missions.map((mission, index) => {
                  const done = completed.includes(mission.id);
                  const unlocked = chapterOpen && (done || mission.id === currentNext);
                  const active = mission.id === selectedId;
                  return (
                    <Pressable
                      key={mission.id}
                      accessibilityRole="button"
                      accessibilityState={{ disabled: !unlocked, selected: active }}
                      disabled={!unlocked}
                      onPress={() => chooseMission(mission.id)}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 10, borderWidth: 1.5, borderColor: active ? T.goldDark : T.line, backgroundColor: active ? '#F7EDDA' : T.paper, opacity: unlocked ? 1 : 0.52 }}
                    >
                      <View style={{ width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: done ? T.good : active ? T.goldDark : T.navy }}>
                        <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 12 }}>{done ? '✓' : unlocked ? index + 1 : '🔒'}</Text>
                      </View>
                      <View className="min-w-0 flex-1">
                        <Text className="font-strong" style={{ color: T.ink, fontSize: 14 }}>{bi(mission.place, locale)}</Text>
                        <Text className="font-sans" style={{ color: T.muted, fontSize: 12 }}>{bi(mission.role, locale)} · {bi(mission.city, locale)}</Text>
                      </View>
                      <Text className="font-semi" style={{ color: T.goldDark, fontSize: 12 }}>{done ? L('Xong', 'Done') : unlocked ? '›' : '• • •'}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </PixelPanel>
          );
        })}
      </View>

      {learned.length > 0 ? (
        <PixelPanel style={{ marginTop: 16 }} inner={{ padding: 14, gap: 8 }}>
          <Text className="font-heavy" style={{ color: T.ink, fontSize: 16 }}>{L(`Cụm từ bạn đã dùng được (${learned.length})`, `Phrases you can now use (${learned.length})`)}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {learned.map((m) => (
              <Pressable key={m.id} accessibilityRole="button" accessibilityLabel={L(`Nghe: ${m.target}`, `Listen: ${m.target}`)} onPress={() => void pronounce(m.target)} style={{ paddingHorizontal: 11, paddingVertical: 8, borderRadius: 999, backgroundColor: '#F7EDDA', borderWidth: 1, borderColor: T.goldDark }}>
                <Text className="font-semi" style={{ color: T.ink, fontSize: 13 }}>🔊 {m.target}</Text>
              </Pressable>
            ))}
          </View>
        </PixelPanel>
      ) : null}

      {finishedChapter ? (
        <PixelPanel tone="navy" style={{ marginTop: 16 }} inner={{ padding: 16, gap: 6 }}>
          <Text className="font-heavy" style={{ color: T.goldLight, fontSize: 18 }}>{L(`Hoàn thành chặng ${finishedChapter.id}!`, `Chapter ${finishedChapter.id} complete!`)}</Text>
          <Text className="font-sans" style={{ color: T.cream, fontSize: 14, lineHeight: 21 }}>
            {finishedChapter.id < 3
              ? L('Bạn đã mở chặng tiếp theo và thêm đồ mới cho phòng ký túc xá.', 'The next chapter is open and new items await in your dorm room.')
              : L('Bạn đã hoàn thành học kỳ trao đổi. Mở phòng ký túc xá để xem chiếc cúp học bổng.', 'You finished the exchange semester. Visit your dorm room to see the scholarship trophy.')}
          </Text>
        </PixelPanel>
      ) : null}

      {selected ? (
        <PixelPanel tone="paper" style={{ marginTop: 16 }} inner={{ padding: 16, gap: 10 }}>
          <Text className="font-heavy" style={{ color: T.goldDark, fontSize: 11, letterSpacing: 1 }}>{bi(selected.npc, locale).toUpperCase()} · {bi(selected.role, locale).toUpperCase()}</Text>
          <Text className="font-heavy" style={{ color: T.ink, fontSize: 18 }}>{bi(selected.place, locale)} · {bi(selected.city, locale)}</Text>
          <Text className="font-sans" style={{ color: T.muted, fontSize: 14, lineHeight: 21 }}>
            {L('Bạn đi bộ dọc phố (2D) tới nhân vật, cảnh phóng to, nhân vật nói và đọc to ngay trên phố. Mỗi nhiệm vụ có vài lượt: chọn câu, đưa đồ, xếp từ, điền từ, nghe, nói vào micro — rồi có thể hỏi thêm nhân vật.', 'Walk along a 2D street to the character; the scene zooms in and they speak right there. Each mission has several steps: choose a reply, hand over an item, order words, fill a gap, listen, or speak into the mic — then ask the character more.')}
          </Text>
          <GameButton label={completed.includes(selected.id) ? L('Vào phố · luyện lại', 'Walk in · practise again') : L('Vào phố nói chuyện', 'Walk into the street')} tone="gold" onPress={() => setStageOpen(true)} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <GameButton label={L('Khám phá thành phố', 'Explore the city')} tone="paper" onPress={() => router.push(cityMapPath as never)} />
            <GameButton label={L('Mở bản đồ thế giới', 'Open world map')} tone="paper" onPress={() => router.push('/quest/du-ngoan' as never)} />
          </View>
        </PixelPanel>
      ) : null}
      {selected && stageOpen ? (
        <MissionStage
          key={selected.id}
          mission={selected}
          alreadyDone={completed.includes(selected.id)}
          onSolved={solve}
          onClose={() => setStageOpen(false)}
          onNext={nextAfter ? () => { chooseMission(nextAfter.id); } : undefined}
        />
      ) : null}
      <View className="h-8" />
    </TravelPage>
  );
}
