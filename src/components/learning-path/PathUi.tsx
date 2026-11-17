import { themedHex } from '@/theme/palette-state';
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { NeonIcon, NeonWindow } from '@/components/neon/Neon';
import type { NeonIconId } from '@/components/neon/neon-art';
import { Icon, type IconName } from '@/components/ui/Icon';
import { KIND_SKILL, type PathExam, type PathLevel, type PathNode, type PathPart, type PathTargetKind } from '@/data/learning-path';
import { TILE_TONES } from '@/components/vocab/UnitTile';
import { useL } from '@/i18n/useL';
import type { NodeStatus } from '@/services/learning-path/progress';

/**
 * Giao diện Lộ trình học — nền giấy sáng, nút bài theo đường so le, trạng thái
 * hoàn thành/học tiếp rõ ràng; giữ phần chọn kỳ thi và kế hoạch gọn, dễ quét.
 */
export const P = {
  navy: '#2B2350',
  navySoft: '#4A4470',
  gold: '#6A4BD9',
  goldMid: themedHex('#8B6CF0'),
  goldDeep: '#6A4BD9',
  goldLight: '#D9CCFF',
  goldWash: '#F3F0FB',
  paper: '#F3F0FB',
  line: '#E6E1F3',
  muted: '#6B6590',
  faint: '#A59CC4',
  canvas: '#F3F0FB',
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
            style={{ flex: 1, alignItems: 'center', borderRadius: 9, paddingVertical: 10, backgroundColor: on ? P.gold : 'transparent' }}
          >
            <Text className="font-heavy" style={{ fontSize: 15, letterSpacing: 0.6, color: on ? '#FFFFFF' : P.navy }}>
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
              borderColor: on ? P.gold : P.line,
              backgroundColor: on ? P.gold : '#FFFFFF',
              paddingHorizontal: compact ? 8 : 14,
              paddingVertical: compact ? 10 : 12,
            }}
          >
            <Text className="font-heavy" numberOfLines={1} style={{ fontSize: compact ? 17 : 22, lineHeight: compact ? 22 : 28, color: on ? '#FFFFFF' : P.navy }}>
              {l.label}
            </Text>
            <Text className="font-semi" numberOfLines={compact ? 2 : 1} style={{ marginTop: 2, fontSize: compact ? 11 : 13, lineHeight: compact ? 14 : 17, color: on ? '#FFFFFF' : P.muted }}>
              {en ? l.title.en : l.title.vi}
            </Text>
            {!compact ? (
              <Text className="font-sans" style={{ marginTop: 6, fontSize: 12, color: on ? 'rgba(255,255,255,0.6)' : P.faint }}>
                {L(`${l.parts.length} Part · ${count} bài`, `${l.parts.length} parts · ${count} lessons`)}
              </Text>
            ) : null}
            {planLevelId === l.id ? (
                <View style={{ marginTop: 6, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 5, paddingHorizontal: 5, paddingVertical: 1, backgroundColor: on ? 'rgba(255,255,255,0.18)' : P.goldWash }}>
                <Icon name="target" size={10} color={on ? '#FFFFFF' : P.goldDeep} strokeWidth={2.4} />
                <Text className="font-strong" style={{ fontSize: 13, letterSpacing: 0.4, color: on ? '#FFFFFF' : P.goldDeep }}>
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
      style={{ height: 6, borderRadius: 3, backgroundColor: dark ? 'rgba(255,255,255,0.12)' : '#F3F0FB', overflow: 'hidden' }}
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
  const manualOn = !!status?.manual;
  const auto = status?.auto ?? true;

  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        <Tag text={en ? KIND_SKILL[node.target.kind].en : KIND_SKILL[node.target.kind].vi} dark={dark} strong />
        <Tag text={L(`~${node.minutes} phút`, `~${node.minutes} min`)} dark={dark} icon="clock" />
        <Tag text={statusText(node, status, isNext)} dark={dark} icon={status?.state === 'done' ? 'check' : undefined} />
      </View>
      <Text className="font-sans" numberOfLines={2} style={{ fontSize: 14, lineHeight: 21, color: ink }}>
        {en ? node.desc.en : node.desc.vi}
      </Text>
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
          backgroundColor: dark ? P.goldLight : P.gold,
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <Text className="font-heavy" style={{ fontSize: 15, color: dark ? P.navy : '#FFFFFF' }}>
          {primaryLabel(status, L)}
        </Text>
        <Icon name="arrow-right" size={16} color={dark ? P.navy : '#FFFFFF'} strokeWidth={2.4} />
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


/**
 * Một Part: tiêu đề "PART n" + tên chủ đề + tiến độ, rồi các bài so le trái /
 * phải nối nhau bằng đường chấm vàng uốn lượn như một con đường mòn.
 */
const PART_ICON: NeonIconId[] = ['planet', 'rocket', 'moon', 'gem', 'coin', 'bolt', 'cloud', 'gift'];

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
  const statusText = useStatusText();
  const complete = progress.done === progress.total;

  return (
    <NeonWindow title={`PART ${partNo}`} badge={`${progress.done}/${progress.total}`} icon={PART_ICON[(partNo - 1) % PART_ICON.length]} padded={false} style={{ marginTop: 24 }}>
      <View style={{ padding: 20, flexDirection: 'row', alignItems: 'center', gap: 14, borderBottomWidth: 2, borderColor: P.line }}>
        <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: P.goldWash, alignItems: 'center', justifyContent: 'center' }}>
          <Text className="font-heavy" style={{ fontSize: 16, color: P.goldDeep }}>{String(partNo).padStart(2, '0')}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text className="font-heavy" style={{ fontSize: 19, lineHeight: 25, color: P.navy }}>{en ? part.title.en : part.title.vi}</Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 6, width: 70 }}>
          <Text className="font-heavy" style={{ fontSize: 14, color: complete ? '#16814E' : P.navy }}>{progress.done}/{progress.total}</Text>
          <View style={{ width: 70 }}><ProgressLine done={progress.done} total={progress.total} /></View>
        </View>
      </View>
      <View style={{ padding: 10, gap: 4 }}>
        {part.nodes.map((node, i) => {
          const selected = selectedId === node.id;
          const expanded = inlineDetail && selected;
          const next = nextId === node.id;
          const status = statuses[node.id];
          const done = status?.state === 'done';
          return (
            <View key={node.id}>
              <Pressable accessibilityRole="button" aria-expanded={expanded} aria-selected={selected} onPress={() => onSelect(node.id)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 13, backgroundColor: selected ? P.goldWash : '#FFFFFF', borderWidth: 1, borderColor: selected ? P.goldMid : 'transparent' }}>
                <View style={{ width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: done ? '#E5F6ED' : next ? P.gold : P.goldWash }}>
                  {done ? <NeonIcon name="check" height={20} /> : <Text className="font-heavy" style={{ fontSize: 12, color: next ? '#FFFFFF' : P.goldDeep }}>{String(i + 1).padStart(2, '0')}</Text>}
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text className="font-heavy" style={{ fontSize: 14, lineHeight: 20, color: P.navy }}>{en ? node.title.en : node.title.vi}</Text>
                  <Text className="font-sans" style={{ marginTop: 2, fontSize: 12, color: P.muted }}>{en ? KIND_SKILL[node.target.kind].en : KIND_SKILL[node.target.kind].vi} · {node.minutes} {L('phút', 'min')}{next || done || status?.state === 'started' ? ` · ${statusText(node, status, next)}` : ''}</Text>
                </View>
                <Icon name={expanded ? 'chevron-down' : 'chevron-right'} size={17} color={P.goldDeep} />
              </Pressable>
              {expanded ? <View style={{ marginHorizontal: 12, marginBottom: 8, paddingHorizontal: 14, paddingBottom: 14, borderRadius: 14, backgroundColor: P.goldWash }}>{renderDetail(node, i + 1, false)}</View> : null}
            </View>
          );
        })}
      </View>
    </NeonWindow>
  );
}

