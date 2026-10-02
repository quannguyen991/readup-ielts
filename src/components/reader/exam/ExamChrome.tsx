import React, { useState } from 'react';
import { PanResponder, Platform, Pressable, ScrollView, Text, View } from 'react-native';

import { Icon, type IconName } from '@/components/ui';
import { highlightColors, type HighlightColorKey } from '@/theme/tokens';
import type { ReaderTool } from '@/components/reader/PassageView';
import { useL } from '@/i18n/useL';
import { EXAM } from './exam-theme';

/**
 * Bộ phận khung phòng thi Reading, kiểu YouPass: thanh trên mảnh, hai tấm chia
 * bằng thanh kéo, dải công cụ dọc, dải số câu ở đáy. Chỉ là phần VẼ — mọi trạng
 * thái (công cụ, đáp án, đồng hồ) vẫn nằm ở `app/read/[id].tsx`.
 */

/* ----------------------------------------------------------------- thanh trên */

export function ExamTopBar({
  timeLabel,
  paused,
  onTogglePause,
  onExit,
  onNotes,
  notesOpen,
  onSettings,
  settingsOpen,
  onTutor,
  narrow,
}: {
  timeLabel: string;
  paused: boolean;
  onTogglePause: () => void;
  onExit: () => void;
  onNotes: () => void;
  notesOpen: boolean;
  onSettings: () => void;
  settingsOpen: boolean;
  onTutor: () => void;
  narrow: boolean;
}) {
  const { L } = useL();
  return (
    <View
      className="flex-row items-center justify-between px-3"
      style={{ height: 52, backgroundColor: EXAM.white, borderBottomWidth: 1, borderBottomColor: EXAM.line }}
    >
      <View style={{ flex: narrow ? 0 : 1, flexDirection: 'row', alignItems: 'center' }}>
        <Pressable
          onPress={onExit}
          accessibilityRole="button"
          accessibilityLabel={L('Thoát', 'Exit')}
          className="items-center justify-center rounded-pill"
          style={{ width: 40, height: 40, borderWidth: 1, borderColor: EXAM.line }}
        >
          <Icon name="close" size={16} color={EXAM.ink} strokeWidth={2.4} />
        </Pressable>
      </View>

      <Pressable
        onPress={onTogglePause}
        accessibilityRole="button"
        accessibilityLabel={paused ? L('Chạy tiếp đồng hồ', 'Resume timer') : L('Tạm dừng đồng hồ', 'Pause timer')}
        className="flex-row items-center rounded-pill"
        style={{
          height: narrow ? 40 : 36,
          paddingHorizontal: narrow ? 10 : 14,
          gap: 7,
          backgroundColor: EXAM.accentSoft,
          borderWidth: 1,
          borderColor: EXAM.accentLine,
          opacity: paused ? 0.6 : 1,
        }}
      >
        <Icon name="clock" size={15} color={EXAM.accentDeep} strokeWidth={2.2} />
        <Text style={{ fontSize: 15, fontWeight: '800', color: EXAM.accentDeep, fontVariant: ['tabular-nums'] }}>{timeLabel}</Text>
      </Pressable>

      <View style={{ flex: narrow ? 0 : 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: narrow ? 4 : 8 }}>
        <TopPill icon="note" label={L('Xem note', 'Notes')} active={notesOpen} onPress={onNotes} narrow={narrow} />
        <TopPill icon="settings" label={L('Cài đặt', 'Settings')} active={settingsOpen} onPress={onSettings} narrow={narrow} />
        <Pressable
          onPress={onTutor}
          accessibilityRole="button"
          accessibilityLabel={L('Mở trợ giảng', 'Open tutor')}
          className="items-center justify-center rounded-pill"
          style={{ width: 40, height: narrow ? 40 : 36, borderWidth: 1, borderColor: EXAM.line }}
        >
          <Icon name="chat" size={16} color={EXAM.ink} strokeWidth={2} />
        </Pressable>
      </View>
    </View>
  );
}

