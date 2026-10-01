import React, { useMemo, useState } from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Appear, PressScale } from '@/components/motion/Motion';
import { AssetImage, Badge, Button, Card, Icon, SectionHeader, type IconName } from '@/components/ui';
import {
  SAT_VOCAB_CATEGORY_BLURB,
  SAT_VOCAB_CATEGORY_LABEL,
  SAT_VOCAB_CATEGORY_ORDER,
  SAT_VOCAB_TERMS,
  SAT_VOCAB_TOTALS,
  groupSatVocabByCategory,
  satVocabLemma,
  type SatVocabCategory,
  type SatVocabTerm,
} from '@/data/sat-math-vocab';
import { assetKeys } from '@/services/assets/useAssets';
import { useVocabStore } from '@/store/useVocabStore';
import { color, gradient } from '@/theme/tokens';
import { PageStickers } from '@/components/illust/HeroArt';
import { Label, Sticker } from '@/components/illust/Sticker';
import { Badge as BadgeSticker } from '@/components/illust/Cute';
import { CuteTrophy, Motion } from '@/components/illust/CuteMore';
import { useL } from '@/i18n/useL';

/** Tên + mô tả nhóm khi giao diện ở tiếng Anh (bản tiếng Việt ở `data/sat-math-vocab.ts`). */
const CATEGORY_LABEL_EN: Record<SatVocabCategory, string> = {
  foundations: 'Number foundations',
  algebra: 'Algebra',
  advanced_math: 'Advanced Math',
  problem_solving_data: 'Problem-Solving and Data Analysis',
  geometry_trig: 'Geometry and Trigonometry',
  word_problem_language: 'Word-problem phrasing',
};

const CATEGORY_BLURB_EN: Record<SatVocabCategory, string> = {
  foundations: 'Basic operations and number properties — the foundation for every domain.',
  algebra: 'Variables, expressions, and linear equations and inequalities.',
  advanced_math: 'Functions, polynomials, quadratics and other nonlinear functions.',
  problem_solving_data: 'Ratios, percentages, descriptive statistics and probability.',
  geometry_trig: 'Plane geometry, solids and trigonometry.',
  word_problem_language:
    "Not math terms — this is how the QUESTION phrases its conditions in English. Misread these and you misread the question, even if your math is right.",
};

/**
 * Từ vựng SAT Math — chuyên đề riêng, tách khỏi 30 chủ đề IELTS.
 *
 * Lý do tách được ghi rõ trong `src/data/sat-math-vocab.ts`: đây là THUẬT NGỮ
 * toán (coefficient, quotient) và CỤM DIỄN ĐẠT ĐỀ BÀI (at least, is a factor
 * of), không phải từ vựng học thuật xếp theo band IELTS.
 *
 * Lưu vào sổ từ vẫn đi qua đúng `saveWord` của `useVocabStore`, nên nó vào
 * CHUNG một lịch ôn FSRS với từ lưu lúc đọc bài — không tách thành một kho ôn
 * riêng chỉ vì nguồn gốc khác nhau.
 */
