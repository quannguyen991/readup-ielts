/**
 * CHỢ VẬT LIỆU — đổi sao (kiếm từ việc học) lấy vật liệu. Luật ở
 * `economy.ts → exchange`: giá cố định, trần mua mỗi ngày từng loại, cả đơn
 * thành công hoặc không gì cả; store trừ sao TRƯỚC rồi mới cộng kho.
 */
import React, { useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { boughtToday, ECONOMY, exchangeCost } from '@/services/city/economy';
import { MATERIAL_INFO, MATERIAL_KINDS, type MaterialKind, type Materials } from '@/services/city/materials';
import { vnToday } from '@/services/gamification/golden';
import { useCityStore } from '@/store/useCityStore';
import { useStarBalance } from '@/store/useStarBalance';
import { Modal } from './EarnSheet';
import { useL } from './common';
import { CG } from './theme';

type Toast = (text: string, tone?: 'ok' | 'bad' | 'info') => void;

function clampOrder(want: Partial<Materials> | undefined, room: Materials): Materials {
  const out = { wood: 0, stone: 0, brick: 0, steel: 0, glass: 0 };
  for (const k of MATERIAL_KINDS) out[k] = Math.max(0, Math.min(room[k], Math.floor(want?.[k] ?? 0)));
  return out;
}

export function MarketSheet({ want, onClose, onEarn, toast }: { want?: Partial<Materials>; onClose: () => void; onEarn: (k?: MaterialKind) => void; toast: Toast }) {
  const { L, locale } = useL();
  const { inventory, ledger } = useCityStore(useShallow((s) => ({ inventory: s.inventory, ledger: s.ledger })));
  const stars = useStarBalance();
  const day = vnToday(new Date()).key;
  const bought = useMemo(() => boughtToday({ ledger }, day), [ledger, day]);
  const room = useMemo(() => {
    const r = { ...bought };
    for (const k of MATERIAL_KINDS) r[k] = Math.max(0, ECONOMY.exchange.dailyCap[k] - bought[k]);
    return r;
  }, [bought]);
  const [order, setOrder] = useState<Materials>(() => clampOrder(want, room));
  const cost = exchangeCost(order);
  const units = MATERIAL_KINDS.reduce((s, k) => s + order[k], 0);
  const short = cost > stars;
  const fmt = (n: number) => n.toLocaleString(locale === 'en' ? 'en-US' : 'vi-VN');

  const setQty = (k: MaterialKind, n: number) => setOrder((o) => ({ ...o, [k]: Math.max(0, Math.min(room[k], Number.isFinite(n) ? Math.floor(n) : 0)) }));

  const buy = () => {
    const r = useCityStore.getState().buyMaterials(order, stars);
    if (r.ok) {
      const list = MATERIAL_KINDS.filter((k) => order[k] > 0).map((k) => `${order[k]} ${MATERIAL_INFO[k].glyph}`).join(', ');
      toast(L({ vi: `Đã đổi ${fmt(r.cost)}⭐ lấy ${list}.`, en: `Swapped ${fmt(r.cost)}⭐ for ${list}.` }), 'ok');
      setOrder({ wood: 0, stone: 0, brick: 0, steel: 0, glass: 0 });
      if (want) onClose();
      return;
    }
    const why =
      r.reason === 'stars'
        ? L({ vi: `Chưa đủ sao: cần ${fmt(r.cost)}⭐, đang có ${fmt(stars)}⭐. Học thêm để có sao.`, en: `Not enough stars: need ${fmt(r.cost)}⭐, you have ${fmt(stars)}⭐. Study to earn more.` })
        : r.reason === 'capped'
          ? L({ vi: 'Vượt trần đổi hôm nay của một loại — giảm số lượng.', en: "Over today's swap cap for one material — lower the amount." })
          : L({ vi: 'Chọn số lượng muốn đổi.', en: 'Pick an amount to swap.' });
    toast(why, 'bad');
  };

  return (
    <Modal title={L({ vi: '🛒 Chợ vật liệu', en: '🛒 Materials market' })} onClose={onClose} width={760}>
      <div className="cg-row" style={{ justifyContent: 'space-between', flexWrap: 'wrap', marginBottom: 10 }}>
        <span className="cg-muted" style={{ fontSize: 14, maxWidth: 480 }}>
          {L({
            vi: 'Đổi sao lấy vật liệu khi còn thiếu vài viên. Mỗi loại có trần đổi mỗi ngày — học vẫn là đường chính.',
            en: 'Swap stars for materials when you are a few short. Each material has a daily swap cap — studying is still the main road.',
          })}
        </span>
        <span className="cg-chip" style={{ background: CG.warnSoft, color: CG.warn, fontSize: 16 }} aria-label={L({ vi: `Số sao: ${stars}`, en: `Stars: ${stars}` })}>
          ⭐ {fmt(stars)}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {MATERIAL_KINDS.map((k) => {
          const info = MATERIAL_INFO[k];
          const price = ECONOMY.exchange.price[k];
          const cap = ECONOMY.exchange.dailyCap[k];
          const full = room[k] <= 0;
          return (
            <div key={k} className={`cg-card${order[k] > 0 ? ' on' : ''}`} style={{ cursor: 'default', alignItems: 'center' }}>
              <span aria-hidden style={{ fontSize: 26, width: 36, textAlign: 'center' }}>{info.glyph}</span>
              <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span className="cg-b" style={{ fontSize: 16 }}>
                  {L(info)} <span className="cg-muted" style={{ fontSize: 14 }}>· {L({ vi: `kho ${inventory[k]}`, en: `${inventory[k]} in stock` })}</span>
                </span>
                <span className="cg-muted" style={{ fontSize: 14 }}>
                  {L({ vi: `${price}⭐ / viên · hôm nay đã đổi ${bought[k]}/${cap}`, en: `${price}⭐ each · swapped today ${bought[k]}/${cap}` })}
                </span>
              </span>
              <span className="cg-row" style={{ gap: 4 }}>
                <button className="cg-btn small" disabled={order[k] <= 0} onClick={() => setQty(k, order[k] - 1)} aria-label={L({ vi: `Bớt ${info.vi}`, en: `Less ${info.en}` })}>
                  −
                </button>
                <input
                  className="cg-num"
                  type="number"
                  min={0}
                  max={room[k]}
                  value={order[k]}
                  disabled={full}
                  aria-label={L({ vi: `Số ${info.vi} muốn đổi`, en: `${info.en} to swap` })}
                  onChange={(e) => setQty(k, Number(e.target.value))}
                  onKeyDown={(e) => e.stopPropagation()}
                />
                <button className="cg-btn small" disabled={order[k] >= room[k]} onClick={() => setQty(k, order[k] + 1)} aria-label={L({ vi: `Thêm ${info.vi}`, en: `More ${info.en}` })}>
                  +
                </button>
                <button className="cg-btn small ghost" disabled={order[k] >= room[k]} onClick={() => setQty(k, order[k] + 10)}>
                  +10
                </button>
              </span>
            </div>
          );
        })}
      </div>

      <div className="cg-row" style={{ justifyContent: 'space-between', marginTop: 12, flexWrap: 'wrap', gap: 10 }}>
        <span className="cg-b" style={{ fontSize: 16, color: short ? CG.bad : CG.ink }}>
          {units > 0
            ? L({ vi: `${units} vật liệu = ${fmt(cost)}⭐${short ? ` (thiếu ${fmt(cost - stars)}⭐)` : ''}`, en: `${units} materials = ${fmt(cost)}⭐${short ? ` (${fmt(cost - stars)}⭐ short)` : ''}` })
            : L({ vi: 'Chọn số lượng ở trên', en: 'Pick amounts above' })}
        </span>
        <button className="cg-btn primary" disabled={units <= 0 || short} onClick={buy}>
          ⭐ {L({ vi: units > 0 ? `Đổi ${fmt(cost)} sao` : 'Đổi sao', en: units > 0 ? `Swap ${fmt(cost)} stars` : 'Swap stars' })}
        </button>
      </div>

      <div className="cg-card" style={{ cursor: 'default', flexDirection: 'column', gap: 6, marginTop: 14, background: CG.brandSoft }}>
        <strong className="cg-b" style={{ fontSize: 15 }}>📚 {L({ vi: 'Học để nhận vật liệu + sao', en: 'Study to earn materials + stars' })}</strong>
        {MATERIAL_KINDS.map((k) => (
          <span key={k} style={{ fontSize: 14 }}>
            {MATERIAL_INFO[k].glyph} <b>{L(MATERIAL_INFO[k])}</b> — {L({ vi: MATERIAL_INFO[k].earnVi, en: MATERIAL_INFO[k].earnEn })}
          </span>
        ))}
        <span style={{ fontSize: 14 }}>
          ⭐ <b>{L({ vi: 'Sao', en: 'Stars' })}</b> — {L({ vi: 'thời gian học và số câu làm mỗi ngày (có trần ngày), thưởng trận đấu, thưởng hạng tháng.', en: 'daily study time and questions answered (daily cap), battle rewards, monthly rank prizes.' })}
        </span>
        <button className="cg-btn primary small" style={{ alignSelf: 'flex-start' }} onClick={() => onEarn()}>
          {L({ vi: 'Xem nơi học để nhận', en: 'Where to study' })}
        </button>
      </div>
    </Modal>
  );
}
