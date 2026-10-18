import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View, useWindowDimensions } from 'react-native';

import { Screen } from '@/components/layout/Screen';
import { Appear } from '@/components/motion/Motion';
import { Button, Icon } from '@/components/ui';
import { useL } from '@/i18n/useL';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * YÊU CẦU TÍNH NĂNG: người học gửi ý tưởng cho app, người khác bấm "Tôi cũng muốn"
 * để đẩy ý tưởng lên đầu. Dữ liệu qua app/api/feature-requests+api.ts.
 */

type Sort = 'votes' | 'new' | 'mine';
type Status = 'new' | 'reviewing' | 'planned' | 'doing' | 'done';
type Idea = {
  id: string;
  title: string;
  body: string;
  status: Status;
  createdAt: string;
  votes: number;
  voted: boolean;
  isMine: boolean;
  authorName: string;
};

const INK = '#2B2118';
const CREAM = '#FFF5F8';

const STATUS: Record<Status, { vi: string; en: string; bg: string; fg: string }> = {
  new: { vi: 'Mới', en: 'New', bg: '#EDE9FE', fg: '#5B21B6' },
  reviewing: { vi: 'Đang xem xét', en: 'Reviewing', bg: '#DBEAFE', fg: '#1E40AF' },
  planned: { vi: 'Đã lên kế hoạch', en: 'Planned', bg: '#F3E8FF', fg: '#7E22CE' },
  doing: { vi: 'Đang làm', en: 'In progress', bg: '#FEF3C7', fg: '#B45309' },
  done: { vi: 'Đã xong', en: 'Done', bg: '#DCFCE7', fg: '#15803D' },
};

const card = {
  backgroundColor: '#FFFFFF',
  borderWidth: 2,
  borderColor: INK,
  borderRadius: 20,
  boxShadow: `0 5px 0 ${INK}`,
} as object;

