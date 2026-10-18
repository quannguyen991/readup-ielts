import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Card, Icon } from '@/components/ui';
import { BackPill, Bar, Cols, Eyebrow, GAP, HUB, useBoxWidth } from '@/components/game/quest-hub/kit';
import { useL } from '@/i18n/useL';
import { useNow } from '@/lib/clock';
import { useAlbumStore } from '@/store/useAlbumStore';
import { Aura, Pop } from '@/components/game/juice';
import {
  albumForWeek,
  albumHistory,
  albumProgress,
  remainingMs,
  slotStates,
  splitDuration,
  weekById,
  weekDays,
  weekOf,
  type AlbumWeek,
  type SlotState,
} from '@/services/game/album';
import type { AlbumDef } from '@/data/album';

/**
 * ALBUM SƯU TẦM THEO TUẦN. Mỗi tuần (thứ Hai → Chủ nhật, giờ VN) có một album 8 ô.
 * Ô mở khi số câu đúng TRONG TUẦN đạt mốc của ô đó — không có quay ngẫu nhiên.
 * Luật nằm ở `services/game/album.ts`; số câu đếm ở `store/useAlbumStore.ts`.
 *
 * Tuần đã qua chỉ xem được, không cộng thêm. Trang này không gọi AI và không đưa
 * dữ liệu học vào địa chỉ trang.
 */

const pad2 = (n: number) => String(n).padStart(2, '0');
/** YYYY-MM-DD → DD/MM. */
const dm = (key: string) => `${key.slice(8, 10)}/${key.slice(5, 7)}`;

