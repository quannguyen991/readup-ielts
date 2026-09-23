import React, { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { Grid } from '@/components/layout/Grid';
import { Screen } from '@/components/layout/Screen';
import { Appear, PressScale } from '@/components/motion/Motion';
import { Card, Icon, StickerCard, type IconName } from '@/components/ui';
import { VOCAB_TOPICS, VOCAB_TOPIC_TOTALS, type VocabTopic } from '@/data/vocab-topics';
import { useVocabStore } from '@/store/useVocabStore';
import { notebookDeck, SAT_MATH_DECKS, type StudyDeck } from '@/data/study-decks';
import { color, gradient } from '@/theme/tokens';

/**
 * Màu + icon riêng cho từng chủ đề, phong cách "sticker" tham khảo từ The
 * IELTS Dictionary — mười cặp màu, mỗi cặp dùng cho đúng hai chủ đề, để các
 * thẻ cạnh nhau trong lưới không cùng màu.
 */
const TOPIC_STYLE: Record<string, { colors: readonly [string, string]; icon: IconName }> = {
  education: { colors: ['#C4ADF8', '#7C3AED'], icon: 'book' },
  environment: { colors: ['#6EE7A8', '#16A34A'], icon: 'leaf' },
  technology: { colors: ['#5EEAD4', '#0D9488'], icon: 'grid' },
  health: { colors: ['#93B4FD', '#2563EB'], icon: 'heart' },
  work: { colors: ['#FCD34D', '#D97706'], icon: 'briefcase' },
  society: { colors: ['#FCA5A5', '#DC2626'], icon: 'chat' },
  government: { colors: ['#A5B4FC', '#4F46E5'], icon: 'clipboard' },
  economy: { colors: ['#F9A8D4', '#DB2777'], icon: 'trending' },
  media: { colors: ['#67E8F9', '#0891B2'], icon: 'volume' },
  culture: { colors: ['#C4ADF8', '#7C3AED'], icon: 'sparkle' },
  family: { colors: ['#FDBA74', '#EA580C'], icon: 'home' },
  transport: { colors: ['#A5B4FC', '#4F46E5'], icon: 'compass' },
  tourism: { colors: ['#67E8F9', '#0891B2'], icon: 'compass' },
  'city-life': { colors: ['#5EEAD4', '#0D9488'], icon: 'building' },
  crime: { colors: ['#FCA5A5', '#DC2626'], icon: 'lock' },
  science: { colors: ['#93B4FD', '#2563EB'], icon: 'flask' },
  art: { colors: ['#F9A8D4', '#DB2777'], icon: 'sparkle' },
  sport: { colors: ['#FCD34D', '#D97706'], icon: 'trophy' },
  food: { colors: ['#FDBA74', '#EA580C'], icon: 'flame' },
  housing: { colors: ['#6EE7A8', '#16A34A'], icon: 'building' },
  money: { colors: ['#F9A8D4', '#DB2777'], icon: 'trending' },
  globalisation: { colors: ['#67E8F9', '#0891B2'], icon: 'compass' },
  language: { colors: ['#A5B4FC', '#4F46E5'], icon: 'languages' },
  children: { colors: ['#FDBA74', '#EA580C'], icon: 'sparkle' },
  elderly: { colors: ['#5EEAD4', '#0D9488'], icon: 'clock' },
  animals: { colors: ['#6EE7A8', '#16A34A'], icon: 'leaf' },
  space: { colors: ['#C4ADF8', '#7C3AED'], icon: 'target' },
  happiness: { colors: ['#FCA5A5', '#DC2626'], icon: 'heart' },
  history: { colors: ['#93B4FD', '#2563EB'], icon: 'bookmark' },
  energy: { colors: ['#FCD34D', '#D97706'], icon: 'gauge' },
};
const DEFAULT_TOPIC_STYLE = { colors: ['#93B4FD', '#2563EB'] as readonly [string, string], icon: 'grid' as IconName };

/**
 * Danh sách bộ từ vựng theo chủ đề.
 *
 * VÌ SAO MÀN NÀY TỒN TẠI: sổ từ của app chỉ đầy lên khi người học chạm vào từ
 * trong lúc đọc, nên ngày đầu tiên nó TRỐNG TRƠN — người mới vào thấy số 0 và
 * một dòng bảo họ đi chỗ khác trước đã. Năm mươi bộ này cho họ thứ để bắt đầu
 * ngay, và cho người sắp thi một danh sách rà theo chủ đề.
 *
 * Thẻ chủ đề hiện SỐ TỪ ĐÃ LƯU của chính người dùng, không chỉ tổng số từ có.
 * Biết mình đã học 12/50 từ chủ đề Môi trường là thông tin dùng được; biết chủ
 * đề đó có 50 từ thì không.
 */
export default function VocabTopicsScreen() {
  const entries = useVocabStore((s) => s.entries);
  const [query, setQuery] = useState('');

  // Đếm theo LEMMA đã lưu: người dùng có thể lưu cùng một từ từ một bài đọc
  // khác, và nó vẫn phải tính là đã học từ đó.
  const savedLemmas = useMemo(
    () => new Set(Object.values(entries).map((e) => e.lemma.toLowerCase())),
    [entries],
  );

  const notebook = useMemo(() => notebookDeck(Object.values(entries)), [entries]);

  const topics = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return VOCAB_TOPICS.filter(
      (t) =>
        !needle ||
        t.name.toLowerCase().includes(needle) ||
        t.nameVi.toLowerCase().includes(needle) ||
        t.blurb.toLowerCase().includes(needle),
    );
  }, [query]);

  if (VOCAB_TOPICS.length === 0) {
    return (
      <Screen>
        <Card>
          <Text className="font-strong text-cardTitle text-ink">Chưa có bộ từ nào</Text>
          <Text className="mt-1 font-sans text-body text-muted">
            Bộ từ theo chủ đề chưa được sinh vào bản dựng này. Chạy{' '}
            <Text className="font-strong text-ink">npm run vocab:topics</Text> rồi build lại.
          </Text>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      <Appear>
        <LinearGradient
          colors={[...gradient.hero]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 20, padding: 22 }}
        >
          <Text className="font-heavy text-white" style={{ fontSize: 28 }}>
            Từ vựng theo chủ đề
          </Text>
          <Text className="mt-2 font-sans text-body text-white/90" style={{ maxWidth: 560 }}>
            {VOCAB_TOPIC_TOTALS.topics} chủ đề hay ra trong đề IELTS,{' '}
            {VOCAB_TOPIC_TOTALS.words.toLocaleString('vi-VN')} từ. Mỗi từ có phiên âm, nghĩa tiếng
            Việt, một câu ví dụ và một collocation đi kèm.
          </Text>
        </LinearGradient>
      </Appear>

      <Appear index={1}>
        <View className="mt-4 flex-row flex-wrap gap-2">
          {['', 'Giáo dục', 'Môi trường', 'Công nghệ', 'Sức khoẻ'].map((tag) => (
            <PressScale key={tag || 'all'} onPress={() => setQuery(tag)}>
              <View
                className="rounded-pill border px-3 py-1.5"
                style={{
                  borderColor: query === tag ? color.primary : color.border,
                  backgroundColor: query === tag ? color.primarySoft : color.surface,
                }}
              >
                <Text
                  className={query === tag ? 'font-strong text-label' : 'font-sans text-label'}
                  style={{ color: query === tag ? color.primary : color.body }}
                >
                  {tag || 'Tất cả'}
                </Text>
              </View>
            </PressScale>
          ))}
        </View>
      </Appear>

      <View className="mt-4">
        <Grid columns={3} tabletColumns={2} mobileColumns={1}>
          {topics.map((topic, index) => (
            <Appear key={topic.slug} index={index + 2} style={{ height: '100%' }}>
              <TopicCard topic={topic} savedLemmas={savedLemmas} />
            </Appear>
          ))}
        </Grid>
      </View>

      {/* Các chế độ học (thẻ lật, Học, Nghe chép, Kiểm tra, Bóng bay…) chạy được
          trên mọi nguồn từ của app, không chỉ 50 bộ chủ đề. */}
      <Text className="mb-1 mt-8 font-heavy text-sectionTitle text-ink">Bộ học khác</Text>
      <Text className="mb-4 font-sans text-body text-muted">Sổ từ bạn tự lưu khi đọc, và thuật ngữ SAT Math theo từng mảng.</Text>
      <Grid columns={3} tabletColumns={2} mobileColumns={1}>
        {[notebook, ...SAT_MATH_DECKS].map((deck, i) => (
          <Appear key={deck.slug} index={i + 2} style={{ height: '100%' }}>
            <DeckCard deck={deck} colors={i === 0 ? ['#FCD34D', '#D97706'] : ['#93B4FD', '#4F46E5']} icon={i === 0 ? 'bookmark' : 'grid'} />
          </Appear>
        ))}
      </Grid>

      <View className="h-6" />
    </Screen>
  );
}

