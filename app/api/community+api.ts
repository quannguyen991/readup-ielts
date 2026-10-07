import type { SupabaseClient } from '@supabase/supabase-js';

import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { msg } from '@/lib/server-locale';
import { displayableName } from '@/services/gamification/display-name';
import { canonicalFriendPair, cleanCommunityText, validMessageBody, validPostInput } from '@/services/community/rules';
import type { CommunityFriendship, CommunityPostRow } from '@/types/database';

type Db = SupabaseClient;
type Who = { db: Db; userId: string };
type ProfileLite = { id: string; display_name: string | null; avatar_url: string | null };
type Friendship = CommunityFriendship;
type Block = { blocker_id: string; blocked_id: string };
type Message = { id: string; sender_id: string; recipient_id: string; body: string; created_at: string; read_at: string | null };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function fail(request: Request, status: number, vi: string, en: string, setupNeeded = false): Response {
  return Response.json({ error: msg(request, vi, en), ...(setupNeeded ? { setupNeeded: true } : {}) }, { status });
}

function dbFail(request: Request, error: { code?: string; message?: string }): Response {
  if (error.code === '42P01' || error.code === 'PGRST205' || /does not exist|schema cache/i.test(error.message ?? '')) {
    return fail(request, 503, 'Cộng đồng chưa được bật trên máy chủ. Cần áp dụng migration Supabase mới.', 'Community is not enabled on the server yet. Apply the new Supabase migration.', true);
  }
  return fail(request, 500, 'Chưa tải được dữ liệu cộng đồng. Thử lại sau.', 'Could not load community data. Please try again.');
}

async function identify(request: Request): Promise<{ who: Who } | { error: Response }> {
  const header = request.headers.get('authorization') ?? '';
  const token = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : '';
  if (!token) return { error: fail(request, 401, 'Đăng nhập để vào cộng đồng.', 'Sign in to use the community.') };
  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin.auth.getUser(token);
    if (error || !data.user) return { error: fail(request, 401, 'Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.', 'Your session expired. Please sign in again.') };
    return { who: { db: admin as unknown as Db, userId: data.user.id } };
  } catch {
    return { error: fail(request, 503, 'Cộng đồng chưa được cấu hình trên máy chủ.', 'Community is not configured on the server yet.', true) };
  }
}

async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const value = await request.json();
    return value && typeof value === 'object' ? value as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

function person(profile: ProfileLite) {
  return {
    id: profile.id,
    displayName: displayableName(profile.display_name) ?? 'Bạn học',
    avatarUrl: profile.avatar_url,
  };
}

async function profiles(db: Db, ids: readonly string[]): Promise<Map<string, ProfileLite>> {
  const unique = [...new Set(ids)].filter((id) => UUID.test(id));
  const out = new Map<string, ProfileLite>();
  for (let i = 0; i < unique.length; i += 100) {
    const { data } = await db.from('profiles').select('id, display_name, avatar_url').in('id', unique.slice(i, i + 100));
    for (const row of (data ?? []) as ProfileLite[]) out.set(row.id, row);
  }
  return out;
}

async function friendshipsFor(db: Db, userId: string): Promise<Friendship[] | null> {
  const { data, error } = await db.from('community_friendships').select('*')
    .or(`user_low_id.eq.${userId},user_high_id.eq.${userId}`)
    .order('updated_at', { ascending: false }).limit(500);
  if (error) return null;
  return (data ?? []) as Friendship[];
}

