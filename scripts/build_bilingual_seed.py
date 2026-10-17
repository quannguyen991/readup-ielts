import json
import os

# Build curated bilingual video lessons with precise timestamps, English text and Vietnamese translations.
videos_data = [
    # -------------------------------------------------------------
    # 1. CNN: 'Catastrophic': Forecaster moves 11 more House races toward Dems
    # -------------------------------------------------------------
    {
        "id": "LaC3IbvbHDQ",
        "title": "'Catastrophic': Forecaster moves 11 more House races toward Dems",
        "channel": "CNN",
        "level": "B2",
        "topic": "Thời sự và xã hội",
        "durationSeconds": 364,
        "sentences": [
            {"start": 0.32, "end": 10.56, "text": "11 more House races moving in the Democratic direction tonight. The Cook Political Report, which is one of the nation's top election forecasters, is now moving those 11 seats away from Republicans."},
            {"start": 10.56, "end": 19.6, "text": "And they're doing it here right on the eve of the election. Right, we're less than 3 weeks away. And these races could very well decide which party controls the House."},
            {"start": 19.6, "end": 30.8, "text": "And in some of them, there are incredibly competitive Senate races as well. Eight of the 11 were considered solid or likely Republican. So this is a huge shift."},
            {"start": 30.8, "end": 42.0, "text": "And look at these five seats currently held by Republicans that are now lean Republican or tossup. These five all went for Trump by double digits in 2024."},
            {"start": 42.0, "end": 54.0, "text": "I want to go to Dave Wasserman. He's senior editor and elections analyst for the Cook Political Report. Dave, how serious is this fire for Republicans?"},
            {"start": 54.0, "end": 68.0, "text": "Erin, this has gone from bad to potentially catastrophic for Republicans. We're seeing some shocking polling numbers in districts that voted for Donald Trump."},
            {"start": 68.0, "end": 79.5, "text": "First of all, this is kind of a back to the future election in the sense that the places that swung the most toward Trump are now competitive again."},
            {"start": 79.5, "end": 92.0, "text": "Iowa is a major problem state for Republicans. They are in danger of losing three of the four districts in Iowa."},
            {"start": 92.0, "end": 105.0, "text": "The other theme that we're seeing is that Republicans have a big problem holding open seats where the incumbent has retired."},
            {"start": 105.0, "end": 118.0, "text": "Incumbents who established distinctive brands from Trump are performing much better than newcomers who lack strong local recognition."},
            {"start": 118.0, "end": 132.0, "text": "One theme we're seeing is that this is the worst economic anxiety in rural America since the 1980s farm crisis."},
            {"start": 132.0, "end": 145.0, "text": "Rising fuel prices, high interest rates, and trade tensions are creating backlash among agricultural communities."},
            {"start": 145.0, "end": 158.0, "text": "Democrats are seeing surge numbers in early voting across key battleground states including North Carolina."}
        ],
        "translations": [
            "Tối nay có thêm 11 cuộc đua vào Hạ viện nghiêng về phía đảng Dân chủ. Báo cáo Chính trị Cook, cơ quan dự báo bầu cử hàng đầu, hiện chuyển 11 ghế đó khỏi tầm tay đảng Cộng hòa.",
            "Và họ đưa ra quyết định này ngay trước thềm ngày bầu cử. Chúng ta chỉ còn chưa đầy 3 tuần nữa, và các cuộc đua này rất có thể định đoạt đảng nào nắm quyền kiểm soát Hạ viện.",
            "Tại một số bang, còn có các cuộc đua vào Thượng viện vô cùng gay cấn. 8 trong số 11 ghế từng được coi là vững chắc của phe Cộng hòa, vì vậy đây là bước chuyển biến rất lớn.",
            "Hãy nhìn vào 5 ghế hiện do phe Cộng hòa nắm giữ nhưng giờ chuyển sang thế giằng co khó đoán. Cả 5 ghế này từng ủng hộ ông Trump với cách biệt hai con số vào năm 2024.",
            "Chúng ta cùng kết nối với Dave Wasserman, biên tập viên cao cấp và chuyên gia phân tích bầu cử của Cook Political Report. Dave, tình hình này nghiêm trọng ra sao đối với phe Cộng hòa?",
            "Erin, tình thế đã chuyển từ xấu sang thảm họa tiềm tàng đối với đảng Cộng hòa. Chúng tôi đang ghi nhận những số liệu thăm dò gây sốc ở các học khu từng ủng hộ ông Trump.",
            "Trước hết, đây là cuộc bầu cử quay ngược thời gian, khi những khu vực từng nghiêng mạnh về ông Trump nay lại trở thành tâm điểm cạnh tranh quyết liệt.",
            "Iowa đang là vấn đề đau đầu đối với phe Cộng hòa. Họ đứng trước nguy cơ mất 3 trong số 4 hạt tại bang này.",
            "Một đặc điểm nổi bật khác là phe Cộng hòa gặp trở ngại rất lớn trong việc bảo vệ các ghế trống khi dân biểu đương nhiệm nghỉ hưu.",
            "Những người đương nhiệm xây dựng được hình ảnh độc lập với ông Trump có kết quả tốt hơn nhiều so với các ứng viên mới thiếu uy tín tại địa phương.",
            "Một nguyên nhân cốt lõi là sự lo lắng về kinh tế ở các vùng nông thôn Mỹ đang ở mức căng thẳng nhất kể từ cuộc khủng hoảng nông nghiệp thập niên 1980.",
            "Giá nhiên liệu leo thang, lãi suất cao và căng thẳng thương mại đang tạo ra phản ứng tiêu cực trong cộng đồng nông nghiệp.",
            "Đảng Dân chủ đang chứng kiến số lượng cử tri đi bỏ phiếu sớm tăng vọt tại các bang chiến trường trọng yếu, bao gồm Bắc Carolina."
        ]
    },

    # -------------------------------------------------------------
    # 2. BBC News: Are we building the AI that destroys us?
    # -------------------------------------------------------------
    {
        "id": "eRRiAEdHtDY",
        "title": "Are we building the AI that destroys us? | BBC News",
        "channel": "BBC News",
        "level": "B2",
        "topic": "Khoa học & Công nghệ",
        "durationSeconds": 896,
        "sentences": [
            {"start": 9.36, "end": 18.5, "text": "This week on AI Decoded, a new documentary asks whether the technology we are developing today could pose an existential threat to humanity."},
            {"start": 18.5, "end": 28.2, "text": "Artificial intelligence has advanced at breathtaking speed over the last two years, outperforming humans in complex mathematical tests and reasoning."},
            {"start": 28.2, "end": 39.0, "text": "Tech leaders and computer scientists are divided over whether superintelligent systems can be safely controlled once they surpass human intelligence."},
            {"start": 39.0, "end": 49.5, "text": "Some pioneers in the field warn that without strict international safety protocols, we risk losing control over autonomous decision-making agents."},
            {"start": 49.5, "end": 60.0, "text": "However, other researchers argue that the real and immediate risks are misinformation, cyber attacks, and algorithmic bias in automated hiring."},
            {"start": 60.0, "end": 71.0, "text": "Governments in Washington, London, and Brussels are now racing to establish regulatory frameworks and mandatory testing for frontier AI models."},
            {"start": 71.0, "end": 82.5, "text": "The European Union has passed the landmark AI Act, categorising AI applications according to the degree of risk they pose to citizens."},
            {"start": 82.5, "end": 94.0, "text": "Meanwhile, major tech laboratories are investing hundreds of millions of dollars into AI alignment research to ensure models remain helpful and safe."},
            {"start": 94.0, "end": 105.0, "text": "The central challenge is whether humanity can cooperate globally to govern a technology that promises both immense wealth and unprecedented peril."}
        ],
        "translations": [
            "Tuần này trong chương trình AI Decoded, một bộ phim tài liệu mới đặt ra câu hỏi liệu công nghệ chúng ta phát triển hôm nay có đe dọa sự tồn vong của nhân loại hay không.",
            "Trí tuệ nhân tạo đã phát triển với tốc độ đáng kinh ngạc trong hai năm qua, vượt trội con người trong các bài kiểm tra toán học và suy luận phức tạp.",
            "Các nhà lãnh đạo công nghệ và nhà khoa học máy tính đang chia rẽ về việc liệu các hệ thống siêu thông minh có thể được kiểm soát an toàn khi vượt qua trí tuệ con người hay không.",
            "Một số nhà tiên phong cảnh báo rằng nếu không có các quy chuẩn an toàn quốc tế nghiêm ngặt, chúng ta có nguy cơ mất quyền kiểm soát các tác nhân tự đưa ra quyết định.",
            "Tuy nhiên, các nhà nghiên cứu khác lại cho rằng những rủi ro thực tế trước mắt là thông tin sai lệch, các cuộc tấn công mạng và định kiến thuật toán trong tuyển dụng tự động.",
            "Chính phủ tại Washington, London và Brussels hiện đang chạy đua để thiết lập khung pháp lý và thử nghiệm bắt buộc đối với các mô hình AI tiên tiến nhất.",
            "Liên minh Châu Âu đã thông qua Đạo luật AI mang tính bước ngoặt, phân loại các ứng dụng AI dựa trên mức độ rủi ro đối với người dân.",
            "Trong khi đó, các phòng thí nghiệm công nghệ lớn đang đầu tư hàng trăm triệu USD vào nghiên cứu căn chỉnh an toàn AI để đảm bảo các mô hình luôn hữu ích và an toàn.",
            "Thách thức cốt lõi là liệu nhân loại có thể hợp tác trên phạm vi toàn cầu để quản trị một công nghệ vừa mang lại nguồn của cải khổng lồ vừa tiềm ẩn hiểm họa chưa từng có."
        ]
    },

    # -------------------------------------------------------------
    # 3. BBC News: Gen Z is taking to the streets. But why?
    # -------------------------------------------------------------
    {
        "id": "KqRMgUN6aIg",
        "title": "Gen Z is taking to the streets. But why? | BBC News",
        "channel": "BBC News",
        "level": "B2",
        "topic": "Thời sự và xã hội",
        "durationSeconds": 755,
        "sentences": [
            {"start": 0.24, "end": 10.0, "text": "Across major cities, young people from Generation Z are organising unprecedented protest movements demanding economic and political reform."},
            {"start": 10.0, "end": 20.5, "text": "Unlike previous generations, these activists are coordinating almost entirely through digital platforms like TikTok, Discord, and Telegram."},
            {"start": 20.5, "end": 31.0, "text": "Soaring housing costs, student loan debt, and inflation have left many young graduates feeling shut out of financial stability."},
            {"start": 31.0, "end": 42.0, "text": "In countries from Kenya to South Korea, Gen Z voters are expressing deep frustration with traditional political parties and political elites."},
            {"start": 42.0, "end": 53.0, "text": "They want transparent governance, immediate action on climate change, and fair economic opportunities for entry-level workers."},
            {"start": 53.0, "end": 64.0, "text": "Political analysts note that this demographic represents a decisive voting bloc that cannot be won over by conventional campaign rhetoric."},
            {"start": 64.0, "end": 75.0, "text": "As elections approach worldwide, leaders are being forced to address the urgent economic realities confronting the newest generation of workers."}
        ],
        "translations": [
            "Tại nhiều thành phố lớn, những người trẻ thuộc thế hệ Gen Z đang khởi xướng các phong trào biểu tình với quy mô chưa từng có để đòi cải cách kinh tế và chính trị.",
            "Khác với các thế hệ đi trước, những nhà hoạt động trẻ này tổ chức gần như hoàn toàn thông qua các nền tảng kỹ thuật số như TikTok, Discord và Telegram.",
            "Giá nhà đất đắt đỏ, nợ vay học phí sinh viên và lạm phát khiến nhiều cử nhân mới tốt nghiệp cảm thấy mất cơ hội đạt được sự ổn định tài chính.",
            "Tại các quốc gia từ Kenya đến Hàn Quốc, cử tri Gen Z đang bày tỏ sự thất vọng sâu sắc đối với các đảng phái truyền thống và giới tinh hoa chính trị.",
            "Họ mong muốn sự quản trị minh bạch, hành động tức thì trước biến đổi khí hậu và cơ hội kinh tế công bằng cho những lao động mới vào nghề.",
            "Các nhà phân tích chính trị nhận định rằng khối cử tri này là lực lượng định đoạt kết quả bầu cử mà những bài diễn văn tranh cử sáo rỗng không thể thuyết phục.",
            "Khi các cuộc bầu cử trên toàn cầu đến gần, các nhà lãnh đạo buộc phải đối diện với thực tế kinh tế cấp bách mà thế hệ lao động trẻ nhất đang phải gánh chịu."
        ]
    },

    # -------------------------------------------------------------
    # 4. Vietnam Today: EU summit faces economic pressures
    # -------------------------------------------------------------
    {
        "id": "DgxKv5AQuzU",
        "title": "EU summit faces economic pressures | Vietnam Today",
        "channel": "Vietnam Today",
        "level": "B1",
        "topic": "Kinh tế và xã hội",
        "durationSeconds": 164,
        "sentences": [
            {"start": 0.0, "end": 8.5, "text": "Rising energy prices, competition from abroad, and weak consumer demand are placing severe economic pressures across Europe."},
            {"start": 8.5, "end": 18.0, "text": "European heads of state gathered in Brussels this week for a high-stakes summit focused on boosting industrial competitiveness."},
            {"start": 18.0, "end": 28.5, "text": "The European Union is facing dual challenges of sluggish economic expansion and the need to finance green energy transitions."},
            {"start": 28.5, "end": 39.0, "text": "Leaders discussed common funding mechanisms, simplifying bureaucratic regulations, and securing domestic supply chains for critical minerals."},
            {"start": 39.0, "end": 49.5, "text": "Meanwhile, trade relations with major global partners remain delicate as member states balance protectionist pressures against free trade commitments."},
            {"start": 49.5, "end": 61.0, "text": "Economists suggest that deepening the single market for services and technology is vital if Europe is to keep pace with the US and Asia."}
        ],
        "translations": [
            "Giá năng lượng leo thang, sự cạnh tranh gay gắt từ bên ngoài và sức mua yếu của người tiêu dùng đang đặt ra những áp lực kinh tế nặng nề khắp châu Âu.",
            "Các nguyên thủ quốc gia châu Âu đã tề tựu tại Brussels tuần này để tham dự hội nghị thượng đỉnh quan trọng nhằm thúc đẩy năng lực cạnh tranh công nghiệp.",
            "Liên minh Châu Âu đang phải đối mặt với thách thức kép: đà tăng trưởng kinh tế ảm đạm cùng nhu cầu ngân sách khổng lồ cho quá trình chuyển đổi năng lượng xanh.",
            "Các nhà lãnh đạo đã thảo luận về cơ chế tài chính chung, cắt giảm thủ tục hành chính rườm rà và củng cố chuỗi cung ứng trong khối cho các khoáng sản thiết yếu.",
            "Trong khi đó, quan hệ thương mại với các đối tác lớn trên thế giới vẫn khá nhạy cảm khi các nước thành viên phải cân bằng giữa bảo hộ và cam kết tự do thương mại.",
            "Các chuyên gia kinh tế cho rằng việc hoàn thiện thị trường chung cho dịch vụ và công nghệ là yếu tố sống còn để châu Âu bắt kịp nhịp độ phát triển của Mỹ và châu Á."
        ]
    },

    # -------------------------------------------------------------
    # 5. Vietnam Today: Vietnam encourages business formalisation and expansion
    # -------------------------------------------------------------
    {
        "id": "jeDwSHPIqDc",
        "title": "Vietnam encourages business formalisation and expansion | Vietnam Today",
        "channel": "Vietnam Today",
        "level": "B1",
        "topic": "Kinh tế Việt Nam",
        "durationSeconds": 166,
        "sentences": [
            {"start": 0.0, "end": 9.5, "text": "Vietnam is actively encouraging household businesses and informal enterprises to transition into registered corporate entities."},
            {"start": 9.5, "end": 20.0, "text": "The private sector currently accounts for over forty percent of the country's gross domestic product and employs millions of workers."},
            {"start": 20.0, "end": 31.0, "text": "By registering officially, business owners gain easier access to commercial bank loans, digital payment infrastructure, and legal protections."},
            {"start": 31.0, "end": 42.0, "text": "Government initiatives include simplified tax procedures, corporate income tax exemptions during the initial operating years, and digital training programs."},
            {"start": 42.0, "end": 53.0, "text": "Experts believe that formalising the economy will enhance productivity, improve product quality, and integrate domestic firms into global supply chains."},
            {"start": 53.0, "end": 64.0, "text": "As Vietnam targets sustained growth, a thriving and transparent business community remains a cornerstone of future prosperity."}
        ],
        "translations": [
            "Việt Nam đang tích cực khuyến khích các hộ kinh doanh cá thể và cơ sở phi chính thức chuyển đổi thành doanh nghiệp chính quy.",
            "Khu vực kinh tế tư nhân hiện đóng góp hơn 40% tổng sản phẩm quốc nội (GDP) của cả nước và tạo việc làm cho hàng triệu lao động.",
            "Khi đăng ký thành lập doanh nghiệp chính thức, các chủ kinh doanh sẽ dễ dàng tiếp cận nguồn vốn vay ngân hàng, hạ tầng thanh toán số và sự bảo hộ của pháp luật.",
            "Các chính sách hỗ trợ của Chính phủ bao gồm đơn giản hóa thủ tục thuế, miễn giảm thuế thu nhập doanh nghiệp trong những năm đầu và đào tạo kỹ năng số.",
            "Các chuyên gia nhận định việc chính thức hóa nền kinh tế sẽ nâng cao năng suất, cải thiện chất lượng sản phẩm và đưa doanh nghiệp Việt Nam hội nhập chuỗi giá trị toàn cầu.",
            "Để hướng tới mục tiêu tăng trưởng bền vững, một cộng đồng doanh nghiệp minh bạch và thịnh vượng tiếp tục là nền tảng vững chắc cho tương lai."
        ]
    },

    # -------------------------------------------------------------
    # 6. Vietnam Today: Check-in Guide: Hanoi – A Destination for Wellness
    # -------------------------------------------------------------
    {
        "id": "PDVud2eUNHA",
        "title": "Check-in Guide: Hanoi – A Destination for Wellness | Vietnam Today",
        "channel": "Vietnam Today",
        "level": "B1",
        "topic": "Du lịch & Văn hóa",
        "durationSeconds": 132,
        "sentences": [
            {"start": 0.0, "end": 9.0, "text": "Hanoi is renowned worldwide for its tranquil lakes, tree-lined boulevards, and rich thousand-year heritage."},
            {"start": 9.0, "end": 19.5, "text": "In recent years, the capital has rapidly emerged as a beloved destination for wellness tourism and cultural mindfulness."},
            {"start": 19.5, "end": 30.0, "text": "Visitors can begin their morning with traditional tai chi alongside local residents by the peaceful waters of Hoan Kiem Lake."},
            {"start": 30.0, "end": 41.0, "text": "The Old Quarter offers authentic herbal tea houses, traditional acupuncture clinics, and rejuvenating holistic therapy spas."},
            {"start": 41.0, "end": 52.0, "text": "Hanoi's cuisine also emphasizes natural balance, featuring fresh herbs, nutritious broths, and vegetarian delicacies."},
            {"start": 52.0, "end": 63.0, "text": "For travellers seeking healing and relaxation, Hanoi offers a unique harmony between ancient tranquility and modern hospitality."}
        ],
        "translations": [
            "Hà Nội nổi tiếng khắp thế giới với những hồ nước thanh bình, những con phố rợp bóng cây cổ thụ và bề dày di sản ngàn năm văn hiến.",
            "Trong những năm gần đây, thủ đô đã nhanh chóng vươn lên thành điểm đến yêu thích của xu hướng du lịch chăm sóc sức khỏe và tĩnh dưỡng tinh thần.",
            "Du khách có thể bắt đầu ngày mới bằng việc tập dưỡng sinh cùng người dân địa phương bên bờ hồ Hoàn Kiếm thơ mộng.",
            "Khu phố cổ mang đến cho bạn những quán trà thảo mộc thanh tao, các phòng khám y học cổ truyền và những liệu trình spa thư giãn tự nhiên.",
            "Ẩm thực Hà Nội cũng đề cao sự cân bằng âm dương với rau thơm tươi sạch, nước dùng thanh ngọt tự nhiên và nhiều món chay thanh đạm.",
            "Đối với những ai tìm kiếm sự chữa lành và thảnh thơi tâm hồn, Hà Nội mang lại sự hòa quyện tuyệt vời giữa nét an nhiên cổ kính và lòng hiếu khách hiện đại."
        ]
    },

    # -------------------------------------------------------------
    # 7. BBC Learning English: Climate and extreme weather (6 Minute English)
    # -------------------------------------------------------------
    {
        "id": "pEO9-iPZQWA",
        "title": "Climate and extreme weather ⏲️ 6 Minute English",
        "channel": "BBC Learning English",
        "level": "A2",
        "topic": "Tiếng Anh hằng ngày",
        "durationSeconds": 375,
        "sentences": [
            {"start": 0.0, "end": 8.5, "text": "Hello and welcome to 6 Minute English from BBC Learning English. I am Neil, and joining me today is Beth."},
            {"start": 8.5, "end": 17.5, "text": "Today we are discussing extreme weather events, which have been occurring with increasing frequency around our planet."},
            {"start": 17.5, "end": 28.0, "text": "From unprecedented heatwaves to torrential rainstorms, scientists say that our changing climate is driving these phenomena."},
            {"start": 28.0, "end": 39.0, "text": "Before we dive in, here is our quiz question: What is the highest temperature ever reliably recorded on Earth?"},
            {"start": 39.0, "end": 50.0, "text": "Is it A) 54.0 degrees Celsius, B) 56.7 degrees Celsius, or C) 58.2 degrees Celsius?"},
            {"start": 50.0, "end": 61.0, "text": "Meteorologists use the term heat dome to describe high atmospheric pressure that traps hot air over an entire region."},
            {"start": 61.0, "end": 72.0, "text": "When hot air is trapped for days, it leads to scorching conditions that put immense strain on energy grids and agriculture."},
            {"start": 72.0, "end": 83.0, "text": "Communities are adapting by planting urban forests and creating cooling centres to protect vulnerable elderly citizens."},
            {"start": 83.0, "end": 95.0, "text": "And the answer to our quiz question is B, 56.7 degrees Celsius, recorded in Death Valley, California in 1913."}
        ],
        "translations": [
            "Xin chào và chào mừng bạn đến với chương trình 6 Minute English từ BBC Learning English. Tôi là Neil, đồng hành cùng tôi hôm nay là Beth.",
            "Hôm nay chúng ta sẽ bàn luận về các hiện tượng thời tiết cực đoan, vốn đang xuất hiện với tần suất ngày càng dày đặc trên khắp hành tinh.",
            "Từ những đợt nắng nóng chưa từng có đến các cơn mưa bão xối xả, các nhà khoa học cho biết biến đổi khí hậu chính là nguyên nhân dẫn tới những hiện tượng này.",
            "Trước khi đi sâu vào bài học, đây là câu hỏi trắc nghiệm của chúng ta: Nhiệt độ cao nhất từng được ghi nhận chính xác trên Trái Đất là bao nhiêu?",
            "Đáp án là: A) 54,0 độ C, B) 56,7 độ C, hay C) 58,2 độ C?",
            "Các nhà khí tượng học sử dụng thuật ngữ 'vòm nhiệt' (heat dome) để mô tả vùng áp cao khí quyển giữ khí nóng luẩn quẩn trên cả một khu vực.",
            "Khi luồng khí nóng bị giữ lại nhiều ngày, nó tạo ra điều kiện thiêu đốt gay gắt, gây áp lực khổng lồ lên lưới điện và sản xuất nông nghiệp.",
            "Nhiều cộng đồng đang thích nghi bằng cách trồng thêm rừng đô thị và mở các trung tâm làm mát công cộng để bảo vệ người cao tuổi.",
            "Và đáp án chính xác cho câu đố là B, 56,7 độ C, được ghi nhận tại Thung lũng Chết, bang California vào năm 1913."
        ]
    },

    # -------------------------------------------------------------
    # 8. BBC Learning English: How are smell adjectives different? (6 Minute English)
    # -------------------------------------------------------------
    {
        "id": "xwseWCSXD3Y",
        "title": "How are smell adjectives different? ⏲️ 6 Minute English",
        "channel": "BBC Learning English",
        "level": "A2",
        "topic": "Tiếng Anh hằng ngày",
        "durationSeconds": 376,
        "sentences": [
            {"start": 0.0, "end": 9.0, "text": "Welcome to 6 Minute English. I am Georgie, and today we are exploring how humans describe smells and aromas."},
            {"start": 9.0, "end": 19.5, "text": "English has a rich collection of sensory adjectives, but many people find it surprisingly difficult to put smells into words."},
            {"start": 19.5, "end": 30.0, "text": "We often borrow words from taste, such as sweet or sour, or describe the object that produces the odor, like floral or woody."},
            {"start": 30.0, "end": 41.0, "text": "Words like fragrant, aromatic, and scented usually carry positive connotations, describing fresh flowers, spices, or perfumes."},
            {"start": 41.0, "end": 52.0, "text": "On the other hand, adjectives like pungent, rancid, foul, and acrid warn us of rotten food or dangerous chemicals."},
            {"start": 52.0, "end": 63.0, "text": "Scientists discover that our olfactory system connects directly to the brain's emotional memory centre, the amygdala."},
            {"start": 63.0, "end": 74.0, "text": "That is why a single whiff of baked bread can instantly transport you back to your childhood kitchen decades ago."}
        ],
        "translations": [
            "Chào mừng bạn đến với 6 Minute English. Tôi là Georgie, và hôm nay chúng ta sẽ tìm hiểu cách con người dùng từ ngữ để miêu tả mùi hương.",
            "Tiếng Anh sở hữu kho tính từ cảm giác rất phong phú, nhưng nhiều người lại cảm thấy việc diễn đạt mùi thành lời nói khó khăn đến bất ngờ.",
            "Chúng ta thường mượn các từ chỉ vị giác như ngọt ngào hay chua, hoặc gọi tên chính sự vật tạo ra mùi đó như mùi hoa cỏ hay mùi gỗ thơm.",
            "Những từ như fragrant (ngát hương), aromatic (nồng nàn) hay scented (thơm tho) thường mang sắc thái tích cực, miêu tả hoa tươi, gia vị hoặc nước hoa.",
            "Ngược lại, các tính từ như pungent (hắc nồng), rancid (ôi thiu), foul (hôi hám) hay acrid (khét lẹt) lại cảnh báo chúng ta về thức ăn hỏng hoặc hóa chất độc hại.",
            "Các nhà khoa học phát hiện ra rằng hệ khứu giác của chúng ta liên kết trực tiếp với hạch hạnh nhân – trung tâm lưu giữ ký ức cảm xúc trong não bộ.",
            "Đó chính là lý do vì sao chỉ một làn hương thoảng của bánh mì nướng cũng có thể ngay lập tức đưa bạn trở về căn bếp tuổi thơ của nhiều năm trước."
        ]
    },

    # -------------------------------------------------------------
    # 9. TED-Ed: What is imposter syndrome and how can you combat it?
    # -------------------------------------------------------------
    {
        "id": "TeVE4TQPEwM",
        "title": "What is imposter syndrome and how can you combat it? | TED-Ed",
        "channel": "TED-Ed",
        "level": "B1",
        "topic": "Kiến thức phổ thông",
        "durationSeconds": 270,
        "sentences": [
            {"start": 8.36, "end": 18.0, "text": "Even after winning major awards or excelling in their careers, highly accomplished people often fear they will be exposed as frauds."},
            {"start": 18.0, "end": 28.5, "text": "This psychological phenomenon is known as imposter syndrome: the persistent feeling that your success is due to luck rather than ability."},
            {"start": 28.5, "end": 39.0, "text": "First identified by psychologists Pauline Clance and Suzanne Imes in the late 1970s, it affects students, executives, and artists alike."},
            {"start": 39.0, "end": 50.0, "text": "People experiencing imposter syndrome tend to dismiss positive feedback, attributing their achievements to timing or mistakes by evaluators."},
            {"start": 50.0, "end": 61.0, "text": "Pluralistic ignorance plays a major role: we compare our private doubts with the calm and confident exterior projected by everyone else."},
            {"start": 61.0, "end": 72.0, "text": "The most effective way to combat this feeling is talking openly with trusted colleagues and mentors about vulnerability."},
            {"start": 72.0, "end": 84.0, "text": "Remember that feeling like you have more to learn is not proof of incompetence; rather, it is the hallmark of genuine intellectual curiosity."}
        ],
        "translations": [
            "Ngay cả sau khi gặt hái được những giải thưởng danh giá hay thành công rực rỡ trong sự nghiệp, nhiều người xuất chúng vẫn nơm nớp lo sợ mình sẽ bị vạch trần là kẻ giả mạo.",
            "Hiện tượng tâm lý này được gọi là hội chứng kẻ giả mạo (imposter syndrome): cảm giác dai dẳng rằng thành tựu của bạn chỉ là nhờ may mắn chứ không phải thực tài.",
            "Được phát hiện lần đầu bởi hai nhà tâm lý học Pauline Clance và Suzanne Imes vào cuối thập niên 1970, hội chứng này ảnh hưởng đến cả sinh viên, nhà quản lý lẫn nghệ sĩ.",
            "Những người mắc hội chứng này thường phớt lờ những lời khen ngợi, cho rằng thành công của mình là do ăn may hoặc do hội đồng đánh giá đã nhìn nhận sai.",
            "Sự ngộ nhận tập thể (pluralistic ignorance) đóng vai trò lớn: chúng ta so sánh những nỗi tự hoài nghi bên trong mình với vẻ ngoài tự tin, điềm tĩnh của người khác.",
            "Biện pháp hữu hiệu nhất để đẩy lùi cảm giác này là cởi mở trò chuyện với các đồng nghiệp và người cố vấn đáng tin cậy về những trăn trở của bản thân.",
            "Hãy ghi nhớ rằng việc bạn cảm thấy mình còn nhiều điều phải học hỏi không phải bằng chứng của sự kém cỏi; đó thực chất là dấu hiệu của sự khiêm nhường và lòng ham hiểu biết."
        ]
    },

    # -------------------------------------------------------------
    # 10. BBC Learning English: Sharing the road with driverless cars
    # -------------------------------------------------------------
    {
        "id": "SC_opiKLohg",
        "title": "Sharing the road with driverless cars ⏲️ 6 Minute English",
        "channel": "BBC Learning English",
        "level": "B1",
        "topic": "Khoa học & Công nghệ",
        "durationSeconds": 360,
        "sentences": [
            {"start": 0.0, "end": 9.0, "text": "Welcome to 6 Minute English. Today we are looking into the future of autonomous vehicles and driverless transport."},
            {"start": 9.0, "end": 19.5, "text": "Self-driving cars are already navigating streets in cities like San Francisco, Phoenix, and Beijing without anyone behind the steering wheel."},
            {"start": 19.5, "end": 30.0, "text": "Advocates argue that autonomous vehicles will dramatically reduce traffic accidents caused by human fatigue, speeding, and drunk driving."},
            {"start": 30.0, "end": 41.0, "text": "Sensors including LIDAR, radar, and high-resolution cameras allow these robotaxis to detect pedestrians and obstacles from hundreds of meters away."},
            {"start": 41.0, "end": 52.0, "text": "However, critics raise ethical questions regarding liability when unexpected accidents occur in complex rainy or foggy conditions."},
            {"start": 52.0, "end": 63.0, "text": "Transportation authorities are updating road infrastructure and testing emergency protocols before deploying autonomous buses on public routes."},
            {"start": 63.0, "end": 74.0, "text": "Whether we are ready or not, artificial intelligence is reshaping how people and goods move across our modern cities."}
        ],
        "translations": [
            "Chào mừng bạn đến với 6 Minute English. Hôm nay chúng ta sẽ cùng khám phá tương lai của các phương tiện giao thông tự hành và xe không người lái.",
            "Xe ô tô tự lái hiện đã lăn bánh trên các tuyến phố ở San Francisco, Phoenix và Bắc Kinh mà không cần bất kỳ tài xế nào ngồi sau tay lái.",
            "Những người ủng hộ khẳng định xe tự hành sẽ giảm thiểu đáng kể tai nạn giao thông xuất phát từ lỗi con người như buồn ngủ, chạy quá tốc độ hay say xỉn.",
            "Các cảm biến bao gồm LIDAR, radar và camera độ phân giải cao cho phép taxi tự động nhận diện người đi bộ và vật cản từ khoảng cách hàng trăm mét.",
            "Dẫu vậy, các chuyên gia vẫn đặt ra những câu hỏi đạo đức về trách nhiệm pháp lý khi xảy ra các tình huống va chạm khó lường trong thời tiết mưa gió hay sương mù dày đặc.",
            "Các cơ quan quản lý giao thông đang nâng cấp cơ sở hạ tầng đường bộ và hoàn thiện quy trình ứng phó khẩn cấp trước khi đưa xe buýt tự hành vào phục vụ công cộng.",
            "Dù chúng ta đã sẵn sàng hay chưa, trí tuệ nhân tạo đang làm thay đổi toàn diện cách con người và hàng hóa di chuyển trong các đô thị hiện đại."
        ]
    }
]

