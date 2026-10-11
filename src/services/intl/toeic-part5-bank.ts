import type { Bi } from '@/i18n/useL';
import type { IntlLevel } from '@/data/intl/level';
import type { Part5Tag } from './toeic-part5';

/**
 * Câu Part 5 viết tay cho các điểm ngữ pháp mà bộ sinh theo mẫu chưa có: điều kiện, đảo ngữ, giả định,
 * cụm động từ, động từ khuyết thiếu và dạng từ. Do Band 9 tự soạn, không phải đề thi thật.
 */
export const BANK_KIND = {
  conditional: { vi: 'Câu điều kiện và mong ước', en: 'Conditionals and wishes' },
  inversion: { vi: 'Đảo ngữ', en: 'Inversion' },
  subjunctive: { vi: 'Giả định', en: 'Subjunctive' },
  phrasal: { vi: 'Cụm động từ', en: 'Phrasal verbs' },
  modal: { vi: 'Động từ khuyết thiếu', en: 'Modal verbs' },
  word_form: { vi: 'Dạng từ', en: 'Word forms' },
} satisfies Record<string, Bi>;

export type BankDraft = {
  id: string;
  focus: 'part_of_speech' | 'grammar' | 'vocabulary';
  kind: Bi;
  level: IntlLevel;
  stem: string;
  correct: string;
  distractors: { text: string; tag: Part5Tag }[];
  explanation: Bi;
};

type Wrong = [text: string, tag: Part5Tag];

function item(
  id: string,
  focus: BankDraft['focus'],
  kind: Bi,
  level: IntlLevel,
  stem: string,
  correct: string,
  wrong: readonly Wrong[],
  explanation: Bi,
): BankDraft {
  return { id, focus, kind, level, stem, correct, distractors: wrong.map(([text, tag]) => ({ text, tag })), explanation };
}

