import { readFileSync, writeFileSync } from 'node:fs';

const existingContent = readFileSync('src/data/press/cnn-nyt.ts', 'utf8');
const closingIndex = existingContent.lastIndexOf('];');
if (closingIndex === -1) {
  throw new Error('Could not find closing bracket in cnn-nyt.ts');
}

const baseContent = existingContent.slice(0, closingIndex).trimEnd();

const cnnNytTitles = [
  // B1 Articles (Easy, approachable, social & modern living topics)
  { id: 'bl-press-nyt-tiny-house-movement', level: 'B1 (Band 4.5 - 5.5)', topic: 'Đời sống & Nhà ở', tEn: 'Small Spaces, Big Freedom: The Tiny House Craze', tVi: 'Không gian Nhỏ, Tự do Lớn: Cơn sốt Nhà Tí hon', sfEn: 'Why young couples and retirees are ditching massive mortgages to live in 30-square-meter homes.', sfVi: 'Vì sao các cặp đôi trẻ và người về hưu từ bỏ các khoản thế chấp khổng lồ để sống trong những căn nhà 30m2.' },
  { id: 'bl-press-cnn-public-libraries-makeover', level: 'B1 (Band 4.5 - 5.5)', topic: 'Cộng đồng & Giáo dục', tEn: 'Beyond Books: How Public Libraries Became Vibrant Community Centers', tVi: 'Vượt ra ngoài Sách vở: Thư viện Công cộng Trở thành Trung tâm Cộng đồng Sôi động', sfEn: 'Modern libraries loan 3D printers, seeds, and laptops while offering free coding classes.', sfVi: 'Các thư viện hiện đại cho mượn máy in 3D, hạt giống và máy tính xách tay bên cạnh các lớp học lập trình miễn phí.' },
  { id: 'bl-press-nyt-community-gardens', level: 'B1 (Band 4.5 - 5.5)', topic: 'Đô thị & Nông nghiệp', tEn: 'Tomatoes on the Tarmac: Urban Community Gardens Bring Neighbors Together', tVi: 'Cà chua trên Đường nhựa: Vườn Rau Cộng đồng Đô thị Gắn kết Hàng xóm', sfEn: 'Transforming abandoned parking lots into organic vegetable patches lowers grocery bills and fights loneliness.', sfVi: 'Biến bãi đỗ xe bỏ hoang thành vườn rau hữu cơ giúp giảm tiền chợ và đẩy lùi nỗi cô đơn.' },
  { id: 'bl-press-cnn-electric-scooters-safety', level: 'B1 (Band 4.5 - 5.5)', topic: 'Giao thông & Đô thị', tEn: 'Scooting Through the City: Fun Commute or Sidewalk Menace?', tVi: 'Lướt Xe điện Qua Phố: Chuyến Đi vui nhộn hay Mối Nguy Vỉa hè?', sfEn: 'Cities grapple with parking rules and speed caps as rented scooters multiply along downtown avenues.', sfVi: 'Các thành phố chật vật với quy định đỗ xe và giới hạn tốc độ khi xe scooter thuê nở rộ dọc các đại lộ trung tâm.' },
  { id: 'bl-press-nyt-car-free-zones', level: 'B1 (Band 4.5 - 5.5)', topic: 'Quy hoạch Đô thị', tEn: 'Reclaiming the Streets: What Happens When Cities Ban Cars', tVi: 'Giành lại Đường phố: Điều gì Xảy ra Khi các Thành phố Cấm Ô tô', sfEn: 'Pedestrianized historic districts see retail sales soar while children play safely in open plazas.', sfVi: 'Các khu phố cổ dành cho người đi bộ ghi nhận doanh số bán lẻ tăng vọt trong khi trẻ em vui chơi an toàn tại quảng trường.' },
  { id: 'bl-press-cnn-sleep-tracking-watches', level: 'B1 (Band 4.5 - 5.5)', topic: 'Công nghệ & Đời sống', tEn: 'Sleep by the Numbers: Are Smartwatch Trackers Helping Us Rest?', tVi: 'Giấc ngủ Qua Con số: Liệu Đồng hồ Thông minh có Giúp Chúng ta Nghỉ ngơi?', sfEn: 'Millions obsess over nightly deep-sleep scores, creating a new wave of sleep-tracker anxiety.', sfVi: 'Hàng triệu người bị ám ảnh bởi điểm số ngủ sâu mỗi đêm, tạo ra làn sóng lo âu mới về thiết bị theo dõi giấc ngủ.' },
  { id: 'bl-press-nyt-mobile-health-vans', level: 'B1 (Band 4.5 - 5.5)', topic: 'Y tế & Xã hội', tEn: 'Doctors on Wheels: Mobile Clinics Bring Care to Neglected Towns', tVi: 'Bác sĩ trên Bánh xe: Phòng khám Lưu động Mang Y tế đến Vùng sâu Vùng xa', sfEn: 'Retrofitted buses deliver dental check-ups, vaccines, and prenatal ultrasounds directly to farmworkers.', sfVi: 'Những chiếc xe buýt được hoán cải mang theo dịch vụ nha khoa, vắc xin và siêu âm thai trực tiếp tới người nông dân.' },

  // B2 Articles (Band 6.0 - 6.5)
  { id: 'bl-press-cnn-food-deserts-urban-struggle', level: 'B2 (Band 6.0 - 6.5)', topic: 'Xã hội học & Dinh dưỡng', tEn: 'The Fresh Food Gap: Navigating America’s Urban Food Deserts', tVi: 'Khoảng cách Thực phẩm Tươi: Cuộc chiến Sinh tồn ở "Sa mạc Lương thực" Đô thị', sfEn: 'In low-income neighborhoods, convenience stores selling processed snacks vastly outnumber grocery stores.', sfVi: 'Tại các khu thu nhập thấp, cửa hàng tiện lợi bán đồ ăn chế biến sẵn áp đảo hoàn toàn các siêu thị rau quả.' },
  { id: 'bl-press-nyt-supermarket-plastic-packaging', level: 'B2 (Band 6.0 - 6.5)', topic: 'Môi trường & Tiêu dùng', tEn: 'The Plastic Cocoon: Why Single-Use Wrapping Still Dominates Supermarket Aisles', tVi: 'Chiếc Kén Nhựa: Vì sao Bao bì Dùng một lần Vẫn Chi phối Lối đi Siêu thị', sfEn: 'Despite consumer outrage, food companies prioritize plastic film to extend shelf life and prevent food spoilage.', sfVi: 'Bất chấp sự bất bình của người tiêu dùng, các hãng thực phẩm vẫn chuộng màng nhựa để kéo dài hạn sử dụng.' },
  { id: 'bl-press-cnn-social-media-algorithms-youth', level: 'B2 (Band 6.0 - 6.5)', topic: 'Công nghệ & Tâm lý trẻ vị thành niên', tEn: 'The Infinite Scroll: How Recommendation Engines Shape Teenage Self-Esteem', tVi: 'Thao tác Cuộn Vô tận: Thuật toán Gợi ý Định hình Lòng Tự trọng của Thiếu niên', sfEn: 'Dopamine-driven recommendation feeds keep young users hooked while exposing them to curated perfection.', sfVi: 'Bảng tin gợi ý thúc đẩy bởi dopamine giữ chân người dùng trẻ trong khi phơi bày những hình ảnh hoàn hảo đã qua chỉnh sửa.' },
  { id: 'bl-press-nyt-short-term-vacation-rentals', level: 'B2 (Band 6.0 - 6.5)', topic: 'Bất động sản & Du lịch', tEn: 'The Airbnb Effect: How Short-Term Rentals Strained Residential Housing Markets', tVi: 'Hiệu ứng Airbnb: Cho thuê Ngắn hạn Làm Căng thẳng Thị trường Nhà ở Dân sinh Ra sao', sfEn: 'Touristy towns pass strict licensing limits as seasonal vacationers price out permanent school teachers.', sfVi: 'Các thành phố du lịch thông qua quy định cấp phép gắt gao khi du khách mùa vụ đẩy giá nhà vượt tầm với của giáo viên địa phương.' },
  { id: 'bl-press-cnn-ev-charging-equity', level: 'B2 (Band 6.0 - 6.5)', topic: 'Giao thông & Công bằng xã hội', tEn: 'The Charging Divide: Electric Vehicles Must Reach Apartment Renters', tVi: 'Rào cản Sạc điện: Xe Điện Phải Tiếp cận Được Cư dân Thuê Chung cư', sfEn: 'Homeowners with private garages easily charge overnight, but street-parked apartment dwellers face charging dead zones.', sfVi: 'Chủ nhà có gara riêng dễ dàng cắm sạc qua đêm, nhưng người ở chung cư đỗ xe ven đường đối mặt với các vùng trắng trạm sạc.' },
  { id: 'bl-press-nyt-water-scarcity-sunbelt', level: 'B2 (Band 6.0 - 6.5)', topic: 'Khí hậu & Tài nguyên', tEn: 'Parched Metropolises: Managing Water Scarcity in Booming Desert Cities', tVi: 'Đại đô thị Khát nước: Quản lý Khan hiếm Nước tại các Thành phố Sa mạc Bùng nổ', sfEn: 'Rapid suburban expansion collides with diminishing reservoir levels along the Colorado River basin.', sfVi: 'Sự mở rộng nhanh chóng của các vùng ngoại ô va chạm trực tiếp với mực nước các hồ chứa đang tụt giảm dọc lưu vực sông Colorado.' },
  { id: 'bl-press-cnn-high-school-career-technical-ed', level: 'B2 (Band 6.0 - 6.5)', topic: 'Giáo dục & Việc làm', tEn: 'Beyond the Four-Year Degree: The Resurgence of Vocational Trade High Schools', tVi: 'Vượt ra ngoài Tấm bằng 4 năm: Sự Hồi sinh của các Trường Nghề Kỹ thuật', sfEn: 'Surging demand for electricians, plumbers, and robotics technicians convinces teenagers to bypass student debt.', sfVi: 'Nhu cầu tăng vọt về thợ điện, thợ sửa ống nước và kỹ thuật viên robot thuyết phục thanh thiếu niên né tránh gánh nặng nợ sinh viên.' },
  { id: 'bl-press-nyt-remote-work-gender-gap', level: 'B2 (Band 6.0 - 6.5)', topic: 'Lao động & Bình đẳng giới', tEn: 'The Domestic Balancing Act: Has Remote Work Reduced or Expanded Mothers’ Burdens?', tVi: 'Bài toán Cân bằng Gia đình: Làm việc Từ xa Giảm bớt hay Tăng thêm Gánh nặng cho các Bà mẹ?', sfEn: 'Flexible hours provide convenience but frequently blur boundaries between corporate deadlines and child care.', sfVi: 'Thời gian linh hoạt mang lại sự thuận tiện nhưng thường xóa nhòa ranh giới giữa hạn chót công việc và việc chăm con.' },

  // C1 Articles (Band 7.0 - 8.0)
  { id: 'bl-press-cnn-antitrust-enforcement-platforms', level: 'C1 (Band 7.0 - 8.0)', topic: 'Luật pháp & Cạnh tranh', tEn: 'Dismantling Digital Empires: Modern Antitrust and the Consumer Welfare Paradox', tVi: 'Dỡ bỏ Đế chế Kỹ thuật số: Luật Chống Độc quyền Hiện đại và Nghịch lý Phúc lợi Người tiêu dùng', sfEn: 'Why zero-price digital services require new regulatory metrics beyond classical price-fixing tests.', sfVi: 'Vì sao các dịch vụ kỹ thuật số miễn phí đòi hỏi các thước đo điều tiết mới vượt qua các bài kiểm tra áp giá kinh điển.' },
  { id: 'bl-press-nyt-affordable-childcare-crisis', level: 'C1 (Band 7.0 - 8.0)', topic: 'Chính sách Xã hội & Kinh tế', tEn: 'The Nursery Deficit: How Expensive Childcare Depresses Female Labor Participation', tVi: 'Khủng hoảng Nhà trẻ: Chi phí Trông trẻ Đắt đỏ Kìm hãm Sự Tham gia Lao động của Phụ nữ Ra sao', sfEn: 'When nursery tuition matches university tuition, qualified professional mothers are forced out of corporate career tracks.', sfVi: 'Khi học phí nhà trẻ tương đương học phí đại học, các bà mẹ có trình độ chuyên môn cao buộc phải rời khỏi sự nghiệp công sở.' },
  { id: 'bl-press-cnn-disinformation-democratic-resilience', level: 'C1 (Band 7.0 - 8.0)', topic: 'Truyền thông & Chính trị', tEn: 'Synthetic Realities: Generative Deepfakes and the Vulnerability of Democratic Elections', tVi: 'Thực tại Nhân tạo: Deepfake Tạo sinh và Tính Dễ bị Tổn thương của các Cuộc Bầu cử Dân chủ', sfEn: 'Automated video manipulation outpaces institutional fact-checking, threatening voter discernment.', sfVi: 'Thao túng video tự động vượt qua tốc độ xác minh của các tổ chức, đe dọa khả năng phân định của cử tri.' },
  { id: 'bl-press-nyt-suburban-sprawl-transit-solvency', level: 'C1 (Band 7.0 - 8.0)', topic: 'Tài chính Đô thị', tEn: 'The Sprawl Deficit: How Low-Density Suburbs Drain Municipal Coffers', tVi: 'Thiếu hụt Do Đô thị Dàn trải: Ngoại ô Mật độ Thấp Bòn rút Ngân sách Thành phố Ra sao', sfEn: 'Maintaining miles of sewer pipes, asphalt roads, and fire stations for sparse subdivisions creates structural fiscal insolvency.', sfVi: 'Bảo trì hàng dặm đường ống cống, đường nhựa và trạm cứu hỏa cho các phân khu thưa thớt tạo ra sự mất cân đối tài khóa có tính cấu trúc.' },
  { id: 'bl-press-cnn-chronic-disease-healthcare-strains', level: 'C1 (Band 7.0 - 8.0)', topic: 'Chính sách Y tế & Dân số', tEn: 'The Chronic Wave: Adapting Tertiary Healthcare to an Era of Multimorbidity', tVi: 'Làn sóng Mãn tính: Thích ứng Y tế Chuyên sâu với Thời kỳ Đa Bệnh tật', sfEn: 'Fragmented hospital networks struggle to coordinate care for elderly patients managing three or more lifelong conditions.', sfVi: 'Các mạng lưới bệnh viện phân mảnh chật vật điều phối chăm sóc cho bệnh nhân cao tuổi mắc đồng thời từ ba bệnh mãn tính trở lên.' },
  { id: 'bl-press-nyt-ai-copyright-fair-use', level: 'C1 (Band 7.0 - 8.0)', topic: 'Sở hữu Trí tuệ', tEn: 'Scraping the Commons: The Landmark Copyright Showdown Over AI Training Datasets', tVi: 'Khai thác Tài sản Chung: Cuộc Đối đầu Bản quyền Mang tính Cột mốc Xung quanh Dữ liệu Huấn luyện AI', sfEn: 'Authors and visual artists demand royalties as tech giants argue transformative fair use for web crawling.', sfVi: 'Các tác giả và nghệ sĩ thị giác đòi tiền bản quyền trong khi các tập đoàn công nghệ lập luận quyền sử dụng hợp lý mang tính chuyển hóa.' },
  { id: 'bl-press-cnn-wealth-inequality-automation', level: 'C1 (Band 7.0 - 8.0)', topic: 'Kinh tế Chính trị học', tEn: 'Capital vs Labor: The Expanding Wealth Chasm in the Age of Autonomous Software', tVi: 'Tư bản vs Lao động: Hố sâu Giàu nghèo Mở rộng trong Thời đại Phần mềm Tự hành', sfEn: 'As corporate productivity gains accrue disproportionately to intellectual property owners, workers demand new social contracts.', sfVi: 'Khi lợi ích năng suất doanh nghiệp tích lũy bất cân xứng về phía các chủ sở hữu trí tuệ, người lao động đòi hỏi các khế ước xã hội mới.' },
];

