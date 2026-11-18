import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import { Grid } from '@/components/layout/Grid';
import { Appear } from '@/components/motion/Motion';
import type { BookVocabBook } from '@/data/vocab-topics';
import { VOCAB_COVERS } from '@/data/vocab-covers';
import { ZH_COVERS } from './art';
import { HANZI_FAMILY, ZH } from './palette';
import { levelOfName } from './themes';
import { useChineseFonts } from './useChineseFonts';

/**
 * Nhãn cấp và màu nhấn cho từng bìa. Thứ tự khớp với thứ tự chủ đề của sách:
 * HSK 1 … HSK 6, rồi HSK 7–9 gộp một bìa.
 */
const LEVELS = [
  { hanzi: '一级', accent: '#2F4E7A' },
  { hanzi: '二级', accent: '#2E5F55' },
  { hanzi: '三级', accent: '#A8402E' },
  { hanzi: '四级', accent: '#A9701C' },
  { hanzi: '五级', accent: '#6B4A8A' },
  { hanzi: '六级', accent: '#2F7D6E' },
  { hanzi: '七至九级', accent: '#2C2F3D' },
] as const;

/** Các chế độ học của một bộ, hiện thành nhãn nhỏ dưới tên bộ (như thẻ giáo trình). */
const MODE_TAGS = ['Học xen kẽ', 'Ghép cặp', 'Nghe chép'] as const;

/** Tra cấp theo tên chủ đề ("HSK 4 · …", "HSK 7-9"); không đọc được thì theo thứ tự chủ đề. */
const LEVEL_BY_KEY: Record<string, (typeof LEVELS)[number]> = {
  '1': LEVELS[0],
  '2': LEVELS[1],
  '3': LEVELS[2],
  '4': LEVELS[3],
  '5': LEVELS[4],
  '6': LEVELS[5],
  '7-9': LEVELS[6],
};

function levelOf(name: string, index: number): (typeof LEVELS)[number] {
  const m = name.match(/HSK\s*(\d(?:-9)?)/);
  if (m && LEVEL_BY_KEY[m[1]!]) return LEVEL_BY_KEY[m[1]!]!;
  return LEVELS[Math.min(index, LEVELS.length - 1)] ?? LEVELS[0];
}

/**
 * Lưới bìa các bộ HSK (phong cách công bút): mỗi thẻ là một tấm ảnh phủ kín (tràn viền), chữ cấp đè trên ảnh,
 * phía dưới là tên bộ, số liệu và nhãn chế độ học. Bấm cả thẻ để vào.
 */