export default function FeatureRequests() {
  const { L, en } = useL();
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const token = useAuthStore((s) => s.session?.access_token ?? null);
  const [sort, setSort] = useState<Sort>('votes');
  const [items, setItems] = useState<Idea[] | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [error, setError] = useState<{ text: string; setup: boolean } | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);

  const call = useCallback(
    async (path: string, init?: { method?: 'GET' | 'POST'; body?: unknown }) => {
      const headers: Record<string, string> = {};
      if (token) headers.authorization = `Bearer ${token}`;
      if (init?.body !== undefined) headers['content-type'] = 'application/json';
      const res = await fetch(path, { method: init?.method ?? 'GET', headers, body: init?.body === undefined ? undefined : JSON.stringify(init.body) });
      const data = (await res.json().catch(() => ({}))) as { error?: string; setupNeeded?: boolean } & Record<string, unknown>;
      if (!res.ok) throw Object.assign(new Error(data.error ?? L('Không kết nối được máy chủ.', 'Could not reach the server.')), { setup: !!data.setupNeeded });
      return data;
    },
    [token, L],
  );

  const load = useCallback(async () => {
    try {
      const data = await call(`/api/feature-requests?sort=${sort}`);
      setItems((data.items as Idea[]) ?? []);
      setSignedIn(!!data.signedIn);
      setError(null);
    } catch (e) {
      const err = e as Error & { setup?: boolean };
      setError({ text: err.message, setup: !!err.setup });
      setItems([]);
    }
  }, [call, sort]);

  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, [load]);

  const send = async () => {
    if (title.trim().length < 3 || busy) return;
    setBusy(true);
    try {
      await call('/api/feature-requests', { method: 'POST', body: { action: 'create', title: title.trim(), body: body.trim() } });
      setTitle('');
      setBody('');
      setFormOpen(false);
      setSort('new');
      await load();
    } catch (e) {
      setError({ text: (e as Error).message, setup: !!(e as Error & { setup?: boolean }).setup });
    } finally {
      setBusy(false);
    }
  };

  // Bấm "Tôi cũng muốn" cập nhật ngay trên màn, không chờ máy chủ.
  const toggleVote = async (id: string) => {
    setItems((list) => (list ?? []).map((i) => (i.id === id ? { ...i, voted: !i.voted, votes: i.votes + (i.voted ? -1 : 1) } : i)));
    try {
      await call('/api/feature-requests', { method: 'POST', body: { action: 'vote', id } });
    } catch {
      void load();
    }
  };

  const sorted = useMemo(() => items ?? [], [items]);
  const tabs: { key: Sort; label: string; show: boolean }[] = [
    { key: 'votes', label: L('Nhiều bình chọn', 'Most voted'), show: true },
    { key: 'new', label: L('Mới nhất', 'Newest'), show: true },
    { key: 'mine', label: L('Của tôi', 'Mine'), show: signedIn },
  ];

  return (
    <Screen>
      <View style={{ backgroundColor: CREAM, borderRadius: 26, borderWidth: 2, borderColor: INK, padding: 22, boxShadow: `0 5px 0 ${INK}`, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 14 } as object}>
        <View style={{ flexShrink: 1, minWidth: 0 }}>
          <Text className="font-heavy" style={{ fontSize: 30, color: INK }}>{L('Yêu cầu tính năng', 'Feature requests')}</Text>
          <Text className="font-sans" style={{ fontSize: 15, color: INK, marginTop: 4 }}>
            {L('Ý tưởng nhiều bình chọn nhất được ưu tiên làm trước.', 'The most-voted ideas get built first.')}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => setFormOpen((v) => !v)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 999, backgroundColor: INK, boxShadow: '0 4px 0 #8A6A2E' } as object}
        >
          <Icon name={formOpen ? 'close' : 'plus'} size={16} color="#FFFFFF" />
          <Text className="font-heavy" style={{ color: '#FFFFFF', fontSize: 15 }}>{formOpen ? L('Đóng', 'Close') : L('Gửi ý tưởng', 'Send an idea')}</Text>
        </Pressable>
      </View>

      {formOpen ? (
        <View style={{ ...card, marginTop: 16, padding: 18, gap: 10 } as object}>
          <Text className="font-heavy" style={{ fontSize: 18, color: INK }}>{L('Bạn muốn app có gì?', 'What should the app have?')}</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            maxLength={120}
            placeholder={L('Tiêu đề ngắn, ví dụ: Luyện nói theo cặp', 'Short title, e.g. Speaking practice in pairs')}
            placeholderTextColor="#8A7F72"
            style={{ borderWidth: 2, borderColor: INK, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, fontSize: 16, color: INK, backgroundColor: CREAM } as object}
          />
          <TextInput
            value={body}
            onChangeText={setBody}
            maxLength={1500}
            multiline
            placeholder={L('Mô tả: bạn muốn dùng nó như thế nào?', 'Describe how you would use it')}
            placeholderTextColor="#8A7F72"
            style={{ borderWidth: 2, borderColor: INK, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, minHeight: 90, textAlignVertical: 'top', color: INK, backgroundColor: CREAM } as object}
          />
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
            <Button label={busy ? L('Đang gửi…', 'Sending…') : L('Gửi ý tưởng', 'Send')} disabled={busy || title.trim().length < 3} onPress={() => void send()} />
          </View>
          {!token ? <Text className="font-sans" style={{ fontSize: 13, color: '#8A7F72' }}>{L('Đăng nhập để gửi ý tưởng.', 'Sign in to send an idea.')}</Text> : null}
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 18 }}>
        {tabs.filter((t) => t.show).map((t) => {
          const on = sort === t.key;
          return (
            <Pressable
              key={t.key}
              accessibilityRole="button"
              aria-selected={on}
              onPress={() => setSort(t.key)}
              style={{ paddingHorizontal: 16, paddingVertical: 9, borderRadius: 999, borderWidth: 2, borderColor: INK, backgroundColor: on ? INK : '#FFFFFF' } as object}
            >
              <Text className="font-strong" style={{ color: on ? '#FFFFFF' : INK, fontSize: 14 }}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {error ? (
        <View style={{ ...card, marginTop: 16, padding: 16, backgroundColor: '#FFF4D7' } as object}>
          <Text className="font-strong" style={{ color: INK, fontSize: 15 }}>
            {error.setup
              ? L('Mục này chưa bật trên máy chủ. Cần áp dụng migration supabase/migrations/20261018000100_feature_requests.sql.', 'Not enabled on the server yet. Apply supabase/migrations/20261018000100_feature_requests.sql.')
              : error.text}
          </Text>
        </View>
      ) : null}

      {items === null ? (
        <View style={{ paddingVertical: 40, alignItems: 'center' }}>
          <ActivityIndicator color={INK} />
        </View>
      ) : sorted.length === 0 && !error ? (
        <Text className="font-sans" style={{ marginTop: 24, fontSize: 16, color: INK }}>
          {sort === 'mine' ? L('Bạn chưa gửi ý tưởng nào.', "You haven't sent an idea yet.") : L('Chưa có ý tưởng nào. Hãy là người đầu tiên!', 'No ideas yet. Be the first!')}
        </Text>
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 18, marginTop: 18 }}>
          {sorted.map((idea, i) => {
            const st = STATUS[idea.status] ?? STATUS.new;
            return (
              <Appear key={idea.id} index={i} style={{ width: wide ? '48%' : '100%' } as object}>
                <View style={{ ...card, padding: 18, gap: 10, minHeight: 200 } as object}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: st.bg }}>
                      <Text className="font-strong" style={{ color: st.fg, fontSize: 12 }}>{en ? st.en : st.vi}</Text>
                    </View>
                    {idea.isMine ? <Text className="font-strong" style={{ color: '#8A7F72', fontSize: 12 }}>{L('Của bạn', 'Yours')}</Text> : null}
                  </View>
                  <Text className="font-heavy" style={{ fontSize: 18, lineHeight: 24, color: INK }}>{idea.title}</Text>
                  {idea.body ? (
                    <Text className="font-sans" numberOfLines={3} style={{ fontSize: 15, lineHeight: 22, color: '#4B4036' }}>{idea.body}</Text>
                  ) : null}
                  <Text className="font-sans" style={{ fontSize: 12, color: '#8A7F72', marginTop: 'auto' as never }}>
                    {idea.authorName} · {new Date(idea.createdAt).toLocaleDateString(en ? 'en-GB' : 'vi-VN')}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected: idea.voted }}
                    onPress={() => void toggleVote(idea.id)}
                    disabled={!token}
                    style={({ pressed }: { pressed: boolean }) => ({
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 10,
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      borderRadius: 14,
                      borderWidth: 2,
                      borderColor: INK,
                      backgroundColor: idea.voted ? '#F5C518' : '#FFFFFF',
                      boxShadow: pressed ? 'none' : `0 3px 0 ${INK}`,
                      transform: [{ translateY: pressed ? 3 : 0 }],
                      opacity: token ? 1 : 0.6,
                    }) as object}
                  >
                    <Icon name="arrow-up" size={16} color={INK} strokeWidth={2.6} />
                    <Text className="font-heavy" style={{ fontSize: 16, color: INK }}>{idea.votes}</Text>
                    <Text className="font-strong" style={{ fontSize: 14, color: INK, flexShrink: 1 }}>
                      {idea.voted ? L('Đã bình chọn', 'Voted') : L('Tôi cũng muốn tính năng này!', 'I want this too!')}
                    </Text>
                  </Pressable>
                </View>
              </Appear>
            );
          })}
        </View>
      )}
    </Screen>
  );
}
