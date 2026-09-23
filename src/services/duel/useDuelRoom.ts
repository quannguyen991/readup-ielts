import { useEffect, useRef, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';

import { hasSupabaseConfig } from '@/lib/env';
import { getSupabase } from '@/lib/supabase';
import { addAnswer, emptyTally, type PlayerTally } from './duel';

export type DuelPlayer = { id: string; name: string };
export type DuelStart = { seed: string; deck: string; at: number };

type AnswerMsg = { id: string; index: number; correct: boolean; ms: number };

/**
 * Phòng đấu qua Supabase Realtime — không cần bảng nào trong cơ sở dữ liệu:
 * - PRESENCE: ai đang ở trong phòng (tên, id).
 * - BROADCAST: `start` (hạt + bộ từ + mốc giờ), `answer` (một câu vừa trả lời),
 *   `finish`. Máy nào cũng tự tính điểm của đối thủ từ các gói `answer`.
 *
 * Kênh chỉ sống khi cả hai đang mở trang; đóng tab là rời phòng.
 */
export function useDuelRoom(code: string, me: DuelPlayer | null, hostDeck?: string) {
  // Chưa cấu hình máy chủ thì "ngoại tuyến" ngay từ đầu — không đặt state trong effect.
  const [status, setStatus] = useState<'connecting' | 'ready' | 'offline'>(() => (hasSupabaseConfig() ? 'connecting' : 'offline'));
  const [players, setPlayers] = useState<DuelPlayer[]>([]);
  const [start, setStart] = useState<DuelStart | null>(null);
  const [tallies, setTallies] = useState<Record<string, PlayerTally>>({});
  const [finished, setFinished] = useState<Record<string, boolean>>({});
  // Chủ phòng gắn mã bộ từ vào presence để khách thấy sẽ đấu bộ nào ngay từ sảnh chờ.
  const [lobbyDeck, setLobbyDeck] = useState<string | null>(null);
  const channel = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!me || !code || !hasSupabaseConfig()) return;
    const supabase = getSupabase();
    const ch = supabase.channel(`duel-${code}`, {
      config: { broadcast: { self: false }, presence: { key: me.id } },
    });
    channel.current = ch;

    ch.on('presence', { event: 'sync' }, () => {
      const state = ch.presenceState<DuelPlayer & { joinedAt: number; deck?: string }>();
      const all = Object.values(state)
        .flat()
        .sort((a, b) => a.joinedAt - b.joinedAt);
      const deck = all.find((p) => p.deck)?.deck;
      if (deck) setLobbyDeck(deck);
      const list = all.map((p) => ({ id: p.id, name: p.name }));
      // Mỗi người một dòng dù mở nhiều kết nối.
      setPlayers(list.filter((p, i) => list.findIndex((q) => q.id === p.id) === i));
    });
    ch.on('broadcast', { event: 'start' }, ({ payload }) => {
      setStart(payload as DuelStart);
      setTallies({});
      setFinished({});
    });
    ch.on('broadcast', { event: 'answer' }, ({ payload }) => {
      const a = payload as AnswerMsg;
      setTallies((t) => ({ ...t, [a.id]: addAnswer(t[a.id] ?? emptyTally(), a.correct, a.ms) }));
    });
    ch.on('broadcast', { event: 'finish' }, ({ payload }) => {
      const id = (payload as { id: string }).id;
      setFinished((f) => ({ ...f, [id]: true }));
    });
    ch.subscribe((s) => {
      if (s === 'SUBSCRIBED') {
        setStatus('ready');
        void ch.track({ id: me.id, name: me.name, joinedAt: Date.now(), ...(hostDeck ? { deck: hostDeck } : {}) });
      } else if (s === 'CHANNEL_ERROR' || s === 'TIMED_OUT' || s === 'CLOSED') {
        setStatus('offline');
      }
    });
    return () => {
      channel.current = null;
      void supabase.removeChannel(ch);
    };
  }, [code, me, hostDeck]);

  const send = (event: 'start' | 'answer' | 'finish', payload: object) => {
    void channel.current?.send({ type: 'broadcast', event, payload });
  };

  /** Chủ phòng phát lệnh bắt đầu; máy mình cũng tự bắt đầu (broadcast không vọng lại mình). */
  const begin = (deck: string) => {
    const s: DuelStart = { seed: `${code}:${Date.now()}`, deck, at: Date.now() + 3500 };
    setStart(s);
    setTallies({});
    setFinished({});
    send('start', s);
  };

  const answer = (index: number, correct: boolean, ms: number) => {
    if (!me) return;
    setTallies((t) => ({ ...t, [me.id]: addAnswer(t[me.id] ?? emptyTally(), correct, ms) }));
    send('answer', { id: me.id, index, correct, ms } satisfies AnswerMsg);
  };

  const finish = () => {
    if (!me) return;
    setFinished((f) => ({ ...f, [me.id]: true }));
    send('finish', { id: me.id });
  };

  return { status, players, start, tallies, finished, lobbyDeck, begin, answer, finish };
}
