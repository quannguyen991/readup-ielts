import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Button, Card, Icon } from '@/components/ui';
import { Screen } from '@/components/layout/Screen';
import { useL } from '@/i18n/useL';
import { CommunityApiError, communityApi, type CommunityThreadResponse } from '@/services/community/types';
import { useAuthStore } from '@/store/useAuthStore';

export default function CommunityChatScreen() {
  const { L, en } = useL();
  const params = useLocalSearchParams<{ userId: string }>();
  const peerId = Array.isArray(params.userId) ? params.userId[0] ?? '' : params.userId ?? '';
  const token = useAuthStore((s) => s.session?.access_token ?? null);
  const currentUserId = useAuthStore((s) => s.user?.id ?? null);
  const [thread, setThread] = useState<CommunityThreadResponse | null>(null);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState('');

  const refresh = useCallback(async (showSpinner = false) => {
    if (!token || !peerId) return;
    if (showSpinner) setLoading(true);
    try {
      const data = await communityApi<CommunityThreadResponse>(`/api/community?view=thread&with=${encodeURIComponent(peerId)}`, { token });
      setThread(data);
      setNotice('');
    } catch (error) {
      setNotice(error instanceof CommunityApiError ? error.message : error instanceof Error ? error.message : L('Chưa tải được cuộc trò chuyện.', 'Could not load this conversation.'));
    } finally {
      if (showSpinner) setLoading(false);
    }
  }, [token, peerId, L]);

  useEffect(() => {
    const initial = setTimeout(() => void refresh(true), 0);
    const interval = setInterval(() => void refresh(false), 12_000);
    return () => { clearTimeout(initial); clearInterval(interval); };
  }, [refresh]);

  const send = async () => {
    const message = body.trim();
    if (!token || !message || sending) return;
    setSending(true);
    setNotice('');
    try {
      await communityApi('/api/community', { token, method: 'POST', body: { action: 'send_message', userId: peerId, body: message } });
      setBody('');
      await refresh(false);
    } catch (error) {
      setNotice(error instanceof CommunityApiError ? error.message : error instanceof Error ? error.message : L('Chưa gửi được tin nhắn.', 'Could not send your message.'));
    } finally { setSending(false); }
  };

  const report = async () => {
    if (!token) return;
    try {
      await communityApi('/api/community', { token, method: 'POST', body: { action: 'report', targetKind: 'user', targetId: peerId, reason: 'Tài khoản cần được kiểm tra bởi quản trị viên.' } });
      setNotice(L('Đã gửi báo cáo để quản trị viên xem xét.', 'Report sent for review.'));
    } catch (error) { setNotice(error instanceof Error ? error.message : L('Chưa gửi được báo cáo.', 'Could not submit your report.')); }
  };

  const block = async () => {
    if (!token) return;
    try {
      await communityApi('/api/community', { token, method: 'POST', body: { action: 'block', userId: peerId } });
      router.replace('/community' as never);
    } catch (error) { setNotice(error instanceof Error ? error.message : L('Chưa chặn được tài khoản.', 'Could not block this account.')); }
  };

  if (!token || !currentUserId) return <Screen><Card className="p-4"><Text className="font-sans text-body text-muted">{L('Đăng nhập để dùng tin nhắn cộng đồng.', 'Sign in to use community messages.')}</Text></Card></Screen>;

  return (
    <Screen>
      <View className="flex-row items-center gap-3">
        <Pressable accessibilityRole="button" accessibilityLabel={L('Quay lại cộng đồng', 'Back to community')} onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full bg-white">
          <Icon name="chevron-left" size={19} color="#233B35" />
        </Pressable>
        <View className="min-w-0 flex-1">
          <Text className="font-heavy text-sectionTitle text-ink" numberOfLines={1}>{thread?.peer.displayName ?? L('Tin nhắn', 'Messages')}</Text>
          <Text className="font-sans text-label text-muted">{L('Trò chuyện với bạn học', 'Chat with your study buddy')}</Text>
        </View>
        <Button size="sm" variant="outline" label={L('Báo cáo', 'Report')} onPress={() => void report()} />
        <Button size="sm" variant="outline" label={L('Chặn', 'Block')} onPress={() => void block()} />
      </View>

      {loading ? <ActivityIndicator className="mt-6" /> : null}
      {notice ? <Card className="mt-3 p-3"><Text className="font-sans text-label text-muted">{notice}</Text></Card> : null}
      <View className="mt-4 gap-2">
        {thread?.messages.map((message) => {
          const mine = message.senderId === currentUserId;
          return (
            <View key={message.id} className="flex-row" style={{ justifyContent: mine ? 'flex-end' : 'flex-start' }}>
              <View className="max-w-[88%] rounded-2xl px-3.5 py-2.5" style={{ backgroundColor: mine ? '#E8F2EC' : '#FFFFFF', borderWidth: 1, borderColor: mine ? '#D6E7DA' : '#E8E5DD' }}>
                <Text className="font-sans text-body text-ink" style={{ lineHeight: 22 }}>{message.body}</Text>
                <Text className="mt-1 font-sans text-label text-muted">{timeLabel(message.createdAt, en)}{mine && message.readAt ? ` · ${L('Đã xem', 'Seen')}` : ''}</Text>
              </View>
            </View>
          );
        })}
        {!loading && thread && thread.messages.length === 0 ? <Card className="p-5"><Text className="text-center font-sans text-body text-muted">{L('Hãy bắt đầu bằng một lời chào hoặc câu hỏi học tập.', 'Start with a hello or a study question.')}</Text></Card> : null}
      </View>

      <View className="mt-4 flex-row items-end gap-2 rounded-2xl border border-border bg-white p-2">
        <TextInput value={body} onChangeText={setBody} maxLength={1500} multiline textAlignVertical="center" placeholder={L('Nhắn tin…', 'Message…')} placeholderTextColor="#89928B" className="max-h-[140px] min-h-[42px] flex-1 px-2 py-2 font-sans text-body text-ink" onSubmitEditing={() => void send()} />
        <Button size="sm" iconLeft="arrow-up" label={sending ? L('Đang gửi', 'Sending') : L('Gửi', 'Send')} disabled={sending || !body.trim()} onPress={() => void send()} />
      </View>
      <Text className="mt-2 font-sans text-label text-muted">{L('Chỉ bạn bè đã chấp nhận lời mời mới nhắn tin được. Hãy báo cáo hoặc chặn nếu có nội dung không phù hợp.', 'Private messages are limited to accepted friends. Report or block anything inappropriate.')}</Text>
    </Screen>
  );
}

function timeLabel(value: string, en: boolean): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const locale = en ? 'en-US' : 'vi-VN';
  return `${date.toLocaleDateString(locale)} ${date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}`;
}
