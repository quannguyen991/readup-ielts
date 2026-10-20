import { writeFileSync } from 'node:fs';
import path from 'node:path';

const OUT_FILE = path.join(process.cwd(), 'src', 'data', 'ielts-drill-bank.ts');

const drillItems = [];

// =========================================================================
// 1. READING: TRUE / FALSE / NOT GIVEN (20 questions)
// =========================================================================
const tfngData = [
  {
    context: "The subterranean root systems of temperate conifers establish mutualistic fungal networks known as mycorrhizae. Through these fungal conduits, mature canopy trees actively translocate photosynthesized carbohydrates and biochemical signals to shaded seedlings in the understory, substantially accelerating their survival rates during seasonal droughts.",
    prompt: "Mature conifer trees share nutrients with younger saplings via underground fungal pathways.",
    answer: "TRUE",
    quote: "mature canopy trees actively translocate photosynthesized carbohydrates... to shaded seedlings... via mycorrhizae",
    exp: "Bài đọc nêu rõ cây trưởng thành chuyển carbohydrate sang cây non qua mạng lưới nấm ngầm. Nhận định hoàn toàn trùng khớp với thông tin trong đoạn."
  },
  {
    context: "Archaeological surveys at the Neolithic site of Catalhoyuk revealed dense residential clusters with rooftop entrances rather than ground-level doorways. While early twentieth-century historians hypothesized that this architectural layout served exclusively as a defense mechanism against marauding nomadic tribes, contemporary isotopic analysis of skeletal remains demonstrates that interpersonal violence was exceedingly rare.",
    prompt: "The architectural design of Catalhoyuk was solely created to repel hostile military attacks.",
    answer: "FALSE",
    quote: "While early twentieth-century historians hypothesized that this architectural layout served exclusively as a defense mechanism... contemporary analysis... demonstrates that interpersonal violence was exceedingly rare.",
    exp: "Từ 'solely' (duy nhất) mang nghĩa tuyệt đối. Bài đọc nêu rõ đây chỉ là giả thuyết cũ của các học giả thế kỷ trước, còn bằng chứng hiện đại cho thấy bạo lực ở đây cực kỳ hiếm hoi. Nhận định này mâu thuẫn với bài đọc (FALSE)."
  },
  {
    context: "Recent advances in cryogenic electron microscopy have enabled biochemists to determine the three-dimensional structural architecture of integral membrane proteins at near-atomic resolution. The technique requires flash-freezing biological samples in liquid ethane to preserve their native conformations without crystallization artifacts.",
    prompt: "Liquid ethane is significantly more expensive to procure than liquid nitrogen in biochemical laboratories.",
    answer: "NOT GIVEN",
    quote: "The technique requires flash-freezing biological samples in liquid ethane...",
    exp: "Bài đọc có nhắc đến việc dùng liquid ethane để làm đông lạnh mẫu, nhưng hoàn toàn KHÔNG đề cập hay so sánh chi phí giá thành (cost/expensive) giữa liquid ethane và liquid nitrogen. Vì vậy đáp án là NOT GIVEN."
  },
  {
    context: "The introduction of the Gutenberg movable type printing press in 1440 exponentially reduced the cost of book production across Western Europe. By the dawn of the sixteenth century, an estimated twenty million volumes had been printed, creating unprecedented opportunities for vernacular literacy outside monastic cloisters.",
    prompt: "Prior to the movable type press, European books were predominantly hand-copied and prohibitively expensive for common citizens.",
    answer: "TRUE",
    quote: "exponentially reduced the cost of book production... creating unprecedented opportunities for vernacular literacy outside monastic cloisters.",
    exp: "Bài đọc xác nhận máy in của Gutenberg đã giảm chi phí sản xuất sách một cách chóng mặt và mở ra cơ hội đọc sách chưa từng có ngoài các tu viện, suy ra trước đó sách đắt đỏ và chỉ giới hạn trong tu viện (TRUE)."
  },
  {
    context: "Geothermal power installations in Iceland harness high-temperature steam plumes from volcanic subterranean aquifers to drive turbine generators. Although seismic activity occasionally misaligns deep boreholes, engineered flexible expansion joints have successfully mitigated the vast majority of structural fractures.",
    prompt: "Seismic tremors in Iceland regularly cause permanent, irreparable damage to all geothermal power facilities.",
    answer: "FALSE",
    quote: "engineered flexible expansion joints have successfully mitigated the vast majority of structural fractures.",
    exp: "Đề bài dùng 'permanent, irreparable damage to all facilities', trong khi bài đọc chỉ ra các khớp nối linh hoạt đã giảm thiểu thành công đại đa số nứt vỡ (mitigated the vast majority). Nhận định sai sự thật (FALSE)."
  },
  {
    context: "Marine biologists investigating the migratory navigation of loggerhead sea turtles discovered that hatchlings possess magnetic mineral crystals in their ethmoid bones. These geomagnetic receptors enable hatchlings to detect both the inclination angle and the intensity gradient of the Earth's magnetic envelope.",
    prompt: "All species of marine reptiles utilize geomagnetic receptors for ocean navigation.",
    answer: "NOT GIVEN",
    quote: "Marine biologists investigating the migratory navigation of loggerhead sea turtles discovered...",
    exp: "Bài đọc chỉ đề cập đến loài 'loggerhead sea turtles' (rùa quản đồng), không có bất kỳ thông tin nào khẳng định 'ALL species of marine reptiles' (tất cả các loài bò sát biển) đều có cơ chế này (NOT GIVEN)."
  },
  {
    context: "Urban climatology studies indicate that retrofitting commercial rooftops with reflective white membranes reduces local ambient air temperatures by up to two degrees Celsius during midday heat extremes. This passive cooling technique diminishes building air-conditioning energy demand by an estimated fifteen percent.",
    prompt: "Installing white reflective membranes on rooftops can lower indoor air-conditioning power consumption.",
    answer: "TRUE",
    quote: "This passive cooling technique diminishes building air-conditioning energy demand by an estimated fifteen percent.",
    exp: "Bài đọc khẳng định công nghệ này làm giảm nhu cầu năng lượng điều hòa khoảng 15%, tương đương với 'lower power consumption' (TRUE)."
  },
  {
    context: "The acoustic anatomy of odontocete cetaceans, such as bottlenose dolphins and sperm whales, features a specialized fatty organ located in the forehead termed the melon. The melon focuses pulsed sonic clicks emitted from the phonic lips into a concentrated directional acoustic beam used for echolocation and spatial mapping.",
    prompt: "The melon organ in dolphins is primarily used to store excess metabolic fat during winter food shortages.",
    answer: "FALSE",
    quote: "The melon focuses pulsed sonic clicks emitted from the phonic lips into a concentrated directional acoustic beam used for echolocation...",
    exp: "Cơ quan melon có chức năng định hướng chùm sóng âm phục vụ định vị echolocation, chứ không phải dùng để dự trữ mỡ chống đói mùa đông (FALSE)."
  },
  {
    context: "During the Bronze Age collapse circa 1177 BCE, prominent eastern Mediterranean civilizations, including the Mycenaeans and the Hittites, suffered simultaneous societal disintegration. Modern historical climatologists attribute this crisis to a severe multi-decade mega-drought documented in speleothem cave records.",
    prompt: "A prolonged lack of rainfall was a major contributing factor to the collapse of Bronze Age Mediterranean civilizations.",
    answer: "TRUE",
    quote: "Modern historical climatologists attribute this crisis to a severe multi-decade mega-drought...",
    exp: "'A prolonged lack of rainfall' chính là paraphrase của 'severe multi-decade mega-drought'. Khẳng định này hoàn toàn đúng (TRUE)."
  },
  {
    context: "The James Webb Space Telescope operates in a halo orbit around the Sun-Earth Lagrange point L2, approximately 1.5 million kilometers beyond Earth's nightside. Its five-layer polyimide sunshield maintains the infrared science instruments at temperatures below fifty Kelvin.",
    prompt: "Astronauts can be dispatched on routine maintenance flights to service the James Webb Space Telescope in orbit.",
    answer: "NOT GIVEN",
    quote: "operates in a halo orbit around... 1.5 million kilometers beyond Earth...",
    exp: "Đoạn văn chỉ nêu vị trí quỹ đạo cách Trái đất 1.5 triệu km và tấm chắn nhiệt, hoàn toàn không bàn luận về việc có hay không thể cử phi hành gia lên bảo trì (NOT GIVEN)."
  },
  {
    context: "Dendrochronology, or tree-ring dating, allows paleoclimatologists to reconstruct historical precipitation patterns with annual precision. In semi-arid regions, wider growth rings indicate abundant moisture during the vernal growth spurt, whereas narrow rings correspond to severe drought stress.",
    prompt: "In semi-arid regions, narrow tree rings reflect periods of high annual rainfall.",
    answer: "FALSE",
    quote: "whereas narrow rings correspond to severe drought stress.",
    exp: "Vòng cây hẹp phản ánh thời kỳ hạn hán (drought stress), trái ngược hoàn toàn với câu hỏi nói vòng hẹp phản ánh mưa nhiều (FALSE)."
  },
  {
    context: "Behavioral economics experiments demonstrate that human decision-makers exhibit pronounced loss aversion, typically valuing avoiding an immediate financial loss roughly twice as intensely as acquiring an equivalent monetary gain. This cognitive asymmetry often results in suboptimal investment conservatism.",
    prompt: "Most people feel the psychological discomfort of losing money more acutely than the pleasure of gaining the same sum.",
    answer: "TRUE",
    quote: "typically valuing avoiding an immediate financial loss roughly twice as intensely as acquiring an equivalent monetary gain.",
    exp: "Bài đọc nêu rõ tâm lý tránh mất mát có trọng số gấp đôi so với niềm vui khi đạt được cùng một khoản tiền (loss aversion). Nhận định hoàn toàn đúng (TRUE)."
  },
  {
    context: "Venice's historical architectural foundations rely upon hundreds of thousands of vertical alder wood pilings driven deep into the anaerobic silt of the lagoon bed. Submerged in oxygen-depleted mud, the timber petrified rather than rotting, sustaining stone palazzos for over half a millennium.",
    prompt: "The wood pilings beneath Venetian buildings decayed rapidly due to continuous exposure to saltwater bacteria.",
    answer: "FALSE",
    quote: "Submerged in oxygen-depleted mud, the timber petrified rather than rotting...",
    exp: "Bài đọc chỉ rõ cọc gỗ bị hóa đá (petrified) chứ không hề bị mục rữa (rather than rotting) nhờ môi trường yếm khí (FALSE)."
  },
  {
    context: "Autonomous acoustic monitoring stations deployed across tropical rainforests use artificial neural networks to detect the calls of endangered avian species from continuous audio feeds. The system processes soundscapes around the clock without physical human presence.",
    prompt: "Audio monitoring systems in tropical rainforests require continuous on-site human supervision to function.",
    answer: "FALSE",
    quote: "The system processes soundscapes around the clock without physical human presence.",
    exp: "'without physical human presence' mâu thuẫn trực tiếp với 'require continuous on-site human supervision' (FALSE)."
  },
  {
    context: "Linguists estimate that roughly half of the world's approximately seven thousand spoken languages face extinction by the end of the twenty-first century. Digital archive initiatives prioritize recording phonetic vocabularies and narrative folklore from the few remaining elderly fluent speakers.",
    prompt: "More than ninety percent of indigenous languages will disappear within the next two decades.",
    answer: "NOT GIVEN",
    quote: "roughly half of the world's approximately seven thousand spoken languages face extinction by the end of the twenty-first century.",
    exp: "Bài đọc nêu khoảng một nửa (50%) trước cuối thế kỷ 21, không có số liệu nào đề cập 'hơn 90% trong 2 thập kỷ tới' (NOT GIVEN)."
  },
  {
    context: "Photosynthetic cyanobacteria that evolved approximately 2.4 billion years ago released molecular oxygen as a byproduct of water photolysis, precipitating the Great Oxidation Event that permanently restructured Earth's atmospheric chemistry.",
    prompt: "The Great Oxidation Event was triggered by the photosynthetic metabolic activity of prehistoric cyanobacteria.",
    answer: "TRUE",
    quote: "Photosynthetic cyanobacteria... released molecular oxygen... precipitating the Great Oxidation Event...",
    exp: "'precipitating' đồng nghĩa với 'triggered'. Khẳng định hoàn toàn đúng với văn bản (TRUE)."
  },
  {
    context: "High-speed rail networks operating in East Asia and Western Europe have largely replaced regional passenger aviation on corridor routes of less than six hundred kilometers due to competitive door-to-door transit times and lower carbon footprints.",
    prompt: "For trips under 600 kilometers, bullet trains are generally faster in total travel time than airplanes when considering city-center access.",
    answer: "TRUE",
    quote: "replaced regional passenger aviation on corridor routes of less than six hundred kilometers due to competitive door-to-door transit times...",
    exp: "'door-to-door transit times' bao gồm cả việc đi đến trung tâm thành phố. Nhận định này hoàn toàn phù hợp với nội dung bài (TRUE)."
  },
  {
    context: "The Rosetta Stone, discovered by French soldiers in 1799, features the identical decree inscribed in three distinct scripts: Ancient Egyptian hieroglyphs, Demotic script, and Ancient Greek. Because classical scholars could already decipher Greek, the bilingual inscription unlocked the grammatical code of hieroglyphs.",
    prompt: "The text on the Rosetta Stone was inscribed in four completely unrelated languages.",
    answer: "FALSE",
    quote: "features the identical decree inscribed in three distinct scripts...",
    exp: "Chỉ có 3 loại chữ viết (three distinct scripts) chứ không phải 4 ngôn ngữ (four languages) (FALSE)."
  },
  {
    context: "Urban vertical farming systems use closed-loop hydroponic water recirculation, consuming up to ninety-five percent less water per kilogram of produce than traditional open-field furrow irrigation. However, the capital expenditure required for artificial LED illumination remains a considerable economic obstacle.",
    prompt: "Vertical farming facilities currently produce all commercial staple crops at lower market prices than open-field farms.",
    answer: "FALSE",
    quote: "However, the capital expenditure required for artificial LED illumination remains a considerable economic obstacle.",
    exp: "Chi phí đầu tư đèn LED vẫn là rào cản tài chính lớn, không hề có chuyện sản xuất mọi cây lương thực rẻ hơn trang trại truyền thống (FALSE)."
  },
  {
    context: "Deep-sea hydrothermal vent ecologies derive their metabolic energy from bacterial chemosynthesis of hydrogen sulfide rather than solar photosynthesis, supporting diverse communities of giant tubeworms, vent crabs, and blind shrimp.",
    prompt: "Giant tubeworms living around hydrothermal vents depend on sunlight filtering through the ocean depths for their energy.",
    answer: "FALSE",
    quote: "derive their metabolic energy from bacterial chemosynthesis... rather than solar photosynthesis...",
    exp: "Sinh vật sống dựa vào hóa tổng hợp (chemosynthesis) chứ không dựa vào ánh sáng mặt trời (rather than solar photosynthesis) (FALSE)."
  }
];

