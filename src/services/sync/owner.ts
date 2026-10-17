import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Tài khoản nào đang sở hữu dữ liệu học trên máy này. Khi một tài khoản KHÁC đăng nhập,
 * dữ liệu cũ phải được xoá trước khi gộp; cùng tài khoản thì giữ nguyên.
 */
const KEY = 'readup:sync-owner';

export async function readOwner(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export async function writeOwner(userId: string | null): Promise<void> {
  try {
    if (userId) await AsyncStorage.setItem(KEY, userId);
    else await AsyncStorage.removeItem(KEY);
  } catch {
    // Không ghi được thì lần đăng nhập sau sẽ tự xoá để an toàn.
  }
}
