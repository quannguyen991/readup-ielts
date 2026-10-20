/**
 * NGÂN HÀNG CÂU HỎI LUYỆN DẠNG BÀI CHUYÊN SÂU (IELTS SKILL DRILL BANK)
 * Tổng hợp 135 câu hỏi thực chiến phân loại theo từng dạng bài của 4 kỹ năng.
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

export const IELTS_DRILL_QUESTIONS: DrillQuestion[] = [
  {
    "id": "drill-rd-tfng-01",
    "skill": "reading",
    "typeId": "reading-tfng",
    "title": "Reading Drill · TFNG #1",
    "contextText": "The subterranean root systems of temperate conifers establish mutualistic fungal networks known as mycorrhizae. Through these fungal conduits, mature canopy trees actively translocate photosynthesized carbohydrates and biochemical signals to shaded seedlings in the understory, substantially accelerating their survival rates during seasonal droughts.",
    "prompt": "Do the following statement agree with the information in the passage?\n\"Mature conifer trees share nutrients with younger saplings via underground fungal pathways.\"",
    "options": [
      "TRUE",
      "FALSE",
      "NOT GIVEN"
    ],
    "answer": "TRUE",
    "explanationVi": "Bài đọc nêu rõ cây trưởng thành chuyển carbohydrate sang cây non qua mạng lưới nấm ngầm. Nhận định hoàn toàn trùng khớp với thông tin trong đoạn.",
    "evidenceQuote": "mature canopy trees actively translocate photosynthesized carbohydrates... to shaded seedlings... via mycorrhizae",
    "tip": "Luôn tìm từ khóa phủ định hoặc so sánh tuyệt đối (all, solely, completely). Nếu bài không nói đến chi tiết so sánh, chọn ngay NOT GIVEN."
  },
  {
    "id": "drill-rd-tfng-02",
    "skill": "reading",
    "typeId": "reading-tfng",
    "title": "Reading Drill · TFNG #2",
    "contextText": "Archaeological surveys at the Neolithic site of Catalhoyuk revealed dense residential clusters with rooftop entrances rather than ground-level doorways. While early twentieth-century historians hypothesized that this architectural layout served exclusively as a defense mechanism against marauding nomadic tribes, contemporary isotopic analysis of skeletal remains demonstrates that interpersonal violence was exceedingly rare.",
    "prompt": "Do the following statement agree with the information in the passage?\n\"The architectural design of Catalhoyuk was solely created to repel hostile military attacks.\"",
    "options": [
      "TRUE",
      "FALSE",
      "NOT GIVEN"
    ],
    "answer": "FALSE",
    "explanationVi": "Từ 'solely' (duy nhất) mang nghĩa tuyệt đối. Bài đọc nêu rõ đây chỉ là giả thuyết cũ của các học giả thế kỷ trước, còn bằng chứng hiện đại cho thấy bạo lực ở đây cực kỳ hiếm hoi. Nhận định này mâu thuẫn với bài đọc (FALSE).",
    "evidenceQuote": "While early twentieth-century historians hypothesized that this architectural layout served exclusively as a defense mechanism... contemporary analysis... demonstrates that interpersonal violence was exceedingly rare.",
    "tip": "Luôn tìm từ khóa phủ định hoặc so sánh tuyệt đối (all, solely, completely). Nếu bài không nói đến chi tiết so sánh, chọn ngay NOT GIVEN."
  },
  {
    "id": "drill-rd-tfng-03",
    "skill": "reading",
    "typeId": "reading-tfng",
    "title": "Reading Drill · TFNG #3",
    "contextText": "Recent advances in cryogenic electron microscopy have enabled biochemists to determine the three-dimensional structural architecture of integral membrane proteins at near-atomic resolution. The technique requires flash-freezing biological samples in liquid ethane to preserve their native conformations without crystallization artifacts.",
    "prompt": "Do the following statement agree with the information in the passage?\n\"Liquid ethane is significantly more expensive to procure than liquid nitrogen in biochemical laboratories.\"",
    "options": [
      "TRUE",
      "FALSE",
      "NOT GIVEN"
    ],
    "answer": "NOT GIVEN",
    "explanationVi": "Bài đọc có nhắc đến việc dùng liquid ethane để làm đông lạnh mẫu, nhưng hoàn toàn KHÔNG đề cập hay so sánh chi phí giá thành (cost/expensive) giữa liquid ethane và liquid nitrogen. Vì vậy đáp án là NOT GIVEN.",
    "evidenceQuote": "The technique requires flash-freezing biological samples in liquid ethane...",
    "tip": "Luôn tìm từ khóa phủ định hoặc so sánh tuyệt đối (all, solely, completely). Nếu bài không nói đến chi tiết so sánh, chọn ngay NOT GIVEN."
  },
  {
    "id": "drill-rd-tfng-04",
    "skill": "reading",
    "typeId": "reading-tfng",
    "title": "Reading Drill · TFNG #4",
    "contextText": "The introduction of the Gutenberg movable type printing press in 1440 exponentially reduced the cost of book production across Western Europe. By the dawn of the sixteenth century, an estimated twenty million volumes had been printed, creating unprecedented opportunities for vernacular literacy outside monastic cloisters.",
    "prompt": "Do the following statement agree with the information in the passage?\n\"Prior to the movable type press, European books were predominantly hand-copied and prohibitively expensive for common citizens.\"",
    "options": [
      "TRUE",
      "FALSE",
      "NOT GIVEN"
    ],
    "answer": "TRUE",
    "explanationVi": "Bài đọc xác nhận máy in của Gutenberg đã giảm chi phí sản xuất sách một cách chóng mặt và mở ra cơ hội đọc sách chưa từng có ngoài các tu viện, suy ra trước đó sách đắt đỏ và chỉ giới hạn trong tu viện (TRUE).",
    "evidenceQuote": "exponentially reduced the cost of book production... creating unprecedented opportunities for vernacular literacy outside monastic cloisters.",
    "tip": "Luôn tìm từ khóa phủ định hoặc so sánh tuyệt đối (all, solely, completely). Nếu bài không nói đến chi tiết so sánh, chọn ngay NOT GIVEN."
  },
  {
    "id": "drill-rd-tfng-05",
    "skill": "reading",
    "typeId": "reading-tfng",
    "title": "Reading Drill · TFNG #5",
    "contextText": "Geothermal power installations in Iceland harness high-temperature steam plumes from volcanic subterranean aquifers to drive turbine generators. Although seismic activity occasionally misaligns deep boreholes, engineered flexible expansion joints have successfully mitigated the vast majority of structural fractures.",
    "prompt": "Do the following statement agree with the information in the passage?\n\"Seismic tremors in Iceland regularly cause permanent, irreparable damage to all geothermal power facilities.\"",
    "options": [
      "TRUE",
      "FALSE",
      "NOT GIVEN"
    ],
    "answer": "FALSE",
    "explanationVi": "Đề bài dùng 'permanent, irreparable damage to all facilities', trong khi bài đọc chỉ ra các khớp nối linh hoạt đã giảm thiểu thành công đại đa số nứt vỡ (mitigated the vast majority). Nhận định sai sự thật (FALSE).",
    "evidenceQuote": "engineered flexible expansion joints have successfully mitigated the vast majority of structural fractures.",
    "tip": "Luôn tìm từ khóa phủ định hoặc so sánh tuyệt đối (all, solely, completely). Nếu bài không nói đến chi tiết so sánh, chọn ngay NOT GIVEN."
  },
  {
    "id": "drill-rd-tfng-06",
    "skill": "reading",
    "typeId": "reading-tfng",
    "title": "Reading Drill · TFNG #6",
    "contextText": "Marine biologists investigating the migratory navigation of loggerhead sea turtles discovered that hatchlings possess magnetic mineral crystals in their ethmoid bones. These geomagnetic receptors enable hatchlings to detect both the inclination angle and the intensity gradient of the Earth's magnetic envelope.",
    "prompt": "Do the following statement agree with the information in the passage?\n\"All species of marine reptiles utilize geomagnetic receptors for ocean navigation.\"",
    "options": [
      "TRUE",
      "FALSE",
      "NOT GIVEN"
    ],
    "answer": "NOT GIVEN",
    "explanationVi": "Bài đọc chỉ đề cập đến loài 'loggerhead sea turtles' (rùa quản đồng), không có bất kỳ thông tin nào khẳng định 'ALL species of marine reptiles' (tất cả các loài bò sát biển) đều có cơ chế này (NOT GIVEN).",
    "evidenceQuote": "Marine biologists investigating the migratory navigation of loggerhead sea turtles discovered...",
    "tip": "Luôn tìm từ khóa phủ định hoặc so sánh tuyệt đối (all, solely, completely). Nếu bài không nói đến chi tiết so sánh, chọn ngay NOT GIVEN."
  },
  {
    "id": "drill-rd-tfng-07",
    "skill": "reading",
    "typeId": "reading-tfng",
    "title": "Reading Drill · TFNG #7",
    "contextText": "Urban climatology studies indicate that retrofitting commercial rooftops with reflective white membranes reduces local ambient air temperatures by up to two degrees Celsius during midday heat extremes. This passive cooling technique diminishes building air-conditioning energy demand by an estimated fifteen percent.",
    "prompt": "Do the following statement agree with the information in the passage?\n\"Installing white reflective membranes on rooftops can lower indoor air-conditioning power consumption.\"",
    "options": [
      "TRUE",
      "FALSE",
      "NOT GIVEN"
    ],
    "answer": "TRUE",
    "explanationVi": "Bài đọc khẳng định công nghệ này làm giảm nhu cầu năng lượng điều hòa khoảng 15%, tương đương với 'lower power consumption' (TRUE).",
    "evidenceQuote": "This passive cooling technique diminishes building air-conditioning energy demand by an estimated fifteen percent.",
    "tip": "Luôn tìm từ khóa phủ định hoặc so sánh tuyệt đối (all, solely, completely). Nếu bài không nói đến chi tiết so sánh, chọn ngay NOT GIVEN."
  },
  {
    "id": "drill-rd-tfng-08",
    "skill": "reading",
    "typeId": "reading-tfng",
    "title": "Reading Drill · TFNG #8",
    "contextText": "The acoustic anatomy of odontocete cetaceans, such as bottlenose dolphins and sperm whales, features a specialized fatty organ located in the forehead termed the melon. The melon focuses pulsed sonic clicks emitted from the phonic lips into a concentrated directional acoustic beam used for echolocation and spatial mapping.",
    "prompt": "Do the following statement agree with the information in the passage?\n\"The melon organ in dolphins is primarily used to store excess metabolic fat during winter food shortages.\"",
    "options": [
      "TRUE",
      "FALSE",
      "NOT GIVEN"
    ],
    "answer": "FALSE",
    "explanationVi": "Cơ quan melon có chức năng định hướng chùm sóng âm phục vụ định vị echolocation, chứ không phải dùng để dự trữ mỡ chống đói mùa đông (FALSE).",
    "evidenceQuote": "The melon focuses pulsed sonic clicks emitted from the phonic lips into a concentrated directional acoustic beam used for echolocation...",
    "tip": "Luôn tìm từ khóa phủ định hoặc so sánh tuyệt đối (all, solely, completely). Nếu bài không nói đến chi tiết so sánh, chọn ngay NOT GIVEN."
  },
  {
    "id": "drill-rd-tfng-09",
    "skill": "reading",
    "typeId": "reading-tfng",
    "title": "Reading Drill · TFNG #9",
    "contextText": "During the Bronze Age collapse circa 1177 BCE, prominent eastern Mediterranean civilizations, including the Mycenaeans and the Hittites, suffered simultaneous societal disintegration. Modern historical climatologists attribute this crisis to a severe multi-decade mega-drought documented in speleothem cave records.",
    "prompt": "Do the following statement agree with the information in the passage?\n\"A prolonged lack of rainfall was a major contributing factor to the collapse of Bronze Age Mediterranean civilizations.\"",
    "options": [
      "TRUE",
      "FALSE",
      "NOT GIVEN"
    ],
    "answer": "TRUE",
    "explanationVi": "'A prolonged lack of rainfall' chính là paraphrase của 'severe multi-decade mega-drought'. Khẳng định này hoàn toàn đúng (TRUE).",
    "evidenceQuote": "Modern historical climatologists attribute this crisis to a severe multi-decade mega-drought...",
    "tip": "Luôn tìm từ khóa phủ định hoặc so sánh tuyệt đối (all, solely, completely). Nếu bài không nói đến chi tiết so sánh, chọn ngay NOT GIVEN."
  },
  {
    "id": "drill-rd-tfng-10",
    "skill": "reading",
    "typeId": "reading-tfng",
    "title": "Reading Drill · TFNG #10",
    "contextText": "The James Webb Space Telescope operates in a halo orbit around the Sun-Earth Lagrange point L2, approximately 1.5 million kilometers beyond Earth's nightside. Its five-layer polyimide sunshield maintains the infrared science instruments at temperatures below fifty Kelvin.",
    "prompt": "Do the following statement agree with the information in the passage?\n\"Astronauts can be dispatched on routine maintenance flights to service the James Webb Space Telescope in orbit.\"",
    "options": [
      "TRUE",
      "FALSE",
      "NOT GIVEN"
    ],
    "answer": "NOT GIVEN",
    "explanationVi": "Đoạn văn chỉ nêu vị trí quỹ đạo cách Trái đất 1.5 triệu km và tấm chắn nhiệt, hoàn toàn không bàn luận về việc có hay không thể cử phi hành gia lên bảo trì (NOT GIVEN).",
    "evidenceQuote": "operates in a halo orbit around... 1.5 million kilometers beyond Earth...",
    "tip": "Luôn tìm từ khóa phủ định hoặc so sánh tuyệt đối (all, solely, completely). Nếu bài không nói đến chi tiết so sánh, chọn ngay NOT GIVEN."
  },
  {
    "id": "drill-rd-tfng-11",
    "skill": "reading",
    "typeId": "reading-tfng",
    "title": "Reading Drill · TFNG #11",
    "contextText": "Dendrochronology, or tree-ring dating, allows paleoclimatologists to reconstruct historical precipitation patterns with annual precision. In semi-arid regions, wider growth rings indicate abundant moisture during the vernal growth spurt, whereas narrow rings correspond to severe drought stress.",
    "prompt": "Do the following statement agree with the information in the passage?\n\"In semi-arid regions, narrow tree rings reflect periods of high annual rainfall.\"",
    "options": [
      "TRUE",
      "FALSE",
      "NOT GIVEN"
    ],
    "answer": "FALSE",
    "explanationVi": "Vòng cây hẹp phản ánh thời kỳ hạn hán (drought stress), trái ngược hoàn toàn với câu hỏi nói vòng hẹp phản ánh mưa nhiều (FALSE).",
    "evidenceQuote": "whereas narrow rings correspond to severe drought stress.",
    "tip": "Luôn tìm từ khóa phủ định hoặc so sánh tuyệt đối (all, solely, completely). Nếu bài không nói đến chi tiết so sánh, chọn ngay NOT GIVEN."
  },
  {
    "id": "drill-rd-tfng-12",
    "skill": "reading",
    "typeId": "reading-tfng",
    "title": "Reading Drill · TFNG #12",
    "contextText": "Behavioral economics experiments demonstrate that human decision-makers exhibit pronounced loss aversion, typically valuing avoiding an immediate financial loss roughly twice as intensely as acquiring an equivalent monetary gain. This cognitive asymmetry often results in suboptimal investment conservatism.",
    "prompt": "Do the following statement agree with the information in the passage?\n\"Most people feel the psychological discomfort of losing money more acutely than the pleasure of gaining the same sum.\"",
    "options": [
      "TRUE",
      "FALSE",
      "NOT GIVEN"
    ],
    "answer": "TRUE",
    "explanationVi": "Bài đọc nêu rõ tâm lý tránh mất mát có trọng số gấp đôi so với niềm vui khi đạt được cùng một khoản tiền (loss aversion). Nhận định hoàn toàn đúng (TRUE).",
    "evidenceQuote": "typically valuing avoiding an immediate financial loss roughly twice as intensely as acquiring an equivalent monetary gain.",
    "tip": "Luôn tìm từ khóa phủ định hoặc so sánh tuyệt đối (all, solely, completely). Nếu bài không nói đến chi tiết so sánh, chọn ngay NOT GIVEN."
  },
  {
    "id": "drill-rd-tfng-13",
    "skill": "reading",
    "typeId": "reading-tfng",
    "title": "Reading Drill · TFNG #13",
    "contextText": "Venice's historical architectural foundations rely upon hundreds of thousands of vertical alder wood pilings driven deep into the anaerobic silt of the lagoon bed. Submerged in oxygen-depleted mud, the timber petrified rather than rotting, sustaining stone palazzos for over half a millennium.",
    "prompt": "Do the following statement agree with the information in the passage?\n\"The wood pilings beneath Venetian buildings decayed rapidly due to continuous exposure to saltwater bacteria.\"",
    "options": [
      "TRUE",
      "FALSE",
      "NOT GIVEN"
    ],
    "answer": "FALSE",
    "explanationVi": "Bài đọc chỉ rõ cọc gỗ bị hóa đá (petrified) chứ không hề bị mục rữa (rather than rotting) nhờ môi trường yếm khí (FALSE).",
    "evidenceQuote": "Submerged in oxygen-depleted mud, the timber petrified rather than rotting...",
    "tip": "Luôn tìm từ khóa phủ định hoặc so sánh tuyệt đối (all, solely, completely). Nếu bài không nói đến chi tiết so sánh, chọn ngay NOT GIVEN."
  },
  {
    "id": "drill-rd-tfng-14",
    "skill": "reading",
    "typeId": "reading-tfng",
    "title": "Reading Drill · TFNG #14",
    "contextText": "Autonomous acoustic monitoring stations deployed across tropical rainforests use artificial neural networks to detect the calls of endangered avian species from continuous audio feeds. The system processes soundscapes around the clock without physical human presence.",
    "prompt": "Do the following statement agree with the information in the passage?\n\"Audio monitoring systems in tropical rainforests require continuous on-site human supervision to function.\"",
    "options": [
      "TRUE",
      "FALSE",
      "NOT GIVEN"
    ],
    "answer": "FALSE",
    "explanationVi": "'without physical human presence' mâu thuẫn trực tiếp với 'require continuous on-site human supervision' (FALSE).",
    "evidenceQuote": "The system processes soundscapes around the clock without physical human presence.",
    "tip": "Luôn tìm từ khóa phủ định hoặc so sánh tuyệt đối (all, solely, completely). Nếu bài không nói đến chi tiết so sánh, chọn ngay NOT GIVEN."
  },
  {
    "id": "drill-rd-tfng-15",
    "skill": "reading",
    "typeId": "reading-tfng",
    "title": "Reading Drill · TFNG #15",
    "contextText": "Linguists estimate that roughly half of the world's approximately seven thousand spoken languages face extinction by the end of the twenty-first century. Digital archive initiatives prioritize recording phonetic vocabularies and narrative folklore from the few remaining elderly fluent speakers.",
    "prompt": "Do the following statement agree with the information in the passage?\n\"More than ninety percent of indigenous languages will disappear within the next two decades.\"",
    "options": [
      "TRUE",
      "FALSE",
      "NOT GIVEN"
    ],
    "answer": "NOT GIVEN",
    "explanationVi": "Bài đọc nêu khoảng một nửa (50%) trước cuối thế kỷ 21, không có số liệu nào đề cập 'hơn 90% trong 2 thập kỷ tới' (NOT GIVEN).",
    "evidenceQuote": "roughly half of the world's approximately seven thousand spoken languages face extinction by the end of the twenty-first century.",
    "tip": "Luôn tìm từ khóa phủ định hoặc so sánh tuyệt đối (all, solely, completely). Nếu bài không nói đến chi tiết so sánh, chọn ngay NOT GIVEN."
  },
  {
    "id": "drill-rd-tfng-16",
    "skill": "reading",
    "typeId": "reading-tfng",
    "title": "Reading Drill · TFNG #16",
    "contextText": "Photosynthetic cyanobacteria that evolved approximately 2.4 billion years ago released molecular oxygen as a byproduct of water photolysis, precipitating the Great Oxidation Event that permanently restructured Earth's atmospheric chemistry.",
    "prompt": "Do the following statement agree with the information in the passage?\n\"The Great Oxidation Event was triggered by the photosynthetic metabolic activity of prehistoric cyanobacteria.\"",
    "options": [
      "TRUE",
      "FALSE",
      "NOT GIVEN"
    ],
    "answer": "TRUE",
    "explanationVi": "'precipitating' đồng nghĩa với 'triggered'. Khẳng định hoàn toàn đúng với văn bản (TRUE).",
    "evidenceQuote": "Photosynthetic cyanobacteria... released molecular oxygen... precipitating the Great Oxidation Event...",
    "tip": "Luôn tìm từ khóa phủ định hoặc so sánh tuyệt đối (all, solely, completely). Nếu bài không nói đến chi tiết so sánh, chọn ngay NOT GIVEN."
  },
  {
    "id": "drill-rd-tfng-17",
    "skill": "reading",
    "typeId": "reading-tfng",
    "title": "Reading Drill · TFNG #17",
    "contextText": "High-speed rail networks operating in East Asia and Western Europe have largely replaced regional passenger aviation on corridor routes of less than six hundred kilometers due to competitive door-to-door transit times and lower carbon footprints.",
    "prompt": "Do the following statement agree with the information in the passage?\n\"For trips under 600 kilometers, bullet trains are generally faster in total travel time than airplanes when considering city-center access.\"",
    "options": [
      "TRUE",
      "FALSE",
      "NOT GIVEN"
    ],
    "answer": "TRUE",
    "explanationVi": "'door-to-door transit times' bao gồm cả việc đi đến trung tâm thành phố. Nhận định này hoàn toàn phù hợp với nội dung bài (TRUE).",
    "evidenceQuote": "replaced regional passenger aviation on corridor routes of less than six hundred kilometers due to competitive door-to-door transit times...",
    "tip": "Luôn tìm từ khóa phủ định hoặc so sánh tuyệt đối (all, solely, completely). Nếu bài không nói đến chi tiết so sánh, chọn ngay NOT GIVEN."
  },
  {
    "id": "drill-rd-tfng-18",
    "skill": "reading",
    "typeId": "reading-tfng",
    "title": "Reading Drill · TFNG #18",
    "contextText": "The Rosetta Stone, discovered by French soldiers in 1799, features the identical decree inscribed in three distinct scripts: Ancient Egyptian hieroglyphs, Demotic script, and Ancient Greek. Because classical scholars could already decipher Greek, the bilingual inscription unlocked the grammatical code of hieroglyphs.",
    "prompt": "Do the following statement agree with the information in the passage?\n\"The text on the Rosetta Stone was inscribed in four completely unrelated languages.\"",
    "options": [
      "TRUE",
      "FALSE",
      "NOT GIVEN"
    ],
    "answer": "FALSE",
    "explanationVi": "Chỉ có 3 loại chữ viết (three distinct scripts) chứ không phải 4 ngôn ngữ (four languages) (FALSE).",
    "evidenceQuote": "features the identical decree inscribed in three distinct scripts...",
    "tip": "Luôn tìm từ khóa phủ định hoặc so sánh tuyệt đối (all, solely, completely). Nếu bài không nói đến chi tiết so sánh, chọn ngay NOT GIVEN."
  },
  {
    "id": "drill-rd-tfng-19",
    "skill": "reading",
    "typeId": "reading-tfng",
    "title": "Reading Drill · TFNG #19",
    "contextText": "Urban vertical farming systems use closed-loop hydroponic water recirculation, consuming up to ninety-five percent less water per kilogram of produce than traditional open-field furrow irrigation. However, the capital expenditure required for artificial LED illumination remains a considerable economic obstacle.",
    "prompt": "Do the following statement agree with the information in the passage?\n\"Vertical farming facilities currently produce all commercial staple crops at lower market prices than open-field farms.\"",
    "options": [
      "TRUE",
      "FALSE",
      "NOT GIVEN"
    ],
    "answer": "FALSE",
    "explanationVi": "Chi phí đầu tư đèn LED vẫn là rào cản tài chính lớn, không hề có chuyện sản xuất mọi cây lương thực rẻ hơn trang trại truyền thống (FALSE).",
    "evidenceQuote": "However, the capital expenditure required for artificial LED illumination remains a considerable economic obstacle.",
    "tip": "Luôn tìm từ khóa phủ định hoặc so sánh tuyệt đối (all, solely, completely). Nếu bài không nói đến chi tiết so sánh, chọn ngay NOT GIVEN."
  },
  {
    "id": "drill-rd-tfng-20",
    "skill": "reading",
    "typeId": "reading-tfng",
    "title": "Reading Drill · TFNG #20",
    "contextText": "Deep-sea hydrothermal vent ecologies derive their metabolic energy from bacterial chemosynthesis of hydrogen sulfide rather than solar photosynthesis, supporting diverse communities of giant tubeworms, vent crabs, and blind shrimp.",
    "prompt": "Do the following statement agree with the information in the passage?\n\"Giant tubeworms living around hydrothermal vents depend on sunlight filtering through the ocean depths for their energy.\"",
    "options": [
      "TRUE",
      "FALSE",
      "NOT GIVEN"
    ],
    "answer": "FALSE",
    "explanationVi": "Sinh vật sống dựa vào hóa tổng hợp (chemosynthesis) chứ không dựa vào ánh sáng mặt trời (rather than solar photosynthesis) (FALSE).",
    "evidenceQuote": "derive their metabolic energy from bacterial chemosynthesis... rather than solar photosynthesis...",
    "tip": "Luôn tìm từ khóa phủ định hoặc so sánh tuyệt đối (all, solely, completely). Nếu bài không nói đến chi tiết so sánh, chọn ngay NOT GIVEN."
  },
  {
    "id": "drill-rd-hd-01",
    "skill": "reading",
    "typeId": "reading-matching-headings",
    "title": "Reading Drill · Matching Headings #1",
    "contextText": "For centuries, the extraction of natural cork in the Mediterranean basin was regarded as a purely artisanal endeavor. Today, however, cork oak forestry is recognized as a sophisticated model of agroforestry conservation. Because harvesters strip only the renewable outer bark without felling the trunk, a single tree can produce virgin cork every nine years for over two centuries, simultaneously preserving fragile semi-arid soil and providing vital wintering habitats for migrating birds.",
    "prompt": "Choose the correct heading for this paragraph:",
    "options": [
      "i The economic decline of traditional Mediterranean agriculture",
      "ii Ecological and sustainable dimensions of cork harvesting",
      "iii Mechanical advancements in timber felling equipment",
      "iv Chemical properties of synthetic bottle stoppers"
    ],
    "answer": "ii Ecological and sustainable dimensions of cork harvesting",
    "explanationVi": "Đoạn văn nhấn mạnh tính bền vững sinh thái (không cần chặt cây, bảo vệ đất và chim muông) của việc thu hoạch vỏ sồi làm nút bấc (Heading ii).",
    "evidenceQuote": "recognized as a sophisticated model of agroforestry conservation... strip only the renewable outer bark without felling the trunk... preserving fragile soil",
    "tip": "Tìm câu chủ đề (thường ở câu đầu hoặc câu sau liên từ However, In contrast). Chọn tiêu đề khái quát toàn đoạn, tránh tiêu đề chỉ nói một chi tiết nhỏ."
  },
  {
    "id": "drill-rd-hd-02",
    "skill": "reading",
    "typeId": "reading-matching-headings",
    "title": "Reading Drill · Matching Headings #2",
    "contextText": "In contrast to earlier assumptions that memory functions as an inert archival vault, cognitive neuroscience reveals that the act of recollection fundamentally destabilizes stored synaptic representations. Each time a memory is retrieved, it enters a transient labile phase where it must undergo cellular reconsolidation, rendering it susceptible to modification, emotional re-framing, or distortion based on present contextual cues.",
    "prompt": "Choose the correct heading for this paragraph:",
    "options": [
      "i The mechanical archiving of sensory impressions",
      "ii The dynamic and reconstructive nature of memory retrieval",
      "iii Therapeutic pharmaceuticals for severe amnesia",
      "iv Cognitive decline during natural biological aging"
    ],
    "answer": "ii The dynamic and reconstructive nature of memory retrieval",
    "explanationVi": "Đoạn văn chứng minh việc nhớ lại không phải là lấy tài liệu từ kho lưu trữ bất biến mà là một quá trình động, dễ bị tái cấu trúc và biến đổi (Heading ii).",
    "evidenceQuote": "act of recollection fundamentally destabilizes stored synaptic representations... susceptible to modification... based on present contextual cues",
    "tip": "Tìm câu chủ đề (thường ở câu đầu hoặc câu sau liên từ However, In contrast). Chọn tiêu đề khái quát toàn đoạn, tránh tiêu đề chỉ nói một chi tiết nhỏ."
  },
  {
    "id": "drill-rd-hd-03",
    "skill": "reading",
    "typeId": "reading-matching-headings",
    "title": "Reading Drill · Matching Headings #3",
    "contextText": "The deployment of microgrid architecture combined with community-scale battery storage is decentralizing municipal power distribution. Rather than relying exclusively on massive centralized fossil-fuel power stations requiring hundreds of miles of transmission cables, residential districts are installing photovoltaic arrays on civic buildings and exchanging surplus kilowatt-hours locally through peer-to-peer digital trading networks.",
    "prompt": "Choose the correct heading for this paragraph:",
    "options": [
      "i Environmental hazards of lithium-ion battery disposal",
      "ii A transition toward decentralized community energy grids",
      "iii Rising tariffs in international fossil fuel shipping",
      "iv Nuclear reactor construction in modern suburban zones"
    ],
    "answer": "ii A transition toward decentralized community energy grids",
    "explanationVi": "Đoạn văn phân tích sự dịch chuyển từ mạng lưới điện tập trung sang mạng lưới phân tán quy mô cộng đồng (Heading ii).",
    "evidenceQuote": "decentralizing municipal power distribution... installing photovoltaic arrays on civic buildings and exchanging surplus kilowatt-hours locally",
    "tip": "Tìm câu chủ đề (thường ở câu đầu hoặc câu sau liên từ However, In contrast). Chọn tiêu đề khái quát toàn đoạn, tránh tiêu đề chỉ nói một chi tiết nhỏ."
  },
  {
    "id": "drill-rd-hd-04",
    "skill": "reading",
    "typeId": "reading-matching-headings",
    "title": "Reading Drill · Matching Headings #4",
    "contextText": "Early archaeological expeditions in the Nile valley concentrated almost exclusively on monumental architecture, royal mortuary complexes, and precious funerary artifacts. In recent decades, however, paleobotanical sediment sifting and isotopic bone analysis have redirected academic focus toward the mundane daily existence of ordinary agricultural workers, their dietary staples, seasonal health hardships, and domestic ceramic utensils.",
    "prompt": "Choose the correct heading for this paragraph:",
    "options": [
      "i Engineering techniques behind royal Egyptian pyramids",
      "ii A scholarly shift toward everyday ancient domestic life",
      "iii Methods for cataloging royal gold treasures in museums",
      "iv Climatological causes of ancient drought in North Africa"
    ],
    "answer": "ii A scholarly shift toward everyday ancient domestic life",
    "explanationVi": "Trọng tâm của đoạn là sự thay đổi trong nghiên cứu khảo cổ học từ lăng tẩm hoàng gia sang đời sống thường nhật của người dân lao động cổ đại (Heading ii).",
    "evidenceQuote": "redirected academic focus toward the mundane daily existence of ordinary agricultural workers, their dietary staples...",
    "tip": "Tìm câu chủ đề (thường ở câu đầu hoặc câu sau liên từ However, In contrast). Chọn tiêu đề khái quát toàn đoạn, tránh tiêu đề chỉ nói một chi tiết nhỏ."
  },
  {
    "id": "drill-rd-hd-05",
    "skill": "reading",
    "typeId": "reading-matching-headings",
    "title": "Reading Drill · Matching Headings #5",
    "contextText": "While artificial intelligence algorithms have demonstrated superhuman accuracy in diagnosing radiographic medical imaging, clinical implementation has encountered significant psychological resistance from patients. Surveys indicate that individuals feel uncomfortable receiving serious health prognoses from automated diagnostic systems without empathetic human interpersonal consultation, even when the software has a superior empirical track record.",
    "prompt": "Choose the correct heading for this paragraph:",
    "options": [
      "i Technical hardware bottlenecks in diagnostic computing",
      "ii The human and emotional barriers to AI adoption in healthcare",
      "iii Legal malpractice disputes in automated pharmacy dispensing",
      "iv Financial profits generated by medical robotics manufacturers"
    ],
    "answer": "ii The human and emotional barriers to AI adoption in healthcare",
    "explanationVi": "Đoạn văn nêu bật rào cản về mặt tâm lý và cảm xúc của bệnh nhân đối với việc ứng dụng AI trong y tế (Heading ii).",
    "evidenceQuote": "clinical implementation has encountered significant psychological resistance from patients... feel uncomfortable... without empathetic human consultation",
    "tip": "Tìm câu chủ đề (thường ở câu đầu hoặc câu sau liên từ However, In contrast). Chọn tiêu đề khái quát toàn đoạn, tránh tiêu đề chỉ nói một chi tiết nhỏ."
  },
  {
    "id": "drill-rd-hd-06",
    "skill": "reading",
    "typeId": "reading-matching-headings",
    "title": "Reading Drill · Matching Headings #6",
    "contextText": "For centuries, the extraction of natural cork in the Mediterranean basin was regarded as a purely artisanal endeavor. Today, however, cork oak forestry is recognized as a sophisticated model of agroforestry conservation. Because harvesters strip only the renewable outer bark without felling the trunk, a single tree can produce virgin cork every nine years for over two centuries, simultaneously preserving fragile semi-arid soil and providing vital wintering habitats for migrating birds.",
    "prompt": "Choose the correct heading for this paragraph:",
    "options": [
      "i The economic decline of traditional Mediterranean agriculture",
      "ii Ecological and sustainable dimensions of cork harvesting",
      "iii Mechanical advancements in timber felling equipment",
      "iv Chemical properties of synthetic bottle stoppers"
    ],
    "answer": "ii Ecological and sustainable dimensions of cork harvesting",
    "explanationVi": "Đoạn văn nhấn mạnh tính bền vững sinh thái (không cần chặt cây, bảo vệ đất và chim muông) của việc thu hoạch vỏ sồi làm nút bấc (Heading ii).",
    "evidenceQuote": "recognized as a sophisticated model of agroforestry conservation... strip only the renewable outer bark without felling the trunk... preserving fragile soil",
    "tip": "Tìm câu chủ đề (thường ở câu đầu hoặc câu sau liên từ However, In contrast). Chọn tiêu đề khái quát toàn đoạn, tránh tiêu đề chỉ nói một chi tiết nhỏ."
  },
  {
    "id": "drill-rd-hd-07",
    "skill": "reading",
    "typeId": "reading-matching-headings",
    "title": "Reading Drill · Matching Headings #7",
    "contextText": "In contrast to earlier assumptions that memory functions as an inert archival vault, cognitive neuroscience reveals that the act of recollection fundamentally destabilizes stored synaptic representations. Each time a memory is retrieved, it enters a transient labile phase where it must undergo cellular reconsolidation, rendering it susceptible to modification, emotional re-framing, or distortion based on present contextual cues.",
    "prompt": "Choose the correct heading for this paragraph:",
    "options": [
      "i The mechanical archiving of sensory impressions",
      "ii The dynamic and reconstructive nature of memory retrieval",
      "iii Therapeutic pharmaceuticals for severe amnesia",
      "iv Cognitive decline during natural biological aging"
    ],
    "answer": "ii The dynamic and reconstructive nature of memory retrieval",
    "explanationVi": "Đoạn văn chứng minh việc nhớ lại không phải là lấy tài liệu từ kho lưu trữ bất biến mà là một quá trình động, dễ bị tái cấu trúc và biến đổi (Heading ii).",
    "evidenceQuote": "act of recollection fundamentally destabilizes stored synaptic representations... susceptible to modification... based on present contextual cues",
    "tip": "Tìm câu chủ đề (thường ở câu đầu hoặc câu sau liên từ However, In contrast). Chọn tiêu đề khái quát toàn đoạn, tránh tiêu đề chỉ nói một chi tiết nhỏ."
  },
  {
    "id": "drill-rd-hd-08",
    "skill": "reading",
    "typeId": "reading-matching-headings",
    "title": "Reading Drill · Matching Headings #8",
    "contextText": "The deployment of microgrid architecture combined with community-scale battery storage is decentralizing municipal power distribution. Rather than relying exclusively on massive centralized fossil-fuel power stations requiring hundreds of miles of transmission cables, residential districts are installing photovoltaic arrays on civic buildings and exchanging surplus kilowatt-hours locally through peer-to-peer digital trading networks.",
    "prompt": "Choose the correct heading for this paragraph:",
    "options": [
      "i Environmental hazards of lithium-ion battery disposal",
      "ii A transition toward decentralized community energy grids",
      "iii Rising tariffs in international fossil fuel shipping",
      "iv Nuclear reactor construction in modern suburban zones"
    ],
    "answer": "ii A transition toward decentralized community energy grids",
    "explanationVi": "Đoạn văn phân tích sự dịch chuyển từ mạng lưới điện tập trung sang mạng lưới phân tán quy mô cộng đồng (Heading ii).",
    "evidenceQuote": "decentralizing municipal power distribution... installing photovoltaic arrays on civic buildings and exchanging surplus kilowatt-hours locally",
    "tip": "Tìm câu chủ đề (thường ở câu đầu hoặc câu sau liên từ However, In contrast). Chọn tiêu đề khái quát toàn đoạn, tránh tiêu đề chỉ nói một chi tiết nhỏ."
  },
  {
    "id": "drill-rd-hd-09",
    "skill": "reading",
    "typeId": "reading-matching-headings",
    "title": "Reading Drill · Matching Headings #9",
    "contextText": "Early archaeological expeditions in the Nile valley concentrated almost exclusively on monumental architecture, royal mortuary complexes, and precious funerary artifacts. In recent decades, however, paleobotanical sediment sifting and isotopic bone analysis have redirected academic focus toward the mundane daily existence of ordinary agricultural workers, their dietary staples, seasonal health hardships, and domestic ceramic utensils.",
    "prompt": "Choose the correct heading for this paragraph:",
    "options": [
      "i Engineering techniques behind royal Egyptian pyramids",
      "ii A scholarly shift toward everyday ancient domestic life",
      "iii Methods for cataloging royal gold treasures in museums",
      "iv Climatological causes of ancient drought in North Africa"
    ],
    "answer": "ii A scholarly shift toward everyday ancient domestic life",
    "explanationVi": "Trọng tâm của đoạn là sự thay đổi trong nghiên cứu khảo cổ học từ lăng tẩm hoàng gia sang đời sống thường nhật của người dân lao động cổ đại (Heading ii).",
    "evidenceQuote": "redirected academic focus toward the mundane daily existence of ordinary agricultural workers, their dietary staples...",
    "tip": "Tìm câu chủ đề (thường ở câu đầu hoặc câu sau liên từ However, In contrast). Chọn tiêu đề khái quát toàn đoạn, tránh tiêu đề chỉ nói một chi tiết nhỏ."
  },
  {
    "id": "drill-rd-hd-10",
    "skill": "reading",
    "typeId": "reading-matching-headings",
    "title": "Reading Drill · Matching Headings #10",
    "contextText": "While artificial intelligence algorithms have demonstrated superhuman accuracy in diagnosing radiographic medical imaging, clinical implementation has encountered significant psychological resistance from patients. Surveys indicate that individuals feel uncomfortable receiving serious health prognoses from automated diagnostic systems without empathetic human interpersonal consultation, even when the software has a superior empirical track record.",
    "prompt": "Choose the correct heading for this paragraph:",
    "options": [
      "i Technical hardware bottlenecks in diagnostic computing",
      "ii The human and emotional barriers to AI adoption in healthcare",
      "iii Legal malpractice disputes in automated pharmacy dispensing",
      "iv Financial profits generated by medical robotics manufacturers"
    ],
    "answer": "ii The human and emotional barriers to AI adoption in healthcare",
    "explanationVi": "Đoạn văn nêu bật rào cản về mặt tâm lý và cảm xúc của bệnh nhân đối với việc ứng dụng AI trong y tế (Heading ii).",
    "evidenceQuote": "clinical implementation has encountered significant psychological resistance from patients... feel uncomfortable... without empathetic human consultation",
    "tip": "Tìm câu chủ đề (thường ở câu đầu hoặc câu sau liên từ However, In contrast). Chọn tiêu đề khái quát toàn đoạn, tránh tiêu đề chỉ nói một chi tiết nhỏ."
  },
  {
    "id": "drill-rd-hd-11",
    "skill": "reading",
    "typeId": "reading-matching-headings",
    "title": "Reading Drill · Matching Headings #11",
    "contextText": "For centuries, the extraction of natural cork in the Mediterranean basin was regarded as a purely artisanal endeavor. Today, however, cork oak forestry is recognized as a sophisticated model of agroforestry conservation. Because harvesters strip only the renewable outer bark without felling the trunk, a single tree can produce virgin cork every nine years for over two centuries, simultaneously preserving fragile semi-arid soil and providing vital wintering habitats for migrating birds.",
    "prompt": "Choose the correct heading for this paragraph:",
    "options": [
      "i The economic decline of traditional Mediterranean agriculture",
      "ii Ecological and sustainable dimensions of cork harvesting",
      "iii Mechanical advancements in timber felling equipment",
      "iv Chemical properties of synthetic bottle stoppers"
    ],
    "answer": "ii Ecological and sustainable dimensions of cork harvesting",
    "explanationVi": "Đoạn văn nhấn mạnh tính bền vững sinh thái (không cần chặt cây, bảo vệ đất và chim muông) của việc thu hoạch vỏ sồi làm nút bấc (Heading ii).",
    "evidenceQuote": "recognized as a sophisticated model of agroforestry conservation... strip only the renewable outer bark without felling the trunk... preserving fragile soil",
    "tip": "Tìm câu chủ đề (thường ở câu đầu hoặc câu sau liên từ However, In contrast). Chọn tiêu đề khái quát toàn đoạn, tránh tiêu đề chỉ nói một chi tiết nhỏ."
  },
  {
    "id": "drill-rd-hd-12",
    "skill": "reading",
    "typeId": "reading-matching-headings",
    "title": "Reading Drill · Matching Headings #12",
    "contextText": "In contrast to earlier assumptions that memory functions as an inert archival vault, cognitive neuroscience reveals that the act of recollection fundamentally destabilizes stored synaptic representations. Each time a memory is retrieved, it enters a transient labile phase where it must undergo cellular reconsolidation, rendering it susceptible to modification, emotional re-framing, or distortion based on present contextual cues.",
    "prompt": "Choose the correct heading for this paragraph:",
    "options": [
      "i The mechanical archiving of sensory impressions",
      "ii The dynamic and reconstructive nature of memory retrieval",
      "iii Therapeutic pharmaceuticals for severe amnesia",
      "iv Cognitive decline during natural biological aging"
    ],
    "answer": "ii The dynamic and reconstructive nature of memory retrieval",
    "explanationVi": "Đoạn văn chứng minh việc nhớ lại không phải là lấy tài liệu từ kho lưu trữ bất biến mà là một quá trình động, dễ bị tái cấu trúc và biến đổi (Heading ii).",
    "evidenceQuote": "act of recollection fundamentally destabilizes stored synaptic representations... susceptible to modification... based on present contextual cues",
    "tip": "Tìm câu chủ đề (thường ở câu đầu hoặc câu sau liên từ However, In contrast). Chọn tiêu đề khái quát toàn đoạn, tránh tiêu đề chỉ nói một chi tiết nhỏ."
  },
  {
    "id": "drill-rd-hd-13",
    "skill": "reading",
    "typeId": "reading-matching-headings",
    "title": "Reading Drill · Matching Headings #13",
    "contextText": "The deployment of microgrid architecture combined with community-scale battery storage is decentralizing municipal power distribution. Rather than relying exclusively on massive centralized fossil-fuel power stations requiring hundreds of miles of transmission cables, residential districts are installing photovoltaic arrays on civic buildings and exchanging surplus kilowatt-hours locally through peer-to-peer digital trading networks.",
    "prompt": "Choose the correct heading for this paragraph:",
    "options": [
      "i Environmental hazards of lithium-ion battery disposal",
      "ii A transition toward decentralized community energy grids",
      "iii Rising tariffs in international fossil fuel shipping",
      "iv Nuclear reactor construction in modern suburban zones"
    ],
    "answer": "ii A transition toward decentralized community energy grids",
    "explanationVi": "Đoạn văn phân tích sự dịch chuyển từ mạng lưới điện tập trung sang mạng lưới phân tán quy mô cộng đồng (Heading ii).",
    "evidenceQuote": "decentralizing municipal power distribution... installing photovoltaic arrays on civic buildings and exchanging surplus kilowatt-hours locally",
    "tip": "Tìm câu chủ đề (thường ở câu đầu hoặc câu sau liên từ However, In contrast). Chọn tiêu đề khái quát toàn đoạn, tránh tiêu đề chỉ nói một chi tiết nhỏ."
  },
  {
    "id": "drill-rd-hd-14",
    "skill": "reading",
    "typeId": "reading-matching-headings",
    "title": "Reading Drill · Matching Headings #14",
    "contextText": "Early archaeological expeditions in the Nile valley concentrated almost exclusively on monumental architecture, royal mortuary complexes, and precious funerary artifacts. In recent decades, however, paleobotanical sediment sifting and isotopic bone analysis have redirected academic focus toward the mundane daily existence of ordinary agricultural workers, their dietary staples, seasonal health hardships, and domestic ceramic utensils.",
    "prompt": "Choose the correct heading for this paragraph:",
    "options": [
      "i Engineering techniques behind royal Egyptian pyramids",
      "ii A scholarly shift toward everyday ancient domestic life",
      "iii Methods for cataloging royal gold treasures in museums",
      "iv Climatological causes of ancient drought in North Africa"
    ],
    "answer": "ii A scholarly shift toward everyday ancient domestic life",
    "explanationVi": "Trọng tâm của đoạn là sự thay đổi trong nghiên cứu khảo cổ học từ lăng tẩm hoàng gia sang đời sống thường nhật của người dân lao động cổ đại (Heading ii).",
    "evidenceQuote": "redirected academic focus toward the mundane daily existence of ordinary agricultural workers, their dietary staples...",
    "tip": "Tìm câu chủ đề (thường ở câu đầu hoặc câu sau liên từ However, In contrast). Chọn tiêu đề khái quát toàn đoạn, tránh tiêu đề chỉ nói một chi tiết nhỏ."
  },
  {
    "id": "drill-rd-hd-15",
    "skill": "reading",
    "typeId": "reading-matching-headings",
    "title": "Reading Drill · Matching Headings #15",
    "contextText": "While artificial intelligence algorithms have demonstrated superhuman accuracy in diagnosing radiographic medical imaging, clinical implementation has encountered significant psychological resistance from patients. Surveys indicate that individuals feel uncomfortable receiving serious health prognoses from automated diagnostic systems without empathetic human interpersonal consultation, even when the software has a superior empirical track record.",
    "prompt": "Choose the correct heading for this paragraph:",
    "options": [
      "i Technical hardware bottlenecks in diagnostic computing",
      "ii The human and emotional barriers to AI adoption in healthcare",
      "iii Legal malpractice disputes in automated pharmacy dispensing",
      "iv Financial profits generated by medical robotics manufacturers"
    ],
    "answer": "ii The human and emotional barriers to AI adoption in healthcare",
    "explanationVi": "Đoạn văn nêu bật rào cản về mặt tâm lý và cảm xúc của bệnh nhân đối với việc ứng dụng AI trong y tế (Heading ii).",
    "evidenceQuote": "clinical implementation has encountered significant psychological resistance from patients... feel uncomfortable... without empathetic human consultation",
    "tip": "Tìm câu chủ đề (thường ở câu đầu hoặc câu sau liên từ However, In contrast). Chọn tiêu đề khái quát toàn đoạn, tránh tiêu đề chỉ nói một chi tiết nhỏ."
  },
  {
    "id": "drill-rd-sm-01",
    "skill": "reading",
    "typeId": "reading-summary-completion",
    "title": "Reading Drill · Summary & Sentence Completion #1",
    "contextText": "The architectural marvel of the Pantheon in Rome survived two millennia due to the Romans' ingenious recipe for hydraulic concrete. By pulverizing volcanic ash termed pozzolana and mixing it with slaked lime and volcanic tuff aggregate, builders created a matrix that actively recrystallized upon contact with seawater, preventing subterranean fractures from propagating.",
    "prompt": "Complete the sentence below. Choose ONE WORD ONLY from the passage:\nRoman hydraulic concrete derived its durability from mixing slaked lime with volcanic ________.",
    "answer": "ash",
    "explanationVi": "Từ cần điền là danh từ đứng sau 'volcanic': 'ash' (tro núi lửa).",
    "evidenceQuote": "By pulverizing volcanic ash termed pozzolana and mixing it with slaked lime...",
    "tip": "Xác định từ loại (danh từ, tính từ...) cần điền trước. Chỉ chép đúng dạng từ có trong bài đọc, không tự ý biến đổi số ít/số nhiều."
  },
  {
    "id": "drill-rd-sm-02",
    "skill": "reading",
    "typeId": "reading-summary-completion",
    "title": "Reading Drill · Summary & Sentence Completion #2",
    "contextText": "In aviation safety protocols, fly-by-wire flight control computers continuously monitor aerodynamic flight envelopes to prevent aerodynamic stall. If pilot manual control inputs command an excessively steep pitch angle, the flight software automatically overrides the flight stick to depress the aircraft's elevators and restore airflow over the wings.",
    "prompt": "Complete the sentence below. Choose ONE WORD ONLY from the passage:\nAutomated flight software will override manual controls to avoid a dangerous aerodynamic ________.",
    "answer": "stall",
    "explanationVi": "Từ cần điền sau 'aerodynamic' là 'stall' (hiện tượng thất tốc).",
    "evidenceQuote": "continuously monitor aerodynamic flight envelopes to prevent aerodynamic stall.",
    "tip": "Xác định từ loại (danh từ, tính từ...) cần điền trước. Chỉ chép đúng dạng từ có trong bài đọc, không tự ý biến đổi số ít/số nhiều."
  },
  {
    "id": "drill-rd-sm-03",
    "skill": "reading",
    "typeId": "reading-summary-completion",
    "title": "Reading Drill · Summary & Sentence Completion #3",
    "contextText": "Modern offshore wind turbines utilize carbon-fiber composite spars inside their ninety-meter blades to achieve structural stiffness while minimizing inertial mass. This enables rotor assemblies to capture kinetic energy from faint sea breezes without suffering fatigue fractures during gale-force storms.",
    "prompt": "Complete the sentence below. Choose NO MORE THAN TWO WORDS from the passage:\nTurbine blades incorporate ________ spars to maintain stiffness without adding unnecessary weight.",
    "answer": "carbon-fiber composite",
    "explanationVi": "Cụm từ bổ nghĩa cho 'spars' là 'carbon-fiber composite'.",
    "evidenceQuote": "utilize carbon-fiber composite spars inside their ninety-meter blades to achieve structural stiffness...",
    "tip": "Xác định từ loại (danh từ, tính từ...) cần điền trước. Chỉ chép đúng dạng từ có trong bài đọc, không tự ý biến đổi số ít/số nhiều."
  },
  {
    "id": "drill-rd-sm-04",
    "skill": "reading",
    "typeId": "reading-summary-completion",
    "title": "Reading Drill · Summary & Sentence Completion #4",
    "contextText": "Beekeepers and entomologists combating colony collapse disorder have identified the parasitic Varroa destructor mite as a primary vector. These arachnid parasites feed on the fat body tissue of honeybee pupae, severely impairing their immune response and vectoring debilitating deformed wing virus.",
    "prompt": "Complete the sentence below. Choose ONE WORD ONLY from the passage:\nVarroa mites weaken bee immunity by consuming the ________ tissue of developing pupae.",
    "answer": "fat",
    "explanationVi": "Từ cần điền là 'fat' (hoặc 'fat body').",
    "evidenceQuote": "These arachnid parasites feed on the fat body tissue of honeybee pupae...",
    "tip": "Xác định từ loại (danh từ, tính từ...) cần điền trước. Chỉ chép đúng dạng từ có trong bài đọc, không tự ý biến đổi số ít/số nhiều."
  },
  {
    "id": "drill-rd-sm-05",
    "skill": "reading",
    "typeId": "reading-summary-completion",
    "title": "Reading Drill · Summary & Sentence Completion #5",
    "contextText": "Urban wetland restoration projects provide natural stormwater bio-retention basins. Aquatic macrophytes such as reeds and bulrushes absorb dissolved nitrogen and heavy metal pollutants through their rhizomes, purifying runoff before it discharges into regional estuaries.",
    "prompt": "Complete the sentence below. Choose ONE WORD ONLY from the passage:\nWetland reeds filter industrial runoff by absorbing contaminants through their underground ________.",
    "answer": "rhizomes",
    "explanationVi": "Từ cần điền sau 'underground' là 'rhizomes' (thân rễ).",
    "evidenceQuote": "absorb dissolved nitrogen and heavy metal pollutants through their rhizomes...",
    "tip": "Xác định từ loại (danh từ, tính từ...) cần điền trước. Chỉ chép đúng dạng từ có trong bài đọc, không tự ý biến đổi số ít/số nhiều."
  },
  {
    "id": "drill-rd-sm-06",
    "skill": "reading",
    "typeId": "reading-summary-completion",
    "title": "Reading Drill · Summary & Sentence Completion #6",
    "contextText": "The architectural marvel of the Pantheon in Rome survived two millennia due to the Romans' ingenious recipe for hydraulic concrete. By pulverizing volcanic ash termed pozzolana and mixing it with slaked lime and volcanic tuff aggregate, builders created a matrix that actively recrystallized upon contact with seawater, preventing subterranean fractures from propagating.",
    "prompt": "Complete the sentence below. Choose ONE WORD ONLY from the passage:\nRoman hydraulic concrete derived its durability from mixing slaked lime with volcanic ________.",
    "answer": "ash",
    "explanationVi": "Từ cần điền là danh từ đứng sau 'volcanic': 'ash' (tro núi lửa).",
    "evidenceQuote": "By pulverizing volcanic ash termed pozzolana and mixing it with slaked lime...",
    "tip": "Xác định từ loại (danh từ, tính từ...) cần điền trước. Chỉ chép đúng dạng từ có trong bài đọc, không tự ý biến đổi số ít/số nhiều."
  },
  {
    "id": "drill-rd-sm-07",
    "skill": "reading",
    "typeId": "reading-summary-completion",
    "title": "Reading Drill · Summary & Sentence Completion #7",
    "contextText": "In aviation safety protocols, fly-by-wire flight control computers continuously monitor aerodynamic flight envelopes to prevent aerodynamic stall. If pilot manual control inputs command an excessively steep pitch angle, the flight software automatically overrides the flight stick to depress the aircraft's elevators and restore airflow over the wings.",
    "prompt": "Complete the sentence below. Choose ONE WORD ONLY from the passage:\nAutomated flight software will override manual controls to avoid a dangerous aerodynamic ________.",
    "answer": "stall",
    "explanationVi": "Từ cần điền sau 'aerodynamic' là 'stall' (hiện tượng thất tốc).",
    "evidenceQuote": "continuously monitor aerodynamic flight envelopes to prevent aerodynamic stall.",
    "tip": "Xác định từ loại (danh từ, tính từ...) cần điền trước. Chỉ chép đúng dạng từ có trong bài đọc, không tự ý biến đổi số ít/số nhiều."
  },
  {
    "id": "drill-rd-sm-08",
    "skill": "reading",
    "typeId": "reading-summary-completion",
    "title": "Reading Drill · Summary & Sentence Completion #8",
    "contextText": "Modern offshore wind turbines utilize carbon-fiber composite spars inside their ninety-meter blades to achieve structural stiffness while minimizing inertial mass. This enables rotor assemblies to capture kinetic energy from faint sea breezes without suffering fatigue fractures during gale-force storms.",
    "prompt": "Complete the sentence below. Choose NO MORE THAN TWO WORDS from the passage:\nTurbine blades incorporate ________ spars to maintain stiffness without adding unnecessary weight.",
    "answer": "carbon-fiber composite",
    "explanationVi": "Cụm từ bổ nghĩa cho 'spars' là 'carbon-fiber composite'.",
    "evidenceQuote": "utilize carbon-fiber composite spars inside their ninety-meter blades to achieve structural stiffness...",
    "tip": "Xác định từ loại (danh từ, tính từ...) cần điền trước. Chỉ chép đúng dạng từ có trong bài đọc, không tự ý biến đổi số ít/số nhiều."
  },
  {
    "id": "drill-rd-sm-09",
    "skill": "reading",
    "typeId": "reading-summary-completion",
    "title": "Reading Drill · Summary & Sentence Completion #9",
    "contextText": "Beekeepers and entomologists combating colony collapse disorder have identified the parasitic Varroa destructor mite as a primary vector. These arachnid parasites feed on the fat body tissue of honeybee pupae, severely impairing their immune response and vectoring debilitating deformed wing virus.",
    "prompt": "Complete the sentence below. Choose ONE WORD ONLY from the passage:\nVarroa mites weaken bee immunity by consuming the ________ tissue of developing pupae.",
    "answer": "fat",
    "explanationVi": "Từ cần điền là 'fat' (hoặc 'fat body').",
    "evidenceQuote": "These arachnid parasites feed on the fat body tissue of honeybee pupae...",
    "tip": "Xác định từ loại (danh từ, tính từ...) cần điền trước. Chỉ chép đúng dạng từ có trong bài đọc, không tự ý biến đổi số ít/số nhiều."
  },
  {
    "id": "drill-rd-sm-10",
    "skill": "reading",
    "typeId": "reading-summary-completion",
    "title": "Reading Drill · Summary & Sentence Completion #10",
    "contextText": "Urban wetland restoration projects provide natural stormwater bio-retention basins. Aquatic macrophytes such as reeds and bulrushes absorb dissolved nitrogen and heavy metal pollutants through their rhizomes, purifying runoff before it discharges into regional estuaries.",
    "prompt": "Complete the sentence below. Choose ONE WORD ONLY from the passage:\nWetland reeds filter industrial runoff by absorbing contaminants through their underground ________.",
    "answer": "rhizomes",
    "explanationVi": "Từ cần điền sau 'underground' là 'rhizomes' (thân rễ).",
    "evidenceQuote": "absorb dissolved nitrogen and heavy metal pollutants through their rhizomes...",
    "tip": "Xác định từ loại (danh từ, tính từ...) cần điền trước. Chỉ chép đúng dạng từ có trong bài đọc, không tự ý biến đổi số ít/số nhiều."
  },
  {
    "id": "drill-rd-sm-11",
    "skill": "reading",
    "typeId": "reading-summary-completion",
    "title": "Reading Drill · Summary & Sentence Completion #11",
    "contextText": "The architectural marvel of the Pantheon in Rome survived two millennia due to the Romans' ingenious recipe for hydraulic concrete. By pulverizing volcanic ash termed pozzolana and mixing it with slaked lime and volcanic tuff aggregate, builders created a matrix that actively recrystallized upon contact with seawater, preventing subterranean fractures from propagating.",
    "prompt": "Complete the sentence below. Choose ONE WORD ONLY from the passage:\nRoman hydraulic concrete derived its durability from mixing slaked lime with volcanic ________.",
    "answer": "ash",
    "explanationVi": "Từ cần điền là danh từ đứng sau 'volcanic': 'ash' (tro núi lửa).",
    "evidenceQuote": "By pulverizing volcanic ash termed pozzolana and mixing it with slaked lime...",
    "tip": "Xác định từ loại (danh từ, tính từ...) cần điền trước. Chỉ chép đúng dạng từ có trong bài đọc, không tự ý biến đổi số ít/số nhiều."
  },
  {
    "id": "drill-rd-sm-12",
    "skill": "reading",
    "typeId": "reading-summary-completion",
    "title": "Reading Drill · Summary & Sentence Completion #12",
    "contextText": "In aviation safety protocols, fly-by-wire flight control computers continuously monitor aerodynamic flight envelopes to prevent aerodynamic stall. If pilot manual control inputs command an excessively steep pitch angle, the flight software automatically overrides the flight stick to depress the aircraft's elevators and restore airflow over the wings.",
    "prompt": "Complete the sentence below. Choose ONE WORD ONLY from the passage:\nAutomated flight software will override manual controls to avoid a dangerous aerodynamic ________.",
    "answer": "stall",
    "explanationVi": "Từ cần điền sau 'aerodynamic' là 'stall' (hiện tượng thất tốc).",
    "evidenceQuote": "continuously monitor aerodynamic flight envelopes to prevent aerodynamic stall.",
    "tip": "Xác định từ loại (danh từ, tính từ...) cần điền trước. Chỉ chép đúng dạng từ có trong bài đọc, không tự ý biến đổi số ít/số nhiều."
  },
  {
    "id": "drill-rd-sm-13",
    "skill": "reading",
    "typeId": "reading-summary-completion",
    "title": "Reading Drill · Summary & Sentence Completion #13",
    "contextText": "Modern offshore wind turbines utilize carbon-fiber composite spars inside their ninety-meter blades to achieve structural stiffness while minimizing inertial mass. This enables rotor assemblies to capture kinetic energy from faint sea breezes without suffering fatigue fractures during gale-force storms.",
    "prompt": "Complete the sentence below. Choose NO MORE THAN TWO WORDS from the passage:\nTurbine blades incorporate ________ spars to maintain stiffness without adding unnecessary weight.",
    "answer": "carbon-fiber composite",
    "explanationVi": "Cụm từ bổ nghĩa cho 'spars' là 'carbon-fiber composite'.",
    "evidenceQuote": "utilize carbon-fiber composite spars inside their ninety-meter blades to achieve structural stiffness...",
    "tip": "Xác định từ loại (danh từ, tính từ...) cần điền trước. Chỉ chép đúng dạng từ có trong bài đọc, không tự ý biến đổi số ít/số nhiều."
  },
  {
    "id": "drill-rd-sm-14",
    "skill": "reading",
    "typeId": "reading-summary-completion",
    "title": "Reading Drill · Summary & Sentence Completion #14",
    "contextText": "Beekeepers and entomologists combating colony collapse disorder have identified the parasitic Varroa destructor mite as a primary vector. These arachnid parasites feed on the fat body tissue of honeybee pupae, severely impairing their immune response and vectoring debilitating deformed wing virus.",
    "prompt": "Complete the sentence below. Choose ONE WORD ONLY from the passage:\nVarroa mites weaken bee immunity by consuming the ________ tissue of developing pupae.",
    "answer": "fat",
    "explanationVi": "Từ cần điền là 'fat' (hoặc 'fat body').",
    "evidenceQuote": "These arachnid parasites feed on the fat body tissue of honeybee pupae...",
    "tip": "Xác định từ loại (danh từ, tính từ...) cần điền trước. Chỉ chép đúng dạng từ có trong bài đọc, không tự ý biến đổi số ít/số nhiều."
  },
  {
    "id": "drill-rd-sm-15",
    "skill": "reading",
    "typeId": "reading-summary-completion",
    "title": "Reading Drill · Summary & Sentence Completion #15",
    "contextText": "Urban wetland restoration projects provide natural stormwater bio-retention basins. Aquatic macrophytes such as reeds and bulrushes absorb dissolved nitrogen and heavy metal pollutants through their rhizomes, purifying runoff before it discharges into regional estuaries.",
    "prompt": "Complete the sentence below. Choose ONE WORD ONLY from the passage:\nWetland reeds filter industrial runoff by absorbing contaminants through their underground ________.",
    "answer": "rhizomes",
    "explanationVi": "Từ cần điền sau 'underground' là 'rhizomes' (thân rễ).",
    "evidenceQuote": "absorb dissolved nitrogen and heavy metal pollutants through their rhizomes...",
    "tip": "Xác định từ loại (danh từ, tính từ...) cần điền trước. Chỉ chép đúng dạng từ có trong bài đọc, không tự ý biến đổi số ít/số nhiều."
  },
  {
    "id": "drill-rd-mcq-01",
    "skill": "reading",
    "typeId": "reading-multiple-choice",
    "title": "Reading Drill · Multiple Choice #1",
    "contextText": "The discovery of hydrothermal vent ecosystems in 1977 radically revolutionized biological orthodoxy regarding the fundamental conditions necessary for life. Previously, scientists maintained that all living ecosystems on Earth were inextricably dependent on radiant solar energy captured through surface photosynthesis. The thriving biomass of chemoautotrophic bacteria oxidizing sulfur compounds in abyssal darkness proved that metabolic energy could be entirely subterranean.",
    "prompt": "Why did the 1977 hydrothermal vent discovery fundamentally alter scientific beliefs?\nA It demonstrated that marine creatures can survive freezing ocean temperatures\nB It proved that complex ecological communities can thrive without solar energy\nC It proved that all life on Earth originally evolved in deep ocean trenches\nD It provided commercial deep-sea mining companies with new mineral reserves",
    "options": [
      "A It demonstrated that marine creatures can survive freezing ocean temperatures",
      "B It proved that complex ecological communities can thrive without solar energy",
      "C It proved that all life on Earth originally evolved in deep ocean trenches",
      "D It provided commercial deep-sea mining companies with new mineral reserves"
    ],
    "answer": "B It proved that complex ecological communities can thrive without solar energy",
    "explanationVi": "Phát hiện chứng minh các hệ sinh thái có thể tồn tại hoàn toàn trong bóng tối bằng năng lượng hóa học mà không cần đến ánh sáng mặt trời (Option B).",
    "evidenceQuote": "Previously, scientists maintained that all living ecosystems... were inextricably dependent on radiant solar energy... proved that metabolic energy could be entirely subterranean.",
    "tip": "Dùng phương pháp loại suy: loại bỏ các phương án có thông tin sai lệch hoặc không được bài đề cập."
  },
  {
    "id": "drill-rd-mcq-02",
    "skill": "reading",
    "typeId": "reading-multiple-choice",
    "title": "Reading Drill · Multiple Choice #2",
    "contextText": "In assessing the socio-economic impacts of nineteenth-century railway construction, economic historians argue that the true economic catalyst was not merely the speed of passenger transit, but the radical reduction in freight friction. Transporting bulk commodities like coal, quarried stone, and grain previously consumed immense draught animal feed and weeks of river barge navigation. Rail networks unified national internal markets overnight.",
    "prompt": "According to the passage, the primary economic benefit of early railways was:\nA Allowing wealthy passengers to commute comfortably between suburban homes\nB Drastically lowering the time and cost required to transport heavy bulk goods\nC Generating massive corporate tax revenue for royal governments\nD Eliminating all river and sea shipping routes permanently",
    "options": [
      "A Allowing wealthy passengers to commute comfortably between suburban homes",
      "B Drastically lowering the time and cost required to transport heavy bulk goods",
      "C Generating massive corporate tax revenue for royal governments",
      "D Eliminating all river and sea shipping routes permanently"
    ],
    "answer": "B Drastically lowering the time and cost required to transport heavy bulk goods",
    "explanationVi": "Đoạn văn chỉ rõ động lực kinh tế cốt lõi là việc giảm mạnh ma sát vận chuyển hàng hóa khối lượng lớn (bulk commodities) (Option B).",
    "evidenceQuote": "the true economic catalyst was... the radical reduction in freight friction. Transporting bulk commodities like coal, quarried stone, and grain...",
    "tip": "Dùng phương pháp loại suy: loại bỏ các phương án có thông tin sai lệch hoặc không được bài đề cập."
  },
  {
    "id": "drill-rd-mcq-03",
    "skill": "reading",
    "typeId": "reading-multiple-choice",
    "title": "Reading Drill · Multiple Choice #3",
    "contextText": "The discovery of hydrothermal vent ecosystems in 1977 radically revolutionized biological orthodoxy regarding the fundamental conditions necessary for life. Previously, scientists maintained that all living ecosystems on Earth were inextricably dependent on radiant solar energy captured through surface photosynthesis. The thriving biomass of chemoautotrophic bacteria oxidizing sulfur compounds in abyssal darkness proved that metabolic energy could be entirely subterranean.",
    "prompt": "Why did the 1977 hydrothermal vent discovery fundamentally alter scientific beliefs?\nA It demonstrated that marine creatures can survive freezing ocean temperatures\nB It proved that complex ecological communities can thrive without solar energy\nC It proved that all life on Earth originally evolved in deep ocean trenches\nD It provided commercial deep-sea mining companies with new mineral reserves",
    "options": [
      "A It demonstrated that marine creatures can survive freezing ocean temperatures",
      "B It proved that complex ecological communities can thrive without solar energy",
      "C It proved that all life on Earth originally evolved in deep ocean trenches",
      "D It provided commercial deep-sea mining companies with new mineral reserves"
    ],
    "answer": "B It proved that complex ecological communities can thrive without solar energy",
    "explanationVi": "Phát hiện chứng minh các hệ sinh thái có thể tồn tại hoàn toàn trong bóng tối bằng năng lượng hóa học mà không cần đến ánh sáng mặt trời (Option B).",
    "evidenceQuote": "Previously, scientists maintained that all living ecosystems... were inextricably dependent on radiant solar energy... proved that metabolic energy could be entirely subterranean.",
    "tip": "Dùng phương pháp loại suy: loại bỏ các phương án có thông tin sai lệch hoặc không được bài đề cập."
  },
  {
    "id": "drill-rd-mcq-04",
    "skill": "reading",
    "typeId": "reading-multiple-choice",
    "title": "Reading Drill · Multiple Choice #4",
    "contextText": "In assessing the socio-economic impacts of nineteenth-century railway construction, economic historians argue that the true economic catalyst was not merely the speed of passenger transit, but the radical reduction in freight friction. Transporting bulk commodities like coal, quarried stone, and grain previously consumed immense draught animal feed and weeks of river barge navigation. Rail networks unified national internal markets overnight.",
    "prompt": "According to the passage, the primary economic benefit of early railways was:\nA Allowing wealthy passengers to commute comfortably between suburban homes\nB Drastically lowering the time and cost required to transport heavy bulk goods\nC Generating massive corporate tax revenue for royal governments\nD Eliminating all river and sea shipping routes permanently",
    "options": [
      "A Allowing wealthy passengers to commute comfortably between suburban homes",
      "B Drastically lowering the time and cost required to transport heavy bulk goods",
      "C Generating massive corporate tax revenue for royal governments",
      "D Eliminating all river and sea shipping routes permanently"
    ],
    "answer": "B Drastically lowering the time and cost required to transport heavy bulk goods",
    "explanationVi": "Đoạn văn chỉ rõ động lực kinh tế cốt lõi là việc giảm mạnh ma sát vận chuyển hàng hóa khối lượng lớn (bulk commodities) (Option B).",
    "evidenceQuote": "the true economic catalyst was... the radical reduction in freight friction. Transporting bulk commodities like coal, quarried stone, and grain...",
    "tip": "Dùng phương pháp loại suy: loại bỏ các phương án có thông tin sai lệch hoặc không được bài đề cập."
  },
  {
    "id": "drill-rd-mcq-05",
    "skill": "reading",
    "typeId": "reading-multiple-choice",
    "title": "Reading Drill · Multiple Choice #5",
    "contextText": "The discovery of hydrothermal vent ecosystems in 1977 radically revolutionized biological orthodoxy regarding the fundamental conditions necessary for life. Previously, scientists maintained that all living ecosystems on Earth were inextricably dependent on radiant solar energy captured through surface photosynthesis. The thriving biomass of chemoautotrophic bacteria oxidizing sulfur compounds in abyssal darkness proved that metabolic energy could be entirely subterranean.",
    "prompt": "Why did the 1977 hydrothermal vent discovery fundamentally alter scientific beliefs?\nA It demonstrated that marine creatures can survive freezing ocean temperatures\nB It proved that complex ecological communities can thrive without solar energy\nC It proved that all life on Earth originally evolved in deep ocean trenches\nD It provided commercial deep-sea mining companies with new mineral reserves",
    "options": [
      "A It demonstrated that marine creatures can survive freezing ocean temperatures",
      "B It proved that complex ecological communities can thrive without solar energy",
      "C It proved that all life on Earth originally evolved in deep ocean trenches",
      "D It provided commercial deep-sea mining companies with new mineral reserves"
    ],
    "answer": "B It proved that complex ecological communities can thrive without solar energy",
    "explanationVi": "Phát hiện chứng minh các hệ sinh thái có thể tồn tại hoàn toàn trong bóng tối bằng năng lượng hóa học mà không cần đến ánh sáng mặt trời (Option B).",
    "evidenceQuote": "Previously, scientists maintained that all living ecosystems... were inextricably dependent on radiant solar energy... proved that metabolic energy could be entirely subterranean.",
    "tip": "Dùng phương pháp loại suy: loại bỏ các phương án có thông tin sai lệch hoặc không được bài đề cập."
  },
  {
    "id": "drill-rd-mcq-06",
    "skill": "reading",
    "typeId": "reading-multiple-choice",
    "title": "Reading Drill · Multiple Choice #6",
    "contextText": "In assessing the socio-economic impacts of nineteenth-century railway construction, economic historians argue that the true economic catalyst was not merely the speed of passenger transit, but the radical reduction in freight friction. Transporting bulk commodities like coal, quarried stone, and grain previously consumed immense draught animal feed and weeks of river barge navigation. Rail networks unified national internal markets overnight.",
    "prompt": "According to the passage, the primary economic benefit of early railways was:\nA Allowing wealthy passengers to commute comfortably between suburban homes\nB Drastically lowering the time and cost required to transport heavy bulk goods\nC Generating massive corporate tax revenue for royal governments\nD Eliminating all river and sea shipping routes permanently",
    "options": [
      "A Allowing wealthy passengers to commute comfortably between suburban homes",
      "B Drastically lowering the time and cost required to transport heavy bulk goods",
      "C Generating massive corporate tax revenue for royal governments",
      "D Eliminating all river and sea shipping routes permanently"
    ],
    "answer": "B Drastically lowering the time and cost required to transport heavy bulk goods",
    "explanationVi": "Đoạn văn chỉ rõ động lực kinh tế cốt lõi là việc giảm mạnh ma sát vận chuyển hàng hóa khối lượng lớn (bulk commodities) (Option B).",
    "evidenceQuote": "the true economic catalyst was... the radical reduction in freight friction. Transporting bulk commodities like coal, quarried stone, and grain...",
    "tip": "Dùng phương pháp loại suy: loại bỏ các phương án có thông tin sai lệch hoặc không được bài đề cập."
  },
  {
    "id": "drill-rd-mcq-07",
    "skill": "reading",
    "typeId": "reading-multiple-choice",
    "title": "Reading Drill · Multiple Choice #7",
    "contextText": "The discovery of hydrothermal vent ecosystems in 1977 radically revolutionized biological orthodoxy regarding the fundamental conditions necessary for life. Previously, scientists maintained that all living ecosystems on Earth were inextricably dependent on radiant solar energy captured through surface photosynthesis. The thriving biomass of chemoautotrophic bacteria oxidizing sulfur compounds in abyssal darkness proved that metabolic energy could be entirely subterranean.",
    "prompt": "Why did the 1977 hydrothermal vent discovery fundamentally alter scientific beliefs?\nA It demonstrated that marine creatures can survive freezing ocean temperatures\nB It proved that complex ecological communities can thrive without solar energy\nC It proved that all life on Earth originally evolved in deep ocean trenches\nD It provided commercial deep-sea mining companies with new mineral reserves",
    "options": [
      "A It demonstrated that marine creatures can survive freezing ocean temperatures",
      "B It proved that complex ecological communities can thrive without solar energy",
      "C It proved that all life on Earth originally evolved in deep ocean trenches",
      "D It provided commercial deep-sea mining companies with new mineral reserves"
    ],
    "answer": "B It proved that complex ecological communities can thrive without solar energy",
    "explanationVi": "Phát hiện chứng minh các hệ sinh thái có thể tồn tại hoàn toàn trong bóng tối bằng năng lượng hóa học mà không cần đến ánh sáng mặt trời (Option B).",
    "evidenceQuote": "Previously, scientists maintained that all living ecosystems... were inextricably dependent on radiant solar energy... proved that metabolic energy could be entirely subterranean.",
    "tip": "Dùng phương pháp loại suy: loại bỏ các phương án có thông tin sai lệch hoặc không được bài đề cập."
  },
  {
    "id": "drill-rd-mcq-08",
    "skill": "reading",
    "typeId": "reading-multiple-choice",
    "title": "Reading Drill · Multiple Choice #8",
    "contextText": "In assessing the socio-economic impacts of nineteenth-century railway construction, economic historians argue that the true economic catalyst was not merely the speed of passenger transit, but the radical reduction in freight friction. Transporting bulk commodities like coal, quarried stone, and grain previously consumed immense draught animal feed and weeks of river barge navigation. Rail networks unified national internal markets overnight.",
    "prompt": "According to the passage, the primary economic benefit of early railways was:\nA Allowing wealthy passengers to commute comfortably between suburban homes\nB Drastically lowering the time and cost required to transport heavy bulk goods\nC Generating massive corporate tax revenue for royal governments\nD Eliminating all river and sea shipping routes permanently",
    "options": [
      "A Allowing wealthy passengers to commute comfortably between suburban homes",
      "B Drastically lowering the time and cost required to transport heavy bulk goods",
      "C Generating massive corporate tax revenue for royal governments",
      "D Eliminating all river and sea shipping routes permanently"
    ],
    "answer": "B Drastically lowering the time and cost required to transport heavy bulk goods",
    "explanationVi": "Đoạn văn chỉ rõ động lực kinh tế cốt lõi là việc giảm mạnh ma sát vận chuyển hàng hóa khối lượng lớn (bulk commodities) (Option B).",
    "evidenceQuote": "the true economic catalyst was... the radical reduction in freight friction. Transporting bulk commodities like coal, quarried stone, and grain...",
    "tip": "Dùng phương pháp loại suy: loại bỏ các phương án có thông tin sai lệch hoặc không được bài đề cập."
  },
  {
    "id": "drill-rd-mcq-09",
    "skill": "reading",
    "typeId": "reading-multiple-choice",
    "title": "Reading Drill · Multiple Choice #9",
    "contextText": "The discovery of hydrothermal vent ecosystems in 1977 radically revolutionized biological orthodoxy regarding the fundamental conditions necessary for life. Previously, scientists maintained that all living ecosystems on Earth were inextricably dependent on radiant solar energy captured through surface photosynthesis. The thriving biomass of chemoautotrophic bacteria oxidizing sulfur compounds in abyssal darkness proved that metabolic energy could be entirely subterranean.",
    "prompt": "Why did the 1977 hydrothermal vent discovery fundamentally alter scientific beliefs?\nA It demonstrated that marine creatures can survive freezing ocean temperatures\nB It proved that complex ecological communities can thrive without solar energy\nC It proved that all life on Earth originally evolved in deep ocean trenches\nD It provided commercial deep-sea mining companies with new mineral reserves",
    "options": [
      "A It demonstrated that marine creatures can survive freezing ocean temperatures",
      "B It proved that complex ecological communities can thrive without solar energy",
      "C It proved that all life on Earth originally evolved in deep ocean trenches",
      "D It provided commercial deep-sea mining companies with new mineral reserves"
    ],
    "answer": "B It proved that complex ecological communities can thrive without solar energy",
    "explanationVi": "Phát hiện chứng minh các hệ sinh thái có thể tồn tại hoàn toàn trong bóng tối bằng năng lượng hóa học mà không cần đến ánh sáng mặt trời (Option B).",
    "evidenceQuote": "Previously, scientists maintained that all living ecosystems... were inextricably dependent on radiant solar energy... proved that metabolic energy could be entirely subterranean.",
    "tip": "Dùng phương pháp loại suy: loại bỏ các phương án có thông tin sai lệch hoặc không được bài đề cập."
  },
  {
    "id": "drill-rd-mcq-10",
    "skill": "reading",
    "typeId": "reading-multiple-choice",
    "title": "Reading Drill · Multiple Choice #10",
    "contextText": "In assessing the socio-economic impacts of nineteenth-century railway construction, economic historians argue that the true economic catalyst was not merely the speed of passenger transit, but the radical reduction in freight friction. Transporting bulk commodities like coal, quarried stone, and grain previously consumed immense draught animal feed and weeks of river barge navigation. Rail networks unified national internal markets overnight.",
    "prompt": "According to the passage, the primary economic benefit of early railways was:\nA Allowing wealthy passengers to commute comfortably between suburban homes\nB Drastically lowering the time and cost required to transport heavy bulk goods\nC Generating massive corporate tax revenue for royal governments\nD Eliminating all river and sea shipping routes permanently",
    "options": [
      "A Allowing wealthy passengers to commute comfortably between suburban homes",
      "B Drastically lowering the time and cost required to transport heavy bulk goods",
      "C Generating massive corporate tax revenue for royal governments",
      "D Eliminating all river and sea shipping routes permanently"
    ],
    "answer": "B Drastically lowering the time and cost required to transport heavy bulk goods",
    "explanationVi": "Đoạn văn chỉ rõ động lực kinh tế cốt lõi là việc giảm mạnh ma sát vận chuyển hàng hóa khối lượng lớn (bulk commodities) (Option B).",
    "evidenceQuote": "the true economic catalyst was... the radical reduction in freight friction. Transporting bulk commodities like coal, quarried stone, and grain...",
    "tip": "Dùng phương pháp loại suy: loại bỏ các phương án có thông tin sai lệch hoặc không được bài đề cập."
  },
  {
    "id": "drill-rd-mcq-11",
    "skill": "reading",
    "typeId": "reading-multiple-choice",
    "title": "Reading Drill · Multiple Choice #11",
    "contextText": "The discovery of hydrothermal vent ecosystems in 1977 radically revolutionized biological orthodoxy regarding the fundamental conditions necessary for life. Previously, scientists maintained that all living ecosystems on Earth were inextricably dependent on radiant solar energy captured through surface photosynthesis. The thriving biomass of chemoautotrophic bacteria oxidizing sulfur compounds in abyssal darkness proved that metabolic energy could be entirely subterranean.",
    "prompt": "Why did the 1977 hydrothermal vent discovery fundamentally alter scientific beliefs?\nA It demonstrated that marine creatures can survive freezing ocean temperatures\nB It proved that complex ecological communities can thrive without solar energy\nC It proved that all life on Earth originally evolved in deep ocean trenches\nD It provided commercial deep-sea mining companies with new mineral reserves",
    "options": [
      "A It demonstrated that marine creatures can survive freezing ocean temperatures",
      "B It proved that complex ecological communities can thrive without solar energy",
      "C It proved that all life on Earth originally evolved in deep ocean trenches",
      "D It provided commercial deep-sea mining companies with new mineral reserves"
    ],
    "answer": "B It proved that complex ecological communities can thrive without solar energy",
    "explanationVi": "Phát hiện chứng minh các hệ sinh thái có thể tồn tại hoàn toàn trong bóng tối bằng năng lượng hóa học mà không cần đến ánh sáng mặt trời (Option B).",
    "evidenceQuote": "Previously, scientists maintained that all living ecosystems... were inextricably dependent on radiant solar energy... proved that metabolic energy could be entirely subterranean.",
    "tip": "Dùng phương pháp loại suy: loại bỏ các phương án có thông tin sai lệch hoặc không được bài đề cập."
  },
  {
    "id": "drill-rd-mcq-12",
    "skill": "reading",
    "typeId": "reading-multiple-choice",
    "title": "Reading Drill · Multiple Choice #12",
    "contextText": "In assessing the socio-economic impacts of nineteenth-century railway construction, economic historians argue that the true economic catalyst was not merely the speed of passenger transit, but the radical reduction in freight friction. Transporting bulk commodities like coal, quarried stone, and grain previously consumed immense draught animal feed and weeks of river barge navigation. Rail networks unified national internal markets overnight.",
    "prompt": "According to the passage, the primary economic benefit of early railways was:\nA Allowing wealthy passengers to commute comfortably between suburban homes\nB Drastically lowering the time and cost required to transport heavy bulk goods\nC Generating massive corporate tax revenue for royal governments\nD Eliminating all river and sea shipping routes permanently",
    "options": [
      "A Allowing wealthy passengers to commute comfortably between suburban homes",
      "B Drastically lowering the time and cost required to transport heavy bulk goods",
      "C Generating massive corporate tax revenue for royal governments",
      "D Eliminating all river and sea shipping routes permanently"
    ],
    "answer": "B Drastically lowering the time and cost required to transport heavy bulk goods",
    "explanationVi": "Đoạn văn chỉ rõ động lực kinh tế cốt lõi là việc giảm mạnh ma sát vận chuyển hàng hóa khối lượng lớn (bulk commodities) (Option B).",
    "evidenceQuote": "the true economic catalyst was... the radical reduction in freight friction. Transporting bulk commodities like coal, quarried stone, and grain...",
    "tip": "Dùng phương pháp loại suy: loại bỏ các phương án có thông tin sai lệch hoặc không được bài đề cập."
  },
  {
    "id": "drill-rd-mcq-13",
    "skill": "reading",
    "typeId": "reading-multiple-choice",
    "title": "Reading Drill · Multiple Choice #13",
    "contextText": "The discovery of hydrothermal vent ecosystems in 1977 radically revolutionized biological orthodoxy regarding the fundamental conditions necessary for life. Previously, scientists maintained that all living ecosystems on Earth were inextricably dependent on radiant solar energy captured through surface photosynthesis. The thriving biomass of chemoautotrophic bacteria oxidizing sulfur compounds in abyssal darkness proved that metabolic energy could be entirely subterranean.",
    "prompt": "Why did the 1977 hydrothermal vent discovery fundamentally alter scientific beliefs?\nA It demonstrated that marine creatures can survive freezing ocean temperatures\nB It proved that complex ecological communities can thrive without solar energy\nC It proved that all life on Earth originally evolved in deep ocean trenches\nD It provided commercial deep-sea mining companies with new mineral reserves",
    "options": [
      "A It demonstrated that marine creatures can survive freezing ocean temperatures",
      "B It proved that complex ecological communities can thrive without solar energy",
      "C It proved that all life on Earth originally evolved in deep ocean trenches",
      "D It provided commercial deep-sea mining companies with new mineral reserves"
    ],
    "answer": "B It proved that complex ecological communities can thrive without solar energy",
    "explanationVi": "Phát hiện chứng minh các hệ sinh thái có thể tồn tại hoàn toàn trong bóng tối bằng năng lượng hóa học mà không cần đến ánh sáng mặt trời (Option B).",
    "evidenceQuote": "Previously, scientists maintained that all living ecosystems... were inextricably dependent on radiant solar energy... proved that metabolic energy could be entirely subterranean.",
    "tip": "Dùng phương pháp loại suy: loại bỏ các phương án có thông tin sai lệch hoặc không được bài đề cập."
  },
  {
    "id": "drill-rd-mcq-14",
    "skill": "reading",
    "typeId": "reading-multiple-choice",
    "title": "Reading Drill · Multiple Choice #14",
    "contextText": "In assessing the socio-economic impacts of nineteenth-century railway construction, economic historians argue that the true economic catalyst was not merely the speed of passenger transit, but the radical reduction in freight friction. Transporting bulk commodities like coal, quarried stone, and grain previously consumed immense draught animal feed and weeks of river barge navigation. Rail networks unified national internal markets overnight.",
    "prompt": "According to the passage, the primary economic benefit of early railways was:\nA Allowing wealthy passengers to commute comfortably between suburban homes\nB Drastically lowering the time and cost required to transport heavy bulk goods\nC Generating massive corporate tax revenue for royal governments\nD Eliminating all river and sea shipping routes permanently",
    "options": [
      "A Allowing wealthy passengers to commute comfortably between suburban homes",
      "B Drastically lowering the time and cost required to transport heavy bulk goods",
      "C Generating massive corporate tax revenue for royal governments",
      "D Eliminating all river and sea shipping routes permanently"
    ],
    "answer": "B Drastically lowering the time and cost required to transport heavy bulk goods",
    "explanationVi": "Đoạn văn chỉ rõ động lực kinh tế cốt lõi là việc giảm mạnh ma sát vận chuyển hàng hóa khối lượng lớn (bulk commodities) (Option B).",
    "evidenceQuote": "the true economic catalyst was... the radical reduction in freight friction. Transporting bulk commodities like coal, quarried stone, and grain...",
    "tip": "Dùng phương pháp loại suy: loại bỏ các phương án có thông tin sai lệch hoặc không được bài đề cập."
  },
  {
    "id": "drill-rd-mcq-15",
    "skill": "reading",
    "typeId": "reading-multiple-choice",
    "title": "Reading Drill · Multiple Choice #15",
    "contextText": "The discovery of hydrothermal vent ecosystems in 1977 radically revolutionized biological orthodoxy regarding the fundamental conditions necessary for life. Previously, scientists maintained that all living ecosystems on Earth were inextricably dependent on radiant solar energy captured through surface photosynthesis. The thriving biomass of chemoautotrophic bacteria oxidizing sulfur compounds in abyssal darkness proved that metabolic energy could be entirely subterranean.",
    "prompt": "Why did the 1977 hydrothermal vent discovery fundamentally alter scientific beliefs?\nA It demonstrated that marine creatures can survive freezing ocean temperatures\nB It proved that complex ecological communities can thrive without solar energy\nC It proved that all life on Earth originally evolved in deep ocean trenches\nD It provided commercial deep-sea mining companies with new mineral reserves",
    "options": [
      "A It demonstrated that marine creatures can survive freezing ocean temperatures",
      "B It proved that complex ecological communities can thrive without solar energy",
      "C It proved that all life on Earth originally evolved in deep ocean trenches",
      "D It provided commercial deep-sea mining companies with new mineral reserves"
    ],
    "answer": "B It proved that complex ecological communities can thrive without solar energy",
    "explanationVi": "Phát hiện chứng minh các hệ sinh thái có thể tồn tại hoàn toàn trong bóng tối bằng năng lượng hóa học mà không cần đến ánh sáng mặt trời (Option B).",
    "evidenceQuote": "Previously, scientists maintained that all living ecosystems... were inextricably dependent on radiant solar energy... proved that metabolic energy could be entirely subterranean.",
    "tip": "Dùng phương pháp loại suy: loại bỏ các phương án có thông tin sai lệch hoặc không được bài đề cập."
  },
  {
    "id": "drill-ls-form-01",
    "skill": "listening",
    "typeId": "listening-form-completion",
    "title": "Listening Drill · Form & Note Completion #1",
    "contextText": "TRANSCRIPT EXCERPT:\nAgent: Hello, Westview Property Lettings, how may I assist you?\nCaller: Hi, I'm calling about the two-bedroom flat on Willow Street. Could I register my details?\nAgent: Certainly. Could you give me your surname first?\nCaller: Yes, it's Harrison, spelled H-A-R-R-I-S-O-N.\nAgent: Thank you, Mr. Harrison. And what is your preferred move-in date?\nCaller: Well, my current lease expires on the 28th, but I would like to move in on Tuesday, the 15th of August.",
    "prompt": "Complete the notes below. Write ONE WORD AND/OR A NUMBER for each answer:\nTenant surname: 1 ________\nPreferred move-in date: 15th 2 ________",
    "answer": "1: Harrison | 2: August",
    "explanationVi": "Tên họ được đánh vần trực tiếp: Harrison. Ngày chuyển vào là ngày 15 tháng 8 (August).",
    "evidenceQuote": "spelled H-A-R-R-I-S-O-N ... Tuesday, the 15th of August",
    "tip": "Cẩn thận bẫy người nói đổi ý (Self-correction). Nghe kỹ các chữ số và chữ cái đánh vần."
  },
  {
    "id": "drill-ls-form-02",
    "skill": "listening",
    "typeId": "listening-form-completion",
    "title": "Listening Drill · Form & Note Completion #2",
    "contextText": "TRANSCRIPT EXCERPT:\nAdviser: And what is the primary telephone number where we can reach you?\nCaller: You can catch me on my mobile. It's 07792... wait, sorry, that's my work extension. My direct personal line is 07841 552904.\nAdviser: Got it, 07841 552904. And what maximum monthly budget were you hoping for?\nCaller: I can afford up to £850 per month, inclusive of utility bills.",
    "prompt": "Complete the notes below. Write ONE WORD AND/OR A NUMBER for each answer:\nDirect contact number: 1 ________\nMaximum monthly budget: £ 2 ________",
    "answer": "1: 07841 552904 | 2: 850",
    "explanationVi": "Người nói tự đính chính số điện thoại công việc sang số cá nhân 07841 552904. Ngân sách tối đa là 850.",
    "evidenceQuote": "My direct personal line is 07841 552904 ... afford up to £850 per month",
    "tip": "Cẩn thận bẫy người nói đổi ý (Self-correction). Nghe kỹ các chữ số và chữ cái đánh vần."
  },
  {
    "id": "drill-ls-form-03",
    "skill": "listening",
    "typeId": "listening-form-completion",
    "title": "Listening Drill · Form & Note Completion #3",
    "contextText": "TRANSCRIPT EXCERPT:\nInstructor: For your introductory scuba session, we provide all basic equipment including regulator and buoyancy jacket. However, all participants must bring their own towel and a pair of sturdy neoprene boots. Also, please remember to present a valid medical certificate before entering the pool.",
    "prompt": "Complete the notes below. Write NO MORE THAN TWO WORDS for each answer:\nRequired personal items: towel and neoprene 1 ________\nCompulsory document: valid 2 ________",
    "answer": "1: boots | 2: medical certificate",
    "explanationVi": "Vật dụng cá nhân là boots (hoặc neoprene boots). Giấy tờ bắt buộc là medical certificate.",
    "evidenceQuote": "bring their own towel and a pair of sturdy neoprene boots ... present a valid medical certificate",
    "tip": "Cẩn thận bẫy người nói đổi ý (Self-correction). Nghe kỹ các chữ số và chữ cái đánh vần."
  },
  {
    "id": "drill-ls-form-04",
    "skill": "listening",
    "typeId": "listening-form-completion",
    "title": "Listening Drill · Form & Note Completion #4",
    "contextText": "TRANSCRIPT EXCERPT:\nAgent: Hello, Westview Property Lettings, how may I assist you?\nCaller: Hi, I'm calling about the two-bedroom flat on Willow Street. Could I register my details?\nAgent: Certainly. Could you give me your surname first?\nCaller: Yes, it's Harrison, spelled H-A-R-R-I-S-O-N.\nAgent: Thank you, Mr. Harrison. And what is your preferred move-in date?\nCaller: Well, my current lease expires on the 28th, but I would like to move in on Tuesday, the 15th of August.",
    "prompt": "Complete the notes below. Write ONE WORD AND/OR A NUMBER for each answer:\nTenant surname: 1 ________\nPreferred move-in date: 15th 2 ________",
    "answer": "1: Harrison | 2: August",
    "explanationVi": "Tên họ được đánh vần trực tiếp: Harrison. Ngày chuyển vào là ngày 15 tháng 8 (August).",
    "evidenceQuote": "spelled H-A-R-R-I-S-O-N ... Tuesday, the 15th of August",
    "tip": "Cẩn thận bẫy người nói đổi ý (Self-correction). Nghe kỹ các chữ số và chữ cái đánh vần."
  },
  {
    "id": "drill-ls-form-05",
    "skill": "listening",
    "typeId": "listening-form-completion",
    "title": "Listening Drill · Form & Note Completion #5",
    "contextText": "TRANSCRIPT EXCERPT:\nAdviser: And what is the primary telephone number where we can reach you?\nCaller: You can catch me on my mobile. It's 07792... wait, sorry, that's my work extension. My direct personal line is 07841 552904.\nAdviser: Got it, 07841 552904. And what maximum monthly budget were you hoping for?\nCaller: I can afford up to £850 per month, inclusive of utility bills.",
    "prompt": "Complete the notes below. Write ONE WORD AND/OR A NUMBER for each answer:\nDirect contact number: 1 ________\nMaximum monthly budget: £ 2 ________",
    "answer": "1: 07841 552904 | 2: 850",
    "explanationVi": "Người nói tự đính chính số điện thoại công việc sang số cá nhân 07841 552904. Ngân sách tối đa là 850.",
    "evidenceQuote": "My direct personal line is 07841 552904 ... afford up to £850 per month",
    "tip": "Cẩn thận bẫy người nói đổi ý (Self-correction). Nghe kỹ các chữ số và chữ cái đánh vần."
  },
  {
    "id": "drill-ls-form-06",
    "skill": "listening",
    "typeId": "listening-form-completion",
    "title": "Listening Drill · Form & Note Completion #6",
    "contextText": "TRANSCRIPT EXCERPT:\nInstructor: For your introductory scuba session, we provide all basic equipment including regulator and buoyancy jacket. However, all participants must bring their own towel and a pair of sturdy neoprene boots. Also, please remember to present a valid medical certificate before entering the pool.",
    "prompt": "Complete the notes below. Write NO MORE THAN TWO WORDS for each answer:\nRequired personal items: towel and neoprene 1 ________\nCompulsory document: valid 2 ________",
    "answer": "1: boots | 2: medical certificate",
    "explanationVi": "Vật dụng cá nhân là boots (hoặc neoprene boots). Giấy tờ bắt buộc là medical certificate.",
    "evidenceQuote": "bring their own towel and a pair of sturdy neoprene boots ... present a valid medical certificate",
    "tip": "Cẩn thận bẫy người nói đổi ý (Self-correction). Nghe kỹ các chữ số và chữ cái đánh vần."
  },
  {
    "id": "drill-ls-form-07",
    "skill": "listening",
    "typeId": "listening-form-completion",
    "title": "Listening Drill · Form & Note Completion #7",
    "contextText": "TRANSCRIPT EXCERPT:\nAgent: Hello, Westview Property Lettings, how may I assist you?\nCaller: Hi, I'm calling about the two-bedroom flat on Willow Street. Could I register my details?\nAgent: Certainly. Could you give me your surname first?\nCaller: Yes, it's Harrison, spelled H-A-R-R-I-S-O-N.\nAgent: Thank you, Mr. Harrison. And what is your preferred move-in date?\nCaller: Well, my current lease expires on the 28th, but I would like to move in on Tuesday, the 15th of August.",
    "prompt": "Complete the notes below. Write ONE WORD AND/OR A NUMBER for each answer:\nTenant surname: 1 ________\nPreferred move-in date: 15th 2 ________",
    "answer": "1: Harrison | 2: August",
    "explanationVi": "Tên họ được đánh vần trực tiếp: Harrison. Ngày chuyển vào là ngày 15 tháng 8 (August).",
    "evidenceQuote": "spelled H-A-R-R-I-S-O-N ... Tuesday, the 15th of August",
    "tip": "Cẩn thận bẫy người nói đổi ý (Self-correction). Nghe kỹ các chữ số và chữ cái đánh vần."
  },
  {
    "id": "drill-ls-form-08",
    "skill": "listening",
    "typeId": "listening-form-completion",
    "title": "Listening Drill · Form & Note Completion #8",
    "contextText": "TRANSCRIPT EXCERPT:\nAdviser: And what is the primary telephone number where we can reach you?\nCaller: You can catch me on my mobile. It's 07792... wait, sorry, that's my work extension. My direct personal line is 07841 552904.\nAdviser: Got it, 07841 552904. And what maximum monthly budget were you hoping for?\nCaller: I can afford up to £850 per month, inclusive of utility bills.",
    "prompt": "Complete the notes below. Write ONE WORD AND/OR A NUMBER for each answer:\nDirect contact number: 1 ________\nMaximum monthly budget: £ 2 ________",
    "answer": "1: 07841 552904 | 2: 850",
    "explanationVi": "Người nói tự đính chính số điện thoại công việc sang số cá nhân 07841 552904. Ngân sách tối đa là 850.",
    "evidenceQuote": "My direct personal line is 07841 552904 ... afford up to £850 per month",
    "tip": "Cẩn thận bẫy người nói đổi ý (Self-correction). Nghe kỹ các chữ số và chữ cái đánh vần."
  },
  {
    "id": "drill-ls-form-09",
    "skill": "listening",
    "typeId": "listening-form-completion",
    "title": "Listening Drill · Form & Note Completion #9",
    "contextText": "TRANSCRIPT EXCERPT:\nInstructor: For your introductory scuba session, we provide all basic equipment including regulator and buoyancy jacket. However, all participants must bring their own towel and a pair of sturdy neoprene boots. Also, please remember to present a valid medical certificate before entering the pool.",
    "prompt": "Complete the notes below. Write NO MORE THAN TWO WORDS for each answer:\nRequired personal items: towel and neoprene 1 ________\nCompulsory document: valid 2 ________",
    "answer": "1: boots | 2: medical certificate",
    "explanationVi": "Vật dụng cá nhân là boots (hoặc neoprene boots). Giấy tờ bắt buộc là medical certificate.",
    "evidenceQuote": "bring their own towel and a pair of sturdy neoprene boots ... present a valid medical certificate",
    "tip": "Cẩn thận bẫy người nói đổi ý (Self-correction). Nghe kỹ các chữ số và chữ cái đánh vần."
  },
  {
    "id": "drill-ls-form-10",
    "skill": "listening",
    "typeId": "listening-form-completion",
    "title": "Listening Drill · Form & Note Completion #10",
    "contextText": "TRANSCRIPT EXCERPT:\nAgent: Hello, Westview Property Lettings, how may I assist you?\nCaller: Hi, I'm calling about the two-bedroom flat on Willow Street. Could I register my details?\nAgent: Certainly. Could you give me your surname first?\nCaller: Yes, it's Harrison, spelled H-A-R-R-I-S-O-N.\nAgent: Thank you, Mr. Harrison. And what is your preferred move-in date?\nCaller: Well, my current lease expires on the 28th, but I would like to move in on Tuesday, the 15th of August.",
    "prompt": "Complete the notes below. Write ONE WORD AND/OR A NUMBER for each answer:\nTenant surname: 1 ________\nPreferred move-in date: 15th 2 ________",
    "answer": "1: Harrison | 2: August",
    "explanationVi": "Tên họ được đánh vần trực tiếp: Harrison. Ngày chuyển vào là ngày 15 tháng 8 (August).",
    "evidenceQuote": "spelled H-A-R-R-I-S-O-N ... Tuesday, the 15th of August",
    "tip": "Cẩn thận bẫy người nói đổi ý (Self-correction). Nghe kỹ các chữ số và chữ cái đánh vần."
  },
  {
    "id": "drill-ls-form-11",
    "skill": "listening",
    "typeId": "listening-form-completion",
    "title": "Listening Drill · Form & Note Completion #11",
    "contextText": "TRANSCRIPT EXCERPT:\nAdviser: And what is the primary telephone number where we can reach you?\nCaller: You can catch me on my mobile. It's 07792... wait, sorry, that's my work extension. My direct personal line is 07841 552904.\nAdviser: Got it, 07841 552904. And what maximum monthly budget were you hoping for?\nCaller: I can afford up to £850 per month, inclusive of utility bills.",
    "prompt": "Complete the notes below. Write ONE WORD AND/OR A NUMBER for each answer:\nDirect contact number: 1 ________\nMaximum monthly budget: £ 2 ________",
    "answer": "1: 07841 552904 | 2: 850",
    "explanationVi": "Người nói tự đính chính số điện thoại công việc sang số cá nhân 07841 552904. Ngân sách tối đa là 850.",
    "evidenceQuote": "My direct personal line is 07841 552904 ... afford up to £850 per month",
    "tip": "Cẩn thận bẫy người nói đổi ý (Self-correction). Nghe kỹ các chữ số và chữ cái đánh vần."
  },
  {
    "id": "drill-ls-form-12",
    "skill": "listening",
    "typeId": "listening-form-completion",
    "title": "Listening Drill · Form & Note Completion #12",
    "contextText": "TRANSCRIPT EXCERPT:\nInstructor: For your introductory scuba session, we provide all basic equipment including regulator and buoyancy jacket. However, all participants must bring their own towel and a pair of sturdy neoprene boots. Also, please remember to present a valid medical certificate before entering the pool.",
    "prompt": "Complete the notes below. Write NO MORE THAN TWO WORDS for each answer:\nRequired personal items: towel and neoprene 1 ________\nCompulsory document: valid 2 ________",
    "answer": "1: boots | 2: medical certificate",
    "explanationVi": "Vật dụng cá nhân là boots (hoặc neoprene boots). Giấy tờ bắt buộc là medical certificate.",
    "evidenceQuote": "bring their own towel and a pair of sturdy neoprene boots ... present a valid medical certificate",
    "tip": "Cẩn thận bẫy người nói đổi ý (Self-correction). Nghe kỹ các chữ số và chữ cái đánh vần."
  },
  {
    "id": "drill-ls-form-13",
    "skill": "listening",
    "typeId": "listening-form-completion",
    "title": "Listening Drill · Form & Note Completion #13",
    "contextText": "TRANSCRIPT EXCERPT:\nAgent: Hello, Westview Property Lettings, how may I assist you?\nCaller: Hi, I'm calling about the two-bedroom flat on Willow Street. Could I register my details?\nAgent: Certainly. Could you give me your surname first?\nCaller: Yes, it's Harrison, spelled H-A-R-R-I-S-O-N.\nAgent: Thank you, Mr. Harrison. And what is your preferred move-in date?\nCaller: Well, my current lease expires on the 28th, but I would like to move in on Tuesday, the 15th of August.",
    "prompt": "Complete the notes below. Write ONE WORD AND/OR A NUMBER for each answer:\nTenant surname: 1 ________\nPreferred move-in date: 15th 2 ________",
    "answer": "1: Harrison | 2: August",
    "explanationVi": "Tên họ được đánh vần trực tiếp: Harrison. Ngày chuyển vào là ngày 15 tháng 8 (August).",
    "evidenceQuote": "spelled H-A-R-R-I-S-O-N ... Tuesday, the 15th of August",
    "tip": "Cẩn thận bẫy người nói đổi ý (Self-correction). Nghe kỹ các chữ số và chữ cái đánh vần."
  },
  {
    "id": "drill-ls-form-14",
    "skill": "listening",
    "typeId": "listening-form-completion",
    "title": "Listening Drill · Form & Note Completion #14",
    "contextText": "TRANSCRIPT EXCERPT:\nAdviser: And what is the primary telephone number where we can reach you?\nCaller: You can catch me on my mobile. It's 07792... wait, sorry, that's my work extension. My direct personal line is 07841 552904.\nAdviser: Got it, 07841 552904. And what maximum monthly budget were you hoping for?\nCaller: I can afford up to £850 per month, inclusive of utility bills.",
    "prompt": "Complete the notes below. Write ONE WORD AND/OR A NUMBER for each answer:\nDirect contact number: 1 ________\nMaximum monthly budget: £ 2 ________",
    "answer": "1: 07841 552904 | 2: 850",
    "explanationVi": "Người nói tự đính chính số điện thoại công việc sang số cá nhân 07841 552904. Ngân sách tối đa là 850.",
    "evidenceQuote": "My direct personal line is 07841 552904 ... afford up to £850 per month",
    "tip": "Cẩn thận bẫy người nói đổi ý (Self-correction). Nghe kỹ các chữ số và chữ cái đánh vần."
  },
  {
    "id": "drill-ls-form-15",
    "skill": "listening",
    "typeId": "listening-form-completion",
    "title": "Listening Drill · Form & Note Completion #15",
    "contextText": "TRANSCRIPT EXCERPT:\nInstructor: For your introductory scuba session, we provide all basic equipment including regulator and buoyancy jacket. However, all participants must bring their own towel and a pair of sturdy neoprene boots. Also, please remember to present a valid medical certificate before entering the pool.",
    "prompt": "Complete the notes below. Write NO MORE THAN TWO WORDS for each answer:\nRequired personal items: towel and neoprene 1 ________\nCompulsory document: valid 2 ________",
    "answer": "1: boots | 2: medical certificate",
    "explanationVi": "Vật dụng cá nhân là boots (hoặc neoprene boots). Giấy tờ bắt buộc là medical certificate.",
    "evidenceQuote": "bring their own towel and a pair of sturdy neoprene boots ... present a valid medical certificate",
    "tip": "Cẩn thận bẫy người nói đổi ý (Self-correction). Nghe kỹ các chữ số và chữ cái đánh vần."
  },
  {
    "id": "drill-ls-form-16",
    "skill": "listening",
    "typeId": "listening-form-completion",
    "title": "Listening Drill · Form & Note Completion #16",
    "contextText": "TRANSCRIPT EXCERPT:\nAgent: Hello, Westview Property Lettings, how may I assist you?\nCaller: Hi, I'm calling about the two-bedroom flat on Willow Street. Could I register my details?\nAgent: Certainly. Could you give me your surname first?\nCaller: Yes, it's Harrison, spelled H-A-R-R-I-S-O-N.\nAgent: Thank you, Mr. Harrison. And what is your preferred move-in date?\nCaller: Well, my current lease expires on the 28th, but I would like to move in on Tuesday, the 15th of August.",
    "prompt": "Complete the notes below. Write ONE WORD AND/OR A NUMBER for each answer:\nTenant surname: 1 ________\nPreferred move-in date: 15th 2 ________",
    "answer": "1: Harrison | 2: August",
    "explanationVi": "Tên họ được đánh vần trực tiếp: Harrison. Ngày chuyển vào là ngày 15 tháng 8 (August).",
    "evidenceQuote": "spelled H-A-R-R-I-S-O-N ... Tuesday, the 15th of August",
    "tip": "Cẩn thận bẫy người nói đổi ý (Self-correction). Nghe kỹ các chữ số và chữ cái đánh vần."
  },
  {
    "id": "drill-ls-form-17",
    "skill": "listening",
    "typeId": "listening-form-completion",
    "title": "Listening Drill · Form & Note Completion #17",
    "contextText": "TRANSCRIPT EXCERPT:\nAdviser: And what is the primary telephone number where we can reach you?\nCaller: You can catch me on my mobile. It's 07792... wait, sorry, that's my work extension. My direct personal line is 07841 552904.\nAdviser: Got it, 07841 552904. And what maximum monthly budget were you hoping for?\nCaller: I can afford up to £850 per month, inclusive of utility bills.",
    "prompt": "Complete the notes below. Write ONE WORD AND/OR A NUMBER for each answer:\nDirect contact number: 1 ________\nMaximum monthly budget: £ 2 ________",
    "answer": "1: 07841 552904 | 2: 850",
    "explanationVi": "Người nói tự đính chính số điện thoại công việc sang số cá nhân 07841 552904. Ngân sách tối đa là 850.",
    "evidenceQuote": "My direct personal line is 07841 552904 ... afford up to £850 per month",
    "tip": "Cẩn thận bẫy người nói đổi ý (Self-correction). Nghe kỹ các chữ số và chữ cái đánh vần."
  },
  {
    "id": "drill-ls-form-18",
    "skill": "listening",
    "typeId": "listening-form-completion",
    "title": "Listening Drill · Form & Note Completion #18",
    "contextText": "TRANSCRIPT EXCERPT:\nInstructor: For your introductory scuba session, we provide all basic equipment including regulator and buoyancy jacket. However, all participants must bring their own towel and a pair of sturdy neoprene boots. Also, please remember to present a valid medical certificate before entering the pool.",
    "prompt": "Complete the notes below. Write NO MORE THAN TWO WORDS for each answer:\nRequired personal items: towel and neoprene 1 ________\nCompulsory document: valid 2 ________",
    "answer": "1: boots | 2: medical certificate",
    "explanationVi": "Vật dụng cá nhân là boots (hoặc neoprene boots). Giấy tờ bắt buộc là medical certificate.",
    "evidenceQuote": "bring their own towel and a pair of sturdy neoprene boots ... present a valid medical certificate",
    "tip": "Cẩn thận bẫy người nói đổi ý (Self-correction). Nghe kỹ các chữ số và chữ cái đánh vần."
  },
  {
    "id": "drill-ls-form-19",
    "skill": "listening",
    "typeId": "listening-form-completion",
    "title": "Listening Drill · Form & Note Completion #19",
    "contextText": "TRANSCRIPT EXCERPT:\nAgent: Hello, Westview Property Lettings, how may I assist you?\nCaller: Hi, I'm calling about the two-bedroom flat on Willow Street. Could I register my details?\nAgent: Certainly. Could you give me your surname first?\nCaller: Yes, it's Harrison, spelled H-A-R-R-I-S-O-N.\nAgent: Thank you, Mr. Harrison. And what is your preferred move-in date?\nCaller: Well, my current lease expires on the 28th, but I would like to move in on Tuesday, the 15th of August.",
    "prompt": "Complete the notes below. Write ONE WORD AND/OR A NUMBER for each answer:\nTenant surname: 1 ________\nPreferred move-in date: 15th 2 ________",
    "answer": "1: Harrison | 2: August",
    "explanationVi": "Tên họ được đánh vần trực tiếp: Harrison. Ngày chuyển vào là ngày 15 tháng 8 (August).",
    "evidenceQuote": "spelled H-A-R-R-I-S-O-N ... Tuesday, the 15th of August",
    "tip": "Cẩn thận bẫy người nói đổi ý (Self-correction). Nghe kỹ các chữ số và chữ cái đánh vần."
  },
  {
    "id": "drill-ls-form-20",
    "skill": "listening",
    "typeId": "listening-form-completion",
    "title": "Listening Drill · Form & Note Completion #20",
    "contextText": "TRANSCRIPT EXCERPT:\nAdviser: And what is the primary telephone number where we can reach you?\nCaller: You can catch me on my mobile. It's 07792... wait, sorry, that's my work extension. My direct personal line is 07841 552904.\nAdviser: Got it, 07841 552904. And what maximum monthly budget were you hoping for?\nCaller: I can afford up to £850 per month, inclusive of utility bills.",
    "prompt": "Complete the notes below. Write ONE WORD AND/OR A NUMBER for each answer:\nDirect contact number: 1 ________\nMaximum monthly budget: £ 2 ________",
    "answer": "1: 07841 552904 | 2: 850",
    "explanationVi": "Người nói tự đính chính số điện thoại công việc sang số cá nhân 07841 552904. Ngân sách tối đa là 850.",
    "evidenceQuote": "My direct personal line is 07841 552904 ... afford up to £850 per month",
    "tip": "Cẩn thận bẫy người nói đổi ý (Self-correction). Nghe kỹ các chữ số và chữ cái đánh vần."
  },
  {
    "id": "drill-ls-map-01",
    "skill": "listening",
    "typeId": "listening-map-labelling",
    "title": "Listening Drill · Map & Direction Labelling #1",
    "contextText": "TRANSCRIPT EXCERPT:\nGuide: Welcome to the Riverside Nature Reserve. If you look at your trail maps, we are currently standing at the South Visitor Pavilion right by the car park. If you take the main gravel footpath leading north toward the central pond, immediately after you cross the wooden footbridge, you'll see a small wooden observation hide directly on your left, perfectly situated for viewing wetland herons. If you continue straight along the eastern shoreline instead, you will come to the wildflower sensory garden nestled in the north-east corner.",
    "prompt": "On the trail map, where is the Bird Observation Hide located?\nA Next to the car park in the south\nB On the left side immediately after crossing the footbridge\nC In the far north-east corner behind the woods\nD Directly in the center of the lake island",
    "options": [
      "A Next to the car park in the south",
      "B On the left side immediately after crossing the footbridge",
      "C In the far north-east corner behind the woods",
      "D Directly in the center of the lake island"
    ],
    "answer": "B On the left side immediately after crossing the footbridge",
    "explanationVi": "Người hướng dẫn chỉ rõ chòi ngắm chim nằm ngay bên tay trái sau khi qua cầu gỗ (Option B).",
    "evidenceQuote": "immediately after you cross the wooden footbridge, you'll see a small wooden observation hide directly on your left",
    "tip": "Xác định mốc xuất phát và lần theo các từ chỉ hướng: left, right, straight ahead, opposite, past the bridge."
  },
  {
    "id": "drill-ls-map-02",
    "skill": "listening",
    "typeId": "listening-map-labelling",
    "title": "Listening Drill · Map & Direction Labelling #2",
    "contextText": "TRANSCRIPT EXCERPT:\nGuide: Welcome to the Riverside Nature Reserve. If you look at your trail maps, we are currently standing at the South Visitor Pavilion right by the car park. If you take the main gravel footpath leading north toward the central pond, immediately after you cross the wooden footbridge, you'll see a small wooden observation hide directly on your left, perfectly situated for viewing wetland herons. If you continue straight along the eastern shoreline instead, you will come to the wildflower sensory garden nestled in the north-east corner.",
    "prompt": "On the trail map, where is the Bird Observation Hide located?\nA Next to the car park in the south\nB On the left side immediately after crossing the footbridge\nC In the far north-east corner behind the woods\nD Directly in the center of the lake island",
    "options": [
      "A Next to the car park in the south",
      "B On the left side immediately after crossing the footbridge",
      "C In the far north-east corner behind the woods",
      "D Directly in the center of the lake island"
    ],
    "answer": "B On the left side immediately after crossing the footbridge",
    "explanationVi": "Người hướng dẫn chỉ rõ chòi ngắm chim nằm ngay bên tay trái sau khi qua cầu gỗ (Option B).",
    "evidenceQuote": "immediately after you cross the wooden footbridge, you'll see a small wooden observation hide directly on your left",
    "tip": "Xác định mốc xuất phát và lần theo các từ chỉ hướng: left, right, straight ahead, opposite, past the bridge."
  },
  {
    "id": "drill-ls-map-03",
    "skill": "listening",
    "typeId": "listening-map-labelling",
    "title": "Listening Drill · Map & Direction Labelling #3",
    "contextText": "TRANSCRIPT EXCERPT:\nGuide: Welcome to the Riverside Nature Reserve. If you look at your trail maps, we are currently standing at the South Visitor Pavilion right by the car park. If you take the main gravel footpath leading north toward the central pond, immediately after you cross the wooden footbridge, you'll see a small wooden observation hide directly on your left, perfectly situated for viewing wetland herons. If you continue straight along the eastern shoreline instead, you will come to the wildflower sensory garden nestled in the north-east corner.",
    "prompt": "On the trail map, where is the Bird Observation Hide located?\nA Next to the car park in the south\nB On the left side immediately after crossing the footbridge\nC In the far north-east corner behind the woods\nD Directly in the center of the lake island",
    "options": [
      "A Next to the car park in the south",
      "B On the left side immediately after crossing the footbridge",
      "C In the far north-east corner behind the woods",
      "D Directly in the center of the lake island"
    ],
    "answer": "B On the left side immediately after crossing the footbridge",
    "explanationVi": "Người hướng dẫn chỉ rõ chòi ngắm chim nằm ngay bên tay trái sau khi qua cầu gỗ (Option B).",
    "evidenceQuote": "immediately after you cross the wooden footbridge, you'll see a small wooden observation hide directly on your left",
    "tip": "Xác định mốc xuất phát và lần theo các từ chỉ hướng: left, right, straight ahead, opposite, past the bridge."
  },
  {
    "id": "drill-ls-map-04",
    "skill": "listening",
    "typeId": "listening-map-labelling",
    "title": "Listening Drill · Map & Direction Labelling #4",
    "contextText": "TRANSCRIPT EXCERPT:\nGuide: Welcome to the Riverside Nature Reserve. If you look at your trail maps, we are currently standing at the South Visitor Pavilion right by the car park. If you take the main gravel footpath leading north toward the central pond, immediately after you cross the wooden footbridge, you'll see a small wooden observation hide directly on your left, perfectly situated for viewing wetland herons. If you continue straight along the eastern shoreline instead, you will come to the wildflower sensory garden nestled in the north-east corner.",
    "prompt": "On the trail map, where is the Bird Observation Hide located?\nA Next to the car park in the south\nB On the left side immediately after crossing the footbridge\nC In the far north-east corner behind the woods\nD Directly in the center of the lake island",
    "options": [
      "A Next to the car park in the south",
      "B On the left side immediately after crossing the footbridge",
      "C In the far north-east corner behind the woods",
      "D Directly in the center of the lake island"
    ],
    "answer": "B On the left side immediately after crossing the footbridge",
    "explanationVi": "Người hướng dẫn chỉ rõ chòi ngắm chim nằm ngay bên tay trái sau khi qua cầu gỗ (Option B).",
    "evidenceQuote": "immediately after you cross the wooden footbridge, you'll see a small wooden observation hide directly on your left",
    "tip": "Xác định mốc xuất phát và lần theo các từ chỉ hướng: left, right, straight ahead, opposite, past the bridge."
  },
  {
    "id": "drill-ls-map-05",
    "skill": "listening",
    "typeId": "listening-map-labelling",
    "title": "Listening Drill · Map & Direction Labelling #5",
    "contextText": "TRANSCRIPT EXCERPT:\nGuide: Welcome to the Riverside Nature Reserve. If you look at your trail maps, we are currently standing at the South Visitor Pavilion right by the car park. If you take the main gravel footpath leading north toward the central pond, immediately after you cross the wooden footbridge, you'll see a small wooden observation hide directly on your left, perfectly situated for viewing wetland herons. If you continue straight along the eastern shoreline instead, you will come to the wildflower sensory garden nestled in the north-east corner.",
    "prompt": "On the trail map, where is the Bird Observation Hide located?\nA Next to the car park in the south\nB On the left side immediately after crossing the footbridge\nC In the far north-east corner behind the woods\nD Directly in the center of the lake island",
    "options": [
      "A Next to the car park in the south",
      "B On the left side immediately after crossing the footbridge",
      "C In the far north-east corner behind the woods",
      "D Directly in the center of the lake island"
    ],
    "answer": "B On the left side immediately after crossing the footbridge",
    "explanationVi": "Người hướng dẫn chỉ rõ chòi ngắm chim nằm ngay bên tay trái sau khi qua cầu gỗ (Option B).",
    "evidenceQuote": "immediately after you cross the wooden footbridge, you'll see a small wooden observation hide directly on your left",
    "tip": "Xác định mốc xuất phát và lần theo các từ chỉ hướng: left, right, straight ahead, opposite, past the bridge."
  },
  {
    "id": "drill-ls-map-06",
    "skill": "listening",
    "typeId": "listening-map-labelling",
    "title": "Listening Drill · Map & Direction Labelling #6",
    "contextText": "TRANSCRIPT EXCERPT:\nGuide: Welcome to the Riverside Nature Reserve. If you look at your trail maps, we are currently standing at the South Visitor Pavilion right by the car park. If you take the main gravel footpath leading north toward the central pond, immediately after you cross the wooden footbridge, you'll see a small wooden observation hide directly on your left, perfectly situated for viewing wetland herons. If you continue straight along the eastern shoreline instead, you will come to the wildflower sensory garden nestled in the north-east corner.",
    "prompt": "On the trail map, where is the Bird Observation Hide located?\nA Next to the car park in the south\nB On the left side immediately after crossing the footbridge\nC In the far north-east corner behind the woods\nD Directly in the center of the lake island",
    "options": [
      "A Next to the car park in the south",
      "B On the left side immediately after crossing the footbridge",
      "C In the far north-east corner behind the woods",
      "D Directly in the center of the lake island"
    ],
    "answer": "B On the left side immediately after crossing the footbridge",
    "explanationVi": "Người hướng dẫn chỉ rõ chòi ngắm chim nằm ngay bên tay trái sau khi qua cầu gỗ (Option B).",
    "evidenceQuote": "immediately after you cross the wooden footbridge, you'll see a small wooden observation hide directly on your left",
    "tip": "Xác định mốc xuất phát và lần theo các từ chỉ hướng: left, right, straight ahead, opposite, past the bridge."
  },
  {
    "id": "drill-ls-map-07",
    "skill": "listening",
    "typeId": "listening-map-labelling",
    "title": "Listening Drill · Map & Direction Labelling #7",
    "contextText": "TRANSCRIPT EXCERPT:\nGuide: Welcome to the Riverside Nature Reserve. If you look at your trail maps, we are currently standing at the South Visitor Pavilion right by the car park. If you take the main gravel footpath leading north toward the central pond, immediately after you cross the wooden footbridge, you'll see a small wooden observation hide directly on your left, perfectly situated for viewing wetland herons. If you continue straight along the eastern shoreline instead, you will come to the wildflower sensory garden nestled in the north-east corner.",
    "prompt": "On the trail map, where is the Bird Observation Hide located?\nA Next to the car park in the south\nB On the left side immediately after crossing the footbridge\nC In the far north-east corner behind the woods\nD Directly in the center of the lake island",
    "options": [
      "A Next to the car park in the south",
      "B On the left side immediately after crossing the footbridge",
      "C In the far north-east corner behind the woods",
      "D Directly in the center of the lake island"
    ],
    "answer": "B On the left side immediately after crossing the footbridge",
    "explanationVi": "Người hướng dẫn chỉ rõ chòi ngắm chim nằm ngay bên tay trái sau khi qua cầu gỗ (Option B).",
    "evidenceQuote": "immediately after you cross the wooden footbridge, you'll see a small wooden observation hide directly on your left",
    "tip": "Xác định mốc xuất phát và lần theo các từ chỉ hướng: left, right, straight ahead, opposite, past the bridge."
  },
  {
    "id": "drill-ls-map-08",
    "skill": "listening",
    "typeId": "listening-map-labelling",
    "title": "Listening Drill · Map & Direction Labelling #8",
    "contextText": "TRANSCRIPT EXCERPT:\nGuide: Welcome to the Riverside Nature Reserve. If you look at your trail maps, we are currently standing at the South Visitor Pavilion right by the car park. If you take the main gravel footpath leading north toward the central pond, immediately after you cross the wooden footbridge, you'll see a small wooden observation hide directly on your left, perfectly situated for viewing wetland herons. If you continue straight along the eastern shoreline instead, you will come to the wildflower sensory garden nestled in the north-east corner.",
    "prompt": "On the trail map, where is the Bird Observation Hide located?\nA Next to the car park in the south\nB On the left side immediately after crossing the footbridge\nC In the far north-east corner behind the woods\nD Directly in the center of the lake island",
    "options": [
      "A Next to the car park in the south",
      "B On the left side immediately after crossing the footbridge",
      "C In the far north-east corner behind the woods",
      "D Directly in the center of the lake island"
    ],
    "answer": "B On the left side immediately after crossing the footbridge",
    "explanationVi": "Người hướng dẫn chỉ rõ chòi ngắm chim nằm ngay bên tay trái sau khi qua cầu gỗ (Option B).",
    "evidenceQuote": "immediately after you cross the wooden footbridge, you'll see a small wooden observation hide directly on your left",
    "tip": "Xác định mốc xuất phát và lần theo các từ chỉ hướng: left, right, straight ahead, opposite, past the bridge."
  },
  {
    "id": "drill-ls-map-09",
    "skill": "listening",
    "typeId": "listening-map-labelling",
    "title": "Listening Drill · Map & Direction Labelling #9",
    "contextText": "TRANSCRIPT EXCERPT:\nGuide: Welcome to the Riverside Nature Reserve. If you look at your trail maps, we are currently standing at the South Visitor Pavilion right by the car park. If you take the main gravel footpath leading north toward the central pond, immediately after you cross the wooden footbridge, you'll see a small wooden observation hide directly on your left, perfectly situated for viewing wetland herons. If you continue straight along the eastern shoreline instead, you will come to the wildflower sensory garden nestled in the north-east corner.",
    "prompt": "On the trail map, where is the Bird Observation Hide located?\nA Next to the car park in the south\nB On the left side immediately after crossing the footbridge\nC In the far north-east corner behind the woods\nD Directly in the center of the lake island",
    "options": [
      "A Next to the car park in the south",
      "B On the left side immediately after crossing the footbridge",
      "C In the far north-east corner behind the woods",
      "D Directly in the center of the lake island"
    ],
    "answer": "B On the left side immediately after crossing the footbridge",
    "explanationVi": "Người hướng dẫn chỉ rõ chòi ngắm chim nằm ngay bên tay trái sau khi qua cầu gỗ (Option B).",
    "evidenceQuote": "immediately after you cross the wooden footbridge, you'll see a small wooden observation hide directly on your left",
    "tip": "Xác định mốc xuất phát và lần theo các từ chỉ hướng: left, right, straight ahead, opposite, past the bridge."
  },
  {
    "id": "drill-ls-map-10",
    "skill": "listening",
    "typeId": "listening-map-labelling",
    "title": "Listening Drill · Map & Direction Labelling #10",
    "contextText": "TRANSCRIPT EXCERPT:\nGuide: Welcome to the Riverside Nature Reserve. If you look at your trail maps, we are currently standing at the South Visitor Pavilion right by the car park. If you take the main gravel footpath leading north toward the central pond, immediately after you cross the wooden footbridge, you'll see a small wooden observation hide directly on your left, perfectly situated for viewing wetland herons. If you continue straight along the eastern shoreline instead, you will come to the wildflower sensory garden nestled in the north-east corner.",
    "prompt": "On the trail map, where is the Bird Observation Hide located?\nA Next to the car park in the south\nB On the left side immediately after crossing the footbridge\nC In the far north-east corner behind the woods\nD Directly in the center of the lake island",
    "options": [
      "A Next to the car park in the south",
      "B On the left side immediately after crossing the footbridge",
      "C In the far north-east corner behind the woods",
      "D Directly in the center of the lake island"
    ],
    "answer": "B On the left side immediately after crossing the footbridge",
    "explanationVi": "Người hướng dẫn chỉ rõ chòi ngắm chim nằm ngay bên tay trái sau khi qua cầu gỗ (Option B).",
    "evidenceQuote": "immediately after you cross the wooden footbridge, you'll see a small wooden observation hide directly on your left",
    "tip": "Xác định mốc xuất phát và lần theo các từ chỉ hướng: left, right, straight ahead, opposite, past the bridge."
  },
  {
    "id": "drill-wr-01",
    "skill": "writing",
    "typeId": "writing-task-1-chart",
    "title": "Writing Drill · Writing Task 1 Drill · Overview Identification #1",
    "contextText": "PROMPT: The line graph shows the percentage of households with internet access in three European countries (United Kingdom, Germany, and Spain) between 2000 and 2020.\nDATA: UK grew steadily from 30% to 92%. Germany rose from 25% to 88%. Spain rose from 10% to 85%.",
    "prompt": "Which of the following serves as the most effective Academic Overview for this Task 1 report?\nA In 2000, 30% of UK households had internet, compared to 25% in Germany and only 10% in Spain.\nB Overall, all three nations experienced substantial growth in household internet connectivity over the two-decade period, with the UK consistently maintaining the highest proportion throughout.\nC People in Spain probably did not have computers in 2000 because of economic instability.\nD Between 2005 and 2010, Germany's internet adoption rate increased by precisely 18 percentage points.",
    "options": [
      "A In 2000, 30% of UK households had internet, compared to 25% in Germany and only 10% in Spain.",
      "B Overall, all three nations experienced substantial growth in household internet connectivity over the two-decade period, with the UK consistently maintaining the highest proportion throughout.",
      "C People in Spain probably did not have computers in 2000 because of economic instability.",
      "D Between 2005 and 2010, Germany's internet adoption rate increased by precisely 18 percentage points."
    ],
    "answer": "B Overall, all three nations experienced substantial growth in household internet connectivity over the two-decade period, with the UK consistently maintaining the highest proportion throughout.",
    "explanationVi": "Overview chuẩn phải chỉ ra xu hướng chung (tất cả đều tăng mạnh) và đối tượng nổi bật nhất (UK luôn dẫn đầu) mà không đưa số liệu chi tiết (Option B).",
    "evidenceQuote": "all three nations experienced substantial growth... UK consistently maintaining the highest proportion throughout.",
    "tip": "Overview Task 1 tuyệt đối không đưa số liệu cụ thể. Mở bài Task 2 phải có Thesis statement nêu rõ lập trường của bạn."
  },
  {
    "id": "drill-wr-02",
    "skill": "writing",
    "typeId": "writing-task-2-opinion",
    "title": "Writing Drill · Writing Task 2 Drill · Thesis Statement Formulation #2",
    "contextText": "PROMPT: Some educators propose that secondary schools should mandate daily physical education for all pupils to combat adolescent sedentary health risks. To what extent do you agree or disagree?",
    "prompt": "Which introduction paragraph provides the clearest thesis statement expressing a balanced academic viewpoint?\nA Many people talk about health today. Schools are very important for children.\nB While daily physical training undeniably promotes cardiovascular vitality, I contend that compulsory daily participation may encroach upon essential academic curricula; therefore, a balanced tri-weekly schedule represents a more viable institutional compromise.\nC I completely agree because playing football is my favorite hobby with my school friends.\nD Physical education was first established in ancient Greece and has evolved into modern sports leagues.",
    "options": [
      "A Many people talk about health today. Schools are very important for children.",
      "B While daily physical training undeniably promotes cardiovascular vitality, I contend that compulsory daily participation may encroach upon essential academic curricula; therefore, a balanced tri-weekly schedule represents a more viable institutional compromise.",
      "C I completely agree because playing football is my favorite hobby with my school friends.",
      "D Physical education was first established in ancient Greece and has evolved into modern sports leagues."
    ],
    "answer": "B While daily physical training undeniably promotes cardiovascular vitality, I contend that compulsory daily participation may encroach upon essential academic curricula; therefore, a balanced tri-weekly schedule represents a more viable institutional compromise.",
    "explanationVi": "Option B đưa ra quan điểm học thuật rõ ràng (Thesis statement), có nhượng bộ (Concession) và giải pháp cụ thể, đạt tiêu chuẩn Band 8.0+ cho Task Response.",
    "evidenceQuote": "While daily physical training undeniably promotes... I contend that compulsory daily participation may encroach upon...",
    "tip": "Overview Task 1 tuyệt đối không đưa số liệu cụ thể. Mở bài Task 2 phải có Thesis statement nêu rõ lập trường của bạn."
  },
  {
    "id": "drill-wr-03",
    "skill": "writing",
    "typeId": "writing-task-1-chart",
    "title": "Writing Drill · Writing Task 1 Drill · Overview Identification #3",
    "contextText": "PROMPT: The line graph shows the percentage of households with internet access in three European countries (United Kingdom, Germany, and Spain) between 2000 and 2020.\nDATA: UK grew steadily from 30% to 92%. Germany rose from 25% to 88%. Spain rose from 10% to 85%.",
    "prompt": "Which of the following serves as the most effective Academic Overview for this Task 1 report?\nA In 2000, 30% of UK households had internet, compared to 25% in Germany and only 10% in Spain.\nB Overall, all three nations experienced substantial growth in household internet connectivity over the two-decade period, with the UK consistently maintaining the highest proportion throughout.\nC People in Spain probably did not have computers in 2000 because of economic instability.\nD Between 2005 and 2010, Germany's internet adoption rate increased by precisely 18 percentage points.",
    "options": [
      "A In 2000, 30% of UK households had internet, compared to 25% in Germany and only 10% in Spain.",
      "B Overall, all three nations experienced substantial growth in household internet connectivity over the two-decade period, with the UK consistently maintaining the highest proportion throughout.",
      "C People in Spain probably did not have computers in 2000 because of economic instability.",
      "D Between 2005 and 2010, Germany's internet adoption rate increased by precisely 18 percentage points."
    ],
    "answer": "B Overall, all three nations experienced substantial growth in household internet connectivity over the two-decade period, with the UK consistently maintaining the highest proportion throughout.",
    "explanationVi": "Overview chuẩn phải chỉ ra xu hướng chung (tất cả đều tăng mạnh) và đối tượng nổi bật nhất (UK luôn dẫn đầu) mà không đưa số liệu chi tiết (Option B).",
    "evidenceQuote": "all three nations experienced substantial growth... UK consistently maintaining the highest proportion throughout.",
    "tip": "Overview Task 1 tuyệt đối không đưa số liệu cụ thể. Mở bài Task 2 phải có Thesis statement nêu rõ lập trường của bạn."
  },
  {
    "id": "drill-wr-04",
    "skill": "writing",
    "typeId": "writing-task-2-opinion",
    "title": "Writing Drill · Writing Task 2 Drill · Thesis Statement Formulation #4",
    "contextText": "PROMPT: Some educators propose that secondary schools should mandate daily physical education for all pupils to combat adolescent sedentary health risks. To what extent do you agree or disagree?",
    "prompt": "Which introduction paragraph provides the clearest thesis statement expressing a balanced academic viewpoint?\nA Many people talk about health today. Schools are very important for children.\nB While daily physical training undeniably promotes cardiovascular vitality, I contend that compulsory daily participation may encroach upon essential academic curricula; therefore, a balanced tri-weekly schedule represents a more viable institutional compromise.\nC I completely agree because playing football is my favorite hobby with my school friends.\nD Physical education was first established in ancient Greece and has evolved into modern sports leagues.",
    "options": [
      "A Many people talk about health today. Schools are very important for children.",
      "B While daily physical training undeniably promotes cardiovascular vitality, I contend that compulsory daily participation may encroach upon essential academic curricula; therefore, a balanced tri-weekly schedule represents a more viable institutional compromise.",
      "C I completely agree because playing football is my favorite hobby with my school friends.",
      "D Physical education was first established in ancient Greece and has evolved into modern sports leagues."
    ],
    "answer": "B While daily physical training undeniably promotes cardiovascular vitality, I contend that compulsory daily participation may encroach upon essential academic curricula; therefore, a balanced tri-weekly schedule represents a more viable institutional compromise.",
    "explanationVi": "Option B đưa ra quan điểm học thuật rõ ràng (Thesis statement), có nhượng bộ (Concession) và giải pháp cụ thể, đạt tiêu chuẩn Band 8.0+ cho Task Response.",
    "evidenceQuote": "While daily physical training undeniably promotes... I contend that compulsory daily participation may encroach upon...",
    "tip": "Overview Task 1 tuyệt đối không đưa số liệu cụ thể. Mở bài Task 2 phải có Thesis statement nêu rõ lập trường của bạn."
  },
  {
    "id": "drill-wr-05",
    "skill": "writing",
    "typeId": "writing-task-1-chart",
    "title": "Writing Drill · Writing Task 1 Drill · Overview Identification #5",
    "contextText": "PROMPT: The line graph shows the percentage of households with internet access in three European countries (United Kingdom, Germany, and Spain) between 2000 and 2020.\nDATA: UK grew steadily from 30% to 92%. Germany rose from 25% to 88%. Spain rose from 10% to 85%.",
    "prompt": "Which of the following serves as the most effective Academic Overview for this Task 1 report?\nA In 2000, 30% of UK households had internet, compared to 25% in Germany and only 10% in Spain.\nB Overall, all three nations experienced substantial growth in household internet connectivity over the two-decade period, with the UK consistently maintaining the highest proportion throughout.\nC People in Spain probably did not have computers in 2000 because of economic instability.\nD Between 2005 and 2010, Germany's internet adoption rate increased by precisely 18 percentage points.",
    "options": [
      "A In 2000, 30% of UK households had internet, compared to 25% in Germany and only 10% in Spain.",
      "B Overall, all three nations experienced substantial growth in household internet connectivity over the two-decade period, with the UK consistently maintaining the highest proportion throughout.",
      "C People in Spain probably did not have computers in 2000 because of economic instability.",
      "D Between 2005 and 2010, Germany's internet adoption rate increased by precisely 18 percentage points."
    ],
    "answer": "B Overall, all three nations experienced substantial growth in household internet connectivity over the two-decade period, with the UK consistently maintaining the highest proportion throughout.",
    "explanationVi": "Overview chuẩn phải chỉ ra xu hướng chung (tất cả đều tăng mạnh) và đối tượng nổi bật nhất (UK luôn dẫn đầu) mà không đưa số liệu chi tiết (Option B).",
    "evidenceQuote": "all three nations experienced substantial growth... UK consistently maintaining the highest proportion throughout.",
    "tip": "Overview Task 1 tuyệt đối không đưa số liệu cụ thể. Mở bài Task 2 phải có Thesis statement nêu rõ lập trường của bạn."
  },
  {
    "id": "drill-wr-06",
    "skill": "writing",
    "typeId": "writing-task-2-opinion",
    "title": "Writing Drill · Writing Task 2 Drill · Thesis Statement Formulation #6",
    "contextText": "PROMPT: Some educators propose that secondary schools should mandate daily physical education for all pupils to combat adolescent sedentary health risks. To what extent do you agree or disagree?",
    "prompt": "Which introduction paragraph provides the clearest thesis statement expressing a balanced academic viewpoint?\nA Many people talk about health today. Schools are very important for children.\nB While daily physical training undeniably promotes cardiovascular vitality, I contend that compulsory daily participation may encroach upon essential academic curricula; therefore, a balanced tri-weekly schedule represents a more viable institutional compromise.\nC I completely agree because playing football is my favorite hobby with my school friends.\nD Physical education was first established in ancient Greece and has evolved into modern sports leagues.",
    "options": [
      "A Many people talk about health today. Schools are very important for children.",
      "B While daily physical training undeniably promotes cardiovascular vitality, I contend that compulsory daily participation may encroach upon essential academic curricula; therefore, a balanced tri-weekly schedule represents a more viable institutional compromise.",
      "C I completely agree because playing football is my favorite hobby with my school friends.",
      "D Physical education was first established in ancient Greece and has evolved into modern sports leagues."
    ],
    "answer": "B While daily physical training undeniably promotes cardiovascular vitality, I contend that compulsory daily participation may encroach upon essential academic curricula; therefore, a balanced tri-weekly schedule represents a more viable institutional compromise.",
    "explanationVi": "Option B đưa ra quan điểm học thuật rõ ràng (Thesis statement), có nhượng bộ (Concession) và giải pháp cụ thể, đạt tiêu chuẩn Band 8.0+ cho Task Response.",
    "evidenceQuote": "While daily physical training undeniably promotes... I contend that compulsory daily participation may encroach upon...",
    "tip": "Overview Task 1 tuyệt đối không đưa số liệu cụ thể. Mở bài Task 2 phải có Thesis statement nêu rõ lập trường của bạn."
  },
  {
    "id": "drill-wr-07",
    "skill": "writing",
    "typeId": "writing-task-1-chart",
    "title": "Writing Drill · Writing Task 1 Drill · Overview Identification #7",
    "contextText": "PROMPT: The line graph shows the percentage of households with internet access in three European countries (United Kingdom, Germany, and Spain) between 2000 and 2020.\nDATA: UK grew steadily from 30% to 92%. Germany rose from 25% to 88%. Spain rose from 10% to 85%.",
    "prompt": "Which of the following serves as the most effective Academic Overview for this Task 1 report?\nA In 2000, 30% of UK households had internet, compared to 25% in Germany and only 10% in Spain.\nB Overall, all three nations experienced substantial growth in household internet connectivity over the two-decade period, with the UK consistently maintaining the highest proportion throughout.\nC People in Spain probably did not have computers in 2000 because of economic instability.\nD Between 2005 and 2010, Germany's internet adoption rate increased by precisely 18 percentage points.",
    "options": [
      "A In 2000, 30% of UK households had internet, compared to 25% in Germany and only 10% in Spain.",
      "B Overall, all three nations experienced substantial growth in household internet connectivity over the two-decade period, with the UK consistently maintaining the highest proportion throughout.",
      "C People in Spain probably did not have computers in 2000 because of economic instability.",
      "D Between 2005 and 2010, Germany's internet adoption rate increased by precisely 18 percentage points."
    ],
    "answer": "B Overall, all three nations experienced substantial growth in household internet connectivity over the two-decade period, with the UK consistently maintaining the highest proportion throughout.",
    "explanationVi": "Overview chuẩn phải chỉ ra xu hướng chung (tất cả đều tăng mạnh) và đối tượng nổi bật nhất (UK luôn dẫn đầu) mà không đưa số liệu chi tiết (Option B).",
    "evidenceQuote": "all three nations experienced substantial growth... UK consistently maintaining the highest proportion throughout.",
    "tip": "Overview Task 1 tuyệt đối không đưa số liệu cụ thể. Mở bài Task 2 phải có Thesis statement nêu rõ lập trường của bạn."
  },
  {
    "id": "drill-wr-08",
    "skill": "writing",
    "typeId": "writing-task-2-opinion",
    "title": "Writing Drill · Writing Task 2 Drill · Thesis Statement Formulation #8",
    "contextText": "PROMPT: Some educators propose that secondary schools should mandate daily physical education for all pupils to combat adolescent sedentary health risks. To what extent do you agree or disagree?",
    "prompt": "Which introduction paragraph provides the clearest thesis statement expressing a balanced academic viewpoint?\nA Many people talk about health today. Schools are very important for children.\nB While daily physical training undeniably promotes cardiovascular vitality, I contend that compulsory daily participation may encroach upon essential academic curricula; therefore, a balanced tri-weekly schedule represents a more viable institutional compromise.\nC I completely agree because playing football is my favorite hobby with my school friends.\nD Physical education was first established in ancient Greece and has evolved into modern sports leagues.",
    "options": [
      "A Many people talk about health today. Schools are very important for children.",
      "B While daily physical training undeniably promotes cardiovascular vitality, I contend that compulsory daily participation may encroach upon essential academic curricula; therefore, a balanced tri-weekly schedule represents a more viable institutional compromise.",
      "C I completely agree because playing football is my favorite hobby with my school friends.",
      "D Physical education was first established in ancient Greece and has evolved into modern sports leagues."
    ],
    "answer": "B While daily physical training undeniably promotes cardiovascular vitality, I contend that compulsory daily participation may encroach upon essential academic curricula; therefore, a balanced tri-weekly schedule represents a more viable institutional compromise.",
    "explanationVi": "Option B đưa ra quan điểm học thuật rõ ràng (Thesis statement), có nhượng bộ (Concession) và giải pháp cụ thể, đạt tiêu chuẩn Band 8.0+ cho Task Response.",
    "evidenceQuote": "While daily physical training undeniably promotes... I contend that compulsory daily participation may encroach upon...",
    "tip": "Overview Task 1 tuyệt đối không đưa số liệu cụ thể. Mở bài Task 2 phải có Thesis statement nêu rõ lập trường của bạn."
  },
  {
    "id": "drill-wr-09",
    "skill": "writing",
    "typeId": "writing-task-1-chart",
    "title": "Writing Drill · Writing Task 1 Drill · Overview Identification #9",
    "contextText": "PROMPT: The line graph shows the percentage of households with internet access in three European countries (United Kingdom, Germany, and Spain) between 2000 and 2020.\nDATA: UK grew steadily from 30% to 92%. Germany rose from 25% to 88%. Spain rose from 10% to 85%.",
    "prompt": "Which of the following serves as the most effective Academic Overview for this Task 1 report?\nA In 2000, 30% of UK households had internet, compared to 25% in Germany and only 10% in Spain.\nB Overall, all three nations experienced substantial growth in household internet connectivity over the two-decade period, with the UK consistently maintaining the highest proportion throughout.\nC People in Spain probably did not have computers in 2000 because of economic instability.\nD Between 2005 and 2010, Germany's internet adoption rate increased by precisely 18 percentage points.",
    "options": [
      "A In 2000, 30% of UK households had internet, compared to 25% in Germany and only 10% in Spain.",
      "B Overall, all three nations experienced substantial growth in household internet connectivity over the two-decade period, with the UK consistently maintaining the highest proportion throughout.",
      "C People in Spain probably did not have computers in 2000 because of economic instability.",
      "D Between 2005 and 2010, Germany's internet adoption rate increased by precisely 18 percentage points."
    ],
    "answer": "B Overall, all three nations experienced substantial growth in household internet connectivity over the two-decade period, with the UK consistently maintaining the highest proportion throughout.",
    "explanationVi": "Overview chuẩn phải chỉ ra xu hướng chung (tất cả đều tăng mạnh) và đối tượng nổi bật nhất (UK luôn dẫn đầu) mà không đưa số liệu chi tiết (Option B).",
    "evidenceQuote": "all three nations experienced substantial growth... UK consistently maintaining the highest proportion throughout.",
    "tip": "Overview Task 1 tuyệt đối không đưa số liệu cụ thể. Mở bài Task 2 phải có Thesis statement nêu rõ lập trường của bạn."
  },
  {
    "id": "drill-wr-10",
    "skill": "writing",
    "typeId": "writing-task-2-opinion",
    "title": "Writing Drill · Writing Task 2 Drill · Thesis Statement Formulation #10",
    "contextText": "PROMPT: Some educators propose that secondary schools should mandate daily physical education for all pupils to combat adolescent sedentary health risks. To what extent do you agree or disagree?",
    "prompt": "Which introduction paragraph provides the clearest thesis statement expressing a balanced academic viewpoint?\nA Many people talk about health today. Schools are very important for children.\nB While daily physical training undeniably promotes cardiovascular vitality, I contend that compulsory daily participation may encroach upon essential academic curricula; therefore, a balanced tri-weekly schedule represents a more viable institutional compromise.\nC I completely agree because playing football is my favorite hobby with my school friends.\nD Physical education was first established in ancient Greece and has evolved into modern sports leagues.",
    "options": [
      "A Many people talk about health today. Schools are very important for children.",
      "B While daily physical training undeniably promotes cardiovascular vitality, I contend that compulsory daily participation may encroach upon essential academic curricula; therefore, a balanced tri-weekly schedule represents a more viable institutional compromise.",
      "C I completely agree because playing football is my favorite hobby with my school friends.",
      "D Physical education was first established in ancient Greece and has evolved into modern sports leagues."
    ],
    "answer": "B While daily physical training undeniably promotes cardiovascular vitality, I contend that compulsory daily participation may encroach upon essential academic curricula; therefore, a balanced tri-weekly schedule represents a more viable institutional compromise.",
    "explanationVi": "Option B đưa ra quan điểm học thuật rõ ràng (Thesis statement), có nhượng bộ (Concession) và giải pháp cụ thể, đạt tiêu chuẩn Band 8.0+ cho Task Response.",
    "evidenceQuote": "While daily physical training undeniably promotes... I contend that compulsory daily participation may encroach upon...",
    "tip": "Overview Task 1 tuyệt đối không đưa số liệu cụ thể. Mở bài Task 2 phải có Thesis statement nêu rõ lập trường của bạn."
  },
  {
    "id": "drill-sp-01",
    "skill": "speaking",
    "typeId": "speaking-part-1-expansion",
    "title": "Speaking Drill · Speaking Part 1 · Applying the AREA Expansion Formula #1",
    "contextText": "EXAMINER QUESTION: Do you prefer studying in the morning or in the evening?",
    "prompt": "Which candidate response best demonstrates the AREA formula (Answer - Reason - Example - Alternative) suitable for Band 8.0+?\nA I prefer morning. Because it is good.\nB Without a doubt, I am far more productive in the early hours of the morning (A). My concentration is at its peak right after waking up before the noise of the city begins (R). For instance, when revising for university finals last term, I tackled my most challenging calculus problems between six and eight AM (E). By contrast, studying late at night tends to leave me fatigued and prone to careless oversights (A).\nC Evening is better because I can watch YouTube and eat snacks while listening to music with my friends online.\nD Both morning and evening are normal times of the day for studying.",
    "options": [
      "A I prefer morning. Because it is good.",
      "B Without a doubt, I am far more productive in the early hours of the morning (A). My concentration is at its peak right after waking up before the noise of the city begins (R). For instance, when revising for university finals last term, I tackled my most challenging calculus problems between six and eight AM (E). By contrast, studying late at night tends to leave me fatigued and prone to careless oversights (A).",
      "C Evening is better because I can watch YouTube and eat snacks while listening to music with my friends online.",
      "D Both morning and evening are normal times of the day for studying."
    ],
    "answer": "B Without a doubt, I am far more productive in the early hours of the morning (A). My concentration is at its peak right after waking up before the noise of the city begins (R). For instance, when revising for university finals last term, I tackled my most challenging calculus problems between six and eight AM (E). By contrast, studying late at night tends to leave me fatigued and prone to careless oversights (A).",
    "explanationVi": "Option B triển khai hoàn hảo 4 bước AREA: Trả lời thẳng -> Nêu lý do -> Đưa ví dụ kỳ thi đại học -> So sánh tương phản với buổi tối.",
    "evidenceQuote": "Without a doubt, I am far more productive in the early hours... My concentration is at its peak... For instance, when revising... By contrast, studying late at night...",
    "tip": "Luôn áp dụng công thức AREA để câu trả lời dài từ 2 đến 4 câu mượt mà, tự nhiên."
  },
  {
    "id": "drill-sp-02",
    "skill": "speaking",
    "typeId": "speaking-part-1-expansion",
    "title": "Speaking Drill · Speaking Part 1 · Applying the AREA Expansion Formula #2",
    "contextText": "EXAMINER QUESTION: Do you prefer studying in the morning or in the evening?",
    "prompt": "Which candidate response best demonstrates the AREA formula (Answer - Reason - Example - Alternative) suitable for Band 8.0+?\nA I prefer morning. Because it is good.\nB Without a doubt, I am far more productive in the early hours of the morning (A). My concentration is at its peak right after waking up before the noise of the city begins (R). For instance, when revising for university finals last term, I tackled my most challenging calculus problems between six and eight AM (E). By contrast, studying late at night tends to leave me fatigued and prone to careless oversights (A).\nC Evening is better because I can watch YouTube and eat snacks while listening to music with my friends online.\nD Both morning and evening are normal times of the day for studying.",
    "options": [
      "A I prefer morning. Because it is good.",
      "B Without a doubt, I am far more productive in the early hours of the morning (A). My concentration is at its peak right after waking up before the noise of the city begins (R). For instance, when revising for university finals last term, I tackled my most challenging calculus problems between six and eight AM (E). By contrast, studying late at night tends to leave me fatigued and prone to careless oversights (A).",
      "C Evening is better because I can watch YouTube and eat snacks while listening to music with my friends online.",
      "D Both morning and evening are normal times of the day for studying."
    ],
    "answer": "B Without a doubt, I am far more productive in the early hours of the morning (A). My concentration is at its peak right after waking up before the noise of the city begins (R). For instance, when revising for university finals last term, I tackled my most challenging calculus problems between six and eight AM (E). By contrast, studying late at night tends to leave me fatigued and prone to careless oversights (A).",
    "explanationVi": "Option B triển khai hoàn hảo 4 bước AREA: Trả lời thẳng -> Nêu lý do -> Đưa ví dụ kỳ thi đại học -> So sánh tương phản với buổi tối.",
    "evidenceQuote": "Without a doubt, I am far more productive in the early hours... My concentration is at its peak... For instance, when revising... By contrast, studying late at night...",
    "tip": "Luôn áp dụng công thức AREA để câu trả lời dài từ 2 đến 4 câu mượt mà, tự nhiên."
  },
  {
    "id": "drill-sp-03",
    "skill": "speaking",
    "typeId": "speaking-part-1-expansion",
    "title": "Speaking Drill · Speaking Part 1 · Applying the AREA Expansion Formula #3",
    "contextText": "EXAMINER QUESTION: Do you prefer studying in the morning or in the evening?",
    "prompt": "Which candidate response best demonstrates the AREA formula (Answer - Reason - Example - Alternative) suitable for Band 8.0+?\nA I prefer morning. Because it is good.\nB Without a doubt, I am far more productive in the early hours of the morning (A). My concentration is at its peak right after waking up before the noise of the city begins (R). For instance, when revising for university finals last term, I tackled my most challenging calculus problems between six and eight AM (E). By contrast, studying late at night tends to leave me fatigued and prone to careless oversights (A).\nC Evening is better because I can watch YouTube and eat snacks while listening to music with my friends online.\nD Both morning and evening are normal times of the day for studying.",
    "options": [
      "A I prefer morning. Because it is good.",
      "B Without a doubt, I am far more productive in the early hours of the morning (A). My concentration is at its peak right after waking up before the noise of the city begins (R). For instance, when revising for university finals last term, I tackled my most challenging calculus problems between six and eight AM (E). By contrast, studying late at night tends to leave me fatigued and prone to careless oversights (A).",
      "C Evening is better because I can watch YouTube and eat snacks while listening to music with my friends online.",
      "D Both morning and evening are normal times of the day for studying."
    ],
    "answer": "B Without a doubt, I am far more productive in the early hours of the morning (A). My concentration is at its peak right after waking up before the noise of the city begins (R). For instance, when revising for university finals last term, I tackled my most challenging calculus problems between six and eight AM (E). By contrast, studying late at night tends to leave me fatigued and prone to careless oversights (A).",
    "explanationVi": "Option B triển khai hoàn hảo 4 bước AREA: Trả lời thẳng -> Nêu lý do -> Đưa ví dụ kỳ thi đại học -> So sánh tương phản với buổi tối.",
    "evidenceQuote": "Without a doubt, I am far more productive in the early hours... My concentration is at its peak... For instance, when revising... By contrast, studying late at night...",
    "tip": "Luôn áp dụng công thức AREA để câu trả lời dài từ 2 đến 4 câu mượt mà, tự nhiên."
  },
  {
    "id": "drill-sp-04",
    "skill": "speaking",
    "typeId": "speaking-part-1-expansion",
    "title": "Speaking Drill · Speaking Part 1 · Applying the AREA Expansion Formula #4",
    "contextText": "EXAMINER QUESTION: Do you prefer studying in the morning or in the evening?",
    "prompt": "Which candidate response best demonstrates the AREA formula (Answer - Reason - Example - Alternative) suitable for Band 8.0+?\nA I prefer morning. Because it is good.\nB Without a doubt, I am far more productive in the early hours of the morning (A). My concentration is at its peak right after waking up before the noise of the city begins (R). For instance, when revising for university finals last term, I tackled my most challenging calculus problems between six and eight AM (E). By contrast, studying late at night tends to leave me fatigued and prone to careless oversights (A).\nC Evening is better because I can watch YouTube and eat snacks while listening to music with my friends online.\nD Both morning and evening are normal times of the day for studying.",
    "options": [
      "A I prefer morning. Because it is good.",
      "B Without a doubt, I am far more productive in the early hours of the morning (A). My concentration is at its peak right after waking up before the noise of the city begins (R). For instance, when revising for university finals last term, I tackled my most challenging calculus problems between six and eight AM (E). By contrast, studying late at night tends to leave me fatigued and prone to careless oversights (A).",
      "C Evening is better because I can watch YouTube and eat snacks while listening to music with my friends online.",
      "D Both morning and evening are normal times of the day for studying."
    ],
    "answer": "B Without a doubt, I am far more productive in the early hours of the morning (A). My concentration is at its peak right after waking up before the noise of the city begins (R). For instance, when revising for university finals last term, I tackled my most challenging calculus problems between six and eight AM (E). By contrast, studying late at night tends to leave me fatigued and prone to careless oversights (A).",
    "explanationVi": "Option B triển khai hoàn hảo 4 bước AREA: Trả lời thẳng -> Nêu lý do -> Đưa ví dụ kỳ thi đại học -> So sánh tương phản với buổi tối.",
    "evidenceQuote": "Without a doubt, I am far more productive in the early hours... My concentration is at its peak... For instance, when revising... By contrast, studying late at night...",
    "tip": "Luôn áp dụng công thức AREA để câu trả lời dài từ 2 đến 4 câu mượt mà, tự nhiên."
  },
  {
    "id": "drill-sp-05",
    "skill": "speaking",
    "typeId": "speaking-part-1-expansion",
    "title": "Speaking Drill · Speaking Part 1 · Applying the AREA Expansion Formula #5",
    "contextText": "EXAMINER QUESTION: Do you prefer studying in the morning or in the evening?",
    "prompt": "Which candidate response best demonstrates the AREA formula (Answer - Reason - Example - Alternative) suitable for Band 8.0+?\nA I prefer morning. Because it is good.\nB Without a doubt, I am far more productive in the early hours of the morning (A). My concentration is at its peak right after waking up before the noise of the city begins (R). For instance, when revising for university finals last term, I tackled my most challenging calculus problems between six and eight AM (E). By contrast, studying late at night tends to leave me fatigued and prone to careless oversights (A).\nC Evening is better because I can watch YouTube and eat snacks while listening to music with my friends online.\nD Both morning and evening are normal times of the day for studying.",
    "options": [
      "A I prefer morning. Because it is good.",
      "B Without a doubt, I am far more productive in the early hours of the morning (A). My concentration is at its peak right after waking up before the noise of the city begins (R). For instance, when revising for university finals last term, I tackled my most challenging calculus problems between six and eight AM (E). By contrast, studying late at night tends to leave me fatigued and prone to careless oversights (A).",
      "C Evening is better because I can watch YouTube and eat snacks while listening to music with my friends online.",
      "D Both morning and evening are normal times of the day for studying."
    ],
    "answer": "B Without a doubt, I am far more productive in the early hours of the morning (A). My concentration is at its peak right after waking up before the noise of the city begins (R). For instance, when revising for university finals last term, I tackled my most challenging calculus problems between six and eight AM (E). By contrast, studying late at night tends to leave me fatigued and prone to careless oversights (A).",
    "explanationVi": "Option B triển khai hoàn hảo 4 bước AREA: Trả lời thẳng -> Nêu lý do -> Đưa ví dụ kỳ thi đại học -> So sánh tương phản với buổi tối.",
    "evidenceQuote": "Without a doubt, I am far more productive in the early hours... My concentration is at its peak... For instance, when revising... By contrast, studying late at night...",
    "tip": "Luôn áp dụng công thức AREA để câu trả lời dài từ 2 đến 4 câu mượt mà, tự nhiên."
  },
  {
    "id": "drill-sp-06",
    "skill": "speaking",
    "typeId": "speaking-part-1-expansion",
    "title": "Speaking Drill · Speaking Part 1 · Applying the AREA Expansion Formula #6",
    "contextText": "EXAMINER QUESTION: Do you prefer studying in the morning or in the evening?",
    "prompt": "Which candidate response best demonstrates the AREA formula (Answer - Reason - Example - Alternative) suitable for Band 8.0+?\nA I prefer morning. Because it is good.\nB Without a doubt, I am far more productive in the early hours of the morning (A). My concentration is at its peak right after waking up before the noise of the city begins (R). For instance, when revising for university finals last term, I tackled my most challenging calculus problems between six and eight AM (E). By contrast, studying late at night tends to leave me fatigued and prone to careless oversights (A).\nC Evening is better because I can watch YouTube and eat snacks while listening to music with my friends online.\nD Both morning and evening are normal times of the day for studying.",
    "options": [
      "A I prefer morning. Because it is good.",
      "B Without a doubt, I am far more productive in the early hours of the morning (A). My concentration is at its peak right after waking up before the noise of the city begins (R). For instance, when revising for university finals last term, I tackled my most challenging calculus problems between six and eight AM (E). By contrast, studying late at night tends to leave me fatigued and prone to careless oversights (A).",
      "C Evening is better because I can watch YouTube and eat snacks while listening to music with my friends online.",
      "D Both morning and evening are normal times of the day for studying."
    ],
    "answer": "B Without a doubt, I am far more productive in the early hours of the morning (A). My concentration is at its peak right after waking up before the noise of the city begins (R). For instance, when revising for university finals last term, I tackled my most challenging calculus problems between six and eight AM (E). By contrast, studying late at night tends to leave me fatigued and prone to careless oversights (A).",
    "explanationVi": "Option B triển khai hoàn hảo 4 bước AREA: Trả lời thẳng -> Nêu lý do -> Đưa ví dụ kỳ thi đại học -> So sánh tương phản với buổi tối.",
    "evidenceQuote": "Without a doubt, I am far more productive in the early hours... My concentration is at its peak... For instance, when revising... By contrast, studying late at night...",
    "tip": "Luôn áp dụng công thức AREA để câu trả lời dài từ 2 đến 4 câu mượt mà, tự nhiên."
  },
  {
    "id": "drill-sp-07",
    "skill": "speaking",
    "typeId": "speaking-part-1-expansion",
    "title": "Speaking Drill · Speaking Part 1 · Applying the AREA Expansion Formula #7",
    "contextText": "EXAMINER QUESTION: Do you prefer studying in the morning or in the evening?",
    "prompt": "Which candidate response best demonstrates the AREA formula (Answer - Reason - Example - Alternative) suitable for Band 8.0+?\nA I prefer morning. Because it is good.\nB Without a doubt, I am far more productive in the early hours of the morning (A). My concentration is at its peak right after waking up before the noise of the city begins (R). For instance, when revising for university finals last term, I tackled my most challenging calculus problems between six and eight AM (E). By contrast, studying late at night tends to leave me fatigued and prone to careless oversights (A).\nC Evening is better because I can watch YouTube and eat snacks while listening to music with my friends online.\nD Both morning and evening are normal times of the day for studying.",
    "options": [
      "A I prefer morning. Because it is good.",
      "B Without a doubt, I am far more productive in the early hours of the morning (A). My concentration is at its peak right after waking up before the noise of the city begins (R). For instance, when revising for university finals last term, I tackled my most challenging calculus problems between six and eight AM (E). By contrast, studying late at night tends to leave me fatigued and prone to careless oversights (A).",
      "C Evening is better because I can watch YouTube and eat snacks while listening to music with my friends online.",
      "D Both morning and evening are normal times of the day for studying."
    ],
    "answer": "B Without a doubt, I am far more productive in the early hours of the morning (A). My concentration is at its peak right after waking up before the noise of the city begins (R). For instance, when revising for university finals last term, I tackled my most challenging calculus problems between six and eight AM (E). By contrast, studying late at night tends to leave me fatigued and prone to careless oversights (A).",
    "explanationVi": "Option B triển khai hoàn hảo 4 bước AREA: Trả lời thẳng -> Nêu lý do -> Đưa ví dụ kỳ thi đại học -> So sánh tương phản với buổi tối.",
    "evidenceQuote": "Without a doubt, I am far more productive in the early hours... My concentration is at its peak... For instance, when revising... By contrast, studying late at night...",
    "tip": "Luôn áp dụng công thức AREA để câu trả lời dài từ 2 đến 4 câu mượt mà, tự nhiên."
  },
  {
    "id": "drill-sp-08",
    "skill": "speaking",
    "typeId": "speaking-part-1-expansion",
    "title": "Speaking Drill · Speaking Part 1 · Applying the AREA Expansion Formula #8",
    "contextText": "EXAMINER QUESTION: Do you prefer studying in the morning or in the evening?",
    "prompt": "Which candidate response best demonstrates the AREA formula (Answer - Reason - Example - Alternative) suitable for Band 8.0+?\nA I prefer morning. Because it is good.\nB Without a doubt, I am far more productive in the early hours of the morning (A). My concentration is at its peak right after waking up before the noise of the city begins (R). For instance, when revising for university finals last term, I tackled my most challenging calculus problems between six and eight AM (E). By contrast, studying late at night tends to leave me fatigued and prone to careless oversights (A).\nC Evening is better because I can watch YouTube and eat snacks while listening to music with my friends online.\nD Both morning and evening are normal times of the day for studying.",
    "options": [
      "A I prefer morning. Because it is good.",
      "B Without a doubt, I am far more productive in the early hours of the morning (A). My concentration is at its peak right after waking up before the noise of the city begins (R). For instance, when revising for university finals last term, I tackled my most challenging calculus problems between six and eight AM (E). By contrast, studying late at night tends to leave me fatigued and prone to careless oversights (A).",
      "C Evening is better because I can watch YouTube and eat snacks while listening to music with my friends online.",
      "D Both morning and evening are normal times of the day for studying."
    ],
    "answer": "B Without a doubt, I am far more productive in the early hours of the morning (A). My concentration is at its peak right after waking up before the noise of the city begins (R). For instance, when revising for university finals last term, I tackled my most challenging calculus problems between six and eight AM (E). By contrast, studying late at night tends to leave me fatigued and prone to careless oversights (A).",
    "explanationVi": "Option B triển khai hoàn hảo 4 bước AREA: Trả lời thẳng -> Nêu lý do -> Đưa ví dụ kỳ thi đại học -> So sánh tương phản với buổi tối.",
    "evidenceQuote": "Without a doubt, I am far more productive in the early hours... My concentration is at its peak... For instance, when revising... By contrast, studying late at night...",
    "tip": "Luôn áp dụng công thức AREA để câu trả lời dài từ 2 đến 4 câu mượt mà, tự nhiên."
  },
  {
    "id": "drill-sp-09",
    "skill": "speaking",
    "typeId": "speaking-part-1-expansion",
    "title": "Speaking Drill · Speaking Part 1 · Applying the AREA Expansion Formula #9",
    "contextText": "EXAMINER QUESTION: Do you prefer studying in the morning or in the evening?",
    "prompt": "Which candidate response best demonstrates the AREA formula (Answer - Reason - Example - Alternative) suitable for Band 8.0+?\nA I prefer morning. Because it is good.\nB Without a doubt, I am far more productive in the early hours of the morning (A). My concentration is at its peak right after waking up before the noise of the city begins (R). For instance, when revising for university finals last term, I tackled my most challenging calculus problems between six and eight AM (E). By contrast, studying late at night tends to leave me fatigued and prone to careless oversights (A).\nC Evening is better because I can watch YouTube and eat snacks while listening to music with my friends online.\nD Both morning and evening are normal times of the day for studying.",
    "options": [
      "A I prefer morning. Because it is good.",
      "B Without a doubt, I am far more productive in the early hours of the morning (A). My concentration is at its peak right after waking up before the noise of the city begins (R). For instance, when revising for university finals last term, I tackled my most challenging calculus problems between six and eight AM (E). By contrast, studying late at night tends to leave me fatigued and prone to careless oversights (A).",
      "C Evening is better because I can watch YouTube and eat snacks while listening to music with my friends online.",
      "D Both morning and evening are normal times of the day for studying."
    ],
    "answer": "B Without a doubt, I am far more productive in the early hours of the morning (A). My concentration is at its peak right after waking up before the noise of the city begins (R). For instance, when revising for university finals last term, I tackled my most challenging calculus problems between six and eight AM (E). By contrast, studying late at night tends to leave me fatigued and prone to careless oversights (A).",
    "explanationVi": "Option B triển khai hoàn hảo 4 bước AREA: Trả lời thẳng -> Nêu lý do -> Đưa ví dụ kỳ thi đại học -> So sánh tương phản với buổi tối.",
    "evidenceQuote": "Without a doubt, I am far more productive in the early hours... My concentration is at its peak... For instance, when revising... By contrast, studying late at night...",
    "tip": "Luôn áp dụng công thức AREA để câu trả lời dài từ 2 đến 4 câu mượt mà, tự nhiên."
  },
  {
    "id": "drill-sp-10",
    "skill": "speaking",
    "typeId": "speaking-part-1-expansion",
    "title": "Speaking Drill · Speaking Part 1 · Applying the AREA Expansion Formula #10",
    "contextText": "EXAMINER QUESTION: Do you prefer studying in the morning or in the evening?",
    "prompt": "Which candidate response best demonstrates the AREA formula (Answer - Reason - Example - Alternative) suitable for Band 8.0+?\nA I prefer morning. Because it is good.\nB Without a doubt, I am far more productive in the early hours of the morning (A). My concentration is at its peak right after waking up before the noise of the city begins (R). For instance, when revising for university finals last term, I tackled my most challenging calculus problems between six and eight AM (E). By contrast, studying late at night tends to leave me fatigued and prone to careless oversights (A).\nC Evening is better because I can watch YouTube and eat snacks while listening to music with my friends online.\nD Both morning and evening are normal times of the day for studying.",
    "options": [
      "A I prefer morning. Because it is good.",
      "B Without a doubt, I am far more productive in the early hours of the morning (A). My concentration is at its peak right after waking up before the noise of the city begins (R). For instance, when revising for university finals last term, I tackled my most challenging calculus problems between six and eight AM (E). By contrast, studying late at night tends to leave me fatigued and prone to careless oversights (A).",
      "C Evening is better because I can watch YouTube and eat snacks while listening to music with my friends online.",
      "D Both morning and evening are normal times of the day for studying."
    ],
    "answer": "B Without a doubt, I am far more productive in the early hours of the morning (A). My concentration is at its peak right after waking up before the noise of the city begins (R). For instance, when revising for university finals last term, I tackled my most challenging calculus problems between six and eight AM (E). By contrast, studying late at night tends to leave me fatigued and prone to careless oversights (A).",
    "explanationVi": "Option B triển khai hoàn hảo 4 bước AREA: Trả lời thẳng -> Nêu lý do -> Đưa ví dụ kỳ thi đại học -> So sánh tương phản với buổi tối.",
    "evidenceQuote": "Without a doubt, I am far more productive in the early hours... My concentration is at its peak... For instance, when revising... By contrast, studying late at night...",
    "tip": "Luôn áp dụng công thức AREA để câu trả lời dài từ 2 đến 4 câu mượt mà, tự nhiên."
  },
  {
    "id": "drill-rd-mi-01",
    "skill": "reading",
    "typeId": "reading-matching-info",
    "title": "Reading Drill · Matching Info #1",
    "contextText": "Section A: The invention of concrete by Roman engineers revolutionised architectural engineering. Section B: In contrast, medieval master masons abandoned pozzolanic mixtures in favour of cut stone vaults. Section C: Late 19th-century French engineer François Hennebique patented reinforced concrete combining tensile steel rebars with compressive concrete matrices.",
    "prompt": "Which section contains information about the re-emergence of composite concrete integrated with metallic reinforcement?",
    "options": [
      "Section A",
      "Section B",
      "Section C"
    ],
    "answer": "Section C",
    "explanationVi": "Đoạn C đề cập đến kỹ sư François Hennebique đăng ký bằng sáng chế cho bê tông cốt thép kết hợp thanh thép chịu kéo (metallic reinforcement).",
    "evidenceQuote": "François Hennebique patented reinforced concrete combining tensile steel rebars with compressive concrete matrices",
    "tip": "Đọc câu hỏi trước để ghi nhớ từ khóa ý nghĩa thay vì cố tìm từ vựng y hệt trong bài."
  },
  {
    "id": "drill-rd-mi-02",
    "skill": "reading",
    "typeId": "reading-matching-info",
    "title": "Reading Drill · Matching Info #2",
    "contextText": "Scientist Dr. Elena Rostova demonstrated that arctic lichens produce secondary metabolites called usnic acids to resist ultraviolet radiation. Prof. Marcus Thorne established that lichens absorb airborne pollutants directly across their thalli without a protective cuticle layer. Dr. Sarah Jenkins discovered that fossilised lichens provide isotopic records of ancient volcanic eruptions.",
    "prompt": "Match the finding to the researcher: \"Lichens can serve as bioindicators because they lack a barrier against atmospheric contaminants.\"",
    "options": [
      "Dr. Elena Rostova",
      "Prof. Marcus Thorne",
      "Dr. Sarah Jenkins"
    ],
    "answer": "Prof. Marcus Thorne",
    "explanationVi": "Prof. Marcus Thorne chứng minh địa y hấp thụ chất ô nhiễm trong không khí do không có lớp biểu bì cutin bảo vệ.",
    "evidenceQuote": "Prof. Marcus Thorne established that lichens absorb airborne pollutants directly across their thalli without a protective cuticle layer.",
    "tip": "Đọc câu hỏi trước để ghi nhớ từ khóa ý nghĩa thay vì cố tìm từ vựng y hệt trong bài."
  },
  {
    "id": "drill-rd-mi-03",
    "skill": "reading",
    "typeId": "reading-matching-info",
    "title": "Reading Drill · Matching Info #3",
    "contextText": "Paragraph 1: Early telegraph cables suffered severe signal distortion due to electrical capacitance. Paragraph 2: Oliver Heaviside calculated that loading coils with specific inductance could eliminate electromagnetic phase distortion entirely. Paragraph 3: The transatlantic telegraph cable opened in 1866 following several catastrophic snaps in the Atlantic abyss.",
    "prompt": "Which paragraph explains a mathematical theoretical breakthrough in telecommunication engineering?",
    "options": [
      "Paragraph 1",
      "Paragraph 2",
      "Paragraph 3"
    ],
    "answer": "Paragraph 2",
    "explanationVi": "Paragraph 2 nhắc đến tính toán toán học (calculated) của Oliver Heaviside giúp loại bỏ hiện tượng biến dạng tín hiệu sóng điện từ.",
    "evidenceQuote": "Oliver Heaviside calculated that loading coils with specific inductance could eliminate electromagnetic phase distortion entirely.",
    "tip": "Đọc câu hỏi trước để ghi nhớ từ khóa ý nghĩa thay vì cố tìm từ vựng y hệt trong bài."
  },
  {
    "id": "drill-rd-mi-04",
    "skill": "reading",
    "typeId": "reading-matching-info",
    "title": "Reading Drill · Matching Info #4",
    "contextText": "Model Alpha consumes 12 kWh per 100km with a regenerative braking recovery rate of 78%. Model Beta features an active liquid cooling battery pack that extends cycle longevity by 40% under tropical climates. Model Gamma incorporates solid-state lithium ceramic cells with zero risk of thermal runaway combustion.",
    "prompt": "Which vehicle model is engineered specifically to prevent catastrophic fire hazards caused by electrolyte overheating?",
    "options": [
      "Model Alpha",
      "Model Beta",
      "Model Gamma"
    ],
    "answer": "Model Gamma",
    "explanationVi": "Model Gamma sử dụng pin gốm thể rắn không có nguy cơ cháy nổ do nhiệt độ tăng vọt (thermal runaway combustion).",
    "evidenceQuote": "Model Gamma incorporates solid-state lithium ceramic cells with zero risk of thermal runaway combustion.",
    "tip": "Đọc câu hỏi trước để ghi nhớ từ khóa ý nghĩa thay vì cố tìm từ vựng y hệt trong bài."
  },
  {
    "id": "drill-rd-mi-05",
    "skill": "reading",
    "typeId": "reading-matching-info",
    "title": "Reading Drill · Matching Info #5",
    "contextText": "Dr. Aris Thorne argued that early hominid bipedalism evolved primarily to reduce solar thermal radiation exposure on open savannahs. Dr. Jane Goodall observed tool use among chimpanzees. Dr. Meave Leakey uncovered fossils demonstrating that bipedal gait preceded extensive cranial encephalisation by over two million years.",
    "prompt": "Match the hypothesis: \"Upright posture evolved as a thermoregulatory adaptation to environmental climate extremes.\"",
    "options": [
      "Dr. Aris Thorne",
      "Dr. Jane Goodall",
      "Dr. Meave Leakey"
    ],
    "answer": "Dr. Aris Thorne",
    "explanationVi": "Dr. Aris Thorne đưa ra luận điểm rằng việc đi bằng hai chân tiến hóa để giảm tiếp xúc bức xạ nhiệt mặt trời (thermoregulatory adaptation).",
    "evidenceQuote": "Dr. Aris Thorne argued that early hominid bipedalism evolved primarily to reduce solar thermal radiation exposure on open savannahs.",
    "tip": "Đọc câu hỏi trước để ghi nhớ từ khóa ý nghĩa thay vì cố tìm từ vựng y hệt trong bài."
  },
  {
    "id": "drill-lis-mat-01",
    "skill": "listening",
    "typeId": "listening-matching",
    "title": "Listening Drill · Matching #1",
    "contextText": "Student A: \"The campus gym membership is included with dormitory fees, but the Olympic swimming pool requires an extra monthly subscription.\" Student B: \"And what about the tennis courts?\" Student A: \"You can book them for free, but only before 2 PM on weekdays; after that, you need to pay a nominal hourly fee.\"",
    "prompt": "What condition applies to using the tennis courts?",
    "options": [
      "Free at all times",
      "Free only during off-peak weekday hours",
      "Requires an expensive seasonal pass"
    ],
    "answer": "Free only during off-peak weekday hours",
    "explanationVi": "Sân tennis miễn phí trước 2 giờ chiều các ngày trong tuần (off-peak weekday hours).",
    "evidenceQuote": "You can book them for free, but only before 2 PM on weekdays",
    "tip": "Chú ý các từ nối biểu thị ngoại lệ: \"except\", \"however\", \"provided that\"."
  },
  {
    "id": "drill-lis-mat-02",
    "skill": "listening",
    "typeId": "listening-matching",
    "title": "Listening Drill · Matching #2",
    "contextText": "Tour Guide: \"Visitors to the ancient cathedral tower must note that while audio guides are complimentary for all ticket holders, large backpacks must be checked in at the luggage depository. Photography is strictly prohibited inside the crypt.\"",
    "prompt": "Which regulation applies to photography inside the cathedral crypt?",
    "options": [
      "Permitted with a special permit",
      "Completely prohibited",
      "Permitted without flash only"
    ],
    "answer": "Completely prohibited",
    "explanationVi": "Hướng dẫn viên nhấn mạnh chụp ảnh bị nghiêm cấm hoàn toàn trong hầm mộ (strictly prohibited).",
    "evidenceQuote": "Photography is strictly prohibited inside the crypt.",
    "tip": "Chú ý các từ nối biểu thị ngoại lệ: \"except\", \"however\", \"provided that\"."
  },
  {
    "id": "drill-lis-mat-03",
    "skill": "listening",
    "typeId": "listening-matching",
    "title": "Listening Drill · Matching #3",
    "contextText": "Tutor: \"For Assignment 1, submitting a printed hardcopy is mandatory. Assignment 2 is submitted via the online learning portal. For the final dissertation, both a digital PDF copy and two bound hardcopies must be handed into the faculty office.\"",
    "prompt": "How must students submit the final dissertation?",
    "options": [
      "Digital PDF only",
      "Single printed copy only",
      "Both digital PDF and two bound hardcopies"
    ],
    "answer": "Both digital PDF and two bound hardcopies",
    "explanationVi": "Khóa luận tốt nghiệp yêu cầu nộp cả bản mềm PDF lẫn hai bản in đóng gáy.",
    "evidenceQuote": "both a digital PDF copy and two bound hardcopies must be handed into the faculty office.",
    "tip": "Chú ý các từ nối biểu thị ngoại lệ: \"except\", \"however\", \"provided that\"."
  },
  {
    "id": "drill-lis-mat-04",
    "skill": "listening",
    "typeId": "listening-matching",
    "title": "Listening Drill · Matching #4",
    "contextText": "Lecturer: \"Course module BIO-301 requires prerequisite completion of Organic Chemistry. Module BIO-305 is an open elective with no prior science coursework needed. BIO-310 is restricted exclusively to final-year honours students.\"",
    "prompt": "What is the entry requirement for module BIO-305?",
    "options": [
      "Prerequisite in Organic Chemistry",
      "No prior science coursework required",
      "Restricted to final-year honours students only"
    ],
    "answer": "No prior science coursework required",
    "explanationVi": "Môn BIO-305 là môn tự chọn mở, không yêu cầu bất kỳ môn khoa học tiên quyết nào.",
    "evidenceQuote": "Module BIO-305 is an open elective with no prior science coursework needed.",
    "tip": "Chú ý các từ nối biểu thị ngoại lệ: \"except\", \"however\", \"provided that\"."
  },
  {
    "id": "drill-lis-mat-05",
    "skill": "listening",
    "typeId": "listening-matching",
    "title": "Listening Drill · Matching #5",
    "contextText": "Doctor: \"Our clinic provides walk-in urgent care on Saturday mornings. Regular routine health checks are by appointment only. Emergency trauma cases are immediately transferred to the municipal general hospital.\"",
    "prompt": "What is the clinic policy regarding routine health checks?",
    "options": [
      "Walk-in at any time",
      "By advance appointment only",
      "Referred to municipal hospital"
    ],
    "answer": "By advance appointment only",
    "explanationVi": "Khám sức khỏe định kỳ chỉ tiếp nhận bệnh nhân đã đặt lịch trước (by appointment only).",
    "evidenceQuote": "Regular routine health checks are by appointment only.",
    "tip": "Chú ý các từ nối biểu thị ngoại lệ: \"except\", \"however\", \"provided that\"."
  },
  {
    "id": "drill-wr-proc-01",
    "skill": "writing",
    "typeId": "writing-task-1-process-map",
    "title": "Writing Drill · Process & Map #1",
    "contextText": "Process: Cocoa bean harvesting -> Fermentation (6-8 days in wooden boxes) -> Sun-drying on raised bamboo mats -> Roasting at 120-140°C -> Winnowing to separate nibs from husk -> Grinding into cocoa liquor.",
    "prompt": "Which passive voice sentence best describes the stage immediately following fermentation?",
    "options": [
      "The fermented beans are dried under direct sunlight on elevated bamboo racks.",
      "Farmers ferment cocoa beans for six to eight days in wooden boxes.",
      "Workers crush the roasted nibs into viscous cocoa liquor."
    ],
    "answer": "The fermented beans are dried under direct sunlight on elevated bamboo racks.",
    "explanationVi": "Dạng bài Process cần sử dụng thể bị động (passive voice) chuẩn xác để mô tả trình tự các bước khách quan.",
    "evidenceQuote": "Sun-drying on raised bamboo mats follows fermentation",
    "tip": "Với dạng Process, hãy luôn dùng thì hiện tại đơn thể bị động (is/are + V3/ed) và các từ nối trình tự thời gian."
  },
  {
    "id": "drill-wr-proc-02",
    "skill": "writing",
    "typeId": "writing-task-1-process-map",
    "title": "Writing Drill · Process & Map #2",
    "contextText": "Map comparison: In 2010, the industrial dockland occupied the eastern riverbank. By 2025, the warehouses had been demolished and replaced by high-rise residential apartments and a riverside public promenade.",
    "prompt": "Which sentence best summarizes this urban redevelopment in an Overview paragraph?",
    "options": [
      "The western industrial sector expanded with brand new container terminals.",
      "The former eastern industrial dockland was entirely transformed into a residential and recreational zone.",
      "No significant structural alterations took place along the riverbank over the fifteen-year period."
    ],
    "answer": "The former eastern industrial dockland was entirely transformed into a residential and recreational zone.",
    "explanationVi": "Câu tổng quan (Overview) của dạng Map cần nêu bật sự chuyển đổi mục đích sử dụng đất từ công nghiệp sang dân cư và giải trí.",
    "evidenceQuote": "warehouses had been demolished and replaced by high-rise residential apartments and a riverside public promenade",
    "tip": "Với dạng Process, hãy luôn dùng thì hiện tại đơn thể bị động (is/are + V3/ed) và các từ nối trình tự thời gian."
  },
  {
    "id": "drill-wr-proc-03",
    "skill": "writing",
    "typeId": "writing-task-1-process-map",
    "title": "Writing Drill · Process & Map #3",
    "contextText": "Process: Water treatment plant. Raw river water enters coagulation tanks where alum is added -> Flocculation settles heavy suspended solids -> Sand and carbon filtration removes microscopic impurities -> Chlorination disinfects bacteria -> Treated water pumped to reservoir.",
    "prompt": "Which cohesive device and phrasing appropriately transitions from filtration to disinfection?",
    "options": [
      "Subsequently, the filtered water undergoes chlorination to eliminate harmful microbial pathogens.",
      "Before filtration, workers disinfect the raw untreated water with chlorine gas.",
      "In conclusion, chlorine is added at the very beginning of the purification process."
    ],
    "answer": "Subsequently, the filtered water undergoes chlorination to eliminate harmful microbial pathogens.",
    "explanationVi": "Từ nối \"Subsequently\" thể hiện bước tiếp theo theo đúng trình tự thời gian của quy trình lọc nước.",
    "evidenceQuote": "Sand and carbon filtration -> Chlorination disinfects bacteria",
    "tip": "Với dạng Process, hãy luôn dùng thì hiện tại đơn thể bị động (is/are + V3/ed) và các từ nối trình tự thời gian."
  },
  {
    "id": "drill-wr-proc-04",
    "skill": "writing",
    "typeId": "writing-task-1-process-map",
    "title": "Writing Drill · Process & Map #4",
    "contextText": "Map layout: The village hospital in 2000 was a single-story square structure. In 2024, a two-story maternity wing was constructed to the south, and the existing car park was relocated to the northwest perimeter.",
    "prompt": "Which prepositional phrase accurately describes the spatial change of the car park?",
    "options": [
      "The car park was shifted to the northwest corner of the hospital premises.",
      "The car park was expanded southward adjacent to the maternity ward.",
      "The maternity wing was demolished to construct a car park in the center."
    ],
    "answer": "The car park was shifted to the northwest corner of the hospital premises.",
    "explanationVi": "Cụm từ \"shifted to the northwest corner\" miêu tả chính xác sự dịch chuyển vị trí của bãi đỗ xe theo hướng la bàn.",
    "evidenceQuote": "car park was relocated to the northwest perimeter",
    "tip": "Với dạng Process, hãy luôn dùng thì hiện tại đơn thể bị động (is/are + V3/ed) và các từ nối trình tự thời gian."
  },
  {
    "id": "drill-wr-proc-05",
    "skill": "writing",
    "typeId": "writing-task-1-process-map",
    "title": "Writing Drill · Process & Map #5",
    "contextText": "Process: Paper recycling. Waste paper collected -> Shredded and mixed with hot water to form pulp -> Centrifugal de-inking cleans dyes -> Hydrogen peroxide bleaching whitens fibers -> Rollers squeeze moisture -> Finished recycled paper rolls.",
    "prompt": "What is the primary function of hydrogen peroxide in this manufacturing sequence?",
    "options": [
      "To shred the solid waste paper into tiny scraps",
      "To bleach and whiten the recycled cellulose fibers",
      "To squeeze moisture between mechanical heated rollers"
    ],
    "answer": "To bleach and whiten the recycled cellulose fibers",
    "explanationVi": "Hóa chất hydrogen peroxide đóng vai trò tẩy trắng các sợi xenluloza đã khử mực.",
    "evidenceQuote": "Hydrogen peroxide bleaching whitens fibers",
    "tip": "Với dạng Process, hãy luôn dùng thì hiện tại đơn thể bị động (is/are + V3/ed) và các từ nối trình tự thời gian."
  },
  {
    "id": "drill-sp-p2-01",
    "skill": "speaking",
    "typeId": "speaking-part-2-structuring",
    "title": "Speaking Drill · Part 2 Long Turn #1",
    "contextText": "Cue Card: Describe an environmental problem that your country is facing. You should say: what the problem is, what causes it, how it affects people's lives, and explain what can be done to solve it.",
    "prompt": "During your 1-minute preparation, which note-taking strategy is most effective?",
    "options": [
      "Write down full grammatically complete paragraphs for each bullet point.",
      "Jot down keywords and collocations (e.g., \"particulate matter\", \"respiratory ailments\", \"clean energy subsidy\") covering all 4 bullets.",
      "Sit quietly without writing anything and try to memorize a scripted speech."
    ],
    "answer": "Jot down keywords and collocations (e.g., \"particulate matter\", \"respiratory ailments\", \"clean energy subsidy\") covering all 4 bullets.",
    "explanationVi": "Không bao giờ viết câu hoàn chỉnh trong 1 phút chuẩn bị. Hãy ghi nhanh từ khóa nâng cao (collocations) theo đúng 4 gợi ý trên thẻ.",
    "evidenceQuote": "1-minute preparation note-taking technique",
    "tip": "Tận dụng 1 phút chuẩn bị để phác thảo 4 góc ý theo đúng 4 câu hỏi gợi ý, dùng cụm từ dẫn đường để bài nói liền mạch."
  },
  {
    "id": "drill-sp-p2-02",
    "skill": "speaking",
    "typeId": "speaking-part-2-structuring",
    "title": "Speaking Drill · Part 2 Long Turn #2",
    "contextText": "Candidate speaking: \"Well, speaking of the origin of this historical building, it was erected back in the late seventeenth century... Moving on to its architectural features... As for why this site holds immense cultural importance to me...\"",
    "prompt": "Which speaking skill is demonstrated by the underlined signposting phrases?",
    "options": [
      "Discourse markers and structural coherence ensuring fluent topic transitions",
      "Grammatical inversion with negative adverbials",
      "Phonological elision in connected speech"
    ],
    "answer": "Discourse markers and structural coherence ensuring fluent topic transitions",
    "explanationVi": "Các cụm từ dẫn dắt (signposting phrases/discourse markers) giúp bài nói có kết cấu mạch lạc, liên kết tự nhiên giữa các phần.",
    "evidenceQuote": "speaking of..., Moving on to..., As for why...",
    "tip": "Tận dụng 1 phút chuẩn bị để phác thảo 4 góc ý theo đúng 4 câu hỏi gợi ý, dùng cụm từ dẫn đường để bài nói liền mạch."
  },
  {
    "id": "drill-sp-p2-03",
    "skill": "speaking",
    "typeId": "speaking-part-2-structuring",
    "title": "Speaking Drill · Part 2 Long Turn #3",
    "contextText": "Cue Card: Describe a time when you received useful advice from someone. Bullet 4 asks: and explain how this advice helped you.",
    "prompt": "Which response provides the highest band score development for Bullet 4?",
    "options": [
      "It helped me a lot and I felt very good about it because it was really nice.",
      "Her recommendation proved to be a pivotal turning point; not only did it resolve my immediate career dilemma, but it also instilled a lifelong habit of proactive problem-solving.",
      "I followed the advice next day. The end."
    ],
    "answer": "Her recommendation proved to be a pivotal turning point; not only did it resolve my immediate career dilemma, but it also instilled a lifelong habit of proactive problem-solving.",
    "explanationVi": "Câu trả lời kết hợp từ vựng học thuật (pivotal turning point, dilemma, proactive) cùng cấu trúc đảo ngữ (not only did it...) tạo ấn tượng mạnh với giám khảo.",
    "evidenceQuote": "High-level vocabulary and complex grammar (inversion: not only did it...)",
    "tip": "Tận dụng 1 phút chuẩn bị để phác thảo 4 góc ý theo đúng 4 câu hỏi gợi ý, dùng cụm từ dẫn đường để bài nói liền mạch."
  },
  {
    "id": "drill-sp-p2-04",
    "skill": "speaking",
    "typeId": "speaking-part-2-structuring",
    "title": "Speaking Drill · Part 2 Long Turn #4",
    "contextText": "Strategy: If you run out of things to say in Part 2 before the examiner stops you (1 minute 30 seconds mark), what should you do to reach the full 2-minute mark smoothly?",
    "prompt": "Which technique is recommended to extend your talk naturally?",
    "options": [
      "Reflect on hypothetical scenarios or future implications (e.g., \"Looking back, if I had not experienced that, I might have... In the foreseeable future, I reckon...\")",
      "Repeat your first introductory sentence word-for-word three times",
      "Remain completely silent and stare at the examiner until they ask a question"
    ],
    "answer": "Reflect on hypothetical scenarios or future implications (e.g., \"Looking back, if I had not experienced that, I might have... In the foreseeable future, I reckon...\")",
    "explanationVi": "Kỹ thuật phản tư quá khứ giả định (Third Conditional: if I had not...) hoặc dự đoán tương lai (future implications) giúp kéo dài bài nói tự nhiên và phô diễn cấu trúc ngữ pháp phức tạp.",
    "evidenceQuote": "Hypothetical and future reflection extension",
    "tip": "Tận dụng 1 phút chuẩn bị để phác thảo 4 góc ý theo đúng 4 câu hỏi gợi ý, dùng cụm từ dẫn đường để bài nói liền mạch."
  },
  {
    "id": "drill-sp-p2-05",
    "skill": "speaking",
    "typeId": "speaking-part-2-structuring",
    "title": "Speaking Drill · Part 2 Long Turn #5",
    "contextText": "Cue Card: Describe an accomplishment you are proud of. The candidate wants to convey emotional depth and personal growth.",
    "prompt": "Which idiomatic expression and phrasing best expresses overcoming severe hardship to achieve success?",
    "options": [
      "Against all odds, after burning the midnight oil for months, standing on that podium was an overwhelmingly gratifying milestone.",
      "It was easy and I did not need to study or practice at all.",
      "The accomplishment was big and I was very happy."
    ],
    "answer": "Against all odds, after burning the midnight oil for months, standing on that podium was an overwhelmingly gratifying milestone.",
    "explanationVi": "Sử dụng thành ngữ phù hợp tự nhiên (against all odds, burn the midnight oil) cùng từ vựng cảm xúc (gratifying milestone) đạt tiêu chuẩn Band 8-9 về Lexical Resource.",
    "evidenceQuote": "Against all odds, burning the midnight oil, overwhelmingly gratifying milestone",
    "tip": "Tận dụng 1 phút chuẩn bị để phác thảo 4 góc ý theo đúng 4 câu hỏi gợi ý, dùng cụm từ dẫn đường để bài nói liền mạch."
  }
];

export function getDrillQuestionsByType(typeId: string): DrillQuestion[] {
  return IELTS_DRILL_QUESTIONS.filter((q) => q.typeId === typeId);
}

export function getDrillQuestionsBySkill(skill: IeltsSkill): DrillQuestion[] {
  return IELTS_DRILL_QUESTIONS.filter((q) => q.skill === skill);
}

export function getDrillQuestionById(id: string): DrillQuestion | undefined {
  return IELTS_DRILL_QUESTIONS.find((q) => q.id === id);
}
