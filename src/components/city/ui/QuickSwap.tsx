/**
 * ĐỔI SAO MỘT CHẠM — dùng chung cho Chợ vật liệu và màn "Học để nhận":
 * "Đổi 100 ⭐" tự chia đều thành vật liệu (`planStars`), rồi đi qua luật đổi
 * có sẵn (`buyMaterials`: trần ngày, trừ sao trước khi cộng kho).
 */
import React, { useMemo, useState } from 'react';

import { exchangeRoom } from '@/services/city/economy';
import { MATERIAL_INFO, MATERIAL_KINDS, type Materials } from '@/services/city/materials';
import { planStars, spendableStars } from '@/services/city/star-donate';
import { vnToday } from '@/services/gamification/golden';
import { useCityStore } from '@/store/useCityStore';
import { useStarBalance } from '@/store/useStarBalance';
import { useL } from './common';
import { CG } from './theme';

/** Một chạm: "Đổi 100 ⭐" tự chia đều thành vật liệu (ưu tiên phần `want` còn thiếu). */
export function QuickSwap({ want, dense }: { want?: Partial<Materials>; dense?: boolean }) {
  const { L, locale } = useL();
  const stars = useStarBalance();
  const ledger = useCityStore((s) => s.ledger);
  const day = vnToday(new Date()).key;
  const room = useMemo(() => exchangeRoom({ ledger }, day), [ledger, day]);
  const [note, setNote] = useState<{ text: string; ok: boolean } | null>(null);
  const fmt = (n: number) => n.toLocaleString(locale === 'en' ? 'en-US' : 'vi-VN');
  const all = spendableStars(stars, { room });

  const go = (n: number) => {
    const plan = planStars(n, { first: want, room });
    if (plan.units <= 0) return setNote({ ok: false, text: L({ vi: 'Hôm nay hết chỗ đổi hoặc chưa đủ sao.', en: 'No swap room left today, or not enough stars.' }) });
    const r = useCityStore.getState().buyMaterials(plan.order, stars);
    if (!r.ok) return setNote({ ok: false, text: L({ vi: 'Chưa đổi được — thử lại.', en: 'Could not swap — try again.' }) });
    const list = MATERIAL_KINDS.filter((k) => plan.order[k] > 0).map((k) => `${MATERIAL_INFO[k].glyph}${plan.order[k]}`).join(' ');
    setNote({ ok: true, text: `−${fmt(r.cost)}⭐ → ${list}` });
  };

  const amounts = [50, 100, 300];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span className="cg-row" style={{ gap: 6, flexWrap: 'wrap' }}>
        {amounts.map((n) => (
          <button key={n} className={`cg-btn small${dense ? '' : ' primary'}`} disabled={stars < n || all <= 0} onClick={() => go(n)}>
            ⭐ {L({ vi: `Đổi ${n}`, en: `Swap ${n}` })}
          </button>
        ))}
        <button className="cg-btn small" disabled={all <= 0} onClick={() => go(all)}>
          {L({ vi: `Đổi hết (${fmt(all)}⭐)`, en: `Swap all (${fmt(all)}⭐)` })}
        </button>
      </span>
      {note ? (
        <span role="status" style={{ fontSize: 14, color: note.ok ? CG.ok : CG.bad }}>
          {note.text}
        </span>
      ) : null}
    </div>
  );
}
