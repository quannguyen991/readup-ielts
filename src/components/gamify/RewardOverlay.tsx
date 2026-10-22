import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { FloatText } from '@/components/game/juice';
import { Confetti } from '@/components/motion/Confetti';
import { useGameStore } from '@/store/useGameStore';

/**
 * Thưởng khi làm bài: mỗi lần số sao trong ngày tăng là một dòng "+N sao" nổi lên giữa màn.
 * Từ 5 sao trở lên có pháo giấy. Theo dõi chính số sao nên mọi đường cộng sao đều được báo,
 * không cần sửa từng màn. Lớp này không nhận chạm.
 */
export function RewardOverlay() {
  const stars = useGameStore((s) => s.today.stars);
  const prev = useRef(stars);
  const [pop, setPop] = useState<{ id: number; n: number } | null>(null);

  useEffect(() => {
    const gain = stars - prev.current;
    prev.current = stars;
    if (gain <= 0) return;
    const id = Date.now();
    setPop({ id, n: gain });
    const timer = setTimeout(() => setPop((cur) => (cur && cur.id === id ? null : cur)), 1500);
    return () => clearTimeout(timer);
  }, [stars]);

  if (!pop) return null;
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { zIndex: 90, alignItems: 'center', justifyContent: 'center' }]}>
      {pop.n >= 5 ? <Confetti seed={`reward-${pop.id}`} pieces={70} /> : null}
      <FloatText key={pop.id} text={`+${pop.n} sao`} color="#6A4BD9" size={30} duration={1300} />
    </View>
  );
}
