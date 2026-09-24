import React, { useEffect, useState } from 'react';
import { Platform, Text, View } from 'react-native';

import { anim, ensureGameKeyframes, MOVE } from './game-anim';
import { PixelSprite } from './PixelSprite';
import { titleForLevel } from '@/services/game/rules';
import { lifetimePoints } from '@/services/gamification/points';
import { useGameFx, type FxEvent } from '@/store/useGameFx';
import { useGameStore } from '@/store/useGameStore';
import { useRewardStore } from '@/store/useRewardStore';
import { useStudyStore } from '@/store/useStudyStore';

/**
 * LỚP HIỆU ỨNG TOÀN APP, nằm trên mọi màn: băng rôn LÊN CẤP giữa màn, thẻ báo
 * huy hiệu / nhiệm vụ / XP ở góc dưới, và số XP bay ở góc trên khi màn đang học
 * không có thanh trận đấu.
 *
 * Không nhận chạm (`pointerEvents="none"`): không bao giờ che nút của màn học.
 * Chỉ chạy trên web; mọi hoạt cảnh tự tắt bằng CSS, không có bộ đếm giờ.
 */

ensureGameKeyframes();

const TOAST_KINDS: FxEvent['kind'][] = ['achievement', 'quest', 'batch'];

export function GameFxLayer() {
  const [since] = useState(() => useGameFx.getState().events.at(-1)?.id ?? 0);
  const events = useGameFx((s) => s.events);
  if (Platform.OS !== 'web') return null;

  const fresh = events.filter((e) => e.id > since);
  const level = [...fresh].reverse().find((e): e is Extract<FxEvent, { kind: 'levelup' }> => e.kind === 'levelup');
  // Thẻ XP của bài chấm một lượt chỉ hiện ở đây khi không có thanh trận đấu diễn thay.
  const toasts = fresh.filter((e) => TOAST_KINDS.includes(e.kind) && (e.kind !== 'batch' || e.global)).slice(-3);
  const chips = fresh.filter((e) => e.global && (e.kind === 'hit' || e.kind === 'hurt' || e.kind === 'defeat' || e.kind === 'stars')).slice(-3);

  return (
    <View pointerEvents="none" style={{ position: 'fixed' as 'absolute', left: 0, top: 0, right: 0, bottom: 0, zIndex: 80 }}>
      <StudyStarWatcher />
      {level ? <LevelBanner key={level.id} level={level.level} /> : null}

      <View style={{ position: 'absolute', right: 16, bottom: 88, gap: 8, alignItems: 'flex-end', maxWidth: 340 }}>
        {toasts.map((e) => (
          <Toast key={e.id} e={e} />
        ))}
      </View>

      {chips.map((e) => {
        const chip =
          e.kind === 'hit'
            ? { text: `+${e.xp} XP${e.crit ? ' · CHÍ MẠNG' : e.combo >= 3 ? ` · combo ×${e.combo}` : ''}`, c: '#FACC15', top: 116 }
            : e.kind === 'hurt'
              ? { text: '−1 ♥ · mất combo', c: '#FDA4AF', top: 116 }
              : e.kind === 'defeat'
                ? { text: `Hạ ${e.name}! +${e.bonusXp} XP`, c: '#FACC15', top: 150 }
                : e.kind === 'stars'
                  ? { text: `+${e.amount} ⭐ ${e.reason}`, c: '#FDE68A', top: 184 }
                  : null;
        if (!chip) return null;
        return (
          <View key={e.id} style={{ position: 'absolute', right: 16, top: chip.top, ...anim('rg-float', e.kind === 'defeat' ? 1800 : 1100) }}>
            <View style={{ borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5, backgroundColor: '#1B1540', boxShadow: '0 6px 18px rgba(27,21,64,0.35)' } as object}>
              <Text className="font-heavy" style={{ fontSize: 13, color: chip.c }}>
                {chip.text}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function LevelBanner({ level }: { level: number }) {
  return (
    <View style={{ position: 'absolute', left: 0, right: 0, top: '22%', alignItems: 'center', ...anim('rg-banner', 3000, { fill: 'forwards' }) }}>
      <View style={{ width: 300, height: 300, position: 'absolute', top: -96, alignItems: 'center', justifyContent: 'center', opacity: 0.55 }}>
        <View style={{ width: 300, height: 300, ...anim('rg-rays', 6000, { loop: true, timing: 'linear' }) }} {...MOVE}>
          {Array.from({ length: 12 }, (_, i) => (
            <View
              key={i}
              style={{ position: 'absolute', left: 146, top: 0, width: 8, height: 150, backgroundColor: i % 2 ? 'rgba(250,204,21,0.35)' : 'rgba(255,255,255,0.25)', transform: [{ rotate: `${i * 30}deg` }], transformOrigin: '50% 100%' }}
            />
          ))}
        </View>
      </View>
      <View style={{ alignItems: 'center', minWidth: 200, borderRadius: 22, paddingHorizontal: 30, paddingVertical: 18, backgroundColor: '#1B1540', borderWidth: 3, borderColor: '#FACC15', boxShadow: '0 18px 50px rgba(27,21,64,0.45)' } as object}>
        <PixelSprite name="hero" size={76} />
        <Text className="font-heavy" style={{ marginTop: 6, fontSize: 14, letterSpacing: 3, color: '#FDE68A' }}>
          LÊN CẤP
        </Text>
        <Text className="font-heavy" style={{ fontSize: 56, lineHeight: 62, color: '#FFFFFF' }}>
          {level}
        </Text>
        <Text className="font-semi" style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>
          Danh hiệu: {titleForLevel(level)}
        </Text>
      </View>
    </View>
  );
}

function Toast({ e }: { e: FxEvent }) {
  const body =
    e.kind === 'achievement'
      ? { glyph: e.glyph, head: 'Huy hiệu mới', text: e.title }
      : e.kind === 'quest'
        ? { glyph: '📜', head: 'Xong nhiệm vụ ngày', text: `${e.title} — vào trang Nhân vật nhận thưởng` }
        : e.kind === 'batch'
          ? {
              glyph: '⚔️',
              head: `+${e.xp} XP`,
              text:
                e.total > 0
                  ? `${e.correct}/${e.total} câu đúng${e.defeated > 0 ? ` · hạ ${e.defeated} quái` : ''}`
                  : 'Phần thưởng đã vào túi',
            }
          : null;
  if (!body) return null;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#1B1540', borderWidth: 1.5, borderColor: 'rgba(250,204,21,0.55)', ...anim('rg-toast', 4200, { fill: 'forwards' }) }}>
      <Text style={{ fontSize: 22 }}>{body.glyph}</Text>
      <View style={{ flexShrink: 1 }}>
        <Text className="font-heavy" style={{ fontSize: 13, color: '#FACC15' }}>
          {body.head}
        </Text>
        <Text className="font-semi" style={{ fontSize: 13, color: '#FFFFFF' }}>
          {body.text}
        </Text>
      </View>
    </View>
  );
}

/**
 * Sao từ VIỆC HỌC (thời gian + số câu) tăng dần trong lúc học — mỗi lần tăng thì
 * bắn "+N ⭐" để người học thấy sao rơi vào túi ngay trong bài, không chỉ ở trang
 * Đổi sao. Bỏ qua cú nhảy lớn (dữ liệu vừa nạp từ máy hay từ tài khoản).
 */
function StudyStarWatcher() {
  useEffect(() => {
    const total = () => Math.round(lifetimePoints(useStudyStore.getState().daily, useRewardStore.getState().frozenDays));
    let last = total();
    return useStudyStore.subscribe(() => {
      const now = total();
      const gain = now - last;
      last = now;
      if (gain > 0 && gain <= 20 && useGameStore.getState().enabled) {
        useGameFx.getState().push({ kind: 'stars', amount: gain, reason: 'học' });
      }
    });
  }, []);
  return null;
}
