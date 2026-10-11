import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Button, Card, Icon } from '@/components/ui';
import { Screen } from '@/components/layout/Screen';
import { useL } from '@/i18n/useL';
import { CommunityApiError, communityApi } from '@/services/community/types';
import { COMMUNITY_CATEGORIES } from '@/services/community/rules';
import type {
  CommunityCategory,
  CommunityComment,
  CommunityCommentsResponse,
  CommunityConnectionsResponse,
  CommunityFeedResponse,
  CommunityFriend,
  CommunityInboxResponse,
  CommunityPeopleResponse,
  CommunityPerson,
  CommunityPost,
  CommunityPostKind,
} from '@/services/community/types';
import { useAuthStore } from '@/store/useAuthStore';

type Tab = 'feed' | 'friends' | 'messages';

const categoryName = (category: CommunityCategory, L: (vi: string, en: string) => string) => ({
  vocabulary: L('Từ vựng', 'Vocabulary'),
  grammar: L('Ngữ pháp', 'Grammar'),
  speaking: 'Speaking',
  writing: 'Writing',
  reading: 'Reading',
  general: L('Học tập chung', 'General study'),
})[category];

export default function CommunityScreen() {
  const { L } = useL();
  const status = useAuthStore((s) => s.status);
  const token = useAuthStore((s) => s.session?.access_token ?? null);
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const [tab, setTab] = useState<Tab>('feed');

  if (status === 'loading') return <Screen><ActivityIndicator /></Screen>;
  if (!token || !userId) {
    return (
      <Screen>
        <Header L={L} />
        <Card className="mt-4 p-5">
          <Text className="font-heavy text-sectionTitle text-ink">{L('Gặp bạn học cùng mục tiêu', 'Meet learners with the same goals')}</Text>
          <Text className="mt-2 font-sans text-body text-muted">{L('Đăng nhập để đặt câu hỏi, kết bạn và nhắn tin riêng với bạn học.', 'Sign in to ask questions, connect with learners and send private messages.')}</Text>
          <Button className="mt-4 self-start" label={L('Đăng nhập', 'Sign in')} iconRight="arrow-right" onPress={() => router.push('/auth/sign-in' as never)} />
        </Card>
      </Screen>
    );
  }

  const tabs: { id: Tab; label: string; icon: 'chat' | 'heart' | 'mail' }[] = [
    { id: 'feed', label: L('Hỏi đáp', 'Study feed'), icon: 'chat' },
    { id: 'friends', label: L('Bạn bè', 'Friends'), icon: 'heart' },
    { id: 'messages', label: L('Tin nhắn', 'Messages'), icon: 'mail' },
  ];

  return (
    <Screen>
      <Header L={L} />
      <Text className="mt-1 font-sans text-body text-muted">{L('Cùng hỏi, giải thích và động viên nhau học tốt hơn.', 'Ask questions, share what works and help each other keep learning.')}</Text>
      <View className="mt-5 flex-row flex-wrap gap-2">
        {tabs.map((item) => {
          const selected = tab === item.id;
          return (
            <Pressable key={item.id} accessibilityRole="tab" accessibilityState={{ selected }} onPress={() => setTab(item.id)}
              className="flex-row items-center gap-2 rounded-pill px-4 py-2.5"
              style={{ backgroundColor: selected ? '#233B35' : '#FFFFFF', borderWidth: 1, borderColor: selected ? '#233B35' : '#E6E2D9' }}>
              <Icon name={item.icon} size={16} color={selected ? '#FFFFFF' : '#647067'} />
              <Text className="font-semi text-label" style={{ color: selected ? '#FFFFFF' : '#44524B' }}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
      {tab === 'feed' ? <FeedPane token={token} userId={userId} /> : null}
      {tab === 'friends' ? <FriendsPane token={token} /> : null}
      {tab === 'messages' ? <InboxPane token={token} /> : null}
    </Screen>
  );
}

function Header({ L }: { L: (vi: string, en: string) => string }) {
  return (
    <View className="flex-row items-center gap-3">
      <View className="h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: '#E9F1E9' }}>
        <Icon name="chat" size={23} color="#39705B" />
      </View>
      <View className="min-w-0 flex-1">
        <Text className="font-heavy text-pageTitle text-ink">{L('Cộng đồng học tập', 'Study community')}</Text>
        <Text className="font-sans text-label text-muted">{L('Chia sẻ điều bạn đang học', 'Learn better together')}</Text>
      </View>
    </View>
  );
}

function FeedPane({ token, userId }: { token: string; userId: string }) {
  const { L } = useL();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [kind, setKind] = useState<CommunityPostKind>('question');
  const [category, setCategory] = useState<CommunityCategory>('speaking');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const draft = useLocalSearchParams<{ title?: string; body?: string }>();

  useEffect(() => {
    if (typeof draft.title === 'string') setTitle(draft.title);
    if (typeof draft.body === 'string') setBody(draft.body);
  }, [draft.title, draft.body]);

  const refresh = useCallback(async () => {
    setError('');
    try {
      const data = await communityApi<CommunityFeedResponse>('/api/community?view=feed', { token });
      setPosts(data.posts);
    } catch (err) {
      setError(errorText(err, L));
    } finally {
      setLoading(false);
    }
  }, [token, L]);
  useEffect(() => {
    const timer = setTimeout(() => void refresh(), 0);
    return () => clearTimeout(timer);
  }, [refresh]);

  const publish = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await communityApi('/api/community', { token, method: 'POST', body: { action: 'create_post', kind, category, title, body } });
      setTitle('');
      setBody('');
      await refresh();
    } catch (err) {
      setError(errorText(err, L));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View className="mt-4">
      <Card className="p-4">
        <Text className="font-heavy text-bodyLg text-ink">{kind === 'question' ? L('Bạn đang cần giải đáp điều gì?', 'What would you like help with?') : L('Chia sẻ điều bạn vừa học', 'Share something you learned')}</Text>
        <View className="mt-3 flex-row gap-2">
          <Choice label={L('Đặt câu hỏi', 'Ask')} active={kind === 'question'} onPress={() => setKind('question')} />
          <Choice label={L('Chia sẻ', 'Share')} active={kind === 'share'} onPress={() => setKind('share')} />
        </View>
        <TextInput value={title} onChangeText={setTitle} maxLength={160} placeholder={L('Tiêu đề ngắn', 'A short title')} placeholderTextColor="#89928B" className="mt-3 rounded-xl border border-border bg-white px-3 py-3 font-semi text-body text-ink" />
        <TextInput value={body} onChangeText={setBody} maxLength={3000} multiline textAlignVertical="top" placeholder={L('Viết câu hỏi hoặc kinh nghiệm học của bạn…', 'Write your question or a study tip…')} placeholderTextColor="#89928B" className="mt-2 min-h-[105px] rounded-xl border border-border bg-white px-3 py-3 font-sans text-body text-ink" />
        <View className="mt-3 flex-row flex-wrap gap-2">
          {COMMUNITY_CATEGORIES.map((item) => <Choice key={item} label={categoryName(item, L)} active={category === item} onPress={() => setCategory(item)} />)}
        </View>
        {error ? <Text className="mt-3 font-semi text-label" style={{ color: '#B42318' }}>{error}</Text> : null}
        <Button className="mt-4 self-start" label={busy ? L('Đang đăng…', 'Posting…') : kind === 'question' ? L('Đăng câu hỏi', 'Post question') : L('Chia sẻ với cộng đồng', 'Share with learners')} iconLeft="arrow-up" disabled={busy || title.trim().length < 3 || body.trim().length < 3} onPress={() => void publish()} />
      </Card>

      <View className="mt-5 flex-row items-center justify-between">
        <Text className="font-heavy text-sectionTitle text-ink">{L('Trao đổi gần đây', 'Recent discussions')}</Text>
        <Pressable accessibilityRole="button" onPress={() => void refresh()}><Text className="font-semi text-label" style={{ color: '#39705B' }}>{L('Làm mới', 'Refresh')}</Text></Pressable>
      </View>
      {loading ? <ActivityIndicator className="mt-6" /> : posts.length ? posts.map((post) => (
        <PostCard key={post.id} post={post} token={token} userId={userId} onChanged={() => void refresh()} />
      )) : <Card className="mt-3 p-5"><Text className="font-semi text-body text-muted">{L('Chưa có bài nào. Bạn có thể mở đầu bằng một câu hỏi IELTS.', 'No posts yet. Start with an IELTS question.')}</Text></Card>}
    </View>
  );
}

function PostCard({ post, token, userId, onChanged }: { post: CommunityPost; token: string; userId: string; onChanged: () => void }) {
  const { L } = useL();
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const isMine = post.authorId === userId;

  const toggleComments = async () => {
    if (!open) {
      try {
        const data = await communityApi<CommunityCommentsResponse>(`/api/community?view=comments&postId=${encodeURIComponent(post.id)}`, { token });
        setComments(data.comments);
      } catch (err) { setNotice(errorText(err, L)); }
    }
    setOpen((v) => !v);
  };

  const submitReply = async () => {
    if (busy || reply.trim().length < 1) return;
    setBusy(true);
    try {
      await communityApi('/api/community', { token, method: 'POST', body: { action: 'comment', postId: post.id, body: reply } });
      setReply('');
      const data = await communityApi<CommunityCommentsResponse>(`/api/community?view=comments&postId=${encodeURIComponent(post.id)}`, { token });
      setComments(data.comments);
      onChanged();
    } catch (err) { setNotice(errorText(err, L)); }
    finally { setBusy(false); }
  };

  const report = async () => {
    setBusy(true);
    try {
      await communityApi('/api/community', { token, method: 'POST', body: { action: 'report', targetKind: 'post', targetId: post.id, reason: 'Nội dung cần được kiểm tra bởi quản trị viên.' } });
      setNotice(L('Đã gửi báo cáo để quản trị viên xem xét.', 'Report sent for review.'));
    } catch (err) { setNotice(errorText(err, L)); }
    finally { setBusy(false); }
  };

  const block = async () => {
    setBusy(true);
    try {
      await communityApi('/api/community', { token, method: 'POST', body: { action: 'block', userId: post.authorId } });
      onChanged();
    } catch (err) { setNotice(errorText(err, L)); }
    finally { setBusy(false); }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await communityApi('/api/community', { token, method: 'DELETE', body: { kind: 'post', id: post.id } });
      onChanged();
    } catch (err) { setNotice(errorText(err, L)); }
    finally { setBusy(false); }
  };

  const confirmRemove = () => Alert.alert(
    L('Xoá bài viết?', 'Delete this post?'),
    L('Bài viết và toàn bộ bình luận sẽ bị xoá vĩnh viễn.', 'This post and all of its replies will be permanently deleted.'),
    [
      { text: L('Huỷ', 'Cancel'), style: 'cancel' },
      { text: L('Xoá bài', 'Delete post'), style: 'destructive', onPress: () => void remove() },
    ],
  );

  return (
    <Card className="mt-3 p-4">
      <View className="flex-row items-center gap-2">
        <Avatar name={post.authorName} />
        <View className="min-w-0 flex-1">
          <Text className="font-semi text-label text-ink" numberOfLines={1}>{post.authorName}</Text>
          <Text className="font-sans text-label text-muted">{categoryName(post.category, L)} · {relativeTime(post.createdAt, L)}</Text>
        </View>
        <Text className="rounded-pill px-2.5 py-1 font-semi text-label" style={{ backgroundColor: post.kind === 'question' ? '#E8F2EC' : '#F5F0E4', color: '#39705B' }}>{post.kind === 'question' ? L('Câu hỏi', 'Question') : L('Chia sẻ', 'Share')}</Text>
      </View>
      <Text className="mt-3 font-heavy text-bodyLg text-ink">{post.title}</Text>
      <Text className="mt-1 font-sans text-body text-ink" style={{ lineHeight: 23 }}>{post.body}</Text>
      <View className="mt-3 flex-row flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" iconLeft="chat" label={`${L('Bình luận', 'Reply')} · ${post.commentCount}`} onPress={() => void toggleComments()} />
        {isMine ? <Button variant="outline" size="sm" label={L('Xoá bài', 'Delete')} onPress={confirmRemove} /> : <>
          <Button variant="outline" size="sm" label={L('Báo cáo', 'Report')} onPress={() => void report()} />
          <Button variant="outline" size="sm" label={L('Chặn người đăng', 'Block author')} onPress={() => void block()} />
        </>}
      </View>
      {notice ? <Text className="mt-2 font-sans text-label text-muted">{notice}</Text> : null}
      {open ? (
        <View className="mt-3 border-t border-border pt-3">
          {comments.map((comment) => <View key={comment.id} className="mb-3 flex-row gap-2"><Avatar name={comment.authorName} small /><View className="min-w-0 flex-1 rounded-xl px-3 py-2" style={{ backgroundColor: '#F7F6F2' }}><Text className="font-semi text-label text-ink">{comment.authorName}</Text><Text className="mt-0.5 font-sans text-body text-ink">{comment.body}</Text></View></View>)}
          {!comments.length ? <Text className="mb-2 font-sans text-label text-muted">{L('Chưa có bình luận. Hãy bắt đầu trao đổi.', 'No replies yet. Start the conversation.')}</Text> : null}
          <View className="flex-row items-end gap-2">
            <TextInput value={reply} onChangeText={setReply} maxLength={1500} multiline placeholder={L('Viết phản hồi…', 'Write a reply…')} placeholderTextColor="#89928B" className="min-h-[42px] flex-1 rounded-xl border border-border bg-white px-3 py-2 font-sans text-body text-ink" />
            <Button size="sm" iconLeft="arrow-up" label={busy ? L('Đang gửi', 'Sending') : L('Gửi', 'Send')} disabled={busy || !reply.trim()} onPress={() => void submitReply()} />
          </View>
        </View>
      ) : null}
    </Card>
  );
}

function FriendsPane({ token }: { token: string }) {
  const { L } = useL();
  const [connections, setConnections] = useState<CommunityConnectionsResponse>({ friends: [], incoming: [], outgoing: [], blocked: [] });
  const [query, setQuery] = useState('');
  const [people, setPeople] = useState<CommunityPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [notice, setNotice] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    try { setConnections(await communityApi<CommunityConnectionsResponse>('/api/community?view=connections', { token })); }
    catch (err) { setNotice(errorText(err, L)); }
    finally { setLoading(false); }
  }, [token, L]);
  useEffect(() => {
    const timer = setTimeout(() => void refresh(), 0);
    return () => clearTimeout(timer);
  }, [refresh]);

  const search = async () => {
    setNotice('');
    if (query.trim().length < 2) { setNotice(L('Nhập ít nhất 2 ký tự tên hiển thị.', 'Enter at least 2 characters of a display name.')); return; }
    setLoading(true);
    try {
      const data = await communityApi<CommunityPeopleResponse>(`/api/community?view=people&q=${encodeURIComponent(query.trim())}`, { token });
      setPeople(data.people);
    } catch (err) { setNotice(errorText(err, L)); }
    finally { setLoading(false); }
  };

  const action = async (userId: string, body: Record<string, unknown>) => {
    setBusyId(userId);
    setNotice('');
    try {
      await communityApi('/api/community', { token, method: 'POST', body: { userId, ...body } });
      await refresh();
      if (query.trim().length >= 2) await search();
    } catch (err) { setNotice(errorText(err, L)); }
    finally { setBusyId(''); }
  };

  return (
    <View className="mt-4 gap-3">
      <Card className="p-4">
        <Text className="font-heavy text-bodyLg text-ink">{L('Tìm bạn học', 'Find a study buddy')}</Text>
        <Text className="mt-1 font-sans text-label text-muted">{L('Tìm bằng tên hiển thị trong ReadUp. Email không được công khai.', 'Search by ReadUp display name. Email addresses are never shown.')}</Text>
        <View className="mt-3 flex-row items-center gap-2">
          <TextInput value={query} onChangeText={setQuery} onSubmitEditing={() => void search()} maxLength={60} placeholder={L('Tên hiển thị', 'Display name')} placeholderTextColor="#89928B" className="min-w-0 flex-1 rounded-xl border border-border bg-white px-3 py-3 font-sans text-body text-ink" />
          <Button iconLeft="search" label={L('Tìm', 'Search')} onPress={() => void search()} />
        </View>
        {notice ? <Text className="mt-2 font-sans text-label text-muted">{notice}</Text> : null}
        {people.map((person) => <PersonRow key={person.id} person={person} busy={busyId === person.id} L={L} onPress={() => {
          if (person.relation === 'none') void action(person.id, { action: 'friend_request' });
          else if (person.relation === 'incoming') void action(person.id, { action: 'respond_friend_request', accept: true });
          else if (person.relation === 'friend') router.push(`/community/chat/${person.id}` as never);
          else if (person.relation === 'blocked_by_me') void action(person.id, { action: 'unblock' });
        }} />)}
      </Card>

      {loading ? <ActivityIndicator /> : null}
      {connections.incoming.length ? <Card className="p-4">
        <Text className="font-heavy text-bodyLg text-ink">{L('Lời mời kết bạn', 'Friend requests')} · {connections.incoming.length}</Text>
        {connections.incoming.map((request) => <View key={request.id} className="mt-3 flex-row items-center gap-2"><Avatar name={request.displayName} /><Text className="min-w-0 flex-1 font-semi text-body text-ink" numberOfLines={1}>{request.displayName}</Text><Button size="sm" label={L('Chấp nhận', 'Accept')} onPress={() => void action(request.userId, { action: 'respond_friend_request', accept: true })} /><Button variant="outline" size="sm" label={L('Bỏ qua', 'Ignore')} onPress={() => void action(request.userId, { action: 'respond_friend_request', accept: false })} /></View>)}
      </Card> : null}
      <Card className="p-4">
        <Text className="font-heavy text-bodyLg text-ink">{L('Bạn bè', 'Friends')} · {connections.friends.length}</Text>
        {connections.friends.length ? connections.friends.map((friend) => <FriendRow key={friend.id} friend={friend} L={L} />) : <Text className="mt-2 font-sans text-body text-muted">{L('Tìm tên bạn học phía trên để gửi lời mời đầu tiên.', 'Search for a learner above to send your first request.')}</Text>}
      </Card>
      {connections.outgoing.length ? <Card className="p-4"><Text className="font-heavy text-bodyLg text-ink">{L('Đã gửi lời mời', 'Sent requests')}</Text>{connections.outgoing.map((request) => <View key={request.id} className="mt-3 flex-row items-center gap-2"><Avatar name={request.displayName} /><Text className="flex-1 font-semi text-body text-ink">{request.displayName}</Text><Text className="font-sans text-label text-muted">{L('Đang chờ', 'Pending')}</Text></View>)}</Card> : null}
      {connections.blocked.length ? <Card className="p-4"><Text className="font-heavy text-bodyLg text-ink">{L('Tài khoản đã chặn', 'Blocked accounts')}</Text>{connections.blocked.map((friend) => <View key={friend.id} className="mt-3 flex-row items-center gap-2"><Avatar name={friend.displayName} /><Text className="flex-1 font-semi text-body text-ink">{friend.displayName}</Text><Button size="sm" variant="outline" label={L('Bỏ chặn', 'Unblock')} onPress={() => void action(friend.id, { action: 'unblock' })} /></View>)}</Card> : null}
    </View>
  );
}

