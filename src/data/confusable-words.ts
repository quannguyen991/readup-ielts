/**
 * Cặp từ dễ nhầm (16/11/2026): 40 cặp người học Việt hay dùng lẫn. Mỗi cặp có nghĩa, một câu ví dụ
 * cho từng từ và một mẹo nhớ ngắn. Câu ví dụ chứa đúng dạng từ gốc để làm bài điền từ.
 * Nội dung do Band 9 tự biên soạn.
 */

export type ConfusablePair = {
  a: string;
  b: string;
  viA: string;
  viB: string;
  exA: string;
  exB: string;
  tip: string;
};

// a | b | nghĩa a | nghĩa b | ví dụ a | ví dụ b | mẹo
const RAW = `
affect|effect|(v) ảnh hưởng đến|(n) tác động, kết quả|Noise can affect your sleep.|The effect of the new law was immediate.|Affect là hành động (A = action), effect là kết quả (E = end result).
advice|advise|(n) lời khuyên|(v) khuyên|She gave me some useful advice.|Doctors advise people to drink more water.|Danh từ đuôi -ice, động từ đuôi -ise.
borrow|lend|mượn (từ ai)|cho mượn|Can I borrow your pen?|Could you lend me your pen?|Borrow là nhận về, lend là đưa đi.
bring|take|mang đến chỗ người nói|mang đi nơi khác|Please bring your book to class tomorrow.|Take this umbrella with you when you leave.|Bring hướng về đây, take hướng ra xa.
economic|economical|thuộc kinh tế|tiết kiệm|The government announced a new economic plan.|This car is very economical on fuel.|Economic nói về nền kinh tế, economical nói về sự tiết kiệm.
fun|funny|vui, thú vị|buồn cười|The school trip was great fun.|He told a funny story that made everyone laugh.|Funny là làm bạn cười thành tiếng.
historic|historical|có ý nghĩa lịch sử lớn|thuộc về lịch sử|The signing of the treaty was a historic moment.|She reads historical novels set in the 1800s.|Historic là trọng đại, historical là liên quan đến quá khứ.
lose|loose|làm mất, thua|lỏng, rộng|Don't lose your ticket.|This shirt is too loose for me.|Loose có hai chữ o nên "lỏng" hơn.
principal|principle|hiệu trưởng; chính|nguyên tắc|The principal welcomed the new students.|Honesty is a basic principle of good science.|Principal có "pal" (bạn) là người đứng đầu trường.
quiet|quite|yên tĩnh|khá, hoàn toàn|The library is very quiet in the morning.|The exam was quite difficult.|Quiet đọc hai âm tiết, quite đọc một.
raise|rise|nâng lên, tăng (có tân ngữ)|tăng lên (không tân ngữ)|The shop will raise its prices in June.|Prices rise every year.|Raise cần tân ngữ, rise tự nó tăng.
remember|remind|nhớ ra|nhắc ai nhớ|I remember my first day at school.|Please remind me to call my mother.|Remind luôn có người bị nhắc đi kèm.
sensible|sensitive|biết điều, hợp lý|nhạy cảm|It is sensible to save some money every month.|She is sensitive to criticism.|Sensible là khôn ngoan, sensitive là dễ cảm nhận.
stationary|stationery|đứng yên|văn phòng phẩm|The car remained stationary at the red light.|He bought some stationery for school.|Stationery có "er" như "paper", giấy bút.
than|then|hơn (so sánh)|sau đó|My brother is taller than me.|We had lunch and then went home.|Than để so sánh, then chỉ thời gian.
their|there|của họ|ở đó|The students forgot their homework.|Put the box over there.|There có chữ here: chỉ nơi chốn.
through|though|xuyên qua|mặc dù|The train went through a long tunnel.|Though it was raining, we went out.|Though = although, nhấn mạnh sự trái ngược.
wear|carry|mặc, đeo|mang, xách|Students must wear a uniform.|She has to carry a heavy bag every day.|Wear nằm trên người, carry nằm trong tay hoặc túi.
who|whom|chủ ngữ (ai)|tân ngữ (ai)|Who wrote this essay?|To whom should I send the report?|Thử thay bằng he (who) hoặc him (whom).
who's|whose|who is / who has|của ai|Who's coming to the party tonight?|Whose bag is this on the table?|Who's luôn có thể mở thành who is.
your|you're|của bạn|you are|Is this your phone?|You're going to pass the test.|Nếu thay bằng "you are" được thì dùng you're.
accept|except|chấp nhận|ngoại trừ|She decided to accept the job offer.|Everyone passed the test except Tom.|Accept bắt đầu bằng ac, hành động nhận.
adapt|adopt|thích nghi|nhận nuôi; áp dụng|Animals must adapt to a changing climate.|The school adopted a new reading programme.|Adapt = thích nghi, adopt = nhận lấy.
alternate|alternative|luân phiên|lựa chọn khác|The two teams alternate each week.|Solar power is a clean alternative to coal.|Alternative là phương án thay thế.
amount|number|lượng (không đếm được)|số (đếm được)|There is a large amount of water in the tank.|A large number of students joined the club.|Number đi với danh từ đếm được.
beside|besides|bên cạnh|ngoài ra|The cat sat beside the window.|Besides English, she speaks French.|Besides có thêm s như "thêm vào".
compliment|complement|lời khen|bổ sung, đi cùng nhau|He gave her a compliment on her speech.|The sauce complements the fish perfectly.|Compliment có "i" như "I like it".
conscious|conscience|tỉnh táo, nhận thức|lương tâm|The patient was conscious after the operation.|He had a guilty conscience after lying.|Conscience là tiếng nói bên trong.
continual|continuous|lặp đi lặp lại|liên tục không ngắt|Continual noise from the road kept waking me up.|There was continuous rain for three days.|Continual có ngắt quãng, continuous thì không.
council|counsel|hội đồng|lời khuyên, tư vấn|The city council voted on the new park.|She sought counsel from a lawyer.|Council là nhóm người, counsel là lời khuyên.
elder|older|lớn tuổi hơn (trong gia đình)|già hơn (nói chung)|My elder sister works in London.|This building is older than that one.|Elder chỉ dùng cho người trong gia đình.
farther|further|xa hơn (khoảng cách)|thêm nữa|The beach is farther than I thought.|We need further information before we decide.|Farther là xa thật, further là thêm hoặc sâu hơn.
imply|infer|ngụ ý (người nói)|suy ra (người nghe)|His silence seemed to imply that he disagreed.|From her smile, I inferred that she was pleased.|Imply do người nói, infer do người nghe.
lay|lie|đặt, để (có tân ngữ)|nằm|Please lay the books on the table.|I like to lie on the sofa and read.|Lay cần có thứ được đặt xuống.
make|do|làm ra, tạo ra|thực hiện, làm việc|She likes to make cakes at weekends.|I have to do my homework tonight.|Make tạo ra thứ mới, do là thực hiện việc.
rob|steal|cướp (nơi, người)|lấy trộm (đồ vật)|Two men robbed the bank last night.|Thieves often steal bicycles near the station.|Rob đi với nơi chốn, steal đi với đồ vật.
say|tell|nói (lời nói)|kể, bảo (ai)|Please say that again more slowly.|Can you tell me the way to the station?|Tell thường có người nghe đi liền sau.
sometime|sometimes|vào một lúc nào đó|đôi khi|Let's meet sometime next week.|Sometimes I walk to school.|Sometimes là tần suất, sometime là một thời điểm.
its|it's|của nó|it is / it has|The dog wagged its tail.|It's a beautiful day today.|Nếu thay bằng it is được thì dùng it's.
used to|be used to|đã từng (thói quen cũ)|quen với|I used to live in a small village.|You will soon be used to the cold weather.|Be used to + V-ing nghĩa là đã quen.
`;

