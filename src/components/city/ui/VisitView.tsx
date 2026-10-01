/**
 * THĂM THÀNH PHỐ BẠN (kiểu Play Together): chọn một thành phố trong danh sách,
 * nhân vật của bạn đi dạo trong đó, câu cá / bắt bọ được, vào nhà xem họ bày
 * gì, bấm thích và ghi sổ lưu bút. Chỉ xem — không sửa gì của người ta.
 * Dữ liệu từ `/api/city-visit` (chỉ phần để ngắm, xem ghi chú ở API).
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import type { Site } from '@/services/city/construction';
import type { Activity, CatchKind, HomeLayout } from '@/services/city/life';
import type { RoadTile } from '@/services/city/placement';
import { generateTerrain, type LandWork } from '@/services/city/terrain';
import type { TerrainKind, ZoneKind } from '@/data/city/catalog';
import { skinOf, useRewardStore } from '@/store/useRewardStore';
import { useAuthStore } from '@/store/useAuthStore';
import { CityCanvas, type SceneData } from '../scene/CityScene';
import type { WalkProps } from '../scene/WalkLayer';
import { HomeRoom } from '../home/HomeRoom';
import { avatarColors, CatchGame, WalkPrompt } from './Life';
import { useL } from './common';
import { CG } from './theme';
import { currentLocale, pick } from '@/i18n/useL';

type CityCard = { id: string; name: string; owner: string; era: number; buildings: number; likes: number };
type Note = { name: string; text: string; at: string };
type CityDetail = {
  id: string;
  owner: string;
  name: string;
  city: { terrain: { kind: TerrainKind; seed: number }; regions: number[]; roads: Record<string, RoadTile>; zones: Record<string, ZoneKind>; works: Record<string, LandWork>; sites: Site[]; era: number };
  home: HomeLayout;
  likes: number;
  liked: boolean;
  mine: boolean;
  notes: Note[];
};

const noop = () => {};

export function VisitView({ reduced, onBack, initial }: { reduced: boolean; onBack: () => void; initial?: string }) {
  const { L } = useL();
  const token = useAuthStore((s) => s.session?.access_token ?? null);
  const [list, setList] = useState<CityCard[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  // Mở thẳng một khu (bấm từ "Khu của mọi người" ở Trung tâm Tương lai).
  const [open, setOpen] = useState<string | null>(initial ?? null);

  useEffect(() => {
    let dead = false;
    fetch('/api/city-visit')
      .then((r) => r.json())
      .then((b: { cities?: CityCard[]; error?: string }) => {
        if (dead) return;
        if (b.cities) setList(b.cities);
        else setErr(b.error ?? pick(currentLocale(), 'Lỗi', 'Error'));
      })
      .catch((e: unknown) => !dead && setErr(e instanceof Error ? e.message : String(e)));
    return () => {
      dead = true;
    };
  }, []);

  if (open) return <VisitCity id={open} token={token} reduced={reduced} onBack={() => setOpen(null)} />;

  return (
    <div className="cg-root" style={{ background: 'linear-gradient(180deg,#DDEBFF,#EEF6EA)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="cg-panel cg-slide" style={{ width: 'min(880px, calc(100% - 48px))', maxHeight: 'calc(100% - 48px)', padding: 22, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="cg-row" style={{ justifyContent: 'space-between' }}>
          <h1 className="cg-x" style={{ margin: 0, fontSize: 26 }}>👥 {L({ vi: 'Đi thăm thành phố bạn học', en: "Visit other learners' cities" })}</h1>
          <button className="cg-btn" onClick={onBack}>
            ← {L({ vi: 'Về thành phố của tôi', en: 'Back to my city' })}
          </button>
        </div>
        <p className="cg-muted" style={{ margin: 0 }}>
          {L({ vi: 'Dạo trong thành phố bạn học, thả tim, ghi sổ lưu bút. Chỉ xem, không sửa được.', en: "Stroll their city, like it, sign the guestbook. View only." })}
        </p>
        <div className="cg-scroll" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10, minHeight: 0 }}>
          {err ? <span className="cg-muted">{L({ vi: `Không tải được danh sách: ${err}`, en: `Could not load the list: ${err}` })}</span> : null}
          {!list && !err ? <span className="cg-muted">{L({ vi: 'Đang tải…', en: 'Loading…' })}</span> : null}
          {list && list.length === 0 ? <span className="cg-muted">{L({ vi: 'Chưa có thành phố nào khác để thăm.', en: 'No other cities to visit yet.' })}</span> : null}
          {list?.map((c) => (
            <button key={c.id} className="cg-card" style={{ display: 'flex', flexDirection: 'column', gap: 4 }} onClick={() => setOpen(c.id)}>
              <span className="cg-b" style={{ fontSize: 16 }}>🏙️ {c.name}</span>
              <span className="cg-muted" style={{ fontSize: 14 }}>{c.owner}</span>
              <span className="cg-row" style={{ gap: 6, flexWrap: 'wrap' }}>
                <span className="cg-chip">{L({ vi: `Kỷ ${c.era}`, en: `Era ${c.era}` })}</span>
                <span className="cg-chip">🏘️ {c.buildings}</span>
                <span className="cg-chip">❤️ {c.likes}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function VisitCity({ id, token, reduced, onBack }: { id: string; token: string | null; reduced: boolean; onBack: () => void }) {
  const { L } = useL();
  const skin = useRewardStore((s) => s.skin);
  const [detail, setDetail] = useState<CityDetail | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [activity, setActivity] = useState<Activity | null>(null);
  const [game, setGame] = useState<CatchKind | null>(null);
  const [home, setHome] = useState(false);
  const [goal, setGoal] = useState<WalkProps['goal']>(null);
  const [text, setText] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [rot, setRot] = useState(0);
  const [zoom] = useState(58);

  useEffect(() => {
    let dead = false;
    fetch(`/api/city-visit?id=${encodeURIComponent(id)}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((r) => r.json())
      .then((b: CityDetail & { error?: string }) => {
        if (dead) return;
        if (b.error) setErr(b.error);
        else setDetail(b);
      })
      .catch((e: unknown) => !dead && setErr(e instanceof Error ? e.message : String(e)));
    return () => {
      dead = true;
    };
  }, [id, token]);

  const data = useMemo<SceneData | null>(() => {
    if (!detail) return null;
    const c = detail.city;
    return { terrain: generateTerrain(c.terrain.kind, c.terrain.seed), works: c.works, roads: c.roads, zones: c.zones, regions: c.regions, sites: c.sites, era: c.era };
  }, [detail]);

  const act = useCallback(() => {
    if (!activity || activity.kind === 'enter') return;
    if (activity.kind === 'fish' || activity.kind === 'bug') setGame(activity.kind);
    else setHome(true);
  }, [activity]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) return;
      if (game || home) return;
      const k = e.key.toLowerCase();
      if (k === 'q') setRot((r) => (r + 3) % 4);
      else if (k === 'e') setRot((r) => (r + 1) % 4);
      else if (k === ' ' || k === 'enter') {
        e.preventDefault();
        act();
      } else if (k === 'escape') onBack();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [act, game, home, onBack]);

  const post = async (body: Record<string, unknown>) => {
    if (!token) return setMsg(L({ vi: 'Đăng nhập để thích và ghi sổ lưu bút.', en: 'Sign in to like and sign the guestbook.' }));
    let r: Response;
    let b: { ok?: boolean; error?: string; likes?: number; liked?: boolean; notes?: Note[] };
    try {
      r = await fetch('/api/city-visit', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...body }) });
      b = (await r.json()) as typeof b;
    } catch {
      return setMsg(L({ vi: 'Mất kết nối — thử lại sau.', en: 'Offline — try again later.' }));
    }
    if (!r.ok || !b.ok) return setMsg(b.error ?? L({ vi: `Lỗi ${r.status}`, en: `Error ${r.status}` }));
    setDetail((d) => (d ? { ...d, likes: b.likes ?? d.likes, liked: b.liked ?? d.liked, notes: b.notes ?? d.notes } : d));
    if (body.action === 'note') {
      setText('');
      setMsg(L({ vi: 'Đã ghi vào sổ lưu bút.', en: 'Signed the guestbook.' }));
    }
  };

  const walk = useMemo<WalkProps | null>(() => {
    if (!data) return null;
    const c = data.sites.length ? data.sites.reduce((a, s) => [a[0] + s.x / data.sites.length, a[1] + s.y / data.sites.length] as [number, number], [0, 0] as [number, number]) : ([20, 20] as [number, number]);
    return { colors: avatarColors(skinOf(skin)), goal, paused: !!game || home, onActivity: setActivity, near: c };
  }, [data, skin, goal, game, home]);

  if (err) {
    return (
      <div className="cg-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="cg-panel" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span>{err}</span>
          <button className="cg-btn" onClick={onBack}>← {L({ vi: 'Quay lại', en: 'Back' })}</button>
        </div>
      </div>
    );
  }
  if (!detail || !data || !walk) return <div className="cg-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span className="cg-muted">{L({ vi: 'Đang mở thành phố…', en: 'Opening the city…' })}</span></div>;

  // Người đi thăm đứng trước cửa nhà ai cũng là "nhà của chủ thành phố".
  const shown = activity?.kind === 'enter' ? null : activity;

  return (
    <div className="cg-root">
      <CityCanvas
        data={data}
        interactive={!game && !home}
        showGrid={false}
        showZones={false}
        hover={null}
        preview={null}
        selectedSite={null}
        replay={{}}
        onReplayDone={noop}
        onHover={noop}
        onTileDown={noop}
        onTileDrag={noop}
        onTileClick={(t) => setGoal({ tile: t, id: Date.now() })}
        paintMode={false}
        trackHover={false}
        rot={rot}
        zoom={zoom}
        reducedMotion={reduced}
        walk={walk}
      />
      <aside className="cg-panel cg-slide" style={{ position: 'absolute', left: 16, top: 16, bottom: 16, width: 330, padding: 18, display: 'flex', flexDirection: 'column', gap: 10, zIndex: 10 }}>
        <button className="cg-btn small" style={{ alignSelf: 'flex-start' }} onClick={onBack}>← {L({ vi: 'Danh sách', en: 'All cities' })}</button>
        <h1 className="cg-x" style={{ margin: 0, fontSize: 22, lineHeight: 1.2 }}>{detail.name}</h1>
        <span className="cg-muted">{L({ vi: `Của ${detail.owner} · Kỷ ${detail.city.era}`, en: `By ${detail.owner} · Era ${detail.city.era}` })}</span>
        <div className="cg-row">
          <button className={`cg-btn${detail.liked ? ' primary' : ''}`} disabled={detail.mine} onClick={() => post({ action: 'like' })}>
            {detail.liked ? '❤️' : '🤍'} {detail.likes}
          </button>
          <button className="cg-btn" onClick={() => setHome(true)}>🏠 {L({ vi: 'Vào nhà', en: 'Visit home' })}</button>
        </div>
        <span className="cg-muted" style={{ fontSize: 14 }}>
          {L({ vi: 'WASD / mũi tên để đi, bấm lên bản đồ để tự đi tới · Q/E xoay · Space làm việc ở chỗ đứng.', en: 'WASD / arrows to walk, click the map to walk there · Q/E rotate · Space to interact.' })}
        </span>
        <strong className="cg-b" style={{ marginTop: 4 }}>📖 {L({ vi: 'Sổ lưu bút', en: 'Guestbook' })}</strong>
        {detail.mine ? null : (
          <form
            className="cg-row"
            onSubmit={(e) => {
              e.preventDefault();
              void post({ action: 'note', text });
            }}
          >
            <input value={text} maxLength={120} onChange={(e) => setText(e.target.value)} placeholder={L({ vi: 'Lời nhắn (tối đa 120 ký tự)', en: 'Your note (max 120 chars)' })} style={{ flex: 1, minWidth: 0, font: 'inherit', padding: '9px 12px', borderRadius: 12, border: `1px solid ${CG.line}` }} />
            <button className="cg-btn primary small" type="submit" disabled={!text.trim()}>{L({ vi: 'Ghi', en: 'Sign' })}</button>
          </form>
        )}
        {msg ? <span className="cg-muted" style={{ fontSize: 14 }}>{msg}</span> : null}
        <div className="cg-scroll" style={{ display: 'flex', flexDirection: 'column', gap: 6, minHeight: 0 }}>
          {detail.notes.length === 0 ? <span className="cg-muted" style={{ fontSize: 14 }}>{L({ vi: 'Chưa có ai ghi. Hãy là người đầu tiên!', en: 'No notes yet. Be the first!' })}</span> : null}
          {detail.notes.map((n, i) => (
            <div key={i} className="cg-card" style={{ cursor: 'default' }}>
              <span className="cg-b" style={{ fontSize: 14 }}>{n.name}</span>
              <span className="cg-muted" style={{ fontSize: 14 }}> · {new Date(n.at).toLocaleDateString('vi-VN')}</span>
              <div style={{ fontSize: 15 }}>{n.text}</div>
            </div>
          ))}
        </div>
      </aside>
      <WalkPrompt activity={shown} onAct={act} />
      {game ? <CatchGame kind={game} onClose={() => setGame(null)} /> : null}
      {home ? <HomeRoom readOnly layout={detail.home} title={L({ vi: `Nhà của ${detail.owner}`, en: `${detail.owner}'s home` })} onClose={() => setHome(false)} /> : null}
    </div>
  );
}
