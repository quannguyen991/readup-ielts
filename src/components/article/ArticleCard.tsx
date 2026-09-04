import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';

import { Badge, Icon, IconButton, ProgressBar } from '@/components/ui';
import { isReadable, readingLevelLabel, topicLabel, type ArticleMeta } from '@/data/articles';
import { assetKeys, useAssetUrl } from '@/services/assets/useAssets';
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
  query,
}: {
  article: ArticleMeta;
  /** `cover` = ảnh nằm trên, chữ nằm dưới — dùng cho lưới nhiều cột. */
  layout?: 'grid' | 'list' | 'cover';
  /** Chuỗi query kèm theo khi mở bài, ví dụ `types=matching_headings`. */
  query?: string;
}) {
  const progress = useStudyStore((s) => s.progress[article.id]);
  const bookmarked = useStudyStore((s) => s.bookmarks.includes(article.id));
  const toggleBookmark = useStudyStore((s) => s.toggleBookmark);

  const readable = isReadable(article);

  const open = () => {
    if (readable) router.push(`/read/${article.id}${query ? `?${query}` : ''}` as never);
    else void WebBrowser.openBrowserAsync(article.sourceUrl);
  };

  if (layout === 'cover') {
    return (
      <View className="overflow-hidden rounded-card border border-border bg-surface">
        <Pressable
          onPress={open}
          accessibilityRole="button"
          style={({ pressed }) => (pressed ? { opacity: 0.92 } : undefined)}
        >
          <CoverImage article={article} />

          <View className="p-3.5">
            <View className="flex-row flex-wrap items-center gap-1.5">
              {article.exam === 'sat' ? (
                <Badge label="SAT" tone="accent" shape="tag" uppercase />
              ) : (
                <Badge
                  label={article.track === 'academic' ? 'Academic' : 'General Training'}
                  tone={article.track === 'academic' ? 'primary' : 'success'}
                  shape="tag"
                  uppercase
                />
              )}
              <Text className="font-semi uppercase tracking-wide text-subtle" style={{ fontSize: 10 }}>
                {topicLabel(article.topic)}
              </Text>
            </View>

            <Text className="mt-2 font-strong text-cardTitle text-ink" numberOfLines={2}>
              {article.title}
            </Text>

            <Text className="mt-1.5 font-sans text-label text-muted" numberOfLines={2}>
              {article.summary}
            </Text>
          </View>
        </Pressable>

        <View className="flex-row items-center gap-3 border-t border-border px-3.5 py-2.5">
          <Text className="min-w-0 flex-1 font-mid text-label text-subtle" numberOfLines={1}>
            {article.sourceName}
          </Text>
          <Text className="font-mid text-label text-subtle">
            {article.estMinutes ? `${article.estMinutes} phút` : '—'}
          </Text>
          {readable ? (
            <Text className="font-strong text-label text-primary-600">
              {progress?.percentCompleted ?? 0}%
            </Text>
          ) : (
            <Badge label="Link gốc" tone="neutral" />
          )}
          <IconButton
            name="bookmark"
            accessibilityLabel={bookmarked ? 'Bỏ đánh dấu' : 'Đánh dấu'}
            tone={bookmarked ? 'primary' : 'default'}
            onPress={() => toggleBookmark(article.id)}
          />
        </View>
      </View>
    );
  }

  /*
    Khung thẻ là View, KHÔNG phải Pressable.

    Trước đây cả thẻ là một Pressable và nút đánh dấu nằm bên trong nó. Trên web
    react-native-web dựng cả hai thành <button>, mà HTML cấm <button> lồng
    <button>: React báo lỗi hydration, và nút bên trong nhận sự kiện không chắc
    chắn. Nay vùng bấm-để-mở chỉ ôm ảnh và phần chữ, còn nút đánh dấu đứng NGANG
    HÀNG với nó — nhìn y hệt, nhưng không còn lồng nhau.
  */
  return (
    <View className="flex-row items-center gap-3 rounded-card border border-border bg-surface p-3">
      <Pressable
        onPress={open}
        accessibilityRole="button"
        className="min-w-0 flex-1 flex-row items-center gap-3"
        style={({ pressed }) => (pressed ? { opacity: 0.9 } : undefined)}
      >
        <Thumbnail article={article} size={layout === 'grid' ? 76 : 64} />

        <View className="min-w-0 flex-1">
          <View className="flex-row flex-wrap items-center gap-2">
            {/* Kỳ thi trước, rồi mới tới track — track chỉ có nghĩa với IELTS. */}
            {article.exam === 'sat' ? (
              <Badge label="SAT" tone="accent" shape="tag" uppercase />
            ) : (
              <Badge
                label={article.track === 'academic' ? 'Academic' : 'General Training'}
                tone={article.track === 'academic' ? 'primary' : 'success'}
                shape="tag"
                uppercase
              />
            )}
            {!readable ? <Badge label="Link gốc" tone="neutral" /> : null}
          </View>

          <Text className="mt-1.5 font-strong text-cardTitle text-ink" numberOfLines={2}>
            {article.title}
          </Text>

          <View className="mt-1.5 flex-row flex-wrap items-center gap-x-4 gap-y-1">
            <Meta icon="clock" label={article.estMinutes ? `${article.estMinutes} min` : '—'} />
            <Meta icon="book" label={topicLabel(article.topic)} />
            {readingLevelLabel(article) ? (
              <Meta icon="gauge" label={readingLevelLabel(article)!} />
            ) : null}
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
      </Pressable>

      <IconButton
        name="bookmark"
        accessibilityLabel={bookmarked ? 'Bỏ đánh dấu' : 'Đánh dấu'}
        tone={bookmarked ? 'primary' : 'default'}
        onPress={() => toggleBookmark(article.id)}
      />
    </View>
  );
}

