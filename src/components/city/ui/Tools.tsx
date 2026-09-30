import React, { useState } from 'react';

import { CATALOG, ERA_INFO, LAND_WORKS, ROADS, ZONE_INFO, catalogItem, isTower, type Era, type RoadKind, type ZoneKind } from '@/data/city/catalog';
import { totalCost } from '@/services/city/construction';
import { regionCost } from '@/services/city/placement';
import type { LandWork } from '@/services/city/terrain';
import { START_REGIONS } from '@/services/city/terrain';
import { useCityStore } from '@/store/useCityStore';
import { CostRow, roadNeedText, useL, ZoneDot } from './common';
import { CG } from './theme';

export type Tool = 'select' | 'walk' | 'build' | 'road' | 'erase' | 'zone' | 'land' | 'expand';

export const TOOLS: readonly { id: Tool; glyph: string; key: string }[] = [
  { id: 'select', glyph: '🖐️', key: 'V' },
  { id: 'walk', glyph: '🚶', key: 'P' },
  { id: 'build', glyph: '🏗️', key: 'B' },
  { id: 'road', glyph: '🛣️', key: 'G' },
  { id: 'erase', glyph: '🧽', key: 'X' },
  { id: 'zone', glyph: '🗺️', key: 'Z' },
  { id: 'land', glyph: '⛏️', key: 'L' },
  { id: 'expand', glyph: '🧭', key: 'M' },
];

export function ToolRail({ tool, onTool, onRotate, onZoom, onHome }: { tool: Tool; onTool: (t: Tool) => void; onRotate: (dir: 1 | -1) => void; onZoom: (f: number) => void; onHome: () => void }) {
  const { t } = useL();
  const cam: { glyph: string; label: string; key?: string; run: () => void }[] = [
    { glyph: '⟲', label: t('city.cam.left'), key: 'Q', run: () => onRotate(-1) },
    { glyph: '⟳', label: t('city.cam.right'), key: 'E', run: () => onRotate(1) },
    { glyph: '＋', label: t('city.cam.zoomIn'), key: '+', run: () => onZoom(1.25) },
    { glyph: '－', label: t('city.cam.zoomOut'), key: '−', run: () => onZoom(0.8) },
    { glyph: '⌂', label: t('city.cam.home'), key: 'H', run: onHome },
  ];
  return (
    <div className="cg-panel" role="toolbar" aria-orientation="vertical" aria-label={t('city.tools')} style={{ position: 'absolute', left: 16, top: 96, padding: 6, display: 'flex', flexDirection: 'column', gap: 4, zIndex: 12 }}>
      {TOOLS.map((x) => (
        <button key={x.id} className={`cg-tool${tool === x.id ? ' on' : ''}`} aria-pressed={tool === x.id} aria-label={`${t(`city.tool.${x.id}` as const)} (${x.key})`} onClick={() => onTool(x.id)}>
          <span aria-hidden>{x.glyph}</span>
          <span className="cg-key" aria-hidden>{x.key}</span>
          <span className="cg-tip" aria-hidden>{t(`city.tool.${x.id}` as const)}</span>
        </button>
      ))}
      <span style={{ height: 1, background: CG.line, margin: '4px 6px' }} />
      {cam.map((c) => (
        <button key={c.glyph} className="cg-tool" style={{ fontSize: 20 }} aria-label={`${c.label}${c.key ? ` (${c.key})` : ''}`} onClick={c.run}>
          <span aria-hidden>{c.glyph}</span>
          <span className="cg-tip" aria-hidden>{c.label}</span>
        </button>
      ))}
    </div>
  );
}

const optionBox: React.CSSProperties = { position: 'absolute', left: 84, top: 96, width: 320, padding: 14, zIndex: 11, display: 'flex', flexDirection: 'column', gap: 10 };

