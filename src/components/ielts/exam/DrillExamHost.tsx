import React, { useEffect, useMemo, useState } from 'react';
import { useExamImmersive } from '@/store/useExamImmersive';
import { Pressable, Text, View } from 'react-native';

import { DrillReportView } from '@/components/ielts/DrillReportView';
import type { DrillSet } from '@/data/drill-sets';
import { useL } from '@/i18n/useL';
import { bandFor, buildReport, type ReportItem } from '@/services/ielts/drill-report';
import { useDrillSetStore } from '@/store/useDrillSetStore';

import { allItems, partFromSet, partsFromMixed, type ExamItem, type ExamSkill } from './exam-model';
import { EXAM_ROOT_ID, useExamFont } from './exam-font';
import { IeltsExamRoom, isItemCorrect, type ExamAnswers, type ExamSubmit } from './IeltsExamRoom';

/** Giây cho mỗi câu theo thời lượng đề thật: Reading 60 phút/40 câu, Listening 30 phút/40 câu (+ thời gian ghi đáp án). */
const SEC_PER_Q: Record<ExamSkill, number> = { reading: 90, listening: 60 };

function toReportItems(items: ExamItem[], answers: ExamAnswers): ReportItem[] {
  return items.map((it) => {
    const given = (answers[it.n] ?? '').trim();
    return { index: it.n, typeId: it.typeId, prompt: it.prompt, options: it.options, answer: it.answer, given: given || null, correct: isItemCorrect(it, given), why: it.why, quote: it.quote };
  });
}

/**
 * Chạy một lượt làm bài trong phòng thi IELTS rồi chấm: set luyện theo dạng (`typeId` + `set`) hoặc bài tổng hợp (`mixed`).
 * Nộp xong phòng thi chuyển sang chế độ xem lại (giải thích 3 bước từng câu); nút "Báo cáo & band" mở báo cáo chi tiết.
 */
export function DrillExamHost({
  typeId,
  set,
  skill,
  mixed = false,
  nextSetId,
  onNext,
  onExit,
}: {
  typeId: string;
  set: DrillSet;
  skill: ExamSkill;
  mixed?: boolean;
  nextSetId?: string;
  onNext: (setId: string) => void;
  onExit: () => void;
}) {
  const { L } = useL();
  useExamFont();
  const setImmersive = useExamImmersive((s) => s.set);
  useEffect(() => {
    setImmersive(true);
    return () => setImmersive(false);
  }, [setImmersive]);
  const record = useDrillSetStore((s) => s.record);
  const recordReport = useDrillSetStore((s) => s.recordReport);
  const [run, setRun] = useState(0);
  const [result, setResult] = useState<ExamSubmit | null>(null);
  const [showReport, setShowReport] = useState(false);

  const parts = useMemo(() => (mixed ? partsFromMixed(skill, set) : [partFromSet(typeId, set, skill)]), [mixed, skill, set, typeId]);
  const items = useMemo(() => allItems(parts), [parts]);

  const submit = (r: ExamSubmit) => {
    const rep = buildReport(skill, toReportItems(items, r.answers));
    record(set.id, rep.correct, rep.total);
    recordReport({ at: Date.now(), skill, label: set.title, correct: rep.correct, total: rep.total, band: bandFor(skill, rep.correct, rep.total), seconds: r.seconds }, rep.byType);
    setResult(r);
  };

  const reportItems = result ? toReportItems(items, result.answers) : [];
  const report = result ? buildReport(skill, reportItems) : null;

  return (
    <View nativeID={EXAM_ROOT_ID} style={{ flex: 1 }}>
      <View style={{ flex: 1, display: showReport ? 'none' : 'flex' }}>
        <IeltsExamRoom
          key={`${set.id}-${run}`}
          title={set.title}
          skill={skill}
          parts={parts}
          // Bài tổng hợp là bài thi thử có giới hạn giờ; set luyện theo dạng đếm lên và có chế độ luyện.
          limitSec={mixed ? items.length * SEC_PER_Q[skill] : undefined}
          practiceDefault={!mixed}
          onExit={onExit}
          onSubmit={submit}
          onReport={() => setShowReport(true)}
          onRetry={() => { setResult(null); setShowReport(false); setRun((n) => n + 1); }}
          onNext={nextSetId ? () => onNext(nextSetId) : undefined}
          nextLabel={mixed ? L('Làm bài khác', 'Another test') : L('Set tiếp theo', 'Next set')}
        />
      </View>
      {showReport && result && report ? (
        <View style={{ flex: 1 }}>
          <DrillReportView
            report={report}
            items={reportItems}
            title={set.title}
            seconds={result.seconds}
            actions={
              <View className="flex-row gap-3">
                <Pressable onPress={() => setShowReport(false)} className="flex-1 items-center rounded-xl border border-border bg-surface py-3">
                  <Text className="font-strong text-label text-ink">{L('← Xem lại giải thích', '← Review answers')}</Text>
                </Pressable>
                <Pressable onPress={onExit} className="flex-1 items-center rounded-xl bg-primary py-3">
                  <Text className="font-strong text-label text-white">{L('Quay lại', 'Back')}</Text>
                </Pressable>
              </View>
            }
          />
        </View>
      ) : null}
    </View>
  );
}
