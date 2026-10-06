import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import Svg, { Rect } from 'react-native-svg';

import { TravelPage } from '@/components/travel/ui/TravelPage';
import { GameButton, PixelPanel, T } from '@/components/travel/ui/kit';
import { OUTFITS } from '@/components/travel/ui/Traveller';
import { DORM_SLOTS, STUDY_ABROAD_DECORATIONS, type DormDecoration, type DormSlot } from '@/data/study-abroad-dorm';
import { STUDY_ABROAD_MISSIONS } from '@/data/study-abroad-campaign';
import { bi, useL } from '@/i18n/useL';
import { useStudyAbroadStore } from '@/store/useStudyAbroadStore';
import { useTravelStore } from '@/store/useTravelStore';
import { useTravelReady } from '@/components/travel/useTravel';

export default function StudyAbroadDormScreen() {
  const ready = useTravelReady();
  const { L, locale } = useL();
  const completed = useStudyAbroadStore((state) => state.completed);
  const decorations = useStudyAbroadStore((state) => state.decorations);
  const restedAt = useStudyAbroadStore((state) => state.restedAt);
  const setDecoration = useStudyAbroadStore((state) => state.setDecoration);
  const rest = useStudyAbroadStore((state) => state.rest);
  const outfitIndex = useTravelStore((state) => state.prefs.outfit);
  const missionCount = STUDY_ABROAD_MISSIONS.length;
  const xp = completed.length * 15;

  const itemAt = (slot: DormSlot) => STUDY_ABROAD_DECORATIONS.find((item) => item.id === decorations[slot]) ?? STUDY_ABROAD_DECORATIONS.find((item) => item.slot === slot)!;

  return (
    <TravelPage title={L('Phòng ký túc xá', 'Dorm room')} back="/quest/study-abroad" backLabel={L('Hành trình', 'Journey')}>
      {!ready ? null : (
        <>
          <PixelPanel tone="navy" inner={{ padding: 16, gap: 9 }}>
            <Text className="font-heavy" style={{ color: T.goldLight, fontSize: 21 }}>{L('Góc nhỏ của bạn', 'Your own little corner')}</Text>
            <Text className="font-sans" style={{ color: T.cream, fontSize: 13, lineHeight: 19 }}>
              {L('Mỗi nhiệm vụ mở một món trang trí. Chọn đồ cho từng góc phòng; vật phẩm đã mở sẽ được lưu trên thiết bị.', 'Each completed mission unlocks a decoration. Choose an item for each part of the room; your choices are saved on this device.')}
            </Text>
            <Text className="font-semi" style={{ color: T.goldLight, fontSize: 13 }}>{L(`${completed.length}/${missionCount} nhiệm vụ · ${xp} XP`, `${completed.length}/${missionCount} missions · ${xp} XP`)}</Text>
          </PixelPanel>

          <DormPreview items={DORM_SLOTS.map((slot) => itemAt(slot.id))} outfitIndex={outfitIndex} />

          <View style={{ marginTop: 14, gap: 10 }}>
            {DORM_SLOTS.map((slot) => (
              <PixelPanel key={slot.id} inner={{ padding: 13, gap: 9 }}>
                <Text className="font-heavy" style={{ color: T.ink, fontSize: 16 }}>{bi(slot.name, locale)}</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {STUDY_ABROAD_DECORATIONS.filter((item) => item.slot === slot.id).map((item) => {
                    const unlocked = !item.unlockMission || completed.includes(item.unlockMission);
                    const selected = decorations[slot.id] === item.id;
                    const mission = item.unlockMission ? STUDY_ABROAD_MISSIONS.find((entry) => entry.id === item.unlockMission) : null;
                    return (
                      <DecorationOption
                        key={item.id}
                        item={item}
                        unlocked={unlocked}
                        selected={selected}
                        lockedHint={mission ? L(`Mở sau: ${bi(mission.place, locale)}`, `Unlock after: ${bi(mission.place, locale)}`) : L('Đồ cơ bản', 'Starter item')}
                        onPress={() => setDecoration(slot.id, item.id)}
                      />
                    );
                  })}
                </View>
              </PixelPanel>
            ))}
          </View>

          <PixelPanel tone="paper" style={{ marginTop: 14 }} inner={{ padding: 14, gap: 9 }}>
            <Text className="font-heavy" style={{ color: T.ink, fontSize: 16 }}>{L('Nghỉ giữa hành trình', 'Take a break')}</Text>
            <Text className="font-sans" style={{ color: T.muted, fontSize: 13, lineHeight: 19 }}>
              {restedAt
                ? L(`Bạn đã nghỉ ngơi. Hành trình đang có ${completed.length}/${missionCount} nhiệm vụ và ${xp} XP.`, `You have rested. Your journey has ${completed.length}/${missionCount} missions and ${xp} XP.`)
                : L('Nghỉ một chút rồi tiếp tục học kỳ trao đổi.', 'Rest for a moment, then continue your exchange semester.')}
            </Text>
            <GameButton label={L('Nghỉ ngơi', 'Rest')} tone="navy" onPress={rest} />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <GameButton label={L('Hồ sơ & trang phục', 'Profile & outfit')} tone="paper" onPress={() => router.push('/quest/study-abroad/profile' as never)} />
              <GameButton label={L('Về nhiệm vụ', 'Back to missions')} tone="gold" onPress={() => router.push('/quest/study-abroad' as never)} />
            </View>
          </PixelPanel>
        </>
      )}
      <View style={{ height: 24 }} />
    </TravelPage>
  );
}

