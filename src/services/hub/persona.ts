import { tutorById, type Tutor } from './tutors';

/**
 * Dựng vai (system prompt) cho gia sư trên MÁY CHỦ, từ các trường đã làm sạch.
 *
 * Client không gửi thẳng system prompt: người dùng chỉ điền vai, giọng, tình huống và
 * mục tiêu (hoặc nội dung slide). Mọi trường bị cắt độ dài, bỏ ký tự xuống dòng và dấu
 * ngoặc nhọn, để không ai nhét được chỉ dẫn vào vai.
 */

export type CustomTutorInput = { role: string; tone: string; situation: string; goal: string };

const MAX_FIELD = 160;
const MAX_SLIDES = 30;
const MAX_SLIDE_CHARS = 600;
const MAX_TOTAL_SLIDES = 6000;

export function clean(value: unknown, max = MAX_FIELD): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/[{}<>`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

/** Vai tự tạo: người dùng đặt nhân vật, giọng, tình huống và mục tiêu. */
export function customPersona(input: CustomTutorInput, shared: string): { ok: true; persona: string } | { ok: false; error: string } {
  const role = clean(input.role);
  const situation = clean(input.situation);
  const tone = clean(input.tone) || 'friendly';
  const goal = clean(input.goal) || 'practise natural English conversation';
  if (role.length < 3 || situation.length < 5) return { ok: false, error: 'Cần ghi rõ nhân vật và tình huống.' };
  return {
    ok: true,
    persona: `You are ${role}. Your tone is ${tone}. The situation: ${situation}. The learner's goal: ${goal}. Stay in character. ${shared}`,
  };
}

/** Vai thuyết trình: gắn nội dung từng slide do người học dán vào. */
export function slidesPersona(tutor: Tutor, slides: unknown, shared: string): { ok: true; persona: string } | { ok: false; error: string } {
  if (!Array.isArray(slides)) return { ok: false, error: 'Cần nội dung slide.' };
  const lines: string[] = [];
  let total = 0;
  for (const raw of slides.slice(0, MAX_SLIDES)) {
    const text = clean(raw, MAX_SLIDE_CHARS);
    if (!text) continue;
    if (total + text.length > MAX_TOTAL_SLIDES) break;
    total += text.length;
    lines.push(`Slide ${lines.length + 1}: ${text}`);
  }
  if (lines.length === 0) return { ok: false, error: 'Dán nội dung ít nhất một slide.' };
  return { ok: true, persona: `${tutor.persona ?? ''}\n\nSlide outline:\n${lines.join('\n')}` };
}

/** Chọn vai cho một yêu cầu: gia sư có sẵn, vai tự tạo, hoặc thuyết trình có slide. */
export function resolvePersona(body: { tutorId?: unknown; custom?: unknown; slides?: unknown }, shared: string):
  | { ok: true; persona: string; tutorId: string; opening?: string }
  | { ok: false; error: string } {
  if (body.custom && typeof body.custom === 'object') {
    const c = body.custom as Record<string, unknown>;
    const r = customPersona({ role: String(c.role ?? ''), tone: String(c.tone ?? ''), situation: String(c.situation ?? ''), goal: String(c.goal ?? '') }, shared);
    return r.ok ? { ok: true, persona: r.persona, tutorId: 'custom' } : r;
  }
  const id = typeof body.tutorId === 'string' ? body.tutorId : '';
  const tutor = tutorById(id);
  if (!tutor || tutor.status !== 'live' || !tutor.persona) return { ok: false, error: 'Gia sư này chưa sẵn sàng.' };
  if (tutor.needsSlides) {
    const r = slidesPersona(tutor, body.slides, shared);
    return r.ok ? { ok: true, persona: r.persona, tutorId: tutor.id, opening: tutor.opening } : r;
  }
  return { ok: true, persona: tutor.persona, tutorId: tutor.id, opening: tutor.opening };
}