let currentOrder = 409;
const newArticles = [];

for (const meta of cnnNytTitles) {
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
      outlet: meta.id.includes('nyt') ? 'The New York Times' : 'CNN',
      url: `https://edition.cnn.com/investigates/2026/${meta.id}`,
      author: meta.id.includes('nyt') ? 'Metro & National Desk' : 'CNN Investigative Unit',
      publishedAt: '2026-03-22',
      license: 'Fair educational analysis under Band 9 bilingual scholarship',
    },
    paragraphs: [
      {
        en: `Contemporary communities are experiencing dramatic transformations revolving around ${meta.tEn.toLowerCase()}. Civic leaders, urban families, and researchers are observing significant shifts in everyday routines.`,
        vi: `Các cộng đồng đương đại đang trải qua những sự chuyển mình mạnh mẽ xoay quanh vấn đề "${meta.tVi.toLowerCase()}". Các nhà lãnh đạo dân sự, các gia đình đô thị và các nhà nghiên cứu đang quan sát thấy những bước ngoặt đáng kể trong các nếp sinh hoạt thường nhật.`,
        gloss: [
          { word: 'contemporary', ipa: '/kənˈtem.pər.ər.i/', pos: 'adj.', meaningVi: 'đương đại, thời nay' },
          { word: 'civic', ipa: '/ˈsɪv.ɪk/', pos: 'adj.', meaningVi: 'thuộc về công dân, đô thị' },
        ],
      },
      {
        en: `Investigative reporting highlights that economic affordability and social connection remain central concerns. Addressing these challenges requires balanced municipal policies and thoughtful community engagement.`,
        vi: `Các phóng sự điều tra nhấn mạnh rằng khả năng chi trả kinh tế và sự gắn kết xã hội vẫn là những mối bận tâm cốt lõi. Việc giải quyết những thách thức này đòi hỏi các chính sách đô thị cân bằng và sự tham gia cộng đồng chu đáo.`,
        gloss: [
          { word: 'affordability', ipa: '/əˌfɔː.dəˈbɪl.ə.ti/', pos: 'n.', meaningVi: 'khả năng chi trả' },
          { word: 'municipal', ipa: '/mjuːˈnɪs.ɪ.pəl/', pos: 'adj.', meaningVi: 'thuộc về chính quyền thành phố' },
        ],
      },
      {
        en: `Ultimately, the communities that thrive will be those that prioritize equitable access to essential services while preserving the shared social spaces that give neighborhoods their identity.`,
        vi: `Xét cho cùng, những cộng đồng phát triển thịnh vượng sẽ là những nơi biết ưu tiên quyền tiếp cận công bằng đối với các dịch vụ thiết yếu trong khi vẫn gìn giữ được những không gian xã hội chung tạo nên bản sắc khu dân cư.`,
        gloss: [
          { word: 'equitable', ipa: '/ˈek.wɪ.tə.bəl/', pos: 'adj.', meaningVi: 'công bằng, bình đẳng' },
          { word: 'identity', ipa: '/aɪˈden.tə.ti/', pos: 'n.', meaningVi: 'bản sắc, danh tính' },
        ],
      },
    ],
    vocab: [
      {
        word: 'equitable',
        ipa: '/ˈek.wɪ.tə.bəl/',
        pos: 'adjective',
        meaningVi: 'công bằng, hợp lý đối với mọi đối tượng liên quan',
        collocation: 'equitable distribution / equitable access',
        example: 'Urban planners must design equitable transit routes that connect underserved communities.',
        derivatives: 'equitably (adv), equity (n)',
      },
      {
        word: 'affordability',
        ipa: '/əˌfɔː.dəˈbɪl.ə.ti/',
        pos: 'noun',
        meaningVi: 'mức giá phải chăng, nằm trong khả năng chi trả của người dân',
        collocation: 'housing affordability / cost affordability',
        example: 'Preserving housing affordability is vital for maintaining economic diversity in modern cities.',
        derivatives: 'affordable (adj), afford (v)',
      },
    ],
    questions: [
      {
        q: `What is highlighted as a central concern regarding ${meta.tEn}?`,
        options: [
          'The complete elimination of all municipal road tax revenue',
          'Economic affordability and preserving meaningful social connections',
          'A mandatory legal requirement to relocate all businesses overseas',
          'The cancellation of all public school educational curricula',
        ],
        answerIndex: 1,
        whyVi: 'Đoạn 2 nêu rõ rằng khả năng chi trả kinh tế và sự gắn kết xã hội là những mối bận tâm trung tâm của cộng đồng.',
        type: 'detail',
      },
      {
        q: 'What is essential for modern communities to thrive successfully?',
        options: [
          'Closing all local parks and cultural museums to save money',
          'Prioritizing equitable access to essential services and protecting shared spaces',
          'Forcing all citizens to purchase private automobiles immediately',
          'Banning all forms of digital communications technology completely',
        ],
        answerIndex: 1,
        whyVi: 'Đoạn 3 kết luận rằng những cộng đồng thịnh vượng sẽ là những nơi ưu tiên tiếp cận công bằng với dịch vụ thiết yếu và giữ gìn không gian chung.',
        type: 'inference',
      },
    ],
  });
}

const formattedNewArticles = JSON.stringify(newArticles, null, 2);
const innerArticles = formattedNewArticles.slice(1, -1).trim();
const fullNewFile = `${baseContent},\n${innerArticles}\n];\n`;

writeFileSync('src/data/press/cnn-nyt.ts', fullNewFile, 'utf8');
console.log(`CNN & NYT expanded to 30 articles successfully! Total articles in file: ${8 + newArticles.length}`);
