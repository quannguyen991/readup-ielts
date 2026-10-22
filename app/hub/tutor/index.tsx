import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';

import { CosmicBottomTabs } from '@/components/hub/CosmicBottomTabs';
import { CosmicHeader } from '@/components/hub/CosmicHeader';
import { Icon } from '@/components/ui/Icon';
import { useL } from '@/i18n/useL';

type TutorItem = {
  id: string;
  name: string;
  desc: string;
  icon: string;
  iconBg: string;
  tag?: 'MỚI' | 'BETA' | 'BAND 8.5' | 'HOT';
  route: string;
};

const TUTOR_LIST: TutorItem[] = [
  {
    id: 'grammar',
    name: 'Gia sư ngữ pháp',
    desc: 'Cải thiện kỹ năng ngữ pháp của bạn với các bài tập cá nhân hoá.',
    icon: '📚',
    iconBg: 'linear-gradient(135deg, #FF6B8B, #FF8E53)',
    route: '/hub/tutor/grammar',
  },
  {
    id: 'speech-analysis',
    name: 'Phân tích giọng nói',
    tag: 'MỚI',
    desc: 'Ghi âm và khám phá giọng nói của bạn nghe thế nào.',
    icon: '🎙️',
    iconBg: 'linear-gradient(135deg, #4E65FF, #92EFFD)',
    route: '/hub/analyze',
  },
  {
    id: 'vocab',
    name: 'Gia sư từ vựng',
    desc: 'Mở rộng vốn từ vựng tiếng Anh của bạn với bài luyện tập cá nhân hoá.',
    icon: '🗂️',
    iconBg: 'linear-gradient(135deg, #F39034, #FFD269)',
    route: '/hub/tutor/vocab',
  },
  {
    id: 'pronounce',
    name: 'Gia sư phát âm',
    desc: 'Học cách phát âm tiếng Anh rõ ràng',
    icon: '🗣️',
    iconBg: 'linear-gradient(135deg, #36D1DC, #5B86E5)',
    route: '/hub/learn',
  },
  {
    id: 'meeting',
    name: 'Gia sư họp',
    tag: 'MỚI',
    desc: 'Luyện tập họp công việc',
    icon: '📅',
    iconBg: 'linear-gradient(135deg, #FF416C, #FF4B2B)',
    route: '/hub/meeting',
  },
  {
    id: 'interview',
    name: 'Gia sư phỏng vấn',
    desc: 'Luyện tập các cuộc trò chuyện phỏng vấn trực tiếp với người phỏng vấn AI',
    icon: '👥',
    iconBg: 'linear-gradient(135deg, #654ea3, #eaafc8)',
    route: '/hub/tutor/interview',
  },
  {
    id: 'public-speaking',
    name: 'Gia sư nói trước đám đông',
    desc: 'Thuyết trình tự tin trước khán giả AI trực tiếp',
    icon: '🎤',
    iconBg: 'linear-gradient(135deg, #F857A6, #FF5858)',
    route: '/hub/tutor/public-speaking',
  },
  {
    id: 'presentation',
    name: 'Gia sư thuyết trình',
    tag: 'BETA',
    desc: 'Tải lên bộ slide của bạn và diễn tập từ đầu đến cuối',
    icon: '📊',
    iconBg: 'linear-gradient(135deg, #00B4DB, #0083B0)',
    route: '/hub/course/presentation',
  },
  {
    id: 'sales',
    name: 'Gia sư bán hàng',
    tag: 'BETA',
    desc: 'Luyện tập cuộc gọi bán hàng trực tiếp và nhận huấn luyện tức thì',
    icon: '📈',
    iconBg: 'linear-gradient(135deg, #11998E, #38EF7D)',
    route: '/hub/tutor/sales',
  },
  {
    id: 'dating',
    name: 'Gia sư hẹn hò',
    desc: 'Luyện tập buổi hẹn hò trực tiếp để được huấn luyện',
    icon: '💌',
    iconBg: 'linear-gradient(135deg, #FC466B, #3F5EFB)',
    route: '/hub/tutor/dating',
  },
  {
    id: 'travel',
    name: 'Gia sư du lịch',
    desc: 'Luyện tiếng Anh cho chuyến đi sắp tới của bạn',
    icon: '✈️',
    iconBg: 'linear-gradient(135deg, #2193B0, #6DD5ED)',
    route: '/hub/tutor/travel',
  },
  {
    id: 'negotiation',
    name: 'Huấn luyện viên Đàm phán',
    tag: 'MỚI',
    desc: 'Luyện tập những cuộc đàm phán thực tế nơi công sở — lời mời làm việc, tăng lương, khách hàng khó tính, hạn chót. AI đóng vai đối phương rồi huấn luyện bạn sau đó.',
    icon: '🤝',
    iconBg: 'linear-gradient(135deg, #F2994A, #F2C94C)',
    route: '/hub/tutor/negotiation',
  },
  {
    id: 'ielts-speaking',
    name: 'Luyện thi IELTS Speaking & Forecast Quý 3/2026',
    tag: 'BAND 8.5',
    desc: 'Ngân hàng đề thi thật, Sample 8.0+, Speaking Roulette và phòng thi mô phỏng giám khảo thực tế.',
    icon: '🏆',
    iconBg: 'linear-gradient(135deg, #D946EF, #8B5CF6)',
    route: '/speaking',
  },
  {
    id: 'dubbing',
    name: 'Lồng tiếng video BBC · TED-Ed',
    tag: 'HOT',
    desc: 'Phòng thu lồng tiếng theo từng cảnh, ghép giọng bạn vào video và AI phân tích độ nhấn, phát âm IELTS.',
    icon: '🎬',
    iconBg: 'linear-gradient(135deg, #0EA5E9, #3B82F6)',
    route: '/speaking/long-tieng',
  },
];