async function blocksFor(db: Db, userId: string): Promise<Block[] | null> {
  const { data, error } = await db.from('community_blocks').select('blocker_id, blocked_id')
    .or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`).limit(500);
  if (error) return null;
  return (data ?? []) as Block[];
}

function otherUser(row: Friendship, userId: string): string {
  return row.user_low_id === userId ? row.user_high_id : row.user_low_id;
}

function isBlocked(blocks: readonly Block[], a: string, b: string): boolean {
  return blocks.some((row) => (row.blocker_id === a && row.blocked_id === b) || (row.blocker_id === b && row.blocked_id === a));
}

async function relationship(db: Db, a: string, b: string): Promise<Friendship | null> {
  const pair = canonicalFriendPair(a, b);
  if (!pair) return null;
  const { data, error } = await db.from('community_friendships').select('*')
    .eq('user_low_id', pair.low).eq('user_high_id', pair.high).maybeSingle();
  if (error) throw error;
  return data as Friendship | null;
}

async function hasBlock(db: Db, a: string, b: string): Promise<boolean> {
  const { data: first, error: firstError } = await db.from('community_blocks').select('blocker_id').eq('blocker_id', a).eq('blocked_id', b).maybeSingle();
  if (firstError) throw firstError;
  if (first) return true;
  const { data: second, error: secondError } = await db.from('community_blocks').select('blocker_id').eq('blocker_id', b).eq('blocked_id', a).maybeSingle();
  if (secondError) throw secondError;
  return !!second;
}

async function canMessage(db: Db, a: string, b: string): Promise<boolean> {
  if (await hasBlock(db, a, b)) return false;
  const row = await relationship(db, a, b);
  return row?.status === 'accepted';
}

export async function GET(request: Request): Promise<Response> {
  const auth = await identify(request);
  if ('error' in auth) return auth.error;
  const { db, userId } = auth.who;
  const url = new URL(request.url);
  const view = url.searchParams.get('view') ?? 'feed';

  try {
    if (view === 'feed') {
      const blocks = await blocksFor(db, userId);
      if (!blocks) return dbFail(request, { message: 'blocks query failed' });
      const { data, error } = await db.from('community_posts')
        .select('id, author_id, kind, category, title, body, created_at')
        .eq('hidden', false).order('created_at', { ascending: false }).limit(60);
      if (error) return dbFail(request, error);
      const rows = ((data ?? []) as Pick<CommunityPostRow, 'id' | 'author_id' | 'kind' | 'category' | 'title' | 'body' | 'created_at'>[])
        .filter((row) => !isBlocked(blocks, userId, row.author_id));
      const ids = rows.map((row) => row.author_id);
      const names = await profiles(db, ids);
      const postIds = rows.map((row) => row.id);
      const counts = new Map<string, number>();
      if (postIds.length) {
        const { data: comments, error: commentError } = await db.from('community_comments').select('post_id').in('post_id', postIds).limit(4000);
        if (commentError) return dbFail(request, commentError);
        for (const row of comments ?? []) counts.set(row.post_id, (counts.get(row.post_id) ?? 0) + 1);
      }
      return Response.json({ posts: rows.map((row) => ({
        id: row.id,
        authorId: row.author_id,
        authorName: names.get(row.author_id) ? person(names.get(row.author_id)!).displayName : 'Bạn học',
        kind: row.kind,
        category: row.category,
        title: row.title,
        body: row.body,
        createdAt: row.created_at,
        commentCount: counts.get(row.id) ?? 0,
      })) });
    }

    if (view === 'comments') {
      const postId = url.searchParams.get('postId') ?? '';
      if (!UUID.test(postId)) return fail(request, 400, 'Bài đăng không hợp lệ.', 'Invalid post.');
      const { data: post, error: postError } = await db.from('community_posts').select('author_id, hidden').eq('id', postId).maybeSingle();
      if (postError) return dbFail(request, postError);
      if (!post || post.hidden) return fail(request, 404, 'Không tìm thấy bài đăng.', 'Post not found.');
      if (await hasBlock(db, userId, post.author_id)) return fail(request, 404, 'Không tìm thấy bài đăng.', 'Post not found.');
      const blocks = await blocksFor(db, userId);
      if (!blocks) return dbFail(request, { message: 'blocks query failed' });
      const { data, error } = await db.from('community_comments').select('id, post_id, author_id, body, created_at')
        .eq('post_id', postId).order('created_at', { ascending: false }).limit(100);
      if (error) return dbFail(request, error);
      const rows = (data ?? []).reverse();
      const names = await profiles(db, rows.map((row) => row.author_id));
      return Response.json({ comments: rows.filter((row) => !isBlocked(blocks, userId, row.author_id)).map((row) => ({
        id: row.id, postId: row.post_id, authorId: row.author_id,
        authorName: names.get(row.author_id) ? person(names.get(row.author_id)!).displayName : 'Bạn học',
        body: row.body, createdAt: row.created_at,
      })) });
    }

    if (view === 'people') {
      const query = cleanCommunityText(url.searchParams.get('q'), 60).replace(/[\\%_]/g, '');
      if (query.length < 2) return Response.json({ people: [] });
      const { data, error } = await db.from('profiles').select('id, display_name, avatar_url')
        .ilike('display_name', `%${query}%`).neq('id', userId).order('display_name').limit(30);
      if (error) return dbFail(request, error);
      const rows = (data ?? []) as ProfileLite[];
      const relations = await friendshipsFor(db, userId);
      const blocks = await blocksFor(db, userId);
      if (!relations || !blocks) return dbFail(request, { message: 'community relationship query failed' });
      const people = rows.map((profile) => {
        const relation = relations.find((row) => otherUser(row, userId) === profile.id);
        const status = blocks.some((row) => row.blocker_id === userId && row.blocked_id === profile.id)
          ? 'blocked_by_me'
          : blocks.some((row) => row.blocker_id === profile.id && row.blocked_id === userId)
            ? 'blocked_me'
          : relation?.status === 'accepted' ? 'friend'
            : relation?.status === 'pending' ? relation.requested_by === userId ? 'outgoing' : 'incoming'
              : 'none';
        return { ...person(profile), relation: status };
      });
      return Response.json({ people });
    }

    if (view === 'connections') {
      const [relations, blocks] = await Promise.all([friendshipsFor(db, userId), blocksFor(db, userId)]);
      if (!relations || !blocks) return dbFail(request, { message: 'community relationship query failed' });
      const visible = relations.filter((row) => !isBlocked(blocks, userId, otherUser(row, userId)));
      const names = await profiles(db, visible.map((row) => otherUser(row, userId)));
      const mapRequest = (row: Friendship, direction: 'incoming' | 'outgoing') => {
        const id = otherUser(row, userId);
        const profile = names.get(id);
        return { id: `${row.user_low_id}:${row.user_high_id}`, userId: id, displayName: profile ? person(profile).displayName : 'Bạn học', avatarUrl: profile?.avatar_url ?? null, direction, createdAt: row.created_at };
      };
      const blockedProfiles = await profiles(db, blocks.filter((row) => row.blocker_id === userId).map((row) => row.blocked_id));
      return Response.json({
        friends: visible.filter((row) => row.status === 'accepted').map((row) => {
          const profile = names.get(otherUser(row, userId));
          return { ...(profile ? person(profile) : { id: otherUser(row, userId), displayName: 'Bạn học', avatarUrl: null }) };
        }),
        incoming: visible.filter((row) => row.status === 'pending' && row.requested_by !== userId).map((row) => mapRequest(row, 'incoming')),
        outgoing: visible.filter((row) => row.status === 'pending' && row.requested_by === userId).map((row) => mapRequest(row, 'outgoing')),
        blocked: blocks.filter((row) => row.blocker_id === userId).map((row) => {
          const profile = blockedProfiles.get(row.blocked_id);
          return profile ? person(profile) : { id: row.blocked_id, displayName: 'Bạn học', avatarUrl: null };
        }),
      });
    }

    if (view === 'inbox') {
      const [relations, blocks] = await Promise.all([friendshipsFor(db, userId), blocksFor(db, userId)]);
      if (!relations || !blocks) return dbFail(request, { message: 'community relationship query failed' });
      const friends = relations.filter((row) => row.status === 'accepted' && !isBlocked(blocks, userId, otherUser(row, userId))).map((row) => otherUser(row, userId));
      if (!friends.length) return Response.json({ inbox: [] });
      const names = await profiles(db, friends);
      const { data, error } = await db.from('community_messages').select('id, sender_id, recipient_id, body, created_at, read_at')
        .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`).order('created_at', { ascending: false }).limit(1000);
      if (error) return dbFail(request, error);
      const latest = new Map<string, { message: Message; unread: number }>();
      for (const message of (data ?? []) as Message[]) {
        const peerId = message.sender_id === userId ? message.recipient_id : message.sender_id;
        if (!friends.includes(peerId)) continue;
        const item = latest.get(peerId) ?? { message, unread: 0 };
        if (message.recipient_id === userId && !message.read_at) item.unread += 1;
        latest.set(peerId, item);
      }
      return Response.json({ inbox: friends.map((id) => {
        const profile = names.get(id);
        const item = latest.get(id);
        return {
          ...(profile ? person(profile) : { id, displayName: 'Bạn học', avatarUrl: null }),
          lastMessage: item?.message.body ?? null,
          lastMessageAt: item?.message.created_at ?? null,
          unreadCount: item?.unread ?? 0,
        };
      }).sort((a, b) => (b.lastMessageAt ?? '').localeCompare(a.lastMessageAt ?? '')) });
    }

    if (view === 'thread') {
      const peerId = url.searchParams.get('with') ?? '';
      if (!UUID.test(peerId) || peerId === userId) return fail(request, 400, 'Người nhận không hợp lệ.', 'Invalid recipient.');
      if (!(await canMessage(db, userId, peerId))) return fail(request, 403, 'Chỉ nhắn tin được với bạn bè. Hãy kết bạn trước.', 'You can message friends after they accept your request.');
      const [sent, received] = await Promise.all([
        db.from('community_messages').select('id, sender_id, recipient_id, body, created_at, read_at').eq('sender_id', userId).eq('recipient_id', peerId).order('created_at', { ascending: false }).limit(100),
        db.from('community_messages').select('id, sender_id, recipient_id, body, created_at, read_at').eq('sender_id', peerId).eq('recipient_id', userId).order('created_at', { ascending: false }).limit(100),
      ]);
      if (sent.error) return dbFail(request, sent.error);
      if (received.error) return dbFail(request, received.error);
      const messages = [...(sent.data ?? []), ...(received.data ?? [])] as Message[];
      messages.sort((a, b) => a.created_at.localeCompare(b.created_at));
      const page = messages.slice(-100);
      const unreadIds = page.filter((m) => m.sender_id === peerId && !m.read_at).map((m) => m.id);
      if (unreadIds.length) {
        const readAt = new Date().toISOString();
        const { error } = await db.from('community_messages').update({ read_at: readAt }).in('id', unreadIds).eq('recipient_id', userId);
        if (error) return dbFail(request, error);
        for (const message of page) if (unreadIds.includes(message.id)) message.read_at = readAt;
      }
      const names = await profiles(db, [peerId]);
      const profile = names.get(peerId);
      return Response.json({
        peer: profile ? person(profile) : { id: peerId, displayName: 'Bạn học', avatarUrl: null },
        messages: page.map((m) => ({ id: m.id, senderId: m.sender_id, recipientId: m.recipient_id, body: m.body, createdAt: m.created_at, readAt: m.read_at })),
      });
    }

    return fail(request, 400, 'Yêu cầu cộng đồng không hợp lệ.', 'Invalid community request.');
  } catch {
    return fail(request, 500, 'Chưa tải được cộng đồng. Thử lại sau.', 'Could not load the community. Please try again.');
  }
}

