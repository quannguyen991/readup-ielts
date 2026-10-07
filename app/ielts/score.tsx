import React, { useMemo } from 'react';
import { Text, View } from 'react-native';

import { Screen } from '@/components/layout/Screen';
import { LightHero } from '@/components/layout/LightHero';
import { Card } from '@/components/ui';
import { getWritingPromptById } from '@/data/writing-repository';
import { formatBand } from '@/lib/band';
import { overallIeltsBand, writingBandMidpoint, type IeltsSkill } from '@/services/ielts/scoring';
import { useListeningStore } from '@/store/useListeningStore';
import { useSpeakingStore } from '@/store/useSpeakingStore';
import { useStudyStore } from '@/store/useStudyStore';
import { useWritingStore } from '@/store/useWritingStore';
import { useL } from '@/i18n/useL';

type ScoreCard = { skill: IeltsSkill; band: number | null; detail: string };

export default function IeltsScoreScreen() {
  const { L } = useL();
  const sessions = useStudyStore((state) => state.sessions);
  const listeningAttempts = useListeningStore((state) => state.attempts);
  const speakingAttempts = useSpeakingStore((state) => state.attempts);
  const submissions = useWritingStore((state) => state.submissions);
  const evaluations = useWritingStore((state) => state.evaluations);

  const scores = useMemo(() => {
    const reading = [...sessions]
      .filter((session) => session.exam === 'ielts' && session.estimatedBand != null)
      .sort((a, b) => b.finishedAt.localeCompare(a.finishedAt))[0];
    const listening = [...listeningAttempts]
      .sort((a, b) => b.finishedAt.localeCompare(a.finishedAt))[0];
    const speaking = [...speakingAttempts]
      .filter((attempt) => !attempt.typed && attempt.grade?.overall != null)
      .sort((a, b) => b.finishedAt.localeCompare(a.finishedAt))[0];
    const writing = [...submissions]
      .filter((submission) => getWritingPromptById(submission.promptId))
      .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
      .map((submission) => ({ submission, evaluation: evaluations.find((item) => item.submissionId === submission.id) }))
      .find((item) => item.evaluation);
    const writingBand = writing?.evaluation ? writingBandMidpoint(writing.evaluation.bandLow, writing.evaluation.bandHigh) : null;

    const cards: ScoreCard[] = [
      { skill: 'listening', band: listening?.band ?? null, detail: listening ? `${listening.score}/${listening.total} · ${listening.section == null ? L('full đề', 'full test') : L(`Section ${listening.section}`, `Section ${listening.section}`)}` : L('Chưa có bài đã chấm', 'No graded task yet') },
      { skill: 'reading', band: reading?.estimatedBand ?? null, detail: reading ? `${reading.rawScore}/${reading.total} · ${reading.articleTitle}` : L('Chưa có bài đã chấm', 'No graded task yet') },
      { skill: 'writing', band: writingBand, detail: writing ? L(`${getWritingPromptById(writing.submission.promptId)?.task === 'ielts_task1' ? 'Task 1' : 'Task 2'} · khoảng ${formatBand(writing.evaluation!.bandLow)}–${formatBand(writing.evaluation!.bandHigh)}`, `${getWritingPromptById(writing.submission.promptId)?.task === 'ielts_task1' ? 'Task 1' : 'Task 2'} · estimated range ${formatBand(writing.evaluation!.bandLow)}–${formatBand(writing.evaluation!.bandHigh)}`) : L('Nộp và chờ chấm bài viết', 'Submit an essay and wait for grading') },
      { skill: 'speaking', band: speaking?.grade?.overall ?? null, detail: speaking ? `${speaking.answers.length} ${L('câu trả lời', 'answers')} · ${speaking.titleVi}` : L('Cần bài nói đã được AI chấm', 'Needs an AI-graded speaking attempt') },
    ];
    return cards;
  }, [evaluations, listeningAttempts, sessions, speakingAttempts, submissions, L]);

  const overall = overallIeltsBand(Object.fromEntries(scores.map((score) => [score.skill, score.band])));
  const labels: Record<IeltsSkill, string> = { listening: 'Listening', reading: 'Reading', writing: 'Writing', speaking: 'Speaking' };
  const available = scores.filter((score) => score.band != null).length;

  return (
    <Screen>
      <LightHero
        scene="progress"
        badge="IELTS · SCORE REPORT"
        line1={L('Ước lượng band IELTS', 'IELTS band estimate')}
        line2={L('Tổng hợp bài gần nhất đã chấm', 'From your latest graded attempts')}
        subtitle={L('Mỗi kỹ năng lấy bài gần nhất có điểm. Writing hiển thị khoảng của bộ chấm AI; đây là ước lượng luyện tập, không phải kết quả thi chính thức.', 'Each skill uses your latest graded attempt. Writing keeps the AI grader’s score range; this is a practice estimate, not an official result.')}
      />
      <Card className="mt-4 items-center">
        <Text className="font-semi text-label uppercase text-muted">{L('Overall band ước lượng', 'Estimated overall band')}</Text>
        <Text className="mt-1 font-heavy text-stat text-primary-700">{formatBand(overall)}</Text>
        {overall == null ? (
          <Text className="mt-1 text-center font-sans text-label text-muted">{L(`Đã có ${available}/4 kỹ năng. Hoàn thành ít nhất một bài có điểm ở cả bốn kỹ năng để tính Overall.`, `${available}/4 skills have scores. Complete at least one graded task in each skill to calculate an overall band.`)}</Text>
        ) : (
          <Text className="mt-1 text-center font-sans text-label text-muted">{L('Band Overall được làm tròn theo quy tắc IELTS.', 'Overall is rounded using IELTS scoring rules.')}</Text>
        )}
      </Card>
      <View className="mt-3" style={{ gap: 9 }}>
        {scores.map((score) => (
          <Card key={score.skill}>
            <View className="flex-row flex-wrap items-center justify-between gap-3">
              <View className="min-w-0 flex-1">
                <Text className="font-heavy text-body text-ink">{labels[score.skill]}</Text>
                <Text className="mt-1 font-sans text-label text-muted" numberOfLines={2}>{score.detail}</Text>
              </View>
              <Text className="font-heavy text-stat text-primary-700">{formatBand(score.band)}</Text>
            </View>
          </Card>
        ))}
      </View>
      <Text className="mt-3 font-sans text-label text-muted" style={{ lineHeight: 20 }}>
        {L('IELTS Overall là trung bình của Listening, Reading, Writing và Speaking, làm tròn tới band hoặc nửa band gần nhất. Bài lẻ cho biết tiến bộ từng kỹ năng; hãy dùng đề full để tự đánh giá sát hơn.', 'IELTS Overall averages Listening, Reading, Writing, and Speaking, rounded to the nearest whole or half band. Individual tasks track skill progress; a full practice test gives a closer estimate.')}
      </Text>
      <View className="h-8" />
    </Screen>
  );
}