function TopPill({
  icon,
  label,
  active,
  onPress,
  narrow,
}: {
  icon: IconName;
  label: string;
  active: boolean;
  onPress: () => void;
  narrow: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      aria-expanded={active}
      className="flex-row items-center justify-center rounded-pill"
      style={{
        height: narrow ? 40 : 36,
        minWidth: 40,
        paddingHorizontal: narrow ? 0 : 12,
        gap: 6,
        borderWidth: 1,
        borderColor: active ? EXAM.accent : EXAM.line,
        backgroundColor: active ? EXAM.accentSoft : EXAM.white,
      }}
    >
      <Icon name={icon} size={15} color={active ? EXAM.accentDeep : EXAM.ink} strokeWidth={2} />
      {narrow ? null : <Text style={{ fontSize: 13, fontWeight: '700', color: active ? EXAM.accentDeep : EXAM.ink }}>{label}</Text>}
    </Pressable>
  );
}

/* ------------------------------------------------------------ dải công cụ dọc */

const TOOLS: { tool: Exclude<ReaderTool, 'read'> | 'notes'; icon: IconName; vi: string; en: string; key: string }[] = [
  { tool: 'highlight', icon: 'pencil', vi: 'Highlight', en: 'Highlight', key: 'H' },
  { tool: 'notes', icon: 'note', vi: 'Notes', en: 'Notes', key: 'N' },
  { tool: 'vocab', icon: 'search', vi: 'Tra từ vựng', en: 'Look up', key: 'T' },
];

export function ToolRail({
  tool,
  notesOpen,
  onPick,
  onNotes,
  highlightColor,
  onHighlightColor,
  hasHighlights,
  onClearHighlights,
  phraseMode,
  onTogglePhrase,
  row,
}: {
  tool: ReaderTool;
  notesOpen: boolean;
  onPick: (tool: ReaderTool) => void;
  onNotes: () => void;
  highlightColor: HighlightColorKey;
  onHighlightColor: (key: HighlightColorKey) => void;
  hasHighlights: boolean;
  onClearHighlights: () => void;
  phraseMode: boolean;
  onTogglePhrase: () => void;
  /** Màn hẹp: xếp thành một hàng nổi thay vì cột dọc. */
  row: boolean;
}) {
  const { L } = useL();
  const colorKeys = Object.keys(highlightColors) as HighlightColorKey[];

  const cards = TOOLS.map((t) => {
    const active = t.tool === 'notes' ? notesOpen : tool === t.tool;
    const label = L(t.vi, t.en);
    return (
      <Pressable
        key={t.tool}
        onPress={() => (t.tool === 'notes' ? onNotes() : onPick(t.tool))}
        accessibilityRole="button"
        accessibilityLabel={`${label} (${t.key})`}
        aria-pressed={active}
        className="items-center justify-center"
        style={{
          flex: row ? 1 : undefined,
          minHeight: row ? 44 : 74,
          flexDirection: row ? 'row' : 'column',
          gap: row ? 6 : 4,
          paddingHorizontal: 6,
          paddingVertical: row ? 6 : 10,
          borderRadius: 12,
          borderWidth: active ? 1.5 : 1,
          borderColor: active ? EXAM.accent : EXAM.line,
          backgroundColor: active ? EXAM.accentSoft : EXAM.white,
        }}
      >
        <Icon name={t.icon} size={row ? 15 : 18} color={active ? EXAM.accentDeep : EXAM.ink} strokeWidth={2} />
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 12.5, fontWeight: '700', color: active ? EXAM.accentDeep : EXAM.ink, textAlign: 'center' }}>{label}</Text>
          {row ? null : <Text style={{ fontSize: 10.5, color: EXAM.muted }}>{L(`Phím ${t.key}`, `Key ${t.key}`)}</Text>}
        </View>
      </Pressable>
    );
  });

  const extras =
    tool === 'highlight' ? (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: row ? 'flex-start' : 'center', alignItems: 'center' }}>
        {colorKeys.map((key) => (
          <Pressable
            key={key}
            accessibilityRole="button"
            accessibilityLabel={L(`Bút ${highlightColors[key].label}`, `${key} pen`)}
            aria-selected={highlightColor === key}
            onPress={() => onHighlightColor(key)}
            className="items-center justify-center rounded-pill"
            style={{ width: 24, height: 24, borderWidth: 2, borderColor: highlightColor === key ? EXAM.accent : 'transparent' }}
          >
            <View style={{ width: 15, height: 15, borderRadius: 8, backgroundColor: highlightColors[key].dot }} />
          </Pressable>
        ))}
        {hasHighlights ? (
          <Pressable onPress={onClearHighlights} accessibilityRole="button" style={{ paddingVertical: 4, paddingHorizontal: 6 }}>
            <Text style={{ fontSize: 11.5, fontWeight: '700', color: EXAM.muted, textDecorationLine: 'underline' }}>{L('Xoá hết', 'Clear all')}</Text>
          </Pressable>
        ) : null}
      </View>
    ) : tool === 'vocab' ? (
      <Pressable
        onPress={onTogglePhrase}
        accessibilityRole="button"
        aria-pressed={phraseMode}
        style={{
          alignSelf: row ? 'flex-start' : 'stretch',
          alignItems: 'center',
          paddingVertical: 6,
          paddingHorizontal: 10,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: phraseMode ? EXAM.accent : EXAM.line,
          backgroundColor: phraseMode ? EXAM.accentSoft : EXAM.white,
        }}
      >
        <Text style={{ fontSize: 11.5, fontWeight: '700', color: phraseMode ? EXAM.accentDeep : EXAM.ink }}>
          {phraseMode ? L('Đang chọn cụm…', 'Selecting…') : L('Chọn cụm', 'Phrase')}
        </Text>
      </Pressable>
    ) : null;

  if (row) {
    return (
      <View style={{ gap: 8, paddingHorizontal: 12, paddingTop: 10, paddingBottom: 6 }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>{cards}</View>
        {extras}
      </View>
    );
  }
  return (
    <View style={{ width: 96, paddingTop: 16, paddingHorizontal: 8, gap: 8 }}>
      <Text style={{ fontSize: 12, fontWeight: '800', color: EXAM.muted, textAlign: 'center', marginBottom: 2 }}>{L('Công cụ', 'Tools')}</Text>
      {cards}
      {extras}
    </View>
  );
}

