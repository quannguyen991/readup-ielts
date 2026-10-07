export type BilingualBookGuide = {
  id: string;
  paragraphs: Array<{ en: string; vi: string }>;
};

/** Original bilingual reading guides; these are summaries, not excerpts from the books. */
export const BILINGUAL_BOOK_GUIDES: BilingualBookGuide[] = [
  {
    id: 'anthropocene-reviewed',
    paragraphs: [
      {
        en: 'The Anthropocene is a proposed name for an age in which human activity leaves a lasting mark on Earth. In this book, John Green looks at that large idea through small, familiar subjects: a device, a landscape, a song, or a shared habit. The scale changes from essay to essay, inviting readers to notice how ordinary life connects to wider history.',
        vi: 'Anthropocene là tên gọi được đề xuất cho thời đại mà hoạt động của con người để lại dấu ấn lâu dài trên Trái Đất. Trong cuốn sách này, John Green nhìn ý tưởng rộng lớn ấy qua những điều nhỏ bé, quen thuộc: một thiết bị, phong cảnh, bài hát hay thói quen chung. Mỗi bài viết đổi góc nhìn, gợi người đọc nhận ra đời sống thường ngày gắn với lịch sử rộng lớn hơn.',
      },
      {
        en: 'A review can do more than judge whether something is good or bad. It can become a way to ask what an object means to people, how it was made, and what its costs may be. By placing personal memories beside public facts, Green’s method shows how a private feeling can open a door to a shared question.',
        vi: 'Một bài nhận xét có thể làm nhiều hơn việc phán xét một điều tốt hay xấu. Nó có thể giúp ta hỏi một vật có ý nghĩa gì với con người, nó được tạo ra như thế nào và cái giá của nó là gì. Khi đặt ký ức cá nhân cạnh những sự kiện chung, cách viết của Green cho thấy cảm xúc riêng có thể mở ra một câu hỏi mà nhiều người cùng quan tâm.',
      },
      {
        en: 'For a language learner, this collection is useful because its subjects are concrete while its reflections are abstract. Notice how an essay can move from description to interpretation, then end with a judgment supported by detail. Try writing a short review of an everyday object and explain what it reveals about the world around you.',
        vi: 'Với người học ngoại ngữ, tuyển tập này hữu ích vì đề tài cụ thể nhưng suy ngẫm lại mang tính khái quát. Hãy để ý cách một bài viết chuyển từ miêu tả sang diễn giải, rồi kết thúc bằng nhận xét dựa trên chi tiết. Bạn có thể thử viết một bài ngắn về vật dụng hằng ngày và giải thích nó hé lộ điều gì về thế giới quanh mình.',
      },
    ],
  },
  {
    id: 'henrietta-lacks',
    paragraphs: [
      {
        en: 'Henrietta Lacks was a Black woman whose cells, collected during medical treatment in 1951, later became the source of the HeLa cell line. Those cells helped researchers conduct experiments that would have been difficult to perform otherwise. The scientific story is remarkable, but the circumstances of collection raise questions about consent, privacy, and who benefits from medical discovery.',
        vi: 'Henrietta Lacks là một phụ nữ da đen có tế bào được lấy trong quá trình điều trị y tế năm 1951; về sau, chúng trở thành nguồn gốc của dòng tế bào HeLa. Những tế bào ấy giúp các nhà nghiên cứu thực hiện nhiều thí nghiệm khó tiến hành theo cách khác. Câu chuyện khoa học đặc biệt đáng chú ý, nhưng hoàn cảnh lấy mẫu đặt ra câu hỏi về sự đồng thuận, quyền riêng tư và ai được hưởng lợi từ khám phá y học.',
      },
      {
        en: 'Rebecca Skloot’s account brings together laboratory history and the experiences of Henrietta’s family. This combination matters because scientific progress is not separate from the people whose bodies, work, or communities make research possible. The book asks readers to consider how institutions should explain risks, ask permission, and share the value created by biological materials.',
        vi: 'Rebecca Skloot kết hợp lịch sử phòng thí nghiệm với trải nghiệm của gia đình Henrietta. Cách kể này quan trọng vì tiến bộ khoa học không tách rời những người có cơ thể, công sức hay cộng đồng giúp nghiên cứu trở nên khả thi. Cuốn sách gợi người đọc suy nghĩ về cách các tổ chức cần giải thích rủi ro, xin phép và chia sẻ giá trị tạo ra từ vật liệu sinh học.',
      },
      {
        en: 'The central lesson is not that research should stop. It is that trust is part of responsible research. A strong discussion separates two questions: what a discovery can do for medicine, and whether the people connected to it were treated fairly. Keeping those questions together makes the history more complete and the ethical debate more precise.',
        vi: 'Bài học cốt lõi không phải là nên dừng nghiên cứu. Đó là lòng tin cũng thuộc về nghiên cứu có trách nhiệm. Một cuộc thảo luận tốt cần tách bạch hai câu hỏi: khám phá ấy có thể đóng góp gì cho y học, và những người liên quan có được đối xử công bằng hay không. Xem xét đồng thời cả hai giúp câu chuyện đầy đủ hơn và tranh luận đạo đức chính xác hơn.',
      },
    ],
  },
  {
    id: 'short-history',
    paragraphs: [
      {
        en: 'A Short History of Nearly Everything follows questions that seem almost too large to answer: how the universe began, how Earth became habitable, and how life developed. Bill Bryson turns these subjects into a guided journey through scientific ideas and the people who tested them. The emphasis is on how knowledge was built, not on memorizing a list of discoveries.',
        vi: 'A Short History of Nearly Everything lần theo những câu hỏi tưởng như quá lớn để trả lời: vũ trụ bắt đầu ra sao, Trái Đất trở nên thích hợp cho sự sống như thế nào và sự sống phát triển ra sao. Bill Bryson biến các chủ đề ấy thành hành trình khám phá ý tưởng khoa học cùng những người kiểm chứng chúng. Trọng tâm là cách tri thức được hình thành, chứ không phải học thuộc danh sách phát minh.',
      },
      {
        en: 'Scientific explanations often change when new measurements or better instruments become available. That does not make science unreliable; it shows how evidence can refine an explanation. Bryson’s broad historical approach helps readers see connections between astronomy, geology, chemistry, and biology, while also noticing the uncertainty that remains at the edge of current knowledge.',
        vi: 'Giải thích khoa học thường thay đổi khi có phép đo mới hoặc thiết bị tốt hơn. Điều đó không khiến khoa học trở nên thiếu tin cậy; nó cho thấy bằng chứng có thể giúp điều chỉnh một cách lý giải. Cách tiếp cận lịch sử rộng của Bryson giúp người đọc nhìn thấy mối liên hệ giữa thiên văn học, địa chất, hóa học và sinh học, đồng thời nhận ra những điều chưa chắc chắn ở rìa tri thức hiện nay.',
      },
      {
        en: 'As you read, track the difference between an observation, a hypothesis, and a conclusion. Ask what evidence supports a claim and what could change it. This habit mirrors the book’s larger theme: understanding the natural world is a collective effort, built over time by people who question one another and revise their explanations.',
        vi: 'Khi đọc, hãy phân biệt quan sát, giả thuyết và kết luận. Hãy hỏi bằng chứng nào hỗ trợ một nhận định và điều gì có thể khiến nhận định ấy thay đổi. Thói quen này phản ánh chủ đề lớn của cuốn sách: hiểu thế giới tự nhiên là nỗ lực chung, được bồi đắp theo thời gian bởi những người chất vấn nhau và điều chỉnh cách giải thích.',
      },
    ],
  },
  {
    id: 'demon-haunted-world',
    paragraphs: [
      {
        en: 'The Demon-Haunted World argues that curiosity is most useful when it is paired with disciplined doubt. Carl Sagan describes scientific thinking as a set of habits for checking claims: look for evidence, consider alternative explanations, and ask whether a conclusion follows from the facts. These habits matter especially when a story is emotionally appealing or confirms what we already believe.',
        vi: 'The Demon-Haunted World cho rằng óc tò mò phát huy tác dụng tốt nhất khi đi cùng sự hoài nghi có phương pháp. Carl Sagan mô tả tư duy khoa học như một nhóm thói quen để kiểm tra nhận định: tìm bằng chứng, cân nhắc cách giải thích khác và xem kết luận có thực sự theo sau dữ kiện hay không. Những thói quen này đặc biệt cần thiết khi một câu chuyện hấp dẫn về cảm xúc hoặc củng cố điều ta vốn tin.',
      },
      {
        en: 'Skepticism is not the same as rejecting every idea. It is a way of giving confidence in proportion to the quality of the evidence. A claim supported by repeatable observations deserves more weight than one supported only by rumor or an impressive anecdote. At the same time, a careful thinker stays open to changing their mind when stronger evidence appears.',
        vi: 'Hoài nghi không đồng nghĩa với việc bác bỏ mọi ý tưởng. Đó là cách điều chỉnh mức độ tin tưởng tương ứng với chất lượng bằng chứng. Nhận định được hỗ trợ bằng quan sát có thể lặp lại đáng tin hơn nhận định chỉ dựa trên tin đồn hay một câu chuyện gây ấn tượng. Đồng thời, người suy nghĩ cẩn trọng vẫn sẵn sàng đổi ý khi xuất hiện bằng chứng thuyết phục hơn.',
      },
      {
        en: 'A practical reading exercise is to separate a source’s claim from its proof. Identify who made the claim, what method was used, and whether other explanations were tested. The goal is not to sound cynical; it is to make room for wonder without letting wonder replace careful reasoning.',
        vi: 'Một bài tập đọc thực tế là tách nhận định của nguồn tin khỏi bằng chứng của nó. Hãy xác định ai đưa ra nhận định, họ dùng phương pháp nào và đã kiểm tra các cách giải thích khác chưa. Mục tiêu không phải là tỏ ra hoài nghi mọi thứ; mà là giữ chỗ cho sự kinh ngạc nhưng không để nó thay thế lập luận cẩn trọng.',
      },
    ],
  },
  {
    id: 'righteous-mind',
    paragraphs: [
      {
        en: 'The Righteous Mind explores why people can reach different moral and political conclusions while feeling equally certain that they are right. Jonathan Haidt’s account gives an important role to quick intuitions: people often react first, then build reasons that explain the reaction. This pattern does not mean that reasoning is useless, but it suggests that reasoning works within a social and emotional setting.',
        vi: 'The Righteous Mind tìm hiểu vì sao con người có thể đi đến những kết luận đạo đức và chính trị khác nhau nhưng đều tin chắc mình đúng. Cách lý giải của Jonathan Haidt nhấn mạnh trực giác nhanh: ta thường phản ứng trước rồi mới xây dựng lý do để giải thích phản ứng ấy. Điều đó không có nghĩa lập luận là vô ích, nhưng cho thấy suy luận hoạt động trong một môi trường xã hội và cảm xúc.',
      },
      {
        en: 'The book also considers how moral concerns can extend beyond personal care and fairness. Groups may value loyalty, respect for authority, or protection of shared traditions in different ways. Recognizing that difference can help explain disagreement without requiring us to approve of every argument. It also encourages readers to ask what value another person is trying to protect.',
        vi: 'Cuốn sách cũng xem xét cách mối quan tâm đạo đức vượt ra ngoài lòng trắc ẩn và sự công bằng cá nhân. Các nhóm có thể coi trọng lòng trung thành, sự tôn trọng quyền uy hay việc gìn giữ truyền thống chung ở những mức độ khác nhau. Nhận ra khác biệt ấy giúp lý giải bất đồng mà không buộc ta phải đồng ý với mọi lập luận. Nó cũng khuyến khích người đọc hỏi người khác đang cố bảo vệ giá trị nào.',
      },
      {
        en: 'For a reader, the useful challenge is to notice when evidence is being weighed and when identity is shaping the response. In a cross-text discussion, summarize the other writer’s strongest point before answering it. Understanding a moral disagreement does not make it disappear, but it can make the conversation more accurate and less dismissive.',
        vi: 'Thử thách hữu ích với người đọc là nhận ra lúc nào bằng chứng đang được cân nhắc và lúc nào bản sắc nhóm đang chi phối phản ứng. Khi đọc hai văn bản có quan điểm khác nhau, hãy tóm tắt luận điểm mạnh nhất của tác giả kia trước khi phản hồi. Hiểu được bất đồng đạo đức không làm nó biến mất, nhưng có thể khiến cuộc trao đổi chính xác và bớt phủ nhận nhau hơn.',
      },
    ],
  },
];

export function getBilingualBookGuide(id: string): BilingualBookGuide | undefined {
  return BILINGUAL_BOOK_GUIDES.find((guide) => guide.id === id);
}
