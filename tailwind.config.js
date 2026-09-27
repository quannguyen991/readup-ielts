/** @type {import('tailwindcss').Config} */
// Design tokens bám theo 5 ảnh tham chiếu: nền xám rất nhạt, card trắng bo 14-16px,
// primary xanh dương, accent tím, banner gradient xanh -> tím.
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        canvas: '#F3F5F9',
        surface: '#FFFFFF',
        surfaceAlt: '#F1F4FB',
        border: '#E9EDF5',
        borderStrong: '#DCE3F0',
        ink: '#0F172A',
        body: '#334155',
        muted: '#64748B',
        subtle: '#94A3B8',
        primary: {
          // 27/09/2026: người dùng bỏ xanh đậm #2563EB, lấy tông xanh nhạt của
          // mục đang chọn ở thanh bên (#7FA3F6 → #4A7FE8). Nút web còn có dải
          // chuyển màu ở global.css.
          DEFAULT: '#5B8BEE',
          50: '#EFF5FF',
          100: '#DFE9FE',
          200: '#C6D8FD',
          300: '#A5C0FA',
          400: '#7FA3F6',
          500: '#6A93F0',
          600: '#5B8BEE',
          700: '#4A7FE8',
          800: '#3F6DD6',
          900: '#345CC0',
        },
        accent: {
          DEFAULT: '#7C3AED',
          50: '#F5F1FE',
          100: '#EDE6FD',
          200: '#DDD0FB',
          300: '#C4ADF8',
          400: '#A582F3',
          500: '#8B5CF6',
          600: '#7C3AED',
          700: '#6B28D9',
          800: '#5A21B0',
          900: '#4A1D8F',
        },
        // Bảng "giấy kẻ ô" cho màn tác vụ — mirror src/theme/tokens.ts `paper`.
        brand: {
          // 27/09/2026: chàm đậm đổi sang tông xanh nhạt của thanh bên (người dùng chọn).
          DEFAULT: '#4A7FE8',
          dark: '#3F6DD6',
          deep: '#1E1B6B',
          mid: '#5B8BEE',
          soft: '#E1E2F6',
          tint: '#F2F3FD',
        },
        paper: {
          DEFAULT: '#FDFBF3',
          canvas: '#EFF0F7',
          fill: '#FBF6D0',
          edge: '#C9A227',
          ink: '#1A1A33',
          body: '#3B3B57',
          muted: '#7B7B99',
        },
        gold: { DEFAULT: '#F0B429', soft: '#FFF4D1' },
        success: { DEFAULT: '#16A34A', soft: '#E8F8EE', ink: '#0F7A38' },
        danger: { DEFAULT: '#F04438', soft: '#FEECEB', ink: '#C0362B' },
        warning: { DEFAULT: '#F59E0B', soft: '#FEF4E6', ink: '#B26A00' },
        info: { DEFAULT: '#0EA5E9', soft: '#E6F6FE', ink: '#0369A1' },
      },
      borderRadius: {
        card: '16px',
        panel: '14px',
        pill: '999px',
      },
      // Tên key tránh trùng với utility font-weight của Tailwind
      // (medium / semibold / bold / extrabold) để không sinh class đè nhau.
      fontFamily: {
        sans: ['PlusJakartaSans_400Regular', 'Inter', 'system-ui', 'sans-serif'],
        mid: ['PlusJakartaSans_500Medium', 'Inter', 'system-ui', 'sans-serif'],
        semi: ['PlusJakartaSans_600SemiBold', 'Inter', 'system-ui', 'sans-serif'],
        strong: ['PlusJakartaSans_700Bold', 'Inter', 'system-ui', 'sans-serif'],
        heavy: ['PlusJakartaSans_800ExtraBold', 'Inter', 'system-ui', 'sans-serif'],
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
        raised: '0 12px 32px rgba(37, 99, 235, 0.18)',
      },
    },
  },
  plugins: [],
};
