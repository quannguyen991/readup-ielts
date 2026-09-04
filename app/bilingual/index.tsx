import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Grid } from '@/components/layout/Grid';
import { Screen } from '@/components/layout/Screen';
import { Badge, Card, Icon, Pagination } from '@/components/ui';
import {
  BILINGUAL_LEVELS,
  BILINGUAL_TOPICS,
  bilingualStats,
  filterBilingualArticles,
  type BilingualArticle,
} from '@/data/bilingual-repository';
import { color } from '@/theme/tokens';

/**
 * Kho đọc song ngữ Anh–Việt.
 *
 * Vì sao đứng RIÊNG, không trộn vào kho bài đọc chính: hai kho khác nhau ở chỗ
 * căn bản nhất là được phép hiện gì. Kho chính là bài báo có bản quyền — app
 * chỉ giữ phần cho phép và không bao giờ có bản dịch. Kho này do dự án tự viết
 * nên hiện được toàn văn cả hai thứ tiếng, và chính bản dịch mới là lý do tồn
 * tại của nó. Trộn chung thì mỗi thẻ phải tự khai mình thuộc loại nào, và người
 * dùng sẽ bấm vào một bài báo rồi thắc mắc sao không có cột tiếng Việt.
 */

const PAGE_SIZE = 9;

export default function BilingualHubScreen() {
  const [level, setLevel] = useState<string>('all');
  const [topic, setTopic] = useState<string>('all');
  const [page, setPage] = useState(0);

  const stats = useMemo(() => bilingualStats(), []);
  const articles = useMemo(
    () => filterBilingualArticles({ level, topic }),
    [level, topic],
  );

  const pageCount = Math.max(1, Math.ceil(articles.length / PAGE_SIZE));
  const current = Math.min(page, pageCount - 1);
  const shown = articles.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);

  return (
    <Screen>
      <View className="self-start rounded-pill border border-border bg-surface px-3 py-1.5">
        <Text className="font-semi uppercase tracking-wide text-muted" style={{ fontSize: 10 }}>
          Bilingual reading
        </Text>
      </View>

      <Text className="mt-3 font-heavy text-pageTitle text-ink">Đọc song ngữ</Text>
      <Text className="mt-1.5 max-w-[640px] font-sans text-bodyLg text-muted">
        {stats.articles} bài viết riêng cho người học tiếng Việt, xếp từ B1 lên C1. Bản tiếng Anh và
        bản dịch nằm cạnh nhau theo từng đoạn — đọc hết một đoạn rồi mới liếc sang, không phải tra
        từng từ.
      </Text>

      <View className="mt-5">
        <Grid columns={4} tabletColumns={2} mobileColumns={2} gap={12}>
          <StatTile icon="book" label="Bài đọc" value={String(stats.articles)} />
          <StatTile icon="list" label="Đoạn song ngữ" value={String(stats.paragraphs)} />
          <StatTile icon="letters" label="Từ vựng có IPA" value={String(stats.vocab)} />
          <StatTile icon="clipboard" label="Câu hỏi hiểu bài" value={String(stats.questions)} />
        </Grid>
      </View>

      <Card className="mt-5">
        <FilterRow label="Trình độ">
          <Chip label="Tất cả" active={level === 'all'} onPress={() => { setLevel('all'); setPage(0); }} />
          {BILINGUAL_LEVELS.map((l) => (
            <Chip
              key={l}
              label={l}
              active={level === l}
              onPress={() => {
                setLevel(level === l ? 'all' : l);
                setPage(0);
              }}
            />
          ))}
        </FilterRow>

        <FilterRow label="Chủ đề">
          <Chip label="Tất cả" active={topic === 'all'} onPress={() => { setTopic('all'); setPage(0); }} />
          {BILINGUAL_TOPICS.map((t) => (
            <Chip
              key={t}
              label={t}
              active={topic === t}
              onPress={() => {
                setTopic(topic === t ? 'all' : t);
                setPage(0);
              }}
            />
          ))}
        </FilterRow>
      </Card>

      <Text className="mt-5 font-strong text-cardTitle text-ink">
        {articles.length} bài{level !== 'all' || topic !== 'all' ? ' khớp bộ lọc' : ''}
      </Text>

      <View className="mt-3">
        {shown.length > 0 ? (
          <Grid columns={3} tabletColumns={2} mobileColumns={1} gap={16}>
            {shown.map((article) => (
              <BilingualCard key={article.id} article={article} />
            ))}
          </Grid>
        ) : (
          <Card className="items-center py-10">
            <Icon name="search" size={26} color={color.subtle} />
            <Text className="mt-2 text-center font-sans text-body text-muted">
              Không có bài nào khớp. Thử bỏ bớt bộ lọc.
            </Text>
          </Card>
        )}
      </View>

      <Pagination page={current} pageCount={pageCount} onChange={setPage} />
    </Screen>
  );
}

