import React, { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { ERA_INFO, type Era } from '@/data/city/catalog';
import { populationOf } from '@/services/city/construction';
import { dailyProgress } from '@/services/city/economy';
import { MATERIAL_INFO, MATERIAL_KINDS, type MaterialKind } from '@/services/city/materials';
import { vnToday } from '@/services/gamification/golden';
import { useCityStore } from '@/store/useCityStore';
import { useStarBalance } from '@/store/useStarBalance';
import { useCityName, useL } from './common';
import { CG } from './theme';

/**
 * Thanh trên: tên thành phố (bấm để đổi), kỷ, dân số, năm vật liệu, nút "+"
 * (Học để nhận) và Chợ vật liệu (đổi sao). Memo + chọn đúng phần store: rê
 * chuột trên bản đồ không làm thanh này render lại.
 */
export const TopBar = React.memo(function TopBar({ onEarn, onMarket, onCredits, onSample }: { onEarn: (kind?: MaterialKind) => void; onMarket: () => void; onCredits: () => void; onSample: () => void }) {
  const { t, L } = useL();
  const { name, era: eraRaw, sites, inv, daily, rename } = useCityStore(
    useShallow((s) => ({ name: s.name, era: s.era, sites: s.sites, inv: s.inventory, daily: s.daily, rename: s.rename })),
  );
  const era = eraRaw as Era;
  const eco = { daily };
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const day = vnToday(new Date()).key;
  const pop = populationOf(sites);
  const shown = useCityName();
  const stars = useStarBalance();

  return (
    <div style={{ position: 'absolute', top: 16, left: 16, right: 16, display: 'flex', gap: 12, alignItems: 'stretch', pointerEvents: 'none', zIndex: 10 }}>
      <div className="cg-panel" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 14px 8px 10px', pointerEvents: 'auto', minWidth: 0 }}>
        <span aria-hidden style={{ fontSize: 28, width: 42, height: 42, borderRadius: 12, background: CG.brandSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {ERA_INFO[era].glyph}
        </span>
        <div style={{ minWidth: 0 }}>
          {editing ? (
            <input
              autoFocus
              value={draft}
              maxLength={40}
              aria-label={t('city.rename')}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={() => {
                rename(draft);
                setEditing(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                if (e.key === 'Escape') setEditing(false);
                e.stopPropagation();
              }}
              style={{ font: 'inherit', fontFamily: CG.fontX, fontSize: 18, border: `2px solid ${CG.brand}`, borderRadius: 8, padding: '1px 6px', width: 220 }}
            />
          ) : (
            <button
              className="cg-btn ghost"
              style={{ padding: '0 4px', fontFamily: CG.fontX, fontSize: 18, borderRadius: 8 }}
              title={t('city.rename')}
              onClick={() => {
                setDraft(name ?? '');
                setEditing(true);
              }}
            >
              {shown} <span aria-hidden style={{ fontSize: 14, opacity: 0.5 }}>✎</span>
            </button>
          )}
          <div className="cg-muted" style={{ fontSize: 14, paddingLeft: 4, whiteSpace: 'nowrap' }}>
            {t('city.eraLine', { era: era, name: L(ERA_INFO[era]) })} · 👥 {t('city.population', { n: pop })}
          </div>
        </div>
      </div>

      <div style={{ flex: 1 }} />

      <div className="cg-panel" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: 8, pointerEvents: 'auto' }}>
        {MATERIAL_KINDS.map((k) => {
          const info = MATERIAL_INFO[k];
          const p = dailyProgress(eco, day, k);
          return (
            <button
              key={k}
              className="cg-btn small"
              onClick={() => onEarn(k)}
              title={`${L(info)} — ${t('city.todayCap', { got: p.got, cap: p.cap })}`}
              aria-label={`${L(info)}: ${inv[k]}. ${t('city.todayCap', { got: p.got, cap: p.cap })}`}
              style={{ minWidth: 70, justifyContent: 'center', fontSize: 16 }}
            >
              <span aria-hidden>{info.glyph}</span>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>{inv[k]}</span>
            </button>
          );
        })}
        <button className="cg-btn primary small" onClick={() => onEarn()} aria-label={t('city.earn.title')} title={t('city.earn.title')} style={{ fontSize: 18, width: 40, justifyContent: 'center' }}>
          +
        </button>
        <button className="cg-btn small" onClick={() => onMarket()} title={L({ vi: 'Đổi sao lấy vật liệu', en: 'Swap stars for materials' })} aria-label={L({ vi: `Chợ: ${stars} sao`, en: `Market: ${stars} stars` })}>
          🛒 ⭐ {stars.toLocaleString('vi-VN')}
        </button>
        <span style={{ width: 1, alignSelf: 'stretch', background: CG.line, margin: '0 2px' }} />
        <button className="cg-btn ghost small" onClick={onSample} title={t('city.sample.title')}>
          🏙️ {t('city.sample.short')}
        </button>
        <button className="cg-btn ghost small" onClick={onCredits} title={t('city.credits.title')}>
          {t('city.credits.short')}
        </button>
      </div>
    </div>
  );
});
