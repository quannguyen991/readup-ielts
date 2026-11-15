import React, { useMemo, useState } from 'react';
import { Pressable, Text, View, type ViewStyle } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { useHydrated } from '@/components/layout/useHydrated';
import { CRITERION_COLOR, DarkButton, Donut, SoftButton, useWide } from '@/components/hsa/stage';
import { CatSticker, type CatPose } from '@/components/mascot/CatSticker';
import { Icon } from '@/components/ui/Icon';
import { HSA_KIND_LABEL, type HsaQuestionKind } from '@/data/hsa';
import { HSA_QUESTION_BANK } from '@/data/hsa-bank';
import { bi, useL } from '@/i18n/useL';
import { restoreItems } from '@/services/hsa/attempts';
import { CRITERIA, CRITERION_BY_ID, KIND_CRITERION, KIND_GUIDE } from '@/services/hsa/criteria';
import { activityTitle, clock } from '@/services/hsa/labels';
import { placementIdOf } from '@/services/hsa/placement';
import { scoreItems, type AttemptItem, type CriterionResult } from '@/services/hsa/scoring';
import { placementAttempts, useHsaStore } from '@/store/useHsaStore';

/**
 * KẾT QUẢ CHẤM — theo bố cục ảnh mẫu (vòng đúng/sai, bảng tiêu chí, nhận xét, đáp án chi tiết) nhưng
 * dùng bảng màu và phông Band 9. Chấm đủ năm tiêu chí và theo mức CEFR; mỗi câu có lời giải, cách
 * làm mẫu và lỗi hay gặp của dạng câu đó.
 *
 * `id = placement` là bản TỔNG HỢP của năm phần bài test đầu vào (lượt làm gần nhất của mỗi phần).
 */
const INK = '#2A1B63';
const BG = '#D9CCFA';
const INDEX = new Map(HSA_QUESTION_BANK.map((q) => [q.id, q]));

const card = (extra?: ViewStyle): ViewStyle => ({
  backgroundColor: '#FFFFFF',
  borderRadius: 22,
  borderWidth: 2.5,
  borderColor: INK,
  padding: 18,
  ...({ boxShadow: `0 5px 0 ${INK}` } as ViewStyle),
  ...extra,
});

type Filter = 'all' | 'wrong' | 'skipped' | 'correct';