/* ------------------------------------------------------------------- thanh kéo */

/**
 * Hai tấm chia bằng thanh kéo: kéo núm giữa để đổi tỉ lệ. Dùng PanResponder nên
 * chạy cả chuột lẫn cảm ứng; tỉ lệ kẹp trong [0.3, 0.7] để không tấm nào biến mất.
 */
/** Ghi bề rộng đo được vào bộ nhớ của thanh kéo (handler, không phải lúc render). */
function measured(live: { width: number }, w: number): void {
  live.width = w;
}

export function SplitPane({ left, right }: { left: React.ReactNode; right: React.ReactNode }) {
  const [ratio, setRatio] = useState(0.5);
  const [width, setWidth] = useState(0);
  const [dragging, setDragging] = useState(false);
  // Tỉ lệ và bề rộng giữ trong ref, chỉ đọc/ghi ở handler: PanResponder tạo một lần.
  const [live] = useState(() => ({ ratio: 0.5, start: 0.5, width: 0 }));

  const [pan] = useState(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        live.start = live.ratio;
        setDragging(true);
      },
      onPanResponderMove: (_e, g) => {
        const w = live.width;
        if (w <= 0) return;
        const next = Math.min(0.7, Math.max(0.3, live.start + g.dx / w));
        live.ratio = next;
        setRatio(next);
      },
      onPanResponderRelease: () => setDragging(false),
      onPanResponderTerminate: () => setDragging(false),
    }),
  );

  return (
    <View style={{ flex: 1, flexDirection: 'row' }} onLayout={(e) => {
        measured(live, e.nativeEvent.layout.width);
        setWidth(e.nativeEvent.layout.width);
      }}>
      <View style={{ width: Math.max(0, width * ratio - 7), minWidth: 0 }}>{left}</View>
      <View
        {...pan.panHandlers}
        accessibilityRole="adjustable"
        accessibilityLabel="Resize"
        style={[
          { width: 14, alignItems: 'center', justifyContent: 'center' },
          Platform.OS === 'web' ? ({ cursor: 'col-resize', touchAction: 'none', userSelect: 'none' } as object) : null,
        ]}
      >
        <View style={{ position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: dragging ? EXAM.accent : EXAM.line }} />
        <View
          style={{
            width: 14,
            height: 40,
            borderRadius: 7,
            backgroundColor: EXAM.white,
            borderWidth: 1,
            borderColor: dragging ? EXAM.accent : EXAM.line,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 3,
            flexDirection: 'row',
          }}
        >
          <View style={{ width: 2, height: 16, borderRadius: 1, backgroundColor: EXAM.muted, opacity: 0.55 }} />
          <View style={{ width: 2, height: 16, borderRadius: 1, backgroundColor: EXAM.muted, opacity: 0.55 }} />
        </View>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>{right}</View>
    </View>
  );
}

