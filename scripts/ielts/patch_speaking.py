from pathlib import Path

path = Path('src/data/speaking-forecast.ts')
content = path.read_text(encoding='utf-8')

entries = '''  // ==========================================
  // PART 1 - THỜI TIẾT & BIẾN ĐỔI KHÍ HẬU
  // ==========================================
  {
    id: 'fc-p1-climate-awareness',
    topic: 'Climate Awareness & Daily Weather',
    topicVi: 'Nhận thức khí hậu & Thời tiết hàng ngày',
    quarter: 'Q3-2026',
    isForecastNew: true,
    part: 1,
    question: 'How do extreme weather conditions affect your daily travel routines?',
    sampleAnswer:
      "Sudden tropical downpours or blistering heatwaves inevitably disrupt public transit timetables in my city. When torrential rains flood low-lying arterial roads, I routinely factor in an extra forty minutes for my morning commute. Furthermore, adverse weather forces commuters to abandon two-wheeled transport in favor of buses, creating severe congestion at key transit hubs.",
    sampleAnswerVi:
      "Những cơn mưa rào nhiệt đới bất chợt hay đợt nắng nóng gay gắt chắc chắn sẽ làm xáo trộn lịch trình giao thông công cộng ở thành phố của tôi. Khi mưa xối xả làm ngập các tuyến đường huyết mạch vùng trũng, tôi luôn phải cộng thêm bốn mươi phút cho chặng đường đi làm buổi sáng. Hơn nữa, thời tiết khắc nghiệt buộc người dân phải chuyển từ xe hai bánh sang xe buýt, gây ùn tắc nghiêm trọng tại các điểm trung chuyển chính.",
    targetBand: 8.5,
    collocationsAndIdioms: [
      'blistering heatwaves',
      'torrential rains',
      'arterial roads',
      'factor in an extra forty minutes',
      'transit hubs'
    ],
    keyVocabulary: [
      { word: 'blistering', ipa: '/ˈblɪs.tər.ɪŋ/', meaningVi: 'nóng như thiêu như đốt' },
      { word: 'arterial', ipa: '/ɑːˈtɪə.ri.əl/', meaningVi: 'huyết mạch, trục chính' },
      { word: 'adverse', ipa: '/ˈæd.vɜːs/', meaningVi: 'bất lợi, khắc nghiệt' }
    ],
    grammarNotes: ['Cấu trúc mệnh đề phân từ: "creating severe congestion at key transit hubs"']
  },
  // ==========================================
  // PART 2 - LÀNG NGHỀ TRUYỀN THỐNG
  // ==========================================
  {
    id: 'fc-p2-craft-village',
    topic: 'Traditional Craft Village',
    topicVi: 'Làng nghề thủ công truyền thống',
    quarter: 'Q3-2026',
    isForecastNew: true,
    part: 2,
    question: 'Describe a traditional craft village or artisan workshop that you visited.',
    cueBullets: [
      'Where this village is located and when you visited it',
      'What traditional craft or heritage art is practiced there',
      'What you saw during your visit',
      'And explain how you felt about the preservation of this traditional craft'
    ],
    sampleAnswer:
      "I would like to describe Bat Trang ceramic village, an ancient artisanal enclave situated along the banks of the Red River on the outskirts of Hanoi. I had the privilege of visiting this historic hub last autumn during a weekend excursion.\\n\\nBat Trang boasts over seven centuries of continuous pottery craftsmanship. As soon as you enter the labyrinthine alleys, you are greeted by the earthy scent of drying clay and the ambient heat radiating from traditional gas kilns. During my visit, I observed master artisans skillfully shaping delicate celadon vases on rotating potter's wheels, demonstrating an instinctive precision honed over decades of practice.\\n\\nVisitors are also invited to participate in hands-on workshops. I spent over two hours attempting to throw a ceramic bowl, which gave me an immense appreciation for the physical discipline and dexterity required in this art form.\\n\\nReflecting upon the experience, I felt a profound sense of respect mixed with cautious optimism. While mass-produced commercial ceramics have undercut market prices, the younger generation of Bat Trang potters is ingeniously blending minimalist contemporary aesthetics with ancestral glazing formulas, proving that intangible cultural heritage can flourish dynamically in modern commerce.",
    sampleAnswerVi:
      "Tôi muốn kể về làng gốm Bát Tràng, một làng nghề thủ công cổ kính tọa lạc bên bờ sông Hồng ở ngoại ô Hà Nội. Tôi có dịp đến thăm trung tâm lịch sử này vào mùa thu năm ngoái trong một chuyến dã ngoại cuối tuần.\\n\\nBát Tràng có bề dày hơn bảy thế kỷ chế tác đồ gốm. Ngay khi bước vào những con ngõ uốn lượn, bạn sẽ cảm nhận được mùi đất sét phơi nồng nàn và hơi nóng lan tỏa từ các lò nung. Trong chuyến thăm, tôi đã tận mắt chứng kiến các nghệ nhân bậc thầy khéo léo tạo hình những chiếc bình ngọc bích tinh xảo trên bàn xoay, thể hiện sự chính xác bản năng được tôi luyện qua hàng thập kỷ thực hành.\\n\\nDu khách cũng được trải nghiệm tự tay vuốt gốm. Tôi đã dành hơn hai giờ để nặn một chiếc bát nhỏ, và trải nghiệm đó giúp tôi càng khâm phục sự tỉ mỉ và đôi bàn tay tài hoa của các nghệ nhân.\\n\\nNhìn lại chuyến đi, tôi cảm thấy một niềm tôn kính sâu sắc xen lẫn niềm lạc quan. Dù gốm công nghiệp sản xuất hàng loạt cạnh tranh gay gắt về giá, thế hệ thợ gốm trẻ ở Bát Tràng đang khéo léo kết hợp thẩm mỹ tối giản hiện đại với các bài men gia truyền, chứng minh rằng di sản văn hóa phi vật thể hoàn toàn có thể phát triển rực rỡ trong nền kinh tế đương đại.",
    targetBand: 9.0,
    collocationsAndIdioms: [
      'artisanal enclave',
      'labyrinthine alleys',
      'instinctive precision honed over decades',
      'immense appreciation for',
      'profound sense of respect',
      'cautious optimism',
      'intangible cultural heritage'
    ],
    keyVocabulary: [
      { word: 'enclave', ipa: '/ˈen.kleɪv/', meaningVi: 'vùng đất đặc trưng, quần thể riêng biệt' },
      { word: 'labyrinthine', ipa: '/ˌlæb.əˈrɪn.θaɪn/', meaningVi: 'như mê cung, chằng chịt' },
      { word: 'dexterity', ipa: '/dekˈster.ə.ti/', meaningVi: 'sự khéo léo, tài hoa của bàn tay' },
      { word: 'intangible', ipa: '/ɪnˈtæn.dʒə.bəl/', meaningVi: 'phi vật thể' }
    ],
    grammarNotes: [
      'Sử dụng mệnh đề phân từ: "ingeniously blending minimalist contemporary aesthetics with ancestral glazing formulas"',
      'Cấu trúc tương phản: "While mass-produced commercial ceramics have undercut market prices, the younger generation..."'
    ]
  },
  // ==========================================
  // PART 3 - BẢO TỒN VĂN HÓA TRONG THỜI KỲ CÔNG NGHỆ
  // ==========================================
  {
    id: 'fc-p3-cultural-preservation-tech',
    topic: 'Preserving Heritage in the Digital Age',
    topicVi: 'Bảo tồn di sản trong thời đại số',
    quarter: 'Q3-2026',
    isForecastNew: true,
    part: 3,
    question: 'How can digital technologies assist in preserving endangered cultural traditions?',
    sampleAnswer:
      "Digital technologies serve as a transformative catalyst for cultural safeguarding. High-resolution three-dimensional photogrammetry and virtual reality simulations allow fragile historical monuments to be permanently archived and made globally accessible, irrespective of physical geographic constraints. Furthermore, interactive digital repositories enable indigenous linguistic records and oral folk traditions to be transcribed, analyzed, and passed down to younger digital-native demographics without succumbing to the erosion of time.",
    sampleAnswerVi:
      "Công nghệ số đóng vai trò như chất xúc tác mang tính cách mạng cho việc bảo vệ văn hóa. Kỹ thuật đo ảnh 3D độ phân giải cao và mô phỏng thực tế ảo cho phép các di tích lịch sử mong manh được lưu trữ vĩnh viễn và tiếp cận trên toàn cầu, bất kể rào cản địa lý. Hơn nữa, các kho dữ liệu số tương tác giúp các bản ghi ngôn ngữ bản địa và truyền thống truyền khẩu dân gian được ghi chép, phân tích và truyền dạy cho thế hệ trẻ sinh ra trong thời đại số mà không bị mai một theo năm tháng.",
    targetBand: 8.5,
    collocationsAndIdioms: [
      'transformative catalyst',
      'cultural safeguarding',
      'virtual reality simulations',
      'indigenous linguistic records',
      'digital-native demographics',
      'erosion of time'
    ],
    keyVocabulary: [
      { word: 'catalyst', ipa: '/ˈkæt.əl.ɪst/', meaningVi: 'chất xúc tác' },
      { word: 'photogrammetry', ipa: '/ˌfəʊ.təʊˈɡræm.ə.tri/', meaningVi: 'kỹ thuật đo ảnh 3D' },
      { word: 'erosion', ipa: '/ɪˈrəʊ.ʒən/', meaningVi: 'sự xói mòn, mai một' }
    ],
    grammarNotes: ['Sử dụng cụm từ học thuật nâng cao: "transformative catalyst for cultural safeguarding"']
  },
'''

if 'fc-p1-climate-awareness' not in content:
    target = 'export const SPEAKING_FORECAST: SpeakingSample[] = ['
    content = content.replace(target, target + '\n' + entries, 1)
    path.write_text(content, encoding='utf-8')
    print('Updated speaking-forecast.ts!')
else:
    print('Already present!')