export const CONFUSABLE_PAIRS: readonly ConfusablePair[] = RAW.trim()
  .split('\n')
  .map((line) => {
    const [a, b, viA, viB, exA, exB, tip] = line.split('|');
    return { a: a!, b: b!, viA: viA!, viB: viB!, exA: exA!, exB: exB!, tip: tip! };
  });

/** Thay từ trong câu bằng chỗ trống (không phân biệt hoa thường, chỉ thay lần đầu). */
export function blankOut(sentence: string, word: string): string {
  const i = sentence.toLowerCase().indexOf(word.toLowerCase());
  if (i < 0) return sentence;
  return sentence.slice(0, i) + '_____' + sentence.slice(i + word.length);
}

export type ConfusableQuestion = { sentence: string; options: [string, string]; answer: 0 | 1; pair: ConfusablePair };

/** Mỗi cặp ra hai câu: một câu đúng từ A, một câu đúng từ B. Thứ tự lựa chọn xáo theo `seed`. */
export function questionsFor(pairs: readonly ConfusablePair[], seed = 0): ConfusableQuestion[] {
  const out: ConfusableQuestion[] = [];
  pairs.forEach((pair, i) => {
    for (const side of ['a', 'b'] as const) {
      const flip = (i + (side === 'a' ? 0 : 1) + seed) % 2 === 1;
      const word = side === 'a' ? pair.a : pair.b;
      const other = side === 'a' ? pair.b : pair.a;
      const options: [string, string] = flip ? [other, word] : [word, other];
      out.push({ sentence: blankOut(side === 'a' ? pair.exA : pair.exB, word), options, answer: flip ? 1 : 0, pair });
    }
  });
  return out;
}
