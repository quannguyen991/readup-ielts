import type { HsaQuestion } from './hsa';

const evidencePassage = `A city introduced a congestion charge in its central district and reported a 14 per cent fall in weekday car entries during the first six months. Officials attributed the change to the charge. However, a major roadworks scheme began in the same period, while bus services were temporarily increased. The report compared traffic counts with the previous year but did not compare the district with a similar area that had no charge. It also noted that some drivers shifted their journeys to the edge of the charged zone. The figures therefore establish a change in traffic volume, but they do not isolate the effect of the charge or show whether total city-wide emissions fell.`;
const researchPassage = `In a classroom trial, students who used an AI writing assistant produced essays rated more highly than those in a comparison class. The trial was not randomised: teachers chose which class used the tool, and the two classes had different levels of prior writing experience. The rating rubric rewarded grammatical accuracy and organisation but gave less weight to the quality of evidence. Researchers interviewed a small group of volunteers, many of whom already used writing tools. They conclude that the findings justify a larger controlled study, while cautioning that improved scores cannot yet be interpreted as improved independent writing ability.`;
const ecologyPassage = `A wetland restoration programme reported a rise in the number of bird species observed two years after work began. The survey took place during one migration season, and observers recorded birds from a new platform that offered a wider view than the old route. Water quality improved at two sampling points, but a third point showed no significant change. The programme's managers describe the results as encouraging, while independent ecologists argue that longer monitoring is needed to distinguish restoration effects from seasonal variation and changes in survey methods.`;

