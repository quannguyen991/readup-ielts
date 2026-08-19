import { hashString, mulberry32, shuffle } from './rng';
import { OPTIONS_PER_QUESTION, interleave } from './text-utils';
import type { GeneratedQuestion } from './types';
import type { Article } from '@/data/articles';
import { splitSentences } from '@/services/ingest/readability';

/**
 * Bộ sinh đề cho hai domain "Writing" của SAT Reading and Writing, chạy offline.
 *
 * Bộ sinh SAT đã có mới phủ hai domain đọc hiểu. Đây là hai domain còn lại:
 * Expression of Ideas và Standard English Conventions.
 *
 * Áp nguyên hai điều kiện đã chốt ở spec 2026-08-11: chỉ sinh dạng nào mà đáp
 * án **kiểm chứng được từ chính bài** và **không giải được bằng đối chiếu
 * chuỗi**. Ba dạng dưới đây đạt cả hai vì đáp án là thứ có thật trong câu gốc,
 * và nó bị che đi nên không dò ngược được.
 *
 * KHÔNG sinh `sat_rhetorical_synthesis`: đề dạng đó cho **gạch đầu dòng ghi chú
 * cộng một mục tiêu tu từ**, không phải văn xuôi. Rút gạch đầu dòng máy móc từ
 * prose sẽ ra ghi chú vô nghĩa, hoặc chép lại nguyên câu trả lời nên lộ đáp án.
 * Để dành cho nhánh AI, đúng như đã làm với Central Ideas.
 *
 * GIỚI HẠN ĐÃ ĐO (kho 833 bài SAT, 08/2026):
 * - 3.357 câu, trung bình 4,0 câu mỗi bài.
 * - 16 bài ra 0 câu (1,9%), gần như toàn bộ là đoạn hội thoại: lời thoại bị
 *   loại khỏi dạng Boundaries, và văn thoại thì hiếm khi mở câu bằng từ nối.
 *   Bỏ trống ở đó là đúng — bịa câu hỏi trên nền hội thoại sẽ ra đề sai.
 * - Phân bố lệch: form/structure/sense 2.544, boundaries 615, transitions 198.
 *   Transitions ít vì chỉ nhận từ nối đứng ĐẦU câu và có dấu phẩy ngay sau; nới
 *   ra thì dính "however" giữa câu đóng vai trạng ngữ nhượng bộ, khi đó câu hỏi
 *   có hơn một đáp án đúng.
 * - Bản đầu tiên nhận cả dấu phẩy và dấu hai chấm cho Boundaries nên ra 2.103
 *   câu, nhưng trong đó có câu hỏng (dấu câu trong lời thoại, và câu mà dấu
 *   chấm cũng đúng như dấu chấm phẩy). Siết lại còn 615 câu — ít hơn ba lần,
 *   nhưng mỗi câu chỉ còn đúng một đáp án bảo vệ được.
 */

const TARGET_QUESTIONS = 6;

/**
 * Từ nối nhóm theo quan hệ logic.
 *
 * Nhiễu phải lấy từ nhóm KHÁC nhóm của đáp án: nhiễu cùng quan hệ thì câu hỏi
 * có hai đáp án đúng, mà đó chính là lỗi cần chặn.
 */
const TRANSITION_GROUPS: Record<string, string[]> = {
  contrast: ['However', 'Nevertheless', 'By contrast', 'On the other hand', 'Conversely'],
  addition: ['Moreover', 'Furthermore', 'In addition', 'Similarly', 'Likewise'],
  cause: ['Therefore', 'Consequently', 'As a result', 'Thus', 'Accordingly'],
  example: ['For example', 'For instance', 'Specifically', 'In particular'],
  sequence: ['Subsequently', 'Meanwhile', 'Previously', 'Finally'],
};

/**
 * Cặp hình thái dễ nhầm. Đáp án là dạng có thật trong câu, nhiễu là biến thể
 * của chính nó — người học phải hiểu ngữ pháp mới loại được, không đoán bằng
 * cảm giác lạ/quen.
 */
const FORM_PAIRS: string[][] = [
  ['its', "it's"],
  ['their', 'there', "they're"],
  ['was', 'were'],
  ['has', 'have'],
  ['is', 'are'],
  ['this', 'these'],
  ['fewer', 'less'],
  ['affect', 'effect'],
  ['whose', "who's"],
];

