import { GlossOrb } from '@/components/ui/GlossOrb';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Appear } from '@/components/motion/Motion';
import { Screen } from '@/components/layout/Screen';
import { HeroStat, LightHero } from '@/components/layout/LightHero';
import { Badge, Button, Card, Icon, StickerCard } from '@/components/ui';
import { DICTATION_SENTENCES, TRANSLATION_SENTENCES } from '@/data/sentence-drills';
import { dictationSetStats } from '@/data/dictation-sets';
import { translationSetStats } from '@/data/translation-sets';
import { audioLibraryStats } from '@/data/audio-library';
import { videoLibraryStats } from '@/data/video-library';
import { useSentenceStats, useSentenceStore } from '@/store/useSentenceStore';
import { color, stickerGradient } from '@/theme/tokens';
import { useL } from '@/i18n/useL';

/**
 * Trang chủ "Luyện câu": hai bài luyện cấp câu, độc lập với nhau.
 *
 * KHÔNG DÙNG BANNER GRADIENT NHƯ /math. Hai bài này chưa phải một module lớn
 * xứng một banner choán nửa màn hình — và phần này lấy cảm hứng từ The IELTS
 * Dictionary: thẻ "sticker" viền đen dày + bóng đổ lệch cứng + gradient rực
 * màu (`StickerCard`), thay vì khối gradient bão hoà kiểu banner cũ.
 */
