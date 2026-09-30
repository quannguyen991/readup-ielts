/**
 * GA TÀU của "Chuyến tàu chậm" — mỗi ga là một CÔNG THỨC dựng cảnh (không phải
 * ảnh): kiểu phố, núi, nước, cây, và vài công trình biểu tượng vẽ bằng khối
 * pixel. Bộ vẽ ở `scene.ts` đọc công thức này; cùng công thức + cùng hạt giống
 * thì ra đúng một bức, nên không cần lưu ảnh nào.
 *
 * Hình vẽ hoàn toàn do code sinh ra — không dùng ảnh của trang/tác giả nào.
 */

export type CityStyle = 'asian' | 'modern' | 'european' | 'vn' | 'desert' | 'tropical' | 'nordic' | 'old';
export type Mountains = 'fuji' | 'range' | 'karst' | 'hills' | 'snowy' | 'terraces' | 'dunes' | null;
export type Water = 'river' | 'sea' | 'lake' | null;
export type Vegetation = 'sakura' | 'green' | 'palm' | 'pine' | 'snowpine' | 'rice' | 'desert' | 'autumn' | 'flowers' | 'bamboo';
export type LandmarkKind =
  | 'needle'
  | 'eiffel'
  | 'pagoda'
  | 'pearl'
  | 'spire'
  | 'clocktower'
  | 'dome'
  | 'onion'
  | 'mosque'
  | 'pyramid'
  | 'opera'
  | 'suspension'
  | 'torii'
  | 'colosseum'
  | 'lighthouse'
  | 'angkor'
  | 'stupa'
  | 'turtletower'
  | 'onepillar'
  | 'lotustower'
  | 'tallspire'
  | 'coveredbridge'
  | 'citadel'
  | 'windmill'
  | 'castle'
  | 'greatwall'
  | 'burj'
  | 'marina'
  | 'ferris'
  | 'statue'
  | 'archbridge'
  | 'lantern';

export type Landmark = { kind: LandmarkKind; x: number; s?: number };

export type Station = {
  id: string;
  vi: string;
  en: string;
  country: string;
  /** Múi giờ IANA — đồng hồ hiện giờ địa phương của ga. */
  tz: string;
  /** Bài Wikipedia tiếng Việt cho nút "Khám phá". */
  wiki: string;
  skyline: { density: number; min: number; max: number; style: CityStyle } | null;
  mountains: Mountains;
  water: Water;
  veg: Vegetation;
  landmarks: Landmark[];
  /** Chủ đề từ vựng gợi ý cho ga (hiện cạnh câu hỏi). */
  topic: string;
};

const S = (s: Station) => s;

