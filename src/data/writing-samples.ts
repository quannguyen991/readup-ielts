/**
 * IELTS Writing models — bài tự biên soạn và các mẫu nguồn đã được người dùng
 * xác nhận có quyền sử dụng. Giữ provenance trên từng mẫu nguồn.
 */
import { WRITING_SAMPLES_EXTRA_OPINION } from './writing-samples-extra-opinion';
import { WRITING_SAMPLES_EXTRA_DISCUSSION } from './writing-samples-extra-discussion';
import { WRITING_SAMPLES_EXTRA_ADVANTAGES } from './writing-samples-extra-advantages';
import { WRITING_SAMPLES_EXTRA_SOLUTIONS } from './writing-samples-extra-solutions';
import { WRITING_SAMPLES_EXTRA_TWO_PART } from './writing-samples-extra-two-part';
import { WRITING_SAMPLES_EXTRA_OPINION_2 } from './writing-samples-extra-opinion-2';
import { WRITING_SAMPLES_EXTRA_DISCUSSION_2 } from './writing-samples-extra-discussion-2';
import { WRITING_SAMPLES_EXTRA_ADVANTAGES_2 } from './writing-samples-extra-advantages-2';
import { WRITING_SAMPLES_EXTRA_TASK1 } from './writing-samples-extra-task1';
import { WRITING_SAMPLES_EXTRA_SOLUTIONS_2 } from './writing-samples-extra-solutions-2';
import { TID_TASK1_SAMPLES, TID_TASK2_SAMPLES } from './tid';
import type { ChartData, MapPanel } from '@/lib/writing/types';

export type WritingSampleTask = 'ielts_task1' | 'ielts_task2';
export type WritingSampleChart = 'line' | 'bar' | 'pie' | 'table' | 'mixed' | 'process' | 'map';
export type WritingSampleEssayKind = 'opinion' | 'discussion' | 'advantage_disadvantage' | 'problem_solution' | 'two_part';
export type WritingSampleSection = 'introduction' | 'overview' | 'body1' | 'body2' | 'conclusion';

export type WritingSampleParagraph = {
  id: string;
  section: WritingSampleSection;
  en: string;
  vi: string;
  focusVi: string;
  sourceSection?: string;
  sourceWords?: number;
  sourceSentences?: { en: string; vi: string }[];
};

export type WritingSampleSourceChart = {
  title: string;
  unit?: string;
  imageAlt?: string;
  assetUrl?: string | null;
  type?: string;
  kind?: string;
  series?: string[];
  labels?: string[];
  axisTicks?: string[];
  chartVisualLabelsSource?: string;
  dataAvailability?: string;
  dataTables?: Array<{
    title?: string;
    columns: string[];
    rows: Array<{ label: string; values: Array<string | number> }>;
    dataPrecision?: 'exact' | 'approximate';
  }>;
  steps?: string[];
  isCycle?: boolean;
  panels?: MapPanel[];
  dataPrecision?: 'exact' | 'approximate';
  chartAnnotations?: string[];
};

export type WritingSample = {
  id: string;
  task: WritingSampleTask;
  topicSlug: string;
  topicEn: string;
  topicVi: string;
  title: string;
  promptText: string;
  promptId?: string;
  chartKind?: WritingSampleChart;
  essayKind?: WritingSampleEssayKind;
  band: number;
  paragraphs: WritingSampleParagraph[];
  vocabulary: { phrase: string; meaningVi: string; noteVi: string }[];
  sourceName?: string;
  sourceUrl?: string;
  sourceTopic?: string;
  sourceSampleId?: number;
  sourceEssayType?: string;
  bandLabel?: string;
  sourceWordCount?: number;
  sourceSentenceCount?: number;
  sourceChartType?: string;
  sourceCharts?: WritingSampleSourceChart[];
  sourceChartData?: ChartData | null;
};

type ParagraphSeed = Omit<WritingSampleParagraph, 'id' | 'section'>;

function essayKindOf(prompt: string): WritingSampleEssayKind {
  if (/discuss both/i.test(prompt)) return 'discussion';
  if (/advantages? outweigh|advantages and disadvantages/i.test(prompt)) return 'advantage_disadvantage';
  if (/what (?:are|is) (?:the )?(?:main )?(?:causes|reasons)|what causes|what measures|what solutions|what can (?:be )?done/i.test(prompt)) return 'problem_solution';
  if (/to what extent|agree or disagree/i.test(prompt)) return 'opinion';
  return 'two_part';
}

function paragraph(sampleId: string, index: number, seed: ParagraphSeed & { section: WritingSampleParagraph['section'] }): WritingSampleParagraph {
  return { id: `${sampleId}-p${index + 1}`, ...seed };
}

function task2(input: {
  id: string; topicSlug: string; topicEn: string; topicVi: string; title: string;
  promptText: string; promptId?: string; essayKind?: WritingSampleEssayKind; paragraphs: [ParagraphSeed, ParagraphSeed, ParagraphSeed, ParagraphSeed];
  vocabulary: WritingSample['vocabulary']; band?: number;
}): WritingSample {
  const sections: WritingSampleSection[] = ['introduction', 'body1', 'body2', 'conclusion'];
  return {
    ...input,
    task: 'ielts_task2',
    promptId: input.promptId ?? `w-${input.id}`,
    essayKind: input.essayKind ?? essayKindOf(input.promptText),
    band: input.band ?? 8.0,
    paragraphs: input.paragraphs.map((p, i) => paragraph(input.id, i, { ...p, section: sections[i]! })),
  };
}

function task1(input: {
  id: string; topicSlug: string; topicEn: string; topicVi: string; title: string;
  promptText: string; promptId?: string; chartKind: WritingSampleChart;
  paragraphs: [ParagraphSeed, ParagraphSeed, ParagraphSeed, ParagraphSeed];
  vocabulary: WritingSample['vocabulary']; band?: number;
}): WritingSample {
  const sections: WritingSampleSection[] = ['introduction', 'overview', 'body1', 'body2'];
  return {
    ...input,
    task: 'ielts_task1',
    band: input.band ?? 8.0,
    paragraphs: input.paragraphs.map((p, i) => paragraph(input.id, i, { ...p, section: sections[i]! })),
  };
}

