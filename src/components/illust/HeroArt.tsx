/**
 * Minh hoạ cho các khung dùng chung (30/09/2026: "thêm các icon vào các trang
 * tác vụ khác nữa"):
 *
 * - `HeroArt`: cụm 2–3 hình dễ thương cho khối đầu trang (`LightHero`), chọn
 *   theo chủ đề trang (`scene`), nhún nhẹ, lệch nhịp.
 * - `CuteFor(icon)`: một hình dễ thương ứng với tên biểu tượng của app
 *   (book → sách, volume → tai nghe…) cho đầu các trang tác vụ.
 * - `SealIcon`: huy hiệu viền răng cưa kiểu con dấu, trong là biểu tượng nét
 *   trắng — thay cho vòng tròn nhạt ở tiêu đề các mục.
 */
import { HEADER_ART_MIN } from '@/components/three/hero-star-policy';
import React from 'react';
import { View, useWindowDimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Icon, type IconName } from '@/components/ui/Icon';
import { Label, Sticker } from './Sticker';
import { CuteBook, CuteCalendar, CuteClock, CuteCloud, CuteGlobe, CutePencil, CuteTrain } from './Cute';
import { CuteBulb, CuteCalculator, CuteChat, CuteFlame, CuteHeadphones, CuteMagnifier, CuteMic, CuteNotebook, CutePlant, CuteRocket, CuteStar, CuteTrophy, Motion } from './CuteMore';
import { useL } from '@/i18n/useL';

type Art = (p: { size?: number }) => React.ReactElement;

const SCENES: Record<string, [Art, Art, Art]> = {
  home: [CuteGlobe, CuteBook, CutePencil],
  math: [CuteRocket, CuteCalculator, CuteStar],
  verbal: [CuteChat, CuteBook, CutePencil],
  vocab: [CuteBulb, CuteNotebook, CuteStar],
  progress: [CuteFlame, CuteTrophy, CuteCalendar],
  quest: [CuteGlobe, CuteTrain, CuteTrophy],
  shop: [CuteStar, CuteTrophy, CuteRocket],
  profile: [CuteStar, CuteBook, CuteFlame],
  writing: [CuteBulb, CutePencil, CuteNotebook],
  listening: [CuteMic, CuteHeadphones, CuteChat],
  speaking: [CuteMic, CuteChat, CuteTrophy],
  review: [CuteBulb, CuteMagnifier, CuteNotebook],
  duel: [CuteFlame, CuteRocket, CuteTrophy],
  settings: [CuteClock, CuteNotebook, CuteBulb],
  test: [CuteClock, CuteNotebook, CuteTrophy],
  garden: [CuteStar, CutePlant, CuteCloud],
  default: [CuteCloud, CuteBook, CutePencil],
};

const LABELS: Record<string, [string, string, string]> = {
  home: ['Học mỗi ngày!', '#F2B632', '#2A1B02'],
  math: ['Giải được hết!', '#22A06B', '#FFFFFF'],
  verbal: ['Đọc là hiểu!', '#B07A3A', '#FFFFFF'],
  vocab: ['+5 từ hôm nay', '#F472B6', '#FFFFFF'],
  progress: ['Cố lên! 💪', '#F0703F', '#FFFFFF'],
  quest: ['Lên đường! 🚆', '#22A06B', '#FFFFFF'],
  shop: ['Đổi quà! 🎁', '#F472B6', '#FFFFFF'],
  profile: ['Là bạn đó! ✨', '#A8843F', '#FFFFFF'],
  writing: ['Viết thật hay!', '#F2B632', '#2A1B02'],
  listening: ['Nghe kỹ nhé! 🎧', '#B07A3A', '#FFFFFF'],
  speaking: ['Nói to lên! 🎤', '#22A06B', '#FFFFFF'],
  review: ['Sai đâu sửa đó!', '#E0533D', '#FFFFFF'],
  duel: ['Thách đấu! ⚔️', '#F0703F', '#FFFFFF'],
  settings: ['Tuỳ chỉnh ⚙️', '#64748B', '#FFFFFF'],
  test: ['Thi thử nào! ⏱️', '#A8843F', '#FFFFFF'],
  garden: ['Tưới mỗi ngày 🌱', '#22A06B', '#FFFFFF'],
  default: ['Bắt đầu thôi!', '#F2B632', '#2A1B02'],
};

/** Chữ nhãn dán khi giao diện ở tiếng Anh (cùng khoá với `LABELS`). */
const LABELS_EN: Record<string, string> = {
  home: 'Learn every day!',
  math: 'You can solve it!',
  verbal: 'Read to understand!',
  vocab: '+5 words today',
  progress: 'Keep going! 💪',
  quest: 'All aboard! 🚆',
  shop: 'Treat yourself! 🎁',
  profile: "That's you! ✨",
  writing: 'Write it well!',
  listening: 'Listen closely! 🎧',
  speaking: 'Speak up! 🎤',
  review: 'Learn from mistakes!',
  duel: 'Challenge on! ⚔️',
  settings: 'Customize ⚙️',
  test: 'Mock test time! ⏱️',
  garden: 'Water daily 🌱',
  default: "Let's go!",
};

