/**
 * THÔNG BÁO QUÀ CUỐI THÁNG — phủ toàn màn hình ở các trang duyệt (trang chủ,
 * Hôm nay…) khi quà còn nhận được: +2.000 sao và 7 ngày dùng thử Pro, kèm tin
 * mùa sao ×2 (30/09 → 30/10). Luật ở `services/gamification/promo.ts`.
 *
 * - Chỉ hiện sau khi trang hydrate (máy chủ không biết người dùng đã nhận chưa).
 * - "Để sau" ẩn tới lần mở app kế tiếp; quà vẫn còn tới hết mùa.
 * - Nhận quà: sao ghi vào `prizes` (đồng bộ, gộp lấy max → không nhận hai lần);
 *   vé Pro 7 ngày theo đúng luật vé đổi sao (không đè gói trả phí, cộng dồn nếu
 *   đang có Pro) — mở nội dung, không cộng lượt AI.
 */
import React, { useState } from 'react';
import { Modal, Platform, Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useHydrated } from '@/components/layout/useHydrated';
import { applyStarPass } from '@/lib/billing/star-pass';
import { dateKey } from '@/services/gamification/points';
import { giftAvailable, PROMO } from '@/services/gamification/promo';
import { formatStars } from '@/services/gamification/shop';
import { useBillingStore } from '@/store/useBillingStore';
import { useGameFx } from '@/store/useGameFx';
import { useRewardStore } from '@/store/useRewardStore';

/** "Để sau" trong phiên này (mở lại app thì hiện lại tới khi nhận). */
let snoozed = false;

/** Ngày hôm nay; bản dev cho phép thử bằng `?promoDate=YYYY-MM-DD`. */
function todayKey(): string {
  if (__DEV__ && Platform.OS === 'web' && typeof window !== 'undefined') {
    const m = window.location.search.match(/[?&]promoDate=(\d{4}-\d{2}-\d{2})/);
    if (m) return m[1]!;
  }
  return dateKey(new Date());
}

const GOLD = '#FACC15';

