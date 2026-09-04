/**
 * Đo lại toàn bộ việc gắn model vào tác vụ, trên các proxy đang sống.
 *
 * Chạy tay:  node scripts/bench-ai-routing.mjs scripts/bench-ai-routing.plan.json
 *
 * VÌ SAO KHÔNG PHẢI UNIT TEST: nó gọi mạng thật, tốn tiền thật, và kết quả đổi
 * theo ngày. Đây là công cụ để RA QUYẾT ĐỊNH cấu hình, không phải cổng kiểm tra
 * hồi quy — nên nó cố ý nằm ngoài bộ test chạy mỗi lần sửa mã.
 *
 * Điểm chấm KHÔNG phải "câu trả lời hay tới đâu" — thứ đó cần người đọc. Nó đo
 * đúng những gì máy kiểm được và app thật sự phụ thuộc vào: có parse ra JSON
 * đúng hình dạng không, phần trích dẫn có nguyên văn không (chỗ này model hay
 * bịa nhất), và câu tiếng Việt có thật sự là tiếng Việt không.
 *
 * LƯU Ý khi đọc kết quả: script này gửi chỉ dẫn ở vai `system` như cách app gọi
 * MẶC ĐỊNH, và CỐ Ý KHÔNG gộp chỉ dẫn vào tin nhắn người dùng. Nên một cửa nuốt
 * vai `system` (codex) sẽ hiện ra là hỏng ở đây — đó chính là điều cần thấy.
 * Lúc chạy thật, cửa nào bật `AI_*_FOLD_SYSTEM=true` thì app đã gộp giúp rồi.
 */
import fs from 'node:fs';

const env = Object.fromEntries(
  fs
    .readFileSync('.env.local', 'utf8')
    .split(/\r?\n/)
    .filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, '')];
    }),
);

/*
  Tên ở đây gắn theo VAI TRÒ trong cấu hình (cửa 1/2/3), không gắn theo tên nhà
  cung cấp — nếu không, ngày nào đổi cửa là ngày đó nhãn nói dối. Đã suýt dính:
  khi cửa 2 chuyển từ codex sang ai-box, bảng này vẫn ghi `codex` trỏ vào
  AI_SECONDARY_*, tức là đo ai-box rồi báo cáo tên codex.
*/
const PROXY = {
  groq: { url: env.AI_PRIMARY_BASE_URL, key: env.AI_PRIMARY_API_KEY },
  aibox: { url: env.AI_SECONDARY_BASE_URL, key: env.AI_SECONDARY_API_KEY },
  codex: { url: env.AI_TERTIARY_BASE_URL, key: env.AI_TERTIARY_API_KEY },
};

const ESSAY = [
  'Some people think that the government should pay for healthcare and education, but others',
  "believe it is the individual's responsibility. In my opinion, I believe the goverment should",
  'take main responsibility for these two area. Firstly, healthcare is a basic human right. If',
  'people cannot afford to see a doctor, they will get sicker and cannot work, which harm the',
  'economy. For example in my country, many poor familys avoid hospital because of the cost, and',
  'their illness become worse. Secondly, education create equal opportunity. When school is free,',
  'a child from poor family can compete with rich child. However, some argue that free service',
  'make people lazy and taxes too high. This is partly true, but a well managed system can avoid',
  'this problem. In conclusion, I strongly believe that government funding for health and',
  'education brings more benefit than drawback to the society as a whole.',
].join(' ');

const PASSAGE = [
  "The Great Barrier Reef is the world's largest coral reef system, composed of over 2,900",
  'individual reefs and 900 islands stretching for over 2,300 kilometres over an area of',
  'approximately 344,400 square kilometres. The reef is located in the Coral Sea, off the coast of',
  "Queensland, Australia. It can be seen from outer space and is the world's biggest single",
  'structure made by living organisms. This reef structure is composed of and built by billions of',
  'tiny organisms, known as coral polyps. It supports a wide diversity of life and was selected as',
  'a World Heritage Site in 1981.',
].join(' ');

