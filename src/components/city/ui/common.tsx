import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { catalogItem, ZONE_INFO, type CatalogBuilding, type SkillMetric } from '@/data/city/catalog';
import { MATERIAL_INFO, MATERIAL_KINDS, type Materials } from '@/services/city/materials';
import type { PlaceReason } from '@/services/city/placement';
import { levelForXp } from '@/services/game/rules';
import type { Translate } from '@/i18n/useT';
import { translate, type MessageKey } from '@/i18n';
import { useLocale } from '@/i18n/useL';
import { useGameStore } from '@/store/useGameStore';
import { useSentenceStore } from '@/store/useSentenceStore';
import { useStudyStore } from '@/store/useStudyStore';
import { useVocabStore } from '@/store/useVocabStore';
import { useCityStore } from '@/store/useCityStore';
import { useAuthStore, useDisplayName } from '@/store/useAuthStore';
import { skillLevel, skillValue, type SkillReading, type SkillSources } from '@/services/city/skill-level';
import { CG } from './theme';

export type Named = { vi: string; en: string };

/**
 * `t` + chọn tên hai thứ tiếng trong dữ liệu (catalog, vật liệu, công đoạn).
 * Theo đúng ngôn ngữ chung của app (nút VI/EN), qua `useLocale()` để lượt vẽ
 * đầu vẫn là tiếng Việt như bản dựng máy chủ.
 */
export function useL(): { t: Translate; L: (o: Named) => string; locale: 'vi' | 'en' } {
  const locale = useLocale();
  const t = useCallback<Translate>((key, params) => translate(locale, key, params), [locale]);
  return { t, locale, L: (o) => (locale === 'en' ? o.en : o.vi) };
}

/**
 * Giữ một khối còn gắn thêm `ms` sau khi đóng để chạy hoạt cảnh đóng (trượt ra,
 * mờ dần) thay vì biến mất cụt. `ms = 0` (giảm chuyển động) → đóng ngay.
 */
export function usePresence(open: boolean, ms: number): { mounted: boolean; leaving: boolean } {
  const [mounted, setMounted] = useState(open);
  // Mở lại khi đang đóng dở: gắn lại ngay trong lúc render (không cần hiệu ứng).
  if (open && !mounted) setMounted(true);
  useEffect(() => {
    if (open || !mounted) return;
    const id = setTimeout(() => setMounted(false), Math.max(0, ms));
    return () => clearTimeout(id);
  }, [open, mounted, ms]);
  return { mounted: open || mounted, leaving: !open && mounted };
}

/** Cấp người học (XP của game khi học) — mở đội thợ và lên kỷ. */
export function useLearnerLevel(): number {
  const xp = useGameStore((s) => s.xp);
  return levelForXp(xp);
}

/** Dãy vật liệu: đủ thì màu thường, thiếu thì đỏ kèm "có/cần". */
export function CostRow({ cost, have, size = 15 }: { cost: Partial<Materials>; have?: Materials; size?: number }) {
  const { L } = useL();
  const kinds = MATERIAL_KINDS.filter((k) => (cost[k] ?? 0) > 0);
  if (!kinds.length) return <span className="cg-muted" style={{ fontSize: 14 }}>—</span>;
  return (
    <span className="cg-row" style={{ flexWrap: 'wrap', gap: 6 }}>
      {kinds.map((k) => {
        const need = cost[k] ?? 0;
        const short = have ? have[k] < need : false;
        return (
          <span
            key={k}
            className="cg-b"
            title={L(MATERIAL_INFO[k])}
            style={{ fontSize: size, color: short ? CG.bad : CG.ink, display: 'inline-flex', alignItems: 'center', gap: 3, whiteSpace: 'nowrap' }}
          >
            <span aria-hidden>{MATERIAL_INFO[k].glyph}</span>
            {have && short ? `${have[k]}/${need}` : need}
            <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>{L(MATERIAL_INFO[k])}</span>
          </span>
        );
      })}
    </span>
  );
}

export function Bar({ value, color = CG.brand, label }: { value: number; color?: string; label?: string }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div className="cg-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <i style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

export function ZoneDot({ zone, size = 10 }: { zone: keyof typeof ZONE_INFO; size?: number }) {
  return <span aria-hidden style={{ width: size, height: size, borderRadius: 3, background: ZONE_INFO[zone].color, display: 'inline-block', flex: 'none' }} />;
}

/** Một câu nêu đúng MỘT lý do cụ thể vì sao không đặt được. */
export function placeReasonText(t: Translate, L: (o: Named) => string, reason: PlaceReason | 'materials', type?: string, zone?: keyof typeof ZONE_INFO): string {
  const it = type ? catalogItem(type) : undefined;
  if (reason === 'zone' && it) return t('city.reason.zone', { have: L(ZONE_INFO[zone ?? it.zone]), need: L(ZONE_INFO[it.zone]) });
  if (reason === 'no_road' && it) return t(it.place.road === 'any' ? 'city.reason.no_road' : 'city.reason.no_road_kind', { road: roadNeedText(t, it) });
  if (reason === 'road_kind' && it) return t('city.reason.road_kind', { road: roadNeedText(t, it) });
  if (reason === 'era' && it) return t('city.reason.era', { era: it.era });
  if (reason === 'max' && it) return t('city.reason.max', { max: it.max ?? 1 });
  return t(`city.reason.${reason}` as MessageKey);
}

export function roadNeedText(t: Translate, it: CatalogBuilding): string {
  if (it.place.road === 'stone') return t('city.road.stone');
  if (it.place.road === 'asphalt') return t('city.road.asphalt');
  return t('city.road.any');
}

/** Cấp công trình kỹ năng từ dữ liệu học thật (null → giao diện hiện "—"). */
export function useSkillReading(metric: SkillMetric | undefined): SkillReading | null {
  const wordStatus = useVocabStore((s) => s.wordStatus);
  const sentence = useSentenceStore((s) => s.sessions);
  const study = useStudyStore((s) => s.sessions);
  const progress = useStudyStore((s) => s.progress);
  const xp = useGameStore((s) => s.xp);
  return useMemo(() => {
    if (!metric) return null;
    const src: SkillSources = {
      wordStatus,
      dictationTotals: sentence.map((x) => ('total' in x && typeof x.total === 'number' ? x.total : 0)),
      readingSessions: study.length,
      readingProgress: Object.values(progress).map((p) => p.percentCompleted),
      xp,
    };
    return skillLevel(metric, skillValue(metric, src));
  }, [metric, wordStatus, sentence, study, progress, xp]);
}

/**
 * Tên thành phố hiển thị: tên người học đã đặt; chưa đặt thì "Thành phố của
 * <tên tài khoản>" (chưa đăng nhập: "Thành phố của tôi").
 */
export function useCityName(): string {
  const { t } = useL();
  const name = useCityStore((s) => s.name);
  const signedIn = useAuthStore((s) => s.status === 'signed_in');
  const who = useDisplayName();
  if (name) return name;
  const first = who.trim().split(/\s+/).pop() ?? '';
  return signedIn && first ? t('city.defaultNameOf', { who: first }) : t('city.defaultName');
}
