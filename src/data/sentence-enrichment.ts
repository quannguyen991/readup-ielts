/**
 * Từ vựng mới + cách diễn đạt khác (paraphrase) cho từng câu trong bài "Dịch
 * câu" — sinh MỘT LẦN bằng AI (workflow, 04/09/2026), lưu tĩnh thay vì gọi AI
 * sống mỗi lần người dùng bấm xem.
 *
 * VÌ SAO TĨNH, không gọi AI lúc chạy: 100 câu đáp án mẫu này là nội dung CỐ
 * ĐỊNH đã có sẵn trong `sentence-drills.ts`, không đổi theo người dùng hay
 * theo thời điểm — nên phần bổ sung cho chúng cũng chỉ cần đúng MỘT lần, dùng
 * lại mãi. Gọi AI mỗi lần xem sẽ tốn quota, thêm độ trễ, và phụ thuộc đúng hai
 * proxy AI vốn đã chứng minh là chập chờn (xem ghi chú ở `src/services/ai/fallback.ts`)
 * — cho một kết quả lẽ ra không đổi giữa hai lần xem.
 *
 * Khoá theo đúng `id` của `TranslationItem` trong `sentence-drills.ts`. Thêm
 * câu dịch mới thì thêm luôn một mục enrichment tương ứng ở đây; thiếu mục thì
 * màn hình chỉ đơn giản không hiện phần "Từ vựng mới"/"Cách diễn đạt khác" cho
 * câu đó (xem `useSentenceEnrichment` — không throw, không chặn luồng chính).
 */

export type SentenceVocabItem = {
  word: string;
  meaningVi: string;
  example: string;
};

export type SentenceEnrichment = {
  paraphrases: string[];
  vocab: SentenceVocabItem[];
};

