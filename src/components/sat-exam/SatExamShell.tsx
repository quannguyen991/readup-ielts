import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { type GestureResponderEvent, PanResponder, Platform, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { usePathname } from 'expo-router';

import { Icon, type IconName } from '@/components/ui/Icon';
import { useL } from '@/i18n/useL';
import { isExamRoute } from '@/navigation/focus-routes';
import { useDisplayName } from '@/store/useAuthStore';
import { ExamToolsContext, type ExamTools } from './exam-context';
import { EXAM, EXAM_WIDE } from './exam-theme';
import { DifficultyTag } from '@/components/ui/DifficultyTag';
import type { Difficulty } from '@/lib/difficulty';
import Calculator from './Calculator';
import ReferenceSheet from './ReferenceSheet';
import { FloatingPanel } from './FloatingPanel';
import { toBody } from './to-body';
import type { Mark } from './highlight-model';


/**
 * Khung phòng thi SAT kiểu đề số: thanh trên (tên phần · đồng hồ · công cụ),
 * dải chàm tên bộ đề, thân (chia đôi bài đọc / câu hỏi với R&W), thanh dưới
 * (tên người học · bảng câu hỏi · Quay lại / Kiểm tra / Tiếp).
 *
 * KHUNG CHỈ LO TRÌNH BÀY VÀ CÔNG CỤ. Chấm điểm, ghi tiến độ, đồng hồ đếm lùi đều
 * ở màn chạy bài như cũ; khung nhận chỉ số câu, câu nào đã trả lời, và các nút
 * bấm. Công cụ (đánh dấu xem lại, gạch phương án, vệt tô, máy tính, bảng công
 * thức) là trạng thái riêng của khung, giữ theo mã câu trong phiên.
 */

export type ExamTimer = { kind: 'up' } | { kind: 'down'; remainingMs: number };

export type SatExamShellProps = {
  section: 'rw' | 'math';
  /** Góc trái thanh trên, ví dụ "Reading and Writing". */
  title: string;
  /** Dải chàm dưới thanh trên: tên bộ đề / module. */
  band: string;
  /** Chữ nhỏ ở mép phải dải chàm (ví dụ "Đúng 3"). */
  bandRight?: string;
  /** Nội dung nút ⓘ — luật của bài, hướng dẫn module. */
  info?: string | null;
  timer: ExamTimer;
  /** Mã từng câu, theo thứ tự. */
  questionKeys: string[];
  index: number;
  onJump: (index: number) => void;
  isAnswered: (index: number) => boolean;
  /** Cột trái (bài đọc). Không có thì một cột. */
  passage?: React.ReactNode;
  /** Câu hỏi, phương án, lời giải. */
  children: React.ReactNode;
  /** Dải nhỏ trên đầu cột câu hỏi (thanh trận đấu của game khi học). */
  topSlot?: React.ReactNode;
  onBack: () => void;
  onNext: () => void;
  nextLabel?: string;
  /** Nút "Kiểm tra" giữa Quay lại và Tiếp — chỉ bộ luyện có lời giải ngay. */
  check?: { label: string; onPress: () => void; disabled?: boolean } | null;
  /** Có thì câu cuối bấm Tiếp sẽ mở bảng câu hỏi kèm nút nộp. */
  onSubmit?: () => void;
  submitLabel?: string;
  onExit: () => void;
  /** Hỏi lại trước khi thoát (bài có giờ, chưa lưu). */
  confirmExit?: boolean;
  /** Phím A–D chọn phương án. */
  onChoose?: (index: number) => void;
  choiceCount?: number;
  /** Câu điền số không có phương án để gạch: ẩn nút ABC. Mặc định có. */
  eliminable?: boolean;
  /** Nhãn Dễ / Vừa / Khó cạnh "Đánh dấu xem lại". Bài thi có giờ thì không truyền. */
  difficulty?: Difficulty;
};

export function SatExamShell(props: SatExamShellProps) {
  const {
    section,
    title,
    band,
    bandRight,
    info,
    timer,
    questionKeys,
    index,
    onJump,
    isAnswered,
    passage,
    children,
    topSlot,
    onBack,
    onNext,
    nextLabel,
    check,
    onSubmit,
    submitLabel,
    onExit,
    confirmExit,
    eliminable = true,
    difficulty,
  } = props;
  const { L } = useL();
  const name = useDisplayName();
  const { width } = useWindowDimensions();
  const wide = width >= EXAM_WIDE;
  const total = questionKeys.length;
  const key = questionKeys[index] ?? String(index);
  const last = index >= total - 1;
  // Ngoài màn thi, bong bóng trợ lý AI ghim ở góc phải dưới: chừa chỗ để nó không đè nút Tiếp.
  const bubbleGap = !isExamRoute(usePathname());

  // ---- công cụ, giữ theo mã câu trong phiên
  const [marked, setMarked] = useState<Set<string>>(() => new Set());
  const [struckBy, setStruckBy] = useState<Record<string, number[]>>({});
  const [marksBy, setMarksBy] = useState<Record<string, Mark[]>>({});
  const [eliminate, setEliminate] = useState(false);
  // R&W: bôi đen là tô sẵn. Math: bật bằng nút (mặc định giữ bôi đen để tra từ như cũ).
  const [highlightOn, setHighlightOn] = useState(section === 'rw');
  const [toolsMenu, setToolsMenu] = useState(false);
  const [menuTop, setMenuTop] = useState(110);
  const [timerHidden, setTimerHidden] = useState(false);
  const [calcOpen, setCalcOpen] = useState(false);
  const [refOpen, setRefOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
  const [ratio, setRatio] = useState(0.5);

  // ---- đồng hồ đếm xuôi cho bộ luyện
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (timer.kind !== 'up') return;
    const started = Date.now();
    const id = setInterval(() => setElapsed(Date.now() - started), 1000);
    return () => clearInterval(id);
  }, [timer.kind]);
  const clockMs = timer.kind === 'up' ? elapsed : timer.remainingMs;
  const lowOnTime = timer.kind === 'down' && timer.remainingMs <= 5 * 60_000;

  const tools = useMemo<ExamTools>(
    () => ({
      questionKey: key,
      eliminate,
      struck: struckBy[key] ?? [],
      toggleStrike: (i) =>
        setStruckBy((prev) => {
          const cur = prev[key] ?? [];
          return { ...prev, [key]: cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i] };
        }),
      highlightOn,
      marks: marksBy[key] ?? [],
      setMarks: (update) => setMarksBy((prev) => ({ ...prev, [key]: update(prev[key] ?? []) })),
    }),
    [key, eliminate, struckBy, highlightOn, marksBy],
  );

  const isMarked = marked.has(key);
  const toggleMark = () =>
    setMarked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const next = useCallback(() => {
    if (last && onSubmit) setNavOpen(true);
    else onNext();
  }, [last, onSubmit, onNext]);

  const exit = () => (confirmExit ? setExitOpen(true) : onExit());

  // ---- bàn phím: ←/→, A–D, Esc (không bắt khi đang gõ)
  const latest = useRef({ props, next, navOpen, infoOpen, calcOpen, refOpen, exitOpen });
  useEffect(() => {
    latest.current = { props, next, navOpen, infoOpen, calcOpen, refOpen, exitOpen };
  });
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest?.('input, textarea, [contenteditable="true"]')) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const cur = latest.current;
      if (e.key === 'Escape') {
        setNavOpen(false);
        setInfoOpen(false);
        setExitOpen(false);
        setToolsMenu(false);
        if (!cur.navOpen && !cur.infoOpen && !cur.exitOpen) {
          setCalcOpen(false);
          setRefOpen(false);
        }
        return;
      }
      if (cur.exitOpen) return;
      if (e.key === 'ArrowLeft' && cur.props.index > 0) {
        e.preventDefault();
        cur.props.onBack();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        cur.next();
      } else if (/^[a-dA-D]$/.test(e.key) && cur.props.onChoose) {
        const i = e.key.toLowerCase().charCodeAt(0) - 97;
        if (i < (cur.props.choiceCount ?? 4)) cur.props.onChoose(i);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // ---- vạch chia kéo được (biến đóng trong closure, không dùng ref: tạo một lần)
  const [divider] = useState(() => {
    let width = 1;
    let start = 0.5;
    let cur = 0.5;
    return {
      setWidth: (w: number) => {
        width = Math.max(1, w);
      },
      pan: PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          start = cur;
        },
        onPanResponderMove: (_, g) => {
          cur = Math.max(0.28, Math.min(0.72, start + g.dx / width));
          setRatio(cur);
        },
      }),
    };
  });

  // Bốn công cụ, cùng thứ tự ở mọi màn thi: Tô & ghi chú · Máy tính · Công thức · Lưu & thoát.
  const TOOLS: { id: string; label: string; icon?: IconName; glyph?: React.ReactNode; active?: boolean; run: () => void }[] = [
    { id: 'hl', label: L('Tô & ghi chú', 'Highlight & Note'), icon: 'pencil', active: highlightOn, run: () => setHighlightOn((v) => !v) },
    { id: 'calc', label: L('Máy tính', 'Calculator'), glyph: <CalcGlyph />, active: calcOpen, run: () => setCalcOpen((v) => !v) },
    { id: 'ref', label: L('Công thức', 'Reference'), icon: 'book', active: refOpen, run: () => setRefOpen((v) => !v) },
    { id: 'exit', label: L('Lưu & thoát', 'Save & Exit'), glyph: <ExitGlyph />, run: exit },
  ];
  // Màn quá hẹp để xếp đủ bốn nút cùng đồng hồ: gom vào một menu "⋯" có nhãn.
  const tinyBar = width < 360;

  const header = (
    <QuestionHeader
      number={index + 1}
      difficulty={difficulty}
      marked={isMarked}
      onMark={toggleMark}
      eliminate={eliminate}
      onEliminate={eliminable ? () => setEliminate((v) => !v) : undefined}
    />
  );

  const questionPane = (
    <View style={{ paddingHorizontal: wide ? 28 : 16, paddingTop: 16, paddingBottom: 28 }}>
      {topSlot ? <View className="mb-3">{topSlot}</View> : null}
      {header}
      <View className="mt-4">{children}</View>
    </View>
  );

  let body: React.ReactNode;
  if (passage && wide) {
    body = (
      <View
        className="min-h-0 flex-1 flex-row"
        onLayout={(e) => divider.setWidth(e.nativeEvent.layout.width)}
      >
        <ScrollView key={`p-${key}`} style={{ flex: ratio }} contentContainerStyle={{ padding: 28 }}>
          {passage}
        </ScrollView>
        <View
          {...divider.pan.panHandlers}
          accessibilityRole="adjustable"
          accessibilityLabel={L('Kéo để đổi bề rộng hai cột', 'Drag to resize panes')}
          className="items-center justify-center"
          style={{ width: 14, cursor: 'col-resize', userSelect: 'none' } as object}
        >
          <View style={{ position: 'absolute', top: 0, bottom: 0, width: 2, backgroundColor: EXAM.line }} />
          <View
            className="flex-row items-center justify-center rounded-md"
            style={{ width: 22, height: 34, backgroundColor: EXAM.navy }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '700' }}>‹ ›</Text>
          </View>
        </View>
        <ScrollView key={`q-${key}`} style={{ flex: 1 - ratio }}>
          {questionPane}
        </ScrollView>
      </View>
    );
  } else {
    body = (
      <ScrollView key={`s-${key}`} className="min-h-0 flex-1">
        <View className="w-full self-center" style={{ maxWidth: passage ? undefined : 820 }}>
          {passage ? (
            <View className="border-b-2" style={{ padding: 16, borderColor: EXAM.line }}>
              {passage}
            </View>
          ) : null}
          {questionPane}
        </View>
      </ScrollView>
    );
  }

  const answeredCount = questionKeys.reduce((n, _, i) => n + (isAnswered(i) ? 1 : 0), 0);

  return (
    <ExamToolsContext.Provider value={tools}>
      <View className="min-h-0 flex-1" style={{ backgroundColor: EXAM.page }}>
        {/* ---------------- thanh trên */}
        <View
          className="flex-row items-center gap-2 border-b px-3 lg:px-5"
          style={{ backgroundColor: EXAM.bar, borderColor: EXAM.barLine, minHeight: wide ? 64 : 52 }}
        >
          <View className="min-w-0 flex-1 flex-row items-center gap-1.5">
            <Text className="min-w-0 shrink font-strong" style={{ fontSize: wide ? 17 : 15, color: EXAM.ink }} numberOfLines={1}>
              {title}
            </Text>
            {info ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={L('Luật của bài này', 'About this set')}
                aria-expanded={infoOpen}
                onPress={() => setInfoOpen((v) => !v)}
                className="h-7 w-7 items-center justify-center rounded-pill"
              >
                <Icon name="info" size={18} color={EXAM.navySoft} strokeWidth={2} />
              </Pressable>
            ) : null}
          </View>

          <View className="items-center">
            {timerHidden ? (
              <Icon name="clock" size={20} color={EXAM.ink} />
            ) : (
              <Text
                className="font-heavy"
                style={{ fontSize: wide ? 22 : 18, color: lowOnTime ? EXAM.danger : EXAM.ink, fontVariant: ['tabular-nums'] }}
                aria-live="off"
              >
                {formatClock(clockMs)}
              </Text>
            )}
            <Pressable
              accessibilityRole="button"
              onPress={() => setTimerHidden((v) => !v)}
              className="mt-0.5 rounded-pill border px-2.5"
              style={{ borderColor: EXAM.optionLine, paddingVertical: 1 }}
            >
              <Text className="font-semi" style={{ fontSize: 11, color: EXAM.body }}>
                {timerHidden ? L('Hiện', 'Show') : L('Ẩn', 'Hide')}
              </Text>
            </Pressable>
          </View>

          <View className="min-w-0 flex-1 flex-row items-center justify-end gap-0.5 lg:gap-1.5" style={{ flexShrink: 0 }}>
            {tinyBar ? (
              <ToolButton
                label={L('Công cụ', 'Tools')}
                icon="more"
                active={toolsMenu}
                compact
                onPress={(e) => {
                  // Bảng nổi nằm ở <body>: đặt ngay dưới nút bấm.
                  const rect = (e?.currentTarget as unknown as HTMLElement | undefined)?.getBoundingClientRect?.();
                  if (rect) setMenuTop(rect.bottom + 4);
                  setToolsMenu((v) => !v);
                }}
              />
            ) : (
              TOOLS.map((t) => (
                <ToolButton
                  key={t.id}
                  label={t.label}
                  icon={t.icon}
                  glyph={t.glyph}
                  active={t.active}
                  compact={!wide}
                  onPress={t.run}
                />
              ))
            )}
          </View>
        </View>

        {/* ---------------- dải chàm */}
        <View className="flex-row items-center gap-3 px-3 py-1.5 lg:px-5" style={{ backgroundColor: EXAM.navy }}>
          <Text className="min-w-0 flex-1 font-semi" style={{ fontSize: 12.5, color: '#E8ECF3', letterSpacing: 0.3 }} numberOfLines={1}>
            {band}
          </Text>
          {bandRight ? (
            <Text className="font-strong" style={{ fontSize: 12.5, color: EXAM.goldSoft }}>
              {bandRight}
            </Text>
          ) : null}
        </View>

        {/* ---------------- thân */}
        {body}

        {/* ---------------- thanh dưới */}
        <View
          className="flex-row items-center gap-2 border-t px-3 lg:px-5"
          style={{
            backgroundColor: EXAM.bar,
            borderColor: EXAM.barLine,
            minHeight: wide ? 64 : 58,
            borderStyle: 'dashed',
            paddingRight: bubbleGap ? 76 : undefined,
          }}
        >
          {/* Màn hẹp bỏ tên người học: chỗ ấy dành cho ba nút. */}
          {wide ? (
            <View className="min-w-0 flex-1">
              <Text className="font-strong text-body" style={{ color: EXAM.ink }} numberOfLines={1}>
                {name}
              </Text>
            </View>
          ) : null}
          <Pressable
            accessibilityRole="button"
            aria-expanded={navOpen}
            accessibilityLabel={L(`Câu ${index + 1} trên ${total}, mở bảng câu hỏi`, `Question ${index + 1} of ${total}, open navigator`)}
            onPress={() => setNavOpen((v) => !v)}
            className="flex-row items-center gap-1.5 rounded-md py-2"
            style={{ backgroundColor: EXAM.navy, paddingHorizontal: tinyBar ? 9 : 14 }}
          >
            <Text className="font-strong" style={{ color: '#FFFFFF', fontSize: wide ? 14 : 13 }}>
              {wide ? L(`Câu ${index + 1} / ${total}`, `Question ${index + 1} of ${total}`) : `${index + 1} / ${total}`}
            </Text>
            <Icon name={navOpen ? 'chevron-down' : 'arrow-up'} size={14} color="#FFFFFF" strokeWidth={2.2} />
          </Pressable>
          <View className="min-w-0 flex-1 flex-row items-center justify-end gap-1.5 lg:gap-2" style={{ flexShrink: 0 }}>
            <BarButton label={L('Quay lại', 'Back')} compact={!wide} icon="chevron-left" onPress={onBack} disabled={index === 0} />
            {check ? <BarButton label={check.label} variant="gold" compact={!wide} onPress={check.onPress} disabled={check.disabled} /> : null}
            <BarButton
              label={last && onSubmit ? L('Xem lại', 'Review') : (nextLabel ?? L('Tiếp', 'Next'))}
              variant="primary"
              compact={!wide}
              iconRight="chevron-right"
              onPress={next}
            />
          </View>
        </View>

        {/* ---------------- lớp nổi */}
        {infoOpen && info ? (
          <Overlay onClose={() => setInfoOpen(false)}>
            <View
              className="rounded-xl border p-4"
              style={{
                position: 'absolute',
                top: wide ? 70 : 104,
                // Lớp nổi nằm ở <body>: chừa cột điều hướng 76px của AppShell (từ lg = 1024px).
                left: width >= 1024 ? 88 : 12,
                maxWidth: Math.min(440, width - 24),
                backgroundColor: '#FFFFFF',
                borderColor: EXAM.barLine,
                boxShadow: '0 12px 32px rgba(15,29,51,0.18)',
              }}
            >
              <Text className="font-strong text-body" style={{ color: EXAM.ink }}>
                {L('Luật của bài này', 'About this set')}
              </Text>
              <Text className="mt-1.5 font-sans text-body" style={{ color: EXAM.body, lineHeight: 23 }}>
                {info}
              </Text>
            </View>
          </Overlay>
        ) : null}

        {toolsMenu && tinyBar ? (
          <Overlay onClose={() => setToolsMenu(false)}>
            <View
              className="rounded-xl border py-1.5"
              style={{
                position: 'absolute',
                top: menuTop,
                right: 8,
                minWidth: 200,
                backgroundColor: '#FFFFFF',
                borderColor: EXAM.barLine,
                boxShadow: '0 12px 32px rgba(15,29,51,0.18)',
              }}
            >
              {TOOLS.map((t) => (
                <Pressable
                  key={t.id}
                  accessibilityRole="button"
                  onPress={() => {
                    setToolsMenu(false);
                    t.run();
                  }}
                  className="flex-row items-center gap-3 px-4 py-2.5"
                  style={{ backgroundColor: t.active ? '#F0E9DA' : 'transparent' }}
                >
                  {t.glyph ?? <Icon name={t.icon ?? 'more'} size={18} color={EXAM.ink} strokeWidth={1.9} />}
                  <Text className="font-semi text-body" style={{ color: EXAM.ink }}>
                    {t.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Overlay>
        ) : null}

        {navOpen ? (
          <Overlay onClose={() => setNavOpen(false)}>
            <Navigator
              wide={wide}
              width={width}
              title={band}
              keys={questionKeys}
              index={index}
              marked={marked}
              isAnswered={isAnswered}
              answeredCount={answeredCount}
              onJump={(i) => {
                setNavOpen(false);
                if (i !== index) onJump(i);
              }}
              onClose={() => setNavOpen(false)}
              onSubmit={
                onSubmit
                  ? () => {
                      setNavOpen(false);
                      onSubmit();
                    }
                  : undefined
              }
              submitLabel={submitLabel}
            />
          </Overlay>
        ) : null}

        {exitOpen ? (
          <Overlay onClose={() => setExitOpen(false)} dim>
            <View className="flex-1 items-center justify-center px-4" pointerEvents="box-none">
              <View className="w-full rounded-xl p-5" style={{ maxWidth: 380, backgroundColor: '#FFFFFF' }}>
                <Text className="font-strong text-cardTitle" style={{ color: EXAM.ink }}>
                  {L('Thoát bài?', 'Leave the test?')}
                </Text>
                <Text className="mt-1 font-sans text-body" style={{ color: EXAM.body }}>
                  {L('Bài đang làm sẽ không được lưu.', 'Your progress won’t be saved.')}
                </Text>
                <View className="mt-4 flex-row justify-end gap-2">
                  <BarButton label={L('Ở lại', 'Stay')} onPress={() => setExitOpen(false)} />
                  <BarButton label={L('Thoát', 'Exit')} variant="primary" onPress={onExit} />
                </View>
              </View>
            </View>
          </Overlay>
        ) : null}

        {calcOpen ? (
          <FloatingPanel
            title={L('Máy tính', 'Calculator')}
            onClose={() => setCalcOpen(false)}
            initial={{ x: Math.max(8, width - 420), y: 120, w: 360, h: 500 }}
            minW={300}
            minH={420}
          >
            <Calculator />
          </FloatingPanel>
        ) : null}
        {refOpen ? (
          <FloatingPanel
            title={L('Bảng công thức', 'Reference sheet')}
            onClose={() => setRefOpen(false)}
            initial={{ x: 96, y: 120, w: 420, h: 560 }}
          >
            <ReferenceSheet />
          </FloatingPanel>
        ) : null}
      </View>
    </ExamToolsContext.Provider>
  );
}

/* ================================================================ phần nhỏ */

function Overlay({ children, onClose, dim }: { children: React.ReactNode; onClose: () => void; dim?: boolean }) {
  return toBody(
    <View style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 60 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Đóng"
        onPress={onClose}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: dim ? 'rgba(15,29,51,0.35)' : 'transparent', cursor: 'default' } as object}
      />
      {children}
    </View>,
  );
}

