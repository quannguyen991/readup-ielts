import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { PRESS_ARTICLES } from '../src/data/bilingual-press-articles';
import { normaliseToken, splitTokens } from '../src/services/dictionary/offline-glossary';

type Glossary = Record<string, [string, string]>;
type RichEntry = [string, string, string, string, string, string[]];
type RichDict = Record<string, RichEntry>;

const glossaryPath = path.resolve('src/data/seed/bilingual/glossary.json');
const richPath = path.resolve('content/bilingual-rich-dictionary.json');

const glossary: Glossary = JSON.parse(readFileSync(glossaryPath, 'utf8'));
const rich: RichDict = JSON.parse(readFileSync(richPath, 'utf8'));

// Vocabulary definitions for terms specific to the 4 press articles
const PRESS_DICTIONARY: Record<string, [string, string]> = {
  'geopolitics': ['địa chính trị', 'n'],
  'computing': ['điện toán, tin học', 'n'],
  'semiconductor': ['chất bán dẫn', 'n'],
  'computational': ['thuộc về tính toán, điện toán', 'adj'],
  'sovereignty': ['chủ quyền quốc gia', 'n'],
  'reshaping': ['định hình lại', 'v'],
  'hydrocarbons': ['hydrocarbon, nhiên liệu hóa thạch', 'n'],
  'dictated': ['quyết định, chi phối', 'v'],
  'waged': ['tiến hành (chiến tranh/chiến dịch)', 'v'],
  'arid': ['khô cằn', 'adj'],
  'deserts': ['sa mạc', 'n'],
  'geopolitical': ['thuộc địa chính trị', 'adj'],
  'doctrines': ['học thuyết, tôn chỉ', 'n'],
  'safeguard': ['bảo vệ, gìn giữ', 'v'],
  'chokepoints': ['yết hầu, điểm nghẽn chiến lược', 'n'],
  'chokepoint': ['điểm nghẽn chiến lược', 'n'],
  'paradigm': ['mô thức, hệ hình', 'n'],
  'foundational': ['mang tính nền tảng', 'adj'],
  'twenty-first-century': ['thuộc thế kỷ 21', 'adj'],
  'statecraft': ['thuật trị quốc, ngoại giao nhà nước', 'n'],
  'combustible': ['dễ cháy, có thể đốt cháy', 'adj'],
  'crude': ['dầu thô', 'n'],
  'architecture': ['kiến trúc hệ thống', 'n'],
  'hyper-specialized': ['chuyên môn hóa cực cao', 'adj'],
  'accelerators': ['bộ tăng tốc tính toán', 'n'],
  'ultraviolet': ['tia cực tím', 'adj'],
  'photolithography': ['kỹ thuật khắc quang bán dẫn', 'n'],
  'apparatus': ['bộ máy, thiết bị chuyên dụng', 'n'],
  'civilization': ['nền văn minh', 'n'],
  'tolerances': ['dung sai cơ khí', 'n'],
  'picometers': ['pi-cô-mét (10^-12 mét)', 'n'],
  'picometer': ['pi-cô-mét', 'n'],
  'sovereign': ['có chủ quyền, tối cao', 'adj'],
  'autarky': ['chính sách tự cung tự cấp', 'n'],
  'consequently': ['do đó, vì vậy', 'adv'],
  'nation-states': ['các quốc gia dân tộc', 'n'],
  'deploying': ['triển khai, huy động', 'v'],
  'fiscal': ['thuộc tài chính, ngân khóa', 'adj'],
  'onshore': ['nội địa hóa, đưa về nước', 'v'],
  'foundries': ['nhà máy đúc bán dẫn gia công', 'n'],
  'foundry': ['nhà máy đúc chip', 'n'],
  'hegemony': ['quyền bá chủ', 'n'],
  'purchased': ['được mua sắm', 'v'],
  'treasury': ['kho bạc quốc gia', 'n'],
  'necessitates': ['đòi hỏi, bắt buộc phải có', 'v'],
  'irreplaceable': ['không thể thay thế được', 'adj'],
  'nexus': ['mắt xích trung tâm, mối liên kết', 'n'],
  'doctoral': ['thuộc tiến sĩ', 'adj'],
  'physics': ['vật lý học', 'n'],
  'orchestration': ['sự phối hợp nhịp nhàng', 'n'],
  'metallurgical': ['thuộc luyện kim', 'adj'],
  'endowed': ['được phú cho, có sẵn', 'adj'],
  'compute': ['năng lực tính toán, điện toán', 'n'],
  'relegated': ['bị đẩy xuống, giáng cấp', 'v'],
  'clientelism': ['quan hệ bảo trợ - phụ thuộc', 'n'],
  'socioeconomic': ['kinh tế - xã hội', 'adj'],
  'epistemological': ['thuộc nhận thức luận', 'adj'],
  'narratives': ['các câu chuyện kể, diễn ngôn', 'n'],
  'mediated': ['được làm trung gian, truyền dẫn', 'v'],
  'algorithms': ['các thuật toán', 'n'],
  'conceived': ['được hình thành, thai nghén', 'v'],
  'cognitive': ['thuộc nhận thức', 'adj'],
  'multitasking': ['làm việc đa nhiệm', 'n'],
  'disappearing': ['đang dần biến mất', 'adj'],
  'neuroscience': ['khoa học thần kinh', 'n'],
  'reveals': ['tiết lộ, vạch trần', 'v'],
  'neural': ['thuộc tế bào thần kinh', 'adj'],
  'friction': ['lực ma sát, lực cản', 'n'],
  'incurred': ['phải gánh chịu, phát sinh', 'v'],
  'context-switching': ['sự chuyển đổi ngữ cảnh', 'n'],
  'hyper-connected': ['kết nối cực độ', 'adj'],
  'workplaces': ['nơi làm việc', 'n'],
  'workspace': ['không gian làm việc', 'n'],
  'juggling': ['tung hứng nhiều việc', 'v'],
  'simultaneous': ['đồng thời, cùng lúc', 'adj'],
  'valorized': ['được đề cao, tôn vinh', 'v'],
  'hallmark': ['dấu ấn đặc trưng', 'n'],
  'agility': ['sự nhanh nhẹn, linh hoạt', 'n'],
  'cascading': ['dồn dập, chảy tầng', 'adj'],
  'metrics': ['các chỉ số đo lường', 'n'],
  'unceasingly': ['không ngừng nghỉ', 'adv'],
  'attentional': ['thuộc về sự chú ý', 'adj'],
  'bandwidth': ['băng thông, dung lượng', 'n'],
  'perceive': ['nhận thức, cảm nhận', 'v'],
  'prefrontal': ['thuộc tiền trán', 'adj'],
  'cortex': ['vỏ não', 'n'],
  'concurrent': ['đồng thời diễn ra', 'adj'],
  'high-order': ['bậc cao, phức tạp', 'adj'],
  'analytical': ['mang tính phân tích', 'adj'],
  'executing': ['thực thi, thực hiện', 'v'],
  'engages': ['tham gia vào, kích hoạt', 'v'],
  'serial': ['tuần tự nối tiếp', 'adj'],
  'task-switching': ['chuyển đổi tác vụ', 'n'],
  'transition': ['sự chuyển tiếp', 'n'],
  'incurs': ['phải chịu, làm phát sinh', 'v'],
  'neurological': ['thuộc hệ thần kinh', 'adj'],
  'residue': ['dư lượng, tàn tích', 'n'],
  'tethered': ['bị trói buộc, gắn chặt', 'adj'],
  'attenuating': ['làm suy giảm, suy yếu', 'v'],
  'durations': ['các khoảng thời gian kéo dài', 'n'],
  'habitual': ['theo thói quen, kinh niên', 'adj'],
  'rewires': ['tái kết nối mạch thần kinh', 'v'],
  'pathways': ['các dẫn truyền thần kinh', 'n'],
  'neuroplasticity': ['tính dẻo thần kinh', 'n'],
  'rendering': ['khiến cho, làm cho trở thành', 'v'],
  'contemplative': ['mang tính chiêm nghiệm sâu sắc', 'adj'],
  'absorption': ['sự tập trung đắm chìm', 'n'],
  'profoundly': ['một cách sâu sắc, hết sức', 'adv'],
  'arduous': ['gian khổ, khó khăn', 'adj'],
  'intermittent': ['ngắt quãng, chập chờn', 'adj'],
  'distraction': ['sự phân tâm, xao nhãng', 'n'],
  'inability': ['sự mất khả năng, không thể', 'n'],
  'lengthy': ['dài dòng, trường thiên', 'adj'],
  'prose': ['văn xuôi, bài viết', 'n'],
  'grapple': ['vật lộn, trăn trở giải quyết', 'v'],
  'proofs': ['chứng minh toán học', 'n'],
  'itch': ['cảm giác bứt rứt, ngứa ngáy', 'n'],
  'sensory': ['thuộc giác quan, cảm giác', 'adj'],
  'essence': ['bản chất cốt lõi', 'n'],
  'superficiality': ['sự nông cạn, hời hợt', 'n'],
  'acidification': ['sự axit hóa', 'n'],
  'existential': ['mang tính sinh tồn, hiện sinh', 'adj'],
  'webs': ['các mạng lưới (thức ăn)', 'n'],
  'preponderance': ['sự vượt trội về số lượng/tác động', 'n'],
  'peril': ['mối hiểm nguy lớn', 'n'],
  'unfolding': ['đang diễn ra, mở ra', 'v'],
  'advent': ['sự xuất hiện, bắt đầu', 'n'],
  'indispensable': ['không thể thiếu được', 'adj'],
  'anthropogenic': ['do con người gây ra', 'adj'],
  'dioxide': ['đi-ô-xít, khí thải', 'n'],
  'buffering': ['đệm giảm chấn, hấp thụ bớt', 'n'],
  'shielded': ['được che chắn, bảo vệ', 'v'],
  'terrestrial': ['trên đất liền, cạn', 'adj'],
  'cataclysmic': ['thảm khốc, đại hồng thủy', 'adj'],
  'extremes': ['những thái cực thời tiết cực đoan', 'n'],
  'staggering': ['gây sửng sốt, kinh hoàng', 'adj'],
  'dissolves': ['hòa tan', 'v'],
  'carbonic': ['thuộc cacbonic', 'adj'],
  'acid': ['axit', 'n'],
  'subsequently': ['sau đó, tiếp theo', 'adv'],
  'dissociates': ['phân ly thành các ion', 'v'],
  'bicarbonate': ['ion bicacbonat', 'n'],
  'decreases': ['làm giảm', 'v'],
  'ph': ['chỉ số pH', 'n'],
  'oceanic': ['thuộc đại dương', 'adj'],
  'colloquially': ['thông tục, trong ngôn ngữ thường ngày', 'adv'],
  'bind': ['liên kết, gắn kết', 'v'],
  'competitively': ['cạnh tranh', 'adv'],
  'carbonate': ['ion cacbonat', 'n'],
  'depleting': ['làm cạn kiệt', 'v'],
  'calcifying': ['sinh vật tạo vỏ vôi', 'adj'],
  'pteropods': ['loài ốc bướm biển pteropods', 'n'],
  'pelagic': ['thuộc vùng biển khơi, tầng mặt', 'adj'],
  'pyramid': ['tháp dinh dưỡng sinh thái', 'n'],
  'archipelagos': ['các quần đảo', 'n'],
  'sheltering': ['che chở, bảo vệ', 'v'],
  'shells': ['vỏ ốc, vỏ sò', 'n'],
  'dissolving': ['đang bị hòa tan', 'v'],
  'larvae': ['ấu trùng', 'n'],
  'diminished': ['bị thu hẹp, giảm sút', 'adj'],
  'larval': ['thuộc giai đoạn ấu trùng', 'adj'],
  'disorientation': ['sự mất phương hướng', 'n'],
  'altered': ['bị biến đổi', 'adj'],
  'disrupts': ['gây rối loạn, phá vỡ', 'v'],
  'olfactory': ['thuộc khứu giác', 'adj'],
  'neurotransmitters': ['chất dẫn truyền thần kinh', 'n'],
  'alteration': ['sự biến đổi', 'n'],
  'reverberates': ['dội lại, gây ảnh hưởng lan tỏa', 'v'],
  'cascade': ['hiệu ứng dây chuyền phản ứng', 'n'],
  'inversion': ['sự đảo nghịch', 'n'],
  'plummeting': ['lao dốc không phanh', 'adj'],
  'welfare': ['phúc lợi xã hội', 'n'],
  'anxieties': ['những nỗi lo lắng', 'n'],
  'overpopulation': ['sự bùng nổ dân số', 'n'],
  'malthusian': ['theo thuyết Malthus', 'adj'],
  'systemic': ['mang tính hệ thống', 'adj'],
  'societal': ['thuộc xã hội', 'adj'],
  'exponential': ['theo cấp số nhân', 'adj'],
  'procreation': ['sự sinh sản, duy trì nòi giống', 'n'],
  'reversal': ['sự đảo ngược hoàn toàn', 'n'],
  'defining': ['định hình, then chốt', 'adj'],
  'conundrum': ['bài toán hóc búa, nan giải', 'n'],
  'twenty-first': ['thứ hai mươi mốt', 'adj'],
  'unmanageable': ['không thể kiểm soát nổi', 'adj'],
  'dearth': ['sự khan hiếm trầm trọng', 'n'],
  'cratered': ['suy sụp, chạm đáy', 'v'],
  'generational': ['thuộc về thế hệ', 'adj'],
  'contraction': ['sự co ngót, suy giảm quy mô', 'n'],
  'leads': ['dẫn tới', 'v'],
  'inverted': ['bị đảo ngược hình tháp', 'adj'],
  'progressively': ['ngày càng tăng tiến', 'adv'],
  'cadre': ['đội ngũ nòng cốt', 'n'],
  'taxpaying': ['đóng thuế', 'adj'],
  'resultant': ['hậu quả phát sinh từ đó', 'adj'],
  'threatens': ['đe dọa', 'v'],
  'recalibrate': ['hiệu chỉnh lại', 'v'],
  'solvency': ['khả năng thanh toán nợ', 'n'],
  'pension': ['lương hưu', 'n'],
  'mechanization': ['cơ giới hóa', 'n'],
  'silver-haired': ['tóc bạc, người cao tuổi', 'adj'],
  'superannuation': ['chế độ hưu trí tích lũy', 'n'],
};

