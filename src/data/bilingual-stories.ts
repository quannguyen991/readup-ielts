export type BilingualStory = {
  id: string;
  level: string;
  titleEn: string;
  titleVi: string;
  summaryVi: string;
  paragraphs: { en: string; vi: string }[];
};

/** Original short stories written for ReadUp; both language versions are ours. */
export const BILINGUAL_STORIES: BilingualStory[] = [
  {
    id: 'the-map-makers-window',
    level: 'B1',
    titleEn: "The Map Maker's Window",
    titleVi: 'Khung cửa sổ của người vẽ bản đồ',
    summaryVi: 'Một con đường nhỏ nhắc người vẽ bản đồ rằng có những điều không thể đo bằng thước.',
    paragraphs: [
      {
        en: 'Every morning, Minh drew the city from his upstairs window. He marked the bridges in blue, the markets in red, and the quiet streets in thin grey lines. His maps were neat enough to make a stranger feel that the whole city could be understood at a glance.',
        vi: 'Mỗi sáng, Minh vẽ thành phố từ khung cửa sổ trên tầng. Anh đánh dấu những cây cầu bằng màu xanh, khu chợ bằng màu đỏ và các con phố yên tĩnh bằng những nét xám mảnh. Bản đồ của anh gọn gàng đến mức khiến người lạ nghĩ rằng chỉ cần nhìn thoáng qua là có thể hiểu cả thành phố.',
      },
      {
        en: 'One day, a girl arrived with a paper bag of oranges. She asked him to draw the shortcut to her grandmother’s house. Minh checked the streets twice, then pointed to a narrow lane beside the old cinema. “It is faster,” he said. “But it is not the way we go,” she replied.',
        vi: 'Một hôm, một cô bé đến với túi giấy đựng cam. Em nhờ anh vẽ lối tắt đến nhà bà. Minh kiểm tra các con phố hai lần rồi chỉ vào một con hẻm nhỏ bên rạp chiếu phim cũ. “Đường này nhanh hơn,” anh nói. “Nhưng đó không phải con đường bọn cháu thường đi,” em đáp.',
      },
      {
        en: 'She explained that her grandmother liked to stop at the flower seller’s stall and listen to the fountain in the square. The walk took longer, but it gave them time to talk. Minh looked at his precise lines and noticed how little they said about the people who used them.',
        vi: 'Em kể bà thích dừng ở quầy hoa và nghe tiếng đài phun nước trong quảng trường. Quãng đường ấy lâu hơn, nhưng giúp hai bà cháu có thời gian trò chuyện. Minh nhìn những nét vẽ chính xác của mình và nhận ra chúng nói quá ít về những người đi trên đó.',
      },
      {
        en: 'That evening, he added a small note to the map: “The longer road is sometimes the one that brings you closer.” The next morning, a stranger leaned over his desk and smiled. “Now,” she said, “this map feels like home.”',
        vi: 'Tối hôm ấy, anh thêm một dòng ghi chú nhỏ vào bản đồ: “Đôi khi, con đường dài hơn lại đưa ta đến gần nhau hơn.” Sáng hôm sau, một người lạ cúi nhìn bàn anh và mỉm cười. “Giờ thì,” cô nói, “tấm bản đồ này có cảm giác như một mái nhà.”',
      },
      {
        en: 'The stranger was a teacher who had moved to the city only a week earlier. She had been using Minh’s map to find the school, but every route seemed to end before the place where she wanted to stop. She showed him the pencilled marks she had added: a bakery where the owner saved yesterday’s rolls, a bench in the shade, and a doorway where neighbours left books for anyone to borrow.',
        vi: 'Người phụ nữ ấy là một giáo viên mới chuyển đến thành phố được một tuần. Cô dùng bản đồ của Minh để tìm đường tới trường, nhưng tuyến nào cũng kết thúc trước những nơi cô muốn ghé. Cô cho anh xem các dấu bút chì mình đã thêm: tiệm bánh để dành bánh mì hôm qua cho khách, chiếc ghế dài dưới bóng cây và ô cửa nơi hàng xóm đặt sách cho mọi người mượn.',
      },
      {
        en: 'Minh had always believed that a map became more useful as it became more exact. Now he wondered whether accuracy could include the reasons people chose a place, not only its position. He asked the teacher to describe each stop, then invited the flower seller, the baker and the caretaker of the old cinema to tell him what visitors should know.',
        vi: 'Minh vẫn luôn nghĩ bản đồ càng chính xác thì càng hữu ích. Giờ đây, anh tự hỏi liệu sự chính xác có thể bao gồm cả lý do người ta chọn một nơi, chứ không chỉ vị trí của nó. Anh nhờ cô giáo kể về từng điểm dừng, rồi mời người bán hoa, thợ làm bánh và bác trông rạp chiếu phim cũ chia sẻ những điều khách ghé thăm nên biết.',
      },
      {
        en: 'For the next month, his window stayed open late. People came with stories rather than requests for directions. A nurse described the quietest path after a night shift; a boy marked the wall where swallows nested each spring. Minh drew the streets as before, but around them he added small notes in different hands, each one a piece of local knowledge.',
        vi: 'Suốt tháng sau đó, khung cửa sổ của anh mở đến tận khuya. Người ta tìm đến để kể chuyện thay vì chỉ hỏi đường. Một y tá kể về lối đi yên tĩnh nhất sau ca trực đêm; một cậu bé đánh dấu bức tường nơi chim én về làm tổ mỗi mùa xuân. Minh vẫn vẽ các con phố như trước, nhưng bên cạnh anh thêm những ghi chú nhỏ bằng nhiều nét chữ, mỗi dòng là một mảnh hiểu biết của người địa phương.',
      },
      {
        en: 'When the city library asked to display his work, Minh sent the first map he had made. Then he sent the new one beside it. Visitors noticed that the second map looked less tidy, yet they stood in front of it longer. They traced a route with their fingers, stopped to read a note, and began telling one another where they would go first.',
        vi: 'Khi thư viện thành phố mời trưng bày tác phẩm, Minh gửi tấm bản đồ đầu tiên mình vẽ. Sau đó anh gửi thêm tấm mới đặt bên cạnh. Khách tham quan nhận ra tấm thứ hai kém ngay ngắn hơn, nhưng họ đứng ngắm lâu hơn. Họ lần theo một con đường bằng đầu ngón tay, dừng lại đọc ghi chú rồi kể cho nhau nghe mình muốn ghé nơi nào trước.',
      },
    ],
  },
  {
    id: 'the-last-seed',
    level: 'B1–B2',
    titleEn: 'The Last Seed',
    titleVi: 'Hạt giống cuối cùng',
    summaryVi: 'Một hạt giống nhỏ giúp cả ngôi làng kiên nhẫn sau mùa hạn hán.',
    paragraphs: [
      {
        en: 'After months without rain, the village garden had become a field of dust. Lan found one bean seed inside a cracked jar. Her neighbours told her to save it for food, but she carried it to the dry garden and pressed it into the earth.',
        vi: 'Sau nhiều tháng không có mưa, khu vườn của làng chỉ còn là một khoảng đất bụi. Lan tìm thấy một hạt đậu trong chiếc lọ nứt. Hàng xóm bảo cô nên giữ lại làm thức ăn, nhưng cô mang nó ra khu vườn khô cằn và ấn xuống đất.',
      },
      {
        en: 'Each morning she poured a cup of water around the seed. Nothing appeared. A week passed, then another. Children began to visit, not because they expected a plant, but because Lan always had a new story about the day the rain might return.',
        vi: 'Mỗi sáng cô tưới một cốc nước quanh hạt giống. Không có gì mọc lên. Một tuần trôi qua rồi thêm một tuần nữa. Bọn trẻ bắt đầu ghé thăm, không phải vì chúng tin sẽ có cây mọc, mà vì ngày nào Lan cũng kể một câu chuyện mới về ngày mưa có thể quay lại.',
      },
      {
        en: 'On the twenty-third morning, a green hook broke through the soil. The villagers gathered around it as if it were a visitor. They brought water from their own cups, and soon the garden had a row of tiny shoots.',
        vi: 'Vào buổi sáng thứ hai mươi ba, một mầm xanh cong nhỏ đội đất nhú lên. Dân làng quây quanh nó như thể vừa có một vị khách ghé thăm. Họ mang nước trong cốc của mình đến, và chẳng bao lâu khu vườn đã có một hàng mầm non.',
      },
      {
        en: 'The harvest was modest, yet everyone saved a few seeds for the next season. When the rain finally came, the villagers understood that hope had not watered the plant by itself. It had simply persuaded them to care for it together.',
        vi: 'Vụ thu hoạch không nhiều, nhưng ai cũng giữ lại vài hạt cho mùa sau. Khi mưa cuối cùng cũng trở lại, dân làng hiểu rằng hy vọng không thể tự tưới cây. Nó chỉ giúp họ cùng nhau chăm sóc mầm sống ấy.',
      },
      {
        en: 'The villagers made a plan before the next planting season. Each family would keep a small jar of seeds, and no one would plant the whole supply at once. They dug shallow channels to guide rainwater between the beds, using stones gathered from the dry river. The work was slow, but this time nobody expected Lan to do it alone.',
        vi: 'Trước mùa gieo trồng tiếp theo, dân làng cùng lập kế hoạch. Mỗi gia đình giữ một lọ hạt nhỏ, không ai gieo toàn bộ số hạt cùng lúc. Họ đào những rãnh nông dẫn nước mưa qua các luống, dùng đá nhặt từ lòng sông khô. Công việc diễn ra chậm rãi, nhưng lần này chẳng ai nghĩ Lan phải tự làm một mình.',
      },
      {
        en: 'Some seeds failed to grow. The children recorded which beds received morning light and which held water longest after a storm. An old farmer taught them to loosen the soil without disturbing young roots. Their notes did not prevent every mistake, yet each season they lost fewer plants because the village could remember what had worked.',
        vi: 'Một số hạt không nảy mầm. Bọn trẻ ghi lại luống nào đón nắng buổi sáng và luống nào giữ nước lâu nhất sau cơn mưa. Một lão nông dạy chúng xới đất mà không làm tổn thương rễ non. Những ghi chép ấy không thể ngăn mọi sai sót, nhưng qua mỗi mùa, làng mất ít cây hơn vì mọi người cùng nhớ điều gì đã hiệu quả.',
      },
      {
        en: 'By the following year, the garden had become a place for more than food. Neighbours exchanged tools there, and families that had barely spoken began sharing meals beneath the young trees. Lan still kept the cracked jar on a shelf, but she no longer thought of it as a container for a final seed. It reminded her that beginnings can be protected by many hands.',
        vi: 'Đến năm sau, khu vườn không chỉ là nơi trồng thức ăn. Hàng xóm trao đổi dụng cụ ở đó, còn những gia đình vốn hiếm khi trò chuyện bắt đầu ăn cùng nhau dưới tán cây non. Lan vẫn giữ chiếc lọ nứt trên kệ, nhưng không còn xem nó là vật đựng hạt giống cuối cùng. Nó nhắc cô rằng nhiều bàn tay có thể cùng gìn giữ một khởi đầu.',
      },
      {
        en: 'When the children grew older, they carried seeds from the garden to nearby villages that were facing dry seasons of their own. They did not promise that every plant would survive. Instead, they brought the villagers’ notes, offered to dig the first channels together, and stayed long enough to learn what each patch of land needed.',
        vi: 'Khi lũ trẻ lớn lên, chúng mang hạt giống từ khu vườn đến những ngôi làng lân cận cũng đang trải qua mùa khô. Chúng không hứa rằng cây nào cũng sẽ sống. Thay vào đó, chúng mang theo ghi chép của làng, đề nghị cùng đào những rãnh nước đầu tiên và ở lại đủ lâu để tìm hiểu từng mảnh đất cần gì.',
      },
    ],
  },
  {
    id: 'letters-from-the-moon',
    level: 'B2',
    titleEn: 'Letters from the Moon',
    titleVi: 'Những lá thư từ Mặt Trăng',
    summaryVi: 'Một kỹ sư trẻ viết thư về Trái Đất từ trạm nghiên cứu ngoài không gian.',
    paragraphs: [
      {
        en: 'The first thing An noticed from the lunar station was not the darkness. It was the silence. Without wind or distant traffic, even a small movement inside the habitat seemed to have a voice.',
        vi: 'Điều đầu tiên An nhận ra ở trạm nghiên cứu trên Mặt Trăng không phải bóng tối. Đó là sự im lặng. Không có gió hay tiếng xe cộ từ xa, ngay cả một cử động nhỏ bên trong khu sinh hoạt cũng như có tiếng nói riêng.',
      },
      {
        en: 'She began sending letters to her younger brother. She described the pale horizon, the slow sunrise, and the tools that had to be checked twice. But each letter ended with an ordinary detail: the taste of tea, a song stuck in her head, or a joke the crew had repeated all week.',
        vi: 'Cô bắt đầu gửi thư cho em trai. Cô tả đường chân trời nhợt màu, bình minh chậm rãi và những dụng cụ phải được kiểm tra hai lần. Nhưng lá thư nào cũng kết thúc bằng một chi tiết bình thường: vị trà, một bài hát cứ vang lên trong đầu, hay câu đùa cả đội lặp đi lặp lại suốt tuần.',
      },
      {
        en: '“You write about home more than the Moon,” her brother replied. An laughed, then realised that distance had changed what she meant by home. It was no longer only a place on a map. It was a collection of small things someone else remembered with her.',
        vi: '“Chị viết về nhà nhiều hơn về Mặt Trăng,” em trai hồi âm. An bật cười rồi nhận ra khoảng cách đã làm thay đổi ý nghĩa của từ “nhà”. Nhà không còn chỉ là một nơi trên bản đồ. Đó là tập hợp những điều nhỏ bé có người khác cùng ghi nhớ với cô.',
      },
      {
        en: 'Before returning to Earth, she left one final note in the station library: “The stars make our world look small. The people we love make it feel wide enough.”',
        vi: 'Trước khi trở về Trái Đất, cô để lại một dòng ghi chú cuối cùng trong thư viện của trạm: “Những vì sao khiến thế giới của ta trông thật nhỏ. Những người ta yêu thương khiến nó rộng lớn vừa đủ.”',
      },
      {
        en: 'During the return journey, An read the letters again. The first ones were full of measurements: how many minutes the sunrise lasted, how much dust gathered near an airlock, how far the station stood from the ridge. Later pages had fewer numbers. They described the crew learning to disagree without wasting a day, and the small rituals that made a temporary room feel lived in.',
        vi: 'Trên đường trở về, An đọc lại những lá thư. Những lá đầu tiên đầy số đo: bình minh kéo dài bao nhiêu phút, bụi tích lại gần cửa khóa khí nhiều thế nào, trạm cách sống núi bao xa. Các trang sau ít con số hơn. Chúng kể về cách phi hành đoàn học cách bất đồng mà không phí cả ngày, và những nghi thức nhỏ khiến căn phòng tạm bợ có cảm giác như đang có người sống.',
      },
      {
        en: 'Her brother had kept every envelope in a wooden box. He had answered each one with news from Earth: a neighbour’s new dog, a school play, the old bridge closed for repairs. An had once thought these details were too ordinary to matter. Read from space, they formed a map of a place that kept changing while she was away.',
        vi: 'Em trai cô giữ tất cả phong thư trong một chiếc hộp gỗ. Em hồi âm từng lá bằng tin tức dưới Trái Đất: con chó mới của nhà hàng xóm, vở kịch ở trường, cây cầu cũ đang đóng để sửa chữa. An từng nghĩ những chi tiết ấy quá bình thường nên chẳng đáng kể. Nhưng khi đọc từ ngoài không gian, chúng kết thành bản đồ về một nơi vẫn đổi thay trong lúc cô vắng mặt.',
      },
      {
        en: 'At the reunion, the crew sat around a table crowded with food. Everyone spoke at once, and An found herself listening for the soft hum of the station. Then she noticed that the room had its own steady sounds: a kettle clicking off, chairs shifting, someone laughing before finishing a sentence. The noise did not interrupt her thoughts. It gave them somewhere to rest.',
        vi: 'Trong buổi gặp lại, cả đội ngồi quanh chiếc bàn bày đầy thức ăn. Mọi người nói cùng lúc, còn An nhận ra mình đang tìm tiếng rì rì khe khẽ của trạm. Rồi cô nghe thấy căn phòng có những âm thanh đều đặn riêng: ấm nước vừa tắt, ghế dịch chuyển, ai đó bật cười trước khi nói hết câu. Những âm thanh ấy không làm gián đoạn suy nghĩ của cô. Chúng cho suy nghĩ một nơi để nghỉ ngơi.',
      },
      {
        en: 'A month later, An visited the station library’s reading room. The final note was still on the wall, but someone had placed a new letter beneath it. A young engineer had written about missing the smell of rain. An added a reply in the margin: “Write down what you miss, and what you have learned to notice. Both are ways of finding your way home.”',
        vi: 'Một tháng sau, An ghé phòng đọc của thư viện trạm. Dòng ghi chú cuối vẫn còn trên tường, nhưng có người đã đặt một lá thư mới bên dưới. Một kỹ sư trẻ viết rằng mình nhớ mùi đất sau mưa. An ghi thêm lời hồi đáp bên lề: “Hãy viết ra điều bạn nhớ và điều bạn đã học cách để ý. Cả hai đều là cách tìm đường về nhà.”',
      },
    ],
  },
];

export function getBilingualStory(id: string): BilingualStory | undefined {
  return BILINGUAL_STORIES.find((story) => story.id === id);
}
