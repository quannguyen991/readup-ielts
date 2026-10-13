import React, { useMemo, useState } from 'react';
import { Platform, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';

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
  const wide = width >= 1200;
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

  /* ---------------------------------------------------------------- phiếu chọn */
  const selector = (
    <View style={{ borderRadius: 22, backgroundColor: P.paper, borderWidth: 1, borderColor: P.line, paddingHorizontal: compactPicker ? 16 : 24, paddingVertical: 6 }}>
      <SheetRow n="01" title={L('Kỳ thi', 'Exam')} compact={compactPicker} first>
        <View style={{ maxWidth: 320 }}>
          <ExamSwitch
            value={exam}
            onChange={(e) => {
              setExam(e);
            }}
          />
        </View>
      </SheetRow>
      <SheetRow
        n="02"
        title={L('Trình độ', 'Level')}
        hint={planLevel ? L('Gợi ý theo lộ trình của bạn', 'Suggested from your plan') : L('Chọn mức gần với điểm hiện tại', 'Pick the level closest to your current score')}
        compact={compactPicker}
      >
        <LevelPicker levels={levels} value={level.id} planLevelId={planLevel?.id ?? null} onChange={(id) => setLevel(exam, id)} compact={compactPicker} />
        <Text className="font-sans" style={{ marginTop: 10, fontSize: 14, lineHeight: 20, color: P.muted }}>
          {en ? level.blurb.en : level.blurb.vi}
        </Text>
      </SheetRow>
      <SheetRow n="03" title={L('Tiến độ', 'Progress')} compact={compactPicker}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
          <Text className="font-heavy" style={{ fontSize: 32, lineHeight: 36, color: P.navy }}>
            {prog.done}
            <Text className="font-semi" style={{ fontSize: 16, color: P.muted }}>
              {' '}
              / {prog.total} {L('bài', 'lessons')}
            </Text>
          </Text>
          <Text className="font-strong" style={{ marginBottom: 4, fontSize: 13, color: P.goldDeep }}>
            {pct}%
          </Text>
        </View>
        <View style={{ marginTop: 10 }}>
          <ProgressLine done={prog.done} total={prog.total} />
        </View>
        <View style={{ marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 4 }} aria-hidden>
          {level.parts.map((p, i) => {
            const pp = prog.parts[p.id]!;
            const full = pp.done === pp.total;
            return (
              <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingRight: 8 }}>
                <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: full ? P.gold : pp.done > 0 ? P.goldLight : '#E6DCC6' }} />
                <Text className="font-semi" style={{ fontSize: 12, color: P.muted }}>
                  P{i + 1} {pp.done}/{pp.total}
                </Text>
              </View>
            );
          })}
        </View>
      </SheetRow>
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
        {/* ------------------------------------------------ đầu trang */}
        <Appear>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text className="font-strong" style={{ fontSize: 12, letterSpacing: 2.4, color: P.goldDeep }}>
                {L('BAND 9 · LỘ TRÌNH HỌC', 'BAND 9 · LEARNING PATH')}
              </Text>
              <Text className="font-heavy" style={{ marginTop: 2, fontSize: width >= 900 ? 38 : 28, lineHeight: width >= 900 ? 44 : 34, color: P.navy }}>
                {L('Lộ trình học theo trình độ', 'Learning path by level')}
              </Text>
              <Text className="font-sans" style={{ marginTop: 4, fontSize: 15, lineHeight: 22, color: P.muted }}>
                {L(
                  'Mỗi Part một chủ đề, đủ các kỹ năng.',
                  'One topic per Part, every skill.',
                )}
              </Text>
            </View>
            {width >= HEADER_ART_MIN ? (
              <Motion kind="float">
                <Sticker tilt={8}>
                  <CuteRocket size={72} />
                </Sticker>
              </Motion>
            ) : null}
          </View>
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
                  detail={detailFor(panelNode, true)}
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
function SheetRow({ n, title, hint, compact, first, children }: { n: string; title: string; hint?: string; compact: boolean; first?: boolean; children: React.ReactNode }) {
  return (
    <View style={{ flexDirection: compact ? 'column' : 'row', gap: compact ? 4 : 18, paddingVertical: 16, borderTopWidth: first ? 0 : 1, borderColor: P.line }}>
      <Text className="font-heavy" style={{ width: compact ? undefined : 34, fontSize: compact ? 12 : 20, lineHeight: compact ? 16 : 26, letterSpacing: compact ? 1.6 : 0, color: P.gold }}>
        {n}
      </Text>
      <View style={{ flex: compact ? undefined : 1, minWidth: 0 }}>
        <Text className="font-heavy" style={{ fontSize: 17, lineHeight: 24, color: P.navy }}>
          {title}
        </Text>
        {hint ? (
          <Text className="font-sans" style={{ fontSize: 13, color: P.muted }}>
            {hint}
          </Text>
        ) : null}
        <View style={{ marginTop: 10 }}>{children}</View>
      </View>
    </View>
  );
}

