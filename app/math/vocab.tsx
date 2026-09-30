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
                <Label text="Thuật ngữ đề thi 📐" color="#F2B632" tilt={-4} size={12} />
              </View>
              <Text className="font-heavy text-hero text-white">Từ vựng SAT Math</Text>
              <Text className="mt-1.5 font-sans text-bodyLg text-white/90">
                {SAT_VOCAB_TOTALS.terms} thuật ngữ và cụm diễn đạt hay gặp trong đề, chia theo{' '}
                {SAT_VOCAB_TOTALS.categories} nhóm. Lưu vào sổ từ thì vào chung lịch ôn FSRS với những
                từ bạn gặp lúc đọc bài — không phải một kho ôn riêng.
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
              label="Tất cả"
              active={filter === 'all'}
              onPress={() => setFilter('all')}
            />
            {SAT_VOCAB_CATEGORY_ORDER.map((c) => (
              <FilterChip
                key={c}
                label={SAT_VOCAB_CATEGORY_LABEL[c]}
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
              {learned}/{visible.length} đã lưu vào sổ từ
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
            Đã thêm {justSaved} mục vào sổ. Chúng vào chung lịch ôn FSRS với những từ bạn lưu lúc đọc
            bài, nên không bị ôn trùng.
          </Text>
        </View>
      ) : null}

      {remaining.length > 0 ? (
        <Appear index={2}>
          <Button
            className="mt-3 self-start"
            label={`Lưu cả ${remaining.length} mục chưa lưu vào sổ`}
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
            Đã lưu hết {filter === 'all' ? 'cả bộ' : 'nhóm này'} vào sổ từ.
          </Text>
        </View>
      )}

      {groups.map((group, gi) => (
        <Appear key={group.category} index={gi + 3}>
          <View className="mt-5">
            <SectionHeader
              title={SAT_VOCAB_CATEGORY_LABEL[group.category]}
              subtitle={`${SAT_VOCAB_CATEGORY_BLURB[group.category]} · ${group.terms.length} mục`}
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
  const [open, setOpen] = useState(false);

  return (
    <Card>
      <View className="flex-row flex-wrap items-start justify-between gap-2">
        <View className="min-w-0 flex-1" style={{ minWidth: 200 }}>
          <View className="flex-row flex-wrap items-baseline gap-2">
            <Text className="font-heavy text-cardTitle text-ink">{term.term}</Text>
            {term.term.includes(' ') ? <Badge label="Cụm từ" tone="neutral" shape="tag" /> : null}
          </View>
          <Text className="mt-0.5 font-strong text-body text-ink">{term.meaningVi}</Text>
        </View>

        <View className="flex-row items-center gap-2">
          <Button
            label={open ? 'Thu gọn' : 'Định nghĩa'}
            variant="ghost"
            size="sm"
            onPress={() => setOpen((v) => !v)}
          />
          {saved ? (
            <View className="flex-row items-center gap-1 rounded-pill bg-success-soft px-2.5 py-1.5">
              <Icon name="check" size={13} color={color.success} />
              <Text className="font-strong text-label" style={{ color: color.success }}>
                Đã lưu
              </Text>
            </View>
          ) : (
            <Button label="Lưu" size="sm" iconRight="plus" onPress={onSave} />
          )}
        </View>
      </View>

      {open ? (
        <View className="mt-3 gap-2 border-t border-border pt-3">
          <Detail label="Định nghĩa" value={term.definitionEn} />
          <Detail label="Ví dụ" value={term.example} italic />
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
