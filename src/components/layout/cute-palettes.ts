import type { CutePalette } from '@/store/useCuteAppearanceStore';

export const CUTE_PALETTES: Record<CutePalette, {
  label: string;
  labelEn: string;
  swatch: string;
  browse: readonly [string, string, string];
  study: readonly [string, string, string];
  browseLine: string;
  studyLine: string;
}> = {
  original: {
    label: 'Mặc định', labelEn: 'Default', swatch: '#C7A565',
    browse: ['#F4EFE4', '#F0E9DA', '#EBE2CE'], study: ['#FFFDF8', '#FBF6EC', '#F5ECD9'],
    browseLine: 'rgba(143, 110, 54, 0.10)', studyLine: 'rgba(143, 110, 54, 0.10)',
  },
  strawberry: {
    label: 'Dâu sữa', labelEn: 'Strawberry milk', swatch: '#F3A8BD',
    browse: ['#FFF0F4', '#FFE7EE', '#FCEAF2'], study: ['#FFFAFB', '#FFF0F4', '#FCE8EE'],
    browseLine: 'rgba(198, 90, 120, 0.10)', studyLine: 'rgba(198, 90, 120, 0.09)',
  },
  sky: {
    label: 'Hoa anh đào', labelEn: 'Sakura blush', swatch: '#EBA8BC',
    browse: ['#FFF2F5', '#FCE8EE', '#F9DFE8'], study: ['#FFFAFB', '#FFF3F6', '#FBEAF0'],
    browseLine: 'rgba(217, 127, 155, 0.11)', studyLine: 'rgba(217, 127, 155, 0.09)',
  },
  lemon: {
    label: 'Kẹo marshmallow', labelEn: 'Marshmallow pink', swatch: '#F7CBD8',
    browse: ['#FFF5F7', '#FCEBF0', '#F8E0E9'], study: ['#FFFBFC', '#FFF4F7', '#FBEAF0'],
    browseLine: 'rgba(198, 90, 120, 0.09)', studyLine: 'rgba(198, 90, 120, 0.08)',
  },
  lilac: {
    label: 'Hồng kem', labelEn: 'Rose cream', swatch: '#D97F9B',
    browse: ['#FCE8EE', '#F7DDE6', '#FBEAF0'], study: ['#FFFAFB', '#FCE8EE', '#F8E1E9'],
    browseLine: 'rgba(166, 68, 98, 0.10)', studyLine: 'rgba(166, 68, 98, 0.08)',
  },
};
