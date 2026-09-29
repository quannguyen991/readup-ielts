/**
 * Bảng bên phải: khi chọn một công trình → bảng công trình (tiến độ 9 công đoạn,
 * "Tầng x/y", việc còn thiếu, giao vật liệu, thuê đội, ưu tiên, "Học để tiếp
 * tục"); khi không chọn gì → bốn thẻ Nhiệm vụ / Công trường / Đội thợ / Ca làm.
 */
import React, { useEffect, useState } from 'react';
import { router } from 'expo-router';

import { catalogItem, ERA_INFO, isTower, ZONE_INFO, type CrewId, type Era, type SkillMetric } from '@/data/city/catalog';
import {
  blockers,
  canHire,
  CREW_ORDER,
  CREWS,
  crewFits,
  crewLoad,
  crewUnlocked,
  currentStep,
  isDone,
  STAGES,
  stepCost,
  stepShifts,
  TOWER,
  visualProgress,
  type Site,
} from '@/services/city/construction';
import { ECONOMY } from '@/services/city/economy';
import { MATERIAL_INFO, MATERIAL_KINDS, type MaterialKind } from '@/services/city/materials';
import { eraChecklist } from '@/services/city/progression';
import { vnToday } from '@/services/gamification/golden';
import { useCityStore } from '@/store/useCityStore';
import { Bar, CostRow, useL, useLearnerLevel, useSkillReading, ZoneDot } from './common';
import { CG } from './theme';

type Toast = (text: string, tone?: 'ok' | 'bad' | 'info') => void;

