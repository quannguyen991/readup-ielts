import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Icon } from '@/components/ui/Icon';
import { useL } from '@/i18n/useL';
import { PRESENTATION_COURSE, courseById, type Lesson } from '@/services/hub/presentation-course';

type LessonItem = {
  id: string;
  icon: string;
  iconBg: string;
  title: string;
  tag: 'LEARN' | 'QUIZ' | 'CAPSTONE' | 'WATCH' | 'MAKEOVER' | 'EYE';
  desc: string;
  level: 1 | 2 | 3;
};

const PRESENTATION_ITEMS: LessonItem[] = [
  // Level 1 top check & capstone
  {
    id: 'l1-close',
    icon: '👋',
    iconBg: '#1E3A8A',
    title: 'Land the Close',
    tag: 'LEARN',
    desc: 'End on the ask or one line — never "any questions?"',
    level: 1,
  },
  {
    id: 'l1-quiz',
    icon: '🎖️',
    iconBg: '#1E3A8A',
    title: 'Level 1 Check',
    tag: 'QUIZ',
    desc: 'Quick quiz — pass to earn your badge',
    level: 1,
  },
  {
    id: 'l1-capstone',
    icon: '🏆',
    iconBg: '#1E3A8A',
    title: 'Capstone: Pitch in 3 Slides',
    tag: 'CAPSTONE',
    desc: 'Structure a mini-deck and present it',
    level: 1,
  },

  // Level 2: Design Your Slides
  {
    id: 'l2-death-by-bullets',
    icon: '🔍',
    iconBg: '#3B1D66',
    title: 'Analyze: Death by Bullet Points',
    tag: 'WATCH',
    desc: 'A wall-of-text slide — what makes it exhausting?',
    level: 2,
  },
  {
    id: 'l2-one-idea',
    icon: '1️⃣',
    iconBg: '#3B1D66',
    title: 'One Idea Per Slide',
    tag: 'MAKEOVER',
    desc: 'Cut a cluttered slide down to its single point',
    level: 2,
  },
  {
    id: 'l2-kill-bullets',
    icon: '🚫',
    iconBg: '#3B1D66',
    title: 'Kill the Bullets',
    tag: 'MAKEOVER',
    desc: 'Turn six bullets into a headline + one visual',
    level: 2,
  },
  {
    id: 'l2-headline-point',
    icon: '📰',
    iconBg: '#3B1D66',
    title: 'Headline = the Point',
    tag: 'LEARN',
    desc: 'Make the title a full-sentence claim, not a label',
    level: 2,
  },
  {
    id: 'l2-make-data-speak',
    icon: '📊',
    iconBg: '#3B1D66',
    title: 'Make the Data Speak',
    tag: 'MAKEOVER',
    desc: 'A busy chart → highlight the one number that matters',
    level: 2,
  },
  {
    id: 'l2-train-eye-clean-slides',
    icon: '👁️',
    iconBg: '#3B1D66',
    title: 'Train Your Eye: Clean Slides',
    tag: 'EYE',
    desc: 'Two slides — which one lands faster?',
    level: 2,
  },
  {
    id: 'l2-quiz',
    icon: '🎖️',
    iconBg: '#3B1D66',
    title: 'Level 2 Check',
    tag: 'QUIZ',
    desc: 'Quick quiz — pass to earn your badge',
    level: 2,
  },
  {
    id: 'l2-capstone',
    icon: '🏆',
    iconBg: '#3B1D66',
    title: 'Capstone: Redesign a Slide',
    tag: 'CAPSTONE',
    desc: 'Fix a cluttered slide, then say its one point',
    level: 2,
  },

  // Level 3: Present With Your Slides
  {
    id: 'l3-slide-reader',
    icon: '🔍',
    iconBg: '#064E3B',
    title: 'Analyze: The Slide-Reader',
    tag: 'WATCH',
    desc: 'Watch someone read every word — why does it fall flat?',
    level: 3,
  },
  {
    id: 'l3-dont-read-slides',
    icon: '💡',
    iconBg: '#064E3B',
    title: "Don't Read Your Slides",
    tag: 'LEARN',
    desc: 'Techniques to glance and deliver naturally',
    level: 3,
  },
  {
    id: 'l3-quiz',
    icon: '🎖️',
    iconBg: '#064E3B',
    title: 'Level 3 Check',
    tag: 'QUIZ',
    desc: 'Deliver under audience pressure',
    level: 3,
  },
  {
    id: 'l3-capstone',
    icon: '🏆',
    iconBg: '#064E3B',
    title: 'Capstone: Present a Full Deck',
    tag: 'CAPSTONE',
    desc: 'Deliver a 5-minute presentation with AI feedback',
    level: 3,
  },
];

