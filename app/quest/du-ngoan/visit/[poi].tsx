import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { TaskShell } from '@/components/layout/TaskShell';
import { Confetti } from '@/components/motion/Confetti';
import { recordAnswer, seenKeys } from '@/components/travel/record';
import { useStudySnapshot, useTravelReady } from '@/components/travel/useTravel';
import { TravelHud } from '@/components/travel/ui/Hud';
import { CoinGlyph, GameButton, PixelPanel, StampGlyph, StarsRow, T } from '@/components/travel/ui/kit';
import { QuestionRunner, type RunResult } from '@/components/travel/ui/QuestionRunner';
import { getPoiContent } from '@/data/travel/pois';
import { getSouvenir } from '@/data/travel/souvenirs';
import { bi, useL } from '@/i18n/useL';
import { pickVisitQuestions } from '@/services/travel/pick';
import { isPoiUnlocked, type VisitResult } from '@/services/travel/rewards';
import type { Level } from '@/services/travel/types';
import type { VisitQuestion } from '@/services/travel/content';
import { CITIES } from '@/services/travel/world';
import { useTravelStore } from '@/store/useTravelStore';

/** /quest/du-ngoan/visit/[poi] — một lượt tham quan (6–8 câu) ở một địa điểm. */
export default function VisitRoute() {
  const { poi: raw } = useLocalSearchParams<{ poi: string }>();
  const ready = useTravelReady();
  const { L } = useL();
  const id = Array.isArray(raw) ? raw[0] : raw;
  const poi = id ? getPoiContent(id) : undefined;
  const back = poi ? `/quest/du-ngoan/${poi.city}` : '/quest/du-ngoan';
  return (
    <TaskShell backHref={back} backLabel={L('Quay lại thành phố', 'Back to the city')} title={poi ? poi.name.vi : L('Địa điểm', 'Place')} right={<TravelHud />}>
      {ready && poi ? <Visit poiId={poi.id} /> : ready ? <Notice text={L('Không tìm thấy địa điểm này.', 'This place does not exist.')} href="/quest/du-ngoan" /> : null}
    </TaskShell>
  );
}

function Notice({ text, href }: { text: string; href: string }) {
  const { L } = useL();
  return (
    <PixelPanel style={{ maxWidth: 520, alignSelf: 'center', width: '100%' }} inner={{ gap: 12, padding: 20 }}>
      <Text className="font-strong" style={{ fontSize: 16, color: T.ink }}>
        {text}
      </Text>
      <GameButton label={L('Quay lại', 'Go back')} onPress={() => router.replace(href as never)} />
    </PixelPanel>
  );
}

const LEVEL_NAME: Record<Level, [string, string]> = { 1: ['Dễ', 'Easy'], 2: ['Vừa', 'Medium'], 3: ['Khó', 'Hard'] };

type Phase = { kind: 'intro' } | { kind: 'run'; questions: VisitQuestion[]; level: Level } | { kind: 'result'; result: VisitResult; correct: number; total: number };