export function generateSatWritingQuestions(article: Article): GeneratedQuestion[] {
  const rng = mulberry32(hashString(`${article.id}:sat-writing`));

  const paragraphs = (article.paragraphs ?? []).filter((p) => p.trim().length > 0);
  const sentences = paragraphs.flatMap((paragraph, index) =>
    splitSentences(paragraph)
      .map((text) => ({ text: text.trim(), paragraphIndex: index }))
      .filter((s) => s.text.split(/\s+/).length >= 6),
  );
  if (sentences.length === 0) return [];

  // Lấy luân phiên giữa ba dạng thay vì trộn chung rồi cắt: mỗi đoạn văn có rất
  // nhiều chỗ khoét được hình thái nhưng chỉ vài chỗ có từ nối, nên trộn chung
  // rồi cắt là dạng đông át hẳn dạng ít.
  const picked = interleave(
    [
      buildTransitions(sentences, rng),
      buildBoundaries(sentences, rng),
      buildFormQuestions(sentences, rng),
    ],
    TARGET_QUESTIONS,
  );

  return picked.map((q, i) => ({ ...q, id: `${article.id}-satw-${i}`, orderIndex: i }));
}

type Sentence = { text: string; paragraphIndex: number };
type Draft = Omit<GeneratedQuestion, 'id' | 'orderIndex'>;

// ---------------------------------------------------------------- Transitions

function buildTransitions(sentences: Sentence[], rng: () => number): Draft[] {
  const out: Draft[] = [];

  for (const s of sentences) {
    const found = findLeadingTransition(s.text);
    if (!found) continue;

    const { word, group } = found;
    // Nhiễu lấy từ ba nhóm quan hệ khác — bảo đảm chỉ một đáp án đúng.
    const otherGroups = Object.keys(TRANSITION_GROUPS).filter((g) => g !== group);
    const distractors = shuffle(otherGroups, rng)
      .slice(0, OPTIONS_PER_QUESTION - 1)
      .map((g) => {
        const list = TRANSITION_GROUPS[g] ?? [];
        return list[Math.floor(rng() * list.length)] ?? 'However';
      });
    if (new Set([word, ...distractors]).size !== OPTIONS_PER_QUESTION) continue;

    out.push({
      type: 'sat_transitions',
      prompt: s.text.replace(word, '______'),
      instruction: 'Which choice completes the text with the most logical transition?',
      options: shuffle([word, ...distractors], rng),
      correctAnswer: word,
      evidenceText: s.text,
      evidenceParagraphIndex: s.paragraphIndex,
      explanation: `Câu này nối với câu trước bằng quan hệ ${GROUP_LABEL[group] ?? group}, nên "${word}" là từ nối đúng. Ba phương án còn lại thuộc quan hệ logic khác.`,
      lessonTip: 'Đọc câu trước rồi hỏi: câu này bổ sung, đối lập, hay là hệ quả?',
    });
  }
  return out;
}

const GROUP_LABEL: Record<string, string> = {
  contrast: 'đối lập',
  addition: 'bổ sung',
  cause: 'nhân quả',
  example: 'ví dụ',
  sequence: 'trình tự',
};

function findLeadingTransition(text: string): { word: string; group: string } | null {
  for (const [group, words] of Object.entries(TRANSITION_GROUPS)) {
    for (const word of words) {
      // Chỉ nhận khi từ nối đứng đầu câu và có dấu phẩy ngay sau — đó mới đúng
      // vai trò nối câu, chứ "however" giữa câu có thể là trạng ngữ nhượng bộ.
      if (text.startsWith(`${word},`)) return { word, group };
    }
  }
  return null;
}

// ----------------------------------------------------------------- Boundaries

/**
 * Chỉ sinh từ chỗ tác giả gốc dùng DẤU CHẤM PHẨY.
 *
 * Ban đầu tôi nhận cả dấu phẩy và dấu hai chấm, và bộ đề ra hai loại câu hỏng:
 * dấu câu trong lời thoại (không phải ranh giới mệnh đề), và câu có hơn một
 * đáp án đúng — thay dấu chấm phẩy bằng dấu chấm thì vẫn đúng ngữ pháp.
 *
 * Cách chữa: chỉ lấy chỗ có dấu chấm phẩy (trong văn xuôi nó gần như luôn nối
 * hai mệnh đề độc lập), và ĐỪNG đưa dấu chấm vào làm nhiễu. Ba nhiễu đều là
 * lỗi thật: nối bằng dấu phẩy là comma splice, bỏ hẳn dấu là run-on, và viết
 * hoa sau dấu chấm phẩy là sai quy tắc. Khi đó chỉ còn đúng một đáp án bảo vệ
 * được.
 */