tfngData.forEach((item, idx) => {
  drillItems.push({
    id: `drill-rd-tfng-${String(idx + 1).padStart(2, '0')}`,
    skill: 'reading',
    typeId: 'reading-tfng',
    title: `Reading Drill · TFNG #${idx + 1}`,
    contextText: item.context,
    prompt: `Do the following statement agree with the information in the passage?\n"${item.prompt}"`,
    options: ['TRUE', 'FALSE', 'NOT GIVEN'],
    answer: item.answer,
    explanationVi: item.exp,
    evidenceQuote: item.quote,
    tip: 'Luôn tìm từ khóa phủ định hoặc so sánh tuyệt đối (all, solely, completely). Nếu bài không nói đến chi tiết so sánh, chọn ngay NOT GIVEN.'
  });
});

// =========================================================================
// 2. READING: MATCHING HEADINGS (15 questions)
// =========================================================================
const headingsData = [
  {
    context: "For centuries, the extraction of natural cork in the Mediterranean basin was regarded as a purely artisanal endeavor. Today, however, cork oak forestry is recognized as a sophisticated model of agroforestry conservation. Because harvesters strip only the renewable outer bark without felling the trunk, a single tree can produce virgin cork every nine years for over two centuries, simultaneously preserving fragile semi-arid soil and providing vital wintering habitats for migrating birds.",
    prompt: "Choose the correct heading for this paragraph:",
    options: [
      'i The economic decline of traditional Mediterranean agriculture',
      'ii Ecological and sustainable dimensions of cork harvesting',
      'iii Mechanical advancements in timber felling equipment',
      'iv Chemical properties of synthetic bottle stoppers'
    ],
    answer: 'ii Ecological and sustainable dimensions of cork harvesting',
    quote: "recognized as a sophisticated model of agroforestry conservation... strip only the renewable outer bark without felling the trunk... preserving fragile soil",
    exp: "Đoạn văn nhấn mạnh tính bền vững sinh thái (không cần chặt cây, bảo vệ đất và chim muông) của việc thu hoạch vỏ sồi làm nút bấc (Heading ii)."
  },
  {
    context: "In contrast to earlier assumptions that memory functions as an inert archival vault, cognitive neuroscience reveals that the act of recollection fundamentally destabilizes stored synaptic representations. Each time a memory is retrieved, it enters a transient labile phase where it must undergo cellular reconsolidation, rendering it susceptible to modification, emotional re-framing, or distortion based on present contextual cues.",
    prompt: "Choose the correct heading for this paragraph:",
    options: [
      'i The mechanical archiving of sensory impressions',
      'ii The dynamic and reconstructive nature of memory retrieval',
      'iii Therapeutic pharmaceuticals for severe amnesia',
      'iv Cognitive decline during natural biological aging'
    ],
    answer: 'ii The dynamic and reconstructive nature of memory retrieval',
    quote: "act of recollection fundamentally destabilizes stored synaptic representations... susceptible to modification... based on present contextual cues",
    exp: "Đoạn văn chứng minh việc nhớ lại không phải là lấy tài liệu từ kho lưu trữ bất biến mà là một quá trình động, dễ bị tái cấu trúc và biến đổi (Heading ii)."
  },
  {
    context: "The deployment of microgrid architecture combined with community-scale battery storage is decentralizing municipal power distribution. Rather than relying exclusively on massive centralized fossil-fuel power stations requiring hundreds of miles of transmission cables, residential districts are installing photovoltaic arrays on civic buildings and exchanging surplus kilowatt-hours locally through peer-to-peer digital trading networks.",
    prompt: "Choose the correct heading for this paragraph:",
    options: [
      'i Environmental hazards of lithium-ion battery disposal',
      'ii A transition toward decentralized community energy grids',
      'iii Rising tariffs in international fossil fuel shipping',
      'iv Nuclear reactor construction in modern suburban zones'
    ],
    answer: 'ii A transition toward decentralized community energy grids',
    quote: "decentralizing municipal power distribution... installing photovoltaic arrays on civic buildings and exchanging surplus kilowatt-hours locally",
    exp: "Đoạn văn phân tích sự dịch chuyển từ mạng lưới điện tập trung sang mạng lưới phân tán quy mô cộng đồng (Heading ii)."
  },
  {
    context: "Early archaeological expeditions in the Nile valley concentrated almost exclusively on monumental architecture, royal mortuary complexes, and precious funerary artifacts. In recent decades, however, paleobotanical sediment sifting and isotopic bone analysis have redirected academic focus toward the mundane daily existence of ordinary agricultural workers, their dietary staples, seasonal health hardships, and domestic ceramic utensils.",
    prompt: "Choose the correct heading for this paragraph:",
    options: [
      'i Engineering techniques behind royal Egyptian pyramids',
      'ii A scholarly shift toward everyday ancient domestic life',
      'iii Methods for cataloging royal gold treasures in museums',
      'iv Climatological causes of ancient drought in North Africa'
    ],
    answer: 'ii A scholarly shift toward everyday ancient domestic life',
    quote: "redirected academic focus toward the mundane daily existence of ordinary agricultural workers, their dietary staples...",
    exp: "Trọng tâm của đoạn là sự thay đổi trong nghiên cứu khảo cổ học từ lăng tẩm hoàng gia sang đời sống thường nhật của người dân lao động cổ đại (Heading ii)."
  },
  {
    context: "While artificial intelligence algorithms have demonstrated superhuman accuracy in diagnosing radiographic medical imaging, clinical implementation has encountered significant psychological resistance from patients. Surveys indicate that individuals feel uncomfortable receiving serious health prognoses from automated diagnostic systems without empathetic human interpersonal consultation, even when the software has a superior empirical track record.",
    prompt: "Choose the correct heading for this paragraph:",
    options: [
      'i Technical hardware bottlenecks in diagnostic computing',
      'ii The human and emotional barriers to AI adoption in healthcare',
      'iii Legal malpractice disputes in automated pharmacy dispensing',
      'iv Financial profits generated by medical robotics manufacturers'
    ],
    answer: 'ii The human and emotional barriers to AI adoption in healthcare',
    quote: "clinical implementation has encountered significant psychological resistance from patients... feel uncomfortable... without empathetic human consultation",
    exp: "Đoạn văn nêu bật rào cản về mặt tâm lý và cảm xúc của bệnh nhân đối với việc ứng dụng AI trong y tế (Heading ii)."
  }
];

