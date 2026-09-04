import { readFileSync } from 'node:fs';

/**
 * Chấm thử MỘT bài thật để xem bản chấm chi tiết có ra đủ không.
 *
 *   npx tsx scripts/try-writing-detail.ts
 *
 * Chạy tay, gọi mạng thật — không nằm trong bộ test. Phần logic đọc kết quả đã có
 * `writing-detail.test.ts` lo; script này trả lời câu hỏi khác hẳn: MODEL có chịu
 * trả đúng hình dạng mình yêu cầu hay không. Đó là thứ chỉ biết được khi hỏi thật.
 */

for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const m = /^([A-Z_]+)=(.*)$/.exec(line);
  if (m && m[1] && m[2] !== undefined) process.env[m[1]] = m[2].replace(/^"|"$/g, '');
}

const BAI = [
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

async function main() {
  const { evaluateWriting } = await import('../src/services/ai/writing-evaluator');
  const { getWritingPromptById, WRITING_PROMPTS } = await import('../src/data/writing-repository');

  const prompt =
    WRITING_PROMPTS.find((p) => p.task === 'ielts_task2') ?? getWritingPromptById(WRITING_PROMPTS[0]!.id)!;

  console.log(`Đề: ${prompt.promptText.slice(0, 90)}…\n`);
  const t0 = Date.now();
  const r = await evaluateWriting({ prompt, bodyText: BAI });
  console.log(`Chấm xong sau ${((Date.now() - t0) / 1000).toFixed(1)}s bằng ${r.model}\n`);

  console.log(`BAND ${r.bandLow}–${r.bandHigh}   ·   ${r.wordCount}/${r.minWords} từ`);
  console.log(`ƯU TIÊN: ${r.priorityVi || '(trống)'}`);
  console.log(`LÊN BAND: ${r.nextBandVi || '(trống)'}\n`);

  let thieu = 0;
  for (const [key, d] of Object.entries(r.criteria)) {
    console.log(`── ${key.toUpperCase()}  band ${d.band}`);
    console.log(`   vì sao : ${d.evidenceVi || '(TRỐNG)'}`);
    console.log(`   thiếu  : ${d.gapVi || '(TRỐNG)'}`);
    console.log(`   làm gì : ${d.nextStepVi || '(TRỐNG)'}`);
    console.log(`   dẫn chứng đã kiểm: ${d.quotes.length ? d.quotes.map((q) => `“${q}”`).join(' · ') : '(không có)'}`);
    if (!d.evidenceVi || !d.gapVi || !d.nextStepVi) thieu += 1;
  }

  console.log(`\nSố lỗi được đánh dấu: ${r.annotations.length}`);
  console.log(thieu === 0 ? '\n✔ Bốn tiêu chí đều đủ ba tầng nhận xét.' : `\n✖ ${thieu} tiêu chí còn trường trống.`);
}

void main();
