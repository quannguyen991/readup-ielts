/**
 * Tab "Góp" của Trung tâm Tương lai. Hai đường, cùng một luật ở `services/city`:
 * - ⭐ SAO (mặc định): chọn số sao → tự chia ĐỀU thành vật liệu tầng đang thiếu
 *   (`planStars`) → máy chủ nhận → mới trừ sao (`donateWithStars`). Có chế độ
 *   "Tự chọn" cho ai muốn chia tay từng loại.
 * - 📦 KHO: góp vật liệu đang có (như trước).
 */
import React, { useRef, useState } from 'react';
import { router } from 'expo-router';
import { useShallow } from 'zustand/react/shallow';

import { ECONOMY, exchangeCost, exchangeRoom } from '@/services/city/economy';
import { floorShortfall, HUB, HUB_TOWERS, unitsOf, type HubProgress, type HubSnapshot } from '@/services/city/hub';
import { EMPTY_MATERIALS, MATERIAL_INFO, MATERIAL_KINDS, type MaterialKind, type Materials } from '@/services/city/materials';
import { clampOrder, planStars, spendableStars } from '@/services/city/star-donate';
import { vnToday } from '@/services/gamification/golden';
import { useCityStore } from '@/store/useCityStore';
import { useStarBalance } from '@/store/useStarBalance';
import { useL } from './common';
import { CG } from './theme';

export function MatChips({ m, size = 14 }: { m: Partial<Materials>; size?: number }) {
  const { L } = useL();
  return (
    <span className="cg-row" style={{ gap: 6, flexWrap: 'wrap' }}>
      {MATERIAL_KINDS.filter((k) => (m[k] ?? 0) > 0).map((k) => (
        <span key={k} className="cg-b" style={{ fontSize: size, whiteSpace: 'nowrap' }} title={L(MATERIAL_INFO[k])}>
          {MATERIAL_INFO[k].glyph} {m[k]}
        </span>
      ))}
    </span>
  );
}

type Say = (text: string, tone?: 'ok' | 'bad' | 'info') => void;
type Props = {
  data: HubSnapshot | null;
  token: string | null;
  current: HubProgress['towers'][number] | undefined;
  onPending: (m: Partial<Materials> | null) => void;
  onDone: (d: HubSnapshot) => void;
  say: Say;
  onMarket: () => void;
  onEarn: () => void;
};

export function GiveTab(props: Props) {
  const { L } = useL();
  const { data, token } = props;
  const [mode, setMode] = useState<'stars' | 'stock'>('stars');
  const room = data?.me?.room ?? HUB.dailyUnitCap;
  return (
    <>
      {!token ? (
        <div className="cg-card" style={{ cursor: 'default', alignItems: 'center', gap: 8, background: CG.warnSoft }}>
          <span style={{ flex: 1, fontSize: 14 }}>{L({ vi: 'Đăng nhập để góp.', en: 'Sign in to donate.' })}</span>
          <button className="cg-btn primary small" onClick={() => router.push('/auth/sign-in' as never)}>
            {L({ vi: 'Đăng nhập', en: 'Sign in' })}
          </button>
        </div>
      ) : data?.me ? (
        <div className="cg-row" style={{ gap: 6, flexWrap: 'wrap' }}>
          <span className="cg-chip">🏅 {data.me.rank ? L({ vi: `Hạng ${data.me.rank}`, en: `Rank ${data.me.rank}` }) : L({ vi: 'Chưa góp', en: 'Not yet' })}</span>
          <span className="cg-chip">📦 {L({ vi: `Đã góp ${data.me.units}`, en: `Donated ${data.me.units}` })}</span>
        </div>
      ) : null}

      <div className="cg-row" role="tablist" style={{ gap: 2 }}>
        {(
          [
            ['stars', '⭐ ' + L({ vi: 'Góp bằng sao', en: 'Donate stars' })],
            ['stock', '📦 ' + L({ vi: 'Từ kho', en: 'From stock' })],
          ] as ['stars' | 'stock', string][]
        ).map(([id, label]) => (
          <button key={id} role="tab" aria-selected={mode === id} className={`cg-tab${mode === id ? ' on' : ''}`} onClick={() => setMode(id)}>
            {label}
          </button>
        ))}
      </div>

      {mode === 'stars' ? <StarsPane {...props} room={room} /> : <StockPane {...props} room={room} />}

      <span className="cg-muted" style={{ fontSize: 14 }}>
        {L({ vi: `Hôm nay còn góp được ${room}/${HUB.dailyUnitCap}.`, en: `${room}/${HUB.dailyUnitCap} left to donate today.` })}
      </span>
    </>
  );
}