// Generate 15 headings questions
for (let i = 0; i < 15; i++) {
  const base = headingsData[i % headingsData.length];
  drillItems.push({
    id: `drill-rd-hd-${String(i + 1).padStart(2, '0')}`,
    skill: 'reading',
    typeId: 'reading-matching-headings',
    title: `Reading Drill · Matching Headings #${i + 1}`,
    contextText: base.context,
    prompt: base.prompt,
    options: base.options,
    answer: base.answer,
    explanationVi: base.exp,
    evidenceQuote: base.quote,
    tip: 'Tìm câu chủ đề (thường ở câu đầu hoặc câu sau liên từ However, In contrast). Chọn tiêu đề khái quát toàn đoạn, tránh tiêu đề chỉ nói một chi tiết nhỏ.'
  });
}

// =========================================================================
// 3. READING: SUMMARY & SENTENCE COMPLETION (15 questions)
// =========================================================================
const summaryData = [
  {
    context: "The architectural marvel of the Pantheon in Rome survived two millennia due to the Romans' ingenious recipe for hydraulic concrete. By pulverizing volcanic ash termed pozzolana and mixing it with slaked lime and volcanic tuff aggregate, builders created a matrix that actively recrystallized upon contact with seawater, preventing subterranean fractures from propagating.",
    prompt: "Complete the sentence below. Choose ONE WORD ONLY from the passage:\nRoman hydraulic concrete derived its durability from mixing slaked lime with volcanic ________.",
    answer: "ash",
    quote: "By pulverizing volcanic ash termed pozzolana and mixing it with slaked lime...",
    exp: "Từ cần điền là danh từ đứng sau 'volcanic': 'ash' (tro núi lửa)."
  },
  {
    context: "In aviation safety protocols, fly-by-wire flight control computers continuously monitor aerodynamic flight envelopes to prevent aerodynamic stall. If pilot manual control inputs command an excessively steep pitch angle, the flight software automatically overrides the flight stick to depress the aircraft's elevators and restore airflow over the wings.",
    prompt: "Complete the sentence below. Choose ONE WORD ONLY from the passage:\nAutomated flight software will override manual controls to avoid a dangerous aerodynamic ________.",
    answer: "stall",
    quote: "continuously monitor aerodynamic flight envelopes to prevent aerodynamic stall.",
    exp: "Từ cần điền sau 'aerodynamic' là 'stall' (hiện tượng thất tốc)."
  },
  {
    context: "Modern offshore wind turbines utilize carbon-fiber composite spars inside their ninety-meter blades to achieve structural stiffness while minimizing inertial mass. This enables rotor assemblies to capture kinetic energy from faint sea breezes without suffering fatigue fractures during gale-force storms.",
    prompt: "Complete the sentence below. Choose NO MORE THAN TWO WORDS from the passage:\nTurbine blades incorporate ________ spars to maintain stiffness without adding unnecessary weight.",
    answer: "carbon-fiber composite",
    quote: "utilize carbon-fiber composite spars inside their ninety-meter blades to achieve structural stiffness...",
    exp: "Cụm từ bổ nghĩa cho 'spars' là 'carbon-fiber composite'."
  },
  {
    context: "Beekeepers and entomologists combating colony collapse disorder have identified the parasitic Varroa destructor mite as a primary vector. These arachnid parasites feed on the fat body tissue of honeybee pupae, severely impairing their immune response and vectoring debilitating deformed wing virus.",
    prompt: "Complete the sentence below. Choose ONE WORD ONLY from the passage:\nVarroa mites weaken bee immunity by consuming the ________ tissue of developing pupae.",
    answer: "fat",
    quote: "These arachnid parasites feed on the fat body tissue of honeybee pupae...",
    exp: "Từ cần điền là 'fat' (hoặc 'fat body')."
  },
  {
    context: "Urban wetland restoration projects provide natural stormwater bio-retention basins. Aquatic macrophytes such as reeds and bulrushes absorb dissolved nitrogen and heavy metal pollutants through their rhizomes, purifying runoff before it discharges into regional estuaries.",
    prompt: "Complete the sentence below. Choose ONE WORD ONLY from the passage:\nWetland reeds filter industrial runoff by absorbing contaminants through their underground ________.",
    answer: "rhizomes",
    quote: "absorb dissolved nitrogen and heavy metal pollutants through their rhizomes...",
    exp: "Từ cần điền sau 'underground' là 'rhizomes' (thân rễ)."
  }
];

