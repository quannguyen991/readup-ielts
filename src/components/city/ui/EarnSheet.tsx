/**
 * "Học để nhận" — nơi DUY NHẤT dẫn tới vật liệu: mỗi loại một bài học, kèm
 * tiến độ trần trong ngày. Không có nút mua, không đổi sao, không trả tiền.
 */
import React, { useEffect, useRef } from 'react';
import { router } from 'expo-router';

import { dailyProgress, ECONOMY } from '@/services/city/economy';
import { MATERIAL_INFO, MATERIAL_KINDS, type MaterialKind } from '@/services/city/materials';
import { vnToday } from '@/services/gamification/golden';
import { useCityStore } from '@/store/useCityStore';
import { Bar, useL } from './common';
import { CG } from './theme';

export function Modal({ title, onClose, children, labelledBy }: { title: string; onClose: () => void; children: React.ReactNode; labelledBy?: string }) {
  const { t } = useL();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose]);
  const id = labelledBy ?? 'cg-modal-title';
  return (
    <div className="cg-modal-bg" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={id} className="cg-panel cg-modal" style={{ padding: 22, outline: 'none' }}>
        <div className="cg-row" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
          <h2 id={id} className="cg-x" style={{ margin: 0, fontSize: 22 }}>
            {title}
          </h2>
          <button className="cg-btn ghost small" onClick={onClose} aria-label={t('city.close')}>
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

export function EarnSheet({ focus, onClose }: { focus?: MaterialKind; onClose: () => void }) {
  const { t, L } = useL();
  const eco = useCityStore((s) => s);
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
      </div>
      <p className="cg-muted" style={{ margin: '12px 0 0', fontSize: 14 }}>{t('city.earn.noBuy')}</p>
    </Modal>
  );
}
