import React, { useState } from 'react';
import { Image, Platform, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Icon } from '@/components/ui';
import { useL } from '@/i18n/useL';

type ExamType = 'toeic' | 'toefl';

export function UpdatingExamScreen({ initialExam = 'toeic' }: { initialExam?: ExamType }) {
  const { L } = useL();
  const { width } = useWindowDimensions();
  const wide = width >= 768;
  const [selectedExam, setSelectedExam] = useState<ExamType>(initialExam);

  const examInfo = {
    toeic: {
      name: 'TOEIC (Test of English for International Communication)',
      short: 'TOEIC',
      target: 'Tiếng Anh giao tiếp & công sở (450 – 990 điểm)',
      desc: 'Hệ thống luyện thi TOEIC Listening & Reading, Part 5 Grammar và Speaking & Writing đang được hoàn thiện ngân hàng đề thi chuẩn ETS mới nhất.',
      modules: [
        {
          icon: 'headphones',
          title: 'Listening Comprehension (Part 1 – 4)',
          status: 'Đang thu âm & biên tập audio chuẩn',
          detail: '100 câu hỏi nghe giọng bản ngữ Anh - Mỹ - Úc, câu hỏi mô tả tranh, hỏi đáp và hội thoại công sở.',
        },
        {
          icon: 'book',
          title: 'Reading & Grammar (Part 5 – 7)',
          status: 'Đang tổng hợp giải thích chi tiết',
          detail: 'Hơn 1,000 câu Part 5 câu chưa hoàn chỉnh, bài đọc email, thông báo và tin tức doanh nghiệp.',
        },
        {
          icon: 'mic',
          title: 'Speaking & Writing AI',
          status: 'Đang tích hợp thuật toán chấm điểm',
          detail: 'Mô phỏng bài thi nói và viết với AI chấm điểm phát âm, từ vựng và ngữ pháp trực tiếp.',
        },
        {
          icon: 'sparkle',
          title: 'Bộ 600 từ vựng TOEIC cốt lõi',
          status: 'Đang đồng bộ thẻ Flashcard 3D',
          detail: 'Chia theo 50 chủ đề kinh doanh, tài chính, hợp đồng, du lịch và nhà hàng.',
        },
      ],
    },
    toefl: {
      name: 'TOEFL iBT (Internet-based Test)',
      short: 'TOEFL iBT',
      target: 'Tiếng Anh học thuật du học (60 – 120 điểm)',
      desc: 'Hệ thống luyện thi TOEFL iBT theo cấu trúc mới nhất của ETS gồm 4 kỹ năng học thuật: Reading, Listening, Speaking và Writing.',
      modules: [
        {
          icon: 'book',
          title: 'Academic Reading Passages',
          status: 'Đang chuẩn hóa ngân hàng bài đọc',
          detail: 'Các bài đọc chuyên sâu về khoa học tự nhiên, lịch sử, tâm lý học và nghệ thuật.',
        },
        {
          icon: 'headphones',
          title: 'Campus & Lecture Listening',
          status: 'Đang tổng hợp file nghe audio',
          detail: 'Hội thoại sinh viên trong khuôn viên trường và bài giảng học thuật của giáo sư.',
        },
        {
          icon: 'mic',
          title: 'Academic Speaking Tasks',
          status: 'Đang tích hợp công nghệ AI chấm',
          detail: 'Luyện tập trả lời độc lập và tổng hợp (Integrated Speaking) với gợi ý cấu trúc câu Band cao.',
        },
        {
          icon: 'pencil',
          title: 'Writing for Academic Discussion',
          status: 'Đang xây dựng rubric chấm tự động',
          detail: 'Dạng bài viết thảo luận học thuật mới của TOEFL iBT với AI nhận xét ngữ pháp và luận điểm.',
        },
      ],
    },
  }[selectedExam];

  return (
    <Screen>
      {/* ----------------- Top Navigation & Tab Selector ----------------- */}
      <View className="mb-5 flex-row items-center justify-between">
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/' as never)}
          className="flex-row items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 shadow-sm transition-all hover:bg-stone-50"
        >
          <Icon name="chevron-left" size={16} color="#44403C" />
          <Text className="font-heavy text-[13px] text-stone-800">
            {L('‹ Về Trang chủ', '‹ Back to Home')}
          </Text>
        </Pressable>

        {/* Tab chuyển đổi giữa TOEIC và TOEFL */}
        <View className="flex-row items-center gap-1.5 rounded-full border border-stone-200 bg-white p-1 shadow-sm">
          {(['toeic', 'toefl'] as const).map((tab) => {
            const active = selectedExam === tab;
            return (
              <Pressable
                key={tab}
                accessibilityRole="button"
                onPress={() => setSelectedExam(tab)}
                className="rounded-full px-4 py-1.5 transition-all"
                style={{
                  backgroundColor: active ? '#1E1B4B' : 'transparent',
                }}
              >
                <Text
                  className="font-heavy text-[12.5px] uppercase"
                  style={{ color: active ? '#FFFFFF' : '#64748B' }}
                >
                  {tab === 'toeic' ? 'TOEIC' : 'TOEFL iBT'}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* ----------------- Hero Banner "Đang Cập Nhật" ----------------- */}
      <View
        className="relative mb-6 overflow-hidden rounded-3xl border border-amber-200 p-6 md:p-8 shadow-sm"
        style={{
          backgroundImage: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 50%, #FDE68A 100%)',
        }}
      >
        <View style={{ flexDirection: wide ? 'row' : 'column', alignItems: 'center', gap: 24 }}>
          {/* Mascot Minh họa */}
          <View className="relative items-center justify-center">
            <View
              className="h-28 w-28 items-center justify-center rounded-3xl border-2 border-white bg-white/70 shadow-lg backdrop-blur-md"
              style={{ boxShadow: '0 8px 24px rgba(217, 119, 6, 0.2)' }}
            >
              <Image
                source={{ uri: '/mascot/lion/lion-think.webp' }}
                style={{ width: 84, height: 84 }}
                resizeMode="contain"
              />
            </View>
            <View className="absolute -top-2 -right-2 rounded-full border border-amber-300 bg-amber-500 px-2 py-0.5 shadow-sm">
              <Text className="font-heavy text-[10px] text-white tracking-wider">BETA</Text>
            </View>
          </View>

          {/* Thông điệp chính */}
          <View className="flex-1 text-center md:text-left">
            <View className="flex-row items-center gap-2 self-start rounded-full border border-amber-400/80 bg-amber-100/90 px-3.5 py-1">
              <Text className="text-[12px]">🛠️</Text>
              <Text className="font-heavy text-[11.5px] text-amber-900 tracking-wider uppercase">
                {L('ĐANG CẬP NHẬT NỘI DUNG', 'CONTENT UNDER DEVELOPMENT')}
              </Text>
            </View>

            <Text className="mt-3 font-heavy text-[24px] text-amber-950 tracking-tight">
              Phần {examInfo.short} đang được cập nhật
            </Text>

            <Text className="mt-1 font-sans text-[14px] text-amber-900/90 leading-relaxed">
              {examInfo.desc}
            </Text>

            <View className="mt-3 flex-row items-center gap-2">
              <Text className="font-strong text-[12px] text-amber-800">
                🎯 Mục tiêu: {examInfo.target}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* ----------------- Danh Sách Các Hạng Mục Đang Xây Dựng ----------------- */}
      <View className="mb-6">
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="font-heavy text-[15px] text-stone-900">
            🚀 Tiến độ các hợp phần {examInfo.short}
          </Text>
          <Text className="font-sans text-[12px] text-stone-500">
            Dự kiến ra mắt trong bản phát hành tới
          </Text>
        </View>

        <View className="gap-3">
          {examInfo.modules.map((m, idx) => (
            <View
              key={idx}
              className="flex-row items-start gap-4 rounded-2xl border border-stone-200/90 bg-white p-4 shadow-sm"
            >
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-amber-50 border border-amber-200">
                <Icon name={m.icon as never} size={20} color="#D97706" />
              </View>

              <View className="flex-1">
                <View className="flex-row items-center justify-between gap-2">
                  <Text className="font-heavy text-[14px] text-stone-900">
                    {m.title}
                  </Text>
                  <View className="rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5">
                    <Text className="font-strong text-[11px] text-amber-900">
                      {m.status}
                    </Text>
                  </View>
                </View>

                <Text className="mt-1 font-sans text-[13px] text-stone-600 leading-normal">
                  {m.detail}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* ----------------- Gợi ý trải nghiệm các khoá học đã sẵn sàng ----------------- */}
      <View className="mb-8 rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 p-6 shadow-sm">
        <View className="mb-4 flex-row items-center gap-2.5">
          <Text className="text-[22px]">✨</Text>
          <View>
            <Text className="font-heavy text-[16px] text-indigo-950">
              {L('Các chương trình học đã sẵn sàng trên Band 9', 'Ready-to-study features on Band 9')}
            </Text>
            <Text className="font-sans text-[12px] text-stone-500">
              Trong lúc chờ đợi TOEIC & TOEFL, bạn có thể học ngay các tính năng đã hoàn thiện 100%:
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: wide ? 'row' : 'column', gap: 12 }}>
          {/* Card 1: Oxford 3000 */}
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/oxford' as never)}
            className="flex-1 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm transition-all hover:border-indigo-400 hover:shadow-md cursor-pointer"
          >
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-[24px]">📚</Text>
              <View className="rounded-full bg-emerald-100 px-2 py-0.5">
                <Text className="font-heavy text-[10px] text-emerald-800">18 CHỦ ĐỀ</Text>
              </View>
            </View>
            <Text className="font-heavy text-[14px] text-stone-900">Oxford 3000 & 5000</Text>
            <Text className="mt-1 font-sans text-[12px] text-stone-500">
              Học từ vựng theo chủ đề & lọc cấp độ A1–C1 kèm Flashcard và bài Quiz.
            </Text>
            <Text className="mt-3 font-strong text-[12px] text-indigo-600">Học ngay ›</Text>
          </Pressable>

          {/* Card 2: AI Speaking Hub & Lồng tiếng */}
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/hub/tutor' as never)}
            className="flex-1 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm transition-all hover:border-indigo-400 hover:shadow-md cursor-pointer"
          >
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-[24px]">🎙️</Text>
              <View className="rounded-full bg-indigo-100 px-2 py-0.5">
                <Text className="font-heavy text-[10px] text-indigo-800">COSMIC AI</Text>
              </View>
            </View>
            <Text className="font-heavy text-[14px] text-stone-900">Gia sư Luyện nói AI</Text>
            <Text className="mt-1 font-sans text-[12px] text-stone-500">
              Luyện phát âm, phỏng vấn, nói trước đám đông và phòng lồng tiếng video.
            </Text>
            <Text className="mt-3 font-strong text-[12px] text-indigo-600">Khám phá ›</Text>
          </Pressable>

          {/* Card 3: Luyện đọc IELTS */}
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/luyen-doc' as never)}
            className="flex-1 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm transition-all hover:border-indigo-400 hover:shadow-md cursor-pointer"
          >
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-[24px]">📖</Text>
              <View className="rounded-full bg-amber-100 px-2 py-0.5">
                <Text className="font-heavy text-[10px] text-amber-800">IELTS READING</Text>
              </View>
            </View>
            <Text className="font-heavy text-[14px] text-stone-900">Luyện đọc IELTS</Text>
            <Text className="mt-1 font-sans text-[12px] text-stone-500">
              Kho bài đọc phong phú với công cụ tra từ bấm trực tiếp và thi thử.
            </Text>
            <Text className="mt-3 font-strong text-[12px] text-indigo-600">Luyện đọc ›</Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}
