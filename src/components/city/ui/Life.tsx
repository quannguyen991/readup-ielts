/**
 * Giao diện "đời sống trong thành phố": gợi ý việc làm ở chỗ nhân vật đứng,
 * trò câu cá / bắt bọ bằng câu hỏi từ vựng, bộ sưu tập.
 *
 * Câu hỏi lấy từ ĐÚNG các từ người học đang học (bộ từ chủ đề / từ SAT đã mở),
 * chưa học bộ nào thì lấy từ bộ IELTS cơ bản. Trả lời đúng mới bắt được; trả
 * lời nhanh (< 4 giây) thì dễ gặp loài quý hơn. Sao có trần mỗi ngày.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { HERO_SKINS, type SkinId } from '@/components/game/sprites';
import { dateKey } from '@/services/gamification/points';
import { catchPrizeKey, CATCH_DAILY_CAP, makeQuestion, RARITY_INFO, rollCatch, SPECIES, type Activity, type CatchKind, type CatchQuestion, type Species } from '@/services/city/life';
import { catalogItem } from '@/data/city/catalog';
import { useCityLifeStore } from '@/store/useCityLifeStore';
import { useRewardStore } from '@/store/useRewardStore';
import { recordQuestAnswer, useWordPools } from '@/components/quiz/useWordPools';
import { QuestWordPicker } from '@/components/quiz/QuestWordPicker';
import type { AvatarColors } from '../scene/WalkLayer';
import { Modal } from './EarnSheet';
import { useL } from './common';
import { CG } from './theme';

/** Màu nhân vật 3D theo skin đang đeo (cùng bảng màu với nhân vật pixel). */
export function avatarColors(skin: SkinId): AvatarColors {
  const c = HERO_SKINS[skin]?.colors ?? {};
  return {
    body: c.a ?? '#2563EB',
    trim: c.c ?? '#DC2626',
    hair: c.h ?? '#5B3A1E',
    skin: '#F5C6A0',
    legs: c.A ?? '#1E3A8A',
  };
}

// ------------------------------------------------------------------ gợi ý việc làm

export function WalkPrompt({ activity, onAct }: { activity: Activity | null; onAct: () => void }) {
  const { L } = useL();
  if (!activity) return null;
  const text =
    activity.kind === 'enter'
      ? L({ vi: `Vào ${catalogItem(activity.type)?.vi ?? 'công trình'} — học bài`, en: `Enter ${catalogItem(activity.type)?.en ?? 'building'} — study` })
      : activity.kind === 'home'
        ? L({ vi: 'Vào nhà của bạn', en: 'Go inside your home' })
        : activity.kind === 'fish'
          ? L({ vi: 'Thả câu ở đây', en: 'Cast a line here' })
          : L({ vi: 'Bắt bọ trong bụi cây', en: 'Catch bugs in the bushes' });
  const glyph = activity.kind === 'enter' ? catalogItem(activity.type)?.glyph ?? '🚪' : activity.kind === 'home' ? '🏠' : activity.kind === 'fish' ? '🎣' : '🥅';
  return (
    <div className="cg-panel cg-prompt" role="status">
      <span aria-hidden style={{ fontSize: 22 }}>{glyph}</span>
      <span className="cg-b" style={{ fontSize: 15 }}>{text}</span>
      <button className="cg-btn primary small" onClick={onAct}>
        <span className="cg-kbd" style={{ background: 'rgba(255,255,255,.2)', boxShadow: 'none', color: '#fff' }}>Space</span>
      </button>
    </div>
  );
}

// ------------------------------------------------------------------ câu cá / bắt bọ

type Phase = { k: 'wait' } | { k: 'ask'; q: CatchQuestion; at: number } | { k: 'won'; s: Species; stars: number; fast: boolean } | { k: 'lost'; q: CatchQuestion; picked: number };

const ASK_MS = 12_000;
const FAST_MS = 4_000;