function DormPreview({ items, outfitIndex }: { items: DormDecoration[]; outfitIndex: number }) {
  const { L, locale } = useL();
  const decor = Object.fromEntries(items.map((entry) => [entry.slot, entry])) as Record<DormSlot, DormDecoration>;
  const clothes = OUTFITS[Math.max(0, Math.min(OUTFITS.length - 1, outfitIndex))]!;
  const quilt = decor.bed.id === 'residence-quilt' ? '#B96F5D' : '#567C94';
  const accent = decor.wall.id === 'group-photo' ? '#C78666' : decor.wall.id === 'research-poster' ? '#7594A0' : '#B99452';
  return (
    <PixelPanel tone="paper" style={{ marginTop: 14 }} inner={{ padding: 10 }}>
      <Svg width="100%" height={230} viewBox="0 0 320 230">
        <Rect x="0" y="0" width="320" height="230" fill="#E9D8B4" />
        <Rect x="0" y="0" width="320" height="10" fill="#765332" />
        <Rect x="0" y="10" width="320" height="7" fill="#A17A4C" />
        <Rect x="0" y="166" width="320" height="64" fill="#9C7049" />
        <Rect x="0" y="166" width="320" height="7" fill="#765332" />
        <Rect x="12" y="50" width="3" height="116" fill="#C2A274" />
        <Rect x="166" y="50" width="3" height="116" fill="#C2A274" />
        <Rect x="16" y="166" width="88" height="3" fill="#765332" />
        <Rect x="110" y="166" width="84" height="3" fill="#765332" />
        <Rect x="200" y="166" width="106" height="3" fill="#765332" />
        {/* Window */}
        <Rect x="232" y="27" width="66" height="48" fill="#755539" />
        <Rect x="238" y="33" width="54" height="36" fill="#83B8C4" />
        <Rect x="263" y="33" width="4" height="36" fill="#F2E5C6" />
        <Rect x="238" y="49" width="54" height="4" fill="#F2E5C6" />
        <Rect x="242" y="37" width="12" height="6" fill="#C7DFAE" />
        <Rect x="273" y="57" width="12" height="6" fill="#C7DFAE" />
        {/* Wall keepsake */}
        <Rect x="37" y="35" width="66" height="43" fill="#715035" />
        <Rect x="42" y="40" width="56" height="33" fill={accent} />
        {decor.wall.id === 'sg-campus-flag' ? <>
          <Rect x="48" y="45" width="44" height="5" fill="#FFFFFF" />
          <Rect x="48" y="53" width="44" height="5" fill="#D85D55" />
          <Rect x="48" y="61" width="44" height="5" fill="#FFFFFF" />
        </> : decor.wall.id === 'research-poster' ? <>
          <Rect x="49" y="45" width="38" height="4" fill="#F5EBD4" />
          <Rect x="49" y="53" width="20" height="13" fill="#52798B" />
          <Rect x="73" y="53" width="14" height="3" fill="#F5EBD4" />
          <Rect x="73" y="59" width="14" height="3" fill="#F5EBD4" />
        </> : <>
          <Rect x="49" y="46" width="38" height="4" fill="#F5EBD4" />
          <Rect x="49" y="55" width="8" height="8" fill="#F5EBD4" />
          <Rect x="61" y="55" width="8" height="8" fill="#F5EBD4" />
          <Rect x="73" y="55" width="14" height="8" fill="#F5EBD4" />
        </>}
        {/* Bed */}
        <Rect x="24" y="112" width="103" height="11" fill="#704C33" />
        <Rect x="28" y="119" width="94" height="38" fill="#EDE3CC" />
        <Rect x="28" y="134" width="94" height="23" fill={quilt} />
        <Rect x="37" y="122" width="27" height="11" fill="#FFF8E7" />
        <Rect x="24" y="155" width="6" height="11" fill="#60452F" />
        <Rect x="120" y="155" width="6" height="11" fill="#60452F" />
        {/* Desk, chair and the selected study keepsake */}
        <Rect x="178" y="112" width="105" height="9" fill="#745034" />
        <Rect x="184" y="121" width="7" height="35" fill="#745034" />
        <Rect x="270" y="121" width="7" height="35" fill="#745034" />
        {decor.desk.id === 'hawker-mug' ? <>
          <Rect x="228" y="97" width="14" height="15" fill="#4F8390" />
          <Rect x="242" y="100" width="6" height="8" fill="#4F8390" />
          <Rect x="231" y="94" width="8" height="3" fill="#6A4B32" />
        </> : decor.desk.id === 'student-folder' ? <>
          <Rect x="223" y="103" width="31" height="9" fill="#D3A84F" />
          <Rect x="228" y="97" width="21" height="6" fill="#E5C878" />
          <Rect x="238" y="97" width="3" height="15" fill="#A87938" />
        </> : <>
          <Rect x="223" y="104" width="34" height="8" fill="#B8784A" />
          <Rect x="228" y="98" width="27" height="6" fill="#F0E5CA" />
          <Rect x="233" y="92" width="17" height="6" fill="#54768B" />
        </>}
        <Rect x="202" y="122" width="25" height="6" fill="#5E4938" />
        <Rect x="207" y="128" width="4" height="17" fill="#5E4938" />
        <Rect x="218" y="128" width="4" height="17" fill="#5E4938" />
        {/* Shelf */}
        <Rect x="282" y="94" width="29" height="64" fill="#705035" />
        <Rect x="286" y="101" width="21" height="3" fill="#D2B17B" />
        <Rect x="286" y="119" width="21" height="3" fill="#D2B17B" />
        <Rect x="286" y="137" width="21" height="3" fill="#D2B17B" />
        <Rect x="288" y="106" width="5" height="11" fill="#9E5549" />
        <Rect x="295" y="106" width="5" height="11" fill="#476A73" />
        <Rect x="288" y="124" width="5" height="11" fill="#C09A52" />
        <Rect x="297" y="124" width="7" height="11" fill={decor.shelf.id === 'scholarship-trophy' ? '#D2A93C' : '#E9D8B4'} />
        {/* Plant or reading lamp */}
        {decor.corner.id === 'library-lamp' ? <>
          <Rect x="142" y="105" width="7" height="36" fill="#735437" />
          <Rect x="129" y="101" width="32" height="8" fill="#D7B85D" />
          <Rect x="134" y="109" width="22" height="5" fill="#F4E9C9" />
          <Rect x="137" y="141" width="18" height="5" fill="#735437" />
        </> : <>
          <Rect x="140" y="139" width="23" height="15" fill="#A66D43" />
          <Rect x="136" y="135" width="31" height="6" fill="#CF9E62" />
          <Rect x="150" y="116" width="5" height="20" fill="#547B54" />
          <Rect x="141" y="119" width="10" height="6" fill="#5F8B5E" />
          <Rect x="154" y="112" width="12" height="6" fill="#6B9865" />
          <Rect x="143" y="127" width="11" height="6" fill="#6B9865" />
        </>}
        {/* Student avatar using the selected travel outfit palette */}
        <Rect x="154" y="143" width="18" height="7" fill={clothes.hair} />
        <Rect x="152" y="150" width="22" height="10" fill="#E9B98A" />
        <Rect x="154" y="154" width="4" height="3" fill="#2B1B12" />
        <Rect x="168" y="154" width="4" height="3" fill="#2B1B12" />
        <Rect x="151" y="160" width="24" height="16" fill={clothes.jacket} />
        <Rect x="151" y="160" width="24" height="4" fill={clothes.scarf} />
        <Rect x="154" y="176" width="7" height="12" fill="#39404A" />
        <Rect x="166" y="176" width="7" height="12" fill="#39404A" />
        <Rect x="151" y="188" width="11" height="4" fill="#242932" />
        <Rect x="165" y="188" width="11" height="4" fill="#242932" />
      </Svg>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginTop: 7 }}>
        {items.map((entry) => <Text key={entry.id} className="font-semi" style={{ color: T.muted, fontSize: 11 }}>{entry.glyph} {bi(entry.name, locale)}</Text>)}
      </View>
      <Text className="mt-2 font-semi" style={{ color: T.goldDark, textAlign: 'center', fontSize: 12 }}>{L('Phòng pixel của bạn · trang trí mở theo nhiệm vụ', 'Your pixel dorm · decorations unlock through missions')}</Text>
    </PixelPanel>
  );
}

