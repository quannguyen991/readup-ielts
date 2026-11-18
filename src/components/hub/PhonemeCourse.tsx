import React, { useEffect, type ReactNode } from 'react';
import { Platform, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { CoinIcon, type CoinName } from '@/components/ui/CoinIcon';
import { Icon } from '@/components/ui/Icon';
import { useL } from '@/i18n/useL';
import { phonemeBySymbol } from '@/services/hub/phonemes';
import {
  LEVEL_LABEL,
  LEVEL_ORDER,
  currentStage,
  gridSections,
  levelOf,
  stageProgress,
  type PhonemeLevel,
} from '@/services/hub/phoneme-levels';

/**
 * Giao diện khoá phát âm — nhẹ, ít chữ (16/11/2026).
 * Phông: Inter (tiêu đề và chữ thường, bo tròn, thân thiện), Andika (ký hiệu IPA).
 * Ba phông này cùng được tải bởi `usePronounceFonts()`; đều có đủ dấu tiếng Việt, Andika có đủ ký hiệu IPA.
 */

export const PC = {
  ink: '#241F4D',
  muted: '#7A7499',
  line: 'rgba(36, 31, 77, 0.09)',
  teal: '#0E9AA7',
  purple: '#6A4BD9',
  display: 'Nunito, system-ui, sans-serif',
  body: 'Nunito, system-ui, sans-serif',
  ipa: 'Andika, Nunito, system-ui, sans-serif',
};

export const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Andika:wght@400;700&family=Inter:wght@400;600;700;800;900&display=swap';

/** Tải ba phông của khoá học và tắt luật ép Inter của khu hub trong lúc trang mở. */
export function useCourseFonts() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    if (!document.getElementById('pron-fonts')) {
      const link = document.createElement('link');
      link.id = 'pron-fonts';
      link.rel = 'stylesheet';
      link.href = FONT_HREF;
      document.head.appendChild(link);
    }
    const root = document.documentElement;
    root.classList.add('hub-own-font');
    return () => root.classList.remove('hub-own-font');
  }, []);
}

const LEVEL_COLOR: Record<PhonemeLevel, { dot: string; soft: string; text: string }> = {
  easy: { dot: '#22C55E', soft: '#E7F8EE', text: '#15803D' },
  medium: { dot: '#F59E0B', soft: '#FEF3DC', text: '#B45309' },
  hard: { dot: '#F43F5E', soft: '#FFE7EB', text: '#BE123C' },
};

const SOFT_SHADOW = { boxShadow: '0 6px 24px rgba(60, 40, 120, 0.08)' } as object;

/** Khối trắng bo tròn, bóng mềm, tiêu đề ngắn. */
export function SectionCard({ title, right, children }: { title: string; right?: ReactNode; children: ReactNode }) {
  return (
    <View style={{ marginTop: 18, padding: 18, borderRadius: 26, backgroundColor: '#FFFFFF', ...SOFT_SHADOW }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 14 }}>
        <Text style={{ fontFamily: PC.display, fontWeight: '400', fontSize: 21, color: PC.ink }}>{title}</Text>
        {right}
      </View>
      {children}
    </View>
  );
}

/** Chú giải ba màu độ khó (một hàng, không thêm chữ nào khác). */
export function LevelLegend() {
  const { L } = useL();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      {LEVEL_ORDER.map((lv) => (
        <View key={lv} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: LEVEL_COLOR[lv].dot }} />
          <Text style={{ fontFamily: PC.body, fontWeight: '600', fontSize: 13, color: PC.muted }}>{L(LEVEL_LABEL[lv].vi, LEVEL_LABEL[lv].en)}</Text>
        </View>
      ))}
    </View>
  );
}

