import React, { useState } from 'react';
import { Text, View } from 'react-native';

import { GameButton, PixelPanel, T } from '@/components/travel/ui/kit';
import { Icon } from '@/components/ui/Icon';
import { useL } from '@/i18n/useL';
import { nextTier, pointsOf, tierState } from '@/services/travel/passport';
import { PRO_MAX_GRANT, TIERS, type RewardGrant } from '@/services/travel/passport-rewards';
import { findItem } from '@/services/gamification/shop';
import { useTravelStore, type ClaimResult } from '@/store/useTravelStore';

/** Tab "Quà": số điểm hộ chiếu, thanh tới mốc kế, các mốc quà theo thứ tự. Số liệu ở `passport-rewards.ts`. */
export function PassportRewards() {
  const { L, en } = useL();
  const ledger = useTravelStore((s) => s.ledger);
  const claim = useTravelStore((s) => s.claimTier);
  const [note, setNote] = useState<{ id: string; res: ClaimResult } | null>(null);
  const points = pointsOf(ledger);
  const next = nextTier(points);
  const prev = [...TIERS].reverse().find((t) => points >= t.points)?.points ?? 0;
  const pct = next ? Math.max(0, Math.min(1, (points - prev) / (next.points - prev))) : 1;

  const grantText = (g: RewardGrant): string => {
    switch (g.kind) {
      case 'stars':
        return L(`${g.amount} sao`, `${g.amount} stars`);
      case 'tickets':
        return L(`${g.amount} vé máy bay`, `${g.amount} plane ticket${g.amount > 1 ? 's' : ''}`);
      case 'coins':
        return L(`${g.amount} xu`, `${g.amount} coins`);
      case 'avatar': {
        const it = findItem(g.itemId);
        return L(`Avatar ${it?.name ?? ''}`.trim(), `Avatar ${it?.glyph ?? ''}`.trim());
      }
      case 'pro':
        return L(`${g.days} ngày Pro`, `${g.days} days of Pro`);
      case 'promax':
        return en ? PRO_MAX_GRANT.label.en : PRO_MAX_GRANT.label.vi;
    }
  };

  return (
    <View style={{ gap: 16 }}>
      <PixelPanel tone="navy" inner={{ padding: 18, gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
          <Text className="font-heavy" style={{ fontSize: 40, color: T.goldLight }}>
            {points}
          </Text>
          <Text className="font-strong" style={{ fontSize: 15, color: T.cream }}>
            {L('điểm hộ chiếu', 'passport points')}
          </Text>
        </View>
        <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(pct * 100) }} style={{ height: 10, borderRadius: 3, backgroundColor: 'rgba(226,200,143,0.2)', overflow: 'hidden' }}>
          <View style={{ width: `${Math.round(pct * 100)}%`, height: '100%', backgroundColor: T.gold }} />
        </View>
        <Text className="font-sans" style={{ fontSize: 14, color: T.cream }}>
          {next ? L(`Còn ${next.points - points} điểm tới mốc kế`, `${next.points - points} points to the next reward`) : L('Bạn đã qua mọi mốc', 'You have passed every milestone')}
        </Text>
      </PixelPanel>

      <View style={{ gap: 10 }} accessibilityRole="list">
        {TIERS.map((t) => {
          const st = tierState(ledger, t, points);
          const res = note?.id === t.id ? note.res : null;
          return (
            <PixelPanel key={t.id} tone={t.top ? 'navy' : 'paper'} inner={{ padding: 14, flexDirection: 'row', alignItems: 'center', gap: 14, flexWrap: 'wrap', opacity: st === 'locked' ? 0.7 : 1 }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: st === 'claimed' ? T.good : st === 'ready' ? T.gold : t.top ? 'rgba(226,200,143,0.2)' : T.paperDeep }}>
                <Icon name={st === 'claimed' ? 'check' : st === 'ready' ? 'gift' : 'lock'} size={20} color={st === 'claimed' ? '#FFFFFF' : st === 'ready' ? T.navy : t.top ? T.goldLight : T.muted} strokeWidth={2.4} />
              </View>
              <View style={{ flex: 1, minWidth: 180 }}>
                <Text className="font-heavy" style={{ fontSize: t.top ? 20 : 17, color: t.top ? T.goldLight : T.ink }}>
                  {t.grants.map(grantText).join(' + ')}
                </Text>
                <Text className="font-sans" style={{ fontSize: 14, color: t.top ? T.cream : T.muted }}>
                  {L(`${t.points} điểm`, `${t.points} points`)}
                </Text>
                {res?.ok && res.pro ? (
                  <Text className="font-strong" style={{ fontSize: 14, color: t.top ? T.goldLight : T.good, marginTop: 2 }}>
                    {res.pro === 'ok'
                      ? L(`Đã mở tới ${new Date(res.proUntil ?? '').toLocaleDateString('vi-VN')}`, `Unlocked until ${new Date(res.proUntil ?? '').toLocaleDateString('en-GB')}`)
                      : L('Bạn đang dùng gói trả phí nên không cộng thêm ngày.', 'You are on a paid plan, so no days were added.')}
                  </Text>
                ) : null}
              </View>
              {st === 'ready' ? <GameButton label={L('Nhận', 'Claim')} icon="gift" onPress={() => setNote({ id: t.id, res: claim(t.id) })} /> : null}
              {st === 'claimed' ? (
                <Text className="font-strong" style={{ fontSize: 14, color: t.top ? T.cream : T.good }}>
                  {L('Đã nhận', 'Claimed')}
                </Text>
              ) : null}
            </PixelPanel>
          );
        })}
      </View>

      <Text className="font-sans" style={{ fontSize: 14, color: T.muted }}>
        {L('Điểm từ: con dấu, địa điểm 2–3 sao, quà lưu niệm, ngày đi du ngoạn và câu đúng.', 'Points come from stamps, 2–3 star places, souvenirs, travel days and correct answers.')}
      </Text>
    </View>
  );
}
