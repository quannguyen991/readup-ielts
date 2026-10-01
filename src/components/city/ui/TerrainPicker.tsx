/**
 * Bước đầu tiên: chọn vùng đất. Ba địa hình sinh bằng seed, xem trước 3D quay
 * chậm, đổi bản khác thoải mái — nhưng chỉ tới khi bắt đầu xây. Không có công
 * trình dựng sẵn: người học bắt đầu trên đất trống.
 */
import React, { useMemo, useState } from 'react';

import type { TerrainKind } from '@/data/city/catalog';
import { generateTerrain, REGIONS_PER_SIDE, terrainStats } from '@/services/city/terrain';
import { CityCanvas, type SceneData } from '../scene/CityScene';
import { CG } from './theme';
import { useL } from './common';

const KINDS: readonly TerrainKind[] = ['plains', 'coast', 'mountain'];
const ALL_REGIONS = Array.from({ length: REGIONS_PER_SIDE * REGIONS_PER_SIDE }, (_, i) => i);
const GLYPH: Record<TerrainKind, string> = { plains: '🌾', coast: '🏖️', mountain: '⛰️' };

function newSeed(): number {
  return Math.floor(Math.random() * 1e9);
}

export function TerrainPicker({ onConfirm, reducedMotion, onSample }: { onConfirm: (kind: TerrainKind, seed: number) => void; reducedMotion: boolean; onSample: () => void }) {
  const { t } = useL();
  const [kind, setKind] = useState<TerrainKind>('plains');
  const [seeds, setSeeds] = useState<Record<TerrainKind, number>>(() => ({ plains: newSeed(), coast: newSeed(), mountain: newSeed() }));
  const terrain = useMemo(() => generateTerrain(kind, seeds[kind]), [kind, seeds]);
  // Xem trước cả vùng đất (không tô tối vùng chưa mở) — đây là lúc chọn đất.
  const data = useMemo<SceneData>(() => ({ terrain, works: {}, roads: {}, zones: {}, regions: ALL_REGIONS, sites: [] }), [terrain]);
  const stats = useMemo(() => {
    const s = terrainStats(terrain);
    const total = terrain.size * terrain.size;
    return { land: Math.round((s.land / total) * 100), water: Math.round((s.water / total) * 100), rock: Math.round((s.rock / total) * 100), steep: s.steep };
  }, [terrain]);
  const zoom = typeof window !== 'undefined' ? Math.max(12, Math.min(window.innerWidth - 420, window.innerHeight * 1.5) / 58) : 16;

  return (
    <div className="cg-root">
      <div style={{ position: 'absolute', inset: 0, left: 380 }}>
        <CityCanvas
          data={data}
          interactive={false}
          showGrid={false}
          showZones={false}
          hover={null}
          preview={null}
          selectedSite={null}
          replay={{}}
          onReplayDone={() => {}}
          onHover={() => {}}
          onTileDown={() => {}}
          onTileDrag={() => {}}
          onTileClick={() => {}}
          paintMode={false}
          rot={0}
          zoom={zoom}
          reducedMotion={reducedMotion}
          autoSpin
        />
      </div>
      <div className="cg-panel cg-slide" style={{ position: 'absolute', left: 20, top: 20, bottom: 20, width: 340, padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <div className="cg-muted cg-b" style={{ fontSize: 14, letterSpacing: 0.4, textTransform: 'uppercase' }}>{t('city.pick.kicker')}</div>
          <h1 className="cg-x" style={{ margin: '4px 0 6px', fontSize: 26, lineHeight: 1.15 }}>{t('city.pick.title')}</h1>
          <p className="cg-muted" style={{ margin: 0 }}>{t('city.pick.lead')}</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }} role="radiogroup" aria-label={t('city.pick.title')}>
          {KINDS.map((k) => (
            <button key={k} className={`cg-card${k === kind ? ' on' : ''}`} role="radio" aria-checked={k === kind} onClick={() => setKind(k)}>
              <span style={{ fontSize: 26, lineHeight: 1.2 }}>{GLYPH[k]}</span>
              <span style={{ flex: 1 }}>
                <span className="cg-b" style={{ display: 'block', fontSize: 16 }}>{t(`city.terrain.${k}` as const)}</span>
                <span className="cg-muted" style={{ display: 'block', fontSize: 14 }}>{t(`city.terrain.${k}.desc` as const)}</span>
              </span>
            </button>
          ))}
        </div>
        <div className="cg-row" style={{ flexWrap: 'wrap', gap: 6 }}>
          <span className="cg-chip">🟩 {t('city.pick.land', { pct: stats.land })}</span>
          <span className="cg-chip">🟦 {t('city.pick.water', { pct: stats.water })}</span>
          {stats.rock > 0 ? <span className="cg-chip">🪨 {t('city.pick.rock', { pct: stats.rock })}</span> : null}
        </div>
        <button className="cg-btn" onClick={() => setSeeds((s) => ({ ...s, [kind]: newSeed() }))}>
          🎲 {t('city.pick.reroll')}
        </button>
        <button className="cg-btn" onClick={onSample}>
          🏙️ {t('city.sample.open')}
        </button>
        <div style={{ flex: 1 }} />
        <p className="cg-muted" style={{ margin: 0, fontSize: 14, padding: '10px 12px', background: CG.warnSoft, borderRadius: 12, color: CG.body }}>
          {t('city.pick.lockNote')}
        </p>
        <button className="cg-btn primary" style={{ justifyContent: 'center', padding: '13px 16px', fontSize: 16 }} onClick={() => onConfirm(kind, seeds[kind])}>
          {t('city.pick.confirm')}
        </button>
      </div>
    </div>
  );
}
