import React, { useState } from 'react';
import { Text, View } from 'react-native';

import { GameButton, PixelPanel, T } from '@/components/travel/ui/kit';
import type { Recipe } from '@/data/startup-menu';
import type { ShopOrder } from '@/data/startup-orders';
import { bi, useL } from '@/i18n/useL';
import { uid } from '@/store/persist';
import type { ServePick } from '@/services/startup/orders';
import type { ServeOutcome } from '@/store/useStartupStore';
import { Chip } from './Chip';

export function ServeFlow({ order, recipes, onServe }: { order: ShopOrder; recipes: readonly Recipe[]; onServe: (pick: ServePick, attemptId: string) => ServeOutcome }) {
  const { L, locale } = useL();
  // Mã lượt gắn với MỘT khách: giữ nguyên qua các lần bấm, nên đơn đã bán không bán lại được (recordSale trả duplicate).
  const [attemptId] = useState(() => uid());
  const [drinkId, setDrinkId] = useState<string | null>(null);
  const [brewChoices, setBrewChoices] = useState<number[]>([]);
  const [replyIndex, setReplyIndex] = useState<number | null>(null);
  const [result, setResult] = useState<ServeOutcome | null>(null);

  const recipe = recipes.find((item) => item.id === drinkId) ?? null;
  const ready = !!recipe && brewChoices.length === recipe.steps.length && brewChoices.every((c) => c >= 0) && replyIndex !== null;

  const pickDrink = (id: string) => {
    const next = recipes.find((item) => item.id === id);
    setDrinkId(id);
    setBrewChoices(next ? next.steps.map(() => -1) : []);
    setResult(null);
  };

  const pickBrew = (step: number, option: number) => setBrewChoices((prev) => prev.map((value, i) => (i === step ? option : value)));

  const submit = () => {
    if (!ready || !drinkId || replyIndex === null) return;
    const outcome = onServe({ drinkId, brewChoices, replyIndex }, attemptId);
    setResult(outcome);
  };

  const message = (o: ServeOutcome) => {
    if (o.reason === 'paid') return L(`Khách hài lòng. Lãi +${o.paid} đồng.`, `The customer is happy. Profit +${o.paid}.`);
    if (o.reason === 'full') return L('Hôm nay đã đủ 12 đơn. Ngày mai quán nhận đơn mới.', 'You have 12 orders today. New orders tomorrow.');
    if (o.reason === 'duplicate') return L('Lượt này đã được ghi.', 'This serve is already recorded.');
    if (o.reason === 'no-shop') return L('Chưa có quán.', 'No shop yet.');
    return L('Khách chưa hài lòng. Đơn sai không có doanh thu, nhưng nguyên liệu đã dùng vẫn bị trừ.', 'The customer is not happy. A wrong order earns nothing, but the ingredients used are still charged.');
  };

  return (
    <PixelPanel tone="paper" style={{ marginTop: 14 }} inner={{ padding: 14, gap: 10 }}>
      <Text className="font-semi" style={{ color: T.muted, fontSize: 12 }}>{bi(order.npc, locale)}</Text>
      <Text className="font-heavy" style={{ color: T.ink, fontSize: 16, lineHeight: 22 }}>{`"${order.line}"`}</Text>
      <Text className="font-semi" style={{ color: T.ink, fontSize: 13 }}>{L('1. Chọn món', '1. Pick the drink')}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {recipes.map((item) => (
          <Chip key={item.id} label={bi(item.name, locale)} selected={drinkId === item.id} onPress={() => pickDrink(item.id)} />
        ))}
      </View>
      {recipe ? (
        <>
          <Text className="font-semi" style={{ color: T.ink, fontSize: 13 }}>{L('2. Pha theo từng bước', '2. Brew step by step')}</Text>
          {recipe.steps.map((step, s) => (
            <View key={`step-${s}`} style={{ gap: 6 }}>
              <Text className="font-semi" style={{ color: T.muted, fontSize: 12 }}>{bi(step.label, locale)}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {step.options.map((option, o) => (
                  <Chip key={`opt-${s}-${o}`} label={bi(option, locale)} selected={brewChoices[s] === o} onPress={() => pickBrew(s, o)} />
                ))}
              </View>
            </View>
          ))}
        </>
      ) : null}
      <Text className="font-semi" style={{ color: T.ink, fontSize: 13 }}>{L('3. Đưa đồ và đáp khách', '3. Serve and reply')}</Text>
      <View style={{ gap: 8 }}>
        {order.replyOptions.map((option, i) => (
          <Chip key={`reply-${i}`} label={option} selected={replyIndex === i} onPress={() => setReplyIndex(i)} />
        ))}
      </View>
      <GameButton label={L('Đưa khách', 'Serve')} tone="gold" onPress={submit} disabled={!ready} />
      {result ? <Text className="font-semi" style={{ color: result.correct ? T.good : T.bad, fontSize: 13, lineHeight: 19 }}>{message(result)}</Text> : null}
    </PixelPanel>
  );
}
