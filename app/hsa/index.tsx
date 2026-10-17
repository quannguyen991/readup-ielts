import { themedHex } from '@/theme/palette-state';
import React from 'react';
import { Linking, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Button, Icon, type IconName } from '@/components/ui';
import { HSA_DISCLAIMER, HSA_EXTENDED_KIND_ORDER, HSA_KIND_LABEL, HSA_OFFICIAL_KIND_ORDER, HSA_TOPICS } from '@/data/hsa';
import { HSA_QUESTION_BANK } from '@/data/hsa-bank';
import { bi, useL } from '@/i18n/useL';
import { isKnown, useIntlStore } from '@/store/useIntlStore';

const PALETTES = ['#E2C88F', '#F1DDAA', '#FBF7EE', '#EBDAB3'] as const;

export default function HsaHomeScreen() {
  const { L, locale } = useL();
  const wide = useWindowDimensions().width >= 960;
  const known = useIntlStore((s) => s.known);
  const sessions = useIntlStore((s) => s.sessions).filter((session) => session.exam === 'hsa');
  const knownCount = HSA_TOPICS.flatMap((topic) => topic.vocabulary).filter((item) => isKnown(known, 'hsa', item.word)).length;
  const vocabCount = HSA_TOPICS.reduce((sum, topic) => sum + topic.vocabulary.length, 0);
  const recent = sessions[0];

  return (
    <Screen cat="sit">
      <View style={{ gap: 20 }}>
        <LinearGradient
          colors={['#FBF7EE', '#E9D6AF', '#C7A565']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ minHeight: wide ? 230 : 252, borderRadius: 28, overflow: 'hidden', padding: wide ? 28 : 20, justifyContent: 'center', borderWidth: 1, borderColor: '#E9DFC8' }}
        >
          <View pointerEvents="none" style={{ position: 'absolute', right: -12, top: -20, width: 200, height: 200, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.24)' }} />
          <View pointerEvents="none" style={{ position: 'absolute', right: 132, bottom: -72, width: 180, height: 180, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.19)' }} />
          <View style={{ position: 'absolute', right: wide ? 34 : 2, bottom: -12, opacity: 0.96 }}>
            <Image source={require('../../assets/illustrations/cute-home/mascot-wave.png')} contentFit="contain" style={{ width: wide ? 194 : 150, height: wide ? 194 : 150 }} />
          </View>
          <View style={{ maxWidth: wide ? '68%' : '78%', gap: 10 }}>
            <View style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.62)' }}>
              <Icon name="sparkle" size={15} color="#8F6E36" />
              <Text style={{ color: '#6B552F', fontSize: 12, fontWeight: '900', letterSpacing: 1.1 }}>HSA STUDY DESKTOP · 2026</Text>
            </View>
            <Text className="font-heavy" style={{ color: '#0F1D33', fontSize: wide ? 38 : 31, lineHeight: wide ? 45 : 38 }}>
              HSA · Tiếng Anh
            </Text>
            <Text className="font-sans" style={{ color: '#5C6477', fontSize: 15, lineHeight: 22 }}>
              {L('Một góc học tập nhỏ xinh để luyện đọc, suy luận và chinh phục từng đề.', 'A little study corner for reading, reasoning and working through each paper.')}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 3 }}>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.82)', borderRadius: 999, paddingHorizontal: 11, paddingVertical: 7 }}>
                <Text style={{ color: '#6B552F', fontWeight: '800', fontSize: 13 }}>{L('50 câu · 60 phút', '50 questions · 60 minutes')}</Text>
              </View>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.54)', borderRadius: 999, paddingHorizontal: 11, paddingVertical: 7 }}>
                <Text style={{ color: '#6B552F', fontWeight: '700', fontSize: 13 }}>{L('Văn bản học thuật · suy luận', 'Academic texts · reasoning')}</Text>
              </View>
            </View>
          </View>
          <View pointerEvents="none" style={{ position: 'absolute', right: wide ? 218 : 140, top: 34, transform: [{ rotate: '12deg' }] }}>
            <Text style={{ fontSize: 27 }}>✦</Text>
          </View>
        </LinearGradient>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
          <WindowPanel
            title={L('Góc tiến độ', 'Progress desk')}
            icon="trending"
            wide={wide}
            subtitle={L('Một chút mỗi ngày là tiến bộ rồi đó!', 'A little practice each day adds up!')}
          >
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              <MiniStat value={`${knownCount}/${vocabCount}`} label={L('từ đã thuộc', 'words known')} />
              <MiniStat value={String(sessions.length)} label={L('lượt luyện', 'practice runs')} />
              <MiniStat value={recent ? `${recent.correct}/${recent.total}` : '♡'} label={L('lần gần nhất', 'last result')} />
            </View>
            <View style={{ marginTop: 13, height: 10, backgroundColor: '#F1E8D3', borderRadius: 999, overflow: 'hidden' }}>
              <View style={{ width: `${vocabCount ? Math.min(100, (knownCount / vocabCount) * 100) : 0}%`, height: '100%', borderRadius: 999, backgroundColor: themedHex('#B8955A') }} />
            </View>
          </WindowPanel>

          <WindowPanel
            title={L('Bản đồ đề tham khảo', 'Practice map')}
            icon="compass"
            wide={wide}
            subtitle={L('50 câu · chia thành 3 chặng học', '50 questions · split into 3 study stages')}
          >
            <View style={{ gap: 9 }}>
              <BlueprintRow label={L('Ngôn ngữ', 'Language')} count="30" />
              <BlueprintRow label={L('Đọc hiểu · 3 chùm', 'Reading · 3 sets')} count="15" />
              <BlueprintRow label={L('Suy luận', 'Reasoning')} count="5" />
            </View>
            <Text className="font-sans text-label text-muted" style={{ marginTop: 12 }}>
              {L('Độ khó tham khảo: A2 25% · B1 35% · B2 35% · C1 5%', 'Reference mix: A2 25% · B1 35% · B2 35% · C1 5%')}
            </Text>
          </WindowPanel>
        </View>

        <WindowPanel title={L('Bắt đầu học', 'Choose your next step')} icon="book" subtitle={L('Chọn một chiếc hộp để bắt đầu nha', 'Pick a little window to get started')} wide={false}>
          <LinearGradient colors={[themedHex('#B8955A'), '#8F6E36']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 20, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, overflow: 'hidden' }}>
            <View style={{ flex: 1, gap: 7 }}>
              <Text style={{ color: '#FFFDF8', fontSize: 12, fontWeight: '900', letterSpacing: 1 }}>{L('ĐỀ MÔ PHỎNG HÔM NAY', 'TODAY’S PRACTICE PAPER')}</Text>
              <Text style={{ color: '#FFFFFF', fontSize: 21, fontWeight: '900' }}>{L('Đề số 01 · 50 câu', 'Paper 01 · 50 questions')}</Text>
              <Text style={{ color: '#FFFDF8', fontSize: 13 }}>{L('Bấm giờ như một buổi thi thật', 'A timed, full-length practice run')}</Text>
              <Button className="mt-1" variant="onDarkSolid" label={L('Vào phòng thi', 'Start the paper')} iconRight="arrow-right" onPress={() => router.push('/hsa/exam' as never)} />
            </View>
            <Image source={require('../../assets/illustrations/cute-home/mascot-peace.png')} contentFit="contain" style={{ width: 92, height: 92 }} />
          </LinearGradient>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 }}>
            <ActionTile icon="grid" title={L('20 đề mô phỏng', '20 practice papers')} note={L('Chọn đề muốn luyện', 'Choose a paper')} color={PALETTES[1]} onPress={() => router.push('/hsa/exams' as never)} />
            <ActionTile icon="gauge" title={L('Chẩn đoán nhanh', 'Quick diagnostic')} note={L('20 câu · xem điểm xuất phát', '20 items · find your starting point')} color={PALETTES[2]} onPress={() => router.push('/hsa/diagnostic' as never)} />
            <ActionTile icon="sparkle" title={L('Thử thách nâng cao', 'Advanced challenge')} note={L('10 câu suy luận khó', '10 challenging reasoning items')} color={PALETTES[3]} onPress={() => router.push('/hsa/advanced' as never)} />
          </View>
        </WindowPanel>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
          <WindowPanel title={L('Bộ công cụ luyện đề', 'Question-type toolbox')} icon="list" subtitle={L(`${HSA_QUESTION_BANK.length} câu hỏi trong ngân hàng luyện tập`, `${HSA_QUESTION_BANK.length} items in the practice bank`)} wide={wide}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9 }}>
              {HSA_OFFICIAL_KIND_ORDER.map((kind, index) => {
                const count = HSA_QUESTION_BANK.filter((question) => question.kind === kind).length;
                return (
                  <ActionTile
                    key={kind}
                    compact
                    icon={index % 2 === 0 ? 'letters' : 'pencil'}
                    title={bi(HSA_KIND_LABEL[kind], locale)}
                    note={`${count} ${L('câu', 'items')}`}
                    color={PALETTES[index % PALETTES.length]!}
                    onPress={() => router.push(`/hsa/practice/${kind}` as never)}
                  />
                );
              })}
            </View>
          </WindowPanel>

          <WindowPanel title={L('Hộp bài tập mở rộng', 'Extra practice formats')} icon="sparkle" subtitle={L('Các dạng bổ trợ ngoài ma trận 50 câu', 'Extra drills beyond the 50-question blueprint')} wide={wide}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9 }}>
              {HSA_EXTENDED_KIND_ORDER.map((kind, index) => {
                const count = HSA_QUESTION_BANK.filter((question) => question.kind === kind).length;
                return (
                  <ActionTile
                    key={kind}
                    compact
                    icon={index % 2 === 0 ? 'target' : 'book'}
                    title={bi(HSA_KIND_LABEL[kind], locale)}
                    note={`${count} ${L('câu', 'items')}`}
                    color={PALETTES[(index + 1) % PALETTES.length]!}
                    onPress={() => router.push(`/hsa/practice/${kind}` as never)}
                  />
                );
              })}
            </View>
          </WindowPanel>
        </View>

        <WindowPanel title={L('Góc ôn tập', 'Review nook')} icon="heart" subtitle={L('Nhặt lại kiến thức theo từng chủ điểm', 'Revisit vocabulary and skills by topic')} wide={false}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            <ActionTile icon="book" title={L('10 chủ điểm ôn tập', '10 review topics')} note={L('Từ vựng · trọng tâm · câu hỏi', 'Vocabulary · focus points · questions')} color={PALETTES[1]} onPress={() => router.push('/hsa/topics' as never)} />
            <ActionTile icon="letters" title={L('Sổ từ vựng HSA', 'HSA vocabulary notebook')} note={L(`${vocabCount} từ học thuật`, `${vocabCount} academic words`)} color={PALETTES[2]} onPress={() => router.push('/hsa/vocab' as never)} />
          </View>
        </WindowPanel>

        <WindowPanel title={L('Tài liệu trên bàn học', 'On the study desk')} icon="external" subtitle={L('Nguồn tham khảo để xem cấu trúc và đề mẫu', 'Official format notes and sample papers')} wide={false}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            <ActionTile icon="clipboard" title={L('Đề cương HSA 2026 · ĐHQGHN', 'HSA 2026 test specification · VNU')} note={L('Mở tài liệu chính thức', 'Open official specification')} color={PALETTES[3]} onPress={() => Linking.openURL('https://idt.vnu.edu.vn/api/media/file/%C4%90%E1%BB%81%20c%C6%B0%C6%A1ng%20d%E1%BA%A1ng%20th%E1%BB%A9c%20c%E1%BB%A7a%20b%C3%A0i%20thi%20HSA%202026.pdf')} />
            <ActionTile icon="note" title={L('Đề tham khảo HSA 2025', 'HSA 2025 sample paper')} note={L('Mở đề tham khảo', 'Open sample paper')} color={PALETTES[0]} onPress={() => Linking.openURL('https://resource.hsa.edu.vn/files/upload/2024-08-09%20De%20thi%20tham%20khao%20HSA%20nam%202025.pdf')} />
          </View>
          <Text className="font-sans text-label text-muted" style={{ lineHeight: 20, marginTop: 14 }}>{bi(HSA_DISCLAIMER, locale)}</Text>
        </WindowPanel>
      </View>
    </Screen>
  );
}

