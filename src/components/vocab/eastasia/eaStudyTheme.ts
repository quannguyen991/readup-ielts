import { STUDY_THEMES, type StudyTheme } from '@/components/vocab/study/study-theme';

import { KIT } from './kit';
import { JA_MOTIF, ZH_MOTIF } from './motifs';
import type { EaSkin } from './skins';

/**
 * Chủ đề cho MÀN LÀM BÀI CON (học xen kẽ, trắc nghiệm, nghe chép, ghép cặp, bóng bay…) của bộ tiếng
 * Trung / Nhật: nền theo skin, thẻ màu ngà chữ tối (đọc rõ cả khi nền trang tối), nút chính và viền
 * theo màu nhấn của skin. Sinh từ skin nên đổi skin là mọi màn làm bài đổi theo.
 */
const cache = new Map<string, StudyTheme>();

export function eaStudyTheme(skin: EaSkin): StudyTheme {
  const hit = cache.get(skin.id);
  if (hit) return hit;
  const c = skin.c;
  const ja = skin.lang === 'ja';
  // Màu nút chính trên thẻ màu ngà: đủ đậm để chữ trắng đọc được.
  const hot = ({ 'ja-a': '#C4372B', 'ja-b': '#D9463A', 'ja-c': '#7C4DC4', 'zh-a': '#B3262E', 'zh-b': '#B8447F', 'zh-c': '#2F55C9' } as Record<string, string>)[skin.id] ?? '#B3262E';
  const ink = ja ? '#1F2A44' : '#4A0A12';
  const t: StudyTheme = {
    ...STUDY_THEMES['ea-skin'],
    id: 'ea-skin',
    vi: skin.name,
    en: skin.name,
    dark: false,
    fx: false,
    layer: 'none',
    skyBase: c.bg,
    skyStops: [c.bg],
    sky: c.bg,
    swatch: c.bg,
    card: '#FFF9EC',
    cardBorder: skin.dark ? c.accent : `${c.accent}99`,
    ink,
    muted: ja ? '#5D6B78' : '#7A4B3A',
    soft: '#FBF1DC',
    field: '#FFFDF7',
    fieldBorder: '#D9BE86',
    optBg: '#FFFDF7',
    optBorder: '#E3CC9A',
    optNum: '#FBF1DC',
    chipBg: '#F6E8C8',
    chipInk: ink,
    accent: hot,
    accentDisabled: '#E8D8C0',
    good: '#3F7A57',
    goodBg: '#E4F0E6',
    bad: '#B3262E',
    badBg: '#FBE3E0',
    warn: '#8A5E1C',
    onBg: c.ink,
    pill: c.panel,
    pillInk: c.ink,
    deco: { corner: ja ? JA_MOTIF.corner : ZH_MOTIF.corner, cloud: KIT[skin.lang].cloud, accent: c.accent },
  };
  cache.set(skin.id, t);
  return t;
}
