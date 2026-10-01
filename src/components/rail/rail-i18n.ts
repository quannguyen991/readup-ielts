import type { FlyerId } from '@/services/rail/flyers';
import type { Route, Station } from '@/services/rail/stations';

/**
 * Tên hành trình / thành phố / nhân vật bay theo ngôn ngữ giao diện. Dữ liệu gốc ở
 * `services/rail/stations` đã có `en` cho thành phố; hành trình thì chỉ có tên Việt
 * nên bảng tiếng Anh nằm ở đây.
 */
const ROUTE_EN: Record<string, string> = {
  vn: 'North – South Vietnam',
  asia: 'East & Southeast Asia',
  europe: 'Classic Europe',
  world: 'Around the world',
};

export function routeName(route: Pick<Route, 'id' | 'vi'>, en: boolean): string {
  return en ? (ROUTE_EN[route.id] ?? route.vi) : route.vi;
}

export function flyerName(f: { id: FlyerId; vi: string; en: string }, en: boolean): string {
  return en ? f.en : f.vi;
}

export function stationName(station: Pick<Station, 'vi' | 'en'>, en: boolean): string {
  return en ? station.en : station.vi;
}

const COUNTRY_EN: Record<string, string> = {
  'Ai Cập': 'Egypt',
  Anh: 'UK',
  Brazil: 'Brazil',
  'Bắc cực': 'Arctic',
  Campuchia: 'Cambodia',
  'Hoa Kỳ': 'USA',
  'Hy Lạp': 'Greece',
  'Hà Lan': 'Netherlands',
  'Hàn Quốc': 'South Korea',
  Nepal: 'Nepal',
  Nga: 'Russia',
  'Nhật Bản': 'Japan',
  Pháp: 'France',
  Singapore: 'Singapore',
  Séc: 'Czechia',
  'Thái Lan': 'Thailand',
  'Thổ Nhĩ Kỳ': 'Türkiye',
  'Thụy Điển': 'Sweden',
  'Trung Quốc': 'China',
  UAE: 'UAE',
  'Việt Nam': 'Vietnam',
  Úc: 'Australia',
  Ý: 'Italy',
};

export function countryName(country: string, en: boolean): string {
  return en ? (COUNTRY_EN[country] ?? country) : country;
}

/** Tên bài nhạc radio (dữ liệu gốc ở `services/rail/music`). */
const TRACK_EN: Record<string, string> = {
  'Bình minh trên mây': 'Sunrise above the clouds',
  'Cánh rừng phía dưới': 'Forest far below',
  'Phố đèn vàng': 'Yellow streetlights',
  'Mưa trên đôi cánh': 'Rain on the wings',
  'Tuyết giữa mây': 'Snow in the clouds',
  'Bay đêm về phương Nam': 'Night flight south',
  'Cánh đồng lướt qua': 'Fields rushing by',
  'Ngọn hải đăng xa': 'Distant lighthouse',
  'Tách trà giữa mây': 'Tea among the clouds',
  'Gió thổi đều đều': 'Steady tailwind',
  'Ngân hà trên đỉnh trời': 'Milky Way overhead',
  'Hạ cánh êm': 'Soft landing',
};

export function trackName(name: string, en: boolean): string {
  return en ? (TRACK_EN[name] ?? name) : name;
}