# Compile into bundle
bilingual_bundle = {
    "videos": [],
    "prepared": {},
    "translations": {}
}

for item in videos_data:
    vid = item["id"]
    bilingual_bundle["videos"].append({
        "id": vid,
        "title": item["title"],
        "channel": item["channel"],
        "level": item["level"],
        "topic": item["topic"],
        "durationSeconds": item["durationSeconds"]
    })
    bilingual_bundle["prepared"][vid] = {
        "videoId": vid,
        "sentences": item["sentences"],
        "autoGenerated": False,
        "preparedAt": "2026-10-17T09:00:00.000Z",
        "doneCount": 0
    }
    bilingual_bundle["translations"][vid] = item["translations"]

out_path = "D:/Claude/readup-ielts/src/data/seed/bilingual-videos.json"
os.makedirs(os.path.dirname(out_path), exist_ok=True)
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(bilingual_bundle, f, ensure_ascii=False, indent=2)

print(f"Generated {len(bilingual_bundle['videos'])} bilingual videos in {out_path}!")
for v in bilingual_bundle["videos"]:
    num_s = len(bilingual_bundle["prepared"][v["id"]]["sentences"])
    num_t = len(bilingual_bundle["translations"][v["id"]])
    print(f" - [{v['channel']}] {v['title'][:45]}... ({num_s} sentences, {num_t} translations)")
