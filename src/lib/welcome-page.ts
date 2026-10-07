/**
 * Trang giới thiệu ngắn (`/gioi-thieu`): lần ĐẦU mở link trên một máy thì vào đây; đã xem rồi thì `/` vào thẳng app (`/intro`).
 * Hàm thuần để test được; phần đọc/ghi localStorage ở `app/index.tsx` và `app/gioi-thieu.tsx`.
 */
export const WELCOME_SEEN_KEY = 'readup:welcome-seen';
export const WELCOME_PATH = '/gioi-thieu';

export function entryPath(seenWelcome: boolean): string {
  return seenWelcome ? '/intro' : WELCOME_PATH;
}