const CORE_WRITING_SAMPLES: WritingSample[] = [
  task2({
    id: 'sample-t2-education', topicSlug: 'education', topicEn: 'Education', topicVi: 'Giáo dục',
    title: 'Universities and preparation for work',
    promptText: 'Some people think universities should mainly prepare students for employment, while others believe they should provide broader knowledge. Discuss both views and give your opinion.',
    paragraphs: [
      { en: 'Universities are increasingly expected to prove that their graduates can contribute to the economy. Some people therefore favour job-focused courses, whereas others defend a wider academic education. Although career preparation is essential, I believe universities should combine it with intellectual breadth rather than pursue either aim alone.', vi: 'Các trường đại học ngày càng được kỳ vọng chứng minh rằng sinh viên tốt nghiệp có thể đóng góp cho nền kinh tế. Vì vậy, một số người ủng hộ các chương trình tập trung vào nghề nghiệp, trong khi những người khác bảo vệ nền giáo dục học thuật rộng hơn. Dù việc chuẩn bị cho công việc là thiết yếu, tôi cho rằng đại học nên kết hợp điều đó với kiến thức đa dạng thay vì chỉ theo đuổi một mục tiêu.', focusVi: 'Mở bài diễn đạt lại hai quan điểm rồi nêu lập trường kết hợp.' },
      { en: 'Those who prioritise employability point out that students invest several years and substantial fees in higher education. A course in nursing, engineering or accounting should therefore include supervised practice, current professional standards and contact with employers. This training makes the transition into a first job less abrupt and helps businesses recruit people who can contribute quickly. In fields where mistakes carry serious consequences, practical competence is not an optional extra.', vi: 'Những người ưu tiên khả năng có việc làm cho rằng sinh viên đầu tư nhiều năm và khoản học phí đáng kể cho bậc đại học. Vì vậy, chương trình điều dưỡng, kỹ thuật hay kế toán cần có thực hành được giám sát, tiêu chuẩn nghề nghiệp hiện hành và cơ hội tiếp xúc với nhà tuyển dụng. Việc đào tạo này giúp quá trình chuyển sang công việc đầu tiên bớt đột ngột và giúp doanh nghiệp tuyển được người có thể đóng góp sớm. Ở những ngành mà sai sót gây hậu quả nghiêm trọng, năng lực thực hành không phải phần bổ sung tuỳ chọn.', focusVi: 'Thân bài 1 phát triển quan điểm ưu tiên kỹ năng nghề bằng lý do và hệ quả.' },
      { en: 'However, a university is not simply a vocational college. Graduates will change roles during their careers, and many will face questions that have no ready-made technical answer. Courses in history, statistics or ethics can teach them to assess evidence, recognise bias and explain decisions to different audiences. These abilities make workers adaptable; they also reduce the risk that a narrow specialist follows a procedure without understanding its wider effects. Employers can teach a new software package, but critical judgement takes longer to develop.', vi: 'Tuy nhiên, đại học không chỉ là một trường dạy nghề. Người tốt nghiệp sẽ đổi vị trí trong sự nghiệp và nhiều người phải đối mặt với những câu hỏi không có sẵn lời giải kỹ thuật. Các môn lịch sử, thống kê hoặc đạo đức có thể dạy họ đánh giá bằng chứng, nhận ra thiên kiến và giải thích quyết định cho nhiều nhóm người nghe. Những năng lực này giúp người lao động thích nghi; chúng cũng giảm nguy cơ một chuyên gia hẹp làm theo quy trình mà không hiểu tác động rộng hơn. Nhà tuyển dụng có thể dạy phần mềm mới, nhưng tư duy phản biện cần nhiều thời gian hơn để hình thành.', focusVi: 'Thân bài 2 nhượng bộ có giới hạn, rồi bảo vệ giá trị chuyển đổi lâu dài.' },
      { en: 'In my view, the strongest degree gives students both a credible route into work and the ability to keep learning afterwards. Universities should embed placements and applied projects in relevant courses while preserving options that broaden reasoning and communication. This balance serves graduates, employers and society more reliably than treating education as job training alone.', vi: 'Theo tôi, chương trình tốt nhất vừa mở ra con đường đáng tin cậy vào nghề nghiệp, vừa giúp sinh viên tiếp tục học sau khi tốt nghiệp. Đại học nên đưa kỳ thực tập và dự án ứng dụng vào các ngành phù hợp, đồng thời giữ những lựa chọn mở rộng tư duy và giao tiếp. Sự cân bằng này phục vụ sinh viên, nhà tuyển dụng và xã hội đáng tin cậy hơn cách xem giáo dục chỉ là đào tạo nghề.', focusVi: 'Kết luận chốt giải pháp dung hoà, nhất quán với quan điểm ở mở bài.' },
    ],
    vocabulary: [
      { phrase: 'employability', meaningVi: 'khả năng có việc làm', noteVi: 'Danh từ học thuật, dùng khi bàn về kỹ năng đáp ứng thị trường lao động.' },
      { phrase: 'supervised practice', meaningVi: 'thực hành có giám sát', noteVi: 'Cụm danh từ cụ thể hoá cách đào tạo gắn với nghề.' },
      { phrase: 'intellectual breadth', meaningVi: 'chiều rộng tri thức', noteVi: 'Cách diễn đạt cô đọng cho nền tảng kiến thức đa ngành.' },
    ],
  }),
  task2({
    id: 'sample-t2-environment', topicSlug: 'environment', topicEn: 'Environment', topicVi: 'Môi trường',
    title: 'Who should reduce household waste?',
    promptText: 'Household waste continues to rise despite public campaigns. What causes this problem, and what measures could individuals and governments take?',
    paragraphs: [
      { en: 'The volume of rubbish produced by households remains high even in places where recycling is widely promoted. This is partly because disposable packaging and low-cost goods make throwing things away convenient, while waste systems rarely make the environmental cost visible. Individuals can change everyday habits, but lasting progress also depends on how products are designed and collected.', vi: 'Lượng rác do các hộ gia đình tạo ra vẫn cao ngay cả ở những nơi khuyến khích tái chế rộng rãi. Một phần nguyên nhân là bao bì dùng một lần và hàng hoá giá rẻ khiến việc vứt bỏ trở nên tiện lợi, trong khi hệ thống xử lý hiếm khi cho thấy rõ chi phí môi trường. Cá nhân có thể thay đổi thói quen hằng ngày, nhưng tiến bộ lâu dài còn phụ thuộc vào cách sản phẩm được thiết kế và thu gom.', focusVi: 'Mở bài nêu nguyên nhân ở cả hành vi cá nhân lẫn hệ thống.' },
      { en: 'A major driver is the price and convenience of single-use products. A family buying individually wrapped snacks or replacing a faulty appliance may spend less time and money than repairing or choosing a refillable alternative. Retailers also discard edible food when appearance standards are strict, and consumers often overbuy because promotions reward large quantities. Public messages about sorting rubbish cannot overcome these incentives by themselves. When the easiest option creates the most waste, people will commonly follow it.', vi: 'Động lực lớn là giá cả và sự tiện lợi của sản phẩm dùng một lần. Một gia đình mua đồ ăn vặt đóng gói riêng hoặc thay thiết bị hỏng có thể tốn ít thời gian và tiền bạc hơn việc sửa chữa hay chọn đồ có thể nạp lại. Nhà bán lẻ cũng bỏ thực phẩm còn ăn được khi tiêu chuẩn hình thức quá khắt khe, còn người tiêu dùng thường mua quá mức vì khuyến mãi ưu đãi số lượng lớn. Thông điệp phân loại rác không thể tự mình khắc phục các động cơ này. Khi lựa chọn dễ nhất tạo ra nhiều rác nhất, mọi người thường sẽ chọn nó.', focusVi: 'Thân bài 1 phân tích các động cơ kinh tế và tính tiện lợi đứng sau vấn đề.' },
      { en: 'Governments can make prevention easier by requiring durable packaging, deposit-return schemes and clear repair information. Municipalities should provide reliable collection for food scraps and recyclables, since residents are unlikely to sort materials that are later mixed together. Individuals can plan meals, carry reusable containers and repair items where possible. These choices matter most when local services support them: a household cannot compost responsibly if no collection or community site exists.', vi: 'Chính phủ có thể khiến việc giảm rác dễ thực hiện hơn bằng cách yêu cầu bao bì bền, áp dụng cơ chế đặt cọc hoàn tiền và cung cấp thông tin sửa chữa rõ ràng. Chính quyền địa phương nên thu gom ổn định rác thực phẩm và đồ tái chế, vì cư dân khó có động lực phân loại nếu vật liệu sau đó lại bị trộn chung. Mỗi người có thể lên kế hoạch bữa ăn, mang hộp dùng lại và sửa đồ khi có thể. Những lựa chọn này chỉ phát huy tối đa khi dịch vụ địa phương hỗ trợ; một hộ gia đình không thể ủ phân đúng cách nếu không có điểm thu gom hay khu vực cộng đồng.', focusVi: 'Thân bài 2 đưa ra giải pháp theo hai cấp và gắn trách nhiệm cá nhân với hạ tầng.' },
      { en: 'Household waste is therefore not simply the result of careless consumers. Better daily decisions help, but governments and producers must remove the incentives that favour disposable goods and build dependable collection systems. Combining these measures can reduce rubbish at its source instead of relying on recycling after unnecessary consumption has already occurred.', vi: 'Vì vậy, rác thải hộ gia đình không chỉ là kết quả của người tiêu dùng bất cẩn. Quyết định tốt hơn mỗi ngày có ích, nhưng chính phủ và nhà sản xuất cần loại bỏ động cơ khuyến khích hàng dùng một lần và xây dựng hệ thống thu gom đáng tin cậy. Kết hợp các biện pháp này có thể giảm rác ngay từ nguồn thay vì chỉ trông cậy vào tái chế sau khi việc tiêu thụ không cần thiết đã diễn ra.', focusVi: 'Kết luận tổng hợp giải pháp và nhấn mạnh giảm rác từ đầu nguồn.' },
    ],
    vocabulary: [
      { phrase: 'single-use products', meaningVi: 'sản phẩm dùng một lần', noteVi: 'Từ vựng trọng tâm cho chủ đề tiêu dùng và rác thải.' },
      { phrase: 'deposit-return scheme', meaningVi: 'cơ chế đặt cọc hoàn tiền', noteVi: 'Tên chính sách khuyến khích người mua trả lại bao bì.' },
      { phrase: 'at its source', meaningVi: 'ngay từ nguồn phát sinh', noteVi: 'Cụm thường dùng với prevent, reduce hoặc tackle waste.' },
    ],
  }),
  task2({
    id: 'sample-t2-technology', topicSlug: 'technology', topicEn: 'Technology', topicVi: 'Công nghệ',
    title: 'Artificial intelligence in the workplace',
    promptText: 'Artificial intelligence is likely to perform many tasks currently done by people. Is this a positive or negative development?',
    paragraphs: [
      { en: 'Artificial intelligence is moving from experimental software into ordinary workplaces, where it can search records, draft routine messages and identify patterns in large datasets. This change will displace some tasks, but I consider it broadly positive if employers and governments help workers move into roles that require human judgement, care and accountability.', vi: 'Trí tuệ nhân tạo đang chuyển từ phần mềm thử nghiệm vào nơi làm việc thông thường, nơi nó có thể tìm hồ sơ, soạn thư từ thường ngày và nhận diện quy luật trong bộ dữ liệu lớn. Sự thay đổi này sẽ thay thế một số nhiệm vụ, nhưng tôi nhìn chung xem đây là diễn biến tích cực nếu nhà tuyển dụng và chính phủ giúp người lao động chuyển sang những vai trò đòi hỏi phán đoán, chăm sóc và trách nhiệm của con người.', focusVi: 'Mở bài công nhận tác động thay thế và xác lập quan điểm tích cực có điều kiện.' },
      { en: 'The clearest benefit is that automated systems can take over repetitive work quickly and consistently. In a hospital, for example, software can organise appointment records so clinicians spend less time searching for information; in a warehouse, machines can move heavy loads that would otherwise injure staff. When routine work is reduced, organisations may serve more people with the same resources. The saved time can also be redirected to complex cases that require empathy or an explanation tailored to an individual.', vi: 'Lợi ích rõ nhất là hệ thống tự động có thể đảm nhận công việc lặp lại nhanh chóng và ổn định. Chẳng hạn, ở bệnh viện, phần mềm có thể sắp xếp hồ sơ hẹn khám để nhân viên y tế bớt thời gian tìm thông tin; tại kho hàng, máy móc có thể di chuyển vật nặng vốn có thể gây chấn thương cho nhân viên. Khi khối lượng việc thường nhật giảm, tổ chức có thể phục vụ nhiều người hơn với cùng nguồn lực. Thời gian tiết kiệm cũng có thể chuyển sang các trường hợp phức tạp cần sự đồng cảm hoặc lời giải thích phù hợp với từng người.', focusVi: 'Thân bài 1 giải thích năng suất bằng ví dụ ở y tế và kho vận.' },
      { en: 'Nevertheless, the gains will not be shared automatically. A clerical worker whose duties are automated may not qualify for a technical position without training, and a community dependent on one large employer can be badly affected by rapid redundancies. There is also a danger that managers trust an algorithm even when its recommendation is biased or wrong. Employers should therefore consult staff before introducing systems, fund paid retraining and keep a named human decision-maker responsible for consequential choices.', vi: 'Dù vậy, lợi ích sẽ không tự động được chia sẻ công bằng. Một nhân viên hành chính có nhiệm vụ bị tự động hoá có thể không đủ điều kiện cho công việc kỹ thuật nếu chưa được đào tạo, còn cộng đồng phụ thuộc vào một nhà tuyển dụng lớn có thể bị ảnh hưởng nặng bởi việc cắt giảm nhân sự nhanh chóng. Ngoài ra, quản lý có thể quá tin vào thuật toán ngay cả khi đề xuất của nó thiên lệch hoặc sai. Vì thế, nhà tuyển dụng nên tham khảo nhân viên trước khi áp dụng hệ thống, tài trợ đào tạo lại có lương và chỉ định một người chịu trách nhiệm cho các quyết định quan trọng.', focusVi: 'Thân bài 2 chỉ ra rủi ro phân phối và đưa ra biện pháp chuyển đổi có trách nhiệm.' },
      { en: 'AI should be judged by whether it improves people’s work and quality of life, not by how many jobs it can eliminate. With retraining, worker consultation and clear human oversight, automation can remove drudgery while preserving dignity and opportunity. Without those safeguards, the same technology could deepen insecurity for the people least able to absorb it.', vi: 'Nên đánh giá AI dựa trên việc nó cải thiện công việc và chất lượng sống của con người ra sao, thay vì đếm số việc làm bị xoá bỏ. Với đào tạo lại, tham vấn người lao động và cơ chế giám sát rõ ràng của con người, tự động hoá có thể loại bỏ việc nhàm chán mà vẫn giữ phẩm giá và cơ hội. Thiếu những bảo đảm này, công nghệ tương tự có thể làm tình trạng bấp bênh trầm trọng hơn đối với những người ít khả năng chống đỡ nhất.', focusVi: 'Kết luận nhắc lại tiêu chí đánh giá và điều kiện để quan điểm tích cực đúng.' },
    ],
    vocabulary: [
      { phrase: 'repetitive work', meaningVi: 'công việc lặp đi lặp lại', noteVi: 'Kết hợp tự nhiên với automate hoặc take over.' },
      { phrase: 'paid retraining', meaningVi: 'đào tạo lại có trả lương', noteVi: 'Giải pháp cụ thể, thể hiện trách nhiệm của nhà tuyển dụng.' },
      { phrase: 'human oversight', meaningVi: 'sự giám sát của con người', noteVi: 'Cụm hữu ích khi bàn về AI và trách nhiệm giải trình.' },
    ],
  }),
  task2({
    id: 'sample-t2-health', topicSlug: 'health', topicEn: 'Health', topicVi: 'Sức khoẻ',
    title: 'Preventive care and public health budgets',
    promptText: 'Governments should spend more on preventing illness than on treating people after they become sick. To what extent do you agree or disagree?',
    paragraphs: [
      { en: 'Health budgets are often stretched by the cost of treating chronic disease, which has led to calls for greater investment in prevention. I largely agree: vaccination, early screening and healthier public environments can avert suffering and reduce future costs. However, prevention must complement accessible treatment rather than replace it.', vi: 'Ngân sách y tế thường chịu áp lực từ chi phí điều trị bệnh mạn tính, khiến nhiều người kêu gọi đầu tư nhiều hơn cho phòng bệnh. Tôi phần lớn đồng ý: tiêm chủng, tầm soát sớm và môi trường công cộng lành mạnh hơn có thể ngăn đau đớn và giảm chi phí tương lai. Tuy nhiên, phòng bệnh phải bổ trợ cho điều trị dễ tiếp cận chứ không thay thế nó.', focusVi: 'Mở bài nêu lập trường đồng ý phần lớn và đặt giới hạn.' },
      { en: 'Preventive programmes can reach people before a condition becomes expensive or irreversible. A mobile screening clinic may detect high blood pressure in residents who rarely visit a doctor, allowing lifestyle support or medication to begin early. Likewise, safe footpaths and affordable sports facilities make physical activity a practical part of daily life instead of a choice reserved for people with time and money. These measures are especially valuable for low-income communities, where untreated illness can lead to missed work and worsening hardship.', vi: 'Chương trình phòng ngừa có thể tiếp cận mọi người trước khi bệnh trở nên tốn kém hoặc không thể đảo ngược. Một phòng khám tầm soát lưu động có thể phát hiện huyết áp cao ở cư dân hiếm khi đi khám, nhờ đó hỗ trợ thay đổi lối sống hoặc dùng thuốc sớm. Tương tự, lối đi an toàn và cơ sở thể thao giá hợp lý giúp vận động trở thành phần thiết thực của đời sống hằng ngày, thay vì lựa chọn chỉ dành cho người có thời gian và tiền bạc. Những biện pháp này đặc biệt quý với cộng đồng thu nhập thấp, nơi bệnh không được điều trị có thể khiến người dân nghỉ làm và thêm khó khăn.', focusVi: 'Thân bài 1 đưa ví dụ phòng bệnh và giải thích lợi ích công bằng.' },
      { en: 'Yet not every illness can be prevented, and public campaigns sometimes imply that patients are to blame for conditions shaped by genetics, poverty or pollution. A person with cancer, an injury or a severe infection needs timely specialist care regardless of how much prevention funding exists. Governments should therefore protect emergency and primary care while directing additional money towards interventions that have credible evidence of benefit. Evaluation is important too: a well-publicised campaign is not necessarily an effective one.', vi: 'Dù vậy, không phải bệnh nào cũng có thể phòng tránh, và chiến dịch cộng đồng đôi khi ngụ ý bệnh nhân phải chịu trách nhiệm cho tình trạng bị ảnh hưởng bởi di truyền, nghèo đói hoặc ô nhiễm. Người mắc ung thư, chấn thương hay nhiễm trùng nặng cần được điều trị chuyên khoa kịp thời bất kể ngân sách phòng ngừa lớn đến đâu. Vì thế, chính phủ nên bảo vệ dịch vụ cấp cứu và chăm sóc ban đầu, đồng thời dành thêm tiền cho những can thiệp có bằng chứng lợi ích đáng tin cậy. Việc đánh giá cũng rất quan trọng: chiến dịch được quảng bá rầm rộ chưa chắc hiệu quả.', focusVi: 'Thân bài 2 tránh quy lỗi cho người bệnh và bảo vệ năng lực điều trị.' },
      { en: 'Prevention deserves a larger and more deliberate place in public health planning because it can stop avoidable illness before it harms families and services. It should not become an excuse to withdraw treatment from people who are already sick. A balanced budget invests in healthier conditions while keeping high-quality care available when prevention is not enough.', vi: 'Phòng bệnh xứng đáng có vị trí lớn hơn và được hoạch định chủ động hơn trong y tế công vì có thể ngăn bệnh có thể tránh trước khi nó gây tổn hại cho gia đình và dịch vụ. Điều này không nên trở thành cái cớ để rút điều trị khỏi những người đã mắc bệnh. Ngân sách cân bằng đầu tư vào điều kiện sống lành mạnh hơn, đồng thời duy trì dịch vụ chất lượng cao khi phòng ngừa không đủ.', focusVi: 'Kết luận khẳng định ưu tiên phòng bệnh nhưng bảo đảm điều trị vẫn sẵn có.' },
    ],
    vocabulary: [
      { phrase: 'early screening', meaningVi: 'tầm soát sớm', noteVi: 'Cụm danh từ thường dùng cho phát hiện bệnh trước khi có triệu chứng nặng.' },
      { phrase: 'chronic disease', meaningVi: 'bệnh mạn tính', noteVi: 'Đối lập thường gặp với acute illness (bệnh cấp tính).' },
      { phrase: 'credible evidence', meaningVi: 'bằng chứng đáng tin cậy', noteVi: 'Dùng để đặt tiêu chuẩn cho chính sách y tế.' },
    ],
  }),
  task2({
    id: 'sample-t2-society', topicSlug: 'society', topicEn: 'Society', topicVi: 'Xã hội',
    title: 'Public spaces in growing cities',
    promptText: 'As cities grow, public parks and open spaces are being replaced by housing and commercial buildings. Do the advantages outweigh the disadvantages?',
    paragraphs: [
      { en: 'Growing cities need homes, shops and transport links, so pressure to build on vacant land is understandable. Nevertheless, replacing public parks with development usually creates more costs than benefits. Well-planned open spaces support health, social connection and climate resilience, all of which become more important as urban populations rise.', vi: 'Thành phố phát triển cần nhà ở, cửa hàng và kết nối giao thông, vì vậy áp lực xây dựng trên đất trống là điều dễ hiểu. Tuy nhiên, thay công viên công cộng bằng công trình thường gây ra nhiều tổn thất hơn lợi ích. Không gian mở được quy hoạch tốt hỗ trợ sức khoẻ, kết nối xã hội và khả năng chống chịu khí hậu; tất cả càng quan trọng khi dân số đô thị tăng.', focusVi: 'Mở bài thừa nhận nhu cầu xây dựng rồi nêu rõ bất lợi lớn hơn.' },
      { en: 'A public park gives residents a free place to walk, exercise and meet neighbours. This is not a minor amenity: people in small apartments may have no private garden, while children and older adults can be excluded from commercial venues if spending is expected. Trees also provide shade, absorb rainwater and cool streets during heatwaves. Removing these benefits can leave lower-income districts especially exposed to poor health and extreme temperatures.', vi: 'Công viên công cộng cho cư dân nơi miễn phí để đi bộ, tập thể dục và gặp hàng xóm. Đây không phải tiện ích nhỏ: người sống trong căn hộ chật có thể không có vườn riêng, còn trẻ em và người cao tuổi có thể bị hạn chế ở các địa điểm thương mại nếu phải chi tiền. Cây xanh còn tạo bóng mát, thấm nước mưa và làm dịu đường phố trong các đợt nóng. Mất đi lợi ích này có thể khiến các khu thu nhập thấp dễ chịu ảnh hưởng sức khoẻ kém và nhiệt độ cực đoan hơn.', focusVi: 'Thân bài 1 triển khai lợi ích công bằng và môi trường của công viên.' },
      { en: 'The strongest argument for building on open land is that cities face serious housing shortages. New homes can shorten commutes and reduce rents if they are located near jobs and priced within reach. However, this does not require every green site to be sacrificed. Authorities can reuse empty offices, build above transport hubs and require new developments to include usable public courtyards. These approaches add housing while preserving a network of parks rather than isolating residents from nature.', vi: 'Lập luận mạnh nhất cho việc xây trên đất trống là nhiều thành phố đang thiếu nhà ở nghiêm trọng. Nhà mới có thể rút ngắn quãng đường đi làm và hạ tiền thuê nếu gần nơi làm việc và có giá vừa tầm. Tuy nhiên, điều này không đòi hỏi phải hy sinh mọi khu xanh. Chính quyền có thể tái sử dụng văn phòng bỏ trống, xây trên các đầu mối giao thông và yêu cầu dự án mới có sân công cộng dùng được. Những cách này bổ sung nhà ở mà vẫn giữ được mạng lưới công viên, thay vì khiến cư dân bị tách khỏi thiên nhiên.', focusVi: 'Thân bài 2 công nhận nhu cầu nhà ở và phản biện bằng các lựa chọn quy hoạch.' },
      { en: 'Urban development is necessary, but the loss of open space is a poor trade when cities can build more intelligently. Protecting parks provides everyday benefits that cannot be replaced by private gyms or landscaped shopping centres. For this reason, new housing should be planned alongside public green space, not at its expense for present and future residents.', vi: 'Phát triển đô thị là cần thiết, nhưng mất không gian mở là một sự đánh đổi bất lợi khi thành phố có thể xây dựng thông minh hơn. Bảo vệ công viên mang lại lợi ích hằng ngày mà phòng tập tư nhân hay trung tâm mua sắm trang trí cây xanh không thể thay thế. Vì vậy, nhà ở mới nên được quy hoạch song song với không gian xanh công cộng, thay vì đánh đổi nó cho cư dân hiện tại và mai sau.', focusVi: 'Kết luận nhấn mạnh nguyên tắc phát triển song hành.' },
    ],
    vocabulary: [
      { phrase: 'climate resilience', meaningVi: 'khả năng chống chịu khí hậu', noteVi: 'Thuật ngữ hữu ích khi nói về quy hoạch đô thị và thời tiết cực đoan.' },
      { phrase: 'housing shortage', meaningVi: 'tình trạng thiếu nhà ở', noteVi: 'Cụm danh từ thường dùng hơn “not enough houses”.' },
      { phrase: 'within reach', meaningVi: 'trong khả năng chi trả/tiếp cận', noteVi: 'Dùng với prices, costs hoặc services.' },
    ],
  }),
  task2({
    id: 'sample-t2-work', topicSlug: 'work', topicEn: 'Work', topicVi: 'Công việc',
    title: 'Flexible working arrangements',
    promptText: 'Many employees can now work from home for part of the week. Do the advantages of this arrangement outweigh the disadvantages?',
    paragraphs: [
      { en: 'Remote and hybrid work have become realistic options for many office employees. Although working away from colleagues can weaken communication and blur the boundary between work and home, I believe a flexible arrangement offers greater benefits when employers set clear expectations and provide regular opportunities to collaborate in person.', vi: 'Làm việc từ xa và kết hợp đã trở thành lựa chọn thực tế với nhiều nhân viên văn phòng. Dù làm việc xa đồng nghiệp có thể làm giảm giao tiếp và xoá mờ ranh giới giữa công việc với gia đình, tôi cho rằng cách làm linh hoạt có lợi nhiều hơn khi nhà tuyển dụng đặt kỳ vọng rõ ràng và tạo cơ hội cộng tác trực tiếp thường xuyên.', focusVi: 'Mở bài nêu quan điểm và báo trước hai điều kiện để hình thức linh hoạt hiệu quả.' },
      { en: 'The greatest advantage is that employees save time and money otherwise spent commuting. A parent can use the saved hour to take a child to school, while a worker with a long journey can begin the day less tired. Employers may also recruit beyond the city where their office is located, allowing them to find specialised talent and giving people in smaller communities access to better-paid roles. For tasks requiring concentration, a quiet home environment can improve output as well.', vi: 'Lợi ích lớn nhất là nhân viên tiết kiệm thời gian và tiền bạc vốn phải dùng để đi lại. Cha mẹ có thể dành giờ tiết kiệm để đưa con đến trường, còn người phải đi xa có thể bắt đầu ngày làm việc đỡ mệt hơn. Nhà tuyển dụng cũng có thể tuyển người ngoài thành phố đặt văn phòng, nhờ đó tìm được nhân lực chuyên môn và giúp cư dân ở cộng đồng nhỏ tiếp cận công việc lương cao hơn. Với nhiệm vụ cần tập trung, môi trường yên tĩnh ở nhà cũng có thể cải thiện kết quả.', focusVi: 'Thân bài 1 phát triển lợi ích cho người lao động và doanh nghiệp.' },
      { en: 'There are real drawbacks. New employees may struggle to learn informal routines when they rarely observe experienced colleagues, and a video call can make a difficult conversation feel impersonal. Some people also find it hard to stop working when their desk is in the same room where they relax. These problems are manageable if teams agree on shared office days, managers document decisions and staff are assessed by outcomes rather than constant online presence. A modest amount of face-to-face contact can preserve trust without requiring a daily commute.', vi: 'Những bất lợi là có thật. Nhân viên mới có thể khó học các quy trình không chính thức khi hiếm khi quan sát đồng nghiệp giàu kinh nghiệm, còn cuộc gọi video có thể khiến cuộc trao đổi khó trở nên thiếu thân mật. Một số người cũng khó ngừng làm việc khi bàn làm việc nằm trong căn phòng họ nghỉ ngơi. Có thể xử lý các vấn đề này nếu nhóm thống nhất ngày lên văn phòng, quản lý ghi lại quyết định và nhân viên được đánh giá theo kết quả thay vì trạng thái trực tuyến liên tục. Một lượng gặp trực tiếp vừa phải có thể duy trì niềm tin mà không cần đi làm mỗi ngày.', focusVi: 'Thân bài 2 thừa nhận mặt trái và nêu biện pháp giảm thiểu cụ thể.' },
      { en: 'On balance, hybrid work improves access, saves commuting time and can support focused work. Its disadvantages are significant but do not outweigh these gains if organisations protect mentoring and personal boundaries. Flexibility should be treated as a working arrangement with shared rules, rather than an individual benefit left to chance.', vi: 'Nhìn chung, làm việc kết hợp mở rộng cơ hội, tiết kiệm thời gian đi lại và hỗ trợ công việc cần tập trung. Những bất lợi đáng kể nhưng không vượt quá lợi ích nếu tổ chức duy trì cố vấn và ranh giới cá nhân. Tính linh hoạt nên được xem là cách tổ chức công việc có quy tắc chung, thay vì phúc lợi cá nhân phó mặc cho may rủi.', focusVi: 'Kết luận cân nhắc hai phía và tái khẳng định lựa chọn có điều kiện.' },
    ],
    vocabulary: [
      { phrase: 'blur the boundary', meaningVi: 'làm mờ ranh giới', noteVi: 'Cụm thường kết hợp với “between work and home”.' },
      { phrase: 'specialised talent', meaningVi: 'nhân lực chuyên môn', noteVi: 'Cụm dùng trong lập luận về tuyển dụng.' },
      { phrase: 'assessed by outcomes', meaningVi: 'được đánh giá theo kết quả', noteVi: 'Cách diễn đạt tự nhiên khi nói về hiệu suất làm việc.' },
    ],
  }),
  task2({
    id: 'sample-t2-transport', topicSlug: 'transport', topicEn: 'Transport', topicVi: 'Giao thông',
    title: 'Making public transport more attractive',
    promptText: 'Traffic congestion is increasing in many cities. What are the main causes, and what measures could reduce it?',
    paragraphs: [
      { en: 'Traffic jams have become a daily feature of many urban areas, wasting time and worsening air quality. The problem is caused partly by car-dependent development and partly by unreliable alternatives. Governments can reduce congestion most effectively by making public transport dependable while managing the demand for private vehicles.', vi: 'Ùn tắc giao thông đã trở thành cảnh thường ngày ở nhiều đô thị, gây lãng phí thời gian và làm chất lượng không khí xấu đi. Vấn đề một phần do quy hoạch phụ thuộc vào ô tô, một phần do các lựa chọn thay thế thiếu tin cậy. Chính phủ có thể giảm ùn tắc hiệu quả nhất bằng cách làm giao thông công cộng đáng tin cậy và quản lý nhu cầu sử dụng xe cá nhân.', focusVi: 'Mở bài tóm tắt hai nguyên nhân và định hướng giải pháp.' },
      { en: 'In many cities, homes have spread far from employment centres, so driving is often the only practical way to reach work or school. At the same time, buses may be delayed by the very congestion they are meant to relieve, while routes finish early or fail to connect with one another. When a journey by car is predictable but a bus journey is not, even environmentally concerned residents may choose to drive. Cheap parking and roads designed mainly for vehicles reinforce this habit.', vi: 'Ở nhiều thành phố, nhà ở đã lan xa khỏi trung tâm việc làm, khiến lái xe thường là cách thực tế duy nhất để đến nơi làm hay trường học. Trong khi đó, xe buýt có thể bị chính tình trạng ùn tắc mà nó cần giảm gây chậm trễ, còn tuyến đường kết thúc sớm hoặc không kết nối với nhau. Khi hành trình bằng ô tô có thể dự đoán còn xe buýt thì không, ngay cả cư dân quan tâm đến môi trường cũng có thể chọn lái xe. Bãi đỗ giá rẻ và đường sá chủ yếu thiết kế cho xe cộ càng củng cố thói quen này.', focusVi: 'Thân bài 1 giải thích nguyên nhân qua cấu trúc đô thị và chất lượng dịch vụ.' },
      { en: 'A useful response begins with frequent services, integrated fares and safe connections between buses, trains and walking routes. Dedicated bus lanes allow public transport to avoid queues, while real-time information makes missed connections less likely. Cities can also charge for parking in crowded centres and use the revenue to improve less profitable routes. Such measures should be introduced alongside affordable housing near transit, so workers are not forced into long car journeys simply because they cannot live near their jobs.', vi: 'Biện pháp hữu ích bắt đầu từ dịch vụ chạy thường xuyên, giá vé liên thông và kết nối an toàn giữa xe buýt, tàu và lối đi bộ. Làn đường riêng giúp phương tiện công cộng tránh hàng xe, còn thông tin theo thời gian thực làm giảm nguy cơ lỡ chuyến. Thành phố cũng có thể thu phí đỗ xe ở trung tâm đông đúc và dùng nguồn thu để cải thiện tuyến ít lợi nhuận. Các biện pháp này nên đi kèm nhà ở giá phải chăng gần trạm giao thông, để người lao động không buộc phải đi ô tô xa chỉ vì không thể sống gần nơi làm.', focusVi: 'Thân bài 2 đưa ra gói giải pháp liên kết giao thông với quy hoạch nhà ở.' },
      { en: 'Congestion is not solved by asking drivers to be more patient; it reflects choices about where people live and how they travel. Reliable public transport, fair parking policies and compact development can make driving optional for more residents. This combination is more durable than building additional roads that quickly fill with new traffic.', vi: 'Không thể giải quyết ùn tắc bằng cách yêu cầu tài xế kiên nhẫn hơn; vấn đề phản ánh lựa chọn về nơi ở và cách đi lại. Giao thông công cộng đáng tin cậy, chính sách đỗ xe công bằng và phát triển đô thị gọn có thể giúp nhiều cư dân không cần phải lái xe. Sự kết hợp này bền vững hơn việc xây thêm đường rồi nhanh chóng bị lấp đầy bởi lượng xe mới.', focusVi: 'Kết luận khái quát nguyên nhân mang tính hệ thống và chốt nhóm giải pháp.' },
    ],
    vocabulary: [
      { phrase: 'car-dependent development', meaningVi: 'phát triển đô thị phụ thuộc vào ô tô', noteVi: 'Cụm mô tả nguyên nhân ở cấp quy hoạch.' },
      { phrase: 'integrated fares', meaningVi: 'giá vé liên thông', noteVi: 'Dùng khi nhiều loại phương tiện chia sẻ một hệ thống vé.' },
      { phrase: 'compact development', meaningVi: 'phát triển đô thị gọn', noteVi: 'Khái niệm quy hoạch giúp giảm quãng đường di chuyển.' },
    ],
  }),
  task2({
    id: 'sample-t2-media', topicSlug: 'media', topicEn: 'Media', topicVi: 'Truyền thông',
    title: 'Social media and the spread of news',
    promptText: 'More people now receive news through social media than through traditional newspapers or television. Is this a positive or negative development?',
    paragraphs: [
      { en: 'Social platforms have made news immediate and easy to share, changing how people learn about public events. This wider access is valuable, but the speed of circulation also allows misleading claims to travel before they are checked. I view the change as mixed: it is positive only when users and platforms take accuracy seriously.', vi: 'Nền tảng xã hội khiến tin tức được tiếp cận và chia sẻ tức thì, làm thay đổi cách mọi người biết về sự kiện công cộng. Khả năng tiếp cận rộng hơn này có giá trị, nhưng tốc độ lan truyền cũng khiến thông tin sai lệch đến với người đọc trước khi được kiểm chứng. Tôi xem đây là thay đổi hai mặt: nó chỉ tích cực khi người dùng và nền tảng coi trọng độ chính xác.', focusVi: 'Mở bài đặt đánh giá hai mặt và làm rõ điều kiện.' },
      { en: 'A major advantage is that reporting no longer depends entirely on a small number of broadcasters. Residents can post images of a flood or a transport failure while it is happening, giving others practical information and sometimes prompting authorities to respond. Independent journalists can also reach audiences without paying for a large print run. For people who cannot afford subscriptions, a public feed may be the easiest route to local and international news.', vi: 'Lợi thế lớn là việc đưa tin không còn phụ thuộc hoàn toàn vào một số ít đài phát sóng. Cư dân có thể đăng hình ảnh lũ lụt hoặc sự cố giao thông ngay khi chúng xảy ra, cung cấp thông tin thiết thực cho người khác và đôi khi thúc đẩy chính quyền phản hồi. Nhà báo độc lập cũng có thể tiếp cận khán giả mà không cần trả chi phí in ấn lớn. Với người không đủ tiền mua thuê bao, bảng tin công khai có thể là con đường dễ nhất để đọc tin trong nước và quốc tế.', focusVi: 'Thân bài 1 làm rõ lợi ích về tốc độ, tiếng nói địa phương và khả năng tiếp cận.' },
      { en: 'The same design can reward outrage rather than accuracy. A dramatic but false headline may receive thousands of shares before a careful correction reaches the same audience, and recommendation systems can repeatedly show users material that confirms existing beliefs. Traditional newsrooms are not infallible, yet they usually have named editors and a correction process. Platforms should label original sources, slow the spread of disputed posts and explain why content is recommended; schools can teach students to check dates, authors and supporting evidence.', vi: 'Chính thiết kế đó có thể thưởng cho sự phẫn nộ thay vì độ chính xác. Một tiêu đề gây sốc nhưng sai có thể được chia sẻ hàng nghìn lần trước khi lời đính chính cẩn trọng tiếp cận cùng lượng khán giả, còn hệ thống gợi ý có thể liên tục hiển thị nội dung củng cố niềm tin sẵn có. Toà soạn truyền thống không phải lúc nào cũng đúng, nhưng thường có biên tập viên được nêu tên và quy trình đính chính. Nền tảng nên gắn nhãn nguồn gốc, làm chậm bài đăng gây tranh cãi và giải thích vì sao nội dung được gợi ý; trường học có thể dạy học sinh kiểm tra ngày tháng, tác giả và bằng chứng hỗ trợ.', focusVi: 'Thân bài 2 phân tích cơ chế lan tin sai và đưa giải pháp cho nền tảng, trường học.' },
      { en: 'Social media has widened participation in news, but access alone does not guarantee an informed public. Its benefits will outweigh its risks only if platforms become more transparent and readers develop habits of verification. The aim should be to keep reporting open while making accountability as visible as speed.', vi: 'Mạng xã hội mở rộng sự tham gia vào tin tức, nhưng chỉ có quyền tiếp cận không đảm bảo công chúng hiểu biết. Lợi ích chỉ lớn hơn rủi ro nếu nền tảng minh bạch hơn và độc giả hình thành thói quen kiểm chứng. Mục tiêu nên là duy trì việc đưa tin mở đồng thời khiến trách nhiệm giải trình cũng rõ ràng như tốc độ lan truyền.', focusVi: 'Kết luận tóm lược đánh giá có điều kiện và nhấn mạnh trách nhiệm.' },
    ],
    vocabulary: [
      { phrase: 'misleading claims', meaningVi: 'những khẳng định gây hiểu lầm', noteVi: 'Cụm trung tính hơn “fake news” khi chưa xác định chủ ý.' },
      { phrase: 'correction process', meaningVi: 'quy trình đính chính', noteVi: 'Dùng trong lập luận về tiêu chuẩn báo chí.' },
      { phrase: 'habits of verification', meaningVi: 'thói quen kiểm chứng', noteVi: 'Cụm danh từ giúp nâng cấp lập luận về kỹ năng truyền thông.' },
    ],
  }),
  task2({
    id: 'sample-t2-crime', topicSlug: 'crime', topicEn: 'Crime', topicVi: 'Tội phạm',
    title: 'Rehabilitation and repeat offending',
    promptText: 'Some people believe that longer prison sentences are the best way to reduce crime, while others argue that rehabilitation is more effective. Discuss both views and give your opinion.',
    paragraphs: [
      { en: 'When a serious offence is committed, the public reasonably expects a response that protects victims and discourages further harm. Some favour longer prison terms, whereas others emphasise rehabilitation. In my view, imprisonment is necessary for dangerous offenders, but rehabilitation and post-release support are more effective at reducing repeat crime over time.', vi: 'Khi một tội nghiêm trọng xảy ra, công chúng có lý do để mong chờ phản ứng bảo vệ nạn nhân và ngăn tổn hại tiếp diễn. Một số người ủng hộ án tù dài hơn, trong khi những người khác nhấn mạnh cải tạo. Theo tôi, bỏ tù là cần thiết với người phạm tội nguy hiểm, nhưng cải tạo và hỗ trợ sau khi mãn hạn hiệu quả hơn trong việc giảm tái phạm lâu dài.', focusVi: 'Mở bài trình bày hai phía và thể hiện lập trường có phân biệt đối tượng.' },
      { en: 'Long sentences can prevent an incarcerated person from harming the public during the period of confinement, and proportionate punishment signals that serious offences carry consequences. Victims may also feel that the justice system has recognised the gravity of their experience. For crimes involving persistent violence, separating an offender from potential victims is an immediate safety measure. These arguments explain why punishment cannot be removed from a credible criminal justice system.', vi: 'Án dài có thể ngăn người đang bị giam làm hại công chúng trong thời gian chấp hành, còn hình phạt tương xứng cho thấy tội nghiêm trọng sẽ phải chịu hậu quả. Nạn nhân cũng có thể cảm thấy hệ thống tư pháp đã công nhận mức độ nghiêm trọng của trải nghiệm họ. Với tội liên quan đến bạo lực dai dẳng, cách ly người phạm tội khỏi nạn nhân tiềm năng là biện pháp an toàn trước mắt. Những lập luận này giải thích vì sao hình phạt không thể bị loại bỏ khỏi hệ thống tư pháp hình sự đáng tin cậy.', focusVi: 'Thân bài 1 công nhận lý do cho hình phạt và mục tiêu bảo vệ tức thời.' },
      { en: 'However, a prison term alone rarely addresses the conditions that contribute to offending, such as addiction, untreated mental illness or limited education. If a person leaves prison without housing, a job history or support, returning to the same environment can make another offence more likely. Programmes that combine literacy, counselling and vocational training give people practical alternatives and can be evaluated by rates of reoffending. Support for victims should continue alongside this work; rehabilitation does not mean ignoring the harm already done.', vi: 'Tuy nhiên, chỉ chấp hành án tù hiếm khi giải quyết được những điều kiện góp phần dẫn đến phạm tội như nghiện ngập, bệnh tâm thần chưa được điều trị hoặc học vấn hạn chế. Nếu một người rời nhà tù mà không có chỗ ở, kinh nghiệm nghề nghiệp hay hỗ trợ, việc trở lại môi trường cũ có thể khiến họ tái phạm nhiều hơn. Chương trình kết hợp xoá mù chữ, tư vấn và đào tạo nghề cho họ lựa chọn thực tế, đồng thời có thể được đánh giá qua tỷ lệ tái phạm. Hỗ trợ nạn nhân cần tiếp tục song song; cải tạo không có nghĩa là bỏ qua tổn hại đã gây ra.', focusVi: 'Thân bài 2 giải thích cơ chế giảm tái phạm và phân biệt cải tạo với dung thứ.' },
      { en: 'Punishment is justified when it protects the public and reflects the seriousness of a crime, but longer sentences should not be treated as a complete prevention strategy. Education, treatment and practical support after release address the causes that punishment leaves untouched. A system that combines proportionate sentences with proven rehabilitation is more likely to protect communities in the long run.', vi: 'Hình phạt có lý khi bảo vệ công chúng và phản ánh mức độ nghiêm trọng của tội phạm, nhưng không nên xem án dài hơn là chiến lược phòng ngừa đầy đủ. Giáo dục, điều trị và hỗ trợ thiết thực sau khi mãn hạn giải quyết những nguyên nhân mà hình phạt không chạm tới. Hệ thống kết hợp án tương xứng với cải tạo có bằng chứng sẽ có khả năng bảo vệ cộng đồng lâu dài hơn.', focusVi: 'Kết luận cân bằng hình phạt với giải pháp xử lý nguyên nhân.' },
    ],
    vocabulary: [
      { phrase: 'proportionate punishment', meaningVi: 'hình phạt tương xứng', noteVi: 'Cụm thường gặp trong lập luận về hệ thống tư pháp.' },
      { phrase: 'rates of reoffending', meaningVi: 'tỷ lệ tái phạm', noteVi: 'Chỉ số phù hợp để đánh giá chương trình cải tạo.' },
      { phrase: 'post-release support', meaningVi: 'hỗ trợ sau khi mãn hạn', noteVi: 'Cụm nối giai đoạn trong tù với tái hoà nhập.' },
    ],
  }),
  task2({
    id: 'sample-t2-government', topicSlug: 'government', topicEn: 'Government', topicVi: 'Chính phủ',
    title: 'Funding arts or essential services',
    promptText: 'Some people think governments should spend public money on the arts, while others believe health and education should receive priority. Discuss both views and give your opinion.',
    paragraphs: [
      { en: 'Public budgets must cover essential services, but they also shape the kind of society people share. While health and education should receive secure funding, I do not believe this makes public support for the arts wasteful. A modest, carefully allocated arts budget can strengthen communities without displacing core services.', vi: 'Ngân sách công cần chi trả cho dịch vụ thiết yếu, nhưng nó cũng định hình xã hội mà mọi người cùng sống. Dù y tế và giáo dục cần được bảo đảm kinh phí, tôi không cho rằng điều đó khiến hỗ trợ nghệ thuật công trở nên lãng phí. Ngân sách nghệ thuật vừa phải và phân bổ cẩn trọng có thể củng cố cộng đồng mà không lấn át dịch vụ cốt lõi.', focusVi: 'Mở bài nêu ưu tiên dịch vụ cơ bản nhưng vẫn bảo vệ ngân sách nghệ thuật hợp lý.' },
      { en: 'Those who favour health and education point to needs that affect people directly and urgently. A clinic short of nurses cannot provide safe care, and an overcrowded classroom limits the attention each pupil receives. Investment in these areas can improve life expectancy, literacy and economic opportunity, particularly for families unable to purchase private alternatives. If a government must choose during a crisis, preventing avoidable illness and keeping children in school should come first.', vi: 'Những người ưu tiên y tế và giáo dục chỉ ra nhu cầu ảnh hưởng trực tiếp và cấp bách đến người dân. Một phòng khám thiếu điều dưỡng không thể chăm sóc an toàn, còn lớp học quá đông làm giảm sự quan tâm dành cho mỗi học sinh. Đầu tư vào các lĩnh vực này có thể cải thiện tuổi thọ, khả năng đọc viết và cơ hội kinh tế, đặc biệt với gia đình không mua được dịch vụ tư nhân. Nếu chính phủ buộc phải lựa chọn trong khủng hoảng, ngăn bệnh có thể tránh và giữ trẻ em đến trường cần được đặt trước.', focusVi: 'Thân bài 1 trình bày quan điểm ưu tiên và lý do về tính thiết yếu.' },
      { en: 'The arts serve public purposes too. A local theatre, library exhibition or community music programme can preserve regional stories and give residents a reason to meet across generations. Cultural events also attract visitors and support nearby businesses, although these economic effects should not be exaggerated. Public funding is particularly important for work that cannot recover its costs through ticket sales, such as projects in remote areas or programmes for children. Transparent grants can broaden access while limiting the risk of favouring a small elite.', vi: 'Nghệ thuật cũng phục vụ mục đích công cộng. Nhà hát địa phương, triển lãm thư viện hay chương trình âm nhạc cộng đồng có thể bảo tồn câu chuyện vùng miền và tạo lý do để cư dân nhiều thế hệ gặp gỡ. Sự kiện văn hoá còn thu hút du khách và hỗ trợ doanh nghiệp lân cận, dù không nên phóng đại tác động kinh tế này. Kinh phí công đặc biệt quan trọng với hoạt động không thể bù chi phí bằng vé, như dự án ở vùng xa hoặc chương trình cho trẻ em. Khoản tài trợ minh bạch có thể mở rộng cơ hội tiếp cận đồng thời hạn chế nguy cơ chỉ ưu ái một nhóm nhỏ.', focusVi: 'Thân bài 2 chứng minh nghệ thuật có giá trị cộng đồng và đưa điều kiện minh bạch.' },
      { en: 'Governments should first meet minimum standards in health and education, then reserve a smaller but predictable share for cultural life. The choice is not between hospitals and every painting; it is about setting priorities and funding public value fairly. Such a balanced approach recognises both immediate welfare and the identity people build together.', vi: 'Trước hết, chính phủ nên bảo đảm mức dịch vụ tối thiểu về y tế và giáo dục, sau đó dành một phần nhỏ nhưng ổn định cho đời sống văn hoá. Lựa chọn không phải là giữa bệnh viện với mọi bức tranh; vấn đề là đặt thứ tự ưu tiên và tài trợ công bằng cho giá trị công. Cách tiếp cận cân bằng công nhận cả phúc lợi trước mắt lẫn bản sắc mà mọi người cùng xây dựng.', focusVi: 'Kết luận đưa ra thứ tự ưu tiên, không biến hai mục tiêu thành đối lập tuyệt đối.' },
    ],
    vocabulary: [
      { phrase: 'secure funding', meaningVi: 'nguồn kinh phí được bảo đảm', noteVi: 'Dùng để mô tả ngân sách ổn định cho dịch vụ thiết yếu.' },
      { phrase: 'regional stories', meaningVi: 'câu chuyện/bản sắc vùng miền', noteVi: 'Cụm tự nhiên trong chủ đề bảo tồn văn hoá.' },
      { phrase: 'transparent grants', meaningVi: 'khoản tài trợ minh bạch', noteVi: 'Cụm giúp đưa điều kiện quản trị vào đề xuất.' },
    ],
  }),
  task2({
    id: 'sample-t2-culture', topicSlug: 'culture', topicEn: 'Culture', topicVi: 'Văn hoá',
    title: 'Protecting local traditions in a global age',
    promptText: 'Globalisation is causing traditional ways of life to disappear in many places. Why is this happening, and what can be done to protect local culture?',
    paragraphs: [
      { en: 'Global travel, trade and online entertainment expose people to similar products and lifestyles wherever they live. As a result, some local languages, crafts and customs are used less often, especially by younger generations. This change is driven by economic pressure as well as convenience, so preserving culture requires communities to make traditions viable rather than merely displaying them as relics.', vi: 'Du lịch, thương mại và giải trí trực tuyến toàn cầu khiến người dân ở nhiều nơi tiếp xúc với sản phẩm và lối sống tương tự nhau. Vì vậy, một số ngôn ngữ, nghề thủ công và phong tục địa phương ít được sử dụng hơn, nhất là ở thế hệ trẻ. Sự thay đổi này do cả áp lực kinh tế lẫn sự tiện lợi, nên bảo tồn văn hoá đòi hỏi cộng đồng khiến truyền thống còn có giá trị thực tế chứ không chỉ trưng bày như di vật.', focusVi: 'Mở bài diễn đạt vấn đề và nhấn mạnh bảo tồn cần có sức sống thực.' },
      { en: 'Modern media spreads dominant languages and commercial culture at almost no cost, while local practices can require time that families no longer have. A teenager may choose global music because it is easy to find, not because local music lacks value. Craftspeople also struggle when factory-made products are cheaper and traditional skills offer little income. If a language is absent from schools and public services, parents may understandably favour the language that gives their children better employment prospects.', vi: 'Truyền thông hiện đại lan truyền các ngôn ngữ phổ biến và văn hoá thương mại gần như không tốn chi phí, trong khi thực hành địa phương cần thời gian mà nhiều gia đình không còn. Một thiếu niên có thể chọn nhạc toàn cầu vì dễ tìm, chứ không phải vì nhạc địa phương thiếu giá trị. Nghệ nhân cũng gặp khó khăn khi hàng sản xuất công nghiệp rẻ hơn và kỹ năng truyền thống mang lại ít thu nhập. Nếu ngôn ngữ địa phương vắng mặt trong trường học và dịch vụ công, cha mẹ có thể dễ hiểu khi ưu tiên ngôn ngữ mở ra triển vọng việc làm tốt hơn cho con.', focusVi: 'Thân bài 1 chỉ ra nguyên nhân kinh tế, truyền thông và cơ hội nghề nghiệp.' },
      { en: 'Protection is more likely to succeed when traditions are practised and rewarded. Schools can invite elders and local artists to teach language, music or craft, while museums can record knowledge with the consent of the people who hold it. Governments can offer small business support for makers and include local culture in tourism plans without turning communities into performances for visitors. Digital archives and short videos can help young people share traditions in formats they already use.', vi: 'Bảo tồn có khả năng thành công hơn khi truyền thống được thực hành và ghi nhận. Trường học có thể mời người lớn tuổi và nghệ sĩ địa phương dạy ngôn ngữ, âm nhạc hoặc nghề thủ công, còn bảo tàng có thể lưu giữ tri thức với sự đồng thuận của cộng đồng nắm giữ nó. Chính phủ có thể hỗ trợ doanh nghiệp nhỏ cho nghệ nhân và đưa văn hoá địa phương vào kế hoạch du lịch mà không biến cộng đồng thành màn trình diễn cho khách. Kho lưu trữ số và video ngắn có thể giúp người trẻ chia sẻ truyền thống qua định dạng họ vẫn sử dụng.', focusVi: 'Thân bài 2 nêu giải pháp có sự tham gia và quyền quyết định của cộng đồng.' },
      { en: 'Local culture is not preserved by asking young people to reject modern life. It is more durable when education, income and public recognition allow traditions to remain part of that life. Supporting community-led teaching and fair opportunities for cultural work can protect diversity while letting each generation decide how its heritage should evolve.', vi: 'Không thể bảo tồn văn hoá địa phương bằng cách yêu cầu người trẻ từ chối đời sống hiện đại. Văn hoá bền vững hơn khi giáo dục, thu nhập và sự ghi nhận của công chúng giúp truyền thống tiếp tục là một phần cuộc sống ấy. Hỗ trợ hoạt động giảng dạy do cộng đồng dẫn dắt và cơ hội công bằng cho công việc văn hoá có thể bảo vệ sự đa dạng, đồng thời để mỗi thế hệ quyết định di sản của họ sẽ phát triển ra sao.', focusVi: 'Kết luận nhấn mạnh bảo tồn không đồng nghĩa đóng băng văn hoá.' },
    ],
    vocabulary: [
      { phrase: 'economic pressure', meaningVi: 'áp lực kinh tế', noteVi: 'Cụm nguyên nhân dùng được cho nhiều chủ đề xã hội.' },
      { phrase: 'community-led', meaningVi: 'do cộng đồng dẫn dắt', noteVi: 'Tính từ ghép chỉ sáng kiến giữ quyền quyết định ở địa phương.' },
      { phrase: 'cultural heritage', meaningVi: 'di sản văn hoá', noteVi: 'Cụm khái quát cho tập quán, tri thức và ngôn ngữ được truyền lại.' },
    ],
  }),
  task2({
    id: 'sample-t2-tourism', topicSlug: 'tourism', topicEn: 'Tourism', topicVi: 'Du lịch',
    title: 'Managing the growth of international tourism',
    promptText: 'International tourism brings economic benefits but can damage local communities and the environment. Do the advantages outweigh the disadvantages?',
    paragraphs: [
      { en: 'International tourism creates jobs and introduces visitors to unfamiliar cultures, yet its rapid growth can strain housing, transport and natural sites. I believe tourism brings greater benefits when visitor numbers are managed and local residents share in the income. Uncontrolled mass tourism, by contrast, can undermine the very places that attract travellers.', vi: 'Du lịch quốc tế tạo việc làm và giúp du khách tiếp xúc với những nền văn hoá xa lạ, nhưng tăng trưởng nhanh có thể gây áp lực lên nhà ở, giao thông và địa điểm tự nhiên. Tôi cho rằng du lịch đem lại nhiều lợi ích hơn khi lượng khách được quản lý và cư dân địa phương cùng hưởng thu nhập. Ngược lại, du lịch đại trà thiếu kiểm soát có thể làm suy yếu chính những nơi thu hút du khách.', focusVi: 'Mở bài nêu đánh giá có điều kiện và xác định vấn đề của du lịch đại trà.' },
      { en: 'Visitors spend money in hotels, restaurants and small businesses, supporting work that may not exist in a remote or seasonal economy. Tourism can also give craftspeople a market for local products and encourage authorities to maintain historic buildings. Contact between visitors and residents may challenge stereotypes when it is respectful and not reduced to a brief transaction. These gains are strongest when local businesses own a meaningful share of the tourism supply chain rather than sending most profits to outside companies.', vi: 'Du khách chi tiền ở khách sạn, nhà hàng và doanh nghiệp nhỏ, hỗ trợ việc làm vốn có thể không tồn tại ở nền kinh tế vùng xa hay theo mùa. Du lịch cũng có thể tạo thị trường cho sản phẩm địa phương và khuyến khích chính quyền bảo trì công trình lịch sử. Sự tiếp xúc giữa du khách và cư dân có thể thách thức định kiến nếu diễn ra tôn trọng, không bị rút gọn thành giao dịch thoáng qua. Lợi ích này lớn nhất khi doanh nghiệp địa phương sở hữu phần đáng kể trong chuỗi cung ứng du lịch, thay vì để phần lớn lợi nhuận chảy về công ty bên ngoài.', focusVi: 'Thân bài 1 khai triển lợi ích kinh tế và văn hoá, kèm điều kiện phân phối.' },
      { en: 'The costs become visible when visitors outnumber the services and ecosystems of a destination. Short-term rentals can raise housing costs for residents, coaches can block narrow streets, and fragile beaches may be damaged by litter or unmanaged foot traffic. Seasonal work is also often insecure, so an impressive visitor total does not necessarily mean families receive stable income. Local authorities can set capacity limits, charge conservation fees and direct revenue towards public transport and waste collection, while communities should have a voice in those decisions.', vi: 'Chi phí trở nên rõ rệt khi lượng khách vượt quá khả năng phục vụ và sức chịu đựng của hệ sinh thái tại điểm đến. Nhà cho thuê ngắn hạn có thể đẩy chi phí nhà ở của cư dân lên cao, xe du lịch có thể chặn đường hẹp, còn bãi biển mong manh bị tổn hại bởi rác hoặc lượng người đi lại không được kiểm soát. Việc làm theo mùa cũng thường bấp bênh, nên con số khách ấn tượng không nhất thiết đồng nghĩa gia đình có thu nhập ổn định. Chính quyền địa phương có thể giới hạn sức chứa, thu phí bảo tồn và dùng tiền cho giao thông công cộng, thu gom rác, đồng thời trao tiếng nói cho cộng đồng trong các quyết định này.', focusVi: 'Thân bài 2 nêu chi phí cụ thể và giải pháp quản lý điểm đến.' },
      { en: 'Tourism should be developed as a long-term partnership with residents, not as a race to maximise arrivals. With fair local ownership, environmental limits and reinvestment in shared services, the economic and cultural benefits can outweigh the harms. Where these safeguards are absent, growth in visitor numbers alone is a poor measure of success.', vi: 'Du lịch nên được phát triển như quan hệ hợp tác lâu dài với cư dân, không phải cuộc đua tối đa hoá lượng khách. Với quyền sở hữu địa phương công bằng, giới hạn môi trường và tái đầu tư vào dịch vụ chung, lợi ích kinh tế và văn hoá có thể lớn hơn tổn hại. Khi thiếu các bảo đảm này, chỉ tăng số khách là thước đo thành công kém.', focusVi: 'Kết luận nêu rõ điều kiện để lợi ích du lịch vượt quá tác hại.' },
    ],
    vocabulary: [
      { phrase: 'tourism supply chain', meaningVi: 'chuỗi cung ứng du lịch', noteVi: 'Bao gồm doanh nghiệp lưu trú, vận tải, ăn uống và trải nghiệm.' },
      { phrase: 'capacity limits', meaningVi: 'giới hạn sức chứa', noteVi: 'Chính sách giảm quá tải ở điểm đến.' },
      { phrase: 'reinvest in shared services', meaningVi: 'tái đầu tư vào dịch vụ chung', noteVi: 'Cụm động từ nêu cách cộng đồng nhận lại lợi ích.' },
    ],
  }),
  task2({
    id: 'sample-t2-science', topicSlug: 'science', topicEn: 'Science', topicVi: 'Khoa học',
    title: 'Funding basic research',
    promptText: 'Some people think scientific research should focus on practical problems, while others believe basic research without an immediate use is equally important. Discuss both views and give your opinion.',
    paragraphs: [
      { en: 'Public funding for science is limited, which raises the question of whether researchers should pursue immediate solutions or investigate fundamental questions. Practical research can address urgent needs, but I believe basic science also deserves sustained support because discoveries often become useful in ways that cannot be predicted at the outset.', vi: 'Kinh phí công dành cho khoa học có giới hạn, đặt ra câu hỏi liệu nhà nghiên cứu nên theo đuổi giải pháp trước mắt hay tìm hiểu các vấn đề nền tảng. Nghiên cứu ứng dụng có thể đáp ứng nhu cầu cấp thiết, nhưng tôi cho rằng khoa học cơ bản cũng xứng đáng được hỗ trợ lâu dài vì phát hiện thường trở nên hữu ích theo cách không thể dự đoán từ đầu.', focusVi: 'Mở bài xác định sự đánh đổi về ngân sách và nêu quan điểm.' },
      { en: 'Supporters of targeted research argue that governments should respond to clearly defined problems such as crop disease, clean water or battery storage. A project with measurable goals can show taxpayers what public money has achieved, and its findings may be adopted by hospitals or industry within a short period. When a crisis is unfolding, directing skilled teams towards a practical solution is plainly justified. Research that never reaches the people who need it also requires stronger accountability.', vi: 'Những người ủng hộ nghiên cứu có mục tiêu cho rằng chính phủ nên giải quyết các vấn đề xác định rõ như bệnh cây trồng, nước sạch hay lưu trữ pin. Dự án có mục tiêu đo được có thể cho người đóng thuế thấy tiền công mang lại gì, và kết quả có thể được bệnh viện hoặc ngành công nghiệp áp dụng trong thời gian ngắn. Khi khủng hoảng đang diễn ra, hướng đội ngũ chuyên môn vào giải pháp thực tế rõ ràng là chính đáng. Nghiên cứu không bao giờ đến được với người cần cũng cần trách nhiệm giải trình cao hơn.', focusVi: 'Thân bài 1 trình bày lý do ưu tiên ứng dụng, gồm tính cấp thiết và trách nhiệm.' },
      { en: 'Basic research, however, creates the knowledge on which many practical advances depend. Early work on electricity, microbes or the structure of matter did not necessarily promise a convenient product, yet it later changed medicine, communication and manufacturing. If every grant requires a rapid commercial result, researchers may avoid difficult questions whose value takes decades to emerge. A balanced portfolio can fund near-term priorities while protecting independent enquiry and allowing promising findings to move into applied trials.', vi: 'Tuy nhiên, nghiên cứu cơ bản tạo ra tri thức làm nền cho nhiều tiến bộ ứng dụng. Những công trình ban đầu về điện, vi sinh vật hay cấu trúc vật chất không nhất thiết hứa hẹn sản phẩm tiện lợi, nhưng về sau đã thay đổi y học, truyền thông và sản xuất. Nếu khoản tài trợ nào cũng đòi kết quả thương mại nhanh, nhà nghiên cứu có thể né tránh câu hỏi khó mà giá trị cần hàng thập kỷ mới xuất hiện. Danh mục đầu tư cân bằng có thể tài trợ ưu tiên trước mắt, đồng thời bảo vệ nghiên cứu độc lập và cho phép phát hiện triển vọng chuyển sang thử nghiệm ứng dụng.', focusVi: 'Thân bài 2 giải thích giá trị dài hạn khó dự báo và đề xuất danh mục cân bằng.' },
      { en: 'Science needs both a route from discovery to use and room for questions that have no immediate market. Governments should set aside funding for urgent challenges without making every discipline justify itself through short-term commercial gains. This approach respects public accountability while preserving the curiosity that has repeatedly produced unexpected benefits.', vi: 'Khoa học cần cả con đường đưa phát hiện vào ứng dụng lẫn không gian cho những câu hỏi chưa có thị trường trước mắt. Chính phủ nên dành kinh phí cho thách thức cấp thiết mà không buộc mọi ngành phải biện minh bằng lợi ích thương mại ngắn hạn. Cách tiếp cận này tôn trọng trách nhiệm giải trình trước công chúng, đồng thời giữ lại tinh thần tò mò đã nhiều lần tạo ra lợi ích không ngờ.', focusVi: 'Kết luận kết hợp trách nhiệm với tính độc lập của nghiên cứu cơ bản.' },
    ],
    vocabulary: [
      { phrase: 'fundamental questions', meaningVi: 'câu hỏi nền tảng', noteVi: 'Cụm học thuật nói về nghiên cứu tìm hiểu nguyên lý gốc.' },
      { phrase: 'a balanced portfolio', meaningVi: 'danh mục đầu tư cân bằng', noteVi: 'Ẩn dụ chính sách để nói về nhiều hướng tài trợ.' },
      { phrase: 'short-term commercial gains', meaningVi: 'lợi ích thương mại ngắn hạn', noteVi: 'Cụm đối lập với giá trị nghiên cứu dài hạn.' },
    ],
  }),
  task2({
    id: 'sample-t2-family', topicSlug: 'family', topicEn: 'Family', topicVi: 'Gia đình',
    title: 'Sharing care for older relatives',
    promptText: 'In many countries, families are finding it difficult to care for older relatives at home. What are the reasons, and what solutions could help?',
    paragraphs: [
      { en: 'As populations age, more families are balancing paid work with the needs of older relatives. This difficulty reflects longer life expectancy, smaller households and a shortage of affordable care, rather than a simple decline in family commitment. Governments, employers and families need to share responsibility so that older people receive safe care without leaving relatives exhausted.', vi: 'Khi dân số già đi, ngày càng nhiều gia đình phải cân bằng công việc có lương với nhu cầu của người thân lớn tuổi. Khó khăn này phản ánh tuổi thọ cao hơn, hộ gia đình nhỏ hơn và thiếu dịch vụ chăm sóc vừa túi tiền, chứ không đơn giản là tình cảm gia đình suy giảm. Chính phủ, nhà tuyển dụng và gia đình cần chia sẻ trách nhiệm để người cao tuổi được chăm sóc an toàn mà người thân không kiệt sức.', focusVi: 'Mở bài giải thích vấn đề bằng thay đổi dân số và xã hội, không quy lỗi đạo đức.' },
      { en: 'Many adults now live far from parents because education and employment draw people to different cities. Even those nearby may work fixed shifts, have young children or lack training to support someone with mobility problems or dementia. At the same time, professional care can be expensive and local services may have long waiting lists. These pressures turn a decision made out of affection into a practical challenge that one household cannot always manage.', vi: 'Nhiều người trưởng thành hiện sống xa cha mẹ vì giáo dục và việc làm đưa mọi người đến các thành phố khác nhau. Ngay cả người sống gần cũng có thể làm theo ca cố định, nuôi con nhỏ hoặc không được đào tạo để hỗ trợ người gặp vấn đề vận động hay sa sút trí tuệ. Trong khi đó, dịch vụ chăm sóc chuyên nghiệp có thể đắt đỏ và dịch vụ địa phương có danh sách chờ dài. Những áp lực này biến quyết định xuất phát từ tình thương thành thách thức thực tế mà một hộ gia đình không phải lúc nào cũng cáng đáng được.', focusVi: 'Thân bài 1 trình bày nguyên nhân về khoảng cách, thời gian, kỹ năng và chi phí.' },
      { en: 'Local governments can expand day centres, respite care and home visits, giving older people companionship and family carers planned time to rest. Employers can offer predictable shifts or temporary leave when a close relative needs support. Families can also discuss care preferences early and divide tasks according to each person’s ability, instead of waiting for a crisis. These options preserve choice: some older adults want family involvement but still prefer professional help for medical or personal needs.', vi: 'Chính quyền địa phương có thể mở rộng trung tâm sinh hoạt ban ngày, dịch vụ chăm sóc thay thế và thăm khám tại nhà, giúp người cao tuổi có bạn bè còn người chăm sóc trong gia đình có thời gian nghỉ được sắp xếp trước. Nhà tuyển dụng có thể cung cấp ca làm dễ dự đoán hoặc nghỉ tạm thời khi người thân cần hỗ trợ. Gia đình cũng có thể trao đổi sớm về nguyện vọng chăm sóc và chia việc theo khả năng mỗi người, thay vì đợi đến khủng hoảng. Những lựa chọn này giữ quyền tự quyết: một số người cao tuổi muốn gia đình tham gia nhưng vẫn thích chuyên viên hỗ trợ nhu cầu y tế hay cá nhân.', focusVi: 'Thân bài 2 đưa giải pháp nhiều cấp và bảo vệ quyền lựa chọn của người cao tuổi.' },
      { en: 'Family care remains important, but it cannot replace a properly funded care system. Practical services and flexible employment allow relatives to contribute without sacrificing their health or income. Treating care as a shared responsibility is the most realistic way to support older people and the families around them.', vi: 'Chăm sóc trong gia đình vẫn quan trọng, nhưng không thể thay thế hệ thống chăm sóc được cấp kinh phí đầy đủ. Dịch vụ thiết thực và việc làm linh hoạt giúp người thân đóng góp mà không phải hy sinh sức khoẻ hay thu nhập. Xem chăm sóc là trách nhiệm chung là cách thực tế nhất để hỗ trợ người cao tuổi và gia đình quanh họ.', focusVi: 'Kết luận khẳng định gia đình quan trọng nhưng cần hệ thống công hỗ trợ.' },
    ],
    vocabulary: [
      { phrase: 'respite care', meaningVi: 'dịch vụ chăm sóc thay thế tạm thời', noteVi: 'Dịch vụ giúp người chăm sóc chính có thời gian nghỉ.' },
      { phrase: 'fixed shifts', meaningVi: 'ca làm cố định', noteVi: 'Cụm chỉ lịch làm việc ít linh hoạt.' },
      { phrase: 'shared responsibility', meaningVi: 'trách nhiệm được chia sẻ', noteVi: 'Cụm phù hợp để đề xuất giải pháp xã hội.' },
    ],
  }),
  task2({
    id: 'sample-t2-economy', topicSlug: 'economy', topicEn: 'Economy', topicVi: 'Kinh tế',
    title: 'Measuring progress beyond income',
    promptText: 'Some people believe economic growth is the best measure of a country’s success, while others think quality of life should be prioritised. Discuss both views and give your opinion.',
    paragraphs: [
      { en: 'Economic growth is often used to judge whether a country is progressing, but higher national income does not guarantee that residents are healthier or more secure. Growth matters because it can fund services and create work; nevertheless, I believe governments should measure success through both economic output and the quality of life people experience.', vi: 'Tăng trưởng kinh tế thường được dùng để đánh giá một quốc gia có tiến bộ hay không, nhưng thu nhập quốc gia cao hơn không đảm bảo cư dân khoẻ mạnh hay an toàn hơn. Tăng trưởng quan trọng vì có thể tài trợ dịch vụ và tạo việc làm; tuy nhiên, tôi cho rằng chính phủ nên đo lường thành công bằng cả sản lượng kinh tế lẫn chất lượng sống mà người dân trải nghiệm.', focusVi: 'Mở bài thừa nhận vai trò tăng trưởng rồi nêu quan điểm dùng nhiều thước đo.' },
      { en: 'Supporters of growth point out that a larger economy can raise tax revenue without increasing tax rates. Governments may then invest in hospitals, schools and transport, while expanding businesses can offer more stable employment. In countries where basic needs remain unmet, rising productivity can improve housing, nutrition and access to education. Economic indicators are also comparatively easy to collect, which allows policymakers to identify recessions and compare performance over time.', vi: 'Những người ủng hộ tăng trưởng cho rằng nền kinh tế lớn hơn có thể tăng nguồn thu thuế mà không cần tăng thuế suất. Khi đó, chính phủ có thể đầu tư vào bệnh viện, trường học và giao thông, còn doanh nghiệp mở rộng có thể tạo việc làm ổn định hơn. Ở quốc gia mà nhu cầu cơ bản chưa được đáp ứng, năng suất tăng có thể cải thiện nhà ở, dinh dưỡng và khả năng tiếp cận giáo dục. Các chỉ số kinh tế cũng tương đối dễ thu thập, giúp nhà hoạch định nhận diện suy thoái và so sánh hiệu quả theo thời gian.', focusVi: 'Thân bài 1 giải thích vì sao tăng trưởng là thước đo hữu ích.' },
      { en: 'However, national averages can conceal who receives the gains. Output may rise while rents, working hours or air pollution increase for ordinary households. Measures such as healthy life expectancy, educational access, job security and housing affordability show whether growth has improved daily life and how widely the benefits are shared. These indicators should not replace economic data; used together, they reveal trade-offs that a single headline figure would hide.', vi: 'Tuy nhiên, mức trung bình quốc gia có thể che khuất ai thực sự nhận được lợi ích. Sản lượng có thể tăng trong khi tiền thuê nhà, giờ làm hoặc ô nhiễm không khí cũng tăng với các hộ gia đình bình thường. Những thước đo như tuổi thọ khoẻ mạnh, cơ hội học tập, an toàn việc làm và khả năng chi trả nhà ở cho biết tăng trưởng có cải thiện đời sống hằng ngày hay không và lợi ích được chia sẻ rộng đến đâu. Các chỉ số này không nên thay thế dữ liệu kinh tế; khi dùng cùng nhau, chúng cho thấy sự đánh đổi mà một con số tiêu đề duy nhất sẽ che đi.', focusVi: 'Thân bài 2 chỉ ra hạn chế của mức trung bình và đề xuất bộ chỉ số bổ sung.' },
      { en: 'A successful country needs a productive economy, but economic expansion is a means rather than an end. Governments should track income alongside health, security and opportunity, then use the combined evidence to guide policy rather than relying on a single headline number. This broader measure recognises growth while keeping public attention on the lives it is supposed to improve.', vi: 'Một quốc gia thành công cần nền kinh tế năng suất, nhưng mở rộng kinh tế là phương tiện chứ không phải đích đến. Chính phủ nên theo dõi thu nhập cùng sức khoẻ, an toàn và cơ hội, rồi dùng tổng hợp bằng chứng để định hướng chính sách thay vì chỉ dựa vào một con số tiêu đề duy nhất. Thước đo rộng hơn này công nhận tăng trưởng nhưng giữ sự chú ý của công chúng vào cuộc sống mà tăng trưởng cần cải thiện.', focusVi: 'Kết luận tái khẳng định tăng trưởng là phương tiện và ủng hộ đánh giá đa chiều.' },
    ],
    vocabulary: [
      { phrase: 'tax revenue', meaningVi: 'nguồn thu thuế', noteVi: 'Cụm thường dùng để giải thích vai trò kinh tế của tăng trưởng.' },
      { phrase: 'national averages', meaningVi: 'các mức trung bình toàn quốc', noteVi: 'Nhắc đến khi bàn về bất bình đẳng bị che lấp bởi số liệu tổng hợp.' },
      { phrase: 'a means rather than an end', meaningVi: 'phương tiện chứ không phải mục đích cuối cùng', noteVi: 'Cấu trúc nhượng bộ giàu tính khái quát cho kết luận.' },
    ],
  }),

  task1({
    id: 'sample-t1-line-petrol', topicSlug: 'environment', topicEn: 'Environment', topicVi: 'Môi trường',
    title: 'Petrol prices in three countries', promptId: 'w-t1-line-petrol-price', chartKind: 'line',
    promptText: 'The line graph shows average petrol prices in three countries from 2000 to 2020.',
    paragraphs: [
      { en: 'The line graph compares the average price of petrol, measured in US cents per litre, in three countries between 2000 and 2020.', vi: 'Biểu đồ đường so sánh giá xăng trung bình, tính bằng xu Mỹ mỗi lít, tại ba quốc gia trong giai đoạn 2000–2020.', focusVi: 'Mở bài diễn đạt lại biểu đồ và nêu đơn vị, mốc thời gian.' },
      { en: 'Overall, prices in Country A rose sharply while those in Country B fell by a similar degree. Country C remained almost unchanged, and the three figures converged at around 2010 before the two leading countries reversed position.', vi: 'Nhìn chung, giá ở Quốc gia A tăng mạnh trong khi giá tại Quốc gia B giảm ở mức tương tự. Quốc gia C gần như không thay đổi, và cả ba số liệu hội tụ vào khoảng năm 2010 trước khi hai quốc gia dẫn đầu đổi vị trí.', focusVi: 'Overview nêu xu hướng nổi bật, sự ổn định và điểm giao nhau.' },
      { en: 'In 2000, Country B had the highest figure at 175 cents, compared with 113 cents in Country C and only 44 cents in Country A. The price in Country A then climbed steadily, reaching 110 cents in 2010 and overtaking Country C around that year. It continued upwards to 151 cents in 2015 before finishing at 191 cents, the highest value shown.', vi: 'Năm 2000, Quốc gia B có mức cao nhất là 175 xu, so với 113 xu ở Quốc gia C và chỉ 44 xu ở Quốc gia A. Sau đó, giá tại Quốc gia A tăng đều, đạt 110 xu vào năm 2010 và vượt Quốc gia C vào khoảng năm đó. Giá tiếp tục tăng lên 151 xu năm 2015 trước khi kết thúc ở mức 191 xu, cao nhất biểu đồ.', focusVi: 'Thân bài 1 mô tả nhóm tăng và so sánh với mốc cao nhất.' },
      { en: 'By contrast, the figure for Country B declined from 175 cents to 118 cents over the first decade, then fell further to 80 cents in 2015 and 42 cents in 2020. Country C showed much less movement, fluctuating within the narrow range of 111 to 115 cents. It was the most expensive option at the end of the period after having ranked second initially.', vi: 'Ngược lại, số liệu của Quốc gia B giảm từ 175 xu xuống 118 xu trong thập kỷ đầu, rồi tiếp tục xuống 80 xu năm 2015 và 42 xu năm 2020. Quốc gia C biến động ít hơn nhiều, dao động trong phạm vi hẹp từ 111 đến 115 xu. Cuối kỳ, đây là lựa chọn đắt nhất sau khi ban đầu xếp thứ hai.', focusVi: 'Thân bài 2 nhóm hai xu hướng còn lại và nêu vị trí cuối kỳ.' },
    ],
    vocabulary: [
      { phrase: 'converged at around', meaningVi: 'hội tụ vào khoảng', noteVi: 'Dùng khi các đường biểu diễn tiến gần hoặc giao nhau.' },
      { phrase: 'climbed steadily', meaningVi: 'tăng đều đặn', noteVi: 'Cụm mô tả xu hướng tăng ổn định qua thời gian.' },
      { phrase: 'within a narrow range', meaningVi: 'trong một phạm vi hẹp', noteVi: 'Cách diễn đạt chính xác cho dao động nhỏ.' },
    ],
  }),
  task1({
    id: 'sample-t1-bar-weekly-hours', topicSlug: 'society', topicEn: 'Society', topicVi: 'Xã hội',
    title: 'Weekly activities by age group', promptId: 'w-t1-bar-weekly-hours', chartKind: 'bar',
    promptText: 'The bar chart compares weekly hours spent on four activities by people aged 20–35 and 55–70.',
    paragraphs: [
      { en: 'The bar chart compares the average weekly time that people in two age groups spend working, doing housework, enjoying leisure and sleeping.', vi: 'Biểu đồ cột so sánh thời gian trung bình mỗi tuần mà hai nhóm tuổi dành cho công việc, việc nhà, hoạt động giải trí và ngủ.', focusVi: 'Mở bài giới thiệu hai nhóm và bốn hoạt động, không chép nguyên đề.' },
      { en: 'Overall, the younger group devoted far more time to sleep and leisure, whereas the older group spent more hours working and on housework. The largest contrast was in working time, and the two groups were closest in the amount of housework.', vi: 'Nhìn chung, nhóm trẻ dành nhiều thời gian hơn hẳn cho giấc ngủ và giải trí, trong khi nhóm lớn tuổi dành nhiều giờ hơn cho công việc và việc nhà. Khác biệt lớn nhất nằm ở thời gian làm việc, còn hai nhóm gần nhau nhất ở lượng việc nhà.', focusVi: 'Overview chọn hai đối lập chính và mức chênh lớn/nhỏ.' },
      { en: 'People aged 20–35 spent 54 hours a week sleeping, more than six times the eight hours recorded for those aged 55–70. Leisure showed a similar pattern: the younger adults had 39 hours, compared with 21 hours among the older group. These were the two activities on which the younger category recorded its highest figures.', vi: 'Người từ 20–35 tuổi ngủ 54 giờ mỗi tuần, cao hơn sáu lần so với 8 giờ của nhóm 55–70 tuổi. Hoạt động giải trí cũng có quy luật tương tự: người trẻ có 39 giờ, so với 21 giờ ở nhóm lớn tuổi. Đây là hai hoạt động mà nhóm trẻ ghi nhận số giờ cao nhất.', focusVi: 'Thân bài 1 nhóm các hoạt động có số giờ cao hơn ở nhóm trẻ.' },
      { en: 'The older group, by contrast, worked for 57 hours per week, against just eight for younger adults. They also spent 37 hours on housework, 16 hours more than the younger group’s 21. Thus, the older category recorded the highest value for work, while the younger category spent more than four times as long sleeping.', vi: 'Ngược lại, nhóm lớn tuổi làm việc 57 giờ mỗi tuần, so với chỉ 8 giờ của người trẻ. Họ cũng dành 37 giờ cho việc nhà, nhiều hơn 16 giờ so với mức 21 giờ của nhóm trẻ. Do đó, nhóm lớn tuổi đạt mức cao nhất ở công việc, còn nhóm trẻ ngủ lâu hơn bốn lần.', focusVi: 'Thân bài 2 hoàn tất so sánh hai hạng mục còn lại và nhấn thứ hạng.' },
    ],
    vocabulary: [
      { phrase: 'devoted time to', meaningVi: 'dành thời gian cho', noteVi: 'Cấu trúc tự nhiên khi mô tả phân bổ thời gian.' },
      { phrase: 'recorded the highest figure', meaningVi: 'ghi nhận số liệu cao nhất', noteVi: 'Dùng để so sánh nhóm hoặc hạng mục.' },
      { phrase: 'by contrast', meaningVi: 'ngược lại', noteVi: 'Từ nối mở đầu câu đối chiếu.' },
    ],
  }),
  task1({
    id: 'sample-t1-pie-electricity', topicSlug: 'environment', topicEn: 'Environment', topicVi: 'Môi trường',
    title: 'Sources of electricity generation', promptId: 'w-t1-pie-electricity-sources', chartKind: 'pie',
    promptText: 'The pie charts show how electricity was generated in one country in 1995 and 2020.',
    paragraphs: [
      { en: 'The two pie charts compare the proportions of electricity generated from coal, gas, nuclear power and renewable sources in one country in 1995 and 2020.', vi: 'Hai biểu đồ tròn so sánh tỷ trọng điện được sản xuất từ than, khí đốt, năng lượng hạt nhân và nguồn tái tạo tại một quốc gia vào năm 1995 và 2020.', focusVi: 'Mở bài nêu đối tượng, bốn nhóm và hai mốc so sánh.' },
      { en: 'Overall, the energy mix shifted away from coal and towards renewables. Coal was the largest source in 1995, whereas renewables took the leading position by 2020; the combined share of nuclear and renewable power also increased.', vi: 'Nhìn chung, cơ cấu năng lượng chuyển khỏi than và hướng tới nguồn tái tạo. Than là nguồn lớn nhất năm 1995, trong khi năng lượng tái tạo dẫn đầu vào năm 2020; tổng tỷ trọng của điện hạt nhân và tái tạo cũng tăng.', focusVi: 'Overview nêu chuyển dịch chính, hạng mục dẫn đầu và nhóm tăng.' },
      { en: 'Coal accounted for 41% of generation in 1995, making it the dominant fuel, while gas represented 28%. Nuclear power supplied a further 21%, and renewables made up the remaining 10%. By 2020, the figure for coal had fallen to 10%, the smallest proportion, and gas had also declined, although more moderately, to 21%.', vi: 'Than chiếm 41% sản lượng năm 1995, trở thành nhiên liệu chủ đạo, trong khi khí đốt chiếm 28%. Điện hạt nhân cung cấp thêm 21%, còn nguồn tái tạo chiếm 10% còn lại. Đến năm 2020, tỷ trọng than giảm xuống 10%, thấp nhất, và khí đốt cũng giảm nhẹ hơn xuống 21%.', focusVi: 'Thân bài 1 mô tả hai nguồn hoá thạch và dùng số liệu để đối chiếu.' },
      { en: 'The opposite pattern applied to the other sources. Nuclear power rose from 21% to 28%, a moderate increase, while renewables grew by 31 percentage points to reach 41%. As a result, the renewable share alone matched the proportion previously supplied by coal, and together with nuclear power it accounted for more than two thirds of electricity generation in 2020.', vi: 'Hai nguồn còn lại đi theo quy luật ngược lại. Điện hạt nhân tăng từ 21% lên 28%, một mức tăng vừa phải, còn năng lượng tái tạo tăng 31 điểm phần trăm để đạt 41%. Kết quả là tỷ trọng tái tạo riêng lẻ bằng tỷ trọng than trước đây, và khi cộng với điện hạt nhân, hai nguồn này chiếm hơn hai phần ba sản lượng điện năm 2020.', focusVi: 'Thân bài 2 nêu các nguồn tăng và tổng hợp thành điểm so sánh có ý nghĩa.' },
    ],
    vocabulary: [
      { phrase: 'energy mix', meaningVi: 'cơ cấu các nguồn năng lượng', noteVi: 'Cụm danh từ gọn để nói về thành phần nguồn điện.' },
      { phrase: 'accounted for', meaningVi: 'chiếm', noteVi: 'Động từ học thuật thường dùng cho tỷ lệ.' },
      { phrase: 'percentage points', meaningVi: 'điểm phần trăm', noteVi: 'Phân biệt mức chênh tỷ lệ với phần trăm tăng tương đối.' },
    ],
  }),
  task1({
    id: 'sample-t1-table-literacy', topicSlug: 'education', topicEn: 'Education', topicVi: 'Giáo dục',
    title: 'Adult literacy rates across regions', promptId: 'w-t1-table-literacy-rate', chartKind: 'table',
    promptText: 'The table compares adult literacy rates in four world regions between 1990 and 2020.',
    paragraphs: [
      { en: 'The table presents adult literacy rates in East Asia, South Asia, Sub-Saharan Africa and Europe at four points between 1990 and 2020.', vi: 'Bảng trình bày tỷ lệ biết chữ của người trưởng thành tại Đông Á, Nam Á, châu Phi hạ Sahara và châu Âu ở bốn mốc từ năm 1990 đến 2020.', focusVi: 'Mở bài paraphrase bảng và gọi tên đủ nhóm, giai đoạn.' },
      { en: 'Overall, literacy rose substantially in East Asia and more gradually in Sub-Saharan Africa, while it declined in South Asia and Europe. East Asia moved from the lowest rate to the highest, whereas South Asia changed from the leading region to the lowest by 2020.', vi: 'Nhìn chung, tỷ lệ biết chữ tăng đáng kể ở Đông Á và tăng từ từ hơn tại châu Phi hạ Sahara, trong khi giảm ở Nam Á và châu Âu. Đông Á chuyển từ mức thấp nhất lên cao nhất, còn Nam Á từ khu vực dẫn đầu xuống thấp nhất vào năm 2020.', focusVi: 'Overview nhóm xu hướng và nêu sự đổi ngôi nổi bật.' },
      { en: 'East Asia recorded 37% in 1990, the lowest figure in the table, but its rate climbed at every interval to reach 92% in 2020. Sub-Saharan Africa also improved, from 55% to 75%, with the largest gains occurring after 2000. These two regions therefore made progress, although the final literacy rate in East Asia remained well above that in Africa.', vi: 'Đông Á ghi nhận 37% năm 1990, mức thấp nhất bảng, nhưng tỷ lệ tăng ở mọi giai đoạn để đạt 92% vào năm 2020. Châu Phi hạ Sahara cũng cải thiện, từ 55% lên 75%, với mức tăng lớn nhất sau năm 2000. Vì vậy, hai khu vực này đều tiến bộ, dù tỷ lệ biết chữ cuối kỳ ở Đông Á vẫn cao hơn đáng kể so với châu Phi.', focusVi: 'Thân bài 1 nhóm hai vùng tăng, chọn số liệu đầu-cuối và so sánh.' },
      { en: 'South Asia followed the reverse pattern, falling from 90% in 1990 to 36% in 2020, despite being the highest region initially. Europe experienced a smaller but steady decline, from 71% to 52%. By the final year, South Asia had the lowest rate, while Europe stood between the two improving regions. The gap between the highest and lowest figures was 56 percentage points in 2020.', vi: 'Nam Á đi theo quy luật ngược lại, giảm từ 90% năm 1990 xuống 36% năm 2020, dù ban đầu là khu vực cao nhất. Châu Âu giảm ít hơn nhưng đều đặn, từ 71% xuống 52%. Đến năm cuối, Nam Á có tỷ lệ thấp nhất, trong khi châu Âu đứng giữa hai khu vực cải thiện. Khoảng cách giữa mức cao nhất và thấp nhất là 56 điểm phần trăm vào năm 2020.', focusVi: 'Thân bài 2 mô tả nhóm giảm và tổng hợp thứ hạng cuối kỳ.' },
    ],
    vocabulary: [
      { phrase: 'at every interval', meaningVi: 'ở mọi giai đoạn', noteVi: 'Dùng khi mô tả xu hướng nhất quán qua các mốc.' },
      { phrase: 'followed the reverse pattern', meaningVi: 'đi theo quy luật ngược lại', noteVi: 'Cách tránh lặp lại “went down”.' },
      { phrase: 'stood between', meaningVi: 'nằm ở mức giữa', noteVi: 'Mô tả thứ hạng tương đối tại một mốc.' },
    ],
  }),
  task1({
    id: 'sample-t1-process-water', topicSlug: 'environment', topicEn: 'Environment', topicVi: 'Môi trường',
    title: 'Municipal water treatment', promptId: 'w-t1-process-water-filtration', chartKind: 'process',
    promptText: 'The diagram shows the stages involved in treating water before it is supplied to households.',
    paragraphs: [
      { en: 'The diagram illustrates how water is treated at a municipal facility before being delivered to homes.', vi: 'Sơ đồ minh hoạ cách nước được xử lý tại cơ sở đô thị trước khi được đưa đến các hộ gia đình.', focusVi: 'Mở bài diễn đạt lại sơ đồ quy trình, giữ đúng đầu ra.' },
      { en: 'Overall, this is a linear, seven-stage process that begins with water from a reservoir and ends with its distribution through a pipe network. The water passes through settling, filtration and disinfection, with no stage shown as a cycle.', vi: 'Nhìn chung, đây là quy trình tuyến tính gồm bảy giai đoạn, bắt đầu bằng nước lấy từ hồ chứa và kết thúc bằng việc phân phối qua mạng lưới đường ống. Nước trải qua lắng, lọc và khử trùng, không có bước nào được thể hiện theo chu trình.', focusVi: 'Overview nêu dạng tuyến tính, số bước, đầu vào/đầu ra và các xử lý chính.' },
      { en: 'First, raw water is extracted from the reservoir and chemicals are added to make small particles clump together. The water then enters clarifier tanks, where the heavier material settles out. After this, it is passed through layers of sand and carbon, which remove remaining impurities. These early stages gradually separate visible and suspended matter from the water.', vi: 'Trước tiên, nước thô được lấy từ hồ chứa và hoá chất được thêm vào để các hạt nhỏ kết tụ. Sau đó, nước đi vào bể lắng, nơi vật chất nặng hơn lắng xuống. Tiếp theo, nước được đưa qua các lớp cát và than hoạt tính để loại bỏ tạp chất còn lại. Những giai đoạn đầu này dần tách chất nhìn thấy được và chất lơ lửng khỏi nước.', focusVi: 'Thân bài 1 thuật lại nửa đầu theo đúng thứ tự và dùng bị động.' },
      { en: 'The filtered water is then disinfected using chlorine and ultraviolet light. Once it is clean, it is stored in a reservoir reserved for treated water. Finally, pumps send the supply through a network of pipes to households. Thus, purification is completed before the water enters the distribution system.', vi: 'Sau đó, nước đã lọc được khử trùng bằng clo và tia cực tím. Khi sạch, nước được lưu trữ trong hồ chứa dành riêng cho nước đã xử lý. Cuối cùng, máy bơm đẩy nguồn nước qua mạng lưới đường ống đến các hộ gia đình. Như vậy, quá trình làm sạch hoàn tất trước khi nước đi vào hệ thống phân phối.', focusVi: 'Thân bài 2 mô tả các công đoạn cuối, giữ trình tự trước-sau.' },
    ],
    vocabulary: [
      { phrase: 'is extracted from', meaningVi: 'được lấy/khai thác từ', noteVi: 'Cấu trúc bị động thường dùng cho đầu vào quy trình.' },
      { phrase: 'settles out', meaningVi: 'lắng xuống và tách ra', noteVi: 'Cụm động từ chỉ vật chất lắng khỏi chất lỏng.' },
      { phrase: 'is disinfected using', meaningVi: 'được khử trùng bằng', noteVi: 'Cấu trúc bị động kèm phương tiện xử lý.' },
    ],
  }),
  task1({
    id: 'sample-t1-map-seabourne', topicSlug: 'society', topicEn: 'Society', topicVi: 'Xã hội',
    title: 'Redevelopment of Seabourne', promptId: 'w-t1-map-seabourne', chartKind: 'map',
    promptText: 'The maps compare the coastal town of Seabourne in 1995 and at the present time.',
    paragraphs: [
      { en: 'The maps show how the coastal town of Seabourne has changed between 1995 and the present day.', vi: 'Hai bản đồ cho thấy thị trấn ven biển Seabourne đã thay đổi như thế nào từ năm 1995 đến hiện tại.', focusVi: 'Mở bài nêu địa điểm và hai mốc thời gian.' },
      { en: 'Overall, the former working waterfront has been redeveloped for tourism and housing. The sea and main access road remain in similar positions, but the docklands, fish market and fields have been replaced by leisure facilities and newer buildings.', vi: 'Nhìn chung, khu bến cảng phục vụ lao động trước đây đã được tái phát triển cho du lịch và nhà ở. Biển và đường tiếp cận chính vẫn ở vị trí tương tự, nhưng khu bến tàu, chợ cá và cánh đồng đã được thay bằng tiện ích giải trí và công trình mới.', focusVi: 'Overview nêu chuyển đổi tổng thể và điểm giữ nguyên.' },
      { en: 'In 1995, the northern edge of the town contained docklands beside a fish market, with a railway depot farther east. An access road ran below these facilities. South of it, open fields occupied the western side, while houses stood to the east. This layout combined port-related industry with a relatively undeveloped residential area.', vi: 'Năm 1995, rìa phía bắc thị trấn có khu bến tàu cạnh chợ cá, còn ga đường sắt nằm xa hơn về phía đông. Một tuyến đường tiếp cận chạy phía dưới các cơ sở này. Phía nam con đường, cánh đồng trống chiếm khu vực phía tây, trong khi nhà ở nằm phía đông. Bố cục này kết hợp công nghiệp cảng với khu dân cư tương đối chưa phát triển.', focusVi: 'Thân bài 1 mô tả bố cục ban đầu theo hướng không gian.' },
      { en: 'At present, the docklands have become a marina and the fish market site is occupied by a promenade with cafés. The railway depot has been replaced by a terminus, while the access road is now a dual carriageway. The western fields have been turned into an eco-park and the houses to the east have been replaced by apartments. The town has therefore gained visitor amenities and higher-density housing.', vi: 'Hiện nay, khu bến tàu đã trở thành bến du thuyền, còn khu chợ cá được thay bằng đường dạo có quán cà phê. Ga đường sắt cũ được thay bằng điểm cuối tuyến, trong khi đường tiếp cận hiện là đường hai chiều nhiều làn. Cánh đồng phía tây đã biến thành công viên sinh thái và nhà ở phía đông được thay bằng các khu căn hộ. Vì vậy, thị trấn có thêm tiện ích du khách và nhà ở mật độ cao hơn.', focusVi: 'Thân bài 2 nhóm thay đổi theo vị trí và dùng bị động hiện tại hoàn thành.' },
    ],
    vocabulary: [
      { phrase: 'has been redeveloped for', meaningVi: 'đã được tái phát triển để phục vụ', noteVi: 'Cấu trúc bị động hiện tại hoàn thành cho bản đồ thay đổi.' },
      { phrase: 'farther east', meaningVi: 'xa hơn về phía đông', noteVi: 'Cụm chỉ hướng giúp mô tả vị trí tương đối.' },
      { phrase: 'higher-density housing', meaningVi: 'nhà ở mật độ cao hơn', noteVi: 'Cụm mô tả thay đổi quy hoạch nhà ở.' },
    ],
  }),
  task1({
    id: 'sample-t1-mixed-commute', topicSlug: 'transport', topicEn: 'Transport', topicVi: 'Giao thông',
    title: 'Commuting mode and journey time', promptId: 'w-t1-mixed-metroville-commuting', chartKind: 'mixed', band: 8.0,
    promptText: 'The bar chart compares the percentage of commuters using four transport modes, while the line graph shows average journey times by car and bus in the same city in 2000 and 2020.',
    paragraphs: [
      { en: 'The bar chart compares the shares of commuters travelling by car, bus, train or bicycle, while the accompanying line graph shows journey times by car and bus in 2000 and 2020.', vi: 'Biểu đồ cột so sánh tỷ lệ người đi làm bằng ô tô, xe buýt, tàu hoả hoặc xe đạp, còn biểu đồ đường đi kèm cho thấy thời gian hành trình bằng ô tô và xe buýt vào năm 2000 và 2020.', focusVi: 'Mở bài diễn đạt cả hai hình trong đề kết hợp.' },
      { en: 'Overall, private cars remained the most common mode, but their share declined as bus and rail use increased. Car journeys became noticeably longer, whereas bus journeys changed only slightly and remained slower at both endpoints.', vi: 'Nhìn chung, ô tô cá nhân vẫn là phương tiện phổ biến nhất, nhưng tỷ lệ sử dụng giảm khi xe buýt và tàu hoả tăng. Hành trình bằng ô tô dài hơn rõ rệt, trong khi thời gian đi xe buýt chỉ thay đổi nhẹ và vẫn lâu hơn ở cả hai mốc.', focusVi: 'Overview kết nối xu hướng chính của cả biểu đồ cột và đường.' },
      { en: 'In 2000, 62% of commuters travelled by car, compared with 20% by bus, 12% by train and 6% by bicycle. Over the next two decades, the car proportion fell by 14 percentage points to 48%. Bus use rose to 27%, while rail increased to 18%; cycling also grew, though it remained the least selected option at 7%.', vi: 'Năm 2000, 62% người đi làm di chuyển bằng ô tô, so với 20% bằng xe buýt, 12% bằng tàu và 6% bằng xe đạp. Trong hai thập kỷ tiếp theo, tỷ lệ ô tô giảm 14 điểm phần trăm xuống 48%. Xe buýt tăng lên 27%, còn tàu hoả lên 18%; xe đạp cũng tăng nhưng vẫn là lựa chọn ít phổ biến nhất ở mức 7%.', focusVi: 'Thân bài 1 trình bày số liệu phương tiện theo thứ hạng và biến động.' },
      { en: 'The line graph shows that car journeys averaged 28 minutes in 2000 and 36 minutes in 2020. Bus trips were longer at both points, rising only slightly from 42 to 44 minutes. Thus, the gap between the two modes narrowed from 14 minutes to eight, although the chart cannot explain why either journey changed.', vi: 'Biểu đồ đường cho thấy hành trình bằng ô tô trung bình mất 28 phút năm 2000 và 36 phút năm 2020. Đi xe buýt lâu hơn ở cả hai mốc, chỉ tăng nhẹ từ 42 lên 44 phút. Do đó, khoảng cách giữa hai phương tiện thu hẹp từ 14 phút xuống còn tám phút, dù biểu đồ không thể giải thích nguyên nhân thay đổi của mỗi hành trình.', focusVi: 'Thân bài 2 mô tả biểu đồ thứ hai, nêu khoảng cách và tránh suy luận nguyên nhân.' },
    ],
    vocabulary: [
      { phrase: 'the accompanying line graph', meaningVi: 'biểu đồ đường đi kèm', noteVi: 'Cách nối hình thứ hai trong đề mixed chart.' },
      { phrase: 'fell by 14 percentage points', meaningVi: 'giảm 14 điểm phần trăm', noteVi: 'Dùng chính xác khi so sánh hai tỷ lệ.' },
      { phrase: 'the figures alone cannot establish', meaningVi: 'chỉ số liệu này không thể xác lập', noteVi: 'Cách thận trọng để tránh suy diễn từ biểu đồ.' },
    ],
  }),
];