export const SENTENCE_ENRICHMENT: Record<string, SentenceEnrichment> = {
  "tr-01": {
    paraphrases: [
      "Every morning, she studies English prior to having breakfast.",
      "English is studied by her each morning before she has breakfast.",
      "Before eating breakfast each day, she spends some time studying English.",
    ],
    vocab: [
      { word: "prior to", meaningVi: "trước khi", example: "Please arrive prior to the start of the meeting." },
      { word: "daily routine", meaningVi: "thói quen hàng ngày", example: "Reading the news is part of his daily routine." },
      { word: "devote time to", meaningVi: "dành thời gian cho", example: "She devotes an hour to exercise every evening." },
      { word: "on a regular basis", meaningVi: "một cách đều đặn", example: "He practises the piano on a regular basis." },
    ],
  },
  "tr-02": {
    paraphrases: [
      "Not far from the riverbank stands the small house that my grandmother calls home.",
      "The house where my grandmother resides is a modest one, sitting right beside the river.",
      "Situated close to the riverbank, the modest house my grandmother lives in has stood there for years.",
    ],
    vocab: [
      { word: "riverbank", meaningVi: "bờ sông", example: "The riverbank was lined with tall willow trees." },
      { word: "modest", meaningVi: "khiêm tốn, giản dị (nhà cửa nhỏ, không cầu kỳ)", example: "They live in a modest apartment on the edge of town." },
      { word: "situated", meaningVi: "nằm ở, tọa lạc", example: "The hotel is situated near the beach." },
      { word: "reside", meaningVi: "cư trú, sinh sống", example: "Many retirees choose to reside in coastal towns." },
    ],
  },
  "tr-03": {
    paraphrases: [
      "Since we were running late, we caught a taxi to the airport.",
      "Being behind schedule, we had to take a taxi to get to the airport.",
      "A taxi was taken to the airport because we were running behind time.",
    ],
    vocab: [
      { word: "running late", meaningVi: "bị trễ giờ", example: "He apologised for running late to the interview." },
      { word: "behind schedule", meaningVi: "chậm so với kế hoạch", example: "The construction project is now three months behind schedule." },
      { word: "catch a taxi", meaningVi: "bắt taxi", example: "We managed to catch a taxi just outside the station." },
      { word: "due to", meaningVi: "do, bởi vì", example: "The flight was delayed due to bad weather." },
    ],
  },
  "tr-04": {
    paraphrases: [
      "Staying well hydrated on a daily basis benefits your health.",
      "It is beneficial to your health to drink a sufficient amount of water each day.",
      "Your health benefits from consuming an adequate quantity of water every day.",
    ],
    vocab: [
      { word: "hydrated", meaningVi: "đủ nước, được cấp nước", example: "Athletes must stay hydrated during intense training sessions." },
      { word: "beneficial", meaningVi: "có lợi", example: "A balanced diet is beneficial for children's growth." },
      { word: "sufficient", meaningVi: "đủ, đầy đủ", example: "Make sure you get sufficient sleep before the exam." },
      { word: "adequate", meaningVi: "đầy đủ, thích đáng", example: "The report did not provide adequate evidence to support the claim." },
    ],
  },
  "tr-05": {
    paraphrases: [
      "He is employed by a bank located in the city centre.",
      "A bank in the city centre is where he works.",
      "He has a job at a bank situated in the downtown area.",
    ],
    vocab: [
      { word: "employed", meaningVi: "được tuyển dụng, có việc làm", example: "She has been employed by the same company for ten years." },
      { word: "situated", meaningVi: "tọa lạc, đặt tại", example: "The office is situated on the top floor of the building." },
      { word: "downtown", meaningVi: "trung tâm thành phố", example: "There are many restaurants downtown that stay open late." },
      { word: "workplace", meaningVi: "nơi làm việc", example: "Flexible hours have improved morale at the workplace." },
    ],
  },
  "tr-06": {
    paraphrases: [
      "The bus is the main means by which large numbers of this city's inhabitants get to their jobs.",
      "A great many of this city's residents rely on the bus to commute to work.",
      "It is common practice for a large proportion of the city's population to commute to work via bus.",
    ],
    vocab: [
      { word: "commute", meaningVi: "đi lại hằng ngày giữa nhà và nơi làm việc/học", example: "Many residents commute to work by bus every morning." },
      { word: "inhabitant", meaningVi: "cư dân, người sinh sống ở một nơi", example: "The city's inhabitants mostly rely on public transport." },
      { word: "rely on", meaningVi: "phụ thuộc vào, dựa vào", example: "Office workers often rely on the bus to get to work on time." },
      { word: "a great many", meaningVi: "rất nhiều (dùng trang trọng, đi với danh từ đếm được số nhiều)", example: "A great many people in this city travel by bus rather than by car." },
    ],
  },
  "tr-07": {
    paraphrases: [
      "This week's weather has been extremely cold.",
      "It has been bitterly cold throughout this week.",
      "Temperatures this week have been remarkably low.",
    ],
    vocab: [
      { word: "bitterly cold", meaningVi: "lạnh cắt da cắt thịt", example: "It was bitterly cold on the mountain last night." },
      { word: "temperature", meaningVi: "nhiệt độ", example: "The temperature dropped sharply after sunset." },
      { word: "freezing", meaningVi: "lạnh cóng, giá buốt", example: "We waited outside in freezing conditions for the bus." },
      { word: "chilly", meaningVi: "se lạnh", example: "Bring a jacket, it gets chilly in the evening." },
    ],
  },
  "tr-08": {
    paraphrases: [
      "Last night, I saw a fascinating documentary.",
      "An interesting documentary was watched by me last night.",
      "I spent last night watching a fascinating documentary.",
    ],
    vocab: [
      { word: "fascinating", meaningVi: "hấp dẫn, thú vị", example: "The lecture on ancient history was truly fascinating." },
      { word: "footage", meaningVi: "đoạn phim, cảnh quay", example: "The documentary included rare footage from the 1960s." },
      { word: "informative", meaningVi: "mang tính thông tin, bổ ích", example: "I found the podcast both informative and entertaining." },
      { word: "broadcast", meaningVi: "phát sóng", example: "The programme was broadcast live across the country." },
    ],
  },
  "tr-09": {
    paraphrases: [
      "On weekdays, the library shuts its doors at nine o'clock.",
      "The library's closing time on weekdays is nine o'clock.",
      "From Monday to Friday, the library closes at nine in the evening.",
    ],
    vocab: [
      { word: "closing time", meaningVi: "giờ đóng cửa", example: "Closing time at the museum is usually five in the afternoon." },
      { word: "weekdays", meaningVi: "ngày trong tuần (thứ Hai đến thứ Sáu)", example: "The gym is much busier on weekdays than at weekends." },
      { word: "shut its doors", meaningVi: "đóng cửa (cơ sở)", example: "The old cinema finally shut its doors last year." },
      { word: "opening hours", meaningVi: "giờ mở cửa", example: "Opening hours may change during public holidays." },
    ],
  },
  "tr-10": {
    paraphrases: [
      "Our neighbours are consistently kind and willing to help.",
      "We are fortunate to have neighbours who are always friendly and supportive.",
      "Friendliness and helpfulness are qualities our neighbours constantly display.",
    ],
    vocab: [
      { word: "consistently", meaningVi: "luôn luôn, một cách nhất quán", example: "He has consistently performed well in every exam." },
      { word: "supportive", meaningVi: "hỗ trợ, biết giúp đỡ", example: "Her colleagues were supportive during a difficult project." },
      { word: "willing to help", meaningVi: "sẵn lòng giúp đỡ", example: "The staff at the hotel were always willing to help guests." },
      { word: "considerate", meaningVi: "chu đáo, biết quan tâm", example: "He is a considerate neighbour who never plays loud music at night." },
    ],
  },
  "tr-11": {
    paraphrases: [
      "Coastal areas are increasingly plagued by plastic waste.",
      "Plastic pollution has emerged as a major issue along coastlines.",
      "A growing amount of plastic waste is causing serious problems in coastal regions.",
    ],
    vocab: [
      { word: "coastal area", meaningVi: "khu vực ven biển", example: "Many coastal areas rely heavily on tourism and fishing for income." },
      { word: "pose a threat", meaningVi: "gây ra mối đe dọa", example: "Rising sea levels pose a threat to low-lying communities." },
      { word: "pollution", meaningVi: "sự ô nhiễm", example: "Air pollution in big cities has worsened over the past few years." },
      { word: "emerge", meaningVi: "nổi lên, xuất hiện", example: "New environmental challenges have emerged as industries expand." },
    ],
  },
  "tr-12": {
    paraphrases: [
      "An increasing number of companies are permitting their staff to work remotely.",
      "Employees are being given the option to work from home by a growing number of companies.",
      "Remote work is being embraced by more and more businesses.",
    ],
    vocab: [
      { word: "remote work", meaningVi: "làm việc từ xa", example: "Remote work has become the norm in many tech industries." },
      { word: "permit", meaningVi: "cho phép", example: "The new policy permits staff to choose their own working hours." },
      { word: "flexibility", meaningVi: "sự linh hoạt", example: "Flexibility in scheduling is one of the main benefits employees value." },
      { word: "workforce", meaningVi: "lực lượng lao động", example: "A large part of the workforce now prefers hybrid working arrangements." },
    ],
  },
  "tr-13": {
    paraphrases: [
      "Students are being urged by universities to develop stronger critical thinking skills.",
      "More critical thinking is being promoted among students at universities.",
      "Higher education institutions are pushing students to engage in more critical analysis.",
    ],
    vocab: [
      { word: "critical thinking", meaningVi: "tư duy phản biện", example: "Critical thinking is considered essential for academic success." },
      { word: "foster", meaningVi: "nuôi dưỡng, thúc đẩy", example: "Teachers try to foster curiosity in young learners." },
      { word: "higher education", meaningVi: "giáo dục đại học", example: "Access to higher education has expanded significantly in recent decades." },
      { word: "analytical skills", meaningVi: "kỹ năng phân tích", example: "Employers increasingly value strong analytical skills in graduates." },
    ],
  },
  "tr-14": {
    paraphrases: [
      "Housing prices have risen sharply over the last ten years.",
      "There has been a significant rise in the cost of housing over the past decade.",
      "Over the past ten years, the cost of housing has surged.",
    ],
    vocab: [
      { word: "housing prices", meaningVi: "giá nhà đất", example: "Housing prices in major cities are often unaffordable for young families." },
      { word: "surge", meaningVi: "tăng vọt", example: "Demand for rental apartments has surged in recent months." },
      { word: "decade", meaningVi: "thập kỷ", example: "The economy has undergone major changes over the past decade." },
      { word: "affordability", meaningVi: "khả năng chi trả", example: "Affordability remains a key concern for first-time home buyers." },
    ],
  },
  "tr-15": {
    paraphrases: [
      "The risk of heart disease can be lowered through regular physical activity.",
      "Exercising regularly helps to minimize the likelihood of developing heart disease.",
      "People who exercise regularly are less likely to suffer from heart disease.",
    ],
    vocab: [
      { word: "cardiovascular disease", meaningVi: "bệnh tim mạch", example: "A poor diet is one of the leading causes of cardiovascular disease." },
      { word: "risk factor", meaningVi: "yếu tố nguy cơ", example: "Smoking is a major risk factor for several serious illnesses." },
      { word: "physical activity", meaningVi: "hoạt động thể chất", example: "Doctors recommend at least thirty minutes of physical activity a day." },
      { word: "minimize", meaningVi: "giảm thiểu", example: "A balanced diet can help minimize the chances of developing chronic illnesses." },
    ],
  },
  "tr-16": {
    paraphrases: [
      "This year has seen considerable improvement in the capital's public transport system.",
      "The public transport system in the capital has undergone significant improvement this year.",
      "Significant progress has been made in improving public transport in the capital this year.",
    ],
    vocab: [
      { word: "public transport", meaningVi: "giao thông công cộng", example: "Investing in public transport can help reduce traffic congestion." },
      { word: "considerably", meaningVi: "đáng kể", example: "Air quality has improved considerably since the new regulations were introduced." },
      { word: "infrastructure", meaningVi: "cơ sở hạ tầng", example: "The government plans to upgrade the city's transport infrastructure." },
      { word: "commuter", meaningVi: "người đi làm bằng phương tiện công cộng", example: "Commuters have reported shorter waiting times at bus stations." },
    ],
  },
  "tr-17": {
    paraphrases: [
      "Striking a balance between work and study is challenging for many young people.",
      "Many young people struggle to juggle their work and academic responsibilities.",
      "It is difficult for a lot of young people to manage both work and study at the same time.",
    ],
    vocab: [
      { word: "juggle", meaningVi: "xoay sở, cân bằng nhiều việc", example: "She has to juggle a part-time job with her university coursework." },
      { word: "work-life balance", meaningVi: "cân bằng công việc-cuộc sống", example: "Achieving a healthy work-life balance can reduce stress levels." },
      { word: "academic responsibilities", meaningVi: "trách nhiệm học tập", example: "Some students find it hard to keep up with their academic responsibilities." },
      { word: "struggle with", meaningVi: "vật lộn với", example: "Many freshmen struggle with time management in their first semester." },
    ],
  },
  "tr-18": {
    paraphrases: [
      "The friendliness of local people often comes as a surprise to tourists.",
      "Local residents' warmth frequently surprises visitors.",
      "Visitors are often taken aback by how welcoming local people are.",
    ],
    vocab: [
      { word: "hospitality", meaningVi: "lòng hiếu khách", example: "Visitors often praise the hospitality they receive in small villages." },
      { word: "warmth", meaningVi: "sự ấm áp, thân thiện", example: "The warmth of the welcome made the trip truly memorable." },
      { word: "take aback", meaningVi: "làm ngạc nhiên", example: "He was taken aback by the generosity of the strangers he met." },
      { word: "local residents", meaningVi: "người dân địa phương", example: "Local residents are usually happy to give directions to tourists." },
    ],
  },
  "tr-19": {
    paraphrases: [
      "The way we communicate with friends has been transformed by social media.",
      "Social media has transformed how friends stay in touch with one another.",
      "Our methods of communicating with friends have been reshaped by the rise of social media.",
    ],
    vocab: [
      { word: "transform", meaningVi: "biến đổi", example: "Technology has transformed the way businesses operate." },
      { word: "interact", meaningVi: "tương tác", example: "Children today interact with screens from a very young age." },
      { word: "stay in touch", meaningVi: "giữ liên lạc", example: "Video calls make it easier for families to stay in touch across long distances." },
      { word: "the rise of", meaningVi: "sự trỗi dậy của", example: "The rise of online shopping has changed traditional retail habits." },
    ],
  },
  "tr-20": {
    paraphrases: [
      "More money is being invested in renewable energy by governments.",
      "Renewable energy is receiving increased investment from governments.",
      "Governments are channeling greater funds into renewable energy sources.",
    ],
    vocab: [
      { word: "renewable energy", meaningVi: "năng lượng tái tạo", example: "Solar panels are one of the most common forms of renewable energy." },
      { word: "investment", meaningVi: "đầu tư", example: "Foreign investment has boosted the country's technology sector." },
      { word: "fossil fuels", meaningVi: "nhiên liệu hóa thạch", example: "Many countries are trying to reduce their dependence on fossil fuels." },
      { word: "sustainable", meaningVi: "bền vững", example: "Sustainable development aims to meet present needs without harming future generations." },
    ],
  },
  "tr-21": {
    paraphrases: [
      "Even though the economy has grown recently, the gap between rich and poor keeps widening.",
      "Income inequality keeps growing wider, despite the recent upturn in the economy.",
      "Although the economy has recently expanded, disparities in income continue to increase.",
    ],
    vocab: [
      { word: "economic growth", meaningVi: "tăng trưởng kinh tế", example: "The country recorded strong economic growth last quarter." },
      { word: "income inequality", meaningVi: "bất bình đẳng thu nhập", example: "Governments are under pressure to tackle income inequality." },
      { word: "widen", meaningVi: "nới rộng, gia tăng (khoảng cách)", example: "The wage gap between men and women has widened over the past decade." },
      { word: "wealth gap", meaningVi: "khoảng cách giàu nghèo", example: "Economists warn that the wealth gap could destabilise society." },
    ],
  },
  "tr-22": {
    paraphrases: [
      "Industries that used to depend completely on human labour are now being transformed by artificial intelligence.",
      "Artificial intelligence is reshaping sectors which were once wholly dependent on human workers.",
      "Sectors once entirely reliant on manual human effort are being revolutionised by AI technology.",
    ],
    vocab: [
      { word: "artificial intelligence", meaningVi: "trí tuệ nhân tạo", example: "Artificial intelligence is now used in fields ranging from medicine to finance." },
      { word: "transform", meaningVi: "biến đổi, làm thay đổi", example: "New technology has transformed the way people communicate." },
      { word: "rely on", meaningVi: "phụ thuộc vào", example: "Farmers in this region rely on seasonal rainfall for irrigation." },
      { word: "workforce", meaningVi: "lực lượng lao động", example: "Automation is reducing the need for a large manufacturing workforce." },
    ],
  },
  "tr-23": {
    paraphrases: [
      "According to critics, standardized tests do not accurately assess true understanding.",
      "It is argued by critics that genuine comprehension cannot be measured through standardized testing.",
      "Many critics claim that standardized exams are incapable of capturing real understanding.",
    ],
    vocab: [
      { word: "standardized testing", meaningVi: "thi/kiểm tra chuẩn hóa", example: "Standardized testing is widely used to compare student performance across schools." },
      { word: "genuine understanding", meaningVi: "sự hiểu biết thực sự", example: "Rote memorisation rarely leads to genuine understanding of a subject." },
      { word: "assess", meaningVi: "đánh giá", example: "Teachers use various methods to assess students' progress." },
      { word: "critic", meaningVi: "người chỉ trích, nhà phê bình", example: "Critics of the policy say it favours wealthy families." },
    ],
  },
  "tr-24": {
    paraphrases: [
      "Millions of people risk being displaced within this century as sea levels continue to rise.",
      "The rise in sea levels could force millions of people from their homes before the century ends.",
      "Within this century, millions may be uprooted as a result of rising sea levels.",
    ],
    vocab: [
      { word: "displace", meaningVi: "buộc phải di dời, di tản", example: "The flood displaced thousands of residents from coastal villages." },
      { word: "sea level rise", meaningVi: "mực nước biển dâng", example: "Sea level rise is already affecting low-lying island nations." },
      { word: "uproot", meaningVi: "buộc rời bỏ (nơi ở)", example: "War uprooted entire communities from their homeland." },
      { word: "threaten to", meaningVi: "đe dọa sẽ (xảy ra điều gì)", example: "Prolonged drought threatens to devastate local agriculture." },
    ],
  },
  "tr-25": {
    paraphrases: [
      "A strong connection between lack of sleep and memory loss has been identified by researchers.",
      "Researchers have found that sleep deprivation is closely linked to memory loss.",
      "It has been discovered that insufficient sleep is strongly associated with declining memory.",
    ],
    vocab: [
      { word: "sleep deprivation", meaningVi: "thiếu ngủ", example: "Sleep deprivation can impair concentration and decision-making." },
      { word: "memory loss", meaningVi: "suy giảm trí nhớ", example: "Memory loss is often one of the earliest signs of ageing." },
      { word: "correlation", meaningVi: "mối tương quan", example: "Scientists found a clear correlation between diet and heart disease." },
      { word: "cognitive function", meaningVi: "chức năng nhận thức", example: "Regular exercise has been shown to improve cognitive function." },
    ],
  },
  "tr-26": {
    paraphrases: [
      "Bridging the divide between how cities and rural areas develop has proven to be an ongoing challenge.",
      "Cities and the countryside continue to develop at markedly different rates, leaving an imbalance that has yet to be resolved.",
      "Uneven development between town and country is a problem that refuses to go away.",
    ],
    vocab: [
      { word: "persistent", meaningVi: "dai dẳng, kéo dài không dứt", example: "Despite years of reform, poverty remains a persistent problem in many rural regions." },
      { word: "disparity", meaningVi: "sự chênh lệch, sự khác biệt", example: "There is a significant disparity in income between the two regions." },
      { word: "bridge the gap", meaningVi: "thu hẹp khoảng cách", example: "The government has launched programs to bridge the gap between urban and rural healthcare." },
      { word: "uneven", meaningVi: "không đồng đều", example: "Economic growth in the country has been uneven, benefiting cities far more than the countryside." },
    ],
  },
  "tr-27": {
    paraphrases: [
      "The line between personal and professional life has become blurred due to remote working arrangements.",
      "Working remotely has caused personal and professional boundaries to blur.",
      "Remote work has made it increasingly difficult to separate one's personal life from one's career.",
    ],
    vocab: [
      { word: "remote working", meaningVi: "làm việc từ xa", example: "Remote working has become common since the pandemic." },
      { word: "blur", meaningVi: "làm mờ đi, xóa nhòa", example: "Social media has blurred the line between public and private life." },
      { word: "work-life balance", meaningVi: "cân bằng công việc - cuộc sống", example: "Many employees struggle to maintain a healthy work-life balance." },
      { word: "boundary", meaningVi: "ranh giới", example: "Setting clear boundaries at work can reduce stress." },
    ],
  },
  "tr-28": {
    paraphrases: [
      "Most people fail to realise how quickly misinformation spreads online.",
      "Online misinformation spreads at a pace far faster than commonly assumed.",
      "The speed at which misinformation circulates on the internet is often underestimated.",
    ],
    vocab: [
      { word: "misinformation", meaningVi: "thông tin sai lệch", example: "Social media platforms are under pressure to combat misinformation." },
      { word: "spread rapidly", meaningVi: "lan truyền nhanh chóng", example: "Rumours can spread rapidly through online forums." },
      { word: "underestimate", meaningVi: "đánh giá thấp, xem nhẹ", example: "People often underestimate the impact of fake news on public opinion." },
      { word: "circulate", meaningVi: "lan truyền, lưu hành", example: "False claims about the vaccine circulated widely on social media." },
    ],
  },
  "tr-29": {
    paraphrases: [
      "Competing with large multinational corporations is often a struggle for small businesses.",
      "Large multinational corporations often make it difficult for small businesses to compete.",
      "Small enterprises frequently find it hard to keep pace with major multinational companies.",
    ],
    vocab: [
      { word: "multinational corporation", meaningVi: "tập đoàn đa quốc gia", example: "Multinational corporations often dominate the global market." },
      { word: "compete with", meaningVi: "cạnh tranh với", example: "Local shops find it hard to compete with online retailers." },
      { word: "small enterprise", meaningVi: "doanh nghiệp nhỏ", example: "Small enterprises create a large share of new jobs each year." },
      { word: "struggle to", meaningVi: "vật lộn, chật vật để", example: "Many start-ups struggle to secure enough funding in their first year." },
    ],
  },
  "tr-30": {
    paraphrases: [
      "One of the most hotly debated issues of the digital age is data privacy.",
      "Data privacy now ranks among the most controversial issues in the digital era.",
      "Few issues in the digital age are as fiercely contested as data privacy.",
    ],
    vocab: [
      { word: "data privacy", meaningVi: "quyền riêng tư dữ liệu", example: "New regulations have been introduced to protect data privacy." },
      { word: "contested", meaningVi: "gây tranh cãi", example: "The new policy remains a contested topic among lawmakers." },
      { word: "digital age", meaningVi: "thời đại số", example: "Privacy concerns have grown significantly in the digital age." },
      { word: "controversial", meaningVi: "gây tranh cãi, gây bàn cãi", example: "Facial recognition technology is a controversial subject in many countries." },
    ],
  },
  "tr-31": {
    paraphrases: [
      "Silence must be maintained by students throughout the exam.",
      "Students are required to remain silent while the exam is taking place.",
      "During the test, no student is allowed to make any noise.",
    ],
    vocab: [
      { word: "maintain silence", meaningVi: "giữ im lặng", example: "Everyone was asked to maintain silence in the library." },
      { word: "invigilator", meaningVi: "giám thị coi thi", example: "The invigilator walked around the room to check for cheating." },
      { word: "refrain from (doing something)", meaningVi: "kiềm chế, không làm gì đó", example: "Passengers are asked to refrain from talking loudly on the train." },
      { word: "exam regulations", meaningVi: "quy định thi cử", example: "All candidates must follow the exam regulations strictly." },
    ],
  },
  "tr-32": {
    paraphrases: [
      "A park clean-up is being organized by my school this weekend.",
      "This weekend, my school will hold an event to clean up the park.",
      "My school is arranging for students to tidy up the local park this weekend.",
    ],
    vocab: [
      { word: "clean-up campaign", meaningVi: "chiến dịch dọn dẹp", example: "The city launched a clean-up campaign along the riverbank." },
      { word: "hold an event", meaningVi: "tổ chức một sự kiện", example: "The company holds a charity event every December." },
      { word: "community service", meaningVi: "hoạt động phục vụ cộng đồng", example: "Volunteering at the shelter counts as community service." },
      { word: "litter", meaningVi: "rác vứt bừa bãi", example: "Tourists are often blamed for the litter left on the beach." },
    ],
  },
  "tr-33": {
    paraphrases: [
      "My new phone's battery lasts an incredibly long time before it needs recharging.",
      "The battery on my new phone holds its charge for a remarkably long period.",
      "My brand-new phone comes with a battery that keeps going for ages on a single charge.",
    ],
    vocab: [
      { word: "long-lasting", meaningVi: "bền, có tuổi thọ cao", example: "This brand is famous for producing long-lasting batteries that rarely need replacing." },
      { word: "hold a charge", meaningVi: "giữ được điện (pin không tụt nhanh)", example: "My old tablet can no longer hold a charge for more than an hour." },
      { word: "last for hours on end", meaningVi: "kéo dài liên tục trong nhiều giờ liền", example: "The battery on this device can last for hours on end without needing a charge." },
      { word: "battery life", meaningVi: "thời lượng pin", example: "The battery life of this phone is much better than that of my previous one." },
    ],
  },
  "tr-34": {
    paraphrases: [
      "Daily exercise helps keep the body in good health.",
      "The body is kept healthy by exercising on a daily basis.",
      "If you exercise every day, your body will remain healthy.",
    ],
    vocab: [
      { word: "physical activity", meaningVi: "hoạt động thể chất", example: "Doctors recommend at least thirty minutes of physical activity a day." },
      { word: "maintain good health", meaningVi: "duy trì sức khỏe tốt", example: "Eating a balanced diet helps you maintain good health." },
      { word: "on a daily basis", meaningVi: "hàng ngày, đều đặn mỗi ngày", example: "She practices yoga on a daily basis to relieve stress." },
      { word: "well-being", meaningVi: "sức khỏe và tinh thần nói chung", example: "Regular sleep is essential for both physical and mental well-being." },
    ],
  },
  "tr-35": {
    paraphrases: [
      "Last month, the company promoted her to department manager.",
      "She received a promotion to the position of department manager last month.",
      "Her promotion to department manager took place last month.",
    ],
    vocab: [
      { word: "promotion", meaningVi: "sự thăng chức", example: "He was thrilled about his recent promotion to team leader." },
      { word: "appoint someone to a position", meaningVi: "bổ nhiệm ai đó vào một vị trí", example: "The board appointed her to the position of chief editor." },
      { word: "career advancement", meaningVi: "sự thăng tiến trong sự nghiệp", example: "Further training can open up opportunities for career advancement." },
      { word: "take up a position", meaningVi: "nhận một chức vụ", example: "He will take up a new position at the branch office next week." },
    ],
  },
  "tr-36": {
    paraphrases: [
      "Nowadays, children devote more time to using electronic gadgets.",
      "More time is being spent on electronic devices by today's children.",
      "Compared to before, children now spend a greater amount of time using electronic devices.",
    ],
    vocab: [
      { word: "electronic gadgets", meaningVi: "thiết bị điện tử", example: "Many parents worry about how much their kids rely on electronic gadgets." },
      { word: "screen time", meaningVi: "thời gian nhìn màn hình", example: "Experts suggest limiting a child's screen time to two hours a day." },
      { word: "devote time to", meaningVi: "dành thời gian cho", example: "She devotes most of her free time to reading novels." },
      { word: "excessive use", meaningVi: "việc sử dụng quá mức", example: "Excessive use of smartphones can affect sleep quality." },
    ],
  },
  "tr-37": {
    paraphrases: [
      "Our departure is scheduled for seven o'clock tomorrow morning.",
      "We are leaving at seven a.m. tomorrow.",
      "Tomorrow morning, we will set off at seven o'clock.",
    ],
    vocab: [
      { word: "set off", meaningVi: "khởi hành, lên đường", example: "The hikers set off at dawn to reach the summit before noon." },
      { word: "departure time", meaningVi: "giờ khởi hành", example: "Please check the departure time before heading to the airport." },
      { word: "be scheduled to do something", meaningVi: "được lên lịch để làm gì", example: "The flight is scheduled to take off at nine in the evening." },
      { word: "head off", meaningVi: "khởi hành, lên đường đi", example: "We should head off early to avoid the traffic." },
    ],
  },
  "tr-38": {
    paraphrases: [
      "On average, the nightly news broadcast runs for around thirty minutes.",
      "It typically takes about half an hour to get through the evening news program.",
      "The nightly news show generally goes on for roughly thirty minutes.",
    ],
    vocab: [
      { word: "broadcast", meaningVi: "chương trình phát sóng", example: "The evening broadcast covers both local and international news." },
      { word: "last", meaningVi: "kéo dài", example: "The meeting lasted for over two hours." },
      { word: "approximately", meaningVi: "khoảng, xấp xỉ", example: "The flight takes approximately three hours." },
      { word: "nightly", meaningVi: "diễn ra hàng đêm, mỗi tối", example: "She watches the nightly news before going to bed." },
    ],
  },
  "tr-39": {
    paraphrases: [
      "Every morning, my younger brother is taken to school by my father.",
      "My father usually gives my younger brother a ride to school each morning.",
      "Each morning, my father drops my younger brother off at school.",
    ],
    vocab: [
      { word: "drop someone off", meaningVi: "đưa/thả ai đó xuống ở một nơi", example: "Could you drop me off at the bus station on your way to work?" },
      { word: "give someone a ride", meaningVi: "chở ai đó đi bằng xe", example: "My neighbor gave me a ride to the airport last weekend." },
      { word: "on a regular basis", meaningVi: "thường xuyên, đều đặn", example: "He visits his grandparents on a regular basis." },
      { word: "commute", meaningVi: "đi lại thường xuyên giữa hai nơi", example: "Many employees commute over an hour to get to the city center." },
    ],
  },
  "tr-40": {
    paraphrases: [
      "The supermarket close to my home frequently offers discounts at weekends.",
      "On weekends, prices are often reduced at the supermarket near my house.",
      "The nearby supermarket regularly runs promotions on weekends.",
    ],
    vocab: [
      { word: "offer a discount", meaningVi: "giảm giá, đưa ra mức giảm giá", example: "The store is offering a twenty percent discount on all shoes this week." },
      { word: "promotion", meaningVi: "chương trình khuyến mãi", example: "The shop is running a special promotion for new customers." },
      { word: "reduce prices", meaningVi: "giảm giá, hạ giá", example: "Many shops reduce prices right before the holiday season." },
      { word: "regularly", meaningVi: "thường xuyên, đều đặn", example: "She regularly checks the store's website for new deals." },
    ],
  },
  "tr-41": {
    paraphrases: [
      "Wearing a uniform every day is compulsory for students at my school.",
      "My school requires students to wear a uniform on a daily basis.",
      "Students at my school are required to be in uniform every day.",
    ],
    vocab: [
      { word: "compulsory", meaningVi: "bắt buộc", example: "Attendance at the morning assembly is compulsory for all students." },
      { word: "on a daily basis", meaningVi: "hàng ngày", example: "The gym is used on a daily basis by many local residents." },
      { word: "dress code", meaningVi: "quy định trang phục", example: "The company has a strict dress code for employees." },
      { word: "be required to", meaningVi: "bị/được yêu cầu phải", example: "Visitors are required to sign in at the front desk." },
    ],
  },
  "tr-42": {
    paraphrases: [
      "Nowadays, plastic bags have been replaced by cloth bags in many households.",
      "A growing number of families today opt for cloth bags rather than plastic ones.",
      "Many households currently prefer using cloth bags to plastic ones.",
    ],
    vocab: [
      { word: "opt for", meaningVi: "lựa chọn", example: "More consumers are opting for eco-friendly products these days." },
      { word: "household", meaningVi: "hộ gia đình", example: "Recycling has become common practice in many households." },
      { word: "eco-friendly", meaningVi: "thân thiện với môi trường", example: "The company switched to eco-friendly packaging last year." },
      { word: "replace...with", meaningVi: "thay thế bằng", example: "The government plans to replace old buses with electric ones." },
    ],
  },
  "tr-43": {
    paraphrases: [
      "Most children nowadays are capable of using a smartphone from a very young age.",
      "The majority of children today learn how to operate a smartphone at an early age.",
      "Children today typically become familiar with smartphones while still very young.",
    ],
    vocab: [
      { word: "at an early age", meaningVi: "từ khi còn nhỏ", example: "She started learning the piano at an early age." },
      { word: "be capable of", meaningVi: "có khả năng", example: "Modern computers are capable of performing billions of calculations per second." },
      { word: "the majority of", meaningVi: "phần lớn", example: "The majority of students passed the final exam." },
      { word: "become familiar with", meaningVi: "trở nên quen thuộc với", example: "New employees need time to become familiar with company procedures." },
    ],
  },
  "tr-44": {
    paraphrases: [
      "Consuming excessive amounts of sugary food has a harmful effect on children's teeth.",
      "Children's dental health can be negatively affected by eating too much sugar.",
      "If children eat too much sugar, their teeth are likely to suffer.",
    ],
    vocab: [
      { word: "dental health", meaningVi: "sức khỏe răng miệng", example: "Regular brushing is essential for good dental health." },
      { word: "excessive intake", meaningVi: "tiêu thụ quá mức", example: "Excessive intake of salt can raise blood pressure." },
      { word: "harmful effect", meaningVi: "tác động có hại", example: "Air pollution has a harmful effect on public health." },
      { word: "tooth decay", meaningVi: "sâu răng", example: "Sugary drinks are a major cause of tooth decay in children." },
    ],
  },
  "tr-45": {
    paraphrases: [
      "She has recently been hired by a foreign company.",
      "She has recently started working for a foreign company.",
      "A foreign company has recently offered her a new position.",
    ],
    vocab: [
      { word: "be hired by", meaningVi: "được thuê bởi", example: "He was hired by a multinational corporation last month." },
      { word: "employment", meaningVi: "việc làm", example: "Finding stable employment is a priority for many graduates." },
      { word: "multinational company", meaningVi: "công ty đa quốc gia", example: "Multinational companies often offer competitive salaries." },
      { word: "career opportunity", meaningVi: "cơ hội nghề nghiệp", example: "Moving abroad gave her a valuable career opportunity." },
    ],
  },
  "tr-46": {
    paraphrases: [
      "Nowadays, a large number of young people enjoy participating in volunteer work at weekends.",
      "Taking part in volunteer activities on weekends has become popular among young people today.",
      "Many young people today choose to spend their weekends volunteering.",
    ],
    vocab: [
      { word: "take part in", meaningVi: "tham gia", example: "Students are encouraged to take part in extracurricular activities." },
      { word: "volunteer work", meaningVi: "công việc tình nguyện", example: "She has done volunteer work at a local shelter for years." },
      { word: "spend time doing something", meaningVi: "dành thời gian làm gì", example: "He spends most evenings doing homework." },
      { word: "community service", meaningVi: "hoạt động cộng đồng", example: "Community service is a graduation requirement at some schools." },
    ],
  },
  "tr-47": {
    paraphrases: [
      "My family is planning to take a trip to Đà Lạt this summer holiday.",
      "This summer, my family intends to visit Đà Lạt.",
      "We are planning a family trip to Đà Lạt during the summer holiday.",
    ],
    vocab: [
      { word: "take a trip", meaningVi: "đi chuyến đi", example: "We took a trip to the countryside last weekend." },
      { word: "plan to do something", meaningVi: "dự định làm gì", example: "They plan to renovate their house next year." },
      { word: "go on holiday", meaningVi: "đi nghỉ", example: "Many families go on holiday during the summer break." },
      { word: "destination", meaningVi: "điểm đến", example: "Đà Lạt is a popular destination for tourists seeking cool weather." },
    ],
  },
  "tr-48": {
    paraphrases: [
      "Checking my phone for the latest news is something I do almost every morning.",
      "My mornings usually start with catching up on the news on my phone.",
      "It has become a habit of mine to browse the news on my phone first thing in the morning.",
    ],
    vocab: [
      { word: "catch up on something", meaningVi: "cập nhật, đọc bù thông tin đã bỏ lỡ", example: "I like to catch up on the news over breakfast every day." },
      { word: "browse", meaningVi: "lướt xem, đọc lướt qua", example: "She browses the news headlines on her phone during her morning commute." },
      { word: "habit", meaningVi: "thói quen", example: "Reading the news first thing in the morning has become a habit for him." },
      { word: "first thing in the morning", meaningVi: "việc đầu tiên làm vào buổi sáng", example: "I check my messages first thing in the morning before getting out of bed." },
    ],
  },
  "tr-49": {
    paraphrases: [
      "My academic achievements have made my parents extremely proud.",
      "My parents take great pride in what I have achieved academically.",
      "My academic success has given my parents a great deal of pride.",
    ],
    vocab: [
      { word: "take pride in", meaningVi: "tự hào về", example: "She takes pride in her ability to solve difficult problems." },
      { word: "academic achievement", meaningVi: "thành tích học tập", example: "His academic achievements earned him a scholarship." },
      { word: "accomplishment", meaningVi: "thành tựu", example: "Graduating with honors was a major accomplishment for her." },
      { word: "excel academically", meaningVi: "học xuất sắc", example: "He has always excelled academically since childhood." },
    ],
  },
  "tr-50": {
    paraphrases: [
      "This month saw a slight decrease in the price of petrol.",
      "There was a minor decline in petrol prices this month.",
      "Petrol has become slightly cheaper this month.",
    ],
    vocab: [
      { word: "decline", meaningVi: "sự sụt giảm, sự đi xuống", example: "There was a slight decline in oil prices last quarter." },
      { word: "slight", meaningVi: "nhẹ, không đáng kể", example: "The report noted a slight rise in unemployment." },
      { word: "petrol", meaningVi: "xăng (cách gọi của Anh-Anh)", example: "Petrol prices in the UK rose sharply last year." },
      { word: "fluctuate", meaningVi: "dao động, biến động lên xuống", example: "Fuel prices tend to fluctuate depending on global oil supply." },
    ],
  },
  "tr-51": {
    paraphrases: [
      "It would be beneficial for students to read books on a daily basis in order to broaden their vocabulary.",
      "Reading books daily is something students should do so as to build up their word bank.",
      "To enrich their vocabulary, students ought to make a habit of reading books every day.",
    ],
    vocab: [
      { word: "expand one's vocabulary", meaningVi: "mở rộng vốn từ vựng", example: "Watching English films is another effective way to expand your vocabulary." },
      { word: "on a daily basis", meaningVi: "hàng ngày, mỗi ngày", example: "She practises speaking English on a daily basis to improve fluency." },
      { word: "enrich", meaningVi: "làm phong phú, làm giàu thêm", example: "Travelling abroad can enrich a person's understanding of other cultures." },
      { word: "word bank", meaningVi: "vốn từ, kho từ vựng", example: "Keeping a notebook of new words helps learners build a wider word bank." },
    ],
  },
  "tr-52": {
    paraphrases: [
      "To improve air quality, my father plants numerous trees around the garden.",
      "My father grows plenty of trees in the garden so that the air stays fresher.",
      "My father regularly plants a large number of trees in the garden, which helps keep the air clean.",
    ],
    vocab: [
      { word: "plant (trees)", meaningVi: "trồng (cây)", example: "Volunteers plant hundreds of trees every spring to restore the forest." },
      { word: "improve air quality", meaningVi: "cải thiện chất lượng không khí", example: "The city introduced new bus routes to improve air quality downtown." },
      { word: "fresher", meaningVi: "trong lành hơn, tươi mát hơn", example: "After the rain, the air outside felt much fresher." },
      { word: "a large number of", meaningVi: "một số lượng lớn", example: "A large number of students attended the seminar on environmental protection." },
    ],
  },
  "tr-53": {
    paraphrases: [
      "Compared to my old phone, my new one performs significantly faster.",
      "My old phone is far slower than the new one I now have.",
      "There is a considerable difference in speed between my new phone and my previous one, with the new one outperforming it.",
    ],
    vocab: [
      { word: "significantly", meaningVi: "đáng kể, rõ rệt", example: "The new software runs significantly faster than the previous version." },
      { word: "outperform", meaningVi: "vượt trội hơn, hoạt động tốt hơn", example: "This laptop outperforms most models in its price range." },
      { word: "compared to", meaningVi: "so với", example: "Compared to last year, sales have increased dramatically." },
      { word: "considerable", meaningVi: "đáng kể, lớn", example: "There has been a considerable improvement in the city's public transport." },
    ],
  },
  "tr-54": {
    paraphrases: [
      "In order to maintain good health, he consumes a large amount of green vegetables.",
      "Green vegetables make up a significant part of his diet, which helps him remain in good shape.",
      "To keep himself fit, he regularly consumes plenty of leafy greens.",
    ],
    vocab: [
      { word: "consume", meaningVi: "tiêu thụ, ăn/uống", example: "Experts recommend that people consume less sugar and salt." },
      { word: "maintain good health", meaningVi: "duy trì sức khỏe tốt", example: "Regular exercise is essential to maintain good health." },
      { word: "a balanced diet", meaningVi: "chế độ ăn cân bằng", example: "A balanced diet should include plenty of fruit and vegetables." },
      { word: "nutrient-rich", meaningVi: "giàu dinh dưỡng", example: "Leafy greens are nutrient-rich foods that boost the immune system." },
    ],
  },
  "tr-55": {
    paraphrases: [
      "Instead of following their genuine passion, a lot of students select their major according to career prospects.",
      "Job prospects, rather than personal interest, are what drive many students' choice of major.",
      "Many students base their choice of major on employment opportunities instead of what they are truly passionate about.",
    ],
    vocab: [
      { word: "job prospects", meaningVi: "triển vọng nghề nghiệp", example: "Studying engineering is popular partly because of its strong job prospects." },
      { word: "major", meaningVi: "chuyên ngành học", example: "She decided to change her major from economics to psychology." },
      { word: "genuine passion", meaningVi: "đam mê thực sự", example: "Few people are lucky enough to turn their genuine passion into a career." },
      { word: "employment opportunities", meaningVi: "cơ hội việc làm", example: "The new factory has created hundreds of employment opportunities in the area." },
    ],
  },
  "tr-56": {
    paraphrases: [
      "Agriculture in this region has suffered serious damage as a result of desertification.",
      "The spread of desertification has severely harmed farming activities in this area.",
      "This region's agricultural sector has been seriously affected by the process of desertification.",
    ],
    vocab: [
      { word: "desertification", meaningVi: "hiện tượng sa mạc hóa", example: "Desertification is becoming a major environmental issue in many arid countries." },
      { word: "agricultural sector", meaningVi: "ngành nông nghiệp", example: "The agricultural sector employs a large proportion of the country's workforce." },
      { word: "severely harm", meaningVi: "gây hại nghiêm trọng", example: "Pollution has severely harmed marine ecosystems in coastal areas." },
      { word: "arable land", meaningVi: "đất canh tác", example: "The amount of arable land has shrunk due to rapid urbanisation." },
    ],
  },
  "tr-57": {
    paraphrases: [
      "Children's reading habits are being affected by their exposure to smartphones at such an early age.",
      "The early use of smartphones is having an impact on how often children read.",
      "Because children start using smartphones from such a young age, their reading habits are changing.",
    ],
    vocab: [
      { word: "affect (v)", meaningVi: "ảnh hưởng đến, tác động đến", example: "Lack of sleep can affect a student's academic performance." },
      { word: "reading habit (n)", meaningVi: "thói quen đọc sách", example: "Parents often try to build good reading habits in their children." },
      { word: "from a young age", meaningVi: "từ khi còn nhỏ", example: "She was taught to play the piano from a young age." },
      { word: "have an impact on", meaningVi: "có tác động/ảnh hưởng đến", example: "Excessive screen time can have an impact on children's sleep quality." },
    ],
  },
  "tr-58": {
    paraphrases: [
      "People who frequently skip breakfast often find it hard to concentrate during the morning.",
      "Failing to eat breakfast on a regular basis can impair one's ability to focus in the morning.",
      "If breakfast is skipped regularly, concentration levels in the morning tend to drop.",
    ],
    vocab: [
      { word: "skip breakfast", meaningVi: "bỏ bữa sáng", example: "Many office workers skip breakfast because they are in a hurry." },
      { word: "concentrate", meaningVi: "tập trung", example: "It is hard to concentrate on studying when you are hungry." },
      { word: "impair", meaningVi: "làm suy giảm, gây tổn hại", example: "Lack of sleep can impair a person's memory and judgement." },
      { word: "on a regular basis", meaningVi: "một cách thường xuyên, đều đặn", example: "He exercises on a regular basis to stay in shape." },
    ],
  },
  "tr-59": {
    paraphrases: [
      "An increasing number of employers are requiring job candidates to complete a personality test prior to being interviewed.",
      "Candidates are increasingly being asked by employers to sit a personality test before their interview.",
      "It has become increasingly common for employers to require a personality test from candidates before interviewing them.",
    ],
    vocab: [
      { word: "candidate", meaningVi: "ứng viên", example: "Only three candidates were shortlisted for the final round of interviews." },
      { word: "personality test", meaningVi: "bài kiểm tra tính cách", example: "The company uses a personality test to assess how well applicants fit the team." },
      { word: "prior to", meaningVi: "trước khi", example: "Applicants must submit their documents prior to the deadline." },
      { word: "an increasing number of", meaningVi: "ngày càng nhiều", example: "An increasing number of companies now offer remote working options." },
    ],
  },
  "tr-60": {
    paraphrases: [
      "As the urban population grows rapidly, housing prices are rising and living space is becoming ever more cramped.",
      "Housing prices are being pushed up and living space is growing more limited due to the rapid increase in urban population.",
      "The fast growth of city populations is causing housing costs to soar while available living space shrinks.",
    ],
    vocab: [
      { word: "urban population", meaningVi: "dân số đô thị", example: "The urban population has more than doubled over the past two decades." },
      { word: "drive up", meaningVi: "đẩy (giá) lên cao", example: "High demand for apartments has driven up rental prices in the city centre." },
      { word: "cramped", meaningVi: "chật chội", example: "Many families in the city live in cramped apartments with little natural light." },
      { word: "soar", meaningVi: "tăng vọt", example: "Property prices have soared in the last few years due to limited supply." },
    ],
  },
  "tr-61": {
    paraphrases: [
      "Thanks to the rise of budget airlines, a great number of people have been able to travel overseas.",
      "Many people have been given the chance to go abroad as a result of the emergence of low-cost carriers.",
      "The rise of budget airlines has opened up opportunities for many people to travel overseas.",
    ],
    vocab: [
      { word: "budget airline / low-cost carrier", meaningVi: "hãng hàng không giá rẻ", example: "Budget airlines have made international travel more affordable than ever before." },
      { word: "emergence", meaningVi: "sự xuất hiện, sự nổi lên", example: "The emergence of smartphones has changed the way people communicate." },
      { word: "travel abroad / go overseas", meaningVi: "đi du lịch nước ngoài", example: "She saved money for years so she could travel abroad after graduation." },
      { word: "opportunity", meaningVi: "cơ hội", example: "This scholarship gives students the opportunity to study in another country." },
    ],
  },
  "tr-62": {
    paraphrases: [
      "A great deal of money is now spent by many brands on promoting their products through social media influencers.",
      "Nowadays, many companies invest heavily in influencer marketing to advertise their products on social media.",
      "Huge sums of money are being spent by numerous brands today to market their products via social media celebrities.",
    ],
    vocab: [
      { word: "influencer", meaningVi: "người có ảnh hưởng trên mạng xã hội", example: "Many teenagers are influenced by the products that famous influencers recommend online." },
      { word: "promote", meaningVi: "quảng cáo, quảng bá", example: "The company hired a marketing team to promote its new product." },
      { word: "a great deal of", meaningVi: "một lượng lớn", example: "Building a successful business requires a great deal of effort and patience." },
      { word: "invest in", meaningVi: "đầu tư vào", example: "More companies are choosing to invest in digital marketing rather than traditional advertising." },
    ],
  },
  "tr-63": {
    paraphrases: [
      "My mother never fails to prepare a lavish meal whenever we have guests visiting.",
      "A lavish meal is always prepared by my mother whenever guests come to our house.",
      "Every time visitors drop by, a sumptuous meal is cooked by my mother.",
    ],
    vocab: [
      { word: "lavish / sumptuous", meaningVi: "thịnh soạn, xa hoa", example: "They held a lavish party to celebrate their wedding anniversary." },
      { word: "prepare a meal", meaningVi: "chuẩn bị bữa ăn", example: "It usually takes her an hour to prepare a meal for the whole family." },
      { word: "whenever", meaningVi: "mỗi khi", example: "Whenever I feel stressed, I like to go for a walk." },
      { word: "guest / visitor", meaningVi: "khách", example: "The hotel offers free breakfast to all guests." },
    ],
  },
  "tr-64": {
    paraphrases: [
      "Many people have been forced to postpone their future savings plans due to rising inflation.",
      "Because inflation has been rising sharply, a lot of people have had to put off their plans to save money for the future.",
      "The sharp rise in inflation has led many people to delay their savings plans for the future.",
    ],
    vocab: [
      { word: "inflation", meaningVi: "lạm phát", example: "High inflation has caused the prices of basic goods to increase significantly." },
      { word: "postpone / delay / put off", meaningVi: "trì hoãn", example: "The meeting has been postponed until next week due to bad weather." },
      { word: "savings plan", meaningVi: "kế hoạch tiết kiệm", example: "He created a savings plan to buy a house within five years." },
      { word: "force somebody to do something", meaningVi: "buộc ai đó phải làm gì", example: "The heavy rain forced the organizers to cancel the outdoor event." },
    ],
  },
  "tr-65": {
    paraphrases: [
      "Some students dislike studying in groups.",
      "A number of students do not find group study enjoyable.",
      "Not all students find studying in groups enjoyable.",
    ],
    vocab: [
      { word: "enjoy studying in groups", meaningVi: "thích học theo nhóm", example: "Not every student enjoys studying in groups." },
      { word: "not every", meaningVi: "không phải mọi/mỗi... đều (phủ định một phần)", example: "Not every employee agrees with the new policy." },
      { word: "dislike", meaningVi: "không thích, ghét", example: "Some students dislike studying in groups." },
      { word: "group study", meaningVi: "việc học theo nhóm", example: "Group study can help students share ideas and solve problems together." },
    ],
  },
  "tr-66": {
    paraphrases: [
      "The habitats of many wildlife species have been destroyed as a result of indiscriminate deforestation.",
      "Reckless deforestation has led to the destruction of habitats for numerous wild animal species.",
      "Many wild species have lost their natural habitats due to uncontrolled logging and deforestation.",
    ],
    vocab: [
      { word: "deforestation", meaningVi: "nạn phá rừng", example: "Deforestation is one of the leading causes of climate change." },
      { word: "habitat", meaningVi: "môi trường sống", example: "Pollution has severely damaged the natural habitat of many marine creatures." },
      { word: "wildlife / wild species", meaningVi: "động vật hoang dã", example: "The national park was established to protect local wildlife." },
      { word: "indiscriminate / reckless", meaningVi: "bừa bãi, không kiểm soát", example: "Indiscriminate use of pesticides can harm beneficial insects as well as pests." },
    ],
  },
  "tr-67": {
    paraphrases: [
      "Translation apps have made it much easier to communicate with foreigners.",
      "Communication with foreigners has been made much easier by the use of translation apps.",
      "With the help of translation applications, people now find it far easier to interact with foreigners.",
    ],
    vocab: [
      { word: "translation app", meaningVi: "ứng dụng dịch thuật", example: "She used a translation app to order food while traveling in Japan." },
      { word: "communicate with", meaningVi: "giao tiếp với", example: "Good communication skills are essential in the workplace." },
      { word: "foreigner", meaningVi: "người nước ngoài", example: "The city attracts many foreigners who come to study or work." },
      { word: "interact with", meaningVi: "tương tác với", example: "Children learn social skills by interacting with their peers." },
    ],
  },
  "tr-68": {
    paraphrases: [
      "Obesity in children is mainly caused by an unbalanced diet.",
      "One of the leading causes of childhood obesity is an unhealthy, unbalanced diet.",
      "Children who follow an unbalanced diet are more likely to become obese.",
    ],
    vocab: [
      { word: "unbalanced diet", meaningVi: "chế độ ăn thiếu cân bằng", example: "An unbalanced diet high in sugar can lead to various health problems." },
      { word: "obesity", meaningVi: "bệnh béo phì", example: "Obesity rates have increased significantly over the past two decades." },
      { word: "childhood obesity", meaningVi: "béo phì ở trẻ em", example: "Childhood obesity has become a serious public health issue in many countries." },
      { word: "cause", meaningVi: "nguyên nhân, gây ra", example: "Lack of exercise is another major cause of weight gain." },
    ],
  },
  "tr-69": {
    paraphrases: [
      "For only a marginally higher salary, many young workers are ready to leave their current jobs.",
      "It takes only a modest pay rise to persuade plenty of young employees to switch employers.",
      "Even a slight increase in pay is often enough to make young staff members jump ship.",
    ],
    vocab: [
      { word: "jump ship", meaningVi: "rời bỏ công việc hoặc tổ chức hiện tại (thường khá đột ngột) để chuyển sang nơi khác có lợi hơn", example: "As soon as a competitor offered better pay, several employees decided to jump ship." },
      { word: "pay rise", meaningVi: "sự tăng lương", example: "Even a small pay rise can be enough to stop talented staff from resigning." },
      { word: "persuade somebody to do something", meaningVi: "thuyết phục ai đó làm điều gì", example: "A generous bonus scheme can persuade employees to stay longer with a company." },
      { word: "marginal", meaningVi: "chỉ ở mức nhỏ, không đáng kể", example: "The salary difference between the two job offers was only marginal." },
    ],
  },
  "tr-70": {
    paraphrases: [
      "Experiences are valued more highly than material possessions by many young people today.",
      "Nowadays, a lot of young people place greater importance on experiences than on owning material things.",
      "Rather than accumulating material possessions, many young people today choose to spend money on experiences.",
    ],
    vocab: [
      { word: "prioritize", meaningVi: "ưu tiên", example: "It is important to prioritize your health over your career." },
      { word: "material possessions", meaningVi: "của cải vật chất", example: "True happiness does not always come from material possessions." },
      { word: "experience", meaningVi: "trải nghiệm", example: "Traveling gives you experiences that money cannot buy." },
      { word: "value", meaningVi: "coi trọng, đánh giá cao", example: "Many people value spending time with family more than earning more money." },
    ],
  },
  "tr-71": {
    paraphrases: [
      "As I travel more, it becomes increasingly apparent to me how enormous the world truly is.",
      "Traveling extensively has made me realize just how immense the world actually is.",
      "The extent of the world's vastness only becomes clear to me the more I travel.",
    ],
    vocab: [
      { word: "vast", meaningVi: "rộng lớn, bao la", example: "The desert stretched out, vast and empty, for hundreds of miles." },
      { word: "broaden one's horizons", meaningVi: "mở mang tầm nhìn", example: "Studying abroad helped her broaden her horizons and understand different cultures." },
      { word: "immense", meaningVi: "to lớn, mênh mông", example: "The immense scale of the universe is difficult for humans to comprehend." },
      { word: "come to realize", meaningVi: "dần nhận ra", example: "After years of research, scientists came to realize that the theory was flawed." },
    ],
  },
  "tr-72": {
    paraphrases: [
      "A lot of people skim through headlines but rarely take the time to examine what lies beneath them.",
      "Instead of digging deeper into the content, many readers stop at the headline alone.",
      "Rather than examining the substance of an article, a great many people settle for merely glancing at its headline.",
    ],
    vocab: [
      { word: "skim through", meaningVi: "đọc lướt qua", example: "He only skimmed through the report before the meeting." },
      { word: "delve into", meaningVi: "đào sâu, tìm hiểu kỹ", example: "The documentary delves into the causes of climate change." },
      { word: "superficial", meaningVi: "hời hợt, bề ngoài", example: "Her knowledge of the subject is rather superficial." },
      { word: "headline", meaningVi: "tiêu đề (báo)", example: "The scandal made headlines across the country." },
    ],
  },
  "tr-73": {
    paraphrases: [
      "Because my grandparents look after the kids, my parents are able to work all day without worrying.",
      "My parents can devote themselves to work all day long since their children are well looked after by their grandparents.",
      "If it weren't for my grandparents taking care of the children, my parents wouldn't be able to focus on work with such ease.",
    ],
    vocab: [
      { word: "look after", meaningVi: "chăm sóc, trông nom", example: "She looks after her younger siblings while her parents are away." },
      { word: "peace of mind", meaningVi: "sự yên tâm, thanh thản", example: "Having insurance gives people peace of mind." },
      { word: "rely on", meaningVi: "dựa vào, nhờ cậy", example: "Many working parents rely on relatives to help with childcare." },
      { word: "devote oneself to", meaningVi: "cống hiến, dồn tâm sức cho", example: "He devoted himself entirely to his career after graduation." },
    ],
  },
  "tr-74": {
    paraphrases: [
      "An increasing number of small enterprises are turning to e-commerce as a way of reducing their premises expenses.",
      "To lower the cost of renting physical space, small businesses are increasingly shifting their operations online.",
      "Small businesses are moving their sales online at a growing rate, largely to avoid the burden of rental expenses.",
    ],
    vocab: [
      { word: "e-commerce", meaningVi: "thương mại điện tử", example: "E-commerce has grown rapidly over the past decade." },
      { word: "cut down on", meaningVi: "cắt giảm", example: "The company is trying to cut down on unnecessary expenses." },
      { word: "overhead costs", meaningVi: "chi phí vận hành cố định (thuê mặt bằng...)", example: "Overhead costs such as rent and utilities can be a huge burden for small firms." },
      { word: "shift towards", meaningVi: "chuyển hướng sang", example: "Many industries are shifting towards renewable energy." },
    ],
  },
  "tr-75": {
    paraphrases: [
      "When allowed to decide how they approach their lessons, certain students perform considerably better.",
      "Being given autonomy over how they study can significantly improve the performance of some students.",
      "Some students achieve much greater results if they are permitted to determine their own method of learning.",
    ],
    vocab: [
      { word: "autonomy", meaningVi: "quyền tự chủ", example: "Giving employees more autonomy often boosts their motivation." },
      { word: "tailor", meaningVi: "điều chỉnh cho phù hợp", example: "Teachers should tailor their lessons to suit different learning styles." },
      { word: "significantly", meaningVi: "đáng kể", example: "Test scores improved significantly after the new curriculum was introduced." },
      { word: "perform", meaningVi: "thể hiện, đạt kết quả", example: "Students tend to perform better in a supportive environment." },
    ],
  },
  "tr-76": {
    paraphrases: [
      "Recycling would become far simpler if households separated their rubbish before disposal.",
      "Were people to sort their trash prior to throwing it out, the recycling process would be considerably easier.",
      "Sorting waste before disposal would greatly simplify the process of recycling.",
    ],
    vocab: [
      { word: "dispose of", meaningVi: "vứt bỏ, xử lý (rác)", example: "Please dispose of hazardous waste properly." },
      { word: "sort", meaningVi: "phân loại", example: "The factory sorts recyclable materials from general waste." },
      { word: "simplify", meaningVi: "đơn giản hóa", example: "New technology has simplified the recycling process." },
      { word: "prior to", meaningVi: "trước khi", example: "Waste should be cleaned prior to recycling." },
    ],
  },
  "tr-77": {
    paraphrases: [
      "This app for learning languages has been built to be user-friendly enough for complete beginners.",
      "The design of this language-learning app ensures that it is accessible even to those who are just starting out.",
      "Even people with no prior experience can navigate this language-learning app effortlessly, thanks to its user-centered design.",
    ],
    vocab: [
      { word: "user-friendly", meaningVi: "dễ sử dụng, thân thiện với người dùng", example: "The new software has a user-friendly interface." },
      { word: "accessible", meaningVi: "dễ tiếp cận", example: "The course materials are accessible to students of all levels." },
      { word: "novice", meaningVi: "người mới bắt đầu", example: "The workshop is designed for novices with no prior coding experience." },
      { word: "navigate", meaningVi: "sử dụng, điều hướng (một hệ thống)", example: "It took me a while to learn how to navigate the new system." },
    ],
  },
  "tr-78": {
    paraphrases: [
      "Having once placed great emphasis on rote memorization, the education system is now gradually moving toward prioritizing the practical use of knowledge.",
      "The education system used to focus heavily on rote learning, but it is now steadily shifting its focus to how knowledge can be applied in real life.",
      "Practical application of knowledge is increasingly being valued by an education system that once prioritized rote memorization.",
    ],
    vocab: [
      { word: "rote memorization", meaningVi: "học thuộc lòng máy móc", example: "Critics argue that rote memorization does little to develop critical thinking." },
      { word: "prioritize", meaningVi: "ưu tiên, coi trọng", example: "Modern curricula prioritize problem-solving skills over pure memorization." },
      { word: "practical application", meaningVi: "ứng dụng thực tế", example: "Students benefit more from the practical application of theories than from lectures alone." },
      { word: "shift toward", meaningVi: "chuyển hướng sang", example: "There has been a noticeable shift toward student-centered teaching methods." },
    ],
  },
  "tr-79": {
    paraphrases: [
      "Forests are being cleared at such an alarming rate that numerous wildlife species could face extinction in the coming decades.",
      "Because deforestation is advancing so rapidly, a great many animal species may vanish from the earth within a matter of decades.",
      "The rapid pace of deforestation is pushing countless wildlife species toward the brink of extinction in just a few decades.",
    ],
    vocab: [
      { word: "deforestation", meaningVi: "nạn phá rừng", example: "Deforestation is one of the leading causes of biodiversity loss." },
      { word: "endangered species", meaningVi: "loài có nguy cơ tuyệt chủng", example: "Several endangered species live in this national park." },
      { word: "at an alarming rate", meaningVi: "với tốc độ đáng báo động", example: "Ice caps are melting at an alarming rate due to global warming." },
      { word: "on the brink of extinction", meaningVi: "trên bờ vực tuyệt chủng", example: "The species is now on the brink of extinction due to habitat loss." },
    ],
  },
  "tr-80": {
    paraphrases: [
      "The widespread use of facial recognition technology in public areas has sparked worries about citizens being monitored excessively.",
      "As facial recognition systems become increasingly common in public places, many people worry that citizens are being subjected to excessive surveillance.",
      "Concerns over excessive surveillance have grown as facial recognition technology is increasingly rolled out across public spaces.",
    ],
    vocab: [
      { word: "surveillance", meaningVi: "sự giám sát", example: "The government increased surveillance in high-crime areas." },
      { word: "deploy", meaningVi: "triển khai", example: "New security cameras have been deployed throughout the city." },
      { word: "invasion of privacy", meaningVi: "xâm phạm quyền riêng tư", example: "Critics see the new law as an invasion of privacy." },
      { word: "widespread", meaningVi: "rộng rãi, phổ biến", example: "There is widespread support for stricter data protection laws." },
    ],
  },
  "tr-81": {
    paraphrases: [
      "Research has shown that consuming greater amounts of processed food correlates with an increased likelihood of chronic disease.",
      "A clear link has been found between eating large quantities of processed food and a heightened risk of chronic illness.",
      "The more processed food a person eats, the more likely they are to develop long-term health conditions.",
    ],
    vocab: [
      { word: "processed food", meaningVi: "thực phẩm chế biến sẵn", example: "Doctors advise limiting processed food to protect long-term health." },
      { word: "chronic illness", meaningVi: "bệnh mãn tính", example: "Chronic illness rates have climbed steadily in industrialized nations." },
      { word: "correlate with", meaningVi: "có mối liên hệ với", example: "Poor sleep quality often correlates with reduced productivity at work." },
      { word: "risk factor", meaningVi: "yếu tố nguy cơ", example: "Smoking remains one of the most significant risk factors for heart disease." },
    ],
  },
  "tr-82": {
    paraphrases: [
      "Even though flexible working arrangements have been adopted by numerous companies, employee burnout continues unabated.",
      "Despite the introduction of flexible work policies in many firms, staff are still suffering from burnout at undiminished rates.",
      "While flexible working has become common practice in many organizations, employee exhaustion remains just as severe as before.",
    ],
    vocab: [
      { word: "burnout", meaningVi: "kiệt sức vì công việc", example: "Chronic burnout can lead employees to quit their jobs altogether." },
      { word: "flexible working", meaningVi: "làm việc linh hoạt", example: "Flexible working has allowed many parents to balance career and family." },
      { word: "show no sign of easing", meaningVi: "không có dấu hiệu thuyên giảm", example: "Traffic congestion in the city shows no sign of easing despite new regulations." },
      { word: "workload", meaningVi: "khối lượng công việc", example: "An unmanageable workload is often cited as the main cause of workplace stress." },
    ],
  },
  "tr-83": {
    paraphrases: [
      "Barriers that cannot be overcome without outside help are frequently encountered by children from disadvantaged backgrounds.",
      "Growing up in a disadvantaged family often means confronting obstacles too great to surmount alone.",
      "Children from underprivileged households are often confronted with challenges beyond their own capacity to solve.",
    ],
    vocab: [
      { word: "disadvantaged", meaningVi: "thiệt thòi, khó khăn", example: "The scholarship program targets students from disadvantaged communities." },
      { word: "overcome", meaningVi: "vượt qua", example: "It took years of effort for her to overcome the setbacks of her childhood." },
      { word: "underprivileged", meaningVi: "kém may mắn, thiếu điều kiện", example: "Many charities focus on providing education to underprivileged youth." },
      { word: "socioeconomic background", meaningVi: "hoàn cảnh kinh tế xã hội", example: "A student's socioeconomic background can strongly influence their academic performance." },
    ],
  },
  "tr-84": {
    paraphrases: [
      "As tourism has surged in highland villages, numerous traditional customs have been increasingly commodified, with some once-sacred rituals now staged purely for tourists' photographs.",
      "The rapid growth of tourism in mountainous villages has led to the commercialization of many traditions, so much so that ceremonies once considered sacred are now performed as little more than photo opportunities for visitors.",
      "Traditional customs in highland villages have grown steadily more commercialized because of the tourism boom, to such an extent that some once-sacred rites now exist solely for tourist photography.",
    ],
    vocab: [
      { word: "commercialize", meaningVi: "thương mại hóa", example: "Critics argue that the festival has been commercialized beyond recognition." },
      { word: "sacred ritual", meaningVi: "nghi lễ linh thiêng", example: "Villagers worry that outsiders do not respect the sacred rituals of their community." },
      { word: "authenticity", meaningVi: "tính xác thực, nguyên bản", example: "Mass tourism can gradually strip a cultural practice of its authenticity." },
      { word: "exploit", meaningVi: "khai thác, lợi dụng", example: "Some tour operators exploit local traditions purely for commercial gain." },
    ],
  },
  "tr-85": {
    paraphrases: [
      "Algorithms on many social media platforms tend to promote controversial or emotionally charged content more widely, irrespective of its accuracy, simply because such content keeps users engaged for longer.",
      "Because it holds viewers' attention longer, content that is controversial or emotionally provocative is often amplified by social media algorithms, regardless of whether it is factually accurate.",
      "Regardless of accuracy, emotionally charged or controversial posts are frequently pushed to a wider audience by algorithms, since this content maximizes the time users spend on the platform.",
    ],
    vocab: [
      { word: "algorithm", meaningVi: "thuật toán", example: "The app's algorithm decides which posts appear at the top of the feed." },
      { word: "engagement", meaningVi: "mức độ tương tác, giữ chân người dùng", example: "Platforms measure success largely in terms of user engagement." },
      { word: "misinformation", meaningVi: "thông tin sai lệch", example: "Misinformation can spread faster online than accurate reporting." },
      { word: "amplify", meaningVi: "khuếch đại, lan truyền rộng", example: "Social media can amplify a minor incident into a global controversy." },
    ],
  },
  "tr-86": {
    paraphrases: [
      "Siblings raised in the same household can nevertheless develop such contrasting perspectives on life that reaching common ground proves challenging.",
      "Although brought up together, brothers and sisters may end up holding views on life so dissimilar that they struggle to see eye to eye.",
      "It is not uncommon for siblings from the same family to develop vastly different outlooks, making mutual understanding difficult to achieve.",
    ],
    vocab: [
      { word: "outlook on life", meaningVi: "quan điểm sống", example: "Travelling abroad completely changed her outlook on life." },
      { word: "common ground", meaningVi: "điểm chung, tiếng nói chung", example: "The two negotiators eventually found common ground on the trade deal." },
      { word: "see eye to eye", meaningVi: "đồng quan điểm", example: "The two brothers rarely see eye to eye on financial matters." },
      { word: "upbringing", meaningVi: "cách nuôi dạy", example: "His strict upbringing shaped his disciplined approach to work." },
    ],
  },
  "tr-87": {
    paraphrases: [
      "The purchasing power of low-income households has been considerably weakened by rising inflation in recent years.",
      "Over the last few years, sharp increases in inflation have severely diminished what low-income families can afford to buy.",
      "Low-income households have seen their spending power substantially reduced as a result of the inflation surge of recent years.",
    ],
    vocab: [
      { word: "purchasing power", meaningVi: "sức mua", example: "Wage growth has failed to keep pace with the decline in purchasing power." },
      { word: "erode", meaningVi: "bào mòn, làm suy giảm dần", example: "Years of stagnant wages have eroded workers' living standards." },
      { word: "inflation", meaningVi: "lạm phát", example: "The central bank raised interest rates to curb inflation." },
      { word: "cost of living", meaningVi: "chi phí sinh hoạt", example: "The rising cost of living has forced many families to cut back on spending." },
    ],
  },
  "tr-88": {
    paraphrases: [
      "Even though the curriculum has been reformed multiple times, rote memorization is still valued by many schools more than fostering independent thought.",
      "Although the curriculum has undergone numerous reforms, many schools continue to place greater emphasis on memorizing facts by rote than on nurturing students' ability to think independently.",
      "Many schools persist in favoring rote learning over developing independent thinking, notwithstanding repeated attempts to reform the curriculum.",
    ],
    vocab: [
      { word: "rote memorization", meaningVi: "học thuộc lòng, học vẹt", example: "Critics argue that rote memorization does little to develop real understanding." },
      { word: "curriculum reform", meaningVi: "cải cách chương trình học", example: "The ministry announced a curriculum reform aimed at reducing exam pressure." },
      { word: "independent thinking", meaningVi: "tư duy độc lập", example: "Universities should encourage independent thinking rather than passive learning." },
      { word: "cultivate", meaningVi: "nuôi dưỡng, phát triển", example: "Good teachers try to cultivate curiosity in their students." },
    ],
  },
  "tr-89": {
    paraphrases: [
      "If lower-level hospitals do not have sufficient modern medical equipment, patients in rural areas will keep being sent to higher-level facilities, even when their cases are relatively simple.",
      "Rural patients will continue to be transferred to higher-level hospitals for even straightforward cases unless district-level facilities are provided with adequate modern equipment.",
      "Without sufficient modern medical equipment at lower-level hospitals, people living in rural areas will keep having to be referred elsewhere for treatment, even when their conditions are not especially serious.",
    ],
    vocab: [
      { word: "refer (a patient)", meaningVi: "chuyển tuyến, giới thiệu chuyển viện", example: "The clinic had to refer the patient to a specialist hospital in the city." },
      { word: "medical equipment", meaningVi: "thiết bị y tế", example: "The donation funded new medical equipment for the district hospital." },
      { word: "rural area", meaningVi: "vùng nông thôn", example: "Access to healthcare remains limited in many rural areas." },
      { word: "healthcare facility", meaningVi: "cơ sở y tế", example: "The government plans to upgrade healthcare facilities nationwide." },
    ],
  },
  "tr-90": {
    paraphrases: [
      "Deepfake technology has advanced to such a degree that distinguishing genuine videos from fabricated ones is difficult even for experienced professionals.",
      "So advanced has deepfake technology become that telling authentic footage apart from manipulated content poses a challenge even to veteran experts.",
      "Even highly experienced specialists now struggle to differentiate between real and fake videos, given how sophisticated deepfake technology has become.",
    ],
    vocab: [
      { word: "sophisticated", meaningVi: "tinh vi", example: "The scam relied on a sophisticated network of fake websites." },
      { word: "distinguish", meaningVi: "phân biệt", example: "It can be hard to distinguish a skilled forgery from the original artwork." },
      { word: "authentic", meaningVi: "chân thực, xác thực", example: "Experts verified that the recording was authentic and unedited." },
      { word: "manipulate", meaningVi: "thao túng, chỉnh sửa", example: "Software can now manipulate images so convincingly that fakes are hard to spot." },
    ],
  },
  "tr-91": {
    paraphrases: [
      "Chronic stress, when experienced over a long period, has been proven to undermine immune function and leave the body more vulnerable to disease.",
      "Research has demonstrated that being exposed to chronic stress for extended periods weakens the body's immune defenses, increasing its susceptibility to illness.",
      "It has been shown that people who endure chronic stress for long periods develop weaker immune systems, which makes them more prone to getting sick.",
    ],
    vocab: [
      { word: "prolonged", meaningVi: "kéo dài, lâu dài", example: "Prolonged periods of inactivity can lead to muscle weakness." },
      { word: "susceptible to", meaningVi: "dễ bị, dễ mắc phải", example: "Smokers are more susceptible to respiratory infections." },
      { word: "immune system", meaningVi: "hệ miễn dịch", example: "A balanced diet helps strengthen the immune system." },
      { word: "chronic", meaningVi: "mãn tính, kéo dài", example: "Chronic sleep deprivation can affect memory and concentration." },
    ],
  },
  "tr-92": {
    paraphrases: [
      "Employees not only feel distrusted by management when their productivity is monitored through tracking software, but they also experience a marked rise in stress throughout the day.",
      "The use of tracking software to monitor productivity leaves workers feeling distrusted by their managers and substantially raises their stress levels during working hours.",
      "Being watched by productivity-tracking software makes staff feel that management doubts their integrity, while also considerably heightening their stress throughout the working day.",
    ],
    vocab: [
      { word: "surveillance", meaningVi: "giám sát, theo dõi", example: "Some companies have introduced surveillance systems to monitor employee performance." },
      { word: "distrust", meaningVi: "sự mất lòng tin, nghi ngờ", example: "Excessive rules in the office can breed distrust between staff and management." },
      { word: "productivity", meaningVi: "năng suất", example: "Flexible working hours can boost employee productivity." },
      { word: "workday", meaningVi: "ngày làm việc", example: "Many employees feel exhausted by the end of a long workday." },
    ],
  },
  "tr-93": {
    paraphrases: [
      "Despite being surrounded by millions of other people, a large number of urban residents feel such profound loneliness that it has come to be viewed as a matter of public health.",
      "Many people living in cities experience such intense feelings of isolation, even amid crowds of millions, that this phenomenon is now considered a public health concern.",
      "Loneliness among city dwellers has become so severe, despite their being surrounded by millions of others, that it is now classified as a public health problem.",
    ],
    vocab: [
      { word: "urban", meaningVi: "thuộc đô thị, thành thị", example: "Urban areas tend to have higher population density than rural regions." },
      { word: "isolation", meaningVi: "sự cô lập, cô đơn", example: "Social isolation can have serious effects on mental health." },
      { word: "dweller", meaningVi: "cư dân, người sinh sống", example: "Cave dwellers relied on natural shelters for protection." },
      { word: "public health", meaningVi: "sức khỏe cộng đồng", example: "Vaccination campaigns are an important part of public health policy." },
    ],
  },
  "tr-94": {
    paraphrases: [
      "As short-term rental platforms have proliferated in popular tourist destinations, housing rents have soared to such an extent that many local residents have had no choice but to relocate to the suburbs.",
      "Housing rents in popular tourist destinations have been pushed up so dramatically by the surge in short-term rental platforms that numerous local residents have had to move to the suburbs.",
      "The rapid growth of short-term rental platforms in sought-after tourist spots has caused rents to skyrocket, forcing many locals out into the suburbs.",
    ],
    vocab: [
      { word: "surge", meaningVi: "sự gia tăng đột biến", example: "There has been a surge in demand for eco-friendly products." },
      { word: "soar", meaningVi: "tăng vọt", example: "Property prices in the city center have soared over the past decade." },
      { word: "relocate", meaningVi: "di dời, chuyển đến nơi khác", example: "Many families have had to relocate due to rising living costs." },
      { word: "suburb", meaningVi: "vùng ngoại ô", example: "More young couples are choosing to settle in the suburbs rather than the city center." },
    ],
  },
  "tr-95": {
    paraphrases: [
      "Because of intense competition, many newsrooms are placing greater emphasis on eye-catching headlines than on careful fact-checking.",
      "Many news organizations, driven by competitive pressure, are choosing sensational headlines at the expense of rigorous fact-checking.",
      "Under mounting competitive pressure, thorough fact-checking is increasingly being sacrificed by newsrooms in favor of sensational headlines.",
    ],
    vocab: [
      { word: "sensational", meaningVi: "giật gân, gây sốc", example: "Tabloids often rely on sensational stories to attract readers." },
      { word: "prioritize", meaningVi: "ưu tiên", example: "Schools should prioritize students' mental well-being over exam results." },
      { word: "fact-checking", meaningVi: "việc kiểm chứng thông tin", example: "Rigorous fact-checking is essential to maintaining journalistic credibility." },
      { word: "at the expense of", meaningVi: "phải trả giá bằng, đánh đổi bằng", example: "Economic growth should not come at the expense of environmental protection." },
    ],
  },
  "tr-96": {
    paraphrases: [
      "Rooted in the generation gap, the contrasting approaches to raising children taken by grandparents and parents frequently leave young children puzzled by inconsistent rules at home.",
      "Because grandparents and parents adopt different child-rearing approaches as a result of the generation gap, children often find themselves confused by contradictory rules within the household.",
      "The generation gap often causes grandparents and parents to raise children in different ways, leaving youngsters bewildered by the conflicting regulations they encounter at home.",
    ],
    vocab: [
      { word: "generation gap", meaningVi: "khoảng cách thế hệ", example: "The generation gap often leads to misunderstandings between grandparents and grandchildren." },
      { word: "child-rearing", meaningVi: "việc nuôi dạy con cái", example: "Attitudes toward child-rearing have changed significantly over the decades." },
      { word: "conflicting", meaningVi: "mâu thuẫn, trái ngược nhau", example: "Employees can feel stressed when they receive conflicting instructions from different managers." },
      { word: "stem from", meaningVi: "bắt nguồn từ", example: "Many of his fears stem from a difficult childhood experience." },
    ],
  },
  "tr-97": {
    paraphrases: [
      "Living costs in big cities today far exceed those in the countryside, and as a result, young people find it more difficult to put money aside.",
      "Life in major urban centers is so much more expensive than in rural areas that saving has become a real challenge for the younger generation.",
      "Compared with rural areas, major cities currently have a considerably higher cost of living, which makes it more difficult for young people to accumulate savings.",
    ],
    vocab: [
      { word: "cost of living", meaningVi: "chi phí sinh hoạt", example: "The cost of living in this city has risen sharply over the past decade." },
      { word: "far exceed", meaningVi: "vượt xa, cao hơn nhiều so với", example: "Her achievements far exceed what was expected of her." },
      { word: "put money aside", meaningVi: "dành dụm, để dành tiền", example: "She tries to put a little money aside every month for emergencies." },
      { word: "considerably", meaningVi: "đáng kể", example: "Prices in the capital have risen considerably since last year." },
    ],
  },
  "tr-98": {
    paraphrases: [
      "Because they come from low-income backgrounds, students are frequently given fewer chances to enroll in advanced courses, a fact that widens the educational divide between social classes.",
      "Advanced courses are often less accessible to students from disadvantaged families, and this lack of access further widens the educational gap across social classes.",
      "The limited access that low-income students have to advanced courses tends to deepen the educational inequality that already exists between different social classes.",
    ],
    vocab: [
      { word: "low-income", meaningVi: "thu nhập thấp", example: "The government has introduced subsidies to support low-income households." },
      { word: "disadvantaged", meaningVi: "thiệt thòi, kém may mắn", example: "Scholarships can help disadvantaged students pursue higher education." },
      { word: "educational gap", meaningVi: "khoảng cách giáo dục", example: "Access to technology can help narrow the educational gap between urban and rural students." },
      { word: "deepen", meaningVi: "làm sâu sắc thêm, trầm trọng thêm", example: "Prolonged unemployment can deepen social inequality." },
    ],
  },
  "tr-99": {
    paraphrases: [
      "Not only does air pollution in major cities seriously damage residents' respiratory health, but it also considerably shortens the average lifespan of people living close to industrial areas.",
      "In addition to seriously harming the respiratory systems of city residents, air pollution significantly cuts short the life expectancy of those who live near industrial zones.",
      "People living near industrial zones in major cities tend to have a shorter average lifespan and suffer serious respiratory harm as a result of air pollution.",
    ],
    vocab: [
      { word: "respiratory system", meaningVi: "hệ hô hấp", example: "Smoking has a damaging effect on the respiratory system." },
      { word: "life expectancy", meaningVi: "tuổi thọ trung bình", example: "Improvements in healthcare have increased life expectancy worldwide." },
      { word: "industrial zone", meaningVi: "khu công nghiệp", example: "Several factories have been built in the industrial zone outside the city." },
      { word: "detrimental", meaningVi: "có hại", example: "Excessive noise can be detrimental to children's concentration." },
    ],
  },
  "tr-100": {
    paraphrases: [
      "Because people rely too heavily on navigation apps, many of them are gradually losing a sense of direction that used to be instinctive to humans.",
      "The growing dependence on navigation apps has led to a gradual decline in people's natural sense of direction.",
      "As people depend more and more on navigation apps, their innate ability to find their way around is slowly disappearing.",
    ],
    vocab: [
      { word: "overreliance", meaningVi: "sự phụ thuộc quá mức", example: "Overreliance on calculators can weaken students' basic math skills." },
      { word: "sense of direction", meaningVi: "khả năng định hướng", example: "Some people naturally have a poor sense of direction and get lost easily." },
      { word: "instinctive", meaningVi: "mang tính bản năng", example: "Fear of loud noises is an instinctive reaction in many animals." },
      { word: "navigation", meaningVi: "sự định hướng, dẫn đường", example: "Modern navigation systems rely on satellite technology." },
    ],
  },
};
