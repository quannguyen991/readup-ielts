import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import Svg, { Rect } from 'react-native-svg';

import { anim, ensureGameKeyframes, MOVE } from './game-anim';
import { ItemIcon } from './ItemIcon';
import { PixelSprite } from './PixelSprite';
import { HeroSprite } from './HeroSprite';
import { ENEMY_SPRITE } from './sprites';
import { sfx } from '@/services/audio/sfx';
import { useTravelActive } from '@/components/rail/TravelBackdrop';
import { MASCOTS } from '@/services/game/mascots';
import { formatStars } from '@/services/gamification/shop';
import { dateKey } from '@/services/gamification/points';
import { mascotOf, skinOf, useRewardStore } from '@/store/useRewardStore';
import { useStarBalance } from '@/store/useStarBalance';
import { CRIT_EVERY, enemyAt, FEVER_AT, ITEMS, levelProgress, MAX_HEARTS, type ItemKind } from '@/services/game/rules';
import { staleBefore, useGameFx, type FxEvent } from '@/store/useGameFx';
import { useGameStore } from '@/store/useGameStore';
import { useL } from '@/i18n/useL';
import { enemyName } from '@/components/world/island-label';
import { enemyNameByVi, enemyTaunt, itemKindDetail, itemKindName } from './game-labels';

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
/** Bề ngang cột nhân vật (hàng tim 5 × 11 + khe) và khung quái — để đặt tia nạp đòn giữa hai bên. */
const HERO_BOX = 63;
const ENEMY_BOX = 132;
const ENEMY_SPRITE_SIZE = 58;
/** Boss to hơn một cỡ — và đứng thấp hơn (gần người xem) để tên không lấn lên hàng nút. */
const BOSS_SPRITE_SIZE = 68;

type Kind = FxEvent['kind'];

function lastOf<K extends Kind>(events: FxEvent[], since: number, kinds: K[]): Extract<FxEvent, { kind: K }> | undefined {
  for (let i = events.length - 1; i >= 0; i -= 1) {
    const e = events[i]!;
    if (e.id <= since) return undefined;
    if ((kinds as Kind[]).includes(e.kind)) return e as Extract<FxEvent, { kind: K }>;
  }
  return undefined;
}

export type StripStep = { index: number; total: number };
export type StripCharge = { value: number; total: number; unit: string };

/**
 * TẠM ẨN thanh trận đấu ở mọi màn học (người dùng yêu cầu 30/09/2026: "bỏ tạm
 * cái này đi"). Việc chấm câu và cộng XP vẫn chạy như cũ, chỉ không vẽ thanh.
 * Bật lại: đổi thành `true`.
 */
export const BATTLE_STRIP_ENABLED = false;

export function BattleStrip(props: { className?: string; step?: StripStep; charge?: StripCharge }) {
  if (BATTLE_STRIP_ENABLED) return <BattleStripInner {...props} />;
  // Màn nào dùng thanh để báo "câu thứ mấy" thì vẫn giữ một thanh tiến độ gọn.
  return props.step ? <StepBar className={props.className} step={props.step} charge={props.charge} /> : null;
}

function StepBar({ className, step, charge }: { className?: string; step: StripStep; charge?: StripCharge }) {
  const pct = step.total > 0 ? Math.min(1, (step.index + 1) / step.total) : 0;
  const { L } = useL();
  return (
    <View className={className} accessibilityRole="progressbar" aria-valuenow={step.index + 1} aria-valuemax={step.total} style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text className="font-strong" style={{ fontSize: 14, color: '#334155' }}>
          {L('Câu', 'Question')} {Math.min(step.index + 1, step.total)}/{step.total}
        </Text>
        {charge ? (
          <Text className="font-semi" style={{ fontSize: 14, color: '#64748B' }}>
            {charge.value}/{charge.total} {charge.unit}
          </Text>
        ) : null}
      </View>
      <View style={{ height: 8, borderRadius: 999, backgroundColor: '#F0EBE2', overflow: 'hidden' }}>
        <View style={{ width: `${pct * 100}%`, height: '100%', borderRadius: 999, backgroundColor: '#6A4BD9', transition: 'width 300ms ease' } as object} />
      </View>
    </View>
  );
}

function BattleStripInner({ className, step, charge }: { className?: string; step?: StripStep; charge?: StripCharge }) {
  const enabled = useGameStore((s) => s.enabled);
  // Màn đang có nền toa tàu: không có trận đấu (người dùng yêu cầu 30/09) — câu trả lời vẫn tính XP / sao.
  const travel = useTravelActive();
  if (!enabled || travel) return null;
  return <Strip className={className} step={step} charge={charge} />;
}