function DecorationOption({ item, unlocked, selected, lockedHint, onPress }: { item: DormDecoration; unlocked: boolean; selected: boolean; lockedHint: string; onPress: () => void }) {
  const { locale } = useL();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected, disabled: !unlocked }}
      disabled={!unlocked}
      onPress={onPress}
      style={{ flexGrow: 1, flexBasis: 132, minHeight: 82, padding: 9, borderRadius: 9, borderWidth: 1.5, borderColor: selected ? T.goldDark : T.line, backgroundColor: selected ? '#F7EDDA' : '#FFFFFF', opacity: unlocked ? 1 : 0.52 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
        <Text style={{ fontSize: 22 }}>{unlocked ? item.glyph : '🔒'}</Text>
        <Text numberOfLines={2} className="font-semi" style={{ flex: 1, color: T.ink, fontSize: 12 }}>{unlocked ? bi(item.name, locale) : bi(item.name, locale)}</Text>
      </View>
      <Text numberOfLines={2} className="font-sans" style={{ marginTop: 4, color: selected ? T.goldDark : T.muted, fontSize: 11, lineHeight: 15 }}>{unlocked ? (selected ? (locale === 'vi' ? 'Đang đặt' : 'Placed') : bi(item.description, locale)) : lockedHint}</Text>
    </Pressable>
  );
}
