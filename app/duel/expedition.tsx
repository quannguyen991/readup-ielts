import React, { useMemo, useState } from 'react';
import { AccessibilityInfo, Animated, ImageBackground, Pressable, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui';
import { HeroSprite } from '@/components/game/HeroSprite';
import { PixelSprite } from '@/components/game/PixelSprite';
import type { SpriteName } from '@/components/game/sprites';
import { useStudyDeck } from '@/components/vocab/study/useStudyDeck';
import { VOCAB_TOPICS } from '@/data/vocab-topics';
import { buildDuel } from '@/services/duel/duel';
import { isTypedCorrect } from '@/services/vocab/topic-study';
import { playArcadeCue } from '@/services/audio/arcade-sfx';
import { useGameStore } from '@/store/useGameStore';
import { useL } from '@/i18n/useL';

type Mode = 'forge' | 'dino' | 'boss';
type Phase = 'intro' | 'playing' | 'strike' | 'excavate' | 'feedback' | 'upgrade' | 'result';
type Action = 'strike' | 'guard' | 'burst';
type Upgrade = 'edge' | 'heart' | 'charge';
type TileKind = 'bone' | 'amber' | 'charge' | 'trap' | 'dust';
type DigTile = { id: number; kind: TileKind; opened: boolean };
type Encounter = { name: string; nameEn: string; taunt: string; tauntEn: string; sprite: SpriteName; color: string; hp: number };
type Outcome = { correct: boolean; answer: string; points: number; detail: string };

const GAME = {
  forge: {
    title: 'Spell Forge', titleVi: 'Lò Rèn Từ Ngữ', icon: '🔥',
    cover: require('../../assets/game-covers/spell-forge.jpg'), accent: '#FFC764', dark: '#25191A',
    intro: 'Khôi phục lò bùa bằng cách gõ từ chính xác, canh nhịp đập búa và hoàn thành ba công thức phép.',
    introEn: 'Restore the charm forge by spelling words, timing each hammer strike and completing three arcane recipes.',
    objective: 'Rèn đủ 3 bùa trước khi lò nguội hoặc hết tim.', objectiveEn: 'Forge 3 charms before the furnace cools or you run out of hearts.',
  },
  dino: {
    title: 'Dino Dig', titleVi: 'Đào Hóa Thạch', icon: '🦕',
    cover: require('../../assets/game-covers/dino-dig.jpg'), accent: '#F7D26B', dark: '#25251D',
    intro: 'Dẫn nhà khảo cổ Bút Sĩ vào hang. Mỗi câu đúng mở một lượt đào; hãy dò tín hiệu, chọn ô và gom đủ xương trước khi cạn sức.',
    introEn: 'Lead Band 9’s field scholar into the cave. Each correct answer earns a dig; scan the grid, choose a tile and rebuild the skeleton before you run out of hearts.',
    objective: 'Tìm 4 mảnh xương. Tránh bẫy dưới lớp đất.', objectiveEn: 'Find 4 fossil pieces. Watch for traps below the soil.',
  },
  boss: {
    title: 'Boss Raid', titleVi: 'Đột Kích Trùm', icon: '🐉',
    cover: require('../../assets/game-covers/boss-raid.jpg'), accent: '#E2B9FF', dark: '#211C31',
    intro: 'Đột nhập hang ổ, đánh bại lính gác rồi đối đầu rồng cổ. Canh năng lượng để tung đòn mạnh hoặc thủ đúng lúc.',
    introEn: 'Raid the lair, clear its guards and face the ancient dragon. Save energy for a heavy strike or guard at the right moment.',
    objective: 'Hạ ba kẻ canh hang, bao gồm con rồng cuối.', objectiveEn: 'Defeat all three cave guardians, including the final dragon.',
  },
} as const;
type GameConfig = (typeof GAME)[keyof typeof GAME];

const ENCOUNTERS: Record<'forge' | 'boss', Encounter[]> = {
  forge: [
    { name: 'Slime Mực', nameEn: 'Ink Slime', taunt: 'Đọc nổi chữ này không?', tauntEn: 'Can you read through this ink?', sprite: 'slime', color: '#7E7FD1', hp: 42 },
    { name: 'Hòm Từ Khóa', nameEn: 'Keyword Mimic', taunt: 'Ta giấu nghĩa trong bụng đây!', tauntEn: 'The meaning is hidden inside!', sprite: 'mimic', color: '#C98647', hp: 54 },
    { name: 'Rồng Sai Chính Tả', nameEn: 'Misspelling Drake', taunt: 'Một chữ sai là lò tắt!', tauntEn: 'One misspelling and the forge goes dark!', sprite: 'dragon', color: '#DB684D', hp: 76 },
  ],
  boss: [
    { name: 'Dơi Canh Cổng', nameEn: 'Gate Bat', taunt: 'Ta lao xuống ngay lượt tới!', tauntEn: 'I dive on my next turn!', sprite: 'bat', color: '#8066BA', hp: 38 },
    { name: 'Mimic Cổ Vật', nameEn: 'Relic Mimic', taunt: 'Cẩn thận chiếc rương!', tauntEn: 'That chest is not what it seems!', sprite: 'mimic', color: '#C98B50', hp: 52 },
    { name: 'Rồng Hư Không', nameEn: 'Void Dragon', taunt: 'Hãy chọn: đỡ hay chịu đòn!', tauntEn: 'Choose: block or take the hit!', sprite: 'dragon', color: '#B86CEC', hp: 78 },
  ],
};

const ACTIONS: { key: Action; label: string; labelEn: string; icon: string; cost: number; damage: number; hint: string; hintEn: string }[] = [
  { key: 'strike', label: 'Chém nhanh', labelEn: 'Quick strike', icon: '⚔️', cost: 0, damage: 23, hint: 'Không tốn năng lượng', hintEn: 'No energy cost' },
  { key: 'guard', label: 'Khiên chữ', labelEn: 'Word shield', icon: '🛡️', cost: 1, damage: 10, hint: 'Chặn đòn phản công', hintEn: 'Blocks the counterattack' },
  { key: 'burst', label: 'Bùng nổ', labelEn: 'Spell burst', icon: '✦', cost: 2, damage: 40, hint: 'Đòn mạnh, tốn 2 năng lượng', hintEn: 'Heavy hit · costs 2 energy' },
];

const ROUND_COUNT = 10;
const MAX_HEARTS = 4;
const MAX_ENERGY = 3;
const FOSSIL_GOAL = 4;
const FORGE_CHARM_GOAL = 3;
const FORGE_SLOTS_PER_CHARM = 3;

function createDigMap(): DigTile[] {
  const kinds: TileKind[] = ['bone', 'bone', 'bone', 'bone', 'bone', 'amber', 'amber', 'charge', 'trap', 'trap', 'dust', 'dust'];
  for (let i = kinds.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [kinds[i], kinds[j]] = [kinds[j]!, kinds[i]!];
  }
  return kinds.map((kind, id) => ({ id, kind, opened: false }));
}

export default function ExpeditionGame() {
  const params = useLocalSearchParams<{ deck?: string; mode?: string }>();
  const rawDeck = Array.isArray(params.deck) ? params.deck[0] : params.deck;
  const rawMode = Array.isArray(params.mode) ? params.mode[0] : params.mode;
  const mode: Mode = rawMode === 'dino' || rawMode === 'boss' ? rawMode : 'forge';
  const config = GAME[mode];
  const deck = useStudyDeck(rawDeck || VOCAB_TOPICS[0]!.slug);
  const { L, en } = useL();
  const sound = useGameStore((s) => s.sound);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [phase, setPhase] = useState<Phase>('intro');
  const [seed, setSeed] = useState(() => Date.now());
  const [round, setRound] = useState(0);
  const [input, setInput] = useState('');
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [hearts, setHearts] = useState(MAX_HEARTS);
  const [energy, setEnergy] = useState(2);
  const [action, setAction] = useState<Action>('strike');
  const [damageBonus, setDamageBonus] = useState(0);
  const [enemyIndex, setEnemyIndex] = useState(0);
  const [enemyHp, setEnemyHp] = useState(0);
  const [fossils, setFossils] = useState(0);
  const [tiles, setTiles] = useState<DigTile[]>([]);
  const [scannedTile, setScannedTile] = useState<number | null>(null);
  const [scanned, setScanned] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [finishAfterFeedback, setFinishAfterFeedback] = useState(false);
  const [afterUpgrade, setAfterUpgrade] = useState<'playing' | 'result'>('playing');
  const [pendingWin, setPendingWin] = useState(false);
  const [missionLog, setMissionLog] = useState('');

  React.useEffect(() => {
    let alive = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => { if (alive) setReducedMotion(value); });
    const listener = AccessibilityInfo.addEventListener('reduceMotionChanged', setReducedMotion);
    return () => { alive = false; listener.remove(); };
  }, []);

  const questions = useMemo(
    () => deck && deck.words.length >= 4 ? buildDuel(deck.words, `expedition:${mode}:${deck.slug}:${seed}`, ROUND_COUNT) : [],
    [deck, mode, seed],
  );
  const question = questions[round];
  const encounters = mode === 'boss' ? ENCOUNTERS.boss : [];
  const enemy = encounters.length ? encounters[Math.min(enemyIndex, encounters.length - 1)]! : null;
  const [forgeHeat, setForgeHeat] = useState(72);
  const [forgeSlots, setForgeSlots] = useState(0);
  const [forgedCharms, setForgedCharms] = useState(0);
  const [strikePosition, setStrikePosition] = useState(0);
  const [forgeFocus, setForgeFocus] = useState(0);
  const [forgeScore, setForgeScore] = useState(0);
  const won = mode === 'dino' ? fossils >= FOSSIL_GOAL : mode === 'forge' ? forgedCharms >= FORGE_CHARM_GOAL : enemyIndex >= encounters.length;

  React.useEffect(() => {
    if (phase !== 'strike') return undefined;
    const startedAt = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const cycle = (elapsed % 2200) / 1100;
      setStrikePosition(cycle <= 1 ? cycle * 100 : (2 - cycle) * 100);
    }, 36);
    return () => clearInterval(timer);
  }, [phase, round]);

  const start = () => {
    const nextSeed = Date.now();
    setSeed(nextSeed);
    setRound(0); setInput(''); setScore(0); setCorrectCount(0); setCombo(0); setBestCombo(0);
    setHearts(MAX_HEARTS); setEnergy(2); setAction('strike'); setDamageBonus(0);
    setEnemyIndex(0); setEnemyHp(mode === 'boss' ? ENCOUNTERS.boss[0]!.hp : 0);
    setForgeHeat(72); setForgeSlots(0); setForgedCharms(0); setStrikePosition(0); setForgeFocus(0); setForgeScore(0);
    setFossils(0); setTiles(createDigMap()); setScannedTile(null); setScanned(false);
    setOutcome(null); setFinishAfterFeedback(false); setAfterUpgrade('playing'); setPendingWin(false); setMissionLog(''); setPhase('playing');
  };

  const answer = (correct: boolean) => {
    if (!question || phase !== 'playing') return;
    const correctAnswer = mode === 'forge' ? question.word.word : question.options[question.correctIndex] ?? question.word.word;
    const nextCombo = correct ? combo + 1 : 0;
    const points = correct ? 100 + Math.min(100, nextCombo * 18) : 0;
    const nextHearts = correct ? hearts : Math.max(0, hearts - 1);
    setCombo(nextCombo); setBestCombo((best) => Math.max(best, nextCombo)); setHearts(nextHearts);
    setScore((current) => current + points);
    if (correct) setCorrectCount((current) => current + 1);
    setInput('');
    useGameStore.getState().answer(correct, 'duel', { key: `expedition:${mode}:${deck?.slug}:${seed}:${round}` });

    if (mode === 'dino') {
      if (correct) {
        setEnergy((current) => Math.min(MAX_ENERGY, current + 1));
        setOutcome({ correct, answer: correctAnswer, points, detail: L('Đúng rồi — bạn có một lượt đào. Chọn ô đất để xem bên dưới.', 'Correct — you earned a dig. Choose a tile below.') });
        setMissionLog(L('Bút Sĩ cầm cuốc, sẵn sàng đào.', 'The field scholar is ready to dig.'));
        setPhase('excavate');
      } else {
        setOutcome({ correct, answer: correctAnswer, points: 0, detail: L('Câu chưa đúng. Đường hầm rung lên, bạn mất một tim.', 'Incorrect. The tunnel shakes and you lose one heart.') });
        setMissionLog(L('Đá rơi trong hang!', 'Rocks fall from the cave ceiling!'));
        setFinishAfterFeedback(nextHearts <= 0 || round >= questions.length - 1);
        setPhase('feedback');
      }
      return;
    }

    if (mode === 'forge') {
      if (correct) {
        setOutcome({ correct, answer: correctAnswer, points, detail: L('Từ đã được khắc vào phôi. Canh vạch vàng để đập búa và giữ nhiệt cho lò.', 'The word is etched into the blank. Time your hammer in the gold zone to keep the furnace hot.') });
        setMissionLog(L('Phôi sáng lên — canh nhịp búa!', 'The blank is glowing — time your hammer!'));
        setStrikePosition(0);
        setPhase('strike');
      } else {
        const nextHeat = Math.max(0, forgeHeat - 18);
        setForgeHeat(nextHeat);
        setOutcome({ correct, answer: correctAnswer, points: 0, detail: L('Từ khắc bị lệch, lò mất nhiệt. Hãy giữ nhịp chính xác để hoàn thành bùa.', 'The inscription slips and the furnace loses heat. Keep your timing sharp to finish the charm.') });
        setMissionLog(L('Lò nguội đi · −18 nhiệt', 'The furnace cools · −18 heat'));
        setFinishAfterFeedback(nextHearts <= 0 || nextHeat <= 0 || round >= questions.length - 1);
        setPhase('feedback');
      }
      return;
    }

    const move = ACTIONS.find((entry) => entry.key === action)!;
    const canPay = energy >= move.cost;
    const energyAfterCost = Math.max(0, energy - (canPay ? move.cost : 0));
    const energyAfter = Math.min(MAX_ENERGY, energyAfterCost + (correct ? 1 : 0));
    setEnergy(energyAfter);
    const damage = correct ? move.damage + damageBonus + Math.min(12, Math.max(0, nextCombo - 1) * 3) : 0;
    const hpAfter = correct ? Math.max(0, enemyHp - damage) : enemyHp;
    const defeated = correct && hpAfter <= 0;
    if (correct) {
      setEnemyHp(hpAfter);
      playArcadeCue(move.key === 'guard' ? 'guard' : 'strike');
      if (defeated) playArcadeCue('loot');
    }

    const isEnemyTurn = !correct || (round % 2 === 1 && !defeated);
    const blocked = action === 'guard' && isEnemyTurn;
    const damageTaken = isEnemyTurn && !blocked ? 1 : 0;
    const finalHearts = Math.max(0, (correct ? nextHearts : hearts) - damageTaken);
    setHearts(finalHearts);
    if (blocked) playArcadeCue('guard');
    if (damageTaken) playArcadeCue('impact');

    const detail = correct
      ? defeated
        ? L(`${enemy?.name ?? 'Quái'} đã gục! Chọn một món nâng cấp để đi tiếp.`, `${enemy?.nameEn ?? 'Guardian'} is down. Choose an upgrade before moving on.`)
        : L(`${move.label} gây ${damage} sát thương.${damageTaken ? ' Quái phản công: −1 tim.' : blocked ? ' Khiên đỡ được đòn.' : ''}`, `${move.labelEn} deals ${damage} damage.${damageTaken ? ' Counterattack: −1 heart.' : blocked ? ' Your shield blocks the hit.' : ''}`)
      : blocked
        ? L('Đáp án sai, nhưng khiên chữ đã đỡ đòn.', 'Wrong answer, but your word shield blocks the attack.')
        : L(`${enemy?.name ?? 'Quái'} đánh trúng bạn. Đáp án: ${correctAnswer}.`, `${enemy?.nameEn ?? 'Guardian'} hits you. Answer: ${correctAnswer}.`);
    setOutcome({ correct, answer: correctAnswer, points, detail });
    setMissionLog(blocked ? L('Khiên chữ đã hấp thụ cú đánh.', 'The word shield absorbs the blow.') : correct ? L(`${move.label} trúng đích!`, `${move.labelEn} connects!`) : L('Quái đang áp sát.', 'The guardian closes in.'));

    if (defeated) {
      setPendingWin(enemyIndex + 1 >= encounters.length);
      setAfterUpgrade(enemyIndex + 1 >= encounters.length || round >= questions.length - 1 ? 'result' : 'playing');
      setPhase('upgrade');
      return;
    }
    setFinishAfterFeedback(finalHearts <= 0 || round >= questions.length - 1);
    setPhase('feedback');
  };

  const hammer = () => {
    if (mode !== 'forge' || phase !== 'strike') return;
    const distance = Math.abs(strikePosition - 50);
    const perfect = distance <= 7 + Math.min(forgeFocus, 3) * 2;
    const strong = distance <= 19 + Math.min(forgeFocus, 3) * 3;
    const quality = perfect ? 2 : strong ? 1 : 0;
    const bonus = perfect ? 220 : strong ? 120 : 40;
    const nextHeat = Math.max(0, Math.min(100, forgeHeat + (perfect ? 12 : strong ? 7 : -14)));
    const nextSlots = forgeSlots + 1;
    const nextForged = nextSlots >= FORGE_SLOTS_PER_CHARM ? forgedCharms + 1 : forgedCharms;
    setForgeHeat(nextHeat);
    setForgeScore((current) => current + quality);
    setScore((current) => current + bonus);
    setForgeSlots(nextSlots >= FORGE_SLOTS_PER_CHARM ? 0 : nextSlots);
    setForgedCharms(nextForged);
    setMissionLog(perfect ? L('Đập hoàn hảo! Bùa cộng hưởng rực sáng.', 'Perfect strike! The charm resonates brightly.') : strong ? L('Nhịp búa chuẩn — phôi đã thành hình.', 'Good timing — the charm takes shape.') : L('Búa chệch nhịp, nhưng phôi vẫn được rèn.', 'The hammer slips, but the blank is still forged.'));
    playArcadeCue(perfect ? 'loot' : 'forge');
    setOutcome((current) => current ? {
      ...current,
      points: current.points + bonus,
      detail: perfect
        ? L(`Đập hoàn hảo! +${bonus} điểm · +12 nhiệt.`, `Perfect strike! +${bonus} points · +12 heat.`)
        : strong
          ? L(`Đúng nhịp! +${bonus} điểm · +7 nhiệt.`, `On beat! +${bonus} points · +7 heat.`)
          : L(`Lệch nhịp, phôi vẫn tiến thêm một nấc nhưng lò mất 14 nhiệt. +${bonus} điểm.`, `Off beat, the blank advances but the furnace loses 14 heat. +${bonus} points.`),
    } : current);
    if (nextSlots >= FORGE_SLOTS_PER_CHARM) {
      setAfterUpgrade(nextForged >= FORGE_CHARM_GOAL || round >= questions.length - 1 ? 'result' : 'playing');
      setPhase('upgrade');
      return;
    }
    setFinishAfterFeedback(hearts <= 0 || nextHeat <= 0 || round >= questions.length - 1);
    setPhase('feedback');
  };

  const digTile = (id: number) => {
    if (phase !== 'excavate') return;
    const tile = tiles.find((entry) => entry.id === id);
    if (!tile || tile.opened) return;
    const nextTiles = tiles.map((entry) => entry.id === id ? { ...entry, opened: true } : entry);
    setTiles(nextTiles);
    playArcadeCue(tile.kind === 'trap' ? 'trap' : 'dig');
    let detail = '';
    let reward = 0;
    let nextHearts = hearts;
    let nextEnergy = energy;
    let nextFossils = fossils;
    if (tile.kind === 'bone') {
      nextFossils += 1; reward = 260; detail = L('Tìm thấy một mảnh xương! Bộ hóa thạch đang dần hiện ra.', 'Fossil found! The skeleton is taking shape.');
      playArcadeCue('loot');
    } else if (tile.kind === 'amber') {
      reward = 420; nextEnergy = Math.min(MAX_ENERGY, energy + 1); detail = L('Hổ phách cổ đại! Điểm thưởng và +1 năng lượng.', 'Ancient amber! Bonus points and +1 energy.');
      playArcadeCue('loot');
    } else if (tile.kind === 'charge') {
      nextEnergy = Math.min(MAX_ENERGY, energy + 2); detail = L('Tinh thể năng lượng: hồi 2 năng lượng để dò hang.', 'Energy crystal: restore 2 energy for cave scans.');
      playArcadeCue('loot');
    } else if (tile.kind === 'trap') {
      nextHearts = Math.max(0, hearts - 1); detail = L('Bẫy đá! Bạn mất một tim, nhưng cuốc vẫn còn.', 'Rockfall trap! You lose one heart, but keep your dig.');
    } else {
      reward = 35; detail = L('Chỉ có đất mềm. Lượt sau hãy thử ô gần tín hiệu hơn.', 'Just soft earth. Try a tile nearer the scan next time.');
    }
    setHearts(nextHearts); setEnergy(nextEnergy); setFossils(nextFossils); setScore((current) => current + reward);
    setScannedTile(null);
    setOutcome((current) => current ? { ...current, points: current.points + reward, detail } : current);
    setMissionLog(tile.kind === 'bone' ? L('Mảnh hóa thạch đã vào túi đồ.', 'Fossil fragment added to your pack.') : detail);
    setFinishAfterFeedback(nextHearts <= 0 || nextFossils >= FOSSIL_GOAL || round >= questions.length - 1);
    setPhase('feedback');
  };

  const scanForFossil = () => {
    if (energy <= 0 || scanned || phase !== 'excavate') return;
    const hidden = tiles.filter((tile) => !tile.opened);
    const signal = hidden.find((tile) => tile.kind === 'bone') ?? hidden.find((tile) => tile.kind === 'amber');
    if (!signal) return;
    setEnergy((current) => current - 1); setScanned(true); setScannedTile(signal.id);
    setMissionLog(L('Máy dò bắt được tín hiệu dưới một ô sáng.', 'The scanner detects a signal beneath the glowing tile.'));
    playArcadeCue('guard');
  };

  const advance = () => {
    if (finishAfterFeedback || round >= questions.length - 1) {
      setPhase('result');
      if (mode === 'dino' ? fossils >= FOSSIL_GOAL : mode === 'forge' ? forgedCharms >= FORGE_CHARM_GOAL : enemyIndex >= encounters.length) playArcadeCue('win');
      return;
    }
    setRound((current) => current + 1); setOutcome(null); setInput(''); setAction('strike'); setFinishAfterFeedback(false); setPhase('playing');
  };

  const chooseUpgrade = (upgrade: Upgrade) => {
    if (upgrade === 'edge') setDamageBonus((current) => current + 7);
    if (upgrade === 'heart') setHearts((current) => Math.min(MAX_HEARTS, current + 1));
    if (upgrade === 'charge') setEnergy((current) => Math.min(MAX_ENERGY, current + 2));
    playArcadeCue('loot');
    if (afterUpgrade === 'result') {
      if (pendingWin) setEnemyIndex(encounters.length);
      setPhase('result'); playArcadeCue('win'); return;
    }
    const nextEnemy = enemyIndex + 1;
    setEnemyIndex(nextEnemy); setEnemyHp(ENCOUNTERS[mode as 'forge' | 'boss'][nextEnemy]!.hp);
    setRound((current) => current + 1); setOutcome(null); setAction('strike'); setPhase('playing');
  };

  const chooseForgeGift = (gift: 'ember' | 'focus' | 'heart') => {
    if (gift === 'ember') { setScore((current) => current + 300); setForgeHeat((current) => Math.min(100, current + 18)); }
    if (gift === 'focus') setForgeFocus((current) => current + 1);
    if (gift === 'heart') setHearts((current) => Math.min(MAX_HEARTS, current + 1));
    playArcadeCue('loot');
    if (afterUpgrade === 'result') {
      setPhase('result');
      if (forgedCharms >= FORGE_CHARM_GOAL) playArcadeCue('win');
      return;
    }
    setRound((current) => current + 1); setOutcome(null); setInput(''); setFinishAfterFeedback(false); setPhase('playing');
  };

  const scanLabel = L('Dò tìm hóa thạch', 'Scan for fossils');
  if (!deck || deck.words.length < 4) {
    return <Screen><Text className="font-heavy text-sectionTitle text-ink">{L('Bộ từ này cần ít nhất 4 từ để chơi.', 'This deck needs at least 4 words to play.')}</Text><Button className="mt-4 self-start" label={L('Về sảnh game', 'Back to arcade')} onPress={() => router.replace('/duel' as never)} /></Screen>;
  }
  if (!questions.length) return null;

  const prompt = mode === 'forge' ? question?.word.meaningVi : question?.enToVi ? question.word.word : question?.word.meaningVi;
  const clue = mode === 'forge' ? question?.word.definitionEn : question?.enToVi ? question.word.definitionEn : question?.word.ipa;
  const completed = Math.min(round + (phase === 'strike' || phase === 'feedback' || phase === 'excavate' || phase === 'upgrade' || phase === 'result' ? 1 : 0), questions.length);

  return (
    <Screen>
      <View className="w-full self-center pb-8" style={{ maxWidth: 1040 }}>
        <View className="mb-4 flex-row flex-wrap items-center justify-between gap-3">
          <Pressable accessibilityRole="button" accessibilityLabel={L('Về sảnh game', 'Back to arcade')} onPress={() => router.replace('/duel' as never)} className="rounded-pill bg-white px-4 py-2.5">
            <Text className="font-semi text-body text-ink">‹　{L('Sảnh game', 'Game arcade')}</Text>
          </Pressable>
          <View className="flex-row items-center gap-2">
            <Text className="font-semi text-label text-muted">{deck.nameVi}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel={sound ? L('Tắt âm thanh', 'Mute sound') : L('Bật âm thanh', 'Enable sound')} onPress={() => useGameStore.getState().setSound(!sound)} className="rounded-pill bg-white px-3 py-2">
              <Text className="font-heavy text-body">{sound ? '🔊' : '🔇'} {L('Âm thanh', 'Sound')}</Text>
            </Pressable>
          </View>
        </View>

        <View className="overflow-hidden rounded-[28px]" style={{ backgroundColor: config.dark, borderWidth: 3, borderColor: config.accent, boxShadow: '0 18px 38px rgba(29,24,53,.22)' } as object}>
          <ImageBackground source={config.cover} resizeMode="cover" style={{ height: 168, justifyContent: 'flex-end' }}>
            <View className="px-6 pb-4 pt-14" style={{ backgroundColor: 'rgba(255, 253, 247, 0.96)' }}>
              <Text style={{ color: '#8A5A00', fontSize: 11, fontWeight: '900', letterSpacing: 2 }}>{L('BAND9 ARCADE · CHIẾN DỊCH', 'BAND9 ARCADE · CAMPAIGN')}</Text>
              <Text className="mt-1 font-heavy" style={{ color: '#2A1808', fontSize: 31 }}>{en ? config.title : config.titleVi}</Text>
            </View>
          </ImageBackground>

          <View className="p-4 sm:p-6">
            {phase === 'intro' ? (
              <View className="rounded-[24px] p-5 sm:p-7" style={{ backgroundColor: '#F9F5EC' }}>
                <View className="flex-row flex-wrap items-center gap-5">
                  <View className="items-center justify-center rounded-[22px] p-3" style={{ backgroundColor: '#E9DFCA' }}><HeroSprite size={96} mood="happy" /></View>
                  <View style={{ flex: 1, minWidth: 240 }}>
                    <Text className="font-heavy text-sectionTitle text-ink">{L('Nhận nhiệm vụ', 'Mission briefing')}</Text>
                    <Text className="mt-2 font-sans text-body text-muted">{en ? config.introEn : config.intro}</Text>
                    <View className="mt-4 flex-row flex-wrap gap-2">
                      <InfoPill label={L(`${questions.length} lượt`, `${questions.length} turns`)} icon="⚡" color="#FFE3A8" />
                      <InfoPill label={`${MAX_HEARTS} ${L('tim', 'hearts')}`} icon="❤️" color="#FFE0D7" />
                      <InfoPill label={deck.nameVi} icon="📚" color="#DDEBFF" />
                    </View>
                  </View>
                </View>
                <View className="mt-5 flex-row flex-wrap gap-3">
                  <View className="flex-1 rounded-2xl p-4" style={{ minWidth: 200, backgroundColor: '#FFFFFF' }}>
                    <Text className="font-heavy text-label" style={{ color: '#9B6C1E' }}>{L('MỤC TIÊU', 'MISSION GOAL')}</Text>
                    <Text className="mt-1 font-semi text-body text-ink">{en ? config.objectiveEn : config.objective}</Text>
                  </View>
                  <View className="flex-1 rounded-2xl p-4" style={{ minWidth: 200, backgroundColor: '#FFFFFF' }}>
                    <Text className="font-heavy text-label" style={{ color: '#9B6C1E' }}>{L('CÁCH CHƠI', 'HOW TO PLAY')}</Text>
                    <Text className="mt-1 font-semi text-body text-ink">{mode === 'dino' ? L('Trả lời → dò tín hiệu → tự chọn ô đào. Đừng để bẫy lấy hết tim.', 'Answer → scan → choose a dig tile. Traps can drain your hearts.') : mode === 'forge' ? L('Gõ từ → canh nhịp vạch vàng → đập búa → hoàn thành 3 công thức bùa.', 'Spell a word → time the gold zone → hammer the blank → finish 3 charm recipes.') : L('Chọn đòn → trả lời → canh đòn phản công → chọn nâng cấp khi hạ quái.', 'Choose a move → answer → block counters → pick an upgrade after a takedown.')}</Text>
                  </View>
                </View>
                <Button className="mt-5 self-start" label={L('Vào nhiệm vụ', 'Start mission')} iconRight="arrow-right" onPress={start} />
              </View>
            ) : null}

            {phase !== 'intro' ? (
              <>
                <View className="mb-4 flex-row flex-wrap items-center justify-between gap-3">
                  <View className="flex-row flex-wrap gap-2">
                    <InfoPill label={'♥ '.repeat(Math.max(0, hearts)).trim() || '♡'} icon="" color="#3B2948" ink="#FFB7C7" />
                    {mode === 'forge' ? <InfoPill label={`${L('NHIỆT LÒ', 'HEAT')} ${forgeHeat}%`} icon="🌡️" color="#3D3156" ink={forgeHeat > 25 ? config.accent : '#FF7C6D'} /> : mode === 'boss' ? <InfoPill label={`${L('NĂNG LƯỢNG', 'ENERGY')} ${'◆'.repeat(energy)}${'◇'.repeat(MAX_ENERGY - energy)}`} icon="⚡" color="#3D3156" ink={config.accent} /> : <InfoPill label={`${L('NĂNG LƯỢNG', 'ENERGY')} ${'◆'.repeat(energy)}${'◇'.repeat(MAX_ENERGY - energy)}`} icon="⚡" color="#3D3156" ink={config.accent} />}
                    <InfoPill label={`${L('COMBO', 'COMBO')} ×${combo}`} icon="✨" color="#3D3156" ink={config.accent} />
                  </View>
                  <View className="rounded-2xl px-4 py-2" style={{ backgroundColor: '#FFFDF7' }}><Text className="font-heavy text-bodyLg" style={{ color: '#8A5A00' }}>⭐ {score.toLocaleString()}</Text></View>
                </View>
                <View className="mb-4 flex-row items-center gap-3">
                  <Text className="font-heavy text-label" style={{ color: config.accent }}>{L('NHIỆM VỤ', 'MISSION')} {completed}/{questions.length}</Text>
                  <View className="h-3 flex-1 overflow-hidden rounded-full" style={{ backgroundColor: '#FFFDF7' }}><View style={{ height: '100%', width: `${(completed / questions.length) * 100}%`, borderRadius: 99, backgroundColor: config.accent }} /></View>
                  <Text className="font-heavy text-label" style={{ color: '#2A1808' }}>{mode === 'dino' ? `🦴 ${fossils}/${FOSSIL_GOAL}` : mode === 'forge' ? `🔮 ${forgedCharms}/${FORGE_CHARM_GOAL} · ${forgeSlots}/${FORGE_SLOTS_PER_CHARM}` : `${Math.min(enemyIndex + 1, encounters.length)}/${encounters.length} ${L('quái', 'guardians')}`}</Text>
                </View>

                {mode === 'dino' ? (
                  <DinoArena accent={config.accent} cover={config.cover} log={missionLog || L('Bút Sĩ đang khảo sát hang.', 'The field scholar is surveying the cave.')} fossils={fossils} goal={FOSSIL_GOAL} />
                ) : mode === 'forge' ? (
                  <ForgeArena accent={config.accent} dark={config.dark} cover={config.cover} heat={forgeHeat} slots={forgeSlots} charms={forgedCharms} focus={forgeFocus} forgeScore={forgeScore} reducedMotion={reducedMotion} log={missionLog || L('Châm lửa và bắt đầu rèn bùa.', 'Light the furnace and begin crafting charms.')} />
                ) : (
                  <BattleArena config={config} enemy={enemy!} enemyHp={enemyHp} damageBonus={damageBonus} hearts={hearts} reducedMotion={reducedMotion} accent={config.accent} log={missionLog || (en ? enemy!.tauntEn : enemy!.taunt)} />
                )}

                {phase === 'playing' && question ? (
                  <View className="mt-4 rounded-[24px] p-5 sm:p-7" style={{ backgroundColor: '#F9F5EC' }}>
                    {mode === 'boss' ? (
                      <>
                        <Text className="font-heavy text-label" style={{ color: '#8A5E15' }}>{L('CHỌN NƯỚC ĐI', 'CHOOSE YOUR MOVE')}</Text>
                        <View className="mt-2 flex-row flex-wrap gap-2">
                          {ACTIONS.map((move) => <ActionCard key={move.key} move={move} active={action === move.key} locked={energy < move.cost} accent={config.accent} onPress={() => setAction(move.key)} en={en} />)}
                        </View>
                      </>
                    ) : null}
                    <QuestionPanel mode={mode} prompt={prompt ?? ''} clue={clue} question={question} input={input} setInput={setInput} onAnswer={answer} accent={config.accent} en={en} L={L} />
                  </View>
                ) : null}

                {phase === 'strike' && outcome ? <ForgeStrikeCard accent={config.accent} position={strikePosition} focus={forgeFocus} word={question?.word.word ?? outcome.answer} onHammer={hammer} L={L} /> : null}

                {phase === 'excavate' ? (
                  <View className="mt-4 rounded-[24px] p-5 sm:p-7" style={{ backgroundColor: '#F9F5EC' }}>
                    <View className="flex-row flex-wrap items-center justify-between gap-3">
                      <View>
                        <Text className="font-heavy text-sectionTitle text-ink">{L('Chọn ô để đào', 'Choose a tile to excavate')}</Text>
                        <Text className="mt-1 font-semi text-body text-muted">{L('Ô đã mở sẽ giữ nguyên. Dò một tín hiệu trước khi chọn.', 'Opened tiles stay visible. Spend energy to scan before choosing.')}</Text>
                      </View>
                      <Pressable accessibilityRole="button" disabled={energy <= 0 || scanned} onPress={scanForFossil} className="rounded-2xl px-4 py-3" style={{ backgroundColor: energy <= 0 || scanned ? '#D9D4CC' : '#2D5B51' }}>
                        <Text className="font-heavy text-body" style={{ color: '#2A1808' }}>📡 {scanned ? L('Đã dò', 'Scanned') : `${scanLabel} · 1⚡`}</Text>
                      </Pressable>
                    </View>
                    <View className="mt-5 flex-row flex-wrap justify-center gap-2.5">
                      {tiles.map((tile) => <DigTileButton key={tile.id} tile={tile} scanned={scannedTile === tile.id} onPress={() => digTile(tile.id)} en={en} />)}
                    </View>
                    <View className="mt-4 flex-row flex-wrap gap-2">
                      <InfoPill label={L(`Xương ${fossils}/${FOSSIL_GOAL}`, `Fossils ${fossils}/${FOSSIL_GOAL}`)} icon="🦴" color="#F1E2BC" />
                      <InfoPill label={L('Hổ phách · tinh thể · bẫy', 'Amber · crystals · traps')} icon="✨" color="#E8E7D9" />
                    </View>
                  </View>
                ) : null}

                {phase === 'feedback' && outcome ? (
                  <FeedbackCard outcome={outcome} mode={mode} accent={config.accent} finish={finishAfterFeedback} onContinue={advance} L={L} />
                ) : null}

                {phase === 'upgrade' ? (
                  <View className="mt-4 rounded-[24px] p-5 sm:p-7" style={{ backgroundColor: '#F9F5EC' }}>
                    {mode === 'forge' ? <>
                      <View className="flex-row items-center gap-3"><Text style={{ fontSize: 42 }}>🔮</Text><View><Text className="font-heavy text-sectionTitle text-ink">{L('Bùa đã thành hình — chọn phép bổ trợ', 'Charm complete — choose an enchantment')}</Text><Text className="mt-1 font-semi text-body text-muted">{L('Mỗi công thức hoàn tất mở một phép giúp lò rèn tiếp.', 'Each finished recipe unlocks a gift for the next forge.')}</Text></View></View>
                      <View className="mt-5 flex-row flex-wrap gap-3">
                        <UpgradeCard icon="🔥" title={L('Than hồng', 'Ember')} detail={L('+18 nhiệt và 300 điểm', '+18 heat and 300 points')} onPress={() => chooseForgeGift('ember')} />
                        <UpgradeCard icon="🎯" title={L('Mắt thợ rèn', 'Smith’s eye')} detail={L('Mở rộng vùng canh búa ở lượt sau', 'Widen the hammer sweet spot for future strikes')} onPress={() => chooseForgeGift('focus')} />
                        <UpgradeCard icon="💗" title={L('Hơi ấm', 'Warmth')} detail={L('Hồi 1 tim, tối đa 4', 'Restore 1 heart, up to 4')} onPress={() => chooseForgeGift('heart')} />
                      </View>
                    </> : <>
                      <View className="flex-row items-center gap-3"><Text style={{ fontSize: 42 }}>🏆</Text><View><Text className="font-heavy text-sectionTitle text-ink">{L('Quái đã gục — chọn chiến lợi phẩm', 'Guardian down — choose your loot')}</Text><Text className="mt-1 font-semi text-body text-muted">{L('Lựa chọn này thay đổi phần còn lại của trận.', 'This choice changes the rest of your run.')}</Text></View></View>
                      <View className="mt-5 flex-row flex-wrap gap-3">
                        <UpgradeCard icon="🗡️" title={L('Ngòi bút sắc', 'Keen nib')} detail={L('+7 sát thương cho các đòn tiếp theo', '+7 damage on future strikes')} onPress={() => chooseUpgrade('edge')} />
                        <UpgradeCard icon="❤️" title={L('Bình hồi sức', 'Heart tonic')} detail={L('Hồi 1 tim, tối đa 4', 'Restore 1 heart, up to 4')} onPress={() => chooseUpgrade('heart')} />
                        <UpgradeCard icon="⚡" title={L('Tinh thể xanh', 'Blue crystal')} detail={L('Hồi 2 năng lượng, tối đa 3', 'Restore 2 energy, up to 3')} onPress={() => chooseUpgrade('charge')} />
                      </View>
                    </>}
                  </View>
                ) : null}

                {phase === 'result' ? (
                  <View className="mt-4 rounded-[24px] p-6" style={{ backgroundColor: '#F9F5EC' }}>
                    <Text style={{ fontSize: 50 }}>{won ? '🏆' : hearts <= 0 || (mode === 'forge' && forgeHeat <= 0) ? '💫' : mode === 'dino' ? '🦴' : mode === 'forge' ? '🔥' : '⚔️'}</Text>
                    <Text className="mt-2 font-heavy text-sectionTitle text-ink">{won ? L('Nhiệm vụ hoàn thành!', 'Mission complete!') : mode === 'forge' && forgeHeat <= 0 ? L('Lò rèn đã nguội', 'The furnace has gone cold') : hearts <= 0 ? L('Đội thám hiểm cần nghỉ', 'Your party needs to recover') : L('Kết thúc chuyến đi', 'Run complete')}</Text>
                    <Text className="mt-1 font-sans text-body text-muted">{mode === 'dino' ? L(`Đã tìm thấy ${fossils}/${FOSSIL_GOAL} mảnh xương. ${won ? 'Bộ hóa thạch được phục dựng!' : 'Hang vẫn còn bí mật — thử lại nhé.'}`, `Found ${fossils}/${FOSSIL_GOAL} fossil pieces. ${won ? 'The skeleton is restored!' : 'The cave still has secrets. Try again.'}`) : mode === 'forge' ? L(`Đã rèn ${forgedCharms}/${FORGE_CHARM_GOAL} bùa · chất lượng ${forgeScore} · nhiệt lò ${forgeHeat}%.`, `Forged ${forgedCharms}/${FORGE_CHARM_GOAL} charms · quality ${forgeScore} · furnace heat ${forgeHeat}%.`) : won ? L('Ba trận thắng và những lựa chọn nâng cấp đã mở đường qua hang ổ.', 'Three guardians defeated. Your upgrades carried you through the lair.') : L(`Đã hạ ${enemyIndex}/${encounters.length} quái. Chuỗi tốt nhất: ${bestCombo}.`, `Defeated ${enemyIndex}/${encounters.length} guardians. Best combo: ${bestCombo}.`)}</Text>
                    <View className="mt-5 flex-row flex-wrap gap-3">
                      <ResultStat label={L('Điểm', 'Score')} value={score.toLocaleString()} />
                      <ResultStat label={L('Chính xác', 'Correct')} value={`${correctCount}/${questions.length}`} />
                      <ResultStat label={L('Combo cao nhất', 'Best combo')} value={`${bestCombo}×`} />
                      <ResultStat label={mode === 'forge' ? L('Nhiệt lò', 'Furnace heat') : L('Tim còn lại', 'Hearts left')} value={mode === 'forge' ? `${forgeHeat}%` : `${hearts}/${MAX_HEARTS}`} />
                    </View>
                    <View className="mt-5 flex-row flex-wrap gap-3"><Button label={L('Chơi lại', 'Play again')} iconLeft="refresh" onPress={start} /><Pressable accessibilityRole="button" onPress={() => router.replace('/duel' as never)} className="rounded-pill px-5 py-3" style={{ backgroundColor: '#EDE5D8' }}><Text className="font-heavy text-body text-ink">{L('Về sảnh game', 'Back to arcade')}</Text></Pressable></View>
                  </View>
                ) : null}
              </>
            ) : null}
          </View>
        </View>
      </View>
    </Screen>
  );
}

