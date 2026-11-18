import { GT_CATEGORIES, MOCK_TESTS } from '@/data/hub/speaking-more';
import { SPEAKING_TOPICS, topicExtra } from '@/data/hub/speaking-topics';
import { TUTORS } from '@/services/hub/tutors';

import type { SearchEntry } from './types';

/**
 * Mục tìm kiếm của khu Luyện nói (Hub): các trang, 64 chủ đề, 40 đề thi thử, 100 đề giao tiếp và các gia sư AI.
 * Gõ một câu hỏi Part 1 hay một cụm trong cue card cũng ra đúng chủ đề.
 */

const SPEAKING = { exam: 'ielts', skill: 'speaking', kind: 'speaking' } as const;

/** Gia sư có trang riêng, không đi qua `/hub/tutor/<id>`. */
const TUTOR_ROUTE: Record<string, string> = {
  'ielts-examiner': '/speaking',
  'speech-analysis': '/hub/analyze',
  pronounce: '/hub/learn',
  meeting: '/hub/meeting',
  presentation: '/hub/course/presentation',
};

const PAGES: { id: string; vi: string; en: string; sub: [string, string]; href: string; keywords: string[] }[] = [
  { id: 'home', vi: 'Luyện nói AI', en: 'AI Speaking Hub', sub: ['Trang chủ khu luyện nói', 'Speaking hub home'], href: '/hub', keywords: ['luyện nói', 'speaking', 'hôm nay', 'nhiệm vụ'] },
  { id: 'tutor', vi: 'Gia sư AI', en: 'AI tutors', sub: ['28 gia sư theo mục tiêu', '28 tutors by goal'], href: '/hub/tutor', keywords: ['gia sư', 'tutor', 'phỏng vấn', 'họp', 'thuyết trình', 'đàm phán'] },
  { id: 'talk', vi: 'Nói chuyện', en: 'Real conversations', sub: ['Trò chuyện thật, không bài học', 'Real conversations, no lessons'], href: '/hub/talk', keywords: ['nói chuyện', 'conversation', 'xu hướng', 'tình huống'] },
  { id: 'parts', vi: 'Luyện theo Part', en: 'Practise by Part', sub: ['Part 1, Part 2 và Part 3 như thi thật', 'Part 1, 2 and 3 like the real test'], href: '/hub/parts', keywords: ['part 1', 'part 2', 'part 3', 'cue card', 'band descriptors'] },
  { id: 'mock', vi: 'Đề thi thử Speaking', en: 'Speaking mock tests', sub: ['40 đề đủ ba Part có đáp án mẫu', '40 full tests with model answers'], href: '/hub/mock', keywords: ['đề thi thử', 'mock test', 'full test', 'speaking test'] },
  { id: 'giao-tiep', vi: 'Đề nói giao tiếp', en: 'Everyday speaking tasks', sub: ['100 đề đời sống và công việc', '100 daily-life and work tasks'], href: '/hub/giao-tiep', keywords: ['giao tiếp', 'speaking in daily', 'hằng ngày', 'phàn nàn', 'đặt chỗ', 'daily english'] },
  { id: 'topics', vi: 'Đề luyện nói theo chủ đề', en: 'Speaking topics', sub: ['64 chủ đề đủ Part 1, 2, 3', '64 topics with all three parts'], href: '/hub/topics', keywords: ['chủ đề', 'topics', 'cue card'] },
  { id: 'scenarios', vi: 'Tình huống nói', en: 'Speaking scenarios', sub: ['Nhập vai, gọi điện, hội thoại', 'Roleplay, calls, dialogues'], href: '/hub/scenarios', keywords: ['nhập vai', 'roleplay', 'gọi điện', 'hội thoại', 'dialogue'] },
  { id: 'explore', vi: 'Khám phá bài nói', en: 'Explore speaking', sub: ['Gợi ý theo hoạt động, công cụ AI', 'Suggestions and AI tools'], href: '/hub/explore', keywords: ['khám phá', 'explore', 'làm tôi ngạc nhiên', 'tạo tình huống'] },
  { id: 'analyze', vi: 'Phân tích giọng nói', en: 'Voice analysis', sub: ['Báo cáo 6 tiêu chí', '6-criteria report'], href: '/hub/analyze', keywords: ['phân tích giọng', 'ghi âm', 'tốc độ nói', 'từ đệm', 'filler', 'wpm'] },
  { id: 'pitch', vi: 'Điều chỉnh giọng nói', en: 'Intonation coach', sub: ['Ngữ điệu và trọng âm', 'Pitch and stress'], href: '/hub/pitch', keywords: ['ngữ điệu', 'intonation', 'trọng âm', 'pitch'] },
  { id: 'shadow', vi: 'Nói đuổi (shadowing)', en: 'Shadowing', sub: ['Nói theo giọng bản ngữ', 'Speak along with native audio'], href: '/hub/shadow', keywords: ['shadowing', 'nói đuổi', 'nhại giọng'] },
  { id: 'short', vi: 'Video ngắn', en: 'Short videos', sub: ['Xem clip rồi nói lại cụm từ', 'Watch and repeat phrases'], href: '/hub/short', keywords: ['video ngắn', 'ted', 'clip', 'nói lại'] },
  { id: 'meeting', vi: 'Trợ lý họp', en: 'Meeting assistant', sub: ['Phản hồi sau các cuộc họp', 'Feedback after meetings'], href: '/hub/meeting', keywords: ['họp', 'meeting', 'tách giọng'] },
];

