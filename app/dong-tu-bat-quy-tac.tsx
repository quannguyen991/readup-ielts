import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { LightHero } from '@/components/layout/LightHero';
import { Screen } from '@/components/layout/Screen';
import { Button, Card, Icon, ProgressBar } from '@/components/ui';
import { ExampleSentence } from '@/components/vocab/ExampleSentence';
import {
  IRREGULAR_VERBS,
  PATTERNS,
  PATTERN_LABEL,
  isCorrectForm,
  patternOf,
  pickQuizVerbs,
  searchVerbs,
  type IrregularVerb,
  type VerbPattern,
} from '@/data/irregular-verbs';
import { SOUND_GROUPS, VERB_EXAMPLES } from '@/data/irregular-verbs-extra';
import { useL } from '@/i18n/useL';
import { pronounce } from '@/services/audio/pronounce';
import { useIrregularVerbStore } from '@/store/useIrregularVerbStore';
import { color } from '@/theme/tokens';

type Tab = 'lookup' | 'groups' | 'quiz';
type Learned = 'all' | 'todo' | 'done';
const QUIZ_SIZE = 10;
const BY_BASE = new Map(IRREGULAR_VERBS.map((v) => [v.base, v]));

/** Đọc "go, went, gone" — lấy dạng đầu nếu có hai cách viết. */
function speakForms(v: IrregularVerb) {
  const first = (s: string) => s.split('/')[0]!;
  void pronounce(`${v.base}, ${first(v.past)}, ${first(v.pp)}`);
}

export default function IrregularVerbsScreen() {
  const { L } = useL();
  const [tab, setTab] = useState<Tab>('lookup');
  const knownCount = useIrregularVerbStore((s) => Object.keys(s.known).length);
  const total = IRREGULAR_VERBS.length;

  return (
    <Screen>
      <LightHero
        scene="vocab"
        badge={L('NGỮ PHÁP', 'GRAMMAR')}
        line1={L('Động từ bất quy tắc', 'Irregular verbs')}
        line2={L('Tra nhanh V1 – V2 – V3', 'Look up V1 – V2 – V3 fast')}
        subtitle={L(`${total} động từ thường gặp. Gõ để tìm, bấm loa để nghe.`, `${total} common verbs. Type to search, tap the speaker to listen.`)}
      />

      <Card className="mt-4">
        <View className="flex-row items-baseline justify-between" style={{ gap: 12 }}>
          <Text className="font-heavy text-cardTitle text-ink">{L('Đã thuộc', 'Learned')}</Text>
          <Text className="font-heavy text-cardTitle" style={{ color: color.primary }}>{knownCount} / {total}</Text>
        </View>
        <View className="mt-2">
          <ProgressBar value={(knownCount / total) * 100} tone="success" height={8} />
        </View>
      </Card>

      <View className="mt-4 flex-row flex-wrap" style={{ gap: 8 }} accessibilityRole="tablist">
        {([
          ['lookup', L('Tra cứu', 'Look up')],
          ['groups', L('Nhóm theo âm', 'By sound')],
          ['quiz', L('Kiểm tra nhanh', 'Quick test')],
        ] as const).map(([id, label]) => {
          const active = tab === id;
          return (
            <Pressable
              key={id}
              accessibilityRole="tab"
              aria-selected={active}
              onPress={() => setTab(id)}
              style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, backgroundColor: active ? color.primary : '#FFFFFF', borderWidth: 1, borderColor: active ? color.primary : '#F3F0FB' }}
            >
              <Text className="font-semi text-label" style={{ color: active ? '#FFFFFF' : color.ink }}>{label}</Text>
            </Pressable>
          );
        })}
      </View>

      {tab === 'lookup' ? <Lookup /> : tab === 'groups' ? <Groups /> : <Quiz onBack={() => setTab('lookup')} />}
      <View className="h-8" />
    </Screen>
  );
}

/** Nút "Đã thuộc" dùng chung cho mọi hàng. */
function KnownToggle({ base }: { base: string }) {
  const { L } = useL();
  const known = useIrregularVerbStore((s) => Boolean(s.known[base]));
  const toggle = useIrregularVerbStore((s) => s.toggle);
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: known }}
      accessibilityLabel={L(`Đã thuộc ${base}`, `Learned ${base}`)}
      onPress={() => toggle(base)}
      style={{ minHeight: 40, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 12, borderWidth: 1.5, borderColor: known ? '#15803D' : '#E4DFF5', backgroundColor: known ? '#DCFCE7' : '#FFFFFF' }}
    >
      <Text style={{ fontSize: 15, color: known ? '#15803D' : '#94A3B8' }}>{known ? '✓' : '○'}</Text>
      <Text className="font-semi text-label" style={{ color: known ? '#15803D' : color.ink }}>{L('Đã thuộc', 'Learned')}</Text>
    </Pressable>
  );
}