export default function SatMathVocabScreen() {
  const { L, en } = useL();
  const { width } = useWindowDimensions();
  const wide = width >= 900;

  const entries = useVocabStore((s) => s.entries);
  const saveWord = useVocabStore((s) => s.saveWord);
  const [filter, setFilter] = useState<SatVocabCategory | 'all'>('all');
  const [justSaved, setJustSaved] = useState(0);

  const savedLemmas = useMemo(
    () => new Set(Object.values(entries).map((e) => e.lemma.toLowerCase())),
    [entries],
  );

  const visible = useMemo(
    () => (filter === 'all' ? SAT_VOCAB_TERMS : SAT_VOCAB_TERMS.filter((t) => t.category === filter)),
    [filter],
  );
  const groups = useMemo(() => groupSatVocabByCategory(visible), [visible]);
  const remaining = useMemo(
    () => visible.filter((t) => !savedLemmas.has(satVocabLemma(t.term))),
    [visible, savedLemmas],
  );
  const learned = visible.length - remaining.length;

  const save = (term: SatVocabTerm) => {
    saveWord({
      word: term.term,
      lemma: satVocabLemma(term.term),
      phonetic: null,
      partOfSpeech: null,
      definitionContext: null,
      definitionGeneral: term.definitionEn,
      definitionVi: term.meaningVi,
      exampleSentence: term.example,
      sourceSentence: term.example,
      articleId: null,
      articleTitle: 'Từ vựng SAT Math',
      paragraphIndex: null,
      // Cụm nhiều từ ("at least", "is a factor of") đúng nghĩa là collocation
      // hơn là một từ đơn — dùng lại đúng cờ đang có, không bịa trường mới.
      isCollocation: term.term.trim().includes(' '),
    });
  };

  const saveAll = () => {
    remaining.forEach(save);
    setJustSaved(remaining.length);
  };

  return (
    <Screen>
      <Appear>
        <LinearGradient
          colors={[...gradient.hero]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 20, padding: 20 }}
        >
          <Button
            className="mb-2 self-start"
            label="SAT Math"
            variant="onDark"
            size="sm"
            iconLeft="chevron-left"
            onPress={() => router.push('/math' as never)}
          />
          <View className="flex-row flex-wrap items-center justify-between gap-4">
            <View className="flex-1" style={{ minWidth: 240 }}>
              <View aria-hidden className="mb-2">
                <Label text={L('Thuật ngữ đề thi 📐', 'Exam terms 📐')} color="#F2B632" tilt={-4} size={12} />
              </View>
              <Text className="font-heavy text-hero text-white">{L('Từ vựng SAT Math', 'SAT Math vocabulary')}</Text>
              <Text className="mt-1.5 font-sans text-bodyLg text-white/90">
                {L(
                  `${SAT_VOCAB_TOTALS.terms} thuật ngữ và cụm diễn đạt hay gặp trong đề, chia theo ${SAT_VOCAB_TOTALS.categories} nhóm. Lưu vào sổ từ thì vào chung lịch ôn FSRS với những từ bạn gặp lúc đọc bài — không phải một kho ôn riêng.`,
                  `${SAT_VOCAB_TOTALS.terms} terms and phrases that show up often in the test, in ${SAT_VOCAB_TOTALS.categories} groups. Saved words join the same FSRS review schedule as words you meet while reading — not a separate deck.`,
                )}
              </Text>
            </View>
            {wide ? (
              <AssetImage assetKey={assetKeys.illustration('vocabulary-hero')} preset="heroCompact" />
            ) : (
              <View aria-hidden>
                <PageStickers scene="math" compact />
              </View>
            )}
          </View>
        </LinearGradient>
      </Appear>

      <Appear index={1}>
        <View className="mt-4 flex-row flex-wrap items-center justify-between gap-3">
          <View className="flex-row flex-wrap gap-2">
            <FilterChip
              label={L('Tất cả', 'All')}
              active={filter === 'all'}
              onPress={() => setFilter('all')}
            />
            {SAT_VOCAB_CATEGORY_ORDER.map((c) => (
              <FilterChip
                key={c}
                label={en ? CATEGORY_LABEL_EN[c] : SAT_VOCAB_CATEGORY_LABEL[c]}
                active={filter === c}
                onPress={() => setFilter(c)}
              />
            ))}
          </View>

          <View className="flex-row items-center gap-2">
            <View aria-hidden>
              <BadgeSticker icon="star" color="#F2B632" size={24} />
            </View>
            <Text className="font-mid text-label text-muted">
              {L(`${learned}/${visible.length} đã lưu vào sổ từ`, `${learned}/${visible.length} saved to your word book`)}
            </Text>
          </View>
        </View>
      </Appear>

      {justSaved > 0 ? (
        <View className="mt-3 flex-row items-center gap-2 rounded-card bg-success-soft p-3">
          <View aria-hidden>
            <BadgeSticker icon="check" color="#22A06B" size={26} />
          </View>
          <Text className="flex-1 font-sans text-body text-ink">
            {L(
              `Đã thêm ${justSaved} mục vào sổ. Chúng vào chung lịch ôn FSRS với những từ bạn lưu lúc đọc bài, nên không bị ôn trùng.`,
              `Added ${justSaved} items to your word book. They share the FSRS review schedule with words you saved while reading, so nothing gets reviewed twice.`,
            )}
          </Text>
        </View>
      ) : null}

      {remaining.length > 0 ? (
        <Appear index={2}>
          <Button
            className="mt-3 self-start"
            label={L(`Lưu cả ${remaining.length} mục chưa lưu vào sổ`, `Save all ${remaining.length} unsaved items`)}
            iconRight="plus"
            onPress={saveAll}
          />
        </Appear>
      ) : (
        <View className="mt-3 flex-row items-center gap-2">
          <View aria-hidden>
            <Motion kind="wobble">
              <Sticker tilt={-8}>
                <CuteTrophy size={36} />
              </Sticker>
            </Motion>
          </View>
          <Text className="font-strong text-body text-ink">
            {filter === 'all'
              ? L('Đã lưu hết cả bộ vào sổ từ.', 'The whole set is saved to your word book.')
              : L('Đã lưu hết nhóm này vào sổ từ.', 'This whole group is saved to your word book.')}
          </Text>
        </View>
      )}

      {groups.map((group, gi) => (
        <Appear key={group.category} index={gi + 3}>
          <View className="mt-5">
            <SectionHeader
              title={en ? CATEGORY_LABEL_EN[group.category] : SAT_VOCAB_CATEGORY_LABEL[group.category]}
              subtitle={L(
                `${SAT_VOCAB_CATEGORY_BLURB[group.category]} · ${group.terms.length} mục`,
                `${CATEGORY_BLURB_EN[group.category]} · ${group.terms.length} items`,
              )}
              icon={CATEGORY_ICON[group.category]}
            />
            <View className="mt-2 gap-2">
              {group.terms.map((term) => (
                <TermRow
                  key={`${term.category}:${term.term}`}
                  term={term}
                  saved={savedLemmas.has(satVocabLemma(term.term))}
                  onSave={() => save(term)}
                />
              ))}
            </View>
          </View>
        </Appear>
      ))}

      <View className="h-6" />
    </Screen>
  );
}