export default function HsaResultScreen() {
  const { L, locale } = useL();
  const wide = useWide();
  const hydrated = useHydrated();
  const { id } = useLocalSearchParams<{ id: string }>();
  const attempts = useHsaStore((s) => s.attempts);
  const combined = id === 'placement';
  const placed = useMemo(() => placementAttempts(attempts), [attempts]);

  const attempt = combined ? null : attempts.find((a) => a.id === id) ?? null;
  const items: AttemptItem[] = useMemo(() => {
    if (combined) return CRITERIA.flatMap((c) => (placed[c.id] ? restoreItems(placed[c.id]!, INDEX) : []));
    return attempt ? restoreItems(attempt, INDEX) : [];
  }, [combined, placed, attempt]);
  const report = useMemo(() => scoreItems(items), [items]);

  const [filter, setFilter] = useState<Filter>('all');
  const firstWrong = items.find((it) => it.picked !== null && it.picked !== it.answer)?.qid ?? null;
  const [open, setOpen] = useState<Set<string>>(() => new Set(firstWrong ? [firstWrong] : []));

  // Dữ liệu làm bài nằm trên máy: chưa nạp xong thì chưa được kết luận là "không có kết quả".
  if (!hydrated) {
    return (
      <Screen>
        <Text className="font-nun-heavy" style={{ fontSize: 16, color: INK }}>
          {L('Đang tải kết quả…', 'Loading results…')}
        </Text>
      </Screen>
    );
  }

  if (items.length === 0) {
    return (
      <Screen>
        <View className="w-full self-center" style={{ maxWidth: 760 }}>
          <View style={card({ alignItems: 'flex-start', gap: 12 })}>
            <Text className="font-nun-heavy" style={{ fontSize: 22, color: INK }}>
              {combined ? L('Chưa có kết quả bài test đầu vào', 'No entry-test results yet') : L('Không tìm thấy lượt làm bài này', 'This attempt was not found')}
            </Text>
            <Text className="font-nun-strong" style={{ fontSize: 15, color: '#5A4E8C' }}>
              {combined ? L('Làm ít nhất một phần để xem kết quả.', 'Complete at least one part to see results.') : L('Có thể bài làm đã bị xoá khỏi máy này.', 'The attempt may have been removed from this device.')}
            </Text>
            <DarkButton label={L('Về trang HSA', 'Back to HSA')} onPress={() => router.replace('/hsa' as never)} />
          </View>
        </View>
      </Screen>
    );
  }

  const activity = attempt?.activity ?? 'placement';
  const title = combined ? { vi: 'Tổng hợp bài test đầu vào', en: 'Entry test summary' } : activityTitle(activity);
  const sectionId = placementIdOf(activity);
  const nextSection = CRITERIA.find((c) => !placed[c.id] && c.id !== sectionId);
  const placementComplete = CRITERIA.every((c) => placed[c.id]);
  const secondsUsed = attempt?.seconds ?? 0;
  const useScale50 = report.total >= 20;

  const pct = Math.round(report.accuracy * 100);
  const mood: { pose: CatPose; text: string } =
    pct >= 80
      ? { pose: 'cheer', text: L('Xuất sắc! Giữ phong độ này nhé.', 'Excellent! Keep this form up.') }
      : pct >= 60
        ? { pose: 'peace', text: L('Khá tốt. Còn vài chỗ cần chắc hơn.', 'Pretty good. A few spots to firm up.') }
        : pct >= 40
          ? { pose: 'think', text: L('Chưa cao lắm, nhưng bạn đã bắt đầu rồi.', 'Not high yet, but you have started.') }
          : { pose: 'sit', text: L('Mới khởi động thôi, còn nhiều tiềm năng.', 'Just warming up, lots of room to grow.') };

  const cefr = report.cefr.reached ? report.cefr.reached : report.cefr.below ? L(`Dưới ${report.cefr.below}`, `Below ${report.cefr.below}`) : '—';

  // Nhận xét theo dạng câu: tốt nhất và cần cải thiện nhất (chỉ khi thật sự khác nhau).
  const measured = report.kinds.filter((k) => k.total >= 1 && k.pct !== null);
  const bestKind = [...measured].sort((a, b) => (b.pct ?? 0) - (a.pct ?? 0) || b.total - a.total)[0];
  const worstKind = [...measured].sort((a, b) => (a.pct ?? 0) - (b.pct ?? 0) || b.wrong - a.wrong)[0];
  const showBest = !!bestKind && (bestKind.pct ?? 0) >= 0.5 && bestKind.kind !== worstKind?.kind;
  const showWorst = !!worstKind && (worstKind.pct ?? 1) < 1;

  const listed = items.filter((it) => {
    const wrong = it.picked !== null && it.picked !== it.answer;
    if (filter === 'wrong') return wrong;
    if (filter === 'skipped') return it.picked === null;
    if (filter === 'correct') return it.picked === it.answer;
    return true;
  });
  const toggle = (qid: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(qid)) next.delete(qid);
      else next.add(qid);
      return next;
    });

  const kindName = (k: HsaQuestionKind) => bi(HSA_KIND_LABEL[k], locale);

  return (
    <Screen>
      <View className="w-full self-center" style={{ maxWidth: 1080 }}>
        <View style={{ borderRadius: 28, backgroundColor: BG, paddingHorizontal: wide ? 32 : 14, paddingTop: 20, paddingBottom: 28, gap: 18, overflow: 'hidden' }}>
          {/* ------------------------------------------------ đầu trang */}
          <View style={{ flexDirection: wide ? 'row' : 'column', alignItems: wide ? 'flex-start' : 'stretch', justifyContent: 'space-between', gap: 12 }}>
            <View style={{ flex: wide ? 1 : undefined, minWidth: 0 }}>
              <Pressable accessibilityRole="button" onPress={() => router.replace((combined || sectionId ? '/hsa/placement' : '/hsa') as never)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <Icon name="chevron-left" size={16} color={INK} strokeWidth={2.6} />
                <Text className="font-nun-heavy" style={{ fontSize: 14, color: INK }}>
                  {L('Quay về', 'Back')}
                </Text>
              </Pressable>
              <Text className="font-nun-heavy" style={{ fontSize: 13, letterSpacing: 1.4, color: '#5A4E8C' }}>
                {L('KẾT QUẢ BÀI', 'RESULT')}
              </Text>
              <Text className="font-nun-heavy" style={{ fontSize: wide ? 40 : 28, lineHeight: wide ? 46 : 34, color: INK, marginTop: 2 }}>
                {bi(title, locale)}
              </Text>
              <Text className="font-nun-strong" style={{ fontSize: 15, lineHeight: 22, color: '#4A3D80', marginTop: 6, maxWidth: 560 }}>
                {L(
                  `Chấm theo 5 tiêu chí và mức CEFR. ${report.total} câu: đúng ${report.correct}, sai ${report.wrong}, bỏ qua ${report.skipped}.`,
                  `Scored on 5 criteria and CEFR level. ${report.total} questions: ${report.correct} correct, ${report.wrong} wrong, ${report.skipped} skipped.`,
                )}
              </Text>
            </View>
            <View style={{ flexDirection: wide ? 'column' : 'row', alignItems: 'center', maxWidth: wide ? 190 : undefined, gap: wide ? 0 : 8 }}>
              <View style={{ flexShrink: 1, backgroundColor: '#FFFFFF', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 2, borderColor: INK, marginBottom: wide ? 4 : 0 }}>
                <Text className="font-nun-heavy" style={{ fontSize: 12, lineHeight: 16, color: INK, textAlign: wide ? 'center' : 'left' }}>
                  {mood.text}
                </Text>
              </View>
              <CatSticker pose={mood.pose} size={wide ? 96 : 44} />
            </View>
          </View>

          {/* ------------------------------------------------ vòng đúng / sai */}
          <View style={card({ flexDirection: wide ? 'row' : 'column', alignItems: 'center', justifyContent: 'center', gap: wide ? 44 : 16 })}>
            <Donut correct={report.correct} wrong={report.wrong} skipped={report.skipped} size={wide ? 168 : 144} />
            <View style={{ gap: 10, minWidth: wide ? 300 : undefined }}>
              <Legend color="#16A34A" label={L('Đúng', 'Correct')} n={report.correct} unit={L('câu', 'q')} />
              <Legend color="#E5484D" label={L('Sai', 'Wrong')} n={report.wrong} unit={L('câu', 'q')} />
              <Legend color="#F5B93B" label={L('Bỏ qua', 'Skipped')} n={report.skipped} unit={L('câu', 'q')} />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                {useScale50 ? <Pill label={L('ĐIỂM LUYỆN', 'PRACTICE SCORE')} value={`${report.score50}/50`} /> : <Pill label={L('CHÍNH XÁC', 'ACCURACY')} value={`${pct}%`} />}
                <Pill label={L('MỨC ƯỚC LƯỢNG', 'ESTIMATED LEVEL')} value={String(cefr)} />
                {secondsUsed > 0 ? <Pill label={L('THỜI GIAN', 'TIME')} value={clock(secondsUsed)} /> : null}
              </View>
              <Text className="font-nun-strong" style={{ fontSize: 12, lineHeight: 17, color: '#5A4E8C', maxWidth: 360 }}>
                {L('Điểm luyện chỉ dùng để so các bài trong app với nhau, không phải điểm HSA. Mức ước lượng chỉ tính trên các mức có ít nhất 2 câu.', 'The practice score only compares attempts inside the app; it is not an HSA score. The level estimate only uses levels with at least 2 questions.')}
              </Text>
            </View>
          </View>

          {/* ------------------------------------------------ năm tiêu chí */}
          <View style={card({ paddingHorizontal: wide ? 22 : 14 })}>
            <Text className="font-nun-heavy" style={{ fontSize: 13, letterSpacing: 1.2, color: '#5A4E8C', marginBottom: 12 }}>
              {L('ĐIỂM THEO 5 TIÊU CHÍ', 'SCORE BY 5 CRITERIA')}
            </Text>
            <View style={{ flexDirection: wide ? 'row' : 'column', gap: wide ? 0 : 12 }}>
              {report.criteria.map((c, i) => (
                <CriterionCell key={c.id} c={c} first={i === 0} wide={wide} L={L} locale={locale} />
              ))}
            </View>
            <View style={{ height: 1, backgroundColor: '#E6E1F5', marginVertical: 16 }} />
            <Text className="font-nun-heavy" style={{ fontSize: 13, letterSpacing: 1.2, color: '#5A4E8C', marginBottom: 10 }}>
              {L('THEO MỨC ĐỘ KHÓ', 'BY DIFFICULTY LEVEL')}
            </Text>
            <View style={{ gap: 8 }}>
              {report.levels.map((l) => (
                <Bar key={l.level} label={l.level} pct={l.pct} right={l.total ? `${l.correct}/${l.total}` : L('chưa có câu', 'no questions')} color="#6A4BD9" />
              ))}
            </View>
            <View style={{ height: 1, backgroundColor: '#E6E1F5', marginVertical: 16 }} />
            <Text className="font-nun-heavy" style={{ fontSize: 13, letterSpacing: 1.2, color: '#5A4E8C', marginBottom: 10 }}>
              {L('THEO DẠNG CÂU', 'BY QUESTION TYPE')}
            </Text>
            <View style={{ gap: 8 }}>
              {[...report.kinds].sort((a, b) => (a.pct ?? 0) - (b.pct ?? 0)).map((k) => (
                <Bar key={k.kind} label={kindName(k.kind)} pct={k.pct} right={`${k.correct}/${k.total}`} color={CRITERION_COLOR[KIND_CRITERION[k.kind]]} wideLabel />
              ))}
            </View>
          </View>

          {/* ------------------------------------------------ nhận xét */}
          {showBest || showWorst ? (
            <View style={{ flexDirection: wide ? 'row' : 'column', gap: 16 }}>
              {showBest && bestKind ? (
                <View style={[card({ borderColor: '#16A34A', backgroundColor: '#F1FBF5', flex: wide ? 1 : undefined }), { boxShadow: '0 5px 0 #16A34A' } as ViewStyle]}>
                  <Text className="font-nun-heavy" style={{ fontSize: 12, letterSpacing: 1.2, color: '#16803D' }}>
                    ✓ {L('LÀM TỐT NHẤT', 'STRONGEST')}
                  </Text>
                  <Text className="font-nun-heavy" style={{ fontSize: 18, lineHeight: 24, color: INK, marginTop: 6 }}>
                    {kindName(bestKind.kind)}
                  </Text>
                  <Text className="font-nun-strong" style={{ fontSize: 14, lineHeight: 21, color: '#3F356F', marginTop: 4 }}>
                    {L(`Đúng ${bestKind.correct}/${bestKind.total} câu dạng này (${bi(CRITERION_BY_ID[KIND_CRITERION[bestKind.kind]].title, 'vi').toLowerCase()}). Giữ phong độ bằng cách ôn nhẹ mỗi tuần.`, `${bestKind.correct}/${bestKind.total} correct on this type (${bi(CRITERION_BY_ID[KIND_CRITERION[bestKind.kind]].title, 'en').toLowerCase()}). Keep it up with a light weekly review.`)}
                  </Text>
                </View>
              ) : null}
              {showWorst && worstKind ? (
                <View style={[card({ borderColor: '#E5484D', backgroundColor: '#FFF4F4', flex: wide ? 1 : undefined }), { boxShadow: '0 5px 0 #E5484D' } as ViewStyle]}>
                  <Text className="font-nun-heavy" style={{ fontSize: 12, letterSpacing: 1.2, color: '#C2272D' }}>
                    ! {L('CẦN CẢI THIỆN', 'NEEDS WORK')}
                  </Text>
                  <Text className="font-nun-heavy" style={{ fontSize: 18, lineHeight: 24, color: INK, marginTop: 6 }}>
                    {kindName(worstKind.kind)}
                  </Text>
                  <Text className="font-nun-strong" style={{ fontSize: 14, lineHeight: 21, color: '#3F356F', marginTop: 4 }}>
                    {L(`Đúng ${worstKind.correct}/${worstKind.total} câu. `, `${worstKind.correct}/${worstKind.total} correct. `)}
                    {bi(KIND_GUIDE[worstKind.kind].pitfall, locale)}
                  </Text>
                  <View style={{ marginTop: 10, borderRadius: 12, backgroundColor: '#FFE3E3', padding: 12 }}>
                    <Text className="font-nun-strong" style={{ fontSize: 13, lineHeight: 20, color: '#8C1D22' }}>
                      💡 {L('Cách làm: ', 'Approach: ')}
                      {bi(KIND_GUIDE[worstKind.kind].steps, locale)}
                    </Text>
                  </View>
                  <View style={{ marginTop: 12, alignSelf: 'flex-start' }}>
                    <DarkButton label={L('Luyện dạng này', 'Practise this type')} onPress={() => router.push(`/hsa/practice/${worstKind.kind}` as never)} />
                  </View>
                </View>
              ) : null}
            </View>
          ) : null}

          {/* ------------------------------------------------ bước tiếp theo */}
          <View style={card({ gap: 10 })}>
            {sectionId && !placementComplete && nextSection ? (
              <>
                <Text className="font-nun-heavy" style={{ fontSize: 12, letterSpacing: 1.2, color: '#5A4E8C' }}>
                  {L(`BÀI TEST ĐẦU VÀO · XONG PHẦN ${bi(CRITERION_BY_ID[sectionId].title, 'vi').split(' & ')[0]!.toUpperCase()}`, `ENTRY TEST · ${bi(CRITERION_BY_ID[sectionId].title, 'en').split(' & ')[0]!.toUpperCase()} DONE`)}
                </Text>
                <Text className="font-nun-strong" style={{ fontSize: 15, color: INK }}>
                  {L(`Phần tiếp theo: ${bi(nextSection.title, 'vi')} · khoảng 8 phút`, `Next part: ${bi(nextSection.title, 'en')} · about 8 minutes`)}
                </Text>
                <View style={{ alignSelf: 'stretch' }}>
                  <DarkButton label={L(`Làm tiếp: ${bi(nextSection.title, 'vi').split(' & ')[0]}`, `Continue: ${bi(nextSection.title, 'en').split(' & ')[0]}`)} onPress={() => router.replace(`/hsa/placement/${nextSection.id}` as never)} />
                </View>
                <Pressable accessibilityRole="link" onPress={() => router.replace('/hsa' as never)}>
                  <Text className="font-nun-strong" style={{ fontSize: 13, color: '#5A4E8C', textDecorationLine: 'underline' }}>
                    {L('Để sau (lộ trình mở khi làm xong bài test)', 'Later (the plan opens when the entry test is done)')}
                  </Text>
                </Pressable>
              </>
            ) : combined || (sectionId && placementComplete) ? (
              <>
                <Text className="font-nun-strong" style={{ fontSize: 15, color: INK }}>
                  {placementComplete ? L('Bạn đã làm đủ 5 phần. Kế hoạch mỗi ngày sẽ bám đúng điểm yếu ở trên.', 'You have done all 5 parts. Your daily plan will aim at the weak spots above.') : L('Làm nốt các phần còn lại để mở lộ trình.', 'Finish the remaining parts to open your plan.')}
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                  {sectionId ? <SoftButton label={L('Kết quả tổng hợp', 'Combined results')} onPress={() => router.replace('/hsa/result/placement' as never)} /> : null}
                  <DarkButton label={placementComplete ? L('Xem lộ trình của bạn', 'See your plan') : L('Về bài test', 'Back to the test')} onPress={() => router.replace((placementComplete ? '/hsa/plan' : '/hsa/placement') as never)} />
                </View>
              </>
            ) : (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {report.wrong > 0 ? <DarkButton label={L('Chữa câu đã sai', 'Fix missed questions')} onPress={() => router.replace('/hsa/review' as never)} /> : null}
                <SoftButton label={L('Về trang HSA', 'Back to HSA')} onPress={() => router.replace('/hsa' as never)} />
                <SoftButton label={L('Kế hoạch hôm nay', 'Today’s plan')} onPress={() => router.replace('/hsa/plan' as never)} />
              </View>
            )}
          </View>

          {/* ------------------------------------------------ đáp án chi tiết */}
          <View style={card({ paddingHorizontal: wide ? 22 : 12 })}>
            <Text className="font-nun-heavy" style={{ fontSize: 20, color: INK }}>
              {L('Đáp án chi tiết', 'Detailed answers')}
            </Text>
            <Text className="font-nun-strong" style={{ fontSize: 13, lineHeight: 19, color: '#5A4E8C', marginTop: 2 }}>
              {L('Mỗi câu có lời giải, cách làm mẫu và lỗi hay gặp của dạng câu đó.', 'Each question has an explanation, a model approach and the common mistake for that type.')}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 12 }}>
              {(
                [
                  ['all', L('Tất cả', 'All'), report.total],
                  ['wrong', L('Sai', 'Wrong'), report.wrong],
                  ['skipped', L('Bỏ qua', 'Skipped'), report.skipped],
                  ['correct', L('Đúng', 'Correct'), report.correct],
                ] as [Filter, string, number][]
              ).map(([key, label, n]) => (
                <Pressable key={key} accessibilityRole="radio" accessibilityState={{ selected: filter === key }} onPress={() => setFilter(key)} style={{ paddingHorizontal: 16, minHeight: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 999, borderWidth: 2, borderColor: INK, backgroundColor: filter === key ? INK : '#FFFFFF' }}>
                  <Text className="font-nun-heavy" style={{ fontSize: 13, color: filter === key ? '#FFFFFF' : INK }}>
                    {label} {n}
                  </Text>
                </Pressable>
              ))}
            </View>
            {listed.length === 0 ? (
              <Text className="font-nun-strong" style={{ fontSize: 14, color: '#5A4E8C', paddingVertical: 12 }}>
                {L('Không có câu nào trong nhóm này.', 'No questions in this group.')}
              </Text>
            ) : null}
            <View style={{ gap: 10 }}>
              {listed.map((it) => (
                <QuestionCard key={it.qid} it={it} no={items.indexOf(it) + 1} open={open.has(it.qid)} onToggle={() => toggle(it.qid)} locale={locale} L={L} />
              ))}
            </View>
          </View>
        </View>
      </View>
    </Screen>
  );
}

