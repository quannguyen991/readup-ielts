/**
 * TRUNG TÂM TƯƠNG LAI — khu cao ốc chung của mọi người học (nạp động từ
 * `CityGame`). Không thời gian thực: dữ liệu từ `/api/city-hub`, góp xong là
 * thấy tầng mới; "Làm mới" để xem người khác vừa góp gì.
 *
 * Giữa: cảnh 3D dựng bằng đúng bộ sinh hình của thành phố — tháp đã xong đứng
 * nguyên, tháp đang xây có cần cẩu + công nhân và đúng số tầng đã xong, tháp
 * chưa tới lượt mới cắm mốc. Trái: năm tháp và tầng đang thiếu gì. Phải: góp
 * vật liệu, bảng vàng, hoạt động, bảng tin, "Khu của mọi người" (thăm thành
 * phố riêng của từng người — khu riêng của bạn vẫn là thành phố của bạn).
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { router } from 'expo-router';
import { useShallow } from 'zustand/react/shallow';

import { catalogItem } from '@/data/city/catalog';
import { floorShortfall, HUB, HUB_TOWERS, hubProgress, unitsOf, type HubSnapshot } from '@/services/city/hub';
import { hubLayout, hubSites } from '@/services/city/hub-layout';
import { EMPTY_MATERIALS, MATERIAL_INFO, MATERIAL_KINDS, type MaterialKind, type Materials } from '@/services/city/materials';
import { footprint } from '@/services/city/placement';
import { generateBuilding } from '@/services/city/procgen/buildings';
import type { Visual } from '@/services/city/procgen/parts';
import { useAuthStore } from '@/store/useAuthStore';
import { useCityStore } from '@/store/useCityStore';
import { skinOf, useRewardStore } from '@/store/useRewardStore';
import { CityCanvas, type CameraApi, type SceneAnchor, type SceneData } from '../scene/CityScene';
import type { WalkProps } from '../scene/WalkLayer';
import { replayFrames, toVisual } from '../scene/visual';
import { topY } from '../scene/world';
import { useHubSnapshot } from '../useHubSnapshot';
import { EarnSheet } from './EarnSheet';
import { avatarColors } from './Life';
import { MarketSheet } from './Market';
import { Bar, useL } from './common';
import { CG } from './theme';

type Tab = 'give' | 'top' | 'feed' | 'board' | 'districts';
type Toast = { text: string; tone: 'ok' | 'bad' | 'info'; id: number } | null;
const noop = () => {};
/** Điểm nhìn: giữa khu phố trung tâm (toạ độ thế giới x, z — xem `hub-layout.ts`). */
const HUB_FOCUS: [number, number] = [0.5, -11.5];
const NO_ACTIVITY = () => {};

function addM(a: Partial<Materials>, b: Partial<Materials> | null): Materials {
  const out = { ...EMPTY_MATERIALS };
  for (const k of MATERIAL_KINDS) out[k] = (a[k] ?? 0) + (b?.[k] ?? 0);
  return out;
}

function ago(at: string, L: ReturnType<typeof useL>['L']): string {
  const min = Math.max(0, Math.round((Date.now() - new Date(at).getTime()) / 60000));
  if (min < 1) return L({ vi: 'vừa xong', en: 'just now' });
  if (min < 60) return L({ vi: `${min} phút trước`, en: `${min} min ago` });
  const h = Math.round(min / 60);
  if (h < 24) return L({ vi: `${h} giờ trước`, en: `${h} h ago` });
  return new Date(at).toLocaleDateString('vi-VN');
}