function failText(L: ReturnType<typeof useL>['L'], r: { reason: string; message?: string; room?: number }): string {
  const why: Record<string, string> = {
    auth: L({ vi: 'Phiên đăng nhập đã hết — đăng nhập lại.', en: 'Session expired — sign in again.' }),
    materials: r.message ?? L({ vi: 'Kho không đủ số vật liệu này.', en: 'Not enough materials in stock.' }),
    offline: L({ vi: 'Mất kết nối — chưa mất gì, thử lại.', en: 'Offline — nothing was spent, try again.' }),
    stars: L({ vi: 'Chưa đủ sao.', en: 'Not enough stars.' }),
    capped: L({ vi: 'Hôm nay hết chỗ đổi loại này — chọn ít hơn.', en: 'Swap cap reached for a material today — pick less.' }),
    daily: L({ vi: `Hôm nay còn góp được ${r.room ?? 0}.`, en: `${r.room ?? 0} left to donate today.` }),
  };
  return why[r.reason] ?? r.message ?? L({ vi: 'Không góp được.', en: 'Could not donate.' });
}

// ------------------------------------------------------------------ ⭐ góp bằng sao

const QUICK = [50, 200, 500];

function StarsPane({ data, token, current, onPending, onDone, say, room, onMarket }: Props & { room: number }) {
  const { L, locale } = useL();
  const stars = useStarBalance();
  const ledger = useCityStore(useShallow((s) => s.ledger));
  const day = vnToday(new Date()).key;
  const swapRoom = exchangeRoom({ ledger }, day);
  const tower = current ? HUB_TOWERS.find((t) => t.id === current.id) : undefined;
  const opts = { room: swapRoom, maxUnits: room, maxPerKind: HUB.maxPerKind };
  const [split, setSplit] = useState<'even' | 'pick'>('even');
  const [amount, setAmount] = useState(200);
  const [picks, setPicks] = useState<Materials>({ ...EMPTY_MATERIALS });
  const [busy, setBusy] = useState(false);
  const retry = useRef<{ id: string; key: string } | null>(null);
  const fmt = (n: number) => n.toLocaleString(locale === 'en' ? 'en-US' : 'vi-VN');

  const maxStars = spendableStars(stars, opts);
  const eff = Math.min(amount, stars);
  const plan = planStars(eff, { ...opts, first: floorShortfall(current), mix: tower?.floorCost });
  const order = split === 'even' ? plan.order : clampOrder(picks, opts);
  const units = unitsOf(order);
  const cost = split === 'even' ? plan.cost : exchangeCost(order);
  const short = cost > stars;
  const setPick = (k: MaterialKind, n: number) => setPicks((p) => ({ ...p, [k]: Math.max(0, Math.min(swapRoom[k], HUB.maxPerKind, Number.isFinite(n) ? Math.floor(n) : 0)) }));

  const submit = async () => {
    if (!token) return router.push('/auth/sign-in' as never);
    setBusy(true);
    onPending(order);
    const key = JSON.stringify(order);
    const r = await useCityStore.getState().donateWithStars(order, stars, token, retry.current?.key === key ? retry.current.id : undefined);
    onPending(null);
    setBusy(false);
    if (r.ok) {
      retry.current = null;
      if (r.hub) onDone(r.hub);
      setPicks({ ...EMPTY_MATERIALS });
      say(L({ vi: `Đã góp ${unitsOf(r.given)} vật liệu bằng ${fmt(r.cost)}⭐. Cảm ơn bạn!`, en: `Donated ${unitsOf(r.given)} materials with ${fmt(r.cost)}⭐. Thank you!` }), 'ok');
      return;
    }
    if (r.reason === 'offline' && r.retryId) retry.current = { id: r.retryId, key };
    say(failText(L, r), 'bad');
  };

  return (
    <>
      <div className="cg-row" style={{ justifyContent: 'space-between' }}>
        <span className="cg-chip" style={{ background: CG.warnSoft, color: CG.warn, fontSize: 15 }}>⭐ {fmt(stars)}</span>
        <span className="cg-row" role="tablist" style={{ gap: 2 }}>
          {(
            [
              ['even', L({ vi: 'Góp đều', en: 'Auto-split' })],
              ['pick', L({ vi: 'Tự chọn', en: 'Pick' })],
            ] as ['even' | 'pick', string][]
          ).map(([id, label]) => (
            <button key={id} role="tab" aria-selected={split === id} className={`cg-tab${split === id ? ' on' : ''}`} onClick={() => setSplit(id)}>
              {label}
            </button>
          ))}
        </span>
      </div>

      {split === 'even' ? (
        <>
          <span className="cg-row" style={{ gap: 4, flexWrap: 'wrap' }}>
            {QUICK.map((n) => (
              <button key={n} className={`cg-btn small${eff === n ? ' primary' : ''}`} disabled={stars < n} onClick={() => setAmount(n)}>
                {n}⭐
              </button>
            ))}
            <button className={`cg-btn small${eff === maxStars && maxStars > 0 && !QUICK.includes(maxStars) ? ' primary' : ''}`} disabled={maxStars <= 0} onClick={() => setAmount(maxStars)}>
              {L({ vi: 'Tối đa', en: 'Max' })}
            </button>
            <input
              className="cg-num"
              type="number"
              min={0}
              max={stars}
              value={eff}
              onChange={(e) => setAmount(Math.max(0, Math.min(stars, Math.floor(Number(e.target.value) || 0))))}
              onKeyDown={(e) => e.stopPropagation()}
              aria-label={L({ vi: 'Số sao muốn góp', en: 'Stars to donate' })}
              style={{ width: 72 }}
            />
          </span>
          <div className="cg-card" style={{ cursor: 'default', flexDirection: 'column', gap: 4, background: CG.brandSoft }} aria-live="polite">
            <span className="cg-b" style={{ fontSize: 15 }}>
              {units > 0 ? L({ vi: `${fmt(plan.cost)} ⭐ → ${units} vật liệu`, en: `${fmt(plan.cost)} ⭐ → ${units} materials` }) : L({ vi: 'Chưa đủ sao hoặc hết chỗ đổi hôm nay.', en: 'Not enough stars, or no swap room left today.' })}
            </span>
            <MatChips m={order} />
          </div>
        </>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {MATERIAL_KINDS.map((k) => {
            const info = MATERIAL_INFO[k];
            const top = Math.min(swapRoom[k], HUB.maxPerKind);
            return (
              <div key={k} className="cg-row" style={{ justifyContent: 'space-between' }}>
                <span style={{ minWidth: 0 }}>
                  <span className="cg-b">
                    {info.glyph} {L(info)}
                  </span>
                  <span className="cg-muted" style={{ fontSize: 14 }}> · {ECONOMY.exchange.price[k]}⭐</span>
                </span>
                <span className="cg-row" style={{ gap: 4 }}>
                  <button className="cg-btn small" disabled={picks[k] <= 0} onClick={() => setPick(k, picks[k] - 5)} aria-label={L({ vi: `Bớt ${info.vi}`, en: `Less ${info.en}` })}>
                    −
                  </button>
                  <input className="cg-num" type="number" min={0} max={top} value={picks[k]} onChange={(e) => setPick(k, Number(e.target.value))} onKeyDown={(e) => e.stopPropagation()} aria-label={L({ vi: `Số ${info.vi} muốn góp`, en: `${info.en} to donate` })} />
                  <button className="cg-btn small" disabled={picks[k] >= top} onClick={() => setPick(k, picks[k] + 5)} aria-label={L({ vi: `Thêm ${info.vi}`, en: `More ${info.en}` })}>
                    +
                  </button>
                </span>
              </div>
            );
          })}
          <span className="cg-b" style={{ fontSize: 14, color: short ? CG.bad : CG.ink }}>
            {L({ vi: `${units} vật liệu = ${fmt(cost)}⭐`, en: `${units} materials = ${fmt(cost)}⭐` })}
          </span>
        </div>
      )}

      <button className="cg-btn primary" style={{ justifyContent: 'center' }} disabled={busy || (!!token && (units <= 0 || short))} onClick={() => void submit()}>
        {busy ? L({ vi: 'Đang gửi…', en: 'Sending…' }) : !token ? L({ vi: 'Đăng nhập để góp', en: 'Sign in to donate' }) : units > 0 ? L({ vi: `Góp ${fmt(cost)}⭐ → ${units} vật liệu`, en: `Donate ${fmt(cost)}⭐ → ${units} materials` }) : L({ vi: 'Góp bằng sao', en: 'Donate stars' })}
      </button>
      <span className="cg-muted" style={{ fontSize: 14 }}>
        {L({ vi: 'Chỉ trừ sao khi máy chủ đã nhận. ', en: 'Stars leave only after the server confirms. ', })}
        <button className="cg-btn ghost small" onClick={onMarket} style={{ padding: '0 4px' }}>
          🛒 {L({ vi: 'Chợ', en: 'Market' })}
        </button>
      </span>
      {data && !data.people ? <span className="cg-muted" style={{ fontSize: 14 }}>{L({ vi: 'Chưa ai góp — bạn đặt viên gạch đầu tiên!', en: 'Nobody yet — lay the first brick!' })}</span> : null}
    </>
  );
}