export function ZhBookCovers({ book }: { book: BookVocabBook }) {
  useChineseFonts();
  // Nhãn phiên bản lấy từ mã sách: "book-hsk-2-0-…" → HSK 2.0, "book-hsk-3-0" → HSK 3.0.
  const ver = book.slug.match(/hsk-(\d)-(\d)/);
  const version = ver ? `HSK ${ver[1]}.${ver[2]}` : 'HSK';
  return (
    <View style={{ gap: 18 }}>
      <Grid columns={3} tabletColumns={2} mobileColumns={1} gap={22}>
        {book.topics.map((topic, index) => {
          const level = levelOf(topic.nameVi, index);
          // Bìa riêng của chủ đề nếu có (VOCAB_COVERS, dạng đường dẫn); không có thì dùng bìa theo cấp.
          // Chưa có bìa riêng thì dùng bìa của cấp HSK (1…7), không theo thứ tự chủ đề (có tới 54 chủ đề).
          const lvl = levelOfName(topic.nameVi) ?? index + 1;
          const cover: number | { uri: string } = VOCAB_COVERS[topic.slug]
            ? { uri: VOCAB_COVERS[topic.slug]! }
            : (ZH_COVERS[Math.min(Math.max(lvl, 1), 7) - 1] ?? ZH_COVERS[0]!);
          return (
            <Appear key={topic.slug} index={Math.min(index, 8)}>
              <Pressable
                accessibilityRole="link"
                accessibilityLabel={`${topic.nameVi}, ${topic.words.length} từ`}
                onPress={() => router.push(`/vocabulary/book/${book.slug}/${topic.slug}` as never)}
                style={({ hovered, pressed }: { hovered?: boolean; pressed?: boolean }) => ({
                  borderRadius: 20,
                  overflow: 'hidden',
                  borderWidth: 1,
                  borderColor: hovered ? ZH.gold : ZH.line,
                  backgroundColor: ZH.card,
                  opacity: pressed ? 0.92 : 1,
                  transform: [{ scale: hovered ? 1.012 : 1 }],
                  ...(hovered ? ({ boxShadow: '0 16px 34px -16px rgba(92,64,22,0.42)' } as object) : null),
                })}
              >
                {/* Ảnh tràn kín khung: không viền trắng, không lề */}
                <View style={{ width: '100%', aspectRatio: 3 / 2, backgroundColor: ZH.cream2 }}>
                  <Image source={cover} contentFit="cover" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
                  <LinearGradient
                    pointerEvents="none"
                    colors={['rgba(15,29,51,0)', 'rgba(15,29,51,0.42)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '48%' }}
                  />

                  {/* Hàng trên: số từ (trái) và cấp HSK (phải) */}
                  <View pointerEvents="none" style={{ position: 'absolute', top: 14, left: 14, right: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ height: 28, paddingHorizontal: 12, borderRadius: 999, backgroundColor: 'rgba(15,29,51,0.62)', justifyContent: 'center' }}>
                      <Text className="font-strong text-label" style={{ color: '#FFFDF7' }}>
                        {topic.words.length.toLocaleString('vi-VN')} từ
                      </Text>
                    </View>
                    <View style={{ height: 28, paddingHorizontal: 12, borderRadius: 999, backgroundColor: '#FFFDF7', justifyContent: 'center' }}>
                      <Text className="font-heavy text-label" style={{ color: level.accent }}>
                        {version}
                      </Text>
                    </View>
                  </View>

                  {/* Nhãn chữ Hán ở giữa tranh, như dấu đóng trên bìa */}
                  <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: '36%', alignItems: 'center' }}>
                    <View
                      style={{
                        paddingHorizontal: 26,
                        height: 58,
                        borderRadius: 14,
                        backgroundColor: level.accent,
                        justifyContent: 'center',
                        borderWidth: 1,
                        borderColor: 'rgba(255,253,247,0.6)',
                      }}
                    >
                      <Text style={{ fontFamily: HANZI_FAMILY, fontSize: 30, letterSpacing: 3, color: '#FFFDF7' }}>{level.hanzi}</Text>
                    </View>
                  </View>
                </View>

                {/* Dưới ảnh: tên bộ, số liệu và các chế độ học, như thẻ giáo trình. Không có nút: bấm cả thẻ là vào. */}
                <View style={{ paddingTop: 16, paddingBottom: 18, paddingHorizontal: 18, gap: 6 }}>
                  <Text className="font-heavy text-cardTitle text-ink">{topic.nameVi}</Text>
                  <Text className="font-sans text-label text-muted">
                    {topic.words.length.toLocaleString('vi-VN')} từ · {topic.lessons.length} buổi học
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                    {MODE_TAGS.map((tag) => (
                      <View
                        key={tag}
                        style={{
                          height: 24,
                          paddingHorizontal: 10,
                          borderRadius: 999,
                          borderWidth: 1,
                          borderColor: ZH.line,
                          backgroundColor: ZH.cream2,
                          justifyContent: 'center',
                        }}
                      >
                        <Text className="font-strong text-label" style={{ color: ZH.ink2 }}>
                          {tag}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </Pressable>
            </Appear>
          );
        })}
      </Grid>
    </View>
  );
}
