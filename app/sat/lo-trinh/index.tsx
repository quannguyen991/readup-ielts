import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { useHydrated } from '@/components/layout/useHydrated';
import { Appear } from '@/components/motion/Motion';
import { ChapterSticker, LevelDots, levelState } from '@/components/sat-roadmap/RoadmapUi';
import { WindingTrail } from '@/components/learning-path/WindingTrail';
import { PHASES, ROAD_CHAPTERS, type RoadChapter } from '@/data/sat-roadmap';
import { VOCAB_ROADMAP_PHASES, TOTAL_VOCAB_UNITS, TOTAL_VOCAB_WORDS, type VocabRoadmapUnit } from '@/data/sat-vocab-roadmap';
import { SAT_RW_UNITS, SAT_RW_DOMAINS, SAT_RW_TOTAL_BANK, SAT_RW_REAL_TEST_CRAFT_QUESTIONS } from '@/data/sat-rw-repository';
import { SAT_5_STEP_METHOD, SAT_BOOK_CATALOG, SAT_CONTEXT_CLUES, SAT_TRANSITION_GROUPS } from '@/data/sat-methods';
import { SAT_MATH_REAL_TEST_QUESTIONS } from '@/data/sat-math-real-tests';
import { useSatRoadmapStore } from '@/store/useSatRoadmapStore';
import { satQuizKey, useSatQuizStore } from '@/store/useSatQuizStore';
import { useSatRwStore } from '@/store/useSatRwStore';
import { useL } from '@/i18n/useL';
import { AiRoadmapAdvisor } from '@/components/sat-roadmap/AiRoadmapAdvisor';
import { DailyPlanViewer } from '@/components/sat-roadmap/DailyPlanViewer';
import { BilingualReadingCard, SAMPLE_BILINGUAL_PASSAGES } from '@/components/sat-roadmap/BilingualReadingCard';
import { ExamVocabExplorer } from '@/components/sat-roadmap/ExamVocabExplorer';

const CARD = { boxShadow: '0 2px 14px rgba(34,35,31,0.06)' } as object;

type Track = 'daily' | 'exam_vocab' | 'bilingual' | 'vocab' | 'rw' | 'math' | 'books';

