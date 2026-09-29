/**
 * Màn "Ghi công": sinh từ LICENSES.json, không gõ tay. Phần lớn thành phố dựng
 * bằng code của ReadUp; các chi tiết trang trí tải về đều CC0 và vẫn ghi tên
 * tác giả dù giấy phép không bắt buộc.
 */
import React from 'react';

import { CREDITS } from '@/data/city/credits';
import { Modal } from './EarnSheet';
import { useL } from './common';

export function Credits({ onClose }: { onClose: () => void }) {
  const { t, L } = useL();
  return (
    <Modal title={t('city.credits.title')} onClose={onClose}>
      <p className="cg-muted" style={{ margin: '0 0 12px' }}>{t('city.credits.lead')}</p>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {CREDITS.map((c) => (
          <li key={c.id} className="cg-card" style={{ cursor: 'default', flexDirection: 'column', gap: 2 }}>
            <span className="cg-b">{L({ vi: c.ten, en: c.tenEn })}</span>
            <span className="cg-muted" style={{ fontSize: 14 }}>
              {t('city.credits.by', { author: c.tacGia, source: c.nguon })} · {c.giayPhep}
            </span>
            <a href={c.url} target="_blank" rel="noreferrer" style={{ fontSize: 14, color: '#2F5FC4' }}>
              {c.url.replace(/^https?:\/\//, '')}
            </a>
          </li>
        ))}
      </ul>
      <p className="cg-muted" style={{ margin: '12px 0 0', fontSize: 14 }}>{t('city.credits.code')}</p>
    </Modal>
  );
}
