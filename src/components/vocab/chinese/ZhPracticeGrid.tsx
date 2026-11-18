import React from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import { Grid } from '@/components/layout/Grid';
import { Appear } from '@/components/motion/Motion';
import { ZH } from './palette';
import { ZH_V4 } from './v4';
import { LEVEL_THEME, type LevelFrames } from './levels';

/**
 * Các cách luyện của một bài, theo ảnh mẫu “Cách luyện”: thẻ kem viền vàng nhạt, medallion đám mây giữ icon,
 * tiêu đề đỏ có vạch đứng, mô tả, và nút đỏ “Bắt đầu →”. Góc dưới phải có nhãn dán hoa anh đào.
 * Mọi chữ dùng phông sans của app (không serif).
 */
type Mode = {
  key: string;
  route?: string;
  pinyin: string;
  label: string;
  desc: string;
  meta: string;
  /** Màu nhấn: phiên âm và viền khi rê chuột. */
  accent: string;
  recommended?: boolean;
};

const MODES: Mode[] = [
  {
    key: 'learn',
    label: 'Học xen kẽ',
    pinyin: 'xué xí',
    desc: 'Lật thẻ, chọn đáp án, gõ từ.',
    meta: 'Lật · ABCD · gõ từ',
    accent: '#8A5E1C',
    recommended: true,
  },
  {
    key: 'abcd',
    label: 'Trắc nghiệm',
    pinyin: 'cè shì',
    desc: '20 câu trộn ba dạng.',
    meta: '20 câu · 4 đáp án',
    accent: '#A8322A',
  },
  {
    key: 'listen',
    route: 'abcd?mode=listen',
    label: 'Luyện nghe',
    pinyin: 'tīng',
    desc: 'Nghe, rồi chọn nghĩa đúng.',
    meta: 'Nghe · chọn nghĩa',
    accent: '#B5561C',
  },
  {
    key: 'speak',
    label: 'Luyện nói',
    pinyin: 'shuō',
    desc: 'Đọc to, máy chấm phát âm.',
    meta: 'Đọc to · chấm điểm',
    accent: '#7A5A1E',
  },
  {
    key: 'dictation',
    label: 'Nghe chép',
    pinyin: 'xiě',
    desc: 'Nghe và gõ đúng chữ Hán.',
    meta: 'Nghe · viết chữ',
    accent: '#8A2B3B',
  },
  {
    key: 'cloze',
    label: 'Điền câu',
    pinyin: 'tián',
    desc: 'Chọn chữ điền vào chỗ trống.',
    meta: 'Điền chỗ trống',
    accent: '#A0442E',
  },
  {
    key: 'pairs',
    label: 'Ghép cặp',
    pinyin: 'pèi',
    desc: 'Ghép chữ với nghĩa.',
    meta: 'Ghép 8 cặp',
    accent: '#8B2A4A',
  },
  {
    key: 'test',
    label: 'Kiểm tra',
    pinyin: 'shì',
    desc: 'Bài kiểm tra 20 câu.',
    meta: '20 câu · chấm khi nộp',
    accent: '#6B1E1E',
  },
  {
    key: 'game',
    label: 'Bóng bay',
    pinyin: 'qiú',
    desc: 'Bắt bóng đúng từ.',
    meta: 'Bóng bay · bảng điểm',
    accent: '#B0392A',
  },
];

const WEB = Platform.OS === 'web';

/** Bóng đổ khi rê chuột (chỉ web). */
function hoverShadow(hovered: boolean): object | null {
  return hovered && WEB ? ({ boxShadow: '0 20px 36px -22px rgba(92,64,22,0.45), 0 2px 6px rgba(92,64,22,0.06)' } as object) : null;
}

/** Nút “Bắt đầu →” kiểu ảnh mẫu: đỏ chuyển sắc, viền vàng nhạt, chữ kem. */
function StartButton({ accent }: { accent: string }) {
  return (
    <LinearGradient
      colors={[accent, '#4A1A24']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ height: 36, paddingHorizontal: 18, borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: ZH.gold2 }}
    >
      <Text className="font-heavy text-label" style={{ color: '#FFF6E8' }}>
        Bắt đầu
      </Text>
      <Text className="font-heavy text-label" style={{ color: '#FFF6E8' }}>
        →
      </Text>
    </LinearGradient>
  );
}

