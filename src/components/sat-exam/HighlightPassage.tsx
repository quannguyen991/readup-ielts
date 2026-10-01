import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, Text, TextInput, View, useWindowDimensions } from 'react-native';

import { PassageText } from '@/components/sat-rw/PassageText';
import { snapToWords } from '@/components/reader/passage-text';
import { Icon } from '@/components/ui/Icon';
import { useL } from '@/i18n/useL';
import { splitPassage } from '@/services/sat-rw/mock/passage';
import { useExamTools } from './exam-context';
import { toBody } from './to-body';
import { EXAM } from './exam-theme';
import { MARK_FILL, addMark, givenRange, segmentsOf, type Mark, type MarkColor } from './highlight-model';
import { markTextStyle } from './mark-style';

/**
 * Đoạn văn R&W trong phòng thi, tô màu và ghi chú được.
 *
 * Trên web: bôi đen một đoạn → bảng nhỏ hiện ngay trên vùng bôi (ba màu, gạch
 * chân, ghi chú). Bấm vào một vệt đã tô → cùng bảng ấy để đổi màu, sửa ghi chú
 * hoặc xoá. Vị trí đổi ra số ký tự trong chuỗi của khối (xem `highlight-model`)
 * bằng một Range từ đầu khối tới điểm bôi — không phụ thuộc vào cách chữ đang
 * bị cắt thành bao nhiêu thẻ <span>.
 *
 * Ngoài khung phòng thi (không có context) thì vẽ như `PassageText` thường.
 */

const COLORS: MarkColor[] = ['yellow', 'blue', 'pink'];
const POP_W = 260;

let markSeq = 0;
const nextMarkId = () => `m${++markSeq}`;

type Pop =
  | { kind: 'new'; block: number; start: number; end: number; x: number; y: number }
  | { kind: 'mark'; id: string; x: number; y: number };