export function CatchGame({ kind, onClose }: { kind: CatchKind; onClose: () => void }) {
  const { L, locale } = useL();
  const en = locale === 'en';
  const { focus, pool } = useWordPools();
  const addCatch = useCityLifeStore((s) => s.addCatch);
  const addCappedPrize = useRewardStore((s) => s.addCappedPrize);
  const today = dateKey(new Date());
  const grantedToday = useRewardStore((s) => s.prizes?.[catchPrizeKey(today)] ?? 0);
  const [phase, setPhase] = useState<Phase>({ k: 'wait' });
  const [left, setLeft] = useState(1);
  const [round, setRound] = useState(0);
  const fish = kind === 'fish';

  // Chờ cá cắn câu (1–2,5 giây) rồi hiện câu hỏi.
  useEffect(() => {
    if (phase.k !== 'wait') return;
    const id = setTimeout(() => {
      const q = makeQuestion(focus, pool, Math.random, en);
      if (q) setPhase({ k: 'ask', q, at: Date.now() });
    }, 1000 + Math.random() * 1500);
    return () => clearTimeout(id);
  }, [phase.k, focus, pool, round, en]);

  // Đồng hồ trả lời: hết giờ là cá / bọ chạy mất.
  useEffect(() => {
    if (phase.k !== 'ask') return;
    const id = setInterval(() => {
      const f = 1 - (Date.now() - phase.at) / ASK_MS;
      setLeft(Math.max(0, f));
      if (f <= 0) setPhase({ k: 'lost', q: phase.q, picked: -1 });
    }, 100);
    return () => clearInterval(id);
  }, [phase]);

  const pick = useCallback(
    (i: number) => {
      if (phase.k !== 'ask') return;
      // Ôn thật: ghi vào lịch ôn của bộ từ gốc (một lần mỗi câu).
      recordQuestAnswer(focus, phase.q.word, i === phase.q.answer);
      if (i !== phase.q.answer) {
        setPhase({ k: 'lost', q: phase.q, picked: i });
        return;
      }
      const fast = Date.now() - phase.at < FAST_MS;
      const s = rollCatch(kind, Math.random(), fast);
      addCatch(s.id);
      const stars = addCappedPrize(catchPrizeKey(today), RARITY_INFO[s.rarity].stars, CATCH_DAILY_CAP);
      setPhase({ k: 'won', s, stars, fast });
    },
    [phase, kind, addCatch, addCappedPrize, today, focus],
  );

  // Phím 1–4 chọn đáp án; Space / Enter chơi tiếp.
  const again = useCallback(() => {
    setLeft(1);
    setRound((r) => r + 1);
    setPhase({ k: 'wait' });
  }, []);
  const pickRef = useRef(pick);
  const againRef = useRef(again);
  const phaseRef = useRef(phase);
  useEffect(() => {
    pickRef.current = pick;
    againRef.current = again;
    phaseRef.current = phase;
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (n >= 1 && n <= 4) pickRef.current(n - 1);
      else if ((e.key === ' ' || e.key === 'Enter') && (phaseRef.current.k === 'won' || phaseRef.current.k === 'lost')) {
        e.preventDefault();
        againRef.current();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const title = fish ? L({ vi: '🎣 Câu cá từ vựng', en: '🎣 Vocabulary fishing' }) : L({ vi: '🥅 Bắt bọ từ vựng', en: '🥅 Vocabulary bug catching' });
  const capLeft = Math.max(0, CATCH_DAILY_CAP - grantedToday);

  return (
    <Modal title={title} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minHeight: 300 }}>
        <div style={{ alignSelf: 'flex-start' }}>
          <QuestWordPicker theme="light" compact />
        </div>
        {phase.k === 'wait' ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '36px 0' }}>
            <div style={{ position: 'relative', width: 90, height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {fish ? <span className="cg-ripple" /> : null}
              <span className="cg-bob" style={{ fontSize: 46 }} aria-hidden>
                {fish ? '🎣' : '🌿'}
              </span>
            </div>
            <span className="cg-muted">{fish ? L({ vi: 'Đợi cá cắn câu…', en: 'Waiting for a bite…' }) : L({ vi: 'Rón rén lại gần bụi cây…', en: 'Tiptoeing to the bushes…' })}</span>
            {pool.length < 4 ? <span className="cg-muted">{L({ vi: 'Chưa có từ nào để hỏi.', en: 'No words to ask yet.' })}</span> : null}
          </div>
        ) : null}

        {phase.k === 'ask' || phase.k === 'lost' ? (
          <>
            <div className="cg-row" style={{ justifyContent: 'space-between' }}>
              <span className="cg-muted" style={{ fontSize: 14 }}>
                {phase.k === 'ask'
                  ? fish
                    ? L({ vi: 'Cá cắn câu! Chọn đúng nghĩa để kéo lên:', en: 'A bite! Pick the right meaning to reel it in:' })
                    : L({ vi: 'Thấy bọ rồi! Chọn đúng nghĩa để chụp vợt:', en: 'Spotted one! Pick the right meaning to swing the net:' })
                  : fish
                    ? L({ vi: 'Tuột mất rồi…', en: 'It got away…' })
                    : L({ vi: 'Bọ bay mất rồi…', en: 'It flew away…' })}
              </span>
              {phase.k === 'ask' ? <span className="cg-muted" style={{ fontSize: 14 }}>{Math.ceil(left * (ASK_MS / 1000))}s</span> : null}
            </div>
            {phase.k === 'ask' ? (
              <div className="cg-bar" aria-hidden>
                <i style={{ width: `${left * 100}%`, background: left > 1 - FAST_MS / ASK_MS ? CG.ok : CG.brand, transition: 'width .1s linear' }} />
              </div>
            ) : null}
            <div className="cg-x" style={{ fontSize: 30, textAlign: 'center', padding: '8px 0' }} lang="en">
              {phase.q.word}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {phase.q.options.map((o, i) => {
                const cls = phase.k === 'lost' ? (i === phase.q.answer ? ' right' : i === phase.picked ? ' wrong' : '') : '';
                return (
                  <button key={i} className={`cg-opt${cls}`} disabled={phase.k !== 'ask'} onClick={() => pick(i)}>
                    <span className="cg-kbd" style={{ marginRight: 8 }}>{i + 1}</span>
                    {o}
                  </button>
                );
              })}
            </div>
            {phase.k === 'lost' ? (
              <div className="cg-row" style={{ justifyContent: 'space-between' }}>
                <span className="cg-muted" style={{ fontSize: 14 }}>
                  {L({ vi: `Nghĩa đúng: ${phase.q.options[phase.q.answer]}`, en: `Correct meaning: ${phase.q.options[phase.q.answer]}` })}
                </span>
                <button className="cg-btn primary" onClick={again}>
                  {L({ vi: 'Thử lại', en: 'Try again' })}
                </button>
              </div>
            ) : null}
          </>
        ) : null}

        {phase.k === 'won' ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '18px 0' }}>
            <span className="cg-catch" style={{ fontSize: 72 }} aria-hidden>
              {phase.s.glyph}
            </span>
            <span className="cg-x" style={{ fontSize: 24 }}>{L({ vi: phase.s.vi, en: phase.s.en })}</span>
            <span className="cg-chip" style={{ color: RARITY_INFO[phase.s.rarity].color, fontFamily: CG.fontBold }}>
              {'★'.repeat(phase.s.rarity)} {L({ vi: RARITY_INFO[phase.s.rarity].vi, en: ['', 'Common', 'Rare', 'Precious', 'Legendary'][phase.s.rarity]! })}
            </span>
            <span className="cg-muted" style={{ fontSize: 14, textAlign: 'center' }}>
              {phase.stars > 0 ? L({ vi: `+${phase.stars} sao`, en: `+${phase.stars} stars` }) : L({ vi: 'Hôm nay đã đủ sao từ câu cá & bắt bọ — con này vẫn vào bộ sưu tập.', en: "Today's catch stars are maxed — it still goes into your collection." })}
              {phase.fast ? L({ vi: ' · trả lời nhanh!', en: ' · quick answer!' }) : ''}
            </span>
            <button className="cg-btn primary" style={{ marginTop: 6 }} onClick={again}>
              {fish ? L({ vi: 'Câu tiếp', en: 'Cast again' }) : L({ vi: 'Bắt tiếp', en: 'Catch again' })}
            </button>
          </div>
        ) : null}

        <span className="cg-muted" style={{ fontSize: 14, textAlign: 'center' }}>
          {L({ vi: `Sao từ câu cá & bắt bọ còn nhận được hôm nay: ${capLeft}/${CATCH_DAILY_CAP}`, en: `Fishing & bug stars left today: ${capLeft}/${CATCH_DAILY_CAP}` })}
        </span>
      </div>
    </Modal>
  );
}