/** Đồng hồ nhẹ cho đếm ngược đông cứng móng. */
function useMinuteTick(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 20_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

/** Màn học phù hợp nhất cho bước hiện tại: thiếu vật liệu nào thì học đúng mảng đó. */
export function learnRouteFor(missing: Partial<Record<MaterialKind, number>>): string {
  const k = MATERIAL_KINDS.find((m) => (missing[m] ?? 0) > 0);
  return k ? MATERIAL_INFO[k].href : '/practice';
}

// ------------------------------------------------------------------ bảng công trình

export function SitePanel({ siteId, onClose, onEarn, toast }: { siteId: string; onClose: () => void; onEarn: (k?: MaterialKind) => void; toast: Toast }) {
  const { t, L } = useL();
  const site = useCityStore((s) => s.sites.find((x) => x.id === siteId));
  const inv = useCityStore((s) => s.inventory);
  const bank = useCityStore((s) => s.shiftBank);
  const sites = useCityStore((s) => s.sites);
  const era = useCityStore((s) => s.era);
  const priority = useCityStore((s) => s.priority);
  const { deliver, hire, setPriority, cancelSite } = useCityStore.getState();
  const level = useLearnerLevel();
  const now = useMinuteTick();
  if (!site) return null;
  const item = catalogItem(site.type)!;
  const done = isDone(site, item);
  const vp = visualProgress(site);
  const step = currentStep(site, item);
  const b = blockers(site, inv, bank, now);
  const needShifts = stepShifts(site, item);
  const missing = Object.keys(b.materials).length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0, flex: 1 }}>
      <div className="cg-row" style={{ alignItems: 'flex-start' }}>
        <span aria-hidden style={{ fontSize: 30, lineHeight: 1.1 }}>{item.glyph}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 className="cg-x" style={{ margin: 0, fontSize: 19 }}>{L(item)}</h2>
          <div className="cg-row cg-muted" style={{ fontSize: 14, gap: 6 }}>
            <ZoneDot zone={item.zone} /> {L(ZONE_INFO[item.zone])} · {t('city.eraShort', { era: item.era })}
          </div>
        </div>
        <button className="cg-btn ghost small" onClick={onClose} aria-label={t('city.close')}>
          ✕
        </button>
      </div>

      {done ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span className="cg-chip" style={{ alignSelf: 'flex-start', background: CG.okSoft, color: CG.ok }}>✓ {t('city.site.done')}</span>
          {item.population ? <div>👥 {t('city.site.residents', { n: item.population })}</div> : null}
          {item.skill ? (
            <>
              <SkillBox metric={item.skill.metric} />
              <p className="cg-muted" style={{ margin: 0, fontSize: 14 }}>{t('city.site.skillHelp')}</p>
              <button className="cg-btn primary" style={{ justifyContent: 'center' }} onClick={() => router.push(item.skill!.route as never)}>
                {t('city.site.openSkill')}
              </button>
            </>
          ) : null}
        </div>
      ) : (
        <div className="cg-scroll" style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0 }}>
          {/* Công đoạn */}
          <ol style={{ listStyle: 'none', margin: 0, padding: 0 }} aria-label={t('city.site.stages')}>
            {item.stages.map((st, i) => {
              const state = i < site.stageIdx ? 'done' : i === site.stageIdx ? 'now' : 'next';
              return (
                <li key={st} className="cg-stage" style={{ opacity: state === 'next' ? 0.55 : 1 }}>
                  <span className="cg-dot" style={{ background: state === 'done' ? CG.okSoft : state === 'now' ? CG.brand : 'rgba(16,33,63,.06)', color: state === 'now' ? '#fff' : CG.ok }}>
                    {state === 'done' ? '✓' : state === 'now' ? i + 1 : ''}
                  </span>
                  <span className={state === 'now' ? 'cg-b' : ''} style={{ flex: 1 }}>
                    {L(STAGES[st]!)}
                  </span>
                  {state === 'now' && needShifts > 0 ? <span className="cg-muted">{Math.round(vp.fraction * 100)}%</span> : null}
                </li>
              );
            })}
          </ol>

          {isTower(item) && vp.stage >= 4 ? (
            <div className="cg-panel" style={{ padding: 12, borderRadius: 14, boxShadow: 'none', background: CG.brandSoft }}>
              <div className="cg-x" style={{ fontSize: 17 }}>{t('city.site.floor', { a: Math.min(vp.floorsDone, vp.floors), b: vp.floors })}</div>
              {step.kind === 'floor' ? (
                <div className="cg-muted" style={{ fontSize: 14 }}>{t('city.site.floorStep', { step: t(`city.floorStep.${TOWER.steps[step.step] ?? 'frame'}` as const) })}</div>
              ) : step.kind === 'crane' ? (
                <div className="cg-muted" style={{ fontSize: 14 }}>{t('city.site.crane')}</div>
              ) : null}
              <div style={{ marginTop: 8 }}>
                <Bar value={vp.floors ? (vp.floorsDone + vp.floorStep / 4) / vp.floors : 0} label={t('city.site.floor', { a: vp.floorsDone, b: vp.floors })} />
              </div>
            </div>
          ) : null}

          {/* Việc còn thiếu — mỗi dòng một việc cụ thể */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <strong className="cg-b" style={{ fontSize: 15 }}>{t('city.site.next')}</strong>

            {b.needDelivery ? (
              <div className="cg-card" style={{ cursor: 'default', flexDirection: 'column', gap: 8 }}>
                <span>{t('city.site.deliverLine')}</span>
                <CostRow cost={deliverCost(site)} have={inv} />
                {missing ? (
                  <button className="cg-btn primary small" onClick={() => onEarn(MATERIAL_KINDS.find((k) => (b.materials[k] ?? 0) > 0))}>
                    📚 {t('city.site.learnFor')}
                  </button>
                ) : (
                  <button
                    className="cg-btn primary small"
                    onClick={() => {
                      const r = deliver(site.id);
                      if (r.ok) toast(t('city.toast.delivered'), 'ok');
                      else toast(t(`city.deliver.${r.reason}` as const), 'bad');
                    }}
                  >
                    🚚 {t('city.site.deliver')}
                  </button>
                )}
              </div>
            ) : null}

            {b.crew ? <HireBox site={site} level={level} era={era} sites={sites} toast={toast} hire={hire} /> : null}

            {b.curingMin > 0 ? (
              <div className="cg-card" style={{ cursor: 'default', background: CG.warnSoft }}>
                ⏳ {t('city.site.curing', { min: b.curingMin })}
              </div>
            ) : null}

            {!b.needDelivery && !b.crew && needShifts > 0 ? (
              <div className="cg-card" style={{ cursor: 'default', flexDirection: 'column', gap: 8 }}>
                <span className="cg-row" style={{ justifyContent: 'space-between' }}>
                  <span>{t('city.site.shifts', { a: site.shifts, b: needShifts })}</span>
                  <span className="cg-muted" style={{ fontSize: 14 }}>{t('city.site.bank', { n: bank })}</span>
                </span>
                <Bar value={needShifts ? site.shifts / needShifts : 0} color={CG.ok} label={t('city.site.shifts', { a: site.shifts, b: needShifts })} />
                {b.shiftsLeft > 0 ? <span className="cg-muted" style={{ fontSize: 14 }}>{t('city.site.shiftsHelp', { n: b.shiftsLeft, k: ECONOMY.shift.answersPerShift })}</span> : null}
              </div>
            ) : null}
          </div>

          <button className="cg-btn primary" style={{ justifyContent: 'center' }} onClick={() => router.push(learnRouteFor(b.materials) as never)}>
            📚 {t('city.site.learnToContinue')}
          </button>

          <div className="cg-row" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <button className="cg-btn small" aria-pressed={priority === site.id} onClick={() => setPriority(priority === site.id ? null : site.id)}>
              {priority === site.id ? '★' : '☆'} {t('city.site.priority')}
            </button>
            {site.stageIdx === 0 && site.shifts === 0 ? (
              <button
                className="cg-btn small danger"
                onClick={() => {
                  if (cancelSite(site.id)) {
                    toast(t('city.toast.cancelled'), 'info');
                    onClose();
                  }
                }}
              >
                {t('city.site.cancel')}
              </button>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

/** Cấp công trình kỹ năng — từ dữ liệu học thật; chưa có thì "—". */
function SkillBox({ metric }: { metric: SkillMetric }) {
  const { t } = useL();
  const r = useSkillReading(metric);
  return (
    <div className="cg-card" style={{ cursor: 'default', flexDirection: 'column', gap: 4, background: CG.brandSoft }}>
      <span className="cg-x" style={{ fontSize: 20 }}>{r && r.level > 0 ? t('city.skill.level', { level: r.level }) : '—'}</span>
      <span style={{ fontSize: 14 }}>{r ? t(`city.skill.value.${metric}` as const, { n: r.value }) : t('city.skill.none')}</span>
      {r && r.nextAt !== null ? <span className="cg-muted" style={{ fontSize: 14 }}>{t('city.skill.next', { at: r.nextAt })}</span> : null}
    </div>
  );
}

function deliverCost(site: Site) {
  return stepCost(site, catalogItem(site.type)!);
}

function HireBox({ site, level, era, sites, toast, hire }: { site: Site; level: number; era: number; sites: readonly Site[]; toast: Toast; hire: (id: string, c: CrewId, l: number) => { ok: boolean; reason?: string } }) {
  const { t, L } = useL();
  const inv = useCityStore((s) => s.inventory);
  const item = catalogItem(site.type)!;
  const fits = CREW_ORDER.filter((c) => crewFits(c, item.crew));
  return (
    <div className="cg-card" style={{ cursor: 'default', flexDirection: 'column', gap: 8 }}>
      <span>{t('city.site.needCrew')}</span>
      {fits.map((c) => {
        const crew = CREWS[c];
        const unlocked = crewUnlocked(c, era, level, sites);
        const check = canHire(c, site, sites, inv, era, level);
        return (
          <div key={c} className="cg-row" style={{ justifyContent: 'space-between', gap: 8 }}>
            <span style={{ minWidth: 0 }}>
              <span className="cg-b">{crew.glyph} {L(crew)}</span>
              <span className="cg-muted" style={{ display: 'block', fontSize: 14 }}>
                {unlocked ? t('city.crew.load', { a: crewLoad(c, sites), b: crew.capacity }) : crewLockText(t, L, c)}
              </span>
            </span>
            <button
              className="cg-btn small"
              disabled={!unlocked}
              onClick={() => {
                const r = hire(site.id, c, level);
                if (r.ok) toast(t('city.toast.hired', { crew: L(crew) }), 'ok');
                else toast(t(`city.hire.${check.ok ? 'busy' : check.reason}` as const), 'bad');
              }}
            >
              <CostRow cost={crew.hireCost} have={inv} size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

function crewLockText(t: ReturnType<typeof useL>['t'], L: ReturnType<typeof useL>['L'], c: CrewId): string {
  const crew = CREWS[c];
  const parts = [t('city.eraShort', { era: crew.era }), t('city.crew.level', { level: crew.minLevel })];
  if (crew.needsBuilding) parts.push(L(catalogItem(crew.needsBuilding)!));
  return `${t('city.crew.needs')} ${parts.join(' · ')}`;
}

// ------------------------------------------------------------------ bảng tổng

type Tab = 'tasks' | 'sites' | 'crews' | 'shifts';

export function OverviewPanel({ onSelect, onEarn, onEraUp }: { onSelect: (id: string) => void; onEarn: (k?: MaterialKind) => void; onEraUp: () => void }) {
  const { t } = useL();
  const [tab, setTab] = useState<Tab>('tasks');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0, flex: 1 }}>
      <div className="cg-row" role="tablist" style={{ gap: 2 }}>
        {(['tasks', 'sites', 'crews', 'shifts'] as Tab[]).map((x) => (
          <button key={x} role="tab" aria-selected={tab === x} className={`cg-tab${tab === x ? ' on' : ''}`} onClick={() => setTab(x)}>
            {t(`city.tab.${x}` as const)}
          </button>
        ))}
      </div>
      <div className="cg-scroll" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {tab === 'tasks' ? <Tasks onSelect={onSelect} onEarn={onEarn} onEraUp={onEraUp} /> : null}
        {tab === 'sites' ? <SiteList onSelect={onSelect} /> : null}
        {tab === 'crews' ? <Crews /> : null}
        {tab === 'shifts' ? <Shifts /> : null}
      </div>
    </div>
  );
}

function Tasks({ onSelect, onEarn, onEraUp }: { onSelect: (id: string) => void; onEarn: (k?: MaterialKind) => void; onEraUp: () => void }) {
  const { t, L } = useL();
  const sites = useCityStore((s) => s.sites);
  const era = useCityStore((s) => s.era) as Era;
  const inv = useCityStore((s) => s.inventory);
  const bank = useCityStore((s) => s.shiftBank);
  const priority = useCityStore((s) => s.priority);
  const level = useLearnerLevel();
  const now = new Date();
  const list = eraChecklist(era, sites, level);
  const ready = !!list && list.every((l) => l.ok);

  // Việc cần làm NGAY: mỗi công trường đang dở một dòng, đúng một việc.
  const todo = sites
    .filter((s) => !isDone(s))
    .sort((a, b) => (a.id === priority ? -1 : b.id === priority ? 1 : a.createdAt.localeCompare(b.createdAt)))
    .slice(0, 4)
    .map((s) => {
      const it = catalogItem(s.type)!;
      const bl = blockers(s, inv, bank, now);
      const missK = MATERIAL_KINDS.find((k) => (bl.materials[k] ?? 0) > 0);
      let text: string;
      let action: (() => void) | null = () => onSelect(s.id);
      if (bl.needDelivery && missK) {
        text = t('city.todo.learnFor', { mat: L(MATERIAL_INFO[missK]), site: L(it) });
        action = () => onEarn(missK);
      } else if (bl.needDelivery) text = t('city.todo.deliver', { site: L(it) });
      else if (bl.crew) text = t('city.todo.hire', { site: L(it) });
      else if (bl.curingMin > 0) text = t('city.todo.curing', { site: L(it), n: bl.curingMin });
      else text = t('city.todo.study', { site: L(it) });
      return { id: s.id, glyph: it.glyph, text, action };
    });

  return (
    <>
      {sites.length === 0 ? (
        <div className="cg-card" style={{ cursor: 'default', background: CG.brandSoft }}>
          <span aria-hidden style={{ fontSize: 22 }}>🏗️</span>
          <span>{t('city.todo.first')}</span>
        </div>
      ) : null}
      {todo.map((x) => (
        <button key={x.id} className="cg-card" onClick={x.action ?? undefined}>
          <span aria-hidden style={{ fontSize: 22 }}>{x.glyph}</span>
          <span style={{ fontSize: 14 }}>{x.text}</span>
        </button>
      ))}

      <div style={{ marginTop: 4 }}>
        <strong className="cg-b">{list ? t('city.era.toNext', { era: era + 1, name: L(ERA_INFO[(era + 1) as Era]) }) : t('city.era.max')}</strong>
      </div>
      {list?.map((l, i) => (
        <div key={i} className="cg-row" style={{ fontSize: 14 }}>
          <span className="cg-dot" style={{ background: l.ok ? CG.okSoft : 'rgba(16,33,63,.06)', color: CG.ok }}>{l.ok ? '✓' : ''}</span>
          <span style={{ flex: 1 }}>
            {l.kind === 'level' ? t('city.era.level') : l.kind === 'population' ? t('city.era.population') : L(catalogItem(l.id!)!)}
          </span>
          <span className="cg-b" style={{ color: l.ok ? CG.ok : CG.body }}>
            {Math.min(l.have, l.need)}/{l.need}
          </span>
        </div>
      ))}
      {list ? (
        <button className="cg-btn primary" disabled={!ready} style={{ justifyContent: 'center' }} onClick={onEraUp}>
          🎉 {t('city.era.advance', { era: era + 1 })}
        </button>
      ) : null}
    </>
  );
}

function SiteList({ onSelect }: { onSelect: (id: string) => void }) {
  const { t, L } = useL();
  const sites = useCityStore((s) => s.sites);
  const priority = useCityStore((s) => s.priority);
  const open = sites.filter((s) => !isDone(s));
  const done = sites.length - open.length;
  return (
    <>
      {open.length === 0 ? <p className="cg-muted" style={{ margin: 0 }}>{t('city.sites.none')}</p> : null}
      {open.map((s) => {
        const it = catalogItem(s.type)!;
        const vp = visualProgress(s);
        const pct = (s.stageIdx + vp.fraction) / it.stages.length;
        return (
          <button key={s.id} className="cg-card" onClick={() => onSelect(s.id)} style={{ flexDirection: 'column', gap: 6 }}>
            <span className="cg-row" style={{ width: '100%' }}>
              <span aria-hidden>{it.glyph}</span>
              <span className="cg-b" style={{ flex: 1 }}>{L(it)}</span>
              {priority === s.id ? <span title={t('city.site.priority')}>★</span> : null}
            </span>
            <span className="cg-muted" style={{ fontSize: 14 }}>
              {L(STAGES[vp.stage] ?? STAGES[8]!)}
              {isTower(it) && vp.stage === 4 ? ` · ${t('city.site.floor', { a: vp.floorsDone, b: vp.floors })}` : ''}
              {!s.crew ? ` · ${t('city.sites.noCrew')}` : ''}
            </span>
            <span style={{ width: '100%' }}>
              <Bar value={pct} />
            </span>
          </button>
        );
      })}
      <p className="cg-muted" style={{ margin: 0, fontSize: 14 }}>{t('city.sites.done', { n: done })}</p>
    </>
  );
}

function Crews() {
  const { t, L } = useL();
  const sites = useCityStore((s) => s.sites);
  const era = useCityStore((s) => s.era);
  const level = useLearnerLevel();
  return (
    <>
      <p className="cg-muted" style={{ margin: 0, fontSize: 14 }}>{t('city.crew.help')}</p>
      {CREW_ORDER.map((c) => {
        const crew = CREWS[c];
        const unlocked = crewUnlocked(c, era, level, sites);
        const load = crewLoad(c, sites);
        const working = sites.filter((s) => s.crew === c && !isDone(s));
        return (
          <div key={c} className={`cg-card${unlocked ? '' : ' locked'}`} style={{ cursor: 'default', flexDirection: 'column', gap: 6 }}>
            <span className="cg-row" style={{ width: '100%' }}>
              <span aria-hidden style={{ fontSize: 22 }}>{crew.glyph}</span>
              <span className="cg-b" style={{ flex: 1 }}>{L(crew)}</span>
              <span className="cg-muted" style={{ fontSize: 14 }}>👷 ×{crew.workers}</span>
            </span>
            <span className="cg-muted" style={{ fontSize: 14 }}>
              {unlocked ? t('city.crew.load', { a: load, b: crew.capacity }) : crewLockText(t, L, c)}
            </span>
            {working.length ? <span style={{ fontSize: 14 }}>{working.map((s) => L(catalogItem(s.type)!)).join(', ')}</span> : null}
            <span className="cg-row" style={{ gap: 6, fontSize: 14 }}>
              <span className="cg-muted">{t('city.crew.cost')}</span> <CostRow cost={crew.hireCost} size={14} />
            </span>
          </div>
        );
      })}
    </>
  );
}

function Shifts() {
  const { t } = useL();
  const bank = useCityStore((s) => s.shiftBank);
  const counter = useCityStore((s) => s.shiftCounter);
  const daily = useCityStore((s) => s.daily);
  const today = vnToday(new Date()).key;
  const used = daily && daily.day === today ? daily.shifts : 0;
  const per = ECONOMY.shift.answersPerShift;
  return (
    <>
      <div className="cg-card" style={{ cursor: 'default', flexDirection: 'column', gap: 6 }}>
        <span className="cg-x" style={{ fontSize: 22 }}>{t('city.shift.bank', { n: bank })}</span>
        <span className="cg-muted" style={{ fontSize: 14 }}>{t('city.shift.bankHelp')}</span>
      </div>
      <div className="cg-card" style={{ cursor: 'default', flexDirection: 'column', gap: 6 }}>
        <span>{t('city.shift.next', { a: counter % per, b: per })}</span>
        <Bar value={(counter % per) / per} color={CG.ok} />
      </div>
      <div className="cg-card" style={{ cursor: 'default', flexDirection: 'column', gap: 6 }}>
        <span>{t('city.shift.today', { a: used, b: ECONOMY.shift.maxPerDay })}</span>
        <Bar value={used / ECONOMY.shift.maxPerDay} />
      </div>
      <p className="cg-muted" style={{ margin: 0, fontSize: 14 }}>{t('city.shift.rules', { k: per })}</p>
      <button className="cg-btn primary" style={{ justifyContent: 'center' }} onClick={() => router.push('/practice' as never)}>
        📚 {t('city.site.learnToContinue')}
      </button>
    </>
  );
}
