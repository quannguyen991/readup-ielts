import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Badge, Button, Card, HeroBanner, Icon, SectionHeader } from '@/components/ui';
import { useReaderStore } from '@/store/useReaderStore';
import { color, highlightColors } from '@/theme/tokens';
import { useL } from '@/i18n/useL';

export default function NotesScreen() {
  const { L } = useL();
  const notes = useReaderStore((s) => s.notes);
  const highlights = useReaderStore((s) => s.highlights);
  const updateNote = useReaderStore((s) => s.updateNote);
  const removeNote = useReaderStore((s) => s.removeNote);
  const addNote = useReaderStore((s) => s.addNote);
  const removeHighlight = useReaderStore((s) => s.removeHighlight);

  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  return (
    <Screen>
      <HeroBanner
        title={L('Ghi chú', 'Notes')}
        subtitle={L('Ghi chú và đoạn bôi màu bạn tạo khi đọc.', 'Notes and highlights you made while reading.')}
        illustration="notes-hero"
      >
        <Button
          label={L('Ghi chú mới', 'New note')}
          iconLeft="plus"
          onPress={() =>
            addNote({ articleId: null, articleTitle: null, paragraphIndex: null, body: '' })
          }
        />
      </HeroBanner>

      <Card className="mt-4">
        <SectionHeader title={L('Ghi chú', 'Notes')} subtitle={L(`${notes.length} mục`, `${notes.length} items`)} icon="note" />

        <View className="mt-3 gap-3">
          {notes.map((note) => (
            <View key={note.id} className="rounded-panel border border-border p-3">
              <View className="flex-row items-center gap-2">
                {note.articleTitle ? (
                  <Pressable
                    onPress={() =>
                      note.articleId ? router.push(`/read/${note.articleId}` as never) : undefined
                    }
                  >
                    <Badge label={note.articleTitle} tone="primary" />
                  </Pressable>
                ) : (
                  <Badge label={L('Ghi chú tự do', 'Free note')} tone="neutral" />
                )}
                <View className="flex-1" />
                <Text className="font-mid text-label text-subtle">
                  {note.updatedAt.slice(0, 10)}
                </Text>
              </View>

              {editing === note.id ? (
                <View className="mt-2">
                  <TextInput
                    value={draft}
                    onChangeText={setDraft}
                    multiline
                    className="min-h-[80px] rounded-panel border border-border bg-surfaceAlt p-3 font-sans text-body text-ink"
                    style={{ outlineStyle: 'none', textAlignVertical: 'top' } as never}
                  />
                  <View className="mt-2 flex-row gap-2">
                    <Button
                      label={L('Lưu', 'Save')}
                      size="sm"
                      onPress={() => {
                        updateNote(note.id, draft);
                        setEditing(null);
                      }}
                    />
                    <Button
                      label={L('Huỷ', 'Cancel')}
                      size="sm"
                      variant="ghost"
                      onPress={() => setEditing(null)}
                    />
                  </View>
                </View>
              ) : (
                <Pressable
                  onPress={() => {
                    setEditing(note.id);
                    setDraft(note.body);
                  }}
                >
                  <Text className="mt-2 font-sans text-body text-body">
                    {note.body || L('Chạm để viết…', 'Tap to write…')}
                  </Text>
                </Pressable>
              )}

              <Pressable onPress={() => removeNote(note.id)} className="mt-2 self-start">
                <Text className="font-semi text-label text-danger-ink">{L('Xoá', 'Delete')}</Text>
              </Pressable>
            </View>
          ))}

          {notes.length === 0 ? (
            <Text className="py-6 text-center font-sans text-body text-muted">
              {L('Chưa có ghi chú nào.', 'No notes yet.')}
            </Text>
          ) : null}
        </View>
      </Card>

      <Card className="mt-4">
        <SectionHeader
          title={L('Đoạn đã bôi màu', 'Highlights')}
          subtitle={L(`${highlights.length} đoạn`, `${highlights.length} highlights`)}
          icon="pencil"
          iconTone="warning"
        />

        <View className="mt-3 gap-2">
          {highlights.map((highlight) => (
            <View
              key={highlight.id}
              className="flex-row items-start gap-2 rounded-panel border border-border p-3"
            >
              <View
                className="mt-1 h-3 w-3 rounded-pill"
                style={{ backgroundColor: highlightColors[highlight.color].dot }}
              />
              <View className="flex-1">
                <Text className="font-sans text-body text-body">“{highlight.text}”</Text>
                <Text className="mt-1 font-mid text-label text-subtle">
                  {L('Đoạn', 'Paragraph')} {highlight.paragraphIndex + 1} · {highlight.createdAt.slice(0, 10)}
                </Text>
              </View>
              <Pressable onPress={() => removeHighlight(highlight.id)}>
                <Icon name="close" size={14} color={color.subtle} />
              </Pressable>
            </View>
          ))}

          {highlights.length === 0 ? (
            <Text className="py-6 text-center font-sans text-body text-muted">
              {L('Chưa bôi màu đoạn nào.', 'No highlights yet.')}
            </Text>
          ) : null}
        </View>
      </Card>
    </Screen>
  );
}
