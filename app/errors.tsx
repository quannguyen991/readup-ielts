import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { HeroStat, LightHero } from '@/components/layout/LightHero';
import { Screen } from '@/components/layout/Screen';
import { Appear } from '@/components/motion/Motion';
import { Button } from '@/components/ui';
import { Icon, type IconName } from '@/components/ui/Icon';
import { SAT_RW_QUESTIONS, SAT_RW_SKILL_LABEL } from '@/data/sat-rw-repository';
import { buildErrorProfile, type ErrorArea, type ErrorItem } from '@/services/errors/profile';
import { useMathStore } from '@/store/useMathStore';
import { useSatRwStore } from '@/store/useSatRwStore';
import { useTopicStudyStore } from '@/store/useTopicStudyStore';
import { color } from '@/theme/tokens';
import { SealIcon } from '@/components/illust/HeroArt';
import { Label, Sticker } from '@/components/illust/Sticker';
import { Badge } from '@/components/illust/Cute';
import { CuteMagnifier, Motion } from '@/components/illust/CuteMore';

/** Màu huy hiệu răng cưa theo mảng (bảng màu chung, không tím). */
const SEAL_TONE: Record<ErrorArea, string> = { math: '#4A7FE8', verbal: '#F472B6', vocab: '#22A06B' };

const AREA: Record<ErrorArea, { label: string; tone: string; bg: string; icon: IconName }> = {
  math: { label: 'SAT Math', tone: '#4F46E5', bg: '#EEF2FF', icon: 'grid' },
  verbal: { label: 'SAT Verbal', tone: '#DB2777', bg: '#FDF2F8', icon: 'letters' },
  vocab: { label: 'Từ vựng', tone: '#0D9488', bg: '#F0FDFA', icon: 'book' },
};

const TREND: Record<ErrorItem['trend'], { text: string; tone: string }> = {
  up: { text: '↑ đang tăng', tone: '#E11D48' },
  down: { text: '↓ đang giảm', tone: '#16A34A' },
  flat: { text: '→ đứng yên', tone: '#64748B' },
  new: { text: '• mới xuất hiện', tone: '#D97706' },
};

const CARD = { boxShadow: '0 1px 2px rgba(15,23,42,0.05), 0 10px 26px rgba(30,41,99,0.08)' } as object;

/**
 * HỒ SƠ LỖI — những lỗi CÓ TÊN bạn hay mắc nhất, gom từ SAT Math, SAT Verbal và
 * từ vựng (`services/errors/profile.ts`), kèm xu hướng 7 ngày và nút sửa ngay.
 */