// ---------------------------------------------------------------- mảnh nhỏ

function Legend({ color, label, n, unit }: { color: string; label: string; n: number; unit: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: color }} />
      <Text className="font-nun-strong" style={{ width: 70, fontSize: 14, color: '#5A4E8C' }}>
        {label}
      </Text>
      <Text className="font-nun-heavy" style={{ fontSize: 18, color: INK }}>
        {n} {unit}
      </Text>
    </View>
  );
}

function Pill({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFEFB5', borderWidth: 2, borderColor: INK, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 }}>
      <Text className="font-nun-heavy" style={{ fontSize: 12, letterSpacing: 1, color: INK }}>
        {label}
      </Text>
      <Text className="font-nun-heavy" style={{ fontSize: 17, color: INK }}>
        {value}
      </Text>
    </View>
  );
}

const STATE_LABEL = {
  strong: { vi: 'Vững', en: 'Strong', color: '#16803D', bg: '#DDF5E7' },
  ok: { vi: 'Tạm ổn', en: 'OK', color: '#A16207', bg: '#FFF1CC' },
  weak: { vi: 'Cần luyện', en: 'Needs work', color: '#C2272D', bg: '#FFE3E3' },
  none: { vi: 'Chưa đo', en: 'Not measured', color: '#6E6890', bg: '#EFEAFD' },
} as const;