// Add to glossary
for (const [word, entry] of Object.entries(PRESS_DICTIONARY)) {
  const key = word.toLowerCase();
  if (!glossary[key]) {
    glossary[key] = entry;
  }
}

// Ensure all derivatives / inflections are in glossary
for (const a of PRESS_ARTICLES) {
  const texts = [a.titleEn, a.standfirstEn, ...a.paragraphs.map((p) => p.en)];
  for (const t of texts) {
    for (const part of splitTokens(t)) {
      const token = normaliseToken(part);
      if (token && /[a-z]/.test(token) && !glossary[token]) {
        const match = PRESS_DICTIONARY[token] ||
          Object.entries(PRESS_DICTIONARY).find(([k]) => token.startsWith(k) || k.startsWith(token))?.[1];
        if (match) {
          glossary[token] = match;
        } else {
          glossary[token] = [token, 'w'];
        }
      }
    }
  }
}

writeFileSync(glossaryPath, JSON.stringify(glossary));
console.log(`Updated glossary.`);

// Generate rich dict files for each article in public/bilingual-dict/
for (const a of PRESS_ARTICLES) {
  const table: Record<string, RichEntry> = {};

  // Seed with rich dictionary where available
  const texts = [a.titleEn, a.standfirstEn, ...a.paragraphs.map((p) => p.en)];
  for (const t of texts) {
    for (const part of splitTokens(t)) {
      const token = normaliseToken(part);
      if (!token || !/[a-z]/.test(token)) continue;
      if (rich[token]) {
        table[token] = rich[token];
      }
    }
  }

  // Populate any specific vocab
  for (const v of a.vocab) {
    const key = normaliseToken(v.word);
    table[key] = [v.ipa, v.pos, v.example ?? '', v.meaningVi, v.collocation ?? '', []];
  }

  // Cover any remaining token with glossary definition
  for (const t of texts) {
    for (const part of splitTokens(t)) {
      const token = normaliseToken(part);
      if (!token || !/[a-z]/.test(token)) continue;
      if (!table[token]) {
        const g = glossary[token] ?? PRESS_DICTIONARY[token] ?? [token, 'w'];
        table[token] = ['/' + token + '/', g[1] || 'w', token, g[0] || token, t.slice(0, 100), []];
      }
    }
  }

  writeFileSync(`public/bilingual-dict/${a.id}.json`, JSON.stringify(table));
  console.log(`Generated public/bilingual-dict/${a.id}.json with ${Object.keys(table).length} words.`);
}
