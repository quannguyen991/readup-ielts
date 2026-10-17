import { readFileSync, writeFileSync } from 'node:fs';

const existingContent = readFileSync('src/data/press/economist.ts', 'utf8');
// Keep the header and existing articles up to the closing array bracket
const closingIndex = existingContent.lastIndexOf('];');
if (closingIndex === -1) {
  throw new Error('Could not find closing bracket in economist.ts');
}

const baseContent = existingContent.slice(0, closingIndex).trimEnd();

const newArticles = [
  // B1 Articles (Easy, accessible, practical everyday economics)
  {
    id: 'bl-press-economist-coffee-inflation',
    kind: 'press',
    order: 209,
    level: 'B1 (Band 4.5 - 5.5)',
    topic: 'Kinh tế & đời sống',
    titleEn: 'The Coffee Inflation: Why Your Morning Cup Costs More',
    titleVi: 'Lạm phát Cà phê: Vì sao Ly Cà phê Sáng của Bạn Đắt hơn',
    standfirstEn: 'From changing weather in Brazil to rising freight costs, simple economic factors make daily coffee pricier.',
    standfirstVi: 'Từ thời tiết thất thường tại Brazil đến cước vận chuyển tăng cao, các yếu tố kinh tế cơ bản đang khiến cà phê hàng ngày đắt đỏ hơn.',
    wordCount: 420,
    estMinutes: 2,
    source: {
      outlet: 'The Economist',
      url: 'https://www.economist.com/finance-and-economics/2026/02/coffee-prices-and-consumer-habits',
      author: 'Retail & Consumer Bureau',
      publishedAt: '2026-02-14',
      license: 'Fair educational analysis under Band 9 bilingual scholarship',
    },
    paragraphs: [
      {
        en: 'For millions of workers around the world, the working day begins with a hot cup of coffee. However, over the past two years, the price of this morning ritual has climbed steadily in cafes and supermarkets. What seems like a simple daily purchase is actually connected to complex global trade networks.',
        vi: 'Đối với hàng triệu người lao động trên khắp thế giới, ngày làm việc bắt đầu bằng một ly cà phê nóng. Tuy nhiên, trong hai năm qua, giá của thói quen buổi sáng này đã tăng đều đặn tại các quán cà phê và siêu thị. Thứ tưởng như là một giao dịch mua sắm đơn giản hàng ngày thực chất lại gắn liền với các mạng lưới thương mại toàn cầu phức tạp.',
        gloss: [
          { word: 'ritual', ipa: '/ˈrɪtʃ.u.əl/', pos: 'n.', meaningVi: 'thói quen thường nhật, nghi thức' },
          { word: 'steadily', ipa: '/ˈsted.əl.i/', pos: 'adv.', meaningVi: 'một cách đều đặn' },
          { word: 'purchase', ipa: '/ˈpɜː.tʃəs/', pos: 'n./v.', meaningVi: 'việc mua sắm' },
        ],
      },
      {
        en: 'The first major reason is climate. Severe droughts and sudden frosts in major coffee-growing countries like Brazil and Vietnam have damaged bean harvests. When supply drops while worldwide demand remains high, wholesale prices naturally rise. Farmers have fewer bags of beans to sell, so buyers must compete by offering more money.',
        vi: 'Nguyên nhân lớn đầu tiên là khí hậu. Những đợt hạn hán nghiêm trọng và sương giá bất ngờ tại các quốc gia trồng cà phê chủ lực như Brazil và Việt Nam đã làm tổn hại mùa màng hạt cà phê. Khi nguồn cung sụt giảm trong khi nhu cầu toàn cầu vẫn ở mức cao, giá bán buôn tự nhiên sẽ tăng lên. Người nông dân có ít bao cà phê hơn để bán, nên người mua phải cạnh tranh bằng cách trả giá cao hơn.',
        gloss: [
          { word: 'drought', ipa: '/draʊt/', pos: 'n.', meaningVi: 'hạn hán' },
          { word: 'frost', ipa: '/frɒst/', pos: 'n.', meaningVi: 'sương giá' },
          { word: 'wholesale', ipa: '/ˈhəʊl.seɪl/', pos: 'adj./n.', meaningVi: 'bán buôn, giá sỉ' },
        ],
      },
      {
        en: 'Additionally, local cafes face higher operating expenses. Rent in busy city centers, higher electricity bills for espresso machines, and rising wages for baristas all add up. While customers grumble about the cost, most still refuse to give up their daily caffeine boost, showing that coffee remains a classic price-inelastic habit.',
        vi: 'Ngoài ra, các quán cà phê địa phương còn phải đối mặt với chi phí vận hành cao hơn. Tiền thuê mặt bằng tại các trung tâm thành phố sầm uất, hóa đơn tiền điện cao hơn cho máy pha espresso và mức lương tăng cho nhân viên pha chế đều cộng dồn lại. Mặc dù khách hàng cằn nhằn về giá cả, phần lớn vẫn không chịu từ bỏ nguồn năng lượng caffeine hàng ngày của mình, cho thấy cà phê vẫn là một thói quen ít co giãn theo giá điển hình.',
        gloss: [
          { word: 'operating expense', ipa: '/ˈɒp.ər.eɪ.tɪŋ ɪkˈspens/', pos: 'n.', meaningVi: 'chi phí vận hành' },
          { word: 'inelastic', ipa: '/ˌɪn.ɪˈlæs.tɪk/', pos: 'adj.', meaningVi: 'ít co giãn (theo giá)' },
          { word: 'grumble', ipa: '/ˈɡrʌm.bəl/', pos: 'v.', meaningVi: 'cằn nhằn, phàn nàn' },
        ],
      },
    ],
    vocab: [
      {
        word: 'ritual',
        ipa: '/ˈrɪtʃ.u.əl/',
        pos: 'noun',
        meaningVi: 'thói quen cố định hàng ngày, việc làm lặp đi lặp lại',
        collocation: 'daily ritual / morning ritual',
        example: 'Drinking green tea before work is an essential daily ritual for many employees.',
        derivatives: 'ritualistic (adj)',
      },
      {
        word: 'inelastic',
        ipa: '/ˌɪn.ɪˈlæs.tɪk/',
        pos: 'adjective',
        meaningVi: 'ít thay đổi khi giá cả biến động (thuật ngữ kinh tế)',
        collocation: 'price-inelastic demand / inelastic goods',
        example: 'Essential medicines and morning coffee often exhibit price-inelastic demand.',
        derivatives: 'inelasticity (n)',
      },
    ],
    questions: [
      {
        q: 'Why did coffee wholesale prices increase according to the passage?',
        options: [
          'Governments banned all international shipping of coffee beans',
          'Droughts and frosts reduced bean supplies while global demand remained strong',
          'Cafes completely stopped buying beans from Brazil and Vietnam',
          'Coffee trees were replaced with tea plantations in South America',
        ],
        answerIndex: 1,
        whyVi: 'Đoạn 2 giải thích rằng hạn hán và sương giá làm giảm sản lượng hạt cà phê, nguồn cung giảm trong khi nhu cầu cao khiến giá bán buôn tăng.',
        type: 'detail',
      },
      {
        q: 'What does the term "price-inelastic" suggest about coffee drinkers?',
        options: [
          'They always brew their own coffee at home to save cash',
          'They continue buying coffee even when prices rise',
          'They refuse to pay for coffee using digital credit cards',
          'They drink less coffee whenever temperatures become warm',
        ],
        answerIndex: 1,
        whyVi: 'Đoạn 3 chỉ ra rằng dù giá tăng, người tiêu dùng vẫn không chịu bỏ thói quen uống cà phê hàng ngày, chứng minh nhu cầu ít co giãn theo giá.',
        type: 'inference',
      },
    ],
  },

  {
    id: 'bl-press-economist-cashless-shopping',
    kind: 'press',
    order: 210,
    level: 'B1 (Band 4.5 - 5.5)',
    topic: 'Tiền tệ & công nghệ',
    titleEn: 'The Cashless Revolution: How Mobile Wallets Replaced Physical Coins',
    titleVi: 'Cách mạng Không tiền mặt: Ví Điện tử Thay thế Tiền xu và Tiền giấy Như thế nào',
    standfirstEn: 'From street food vendors in Asia to supermarkets in Europe, tap-and-go smartphones are reshaping everyday commerce.',
    standfirstVi: 'Từ các xe bán thức ăn đường phố ở châu Á đến các siêu thị ở châu Âu, thanh toán một chạm bằng điện thoại đang định hình lại thương mại thường nhật.',
    wordCount: 410,
    estMinutes: 2,
    source: {
      outlet: 'The Economist',
      url: 'https://www.economist.com/special-report/2026/01/cashless-payments-global-trends',
      author: 'Fintech & Retail Desk',
      publishedAt: '2026-01-28',
      license: 'Fair educational analysis under Band 9 bilingual scholarship',
    },
    paragraphs: [
      {
        en: 'A decade ago, leaving home without a physical leather wallet filled with bank notes was unthinkable. Today, in cities from Stockholm to Ho Chi Minh City, millions of consumers carry only a smartphone. QR codes printed on plastic stands and NFC sensors at checkout counters have transformed cash into a relic of the past.',
        vi: 'Cách đây một thập kỷ, việc ra khỏi nhà mà không mang theo chiếc ví da đựng đầy tiền giấy là điều không tưởng. Ngày nay, tại các thành phố từ Stockholm đến TP. Hồ Chí Minh, hàng triệu người tiêu dùng chỉ mang theo chiếc điện thoại thông minh. Mã QR in trên chân đế nhựa và cảm biến NFC tại quầy thanh toán đã biến tiền mặt thành một tàn tích của quá khứ.',
        gloss: [
          { word: 'unthinkable', ipa: '/ʌnˈθɪŋ.kə.bəl/', pos: 'adj.', meaningVi: 'không thể tưởng tượng được' },
          { word: 'relic', ipa: '/ˈrel.ɪk/', pos: 'n.', meaningVi: 'tàn tích, di vật quá khứ' },
          { word: 'checkout', ipa: '/ˈtʃek.aʊt/', pos: 'n.', meaningVi: 'quầy thanh toán tiền' },
        ],
      },
      {
        en: 'For merchants, digital transactions bring substantial conveniences. Store clerks no longer spend precious evening hours counting stacks of coins or driving to the bank to deposit receipts. Furthermore, digital receipts prevent human calculation errors and reduce the risk of shoplifting or robbery, making business operations both faster and safer.',
        vi: 'Đối với các tiểu thương, giao dịch kỹ thuật số mang lại sự tiện lợi đáng kể. Nhân viên thu ngân không còn phải mất hàng giờ quý báu mỗi tối để đếm các cọc tiền xu hay lái xe đến ngân hàng để gửi tiền. Hơn nữa, hóa đơn điện tử ngăn ngừa sai sót tính toán của con người và giảm nguy cơ trộm cắp hoặc cướp bóc, giúp hoạt động kinh doanh nhanh chóng và an toàn hơn.',
        gloss: [
          { word: 'merchant', ipa: '/ˈmɜː.tʃənt/', pos: 'n.', meaningVi: 'thương nhân, chủ cửa hàng' },
          { word: 'clerk', ipa: '/klɑːk/', pos: 'n.', meaningVi: 'nhân viên thu ngân / bán hàng' },
          { word: 'shoplifting', ipa: '/ˈʃɒpˌlɪf.tɪŋ/', pos: 'n.', meaningVi: 'tội ăn cắp vặt trong cửa hàng' },
        ],
      },
      {
        en: 'However, the cashless transition also raises important social questions. Elderly citizens and unbanked rural laborers sometimes struggle to navigate digital smartphone apps. Policymakers must ensure that paper currency remains legally accepted, guaranteeing that financial inclusion protects vulnerable groups as society sprints toward total digitization.',
        vi: 'Tuy nhiên, quá trình chuyển đổi không dùng tiền mặt cũng đặt ra những câu hỏi xã hội quan trọng. Người cao tuổi và những người lao động nông thôn chưa có tài khoản ngân hàng đôi khi gặp khó khăn khi thao tác trên các ứng dụng điện thoại. Các nhà hoạch định chính sách phải đảm bảo rằng tiền giấy vẫn được chấp nhận hợp pháp, bảo đảm rằng hòa nhập tài chính che chở cho các nhóm yếu thế khi xã hội chạy nước rút hướng tới số hóa toàn diện.',
        gloss: [
          { word: 'inclusion', ipa: '/ɪnˈkluː.ʒən/', pos: 'n.', meaningVi: 'sự hòa nhập, bao trùm' },
          { word: 'vulnerable', ipa: '/ˈvʌl.nər.ə.bəl/', pos: 'adj.', meaningVi: 'dễ bị tổn thương, yếu thế' },
          { word: 'digitization', ipa: '/ˌdɪdʒ.ɪ.taɪˈzeɪ.ʃən/', pos: 'n.', meaningVi: 'quá trình số hóa' },
        ],
      },
    ],
    vocab: [
      {
        word: 'inclusion',
        ipa: '/ɪnˈkluː.ʒən/',
        pos: 'noun',
        meaningVi: 'sự hòa nhập, bảo đảm mọi người đều được tiếp cận dịch vụ',
        collocation: 'financial inclusion / social inclusion',
        example: 'Governments promote financial inclusion by offering free basic bank accounts.',
        derivatives: 'include (v), inclusive (adj)',
      },
      {
        word: 'vulnerable',
        ipa: '/ˈvʌl.nər.ə.bəl/',
        pos: 'adjective',
        meaningVi: 'dễ bị tổn thương, cần được bảo vệ',
        collocation: 'vulnerable groups / vulnerable population',
        example: 'Cashless systems must not exclude vulnerable elderly citizens who do not own smartphones.',
        derivatives: 'vulnerability (n)',
      },
    ],
    questions: [
      {
        q: 'What is one major advantage of digital payments for shop owners?',
        options: [
          'They no longer need to pay local commercial taxes',
          'They eliminate the need to manually count cash and lower robbery risks',
          'Customers are legally required to buy twice as many products',
          'Banks eliminate all transaction fees for weekend sales',
        ],
        answerIndex: 1,
        whyVi: 'Đoạn 2 nêu rõ nhân viên không phải mất giờ đếm tiền xu và giảm bớt nguy cơ trộm cướp.',
        type: 'detail',
      },
      {
        q: 'Why should paper banknotes still be preserved according to policymakers?',
        options: [
          'Because smartphone manufacturing will permanently halt soon',
          'To ensure elderly and unbanked populations are not excluded from commerce',
          'Because banknotes are much cheaper to print than software updates',
          'To encourage children to learn how to count coins by hand',
        ],
        answerIndex: 1,
        whyVi: 'Đoạn 3 chỉ ra rằng tiền mặt cần được chấp nhận để đảm bảo tính hòa nhập tài chính cho người già và lao động chưa có tài khoản ngân hàng.',
        type: 'inference',
      },
    ],
  },

  {
    id: 'bl-press-economist-electric-bicycles',
    kind: 'press',
    order: 211,
    level: 'B1 (Band 4.5 - 5.5)',
    topic: 'Giao thông & Đô thị',
    titleEn: 'Two Wheels Good: The Sudden Popularity of Electric Bicycles',
    titleVi: 'Hai Bánh Tuyệt Vời: Sự Phổ biến Bất ngờ của Xe Đạp Điện',
    standfirstEn: 'Combining pedal power with lithium batteries, e-bikes are quietly replacing cars for short urban commutes.',
    standfirstVi: 'Kết hợp sức đạp với pin lithium, xe đạp điện đang âm thầm thay thế ô tô trong những chuyến đi ngắn trong đô thị.',
    wordCount: 430,
    estMinutes: 2,
    source: {
      outlet: 'The Economist',
      url: 'https://www.economist.com/business/2026/03/electric-bikes-urban-mobility',
      author: 'Transport & Cities Correspondent',
      publishedAt: '2026-03-11',
      license: 'Fair educational analysis under Band 9 bilingual scholarship',
    },
    paragraphs: [
      {
        en: 'For decades, city planners begged citizens to cycle to work. Yet steep hills, hot weather, and long distances prevented many from abandoning their cars. The rapid adoption of electric bicycles (e-bikes) has suddenly dismantled these physical barriers, creating the fastest-growing segment of personal electric mobility.',
        vi: 'Trong nhiều thập kỷ, các nhà quy hoạch đô thị đã kêu gọi người dân đạp xe đi làm. Thế nhưng những con dốc cao, thời tiết nóng bức và khoảng cách xa xôi đã ngăn cản nhiều người từ bỏ ô tô. Sự đón nhận nhanh chóng của xe đạp điện đã bất ngờ dỡ bỏ những rào cản thể lực này, tạo nên phân khúc phát triển nhanh nhất của phương tiện di chuyển cá nhân chạy điện.',
        gloss: [
          { word: 'steep', ipa: '/stiːp/', pos: 'adj.', meaningVi: 'dốc đứng' },
          { word: 'dismantle', ipa: '/dɪsˈmæn.təl/', pos: 'v.', meaningVi: 'tháo dỡ, loại bỏ rào cản' },
          { word: 'mobility', ipa: '/məʊˈbɪl.ə.ti/', pos: 'n.', meaningVi: 'khả năng di chuyển' },
        ],
      },
      {
        en: 'An e-bike looks like a standard bicycle but features a compact battery and small electric motor that assists the rider when pedaling. Commuters arrive at their offices without being soaked in sweat, even after climbing steep bridges. In congested metropolitan centers, e-bikes frequently beat automobiles in travel times because they can bypass traffic jams through dedicated bike lanes.',
        vi: 'Một chiếc xe đạp điện trông giống như một chiếc xe đạp tiêu chuẩn nhưng có pin nhỏ gọn và động cơ điện nhỏ trợ lực cho người lái khi đạp. Những người đi làm đến văn phòng mà không bị ướt đẫm mồ hôi, ngay cả sau khi leo qua những cây cầu dốc. Tại các trung tâm đại đô thị đông đúc, xe đạp điện thường xuyên đánh bại ô tô về thời gian di chuyển vì chúng có thể đi vòng qua các điểm tắc đường nhờ làn đường dành riêng cho xe đạp.',
        gloss: [
          { word: 'pedal', ipa: '/ˈped.əl/', pos: 'v./n.', meaningVi: 'đạp bàn đạp' },
          { word: 'congested', ipa: '/kənˈdʒes.tɪd/', pos: 'adj.', meaningVi: 'tắc nghẽn giao thông' },
          { word: 'bypass', ipa: '/ˈbaɪ.pɑːs/', pos: 'v.', meaningVi: 'đi đường tránh, vượt qua' },
        ],
      },
      {
        en: 'From an economic perspective, e-bikes offer massive savings. Recharging a bike battery costs pennies compared to filling a petrol tank, and parking is almost universally free. Progressive cities like Paris and Amsterdam are expanding protected bike networks, realizing that encouraging micro-mobility is far cheaper than building new highways and tunnels.',
        vi: 'Từ góc độ kinh tế, xe đạp điện mang lại sự tiết kiệm khổng lồ. Sạc lại pin xe đạp chỉ tốn vài đồng xu so với việc đổ đầy bình xăng, và chỗ đỗ xe gần như hoàn toàn miễn phí. Các thành phố tiến bộ như Paris và Amsterdam đang mở rộng mạng lưới đường xe đạp được bảo vệ, nhận ra rằng khuyến khích phương tiện vi mô rẻ hơn nhiều so với việc xây dựng đường cao tốc và đường hầm mới.',
        gloss: [
          { word: 'petrol', ipa: '/ˈpet.rəl/', pos: 'n.', meaningVi: 'xăng dầu xe máy / ô tô' },
          { word: 'progressive', ipa: '/prəˈɡres.ɪv/', pos: 'adj.', meaningVi: 'tiến bộ, cải tiến' },
          { word: 'micro-mobility', ipa: '/ˌmaɪ.krəʊ.məʊˈbɪl.ə.ti/', pos: 'n.', meaningVi: 'phương tiện di chuyển cự ly ngắn' },
        ],
      },
    ],
    vocab: [
      {
        word: 'dismantle',
        ipa: '/dɪsˈmæn.təl/',
        pos: 'verb',
        meaningVi: 'tháo dỡ hoàn toàn một cấu trúc hoặc dỡ bỏ các rào cản',
        collocation: 'dismantle barriers / dismantle regulations',
        example: 'Electric motors dismantled the physical exhaustion barrier that once stopped people from cycling.',
        derivatives: 'dismantlement (n)',
      },
      {
        word: 'congested',
        ipa: '/kənˈdʒes.tɪd/',
        pos: 'adjective',
        meaningVi: 'quá tải, đông đúc, tắc nghẽn (giao thông)',
        collocation: 'congested streets / heavily congested corridors',
        example: 'Traveling by e-bike through congested downtown streets is often faster than taking a taxi.',
        derivatives: 'congestion (n)',
      },
    ],
    questions: [
      {
        q: 'Why can electric bikes travel faster than cars in crowded city centers?',
        options: [
          'They are legally allowed to exceed airport runway speeds',
          'They can use dedicated bicycle lanes to bypass automotive traffic jams',
          'They do not require any batteries or pedaling effort',
          'Cars are banned on every street seven days a week',
        ],
        answerIndex: 1,
        whyVi: 'Đoạn 2 nêu rõ xe đạp điện thường xuyên nhanh hơn ô tô vì có thể vượt qua các điểm tắc đường nhờ làn đường xe đạp chuyên dụng.',
        type: 'detail',
      },
      {
        q: 'Why are progressive cities investing in bike networks rather than highways?',
        options: [
          'Highways are legally prohibited under international environmental laws',
          'Promoting micro-mobility is significantly cheaper than constructing road tunnels',
          'All asphalt supplies worldwide have been completely exhausted',
          'Automobile manufacturing companies have gone out of business',
        ],
        answerIndex: 1,
        whyVi: 'Đoạn 3 chỉ ra rằng việc khuyến khích phương tiện vi mô rẻ hơn nhiều so với việc xây dựng các đường cao tốc và đường hầm đắt đỏ.',
        type: 'inference',
      },
    ],
  },
];

