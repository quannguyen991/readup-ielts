import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { PixelPanel, T } from '@/components/travel/ui/kit';
import { useL } from '@/i18n/useL';
import { BOARD_LIMIT, TOP_SHOWN, myStanding, parseBoard, type BoardData } from '@/services/travel/leaderboard';
import { monthPointsOf } from '@/services/travel/passport';
import { MONTHLY_PRIZES, prizeLabelForRank } from '@/services/travel/passport-rewards';
import { todayKey } from '@/store/persist';
import { useAuthStore } from '@/store/useAuthStore';
import { useTravelStore } from '@/store/useTravelStore';

type State = { kind: 'loading' } | { kind: 'ok'; data: BoardData } | { kind: 'offline' };

/** Gọi máy chủ; lỗi mạng, thiếu cấu hình hoặc phản hồi sai dạng đều ra trạng thái "offline" (không sập). */
function useTravelBoard(): State {
  const [state, setState] = useState<State>({ kind: 'loading' });
  useEffect(() => {
    let alive = true;
    fetch('/api/travel-leaderboard')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((raw) => {
        const data = parseBoard(raw);
        if (alive) setState(data ? { kind: 'ok', data } : { kind: 'offline' });
      })
      .catch(() => {
        if (alive) setState({ kind: 'offline' });
      });
    return () => {
      alive = false;
    };
  }, []);
  return state;
}

/** Tab "Xếp hạng": "Ai đi nhiều nhất" tháng này — top 10, hạng của mình, giải tháng. Phát giải do quản trị làm tay. */
export function PassportBoard() {
  const { L, en } = useL();
  const state = useTravelBoard();
  const ledger = useTravelStore((s) => s.ledger);
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const month = todayKey().slice(0, 7);
  const mine = monthPointsOf(ledger, month);
  const myId = userId ? userId.slice(0, 8) : null;
  const board = state.kind === 'ok' ? state.data.board : [];
  const me = myStanding(board, myId, mine);
  const prizeOf = (rank: number) => {
    const p = prizeLabelForRank(rank);
    return p ? (en ? p.en : p.vi) : null;
  };

  return (
    <View style={{ gap: 14 }}>
      <PixelPanel tone="navy" inner={{ padding: 16, gap: 8 }}>
        <Text className="font-heavy" style={{ fontSize: 20, color: T.goldLight }}>
          {L('Ai đi nhiều nhất', 'Who travelled most')}
        </Text>
        <Text className="font-sans" style={{ fontSize: 14, color: T.cream }}>
          {L(`Tháng ${month.slice(5)}/${month.slice(0, 4)} · xếp theo điểm hộ chiếu`, `${month} · ranked by passport points`)}
        </Text>
        <Text className="font-strong" style={{ fontSize: 14, color: T.goldLight, marginTop: 4 }}>
          {L('Giải tháng này', 'This month’s prizes')}
        </Text>
        <View style={{ gap: 2 }}>
          {MONTHLY_PRIZES.map((p, i) => {
            const from = i === 0 ? 1 : MONTHLY_PRIZES[i - 1]!.upTo + 1;
            const range = from === p.upTo ? `#${from}` : `#${from}–${p.upTo}`;
            return (
              <Text key={p.upTo} className="font-sans" style={{ fontSize: 14, color: T.cream }}>
                <Text className="font-strong">{range}</Text> · {en ? p.label.en : p.label.vi}
              </Text>
            );
          })}
        </View>
      </PixelPanel>

      {state.kind === 'loading' ? (
        <Text className="font-sans" style={{ fontSize: 15, color: T.muted }}>
          {L('Đang tải…', 'Loading…')}
        </Text>
      ) : state.kind === 'offline' ? (
        <Empty text={L('Chưa nối được bảng xếp hạng. Điểm của bạn vẫn được lưu.', 'Could not reach the leaderboard. Your points are still saved.')} />
      ) : board.length === 0 ? (
        <Empty text={L('Chưa ai có điểm tháng này. Đi một vòng là bạn đứng đầu.', 'Nobody has points this month yet. Take a trip and lead.')} />
      ) : (
        <PixelPanel inner={{ padding: 6 }}>
          <View accessibilityRole="list">
            {board.slice(0, TOP_SHOWN).map((r, i) => (
              <Row key={r.id} rank={i + 1} name={r.name} points={r.points} prize={prizeOf(i + 1)} you={r.id === myId} />
            ))}
          </View>
        </PixelPanel>
      )}

      <PixelPanel tone={me.inTop ? 'paper' : 'navy'} inner={{ padding: 6 }}>
        <Row
          rank={me.rank}
          name={L('Bạn', 'You')}
          points={me.points}
          prize={me.rank ? prizeOf(me.rank) : null}
          you
          note={!userId ? L('Đăng nhập để lên bảng', 'Sign in to appear') : me.rank === null && state.kind === 'ok' ? L(`Ngoài top ${BOARD_LIMIT}`, `Outside the top ${BOARD_LIMIT}`) : undefined}
          dark={!me.inTop}
        />
      </PixelPanel>
    </View>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <PixelPanel inner={{ padding: 16 }}>
      <Text className="font-strong" style={{ fontSize: 15, color: T.muted }}>
        {text}
      </Text>
    </PixelPanel>
  );
}

function Row({ rank, name, points, prize, you, note, dark }: { rank: number | null; name: string; points: number; prize: string | null; you?: boolean; note?: string; dark?: boolean }) {
  const { L } = useL();
  const ink = dark ? T.goldLight : T.ink;
  const sub = dark ? T.cream : T.muted;
  return (
    <View accessibilityRole="text" style={{ minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: you && !dark ? T.goldLight : 'transparent', borderRadius: 4 }}>
      <Text className="font-heavy" style={{ width: 36, fontSize: 18, color: ink, textAlign: 'center' }}>
        {rank ?? '—'}
      </Text>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text className="font-strong" numberOfLines={1} style={{ fontSize: 16, color: ink }}>
          {name}
        </Text>
        {prize || note ? (
          <Text className="font-sans" numberOfLines={1} style={{ fontSize: 14, color: sub }}>
            {prize ? `${L('Giải: ', 'Prize: ')}${prize}` : note}
          </Text>
        ) : null}
      </View>
      <Text className="font-heavy" style={{ fontSize: 17, color: ink }}>
        {points}
      </Text>
    </View>
  );
}
