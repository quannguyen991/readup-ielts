import React, { useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native';

import { CARD_SHADOW } from './StudyKit';
import { Icon, type IconName } from '@/components/ui/Icon';
import { canRecognize } from '@/services/shadow/speech';
import type { Direction, LearnSettings, StageKind } from '@/services/vocab/topic-study';
import { color } from '@/theme/tokens';
import { useL } from '@/i18n/useL';
import { useTopicStudyStore } from '@/store/useTopicStudyStore';
import { STUDY_THEMES, THEME_ORDER } from './study-theme';
import { ArtGallery } from '@/components/art/ArtBackdrop';
import { useBackdropStore } from '@/store/useBackdropStore';

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
  const flip = (key: 'interleave' | 'ordered' | 'autoAdvance' | 'acceptSynonyms' | 'speakAnswer' | 'autoPronounce' | 'starredOnly' | 'unmasteredOnly') =>
    setDraft({ ...draft, [key]: !draft[key] });
  const noDir = draft.directions.length === 0;
  const noKind = draft.kinds.length === 0;
  const matches = matchCount(draft);
  const blocked = noDir || noKind || matches === 0;

  const DIRS: { key: Direction; label: React.ReactNode }[] = [
    { key: 'enToVi', label: en ? <>See the <B>English word</B>, pick the Vietnamese meaning</> : <>Thấy <B>từ tiếng Anh</B>, chọn nghĩa tiếng Việt</> },
    { key: 'enToEn', label: en ? <>See the <B>English word</B>, pick its <B>English definition</B></> : <>Thấy <B>từ tiếng Anh</B>, chọn <B>định nghĩa tiếng Anh</B></> },
    { key: 'viToEn', label: en ? <>See the <B>Vietnamese meaning</B>, find the English word</> : <>Thấy <B>nghĩa tiếng Việt</B>, tìm từ tiếng Anh</> },
    { key: 'listen', label: en ? <>Just <B>listen to the audio</B>, recognise the word</> : <>Chỉ <B>nghe giọng đọc</B>, nhận ra từ</> },
  ];
  const KINDS: { key: StageKind; label: string; icon: IconName }[] = [
    { key: 'flash', label: L('Lật thẻ', 'Flashcards'), icon: 'note' },
    { key: 'mcq', label: L('Trắc nghiệm 4 đáp án', 'Multiple choice (4 options)'), icon: 'list' },
    { key: 'fill', label: L('Điền chỗ trống (ABCD)', 'Fill the gap (ABCD)'), icon: 'letters' },
    { key: 'type', label: L('Gõ từ', 'Type the word'), icon: 'pencil' },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} className="flex-1 items-center justify-center px-4 py-6" style={{ backgroundColor: 'rgba(15,23,42,0.45)' }}>
        {/* Chặn bấm xuyên qua thẻ xuống lớp nền (lớp nền bấm là đóng). */}
        <Pressable onPress={() => {}} className="w-full rounded-[26px] bg-white" style={[{ maxWidth: 560, maxHeight: '92%', cursor: 'auto' } as object, CARD_SHADOW]}>
          <View className="flex-row items-center justify-between px-5 pb-2 pt-5 sm:px-6">
            <Text className="font-heavy text-sectionTitle text-ink">{L('Cài đặt học', 'Study settings')}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel={L('Đóng', 'Close')} onPress={onClose} className="h-10 w-10 items-center justify-center rounded-pill" style={{ backgroundColor: '#F3F0FB' }}>
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

            <Section title={L('Nền & hiệu ứng', 'Background & effects')}>
              <ThemePicker />
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

            <Section title={L('Phát âm', 'Pronunciation')}>
              <Row on={draft.autoPronounce} onPress={() => flip('autoPronounce')}>
                <Icon name="volume" size={18} color={draft.autoPronounce ? color.primary : '#64748B'} />
                <Text className="flex-1 font-sans text-bodyLg text-ink">{L('Tự phát âm', 'Auto-pronounce')}</Text>
              </Row>
              <Row on={draft.accent === 'us'} onPress={() => setDraft({ ...draft, accent: 'us' })}>
                <Text className="flex-1 font-sans text-bodyLg text-ink">{L('Anh–Mỹ', 'American English')}</Text>
              </Row>
              <Row on={draft.accent === 'uk'} onPress={() => setDraft({ ...draft, accent: 'uk' })}>
                <Text className="flex-1 font-sans text-bodyLg text-ink">{L('Anh–Anh', 'British English')}</Text>
              </Row>
              <Row on={draft.voiceGender === 'f'} onPress={() => setDraft({ ...draft, voiceGender: 'f' })}>
                <Text className="flex-1 font-sans text-bodyLg text-ink">{L('Giọng nữ', 'Female voice')}</Text>
              </Row>
              <Row on={draft.voiceGender === 'm'} onPress={() => setDraft({ ...draft, voiceGender: 'm' })}>
                <Text className="flex-1 font-sans text-bodyLg text-ink">{L('Giọng nam (khi thiếu bản ghi)', 'Male voice (when no recording)')}</Text>
              </Row>
              <Row on={draft.clipVoice === 'aoede'} onPress={() => setDraft({ ...draft, clipVoice: 'aoede' })}>
                <Text className="flex-1 font-sans text-bodyLg text-ink">{L('Giọng Aoede (mặc định)', 'Aoede voice (default)')}</Text>
              </Row>
              <Row on={draft.clipVoice === 'adam'} onPress={() => setDraft({ ...draft, clipVoice: 'adam' })}>
                <Text className="flex-1 font-sans text-bodyLg text-ink">{L('Giọng Adam (Kokoro, nam)', 'Adam voice (Kokoro, male)')}</Text>
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

          <View className="flex-row items-center justify-between gap-3 border-t px-5 py-4 sm:px-6" style={{ borderColor: '#F3F0FB' }}>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                if (!confirmReset) return setConfirmReset(true);
                onReset();
                setConfirmReset(false);
              }}
              className="flex-row items-center gap-2 rounded-2xl px-4 py-3"
              style={{ flexShrink: 1, backgroundColor: confirmReset ? '#FFF1F2' : '#F3F0FB' }}
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
              style={{ flexShrink: 0, backgroundColor: blocked ? '#F3F0FB' : color.primary }}
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
      <Text className="mb-2 font-strong text-label text-muted">{title}</Text>
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
      style={{ borderWidth: 1.5, borderColor: on ? '#E6D2A6' : '#F3F0FB', backgroundColor: on ? '#F3F0FB' : '#FFFFFF', opacity: disabled ? 0.55 : 1 }}
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