function VerbCard({ v }: { v: IrregularVerb }) {
  const { L } = useL();
  const [open, setOpen] = useState(false);
  const ex = VERB_EXAMPLES[v.base];
  return (
    <Card className="mb-2">
      <View className="flex-row items-center justify-between" style={{ gap: 12 }}>
        <View className="min-w-0 flex-1">
          <View className="flex-row flex-wrap items-baseline" style={{ columnGap: 10, rowGap: 2 }}>
            <Text className="font-heavy text-cardTitle text-ink">{v.base}</Text>
            <Text className="font-semi text-body" style={{ color: color.primary }}>{v.past}</Text>
            <Text className="font-semi text-body" style={{ color: color.primaryDark }}>{v.pp}</Text>
          </View>
          <Text className="mt-1 font-sans text-body text-ink">{v.vi}</Text>
          {v.note ? <Text className="mt-1 font-sans text-label text-muted">{v.note}</Text> : null}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={L(`Nghe ${v.base}`, `Listen to ${v.base}`)}
          onPress={() => speakForms(v)}
          style={{ width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F0FB' }}
        >
          <Icon name="volume" size={18} color={color.primaryDark} />
        </Pressable>
      </View>
      <View className="mt-2 flex-row flex-wrap items-center" style={{ gap: 8 }}>
        <KnownToggle base={v.base} />
        {ex ? (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: open }}
            onPress={() => setOpen((o) => !o)}
            style={{ minHeight: 40, paddingHorizontal: 12, justifyContent: 'center', borderRadius: 12, borderWidth: 1.5, borderColor: '#E4DFF5', backgroundColor: open ? '#F3F0FB' : '#FFFFFF' }}
          >
            <Text className="font-semi text-label text-ink">{open ? L('Ẩn ví dụ', 'Hide examples') : L('Xem ví dụ', 'Show examples')}</Text>
          </Pressable>
        ) : null}
      </View>
      {open && ex ? (
        <View className="mt-3" style={{ gap: 8 }}>
          <View>
            <Text className="font-semi text-label" style={{ color: color.primary }}>V2 · {L('quá khứ đơn', 'past simple')}</Text>
            <ExampleSentence example={ex[0]} className="font-sans text-body text-ink" />
          </View>
          <View>
            <Text className="font-semi text-label" style={{ color: color.primaryDark }}>V3 · {L('hiện tại hoàn thành / bị động', 'present perfect / passive')}</Text>
            <ExampleSentence example={ex[1]} className="font-sans text-body text-ink" />
          </View>
        </View>
      ) : null}
    </Card>
  );
}

