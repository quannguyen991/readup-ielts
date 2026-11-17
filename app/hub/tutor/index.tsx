import React, { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { HubScreen } from '@/components/hub/HubScreen';
import { HUB_UI, HubChips, HubHero, HubPanel, HubTag, hubLift } from '@/components/hub/HubUi';
import { Image } from 'react-native';
import { Icon } from '@/components/ui/Icon';
import { hubCover } from '@/data/hub-covers';
import { useL } from '@/i18n/useL';
import { TUTORS, type Tutor } from '@/services/hub/tutors';

/** Nhóm theo mục tiêu — giống các tab Tất cả / Ngôn ngữ / Chuyên nghiệp / Xã hội của app tham chiếu, thêm nhóm IELTS. */
type Group = 'exam' | 'language' | 'work' | 'social';
type Meta = { group: Group; icon: string; tint: string; does: string; route?: string };

const GROUPS: { id: Group; title: string; hint: string; neon: 'trophy' | 'book' | 'bolt' | 'heart' }[] = [
  { id: 'exam', title: 'Luyện thi IELTS', hint: 'Từng phần của bài thi nói, từ Part 1 đến phòng thi giám khảo', neon: 'trophy' },
  { id: 'language', title: 'Ngôn ngữ', hint: 'Ngữ pháp, từ vựng, phát âm, thành ngữ và độ trôi chảy', neon: 'book' },
  { id: 'work', title: 'Chuyên nghiệp', hint: 'Họp, phỏng vấn, thuyết trình, bán hàng, đàm phán, lãnh đạo', neon: 'bolt' },
  { id: 'social', title: 'Xã hội', hint: 'Du lịch, hẹn hò, gọi điện, trò chuyện hằng ngày', neon: 'heart' },
];

const META: Record<string, Meta> = {
  'ielts-examiner': { group: 'exam', icon: '🏆', tint: '#EFE4FF', does: 'Thi thử đủ 3 phần, giám khảo ngắt lời như thật', route: '/speaking' },
  'ielts-part1': { group: 'exam', icon: '1️⃣', tint: '#DFEEFF', does: 'Mở rộng câu trả lời: ý chính → lý do → ví dụ' },
  'ielts-part2': { group: 'exam', icon: '🗒️', tint: '#FFF0D6', does: '1 phút lập dàn ý, 2 phút nói, có nhận xét cấu trúc' },
  'ielts-part3': { group: 'exam', icon: '🧠', tint: '#E8E2FF', does: 'Nêu quan điểm, so sánh, dự đoán, phản biện' },
  'band-upgrade': { group: 'exam', icon: '📈', tint: '#DDF7E8', does: 'Viết lại câu trả lời cao hơn một band' },
  grammar: { group: 'language', icon: '📚', tint: '#FFE3E8', does: 'Bài tập ngắn, sửa lỗi ngay' },
  'speech-analysis': { group: 'language', icon: '🎙️', tint: '#DFEEFF', does: 'Báo cáo 6 tiêu chí sau mỗi lần nói', route: '/hub/analyze' },
  vocab: { group: 'language', icon: '🗂️', tint: '#FFF0D6', does: 'Học từ trong câu nói thật' },
  pronounce: { group: 'language', icon: '🗣️', tint: '#DDF5F6', does: '44 âm IPA, chấm từng âm', route: '/hub/learn' },
  idioms: { group: 'language', icon: '💬', tint: '#FFE3F0', does: '3 cụm tự nhiên mỗi buổi, đặt câu của riêng bạn' },
  fluency: { group: 'language', icon: '⚡', tint: '#FFF0D6', does: 'Hỏi nhanh, đếm từ đệm, thay bằng cụm nối ý' },
  diary: { group: 'language', icon: '📓', tint: '#EFE4FF', does: 'Viết 3–5 câu mỗi ngày, được sửa một lỗi' },
  meeting: { group: 'work', icon: '📅', tint: '#FFE3E0', does: 'Nhận phản hồi sau mỗi cuộc họp', route: '/hub/meeting' },
  interview: { group: 'work', icon: '👥', tint: '#EFE4FF', does: 'Hỏi đáp như buổi phỏng vấn thật' },
  profile: { group: 'work', icon: '📄', tint: '#DFEEFF', does: 'Tải CV, AI hỏi xoáy vào hồ sơ của bạn' },
  'public-speaking': { group: 'work', icon: '🎤', tint: '#FFE3F0', does: 'Khán giả AI phản ứng theo lời bạn' },
  presentation: { group: 'work', icon: '📊', tint: '#DFF3FF', does: 'Diễn tập theo từng slide', route: '/hub/course/presentation' },
  sales: { group: 'work', icon: '📈', tint: '#DDF7E8', does: 'Cuộc gọi bán hàng có chấm điểm' },
  negotiation: { group: 'work', icon: '🤝', tint: '#FFF0D6', does: 'AI đóng đối phương, huấn luyện sau buổi' },
  conflict: { group: 'work', icon: '🕊️', tint: '#E3F1FF', does: 'Xử lý bất đồng mà không tổn hại quan hệ' },
  'leader-comms': { group: 'work', icon: '📣', tint: '#FFE3E0', does: 'Phát biểu trấn an đội ngũ trong 1 phút' },
  storytelling: { group: 'work', icon: '📖', tint: '#EFE4FF', does: 'Cấu trúc SCQA biến số liệu thành chuyện' },
  leadership: { group: 'work', icon: '🧭', tint: '#DDF5F6', does: 'Câu hỏi tự nhận thức và ra quyết định' },
  'daily-english': { group: 'social', icon: '☕', tint: '#FFF0D6', does: 'Hỏi đường, gọi món, nhờ giúp đỡ' },
  'small-talk': { group: 'social', icon: '👋', tint: '#FFE3F0', does: 'Mở đầu, duy trì và kết thúc cuộc chuyện' },
  phone: { group: 'social', icon: '📞', tint: '#DDF3FA', does: 'Nghe gọi đến, trả lời từng câu một' },
  travel: { group: 'social', icon: '✈️', tint: '#DDF3FA', does: 'Sân bay, khách sạn, nhà hàng' },
  dating: { group: 'social', icon: '💌', tint: '#FFE3EC', does: 'Trò chuyện tự nhiên, được góp ý' },
};

const TAG_STYLE: Record<string, { fg: string; bg: string }> = {
  MỚI: { fg: '#1D4ED8', bg: '#DBEAFE' },
  NEW: { fg: '#1D4ED8', bg: '#DBEAFE' },
  BETA: { fg: '#7C3AED', bg: '#EDE9FE' },
  PREMIUM: { fg: '#B45309', bg: '#FEF3C7' },
  'BAND 9 EXCLUSIVE': { fg: '#BE185D', bg: '#FCE7F3' },
};

type Hover = { hovered?: boolean };
type GroupFilter = 'all' | Group;

export default function TutorList() {
  const { L } = useL();
  const [q, setQ] = useState('');
  const [group, setGroup] = useState<GroupFilter>('all');

  const all = useMemo(() => TUTORS.filter((t) => t.status === 'live' && META[t.id]), []);
  const shown = useMemo(() => {
    const key = q.trim().toLowerCase();
    return all.filter((t) => (group === 'all' || META[t.id]!.group === group) && (!key || t.name.toLowerCase().includes(key) || t.desc.toLowerCase().includes(key)));
  }, [all, q, group]);

  const filters: { id: GroupFilter; label: string }[] = [{ id: 'all', label: `${L('Tất cả', 'All')} · ${all.length}` }, ...GROUPS.map((g) => ({ id: g.id as GroupFilter, label: `${g.title} · ${all.filter((t) => META[t.id]!.group === g.id).length}` }))];

  const open = (t: Tutor) => router.push((META[t.id]!.route ?? `/hub/tutor/${t.id}`) as never);

  return (
    <HubScreen title={L('Gia sư', 'AI Tutors')} subtitle={L('Trò chuyện và sửa lỗi cùng AI', 'Talk and get corrected by AI')} back padBottom={120}>
      <HubHero
        eyebrow="IELTS · AI TUTORS"
        title={L('Mỗi mục tiêu,', 'One tutor')}
        accent={L('một gia sư riêng', 'for every goal')}
        desc={L('AI đóng vai người đối diện, nghe bạn nói, rồi chỉ ra lỗi phát âm, ngữ pháp và cách diễn đạt tự nhiên hơn.', 'AI plays the other person, listens, then points out pronunciation, grammar and more natural phrasing.')}
        stats={[
          { value: String(all.length), label: L('Gia sư', 'Tutors') },
          { value: String(GROUPS.length), label: L('Nhóm mục tiêu', 'Goal groups') },
          { value: String(all.filter((t) => t.tag === 'MỚI' || t.tag === 'NEW').length), label: L('Mới ra mắt', 'New') },
          { value: '24/7', label: L('Luyện bất cứ lúc nào', 'Always on') },
        ]}
      />

      <HubPanel title={L('Tìm gia sư', 'Find a tutor')} icon="cursor">
        <HubChips options={filters} value={group} onChange={setGroup} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, borderWidth: 1.5, borderColor: HUB_UI.line, backgroundColor: HUB_UI.wash, paddingHorizontal: 14, height: 46 }}>
          <Icon name="search" size={18} color={HUB_UI.muted} />
          <TextInput value={q} onChangeText={setQ} placeholder={L('Tìm: phỏng vấn, du lịch, Part 2…', 'Search: interview, travel, Part 2…')} placeholderTextColor="#A59CC4" accessibilityLabel={L('Tìm gia sư', 'Find a tutor')} style={{ flex: 1, color: HUB_UI.navy, fontSize: 15 }} />
        </View>
      </HubPanel>

      {GROUPS.map((g) => {
        const items = shown.filter((t) => META[t.id]!.group === g.id);
        if (items.length === 0) return null;
        return (
          <HubPanel key={g.id} title={g.title} icon={g.neon} badge={String(items.length)}>
            <Text style={{ color: HUB_UI.muted, fontSize: 14, fontWeight: '600', marginTop: -4 }}>{g.hint}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              {items.map((tutor) => {
                const m = META[tutor.id]!;
                return (
                  <Pressable
                    key={tutor.id}
                    accessibilityRole="button"
                    accessibilityLabel={tutor.name}
                    onPress={() => open(tutor)}
                    style={({ hovered }: Hover) => ({ flexBasis: 340, flexGrow: 1, flexShrink: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 14, padding: 10, paddingRight: 14, borderRadius: 18, borderWidth: 1.5, backgroundColor: '#FFFFFF', ...hubLift(hovered) }) as never}
                  >
                    {hubCover(tutor.id) ? (
                      <Image source={{ uri: hubCover(tutor.id)! }} accessibilityIgnoresInvertColors style={{ width: 96, height: 96, borderRadius: 18, backgroundColor: m.tint }} resizeMode="cover" />
                    ) : (
                      <View style={{ width: 96, height: 96, borderRadius: 18, backgroundColor: m.tint, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 40 }}>{m.icon}</Text>
                      </View>
                    )}
                    <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                        <Text style={{ color: HUB_UI.navy, fontSize: 16, fontWeight: '900', flexShrink: 1 }}>{tutor.name}</Text>
                        {tutor.tag ? <HubTag label={tutor.tag === 'BAND 9 EXCLUSIVE' ? 'BAND 9' : tutor.tag} color={(TAG_STYLE[tutor.tag] ?? TAG_STYLE.BETA!).fg} bg={(TAG_STYLE[tutor.tag] ?? TAG_STYLE.BETA!).bg} /> : null}
                      </View>
                      <Text style={{ color: HUB_UI.muted, fontSize: 13.5, lineHeight: 19 }} numberOfLines={3}>{tutor.desc}</Text>
                      <Text style={{ color: HUB_UI.purple, fontSize: 13, fontWeight: '800' }}>{m.does}</Text>
                    </View>
                    <Icon name="chevron-right" size={16} color={HUB_UI.muted} />
                  </Pressable>
                );
              })}
            </View>
          </HubPanel>
        );
      })}

      {shown.length === 0 ? (
        <HubPanel title={L('Không có gia sư nào khớp', 'No tutor matches')} icon="cloud">
          <Text style={{ color: HUB_UI.muted, fontSize: 14 }}>{L('Thử từ khoá khác hoặc chọn “Tất cả”.', 'Try another keyword or pick “All”.')}</Text>
        </HubPanel>
      ) : null}
    </HubScreen>
  );
}
