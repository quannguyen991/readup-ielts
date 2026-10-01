import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { Badge, Button, Icon, IconButton } from '@/components/ui';
import { useReaderStore, type ChatMessage } from '@/store/useReaderStore';
import { color } from '@/theme/tokens';
import { bi, currentLocale, pick, useL, type Bi } from '@/i18n/useL';

const EMPTY_MESSAGES: ChatMessage[] = [];

/** Prompt gợi ý sẵn theo spec, dùng lại được cho mọi bài. */
const SUGGESTED: { title: Bi; body: Bi }[] = [
  {
    title: { vi: 'Tóm tắt bài', en: 'Summarise' },
    body: { vi: 'Tóm tắt bài đọc này trong 5 câu.', en: 'Summarise this passage in 5 sentences.' },
  },
  {
    title: { vi: 'Ý chính từng đoạn', en: 'Main idea of each paragraph' },
    body: { vi: 'Nêu ý chính của từng đoạn, mỗi đoạn một dòng.', en: 'Give the main idea of each paragraph, one line per paragraph.' },
  },
  {
    title: { vi: 'Từ vựng band 7+', en: 'Band 7+ vocabulary' },
    body: {
      vi: 'Liệt kê 10 từ/cụm từ band 7+ trong bài, kèm nghĩa tiếng Việt và câu chứa nó.',
      en: 'List 10 band 7+ words/phrases from the passage, with their meaning and the sentence they appear in.',
    },
  },
  {
    title: { vi: 'Tạo 5 câu hỏi', en: 'Make 5 questions' },
    body: { vi: 'Tạo 5 câu hỏi True/False/Not Given từ bài này kèm đáp án.', en: 'Write 5 True/False/Not Given questions from this passage, with answers.' },
  },
];

export function ChatPanel({
  articleId,
  visible,
  onClose,
}: {
  articleId: string;
  visible: boolean;
  onClose: () => void;
}) {
  const { L, locale } = useL();
  // Không đặt `?? []` trong selector: mảng mới mỗi lần render sẽ làm zustand
  // tưởng state đổi và gây vòng lặp cập nhật vô hạn.
  const messages = useReaderStore((s) => s.chats[articleId]) ?? EMPTY_MESSAGES;
  const addChatMessage = useReaderStore((s) => s.addChatMessage);
  const clearChat = useReaderStore((s) => s.clearChat);
  const savedPrompts = useReaderStore((s) => s.savedPrompts);
  const savePrompt = useReaderStore((s) => s.savePrompt);

  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState('');
  const [busy, setBusy] = useState(false);

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || busy) return;

    addChatMessage({ articleId, role: 'user', content });
    setInput('');
    setBusy(true);
    setStreaming('');

    const history = [...messages, { role: 'user' as const, content }].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ articleId, messages: history }),
      });

      if (!response.ok || !response.body) {
        const message = await response.text();
        addChatMessage({ articleId, role: 'assistant', content: message });
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let full = '';

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        setStreaming(full);
      }

      addChatMessage({ articleId, role: 'assistant', content: full });
    } catch (err) {
      addChatMessage({
        articleId,
        role: 'assistant',
        content: pick(
          currentLocale(),
          `Không gọi được trợ giảng: ${err instanceof Error ? err.message : 'lỗi mạng'}`,
          `Couldn't reach the tutor: ${err instanceof Error ? err.message : 'network error'}`,
        ),
      });
    } finally {
      setStreaming('');
      setBusy(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/30" onPress={onClose} />

      <View className="h-[75%] rounded-t-[20px] border-t border-border bg-surface">
        <View className="flex-row items-center justify-between border-b border-border px-4 py-3">
          <View className="flex-row items-center gap-2">
            <Icon name="chat" size={18} color={color.primary} />
            <Text className="font-strong text-cardTitle text-ink">{L('Trợ giảng IELTS', 'IELTS tutor')}</Text>
          </View>
          <View className="flex-row gap-2">
            <IconButton
              name="refresh"
              accessibilityLabel={L('Xoá lịch sử', 'Clear history')}
              onPress={() => clearChat(articleId)}
            />
            <IconButton name="close" accessibilityLabel={L('Đóng', 'Close')} onPress={onClose} />
          </View>
        </View>

        <ScrollView className="flex-1 px-4 py-3" showsVerticalScrollIndicator={false}>
          {messages.length === 0 && !streaming ? (
            <View className="gap-2">
              <Text className="font-mid text-label text-muted">{L('Gợi ý câu hỏi', 'Suggested questions')}</Text>
              {[...SUGGESTED.map((s) => ({ title: bi(s.title, locale), body: bi(s.body, locale) })), ...savedPrompts].map((prompt) => (
                <Pressable
                  key={prompt.title}
                  onPress={() => void send(prompt.body)}
                  className="rounded-panel border border-border bg-surfaceAlt px-3 py-2.5"
                >
                  <Text className="font-semi text-body text-ink">{prompt.title}</Text>
                  <Text className="mt-0.5 font-sans text-label text-muted" numberOfLines={2}>
                    {prompt.body}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          {messages.map((message) => (
            <View
              key={message.id}
              className={[
                'mb-3 max-w-[88%] rounded-panel px-3 py-2.5',
                message.role === 'user'
                  ? 'self-end bg-primary-600'
                  : 'self-start border border-border bg-surfaceAlt',
              ].join(' ')}
            >
              <Text
                className={[
                  'font-sans text-body',
                  message.role === 'user' ? 'text-white' : 'text-body',
                ].join(' ')}
              >
                {message.content}
              </Text>
            </View>
          ))}

          {streaming ? (
            <View className="mb-3 max-w-[88%] self-start rounded-panel border border-border bg-surfaceAlt px-3 py-2.5">
              <Text className="font-sans text-body text-body">{streaming}</Text>
            </View>
          ) : null}
        </ScrollView>

        <View className="border-t border-border p-3">
          {input.trim().length > 12 ? (
            <Pressable
              onPress={() => savePrompt(input.slice(0, 40), input)}
              className="mb-2 flex-row items-center gap-1"
            >
              <Icon name="plus" size={13} color={color.primary} />
              <Text className="font-semi text-label text-primary-600">
                {L('Lưu câu này thành prompt dùng lại', 'Save this as a reusable prompt')}
              </Text>
            </Pressable>
          ) : null}

          <View className="flex-row items-center gap-2">
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder={L('Hỏi bất cứ điều gì về bài đọc…', 'Ask anything about the passage…')}
              placeholderTextColor={color.subtle}
              className="h-11 flex-1 rounded-panel border border-border bg-surfaceAlt px-3 font-sans text-body text-ink"
              style={{ outlineStyle: 'none' } as never}
              onSubmitEditing={() => void send(input)}
            />
            <Button
              label={L('Gửi', 'Send')}
              size="sm"
              loading={busy}
              onPress={() => void send(input)}
              iconRight="arrow-right"
            />
          </View>

          <Badge label={L('Trả lời dựa trên toàn văn bài đọc', 'Answers are based on the full passage')} tone="neutral" className="mt-2" />
        </View>
      </View>
    </Modal>
  );
}