function ForgeArena({ accent, dark, cover, heat, slots, charms, focus, forgeScore, reducedMotion, log }: { accent: string; dark: string; cover: number; heat: number; slots: number; charms: number; focus: number; forgeScore: number; reducedMotion: boolean; log: string }) {
  const { L } = useL();
  const [flame] = React.useState(() => new Animated.Value(1));
  React.useEffect(() => {
    if (reducedMotion) { flame.setValue(1); return undefined; }
    const pulse = Animated.loop(Animated.sequence([
      Animated.timing(flame, { toValue: 1.12, duration: 480, useNativeDriver: true }),
      Animated.timing(flame, { toValue: 0.96, duration: 560, useNativeDriver: true }),
      Animated.timing(flame, { toValue: 1.04, duration: 390, useNativeDriver: true }),
    ]));
    pulse.start();
    return () => pulse.stop();
  }, [flame, reducedMotion]);
  const names = [L('Bùa Than Hồng', 'Ember Charm'), L('Bùa Thủy Tinh', 'Tideglass Charm'), L('Bùa Sao Rơi', 'Falling Star Charm')];
  const icons = ['🔥', '🌊', '🌟'];
  const active = Math.min(charms, names.length - 1);
  return (
    <ImageBackground source={cover} resizeMode="cover" imageStyle={{ opacity: 0.72 }} className="overflow-hidden rounded-[24px]" style={{ borderWidth: 1, borderColor: `${accent}90` }}>
    <View className="overflow-hidden rounded-[24px] p-4 sm:p-5" style={{ backgroundColor: `${dark}D9` }}>
      <View className="flex-row flex-wrap items-center justify-between gap-2"><Text className="font-heavy text-label" style={{ color: accent }}>{L('LÒ CỔ · BÀN RÈN BÙA', 'ANCIENT FURNACE · CHARM BENCH')}</Text><Text className="font-heavy text-label" style={{ color: '#2A1808' }}>{log}</Text></View>
      <View className="mt-4 flex-row flex-wrap items-center justify-between gap-4">
        <View className="flex-row items-center gap-3"><View className="rounded-[20px] p-2" style={{ backgroundColor: 'rgba(255,255,255,.1)' }}><HeroSprite size={78} mood="happy" /></View><View><Text className="font-heavy text-bodyLg" style={{ color: '#2A1808' }}>{L('Bút Sĩ · thợ rèn bùa', 'Word Knight · charm smith')}</Text><Text className="mt-1 font-semi text-label" style={{ color: '#2A1808' }}>{L(`Mắt nghề +${focus} · chất lượng ${forgeScore}`, `Smith’s eye +${focus} · quality ${forgeScore}`)}</Text></View></View>
        <View className="items-center justify-center rounded-[22px] px-5 py-3" style={{ minWidth: 118, backgroundColor: 'rgba(255,180,88,.12)', borderWidth: 1, borderColor: `${accent}77` }}><Animated.Text style={{ fontSize: 40, transform: [{ scale: flame }, { rotate: flame.interpolate({ inputRange: [0.96, 1.12], outputRange: ['-4deg', '4deg'] }) }] }}>{icons[active]}</Animated.Text><Text className="font-heavy text-label" style={{ color: '#2A1808' }}>{names[active]}</Text></View>
      </View>
      <View className="mt-4 rounded-[18px] p-4" style={{ backgroundColor: 'rgba(0,0,0,.2)' }}>
        <View className="flex-row items-center justify-between"><Text className="font-heavy text-label" style={{ color: '#2A1808' }}>{L('NHIỆT LÒ', 'FURNACE HEAT')}</Text><Text className="font-heavy text-label" style={{ color: heat > 25 ? accent : '#FF7C6D' }}>{heat}%</Text></View>
        <View className="mt-2 h-3 overflow-hidden rounded-full" style={{ backgroundColor: '#FFFDF7' }}><View style={{ height: '100%', width: `${heat}%`, borderRadius: 99, backgroundColor: heat > 25 ? '#FF9E4A' : '#FF5968' }} /></View>
        <View className="mt-4 flex-row flex-wrap items-center justify-between gap-2"><Text className="font-heavy text-label" style={{ color: accent }}>{L('CÔNG THỨC ĐANG RÈN', 'ACTIVE RECIPE')}</Text><Text className="font-semi text-label" style={{ color: '#2A1808' }}>{L('Mỗi ô cần một lần đập búa', 'One timed strike per rune')}</Text></View>
        <View className="mt-3 flex-row gap-2">{Array.from({ length: FORGE_SLOTS_PER_CHARM }, (_, index) => <View key={index} className="flex-1 items-center rounded-[14px] py-2" style={{ backgroundColor: index < slots ? '#E9A849' : 'rgba(255,255,255,.1)', borderWidth: 1, borderColor: index < slots ? '#FFD98A' : 'rgba(255,255,255,.18)' }}><Text style={{ fontSize: 22 }}>{index < slots ? '✦' : '◇'}</Text><Text className="font-heavy text-label" style={{ color: index < slots ? '#241B20' : '#D9D4E5' }}>{index < slots ? L('KHẮC', 'ETCHED') : `${index + 1}/3`}</Text></View>)}</View>
      </View>
    </View>
    </ImageBackground>
  );
}

