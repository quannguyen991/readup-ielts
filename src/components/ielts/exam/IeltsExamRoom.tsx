import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, Text, TextInput, View, useWindowDimensions } from 'react-native';

import { Icon } from '@/components/ui/Icon';
import { isDrillCorrect } from '@/data/drill-sets';
import { parseScript, playScript } from '@/services/listening/script-player';

import { allItems, type ExamGroup, type ExamItem, type ExamPart, type ExamSkill } from './exam-model';

/**
 * PHÒNG THI IELTS (Reading / Listening), kiểu YouPass: nền kem, nút tròn xanh, thanh trên chỉ có thoát / đồng hồ / ghi chú / cài đặt,
 * cột công cụ (Highlight, Notes, Tra từ), bài đọc bên trái, câu hỏi bên phải, thanh số câu và nút Hoàn thành ở dưới.
 * Nộp bài xong vẫn ở màn này ở chế độ XEM LẠI: số câu đỏ/xanh, đáp án đúng sai, bằng chứng tô sáng trong bài và lời giải 3 bước.
 */

const CREAM = '#FDF6EC';
const GREEN = '#16A34A';
const GREEN_DARK = '#15803D';
const GREEN_SOFT = '#D9F2DF';
const RED = '#DC2626';
const RED_SOFT = '#FDE2E2';
const INK = '#1F2430';
const MUTED = '#6B7280';
const LINE = '#E7DDCB';
const SERIF = Platform.OS === 'web' ? 'Georgia, "Times New Roman", serif' : undefined;
const SIZES = [16, 18, 20] as const;
const NARROW_BELOW = 900;

export type ExamAnswers = Record<number, string>;
export type ExamSubmit = { answers: ExamAnswers; seconds: number };