function Visit({ poiId }: { poiId: string }) {
  const { L, locale, en } = useL();
  const poi = getPoiContent(poiId)!;
  const city = useTravelStore((s) => s.city);
  const progress = useTravelStore((s) => s.poi);
  const seen = useTravelStore((s) => s.seen);
  const complete = useTravelStore((s) => s.completeVisit);
  const snap = useStudySnapshot();
  const prog = progress[poiId];
  const unlockedLevel = (prog?.level ?? poi.content.level) as Level;
  const [level, setLevel] = useState<Level>(unlockedLevel);
  const [phase, setPhase] = useState<Phase>({ kind: 'intro' });
  const cityBack = `/quest/du-ngoan/${poi.city}`;

  const open = useMemo(() => isPoiUnlocked({ poi: progress }, poi), [progress, poi]);

  const start = useCallback(() => {
    const questions = pickVisitQuestions({ poi, level, runNo: (prog?.runs ?? 0) + 1, seen, nowMs: Date.now(), ...snap });
    setPhase({ kind: 'run', questions, level });
  }, [poi, level, prog?.runs, seen, snap]);

  const finish = useCallback(
    (r: RunResult) => {
      if (phase.kind !== 'run') return;
      const result = complete({ poiId, correct: r.correct, total: r.total, playedLevel: phase.level, keys: seenKeys(phase.questions) });
      if (result) setPhase({ kind: 'result', result, correct: r.correct, total: r.total });
    },
    [phase, complete, poiId],
  );

  if (poi.action) return <Notice text={L('Đây không phải địa điểm làm bài.', 'This is not a lesson spot.')} href={cityBack} />;
  if (city !== poi.city) return <Notice text={L('Bạn đang ở thành phố khác. Hãy bay tới đây trước.', 'You are in another city. Fly here first.')} href="/quest/du-ngoan" />;
  if (!open) {
    const need = poi.unlock?.after ? getPoiContent(poi.unlock.after) : undefined;
    return <Notice text={need ? L(`Hoàn thành "${need.name.vi}" trước.`, `Pass "${need.name.en}" first.`) : L('Hoàn thành các chỗ còn lại trước.', 'Pass the other places first.')} href={cityBack} />;
  }

  if (phase.kind === 'run') {
    return (
      <View style={{ maxWidth: 760, width: '100%', alignSelf: 'center' }}>
        <QuestionRunner questions={phase.questions} onAnswer={recordAnswer} onFinish={finish} />
      </View>
    );
  }

  if (phase.kind === 'result') {
    const { result: r } = phase;
    const sv = r.souvenir ? getSouvenir(r.souvenir) : undefined;
    const label = r.stars === 3 ? L('Xuất sắc!', 'Excellent!') : r.stars === 2 ? L('Đạt', 'Passed') : L('Thử lại nhé', 'Try again');
    return (
      <View style={{ maxWidth: 560, width: '100%', alignSelf: 'center' }}>
        {r.passed ? <Confetti seed={`${poiId}-${r.runNo}`} pieces={70} /> : null}
        <PixelPanel tone="navy" inner={{ padding: 22, gap: 12, alignItems: 'center' }}>
          <Text className="font-heavy" style={{ fontSize: 26, color: T.goldLight }}>
            {label}
          </Text>
          <StarsRow n={r.stars} size={30} />
          <Text className="font-strong" style={{ fontSize: 16, color: T.cream }}>
            {L(`${phase.correct}/${phase.total} câu đúng`, `${phase.correct}/${phase.total} correct`)}
          </Text>
          {r.coins > 0 ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <CoinGlyph size={22} />
              <Text className="font-heavy" style={{ fontSize: 18, color: T.goldLight }}>
                +{r.coins}
              </Text>
            </View>
          ) : null}
          {sv ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: T.paper, padding: 10, borderRadius: 6 }}>
              <Text style={{ fontSize: 30 }}>{sv.glyph}</Text>
              <View>
                <Text className="font-strong" style={{ fontSize: 15, color: T.ink }}>
                  {bi(sv.name, locale)}
                </Text>
                <Text className="font-sans" style={{ fontSize: 14, color: T.muted }}>
                  {L('Quà mới trong vali', 'New in your suitcase')}
                </Text>
              </View>
            </View>
          ) : null}
          {r.stamp ? (
            <View style={{ alignItems: 'center', gap: 4 }}>
              <StampGlyph size={72} color={T.goldLight} />
              <Text className="font-heavy" style={{ fontSize: 16, color: T.goldLight }}>
                {L(`Con dấu ${bi(CITIES[r.stamp].name, locale)}! +${r.bonusTickets} vé`, `${bi(CITIES[r.stamp].name, locale)} stamp! +${r.bonusTickets} ticket`)}
              </Text>
            </View>
          ) : null}
          {r.levelUnlocked ? (
            <Text className="font-strong" style={{ fontSize: 14, color: T.cream }}>
              {L(`Mở mức ${LEVEL_NAME[r.levelUnlocked][0]}`, `${LEVEL_NAME[r.levelUnlocked][1]} level unlocked`)}
            </Text>
          ) : null}
          <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginTop: 6 }}>
            <GameButton label={L('Làm lại', 'Play again')} tone="paper" onPress={() => setPhase({ kind: 'intro' })} />
            <GameButton label={L('Về thành phố', 'Back to the city')} onPress={() => router.replace(cityBack as never)} />
          </View>
        </PixelPanel>
      </View>
    );
  }

  const total = poi.questions ?? 7;
  return (
    <View style={{ maxWidth: 560, width: '100%', alignSelf: 'center' }}>
      <PixelPanel inner={{ padding: 22, gap: 12 }}>
        <Text className="font-heavy" style={{ fontSize: 24, color: T.ink }}>
          {bi(poi.name, locale)}
        </Text>
        <Text className="font-sans" style={{ fontSize: 15, color: T.muted }}>
          {bi(CITIES[poi.city].name, locale)} · {L(`${total} câu`, `${total} questions`)}
        </Text>
        <StarsRow n={prog?.best ?? 0} size={22} />
        {unlockedLevel > 1 || poi.content.level > 1 ? (
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            {([1, 2, 3] as Level[]).filter((lv) => lv <= unlockedLevel).map((lv) => (
              <Pressable
                key={lv}
                accessibilityRole="button"
                accessibilityState={{ selected: level === lv }}
                onPress={() => setLevel(lv)}
                style={{ minHeight: 44, paddingHorizontal: 16, justifyContent: 'center', borderRadius: 6, borderWidth: 2, borderColor: level === lv ? T.navy : T.line, backgroundColor: level === lv ? T.goldLight : T.paper }}
              >
                <Text className="font-strong" style={{ fontSize: 14, color: T.ink }}>
                  {en ? LEVEL_NAME[lv][1] : LEVEL_NAME[lv][0]}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}
        <GameButton label={L('Bắt đầu', 'Start')} icon="play" onPress={start} />
      </PixelPanel>
    </View>
  );
}
