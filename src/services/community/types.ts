export type CommunityCategory = 'vocabulary' | 'grammar' | 'speaking' | 'writing' | 'reading' | 'general';
export type CommunityPostKind = 'question' | 'share';

export type CommunityPost = {
  id: string;
  authorId: string;
  authorName: string;
  kind: CommunityPostKind;
  category: CommunityCategory;
  title: string;
  body: string;
  createdAt: string;
  commentCount: number;
};

export type CommunityComment = {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string;
};

export type CommunityPerson = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  relation: 'none' | 'incoming' | 'outgoing' | 'friend' | 'blocked_by_me' | 'blocked_me';
};

export type CommunityFriendRequest = {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  direction: 'incoming' | 'outgoing';
  createdAt: string;
};

export type CommunityFriend = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
};

export type CommunityInboxItem = CommunityFriend & {
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
};

export type CommunityMessage = {
  id: string;
  senderId: string;
  recipientId: string;
  body: string;
  createdAt: string;
  readAt: string | null;
};

export type CommunityFeedResponse = { posts: CommunityPost[] };
export type CommunityCommentsResponse = { comments: CommunityComment[] };
export type CommunityConnectionsResponse = {
  friends: CommunityFriend[];
  incoming: CommunityFriendRequest[];
  outgoing: CommunityFriendRequest[];
  blocked: CommunityFriend[];
};
export type CommunityPeopleResponse = { people: CommunityPerson[] };
export type CommunityInboxResponse = { inbox: CommunityInboxItem[] };
export type CommunityThreadResponse = { peer: CommunityFriend; messages: CommunityMessage[] };

export class CommunityApiError extends Error {
  constructor(message: string, readonly status: number, readonly setupNeeded = false) {
    super(message);
    this.name = 'CommunityApiError';
  }
}

export async function communityApi<T>(
  path: string,
  opts: { token: string; method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'; body?: unknown },
): Promise<T> {
  const headers: Record<string, string> = { authorization: `Bearer ${opts.token}` };
  if (opts.body !== undefined) headers['content-type'] = 'application/json';
  const response = await fetch(path, {
    method: opts.method ?? 'GET',
    headers,
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  });
  const data = (await response.json().catch(() => ({}))) as { error?: string; setupNeeded?: boolean } & T;
  if (!response.ok) throw new CommunityApiError(data.error ?? 'Không kết nối được cộng đồng.', response.status, !!data.setupNeeded);
  return data;
}
