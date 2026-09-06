import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Appear } from '@/components/motion/Motion';
import { Screen } from '@/components/layout/Screen';
import { Badge, Card, Icon, StickerCard } from '@/components/ui';
import { DICTATION_SENTENCES, TRANSLATION_SENTENCES } from '@/data/sentence-drills';
import { dictationSetStats } from '@/data/dictation-sets';
import { translationSetStats } from '@/data/translation-sets';
import { audioLibraryStats } from '@/data/audio-library';
import { videoLibraryStats } from '@/data/video-library';
import { useSentenceStats, useSentenceStore } from '@/store/useSentenceStore';
import { color, stickerGradient } from '@/theme/tokens';

/**
 * Trang chủ "Luyện câu": hai bài luyện cấp câu, độc lập với nhau.
 *
 * KHÔNG DÙNG BANNER GRADIENT NHƯ /math. Hai bài này chưa phải một module lớn
 * xứng một banner choán nửa màn hình — và phần này lấy cảm hứng từ The IELTS
 * Dictionary: thẻ "sticker" viền đen dày + bóng đổ lệch cứng + gradient rực
 * màu (`StickerCard`), thay vì khối gradient bão hoà kiểu banner cũ.
 */
export default function SentenceHubScreen() {
  const { dictation, translation } = useSentenceStats();
  const sessions = useSentenceStore((s) => s.sessions);

  return (
    <Screen>
      <Appear>
        <Text className="font-heavy text-pageTitle text-ink">Luyện câu</Text>
        <Text className="mt-1.5 max-w-[560px] font-sans text-bodyLg text-muted">
          Nghe rồi gõ lại nguyên văn, hoặc đọc một câu tiếng Việt rồi tự dịch sang tiếng Anh.{' '}
          {dictationSetStats().sets + translationSetStats().sets} bài có chủ đề và{' '}
          {DICTATION_SENTENCES.length + TRANSLATION_SENTENCES.length} câu lẻ để ôn rải.
        </Text>
      </Appear>

      <View className="mt-5 flex-row flex-wrap gap-4">
        <Appear index={1} style={{ flex: 1, minWidth: 280 }}>
          <ModeCard
            icon="volume"
            colors={stickerGradient.primary}
            title="Chép chính tả"
            description="Nghe một câu tiếng Anh rồi điền lại từng chữ cái vào ô. Biết trước câu có mấy từ, mỗi từ mấy chữ — sai chữ nào đỏ ngay chữ đó."
            total={DICTATION_SENTENCES.length}
            stats={dictation}
            scoreLabel="chính xác"
            onPress={() => router.push('/sentence/dictation' as never)}
          />
        </Appear>
        <Appear index={2} style={{ flex: 1, minWidth: 280 }}>
          <ModeCard
            icon="languages"
            colors={stickerGradient.accent}
            title="Dịch câu"
            description="Đọc một câu tiếng Việt rồi gõ bản dịch. Câu mẫu nằm sẵn bên cạnh nhưng bị che — gõ đúng từ nào thì từ đó mở ra."
            total={TRANSLATION_SENTENCES.length}
            stats={translation}
            scoreLabel="tự tái tạo được"
            onPress={() => router.push('/sentence/translate' as never)}
          />
        </Appear>
      </View>

      {/*
        Hai lối vào phụ, đặt ngay dưới hai thẻ chế độ: hai thẻ trên trả lời
        "luyện kiểu gì", hai thẻ này trả lời "luyện bằng gì" — câu hỏi tiếp theo
        trong đầu người dùng, nên chúng phải nằm đúng chỗ mắt đi tới.
      */}
      <Appear index={3}>
        <View className="mt-4 flex-row flex-wrap gap-4">
          <EntryCard
            icon="play"
            tint="primary"
            title="Thư viện bộ đề"
            body={`${dictationSetStats().sets} bài chép chính tả và ${translationSetStats().sets} bài dịch, mỗi bài một chủ đề.`}
            cta="Mở thư viện"
            onPress={() => router.push('/sentence/sets' as never)}
          />
          {/*
            Hai thư viện nghe, và thứ tự này có chủ ý: thư viện âm thanh đứng
            TRƯỚC thư viện video vì nó là thư viện DUY NHẤT bấm vào là làm được
            ngay. Video đòi dán phụ đề một lần cho mỗi video — YouTube đã khoá
            đường lấy phụ đề tự động — nên để nó đứng đầu là dẫn người mới vào
            đúng chỗ tốn công nhất trước khi họ kịp thấy app làm được gì.
          */}
          <EntryCard
            icon="volume"
            tint="accent"
            title="Thư viện nghe"
            body={`${audioLibraryStats().items} bài nghe có SẴN LỜI từ VOA Learning English — bấm vào là làm được ngay, không phải dán gì.`}
            cta="Mở thư viện nghe"
            onPress={() => router.push('/sentence/audio' as never)}
          />
          <EntryCard
            icon="play"
            tint="primary"
            title="Thư viện video"
            body={`${videoLibraryStats().videos} video từ TED, BBC, Vox… giọng bản xứ ở tốc độ thật. Lần đầu mỗi video cần dán phụ đề một lần.`}
            cta="Mở thư viện video"
            onPress={() => router.push('/sentence/videos' as never)}
          />
        </View>
      </Appear>

      {sessions.length > 0 ? (
        <Appear index={4}>
          <Card className="mt-5">
            <Text className="font-strong text-cardTitle text-ink">Lượt gần đây</Text>
            <View className="mt-3 gap-2">
              {sessions.slice(0, 6).map((session) => (
                <View
                  key={session.id}
                  className="flex-row flex-wrap items-center justify-between gap-2 rounded-panel border border-border p-2.5"
                >
                  <View className="flex-1" style={{ minWidth: 180 }}>
                    <Text className="font-sans text-body text-ink">
                      {session.mode === 'dictation' ? 'Chép chính tả' : 'Dịch câu'} · {session.total} câu
                    </Text>
                    <Text className="mt-0.5 font-mid text-label text-muted">
                      {new Date(session.finishedAt).toLocaleDateString('vi-VN')} ·{' '}
                      {new Date(session.finishedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  <Badge label={sessionScoreLabel(session)} tone={sessionScoreTone(session)} />
                </View>
              ))}
            </View>
          </Card>
        </Appear>
      ) : null}
    </Screen>
  );
}

/** Thẻ lối vào phụ — nhạt hơn thẻ chế độ để không tranh chỗ với chúng. */
function EntryCard({
  icon,
  tint,
  title,
  body,
  cta,
  onPress,
}: {
  icon: 'play' | 'volume';
  tint: 'primary' | 'accent';
  title: string;
  body: string;
  cta: string;
  onPress: () => void;
}) {
  const strong = tint === 'primary' ? color.primary : color.accent;
  return (
    <Pressable
      accessibilityRole="link"
      onPress={onPress}
      className={`min-w-[280px] flex-1 flex-row items-center gap-4 rounded-card border p-4 ${
        tint === 'primary' ? 'border-primary-200 bg-primary-50' : 'border-accent-200 bg-accent-50'
      }`}
      style={({ pressed }) => (pressed ? { opacity: 0.92 } : undefined)}
    >
      <View
        className="h-12 w-12 items-center justify-center rounded-panel"
        style={{ backgroundColor: strong }}
      >
        <Icon name={icon} size={22} color="#FFFFFF" strokeWidth={1.9} />
      </View>
      <View className="min-w-0 flex-1">
        <Text className={`font-heavy text-cardTitle ${tint === 'primary' ? 'text-primary-900' : 'text-accent-900'}`}>
          {title}
        </Text>
        <Text className={`mt-0.5 font-sans text-body ${tint === 'primary' ? 'text-primary-800' : 'text-accent-800'}`}>
          {body}
        </Text>
      </View>
      <View className="flex-row items-center gap-1.5">
        <Text className="font-strong text-body" style={{ color: strong }}>
          {cta}
        </Text>
        <Icon name="arrow-right" size={16} color={strong} strokeWidth={2} />
      </View>
    </Pressable>
  );
}

function ModeCard({
  icon,
  colors,
  title,
  description,
  total,
  stats,
  scoreLabel,
  onPress,
}: {
  icon: 'volume' | 'languages';
  colors: readonly [string, string];
  title: string;
  description: string;
  total: number;
  stats: { sessions: number; attempts: number; avgScore: number | null };
  scoreLabel: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      <StickerCard colors={colors} style={{ height: '100%' }}>
        <View className="h-12 w-12 items-center justify-center rounded-pill bg-white/90">
          <Icon name={icon} size={22} color={colors[1]} strokeWidth={1.9} />
        </View>
        <Text className="mt-3 font-heavy text-cardTitle text-white">{title}</Text>
        <Text className="mt-1.5 font-sans text-body text-white/85">{description}</Text>

        <View className="mt-4 flex-row flex-wrap items-center gap-2">
          <View className="rounded-pill bg-white/20 px-2.5 py-1">
            <Text className="font-strong text-label text-white">{total} câu</Text>
          </View>
          <View className="rounded-pill bg-white/20 px-2.5 py-1">
            <Text className="font-strong text-label text-white">
              {stats.avgScore !== null ? `${Math.round(stats.avgScore * 100)}% ${scoreLabel}` : 'Chưa luyện lần nào'}
            </Text>
          </View>
        </View>

        <View className="mt-4 flex-row items-center gap-1.5">
          <Text className="font-strong text-body text-white">
            {stats.sessions > 0 ? 'Luyện tiếp' : 'Bắt đầu'}
          </Text>
          <Icon name="arrow-right" size={16} color="#fff" />
        </View>
      </StickerCard>
    </Pressable>
  );
}

function sessionScoreLabel(session: { mode: 'dictation' | 'translation'; attempts: { accuracy?: number; selfCorrect?: boolean }[] }): string {
  if (session.attempts.length === 0) return '—';
  if (session.mode === 'dictation') {
    const avg = session.attempts.reduce((a, b) => a + (b.accuracy ?? 0), 0) / session.attempts.length;
    return `${Math.round(avg * 100)}%`;
  }
  const correct = session.attempts.filter((a) => a.selfCorrect).length;
  return `${correct}/${session.attempts.length}`;
}

function sessionScoreTone(session: { mode: 'dictation' | 'translation'; attempts: { accuracy?: number; selfCorrect?: boolean }[] }): 'success' | 'warning' | 'danger' | 'neutral' {
  if (session.attempts.length === 0) return 'neutral';
  const ratio =
    session.mode === 'dictation'
      ? session.attempts.reduce((a, b) => a + (b.accuracy ?? 0), 0) / session.attempts.length
      : session.attempts.filter((a) => a.selfCorrect).length / session.attempts.length;
  if (ratio >= 0.8) return 'success';
  if (ratio >= 0.5) return 'warning';
  return 'danger';
}
