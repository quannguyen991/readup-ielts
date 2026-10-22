import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Platform, Pressable, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';

import { BeatPanel, PanelButton } from './BeatPanels';
import { getCityMap, getFallbackMap } from '@/components/travel/cityData';
import { CityCanvas, type CityCanvasHandle } from '@/components/travel/scenes/CityCanvas';
import type { MissionLayout, MissionNpcDef } from '@/components/travel/engine/CityEngine';
import { POS_UNSET } from '@/services/travel/sync';
import { CITIES } from '@/services/travel/world';
import type { CityId } from '@/services/travel/types';
import { T } from '@/components/travel/ui/kit';
import { useReducedMotion } from '@/components/travel/ui/hooks';
import { PERSONA_SPRITE, STAGE_MISUNDERSTOOD, STAGE_SPECS, checkBeat, type Beat, type BeatInput } from '@/data/study-abroad-stage';
import type { StudyAbroadMission } from '@/data/study-abroad-campaign';
import { bi, useL } from '@/i18n/useL';
import { pronounce, stopPronounce } from '@/services/audio/pronounce';
import { playSfx } from '@/services/audio/sfx-ui';
import { startRecorder, transcriptOf, type Recorder } from '@/services/speaking/recognizer';
import type { TravelConversationTurn } from '@/services/travel/conversation';
import { useAuthStore } from '@/store/useAuthStore';
import { useTravelStore } from '@/store/useTravelStore';

const GLASS = 'rgba(7,11,24,0.66)';
const noop = () => {};

type Phase = 'intro' | 'walk' | 'zoom' | 'ask' | 'react' | 'done' | 'chat';
type Speaker = 'npc' | 'you';
type Line = { who: Speaker; en: string; vi: string; hidden?: boolean };

function useTypewriter(text: string, enabled: boolean) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!enabled) {
      setN(text.length);
      return;
    }
    setN(0);
    const id = setInterval(() => setN((v) => (v >= text.length ? (clearInterval(id), v) : v + 1)), 22);
    return () => clearInterval(id);
  }, [text, enabled]);
  return { shown: text.slice(0, n), done: n >= text.length, skip: () => setN(text.length) };
}

const CITY_OF_SPOT = (spot: string): CityId => spot.split('-')[0] as CityId;

/** Nhiệm vụ → danh sách lượt: lượt mở đầu (trắc nghiệm gốc) + các lượt hành động. */
function beatsOf(mission: StudyAbroadMission): Beat[] {
  const spec = STAGE_SPECS[mission.id]!;
  const opening: Beat = {
    kind: 'choice',
    spot: spec.spot,
    say: { en: mission.line, vi: '' },
    prompt: { vi: mission.prompt, en: mission.promptEn },
    hint: { vi: mission.hintVi, en: mission.hintEn },
    options: mission.options,
    answer: mission.answer,
    reaction: spec.reaction,
  };
  return [opening, ...spec.beats];
}