export const WRITING_SAMPLES: WritingSample[] = [
  ...CORE_WRITING_SAMPLES,
  ...WRITING_SAMPLES_EXTRA_OPINION,
  ...WRITING_SAMPLES_EXTRA_DISCUSSION,
  ...WRITING_SAMPLES_EXTRA_ADVANTAGES,
  ...WRITING_SAMPLES_EXTRA_SOLUTIONS,
  ...WRITING_SAMPLES_EXTRA_TWO_PART,
  ...WRITING_SAMPLES_EXTRA_OPINION_2,
  ...WRITING_SAMPLES_EXTRA_DISCUSSION_2,
  ...WRITING_SAMPLES_EXTRA_ADVANTAGES_2,
  ...WRITING_SAMPLES_EXTRA_TASK1,
  ...WRITING_SAMPLES_EXTRA_SOLUTIONS_2,
  ...TID_TASK1_SAMPLES,
  ...TID_TASK2_SAMPLES,
];

export function getWritingSampleById(id: string): WritingSample | undefined {
  return WRITING_SAMPLES.find((sample) => sample.id === id);
}

export function writingSampleStats() {
  return {
    total: WRITING_SAMPLES.length,
    task1: WRITING_SAMPLES.filter((sample) => sample.task === 'ielts_task1').length,
    task2: WRITING_SAMPLES.filter((sample) => sample.task === 'ielts_task2').length,
    topics: new Set(WRITING_SAMPLES.map((sample) => sample.topicSlug)).size,
    paragraphs: WRITING_SAMPLES.reduce((total, sample) => total + sample.paragraphs.length, 0),
  };
}
