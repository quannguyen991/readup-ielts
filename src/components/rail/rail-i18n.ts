import type { Route, Station } from '@/services/rail/stations';

/**
 * Tên tuyến / ga theo ngôn ngữ giao diện. Dữ liệu gốc ở `services/rail/stations`
 * đã có `en` cho ga; tuyến thì chỉ có tên Việt nên bảng tiếng Anh nằm ở đây.
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
  'Ga sớm mai': 'Early morning station',
  'Hàng cây bên ô kính': 'Trees by the window',
  'Phố đèn vàng': 'Yellow streetlights',
  'Mưa gõ cửa toa': 'Rain on the carriage door',
  'Tuyết trên sân ga': 'Snow on the platform',
  'Chuyến đêm về phương Nam': 'Night train south',
  'Cánh đồng lướt qua': 'Fields rushing by',
  'Ngọn hải đăng xa': 'Distant lighthouse',
  'Tách trà trên tàu': 'Tea on the train',
  'Nhịp ray đều đều': 'Steady rail rhythm',
  'Ngân hà ngoài cửa sổ': 'Milky Way outside the window',
  'Về tới ga cuối': 'Last stop',
};

export function trackName(name: string, en: boolean): string {
  return en ? (TRACK_EN[name] ?? name) : name;
}
