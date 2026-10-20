import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const SCRIPT_PATH = path.join(process.cwd(), 'scripts', 'ielts', 'build-drill-bank.mjs');
let code = readFileSync(SCRIPT_PATH, 'utf8');

const extraCode = `
// =========================================================================
// 10. READING: MATCHING INFORMATION & FEATURES (5 questions)
// =========================================================================
const matchingInfoData = [
  {
    context: "Section A: The invention of concrete by Roman engineers revolutionised architectural engineering. Section B: In contrast, medieval master masons abandoned pozzolanic mixtures in favour of cut stone vaults. Section C: Late 19th-century French engineer François Hennebique patented reinforced concrete combining tensile steel rebars with compressive concrete matrices.",
    prompt: "Which section contains information about the re-emergence of composite concrete integrated with metallic reinforcement?",
    options: ["Section A", "Section B", "Section C"],
    answer: "Section C",
    quote: "François Hennebique patented reinforced concrete combining tensile steel rebars with compressive concrete matrices",
    exp: "Đoạn C đề cập đến kỹ sư François Hennebique đăng ký bằng sáng chế cho bê tông cốt thép kết hợp thanh thép chịu kéo (metallic reinforcement)."
  },
  {
    context: "Scientist Dr. Elena Rostova demonstrated that arctic lichens produce secondary metabolites called usnic acids to resist ultraviolet radiation. Prof. Marcus Thorne established that lichens absorb airborne pollutants directly across their thalli without a protective cuticle layer. Dr. Sarah Jenkins discovered that fossilised lichens provide isotopic records of ancient volcanic eruptions.",
    prompt: "Match the finding to the researcher: \\"Lichens can serve as bioindicators because they lack a barrier against atmospheric contaminants.\\"",
    options: ["Dr. Elena Rostova", "Prof. Marcus Thorne", "Dr. Sarah Jenkins"],
    answer: "Prof. Marcus Thorne",
    quote: "Prof. Marcus Thorne established that lichens absorb airborne pollutants directly across their thalli without a protective cuticle layer.",
    exp: "Prof. Marcus Thorne chứng minh địa y hấp thụ chất ô nhiễm trong không khí do không có lớp biểu bì cutin bảo vệ."
  },
  {
    context: "Paragraph 1: Early telegraph cables suffered severe signal distortion due to electrical capacitance. Paragraph 2: Oliver Heaviside calculated that loading coils with specific inductance could eliminate electromagnetic phase distortion entirely. Paragraph 3: The transatlantic telegraph cable opened in 1866 following several catastrophic snaps in the Atlantic abyss.",
    prompt: "Which paragraph explains a mathematical theoretical breakthrough in telecommunication engineering?",
    options: ["Paragraph 1", "Paragraph 2", "Paragraph 3"],
    answer: "Paragraph 2",
    quote: "Oliver Heaviside calculated that loading coils with specific inductance could eliminate electromagnetic phase distortion entirely.",
    exp: "Paragraph 2 nhắc đến tính toán toán học (calculated) của Oliver Heaviside giúp loại bỏ hiện tượng biến dạng tín hiệu sóng điện từ."
  },
  {
    context: "Model Alpha consumes 12 kWh per 100km with a regenerative braking recovery rate of 78%. Model Beta features an active liquid cooling battery pack that extends cycle longevity by 40% under tropical climates. Model Gamma incorporates solid-state lithium ceramic cells with zero risk of thermal runaway combustion.",
    prompt: "Which vehicle model is engineered specifically to prevent catastrophic fire hazards caused by electrolyte overheating?",
    options: ["Model Alpha", "Model Beta", "Model Gamma"],
    answer: "Model Gamma",
    quote: "Model Gamma incorporates solid-state lithium ceramic cells with zero risk of thermal runaway combustion.",
    exp: "Model Gamma sử dụng pin gốm thể rắn không có nguy cơ cháy nổ do nhiệt độ tăng vọt (thermal runaway combustion)."
  },
  {
    context: "Dr. Aris Thorne argued that early hominid bipedalism evolved primarily to reduce solar thermal radiation exposure on open savannahs. Dr. Jane Goodall observed tool use among chimpanzees. Dr. Meave Leakey uncovered fossils demonstrating that bipedal gait preceded extensive cranial encephalisation by over two million years.",
    prompt: "Match the hypothesis: \\"Upright posture evolved as a thermoregulatory adaptation to environmental climate extremes.\\"",
    options: ["Dr. Aris Thorne", "Dr. Jane Goodall", "Dr. Meave Leakey"],
    answer: "Dr. Aris Thorne",
    quote: "Dr. Aris Thorne argued that early hominid bipedalism evolved primarily to reduce solar thermal radiation exposure on open savannahs.",
    exp: "Dr. Aris Thorne đưa ra luận điểm rằng việc đi bằng hai chân tiến hóa để giảm tiếp xúc bức xạ nhiệt mặt trời (thermoregulatory adaptation)."
  }
];

matchingInfoData.forEach((item, i) => {
  drillItems.push({
    id: \`drill-rd-mi-\${String(i + 1).padStart(2, '0')}\`,
    skill: 'reading',
    typeId: 'reading-matching-info',
    title: \`Reading Drill · Matching Info #\${i + 1}\`,
    contextText: item.context,
    prompt: item.prompt,
    options: item.options,
    answer: item.answer,
    explanationVi: item.exp,
    evidenceQuote: item.quote,
    tip: 'Đọc câu hỏi trước để ghi nhớ từ khóa ý nghĩa thay vì cố tìm từ vựng y hệt trong bài.'
  });
});

// =========================================================================
// 11. LISTENING: MATCHING (5 questions)
// =========================================================================
const listeningMatchingData = [
  {
    context: "Student A: \\"The campus gym membership is included with dormitory fees, but the Olympic swimming pool requires an extra monthly subscription.\\" Student B: \\"And what about the tennis courts?\\" Student A: \\"You can book them for free, but only before 2 PM on weekdays; after that, you need to pay a nominal hourly fee.\\"",
    prompt: "What condition applies to using the tennis courts?",
    options: ["Free at all times", "Free only during off-peak weekday hours", "Requires an expensive seasonal pass"],
    answer: "Free only during off-peak weekday hours",
    quote: "You can book them for free, but only before 2 PM on weekdays",
    exp: "Sân tennis miễn phí trước 2 giờ chiều các ngày trong tuần (off-peak weekday hours)."
  },
  {
    context: "Tour Guide: \\"Visitors to the ancient cathedral tower must note that while audio guides are complimentary for all ticket holders, large backpacks must be checked in at the luggage depository. Photography is strictly prohibited inside the crypt.\\"",
    prompt: "Which regulation applies to photography inside the cathedral crypt?",
    options: ["Permitted with a special permit", "Completely prohibited", "Permitted without flash only"],
    answer: "Completely prohibited",
    quote: "Photography is strictly prohibited inside the crypt.",
    exp: "Hướng dẫn viên nhấn mạnh chụp ảnh bị nghiêm cấm hoàn toàn trong hầm mộ (strictly prohibited)."
  },
  {
    context: "Tutor: \\"For Assignment 1, submitting a printed hardcopy is mandatory. Assignment 2 is submitted via the online learning portal. For the final dissertation, both a digital PDF copy and two bound hardcopies must be handed into the faculty office.\\"",
    prompt: "How must students submit the final dissertation?",
    options: ["Digital PDF only", "Single printed copy only", "Both digital PDF and two bound hardcopies"],
    answer: "Both digital PDF and two bound hardcopies",
    quote: "both a digital PDF copy and two bound hardcopies must be handed into the faculty office.",
    exp: "Khóa luận tốt nghiệp yêu cầu nộp cả bản mềm PDF lẫn hai bản in đóng gáy."
  },
  {
    context: "Lecturer: \\"Course module BIO-301 requires prerequisite completion of Organic Chemistry. Module BIO-305 is an open elective with no prior science coursework needed. BIO-310 is restricted exclusively to final-year honours students.\\"",
    prompt: "What is the entry requirement for module BIO-305?",
    options: ["Prerequisite in Organic Chemistry", "No prior science coursework required", "Restricted to final-year honours students only"],
    answer: "No prior science coursework required",
    quote: "Module BIO-305 is an open elective with no prior science coursework needed.",
    exp: "Môn BIO-305 là môn tự chọn mở, không yêu cầu bất kỳ môn khoa học tiên quyết nào."
  },
  {
    context: "Doctor: \\"Our clinic provides walk-in urgent care on Saturday mornings. Regular routine health checks are by appointment only. Emergency trauma cases are immediately transferred to the municipal general hospital.\\"",
    prompt: "What is the clinic policy regarding routine health checks?",
    options: ["Walk-in at any time", "By advance appointment only", "Referred to municipal hospital"],
    answer: "By advance appointment only",
    quote: "Regular routine health checks are by appointment only.",
    exp: "Khám sức khỏe định kỳ chỉ tiếp nhận bệnh nhân đã đặt lịch trước (by appointment only)."
  }
];

listeningMatchingData.forEach((item, i) => {
  drillItems.push({
    id: \`drill-lis-mat-\${String(i + 1).padStart(2, '0')}\`,
    skill: 'listening',
    typeId: 'listening-matching',
    title: \`Listening Drill · Matching #\${i + 1}\`,
    contextText: item.context,
    prompt: item.prompt,
    options: item.options,
    answer: item.answer,
    explanationVi: item.exp,
    evidenceQuote: item.quote,
    tip: 'Chú ý các từ nối biểu thị ngoại lệ: "except", "however", "provided that".'
  });
});

// =========================================================================
// 12. WRITING TASK 1: PROCESS & MAP (5 questions)
// =========================================================================
const task1ProcessMapData = [
  {
    context: "Process: Cocoa bean harvesting -> Fermentation (6-8 days in wooden boxes) -> Sun-drying on raised bamboo mats -> Roasting at 120-140°C -> Winnowing to separate nibs from husk -> Grinding into cocoa liquor.",
    prompt: "Which passive voice sentence best describes the stage immediately following fermentation?",
    options: [
      "The fermented beans are dried under direct sunlight on elevated bamboo racks.",
      "Farmers ferment cocoa beans for six to eight days in wooden boxes.",
      "Workers crush the roasted nibs into viscous cocoa liquor."
    ],
    answer: "The fermented beans are dried under direct sunlight on elevated bamboo racks.",
    quote: "Sun-drying on raised bamboo mats follows fermentation",
    exp: "Dạng bài Process cần sử dụng thể bị động (passive voice) chuẩn xác để mô tả trình tự các bước khách quan."
  },
  {
    context: "Map comparison: In 2010, the industrial dockland occupied the eastern riverbank. By 2025, the warehouses had been demolished and replaced by high-rise residential apartments and a riverside public promenade.",
    prompt: "Which sentence best summarizes this urban redevelopment in an Overview paragraph?",
    options: [
      "The western industrial sector expanded with brand new container terminals.",
      "The former eastern industrial dockland was entirely transformed into a residential and recreational zone.",
      "No significant structural alterations took place along the riverbank over the fifteen-year period."
    ],
    answer: "The former eastern industrial dockland was entirely transformed into a residential and recreational zone.",
    quote: "warehouses had been demolished and replaced by high-rise residential apartments and a riverside public promenade",
    exp: "Câu tổng quan (Overview) của dạng Map cần nêu bật sự chuyển đổi mục đích sử dụng đất từ công nghiệp sang dân cư và giải trí."
  },
  {
    context: "Process: Water treatment plant. Raw river water enters coagulation tanks where alum is added -> Flocculation settles heavy suspended solids -> Sand and carbon filtration removes microscopic impurities -> Chlorination disinfects bacteria -> Treated water pumped to reservoir.",
    prompt: "Which cohesive device and phrasing appropriately transitions from filtration to disinfection?",
    options: [
      "Subsequently, the filtered water undergoes chlorination to eliminate harmful microbial pathogens.",
      "Before filtration, workers disinfect the raw untreated water with chlorine gas.",
      "In conclusion, chlorine is added at the very beginning of the purification process."
    ],
    answer: "Subsequently, the filtered water undergoes chlorination to eliminate harmful microbial pathogens.",
    quote: "Sand and carbon filtration -> Chlorination disinfects bacteria",
    exp: "Từ nối \\"Subsequently\\" thể hiện bước tiếp theo theo đúng trình tự thời gian của quy trình lọc nước."
  },
  {
    context: "Map layout: The village hospital in 2000 was a single-story square structure. In 2024, a two-story maternity wing was constructed to the south, and the existing car park was relocated to the northwest perimeter.",
    prompt: "Which prepositional phrase accurately describes the spatial change of the car park?",
    options: [
      "The car park was shifted to the northwest corner of the hospital premises.",
      "The car park was expanded southward adjacent to the maternity ward.",
      "The maternity wing was demolished to construct a car park in the center."
    ],
    answer: "The car park was shifted to the northwest corner of the hospital premises.",
    quote: "car park was relocated to the northwest perimeter",
    exp: "Cụm từ \\"shifted to the northwest corner\\" miêu tả chính xác sự dịch chuyển vị trí của bãi đỗ xe theo hướng la bàn."
  },
  {
    context: "Process: Paper recycling. Waste paper collected -> Shredded and mixed with hot water to form pulp -> Centrifugal de-inking cleans dyes -> Hydrogen peroxide bleaching whitens fibers -> Rollers squeeze moisture -> Finished recycled paper rolls.",
    prompt: "What is the primary function of hydrogen peroxide in this manufacturing sequence?",
    options: [
      "To shred the solid waste paper into tiny scraps",
      "To bleach and whiten the recycled cellulose fibers",
      "To squeeze moisture between mechanical heated rollers"
    ],
    answer: "To bleach and whiten the recycled cellulose fibers",
    quote: "Hydrogen peroxide bleaching whitens fibers",
    exp: "Hóa chất hydrogen peroxide đóng vai trò tẩy trắng các sợi xenluloza đã khử mực."
  }
];

task1ProcessMapData.forEach((item, i) => {
  drillItems.push({
    id: \`drill-wr-proc-\${String(i + 1).padStart(2, '0')}\`,
    skill: 'writing',
    typeId: 'writing-task-1-process-map',
    title: \`Writing Drill · Process & Map #\${i + 1}\`,
    contextText: item.context,
    prompt: item.prompt,
    options: item.options,
    answer: item.answer,
    explanationVi: item.exp,
    evidenceQuote: item.quote,
    tip: 'Với dạng Process, hãy luôn dùng thì hiện tại đơn thể bị động (is/are + V3/ed) và các từ nối trình tự thời gian.'
  });
});

// =========================================================================
// 13. SPEAKING PART 2: STRUCTURING & LONG TURN (5 questions)
// =========================================================================
const speakingPart2Data = [
  {
    context: "Cue Card: Describe an environmental problem that your country is facing. You should say: what the problem is, what causes it, how it affects people's lives, and explain what can be done to solve it.",
    prompt: "During your 1-minute preparation, which note-taking strategy is most effective?",
    options: [
      "Write down full grammatically complete paragraphs for each bullet point.",
      "Jot down keywords and collocations (e.g., \\"particulate matter\\", \\"respiratory ailments\\", \\"clean energy subsidy\\") covering all 4 bullets.",
      "Sit quietly without writing anything and try to memorize a scripted speech."
    ],
    answer: "Jot down keywords and collocations (e.g., \\"particulate matter\\", \\"respiratory ailments\\", \\"clean energy subsidy\\") covering all 4 bullets.",
    quote: "1-minute preparation note-taking technique",
    exp: "Không bao giờ viết câu hoàn chỉnh trong 1 phút chuẩn bị. Hãy ghi nhanh từ khóa nâng cao (collocations) theo đúng 4 gợi ý trên thẻ."
  },
  {
    context: "Candidate speaking: \\"Well, speaking of the origin of this historical building, it was erected back in the late seventeenth century... Moving on to its architectural features... As for why this site holds immense cultural importance to me...\\"",
    prompt: "Which speaking skill is demonstrated by the underlined signposting phrases?",
    options: [
      "Discourse markers and structural coherence ensuring fluent topic transitions",
      "Grammatical inversion with negative adverbials",
      "Phonological elision in connected speech"
    ],
    answer: "Discourse markers and structural coherence ensuring fluent topic transitions",
    quote: "speaking of..., Moving on to..., As for why...",
    exp: "Các cụm từ dẫn dắt (signposting phrases/discourse markers) giúp bài nói có kết cấu mạch lạc, liên kết tự nhiên giữa các phần."
  },
  {
    context: "Cue Card: Describe a time when you received useful advice from someone. Bullet 4 asks: and explain how this advice helped you.",
    prompt: "Which response provides the highest band score development for Bullet 4?",
    options: [
      "It helped me a lot and I felt very good about it because it was really nice.",
      "Her recommendation proved to be a pivotal turning point; not only did it resolve my immediate career dilemma, but it also instilled a lifelong habit of proactive problem-solving.",
      "I followed the advice next day. The end."
    ],
    answer: "Her recommendation proved to be a pivotal turning point; not only did it resolve my immediate career dilemma, but it also instilled a lifelong habit of proactive problem-solving.",
    quote: "High-level vocabulary and complex grammar (inversion: not only did it...)",
    exp: "Câu trả lời kết hợp từ vựng học thuật (pivotal turning point, dilemma, proactive) cùng cấu trúc đảo ngữ (not only did it...) tạo ấn tượng mạnh với giám khảo."
  },
  {
    context: "Strategy: If you run out of things to say in Part 2 before the examiner stops you (1 minute 30 seconds mark), what should you do to reach the full 2-minute mark smoothly?",
    prompt: "Which technique is recommended to extend your talk naturally?",
    options: [
      "Reflect on hypothetical scenarios or future implications (e.g., \\"Looking back, if I had not experienced that, I might have... In the foreseeable future, I reckon...\\")",
      "Repeat your first introductory sentence word-for-word three times",
      "Remain completely silent and stare at the examiner until they ask a question"
    ],
    answer: "Reflect on hypothetical scenarios or future implications (e.g., \\"Looking back, if I had not experienced that, I might have... In the foreseeable future, I reckon...\\")",
    quote: "Hypothetical and future reflection extension",
    exp: "Kỹ thuật phản tư quá khứ giả định (Third Conditional: if I had not...) hoặc dự đoán tương lai (future implications) giúp kéo dài bài nói tự nhiên và phô diễn cấu trúc ngữ pháp phức tạp."
  },
  {
    context: "Cue Card: Describe an accomplishment you are proud of. The candidate wants to convey emotional depth and personal growth.",
    prompt: "Which idiomatic expression and phrasing best expresses overcoming severe hardship to achieve success?",
    options: [
      "Against all odds, after burning the midnight oil for months, standing on that podium was an overwhelmingly gratifying milestone.",
      "It was easy and I did not need to study or practice at all.",
      "The accomplishment was big and I was very happy."
    ],
    answer: "Against all odds, after burning the midnight oil for months, standing on that podium was an overwhelmingly gratifying milestone.",
    quote: "Against all odds, burning the midnight oil, overwhelmingly gratifying milestone",
    exp: "Sử dụng thành ngữ phù hợp tự nhiên (against all odds, burn the midnight oil) cùng từ vựng cảm xúc (gratifying milestone) đạt tiêu chuẩn Band 8-9 về Lexical Resource."
  }
];

speakingPart2Data.forEach((item, i) => {
  drillItems.push({
    id: \`drill-sp-p2-\${String(i + 1).padStart(2, '0')}\`,
    skill: 'speaking',
    typeId: 'speaking-part-2-structuring',
    title: \`Speaking Drill · Part 2 Long Turn #\${i + 1}\`,
    contextText: item.context,
    prompt: item.prompt,
    options: item.options,
    answer: item.answer,
    explanationVi: item.exp,
    evidenceQuote: item.quote,
    tip: 'Tận dụng 1 phút chuẩn bị để phác thảo 4 góc ý theo đúng 4 câu hỏi gợi ý, dùng cụm từ dẫn đường để bài nói liền mạch.'
  });
});
`;

code = code.replace("console.log(`Generated ${drillItems.length} comprehensive IELTS skill drill questions!`);", extraCode + "\nconsole.log(`Generated ${drillItems.length} comprehensive IELTS skill drill questions!`);");
writeFileSync(SCRIPT_PATH, code, 'utf8');
console.log('Successfully updated build-drill-bank.mjs!');