function MatChips({ m, size = 14 }: { m: Partial<Materials>; size?: number }) {
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

export default function HubView({ reduced, onBack, onVisit }: { reduced: boolean; onBack: () => void; onVisit: (id: string) => void }) {
  const { L } = useL();
  const token = useAuthStore((s) => s.session?.access_token ?? null);
  const { data, error, loading, refresh, replace } = useHubSnapshot(token);
  const [pending, setPending] = useState<Partial<Materials> | null>(null);
  const [tab, setTab] = useState<Tab>('give');
  const [toast, setToast] = useState<Toast>(null);
  const [sheet, setSheet] = useState<'market' | 'earn' | null>(null);
  const [walking, setWalking] = useState(false);
  const [goal, setGoal] = useState<WalkProps['goal']>(null);
  const [rot, setRot] = useState(0);
  const skin = useRewardStore((s) => s.skin);
  const api = useRef<CameraApi | null>(null);
  const onApi = useCallback((a: CameraApi | null) => {
    api.current = a;
  }, []);
  const [zoom] = useState(() => (typeof window === 'undefined' ? 30 : Math.max(18, Math.min(40, (window.innerWidth - 720) / 29))));
  const say = useCallback((text: string, tone: 'ok' | 'bad' | 'info' = 'info') => setToast({ text, tone, id: Date.now() }), []);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), toast.tone === 'bad' ? 4200 : 3000);
    return () => clearTimeout(id);
  }, [toast]);

  // Tiến độ hiển thị = số máy chủ + phần đang gửi (hiện ngay, trả lại nếu máy chủ từ chối).
  const total = useMemo(() => addM(data?.total ?? {}, pending), [data, pending]);
  const progress = useMemo(() => hubProgress(total), [total]);
  const layout = useMemo(() => hubLayout(), []);
  const sites = useMemo(() => hubSites(layout, progress), [layout, progress]);
  const scene = useMemo<SceneData>(() => ({ terrain: layout.terrain, works: {}, roads: layout.roads, zones: {}, regions: layout.regions, sites, era: 5 }), [layout, sites]);

  // Tháp đang xây: công nhân làm việc lặp lại (tắt khi giảm chuyển động).
  const [loop, setLoop] = useState(0);
  const activeId = progress.current >= 0 ? layout.towers[progress.current]?.id : undefined;
  const replay = useMemo(() => {
    const out: Record<string, Visual[]> = {};
    const site = activeId ? sites.find((s) => s.id === activeId) : undefined;
    if (!site || reduced) return out;
    const to = toVisual(site);
    if (to.stage !== 4) return out;
    const from: Visual = to.floorStep > 0 ? { ...to, floorStep: 0 } : { ...to, floorsDone: Math.max(0, to.floorsDone - 1), floorStep: to.floorsDone > 0 ? 2 : 0 };
    out[site.id] = replayFrames(from, to, catalogItem(site.type)!.stages, 5 + (loop % 2));
    return out;
  }, [activeId, sites, reduced, loop]);
  const onReplayDone = useCallback(() => setLoop((n) => n + 1), []);

  // Nhãn tên tháp bám theo đỉnh phần đã xây.
  const labelRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const heights = useMemo(() => layout.towers.map((s) => generateBuilding(s.type, s.seed, 5).height), [layout]);
  const anchors = useMemo<SceneAnchor[]>(
    () =>
      layout.towers.map((site, i) => {
        const item = catalogItem(site.type)!;
        const [w, d] = footprint(item.size, site.rot);
        const half = layout.terrain.size / 2;
        const p = progress.towers[i];
        const frac = !p ? 1 : p.done ? 1 : Math.max(0.1, p.floorsBuilt / p.floors);
        const y = topY(layout.terrain, {}, site.x, site.y) + heights[i]! * frac + 0.8;
        return { pos: [site.x + w / 2 - half, y, site.y + d / 2 - half] as [number, number, number], el: () => labelRefs.current[site.id] ?? null };
      }),
    [layout, progress, heights],
  );

  const walk = useMemo<WalkProps | null>(
    () => (walking ? { colors: avatarColors(skinOf(skin)), goal, paused: !!sheet, onActivity: NO_ACTIVITY, near: [layout.terrain.size / 2, layout.terrain.size / 2 + 1] } : null),
    [walking, skin, goal, sheet, layout],
  );
  const onTileClick = useCallback((t: [number, number]) => (walking ? setGoal({ tile: t, id: Date.now() }) : undefined), [walking]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) return;
      if (sheet) return;
      const k = e.key.toLowerCase();
      if (k === 'q') setRot((r) => (r + 3) % 4);
      else if (k === 'e') setRot((r) => (r + 1) % 4);
      else if (k === 'h') api.current?.home();
      else if (k === 'escape') onBack();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onBack, sheet]);

  const floorsPct = progress.floorsTotal ? progress.floorsBuilt / progress.floorsTotal : 0;

  return (
    <div className="cg-root">
      <CityCanvas
        data={scene}
        interactive={!sheet}
        showGrid={false}
        showZones={false}
        hover={null}
        preview={null}
        selectedSite={null}
        replay={replay}
        onReplayDone={onReplayDone}
        onHover={noop}
        onTileDown={noop}
        onTileDrag={noop}
        onTileClick={onTileClick}
        paintMode={false}
        trackHover={false}
        rot={rot}
        zoom={zoom}
        onCameraApi={onApi}
        reducedMotion={reduced}
        walk={walk}
        anchors={anchors}
        focus={HUB_FOCUS}
      />

      {layout.towers.map((site, i) => {
        const t = HUB_TOWERS[i]!;
        const p = progress.towers[i];
        return (
          <div
            key={site.id}
            ref={(el) => {
              labelRefs.current[site.id] = el;
            }}
            className={`cg-label${p?.active ? ' active' : ''}`}
            style={{ opacity: 0 }}
            aria-hidden
          >
            {t.glyph} {L(t)}
            <small>{p?.done ? L({ vi: 'Đã xong', en: 'Complete' }) : p?.active ? L({ vi: `Tầng ${p.floorsBuilt + 1}/${p.floors} đang xây`, en: `Building floor ${p.floorsBuilt + 1}/${p.floors}` }) : L({ vi: 'Chờ tới lượt', en: 'Coming next' })}</small>
          </div>
        );
      })}

      {/* Trái: năm tháp */}
      <aside className="cg-panel cg-slide" style={{ position: 'absolute', left: 16, top: 16, bottom: 16, width: 320, padding: 16, display: 'flex', flexDirection: 'column', gap: 10, zIndex: 10 }}>
        <button className="cg-btn small" style={{ alignSelf: 'flex-start' }} onClick={onBack}>
          ← {L({ vi: 'Về khu của tôi', en: 'Back to my district' })}
        </button>
        <h1 className="cg-x" style={{ margin: 0, fontSize: 22, lineHeight: 1.2 }}>🏗️ {L({ vi: 'Trung tâm Tương lai', en: 'Future Centre' })}</h1>
        <span className="cg-muted" style={{ fontSize: 14 }}>
          {L({
            vi: 'Khu cao ốc chung của mọi người học. Mỗi người góp vật liệu, cả cộng đồng cùng lên tầng. Thành phố của bạn là khu riêng.',
            en: "Everyone's shared downtown. Each learner donates materials and the towers rise together. Your own city is your private district.",
          })}
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span className="cg-row" style={{ justifyContent: 'space-between', fontSize: 14 }}>
            <span className="cg-b">{L({ vi: `${progress.floorsBuilt}/${progress.floorsTotal} tầng`, en: `${progress.floorsBuilt}/${progress.floorsTotal} floors` })}</span>
            <span className="cg-muted">{data ? L({ vi: `${data.people} người đã góp`, en: `${data.people} contributors` }) : ''}</span>
          </span>
          <Bar value={floorsPct} color={CG.ok} label={L({ vi: 'Tiến độ cả khu', en: 'Overall progress' })} />
        </div>
        <div className="cg-scroll" style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0 }}>
          {HUB_TOWERS.map((t, i) => {
            const p = progress.towers[i]!;
            const miss = floorShortfall(p);
            return (
              <div key={t.id} className={`cg-card${p.active ? ' on' : ''}`} style={{ cursor: 'default', flexDirection: 'column', gap: 6, opacity: !p.active && !p.done ? 0.7 : 1 }}>
                <span className="cg-row" style={{ width: '100%' }}>
                  <span aria-hidden style={{ fontSize: 22 }}>{t.glyph}</span>
                  <span className="cg-b" style={{ flex: 1 }}>{L(t)}</span>
                  <span className="cg-muted" style={{ fontSize: 14 }}>{p.done ? '✅' : `${p.floorsBuilt}/${p.floors}`}</span>
                </span>
                <span style={{ width: '100%' }}>
                  <Bar value={p.done ? 1 : (p.floorsBuilt + (p.floor?.fraction ?? 0)) / p.floors} color={p.done ? CG.ok : undefined} />
                </span>
                {p.active && p.floor ? (
                  <span style={{ fontSize: 14, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span className="cg-muted">{L({ vi: `Tầng ${p.floorsBuilt + 1}: đã có / cần`, en: `Floor ${p.floorsBuilt + 1}: have / need` })}</span>
                    <span className="cg-row" style={{ gap: 8, flexWrap: 'wrap' }}>
                      {MATERIAL_KINDS.filter((k) => (p.floor!.need[k] ?? 0) > 0).map((k) => (
                        <span key={k} className="cg-b" style={{ color: (miss[k] ?? 0) > 0 ? CG.bad : CG.ok, whiteSpace: 'nowrap' }} title={L(MATERIAL_INFO[k])}>
                          {MATERIAL_INFO[k].glyph} {p.floor!.have[k] ?? 0}/{p.floor!.need[k]}
                        </span>
                      ))}
                    </span>
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
        <div className="cg-row" style={{ gap: 6 }}>
          <button className={`cg-btn small${walking ? ' primary' : ''}`} onClick={() => setWalking((w) => !w)}>
            🚶 {L({ vi: walking ? 'Thôi dạo' : 'Dạo quảng trường', en: walking ? 'Stop strolling' : 'Stroll the plaza' })}
          </button>
          <button className="cg-btn small ghost" onClick={refresh} disabled={loading}>
            ↻ {loading ? L({ vi: 'Đang tải…', en: 'Loading…' }) : L({ vi: 'Làm mới', en: 'Refresh' })}
          </button>
        </div>
      </aside>

      {/* Phải: góp, bảng vàng, hoạt động, bảng tin, khu mọi người */}
      <aside className="cg-panel cg-slide" style={{ position: 'absolute', right: 16, top: 16, bottom: 16, width: 380, padding: 16, display: 'flex', flexDirection: 'column', gap: 10, zIndex: 10 }}>
        <div className="cg-row" role="tablist" style={{ gap: 2, flexWrap: 'wrap' }}>
          {(
            [
              ['give', { vi: 'Góp', en: 'Donate' }],
              ['top', { vi: 'Bảng vàng', en: 'Top' }],
              ['feed', { vi: 'Hoạt động', en: 'Activity' }],
              ['board', { vi: 'Bảng tin', en: 'Board' }],
              ['districts', { vi: 'Các khu', en: 'Districts' }],
            ] as [Tab, { vi: string; en: string }][]
          ).map(([id, label]) => (
            <button key={id} role="tab" aria-selected={tab === id} className={`cg-tab${tab === id ? ' on' : ''}`} onClick={() => setTab(id)}>
              {L(label)}
            </button>
          ))}
        </div>
        {error && !data ? <span className="cg-muted">{L({ vi: `Không tải được Trung tâm: ${error}`, en: `Could not load the Centre: ${error}` })}</span> : null}
        <div className="cg-scroll" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {tab === 'give' ? (
            <GiveTab
              data={data}
              token={token}
              current={progress.current >= 0 ? progress.towers[progress.current] : undefined}
              onPending={setPending}
              onDone={replace}
              say={say}
              onMarket={() => setSheet('market')}
              onEarn={() => setSheet('earn')}
            />
          ) : null}
          {tab === 'top' ? <TopTab data={data} /> : null}
          {tab === 'feed' ? <FeedTab data={data} /> : null}
          {tab === 'board' ? <BoardTab data={data} token={token} onDone={replace} say={say} /> : null}
          {tab === 'districts' ? <DistrictsTab data={data} onVisit={onVisit} onMine={onBack} /> : null}
        </div>
      </aside>

      {toast ? (
        <div key={toast.id} className={`cg-toast ${toast.tone}`} role={toast.tone === 'bad' ? 'alert' : 'status'}>
          <span aria-hidden>{toast.tone === 'bad' ? '⛔' : toast.tone === 'ok' ? '✅' : 'ℹ️'}</span>
          <span>{toast.text}</span>
        </div>
      ) : null}
      {sheet === 'market' ? <MarketSheet onClose={() => setSheet(null)} onEarn={() => setSheet('earn')} toast={say} /> : null}
      {sheet === 'earn' ? <EarnSheet onClose={() => setSheet(null)} onMarket={() => setSheet('market')} /> : null}
    </div>
  );
}

// ------------------------------------------------------------------ góp vật liệu

function GiveTab({
  data,
  token,
  current,
  onPending,
  onDone,
  say,
  onMarket,
  onEarn,
}: {
  data: HubSnapshot | null;
  token: string | null;
  current: ReturnType<typeof hubProgress>['towers'][number] | undefined;
  onPending: (m: Partial<Materials> | null) => void;
  onDone: (d: HubSnapshot) => void;
  say: (text: string, tone?: 'ok' | 'bad' | 'info') => void;
  onMarket: () => void;
  onEarn: () => void;
}) {
  const { L } = useL();
  const inventory = useCityStore(useShallow((s) => s.inventory));
  const [amounts, setAmounts] = useState<Materials>({ ...EMPTY_MATERIALS });
  const [busy, setBusy] = useState(false);
  const room = data?.me?.room ?? HUB.dailyUnitCap;
  const units = unitsOf(amounts);
  const set = (k: MaterialKind, n: number) => setAmounts((a) => ({ ...a, [k]: Math.max(0, Math.min(inventory[k], HUB.maxPerKind, Number.isFinite(n) ? Math.floor(n) : 0)) }));
  const suggest = () => {
    const miss = floorShortfall(current);
    const next = { ...EMPTY_MATERIALS };
    for (const k of MATERIAL_KINDS) next[k] = Math.min(inventory[k], miss[k] ?? 0);
    setAmounts(next);
  };
  const submit = async () => {
    if (!token) return say(L({ vi: 'Cần đăng nhập để góp — tiến độ thì ai cũng xem được.', en: 'Sign in to donate — anyone can watch the progress.' }), 'info');
    setBusy(true);
    onPending(amounts);
    const r = await useCityStore.getState().contributeToHub(amounts, token);
    onPending(null);
    setBusy(false);
    if (r.ok) {
      if (r.hub) onDone(r.hub);
      setAmounts({ ...EMPTY_MATERIALS });
      say(L({ vi: `Đã góp ${unitsOf(r.given)} vật liệu cho Trung tâm. Cảm ơn bạn!`, en: `Donated ${unitsOf(r.given)} materials to the Centre. Thank you!` }), 'ok');
      return;
    }
    const why: Record<string, string> = {
      auth: L({ vi: 'Phiên đăng nhập đã hết — đăng nhập lại để góp.', en: 'Your session expired — sign in again to donate.' }),
      materials: r.message ?? L({ vi: 'Kho không đủ số vật liệu này.', en: 'You do not have that many materials.' }),
      offline: L({ vi: 'Mất kết nối — vật liệu vẫn trong kho, thử lại sau.', en: 'Offline — your materials are untouched, try again later.' }),
    };
    say(why[r.reason] ?? r.message ?? L({ vi: 'Không góp được.', en: 'Could not donate.' }), 'bad');
  };

  return (
    <>
      {!token ? (
        <div className="cg-card" style={{ cursor: 'default', flexDirection: 'column', gap: 8, background: CG.warnSoft }}>
          <span style={{ fontSize: 14 }}>{L({ vi: 'Góp vật liệu cần đăng nhập (để máy chủ ghi đúng phần của bạn). Tiến độ thì ai cũng xem được.', en: 'Donating needs you to be signed in (so the server records your share). Anyone can watch the progress.' })}</span>
          <button className="cg-btn primary small" style={{ alignSelf: 'flex-start' }} onClick={() => router.push('/auth/sign-in' as never)}>
            {L({ vi: 'Đăng nhập', en: 'Sign in' })}
          </button>
        </div>
      ) : data?.me ? (
        <div className="cg-row" style={{ gap: 6, flexWrap: 'wrap' }}>
          <span className="cg-chip">🏅 {data.me.rank ? L({ vi: `Hạng ${data.me.rank}`, en: `Rank ${data.me.rank}` }) : L({ vi: 'Chưa góp', en: 'Not yet' })}</span>
          <span className="cg-chip">📦 {L({ vi: `Đã góp ${data.me.units}`, en: `Donated ${data.me.units}` })}</span>
          <span className="cg-chip">📅 {L({ vi: `Hôm nay ${data.me.today}/${HUB.dailyUnitCap}`, en: `Today ${data.me.today}/${HUB.dailyUnitCap}` })}</span>
        </div>
      ) : null}

      {current ? (
        <button className="cg-btn small" onClick={suggest} style={{ alignSelf: 'flex-start' }}>
          🎯 {L({ vi: 'Điền đúng phần tầng đang thiếu', en: 'Fill what the current floor needs' })}
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

      <button className="cg-btn primary" style={{ justifyContent: 'center' }} disabled={busy || units <= 0 || units > room} onClick={() => void submit()}>
        {busy ? L({ vi: 'Đang gửi…', en: 'Sending…' }) : L({ vi: `Góp ${units} vật liệu`, en: `Donate ${units} materials` })}
      </button>
      {units > room ? <span style={{ fontSize: 14, color: CG.bad }}>{L({ vi: `Hôm nay bạn còn góp được ${room}.`, en: `You can donate ${room} more today.` })}</span> : null}
      <span className="cg-muted" style={{ fontSize: 14 }}>
        {L({ vi: `Mỗi người góp tối đa ${HUB.dailyUnitCap} vật liệu mỗi ngày. Vật liệu chỉ rời kho khi máy chủ đã nhận.`, en: `Up to ${HUB.dailyUnitCap} materials per person per day. Materials leave your stock only after the server confirms.` })}
      </span>
      <div className="cg-card" style={{ cursor: 'default', flexDirection: 'column', gap: 8, background: CG.brandSoft }}>
        <span style={{ fontSize: 14 }}>{L({ vi: 'Thiếu vật liệu? Học để nhận vật liệu + sao, hoặc đổi sao ở Chợ.', en: 'Short on materials? Study to earn materials + stars, or swap stars at the market.' })}</span>
        <span className="cg-row" style={{ gap: 6 }}>
          <button className="cg-btn small primary" onClick={onEarn}>📚 {L({ vi: 'Học để nhận', en: 'Study to earn' })}</button>
          <button className="cg-btn small" onClick={onMarket}>🛒 {L({ vi: 'Chợ vật liệu', en: 'Market' })}</button>
        </span>
      </div>
    </>
  );
}

function TopTab({ data }: { data: HubSnapshot | null }) {
  const { L } = useL();
  if (!data) return <span className="cg-muted">{L({ vi: 'Đang tải…', en: 'Loading…' })}</span>;
  if (!data.contributors.length) return <span className="cg-muted">{L({ vi: 'Chưa ai góp. Bạn là người đặt viên gạch đầu tiên!', en: 'Nobody has donated yet. Lay the first brick!' })}</span>;
  const medal = ['🥇', '🥈', '🥉'];
  return (
    <>
      {data.contributors.map((c, i) => {
        const me = data.me?.rank === i + 1;
        return (
          <div key={c.key} className={`cg-card${me ? ' on' : ''}`} style={{ cursor: 'default', alignItems: 'center' }}>
            <span className="cg-x" style={{ width: 30, textAlign: 'center', fontSize: 16 }}>{medal[i] ?? i + 1}</span>
            <span className="cg-b" style={{ flex: 1, minWidth: 0 }}>
              {c.name}
              {me ? <span className="cg-muted" style={{ fontSize: 14 }}> · {L({ vi: 'bạn', en: 'you' })}</span> : null}
            </span>
            <span className="cg-b">{c.units.toLocaleString('vi-VN')}</span>
          </div>
        );
      })}
      {data.me && data.me.rank > data.contributors.length ? (
        <span className="cg-muted" style={{ fontSize: 14 }}>{L({ vi: `Bạn đang hạng ${data.me.rank} với ${data.me.units} vật liệu.`, en: `You are rank ${data.me.rank} with ${data.me.units} materials.` })}</span>
      ) : null}
    </>
  );
}

function FeedTab({ data }: { data: HubSnapshot | null }) {
  const { L } = useL();
  if (!data) return <span className="cg-muted">{L({ vi: 'Đang tải…', en: 'Loading…' })}</span>;
  if (!data.activity.length) return <span className="cg-muted">{L({ vi: 'Chưa có hoạt động.', en: 'No activity yet.' })}</span>;
  return (
    <>
      {data.activity.map((a, i) => (
        <div key={i} className="cg-card" style={{ cursor: 'default', flexDirection: 'column', gap: 4 }}>
          <span className="cg-row" style={{ justifyContent: 'space-between', width: '100%' }}>
            <span className="cg-b" style={{ fontSize: 14 }}>{L({ vi: `${a.name} góp ${a.units}`, en: `${a.name} donated ${a.units}` })}</span>
            <span className="cg-muted" style={{ fontSize: 14 }}>{ago(a.at, L)}</span>
          </span>
          <MatChips m={a.materials} />
        </div>
      ))}
    </>
  );
}

function BoardTab({ data, token, onDone, say }: { data: HubSnapshot | null; token: string | null; onDone: (d: HubSnapshot) => void; say: (t: string, tone?: 'ok' | 'bad' | 'info') => void }) {
  const { L } = useL();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const post = async () => {
    if (!token) return say(L({ vi: 'Đăng nhập để ghi bảng tin.', en: 'Sign in to post on the board.' }), 'info');
    setBusy(true);
    try {
      const r = await fetch('/api/city-hub', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'note', text }) });
      const b = (await r.json().catch(() => ({}))) as { ok?: boolean; error?: string; hub?: HubSnapshot };
      if (!r.ok || !b.ok) say(b.error ?? `Lỗi ${r.status}`, 'bad');
      else {
        if (b.hub) onDone(b.hub);
        setText('');
        say(L({ vi: 'Đã ghi lên bảng tin.', en: 'Posted to the board.' }), 'ok');
      }
    } catch {
      say(L({ vi: 'Mất kết nối — thử lại sau.', en: 'Offline — try again later.' }), 'bad');
    }
    setBusy(false);
  };
  return (
    <>
      <form
        className="cg-row"
        onSubmit={(e) => {
          e.preventDefault();
          void post();
        }}
      >
        <input
          value={text}
          maxLength={HUB.noteMax}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.stopPropagation()}
          placeholder={L({ vi: 'Nhắn cả cộng đồng (tối đa 140 ký tự)', en: 'Message everyone (max 140 chars)' })}
          style={{ flex: 1, minWidth: 0, font: 'inherit', padding: '9px 12px', borderRadius: 12, border: `1px solid ${CG.line}` }}
        />
        <button className="cg-btn primary small" type="submit" disabled={busy || !text.trim()}>
          {L({ vi: 'Ghi', en: 'Post' })}
        </button>
      </form>
      <span className="cg-muted" style={{ fontSize: 14 }}>{L({ vi: `Mỗi người ${HUB.notesPerDay} lời mỗi ngày.`, en: `${HUB.notesPerDay} posts per person per day.` })}</span>
      {data && !data.board.length ? <span className="cg-muted">{L({ vi: 'Bảng tin còn trống.', en: 'The board is empty.' })}</span> : null}
      {data?.board.map((n, i) => (
        <div key={i} className="cg-card" style={{ cursor: 'default', flexDirection: 'column', gap: 2 }}>
          <span>
            <span className="cg-b" style={{ fontSize: 14 }}>{n.name}</span>
            <span className="cg-muted" style={{ fontSize: 14 }}> · {ago(n.at, L)}</span>
          </span>
          <span style={{ fontSize: 15 }}>{n.text}</span>
        </div>
      ))}
    </>
  );
}

function DistrictsTab({ data, onVisit, onMine }: { data: HubSnapshot | null; onVisit: (id: string) => void; onMine: () => void }) {
  const { L } = useL();
  return (
    <>
      <span className="cg-muted" style={{ fontSize: 14 }}>
        {L({ vi: 'Mỗi người có một khu riêng quanh Trung tâm. Ghé thăm, thả tim và ghi sổ lưu bút.', en: 'Everyone has a private district around the Centre. Drop by, like and sign the guestbook.' })}
      </span>
      <button className="cg-card" onClick={onMine} style={{ alignItems: 'center' }}>
        <span aria-hidden style={{ fontSize: 22 }}>🏡</span>
        <span className="cg-b" style={{ flex: 1 }}>{L({ vi: 'Khu của tôi', en: 'My district' })}</span>
        <span className="cg-muted">→</span>
      </button>
      {!data ? <span className="cg-muted">{L({ vi: 'Đang tải…', en: 'Loading…' })}</span> : null}
      {data && !data.districts.length ? <span className="cg-muted">{L({ vi: 'Chưa có khu nào khác.', en: 'No other districts yet.' })}</span> : null}
      {data?.districts.map((c) => (
        <button key={c.id} className="cg-card" style={{ flexDirection: 'column', gap: 4 }} onClick={() => onVisit(c.id)}>
          <span className="cg-b" style={{ fontSize: 15 }}>🏙️ {c.name}</span>
          <span className="cg-row" style={{ gap: 6, flexWrap: 'wrap' }}>
            <span className="cg-muted" style={{ fontSize: 14 }}>{c.owner}</span>
            <span className="cg-chip">{L({ vi: `Kỷ ${c.era}`, en: `Era ${c.era}` })}</span>
            <span className="cg-chip">🏘️ {c.buildings}</span>
            <span className="cg-chip">❤️ {c.likes}</span>
          </span>
        </button>
      ))}
    </>
  );
}
