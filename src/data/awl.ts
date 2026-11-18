/**
 * Danh sách từ học thuật (Academic Word List) — sublist 1 và 2, 120 từ gốc hay gặp nhất trong
 * văn bản đại học và đề IELTS/SAT. Tên các từ lấy theo danh sách công khai của Coxhead (2000);
 * nghĩa tiếng Việt và câu ví dụ do Band 9 tự biên soạn.
 */

export type AwlWord = {
  word: string;
  /** Từ loại thường gặp nhất. */
  pos: string;
  vi: string;
  example: string;
  sublist: 1 | 2;
};

// sublist | từ | loại từ | nghĩa | ví dụ
const RAW = `
1|analyse|v|phân tích|Scientists analyse the data before they publish a result.
1|approach|n|cách tiếp cận|A new approach to teaching reading raised test scores.
1|area|n|khu vực, lĩnh vực|Rural areas often have fewer hospitals than cities.
1|assess|v|đánh giá|Teachers assess students with both tests and projects.
1|assume|v|cho rằng, giả định|Many people assume that expensive products are better.
1|authority|n|quyền lực, nhà chức trách|Local authorities plan to build a new bridge.
1|available|adj|có sẵn|The course is available online for all students.
1|benefit|n|lợi ích|Regular exercise has many health benefits.
1|concept|n|khái niệm|The concept of time differs between cultures.
1|consist|v|bao gồm|The committee consists of five experts.
1|constitute|v|cấu thành|Women constitute half of the workforce.
1|context|n|ngữ cảnh|You can guess a new word from its context.
1|contract|n|hợp đồng|She signed a two-year contract with the company.
1|create|v|tạo ra|The new factory will create hundreds of jobs.
1|data|n|dữ liệu|The data show a steady rise in temperature.
1|define|v|định nghĩa|Researchers must define their terms clearly.
1|derive|v|bắt nguồn|Many English words derive from Latin.
1|distribute|v|phân phát, phân bổ|The charity distributes food to poor families.
1|economy|n|nền kinh tế|Tourism is important for the economy of the region.
1|environment|n|môi trường|Plastic waste damages the marine environment.
1|establish|v|thành lập, thiết lập|The university was established in 1920.
1|estimate|v|ước tính|Experts estimate that the population will double by 2050.
1|evident|adj|rõ ràng|It was evident that the plan had failed.
1|export|v|xuất khẩu|Vietnam exports rice to many countries.
1|factor|n|yếu tố|Cost is an important factor when choosing a school.
1|finance|n|tài chính|She works in finance for a large bank.
1|formula|n|công thức|The formula for the area of a circle is simple.
1|function|n|chức năng|The main function of the heart is to pump blood.
1|identify|v|nhận ra, xác định|Doctors can identify the disease at an early stage.
1|income|n|thu nhập|Families on low income need extra support.
1|indicate|v|cho thấy|Recent surveys indicate that more people work from home.
1|individual|n|cá nhân|Each individual learns at a different speed.
1|interpret|v|giải thích, diễn giải|Different people may interpret the same poem differently.
1|involve|v|liên quan, bao gồm|The project involves students from six countries.
1|issue|n|vấn đề|Climate change is a global issue.
1|labour|n|lao động|Cheap labour attracts foreign factories.
1|legal|adj|hợp pháp, thuộc pháp luật|You need legal advice before signing the agreement.
1|legislate|v|ban hành luật|Governments legislate to protect workers.
1|major|adj|chính, lớn|Traffic is a major problem in big cities.
1|method|n|phương pháp|The scientist tested a new method of growing crops.
1|occur|v|xảy ra|Floods occur more often in the rainy season.
1|percent|n|phần trăm|About ten percent of the class failed the exam.
1|period|n|giai đoạn|The country grew quickly during this period.
1|policy|n|chính sách|The school has a strict policy on mobile phones.
1|principle|n|nguyên tắc|Honesty is a basic principle of good science.
1|proceed|v|tiếp tục, tiến hành|After the break, we proceeded to the next topic.
1|process|n|quá trình|Learning a language is a slow process.
1|require|v|yêu cầu, đòi hỏi|This job requires good communication skills.
1|research|n|nghiên cứu|Her research focuses on sleep and memory.
1|respond|v|phản hồi, đáp lại|Customers responded well to the new design.
1|role|n|vai trò|Parents play a key role in a child's education.
1|section|n|phần, mục|Read the second section of the article carefully.
1|sector|n|khu vực, ngành|The service sector employs most workers in the country.
1|significant|adj|đáng kể, quan trọng|There was a significant drop in crime last year.
1|similar|adj|tương tự|The two cities have similar climates.
1|source|n|nguồn|Always check the source of the information.
1|specific|adj|cụ thể|Please give a specific example.
1|structure|n|cấu trúc|The structure of the essay should be clear.
1|theory|n|lý thuyết|Darwin's theory changed biology.
1|vary|v|thay đổi, khác nhau|Prices vary from shop to shop.
2|achieve|v|đạt được|She worked hard to achieve her goal.
2|acquire|v|thu được, tiếp thu|Children acquire language very quickly.
2|administrate|v|quản lý, điều hành|He administrates the school's budget.
2|affect|v|ảnh hưởng đến|Noise can affect how well students concentrate.
2|appropriate|adj|phù hợp|Wear appropriate clothes for the interview.
2|aspect|n|khía cạnh|Cost is only one aspect of the decision.
2|assist|v|hỗ trợ|Volunteers assist elderly people with shopping.
2|category|n|loại, hạng mục|The books are sorted into three categories.
2|chapter|n|chương|The final chapter explains the main results.
2|commission|n|hoa hồng; ủy ban|A government commission studied the problem.
2|community|n|cộng đồng|The local community raised money for a library.
2|complex|adj|phức tạp|Climate systems are extremely complex.
2|compute|v|tính toán|The software computes the results in seconds.
2|conclude|v|kết luận|The study concludes that sleep improves memory.
2|conduct|v|tiến hành|They conducted a survey of five hundred students.
2|consequent|adj|do đó mà có|The factory closed, with a consequent loss of jobs.
2|construct|v|xây dựng|Workers constructed a new road across the valley.
2|consume|v|tiêu thụ|Cars consume large amounts of fuel.
2|credit|n|tín dụng; sự ghi công|Students receive credit for each course they pass.
2|culture|n|văn hóa|Food is an important part of Vietnamese culture.
2|design|n|thiết kế|The design of the new library won a prize.
2|distinct|adj|rõ rệt, khác biệt|The two groups have distinct needs.
2|element|n|yếu tố, nguyên tố|Trust is a key element of teamwork.
2|equate|v|coi như ngang bằng|Some people equate wealth with happiness.
2|evaluate|v|đánh giá|Teachers evaluate each essay using a clear scale.
2|feature|n|đặc điểm|The phone has several useful features.
2|final|adj|cuối cùng|The final exam takes place in June.
2|focus|v|tập trung|Students should focus on one task at a time.
2|impact|n|tác động|Social media has a strong impact on teenagers.
2|injure|v|làm bị thương|Several players were injured during the match.
2|institute|n|viện, học viện|She studies at a technology institute.
2|invest|v|đầu tư|The government invests heavily in education.
2|item|n|món, mục|Please check each item on the list.
2|journal|n|tạp chí khoa học|The results were published in a medical journal.
2|maintain|v|duy trì|It is hard to maintain a healthy diet when you are busy.
2|normal|adj|bình thường|It is normal to feel nervous before an exam.
2|obtain|v|đạt được, có được|You can obtain a visa at the embassy.
2|participate|v|tham gia|Over a thousand people participated in the study.
2|perceive|v|nhận thức, cảm nhận|Many people perceive cycling as dangerous.
2|positive|adj|tích cực|The new policy had a positive effect on health.
2|potential|n|tiềm năng|The young player has great potential.
2|previous|adj|trước đó|In the previous chapter, we discussed energy.
2|primary|adj|chính, sơ cấp|Primary schools teach children aged six to eleven.
2|purchase|v|mua|Customers can purchase tickets online.
2|range|n|phạm vi, dải|The shop sells a wide range of products.
2|region|n|vùng|The northern region is colder in winter.
2|regulate|v|điều chỉnh, quản lý|Laws regulate how companies use personal data.
2|relevant|adj|có liên quan|Include only relevant information in your report.
2|reside|v|cư trú|Around two million people reside in the capital.
2|resource|n|tài nguyên|Water is a precious natural resource.
2|restrict|v|hạn chế|The city restricts the use of cars in the centre.
2|secure|adj|an toàn, chắc chắn|A secure password contains letters and numbers.
2|seek|v|tìm kiếm|Many graduates seek jobs abroad.
2|select|v|chọn|Select the best answer for each question.
2|site|n|địa điểm, trang web|The building site was closed for safety reasons.
2|strategy|n|chiến lược|A good strategy helps you manage your time in the exam.
2|survey|n|khảo sát|The survey shows that most students prefer online lessons.
2|text|n|văn bản|Read the text and answer the questions below.
2|tradition|n|truyền thống|Tet is the most important tradition in Vietnam.
2|transfer|v|chuyển|She transferred to a different university last year.
`;

export const AWL: readonly AwlWord[] = RAW.trim()
  .split('\n')
  .map((line) => {
    const [sub, word, pos, vi, example] = line.split('|');
    return { sublist: Number(sub) as 1 | 2, word: word!, pos: pos!, vi: vi!, example: example! };
  });

export const AWL_SUBLISTS: readonly (1 | 2)[] = [1, 2];

export function awlOfSublist(n: 1 | 2): AwlWord[] {
  return AWL.filter((w) => w.sublist === n);
}
