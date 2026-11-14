/** @type {import('tailwindcss').Config} */
// Design tokens bám theo 5 ảnh tham chiếu: nền xám rất nhạt, card trắng bo 14-16px,
// primary xanh dương, accent tím, banner gradient xanh -> tím.
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Band 9 (21/10/2026): nền kem sáng kiểu Apple, chữ navy của logo, vàng ánh kim làm màu nhấn.
        canvas: '#F8F7FC',
        surface: '#FFFFFF',
        surfaceAlt: '#F3F0FB',
        border: '#E6E1F3',
        borderStrong: '#D9D2EC',
        ink: '#2B2350',
        body: '#3F3A62',
        muted: '#7A72A0',
        subtle: '#A59CC4',
        primary: {
          DEFAULT: '#7C5CF0',
          50: '#F5F2FF',
          100: '#EBE5FF',
          200: '#D9CCFF',
          300: '#BFAAFF',
          400: '#A38BFA',
          500: '#8B6CF0',
          600: '#7C5CF0',
          700: '#6A4BD9',
          800: '#5A3EBA',
          900: '#4A3299',
        },
        accent: {
          DEFAULT: '#F0644F',
          50: '#FFF5F3',
          100: '#FFE8E3',
          200: '#FFD0C6',
          300: '#FFB3A4',
          400: '#FF8F7C',
          500: '#F97A62',
          600: '#F0644F',
          700: '#D9503E',
          800: '#B8412F',
          900: '#953425',
        },
        // Thẻ chủ đề: nền pastel ấm, hợp với vàng kim.
        pastel: {
          mint: '#E6F7EF',
          lilac: '#EEE9FF',
          peach: '#FFEDE6',
          butter: '#FFF6DA',
          sky: '#E6F0FF',
          rose: '#FCE8F0',
        },
        brand: {
          DEFAULT: '#8B6CF0',
          dark: '#6A4BD9',
          deep: '#2B2350',
          mid: '#8B6CF0',
          soft: '#EEE9FF',
          tint: '#F7F5FE',
        },
        paper: {
          DEFAULT: '#FFFFFF',
          canvas: '#F8F7FC',
          fill: '#F1EDFB',
          edge: '#8B6CF0',
          ink: '#2B2350',
          body: '#3F3A62',
          muted: '#7A72A0',
        },
        gold: { DEFAULT: '#F0B429', soft: '#FFF4D1' },
        success: { DEFAULT: '#16A34A', soft: '#E8F8EE', ink: '#0F7A38' },
        danger: { DEFAULT: '#F04438', soft: '#FEECEB', ink: '#C0362B' },
        warning: { DEFAULT: '#F59E0B', soft: '#FEF4E6', ink: '#B26A00' },
        info: { DEFAULT: '#BD8D3A', soft: '#FAF4EA', ink: '#7D5E27' },
      },
      borderRadius: {
        card: '20px',
        panel: '16px',
        pill: '999px',
      },
      // Tên key tránh trùng với utility font-weight của Tailwind
      // (medium / semibold / bold / extrabold) để không sinh class đè nhau.
      fontFamily: {
        // Be Vietnam Pro: phông chính, nạp trong app/_layout.tsx. Plus Jakarta Sans vẫn còn cho trang giới thiệu.
        // Inter (21/10/2026): gọn, mỏng hơn Be Vietnam Pro. Độ đậm vẫn phân cấp nhưng nhẹ hơn:
        // tiêu đề dùng 600 thay cho 800.
        sans: ['Inter_400Regular', 'system-ui', 'sans-serif'],
        mid: ['Inter_500Medium', 'system-ui', 'sans-serif'],
        semi: ['Inter_600SemiBold', 'system-ui', 'sans-serif'],
        strong: ['Inter_600SemiBold', 'system-ui', 'sans-serif'],
        heavy: ['InterTight_600SemiBold', 'Inter_600SemiBold', 'system-ui', 'sans-serif'],
        // Nunito (bo tròn): phòng Listening và Writing theo bố cục tham chiếu.
        nun: ['Nunito_400Regular', 'system-ui', 'sans-serif'],
        'nun-mid': ['Nunito_600SemiBold', 'system-ui', 'sans-serif'],
        'nun-strong': ['Nunito_700Bold', 'system-ui', 'sans-serif'],
        'nun-heavy': ['Nunito_800ExtraBold', 'system-ui', 'sans-serif'],
      },
      // Thang chữ nâng một bậc (22/09/2026): chữ thường 14px -> 16px. Bản cũ
      // đọc như app thu nhỏ trên màn laptop — người dùng so với các app luyện
      // thi khác và thấy của mình "bị thu nhỏ quá". Giữ khớp với `fontSize`
      // trong src/theme/tokens.ts.
      fontSize: {
        label: ['13px', '18px'],
        body: ['16px', '24px'],
        bodyLg: ['17px', '27px'],
        cardTitle: ['18px', '25px'],
        sectionTitle: ['22px', '30px'],
        stat: ['30px', '36px'],
        pageTitle: ['34px', '42px'],
        hero: ['38px', '46px'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px rgba(15, 23, 42, 0.05)',
        raised: '0 12px 32px rgba(199, 153, 73, 0.18)',
      },
    },
  },
  plugins: [],
};