const letter = (i: number) => String.fromCharCode(65 + i);
const clock = (s: number) => `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
const isLetterOnly = (o: string) => /^[A-H](\.\s|$)/.test(o);

export function isItemCorrect(it: ExamItem, given: string | undefined): boolean {
  if (!given || !given.trim()) return false;
  return it.kind === 'radio' || it.kind === 'select' ? given === it.answer : isDrillCorrect(it.answer, given);
}

/* ------------------------------------------------------------------ nhỏ */

type CircleState = 'idle' | 'answered' | 'right' | 'wrong' | 'active';

function Circle({ n, state, size = 34 }: { n: number | string; state: CircleState; size?: number }) {
  const bg = state === 'wrong' ? RED : state === 'right' || state === 'active' ? GREEN : GREEN_SOFT;
  const fg = state === 'idle' || state === 'answered' ? GREEN_DARK : '#FFFFFF';
  return (
    <View style={{ minWidth: size, height: size, paddingHorizontal: 6, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', ...(state === 'answered' ? { borderWidth: 2, borderColor: GREEN } : null) }}>
      <Text style={{ fontSize: size * 0.42, fontWeight: '800', color: fg }}>{n}</Text>
    </View>
  );
}

function Pill({ label, icon, onPress, active }: { label: string; icon?: 'settings' | 'pencil' | 'check'; onPress: () => void; active?: boolean }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={{ height: 42, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 21, backgroundColor: active ? GREEN_SOFT : '#FFFFFF', borderWidth: 1, borderColor: active ? GREEN : LINE }}>
      {icon ? <Icon name={icon} size={16} color={INK} /> : null}
      <Text style={{ fontSize: 15, fontWeight: '700', color: INK }}>{label}</Text>
    </Pressable>
  );
}

function ToolButton({ label, hint, active, onPress, icon }: { label: string; hint: string; active?: boolean; onPress: () => void; icon: string }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: !!active }} onPress={onPress} style={{ width: 84, paddingVertical: 10, alignItems: 'center', gap: 4, borderRadius: 10, borderWidth: 2, borderColor: GREEN, backgroundColor: active ? GREEN_SOFT : '#FFFFFF' }}>
      <Text style={{ fontSize: 20 }}>{icon}</Text>
      <Text style={{ fontSize: 13, fontWeight: '700', color: INK, textAlign: 'center' }}>{label}</Text>
      <Text style={{ fontSize: 12, color: MUTED, textAlign: 'center' }}>{hint}</Text>
    </Pressable>
  );
}

function SelectBox({ value, options, onPick, disabled, state }: { value?: string; options: string[]; onPick: (v: string) => void; disabled?: boolean; state: 'idle' | 'right' | 'wrong' }) {
  const [open, setOpen] = useState(false);
  const border = state === 'right' ? GREEN : state === 'wrong' ? RED : '#C9BFA9';
  return (
    <>
      <Pressable accessibilityRole="button" disabled={disabled} onPress={() => setOpen(true)} style={{ minHeight: 44, maxWidth: 520, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, borderWidth: 2, borderColor: border, borderRadius: 10, backgroundColor: '#FFFFFF' }}>
        <Text style={{ flexShrink: 1, fontSize: 16, fontWeight: value ? '700' : '500', color: value ? INK : '#9CA3AF' }} numberOfLines={2}>{value ?? 'Chọn đáp án…'}</Text>
        <Text style={{ fontSize: 12, color: MUTED }}>▾</Text>
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable nativeID="ielts-exam-modal" style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: 20 }} onPress={() => setOpen(false)}>
          <View style={{ width: '100%', maxWidth: 560, maxHeight: '75%', backgroundColor: '#FFFFFF', borderRadius: 14, overflow: 'hidden' }}>
            <ScrollView>
              {options.map((o, i) => (
                <Pressable key={o} onPress={() => { onPick(o); setOpen(false); }} style={{ paddingVertical: 14, paddingHorizontal: 18, borderBottomWidth: 1, borderBottomColor: '#F1EBDD', backgroundColor: value === o ? GREEN_SOFT : '#FFFFFF' }}>
                  <Text style={{ fontSize: 16, color: INK, fontWeight: value === o ? '800' : '500' }}>{isLetterOnly(o) ? o : `${letter(i)}.  ${o}`}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

function RadioDot({ picked, state }: { picked: boolean; state: 'idle' | 'right' | 'wrong' }) {
  const c = state === 'right' ? GREEN : state === 'wrong' ? RED : picked ? GREEN : '#9CA3AF';
  return (
    <View style={{ width: 30, height: 30, borderRadius: 15, borderWidth: 2.5, borderColor: c, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' }}>
      {picked || state === 'right' ? <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: c }} /> : null}
    </View>
  );
}

/* ----------------------------------------------------- giải thích 3 bước */

function ExplainPanel({ item, given, fontSize }: { item: ExamItem; given: string | undefined; fontSize: number }) {
  const ok = isItemCorrect(item, given);
  const t = { fontSize: fontSize - 1, lineHeight: Math.round((fontSize - 1) * 1.55), color: INK } as const;
  const head = { fontSize, fontWeight: '800' as const, color: INK, textDecorationLine: 'underline' as const };
  const ex = item.ex;
  return (
    <View style={{ marginTop: 10, padding: 16, gap: 8, borderRadius: 12, backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: ok ? '#86EFAC' : '#FCA5A5' }}>
      <Text style={{ fontSize: fontSize + 2, fontWeight: '900', color: INK }}>Câu {item.n} - Giải thích đáp án</Text>
      <Text style={t}>
        Đáp án đúng: <Text style={{ fontWeight: '800', color: GREEN_DARK }}>{(item.answer.split('|')[0] ?? '').trim()}</Text>
        {'   ·   '}Bạn chọn: <Text style={{ fontWeight: '800', color: ok ? GREEN_DARK : RED }}>{given?.trim() ? given : '(bỏ trống)'}</Text>
      </Text>
      {ex ? (
        <>
          <Text style={head}>Bước 1: Hiểu câu hỏi</Text>
          <Text style={t}>{ex.u}</Text>
          <Text style={head}>Bước 2: Tìm keywords được paraphrase</Text>
          {ex.k.map((k, i) => (
            <Text key={i} style={t}>
              {k.q} <Text style={{ color: MUTED }}>~</Text> <Text style={{ fontWeight: '800' }}>{k.p}</Text>
              {k.n ? <Text style={{ color: MUTED }}>  ({k.n})</Text> : null}
            </Text>
          ))}
          <Text style={head}>Bước 3: So sánh và đối chiếu</Text>
          <Text style={t}>{ex.c}</Text>
        </>
      ) : (
        <Text style={t}>{item.why}</Text>
      )}
      {item.quote ? (
        <View style={{ padding: 10, borderRadius: 8, backgroundColor: '#ECFDF3' }}>
          <Text style={{ fontSize: 13, fontWeight: '800', color: GREEN_DARK }}>BẰNG CHỨNG TRONG BÀI</Text>
          <Text style={{ ...t, fontStyle: 'italic' }}>“{item.quote}”</Text>
        </View>
      ) : null}
    </View>
  );
}

/* --------------------------------------------------------------- một câu */

function GapInline({ prompt, value, n, onChange, onFocus, fontSize, disabled, state }: { prompt: string; value: string; n: number; onChange: (v: string) => void; onFocus: () => void; fontSize: number; disabled: boolean; state: 'idle' | 'right' | 'wrong' }) {
  const [before = '', ...rest] = prompt.split('____');
  const after = rest.join('____');
  const style = { fontSize, lineHeight: Math.round(fontSize * 1.65), color: INK } as const;
  const words = (t: string, key: string) => t.split(/\s+/).filter(Boolean).map((w, i) => <Text key={`${key}${i}`} style={{ ...style, marginRight: 5 }}>{w}</Text>);
  const line = state === 'right' ? GREEN : state === 'wrong' ? RED : '#6B7280';
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', rowGap: 4 }}>
      {words(before, 'b')}
      <View style={{ marginRight: 6, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Circle n={n} size={28} state={state === 'right' ? 'right' : state === 'wrong' ? 'wrong' : value.trim() ? 'answered' : 'idle'} />
        <TextInput
          value={value}
          onChangeText={onChange}
          onFocus={onFocus}
          editable={!disabled}
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel={`Answer ${n}`}
          style={{ width: 140, height: 34, paddingHorizontal: 4, borderBottomWidth: 2, borderBottomColor: line, fontSize, fontWeight: '700', color: INK, textAlign: 'center' }}
        />
      </View>
      {words(after, 'a')}
    </View>
  );
}

function ItemView({ item, value, active, flagged, reveal, fontSize, onChange, onFocusItem, onToggleFlag, onReveal, canReveal, review }: {
  item: ExamItem; value: string | undefined; active: boolean; flagged: boolean; reveal: boolean; fontSize: number;
  onChange: (v: string) => void; onFocusItem: () => void; onToggleFlag: () => void; onReveal: () => void; canReveal: boolean; review: boolean;
}) {
  const answered = !!value && value.trim().length > 0;
  const correct = isItemCorrect(item, value);
  const show = reveal;
  const state: 'idle' | 'right' | 'wrong' = show ? (correct ? 'right' : 'wrong') : 'idle';
  const text = { fontSize, lineHeight: Math.round(fontSize * 1.6), color: INK } as const;
  const circleState: CircleState = show ? (correct ? 'right' : 'wrong') : active ? 'active' : answered ? 'answered' : 'idle';

  return (
    <View nativeID={`q-${item.n}`} style={{ gap: 12, paddingVertical: 16 }}>
      <View style={{ flexDirection: 'row', gap: 14, alignItems: 'flex-start' }}>
        {item.kind !== 'gap' ? <Circle n={item.n} state={circleState} size={38} /> : null}
        <View style={{ flex: 1, gap: 12 }}>
          {item.kind === 'gap' ? (
            <GapInline prompt={item.prompt} value={value ?? ''} n={item.n} onChange={onChange} onFocus={onFocusItem} fontSize={fontSize} disabled={show} state={state} />
          ) : (
            <Text style={{ ...text, paddingTop: 4 }}>{item.prompt}</Text>
          )}

          {item.kind === 'radio' && item.options ? (
            <View style={{ gap: 4 }}>
              {item.options.map((o, i) => {
                const picked = value === o;
                const isAns = o === item.answer;
                const st: 'idle' | 'right' | 'wrong' = show ? (isAns ? 'right' : picked ? 'wrong' : 'idle') : 'idle';
                const named = /^(TRUE|FALSE|NOT GIVEN|YES|NO)$/.test(o);
                return (
                  <Pressable key={o} accessibilityRole="radio" accessibilityState={{ checked: picked }} disabled={show} onPress={() => { onFocusItem(); onChange(picked ? '' : o); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 8, paddingHorizontal: 6, borderRadius: 8, backgroundColor: show && picked && !isAns ? RED_SOFT : show && isAns ? '#E8F7EC' : 'transparent' }}>
                    <RadioDot picked={picked} state={st} />
                    <Text style={{ ...text, flex: 1, fontWeight: picked ? '700' : '400' }}>{named ? o : `${letter(i)}.  ${o}`}</Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          {item.kind === 'select' && item.options ? <SelectBox value={value} options={item.options} onPick={(v) => { onFocusItem(); onChange(v); }} disabled={show} state={state} /> : null}

          {item.kind === 'answer' ? (
            <TextInput
              value={value ?? ''}
              onChangeText={onChange}
              onFocus={onFocusItem}
              editable={!show}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="Nhập câu trả lời"
              placeholderTextColor="#9CA3AF"
              style={{ maxWidth: 420, height: 42, paddingHorizontal: 4, borderBottomWidth: 2, borderBottomColor: state === 'right' ? GREEN : state === 'wrong' ? RED : '#6B7280', fontSize, fontWeight: '700', color: INK }}
            />
          ) : null}

          {!review ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
              <Pressable onPress={onToggleFlag} accessibilityRole="button" accessibilityState={{ selected: flagged }}>
                <Text style={{ fontSize: 13, color: flagged ? '#B45309' : MUTED, fontWeight: '700' }}>{flagged ? '⚑ Đã đánh dấu xem lại' : '⚐ Đánh dấu xem lại'}</Text>
              </Pressable>
              {canReveal && answered && !reveal ? (
                <Pressable onPress={onReveal} accessibilityRole="button"><Text style={{ fontSize: 13, fontWeight: '800', color: GREEN_DARK }}>Kiểm tra đáp án</Text></Pressable>
              ) : null}
            </View>
          ) : null}

          {show && (review ? active : true) ? <ExplainPanel item={item} given={value} fontSize={fontSize} /> : null}
          {review && !active ? (
            <Pressable onPress={onFocusItem}><Text style={{ fontSize: 14, fontWeight: '800', color: GREEN_DARK }}>Xem giải thích ›</Text></Pressable>
          ) : null}
        </View>
      </View>
      <View style={{ height: 1, backgroundColor: LINE, marginTop: 4 }} />
    </View>
  );
}

/* --------------------------------------------------------------- nhóm câu */

function Instruction({ lines, wordLimit, fontSize }: { lines: string[]; wordLimit?: string; fontSize: number }) {
  const t = { fontSize, lineHeight: Math.round(fontSize * 1.6), color: INK } as const;
  // In đậm các từ khóa như đề thật: NO MORE THAN ..., ONE WORD ONLY, TWO letters.
  const BOLD = /(NO MORE THAN [A-Z ]+?(?: AND\/OR A NUMBER)?(?=[\s.,]|$)|ONE WORD ONLY|TWO letters|A–[A-H])/g;
  return (
    <View style={{ gap: 2 }}>
      {lines.map((l, k) => (
        <Text key={k} style={t}>{l.split(BOLD).map((p, i) => (i % 2 === 1 ? <Text key={i} style={{ fontWeight: '800' }}>{p}</Text> : p))}</Text>
      ))}
      {wordLimit && !lines.some((l) => l.toUpperCase().includes(wordLimit)) ? <Text style={{ ...t, fontWeight: '800' }}>Choose {wordLimit} for each answer.</Text> : null}
    </View>
  );
}

function MatrixGroup({ group, answers, reveal, fontSize, onChange, onFocusItem, current }: { group: ExamGroup; answers: ExamAnswers; reveal: (n: number) => boolean; fontSize: number; onChange: (n: number, v: string) => void; onFocusItem: (n: number) => void; current: number | null }) {
  const cols = group.items[0]?.options ?? [];
  return (
    <View style={{ borderWidth: 1.5, borderColor: LINE, borderRadius: 10, overflow: 'hidden', backgroundColor: '#FFFFFF' }}>
      <View style={{ flexDirection: 'row', backgroundColor: '#FAF4E8' }}>
        <View style={{ flex: 1 }} />
        {cols.map((c) => (
          <View key={c} style={{ width: 52, alignItems: 'center', paddingVertical: 10 }}><Text style={{ fontSize: 16, fontWeight: '800', color: INK }}>{c}</Text></View>
        ))}
      </View>
      {group.items.map((it) => {
        const v = answers[it.n];
        const show = reveal(it.n);
        const ok = isItemCorrect(it, v);
        return (
          <View key={it.n} nativeID={`q-${it.n}`} style={{ flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: LINE }}>
            <View style={{ flex: 1, flexDirection: 'row', gap: 12, alignItems: 'center', padding: 12 }}>
              <Circle n={it.n} state={show ? (ok ? 'right' : 'wrong') : current === it.n ? 'active' : v ? 'answered' : 'idle'} />
              <Text style={{ flex: 1, fontSize: fontSize - 1, lineHeight: Math.round((fontSize - 1) * 1.5), color: INK }}>{it.prompt.replace(/^Which paragraph contains the following information\?\s*/i, '')}</Text>
            </View>
            {cols.map((c) => {
              const picked = v === c;
              const isAns = c === it.answer;
              const st: 'idle' | 'right' | 'wrong' = show ? (isAns ? 'right' : picked ? 'wrong' : 'idle') : 'idle';
              return (
                <Pressable key={c} accessibilityRole="radio" accessibilityState={{ checked: picked }} disabled={show} onPress={() => { onFocusItem(it.n); onChange(it.n, picked ? '' : c); }} style={{ width: 52, alignItems: 'center', paddingVertical: 12 }}>
                  <RadioDot picked={picked} state={st} />
                </Pressable>
              );
            })}
          </View>
        );
      })}
    </View>
  );
}

function MapBox({ map }: { map: NonNullable<ExamGroup['map']> }) {
  const rows = [map.cells.slice(0, 3), map.cells.slice(3, 6)];
  return (
    <View style={{ alignItems: 'center', padding: 14, borderWidth: 1.5, borderColor: LINE, borderRadius: 10, backgroundColor: '#FFFFFF' }}>
      <Text style={{ fontSize: 15, fontWeight: '800', color: INK, marginBottom: 8 }}>{map.title}</Text>
      <View style={{ width: '100%', maxWidth: 380, gap: 8 }}>
        {rows.map((row, ri) => (
          <View key={ri} style={{ flexDirection: 'row', gap: 8 }}>
            {row.map((c) => (
              <View key={c} style={{ flex: 1, height: 58, borderRadius: 8, borderWidth: 2, borderColor: GREEN, backgroundColor: '#F0FBF3', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 20, fontWeight: '900', color: GREEN_DARK }}>{c}</Text>
              </View>
            ))}
          </View>
        ))}
        <View style={{ alignItems: 'center' }}>
          <View style={{ paddingHorizontal: 14, paddingVertical: 5, borderRadius: 999, backgroundColor: INK }}><Text style={{ fontSize: 12, fontWeight: '800', color: '#FFFFFF' }}>▲ {map.entrance}</Text></View>
        </View>
      </View>
    </View>
  );
}

function GroupView(props: {
  group: ExamGroup; answers: ExamAnswers; current: number | null; flags: ReadonlySet<number>; fontSize: number; review: boolean; canReveal: boolean;
  revealed: ReadonlySet<number>; onChange: (n: number, v: string) => void; onFocusItem: (n: number) => void; onToggleFlag: (n: number) => void; onReveal: (n: number) => void;
}) {
  const { group, fontSize } = props;
  const reveal = (n: number) => props.review || props.revealed.has(n);
  const matrix = group.typeId === 'reading-matching-info' && !!group.items[0]?.options && group.items[0]!.options!.every((o) => /^[A-H]$/.test(o));
  return (
    <View style={{ gap: 12, marginBottom: 26 }}>
      <Text style={{ fontSize: fontSize + 8, fontWeight: '500', color: INK }}>{group.heading.replace('–', ' - ')}</Text>
      <Instruction lines={group.instruction} wordLimit={group.wordLimit} fontSize={fontSize} />
      {group.legend ? (
        <View style={{ gap: 2 }}>
          {group.legend.map((l) => {
            const [label, ...rest] = l.split(' — ');
            return <Text key={l} style={{ fontSize, lineHeight: Math.round(fontSize * 1.6), color: INK }}>Choose <Text style={{ fontWeight: '800' }}>{label}</Text> {rest.join(' — ')}</Text>;
          })}
        </View>
      ) : null}
      {group.optionsBox && !matrix ? (
        <View style={{ gap: 6, padding: 14, borderWidth: 1.5, borderColor: LINE, borderRadius: 10, backgroundColor: '#FFFFFF' }}>
          <Text style={{ fontSize, fontWeight: '800', color: INK }}>{group.optionsBox.title}</Text>
          {group.optionsBox.items.map((o, i) => <Text key={o} style={{ fontSize, lineHeight: Math.round(fontSize * 1.5), color: INK }}>{isLetterOnly(o) ? o : `${letter(i)}.  ${o}`}</Text>)}
        </View>
      ) : null}
      {group.map ? <MapBox map={group.map} /> : null}
      {matrix ? (
        <MatrixGroup group={group} answers={props.answers} reveal={reveal} fontSize={fontSize} onChange={props.onChange} onFocusItem={props.onFocusItem} current={props.current} />
      ) : (
        <View>
          {group.items.map((it) => (
            <ItemView
              key={it.n}
              item={it}
              value={props.answers[it.n]}
              active={props.current === it.n}
              flagged={props.flags.has(it.n)}
              reveal={reveal(it.n)}
              fontSize={fontSize}
              review={props.review}
              canReveal={props.canReveal}
              onChange={(v) => props.onChange(it.n, v)}
              onFocusItem={() => props.onFocusItem(it.n)}
              onToggleFlag={() => props.onToggleFlag(it.n)}
              onReveal={() => props.onReveal(it.n)}
            />
          ))}
        </View>
      )}
      {matrix && props.review && props.current !== null && group.items.some((i) => i.n === props.current) ? (
        <ExplainPanel item={group.items.find((i) => i.n === props.current)!} given={props.answers[props.current]} fontSize={fontSize} />
      ) : null}
    </View>
  );
}

/* ------------------------------------------------------------ bài đọc/nghe */

/** Tô sáng các cụm trong một đoạn văn (bằng chứng xanh, keyword vàng). */
function highlighted(text: string, marks: Array<{ phrase: string; bg: string }>): React.ReactNode {
  const lower = text.toLowerCase();
  const found: Array<{ s: number; e: number; bg: string }> = [];
  for (const m of marks) {
    const p = m.phrase.trim().toLowerCase();
    if (p.length < 3) continue;
    const i = lower.indexOf(p);
    if (i >= 0) found.push({ s: i, e: i + p.length, bg: m.bg });
  }
  if (!found.length) return text;
  found.sort((a, b) => a.s - b.s);
  const out: React.ReactNode[] = [];
  let cur = 0;
  found.forEach((f, k) => {
    if (f.s < cur) return;
    if (f.s > cur) out.push(text.slice(cur, f.s));
    out.push(<Text key={k} style={{ backgroundColor: f.bg }}>{text.slice(f.s, f.e)}</Text>);
    cur = f.e;
  });
  if (cur < text.length) out.push(text.slice(cur));
  return out;
}

function PassagePane({ part, fontSize, serif, focus }: { part: ExamPart; fontSize: number; serif: boolean; focus: ExamItem | null }) {
  const marks = useMemo(() => {
    if (!focus) return [];
    return [
      ...(focus.quote ? [{ phrase: focus.quote, bg: '#BBF7D0' }] : []),
      ...((focus.ex?.k ?? []).map((k) => ({ phrase: k.p, bg: '#FDE68A' }))),
    ];
  }, [focus]);
  const ff = serif ? SERIF : undefined;
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 28, paddingVertical: 24, gap: 16 }}>
      <Text style={{ fontSize: fontSize + 8, fontWeight: '800', color: INK, textAlign: 'center', fontFamily: ff }}>{part.passageTitle ?? part.label}</Text>
      {(part.paragraphs ?? []).map((p, i) => (
        <Text key={i} style={{ fontSize, lineHeight: Math.round(fontSize * 1.7), color: INK, fontFamily: ff }} {...(Platform.OS === 'web' ? ({ dataSet: { passage: '1' } } as object) : null)}>
          {p.label ? <Text style={{ fontWeight: '900' }}>{p.label.length === 1 ? `${p.label}.  ` : `${p.label}:  `}</Text> : null}
          {highlighted(p.text, marks)}
        </Text>
      ))}
    </ScrollView>
  );
}

function AudioBar({ part, showTranscript }: { part: ExamPart; showTranscript: boolean }) {
  const lines = useMemo(() => (part.script ? parseScript(part.script) : []), [part.script]);
  const [playing, setPlaying] = useState(false);
  const [idx, setIdx] = useState(0);
  const [rate, setRate] = useState(1);
  const [showScript, setShowScript] = useState(false);
  const stopRef = useRef<() => void>(() => undefined);
  const start = useCallback((from: number, r: number) => {
    stopRef.current();
    setPlaying(true);
    stopRef.current = playScript(lines.slice(from), { rate: r, onLine: (i) => setIdx(from + i), onDone: () => setPlaying(false) });
  }, [lines]);
  useEffect(() => () => stopRef.current(), []);
  useEffect(() => { stopRef.current(); setPlaying(false); setIdx(0); setShowScript(false); }, [part.key]);
  const toggle = () => { if (playing) { stopRef.current(); setPlaying(false); } else start(idx, rate); };
  const skip = (d: number) => { const n = Math.max(0, Math.min(lines.length - 1, idx + d)); setIdx(n); if (playing) start(n, rate); };
  const cycleRate = () => { const r = rate === 1 ? 1.25 : rate === 1.25 ? 0.8 : 1; setRate(r); if (playing) start(idx, r); };
  const orange = '#F97316';
  return (
    <View>
      {showScript ? (
        <ScrollView style={{ maxHeight: 200, paddingHorizontal: 28, paddingVertical: 10, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: LINE }}>
          {lines.map((l, i) => <Text key={i} style={{ fontSize: 15, lineHeight: 22, color: INK, backgroundColor: i === idx ? '#FDE68A' : 'transparent' }}><Text style={{ fontWeight: '800' }}>{l.speaker}: </Text>{l.text}</Text>)}
        </ScrollView>
      ) : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 24, height: 68, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: LINE }}>
        <Text style={{ fontSize: 14, color: MUTED, minWidth: 96 }}>Đoạn {Math.min(idx + 1, Math.max(lines.length, 1))} / {Math.max(lines.length, 1)}</Text>
        <View style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: '#E9E2D2' }}>
          <View style={{ width: `${lines.length ? ((idx + (playing ? 0.5 : 0)) / lines.length) * 100 : 0}%`, height: 6, borderRadius: 3, backgroundColor: orange }} />
        </View>
        <Pressable onPress={() => skip(-1)} accessibilityRole="button" accessibilityLabel="Lùi một đoạn" style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: orange, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontWeight: '900', color: orange }}>‹</Text></Pressable>
        <Pressable onPress={toggle} accessibilityRole="button" accessibilityLabel={playing ? 'Tạm dừng' : 'Phát'} style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: orange, alignItems: 'center', justifyContent: 'center' }}>
          {playing ? <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 18 }}>❚❚</Text> : <Icon name="play" size={20} color="#FFFFFF" />}
        </Pressable>
        <Pressable onPress={() => skip(1)} accessibilityRole="button" accessibilityLabel="Tới một đoạn" style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: orange, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontWeight: '900', color: orange }}>›</Text></Pressable>
        <Pressable onPress={cycleRate} accessibilityRole="button" style={{ height: 40, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: LINE, justifyContent: 'center' }}><Text style={{ fontWeight: '700', color: INK }}>Tốc độ: {rate}x</Text></Pressable>
        {showTranscript ? <Pressable onPress={() => setShowScript((v) => !v)} accessibilityRole="button"><Text style={{ fontWeight: '800', color: GREEN_DARK }}>{showScript ? 'Ẩn bản ghi' : 'Xem bản ghi'}</Text></Pressable> : null}
      </View>
    </View>
  );
}

/* ------------------------------------------------------------- phòng thi */

export function IeltsExamRoom({
  skill,
  parts,
  limitSec,
  practiceDefault = false,
  onSubmit,
  onExit,
  onReport,
  onRetry,
  onNext,
  nextLabel,
}: {
  title: string;
  skill: ExamSkill;
  parts: ExamPart[];
  /** Có thì đồng hồ đếm ngược và tự nộp khi hết giờ (bài thi thử); không có thì đếm lên như YouPass. */
  limitSec?: number;
  /** Chế độ luyện: có "Kiểm tra đáp án" ngay từng câu. */
  practiceDefault?: boolean;
  onSubmit: (r: ExamSubmit) => void;
  onExit: () => void;
  /** Mở báo cáo chi tiết (band, phổ điểm, độ chính xác từng dạng) sau khi nộp. */
  onReport: () => void;
  onRetry: () => void;
  onNext?: () => void;
  nextLabel?: string;
}) {
  const { width: winW } = useWindowDimensions();
  const narrow = winW < NARROW_BELOW;
  const [split, setSplit] = useState(0.5);
  const items = useMemo(() => allItems(parts), [parts]);
  const [activeKey, setActiveKey] = useState(parts[0]!.key);
  const [answers, setAnswers] = useState<ExamAnswers>({});
  const [flags, setFlags] = useState<Set<number>>(new Set());
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [current, setCurrent] = useState<number | null>(null);
  const [practice, setPractice] = useState(practiceDefault);
  const [sizeIdx, setSizeIdx] = useState(0);
  const [serif, setSerif] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [settings, setSettings] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [tool, setTool] = useState<'hl' | 'lookup' | null>(null);
  const [mobileTab, setMobileTab] = useState<'passage' | 'questions'>('questions');
  const [review, setReview] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const startedAt = useRef(Date.now());
  const fontSize = SIZES[sizeIdx]!;
  const part = parts.find((p) => p.key === activeKey) ?? parts[0]!;
  const answeredN = useMemo(() => items.filter((i) => (answers[i.n] ?? '').trim()).length, [items, answers]);
  const unanswered = items.length - answeredN;
  const focusItem = current !== null ? items.find((i) => i.n === current) ?? null : null;
  const score = useMemo(() => items.filter((i) => isItemCorrect(i, answers[i.n])).length, [items, answers]);
  const noteCount = Object.values(notes).filter((v) => v.trim()).length;

  useEffect(() => {
    if (review) return;
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt.current) / 1000)), 1000);
    return () => clearInterval(t);
  }, [review]);

  const doSubmit = useCallback(() => {
    if (review) return;
    const seconds = Math.round((Date.now() - startedAt.current) / 1000);
    setReview(true);
    setConfirm(false);
    onSubmit({ answers, seconds });
  }, [answers, onSubmit, review]);
  const submitRef = useRef(doSubmit);
  useEffect(() => { submitRef.current = doSubmit; }, [doSubmit]);
  useEffect(() => { if (limitSec && !review && elapsed >= limitSec) submitRef.current(); }, [elapsed, limitSec, review]);

  const scrollTo = useCallback((n: number) => {
    if (Platform.OS !== 'web') return;
    setTimeout(() => (document.getElementById(`q-${n}`) as HTMLElement | null)?.scrollIntoView?.({ behavior: 'smooth', block: 'center' }), 60);
  }, []);
  const jump = (n: number) => {
    const p = parts.find((x) => n >= x.from && n <= x.to);
    if (p) setActiveKey(p.key);
    setCurrent(n);
    setMobileTab('questions');
    scrollTo(n);
  };

  // Highlight / tra từ: bôi đen trong bài đọc (chỉ web). Highlight bọc vùng chọn bằng <mark>.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onUp = () => {
      if (!tool) return;
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) return;
      const range = sel.getRangeAt(0);
      const node = range.commonAncestorContainer;
      const anchor = (node.nodeType === 3 ? node.parentElement : (node as HTMLElement)) as HTMLElement | null;
      if (!anchor?.closest('[data-passage]')) return;
      const text = sel.toString().trim();
      if (!text) return;
      if (tool === 'lookup') {
        window.open(`/tu-dien?q=${encodeURIComponent(text.split(/\s+/).slice(0, 3).join(' '))}`, '_blank');
        sel.removeAllRanges();
        return;
      }
      const mark = document.createElement('mark');
      mark.style.backgroundColor = '#FDE047';
      mark.style.color = 'inherit';
      try { range.surroundContents(mark); } catch { mark.appendChild(range.extractContents()); range.insertNode(mark); }
      sel.removeAllRanges();
    };
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el?.tagName === 'INPUT' || el?.tagName === 'TEXTAREA') return;
      const k = e.key.toLowerCase();
      if (k === 'h') setTool((t) => (t === 'hl' ? null : 'hl'));
      else if (k === 't') setTool((t) => (t === 'lookup' ? null : 'lookup'));
      else if (k === 'n') setNotesOpen(true);
    };
    document.addEventListener('mouseup', onUp);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mouseup', onUp); document.removeEventListener('keydown', onKey); };
  }, [tool]);

  const shown = limitSec ? Math.max(0, limitSec - elapsed) : elapsed;
  const timerColor = limitSec && shown < 300 ? RED : GREEN;

  const questionPane = (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 28, paddingVertical: 24, paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
      {parts.length > 1 || skill === 'listening' ? (
        <Text style={{ fontSize: 14, fontWeight: '800', color: GREEN_DARK, marginBottom: 6 }}>{part.label.toUpperCase()} · {part.subtitle}</Text>
      ) : null}
      {part.groups.map((g) => (
        <GroupView
          key={`${g.typeId}-${g.from}`}
          group={g}
          answers={answers}
          current={current}
          flags={flags}
          fontSize={fontSize}
          review={review}
          canReveal={practice && !review}
          revealed={revealed}
          onChange={(n, v) => setAnswers((a) => ({ ...a, [n]: v }))}
          onFocusItem={setCurrent}
          onToggleFlag={(n) => setFlags((f) => { const x = new Set(f); if (x.has(n)) x.delete(n); else x.add(n); return x; })}
          onReveal={(n) => setRevealed((r) => new Set(r).add(n))}
        />
      ))}
    </ScrollView>
  );

  const passagePane = skill === 'reading' ? <PassagePane part={part} fontSize={fontSize} serif={serif} focus={review || (current !== null && revealed.has(current)) ? focusItem : null} /> : null;

  return (
    <View style={{ flex: 1, minHeight: 780, backgroundColor: CREAM }}>
      <View style={{ height: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 }}>
        <Pressable onPress={onExit} accessibilityRole="button" accessibilityLabel="Home" style={{ height: 40, paddingHorizontal: 14, borderRadius: 20, borderWidth: 2, borderColor: '#9CA3AF', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Icon name="home" size={18} color="#6B7280" />
          <Text style={{ fontSize: 14, color: '#6B7280', fontWeight: '800' }}>Home</Text>
        </Pressable>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, height: 40, paddingHorizontal: 18, borderRadius: 20, backgroundColor: timerColor }}>
          <Text style={{ fontSize: 17, fontWeight: '800', color: '#FFFFFF', fontVariant: ['tabular-nums'] as never }}>⏱ {clock(shown)}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Pill label={noteCount ? `Xem note (${noteCount})` : 'Xem note'} icon="pencil" onPress={() => setNotesOpen(true)} />
          <Pill label="Cài đặt" icon="settings" onPress={() => setSettings(true)} />
        </View>
      </View>

      {narrow ? (
        <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 8 }}>
          {skill === 'reading' ? <Pill label="Bài đọc" active={mobileTab === 'passage'} onPress={() => setMobileTab('passage')} /> : null}
          <Pill label="Câu hỏi" active={mobileTab === 'questions'} onPress={() => setMobileTab('questions')} />
        </View>
      ) : null}

      <View style={{ flex: 1, minHeight: 0, flexDirection: 'row' }}>
        {narrow ? null : (
          <View style={{ width: 108, paddingTop: 70, alignItems: 'center', gap: 12 }}>
            <Text style={{ fontSize: 15, fontWeight: '800', color: INK }}>Công cụ</Text>
            {skill === 'reading' ? (
              <>
                <ToolButton icon="🖍" label="Highlight" hint="Phím (H)" active={tool === 'hl'} onPress={() => setTool((t) => (t === 'hl' ? null : 'hl'))} />
                <ToolButton icon="📝" label="Notes" hint="Phím (N)" onPress={() => setNotesOpen(true)} />
                <ToolButton icon="🔤" label="Tra từ vựng" hint="Phím (T)" active={tool === 'lookup'} onPress={() => setTool((t) => (t === 'lookup' ? null : 'lookup'))} />
              </>
            ) : (
              <ToolButton icon="📝" label="Notes" hint="Phím (N)" onPress={() => setNotesOpen(true)} />
            )}
          </View>
        )}
        {skill === 'reading' && (!narrow || mobileTab === 'passage') ? <View style={{ flex: narrow ? 1 : split, minHeight: 0, minWidth: 0 }}>{passagePane}</View> : null}
        {skill === 'reading' && !narrow ? (
          <View
            accessibilityLabel="Kéo để đổi độ rộng hai cột"
            {...(Platform.OS === 'web'
              ? ({
                  onPointerDown: (e: { clientX: number; preventDefault: () => void }) => {
                    e.preventDefault();
                    const x0 = e.clientX;
                    const s0 = split;
                    const move = (ev: PointerEvent) => setSplit(Math.min(0.75, Math.max(0.25, s0 + (ev.clientX - x0) / Math.max(600, winW))));
                    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
                    window.addEventListener('pointermove', move);
                    window.addEventListener('pointerup', up);
                  },
                } as object)
              : {})}
            style={[{ width: 16, alignItems: 'center', justifyContent: 'center', borderLeftWidth: 1, borderRightWidth: 1, borderColor: LINE, backgroundColor: '#F6EEDD' }, (Platform.OS === 'web' ? { cursor: 'col-resize', userSelect: 'none' } : null) as never]}
          >
            <Text style={{ fontSize: 14, color: '#9CA3AF' }}>⋮</Text>
          </View>
        ) : null}
        {!narrow || mobileTab === 'questions' ? <View style={{ flex: narrow || skill !== 'reading' ? 1 : 1 - split, minHeight: 0, minWidth: 0 }}>{questionPane}</View> : null}
      </View>

      {skill === 'listening' ? <AudioBar part={part} showTranscript={practice || review} /> : null}

      <View style={{ minHeight: 78, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: CREAM, borderTopWidth: 1, borderTopColor: LINE }}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {parts.length > 1 ? parts.map((p) => (
            <Pressable key={p.key} onPress={() => { setActiveKey(p.key); setCurrent(p.from); }} accessibilityRole="tab" style={{ paddingHorizontal: 12, height: 36, borderRadius: 18, justifyContent: 'center', backgroundColor: p.key === part.key ? GREEN : '#FFFFFF', borderWidth: 1, borderColor: p.key === part.key ? GREEN : LINE }}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: p.key === part.key ? '#FFFFFF' : INK }}>{p.label}</Text>
            </Pressable>
          )) : null}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', paddingHorizontal: 14, paddingVertical: 8, borderWidth: 2, borderColor: GREEN, borderRadius: 10, backgroundColor: '#FFFFFF' }}>
            {Array.from({ length: part.to - part.from + 1 }, (_, i) => part.from + i).map((n) => {
              const it = items.find((x) => x.n === n)!;
              const ok = isItemCorrect(it, answers[n]);
              const st: CircleState = review ? (ok ? 'right' : 'wrong') : current === n ? 'active' : (answers[n] ?? '').trim() ? 'answered' : 'idle';
              return (
                <Pressable key={n} onPress={() => jump(n)} accessibilityRole="button" accessibilityLabel={`Câu ${n}`}>
                  <Circle n={flags.has(n) && !review ? `${n}⚑` : n} state={st} size={32} />
                </Pressable>
              );
            })}
          </View>
        </View>
        {review ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <View style={{ paddingHorizontal: 14, height: 42, borderRadius: 21, backgroundColor: GREEN_SOFT, justifyContent: 'center' }}>
              <Text style={{ fontSize: 15, fontWeight: '900', color: GREEN_DARK }}>{score}/{items.length} đúng</Text>
            </View>
            <Pressable onPress={onReport} accessibilityRole="button" style={{ height: 46, paddingHorizontal: 20, borderRadius: 23, backgroundColor: '#F97316', justifyContent: 'center' }}><Text style={{ fontSize: 16, fontWeight: '800', color: '#FFFFFF' }}>Báo cáo & band</Text></Pressable>
            <Pressable onPress={onRetry} accessibilityRole="button" style={{ height: 46, paddingHorizontal: 18, borderRadius: 23, borderWidth: 1.5, borderColor: '#F97316', backgroundColor: '#FFFFFF', justifyContent: 'center' }}><Text style={{ fontSize: 16, fontWeight: '800', color: '#F97316' }}>Làm lại</Text></Pressable>
            {onNext ? <Pressable onPress={onNext} accessibilityRole="button" style={{ height: 46, paddingHorizontal: 18, borderRadius: 23, borderWidth: 1.5, borderColor: '#F97316', backgroundColor: '#FFFFFF', justifyContent: 'center' }}><Text style={{ fontSize: 16, fontWeight: '800', color: '#F97316' }}>{nextLabel ?? 'Làm bài khác'}</Text></Pressable> : null}
          </View>
        ) : (
          <Pressable onPress={() => setConfirm(true)} accessibilityRole="button" style={{ height: 50, paddingHorizontal: 28, borderRadius: 25, backgroundColor: unanswered === 0 ? GREEN : '#E5E7EB', justifyContent: 'center' }}>
            <Text style={{ fontSize: 17, fontWeight: '800', color: unanswered === 0 ? '#FFFFFF' : '#6B7280' }}>Hoàn thành</Text>
          </Pressable>
        )}
      </View>

      <Modal visible={confirm} transparent animationType="fade" onRequestClose={() => setConfirm(false)}>
        <View nativeID="ielts-exam-modal" style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <View style={{ width: '100%', maxWidth: 440, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, gap: 12 }}>
            <Text style={{ fontSize: 21, fontWeight: '900', color: INK }}>Nộp bài?</Text>
            <Text style={{ fontSize: 16, lineHeight: 24, color: INK }}>
              {unanswered > 0 ? `Bạn còn ${unanswered} câu chưa làm (đã làm ${answeredN}/${items.length}). ` : `Bạn đã làm đủ ${items.length} câu. `}
              {flags.size > 0 ? `${flags.size} câu đang đánh dấu xem lại. ` : ''}Nộp xong sẽ không sửa được đáp án.
            </Text>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
              <Pressable onPress={() => setConfirm(false)} style={{ flex: 1, height: 46, borderRadius: 23, borderWidth: 1.5, borderColor: LINE, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 16, fontWeight: '800', color: INK }}>Làm tiếp</Text></Pressable>
              <Pressable onPress={doSubmit} style={{ flex: 1, height: 46, borderRadius: 23, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 16, fontWeight: '800', color: '#FFFFFF' }}>Nộp bài</Text></Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={settings} transparent animationType="fade" onRequestClose={() => setSettings(false)}>
        <View nativeID="ielts-exam-modal" style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <View style={{ width: '100%', maxWidth: 460, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, gap: 16 }}>
            <Text style={{ fontSize: 21, fontWeight: '900', color: INK }}>Cài đặt</Text>
            <View style={{ gap: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: '800', color: MUTED }}>CỠ CHỮ</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {SIZES.map((s, i) => <Pressable key={s} onPress={() => setSizeIdx(i)} style={{ flex: 1, height: 42, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: i === sizeIdx ? GREEN : '#F3F4F6' }}><Text style={{ fontWeight: '800', color: i === sizeIdx ? '#FFFFFF' : INK }}>{['Vừa', 'Lớn', 'Rất lớn'][i]}</Text></Pressable>)}
              </View>
            </View>
            {skill === 'reading' ? (
              <Pressable onPress={() => setSerif((v) => !v)} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 16, color: INK }}>Chữ có chân (như đề giấy)</Text>
                <Text style={{ fontWeight: '800', color: serif ? GREEN_DARK : MUTED }}>{serif ? 'Bật' : 'Tắt'}</Text>
              </Pressable>
            ) : null}
            <Pressable onPress={() => setPractice((v) => !v)} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={{ fontSize: 16, color: INK }}>Chế độ luyện</Text>
                <Text style={{ fontSize: 13, color: MUTED }}>Có nút "Kiểm tra đáp án" và giải thích ngay từng câu. Tắt để làm như thi thật.</Text>
              </View>
              <Text style={{ fontWeight: '800', color: practice ? GREEN_DARK : MUTED }}>{practice ? 'Bật' : 'Tắt'}</Text>
            </Pressable>
            <Pressable onPress={() => setSettings(false)} style={{ height: 46, borderRadius: 23, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 16, fontWeight: '800', color: '#FFFFFF' }}>Xong</Text></Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={notesOpen} transparent animationType="fade" onRequestClose={() => setNotesOpen(false)}>
        <View nativeID="ielts-exam-modal" style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <View style={{ width: '100%', maxWidth: 520, maxHeight: '80%', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 22, gap: 12 }}>
            <Text style={{ fontSize: 21, fontWeight: '900', color: INK }}>Ghi chú {current !== null ? `· Câu ${current}` : ''}</Text>
            {current !== null ? (
              <TextInput
                value={notes[current] ?? ''}
                onChangeText={(t) => setNotes((n) => ({ ...n, [current]: t }))}
                multiline
                placeholder="Viết ghi chú cho câu này…"
                placeholderTextColor="#9CA3AF"
                style={{ minHeight: 90, padding: 12, borderRadius: 10, borderWidth: 1.5, borderColor: LINE, fontSize: 16, color: INK }}
              />
            ) : <Text style={{ fontSize: 15, color: MUTED }}>Chọn một câu rồi mở ghi chú để viết cho câu đó.</Text>}
            <ScrollView style={{ maxHeight: 200 }}>
              {Object.entries(notes).filter(([, v]) => v.trim()).map(([n, v]) => (
                <Pressable key={n} onPress={() => setCurrent(Number(n))} style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F1EBDD' }}>
                  <Text style={{ fontSize: 14, color: INK }}><Text style={{ fontWeight: '800' }}>Câu {n}: </Text>{v}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Pressable onPress={() => setNotesOpen(false)} style={{ height: 44, borderRadius: 22, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 16, fontWeight: '800', color: '#FFFFFF' }}>Đóng</Text></Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