/** Đã xong hết trình độ: chúc mừng + mời sang trình độ kế. */
function AllDone({ level, levels, onNext }: { level: PathLevel; levels: readonly PathLevel[]; onNext: (id: string) => void }) {
  const { L, en } = useL();
  const next = levels[levels.indexOf(level) + 1];
  return (
    <View style={{ gap: 10 }}>
      <Text className="font-strong" style={{ fontSize: 12, letterSpacing: 1.6, color: P.goldLight }}>
        {L('HOÀN THÀNH TRÌNH ĐỘ', 'LEVEL COMPLETE')}
      </Text>
      <Text className="font-heavy" style={{ fontSize: 20, lineHeight: 26, color: '#FFFFFF' }}>
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
        <Text className="font-sans" style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)' }}>
          {en ? 'Keep the habit going with full mock tests.' : 'Giữ nhịp bằng các đề thi thử đầy đủ.'}
        </Text>
      )}
    </View>
  );
}

/** Cột bên (máy tính): cuống vé xanh đậm với bài đang chọn + danh sách Part. */
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
    <View style={{ borderRadius: 22, backgroundColor: P.navy, overflow: 'hidden' }}>
      <View pointerEvents="none" style={{ position: 'absolute', top: 8, left: 8, right: 8, bottom: 8, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(226,200,143,0.3)' }} />
      <View style={{ padding: 22, paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text className="font-heavy" style={{ fontSize: 13, letterSpacing: 2.4, color: P.goldLight }}>
            BAND 9
          </Text>
          <Text className="font-strong" style={{ fontSize: 12, letterSpacing: 1.6, color: 'rgba(255,255,255,0.55)' }}>
            {prog.next ? (isNext ? L('HỌC TIẾP', 'UP NEXT') : L('BÀI ĐANG CHỌN', 'SELECTED')) : L('ĐÃ XONG HẾT', 'ALL DONE')}
          </Text>
        </View>
        {!prog.next ? (
          <View style={{ marginTop: 16 }}>
            <AllDone level={level} levels={levels} onNext={onNextLevel} />
          </View>
        ) : null}
        <Text className="font-strong" style={{ marginTop: 16, fontSize: 12, letterSpacing: 1.4, color: 'rgba(255,255,255,0.55)' }}>
          {`PART ${partNo} · ${(en ? part.title.en : part.title.vi).toUpperCase()}`}
        </Text>
        <Text className="font-heavy" style={{ marginTop: 4, fontSize: 21, lineHeight: 27, color: '#FFFFFF' }}>
          {en ? node.title.en : node.title.vi}
        </Text>
        <View style={{ marginTop: 14 }}>{detail}</View>
      </View>

      {/* đường xé */}
      <View style={{ height: 24, justifyContent: 'center' }}>
        <View style={{ marginHorizontal: 20, borderTopWidth: 2, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.18)' }} />
        <View style={{ position: 'absolute', left: -12, width: 24, height: 24, borderRadius: 12, backgroundColor: P.canvas }} />
        <View style={{ position: 'absolute', right: -12, width: 24, height: 24, borderRadius: 12, backgroundColor: P.canvas }} />
      </View>

      <View style={{ paddingHorizontal: 22, paddingBottom: 20, paddingTop: 6, gap: 4 }}>
        <Text className="font-strong" style={{ fontSize: 12, letterSpacing: 1.6, color: 'rgba(255,255,255,0.55)', marginBottom: 4 }}>
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
              style={({ hovered }: { hovered?: boolean }) => ({ flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 7, backgroundColor: here ? 'rgba(226,200,143,0.14)' : hovered ? 'rgba(255,255,255,0.05)' : 'transparent' })}
            >
              <Text className="font-heavy" style={{ width: 22, fontSize: 12, color: P.goldLight }}>
                {String(i + 1).padStart(2, '0')}
              </Text>
              <Text className="font-semi" numberOfLines={1} style={{ flex: 1, fontSize: 13, color: '#FFFFFF' }}>
                {en ? p.title.en : p.title.vi}
              </Text>
              <Text className="font-strong" style={{ fontSize: 12, color: pp.done === pp.total ? P.goldLight : 'rgba(255,255,255,0.6)' }}>
                {pp.done}/{pp.total}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
