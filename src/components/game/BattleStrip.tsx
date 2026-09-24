import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Platform, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import Svg, { Rect } from 'react-native-svg';

import { anim, ensureGameKeyframes, MOVE } from './game-anim';
import { PixelSprite } from './PixelSprite';
import { ENEMY_SPRITE } from './sprites';
import { CRIT_EVERY, enemyAt, ITEMS, levelProgress, MAX_HEARTS, type ItemKind } from '@/services/game/rules';
import { staleBefore, useGameFx, type FxEvent } from '@/store/useGameFx';
import { useGameStore } from '@/store/useGameStore';

/** Cạnh sắc cho pixel (react-native-svg chưa khai kiểu thuộc tính này, nhưng web vẫn nhận). */
const CRISP = { shapeRendering: 'crispEdges' } as object;

/**
 * THANH TRẬN ĐẤU nằm trên đầu màn học: nhân vật bên trái, quái bên phải.
 *
 * Trả lời đúng → nhân vật lao lên chém, quái nháy trắng và rung, số sát thương
 * và XP bay lên. Sai → quái lao sang đánh, mất một tim. Hạ quái → quái tan biến,
 * rơi đồ, con mới bước vào. Túi đồ và nút "Hỏi Cú" dùng vật phẩm ngay giữa bài.
 *
 * Thanh này chỉ ĐỌC trạng thái (`useGameStore`) và sự kiện (`useGameFx`); việc
 * chấm câu vẫn là của màn học, màn học chỉ gọi `answer()` đúng một lần mỗi câu.
 */

ensureGameKeyframes();

const ITEM_ORDER: ItemKind[] = ['potion', 'shield', 'double', 'hint'];
const GOLD = '#FACC15';

type Kind = FxEvent['kind'];

function lastOf<K extends Kind>(events: FxEvent[], since: number, kinds: K[]): Extract<FxEvent, { kind: K }> | undefined {
  for (let i = events.length - 1; i >= 0; i -= 1) {
    const e = events[i]!;
    if (e.id <= since) return undefined;
    if ((kinds as Kind[]).includes(e.kind)) return e as Extract<FxEvent, { kind: K }>;
  }
  return undefined;
}

export function BattleStrip({ className }: { className?: string }) {
  const enabled = useGameStore((s) => s.enabled);
  if (!enabled) return null;
  return <Strip className={className} />;
}