export const STATIONS: readonly Station[] = [
  S({ id: 'hanoi', vi: 'Hà Nội', en: 'Hanoi', country: 'Việt Nam', tz: 'Asia/Ho_Chi_Minh', wiki: 'Hà_Nội', skyline: { density: 0.75, min: 10, max: 40, style: 'vn' }, mountains: null, water: 'lake', veg: 'green', landmarks: [{ kind: 'turtletower', x: 0.36 }, { kind: 'onepillar', x: 0.62 }, { kind: 'tallspire', x: 0.84, s: 0.8 }], topic: 'Urban life' }),
  S({ id: 'halong', vi: 'Hạ Long', en: 'Ha Long Bay', country: 'Việt Nam', tz: 'Asia/Ho_Chi_Minh', wiki: 'Vịnh_Hạ_Long', skyline: null, mountains: 'karst', water: 'sea', veg: 'palm', landmarks: [], topic: 'Tourism' }),
  S({ id: 'ninhbinh', vi: 'Ninh Bình', en: 'Ninh Binh', country: 'Việt Nam', tz: 'Asia/Ho_Chi_Minh', wiki: 'Tràng_An', skyline: null, mountains: 'karst', water: 'river', veg: 'rice', landmarks: [{ kind: 'pagoda', x: 0.7, s: 0.7 }], topic: 'Agriculture' }),
  S({ id: 'sapa', vi: 'Sa Pa', en: 'Sa Pa', country: 'Việt Nam', tz: 'Asia/Ho_Chi_Minh', wiki: 'Sa_Pa', skyline: { density: 0.2, min: 6, max: 14, style: 'old' }, mountains: 'terraces', water: null, veg: 'pine', landmarks: [], topic: 'Environment' }),
  S({ id: 'hagiang', vi: 'Hà Giang', en: 'Ha Giang', country: 'Việt Nam', tz: 'Asia/Ho_Chi_Minh', wiki: 'Hà_Giang', skyline: null, mountains: 'range', water: 'river', veg: 'flowers', landmarks: [], topic: 'Travel' }),
  S({ id: 'hue', vi: 'Huế', en: 'Hue', country: 'Việt Nam', tz: 'Asia/Ho_Chi_Minh', wiki: 'Huế', skyline: { density: 0.3, min: 8, max: 18, style: 'vn' }, mountains: 'hills', water: 'river', veg: 'green', landmarks: [{ kind: 'citadel', x: 0.35 }, { kind: 'pagoda', x: 0.72, s: 0.9 }], topic: 'History' }),
  S({ id: 'danang', vi: 'Đà Nẵng', en: 'Da Nang', country: 'Việt Nam', tz: 'Asia/Ho_Chi_Minh', wiki: 'Đà_Nẵng', skyline: { density: 0.7, min: 14, max: 50, style: 'modern' }, mountains: 'hills', water: 'river', veg: 'palm', landmarks: [{ kind: 'archbridge', x: 0.5 }], topic: 'Tourism' }),
  S({ id: 'hoian', vi: 'Hội An', en: 'Hoi An', country: 'Việt Nam', tz: 'Asia/Ho_Chi_Minh', wiki: 'Hội_An', skyline: { density: 0.8, min: 8, max: 16, style: 'vn' }, mountains: null, water: 'river', veg: 'green', landmarks: [{ kind: 'coveredbridge', x: 0.45 }, { kind: 'lantern', x: 0.2 }, { kind: 'lantern', x: 0.72 }], topic: 'Culture' }),
  S({ id: 'dalat', vi: 'Đà Lạt', en: 'Da Lat', country: 'Việt Nam', tz: 'Asia/Ho_Chi_Minh', wiki: 'Đà_Lạt', skyline: { density: 0.4, min: 8, max: 20, style: 'european' }, mountains: 'hills', water: 'lake', veg: 'pine', landmarks: [{ kind: 'spire', x: 0.55, s: 0.8 }], topic: 'Weather' }),
  S({ id: 'nhatrang', vi: 'Nha Trang', en: 'Nha Trang', country: 'Việt Nam', tz: 'Asia/Ho_Chi_Minh', wiki: 'Nha_Trang', skyline: { density: 0.7, min: 14, max: 44, style: 'modern' }, mountains: 'hills', water: 'sea', veg: 'palm', landmarks: [{ kind: 'stupa', x: 0.18, s: 0.8 }], topic: 'Tourism' }),
  S({ id: 'hcm', vi: 'TP. Hồ Chí Minh', en: 'Ho Chi Minh City', country: 'Việt Nam', tz: 'Asia/Ho_Chi_Minh', wiki: 'Thành_phố_Hồ_Chí_Minh', skyline: { density: 0.9, min: 16, max: 60, style: 'modern' }, mountains: null, water: 'river', veg: 'palm', landmarks: [{ kind: 'tallspire', x: 0.7, s: 1.25 }, { kind: 'lotustower', x: 0.42 }], topic: 'Economy' }),
  S({ id: 'cantho', vi: 'Cần Thơ', en: 'Can Tho', country: 'Việt Nam', tz: 'Asia/Ho_Chi_Minh', wiki: 'Cần_Thơ', skyline: { density: 0.35, min: 8, max: 22, style: 'vn' }, mountains: null, water: 'river', veg: 'palm', landmarks: [{ kind: 'suspension', x: 0.55, s: 0.9 }], topic: 'Agriculture' }),
  S({ id: 'phuquoc', vi: 'Phú Quốc', en: 'Phu Quoc', country: 'Việt Nam', tz: 'Asia/Ho_Chi_Minh', wiki: 'Phú_Quốc', skyline: null, mountains: 'hills', water: 'sea', veg: 'palm', landmarks: [{ kind: 'lighthouse', x: 0.8 }], topic: 'Tourism' }),
  S({ id: 'tokyo', vi: 'Tokyo', en: 'Tokyo', country: 'Nhật Bản', tz: 'Asia/Tokyo', wiki: 'Tokyo', skyline: { density: 0.95, min: 14, max: 48, style: 'modern' }, mountains: 'fuji', water: 'river', veg: 'sakura', landmarks: [{ kind: 'needle', x: 0.12, s: 1.2 }, { kind: 'pagoda', x: 0.78 }], topic: 'Technology' }),
  S({ id: 'kyoto', vi: 'Kyoto', en: 'Kyoto', country: 'Nhật Bản', tz: 'Asia/Tokyo', wiki: 'Kyōto', skyline: { density: 0.5, min: 8, max: 16, style: 'asian' }, mountains: 'hills', water: null, veg: 'autumn', landmarks: [{ kind: 'pagoda', x: 0.4, s: 1.1 }, { kind: 'torii', x: 0.7 }], topic: 'Culture' }),
  S({ id: 'osaka', vi: 'Osaka', en: 'Osaka', country: 'Nhật Bản', tz: 'Asia/Tokyo', wiki: 'Ōsaka', skyline: { density: 0.9, min: 14, max: 44, style: 'modern' }, mountains: null, water: 'river', veg: 'sakura', landmarks: [{ kind: 'castle', x: 0.3 }], topic: 'Food' }),
  S({ id: 'seoul', vi: 'Seoul', en: 'Seoul', country: 'Hàn Quốc', tz: 'Asia/Seoul', wiki: 'Seoul', skyline: { density: 0.9, min: 14, max: 50, style: 'modern' }, mountains: 'range', water: 'river', veg: 'autumn', landmarks: [{ kind: 'needle', x: 0.25, s: 0.9 }, { kind: 'tallspire', x: 0.75 }], topic: 'Media' }),
  S({ id: 'shanghai', vi: 'Thượng Hải', en: 'Shanghai', country: 'Trung Quốc', tz: 'Asia/Shanghai', wiki: 'Thượng_Hải', skyline: { density: 1, min: 18, max: 64, style: 'modern' }, mountains: null, water: 'river', veg: 'green', landmarks: [{ kind: 'pearl', x: 0.35, s: 1.1 }, { kind: 'tallspire', x: 0.7, s: 1.3 }], topic: 'Economy' }),
  S({ id: 'beijing', vi: 'Bắc Kinh', en: 'Beijing', country: 'Trung Quốc', tz: 'Asia/Shanghai', wiki: 'Bắc_Kinh', skyline: { density: 0.5, min: 10, max: 30, style: 'asian' }, mountains: 'range', water: null, veg: 'autumn', landmarks: [{ kind: 'greatwall', x: 0.5 }, { kind: 'pagoda', x: 0.2, s: 0.8 }], topic: 'History' }),
  S({ id: 'singapore', vi: 'Singapore', en: 'Singapore', country: 'Singapore', tz: 'Asia/Singapore', wiki: 'Singapore', skyline: { density: 0.95, min: 18, max: 56, style: 'modern' }, mountains: null, water: 'sea', veg: 'palm', landmarks: [{ kind: 'marina', x: 0.55 }, { kind: 'ferris', x: 0.2 }], topic: 'Technology' }),
  S({ id: 'bangkok', vi: 'Bangkok', en: 'Bangkok', country: 'Thái Lan', tz: 'Asia/Bangkok', wiki: 'Bangkok', skyline: { density: 0.8, min: 14, max: 48, style: 'modern' }, mountains: null, water: 'river', veg: 'palm', landmarks: [{ kind: 'stupa', x: 0.3, s: 1.2 }, { kind: 'stupa', x: 0.42, s: 0.8 }], topic: 'Culture' }),
  S({ id: 'angkor', vi: 'Angkor Wat', en: 'Angkor Wat', country: 'Campuchia', tz: 'Asia/Phnom_Penh', wiki: 'Angkor_Wat', skyline: null, mountains: null, water: 'lake', veg: 'palm', landmarks: [{ kind: 'angkor', x: 0.5, s: 1.2 }], topic: 'History' }),
  S({ id: 'dubai', vi: 'Dubai', en: 'Dubai', country: 'UAE', tz: 'Asia/Dubai', wiki: 'Dubai', skyline: { density: 0.9, min: 18, max: 56, style: 'modern' }, mountains: 'dunes', water: 'sea', veg: 'desert', landmarks: [{ kind: 'burj', x: 0.5, s: 1.4 }, { kind: 'mosque', x: 0.15 }], topic: 'Economy' }),
  S({ id: 'giza', vi: 'Kim tự tháp Giza', en: 'Giza', country: 'Ai Cập', tz: 'Africa/Cairo', wiki: 'Kim_tự_tháp_Giza', skyline: null, mountains: 'dunes', water: null, veg: 'desert', landmarks: [{ kind: 'pyramid', x: 0.3, s: 1.2 }, { kind: 'pyramid', x: 0.55, s: 1 }, { kind: 'pyramid', x: 0.74, s: 0.6 }], topic: 'History' }),
  S({ id: 'istanbul', vi: 'Istanbul', en: 'Istanbul', country: 'Thổ Nhĩ Kỳ', tz: 'Europe/Istanbul', wiki: 'Istanbul', skyline: { density: 0.6, min: 8, max: 20, style: 'old' }, mountains: null, water: 'sea', veg: 'green', landmarks: [{ kind: 'mosque', x: 0.4, s: 1.2 }, { kind: 'mosque', x: 0.7, s: 0.8 }], topic: 'Culture' }),
  S({ id: 'athens', vi: 'Athens', en: 'Athens', country: 'Hy Lạp', tz: 'Europe/Athens', wiki: 'Athena', skyline: { density: 0.6, min: 8, max: 16, style: 'old' }, mountains: 'hills', water: null, veg: 'green', landmarks: [{ kind: 'colosseum', x: 0.5, s: 0.8 }], topic: 'Philosophy' }),
  S({ id: 'rome', vi: 'Rome', en: 'Rome', country: 'Ý', tz: 'Europe/Rome', wiki: 'Roma', skyline: { density: 0.6, min: 8, max: 18, style: 'european' }, mountains: 'hills', water: 'river', veg: 'green', landmarks: [{ kind: 'colosseum', x: 0.3 }, { kind: 'dome', x: 0.72 }], topic: 'History' }),
  S({ id: 'paris', vi: 'Paris', en: 'Paris', country: 'Pháp', tz: 'Europe/Paris', wiki: 'Paris', skyline: { density: 0.8, min: 10, max: 20, style: 'european' }, mountains: null, water: 'river', veg: 'green', landmarks: [{ kind: 'eiffel', x: 0.4, s: 1.2 }, { kind: 'dome', x: 0.8, s: 0.8 }], topic: 'Art' }),
  S({ id: 'london', vi: 'London', en: 'London', country: 'Anh', tz: 'Europe/London', wiki: 'Luân_Đôn', skyline: { density: 0.85, min: 10, max: 36, style: 'european' }, mountains: null, water: 'river', veg: 'green', landmarks: [{ kind: 'clocktower', x: 0.28, s: 1.1 }, { kind: 'ferris', x: 0.52 }, { kind: 'spire', x: 0.8 }], topic: 'Education' }),
  S({ id: 'amsterdam', vi: 'Amsterdam', en: 'Amsterdam', country: 'Hà Lan', tz: 'Europe/Amsterdam', wiki: 'Amsterdam', skyline: { density: 0.8, min: 10, max: 18, style: 'european' }, mountains: null, water: 'river', veg: 'flowers', landmarks: [{ kind: 'windmill', x: 0.22 }, { kind: 'windmill', x: 0.78, s: 0.8 }], topic: 'Transport' }),
  S({ id: 'prague', vi: 'Praha', en: 'Prague', country: 'Séc', tz: 'Europe/Prague', wiki: 'Praha', skyline: { density: 0.7, min: 10, max: 20, style: 'european' }, mountains: 'hills', water: 'river', veg: 'autumn', landmarks: [{ kind: 'castle', x: 0.6 }, { kind: 'spire', x: 0.3 }], topic: 'Architecture' }),
  S({ id: 'moscow', vi: 'Moskva', en: 'Moscow', country: 'Nga', tz: 'Europe/Moscow', wiki: 'Moskva', skyline: { density: 0.6, min: 10, max: 30, style: 'european' }, mountains: null, water: 'river', veg: 'snowpine', landmarks: [{ kind: 'onion', x: 0.4, s: 1.1 }, { kind: 'onion', x: 0.55, s: 0.8 }], topic: 'History' }),
  S({ id: 'stockholm', vi: 'Stockholm', en: 'Stockholm', country: 'Thụy Điển', tz: 'Europe/Stockholm', wiki: 'Stockholm', skyline: { density: 0.6, min: 8, max: 18, style: 'nordic' }, mountains: null, water: 'sea', veg: 'pine', landmarks: [{ kind: 'spire', x: 0.45 }], topic: 'Environment' }),
  S({ id: 'newyork', vi: 'New York', en: 'New York', country: 'Hoa Kỳ', tz: 'America/New_York', wiki: 'Thành_phố_New_York', skyline: { density: 1, min: 20, max: 60, style: 'modern' }, mountains: null, water: 'river', veg: 'autumn', landmarks: [{ kind: 'spire', x: 0.45, s: 1.4 }, { kind: 'statue', x: 0.12 }, { kind: 'suspension', x: 0.8 }], topic: 'Business' }),
  S({ id: 'sanfrancisco', vi: 'San Francisco', en: 'San Francisco', country: 'Hoa Kỳ', tz: 'America/Los_Angeles', wiki: 'San_Francisco', skyline: { density: 0.6, min: 12, max: 40, style: 'modern' }, mountains: 'hills', water: 'sea', veg: 'green', landmarks: [{ kind: 'suspension', x: 0.45, s: 1.3 }], topic: 'Technology' }),
  S({ id: 'rio', vi: 'Rio de Janeiro', en: 'Rio de Janeiro', country: 'Brazil', tz: 'America/Sao_Paulo', wiki: 'Rio_de_Janeiro', skyline: { density: 0.6, min: 10, max: 30, style: 'modern' }, mountains: 'karst', water: 'sea', veg: 'palm', landmarks: [{ kind: 'statue', x: 0.3, s: 0.9 }], topic: 'Sport' }),
  S({ id: 'sydney', vi: 'Sydney', en: 'Sydney', country: 'Úc', tz: 'Australia/Sydney', wiki: 'Sydney', skyline: { density: 0.8, min: 14, max: 44, style: 'modern' }, mountains: null, water: 'sea', veg: 'palm', landmarks: [{ kind: 'opera', x: 0.35 }, { kind: 'archbridge', x: 0.72 }, { kind: 'needle', x: 0.55, s: 0.8 }], topic: 'Art' }),
  S({ id: 'kathmandu', vi: 'Kathmandu', en: 'Kathmandu', country: 'Nepal', tz: 'Asia/Kathmandu', wiki: 'Kathmandu', skyline: { density: 0.5, min: 8, max: 16, style: 'old' }, mountains: 'snowy', water: null, veg: 'pine', landmarks: [{ kind: 'stupa', x: 0.5, s: 1.1 }], topic: 'Environment' }),
  S({ id: 'aurora', vi: 'Cực quang', en: 'Northern lights', country: 'Bắc cực', tz: 'Atlantic/Reykjavik', wiki: 'Cực_quang', skyline: { density: 0.15, min: 6, max: 10, style: 'nordic' }, mountains: 'snowy', water: 'lake', veg: 'snowpine', landmarks: [], topic: 'Science' }),
];