/** Máy yếu / người dùng chọn "giảm chuyển động": gợi ý nên để tắt (không tự ép — người học vẫn bật được). */
function lowEndHint(): boolean {
  if (typeof navigator === 'undefined') return false;
  const nav = navigator as Navigator & { deviceMemory?: number };
  const reduced = typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  return reduced || (nav.hardwareConcurrency ?? 8) <= 4 || (nav.deviceMemory ?? 8) <= 4;
}

/**
 * "Nền & hiệu ứng": công tắc TẮT mặc định — tắt thì màn học phẳng, không dựng lớp trang trí nào.
 * Bật thì chọn chủ đề; áp dụng NGAY (không qua bản nháp, không bắt đầu lại vòng) nên nền phía sau bảng
 * đổi theo như xem trước. Mỗi thẻ là một ô màu nhỏ làm bằng CSS gradient.
 */
export function ThemePicker() {
  const { L, en } = useL();
  const fx = useTopicStudyStore((s) => s.studyFx);
  const setFx = useTopicStudyStore((s) => s.setStudyFx);
  const current = useTopicStudyStore((s) => s.studyTheme);
  const setTheme = useTopicStudyStore((s) => s.setStudyTheme);
  const artOn = useBackdropStore((s) => s.studyOn);
  const artChoice = useBackdropStore((s) => s.choice);
  const setArtOn = useBackdropStore((s) => s.setStudyOn);
  const pickArt = useBackdropStore((s) => s.setStudyChoice);
  return (
    <View className="gap-2.5">
      <Row on={fx} onPress={() => setFx(!fx)}>
        <Icon name="sparkle" size={18} color={fx ? color.primary : '#64748B'} />
        <Text className="flex-1 font-sans text-bodyLg text-ink">
          {L('Bật nền & hiệu ứng', 'Turn on background & effects')}
          {!fx ? <Text className="text-muted">{L(' · đang tắt cho nhẹ máy', ' · off for a lighter app')}</Text> : null}
        </Text>
      </Row>
      {fx && lowEndHint() ? (
        <Text className="font-sans text-label text-muted">{L('Máy này có vẻ yếu hoặc đang giảm chuyển động — nên để tắt cho mượt.', 'This device looks low-end or set to reduce motion — keeping this off is smoother.')}</Text>
      ) : null}
      {fx ? (
        <View className="flex-row flex-wrap gap-2.5" accessibilityRole="radiogroup">
          {THEME_ORDER.map((id) => {
            const t = STUDY_THEMES[id];
            const on = current === id && !artOn;
            return (
              <Pressable
                key={id}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
                accessibilityLabel={en ? t.en : t.vi}
                onPress={() => {
                  setTheme(id);
                  setArtOn(false);
                }}
                style={{ width: '31%', minWidth: 96, flexGrow: 1 }}
              >
                <View
                  style={{
                    height: 58,
                    borderRadius: 12,
                    borderWidth: on ? 2.5 : 1,
                    borderColor: on ? color.primary : '#E1D9CB',
                    overflow: 'hidden',
                    justifyContent: 'flex-end',
                    padding: 6,
                    backgroundColor: t.skyBase,
                    ...({ backgroundImage: t.swatch } as object),
                  }}
                >
                  <View style={{ height: 18, width: '62%', borderRadius: 6, backgroundColor: t.card, borderWidth: 1, borderColor: t.dark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.06)' }} />
                </View>
                <Text className="mt-1 text-center font-semi text-label text-ink" numberOfLines={1}>
                  {on ? '✓ ' : ''}{en ? t.en : t.vi}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
      {/* Tranh là công tắc RIÊNG, bật mặc định — luôn hiện để người học đổi tranh hoặc bấm "Tắt nền". */}
      {Platform.OS === 'web' ? (
        <View className="mt-1 gap-2">
          <Text className="font-strong text-label text-muted">{L('Tranh nổi tiếng', 'Famous paintings')}</Text>
          <ArtGallery
            active={artOn}
            choice={artChoice}
            onPick={pickArt}
            onOff={() => setArtOn(false)}
            randomLabel={L('Ngẫu nhiên mỗi lần học', 'Random each session')}
            colors={{ ink: color.ink, muted: '#5B6678', chip: '#F3F0FB', accent: color.primary, onAccent: '#FFFFFF' }}
          />
        </View>
      ) : null}
    </View>
  );
}