function PersonRow({ person, busy, L, onPress }: { person: CommunityPerson; busy: boolean; L: (vi: string, en: string) => string; onPress: () => void }) {
  const label = person.relation === 'none' ? L('Kết bạn', 'Add friend')
    : person.relation === 'incoming' ? L('Chấp nhận', 'Accept')
      : person.relation === 'outgoing' ? L('Đã gửi', 'Sent')
        : person.relation === 'friend' ? L('Nhắn tin', 'Message')
          : person.relation === 'blocked_by_me' ? L('Bỏ chặn', 'Unblock')
            : L('Không khả dụng', 'Unavailable');
  const disabled = busy || person.relation === 'outgoing' || person.relation === 'blocked_me';
  return <View className="mt-3 flex-row items-center gap-2"><Avatar name={person.displayName} /><Text className="min-w-0 flex-1 font-semi text-body text-ink" numberOfLines={1}>{person.displayName}</Text><Button size="sm" variant={person.relation === 'none' || person.relation === 'incoming' ? 'brand' : 'outline'} label={busy ? L('Đang xử lý', 'Please wait') : label} disabled={disabled} onPress={onPress} /></View>;
}

function FriendRow({ friend, L }: { friend: CommunityFriend; L: (vi: string, en: string) => string }) {
  return <Pressable accessibilityRole="button" onPress={() => router.push(`/community/chat/${friend.id}` as never)} className="mt-3 flex-row items-center gap-2"><Avatar name={friend.displayName} /><Text className="min-w-0 flex-1 font-semi text-body text-ink" numberOfLines={1}>{friend.displayName}</Text><Text className="font-semi text-label" style={{ color: '#39705B' }}>{L('Nhắn tin →', 'Message →')}</Text></Pressable>;
}