export function hubSpeakingEntries(): SearchEntry[] {
  const out: SearchEntry[] = [];

  for (const p of PAGES) {
    out.push({ id: `hub-page:${p.id}`, ...SPEAKING, title: { vi: p.vi, en: p.en }, subtitle: { vi: p.sub[0], en: p.sub[1] }, keywords: p.keywords, href: p.href });
  }

  for (const t of SPEAKING_TOPICS) {
    const e = topicExtra(t.id);
    out.push({
      id: `hub-topic:${t.id}`,
      ...SPEAKING,
      title: { vi: `Chủ đề: ${t.titleVi}`, en: `Topic: ${t.title}` },
      subtitle: { vi: `Part 1–3 · ${t.part2.prompt}`, en: `Parts 1–3 · ${t.part2.prompt}` },
      // Câu hỏi và từ vựng chủ điểm vào từ khoá: gõ một câu hỏi hay một cụm từ cũng tìm ra chủ đề.
      keywords: ['part 1', 'part 2', 'part 3', 'cue card', t.title, t.titleVi, t.part2.prompt, ...t.part1, ...t.part3, ...(e?.vocab.map((v) => v.en) ?? [])],
      href: `/hub/topics/${t.id}`,
    });
  }

  for (const m of MOCK_TESTS) {
    out.push({
      id: `hub-mock:${m.id}`,
      ...SPEAKING,
      title: { vi: m.titleVi, en: m.title },
      subtitle: { vi: `${m.part1.map((g) => g.topic).join(' · ')} · ${m.part2.prompt}`, en: `${m.part1.map((g) => g.topic).join(' · ')} · ${m.part2.prompt}` },
      keywords: ['đề thi thử', 'mock test', 'full test', ...m.part1.map((g) => g.topic), m.part2.prompt, m.focusVi],
      href: `/hub/mock/${m.id}`,
    });
  }

  for (const c of GT_CATEGORIES) {
    for (const t of c.tasks) {
      out.push({
        id: `hub-gt:${t.id}`,
        ...SPEAKING,
        title: { vi: t.titleVi, en: t.title },
        subtitle: { vi: `Nói giao tiếp · ${c.titleVi}`, en: `Everyday speaking · ${t.title}` },
        keywords: ['giao tiếp', 'speaking in daily', 'daily english', c.titleVi, t.situationVi, ...t.phrases.map((p) => p.en)],
        level: t.level === 'EASY' ? 'Dễ' : t.level === 'MEDIUM' ? 'Vừa' : 'Khó',
        href: `/hub/giao-tiep/${t.id}`,
      });
    }
  }

  for (const t of TUTORS) {
    if (t.status !== 'live') continue;
    out.push({
      id: `hub-tutor:${t.id}`,
      ...SPEAKING,
      title: { vi: t.name, en: t.name },
      subtitle: { vi: 'Gia sư AI · trò chuyện và sửa lỗi', en: 'AI tutor · chat and corrections' },
      keywords: ['gia sư', 'tutor', 'ai tutor', t.desc],
      href: TUTOR_ROUTE[t.id] ?? `/hub/tutor/${t.id}`,
    });
  }

  return out;
}