function Strip({ className }: { className?: string }) {
  // Chỉ tính là "đang hiện" khi thanh nằm trong khung nhìn — cuộn khuất thì lớp
  // hiệu ứng toàn app hiện số XP ở góc màn thay, không để lỡ đòn nào.
  const box = useRef<View>(null);
  useEffect(() => {
    const el = box.current as unknown as Element | null;
    if (Platform.OS !== 'web' || !el || typeof IntersectionObserver === 'undefined') return useGameFx.getState().mountStrip();
    let release: (() => void) | null = null;
    const io = new IntersectionObserver(
      ([entry]) => {
        // Gần như trọn thanh mới tính: khuất nửa trên là số bay trên đầu nhân vật cũng khuất.
        const on = Boolean(entry?.isIntersecting && entry.intersectionRatio >= 0.9);
        if (on && !release) release = useGameFx.getState().mountStrip();
        else if (!on && release) {
          release();
          release = null;
        }
      },
      // Chừa phần thanh đầu trang (điện thoại) — nằm dưới nó là bị che.
      { threshold: [0, 0.5, 0.9, 1], rootMargin: '-72px 0px 0px 0px' },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      release?.();
    };
  }, []);
  // Chỉ diễn những sự kiện xảy ra SAU khi thanh hiện — mở màn mới không chiếu lại trận cũ.
  const [since] = useState(staleBefore);
  const [bag, setBag] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const narrow = useWindowDimensions().width < 520;
  const web = Platform.OS === 'web';

  const xp = useGameStore((s) => s.xp);
  const combo = useGameStore((s) => s.combo);
  const hearts = useGameStore((s) => s.hearts);
  const enemyIndex = useGameStore((s) => s.enemyIndex);
  const enemyHp = useGameStore((s) => s.enemyHp);
  const shield = useGameStore((s) => s.shield);
  const doubleLeft = useGameStore((s) => s.doubleLeft);
  const items = useGameStore((s) => s.items);
  const hint = useGameFx((s) => s.hint);
  const events = useGameFx((s) => s.events);

  const enemy = enemyAt(enemyIndex);
  const lv = levelProgress(xp);
  const hit = lastOf(events, since, ['hit']);
  const hurt = lastOf(events, since, ['hurt', 'blocked', 'knockout']);
  const defeat = lastOf(events, since, ['defeat']);
  const floats = events.filter((e) => e.id > since && e.kind !== 'levelup' && e.kind !== 'achievement' && e.kind !== 'quest').slice(-6);
  // Đòn kết liễu thì quái MỚI không rung theo — nó vừa bước vào.
  const killing = Boolean(hit && defeat && defeat.id > hit.id);
  const heroAttacks = hit && (!hurt || hit.id > hurt.id);
  const heroKey = `${hit?.id ?? 0}-${hurt?.id ?? 0}`;
  const itemTotal = ITEM_ORDER.reduce((n, k) => n + (items[k] ?? 0), 0);

  const tryItem = (k: ItemKind) => {
    if ((items[k] ?? 0) <= 0) return setNote(`Hết ${ITEMS[k].name}. Hạ quái hoặc làm nhiệm vụ ngày để kiếm thêm.`);
    if (k === 'potion' && hearts >= MAX_HEARTS) return setNote('Tim đang đầy, để dành bình máu cho lúc cần.');
    if (k === 'shield' && shield) return setNote('Khiên đang bật rồi.');
    if (k === 'hint' && !hint) return setNote('Cú chỉ gợi ý được khi đang mở một câu trắc nghiệm hoặc câu gõ từ chưa trả lời.');
    const ok = useGameStore.getState().spendItem(k);
    setNote(ok ? null : 'Câu này không dùng gợi ý được nữa.');
    if (ok) setBag(false);
  };

  // Phím tắt như game mẫu: I mở túi đồ, H hỏi Cú. Bỏ qua khi đang gõ vào ô nhập.
  const keys = useRef<(e: KeyboardEvent) => void>(() => {});
  useLayoutEffect(() => {
    keys.current = (e) => {
      const el = e.target as HTMLElement | null;
      if (e.ctrlKey || e.metaKey || e.altKey || (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable))) return;
      const k = e.key.toLowerCase();
      if (k === 'i') setBag((b) => !b);
      else if (k === 'h') tryItem('hint');
    };
  });
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const on = (e: KeyboardEvent) => keys.current(e);
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, []);

  return (
    <View className={className} accessibilityLabel={`Cấp ${lv.level}, ${hearts} tim, đang đánh ${enemy.name}`}>
      <View ref={box} style={{ height: 152, borderRadius: 20, overflow: 'hidden', backgroundColor: '#17123A' }}>
        <Backdrop tint={enemy.color} />

        {/* HUD: cấp + XP bên trái; combo, túi đồ, Cú bên phải. */}
        <View style={{ position: 'absolute', left: 12, right: 12, top: 10, flexDirection: 'row', alignItems: 'center', gap: 8, zIndex: 3 }}>
          <View style={{ backgroundColor: GOLD, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 }}>
            <Text className="font-heavy" style={{ fontSize: 12, color: '#3B2503' }}>
              Lv {lv.level}
            </Text>
          </View>
          <View style={{ flex: 1, minWidth: 64, maxWidth: 170 }}>
            <View style={{ height: 8, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.14)', overflow: 'hidden' }}>
              <View
                style={{
                  height: 8,
                  width: '100%',
                  backgroundColor: GOLD,
                  transform: [{ scaleX: Math.max(0.02, lv.into / lv.need) }],
                  transformOrigin: 'left',
                  ...(Platform.OS === 'web' ? ({ transition: 'transform 420ms cubic-bezier(0.2, 0.8, 0.2, 1)' } as object) : null),
                }}
              />
            </View>
            <Text className="font-semi" numberOfLines={1} style={{ marginTop: 2, fontSize: 10, color: 'rgba(255,255,255,0.7)' }}>
              {lv.into}/{lv.need} XP
            </Text>
          </View>
          <View style={{ flex: 1 }} />
          {doubleLeft > 0 ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 3, backgroundColor: 'rgba(250,204,21,0.18)' }}>
              <Text style={{ fontSize: 11 }}>⚡</Text>
              <Text className="font-strong" style={{ fontSize: 11, color: GOLD }}>
                ×2 · {doubleLeft}
              </Text>
            </View>
          ) : null}
          {combo >= 2 ? <Combo combo={combo} compact={narrow} /> : null}
          <HudButton label={narrow ? undefined : 'Túi đồ'} hotkey={narrow ? undefined : 'I'} glyph="🎒" count={itemTotal} active={bag} onPress={() => setBag((b) => !b)} a11y="Mở túi đồ (phím I)" />
          <HudButton
            label={narrow ? undefined : 'Hỏi Cú'}
            hotkey={narrow ? undefined : 'H'}
            owl
            count={items.hint ?? 0}
            dim={!hint || (items.hint ?? 0) <= 0}
            onPress={() => tryItem('hint')}
            a11y="Hỏi Cú: dùng một gợi ý cho câu đang làm (phím H)"
          />
        </View>

        {/* Nhân vật */}
        <View style={{ position: 'absolute', left: narrow ? '8%' : '14%', bottom: 16, alignItems: 'center', zIndex: 2 }}>
          <Hearts hearts={hearts} />
          <View style={{ marginTop: 4 }}>
            <View key={heroKey} style={hit || hurt ? anim(heroAttacks ? 'rg-lunge' : 'rg-hurt', heroAttacks ? 360 : 520) : undefined} {...MOVE}>
              <View style={anim('rg-bob', 1400, { loop: true, timing: 'ease-in-out' })} {...MOVE}>
                <PixelSprite name="hero" size={54} />
              </View>
            </View>
            {shield ? (
              <View pointerEvents="none" style={{ position: 'absolute', left: -8, right: -8, top: -6, bottom: -4, borderRadius: 40, borderWidth: 2, borderColor: 'rgba(34,211,238,0.75)', backgroundColor: 'rgba(34,211,238,0.12)' }} />
            ) : null}
          </View>
          <Shadow />
          {web ? floats.filter((e) => e.kind === 'hit' || e.kind === 'hurt').map((e) => <HeroFloat key={e.id} e={e} />) : null}
        </View>

        {/* Quái */}
        <View style={{ position: 'absolute', right: narrow ? '6%' : '12%', bottom: 16, width: 132, alignItems: 'center', zIndex: 2 }}>
          <Text className="font-strong" numberOfLines={1} style={{ fontSize: 11, color: '#F8FAFC' }}>
            {enemy.name}
            {enemy.round > 0 ? <Text style={{ color: GOLD }}>{`  ★${enemy.round + 1}`}</Text> : null}
          </Text>
          <View style={{ marginTop: 3, width: 104, height: 8, borderRadius: 3, backgroundColor: 'rgba(0,0,0,0.45)', overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' }}>
            <View
              style={{
                height: '100%',
                width: '100%',
                backgroundColor: enemyHp / enemy.hp > 0.5 ? '#22C55E' : enemyHp / enemy.hp > 0.25 ? '#F59E0B' : '#EF4444',
                transform: [{ scaleX: Math.max(0, enemyHp / enemy.hp) }],
                transformOrigin: 'left',
                ...(Platform.OS === 'web' ? ({ transition: 'transform 360ms ease-out, background-color 360ms ease' } as object) : null),
              }}
            />
          </View>
          <View style={{ marginTop: 4 }}>
            <View key={`e${enemyIndex}`} style={anim('rg-enter', 520, { delay: defeat ? 420 : 0 })} {...MOVE}>
              <View key={`h${hit?.id ?? 0}-${hurt?.id ?? 0}`} style={hit && !killing && heroAttacks ? anim('rg-hit', 420, { delay: 110 }) : hurt && !heroAttacks ? anim('rg-enemy-lunge', 380) : undefined} {...MOVE}>
                <View style={anim('rg-bob', 1200, { loop: true, timing: 'ease-in-out', delay: 300 })} {...MOVE}>
                  <PixelSprite name={ENEMY_SPRITE[enemy.id] ?? 'slime'} color={enemy.color} size={58} />
                </View>
              </View>
            </View>
            {defeat && Platform.OS === 'web' ? (
              <View key={`d${defeat.id}`} pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, ...anim('rg-die', 620, { delay: 90, fill: 'forwards' }) }}>
                <PixelSprite name={ENEMY_SPRITE[enemyAt(defeat.enemyIndex).id] ?? 'slime'} color={enemyAt(defeat.enemyIndex).color} size={58} />
              </View>
            ) : null}
            {hit && heroAttacks && Platform.OS === 'web' ? (
              <View key={`s${hit.id}`} pointerEvents="none" style={{ position: 'absolute', left: 4, right: 4, top: 26, height: 4, borderRadius: 2, backgroundColor: '#FFFFFF', ...anim('rg-slash', 300, { delay: 90, fill: 'forwards' }) }} />
            ) : null}
          </View>
          <Shadow />
          {web ? floats.filter((e) => e.kind === 'hit').map((e) => <DamageFloat key={e.id} e={e} />) : null}
          {!narrow ? (
            <View key={`t${enemyIndex}`} pointerEvents="none" style={{ position: 'absolute', right: 116, bottom: 26, width: 176, ...anim('rg-bubble', 3200, { delay: defeat ? 900 : 400, fill: 'forwards' }) }}>
              <View style={{ borderRadius: 10, backgroundColor: '#FFFFFF', paddingHorizontal: 9, paddingVertical: 6 }}>
                <Text className="font-semi" style={{ fontSize: 11, color: '#1B1330' }}>
                  {enemy.taunt}
                </Text>
              </View>
            </View>
          ) : null}
        </View>

        {/* Thông báo giữa cảnh: khiên chặn, bị đánh lui, hạ quái, dùng đồ */}
        {web ? floats.filter((e) => e.kind !== 'hit' && e.kind !== 'hurt').map((e) => <CenterFloat key={e.id} e={e} />) : null}
      </View>

      {bag ? (
        <View style={{ marginTop: 8, borderRadius: 16, backgroundColor: '#1B1540', padding: 10 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {ITEM_ORDER.map((k) => (
              <Pressable
                key={k}
                accessibilityRole="button"
                accessibilityLabel={`Dùng ${ITEMS[k].name}, còn ${items[k] ?? 0}`}
                onPress={() => tryItem(k)}
                style={{ flexBasis: 220, flexGrow: 1, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 9, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.07)', opacity: (items[k] ?? 0) > 0 ? 1 : 0.45 }}
              >
                <Text style={{ fontSize: 22 }}>{ITEMS[k].glyph}</Text>
                <View style={{ flex: 1 }}>
                  <Text className="font-strong" style={{ fontSize: 13, color: '#FFFFFF' }}>
                    {ITEMS[k].name} <Text style={{ color: GOLD }}>×{items[k] ?? 0}</Text>
                  </Text>
                  <Text className="font-sans" style={{ fontSize: 12, color: 'rgba(255,255,255,0.68)' }}>
                    {ITEMS[k].detail}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
          <Pressable accessibilityRole="link" onPress={() => router.push('/shop' as never)} style={{ marginTop: 8, alignSelf: 'flex-end' }}>
            <Text className="font-semi" style={{ fontSize: 12, color: GOLD }}>
              Mua thêm ở Cửa hàng →
            </Text>
          </Pressable>
        </View>
      ) : null}
      {note ? (
        <Text className="font-sans" style={{ marginTop: 6, fontSize: 12, color: '#475569', textAlign: 'center' }}>
          {note}
        </Text>
      ) : null}
    </View>
  );
}

/** Nền cảnh đêm: trời tím, sao nhấp nháy, núi bậc thang, mặt đất — tông ngả theo màu quái. */
function Backdrop({ tint }: { tint: string }) {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }}>
      <View style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, backgroundColor: '#1D1650' }} />
      <View style={{ position: 'absolute', left: 0, right: 0, top: 50, bottom: 0, backgroundColor: '#2B1F66' }} />
      <View style={{ position: 'absolute', left: 0, right: 0, top: 78, bottom: 0, backgroundColor: '#3A2878' }} />
      <Svg width="100%" height="100%" viewBox="0 0 240 68" preserveAspectRatio="xMidYMax slice" {...CRISP} style={{ position: 'absolute', left: 0, top: 0 }}>
        {STARS.map(([x, y], i) => (
          <Rect key={i} x={x} y={y} width={1} height={1} fill="#FFFFFF" opacity={0.35 + (i % 3) * 0.2} />
        ))}
        <Rect x={200} y={6} width={8} height={8} fill="#FDE68A" />
        <Rect x={199} y={7} width={10} height={6} fill="#FDE68A" />
        <Rect x={203} y={8} width={2} height={2} fill="#FBBF24" />
        {HILLS.map(([x, w, h], i) => (
          <Rect key={`h${i}`} x={x} y={60 - h} width={w} height={h} fill="#261B57" />
        ))}
        {HILLS_NEAR.map(([x, w, h], i) => (
          <Rect key={`n${i}`} x={x} y={60 - h} width={w} height={h} fill="#1F1648" />
        ))}
        <Rect x={0} y={58} width={240} height={2} fill={tint} opacity={0.55} />
        <Rect x={0} y={60} width={240} height={8} fill="#140F33" />
        {GRASS.map((x, i) => (
          <Rect key={`g${i}`} x={x} y={57} width={1} height={1} fill={tint} opacity={0.7} />
        ))}
      </Svg>
    </View>
  );
}