/** Thẻ một bộ học ngoài chủ đề IELTS. Sổ từ dưới 4 từ thì chưa học được (trắc nghiệm cần 4 lựa chọn). */
function DeckCard({ deck, colors, icon }: { deck: StudyDeck; colors: readonly [string, string]; icon: IconName }) {
  const ready = deck.words.length >= 4;
  return (
    <PressScale
      onPress={() => (ready ? router.push(`/vocabulary/topic/${deck.slug}` as never) : router.push('/read' as never))}
      style={{ height: '100%' }}
    >
      <StickerCard colors={colors} style={{ height: '100%' }}>
        <View className="h-11 w-11 items-center justify-center rounded-pill bg-white/90">
          <Icon name={icon} size={20} color={colors[1]} strokeWidth={1.9} />
        </View>
        <Text className="mt-3 font-heavy text-cardTitle text-white" numberOfLines={2}>
          {deck.nameVi}
        </Text>
        <Text className="mt-1.5 font-sans text-label text-white/85" numberOfLines={2}>
          {ready ? deck.blurb : 'Cần ít nhất 4 từ có nghĩa tiếng Việt. Chạm vào từ khi đọc bài để lưu.'}
        </Text>
        <Text className="mt-3 font-mid text-label text-white/90">{deck.words.length} từ</Text>
      </StickerCard>
    </PressScale>
  );
}