function TagPill({ tag }: { tag: LessonItem['tag'] }) {
  const styles: Record<LessonItem['tag'], { bg: string; text: string }> = {
    LEARN: { bg: '#2563EB33', text: '#60A5FA' },
    QUIZ: { bg: '#D9770633', text: '#FBBF24' },
    CAPSTONE: { bg: '#05966933', text: '#34D399' },
    WATCH: { bg: '#7C3AED33', text: '#A78BFA' },
    MAKEOVER: { bg: '#E11D4833', text: '#FB7185' },
    EYE: { bg: '#0D948833', text: '#2DD4BF' },
  };
  const s = styles[tag];
  return (
    <View className="rounded px-1.5 py-0.5" style={{ backgroundColor: s.bg }}>
      <Text className="font-heavy text-[9.5px] tracking-wide" style={{ color: s.text }}>
        {tag}
      </Text>
    </View>
  );
}

export default function PresentationCoachScreen() {
  const { L } = useL();
  const { id = 'presentation' } = useLocalSearchParams<{ id: string }>();

  // Phân chia danh sách bài học theo Cấp độ khớp ảnh 3
  const level1Items = PRESENTATION_ITEMS.filter((i) => i.level === 1);
  const level2Items = PRESENTATION_ITEMS.filter((i) => i.level === 2);
  const level3Items = PRESENTATION_ITEMS.filter((i) => i.level === 3);

  const handleOpenLesson = (lessonId: string) => {
    router.push({
      pathname: '/hub/course/lesson/[id]',
      params: { id: lessonId },
    } as never);
  };

  return (
    <View className="flex-1 bg-[#0B0D26]">
      {/* Top Header */}
      <View className="border-b border-[#1E204A] bg-[#0E102E] px-4 py-3.5">
        <View className="mx-auto flex-row items-center gap-3.5 w-full max-w-[700px]">
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/hub/explore' as never)}
            className="h-9 w-9 items-center justify-center rounded-full bg-[#1A1C3F] active:opacity-70"
          >
            <Icon name="chevron-left" size={19} color="#FFFFFF" strokeWidth={2.4} />
          </Pressable>
          <Text className="font-heavy text-[20px] text-white">Presentation Coach</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 py-4" contentContainerStyle={{ paddingBottom: 60 }}>
        <View className="mx-auto w-full max-w-[700px] gap-5">
          {/* -------------------- LEVEL 1 ITEMS -------------------- */}
          <View className="gap-2.5">
            {level1Items.map((item) => (
              <LessonRow key={item.id} item={item} onPress={() => handleOpenLesson(item.id)} />
            ))}
          </View>

          {/* -------------------- LEVEL 2: DESIGN YOUR SLIDES -------------------- */}
          <View className="mt-2">
            <View className="mb-2.5">
              <View className="flex-row items-center gap-2">
                <Text className="text-[16px]">🟪</Text>
                <Text className="font-heavy text-[15px] text-white tracking-wide">
                  Level 2 · Design Your Slides
                </Text>
              </View>
              <Text className="mt-0.5 ml-6 font-sans text-[12px] text-[#A5B4FC]">
                Slides that support you — one idea each, not a wall of text
              </Text>
            </View>

            <View className="gap-2.5">
              {level2Items.map((item) => (
                <LessonRow key={item.id} item={item} onPress={() => handleOpenLesson(item.id)} />
              ))}
            </View>
          </View>

          {/* -------------------- LEVEL 3: PRESENT WITH YOUR SLIDES -------------------- */}
          <View className="mt-2">
            <View className="mb-2.5">
              <View className="flex-row items-center gap-2">
                <Text className="text-[16px]">🟩</Text>
                <Text className="font-heavy text-[15px] text-white tracking-wide">
                  Level 3 · Present With Your Slides
                </Text>
              </View>
              <Text className="mt-0.5 ml-6 font-sans text-[12px] text-[#A5B4FC]">
                You carry the message — the slides just back you up
              </Text>
            </View>

            <View className="gap-2.5">
              {level3Items.map((item) => (
                <LessonRow key={item.id} item={item} onPress={() => handleOpenLesson(item.id)} />
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function LessonRow({ item, onPress }: { item: LessonItem; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={item.title}
      onPress={onPress}
      className="flex-row items-center gap-3.5 rounded-2xl border border-[#232552] bg-[#14153B] p-3.5 active:scale-[0.99] active:bg-[#1E204D]"
      style={{
        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
      }}
    >
      {/* Icon */}
      <View
        className="h-11 w-11 items-center justify-center rounded-xl shadow-sm"
        style={{ backgroundColor: item.iconBg }}
      >
        <Text className="text-[20px]">{item.icon}</Text>
      </View>

      {/* Thông tin bài học */}
      <View className="flex-1 pr-1">
        <View className="flex-row items-center gap-2">
          <Text className="font-heavy text-[14.5px] text-white" numberOfLines={1}>
            {item.title}
          </Text>
          <TagPill tag={item.tag} />
        </View>
        <Text className="mt-0.5 font-sans text-[12px] text-[#94A3B8]" numberOfLines={2}>
          {item.desc}
        </Text>
      </View>

      {/* Mũi tên */}
      <Icon name="chevron-right" size={17} color="#717899" />
    </Pressable>
  );
}
