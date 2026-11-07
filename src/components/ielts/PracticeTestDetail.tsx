import React from 'react';
import { Linking, Pressable, View } from 'react-native';

import { Icon } from '@/components/ui/Icon';
import { ieltsAudioUrl } from '@/services/ielts/audio-url';
import { type ExamPart, SECTION_MINUTES, type TestSection } from '@/services/ielts/source-catalog';
import { FlatCover, numOf, SECTION_TONE, Text } from '@/components/ielts/SourceCover';
import { color } from '@/theme/tokens';

export type DetailTest = {
  id: string;
  title: string;
  source: string;
  section?: TestSection;
  questionCount: number;
  parts?: ExamPart[];
  sourceUrl?: string;
  pdfAsset?: string;
  audioFiles: string[];
  audioCloudUrl?: string;
  answerKeyVerified?: boolean;
};

export type DetailMeta = {
  id: string;
  title: string;
  source: string;
  section?: TestSection;
  questionCount: number;
  hasAnswerKey: boolean;
  answerKeyVerified: boolean;
  hasPdf: boolean;
  audioCount: number;
  audioCloudUrl?: string;
};

export type RelatedTest = { id: string; title: string; source: string; section?: TestSection; questionCount: number };

type Props = {
  test: DetailTest | null;
  meta: DetailMeta | null;
  related: RelatedTest[];
  L: (vi: string, en: string) => string;
  isSaved: boolean;
  answeredCount: number;
  timeLabel: string;
  submitted: boolean;
  bandEstimate: number | null;
  score: number | null;
  total: number | null;
  activeMode: 'simulation' | 'practice' | null;
  showAnswerKey: boolean;
  onBack: () => void;
  onStart: (mode: 'simulation' | 'practice') => void;
  onOpenModes: () => void;
  onToggleAnswerKey: () => void;
  onToggleSave: () => void;
  onOpenTest: (id: string) => void;
};

function Cover({ source, width, height, radius }: { source: string; width: number; height: number; radius: number }) {
  return <FlatCover kind={/cambridge/i.test(source) ? 'CAMBRIDGE' : 'ACTUAL VOL'} num={numOf(source)} width={width} height={height} radius={radius} />;
}