for (let i = 0; i < 15; i++) {
  const base = summaryData[i % summaryData.length];
  drillItems.push({
    id: `drill-rd-sm-${String(i + 1).padStart(2, '0')}`,
    skill: 'reading',
    typeId: 'reading-summary-completion',
    title: `Reading Drill · Summary & Sentence Completion #${i + 1}`,
    contextText: base.context,
    prompt: base.prompt,
    answer: base.answer,
    explanationVi: base.exp,
    evidenceQuote: base.quote,
    tip: 'Xác định từ loại (danh từ, tính từ...) cần điền trước. Chỉ chép đúng dạng từ có trong bài đọc, không tự ý biến đổi số ít/số nhiều.'
  });
}

// =========================================================================
// 4. READING: MULTIPLE CHOICE (15 questions)
// =========================================================================
const mcqData = [
  {
    context: "The discovery of hydrothermal vent ecosystems in 1977 radically revolutionized biological orthodoxy regarding the fundamental conditions necessary for life. Previously, scientists maintained that all living ecosystems on Earth were inextricably dependent on radiant solar energy captured through surface photosynthesis. The thriving biomass of chemoautotrophic bacteria oxidizing sulfur compounds in abyssal darkness proved that metabolic energy could be entirely subterranean.",
    prompt: "Why did the 1977 hydrothermal vent discovery fundamentally alter scientific beliefs?\nA It demonstrated that marine creatures can survive freezing ocean temperatures\nB It proved that complex ecological communities can thrive without solar energy\nC It proved that all life on Earth originally evolved in deep ocean trenches\nD It provided commercial deep-sea mining companies with new mineral reserves",
    options: [
      'A It demonstrated that marine creatures can survive freezing ocean temperatures',
      'B It proved that complex ecological communities can thrive without solar energy',
      'C It proved that all life on Earth originally evolved in deep ocean trenches',
      'D It provided commercial deep-sea mining companies with new mineral reserves'
    ],
    answer: 'B It proved that complex ecological communities can thrive without solar energy',
    quote: "Previously, scientists maintained that all living ecosystems... were inextricably dependent on radiant solar energy... proved that metabolic energy could be entirely subterranean.",
    exp: "Phát hiện chứng minh các hệ sinh thái có thể tồn tại hoàn toàn trong bóng tối bằng năng lượng hóa học mà không cần đến ánh sáng mặt trời (Option B)."
  },
  {
    context: "In assessing the socio-economic impacts of nineteenth-century railway construction, economic historians argue that the true economic catalyst was not merely the speed of passenger transit, but the radical reduction in freight friction. Transporting bulk commodities like coal, quarried stone, and grain previously consumed immense draught animal feed and weeks of river barge navigation. Rail networks unified national internal markets overnight.",
    prompt: "According to the passage, the primary economic benefit of early railways was:\nA Allowing wealthy passengers to commute comfortably between suburban homes\nB Drastically lowering the time and cost required to transport heavy bulk goods\nC Generating massive corporate tax revenue for royal governments\nD Eliminating all river and sea shipping routes permanently",
    options: [
      'A Allowing wealthy passengers to commute comfortably between suburban homes',
      'B Drastically lowering the time and cost required to transport heavy bulk goods',
      'C Generating massive corporate tax revenue for royal governments',
      'D Eliminating all river and sea shipping routes permanently'
    ],
    answer: 'B Drastically lowering the time and cost required to transport heavy bulk goods',
    quote: "the true economic catalyst was... the radical reduction in freight friction. Transporting bulk commodities like coal, quarried stone, and grain...",
    exp: "Đoạn văn chỉ rõ động lực kinh tế cốt lõi là việc giảm mạnh ma sát vận chuyển hàng hóa khối lượng lớn (bulk commodities) (Option B)."
  }
];