function CriterionCell({ c, first, wide, L, locale }: { c: CriterionResult; first: boolean; wide: boolean; L: (vi: string, en: string) => string; locale: 'vi' | 'en' }) {
  const def = CRITERION_BY_ID[c.id];
  const st = STATE_LABEL[c.state];
  return (
    <View style={{ flex: wide ? 1 : undefined, flexDirection: wide ? 'column' : 'row', alignItems: 'center', gap: wide ? 6 : 14, borderLeftWidth: wide && !first ? 1 : 0, borderColor: '#E6E1F5', paddingHorizontal: wide ? 8 : 0 }}>
      <View style={{ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: CRITERION_COLOR[c.id] }}>
        <Text className="font-nun-heavy" style={{ fontSize: 13, color: '#FFFFFF' }}>
          {def.short}
        </Text>
      </View>
      <View style={{ alignItems: wide ? 'center' : 'flex-start', flex: wide ? undefined : 1 }}>
        <Text className="font-nun-heavy" style={{ fontSize: 30, lineHeight: 34, color: INK }}>
          {c.score10 === null ? '—' : c.score10.toFixed(1)}
        </Text>
        <Text className="font-nun-heavy" style={{ fontSize: 12, lineHeight: 16, color: '#5A4E8C', textAlign: wide ? 'center' : 'left' }}>
          {bi(def.title, locale)}
        </Text>
        <Text className="font-nun-strong" style={{ fontSize: 12, color: '#6E6890', marginTop: 2 }}>
          {c.total ? `${c.correct}/${c.total} ${L('câu', 'q')}` : L('chưa có câu', 'no questions')}
        </Text>
        <View style={{ marginTop: 6, backgroundColor: st.bg, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 2 }}>
          <Text className="font-nun-heavy" style={{ fontSize: 12, color: st.color }}>
            {bi(st, locale)}
          </Text>
        </View>
      </View>
    </View>
  );
}