export function PracticeTestDetail(props: Props) {
  const { test, meta, related, L } = props;
  const title = test?.title ?? meta?.title ?? '';
  const source = test?.source ?? meta?.source ?? '';
  const section = test?.section ?? meta?.section;
  const questionCount = test?.questionCount ?? meta?.questionCount ?? 40;
  const parts = test?.parts ?? [];
  const audioFiles = test?.audioFiles ?? [];
  const audioCloudUrl = test?.audioCloudUrl ?? meta?.audioCloudUrl;
  const pdfUrl = test?.sourceUrl;
  const hasPdf = Boolean(pdfUrl || test?.pdfAsset || meta?.hasPdf);
  const hasAnswerKey = Boolean(meta?.hasAnswerKey);
  const verified = Boolean(meta?.answerKeyVerified ?? test?.answerKeyVerified);
  const minutes = section ? SECTION_MINUTES[section] : null;
  const sectionTone = section ? SECTION_TONE[section] : SECTION_TONE.Reading;
  const sameSection = related.filter((item) => item.source === source && item.section === section && item.id !== props.meta?.id).slice(0, 4);

  return (
    <View style={{ gap: 20 }}>
      {/* Breadcrumb */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <Pressable onPress={props.onBack} accessibilityRole="link">
          <Text style={{ fontSize: 13, color: color.primaryDark, fontWeight: '700' }}>{L('Bộ đề', 'Tests')}</Text>
        </Pressable>
        <Text style={{ color: color.subtle }}>›</Text>
        <Text style={{ fontSize: 13, color: color.body, fontWeight: '600' }}>{source}</Text>
        <Text style={{ color: color.subtle }}>›</Text>
        <Text style={{ fontSize: 13, color: color.ink, fontWeight: '800' }}>{title}</Text>
      </View>

      {/* Hero */}
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 24,
          padding: 20,
          borderRadius: 18,
          backgroundColor: color.surface,
          borderWidth: 1,
          borderColor: color.border,
        }}
      >
        <Cover source={source} width={150} height={196} radius={14} />

        <View style={{ flex: 1, minWidth: 260, gap: 12 }}>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            {section ? (
              <View style={{ paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999, backgroundColor: sectionTone.bg }}>
                <Text style={{ fontSize: 12, fontWeight: '800', color: sectionTone.fg }}>{section}</Text>
              </View>
            ) : null}
            <View style={{ paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999, backgroundColor: color.surfaceAlt }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: color.body }}>{source}</Text>
            </View>
          </View>

          <Text style={{ fontSize: 24, fontWeight: '900', color: color.ink }}>{title}</Text>

          <View style={{ flexDirection: 'row', gap: 16, flexWrap: 'wrap' }}>
            <Fact icon="list" text={`${questionCount} ${L('câu hỏi', 'questions')}`} />
            {minutes ? <Fact icon="trending" text={`${minutes} ${L('phút', 'min')}`} /> : null}
            {parts.length ? <Fact icon="book" text={`${parts.length} ${L('phần', 'parts')}`} /> : null}
          </View>

          <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginTop: 4 }}>
            <Pressable
              onPress={() => props.onStart('simulation')}
              style={{ height: 44, paddingHorizontal: 18, borderRadius: 12, backgroundColor: color.ink, flexDirection: 'row', alignItems: 'center', gap: 8 }}
            >
              <Icon name="target" size={16} color="#FFFFFF" />
              <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '800' }}>
                {props.activeMode === 'simulation' ? L('Đang thi thật…', 'Exam in progress…') : L('Thi thử như thi thật', 'Real exam simulation')}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => props.onStart('practice')}
              style={{ height: 44, paddingHorizontal: 18, borderRadius: 12, backgroundColor: color.primaryDark, flexDirection: 'row', alignItems: 'center', gap: 8 }}
            >
              <Icon name="book" size={16} color="#FFFFFF" />
              <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '800' }}>
                {props.activeMode === 'practice' ? L('Đang luyện tập…', 'Practicing…') : L('Luyện tập tự do', 'Practice')}
              </Text>
            </Pressable>

            <GhostButton
              icon="bookmark"
              label={props.isSaved ? L('Đã lưu', 'Saved') : L('Lưu lại', 'Save')}
              onPress={props.onToggleSave}
              tone={props.isSaved ? color.success : undefined}
            />
            <GhostButton icon="settings" label={L('Tùy chọn', 'Options')} onPress={props.onOpenModes} />
          </View>
        </View>

        {/* Progress */}
        <View style={{ width: 200, padding: 16, borderRadius: 14, backgroundColor: color.surfaceAlt, gap: 10, alignSelf: 'stretch' }}>
          <Text style={{ fontSize: 13, fontWeight: '800', color: color.ink }}>{L('Tiến độ của bạn', 'Your progress')}</Text>
          <Text style={{ fontSize: 22, fontWeight: '900', color: props.submitted ? color.success : color.ink }}>
            {props.submitted && props.score !== null && props.total ? `${props.score}/${props.total}` : `${props.answeredCount}/${questionCount}`}
          </Text>
          <Text style={{ fontSize: 12, color: color.body }}>
            {props.submitted ? L('Đã chấm', 'Graded') : props.answeredCount > 0 ? L('Đang làm', 'In progress') : L('Chưa làm', 'Not started')}
          </Text>
          <Text style={{ fontSize: 12, color: color.body }}>
            {L('Còn lại', 'Left')}: <Text style={{ fontWeight: '800', color: color.primaryDark }}>{props.timeLabel}</Text>
          </Text>
          {props.submitted && props.bandEstimate !== null ? (
            <Text style={{ fontSize: 14, fontWeight: '900', color: color.success }}>Band {props.bandEstimate}</Text>
          ) : null}
        </View>
      </View>

      {/* Structure + materials */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
        <Panel title={L('Cấu trúc bài thi', 'Test structure')} icon="list" style={{ flex: 1, minWidth: 300 }}>
          {parts.length ? (
            parts.map((part) => (
              <Row key={part.id}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                  <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: color.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 12, fontWeight: '800', color: color.primaryDark }}>{part.id}</Text>
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: color.ink, flexShrink: 1 }}>{part.label}</Text>
                </View>
                <Text style={{ fontSize: 12, color: color.body }}>
                  {L('Câu', 'Q')} {part.questionStart}–{part.questionEnd}
                  {part.recommendedMinutes ? ` · ${part.recommendedMinutes} ${L('phút', 'min')}` : ''}
                </Text>
              </Row>
            ))
          ) : (
            <Text style={{ fontSize: 13, color: color.body }}>{L('Chưa có', 'Not available')}</Text>
          )}
        </Panel>

        <Panel title={L('Tài liệu đi kèm', 'Materials')} icon="book" style={{ flex: 1, minWidth: 300 }}>
          <Row onPress={pdfUrl ? () => Linking.openURL(pdfUrl) : undefined} disabled={!pdfUrl}>
            <MaterialLabel title={L('Đề thi gốc (PDF)', 'Original paper (PDF)')} note={hasPdf ? '' : L('Chưa có', 'Not available')} />
            {pdfUrl ? <Icon name="arrow-right" size={14} color={color.primaryDark} /> : null}
          </Row>
          <Row>
            <MaterialLabel
              title={L('Đáp án', 'Answer key')}
              note={hasAnswerKey ? (verified ? L('Đã đối chiếu', 'Verified') : '') : L('Chưa có', 'Not available')}
            />
          </Row>
          {section === 'Listening' ? (
            audioFiles.length ? (
              audioFiles.map((file, index) => (
                <Row key={file} onPress={() => Linking.openURL(ieltsAudioUrl(file))}>
                  <MaterialLabel title={`${L('Audio phần', 'Audio part')} ${index + 1}`} note="" />
                  <Icon name="volume" size={14} color={color.primaryDark} />
                </Row>
              ))
            ) : audioCloudUrl ? (
              <Row onPress={() => Linking.openURL(audioCloudUrl)}>
                <MaterialLabel title={L('Audio đề thi', 'Test audio')} note="" />
                <Icon name="arrow-right" size={14} color={color.primaryDark} />
              </Row>
            ) : (
              <Row disabled>
                <MaterialLabel title={L('Audio đề thi', 'Test audio')} note={L('Chưa có', 'Not available')} />
              </Row>
            )
          ) : null}
        </Panel>
      </View>

      {/* Related */}
      {sameSection.length ? (
        <View style={{ gap: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: color.ink }}>{L('Đề cùng bộ', 'More from this set')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {sameSection.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => props.onOpenTest(item.id)}
                style={{
                  flexBasis: 240,
                  flexGrow: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  padding: 12,
                  borderRadius: 14,
                  backgroundColor: color.surface,
                  borderWidth: 1,
                  borderColor: color.border,
                }}
              >
                <Cover source={item.source} width={52} height={68} radius={8} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: color.ink }}>{item.title}</Text>
                  <Text style={{ fontSize: 11, color: color.body }}>{item.questionCount} {L('câu', 'questions')}</Text>
                </View>
                <Icon name="arrow-right" size={14} color={color.primaryDark} />
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

function Fact({ icon, text }: { icon: 'list' | 'trending' | 'book'; text: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Icon name={icon} size={14} color={color.muted} />
      <Text style={{ fontSize: 13, color: color.body, fontWeight: '600' }}>{text}</Text>
    </View>
  );
}

function GhostButton({ icon, label, onPress, tone }: { icon: 'check' | 'bookmark' | 'settings'; label: string; onPress: () => void; tone?: string }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        height: 44,
        paddingHorizontal: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: color.border,
        backgroundColor: color.surface,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
      }}
    >
      <Icon name={icon} size={15} color={tone ?? color.body} />
      <Text style={{ fontSize: 13, fontWeight: '700', color: tone ?? color.body }}>{label}</Text>
    </Pressable>
  );
}

function Panel({ title, icon, children, style }: { title: string; icon: 'list' | 'book'; children: React.ReactNode; style?: object }) {
  return (
    <View style={[{ padding: 18, borderRadius: 16, backgroundColor: color.surface, borderWidth: 1, borderColor: color.border, gap: 10 }, style]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
        <Icon name={icon} size={16} color={color.primaryDark} />
        <Text style={{ fontSize: 15, fontWeight: '800', color: color.ink }}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function Row({ children, onPress, disabled }: { children: React.ReactNode; onPress?: () => void; disabled?: boolean }) {
  const content = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 10,
        backgroundColor: color.surfaceAlt,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {children}
    </View>
  );
  if (!onPress || disabled) return content;
  return <Pressable onPress={onPress}>{content}</Pressable>;
}

function MaterialLabel({ title, note }: { title: string; note: string }) {
  return (
    <View style={{ flex: 1, gap: 2 }}>
      <Text style={{ fontSize: 13, fontWeight: '700', color: color.ink }}>{title}</Text>
      {note ? <Text style={{ fontSize: 12, color: color.body }}>{note}</Text> : null}
    </View>
  );
}
