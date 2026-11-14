import { themedHex } from '@/theme/palette-state';
import React, { useEffect, useMemo } from 'react';
import { Platform, View } from 'react-native';

import type { EffectLook } from '@/services/gamification/shop';
import { mulberry32 } from '@/services/questions/rng';
import { useRewardStore } from '@/store/useRewardStore';
import { color } from '@/theme/tokens';
import { useHydrated } from './useHydrated';

export type SidebarThemeConfig = {
  id: string;
  name: string;
  isDark: boolean;
  bgStyle: object;
  borderRightColor: string;
  textPrimary: string;
  textMuted: string;
  activeFill: string;
  activeGradient: string;
  activeTextColor: string;
  activeGlow: string;
  hoverBg: string;
  defaultEffect: EffectLook | null;
};

export const DEFAULT_SIDEBAR_THEME: SidebarThemeConfig = {
  id: 'default',
  name: 'Mặc định (Band 9)',
  isDark: false,
  bgStyle: { backgroundColor: '#F3EEFB', backgroundImage: 'linear-gradient(180deg, #F5F0FF 0%, #EEF6F3 50%, #F3F0FB 100%)' },
  borderRightColor: '#E2D9F3',
  textPrimary: '#2B2350',
  textMuted: '#7A72A0',
  activeFill: themedHex('#8B6CF0'),
  activeGradient: 'linear-gradient(100deg, #8B6CF0 0%, #E8708A 52%, #FF9C5B 100%)',
  activeTextColor: '#FFFFFF',
  activeGlow: '0 6px 18px rgba(139,108,240,0.35), inset 0 1px 0 rgba(255,255,255,0.45)',
  hoverBg: 'rgba(139, 108, 240, 0.12)',
  defaultEffect: null,
};

/**
 * Thanh bên TRONG SUỐT cho màn học đang dùng nền cảnh bay: không nền, không viền,
 * chỉ còn biểu tượng trắng nổi trên cảnh thành phố (người dùng yêu cầu 30/09).
 */
export const GLASS_SIDEBAR_THEME: SidebarThemeConfig = {
  id: 'glass',
  name: 'Trong suốt',
  isDark: true,
  bgStyle: { backgroundColor: 'transparent' },
  borderRightColor: 'transparent',
  textPrimary: '#FFFFFF',
  textMuted: 'rgba(255,255,255,0.82)',
  activeFill: 'rgba(255,255,255,0.22)',
  activeGradient: 'linear-gradient(100deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.16) 100%)',
  activeTextColor: '#FFFFFF',
  activeGlow: '0 4px 14px rgba(0,0,0,0.25)',
  hoverBg: 'rgba(255,255,255,0.12)',
  defaultEffect: null,
};