function InboxPane({ token }: { token: string }) {
  const { L } = useL();
  const [inbox, setInbox] = useState<CommunityInboxResponse['inbox']>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const refresh = useCallback(async () => {
    try { setInbox((await communityApi<CommunityInboxResponse>('/api/community?view=inbox', { token })).inbox); setError(''); }
    catch (err) { setError(errorText(err, L)); }
    finally { setLoading(false); }
  }, [token, L]);
  useEffect(() => {
    const timer = setTimeout(() => void refresh(), 0);
    return () => clearTimeout(timer);
  }, [refresh]);
  return <View className="mt-4">
    <View className="mb-3 flex-row items-center justify-between"><Text className="font-heavy text-sectionTitle text-ink">{L('Tin nhắn riêng', 'Private messages')}</Text><Pressable accessibilityRole="button" onPress={() => void refresh()}><Text className="font-semi text-label" style={{ color: '#39705B' }}>{L('Làm mới', 'Refresh')}</Text></Pressable></View>
    {loading ? <ActivityIndicator /> : null}
    {error ? <Card className="p-4"><Text className="font-sans text-body text-muted">{error}</Text></Card> : null}
    {!loading && !inbox.length ? <Card className="p-5"><Text className="font-semi text-body text-muted">{L('Kết bạn để bắt đầu một cuộc trò chuyện riêng.', 'Connect with a learner to start a private conversation.')}</Text></Card> : null}
    {inbox.map((item) => <Pressable key={item.id} accessibilityRole="button" onPress={() => router.push(`/community/chat/${item.id}` as never)} className="mt-2 rounded-2xl border border-border bg-white p-4"><View className="flex-row items-center gap-3"><Avatar name={item.displayName} /><View className="min-w-0 flex-1"><Text className="font-heavy text-body text-ink" numberOfLines={1}>{item.displayName}</Text><Text className="mt-0.5 font-sans text-label text-muted" numberOfLines={1}>{item.lastMessage ?? L('Bắt đầu trò chuyện', 'Start a conversation')}</Text></View>{item.unreadCount ? <Text className="rounded-pill px-2 py-1 font-heavy text-label text-white" style={{ backgroundColor: '#39705B' }}>{item.unreadCount}</Text> : null}</View></Pressable>)}
  </View>;
}