/**
 * `step` — bài nhiều câu (chép chính tả, dịch câu): mặt đất thành CON ĐƯỜNG TỚI
 * ĐÍCH, mỗi câu một chặng, cờ ở cuối. Thay cho thanh "đường chạy" cũ.
 *
 * `charge` — câu dài gõ từng chữ: thanh "chạy tới đích" của câu thành TIA NẠP ĐÒN
 * vươn từ nhân vật sang quái; đủ câu là tia chạm quái và nhát chém bổ xuống.
 */
function Strip({ className, step, charge }: { className?: string; step?: StripStep; charge?: StripCharge }) {
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
  // Hẹp theo BỀ RỘNG THẬT của thanh, không theo cửa sổ: thanh còn nằm trong cột
  // hẹp của màn chép chính tả / dịch câu trên máy tính.
  const windowWidth = useWindowDimensions().width;
  const [width, setWidth] = useState(0);
  const narrow = (width || windowWidth) < 520;
  const heroLeft = (width || windowWidth) * (narrow ? 0.08 : 0.14);
  const enemyRight = (width || windowWidth) * (narrow ? 0.06 : 0.12);
  const web = Platform.OS === 'web';

  const xp = useGameStore((s) => s.xp);
  const combo = useGameStore((s) => s.combo);
  const hearts = useGameStore((s) => s.hearts);
  const enemyIndex = useGameStore((s) => s.enemyIndex);
  const enemyHp = useGameStore((s) => s.enemyHp);
  const shield = useGameStore((s) => s.shield);
  const doubleLeft = useGameStore((s) => s.doubleLeft);
  const items = useGameStore((s) => s.items);
  const perkDay = useGameStore((s) => s.perkDay);
  const perkHints = useGameStore((s) => s.perkHints ?? 0);
  const skin = skinOf(useRewardStore((s) => s.skin));
  const petId = mascotOf(useRewardStore((s) => s.mascot));
  const pet = petId ? MASCOTS[petId] : null;
  const stars = useStarBalance();
  const sound = useGameStore((s) => s.sound);
  const hint = useGameFx((s) => s.hint);
  const events = useGameFx((s) => s.events);
  const { L, locale } = useL();

  const enemy = enemyAt(enemyIndex);
  const eName = enemyName(enemy, locale);
  const lv = levelProgress(xp);
  const hit = lastOf(events, since, ['hit']);
  const hurt = lastOf(events, since, ['hurt', 'blocked', 'knockout']);
  const defeat = lastOf(events, since, ['defeat']);
  const floats = events.filter((e) => e.id > since && e.kind !== 'levelup' && e.kind !== 'achievement' && e.kind !== 'quest').slice(-6);
  const starPops = events.filter((e): e is Extract<FxEvent, { kind: 'stars' }> => e.id > since && e.kind === 'stars').slice(-3);
  const petTalk = [...events].reverse().find((e): e is Extract<FxEvent, { kind: 'mascot' }> => e.id > since && e.kind === 'mascot');
  // Lượt Hỏi Cú miễn phí còn lại hôm nay (Cú Thông Thái), cộng với gợi ý trong túi.
  const todayKey = useMemo(() => dateKey(new Date()), []);
  const freeHintsLeft = pet ? Math.max(0, pet.perks.freeHints - (perkDay === todayKey ? perkHints : 0)) : 0;
  const hintCount = (items.hint ?? 0) + freeHintsLeft;
  // Đòn kết liễu thì quái MỚI không rung theo — nó vừa bước vào.
  const killing = Boolean(hit && defeat && defeat.id > hit.id);
  const heroAttacks = hit && (!hurt || hit.id > hurt.id);
  const heroKey = `${hit?.id ?? 0}-${hurt?.id ?? 0}`;
  const itemTotal = ITEM_ORDER.reduce((n, k) => n + (items[k] ?? 0), 0);
  const fever = combo >= FEVER_AT;
  const lowHp = hearts === 1;
  // Nét mặt đổi trong chốc lát theo nhịp đánh (trúng đòn → hô to; mất tim → nhăn), còn 1 tim thì mệt.
  const [flash, setFlash] = useState<'attack' | 'hurt' | null>(null);
  const [flashKey, setFlashKey] = useState('0-0');
  if (flashKey !== heroKey) {
    setFlashKey(heroKey);
    setFlash(heroAttacks ? 'attack' : 'hurt');
  }
  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 850);
    return () => clearTimeout(t);
  }, [flash, flashKey]);
  const heroMood = flash ?? (lowHp ? 'tired' : 'idle');
  const enemySize = enemy.boss ? BOSS_SPRITE_SIZE : ENEMY_SPRITE_SIZE;
  // Chí mạng rung cả khung. Đổi tên hoạt cảnh (a/b) là cách cho nó chạy lại mà không phải dựng lại cả cảnh.
  const shake = hit?.crit && heroAttacks ? (hit.id % 2 ? 'rg-shake-a' : 'rg-shake-b') : null;

  // Bài gõ cả câu: mỗi từ vừa đúng thêm một tiếng tích, cao dần theo tia nạp đòn.
  const chargeValue = charge?.value ?? 0;
  const lastCharge = useRef(chargeValue);
  useEffect(() => {
    if (chargeValue > lastCharge.current && charge && chargeValue < charge.total) sfx.tick(chargeValue);
    lastCharge.current = chargeValue;
  }, [chargeValue, charge]);

  const tryItem = (k: ItemKind) => {
    if ((items[k] ?? 0) <= 0)
      return setNote(
        L(
          `Hết ${ITEMS[k].name}. Hạ quái hoặc làm nhiệm vụ ngày để kiếm thêm.`,
          `Out of ${itemKindName(k, ITEMS[k].name, 'en')}. Defeat monsters or finish daily quests to get more.`,
        ),
      );
    if (k === 'potion' && hearts >= MAX_HEARTS) return setNote(L('Tim đang đầy, để dành bình máu cho lúc cần.', 'Hearts are full — save the potion for when you need it.'));
    if (k === 'shield' && shield) return setNote(L('Khiên đang bật rồi.', 'Your shield is already up.'));
    if (k === 'hint' && !hint) return setNote(L('Cú chỉ gợi ý được khi đang mở một câu trắc nghiệm hoặc câu gõ từ chưa trả lời.', 'The owl can only help on an open multiple-choice or typing question you have not answered yet.'));
    const ok = useGameStore.getState().spendItem(k);
    setNote(ok ? null : L('Câu này không dùng gợi ý được nữa.', "You can't use a hint on this question any more."));
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
      else if (k === 'm') useGameStore.getState().setSound(!useGameStore.getState().sound);
    };
  });
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const on = (e: KeyboardEvent) => keys.current(e);
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, []);

  return (
    <View className={className} accessibilityLabel={L(`Cấp ${lv.level}, ${hearts} tim, đang đánh ${enemy.name}`, `Level ${lv.level}, ${hearts} hearts, fighting ${eName}`)}>
      <View
        ref={box}
        onLayout={(e) => setWidth(Math.round(e.nativeEvent.layout.width))}
        style={{ height: 152, borderRadius: 20, overflow: 'hidden', backgroundColor: '#FFFDF7', ...(shake ? anim(shake, 420) : null) }}
        {...MOVE}
      >
        <Backdrop tint={enemy.color} />
        {/* Bùng cháy: cả cảnh ửng cam, nhịp theo lửa. */}
        {fever ? (
          <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, backgroundColor: 'rgba(249,115,22,0.16)', ...anim('rg-twinkle', 1100, { loop: true, timing: 'ease-in-out' }) }} />
        ) : null}
        {/* Boss: nền đỏ sậm dần phía quái. */}
        {enemy.boss ? (
          <View pointerEvents="none" style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '55%', backgroundColor: 'rgba(220,38,38,0.12)' }} />
        ) : null}

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
                {narrow ? doubleLeft : `×2 · ${doubleLeft}`}
              </Text>
            </View>
          ) : null}
          {combo >= 2 ? <Combo combo={combo} compact={narrow} fever={fever} /> : null}
          <HudButton label={narrow ? undefined : L('Túi đồ', 'Bag')} hotkey={narrow ? undefined : 'I'} glyph="🎒" count={itemTotal} active={bag} onPress={() => setBag((b) => !b)} a11y={L('Mở túi đồ (phím I)', 'Open bag (I key)')} />
          <HudButton
            label={narrow ? undefined : L('Hỏi Cú', 'Ask Owl')}
            hotkey={narrow ? undefined : 'H'}
            owl
            count={hintCount}
            dim={!hint || hintCount <= 0}
            onPress={() => tryItem('hint')}
            a11y={L('Hỏi Cú: dùng một gợi ý cho câu đang làm (phím H)', 'Ask Owl: use a hint on this question (H key)')}
          />
          {!narrow ? (
            <Pressable
              accessibilityRole="switch"
              aria-checked={sound}
              accessibilityLabel={sound ? L('Tắt âm thanh hiệu ứng (phím M)', 'Turn sound effects off (M key)') : L('Bật âm thanh hiệu ứng (phím M)', 'Turn sound effects on (M key)')}
              onPress={() => useGameStore.getState().setSound(!sound)}
              style={({ hovered }: { hovered?: boolean }) => ({ width: 28, height: 28, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: hovered ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.1)' })}
            >
              <Text style={{ fontSize: 13, opacity: sound ? 1 : 0.6 }}>{sound ? '🔊' : '🔇'}</Text>
            </Pressable>
          ) : null}
        </View>

        {/* Nhân vật */}
        <View style={{ position: 'absolute', left: heroLeft, bottom: 16, alignItems: 'center', zIndex: 2 }}>
          <Hearts hearts={hearts} />
          <View style={{ marginTop: 4 }}>
            {fever ? (
              <View
                pointerEvents="none"
                style={{ position: 'absolute', left: -6, right: -6, top: -4, bottom: -2, borderRadius: 40, backgroundColor: 'rgba(249,115,22,0.35)', boxShadow: '0 0 22px 8px rgba(249,115,22,0.55)', ...anim('rg-aura', 700, { loop: true, timing: 'ease-in-out' }) } as object}
                {...MOVE}
              />
            ) : null}
            <View key={heroKey} style={hit || hurt ? anim(heroAttacks ? 'rg-lunge' : 'rg-hurt', heroAttacks ? 360 : 520) : undefined} {...MOVE}>
              <View style={anim('rg-bob', 1400, { loop: true, timing: 'ease-in-out' })} {...MOVE}>
                <HeroSprite size={54} skin={skin} mood={heroMood} />
              </View>
            </View>
            {shield ? (
              <View pointerEvents="none" style={{ position: 'absolute', left: -8, right: -8, top: -6, bottom: -4, borderRadius: 40, borderWidth: 2, borderColor: 'rgba(34,211,238,0.75)', backgroundColor: 'rgba(34,211,238,0.12)' }} />
            ) : null}
          </View>
          <Shadow />
          {web ? floats.filter((e) => e.kind === 'hit' || e.kind === 'hurt').map((e) => <HeroFloat key={e.id} e={e} />) : null}
        </View>

        {/* Linh vật đứng sau lưng nhân vật; nói một câu mỗi khi giúp. */}
        {pet ? (
          <View style={{ position: 'absolute', left: Math.max(4, heroLeft - 34), bottom: 22, alignItems: 'center', zIndex: 2 }}>
            <View style={anim('rg-bob', 1100, { loop: true, timing: 'ease-in-out', delay: 250 })} {...MOVE}>
              <PixelSprite name={pet.look} color={pet.color} size={30} />
            </View>
            {petTalk && web ? (
              <View key={`talk-${petTalk.id}`} pointerEvents="none" style={{ position: 'absolute', left: -4, bottom: 34, width: narrow ? 150 : 190, zIndex: 5, ...anim('rg-bubble', 2600, { fill: 'forwards' }) }}>
                <View style={{ borderRadius: 10, backgroundColor: '#FFFFFF', paddingHorizontal: 8, paddingVertical: 5 }}>
                  <Text className="font-semi" style={{ fontSize: 11, color: '#1B1330' }}>
                    {petTalk.heal ? '💚 ' : ''}
                    {petTalk.line}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Sao đang có: mỗi lần được thêm sao, ô nảy lên và "+N ⭐" bay ra. */}
        <View style={{ position: 'absolute', left: 12, top: 42, zIndex: 3 }} accessibilityLabel={L(`${stars} sao`, `${stars} stars`)}>
          <View key={`star-${stars}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2, backgroundColor: 'rgba(250,204,21,0.16)', ...(starPops.length ? anim('rg-pop', 320) : null) }}>
            <Text style={{ fontSize: 11 }}>⭐</Text>
            <Text className="font-heavy" style={{ fontSize: 11, color: GOLD }}>
              {formatStars(stars)}
            </Text>
          </View>
          {web
            ? starPops.map((e) => (
                <View key={`sp-${e.id}`} pointerEvents="none" style={{ position: 'absolute', left: 56, top: -2, ...anim('rg-float', 1300) }}>
                  <Text className="font-heavy" numberOfLines={1} style={{ fontSize: 12, color: GOLD, textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 0 }}>
                    +{e.amount} ⭐
                  </Text>
                </View>
              ))
            : null}
        </View>

        {/* Quái */}
        <View style={{ position: 'absolute', right: enemyRight, bottom: enemy.boss ? 8 : 16, width: ENEMY_BOX, alignItems: 'center', zIndex: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, maxWidth: ENEMY_BOX }}>
            {enemy.boss ? (
              <View style={{ borderRadius: 4, paddingHorizontal: 4, backgroundColor: '#DC2626' }}>
                <Text className="font-heavy" style={{ fontSize: 9, letterSpacing: 1, color: '#2A1808' }}>
                  BOSS
                </Text>
              </View>
            ) : null}
            <Text className="font-strong" numberOfLines={1} style={{ flexShrink: 1, fontSize: 11, color: '#FCFBF8' }}>
              {eName}
              {enemy.round > 0 ? <Text style={{ color: GOLD }}>{`  ★${enemy.round + 1}`}</Text> : null}
            </Text>
          </View>
          <View style={{ marginTop: 3, width: 104, height: 8, borderRadius: 3, backgroundColor: 'rgba(0,0,0,0.45)', overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' }}>
            <View
              style={{
                height: '100%',
                width: '100%',
                backgroundColor: enemy.boss ? '#F43F5E' : enemyHp / enemy.hp > 0.5 ? '#22C55E' : enemyHp / enemy.hp > 0.25 ? '#F59E0B' : '#EF4444',
                transform: [{ scaleX: Math.max(0, enemyHp / enemy.hp) }],
                transformOrigin: 'left',
                ...(Platform.OS === 'web' ? ({ transition: 'transform 360ms ease-out, background-color 360ms ease' } as object) : null),
              }}
            />
          </View>
          <View style={{ marginTop: 4 }}>
            {enemy.boss ? (
              <View
                pointerEvents="none"
                style={{ position: 'absolute', left: 6, right: 6, top: 6, bottom: 0, borderRadius: 40, backgroundColor: 'rgba(239,68,68,0.28)', boxShadow: '0 0 26px 10px rgba(239,68,68,0.45)', ...anim('rg-aura', 1300, { loop: true, timing: 'ease-in-out' }) } as object}
                {...MOVE}
              />
            ) : null}
            <View key={`e${enemyIndex}`} style={anim('rg-enter', 520, { delay: defeat ? 420 : 0 })} {...MOVE}>
              <View key={`h${hit?.id ?? 0}-${hurt?.id ?? 0}`} style={hit && !killing && heroAttacks ? anim('rg-hit', 420, { delay: 110 }) : hurt && !heroAttacks ? anim('rg-enemy-lunge', 380) : undefined} {...MOVE}>
                <View style={anim('rg-bob', 1200, { loop: true, timing: 'ease-in-out', delay: 300 })} {...MOVE}>
                  <PixelSprite name={ENEMY_SPRITE[enemy.id] ?? 'slime'} color={enemy.color} size={enemySize} />
                </View>
              </View>
            </View>
            {defeat && Platform.OS === 'web' ? (
              <View key={`d${defeat.id}`} pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, ...anim('rg-die', 620, { delay: 90, fill: 'forwards' }) }}>
                <PixelSprite name={ENEMY_SPRITE[enemyAt(defeat.enemyIndex).id] ?? 'slime'} color={enemyAt(defeat.enemyIndex).color} size={defeat.boss ? BOSS_SPRITE_SIZE : ENEMY_SPRITE_SIZE} />
              </View>
            ) : null}
            {hit && heroAttacks && Platform.OS === 'web' ? (
              <View key={`s${hit.id}`} pointerEvents="none" style={{ position: 'absolute', left: 4, right: 4, top: 26, height: 4, borderRadius: 2, backgroundColor: '#FFFFFF', ...anim('rg-slash', 300, { delay: 90, fill: 'forwards' }) }} />
            ) : null}
          </View>
          <Shadow />
          {web ? floats.filter((e) => e.kind === 'hit').map((e) => <DamageFloat key={e.id} e={e} />) : null}
          {!narrow && !charge && !enemy.boss ? (
            <View key={`t${enemyIndex}`} pointerEvents="none" style={{ position: 'absolute', right: 116, bottom: 26, width: 176, ...anim('rg-bubble', 3200, { delay: defeat ? 900 : 400, fill: 'forwards' }) }}>
              <View style={{ borderRadius: 10, backgroundColor: '#FFFFFF', paddingHorizontal: 9, paddingVertical: 6 }}>
                <Text className="font-semi" style={{ fontSize: 11, color: '#1B1330' }}>
                  {enemyTaunt(enemy, locale)}
                </Text>
              </View>
            </View>
          ) : null}
        </View>

        {charge && charge.total > 0 ? <ChargeBeam charge={charge} left={heroLeft + HERO_BOX + 6} right={enemyRight + (ENEMY_BOX + enemySize) / 2 + 6} /> : null}
        {step && step.total > 0 ? <Road step={step} /> : null}

        {/* Boss vừa bước ra: một dòng cảnh báo giữa cảnh. */}
        {enemy.boss && web ? (
          <View key={`boss-${enemyIndex}`} pointerEvents="none" style={{ position: 'absolute', left: 8, right: 8, top: 44, zIndex: 4, alignItems: 'center', ...anim('rg-bubble', 2800, { delay: defeat ? 700 : 150, fill: 'forwards' }) }}>
            <View style={{ borderRadius: 10, paddingHorizontal: 12, paddingVertical: 5, backgroundColor: 'rgba(127,29,29,0.9)', borderWidth: 1, borderColor: '#F87171' }}>
              <Text className="font-heavy" style={{ fontSize: 13, color: '#FEE2E2' }}>
                {L(`⚠ BOSS: ${enemy.name} — hạ được rơi 2 món`, `⚠ BOSS: ${eName} — drops 2 items when defeated`)}
              </Text>
            </View>
          </View>
        ) : null}

        {/* Còn một tim: viền đỏ đập theo nhịp tim. */}
        {lowHp ? (
          <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, borderRadius: 20, boxShadow: 'inset 0 0 26px 4px rgba(244,63,94,0.6)', ...anim('rg-twinkle', 900, { loop: true, timing: 'ease-in-out' }) } as object} />
        ) : null}

        {/* Thông báo giữa cảnh: khiên chặn, bị đánh lui, hạ quái, dùng đồ */}
        {web ? floats.filter((e) => e.kind !== 'hit' && e.kind !== 'hurt').map((e) => <CenterFloat key={e.id} e={e} />) : null}
      </View>

      {bag ? (
        <View style={{ marginTop: 8, borderRadius: 16, backgroundColor: '#FFFDF7', padding: 10 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {ITEM_ORDER.map((k) => (
              <Pressable
                key={k}
                accessibilityRole="button"
                accessibilityLabel={L(`Dùng ${ITEMS[k].name}, còn ${items[k] ?? 0}`, `Use ${itemKindName(k, ITEMS[k].name, 'en')}, ${items[k] ?? 0} left`)}
                onPress={() => tryItem(k)}
                style={{ flexShrink: 1, flexBasis: 220, flexGrow: 1, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 9, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.07)', opacity: (items[k] ?? 0) > 0 ? 1 : 0.45 }}
              >
                <ItemIcon kind={k} size={34} />
                <View style={{ flex: 1 }}>
                  <Text className="font-strong" style={{ fontSize: 13, color: '#2A1808' }}>
                    {itemKindName(k, ITEMS[k].name, locale)} <Text style={{ color: GOLD }}>×{items[k] ?? 0}</Text>
                  </Text>
                  <Text className="font-sans" style={{ fontSize: 12, color: 'rgba(255,255,255,0.68)' }}>
                    {itemKindDetail(k, ITEMS[k].detail, locale)}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
          <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <Pressable
              accessibilityRole="switch"
              aria-checked={sound}
              onPress={() => useGameStore.getState().setSound(!sound)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: 'rgba(255,255,255,0.07)' }}
            >
              <Text style={{ fontSize: 13 }}>{sound ? '🔊' : '🔇'}</Text>
              <Text className="font-semi" style={{ fontSize: 12, color: '#2A1808' }}>
                {sound ? L('Âm thanh: bật', 'Sound: on') : L('Âm thanh: tắt', 'Sound: off')}
              </Text>
            </Pressable>
            <Pressable accessibilityRole="link" onPress={() => router.push('/shop' as never)}>
              <Text className="font-semi" style={{ fontSize: 12, color: GOLD }}>
                {L('Mua thêm ở Cửa hàng →', 'Get more in the Shop →')}
              </Text>
            </Pressable>
          </View>
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
      <View style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, backgroundColor: '#FFFDF7' }} />
      <View style={{ position: 'absolute', left: 0, right: 0, top: 50, bottom: 0, backgroundColor: '#614B24' }} />
      <View style={{ position: 'absolute', left: 0, right: 0, top: 78, bottom: 0, backgroundColor: '#72592E' }} />
      <Svg width="100%" height="100%" viewBox="0 0 240 68" preserveAspectRatio="xMidYMax slice" {...CRISP} style={{ position: 'absolute', left: 0, top: 0 }}>
        {STARS.map(([x, y], i) => (
          <Rect key={i} x={x} y={y} width={1} height={1} fill="#FFFFFF" opacity={0.35 + (i % 3) * 0.2} />
        ))}
        <Rect x={200} y={6} width={8} height={8} fill="#FDE68A" />
        <Rect x={199} y={7} width={10} height={6} fill="#FDE68A" />
        <Rect x={203} y={8} width={2} height={2} fill="#FBBF24" />
        {HILLS.map(([x, w, h], i) => (
          <Rect key={`h${i}`} x={x} y={60 - h} width={w} height={h} fill="#524020" />
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
  const { L } = useL();
  return (
    <View style={{ flexDirection: 'row', gap: 2 }} accessibilityLabel={L(`${hearts} trên ${MAX_HEARTS} tim`, `${hearts} of ${MAX_HEARTS} hearts`)}>
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

function Combo({ combo, compact, fever }: { combo: number; compact: boolean; fever: boolean }) {
  // Chấm tiến tới đòn chí mạng; đúng lúc vừa chí mạng thì đầy cả hàng.
  const pips = combo % CRIT_EVERY === 0 ? CRIT_EVERY : combo % CRIT_EVERY;
  const { L } = useL();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3, backgroundColor: fever ? '#EA580C' : 'rgba(249,115,22,0.2)' }}>
      <View style={anim('rg-flame', fever ? 420 : 700, { loop: true, timing: 'ease-in-out' })} {...MOVE}>
        <Text style={{ fontSize: 12 }}>🔥</Text>
      </View>
      {fever && !compact ? (
        <Text className="font-heavy" style={{ fontSize: 11, letterSpacing: 0.5, color: '#FFF7ED' }}>
          {L('BÙNG CHÁY', 'ON FIRE')}
        </Text>
      ) : null}
      <Text className="font-heavy" style={{ fontSize: 12, color: fever ? '#FFFFFF' : '#FDBA74' }}>
        ×{combo}
      </Text>
      {compact ? null : (
        <View style={{ flexDirection: 'row', gap: 2 }} accessibilityLabel={L(`Còn ${CRIT_EVERY - (combo % CRIT_EVERY)} câu đúng nữa là chí mạng`, `${CRIT_EVERY - (combo % CRIT_EVERY)} more correct for a critical hit`)}>
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
        <Text className="font-semi" style={{ fontSize: 12, color: '#2A1808' }}>
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
  const { L } = useL();
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: -20, right: -20, top: 26, alignItems: 'center', ...anim('rg-float', e.crit ? 1100 : 900, { delay: 120 }) }}>
      {e.crit ? (
        <Text className="font-heavy" style={{ fontSize: 11, color: GOLD, letterSpacing: 1 }}>
          {L('CHÍ MẠNG!', 'CRITICAL!')}
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
  const { L, locale } = useL();
  const text =
    e.kind === 'blocked'
      ? { t: L('🛡️ Khiên chặn đòn — combo vẫn giữ', '🛡️ Shield blocked it — combo kept'), c: '#67E8F9', ms: 1400 }
      : e.kind === 'knockout'
        ? { t: L('Bị đánh lui! Tim hồi đầy, quái hồi máu', 'Knocked back! Hearts refilled, monster healed'), c: '#FDA4AF', ms: 1800 }
        : e.kind === 'defeat'
          ? {
              t: L(
                `${e.boss ? '🏆 Hạ BOSS ' : 'Hạ '}${e.name}! +${e.bonusXp} XP${e.loot.length > 0 ? ` · rơi ${e.loot.map((k) => `${ITEMS[k].glyph} ${ITEMS[k].name}`).join(', ')}` : ''}`,
                `${e.boss ? '🏆 Defeated BOSS ' : 'Defeated '}${enemyNameByVi(e.name, locale)}! +${e.bonusXp} XP${e.loot.length > 0 ? ` · dropped ${e.loot.map((k) => `${ITEMS[k].glyph} ${itemKindName(k, ITEMS[k].name, 'en')}`).join(', ')}` : ''}`,
              ),
              c: GOLD,
              ms: e.boss ? 2600 : 2000,
            }
          : e.kind === 'item'
            ? { t: L(`${ITEMS[e.item].glyph} Dùng ${e.title}`, `${ITEMS[e.item].glyph} Used ${itemKindName(e.item, e.title, 'en')}`), c: '#FFFFFF', ms: 1300 }
            : e.kind === 'batch' && e.xp > 0
              ? { t: `+${e.xp} XP`, c: GOLD, ms: 1300 }
              : null;
  if (!text) return null;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 8, right: 8, top: 66, zIndex: 4, alignItems: 'center', ...anim('rg-float', text.ms) }}>
      <View style={{ borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: 'rgba(255, 253, 247, 0.96)' }}>
        <Text className="font-heavy" style={{ fontSize: 13, color: text.c }} numberOfLines={2}>
          {text.t}
        </Text>
      </View>
    </View>
  );
}

/** Tia nạp đòn: mỗi từ gõ đúng vươn dài thêm một đoạn về phía quái; đủ câu là chạm. */
function ChargeBeam({ charge, left, right }: { charge: StripCharge; left: number; right: number }) {
  const value = Math.max(0, Math.min(charge.total, charge.value));
  const ratio = value / charge.total;
  const full = value >= charge.total;
  const { L } = useL();
  return (
    <View
      pointerEvents="none"
      accessibilityLabel={L(`Nạp đòn ${value} trên ${charge.total} ${charge.unit}`, `Charging ${value} of ${charge.total} ${charge.unit}`)}
      style={{ position: 'absolute', left, right, bottom: 50, zIndex: 3 }}
    >
      <Text className="font-strong" numberOfLines={1} style={{ marginBottom: 3, fontSize: 10, textAlign: 'center', color: full ? GOLD : 'rgba(255,255,255,0.72)' }}>
        {full ? L('Chém!', 'Strike!') : L(`Nạp đòn ${value}/${charge.total} ${charge.unit}`, `Charging ${value}/${charge.total} ${charge.unit}`)}
      </Text>
      <View style={{ height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.12)', overflow: 'hidden' }}>
        <View
          style={{
            height: 6,
            width: '100%',
            backgroundColor: full ? '#FEF3C7' : GOLD,
            transform: [{ scaleX: Math.max(0.001, ratio) }],
            transformOrigin: 'left',
            ...(Platform.OS === 'web' ? ({ transition: 'transform 260ms cubic-bezier(0.2, 0.8, 0.2, 1), background-color 200ms ease', boxShadow: '0 0 10px rgba(250,204,21,0.8)' } as object) : null),
          }}
        />
      </View>
      {value > 0 && !full ? (
        <View
          key={`spark-${value}`}
          style={{ position: 'absolute', left: `${ratio * 100}%`, bottom: -2, width: 10, height: 10, marginLeft: -5, borderRadius: 5, backgroundColor: '#FFFFFF', ...anim('rg-pop', 320) }}
        />
      ) : null}
    </View>
  );
}

const FLAG = ['wr...', 'wrrr.', 'wrrrr', 'wrr..', 'w....', 'w....'];

/** Con đường tới đích dưới chân hai bên: mỗi câu một chặng, cờ ở cuối. */
function Road({ step }: { step: StripStep }) {
  const done = Math.max(0, Math.min(step.total, step.index));
  const segments = step.total <= 30;
  const { L } = useL();
  return (
    <View
      pointerEvents="none"
      accessibilityLabel={L(`Câu ${Math.min(step.total, done + 1)} trên ${step.total}`, `Question ${Math.min(step.total, done + 1)} of ${step.total}`)}
      style={{ position: 'absolute', left: 12, right: 12, bottom: 3, height: 11, flexDirection: 'row', alignItems: 'center', gap: 8, zIndex: 3 }}
    >
      <Text className="font-strong" style={{ fontSize: 10, color: 'rgba(255,255,255,0.75)' }}>
        {L('Câu', 'Question')} {Math.min(step.total, done + 1)}/{step.total}
      </Text>
      <View style={{ flex: 1, height: 4, flexDirection: 'row', gap: segments ? 2 : 0, borderRadius: 2, overflow: 'hidden', backgroundColor: segments ? 'transparent' : 'rgba(255,255,255,0.14)' }}>
        {segments ? (
          Array.from({ length: step.total }, (_, i) => (
            <View
              key={i}
              style={{
                flex: 1,
                height: 4,
                backgroundColor: i < done ? GOLD : i === done ? 'rgba(250,204,21,0.45)' : 'rgba(255,255,255,0.14)',
                ...(i === done ? anim('rg-twinkle', 1400, { loop: true, timing: 'ease-in-out' }) : null),
              }}
            />
          ))
        ) : (
          <View style={{ height: 4, width: '100%', backgroundColor: GOLD, transform: [{ scaleX: done / step.total }], transformOrigin: 'left' }} />
        )}
      </View>
      <Svg width={10} height={12} viewBox="0 0 5 6" {...CRISP}>
        {FLAG.flatMap((row, y) =>
          [...row].map((ch, x) => (ch === '.' ? null : <Rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={ch === 'w' ? '#F0EBE2' : '#EF4444'} />)),
        )}
      </Svg>
    </View>
  );
}
