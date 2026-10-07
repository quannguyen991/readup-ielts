import type { SatRwQuestion } from '@/data/sat-rw-repository';

/** New Band 9 passages and questions, written independently for this course. */
export const SAT_RW_ORIGINAL_READING_EXPANSION: SatRwQuestion[] = [
  {
    id: 'b9-rw-read-reef-archive-main', unit: 14, unitTitle: 'Central ideas and details', domain: 'Information and Ideas', skill: 'central', difficulty: 'medium',
    passage: 'Marine ecologists once treated small temperature changes in tide pools as noise in their measurements. A yearlong sensor project revealed that pools shaded by overhanging rock warmed more slowly at midday than nearby exposed pools. The finding does not show that shade prevents all heat stress, but it suggests that the arrangement of a shoreline can create useful refuges for organisms during short heat waves.',
    stem: 'Which choice best states the main idea of the text?', options: ['A. Researchers have shown that all tide-pool organisms can survive heat waves.', 'B. The shape of a shoreline may help create cooler microhabitats during brief hot periods.', 'C. Earlier ecologists used sensors that were too inaccurate to study marine habitats.', 'D. Overhanging rocks keep tide pools at the same temperature throughout the day.'], answerIndex: 1,
    solutionVi: 'Đoạn nêu phát hiện chính: hồ nước được che bóng ấm lên chậm hơn, gợi ý địa hình bờ biển tạo nơi trú nhiệt tạm thời. B bao quát và giữ đúng mức thận trọng. A tuyệt đối hóa; C chê thiết bị không có căn cứ; D nói nhiệt độ không đổi, trái với “warmed more slowly”.',
    whyWrong: ['Đoạn không kết luận mọi sinh vật sống sót qua nắng nóng.', '', 'Nghiên cứu trước xem biến thiên là nhiễu, không nói cảm biến sai.', 'Che bóng làm chậm nóng lên chứ không giữ nhiệt độ bất biến.'],
  },
  {
    id: 'b9-rw-read-archive-detail', unit: 14, unitTitle: 'Central ideas and details', domain: 'Information and Ideas', skill: 'central', difficulty: 'easy',
    passage: 'A city archive began lending digitized maps to neighborhood groups. The groups used the maps to compare present-day street names with labels on plans from a century ago. Archivists noticed that the maps attracted visitors who had rarely used the reading room, so the archive added short workshops on evaluating historical maps.',
    stem: 'According to the text, why did the archive add workshops?', options: ['A. To teach visitors how to assess historical maps.', 'B. To replace its original maps with digital copies.', 'C. To rename streets that had changed over time.', 'D. To encourage neighborhood groups to draw new city plans.'], answerIndex: 0,
    solutionVi: 'Câu cuối nêu trực tiếp lý do: workshop hướng dẫn đánh giá bản đồ lịch sử. Các lựa chọn khác không được đoạn hỗ trợ.',
    whyWrong: ['', 'Đoạn nói cho mượn bản số hóa, không thay bản gốc.', 'Không có hoạt động đổi tên đường.', 'Các nhóm so sánh bản đồ, không vẽ bản mới.'],
  },
  {
    id: 'b9-rw-read-seed-inference', unit: 16, unitTitle: 'Inferences', domain: 'Information and Ideas', skill: 'inference', difficulty: 'hard',
    passage: 'In a greenhouse trial, seedlings receiving brief pulses of wind developed thicker stems than seedlings kept in still air. The researchers then repeated the trial with the same total amount of airflow delivered continuously. Those plants also developed thicker stems, although the difference from the pulsed group was small and not consistent across species.',
    stem: 'Which choice is best supported by the text?', options: ['A. Continuous airflow always produces stronger seedlings than brief wind pulses.', 'B. Wind exposure may contribute to stem thickening, but its effect can vary by species.', 'C. The researchers proved that wind is the only cause of stem growth.', 'D. Seedlings exposed to pulsed airflow cannot grow in still conditions.'], answerIndex: 1,
    solutionVi: 'Cả hai cách cấp luồng khí đều đi kèm thân dày hơn, nhưng khác biệt nhỏ và không ổn định giữa loài. B suy luận thận trọng. A dùng “always” và nói kết quả trái dữ liệu; C thêm nguyên nhân duy nhất; D không được thử nghiệm kiểm tra.',
    whyWrong: ['Thí nghiệm không cho thấy liên tục luôn tốt hơn; khác biệt nhỏ, thiếu nhất quán.', '', 'Không có kết luận gió là nguyên nhân duy nhất.', 'Đoạn không nói cây không thể phát triển trong khí tĩnh.'],
  },
  {
    id: 'b9-rw-read-museum-evidence', unit: 15, unitTitle: 'Command of Evidence', domain: 'Information and Ideas', skill: 'evidence', difficulty: 'medium',
    passage: 'A museum tested two labels for a group of unfamiliar tools. One label listed technical names; the other explained what each tool did in a short sentence. Among visitors who had not studied the period, 68 percent correctly matched tools to their uses with the explanatory labels, compared with 41 percent using the technical-name labels. The museum concluded that functional descriptions can make unfamiliar artifacts easier to interpret.',
    stem: 'Which finding best supports the museum’s conclusion?', options: ['A. The tools came from a period that most visitors had not studied.', 'B. 68 percent matched the tools correctly with explanatory labels, versus 41 percent with technical names.', 'C. The museum tested two different groups of visitors.', 'D. Technical names are necessary for studying ancient objects.'], answerIndex: 1,
    solutionVi: 'Kết luận so sánh hiệu quả của hai kiểu nhãn; số 68% so với 41% trực tiếp ủng hộ nhãn mô tả công dụng. A nêu bối cảnh; C không nói có hai nhóm; D trái hướng và không có căn cứ.',
    whyWrong: ['Bối cảnh không so sánh khả năng diễn giải.', '', 'Đoạn không xác nhận người tham gia thuộc hai nhóm khác nhau.', 'Đoạn không nói tên kỹ thuật là bắt buộc.'],
  },
  {
    id: 'b9-rw-read-library-word', unit: 11, unitTitle: 'Words in context', domain: 'Craft and Structure', skill: 'words', difficulty: 'medium',
    passage: 'The first measurements of the cave paintings were provisional: the team used a portable lamp and recorded only the largest figures. After a conservation specialist installed a stable light source, researchers returned with calibrated instruments and revised the dimensions of several smaller images.',
    stem: 'As used in the text, “provisional” most nearly means', options: ['temporary', 'inaccurate', 'anecdotal', 'exhaustive'], answerIndex: 0,
    solutionVi: 'Nhóm quay lại và chỉnh số đo sau khi có điều kiện tốt hơn, nên các phép đo ban đầu chỉ là tạm thời. B, C và D không phù hợp với việc nghiên cứu tiếp tục cập nhật số đo.',
    whyWrong: ['', '“Inaccurate” nói số đo sai, trong khi đoạn chỉ nói chúng tạm thời và được cập nhật.', '“Anecdotal” mô tả bằng chứng từ chuyện kể cá nhân, không phải trạng thái của phép đo.', '“Exhaustive” nghĩa là toàn diện, trái với việc nhóm chỉ đo những hình lớn nhất.'],
  },
  {
    id: 'b9-rw-read-urban-text-purpose', unit: 12, unitTitle: 'Text Structure and Purpose', domain: 'Craft and Structure', skill: 'structure', difficulty: 'hard',
    passage: 'Many city planners evaluate a park by counting visits. That measure is useful, but it can obscure a second question: who feels able to use the park? In a recent survey, residents living near two equally busy parks reported different levels of comfort. The park with more entrances, benches near paths, and clear signs was rated as easier to navigate by older visitors.',
    stem: 'What is the function of the second sentence in the text?', options: ['A. It rejects the use of visitor counts in every planning decision.', 'B. It introduces a limitation of the measure discussed in the first sentence.', 'C. It provides evidence that both parks have identical designs.', 'D. It presents the survey’s final recommendation.'], answerIndex: 1,
    solutionVi: 'Câu đầu nói lượt ghé thăm là thước đo. Câu hai công nhận ích lợi nhưng chỉ ra nó có thể che khuất khả năng tiếp cận. B nêu đúng chức năng lập luận.',
    whyWrong: ['Câu nói số lượt vẫn hữu ích, không bác bỏ hoàn toàn.', '', 'Thiết kế giống nhau không được nêu.', 'Khuyến nghị chưa xuất hiện ở câu hai.'],
  },
  {
    id: 'b9-rw-read-two-texts', unit: 13, unitTitle: 'Cross-Text Connections', domain: 'Craft and Structure', skill: 'crosstext', difficulty: 'hard',
    passage: 'Text 1: A historian argues that a collection of household diaries offers a valuable record of how families adapted to a prolonged drought. Because the entries were written at the time, they may preserve everyday decisions missing from official reports.\n\nText 2: A sociologist agrees that the diaries contain unusually detailed accounts of daily life. However, the surviving diaries mostly belonged to property-owning households, so they cannot represent every community affected by the drought.',
    stem: 'How would the author of Text 2 most likely respond to the claim in Text 1?', options: ['A. By agreeing that the diaries are useful while cautioning against treating them as representative of all families.', 'B. By arguing that official reports are always more accurate than personal accounts.', 'C. By claiming that no household changed its behavior during the drought.', 'D. By rejecting the diaries because they were not written during the drought.'], answerIndex: 0,
    solutionVi: 'Tác giả 2 đồng ý nhật ký giàu chi tiết nhưng giới hạn tính đại diện vì chủ yếu còn lại nhật ký của hộ sở hữu tài sản. A giữ đúng cả sự đồng thuận lẫn cảnh báo.',
    whyWrong: ['', 'Không có so sánh độ chính xác tuyệt đối với báo cáo chính thức.', 'Không văn bản nào kết luận gia đình không thay đổi.', 'Text 2 không phủ nhận thời điểm viết; Text 1 nói chúng được viết đồng thời.'],
  },
  {
    id: 'b9-rw-read-plant-main', unit: 14, unitTitle: 'Central ideas and details', domain: 'Information and Ideas', skill: 'central', difficulty: 'hard',
    passage: 'A botanist compared two related desert plants that flower at different times. The earlier-flowering species produced more seeds in years when spring rain arrived early; the later-flowering species produced more seeds when rain was delayed. This pattern suggests that the plants’ contrasting schedules may reduce competition for pollinators and help each species reproduce under different seasonal conditions.',
    stem: 'Which choice best expresses the main idea of the text?', options: ['A. Desert plants produce the same number of seeds regardless of rainfall.', 'B. Different flowering schedules may benefit related plants under different rainfall timing.', 'C. Pollinators visit only plants that flower after spring rain.', 'D. The later-flowering species is more successful in every year.'], answerIndex: 1,
    solutionVi: 'Đoạn nối thời điểm mưa với lợi thế của hai lịch ra hoa khác nhau và nêu khả năng giảm cạnh tranh. B bao quát toàn bộ. A, C, D tuyệt đối hóa hoặc trái thông tin.',
    whyWrong: ['Số hạt thay đổi theo thời điểm mưa.', '', 'Không nói thụ phấn chỉ xảy ra sau mưa.', 'Mỗi loài có lợi trong điều kiện khác nhau.'],
  },
  {
    id: 'b9-rw-read-archive-inference', unit: 16, unitTitle: 'Inferences', domain: 'Information and Ideas', skill: 'inference', difficulty: 'medium',
    passage: 'A coastal town moved its rain gauges from rooftops to open ground after comparing readings from both locations. During storms, rooftop gauges recorded less rain when wind blew toward the buildings. Once the gauges were relocated, the town’s measurements aligned more closely with a nearby research station.',
    stem: 'Which choice is best supported by the text?', options: ['A. Rooftops are the most reliable places to measure rainfall in windy weather.', 'B. Wind may have interfered with some of the earlier rooftop measurements.', 'C. The research station caused the town to receive more rain.', 'D. The town no longer needs to measure rainfall during storms.'], answerIndex: 1,
    solutionVi: 'Số đo trên mái thấp hơn khi gió thổi về phía tòa nhà, và sau khi chuyển vị trí số đo gần trạm nghiên cứu hơn. Có thể suy ra gió ảnh hưởng một phần các phép đo trước đó.',
    whyWrong: ['Dữ liệu cho thấy mái nhà có thể làm số đo thấp hơn khi có gió.', '', 'Trạm đo không làm thay đổi lượng mưa.', 'Thị trấn vẫn tiến hành đo; chỉ đổi vị trí thiết bị.'],
  },
  {
    id: 'b9-rw-read-words-robust', unit: 11, unitTitle: 'Words in context', domain: 'Craft and Structure', skill: 'words', difficulty: 'hard',
    passage: 'The first model of the river delta was fragile: it reproduced the shoreline under calm conditions but failed when researchers added seasonal floods. The team then built a more robust model that remained close to observed sediment patterns across both ordinary and unusually wet years.',
    stem: 'As used in the text, “robust” most nearly means', options: ['resilient', 'permanent', 'inaccurate', 'anecdotal'], answerIndex: 0,
    solutionVi: 'Mô hình mới vẫn khớp dữ liệu ở năm thường và năm lũ lớn, nên “robust” là vững/đáng tin trong nhiều điều kiện. Các nghĩa khác không khớp phép đối chiếu với mô hình trước.',
    whyWrong: ['', '“Permanent” nói thời gian tồn tại, không phải khả năng ổn định khi điều kiện đổi.', '“Inaccurate” trái với mô hình mới khớp quan sát.', '“Anecdotal” nói về loại bằng chứng, không phải độ bền của mô hình.'],
  },
  {
    id: 'b9-rw-read-text-purpose', unit: 12, unitTitle: 'Text Structure and Purpose', domain: 'Craft and Structure', skill: 'structure', difficulty: 'medium',
    passage: 'For decades, researchers assumed that a certain migratory bird navigated mainly by following coastlines. A tracking study found that some birds took direct routes over open water. The researchers note that the birds were observed only during one season, so the results do not establish whether the same routes are used year-round.',
    stem: 'What is the main purpose of the final sentence?', options: ['A. To limit the scope of the conclusion that can be drawn from the study.', 'B. To explain why the birds avoid coastlines.', 'C. To argue that the tracking equipment was inaccurate.', 'D. To introduce a second group of migratory birds.'], answerIndex: 0,
    solutionVi: 'Câu cuối nhắc nghiên cứu chỉ theo dõi một mùa, vì thế không thể khái quát đường bay quanh năm. Đây là giới hạn phạm vi kết luận.',
    whyWrong: ['', 'Không giải thích nguyên nhân tránh bờ biển.', 'Không nói thiết bị không chính xác.', 'Không đưa ra nhóm chim thứ hai.'],
  },
  {
    id: 'b9-rw-read-cross-text', unit: 13, unitTitle: 'Cross-Text Connections', domain: 'Craft and Structure', skill: 'crosstext', difficulty: 'medium',
    passage: 'Text 1: An urban designer argues that converting one traffic lane into a protected cycling lane can encourage residents to replace short car trips with bicycle trips.\n\nText 2: A transportation analyst reports that bicycle use increased after a lane conversion in one district, but notes that bus service also improved during the same period.',
    stem: 'Which choice best describes how the author of Text 2 would qualify the claim in Text 1?', options: ['A. The increase in cycling may not be attributable to the lane conversion alone.', 'B. Protected lanes can never affect travel choices.', 'C. Bus service declined after the lane conversion.', 'D. Residents made fewer short trips of every kind.'], answerIndex: 0,
    solutionVi: 'Text 2 nêu biến số đồng thời: dịch vụ xe buýt cũng được cải thiện. Vì vậy chưa thể gán toàn bộ mức tăng đi xe đạp cho làn bảo vệ.',
    whyWrong: ['', 'Text 2 không phủ nhận mọi tác động.', 'Thông tin nói xe buýt tốt lên.', 'Không có dữ liệu về tổng số chuyến ngắn.'],
  },
];
