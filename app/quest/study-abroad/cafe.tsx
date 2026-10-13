import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';

import { TravelPage } from '@/components/travel/ui/TravelPage';
import { GameButton, PixelPanel, T } from '@/components/travel/ui/kit';
import { OpenShopForm } from '@/components/startup/OpenShopForm';
import { CustomRecipeForm } from '@/components/startup/CustomRecipeForm';
import { ServeFlow } from '@/components/startup/ServeFlow';
import { BASE_RECIPES, SHOP_CITIES } from '@/data/startup-menu';
import { SHOP_ORDERS } from '@/data/startup-orders';
import { ordersForCustomRecipes } from '@/services/startup/orders';
import { bi, useL } from '@/i18n/useL';
import { balanceOf } from '@/services/study-abroad/economy';
import { ordersToday, shopBalance, SHOP_RULES } from '@/services/startup/economy';
import { todayKey } from '@/store/persist';
import { useStartupStore } from '@/store/useStartupStore';
import { useStudyAbroadStore } from '@/store/useStudyAbroadStore';

const CITY = SHOP_CITIES[0];

export default function StudyAbroadCafeScreen() {
  const { L, locale } = useL();
  const shop = useStartupStore((state) => state.shops[CITY]);
  const shopLedger = useStartupStore((state) => state.ledger);
  const customRecipes = useStartupStore((state) => state.customRecipes);
  const openShop = useStartupStore((state) => state.openShop);
  const serve = useStartupStore((state) => state.serve);
  const addCustomRecipe = useStartupStore((state) => state.addCustomRecipe);
  const studyLedger = useStudyAbroadStore((state) => state.ledger);
  const [orderIndex, setOrderIndex] = useState(0);

  // Khách gồm ba đơn có sẵn và một đơn cho mỗi món riêng, để món người chơi tạo cũng được gọi.
  const orders = [...SHOP_ORDERS, ...ordersForCustomRecipes(customRecipes)];
  const order = orders[orderIndex % orders.length]!;
  const recipes = [...BASE_RECIPES, ...customRecipes];
  const today = todayKey();

  return (
    <TravelPage title={L('Quán của bạn', 'Your shop')} back="/quest/study-abroad/dorm" backLabel={L('Phòng ký túc xá', 'Dorm room')}>
      <PixelPanel tone="navy" inner={{ padding: 16, gap: 8 }}>
        <Text className="font-heavy" style={{ color: T.goldLight, fontSize: 21 }}>{shop ? bi(shop.name, locale) : L('Chưa có quán', 'No shop yet')}</Text>
        <Text className="font-semi" style={{ color: T.goldLight, fontSize: 13 }}>
          {L(`Số dư đồng du học: ${balanceOf(studyLedger)} · Lãi quán: ${shopBalance(shopLedger)}`, `Study funds: ${balanceOf(studyLedger)} · Shop profit: ${shopBalance(shopLedger)}`)}
        </Text>
        {shop ? <Text className="font-semi" style={{ color: T.cream, fontSize: 13 }}>{L(`Đơn hôm nay: ${ordersToday(shopLedger, today)}/${SHOP_RULES.ordersPerDay}`, `Orders today: ${ordersToday(shopLedger, today)}/${SHOP_RULES.ordersPerDay}`)}</Text> : null}
      </PixelPanel>

      {!shop ? (
        <OpenShopForm onOpen={(nameIndex, colorIndex) => openShop(CITY, nameIndex, colorIndex)} />
      ) : (
        <>
          <View style={{ marginTop: 14, gap: 8 }}>
            <Text className="font-heavy" style={{ color: T.ink, fontSize: 16 }}>{L('Khách đang chờ', 'Customer waiting')}</Text>
            <GameButton label={L('Khách tiếp theo', 'Next customer')} tone="paper" onPress={() => setOrderIndex((i) => i + 1)} />
          </View>
          <ServeFlow key={order.id + orderIndex} order={order} recipes={recipes} onServe={(pick, attemptId) => serve(CITY, order, pick, attemptId)} />

          <PixelPanel tone="paper" style={{ marginTop: 14 }} inner={{ padding: 14, gap: 8 }}>
            <Text className="font-heavy" style={{ color: T.ink, fontSize: 16 }}>{L('Thực đơn', 'Menu')}</Text>
            {recipes.map((item) => (
              <Text key={item.id} className="font-sans" style={{ color: T.ink, fontSize: 13, lineHeight: 19 }}>
                {`${bi(item.name, locale)} — ${item.price} ${L('đồng', 'funds')}${item.custom ? L(' (món riêng)', ' (own recipe)') : ''}`}
              </Text>
            ))}
          </PixelPanel>

          <CustomRecipeForm onCreate={addCustomRecipe} />
        </>
      )}

      <View style={{ marginTop: 14 }}>
        <GameButton label={L('Về phòng ký túc xá', 'Back to dorm')} tone="gold" onPress={() => router.push('/quest/study-abroad/dorm' as never)} />
      </View>
      <View style={{ height: 24 }} />
    </TravelPage>
  );
}