function QuestionHeader({
  number,
  difficulty,
  marked,
  onMark,
  eliminate,
  onEliminate,
}: {
  number: number;
  difficulty?: Difficulty;
  marked: boolean;
  onMark: () => void;
  eliminate: boolean;
  onEliminate?: () => void;
}) {
  const { L } = useL();
  return (
    <View className="flex-row items-center gap-3 pb-1.5" style={{ borderBottomWidth: 2, borderStyle: 'dashed', borderColor: EXAM.optionLine }}>
      <View className="h-8 min-w-8 items-center justify-center rounded px-2" style={{ backgroundColor: EXAM.ink }}>
        <Text className="font-strong text-body" style={{ color: '#FFFFFF' }}>
          {number}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        aria-pressed={marked}
        onPress={onMark}
        className="min-w-0 flex-1 flex-row items-center gap-1.5 self-stretch"
      >
        <BookmarkGlyph filled={marked} />
        <Text className="font-semi text-label" style={{ color: EXAM.ink }} numberOfLines={1}>
          {marked ? L('Đã đánh dấu', 'Marked for review') : L('Đánh dấu xem lại', 'Mark for review')}
        </Text>
      </Pressable>
      {difficulty ? <DifficultyTag level={difficulty} /> : null}
      {onEliminate ? (
        <Pressable
          accessibilityRole="button"
          aria-pressed={eliminate}
          accessibilityLabel={L('Loại trừ phương án', 'Answer eliminator')}
          onPress={onEliminate}
          className="items-center justify-center rounded px-1.5 py-1"
          style={{ borderWidth: 1.2, borderColor: EXAM.ink, backgroundColor: eliminate ? EXAM.navy : '#FFFFFF' }}
        >
          <Text className="font-strong" style={{ fontSize: 12, color: eliminate ? '#FFFFFF' : EXAM.ink, textDecorationLine: 'line-through' }}>
            ABC
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function BookmarkGlyph({ filled, size = 18 }: { filled: boolean; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M6 3h12v18l-6-4.5L6 21z"
        stroke={filled ? EXAM.goldDeep : EXAM.ink}
        strokeWidth={1.8}
        strokeLinejoin="round"
        fill={filled ? EXAM.gold : 'none'}
      />
    </Svg>
  );
}

function CalcGlyph() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Rect x={5} y={2.5} width={14} height={19} rx={2} stroke={EXAM.ink} strokeWidth={1.7} fill="none" />
      <Rect x={8} y={5.5} width={8} height={3.5} rx={0.6} stroke={EXAM.ink} strokeWidth={1.4} fill="none" />
      <Path d="M8.5 13h.01M12 13h.01M15.5 13h.01M8.5 17h.01M12 17h.01M15.5 17h.01" stroke={EXAM.ink} strokeWidth={2.2} strokeLinecap="round" />
    </Svg>
  );
}

function ExitGlyph() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Path d="M10 4H5.5A1.5 1.5 0 0 0 4 5.5v13A1.5 1.5 0 0 0 5.5 20H10" stroke={EXAM.ink} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d="M9 12h11M16.5 8.5 20 12l-3.5 3.5" stroke={EXAM.ink} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

function ToolButton({
  label,
  icon,
  glyph,
  active,
  compact,
  onPress,
}: {
  label: string;
  icon?: IconName;
  glyph?: React.ReactNode;
  active?: boolean;
  compact?: boolean;
  onPress: (e?: GestureResponderEvent) => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      aria-pressed={active}
      onPress={onPress}
      className="items-center justify-center rounded-md px-2 py-1"
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={{
        backgroundColor: active ? '#E6DCC8' : hovered ? '#EBE3D4' : 'transparent',
        minWidth: compact ? 36 : 64,
      }}
    >
      {glyph ?? <Icon name={icon ?? 'more'} size={18} color={EXAM.ink} strokeWidth={1.9} />}
      {compact ? null : (
        <Text className="mt-0.5 font-semi" style={{ fontSize: 11.5, color: EXAM.ink }} numberOfLines={1}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

function BarButton({
  label,
  onPress,
  disabled,
  variant = 'outline',
  icon,
  iconRight,
  compact,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'outline' | 'primary' | 'gold';
  icon?: IconName;
  iconRight?: IconName;
  compact?: boolean;
}) {
  const bg = variant === 'primary' ? EXAM.navy : variant === 'gold' ? EXAM.goldSoft : '#FFFFFF';
  const fg = variant === 'primary' ? '#FFFFFF' : EXAM.navy;
  // Màn hẹp: Quay lại chỉ còn mũi tên; Tiếp vẫn giữ chữ.
  const iconOnly = compact && variant === 'outline' && !!icon;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      aria-disabled={disabled}
      disabled={disabled}
      onPress={onPress}
      className="flex-row items-center gap-1 rounded-pill"
      style={{
        backgroundColor: bg,
        borderWidth: variant === 'outline' ? 1.5 : 0,
        borderColor: EXAM.navy,
        paddingHorizontal: iconOnly ? 9 : compact ? 12 : 18,
        paddingVertical: 8,
        opacity: disabled ? 0.4 : 1,
      }}
    >
      {icon && iconOnly ? <Icon name={icon} size={16} color={fg} strokeWidth={2.2} /> : null}
      {iconOnly ? null : (
        <Text className="font-strong" style={{ fontSize: 14, color: fg }} numberOfLines={1}>
          {label}
        </Text>
      )}
      {iconRight && !compact ? <Icon name={iconRight} size={15} color={fg} strokeWidth={2.2} /> : null}
    </Pressable>
  );
}

function Navigator({
  wide,
  width,
  title,
  keys,
  index,
  marked,
  isAnswered,
  answeredCount,
  onJump,
  onClose,
  onSubmit,
  submitLabel,
}: {
  wide: boolean;
  width: number;
  title: string;
  keys: string[];
  index: number;
  marked: Set<string>;
  isAnswered: (i: number) => boolean;
  answeredCount: number;
  onJump: (i: number) => void;
  onClose: () => void;
  onSubmit?: () => void;
  submitLabel?: string;
}) {
  const { L } = useL();
  const left = keys.length - answeredCount;
  const frame = wide
    ? (() => {
        // Lớp nổi nằm ở <body>: canh giữa vùng nội dung, bỏ cột điều hướng 76px (từ 1024px).
        const side = width >= 1024 ? 76 : 0;
        const w = Math.min(600, width - side - 24);
        return { left: side + Math.max(12, (width - side - w) / 2), width: w, bottom: 76, borderRadius: 14 };
      })()
    : { left: 0, right: 0, bottom: 0, borderTopLeftRadius: 16, borderTopRightRadius: 16 };
  return (
    <View
      accessibilityRole="none"
      aria-label={L('Bảng câu hỏi', 'Question navigator')}
      className="p-4"
      style={{
        position: 'absolute',
        ...frame,
        maxHeight: '80%',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: EXAM.barLine,
        boxShadow: '0 16px 40px rgba(15,29,51,0.22)',
      }}
    >
      <View className="flex-row items-center gap-2 border-b pb-2.5" style={{ borderColor: EXAM.line }}>
        <Text className="min-w-0 flex-1 font-strong text-body" style={{ color: EXAM.ink }} numberOfLines={1}>
          {title}
        </Text>
        <Pressable accessibilityRole="button" accessibilityLabel={L('Đóng', 'Close')} onPress={onClose} className="h-7 w-7 items-center justify-center">
          <Icon name="close" size={18} color={EXAM.ink} strokeWidth={2} />
        </Pressable>
      </View>

      <View className="mt-2.5 flex-row flex-wrap items-center justify-center gap-x-4 gap-y-1">
        <Legend glyph={<Icon name="arrow-down" size={13} color={EXAM.goldDeep} strokeWidth={2.4} />} text={L('Câu đang làm', 'Current')} />
        <Legend glyph={<View style={{ width: 13, height: 13, borderWidth: 1.2, borderStyle: 'dashed', borderColor: EXAM.navySoft }} />} text={L('Chưa làm', 'Unanswered')} />
        <Legend glyph={<BookmarkGlyph filled size={14} />} text={L('Đánh dấu', 'For review')} />
      </View>

      <ScrollView className="mt-3" style={{ flexGrow: 0 }}>
        <View className="flex-row flex-wrap justify-center gap-2.5 pt-2">
          {keys.map((k, i) => {
            const done = isAnswered(i);
            const current = i === index;
            const flag = marked.has(k);
            return (
              <Pressable
                key={k}
                accessibilityRole="button"
                accessibilityLabel={L(
                  `Câu ${i + 1}${done ? ', đã trả lời' : ', chưa làm'}${flag ? ', đã đánh dấu' : ''}`,
                  `Question ${i + 1}${done ? ', answered' : ', unanswered'}${flag ? ', marked' : ''}`,
                )}
                onPress={() => onJump(i)}
                className="h-10 w-10 items-center justify-center"
                style={{
                  backgroundColor: done ? EXAM.navy : '#FFFFFF',
                  borderWidth: current ? 2 : 1.2,
                  borderStyle: done || current ? 'solid' : 'dashed',
                  borderColor: current ? EXAM.goldDeep : done ? EXAM.navy : EXAM.navySoft,
                }}
              >
                {current ? (
                  <View style={{ position: 'absolute', top: -15 }} pointerEvents="none">
                    <Icon name="arrow-down" size={13} color={EXAM.goldDeep} strokeWidth={2.4} />
                  </View>
                ) : null}
                <Text className="font-strong text-body" style={{ color: done ? '#FFFFFF' : EXAM.ink, textDecorationLine: current ? 'underline' : 'none' }}>
                  {i + 1}
                </Text>
                {flag ? (
                  <View style={{ position: 'absolute', top: -6, right: -6 }} pointerEvents="none">
                    <BookmarkGlyph filled size={15} />
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {onSubmit ? (
        <View className="mt-3 flex-row flex-wrap items-center justify-end gap-3 border-t pt-3" style={{ borderColor: EXAM.line }}>
          <Text className="min-w-0 flex-1 font-sans text-label" style={{ color: left > 0 ? EXAM.danger : EXAM.muted }}>
            {left > 0 ? L(`Còn ${left} câu chưa làm`, `${left} unanswered`) : L('Đã làm hết', 'All answered')}
          </Text>
          <BarButton label={submitLabel ?? L('Nộp bài', 'Submit')} variant="primary" onPress={onSubmit} />
        </View>
      ) : null}
    </View>
  );
}

function Legend({ glyph, text }: { glyph: React.ReactNode; text: string }) {
  return (
    <View className="flex-row items-center gap-1.5">
      {glyph}
      <Text className="font-sans text-label" style={{ color: EXAM.body }}>
        {text}
      </Text>
    </View>
  );
}

function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
}