function WindowPanel({ title, subtitle, icon, wide, children }: { title: string; subtitle: string; icon: IconName; wide: boolean; children: React.ReactNode }) {
  return (
    <View style={{ flexGrow: 1, flexShrink: 1, flexBasis: wide ? 410 : '100%', minWidth: 0, borderRadius: 19, borderWidth: 1, borderColor: '#E8DCC0', backgroundColor: 'rgba(255,255,255,0.94)', overflow: 'hidden', shadowColor: '#8F6E36', shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 7 } }}>
      <View style={{ minHeight: 43, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FBF3E2', borderBottomWidth: 1, borderBottomColor: '#E8DCC0' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ flexDirection: 'row', gap: 4 }}>
            {[themedHex('#B8955A'), '#D5B377', '#E2C88F'].map((dot) => <View key={dot} style={{ width: 7, height: 7, borderRadius: 999, backgroundColor: dot }} />)}
          </View>
          <Icon name={icon} size={15} color="#8F6E36" />
          <Text numberOfLines={1} style={{ color: '#0F1D33', fontWeight: '800', fontSize: 13 }}>{title}</Text>
        </View>
        <Text style={{ color: '#A8843F', fontSize: 12, fontWeight: '800' }}>✦</Text>
      </View>
      <View style={{ padding: 16 }}>
        <Text className="font-sans text-label text-muted" style={{ marginBottom: 12 }}>{subtitle}</Text>
        {children}
      </View>
    </View>
  );
}

function MiniStat({ value, label }: { value: string; label: string }) {
  return (
    <View style={{ flexGrow: 1, flexBasis: 100, minWidth: 90, backgroundColor: '#FBF7EE', borderRadius: 14, padding: 11, borderWidth: 1, borderColor: '#E8DCC0' }}>
      <Text style={{ fontSize: 21, fontWeight: '900', color: '#8F6E36' }}>{value}</Text>
      <Text style={{ fontSize: 12, fontWeight: '700', color: '#6B6250', marginTop: 2 }}>{label}</Text>
    </View>
  );
}

function BlueprintRow({ label, count }: { label: string; count: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FBF7EE', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 }}>
      <Text style={{ color: '#0F1D33', fontWeight: '700', fontSize: 14 }}>{label}</Text>
      <Text style={{ color: '#8F6E36', fontWeight: '900', fontSize: 14 }}>{count}</Text>
    </View>
  );
}

function ActionTile({ icon, title, note, color: tint, onPress, compact = false }: { icon: IconName; title: string; note: string; color: string; onPress: () => void; compact?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="rounded-panel"
      style={({ pressed }) => ({ flexGrow: 1, flexShrink: 1, flexBasis: compact ? 188 : 245, minWidth: compact ? 160 : 210, minHeight: compact ? 76 : 92, flexDirection: 'row', alignItems: 'center', gap: 11, padding: 12, backgroundColor: pressed ? '#FBF3E2' : '#FFFDF8', borderWidth: 1, borderColor: '#E8DCC0', opacity: pressed ? 0.88 : 1 })}
    >
      <View style={{ width: compact ? 38 : 46, height: compact ? 38 : 46, borderRadius: compact ? 13 : 16, alignItems: 'center', justifyContent: 'center', backgroundColor: tint }}>
        <Icon name={icon} size={compact ? 18 : 21} color="#8F6E36" />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={2} style={{ color: '#0F1D33', fontSize: compact ? 13 : 15, lineHeight: compact ? 18 : 20, fontWeight: '800' }}>{title}</Text>
        <Text numberOfLines={2} style={{ color: '#6B6250', fontSize: 12, marginTop: 3 }}>{note}</Text>
      </View>
      {!compact ? <Icon name="chevron-right" size={15} color="#A8843F" /> : null}
    </Pressable>
  );
}