export async function POST(request: Request): Promise<Response> {
  const auth = await identify(request);
  if ('error' in auth) return auth.error;
  const { db, userId } = auth.who;
  const input = await readJson(request);
  const action = typeof input.action === 'string' ? input.action : '';

  try {
    if (action === 'create_post') {
      const post = validPostInput(input);
      if (!post) return fail(request, 400, 'Hãy nhập tiêu đề, nội dung và chọn chủ đề.', 'Add a title, details and a topic.');
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count, error: countError } = await db.from('community_posts').select('id', { count: 'exact', head: true }).eq('author_id', userId).gte('created_at', since);
      if (countError) return dbFail(request, countError);
      if ((count ?? 0) >= 12) return fail(request, 429, 'Bạn đã đăng khá nhiều hôm nay. Thử lại vào ngày mai nhé.', 'You have posted several times today. Please try again tomorrow.');
      const { data, error } = await db.from('community_posts').insert({ author_id: userId, ...post }).select('id').single();
      if (error) return dbFail(request, error);
      return Response.json({ ok: true, id: data.id }, { status: 201 });
    }

    if (action === 'comment') {
      const postId = typeof input.postId === 'string' ? input.postId : '';
      const body = validMessageBody(input.body);
      if (!UUID.test(postId) || !body) return fail(request, 400, 'Bình luận chưa hợp lệ.', 'Invalid comment.');
      const { data: post, error: postError } = await db.from('community_posts').select('author_id, hidden').eq('id', postId).maybeSingle();
      if (postError) return dbFail(request, postError);
      if (!post || post.hidden) return fail(request, 404, 'Không tìm thấy bài đăng.', 'Post not found.');
      if (await hasBlock(db, userId, post.author_id)) return fail(request, 403, 'Bạn không thể bình luận bài đăng này.', 'You cannot comment on this post.');
      const { data, error } = await db.from('community_comments').insert({ post_id: postId, author_id: userId, body }).select('id').single();
      if (error) return dbFail(request, error);
      return Response.json({ ok: true, id: data.id }, { status: 201 });
    }

    if (action === 'friend_request') {
      const targetId = typeof input.userId === 'string' ? input.userId : '';
      const pair = canonicalFriendPair(userId, targetId);
      if (!pair) return fail(request, 400, 'Không thể gửi lời mời kết bạn này.', 'Invalid friend request.');
      if (await hasBlock(db, userId, targetId)) return fail(request, 403, 'Không thể kết bạn với tài khoản này.', 'You cannot connect with this account.');
      const { data: target, error: targetError } = await db.from('profiles').select('id').eq('id', targetId).maybeSingle();
      if (targetError) return dbFail(request, targetError);
      if (!target) return fail(request, 404, 'Không tìm thấy người học này.', 'Learner not found.');
      const current = await relationship(db, userId, targetId);
      if (current?.status === 'accepted') return Response.json({ ok: true, relation: 'friend' });
      if (current?.status === 'pending') return Response.json({ ok: true, relation: current.requested_by === userId ? 'outgoing' : 'incoming' });
      const patch = { requested_by: userId, status: 'pending', updated_at: new Date().toISOString(), accepted_at: null };
      const result = current
        ? await db.from('community_friendships').update(patch).eq('user_low_id', pair.low).eq('user_high_id', pair.high)
        : await db.from('community_friendships').insert({ user_low_id: pair.low, user_high_id: pair.high, requested_by: userId, status: 'pending' });
      if (result.error) return dbFail(request, result.error);
      return Response.json({ ok: true, relation: 'outgoing' }, { status: 201 });
    }

    if (action === 'respond_friend_request') {
      const targetId = typeof input.userId === 'string' ? input.userId : '';
      const pair = canonicalFriendPair(userId, targetId);
      if (!pair) return fail(request, 400, 'Lời mời kết bạn không hợp lệ.', 'Invalid friend request.');
      const current = await relationship(db, userId, targetId);
      if (!current || current.status !== 'pending' || current.requested_by === userId) return fail(request, 404, 'Lời mời này không còn hiệu lực.', 'This request is no longer available.');
      const accept = input.accept === true;
      const { error } = await db.from('community_friendships').update({
        status: accept ? 'accepted' : 'declined',
        accepted_at: accept ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      }).eq('user_low_id', pair.low).eq('user_high_id', pair.high).eq('status', 'pending').neq('requested_by', userId);
      if (error) return dbFail(request, error);
      return Response.json({ ok: true });
    }

    if (action === 'send_message') {
      const recipientId = typeof input.userId === 'string' ? input.userId : '';
      const body = validMessageBody(input.body);
      if (!UUID.test(recipientId) || !body || body.length > 1500) return fail(request, 400, 'Tin nhắn chưa hợp lệ.', 'Invalid message.');
      if (!(await canMessage(db, userId, recipientId))) return fail(request, 403, 'Chỉ nhắn tin riêng với bạn bè.', 'You can only message friends.');
      const since = new Date(Date.now() - 60 * 1000).toISOString();
      const { count, error: countError } = await db.from('community_messages').select('id', { count: 'exact', head: true }).eq('sender_id', userId).gte('created_at', since);
      if (countError) return dbFail(request, countError);
      if ((count ?? 0) >= 30) return fail(request, 429, 'Bạn gửi tin nhắn quá nhanh. Chờ một chút rồi thử lại.', 'You are sending messages too quickly. Please wait a moment.');
      const { data, error } = await db.from('community_messages').insert({ sender_id: userId, recipient_id: recipientId, body }).select('id, sender_id, recipient_id, body, created_at, read_at').single();
      if (error) return dbFail(request, error);
      return Response.json({ ok: true, message: { id: data.id, senderId: data.sender_id, recipientId: data.recipient_id, body: data.body, createdAt: data.created_at, readAt: data.read_at } }, { status: 201 });
    }

    if (action === 'block') {
      const targetId = typeof input.userId === 'string' ? input.userId : '';
      const pair = canonicalFriendPair(userId, targetId);
      if (!pair) return fail(request, 400, 'Không thể chặn tài khoản này.', 'Invalid account.');
      const { error: blockError } = await db.from('community_blocks').upsert({ blocker_id: userId, blocked_id: targetId }, { onConflict: 'blocker_id,blocked_id' });
      if (blockError) return dbFail(request, blockError);
      const { error } = await db.from('community_friendships').delete().eq('user_low_id', pair.low).eq('user_high_id', pair.high);
      if (error) return dbFail(request, error);
      return Response.json({ ok: true });
    }

    if (action === 'unblock') {
      const targetId = typeof input.userId === 'string' ? input.userId : '';
      if (!UUID.test(targetId)) return fail(request, 400, 'Tài khoản không hợp lệ.', 'Invalid account.');
      const { error } = await db.from('community_blocks').delete().eq('blocker_id', userId).eq('blocked_id', targetId);
      if (error) return dbFail(request, error);
      return Response.json({ ok: true });
    }

    if (action === 'report') {
      const targetKind = input.targetKind;
      const targetId = typeof input.targetId === 'string' ? input.targetId : '';
      const reason = cleanCommunityText(input.reason, 500);
      if (!['post', 'comment', 'message', 'user'].includes(String(targetKind)) || !UUID.test(targetId) || reason.length < 3) return fail(request, 400, 'Báo cáo chưa hợp lệ.', 'Invalid report.');
      let targetExists = false;
      if (targetKind === 'post') {
        const { data, error } = await db.from('community_posts').select('id').eq('id', targetId).maybeSingle();
        if (error) return dbFail(request, error);
        targetExists = !!data;
      } else if (targetKind === 'comment') {
        const { data, error } = await db.from('community_comments').select('id').eq('id', targetId).maybeSingle();
        if (error) return dbFail(request, error);
        targetExists = !!data;
      } else if (targetKind === 'message') {
        const { data, error } = await db.from('community_messages').select('id').eq('id', targetId)
          .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`).maybeSingle();
        if (error) return dbFail(request, error);
        targetExists = !!data;
      } else if (targetKind === 'user' && targetId !== userId) {
        const { data, error } = await db.from('profiles').select('id').eq('id', targetId).maybeSingle();
        if (error) return dbFail(request, error);
        targetExists = !!data;
      }
      if (!targetExists) return fail(request, 404, 'Không tìm thấy nội dung cần báo cáo.', 'Report target not found.');
      const { error } = await db.from('community_reports').upsert({ reporter_id: userId, target_kind: targetKind as 'post' | 'comment' | 'message' | 'user', target_id: targetId, reason }, { onConflict: 'reporter_id,target_kind,target_id' });
      if (error) return dbFail(request, error);
      return Response.json({ ok: true });
    }

    return fail(request, 400, 'Yêu cầu cộng đồng không hợp lệ.', 'Invalid community request.');
  } catch {
    return fail(request, 500, 'Chưa thực hiện được thao tác. Thử lại sau.', 'Could not complete that action. Please try again.');
  }
}

export async function DELETE(request: Request): Promise<Response> {
  const auth = await identify(request);
  if ('error' in auth) return auth.error;
  const { db, userId } = auth.who;
  const input = await readJson(request);
  const kind = input.kind;
  const id = typeof input.id === 'string' ? input.id : '';
  if (!UUID.test(id)) return fail(request, 400, 'Nội dung không hợp lệ.', 'Invalid content.');
  try {
    if (kind === 'post') {
      const { error } = await db.from('community_posts').delete().eq('id', id).eq('author_id', userId);
      if (error) return dbFail(request, error);
      return Response.json({ ok: true });
    }
    if (kind === 'comment') {
      const { error } = await db.from('community_comments').delete().eq('id', id).eq('author_id', userId);
      if (error) return dbFail(request, error);
      return Response.json({ ok: true });
    }
    return fail(request, 400, 'Không thể xoá nội dung này.', 'This content cannot be deleted.');
  } catch {
    return fail(request, 500, 'Chưa xoá được nội dung. Thử lại sau.', 'Could not delete this content. Please try again.');
  }
}
