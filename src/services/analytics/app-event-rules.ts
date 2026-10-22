/**
 * Luật dùng chung cho sự kiện của ReadUp: app gửi lên /api/event, máy chủ kiểm lại cùng luật này.
 * Chỉ ba sự kiện được phép; mọi tên khác bị bỏ.
 */
export const APP_EVENT_NAMES = ['start_lesson', 'complete_lesson', 'sign_up'] as const;
export type AppEventName = (typeof APP_EVENT_NAMES)[number];

export type AppEventUtm = {
  utm_source: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_medium: string | null;
};

export type AppEventInput = {
  name: AppEventName;
  visitor: string;
  session: string | null;
  path: string;
  signedIn: boolean;
  utm: AppEventUtm;
};

const ID = /^[A-Za-z0-9_-]{8,40}$/;

function clip(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().slice(0, max);
  return trimmed ? trimmed : null;
}

/** Kiểm dữ liệu đầu vào. Trả về null nếu không hợp lệ (máy chủ bỏ qua, không báo lỗi cho người dùng). */
export function parseAppEvent(raw: unknown): AppEventInput | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const name = APP_EVENT_NAMES.find((n) => n === r.name);
  if (!name) return null;
  if (typeof r.visitor !== 'string' || !ID.test(r.visitor)) return null;
  const path = clip(r.path, 200);
  if (!path || !path.startsWith('/')) return null;
  const session = typeof r.session === 'string' && ID.test(r.session) ? r.session : null;
  const u = (r.utm && typeof r.utm === 'object' ? r.utm : {}) as Record<string, unknown>;
  return {
    name,
    visitor: r.visitor,
    session,
    path,
    signedIn: r.signedIn === true,
    utm: {
      utm_source: clip(u.utm_source, 100),
      utm_medium: clip(u.utm_medium, 100),
      utm_campaign: clip(u.utm_campaign, 100),
      utm_content: clip(u.utm_content, 100),
    },
  };
}
