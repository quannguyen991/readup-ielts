import {
  AMBIGUOUS_SUBORDINATORS,
  BE_FORMS,
  CONTRACTIONS,
  DETERMINERS,
  DO_FORMS,
  FREQUENCY_ADVERBS,
  HAVE_FORMS,
  IMPERATIVE_VERBS,
  LINKING_VERBS,
  MODALS,
  NEGATIVE_AUX,
  PLACE_WORDS,
  PREPOSITIONS,
  PRONOUN_OBJECT_SET,
  PRONOUN_SUBJECT,
  RELATIVE_PRONOUNS,
  SUBORDINATORS,
  TIME_WORDS,
  isAdjectiveLike,
  isAdverbLike,
  isVerbForm,
  norm,
  verbReadings,
  type VerbReading,
} from './lexicon';

/**
 * Phân tích một câu tiếng Anh thành MỆNH ĐỀ và KHỐI (chủ ngữ, động từ, tân ngữ,
 * bổ ngữ, trạng ngữ…) bằng luật — không gọi AI.
 *
 * ĐÂY LÀ BỘ CHIA KHỐI, KHÔNG PHẢI BỘ PHÂN TÍCH CÚ PHÁP. Nó dựa vào từ điển nhỏ
 * (`lexicon.ts`) và vị trí từ, nên chắc với câu đơn/ghép/phức thông dụng ở trình
 * độ A2–C1 của kho luyện, và có thể lệch ở câu lồng nhiều tầng. Nguyên tắc: khi
 * không chắc thì BỎ khối đó (`complete=false`), tuyệt đối không bịa vai trò. Chỗ
 * nào hiển thị kết quả phải dùng cờ này.
 */

export type Role =
  | 'connector'
  | 'subject'
  | 'verb'
  | 'object'
  | 'indirect'
  | 'complement'
  | 'time'
  | 'place'
  | 'manner'
  | 'reason'
  | 'purpose'
  | 'adverbial'
  | 'relative'
  | 'rest';

export type Chunk = { role: Role; text: string };

export type ClauseKind = 'main' | 'coordinate' | 'subordinate' | 'relative' | 'that' | 'infinitive';

export type TenseKey =
  | 'present-simple'
  | 'past-simple'
  | 'present-continuous'
  | 'past-continuous'
  | 'present-perfect'
  | 'past-perfect'
  | 'future-simple'
  | 'be-going-to'
  | 'modal'
  | 'imperative'
  | 'infinitive'
  | 'participle';

export type VerbGroup = {
  text: string;
  tense: TenseKey;
  passive: boolean;
  negative: boolean;
  /** Động từ chính ở dạng gốc, nếu nhận ra. */
  base: string | null;
  modal: string | null;
  /** Có phải động từ "be" làm động từ chính (be + bổ ngữ). */
  linking: boolean;
};

export type Clause = {
  kind: ClauseKind;
  connector: string | null;
  text: string;
  chunks: Chunk[];
  verb: VerbGroup | null;
};

export type SentenceAnalysis = {
  text: string;
  words: string[];
  clauses: Clause[];
  /** Mọi mệnh đề đều tìm được động từ. */
  complete: boolean;
  /**
   * Qua được các phép tự kiểm (mỗi mệnh đề có chủ ngữ + động từ, không khối nào
   * chứa trợ động từ lạc chỗ). Chỉ khi `true` mới nên hiển thị từng khối.
   */
  trusted: boolean;
  type: 'simple' | 'compound' | 'complex' | 'compound-complex' | 'fragment';
  mainVerb: VerbGroup | null;
  isImperative: boolean;
  isQuestion: boolean;
};

type Tok = { raw: string; w: string; comma: boolean; end: boolean };