const CATEGORY_ICON: Record<SatVocabCategory, IconName> = {
  foundations: 'gauge',
  algebra: 'letters',
  advanced_math: 'trending',
  problem_solving_data: 'list',
  geometry_trig: 'target',
  word_problem_language: 'chat',
};

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <PressScale onPress={onPress}>
      <View
        className="rounded-pill border px-3 py-1.5"
        style={{
          borderColor: active ? color.primary : color.border,
          backgroundColor: active ? color.primarySoft : color.surface,
        }}
      >
        <Text
          className={active ? 'font-strong text-label' : 'font-sans text-label'}
          style={{ color: active ? color.primary : color.body }}
        >
          {label}
        </Text>
      </View>
    </PressScale>
  );
}

function TermRow({
  term,
  saved,
  onSave,
}: {
  term: SatVocabTerm;
  saved: boolean;
  onSave: () => void;
}) {
  const { L } = useL();
  const [open, setOpen] = useState(false);

  return (
    <Card>
      <View className="flex-row flex-wrap items-start justify-between gap-2">
        <View className="min-w-0 flex-1" style={{ minWidth: 200 }}>
          <View className="flex-row flex-wrap items-baseline gap-2">
            <Text className="font-heavy text-cardTitle text-ink">{term.term}</Text>
            {term.term.includes(' ') ? <Badge label={L('Cụm từ', 'Phrase')} tone="neutral" shape="tag" /> : null}
          </View>
          <Text className="mt-0.5 font-strong text-body text-ink">{term.meaningVi}</Text>
        </View>

        <View className="flex-row items-center gap-2">
          <Button
            label={open ? L('Thu gọn', 'Collapse') : L('Định nghĩa', 'Definition')}
            variant="ghost"
            size="sm"
            onPress={() => setOpen((v) => !v)}
          />
          {saved ? (
            <View className="flex-row items-center gap-1 rounded-pill bg-success-soft px-2.5 py-1.5">
              <Icon name="check" size={13} color={color.success} />
              <Text className="font-strong text-label" style={{ color: color.success }}>
                {L('Đã lưu', 'Saved')}
              </Text>
            </View>
          ) : (
            <Button label={L('Lưu', 'Save')} size="sm" iconRight="plus" onPress={onSave} />
          )}
        </View>
      </View>

      {open ? (
        <View className="mt-3 gap-2 border-t border-border pt-3">
          <Detail label={L('Định nghĩa', 'Definition')} value={term.definitionEn} />
          <Detail label={L('Ví dụ', 'Example')} value={term.example} italic />
        </View>
      ) : null}
    </Card>
  );
}

function Detail({ label, value, italic }: { label: string; value: string; italic?: boolean }) {
  return (
    <View>
      <Text className="font-mid text-label text-muted">{label}</Text>
      <Text
        className="mt-0.5 font-sans text-body text-ink"
        style={italic ? { fontStyle: 'italic' } : undefined}
      >
        {value}
      </Text>
    </View>
  );
}
