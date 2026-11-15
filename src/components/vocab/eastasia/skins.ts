import type { EaLang } from '@/data/learning-path/east-asian';

import { JA_UI, ZH_UI } from './ui';

/**
 * GIAO DIỆN (skin) cho màn Tiếng Trung / Tiếng Nhật. Mỗi skin là một "thế giới" riêng:
 * tranh nền lớn, bảng màu, phông chữ Hán. Người học chọn skin ngay trên màn lộ trình;
 * lựa chọn được nhớ theo từng tiếng (xem `useEaSkin`).
 *
 * Tranh nền do Codex sinh, nằm trong assets/east-asian/v6/hero/. Họa tiết bóc tách
 * (hạc, sóng, mây, hoa…) dùng chung mọi skin: xem `motifs.ts`.
 */
export type EaSkin = {
  id: string;
  lang: EaLang;
  /** Tên hiển thị. */
  name: string;
  /** Chữ Hán làm tiêu đề lớn của skin. */
  han: string;
  /** Mô tả một câu. */
  blurb: string;
  hero: number;
  /** Ảnh nhỏ (640px) cho thẻ chọn skin, thẻ lối vào, nền thẻ: nhẹ hơn nhiều so với `hero`. */
  thumb: number;
  /** Phông chữ Hán (CSS font-family, trên web). */
  fontHan: string;
  /** Link Google Fonts của phông Hán (không subset để giữ chữ Hán). */
  fontHref: string;
  dark: boolean;
  /** Thanh bên khi người học đang ở khu Trung/Nhật. `art` là tranh dưới đáy (nếu có). */
  sidebar: {
    dark: boolean;
    bg: string;
    border: string;
    text: string;
    muted: string;
    active: string;
    activeGradient: string;
    activeText: string;
    art?: number;
  };
  c: {
    /** Nền trang. */
    bg: string;
    /** Nền thẻ (có độ trong). */
    panel: string;
    panelSolid: string;
    border: string;
    /** Chữ chính / phụ. */
    ink: string;
    ink2: string;
    /** Màu nhấn chính và phụ. */
    accent: string;
    accent2: string;
    /** Chữ đặt trên nền accent. */
    onAccent: string;
    /** Lớp phủ tranh hero: đậm nhất → trong suốt (từ trái sang phải). */
    wash: [string, string, string];
    /** Màu chữ và thẻ chip TRÊN hero (hero tối nên chữ sáng, kể cả khi trang nền sáng). */
    heroInk: string;
    heroInk2: string;
    heroPanel: string;
  };
};

const gf = (family: string) => `https://fonts.googleapis.com/css2?family=${family}&display=swap`;

