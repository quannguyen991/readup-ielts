import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';

import { Badge, Icon, IconButton, ProgressBar } from '@/components/ui';
import { ARTICLES, isReadable, readingLevelLabel, topicLabel, type ArticleMeta } from '@/data/articles';
import { buildPhotoOwners, coverSource, generatedCover } from '@/services/articles/cover';
import { GeneratedCoverArt } from './GeneratedCoverArt';
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

/*
  Chủ của từng tấm ảnh, tính MỘT LẦN cho cả kho rồi mọi thẻ chỉ tra.

  Tính theo thứ tự KHO, không theo thứ tự đang hiện: lọc hay sắp xếp lại lưới thì
  chủ của tấm ảnh không được đổi, không thì cùng một bài lúc có ảnh lúc không.
*/
let owners: Map<string, string> | null = null;
function photoOwners(): Map<string, string> {
  if (!owners) owners = buildPhotoOwners(ARTICLES);
  return owners;
}

/**
 * Ảnh bìa tràn ngang của thẻ `cover`.
 *
 * ẢNH THẬT CHỈ KHI NÓ LÀ CỦA RIÊNG BÀI NÀY. Bản trước lấy `thumbnailUrl ?? ảnh chủ
 * đề`, mà cả kho chỉ có 10 ảnh chủ đề cho 1.055 bài không ảnh — màn đầu thư viện
 * có một tấm lặp năm lần. Giờ bài không có ảnh riêng, hoặc ảnh của nó đã thuộc
 * bài khác, thì được một bìa vẽ riêng — xem `services/articles/cover.ts`.
 *
 * `onError` vẫn giữ: ảnh có URL vẫn có thể trả 404, và khi đó rơi về bìa vẽ của
 * chính bài ấy chứ không phải một ô trống hay một icon chung cho mọi thẻ.
 */
function CoverImage({ article }: { article: ArticleMeta }) {
  const [failed, setFailed] = React.useState(false);
  const src = coverSource(article, photoOwners());

  if (src.kind === 'photo' && !failed) {
    return (
      <Image
        source={{ uri: src.uri }}
        style={{ width: '100%', aspectRatio: 16 / 10, backgroundColor: color.primarySoft }}
        contentFit="cover"
        transition={150}
        cachePolicy="memory-disk"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <GeneratedCoverArt
      cover={src.kind === 'generated' ? src : generatedCover(article)}
      aspect="wide"
    />
  );
}

function Thumbnail({ article, size }: { article: ArticleMeta; size: number }) {
  /*
    Cùng luật với ảnh bìa ngang, và cùng một bìa vẽ cho cùng một bài — một bài hiện ở
    thư viện (thẻ ngang) và ở Tổng quan (ô vuông) phải nhận ra được là một bài.

    Bản trước ô vuông không có `onError`: ảnh 404 là để lại một ô trắng. Giờ rơi về
    bìa vẽ như thẻ ngang.
  */
  const [failed, setFailed] = React.useState(false);
  const src = coverSource(article, photoOwners());

  if (src.kind === 'photo' && !failed) {
    return (
      <Image
        source={{ uri: src.uri }}
        style={{ width: size, height: size, borderRadius: 12 }}
        contentFit="cover"
        transition={150}
        cachePolicy="memory-disk"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <GeneratedCoverArt
      cover={src.kind === 'generated' ? src : generatedCover(article)}
      aspect="square"
      size={size}
      radius={12}
    />
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