export default function AlbumScreen() {
  const { L, en } = useL();
  const nowMs = useNow(1000);
  const [boxW, onLayout] = useBoxWidth();
  const counts = useAlbumStore((s) => s.correctByWeek);
  const now = new Date(nowMs);
  const current = weekOf(now);
  const [viewId, setViewId] = useState<string | null>(null);

  const viewing: AlbumWeek = viewId && viewId !== current.id ? weekById(viewId) : current;
  const isCurrent = viewing.id === current.id;
  const album: AlbumDef = albumForWeek(viewing);
  const correct = counts[viewing.id] ?? 0;
  const progress = albumProgress(correct);
  const slots = slotStates(correct);
  const past = albumHistory(counts, now).filter((row) => !row.current);
  const { first, last } = weekDays(viewing);
  const left = splitDuration(remainingMs(viewing, nowMs));
  const cols = boxW >= 640 ? 4 : 2;
  const nextTone = progress.next ? album.stickers[progress.next.index]!.tone : HUB.green;

  return (
    <Screen cat="cheer">
      <View
        onLayout={onLayout}
        style={{ width: '100%', maxWidth: 1280, alignSelf: 'center', paddingBottom: 28, gap: GAP.md }}
      >
        <View style={{ flexDirection: 'row' }}>
          <BackPill label="Band 9 Quest" onPress={() => router.push('/quest' as never)} />
        </View>

        <View>
          <Eyebrow text={L('ALBUM SƯU TẦM THEO TUẦN', 'WEEKLY COLLECTION ALBUM')} />
          <Card style={{ marginTop: 6 }}>
            <Text className="font-heavy" style={{ fontSize: 28, lineHeight: 34, color: HUB.ink }}>
              {en ? album.titleEn : album.title}
            </Text>
            <Text className="font-sans" style={{ marginTop: 4, fontSize: 14, lineHeight: 20, color: HUB.muted }}>
              {L(`Tuần ${dm(first)} – ${dm(last)}`, `Week ${dm(first)} – ${dm(last)}`)}
            </Text>
          </Card>
        </View>

        {!isCurrent ? (
          <Card className="flex-row items-center justify-between" style={{ flexWrap: 'wrap', gap: GAP.sm }}>
            <Text className="font-semi" style={{ fontSize: 14, color: HUB.ink, flexShrink: 1 }}>
              {L('Tuần đã qua: chỉ xem, không cộng thêm.', 'Past week: view only, no new counts.')}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={L('Về tuần này', 'Back to this week')}
              onPress={() => setViewId(null)}
              style={{ borderRadius: 999, borderWidth: 1, borderColor: HUB.line, paddingHorizontal: 12, paddingVertical: 7 }}
            >
              <Text className="font-strong" style={{ fontSize: 13, color: HUB.ink }}>
                {L('Về tuần này', 'This week')}
              </Text>
            </Pressable>
          </Card>
        ) : null}

        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: GAP.sm }}>
            <View>
              <Text className="font-heavy" style={{ fontSize: 40, lineHeight: 44, color: HUB.ink }}>
                {correct}
              </Text>
              <Text className="font-sans" style={{ fontSize: 13, color: HUB.muted }}>
                {isCurrent
                  ? L('câu đúng tuần này', 'correct this week')
                  : L('câu đúng trong tuần đó', 'correct in that week')}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text className="font-strong" style={{ fontSize: 12, letterSpacing: 0.6, color: HUB.muted }}>
                {isCurrent ? L('CÒN LẠI TRONG TUẦN', 'TIME LEFT THIS WEEK') : L('ĐÃ KẾT THÚC', 'ENDED')}
              </Text>
              {isCurrent ? (
                <Text className="font-heavy" style={{ marginTop: 2, fontSize: 18, color: HUB.ink }}>
                  {left.days > 0 ? `${left.days}${en ? 'd' : ' ngày'} ` : ''}
                  {pad2(left.hours)}:{pad2(left.minutes)}:{pad2(left.seconds)}
                </Text>
              ) : null}
            </View>
          </View>

          <View style={{ marginTop: GAP.md }}>
            <Bar value={progress.fraction} color={nextTone} height={10} label={L('Tiến độ tới ô kế tiếp', 'Progress to next slot')} />
            <Text className="font-semi" style={{ marginTop: 8, fontSize: 13.5, color: HUB.ink }}>
              {!progress.next
                ? L('Đã mở đủ 8 ô của album này', 'All 8 slots of this album are open')
                : isCurrent
                  ? L(
                      `Còn ${progress.next.missing} câu nữa để mở ô ${progress.next.index + 1}`,
                      `${progress.next.missing} more correct to open slot ${progress.next.index + 1}`,
                    )
                  : L(
                      `Tuần đó đã mở ${progress.unlocked}/8 ô`,
                      `That week opened ${progress.unlocked}/8 slots`,
                    )}
            </Text>
          </View>
        </Card>

        <Cols cols={cols} gap={GAP.sm}>
          {slots.map((slot) => (
            <SlotTile key={slot.index} slot={slot} sticker={album.stickers[slot.index]!} />
          ))}
        </Cols>

        <Text className="font-sans" style={{ fontSize: 12.5, lineHeight: 18, color: HUB.muted }}>
          {L(
            'Câu đúng ở các màn học (khi game đang bật) được cộng vào tuần này. Câu tự chấm không tính.',
            'Correct answers in lessons (with game on) count toward this week. Self-graded items do not count.',
          )}
        </Text>

        <Card>
          <Text className="font-heavy" style={{ fontSize: 16, color: HUB.ink }}>
            {L('Lịch sử album', 'Album history')}
          </Text>
          {past.length === 0 ? (
            <Text className="font-sans" style={{ marginTop: 8, fontSize: 13.5, color: HUB.muted }}>
              {L('Chưa có tuần nào trước đó.', 'No earlier weeks yet.')}
            </Text>
          ) : (
            <View style={{ marginTop: GAP.sm, gap: GAP.xs }}>
              {past.map((row) => {
                const days = weekDays(row.week);
                const label = en ? row.album.titleEn : row.album.title;
                return (
                  <Pressable
                    key={row.week.id}
                    accessibilityRole="button"
                    accessibilityLabel={L(`Xem ${label}, tuần ${dm(days.first)}`, `View ${label}, week ${dm(days.first)}`)}
                    onPress={() => setViewId(row.week.id)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: GAP.sm,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: HUB.line,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      backgroundColor: HUB.panel,
                    }}
                  >
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text className="font-strong" style={{ fontSize: 14, color: HUB.ink }} numberOfLines={1}>
                        {label}
                      </Text>
                      <Text className="font-sans" style={{ marginTop: 2, fontSize: 12.5, color: HUB.muted }}>
                        {`${dm(days.first)} – ${dm(days.last)} · ${row.unlocked}/8 ${L('ô', 'slots')} · ${row.correct} ${L('câu đúng', 'correct')}`}
                      </Text>
                    </View>
                    <Icon name="chevron-right" size={16} color={HUB.muted} strokeWidth={2.2} />
                  </Pressable>
                );
              })}
            </View>
          )}
        </Card>
      </View>
    </Screen>
  );
}

