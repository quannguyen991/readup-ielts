import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { CARD_SHADOW } from './StudyKit';
import { Icon, type IconName } from '@/components/ui/Icon';
import { canRecognize } from '@/services/shadow/speech';
import type { Direction, LearnSettings, StageKind } from '@/services/vocab/topic-study';
import { color } from '@/theme/tokens';
import { useL } from '@/i18n/useL';

/**
 * Bảng Cài đặt của màn Học.
 *
 * Sửa trên một BẢN NHÁP; chỉ khi bấm "Áp dụng" mới ghi vào store và bắt đầu
 * lại vòng. Đổi cài đặt giữa chừng mà vòng đang chạy tự đổi theo thì lịch gặp
 * lại đang có câu của dạng vừa bị tắt — dễ ra câu hỏi hỏng.
 *
 * GỌN: mỗi dòng một nhãn, không kèm dòng chú thích nhỏ bên dưới — người dùng
 * thấy bảng cũ nhiều chữ nhỏ thừa (24/09/2026).
 */
export function LearnSettingsSheet({
  visible,
  initial,
  starredCount,
  unmasteredCount,
  matchCount,
  onApply,
  onReset,
  onClose,
}: {
  visible: boolean;
  initial: LearnSettings;
  starredCount: number;
  unmasteredCount: number;
  /** Số từ còn lại sau bộ lọc, tính theo bản nháp. */
  matchCount: (draft: LearnSettings) => number;
  onApply: (s: LearnSettings) => void;
  onReset: () => void;
  onClose: () => void;
}) {
  const { L, en } = useL();
  const [draft, setDraft] = useState(initial);
  const [confirmReset, setConfirmReset] = useState(false);
  const [openedWith, setOpenedWith] = useState<LearnSettings | null>(null);
  const micOk = canRecognize();

  // Mỗi lần mở lại bảng, bản nháp lấy từ cài đặt đang dùng (điều chỉnh state
  // trong lúc render theo prop — cách React khuyên, không cần effect).
  if (visible && openedWith !== initial) {
    setOpenedWith(initial);
    setDraft(initial);
    setConfirmReset(false);
  }

  const toggleIn = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const flip = (key: 'interleave' | 'ordered' | 'autoAdvance' | 'acceptSynonyms' | 'speakAnswer' | 'starredOnly' | 'unmasteredOnly') =>
    setDraft({ ...draft, [key]: !draft[key] });
  const noDir = draft.directions.length === 0;
  const noKind = draft.kinds.length === 0;
  const matches = matchCount(draft);
  const blocked = noDir || noKind || matches === 0;

  const DIRS: { key: Direction; label: React.ReactNode }[] = [
    { key: 'enToVi', label: en ? <>See the <B>English word</B>, pick the Vietnamese meaning</> : <>Thấy <B>từ tiếng Anh</B>, chọn nghĩa tiếng Việt</> },
    { key: 'viToEn', label: en ? <>See the <B>Vietnamese meaning</B>, find the English word</> : <>Thấy <B>nghĩa tiếng Việt</B>, tìm từ tiếng Anh</> },
    { key: 'listen', label: en ? <>Just <B>listen to the audio</B>, recognise the word</> : <>Chỉ <B>nghe giọng đọc</B>, nhận ra từ</> },
  ];
  const KINDS: { key: StageKind; label: string; icon: IconName }[] = [
    { key: 'flash', label: L('Lật thẻ', 'Flashcards'), icon: 'note' },
    { key: 'mcq', label: L('Trắc nghiệm 4 đáp án', 'Multiple choice (4 options)'), icon: 'list' },
    { key: 'fill', label: L('Điền chỗ trống (kiểu đề THPT)', 'Fill in the blank (Vietnamese high-school exam style)'), icon: 'clipboard' },
    { key: 'type', label: L('Gõ từ', 'Type the word'), icon: 'pencil' },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} className="flex-1 items-center justify-center px-4 py-6" style={{ backgroundColor: 'rgba(15,23,42,0.45)' }}>
        {/* Chặn bấm xuyên qua thẻ xuống lớp nền (lớp nền bấm là đóng). */}
        <Pressable onPress={() => {}} className="w-full rounded-[26px] bg-white" style={[{ maxWidth: 560, maxHeight: '92%', cursor: 'auto' } as object, CARD_SHADOW]}>
          <View className="flex-row items-center justify-between px-5 pb-2 pt-5 sm:px-6">
            <Text className="font-heavy text-sectionTitle text-ink">{L('Cài đặt học', 'Study settings')}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel={L('Đóng', 'Close')} onPress={onClose} className="h-10 w-10 items-center justify-center rounded-pill" style={{ backgroundColor: '#F9F6F1' }}>
              <Icon name="close" size={18} color={color.ink} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 8 }}>
            <Section title={L('Dạng câu', 'Question types')} warn={noKind ? L('Phải bật ít nhất một dạng.', 'Turn on at least one type.') : undefined}>
              {KINDS.map((k) => {
                const on = draft.kinds.includes(k.key);
                return (
                  <Row key={k.key} on={on} onPress={() => setDraft({ ...draft, kinds: toggleIn(draft.kinds, k.key) })}>
                    <Icon name={k.icon} size={18} color={on ? color.primary : '#64748B'} />
                    <Text className="flex-1 font-semi text-bodyLg text-ink">{k.label}</Text>
                  </Row>
                );
              })}
            </Section>

            <Section title={L('Cách học', 'Study mode')}>
              <Row on={draft.interleave} onPress={() => flip('interleave')}>
                <Icon name="refresh" size={18} color={draft.interleave ? color.primary : '#64748B'} />
                <Text className="flex-1 font-sans text-bodyLg text-ink">
                  <B>{L('Học xen kẽ', 'Interleaved')}</B> <Text className="text-muted">{L('· trộn dạng câu, gặp lại cả từ đã đúng', '· mixes question types and revisits words you got right')}</Text>
                </Text>
              </Row>
              <Row on={draft.ordered} onPress={() => flip('ordered')}>
                <Text className="flex-1 font-sans text-bodyLg text-ink">{L('Học theo thứ tự trong bộ (không xáo trộn)', 'Study in deck order (no shuffle)')}</Text>
              </Row>
              <Row on={draft.autoAdvance} onPress={() => flip('autoAdvance')}>
                <Text className="flex-1 font-sans text-bodyLg text-ink">{L('Tự sang câu tiếp khi trả lời đúng', 'Auto-advance after a correct answer')}</Text>
              </Row>
            </Section>

            <Section title={L('Chiều hỏi', 'Question direction')} warn={noDir ? L('Phải chọn ít nhất một chiều hỏi.', 'Pick at least one direction.') : undefined}>
              {DIRS.map((d) => (
                <Row key={d.key} on={draft.directions.includes(d.key)} onPress={() => setDraft({ ...draft, directions: toggleIn(draft.directions, d.key) })}>
                  <Text className="flex-1 font-sans text-bodyLg text-ink">{d.label}</Text>
                </Row>
              ))}
            </Section>

            <Section title={L('Trả lời', 'Answering')}>
              <Row on={draft.acceptSynonyms} onPress={() => flip('acceptSynonyms')}>
                <Text className="flex-1 font-sans text-bodyLg text-ink">{L('Chấp nhận từ đồng nghĩa khi gõ', 'Accept synonyms when typing')}</Text>
              </Row>
              <Row on={draft.speakAnswer && micOk} disabled={!micOk} onPress={() => flip('speakAnswer')}>
                <Icon name="mic" size={18} color={draft.speakAnswer && micOk ? color.primary : '#64748B'} />
                <Text className="flex-1 font-sans text-bodyLg text-ink">
                  {L('Trả lời bằng giọng nói', 'Answer by voice')}{micOk ? '' : <Text className="text-muted">{L(' (trình duyệt này chưa hỗ trợ)', " (not supported in this browser)")}</Text>}
                </Text>
              </Row>
            </Section>

            <Section title={L('Nhóm từ', 'Word filter')} warn={matches === 0 && !noDir && !noKind ? L('Không còn từ nào khớp bộ lọc này.', 'No words match this filter.') : undefined}>
              <Row on={draft.starredOnly} onPress={() => flip('starredOnly')}>
                <Icon name="star-fill" size={18} color="#F59E0B" />
                <Text className="flex-1 font-sans text-bodyLg text-ink">
                  {L('Chỉ từ đánh dấu sao', 'Starred words only')} <Text className="text-muted">({starredCount})</Text>
                </Text>
              </Row>
              <Row on={draft.unmasteredOnly} onPress={() => flip('unmasteredOnly')}>
                <Icon name="target" size={18} color={color.primary} />
                <Text className="flex-1 font-sans text-bodyLg text-ink">
                  {L('Chỉ từ chưa thuộc', 'Words not yet mastered')} <Text className="text-muted">({unmasteredCount})</Text>
                </Text>
              </Row>
            </Section>
          </ScrollView>

          <View className="flex-row items-center justify-between gap-3 border-t px-5 py-4 sm:px-6" style={{ borderColor: '#F7F4EE' }}>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                if (!confirmReset) return setConfirmReset(true);
                onReset();
                setConfirmReset(false);
              }}
              className="flex-row items-center gap-2 rounded-2xl px-4 py-3"
              style={{ flexShrink: 1, backgroundColor: confirmReset ? '#FFF1F2' : '#F9F6F1' }}
            >
              <Icon name="refresh" size={16} color={confirmReset ? '#E11D48' : '#475569'} />
              <Text className="flex-shrink font-semi text-body" style={{ color: confirmReset ? '#E11D48' : '#475569' }}>
                {confirmReset ? L('Bấm lần nữa để xoá', 'Tap again to reset') : L('Xoá tiến độ', 'Reset progress')}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={blocked}
              onPress={() => onApply(draft)}
              className="rounded-2xl px-6 py-3"
              style={{ flexShrink: 0, backgroundColor: blocked ? '#F4E7D1' : color.primary }}
            >
              <Text className="font-strong text-bodyLg text-white">{L('Áp dụng', 'Apply')}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function B({ children }: { children: React.ReactNode }) {
  return <Text className="font-strong">{children}</Text>;
}