function tokenize(text: string): Tok[] {
  const parts = text.trim().replace(/\s+/g, ' ').split(' ').filter(Boolean);
  return parts.map((raw, i) => {
    const comma = /[,;:]$/.test(raw) || /[,;:]["”’']?$/.test(raw);
    const end = i === parts.length - 1;
    return { raw: raw.replace(/[,;:.!?"”“]+$/g, '').replace(/^["“]/, ''), w: norm(raw), comma, end };
  });
}

function textOf(toks: Tok[], from: number, to: number): string {
  return toks
    .slice(from, to)
    .map((t, i, arr) => t.raw + (t.comma && i < arr.length - 1 ? ',' : ''))
    .join(' ');
}

const COMPLEMENT_VERBS = new Set(
  `say said says argue argued argues believe believed believes think thought thinks claim claimed claims suggest suggested suggests show
shown showed shows found find finds know knew knows hope hoped hopes realise realize realised realized recommend recommended recommends
warn warned warns ensure ensured prove proved proves report reported reports discover discovered discovers explain explained mention
mentioned notice noticed agree agreed decide decided imagine imagined feel felt learn learned understand understood remember remembered
forget forgot insist insisted reveal revealed indicate indicated demonstrate demonstrated sure certain aware convinced evidence fact
idea belief claim`.split(/\s+/),
);

const AUX_ANY = (w: string) =>
  BE_FORMS.has(w) || HAVE_FORMS.has(w) || DO_FORMS.has(w) || MODALS.has(w) || NEGATIVE_AUX[w] !== undefined || CONTRACTIONS[w] !== undefined;

function isNounish(w: string): boolean {
  return (
    !DETERMINERS.has(w) &&
    !PREPOSITIONS.has(w) &&
    !AUX_ANY(w) &&
    !isAdjectiveLike(w) &&
    !isAdverbLike(w) &&
    !PRONOUN_SUBJECT.has(w) &&
    !['and', 'or', 'but', 'so', 'to', 'not'].includes(w)
  );
}

/** Token này có thể là động từ chia ĐỨNG SAU một danh từ làm chủ ngữ không? */
function startsFiniteVerb(toks: Tok[], i: number, subjectStart: number): boolean {
  const t = toks[i]!;
  if (AUX_ANY(t.w)) return true;
  if (i === subjectStart) return false;
  const prev = toks[i - 1]!;
  const readings = verbReadings(t.w).filter((r) => r.form !== 'ing');
  if (readings.length === 0) return false;
  // Sau từ hạn định/tính từ/giới từ là danh từ ("public transport"), không phải động từ.
  if (!isNounish(prev.w) && !isAdverbLike(prev.w) && !PRONOUN_SUBJECT.has(prev.w)) return false;
  // "pp" hoặc "ing" thuần mà trước đó không có aux thì không phải động từ chia.
  if (readings.every((r) => r.form === 'pp') && !/ed$/.test(t.w)) return false;
  return true;
}

/** Quét cụm danh từ bắt đầu ở i, trả về chỉ số kết thúc (không gồm). */
function scanNP(toks: Tok[], i: number, opts: { subject?: boolean; start?: number } = {}): number {
  const n = toks.length;
  let j = i;
  const start = opts.start ?? i;
  while (j < n) {
    const t = toks[j]!;
    if (j > i) {
      if (toks[j - 1]!.comma) break;
      if (PREPOSITIONS.has(t.w) && t.w !== 'of') {
        if (opts.subject && t.w !== 'to') {
          // Chủ ngữ có thể kèm giới từ ("Many people in this city", "Cities with a green rate").
          j = scanNP(toks, j + 1, { subject: true, start });
          continue;
        }
        break;
      }
      if (opts.subject && (t.w === 'and' || t.w === 'or') && toks[j + 1] && !PRONOUN_SUBJECT.has(toks[j + 1]!.w) && !AUX_ANY(toks[j + 1]!.w) && !isVerbForm(toks[j + 1]!.w)) {
        j += 1;
        continue;
      }
      if (['and', 'or', 'but', 'so', 'to', 'than'].includes(t.w)) break;
      if (opts.subject && (isAdverbLike(t.w) || t.w === 'not' || t.w === 'never')) break;
      if (SUBORDINATORS.has(t.w) || RELATIVE_PRONOUNS.has(t.w)) break;
      if (AUX_ANY(t.w)) break;
      if (isVerbForm(t.w) && opts.subject && startsFiniteVerb(toks, j, start)) break;
      // "a recycling programme last year" — mốc thời gian đứng ngay sau tân ngữ.
      if (!opts.subject && ['last', 'next', 'every', 'this'].includes(t.w) && toks[j + 1] && TIME_WORDS.has(toks[j + 1]!.w)) break;
      if (!opts.subject && isAdverbLike(t.w) && /ly$/.test(t.w) && j > i) break;
      if (!opts.subject && t.w === 'that' ) break;
      if (!opts.subject && PRONOUN_SUBJECT.has(t.w)) break;
    }
    if (t.w === 'of' && j > i) {
      // "of" gắn PP vào cụm danh từ.
      j += 1;
      j = scanNP(toks, j, { subject: false, start: j });
      continue;
    }
    j += 1;
    if (t.comma) break;
  }
  return Math.max(j, i + 1);
}

function classifyAdverbial(toks: Tok[], from: number, to: number): Role {
  const ws = toks.slice(from, to).map((t) => t.w);
  const first = ws[0] ?? '';
  const joined = ws.join(' ');
  if (/^(because of|due to|owing to|thanks to)/.test(joined)) return 'reason';
  if (/^(in order to|so as to)/.test(joined)) return 'purpose';
  if (ws.some((w) => TIME_WORDS.has(w)) || ws.some((w) => /^\d{1,2}(:\d\d)?$/.test(w)) || /^(always|usually|often|sometimes|never|rarely)$/.test(first)) {
    // "in the morning", "at nine o'clock", "for three hours", "last year"
    return 'time';
  }
  if (PREPOSITIONS.has(first)) {
    if (['in', 'at', 'on', 'near', 'along', 'across', 'opposite', 'between', 'behind', 'beside', 'under', 'over', 'around', 'through', 'inside', 'outside', 'above', 'below', 'toward', 'towards', 'from', 'into', 'onto'].includes(first)) {
      return first === 'from' || first === 'into' || first === 'onto' || first === 'to' ? 'place' : 'place';
    }
    if (first === 'to') return 'place';
    if (first === 'with' || first === 'by' || first === 'like' || first === 'without') return 'manner';
    if (first === 'for') return 'purpose';
    if (first === 'despite') return 'adverbial';
  }
  if (PLACE_WORDS.has(first)) return 'place';
  if (isAdverbLike(first)) return /ly$/.test(first) ? 'manner' : 'adverbial';
  return 'adverbial';
}

function groupVerb(toks: Tok[], from: number, to: number): VerbGroup {
  const ws = toks.slice(from, to).map((t) => t.w);
  const text = textOf(toks, from, to);
  const expanded: string[] = [];
  for (const w of ws) {
    const c = CONTRACTIONS[w];
    if (c) expanded.push(c[1]);
    else if (NEGATIVE_AUX[w] !== undefined) expanded.push(NEGATIVE_AUX[w]!, 'not');
    else if (/n't$/.test(w)) expanded.push(w.slice(0, -3), 'not');
    else expanded.push(w);
  }
  const negative = expanded.includes('not') || expanded.includes('never');
  const core = expanded.filter((w) => w !== 'not' && w !== 'never' && !isAdverbLike(w));
  const modal = core.find((w) => MODALS.has(w)) ?? null;
  const last = core[core.length - 1] ?? '';
  const lastReadings: VerbReading[] = verbReadings(last);
  const hasBe = core.some((w) => BE_FORMS.has(w));
  const hasHave = core.some((w) => HAVE_FORMS.has(w));
  const lastIsIng = lastReadings.some((r) => r.form === 'ing') || /ing$/.test(last);
  const lastIsPP = lastReadings.some((r) => r.form === 'pp') || /ed$/.test(last);
  const past = core.some((w) => ['was', 'were', 'had', 'did'].includes(w));

  let tense: TenseKey = 'present-simple';
  let passive = false;
  let linking = false;
  let base: string | null = null;

  const mainReading = lastReadings.find((r) => r.form !== 'base') ?? lastReadings[0];
  if (mainReading) base = mainReading.base;
  if (BE_FORMS.has(last) || (core.length === 1 && last === 'be')) {
    linking = true;
    base = 'be';
  }

  if (core[0] === 'be' && core.length === 1) {
    tense = 'imperative';
  } else if (core.length >= 2 && core[0] === 'be' && core[1] === 'going' && core.includes('to')) {
    tense = 'be-going-to';
  } else if (modal === 'will' || modal === "won't" || (modal === 'shall')) {
    tense = 'future-simple';
    if (core.includes('be') && lastIsPP) passive = true;
  } else if (modal) {
    tense = 'modal';
    if (core.includes('be') && lastIsPP && core.length > 2) passive = true;
    if (core.includes('have') && lastIsPP) tense = 'modal';
  } else if (hasHave && !DO_FORMS.has(core[0] ?? '') && (lastIsPP || core.includes('been') || (core.length === 1 && HAVE_FORMS.has(core[0]!) === false))) {
    tense = core[0] === 'had' ? 'past-perfect' : 'present-perfect';
    if (core.includes('been') && lastIsPP && core[core.length - 1] !== 'been') passive = true;
  } else if (hasBe && lastIsIng && core.length >= 2) {
    tense = past ? 'past-continuous' : 'present-continuous';
  } else if (hasBe && lastIsPP && core.length >= 2 && !BE_FORMS.has(last)) {
    tense = past ? 'past-simple' : 'present-simple';
    passive = true;
  } else if (core.length === 1 || (core.length === 2 && DO_FORMS.has(core[0]!))) {
    const only = core[core.length - 1]!;
    if (DO_FORMS.has(core[0] ?? '') && core.length === 2) tense = core[0] === 'did' ? 'past-simple' : 'present-simple';
    else if (BE_FORMS.has(only)) tense = ['was', 'were'].includes(only) ? 'past-simple' : 'present-simple';
    else if (HAVE_FORMS.has(only)) tense = only === 'had' ? 'past-simple' : 'present-simple';
    else if (mainReading?.form === 'past') tense = 'past-simple';
    else tense = 'present-simple';
  } else if (past) {
    tense = 'past-simple';
  }

  return { text, tense, passive, negative, base, modal, linking };
}

/** Chia một đoạn token (một mệnh đề) thành các khối. */
function chunkClause(toks: Tok[], kind: ClauseKind): { chunks: Chunk[]; verb: VerbGroup | null; imperative: boolean } {
  const chunks: Chunk[] = [];
  const n = toks.length;
  let i = 0;

  // Từ nối ở đầu mệnh đề (because, although, who, and…).
  let connectorEnd = 0;
  if (kind === 'subordinate' || kind === 'relative' || kind === 'that' || kind === 'coordinate' || kind === 'infinitive') {
    const w0 = toks[0]?.w ?? '';
    const w1 = toks[1]?.w ?? '';
    if (kind === 'infinitive') connectorEnd = 0;
    else if (['even', 'as', 'so', 'in'].includes(w0) && ['though', 'soon', 'long', 'that', 'order'].includes(w1)) connectorEnd = w0 === 'as' && w1 === 'soon' ? 3 : w0 === 'as' && w1 === 'long' ? 3 : 2;
    else connectorEnd = 1;
    if (kind === 'relative' && toks[0]?.w === 'whose') connectorEnd = 1;
    if (connectorEnd > 0) {
      chunks.push({ role: 'connector', text: textOf(toks, 0, connectorEnd) });
      i = connectorEnd;
    }
  }

  const relSubjectless = kind === 'relative' && ['who', 'which', 'that'].includes(toks[0]?.w ?? '');

  // Trạng ngữ đầu câu: "In the evening," / "Despite recent growth," / "Then,".
  const leading = (): void => {
    while (i < n) {
      const t = toks[i]!;
      const startsAdverbial =
        (PREPOSITIONS.has(t.w) && !(kind === 'main' && i === 0 && t.w === 'to' && isVerbForm(toks[i + 1]?.w ?? ''))) ||
        (isAdverbLike(t.w) && (t.comma || FREQUENCY_ADVERBS.has(t.w) === false)) ||
        (['last', 'next', 'every', 'this'].includes(t.w) && toks[i + 1] && TIME_WORDS.has(toks[i + 1]!.w)) ||
        TIME_WORDS.has(t.w);
      if (!startsAdverbial) return;
      if (isAdverbLike(t.w) && !t.comma && i + 1 < n && !PREPOSITIONS.has(t.w)) {
        // "Often she walks" — trạng từ tần suất giữa câu, để cho động từ xử lý.
        if (!(i === 0)) return;
      }
      // PP: giới từ + cụm danh từ, đến dấu phẩy hoặc ngay trước chủ ngữ.
      let e = i + 1;
      if (PREPOSITIONS.has(t.w)) {
        // "in order to" / "in spite of" / "because of"
        if (t.w === 'in' && toks[i + 1]?.w === 'spite' && toks[i + 2]?.w === 'of') e = i + 3;
        e = scanNP(toks, e, { subject: false });
        // Mở rộng: "In the evening I" — dừng trước đại từ chủ ngữ (scanNP đã dừng).
      } else if (['last', 'next', 'every', 'this'].includes(t.w)) {
        e = i + 2;
      }
      const endsWithComma = toks[e - 1]?.comma ?? false;
      const next = toks[e];
      // Chỉ nhận làm trạng ngữ đầu câu nếu sau nó còn chủ ngữ + động từ (có dấu phẩy, hoặc sau là đại từ/hạn định).
      const followedBySubject =
        !!next && (endsWithComma || PRONOUN_SUBJECT.has(next.w) || DETERMINERS.has(next.w) || /^[A-Z]/.test(next.raw));
      if (!followedBySubject) return;
      chunks.push({ role: classifyAdverbial(toks, i, e), text: textOf(toks, i, e) });
      i = e;
    }
  };

  // Mệnh lệnh: câu bắt đầu bằng động từ gốc, không có chủ ngữ.
  const first = toks[i];
  let imperative = false;
  if (kind === 'main' && first && (IMPERATIVE_VERBS.has(first.w) || /^don['’]t$/.test(first.w)) && !PRONOUN_SUBJECT.has(first.w) && i === 0) {
    imperative = true;
  }

  if (!imperative) leading();

  let verbStart = -1;
  if (imperative) {
    verbStart = i;
  } else if (relSubjectless) {
    verbStart = i;
  } else if (i < n) {
    const subjectStart = i;
    const subjEnd = scanNP(toks, i, { subject: true, start: subjectStart });
    // Chủ ngữ: nếu token đầu đã là aux ("Do you…?" / "Is it…?") thì câu hỏi → đảo.
    if (AUX_ANY(toks[i]!.w) && !PRONOUN_SUBJECT.has(toks[i]!.w)) {
      verbStart = i;
    } else {
      chunks.push({ role: 'subject', text: textOf(toks, subjectStart, subjEnd) });
      i = subjEnd;
      verbStart = i;
    }
  }

  if (verbStart < 0 || verbStart >= n) {
    // Không tìm được động từ: đẩy phần còn lại vào "rest".
    if (i < n) chunks.push({ role: 'rest', text: textOf(toks, i, n) });
    return { chunks, verb: null, imperative };
  }

  // Nhóm động từ: aux/trạng từ/phủ định + động từ chính.
  let v = verbStart;
  let sawAux = false;
  let lastVerbIdx = -1;
  while (v < n) {
    const t = toks[v]!;
    if (AUX_ANY(t.w) || t.w === 'not' || t.w === 'never') {
      sawAux = sawAux || AUX_ANY(t.w);
      lastVerbIdx = v;
      v += 1;
      continue;
    }
    if (isAdverbLike(t.w) && v + 1 < n && sawAux) {
      // Trạng từ giữa aux và động từ chính ("is often given", "has just finished").
      v += 1;
      continue;
    }
    if (isAdverbLike(t.w) && !sawAux && FREQUENCY_ADVERBS.has(t.w) && v + 1 < n && isVerbForm(toks[v + 1]!.w)) {
      v += 1;
      continue;
    }
    break;
  }

  const lastAux = lastVerbIdx >= 0 ? toks[lastVerbIdx]!.w : '';
  // Động từ chính (nếu aux chưa phải động từ chính).
  let mainIdx = -1;
  const startsWithBe = BE_FORMS.has(toks[verbStart]!.w) || (CONTRACTIONS[toks[verbStart]!.w]?.[1] ?? '') === 'am';
  if (v < n && (isVerbForm(toks[v]!.w) || /ed$/.test(toks[v]!.w) || /ing$/.test(toks[v]!.w) || imperative || (!sawAux && lastVerbIdx < 0))) {
    const t = toks[v]!;
    const rd = verbReadings(t.w);
    const ok =
      rd.length > 0 ||
      /ed$/.test(t.w) ||
      (sawAux && /ing$/.test(t.w)) ||
      imperative ||
      (!sawAux && lastVerbIdx < 0 && !DETERMINERS.has(t.w) && !PREPOSITIONS.has(t.w));
    if (ok && !(BE_FORMS.has(lastAux) && !(rd.length > 0 || /ed$|ing$/.test(t.w)))) {
      // "be + tính từ/danh từ": toks[v] không phải động từ → bổ ngữ, để ngoài nhóm.
      if (!(BE_FORMS.has(lastAux) && lastVerbIdx === v - 1 && !isParticipleLike(t.w))) mainIdx = v;
    }
  }
  if (mainIdx === -1 && lastVerbIdx < 0) {
    // Không có aux, không nhận ra động từ chính.
    if (i < n) chunks.push({ role: 'rest', text: textOf(toks, i, n) });
    return { chunks, verb: null, imperative };
  }
  const verbEnd = mainIdx >= 0 ? mainIdx + 1 : lastVerbIdx + 1;
  const verb = groupVerb(toks, verbStart, verbEnd);
  if (startsWithBe) verb.linking = verb.linking || true;
  chunks.push({ role: 'verb', text: textOf(toks, verbStart, verbEnd) });
  i = verbEnd;
  // Động từ 'be'/liên kết làm động từ chính → phần sau là bổ ngữ.
  const mainWord = toks[verbEnd - 1]!.w;
  const linking =
    verb.linking || LINKING_VERBS.has(verb.base ?? '') || verb.base === 'be' || LINKING_VERBS.has(mainWord) || BE_FORMS.has(mainWord);

  // Phần còn lại: tân ngữ / bổ ngữ / trạng ngữ, theo thứ tự.
  let objectSeen = false;
  while (i < n) {
    const t = toks[i]!;
    // to-infinitive hoặc V-ing làm tân ngữ/bổ ngữ.
    if (t.w === 'to' && i + 1 < n && (isVerbForm(toks[i + 1]!.w) || verbReadings(toks[i + 1]!.w).length > 0)) {
      let e = i + 2;
      // đến hết cụm: tân ngữ + PP
      e = scanNP(toks, e, { subject: false });
      while (e < n && PREPOSITIONS.has(toks[e]!.w) && !TIME_WORDS.has(toks[e + 1]?.w ?? '')) e = scanNP(toks, e + 1, { subject: false });
      chunks.push({ role: objectSeen ? 'purpose' : 'complement', text: textOf(toks, i, e) });
      objectSeen = true;
      i = e;
      continue;
    }
    if (PREPOSITIONS.has(t.w)) {
      let e = scanNP(toks, i + 1, { subject: false });
      if (e > n) e = n;
      chunks.push({ role: classifyAdverbial(toks, i, e), text: textOf(toks, i, e) });
      i = e;
      continue;
    }
    if (['last', 'next', 'every'].includes(t.w) && toks[i + 1] && TIME_WORDS.has(toks[i + 1]!.w)) {
      chunks.push({ role: 'time', text: textOf(toks, i, i + 2) });
      i += 2;
      continue;
    }
    if (isAdverbLike(t.w) || TIME_WORDS.has(t.w) || PLACE_WORDS.has(t.w)) {
      chunks.push({ role: classifyAdverbial(toks, i, i + 1), text: textOf(toks, i, i + 1) });
      i += 1;
      continue;
    }
    if (t.w === 'and' || t.w === 'or' || t.w === 'but') {
      // Nối hai động từ/cụm ("make coffee and toast") — gộp vào khối trước nếu liền.
      const prev = chunks[chunks.length - 1];
      if (prev && prev.role !== 'verb') {
        const e = scanNP(toks, i + 1, { subject: false });
        prev.text = `${prev.text} ${textOf(toks, i, e)}`;
        i = e;
        continue;
      }
    }
    // Cụm danh từ / tính từ.
    const e = scanNP(toks, i, { subject: false });
    const text = textOf(toks, i, e);
    if (!objectSeen) {
      if (linking) chunks.push({ role: 'complement', text });
      else chunks.push({ role: 'object', text });
      objectSeen = true;
    } else {
      // Hai cụm danh từ liền nhau sau động từ: cụm đầu là tân ngữ gián tiếp ("gave us extra homework").
      const prev = chunks[chunks.length - 1];
      if (prev && prev.role === 'object' && PRONOUN_OBJECT_SET.has(norm(prev.text))) {
        prev.role = 'indirect';
        chunks.push({ role: 'object', text });
      } else {
        chunks.push({ role: 'rest', text });
      }
    }
    i = e;
  }
  return { chunks, verb, imperative };
}

function isParticipleLike(w: string): boolean {
  return /ed$/.test(w) || /ing$/.test(w) || verbReadings(w).some((r) => r.form === 'pp' || r.form === 'ing');
}

type Span = { kind: ClauseKind; from: number; to: number };

/** Tìm chỗ bắt đầu động từ chia (aux) sau vị trí `from` để biết mệnh đề quan hệ kết thúc ở đâu. */
function findAuxAfter(toks: Tok[], from: number): number {
  for (let k = from; k < toks.length; k += 1) if (AUX_ANY(toks[k]!.w)) return k;
  return -1;
}

function looksLikeClauseAt(toks: Tok[], i: number): boolean {
  const t = toks[i];
  if (!t) return false;
  if (PRONOUN_SUBJECT.has(t.w) || t.w === 'there') return true;
  if (DETERMINERS.has(t.w) || /^[A-Z]/.test(t.raw)) {
    // có động từ/aux trong 5 token tới
    for (let k = i + 1; k < Math.min(toks.length, i + 6); k += 1) if (AUX_ANY(toks[k]!.w) || isVerbForm(toks[k]!.w)) return true;
  }
  return false;
}

function splitSpans(toks: Tok[]): Span[] {
  const n = toks.length;
  const marks: { at: number; kind: ClauseKind }[] = [];
  const seenVerbFor = (k: number) => {
    for (let j = 0; j < k; j += 1) if (AUX_ANY(toks[j]!.w) || verbReadings(toks[j]!.w).some((r) => r.form !== 'base') ) return true;
    return false;
  };
  void seenVerbFor;

  for (let i = 0; i < n; i += 1) {
    const t = toks[i]!;
    const prev = toks[i - 1];
    // Liên từ phụ thuộc.
    if (SUBORDINATORS.has(t.w)) {
      if (t.w === 'if' && i > 0 && prev && /^(as|even)$/.test(prev.w)) continue;
      marks.push({ at: i, kind: 'subordinate' });
      continue;
    }
    if (t.w === 'though' && prev?.w === 'even') continue;
    if (AMBIGUOUS_SUBORDINATORS.has(t.w) && looksLikeClauseAt(toks, i + 1) && !(i > 0 && prev && prev.w === 'as' && t.w === 'as')) {
      // "as … as" so sánh: bỏ qua nếu trước đó có "as" kiểu so sánh.
      if (t.w === 'as' && i > 0) {
        const before = toks.slice(0, i).map((x) => x.w);
        if (before.includes('as') || before.includes('so') || before.includes('twice')) continue;
      }
      marks.push({ at: i, kind: 'subordinate' });
      continue;
    }
    if (t.w === 'so' && toks[i + 1]?.w === 'that') {
      marks.push({ at: i, kind: 'subordinate' });
      i += 1;
      continue;
    }
    if (t.w === 'order' && prev?.w === 'in' && toks[i + 1]?.w === 'to') {
      marks.push({ at: i - 1, kind: 'infinitive' });
      continue;
    }
    // Mệnh đề quan hệ.
    if (i > 0 && RELATIVE_PRONOUNS.has(t.w) && !(prev && PREPOSITIONS.has(prev.w))) {
      marks.push({ at: i, kind: 'relative' });
      continue;
    }
    if (i > 0 && t.w === 'that' && prev) {
      const next = toks[i + 1];
      if (COMPLEMENT_VERBS.has(prev.w) || (isVerbForm(prev.w) && next && looksLikeClauseAt(toks, i + 1))) {
        marks.push({ at: i, kind: 'that' });
        continue;
      }
      if (isNounish(prev.w) && next && (AUX_ANY(next.w) || isVerbForm(next.w) || PRONOUN_SUBJECT.has(next.w) || DETERMINERS.has(next.w)) && !PREPOSITIONS.has(prev.w)) {
        marks.push({ at: i, kind: 'relative' });
        continue;
      }
    }
    // Ghép đẳng lập.
    if (i > 0 && ['and', 'but', 'so', 'or', 'yet'].includes(t.w) && prev && (prev.comma || t.w === 'but' || t.w === 'so')) {
      if (looksLikeClauseAt(toks, i + 1) || (t.w === 'but' && toks[i + 1] && !isAdverbLike(toks[i + 1]!.w) && AUX_ANY(toks[i + 1]!.w) === false && looksLikeClauseAt(toks, i + 1))) {
        marks.push({ at: i, kind: 'coordinate' });
        continue;
      }
    }
    if (i > 0 && t.w === 'and' && looksLikeClauseAt(toks, i + 1) && PRONOUN_SUBJECT.has(toks[i + 1]!.w)) {
      marks.push({ at: i, kind: 'coordinate' });
    }
  }

  // Dựng các đoạn: đoạn đầu là mệnh đề chính (hoặc mệnh đề phụ nếu mở đầu bằng liên từ phụ thuộc).
  const spans: Span[] = [];
  const cuts = marks.filter((m) => m.at > 0);
  const startsSub = marks.find((m) => m.at === 0);
  let pointer = 0;

  if (startsSub) {
    // Mệnh đề phụ đứng đầu: đến dấu phẩy đầu tiên sau khi đã có động từ.
    let end = n;
    for (let k = 1; k < n; k += 1) {
      if (toks[k]!.comma && k >= 2 && k < n - 1) {
        end = k + 1;
        break;
      }
    }
    // Chọn hạng đúng giữa các dấu cắt: bỏ các dấu cắt nằm trong mệnh đề phụ.
    spans.push({ kind: startsSub.kind, from: 0, to: end });
    pointer = end;
    const rest = cuts.filter((c) => c.at >= end);
    return finishSpans(spans, pointer, rest, n);
  }
  return finishSpans(spans, pointer, cuts, n);
}

function finishSpans(spans: Span[], pointer: number, cuts: { at: number; kind: ClauseKind }[], n: number): Span[] {
  let cur = pointer;
  let curKind: ClauseKind = spans.length === 0 ? 'main' : 'main';
  for (const cut of cuts) {
    if (cut.at <= cur) continue;
    spans.push({ kind: curKind, from: cur, to: cut.at });
    cur = cut.at;
    curKind = cut.kind;
  }
  spans.push({ kind: curKind, from: cur, to: n });
  return spans;
}

/** Hạ dấu phẩy ở cuối khối, tách các khối rỗng. */
function cleanChunks(chunks: Chunk[]): Chunk[] {
  return chunks
    .map((c) => ({ ...c, text: c.text.replace(/,+$/, '').trim() }))
    .filter((c) => c.text.length > 0);
}

export function analyzeSentence(rawText: string): SentenceAnalysis {
  const text = rawText.trim();
  const toks = tokenize(text);
  const words = toks.map((t) => t.w);
  if (toks.length === 0) {
    return { text, words, clauses: [], complete: false, trusted: false, type: 'fragment', mainVerb: null, isImperative: false, isQuestion: false };
  }
  const spans = splitSpans(toks);

  // Mệnh đề quan hệ nằm giữa câu: nếu nó ở vị trí chủ ngữ (trước động từ chính), cắt tại aux kế tiếp.
  const fixed: Span[] = [];
  for (let s = 0; s < spans.length; s += 1) {
    const span = spans[s]!;
    if (span.kind === 'relative') {
      const startVerbAt = span.from + 1;
      const auxAt = findAuxAfter(toks, startVerbAt + 1);
      const commaAt = toks.findIndex((t, k) => k >= span.from && t.comma && k < span.to - 1);
      const isSubjectRel = s > 0 && spans[s - 1]!.kind === 'main' && !spans[s - 1]!.from && !hasVerbGroup(toks, spans[s - 1]!.from, spans[s - 1]!.to);
      if (isSubjectRel && auxAt > 0 && auxAt < span.to) {
        fixed.push({ kind: 'relative', from: span.from, to: auxAt });
        fixed.push({ kind: 'main', from: auxAt, to: span.to });
        continue;
      }
      if (commaAt > 0 && commaAt < span.to - 1 && toks[commaAt]!.comma) {
        fixed.push({ kind: 'relative', from: span.from, to: commaAt + 1 });
        if (commaAt + 1 < span.to) fixed.push({ kind: 'main', from: commaAt + 1, to: span.to });
        continue;
      }
    }
    fixed.push(span);
  }

  // Gộp: "mệnh đề chính trước quan hệ" khi chủ ngữ + quan hệ + động từ chính (đã tách ở trên).
  const clauses: Clause[] = [];
  let mainVerb: VerbGroup | null = null;
  let isImperative = false;
  let allVerbs = true;
  for (const span of fixed) {
    const slice = toks.slice(span.from, span.to);
    if (slice.length === 0) continue;
    const { chunks, verb, imperative } = chunkClause(slice, span.kind);
    const connector = span.kind === 'main' ? null : chunks.find((c) => c.role === 'connector')?.text ?? null;
    if (verb === null && span.kind !== 'infinitive') allVerbs = false;
    // Mệnh đề "main" bị cắt ngang chủ ngữ (do mệnh đề quan hệ chen giữa) và không có chủ ngữ → coi như phần tiếp của câu chính.
    clauses.push({ kind: span.kind, connector, text: textOf(slice, 0, slice.length), chunks: cleanChunks(chunks), verb });
    if (!mainVerb && verb && (span.kind === 'main' || span.kind === 'coordinate')) {
      mainVerb = verb;
      if (imperative) isImperative = true;
    }
  }
  if (!mainVerb) mainVerb = clauses.find((c) => c.verb)?.verb ?? null;
  if (isImperative && mainVerb) mainVerb = { ...mainVerb, tense: 'imperative' };

  const mains = clauses.filter((c) => c.kind === 'main' || c.kind === 'coordinate').length;
  const subs = clauses.filter((c) => c.kind === 'subordinate' || c.kind === 'relative' || c.kind === 'that').length;
  let type: SentenceAnalysis['type'] = 'simple';
  if (!allVerbs && clauses.length === 1) type = 'fragment';
  else if (mains >= 2 && subs >= 1) type = 'compound-complex';
  else if (mains >= 2) type = 'compound';
  else if (subs >= 1) type = 'complex';

  const isQuestion = /\?\s*$/.test(text) || (clauses[0]?.chunks[0]?.role === 'verb' && !isImperative && AUX_ANY(words[0] ?? ''));
  return { text, words, clauses, complete: allVerbs && clauses.length > 0, trusted: isTrusted(clauses, allVerbs, isImperative, isQuestion), type, mainVerb, isImperative, isQuestion };
}

function isTrusted(clauses: Clause[], allVerbs: boolean, imperative: boolean, question: boolean): boolean {
  if (!allVerbs || clauses.length === 0 || question) return false;
  for (const c of clauses) {
    if (c.kind === 'infinitive') continue;
    const roles = c.chunks.map((k) => k.role);
    if (roles.includes('rest')) return false;
    if (!roles.includes('verb')) return false;
    const relSubjectless = c.kind === 'relative' && ['who', 'which', 'that'].includes((c.connector ?? '').toLowerCase());
    if (!roles.includes('subject') && !imperative && !relSubjectless) return false;
    for (const k of c.chunks) {
      if (k.role === 'verb' || k.role === 'connector') continue;
      const ws = k.text.toLowerCase().split(/\s+/).map(norm);
      // Trợ động từ/khuyết thiếu nằm trong một khối không phải động từ → bị cắt sai.
      if (ws.some((w, idx) => idx > 0 && (BE_FORMS.has(w) || HAVE_FORMS.has(w) || MODALS.has(w) || DO_FORMS.has(w))) && k.role !== 'complement') return false;
      if (k.role === 'subject' && ws.length > 9) return false;
    }
  }
  return true;
}

function hasVerbGroup(toks: Tok[], from: number, to: number): boolean {
  for (let k = from; k < to; k += 1) if (AUX_ANY(toks[k]!.w)) return true;
  for (let k = from + 1; k < to; k += 1) if (verbReadings(toks[k]!.w).some((r) => r.form !== 'base' && r.form !== 'ing')) return true;
  return false;
}

export const ROLE_LABEL: Record<Role, { vi: string; en: string }> = {
  connector: { vi: 'Từ nối', en: 'Connector' },
  subject: { vi: 'Chủ ngữ', en: 'Subject' },
  verb: { vi: 'Động từ', en: 'Verb' },
  object: { vi: 'Tân ngữ', en: 'Object' },
  indirect: { vi: 'Tân ngữ gián tiếp', en: 'Indirect object' },
  complement: { vi: 'Bổ ngữ', en: 'Complement' },
  time: { vi: 'Trạng ngữ thời gian', en: 'Time adverbial' },
  place: { vi: 'Trạng ngữ nơi chốn', en: 'Place adverbial' },
  manner: { vi: 'Trạng ngữ cách thức', en: 'Manner adverbial' },
  reason: { vi: 'Trạng ngữ lý do', en: 'Reason adverbial' },
  purpose: { vi: 'Mục đích', en: 'Purpose' },
  adverbial: { vi: 'Trạng ngữ', en: 'Adverbial' },
  relative: { vi: 'Mệnh đề quan hệ', en: 'Relative clause' },
  rest: { vi: 'Phần còn lại', en: 'Rest' },
};

export const CLAUSE_LABEL: Record<ClauseKind, { vi: string; en: string }> = {
  main: { vi: 'Mệnh đề chính', en: 'Main clause' },
  coordinate: { vi: 'Mệnh đề đẳng lập', en: 'Coordinate clause' },
  subordinate: { vi: 'Mệnh đề phụ', en: 'Subordinate clause' },
  relative: { vi: 'Mệnh đề quan hệ', en: 'Relative clause' },
  that: { vi: 'Mệnh đề that', en: 'That-clause' },
  infinitive: { vi: 'Mệnh đề mục đích', en: 'Purpose clause' },
};

export const TENSE_LABEL: Record<TenseKey, { vi: string; en: string }> = {
  'present-simple': { vi: 'Hiện tại đơn', en: 'Present simple' },
  'past-simple': { vi: 'Quá khứ đơn', en: 'Past simple' },
  'present-continuous': { vi: 'Hiện tại tiếp diễn', en: 'Present continuous' },
  'past-continuous': { vi: 'Quá khứ tiếp diễn', en: 'Past continuous' },
  'present-perfect': { vi: 'Hiện tại hoàn thành', en: 'Present perfect' },
  'past-perfect': { vi: 'Quá khứ hoàn thành', en: 'Past perfect' },
  'future-simple': { vi: 'Tương lai đơn', en: 'Future simple' },
  'be-going-to': { vi: 'Tương lai gần (be going to)', en: 'Near future (be going to)' },
  modal: { vi: 'Động từ khuyết thiếu', en: 'Modal verb' },
  imperative: { vi: 'Câu mệnh lệnh', en: 'Imperative' },
  infinitive: { vi: 'Nguyên mẫu', en: 'Infinitive' },
  participle: { vi: 'Phân từ', en: 'Participle' },
};