function Bar({ label, pct, right, color, wideLabel }: { label: string; pct: number | null; right: string; color: string; wideLabel?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <Text className="font-nun-heavy" numberOfLines={1} style={{ width: wideLabel ? 150 : 40, fontSize: 13, color: INK }}>
        {label}
      </Text>
      <View style={{ flex: 1, height: 10, borderRadius: 6, backgroundColor: '#EFEAFD', overflow: 'hidden' }}>
        <View style={{ width: `${(pct ?? 0) * 100}%`, height: 10, borderRadius: 6, backgroundColor: color }} />
      </View>
      <Text className="font-nun-heavy" style={{ width: 84, textAlign: 'right', fontSize: 12, color: '#5A4E8C' }}>
        {right}
      </Text>
    </View>
  );
}

function QuestionCard({ it, no, open, onToggle, locale, L }: { it: AttemptItem; no: number; open: boolean; onToggle: () => void; locale: 'vi' | 'en'; L: (vi: string, en: string) => string }) {
  const q = INDEX.get(it.qid)!;
  const status = it.picked === null ? 'skipped' : it.picked === it.answer ? 'correct' : 'wrong';
  const tone = { correct: { c: '#16A34A', bg: '#DDF5E7', t: L('Đúng', 'Correct') }, wrong: { c: '#E5484D', bg: '#FFE3E3', t: L('Sai', 'Wrong') }, skipped: { c: '#D99A12', bg: '#FFF1CC', t: L('Bỏ qua', 'Skipped') } }[status];
  const guide = KIND_GUIDE[it.kind];
  const [guideOpen, setGuideOpen] = useState<'steps' | 'pitfall' | null>(null);
  return (
    <View style={{ borderRadius: 16, borderWidth: 2, borderColor: open ? INK : '#E6E1F5', backgroundColor: '#FFFFFF', overflow: 'hidden' }}>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={onToggle} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 }}>
        <View style={{ width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: tone.bg }}>
          <Text className="font-nun-heavy" style={{ fontSize: 13, color: tone.c }}>
            {no}
          </Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text className="font-nun-heavy" numberOfLines={open ? 3 : 1} style={{ fontSize: 14, lineHeight: 19, color: INK }}>
            {q.prompt}
          </Text>
          <Text className="font-nun-strong" style={{ fontSize: 12, color: '#6E6890' }}>
            {bi(HSA_KIND_LABEL[it.kind], locale)} · {it.level}
          </Text>
        </View>
        <View style={{ backgroundColor: tone.bg, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 }}>
          <Text className="font-nun-heavy" style={{ fontSize: 12, color: tone.c }}>
            {tone.t}
          </Text>
        </View>
        <Icon name={open ? 'chevron-up' : 'chevron-down'} size={16} color={INK} strokeWidth={2.4} />
      </Pressable>
      {open ? (
        <View style={{ paddingHorizontal: 12, paddingBottom: 14, gap: 10 }}>
          {q.context ? (
            <View style={{ borderLeftWidth: 4, borderColor: '#CFC6EE', paddingLeft: 12 }}>
              <Text className="font-nun-strong" style={{ fontSize: 14, lineHeight: 22, color: '#3F356F' }}>
                {q.context}
              </Text>
            </View>
          ) : null}
          <View style={{ gap: 6 }}>
            {q.choices.map((choice, i) => {
              const isAnswer = i === it.answer;
              const isPick = i === it.picked;
              const bad = isPick && !isAnswer;
              return (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 10, borderRadius: 12, borderWidth: 2, borderColor: isAnswer ? '#16A34A' : bad ? '#E5484D' : '#E6E1F5', backgroundColor: isAnswer ? '#F1FBF5' : bad ? '#FFF4F4' : '#FFFFFF' }}>
                  <Text className="font-nun-heavy" style={{ width: 20, fontSize: 14, color: isAnswer ? '#16803D' : bad ? '#C2272D' : '#6E6890' }}>
                    {String.fromCharCode(65 + i)}
                  </Text>
                  <Text className="font-nun-strong" style={{ flex: 1, fontSize: 14, lineHeight: 20, color: INK }}>
                    {choice}
                  </Text>
                  {isAnswer ? <Text className="font-nun-heavy" style={{ fontSize: 12, color: '#16803D' }}>{L('Đáp án', 'Answer')}</Text> : null}
                  {bad ? <Text className="font-nun-heavy" style={{ fontSize: 12, color: '#C2272D' }}>{L('Bạn chọn', 'Your pick')}</Text> : null}
                </View>
              );
            })}
          </View>
          <View style={{ borderRadius: 12, backgroundColor: '#F3F0FB', padding: 12 }}>
            <Text className="font-nun-heavy" style={{ fontSize: 12, letterSpacing: 1, color: '#5A4E8C' }}>
              {L('GIẢI THÍCH', 'EXPLANATION')}
            </Text>
            <Text className="font-nun-strong" style={{ fontSize: 14, lineHeight: 22, color: INK, marginTop: 4 }}>
              {bi(q.explanation, locale)}
            </Text>
          </View>
          {(
            [
              ['steps', L('Cách làm mẫu', 'Model approach'), '#FFE08A', guide.steps],
              ['pitfall', L('Lỗi hay gặp', 'Common mistake'), '#FFC9C9', guide.pitfall],
            ] as const
          ).map(([key, label, badge, text]) => (
            <View key={key} style={{ borderRadius: 12, borderWidth: 2, borderColor: INK, overflow: 'hidden' }}>
              <Pressable accessibilityRole="button" accessibilityState={{ expanded: guideOpen === key }} onPress={() => setGuideOpen(guideOpen === key ? null : key)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10 }}>
                <View style={{ backgroundColor: badge, borderWidth: 2, borderColor: INK, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 1 }}>
                  <Text className="font-nun-heavy" style={{ fontSize: 12, color: INK }}>
                    {it.level}
                  </Text>
                </View>
                <Text className="font-nun-heavy" style={{ flex: 1, fontSize: 14, color: INK }}>
                  {label}
                </Text>
                <Icon name={guideOpen === key ? 'chevron-up' : 'chevron-down'} size={16} color={INK} strokeWidth={2.4} />
              </Pressable>
              {guideOpen === key ? (
                <View style={{ backgroundColor: '#F7F3E8', padding: 12 }}>
                  <Text className="font-nun-strong" style={{ fontSize: 14, lineHeight: 22, color: INK }}>
                    {bi(text, locale)}
                  </Text>
                </View>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