function Lookup() {
  const { L } = useL();
  const [query, setQuery] = useState('');
  const [pattern, setPattern] = useState<VerbPattern | 'all'>('all');
  const [learned, setLearned] = useState<Learned>('all');
  const known = useIrregularVerbStore((s) => s.known);

  const counts = useMemo(() => {
    const c: Record<VerbPattern, number> = { AAA: 0, ABA: 0, ABB: 0, ABC: 0 };
    for (const v of IRREGULAR_VERBS) c[patternOf(v)] += 1;
    return c;
  }, []);
  const items = useMemo(
    () =>
      searchVerbs(query).filter(
        (v) => (pattern === 'all' || patternOf(v) === pattern) && (learned === 'all' || (learned === 'done') === Boolean(known[v.base])),
      ),
    [query, pattern, learned, known],
  );
  const doneCount = Object.keys(known).length;

  return (
    <View className="mt-4">
      <View className="flex-row items-center rounded-xl border border-border bg-surface px-3 py-2">
        <Icon name="search" size={16} color="#94A3B8" />
        <TextInput
          accessibilityLabel={L('Tìm động từ', 'Search verbs')}
          placeholder={L('Gõ dạng gốc, V2, V3 hoặc nghĩa (vd. went, bắt đầu)…', 'Type base form, V2, V3 or meaning (e.g. went)…')}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
          placeholderTextColor="#94A3B8"
          style={{ flex: 1, marginLeft: 8, fontSize: 15, minHeight: 36, color: color.ink, outlineStyle: 'none' as never }}
        />
        {query ? (
          <Pressable accessibilityRole="button" accessibilityLabel={L('Xoá ô tìm', 'Clear search')} onPress={() => setQuery('')} hitSlop={10}>
            <Text style={{ fontSize: 14, color: '#94A3B8' }}>✕</Text>
          </Pressable>
        ) : null}
      </View>

      <View className="mt-3 flex-row flex-wrap" style={{ gap: 8 }} accessibilityRole="tablist">
        {([['all', L('Tất cả', 'All'), IRREGULAR_VERBS.length], ...PATTERNS.map((p) => [p, L(PATTERN_LABEL[p].vi, PATTERN_LABEL[p].en), counts[p]] as const)] as const).map(([id, label, n]) => {
          const active = pattern === id;
          return (
            <Pressable
              key={id}
              accessibilityRole="tab"
              aria-selected={active}
              onPress={() => setPattern(id as VerbPattern | 'all')}
              style={{ minHeight: 40, paddingHorizontal: 14, justifyContent: 'center', borderRadius: 12, borderWidth: 1.5, borderColor: active ? color.primary : '#F3F0FB', backgroundColor: active ? '#F3F0FB' : '#FFFFFF' }}
            >
              <Text className="font-semi text-label" style={{ color: active ? color.primary : color.ink }}>{label} · {n}</Text>
            </Pressable>
          );
        })}
      </View>
      {pattern !== 'all' ? (
        <Text className="mt-2 font-sans text-label text-muted">{L('Ví dụ', 'Example')}: {PATTERN_LABEL[pattern].hint}</Text>
      ) : null}

      <View className="mt-2 flex-row flex-wrap" style={{ gap: 8 }} accessibilityRole="tablist">
        {([
          ['all', L('Mọi động từ', 'All verbs')],
          ['todo', `${L('Chưa thuộc', 'Not yet')} · ${IRREGULAR_VERBS.length - doneCount}`],
          ['done', `${L('Đã thuộc', 'Learned')} · ${doneCount}`],
        ] as const).map(([id, label]) => {
          const active = learned === id;
          return (
            <Pressable
              key={id}
              accessibilityRole="tab"
              aria-selected={active}
              onPress={() => setLearned(id)}
              style={{ minHeight: 36, paddingHorizontal: 12, justifyContent: 'center', borderRadius: 999, backgroundColor: active ? '#2B2350' : '#FFFFFF', borderWidth: 1, borderColor: active ? '#2B2350' : '#E4DFF5' }}
            >
              <Text className="font-semi text-label" style={{ color: active ? '#FFFFFF' : color.ink }}>{label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View className="mt-4 flex-row flex-wrap items-baseline" style={{ columnGap: 14, rowGap: 2 }}>
        <Text className="font-sans text-label text-muted">{items.length} {L('động từ', 'verbs')}</Text>
        <Text className="font-sans text-label text-muted">
          <Text className="font-semi text-ink">V1</Text> {L('gốc', 'base')} · <Text className="font-semi" style={{ color: color.primary }}>V2</Text> {L('quá khứ đơn', 'past simple')} · <Text className="font-semi" style={{ color: color.primaryDark }}>V3</Text> {L('quá khứ phân từ', 'past participle')}
        </Text>
      </View>

      {items.length === 0 ? (
        <Card className="mt-2">
          <Text className="font-semi text-body text-ink">{L('Không có động từ nào khớp.', 'No verbs match.')}</Text>
          <Text className="mt-1 font-sans text-label text-muted">{L('Thử gõ dạng gốc, hoặc bỏ bộ lọc.', 'Try the base form, or clear the filter.')}</Text>
        </Card>
      ) : (
        <View className="mt-2">
          {items.map((v) => (
            <VerbCard key={v.base} v={v} />
          ))}
        </View>
      )}
    </View>
  );
}

/** Học theo cụm có chung quy luật âm — dễ nhớ hơn học từng chữ. */
function Groups() {
  const { L } = useL();
  const known = useIrregularVerbStore((s) => s.known);
  const markKnown = useIrregularVerbStore((s) => s.markKnown);
  return (
    <View className="mt-4">
      <Text className="font-sans text-label text-muted">{L('Học cả nhóm một lượt: chung một quy luật nên dễ nhớ hơn học từng chữ.', 'Learn a whole group at once: one pattern is easier than many single verbs.')}</Text>
      <View className="mt-3">
        {SOUND_GROUPS.map((g) => {
          const verbs = g.verbs.map((b) => BY_BASE.get(b)!).filter(Boolean);
          const done = verbs.filter((v) => known[v.base]).length;
          return (
            <Card key={g.id} className="mb-3">
              <View className="flex-row flex-wrap items-baseline justify-between" style={{ gap: 8 }}>
                <Text className="font-heavy text-cardTitle text-ink">{g.title}</Text>
                <Text className="font-semi text-label text-muted">{done} / {verbs.length} {L('đã thuộc', 'learned')}</Text>
              </View>
              <Text className="mt-1 font-sans text-body text-ink">{g.tip}</Text>
              <View className="mt-3" style={{ gap: 6 }}>
                {verbs.map((v) => (
                  <Pressable
                    key={v.base}
                    accessibilityRole="button"
                    accessibilityLabel={L(`Nghe ${v.base}`, `Listen to ${v.base}`)}
                    onPress={() => speakForms(v)}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 12, backgroundColor: known[v.base] ? '#F0FDF4' : '#FAF8FF' }}
                  >
                    <Icon name="volume" size={15} color={color.primaryDark} />
                    <View className="min-w-0 flex-1 flex-row flex-wrap items-baseline" style={{ columnGap: 10 }}>
                      <Text className="font-heavy text-body text-ink">{v.base}</Text>
                      <Text className="font-semi text-body" style={{ color: color.primary }}>{v.past}</Text>
                      <Text className="font-semi text-body" style={{ color: color.primaryDark }}>{v.pp}</Text>
                      <Text className="font-sans text-label text-muted">{v.vi}</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
              <View className="mt-3 flex-row">
                <Button
                  label={done === verbs.length ? L('Cả nhóm đã thuộc', 'Group learned') : L('Đánh dấu cả nhóm đã thuộc', 'Mark whole group learned')}
                  variant={done === verbs.length ? 'ghost' : 'outline'}
                  disabled={done === verbs.length}
                  onPress={() => markKnown(verbs.map((v) => v.base))}
                />
              </View>
            </Card>
          );
        })}
      </View>
    </View>
  );
}

type Result = { verb: IrregularVerb; v2: string; v3: string; ok2: boolean; ok3: boolean };

function Quiz({ onBack }: { onBack: () => void }) {
  const { L } = useL();
  const known = useIrregularVerbStore((s) => s.known);
  const markKnown = useIrregularVerbStore((s) => s.markKnown);
  const [round, setRound] = useState(0);
  // Ưu tiên động từ chưa thuộc; nếu chưa thuộc ít hơn 10 thì bù thêm từ đã thuộc.
  const verbs = useMemo(() => {
    const todo = IRREGULAR_VERBS.filter((v) => !known[v.base]);
    const first = pickQuizVerbs(QUIZ_SIZE, todo);
    if (first.length >= QUIZ_SIZE) return first;
    const rest = pickQuizVerbs(QUIZ_SIZE - first.length, IRREGULAR_VERBS.filter((v) => known[v.base]));
    return [...first, ...rest];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);
  const [index, setIndex] = useState(0);
  const [v2, setV2] = useState('');
  const [v3, setV3] = useState('');
  const [checked, setChecked] = useState<Result | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const v3Ref = useRef<TextInput>(null);
  const saved = useRef(false);

  const restart = () => {
    setRound((r) => r + 1);
    setIndex(0);
    setV2('');
    setV3('');
    setChecked(null);
    setResults([]);
    saved.current = false;
  };

  const current = verbs[index];
  const finished = !current;
  // Hết bộ câu hỏi: làm đúng cả V2 và V3 thì tự đánh dấu "đã thuộc" (một lần).
  useEffect(() => {
    if (!finished || saved.current) return;
    saved.current = true;
    markKnown(results.filter((r) => r.ok2 && r.ok3).map((r) => r.verb.base));
  }, [finished, results, markKnown]);

  if (!current) {
    const right = results.filter((r) => r.ok2 && r.ok3);
    const wrong = results.filter((r) => !(r.ok2 && r.ok3));
    return (
      <View className="mt-4">
        <Card>
          <Text className="font-heavy text-cardTitle text-ink">{L('Kết quả', 'Result')}</Text>
          <Text className="mt-1 font-heavy" style={{ fontSize: 32, color: right.length >= 8 ? '#15803D' : color.primary }}>
            {right.length} / {verbs.length}
          </Text>
          <Text className="font-sans text-label text-muted">{L('Câu đúng khi cả V2 và V3 đúng. Câu đúng được tự đánh dấu "đã thuộc".', 'A question is correct when both V2 and V3 are right. Correct ones are marked "learned".')}</Text>
          <View className="mt-3 flex-row flex-wrap" style={{ gap: 8 }}>
            <Button label={L('Làm bộ khác', 'New set')} onPress={restart} />
            <Button label={L('Về tra cứu', 'Back to lookup')} variant="outline" onPress={onBack} />
          </View>
        </Card>
        {wrong.length > 0 ? (
          <View className="mt-4">
            <Text className="mb-2 font-semi text-body text-ink">{L('Cần ôn lại', 'To review')}</Text>
            {wrong.map((r) => (
              <Card key={r.verb.base} className="mb-2">
                <View className="flex-row flex-wrap items-baseline" style={{ columnGap: 10 }}>
                  <Text className="font-heavy text-cardTitle text-ink">{r.verb.base}</Text>
                  <Text className="font-semi text-body" style={{ color: color.primary }}>{r.verb.past}</Text>
                  <Text className="font-semi text-body" style={{ color: color.primaryDark }}>{r.verb.pp}</Text>
                </View>
                <Text className="mt-1 font-sans text-label text-muted">{L('Bạn gõ', 'You typed')}: {r.v2 || '—'} · {r.v3 || '—'}</Text>
              </Card>
            ))}
          </View>
        ) : null}
      </View>
    );
  }

  const check = () => {
    if (checked) return;
    const r: Result = { verb: current, v2, v3, ok2: isCorrectForm(v2, current.past), ok3: isCorrectForm(v3, current.pp) };
    setChecked(r);
    setResults((all) => [...all, r]);
  };
  const next = () => {
    setIndex((i) => i + 1);
    setV2('');
    setV3('');
    setChecked(null);
  };

  const field = (label: string, value: string, set: (s: string) => void, ok: boolean | null, expected: string, ref?: React.RefObject<TextInput | null>, last?: boolean) => (
    <View className="min-w-0 flex-1" style={{ minWidth: 140 }}>
      <Text className="font-semi text-label text-muted">{label}</Text>
      <TextInput
        ref={ref}
        accessibilityLabel={label}
        value={value}
        onChangeText={set}
        editable={!checked}
        autoCapitalize="none"
        autoCorrect={false}
        autoFocus={!ref}
        onSubmitEditing={() => (last ? check() : v3Ref.current?.focus())}
        returnKeyType={last ? 'done' : 'next'}
        placeholderTextColor="#94A3B8"
        style={{
          marginTop: 4,
          minHeight: 46,
          paddingHorizontal: 12,
          fontSize: 17,
          borderRadius: 12,
          borderWidth: 2,
          color: color.ink,
          outlineStyle: 'none' as never,
          borderColor: ok === null ? '#E4DFF5' : ok ? '#15803D' : '#B42318',
          backgroundColor: ok === null ? '#FFFFFF' : ok ? '#DCFCE7' : '#FEE2E2',
        }}
      />
      {ok === false ? <Text className="mt-1 font-semi text-label" style={{ color: '#15803D' }}>{L('Đúng là', 'Correct')}: {expected}</Text> : null}
    </View>
  );

  return (
    <View className="mt-4">
      <Card key={`${round}-${index}`}>
        <Text className="font-sans text-label text-muted">{L(`Câu ${index + 1} / ${verbs.length}`, `Question ${index + 1} / ${verbs.length}`)}</Text>
        <View className="mt-2 flex-row items-center" style={{ gap: 10 }}>
          <Text className="font-heavy" style={{ fontSize: 28, color: color.ink }}>{current.base}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={L(`Nghe ${current.base}`, `Listen to ${current.base}`)}
            onPress={() => void pronounce(current.base)}
            style={{ width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F0FB' }}
          >
            <Icon name="volume" size={17} color={color.primaryDark} />
          </Pressable>
        </View>
        <Text className="mt-1 font-sans text-body text-ink">{current.vi}</Text>

        <View className="mt-4 flex-row flex-wrap" style={{ gap: 12 }}>
          {field('V2 (quá khứ đơn)', v2, setV2, checked ? checked.ok2 : null, current.past)}
          {field('V3 (quá khứ phân từ)', v3, setV3, checked ? checked.ok3 : null, current.pp, v3Ref, true)}
        </View>

        {checked && current.note ? <Text className="mt-3 font-sans text-label text-muted">{current.note}</Text> : null}

        <View className="mt-4 flex-row flex-wrap" style={{ gap: 8 }}>
          {checked ? (
            <Button label={index + 1 >= verbs.length ? L('Xem kết quả', 'See result') : L('Câu tiếp', 'Next')} onPress={next} />
          ) : (
            <Button label={L('Kiểm tra', 'Check')} onPress={check} disabled={!v2.trim() && !v3.trim()} />
          )}
          <Button label={L('Thoát', 'Exit')} variant="ghost" onPress={onBack} />
        </View>
      </Card>
    </View>
  );
}