export const PART5_BANK: readonly BankDraft[] = [
  item(
    'bank:cond-inv', 'grammar', BANK_KIND.conditional, 'hard',
    'Had the manager ___ about the delay earlier, she would have changed the schedule.',
    'known',
    [['knew', 'wrong_tense'], ['know', 'wrong_verb_form'], ['knows', 'wrong_verb_form']],
    { vi: 'Đảo ngữ điều kiện loại 3: "Had + chủ ngữ + phân từ II" thay cho "If the manager had known". Cần phân từ II "known".', en: 'Inverted third conditional: "Had + subject + past participle" replaces "If the manager had known". The past participle "known" is needed.' },
  ),
  item(
    'bank:cond-3', 'grammar', BANK_KIND.conditional, 'hard',
    'If the supplier ___ the order on time, we would not have needed to rush the event.',
    'had delivered',
    [['delivered', 'wrong_tense'], ['would deliver', 'wrong_tense'], ['has delivered', 'wrong_tense']],
    { vi: 'Câu điều kiện loại 3 nói về việc không xảy ra trong quá khứ: mệnh đề "if" dùng "had + phân từ II".', en: 'A third conditional describes something that did not happen in the past: the "if" clause uses "had + past participle".' },
  ),
  item(
    'bank:unless', 'grammar', BANK_KIND.conditional, 'medium',
    'Unless the committee ___ the budget by Friday, the project will be cancelled.',
    'approves',
    [['will approve', 'wrong_tense'], ['approved', 'wrong_tense'], ['would approve', 'wrong_tense']],
    { vi: 'Với "unless" (nghĩa là "nếu không"), mệnh đề điều kiện dùng thì hiện tại đơn để nói về tương lai, không dùng "will".', en: 'With "unless" (meaning "if not"), the conditional clause uses the simple present for a future event, not "will".' },
  ),
  item(
    'bank:wish', 'grammar', BANK_KIND.conditional, 'medium',
    'I wish I ___ more time to finish the report.',
    'had',
    [['have', 'wrong_tense'], ['will have', 'wrong_tense'], ['having', 'wrong_verb_form']],
    { vi: '"Wish" nói về điều trái với thực tế ở hiện tại: dùng quá khứ đơn "had".', en: '"Wish" describes a situation contrary to present reality: use the simple past "had".' },
  ),
  item(
    'bank:not-only', 'grammar', BANK_KIND.inversion, 'hard',
    'Not only ___ the sales target, but also finished the project early.',
    'did the team exceed',
    [['the team exceeded', 'wrong_word_order'], ['the team did exceed', 'wrong_word_order'], ['exceeded the team', 'wrong_word_order']],
    { vi: 'Sau "Not only" đứng đầu câu, trợ động từ "did" phải đứng trước chủ ngữ: "did the team exceed".', en: 'After "Not only" at the start of a clause, the auxiliary "did" comes before the subject: "did the team exceed".' },
  ),
  item(
    'bank:rarely', 'grammar', BANK_KIND.inversion, 'hard',
    'Rarely ___ such a large order in such a short time.',
    'have we received',
    [['we have received', 'wrong_word_order'], ['we received', 'wrong_word_order'], ['did we received', 'wrong_verb_form']],
    { vi: 'Sau trạng từ phủ định "rarely" đứng đầu câu, trợ động từ đảo lên trước chủ ngữ: "have we received". Sau "did" phải là động từ nguyên mẫu.', en: 'After the negative adverb "rarely" at the start, the auxiliary moves before the subject: "have we received". After "did", use the base verb.' },
  ),
  item(
    'bank:insist', 'grammar', BANK_KIND.subjunctive, 'hard',
    'The director insisted that every employee ___ the safety form before Monday.',
    'submit',
    [['submits', 'wrong_verb_form'], ['submitted', 'wrong_verb_form'], ['to submit', 'wrong_verb_form']],
    { vi: 'Sau các động từ như "insist", "recommend", "demand" + "that", động từ ở mệnh đề "that" dùng dạng nguyên mẫu không "to", với mọi chủ ngữ.', en: 'After verbs such as "insist", "recommend" or "demand" + "that", the verb in the that-clause takes the base form, with no "to" and no -s.' },
  ),
  item(
    'bank:essential', 'grammar', BANK_KIND.subjunctive, 'hard',
    'It is essential that the contract ___ signed by both parties before the deadline.',
    'be',
    [['is', 'wrong_verb_form'], ['will be', 'wrong_verb_form'], ['to be', 'wrong_verb_form']],
    { vi: 'Sau "it is essential that", dùng giả định: động từ "be" giữ nguyên, không chia theo chủ ngữ.', en: 'After "it is essential that", the subjunctive uses "be" unchanged, regardless of the subject.' },
  ),
  item(
    'bank:put-off', 'vocabulary', BANK_KIND.phrasal, 'medium',
    'The committee decided to ___ the vote until more data becomes available.',
    'put off',
    [['put on', 'wrong_collocation'], ['put up', 'wrong_collocation'], ['put out', 'wrong_collocation']],
    { vi: '"Put off" nghĩa là hoãn lại. "Put on" là mặc vào, "put up" là dựng lên hoặc chịu đựng, "put out" là dập tắt hoặc làm phiền.', en: '"Put off" means to postpone. "Put on" means to wear, "put up" means to erect or tolerate, and "put out" means to extinguish or inconvenience.' },
  ),
  item(
    'bank:set-up', 'vocabulary', BANK_KIND.phrasal, 'medium',
    'Please ___ the meeting room before 9 a.m. so the team can start on time.',
    'set up',
    [['set off', 'wrong_collocation'], ['set in', 'wrong_collocation'], ['set down', 'wrong_collocation']],
    { vi: '"Set up" nghĩa là chuẩn bị, bày biện. "Set off" là khởi hành hoặc làm nổ, "set in" là bắt đầu (thường nói về điều không mong muốn), "set down" là ghi lại.', en: '"Set up" means to prepare or arrange. "Set off" means to depart or trigger, "set in" means to begin (often something unwelcome), and "set down" means to record.' },
  ),
  item(
    'bank:carry-out', 'vocabulary', BANK_KIND.phrasal, 'medium',
    'The team will ___ a customer survey next week.',
    'carry out',
    [['carry on', 'wrong_collocation'], ['carry off', 'wrong_collocation'], ['carry over', 'wrong_collocation']],
    { vi: '"Carry out" nghĩa là thực hiện một việc đã lên kế hoạch. "Carry on" là tiếp tục, "carry off" là làm thành công, "carry over" là chuyển sang.', en: '"Carry out" means to perform a planned task. "Carry on" means to continue, "carry off" means to succeed at something, and "carry over" means to transfer.' },
  ),
  item(
    'bank:should-have', 'grammar', BANK_KIND.modal, 'medium',
    'You ___ us about the change earlier, so we could have prepared better.',
    'should have told',
    [['should told', 'wrong_verb_form'], ['should tell', 'wrong_verb_form'], ['should have telling', 'wrong_verb_form']],
    { vi: '"Should have + phân từ II" nói về điều đáng lẽ nên làm trong quá khứ nhưng đã không làm.', en: '"Should have + past participle" describes what ought to have been done in the past but was not.' },
  ),
  item(
    'bank:should-arrive', 'grammar', BANK_KIND.modal, 'medium',
    'The package ___ yesterday, but the tracking page still shows it in transit.',
    'should have arrived',
    [['should arrived', 'wrong_verb_form'], ['should arrive', 'wrong_tense'], ['will have arrived', 'wrong_tense']],
    { vi: 'Để nói một việc đáng lẽ đã xảy ra trong quá khứ, dùng "should have + phân từ II". "Yesterday" không đi với "will have" hay "should arrive".', en: 'To say something was expected in the past, use "should have + past participle". "Yesterday" does not go with "will have" or the plain "should arrive".' },
  ),
  item(
    'bank:passive-modal', 'grammar', BANK_KIND.modal, 'medium',
    'Our new software ___ installed by the IT team before the launch.',
    'must be',
    [['must', 'wrong_verb_form'], ['must been', 'wrong_verb_form'], ['must being', 'wrong_verb_form']],
    { vi: 'Bị động với động từ khuyết thiếu: modal + "be" + phân từ II, ví dụ "must be installed".', en: 'Passive with a modal verb: modal + "be" + past participle, for example "must be installed".' },
  ),
  item(
    'bank:implementation', 'part_of_speech', BANK_KIND.word_form, 'medium',
    'The ___ of the new policy will be announced next week.',
    'implementation',
    [['implement', 'wrong_word_form'], ['implemented', 'wrong_word_form'], ['implementing', 'wrong_word_form']],
    { vi: 'Sau "the" và trước "of" cần một danh từ. "Implementation" là danh từ của động từ "implement".', en: 'After "the" and before "of" a noun is needed. "Implementation" is the noun form of the verb "implement".' },
  ),
  item(
    'bank:recognition', 'part_of_speech', BANK_KIND.word_form, 'medium',
    'The manager gave ___ to the team for finishing the project early.',
    'recognition',
    [['recognize', 'wrong_word_form'], ['recognizing', 'wrong_word_form'], ['recognizably', 'wrong_word_form']],
    { vi: 'Sau động từ "gave" cần một danh từ làm tân ngữ. "Recognition" là danh từ; "recognize" là động từ, "recognizably" là trạng từ.', en: 'After the verb "gave", a noun is needed as the object. "Recognition" is the noun; "recognize" is a verb and "recognizably" is an adverb.' },
  ),
  item(
    'bank:experienced', 'part_of_speech', BANK_KIND.word_form, 'medium',
    'Our ___ engineers can solve most problems within a day.',
    'experienced',
    [['experiences', 'wrong_word_form'], ['experiencing', 'wrong_word_form'], ['experiently', 'wrong_word_form']],
    { vi: 'Trước danh từ "engineers" cần một tính từ bổ nghĩa. "Experienced" nghĩa là có kinh nghiệm.', en: 'Before the noun "engineers", an adjective is needed. "Experienced" means having skill gained from experience.' },
  ),
];