function SlotTile({ slot, sticker }: { slot: SlotState; sticker: AlbumDef['stickers'][number] }) {
  const { L, en } = useL();
  const ordinal = slot.index + 1;

  if (slot.unlocked) {
    return (
      <Pop from={0.55}>
      <View
        accessibilityLabel={`${en ? sticker.nameEn : sticker.name}, ${en ? sticker.topicEn : sticker.topic}`}
        style={{
          minHeight: 150,
          borderRadius: 18,
          borderWidth: 1.5,
          borderColor: `${sticker.tone}AA`,
          backgroundColor: HUB.panel,
          padding: 14,
          overflow: 'hidden',
        }}
      >
        <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 5, backgroundColor: sticker.tone }} />
        <Aura color={sticker.tone} size={120} strength={0.3} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Text style={{ fontSize: 34, lineHeight: 40 }}>{sticker.glyph}</Text>
          <Text className="font-strong" style={{ fontSize: 12, color: HUB.muted }}>
            {`#${ordinal}`}
          </Text>
        </View>
        <Text className="font-heavy" style={{ marginTop: 10, fontSize: 15, lineHeight: 20, color: HUB.ink }} numberOfLines={2}>
          {en ? sticker.nameEn : sticker.name}
        </Text>
        <Text className="font-semi" style={{ marginTop: 4, fontSize: 12.5, lineHeight: 17, color: HUB.muted }} numberOfLines={2}>
          {en ? sticker.topicEn : sticker.topic}
        </Text>
        <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Icon name="check" size={13} color={sticker.tone} strokeWidth={2.6} />
          <Text className="font-strong" style={{ fontSize: 12, color: sticker.tone }}>
            {L('Đã mở', 'Unlocked')}
          </Text>
        </View>
      </View>
      </Pop>
    );
  }

  return (
    <View
      accessibilityLabel={L(`Ô ${ordinal} đang khoá, còn ${slot.missing} câu`, `Slot ${ordinal} locked, ${slot.missing} more correct`)}
      style={{
        minHeight: 150,
        borderRadius: 18,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: HUB.line,
        backgroundColor: HUB.track,
        padding: 14,
        opacity: 0.55,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Text className="font-strong" style={{ fontSize: 12, color: HUB.muted }}>
          {`#${ordinal}`}
        </Text>
        <Icon name="lock" size={16} color={HUB.muted} strokeWidth={2.2} />
      </View>
      <Text className="font-heavy" style={{ marginTop: 14, fontSize: 26, lineHeight: 30, color: HUB.ink }}>
        {`−${slot.missing}`}
      </Text>
      <Text className="font-semi" style={{ marginTop: 2, fontSize: 12.5, lineHeight: 17, color: HUB.muted }}>
        {L(`Còn thiếu ${slot.missing} câu đúng`, `${slot.missing} more correct to open`)}
      </Text>
      <Text className="font-sans" style={{ marginTop: 6, fontSize: 12, color: HUB.muted }}>
        {L(`Mở ở mốc ${slot.threshold} câu`, `Opens at ${slot.threshold} correct`)}
      </Text>
    </View>
  );
}
