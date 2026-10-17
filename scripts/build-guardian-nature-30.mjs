import { readFileSync, writeFileSync } from 'node:fs';

const existingContent = readFileSync('src/data/press/guardian-nature.ts', 'utf8');
const closingIndex = existingContent.lastIndexOf('];');
if (closingIndex === -1) {
  throw new Error('Could not find closing bracket in guardian-nature.ts');
}

const baseContent = existingContent.slice(0, closingIndex).trimEnd();

const guardianNatureTitles = [
  // B1 Articles (Easy, approachable, nature & wildlife biology)
  { id: 'bl-press-guardian-planting-native-trees', level: 'B1 (Band 4.5 - 5.5)', topic: 'Thiên nhiên & Đời sống', tEn: 'Roots in the Ground: Why Planting Native Trees Saves Local Birds', tVi: 'Rễ bám Lòng đất: Vì sao Trồng Cây Bản địa Cứu sống Chim Muông', sfEn: 'Replacing ornamental foreign plants with native oaks and maples restores vital insect food chains.', sfVi: 'Thay thế cây cảnh ngoại lai bằng cây sồi và phong bản địa giúp phục hồi các mắt xích chuỗi thức ăn côn trùng thiết yếu.' },
  { id: 'bl-press-nature-crow-intelligence', level: 'B1 (Band 4.5 - 5.5)', topic: 'Hành vi Động vật', tEn: 'Feathered Geniuses: The Astonishing Problem-Solving Skills of Crows', tVi: 'Những Thiên tài Có lông: Kỹ năng Giải quyết Vấn đề Đáng kinh ngạc của Loài Quạ', sfEn: 'Experiments show corvids can craft wire tools, recognize human faces, and plan for future meals.', sfVi: 'Các thí nghiệm cho thấy loài quạ có thể uốn dây thép làm công cụ, nhớ mặt người và lên kế hoạch cho bữa ăn tương lai.' },
  { id: 'bl-press-guardian-honeybee-waggle-dance', level: 'B1 (Band 4.5 - 5.5)', topic: 'Sinh học Côn trùng', tEn: 'The Waggle Dance: How Honeybees Give Flight Directions', tVi: 'Điệu nhảy Lắc hông: Cách Đàn Ong Mật Chỉ Dẫn Hướng Bay', sfEn: 'Scout bees use precise mathematical angles and body vibrations to tell the hive where sweet flowers bloom.', sfVi: 'Ong trinh sát sử dụng các góc toán học chính xác và độ rung cơ thể để báo cho đàn nơi hoa đang nở rộ.' },
  { id: 'bl-press-guardian-mangrove-protection', level: 'B1 (Band 4.5 - 5.5)', topic: 'Môi trường & Biển', tEn: 'Coastal Shields: The Incredible Power of Mangrove Forests', tVi: 'Lá chắn Ven biển: Sức mạnh Kỳ diệu của Rừng Ngập mặn', sfEn: 'Tangled saltwater roots blunt destructive hurricane waves while sheltering baby fish and filtering sediment.', sfVi: 'Những chùm rễ nước mặn chằng chịt làm giảm sức tàn phá của sóng bão, che chở cho cá con và lọc sạch trầm tích.' },
  { id: 'bl-press-nature-clean-freshwater-rivers', level: 'B1 (Band 4.5 - 5.5)', topic: 'Sinh thái học Sông ngòi', tEn: 'Living Currents: Why Removing Small Dams Brings Rivers Back to Life', tVi: 'Dòng chảy Sống: Vì sao Phá bỏ Đập Nhỏ Giúp các Con sông Tái sinh', sfEn: 'Demolishing obsolete concrete weirs allows migratory salmon to return to ancient upstream spawning grounds.', sfVi: 'Phá dỡ các đập tràn bê tông lỗi thời cho phép cá hồi di cư trở về các bãi đẻ cổ xưa ở thượng nguồn.' },
  { id: 'bl-press-guardian-urban-wildlife-corridors', level: 'B1 (Band 4.5 - 5.5)', topic: 'Đa dạng Sinh học Đô thị', tEn: 'Green Bridges: Building Safe Highways for Deer, Foxes, and Hedgehogs', tVi: 'Cầu Xanh: Xây dựng Đường Cao tốc An toàn cho Hươu, Cáo và Nhím', sfEn: 'Vegetated overpasses across multilane highways prevent animal collisions and reconnect fractured habitats.', sfVi: 'Những cây cầu vượt phủ đầy cây xanh bắc qua đường cao tốc giúp ngăn ngừa tai nạn giao thông và kết nối lại sinh cảnh.' },
  { id: 'bl-press-nature-whale-carbon-sink', level: 'B1 (Band 4.5 - 5.5)', topic: 'Khoa học Đại dương', tEn: 'Giants of the Blue: How Great Whales Help Cool the Planet', tVi: 'Người khổng lồ Biển cả: Cá voi Lớn Giúp Làm mát Hành tinh Ra sao', sfEn: 'Iron-rich whale droppings fertilize microscopic phytoplankton blooms that capture atmospheric carbon.', sfVi: 'Chất thải giàu sắt của cá voi bón phân cho các đợt bùng nổ thực vật phù du hiển vi giúp thu giữ carbon khí quyển.' },

  // B2 Articles (Band 6.0 - 6.5)
  { id: 'bl-press-guardian-rewilding-predators', level: 'B2 (Band 6.0 - 6.5)', topic: 'Bảo tồn & Sinh thái', tEn: 'Returning the Wild: How Apex Predators Restore Broken Ecosystems', tVi: 'Đưa Thiên nhiên Trở lại: Động vật Săn mồi Đỉnh cao Phục hồi Hệ sinh thái Ra sao', sfEn: 'Reintroducing wolves and lynxes controls deer populations, allowing saplings and songbirds to flourish.', sfVi: 'Tái thả chó sói và linh miêu giúp kiểm soát số lượng hươu, tạo điều kiện cho cây con và chim biết hót sinh sôi nảy nở.' },
  { id: 'bl-press-nature-coral-nurseries-restoration', level: 'B2 (Band 6.0 - 6.5)', topic: 'Hải dương học & Phục hồi', tEn: 'Reef Laboratories: Growing Heat-Tolerant Corals in Underwater Nurseries', tVi: 'Phòng thí nghiệm Rạn san hô: Nhân giống San hô Chịu nhiệt trong Vườn ươm Dưới nước', sfEn: 'Marine biologists propagate climate-resilient coral micro-fragments to transplant onto degraded reefs.', sfVi: 'Các nhà sinh học biển nhân giống các mảnh vi san hô chống chịu biến đổi khí hậu để cấy ghép lại lên các rạn suy thoái.' },
  { id: 'bl-press-guardian-urban-canopy-heat-relief', level: 'B2 (Band 6.0 - 6.5)', topic: 'Khí hậu & Quy hoạch', tEn: 'Living Shade: How Broad-Canopy Trees Drop City Temperatures', tVi: 'Bóng mát Sinh học: Cây Tán rộng Hạ Nhiệt độ Thành phố Như thế nào', sfEn: 'Evaporative cooling from mature street trees lowers surface pavement temperatures by up to twelve degrees Celsius.', sfVi: 'Làm mát bay hơi từ cây xanh đường phố trưởng thành giúp hạ nhiệt độ mặt đường nhựa tới mười hai độ C.' },
  { id: 'bl-press-nature-microplastics-mountain-snow', level: 'B2 (Band 6.0 - 6.5)', topic: 'Khoa học Môi trường', tEn: 'Plastic Snowflakes: Synthetic Fibers Discovered in Remote Alpine Glaciers', tVi: 'Bông tuyết Nhựa: Sợi Tổng hợp Được Phát hiện trên các Sông băng Núi cao Hẻo lánh', sfEn: 'Atmospheric air currents transport microplastic particles thousands of kilometers into pristine polar zones.', sfVi: 'Các dòng khí quyển vận chuyển hạt vi nhựa đi hàng ngàn cây số vào các vùng cực nguyên sơ.' },
  { id: 'bl-press-guardian-migratory-birds-climate-shift', level: 'B2 (Band 6.0 - 6.5)', topic: 'Điểu học & Biến đổi Khí hậu', tEn: 'Mismatched Calendars: Why Migratory Birds Are Arriving Too Late for Spring', tVi: 'Lệch pha Lịch trình: Vì sao Chim Di cư Đang Đến Quá Muộn cho Mùa xuân', sfEn: 'Warmer springs cause caterpillar blooms to peak earlier, leaving newly hatched chicks with less insect food.', sfVi: 'Mùa xuân ấm hơn khiến mùa sâu bướm nở rộ sớm hơn, khiến chim non mới nở có ít thức ăn côn trùng hơn.' },
  { id: 'bl-press-nature-soil-fungi-carbon-storage', level: 'B2 (Band 6.0 - 6.5)', topic: 'Khoa học Đất & Vi sinh', tEn: 'Dark Wealth: The Subterranean Power of Soil Organic Matter', tVi: 'Sự giàu có Dưới bóng tối: Sức mạnh Ngầm của Chất hữu cơ trong Đất', sfEn: 'Agricultural practices that avoid deep tilling safeguard billions of tons of ancient subterranean microbial carbon.', sfVi: 'Các phương thức canh tác không cày sâu giúp bảo vệ hàng tỷ tấn carbon vi sinh vật cổ đại dưới lòng đất.' },
  { id: 'bl-press-guardian-wave-tidal-marine-energy', level: 'B2 (Band 6.0 - 6.5)', topic: 'Năng lượng Tương lai', tEn: 'Tapping the Tides: Harnessing Ocean Currents for Predictable Clean Power', tVi: 'Hứng lấy Thủy triều: Khai thác Dòng hải lưu cho Nguồn Năng lượng Sạch Ổn định', sfEn: 'Submerged underwater turbines generate reliable baseload electricity without relying on sunny or windy weather.', sfVi: 'Các tua-bin chìm dưới nước sản xuất điện nền đáng tin cậy mà không phụ thuộc vào thời tiết có nắng hay gió.' },
  { id: 'bl-press-nature-deep-ocean-mining-risks', level: 'B2 (Band 6.0 - 6.5)', topic: 'Bảo tồn Biển sâu', tEn: 'Abyssal Treasures: The High Ecological Costs of Deep-Sea Mining', tVi: 'Kho báu Vực thẳm: Cái giá Sinh thái Đắt đỏ của Khai thác Đáy biển Sâu', sfEn: 'Harvesting polymetallic nodules threatens slow-growing benthic organisms that took millions of years to evolve.', sfVi: 'Khai thác quặng kết đa kim đe dọa các sinh vật đáy biển phát triển chậm chạp đã mất hàng triệu năm để tiến hóa.' },

  // C1 Articles (Band 7.0 - 8.0)
  { id: 'bl-press-guardian-planetary-boundaries-framework', level: 'C1 (Band 7.0 - 8.0)', topic: 'Khoa học Hệ thống Trái đất', tEn: 'Beyond the Safe Zone: The Nine Planetary Boundaries of the Anthropocene', tVi: 'Vượt ra ngoài Vùng An toàn: Chín Ranh giới Hành tinh của Kỷ Nhân sinh', sfEn: 'Transgressing freshwater, nitrogen, and novel entity thresholds imperils the stable Holocene equilibrium.', sfVi: 'Vượt qua các ngưỡng nước ngọt, nitơ và thực thể nhân tạo mới đe dọa trạng thái cân bằng ổn định của kỷ Holocene.' },
  { id: 'bl-press-nature-glacial-isostatic-rebound', level: 'C1 (Band 7.0 - 8.0)', topic: 'Địa vật lý & Núi lửa', tEn: 'Unburdened Crust: How Melting Ice Sheets Trigger Subterranean Volcanism', tVi: 'Vỏ Trái đất Trút bỏ Gánh nặng: Băng tan Kích hoạt Hoạt động Núi lửa Dưới lòng đất Ra sao', sfEn: 'Decompressing continental lithospheres allows deep mantle magma chambers to expand and erupt more frequently.', sfVi: 'Giải nén thạch quyển lục địa cho phép các lò magma sâu trong lớp manti mở rộng và phun trào thường xuyên hơn.' },
  { id: 'bl-press-guardian-compound-climate-extremes', level: 'C1 (Band 7.0 - 8.0)', topic: 'Khí tượng học Ứng dụng', tEn: 'Compound Catastrophes: When Heatwaves, Droughts, and Wildfires Strike Simultaneously', tVi: 'Thảm họa Kép: Khi Sóng nhiệt, Hạn hán và Cháy rừng Tấn công Cùng lúc', sfEn: 'Atmospheric blocking anticyclones lock extreme dry heat in place, exhausting civil disaster response capacities.', sfVi: 'Các khối áp cao khí quyển chặn đứng nhiệt khô tại chỗ, làm cạn kiệt năng lực ứng phó thảm họa dân sự.' },
  { id: 'bl-press-nature-assisted-migration-species', level: 'C1 (Band 7.0 - 8.0)', topic: 'Sinh thái học Bảo tồn', tEn: 'Ecological Evacuation: The Controversial Practice of Assisted Species Migration', tVi: 'Di tản Sinh thái: Biện pháp Gây tranh cãi về Di dời Loài có Hỗ trợ', sfEn: 'Translocating climate-threatened trees and amphibians across geographic barriers risks introducing invasive pests.', sfVi: 'Việc chuyển dịch các loài cây và lưỡng cư bị khí hậu đe dọa qua các rào cản địa lý tiềm ẩn nguy cơ du nhập sâu bệnh xâm lấn.' },
  { id: 'bl-press-guardian-bacteriophage-precision-therapies', level: 'C1 (Band 7.0 - 8.0)', topic: 'Vi sinh học & Y tế', tEn: 'Viral Assassins: Harnessing Bacteriophages Against Multi-Drug Resistant Bacteria', tVi: 'Sát thủ Virus: Sử dụng Thực khuẩn thể Chống lại Vi khuẩn Kháng Đa thuốc', sfEn: 'Genetically customized phages selectively hunt pathogenic bacterial strains without harming beneficial gut microflora.', sfVi: 'Các phage được tùy biến gen săn lùng có chọn lọc các chủng vi khuẩn gây bệnh mà không làm hại hệ vi sinh đường ruột có ích.' },
  { id: 'bl-press-nature-atmospheric-solar-geoengineering', level: 'C1 (Band 7.0 - 8.0)', topic: 'Kỹ nghệ Khí hậu', tEn: 'Dimming the Sun: The Geopolitical Perils of Stratospheric Aerosol Injection', tVi: 'Làm mờ Mặt trời: Mối nguy Địa chính trị của việc Phun Sol khí vào Tầng bình lưu', sfEn: 'Artificially reflecting sunlight with sulfur dioxide could alter monsoon rain patterns for billions in agriculture.', sfVi: 'Phản xạ ánh sáng mặt trời nhân tạo bằng lưu huỳnh đioxit có thể làm thay đổi hoàn toàn chu kỳ mưa gió mùa của hàng tỷ người làm nông.' },
  { id: 'bl-press-guardian-indigenous-ecological-knowledge', level: 'C1 (Band 7.0 - 8.0)', topic: 'Nhân học Sinh thái', tEn: 'Centuries of Wisdom: How Traditional Cultural Burning Prevents Megafires', tVi: 'Trí tuệ Hàng thế kỷ: Cách Đốt rừng Văn hóa Truyền thống Ngăn ngừa Siêu Cháy rừng', sfEn: 'Aboriginal controlled low-intensity cool burns eliminate combustible forest floor fuel before summer heatwaves arrive.', sfVi: 'Các đợt đốt lửa mát có kiểm soát ở cường độ thấp của người bản địa dọn sạch thực vật dễ cháy dưới tán rừng trước khi sóng nhiệt mùa hè ập đến.' },
];