// ------------------------------------------------------------------ 📦 góp từ kho

function StockPane({ current, token, onPending, onDone, say, room, onEarn }: Props & { room: number }) {
  const { L } = useL();
  const inventory = useCityStore(useShallow((s) => s.inventory));
  const [amounts, setAmounts] = useState<Materials>({ ...EMPTY_MATERIALS });
  const [busy, setBusy] = useState(false);
  const units = unitsOf(amounts);
  const set = (k: MaterialKind, n: number) => setAmounts((a) => ({ ...a, [k]: Math.max(0, Math.min(inventory[k], HUB.maxPerKind, Number.isFinite(n) ? Math.floor(n) : 0)) }));
  const suggest = () => {
    const miss = floorShortfall(current);
    const next = { ...EMPTY_MATERIALS };
    for (const k of MATERIAL_KINDS) next[k] = Math.min(inventory[k], miss[k] ?? 0);
    setAmounts(next);
  };
  const submit = async () => {
    if (!token) return router.push('/auth/sign-in' as never);
    setBusy(true);
    onPending(amounts);
    const r = await useCityStore.getState().contributeToHub(amounts, token);
    onPending(null);
    setBusy(false);
    if (r.ok) {
      if (r.hub) onDone(r.hub);
      setAmounts({ ...EMPTY_MATERIALS });
      say(L({ vi: `Đã góp ${unitsOf(r.given)} vật liệu. Cảm ơn bạn!`, en: `Donated ${unitsOf(r.given)} materials. Thank you!` }), 'ok');
      return;
    }
    say(failText(L, r), 'bad');
  };

  return (
    <>
      {current ? (
        <button className="cg-btn small" onClick={suggest} style={{ alignSelf: 'flex-start' }}>
          🎯 {L({ vi: 'Điền phần tầng đang thiếu', en: 'Fill what the floor needs' })}
        </button>
      ) : null}
      {MATERIAL_KINDS.map((k) => {
        const info = MATERIAL_INFO[k];
        return (
          <div key={k} className="cg-row" style={{ justifyContent: 'space-between' }}>
            <span style={{ minWidth: 0 }}>
              <span className="cg-b">
                {info.glyph} {L(info)}
              </span>
              <span className="cg-muted" style={{ fontSize: 14 }}> · {L({ vi: `kho ${inventory[k]}`, en: `${inventory[k]} in stock` })}</span>
            </span>
            <span className="cg-row" style={{ gap: 4 }}>
              <button className="cg-btn small" disabled={amounts[k] <= 0} onClick={() => set(k, amounts[k] - 5)} aria-label={L({ vi: `Bớt ${info.vi}`, en: `Less ${info.en}` })}>
                −
              </button>
              <input className="cg-num" type="number" min={0} max={inventory[k]} value={amounts[k]} onChange={(e) => set(k, Number(e.target.value))} onKeyDown={(e) => e.stopPropagation()} aria-label={L({ vi: `Số ${info.vi} muốn góp`, en: `${info.en} to donate` })} />
              <button className="cg-btn small" disabled={amounts[k] >= inventory[k]} onClick={() => set(k, amounts[k] + 5)} aria-label={L({ vi: `Thêm ${info.vi}`, en: `More ${info.en}` })}>
                +
              </button>
            </span>
          </div>
        );
      })}
      <button className="cg-btn primary" style={{ justifyContent: 'center' }} disabled={busy || (!!token && (units <= 0 || units > room))} onClick={() => void submit()}>
        {busy ? L({ vi: 'Đang gửi…', en: 'Sending…' }) : !token ? L({ vi: 'Đăng nhập để góp', en: 'Sign in to donate' }) : L({ vi: `Góp ${units} vật liệu`, en: `Donate ${units} materials` })}
      </button>
      <span className="cg-muted" style={{ fontSize: 14 }}>
        {L({ vi: 'Thiếu vật liệu? ', en: 'Short on materials? ' })}
        <button className="cg-btn ghost small" onClick={onEarn} style={{ padding: '0 4px' }}>
          📚 {L({ vi: 'Học để nhận', en: 'Study to earn' })}
        </button>
      </span>
    </>
  );
}
