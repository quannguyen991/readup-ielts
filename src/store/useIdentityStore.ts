import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { STORAGE_PREFIX, storage } from './persist';
import { base58btcDecode, base58btcEncode, generateKeyPair } from '@/services/credential/keys';

/**
 * Danh tính của người học: một cặp khoá Ed25519 nằm trên máy họ.
 *
 * KHOÁ RIÊNG KHÔNG BAO GIỜ RỜI THIẾT BỊ, và không có bản sao ở đâu cả. Mất máy
 * là mất khoá; không có khôi phục, không có "quên mật khẩu". Đó là cái giá của
 * việc không có máy chủ, và nó phải được NÓI RA ở mặt giao diện chứ không giấu
 * trong mã — xem `CredentialCard`.
 *
 * SINH LƯỜI, KHÔNG SINH SẴN. Người chưa bao giờ mở phần chứng chỉ thì không cần
 * có khoá. Sinh sẵn cho mọi người là tạo ra một thứ bí mật mà chủ nhân không
 * biết mình đang giữ.
 *
 * Lưu dạng base58 chứ không phải mảng số: `Uint8Array` đi qua JSON thành object
 * `{"0":12,...}` rồi đọc lại ra một thứ không còn là Uint8Array, và lỗi ấy chỉ
 * lộ ra lúc ký — tức là muộn nhất có thể.
 */

type State = {
  /** `null` khi người dùng chưa từng dựng danh tính. */
  did: string | null;
  privateKeyB58: string | null;
  ensure: () => { did: string; privateKey: Uint8Array };
  forget: () => void;
};

export const useIdentityStore = create<State>()(
  persist(
    (set, get) => ({
      did: null,
      privateKeyB58: null,

      ensure: () => {
        const { did, privateKeyB58 } = get();
        if (did && privateKeyB58) {
          return { did, privateKey: base58btcDecode(privateKeyB58) };
        }
        const pair = generateKeyPair();
        set({ did: pair.did, privateKeyB58: base58btcEncode(pair.privateKey) });
        return { did: pair.did, privateKey: pair.privateKey };
      },

      forget: () => set({ did: null, privateKeyB58: null }),
    }),
    { name: `${STORAGE_PREFIX}identity`, storage: storage<State>() },
  ),
);
