import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import { isValidInviteCode } from '@/lib/payment/reference';
import { STORAGE_PREFIX } from '@/store/persist';

/**
 * Giữ mã mời từ lúc bấm link tới lúc đăng nhập xong.
 *
 * VÌ SAO CẦN BƯỚC TRUNG GIAN: người bấm link mời gần như chắc chắn CHƯA có tài
 * khoản — đó là cả điểm của việc mời. Mà lúc chưa đăng nhập thì không gắn mã vào
 * ai được. Nên mã nằm chờ trên thiết bị, và được nộp ngay sau lần đăng nhập đầu.
 *
 * Đường đi qua email còn dài hơn: bấm link mời → nhập email → mở hộp thư → bấm
 * liên kết đăng nhập → quay lại app. Mã phải sống sót qua cả chuỗi đó, nên nó
 * phải nằm trong storage chứ không phải trong state của một màn hình.
 */
const KEY = `${STORAGE_PREFIX}invite-code`;

async function setItem(value: string) {
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') localStorage.setItem(KEY, value);
    return;
  }
  await AsyncStorage.setItem(KEY, value);
}

async function getItem(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null;
  }
  return AsyncStorage.getItem(KEY);
}

async function removeItem() {
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(KEY);
    return;
  }
  await AsyncStorage.removeItem(KEY);
}

/** Ghi nhớ mã từ `?ref=`. Mã sai khuôn thì bỏ qua im lặng — không phải lỗi của người dùng. */
export async function rememberInviteCode(code: string | null | undefined): Promise<void> {
  if (!code) return;
  const upper = code.trim().toUpperCase();
  if (!isValidInviteCode(upper)) return;
  await setItem(upper);
}

/**
 * Nộp mã đang chờ, gọi sau khi đăng nhập.
 *
 * XOÁ MÃ SAU MỌI KẾT QUẢ TRẢ LỜI ĐƯỢC, kể cả khi bị từ chối. Giữ lại một mã đã
 * bị từ chối (đã khai rồi, tài khoản quá cũ, mã không tồn tại) chỉ khiến nó bị
 * thử lại ở mọi lần đăng nhập sau, mãi mãi. Chỉ giữ khi LỖI MẠNG — lúc đó chưa
 * biết máy chủ nghĩ gì.
 */
export async function claimPendingInvite(token: string): Promise<'claimed' | 'none' | 'rejected'> {
  const code = await getItem();
  if (!code) return 'none';

  try {
    const res = await fetch('/api/referrals', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    await removeItem();
    return res.ok ? 'claimed' : 'rejected';
  } catch {
    // Mất mạng: giữ mã lại để lần đăng nhập sau thử tiếp.
    return 'none';
  }
}