function ForgeStrikeCard({ accent, position, focus, word, onHammer, L }: { accent: string; position: number; focus: number; word: string; onHammer: () => void; L: (vi: string, en: string) => string }) {
  const zoneWidth = 16 + Math.min(focus, 3) * 4;
  return (
    <View className="mt-4 rounded-[24px] p-5 sm:p-7" style={{ backgroundColor: '#F9F5EC' }}>
      <View className="flex-row flex-wrap items-center justify-between gap-2"><Text className="font-heavy text-label" style={{ color: '#8A5E15' }}>{L('NHỊP BÚA · CANH VÙNG VÀNG', 'HAMMER RHYTHM · HIT THE GOLD')}</Text><Text className="font-heavy text-label" style={{ color: '#8A5E15' }}>{L('TỪ ĐÃ KHẮC', 'ETCHED WORD')}</Text></View>
      <Text className="mt-2 font-heavy text-sectionTitle text-ink">{word}</Text>
      <Text className="mt-1 font-semi text-body text-muted">{L('Đập gần tâm để tạo bùa chất lượng cao và giữ nhiệt cho lò.', 'Strike near the center to craft a stronger charm and keep the furnace hot.')}</Text>
      <View accessibilityLabel={L(`Vạch canh đập ở vị trí ${Math.round(position)} phần trăm`, `Hammer marker at ${Math.round(position)} percent`)} className="mt-6 h-12 justify-center overflow-hidden rounded-[16px]" style={{ backgroundColor: '#FFFDF7', borderWidth: 2, borderColor: '#51405C' }}>
        <View className="absolute h-full" style={{ left: `${50 - zoneWidth / 2}%`, width: `${zoneWidth}%`, backgroundColor: 'rgba(244,190,76,.48)', borderLeftWidth: 2, borderRightWidth: 2, borderColor: '#FFD46B' }} />
        <View className="absolute h-full w-1" style={{ left: `${position}%`, transform: [{ translateX: -2 }], backgroundColor: '#FFFFFF', boxShadow: '0 0 12px #fff' } as object} />
        <View className="absolute self-center h-full w-px" style={{ backgroundColor: '#FFE7A1', opacity: 0.75 }} />
      </View>
      <View className="mt-2 flex-row justify-between"><Text className="font-heavy text-label" style={{ color: '#746E79' }}>{L('SỚM', 'EARLY')}</Text><Text className="font-heavy text-label" style={{ color: '#9B6C1E' }}>{L('TÂM VÀNG', 'GOLD ZONE')}</Text><Text className="font-heavy text-label" style={{ color: '#746E79' }}>{L('MUỘN', 'LATE')}</Text></View>
      <Pressable accessibilityRole="button" onPress={onHammer} className="mt-5 items-center rounded-[18px] px-6 py-4" style={{ backgroundColor: accent, boxShadow: '0 5px 0 #A66B29' }}><Text className="font-heavy text-bodyLg" style={{ color: '#2D2023' }}>{L('🔨 ĐẬP BÚA!', '🔨 HAMMER NOW!')}</Text></Pressable>
    </View>
  );
}

