/**
 * Màn "Thành phố mẫu": một đô thị Kỷ 5 dựng sẵn để xem cao ốc, ga tàu, quảng
 * trường... Chỉ xem — không có công cụ xây. Kéo / zoom / xoay như thành phố
 * thật; một tòa kính đang lên tầng với cần cẩu và công nhân.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { sampleCity, sampleStats } from '@/services/city/sample-city';
import { CityCanvas, type CameraApi } from '../scene/CityScene';
import { useSampleCity } from '../scene/useSampleCity';
import { useL } from './common';
import { CG } from './theme';

const noop = () => {};

export function SampleView({ reduced, hasCity, onBack }: { reduced: boolean; hasCity: boolean; onBack: () => void }) {
  const { t } = useL();
  const { data, replay, onReplayDone } = useSampleCity(reduced);
  const stats = sampleStats(sampleCity());
  const [rot, setRot] = useState(0);
  const api = useRef<CameraApi | null>(null);
  const onApi = useCallback((a: CameraApi | null) => {
    api.current = a;
  }, []);
  const [zoom] = useState(() => (typeof window === 'undefined' ? 30 : Math.max(18, Math.min(window.innerWidth - 200, window.innerHeight * 1.6) / 30)));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'q') setRot((r) => (r + 3) % 4);
      else if (k === 'e') setRot((r) => (r + 1) % 4);
      else if (k === 'escape') onBack();
      else if (k === '+' || k === '=') api.current?.zoomBy(1.2);
      else if (k === '-') api.current?.zoomBy(1 / 1.2);
      else if (k === 'h') api.current?.home();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onBack]);

  // Nút camera: chỉ mang TÊN lệnh; lệnh chạy trong trình xử lý sự kiện (không đọc ref lúc render).
  const act = useCallback((k: 'left' | 'right' | 'in' | 'out' | 'home') => {
    if (k === 'left') setRot((r) => (r + 3) % 4);
    else if (k === 'right') setRot((r) => (r + 1) % 4);
    else if (k === 'in') api.current?.zoomBy(1.25);
    else if (k === 'out') api.current?.zoomBy(0.8);
    else api.current?.home();
  }, []);
  const cam = [
    { k: 'left', glyph: '⟲', label: t('city.cam.left') },
    { k: 'right', glyph: '⟳', label: t('city.cam.right') },
    { k: 'in', glyph: '＋', label: t('city.cam.zoomIn') },
    { k: 'out', glyph: '－', label: t('city.cam.zoomOut') },
    { k: 'home', glyph: '⌂', label: t('city.cam.home') },
  ] as const;

  return (
    <div className="cg-root">
      <CityCanvas
        data={data}
        interactive
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
        onTileClick={noop}
        paintMode={false}
        trackHover={false}
        rot={rot}
        zoom={zoom}
        onCameraApi={onApi}
        reducedMotion={reduced}
      />
      <div className="cg-panel cg-slide" style={{ position: 'absolute', left: 16, top: 16, width: 360, padding: 18, display: 'flex', flexDirection: 'column', gap: 10, zIndex: 10 }}>
        <span className="cg-chip" style={{ alignSelf: 'flex-start', background: CG.brandSoft, color: CG.brandDeep }}>
          🏙️ {t('city.sample.badge')}
        </span>
        <h1 className="cg-x" style={{ margin: 0, fontSize: 24, lineHeight: 1.2 }}>{t('city.sample.title')}</h1>
        <p className="cg-muted" style={{ margin: 0 }}>{t('city.sample.lead')}</p>
        <div className="cg-row" style={{ gap: 6, flexWrap: 'wrap' }}>
          <span className="cg-chip">🏢 {t('city.sample.towers', { n: stats.towers })}</span>
          <span className="cg-chip">🏘️ {t('city.sample.buildings', { n: stats.buildings })}</span>
        </div>
        <button className="cg-btn primary" style={{ justifyContent: 'center', padding: '12px 16px' }} onClick={onBack}>
          {hasCity ? t('city.sample.back') : t('city.sample.start')}
        </button>
        <span className="cg-muted" style={{ fontSize: 14 }}>{t('city.sample.hint')}</span>
      </div>
      <div className="cg-panel" role="toolbar" aria-label={t('city.tools')} style={{ position: 'absolute', right: 16, top: 16, padding: 6, display: 'flex', flexDirection: 'column', gap: 4, zIndex: 10 }}>
        {cam.map((c) => (
          <button key={c.glyph} className="cg-tool" style={{ fontSize: 20 }} aria-label={c.label} title={c.label} onClick={() => act(c.k)}>
            <span aria-hidden>{c.glyph}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
