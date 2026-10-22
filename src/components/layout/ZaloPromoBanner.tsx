import React, { useState } from 'react';
import { Linking, Platform, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import { Icon } from '@/components/ui/Icon';
import { useL } from '@/i18n/useL';
import { useRewardStore } from '@/store/useRewardStore';

export const ZALO_PHONE = '0921.247.247';
export const ZALO_PHONE_RAW = '0921247247';
export const ZALO_LINK = `https://zalo.me/${ZALO_PHONE_RAW}`;
export const STORAGE_KEY = 'readup_zalo_max_promo_hidden_at_v2';

/** Đóng banner thì ẩn 3 ngày (localStorage) — ẩn theo phiên thì mở lại web là hiện lại, gây phiền. */
export const HIDE_MS = 3 * 86_400_000;

export function readHidden(): boolean {
  try {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return false;
    const at = Number(window.localStorage.getItem(STORAGE_KEY));
    return Number.isFinite(at) && at > 0 && Date.now() - at < HIDE_MS;
  } catch {
    return false;
  }
}

export function ZaloPromoBanner() {
  // Đọc ngay lúc khởi tạo (không setState trong effect).
  const [visible, setVisible] = useState(() => !readHidden());
  const [copied, setCopied] = useState(false);
  const { L } = useL();
  const chiikawa = useRewardStore((s) => s.theme === 'theme-chiikawa');
  // Đo bằng JS thay vì breakpoint CSS: banner chỉ hiện sau khi app đã nạp xong (không có bản dựng máy chủ của nó).
  const compact = useWindowDimensions().width < 640;

  const handleDismiss = () => {
    setVisible(false);
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, String(Date.now()));
      }
    } catch {
      // localStorage bị chặn: chỉ ẩn trong lần xem này.
    }
  };

  const handleOpenZalo = () => {
    Linking.openURL(ZALO_LINK).catch(() => {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.open(ZALO_LINK, '_blank');
      }
    });
  };

  const handleCopyPhone = async () => {
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(ZALO_PHONE_RAW);
      } else {
        await Clipboard.setStringAsync(ZALO_PHONE_RAW);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // Đã đóng thì ẩn hẳn — huy hiệu mini cũ ghim góc trái dưới đè lên nút Đăng nhập của thanh bên.
  if (!visible) return null;

  return (
    <View className={`relative z-30 w-full overflow-hidden border-b ${chiikawa ? 'border-pink-300/30' : 'border-amber-400/30'}`}>
      {/* Nền gradient hoàng gia tinh tế */}
      <LinearGradient
        colors={chiikawa ? (['#3B2432', '#512B40', '#67344D'] as const) : (['#0B1526', '#132139', '#1A2B48'] as const)}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      />

      {/* Ánh sáng mờ trang trí */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: -25,
          left: '20%',
          width: 300,
          height: 80,
          borderRadius: 40,
          backgroundColor: chiikawa ? 'rgba(232, 123, 160, 0.20)' : 'rgba(245, 158, 11, 0.18)',
          backgroundImage: Platform.OS === 'web' ? `radial-gradient(closest-side, ${chiikawa ? 'rgba(232, 123, 160, 0.20)' : 'rgba(245, 158, 11, 0.18)'}, transparent)` : undefined,
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: -15,
          right: '10%',
          width: 260,
          height: 70,
          borderRadius: 35,
          backgroundColor: chiikawa ? 'rgba(214, 94, 134, 0.24)' : 'rgba(139, 108, 240, 0.22)',
          backgroundImage: Platform.OS === 'web' ? `radial-gradient(closest-side, ${chiikawa ? 'rgba(214, 94, 134, 0.24)' : 'rgba(139, 108, 240, 0.22)'}, transparent)` : undefined,
        }}
      />

      {/*
        Điện thoại: MỘT hàng cao 52px thay cho khối 3 hàng ~230px (trước đây banner
        ăn gần 1/3 màn hình trước khi thấy nội dung). Nút ≥ 44px để bấm bằng ngón cái.
      */}
      {compact ? (
      <View className="flex-row items-center gap-2 pl-3" style={{ minHeight: 52 }}>
        <Icon name="gift" size={18} color={chiikawa ? '#F7B8CC' : '#FBBF24'} />
        <Pressable
          onPress={handleOpenZalo}
          accessibilityRole="link"
          accessibilityLabel={L('Nhắn Zalo ngay để nhận gói Max 2 tháng', 'Message on Zalo now to get 2 months of Max')}
          className="min-w-0 flex-1 justify-center"
          style={{ minHeight: 44 }}
        >
          <Text className={`text-[13px] font-strong leading-tight ${chiikawa ? 'text-pink-200' : 'text-amber-200'}`} numberOfLines={2}>
            {L('Gói MAX 2 tháng miễn phí', '2 months of MAX free')}
            <Text className="font-mid text-white">{L(' · nhắn Zalo để nhận', ' · message us on Zalo')}</Text>
          </Text>
        </Pressable>
        <Pressable
          onPress={handleCopyPhone}
          accessibilityRole="button"
          accessibilityLabel={L('Sao chép số Zalo 0921247247', 'Copy Zalo number 0921247247')}
          className="items-center justify-center rounded-lg bg-white/10 px-3 active:opacity-70"
          style={{ minHeight: 44 }}
        >
          <Text className={`text-[13px] font-semi ${copied ? 'text-green-300' : 'text-slate-100'}`}>
            {copied ? L('Đã chép', 'Copied') : L('Chép SĐT', 'Copy')}
          </Text>
        </Pressable>
        <Pressable
          onPress={handleDismiss}
          accessibilityRole="button"
          accessibilityLabel={L('Đóng thông báo ưu đãi', 'Dismiss offer')}
          className="items-center justify-center active:opacity-70"
          style={{ width: 44, height: 44 }}
        >
          <Icon name="close" size={16} color="#F3F0FB" />
        </Pressable>
      </View>
      ) : (
      <View className="mx-auto w-full max-w-7xl flex-row flex-wrap items-center justify-between gap-x-4 gap-y-2.5 px-3.5 py-2.5 sm:px-6">
        {/* Phần thông tin ưu đãi */}
        <View className="flex-1 flex-row items-center gap-3 min-w-[280px]">
          {/* Badge Icon Hộp quà */}
          <LinearGradient
            colors={chiikawa ? (['#E78EAA', '#BD416C'] as const) : (['#F59E0B', '#6A4BD9'] as const)}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: chiikawa ? '0 4px 12px rgba(214, 94, 134, 0.35)' : '0 4px 12px rgba(245, 158, 11, 0.35)',
            }}
          >
            <Icon name="gift" size={18} color={chiikawa ? '#FFFFFF' : '#2B2350'} />
          </LinearGradient>

          {/* Text thông điệp */}
          <View className="flex-1 flex-row flex-wrap items-center gap-x-2 gap-y-0.5">
            <View className={`rounded-full px-2 py-0.5 border ${chiikawa ? 'bg-pink-300/20 border-pink-200/35' : 'bg-amber-400/20 border-amber-300/35'}`}>
              <Text className={`text-[12px] font-strong uppercase tracking-wider ${chiikawa ? 'text-pink-200' : 'text-amber-300'}`}>
                {L('Ưu Đãi Độc Quyền', 'Exclusive offer')}
              </Text>
            </View>
            <Text className="text-[13px] leading-tight text-white">
              {L('Nhắn tin Zalo', 'Message us on Zalo at')}{' '}
              <Text
                className={`font-strong underline cursor-pointer ${chiikawa ? 'text-pink-200' : 'text-amber-300'}`}
                onPress={handleOpenZalo}
              >
                {ZALO_PHONE}
              </Text>{' '}
              {L('để nhận mã mời kích hoạt', 'to get an invite code for')}{' '}
              <Text className={`font-heavy ${chiikawa ? 'text-pink-200' : 'text-amber-200'}`}>
                {L('Gói MAX 2 tháng miễn phí!', '2 months of MAX free!')}
              </Text>
            </Text>
          </View>
        </View>

        {/* Nút hành động */}
        <View className="flex-row items-center gap-2 ml-auto">
          {/* Nút sao chép SĐT */}
          <Pressable
            onPress={handleCopyPhone}
            accessibilityRole="button"
            accessibilityLabel={L('Sao chép số Zalo 0921247247', 'Copy Zalo number 0921247247')}
            className="flex-row items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-2.5 py-1.5 transition-all hover:bg-white/20 active:scale-95"
          >
            <Icon
              name={copied ? 'check' : 'clipboard'}
              size={14}
              color={copied ? '#4ADE80' : '#F3F0FB'}
            />
            <Text className={`text-[12px] font-semi ${copied ? 'text-green-300' : 'text-slate-200'}`}>
              {copied ? L('Đã chép số!', 'Number copied!') : L('Chép SĐT', 'Copy number')}
            </Text>
          </Pressable>

          {/* Nút mở Zalo */}
          <Pressable
            onPress={handleOpenZalo}
            accessibilityRole="button"
            accessibilityLabel={L('Nhắn Zalo ngay để nhận gói Max 2 tháng', 'Message on Zalo now to get 2 months of Max')}
            className="flex-row items-center gap-1.5 rounded-lg px-3 py-1.5 shadow-md shadow-blue-500/25 transition-all hover:brightness-110 active:scale-95"
            style={{
              backgroundColor: chiikawa ? '#C64E79' : '#6A4BD9',
              backgroundImage: Platform.OS === 'web' ? chiikawa ? 'linear-gradient(90deg, #D65E86 0%, #B83D68 100%)' : 'linear-gradient(90deg, #6A4BD9 0%, #6A4BD9 100%)' : undefined,
            }}
          >
            <View
              style={{
                width: 17,
                height: 17,
                borderRadius: 9,
                backgroundColor: '#FFFFFF',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '900', color: chiikawa ? '#B83D68' : '#6A4BD9' }}>Z</Text>
            </View>
            <Text className="text-[12px] font-strong text-white">{L('Nhắn Zalo ngay', 'Message on Zalo')}</Text>
            <Icon name="external" size={12} color="#FFFFFF" />
          </Pressable>

          {/* Nút đóng banner */}
          <Pressable
            onPress={handleDismiss}
            accessibilityRole="button"
            accessibilityLabel={L('Đóng thông báo ưu đãi', 'Dismiss offer')}
            className="ml-1 h-7 w-7 items-center justify-center rounded-full text-slate-300 hover:bg-white/15 hover:text-white active:scale-90"
          >
            <Icon name="close" size={15} color="#F3F0FB" />
          </Pressable>
        </View>
      </View>
      )}
    </View>
  );
}