function TopicCard({ topic, savedLemmas }: { topic: VocabTopic; savedLemmas: Set<string> }) {
  const learned = topic.words.filter((w) => savedLemmas.has(w.word.toLowerCase())).length;
  const percent = topic.words.length ? Math.round((learned / topic.words.length) * 100) : 0;
  const style = TOPIC_STYLE[topic.slug] ?? DEFAULT_TOPIC_STYLE;

  return (
    <PressScale
      onPress={() => router.push(`/vocabulary/topic/${topic.slug}` as never)}
      style={{ height: '100%' }}
    >
      <StickerCard colors={style.colors} style={{ height: '100%' }}>
        <View className="flex-row items-start justify-between gap-2">
          <View className="h-11 w-11 items-center justify-center rounded-pill bg-white/90">
            <Icon name={style.icon} size={20} color={style.colors[1]} strokeWidth={1.9} />
          </View>
          {learned > 0 ? (
            <View className="rounded-pill bg-white/25 px-2.5 py-1">
              <Text className="font-strong text-label text-white">{percent}%</Text>
            </View>
          ) : null}
        </View>

        <Text className="mt-3 font-heavy text-cardTitle text-white" numberOfLines={1}>
          {topic.nameVi}
        </Text>
        <Text className="mt-1.5 font-sans text-label text-white/85" numberOfLines={2}>
          {topic.blurb}
        </Text>

        {/* Thanh tiến độ dùng chính con số đã lưu, không phải một ước lượng.
            Người học nhìn thấy 12/50 thì biết chính xác còn bao nhiêu. */}
        <View className="mt-3 h-1.5 overflow-hidden rounded-pill bg-white/25">
          <View style={{ width: `${percent}%`, height: '100%', backgroundColor: '#fff' }} />
        </View>
        <Text className="mt-1.5 font-mid text-label text-white/90">
          {learned}/{topic.words.length} từ đã lưu
        </Text>
      </StickerCard>
    </PressScale>
  );
}