const STARS: [number, number][] = [
  [8, 5], [22, 12], [37, 4], [51, 16], [66, 8], [79, 3], [93, 14], [108, 6], [121, 11], [134, 3], [149, 15], [163, 7], [177, 12], [188, 4], [219, 15], [231, 6], [14, 22], [58, 25], [101, 21], [141, 24], [183, 20], [226, 26],
];
const HILLS: [number, number, number][] = [
  [0, 18, 10], [18, 10, 16], [28, 14, 22], [42, 12, 14], [54, 20, 9], [74, 10, 18], [84, 16, 26], [100, 12, 17], [112, 22, 11], [134, 12, 20], [146, 10, 28], [156, 14, 19], [170, 18, 12], [188, 12, 21], [200, 16, 15], [216, 24, 23],
];
const HILLS_NEAR: [number, number, number][] = [
  [0, 26, 5], [26, 18, 8], [44, 30, 4], [74, 20, 7], [94, 28, 3], [122, 16, 9], [138, 30, 5], [168, 22, 8], [190, 26, 4], [216, 24, 7],
];
const GRASS = [3, 11, 19, 30, 41, 47, 58, 69, 77, 88, 97, 109, 118, 127, 139, 151, 160, 171, 182, 193, 204, 213, 225, 236];

function Shadow() {
  return <View style={{ marginTop: -3, width: 46, height: 7, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.35)' }} />;
}

const HEART = ['.rr.rr.', 'rrrrrrr', 'rrrrrrr', '.rrrrr.', '..rrr..', '...r...'];

function Hearts({ hearts }: { hearts: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }} accessibilityLabel={`${hearts} trên ${MAX_HEARTS} tim`}>
      {Array.from({ length: MAX_HEARTS }, (_, i) => (
        <Svg key={i} width={11} height={10} viewBox="0 0 7 6" {...CRISP}>
          {HEART.flatMap((row, y) =>
            [...row].map((ch, x) => (ch === 'r' ? <Rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={i < hearts ? '#F43F5E' : 'rgba(255,255,255,0.18)'} /> : null)),
          )}
        </Svg>
      ))}
    </View>
  );
}

