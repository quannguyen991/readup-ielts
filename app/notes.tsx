import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Badge, Button, Card, Icon, SectionHeader } from '@/components/ui';
import { useReaderStore } from '@/store/useReaderStore';
import { color, highlightColors } from '@/theme/tokens';

export default function NotesScreen() {
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
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="font-heavy text-pageTitle text-ink">Notes</Text>
          <Text className="mt-1 font-sans text-body text-muted">
            Ghi chú và đoạn bôi màu bạn tạo khi đọc.
          </Text>
        </View>
        <Button
          label="Ghi chú mới"
          iconLeft="plus"
          onPress={() =>
            addNote({ articleId: null, articleTitle: null, paragraphIndex: null, body: '' })
          }
        />
      </View>

      <Card className="mt-4">
        <SectionHeader title="Ghi chú" subtitle={`${notes.length} mục`} icon="note" />

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
                  <Badge label="Ghi chú tự do" tone="neutral" />
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
                      label="Lưu"
                      size="sm"
                      onPress={() => {
                        updateNote(note.id, draft);
                        setEditing(null);
                      }}
                    />
                    <Button
                      label="Huỷ"
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
                    {note.body || 'Chạm để viết…'}
                  </Text>
                </Pressable>
              )}

              <Pressable onPress={() => removeNote(note.id)} className="mt-2 self-start">
                <Text className="font-semi text-label text-danger-ink">Xoá</Text>
              </Pressable>
            </View>
          ))}

          {notes.length === 0 ? (
            <Text className="py-6 text-center font-sans text-body text-muted">
              Chưa có ghi chú nào.
            </Text>
          ) : null}
        </View>
      </Card>

      <Card className="mt-4">
        <SectionHeader
          title="Đoạn đã bôi màu"
          subtitle={`${highlights.length} đoạn`}
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
                  Đoạn {highlight.paragraphIndex + 1} · {highlight.createdAt.slice(0, 10)}
                </Text>
              </View>
              <Pressable onPress={() => removeHighlight(highlight.id)}>
                <Icon name="close" size={14} color={color.subtle} />
              </Pressable>
            </View>
          ))}

          {highlights.length === 0 ? (
            <Text className="py-6 text-center font-sans text-body text-muted">
              Chưa bôi màu đoạn nào.
            </Text>
          ) : null}
        </View>
      </Card>
    </Screen>
  );
}