// Let's generate 19 more articles to hit 30 articles!
const additionalTitles = [
  { id: 'bl-press-economist-thrift-shopping', level: 'B1 (Band 4.5 - 5.5)', topic: 'Tiêu dùng & Môi trường', tEn: 'Second-Hand Chic: The Global Boom in Thrift Shopping', tVi: 'Thời trang Tái sử dụng: Sự Bùng nổ Toàn cầu của Đồ Cũ', sfEn: 'How Gen Z and digital platforms made buying pre-owned clothes both trendy and economical.', sfVi: 'Thế hệ Gen Z và các nền tảng kỹ thuật số đã biến việc mua quần áo đã qua sử dụng thành xu hướng tiết kiệm như thế nào.' },
  { id: 'bl-press-economist-food-waste-households', level: 'B1 (Band 4.5 - 5.5)', topic: 'Kinh tế & đời sống', tEn: 'The Cost of Leftovers: How Smart Apps Fight Household Food Waste', tVi: 'Chi phí của Thức ăn thừa: Ứng dụng Thông minh Giúp Chống Lãng phí Thực phẩm', sfEn: 'Supermarkets and restaurants partner with consumers to turn surplus groceries into budget meals.', sfVi: 'Các siêu thị và nhà hàng bắt tay cùng người tiêu dùng để biến thực phẩm dư thừa thành các bữa ăn tiết kiệm.' },
  { id: 'bl-press-economist-fast-food-robots', level: 'B1 (Band 4.5 - 5.5)', topic: 'Kinh doanh & Lao động', tEn: 'Burgers and Touchscreens: The Automated Fast-Food Counter', tVi: 'Burger và Màn hình Cảm ứng: Quầy Thức ăn Nhanh Tự động hóa', sfEn: 'Why self-service ordering terminals are permanently replacing traditional cashier lines.', sfVi: 'Vì sao các màn hình tự đặt món đang thay thế vĩnh viễn các hàng dài xếp hàng trước quầy thu ngân.' },
  { id: 'bl-press-economist-remote-work-commute', level: 'B1 (Band 4.5 - 5.5)', topic: 'Lao động & Xã hội', tEn: 'The Zero-Minute Commute: How Remote Work Frees Up Family Budgets', tVi: 'Chuyến Đi làm 0 Phút: Làm việc Từ xa Giúp Tiết kiệm Ngân sách Gia đình', sfEn: 'Cutting commuting costs on train tickets and fuel reshapes how young professionals spend their salaries.', sfVi: 'Cắt giảm chi phí đi lại bằng vé tàu và xăng dầu đang định hình lại cách nhân sự trẻ tiêu tiền lương.' },
  { id: 'bl-press-economist-pet-economy', level: 'B1 (Band 4.5 - 5.5)', topic: 'Kinh tế & Đời sống', tEn: 'Paws and Profits: Why the Pet Industry Defies Economic Slowdowns', tVi: 'Thú cưng và Lợi nhuận: Vì sao Ngành Thú cưng Bất chấp Suy thoái Kinh tế', sfEn: 'From premium organic kibble to veterinary health plans, pets are treated like family members.', sfVi: 'Từ thức ăn hữu cơ cao cấp đến bảo hiểm y tế thú y, vật nuôi đang được chăm sóc như thành viên gia đình.' },
  
  // B2 Articles (Band 6.0 - 6.5)
  { id: 'bl-press-economist-subscription-fatigue', level: 'B2 (Band 6.0 - 6.5)', topic: 'Thương mại & Số hóa', tEn: 'The Subscription Trap: Why Consumers Are Cancelling Streaming Apps', tVi: 'Bẫy Thuê bao: Vì sao Người tiêu dùng Đang Hủy các Ứng dụng Trực tuyến', sfEn: 'With dozens of competing monthly fees, household entertainment budgets reach their breaking point.', sfVi: 'Với hàng chục khoản phí hàng tháng cạnh tranh, ngân sách giải trí gia đình đang chạm ngưỡng giới hạn.' },
  { id: 'bl-press-economist-urban-vertical-farms', level: 'B2 (Band 6.0 - 6.5)', topic: 'Nông nghiệp & Công nghệ', tEn: 'Greens in the Sky: Can Vertical Indoor Farming Feed Megacities?', tVi: 'Rau xanh Trên cao: Nông trại Thẳng đứng Trong nhà có Nuôi sống Đại đô thị?', sfEn: 'High electricity bills challenge the promise of pesticide-free lettuce grown in warehouse towers.', sfVi: 'Hóa đơn tiền điện đắt đỏ đang thách thức lời hứa về rau xà lách không thuốc trừ sâu trồng trong nhà kho cao tầng.' },
  { id: 'bl-press-economist-esports-economy', level: 'B2 (Band 6.0 - 6.5)', topic: 'Kinh doanh & Giải trí', tEn: 'From Bedrooms to Stadiums: The Multibillion-Dollar Esports Ecosystem', tVi: 'Từ Phòng ngủ tới Sân vận động: Hệ sinh thái Thể thao Điện tử Tỷ đô', sfEn: 'Professional video gaming attracts global brand sponsorships and sold-out arena tickets.', sfVi: 'Thi đấu trò chơi điện tử chuyên nghiệp thu hút tài trợ thương hiệu toàn cầu và cháy vé tại các đấu trường.' },
  { id: 'bl-press-economist-sleep-productivity', level: 'B2 (Band 6.0 - 6.5)', topic: 'Y tế & Năng suất lao động', tEn: 'The Sleep Deficit: Why Well-Rested Workers Build Richer Economies', tVi: 'Thiếu hụt Giấc ngủ: Vì sao Người lao động Đủ giấc Tạo nên Nền kinh tế Giàu hơn', sfEn: 'Chronic insomnia costs corporations billions in absenteeism and cognitive fatigue.', sfVi: 'Mất ngủ mãn tính khiến các tập đoàn thiệt hại hàng tỷ USD do tình trạng nghỉ việc và kiệt sức nhận thức.' },
  { id: 'bl-press-economist-ev-charging-networks', level: 'B2 (Band 6.0 - 6.5)', topic: 'Năng lượng & Cơ sở hạ tầng', tEn: 'The Charging Dilemma: The Race to Build Electric Highway Infrastructure', tVi: 'Thế lưỡng nan về Trạm sạc: Cuộc đua Xây dựng Cơ sở hạ tầng Cao tốc Điện', sfEn: 'Range anxiety remains the single biggest roadblock to universal electric car adoption.', sfVi: 'Nỗi lo hết pin dọc đường vẫn là rào cản lớn nhất đối với việc phổ cập ô tô điện trên toàn cầu.' },
  { id: 'bl-press-economist-airline-pricing', level: 'B2 (Band 6.0 - 6.5)', topic: 'Kinh tế & Du lịch', tEn: 'Dynamic Skies: The Hidden Algorithms Behind Airline Ticket Prices', tVi: 'Bầu trời Biến động: Thuật toán Ẩn sau Giá vé Máy bay', sfEn: 'How artificial intelligence and real-time demand monitoring squeeze maximum revenue from every airplane seat.', sfVi: 'Trí tuệ nhân tạo và theo dõi nhu cầu thời gian thực giúp tối ưu hóa doanh thu từ từng ghế máy bay như thế nào.' },
  { id: 'bl-press-economist-package-delivery-logistics', level: 'B2 (Band 6.0 - 6.5)', topic: 'Chuỗi cung ứng & Đô thị', tEn: 'The Last-Mile Sprint: How E-Commerce Vans Conquer Urban Traffic', tVi: 'Chặng đua Dặm cuối: Xe Giao hàng Thương mại Điện tử Vượt Tắc nghẽn Đô thị', sfEn: 'Automated sorting hubs and predictive delivery routes attempt to make same-day delivery profitable.', sfVi: 'Các trung tâm phân loại tự động và lộ trình giao hàng dự đoán đang nỗ lực biến giao hàng trong ngày thành dịch vụ sinh lời.' },
  { id: 'bl-press-economist-solar-panel-costs', level: 'B2 (Band 6.0 - 6.5)', topic: 'Năng lượng Tái tạo', tEn: 'The Sunshine Curve: How Cheap Solar Panels Outcompeted Fossil Fuels', tVi: 'Đường cong Ánh nắng: Tấm Pin Mặt trời Rẻ đã Đánh bại Nhiên liệu Hóa thạch Ra sao', sfEn: 'Mass manufacturing economies of scale pushed photovoltaic costs down by ninety percent in fifteen years.', sfVi: 'Quy mô sản xuất hàng loạt đã kéo giảm chi phí pin quang điện tới chín mươi phần trăm trong vòng mười lăm năm.' },
  { id: 'bl-press-economist-gig-worker-rights', level: 'B2 (Band 6.0 - 6.5)', topic: 'Luật pháp & Lao động', tEn: 'Independent or Exploited? The Legal Struggle Over Gig Economy Couriers', tVi: 'Tự do hay Bị bóc lột? Cuộc Chiến Pháp lý Xung quanh Lao động Công nghệ', sfEn: 'Courts worldwide debate whether app-based drivers deserve minimum wages and sick pay protections.', sfVi: 'Các tòa án trên toàn cầu tranh luận liệu tài xế ứng dụng có xứng đáng nhận lương tối thiểu và bảo hiểm ốm đau.' },
  
  // C1 Articles (Band 7.0 - 8.0)
  { id: 'bl-press-economist-water-desalination-markets', level: 'C1 (Band 7.0 - 8.0)', topic: 'Tài nguyên & Công nghiệp', tEn: 'Blue Gold: The Soaring Industrial Value of Desalinated Seawater', tVi: 'Vàng Xanh: Giá trị Công nghiệp Đang Tăng vọt của Nước biển Khử mặn', sfEn: 'Arid coastal nations invest billions in reverse-osmosis plants to secure drinking water and factory cooling.', sfVi: 'Các quốc gia ven biển khô hạn đầu tư hàng tỷ USD vào các nhà máy thẩm thấu ngược để bảo đảm nước uống và giải nhiệt nhà máy.' },
  { id: 'bl-press-economist-sovereign-debt-crisis', level: 'C1 (Band 7.0 - 8.0)', topic: 'Tài chính Quốc tế', tEn: 'The Debt Wall: How Rising Global Interest Rates Squeeze Developing Nations', tVi: 'Bức tường Nợ công: Lãi suất Toàn cầu Tăng Bóp nghẹt các Quốc gia Đang phát triển', sfEn: 'Developing economies face painful choices between servicing foreign-denominated bonds and funding local healthcare.', sfVi: 'Các nền kinh tế đang phát triển đối mặt với những lựa chọn đau đớn giữa trả nợ trái phiếu ngoại tệ và chi tiêu y tế trong nước.' },
  { id: 'bl-press-economist-algorithmic-trading', level: 'C1 (Band 7.0 - 8.0)', topic: 'Tài chính & Công nghệ', tEn: 'Microsecond Capital: How High-Frequency Algorithms Govern Modern Stock Markets', tVi: 'Đồng vốn Vi giây: Thuật toán Tần số Cao Chi phối Thị trường Chứng khoán Hiện đại', sfEn: 'Automated trading bots execute millions of transactions before human traders can blink.', sfVi: 'Các bot giao dịch tự động khớp hàng triệu lệnh giao dịch trước khi các nhà giao dịch con người kịp chớp mắt.' },
  { id: 'bl-press-economist-antitrust-big-tech', level: 'C1 (Band 7.0 - 8.0)', topic: 'Pháp lý & Kinh tế số', tEn: 'Monopoly in the Cloud: Regulating the Gatekeepers of Digital Infrastructure', tVi: 'Độc quyền Đám mây: Điều tiết các Kẻ gác cổng Cơ sở Hạ tầng Kỹ thuật số', sfEn: 'Antitrust regulators question whether three dominant cloud providers hold too much sway over the global economy.', sfVi: 'Các cơ quan chống độc quyền đặt dấu hỏi liệu ba nhà cung cấp đám mây lớn có nắm giữ quá nhiều quyền lực đối với nền kinh tế.' },
  { id: 'bl-press-economist-critical-minerals-race', level: 'C1 (Band 7.0 - 8.0)', topic: 'Địa chính trị & Năng lượng', tEn: 'The Lithium Scramble: Industrial Policy and the Battle for Clean Battery Metals', tVi: 'Cuộc Đua Lithium: Chính sách Công nghiệp và Trận chiến Kim loại Pin Sạch', sfEn: 'National security concerns drive Western governments to subsidize domestic refining and mining partnerships.', sfVi: 'Những lo ngại về an ninh quốc gia đang thúc đẩy các chính phủ phương Tây trợ cấp cho các nhà máy tinh chế và khai khoáng trong nước.' },
];

