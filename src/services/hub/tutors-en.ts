import type { Tutor } from './tutors';

/**
 * Tên và mô tả tiếng Anh của gia sư, dùng khi app bật English. Dữ liệu gốc (tutors.ts) viết
 * tiếng Việt; mục nào thiếu bản Anh thì rơi về tiếng Việt gốc.
 */
const EN: Record<string, { name: string; desc: string }> = {
  grammar: { name: 'Grammar tutor', desc: 'Improve your grammar with personalized exercises.' },
  'speech-analysis': { name: 'Speech analysis', desc: 'Record yourself and discover how your voice sounds.' },
  vocab: { name: 'Vocabulary tutor', desc: 'Grow your English vocabulary with personalized practice.' },
  pronounce: { name: 'Pronunciation tutor', desc: 'Learn to pronounce English clearly.' },
  meeting: { name: 'Meeting tutor', desc: 'Practice work meetings.' },
  interview: { name: 'Interview tutor', desc: 'Practice live interview conversations with an AI interviewer.' },
  'public-speaking': { name: 'Public speaking tutor', desc: 'Speak with confidence in front of a live AI audience.' },
  presentation: { name: 'Presentation tutor', desc: 'Upload your slides and rehearse from start to finish.' },
  sales: { name: 'Sales tutor', desc: 'Practice live sales calls and get instant coaching.' },
  dating: { name: 'Dating tutor', desc: 'Practice live dates and get coached.' },
  travel: { name: 'Travel tutor', desc: 'Practice English for your upcoming trip.' },
  negotiation: {
    name: 'Negotiation coach',
    desc: 'Practice real workplace negotiations: job offers, raises, difficult clients, deadlines. The AI plays the other side, then coaches you.',
  },
  conflict: { name: 'Conflict management coach', desc: 'Handle disagreements without damaging relationships.' },
  'leader-comms': { name: 'Leadership communication', desc: 'Practice leadership communication at work.' },
  storytelling: { name: 'Business storytelling', desc: 'Turn numbers and initiatives into inspiring stories.' },
  leadership: {
    name: 'Leadership coach',
    desc: 'Build self-awareness, judgement and influence to lead at every level.',
  },
  'ielts-examiner': {
    name: 'High-pressure IELTS examiner',
    desc: 'Simulate the three-part IELTS Speaking test with a strict examiner who interrupts, switches between British, Australian and American accents, and spots weak answers.',
  },
  profile: {
    name: 'Profile & academic coach',
    desc: 'Upload your CV, study-abroad essay or academic PDF so the AI can question your profile in depth.',
  },
  phone: {
    name: 'Phone call tutor',
    desc: 'The tutor calls you like a real call (restaurant, clinic, office): short lines, in character, one sentence at a time.',
  },
  diary: {
    name: 'English diary',
    desc: 'Write a few sentences about your day in English. The tutor fixes one mistake, praises a good phrase and asks a follow-up.',
  },
};

/** Tên và mô tả đúng ngôn ngữ đang bật. */
export function tutorCopy(t: Tutor, en: boolean): { name: string; desc: string } {
  if (!en) return { name: t.name, desc: t.desc };
  return EN[t.id] ?? { name: t.name, desc: t.desc };
}