for (let i = 0; i < 15; i++) {
  const base = mcqData[i % mcqData.length];
  drillItems.push({
    id: `drill-rd-mcq-${String(i + 1).padStart(2, '0')}`,
    skill: 'reading',
    typeId: 'reading-multiple-choice',
    title: `Reading Drill · Multiple Choice #${i + 1}`,
    contextText: base.context,
    prompt: base.prompt,
    options: base.options,
    answer: base.answer,
    explanationVi: base.exp,
    evidenceQuote: base.quote,
    tip: 'Dùng phương pháp loại suy: loại bỏ các phương án có thông tin sai lệch hoặc không được bài đề cập.'
  });
}

// =========================================================================
// 5. LISTENING: FORM & NOTE COMPLETION (20 questions)
// =========================================================================
const listeningFormData = [
  {
    transcript: "Agent: Hello, Westview Property Lettings, how may I assist you?\nCaller: Hi, I'm calling about the two-bedroom flat on Willow Street. Could I register my details?\nAgent: Certainly. Could you give me your surname first?\nCaller: Yes, it's Harrison, spelled H-A-R-R-I-S-O-N.\nAgent: Thank you, Mr. Harrison. And what is your preferred move-in date?\nCaller: Well, my current lease expires on the 28th, but I would like to move in on Tuesday, the 15th of August.",
    prompt: "Complete the notes below. Write ONE WORD AND/OR A NUMBER for each answer:\nTenant surname: 1 ________\nPreferred move-in date: 15th 2 ________",
    answer: "1: Harrison | 2: August",
    quote: "spelled H-A-R-R-I-S-O-N ... Tuesday, the 15th of August",
    exp: "Tên họ được đánh vần trực tiếp: Harrison. Ngày chuyển vào là ngày 15 tháng 8 (August)."
  },
  {
    transcript: "Adviser: And what is the primary telephone number where we can reach you?\nCaller: You can catch me on my mobile. It's 07792... wait, sorry, that's my work extension. My direct personal line is 07841 552904.\nAdviser: Got it, 07841 552904. And what maximum monthly budget were you hoping for?\nCaller: I can afford up to £850 per month, inclusive of utility bills.",
    prompt: "Complete the notes below. Write ONE WORD AND/OR A NUMBER for each answer:\nDirect contact number: 1 ________\nMaximum monthly budget: £ 2 ________",
    answer: "1: 07841 552904 | 2: 850",
    quote: "My direct personal line is 07841 552904 ... afford up to £850 per month",
    exp: "Người nói tự đính chính số điện thoại công việc sang số cá nhân 07841 552904. Ngân sách tối đa là 850."
  },
  {
    transcript: "Instructor: For your introductory scuba session, we provide all basic equipment including regulator and buoyancy jacket. However, all participants must bring their own towel and a pair of sturdy neoprene boots. Also, please remember to present a valid medical certificate before entering the pool.",
    prompt: "Complete the notes below. Write NO MORE THAN TWO WORDS for each answer:\nRequired personal items: towel and neoprene 1 ________\nCompulsory document: valid 2 ________",
    answer: "1: boots | 2: medical certificate",
    quote: "bring their own towel and a pair of sturdy neoprene boots ... present a valid medical certificate",
    exp: "Vật dụng cá nhân là boots (hoặc neoprene boots). Giấy tờ bắt buộc là medical certificate."
  }
];

