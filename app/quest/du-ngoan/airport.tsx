import React, { useCallback, useMemo, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { recordAnswer, seenKeys } from '@/components/travel/record';
import { useFocusDecks, useStudiedDecks, useStudySnapshot, useTravelReady } from '@/components/travel/useTravel';
import { Eyebrow, GameButton, PixelPanel, T, TicketGlyph } from '@/components/travel/ui/kit';
import { QuestionRunner, type RunResult } from '@/components/travel/ui/QuestionRunner';
import { PixelStage, cssAnim } from '@/components/travel/ui/PixelStage';
import { useReducedMotion } from '@/components/travel/ui/hooks';
import { TravelPage } from '@/components/travel/ui/TravelPage';
import { useL } from '@/i18n/useL';
import { TRAVEL_ECONOMY, rolloverCaps } from '@/services/travel/economy';
import { pickCustomsQuestions, pickReviewQuestions } from '@/services/travel/pick';
import type { VisitQuestion } from '@/services/travel/content';
import { todayKey } from '@/store/persist';
import { useStarBalance } from '@/store/useStarBalance';
import { useTravelStore } from '@/store/useTravelStore';
import { TravelConversation } from '@/components/travel/immersive/TravelConversation';

/**
 * /quest/du-ngoan/airport — Quầy đổi vé của sân bay Nội Bài: bài hải quan (5 câu,
 * đúng 4 được 1 vé), ôn từ đến hạn (10 từ = 1 vé), đổi sao lấy vé, sổ vé.
 */
type Mode = { kind: 'customs' | 'review'; questions: VisitQuestion[] } | null;
type Outcome = { kind: 'customs' | 'review'; correct: number; total: number; tickets: number; reason?: string } | null;

export default function AirportRoute() {
  const ready = useTravelReady();
  const { L } = useL();
  const title = L('Quầy đổi vé', 'Ticket counter');
  if (!ready) return <TravelPage title={title} back="/quest/du-ngoan" hud={false}>{null}</TravelPage>;
  return <Airport />;
}

function Airport() {
  const { L } = useL();
  const caps = useTravelStore((s) => s.dailyCaps);
  const seen = useTravelStore((s) => s.seen);
  const ledger = useTravelStore((s) => s.ledger);
  const earnCustoms = useTravelStore((s) => s.earnCustoms);
  const earnReview = useTravelStore((s) => s.earnReview);
  const exchange = useTravelStore((s) => s.exchange);
  const markSeen = useTravelStore((s) => s.markSeen);
  const city = useTravelStore((s) => s.city);
  const stars = useStarBalance();
  const reduced = useReducedMotion();
  const snap = useStudySnapshot();
  const studied = useStudiedDecks();
  const focus = useFocusDecks();
  const [mode, setMode] = useState<Mode>(null);
  const [outcome, setOutcome] = useState<Outcome>(null);
  const [swap, setSwap] = useState<string | null>(null);
  const [ask, setAsk] = useState(false);
  const [talkToStaff, setTalkToStaff] = useState(false);

  const day = todayKey();
  const today = rolloverCaps(caps, day);
  const runsLeft = Math.max(0, TRAVEL_ECONOMY.customs.runsPerDay - today.custom);
  const reviewLeft = Math.max(0, TRAVEL_ECONOMY.review.ticketsPerDay - today.review);
  const swapsLeft = Math.max(0, TRAVEL_ECONOMY.stars.ticketsPerDay - today.stars);
  const dueCount = useMemo(() => Object.values(snap.due).reduce((n, w) => n + w.length, 0), [snap.due]);

  const startCustoms = useCallback(() => {
    const qs = pickCustomsQuestions({ ...snap, studiedDecks: studied, focusDecks: focus.decks, day, run: today.custom + 1, seen, nowMs: Date.now() });
    setOutcome(null);
    setMode({ kind: 'customs', questions: qs });
  }, [snap, studied, focus.decks, day, today.custom, seen]);

  const startReview = useCallback(() => {
    const qs = pickReviewQuestions({ ...snap, day, run: today.reviewWords ?? 0, seen, nowMs: Date.now() });
    if (!qs.length) return;
    setOutcome(null);
    setMode({ kind: 'review', questions: qs });
  }, [snap, day, today.reviewWords, seen]);

  const onFinish = useCallback(
    (r: RunResult) => {
      if (!mode) return;
      markSeen(seenKeys(mode.questions));
      const res = mode.kind === 'customs' ? earnCustoms(r.correct, r.total) : earnReview(r.correct);
      setOutcome({ kind: mode.kind, correct: r.correct, total: r.total, tickets: res.tickets, reason: res.reason });
      setMode(null);
    },
    [mode, earnCustoms, earnReview, markSeen],
  );

  const doExchange = () => {
    const r = exchange(stars);
    setSwap(
      r.ok
        ? L('Đã đổi 150 sao lấy 1 vé.', 'Swapped 150 stars for 1 ticket.')
        : r.reason === 'cap'
          ? L('Hôm nay bạn đã đổi đủ 3 vé.', "You've used today's 3 swaps.")
          : L('Chưa đủ sao.', 'Not enough stars.'),
    );
  };

  const regions = [
    { id: 'counter', x: 185, y: 130, vi: 'Quầy đổi sao', en: 'Star counter', run: () => setAsk(true) },
    { id: 'customs', x: 258, y: 128, vi: 'Hải quan', en: 'Customs', run: () => runsLeft > 0 && startCustoms() },
    { id: 'gate', x: 350, y: 75, vi: 'Ra cổng bay', en: 'Boarding gate', run: () => router.push('/quest/du-ngoan' as never) },
    { id: 'pho', x: 62, y: 80, vi: 'Quán phở', en: 'Phở stall', run: () => router.push('/quest/du-ngoan/visit/hanoi-pho' as never) },
  ];

  const sums = useMemo(() => {
    const by = (p: string) => Object.entries(ledger).filter(([k]) => k.startsWith(p)).reduce((n, [, v]) => n + v, 0);
    return {
      welcome: by('tk:welcome'),
      customs: by('tk:customs:'),
      review: by('tk:review:'),
      stars: by('tk:stars:'),
      city: by('tk:city:'),
      fly: by('tk:fly:'),
    };
  }, [ledger]);

  if (mode) {
    return (
      <TravelPage title={mode.kind === 'customs' ? L('Kiểm tra hải quan', 'Customs check') : L('Ôn từ đến hạn', 'Review due words')} back="/quest/du-ngoan/airport">
        <View style={{ maxWidth: 760, width: '100%', alignSelf: 'center' }}>
          <QuestionRunner questions={mode.questions} onAnswer={recordAnswer} onFinish={onFinish} />
        </View>
      </TravelPage>
    );
  }

  return (
    <TravelPage title={L('Quầy đổi vé', 'Ticket counter')} back="/quest/du-ngoan" backLabel={L('Bản đồ', 'Map')}>
      <Modal transparent visible={ask} animationType="fade" onRequestClose={() => setAsk(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(255, 253, 247, 0.96)', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <View accessibilityRole="alert" style={{ width: '100%', maxWidth: 380 }}>
            <PixelPanel inner={{ padding: 20, gap: 10 }}>
              <Text className="font-heavy" style={{ fontSize: 20, color: T.ink }}>
                {L('Đổi 150 ⭐ lấy 1 vé?', 'Swap 150 ⭐ for 1 ticket?')}
              </Text>
              <Text className="font-sans" style={{ fontSize: 15, color: T.muted }}>
                {L(`Bạn có ${stars} sao · hôm nay còn ${swapsLeft}/${TRAVEL_ECONOMY.stars.ticketsPerDay} lượt`, `${stars} stars · ${swapsLeft}/${TRAVEL_ECONOMY.stars.ticketsPerDay} swaps left today`)}
              </Text>
              {swapsLeft === 0 || stars < TRAVEL_ECONOMY.stars.starsPerTicket ? (
                <Text className="font-strong" style={{ fontSize: 14, color: T.bad }}>
                  {swapsLeft === 0 ? L('Hôm nay bạn đã đổi đủ 3 vé.', "You've used today's 3 swaps.") : L('Chưa đủ sao.', 'Not enough stars.')}
                </Text>
              ) : null}
              <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginTop: 4 }}>
                <GameButton
                  label={L('Đổi', 'Swap')}
                  disabled={swapsLeft === 0 || stars < TRAVEL_ECONOMY.stars.starsPerTicket}
                  onPress={() => {
                    doExchange();
                    setAsk(false);
                  }}
                />
                <GameButton label={L('Huỷ', 'Cancel')} tone="paper" onPress={() => setAsk(false)} />
              </View>
            </PixelPanel>
          </View>
        </View>
      </Modal>
      {outcome ? (
        <PixelPanel style={{ marginBottom: 18 }} tone="navy" inner={{ padding: 18, gap: 8 }}>
          <Text className="font-heavy" style={{ fontSize: 22, color: T.goldLight }}>
            {outcome.tickets > 0
              ? L(`+${outcome.tickets} vé!`, `+${outcome.tickets} ticket${outcome.tickets > 1 ? 's' : ''}!`)
              : outcome.reason === 'cap'
                ? L('Hôm nay hết lượt', 'No more today')
                : outcome.kind === 'review'
                  ? L('Chưa đủ 10 từ', 'Not 10 words yet')
                  : L('Chưa đủ 4/5 câu đúng', 'Under 4 of 5')}
          </Text>
          <Text className="font-sans" style={{ fontSize: 15, color: T.cream }}>
            {L(`${outcome.correct}/${outcome.total} câu đúng.`, `${outcome.correct}/${outcome.total} correct.`)}
          </Text>
          <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginTop: 4 }}>
            <GameButton label={L('Bay thôi', 'Go fly')} onPress={() => router.push('/quest/du-ngoan' as never)} small />
            <GameButton label={L('Đóng', 'Dismiss')} tone="ghost" onPress={() => setOutcome(null)} small />
          </View>
        </PixelPanel>
      ) : null}

      <View style={{ marginBottom: 18 }}>
        <PixelStage source={{ uri: '/travel/maps/hanoi.webp' }} focus={{ x: 200, y: 110 }} label={L('Sân bay Nội Bài', 'Noi Bai Airport')}>
          {(k) => (
            <>
              {regions.map((r) => (
                <Pressable
                  key={r.id}
                  accessibilityRole="button"
                  accessibilityLabel={L(r.vi, r.en)}
                  onPress={r.run}
                  style={(st) => { const { hovered, focused } = st as { hovered?: boolean; focused?: boolean }; return { position: 'absolute', left: r.x * k - 30, top: r.y * k - 28, width: 60, height: 56, alignItems: 'center', justifyContent: 'flex-end', borderRadius: 6, borderWidth: 2, borderColor: focused ? T.paper : hovered ? T.goldLight : 'rgba(226,200,143,0.6)', borderStyle: focused ? 'dashed' : 'solid', backgroundColor: hovered ? 'rgba(226,200,143,0.22)' : 'rgba(15,29,51,0.08)' }; }}
                >
                  <View style={[{ position: 'absolute', bottom: -14, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, backgroundColor: T.paper, borderWidth: 2, borderColor: T.navy }, cssAnim('tvBounce', 1800, reduced)]} className="tv-anim">
                    <Text className="font-strong" style={{ fontSize: 14, color: T.navy }} numberOfLines={1}>
                      {L(r.vi, r.en)}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </>
          )}
        </PixelStage>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
        <Block title={L('Hỏi nhân viên sân bay', 'Ask airport staff')}>
          <Text className="font-sans" style={{ fontSize: 15, color: T.muted }}>
            {L('Tự hỏi về quầy làm thủ tục, hành lý, cổng lên máy bay hoặc cách di chuyển trong sân bay.', 'Ask freely about check-in, baggage, boarding gates, or getting around the airport.')}
          </Text>
          {!talkToStaff ? (
            <GameButton label={L('Trò chuyện với nhân viên', 'Talk to staff')} icon="chat" onPress={() => setTalkToStaff(true)} />
          ) : (
            <TravelConversation
              embedded
              onClose={() => setTalkToStaff(false)}
              context={{
                cityId: city,
                npcId: 'noi-bai-airport-staff',
                persona: 'staff',
                displayName: { vi: 'Nhân viên sân bay', en: 'Airport staff member' },
              }}
            />
          )}
        </Block>

        <Block title={L('Kiểm tra hải quan', 'Customs check')}>
          <Text className="font-sans" style={{ fontSize: 15, color: T.muted }}>
            {L('5 câu. Đúng 4 câu để được 1 vé.', '5 questions. Get 4 right for a ticket.')}
          </Text>
          <Text className="font-strong" style={{ fontSize: 14, color: T.ink }}>
            {L(`Hôm nay còn ${runsLeft}/${TRAVEL_ECONOMY.customs.runsPerDay} lượt`, `${runsLeft}/${TRAVEL_ECONOMY.customs.runsPerDay} runs left today`)}
          </Text>
          <GameButton label={L('Bắt đầu', 'Start')} icon="play" onPress={startCustoms} disabled={runsLeft === 0} />
        </Block>

        <Block title={L('Ôn từ đến hạn', 'Review due words')}>
          <Text className="font-sans" style={{ fontSize: 15, color: T.muted }}>
            {L('Ôn 10 từ để được 1 vé.', 'Review 10 words for a ticket.')}
          </Text>
          <Text className="font-strong" style={{ fontSize: 14, color: T.ink }}>
            {L(`${dueCount} từ đến hạn · vé hôm nay ${today.review}/${TRAVEL_ECONOMY.review.ticketsPerDay}`, `${dueCount} due · tickets today ${today.review}/${TRAVEL_ECONOMY.review.ticketsPerDay}`)}
          </Text>
          {dueCount > 0 ? (
            <GameButton label={L('Ôn ngay', 'Review now')} icon="refresh" onPress={startReview} disabled={reviewLeft === 0} />
          ) : (
            <GameButton label={L('Chưa có từ đến hạn — học từ vựng', 'Nothing due — study vocabulary')} tone="paper" onPress={() => router.push('/vocabulary/topics' as never)} />
          )}
        </Block>

        <Block title={L('Đổi sao lấy vé', 'Swap stars for a ticket')}>
          <Text className="font-sans" style={{ fontSize: 15, color: T.muted }}>
            {L('150 sao = 1 vé.', '150 stars = 1 ticket.')}
          </Text>
          <Text className="font-strong" style={{ fontSize: 14, color: T.ink }}>
            {L(`Bạn có ${stars} sao · hôm nay còn ${swapsLeft}/${TRAVEL_ECONOMY.stars.ticketsPerDay} lượt`, `${stars} stars · ${swapsLeft}/${TRAVEL_ECONOMY.stars.ticketsPerDay} swaps left today`)}
          </Text>
          <GameButton label={L('Đổi 1 vé', 'Swap for 1 ticket')} icon="star-fill" onPress={() => setAsk(true)} disabled={swapsLeft === 0 || stars < TRAVEL_ECONOMY.stars.starsPerTicket} />
          {swap ? (
            <Text className="font-sans" style={{ fontSize: 14, color: T.muted }} accessibilityLiveRegion="polite">
              {swap}
            </Text>
          ) : null}
        </Block>

        <Block title={L('Sổ vé', 'Ticket log')}>
          <LogLine label={L('Quà chào mừng', 'Welcome gift')} n={sums.welcome} />
          <LogLine label={L('Hải quan', 'Customs')} n={sums.customs} />
          <LogLine label={L('Ôn từ', 'Review')} n={sums.review} />
          <LogLine label={L('Đổi sao', 'Star swaps')} n={sums.stars} />
          <LogLine label={L('Thưởng thành phố', 'City bonus')} n={sums.city} />
          <LogLine label={L('Đã bay', 'Flights')} n={sums.fly} />
        </Block>
      </View>
    </TravelPage>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ flexGrow: 1, flexBasis: 320, minWidth: 260 }}>
      <PixelPanel inner={{ padding: 16, gap: 10 }}>
        <Eyebrow>{title}</Eyebrow>
        {children}
      </PixelPanel>
    </View>
  );
}

function LogLine({ label, n }: { label: string; n: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 28 }}>
      <Text className="font-sans" style={{ fontSize: 15, color: T.ink }}>
        {label}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <TicketGlyph size={16} />
        <Text className="font-strong" style={{ fontSize: 15, color: n < 0 ? T.bad : T.ink }}>
          {n > 0 ? `+${n}` : n}
        </Text>
      </View>
    </View>
  );
}