export function stationById(id: string | null | undefined): Station {
  return STATIONS.find((s) => s.id === id) ?? STATIONS[0]!;
}

export function stationIndex(id: string): number {
  return Math.max(0, STATIONS.findIndex((s) => s.id === id));
}

export function nextStation(id: string, dir: 1 | -1 = 1): Station {
  const i = stationIndex(id);
  return STATIONS[(i + dir + STATIONS.length) % STATIONS.length]!;
}

/** Giờ:phút địa phương của ga (HH, MM) — đồng hồ LCD và chế độ "tự theo giờ". */
export function localClock(tz: string, now: Date): { h: number; m: number } {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(now);
    const h = Number(parts.find((p) => p.type === 'hour')?.value ?? '0') % 24;
    const m = Number(parts.find((p) => p.type === 'minute')?.value ?? '0');
    return { h, m };
  } catch {
    return { h: now.getHours(), m: now.getMinutes() };
  }
}

export type TimeOfDay = 'day' | 'sunset' | 'night';

/** Buổi theo giờ địa phương: 6–16 ngày, 16–19 hoàng hôn (và 5–6 bình minh), còn lại đêm. */
export function timeOfDayAt(h: number): TimeOfDay {
  if (h >= 6 && h < 16) return 'day';
  if ((h >= 16 && h < 19) || h === 5) return 'sunset';
  return 'night';
}

