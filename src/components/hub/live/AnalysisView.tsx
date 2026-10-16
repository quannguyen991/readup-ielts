import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Confetti } from '@/components/motion/Confetti';
import { LionMascot } from '@/components/mascot/LionMascot';
import { GLASS_CARD, HUB } from '@/components/hub/theme';
import { Icon } from '@/components/ui/Icon';
import type { SessionAnalysis, LiveTurn } from '@/services/hub/live-session';
import type { Dimension } from '@/services/hub/voice-report';
import { themedHex } from '@/theme/palette-state';

const DIM_LABEL: Record<Dimension, string> = {
  pronunciation: 'Phát âm (độ rõ)',
  intonation: 'Ngữ điệu',
  fluency: 'Độ lưu loát',
  grammar: 'Ngữ pháp',
  vocabulary: 'Từ vựng',
  coherence: 'Mạch lạc',
};

export type AiNotes = { grammar: string[]; coherence: string[]; vocabulary: string[] };

/**
 * Bản phân tích sau buổi luyện. Trên cùng là điểm tổng và band ước lượng, rồi tới từng tiêu chí.
 * Tiêu chí nào chưa đo được thì hiện thanh trống kèm lời giải thích, không hiện con số 0 giả.
 */
export function AnalysisView({
  analysis,
  turns,
  seed,
  aiNotes,
  aiBusy,
  aiError,
  onAiFeedback,
  onRetry,
  onExit,
}: {
  analysis: SessionAnalysis;
  turns: LiveTurn[];
  seed: string;
  aiNotes: AiNotes | null;
  aiBusy: boolean;
  aiError: string | null;
  onAiFeedback: () => void;
  onRetry: () => void;
  onExit: () => void;
}) {
  const overall = analysis.overall;
  const celebrate = overall !== null && overall >= 70;
  const userTurns = turns.filter((t) => t.role === 'user' && !t.silent && t.report);

  return (
    <View style={{ gap: 14 }}>
      <LinearGradient
        colors={[themedHex('#FFFBEF'), themedHex('#F6E3AE')]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 24, padding: 20, alignItems: 'center', gap: 12 }}
      >
        <LionMascot pose={celebrate ? 'cheer' : 'think'} size={112} />
        <Text style={{ color: HUB.ink, fontSize: 20, fontWeight: '800' }}>Kết quả buổi luyện</Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
          <View
            accessibilityLabel={overall === null ? 'Chưa có điểm tổng' : `Điểm tổng ${overall}`}
            style={{
              width: 104,
              height: 104,
              borderRadius: 52,
              borderWidth: 9,
              borderColor: overall === null ? 'rgba(143,110,54,0.2)' : scoreColor(overall),
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255,255,255,0.7)',
            }}
          >
            <Text style={{ color: HUB.ink, fontSize: 30, fontWeight: '800' }}>{overall ?? '—'}</Text>
            <Text style={{ color: HUB.muted, fontSize: 10, fontWeight: '700' }}>/100</Text>
          </View>
          <View style={{ gap: 6 }}>
            <Text style={{ color: HUB.muted, fontSize: 11, fontWeight: '700' }}>BAND ƯỚC LƯỢNG</Text>
            <Text style={{ color: HUB.ink, fontSize: 28, fontWeight: '800' }}>
              {analysis.band === null ? '—' : analysis.band.toFixed(1)}
            </Text>
            <Text style={{ color: HUB.body, fontSize: 11, lineHeight: 16, maxWidth: 150 }}>
              Ước lượng từ số liệu đo được, không phải chấm chính thức.
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
          <Chip label={`${analysis.answers} câu đã nói`} />
          <Chip label={`${analysis.words} từ`} />
          <Chip label={analysis.avgWpm === null ? 'Tốc độ —' : `${analysis.avgWpm} từ/phút`} />
          <Chip label={`${analysis.fillers} từ đệm`} />
        </View>
      </LinearGradient>

      <View style={[GLASS_CARD, { padding: 16, gap: 14 }]}>
        <Text style={{ color: HUB.ink, fontSize: 16, fontWeight: '800' }}>Các tiêu chí</Text>
        {analysis.dimensions.map((d) => (
          <View key={d.key} style={{ gap: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ color: HUB.ink, fontSize: 14, fontWeight: '700' }}>{DIM_LABEL[d.key]}</Text>
              <Text style={{ color: d.score === null ? HUB.muted : scoreColor(d.score), fontSize: 14, fontWeight: '800' }}>
                {d.score === null ? 'Chưa đo' : d.score}
              </Text>
            </View>
            <View style={{ height: 10, borderRadius: 5, backgroundColor: 'rgba(143,110,54,0.14)', overflow: 'hidden' }}>
              {d.score === null ? null : (
                <View
                  style={{
                    width: `${Math.max(3, Math.min(100, d.score))}%`,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: scoreColor(d.score),
                  }}
                />
              )}
            </View>
            <Text style={{ color: HUB.body, fontSize: 12, lineHeight: 18 }}>{d.note}</Text>
          </View>
        ))}
      </View>

      {analysis.strengths.length > 0 ? (
        <ListCard title="Điểm mạnh" tone={HUB.green} icon="check" items={analysis.strengths} />
      ) : null}
      {analysis.weaknesses.length > 0 ? (
        <ListCard title="Cần cải thiện" tone={HUB.amber} icon="info" items={analysis.weaknesses} />
      ) : null}
      {analysis.nextSteps.length > 0 ? (
        <View style={[GLASS_CARD, { padding: 16, gap: 10 }]}>
          <Text style={{ color: HUB.ink, fontSize: 16, fontWeight: '800' }}>Bước tiếp theo</Text>
          {analysis.nextSteps.map((s, i) => (
            <View key={s} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
              <View style={{ width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: HUB.blue }}>
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>{i + 1}</Text>
              </View>
              <Text style={{ color: HUB.ink, fontSize: 14, lineHeight: 21, flex: 1 }}>{s}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={[GLASS_CARD, { padding: 16, gap: 12 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Icon name="sparkle" size={18} color={HUB.blue} />
          <Text style={{ color: HUB.ink, fontSize: 16, fontWeight: '800' }}>Nhận xét chi tiết từ AI</Text>
        </View>
        <Text style={{ color: HUB.body, fontSize: 13, lineHeight: 19 }}>
          Ngữ pháp và mạch lạc máy chưa chấm được. AI đọc lại bản ghi của bạn để gợi ý hai mục này. Mỗi lần gọi tốn một lượt AI.
        </Text>
        {aiNotes ? (
          <View style={{ gap: 10 }}>
            <NoteGroup title="Ngữ pháp" items={aiNotes.grammar} />
            <NoteGroup title="Mạch lạc" items={aiNotes.coherence} />
            <NoteGroup title="Từ vựng" items={aiNotes.vocabulary} />
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            disabled={aiBusy || userTurns.length === 0}
            onPress={onAiFeedback}
            style={{
              height: 48,
              borderRadius: 14,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 8,
              backgroundColor: HUB.blue,
              opacity: aiBusy || userTurns.length === 0 ? 0.5 : 1,
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>{aiBusy ? 'Leo đang đọc bản ghi…' : 'Lấy nhận xét AI'}</Text>
          </Pressable>
        )}
        {aiError ? <Text style={{ color: HUB.red, fontSize: 13 }}>{aiError}</Text> : null}
      </View>

      <Text style={{ color: HUB.ink, fontSize: 16, fontWeight: '800' }}>Từng câu trả lời</Text>
      {userTurns.map((t, i) => {
        const r = t.report!;
        const ratio = r.wordCount > 0 ? r.fillers.total / r.wordCount : 0;
        return (
          <View key={t.id} style={[GLASS_CARD, { padding: 14, gap: 8 }]}>
            <Text style={{ color: HUB.muted, fontSize: 11, fontWeight: '700' }}>CÂU TRẢ LỜI {i + 1}</Text>
            <Text style={{ color: HUB.ink, fontSize: 15, lineHeight: 23, fontStyle: 'italic' }}>“{t.text}”</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              <Chip label={r.wpm === null ? 'tốc độ —' : `${r.wpm} từ/phút`} />
              <Chip label={`${r.wordCount} từ`} />
              <Chip label={`${r.fillers.total} từ đệm (${Math.round(ratio * 100)}%)`} tone={ratio > 0.08 ? HUB.amber : undefined} />
              <Chip label={`ngập ngừng ${r.pauses.count} lần`} />
            </View>
          </View>
        );
      })}

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Pressable
          accessibilityRole="button"
          onPress={onRetry}
          style={{ flex: 1, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: HUB.glassStrong }}
        >
          <Text style={{ color: HUB.ink, fontWeight: '800' }}>Luyện lại</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={onExit}
          style={{ flex: 1, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: HUB.blue }}
        >
          <Text style={{ color: '#fff', fontWeight: '800' }}>Về đề luyện nói</Text>
        </Pressable>
      </View>

      {celebrate ? <Confetti seed={seed} pieces={80} silent /> : null}
    </View>
  );
}

function scoreColor(score: number): string {
  if (score >= 75) return HUB.green;
  if (score >= 55) return HUB.amber;
  return HUB.red;
}

function Chip({ label, tone }: { label: string; tone?: string }) {
  return (
    <View style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: HUB.glassStrong }}>
      <Text style={{ color: tone ?? HUB.body, fontSize: 12, fontWeight: '700' }}>{label}</Text>
    </View>
  );
}

function ListCard({ title, tone, icon, items }: { title: string; tone: string; icon: 'check' | 'info'; items: string[] }) {
  return (
    <View style={[GLASS_CARD, { padding: 16, gap: 10 }]}>
      <Text style={{ color: HUB.ink, fontSize: 16, fontWeight: '800' }}>{title}</Text>
      {items.map((s) => (
        <View key={s} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
          <Icon name={icon} size={16} color={tone} strokeWidth={2.4} />
          <Text style={{ color: HUB.ink, fontSize: 14, lineHeight: 21, flex: 1 }}>{s}</Text>
        </View>
      ))}
    </View>
  );
}

function NoteGroup({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <View style={{ gap: 4 }}>
      <Text style={{ color: HUB.blue, fontSize: 13, fontWeight: '800' }}>{title}</Text>
      {items.map((s) => (
        <Text key={s} style={{ color: HUB.ink, fontSize: 14, lineHeight: 21 }}>
          • {s}
        </Text>
      ))}
    </View>
  );
}