function BattleArena({ config, enemy, enemyHp, damageBonus, hearts, reducedMotion, accent, log }: { config: GameConfig; enemy: Encounter; enemyHp: number; damageBonus: number; hearts: number; reducedMotion: boolean; accent: string; log: string }) {
  const { L, en } = useL();
  const ratio = Math.max(0, Math.min(1, enemyHp / enemy.hp));
  const [enemyImpact] = useState(() => new Animated.Value(0));
  const [heroHurt] = useState(() => new Animated.Value(0));
  React.useEffect(() => {
    if (reducedMotion) { enemyImpact.setValue(0); return; }
    const motion = Animated.sequence([
      Animated.timing(enemyImpact, { toValue: 1, duration: 70, useNativeDriver: true }),
      Animated.timing(enemyImpact, { toValue: -0.65, duration: 80, useNativeDriver: true }),
      Animated.timing(enemyImpact, { toValue: 0, duration: 130, useNativeDriver: true }),
    ]);
    motion.start();
    return () => motion.stop();
  }, [enemyHp, enemyImpact, reducedMotion]);
  React.useEffect(() => {
    if (reducedMotion) { heroHurt.setValue(0); return; }
    const motion = Animated.sequence([
      Animated.timing(heroHurt, { toValue: -1, duration: 70, useNativeDriver: true }),
      Animated.timing(heroHurt, { toValue: 0.5, duration: 90, useNativeDriver: true }),
      Animated.timing(heroHurt, { toValue: 0, duration: 130, useNativeDriver: true }),
    ]);
    motion.start();
    return () => motion.stop();
  }, [hearts, heroHurt, reducedMotion]);
  const enemyX = enemyImpact.interpolate({ inputRange: [-1, 1], outputRange: [-9, 9] });
  const enemyScale = enemyImpact.interpolate({ inputRange: [-1, 0, 1], outputRange: [0.98, 1, 1.05] });
  const heroX = heroHurt.interpolate({ inputRange: [-1, 1], outputRange: [-5, 5] });
  return (
    <ImageBackground source={config.cover} resizeMode="cover" imageStyle={{ opacity: 0.82 }} className="overflow-hidden rounded-[24px]" style={{ borderWidth: 1, borderColor: `${accent}88` }}>
    <View className="overflow-hidden rounded-[24px] p-4 sm:p-5" style={{ backgroundColor: 'rgba(255, 253, 247, 0.96)' }}>
      <View className="flex-row flex-wrap items-center justify-between gap-2">
        <Text className="font-heavy text-label" style={{ color: accent }}>{L('HANG Ổ · PHÒNG TRÙM', 'DRAGON LAIR · CHAMBER')}</Text>
        <Text className="font-heavy text-label" style={{ color: '#2A1808' }}>{log}</Text>
      </View>
      <View className="mt-4 flex-row items-center justify-between gap-2 sm:gap-6">
        <View className="items-center" style={{ width: '31%' }}>
          <Animated.View className="rounded-[20px] p-2" style={{ backgroundColor: 'rgba(255,255,255,.1)', transform: [{ translateX: heroX }] }}><HeroSprite size={90} mood="attack" /></Animated.View>
          <Text className="mt-2 font-heavy text-label" style={{ color: '#2A1808' }}>{L('BÚT SĨ', 'WORD KNIGHT')}</Text>
          <Text className="font-semi text-label" style={{ color: '#2A1808' }}>{en ? `Nib +${damageBonus}` : `Ngòi +${damageBonus}`}</Text>
        </View>
        <View className="items-center" style={{ flex: 1 }}>
          <Text className="font-heavy" style={{ color: accent, fontSize: 23 }}>VS</Text>
          <View className="mt-2 h-2.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: '#FFFDF7' }}><View style={{ height: '100%', width: `${ratio * 100}%`, borderRadius: 99, backgroundColor: ratio > 0.5 ? '#EF806C' : '#F3C452' }} /></View>
          <Text className="mt-1 font-heavy text-label" style={{ color: '#2A1808' }}>{L(`MÁU ${enemyHp}/${enemy.hp}`, `HP ${enemyHp}/${enemy.hp}`)}</Text>
        </View>
        <View className="items-center" style={{ width: '31%' }}>
          <View className="items-center justify-center rounded-[20px]" style={{ width: 110, height: 110, backgroundColor: `${enemy.color}35` }}><Animated.View style={{ transform: [{ translateX: enemyX }, { scale: enemyScale }] }}><PixelSprite name={enemy.sprite} size={92} color={enemy.color} flip /></Animated.View></View>
          <Text className="mt-2 font-heavy text-label" style={{ color: '#2A1808' }}>{en ? enemy.nameEn : enemy.name}</Text>
          <Text className="font-semi text-label" style={{ color: '#2A1808' }}>{en ? enemy.tauntEn : enemy.taunt}</Text>
        </View>
      </View>
    </View>
    </ImageBackground>
  );
}