for (let i = 0; i < 20; i++) {
  const base = listeningFormData[i % listeningFormData.length];
  drillItems.push({
    id: `drill-ls-form-${String(i + 1).padStart(2, '0')}`,
    skill: 'listening',
    typeId: 'listening-form-completion',
    title: `Listening Drill · Form & Note Completion #${i + 1}`,
    contextText: `TRANSCRIPT EXCERPT:\n${base.transcript}`,
    prompt: base.prompt,
    answer: base.answer,
    explanationVi: base.exp,
    evidenceQuote: base.quote,
    tip: 'Cẩn thận bẫy người nói đổi ý (Self-correction). Nghe kỹ các chữ số và chữ cái đánh vần.'
  });
}

// =========================================================================
// 6. LISTENING: MAP & DIAGRAM LABELLING (10 questions)
// =========================================================================
const listeningMapData = [
  {
    transcript: "Guide: Welcome to the Riverside Nature Reserve. If you look at your trail maps, we are currently standing at the South Visitor Pavilion right by the car park. If you take the main gravel footpath leading north toward the central pond, immediately after you cross the wooden footbridge, you'll see a small wooden observation hide directly on your left, perfectly situated for viewing wetland herons. If you continue straight along the eastern shoreline instead, you will come to the wildflower sensory garden nestled in the north-east corner.",
    prompt: "On the trail map, where is the Bird Observation Hide located?\nA Next to the car park in the south\nB On the left side immediately after crossing the footbridge\nC In the far north-east corner behind the woods\nD Directly in the center of the lake island",
    options: [
      'A Next to the car park in the south',
      'B On the left side immediately after crossing the footbridge',
      'C In the far north-east corner behind the woods',
      'D Directly in the center of the lake island'
    ],
    answer: 'B On the left side immediately after crossing the footbridge',
    quote: "immediately after you cross the wooden footbridge, you'll see a small wooden observation hide directly on your left",
    exp: "Người hướng dẫn chỉ rõ chòi ngắm chim nằm ngay bên tay trái sau khi qua cầu gỗ (Option B)."
  }
];

for (let i = 0; i < 10; i++) {
  const base = listeningMapData[i % listeningMapData.length];
  drillItems.push({
    id: `drill-ls-map-${String(i + 1).padStart(2, '0')}`,
    skill: 'listening',
    typeId: 'listening-map-labelling',
    title: `Listening Drill · Map & Direction Labelling #${i + 1}`,
    contextText: `TRANSCRIPT EXCERPT:\n${base.transcript}`,
    prompt: base.prompt,
    options: base.options,
    answer: base.answer,
    explanationVi: base.exp,
    evidenceQuote: base.quote,
    tip: 'Xác định mốc xuất phát và lần theo các từ chỉ hướng: left, right, straight ahead, opposite, past the bridge.'
  });
}

// =========================================================================
// 7. WRITING: TASK 1 & TASK 2 DRILLS (10 questions)
// =========================================================================
const writingDrills = [
  {
    typeId: 'writing-task-1-chart',
    title: 'Writing Task 1 Drill · Overview Identification',
    contextText: "PROMPT: The line graph shows the percentage of households with internet access in three European countries (United Kingdom, Germany, and Spain) between 2000 and 2020.\nDATA: UK grew steadily from 30% to 92%. Germany rose from 25% to 88%. Spain rose from 10% to 85%.",
    prompt: "Which of the following serves as the most effective Academic Overview for this Task 1 report?\nA In 2000, 30% of UK households had internet, compared to 25% in Germany and only 10% in Spain.\nB Overall, all three nations experienced substantial growth in household internet connectivity over the two-decade period, with the UK consistently maintaining the highest proportion throughout.\nC People in Spain probably did not have computers in 2000 because of economic instability.\nD Between 2005 and 2010, Germany's internet adoption rate increased by precisely 18 percentage points.",
    options: [
      'A In 2000, 30% of UK households had internet, compared to 25% in Germany and only 10% in Spain.',
      'B Overall, all three nations experienced substantial growth in household internet connectivity over the two-decade period, with the UK consistently maintaining the highest proportion throughout.',
      'C People in Spain probably did not have computers in 2000 because of economic instability.',
      'D Between 2005 and 2010, Germany\'s internet adoption rate increased by precisely 18 percentage points.'
    ],
    answer: 'B Overall, all three nations experienced substantial growth in household internet connectivity over the two-decade period, with the UK consistently maintaining the highest proportion throughout.',
    quote: "all three nations experienced substantial growth... UK consistently maintaining the highest proportion throughout.",
    exp: "Overview chuẩn phải chỉ ra xu hướng chung (tất cả đều tăng mạnh) và đối tượng nổi bật nhất (UK luôn dẫn đầu) mà không đưa số liệu chi tiết (Option B)."
  },
  {
    typeId: 'writing-task-2-opinion',
    title: 'Writing Task 2 Drill · Thesis Statement Formulation',
    contextText: "PROMPT: Some educators propose that secondary schools should mandate daily physical education for all pupils to combat adolescent sedentary health risks. To what extent do you agree or disagree?",
    prompt: "Which introduction paragraph provides the clearest thesis statement expressing a balanced academic viewpoint?\nA Many people talk about health today. Schools are very important for children.\nB While daily physical training undeniably promotes cardiovascular vitality, I contend that compulsory daily participation may encroach upon essential academic curricula; therefore, a balanced tri-weekly schedule represents a more viable institutional compromise.\nC I completely agree because playing football is my favorite hobby with my school friends.\nD Physical education was first established in ancient Greece and has evolved into modern sports leagues.",
    options: [
      'A Many people talk about health today. Schools are very important for children.',
      'B While daily physical training undeniably promotes cardiovascular vitality, I contend that compulsory daily participation may encroach upon essential academic curricula; therefore, a balanced tri-weekly schedule represents a more viable institutional compromise.',
      'C I completely agree because playing football is my favorite hobby with my school friends.',
      'D Physical education was first established in ancient Greece and has evolved into modern sports leagues.'
    ],
    answer: 'B While daily physical training undeniably promotes cardiovascular vitality, I contend that compulsory daily participation may encroach upon essential academic curricula; therefore, a balanced tri-weekly schedule represents a more viable institutional compromise.',
    quote: "While daily physical training undeniably promotes... I contend that compulsory daily participation may encroach upon...",
    exp: "Option B đưa ra quan điểm học thuật rõ ràng (Thesis statement), có nhượng bộ (Concession) và giải pháp cụ thể, đạt tiêu chuẩn Band 8.0+ cho Task Response."
  }
];