export function MissionStage({
  mission,
  alreadyDone,
  onSolved,
  onClose,
  onNext,
}: {
  mission: StudyAbroadMission;
  alreadyDone: boolean;
  /** Gọi đúng một lần khi hoàn thành mọi lượt lần đầu; trả về XP thật đã cộng. */
  onSolved: (missionId: string) => number;
  onClose: () => void;
  onNext?: () => void;
}) {
  const { L, locale } = useL();
  const { width: W, height: H } = useWindowDimensions();
  const still = useReducedMotion();
  const spec = STAGE_SPECS[mission.id]!;
  const beats = useMemo(() => beatsOf(mission), [mission]);
  const city = CITY_OF_SPOT(spec.spot);
  const outfit = useTravelStore((s) => s.prefs.outfit);
  const playerName = useTravelStore((s) => s.prefs.name);
  const accessToken = useAuthStore((s) => s.session?.access_token ?? null);
  const travelStore = useTravelStore();
  const cityMap = useMemo(() => getCityMap(city), [city]);
  // Người chơi luôn xuất hiện ở điểm xuất phát của thành phố này (không ghi đè vị trí đã lưu của bản đồ Du ngoạn).
  const cityState = useMemo(() => ({ ...travelStore, city, pos: { ...POS_UNSET } }), [travelStore.prefs, travelStore.coins, travelStore.tickets, city]); // eslint-disable-line react-hooks/exhaustive-deps

  // NPC của từng lượt: cùng chỗ + cùng người thì dùng lại một nhân vật; khác thì thêm nhân vật mới (người cũ vẫn đứng đó).
  const { npcs, npcOf } = useMemo(() => {
    const list: MissionNpcDef[] = [];
    const idOf: string[] = [];
    let cur: { id: string; spot: string; who: string } | null = null;
    beats.forEach((b, i) => {
      const spot = b.spot ?? cur?.spot ?? spec.spot;
      const who = b.who?.name ?? mission.npc.en;
      if (!cur || cur.spot !== spot || cur.who !== who) {
        const id = `n${i}`;
        list.push({ id, poi: spot, sprite: PERSONA_SPRITE[b.who?.persona ?? spec.persona], name: who });
        cur = { id, spot, who };
      }
      idOf.push(cur.id);
    });
    return { npcs: list, npcOf: idOf };
  }, [beats, mission.npc.en, spec.persona, spec.spot]);
  const nameOf = (id: string) => npcs.find((n) => n.id === id)?.name ?? mission.npc.en;

  const handle = useRef<CityCanvasHandle | null>(null);
  const [phase, setPhase] = useState<Phase>('intro');
  const [idx, setIdx] = useState(0);
  const [near, setNear] = useState(false);
  const [layout, setLayout] = useState<MissionLayout | null>(null);
  const [zoomed, setZoomed] = useState(false);
  const [line, setLine] = useState<Line>({ who: 'npc', en: '', vi: '' });
  const [wrong, setWrong] = useState(0);
  const [panelKey, setPanelKey] = useState(0);
  const [xp, setXp] = useState(0);
  const [history, setHistory] = useState<TravelConversationTurn[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [listening, setListening] = useState(false);
  const [note, setNote] = useState('');
  const alive = useRef(true);
  const recorder = useRef<Recorder | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const later = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(() => alive.current && fn(), ms);
    timers.current.push(id);
  }, []);

  const beat = beats[idx]!;
  const goalId = npcOf[idx]!;
  const talkId = phase === 'zoom' || phase === 'ask' || phase === 'react' || phase === 'done' || phase === 'chat' ? goalId : null;

  const say = useCallback((who: Speaker, en: string, vi = '', hidden = false) => {
    setLine({ who, en, vi, hidden });
    void pronounce(en, { rate: who === 'npc' ? 0.9 : 0.95 });
  }, []);

  useEffect(() => {
    alive.current = true;
    playSfx('modalOpen');
    later(() => setPhase('walk'), still ? 0 : 2000);
    return () => {
      alive.current = false;
      stopPronounce();
      recorder.current?.stop();
      for (const id of timers.current) clearTimeout(id);
    };
  }, [later, still]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Đến cạnh NPC mục tiêu → bắt đầu nói chuyện (camera khung hai người, rồi phóng to).
  const onArrive = useCallback((id: string) => {
    if (id !== npcOf[idx]) return;
    setPhase('zoom');
    setLayout(null);
    setZoomed(false);
  }, [idx, npcOf]);

  const onLayout = useCallback((l: MissionLayout) => {
    setLayout(l);
    setZoomed(true);
    later(() => {
      setPhase('ask');
      const b = beats[idx]!;
      say('npc', b.say.en, b.say.vi, b.kind === 'listen');
    }, still ? 0 : 1100);
  }, [beats, idx, later, say, still]);

  const startTalk = () => {
    // Đã đứng gần mà chưa bắt đầu: bấm "Nói chuyện" → tự bước vào đúng chỗ rồi nói.
    setPhase('zoom');
    setLayout(null);
    setZoomed(false);
    handle.current?.missionWalkTo(goalId);
  };

  const submit = (input: BeatInput) => {
    if (phase !== 'ask') return;
    const ok = checkBeat(beat, input);
    // Câu của bạn hiện trên đầu bạn và được đọc to.
    let said = '';
    if (beat.kind === 'choice' || beat.kind === 'listen') said = beat.options[input as number] ?? '';
    else if (beat.kind === 'give') {
      const item = beat.items[input as number];
      said = item ? `${item.icon} ${item.label.en}` : '';
    } else if (beat.kind === 'arrange') said = (input as readonly string[]).join(' ');
    else if (beat.kind === 'type') said = `${beat.before}${String(input).trim()}${beat.after}`.trim();
    else if (beat.kind === 'speak') said = String(input).trim();
    setLine({ who: 'you', en: said, vi: '' });
    if (beat.kind !== 'give') void pronounce(said, { rate: 0.95 });
    setPhase('react');
    later(() => {
      if (!ok) {
        playSfx('wrong');
        setWrong((n) => n + 1);
        say('npc', STAGE_MISUNDERSTOOD.en, STAGE_MISUNDERSTOOD.vi);
        later(() => {
          setPanelKey((k) => k + 1);
          setPhase('ask');
        }, 1800);
        return;
      }
      playSfx('good');
      setWrong(0);
      say('npc', beat.reaction.en, beat.reaction.vi);
      later(() => {
        if (idx >= beats.length - 1) {
          if (!alreadyDone) setXp(onSolved(mission.id));
          setPhase('done');
          return;
        }
        // Lượt kế tiếp: cùng NPC thì nói tiếp ngay; khác chỗ/người thì thu cảnh lại và đi bộ tới.
        const next = idx + 1;
        const nb = beats[next]!;
        setIdx(next);
        setNear(false);
        setPanelKey((k) => k + 1);
        if (npcOf[next] === npcOf[idx]) {
          setPhase('ask');
          say('npc', nb.say.en, nb.say.vi, nb.kind === 'listen');
        } else {
          setZoomed(false);
          setLayout(null);
          setPhase('walk');
          later(() => handle.current?.missionWalkTo(npcOf[next]!), still ? 0 : 700);
        }
      }, 2300);
    }, 1700);
  };

  // ---------------- hỏi thêm nhân vật bằng AI ----------------
  const sendChat = useCallback(async (raw = draft) => {
    const text = raw.trim().slice(0, 600);
    if (!text || sending) return;
    if (!accessToken) {
      setNote(L('Hãy đăng nhập để hỏi thêm nhân vật.', 'Sign in to ask the character more.'));
      return;
    }
    const next: TravelConversationTurn[] = [...history, { role: 'user' as const, content: text }].slice(-12);
    setHistory(next);
    setDraft('');
    setNote('');
    setSending(true);
    setLine({ who: 'you', en: text, vi: '' });
    try {
      const res = await fetch('/api/travel/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ cityId: city, npcId: `abroad-${mission.id}`, persona: spec.persona, history: next }),
      });
      const data = (await res.json()) as { replyEn?: unknown; replyVi?: unknown; error?: unknown };
      if (!res.ok || typeof data.replyEn !== 'string') throw new Error(typeof data.error === 'string' ? data.error : '');
      if (!alive.current) return;
      setHistory((h) => [...h, { role: 'assistant' as const, content: data.replyEn as string }].slice(-12));
      say('npc', data.replyEn, typeof data.replyVi === 'string' ? data.replyVi : '');
    } catch (e) {
      if (alive.current) setNote((e as Error).message || L('Nhân vật chưa trả lời được lúc này. Thử lại nhé.', 'The character cannot reply right now. Please try again.'));
    } finally {
      if (alive.current) setSending(false);
    }
  }, [accessToken, city, draft, history, L, mission.id, say, sending, spec.persona]);

  const toggleMic = () => {
    if (listening) {
      recorder.current?.stop();
      recorder.current = null;
      setListening(false);
      return;
    }
    const r = startRecorder({
      onUpdate: (s) => alive.current && setDraft(transcriptOf(s)),
      onEnd: (reason, s) => {
        recorder.current = null;
        if (!alive.current) return;
        setListening(false);
        setDraft(transcriptOf(s));
        if (reason === 'denied') setNote(L('Bạn chưa cấp quyền micro — hãy gõ câu hỏi.', 'Microphone access was denied — type your message instead.'));
      },
    });
    if (!r) {
      setNote(L('Trình duyệt này chưa hỗ trợ nhập giọng nói — hãy gõ câu hỏi.', 'Voice input is unavailable here — type your message instead.'));
      return;
    }
    recorder.current = r;
    setListening(true);
  };

  // ---------------- hình học bong bóng thoại (sau khi phóng to) ----------------
  const ZOOM = layout && layout.k < 3 ? 1.7 : 1.5;
  const feetTarget = H * 0.54;
  const zoomProp = layout && zoomed
    ? (() => {
        const ox = (layout.you.x + layout.npc.x) / 2;
        const oy = (layout.you.y + layout.npc.y) / 2;
        return { scale: ZOOM, ox, oy, ty: feetTarget - oy };
      })()
    : undefined;
  const pos = (p: { x: number; y: number; top: number } | null) =>
    p && zoomProp
      ? { x: zoomProp.ox + (p.x - zoomProp.ox) * ZOOM, y: zoomProp.oy + (p.y - zoomProp.oy) * ZOOM + zoomProp.ty, top: zoomProp.oy + (p.top - zoomProp.oy) * ZOOM + zoomProp.ty }
      : null;
  const youP = pos(layout?.you ?? null);
  const npcP = pos(layout?.npc ?? null);
  const speaker = line.who === 'npc' ? npcP : youP;
  const bubbleW = Math.min(520, W - 24);
  const labelUp = 34;
  const bubbleLeft = speaker ? Math.min(W - bubbleW - 12, Math.max(12, speaker.x - bubbleW / 2)) : 12;
  const bubbleBottom = speaker ? H - (speaker.top - labelUp) : H;
  const bubbleMaxH = speaker ? Math.max(110, speaker.top - labelUp - 64) : 200;
  const tail = speaker ? Math.min(bubbleW - 28, Math.max(14, speaker.x - bubbleLeft - 9)) : 20;
  const showBubble = zoomed && phase !== 'walk' && phase !== 'intro' && !!line.en;
  const hiddenLine = line.who === 'npc' && !!line.hidden && phase === 'ask';
  const type = useTypewriter(line.en, line.who === 'npc' && showBubble && !still && !hiddenLine);
  const npcTalking = line.who === 'npc' && showBubble && !type.done && !hiddenLine;

  const goalName = nameOf(goalId);
  const cityTitle = CITIES[city].name;
  const walking = phase === 'walk';
  const panelOpen = phase === 'ask' && zoomed;
  const dots = beats.length;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#070B18', overflow: 'hidden' }}>
        {/* Bản đồ Du ngoạn thật (engine 2D): phóng to bằng CSS quanh hai nhân vật khi nói chuyện */}
        {cityMap ? (
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                transformOrigin: zoomProp ? `${zoomProp.ox}px ${zoomProp.oy}px` : '50% 50%',
                transform: zoomProp ? `translateY(${zoomProp.ty}px) scale(${zoomProp.scale})` : 'none',
                transition: still ? 'none' : 'transform 1.1s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
              }}
            >
              <CityCanvas
                map={cityMap}
                fallbackMap={getFallbackMap(city)}
                state={cityState as never}
                onEnterPoi={noop}
                onMove={noop}
                reducedMotion={still}
                handleRef={handle}
                hideFullscreenButton
                missionNpcs={npcs}
                missionGoal={walking || phase === 'intro' ? goalId : null}
                missionTalk={talkId}
                onMissionArrive={onArrive}
                onMissionNear={(id) => setNear(id === goalId)}
                onMissionLayout={onLayout}
              />
            </div>
          </View>
        ) : null}

        {/* Thẻ tên thành phố lúc vào cảnh */}
        {phase === 'intro' ? (
          <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: H * 0.3, alignItems: 'center' }}>
            <View style={{ backgroundColor: GLASS, borderRadius: 14, paddingHorizontal: 28, paddingVertical: 16, alignItems: 'center', gap: 4 }}>
              <Text className="font-heavy" style={{ color: '#FFD34D', fontSize: 30 }}>{bi(cityTitle, locale)}</Text>
              <Text className="font-semi" style={{ color: '#E6EBF5', fontSize: 15 }}>{bi(mission.place, locale)}</Text>
            </View>
          </View>
        ) : null}

        {/* Bong bóng thoại ngay trên cảnh phố */}
        {showBubble && speaker ? (
          <Pressable onPress={type.skip} accessibilityRole="text" accessibilityLiveRegion="polite" style={{ position: 'absolute', left: bubbleLeft, bottom: bubbleBottom, width: bubbleW, maxHeight: bubbleMaxH }}>
            <View style={{ backgroundColor: line.who === 'npc' ? '#F3F0FB' : '#DDEBFF', borderWidth: 3, borderColor: T.navy, borderRadius: 4, paddingHorizontal: 14, paddingVertical: 11, gap: 4, ...(Platform.OS === 'web' ? ({ boxShadow: `0 4px 0 ${T.navy}` } as object) : null) }}>
              <Text className="font-heavy" style={{ fontSize: 11, letterSpacing: 1, color: T.goldDark }}>{(line.who === 'npc' ? goalName : playerName || L('Bạn', 'You')).toUpperCase()}</Text>
              {hiddenLine ? (
                <Text className="font-semi" style={{ fontSize: 17, lineHeight: 24, color: T.ink }}>🎧 {L('Hãy lắng nghe…', 'Listen carefully…')}</Text>
              ) : (
                <Text className="font-semi" style={{ fontSize: 18, lineHeight: 25, color: T.ink }}>{type.shown}<Text style={{ opacity: type.done ? 0 : 0.5 }}>▌</Text></Text>
              )}
              {!hiddenLine && type.done && line.vi && locale === 'vi' ? <Text className="font-sans" style={{ fontSize: 14, lineHeight: 20, color: T.muted }}>{line.vi}</Text> : null}
              {line.who === 'npc' && (type.done || hiddenLine) ? (
                <Pressable accessibilityRole="button" accessibilityLabel={L('Nghe lại', 'Hear again')} onPress={() => void pronounce(line.en, { rate: 0.9 })} style={{ alignSelf: 'flex-start', minHeight: 32, justifyContent: 'center' }}>
                  <Text className="font-strong" style={{ fontSize: 13, color: T.goldDark }}>🔊 {L('Nghe lại', 'Hear again')}</Text>
                </Pressable>
              ) : null}
            </View>
            <View pointerEvents="none" style={{ marginLeft: tail, width: 0, height: 0, borderLeftWidth: 9, borderRightWidth: 9, borderTopWidth: 12, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: T.navy }} />
          </Pressable>
        ) : null}

        {/* Thanh trên */}
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, gap: 10 }} pointerEvents="box-none">
          <View style={{ backgroundColor: GLASS, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7, maxWidth: W - 130 }}>
            <Text className="font-heavy" numberOfLines={1} style={{ color: '#FFFFFF', fontSize: 15 }}>{bi(mission.place, locale)}</Text>
            <Text className="font-sans" numberOfLines={1} style={{ color: '#D7DDE7', fontSize: 12 }}>
              {bi(cityTitle, locale)} · {L(`Lượt ${Math.min(idx + 1, dots)}/${dots}`, `Step ${Math.min(idx + 1, dots)}/${dots}`)}
            </Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={L('Rời cảnh, về bản đồ', 'Leave the scene')} onPress={onClose} style={{ minHeight: 44, minWidth: 44, paddingHorizontal: 14, borderRadius: 10, backgroundColor: GLASS, alignItems: 'center', justifyContent: 'center' }}>
            <Text className="font-strong" style={{ color: '#FFFFFF', fontSize: 14 }}>✕ {L('Rời cảnh', 'Leave')}</Text>
          </Pressable>
        </View>

        {/* Nền tối dần ở đáy để bảng hành động đọc rõ trên bản đồ */}
        {zoomed || walking ? (
          <View pointerEvents="none" style={[{ position: 'absolute', left: 0, right: 0, bottom: 0, height: H * 0.55 }, Platform.OS === 'web' ? ({ backgroundImage: 'linear-gradient(to top, rgba(7,11,24,0.92), rgba(7,11,24,0.7) 45%, rgba(7,11,24,0))' } as object) : { backgroundColor: 'rgba(7,11,24,0.5)' }]} />
        ) : null}

        {/* Đang đi bộ: mục tiêu + điều khiển */}
        {walking ? (
          <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 12, gap: 10, alignItems: 'center' }}>
            <View style={{ width: '100%', maxWidth: 560, backgroundColor: GLASS, borderRadius: 12, padding: 12, gap: 8 }}>
              <Text className="font-heavy" style={{ color: '#FFD34D', fontSize: 13, letterSpacing: 1 }}>{L('NHIỆM VỤ', 'MISSION')}</Text>
              <Text className="font-semi" style={{ color: '#FFFFFF', fontSize: 15, lineHeight: 21 }}>
                {L(`Nói chuyện với ${goalName} (${bi(mission.role, locale)}).`, `Talk to ${goalName} (${bi(mission.role, locale)}).`)}
              </Text>
              <Text className="font-sans" style={{ color: '#C9D1E0', fontSize: 12 }}>{L('Chạm vào bản đồ để đi, hoặc dùng phím WASD / mũi tên, hoặc các nút bên dưới. Chạm vào nhân vật có mũi tên vàng để tới nói chuyện.', 'Tap the map to walk, use WASD / arrow keys, or the pad below. Tap the character with the yellow arrow to talk.')}</Text>
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                <DPad onDir={(d) => handle.current?.setStick(d ? [d] : [])} />
                <View style={{ flex: 1 }} />
                {near ? <PanelButton gold label={L('💬 Nói chuyện', '💬 Talk')} onPress={startTalk} /> : <PanelButton gold label={L('Đi tới đó ›', 'Take me there ›')} onPress={() => handle.current?.missionWalkTo(goalId)} />}
              </View>
            </View>
          </View>
        ) : null}

        {/* Đáy cảnh: hành động / kết quả / hỏi thêm */}
        <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center', padding: 12 }}>
          <View style={{ width: '100%', maxWidth: 720, gap: 8 }}>
            {panelOpen ? <BeatPanel key={`${idx}-${panelKey}`} beat={beat} disabled={false} onSubmit={submit} onReplay={() => void pronounce(beat.say.en, { rate: 0.85 })} /> : null}
            {phase === 'react' && wrong > 0 ? <Text className="font-sans" style={{ color: '#FFD0C7', fontSize: 13 }}>{L(`Chưa đúng — thử lại nhé (lần ${wrong}).`, `Not quite — try again (try ${wrong}).`)}</Text> : null}

            {phase === 'done' ? (
              <View style={{ gap: 8 }}>
                <View style={{ backgroundColor: GLASS, borderRadius: 10, padding: 11, gap: 3 }}>
                  <Text className="font-heavy" style={{ color: '#FFD34D', fontSize: 15 }}>
                    {alreadyDone && !xp ? L('Hoàn thành', 'Completed') : L(`Hoàn thành${xp ? ` · +${xp} XP` : ''}`, `Completed${xp ? ` · +${xp} XP` : ''}`)} · {mission.target}
                  </Text>
                  <Text className="font-sans" style={{ color: '#E6EBF5', fontSize: 13, lineHeight: 19 }}>{mission.explanationVi}</Text>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  <PanelButton label={L('💬 Hỏi thêm nhân vật', '💬 Ask more')} onPress={() => { setPhase('chat'); setNote(''); }} />
                  {onNext ? <PanelButton gold label={L('Nhiệm vụ tiếp theo ›', 'Next mission ›')} onPress={onNext} /> : null}
                  <PanelButton label={L('Về bản đồ', 'Back to the map')} onPress={onClose} />
                  <PanelButton label={L('Khám phá thành phố', 'Explore the city')} onPress={() => { onClose(); router.push(`/quest/du-ngoan/${city}` as never); }} />
                </View>
              </View>
            ) : null}

            {phase === 'chat' ? (
              <View style={{ gap: 8 }}>
                {!history.length ? (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {spec.starters.map((s) => (
                      <Pressable key={s.en} accessibilityRole="button" onPress={() => void sendChat(s.en)} disabled={sending} style={{ paddingHorizontal: 12, paddingVertical: 9, borderRadius: 999, backgroundColor: 'rgba(251,247,236,0.96)', borderWidth: 2, borderColor: T.navy }}>
                        <Text className="font-semi" style={{ color: T.ink, fontSize: 14 }}>{s.en}</Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
                {note ? (
                  <View style={{ backgroundColor: GLASS, borderRadius: 10, padding: 10, gap: 6 }}>
                    <Text accessibilityLiveRegion="polite" className="font-sans" style={{ color: '#FFD0C7', fontSize: 13, lineHeight: 18 }}>{note}</Text>
                    {!accessToken ? <PanelButton gold label={L('Đăng nhập', 'Sign in')} onPress={() => { onClose(); router.push('/auth/sign-in' as never); }} /> : null}
                  </View>
                ) : null}
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
                  <TextInput
                    value={draft}
                    onChangeText={setDraft}
                    editable={!sending}
                    maxLength={600}
                    onSubmitEditing={() => void sendChat()}
                    returnKeyType="send"
                    placeholder={sending ? L('Nhân vật đang nghĩ…', 'Thinking…') : L('Hỏi bằng tiếng Anh…', 'Ask in English…')}
                    placeholderTextColor="#89867F"
                    accessibilityLabel={L('Câu hỏi cho nhân vật', 'Your message to the character')}
                    style={{ flex: 1, minHeight: 48, maxHeight: 96, borderWidth: 2, borderColor: T.navy, borderRadius: 8, backgroundColor: '#FFFFFF', paddingHorizontal: 12, paddingVertical: 9, fontSize: 15, color: T.ink }}
                  />
                  {Platform.OS === 'web' ? <PanelButton label={listening ? '■' : '🎤'} onPress={toggleMic} disabled={sending} /> : null}
                  <PanelButton gold label={L('Gửi', 'Send')} onPress={() => void sendChat()} disabled={sending || listening || !draft.trim()} />
                </View>
                <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                  {onNext ? <PanelButton label={L('Nhiệm vụ tiếp theo ›', 'Next mission ›')} onPress={onNext} /> : null}
                  <PanelButton label={L('Về bản đồ', 'Back to the map')} onPress={onClose} />
                </View>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
}

/** Phím điều hướng 4 chiều trên màn hình (cảm ứng): đè = đi, nhả = dừng. */
function DPad({ onDir }: { onDir: (d: 'up' | 'down' | 'left' | 'right' | null) => void }) {
  const btn = (label: string, d: 'up' | 'down' | 'left' | 'right') => (
    <Pressable
      key={d}
      accessibilityRole="button"
      accessibilityLabel={`Walk ${d}`}
      onPressIn={() => onDir(d)}
      onPressOut={() => onDir(null)}
      style={{ width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(251,247,236,0.96)', borderWidth: 2, borderColor: T.navy }}
    >
      <Text className="font-heavy" style={{ color: T.ink, fontSize: 18 }}>{label}</Text>
    </Pressable>
  );
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {btn('◀', 'left')}
      <View style={{ gap: 6 }}>
        {btn('▲', 'up')}
        {btn('▼', 'down')}
      </View>
      {btn('▶', 'right')}
    </View>
  );
}
