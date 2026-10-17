// Ảnh minh hoạ bối cảnh luyện nói: tạo bằng ChatGPT (OpenAI), đặt trong public/hub/scenes/.
// Đổi ảnh: thay file JPG cùng tên trong public/hub/scenes/ rồi cập nhật ghi chú dưới đây nếu cần.

export const SCENE_KEYS = ['airport', 'restaurant', 'cafe', 'grocery', 'market', 'clothing', 'office', 'clinic', 'hotel', 'bank', 'classroom', 'kitchen', 'street', 'station', 'taxi', 'phone', 'home', 'delivery', 'service'] as const;

export type SceneKey = (typeof SCENE_KEYS)[number];

export const SCENE_IMAGE: Record<SceneKey, string> = {
  airport: '/hub/scenes/airport.jpg',
  restaurant: '/hub/scenes/restaurant.jpg',
  cafe: '/hub/scenes/cafe.jpg',
  grocery: '/hub/scenes/grocery.jpg',
  market: '/hub/scenes/market.jpg',
  clothing: '/hub/scenes/clothing.jpg',
  office: '/hub/scenes/office.jpg',
  clinic: '/hub/scenes/clinic.jpg',
  hotel: '/hub/scenes/hotel.jpg',
  bank: '/hub/scenes/bank.jpg',
  classroom: '/hub/scenes/classroom.jpg',
  kitchen: '/hub/scenes/kitchen.jpg',
  street: '/hub/scenes/street.jpg',
  station: '/hub/scenes/station.jpg',
  taxi: '/hub/scenes/taxi.jpg',
  phone: '/hub/scenes/phone.jpg',
  home: '/hub/scenes/home.jpg',
  delivery: '/hub/scenes/delivery.jpg',
  service: '/hub/scenes/service.jpg',
};

export const SCENE_CREDITS: { key: SceneKey; file: string; author: string; license: string; source: string }[] = SCENE_KEYS.map((key) => ({
  key,
  file: `${key}.jpg`,
  author: 'Ảnh tạo bằng ChatGPT (OpenAI)',
  license: 'Ảnh AI do Band 9 tạo',
  source: 'https://chatgpt.com/',
}));
