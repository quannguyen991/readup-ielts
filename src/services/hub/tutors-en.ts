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

/** Bản Anh của kỹ năng chính và bài tập mẫu; số mục phải khớp với tutors.ts. */
const EN_LEARNING: Record<string, { focus: string[]; tasks: string[] }> = {
  grammar: {
    focus: ['Tenses and auxiliaries', 'Relative clauses', 'Conditionals'],
    tasks: [
      "Say one sentence about present ability with can and can't.",
      'Rewrite one sentence with a relative clause (who, which or that).',
      'Complete a second conditional sentence and get corrections.',
    ],
  },
  'speech-analysis': {
    focus: ['Individual sounds', 'Sentence intonation', 'Rhythm and clarity'],
    tasks: [
      'Record a 1-minute talk about a typical workday.',
      'Listen back and review your own pronunciation and stress.',
      'Read the edited passage again to compare intonation and rhythm.',
    ],
  },
  vocab: {
    focus: ['Academic collocations', 'C1-level synonyms', 'Education, technology, environment'],
    tasks: [
      'Learn one new C1 collocation with an example sentence.',
      'Replace a simple word in your sentence with a more precise one.',
      'Answer a quick quiz question about the collocation you just learned.',
    ],
  },
  pronounce: {
    focus: ['Final /p/ /t/ /k/ sounds', 'Word stress', 'Minimal pairs'],
    tasks: [
      'Read a word ending in /t/ or /k/ and listen to the feedback.',
      'Tell apart the pair ship and sheep by mouth position.',
      'Read a long sentence and place stress on the key words.',
    ],
  },
  meeting: {
    focus: ['Progress updates', 'Challenging timelines', 'Reaching agreement'],
    tasks: [
      'Give a progress update on one workstream in about 30 seconds.',
      'Politely disagree with one deadline and give your reason.',
      'Propose a next step and confirm who does what.',
    ],
  },
  interview: {
    focus: ['Introducing yourself', 'Competency-based questions', 'Standout achievements'],
    tasks: [
      'Introduce yourself in about one minute.',
      'Tell about a difficult situation: context, task, action, result.',
      'Describe your proudest achievement with specific numbers.',
    ],
  },
  'public-speaking': {
    focus: ['Strong openings', 'Voice and pacing', 'Audience Q&A'],
    tasks: [
      'Open your talk in 30 seconds to hook the audience.',
      'Present one main point, then pause to add emphasis.',
      'Answer one challenging question from the audience.',
    ],
  },
  presentation: {
    focus: ['Slide-based delivery', 'Presentation language', 'Q&A after the talk'],
    tasks: [
      'Present Slide 1 in your own words.',
      'Move to the next slide with one short transition sentence.',
      'Answer one critical question after you finish.',
    ],
  },
  sales: {
    focus: ['Uncovering client needs', 'Handling budget objections', 'Closing the next step'],
    tasks: [
      'Ask two questions to find the real problem behind the client’s needs.',
      'Respond when the client says the budget is limited.',
      'Agree one clear next step before the call ends.',
    ],
  },
  dating: {
    focus: ['Casual conversation', 'Follow-up questions', 'Natural topic changes'],
    tasks: [
      'Reply to a greeting and share one detail about your day.',
      "Ask a follow-up question about the other person's interests.",
      'Move from the café to a hobby you enjoy.',
    ],
  },
  travel: {
    focus: ['Hotel check-in', 'Customs and documents', 'Asking for local tips'],
    tasks: [
      'Answer when the receptionist asks for your passport and booking code.',
      'Declare your luggage at customs.',
      'Ask the receptionist for a local food recommendation.',
    ],
  },
  negotiation: {
    focus: ['Stating your offer', 'Arguing with evidence', 'Staying in control'],
    tasks: [
      'State your desired salary and give a clear reason.',
      'Respond when the other side says the budget is capped.',
      'Suggest an alternative instead of conceding right away.',
    ],
  },
  conflict: {
    focus: ['Expressing feelings', 'Describing facts, not blame', 'Agreeing on a fix'],
    tasks: [
      'Talk about a late delivery without blaming anyone.',
      'Show empathy before you make a request.',
      'Propose a way to recover the deadline together.',
    ],
  },
  'leader-comms': {
    focus: ['Strategic messages', 'Motivating the team', 'Giving tough feedback kindly'],
    tasks: [
      'Give a one-minute address to steady the management team.',
      'State a short vision using two main points.',
      'Give one difficult piece of feedback in a respectful tone.',
    ],
  },
  storytelling: {
    focus: ['SCQA structure', 'Turning numbers into stories', 'Attention-grabbing openings'],
    tasks: [
      'Tell your product’s turning point using situation, complication, question, answer.',
      'Replace one dry number with a concrete example.',
      'Rewrite your opening line to win over an investor.',
    ],
  },
  leadership: {
    focus: ['Self-awareness', 'Decisions under uncertainty', 'Influence in the organization'],
    tasks: [
      'Describe a personal blind spot that affected your team.',
      'Explain a decision you made without full information.',
      'Explain how you influence people without formal authority.',
    ],
  },
  'ielts-examiner': {
    focus: ['IELTS Speaking Parts 1, 2, 3', 'Advanced vocabulary and grammar', 'British, Australian, American accents'],
    tasks: [
      'Answer three familiar questions in Part 1.',
      'Talk about a topic for 1–2 minutes in Part 2.',
      'Answer an extended Part 3 question without memorized lines.',
    ],
  },
  profile: {
    focus: ['In-depth profile questions', 'Defending academic achievements', 'Explaining your research method'],
    tasks: [
      'Upload your CV or essay so the AI can question your profile.',
      'Explain one achievement on your profile with specific figures.',
      'Describe the method you used in one project.',
    ],
  },
  phone: {
    focus: ['Quick listening and replies', 'Confirming bookings and appointments', 'Asking for repetition'],
    tasks: [
      'Answer a call confirming a restaurant table booking.',
      'Ask the caller to repeat a sentence you did not catch.',
      'Book an appointment by phone with a clinic.',
    ],
  },
  diary: {
    focus: ['Complete sentences', 'Choosing precise words', 'Describing your day'],
    tasks: [
      'Write 3–5 sentences about one thing that made you smile today.',
      'Fix one grammar error or word choice in your entry.',
      'Answer the tutor’s follow-up question to keep writing.',
    ],
  },
};

/** Tên, mô tả và dữ liệu học đúng ngôn ngữ đang bật. */
export function tutorCopy(
  t: Tutor,
  en: boolean
): { name: string; desc: string; focus: string[]; tasks: string[] } {
  const focus = t.focus ?? [];
  const tasks = t.tasks ?? [];
  if (!en) return { name: t.name, desc: t.desc, focus, tasks };
  const base = EN[t.id] ?? { name: t.name, desc: t.desc };
  const learn = EN_LEARNING[t.id];
  return { name: base.name, desc: base.desc, focus: learn?.focus ?? focus, tasks: learn?.tasks ?? tasks };
}