/** Dải tiêu đề: tên khoá, thanh tiến độ và một nút luyện tiếp. */
export function PhonemeHero({ practiced, total, nextSymbol, onNext }: { practiced: number; total: number; nextSymbol?: string; onNext: () => void }) {
  const { L } = useL();
  const next = nextSymbol ? phonemeBySymbol(nextSymbol) : undefined;
  return (
    <LinearGradient
      colors={['#CDF2EE', '#E2DEFF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ borderRadius: 30, padding: 22, ...SOFT_SHADOW }}
    >
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <View style={{ flexShrink: 1, minWidth: 200 }}>
          <Text style={{ fontFamily: PC.display, fontWeight: '400', fontSize: 36, lineHeight: 40, color: PC.ink }}>{L('Luyện phát âm', 'Pronunciation')}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 }}>
            <View style={{ width: 160, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.7)', overflow: 'hidden' }}>
              <View style={{ width: `${(practiced / total) * 100}%`, height: 8, backgroundColor: PC.teal }} />
            </View>
            <Text style={{ fontFamily: PC.body, fontWeight: '700', fontSize: 15, color: PC.ink }}>{practiced}/{total}</Text>
          </View>
        </View>
        {next ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={L(`Luyện tiếp âm ${next.symbol}`, `Practise sound ${next.symbol}`)}
            onPress={onNext}
            style={{ height: 52, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 26, backgroundColor: PC.purple, boxShadow: '0 8px 20px rgba(106, 75, 217, 0.35)' } as object}
          >
            <Text style={{ fontFamily: PC.body, fontWeight: '700', fontSize: 15, color: '#FFFFFF' }}>{L('Luyện tiếp', 'Next')}</Text>
            <Text style={{ fontFamily: PC.ipa, fontWeight: '700', fontSize: 20, color: '#FFFFFF' }}>/{next.symbol}/</Text>
            <Icon name="chevron-right" size={18} color="#FFFFFF" />
          </Pressable>
        ) : null}
      </View>
    </LinearGradient>
  );
}