export const SIDEBAR_THEMES: Record<string, SidebarThemeConfig> = {
  default: DEFAULT_SIDEBAR_THEME,
  'theme-chiikawa': {
    id: 'theme-chiikawa',
    name: 'Chiikawa · Góc học hồng',
    isDark: false,
    bgStyle: { backgroundColor: '#FFF8FA', backgroundImage: 'linear-gradient(180deg, #FFFBFC 0%, #FCEAF0 100%)' },
    borderRightColor: '#F4C7D5',
    textPrimary: '#49313E',
    textMuted: '#805E6D',
    activeFill: '#C64E79',
    activeGradient: 'linear-gradient(100deg, #E78EAA 0%, #D65E86 55%, #BD416C 100%)',
    activeTextColor: '#FFFFFF',
    activeGlow: '0 6px 18px rgba(198,90,120,0.28), inset 0 1px 0 rgba(255,255,255,0.38)',
    hoverBg: 'rgba(217, 127, 155, 0.14)',
    defaultEffect: 'sakura',
  },
  'theme-cyber': {
    id: 'theme-cyber',
    name: 'Cyber · Neon xanh',
    isDark: true,
    bgStyle: { backgroundColor: '#1A2F55', backgroundImage: 'linear-gradient(180deg, #0E1B33 0%, #1A2F55 100%)' },
    borderRightColor: '#2A4A75',
    textPrimary: '#F3F8FF',
    textMuted: '#8FA6C4',
    activeFill: '#4C8DFF',
    activeGradient: 'linear-gradient(100deg, #4C8DFF 0%, #1E4FD1 100%)',
    activeTextColor: '#FFFFFF',
    activeGlow: '0 0 0 1px rgba(61,217,245,0.40), 0 8px 22px -10px rgba(61,217,245,0.55)',
    hoverBg: 'rgba(120, 200, 255, 0.10)',
    defaultEffect: null,
  },
  'theme-pixel': {
    id: 'theme-pixel',
    name: 'Pixel · Y2K tím',
    isDark: false,
    bgStyle: { backgroundColor: '#E9DDFF', backgroundImage: 'linear-gradient(180deg, #C8B6FF 0%, #E9DDFF 100%)' },
    borderRightColor: '#2B1B4E',
    textPrimary: '#2B1B4E',
    textMuted: '#6B5A8E',
    activeFill: '#9D7BFF',
    activeGradient: 'linear-gradient(100deg, #FF8FC7 0%, #9D7BFF 100%)',
    activeTextColor: '#FFFFFF',
    activeGlow: '3px 3px 0 #2B1B4E',
    hoverBg: 'rgba(157, 123, 255, 0.16)',
    defaultEffect: null,
  },
  'theme-midnight': {
    id: 'theme-midnight',
    name: 'Vũ trụ sao đêm',
    isDark: true,
    bgStyle: {
      backgroundColor: '#090D1A',
      backgroundImage: 'linear-gradient(180deg, #0D1322 0%, #070913 100%)',
    },
    borderRightColor: 'rgba(56, 189, 248, 0.2)',
    textPrimary: '#F8FAFC',
    textMuted: '#94A3B8',
    activeFill: '#38BDF8',
    activeGradient: 'linear-gradient(100deg, #38BDF8 0%, #0284C7 100%)',
    activeTextColor: '#04111D',
    activeGlow: '0 0 20px rgba(56,189,248,0.5)',
    hoverBg: 'rgba(30, 41, 59, 0.65)',
    defaultEffect: 'starlight',
  },
  'theme-sakura': {
    id: 'theme-sakura',
    name: 'Vườn hoa anh đào',
    isDark: false,
    bgStyle: {
      backgroundColor: '#FFF5F8',
      backgroundImage: 'linear-gradient(180deg, #FFF0F5 0%, #FFE4ED 100%)',
    },
    borderRightColor: '#FBCFE8',
    textPrimary: '#831843',
    textMuted: '#BE185D',
    activeFill: '#EC4899',
    activeGradient: 'linear-gradient(100deg, #F472B6 0%, #DB2777 100%)',
    activeTextColor: '#FFFFFF',
    activeGlow: '0 6px 18px rgba(236,72,153,0.38)',
    hoverBg: 'rgba(253, 232, 240, 0.8)',
    defaultEffect: 'sakura',
  },
  'theme-cyberpunk': {
    id: 'theme-cyberpunk',
    name: 'Cyberpunk 2077',
    isDark: true,
    bgStyle: {
      backgroundColor: '#070A12',
      backgroundImage: 'linear-gradient(180deg, #0A0E1A 0%, #05070D 100%)',
    },
    borderRightColor: 'rgba(0, 242, 254, 0.3)',
    textPrimary: '#E0F2FE',
    textMuted: '#67E8F9',
    activeFill: '#00F2FE',
    activeGradient: 'linear-gradient(100deg, #00F2FE 0%, #FF007A 100%)',
    activeTextColor: '#FFFFFF',
    activeGlow: '0 0 20px rgba(0,242,254,0.6)',
    hoverBg: 'rgba(15, 23, 42, 0.85)',
    defaultEffect: 'matrix',
  },
  'theme-ocean': {
    id: 'theme-ocean',
    name: 'Đại dương sâu',
    isDark: true,
    bgStyle: {
      backgroundColor: '#051326',
      backgroundImage: 'linear-gradient(180deg, #081B34 0%, #030D1C 100%)',
    },
    borderRightColor: 'rgba(14, 165, 233, 0.25)',
    textPrimary: '#E0F2FE',
    textMuted: '#7DD3FC',
    activeFill: '#0284C7',
    activeGradient: 'linear-gradient(100deg, #38BDF8 0%, #0284C7 100%)',
    activeTextColor: '#FFFFFF',
    activeGlow: '0 6px 18px rgba(2,132,199,0.45)',
    hoverBg: 'rgba(12, 42, 77, 0.65)',
    defaultEffect: 'bubbles',
  },
  'theme-sunset': {
    id: 'theme-sunset',
    name: 'Hoàng hôn rực rỡ',
    isDark: true,
    bgStyle: {
      backgroundColor: '#1A0E26',
      backgroundImage: 'linear-gradient(180deg, #241236 0%, #150920 100%)',
    },
    borderRightColor: 'rgba(249, 115, 22, 0.3)',
    textPrimary: '#F3F0FB',
    textMuted: '#FDBA74',
    activeFill: '#F97316',
    activeGradient: 'linear-gradient(100deg, #FB923C 0%, #C026D3 100%)',
    activeTextColor: '#FFFFFF',
    activeGlow: '0 6px 18px rgba(249,115,22,0.45)',
    hoverBg: 'rgba(49, 23, 74, 0.7)',
    defaultEffect: 'autumn',
  },
  'theme-lavender': {
    id: 'theme-lavender',
    name: 'Giấc mộng Lavender',
    isDark: false,
    bgStyle: {
      backgroundColor: '#F7F3FF',
      backgroundImage: 'linear-gradient(180deg, #FAF5FF 0%, #EFE8FF 100%)',
    },
    borderRightColor: '#DDD6FE',
    textPrimary: '#4C1D95',
    textMuted: '#7C3AED',
    activeFill: '#8B5CF6',
    activeGradient: 'linear-gradient(100deg, #A78BFA 0%, #7C3AED 100%)',
    activeTextColor: '#FFFFFF',
    activeGlow: '0 6px 18px rgba(139,92,246,0.35)',
    hoverBg: 'rgba(237, 233, 254, 0.75)',
    defaultEffect: 'butterflies',
  },
  'theme-nord': {
    id: 'theme-nord',
    name: 'Băng tuyết Bắc Âu',
    isDark: true,
    bgStyle: {
      backgroundColor: '#1E232F',
      backgroundImage: 'linear-gradient(180deg, #242B3A 0%, #181C26 100%)',
    },
    borderRightColor: 'rgba(136, 192, 208, 0.3)',
    textPrimary: '#ECEFF4',
    textMuted: '#88C0D0',
    activeFill: '#88C0D0',
    activeGradient: 'linear-gradient(100deg, #88C0D0 0%, #5E81AC 100%)',
    activeTextColor: '#1E232F',
    activeGlow: '0 4px 16px rgba(136,192,208,0.4)',
    hoverBg: 'rgba(46, 52, 64, 0.8)',
    defaultEffect: 'snow',
  },
  'theme-matcha': {
    id: 'theme-matcha',
    name: 'Trà đạo Matcha',
    isDark: false,
    bgStyle: {
      backgroundColor: '#F3F8F3',
      backgroundImage: 'linear-gradient(180deg, #F0FDF4 0%, #E2F2E4 100%)',
    },
    borderRightColor: '#BBF7D0',
    textPrimary: '#14532D',
    textMuted: '#15803D',
    activeFill: '#16A34A',
    activeGradient: 'linear-gradient(100deg, #22C55E 0%, #15803D 100%)',
    activeTextColor: '#FFFFFF',
    activeGlow: '0 6px 16px rgba(22,163,74,0.35)',
    hoverBg: 'rgba(220, 252, 231, 0.7)',
    defaultEffect: null,
  },
  'theme-sepia': {
    id: 'theme-sepia',
    name: 'Nền giấy ngà',
    isDark: false,
    bgStyle: {
      backgroundColor: '#F3F0FB',
      backgroundImage: 'linear-gradient(180deg, #F5F2FF 0%, #F3F0FB 100%)',
    },
    borderRightColor: '#E7DEC8',
    textPrimary: '#2B2350',
    textMuted: '#6A4BD9',
    activeFill: '#6A4BD9',
    activeGradient: 'linear-gradient(100deg, #6A4BD9 0%, #6A4BD9 100%)',
    activeTextColor: '#FFFFFF',
    activeGlow: '0 6px 16px rgba(180,83,9,0.35)',
    hoverBg: 'rgba(245, 235, 219, 0.8)',
    defaultEffect: null,
  },
  'theme-emerald': {
    id: 'theme-emerald',
    name: 'Nền ngọc bích',
    isDark: true,
    bgStyle: {
      backgroundColor: '#041B16',
      backgroundImage: 'linear-gradient(180deg, #072B23 0%, #031410 100%)',
    },
    borderRightColor: 'rgba(16, 185, 129, 0.3)',
    textPrimary: '#ECFDF5',
    textMuted: '#6EE7B7',
    activeFill: '#10B981',
    activeGradient: 'linear-gradient(100deg, #34D399 0%, #059669 100%)',
    activeTextColor: '#022C22',
    activeGlow: '0 0 18px rgba(16,185,129,0.5)',
    hoverBg: 'rgba(6, 48, 38, 0.75)',
    defaultEffect: 'fireflies',
  },
};