export function ZhPracticeGrid({
  slug,
  wide,
  accent = ZH.seal,
  frames = LEVEL_THEME[1]!.frames,
}: {
  slug: string;
  wide: boolean;
  accent?: string;
  frames?: LevelFrames;
}) {
  const medal = wide ? 112 : 76;

  return (
    <View style={{ gap: 18 }}>
      {/* Đầu mục: con dấu đỏ và tên “Cách luyện” ở hàng trên; vạch hoa văn và nhãn số cách ở hàng dưới */}
      <View style={{ gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Image source={frames.seal} contentFit="contain" style={{ width: wide ? 54 : 44, height: wide ? 54 : 44 }} />
          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <Text className="font-heavy text-sectionTitle" style={{ color: ZH.onPage }}>
              Cách luyện
            </Text>
            <Text className="font-sans text-label" style={{ color: ZH.onPageSoft }}>
              Chọn một cách để học; đổi qua lại bất cứ lúc nào.
            </Text>
          </View>
        </View>
      </View>

      <Grid columns={3} tabletColumns={2} mobileColumns={1} gap={16}>
        {MODES.map((m, i) => (
          <Appear key={m.key} index={Math.min(i, 8)}>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={`${m.label}, ${m.meta}`}
              onPress={() => router.push(`/vocabulary/topic/${slug}/${m.route ?? m.key}` as never)}
              style={({ hovered, pressed }: { hovered?: boolean; pressed?: boolean }) => ({
                borderRadius: 22,
                borderWidth: 1.5,
                borderColor: hovered ? m.accent : '#E3C48E',
                backgroundColor: '#FFFAF2',
                overflow: 'visible',
                opacity: pressed ? 0.94 : 1,
                transform: [{ translateY: hovered ? -3 : 0 }],
                ...(WEB ? ({ transition: 'transform 200ms ease, box-shadow 200ms ease, border-color 200ms ease' } as object) : null),
                ...(hoverShadow(!!hovered) ?? {}),
              })}
            >
              {/* Nhãn dán hoa anh đào ở góc dưới phải, như góc khung của ảnh mẫu */}
              <View pointerEvents="none" style={{ position: 'absolute', right: -3, bottom: -3 }}>
                {/* Góc được vẽ ở kiểu trên-trái, nên xoay 180° để nằm đúng ở góc dưới-phải */}
                <Image source={frames.corner} contentFit="contain" style={{ width: wide ? 70 : 54, height: wide ? 70 : 54, opacity: 0.92, transform: [{ scaleX: -1 }, { scaleY: -1 }] }} />
              </View>

              <View style={{ flexDirection: 'row', alignItems: wide ? 'center' : 'flex-start', padding: wide ? 18 : 14, gap: wide ? 16 : 12 }}>
                {/* Medallion đám mây giữ icon cách luyện */}
                <View style={{ width: medal, height: medal, alignItems: 'center', justifyContent: 'center' }}>
                  <Image source={frames.cloud} contentFit="contain" style={{ position: 'absolute', width: medal, height: medal }} />
                  <Image source={ZH_V4.icon[m.key]} contentFit="contain" style={{ width: medal * 0.5, height: medal * 0.5 }} />
                </View>

                <View style={{ flex: 1, alignSelf: 'stretch', minWidth: 0, gap: 6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <View style={{ width: 4, height: 20, borderRadius: 2, backgroundColor: accent }} />
                    <Text className="font-heavy text-body" style={{ color: accent }}>
                      {m.label}
                    </Text>
                    {m.recommended ? (
                      <View style={{ height: 22, paddingHorizontal: 9, borderRadius: 999, backgroundColor: ZH.ink, justifyContent: 'center' }}>
                        <Text className="font-heavy text-label" style={{ color: '#FFF6E8' }}>
                          GỢI Ý
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <Text className="font-sans text-label" style={{ color: m.accent }}>
                    {m.pinyin}
                  </Text>
                  <Text className="font-sans text-label" style={{ color: ZH.ink2 }}>
                    {m.desc}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                    <StartButton accent={accent} />
                  </View>
                </View>
              </View>
            </Pressable>
          </Appear>
        ))}
      </Grid>
    </View>
  );
}
