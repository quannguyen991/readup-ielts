import React, { useMemo, useState, type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { ProgressBar, tr } from '@/components/hub/CoursePieces';
import { HubScreen } from '@/components/hub/HubScreen';
import { DIFF_COLOR, GLASS_CARD, HUB, SOFT_FILL, SOFT_LINE } from '@/components/hub/theme';
import { CuteBook } from '@/components/illust/Cute';
import { CuteBulb, CuteChat, CuteMic, CuteNotebook, CuteStar } from '@/components/illust/CuteMore';
import { Icon, type IconName } from '@/components/ui/Icon';
import { SPEAKING_TOPICS } from '@/data/hub/speaking-topics';
import { DAILY_TALK_TOPICS } from '@/data/vocab-daily';
import { useL } from '@/i18n/useL';
import { ALL_LESSONS } from '@/services/hub/grammar-course';
import { PRESENTATION_COURSE, courseProgress } from '@/services/hub/presentation-course';
import { CATEGORY_LABEL, ROLEPLAYS, type Roleplay, type ScenarioCategory } from '@/services/hub/roleplay';
import { useCourseStore } from '@/store/useCourseStore';
import { useFresh } from '@/store/useFresh';
import { useHubStore, type UserSet } from '@/store/useHubStore';

type Art = (p: { size?: number }) => React.ReactElement;
type Segment = 'sets' | 'courses' | 'topics';

const SEGMENTS: { id: Segment; icon: IconName; vi: string; en: string }[] = [
  { id: 'sets', icon: 'bookmark', vi: 'Bộ học tập', en: 'Study sets' },
  { id: 'courses', icon: 'book', vi: 'Khoá học', en: 'Courses' },
  { id: 'topics', icon: 'sparkle', vi: 'Chủ đề', en: 'Topics' },
];

const CATEGORY_EN: Record<ScenarioCategory, string> = {
  daily: 'Daily life',
  work: 'Work',
  travel: 'Travel',
  dining: 'Dining',
  shopping: 'Shopping',
  health: 'Health',
  services: 'Services',
  education: 'Education',
  home: 'Home',
};

const CATEGORIES = Object.keys(CATEGORY_EN) as ScenarioCategory[];
const DECK_ART: Art[] = [CuteBook, CuteNotebook, CuteBulb, CuteChat];
const DECK_PREVIEW = 6;
const BAND_SIZE = 12;
const TOPIC_PREVIEW = 10;

/** Trang Khám phá: ba nhánh (Bộ học tập / Khoá học / Chủ đề). Mỗi nhánh có nội dung riêng. */
export default function HubExplore() {
  const { L } = useL();
  const [segment, setSegment] = useState<Segment>('sets');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<ScenarioCategory | 'all'>('all');

  const [creatorOpen, setCreatorOpen] = useState(false);
  const [creatorTab, setCreatorTab] = useState<'single' | 'coop'>('single');
  const [charName, setCharName] = useState('');
  const [charPersonality] = useState('thân thiện, chuyên nghiệp');
  const [learnerRole, setLearnerRole] = useState('');
  const [situation, setSituation] = useState('');
  const [goal1, setGoal1] = useState('');
  const [goal2, setGoal2] = useState('');
  const [goal3, setGoal3] = useState('');

  const [newSetOpen, setNewSetOpen] = useState(false);
  const [newSetTitle, setNewSetTitle] = useState('');
  const [newSetWords, setNewSetWords] = useState('');

  const addCreatorScenario = useHubStore((s) => s.addCreatorScenario);
  const addUserSet = useHubStore((s) => s.addUserSet);

  const q = query.trim().toLowerCase();

  const handleCreateScenario = () => {
    if (!charName.trim() || !situation.trim()) return;
    const goals = [goal1, goal2, goal3].filter(Boolean);
    addCreatorScenario({
      characterName: charName.trim(),
      characterPersonality: charPersonality,
      learnerRole: learnerRole.trim() || 'Người học',
      situation: situation.trim(),
      goals,
      isCoop: creatorTab === 'coop',
    });
    setCreatorOpen(false);
    router.push({
      pathname: '/hub/tutor/[id]',
      params: {
        id: 'custom',
        role: `${charName} (${charPersonality})`,
        tone: charPersonality,
        situation: situation.trim(),
        goal: goals.join('; '),
      },
    } as never);
  };

  const handleSaveNewSet = () => {
    const items = newSetWords.split(/[,\n]/).map((w) => w.trim()).filter(Boolean);
    if (!newSetTitle.trim() || items.length === 0) return;
    addUserSet(newSetTitle.trim(), items.slice(0, 40));
    setNewSetTitle('');
    setNewSetWords('');
    setNewSetOpen(false);
  };

  /** Mở ngẫu nhiên một kịch bản có sẵn; chế độ gọi điện đi tới màn gọi. */
  const pickRandomRoleplay = () => {
    const pick = ROLEPLAYS[Math.floor(Math.random() * ROLEPLAYS.length)];
    if (pick) openRoleplay(pick);
  };

  return (
    <HubScreen
      title={L('Khám phá', 'Explore')}
      subtitle={L('Nhập vai thực chiến · Bộ học tập · Khoá học có cấp độ', 'Real-life roleplay · Study sets · Leveled courses')}
    >
      {/* Ba nhánh */}
      <View style={{ flexDirection: 'row', padding: 4, borderRadius: 16, backgroundColor: SOFT_FILL, borderWidth: 1, borderColor: SOFT_LINE }}>
        {SEGMENTS.map((s) => {
          const on = segment === s.id;
          return (
            <Pressable
              key={s.id}
              accessibilityRole="tab"
              aria-selected={on}
              onPress={() => setSegment(s.id)}
              style={[
                {
                  flex: 1,
                  height: 44,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: 6,
                  borderWidth: 1,
                  borderColor: on ? HUB.blue : 'transparent',
                  backgroundColor: on ? '#FFFFFF' : 'transparent',
                },
                on ? { shadowColor: '#784415', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } } : null,
              ]}
            >
              <Icon name={s.icon} size={16} color={on ? HUB.blue : HUB.muted} />
              <Text style={{ color: on ? HUB.ink : HUB.muted, fontSize: 13, fontWeight: '800' }}>{L(s.vi, s.en)}</Text>
            </Pressable>
          );
        })}
      </View>

      {segment === 'courses' ? null : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, height: 46, borderRadius: 14, paddingHorizontal: 12, backgroundColor: HUB.glassStrong, borderWidth: 1, borderColor: HUB.line }}>
          <Icon name="search" size={16} color={HUB.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={L('Tìm chủ đề, ví dụ: cà phê, phỏng vấn, deadline', 'Search a topic, e.g. coffee, interview, deadline')}
            placeholderTextColor={HUB.muted}
            accessibilityLabel={L('Tìm chủ đề', 'Search topics')}
            style={{ flex: 1, height: 44, color: HUB.ink, fontSize: 14 }}
          />
        </View>
      )}

      {segment === 'sets' ? (
        <SetsBranch q={q} category={category} onCategory={setCategory} onRandom={pickRandomRoleplay} onCreator={() => setCreatorOpen(true)} onNewSet={() => setNewSetOpen(true)} />
      ) : null}
      {segment === 'courses' ? <CoursesBranch /> : null}
      {segment === 'topics' ? <TopicsBranch q={q} /> : null}

      {/* Creator Mode & Co-op: tạo vai AI cá nhân */}
      <Modal visible={creatorOpen} animationType="slide" transparent onRequestClose={() => setCreatorOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(42, 24, 8, 0.55)', justifyContent: 'center', padding: 16 }}>
          <View style={[GLASS_CARD, { padding: 20, gap: 14, maxHeight: '90%' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <CuteBulb size={30} />
                <Text style={{ color: HUB.ink, fontSize: 17, fontWeight: '800' }}>{L('Tạo của riêng tôi', 'Create my own')}</Text>
              </View>
              <Pressable accessibilityLabel={L('Đóng', 'Close')} onPress={() => setCreatorOpen(false)} style={{ padding: 4 }}>
                <Icon name="close" size={20} color={HUB.muted} />
              </Pressable>
            </View>

            <View style={{ flexDirection: 'row', padding: 4, borderRadius: 12, backgroundColor: SOFT_FILL, borderWidth: 1, borderColor: SOFT_LINE }}>
              <Pressable
                accessibilityRole="tab"
                aria-selected={creatorTab === 'single'}
                onPress={() => setCreatorTab('single')}
                style={{ flex: 1, height: 38, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: creatorTab === 'single' ? '#7C3AED' : 'transparent' }}
              >
                <Text style={{ color: creatorTab === 'single' ? '#FFFFFF' : HUB.muted, fontSize: 12, fontWeight: '800' }}>{L('Vai AI cá nhân', 'Personal AI role')}</Text>
              </Pressable>
              <Pressable
                accessibilityRole="tab"
                aria-selected={creatorTab === 'coop'}
                onPress={() => setCreatorTab('coop')}
                style={{ flex: 1, height: 38, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: creatorTab === 'coop' ? HUB.blue : 'transparent' }}
              >
                <Text style={{ color: creatorTab === 'coop' ? '#FFFFFF' : HUB.muted, fontSize: 12, fontWeight: '800' }}>{L('Đôi (2 người)', 'Co-op (2 people)')}</Text>
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={{ gap: 10 }}>
              <CreatorField label={L('Tên và tính cách nhân vật AI', 'AI character name and personality')} value={charName} onChange={setCharName} placeholder={L('Ví dụ: Mr. Alex (giám khảo khó tính)', 'E.g. Mr. Alex (a strict examiner)')} />
              <CreatorField label={L('Vai trò của người học', 'Learner role')} value={learnerRole} onChange={setLearnerRole} placeholder={L('Ví dụ: Kỹ sư bảo vệ đồ án', 'E.g. Engineer defending a project')} />
              <CreatorField label={L('Bối cảnh tình huống', 'Situation')} value={situation} onChange={setSituation} placeholder={L('Ví dụ: Cuộc họp gấp về việc lùi ngày ra mắt', 'E.g. An urgent meeting about moving the launch date')} multiline />
              <CreatorField label={L('Mục tiêu 1', 'Goal 1')} value={goal1} onChange={setGoal1} placeholder={L('Ví dụ: Thuyết phục đối phương', 'E.g. Persuade the other side')} />
              <CreatorField label={L('Mục tiêu 2', 'Goal 2')} value={goal2} onChange={setGoal2} placeholder={L('Ví dụ: Dùng ít nhất 3 collocations', 'E.g. Use at least 3 collocations')} />
              <CreatorField label={L('Mục tiêu 3', 'Goal 3')} value={goal3} onChange={setGoal3} placeholder={L('Ví dụ: Không ngập ngừng quá 2 giây', 'E.g. No hesitation longer than 2 seconds')} />

              {creatorTab === 'coop' ? (
                <View style={{ padding: 12, borderRadius: 12, backgroundColor: 'rgba(140, 83, 27, 0.10)', borderWidth: 1, borderColor: 'rgba(140, 83, 27, 0.35)', gap: 4 }}>
                  <Text style={{ color: HUB.blue, fontSize: 12, fontWeight: '800' }}>{L('Đôi (2 người)', 'Co-op (2 people)')}</Text>
                  <Text style={{ color: HUB.body, fontSize: 12, lineHeight: 17 }}>
                    {L('Trọng tài AI điều phối lượt nói giữa hai bạn, chấm phản biện và chọn người thắng sau 5 lượt.', 'An AI referee takes turns between the two of you, scores your arguments and picks a winner after five rounds.')}
                  </Text>
                </View>
              ) : null}
            </ScrollView>

            <Pressable
              accessibilityRole="button"
              onPress={handleCreateScenario}
              style={{ height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: creatorTab === 'coop' ? HUB.blue : '#7C3AED' }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '800' }}>
                {creatorTab === 'coop' ? L('Bắt đầu ghép cặp', 'Start pairing') : L('Khởi tạo phòng nhập vai', 'Create the roleplay room')}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Tạo bộ học tập mới */}
      <Modal visible={newSetOpen} animationType="slide" transparent onRequestClose={() => setNewSetOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(42, 24, 8, 0.55)', justifyContent: 'center', padding: 18 }}>
          <View style={[GLASS_CARD, { padding: 20, gap: 12 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ color: HUB.ink, fontSize: 16, fontWeight: '800' }}>{L('Tạo bộ học tập mới', 'Create a new study set')}</Text>
              <Pressable accessibilityLabel={L('Đóng', 'Close')} onPress={() => setNewSetOpen(false)}>
                <Icon name="close" size={20} color={HUB.muted} />
              </Pressable>
            </View>
            <TextInput
              value={newSetTitle}
              onChangeText={setNewSetTitle}
              placeholder={L('Tên bộ từ, ví dụ: Từ vựng du học 2026', 'Set name, e.g. Study-abroad words 2026')}
              placeholderTextColor={HUB.muted}
              style={{ height: 44, borderRadius: 10, paddingHorizontal: 12, color: HUB.ink, backgroundColor: HUB.glassStrong, borderWidth: 1, borderColor: HUB.line }}
            />
            <TextInput
              value={newSetWords}
              onChangeText={setNewSetWords}
              placeholder={L('Các từ, cách nhau bằng dấu phẩy (ví dụ: curriculum, scholarship)', 'Words separated by commas (e.g. curriculum, scholarship)')}
              placeholderTextColor={HUB.muted}
              multiline
              style={{ minHeight: 90, borderRadius: 10, padding: 12, color: HUB.ink, backgroundColor: HUB.glassStrong, borderWidth: 1, borderColor: HUB.line, textAlignVertical: 'top' }}
            />
            <Pressable accessibilityRole="button" onPress={handleSaveNewSet} style={{ height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: HUB.blue }}>
              <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>{L('Lưu bộ học tập', 'Save study set')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </HubScreen>
  );
}

function openRoleplay(r: Roleplay) {
  router.push((r.mode === 'call' ? `/hub/call/${r.id}` : `/hub/roleplay/${r.id}`) as never);
}

function SetsBranch({
  q,
  category,
  onCategory,
  onRandom,
  onCreator,
  onNewSet,
}: {
  q: string;
  category: ScenarioCategory | 'all';
  onCategory: (c: ScenarioCategory | 'all') => void;
  onRandom: () => void;
  onCreator: () => void;
  onNewSet: () => void;
}) {
  const { L, en } = useL();
  const roleplayDone = useFresh(useHubStore, (s) => s.roleplayDone);
  const saved = useFresh(useHubStore, (s) => s.saved);
  const toggleSaved = useHubStore((s) => s.toggleSaved);
  const userSets = useFresh(useHubStore, (s) => s.userSets);
  const removeUserSet = useHubStore((s) => s.removeUserSet);

  // Ưu tiên kịch bản chưa làm; đã làm rồi thì xuống sau. Không có gì lấy từ dữ liệu giả.
  const band = useMemo(() => {
    const pool = ROLEPLAYS.filter((r) => {
      const matchCat = category === 'all' || r.category === category;
      const matchQ = !q || r.title.toLowerCase().includes(q) || r.scene.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
    return [...pool].sort((a, b) => Number(!!roleplayDone[a.id]) - Number(!!roleplayDone[b.id])).slice(0, BAND_SIZE);
  }, [q, category, roleplayDone]);

  const decks = useMemo(
    () => DAILY_TALK_TOPICS.filter((d) => !q || d.name.toLowerCase().includes(q) || d.nameVi.toLowerCase().includes(q)).slice(0, DECK_PREVIEW),
    [q],
  );

  return (
    <View style={{ gap: 22 }}>
      <Section title={L('Thử nghiệm nhập vai', 'Roleplay lab')}>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Pressable
            accessibilityRole="button"
            onPress={onRandom}
            style={[GLASS_CARD, { flex: 1, padding: 14, minHeight: 150, justifyContent: 'space-between', borderColor: 'rgba(245, 158, 11, 0.45)', backgroundColor: '#FFF7E6' }]}
          >
            <CuteStar size={52} />
            <View style={{ gap: 4 }}>
              <Pill text={L('NGẪU NHIÊN', 'RANDOM')} color="#B45309" />
              <Text style={{ color: HUB.ink, fontSize: 15, fontWeight: '800' }}>{L('Làm tôi ngạc nhiên', 'Surprise me')}</Text>
              <Text style={{ color: HUB.muted, fontSize: 11, lineHeight: 16 }}>{L('Mở ngẫu nhiên một tình huống nhập vai', 'Open a random roleplay scene')}</Text>
            </View>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={onCreator}
            style={[GLASS_CARD, { flex: 1, padding: 14, minHeight: 150, justifyContent: 'space-between', borderColor: 'rgba(124, 58, 237, 0.35)', backgroundColor: '#F5F0FF' }]}
          >
            <CuteBulb size={52} />
            <View style={{ gap: 4 }}>
              <Pill text={L('TỰ TẠO', 'CREATE')} color="#6D28D9" />
              <Text style={{ color: HUB.ink, fontSize: 15, fontWeight: '800' }}>{L('Tạo của riêng tôi', 'Create my own')}</Text>
              <Text style={{ color: HUB.muted, fontSize: 11, lineHeight: 16 }}>{L('Đặt vai AI, bối cảnh và ba mục tiêu', 'Set the AI role, the situation and three goals')}</Text>
            </View>
          </Pressable>
        </View>
      </Section>

      <Section
        title={L('Dựa trên hoạt động của bạn', 'Based on your activity')}
        action={<LinkButton label={L('Xem tất cả', 'See all')} onPress={() => router.push('/hub/scenarios' as never)} />}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 2 }}>
          {[{ id: 'all' as const, label: L('Tất cả', 'All') }, ...CATEGORIES.map((c) => ({ id: c, label: en ? CATEGORY_EN[c] : CATEGORY_LABEL[c] }))].map((c) => {
            const on = category === c.id;
            return (
              <Pressable
                key={c.id}
                accessibilityRole="button"
                onPress={() => onCategory(c.id)}
                style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: on ? HUB.blue : HUB.glassStrong, borderWidth: 1, borderColor: on ? HUB.blue : HUB.line }}
              >
                <Text style={{ color: on ? '#FFFFFF' : HUB.muted, fontSize: 12, fontWeight: on ? '800' : '600' }}>{c.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {band.length === 0 ? (
          <Text style={{ color: HUB.muted, fontSize: 13 }}>{L('Không có tình huống khớp bộ lọc.', 'No scenes match the filter.')}</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingVertical: 2 }}>
            {band.map((r) => (
              <ScenarioCard key={r.id} r={r} done={roleplayDone[r.id] ?? 0} />
            ))}
          </ScrollView>
        )}
      </Section>

      <Section
        title={L('Bộ học tập dành cho bạn', 'Study sets for you')}
        action={<LinkButton label={L('+ Tạo bộ mới', '+ New set')} onPress={onNewSet} color="#7C3AED" />}
      >
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {userSets.map((set) => (
            <UserSetCard key={set.id} set={set} onRemove={() => removeUserSet(set.id)} />
          ))}
          {decks.map((d, i) => {
            const Art = DECK_ART[i % DECK_ART.length]!;
            const isSaved = saved.includes(`deck:${d.slug}`);
            return (
              <View key={d.slug} style={[GLASS_CARD, { width: '48%', flexGrow: 1, flexBasis: 150, padding: 12, gap: 8 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: HUB.goldSoft }}>
                    <Art size={34} />
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={isSaved ? L('Bỏ lưu bộ học', 'Unsave set') : L('Lưu bộ học', 'Save set')}
                    onPress={() => toggleSaved(`deck:${d.slug}`)}
                    hitSlop={8}
                    style={{ padding: 4 }}
                  >
                    <Icon name="bookmark" size={18} color={isSaved ? '#D98A0B' : HUB.muted} />
                  </Pressable>
                </View>
                <Pressable accessibilityRole="button" onPress={() => router.push(`/vocabulary/topic/${d.slug}` as never)} style={{ gap: 3 }}>
                  <Text numberOfLines={1} style={{ color: HUB.ink, fontSize: 14, fontWeight: '800' }}>
                    {en ? d.name : d.nameVi}
                  </Text>
                  <Text style={{ color: HUB.muted, fontSize: 11, fontWeight: '700' }}>{L(`${d.words.length} từ`, `${d.words.length} words`)}</Text>
                </Pressable>
              </View>
            );
          })}
        </View>
        <LinkButton label={L(`Xem tất cả ${DAILY_TALK_TOPICS.length} bộ`, `See all ${DAILY_TALK_TOPICS.length} sets`)} onPress={() => router.push('/vocabulary/topics' as never)} />
      </Section>
    </View>
  );
}

function CoursesBranch() {
  const { L, en } = useL();
  const courseDone = useFresh(useCourseStore, (s) => s.done);
  const lessonsDone = useFresh(useHubStore, (s) => s.lessonsDone);
  const topicsDone = useFresh(useHubStore, (s) => s.topicsDone);

  const pres = courseProgress(PRESENTATION_COURSE, courseDone);
  const grammarDone = ALL_LESSONS.filter((l) => lessonsDone[l.id]).length;
  const topicCount = SPEAKING_TOPICS.filter((t) => topicsDone[t.id]).length;

  return (
    <Section title={L('Các khoá học dành cho bạn', 'Courses for you')}>
      <Pressable accessibilityRole="button" onPress={() => router.push('/hub/course/presentation' as never)} style={[GLASS_CARD, { padding: 16, gap: 12 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <ArtTile art={CuteMic} />
          <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
            <Pill text={L('CÓ CẤP ĐỘ', 'LEVELED')} color="#0F766E" />
            <Text style={{ color: HUB.ink, fontSize: 16, fontWeight: '800' }}>{tr(PRESENTATION_COURSE.title, en)}</Text>
            <Text style={{ color: HUB.muted, fontSize: 12, lineHeight: 17 }}>
              {L('Ba cấp: cấu trúc, thiết kế slide, trình bày. Có bài kiểm tra có điểm.', 'Three levels: structure, slide design, delivery. Includes scored checks.')}
            </Text>
          </View>
          <Icon name="chevron-right" size={18} color={HUB.muted} />
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {[L('Cấu trúc', 'Structure'), L('Thiết kế slide', 'Slide design'), L('Trình bày', 'Delivery')].map((t) => (
            <Pill key={t} text={t} color={HUB.sky} />
          ))}
        </View>
        <CourseProgress done={pres.done} total={pres.total} />
      </Pressable>

      <CourseCard
        art={CuteBook}
        title={L('Làm chủ ngữ pháp', 'Grammar mastery')}
        subtitle={L('Lộ trình A1 → C với bài học và trắc nghiệm', 'A1 → C path with lessons and quizzes')}
        done={grammarDone}
        total={ALL_LESSONS.length}
        onPress={() => router.push('/hub/tutor/grammar' as never)}
      />
      <CourseCard
        art={CuteChat}
        title={L('Đề luyện nói theo chủ đề', 'Speaking by topic')}
        subtitle={L('Part 1, cue card và Part 3 cho từng chủ đề', 'Part 1, cue card and Part 3 for each topic')}
        done={topicCount}
        total={SPEAKING_TOPICS.length}
        onPress={() => router.push('/hub/topics' as never)}
      />
    </Section>
  );
}

function CourseCard({ art, title, subtitle, done, total, onPress }: { art: Art; title: string; subtitle: string; done: number; total: number; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[GLASS_CARD, { padding: 16, gap: 12 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <ArtTile art={art} />
        <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
          <Text style={{ color: HUB.ink, fontSize: 15, fontWeight: '800' }}>{title}</Text>
          <Text style={{ color: HUB.muted, fontSize: 12, lineHeight: 17 }}>{subtitle}</Text>
        </View>
        <Icon name="chevron-right" size={18} color={HUB.muted} />
      </View>
      <CourseProgress done={done} total={total} />
    </Pressable>
  );
}

/** Thanh tiến độ kèm dòng đếm: số bài đã xong trên tổng và phần trăm. */
function CourseProgress({ done, total }: { done: number; total: number }) {
  const { L } = useL();
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <View style={{ gap: 6 }}>
      <ProgressBar done={done} total={total} />
      <Text style={{ color: HUB.muted, fontSize: 12, fontWeight: '700' }}>{L(`${done}/${total} đã xong · ${pct}%`, `${done}/${total} done · ${pct}%`)}</Text>
    </View>
  );
}

function TopicsBranch({ q }: { q: string }) {
  const { L, en } = useL();
  const topicsDone = useFresh(useHubStore, (s) => s.topicsDone);
  const list = SPEAKING_TOPICS.filter((t) => !q || t.title.toLowerCase().includes(q) || t.titleVi.toLowerCase().includes(q)).slice(0, TOPIC_PREVIEW);

  return (
    <Section
      title={L('Chủ đề luyện nói', 'Speaking topics')}
      action={<LinkButton label={L('Xem tất cả', 'See all')} onPress={() => router.push('/hub/topics' as never)} />}
    >
      {list.length === 0 ? (
        <Text style={{ color: HUB.muted, fontSize: 13 }}>{L('Không có chủ đề khớp từ khoá.', 'No topics match your search.')}</Text>
      ) : (
        <View style={{ gap: 8 }}>
          {list.map((t) => {
            const done = !!topicsDone[t.id];
            return (
              <Pressable
                key={t.id}
                accessibilityRole="button"
                onPress={() => router.push(`/hub/topics/${t.id}` as never)}
                style={[GLASS_CARD, { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 }]}
              >
                <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                  <Text numberOfLines={1} style={{ color: HUB.ink, fontSize: 14, fontWeight: '800' }}>
                    {en ? t.title : t.titleVi}
                  </Text>
                  <Text style={{ color: HUB.muted, fontSize: 11 }}>{done ? L('Đã làm', 'Done') : L('Chưa làm', 'Not yet')}</Text>
                </View>
                {done ? <Icon name="check" size={18} color={HUB.green} strokeWidth={2.4} /> : <Icon name="chevron-right" size={18} color={HUB.muted} />}
              </Pressable>
            );
          })}
        </View>
      )}
    </Section>
  );
}

function ScenarioCard({ r, done }: { r: Roleplay; done: number }) {
  const { L, en } = useL();
  const diff = DIFF_COLOR[r.difficulty];
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={r.title} onPress={() => openRoleplay(r)} style={[GLASS_CARD, { width: 230, padding: 14, gap: 8 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pill text={r.difficulty} color={diff} />
        <Text style={{ color: HUB.muted, fontSize: 11, fontWeight: '700' }}>{L(`${r.minutes} phút`, `${r.minutes} min`)}</Text>
      </View>
      <Text numberOfLines={2} style={{ color: HUB.ink, fontSize: 14, fontWeight: '800', lineHeight: 19 }}>
        {r.title}
      </Text>
      <Text numberOfLines={2} style={{ color: HUB.muted, fontSize: 12, lineHeight: 17 }}>
        {r.scene}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ color: HUB.sky, fontSize: 11, fontWeight: '700' }}>{en ? CATEGORY_EN[r.category] : CATEGORY_LABEL[r.category]}</Text>
        {done > 0 ? <Text style={{ color: HUB.green, fontSize: 11, fontWeight: '800' }}>{L(`Đã làm ${done} lần`, `Done ${done}×`)}</Text> : null}
      </View>
    </Pressable>
  );
}

function UserSetCard({ set, onRemove }: { set: UserSet; onRemove: () => void }) {
  const { L } = useL();
  return (
    <View style={[GLASS_CARD, { width: '48%', flexGrow: 1, flexBasis: 150, padding: 12, gap: 8 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F0FF' }}>
          <CuteNotebook size={34} />
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={L('Xoá bộ học', 'Delete set')} onPress={onRemove} hitSlop={8} style={{ padding: 4 }}>
          <Icon name="close" size={16} color={HUB.muted} />
        </Pressable>
      </View>
      <View style={{ gap: 3 }}>
        <Text numberOfLines={1} style={{ color: HUB.ink, fontSize: 14, fontWeight: '800' }}>
          {set.title}
        </Text>
        <Text numberOfLines={2} style={{ color: HUB.muted, fontSize: 11, lineHeight: 15 }}>
          {set.items.slice(0, 4).join(', ')}
        </Text>
        <Text style={{ color: HUB.sky, fontSize: 11, fontWeight: '700' }}>{L(`${set.items.length} từ · bộ của bạn`, `${set.items.length} words · your set`)}</Text>
      </View>
    </View>
  );
}

function ArtTile({ art: Art }: { art: Art }) {
  return (
    <View style={{ width: 60, height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: HUB.goldSoft }}>
      <Art size={44} />
    </View>
  );
}

function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <Text style={{ color: HUB.ink, fontSize: 14, fontWeight: '800', letterSpacing: 0.4, textTransform: 'uppercase' }}>{title}</Text>
        {action}
      </View>
      {children}
    </View>
  );
}

function LinkButton({ label, onPress, color = HUB.sky }: { label: string; onPress: () => void; color?: string }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' }}>
      <Text style={{ color, fontSize: 12, fontWeight: '800' }}>{label}</Text>
    </Pressable>
  );
}

function Pill({ text, color }: { text: string; color: string }) {
  return (
    <View style={{ alignSelf: 'flex-start', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, backgroundColor: `${color}1F`, borderWidth: 1, borderColor: `${color}55` }}>
      <Text style={{ color, fontSize: 10, fontWeight: '800', letterSpacing: 0.3 }}>{text}</Text>
    </View>
  );
}

function CreatorField({
  label,
  value,
  onChange,
  placeholder,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  multiline?: boolean;
}) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={{ color: HUB.ink, fontSize: 12, fontWeight: '700' }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={HUB.muted}
        multiline={multiline}
        accessibilityLabel={label}
        style={[
          { color: HUB.ink, backgroundColor: HUB.glassStrong, borderWidth: 1, borderColor: HUB.line, borderRadius: 10, paddingHorizontal: 10 },
          multiline ? { minHeight: 60, padding: 10, textAlignVertical: 'top' } : { height: 42 },
        ]}
      />
    </View>
  );
}