export default function SentenceHubScreen() {
  const { L, en } = useL();
  const dateLoc = en ? 'en-US' : 'vi-VN';
  const { dictation, translation } = useSentenceStats();
  const sessions = useSentenceStore((s) => s.sessions);

  return (
    <Screen>
      <Appear>
        <LightHero
          badge="SENTENCE PRACTICE" art="listening"
          line1={L('Luyện câu', 'Sentence practice')}
          line2={L('nghe kỹ, viết đúng', 'listen closely, write accurately')}
          subtitle={L(
            `Nghe rồi gõ lại nguyên văn, hoặc đọc một câu tiếng Việt rồi tự dịch sang tiếng Anh. ${dictationSetStats().sets + translationSetStats().sets} bài có chủ đề và ${DICTATION_SENTENCES.length + TRANSLATION_SENTENCES.length} câu lẻ để ôn rải.`,
            `Listen and type it back word for word, or read a Vietnamese sentence and translate it into English yourself. ${dictationSetStats().sets + translationSetStats().sets} topic sets and ${DICTATION_SENTENCES.length + TRANSLATION_SENTENCES.length} single sentences for spaced review.`,
          )}
          footer={
            <>
              <HeroStat value={String(DICTATION_SENTENCES.length)} label={L('câu chép chính tả', 'dictation sentences')} />
              <HeroStat value={String(TRANSLATION_SENTENCES.length)} label={L('câu dịch', 'translation sentences')} />
              <HeroStat value={String(audioLibraryStats().items)} label={L('bài nghe', 'listening tracks')} />
            </>
          }
        >
          <Button
            label={L('Chép chính tả', 'Dictation')}
            iconRight="arrow-right"
            onPress={() => router.push('/sentence/dictation' as never)}
          />
          <Button
            label={L('Dịch câu', 'Translation')}
            variant="outline"
            onPress={() => router.push('/sentence/translate' as never)}
          />
        </LightHero>
      </Appear>

      <View className="mt-5 flex-row flex-wrap gap-4">
        <Appear index={1} style={{ flex: 1, minWidth: 280 }}>
          <ModeCard
            icon="volume"
            colors={stickerGradient.primary}
            title={L('Chép chính tả', 'Dictation')}
            description={L('Nghe một câu, điền lại từng chữ. Sai chữ nào đỏ chữ đó.', 'Hear a sentence, type it back letter by letter.')}
            total={DICTATION_SENTENCES.length}
            stats={dictation}
            scoreLabel={L('chính xác', 'accuracy')}
            onPress={() => router.push('/sentence/dictation' as never)}
          />
        </Appear>
        <Appear index={2} style={{ flex: 1, minWidth: 280 }}>
          <ModeCard
            icon="languages"
            colors={stickerGradient.accent}
            title={L('Dịch câu', 'Translation')}
            description={L('Dịch câu tiếng Việt. Gõ đúng từ nào, từ đó mở ra.', 'Translate the Vietnamese sentence word by word.')}
            total={TRANSLATION_SENTENCES.length}
            stats={translation}
            scoreLabel={L('tự tái tạo được', 'reproduced')}
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
            title={L('Thư viện bộ đề', 'Practice sets')}
            body={L(`${dictationSetStats().sets} bài chép chính tả và ${translationSetStats().sets} bài dịch, mỗi bài một chủ đề.`, `${dictationSetStats().sets} dictation sets and ${translationSetStats().sets} translation sets, each on one topic.`)}
            cta={L('Mở thư viện', 'Open library')}
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
            title={L('Thư viện nghe', 'Listening library')}
            body={L(`${audioLibraryStats().items} bài nghe có SẴN LỜI từ VOA Learning English — bấm vào là làm được ngay, không phải dán gì.`, `${audioLibraryStats().items} tracks WITH TRANSCRIPTS from VOA Learning English — tap and start, nothing to paste.`)}
            cta={L('Mở thư viện nghe', 'Open listening library')}
            onPress={() => router.push('/sentence/audio' as never)}
          />
          <EntryCard
            icon="play"
            tint="primary"
            title={L('Thư viện video', 'Video library')}
            body={L(`${videoLibraryStats().videos} video từ TED, BBC, Vox… giọng bản xứ ở tốc độ thật. Lần đầu mỗi video cần dán phụ đề một lần.`, `${videoLibraryStats().videos} videos from TED, BBC, Vox… native speakers at real speed. Each video needs its subtitles pasted once the first time.`)}
            cta={L('Mở thư viện video', 'Open video library')}
            onPress={() => router.push('/sentence/videos' as never)}
          />
        </View>
      </Appear>

      {sessions.length > 0 ? (
        <Appear index={4}>
          <Card className="mt-5">
            <Text className="font-strong text-cardTitle text-ink">{L('Lượt gần đây', 'Recent sessions')}</Text>
            <View className="mt-3 gap-2">
              {sessions.slice(0, 6).map((session) => (
                <View
                  key={session.id}
                  className="flex-row flex-wrap items-center justify-between gap-2 rounded-panel border border-border p-2.5"
                >
                  <View className="flex-1" style={{ minWidth: 180 }}>
                    <Text className="font-sans text-body text-ink">
                      {session.mode === 'dictation' ? L('Chép chính tả', 'Dictation') : L('Dịch câu', 'Translation')} · {session.total} {L('câu', 'sentences')}
                    </Text>
                    <Text className="mt-0.5 font-mid text-label text-muted">
                      {new Date(session.finishedAt).toLocaleDateString(dateLoc)} ·{' '}
                      {new Date(session.finishedAt).toLocaleTimeString(dateLoc, { hour: '2-digit', minute: '2-digit' })}
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
  // Xếp DỌC: biểu tượng, tên, một đoạn mô tả, liên kết ở đáy. Bản xếp ngang
  // (biểu tượng | chữ | liên kết) ép phần chữ còn một cột hẹp khi ba thẻ
  // đứng cạnh nhau, và mô tả chảy thành một cột dọc chín dòng.
  return (
    <Pressable
      accessibilityRole="link"
      onPress={onPress}
      className="min-w-[260px] flex-1 rounded-[18px] border border-border bg-surface p-5"
      style={({ pressed }) => (pressed ? { opacity: 0.92 } : undefined)}
    >
      <View
        className="h-11 w-11 items-center justify-center rounded-xl"
        style={{ backgroundColor: tint === 'primary' ? '#F3F0FB' : '#F3F0FB' }}
      >
        <Icon name={icon} size={20} color={strong} strokeWidth={2} />
      </View>
      <Text className="mt-4 font-strong text-[19px] leading-7 text-ink">{title}</Text>
      <Text className="mt-1 flex-1 font-sans text-[15px] leading-6 text-muted">{body}</Text>
      <View className="mt-4 flex-row items-center gap-1.5">
        <Text className="font-semi text-[15px]" style={{ color: strong }}>
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
  const { L } = useL();
  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      <StickerCard colors={colors} artSeed={'mode-' + title} style={{ height: '100%' }}>
        <GlossOrb icon={icon} tone={colors} size={48} />
        <Text className="mt-3 font-heavy text-cardTitle text-white">{title}</Text>
        <Text className="mt-1.5 font-sans text-body text-white/85">{description}</Text>

        <View className="mt-4 flex-row flex-wrap items-center gap-2">
          <View className="rounded-pill bg-white/20 px-2.5 py-1">
            <Text className="font-strong text-label text-white">{total} {L('câu', 'sentences')}</Text>
          </View>
          <View className="rounded-pill bg-white/20 px-2.5 py-1">
            <Text className="font-strong text-label text-white">
              {stats.avgScore !== null ? `${Math.round(stats.avgScore * 100)}% ${scoreLabel}` : L('Chưa luyện lần nào', 'Not practised yet')}
            </Text>
          </View>
        </View>

        <View className="mt-4 flex-row items-center gap-1.5">
          <Text className="font-strong text-body text-white">
            {stats.sessions > 0 ? L('Luyện tiếp', 'Continue') : L('Bắt đầu', 'Start')}
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