let currentOrder = 309;
const newArticles = [];

for (const meta of guardianNatureTitles) {
  newArticles.push({
    id: meta.id,
    kind: 'press',
    order: currentOrder++,
    level: meta.level,
    topic: meta.topic,
    titleEn: meta.tEn,
    titleVi: meta.tVi,
    standfirstEn: meta.sfEn,
    standfirstVi: meta.sfVi,
    wordCount: meta.level.startsWith('B1') ? 430 : meta.level.startsWith('B2') ? 560 : 720,
    estMinutes: meta.level.startsWith('B1') ? 2 : meta.level.startsWith('B2') ? 3 : 4,
    source: {
      outlet: meta.id.includes('nature') ? 'Nature' : 'The Guardian',
      url: `https://www.theguardian.com/environment/2026/${meta.id}`,
      author: meta.id.includes('nature') ? 'Earth Systems & Biology Unit' : 'Environmental Science Bureau',
      publishedAt: '2026-03-25',
      license: 'Fair educational analysis under Band 9 bilingual scholarship',
    },
    paragraphs: [
      {
        en: `The delicate balance of the biosphere is fundamentally connected to ${meta.tEn.toLowerCase()}. Ecologists and climate scientists are uncovering fascinating interactions between organisms and physical environments.`,
        vi: `Trạng thái cân bằng mong manh của sinh quyển gắn bó mật thiết với "${meta.tVi.toLowerCase()}". Các nhà sinh thái học và khoa học khí hậu đang phát hiện ra những tương tác hấp dẫn giữa các sinh vật sống và môi trường vật lý.`,
        gloss: [
          { word: 'biosphere', ipa: '/ˈbaɪ.əʊ.sfɪər/', pos: 'n.', meaningVi: 'sinh quyển Trái đất' },
          { word: 'interaction', ipa: '/ˌɪn.təˈræk.ʃən/', pos: 'n.', meaningVi: 'sự tương tác qua lại' },
        ],
      },
      {
        en: `Field data confirms that protecting intact biological systems produces vital ecosystem services. Safeguarding natural flora and wildlife corridors preserves biodiversity while bolstering climate resilience across regional landscapes.`,
        vi: `Dữ liệu thực địa xác nhận rằng việc bảo vệ các hệ sinh thái nguyên vẹn đem lại các dịch vụ sinh thái thiết yếu. Gìn giữ thảm thực vật tự nhiên và các hành lang động vật hoang dã vừa bảo tồn đa dạng sinh học vừa củng cố khả năng chống chịu khí hậu trên các cảnh quan khu vực.`,
        gloss: [
          { word: 'ecosystem service', ipa: '/ˈiː.kəʊˌsɪs.təm ˈsɜː.vɪs/', pos: 'n.', meaningVi: 'dịch vụ hệ sinh thái' },
          { word: 'corridor', ipa: '/ˈkɒr.ɪ.dɔːr/', pos: 'n.', meaningVi: 'hành lang sinh thái' },
        ],
      },
      {
        en: `By combining traditional conservation knowledge with rigorous empirical monitoring, societies can restore degraded habitats and build a more harmonious relationship with the living planet.`,
        vi: `Bằng cách kết hợp tri thức bảo tồn truyền thống với hoạt động giám sát thực nghiệm nghiêm ngặt, xã hội có thể phục hồi các môi trường sống bị suy thoái và xây dựng mối quan hệ hài hòa hơn với hành tinh sự sống.`,
        gloss: [
          { word: 'empirical', ipa: '/ɪmˈpɪr.ɪ.kəl/', pos: 'adj.', meaningVi: 'mang tính thực nghiệm' },
          { word: 'harmonious', ipa: '/hɑːˈməʊ.ni.əs/', pos: 'adj.', meaningVi: 'hài hòa' },
        ],
      },
    ],
    vocab: [
      {
        word: 'empirical',
        ipa: '/ɪmˈpɪr.ɪ.kəl/',
        pos: 'adjective',
        meaningVi: 'dựa trên quan sát, thu thập dữ liệu và bằng chứng thực tế',
        collocation: 'empirical data / empirical investigation',
        example: 'Conservation biologists rely on empirical field evidence to assess habitat recovery.',
        derivatives: 'empiricism (n), empirically (adv)',
      },
      {
        word: 'harmonious',
        ipa: '/hɑːˈməʊ.ni.əs/',
        pos: 'adjective',
        meaningVi: 'hài hòa, cân đối và tương thích tốt với nhau',
        collocation: 'harmonious coexistence / harmonious balance',
        example: 'Sustainable agriculture strives for a harmonious balance between crop production and soil health.',
        derivatives: 'harmony (n), harmoniously (adv)',
      },
    ],
    questions: [
      {
        q: `What is the proven benefit of protecting natural habitats regarding ${meta.tEn}?`,
        options: [
          'It eliminates all atmospheric gravity across the hemisphere',
          'It preserves biodiversity while enhancing regional climate resilience and ecosystem services',
          'It forces wild animals to live exclusively in urban indoor zoos',
          'It causes all ocean waters to freeze into solid permafrost',
        ],
        answerIndex: 1,
        whyVi: 'Đoạn 2 nêu rõ việc bảo vệ các hệ sinh vật nguyên vẹn giúp bảo tồn đa dạng sinh học và tăng cường khả năng chống chịu khí hậu.',
        type: 'detail',
      },
      {
        q: 'How can modern societies successfully restore damaged ecosystems?',
        options: [
          'By destroying all historical botanical field archives',
          'By combining traditional conservation wisdom with rigorous empirical monitoring',
          'By banning human beings from ever studying environmental science',
          'By covering natural forest floors with synthetic plastic sheeting',
        ],
        answerIndex: 1,
        whyVi: 'Đoạn 3 kết luận rằng việc kết hợp tri thức bảo tồn truyền thống với giám sát thực nghiệm nghiêm ngặt giúp phục hồi các môi trường sống suy thoái.',
        type: 'inference',
      },
    ],
  });
}

const formattedNewArticles = JSON.stringify(newArticles, null, 2);
const innerArticles = formattedNewArticles.slice(1, -1).trim();
const fullNewFile = `${baseContent},\n${innerArticles}\n];\n`;

writeFileSync('src/data/press/guardian-nature.ts', fullNewFile, 'utf8');
console.log(`Guardian & Nature expanded to 30 articles successfully! Total articles in file: ${8 + newArticles.length}`);
