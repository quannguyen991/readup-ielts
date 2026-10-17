/** @type {import('tailwindcss').Config} */
// Design tokens bám theo 5 ảnh tham chiếu: nền xám rất nhạt, card trắng bo 14-16px,
// primary xanh dương, accent tím, banner gradient xanh -> tím.
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        canvas: '#F9F7F3',
        surface: '#FFFFFF',
        surfaceAlt: '#FBF7F1',
        border: '#F5F1E9',
        borderStrong: '#F0E9DC',
        ink: '#0F172A',
        body: '#334155',
        muted: '#64748B',
        subtle: '#94A3B8',
        primary: {
          // 01/10/2026 — Band 9: VÀNG KIM (người dùng: "nút … chuyển sang màu vàng").
          // 600 đủ đậm để làm chữ/đường dẫn trên nền trắng; nền tô ở web là dải
          // vàng ánh kim trong global.css.
          DEFAULT: '#8F6E36',
          50: '#FBF7EE',
          100: '#F5ECD7',
          200: '#EBDAB3',
          300: '#DDC28A',
          400: '#CDAB6C',
          500: '#B8955A',
          600: '#8F6E36',
          700: '#7E6230',
          800: '#6A5228',
          900: '#5A4318',
        },
        accent: {
          DEFAULT: '#CCA35B',
          50: '#FCF9F3',
          100: '#FAF4E9',
          200: '#F5EAD6',
          300: '#EEDAB7',
          400: '#DFC496',
          500: '#D6B57C',
          600: '#CCA35B',
          700: '#C3923E',
          800: '#A07731',
          900: '#836229',
        },
        // Bảng "giấy kẻ ô" cho màn tác vụ — mirror src/theme/tokens.ts `paper`.
        brand: {
          // 01/10/2026 — Band 9: vàng kim + kem; `deep` giữ xanh đậm của logo.
          DEFAULT: '#B8955A',
          dark: '#8F6E36',
          deep: '#0F1D33',
          mid: '#B8955A',
          soft: '#EFE3C8',
          tint: '#FAF5EA',
        },
        paper: {
          DEFAULT: '#FDFBF3',
          canvas: '#F7F4EF',
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
        info: { DEFAULT: '#BD8D3A', soft: '#FAF4EA', ink: '#7D5E27' },
      },
      borderRadius: {
        card: '16px',
        panel: '14px',
        pill: '999px',
      },
      // Tên key tránh trùng với utility font-weight của Tailwind
      // (medium / semibold / bold / extrabold) để không sinh class đè nhau.
      fontFamily: {
        // Be Vietnam Pro: phông chính, nạp trong app/_layout.tsx. Plus Jakarta Sans vẫn còn cho trang giới thiệu.
        sans: ['BeVietnamPro_400Regular', 'Inter', 'system-ui', 'sans-serif'],
        mid: ['BeVietnamPro_500Medium', 'Inter', 'system-ui', 'sans-serif'],
        semi: ['BeVietnamPro_600SemiBold', 'Inter', 'system-ui', 'sans-serif'],
        strong: ['BeVietnamPro_700Bold', 'Inter', 'system-ui', 'sans-serif'],
        heavy: ['BeVietnamPro_800ExtraBold', 'Inter', 'system-ui', 'sans-serif'],
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