// ------------------------------------------------------------------ tuyến

export type Route = { id: string; vi: string; glyph: string; color: string; stops: string[] };

/**
 * Tuyến tàu: mỗi tuyến là một vòng các ga theo đúng thứ tự địa lý (đi hết
 * tuyến thì vòng lại ga đầu). Thay cho danh sách thả xuống dài — người học chọn
 * một hành trình, và thấy nó như sơ đồ tàu điện.
 */
export const ROUTES: readonly Route[] = [
  { id: 'vn', vi: 'Bắc – Nam Việt Nam', glyph: '🏮', color: '#E4574A', stops: ['sapa', 'hagiang', 'hanoi', 'halong', 'ninhbinh', 'hue', 'danang', 'hoian', 'nhatrang', 'dalat', 'hcm', 'cantho', 'phuquoc'] },
  { id: 'asia', vi: 'Đông Á & Đông Nam Á', glyph: '🏯', color: '#E8A23A', stops: ['tokyo', 'kyoto', 'osaka', 'seoul', 'beijing', 'shanghai', 'bangkok', 'angkor', 'singapore', 'kathmandu'] },
  { id: 'europe', vi: 'Châu Âu cổ kính', glyph: '🏰', color: '#4A7FE8', stops: ['london', 'amsterdam', 'paris', 'prague', 'stockholm', 'moscow', 'istanbul', 'athens', 'rome'] },
  { id: 'world', vi: 'Vòng quanh thế giới', glyph: '🌏', color: '#3AA87A', stops: ['dubai', 'giza', 'newyork', 'sanfrancisco', 'rio', 'sydney', 'aurora'] },
];

export function routeById(id: string | null | undefined): Route {
  return ROUTES.find((r) => r.id === id) ?? ROUTES[0]!;
}

/** Tuyến đang chứa ga (ga không thuộc tuyến nào thì về tuyến đầu). */
export function routeOf(stationId: string): Route {
  return ROUTES.find((r) => r.stops.includes(stationId)) ?? ROUTES[0]!;
}

/** Ga kế tiếp TRÊN TUYẾN (vòng lại đầu tuyến). */
export function nextOnRoute(route: Route, stationId: string, dir: 1 | -1 = 1): Station {
  const i = Math.max(0, route.stops.indexOf(stationId));
  return stationById(route.stops[(i + dir + route.stops.length) % route.stops.length]!);
}