export default function SatRoadmapScreen() {
  const [track, setTrack] = useState<Track>('daily');
  const [vocabPhaseFilter, setVocabPhaseFilter] = useState<number | 'all'>('all');
  const hydrated = useHydrated();
  const { L, en } = useL();

  // Stores
  const savedProgress = useSatRoadmapStore((s) => s.progress);
  const mathProgress = hydrated ? savedProgress : {};
  const quizBest = useSatQuizStore((s) => s.best);
  const rwAttempts = useSatRwStore((s) => s.attempts);

  // Math stats
  const mathPassed = ROAD_CHAPTERS.reduce(
    (sum, chapter) =>
      sum +
      (['easy', 'medium', 'hard'] as const).filter(
        (level) => levelState(mathProgress[chapter.id]?.[level]) === 'passed'
      ).length,
    0
  );
  const nextMath =
    ROAD_CHAPTERS.find((chapter) =>
      (['easy', 'medium', 'hard'] as const).some(
        (level) => levelState(mathProgress[chapter.id]?.[level]) !== 'passed'
      )
    ) ?? ROAD_CHAPTERS[0]!;

  // Vocab stats
  const allVocabUnits = VOCAB_ROADMAP_PHASES.flatMap((p) => p.units);
  const doneVocabQuizCount = allVocabUnits.filter((u) => {
    const b1 = quizBest[satQuizKey(u.slug, 1)];
    const b2 = quizBest[satQuizKey(u.slug, 2)];
    const b3 = quizBest[satQuizKey(u.slug, 3)];
    return (b1 && b1.score >= 8) || (b2 && b2.score >= 8) || (b3 && b3.score >= 8);
  }).length;

  return (
    <Screen>
      <Appear>
        {/* Navigation Breadcrumb */}
        <Pressable
          accessibilityRole="link"
          onPress={() => router.push('/sat' as never)}
          style={{ alignSelf: 'flex-start', marginBottom: 12 }}
        >
          <Text className="font-strong text-label" style={{ color: '#B94A70' }}>
            {L('← Tổng quan Digital SAT', '← SAT Overview')}
          </Text>
        </Pressable>

        {/* Master Hero Banner */}
        <View className="rounded-[24px] bg-white p-5" style={CARD}>
          <View className="flex-row items-center justify-between">
            <Text className="font-strong text-label uppercase tracking-[1.4px]" style={{ color: '#B94A70' }}>
              DIGITAL SAT · {L('LỘ TRÌNH TOÀN DIỆN', 'MASTER CURRICULUM ROADMAP')}
            </Text>
            <View className="rounded-full bg-emerald-50 px-3 py-1 border border-emerald-300">
              <Text className="font-heavy text-tiny text-emerald-800">
                {TOTAL_VOCAB_WORDS} TỪ · 1.238 CÂU HỎI
              </Text>
            </View>
          </View>

          <Text className="mt-1 font-heavy text-pageTitle text-ink">
            {L('Lộ trình chinh phục 1500+ Digital SAT', 'Path to 1500+ Digital SAT Mastery')}
          </Text>

          <Text className="mt-1 font-sans text-body text-muted">
            {L(
              'Toàn bộ kiến thức, từ vựng học thuật, ngân hàng câu hỏi đề thi thật và phương pháp được số hoá trực tiếp từ 27 tựa sách kinh điển và ngân hàng câu hỏi chính thức.',
              'All academic vocabulary, question banks, and methodologies compiled from 27 classic prep books and official question banks.'
            )}
          </Text>

          {/* Master 4-Track Segment Control */}
          <View className="mt-5 flex-row flex-wrap gap-2">
            {[
              { id: 'daily' as const, labelVi: '📅 Lịch học mỗi ngày & AI', labelEn: '📅 Daily Plan & AI' },
              { id: 'exam_vocab' as const, labelVi: '🔤 Từ vựng đề thi thật', labelEn: '🔤 Exam Vocab' },
              { id: 'bilingual' as const, labelVi: '🌐 Luyện đọc song ngữ', labelEn: '🌐 Bilingual Reading' },
              { id: 'vocab' as const, labelVi: `📚 Từ vựng (${TOTAL_VOCAB_UNITS} Units)`, labelEn: `📚 Vocab (${TOTAL_VOCAB_UNITS} Units)` },
              { id: 'rw' as const, labelVi: `📖 Reading & Writing (16 Units)`, labelEn: `📖 Reading & Writing (16 Units)` },
              { id: 'math' as const, labelVi: `📐 Toán học (27 Chủ đề)`, labelEn: `📐 Math (27 Topics)` },
              { id: 'books' as const, labelVi: `🏛️ Tủ sách 27 Tài liệu`, labelEn: `🏛️ 27 Books Catalog` },
            ].map((t) => {
              const active = track === t.id;
              return (
                <Pressable
                  key={t.id}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                  onPress={() => setTrack(t.id)}
                  className="rounded-2xl px-4 py-2.5 transition-all"
                  style={{
                    backgroundColor: active ? '#2B2350' : '#F3F0FB',
                    borderWidth: 1.5,
                    borderColor: active ? '#2B2350' : '#F3F0FB',
                  }}
                >
                  <Text className="font-heavy text-label" style={{ color: active ? '#FFFFFF' : '#6B6255' }}>
                    {en ? t.labelEn : t.labelVi}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </Appear>

      {/* ============================================================== */}
      {/* TRACK 0: DAILY PLAN & AI ROADMAP ADVISOR                       */}
      {/* ============================================================== */}
      {track === 'daily' && (
        <View className="mt-5" style={{ gap: 20 }}>
          <Appear index={1}>
            <AiRoadmapAdvisor />
          </Appear>
          <Appear index={2}>
            <DailyPlanViewer />
          </Appear>
        </View>
      )}

      {/* ============================================================== */}
      {/* TRACK: EXAM-EXTRACTED VOCABULARY                               */}
      {/* ============================================================== */}
      {track === 'exam_vocab' && (
        <View className="mt-5">
          <Appear index={1}>
            <ExamVocabExplorer />
          </Appear>
        </View>
      )}

      {/* ============================================================== */}
      {/* TRACK: BILINGUAL READING PASSAGES PRACTICE                     */}
      {/* ============================================================== */}
      {track === 'bilingual' && (
        <View className="mt-5" style={{ gap: 18 }}>
          <Appear index={1}>
            <View className="rounded-[22px] bg-white p-5" style={CARD}>
              <View className="flex-row items-center gap-3">
                <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 18 }}>🌐</Text>
                </View>
                <View className="flex-1">
                  <Text className="font-heavy text-cardTitle text-ink">
                    {L('Luyện Đọc Song Ngữ Đoạn Văn SAT & IELTS', 'Bilingual SAT & IELTS Reading Passages')}
                  </Text>
                  <Text className="font-sans text-label text-muted">
                    {L('Đối chiếu câu văn tiếng Anh - tiếng Việt, tra cứu từ vựng học thuật trực tiếp trong ngữ cảnh đề thi.', 'Compare English and Vietnamese sentences side-by-side with in-context academic terminology.')}
                  </Text>
                </View>
              </View>
            </View>
          </Appear>

          {SAMPLE_BILINGUAL_PASSAGES.map((p, pIdx) => (
            <Appear key={p.id} index={pIdx + 2}>
              <BilingualReadingCard passage={p} />
            </Appear>
          ))}
        </View>
      )}

      {/* ============================================================== */}
      {/* TRACK 1: VOCABULARY ROADMAP                                    */}
      {/* ============================================================== */}
      {track === 'vocab' && (
        <View className="mt-5">
          {/* Vocab Summary Card */}
          <Appear index={1}>
            <View className="rounded-[22px] bg-white p-5" style={CARD}>
              <View className="flex-row flex-wrap items-center justify-between gap-3">
                <View>
                  <Text className="font-heavy text-cardTitle text-ink">
                    {L('Lộ trình Từ vựng Học thuật 4 Chặng', '4-Phase Academic Vocabulary Roadmap')}
                  </Text>
                  <Text className="mt-0.5 font-sans text-label text-muted">
                    {L(
                      `${TOTAL_VOCAB_UNITS} Units chuẩn mực · ${TOTAL_VOCAB_WORDS} từ vựng từ sách kinh điển (Erica Meltzer, Princeton Review, College Board).`,
                      `${TOTAL_VOCAB_UNITS} curated units · ${TOTAL_VOCAB_WORDS} vocabulary words from classic SAT books.`
                    )}
                  </Text>
                </View>
                <View className="rounded-2xl bg-amber-50 px-4 py-2 border border-amber-200">
                  <Text className="font-semi text-tiny text-amber-800">{L('Tiến độ Quiz', 'Quiz Progress')}</Text>
                  <Text className="font-heavy text-body text-amber-950">{doneVocabQuizCount}/{TOTAL_VOCAB_UNITS} Units</Text>
                </View>
              </View>

              {/* Phase quick filters */}
              <View className="mt-4 flex-row flex-wrap gap-2">
                <Pressable
                  onPress={() => setVocabPhaseFilter('all')}
                  className="rounded-full px-3.5 py-1.5"
                  style={{
                    backgroundColor: vocabPhaseFilter === 'all' ? '#B94A70' : '#F3F0FB',
                  }}
                >
                  <Text
                    className="font-heavy text-tiny"
                    style={{ color: vocabPhaseFilter === 'all' ? '#FFFFFF' : '#6B6255' }}
                  >
                    {L('Tất cả 4 Chặng', 'All 4 Phases')}
                  </Text>
                </Pressable>
                {VOCAB_ROADMAP_PHASES.map((p) => (
                  <Pressable
                    key={p.phase}
                    onPress={() => setVocabPhaseFilter(p.phase)}
                    className="rounded-full px-3.5 py-1.5"
                    style={{
                      backgroundColor: vocabPhaseFilter === p.phase ? p.color : '#F3F0FB',
                    }}
                  >
                    <Text
                      className="font-heavy text-tiny"
                      style={{ color: vocabPhaseFilter === p.phase ? '#FFFFFF' : '#6B6255' }}
                    >
                      {L(`Chặng ${p.phase} (${p.units.length} Units)`, `Phase ${p.phase} (${p.units.length})`)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </Appear>

          {/* Render Phases & Units */}
          {VOCAB_ROADMAP_PHASES.filter(
            (p) => vocabPhaseFilter === 'all' || vocabPhaseFilter === p.phase
          ).map((phaseData) => (
            <View key={phaseData.phase} className="mt-6">
              <View className="mb-3 flex-row items-center gap-3">
                <View style={{ width: 12, height: 32, borderRadius: 6, backgroundColor: phaseData.color }} />
                <View className="min-w-0 flex-1">
                  <Text className="font-semi text-label uppercase tracking-[1px] text-muted">
                    {L(`CHẶNG ${phaseData.phase}`, `PHASE ${phaseData.phase}`)} · {phaseData.units.length} UNITS
                  </Text>
                  <Text className="font-heavy text-sectionTitle text-ink">
                    {en ? phaseData.titleEn : phaseData.titleVi}
                  </Text>
                  <Text className="font-sans text-label text-muted">
                    {en ? phaseData.blurbEn : phaseData.blurbVi}
                  </Text>
                </View>
              </View>

              <View style={{ gap: 12 }}>
                {phaseData.units.map((unit) => (
                  <VocabUnitCard key={unit.slug} unit={unit} phaseColor={phaseData.color} quizBest={quizBest} />
                ))}
              </View>
            </View>
          ))}
        </View>
      )}

      {/* ============================================================== */}
      {/* TRACK 2: READING & WRITING ROADMAP                             */}
      {/* ============================================================== */}
      {track === 'rw' && (
        <View className="mt-5">
          <Appear index={1}>
            <View className="rounded-[22px] bg-white p-5" style={CARD}>
              <View className="flex-row flex-wrap items-center justify-between gap-3">
                <View>
                  <Text className="font-heavy text-cardTitle text-ink">
                    {L('Lộ trình Reading & Writing 16 Tuần', '16-Week SAT Reading & Writing Roadmap')}
                  </Text>
                  <Text className="mt-0.5 font-sans text-label text-muted">
                    {L(
                      'Phân bổ theo 4 miền kỹ năng chuẩn Digital SAT với 1.139+ câu hỏi trích từ SAT Suite Question Bank và đề thi thật.',
                      'Organized into 4 official domains with 1,139+ questions from SAT Suite Question Bank & real tests.'
                    )}
                  </Text>
                </View>
                <Pressable
                  onPress={() => router.push('/sat-rw' as never)}
                  className="rounded-2xl bg-amber-500 px-4 py-2"
                >
                  <Text className="font-heavy text-label text-white">
                    {L('Vào kho R&W tổng ↗', 'Open Full R&W Bank ↗')}
                  </Text>
                </Pressable>
              </View>

              {/* 4 Domains Overview Bar */}
              <View className="mt-4 flex-row flex-wrap gap-2">
                {SAT_RW_DOMAINS.map((d) => (
                  <View
                    key={d.key}
                    className="rounded-xl px-3 py-2"
                    style={{ backgroundColor: '#F3F0FB', borderWidth: 1, borderColor: '#F3F0FB' }}
                  >
                    <Text className="font-heavy text-label text-ink">{d.key}</Text>
                    <Text className="font-sans text-tiny text-muted">{d.labelVi} · {d.percent}</Text>
                  </View>
                ))}
              </View>
            </View>
          </Appear>

          {/* Real Tests Question Bank Highlight */}
          <View
            style={{
              marginTop: 16,
              borderRadius: 22,
              backgroundColor: '#F3F0FB',
              borderWidth: 1.5,
              borderColor: '#F5DCAD',
              padding: 20,
              ...CARD,
            }}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <View className="rounded-full bg-amber-500 px-2.5 py-0.5">
                  <Text className="font-heavy text-tiny text-white">ĐỀ THI THẬT 2024–2025</Text>
                </View>
                <Text className="font-heavy text-cardTitle text-amber-950">
                  {L('Kho 261 câu Real Test Craft & Structure', '261 Real Test Craft & Structure Items')}
                </Text>
              </View>
              <Pressable
                onPress={() => router.push('/sat-rw' as never)}
                className="rounded-xl bg-amber-900 px-3 py-1.5"
              >
                <Text className="font-heavy text-tiny text-white">{L('Luyện ngay ↗', 'Practice Now ↗')}</Text>
              </Pressable>
            </View>
            <Text className="mt-2 font-sans text-body text-amber-900">
              {L(
                '148 câu Words in Context, 70 câu Text Structure và 12 câu Cross-Text trích từ SAT Suite Question Bank và đề thi thật Springboard. Tất cả đều có lời giải phân tích lỗi sai (whyWrong).',
                '148 Words in Context, 70 Text Structure, and 12 Cross-Text items with complete distractor rationales.'
              )}
            </Text>
          </View>

          {/* 16 Standard Units List */}
          <View className="mt-6" style={{ gap: 14 }}>
            {SAT_RW_UNITS.map((unit) => {
              const attempted = SAT_RW_TOTAL_BANK.filter((q) => q.unit === unit.unit && rwAttempts[q.id]).length;
              return (
                <View
                  key={unit.unit}
                  className="rounded-[20px] bg-white p-5"
                  style={{ borderWidth: 1, borderColor: '#F3F0FB', ...CARD }}
                >
                  <View className="flex-row items-baseline justify-between gap-2">
                    <View className="flex-row items-center gap-2">
                      <View className="h-7 w-7 items-center justify-center rounded-lg bg-stone-900">
                        <Text className="font-heavy text-tiny text-white">{unit.unit}</Text>
                      </View>
                      <Text className="font-heavy text-cardTitle text-ink">{unit.title}</Text>
                    </View>
                    <View className="rounded-full bg-stone-100 px-2.5 py-0.5">
                      <Text className="font-semi text-tiny text-stone-600">{unit.domain}</Text>
                    </View>
                  </View>

                  {/* Golden Rule box */}
                  <View className="mt-3 rounded-xl bg-amber-50/70 p-3.5 border border-amber-200/60">
                    <Text className="font-heavy text-tiny uppercase tracking-wider text-amber-900">
                      💡 {L('LUẬT VÀNG TỪ SÁCH', 'GOLDEN RULE FROM PREP BOOKS')}
                    </Text>
                    <Text className="mt-1 font-sans text-body text-amber-950" style={{ lineHeight: 22 }}>
                      {unit.ruleVi}
                    </Text>
                  </View>

                  <View className="mt-4 flex-row items-center justify-between">
                    <Text className="font-sans text-label text-muted">
                      {L(`Kho luyện tập: ${unit.count} câu`, `Practice bank: ${unit.count} items`)} · {L(`Đã làm: ${attempted}`, `Done: ${attempted}`)}
                    </Text>
                    <Pressable
                      onPress={() => router.push(`/sat-rw/${unit.unit}` as never)}
                      className="rounded-xl px-4 py-2"
                      style={{ backgroundColor: '#2B2350' }}
                    >
                      <Text className="font-heavy text-label text-white">
                        {L(`Luyện Unit ${unit.unit} (24 câu) →`, `Practice Unit ${unit.unit} →`)}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* ============================================================== */}
      {/* TRACK 3: MATH ROADMAP & 99 REAL TEST QUESTIONS                 */}
      {/* ============================================================== */}
      {track === 'math' && (
        <View className="mt-5">
          {/* 99 Real Tests Questions Card */}
          <Appear index={1}>
            <View
              style={{
                borderRadius: 22,
                backgroundColor: '#F0FDF4',
                borderWidth: 1.5,
                borderColor: '#A7F3D0',
                padding: 20,
                ...CARD,
              }}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <View className="rounded-full bg-emerald-600 px-3 py-1">
                    <Text className="font-heavy text-tiny text-white">ĐỀ THI THẬT 2025</Text>
                  </View>
                  <Text className="font-heavy text-cardTitle text-emerald-950">
                    {L('99 Câu Geometry & Trigonometry Đề thi thật', '99 Real Test Geometry & Trigonometry Items')}
                  </Text>
                </View>
                <Pressable
                  onPress={() => router.push('/sat/math-real-tests' as never)}
                  className="rounded-xl bg-emerald-800 px-4 py-2"
                >
                  <Text className="font-heavy text-label text-white">
                    {L('Luyện 99 câu này ↗', 'Practice 99 Questions ↗')}
                  </Text>
                </Pressable>
              </View>
              <Text className="mt-2 font-sans text-body text-emerald-900">
                {L(
                  'Toàn bộ câu hỏi hình học, lượng giác, đường tròn từ đề thi thật 2025 (Springboard). Đi kèm lời giải chi tiết và mẹo bấm Desmos siêu tốc.',
                  'Real test Geometry & Trig questions from 2025 with step-by-step solutions and Desmos speed techniques.'
                )}
              </Text>
              <View className="mt-3 flex-row flex-wrap gap-2">
                <View className="rounded-lg bg-white/80 px-2.5 py-1 border border-emerald-200">
                  <Text className="font-heavy text-tiny text-emerald-800">29 Câu Dễ</Text>
                </View>
                <View className="rounded-lg bg-white/80 px-2.5 py-1 border border-emerald-200">
                  <Text className="font-heavy text-tiny text-emerald-800">46 Câu Vừa</Text>
                </View>
                <View className="rounded-lg bg-white/80 px-2.5 py-1 border border-emerald-200">
                  <Text className="font-heavy text-tiny text-emerald-800">24 Câu Nâng Cao</Text>
                </View>
                <Pressable
                  onPress={() => router.push('/sat/desmos' as never)}
                  className="rounded-lg bg-amber-100 px-2.5 py-1 border border-amber-300"
                >
                  <Text className="font-heavy text-tiny text-amber-900">⚡ Desmos Cheat Sheet ↗</Text>
                </Pressable>
              </View>
            </View>
          </Appear>

          {/* Math Road chapters trail */}
          {([1, 2, 3, 4] as const).map((phase) => {
            const chapters = ROAD_CHAPTERS.filter((chapter) => chapter.phase === phase);
            const completed = chapters.filter((chapter) =>
              (['easy', 'medium', 'hard'] as const).every(
                (level) => levelState(mathProgress[chapter.id]?.[level]) === 'passed'
              )
            ).length;
            const phaseColor = PHASES[phase].color;

            return (
              <Appear key={phase}>
                <View className="mt-7">
                  <View className="mb-3 flex-row items-center justify-between gap-3">
                    <View className="min-w-0 flex-row items-center gap-3">
                      <View style={{ width: 12, height: 32, borderRadius: 6, backgroundColor: phaseColor }} />
                      <View className="min-w-0">
                        <Text className="font-semi text-label uppercase tracking-[1px] text-muted">
                          {L(`CHẶNG ${phase}`, `PHASE ${phase}`)}
                        </Text>
                        <Text className="font-heavy text-sectionTitle text-ink" numberOfLines={1}>
                          {en ? PHASES[phase].title.en : PHASES[phase].title.vi}
                        </Text>
                      </View>
                    </View>
                    <Text className="font-semi text-label text-muted">{completed}/{chapters.length}</Text>
                  </View>

                  <View className="overflow-hidden rounded-[24px] bg-white px-2 py-5" style={CARD}>
                    <WindingTrail
                      items={chapters.map((chapter) => ({ id: chapter.id, chapter }))}
                      rowHeight={180}
                      nodeWidth={230}
                      renderNode={({ chapter }) => (
                        <ChapterNode chapter={chapter} best={mathProgress[chapter.id]} nextId={nextMath.id} />
                      )}
                    />
                  </View>
                </View>
              </Appear>
            );
          })}
        </View>
      )}

      {/* ============================================================== */}
      {/* TRACK 4: BOOKS CATALOG & 5-STEP METHODS                        */}
      {/* ============================================================== */}
      {track === 'books' && (
        <View className="mt-5">
          {/* 5-Step Method Card */}
          <Appear index={1}>
            <View className="rounded-[22px] bg-white p-5" style={CARD}>
              <Text className="font-strong text-label uppercase tracking-[1.4px]" style={{ color: '#B94A70' }}>
                {L('PHƯƠNG PHÁP CHUẨN', 'UNIVERSAL STRATEGY')}
              </Text>
              <Text className="mt-1 font-heavy text-pageTitle text-ink">
                {L('Quy trình 5 bước giải mọi câu hỏi SAT R&W', '5-Step Universal SAT R&W Strategy')}
              </Text>

              <View className="mt-4" style={{ gap: 12 }}>
                {SAT_5_STEP_METHOD.map((step) => (
                  <View
                    key={step.step}
                    className="rounded-2xl bg-stone-50 p-4 border border-stone-200"
                  >
                    <View className="flex-row items-center gap-2">
                      <View className="h-6 w-6 items-center justify-center rounded-full bg-amber-600">
                        <Text className="font-heavy text-tiny text-white">{step.step}</Text>
                      </View>
                      <Text className="font-heavy text-cardTitle text-ink">
                        {en ? step.titleEn : step.titleVi}
                      </Text>
                    </View>
                    <Text className="mt-2 font-sans text-body text-ink">
                      {en ? step.summaryEn : step.summaryVi}
                    </Text>
                    <View className="mt-2" style={{ gap: 4 }}>
                      {step.tips.map((tip, tIdx) => (
                        <Text key={tIdx} className="font-sans text-label text-muted">
                          • {tip}
                        </Text>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </Appear>

          {/* 27 Classic Prep Books Catalog */}
          <View className="mt-7">
            <View className="mb-3">
              <Text className="font-strong text-label uppercase tracking-[1.4px]" style={{ color: '#B94A70' }}>
                TỔNG HỢP TÀI LIỆU TỪ SPREADSHEET
              </Text>
              <Text className="font-heavy text-sectionTitle text-ink">
                {L('Tủ sách 27 Tài liệu SAT Kinh điển', '27 Classic SAT Prep Books & Resources')}
              </Text>
              <Text className="font-sans text-label text-muted">
                {L(
                  'Được phân loại theo chuyên đề và đúc kết phương pháp học hiệu quả nhất cho từng cuốn.',
                  'Categorized by skill domain with actionable study advice for each title.'
                )}
              </Text>
            </View>

            <View style={{ gap: 12 }}>
              {SAT_BOOK_CATALOG.map((book) => (
                <View
                  key={book.id}
                  className="rounded-[20px] bg-white p-4"
                  style={{ borderWidth: 1, borderColor: '#F3F0FB', ...CARD }}
                >
                  <View className="flex-row items-baseline justify-between gap-2">
                    <View className="flex-row items-center gap-2">
                      <View className="h-6 w-6 items-center justify-center rounded-md bg-stone-200">
                        <Text className="font-heavy text-tiny text-stone-700">{book.id}</Text>
                      </View>
                      <Text className="font-heavy text-cardTitle text-ink">{book.title}</Text>
                    </View>
                    <View className="rounded-full bg-amber-100 px-2.5 py-0.5">
                      <Text className="font-semi text-tiny text-amber-900">{book.category} · {book.level}</Text>
                    </View>
                  </View>
                  <Text className="mt-1 font-semi text-tiny text-stone-500">
                    Tác giả: {book.author}
                  </Text>
                  <Text className="mt-2 font-sans text-body text-stone-700">
                    {book.note}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}

      <View style={{ height: 40 }} />
    </Screen>
  );
}

// ------------------------------------------------------------------ Vocab Card
function VocabUnitCard({
  unit,
  phaseColor,
  quizBest,
}: {
  unit: VocabRoadmapUnit;
  phaseColor: string;
  quizBest: ReturnType<typeof useSatQuizStore.getState>['best'];
}) {
  const { L } = useL();
  const b1 = quizBest[satQuizKey(unit.slug, 1)];
  const b2 = quizBest[satQuizKey(unit.slug, 2)];
  const b3 = quizBest[satQuizKey(unit.slug, 3)];

  const passedCount = [b1, b2, b3].filter((b) => b && b.score >= 8).length;

  return (
    <View
      className="rounded-[20px] bg-white p-5"
      style={{
        borderWidth: 1,
        borderColor: '#F3F0FB',
        ...CARD,
      }}
    >
      <View className="flex-row flex-wrap items-baseline justify-between gap-2">
        <View className="flex-row items-center gap-2.5">
          <View
            className="h-8 w-8 items-center justify-center rounded-xl"
            style={{ backgroundColor: phaseColor }}
          >
            <Text className="font-heavy text-label text-white">{unit.n}</Text>
          </View>
          <View>
            <Text className="font-heavy text-cardTitle text-ink">
              Unit {unit.n}: {unit.title}
            </Text>
            <Text className="font-sans text-tiny text-stone-500">
              {unit.sourceBook} · {unit.count} từ vựng
            </Text>
          </View>
        </View>

        {/* Quiz Level Indicators */}
        <View className="flex-row items-center gap-1.5">
          {[
            { lv: 1, label: 'Dễ', b: b1 },
            { lv: 2, label: 'Vừa', b: b2 },
            { lv: 3, label: 'Khó', b: b3 },
          ].map(({ lv, label, b }) => {
            const isPassed = b && b.score >= 8;
            return (
              <View
                key={lv}
                className="rounded-full px-2 py-0.5"
                style={{
                  backgroundColor: isPassed ? '#E7F7EF' : b ? '#F3F0FB' : '#F3F0FB',
                  borderWidth: 1,
                  borderColor: isPassed ? '#22A06B' : b ? '#C49746' : '#F3F0FB',
                }}
              >
                <Text
                  className="font-heavy text-tiny"
                  style={{ color: isPassed ? '#16814E' : b ? '#C97A9A' : '#8C827A' }}
                >
                  {label}: {b ? `${b.score}/${b.total}` : '—'}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Representative words */}
      <Text className="mt-3 font-sans text-body text-stone-600" numberOfLines={2}>
        {L('Từ trọng tâm: ', 'Key terms: ')}
        <Text className="font-semi text-ink">{unit.blurb}</Text>
      </Text>

      {/* Action Buttons */}
      <View className="mt-4 flex-row items-center justify-end gap-2.5">
        <Pressable
          onPress={() => router.push(`/vocabulary/topic/${unit.slug}` as never)}
          className="rounded-xl px-4 py-2 border border-stone-300 bg-white"
        >
          <Text className="font-heavy text-label text-stone-800">
            🎯 {L('Học từ & Flashcards', 'Study & Flashcards')}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.push(`/vocabulary/sat-quiz/${unit.slug}` as never)}
          className="rounded-xl px-4 py-2"
          style={{ backgroundColor: '#2B2350' }}
        >
          <Text className="font-heavy text-label text-white">
            ⚡ {L('Làm Quiz 3 mức →', 'Take 3-Level Quiz →')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// ------------------------------------------------------------------ Math Node
function ChapterNode({
  chapter,
  best,
  nextId,
}: {
  chapter: RoadChapter;
  best: ReturnType<typeof useSatRoadmapStore.getState>['progress'][string] | undefined;
  nextId: string;
}) {
  const { L, en } = useL();
  const passed = (['easy', 'medium', 'hard'] as const).filter(
    (level) => levelState(best?.[level]) === 'passed'
  ).length;
  const isDone = passed === 3;
  const isNext = chapter.id === nextId;

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={L(
        `Chủ đề ${chapter.n}: ${chapter.title.vi}, ${passed}/3 mức đã qua`,
        `Topic ${chapter.n}: ${chapter.title.en}, ${passed}/3 levels passed`
      )}
      onPress={() => router.push(`/sat/lo-trinh/${chapter.id}` as never)}
      style={{ width: '100%', alignItems: 'center' }}
    >
      <View
        style={{
          width: 76,
          height: 76,
          borderRadius: 38,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isDone ? '#E7F7EF' : isNext ? '#F3F0FB' : '#FFFFFF',
          borderWidth: isNext ? 3 : 2,
          borderColor: isDone ? '#22A06B' : isNext ? '#6A4BD9' : '#F3F0FB',
          boxShadow: isNext ? '0 5px 12px rgba(166,115,20,0.18)' : '0 2px 7px rgba(30,41,59,0.08)',
        } as object}
      >
        <ChapterSticker art={chapter.art} size={53} motion={false} />
        {isDone ? (
          <View
            style={{
              position: 'absolute',
              right: -2,
              bottom: -2,
              width: 23,
              height: 23,
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#22A06B',
              borderWidth: 2,
              borderColor: '#FFFFFF',
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '800' }}>✓</Text>
          </View>
        ) : null}
      </View>
      <Text className="mt-1 font-semi text-label uppercase" style={{ color: isNext ? '#6A4BD9' : '#81796D' }}>
        {L(`CHỦ ĐỀ ${chapter.n}`, `TOPIC ${chapter.n}`)}
      </Text>
      <Text className="font-heavy text-center text-body text-ink" numberOfLines={2}>
        {en ? chapter.title.en : chapter.title.vi}
      </Text>
      <View style={{ width: '74%', marginTop: 5 }}>
        <LevelDots best={best} />
      </View>
      <Text
        className="mt-1 font-semi text-center text-label"
        style={{ color: isDone ? '#16814E' : isNext ? '#6A4BD9' : '#81796D' }}
      >
        {isDone
          ? L('Hoàn thành', 'Complete')
          : isNext
          ? L('Học tiếp', 'Up next')
          : L(`${passed}/3 mức`, `${passed}/3 levels`)}
      </Text>
    </Pressable>
  );
}