/* --------------------------------------------------------------- dải số câu đáy */

export type NavItem = { id: string; answered: boolean; marked: boolean };

export function QuestionNav({
  items,
  current,
  onJump,
  onFinish,
  allAnswered,
  submitting,
  narrow,
  tab,
  onTab,
}: {
  items: NavItem[];
  /** Số câu (từ 1) đang là câu hiện tại. */
  current: number;
  onJump: (number: number) => void;
  onFinish: () => void;
  allAnswered: boolean;
  submitting: boolean;
  narrow: boolean;
  tab: 'passage' | 'questions';
  onTab: (tab: 'passage' | 'questions') => void;
}) {
  const { L } = useL();
  const size = narrow ? 40 : 34;
  const ready = allAnswered && items.length > 0;

  const strip = (
    <View
      style={{
        flex: 1,
        minWidth: 0,
        height: size + 12,
        borderRadius: 999,
        borderWidth: 1.5,
        borderColor: EXAM.accentLine,
        backgroundColor: EXAM.white,
        justifyContent: 'center',
      }}
    >
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center', gap: 6, paddingHorizontal: 8 }}>
        {items.map((it, i) => {
          const n = i + 1;
          const isCurrent = n === current;
          return (
            <Pressable
              key={it.id}
              onPress={() => onJump(n)}
              accessibilityRole="button"
              accessibilityLabel={L(`Tới câu ${n}`, `Go to question ${n}`)}
              className="items-center justify-center rounded-pill"
              style={{
                minWidth: size,
                height: size,
                paddingHorizontal: 6,
                backgroundColor: it.answered ? EXAM.accent : EXAM.accentSoft,
                borderWidth: isCurrent ? 2 : 1,
                borderColor: isCurrent ? EXAM.accentDeep : it.answered ? EXAM.accent : EXAM.accentLine,
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '800', color: it.answered ? '#FFFFFF' : EXAM.accentDeep }}>{n}</Text>
              {it.marked ? (
                <View style={{ position: 'absolute', top: -1, right: -1, width: 9, height: 9, borderRadius: 5, backgroundColor: EXAM.flag, borderWidth: 1.5, borderColor: '#FFFFFF' }} />
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );

  const finish = (
    <Pressable
      onPress={onFinish}
      disabled={submitting || items.length === 0}
      accessibilityRole="button"
      aria-disabled={!ready}
      className="items-center justify-center rounded-pill"
      style={{
        height: narrow ? 44 : 46,
        paddingHorizontal: narrow ? 16 : 22,
        backgroundColor: ready ? EXAM.accent : '#EFEBE2',
        opacity: items.length === 0 ? 0.5 : 1,
      }}
    >
      <Text style={{ fontSize: 14.5, fontWeight: '800', color: ready ? '#FFFFFF' : '#9A9484' }}>
        {submitting ? L('Đang chấm…', 'Grading…') : L('Hoàn thành', 'Finish')}
      </Text>
    </Pressable>
  );

  if (!narrow) {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: EXAM.white, borderTopWidth: 1, borderTopColor: EXAM.line }}>
        {strip}
        {finish}
      </View>
    );
  }
  return (
    <View style={{ gap: 8, paddingHorizontal: 12, paddingTop: 8, paddingBottom: 10, backgroundColor: EXAM.white, borderTopWidth: 1, borderTopColor: EXAM.line }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {strip}
        {finish}
      </View>
      <View style={{ flexDirection: 'row', padding: 3, borderRadius: 999, backgroundColor: '#F3EFE6' }}>
        {(['passage', 'questions'] as const).map((t) => (
          <Pressable
            key={t}
            accessibilityRole="tab"
            aria-selected={tab === t}
            onPress={() => onTab(t)}
            className="flex-1 items-center justify-center rounded-pill"
            style={{ height: 40, backgroundColor: tab === t ? EXAM.accent : 'transparent' }}
          >
            <Text style={{ fontSize: 14, fontWeight: '800', color: tab === t ? '#FFFFFF' : EXAM.ink }}>
              {t === 'passage' ? L('Bài đọc', 'Passage') : L('Câu hỏi', 'Questions')}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
