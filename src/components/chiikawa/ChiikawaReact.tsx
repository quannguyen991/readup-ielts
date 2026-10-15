import React, { useEffect, useRef, useState } from 'react';
import { Image, Text, View, useWindowDimensions } from 'react-native';

import { useGameFx } from '@/store/useGameFx';
import { CHIIKAWA_IMG, useChiikawaActive, useChiikawaQuiet } from './chiikawa';

/**
 * Chiikawa phản ứng khi trả lời: đúng thì vui (cheer) kèm chip "♥ +XP" hồng,
 * sai hoặc bị đánh thì ló lên mép (peek). Dùng sự kiện đã có trong GameFxLayer.
 */
export function ChiikawaReact() {
  const active = useChiikawaActive();
  const events = useGameFx((s) => s.events);
  const width = useWindowDimensions().width;
  const quiet = useChiikawaQuiet();
  const lastId = useRef(events.at(-1)?.id ?? 0);
  const [shown, setShown] = useState<{ id: number; pose: 'cheer' | 'peek'; text: string | null } | null>(null);

  useEffect(() => {
    const fresh = events.filter((e) => e.id > lastId.current);
    lastId.current = events.at(-1)?.id ?? lastId.current;
    const last = fresh.at(-1);
    if (!last) return;
    if (last.kind === 'hit') setShown({ id: last.id, pose: 'cheer', text: `+${last.xp} XP${last.crit ? ' · chí mạng' : ''}` });
    else if (last.kind === 'defeat' || last.kind === 'levelup') setShown({ id: last.id, pose: 'cheer', text: null });
    else if (last.kind === 'hurt' || last.kind === 'knockout') setShown({ id: last.id, pose: 'peek', text: null });
  }, [events]);

  useEffect(() => {
    if (!shown) return;
    const t = setTimeout(() => setShown(null), 1500);
    return () => clearTimeout(t);
  }, [shown]);

  if (!active || !shown) return null;
  const compact = width < 760;
  // Đang làm bài: Chiikawa nhỏ, mờ, nằm sát góc để không đè lên đáp án.
  const size = quiet ? 84 : compact ? 110 : 150;
  return (
    <View
      pointerEvents="none"
      style={{ position: 'fixed' as 'absolute', right: quiet ? 6 : compact ? 8 : 28, bottom: quiet ? 12 : compact ? 104 : 28, zIndex: 82, alignItems: 'flex-end', gap: 6, opacity: quiet ? 0.5 : 1 }}
    >
      {shown.text ? (
        <View style={{ borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#F3A8BD' }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#C64E79' }}>♥ {shown.text}</Text>
        </View>
      ) : null}
      <Image source={CHIIKAWA_IMG[shown.pose]} resizeMode="contain" style={{ width: size, height: size }} />
    </View>
  );
}
