import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Sinh 40 bộ đề Dịch câu mới, mỗi bộ 10 câu Việt → Anh.
 *
 *   npx tsx scripts/generate-translation-sets.ts             # sinh những bộ còn thiếu
 *   npx tsx scripts/generate-translation-sets.ts --redo money-habits
 *
 * VÌ SAO SINH BẰNG AI RỒI KIỂM BẰNG CODE — giống hệt lý do ở
 * `generate-vocab-topics.ts`: 400 cặp câu kèm đáp án mẫu và ghi chú cấu trúc là
 * thứ không ai gõ tay nổi, nhưng cũng là thứ AI rất dễ làm ẩu. Kiểu ẩu hay gặp
 * nhất KHÔNG phải dịch sai — mà là:
 *   - trả về câu tiếng Việt ở ô tiếng Anh (hoặc ngược lại),
 *   - đẻ ra câu trùng gần như nguyên văn với bộ khác,
 *   - ghi chú cấu trúc viết bằng tiếng Anh trong khi người học là người Việt,
 *   - câu tiếng Anh cụt vì chạm trần token.
 * Bốn thứ đó máy kiểm được hết, nên bộ nào không qua thì KHÔNG được ghi vào kho.
 *
 * KHÔNG LẤY CÂU TỪ SÁCH HAY APP KHÁC. Cặp câu-và-bản-dịch là tác phẩm có bản
 * quyền; chép về là vi phạm dù có đổi vài chữ. Toàn bộ câu ở đây sinh mới.
 *
 * Ghi từng file một: gọi 40 lượt AI liên tiếp mà đứt ở lượt 38 thì mất cả buổi
 * nếu giữ hết trong bộ nhớ.
 */

const OUT_DIR = join('src', 'data', 'seed', 'translation-sets');
const ITEMS_PER_SET = 10;

type Level = 'easy' | 'medium' | 'hard';

type Topic = {
  slug: string;
  title: string;
  blurb: string;
  /** Độ khó chủ đạo của bộ — quyết định độ dài và độ phức tạp câu yêu cầu AI. */
  level: Level;
  /** Gợi ý phạm vi để 40 bộ không giẫm chân nhau. */
  scope: string;
};

/**
 * Bốn mươi chủ đề MỚI, không trùng 10 chủ đề đã có.
 *
 * Mười bộ cũ (giáo dục, môi trường, công nghệ, sức khoẻ, công việc, xã hội, du
 * lịch, truyền thông, gia đình, kinh tế) phủ mảng học thuật. Bốn mươi bộ này cố
 * ý nghiêng về ĐỜI SỐNG THẬT và các mẫu câu ngữ pháp cụ thể, vì đó là chỗ người
 * học Việt Nam hay dịch word-by-word rồi ra câu không ai nói.
 *
 * Xếp dễ trước khó sau để thư viện đọc được từ trên xuống.
 */
