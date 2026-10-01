/**
 * "Học để nhận" — mỗi loại vật liệu một mảng học, kèm tiến độ trần trong ngày.
 * Học còn cho SAO; sao đổi được vật liệu ở Chợ vật liệu (`Market.tsx`, có trần
 * mỗi ngày). Không có đường trả tiền thật.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { router } from 'expo-router';
import { useShallow } from 'zustand/react/shallow';

import { dailyProgress, ECONOMY } from '@/services/city/economy';
import { MATERIAL_INFO, MATERIAL_KINDS, type MaterialKind, type Materials } from '@/services/city/materials';
import { vnToday } from '@/services/gamification/golden';
import { useCityStore } from '@/store/useCityStore';
import { useStarBalance } from '@/store/useStarBalance';
import { Bar, useL } from './common';
import { CG, prefersReducedMotion } from './theme';

export function Modal({ title, onClose, children, labelledBy, width }: { title: string; onClose: () => void; children: React.ReactNode; labelledBy?: string; width?: number }) {
  const { t } = useL();
  const ref = useRef<HTMLDivElement>(null);
  // Đóng có hoạt cảnh ngắn (mờ + thu nhỏ 140ms); giảm chuyển động thì đóng ngay.
  const [closing, setClosing] = useState(false);
  const close = useCallback(() => {
    if (prefersReducedMotion()) return onClose();
    setClosing(true);
    setTimeout(onClose, 140);
  }, [onClose]);
  useEffect(() => {
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        close();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [close]);
  const id = labelledBy ?? 'cg-modal-title';
  return (
    <div className={`cg-modal-bg${closing ? ' closing' : ''}`} onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={id} className="cg-panel cg-modal" style={{ padding: 22, outline: 'none', ...(width ? { width: `min(${width}px, calc(100% - 48px))` } : null) }}>
        <div className="cg-row" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
          <h2 id={id} className="cg-x" style={{ margin: 0, fontSize: 22 }}>
            {title}
          </h2>
          <button className="cg-btn ghost small" onClick={close} aria-label={t('city.close')}>
            ✕
          </button>
        </div>
        <div className="cg-scroll" style={{ minHeight: 0 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export function EarnSheet({ focus, onClose, onMarket }: { focus?: MaterialKind; onClose: () => void; onMarket?: (want?: Partial<Materials>) => void }) {
  const { t, L } = useL();
  const eco = useCityStore(useShallow((s) => ({ daily: s.daily, inventory: s.inventory })));
  const stars = useStarBalance();
  const day = vnToday(new Date()).key;
  return (
    <Modal title={t('city.earn.title')} onClose={onClose}>
      <p className="cg-muted" style={{ margin: '0 0 12px' }}>{t('city.earn.lead')}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {MATERIAL_KINDS.map((k) => {
          const info = MATERIAL_INFO[k];
          const p = dailyProgress(eco, day, k);
          const full = p.got >= p.cap;
          return (
            <div key={k} className={`cg-card${focus === k ? ' on' : ''}`} style={{ cursor: 'default', alignItems: 'center' }}>
              <span aria-hidden style={{ fontSize: 28, width: 40, textAlign: 'center' }}>{info.glyph}</span>
              <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span className="cg-row" style={{ justifyContent: 'space-between' }}>
                  <span className="cg-b" style={{ fontSize: 16 }}>
                    {L(info)} <span className="cg-muted" style={{ fontSize: 14 }}>· {t('city.earn.have', { qty: eco.inventory[k] })}</span>
                  </span>
                  <span className="cg-muted" style={{ fontSize: 14 }}>{t('city.todayCap', { got: p.got, cap: p.cap })}</span>
                </span>
                <span style={{ fontSize: 14 }}>{L({ vi: info.earnVi, en: info.earnEn })}</span>
                <Bar value={p.got / p.cap} color={info.color} label={t('city.todayCap', { got: p.got, cap: p.cap })} />
              </span>
              <button className="cg-btn primary small" disabled={full} onClick={() => router.push(info.href as never)} style={{ marginLeft: 6 }}>
                {full ? t('city.earn.full') : t('city.earn.go')}
              </button>
            </div>
          );
        })}
        <div className="cg-card" style={{ cursor: 'default', background: CG.brandSoft }}>
          <span aria-hidden style={{ fontSize: 26, width: 40, textAlign: 'center' }}>👷</span>
          <span style={{ fontSize: 14 }}>{t('city.shift.rules', { k: ECONOMY.shift.answersPerShift })}</span>
        </div>
        {onMarket ? (
          <div className="cg-card" style={{ cursor: 'default', alignItems: 'center', background: CG.warnSoft }}>
            <span aria-hidden style={{ fontSize: 26, width: 40, textAlign: 'center' }}>⭐</span>
            <span style={{ flex: 1, fontSize: 14 }}>
              {L({
                vi: `Học còn cho sao (thời gian học + số câu làm). Bạn đang có ${stars.toLocaleString('vi-VN')}⭐ — đổi ở Chợ vật liệu khi thiếu gấp.`,
                en: `Studying also earns stars (study time + questions answered). You have ${stars.toLocaleString('en-US')}⭐ — swap them at the Materials market when you are short.`,
              })}
            </span>
            <button className="cg-btn small" onClick={() => onMarket()} style={{ marginLeft: 6 }}>
              🛒 {L({ vi: 'Chợ vật liệu', en: 'Market' })}
            </button>
          </div>
        ) : null}
      </div>
      <p className="cg-muted" style={{ margin: '12px 0 0', fontSize: 14 }}>{t('city.earn.noBuy')}</p>
    </Modal>
  );
}
