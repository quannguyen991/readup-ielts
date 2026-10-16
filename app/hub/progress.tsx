import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { HubScreen } from '@/components/hub/HubScreen';
import { GLASS_CARD, HUB } from '@/components/hub/theme';
import { Icon } from '@/components/ui/Icon';
import { ALL_LESSONS } from '@/services/hub/grammar-course';
import { PHONEMES } from '@/services/hub/phonemes';
import { ROLEPLAYS } from '@/services/hub/roleplay';
import { dayKeyOf, streakDays, weekStrip } from '@/services/hub/daily';
import { useHubStore } from '@/store/useHubStore';
import { useAuthStore } from '@/store/useAuthStore';

/** Tiến độ: chỉ số đo được từ luyện tập trên máy này, không có điểm bịa. */
export default function HubProgress() {
  const best = useHubStore((s) => s.phonemeBest);
  const tries = useHubStore((s) => s.phonemeTries);
  const lessons = useHubStore((s) => s.lessonsDone);
  const roleplays = useHubStore((s) => s.roleplayDone);
  const doneByDay = useHubStore((s) => s.doneByDay);
  const today = dayKeyOf(new Date());

  const practised = Object.keys(best);
  const avg = practised.length ? Math.round(practised.reduce((sum, k) => sum + (best[k] ?? 0), 0) / practised.length) : null;
  const weekDays = weekStrip(doneByDay, today).filter((d) => d.done).length;
  const streak = streakDays(doneByDay, today);

  const rows: { label: string; detail: string; value: number | null }[] = [
    { label: 'Phát âm', detail: avg === null ? 'Chưa luyện âm nào' : `Điểm tốt nhất trung bình ${avg}/100 trên ${practised.length} âm`, value: avg },
    { label: 'Ngữ pháp', detail: `${Object.keys(lessons).length}/${ALL_LESSONS.length} bài từ A1 đến C đã đạt`, value: Math.round((Object.keys(lessons).length / ALL_LESSONS.length) * 100) },
    { label: 'Nhập vai', detail: `${Object.keys(roleplays).length}/${ROLEPLAYS.length} kịch bản đã đạt`, value: Math.round((Object.keys(roleplays).length / ROLEPLAYS.length) * 100) },
    { label: 'Đều đặn', detail: `${weekDays}/7 ngày có nhiệm vụ · chuỗi ${streak} ngày`, value: Math.round((weekDays / 7) * 100) },
  ];

  return (
    <HubScreen title="Tiến độ" subtitle="Số liệu đo từ luyện tập trên máy này">
      <View style={[GLASS_CARD, { padding: 16, gap: 14 }]}>
        <Text style={{ color: HUB.ink, fontSize: 16, fontWeight: '800' }}>Bốn chỉ số</Text>
        {rows.map((r) => (
          <View key={r.label} style={{ gap: 4 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: HUB.ink, fontSize: 13, fontWeight: '700' }}>{r.label}</Text>
              <Text style={{ color: HUB.ink, fontSize: 13, fontWeight: '800' }}>{r.value === null ? '—' : `${r.value}`}</Text>
            </View>
            <View style={{ height: 8, borderRadius: 4, backgroundColor: HUB.glassStrong, overflow: 'hidden' }}>
              {r.value !== null ? <View style={{ width: `${r.value}%`, height: 8, borderRadius: 4, backgroundColor: HUB.blue }} /> : null}
            </View>
            <Text style={{ color: HUB.muted, fontSize: 11 }}>{r.detail}</Text>
          </View>
        ))}
        <Text style={{ color: HUB.muted, fontSize: 11, lineHeight: 16 }}>
          Chưa có chỉ số ngữ điệu, ngữ pháp trong bản ghi tự do và độ mạch lạc: cần phân tích âm thanh, sẽ có sau.
        </Text>
      </View>

      <View style={[GLASS_CARD, { padding: 16, gap: 12 }]}>
        <Text style={{ color: HUB.ink, fontSize: 16, fontWeight: '800' }}>Bảng 44 âm vị</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {PHONEMES.map((p) => {
            const s = best[p.symbol];
            const tone = s === undefined ? HUB.line : s >= 80 ? HUB.green : s >= 50 ? HUB.amber : HUB.red;
            return (
              <Pressable key={p.symbol} accessibilityRole="button" accessibilityLabel={`Âm ${p.symbol}${s !== undefined ? `, ${s} điểm` : ''}`} onPress={() => router.push(`/hub/phoneme/${encodeURIComponent(p.symbol)}` as never)} style={{ width: 52, height: 46, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: s === undefined ? HUB.glass : `${tone}33`, borderWidth: 1, borderColor: tone }}>
                <Text style={{ color: HUB.ink, fontSize: 13, fontWeight: '700' }}>/{p.symbol}/</Text>
                <Text style={{ color: HUB.muted, fontSize: 9 }}>{s === undefined ? `${tries[p.symbol] ?? 0} lần` : `${s}`}</Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={{ color: HUB.muted, fontSize: 11 }}>Xanh: từ 80 điểm. Vàng: 50–79. Đỏ: dưới 50. Xám: chưa luyện.</Text>
      </View>

      <Leaderboard />
      <Locked title="Nhờ giáo viên sửa âm còn yếu" desc="Gửi bản ghi âm cho người chấm thật. Chưa có đội ngũ người chấm." />
    </HubScreen>
  );
}

function Locked({ title, desc }: { title: string; desc: string }) {
  return (
    <View style={[GLASS_CARD, { padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, opacity: 0.7 }]}>
      <Icon name="lock" size={18} color={HUB.muted} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ color: HUB.ink, fontSize: 14, fontWeight: '700' }}>{title}</Text>
        <Text style={{ color: HUB.muted, fontSize: 12 }}>{desc}</Text>
      </View>
      <Text style={{ color: HUB.muted, fontSize: 10, fontWeight: '700' }}>SẮP CÓ</Text>
    </View>
  );
}

type Board = {
  top: { rank: number; name: string; points: number }[];
  me: { rank: number | null; points: number } | null;
};

/** Bảng xếp hạng tuần: chỉ hiện tên ẩn danh, và thứ hạng của chính bạn nếu đã đăng nhập. */
function Leaderboard() {
  const token = useAuthStore((s) => s.session?.access_token ?? null);
  const [board, setBoard] = useState<Board | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch('/api/hub/leaderboard', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((r) => (r.ok ? (r.json() as Promise<Board>) : Promise.reject(new Error('bad'))))
      .then((b) => alive && setBoard(b))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [token]);

  return (
    <View style={[GLASS_CARD, { padding: 16, gap: 10 }]}>
      <Text style={{ color: HUB.ink, fontSize: 16, fontWeight: '800' }}>Bảng xếp hạng tuần</Text>
      {failed ? <Text style={{ color: HUB.muted, fontSize: 12 }}>Chưa tải được bảng xếp hạng.</Text> : null}
      {!failed && !board ? <Text style={{ color: HUB.muted, fontSize: 12 }}>Đang tải…</Text> : null}
      {board && board.top.length === 0 ? <Text style={{ color: HUB.muted, fontSize: 12 }}>Chưa có ai có điểm trong tuần này.</Text> : null}
      {board?.top.map((r) => (
        <View key={`${r.rank}-${r.name}`} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ color: HUB.ink, fontSize: 13 }}>{r.rank}. {r.name}</Text>
          <Text style={{ color: HUB.body, fontSize: 13, fontWeight: '700' }}>{r.points} điểm</Text>
        </View>
      ))}
      {board?.me ? (
        <Text style={{ color: HUB.blue, fontSize: 13, fontWeight: '700' }}>
          Bạn: {board.me.rank ? `hạng ${board.me.rank}` : 'chưa vào top'} · {board.me.points} điểm
        </Text>
      ) : null}
      <Text style={{ color: HUB.muted, fontSize: 11 }}>Điểm = 10 cho mỗi nhiệm vụ trong 7 ngày + 5 cho mỗi âm đã thuộc. Tên hiển thị ẩn danh.</Text>
    </View>
  );
}