export const HSA_ADVANCED_SET: readonly HsaQuestion[] = [
  {
    id: 'hsa-adv-01', kind: 'reasoning', topic: 'cities-transport', level: 'C1',
    prompt: 'Which conclusion is best supported by the congestion-charge report?',
    choices: ['The charge alone reduced city-wide emissions by 14 per cent.', 'Fewer cars entered the district, but the charge’s independent effect remains uncertain.', 'Roadworks had no influence on drivers’ choices.', 'The shift to the zone edge proves that total traffic increased.'], answer: 1,
    explanation: { vi: 'Báo cáo ghi nhận ít lượt xe vào khu vực, nhưng đồng thời có roadworks và tăng xe buýt; không có khu đối chứng và một phần chuyến đi dịch chuyển. Vì vậy chưa thể tách riêng tác động của phí.', en: 'The report records fewer entries, but roadworks and extra buses occurred at the same time; there was no control area and some trips shifted. The charge’s independent effect cannot be isolated.' }, context: evidencePassage,
  },
  {
    id: 'hsa-adv-02', kind: 'reasoning', topic: 'cities-transport', level: 'C1',
    prompt: 'Which additional evidence would most directly address the report’s main causal limitation?',
    choices: ['A survey asking residents whether they support the charge.', 'A comparison of several similar districts with and without the charge, using traffic and emissions data before and after implementation.', 'A count of vehicles entering the charged zone on one weekend.', 'A list of the roadworks completed during the six-month period.'], answer: 1,
    explanation: { vi: 'So sánh nhiều khu tương đồng trước và sau, có nhóm chịu tác động và nhóm đối chứng, giúp ước lượng thay đổi gắn với chính sách thay vì các yếu tố đồng thời.', en: 'A before-and-after comparison of similar treated and untreated districts helps estimate the policy effect while accounting for concurrent factors.' }, context: evidencePassage,
  },
  {
    id: 'hsa-adv-03', kind: 'reading-comprehension', topic: 'technology', level: 'C1',
    prompt: 'Why do the researchers resist describing the higher essay scores as proof of stronger independent writing?',
    choices: ['The trial measured only spelling and ignored every other feature.', 'Class assignment was non-random, prior experience differed, and the rubric underweighted evidence quality.', 'The students refused to use the assistant during the trial.', 'The interview group was too large to interpret.'], answer: 1,
    explanation: { vi: 'Ba giới hạn ảnh hưởng trực tiếp đến diễn giải: không phân nhóm ngẫu nhiên, năng lực ban đầu khác nhau, và tiêu chí chấm không đánh giá đủ chất lượng bằng chứng.', en: 'Three limitations affect interpretation: non-random assignment, different baseline experience, and a rubric that underweighted evidence quality.' }, context: researchPassage,
  },
  {
    id: 'hsa-adv-04', kind: 'reading-comprehension', topic: 'technology', level: 'C1',
    prompt: 'The phrase “justify a larger controlled study” implies that the current findings are regarded as…',
    choices: ['conclusive enough to recommend the tool to every school.', 'promising enough to investigate further, but insufficient for a firm causal claim.', 'too unreliable to inform any future research.', 'evidence that grammatical accuracy is the sole aim of writing instruction.'], answer: 1,
    explanation: { vi: 'Nghiên cứu hiện tại tạo cơ sở để tiếp tục kiểm tra chặt chẽ hơn, chứ chưa xác nhận quan hệ nhân quả hay hiệu quả phổ quát.', en: 'The present study motivates more rigorous investigation; it does not establish causality or universal effectiveness.' }, context: researchPassage,
  },
  {
    id: 'hsa-adv-05', kind: 'reading-comprehension', topic: 'environment', level: 'C1',
    prompt: 'Which interpretation best reconciles the managers’ and ecologists’ positions?',
    choices: ['The managers report encouraging indicators, while the ecologists question whether those indicators can yet be attributed to restoration.', 'The ecologists reject the bird survey because no birds were observed.', 'Both groups agree that the programme has permanently restored the wetland.', 'The managers claim the survey methods changed, while ecologists deny it.'], answer: 0,
    explanation: { vi: 'Hai bên không bất đồng về việc có chỉ báo tích cực; khác biệt nằm ở mức độ kết luận được phép rút ra từ dữ liệu ngắn hạn và phương pháp khảo sát đã đổi.', en: 'They do not dispute that some indicators are positive; they differ over how much can be inferred from short-term data and a changed survey method.' }, context: ecologyPassage,
  },
  {
    id: 'hsa-adv-06', kind: 'reasoning', topic: 'environment', level: 'C1',
    prompt: 'Which finding would most weaken the claim that restoration caused the observed rise in bird diversity?',
    choices: ['A longer survey finds the rise began before restoration and also occurred in nearby unrestored wetlands.', 'Visitors say they enjoy using the observation platform.', 'The programme planted more native species than planned.', 'A second observer records the same birds on the same day.'], answer: 0,
    explanation: { vi: 'Nếu xu hướng tăng xuất hiện trước can thiệp và cả ở nơi không phục hồi, các yếu tố khác có thể giải thích kết quả tốt hơn.', en: 'If the increase predates the intervention and occurs at untreated sites too, other factors offer a stronger explanation.' }, context: ecologyPassage,
  },
  {
    id: 'hsa-adv-07', kind: 'synonym-antonym', topic: 'media-information', level: 'C1',
    prompt: 'In a research report, “the findings are inconclusive” most nearly means that they…',
    choices: ['prove the opposite of the original hypothesis.', 'do not yet support a definite decision between competing explanations.', 'were deliberately concealed from the public.', 'are statistically identical across every group.'], answer: 1,
    explanation: { vi: '“Inconclusive” nghĩa là chưa đủ sức đưa ra kết luận chắc chắn; không đồng nghĩa với chứng minh giả thuyết sai.', en: '“Inconclusive” means insufficient for a firm conclusion, not that the hypothesis has been disproved.' },
  },
  {
    id: 'hsa-adv-08', kind: 'sentence-combination', topic: 'education', level: 'C1',
    prompt: 'Choose the sentence that preserves both the meaning and the cautious stance: “The pilot improved completion rates. It did not establish why they improved.”',
    choices: ['Although completion rates rose during the pilot, the reasons for the increase remain undetermined.', 'The pilot established that its design caused completion rates to rise.', 'Completion rates improved because the pilot identified the reason.', 'The pilot failed to change completion rates, although its cause was clear.'], answer: 0,
    explanation: { vi: 'Đáp án giữ cả hai ý: tỷ lệ hoàn thành tăng trong giai đoạn thử nghiệm, nhưng nguyên nhân chưa được xác định.', en: 'The option preserves both points: completion rose during the pilot, but the cause was not established.' },
  },
  {
    id: 'hsa-adv-09', kind: 'reasoning', topic: 'science-agriculture', level: 'C1',
    prompt: 'A report says a crop yield rose after a new irrigation method was introduced. Which question is most important before attributing the rise to the method?',
    choices: ['Did rainfall, seed variety, soil treatment or cultivated area also change?', 'Did farmers like the name given to the method?', 'Was the report printed in colour?', 'Did the crop have a shorter common name?'], answer: 0,
    explanation: { vi: 'Cần kiểm tra các biến đồng thời có thể gây ra thay đổi năng suất trước khi kết luận phương pháp tưới là nguyên nhân.', en: 'Check for concurrent variables that could explain the yield change before assigning causation to irrigation.' },
  },
  {
    id: 'hsa-adv-10', kind: 'reading-comprehension', topic: 'media-information', level: 'C1',
    prompt: 'A study finds that people who read more health news are more likely to seek medical advice. Which statement is the most defensible?',
    choices: ['Health news causes people to seek medical advice.', 'Seeking advice causes people to read health news.', 'The two behaviours are associated; the study design is needed to assess direction or causation.', 'The association proves that health news is accurate.'], answer: 2,
    explanation: { vi: 'Mối liên hệ không tự chứng minh chiều tác động hay quan hệ nhân quả; có thể tồn tại nguyên nhân thứ ba hoặc chiều ngược lại.', en: 'Association alone does not establish direction or causation; a third factor or reverse direction may explain it.' },
  },
];
