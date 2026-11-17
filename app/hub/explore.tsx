import React, { useMemo, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { HubScreen } from '@/components/hub/HubScreen';
import { HUB_UI, HubBar, HubHero, HubPanel, HubTag, hubLift } from '@/components/hub/HubUi';
import { TalkRow, allTalks } from '@/components/hub/TalkCards';
import { Icon } from '@/components/ui/Icon';
import { hubCover } from '@/data/hub-covers';
import { SPEAKING_TOPICS } from '@/data/hub/speaking-topics';
import { useL } from '@/i18n/useL';
import { PHONEMES } from '@/services/hub/phonemes';
import { dayHash, dayKeyOf } from '@/services/hub/daily';
import { useDialogueStore } from '@/store/useDialogueStore';
import { useHubStore } from '@/store/useHubStore';

type Hover = { hovered?: boolean };

const SURPRISES = [
  { title: 'Thương lượng ngân sách marketing quý tới', desc: 'Bạn là Trưởng phòng Marketing cần thuyết phục Giám đốc Tài chính tăng thêm 25% ngân sách quảng cáo số.', role: 'Giám đốc Tài chính (khó tính, chú trọng ROI)' },
  { title: 'Giải quyết khiếu nại khách hàng VIP', desc: 'Khách hàng VIP gặp sự cố dịch vụ và đang rất tức giận. Bạn cần xoa dịu và đưa ra phương án đền bù hợp lý.', role: 'Khách hàng VIP (bực bội, yêu cầu bồi thường)' },
  { title: 'Giới thiệu bản thân tại sự kiện networking quốc tế', desc: 'Gặp một nhà đầu tư mạo hiểm tại hội thảo công nghệ ở Singapore. Bạn có 60 giây để tạo ấn tượng ban đầu.', role: 'Nhà đầu tư thiên thần (bận rộn, nghe thông điệp cốt lõi)' },
  { title: 'Xin gia hạn hạn nộp bài với giáo sư', desc: 'Bạn cần thêm ba ngày để hoàn thành luận văn vì ốm. Hãy giải thích lịch sự và đề xuất kế hoạch mới.', role: 'Giáo sư (nghiêm khắc nhưng công bằng)' },
  { title: 'Nhờ hàng xóm bớt tiếng ồn', desc: 'Hàng xóm mở nhạc rất to lúc 11 giờ đêm. Bạn muốn nhờ họ bớt ồn mà không gây mâu thuẫn.', role: 'Hàng xóm (hơi phòng thủ)' },
  { title: 'Đổi trả một món hàng bị lỗi', desc: 'Chiếc tai nghe bạn mua tuần trước bị hỏng. Hãy yêu cầu đổi trả khi không còn hoá đơn giấy.', role: 'Nhân viên cửa hàng (làm theo quy trình)' },
];

/** Công cụ AI — cùng tám công cụ với trang Hôm nay, để vào luyện ngay từ Khám phá. */
const TOOLS = [
  { title: 'Phân tích giọng nói', desc: 'Chấm phát âm, ngữ điệu, lưu loát', icon: '🎙️', tint: '#DFEEFF', route: '/hub/analyze', cover: 'tool-analyze', tag: 'MỚI' },
  { title: 'Điều chỉnh giọng nói', desc: 'Sửa trọng âm và ngữ điệu', icon: '🎧', tint: '#FFF0D6', route: '/hub/pitch', cover: 'tool-pitch' },
  { title: 'Video ngắn', desc: 'Xem clip rồi nói lại cụm từ', icon: '📱', tint: '#FFE3EC', route: '/hub/short', cover: 'tool-short', tag: 'BETA' },
  { title: 'Nói đuổi', desc: 'Nói theo giọng bản ngữ', icon: '🔁', tint: '#EFE4FF', route: '/hub/shadow', cover: 'tool-shadow', tag: 'BETA' },
  { title: 'Tình huống nói', desc: 'Nhập vai, gọi điện, hội thoại', icon: '🎭', tint: '#FFE3E0', route: '/hub/scenarios', cover: 'tool-scenarios' },
  { title: 'Chủ đề', desc: 'Nói 1–2 phút có gợi ý ý', icon: '🌏', tint: '#DDF7E8', route: '/hub/topics', cover: 'tool-topics' },
  { title: 'Gia sư', desc: 'Trò chuyện và sửa lỗi cùng AI', icon: '💡', tint: '#FFF0D6', route: '/hub/tutor', cover: 'grammar' },
  { title: 'Trợ lý họp', desc: 'Phản hồi sau các cuộc họp', icon: '📅', tint: '#F3E9FF', route: '/hub/meeting', cover: 'tool-meeting' },
];

export default function HubExplore() {
  const { L } = useL();
  const roleplayDone = useHubStore((s) => s.roleplayDone);
  const topicsDone = useHubStore((s) => s.topicsDone);
  const phonemeBest = useHubStore((s) => s.phonemeBest);
  const bestByDialogue = useDialogueStore((s) => s.best);
  const addCreatorScenario = useHubStore((s) => s.addCreatorScenario);

  const [creatorOpen, setCreatorOpen] = useState(false);
  const [charName, setCharName] = useState('');
  const [charRole, setCharRole] = useState('Đồng nghiệp');
  const [situation, setSituation] = useState('');
  const [surprise, setSurprise] = useState<(typeof SURPRISES)[number] | null>(null);

  const talks = useMemo(allTalks, []);
  const isDone = (id: string) => (roleplayDone[id] ?? 0) > 0 || (bestByDialogue[id] ?? -1) >= 0;

  // Dựa trên hoạt động: cùng chủ đề với các cuộc đã nói nhưng chưa nói, mức dễ trước; chưa nói gì thì gợi ý theo ngày.
  const forYou = useMemo(() => {
    const doneCats = new Set(talks.filter((t) => isDone(t.id)).map((t) => t.category));
    const pool = talks.filter((t) => !isDone(t.id) && (doneCats.size === 0 || doneCats.has(t.category)));
    const order = { EASY: 0, MEDIUM: 1, HARD: 2 } as const;
    const sorted = [...pool].sort((a, b) => order[a.difficulty] - order[b.difficulty]);
    const seed = dayHash(dayKeyOf(new Date()));
    const start = sorted.length ? seed % Math.max(1, Math.min(sorted.length, 12)) : 0;
    return [...sorted.slice(start), ...sorted.slice(0, start)].slice(0, 8);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [talks, roleplayDone, bestByDialogue]);

  const topicsDoneCount = SPEAKING_TOPICS.filter((t) => topicsDone[t.id]).length;
  const phonemePracticed = Object.keys(phonemeBest ?? {}).length;
  const dialoguesDone = talks.filter((t) => t.kind === 'Hội thoại' && isDone(t.id)).length;
  const dialoguesTotal = talks.filter((t) => t.kind === 'Hội thoại').length;
  const roleDone = talks.filter((t) => t.kind !== 'Hội thoại' && isDone(t.id)).length;
  const roleTotal = talks.length - dialoguesTotal;

  /** Bộ học tập: các bộ thật của app, mỗi bộ có tiến độ tính từ dữ liệu người học. */
  const sets = [
    { title: '44 âm IPA', note: 'Phát âm từng âm, chấm điểm', icon: '🔤', tint: '#DDF5F6', done: phonemePracticed, total: PHONEMES.length, route: '/hub/learn' },
    { title: `${SPEAKING_TOPICS.length} đề luyện nói`, note: 'Part 1, cue card Part 2, Part 3', icon: '🗒️', tint: '#FFF0D6', done: topicsDoneCount, total: SPEAKING_TOPICS.length, route: '/hub/topics' },
    { title: `${dialoguesTotal} hội thoại`, note: 'Nghe, đọc theo, điền từ', icon: '💬', tint: '#EFE4FF', done: dialoguesDone, total: dialoguesTotal, route: '/hub/scenarios' },
    { title: `${roleTotal} nhập vai & gọi điện`, note: 'Từ mục tiêu và phản hồi từng lượt', icon: '🎭', tint: '#FFE3E0', done: roleDone, total: roleTotal, route: '/hub/scenarios' },
  ];

  const startCustom = (role: string, sit: string, goal: string) =>
    router.push({ pathname: '/hub/tutor/[id]', params: { id: 'custom', role, tone: 'Chuyên nghiệp', situation: sit, goal } } as never);

  const handleCreate = () => {
    if (!charName.trim() || !situation.trim()) return;
    addCreatorScenario({ characterName: charName.trim(), characterPersonality: 'Thân thiện, phản hồi chuyên nghiệp', learnerRole: 'Người học', situation: situation.trim(), goals: ['Giao tiếp tự tin', 'Dùng từ chuẩn xác'] });
    setCreatorOpen(false);
    startCustom(`${charName} (${charRole})`, situation.trim(), 'Giao tiếp trôi chảy');
  };

  const pickSurprise = () => setSurprise(SURPRISES[Math.floor(Math.random() * SURPRISES.length)]!);

  return (
    <HubScreen title={L('Khám phá', 'Explore')} subtitle={L('Tìm bài luyện mới theo hoạt động của bạn', 'Find new practice based on what you do')} back padBottom={140}>
      <HubHero
        eyebrow="IELTS · SPEAKING"
        title="Khám phá bài nói mới,"
        accent="hợp với những gì bạn đã luyện"
        stats={[
          { value: String(talks.length), label: 'Cuộc trò chuyện' },
          { value: String(TOOLS.length), label: 'Công cụ AI' },
          { value: `${roleDone + dialoguesDone}`, label: 'Đã nói' },
          { value: `${topicsDoneCount}/${SPEAKING_TOPICS.length}`, label: 'Đề luyện nói' },
        ]}
      />

      <HubPanel title={L('Thử nghiệm nhập vai', 'Roleplay experiments')} icon="gamepad">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          <Pressable accessibilityRole="button" onPress={pickSurprise} style={({ hovered }: Hover) => ({ flexBasis: 260, flexGrow: 1, gap: 8, padding: 16, borderRadius: 18, borderWidth: 1.5, backgroundColor: '#F3E9FF', ...hubLift(hovered) }) as never}>
            <Text style={{ fontSize: 34 }}>🎁</Text>
            <Text style={{ color: HUB_UI.navy, fontSize: 17, fontWeight: '900' }}>{L('Làm tôi ngạc nhiên', 'Surprise me')}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => setCreatorOpen(true)} style={({ hovered }: Hover) => ({ flexBasis: 260, flexGrow: 1, gap: 8, padding: 16, borderRadius: 18, borderWidth: 1.5, backgroundColor: '#E4EEFF', ...hubLift(hovered) }) as never}>
            <Text style={{ fontSize: 34 }}>🔮</Text>
            <Text style={{ color: HUB_UI.navy, fontSize: 17, fontWeight: '900' }}>{L('Tạo của riêng tôi', 'Create my own')}</Text>
          </Pressable>
        </View>
      </HubPanel>

      {forYou.length ? (
        <HubPanel title={L('Dựa trên hoạt động của bạn', 'Based on your activity')} icon="sparkle" badge="✨">
          <TalkRow talks={forYou} done={isDone} />
        </HubPanel>
      ) : null}

      <HubPanel title={L('Công cụ AI', 'AI tools')} icon="bolt" badge={String(TOOLS.length)}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 6 }}>
          {TOOLS.map((t) => (
            <Pressable key={t.title} accessibilityRole="button" accessibilityLabel={t.title} onPress={() => router.push(t.route as never)} style={({ hovered }: Hover) => ({ width: 200, gap: 6, padding: 14, borderRadius: 18, borderWidth: 1.5, backgroundColor: '#FFFFFF', ...hubLift(hovered) }) as never}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                {hubCover(t.cover) ? (
                  <Image source={{ uri: hubCover(t.cover)! }} accessibilityIgnoresInvertColors style={{ width: 64, height: 64, borderRadius: 16, backgroundColor: t.tint }} resizeMode="cover" />
                ) : (
                  <View style={{ width: 64, height: 64, borderRadius: 16, backgroundColor: t.tint, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 30 }}>{t.icon}</Text>
                  </View>
                )}
                {t.tag ? <HubTag label={t.tag} color="#7C3AED" bg="#EDE9FE" /> : null}
              </View>
              <Text style={{ color: HUB_UI.navy, fontSize: 15.5, fontWeight: '900' }}>{t.title}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </HubPanel>

      <HubPanel title={L('Bộ học tập dành cho bạn', 'Study sets for you')} icon="medal">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {sets.map((st) => (
            <Pressable key={st.title} accessibilityRole="button" accessibilityLabel={st.title} onPress={() => router.push(st.route as never)} style={({ hovered }: Hover) => ({ flexBasis: 250, flexGrow: 1, gap: 8, padding: 14, borderRadius: 18, borderWidth: 1.5, backgroundColor: '#FFFFFF', ...hubLift(hovered) }) as never}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: st.tint, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 24 }}>{st.icon}</Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ color: HUB_UI.navy, fontSize: 15.5, fontWeight: '900' }}>{st.title}</Text>
                </View>
                <Icon name="chevron-right" size={16} color={HUB_UI.muted} />
              </View>
              <HubBar ratio={st.done / Math.max(1, st.total)} color={HUB_UI.green} />
              <Text style={{ color: HUB_UI.muted, fontSize: 12.5, fontWeight: '800' }}>{st.done}/{st.total} đã làm</Text>
            </Pressable>
          ))}
        </View>
      </HubPanel>

      <Modal visible={surprise !== null} animationType="fade" transparent onRequestClose={() => setSurprise(null)}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: 'rgba(43,35,80,0.55)' }}>
          <View style={{ width: '100%', maxWidth: 460, gap: 14, padding: 22, borderRadius: 24, backgroundColor: '#FFFFFF' }}>
            <Text style={{ fontSize: 40, textAlign: 'center' }}>🎁</Text>
            <Text style={{ color: HUB_UI.navy, fontSize: 18, fontWeight: '900', textAlign: 'center' }}>{surprise?.title}</Text>
            <Text style={{ color: HUB_UI.muted, fontSize: 14.5, lineHeight: 21 }}>{surprise?.desc}</Text>
            <View style={{ padding: 12, borderRadius: 14, backgroundColor: HUB_UI.wash }}>
              <Text style={{ color: HUB_UI.navy, fontSize: 13.5, fontWeight: '800' }}>Đối phương AI: <Text style={{ fontWeight: '600' }}>{surprise?.role}</Text></Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable accessibilityRole="button" onPress={pickSurprise} style={{ flex: 1, height: 46, borderRadius: 14, borderWidth: 1.5, borderColor: HUB_UI.line, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: HUB_UI.navy, fontWeight: '800' }}>Đổi tình huống</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  const s = surprise;
                  setSurprise(null);
                  if (s) startCustom(s.role, s.title, 'Xử lý tình huống thuyết phục');
                }}
                style={{ flex: 1, height: 46, borderRadius: 14, backgroundColor: HUB_UI.purple, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '900' }}>Bắt đầu hội thoại</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={creatorOpen} animationType="slide" transparent onRequestClose={() => setCreatorOpen(false)}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: 'rgba(43,35,80,0.55)' }}>
          <View style={{ width: '100%', maxWidth: 480, gap: 14, padding: 22, borderRadius: 24, backgroundColor: '#FFFFFF' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: HUB_UI.navy, fontSize: 18, fontWeight: '900' }}>🔮 Tạo của riêng tôi</Text>
                <Text style={{ color: HUB_UI.muted, fontSize: 13.5 }}>Tuỳ chỉnh nhân vật AI và kịch bản nhập vai</Text>
              </View>
              <Pressable accessibilityRole="button" onPress={() => setCreatorOpen(false)}>
                <Icon name="close" size={20} color={HUB_UI.muted} />
              </Pressable>
            </View>
            {[
              { label: 'Tên nhân vật AI', value: charName, set: setCharName, ph: 'Ví dụ: Sarah, nhà tuyển dụng Google…', multi: false },
              { label: 'Vai trò của nhân vật', value: charRole, set: setCharRole, ph: 'Ví dụ: quản lý khó tính, bạn hẹn hò, giám khảo…', multi: false },
              { label: 'Tình huống và mục tiêu', value: situation, set: setSituation, ph: 'Ví dụ: phỏng vấn xin việc, cần đàm phán mức lương…', multi: true },
            ].map((f) => (
              <View key={f.label} style={{ gap: 4 }}>
                <Text style={{ color: HUB_UI.navy, fontSize: 13.5, fontWeight: '800' }}>{f.label}</Text>
                <TextInput value={f.value} onChangeText={f.set} placeholder={f.ph} placeholderTextColor="#A59CC4" multiline={f.multi} style={{ minHeight: f.multi ? 80 : 46, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, borderWidth: 1.5, borderColor: HUB_UI.line, backgroundColor: HUB_UI.wash, color: HUB_UI.navy, fontSize: 15 }} />
              </View>
            ))}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable accessibilityRole="button" onPress={() => setCreatorOpen(false)} style={{ flex: 1, height: 46, borderRadius: 14, borderWidth: 1.5, borderColor: HUB_UI.line, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: HUB_UI.navy, fontWeight: '800' }}>Huỷ</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={handleCreate} style={{ flex: 1, height: 46, borderRadius: 14, backgroundColor: HUB_UI.purple, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#FFFFFF', fontWeight: '900' }}>Bắt đầu nhập vai</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </HubScreen>
  );
}