function Choice({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ selected: active }} onPress={onPress} className="rounded-pill px-3 py-2" style={{ backgroundColor: active ? '#E8F2EC' : '#F7F6F2', borderWidth: 1, borderColor: active ? '#93B7A0' : '#ECE9E2' }}><Text className="font-semi text-label" style={{ color: active ? '#285844' : '#59645D' }}>{label}</Text></Pressable>;
}

export function Avatar({ name, small = false }: { name: string; small?: boolean }) {
  return <View className="items-center justify-center rounded-full" style={{ width: small ? 30 : 38, height: small ? 30 : 38, backgroundColor: '#E9F1E9' }}><Text className="font-heavy" style={{ fontSize: small ? 12 : 15, color: '#39705B' }}>{name.trim().charAt(0).toUpperCase() || '?'}</Text></View>;
}

export function errorText(error: unknown, L: (vi: string, en: string) => string): string {
  if (error instanceof CommunityApiError) return error.message;
  return error instanceof Error ? error.message : L('Đã xảy ra lỗi. Thử lại nhé.', 'Something went wrong. Please try again.');
}

export function relativeTime(value: string, L: (vi: string, en: string) => string): string {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60_000));
  if (minutes < 1) return L('vừa xong', 'just now');
  if (minutes < 60) return L(`${minutes} phút trước`, `${minutes}m ago`);
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return L(`${hours} giờ trước`, `${hours}h ago`);
  const days = Math.floor(hours / 24);
  return L(`${days} ngày trước`, `${days}d ago`);
}