function Section({ title, warn, children }: { title: string; warn?: string; children: React.ReactNode }) {
  return (
    <View className="mt-4">
      <Text className="mb-2 font-strong text-label uppercase tracking-[1.2px] text-muted">{title}</Text>
      <View className="gap-2">{children}</View>
      {warn ? (
        <Text className="mt-2 font-semi text-label" style={{ color: '#E11D48' }}>
          {warn}
        </Text>
      ) : null}
    </View>
  );
}

/** Một dòng bật/tắt: ô vuông đánh dấu bên trái, nội dung bên phải. */
function Row({ on, onPress, disabled, children }: { on: boolean; onPress: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      aria-checked={on}
      aria-disabled={disabled}
      disabled={disabled}
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-2xl px-4 py-3"
      style={{ borderWidth: 1.5, borderColor: on ? '#E6D2A6' : '#F0EBE2', backgroundColor: on ? '#FDFAF5' : '#FFFFFF', opacity: disabled ? 0.55 : 1 }}
    >
      <View
        className="h-6 w-6 items-center justify-center rounded-lg"
        style={{ backgroundColor: on ? color.primary : '#FFFFFF', borderWidth: on ? 0 : 1.5, borderColor: '#E1D9CB' }}
      >
        {on ? <Icon name="check" size={15} color="#FFFFFF" strokeWidth={2.6} /> : null}
      </View>
      {children}
    </Pressable>
  );
}