export function useSidebarTheme() {
  // Lượt hydrate đầu vẽ như máy chủ (mặc định), rồi mới áp giao diện đã lưu —
  // nếu không, thuộc tính của HTML máy chủ bị giữ lại và giao diện "mất" sau F5.
  const hydrated = useHydrated();
  const storedTheme = useRewardStore((s) => s.theme);
  const storedEffect = useRewardStore((s) => s.effect);
  const themeId = hydrated ? storedTheme : null;
  const effectId = hydrated ? storedEffect : null;

  const themeConfig: SidebarThemeConfig =
    (themeId && SIDEBAR_THEMES[themeId]) ? (SIDEBAR_THEMES[themeId] as SidebarThemeConfig) : DEFAULT_SIDEBAR_THEME;

  // Nếu người dùng chọn hiệu ứng riêng thì ưu tiên hiệu ứng đó, ngược lại lấy hiệu ứng mặc định của theme
  const activeEffect: EffectLook | null = (effectId as EffectLook | null) ?? themeConfig.defaultEffect;

  return {
    themeConfig,
    activeEffect,
  };
}

const STYLE_ID = 'readup-sidebar-atmosphere';
const KEYFRAMES = `
@keyframes sa-fall { 0% { transform: translate3d(0,-20px,0) rotate(0deg); opacity: 0; } 10% { opacity: 0.95; } 100% { transform: translate3d(var(--dx), 110vh, 0) rotate(var(--rot)); opacity: 0.8; } }
@keyframes sa-rise { 0% { transform: translate3d(0,20px,0) scale(0.6); opacity: 0; } 15% { opacity: 0.9; } 100% { transform: translate3d(var(--dx), -110vh, 0) scale(1.1); opacity: 0; } }
@keyframes sa-meteor { 0% { transform: translate3d(0,0,0) rotate(-35deg) scaleX(0.2); opacity: 0; } 12% { opacity: 1; } 55% { transform: translate3d(-180px, 140px, 0) rotate(-35deg) scaleX(1); opacity: 1; } 100% { transform: translate3d(-300px, 220px, 0) rotate(-35deg) scaleX(1); opacity: 0; } }
@keyframes sa-twinkle { 0%, 100% { transform: scale(0.3); opacity: 0.2; } 50% { transform: scale(1.1); opacity: 1; } }
@media (prefers-reduced-motion: reduce) { [data-sa] { animation: none !important; opacity: 0.7 !important; } }
`;