export const EA_SKINS: readonly EaSkin[] = [
  {
    id: 'ja-a',
    lang: 'ja',
    name: 'Dạ Nguyệt Hạc',
    han: '夜月鶴',
    blurb: 'Đêm trăng vàng, hạc bay trên sóng seigaiha.',
    hero: require('../../../../assets/east-asian/v6/hero/ja-a-dagetsu.webp') as number,
    thumb: require('../../../../assets/east-asian/v6/hero/thumbs/ja-a-dagetsu.webp') as number,
    fontHan: "'Shippori Mincho B1', serif",
    fontHref: gf('Shippori+Mincho+B1:wght@500;800'),
    dark: true,
    sidebar: { dark: true, bg: '#0f1334', border: 'rgba(233,196,106,0.35)', text: '#fff6dc', muted: 'rgba(255,246,220,0.7)', active: '#e9c46a',
      activeGradient: 'linear-gradient(100deg, #f0d27e 0%, #e9c46a 100%)', activeText: '#1a1a3a', art: (JA_UI as Record<string, number>).sidebar },
    c: {
      bg: '#0f1334', panel: 'rgba(22,27,72,0.82)', panelSolid: '#161b48', border: 'rgba(233,196,106,0.38)',
      ink: '#fff6dc', ink2: '#c9c6e6', accent: '#e9c46a', accent2: '#f4b6c2', onAccent: '#1a1a3a',
      wash: ['rgba(10,12,40,0.94)', 'rgba(10,12,40,0.55)', 'rgba(10,12,40,0)'],
      heroInk: '#fff6dc', heroInk2: '#c9c6e6', heroPanel: 'rgba(22,27,72,0.82)',
    },
  },
  {
    id: 'ja-b',
    lang: 'ja',
    name: 'Phù Thế Họa Fuji',
    han: '浮世絵',
    blurb: 'Tranh khắc gỗ trên giấy washi, núi Phú Sĩ và cổng torii.',
    hero: (JA_UI as Record<string, number>).hero ?? (require('../../../../assets/east-asian/v6/hero/ja-b-ukiyoe.webp') as number),
    thumb: require('../../../../assets/east-asian/v6/hero/thumbs/ja-hero2.webp') as number,
    fontHan: "'Zen Antique', serif",
    fontHref: gf('Zen+Antique'),
    dark: false,
    sidebar: { dark: true, bg: '#13214B', border: 'rgba(233,196,106,0.4)', text: '#FFF6DC', muted: 'rgba(255,246,220,0.72)', active: '#D9463A',
      activeGradient: 'linear-gradient(100deg, #E2574A 0%, #B8302A 100%)', activeText: '#FFFFFF', art: (JA_UI as Record<string, number>).sidebar },
    c: {
      bg: '#f3e7c9', panel: 'rgba(252,244,222,0.9)', panelSolid: '#fbf2da', border: 'rgba(63,143,154,0.4)',
      ink: '#2b3a4a', ink2: '#5d6b78', accent: '#d9463a', accent2: '#3f8f9a', onAccent: '#fff7e6',
      wash: ['rgba(10,22,58,0.9)', 'rgba(10,22,58,0.55)', 'rgba(10,22,58,0)'],
      heroInk: '#FFF6DC', heroInk2: 'rgba(255,246,220,0.85)', heroPanel: 'rgba(14,26,66,0.55)',
    },
  },
  {
    id: 'ja-c',
    lang: 'ja',
    name: 'Tử Đằng Mộng',
    han: '藤夢',
    blurb: 'Kyoto trong sương tím, tháp chùa, lồng đèn và hoa tử đằng.',
    hero: require('../../../../assets/east-asian/v6/hero/ja-c-fuji-mong.webp') as number,
    thumb: require('../../../../assets/east-asian/v6/hero/thumbs/ja-c-fuji-mong.webp') as number,
    fontHan: "'Yuji Syuku', serif",
    fontHref: gf('Yuji+Syuku'),
    dark: true,
    sidebar: { dark: true, bg: '#241747', border: 'rgba(203,182,242,0.4)', text: '#fbf4ff', muted: 'rgba(251,244,255,0.7)', active: '#e8c77a',
      activeGradient: 'linear-gradient(100deg, #f2a5c8 0%, #e8c77a 100%)', activeText: '#241747' },
    c: {
      bg: '#241747', panel: 'rgba(48,30,96,0.82)', panelSolid: '#301e60', border: 'rgba(203,182,242,0.42)',
      ink: '#fbf4ff', ink2: '#d6c8f0', accent: '#e8c77a', accent2: '#f2a5c8', onAccent: '#241747',
      wash: ['rgba(30,18,66,0.93)', 'rgba(30,18,66,0.55)', 'rgba(30,18,66,0)'],
      heroInk: '#fbf4ff', heroInk2: '#d6c8f0', heroPanel: 'rgba(48,30,96,0.82)',
    },
  },
  {
    id: 'zh-a',
    lang: 'zh',
    name: 'Hồng Kim Cẩm Tú',
    han: '红金锦绣',
    blurb: 'Nền đỏ thêu chỉ vàng, núi vàng, trăng lớn và hạc.',
    hero: (ZH_UI as Record<string, number>).hero ?? (require('../../../../assets/east-asian/v6/hero/zh-a-hongkim.webp') as number),
    thumb: require('../../../../assets/east-asian/v6/hero/thumbs/zh-hero2.webp') as number,
    fontHan: "'Ma Shan Zheng', cursive",
    fontHref: gf('Ma+Shan+Zheng'),
    dark: true,
    sidebar: { dark: false, bg: '#F3E7CF', border: 'rgba(142,100,40,0.35)', text: '#4A0A12', muted: '#7A4B3A', active: '#8E1420',
      activeGradient: 'linear-gradient(100deg, #A31B27 0%, #7A0F18 100%)', activeText: '#FFF1D0', art: (ZH_UI as Record<string, number>).sidebar },
    c: {
      bg: '#4a0a12', panel: 'rgba(112,14,26,0.84)', panelSolid: '#6e0e18', border: 'rgba(230,194,122,0.4)',
      ink: '#fff1d0', ink2: '#f0c9a8', accent: '#e6c27a', accent2: '#ff8a7a', onAccent: '#4a0a12',
      wash: ['rgba(80,8,16,0.95)', 'rgba(80,8,16,0.55)', 'rgba(80,8,16,0)'],
      heroInk: '#fff1d0', heroInk2: '#f0c9a8', heroPanel: 'rgba(112,14,26,0.84)',
    },
  },
  {
    id: 'zh-b',
    lang: 'zh',
    name: 'Liên Mộng',
    han: '莲梦',
    blurb: 'Sen hồng, cá chép vàng và cuộn tranh lụa dưới trăng khuyết.',
    hero: require('../../../../assets/east-asian/v6/hero/zh-b-lien-hoa.webp') as number,
    thumb: require('../../../../assets/east-asian/v6/hero/thumbs/zh-b-lien-hoa.webp') as number,
    fontHan: "'ZCOOL XiaoWei', serif",
    fontHref: gf('ZCOOL+XiaoWei'),
    dark: true,
    sidebar: { dark: true, bg: '#2c2060', border: 'rgba(240,141,184,0.4)', text: '#f7f1ff', muted: 'rgba(247,241,255,0.7)', active: '#f08db8',
      activeGradient: 'linear-gradient(100deg, #f08db8 0%, #b9a6f0 100%)', activeText: '#2a1450' },
    c: {
      bg: '#2c2060', panel: 'rgba(54,40,120,0.82)', panelSolid: '#352878', border: 'rgba(240,141,184,0.42)',
      ink: '#f7f1ff', ink2: '#cfc4ee', accent: '#f08db8', accent2: '#54d1c3', onAccent: '#2a1450',
      wash: ['rgba(36,26,88,0.92)', 'rgba(36,26,88,0.52)', 'rgba(36,26,88,0)'],
      heroInk: '#f7f1ff', heroInk2: '#cfc4ee', heroPanel: 'rgba(54,40,120,0.82)',
    },
  },
  {
    id: 'zh-c',
    lang: 'zh',
    name: 'Dạ Cung',
    han: '夜宫',
    blurb: 'Cung điện vàng, mây tường vân và sóng xanh dưới trời sao.',
    hero: require('../../../../assets/east-asian/v6/hero/zh-c-da-cung.webp') as number,
    thumb: require('../../../../assets/east-asian/v6/hero/thumbs/zh-c-da-cung.webp') as number,
    fontHan: "'Noto Serif SC', serif",
    fontHref: gf('Noto+Serif+SC:wght@500;900'),
    dark: true,
    sidebar: { dark: true, bg: '#0e1b4a', border: 'rgba(242,213,138,0.4)', text: '#f2f6ff', muted: 'rgba(242,246,255,0.7)', active: '#f2d58a',
      activeGradient: 'linear-gradient(100deg, #f7e3a8 0%, #f2d58a 100%)', activeText: '#0e1b4a' },
    c: {
      bg: '#0e1b4a', panel: 'rgba(16,32,88,0.84)', panelSolid: '#122058', border: 'rgba(242,213,138,0.4)',
      ink: '#f2f6ff', ink2: '#b9c6ee', accent: '#f2d58a', accent2: '#5ed0e0', onAccent: '#0e1b4a',
      wash: ['rgba(8,16,52,0.93)', 'rgba(8,16,52,0.5)', 'rgba(8,16,52,0)'],
      heroInk: '#f2f6ff', heroInk2: '#b9c6ee', heroPanel: 'rgba(16,32,88,0.84)',
    },
  },
];

export const skinsOf = (lang: EaLang): EaSkin[] => EA_SKINS.filter((s) => s.lang === lang);
/** Skin mặc định khi người học chưa chọn: đúng hai bản thiết kế đã duyệt. */
export const DEFAULT_SKIN: Record<EaLang, string> = { ja: 'ja-b', zh: 'zh-a' };

export const skinById = (id: string | null | undefined, lang: EaLang): EaSkin => skinsOf(lang).find((s) => s.id === id) ?? skinsOf(lang).find((s) => s.id === DEFAULT_SKIN[lang]) ?? skinsOf(lang)[0]!;
