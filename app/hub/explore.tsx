import React, { useState } from 'react';
import { Image, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { CosmicBottomTabs } from '@/components/hub/CosmicBottomTabs';
import { CosmicHeader } from '@/components/hub/CosmicHeader';
import { Icon } from '@/components/ui/Icon';
import { useL } from '@/i18n/useL';
import { useHubStore } from '@/store/useHubStore';

type SegmentTab = 'sets' | 'courses' | 'topics';

export default function HubExplore() {
  const { L } = useL();
  const [activeSegment, setActiveSegment] = useState<SegmentTab>('sets');

  // Modal tạo tình huống
  const [creatorOpen, setCreatorOpen] = useState(false);
  const [charName, setCharName] = useState('');
  const [charRole, setCharRole] = useState('Đồng nghiệp');
  const [situation, setSituation] = useState('');
  const addCreatorScenario = useHubStore((s) => s.addCreatorScenario);

  // Modal làm tôi ngạc nhiên (Surprise me)
  const [surpriseModalOpen, setSurpriseModalOpen] = useState(false);
  const [surpriseItem, setSurpriseItem] = useState<{ title: string; desc: string; role: string } | null>(null);

  const triggerSurprise = () => {
    const scenarios = [
      {
        title: 'Thương lượng ngân sách marketing quý tới',
        desc: 'Bạn là Trưởng phòng Marketing cần thuyết phục Giám đốc Tài chính tăng thêm 25% ngân sách quảng cáo số.',
        role: 'Giám đốc Tài chính (Khó tính, chú trọng ROI)',
      },
      {
        title: 'Giải quyết khiếu nại khách hàng VIP',
        desc: 'Khách hàng VIP gặp sự cố dịch vụ và đang rất tức giận. Bạn cần xoa dịu và đưa ra phương án đền bù hợp lý.',
        role: 'Khách hàng VIP (Bực bội, yêu cầu bồi thường)',
      },
      {
        title: 'Giới thiệu bản thân trong sự kiện Networking quốc tế',
        desc: 'Gặp gỡ một nhà đầu tư mạo hiểm tại hội thảo công nghệ ở Singapore. Bạn có 60 giây để tạo ấn tượng ban đầu.',
        role: 'Nhà đầu tư thiên thần (Bận rộn, lắng nghe thông điệp cốt lõi)',
      },
    ];
    const picked = scenarios[Math.floor(Math.random() * scenarios.length)]!;
    setSurpriseItem(picked);
    setSurpriseModalOpen(true);
  };

  const handleCreate = () => {
    if (!charName.trim() || !situation.trim()) return;
    addCreatorScenario({
      characterName: charName.trim(),
      characterPersonality: 'Thân thiện, phản hồi chuyên nghiệp',
      learnerRole: 'Người học',
      situation: situation.trim(),
      goals: ['Giao tiếp tự tin', 'Dùng từ chuẩn xác'],
    });
    setCreatorOpen(false);
    router.push({
      pathname: '/hub/tutor/[id]',
      params: {
        id: 'custom',
        role: `${charName} (${charRole})`,
        tone: 'Chuyên nghiệp',
        situation: situation.trim(),
        goal: 'Giao tiếp trôi chảy',
      },
    } as never);
  };

  return (
    <View className="flex-1 bg-[#0B0D26]">
      <ScrollView className="flex-1 px-4 pt-3 pb-8" contentContainerStyle={{ paddingBottom: 110 }}>
        <View className="mx-auto w-full max-w-[800px]">
          {/* Header khớp ảnh 2 */}
          <CosmicHeader title={L('Khám phá', 'Explore')} />

          {/* 3 Tabs phân nhánh: Bộ học tập | Khóa học [PREMIUM] | Chủ Đề */}
          <View className="mb-6 flex-row items-center justify-between rounded-2xl bg-[#14153B] p-1.5 border border-[#232552]">
            <Pressable
              accessibilityRole="button"
              onPress={() => setActiveSegment('sets')}
              className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl py-2.5"
              style={{
                backgroundColor: activeSegment === 'sets' ? '#22255C' : 'transparent',
              }}
            >
              <Icon name="bookmark" size={16} color={activeSegment === 'sets' ? '#38BDF8' : '#717899'} />
              <Text
                className="font-strong text-[13px]"
                style={{ color: activeSegment === 'sets' ? '#FFFFFF' : '#717899' }}
              >
                {L('Bộ học tập', 'Study sets')}
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => setActiveSegment('courses')}
              className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl py-2.5"
              style={{
                backgroundColor: activeSegment === 'courses' ? '#22255C' : 'transparent',
              }}
            >
              <Icon name="book" size={16} color={activeSegment === 'courses' ? '#C084FC' : '#717899'} />
              <Text
                className="font-strong text-[13px]"
                style={{ color: activeSegment === 'courses' ? '#FFFFFF' : '#717899' }}
              >
                {L('Khóa học', 'Courses')}
              </Text>
              <View className="rounded bg-[#581C87] px-1.5 py-0.2">
                <Text className="font-heavy text-[9px] text-[#C084FC]">PREMIUM</Text>
              </View>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => setActiveSegment('topics')}
              className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl py-2.5"
              style={{
                backgroundColor: activeSegment === 'topics' ? '#22255C' : 'transparent',
              }}
            >
              <Icon name="sparkle" size={16} color={activeSegment === 'topics' ? '#FACC15' : '#717899'} />
              <Text
                className="font-strong text-[13px]"
                style={{ color: activeSegment === 'topics' ? '#FFFFFF' : '#717899' }}
              >
                {L('Chủ Đề', 'Topics')}
              </Text>
            </Pressable>
          </View>

          {/* ======================================================== */}
          {/* SECTION 1: THỬ NGHIỆM NHẬP VAI                          */}
          {/* ======================================================== */}
          <View className="mb-7">
            <Text className="mb-3 font-strong text-[12px] tracking-wider text-[#A5B4FC] uppercase">
              {L('THỬ NGHIỆM NHẬP VAI', 'ROLEPLAY EXPERIMENTS')}
            </Text>

            <View className="flex-row items-center gap-3">
              {/* Thẻ: Làm tôi ngạc nhiên */}
              <Pressable
                accessibilityRole="button"
                onPress={triggerSurprise}
                className="flex-1 rounded-2xl border border-[#3A2E80] p-4 active:scale-[0.98]"
                style={{
                  backgroundImage: 'linear-gradient(135deg, #1C1542 0%, #2A1D66 100%)',
                  boxShadow: '0 6px 20px rgba(0, 0, 0, 0.35)',
                  minHeight: 120,
                  justifyContent: 'space-between',
                }}
              >
                <Text className="font-heavy text-[16px] text-white">
                  {L('Làm tôi ngạc nhiên', 'Surprise me')}
                </Text>
                <View className="flex-row items-center justify-between pt-2">
                  <Text className="text-[34px]">🎈 🎁</Text>
                  <View className="rounded-full bg-white/10 p-1.5">
                    <Icon name="chevron-right" size={14} color="#C084FC" />
                  </View>
                </View>
              </Pressable>

              {/* Thẻ: Tạo của riêng tôi */}
              <Pressable
                accessibilityRole="button"
                onPress={() => setCreatorOpen(true)}
                className="flex-1 rounded-2xl border border-[#2E3C80] p-4 active:scale-[0.98]"
                style={{
                  backgroundImage: 'linear-gradient(135deg, #131E48 0%, #1D2D68 100%)',
                  boxShadow: '0 6px 20px rgba(0, 0, 0, 0.35)',
                  minHeight: 120,
                  justifyContent: 'space-between',
                }}
              >
                <Text className="font-heavy text-[16px] text-white">
                  {L('Tạo của riêng tôi', 'Create my own')}
                </Text>
                <View className="flex-row items-center justify-between pt-2">
                  <Text className="text-[34px]">✨ 🔮</Text>
                  <View className="rounded-full bg-white/10 p-1.5">
                    <Icon name="plus" size={14} color="#60A5FA" />
                  </View>
                </View>
              </Pressable>
            </View>
          </View>

          {/* ======================================================== */}
          {/* SECTION 2: DỰA TRÊN HOẠT ĐỘNG CỦA BẠN ✨                */}
          {/* ======================================================== */}
          <View className="mb-7">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="font-strong text-[12px] tracking-wider text-[#A5B4FC] uppercase">
                {L('DỰA TRÊN HOẠT ĐỘNG CỦA BẠN ✨', 'BASED ON YOUR ACTIVITY ✨')}
              </Text>
              <Icon name="chevron-right" size={16} color="#717899" />
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-1">
              {[
                { title: 'Exploring a Teaching Career', level: 'EASY', time: '3-7 minutes', bg: '#4A2810', tagColor: '#22C55E' },
                { title: 'Teacher Gift Card Creation', level: 'EASY', time: '3-7 minutes', bg: '#3F3512', tagColor: '#22C55E' },
                { title: 'Unspoken Side of Teaching', level: 'HARD', time: '3-7 minutes', bg: '#4B1824', tagColor: '#EF4444' },
                { title: 'What makes a teacher great?', level: 'HARD', time: '3-5 minutes', bg: '#3D1C36', tagColor: '#EF4444' },
                { title: 'Teacher Appreciation Event', level: 'MEDIUM', time: '3-7 minutes', bg: '#173647', tagColor: '#0EA5E9' },
              ].map((act, idx) => (
                <Pressable
                  key={idx}
                  accessibilityRole="button"
                  onPress={() => {
                    router.push({
                      pathname: '/hub/tutor/[id]',
                      params: {
                        id: 'custom',
                        role: 'Giảng viên chuyên môn',
                        tone: 'Chuyên nghiệp',
                        situation: act.title,
                        goal: 'Thảo luận góc nhìn và phản biện',
                      },
                    } as never);
                  }}
                  className="mx-1.5 w-[160px] overflow-hidden rounded-2xl border border-[#272A5A] bg-[#16173B] active:scale-[0.98]"
                  style={{ boxShadow: '0 4px 14px rgba(0,0,0,0.3)' }}
                >
                  <View className="h-24 w-full items-center justify-center p-2" style={{ backgroundColor: act.bg }}>
                    <Text className="text-[28px]">👩‍🏫 📖</Text>
                  </View>
                  <View className="p-3">
                    <View className="self-start rounded px-1.5 py-0.2" style={{ backgroundColor: `${act.tagColor}22` }}>
                      <Text className="font-heavy text-[9px]" style={{ color: act.tagColor }}>
                        {act.level}
                      </Text>
                    </View>
                    <Text className="mt-1.5 font-heavy text-[13px] text-white leading-4" numberOfLines={2}>
                      {act.title}
                    </Text>
                    <Text className="mt-1 font-sans text-[11px] text-[#717899]">{act.time}</Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* ======================================================== */}
          {/* SECTION 3: BỘ HỌC TẬP DÀNH CHO BẠN                      */}
          {/* ======================================================== */}
          <View className="mb-7">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="font-strong text-[12px] tracking-wider text-[#A5B4FC] uppercase">
                {L('BỘ HỌC TẬP DÀNH CHO BẠN', 'STUDY SETS FOR YOU')}
              </Text>
              <Icon name="chevron-right" size={16} color="#717899" />
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-1">
              {[
                { title: 'phát âm', author: 'tuyendo7799', likes: '40.9K', badge: 'IELTS', badgeBg: '#EF4444' },
                { title: 'thuc an 🍈🍉🍅🍌', author: 'Unnamed Learner', likes: '21.9K', badge: '🍔', badgeBg: '#F97316' },
                { title: 'Tongue twisters', author: 'Call me Val', likes: '15.9K', badge: 'IELTS', badgeBg: '#EF4444' },
                { title: 'vocabulary', author: 'liendt3', likes: '14.9K', badge: '✳️', badgeBg: '#10B981' },
                { title: 'Famous Basketball Teams', author: 'elsa.purchases.05', likes: '10.5K', badge: '🎬', badgeBg: '#3B82F6' },
              ].map((set, idx) => (
                <Pressable
                  key={idx}
                  accessibilityRole="button"
                  onPress={() => router.push('/hub/learn' as never)}
                  className="mx-1.5 w-[140px] rounded-2xl border border-[#272A5A] bg-[#16173B] p-3.5 active:scale-[0.98]"
                  style={{ boxShadow: '0 4px 14px rgba(0,0,0,0.3)' }}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="h-7 w-7 items-center justify-center rounded-lg" style={{ backgroundColor: set.badgeBg }}>
                      <Text className="font-heavy text-[9px] text-white">{set.badge}</Text>
                    </View>
                    <Icon name="bookmark" size={14} color="#717899" />
                  </View>

                  <Text className="mt-3 font-heavy text-[13px] text-white" numberOfLines={2}>
                    {set.title}
                  </Text>
                  <Text className="mt-1 font-sans text-[11px] text-[#717899]" numberOfLines={1}>
                    {set.author}
                  </Text>

                  <View className="mt-3 flex-row items-center gap-1 border-t border-[#232552] pt-2">
                    <Text className="text-[11px]">❤️</Text>
                    <Text className="font-strong text-[11px] text-[#A5B4FC]">{set.likes}</Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* ======================================================== */}
          {/* SECTION 4: CÁC KHÓA HỌC DÀNH CHO BẠN                    */}
          {/* ======================================================== */}
          <View className="mb-4">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="font-strong text-[12px] tracking-wider text-[#A5B4FC] uppercase">
                {L('CÁC KHÓA HỌC DÀNH CHO BẠN', 'COURSES FOR YOU')}
              </Text>
              <Icon name="chevron-right" size={16} color="#717899" />
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-1">
              {[
                { title: 'IELTS Band 6', units: '17 units', progress: 35, bg: '#1E293B', icon: '🎯' },
                { title: 'EIKEN (Grades 3 & Pre-2)', units: '12 units', progress: 10, bg: '#1E293B', icon: '📝' },
                { title: 'IELTS Band 7', units: '17 units', progress: 50, bg: '#1E293B', icon: '⭐' },
                {
                  title: 'Presentation Coach',
                  units: '3 Levels · 17 lessons',
                  progress: 20,
                  bg: '#2E1065',
                  icon: '📊',
                  route: '/hub/course/presentation',
                },
              ].map((crs, idx) => (
                <Pressable
                  key={idx}
                  accessibilityRole="button"
                  onPress={() => {
                    if (crs.route) router.push(crs.route as never);
                    else router.push('/hub/course/presentation' as never);
                  }}
                  className="mx-1.5 w-[165px] overflow-hidden rounded-2xl border border-[#272A5A] bg-[#16173B] active:scale-[0.98]"
                  style={{ boxShadow: '0 4px 14px rgba(0,0,0,0.3)' }}
                >
                  <View className="h-20 w-full items-center justify-center" style={{ backgroundColor: crs.bg }}>
                    <Text className="text-[32px]">{crs.icon}</Text>
                  </View>
                  <View className="p-3">
                    {/* Thanh tiến độ xanh lá */}
                    <View className="h-1.5 w-full rounded-full bg-[#272A5A]">
                      <View className="h-full rounded-full bg-[#22C55E]" style={{ width: `${crs.progress}%` }} />
                    </View>

                    <Text className="mt-2.5 font-heavy text-[13px] text-white" numberOfLines={1}>
                      {crs.title}
                    </Text>
                    <Text className="mt-1 font-sans text-[11px] text-[#717899]">{crs.units}</Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </ScrollView>

      {/* Modal: Làm tôi ngạc nhiên */}
      <Modal visible={surpriseModalOpen} animationType="fade" transparent onRequestClose={() => setSurpriseModalOpen(false)}>
        <View className="flex-1 items-center justify-center bg-black/75 p-4">
          <View className="w-full max-w-[480px] rounded-3xl border border-[#3A2E80] bg-[#16173B] p-6 shadow-2xl">
            <View className="items-center">
              <Text className="text-[44px]">🎁 ✨</Text>
              <Text className="mt-2 font-heavy text-cardTitle text-white">LÀM TÔI NGẠC NHIÊN</Text>
              <Text className="font-sans text-label text-[#A5B4FC]">Tình huống ngẫu nhiên được máy khởi tạo</Text>
            </View>

            {surpriseItem ? (
              <View className="mt-5 rounded-2xl border border-[#2E3C80] bg-[#101233] p-4">
                <Text className="font-heavy text-body text-white">{surpriseItem.title}</Text>
                <Text className="mt-1.5 font-sans text-label text-[#94A3B8]">{surpriseItem.desc}</Text>
                <View className="mt-3 flex-row items-center gap-1.5 border-t border-[#1F2148] pt-2">
                  <Text className="font-strong text-[11px] text-[#38BDF8]">Đối phương AI:</Text>
                  <Text className="font-sans text-[11px] text-white">{surpriseItem.role}</Text>
                </View>
              </View>
            ) : null}

            <View className="mt-6 flex-row items-center gap-3">
              <Pressable
                accessibilityRole="button"
                onPress={triggerSurprise}
                className="flex-1 items-center justify-center rounded-xl border border-[#2E3C80] bg-[#1F2148] py-3"
              >
                <Text className="font-heavy text-label text-white">Đổi tình huống</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setSurpriseModalOpen(false);
                  if (surpriseItem) {
                    router.push({
                      pathname: '/hub/tutor/[id]',
                      params: {
                        id: 'custom',
                        role: surpriseItem.role,
                        tone: 'Chuyên nghiệp',
                        situation: surpriseItem.title,
                        goal: 'Xử lý tình huống thuyết phục',
                      },
                    } as never);
                  }
                }}
                className="flex-1 items-center justify-center rounded-xl bg-[#2563EB] py-3 shadow-md"
              >
                <Text className="font-heavy text-label text-white">Bắt đầu hội thoại</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal: Tạo tình huống của riêng tôi */}
      <Modal visible={creatorOpen} animationType="slide" transparent onRequestClose={() => setCreatorOpen(false)}>
        <View className="flex-1 items-center justify-center bg-black/75 p-4">
          <View className="w-full max-w-[500px] rounded-3xl border border-[#2E3C80] bg-[#16173B] p-6 shadow-2xl">
            <View className="flex-row items-center justify-between border-b border-[#232552] pb-3">
              <View>
                <Text className="font-heavy text-cardTitle text-white">🔮 TẠO CỦA RIÊNG TÔI</Text>
                <Text className="font-sans text-label text-[#A5B4FC]">Tuỳ chỉnh nhân vật AI & kịch bản nhập vai</Text>
              </View>
              <Pressable accessibilityRole="button" onPress={() => setCreatorOpen(false)}>
                <Icon name="close" size={20} color="#94A3B8" />
              </Pressable>
            </View>

            <View className="mt-4 gap-3">
              <View>
                <Text className="mb-1 font-strong text-[12px] text-[#A5B4FC]">Tên nhân vật AI</Text>
                <TextInput
                  value={charName}
                  onChangeText={setCharName}
                  placeholder="Ví dụ: Sarah, Tuyển dụng viên Google..."
                  placeholderTextColor="#64748B"
                  className="rounded-xl border border-[#232552] bg-[#101233] px-3.5 py-2.5 font-sans text-body text-white"
                />
              </View>

              <View>
                <Text className="mb-1 font-strong text-[12px] text-[#A5B4FC]">Vai trò của nhân vật</Text>
                <TextInput
                  value={charRole}
                  onChangeText={setCharRole}
                  placeholder="Ví dụ: Quản lý khó tính, Bạn hẹn hò, Giám khảo..."
                  placeholderTextColor="#64748B"
                  className="rounded-xl border border-[#232552] bg-[#101233] px-3.5 py-2.5 font-sans text-body text-white"
                />
              </View>

              <View>
                <Text className="mb-1 font-strong text-[12px] text-[#A5B4FC]">Tình huống & Mục tiêu</Text>
                <TextInput
                  value={situation}
                  onChangeText={setSituation}
                  placeholder="Ví dụ: Buổi phỏng vấn xin việc lương 2000$, cần đàm phán hợp đồng..."
                  placeholderTextColor="#64748B"
                  multiline
                  numberOfLines={3}
                  className="rounded-xl border border-[#232552] bg-[#101233] px-3.5 py-2.5 font-sans text-body text-white"
                  style={{ minHeight: 70 }}
                />
              </View>
            </View>

            <View className="mt-6 flex-row items-center gap-3">
              <Pressable
                accessibilityRole="button"
                onPress={() => setCreatorOpen(false)}
                className="flex-1 items-center justify-center rounded-xl border border-[#2E3C80] bg-[#1F2148] py-3"
              >
                <Text className="font-heavy text-label text-white">Huỷ</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={handleCreate}
                className="flex-1 items-center justify-center rounded-xl bg-[#2563EB] py-3 shadow-md"
              >
                <Text className="font-heavy text-label text-white">Bắt đầu nhập vai</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Thanh tab dưới cùng khớp ảnh 2 */}
      <CosmicBottomTabs activeTab="explore" />
    </View>
  );
}