function DinoArena({ accent, cover, log, fossils, goal }: { accent: string; cover: number; log: string; fossils: number; goal: number }) {
  const { L } = useL();
  return (
    <ImageBackground source={cover} resizeMode="cover" imageStyle={{ opacity: 0.78 }} className="overflow-hidden rounded-[24px]" style={{ borderWidth: 1, borderColor: '#A8A873' }}>
    <View className="overflow-hidden rounded-[24px] p-4 sm:p-5" style={{ backgroundColor: 'rgba(255, 253, 247, 0.96)' }}>
      <View className="flex-row flex-wrap items-center justify-between gap-2"><Text className="font-heavy text-label" style={{ color: accent }}>{L('KHU ĐÀO · HANG HỔ PHÁCH', 'DIG SITE · AMBER CAVE')}</Text><Text className="font-heavy text-label" style={{ color: '#2A1808' }}>{log}</Text></View>
      <View className="mt-3 flex-row flex-wrap items-center gap-4">
        <View className="rounded-[18px] p-2" style={{ backgroundColor: 'rgba(255,255,255,.12)' }}><HeroSprite size={76} mood="idle" /></View>
        <View style={{ flex: 1, minWidth: 180 }}><Text className="font-heavy text-bodyLg" style={{ color: '#2A1808' }}>{L('Bút Sĩ · nhà khảo cổ', 'Word Knight · field scholar')}</Text><Text className="mt-1 font-semi text-body" style={{ color: '#2A1808' }}>{L('Máy dò rung khi có cổ vật gần đó. Mỗi câu đúng cho bạn một lượt cuốc.', 'The scanner hums near relics. Each correct answer earns a pickaxe turn.')}</Text></View>
        <View className="rounded-2xl px-4 py-3" style={{ backgroundColor: 'rgba(0,0,0,.2)' }}><Text className="font-heavy text-bodyLg" style={{ color: accent }}>🦴 {fossils}/{goal}</Text><Text className="font-semi text-label" style={{ color: '#2A1808' }}>{L('mảnh xương', 'fossil pieces')}</Text></View>
      </View>
    </View>
    </ImageBackground>
  );
}