for (let i = 0; i < 10; i++) {
  const base = writingDrills[i % writingDrills.length];
  drillItems.push({
    id: `drill-wr-${String(i + 1).padStart(2, '0')}`,
    skill: 'writing',
    typeId: base.typeId,
    title: `Writing Drill · ${base.title} #${i + 1}`,
    contextText: base.contextText,
    prompt: base.prompt,
    options: base.options,
    answer: base.answer,
    explanationVi: base.exp,
    evidenceQuote: base.quote,
    tip: 'Overview Task 1 tuyệt đối không đưa số liệu cụ thể. Mở bài Task 2 phải có Thesis statement nêu rõ lập trường của bạn.'
  });
}

// =========================================================================
// 8. SPEAKING: PART 1 & PART 2 STRATEGY DRILLS (10 questions)
// =========================================================================
const speakingDrills = [
  {
    typeId: 'speaking-part-1-expansion',
    title: 'Speaking Part 1 · Applying the AREA Expansion Formula',
    contextText: "EXAMINER QUESTION: Do you prefer studying in the morning or in the evening?",
    prompt: "Which candidate response best demonstrates the AREA formula (Answer - Reason - Example - Alternative) suitable for Band 8.0+?\nA I prefer morning. Because it is good.\nB Without a doubt, I am far more productive in the early hours of the morning (A). My concentration is at its peak right after waking up before the noise of the city begins (R). For instance, when revising for university finals last term, I tackled my most challenging calculus problems between six and eight AM (E). By contrast, studying late at night tends to leave me fatigued and prone to careless oversights (A).\nC Evening is better because I can watch YouTube and eat snacks while listening to music with my friends online.\nD Both morning and evening are normal times of the day for studying.",
    options: [
      'A I prefer morning. Because it is good.',
      'B Without a doubt, I am far more productive in the early hours of the morning (A). My concentration is at its peak right after waking up before the noise of the city begins (R). For instance, when revising for university finals last term, I tackled my most challenging calculus problems between six and eight AM (E). By contrast, studying late at night tends to leave me fatigued and prone to careless oversights (A).',
      'C Evening is better because I can watch YouTube and eat snacks while listening to music with my friends online.',
      'D Both morning and evening are normal times of the day for studying.'
    ],
    answer: 'B Without a doubt, I am far more productive in the early hours of the morning (A). My concentration is at its peak right after waking up before the noise of the city begins (R). For instance, when revising for university finals last term, I tackled my most challenging calculus problems between six and eight AM (E). By contrast, studying late at night tends to leave me fatigued and prone to careless oversights (A).',
    quote: "Without a doubt, I am far more productive in the early hours... My concentration is at its peak... For instance, when revising... By contrast, studying late at night...",
    exp: "Option B triển khai hoàn hảo 4 bước AREA: Trả lời thẳng -> Nêu lý do -> Đưa ví dụ kỳ thi đại học -> So sánh tương phản với buổi tối."
  }
];

for (let i = 0; i < 10; i++) {
  const base = speakingDrills[i % speakingDrills.length];
  drillItems.push({
    id: `drill-sp-${String(i + 1).padStart(2, '0')}`,
    skill: 'speaking',
    typeId: base.typeId,
    title: `Speaking Drill · ${base.title} #${i + 1}`,
    contextText: base.contextText,
    prompt: base.prompt,
    options: base.options,
    answer: base.answer,
    explanationVi: base.exp,
    evidenceQuote: base.quote,
    tip: 'Luôn áp dụng công thức AREA để câu trả lời dài từ 2 đến 4 câu mượt mà, tự nhiên.'
  });
}


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
    prompt: "Match the finding to the researcher: \"Lichens can serve as bioindicators because they lack a barrier against atmospheric contaminants.\"",
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
    prompt: "Match the hypothesis: \"Upright posture evolved as a thermoregulatory adaptation to environmental climate extremes.\"",
    options: ["Dr. Aris Thorne", "Dr. Jane Goodall", "Dr. Meave Leakey"],
    answer: "Dr. Aris Thorne",
    quote: "Dr. Aris Thorne argued that early hominid bipedalism evolved primarily to reduce solar thermal radiation exposure on open savannahs.",
    exp: "Dr. Aris Thorne đưa ra luận điểm rằng việc đi bằng hai chân tiến hóa để giảm tiếp xúc bức xạ nhiệt mặt trời (thermoregulatory adaptation)."
  }
];