function Combo({ combo, compact }: { combo: number; compact: boolean }) {
  // Chấm tiến tới đòn chí mạng; đúng lúc vừa chí mạng thì đầy cả hàng.
  const pips = combo % CRIT_EVERY === 0 ? CRIT_EVERY : combo % CRIT_EVERY;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3, backgroundColor: 'rgba(249,115,22,0.2)' }}>
      <View style={anim('rg-flame', 700, { loop: true, timing: 'ease-in-out' })} {...MOVE}>
        <Text style={{ fontSize: 12 }}>🔥</Text>
      </View>
      <Text className="font-heavy" style={{ fontSize: 12, color: '#FDBA74' }}>
        ×{combo}
      </Text>
      {compact ? null : (
        <View style={{ flexDirection: 'row', gap: 2 }} accessibilityLabel={`Còn ${CRIT_EVERY - (combo % CRIT_EVERY)} câu đúng nữa là chí mạng`}>
          {Array.from({ length: CRIT_EVERY }, (_, i) => (
            <View key={i} style={{ width: 4, height: 4, backgroundColor: i < pips ? '#FDBA74' : 'rgba(255,255,255,0.2)' }} />
          ))}
        </View>
      )}
    </View>
  );
}

function HudButton({ label, hotkey, glyph, owl, count, onPress, active, dim, a11y }: { label?: string; hotkey?: string; glyph?: string; owl?: boolean; count: number; onPress: () => void; active?: boolean; dim?: boolean; a11y: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11y}
      onPress={onPress}
      style={({ hovered }: { hovered?: boolean }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        borderRadius: 10,
        paddingHorizontal: 7,
        height: 28,
        backgroundColor: active ? 'rgba(250,204,21,0.25)' : hovered ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.1)',
        opacity: dim ? 0.55 : 1,
      })}
    >
      {owl ? <PixelSprite name="owl" size={18} color="#A16207" /> : <Text style={{ fontSize: 14 }}>{glyph}</Text>}
      {label ? (
        <Text className="font-semi" style={{ fontSize: 12, color: '#FFFFFF' }}>
          {label}
        </Text>
      ) : null}
      <Text className="font-heavy" style={{ fontSize: 11, color: GOLD }}>
        {count}
      </Text>
      {hotkey ? (
        <View style={{ borderRadius: 4, paddingHorizontal: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' }}>
          <Text className="font-strong" style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)' }}>
            {hotkey}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const NUMBER_SHADOW = { textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 0 };

/** Số sát thương bay lên trên đầu quái; chí mạng thì to và vàng. */
function DamageFloat({ e }: { e: Extract<FxEvent, { kind: 'hit' }> }) {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: -20, right: -20, top: 26, alignItems: 'center', ...anim('rg-float', e.crit ? 1100 : 900, { delay: 120 }) }}>
      {e.crit ? (
        <Text className="font-heavy" style={{ fontSize: 11, color: GOLD, letterSpacing: 1 }}>
          CHÍ MẠNG!
        </Text>
      ) : null}
      <Text className="font-heavy" style={{ fontSize: e.crit ? 26 : 20, color: e.crit ? GOLD : '#FFFFFF', ...NUMBER_SHADOW }}>
        −{e.damage}
      </Text>
    </View>
  );
}

