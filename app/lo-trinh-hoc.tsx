import React, { useMemo, useState } from 'react';
import { Platform, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import { HeroShell } from '@/components/layout/HeroShell';
import { CTA_GRADIENT } from '@/components/layout/LightHero';
import { Screen } from '@/components/layout/Screen';
import { useHydrated } from '@/components/layout/useHydrated';
import { Appear } from '@/components/motion/Motion';
import { CuteRocket, Motion } from '@/components/illust/CuteMore';
import { Sticker } from '@/components/illust/Sticker';
import { HEADER_ART_MIN } from '@/components/three/hero-star-policy';
import { Icon } from '@/components/ui/Icon';
import { ExamSwitch, LevelPicker, NodeDetail, P, PartTrail, ProgressLine, primaryLabel } from '@/components/learning-path/PathUi';
import { usePathData } from '@/components/learning-path/usePathData';
import { PathPlanner } from '@/components/learning-path/PathPlanner';
import {
  KIND_SKILL,
  defaultExamFor,
  defaultLevelFor,
  levelsOf,
  partOfNode,
  targetHref,
  type PathExam,
  type PathLevel,
  type PathNode,
} from '@/data/learning-path';
import { useL } from '@/i18n/useL';
import { levelProgress, nodeStatus, type LevelProgress } from '@/services/learning-path/progress';
import { focusNodes } from '@/services/learning-path/schedule';
import { PATH_RESOLVERS } from '@/services/learning-path/resolvers';
import { useLearningPathStore } from '@/store/useLearningPathStore';
import { useRoadmapStore } from '@/store/useRoadmapStore';

/**
 * LỘ TRÌNH HỌC THEO TRÌNH ĐỘ — IELTS (4.0–5.0 / 5.5–6.5 / 7.0+) và SAT
 * (~1000 / ~1200 / 1400+). Mỗi trình độ 6 Part theo chủ đề, mỗi Part 4–7 bài
 * nối thẳng vào nội dung có sẵn của app. Người dùng duyệt 01/10/2026.
 *
 * Không khoá bài nào; bài chưa xong sớm nhất được tô xanh đậm là "học tiếp".
 * "Xong" đọc từ dữ liệu học thật (`services/learning-path/progress.ts`); chỉ
 * bài đọc song ngữ là người học tự đánh dấu, và giao diện ghi rõ như vậy.
 *
 * Dữ liệu bài ở `src/data/learning-path/`; test canh mọi đích đều có thật.
 */
export default function LearningPathScreen() {
  const { L, en } = useL();
  const hydrated = useHydrated();
  const { width } = useWindowDimensions();
  // Hai cột chỉ khi đủ chỗ: khung trò chuyện trợ lý chiếm thêm 340px ở máy tính.
  const wide = width >= 1480;
  const compactPicker = width < 560;

  const planInput = useRoadmapStore((s) => s.input);
  const storedExam = useLearningPathStore((s) => s.exam);
  const storedLevels = useLearningPathStore((s) => s.levels);
  const setExam = useLearningPathStore((s) => s.setExam);
  const setLevel = useLearningPathStore((s) => s.setLevel);
  const toggleManual = useLearningPathStore((s) => s.toggleManual);

  // Trước hydrate vẽ đúng như máy chủ (IELTS, trình độ đầu), rồi mới theo lựa chọn đã lưu / lộ trình cá nhân.
  const input = hydrated ? planInput : null;
  const exam: PathExam = hydrated ? (storedExam ?? defaultExamFor(input)) : 'ielts';
  const levels = levelsOf(exam);
  const planLevel = input?.[exam] ? defaultLevelFor(exam, input) : null;
  const level: PathLevel = (hydrated ? levels.find((l) => l.id === storedLevels[exam]) : undefined) ?? planLevel ?? levels[0]!;

  const data = usePathData();
  const prog = useMemo(() => levelProgress(level, data, PATH_RESOLVERS), [level, data]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Mã bài là duy nhất giữa các trình độ, nên đổi trình độ thì bài đang chọn tự không khớp nữa — không cần xoá.

  const focus = useLearningPathStore((s) => s.focus[exam]);
  const focusExtra = useMemo(
    () => (hydrated && focus?.length ? focusNodes(exam, focus, level, levels, (id) => {
      const n = levels.flatMap((l) => l.parts.flatMap((p) => p.nodes)).find((x) => x.id === id);
      return !!n && nodeStatus(n, data, PATH_RESOLVERS).state === 'done';
    }) : []),
    [hydrated, focus, exam, level, levels, data],
  );
  const goal = input?.[exam] ?? null;
  const planRhythm = input ? { minutesPerDay: input.minutesPerDay, studyDays: input.studyDays, examIso: goal?.examIso || null } : null;

  const allNodes = useMemo(() => level.parts.flatMap((p) => p.nodes), [level]);
  // Máy tính: cột bên luôn hiện một bài — bài đang chọn, mặc định là bài học tiếp.
  const panelNode = allNodes.find((n) => n.id === selectedId) ?? prog.next ?? allNodes[0]!;

  const open = (n: PathNode) => {
    const href = targetHref(n.target);
    if (href) router.push(href as never);
  };
  const select = (id: string) => setSelectedId((cur) => (!wide && cur === id ? null : id));

  const pct = prog.total > 0 ? Math.round((prog.done / prog.total) * 100) : 0;
  const nextPart = prog.next ? partOfNode(level, prog.next.id) : undefined;
  const nextPartNo = nextPart ? level.parts.indexOf(nextPart) + 1 : 0;

  const detailFor = (n: PathNode, dark: boolean) => {
    return (
      <NodeDetail
        node={n}
        status={prog.statuses[n.id]}
        isNext={prog.next?.id === n.id}
        dark={dark}
        onOpen={() => open(n)}
        onToggleManual={() => toggleManual(n.id)}
      />
    );
  };

  /* ---------------------------------------------------------------- bảng chọn lộ trình */
  const selector = (
    <View style={{ borderRadius: 24, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EEE9FF', padding: compactPicker ? 16 : 22, gap: 20, boxShadow: '0 10px 28px rgba(106,75,217,0.08)' } as object}>
      <View style={{ flexDirection: compactPicker ? 'column' : 'row', alignItems: compactPicker ? 'stretch' : 'center', justifyContent: 'space-between', gap: 14 }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
            <View style={{ width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: P.goldLight }}>
              <Icon name="compass" size={14} color={P.goldDeep} strokeWidth={2.4} />
            </View>
            <Text className="font-strong" style={{ fontSize: 11, letterSpacing: 1.5, color: P.goldDeep }}>{L('LỘ TRÌNH CỦA BẠN', 'YOUR LEARNING PATH')}</Text>
          </View>
          <Text className="font-heavy" style={{ marginTop: 7, fontSize: 20, lineHeight: 26, color: P.navy }}>{L('Chọn điểm bắt đầu', 'Choose your starting point')}</Text>
          <Text className="font-sans" style={{ marginTop: 3, fontSize: 13, lineHeight: 19, color: P.muted }}>{L('Điều chỉnh kỳ thi và trình độ theo mục tiêu của bạn.', 'Set the exam and level that match your goal.')}</Text>
        </View>
        <View style={{ width: compactPicker ? '100%' : 250 }}>
          <ExamSwitch value={exam} onChange={setExam} />
        </View>
      </View>

      <View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 9 }}>
          <Text className="font-heavy" style={{ fontSize: 15, color: P.navy }}>{L('Trình độ hiện tại', 'Current level')}</Text>
          {planLevel ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5, backgroundColor: P.goldWash }}><Icon name="target" size={12} color={P.goldDeep} /><Text className="font-strong" style={{ fontSize: 11, color: P.goldDeep }}>{L('Gợi ý cho bạn', 'Suggested for you')}</Text></View> : null}
        </View>
        <LevelPicker levels={levels} value={level.id} planLevelId={planLevel?.id ?? null} onChange={(id) => setLevel(exam, id)} compact={compactPicker} />
        <Text className="font-sans" style={{ marginTop: 9, fontSize: 13, lineHeight: 19, color: P.muted }}>{en ? level.blurb.en : level.blurb.vi}</Text>
      </View>

      <View style={{ borderRadius: 17, backgroundColor: P.goldWash, borderWidth: 1, borderColor: P.line, padding: compactPicker ? 13 : 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' }}><Icon name="gauge" size={16} color={P.gold} strokeWidth={2.4} /></View>
            <Text className="font-heavy" style={{ fontSize: 14, color: P.navy }}>{L('Tiến độ học', 'Your progress')}</Text>
          </View>
          <Text className="font-heavy" style={{ fontSize: 20, color: P.navy }}>{prog.done}<Text className="font-semi" style={{ fontSize: 13, color: P.muted }}> / {prog.total} {L('bài', 'lessons')}</Text></Text>
        </View>
        <View style={{ marginTop: 10 }}><ProgressLine done={prog.done} total={prog.total} /></View>
        <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: compactPicker ? 7 : 11, flex: 1 }} aria-hidden>
            {level.parts.map((p, i) => {
              const pp = prog.parts[p.id]!;
              const complete = pp.done === pp.total;
              return <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: complete ? '#64B58A' : pp.done > 0 ? P.gold : P.line }} /><Text className="font-semi" style={{ fontSize: 11, color: P.muted }}>P{i + 1} {pp.done}/{pp.total}</Text></View>;
            })}
          </View>
          <Text className="font-heavy" style={{ fontSize: 12, color: P.goldDeep }}>{pct}%</Text>
        </View>
      </View>
    </View>
  );

  /* ---------------------------------------------------------------- cuống vé "học tiếp" (điện thoại) */
  const nextStub = (
    <View style={{ marginTop: 14, borderRadius: 20, backgroundColor: P.navy, overflow: 'hidden' }}>
      <View pointerEvents="none" style={{ position: 'absolute', top: 7, left: 7, right: 7, bottom: 7, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(226,200,143,0.3)' }} />
      <View style={{ padding: 18 }}>
        {prog.next ? (
          <>
            <Text className="font-strong" style={{ fontSize: 12, letterSpacing: 1.6, color: P.goldLight }}>
              {L(`HỌC TIẾP · PART ${nextPartNo} · ${(nextPart?.title.vi ?? '').toUpperCase()}`, `UP NEXT · PART ${nextPartNo} · ${(nextPart?.title.en ?? '').toUpperCase()}`)}
            </Text>
            <Text className="font-heavy" style={{ marginTop: 6, fontSize: 20, lineHeight: 26, color: '#FFFFFF' }}>
              {en ? prog.next.title.en : prog.next.title.vi}
            </Text>
            <Text className="font-semi" style={{ marginTop: 2, fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
              {en ? KIND_SKILL[prog.next.target.kind].en : KIND_SKILL[prog.next.target.kind].vi} · {L(`~${prog.next.minutes} phút`, `~${prog.next.minutes} min`)}
            </Text>
            <Pressable
              accessibilityRole="link"
              onPress={() => open(prog.next!)}
              style={{ marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 10, paddingVertical: 12, backgroundColor: P.goldLight }}
            >
              <Text className="font-heavy" style={{ fontSize: 15, color: P.navy }}>
                {primaryLabel(prog.statuses[prog.next.id], L)}
              </Text>
              <Icon name="arrow-right" size={16} color={P.navy} strokeWidth={2.4} />
            </Pressable>
          </>
        ) : (
          <AllDone level={level} levels={levels} onNext={(id) => setLevel(exam, id)} />
        )}
      </View>
    </View>
  );

  /* ---------------------------------------------------------------- đường mòn */
  const trail = (
    <View>
      {level.parts.map((p, i) => (
        <PartTrail
          key={p.id}
          part={p}
          partNo={i + 1}
          progress={prog.parts[p.id]!}
          statuses={prog.statuses}
          nextId={prog.next?.id ?? null}
          selectedId={wide ? panelNode.id : selectedId}
          inlineDetail={!wide}
          onSelect={select}
          renderDetail={(n, _idx, dark) => detailFor(n, dark)}
        />
      ))}
      <View style={{ marginTop: 28, flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderTopWidth: 1, borderColor: P.line, paddingTop: 14 }}>
        <Icon name="info" size={14} color={P.goldDeep} />
        <Text className="font-sans" style={{ flex: 1, fontSize: 13, lineHeight: 19, color: P.muted }}>
          {L(
            'Không bài nào bị khoá.',
            'Nothing is locked.',
          )}
        </Text>
      </View>
      {hydrated ? (
        <PathPlanner exam={exam} level={level} statuses={prog.statuses} focusExtra={focusExtra} plan={planRhythm} compact={compactPicker} />
      ) : null}
    </View>
  );

  return (
    <Screen cat="write">
      <View style={{ paddingBottom: 40 }}>
        {/* ------------------------------------------------ đầu trang: một lối vào cho cả lộ trình */}
        <Appear>
          {/* Cùng khuôn hero với các trang khác: viền gradient, hoạ tiết pastel, chữ mực tối. */}
          <HeroShell radius={26} style={{ padding: 22, gap: 10 }}>
            <Text className="font-strong" style={{ fontSize: 12, letterSpacing: 2, color: 'rgba(27,17,64,0.75)' }}>
              {L('LỘ TRÌNH HỌC', 'LEARNING PATH')}
            </Text>
            <Text className="font-heavy" style={{ fontSize: 26, lineHeight: 32, color: '#1B1140' }}>
              {L('Học theo trình độ, từng Part một', 'Study level by level, one Part at a time')}
            </Text>
            <Text className="font-sans" style={{ fontSize: 14, lineHeight: 21, color: 'rgba(27,17,64,0.85)' }}>
              {L('Mỗi Part một chủ đề, đủ các kỹ năng. Lịch học của bạn đi theo nhịp đã chọn.', 'One topic per Part, every skill. Your schedule follows the rhythm you picked.')}
            </Text>
            <Pressable accessibilityRole="link" onPress={() => router.push('/plan' as never)} style={({ pressed }: { pressed: boolean }) => ({ alignSelf: 'flex-start', marginTop: 4, opacity: pressed ? 0.92 : 1 })}>
              <LinearGradient colors={CTA_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, height: 52, borderRadius: 999 }}>
                <Icon name="calendar" size={16} color="#FFFFFF" strokeWidth={2.2} />
                <Text className="font-heavy" style={{ fontSize: 15, color: '#FFFFFF' }}>
                  {planInput ? L('Xem và sửa lộ trình của bạn', 'View and edit your plan') : L('Lập lộ trình của bạn', 'Build your plan')}
                </Text>
                <Icon name="arrow-right" size={16} color="#FFFFFF" strokeWidth={2.2} />
              </LinearGradient>
            </Pressable>
          </HeroShell>
        </Appear>

        {wide ? (
          <View style={{ marginTop: 18, flexDirection: 'row', alignItems: 'flex-start', gap: 22 }}>
            <View style={{ flex: 1, minWidth: 0, maxWidth: 760 }}>
              <Appear index={1}>{selector}</Appear>
              {trail}
            </View>
            <View style={{ width: 340, position: Platform.OS === 'web' ? 'sticky' : 'relative', top: 16 } as object}>
              <Appear index={2}>
                <SidePanel
                  level={level}
                  prog={prog}
                  node={panelNode}
                  detail={detailFor(panelNode, false)}
                  onPickPart={(partId) => {
                    const part = level.parts.find((p) => p.id === partId)!;
                    const first = part.nodes.find((n) => prog.statuses[n.id]?.state !== 'done') ?? part.nodes[0]!;
                    setSelectedId(first.id);
                  }}
                  onNextLevel={(id) => setLevel(exam, id)}
                  levels={levels}
                />
              </Appear>
            </View>
          </View>
        ) : (
          <View style={{ marginTop: 18, width: '100%', maxWidth: 720, alignSelf: 'center' }}>
            <Appear index={1}>{selector}</Appear>
            {nextStub}
            {trail}
          </View>
        )}
      </View>
    </Screen>
  );
}

/** Một hàng của phiếu: số mục vàng ở lề trái, tiêu đề, nội dung; ngăn bằng chỉ vàng. */
/** Đã xong hết trình độ: chúc mừng + mời sang trình độ kế. */
function AllDone({ level, levels, onNext, light = false }: { level: PathLevel; levels: readonly PathLevel[]; onNext: (id: string) => void; light?: boolean }) {
  const { L, en } = useL();
  const next = levels[levels.indexOf(level) + 1];
  return (
    <View style={{ gap: 10 }}>
      <Text className="font-strong" style={{ fontSize: 12, letterSpacing: 1.6, color: light ? P.goldDeep : P.goldLight }}>
        {L('HOÀN THÀNH TRÌNH ĐỘ', 'LEVEL COMPLETE')}
      </Text>
      <Text className="font-heavy" style={{ fontSize: 20, lineHeight: 26, color: light ? P.navy : '#FFFFFF' }}>
        {L(`Bạn đã đi hết ${level.label}`, `You have finished ${level.label}`)}
      </Text>
      {next ? (
        <Pressable accessibilityRole="button" onPress={() => onNext(next.id)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 10, paddingVertical: 12, backgroundColor: P.goldLight }}>
          <Text className="font-heavy" style={{ fontSize: 15, color: P.navy }}>
            {L(`Sang ${next.label} · ${next.title.vi}`, `Move on to ${next.label} · ${next.title.en}`)}
          </Text>
          <Icon name="arrow-right" size={16} color={P.navy} strokeWidth={2.4} />
        </Pressable>
      ) : (
        <Text className="font-sans" style={{ fontSize: 14, color: light ? P.muted : 'rgba(255,255,255,0.75)' }}>
          {en ? 'Keep the habit going with full mock tests.' : 'Giữ nhịp bằng các đề thi thử đầy đủ.'}
        </Text>
      )}
    </View>
  );
}

/** Cột bên (máy tính): thẻ học tiếp sáng màu + danh sách Part. */
function SidePanel({
  level,
  levels,
  prog,
  node,
  detail,
  onPickPart,
  onNextLevel,
}: {
  level: PathLevel;
  levels: readonly PathLevel[];
  prog: LevelProgress;
  node: PathNode;
  detail: React.ReactNode;
  onPickPart: (partId: string) => void;
  onNextLevel: (id: string) => void;
}) {
  const { L, en } = useL();
  const isNext = prog.next?.id === node.id;
  const part = partOfNode(level, node.id)!;
  const partNo = level.parts.indexOf(part) + 1;
  return (
    <View style={{ borderRadius: 24, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EEE9FF', overflow: 'hidden', boxShadow: '0 12px 32px rgba(106,75,217,0.10)' } as object}>
      <View style={{ padding: 22, paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ borderRadius: 999, backgroundColor: P.goldWash, paddingHorizontal: 10, paddingVertical: 5 }}><Text className="font-heavy" style={{ fontSize: 11, letterSpacing: 1.5, color: P.goldDeep }}>BAND 9</Text></View>
          <Text className="font-strong" style={{ fontSize: 11, letterSpacing: 1.2, color: P.goldDeep }}>
            {prog.next ? (isNext ? L('HỌC TIẾP', 'UP NEXT') : L('BÀI ĐANG CHỌN', 'SELECTED')) : L('ĐÃ XONG HẾT', 'ALL DONE')}
          </Text>
        </View>
        {!prog.next ? (
          <View style={{ marginTop: 16 }}>
            <AllDone level={level} levels={levels} onNext={onNextLevel} light />
          </View>
        ) : null}
        <Text className="font-strong" style={{ marginTop: 16, fontSize: 11, letterSpacing: 1.4, color: P.goldDeep }}>
          {`PART ${partNo} · ${(en ? part.title.en : part.title.vi).toUpperCase()}`}
        </Text>
        <Text className="font-heavy" style={{ marginTop: 4, fontSize: 21, lineHeight: 27, color: P.navy }}>
          {en ? node.title.en : node.title.vi}
        </Text>
        <View style={{ marginTop: 14 }}>{detail}</View>
      </View>

      <View style={{ marginHorizontal: 20, borderTopWidth: 1, borderColor: P.line }} />

      <View style={{ paddingHorizontal: 16, paddingBottom: 18, paddingTop: 12, gap: 4 }}>
        <Text className="font-strong" style={{ fontSize: 11, letterSpacing: 1.3, color: P.muted, marginBottom: 4 }}>
          {L(`${level.label} · ${level.parts.length} PART`, `${level.label} · ${level.parts.length} PARTS`)}
        </Text>
        {level.parts.map((p, i) => {
          const pp = prog.parts[p.id]!;
          const here = p.id === part.id;
          return (
            <Pressable
              key={p.id}
              accessibilityRole="button"
              aria-current={here ? 'step' : undefined}
              onPress={() => onPickPart(p.id)}
              style={({ hovered }: { hovered?: boolean }) => ({ flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 11, paddingHorizontal: 10, paddingVertical: 9, backgroundColor: here ? P.goldWash : hovered ? '#F5F2FF' : 'transparent' })}
            >
              <View style={{ width: 25, height: 25, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: here ? P.gold : '#F5F2FF' }}><Text className="font-heavy" style={{ fontSize: 10, color: here ? '#FFFFFF' : P.goldDeep }}>
                {String(i + 1).padStart(2, '0')}
              </Text></View>
              <Text className="font-semi" numberOfLines={1} style={{ flex: 1, fontSize: 13, color: P.navy }}>
                {en ? p.title.en : p.title.vi}
              </Text>
              <Text className="font-strong" style={{ fontSize: 12, color: pp.done === pp.total ? '#3F9C6D' : P.muted }}>
                {pp.done}/{pp.total}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
