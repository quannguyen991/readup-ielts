import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { CARD_SHADOW } from './StudyKit';
import { Icon, type IconName } from '@/components/ui/Icon';
import type { Direction, LearnSettings, StageKind } from '@/services/vocab/topic-study';
import { color } from '@/theme/tokens';

/**
 * Bảng Cài đặt của màn Học.
 *
 * Sửa trên một BẢN NHÁP; chỉ khi bấm "Áp dụng" mới ghi vào store và bắt đầu
 * lại vòng. Đổi cài đặt giữa chừng mà vòng đang chạy tự đổi theo thì hàng đợi
 * đang có câu của phần vừa bị tắt — dễ ra câu hỏi hỏng.
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
  const [draft, setDraft] = useState(initial);
  const [confirmReset, setConfirmReset] = useState(false);
  const [openedWith, setOpenedWith] = useState<LearnSettings | null>(null);

  // Mỗi lần mở lại bảng, bản nháp lấy từ cài đặt đang dùng (điều chỉnh state
  // trong lúc render theo prop — cách React khuyên, không cần effect).
  if (visible && openedWith !== initial) {
    setOpenedWith(initial);
    setDraft(initial);
    setConfirmReset(false);
  }

  const toggleIn = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const noDir = draft.directions.length === 0;
  const noKind = draft.kinds.length === 0;
  const matches = matchCount(draft);
  const blocked = noDir || noKind || matches === 0;

  const DIRS: { key: Direction; label: React.ReactNode }[] = [
    { key: 'enToVi', label: <>Thấy <B>từ tiếng Anh</B>, chọn nghĩa tiếng Việt</> },
    { key: 'viToEn', label: <>Thấy <B>nghĩa tiếng Việt</B>, tìm từ tiếng Anh</> },
    { key: 'listen', label: <>Chỉ <B>nghe giọng đọc</B>, nhận ra từ</> },
  ];
  const KINDS: { key: StageKind; label: string; note: string; icon: IconName }[] = [
    { key: 'flash', label: 'Lật thẻ', note: 'Gặp từ, lật xem mặt sau, tự đánh giá đã biết chưa', icon: 'note' },
    { key: 'mcq', label: 'Trắc nghiệm 4 đáp án', note: 'Nhận ra đúng từ hoặc đúng nghĩa giữa bốn lựa chọn', icon: 'list' },
    { key: 'type', label: 'Điền từ', note: 'Gõ ra từ tiếng Anh — phần khó nhất, qua được mới tính là nhớ', icon: 'pencil' },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} className="flex-1 items-center justify-center px-4 py-6" style={{ backgroundColor: 'rgba(15,23,42,0.38)' }}>
        {/* Chặn bấm xuyên qua thẻ xuống lớp nền (lớp nền bấm là đóng). */}
        <Pressable onPress={() => {}} className="w-full rounded-[26px] bg-white" style={[{ maxWidth: 580, maxHeight: '92%', cursor: 'auto' } as object, CARD_SHADOW]}>
          <View className="flex-row items-start justify-between px-5 pb-3 pt-6 sm:px-6">
            <View className="flex-1 pr-4">
              <Text className="font-heavy text-sectionTitle text-ink">Cài đặt học</Text>
              <Text className="mt-1 font-sans text-body text-muted">Chọn phần học, chiều hỏi và nhóm từ. Bấm Áp dụng để bắt đầu vòng mới.</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Đóng" onPress={onClose} className="h-10 w-10 items-center justify-center rounded-pill" style={{ backgroundColor: '#F1F5F9' }}>
              <Icon name="close" size={18} color={color.ink} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 8 }}>
            <Section title="Phần học" warn={noKind ? 'Phải bật ít nhất một phần.' : undefined}>
              <View className="gap-2.5">
                {KINDS.map((k, i) => {
                  const on = draft.kinds.includes(k.key);
                  return (
                    <Row key={k.key} on={on} onPress={() => setDraft({ ...draft, kinds: toggleIn(draft.kinds, k.key) })}>
                      <View className="h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: on ? '#DBEAFE' : '#F1F5F9' }}>
                        <Icon name={k.icon} size={18} color={on ? color.primary : '#64748B'} />
                      </View>
                      <View className="flex-1">
                        <Text className="font-strong text-bodyLg text-ink">
                          <Text className="text-muted">{i + 1}. </Text>
                          {k.label}
                        </Text>
                        <Text className="mt-0.5 font-sans text-label text-muted">{k.note}</Text>
                      </View>
                    </Row>
                  );
                })}
              </View>
              <Hint>Mỗi từ đi lần lượt qua các phần đang bật, theo thứ tự trên.</Hint>
            </Section>

            <Section title="Chiều hỏi" warn={noDir ? 'Phải chọn ít nhất một chiều hỏi.' : undefined}>
              <View className="gap-2.5">
                {DIRS.map((d) => (
                  <Row key={d.key} on={draft.directions.includes(d.key)} onPress={() => setDraft({ ...draft, directions: toggleIn(draft.directions, d.key) })}>
                    <Text className="flex-1 font-sans text-bodyLg text-ink">{d.label}</Text>
                  </Row>
                ))}
              </View>
              <Hint>Phần Điền từ luôn gõ ra từ tiếng Anh, nên hỏi bằng nghĩa hoặc bằng giọng đọc.</Hint>
            </Section>

            <Section title="Nhóm từ" warn={matches === 0 && !noDir && !noKind ? 'Không còn từ nào khớp bộ lọc này.' : undefined}>
              <View className="gap-2.5">
                <Row on={draft.starredOnly} onPress={() => setDraft({ ...draft, starredOnly: !draft.starredOnly })}>
                  <Icon name="star-fill" size={18} color="#F59E0B" />
                  <Text className="flex-1 font-sans text-bodyLg text-ink">
                    Chỉ từ đánh dấu sao <Text className="text-muted">({starredCount} từ)</Text>
                  </Text>
                </Row>
                <Row on={draft.unmasteredOnly} onPress={() => setDraft({ ...draft, unmasteredOnly: !draft.unmasteredOnly })}>
                  <Icon name="target" size={18} color={color.primary} />
                  <Text className="flex-1 font-sans text-bodyLg text-ink">
                    Chỉ từ chưa thuộc <Text className="text-muted">({unmasteredCount} từ)</Text>
                  </Text>
                </Row>
              </View>
            </Section>

            <Section title="Thứ tự và nhịp">
              <View className="gap-2.5">
                <Row on={draft.ordered} onPress={() => setDraft({ ...draft, ordered: !draft.ordered })}>
                  <View className="flex-1">
                    <Text className="font-sans text-bodyLg text-ink">Học theo thứ tự trong bộ</Text>
                    <Text className="mt-0.5 font-sans text-label text-muted">Bộ đã xếp từ dễ tới khó. Tắt để xáo trộn.</Text>
                  </View>
                </Row>
                <Row on={draft.autoAdvance} onPress={() => setDraft({ ...draft, autoAdvance: !draft.autoAdvance })}>
                  <View className="flex-1">
                    <Text className="font-sans text-bodyLg text-ink">Tự sang câu tiếp khi trả lời đúng</Text>
                    <Text className="mt-0.5 font-sans text-label text-muted">Trả lời sai vẫn dừng lại để bạn xem đáp án.</Text>
                  </View>
                </Row>
              </View>
            </Section>
          </ScrollView>

          <View className="flex-row items-center justify-between gap-3 border-t px-5 py-4 sm:px-6" style={{ borderColor: '#EEF2F7' }}>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                if (!confirmReset) return setConfirmReset(true);
                onReset();
                setConfirmReset(false);
              }}
              className="flex-row items-center gap-2 rounded-2xl px-4 py-3"
              style={{ flexShrink: 1, backgroundColor: confirmReset ? '#FFF1F2' : '#F1F5F9' }}
            >
              <Icon name="refresh" size={16} color={confirmReset ? '#E11D48' : '#475569'} />
              <Text className="flex-shrink font-semi text-body" style={{ color: confirmReset ? '#E11D48' : '#475569' }}>
                {confirmReset ? 'Bấm lần nữa để xoá' : 'Xoá tiến độ'}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={blocked}
              onPress={() => onApply(draft)}
              className="rounded-2xl px-6 py-3"
              style={{ flexShrink: 0, backgroundColor: blocked ? '#C7D2FE' : color.primary }}
            >
              <Text className="font-strong text-bodyLg text-white">Áp dụng</Text>
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
    <View className="mt-5">
      <Text className="mb-2.5 font-strong text-label uppercase tracking-[1.2px] text-muted">{title}</Text>
      {children}
      {warn ? (
        <Text className="mt-2 font-semi text-label" style={{ color: '#E11D48' }}>
          {warn}
        </Text>
      ) : null}
    </View>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return <Text className="mt-2 font-sans text-label text-muted">{children}</Text>;
}

/** Một dòng bật/tắt: ô vuông đánh dấu bên trái, nội dung bên phải. */
function Row({ on, onPress, children }: { on: boolean; onPress: () => void; children: React.ReactNode }) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: on }}
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-2xl px-4 py-3.5"
      style={{ borderWidth: 1.5, borderColor: on ? '#93C5FD' : '#E2E8F0', backgroundColor: on ? '#F3F8FF' : '#FFFFFF' }}
    >
      <View
        className="h-6 w-6 items-center justify-center rounded-lg"
        style={{ backgroundColor: on ? color.primary : '#FFFFFF', borderWidth: on ? 0 : 1.5, borderColor: '#CBD5E1' }}
      >
        {on ? <Icon name="check" size={15} color="#FFFFFF" strokeWidth={2.6} /> : null}
      </View>
      {children}
    </Pressable>
  );
}