/**
 * Ảnh bìa tràn ngang của thẻ `cover`.
 *
 * Có `onError` chứ không chỉ kiểm tra "có URL hay không": một URL tồn tại vẫn
 * có thể trả 404 (ảnh chủ đề chưa sinh, kho ảnh chưa cấu hình), và khi đó
 * `Image` để lại một ô trắng cao bằng cả tấm ảnh — trông như thẻ bị hỏng. Bắt
 * lỗi tải rồi rơi về khối màu thì thẻ luôn có hình khối tử tế.
 */
function CoverImage({ article }: { article: ArticleMeta }) {
  const topicUrl = useAssetUrl(assetKeys.topicThumbnail(article.topic ?? ''));
  const [failed, setFailed] = React.useState(false);
  const uri = article.thumbnailUrl ?? topicUrl;

  if (uri && !failed) {
    return (
      <Image
        source={{ uri }}
        style={{ width: '100%', aspectRatio: 16 / 10, backgroundColor: color.primarySoft }}
        contentFit="cover"
        transition={150}
        cachePolicy="memory-disk"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <View
      className="items-center justify-center bg-primary-50"
      style={{ width: '100%', aspectRatio: 16 / 10 }}
    >
      <Icon name="book" size={30} color={color.primary} />
    </View>
  );
}

function Thumbnail({ article, size }: { article: ArticleMeta; size: number }) {
  /*
    Ba mức, xuống dần: ảnh riêng của bài → ảnh chung theo chủ đề → khối màu.

    Mức giữa là mức quan trọng nhất. Kho có 1409 bài mà sinh ảnh riêng cho từng
    bài thì mất khoảng 18 tiếng gọi API và tốn tiền cho những tấm gần như không
    ai nhìn kỹ. Mười ảnh theo mười chủ đề phủ được toàn bộ kho, và trong một
    lưới thẻ thì "bài này thuộc mảng môi trường" là đúng thứ ảnh cần nói.

    Khối màu vẫn giữ làm mức cuối: ảnh chưa sinh xong, mạng hỏng, hay chủ đề lạ
    thì thẻ vẫn có hình khối tử tế chứ không thủng một lỗ.
  */
  const topicUrl = useAssetUrl(assetKeys.topicThumbnail(article.topic ?? ''));
  const uri = article.thumbnailUrl ?? topicUrl;

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: 12 }}
        contentFit="cover"
        transition={150}
        cachePolicy="memory-disk"
      />
    );
  }

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
