/**
 * Phía trình duyệt của Lớp học: gọi `/api/classes/**` kèm access token, và kiểu
 * dữ liệu các route trả về.
 */
import type { Assignment } from './assignments';
import type { StudentSummary } from './progress';

export type TeachingClass = { id: string; code: string; name: string; archived: boolean; createdAt: string; memberCount: number };
export type JoinedClass = {
  id: string;
  name: string;
  archived: boolean;
  teacherName: string | null;
  displayName: string;
  joinedAt: string;
  assignments: Assignment[];
};
export type MyClasses = { teaching: TeachingClass[]; joined: JoinedClass[] };

export type MemberProgress = { userId: string; displayName: string; joinedAt: string; summary: StudentSummary };
export type TeacherDetail = {
  role: 'teacher';
  class: { id: string; code: string; name: string; archived: boolean; createdAt: string };
  assignments: Assignment[];
  generatedAt: string;
  members: MemberProgress[];
};
export type StudentDetail = {
  role: 'student';
  class: { id: string; name: string; archived: boolean; teacherName: string | null };
  me: { displayName: string; joinedAt: string };
  assignments: Assignment[];
};
export type JoinPreview = { class: { id: string; name: string; teacherName: string | null }; member: boolean; isTeacher: boolean };

export class ClassApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly setupNeeded: boolean,
  ) {
    super(message);
  }
}

export async function classApi<T>(path: string, opts: { token?: string | null; method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'; body?: unknown } = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  const res = await fetch(path, { method: opts.method ?? 'GET', headers, body: opts.body === undefined ? undefined : JSON.stringify(opts.body) });
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    /* thân rỗng hoặc không phải JSON */
  }
  if (!res.ok) {
    const b = (data ?? {}) as { error?: string; setupNeeded?: boolean };
    throw new ClassApiError(b.error ?? `HTTP ${res.status}`, res.status, !!b.setupNeeded);
  }
  return data as T;
}

/**
 * Mã lớp đang chờ: học sinh bấm link mời khi chưa đăng nhập → lưu mã, đăng nhập
 * xong thì thẻ "Lớp của tôi" ở trang Hôm nay mời vào tiếp. Chỉ là tiện ích trên
 * máy này; mất cũng không sao.
 */
const PENDING_KEY = 'band9.pendingClassCode';

export function savePendingCode(code: string): void {
  try {
    globalThis.localStorage?.setItem(PENDING_KEY, code);
  } catch {
    /* trình duyệt chặn lưu trữ */
  }
}

export function readPendingCode(): string | null {
  try {
    return globalThis.localStorage?.getItem(PENDING_KEY) ?? null;
  } catch {
    return null;
  }
}

export function clearPendingCode(): void {
  try {
    globalThis.localStorage?.removeItem(PENDING_KEY);
  } catch {
    /* bỏ qua */
  }
}
