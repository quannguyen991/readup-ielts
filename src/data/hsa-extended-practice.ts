import type { HsaQuestion } from './hsa';

const climateContext = `A city compared three neighbourhoods before and after adding street trees. The shaded district recorded lower afternoon surface temperatures, but it also had less traffic and more parks before the project began. The report describes the measurements as encouraging and recommends collecting data through several summers.`;
const surveyContext = `A survey of 600 students found that those who used a study-planning app reported fewer missed deadlines. The survey was voluntary, and students who already planned their work may have been more likely to download the app. The authors say the association merits a controlled trial.`;

export const HSA_EXTENDED_PRACTICE: readonly HsaQuestion[] = [
  {
    id: 'hsa-extra-voc-01', kind: 'vocabulary-in-context', topic: 'environment', level: 'C1',
    prompt: 'In the climate report, “encouraging” most nearly means that the results are…',
    choices: ['promising but not yet conclusive.','certain proof of a universal effect.','irrelevant to future research.','deliberately misleading.'], answer: 0,
    explanation: { vi: 'Bài khuyến nghị đo thêm qua nhiều mùa hè, nên kết quả hứa hẹn nhưng chưa đủ kết luận.', en: 'The report recommends more summers of data, so the results are promising but not conclusive.' }, context: climateContext,
  },
  {
    id: 'hsa-extra-voc-02', kind: 'vocabulary-in-context', topic: 'education', level: 'C1',
    prompt: 'In the study-planning report, “merits a controlled trial” means the idea…',
    choices: ['is worth testing under conditions that better isolate its effect.','has already been proven in every school.','should be rejected without further study.','is too expensive to investigate.'], answer: 0,
    explanation: { vi: '“Merits” nghĩa là xứng đáng/có cơ sở để thực hiện; thử nghiệm có kiểm soát giúp kiểm tra tác động.', en: '“Merits” means deserves; a controlled trial would test the effect more rigorously.' }, context: surveyContext,
  },
  {
    id: 'hsa-extra-voc-03', kind: 'vocabulary-in-context', topic: 'media-information', level: 'B2',
    prompt: 'Choose the best meaning of “voluntary” in “the survey was voluntary.”',
    choices: ['People chose whether to take part.','Every student was required to respond.','Responses were collected without consent.','The survey was conducted by volunteers only.'], answer: 0,
    explanation: { vi: 'Người tham gia tự quyết định có trả lời khảo sát hay không.', en: 'Participants chose whether to take part.' }, context: surveyContext,
  },
  {
    id: 'hsa-extra-voc-04', kind: 'vocabulary-in-context', topic: 'cities-transport', level: 'C1',
    prompt: 'In the climate report, “baseline conditions” would refer to…',
    choices: ['measurements taken before the intervention for comparison.','the highest temperature recorded after planting.','a forecast of future traffic levels.','a list of trees selected for the project.'], answer: 0,
    explanation: { vi: 'Đường cơ sở là dữ liệu trước can thiệp dùng làm mốc so sánh.', en: 'Baseline conditions are pre-intervention measurements used for comparison.' }, context: climateContext,
  },
  {
    id: 'hsa-extra-author-01', kind: 'author-purpose', topic: 'environment', level: 'C1',
    prompt: 'Why does the author mention that the shaded district already had less traffic and more parks?',
    choices: ['To show that the tree project’s effect cannot be isolated from existing differences.','To argue that trees increase traffic.','To establish that parks have no connection to temperature.','To prove that the other districts had no shade.'], answer: 0,
    explanation: { vi: 'Hai khác biệt có sẵn là biến gây nhiễu; cần thận trọng khi quy chênh lệch nhiệt độ cho cây mới trồng.', en: 'These pre-existing differences are confounders, so the temperature difference cannot be attributed to the trees alone.' }, context: climateContext,
  },
  {
    id: 'hsa-extra-author-02', kind: 'author-purpose', topic: 'education', level: 'C1',
    prompt: 'What is the main purpose of the final sentence in the study-planning passage?',
    choices: ['To recommend a stronger next step before making a causal claim.','To announce that the app has failed.','To show that voluntary surveys are always useless.','To claim that the app caused fewer missed deadlines.'], answer: 0,
    explanation: { vi: 'Tác giả đề xuất thử nghiệm có kiểm soát để xử lý hạn chế của khảo sát tự nguyện.', en: 'The authors propose a controlled trial to address limitations of the voluntary survey.' }, context: surveyContext,
  },
  {
    id: 'hsa-extra-author-03', kind: 'author-purpose', topic: 'environment', level: 'B2',
    prompt: 'The phrase “through several summers” mainly signals that the researchers want to…',
    choices: ['check whether the pattern persists across time and seasons.','finish the project before the next week.','avoid collecting temperature data.','compare only one afternoon.'], answer: 0,
    explanation: { vi: 'Đo qua nhiều mùa giúp kiểm tra tính bền vững, tránh kết luận từ một giai đoạn ngắn.', en: 'Data across summers can show whether the pattern persists beyond a short period.' }, context: climateContext,
  },
  {
    id: 'hsa-extra-author-04', kind: 'author-purpose', topic: 'media-information', level: 'C1',
    prompt: 'Which description best captures the authors’ stance toward the app survey?',
    choices: ['Interested but cautious about whether the app caused the difference.','Certain that the app works for all students.','Dismissive of any relationship between planning and deadlines.','Concerned only with the app’s design.'], answer: 0,
    explanation: { vi: 'Khảo sát gợi ra mối liên hệ đáng nghiên cứu thêm, nhưng tự chọn tham gia cản trở kết luận nhân quả.', en: 'The association is worth investigating, but self-selection prevents a firm causal conclusion.' }, context: surveyContext,
  },
  {
    id: 'hsa-extra-evidence-01', kind: 'evidence-evaluation', topic: 'environment', level: 'C1',
    prompt: 'Which comparison would best strengthen the claim that street trees lowered afternoon surface temperatures?',
    choices: ['Track comparable shaded and unshaded streets over time, accounting for traffic, parks and weather.','Ask residents which district looks cooler in photographs.','Measure one shaded street once after planting.','Compare the city with a different country using different instruments.'], answer: 0,
    explanation: { vi: 'Nhóm đối chứng tương đồng và dữ liệu theo thời gian giúp kiểm soát khác biệt ban đầu và biến động thời tiết.', en: 'Comparable controls and repeated measurements help account for baseline differences and weather.' }, context: climateContext,
  },
  {
    id: 'hsa-extra-evidence-02', kind: 'evidence-evaluation', topic: 'education', level: 'C1',
    prompt: 'Which design best addresses the possibility that organised students were more likely to download the app?',
    choices: ['Randomly assign willing students to app and comparison groups, then measure missed deadlines.','Survey only students who already use the app.','Ask students whether they consider themselves organised.','Compare app downloads with school size.'], answer: 0,
    explanation: { vi: 'Phân nhóm ngẫu nhiên giảm khác biệt lựa chọn có sẵn giữa người dùng và không dùng app.', en: 'Random assignment reduces pre-existing selection differences between app users and non-users.' }, context: surveyContext,
  },
  {
    id: 'hsa-extra-evidence-03', kind: 'evidence-evaluation', topic: 'media-information', level: 'B2',
    prompt: 'Why is a voluntary survey vulnerable to self-selection bias?',
    choices: ['People who choose to respond may differ systematically from those who do not.','Volunteers are unable to answer questions honestly.','A voluntary survey cannot include numerical data.','Every respondent must give the same answer.'], answer: 0,
    explanation: { vi: 'Người tự nguyện trả lời có thể khác có hệ thống với người không tham gia.', en: 'Volunteers may differ systematically from people who do not respond.' }, context: surveyContext,
  },
  {
    id: 'hsa-extra-evidence-04', kind: 'evidence-evaluation', topic: 'science-agriculture', level: 'C1',
    prompt: 'Which statement is an observation rather than a causal conclusion?',
    choices: ['The shaded district recorded lower afternoon surface temperatures.','Planting trees caused the full temperature difference.','Traffic reductions had no influence on temperatures.','The same effect will occur in every city.'], answer: 0,
    explanation: { vi: 'Đây là dữ kiện đo được. Các lựa chọn còn lại đều khẳng định nguyên nhân hoặc khái quát vượt quá bằng chứng.', en: 'This is a measured observation; the other options make causal or universal claims beyond the evidence.' }, context: climateContext,
  },
  {
    id: 'hsa-extra-data-01', kind: 'data-interpretation', topic: 'cities-transport', level: 'B2',
    prompt: 'A table reports afternoon surface temperature before/after planting: shaded street 39°C/34°C; comparison street 38°C/36°C. Which statement is accurate?',
    choices: ['The shaded street fell by 5°C, while the comparison street fell by 2°C.','Both streets fell by 5°C.','The comparison street became 2°C warmer.','The shaded street was cooler before planting.'], answer: 0,
    explanation: { vi: '39 xuống 34 là giảm 5°C; 38 xuống 36 là giảm 2°C. Chênh lệch thay đổi quan sát là 3°C.', en: '39 to 34 is a 5°C decrease; 38 to 36 is a 2°C decrease. The difference in changes is 3°C.' }, context: climateContext,
  },
  {
    id: 'hsa-extra-data-02', kind: 'data-interpretation', topic: 'education', level: 'C1',
    prompt: 'Missed deadlines per 100 students: app users 8; non-users 13. Which conclusion is justified by these data alone?',
    choices: ['The app users had fewer missed deadlines in this sample, but causation is not established.','The app reduced missed deadlines by exactly five for every student.','All students would benefit equally from the app.','The app caused non-users to miss deadlines.'], answer: 0,
    explanation: { vi: 'Số liệu mô tả chênh lệch 5 trên 100 trong mẫu; thiết kế khảo sát không chứng minh app gây ra chênh lệch.', en: 'The figures show a five-per-100 difference in this sample; the survey design does not establish causation.' }, context: surveyContext,
  },
  {
    id: 'hsa-extra-data-03', kind: 'data-interpretation', topic: 'science-agriculture', level: 'B2',
    prompt: 'A project records 24, 30 and 27 insect observations in three successive months. What is the change from month one to month three?',
    choices: ['An increase of 3 observations.','A decrease of 3 observations.','An increase of 6 observations.','No change.'], answer: 0,
    explanation: { vi: 'Tháng ba có 27, tháng một có 24: tăng 3 quan sát.', en: 'Month three has 27 versus 24 in month one, an increase of 3.' },
  },
  {
    id: 'hsa-extra-data-04', kind: 'data-interpretation', topic: 'society-health', level: 'C1',
    prompt: 'A chart shows missed visits falling from 20% to 14% after reminders, while a new booking system was introduced at the same time. What is the safest reading?',
    choices: ['Missed visits fell by 6 percentage points, but the chart cannot isolate the reminder effect.','Missed visits fell by 6 percent exactly because of reminders.','The booking system had no effect.','The clinic’s attendance increased by 14 percentage points.'], answer: 0,
    explanation: { vi: '20% xuống 14% là giảm 6 điểm phần trăm; có hai thay đổi đồng thời nên không thể tách tác động tin nhắn.', en: '20% to 14% is a six-percentage-point decrease; concurrent changes prevent isolating the reminder effect.' },
  },
  {
    id: 'hsa-extra-insert-01', kind: 'sentence-insertion', topic: 'environment', level: 'C1',
    prompt: 'Where does this sentence fit best? “That difference makes it difficult to attribute the temperature change to trees alone.”\n(1) The city compared three neighbourhoods before and after planting. (2) The shaded district was cooler afterwards. (3) It had also had less traffic and more parks beforehand. (4) Researchers recommended several more summers of data.',
    choices: ['After sentence (3).','After sentence (1).','After sentence (2).','After sentence (4).'], answer: 0,
    explanation: { vi: '“That difference” trỏ lại tình trạng ít xe và nhiều công viên đã có từ trước ở câu (3), rồi giải thích hệ quả của nó.', en: '“That difference” refers to the pre-existing traffic and park conditions in sentence (3), then explains their implication.' },
  },
  {
    id: 'hsa-extra-insert-02', kind: 'sentence-insertion', topic: 'education', level: 'C1',
    prompt: 'Where does this sentence fit best? “Consequently, the two groups may not have been comparable before using the app.”\n(1) Students using the app reported fewer missed deadlines. (2) The survey was voluntary. (3) Students who already planned their work may have been more likely to download it. (4) The authors recommend a controlled trial.',
    choices: ['After sentence (3).','After sentence (1).','Before sentence (1).','After sentence (4).'], answer: 0,
    explanation: { vi: 'Câu chèn kết luận từ khả năng tự chọn ở câu (2)–(3): hai nhóm có thể khác nhau từ trước.', en: 'The sentence draws a conclusion from self-selection in (2)–(3): the groups may already differ.' },
  },
  {
    id: 'hsa-extra-insert-03', kind: 'sentence-insertion', topic: 'media-information', level: 'B2',
    prompt: 'Where does this sentence fit best? “For this reason, the figures should be treated as a starting point for investigation.”\n(1) Volunteers submitted photographs of insects. (2) Scientists checked a sample and confirmed most identifications. (3) Observations clustered around accessible parks. (4) Participants did not visit sites at random.',
    choices: ['After sentence (4).','After sentence (1).','Before sentence (1).','After sentence (2).'], answer: 0,
    explanation: { vi: '“For this reason” tổng kết hạn chế lấy mẫu ở câu (3)–(4) và dẫn đến cách sử dụng dữ liệu thận trọng.', en: '“For this reason” summarises the sampling limitations in (3)–(4) and motivates cautious use.' },
  },
  {
    id: 'hsa-extra-insert-04', kind: 'sentence-insertion', topic: 'society-health', level: 'C1',
    prompt: 'Where does this sentence fit best? “However, the timing means the messages cannot be credited with the whole change.”\n(1) Missed visits declined over four months. (2) The clinic had also revised its booking system. (3) Some patients chose not to receive reminders. (4) The clinic plans a controlled comparison.',
    choices: ['After sentence (2).','After sentence (1).','Before sentence (1).','After sentence (4).'], answer: 0,
    explanation: { vi: 'Câu đối lập theo sau thông tin về thay đổi hệ thống đặt lịch đồng thời, yếu tố làm hạn chế kết luận nhân quả.', en: 'The contrast follows the concurrent booking-system change, which limits causal attribution.' },
  },
];