function QuestionPanel({ mode, prompt, clue, question, input, setInput, onAnswer, accent, en, L }: any) {
  return (
    <View className="mt-5">
      <View className="flex-row items-center justify-between gap-3"><Text className="font-heavy text-label" style={{ color: '#8A5E15' }}>{L('CÂU THỬ THÁCH', 'VOCAB CHALLENGE')}</Text><Text className="font-heavy text-label" style={{ color: '#8A5E15' }}>{mode === 'forge' ? L('GÕ TỪ ĐỂ NẠP LÒ', 'SPELL TO CHARGE') : L('TRẢ LỜI ĐỂ HÀNH ĐỘNG', 'ANSWER TO ACT')}</Text></View>
      <Text className="mt-2 font-heavy" style={{ color: '#241F2D', fontSize: 27, lineHeight: 35 }}>{prompt}</Text>
      {clue ? <Text className="mt-1 font-semi text-body" style={{ color: '#746E79' }}>{clue}</Text> : null}
      {mode === 'forge' ? (
        <View className="mt-4 flex-row flex-wrap items-center gap-2">
          <TextInput value={input} onChangeText={setInput} onSubmitEditing={() => onAnswer(isTypedCorrect(input, question?.word.word ?? ''))} autoCapitalize="none" autoCorrect={false} returnKeyType="done" placeholder={L('Gõ từ tiếng Anh…', 'Spell the English word…')} placeholderTextColor="#968E91" className="min-w-[220px] flex-1 rounded-2xl px-4 py-3 font-heavy text-bodyLg text-ink" style={{ backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: accent }} />
          <Pressable accessibilityRole="button" disabled={!input.trim()} onPress={() => onAnswer(isTypedCorrect(input, question?.word.word ?? ''))} className="rounded-2xl px-5 py-3" style={{ backgroundColor: !input.trim() ? '#C7C1B6' : accent }}><Text className="font-heavy text-bodyLg" style={{ color: '#231B32' }}>{L('NẠP PHÔI ✨', 'CHARGE BLANK ✨')}</Text></Pressable>
        </View>
      ) : (
        <View className="mt-4 flex-row flex-wrap gap-3">
          {question?.options.map((option: string, index: number) => <Pressable key={`${question.word.word}-${index}`} accessibilityRole="button" onPress={() => onAnswer(index === question.correctIndex)} className="rounded-2xl p-4" style={{ flexGrow: 1, flexBasis: '47%', minWidth: 205, backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#E5DDD0' }}><Text className="font-heavy text-bodyLg" style={{ color: '#342945' }}>{String.fromCharCode(65 + index)}　{option}</Text></Pressable>)}
        </View>
      )}
      <Text className="mt-3 font-semi text-label" style={{ color: '#847B7E' }}>{mode === 'dino' ? L('Câu đúng mở lượt đào; bạn tự chọn ô nào đáng thử.', 'A correct answer unlocks a dig; you decide which tile to try.') : mode === 'forge' ? L('Gõ đúng sẽ mở màn canh nhịp đập búa. Lệch nhịp làm lò mất nhiệt.', 'Spell correctly to start the hammer timing. Misspellings cool the furnace.') : L('Câu đúng gây sát thương; nước đi quyết định đòn đánh và cách đỡ phản công.', 'A correct answer deals damage; your move decides the strike and counter defense.')}</Text>
    </View>
  );
}

function ActionCard({ move, active, locked, accent, onPress, en }: { move: (typeof ACTIONS)[number]; active: boolean; locked: boolean; accent: string; onPress: () => void; en: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ selected: active, disabled: locked }} disabled={locked} onPress={onPress} className="flex-1 rounded-2xl px-3 py-3" style={{ minWidth: 150, backgroundColor: active ? '#342845' : locked ? '#E4DDD2' : '#FFFFFF', borderWidth: 2, borderColor: active ? accent : '#E6DED1', opacity: locked ? 0.55 : 1 }}><Text className="font-heavy text-body" style={{ color: active ? '#FFFFFF' : '#342945' }}>{move.icon}　{en ? move.labelEn : move.label}</Text><Text className="mt-1 font-semi text-label" style={{ color: active ? '#D9D4E5' : '#746E79' }}>{en ? move.hintEn : move.hint}{move.cost ? ` · ${move.cost}⚡` : ''}</Text></Pressable>;
}

function DigTileButton({ tile, scanned, onPress, en }: { tile: DigTile; scanned: boolean; onPress: () => void; en: boolean }) {
  const { L } = useL();
  const face = tile.opened ? ({ bone: '🦴', amber: '🟠', charge: '🔷', trap: '🪨', dust: '·' } as const)[tile.kind] : scanned ? '📡' : '⛏️';
  const description = tile.opened ? ({ bone: L('mảnh xương', 'fossil'), amber: L('hổ phách', 'amber'), charge: L('tinh thể', 'crystal'), trap: L('bẫy đá', 'rock trap'), dust: L('đất mềm', 'soft soil') } as const)[tile.kind] : scanned ? L('có tín hiệu', 'signal detected') : L('ô đất chưa đào', 'undug tile');
  return <Pressable accessibilityRole="button" accessibilityLabel={`${L('Ô', 'Tile')} ${tile.id + 1}: ${description}`} accessibilityState={{ disabled: tile.opened }} disabled={tile.opened} onPress={onPress} className="items-center justify-center rounded-[16px]" style={{ width: '22.5%', minWidth: 58, height: 72, backgroundColor: tile.opened ? tile.kind === 'trap' ? '#E9C8B4' : '#E3D6B9' : scanned ? '#D3E9C6' : '#8E704A', borderWidth: scanned ? 3 : 1, borderColor: scanned ? '#4A8C62' : tile.opened ? '#C6B897' : '#634D35', transform: [{ translateY: tile.opened ? 2 : 0 }] }}><Text style={{ fontSize: tile.opened ? 25 : 21 }}>{face}</Text><Text className="mt-1 font-heavy" style={{ fontSize: 10, color: tile.opened ? '#43382B' : '#FFF5D8' }}>{tile.opened ? (en ? 'FOUND' : 'ĐÃ ĐÀO') : `${String(tile.id + 1).padStart(2, '0')} · ${en ? 'DIG' : 'ĐÀO'}`}</Text></Pressable>;
}

function FeedbackCard({ outcome, mode, accent, finish, onContinue, L }: { outcome: Outcome; mode: Mode; accent: string; finish: boolean; onContinue: () => void; L: (vi: string, en: string) => string }) {
  return <View className="mt-4 rounded-[22px] p-5" style={{ backgroundColor: outcome.correct ? '#21483C' : '#523249', borderWidth: 2, borderColor: outcome.correct ? '#82D9A9' : '#D58BA1' }}><Text className="font-heavy text-sectionTitle" style={{ color: outcome.correct ? '#9EF0C8' : '#FFC1D2' }}>{outcome.correct ? L('CHÍNH XÁC!', 'NICE MOVE!') : L('CHƯA ĐÚNG', 'NOT QUITE')}</Text><Text className="mt-1 font-semi text-body" style={{ color: '#2A1808' }}>{outcome.detail}</Text>{!outcome.correct ? <Text className="mt-1 font-semi text-body" style={{ color: '#2A1808' }}>{L('Đáp án:', 'Answer:')} {outcome.answer}</Text> : null}<Pressable accessibilityRole="button" onPress={onContinue} className="mt-4 self-start rounded-pill px-5 py-3" style={{ backgroundColor: accent }}><Text className="font-heavy text-body" style={{ color: '#231B32' }}>{finish ? L('Xem kết quả', 'See results') : mode === 'dino' ? L('Lượt đào tiếp theo →', 'Next dig →') : mode === 'forge' ? L('Rèn tiếp →', 'Forge next →') : L('Đối đầu tiếp →', 'Next encounter →')}</Text></Pressable></View>;
}

function UpgradeCard({ icon, title, detail, onPress }: { icon: string; title: string; detail: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onPress} className="flex-1 rounded-[20px] p-4" style={{ minWidth: 190, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DED3C4' }}><Text style={{ fontSize: 30 }}>{icon}</Text><Text className="mt-2 font-heavy text-bodyLg text-ink">{title}</Text><Text className="mt-1 font-semi text-body text-muted">{detail}</Text><Text className="mt-3 font-heavy text-label" style={{ color: '#8A5E15' }}>{'CHỌN NÂNG CẤP　→'}</Text></Pressable>;
}

function InfoPill({ label, icon, color, ink = '#342945' }: { label: string; icon: string; color: string; ink?: string }) {
  return <View className="flex-row items-center gap-2 rounded-pill px-3 py-2" style={{ backgroundColor: color }}>{icon ? <Text>{icon}</Text> : null}<Text className="font-heavy text-label" style={{ color: ink }}>{label}</Text></View>;
}

function ResultStat({ label, value }: { label: string; value: string }) {
  return <View className="rounded-2xl px-4 py-3" style={{ minWidth: 120, backgroundColor: '#FFFFFF' }}><Text className="font-semi text-label text-muted">{label}</Text><Text className="font-heavy text-bodyLg text-ink">{value}</Text></View>;
}