// ------------------------------------------------------------------ bộ sưu tập

export function CollectionSheet({ onClose }: { onClose: () => void }) {
  const { L } = useL();
  const collection = useCityLifeStore((s) => s.collection);
  const got = SPECIES.filter((s) => (collection[s.id]?.n ?? 0) > 0).length;
  const groups: { kind: CatchKind; title: string }[] = [
    { kind: 'fish', title: L({ vi: 'Cá & sinh vật nước', en: 'Fish & water creatures' }) },
    { kind: 'bug', title: L({ vi: 'Côn trùng', en: 'Bugs' }) },
  ];
  return (
    <Modal title={L({ vi: `🎒 Bộ sưu tập · ${got}/${SPECIES.length}`, en: `🎒 Collection · ${got}/${SPECIES.length}` })} onClose={onClose}>
      <div className="cg-bar" style={{ marginBottom: 12 }}>
        <i style={{ width: `${(got / SPECIES.length) * 100}%` }} />
      </div>
      {groups.map((g) => (
        <section key={g.kind} style={{ marginBottom: 14 }}>
          <h3 className="cg-b" style={{ margin: '0 0 8px', fontSize: 16 }}>{g.title}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(118px, 1fr))', gap: 8 }}>
            {SPECIES.filter((s) => s.kind === g.kind).map((s) => {
              const c = collection[s.id];
              const seen = (c?.n ?? 0) > 0;
              return (
                <div key={s.id} className="cg-card" style={{ cursor: 'default', flexDirection: 'column', alignItems: 'center', display: 'flex', gap: 2, opacity: seen ? 1 : 0.55 }}>
                  <span aria-hidden style={{ fontSize: 32, filter: seen ? 'none' : 'grayscale(1) brightness(0.2)' }}>{s.glyph}</span>
                  <span className="cg-b" style={{ fontSize: 14, textAlign: 'center' }}>{seen ? L({ vi: s.vi, en: s.en }) : '???'}</span>
                  <span style={{ fontSize: 14, color: RARITY_INFO[s.rarity].color }}>{'★'.repeat(s.rarity)}</span>
                  {seen ? <span className="cg-muted" style={{ fontSize: 14 }}>×{c!.n}</span> : null}
                </div>
              );
            })}
          </div>
        </section>
      ))}
      <p className="cg-muted" style={{ fontSize: 14, margin: 0 }}>
        {L({
          vi: 'Đi dạo tới mép nước để câu cá, tới cạnh cây / bụi hoa để bắt bọ. Mỗi lần là một câu hỏi từ vựng lấy từ các bộ từ bạn đang học.',
          en: 'Walk to the water to fish, or next to trees and flowers to catch bugs. Each try is a vocabulary question from the word sets you are studying.',
        })}
      </p>
    </Modal>
  );
}