/** Các cụm minh hoạ có sẵn cho `HeroArt` / `PageStickers`. */
export type ArtScene = 'home' | 'math' | 'verbal' | 'vocab' | 'progress' | 'quest' | 'shop' | 'profile' | 'writing' | 'listening' | 'speaking' | 'review' | 'duel' | 'settings' | 'test' | 'garden' | 'default';

/**
 * Cụm STICKER cho khối đầu trang: 3 hình bế viền trắng, nghiêng lệch nhau,
 * nhún lệch nhịp, kèm một nhãn dán chữ. `size` = cỡ hình giữa.
 */
export function HeroArt({ scene, size = 104, single = false, label = true }: { scene?: string; size?: number; /** Chỉ hình giữa (điện thoại). */ single?: boolean; label?: boolean }) {
  const { en } = useL();
  const key = scene && SCENES[scene] ? scene : 'default';
  const [A, B, C] = SCENES[key]!;
  const [textVi, bg, ink] = LABELS[key]!;
  const text = en ? (LABELS_EN[key] ?? textVi) : textVi;
  if (single)
    return (
      <View aria-hidden>
        <Motion kind="float">
          <Sticker tilt={-8}>
            <B size={size} />
          </Sticker>
        </Motion>
      </View>
    );
  return (
    <View aria-hidden style={{ alignItems: 'center' }}>
      {label ? (
        <View style={{ marginBottom: -6, zIndex: 2 }}>
          <Motion kind="pop">
            <Label text={text} color={bg} ink={ink} tilt={-6} size={Math.round(size * 0.13)} />
          </Motion>
        </View>
      ) : null}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10 }}>
        <Motion kind="float" delay={0.5}>
          <Sticker tilt={-10}>
            <A size={size * 0.66} />
          </Sticker>
        </Motion>
        <Motion kind="float">
          <Sticker tilt={4}>
            <B size={size} />
          </Sticker>
        </Motion>
        <Motion kind="wobble" delay={0.25}>
          <Sticker tilt={12}>
            <C size={size * 0.66} />
          </Sticker>
        </Motion>
      </View>
    </View>
  );
}

/**
 * Cụm sticker gắn vào ĐẦU TRANG của những trang không dùng `LightHero`
 * (30/09/2026: "thêm các icon cả các phần khác nữa"): màn rộng 3 hình + nhãn,
 * điện thoại 1 hình nhỏ. Đặt ở góc phải hàng tiêu đề.
 */
export function PageStickers({ scene, size = 88, compact }: { scene: ArtScene; size?: number; /** Luôn chỉ 1 hình. */ compact?: boolean }) {
  const width = useWindowDimensions().width;
  // Máy tính bảng dựng đứng / điện thoại: không chen sticker vào hàng tiêu đề
  // (người dùng 01/10/2026: làm chữ xuống dòng không đẹp).
  if (width < HEADER_ART_MIN) return null;
  if (compact) return <HeroArt scene={scene} size={Math.round(size * 0.62)} single />;
  return <HeroArt scene={scene} size={size} />;
}

const BY_ICON: Partial<Record<IconName, Art>> = {
  book: CuteBook,
  letters: CuteNotebook,
  pencil: CutePencil,
  volume: CuteHeadphones,
  mic: CuteMic,
  play: CuteHeadphones,
  languages: CuteChat,
  chat: CuteChat,
  clock: CuteClock,
  calendar: CuteCalendar,
  trophy: CuteTrophy,
  target: CuteTrophy,
  flame: CuteFlame,
  trending: CuteRocket,
  gauge: CuteRocket,
  search: CuteMagnifier,
  compass: CuteTrain,
  leaf: CutePlant,
  star: CuteStar,
  sparkle: CuteStar,
  clipboard: CuteNotebook,
  note: CuteNotebook,
  bookmark: CuteBook,
  grid: CuteCalculator,
  flask: CuteBulb,
  gift: CuteStar,
};

/** Hình dễ thương ứng với một biểu tượng của app (không có thì null). */
export function CuteFor({ icon, size = 56, motion = 'float' }: { icon: IconName; size?: number; motion?: 'float' | 'wobble' | null }) {
  const I = BY_ICON[icon];
  if (!I) return null;
  if (!motion)
    return (
      <Sticker tilt={-6}>
        <I size={size} />
      </Sticker>
    );
  return (
    <Motion kind={motion}>
      <Sticker tilt={-6}>
        <I size={size} />
      </Sticker>
    </Motion>
  );
}

/** Đường viền con dấu 12 răng (khung 100 × 100). */
const SEAL = (() => {
  const pts: string[] = [];
  const n = 24;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0 ? 48 : 42;
    pts.push(`${(50 + Math.cos(a) * r).toFixed(1)} ${(50 + Math.sin(a) * r).toFixed(1)}`);
  }
  return `M ${pts.join(' L ')} Z`;
})();

/** Huy hiệu răng cưa màu đặc, biểu tượng nét trắng ở giữa. */
export function SealIcon({ name, color, size = 36 }: { name: IconName; color: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 100 100" style={{ position: 'absolute' }}>
        <Path d={SEAL} fill={color} />
      </Svg>
      {/* Bọc vị trí tương đối để nằm trên lớp SVG định vị tuyệt đối. */}
      <View style={{ position: 'relative' }}>
        <Icon name={name} size={size * 0.46} color="#FFFFFF" strokeWidth={2.4} />
      </View>
    </View>
  );
}