export function PromoGiftOverlay() {
  const hydrated = useHydrated();
  const prizes = useRewardStore((s) => s.prizes);
  const claimPrize = useRewardStore((s) => s.claimPrize);
  const [hidden, setHidden] = useState(snoozed);
  const [done, setDone] = useState<null | { pro: string | null }>(null);

  const available = hydrated && giftAvailable(todayKey(), prizes);
  if (!hydrated || hidden || (!available && !done)) return null;

  const claim = () => {
    if (!claimPrize(PROMO.id, PROMO.giftStars)) {
      setHidden(true);
      return;
    }
    const billing = useBillingStore.getState();
    const pass = applyStarPass({ plan: billing.plan, expiresAt: billing.expiresAt, source: billing.source }, { id: 'pro', days: PROMO.proDays });
    let proUntil: string | null = null;
    if (pass.ok) {
      billing.setPlanLocally(pass.plan, pass.expiresAt);
      proUntil = new Date(pass.expiresAt).toLocaleDateString('vi-VN');
    }
    useGameFx.getState().push({ kind: 'stars', amount: PROMO.giftStars, reason: 'quà cuối tháng' });
    setDone({ pro: proUntil });
  };

  const later = () => {
    snoozed = true;
    setHidden(true);
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={done ? () => setHidden(true) : later}>
      <View style={{ flex: 1, backgroundColor: 'rgba(12,10,40,0.72)', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <View
          accessibilityRole="none"
          aria-modal
          style={{ width: '100%', maxWidth: 520, borderRadius: 28, overflow: 'hidden', backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 30 }}
        >
          <LinearGradient colors={['#4A7FE8', '#7C3AED', '#DB2777']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingHorizontal: 24, paddingTop: 28, paddingBottom: 24, alignItems: 'center' }}>
            <Text style={{ fontSize: 54 }}>{done ? '🎉' : '🎁'}</Text>
            <Text className="font-strong" style={{ marginTop: 6, fontSize: 14, letterSpacing: 1.2, color: '#FDE68A' }}>
              QUÀ CUỐI THÁNG 9 · READUP
            </Text>
            <Text className="font-heavy" style={{ marginTop: 8, fontSize: 30, lineHeight: 36, color: '#FFFFFF', textAlign: 'center' }}>
              {done ? 'Đã nhận quà!' : 'Tặng bạn món quà cuối tháng'}
            </Text>
            <View style={{ marginTop: 16, flexDirection: 'row', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
              <View style={{ borderRadius: 18, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', minWidth: 150 }}>
                <Text className="font-heavy" style={{ fontSize: 28, color: GOLD }}>+{formatStars(PROMO.giftStars)} ⭐</Text>
                <Text className="font-semi" style={{ fontSize: 14, color: '#FFFFFF' }}>sao vào tài khoản</Text>
              </View>
              <View style={{ borderRadius: 18, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', minWidth: 150 }}>
                <Text className="font-heavy" style={{ fontSize: 28, color: '#FFFFFF' }}>{PROMO.proDays} ngày 👑</Text>
                <Text className="font-semi" style={{ fontSize: 14, color: '#FFFFFF' }}>dùng thử gói Pro</Text>
              </View>
            </View>
          </LinearGradient>

          <View style={{ padding: 22, gap: 12 }}>
            <View style={{ flexDirection: 'row', gap: 10, borderRadius: 16, padding: 12, backgroundColor: '#FEF3C7' }}>
              <Text style={{ fontSize: 20 }}>⚡</Text>
              <Text className="font-sans" style={{ flex: 1, fontSize: 14, lineHeight: 21, color: '#78350F' }}>
                <Text className="font-strong">Mùa sao ×2 từ 30/9 đến hết 30/10:</Text> mỗi ngày học được nhân đôi sao, trần mỗi ngày nâng từ 60 lên {PROMO.dailyCap} sao.
              </Text>
            </View>

            {done ? (
              <Text className="font-sans" style={{ fontSize: 14, lineHeight: 21, color: '#334155', textAlign: 'center' }}>
                {done.pro
                  ? `Đã cộng ${formatStars(PROMO.giftStars)} sao. Gói Pro mở tới hết ngày ${done.pro} trên máy này (không cộng thêm lượt AI).`
                  : `Đã cộng ${formatStars(PROMO.giftStars)} sao. Bạn đang dùng gói trả phí nên 7 ngày Pro không cộng thêm vào gói đó.`}
              </Text>
            ) : (
              <Text className="font-sans" style={{ fontSize: 14, lineHeight: 21, color: '#334155', textAlign: 'center' }}>
                Quà nhận được tới hết 30/10, mỗi tài khoản một lần. Sao dùng để đổi nền học, giao diện, linh vật… ở trang Đổi quà.
              </Text>
            )}

            {done ? (
              <Pressable accessibilityRole="button" onPress={() => setHidden(true)} style={{ borderRadius: 16, paddingVertical: 14, alignItems: 'center', backgroundColor: '#4A7FE8' }}>
                <Text className="font-heavy" style={{ fontSize: 16, color: '#FFFFFF' }}>
                  Bắt đầu học
                </Text>
              </Pressable>
            ) : (
              <>
                <Pressable accessibilityRole="button" onPress={claim} style={{ borderRadius: 16, paddingVertical: 14, alignItems: 'center', backgroundColor: GOLD }}>
                  <Text className="font-heavy" style={{ fontSize: 16, color: '#2A1B02' }}>
                    🎁 Nhận quà
                  </Text>
                </Pressable>
                <Pressable accessibilityRole="button" onPress={later} style={{ paddingVertical: 8, alignItems: 'center' }}>
                  <Text className="font-semi" style={{ fontSize: 14, color: '#64748B' }}>
                    Để sau
                  </Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}
