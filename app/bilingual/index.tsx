import React, { useMemo } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { NightHero } from '@/components/catalog/NightHero';
import { Screen } from '@/components/layout/Screen';
import { Appear, CrossFade } from '@/components/motion/Motion';
import { ArticleFeed } from '@/components/bilingual/ArticleFeed';
import { MagazineList } from '@/components/bilingual/MagazineList';
import { Icon } from '@/components/ui';
import { NEON_PALETTES, NeonTile } from '@/components/neon/NeonTile';
import {
  BILINGUAL_LEVELS,
  BILINGUAL_OUTLETS,
  articlesOfOutlet,
  bilingualStats,
  type BilingualOutlet,
} from '@/data/bilingual-repository';
import { useReadingFonts } from '@/lib/readingFonts';
import { color } from '@/theme/tokens';
import { useL } from '@/i18n/useL';
import { bilingualTagline } from '@/components/bilingual/labels-en';

/**
 * Cổng "Đọc báo song ngữ".
 *
 * HAI TẦNG, như một sạp báo: chọn TỜ BÁO trước, rồi mới chọn BÀI. Bày 104 bài
 * lẫn lộn trên một lưới thì người học không có cách nào ước lượng giọng văn và
 * độ khó — một bài NASA viết cho nhà khoa học đứng cạnh một bài VOA viết cho
 * người mới học. Đi qua tờ báo, người học chọn được "hôm nay đọc cái dễ" hay
 * "hôm nay đọc cái thật".
 *
 * BẢN QUYỀN. Chỉ những nơi cho phép dùng lại toàn văn mới có mặt ở đây (xem
 * `BILINGUAL_OUTLETS`). Mỗi bài báo có link bài gốc trên đầu và ghi rõ giấy
 * phép ở cuối. Kho này MIỄN PHÍ cho mọi người — không nằm sau gói trả phí.
 *
 * Tờ báo đang chọn nằm trên URL (`?s=voa`), để gửi link cho bạn là mở đúng chỗ.
 *
 * THIẾT KẾ (26/09/2026): bỏ dáng "sạp báo giấy" cũ — viền đen 2px, bóng lệch đen,
 * nút sắp xếp chữ máy đánh — vì người dùng thấy giống IELTS Dictionary. Giờ dùng
 * đúng ngôn ngữ của Band 9: thẻ trắng bóng mềm, dấu vân vẽ từ dữ liệu (thanh phân
 * bố trình độ của tờ báo, cặp vạch Anh–Việt theo độ dài từng đoạn của bài).
 */

const INK = '#1E2748';
const MUTED = '#5A6485';

const SOFT_CARD = {
  borderWidth: 1,
  borderColor: '#F3F0FB',
  ...(Platform.OS === 'web'
    ? ({ boxShadow: '0 1px 2px rgba(15,23,42,0.05), 0 10px 26px rgba(94, 72, 35,0.08)' } as object)
    : { elevation: 2 }),
};


export default function BilingualPortalScreen() {
  useReadingFonts();
  const params = useLocalSearchParams<{ s?: string }>();
  const outletKey = typeof params.s === 'string' && BILINGUAL_OUTLETS.some((o) => o.key === params.s) ? params.s : null;
  const outlet = BILINGUAL_OUTLETS.find((o) => o.key === outletKey) ?? null;

  return (
    <Screen>
      <CrossFade swapKey={outlet ? `outlet-${outlet.key}` : 'portal'}>
        {outlet ? <OutletView outlet={outlet} /> : <PortalView />}
      </CrossFade>
    </Screen>
  );
}

/* ====================================================================== */
/*                                 TẦNG 1 — SẠP BÁO                        */
/* ====================================================================== */

function PortalView() {
  const { L } = useL();
  const stats = bilingualStats();
  return (
    <View>
      <Appear>
        <NightHero
          scene="path"
          title={L('Đọc báo song ngữ', 'Bilingual news')}
          sub={L(
            `${stats.articles} bài báo và bài phân tích, tiếng Anh nguyên văn đặt cạnh bản dịch. Rê chuột vào từ để xem nghĩa, ví dụ và từ đồng nghĩa.`,
            `${stats.articles} news stories and analyses, original English side by side with a Vietnamese translation. Hover over a word to see its meaning, examples and synonyms.`,
          )}
          pills={[
            { icon: 'book', label: L(`${stats.articles} bài báo`, `${stats.articles} articles`) },
            { icon: 'planet', label: L(`${BILINGUAL_OUTLETS.length} tờ báo`, `${BILINGUAL_OUTLETS.length} outlets`) },
            { icon: 'gift', label: L('100% miễn phí', '100% free') },
          ]}
        />
      </Appear>

      <Appear index={1}>
        <View className="mt-5">
          <NeonTile
            title={L('Kệ sách song ngữ', 'Bilingual bookshelf')}
            sub={L('Sách kiến thức, truyện và bản sách riêng của bạn', 'Nonfiction, stories and your own book files')}
            chip={L('SÁCH · TRUYỆN', 'BOOKS · STORIES')}
            icon="book"
            palette={NEON_PALETTES.sunset!}
            minHeight={150}
            onPress={() => router.push('/bilingual/books' as never)}
          />
        </View>
      </Appear>

      <Appear index={2}>
        <View className="mt-8">
          <ArticleFeed />
        </View>
      </Appear>

      <Appear index={3}>
        <Text className="font-sans" style={{ marginTop: 22, fontSize: 13, lineHeight: 20, color: INK, opacity: 0.75 }}>
          {L('Bài có giấy phép dùng lại, kèm link gốc.', 'Openly licensed articles, each linked to its source.')}
        </Text>
      </Appear>
    </View>
  );
}

/* ====================================================================== */
/*                              TẦNG 2 — MỘT TỜ BÁO                        */
/* ====================================================================== */

function OutletView({ outlet }: { outlet: BilingualOutlet }) {
  const { L, en } = useL();

  const all = useMemo(() => articlesOfOutlet(outlet.key), [outlet.key]);
  const levels = BILINGUAL_LEVELS.filter((l) => all.some((a) => a.level === l));

  return (
    <View>
      <Pressable
        accessibilityRole="link"
        onPress={() => router.setParams({ s: undefined })}
        className="self-start flex-row items-center gap-1.5 py-1"
      >
        <Icon name="chevron-left" size={16} color={INK} strokeWidth={2.2} />
        <Text className="font-semi" style={{ fontSize: 14, color: INK }}>
          {L('Tất cả tờ báo', 'All outlets')}
        </Text>
      </Pressable>

      {/* đầu báo */}
      <Appear>
        <View className="mt-3">
          <NightHero
            compact
            scene="path"
            title={outlet.name}
            sub={bilingualTagline(outlet.key, outlet.tagline, en)}
            pills={[
              { icon: 'book', label: L(`${all.length} bài`, `${all.length} articles`) },
              { icon: 'rocket', label: levels.length > 1 ? `${levels[0]!.split(' ')[0]} → ${levels[levels.length - 1]!.split(' ')[0]}` : (levels[0] ?? '—') },
            ]}
          />
        </View>
      </Appear>

      <View className="mt-5">
        <MagazineList articles={all} defaultSort={outlet.key === 'readup' ? 'easy' : 'new'} />
      </View>
    </View>
  );
}
