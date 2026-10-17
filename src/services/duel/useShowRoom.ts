import { useCallback, useEffect, useRef, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';

import { hasSupabaseConfig } from '@/lib/env';
import { getSupabase } from '@/lib/supabase';
import type { StudyWord } from '@/services/vocab/topic-study';
import { buildDuel, type DuelQuestion } from './duel';
import {
  COUNTDOWN_MS,
  emptyShowState,
  isOver,
  rankingOf,
  resolveRound,
  SHOW_LIMIT_MS,
  SHOW_QUESTIONS,
  type ShowAnswer,
  type ShowMode,
  type ShowState,
} from './hosted';

/**
 * Phòng đấu chiếu lớp, qua Supabase Realtime (kênh riêng `show-<mã>`, không dùng
 * chung với phòng 1–1).
 *
 * Ba vai:
 *   - `host`: người điều khiển. CHỈ máy này tính kết quả và phát `state`.
 *   - `player`: học sinh. Chỉ gửi `answer` về chủ phòng.
 *   - `screen`: màn chiếu. Chỉ nhận `state`, không được tính là người chơi.
 *
 * Vai `host` cần `words` (bộ từ) để dựng đúng câu hỏi và biết đáp án đúng.
 */

export type ShowRole = 'host' | 'player' | 'screen';

type Presence = { id: string; name: string; role: ShowRole; joinedAt: number; deck?: string; mode?: ShowMode };
export type ShowMember = { id: string; name: string; role: ShowRole; deck?: string; mode?: ShowMode };

export function useShowRoom(code: string, me: { id: string; name: string } | null, role: ShowRole, words?: readonly StudyWord[], hostDeck?: string, hostMode?: ShowMode) {
  const [status, setStatus] = useState<'connecting' | 'ready' | 'offline'>(() => (hasSupabaseConfig() ? 'connecting' : 'offline'));
  const [members, setMembers] = useState<ShowMember[]>([]);
  const [state, setState] = useState<ShowState | null>(null);
  const channel = useRef<RealtimeChannel | null>(null);

  // Trạng thái và câu hỏi của chủ phòng — chỉ dùng ở máy host.
  const stateRef = useRef<ShowState | null>(null);
  const answersRef = useRef<ShowAnswer[]>([]);
  const questionsRef = useRef<DuelQuestion[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wordsRef = useRef<readonly StudyWord[] | undefined>(words);
  wordsRef.current = words;
  const membersRef = useRef<ShowMember[]>([]);
  membersRef.current = members;

  // Máy học sinh đo thời gian trả lời từ lúc NHẬN câu hỏi, không dùng đồng hồ của chủ phòng.
  const localStart = useRef<{ index: number; t: number }>({ index: -2, t: 0 });

  const broadcast = useCallback((s: ShowState) => {
    stateRef.current = s;
    setState(s);
    void channel.current?.send({ type: 'broadcast', event: 'state', payload: s });
  }, []);

  const clearTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  };

  // ---------------------------------------------------------------- chủ phòng

  const reveal = useCallback(() => {
    clearTimer();
    const s = stateRef.current;
    if (!s || s.phase !== 'question') return;
    const q = questionsRef.current[s.index];
    if (!q) return;
    const r = resolveRound(s, answersRef.current, q.correctIndex);
    broadcast({
      ...s,
      phase: 'reveal',
      scores: r.scores,
      lives: r.lives,
      answered: s.answered,
      reveal: { correctIndex: q.correctIndex, counts: r.counts, correct: r.correct, eliminated: r.eliminated },
    });
  }, [broadcast]);

  const finish = useCallback(() => {
    clearTimer();
    const s = stateRef.current;
    if (!s) return;
    broadcast({ ...s, phase: 'done', ranking: rankingOf(s) });
  }, [broadcast]);

  const nextQuestion = useCallback(() => {
    const s = stateRef.current;
    if (!s) return;
    const index = s.index + 1;
    if (index >= s.total || questionsRef.current.length === 0) {
      finish();
      return;
    }
    answersRef.current = [];
    broadcast({ ...s, phase: 'question', index, at: Date.now(), limit: SHOW_LIMIT_MS, answered: [], reveal: null });
    clearTimer();
    timerRef.current = setTimeout(() => reveal(), SHOW_LIMIT_MS + 400);
  }, [broadcast, finish, reveal]);

  /** Bắt đầu ván: khoá danh sách người chơi, dựng câu hỏi, đếm ngược rồi vào câu 1. */
  const start = useCallback(
    (mode: ShowMode, deck: string) => {
      if (role !== 'host' || !code) return;
      const w = wordsRef.current;
      const players = membersRef.current.filter((m) => m.role === 'player');
      if (!w || w.length < 4 || players.length === 0) return;
      const seed = `${code}:${Date.now()}`;
      questionsRef.current = buildDuel(w, seed, SHOW_QUESTIONS);
      const base = emptyShowState(mode, deck);
      const lives: Record<string, number> = {};
      const names: Record<string, string> = {};
      for (const p of players) {
        names[p.id] = p.name;
        lives[p.id] = mode === 'survival' ? 3 : 0;
      }
      answersRef.current = [];
      broadcast({
        ...base,
        seed,
        total: questionsRef.current.length,
        phase: 'counting',
        at: Date.now() + COUNTDOWN_MS,
        roster: players.map((p) => p.id),
        names,
        lives,
        scores: {},
      });
      clearTimer();
      timerRef.current = setTimeout(() => nextQuestion(), COUNTDOWN_MS);
    },
    [broadcast, code, nextQuestion, role],
  );

  /** Nút "Câu tiếp" của chủ phòng: sau đáp án thì sang câu sau, hoặc kết thúc nếu đã hết. */
  const advance = useCallback(() => {
    const s = stateRef.current;
    if (!s) return;
    if (s.phase === 'reveal') {
      if (isOver(s)) finish();
      else nextQuestion();
    } else if (s.phase === 'question') {
      reveal();
    }
  }, [finish, nextQuestion, reveal]);

  // ----------------------------------------------------------- học sinh

  /** Học sinh chọn đáp án của câu hiện tại (một lần cho mỗi câu). */
  const answer = useCallback(
    (choice: number) => {
      const s = state;
      if (role !== 'player' || !me || !s || s.phase !== 'question') return;
      const ms = localStart.current.index === s.index ? Math.max(0, Date.now() - localStart.current.t) : SHOW_LIMIT_MS;
      void channel.current?.send({
        type: 'broadcast',
        event: 'answer',
        payload: { id: me.id, index: s.index, choice, ms } satisfies ShowAnswer,
      });
    },
    [me, role, state],
  );

  // ------------------------------------------------------------ kết nối

  useEffect(() => {
    if (!me || !code || !hasSupabaseConfig()) return;
    const supabase = getSupabase();
    const ch = supabase.channel(`show-${code}`, {
      config: { broadcast: { self: false }, presence: { key: me.id } },
    });
    channel.current = ch;

    ch.on('presence', { event: 'sync' }, () => {
      const presence = ch.presenceState<Presence>();
      const all = Object.values(presence)
        .flat()
        .sort((a, b) => a.joinedAt - b.joinedAt);
      const seen = new Set<string>();
      const list: ShowMember[] = [];
      for (const p of all) {
        if (seen.has(p.id)) continue;
        seen.add(p.id);
        list.push({ id: p.id, name: p.name, role: p.role, deck: p.deck, mode: p.mode });
      }
      setMembers(list);
      // Người vừa vào giữa ván cần trạng thái hiện tại: chủ phòng phát lại.
      if (role === 'host' && stateRef.current) {
        void ch.send({ type: 'broadcast', event: 'state', payload: stateRef.current });
      }
    });

    ch.on('broadcast', { event: 'state' }, ({ payload }) => {
      const s = payload as ShowState;
      if (s.phase === 'question' && localStart.current.index !== s.index) {
        localStart.current = { index: s.index, t: Date.now() };
      }
      setState(s);
    });

    ch.on('broadcast', { event: 'answer' }, ({ payload }) => {
      if (role !== 'host') return;
      const a = payload as ShowAnswer;
      const s = stateRef.current;
      if (!s || s.phase !== 'question' || a.index !== s.index) return;
      if (!s.roster.includes(a.id) || answersRef.current.some((x) => x.id === a.id)) return;
      if ((s.mode === 'survival') && (s.lives[a.id] ?? 0) <= 0) return;
      answersRef.current.push({ ...a, choice: Math.max(-1, Math.min(3, Math.round(a.choice))) });
      const answered = [...s.answered, a.id];
      stateRef.current = { ...s, answered };
      setState(stateRef.current);
      void ch.send({ type: 'broadcast', event: 'state', payload: stateRef.current });
      const alive = s.mode === 'survival' ? s.roster.filter((id) => (s.lives[id] ?? 0) > 0) : s.roster;
      if (alive.every((id) => answered.includes(id))) reveal();
    });

    ch.subscribe((st) => {
      if (st === 'SUBSCRIBED') {
        setStatus('ready');
        void ch.track({
          id: me.id,
          name: me.name,
          role,
          joinedAt: Date.now(),
          ...(role === 'host' && hostDeck ? { deck: hostDeck } : {}),
          ...(role === 'host' && hostMode ? { mode: hostMode } : {}),
        } satisfies Presence);
      } else if (st === 'CHANNEL_ERROR' || st === 'TIMED_OUT' || st === 'CLOSED') {
        setStatus('offline');
      }
    });

    return () => {
      clearTimer();
      channel.current = null;
      void supabase.removeChannel(ch);
    };
    // Kênh chỉ mở lại khi đổi phòng hoặc vai; hostDeck/hostMode chỉ đọc lúc tham gia.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, me?.id, me?.name, role, reveal]);

  const players = members.filter((m) => m.role === 'player');
  const host = members.find((m) => m.role === 'host') ?? null;
  const screens = members.filter((m) => m.role === 'screen').length;

  return { status, members, players, host, screens, state, start, advance, answer, finish };
}
