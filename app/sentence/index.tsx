import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Appear } from '@/components/motion/Motion';
import { Screen } from '@/components/layout/Screen';
import { NightHero } from '@/components/catalog/NightHero';
import { NeonIcon } from '@/components/neon/Neon';
import { Badge, Card, Icon } from '@/components/ui';
import { DictationLibrary } from '@/components/sentence/DictationLibrary';
import { TranslationLibrary } from '@/components/sentence/TranslationLibrary';
import { DICTATION_SENTENCES, TRANSLATION_SENTENCES } from '@/data/sentence-drills';
import { dictationSetStats } from '@/data/dictation-sets';
import { translationSetStats } from '@/data/translation-sets';
import { audioLibraryStats } from '@/data/audio-library';
import { videoLibraryStats } from '@/data/video-library';
import { useSentenceStats, useSentenceStore } from '@/store/useSentenceStore';
import { color } from '@/theme/tokens';
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
  const [mode, setMode] = useState<'dictation' | 'translation'>('dictation');

  return (
    <Screen>
      <Appear>
        <NightHero
          scene="today"
          title={L('Luyện câu', 'Sentence practice')}
          sub={L(
            `Nghe rồi gõ lại nguyên văn, hoặc đọc một câu tiếng Việt rồi tự dịch sang tiếng Anh. ${dictationSetStats().sets + translationSetStats().sets} bài có chủ đề và ${DICTATION_SENTENCES.length + TRANSLATION_SENTENCES.length} câu lẻ để ôn rải.`,
            `Listen and type it back word for word, or read a Vietnamese sentence and translate it into English yourself. ${dictationSetStats().sets + translationSetStats().sets} topic sets and ${DICTATION_SENTENCES.length + TRANSLATION_SENTENCES.length} single sentences for spaced review.`,
          )}
          pills={[
            { icon: 'speaker', label: L(`${DICTATION_SENTENCES.length} câu chép chính tả`, `${DICTATION_SENTENCES.length} dictation sentences`) },
            { icon: 'book', label: L(`${TRANSLATION_SENTENCES.length} câu dịch`, `${TRANSLATION_SENTENCES.length} translation sentences`) },
            { icon: 'note', label: L(`${audioLibraryStats().items} bài nghe`, `${audioLibraryStats().items} listening tracks`) },
          ]}
          primary={{ label: L('Chép chính tả', 'Dictation'), onPress: () => setMode('dictation') }}
          secondary={{ label: L('Dịch câu', 'Translation'), onPress: () => setMode('translation') }}
        />
      </Appear>

      {/* Chọn kiểu luyện, rồi lộ trình + danh sách bài của kiểu đó (cùng một khung cho cả hai). */}
      <View className="mt-6 flex-row flex-wrap gap-3 self-start" accessibilityRole="tablist">
        {([
          ['dictation', L('Chép chính tả', 'Dictation'), 'speaker', dictation.sessions],
          ['translation', L('Dịch câu', 'Translation'), 'book', translation.sessions],
        ] as const).map(([key, label, icon, n]) => {
          const on = mode === key;
          return (
            <Pressable
              key={key}
              accessibilityRole="tab"
              aria-selected={on}
              onPress={() => setMode(key)}
              className="flex-row items-center gap-2 rounded-pill px-4"
              style={{ minHeight: 50, borderWidth: 2, borderColor: on ? '#2A22B5' : '#C9C2EE', backgroundColor: on ? '#2A22B5' : '#FFFFFF', ...(on ? ({ boxShadow: '0 4px 0 #1A1566' } as object) : null) }}
            >
              <NeonIcon name={icon} height={28} />
              <Text className="font-nun-heavy" style={{ fontSize: 15, color: on ? '#FFFFFF' : '#2B2350' }}>{label}</Text>
              {n > 0 ? <Text className="font-nun-strong" style={{ fontSize: 13, color: on ? 'rgba(255,255,255,0.85)' : '#6B6590' }}>{n}</Text> : null}
            </Pressable>
          );
        })}
      </View>
      <View className="mt-4">
        {mode === 'dictation' ? <DictationLibrary heading={false} /> : <TranslationLibrary />}
      </View>

      {/*
        Hai lối vào phụ, đặt ngay dưới hai thẻ chế độ: hai thẻ trên trả lời
        "luyện kiểu gì", hai thẻ này trả lời "luyện bằng gì" — câu hỏi tiếp theo
        trong đầu người dùng, nên chúng phải nằm đúng chỗ mắt đi tới.
      */}
      <Appear index={3}>
        <View className="mt-8 flex-row flex-wrap gap-4">
          <EntryCard
            icon="pencil"
            tint="accent"
            title={L('Tự diễn đạt', 'Write it your way')}
            body={L('Đọc nghĩa tiếng Việt, tự viết câu tiếng Anh, sửa lặp lại cho tới khi đúng và đúng cấu trúc.', 'Read the Vietnamese, write your own English, and revise until it is right.')}
            cta={L('Bắt đầu viết', 'Start writing')}
            onPress={() => router.push('/sentence/express' as never)}
          />
          <EntryCard
            icon="pencil"
            tint="accent"
            title={L('Dịch essay dài', 'Long essay translation')}
            body={L('Dịch bài văn dài và đoạn IELTS Reading (Cambridge) từng câu một, nhận góp ý sau mỗi câu.', 'Translate a 25-sentence text one sentence at a time with feedback.')}
            cta={L('Mở essay', 'Open essays')}
            onPress={() => router.push('/sentence/essay' as never)}
          />
          <EntryCard
            icon="play"
            tint="primary"
            title={L('Luyện đa dạng', 'Mixed drills')}
            body={L('Sắp xếp từ, điền từ, tìm lỗi sai — bài ngắn, chấm ngay.', 'Word order, gap fill and error spotting — short, instant feedback.')}
            cta={L('Làm bài', 'Start')}
            onPress={() => router.push('/sentence/mix' as never)}
          />
          <EntryCard
            icon="pencil"
            tint="primary"
            title={L('Viết cả đoạn', 'Paragraph writing')}
            body={L('Viết cả đoạn, nhận góp ý từng câu và nhận xét cả đoạn.', 'Write a paragraph and get feedback sentence by sentence.')}
            cta={L('Viết đoạn văn', 'Write a paragraph')}
            onPress={() => router.push('/sentence/paragraph' as never)}
          />
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
  icon: 'play' | 'volume' | 'pencil';
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