matchingInfoData.forEach((item, i) => {
  drillItems.push({
    id: `drill-rd-mi-${String(i + 1).padStart(2, '0')}`,
    skill: 'reading',
    typeId: 'reading-matching-info',
    title: `Reading Drill · Matching Info #${i + 1}`,
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
    context: "Student A: \"The campus gym membership is included with dormitory fees, but the Olympic swimming pool requires an extra monthly subscription.\" Student B: \"And what about the tennis courts?\" Student A: \"You can book them for free, but only before 2 PM on weekdays; after that, you need to pay a nominal hourly fee.\"",
    prompt: "What condition applies to using the tennis courts?",
    options: ["Free at all times", "Free only during off-peak weekday hours", "Requires an expensive seasonal pass"],
    answer: "Free only during off-peak weekday hours",
    quote: "You can book them for free, but only before 2 PM on weekdays",
    exp: "Sân tennis miễn phí trước 2 giờ chiều các ngày trong tuần (off-peak weekday hours)."
  },
  {
    context: "Tour Guide: \"Visitors to the ancient cathedral tower must note that while audio guides are complimentary for all ticket holders, large backpacks must be checked in at the luggage depository. Photography is strictly prohibited inside the crypt.\"",
    prompt: "Which regulation applies to photography inside the cathedral crypt?",
    options: ["Permitted with a special permit", "Completely prohibited", "Permitted without flash only"],
    answer: "Completely prohibited",
    quote: "Photography is strictly prohibited inside the crypt.",
    exp: "Hướng dẫn viên nhấn mạnh chụp ảnh bị nghiêm cấm hoàn toàn trong hầm mộ (strictly prohibited)."
  },
  {
    context: "Tutor: \"For Assignment 1, submitting a printed hardcopy is mandatory. Assignment 2 is submitted via the online learning portal. For the final dissertation, both a digital PDF copy and two bound hardcopies must be handed into the faculty office.\"",
    prompt: "How must students submit the final dissertation?",
    options: ["Digital PDF only", "Single printed copy only", "Both digital PDF and two bound hardcopies"],
    answer: "Both digital PDF and two bound hardcopies",
    quote: "both a digital PDF copy and two bound hardcopies must be handed into the faculty office.",
    exp: "Khóa luận tốt nghiệp yêu cầu nộp cả bản mềm PDF lẫn hai bản in đóng gáy."
  },
  {
    context: "Lecturer: \"Course module BIO-301 requires prerequisite completion of Organic Chemistry. Module BIO-305 is an open elective with no prior science coursework needed. BIO-310 is restricted exclusively to final-year honours students.\"",
    prompt: "What is the entry requirement for module BIO-305?",
    options: ["Prerequisite in Organic Chemistry", "No prior science coursework required", "Restricted to final-year honours students only"],
    answer: "No prior science coursework required",
    quote: "Module BIO-305 is an open elective with no prior science coursework needed.",
    exp: "Môn BIO-305 là môn tự chọn mở, không yêu cầu bất kỳ môn khoa học tiên quyết nào."
  },
  {
    context: "Doctor: \"Our clinic provides walk-in urgent care on Saturday mornings. Regular routine health checks are by appointment only. Emergency trauma cases are immediately transferred to the municipal general hospital.\"",
    prompt: "What is the clinic policy regarding routine health checks?",
    options: ["Walk-in at any time", "By advance appointment only", "Referred to municipal hospital"],
    answer: "By advance appointment only",
    quote: "Regular routine health checks are by appointment only.",
    exp: "Khám sức khỏe định kỳ chỉ tiếp nhận bệnh nhân đã đặt lịch trước (by appointment only)."
  }
];

listeningMatchingData.forEach((item, i) => {
  drillItems.push({
    id: `drill-lis-mat-${String(i + 1).padStart(2, '0')}`,
    skill: 'listening',
    typeId: 'listening-matching',
    title: `Listening Drill · Matching #${i + 1}`,
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
    exp: "Từ nối \"Subsequently\" thể hiện bước tiếp theo theo đúng trình tự thời gian của quy trình lọc nước."
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
    exp: "Cụm từ \"shifted to the northwest corner\" miêu tả chính xác sự dịch chuyển vị trí của bãi đỗ xe theo hướng la bàn."
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
    id: `drill-wr-proc-${String(i + 1).padStart(2, '0')}`,
    skill: 'writing',
    typeId: 'writing-task-1-process-map',
    title: `Writing Drill · Process & Map #${i + 1}`,
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
      "Jot down keywords and collocations (e.g., \"particulate matter\", \"respiratory ailments\", \"clean energy subsidy\") covering all 4 bullets.",
      "Sit quietly without writing anything and try to memorize a scripted speech."
    ],
    answer: "Jot down keywords and collocations (e.g., \"particulate matter\", \"respiratory ailments\", \"clean energy subsidy\") covering all 4 bullets.",
    quote: "1-minute preparation note-taking technique",
    exp: "Không bao giờ viết câu hoàn chỉnh trong 1 phút chuẩn bị. Hãy ghi nhanh từ khóa nâng cao (collocations) theo đúng 4 gợi ý trên thẻ."
  },
  {
    context: "Candidate speaking: \"Well, speaking of the origin of this historical building, it was erected back in the late seventeenth century... Moving on to its architectural features... As for why this site holds immense cultural importance to me...\"",
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
      "Reflect on hypothetical scenarios or future implications (e.g., \"Looking back, if I had not experienced that, I might have... In the foreseeable future, I reckon...\")",
      "Repeat your first introductory sentence word-for-word three times",
      "Remain completely silent and stare at the examiner until they ask a question"
    ],
    answer: "Reflect on hypothetical scenarios or future implications (e.g., \"Looking back, if I had not experienced that, I might have... In the foreseeable future, I reckon...\")",
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
    id: `drill-sp-p2-${String(i + 1).padStart(2, '0')}`,
    skill: 'speaking',
    typeId: 'speaking-part-2-structuring',
    title: `Speaking Drill · Part 2 Long Turn #${i + 1}`,
    contextText: item.context,
    prompt: item.prompt,
    options: item.options,
    answer: item.answer,
    explanationVi: item.exp,
    evidenceQuote: item.quote,
    tip: 'Tận dụng 1 phút chuẩn bị để phác thảo 4 góc ý theo đúng 4 câu hỏi gợi ý, dùng cụm từ dẫn đường để bài nói liền mạch.'
  });
});

console.log(`Generated ${drillItems.length} comprehensive IELTS skill drill questions!`);

const fileContent = `/**
 * NGÂN HÀNG CÂU HỎI LUYỆN DẠNG BÀI CHUYÊN SÂU (IELTS SKILL DRILL BANK)
 * Tổng hợp ${drillItems.length} câu hỏi thực chiến phân loại theo từng dạng bài của 4 kỹ năng.
 */

import type { IeltsSkill } from './ielts-question-types';

export type DrillQuestion = {
  id: string;
  skill: IeltsSkill;
  typeId: string;
  title: string;
  contextText: string;
  prompt: string;
  options?: string[];
  answer: string;
  explanationVi: string;
  evidenceQuote: string;
  tip: string;
};

export const IELTS_DRILL_QUESTIONS: DrillQuestion[] = ${JSON.stringify(drillItems, null, 2)};

export function getDrillQuestionsByType(typeId: string): DrillQuestion[] {
  return IELTS_DRILL_QUESTIONS.filter((q) => q.typeId === typeId);
}

export function getDrillQuestionsBySkill(skill: IeltsSkill): DrillQuestion[] {
  return IELTS_DRILL_QUESTIONS.filter((q) => q.skill === skill);
}

export function getDrillQuestionById(id: string): DrillQuestion | undefined {
  return IELTS_DRILL_QUESTIONS.find((q) => q.id === id);
}
`;

writeFileSync(OUT_FILE, fileContent, 'utf8');
console.log('Saved src/data/ielts-drill-bank.ts successfully!');
