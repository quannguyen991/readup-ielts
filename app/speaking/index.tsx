import React, { useMemo, useState } from 'react';
import { Image, Modal, Platform, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Appear } from '@/components/motion/Motion';
import { Badge, Button, Card, Icon } from '@/components/ui';
import { SPEAKING_FORECAST, type SpeakingSample } from '@/data/speaking-forecast';
import { CUE_CARDS, PART1_TOPICS } from '@/services/speaking/bank';
import { useSpeakingStore } from '@/store/useSpeakingStore';
import { useStreak } from '@/store/useStudyStore';
import { useL } from '@/i18n/useL';

const SHADOW = '0 8px 24px rgba(15,23,42,0.08), 0 2px 6px rgba(15,23,42,0.04)';

export default function SpeakingLobby() {
  const { L } = useL();
  const { width } = useWindowDimensions();
  const wide = width >= 960;

  const attempts = useSpeakingStore((s) => s.attempts);
  const { current: streak } = useStreak();

  // Thống kê
  const weekSessions = useMemo(() => {
    const oneWeekAgo = Date.now() - 7 * 86400000;
    return attempts.filter((a) => new Date(a.startedAt).getTime() >= oneWeekAgo).length;
  }, [attempts]);

  const avgBand = useMemo(() => {
    const graded = attempts.filter((a) => !a.typed && a.grade?.overall != null).slice(0, 7);
    if (!graded.length) return '—';
    const sum = graded.reduce((acc, a) => acc + (a.grade!.overall as number), 0);
    return (sum / graded.length).toFixed(1);
  }, [attempts]);

  // Modal Forecast & Sample 8.0
  const [forecastModalOpen, setForecastModalOpen] = useState(false);
  const [selectedQuarter, setSelectedQuarter] = useState<'Q3-2026' | 'Q2-2026'>('Q3-2026');
  const [selectedPart, setSelectedPart] = useState<'all' | 1 | 2 | 3>('all');
  const [activeSample, setActiveSample] = useState<SpeakingSample | null>(null);

  // Modal Speaking Roulette
  const [rouletteModalOpen, setRouletteModalOpen] = useState(false);
  const [drawnCard, setDrawnCard] = useState<any>(null);

  const filteredForecast = useMemo(() => {
    return SPEAKING_FORECAST.filter((item) => {
      if (item.quarter !== selectedQuarter) return false;
      if (selectedPart !== 'all' && item.part !== selectedPart) return false;
      return true;
    });
  }, [selectedQuarter, selectedPart]);

  const spinRoulette = () => {
    const pool = [...PART1_TOPICS.map((t) => ({ type: 'Part 1', title: t.titleEn, vi: t.titleVi, raw: t })), ...CUE_CARDS.map((c) => ({ type: 'Part 2 & 3', title: c.card.text, vi: c.titleVi, raw: c }))];
    const picked = pool[Math.floor(Math.random() * pool.length)];
    setDrawnCard(picked);
    setRouletteModalOpen(true);
  };

  return (
    <Screen>
      {/* -------------------- Top Stat Bar -------------------- */}
      <View className="mb-6 flex-row items-center justify-center gap-3">
        <View className="items-center rounded-2xl border-2 border-slate-900 bg-white px-7 py-3 shadow-sm">
          <Text className="font-heavy text-sectionTitle text-slate-950">{weekSessions}</Text>
          <Text className="font-strong tracking-wide text-slate-500 text-[11px] uppercase">
            {L('SESSIONS (TUẦN)', 'SESSIONS (WEEK)')}
          </Text>
        </View>

        <View className="items-center rounded-2xl border-2 border-slate-900 bg-white px-7 py-3 shadow-sm">
          <Text className="font-heavy text-sectionTitle text-slate-950">{avgBand}</Text>
          <Text className="font-strong tracking-wide text-slate-500 text-[11px] uppercase">
            {L('AVG BAND (7 LẦN)', 'AVG BAND (LAST 7)')}
          </Text>
        </View>

        <View className="items-center rounded-2xl border-2 border-slate-900 bg-white px-7 py-3 shadow-sm">
          <Text className="font-heavy text-sectionTitle text-slate-950">{streak}</Text>
          <Text className="font-strong tracking-wide text-slate-500 text-[11px] uppercase">
            {L('NGÀY LIÊN TIẾP', 'DAY STREAK')}
          </Text>
        </View>
      </View>

      {/* -------------------- Bento Grid (Matching Screenshots) -------------------- */}
      <View style={{ flexDirection: wide ? 'row' : 'column', gap: 18 }}>
        {/* THẺ TÍM TRÁI (Luyện tập bộ đề thi thật quá khứ) */}
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/speaking/room' as never)}
          style={{
            flex: wide ? 1 : undefined,
            minHeight: wide ? 460 : 340,
            borderRadius: 26,
            padding: 24,
            backgroundColor: '#DCD4FB',
            justifyContent: 'space-between',
            boxShadow: SHADOW,
          }}
        >
          <View>
            <Text className="font-heavy text-sectionTitle text-[#2B1B67]" style={{ lineHeight: 32 }}>
              {L('Luyện tập với các bộ đề được sưu tập từ các bộ câu hỏi thi thật ở quá khứ', 'Practise with authentic questions collected from real past IELTS exams')}
            </Text>
          </View>

          {/* Minh hoạ sách */}
          <View className="items-center justify-center py-4">
            <View className="relative h-44 w-36 rotate-[-6deg] items-center justify-center rounded-xl bg-[#1C2C5E] p-4 shadow-xl">
              <Text className="text-center font-strong text-[11px] uppercase tracking-wider text-amber-300">IELTS</Text>
              <Text className="mt-1 text-center font-heavy text-cardTitle text-white">SPEAKING</Text>
              <Text className="mt-2 text-center font-sans text-[10px] text-slate-300">REAL EXAM QUESTIONS</Text>
            </View>
          </View>

          {/* Dải nút tròn danh mục */}
          <View className="flex-row items-center justify-between rounded-pill bg-white/80 p-2 shadow-sm">
            {['Reading', 'Writing', 'Listening', 'Speaking', 'Tests', 'History'].map((tab, idx) => (
              <View key={idx} className="items-center px-1.5">
                <Text className="font-strong text-[10px] text-[#2B1B67]">{tab}</Text>
              </View>
            ))}
          </View>
        </Pressable>

        {/* CỘT PHẢI: Lưới các thẻ tính năng */}
        <View style={{ flex: wide ? 2 : undefined, gap: 16 }}>
          {/* THẺ HỒNG: FORECAST SPEAKING */}
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setForecastModalOpen(true);
            }}
            style={{
              borderRadius: 26,
              padding: 24,
              backgroundColor: '#F8B5C2',
              backgroundImage: 'linear-gradient(135deg, #F8B5C2 0%, #F59FA8 100%)',
              boxShadow: SHADOW,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <View style={{ flex: 1, paddingRight: 16 }}>
              <Text className="font-heavy text-sectionTitle text-[#4A1121]">
                FORECAST SPEAKING
              </Text>
              <Text className="mt-1 font-strong text-body text-[#6A1B2D]">
                {L('(Quý 3 - Tháng 9–12, 2026)', '(Quarter 3 - Sep–Dec 2026)')}
              </Text>
              <Text className="mt-2 font-sans text-label text-[#4A1121]/90" style={{ lineHeight: 20 }}>
                {L('Dự đoán và cập nhật bộ đề Speaking mới nhất — kèm bộ Quý 2 để ôn lại.', 'Latest predicted Speaking topics with model 8.0 answers, plus Q2 review.')}
              </Text>
            </View>

            {/* Minh hoạ tờ forecast lịch */}
            <View className="h-32 w-28 items-center justify-center rounded-2xl bg-white p-3 shadow-md">
              <Text className="font-heavy text-[11px] uppercase text-[#6A1B2D]">FORECAST</Text>
              <Text className="font-sans text-[9px] text-slate-500">Q3 2026</Text>
              <View className="mt-2 h-1.5 w-full rounded-full bg-pink-100">
                <View className="h-full w-3/4 rounded-full bg-pink-500" />
              </View>
              <Text className="mt-3 rounded-pill bg-slate-900 px-2 py-1 font-strong text-[9px] text-white">
                {L('Mở bộ đề', 'Explore')}
              </Text>
            </View>
          </Pressable>

          {/* HÀNG 2 THẺ: SPEAKING ROULETTE & SHADOWING */}
          <View style={{ flexDirection: wide ? 'row' : 'column', gap: 16 }}>
            {/* THẺ XANH: SPEAKING ROULETTE */}
            <Pressable
              accessibilityRole="button"
              onPress={spinRoulette}
              style={{
                flex: 1,
                borderRadius: 24,
                padding: 22,
                backgroundColor: '#1E4D40',
                boxShadow: SHADOW,
                minHeight: 180,
                justifyContent: 'space-between',
              }}
            >
              <View>
                <Text className="font-heavy text-cardTitle text-white">SPEAKING ROULETTE</Text>
                <Text className="mt-1 font-sans text-label text-emerald-100">
                  {L('Rút thẻ ngẫu nhiên, luyện tập P1/P2/P3 như thi thật.', 'Draw random cards to simulate real exam pressure.')}
                </Text>
              </View>

              <View className="flex-row items-center justify-end gap-2 pt-3">
                <View className="h-14 w-11 rotate-[-8deg] items-center justify-center rounded-lg bg-amber-400 shadow-md">
                  <Text className="font-heavy text-slate-900 text-body">?</Text>
                </View>
                <View className="h-16 w-12 rotate-[6deg] items-center justify-center rounded-lg bg-amber-300 shadow-lg">
                  <Text className="font-heavy text-slate-950 text-cardTitle">★</Text>
                </View>
              </View>
            </Pressable>

            {/* THẺ VÀNG: SHADOWING MODE */}
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/shadow' as never)}
              style={{
                flex: 1,
                borderRadius: 24,
                padding: 22,
                backgroundColor: '#F5D061',
                boxShadow: SHADOW,
                minHeight: 180,
                justifyContent: 'space-between',
              }}
            >
              <View>
                <Text className="font-heavy text-cardTitle text-[#3A2A05]">SHADOWING MODE</Text>
                <Text className="mt-1 font-sans text-label text-[#4A370A]">
                  {L('Nghe và nhại theo video YouTube để chuẩn hóa ngữ điệu.', 'Listen and repeat after native YouTube videos to master natural rhythm.')}
                </Text>
              </View>

              {/* Minh hoạ video wave */}
              <View className="flex-row items-center justify-between rounded-xl bg-white/90 p-2.5 shadow-sm">
                <View className="h-8 w-11 items-center justify-center rounded-md bg-red-600">
                  <Icon name="play" size={16} color="#FFFFFF" strokeWidth={3} />
                </View>
                <Text className="font-mono text-label text-slate-700">~ ∿ ∿ ∿ ~</Text>
                <Text className="font-strong text-[11px] text-slate-500">VOA & BBC</Text>
              </View>
            </Pressable>
          </View>
        </View>
      </View>

      {/* -------------------- Hàng 2: Premium Speaking & Sample 8.0 -------------------- */}
      <View style={{ flexDirection: wide ? 'row' : 'column', gap: 18, marginTop: 18 }}>
        {/* THẺ CAM: PREMIUM SPEAKING (AI PHÂN TÍCH CHUYÊN SÂU) */}
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/speaking/room' as never)}
          style={{
            flex: wide ? 1.6 : undefined,
            borderRadius: 26,
            padding: 24,
            backgroundColor: '#F2A365',
            boxShadow: SHADOW,
            justifyContent: 'space-between',
          }}
        >
          <View>
            <Text className="font-heavy text-sectionTitle text-[#4A2007]">PREMIUM SPEAKING</Text>
            <Text className="mt-1.5 font-sans text-label text-[#4A2007]/90" style={{ lineHeight: 22 }}>
              {L(
                'Đánh giá nội dung câu trả lời, phát âm và phân tích ngữ điệu, độ nhấn, gợi ý collocations và Idiomatic expressions tự nhiên, đồng thời mô phỏng câu hỏi follow-up theo phong cách giám khảo IELTS thực tế.',
                'Comprehensive AI scoring on Pronunciation, Fluency, Stress & Rhythm, natural idioms, and authentic examiner follow-up simulations.'
              )}
            </Text>
          </View>

          {/* Bảng điểm minh hoạ */}
          <View className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
            <View className="flex-row items-center justify-between border-b border-slate-100 pb-3">
              <View>
                <Text className="font-sans text-[11px] text-slate-400 uppercase">Overall Score</Text>
                <Text className="font-heavy text-sectionTitle text-slate-900">8.0</Text>
                <Text className="font-strong text-[10px] text-emerald-600">Great performance! ★★★★★</Text>
              </View>
              <View className="items-end">
                <Text className="font-sans text-[11px] text-slate-400 uppercase">Pronunciation</Text>
                <Text className="font-heavy text-cardTitle text-slate-800">8.5</Text>
                <Text className="font-sans text-[10px] text-slate-500">Very Good</Text>
              </View>
              <View className="items-end">
                <Text className="font-sans text-[11px] text-slate-400 uppercase">Fluency & Rhythm</Text>
                <Text className="font-heavy text-cardTitle text-slate-800">7.5</Text>
                <Text className="font-sans text-[10px] text-slate-500">Good</Text>
              </View>
            </View>

            <View className="mt-3 flex-row flex-wrap items-center gap-1.5">
              <Text className="font-strong text-[11px] text-slate-700">Collocations & Idioms:</Text>
              {['make a decision', 'keep in mind', 'a wide range of', 'take the plunge'].map((col, idx) => (
                <View key={idx} className="rounded-md bg-orange-100 px-2 py-0.5">
                  <Text className="font-sans text-[11px] text-orange-900">{col}</Text>
                </View>
              ))}
            </View>
          </View>
        </Pressable>

        {/* THẺ ĐEN: SAMPLE 8.0 SPEAKING */}
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setForecastModalOpen(true);
            setSelectedPart('all');
          }}
          style={{
            flex: wide ? 1 : undefined,
            borderRadius: 26,
            padding: 24,
            backgroundColor: '#1E293B',
            boxShadow: SHADOW,
            justifyContent: 'space-between',
          }}
        >
          <View>
            <View className="flex-row items-center justify-between">
              <Text className="font-strong text-label uppercase tracking-widest text-slate-400">SAMPLE</Text>
              <View className="rounded-md bg-amber-400 px-2 py-0.5">
                <Text className="font-heavy text-[11px] text-slate-950">8.0</Text>
              </View>
            </View>

            <Text className="mt-2 font-heavy text-sectionTitle text-white">8.0 SPEAKING</Text>
            <Text className="mt-2 font-sans text-label text-slate-300">
              {L('Biên soạn bởi giáo viên 10 lần 8.5 IELTS — phân tích chi tiết từ vựng C1/C2 và cấu trúc ăn điểm.', 'Authored by 8.5 IELTS instructors with C1/C2 vocabulary breakdowns.')}
            </Text>
          </View>

          <View className="mt-6 flex-row items-center justify-between border-t border-slate-700 pt-3">
            <Text className="font-strong text-label text-amber-300">{L('Khám phá ngân hàng bài mẫu →', 'Explore samples →')}</Text>
            <Icon name="arrow-right" size={16} color="#FCD34D" />
          </View>
        </Pressable>
      </View>

      {/* -------------------- Dải Banner LỒNG TIẾNG BBC · TED-ED -------------------- */}
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/speaking/long-tieng' as never)}
        style={{
          marginTop: 18,
          borderRadius: 26,
          padding: 24,
          backgroundColor: '#BAE6FD',
          backgroundImage: 'linear-gradient(135deg, #BAE6FD 0%, #93C5FD 100%)',
          boxShadow: SHADOW,
          flexDirection: wide ? 'row' : 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <View style={{ flex: 1 }}>
          <View className="self-start rounded-pill bg-[#0369A1] px-3 py-1">
            <Text className="font-heavy text-[10px] tracking-wider text-white uppercase">✨ {L('MỚI', 'NEW')}</Text>
          </View>
          <Text className="mt-2 font-heavy text-sectionTitle text-[#0C4A6E]">
            LỒNG TIẾNG BBC · TED-Ed
          </Text>
          <Text className="mt-1 font-sans text-body text-[#0369A1]">
            {L('Thu giọng từng câu, xem lại video với chính giọng của bạn. Máy phân tích phát âm IPA, độ nhấn và chấm theo thang IELTS.', 'Dub sentences line by line, re-watch video with your voice. Instant IELTS pronunciation & stress analysis.')}
          </Text>
        </View>

        {/* Video mockup chip */}
        <View className="rounded-2xl border border-sky-300 bg-white p-3 shadow-md" style={{ width: wide ? 280 : '100%' }}>
          <View className="flex-row items-center justify-between">
            <Text className="font-strong text-[11px] text-slate-700">CẢNH 2 · CÂU 4/9</Text>
            <View className="rounded-pill bg-amber-100 px-2 py-0.5">
              <Text className="font-heavy text-[10px] text-amber-800">🎙️ GIỌNG BẠN</Text>
            </View>
          </View>
          <Text className="mt-2 font-sans italic text-[11px] text-slate-600" numberOfLines={2}>
            "where we have real conversations in easy English to help you learn."
          </Text>
          <View className="mt-2.5 flex-row items-center justify-between border-t border-slate-100 pt-2">
            <Text className="font-strong text-[11px] text-sky-700">{L('Vào phòng lồng tiếng', 'Enter Dubbing')}</Text>
            <Icon name="arrow-right" size={14} color="#0284C7" />
          </View>
        </View>
      </Pressable>

      {/* ======================================================== */}
      {/* MODAL: FORECAST SPEAKING & SAMPLE 8.0 VIEWER            */}
      {/* ======================================================== */}
      <Modal visible={forecastModalOpen} animationType="slide" transparent onRequestClose={() => setForecastModalOpen(false)}>
        <View className="flex-1 items-center justify-center bg-black/60 p-4">
          <View className="max-h-[90vh] w-full max-w-[850px] overflow-hidden rounded-3xl bg-white shadow-2xl">
            {/* Modal Header */}
            <View className="flex-row items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
              <View>
                <Text className="font-heavy text-cardTitle text-slate-900">
                  📚 {L('FORECAST SPEAKING & BÀI MẪU 8.0+', 'FORECAST SPEAKING & BAND 8.0+ SAMPLES')}
                </Text>
                <Text className="font-sans text-label text-slate-500">
                  {L('Bộ đề dự đoán theo Quý & Phân tích từ vựng, ngữ pháp ăn điểm', 'Quarterly forecast questions with comprehensive Band 8.0 analysis')}
                </Text>
              </View>
              <Pressable accessibilityRole="button" onPress={() => setForecastModalOpen(false)} className="rounded-full bg-slate-200 p-2">
                <Icon name="close" size={18} color="#0F172A" />
              </Pressable>
            </View>

            {/* Filter Controls */}
            <View className="flex-row flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-3">
              <View className="flex-row items-center gap-2">
                {(['Q3-2026', 'Q2-2026'] as const).map((q) => (
                  <Pressable
                    key={q}
                    onPress={() => setSelectedQuarter(q)}
                    className="rounded-pill px-3 py-1.5"
                    style={{ backgroundColor: selectedQuarter === q ? '#0F172A' : '#F1F5F9' }}
                  >
                    <Text className="font-strong text-label" style={{ color: selectedQuarter === q ? '#FFFFFF' : '#475569' }}>
                      {q === 'Q3-2026' ? L('Quý 3/2026 (Mới nhất)', 'Q3 2026 (Latest)') : L('Quý 2/2026 (Ôn lại)', 'Q2 2026 (Review)')}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <View className="flex-row items-center gap-1.5">
                {(['all', 1, 2, 3] as const).map((p) => (
                  <Pressable
                    key={p}
                    onPress={() => setSelectedPart(p)}
                    className="rounded-pill px-2.5 py-1"
                    style={{ backgroundColor: selectedPart === p ? '#2563EB' : '#F1F5F9' }}
                  >
                    <Text className="font-semi text-[11px]" style={{ color: selectedPart === p ? '#FFFFFF' : '#475569' }}>
                      {p === 'all' ? L('Tất cả', 'All') : `Part ${p}`}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Content List */}
            <ScrollView style={{ maxHeight: 520 }} contentContainerStyle={{ padding: 24, gap: 16 }}>
              {filteredForecast.map((item) => (
                <View key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2">
                      <View className="rounded-pill bg-blue-100 px-2.5 py-0.5">
                        <Text className="font-heavy text-[11px] text-blue-900">PART {item.part}</Text>
                      </View>
                      <Text className="font-strong text-body text-slate-800">{item.topicVi} ({item.topic})</Text>
                    </View>
                    <View className="rounded-pill bg-amber-100 px-2.5 py-0.5">
                      <Text className="font-heavy text-[11px] text-amber-900">BAND {item.targetBand.toFixed(1)}</Text>
                    </View>
                  </View>

                  <Text className="mt-3 font-heavy text-bodyLg text-slate-900">
                    {item.question}
                  </Text>

                  {item.cueBullets?.length ? (
                    <View className="mt-2 gap-1 rounded-xl bg-slate-50 p-3">
                      <Text className="font-strong text-[11px] text-slate-600">You should say:</Text>
                      {item.cueBullets.map((b, i) => (
                        <Text key={i} className="font-sans text-[12px] text-slate-700">• {b}</Text>
                      ))}
                    </View>
                  ) : null}

                  {/* Sample Answer Box */}
                  <View className="mt-3 rounded-xl border border-emerald-200 bg-[#F0FDF4] p-4">
                    <Text className="font-strong uppercase tracking-wider text-[11px] text-emerald-800">
                      🌟 {L('BÀI MẪU BAND 8.0+', 'BAND 8.0+ SAMPLE ANSWER')}
                    </Text>
                    <Text className="mt-2 font-sans text-body text-slate-900" style={{ lineHeight: 24 }}>
                      {item.sampleAnswer}
                    </Text>

                    <Text className="mt-2 border-t border-emerald-100 pt-2 font-sans text-label text-slate-600">
                      {item.sampleAnswerVi}
                    </Text>
                  </View>

                  {/* Collocations & Vocabulary */}
                  <View className="mt-3 gap-2">
                    <Text className="font-strong text-[12px] text-slate-700">💎 {L('Collocations & Idioms ăn điểm:', 'Key Collocations & Idioms:')}</Text>
                    <View className="flex-row flex-wrap gap-1.5">
                      {item.collocationsAndIdioms.map((col, idx) => (
                        <View key={idx} className="rounded-md bg-amber-50 px-2 py-1 border border-amber-200">
                          <Text className="font-semi text-[11px] text-amber-950">{col}</Text>
                        </View>
                      ))}
                    </View>

                    <View className="mt-1 flex-row flex-wrap gap-2">
                      {item.keyVocabulary.map((kv, idx) => (
                        <View key={idx} className="flex-row items-center gap-1 rounded bg-slate-100 px-2 py-0.5">
                          <Text className="font-strong text-[11px] text-slate-800">{kv.word}</Text>
                          <Text className="font-mono text-[10px] text-slate-500">{kv.ipa}</Text>
                          <Text className="font-sans text-[10px] text-slate-600">: {kv.meaningVi}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                      setForecastModalOpen(false);
                      router.push(`/speaking/room?mode=p${item.part}` as never);
                    }}
                    className="mt-4 self-end rounded-pill bg-slate-900 px-4 py-2"
                  >
                    <Text className="font-strong text-label text-white">
                      🎙️ {L('Luyện nói đề này với AI', 'Practise this with AI')}
                    </Text>
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL: SPEAKING ROULETTE DRAW RESULT                     */}
      {/* ======================================================== */}
      <Modal visible={rouletteModalOpen} animationType="fade" transparent onRequestClose={() => setRouletteModalOpen(false)}>
        <View className="flex-1 items-center justify-center bg-black/65 p-4">
          <View className="w-full max-w-[500px] rounded-3xl bg-white p-6 shadow-2xl">
            <View className="items-center">
              <View className="h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 shadow-md">
                <Text className="font-heavy text-cardTitle text-white">🎰</Text>
              </View>
              <Text className="mt-3 font-heavy text-cardTitle text-slate-900">SPEAKING ROULETTE</Text>
              <Text className="font-sans text-label text-slate-500">{L('Đã rút được thẻ đề ngẫu nhiên!', 'Random card drawn!')}</Text>
            </View>

            {drawnCard ? (
              <View className="mt-5 rounded-2xl border-2 border-emerald-500 bg-[#ECFDF5] p-5">
                <View className="self-start rounded-pill bg-emerald-700 px-3 py-0.5">
                  <Text className="font-heavy text-[11px] text-white uppercase">{drawnCard.type}</Text>
                </View>
                <Text className="mt-3 font-heavy text-sectionTitle text-emerald-950">
                  {drawnCard.title}
                </Text>
                <Text className="mt-1 font-sans text-body text-emerald-800">
                  {drawnCard.vi}
                </Text>
              </View>
            ) : null}

            <View className="mt-6 flex-row items-center gap-3">
              <Button
                className="flex-1"
                variant="secondary"
                label={L('Rút thẻ khác', 'Spin again')}
                onPress={spinRoulette}
              />
              <Button
                className="flex-1"
                variant="brand"
                label={L('Vào phòng thi ngay', 'Start now')}
                onPress={() => {
                  setRouletteModalOpen(false);
                  router.push('/speaking/room' as never);
                }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