export function BuildPalette({ picked, onPick, rot }: { picked: string | null; onPick: (type: string | null) => void; rot: number }) {
  const { t, L } = useL();
  const era = useCityStore((s) => s.era);
  const sites = useCityStore((s) => s.sites);
  const inv = useCityStore((s) => s.inventory);
  const [tab, setTab] = useState<Era>(() => Math.min(era, 5) as Era);
  const items = CATALOG.filter((c) => c.era === tab);
  return (
    <div className="cg-panel cg-slide" style={{ ...optionBox, bottom: 16 }}>
      <div className="cg-row" style={{ justifyContent: 'space-between' }}>
        <strong className="cg-x" style={{ fontSize: 17 }}>{t('city.build.title')}</strong>
        <span className="cg-muted" style={{ fontSize: 14 }}>
          <span className="cg-kbd">R</span> {t('city.build.rotate')} · {['↑', '→', '↓', '←'][rot]}
        </span>
      </div>
      <div className="cg-row" role="tablist" style={{ gap: 2, flexWrap: 'wrap' }}>
        {([1, 2, 3, 4, 5] as Era[]).map((e) => (
          <button key={e} role="tab" aria-selected={tab === e} className={`cg-tab${tab === e ? ' on' : ''}`} onClick={() => setTab(e)} title={L(ERA_INFO[e])}>
            {e > era ? '🔒' : ERA_INFO[e].glyph} {e}
          </button>
        ))}
      </div>
      <div className="cg-muted" style={{ fontSize: 14 }}>
        {t('city.eraLine', { era: tab, name: L(ERA_INFO[tab]) })}
        {tab > era ? ` — ${t('city.build.eraLocked', { era: tab })}` : ''}
      </div>
      <div className="cg-scroll" style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, margin: '0 -4px', padding: '0 4px' }}>
        {items.map((it) => {
          const count = sites.filter((s) => s.type === it.id).length;
          const full = it.max !== undefined && count >= it.max;
          const locked = it.era > era;
          const floors = it.floors ? Math.round((it.floors[0] + it.floors[1]) / 2) : 0;
          return (
            <button
              key={it.id}
              className={`cg-card${picked === it.id ? ' on' : ''}${locked || full ? ' locked' : ''}`}
              aria-pressed={picked === it.id}
              disabled={locked}
              onClick={() => onPick(picked === it.id ? null : it.id)}
            >
              <span aria-hidden style={{ fontSize: 26, lineHeight: 1.2, width: 32, textAlign: 'center' }}>{it.glyph}</span>
              <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span className="cg-row" style={{ justifyContent: 'space-between' }}>
                  <span className="cg-b" style={{ fontSize: 15 }}>{L(it)}</span>
                  <span className="cg-muted" style={{ fontSize: 14 }}>{it.size[0]}×{it.size[1]}</span>
                </span>
                <span className="cg-row cg-muted" style={{ fontSize: 14, gap: 6 }}>
                  <ZoneDot zone={it.zone} /> {L(ZONE_INFO[it.zone])}
                  {it.population ? ` · 👥 ${it.population}` : ''}
                  {isTower(it) && it.floors ? ` · ${t('city.build.floors', { a: it.floors[0], b: it.floors[1] })}` : ''}
                </span>
                <CostRow cost={totalCost(it, floors)} have={inv} size={14} />
                <span className="cg-muted" style={{ fontSize: 14 }}>
                  {needLine(t, it.id)}
                  {full ? ` · ${t('city.build.full', { max: it.max ?? 1 })}` : ''}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );

  function needLine(tt: typeof t, id: string): string {
    const it = catalogItem(id)!;
    const parts: string[] = [];
    if (it.place.on === 'waterfront') parts.push(tt('city.need.waterfront'));
    if (it.place.on === 'coast_point') parts.push(tt('city.need.coastPoint'));
    if (it.place.road !== 'none') parts.push(tt('city.need.road', { road: roadNeedText(tt, it) }));
    if (it.place.power) parts.push(tt('city.need.power'));
    if (it.skill) parts.push(tt('city.need.skill'));
    return parts.length ? parts.join(' · ') : tt('city.need.none');
  }
}

export function RoadOptions({ kind, onKind }: { kind: RoadKind; onKind: (k: RoadKind) => void }) {
  const { t, L } = useL();
  const era = useCityStore((s) => s.era);
  const inv = useCityStore((s) => s.inventory);
  return (
    <div className="cg-panel cg-slide" style={optionBox}>
      <strong className="cg-x" style={{ fontSize: 17 }}>{t('city.tool.road')}</strong>
      <p className="cg-muted" style={{ margin: 0, fontSize: 14 }}>{t('city.road.help')}</p>
      {(Object.keys(ROADS) as RoadKind[]).map((k) => {
        const r = ROADS[k];
        const locked = r.era > era;
        return (
          <button key={k} className={`cg-card${kind === k ? ' on' : ''}${locked ? ' locked' : ''}`} disabled={locked} aria-pressed={kind === k} onClick={() => onKind(k)}>
            <span style={{ flex: 1 }}>
              <span className="cg-b" style={{ display: 'block' }}>{L(r)}</span>
              <span className="cg-muted" style={{ fontSize: 14 }}>{locked ? t('city.build.eraLocked', { era: r.era }) : t('city.road.perTile')}</span>
            </span>
            <CostRow cost={r.cost} have={inv} size={14} />
          </button>
        );
      })}
      <p className="cg-muted" style={{ margin: 0, fontSize: 14 }}>{t('city.road.bridge')}</p>
    </div>
  );
}

export function ZoneOptions({ zone, onZone }: { zone: ZoneKind | null; onZone: (z: ZoneKind | null) => void }) {
  const { t, L } = useL();
  return (
    <div className="cg-panel cg-slide" style={optionBox}>
      <strong className="cg-x" style={{ fontSize: 17 }}>{t('city.tool.zone')}</strong>
      <p className="cg-muted" style={{ margin: 0, fontSize: 14 }}>{t('city.zone.help')}</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {(Object.keys(ZONE_INFO) as ZoneKind[]).map((z) => (
          <button key={z} className={`cg-card${zone === z ? ' on' : ''}`} style={{ padding: '8px 10px', alignItems: 'center' }} aria-pressed={zone === z} onClick={() => onZone(z)}>
            <ZoneDot zone={z} size={14} />
            <span style={{ fontSize: 14 }} className="cg-b">{L(ZONE_INFO[z])}</span>
          </button>
        ))}
        <button className={`cg-card${zone === null ? ' on' : ''}`} style={{ padding: '8px 10px', alignItems: 'center' }} aria-pressed={zone === null} onClick={() => onZone(null)}>
          <span aria-hidden>🧽</span>
          <span style={{ fontSize: 14 }} className="cg-b">{t('city.zone.clear')}</span>
        </button>
      </div>
    </div>
  );
}

export function LandOptions({ work, onWork }: { work: LandWork; onWork: (w: LandWork) => void }) {
  const { t, L } = useL();
  const era = useCityStore((s) => s.era);
  const inv = useCityStore((s) => s.inventory);
  return (
    <div className="cg-panel cg-slide" style={optionBox}>
      <strong className="cg-x" style={{ fontSize: 17 }}>{t('city.tool.land')}</strong>
      {(Object.keys(LAND_WORKS) as LandWork[]).map((k) => {
        const w = LAND_WORKS[k];
        const locked = w.era > era;
        return (
          <button key={k} className={`cg-card${work === k ? ' on' : ''}${locked ? ' locked' : ''}`} disabled={locked} aria-pressed={work === k} onClick={() => onWork(k)}>
            <span style={{ flex: 1 }}>
              <span className="cg-b" style={{ display: 'block' }}>{L(w)}</span>
              <span className="cg-muted" style={{ fontSize: 14 }}>{locked ? t('city.build.eraLocked', { era: w.era }) : t(`city.land.${k}.help` as const)}</span>
            </span>
            <CostRow cost={w.cost} have={inv} size={14} />
          </button>
        );
      })}
    </div>
  );
}

export function ExpandOptions() {
  const { t } = useL();
  const regions = useCityStore((s) => s.regions);
  const inv = useCityStore((s) => s.inventory);
  const cost = regionCost(regions.length - START_REGIONS.length);
  return (
    <div className="cg-panel cg-slide" style={optionBox}>
      <strong className="cg-x" style={{ fontSize: 17 }}>{t('city.tool.expand')}</strong>
      <p className="cg-muted" style={{ margin: 0, fontSize: 14 }}>{t('city.expand.help')}</p>
      <div className="cg-row" style={{ justifyContent: 'space-between' }}>
        <span className="cg-b" style={{ fontSize: 14 }}>{t('city.expand.next')}</span>
        <CostRow cost={cost} have={inv} size={14} />
      </div>
      <div className="cg-row" style={{ gap: 12, fontSize: 14 }}>
        <span className="cg-row" style={{ gap: 6 }}>
          <span style={{ width: 14, height: 14, borderRadius: 3, background: '#3AA65D', opacity: 0.6 }} /> {t('city.expand.can')}
        </span>
        <span className="cg-row" style={{ gap: 6 }}>
          <span style={{ width: 14, height: 14, borderRadius: 3, background: '#6B7280', opacity: 0.5 }} /> {t('city.expand.cannot')}
        </span>
      </div>
    </div>
  );
}
