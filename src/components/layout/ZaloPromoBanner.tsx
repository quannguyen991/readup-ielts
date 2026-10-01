import React, { useState } from 'react';
import { Linking, Platform, Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import { Icon } from '@/components/ui/Icon';

const ZALO_PHONE = '0921.247.247';
const ZALO_PHONE_RAW = '0921247247';
const ZALO_LINK = `https://zalo.me/${ZALO_PHONE_RAW}`;
const STORAGE_KEY = 'readup_zalo_max_promo_hidden_at_v2';

/** Đóng banner thì ẩn 3 ngày (localStorage) — ẩn theo phiên thì mở lại web là hiện lại, gây phiền. */
const HIDE_MS = 3 * 86_400_000;

function readHidden(): boolean {
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
    <View className="relative w-full overflow-hidden border-b border-amber-400/30 z-30">
      {/* Nền gradient hoàng gia tinh tế */}
      <LinearGradient
        colors={['#0B1526', '#132139', '#1A2B48']}
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
          backgroundColor: 'rgba(245, 158, 11, 0.18)',
          filter: Platform.OS === 'web' ? 'blur(32px)' : undefined,
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
          backgroundColor: 'rgba(184, 149, 90, 0.22)',
          filter: Platform.OS === 'web' ? 'blur(28px)' : undefined,
        }}
      />

      {/* Nội dung thông báo */}
      <View className="mx-auto w-full max-w-7xl flex-row flex-wrap items-center justify-between gap-x-4 gap-y-2.5 px-3.5 py-2.5 sm:px-6">
        {/* Phần thông tin ưu đãi */}
        <View className="flex-1 flex-row items-center gap-3 min-w-[280px]">
          {/* Badge Icon Hộp quà */}
          <LinearGradient
            colors={['#F59E0B', '#D97706']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.35)',
            }}
          >
            <Icon name="gift" size={18} color="#451A03" />
          </LinearGradient>

          {/* Text thông điệp */}
          <View className="flex-1 flex-row flex-wrap items-center gap-x-2 gap-y-0.5">
            <View className="rounded-full bg-amber-400/20 px-2 py-0.5 border border-amber-300/35">
              <Text className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                Ưu Đãi Độc Quyền
              </Text>
            </View>
            <Text className="text-[13px] leading-tight text-white">
              Nhắn tin Zalo{' '}
              <Text
                className="font-bold text-amber-300 underline cursor-pointer"
                onPress={handleOpenZalo}
              >
                {ZALO_PHONE}
              </Text>{' '}
              để nhận mã mời kích hoạt{' '}
              <Text className="font-extrabold text-amber-200">
                Gói MAX 2 tháng miễn phí!
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
            accessibilityLabel="Sao chép số Zalo 0921247247"
            className="flex-row items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-2.5 py-1.5 transition-all hover:bg-white/20 active:scale-95"
          >
            <Icon
              name={copied ? 'check' : 'clipboard'}
              size={14}
              color={copied ? '#4ADE80' : '#F0EBE2'}
            />
            <Text className={`text-[12px] font-semibold ${copied ? 'text-green-300' : 'text-slate-200'}`}>
              {copied ? 'Đã chép số!' : 'Chép SĐT'}
            </Text>
          </Pressable>

          {/* Nút mở Zalo */}
          <Pressable
            onPress={handleOpenZalo}
            accessibilityRole="button"
            accessibilityLabel="Nhắn Zalo ngay để nhận gói Max 2 tháng"
            className="flex-row items-center gap-1.5 rounded-lg px-3 py-1.5 shadow-md shadow-blue-500/25 transition-all hover:brightness-110 active:scale-95"
            style={{
              backgroundColor: '#9C7A3A',
              backgroundImage: Platform.OS === 'web' ? 'linear-gradient(90deg, #8F6E36 0%, #9C7A3A 100%)' : undefined,
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
              <Text style={{ fontSize: 10, fontWeight: '900', color: '#8F6E36' }}>Z</Text>
            </View>
            <Text className="text-[12px] font-bold text-white">Nhắn Zalo ngay</Text>
            <Icon name="external" size={12} color="#FFFFFF" />
          </Pressable>

          {/* Nút đóng banner */}
          <Pressable
            onPress={handleDismiss}
            accessibilityRole="button"
            accessibilityLabel="Đóng thông báo ưu đãi"
            className="ml-1 h-7 w-7 items-center justify-center rounded-full text-slate-300 hover:bg-white/15 hover:text-white active:scale-90"
          >
            <Icon name="close" size={15} color="#F0EBE2" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}