export function HighlightPassage({ passage, underline }: { passage: string; underline?: string }) {
  const tools = useExamTools();
  const blocks = useMemo(() => splitPassage(passage), [passage]);
  const texts = useMemo(() => blocks.map((b) => b.text), [blocks]);
  if (!tools) return <PassageText passage={passage} underline={underline} tone="paper" />;
  return (
    <HighlightHost texts={texts}>
      {({ marks, openMark }) => (
        <View style={{ gap: 14 }}>
          {blocks.map((block, bi) => {
            const segs = segmentsOf(
              block.text,
              marks.filter((m) => m.block === bi),
              givenRange(block.text, underline),
            );
            return (
              <View key={`${block.label ?? 'x'}-${bi}`}>
                {block.label ? (
                  <Text className="mb-1 font-strong text-label uppercase" style={{ color: EXAM.goldDeep }}>
                    {block.label}
                  </Text>
                ) : null}
                <Text
                  className="font-mid text-bodyLg"
                  style={{ color: EXAM.ink, lineHeight: 29 }}
                  {...({ dataSet: { hlblock: String(bi) } } as object)}
                >
                  {segs.map((seg) => {
                    const m = seg.mark;
                    if (!m && !seg.given) return <Text key={seg.start}>{seg.text}</Text>;
                    return (
                      <Text
                        key={seg.start}
                        style={markTextStyle(m, seg.given)}
                        onPress={m ? (e) => openMark(m, e.currentTarget) : undefined}
                        {...(m ? ({ dataSet: { hlmark: m.id } } as object) : {})}
                      >
                        {seg.text}
                      </Text>
                    );
                  })}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </HighlightHost>
  );
}

export type HighlightApi = {
  marks: readonly Mark[];
  /** Mở bảng sửa cho một vệt đã tô (bấm vào vệt). */
  openMark: (m: Mark, target: unknown) => void;
  on: boolean;
};

/**
 * Khung chung cho mọi khối chữ tô được: bắt thao tác bôi đen, đổi vị trí chọn ra
 * số ký tự, mở bảng tô màu / ghi chú, và liệt kê ghi chú bên dưới.
 *
 * `texts` là chuỗi thuần của từng khối (khối 0, 1…) — gốc của mọi vị trí. Nội
 * dung con tự vẽ vệt tô lên đúng chuỗi ấy và gắn `data-hlblock` cho khối; khối
 * có công thức toán thì gắn thêm `data-hloff` (vị trí đầu) lên từng mẩu chữ.
 */
export function HighlightHost({
  texts,
  children,
}: {
  texts: readonly string[];
  children: (api: HighlightApi) => React.ReactNode;
}) {
  const tools = useExamTools();
  if (!tools) return <>{children({ marks: [], openMark: () => {}, on: false })}</>;
  return <HostInner texts={texts}>{children}</HostInner>;
}

function HostInner({ texts, children }: { texts: readonly string[]; children: (api: HighlightApi) => React.ReactNode }) {
  const tools = useExamTools()!;
  const { L } = useL();
  const hostRef = useRef<View>(null);
  const [pop, setPop] = useState<Pop | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const { width: winW } = useWindowDimensions();
  const on = tools.highlightOn;

  const readSelection = useCallback(() => {
    if (typeof window === 'undefined') return;
    const host = hostRef.current as unknown as HTMLElement | null;
    const sel = window.getSelection();
    if (!host || !sel || sel.rangeCount === 0 || sel.isCollapsed) return;
    const range = sel.getRangeAt(0);
    if (!host.contains(range.startContainer)) return;
    const elOf = (n: Node) => (n instanceof Element ? n : n.parentElement);
    const blockEl = elOf(range.startContainer)?.closest('[data-hlblock]') as HTMLElement | null;
    if (!blockEl) return;
    const block = Number(blockEl.dataset.hlblock);
    const text = texts[block] ?? '';
    const leaves = Array.from(blockEl.querySelectorAll<HTMLElement>('[data-hloff]'));

    // Vị trí ký tự của một điểm chọn. Khối chữ thuần: đếm từ đầu khối. Khối có
    // công thức: đếm từ mẩu chữ (`data-hloff`) chứa điểm; điểm rơi ra ngoài mọi
    // mẩu (vạch phân số, dấu căn) thì lấy mẩu gần nhất về phía của nó.
    const offsetOf = (node: Node, offset: number, side: 'start' | 'end') => {
      const count = (from: HTMLElement) => {
        const r = document.createRange();
        r.selectNodeContents(from);
        r.setEnd(node, offset);
        return r.toString().length;
      };
      if (leaves.length === 0) return count(blockEl);
      const leaf = elOf(node)?.closest('[data-hloff]') as HTMLElement | null;
      if (leaf && blockEl.contains(leaf)) return Number(leaf.dataset.hloff) + count(leaf);
      const at = document.createRange();
      at.setStart(node, offset);
      at.collapse(true);
      if (side === 'start') {
        const next = leaves.find((l) => at.comparePoint(l, 0) > 0);
        return next ? Number(next.dataset.hloff) : text.length;
      }
      const before = leaves.filter((l) => at.comparePoint(l, 0) <= 0);
      const prev = before[before.length - 1];
      return prev ? Number(prev.dataset.hloff) + (prev.textContent ?? '').length : 0;
    };

    const start = offsetOf(range.startContainer, range.startOffset, 'start');
    const end = blockEl.contains(range.endContainer) ? offsetOf(range.endContainer, range.endOffset, 'end') : text.length;
    const snapped = snapToWords(text, start, end);
    if (snapped.end <= snapped.start) return;
    const rect = range.getBoundingClientRect();
    setEditing(null);
    setPop({ kind: 'new', block, start: snapped.start, end: snapped.end, x: rect.left + rect.width / 2, y: rect.top });
  }, [texts]);

  // Nghe nhả chuột / nhả tay trên đoạn văn (chỉ web).
  useEffect(() => {
    if (Platform.OS !== 'web' || !on) return;
    const host = hostRef.current as unknown as HTMLElement | null;
    if (!host?.addEventListener) return;
    const onUp = () => setTimeout(readSelection, 0);
    host.addEventListener('mouseup', onUp);
    host.addEventListener('touchend', onUp);
    host.addEventListener('keyup', onUp);
    return () => {
      host.removeEventListener('mouseup', onUp);
      host.removeEventListener('touchend', onUp);
      host.removeEventListener('keyup', onUp);
    };
  }, [on, readSelection]);

  // Bấm ra ngoài bảng / Esc: đóng.
  useEffect(() => {
    if (Platform.OS !== 'web' || !pop) return;
    const onDown = (e: Event) => {
      const t = e.target as Element | null;
      if (t?.closest?.('[data-hlpop]') || t?.closest?.('[data-hlmark]')) return;
      setPop(null);
      setEditing(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPop(null);
        setEditing(null);
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [pop]);

  const clearSelection = () => {
    if (typeof window !== 'undefined') window.getSelection()?.removeAllRanges();
  };

  const create = (color: MarkColor | null, withNote = false) => {
    if (pop?.kind !== 'new') return;
    const id = nextMarkId();
    const mark: Mark = { id, block: pop.block, start: pop.start, end: pop.end, color, underline: color === null, note: '' };
    tools.setMarks((prev) => addMark(prev, mark));
    clearSelection();
    if (withNote) {
      setPop({ kind: 'mark', id, x: pop.x, y: pop.y });
      setDraft('');
      setEditing(id);
    } else setPop(null);
  };

  const update = (id: string, patch: Partial<Mark>) =>
    tools.setMarks((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  const remove = (id: string) => {
    tools.setMarks((prev) => prev.filter((m) => m.id !== id));
    setPop(null);
    setEditing(null);
  };

  const active = pop?.kind === 'mark' ? tools.marks.find((m) => m.id === pop.id) : undefined;
  const notes = tools.marks.filter((m) => m.note.trim() !== '');

  const openMark = (m: Mark, target: unknown) => {
    const el = target as HTMLElement | null;
    const rect = el?.getBoundingClientRect?.();
    setEditing(null);
    setPop({ kind: 'mark', id: m.id, x: rect ? rect.left + rect.width / 2 : winW / 2, y: rect ? rect.top : 120 });
  };

  return (
    <View>
      <View ref={hostRef} {...({ dataSet: { examhl: on ? 'on' : 'off' } } as object)}>
        {children({ marks: tools.marks, openMark, on })}
      </View>

      {notes.length > 0 ? (
        <View className="mt-4 gap-1.5 border-t pt-3" style={{ borderColor: EXAM.line }}>
          {notes.map((m) => (
            <Pressable
              key={m.id}
              accessibilityRole="button"
              onPress={(e) => openMark(m, e.currentTarget)}
              className="flex-row items-start gap-2"
              {...({ dataSet: { hlmark: m.id } } as object)}
            >
              <Icon name="note" size={14} color={EXAM.goldDeep} />
              <Text className="min-w-0 flex-1 font-sans text-label" style={{ color: EXAM.body }} numberOfLines={2}>
                <Text className="font-semi">“{(texts[m.block] ?? '').slice(m.start, m.end).slice(0, 40)}”</Text> {m.note}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {pop
        ? toBody(
        <View
          {...({ dataSet: { hlpop: '1' } } as object)}
          className="rounded-[10px] p-2"
          style={{
            position: 'fixed',
            zIndex: 80,
            width: POP_W,
            left: Math.max(8, Math.min(winW - POP_W - 8, pop.x - POP_W / 2)),
            top: Math.max(8, pop.y - (editing ? 150 : 56)),
            backgroundColor: EXAM.navy,
            boxShadow: '0 10px 28px rgba(15,29,51,0.28)',
          }}
        >
          {editing && active ? (
            <View>
              <TextInput
                autoFocus
                multiline
                value={draft}
                onChangeText={setDraft}
                placeholder={L('Ghi chú…', 'Note…')}
                placeholderTextColor="#9AA6BA"
                className="rounded-md px-2.5 py-2 font-sans text-label"
                style={{ backgroundColor: '#FFFFFF', color: EXAM.ink, minHeight: 64 }}
              />
              <View className="mt-2 flex-row justify-end gap-2">
                <PopBtn label={L('Huỷ', 'Cancel')} onPress={() => setEditing(null)} />
                <PopBtn
                  label={L('Lưu', 'Save')}
                  strong
                  onPress={() => {
                    update(active.id, { note: draft.trim() });
                    setEditing(null);
                    setPop(null);
                  }}
                />
              </View>
            </View>
          ) : (
            <View className="flex-row items-center gap-1.5">
              {COLORS.map((c) => (
                <Pressable
                  key={c}
                  accessibilityRole="button"
                  accessibilityLabel={L(`Tô màu ${c}`, `Highlight ${c}`)}
                  onPress={() => (pop.kind === 'new' ? create(c) : active && update(active.id, { color: c }))}
                  className="h-8 w-8 items-center justify-center rounded-pill"
                  style={{
                    backgroundColor: MARK_FILL[c],
                    borderWidth: 2,
                    borderColor: active?.color === c ? EXAM.goldSoft : 'transparent',
                  }}
                />
              ))}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={L('Gạch chân', 'Underline')}
                onPress={() =>
                  pop.kind === 'new' ? create(null) : active && update(active.id, { underline: !active.underline })
                }
                className="h-8 w-8 items-center justify-center rounded-md"
                style={{ backgroundColor: active?.underline ? 'rgba(255,255,255,0.18)' : 'transparent' }}
              >
                <Text className="font-strong text-body underline" style={{ color: '#FFFFFF' }}>
                  U
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={L('Ghi chú', 'Note')}
                onPress={() => {
                  if (pop.kind === 'new') create('yellow', true);
                  else if (active) {
                    setDraft(active.note);
                    setEditing(active.id);
                  }
                }}
                className="h-8 w-8 items-center justify-center rounded-md"
              >
                <Icon name="note" size={18} color="#FFFFFF" />
              </Pressable>
              {active ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={L('Xoá vệt tô', 'Remove highlight')}
                  onPress={() => remove(active.id)}
                  className="ml-auto h-8 w-8 items-center justify-center rounded-md"
                >
                  <Icon name="close" size={18} color="#FFFFFF" />
                </Pressable>
              ) : null}
            </View>
          )}
        </View>,
          )
        : null}
    </View>
  );
}

function PopBtn({ label, onPress, strong }: { label: string; onPress: () => void; strong?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="rounded-md px-3 py-1.5"
      style={{ backgroundColor: strong ? EXAM.goldSoft : 'transparent' }}
    >
      <Text className="font-strong text-label" style={{ color: strong ? EXAM.navy : '#FFFFFF' }}>
        {label}
      </Text>
    </Pressable>
  );
}