export default function ErrorsScreen() {
  const sessions = useMathStore((s) => s.sessions);
  const rwAttempts = useSatRwStore((s) => s.attempts);
  const vocabLog = useTopicStudyStore((s) => s.mistakeLog);
  const [now] = useState(() => Date.now());
  const [area, setArea] = useState<ErrorArea | 'all'>('all');

  const profile = useMemo(
    () =>
      buildErrorProfile({
        mathSessions: sessions,
        rwAttempts,
        rwQuestions: SAT_RW_QUESTIONS,
        rwSkillLabel: SAT_RW_SKILL_LABEL,
        vocabLog,
        now,
      }),
    [sessions, rwAttempts, vocabLog, now],
  );
  const shown = area === 'all' ? profile : profile.filter((p) => p.area === area);
  const hot = profile.filter((p) => p.last7 > 0).length;
  const falling = profile.filter((p) => p.trend === 'down').length;

  return (
    <Screen>
      <Appear>
        <LightHero
          scene="math"
          art="review"
          badge="HỒ SƠ LỖI"
          line1="Bạn sai vì đâu,"
          line2="không chỉ sai câu nào"
          subtitle="Đề của ReadUp sinh bằng code nên mỗi câu sai được gọi đúng tên lỗi. Đây là những lỗi bạn hay mắc nhất — lỗi đang nóng trong 7 ngày qua đứng đầu, kèm đường sửa ngay."
          footer={
            <>
              <HeroStat value={String(profile.length)} label="kiểu lỗi đã gặp" />
              <HeroStat value={String(hot)} label="đang mắc (7 ngày)" />
              <HeroStat value={String(falling)} label="đang giảm dần" />
            </>
          }
        />
      </Appear>

      <View className="mt-5 flex-row flex-wrap gap-2">
        {(['all', 'math', 'verbal', 'vocab'] as const).map((k) => {
          const on = area === k;
          return (
            <Pressable
              key={k}
              onPress={() => setArea(k)}
              className="rounded-pill px-4 py-2"
              style={{ backgroundColor: on ? color.primary : 'rgba(255,255,255,0.85)' }}
            >
              <Text className="font-semi text-body" style={{ color: on ? '#FFFFFF' : color.ink }}>
                {k === 'all' ? `Tất cả (${profile.length})` : `${AREA[k].label} (${profile.filter((p) => p.area === k).length})`}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {shown.length === 0 ? (
        <View className="mt-5 rounded-[22px] bg-white p-6" style={CARD}>
          <View aria-hidden className="mb-3 flex-row items-end gap-2">
            <Motion kind="float">
              <Sticker tilt={-8}>
                <CuteMagnifier size={64} />
              </Sticker>
            </Motion>
            <Motion kind="pop" delay={0.2}>
              <Label text="Sạch lỗi ✨" color="#22A06B" ink="#FFFFFF" tilt={-5} size={12} />
            </Motion>
          </View>
          <Text className="font-heavy text-sectionTitle text-ink">Chưa có lỗi nào được gọi tên</Text>
          <Text className="mt-1 font-sans text-bodyLg text-muted">
            Làm vài bộ đề SAT Math, SAT Verbal hoặc học một bộ từ vựng — mỗi câu sai sẽ được gọi tên và hồ sơ tự đầy lên.
          </Text>
          <View className="mt-4 flex-row flex-wrap gap-2">
            <Button label="Luyện SAT Math" onPress={() => router.push('/math' as never)} />
            <Button variant="outline" label="Học từ vựng" onPress={() => router.push('/vocabulary/topics' as never)} />
          </View>
        </View>
      ) : (
        <View className="mt-5 gap-3">
          {shown.map((e, i) => (
            <Appear key={e.id} index={Math.min(i, 8)}>
              <ErrorCard e={e} rank={profile.indexOf(e) + 1} />
            </Appear>
          ))}
        </View>
      )}
      <View className="h-8" />
    </Screen>
  );
}

function ErrorCard({ e, rank }: { e: ErrorItem; rank: number }) {
  const a = AREA[e.area];
  const t = TREND[e.trend];
  return (
    <View className="flex-row overflow-hidden rounded-[20px] bg-white" style={CARD}>
      <View style={{ width: 6, backgroundColor: a.tone }} />
      <View className="min-w-0 flex-1 p-5">
        <View className="flex-row items-start gap-3">
        <View className="min-w-0 flex-1 flex-row flex-wrap items-center gap-2">
          <Text className="font-heavy text-label text-muted">#{rank}</Text>
          <View className="flex-row items-center gap-1.5 rounded-pill px-2.5 py-1" style={{ backgroundColor: a.bg }}>
            <Icon name={a.icon} size={13} color={a.tone} />
            <Text className="font-strong text-label" style={{ color: a.tone }}>
              {a.label}
            </Text>
          </View>
          <Text className="font-semi text-label" style={{ color: t.tone }}>
            {t.text}
          </Text>
          {rank <= 3 && e.last7 > 0 ? (
            <View aria-hidden>
              <Label text="Hot 🔥" color="#F0703F" ink="#FFFFFF" tilt={-4} size={11} />
            </View>
          ) : null}
        </View>
        <View aria-hidden className="items-center gap-1">
          <SealIcon name={a.icon} color={SEAL_TONE[e.area]} size={40} />
          {e.trend === 'down' ? <Badge icon="check" color="#22A06B" size={22} /> : null}
        </View>
        </View>
        <Text className="mt-2 font-heavy text-cardTitle text-ink">{e.title}</Text>
        <Text className="mt-1 font-sans text-body text-muted">{e.detail}</Text>
        <View className="mt-3 flex-row flex-wrap items-center gap-4">
          <Count value={e.last7} label="7 ngày qua" />
          <Count value={e.prev7} label="tuần trước" />
          <Count value={e.total} label="tổng cộng" />
          {e.example ? (
            <Text className="font-sans text-label text-muted">
              Gần nhất: <Text className="font-semi text-ink">{e.example}</Text>
            </Text>
          ) : null}
        </View>
        <View className="mt-4 flex-row">
          <Button size="sm" label={`Sửa ngay · ${e.fix.label}`} iconRight="arrow-right" onPress={() => router.push(e.fix.href as never)} />
        </View>
      </View>
    </View>
  );
}

function Count({ value, label }: { value: number; label: string }) {
  return (
    <View className="flex-row items-baseline gap-1">
      <Text className="font-heavy text-bodyLg text-ink">{value}</Text>
      <Text className="font-sans text-label text-muted">{label}</Text>
    </View>
  );
}