const VI_DAU =
  /[àáâãèéêìíòóôõùúýăđĩũơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/i;

const TASKS = {
  writing: {
    label: 'Chấm bài viết',
    maxTokens: 1600,
    body: {
      messages: [
        {
          role: 'system',
          content:
            'You are an IELTS Writing examiner. Reply with ONLY a JSON object, no prose, no markdown fence.',
        },
        {
          role: 'user',
          content:
            'Grade this IELTS Task 2 essay. Return JSON exactly of shape {"taskResponse":number,"coherence":number,"lexical":number,"grammar":number,"overall":number,"annotations":[{"quote":string,"issue":string,"fix":string}]}. Bands are 0-9 in 0.5 steps. Give 4 annotations, each "quote" copied VERBATIM from the essay.\n\nESSAY:\n' +
            ESSAY,
        },
      ],
    },
    check: (text) => {
      const j = json(text);
      if (!j) return ['không parse được JSON', 0];
      const bands = ['taskResponse', 'coherence', 'lexical', 'grammar', 'overall'].filter(
        (k) => typeof j[k] === 'number',
      );
      const anns = Array.isArray(j.annotations) ? j.annotations : [];
      const real = anns.filter((a) => a && a.quote && ESSAY.includes(a.quote)).length;
      const score = bands.length === 5 && anns.length > 0 ? real / anns.length : 0;
      return [`${bands.length}/5 band, ${real}/${anns.length} trích dẫn nguyên văn`, score];
    },
  },

  questions: {
    label: 'Sinh đề đọc hiểu',
    maxTokens: 1800,
    body: {
      messages: [
        {
          role: 'system',
          content:
            'You write IELTS reading questions. Reply with ONLY a JSON object, no prose, no markdown fence.',
        },
        {
          role: 'user',
          content:
            'From the passage, write 5 IELTS reading questions. Return JSON {"questions":[{"type":"multiple_choice"|"true_false_not_given","prompt":string,"options":string[],"answer":string,"evidence":string}]}. Each "evidence" must be copied VERBATIM from the passage.\n\nPASSAGE:\n' +
            PASSAGE,
        },
      ],
    },
    check: (text) => {
      const j = json(text);
      if (!j) return ['không parse được JSON', 0];
      const qs = Array.isArray(j.questions) ? j.questions : [];
      const real = qs.filter((q) => q && q.evidence && PASSAGE.includes(q.evidence)).length;
      const score = qs.length >= 4 ? real / Math.max(qs.length, 1) : 0;
      return [`${qs.length} câu, ${real}/${qs.length} dẫn chứng nguyên văn`, score];
    },
  },

  define: {
    label: 'Tra từ trong ngữ cảnh',
    maxTokens: 500,
    body: {
      messages: [
        { role: 'system', content: 'Reply with ONLY a JSON object, no prose, no markdown fence.' },
        {
          role: 'user',
          content:
            'Define the word "composed" as used in this sentence: "This reef structure is composed of and built by billions of tiny organisms." Return JSON {"word":string,"pos":string,"en":string,"vi":string,"example":string}. The "vi" field must be Vietnamese.',
        },
      ],
    },
    check: (text) => {
      const j = json(text);
      if (!j) return ['không parse được JSON', 0];
      const has = ['word', 'pos', 'en', 'vi', 'example'].filter(
        (k) => typeof j[k] === 'string' && j[k].length > 0,
      );
      const viOk = VI_DAU.test(j.vi ?? '');
      const note = `${has.length}/5 trường` + (viOk ? ', vi có dấu' : ', VI KHÔNG PHẢI TIẾNG VIỆT');
      return [note, has.length === 5 && viOk ? 1 : (has.length / 5) * 0.5];
    },
  },

  translate: {
    label: 'Dịch Anh -> Việt',
    maxTokens: 400,
    body: {
      messages: [
        {
          role: 'system',
          content:
            'You translate English to natural Vietnamese. Reply with ONLY the Vietnamese translation, nothing else.',
        },
        {
          role: 'user',
          content:
            "It can be seen from outer space and is the world's biggest single structure made by living organisms.",
        },
      ],
    },
    check: (text) => {
      const t = text.trim();
      const viOk = VI_DAU.test(t);
      // Lời dẫn ("Sure, here is...") làm hỏng bản dịch vì app hiển thị nguyên văn.
      const clean = !/^(here|sure|translation|\{|```)/i.test(t);
      const note =
        `${t.length} ký tự` +
        (viOk ? ', tiếng Việt' : ', KHÔNG PHẢI TIẾNG VIỆT') +
        (clean ? '' : ', CÓ LỜI DẪN');
      return [note, viOk && clean ? 1 : 0];
    },
  },

  chat: {
    label: 'Chatbox trợ giảng',
    maxTokens: 400,
    body: {
      messages: [
        { role: 'system', content: 'Bạn là trợ giảng IELTS, trả lời ngắn gọn bằng tiếng Việt.' },
        { role: 'user', content: 'Khác nhau giữa "affect" và "effect" là gì?' },
      ],
    },
    check: (text) => {
      const viOk = VI_DAU.test(text);
      const onTopic = /affect/i.test(text) && /effect/i.test(text);
      const note =
        `${text.length} ký tự` +
        (viOk ? ', tiếng Việt' : ', KHÔNG PHẢI TIẾNG VIỆT') +
        (onTopic ? '' : ', LẠC ĐỀ');
      return [note, viOk && onTopic ? 1 : 0];
    },
  },
};

function json(text) {
  const t = text.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  const s = t.indexOf('{');
  const e = t.lastIndexOf('}');
  if (s < 0 || e < s) return null;
  try {
    return JSON.parse(t.slice(s, e + 1));
  } catch {
    return null;
  }
}

async function call(proxy, model, task) {
  const p = PROXY[proxy];
  const t0 = Date.now();
  try {
    const r = await fetch(`${p.url}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${p.key}` },
      body: JSON.stringify({
        model,
        stream: false,
        temperature: 0.2,
        max_tokens: task.maxTokens,
        ...task.body,
      }),
      signal: AbortSignal.timeout(120_000),
    });
    const raw = await r.text();
    const ms = Date.now() - t0;
    if (!r.ok) return { ms, ok: false, note: `HTTP ${r.status}: ${raw.slice(0, 90)}`, score: 0 };

    // Vài proxy trả SSE NGAY CẢ KHI stream:false — gỡ từng mảnh ra rồi ghép lại.
    let text = '';
    if (raw.startsWith('data:')) {
      for (const line of raw.split(/\r?\n/)) {
        if (!line.startsWith('data:')) continue;
        const d = line.slice(5).trim();
        if (d === '[DONE]') break;
        try {
          const parsed = JSON.parse(d);
          text += parsed.choices?.[0]?.delta?.content ?? '';
        } catch {
          /* mảnh hỏng thì bỏ qua, phần còn lại vẫn ghép được */
        }
      }
    } else {
      try {
        text = JSON.parse(raw).choices?.[0]?.message?.content ?? '';
      } catch {
        return { ms, ok: false, note: `vỏ JSON lạ: ${raw.slice(0, 90)}`, score: 0 };
      }
    }
    if (!text.trim()) return { ms, ok: false, note: 'trả về rỗng', score: 0 };

    const [note, score] = task.check(text);
    return { ms, ok: true, note, score };
  } catch (e) {
    return { ms: Date.now() - t0, ok: false, note: `LỖI ${e.message}`, score: 0 };
  }
}

const planPath = process.argv[2] ?? 'scripts/bench-ai-routing.plan.json';
const PLAN = JSON.parse(fs.readFileSync(planPath, 'utf8'));

for (const [taskName, candidates] of Object.entries(PLAN)) {
  const task = TASKS[taskName];
  if (!task) {
    console.log(`\n(bỏ qua việc không biết: ${taskName})`);
    continue;
  }
  console.log(`\n===== ${task.label} (${taskName}) =====`);
  for (const [proxy, model] of candidates) {
    const r = await call(proxy, model, task);
    const flag = !r.ok ? 'HỎNG' : r.score >= 0.99 ? 'TỐT' : r.score > 0 ? 'TẠM' : 'XẤU';
    console.log(
      `  ${flag.padEnd(4)} ${String(r.ms).padStart(6)}ms  ${proxy.padEnd(5)} ${model.padEnd(26)} ${r.note}`,
    );
  }
}