function ensureKeyframes() {
  if (Platform.OS !== 'web' || typeof document === 'undefined' || document.getElementById(STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = KEYFRAMES;
  document.head.appendChild(el);
}

/**
 * Hiển thị lớp phủ hạt khí quyển chuyển động trên thanh bên (Sidebar Atmosphere).
 */
export function SidebarAtmosphereOverlay({ effect, isDark }: { effect: EffectLook | null; isDark: boolean }) {
  useEffect(ensureKeyframes, []);

  const particles = useMemo(() => {
    if (!effect) return [];
    const rng = mulberry32(effect.length * 997);
    const count = effect === 'meteor' || effect === 'starlight' ? 12 : 24;

    return Array.from({ length: count }, (_, i) => {
      const isMeteor = effect === 'meteor' || (effect === 'starlight' && i % 4 === 0);
      return {
        id: i,
        left: rng() * 100,
        top: isMeteor ? rng() * 60 : rng() * 100,
        size: isMeteor ? 50 + rng() * 60 : 6 + rng() * 10,
        duration: 3 + rng() * 6,
        delay: -rng() * 8,
        dx: `${Math.round((rng() - 0.5) * 50)}px`,
        rot: `${Math.round((rng() - 0.5) * 720)}deg`,
        isMeteor,
      };
    });
  }, [effect]);

  if (!effect || Platform.OS !== 'web') return null;

  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', zIndex: 1 }}>
      {particles.map((p) => {
        let animName = 'sa-fall';
        let shapeContent: React.ReactNode = null;

        if (p.isMeteor) {
          animName = 'sa-meteor';
          shapeContent = (
            <div
              style={{
                width: p.size,
                height: 2,
                borderRadius: 2,
                background: 'linear-gradient(90deg, #FFFFFF, rgba(255,255,255,0))',
                boxShadow: '0 0 6px #38BDF8',
              }}
            />
          );
        } else if (effect === 'sakura') {
          animName = 'sa-fall';
          shapeContent = (
            <div
              style={{
                width: p.size,
                height: p.size * 0.7,
                backgroundColor: isDark ? '#F472B6' : '#FF85A1',
                borderTopLeftRadius: p.size,
                borderBottomRightRadius: p.size,
                opacity: 0.85,
                filter: 'drop-shadow(0 2px 4px rgba(236,72,153,0.3))',
              }}
            />
          );
        } else if (effect === 'snow') {
          animName = 'sa-fall';
          shapeContent = (
            <div
              style={{
                width: p.size * 0.6,
                height: p.size * 0.6,
                borderRadius: '50%',
                backgroundColor: '#FFFFFF',
                boxShadow: '0 0 6px rgba(255,255,255,0.8)',
                opacity: 0.9,
              }}
            />
          );
        } else if (effect === 'autumn') {
          animName = 'sa-fall';
          shapeContent = (
            <div
              style={{
                width: p.size,
                height: p.size * 0.8,
                backgroundColor: p.id % 2 === 0 ? '#6A4BD9' : '#6A4BD9',
                borderTopLeftRadius: p.size,
                borderBottomRightRadius: p.size,
                opacity: 0.85,
              }}
            />
          );
        } else if (effect === 'matrix') {
          animName = 'sa-fall';
          shapeContent = (
            <div
              style={{
                width: 2.5,
                height: p.size * 1.5,
                background: 'linear-gradient(180deg, #00FF66, rgba(0,0,0,0))',
                boxShadow: '0 0 6px #00FF66',
              }}
            />
          );
        } else if (effect === 'bubbles' || effect === 'flame' || effect === 'fireflies' || effect === 'neon_pulse') {
          animName = 'sa-rise';
          const bg = effect === 'fireflies' ? '#FACC15' : effect === 'flame' ? '#F97316' : effect === 'neon_pulse' ? '#FF007A' : 'rgba(56, 189, 248, 0.4)';
          shapeContent = (
            <div
              style={{
                width: p.size * 0.8,
                height: p.size * 0.8,
                borderRadius: '50%',
                backgroundColor: bg,
                boxShadow: `0 0 8px ${bg}`,
                opacity: 0.85,
              }}
            />
          );
        } else {
          animName = 'sa-twinkle';
          shapeContent = (
            <div
              style={{
                width: p.size * 0.5,
                height: p.size * 0.5,
                borderRadius: '50%',
                backgroundColor: '#FFFFFF',
                boxShadow: '0 0 8px #FEF08A',
                opacity: 0.9,
              }}
            />
          );
        }

        return (
          <div
            key={p.id}
            data-sa="1"
            style={{
              position: 'absolute',
              left: `${p.left}%`,
              top: `${p.top}%`,
              animation: `${animName} ${p.duration.toFixed(2)}s linear ${p.delay.toFixed(2)}s infinite`,
              willChange: 'transform, opacity',
              ...({ ['--dx']: p.dx, ['--rot']: p.rot } as React.CSSProperties),
            }}
          >
            {shapeContent}
          </div>
        );
      })}
    </View>
  );
}