function buildBoundaries(sentences: Sentence[], rng: () => number): Draft[] {
  const out: Draft[] = [];

  for (const s of sentences) {
    const at = s.text.indexOf('; ');
    if (at < 15 || at > s.text.length - 15) continue;

    // Dấu chấm phẩy trong lời thoại thì không phải ranh giới mệnh đề.
    if (/["“”]/.test(s.text)) continue;

    const after = s.text.slice(at + 2);
    const firstWord = after.split(/\s+/)[0];
    if (!firstWord || firstWord.length < 2) continue;
    // Câu sau bắt đầu bằng tên riêng thì không phân biệt được lỗi viết hoa.
    if (firstWord[0] !== firstWord[0]?.toLowerCase()) continue;

    const correct = `; ${firstWord}`;
    const options = [
      correct,
      `, ${firstWord}`,
      ` ${firstWord}`,
      `; ${firstWord.charAt(0).toUpperCase()}${firstWord.slice(1)}`,
    ];
    if (new Set(options).size !== OPTIONS_PER_QUESTION) continue;

    out.push({
      type: 'sat_boundaries',
      prompt: `${s.text.slice(0, at)} ______ ${after.slice(firstWord.length).trim()}`,
      instruction:
        'Which choice completes the text so that it conforms to the conventions of Standard English?',
      options: shuffle(options, rng),
      correctAnswer: correct,
      evidenceText: s.text,
      evidenceParagraphIndex: s.paragraphIndex,
      explanation:
        'Hai vế đều tự đứng thành câu được, nên phải nối bằng dấu chấm phẩy. Nối bằng dấu phẩy là comma splice, bỏ hẳn dấu là run-on, còn sau dấu chấm phẩy thì không viết hoa.',
      lessonTip: 'Thử tách hai vế thành hai câu riêng: nếu cả hai đều đứng được thì dấu phẩy là sai.',
    });
  }
  return out;
}

// ------------------------------------------------------- Form, Structure, Sense

function buildFormQuestions(sentences: Sentence[], rng: () => number): Draft[] {
  const out: Draft[] = [];

  for (const s of sentences) {
    for (const family of FORM_PAIRS) {
      const answer = family.find((w) => hasWord(s.text, w));
      if (!answer) continue;

      // Nhiễu là các biến thể còn lại của chính từ đó, bù thêm cho đủ bốn.
      const siblings = family.filter((w) => w !== answer);
      const filler = FORM_PAIRS.flat().filter((w) => !family.includes(w));
      const distractors = [
        ...siblings,
        ...shuffle(filler, rng).slice(0, Math.max(0, OPTIONS_PER_QUESTION - 1 - siblings.length)),
      ].slice(0, OPTIONS_PER_QUESTION - 1);
      if (new Set([answer, ...distractors]).size !== OPTIONS_PER_QUESTION) continue;

      const blanked = replaceWord(s.text, answer, '______');
      // Nếu từ đó còn xuất hiện chỗ khác trong câu thì đáp án bị lộ.
      if (hasWord(blanked, answer)) continue;

      out.push({
        type: 'sat_form_structure_sense',
        prompt: blanked,
        instruction:
          'Which choice completes the text so that it conforms to the conventions of Standard English?',
        options: shuffle([answer, ...distractors], rng),
        correctAnswer: answer,
        evidenceText: s.text,
        evidenceParagraphIndex: s.paragraphIndex,
        explanation: `Dạng đúng ở đây là "${answer}". Các phương án còn lại là những hình thái hay bị nhầm với nó.`,
        lessonTip: 'Tìm chủ ngữ thật của động từ, hoặc danh từ mà đại từ đang thay thế.',
      });
      break; // Mỗi câu chỉ khoét một chỗ.
    }
  }
  return out;
}

function hasWord(text: string, word: string): boolean {
  return new RegExp(`\\b${escapeRegExp(word)}\\b`, 'i').test(text);
}

function replaceWord(text: string, word: string, replacement: string): string {
  return text.replace(new RegExp(`\\b${escapeRegExp(word)}\\b`, 'i'), replacement);
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