function TagBadge({ tag }: { tag: TutorItem['tag'] }) {
  if (!tag) return null;
  if (tag === 'MỚI') {
    return (
      <View className="rounded-full bg-[#1E3A8A] px-2 py-0.5">
        <Text className="font-heavy text-[10px] text-[#60A5FA] uppercase tracking-wide">MỚI</Text>
      </View>
    );
  }
  if (tag === 'BETA') {
    return (
      <View className="rounded-full bg-[#581C87] px-2 py-0.5">
        <Text className="font-heavy text-[10px] text-[#C084FC] uppercase tracking-wide">BETA</Text>
      </View>
    );
  }
  if (tag === 'BAND 8.5') {
    return (
      <View className="rounded-full bg-[#831843] px-2 py-0.5">
        <Text className="font-heavy text-[10px] text-[#F472B6] uppercase tracking-wide">BAND 8.5</Text>
      </View>
    );
  }
  return (
    <View className="rounded-full bg-[#2B2350] px-2 py-0.5">
      <Text className="font-heavy text-[10px] text-[#FB923C] uppercase tracking-wide">HOT</Text>
    </View>
  );
}

export default function TutorList() {
  const { L } = useL();

  return (
    <View className="flex-1 bg-[#0B0D26]">
      {/* Khung nội dung chính cuộn dọc */}
      <ScrollView className="flex-1 px-4 pt-3 pb-8" contentContainerStyle={{ paddingBottom: 100 }}>
        <View className="mx-auto w-full max-w-[700px]">
          {/* Header với flame, gem, trophy khớp ảnh 1 */}
          <CosmicHeader title={L('Gia sư', 'AI Tutors')} />

          {/* Danh sách 12 gia sư AI + 2 kết nối IELTS Speaking */}
          <View className="gap-3">
            {TUTOR_LIST.map((tutor) => (
              <Pressable
                key={tutor.id}
                accessibilityRole="button"
                accessibilityLabel={tutor.name}
                onPress={() => router.push(tutor.route as never)}
                className="flex-row items-center gap-3.5 rounded-2xl border border-[#232552] bg-[#16173B] p-4 active:scale-[0.99] active:bg-[#1E204D]"
                style={{
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
                }}
              >
                {/* Icon minh hoạ */}
                <View
                  className="h-12 w-12 items-center justify-center rounded-2xl shadow-md"
                  style={{
                    backgroundImage: tutor.iconBg,
                  }}
                >
                  <Text className="text-[24px]">{tutor.icon}</Text>
                </View>

                {/* Tiêu đề, tag và mô tả */}
                <View className="flex-1 pr-1">
                  <View className="flex-row items-center gap-2">
                    <Text className="font-heavy text-[16px] tracking-wide text-white" numberOfLines={1}>
                      {tutor.name}
                    </Text>
                    <TagBadge tag={tutor.tag} />
                  </View>
                  <Text className="mt-1 font-sans text-[12.5px] leading-[18px] text-[#94A3B8]" numberOfLines={3}>
                    {tutor.desc}
                  </Text>
                </View>

                {/* Mũi tên dẫn hướng */}
                <Icon name="chevron-right" size={18} color="#64748B" />
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Thanh tab dưới cùng khớp ảnh 1 */}
      <CosmicBottomTabs activeTab="tutor" />
    </View>
  );
}