const TOPICS: Topic[] = [
  // ---------------------------------------------------------------- easy (14)
  { slug: 'daily-routine', title: 'Thói quen hằng ngày', level: 'easy', blurb: 'Câu về việc lặp lại mỗi ngày và cách nói giờ giấc.', scope: 'thức dậy, ăn uống, đi làm, giờ giấc cố định' },
  { slug: 'home-chores', title: 'Việc nhà', level: 'easy', blurb: 'Câu về dọn dẹp, nấu nướng và phân công trong nhà.', scope: 'quét nhà, rửa bát, giặt giũ, nấu ăn' },
  { slug: 'shopping', title: 'Mua sắm', level: 'easy', blurb: 'Câu về đi chợ, siêu thị, hỏi giá và trả tiền.', scope: 'chợ, siêu thị, giá cả, mặc cả, đổi trả' },
  { slug: 'weather-talk', title: 'Thời tiết', level: 'easy', blurb: 'Câu mô tả thời tiết và cách nó đổi kế hoạch.', scope: 'mưa nắng, gió bão, mùa, dự báo' },
  { slug: 'directions', title: 'Chỉ đường', level: 'easy', blurb: 'Câu hỏi đường và mô tả vị trí.', scope: 'rẽ trái phải, đối diện, cách bao xa' },
  { slug: 'food-cooking', title: 'Nấu ăn', level: 'easy', blurb: 'Câu về món ăn, nguyên liệu và cách chế biến.', scope: 'nguyên liệu, công thức, khẩu vị' },
  { slug: 'pets-animals', title: 'Thú nuôi', level: 'easy', blurb: 'Câu về chó mèo, chăm sóc và thói quen của chúng.', scope: 'nuôi, cho ăn, dắt đi dạo, thú y' },
  { slug: 'clothes-style', title: 'Quần áo', level: 'easy', blurb: 'Câu về trang phục, cỡ số và cách phối đồ.', scope: 'size, màu sắc, chất liệu, dịp mặc' },
  { slug: 'phone-messages', title: 'Điện thoại và tin nhắn', level: 'easy', blurb: 'Câu về gọi điện, nhắn tin và hẹn gặp.', scope: 'gọi lỡ, nhắn lại, hẹn giờ' },
  { slug: 'neighbours', title: 'Hàng xóm', level: 'easy', blurb: 'Câu về người sống quanh mình và chuyện hằng ngày.', scope: 'chào hỏi, giúp đỡ, ồn ào, gửi đồ' },
  { slug: 'school-day', title: 'Một ngày ở trường', level: 'easy', blurb: 'Câu về lớp học, thầy cô và bài vở thường ngày.', scope: 'tiết học, bài tập về nhà, giờ ra chơi' },
  { slug: 'hobbies', title: 'Sở thích', level: 'easy', blurb: 'Câu về những việc làm lúc rảnh.', scope: 'đọc sách, chơi nhạc, vẽ, sưu tầm' },
  { slug: 'body-health', title: 'Cơ thể và ốm đau', level: 'easy', blurb: 'Câu mô tả triệu chứng và lời khuyên đơn giản.', scope: 'đau đầu, sốt, khám bệnh, uống thuốc' },
  { slug: 'time-plans', title: 'Hẹn và kế hoạch gần', level: 'easy', blurb: 'Câu nói về việc sắp làm trong vài ngày tới.', scope: 'cuối tuần, tuần sau, dời lịch' },

  // -------------------------------------------------------------- medium (16)
  { slug: 'money-habits', title: 'Chi tiêu và tiết kiệm', level: 'medium', blurb: 'Câu về cách quản lý tiền và những lựa chọn chi tiêu.', scope: 'tiết kiệm, trả góp, lãng phí, ngân sách' },
  { slug: 'city-traffic', title: 'Giao thông đô thị', level: 'medium', blurb: 'Câu về tắc đường, phương tiện và hạ tầng.', scope: 'kẹt xe, xe buýt, metro, giờ cao điểm' },
  { slug: 'jobs-interview', title: 'Xin việc và phỏng vấn', level: 'medium', blurb: 'Câu về hồ sơ, phỏng vấn và kỳ vọng công việc.', scope: 'CV, phỏng vấn, lương, thử việc' },
  { slug: 'online-life', title: 'Đời sống trên mạng', level: 'medium', blurb: 'Câu về mạng xã hội và thói quen dùng internet.', scope: 'đăng bài, bình luận, nghiện điện thoại' },
  { slug: 'sports-fitness', title: 'Thể thao và rèn luyện', level: 'medium', blurb: 'Câu về tập luyện, thi đấu và giữ dáng.', scope: 'chạy bộ, phòng gym, trận đấu, chấn thương' },
  { slug: 'music-film', title: 'Âm nhạc và phim ảnh', level: 'medium', blurb: 'Câu nhận xét về bài hát, phim và diễn viên.', scope: 'thể loại, nhân vật, kết phim, gu nhạc' },
  { slug: 'travel-plans', title: 'Chuẩn bị chuyến đi', level: 'medium', blurb: 'Câu về đặt vé, hành lý và lịch trình.', scope: 'đặt phòng, visa, hoãn chuyến, hành lý' },
  { slug: 'housing-rent', title: 'Thuê nhà', level: 'medium', blurb: 'Câu về tìm phòng, hợp đồng và chủ nhà.', scope: 'tiền cọc, hợp đồng, sửa chữa, chuyển nhà' },
  { slug: 'study-abroad', title: 'Du học', level: 'medium', blurb: 'Câu về hồ sơ, học bổng và sống xa nhà.', scope: 'học bổng, hồ sơ, nhớ nhà, hoà nhập' },
  { slug: 'volunteering', title: 'Tình nguyện', level: 'medium', blurb: 'Câu về hoạt động cộng đồng và giúp đỡ người khác.', scope: 'quyên góp, dọn rác, dạy học miễn phí' },
  { slug: 'food-culture', title: 'Văn hoá ẩm thực', level: 'medium', blurb: 'Câu về món ăn vùng miền và thói quen ăn uống.', scope: 'đặc sản, ăn chay, đồ ăn nhanh' },
  { slug: 'shopping-online', title: 'Mua hàng trực tuyến', level: 'medium', blurb: 'Câu về đặt hàng, giao hàng và đánh giá.', scope: 'đặt hàng, ship, hoàn tiền, đánh giá sao' },
  { slug: 'friendship', title: 'Bạn bè', level: 'medium', blurb: 'Câu về tình bạn, mâu thuẫn và giữ liên lạc.', scope: 'thân thiết, giận nhau, làm lành, xa cách' },
  { slug: 'city-vs-country', title: 'Thành thị và nông thôn', level: 'medium', blurb: 'Câu so sánh hai lối sống.', scope: 'yên tĩnh, tiện nghi, chi phí, cơ hội' },
  { slug: 'time-management', title: 'Quản lý thời gian', level: 'medium', blurb: 'Câu về sắp xếp việc và trì hoãn.', scope: 'deadline, ưu tiên, trì hoãn, lịch biểu' },
  { slug: 'festivals', title: 'Lễ hội và ngày Tết', level: 'medium', blurb: 'Câu về phong tục và không khí ngày lễ.', scope: 'sum họp, phong tục, lì xì, trang trí' },

  // ---------------------------------------------------------------- hard (10)
  { slug: 'ai-and-jobs', title: 'Trí tuệ nhân tạo và việc làm', level: 'hard', blurb: 'Câu bàn về tác động của tự động hoá lên nghề nghiệp.', scope: 'thay thế lao động, kỹ năng mới, đạo đức' },
  { slug: 'climate-policy', title: 'Chính sách khí hậu', level: 'hard', blurb: 'Câu về cam kết giảm phát thải và đánh đổi kinh tế.', scope: 'phát thải, năng lượng tái tạo, thuế carbon' },
  { slug: 'public-health', title: 'Y tế công cộng', level: 'hard', blurb: 'Câu về hệ thống y tế và phòng bệnh ở quy mô lớn.', scope: 'bảo hiểm, tiêm chủng, quá tải bệnh viện' },
  { slug: 'urban-planning', title: 'Quy hoạch đô thị', level: 'hard', blurb: 'Câu về cách thành phố được thiết kế và hệ quả.', scope: 'không gian xanh, mật độ, giao thông công cộng' },
  { slug: 'education-reform', title: 'Cải cách giáo dục', level: 'hard', blurb: 'Câu về thi cử, chương trình và bất bình đẳng học tập.', scope: 'thi cử, học phí, chất lượng, khoảng cách' },
  { slug: 'privacy-data', title: 'Quyền riêng tư và dữ liệu', level: 'hard', blurb: 'Câu về thu thập dữ liệu và giám sát.', scope: 'thu thập dữ liệu, camera, đồng thuận' },
  { slug: 'ageing-society', title: 'Dân số già', level: 'hard', blurb: 'Câu về già hoá dân số và gánh nặng an sinh.', scope: 'lương hưu, chăm sóc người già, lực lượng lao động' },
  { slug: 'cultural-heritage', title: 'Bảo tồn di sản', level: 'hard', blurb: 'Câu về giữ gìn di tích giữa áp lực phát triển.', scope: 'trùng tu, du lịch quá tải, bản sắc' },
  { slug: 'inequality', title: 'Bất bình đẳng', level: 'hard', blurb: 'Câu về khoảng cách giàu nghèo và cơ hội.', scope: 'thu nhập, cơ hội, an sinh, dịch chuyển xã hội' },
  { slug: 'science-funding', title: 'Đầu tư cho khoa học', level: 'hard', blurb: 'Câu về ngân sách nghiên cứu và ưu tiên xã hội.', scope: 'ngân sách, nghiên cứu cơ bản, ứng dụng' },
];

