import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { Icon } from '@/components/ui';
import type { Note } from '@/store/useReaderStore';
import { useL } from '@/i18n/useL';
import { EXAM, PAPER_THEMES } from './exam-theme';

/**
 * Hai bảng nổi của phòng thi: Cài đặt (giấy, chữ, song ngữ, đọc to) và Ghi chú.
 * Gom công cụ phụ vào đây để thanh trên và bài đọc không phải gánh chúng.
 */

function Popover({ children, width = 300 }: { children: React.ReactNode; width?: number }) {
  return (
    <View
      style={[
        {
          position: 'absolute',
          top: 56,
          right: 12,
          width,
          maxWidth: '94%',
          maxHeight: '70%',
          backgroundColor: EXAM.white,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: EXAM.line,
          padding: 14,
          zIndex: 80,
        },
        Platform.OS === 'web' ? ({ boxShadow: '0 12px 36px rgba(15,23,42,0.14)' } as object) : { elevation: 8 },
      ]}
    >
      {children}
    </View>
  );
}

function Backdrop({ onClose }: { onClose: () => void }) {
  return <Pressable onPress={onClose} accessible={false} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 70 }} />;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 6, marginBottom: 12 }}>
      <Text style={{ fontSize: 11.5, fontWeight: '800', color: EXAM.muted, letterSpacing: 0.4 }}>{label.toUpperCase()}</Text>
      {children}
    </View>
  );
}

function Chip({ label, active, onPress, disabled }: { label: string; active?: boolean; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      aria-pressed={active}
      style={{
        minHeight: 34,
        paddingHorizontal: 12,
        justifyContent: 'center',
        borderRadius: 999,
        borderWidth: 1,
        borderColor: active ? EXAM.accent : EXAM.line,
        backgroundColor: active ? EXAM.accentSoft : EXAM.white,
        opacity: disabled ? 0.55 : 1,
      }}
    >
      <Text style={{ fontSize: 13, fontWeight: '700', color: active ? EXAM.accentDeep : EXAM.ink }}>{label}</Text>
    </Pressable>
  );
}

export function SettingsPanel({
  onClose,
  paperKey,
  onPaper,
  fonts,
  fontKey,
  onFont,
  fontPx,
  onFontSize,
  bilingual,
  speaking,
  onSpeak,
  onStopSpeak,
  ttsRate,
  onRate,
  onFullscreen,
}: {
  onClose: () => void;
  paperKey: string;
  onPaper: (key: string) => void;
  fonts: readonly { key: string; label: string }[];
  fontKey: string;
  onFont: (key: string) => void;
  fontPx: number;
  onFontSize: (delta: number) => void;
  bilingual: { on: boolean; loading: boolean; toggle: () => void };
  speaking: boolean;
  onSpeak: () => void;
  onStopSpeak: () => void;
  ttsRate: number;
  onRate: (rate: number) => void;
  onFullscreen: (() => void) | null;
}) {
  const { L } = useL();
  return (
    <>
      <Backdrop onClose={onClose} />
      <Popover width={320}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Row label={L('Màu giấy', 'Paper')}>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {PAPER_THEMES.map((t) => (
                <Pressable
                  key={t.key}
                  accessibilityRole="button"
                  accessibilityLabel={L(`Giấy ${t.label}`, `${t.labelEn} paper`)}
                  aria-selected={paperKey === t.key}
                  onPress={() => onPaper(t.key)}
                  style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: t.bg, borderWidth: paperKey === t.key ? 2.5 : 1, borderColor: paperKey === t.key ? EXAM.accent : EXAM.line }}
                />
              ))}
            </View>
          </Row>
          <Row label={L('Phông chữ', 'Typeface')}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {fonts.map((f) => (
                <Chip key={f.key} label={f.label} active={fontKey === f.key} onPress={() => onFont(f.key)} />
              ))}
            </View>
          </Row>
          <Row label={L('Cỡ chữ', 'Text size')}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Chip label="−" onPress={() => onFontSize(-0.1)} />
              <Text style={{ minWidth: 44, textAlign: 'center', fontSize: 14, fontWeight: '800', color: EXAM.ink }}>{fontPx}px</Text>
              <Chip label="+" onPress={() => onFontSize(0.1)} />
            </View>
          </Row>
          <Row label={L('Bài đọc', 'Passage')}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <Chip
                label={bilingual.loading ? L('Đang dịch…', 'Translating…') : bilingual.on ? L('Tắt song ngữ', 'Bilingual off') : L('Song ngữ', 'Bilingual')}
                active={bilingual.on}
                disabled={bilingual.loading}
                onPress={bilingual.toggle}
              />
              <Chip label={L('Đọc to', 'Read aloud')} onPress={onSpeak} />
              {speaking ? <Chip label={L('Dừng', 'Stop')} onPress={onStopSpeak} /> : null}
              {onFullscreen ? <Chip label={L('Toàn màn hình', 'Full screen')} onPress={onFullscreen} /> : null}
            </View>
          </Row>
          <Row label={L('Tốc độ đọc to', 'Speech rate')}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[0.75, 1, 1.5, 2].map((r) => (
                <Chip key={r} label={`${r}x`} active={ttsRate === r} onPress={() => onRate(r)} />
              ))}
            </View>
          </Row>
        </ScrollView>
      </Popover>
    </>
  );
}

export function NotesPanel({
  notes,
  onAdd,
  onRemove,
  onClose,
}: {
  notes: Note[];
  onAdd: (body: string) => void;
  onRemove: (id: string) => void;
  onClose: () => void;
}) {
  const { L } = useL();
  const [draft, setDraft] = useState('');
  const submit = () => {
    const body = draft.trim();
    if (!body) return;
    onAdd(body);
    setDraft('');
  };
  return (
    <>
      <Backdrop onClose={onClose} />
      <Popover width={340}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={submit}
            autoFocus
            placeholder={L('Ghi chú cho bài này…', 'Note for this passage…')}
            placeholderTextColor="#9A9484"
            style={[
              { flex: 1, height: 40, borderRadius: 10, borderWidth: 1, borderColor: EXAM.line, paddingHorizontal: 12, fontSize: 14, color: EXAM.ink },
              Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null,
            ]}
          />
          <Pressable
            onPress={submit}
            accessibilityRole="button"
            accessibilityLabel={L('Thêm ghi chú', 'Add note')}
            style={{ height: 40, paddingHorizontal: 14, borderRadius: 10, backgroundColor: EXAM.accent, justifyContent: 'center' }}
          >
            <Text style={{ fontSize: 13.5, fontWeight: '800', color: '#FFFFFF' }}>{L('Thêm', 'Add')}</Text>
          </Pressable>
        </View>
        <ScrollView style={{ marginTop: 10 }} showsVerticalScrollIndicator={false}>
          {notes.length === 0 ? (
            <Text style={{ fontSize: 13, color: EXAM.muted, paddingVertical: 6 }}>{L('Chưa có ghi chú nào.', 'No notes yet.')}</Text>
          ) : (
            notes.map((n) => (
              <View key={n.id} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingVertical: 8, borderTopWidth: 1, borderTopColor: EXAM.line }}>
                <Text style={{ flex: 1, fontSize: 14, lineHeight: 20, color: EXAM.body }}>{n.body}</Text>
                <Pressable
                  onPress={() => onRemove(n.id)}
                  accessibilityRole="button"
                  accessibilityLabel={L('Xoá ghi chú', 'Delete note')}
                  style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Icon name="close" size={13} color={EXAM.muted} strokeWidth={2.4} />
                </Pressable>
              </View>
            ))
          )}
        </ScrollView>
      </Popover>
    </>
  );
}