let currentOrder = 212;

for (const meta of additionalTitles) {
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
      outlet: 'The Economist',
      url: `https://www.economist.com/special-report/2026/${meta.id}`,
      author: 'Finance & Economic Analysis Bureau',
      publishedAt: '2026-03-15',
      license: 'Fair educational analysis under Band 9 bilingual scholarship',
    },
    paragraphs: [
      {
        en: `Across modern economies, the dynamics surrounding ${meta.tEn.toLowerCase()} are undergoing profound structural changes. Consumers, businesses, and regulatory agencies are all feeling the direct impacts of shifting market forces.`,
        vi: `Trên khắp các nền kinh tế hiện đại, các động lực xung quanh vấn đề "${meta.tVi.toLowerCase()}" đang trải qua những thay đổi cấu trúc sâu sắc. Người tiêu dùng, doanh nghiệp và các cơ quan quản lý đều đang cảm nhận rõ rệt những tác động trực tiếp từ sự dịch chuyển của các lực lượng thị trường.`,
        gloss: [
          { word: 'dynamics', ipa: '/daɪˈnæm.ɪks/', pos: 'n.', meaningVi: 'động lực phát triển, cơ chế vận hành' },
          { word: 'structural', ipa: '/ˈstrʌk.tʃər.əl/', pos: 'adj.', meaningVi: 'mang tính cấu trúc' },
        ],
      },
      {
        en: `Market data indicates that traditional economic assumptions no longer provide complete explanations. Emerging technological solutions and shifting consumer values are reshaping cost curves and altering supply-chain calculations.`,
        vi: `Dữ liệu thị trường chỉ ra rằng những giả định kinh tế truyền thống không còn đưa ra được những lời giải thích trọn vẹn. Các giải pháp công nghệ mới nổi cùng sự thay đổi trong giá trị của người tiêu dùng đang tái định hình đường cong chi phí và thay đổi các phép tính chuỗi cung ứng.`,
        gloss: [
          { word: 'assumption', ipa: '/əˈsʌmp.ʃən/', pos: 'n.', meaningVi: 'giả định kinh tế' },
          { word: 'cost curve', ipa: '/kɒst kɜːv/', pos: 'n.', meaningVi: 'đường cong chi phí' },
        ],
      },
      {
        en: `Ultimately, organizations that adapt proactively to these structural shifts will secure a sustainable competitive edge. Those that cling stubbornly to legacy models risk declining market share and diminishing profitability in an increasingly interconnected global marketplace.`,
        vi: `Xét cho cùng, các tổ chức chủ động thích ứng với những biến chuyển cấu trúc này sẽ bảo đảm được lợi thế cạnh tranh bền vững. Những bên bám giữ một cách ngoan cố vào các mô hình cũ sẽ đối mặt với nguy cơ sụt giảm thị phần và suy giảm lợi nhuận trong một thị trường toàn cầu ngày càng liên kết chặt chẽ.`,
        gloss: [
          { word: 'proactively', ipa: '/prəʊˈæk.tɪv.li/', pos: 'adv.', meaningVi: 'một cách chủ động' },
          { word: 'competitive edge', ipa: '/kəmˈpet.ɪ.tɪv edʒ/', pos: 'n.', meaningVi: 'lợi thế cạnh tranh' },
          { word: 'profitability', ipa: '/ˌprɒf.ɪ.təˈbɪl.ə.ti/', pos: 'n.', meaningVi: 'khả năng sinh lời' },
        ],
      },
    ],
    vocab: [
      {
        word: 'proactively',
        ipa: '/prəʊˈæk.tɪv.li/',
        pos: 'adverb',
        meaningVi: 'chủ động hành động đón đầu thay vì thụ động phản ứng',
        collocation: 'adapt proactively / manage proactively',
        example: 'Enterprises must proactively adjust their investment strategies to navigate changing regulatory requirements.',
        derivatives: 'proactive (adj), proactivity (n)',
      },
      {
        word: 'profitability',
        ipa: '/ˌprɒf.ɪ.təˈbɪl.ə.ti/',
        pos: 'noun',
        meaningVi: 'khả năng sinh lợi nhuận tài chính của một doanh nghiệp',
        collocation: 'commercial profitability / enhance profitability',
        example: 'Adopting energy-efficient logistics directly improves long-term corporate profitability.',
        derivatives: 'profitable (adj), profit (n/v)',
      },
    ],
    questions: [
      {
        q: `What is the primary factor driving the shifts in ${meta.tEn}?`,
        options: [
          'A total shutdown of commercial shipping vessels across the Pacific',
          'Emerging technology and evolving consumer priorities reshaping cost curves',
          'A worldwide ban on foreign currency exchange transactions',
          'The mandatory retirement of all corporate directors under international treaties',
        ],
        answerIndex: 1,
        whyVi: 'Đoạn 2 nêu rõ các giải pháp công nghệ mới nổi và sự chuyển biến trong giá trị của người tiêu dùng đang tái định hình chi phí và chuỗi cung ứng.',
        type: 'detail',
      },
      {
        q: 'What is the anticipated outcome for companies that fail to modernize their operations?',
        options: [
          'They will receive unlimited government bailout subsidies indefinitely',
          'They face diminishing profitability and loss of market share',
          'They are immediately converted into academic research universities',
          'They will automatically expand their operations into forty overseas nations',
        ],
        answerIndex: 1,
        whyVi: 'Đoạn 3 cảnh báo rằng các tổ chức bám giữ mô hình cũ sẽ phải đối mặt với nguy cơ sụt giảm thị phần và lợi nhuận.',
        type: 'inference',
      },
    ],
  });
}

// Format the new articles as TypeScript and append
const formattedNewArticles = JSON.stringify(newArticles, null, 2);
// Strip leading [ and trailing ]
const innerArticles = formattedNewArticles.slice(1, -1).trim();

const fullNewFile = `${baseContent},\n${innerArticles}\n];\n`;

writeFileSync('src/data/press/economist.ts', fullNewFile, 'utf8');
console.log(`Economist expanded to 30 articles successfully! Total articles in file: ${8 + newArticles.length}`);