/* ------------------------------------------------------------------ ô thư mục màu */

/** Mỗi kỹ năng một màu cố định, để nhìn vào là biết đang ở dạng bài nào. */
const KIND_TONE: Record<PathTargetKind, number> = {
  vocab: 0,
  'sat-vocab': 0,
  read: 1,
  bilingual: 2,
  dictation: 7,
  translate: 4,
  write: 3,
  speak: 6,
  'math-lesson': 5,
  'math-set': 1,
  'sat-chapter': 4,
  'rw-lesson': 2,
  'rw-set': 3,
};

/** Thanh chọn Part: một hàng nút tròn có tiến độ, cuộn ngang trên máy nhỏ. */
export function PartTabs({
  parts,
  value,
  progress,
  onChange,
}: {
  parts: readonly PathPart[];
  value: string;
  progress: Record<string, { done: number; total: number }>;
  onChange: (id: string) => void;
}) {
  const { en } = useL();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} accessibilityRole="tablist" contentContainerStyle={{ gap: 8, paddingVertical: 4, paddingRight: 12 }}>
      {parts.map((p, i) => {
        const on = p.id === value;
        const pp = progress[p.id] ?? { done: 0, total: 0 };
        const complete = pp.total > 0 && pp.done === pp.total;
        return (
          <Pressable
            key={p.id}
            accessibilityRole="tab"
            aria-selected={on}
            accessibilityLabel={`Part ${i + 1}: ${en ? p.title.en : p.title.vi}`}
            onPress={() => onChange(p.id)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8, height: 44, paddingHorizontal: 16, borderRadius: 999, backgroundColor: on ? P.gold : '#FFFFFF', borderWidth: 1, borderColor: on ? P.gold : P.line }}
          >
            <Text className="font-heavy" style={{ fontSize: 15, color: on ? '#FFFFFF' : P.navy }}>{`Part ${i + 1}`}</Text>
            <View style={{ borderRadius: 999, paddingHorizontal: 8, paddingVertical: 1, backgroundColor: on ? 'rgba(255,255,255,0.24)' : complete ? '#E5F6ED' : P.goldWash }}>
              <Text className="font-strong" style={{ fontSize: 13, color: on ? '#FFFFFF' : complete ? '#16814E' : P.goldDeep }}>{pp.done}/{pp.total}</Text>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/**
 * Một Part dạng lưới ô màu: tai thư mục ghi kỹ năng, số phút thật to, tên bài và trạng thái.
 * Bài xong ngả sang xanh lá, bài học tiếp có viền vàng; chạm vào để xem chi tiết.
 */
export function PartTiles({
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
  inlineDetail: boolean;
  onSelect: (id: string) => void;
  renderDetail: (node: PathNode, index: number, dark: boolean) => React.ReactNode;
}) {
  const { L, en } = useL();
  const statusText = useStatusText();
  const expandedNode = inlineDetail ? part.nodes.find((n) => n.id === selectedId) : undefined;
  return (
    <View style={{ marginTop: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: P.gold, alignItems: 'center', justifyContent: 'center' }}>
          <Text className="font-heavy" style={{ fontSize: 18, color: '#FFFFFF' }}>{String(partNo).padStart(2, '0')}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text className="font-heavy" style={{ fontSize: 22, lineHeight: 28, color: P.navy }}>{en ? part.title.en : part.title.vi}</Text>
          <Text className="font-sans" style={{ fontSize: 14, color: P.muted }}>{progress.done}/{progress.total} {L('bài đã xong', 'lessons done')}</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 6 }}>
        {part.nodes.map((node, i) => {
          const [from, to] = TILE_TONES[KIND_TONE[node.target.kind] ?? 0] ?? TILE_TONES[0]!;
          const status = statuses[node.id];
          const done = status?.state === 'done';
          const next = nextId === node.id;
          const selected = selectedId === node.id;
          const c1 = done ? '#27A872' : from;
          const c2 = done ? '#157A4F' : to;
          return (
            <Pressable
              key={node.id}
              accessibilityRole="button"
              aria-expanded={inlineDetail ? selected : undefined}
              aria-selected={selected}
              onPress={() => onSelect(node.id)}
              style={({ hovered }: { hovered?: boolean }) =>
                ({
                  flexGrow: 1,
                  flexBasis: 220,
                  minHeight: 156,
                  marginTop: 12,
                  padding: 14,
                  borderRadius: 22,
                  borderTopLeftRadius: 8,
                  backgroundColor: c1,
                  backgroundImage: `linear-gradient(145deg, ${c1}, ${c2})`,
                  boxShadow: selected
                    ? `0 0 0 3px #FFFFFF, 0 0 0 6px ${P.gold}, 0 12px 26px ${c2}55`
                    : next
                      ? `0 0 0 3px #FDE68A, 0 8px 20px ${c2}44`
                      : hovered
                        ? `0 12px 26px ${c2}55`
                        : `0 6px 16px ${c2}33`,
                  transform: [{ translateY: hovered ? -3 : 0 }],
                  transition: 'transform 180ms ease, box-shadow 180ms ease',
                }) as never
              }
            >
              <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: -11, width: 64, height: 14, borderTopLeftRadius: 8, borderTopRightRadius: 12, backgroundColor: c2 }} />
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <View style={{ flexShrink: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, backgroundColor: 'rgba(255,255,255,0.22)' }}>
                  <Text numberOfLines={1} style={{ fontSize: 12, fontFamily: 'Inter_700Bold', letterSpacing: 0.6, color: '#FFFFFF' }}>{(en ? KIND_SKILL[node.target.kind].en : KIND_SKILL[node.target.kind].vi).toUpperCase()}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3 }}>
                  <Text style={{ fontSize: 32, lineHeight: 34, fontFamily: 'Inter_700Bold', color: '#FFFFFF' }}>{node.minutes}</Text>
                  <Text style={{ fontSize: 12, fontFamily: 'Inter_700Bold', color: 'rgba(255,255,255,0.85)' }}>{L('PHÚT', 'MIN')}</Text>
                </View>
              </View>
              <Text numberOfLines={3} style={{ marginTop: 10, fontSize: 17, lineHeight: 22, fontFamily: 'Inter_700Bold', color: '#FFFFFF' }}>{en ? node.title.en : node.title.vi}</Text>
              <View style={{ flex: 1 }} />
              <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.25)' }}>
                  {done ? <Icon name="check" size={16} color="#FFFFFF" strokeWidth={3} /> : <Text style={{ fontSize: 13, fontFamily: 'Inter_700Bold', color: '#FFFFFF' }}>{String(i + 1).padStart(2, '0')}</Text>}
                </View>
                <Text numberOfLines={1} style={{ flex: 1, fontSize: 14, fontFamily: 'Inter_700Bold', color: '#FFFFFF' }}>{statusText(node, status, next)}</Text>
                <Icon name="chevron-right" size={16} color="#FFFFFF" strokeWidth={2.4} />
              </View>
              <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, borderRadius: 22, borderTopLeftRadius: 8, overflow: 'hidden' }}>
                <View style={{ position: 'absolute', right: -24, bottom: -24, width: 96, height: 96, borderRadius: 48, backgroundColor: 'rgba(255,255,255,0.12)' }} />
              </View>
            </Pressable>
          );
        })}
      </View>
      {expandedNode ? (
        <View style={{ marginTop: 14, padding: 16, borderRadius: 18, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: P.line }}>
          {renderDetail(expandedNode, part.nodes.indexOf(expandedNode) + 1, false)}
        </View>
      ) : null}
    </View>
  );
}