/** XP bay lên trên đầu nhân vật khi đúng; "−1 ♥" khi trúng đòn. */
function HeroFloat({ e }: { e: FxEvent }) {
  if (e.kind !== 'hit' && e.kind !== 'hurt') return null;
  const hit = e.kind === 'hit';
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: -30, right: -30, top: -6, alignItems: 'center', ...anim('rg-float', 1000, { delay: hit ? 60 : 140 }) }}>
      <Text className="font-heavy" style={{ fontSize: hit ? 15 : 16, color: hit ? GOLD : '#FB7185', ...NUMBER_SHADOW }}>
        {hit ? `+${e.xp} XP` : '−1 ♥'}
      </Text>
    </View>
  );
}

/** Thông báo giữa cảnh. */
function CenterFloat({ e }: { e: FxEvent }) {
  const text =
    e.kind === 'blocked'
      ? { t: '🛡️ Khiên chặn đòn — combo vẫn giữ', c: '#67E8F9', ms: 1400 }
      : e.kind === 'knockout'
        ? { t: 'Bị đánh lui! Tim hồi đầy, quái hồi máu', c: '#FDA4AF', ms: 1800 }
        : e.kind === 'defeat'
          ? { t: `Hạ ${e.name}! +${e.bonusXp} XP${e.loot ? ` · rơi ${ITEMS[e.loot].glyph} ${ITEMS[e.loot].name}` : ''}`, c: GOLD, ms: 2000 }
          : e.kind === 'item'
            ? { t: `${ITEMS[e.item].glyph} Dùng ${e.title}`, c: '#FFFFFF', ms: 1300 }
            : e.kind === 'batch' && e.xp > 0
              ? { t: `+${e.xp} XP`, c: GOLD, ms: 1300 }
              : null;
  if (!text) return null;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 8, right: 8, top: 66, zIndex: 4, alignItems: 'center', ...anim('rg-float', text.ms) }}>
      <View style={{ borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: 'rgba(15,10,40,0.82)' }}>
        <Text className="font-heavy" style={{ fontSize: 13, color: text.c }} numberOfLines={2}>
          {text.t}
        </Text>
      </View>
    </View>
  );
}
