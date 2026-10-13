import type { Bi } from '@/i18n/useL';

export type Ingredient = { id: string; name: Bi; kind: 'base' | 'add'; cost: number };
export type BrewStep = { label: Bi; options: readonly Bi[]; correct: number };
export type Recipe = {
  id: string;
  name: Bi;
  price: number;
  ingredients: readonly string[];
  steps: readonly BrewStep[];
  custom: boolean;
};

/** Nguyên liệu: nền là thứ phải có ít nhất một loại; phụ là thứ thêm vào. Giá vốn tính theo đơn vị một ly. */
export const INGREDIENTS: readonly Ingredient[] = [
  { id: 'ca-phe-phin', name: { vi: 'Cà phê phin', en: 'Phin coffee' }, kind: 'base', cost: 8 },
  { id: 'tra-den', name: { vi: 'Trà đen', en: 'Black tea' }, kind: 'base', cost: 4 },
  { id: 'sua-dac', name: { vi: 'Sữa đặc', en: 'Condensed milk' }, kind: 'add', cost: 3 },
  { id: 'sua-tuoi', name: { vi: 'Sữa tươi', en: 'Fresh milk' }, kind: 'add', cost: 3 },
  { id: 'duong', name: { vi: 'Đường', en: 'Sugar' }, kind: 'add', cost: 1 },
  { id: 'da', name: { vi: 'Đá viên', en: 'Ice cubes' }, kind: 'add', cost: 1 },
  { id: 'tran-chau', name: { vi: 'Trân châu', en: 'Pearls' }, kind: 'add', cost: 4 },
];

export const BASE_RECIPES: readonly Recipe[] = [
  {
    id: 'ca-phe-sua-da',
    name: { vi: 'Cà phê sữa đá', en: 'Iced milk coffee' },
    price: 25,
    ingredients: ['ca-phe-phin', 'sua-dac', 'da'],
    custom: false,
    steps: [
      { label: { vi: 'Nền', en: 'Base' }, options: [{ vi: 'Trà đen', en: 'Black tea' }, { vi: 'Cà phê phin', en: 'Phin coffee' }, { vi: 'Nước lọc', en: 'Plain water' }], correct: 1 },
      { label: { vi: 'Sữa', en: 'Milk' }, options: [{ vi: 'Không sữa', en: 'No milk' }, { vi: 'Sữa đặc', en: 'Condensed milk' }, { vi: 'Sữa tươi', en: 'Fresh milk' }], correct: 1 },
      { label: { vi: 'Đá', en: 'Ice' }, options: [{ vi: 'Nước nóng', en: 'Hot water' }, { vi: 'Không đá', en: 'No ice' }, { vi: 'Đá viên', en: 'Ice cubes' }], correct: 2 },
    ],
  },
  {
    id: 'tra-da',
    name: { vi: 'Trà đá', en: 'Iced tea' },
    price: 15,
    ingredients: ['tra-den', 'duong', 'da'],
    custom: false,
    steps: [
      { label: { vi: 'Nền', en: 'Base' }, options: [{ vi: 'Cà phê phin', en: 'Phin coffee' }, { vi: 'Trà đen', en: 'Black tea' }, { vi: 'Nước lọc', en: 'Plain water' }], correct: 1 },
      { label: { vi: 'Đường', en: 'Sugar' }, options: [{ vi: 'Không đường', en: 'No sugar' }, { vi: 'Đường', en: 'Sugar' }, { vi: 'Muối', en: 'Salt' }], correct: 1 },
      { label: { vi: 'Đá', en: 'Ice' }, options: [{ vi: 'Nước nóng', en: 'Hot water' }, { vi: 'Không đá', en: 'No ice' }, { vi: 'Đá viên', en: 'Ice cubes' }], correct: 2 },
    ],
  },
  {
    id: 'tra-sua-tran-chau',
    name: { vi: 'Trà sữa trân châu', en: 'Bubble milk tea' },
    price: 35,
    ingredients: ['tra-den', 'sua-tuoi', 'tran-chau'],
    custom: false,
    steps: [
      { label: { vi: 'Nền', en: 'Base' }, options: [{ vi: 'Nước lọc', en: 'Plain water' }, { vi: 'Trà đen', en: 'Black tea' }, { vi: 'Cà phê phin', en: 'Phin coffee' }], correct: 1 },
      { label: { vi: 'Sữa', en: 'Milk' }, options: [{ vi: 'Không sữa', en: 'No milk' }, { vi: 'Sữa đặc', en: 'Condensed milk' }, { vi: 'Sữa tươi', en: 'Fresh milk' }], correct: 2 },
      { label: { vi: 'Topping', en: 'Topping' }, options: [{ vi: 'Không topping', en: 'No topping' }, { vi: 'Trân châu', en: 'Pearls' }, { vi: 'Nước lọc', en: 'Plain water' }], correct: 1 },
    ],
  },
];

/** Tên có sẵn cho món riêng. Người chơi chọn từ đây, không gõ tự do. */
export const CUSTOM_NAMES: readonly Bi[] = [
  { vi: 'Cà phê Sài Gòn', en: 'Saigon coffee' },
  { vi: 'Trà đào mát', en: 'Cool peach tea' },
  { vi: 'Sữa tươi dừa', en: 'Fresh coconut milk' },
  { vi: 'Trà chanh đá', en: 'Iced lemon tea' },
  { vi: 'Trà sữa đặc biệt', en: 'Special milk tea' },
  { vi: 'Cà phê mới', en: 'New coffee' },
];

/** Tên quán có sẵn. Chọn từ đây, không gõ tự do. */
export const SHOP_NAMES: readonly Bi[] = [
  { vi: 'Quán Sài Gòn Nhỏ', en: 'Little Saigon Café' },
  { vi: 'Quán Trà Đá Bên Đường', en: 'Roadside Iced Tea' },
  { vi: 'Quán Cà Phê Góc Phố', en: 'Corner Coffee House' },
  { vi: 'Quán Sữa Tươi', en: 'Fresh Milk Bar' },
  { vi: 'Quán Trân Châu', en: 'Pearl Tea Shop' },
  { vi: 'Quán Xanh Lá', en: 'Green Leaf Café' },
];

export const SHOP_COLORS: readonly string[] = ['#B23A3A', '#2F8F6B', '#4C7BC0', '#D98A3D'];

/** Thành phố được mở quán. S1 chỉ có Singapore. */
export const SHOP_CITIES = ['singapore'] as const;
