import React, { useState } from 'react';
import { Pressable, Text, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { SealIcon } from '@/components/illust/HeroArt';
import { Icon, type IconName } from '@/components/ui/Icon';
import { KIND_SKILL, type PathExam, type PathLevel, type PathNode, type PathPart, type PathTargetKind } from '@/data/learning-path';
import { useL } from '@/i18n/useL';
import type { NodeStatus } from '@/services/learning-path/progress';

/**
 * Giao diện Lộ trình học — nền giấy sáng, nút bài theo đường so le, trạng thái
 * hoàn thành/học tiếp rõ ràng; giữ phần chọn kỳ thi và kế hoạch gọn, dễ quét.
 */
export const P = {
  navy: '#0F1D33',
  navySoft: '#24344F',
  gold: '#A8843F',
  goldMid: '#B8955A',
  goldDeep: '#8F6E36',
  goldLight: '#E2C88F',
  goldWash: '#FBF3E2',
  paper: '#FFFDF8',
  line: '#E8DCC0',
  muted: '#6B6250',
  faint: '#B7AC95',
  canvas: '#F3EDE1',
};

export const KIND_ICON: Record<PathTargetKind, IconName> = {
  vocab: 'letters',
  'sat-vocab': 'letters',
  read: 'book',
  bilingual: 'languages',
  dictation: 'volume',
  translate: 'refresh',
  write: 'pencil',
  speak: 'mic',
  'math-lesson': 'note',
  'math-set': 'grid',
  'sat-chapter': 'compass',
  'rw-lesson': 'note',
  'rw-set': 'clipboard',
};

/** App đo "xong" thế nào — hiện ngay trong thẻ bài để người học biết. */
export const DONE_RULE: Record<PathTargetKind, { vi: string; en: string }> = {
  vocab: { vi: 'Tự tính xong khi bạn nhớ được 80% số từ của bộ.', en: 'Counted as done once you have learned 80% of the deck.' },
  'sat-vocab': { vi: 'Tự tính xong khi một mức quiz đạt từ 80%.', en: 'Counted as done once you score 80% or more on any quiz level.' },
  read: { vi: 'Tự tính xong khi bạn nộp bài phần câu hỏi của bài đọc này.', en: 'Counted as done once you submit the questions for this passage.' },
  bilingual: { vi: 'App không ghi lại bài song ngữ đã đọc, nên đọc xong bạn tự đánh dấu.', en: 'The app does not record bilingual reads, so mark it yourself when you finish.' },
  dictation: { vi: 'Tự tính xong khi bạn làm hết một lượt bộ chép chính tả này.', en: 'Counted as done once you finish a round of this dictation set.' },
  translate: { vi: 'Tự tính xong khi bạn làm hết một lượt bộ dịch này.', en: 'Counted as done once you finish a round of this translation set.' },
  write: { vi: 'Tự tính xong khi bạn nộp một bài cho đề này.', en: 'Counted as done once you submit an essay for this prompt.' },
  speak: { vi: 'Tự tính xong khi bạn trả lời ít nhất một câu của chủ đề này ở đúng phần thi.', en: 'Counted as done once you answer at least one question on this topic in this part.' },
  'math-lesson': { vi: 'Tự tính xong khi bạn bấm "Đánh dấu đã học xong" ở cuối bài lý thuyết.', en: 'Counted as done once you press "Mark as completed" at the end of the lesson.' },
  'math-set': { vi: 'Tự tính xong khi bạn làm hết một lượt bộ đề.', en: 'Counted as done once you finish a round of the set.' },
  'sat-chapter': { vi: 'Tự tính xong khi bạn đạt từ 80% ở một mức quiz bất kỳ của chương.', en: 'Counted as done once you score 80% or more on any level of the chapter.' },
  'rw-lesson': { vi: 'Tự tính xong khi bạn bấm "Đánh dấu đã học xong" ở cuối bài lý thuyết.', en: 'Counted as done once you press "Mark as completed" at the end of the lesson.' },
  'rw-set': { vi: 'Tự tính xong khi bạn trả lời 80% số câu của bộ.', en: 'Counted as done once you answer 80% of the questions in the set.' },
};

/* ------------------------------------------------------------------ chọn kỳ thi / trình độ */

/** Thanh chọn liền khối vuông vức (giống ô "Mỗi buổi" của phiếu lộ trình). */
export function ExamSwitch({ value, onChange }: { value: PathExam; onChange: (v: PathExam) => void }) {
  const { L } = useL();
  return (
    <View accessibilityRole="tablist" aria-label={L('Kỳ thi', 'Exam')} style={{ flexDirection: 'row', borderRadius: 12, borderWidth: 1, borderColor: P.line, backgroundColor: '#FFFFFF', padding: 3, gap: 3 }}>
      {(['ielts', 'sat'] as const).map((e) => {
        const on = value === e;
        return (
          <Pressable
            key={e}
            accessibilityRole="tab"
            aria-selected={on}
            accessibilityLabel={e === 'ielts' ? 'IELTS' : 'SAT'}
            onPress={() => onChange(e)}
            style={{ flex: 1, alignItems: 'center', borderRadius: 9, paddingVertical: 10, backgroundColor: on ? P.navy : 'transparent' }}
          >
            <Text className="font-heavy" style={{ fontSize: 15, letterSpacing: 0.6, color: on ? P.goldLight : P.navy }}>
              {e === 'ielts' ? 'IELTS' : 'SAT'}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Ba ô trình độ dạng cuống vé nhỏ: số mức to, tên mức, số Part · số bài. */
export function LevelPicker({
  levels,
  value,
  planLevelId,
  onChange,
  compact,
}: {
  levels: readonly PathLevel[];
  value: string;
  planLevelId: string | null;
  onChange: (id: string) => void;
  compact: boolean;
}) {
  const { L, en } = useL();
  return (
    <View accessibilityRole="radiogroup" aria-label={L('Trình độ', 'Level')} style={{ flexDirection: 'row', gap: compact ? 6 : 10 }}>
      {levels.map((l) => {
        const on = l.id === value;
        const count = l.parts.reduce((a, p) => a + p.nodes.length, 0);
        return (
          <Pressable
            key={l.id}
            accessibilityRole="radio"
            aria-checked={on}
            accessibilityLabel={`${l.label} · ${en ? l.title.en : l.title.vi}`}
            onPress={() => onChange(l.id)}
            style={{
              flex: 1,
              minWidth: 0,
              borderRadius: 12,
              borderWidth: on ? 1.5 : 1,
              borderColor: on ? P.navy : P.line,
              backgroundColor: on ? P.navy : '#FFFFFF',
              paddingHorizontal: compact ? 8 : 14,
              paddingVertical: compact ? 10 : 12,
            }}
          >
            <Text className="font-heavy" numberOfLines={1} style={{ fontSize: compact ? 17 : 22, lineHeight: compact ? 22 : 28, color: on ? '#FFFFFF' : P.navy }}>
              {l.label}
            </Text>
            <Text className="font-semi" numberOfLines={compact ? 2 : 1} style={{ marginTop: 2, fontSize: compact ? 11 : 13, lineHeight: compact ? 14 : 17, color: on ? P.goldLight : P.muted }}>
              {en ? l.title.en : l.title.vi}
            </Text>
            {!compact ? (
              <Text className="font-sans" style={{ marginTop: 6, fontSize: 12, color: on ? 'rgba(255,255,255,0.6)' : P.faint }}>
                {L(`${l.parts.length} Part · ${count} bài`, `${l.parts.length} parts · ${count} lessons`)}
              </Text>
            ) : null}
            {planLevelId === l.id ? (
              <View style={{ marginTop: 6, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 5, paddingHorizontal: 5, paddingVertical: 1, backgroundColor: on ? 'rgba(226,200,143,0.16)' : P.goldWash }}>
                <Icon name="target" size={10} color={on ? P.goldLight : P.goldDeep} strokeWidth={2.4} />
                <Text className="font-strong" style={{ fontSize: 12, letterSpacing: 0.4, color: on ? P.goldLight : P.goldDeep }}>
                  {L('Theo lộ trình', 'Your plan')}
                </Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

/** Thanh tiến độ mảnh: nền kem, phần đã xong vàng. */
export function ProgressLine({ done, total, dark }: { done: number; total: number; dark?: boolean }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <View
      accessibilityRole="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={done}
      style={{ height: 6, borderRadius: 3, backgroundColor: dark ? 'rgba(255,255,255,0.12)' : '#EFE6D2', overflow: 'hidden' }}
    >
      <View style={{ width: `${pct}%`, height: 6, borderRadius: 3, backgroundColor: dark ? P.goldLight : P.gold }} />
    </View>
  );
}

/* ------------------------------------------------------------------ trạng thái */

export function useStatusText() {
  const { L } = useL();
  return (node: PathNode, s: NodeStatus | undefined, isNext: boolean): string => {
    if (!s || s.state === 'todo') return isNext ? L('Học tiếp', 'Up next') : L('Chưa học', 'Not started');
    if (s.state === 'done') return s.manual ? L('Đã xong · tự đánh dấu', 'Done · marked by you') : L('Đã xong', 'Done');
    if (s.have !== undefined && s.need !== undefined) {
      if (node.target.kind === 'vocab') return L(`Đang học · nhớ ${s.have}/${s.need} từ`, `In progress · ${s.have}/${s.need} words learned`);
      if (node.target.kind === 'rw-set') return L(`Đang làm · ${s.have}/${s.need} câu`, `In progress · ${s.have}/${s.need} answered`);
    }
    return L('Đang làm', 'In progress');
  };
}

export function primaryLabel(s: NodeStatus | undefined, L: (vi: string, en: string) => string): string {
  if (s?.state === 'done') return L('Ôn lại', 'Review');
  if (s?.state === 'started') return L('Tiếp tục', 'Continue');
  return L('Bắt đầu', 'Start');
}

/* ------------------------------------------------------------------ chi tiết bài */

/**
 * Nội dung chi tiết của một bài: kỹ năng, thời lượng, trạng thái, lời giới
 * thiệu, cách app tính xong, nút mở bài và (chỉ loại không đo được) ô tự đánh
 * dấu. Dùng cả trong thẻ mở rộng (điện thoại) lẫn cột bên (máy tính).
 */
export function NodeDetail({
  node,
  status,
  isNext,
  dark,
  onOpen,
  onToggleManual,
}: {
  node: PathNode;
  status: NodeStatus | undefined;
  isNext: boolean;
  dark?: boolean;
  onOpen: () => void;
  onToggleManual: () => void;
}) {
  const { L, en } = useL();
  const statusText = useStatusText();
  const ink = dark ? '#FFFFFF' : P.navy;
  const sub = dark ? 'rgba(255,255,255,0.72)' : P.muted;
  const rule = DONE_RULE[node.target.kind];
  const manualOn = !!status?.manual;
  const auto = status?.auto ?? true;

  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        <Tag text={en ? KIND_SKILL[node.target.kind].en : KIND_SKILL[node.target.kind].vi} dark={dark} strong />
        <Tag text={L(`~${node.minutes} phút`, `~${node.minutes} min`)} dark={dark} icon="clock" />
        <Tag text={statusText(node, status, isNext)} dark={dark} icon={status?.state === 'done' ? 'check' : undefined} />
      </View>
      <Text className="font-sans" style={{ fontSize: 15, lineHeight: 23, color: ink }}>
        {en ? node.desc.en : node.desc.vi}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
        <Icon name="info" size={14} color={dark ? P.goldLight : P.goldDeep} />
        <Text className="font-sans" style={{ flex: 1, fontSize: 13, lineHeight: 19, color: sub }}>
          {en ? rule.en : rule.vi}
        </Text>
      </View>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`${primaryLabel(status, L)} · ${en ? node.title.en : node.title.vi}`}
        onPress={onOpen}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          borderRadius: 10,
          paddingVertical: 12,
          paddingHorizontal: 16,
          backgroundColor: dark ? P.goldLight : P.navy,
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <Text className="font-heavy" style={{ fontSize: 15, color: dark ? P.navy : P.goldLight }}>
          {primaryLabel(status, L)}
        </Text>
        <Icon name="arrow-right" size={16} color={dark ? P.navy : P.goldLight} strokeWidth={2.4} />
      </Pressable>
      {!auto ? (
        <Pressable
          accessibilityRole="checkbox"
          aria-checked={manualOn}
          onPress={onToggleManual}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 10, borderWidth: 1, borderColor: dark ? 'rgba(226,200,143,0.35)' : P.line, paddingHorizontal: 12, paddingVertical: 10 }}
        >
          <View style={{ width: 20, height: 20, borderRadius: 5, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: manualOn ? P.gold : dark ? 'rgba(255,255,255,0.5)' : '#C9B78F', backgroundColor: manualOn ? P.gold : 'transparent' }}>
            {manualOn ? <Icon name="check" size={13} color="#FFFFFF" strokeWidth={3} /> : null}
          </View>
          <View style={{ flex: 1 }}>
            <Text className="font-strong" style={{ fontSize: 14, color: ink }}>
              {L('Tự đánh dấu đã học xong', 'Mark as done myself')}
            </Text>
            <Text className="font-sans" style={{ fontSize: 12, color: sub }}>
              {L('Chỉ lưu trên máy này.', 'Saved on this device only.')}
            </Text>
          </View>
        </Pressable>
      ) : null}
    </View>
  );
}

function Tag({ text, dark, strong, icon }: { text: string; dark?: boolean; strong?: boolean; icon?: IconName }) {
  const color = dark ? (strong ? P.navy : P.goldLight) : strong ? '#FFFFFF' : P.goldDeep;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 3,
        backgroundColor: strong ? (dark ? P.goldLight : P.navy) : dark ? 'rgba(226,200,143,0.12)' : P.goldWash,
        borderWidth: strong ? 0 : 1,
        borderColor: dark ? 'rgba(226,200,143,0.3)' : P.goldLight,
      }}
    >
      {icon ? <Icon name={icon} size={11} color={color} strokeWidth={2.4} /> : null}
      <Text className="font-strong" style={{ fontSize: 12, color }}>
        {text}
      </Text>
    </View>
  );
}

/* ------------------------------------------------------------------ đường mòn */

const CONNECTOR_H = 34;

/**
 * Một Part: tiêu đề "PART n" + tên chủ đề + tiến độ, rồi các bài so le trái /
 * phải nối nhau bằng đường chấm vàng uốn lượn như một con đường mòn.
 */
export function PartTrail({
  part,
  partNo,
  progress,
  statuses,
  nextId,
  selectedId,
  inlineDetail,
  onSelect,
  renderDetail,
}: {
  part: PathPart;
  partNo: number;
  progress: { done: number; total: number };
  statuses: Record<string, NodeStatus>;
  nextId: string | null;
  selectedId: string | null;
  /** true = điện thoại / máy tính bảng: chạm vào bài thì mở chi tiết ngay trong thẻ. */
  inlineDetail: boolean;
  onSelect: (id: string) => void;
  renderDetail: (node: PathNode, index: number, dark: boolean) => React.ReactNode;
}) {
  const { L, en } = useL();
  const [w, setW] = useState(0);
  const narrow = w > 0 && w < 520;
  const cardW = w === 0 ? 0 : Math.round(narrow ? w * 0.68 : w * 0.46);
  const complete = progress.done === progress.total;

  const centerX = (i: number, expanded: boolean) => (expanded || cardW === 0 || part.nodes.length === 1 ? w / 2 : i % 2 === 0 ? cardW / 2 : w - cardW / 2);

  return (
    <View style={{ marginTop: 30 }}>
      {/* đầu Part: chỉ vàng, PART n, tên chủ đề, tiến độ */}
      <View style={{ borderTopWidth: 1, borderColor: P.line, paddingTop: 16, flexDirection: 'row', alignItems: 'flex-end', gap: 12 }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text className="font-heavy" style={{ fontSize: 12, letterSpacing: 2.4, color: P.gold }}>
            PART {partNo}
          </Text>
          <Text className="font-heavy" style={{ marginTop: 2, fontSize: 22, lineHeight: 28, color: P.navy }}>
            {en ? part.title.en : part.title.vi}
          </Text>
          <Text className="font-sans" numberOfLines={2} style={{ marginTop: 2, fontSize: 14, lineHeight: 20, color: P.muted }}>
            {en ? part.blurb.en : part.blurb.vi}
          </Text>
        </View>
        <View style={{ width: 84, alignItems: 'flex-end', gap: 6 }}>
          <Text className="font-heavy" style={{ fontSize: 18, color: complete ? P.goldDeep : P.navy }}>
            {progress.done}
            <Text className="font-semi" style={{ fontSize: 13, color: P.muted }}>
              /{progress.total}
            </Text>
          </Text>
          <View style={{ width: 84 }}>
            <ProgressLine done={progress.done} total={progress.total} />
          </View>
        </View>
      </View>

      <View style={{ marginTop: 18 }} onLayout={(e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width)}>
        {part.nodes.map((n, i) => {
          const expanded = inlineDetail && selectedId === n.id;
          const prevExpanded = inlineDetail && i > 0 && selectedId === part.nodes[i - 1]!.id;
          return (
            <React.Fragment key={n.id}>
              {i > 0 && w > 0 ? <Connector width={w} from={centerX(i - 1, prevExpanded)} to={centerX(i, expanded)} /> : null}
              <View style={{ width: expanded || cardW === 0 ? '100%' : cardW, alignSelf: expanded ? 'stretch' : i % 2 === 0 ? 'flex-start' : 'flex-end' }}>
                <NodeCard
                  node={n}
                  index={i + 1}
                  status={statuses[n.id]}
                  isNext={nextId === n.id}
                  selected={selectedId === n.id}
                  expanded={expanded}
                  narrow={narrow}
                  onPress={() => onSelect(n.id)}
                >
                  {expanded ? renderDetail(n, i + 1, nextId === n.id) : null}
                </NodeCard>
              </View>
            </React.Fragment>
          );
        })}
      </View>
      {complete ? (
        <Text className="font-strong" style={{ marginTop: 12, alignSelf: 'center', fontSize: 13, letterSpacing: 1, color: P.goldDeep }}>
          {L(`✓ XONG PART ${partNo}`, `✓ PART ${partNo} COMPLETE`)}
        </Text>
      ) : null}
    </View>
  );
}

/** Đoạn nối chấm vàng uốn hình chữ S từ đáy thẻ trên tới đỉnh thẻ dưới. */
function Connector({ width, from, to }: { width: number; from: number; to: number }) {
  const h = CONNECTOR_H;
  const d = `M ${from} 0 C ${from} ${h * 0.55}, ${to} ${h * 0.45}, ${to} ${h}`;
  return (
    <View aria-hidden style={{ height: h }} pointerEvents="none">
      <Svg width={width} height={h}>
        <Path d={d} stroke={P.goldMid} strokeWidth={2.5} strokeDasharray="0.5 7" strokeLinecap="round" fill="none" />
      </Svg>
    </View>
  );
}

/** Nút bài kiểu bản đồ: trạng thái ở huy hiệu, tên bài nằm ngay bên dưới. */
function NodeCard({
  node,
  index,
  status,
  isNext,
  selected,
  expanded,
  narrow,
  onPress,
  children,
}: {
  node: PathNode;
  index: number;
  status: NodeStatus | undefined;
  isNext: boolean;
  selected: boolean;
  expanded: boolean;
  /** Màn hẹp: thu nút tròn lại để giữ đủ khoảng trống hai bên đường học. */
  narrow: boolean;
  onPress: () => void;
  children?: React.ReactNode;
}) {
  const { en } = useL();
  const statusText = useStatusText();
  const done = status?.state === 'done';
  const started = status?.state === 'started';
  const dark = isNext;

  const seal = done ? '#FFFFFF' : dark ? P.navy : started ? P.goldDeep : P.navySoft;
  const badge = done ? '#21A56A' : dark ? P.goldLight : started ? P.goldWash : '#FFFFFF';
  const border = done ? '#16814E' : dark ? P.gold : selected ? P.goldMid : P.line;
  const kicker = `${String(index).padStart(2, '0')} · ${node.minutes}'`;

  return (
    <View style={{ alignItems: 'center', width: '100%' }}>
      <Pressable
        accessibilityRole="button"
        aria-expanded={expanded}
        aria-selected={selected}
        accessibilityLabel={`${en ? node.title.en : node.title.vi} · ${statusText(node, status, isNext)}`}
        onPress={onPress}
        style={{ width: '100%', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4 }}
      >
        <View style={{ width: narrow ? 58 : 66, height: narrow ? 58 : 66, borderRadius: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: badge, borderWidth: dark ? 3 : 2, borderColor: border, boxShadow: dark ? '0 5px 14px rgba(143,110,54,0.22)' : '0 2px 8px rgba(15,29,51,0.09)' } as object}>
          <SealIcon name={done ? 'check' : KIND_ICON[node.target.kind]} color={seal} size={32} />
          {dark ? (
            <View style={{ position: 'absolute', right: -5, bottom: -3, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: P.navy, borderWidth: 2, borderColor: '#FFFFFF' }}>
              <Icon name="play" size={12} color="#FFFFFF" />
            </View>
          ) : null}
        </View>
        <View style={{ alignItems: 'center', width: '100%', marginTop: 4 }}>
          <Text className="font-semi" numberOfLines={1} style={{ fontSize: 11, letterSpacing: 0.7, color: dark ? P.goldDeep : P.muted }}>
            {kicker}
          </Text>
          <Text className="font-heavy" numberOfLines={2} style={{ marginTop: 1, textAlign: 'center', fontSize: 15, lineHeight: 20, color: P.navy }}>
            {en ? node.title.en : node.title.vi}
          </Text>
          {dark || started || done ? <Text className="font-semi" numberOfLines={1} style={{ marginTop: 1, fontSize: 12, color: done ? '#16814E' : dark ? P.goldDeep : P.muted }}>{statusText(node, status, isNext)}</Text> : null}
        </View>
        <View style={{ position: 'absolute', top: 26, right: 7 }}>
          <Icon name={expanded ? 'chevron-down' : 'chevron-right'} size={16} color={dark ? P.goldDeep : P.faint} />
        </View>
      </Pressable>
      {children ? (
        <View style={{ width: '100%', marginTop: 12, borderRadius: 16, borderWidth: 1, borderColor: dark ? P.navy : selected ? P.goldLight : P.line, backgroundColor: dark ? P.navy : P.paper, paddingHorizontal: 14, paddingBottom: 14, paddingTop: 2 }}>
          {children}
        </View>
      ) : null}
    </View>
  );
}