type Item = { id: string; difficulty: Level; vi: string; en: string; hint: string };
type SetFile = { slug: string; title: string; blurb: string; level: Level; items: Item[] };

const VI_DAU =
  /[àáâãèéêìíòóôõùúýăđĩũơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/i;

/** Số từ mong muốn của câu tiếng Anh, theo độ khó. */
const LENGTH: Record<Level, { min: number; max: number; ask: string }> = {
  easy: { min: 5, max: 14, ask: '7-12 từ, một mệnh đề' },
  medium: { min: 9, max: 22, ask: '12-18 từ, hai mệnh đề nối bằng liên từ hoặc mệnh đề quan hệ' },
  hard: { min: 14, max: 34, ask: '18-28 từ, có mệnh đề phụ, bị động hoặc cấu trúc nhấn mạnh' },
};

// --------------------------------------------------------------------- kiểm tra

type Check = { ok: boolean; problems: string[] };

function checkSet(set: SetFile, topic: Topic, seenElsewhere: Set<string>): Check {
  const problems: string[] = [];

  if (set.items.length !== ITEMS_PER_SET) {
    problems.push(`có ${set.items.length} câu, cần đúng ${ITEMS_PER_SET}`);
  }

  const seenVi = new Set<string>();
  const seenEn = new Set<string>();

  for (const item of set.items) {
    const vi = (item.vi ?? '').trim();
    const en = (item.en ?? '').trim();
    const hint = (item.hint ?? '').trim();
    const nhan = vi.slice(0, 28) || '(câu rỗng)';

    if (!vi || !en || !hint) {
      problems.push(`"${nhan}" thiếu trường`);
      continue;
    }

    // Đảo ô là lỗi hay gặp nhất, và là lỗi làm hỏng cả bài luyện.
    if (!VI_DAU.test(vi)) problems.push(`"${nhan}" ô tiếng Việt không có dấu — nhiều khả năng bị đảo ô`);
    if (VI_DAU.test(en)) problems.push(`"${nhan}" ô tiếng Anh lại chứa chữ tiếng Việt`);
    if (!VI_DAU.test(hint)) problems.push(`"${nhan}" ghi chú không phải tiếng Việt`);

    const words = en.split(/\s+/).length;
    const { min, max } = LENGTH[topic.level];
    if (words < min || words > max) {
      problems.push(`"${nhan}" câu tiếng Anh ${words} từ, ngoài khoảng ${min}-${max}`);
    }

    // Câu cụt vì chạm trần token: máy bắt được qua dấu kết câu.
    if (!/[.!?]["']?$/.test(en)) problems.push(`"${nhan}" câu tiếng Anh không kết thúc bằng dấu câu`);
    if (!/^[A-Z"']/.test(en)) problems.push(`"${nhan}" câu tiếng Anh không viết hoa đầu câu`);
    if (!/[.!?]$/.test(vi)) problems.push(`"${nhan}" câu tiếng Việt không kết thúc bằng dấu câu`);

    const keyVi = vi.toLowerCase();
    const keyEn = en.toLowerCase();
    if (seenVi.has(keyVi) || seenEn.has(keyEn)) problems.push(`"${nhan}" trùng trong cùng bộ`);
    if (seenElsewhere.has(keyEn)) problems.push(`"${nhan}" trùng câu đã có ở bộ khác`);
    seenVi.add(keyVi);
    seenEn.add(keyEn);

    if (item.difficulty !== topic.level) {
      problems.push(`"${nhan}" độ khó ${item.difficulty} khác độ khó bộ ${topic.level}`);
    }
  }

  return { ok: problems.length === 0, problems: problems.slice(0, 8) };
}

// ------------------------------------------------------------------ gọi AI

function readEnv(): Record<string, string> {
  const raw = readFileSync('.env.local', 'utf8');
  const out: Record<string, string> = {};
  for (const line of raw.split(/\r?\n/)) {
    const m = /^([A-Z_]+)=(.*)$/.exec(line);
    if (m && m[1] && m[2] !== undefined) out[m[1]] = m[2].replace(/^"|"$/g, '');
  }
  return out;
}

type Door = { ten: string; url: string; key: string; model: string; gopSystem: boolean };

/**
 * Ba cửa, đúng thứ tự app dùng — xem `src/services/ai/fallback.ts`.
 *
 * Bản đầu của script này chỉ gọi Groq, và nó chết ngay ở bộ thứ tư: gói miễn phí
 * của Groq chặn theo SỐ TOKEN MỖI NGÀY, mà 40 bộ × 3000 token thì vượt xa. Thử
 * lại cùng một cửa là vô ích — 429 vì hết hạn mức thì đợi bao lâu trong một phiên
 * cũng không hết. Phải ĐỔI NHÀ CUNG CẤP, y như app làm lúc chạy thật.
 */
function doors(env: Record<string, string>): Door[] {
  return [
    {
      ten: 'groq',
      url: env.AI_PRIMARY_BASE_URL ?? '',
      key: env.AI_PRIMARY_API_KEY ?? '',
      model: env.WRITING_MODEL ?? 'openai/gpt-oss-120b',
      gopSystem: false,
    },
    {
      ten: 'ai-box',
      url: env.AI_SECONDARY_BASE_URL ?? '',
      key: env.AI_SECONDARY_API_KEY ?? '',
      model: env.AI_SECONDARY_MODEL ?? 'deepseek-v4-flash',
      gopSystem: false,
    },
    {
      ten: 'codex',
      url: env.AI_TERTIARY_BASE_URL ?? '',
      key: env.AI_TERTIARY_API_KEY ?? '',
      model: env.AI_TERTIARY_MODEL ?? 'claude-haiku-4-5-20251001',
      // Cửa này nuốt vai `system`; không gộp thì nó bỏ qua sạch mọi chỉ dẫn.
      gopSystem: env.AI_TERTIARY_FOLD_SYSTEM === 'true',
    },
  ].filter((d) => d.url && d.key);
}

async function callDoor(door: Door, system: string, user: string): Promise<string> {
  const res = await fetch(`${door.url}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${door.key}` },
    body: JSON.stringify({
      model: door.model,
      temperature: 0.7,
      max_tokens: 3000,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: door.gopSystem ? `${system}\n\n---\n\n${user}` : user },
      ],
    }),
    signal: AbortSignal.timeout(180_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 120)}`);

  const raw = await res.text();
  // Vài proxy trả SSE kể cả khi không xin stream.
  if (raw.startsWith('data:')) {
    let text = '';
    for (const line of raw.split(/\r?\n/)) {
      if (!line.startsWith('data:')) continue;
      const d = line.slice(5).trim();
      if (d === '[DONE]') break;
      try {
        text += (JSON.parse(d) as { choices?: { delta?: { content?: string } }[] }).choices?.[0]?.delta?.content ?? '';
      } catch {
        /* mảnh hỏng thì bỏ, phần còn lại vẫn ghép được */
      }
    }
    return text;
  }
  const body = JSON.parse(raw) as { choices?: { message?: { content?: string } }[] };
  return body.choices?.[0]?.message?.content ?? '';
}

/** Cửa nào hết hạn mức thì loại khỏi vòng chạy, đừng gọi lại cho tốn thời gian. */
const cuaDaChet = new Set<string>();

async function callAi(env: Record<string, string>, system: string, user: string): Promise<string> {
  const loi: string[] = [];
  for (const door of doors(env)) {
    if (cuaDaChet.has(door.ten)) continue;
    try {
      const text = await callDoor(door, system, user);
      if (text.trim()) return text;
      loi.push(`${door.ten}: trả về rỗng`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      loi.push(`${door.ten}: ${msg.slice(0, 80)}`);
      if (msg.includes('HTTP 429')) {
        console.log(`  (cửa ${door.ten} hết hạn mức, chuyển sang cửa sau và không dùng lại)`);
        cuaDaChet.add(door.ten);
      }
    }
  }
  throw new Error(`mọi cửa đều hỏng — ${loi.join(' | ')}`);
}

function extractJson<T>(text: string): T {
  const from = text.indexOf('{');
  const to = text.lastIndexOf('}');
  if (from < 0 || to <= from) throw new Error('không tìm thấy JSON trong phần trả về');
  return JSON.parse(text.slice(from, to + 1)) as T;
}

const SYSTEM = [
  'Bạn soạn bài luyện dịch Việt → Anh cho người Việt học IELTS.',
  'Chỉ trả về MỘT đối tượng JSON, không thêm lời dẫn, không bọc trong ```.',
  'Câu tiếng Việt phải tự nhiên như người Việt nói, KHÔNG phải bản dịch máy từ tiếng Anh.',
  'Câu tiếng Anh phải đúng ngữ pháp, tự nhiên với người bản ngữ, và tương ứng sát nghĩa.',
  'Ghi chú (hint) viết bằng TIẾNG VIỆT, nói tên cấu trúc ngữ pháp cần dùng.',
  'Toàn bộ câu phải do bạn tự soạn, KHÔNG chép từ sách hay đề thi có sẵn.',
].join(' ');

function promptFor(topic: Topic, avoid: string[]): string {
  const { ask } = LENGTH[topic.level];
  return [
    `Soạn ${ITEMS_PER_SET} câu luyện dịch Việt → Anh về chủ đề: ${topic.title} (${topic.scope}).`,
    `Mỗi câu tiếng Anh dài khoảng ${ask}.`,
    `Trả về JSON: {"items":[{"vi":"...","en":"...","hint":"..."}]}`,
    'Yêu cầu bắt buộc:',
    '- "vi" là câu tiếng Việt CÓ DẤU, kết thúc bằng dấu chấm.',
    '- "en" là câu tiếng Anh, viết hoa đầu câu, kết thúc bằng dấu chấm, KHÔNG chứa chữ tiếng Việt.',
    '- "hint" là ghi chú tiếng Việt ngắn (dưới 15 từ) về cấu trúc ngữ pháp dùng trong câu.',
    '- 10 câu phải khác nhau về cấu trúc ngữ pháp, đừng lặp lại một mẫu câu.',
    avoid.length > 0
      ? `- TUYỆT ĐỐI không trùng ý với các câu đã có sau đây:\n${avoid.map((s) => `  · ${s}`).join('\n')}`
      : '',
  ]
    .filter(Boolean)
    .join('\n');
}

// --------------------------------------------------------------------- chạy

async function main() {
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

  const redoArg = process.argv.indexOf('--redo');
  const redo = redoArg >= 0 ? process.argv[redoArg + 1] : undefined;
  const env = readEnv();

  // Gom mọi câu tiếng Anh đã có (kho cũ + các bộ đã sinh) để chống trùng lặp.
  const seenElsewhere = new Set<string>();
  const drills = readFileSync(join('src', 'data', 'sentence-drills.ts'), 'utf8');
  for (const m of drills.matchAll(/en: '([^']+)'/g)) {
    if (m[1]) seenElsewhere.add(m[1].toLowerCase());
  }
  for (const f of existsSync(OUT_DIR) ? readdirSync(OUT_DIR) : []) {
    if (!f.endsWith('.json')) continue;
    const prev = JSON.parse(readFileSync(join(OUT_DIR, f), 'utf8')) as SetFile;
    if (prev.slug === redo) continue;
    for (const it of prev.items) seenElsewhere.add(it.en.toLowerCase());
  }

  let made = 0;
  let skipped = 0;

  for (const topic of TOPICS) {
    const out = join(OUT_DIR, `${topic.slug}.json`);
    if (existsSync(out) && topic.slug !== redo) {
      skipped += 1;
      continue;
    }

    let done = false;
    for (let attempt = 1; attempt <= 3 && !done; attempt += 1) {
      try {
        const avoid = [...seenElsewhere].slice(-12).map((s) => s.slice(0, 60));
        const text = await callAi(env, SYSTEM, promptFor(topic, avoid));
        const parsed = extractJson<{ items: { vi: string; en: string; hint: string }[] }>(text);

        const set: SetFile = {
          slug: topic.slug,
          title: topic.title,
          blurb: topic.blurb,
          level: topic.level,
          items: (parsed.items ?? []).map((it, i) => ({
            id: `tr-${topic.slug}-${String(i + 1).padStart(2, '0')}`,
            difficulty: topic.level,
            vi: (it.vi ?? '').trim(),
            en: (it.en ?? '').trim(),
            hint: (it.hint ?? '').trim(),
          })),
        };

        const check = checkSet(set, topic, seenElsewhere);
        if (!check.ok) {
          console.log(`  lượt ${attempt} trượt: ${check.problems.join(' | ')}`);
          continue;
        }

        writeFileSync(out, `${JSON.stringify(set, null, 2)}\n`, 'utf8');
        for (const it of set.items) seenElsewhere.add(it.en.toLowerCase());
        console.log(`✔ ${topic.slug.padEnd(20)} ${set.items.length} câu (${topic.level})`);
        made += 1;
        done = true;
      } catch (err) {
        console.log(`  lượt ${attempt} lỗi: ${err instanceof Error ? err.message : err}`);
      }
    }

    if (!done) console.log(`✖ ${topic.slug} — bỏ qua sau 3 lượt, chạy lại script để thử tiếp`);
  }

  buildIndex();
  console.log(`\nSinh mới ${made} bộ, bỏ qua ${skipped} bộ đã có. Tổng cần: ${TOPICS.length}.`);
}

void main();

/**
 * Gộp các file rời thành một `index.json`.
 *
 * Metro KHÔNG nạp được `require` động, nên app không thể duyệt thư mục rồi nạp
 * từng file. Phải có đúng một file để `import` tĩnh — giống cách kho bài đọc và
 * kho song ngữ đang làm.
 *
 * Thứ tự trong index theo thứ tự TOPICS (dễ trước khó sau), KHÔNG theo thứ tự đọc
 * thư mục: thứ tự thư mục là theo bảng chữ cái, và nó sẽ trộn bài khó vào giữa
 * các bài dễ.
 */
function buildIndex(): void {
  const all: SetFile[] = [];
  for (const topic of TOPICS) {
    const f = join(OUT_DIR, `${topic.slug}.json`);
    if (!existsSync(f)) continue;
    all.push(JSON.parse(readFileSync(f, 'utf8')) as SetFile);
  }
  writeFileSync(join(OUT_DIR, 'index.json'), JSON.stringify(all) + '\n', 'utf8');
  console.log(`Gộp index.json: ${all.length} bộ, ${all.reduce((n, s) => n + s.items.length, 0)} câu.`);
}