function BilingualCard({ article }: { article: BilingualArticle }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(`/bilingual/${article.id}` as never)}
      className="h-full overflow-hidden rounded-card border border-border bg-surface"
      style={({ pressed }) => (pressed ? { opacity: 0.92 } : undefined)}
    >
      <View className="flex-1 p-4">
        <View className="flex-row flex-wrap items-center gap-1.5">
          <Badge label={article.level} tone="primary" shape="tag" uppercase />
          <Text className="font-semi uppercase tracking-wide text-subtle" style={{ fontSize: 10 }}>
            {article.topic}
          </Text>
        </View>

        <Text className="mt-2.5 font-strong text-cardTitle text-ink" numberOfLines={2}>
          {article.titleEn}
        </Text>
        {/*
          Tên tiếng Việt để chữ nghiêng ngay dưới tên tiếng Anh, không phải chú
          thích nhỏ ở cuối thẻ: đây là kho song ngữ, hai cái tên ngang vai nhau.
        */}
        <Text
          className="mt-1 font-mid text-body text-primary-700"
          numberOfLines={2}
          style={{ fontStyle: 'italic' }}
        >
          {article.titleVi}
        </Text>

        <Text className="mt-2 font-sans text-label text-muted" numberOfLines={3}>
          {article.standfirstVi}
        </Text>
      </View>

      <View className="flex-row items-center gap-3 border-t border-border px-4 py-2.5">
        <Meta icon="list" label={`Bài ${article.order}`} />
        <Meta icon="clock" label={`${article.estMinutes} phút`} />
        <View className="flex-1" />
        <Text className="font-mid text-label text-subtle">{article.wordCount} từ</Text>
      </View>
    </Pressable>
  );
}

function Meta({
  icon,
  label,
}: {
  icon: React.ComponentProps<typeof Icon>['name'];
  label: string;
}) {
  return (
    <View className="flex-row items-center gap-1">
      <Icon name={icon} size={13} color={color.subtle} />
      <Text className="font-mid text-label text-muted">{label}</Text>
    </View>
  );
}

function StatTile({
  icon,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof Icon>['name'];
  label: string;
  value: string;
}) {
  return (
    <View className="flex-row items-center gap-3 rounded-card border border-border bg-surface px-4 py-3.5">
      <View className="h-10 w-10 items-center justify-center rounded-panel bg-primary-50">
        <Icon name={icon} size={18} color={color.primary} strokeWidth={1.9} />
      </View>
      <View className="min-w-0 flex-1">
        <Text className="font-semi uppercase tracking-wide text-subtle" style={{ fontSize: 9 }}>
          {label}
        </Text>
        <Text className="font-heavy text-sectionTitle text-ink">{value}</Text>
      </View>
    </View>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="mb-3 last:mb-0">
      <Text className="mb-1.5 font-semi uppercase tracking-wide text-subtle" style={{ fontSize: 10 }}>
        {label}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-1.5 py-0.5">{children}</View>
      </ScrollView>
    </View>
  );
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      className={[
        'rounded-pill border px-3 py-1.5',
        active ? 'border-primary-600 bg-primary-600' : 'border-border bg-surface',
      ].join(' ')}
    >
      <Text className={['font-semi text-label', active ? 'text-white' : 'text-muted'].join(' ')}>
        {label}
      </Text>
    </Pressable>
  );
}
