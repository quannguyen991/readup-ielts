import { SYNONYMS } from '@/data/paraphrase';
import { splitSentences } from '@/services/ingest/readability';
import type { QuestionType } from '@/types/database';
import {
  QUESTIONS_PER_PASSAGE,
  RULE_SUPPORTED_TYPES,
  blueprintsFor,
  type PassageBlueprint,
} from './blueprint';
import {
  UNSTATED_PREDICATES,
  buildFalse,
  buildNotGiven,
  buildTrue,
  rewordMany,
  usableSentence,
} from './rule-generator';
import { hashString, mulberry32 } from './rng';
import type { GeneratedQuestion, QuestionSet } from './types';
import { verifyQuestion, verifySet } from './verify';

/**
 * Lắp một bộ đề hoàn chỉnh theo bản thiết kế — không gọi model dòng nào.
 *
 * DÂY CHUYỀN, KHÔNG PHẢI MỘT HÀM. Mỗi khối của bản thiết kế được gọi riêng, mỗi
 * câu dựng xong đi qua `verifyQuestion` ngay, hỏng thì bỏ và thử câu nguồn khác.
 * Cuối cùng cả bộ đi qua `verifySet`. Không có đường nào để một câu chưa kiểm lọt
 * ra ngoài.
 *
 * THIẾU THÌ NÓI THIẾU. Bài quá ngắn hoặc nghèo từ có thể không đủ câu nguồn cho
 * trọn 13 câu. Lúc ấy bộ đề trả về ít câu hơn chứ KHÔNG hạ chuẩn để cho đủ số —
 * một câu đoán được làm hỏng cả bộ nặng hơn là thiếu một câu.
 */

/** Câu trong bài, kèm chỗ nó đứng. */
type Source = { text: string; paragraphIndex: number };

function collectSources(paragraphs: string[]): Source[] {
  const out: Source[] = [];
  paragraphs.forEach((p, paragraphIndex) => {
    for (const text of splitSentences(p)) {
      if (usableSentence(text)) out.push({ text, paragraphIndex });
    }
  });
  return out;
}