/** Lộ trình: ba ô Dễ / Vừa / Khó, ô đang học được tô nền. Chỉ còn tên mức và số âm. */
export function StageStrip({ best }: { best: Readonly<Record<string, number>> }) {
  const { L } = useL();
  const { width } = useWindowDimensions();
  const narrow = width < 720;
  const here = currentStage(best);
  return (
    <View style={{ flexDirection: 'row', flexWrap: narrow ? 'nowrap' : 'wrap', gap: narrow ? 8 : 10, marginTop: 18 }}>
      {LEVEL_ORDER.map((lv) => {
        const { done, total } = stageProgress(lv, best);
        const c = LEVEL_COLOR[lv];
        const active = lv === here;
        return (
          <View
            key={lv}
            style={{ flexGrow: 1, flexBasis: narrow ? 0 : 150, minWidth: 0, padding: narrow ? 10 : 14, borderRadius: 20, backgroundColor: active ? c.soft : '#FFFFFF', borderWidth: 1.5, borderColor: active ? c.dot : 'transparent', ...SOFT_SHADOW }}
          >
            <View style={{ flexDirection: narrow ? 'column' : 'row', alignItems: narrow ? 'flex-start' : 'center', justifyContent: 'space-between', gap: narrow ? 2 : 0 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                <View style={{ width: 11, height: 11, borderRadius: 6, backgroundColor: c.dot }} />
                <Text style={{ fontFamily: PC.display, fontWeight: '400', fontSize: 19, color: PC.ink }}>{L(LEVEL_LABEL[lv].vi, LEVEL_LABEL[lv].en)}</Text>
              </View>
              <Text style={{ fontFamily: PC.body, fontWeight: '700', fontSize: 14, color: active ? c.text : PC.muted }}>{done}/{total}</Text>
            </View>
            <View style={{ marginTop: 10, height: 6, borderRadius: 3, backgroundColor: active ? 'rgba(255,255,255,0.8)' : '#EFEBFA', overflow: 'hidden' }}>
              <View style={{ width: `${(done / total) * 100}%`, height: 6, backgroundColor: c.dot }} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

/** Thẻ âm: dải màu độ khó ở trên, ký hiệu IPA lớn, từ mẫu, loa, thanh điểm. Không có chip chữ. */
export function IpaCard({
  symbol,
  score,
  highlight,
  onOpen,
  onSpeak,
}: {
  symbol: string;
  score: number | undefined;
  highlight: boolean;
  onOpen: () => void;
  onSpeak: (word: string) => void;
}) {
  const { L } = useL();
  const p = phonemeBySymbol(symbol);
  if (!p) return null;
  const word = p.examples[0]![0];
  const level = levelOf(symbol);
  const c = LEVEL_COLOR[level];
  const barTone = score === undefined ? '#EFEBFA' : score >= 80 ? '#22C55E' : score >= 50 ? '#F59E0B' : '#F43F5E';
  // Nút loa là anh em (không lồng) với nút mở thẻ: HTML không cho <button> chứa <button>.
  return (
    <View
      style={{
        width: 92,
        borderRadius: 18,
        backgroundColor: highlight ? '#F4F0FF' : '#FBFAFF',
        borderWidth: 1.5,
        borderColor: highlight ? PC.purple : PC.line,
        overflow: 'hidden',
      }}
    >
      <View style={{ height: 5, backgroundColor: c.dot }} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={L(`Âm ${symbol}, ${LEVEL_LABEL[level].vi}${score !== undefined ? `, điểm tốt nhất ${score}` : ', chưa luyện'}`, `Sound ${symbol}, ${LEVEL_LABEL[level].en}${score !== undefined ? `, best ${score}` : ', not practised'}`)}
        onPress={onOpen}
        style={{ paddingHorizontal: 10, paddingTop: 8, paddingBottom: 10 }}
      >
        <Text style={{ fontFamily: PC.ipa, fontWeight: '700', fontSize: 30, lineHeight: 38, color: PC.ink }}>{symbol}</Text>
        <Text numberOfLines={1} style={{ fontFamily: PC.body, fontWeight: '500', fontSize: 13, color: PC.muted }}>{word}</Text>
        <View style={{ marginTop: 8, height: 4, borderRadius: 2, backgroundColor: '#EFEBFA', overflow: 'hidden' }}>
          <View style={{ width: `${Math.max(0, Math.min(100, score ?? 0))}%`, height: 4, backgroundColor: barTone }} />
        </View>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={L(`Nghe ${word}`, `Listen to ${word}`)}
        hitSlop={6}
        onPress={() => onSpeak(word)}
        style={{ position: 'absolute', top: 11, right: 6, width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' }}
      >
        <Icon name="volume" size={14} color={PC.teal} />
      </Pressable>
    </View>
  );
}

/** Lưới IPA: nguyên âm (dài/ngắn), nguyên âm đôi, phụ âm (vô thanh/hữu thanh/mũi & lỏng). */
export function IpaGrid({
  best,
  highlightSymbol,
  onOpen,
  onSpeak,
}: {
  best: Readonly<Record<string, number>>;
  highlightSymbol?: string;
  onOpen: (symbol: string) => void;
  onSpeak: (word: string) => void;
}) {
  const { L } = useL();
  const { width } = useWindowDimensions();
  const narrow = width < 720;
  return (
    <>
      {gridSections().map((section, idx) => (
        <SectionCard key={section.id} title={L(section.title, section.titleEn)} right={idx === 0 ? <LevelLegend /> : undefined}>
          <View style={{ gap: 12 }}>
            {section.rows.map((row) => (
              <View key={row.label || row.symbols.join('')} style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', gap: 10 }}>
                {row.label ? (
                  <Text
                    style={[
                      { fontFamily: PC.body, fontWeight: '600', fontSize: 13, color: PC.muted },
                      narrow ? { width: '100%' } : { width: 70, paddingTop: 12 },
                    ]}
                  >
                    {L(row.label, row.labelEn)}
                  </Text>
                ) : null}
                <View style={{ flex: 1, minWidth: 0, flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                  {row.symbols.map((symbol) => (
                    <IpaCard
                      key={symbol}
                      symbol={symbol}
                      score={best[symbol]}
                      highlight={symbol === highlightSymbol}
                      onOpen={() => onOpen(symbol)}
                      onSpeak={onSpeak}
                    />
                  ))}
                </View>
              </View>
            ))}
          </View>
        </SectionCard>
      ))}
    </>
  );
}

/** Ô thao tác gọn: biểu tượng + tên ngắn (không mô tả). */
export function ActionTile({ title, coin, badge, onPress }: { title: string; coin?: CoinName; badge?: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={{ flexGrow: 1, flexBasis: 150, minHeight: 64, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 18, backgroundColor: '#FBFAFF', borderWidth: 1.5, borderColor: PC.line }}
    >
      {coin ? <CoinIcon name={coin} size={38} /> : null}
      <View style={{ flex: 1, minWidth: 0 }}>
        {badge ? <Text style={{ fontFamily: PC.body, fontWeight: '700', fontSize: 13, color: '#BE123C' }}>{badge}</Text> : null}
        <Text style={{ fontFamily: PC.display, fontWeight: '700', fontSize: 16, lineHeight: 20, color: PC.ink }}>{title}</Text>
      </View>
    </Pressable>
  );
}
