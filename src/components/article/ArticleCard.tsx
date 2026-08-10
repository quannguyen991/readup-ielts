import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';

import { Badge, Icon, IconButton, ProgressBar } from '@/components/ui';
import { isReadable, topicLabel, type Article } from '@/data/articles';
import { useStudyStore } from '@/store/useStudyStore';
import { color } from '@/theme/tokens';

/**
 * Card bài đọc dùng ở Library, Dashboard và Practice.
 *
 * Bài Loại B (chỉ có tiêu đề) không mở màn hình đọc mà mở thẳng link gốc —
 * app không lưu và không hiển thị toàn văn báo có bản quyền.
 */
export function ArticleCard({
  article,
  layout = 'grid',
}: {
  article: Article;
  layout?: 'grid' | 'list';
}) {
  const progress = useStudyStore((s) => s.progress[article.id]);
  const bookmarked = useStudyStore((s) => s.bookmarks.includes(article.id));
  const toggleBookmark = useStudyStore((s) => s.toggleBookmark);

  const readable = isReadable(article);

  const open = () => {
    if (readable) router.push(`/read/${article.id}` as never);
    else void WebBrowser.openBrowserAsync(article.sourceUrl);
  };

  return (
    <Pressable
      onPress={open}
      accessibilityRole="button"
      className="flex-row items-center gap-3 rounded-card border border-border bg-surface p-3"
      style={({ pressed }) => (pressed ? { opacity: 0.9 } : undefined)}
    >
      <Thumbnail article={article} size={layout === 'grid' ? 76 : 64} />

      <View className="min-w-0 flex-1">
        <View className="flex-row items-center gap-2">
          <Badge
            label={article.track === 'academic' ? 'Academic' : 'General Training'}
            tone={article.track === 'academic' ? 'primary' : 'success'}
            shape="tag"
            uppercase
          />
          {!readable ? <Badge label="Link gốc" tone="neutral" /> : null}
        </View>

        <Text className="mt-1.5 font-strong text-cardTitle text-ink" numberOfLines={2}>
          {article.title}
        </Text>

        <View className="mt-1.5 flex-row flex-wrap items-center gap-x-4 gap-y-1">
          <Meta icon="clock" label={article.estMinutes ? `${article.estMinutes} min` : '—'} />
          <Meta icon="book" label={topicLabel(article.topic)} />
          {article.bandRange ? <Meta icon="gauge" label={article.bandRange} /> : null}
          <Meta icon="info" label={article.sourceName} />
        </View>

        {readable ? (
          <View className="mt-2 flex-row items-center gap-2">
            <ProgressBar
              value={progress?.percentCompleted ?? 0}
              height={5}
              className="flex-1"
            />
            <Text className="font-mid text-label text-muted">
              {progress?.percentCompleted ?? 0}% hoàn thành
            </Text>
          </View>
        ) : (
          <Text className="mt-2 font-sans text-label text-subtle" numberOfLines={2}>
            {article.summary}
          </Text>
        )}
      </View>

      <IconButton
        name="bookmark"
        accessibilityLabel={bookmarked ? 'Bỏ đánh dấu' : 'Đánh dấu'}
        tone={bookmarked ? 'primary' : 'default'}
        onPress={() => toggleBookmark(article.id)}
      />
    </Pressable>
  );
}

function Thumbnail({ article, size }: { article: Article; size: number }) {
  if (article.thumbnailUrl) {
    return (
      <Image
        source={{ uri: article.thumbnailUrl }}
        style={{ width: size, height: size, borderRadius: 12 }}
        contentFit="cover"
        transition={150}
        cachePolicy="memory-disk"
      />
    );
  }

  // Chưa có ảnh: dùng khối màu theo chủ đề cho card không bị trống.
  return (
    <View
      className="items-center justify-center rounded-panel bg-primary-50"
      style={{ width: size, height: size }}
    >
      <Icon name="book" size={size * 0.34} color={color.primary} />
    </View>
  );
}

function Meta({ icon, label }: { icon: 'clock' | 'book' | 'gauge' | 'info'; label: string }) {
  return (
    <View className="flex-row items-center gap-1">
      <Icon name={icon} size={13} color={color.subtle} />
      <Text className="font-mid text-label text-muted" numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}