const WORD = /[A-Za-z][A-Za-z'-]*/g;

/** Những từ mở đầu vị ngữ — dùng để cắt chủ ngữ ra khỏi câu. */
const VERBS = new Set([
  'is', 'are', 'was', 'were', 'has', 'have', 'had', 'can', 'could', 'will', 'would',
  'may', 'might', 'must', 'should', 'do', 'does', 'did', 'became', 'become', 'remains',
]);

/** Từ chức năng không được đứng cuối một chủ ngữ. */
const TRAILING = new Set([
  'the', 'a', 'an', 'of', 'in', 'on', 'at', 'to', 'for', 'and', 'or', 'with', 'by', 'from', 'that', 'which',
]);

/**
 * Từ chức năng dài — không được khoét làm chỗ trống.
 *
 * Luật "chỉ khoét từ từ sáu chữ cái trở lên" chặn được `the`, `of`, `and`, nhưng
 * lọt `another`, `because`, `however`. Khoét trúng chúng thì đề thành bài kiểm
 * tra ngữ pháp điền chỗ trống: người học đoán được bằng cấu trúc câu mà không
 * cần tìm trong bài, tức là mất đúng thứ dạng điền từ định đo.
 */
const FUNCTION_WORDS = new Set([
  'another', 'because', 'before', 'during', 'however', 'therefore', 'although',
  'though', 'between', 'through', 'without', 'within', 'across', 'against',
  'towards', 'besides', 'instead', 'whether', 'whereas', 'meanwhile', 'moreover',
  'further', 'others', 'anything', 'something', 'nothing', 'everything', 'itself',
  'themselves', 'having', 'become', 'became', 'usually', 'already',
  'almost', 'always', 'perhaps', 'rather', 'either', 'neither', 'around', 'behind',
]);

/** Từ mở đầu một trạng ngữ — câu bắt đầu bằng chúng thì chủ ngữ không nằm ở đầu. */
const ADJUNCT_HEAD = new Set([
  'in', 'on', 'at', 'by', 'for', 'from', 'during', 'after', 'before', 'since', 'until',
  'although', 'though', 'while', 'when', 'if', 'because', 'as', 'despite', 'unlike',
  'however', 'therefore', 'moreover', 'meanwhile', 'today', 'with', 'without', 'to',
]);

/** Chủ ngữ xấp xỉ: phần đứng trước động từ đầu tiên, tối đa năm từ. */
function subjectOf(sentence: string): string {
  const words = sentence.replace(/[.!?]+$/, '').split(/\s+/);
  const at = words.findIndex((w) => VERBS.has(w.toLowerCase().replace(/[^a-z]/g, '')));
  const take = at > 0 ? Math.min(at, 5) : Math.min(4, words.length);
  const chunk = words.slice(0, take);
  /*
    Cắt đuôi từ chức năng.

    "A large part of the" là chủ ngữ cụt — ghép vị ngữ vào ra câu không đọc được.
    Bỏ dần từ cuối cho tới khi chạm một từ mang nghĩa.
  */
  while (chunk.length > 1 && TRAILING.has((chunk[chunk.length - 1] ?? '').toLowerCase())) chunk.pop();
  return chunk.join(' ');
}

/**
 * Chủ ngữ dùng được để ghép vào lời dẫn, hoặc chuỗi rỗng nếu không cắt ra được.
 *
 * `subjectOf` chỉ cắt tới động từ đầu tiên, mà câu mở bằng trạng ngữ thì động từ
 * ấy đứng sau cả cụm trạng ngữ: "In March 2022, another mass bleaching event was
 * confirmed" cắt ra "In March 2022, another mass", và lời dẫn thành "which
 * statement about in march 2022, another mass is correct?".
 *
 * Không đoán bừa. Câu nào không cắt ra được chủ ngữ sạch thì bỏ, đi tìm câu khác
 * — dạng trắc nghiệm dựng được ở 94% số chỗ nên thừa sức kén.
 */
function cleanSubject(sentence: string): string {
  const subject = subjectOf(sentence);
  const words = subject.split(/\s+/).filter(Boolean);
  if (words.length < 2 || words.length > 5) return '';
  if (/[,;:()"]/.test(subject) || /\d/.test(subject)) return '';
  if (ADJUNCT_HEAD.has((words[0] as string).toLowerCase())) return '';
  return subject;
}

/** Đổi tối đa `limit` từ sang từ đồng nghĩa; `null` nếu không đổi được chỗ nào. */
function reword(
  sentence: string,
  seed: string,
  limit = 1,
): { text: string; swapped: string; swaps: number } | null {
  const { text, swaps } = rewordMany(sentence, seed, limit);
  if (swaps.length === 0) return null;
  return { text, swapped: (swaps[0] as [string, string])[0], swaps: swaps.length };
}

function mkQuestion(
  base: {
    type: QuestionType;
    prompt: string;
    correctAnswer: string;
    options: string[] | null;
    explanation: string;
  },
  source: Source,
  index: number,
  articleId: string,
): GeneratedQuestion {
  return {
    id: `${articleId}-q${index + 1}`,
    orderIndex: index,
    type: base.type,
    prompt: base.prompt,
    instruction: null,
    options: base.options,
    correctAnswer: base.correctAnswer,
    evidenceText: source.text,
    evidenceParagraphIndex: source.paragraphIndex,
    explanation: base.explanation,
    lessonTip: null,
  };
}

/**
 * Nhãn mục tiêu cho một khối TFNG/YNNG, rải đều ba nhãn.
 *
 * Không bốc ngẫu nhiên từng câu: bốc ngẫu nhiên bảy lần thì hoàn toàn có thể ra
 * bảy nhãn giống nhau, và `verifySet` sẽ đánh hỏng cả bộ. Rải sẵn theo vòng rồi
 * xáo thứ tự thì vừa đủ ba nhãn, vừa không đoán được theo vị trí câu.
 */
function labelPlan(count: number, seed: string): ('TRUE' | 'FALSE' | 'NOT GIVEN')[] {
  const cycle: ('TRUE' | 'FALSE' | 'NOT GIVEN')[] = ['TRUE', 'FALSE', 'NOT GIVEN'];
  const plan = Array.from({ length: count }, (_, i) => cycle[i % 3] as (typeof cycle)[number]);
  const rng = mulberry32(hashString(`labels:${seed}`));
  return plan.sort(() => rng() - 0.5);
}

export type BuildInput = {
  id: string;
  title: string;
  paragraphs: string[];
};

export function buildRuleQuestionSet(
  article: BuildInput,
  blueprint: PassageBlueprint,
): QuestionSet {
  const sources = collectSources(article.paragraphs);
  const used = new Set<string>();
  /*
    Dap an dien tu KHONG duoc lap lai trong cung mot bo.

    Do tren bai that: mot khoi bon cho trong ra hai lan dap an "forest". Nguoi
    hoc dien trung mot cho la doan duoc cho con lai, va cai duoc do khong con la
    ky nang tim tu trong bai nua.
  */
  const usedAnswers = new Set<string>();
  const FREE_TEXT = new Set(['sentence_completion', 'summary_completion', 'short_answer']);
  const questions: GeneratedQuestion[] = [];

  /*
    Danh sách câu nguồn còn trống, xếp theo đoạn ít bị dùng nhất.

    Trả về CẢ DANH SÁCH chứ không trả từng câu, và chỉ đánh dấu đã dùng khi câu
    hỏi được NHẬN. Bản đầu đánh dấu ngay cả khi dựng hỏng, nên mỗi câu hỏi có
    thể đốt sáu câu nguồn — một bài ba mươi câu nguồn cạn sạch sau năm câu hỏi,
    và bộ đề ra 1,9 câu thay vì 13.
  */
  const freeSources = (): Source[] => {
    const counts = new Map<number, number>();
    for (const q of questions) {
      counts.set(q.evidenceParagraphIndex, (counts.get(q.evidenceParagraphIndex) ?? 0) + 1);
    }
    return sources
      .filter((s) => !used.has(s.text))
      .sort((a, b) => (counts.get(a.paragraphIndex) ?? 0) - (counts.get(b.paragraphIndex) ?? 0));
  };

  for (const block of blueprint.blocks) {
    const labels = labelPlan(block.count, `${article.id}:${block.type}`);

    for (let i = 0; i < block.count; i += 1) {
      let made: GeneratedQuestion | null = null;

      /*
        Duyệt câu nguồn còn trống cho tới khi dựng được MỘT câu đạt.

        Không phải câu nào cũng dựng được mọi nhãn: câu không có từ đồng nghĩa
        thì không ra TRUE, câu không có lượng từ hay con số thì không ra FALSE.
        Nên phải đi tìm câu hợp, chứ không phải ép câu đầu tiên.
      */
      for (const source of freeSources()) {
        const seed = `${article.id}:${block.type}:${i}:${source.paragraphIndex}`;
        const candidate = buildOne(
          block.type,
          source,
          seed,
          article,
          labels[i] as string,
          questions.length,
          sources.filter((x) => x.paragraphIndex === source.paragraphIndex),
        );
        if (!candidate) continue;

        const answerKey = candidate.correctAnswer.trim().toLowerCase();
        if (FREE_TEXT.has(candidate.type) && usedAnswers.has(answerKey)) continue;

        if (verifyQuestion(candidate, article.paragraphs).ok) {
          made = candidate;
          used.add(source.text);
          if (FREE_TEXT.has(candidate.type)) usedAnswers.add(answerKey);
          break;
        }
      }

      if (made) questions.push(made);
    }
  }

  /*
    Cả bộ phải qua `verifySet`. Không qua thì bỏ dần câu cuối của khối gây lỗi
    cho tới khi qua — thà bộ đề ngắn hơn còn hơn một bộ đoán được.
  */
  let final = questions;
  while (final.length > 3 && !verifySet(final, article.paragraphs).ok) {
    final = final.slice(0, -1);
  }

  return {
    articleId: article.id,
    title: `Bộ đề: ${article.title}`,
    generatedBy: 'offline',
    model: 'rule-engine',
    createdAt: new Date().toISOString(),
    questions: final.map((q, i) => ({ ...q, orderIndex: i })),
  };
}

/**
 * Bộ đề tốt nhất mà BÀI NÀY gánh được, trong số các bố cục hợp lệ của vị trí.
 *
 * Đây là cửa nên gọi từ bên ngoài. `buildRuleQuestionSet` lắp theo đúng một bố
 * cục đã cho; hàm này thử lần lượt các bố cục của vị trí và giữ cái lấp được
 * nhiều câu nhất, dừng ngay khi có bố cục đủ mười ba câu.
 *
 * Tất định như nhau: thứ tự thử do `article.id` quyết định, nên cùng một bài thì
 * lần nào cũng ra cùng bộ đề. Ưu tiên bố cục đầu tiên khi hoà — không đổi bố cục
 * chỉ vì một câu.
 */
export function buildBestRuleQuestionSet(article: BuildInput, position: 1 | 2 | 3): QuestionSet {
  let best: QuestionSet | null = null;
  for (const bp of blueprintsFor(position, article.id)) {
    const set = buildRuleQuestionSet(article, bp);
    if (set.questions.length >= QUESTIONS_PER_PASSAGE) return set;
    if (!best || set.questions.length > best.questions.length) best = set;
  }
  return best as QuestionSet;
}

function buildOne(
  type: QuestionType,
  source: Source,
  seed: string,
  article: BuildInput,
  label: string,
  index: number,
  /** Cac cau khac trong cung doan — kho phuong an nhieu du phong. */
  neighbours: Source[],
): GeneratedQuestion | null {
  const passage = article.paragraphs.join(' ');

  if (type === 'true_false_not_given' || type === 'yes_no_not_given') {
    const yn = type === 'yes_no_not_given';
    const map = (l: string) => (yn ? (l === 'TRUE' ? 'YES' : l === 'FALSE' ? 'NO' : l) : l);

    if (label === 'NOT GIVEN') {
      const subject = cleanSubject(source.text);
      if (!subject) return null;
      /*
        Duyet ca bo vi ngu, khong boc mot cai roi bo cuoc.

        Vi ngu nao trung tu noi dung voi bai thi bi loai — va bai cang gan chu de
        thi cang nhieu vi ngu bi loai. Boc mot cai duy nhat thi cau nguon tot bi
        bo phi chi vi rut trung cai khong dung.
      */
      const rng = mulberry32(hashString(`ng:${seed}`));
      const start = Math.floor(rng() * UNSTATED_PREDICATES.length);
      let claim: ReturnType<typeof buildNotGiven> = null;
      for (let k = 0; k < UNSTATED_PREDICATES.length && !claim; k += 1) {
        const clause = UNSTATED_PREDICATES[(start + k) % UNSTATED_PREDICATES.length] as string;
        claim = buildNotGiven(subject, clause, passage);
      }
      if (!claim) return null;
      return mkQuestion(
        { type, prompt: claim.text, correctAnswer: map('NOT GIVEN'), options: null, explanation: claim.why },
        source,
        index,
        article.id,
      );
    }

    const claim = label === 'TRUE' ? buildTrue(source.text, seed) : buildFalse(source.text, seed);
    if (!claim) return null;
    return mkQuestion(
      { type, prompt: claim.text, correctAnswer: map(claim.label), options: null, explanation: claim.why },
      source,
      index,
      article.id,
    );
  }

  if (type === 'multiple_choice') {
    const about = cleanSubject(source.text);
    if (!about) return null;
    const right = buildTrue(source.text, `${seed}:ok`);
    if (!right) return null;
    const wrongs: string[] = [];
    const take = (claim: { text: string } | null) => {
      if (!claim || claim.text === right.text || wrongs.includes(claim.text)) return;
      if (wrongs.length < 3) wrongs.push(claim.text);
    };
    /*
      CHI MOT phuong an nhieu lay tu chinh cau nguon.

      Do tren bai that: ba phuong an cung dung tu mot cau chi khac nhau dung mot
      chu — "at a lower rate" / "at a higher rate" / "in the few recent decades".
      Cau hoi bien thanh tro tim cho khac nhau giua ba dong gan giong het, chu
      khong con la doc hieu. De that trai phuong an ra khap bai.
    */
    take(buildFalse(source.text, `${seed}:a`));
    /*
      Thieu phuong an nhieu thi lay tu CAU KHAC trong cung doan.

      Mot cau chi de ra toi da hai ba cach pha luat, nen ep du bon phuong an tu
      mot cau lam hong mot phan tu so cho trac nghiem. De that cung khong lay ca
      bon phuong an tu mot cau: phuong an nhieu tro ve nhung cho khac cua bai,
      va nguoi hoc phai doi chieu tung cho mot moi loai duoc.
    */
    for (const near of neighbours) {
      if (wrongs.length === 3) break;
      if (near.text === source.text) continue;
      take(buildFalse(near.text, `${seed}:near:${near.text.length}`));
    }
    /*
      Van thieu thi moi quay lai vet them tu cau nguon.

      Doan chi co mot cau dung duoc thi khong con cho nao khac de lay; luc ay hai
      phuong an gan giong nhau van hon la mat han cau hoi.
    */
    for (const salt of ['b', 'c', 'd', 'e']) {
      if (wrongs.length === 3) break;
      take(buildFalse(source.text, `${seed}:${salt}`));
    }
    if (wrongs.length < 3) return null;

    const rng = mulberry32(hashString(`mc:${seed}`));
    const options = [right.text, ...wrongs].sort(() => rng() - 0.5);
    return mkQuestion(
      {
        type,
        prompt: `According to the passage, which statement about ${about.toLowerCase()} is correct?`,
        correctAnswer: right.text,
        options,
        explanation: `${right.why} Ba phương án còn lại đều lệch khỏi bài ở đúng một chỗ.`,
      },
      source,
      index,
      article.id,
    );
  }

  if (type === 'matching_information') {
    /*
      Dạng này đòi NÓI LẠI cho ra hồn, không phải đổi một chữ.

      Đề hỏi "ý này nằm ở đoạn nào" — nếu lời dẫn gần như chép câu trong bài thì
      người học quét mắt tìm chuỗi là ra đoạn, không cần hiểu gì. Bắt phải đổi
      được ít nhất ba chỗ: câu nào không đủ vốn từ để nói lại thì không dùng làm
      dạng này, thà thiếu câu còn hơn có câu quét được.
    */
    /*
      Lá»i dáº«n dáº¡ng nÃ y ngáº¯n. Ä?á»? tháº­t viáº¿t má»™t máº¡ch má»™t Ã½; láº¥y nguyÃªn má»™t cÃ¢u
      ba mÆ°Æ¡i chá»¯ lÃ m lá»i dáº«n thÃ¬ ngÆ°á»?i há»c dÃ² chuá»—i ra Ä‘oáº¡n trÆ°á»›c khi ká»‹p hiá»ƒu.
    */
    const wordCount = (source.text.match(WORD) ?? []).length;
    if (wordCount > 22) return null;
    const worded = reword(source.text, `mi:${seed}`, 3);
    if (!worded || worded.swaps < 3) return null;
    const letters = article.paragraphs.map((_, i) => String.fromCharCode(65 + i)).slice(0, 8);
    if (source.paragraphIndex >= letters.length) return null;
    return mkQuestion(
      {
        type,
        prompt: worded.text,
        correctAnswer: letters[source.paragraphIndex] as string,
        options: letters,
        explanation: `Ý này nằm ở đoạn ${source.paragraphIndex + 1}, được nói lại bằng chữ khác ("${worded.swapped}").`,
      },
      source,
      index,
      article.id,
    );
  }

  if (type === 'sentence_completion' || type === 'summary_completion') {
    /*
      Noi lai duoc thi tot, khong duoc thi van dung cau goc.

      Ho dien tu von lay chinh cau trong bai lam khung roi khoet mot cho, nen no
      duoc mien luat chong chep. Bat buoc phai doi duoc mot tu dong nghia la them
      mot dieu kien khong lien quan, va do la cho mat mot phan nam so cau.
    */
    const worded = reword(source.text, `sc:${seed}`) ?? { text: source.text, swapped: '', swaps: 0 };
    /*
      Khoét một từ mà KHÔNG PHẢI từ vừa đổi.

      Khoét đúng từ vừa đổi thì đáp án là từ đồng nghĩa chứ không phải chữ trong
      bài, và luật "đáp án phải có thật trong bài" sẽ đánh hỏng ngay.
    */
    const words = worded.text.match(WORD) ?? [];
    /*
      Chỉ khoét chữ THƯỜNG, không khoét chữ hoa giữa câu.

      Chữ hoa giữa câu gần như luôn là một mảnh của tên riêng, và khoét nó ra thì
      đề thành "The Great ________ Reef" — người học điền được bằng cách nhớ tên,
      không phải bằng cách đọc.
    */
    const target = words.find(
      (w) =>
        w.length >= 6 &&
        w === w.toLowerCase() &&
        !FUNCTION_WORDS.has(w) &&
        w.toLowerCase() !== worded.swapped.toLowerCase() &&
        passage.includes(w),
    );
    if (!target) return null;
    const prompt = worded.text.replace(new RegExp(`\\b${target}\\b`), '________');
    if (prompt === worded.text) return null;
    return mkQuestion(
      {
        type,
        prompt: type === 'summary_completion' ? `– ${prompt}` : prompt,
        correctAnswer: target,
        options: null,
        explanation: `Chỗ trống lấy đúng chữ trong bài: "${target}" (đoạn ${source.paragraphIndex + 1}).`,
      },
      source,
      index,
      article.id,
    );
  }

  if (type === 'short_answer') {
    const year = source.text.match(/\b(1[6-9]\d{2}|20\d{2})\b/);
    if (year) {
      const rest = source.text.replace(year[0], '____').replace(/[.!?]+$/, '');
      return mkQuestion(
        {
          type,
          prompt: `In which year did this happen: ${rest}?`,
          correctAnswer: year[0],
          options: null,
          explanation: `Năm nêu trong bài là ${year[0]} (đoạn ${source.paragraphIndex + 1}).`,
        },
        source,
        index,
        article.id,
      );
    }

    const pair = source.text.match(/\b(\d[\d,.]*)\s+([a-z]{4,})\b/);
    if (!pair) return null;
    return mkQuestion(
      {
        type,
        prompt: `How many ${pair[2]} does the passage mention?`,
        correctAnswer: pair[1] as string,
        options: null,
        explanation: `Con số nêu trong bài là ${pair[1]} (đoạn ${source.paragraphIndex + 1}).`,
      },
      source,
      index,
      article.id,
    );
  }

  return null;
}

/**
 * Bộ đề LUYỆN XEN KẼ DẠNG BÀI — cố tình trộn dạng, không đi thành khối.
 *
 * Đây là mặt trái của `buildBestRuleQuestionSet`, và có chủ đích. Đề thi thật đi
 * thành khối nên phải luyện đúng nhịp ấy; nhưng lúc mới học thì chính việc NHẬN
 * RA mình đang gặp dạng gì lại là kỹ năng riêng, và khối đề đồng nhất che mất nó
 * — làm bảy câu TRUE/FALSE liền thì tới câu thứ hai đã không còn đọc lời dẫn.
 *
 * Nên hai nhánh, hai mục đích: vào phòng thi thì làm bộ theo khối, luyện dạng
 * thì làm bộ trộn này.
 */
export function buildMixedRuleQuestionSet(article: BuildInput): QuestionSet {
  const blocks = RULE_SUPPORTED_TYPES.map((type) => ({ type, count: 2 }));
  const set = buildRuleQuestionSet(article, { position: 2, blocks });

  /*
    Xáo lại để hai câu cùng dạng không dính nhau.

    Xáo TẤT ĐỊNH theo id bài: cùng một bài thì lần nào mở cũng ra đúng thứ tự ấy,
    nếu không thì "làm lại bài cũ" không so được với lần trước.
  */
  const rng = mulberry32(hashString(`mixed:${article.id}`));
  const shuffled = [...set.questions].sort(() => rng() - 0.5);
  return { ...set, questions: shuffled.map((q, i) => ({ ...q, orderIndex: i })) };
}
