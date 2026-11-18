/**
 * HỆ THỐNG DẠNG BÀI & KỸ NĂNG THI IELTS (IELTS QUESTION TYPES & SKILL STRATEGIES)
 * Cung cấp chiến thuật, bí kíp phát hiện bẫy và phương pháp làm bài cho từng dạng.
 */

export type IeltsSkill = 'reading' | 'listening' | 'writing' | 'speaking';

export type IeltsQuestionTypeMeta = {
  id: string;
  skill: IeltsSkill;
  titleEn: string;
  titleVi: string;
  frequency: 'Rất cao (Luôn có)' | 'Cao' | 'Trung bình' | 'Thỉnh thoảng';
  descriptionVi: string;
  difficultyLevel: 'Dễ' | 'Trung bình' | 'Khó' | 'Rất khó';
  steps: string[];
  traps: string[];
  tips: string[];
};

export const IELTS_QUESTION_TYPES: IeltsQuestionTypeMeta[] = [
  // ==========================================
  // READING QUESTION TYPES
  // ==========================================
  {
    id: 'reading-tfng',
    skill: 'reading',
    titleEn: 'True / False / Not Given & Yes / No / Not Given',
    titleVi: 'Xác định Đúng / Sai / Không có thông tin',
    frequency: 'Rất cao (Luôn có)',
    difficultyLevel: 'Khó',
    descriptionVi: 'Dạng bài kinh điển của IELTS Reading kiểm tra khả năng đối chiếu thông tin và phân biệt rõ giữa việc thông tin đối lập hoàn toàn (False/No) với việc bài không đề cập đến chi tiết đó (Not Given).',
    steps: [
      'Đọc kỹ nhận định trong câu hỏi và gạch chân các từ khóa cốt lõi (chủ ngữ, động từ chính, đối tượng so sánh).',
      'Định vị vị trí thông tin trong bài đọc theo thứ tự xuất hiện của câu hỏi (câu hỏi True/False/Not Given luôn tuân theo trật tự bài đọc).',
      'So sánh chi tiết từng thành phần: Nếu thông tin trùng khớp hoàn toàn ý nghĩa (kể cả dùng từ đồng nghĩa) -> TRUE/YES.',
      'Nếu bài đọc có thông tin khẳng định NGƯỢC LẠI hoặc MÂU THUẪN với nhận định -> FALSE/NO.',
      'Nếu bài đọc có nhắc đến chủ đề nhưng KHÔNG CÓ CĂN CỨ để khẳng định câu hỏi đúng hay sai -> NOT GIVEN.'
    ],
    traps: [
      'Bẫy từ chỉ mức độ tuyệt đối (Absolute words): always, never, completely, exclusively, all, only. Trong khi bài đọc chỉ dùng often, usually, some.',
      'Bẫy suy đoán theo kiến thức thực tế (Real-world knowledge): Tự suy luận câu đó ngoài đời đúng nhưng trong bài đọc tác giả không hề viết.',
      'Bẫy giả định (Hypothetical vs Reality): Bài nói "Các nhà khoa học hy vọng sẽ..." nhưng câu hỏi nói "Các nhà khoa học đã chứng minh...".'
    ],
    tips: [
      'Không bao giờ dựa vào hiểu biết ngoài đời để làm bài, bài viết gì chỉ tin bấy nhiêu.',
      'Nếu mất quá 1.5 phút để tìm một thông tin mà không thấy đâu, khả năng rất cao câu đó là NOT GIVEN.'
    ]
  },
  {
    id: 'reading-matching-headings',
    skill: 'reading',
    titleEn: 'Matching Headings',
    titleVi: 'Nối tiêu đề cho từng đoạn văn',
    frequency: 'Cao',
    difficultyLevel: 'Rất khó',
    descriptionVi: 'Dạng bài thử thách nhất trong IELTS Reading, yêu cầu nắm bắt ý chính (Main Idea / Gist) của cả đoạn chứ không chỉ đọc lướt một vài từ khóa đơn lẻ.',
    steps: [
      'Đọc danh sách các tiêu đề (List of Headings) trước, gạch chân các từ khóa mang nghĩa cốt lõi của mỗi tiêu đề.',
      'Đọc đoạn văn: chú ý 1-2 câu đầu (Topic sentence) và câu cuối cùng của đoạn.',
      'Tuy nhiên, không chỉ đọc câu đầu: nếu câu đầu là câu hỏi hoặc dẫn dắt ("However...", "In contrast..."), ý chính sẽ nằm ở phần chuyển ý phía sau.',
      'Tóm tắt lại ý chính của đoạn trong đầu bằng 1 cụm từ tiếng Việt/Anh ngắn.',
      'Đối chiếu với danh sách tiêu đề và chọn tiêu đề bao quát nhất, loại trừ các tiêu đề chỉ là chi tiết phụ (Detail distractor).'
    ],
    traps: [
      'Bẫy trùng từ khóa (Word-spotting trap): Tiêu đề có chứa nguyên văn 1 từ xuất hiện trong đoạn, nhưng trong đoạn từ đó chỉ là 1 ví dụ minh họa nhỏ chứ không phải ý chính của cả đoạn.',
      'Bẫy tiêu đề quá rộng (Too broad) hoặc quá hẹp (Too narrow): Tiêu đề chỉ nói về 1 câu trong khi đoạn văn bàn về cả một quá trình.'
    ],
    tips: [
      'Làm dạng Matching Headings ĐẦU TIÊN khi đọc bài, vì khi tìm tiêu đề bạn sẽ nắm được bản đồ nội dung toàn bộ bài đọc để làm các câu hỏi chi tiết sau đó cực nhanh.',
      'Gạch bỏ tiêu đề đã dùng để thu hẹp phạm vi lựa chọn cho các đoạn tiếp theo.'
    ]
  },
  {
    id: 'reading-summary-completion',
    skill: 'reading',
    titleEn: 'Summary / Note / Table Completion',
    titleVi: 'Điền từ vào đoạn tóm tắt / bảng số liệu',
    frequency: 'Rất cao (Luôn có)',
    difficultyLevel: 'Trung bình',
    descriptionVi: 'Điền từ trực tiếp từ bài đọc vào một đoạn tóm tắt hoặc bảng tổng hợp. Kiểm tra kỹ năng nhận diện từ loại và paraphrase.',
    steps: [
      'Đọc kỹ giới hạn số từ được phép điền: Ví dụ "ONE WORD ONLY" hay "NO MORE THAN TWO WORDS". Nếu đề yêu cầu 1 từ mà điền 2 từ là mất điểm hoàn toàn.',
      'Phân tích chỗ trống cần điền: Xác định từ loại (Danh từ, Động từ, Tính từ, Số từ) và nghĩa phán đoán.',
      'Gạch chân từ khóa trước và sau chỗ trống.',
      'Quét (Scan) bài đọc để tìm đoạn văn chứa các từ khóa đồng nghĩa (Paraphrase).',
      'Trích xuất đúng dạng từ nguyên bản trong bài đọc và điền vào chỗ trống.'
    ],
    traps: [
      'Tự ý thay đổi dạng từ (biến đổi số ít/số nhiều, thêm hậu tố đuôi) khi đề yêu cầu "from the text". Phải giữ nguyên từ gốc trong bài.',
      'Điền quá số từ cho phép.',
      'Viết sai chính tả (Spelling mistakes).'
    ],
    tips: [
      'Luôn kiểm tra ngữ pháp của câu sau khi điền từ: câu điền xong phải hoàn chỉnh và đúng ngữ pháp 100%.'
    ]
  },
  {
    id: 'reading-matching-info',
    skill: 'reading',
    titleEn: 'Matching Information & Matching Features',
    titleVi: 'Nối thông tin vào đoạn văn / Nối đặc điểm nhà khoa học',
    frequency: 'Cao',
    difficultyLevel: 'Khó',
    descriptionVi: 'Tìm xem thông tin cụ thể (mô tả, kết quả nghiên cứu, quan điểm của chuyên gia) nằm ở đoạn văn nào (A, B, C...). Các câu hỏi không theo thứ tự bài đọc.',
    steps: [
      'Đọc kỹ câu hỏi và xác định loại thông tin cần tìm: một định nghĩa (a definition), một ví dụ (an example), một lý do (a reason), một dự đoán tương lai (a prediction).',
      'Nếu là dạng nối tên người (Matching Features): Scan toàn bộ tên các chuyên gia/nhà nghiên cứu trong bài đọc và gạch chân tất cả vị trí xuất hiện của họ.',
      'Đọc phần lời nói hoặc nghiên cứu của từng chuyên gia để nối với phát biểu tương ứng trong đề.'
    ],
    traps: [
      'Một đoạn có thể chứa nhiều hơn một câu trả lời nếu đề bài có ghi chú: "NB You may use any letter more than once".',
      'Chuyên gia xuất hiện ở nhiều đoạn khác nhau trong bài, cần kiểm tra tất cả các đoạn có tên họ.'
    ],
    tips: [
      'Gom các câu hỏi cùng tìm tên một người để làm một lượt, tiết kiệm thời gian đảo qua đảo lại bài đọc.'
    ]
  },
  {
    id: 'reading-multiple-choice',
    skill: 'reading',
    titleEn: 'Multiple Choice (Single & Multi-answer)',
    titleVi: 'Trắc nghiệm chọn đáp án đúng (A, B, C, D)',
    frequency: 'Cao',
    difficultyLevel: 'Khó',
    descriptionVi: 'Chọn 1 đáp án trong 4 phương án, hoặc chọn 2 trong 5 phương án. Các phương án sai (distractors) được gài bẫy rất tinh vi.',
    steps: [
      'Đọc phần câu hỏi (Stem) trước để hiểu câu hỏi muốn hỏi về điều gì. Chưa vội đọc 4 phương án để tránh bị nhiễu.',
      'Định vị đoạn văn trong bài nói về câu hỏi đó.',
      'Đọc kỹ 2-3 câu liên quan trong bài đọc để tự hình thành câu trả lời trong đầu.',
      'So sánh ý tưởng đó với 4 phương án A, B, C, D để tìm đáp án paraphrase chính xác nhất.',
      'Dùng phương pháp loại trừ (Elimination) để gạch bỏ 3 phương án gây nhiễu.'
    ],
    traps: [
      'Phương án có từ ngữ y hệt trong bài đọc nhưng ý nghĩa bị bóp méo hoặc ngược lại.',
      'Phương án đúng một nửa nhưng vế sau sai.',
      'Phương án nêu thông tin có trong bài nhưng không trả lời đúng câu hỏi đặt ra.'
    ],
    tips: [
      'Đáp án đúng thường dùng từ đồng nghĩa hoàn toàn khác biệt với bài đọc, ít khi bê nguyên xi từ ngữ trong bài.'
    ]
  },

  {
    id: 'reading-ynng',
    skill: 'reading',
    titleEn: 'Yes / No / Not Given (Writer\'s Views)',
    titleVi: 'Xác định quan điểm của tác giả: Yes / No / Not Given',
    frequency: 'Cao',
    difficultyLevel: 'Rất khó',
    descriptionVi: 'Giống True/False/Not Given nhưng hỏi về QUAN ĐIỂM và CLAIM của tác giả, không phải sự kiện. Bài đọc thường là văn nghị luận, có nhiều ý kiến của người khác xen lẫn ý của tác giả.',
    steps: [
      'Gạch chân chủ ngữ và động từ chính của nhận định, đặc biệt các từ thể hiện thái độ (should, must, doubtful, unlikely).',
      'Tìm đoạn bàn về chủ đề đó; câu hỏi luôn theo thứ tự xuất hiện trong bài.',
      'Tách rõ: ý của TÁC GIẢ hay ý của người được tác giả trích dẫn. Chỉ ý của tác giả mới tính.',
      'Cùng quan điểm, kể cả diễn đạt khác từ -> YES. Ngược quan điểm -> NO.',
      'Bài chỉ nói về chủ đề mà không cho biết tác giả nghĩ gì -> NOT GIVEN.'
    ],
    traps: [
      'Nhầm ý của một nhà nghiên cứu được trích dẫn với ý của tác giả.',
      'Từ chỉ mức độ (always, never, only, completely) trong nhận định mạnh hơn bài viết.',
      'Tự suy đoán thái độ tác giả từ kiến thức bên ngoài thay vì từ câu chữ.'
    ],
    tips: [
      'Hỏi mình: "Tác giả có NÓI rõ là mình nghĩ vậy không?". Không rõ thì nghiêng về NOT GIVEN.',
      'Chú ý từ đánh giá của tác giả: arguably, regrettably, it is clear that.',
      'Làm TFNG và YNNG bằng cùng một quy trình nhưng đổi chữ "sự kiện" thành "quan điểm".'
    ]
  },
  {
    id: 'reading-matching-features',
    skill: 'reading',
    titleEn: 'Matching Features',
    titleVi: 'Nối nhận định với người / lý thuyết / đối tượng',
    frequency: 'Cao',
    difficultyLevel: 'Khó',
    descriptionVi: 'Cho danh sách các nhà nghiên cứu, lý thuyết hoặc đối tượng (A, B, C...) và một loạt nhận định; nối mỗi nhận định với đúng người hoặc đối tượng. Thứ tự câu hỏi KHÔNG theo thứ tự bài đọc, và một lựa chọn có thể dùng nhiều lần.',
    steps: [
      'Đọc danh sách lựa chọn trước và khoanh tên từng người/đối tượng ngay trong bài khi gặp.',
      'Với mỗi nhận định, lấy 1-2 từ khóa không thể thay thế (số liệu, hành động, kết luận).',
      'Quét bài tìm từ khóa theo cách diễn đạt khác, rồi xem ý đó thuộc về ai.',
      'Kiểm tra lại đối tượng: cùng chủ đề nhưng khác người nói là bẫy phổ biến.'
    ],
    traps: [
      'Hai người cùng bàn một chủ đề nhưng chỉ một người nói đúng nhận định.',
      'Tên được nhắc ở đầu đoạn nhưng ý trong đoạn là của người khác.',
      'Quên rằng một lựa chọn có thể dùng nhiều lần nên bỏ sót.'
    ],
    tips: [
      'Khoanh tên mọi nhân vật ngay lần đọc đầu để lần sau chỉ cần quét.',
      'Làm các câu có từ khóa dễ tìm (số, tên riêng) trước.',
      'Nhận định luôn là diễn đạt lại, đừng tìm cụm từ giống hệt.'
    ]
  },
  {
    id: 'reading-matching-endings',
    skill: 'reading',
    titleEn: 'Matching Sentence Endings',
    titleVi: 'Ghép nửa câu đầu với phần kết đúng',
    frequency: 'Trung bình',
    difficultyLevel: 'Khó',
    descriptionVi: 'Cho phần đầu của câu và một danh sách phần kết; chọn phần kết ghép đúng để câu khớp với bài đọc. Câu hỏi theo thứ tự bài, nhưng số phần kết nhiều hơn số câu.',
    steps: [
      'Đọc phần đầu câu và đoán loại thông tin còn thiếu (nguyên nhân, kết quả, điều kiện, so sánh).',
      'Định vị câu tương ứng trong bài bằng từ khóa trong phần đầu.',
      'Loại phần kết sai ngữ pháp trước, rồi chọn phần kết đúng ý với bài.',
      'Đọc lại cả câu hoàn chỉnh xem có đúng ý bài, không chỉ đúng ngữ pháp.'
    ],
    traps: [
      'Phần kết nghe hợp lý ngoài đời nhưng bài không nói.',
      'Hai phần kết gần nghĩa nhau: chỉ một cái khớp chi tiết trong bài.',
      'Chọn theo ngữ pháp mà quên đối chiếu ý.'
    ],
    tips: [
      'Phần đầu câu thường lặp ý của bài, phần kết mới là thông tin cần tìm.',
      'Dùng phép loại trừ: gạch những phần kết đã dùng.',
      'Đọc to cả câu ghép trong đầu để kiểm tra mạch ý.'
    ]
  },
  {
    id: 'reading-sentence-completion',
    skill: 'reading',
    titleEn: 'Sentence Completion',
    titleVi: 'Điền từ vào chỗ trống trong câu',
    frequency: 'Rất cao (Luôn có)',
    difficultyLevel: 'Trung bình',
    descriptionVi: 'Hoàn thành câu bằng số từ giới hạn (thường tối đa 2-3 từ và/hoặc một số) lấy NGUYÊN VĂN từ bài. Thứ tự câu hỏi theo thứ tự bài đọc.',
    steps: [
      'Đọc yêu cầu giới hạn từ (NO MORE THAN TWO/THREE WORDS) trước tiên.',
      'Xác định loại từ cần điền (danh từ, tính từ, số) dựa vào ngữ pháp quanh chỗ trống.',
      'Tìm câu gốc trong bài bằng từ khóa; câu hỏi là diễn đạt lại của câu gốc.',
      'Chép từ đúng như trong bài, kiểm tra chính tả và số từ.'
    ],
    traps: [
      'Điền quá số từ cho phép là mất điểm dù đúng nghĩa.',
      'Điền từ đồng nghĩa thay vì từ trong bài.',
      'Sai ngữ pháp sau khi điền (số ít/số nhiều, mạo từ).'
    ],
    tips: [
      'Từ cần điền gần như luôn nằm sát cụm từ khóa trong bài.',
      'Đọc lại cả câu sau khi điền xem có trơn tru không.',
      'Số có thể viết bằng chữ số hoặc chữ nếu bài viết như vậy; theo đúng bài.'
    ]
  },
  {
    id: 'reading-table-flow-completion',
    skill: 'reading',
    titleEn: 'Table, Note & Flow-chart Completion',
    titleVi: 'Điền bảng, ghi chú, sơ đồ quy trình',
    frequency: 'Rất cao (Luôn có)',
    difficultyLevel: 'Trung bình',
    descriptionVi: 'Điền thông tin vào các ô của bảng, ghi chú hoặc sơ đồ các bước. Thông tin thường theo thứ tự từng cột/bước và ứng với một khối nội dung trong bài.',
    steps: [
      'Đọc tiêu đề bảng/sơ đồ để biết bài nói về quy trình hay so sánh.',
      'Xác định khối bài đọc ứng với từng hàng hoặc từng bước.',
      'Với mỗi ô trống, đoán loại từ cần điền rồi mới tìm trong bài.',
      'Điền đúng từ trong bài trong giới hạn số từ.'
    ],
    traps: [
      'Điền thông tin của hàng khác vào ô vì bài nói cạnh nhau.',
      'Nhầm thứ tự các bước trong sơ đồ.',
      'Bỏ sót đơn vị hoặc số kèm theo.'
    ],
    tips: [
      'Trong sơ đồ quy trình, tìm từ chỉ thứ tự: first, then, after that, finally.',
      'Các hàng của bảng thường ứng với các nhóm thông tin song song; so sánh các hàng để biết ô cần loại thông tin gì.',
      'Ô trống nằm cạnh nhau thường ứng với các câu liền nhau trong bài.'
    ]
  },
  {
    id: 'reading-short-answer',
    skill: 'reading',
    titleEn: 'Short-answer Questions',
    titleVi: 'Trả lời câu hỏi ngắn',
    frequency: 'Trung bình',
    difficultyLevel: 'Dễ',
    descriptionVi: 'Trả lời câu hỏi trực tiếp (What, Which, Who, How many...) bằng số từ giới hạn lấy từ bài. Rất thiên về thông tin cụ thể như tên, số, địa điểm.',
    steps: [
      'Gạch từ để hỏi để biết cần loại thông tin gì (người, nơi, số lượng, lý do).',
      'Quét bài tìm từ khóa của câu hỏi, đặc biệt tên riêng và số.',
      'Đọc kỹ câu chứa đáp án, chép lại đúng từ trong giới hạn.',
      'Kiểm tra đáp án trả lời đúng điều được hỏi, không phải thông tin ở gần.'
    ],
    traps: [
      'Chọn thông tin cạnh bên thay vì thông tin được hỏi.',
      'Vượt quá số từ cho phép.',
      'Viết sai chính tả tên riêng hoặc quên đơn vị.'
    ],
    tips: [
      'Từ để hỏi quyết định đáp án: Who ra tên người, How many ra số.',
      'Đáp án thường gói gọn trong một câu của bài.',
      'Nếu đáp án dài hơn giới hạn, bỏ từ phụ chứ đừng viết lại.'
    ]
  },

  // ==========================================
  // LISTENING QUESTION TYPES
  // ==========================================
  {
    id: 'listening-form-completion',
    skill: 'listening',
    titleEn: 'Form & Note Completion',
    titleVi: 'Điền biểu mẫu thông tin & Ghi chú (Part 1 & 4)',
    frequency: 'Rất cao (Luôn có)',
    difficultyLevel: 'Dễ',
    descriptionVi: 'Dạng bài chủ lực ở Part 1 (hội thoại thực tế) và Part 4 (bài giảng học thuật). Kiểm tra khả năng bắt số điện thoại, đánh vần tên riêng, địa chỉ và từ khóa.',
    steps: [
      'Tận dụng 30 giây chuẩn bị trước khi nghe để đọc lướt toàn bộ biểu mẫu.',
      'Xác định loại từ cần điền cho từng chỗ trống: Tên người, Số điện thoại, Mã bưu chính, Giá tiền, Ngày tháng, hay Danh từ số nhiều/số ít.',
      'Chú ý từ báo hiệu (Signpost words) ngay trước chỗ trống trong đề bài để sẵn sàng bấm giờ bắt từ.',
      'Lắng nghe bẫy đổi ý: người nói thường đưa ra một thông tin trước, sau đó sửa lại ("Oh sorry, I meant...").'
    ],
    traps: [
      'Bẫy tự đính chính (Self-correction trap): "My number is 077... oh wait, that is my old one, the new number is..."',
      'Đánh vần tên riêng: Nhầm lẫn giữa các cặp chữ cái như E và I, A và R, G và J.',
      'Số nhiều (-s/-es): Thiếu chữ "s" ở danh từ đếm được số nhiều là mất điểm hoàn toàn.'
    ],
    tips: [
      'Luôn viết hoa chữ cái đầu đối với tên riêng, tên đường và tên thành phố.',
      'Viết nháp nhanh ra giấy nếu chưa chắc chắn rồi kiểm tra chính tả trong 10 phút chuyển đáp án.'
    ]
  },
  {
    id: 'listening-map-labelling',
    skill: 'listening',
    titleEn: 'Map, Plan & Diagram Labelling',
    titleVi: 'Xác định vị trí trên Bản đồ & Sơ đồ (Part 2)',
    frequency: 'Cao',
    difficultyLevel: 'Khó',
    descriptionVi: 'Nghe người hướng dẫn miêu tả một địa điểm tham quan, công viên, khuôn viên trường học hoặc cấu tạo máy móc. Thường xuất hiện ở Part 2.',
    steps: [
      'Xác định điểm xuất phát (Starting point / "You are here"): Thường là cổng vào (Entrance/Main gate) hoặc quầy tiếp tân (Reception).',
      'Quan sát la bàn (Bắc - Nam - Đông - Tây) hoặc hướng trái - phải - trên - dưới của bản đồ.',
      'Ghi chú nhanh các mốc cố định đã có tên sẵn trên bản đồ (Hồ nước, Cầu, Tòa nhà trung tâm).',
      'Di chuyển ngòi bút hoặc con trỏ chuột theo đúng lời người nói khi họ dẫn đường.',
      'Ghi lại chữ cái tương ứng (A, B, C...) vào từng câu hỏi.'
    ],
    traps: [
      'Người nói dùng ngôn ngữ định hướng tương đối: "on your left", "just past the bend", "opposite the roundabout".',
      'Bẫy thay đổi hướng đi: "Instead of turning right, take the left corridor".'
    ],
    tips: [
      'Học thuộc các từ vựng chỉ vị trí không gian: adjacent to (sát cạnh), opposite (đối diện), situated between (nằm giữa), clockwise (thuận chiều kim đồng hồ).'
    ]
  },
  {
    id: 'listening-matching',
    skill: 'listening',
    titleEn: 'Classification & Matching',
    titleVi: 'Nối thông tin & Phân loại ý kiến (Part 3)',
    frequency: 'Cao',
    difficultyLevel: 'Khó',
    descriptionVi: 'Phổ biến ở Part 3 khi hai sinh viên và một giáo sư cùng thảo luận về một bài tập lớn hoặc dự án nghiên cứu.',
    steps: [
      'Đọc kỹ danh sách phương án lựa chọn (thường là A, B, C hoặc các đánh giá: Sẽ làm, Sẽ bỏ, Cần sửa thêm).',
      'Nhận biết giọng nói của từng nhân vật (giọng nam, giọng nữ, giọng giáo sư).',
      'Lắng nghe sự thỏa hiệp hoặc bất đồng ý kiến giữa các nhân vật trước khi đi đến quyết định cuối cùng.'
    ],
    traps: [
      'Nhân vật thứ nhất đề xuất một ý nhưng nhân vật thứ hai phản đối và đưa ra phương án khác được cả hai đồng ý.',
      'Dùng từ đồng nghĩa để diễn đạt lại nội dung phương án.'
    ],
    tips: [
      'Chỉ ghi nhận đáp án khi cả hai nhân vật đã đạt được sự đồng thuận (Consensus).'
    ]
  },

  {
    id: 'listening-mcq',
    skill: 'listening',
    titleEn: 'Multiple Choice',
    titleVi: 'Trắc nghiệm chọn đáp án đúng (Listening)',
    frequency: 'Rất cao (Luôn có)',
    difficultyLevel: 'Khó',
    descriptionVi: 'Nghe và chọn đáp án đúng trong ba phương án. Bẫy lớn nhất là người nói nhắc đến cả ba phương án nhưng sửa ý hoặc đổi quyết định.',
    steps: [
      'Đọc câu hỏi và gạch từ khóa của từng phương án trong thời gian được đọc đề.',
      'Nghe và đánh dấu từng phương án khi được nhắc, đừng chọn vội.',
      'Chờ đến khi người nói chốt ý cuối cùng (thường sau từ nối như actually, in the end, however).',
      'Chọn phương án khớp với ý chốt, không phải ý được nhắc đầu tiên.'
    ],
    traps: [
      'Người nói đổi ý hoặc tự sửa lại (I thought... but actually...).',
      'Phương án chứa đúng từ được nghe nhưng nói sai ý.',
      'Mất tập trung vì chờ nghe cụm từ y hệt trong đề.'
    ],
    tips: [
      'Phương án đúng thường là diễn đạt lại, không lặp từ nguyên văn.',
      'Chú ý ngữ điệu nhấn: câu có but, although, in fact thường chứa đáp án.',
      'Nếu lỡ câu, bỏ ngay và tập trung câu sau, đừng nghĩ lại.'
    ]
  },
  {
    id: 'listening-sentence-completion',
    skill: 'listening',
    titleEn: 'Sentence Completion',
    titleVi: 'Điền từ vào câu (Listening)',
    frequency: 'Rất cao (Luôn có)',
    difficultyLevel: 'Trung bình',
    descriptionVi: 'Điền từ vào chỗ trống trong câu tóm tắt nội dung bài nghe, với giới hạn số từ. Thứ tự câu theo thứ tự nghe.',
    steps: [
      'Đọc trước câu và đoán loại từ cần điền, giới hạn số từ.',
      'Nghe cụm từ đồng nghĩa với phần câu quanh chỗ trống để biết đáp án sắp tới.',
      'Chép đáp án vừa nghe, đúng chính tả, trong giới hạn từ.',
      'Chuyển sang câu tiếp theo ngay khi xong, đáp án tiếp theo xuất hiện liền sau.'
    ],
    traps: [
      'Nghe được nhưng viết sai chính tả hoặc sai số ít/số nhiều.',
      'Điền thừa từ so với giới hạn.',
      'Đáp án đầu bị sửa lại ngay sau đó.'
    ],
    tips: [
      'Số và tên được đọc rõ từng chữ; ghi ngay khi nghe.',
      'Dùng khoảng đọc đề để đoán trước.',
      'Dùng dấu hiệu chuyển ý (next, moving on) để bám theo bài.'
    ]
  },
  {
    id: 'listening-table-completion',
    skill: 'listening',
    titleEn: 'Table, Note & Flow-chart Completion',
    titleVi: 'Điền bảng, ghi chú, sơ đồ (Listening)',
    frequency: 'Rất cao (Luôn có)',
    difficultyLevel: 'Trung bình',
    descriptionVi: 'Điền thông tin vào bảng hoặc ghi chú trong lúc nghe một cuộc hội thoại về nhiều lựa chọn (khóa học, tour, lịch trình). Thông tin đi lần lượt theo thứ tự các hàng.',
    steps: [
      'Đọc hết bảng trong thời gian chuẩn bị để biết các hàng, các cột và loại thông tin (giá, ngày, tên).',
      'Nghe tên từng hàng/lựa chọn rồi mới ghi thông tin vào đúng ô.',
      'Chú ý người nói sửa số liệu hoặc ngày.',
      'Kiểm tra đơn vị và đúng số từ.'
    ],
    traps: [
      'Điền thông tin của lựa chọn A vào ô của B vì chúng được nói gần nhau.',
      'Người nói báo giá cũ rồi sửa thành giá mới.',
      'Nhầm số gần âm (15 và 50, 13 và 30).'
    ],
    tips: [
      'Viết số bằng chữ số, ngày bằng cách gọn.',
      'Chú ý từ báo hiệu thay đổi: actually, sorry, I meant.',
      'Nghe thấy tên hàng tiếp theo nghĩa là đã sang ô khác.'
    ]
  },
  {
    id: 'listening-short-answer',
    skill: 'listening',
    titleEn: 'Short-answer Questions',
    titleVi: 'Trả lời câu hỏi ngắn (Listening)',
    frequency: 'Trung bình',
    difficultyLevel: 'Trung bình',
    descriptionVi: 'Trả lời câu hỏi trực tiếp bằng số từ giới hạn từ phần nghe. Thường gặp trong Part 3 và Part 4.',
    steps: [
      'Đọc câu hỏi trước, gạch từ để hỏi và từ khóa.',
      'Nghe cụm từ khóa được diễn đạt lại rồi chuẩn bị ghi đáp án.',
      'Ghi đáp án ngắn gọn đúng giới hạn từ.',
      'Kiểm tra chính tả khi chuyển đáp án.'
    ],
    traps: [
      'Điền câu quá dài thay vì cụm từ ngắn.',
      'Chọn thông tin được nói trước khi người nói đổi ý.',
      'Chính tả sai tên riêng.'
    ],
    tips: [
      'Từ để hỏi định hướng loại thông tin cần ghi.',
      'Giữ đáp án ngắn: danh từ hoặc số.',
      'Chép đúng cách viết đã thấy trên đề nếu có.'
    ]
  },

  // ==========================================
  // WRITING TASK TYPES
  // ==========================================
  {
    id: 'writing-task-1-chart',
    skill: 'writing',
    titleEn: 'Academic Task 1: Trends & Comparisons',
    titleVi: 'Miêu tả Biểu đồ xu hướng & So sánh số liệu',
    frequency: 'Rất cao (Luôn có)',
    difficultyLevel: 'Trung bình',
    descriptionVi: 'Viết bài báo cáo học thuật tối thiểu 150 từ trong 20 phút miêu tả biểu đồ đường (Line graph), cột (Bar chart), tròn (Pie chart) hoặc bảng (Table).',
    steps: [
      'Phân tích đề bài (1 phút): Chủ đề biểu đồ là gì, đơn vị đo lường (triệu người, %, tấn...), mốc thời gian (quá khứ, hiện tại hay dự đoán tương lai để chia thì).',
      'Xác định Overview (Ý tổng quan quan trọng nhất): 1-2 xu hướng nổi bật nhất (tăng/giảm) và đối tượng có giá trị cao nhất/thấp nhất.',
      'Viết Mở bài (Introduction - 1 câu): Paraphrase lại đề bài bằng cấu trúc câu khác.',
      'Viết Overview (1-2 câu): Bắt đầu bằng "Overall, it is clear that...". Không đưa số liệu chi tiết vào Overview.',
      'Viết Body 1 & Body 2: Gom nhóm số liệu hợp lý, so sánh tương quan và đưa số liệu dẫn chứng cụ thể.'
    ],
    traps: [
      'Liệt kê từng số liệu đơn lẻ như đọc bảng thống kê mà không so sánh tương quan.',
      'Quên viết Overview -> Bị khống chế điểm Task Achievement dưới Band 5.0.',
      'Đưa quan điểm cá nhân hoặc giải thích nguyên nhân ("vì sao số liệu tăng") -> Task 1 chỉ miêu tả số liệu, tuyệt đối không suy diễn.'
    ],
    tips: [
      'Chuẩn bị sẵn kho từ vựng chỉ xu hướng đa dạng: rocket, plunge, fluctuate, level off, reach a peak of.'
    ]
  },
  {
    id: 'writing-task-1-process-map',
    skill: 'writing',
    titleEn: 'Academic Task 1: Process & Map',
    titleVi: 'Miêu tả Quy trình sản xuất / Bản đồ thay đổi',
    frequency: 'Cao',
    difficultyLevel: 'Khó',
    descriptionVi: 'Miêu tả quy trình sản xuất nhân tạo (Man-made process), chu trình tự nhiên (Natural cycle) hoặc sự thay đổi của một khu vực qua 2 thời kỳ.',
    steps: [
      'Với Process: Đếm tổng số bước từ nguyên liệu đầu vào (Input) đến thành phẩm đầu ra (Output).',
      'Với Map: Xác định các thay đổi chính: mở rộng, phá bỏ, xây mới, thay thế công năng.',
      'Sử dụng triệt để câu bị động (Passive voice) đối với quy trình nhân tạo.',
      'Dùng các liên từ chỉ thứ tự thời gian: Initially, in the subsequent stage, following this, eventually.'
    ],
    traps: [
      'Dùng câu chủ động cho quy trình sản xuất công nghiệp.',
      'Bỏ sót một bước trong quy trình.'
    ],
    tips: [
      'Đối với Map: Luôn sử dụng từ ngữ định hướng chuẩn mực: In the north-eastern corner, adjacent to, converted into.'
    ]
  },
  {
    id: 'writing-task-2-opinion',
    skill: 'writing',
    titleEn: 'Writing Task 2: Opinion Essay (Agree or Disagree)',
    titleVi: 'Bài luận bày tỏ quan điểm cá nhân',
    frequency: 'Rất cao (Luôn có)',
    difficultyLevel: 'Khó',
    descriptionVi: 'Viết bài luận học thuật tối thiểu 250 từ trong 40 phút trả lời câu hỏi "To what extent do you agree or disagree?".',
    steps: [
      'Phân tích đề và lập dàn ý (5 phút): Xác định rõ lập trường của mình (Hoàn toàn đồng ý / Hoàn toàn phản đối / Đồng ý một phần có điều kiện).',
      'Mở bài (2 câu): Dẫn dắt vấn đề + Nêu rõ quan điểm của mình (Thesis statement).',
      'Thân bài 1 (Body 1): Giải thích lý do thứ nhất kèm ví dụ thực tế.',
      'Thân bài 2 (Body 2): Giải thích lý do thứ hai hoặc phân tích khía cạnh đối lập.',
      'Kết bài (Conclusion - 1-2 câu): Tóm lược lại quan điểm mà không đưa ý mới vào.'
    ],
    traps: [
      'Không nêu rõ quan điểm ở Mở bài khiến người chấm không thấy Thesis statement.',
      'Đưa ra quá nhiều ý tưởng nhưng không phát triển sâu (Idea listing). Chỉ nên chọn 2 ý tưởng mạnh nhất và đào sâu đến cùng (Lý do -> Cơ chế -> Ví dụ minh họa).'
    ],
    tips: [
      'Phát triển đoạn văn theo cấu trúc P.E.E.L: Point (Ý chính) -> Explanation (Giải thích cơ chế) -> Example (Ví dụ chứng minh) -> Link (Câu liên kết kết luận).'
    ]
  },

  // ==========================================
  // SPEAKING SKILL DRILLS
  // ==========================================
  {
    id: 'speaking-part-1-expansion',
    skill: 'speaking',
    titleEn: 'Speaking Part 1: Fluency & Answer Expansion',
    titleVi: 'Kỹ thuật mở rộng câu trả lời tự nhiên (Part 1)',
    frequency: 'Rất cao (Luôn có)',
    difficultyLevel: 'Dễ',
    descriptionVi: 'Phần thi khởi động kéo dài 4-5 phút với các câu hỏi ngắn về đời sống cá nhân. Tránh trả lời cộc lốc một câu "Yes/No".',
    steps: [
      'Áp dụng công thức AREA: A (Direct Answer - Trả lời thẳng vào câu hỏi) -> R (Reason - Nêu lý do vì sao) -> E (Example - Dẫn chứng cụ thể trải nghiệm bản thân) -> A (Alternative - So sánh với người khác hoặc quá khứ).',
      'Duy trì độ dài chuẩn: 2 đến 4 câu hoàn chỉnh cho mỗi câu hỏi Part 1 (khoảng 15-25 giây).'
    ],
    traps: [
      'Trả lời quá ngắn: "Do you like music? - Yes, I like music very much." -> Giám khảo không có đủ mẫu lời nói để đánh giá từ vựng và ngữ pháp.',
      'Học vẹt các câu mẫu hoa mỹ không tự nhiên.'
    ],
    tips: [
      'Dùng các từ đệm tự nhiên (Fillers & Discourse markers): "To be quite frank...", "Well, as a matter of fact...", "I would say that..."'
    ]
  },
  {
    id: 'speaking-part-2-structuring',
    skill: 'speaking',
    titleEn: 'Speaking Part 2: 1-Minute Note-Taking & 2-Minute Long Turn',
    titleVi: 'Kỹ thuật ghi chú 1 phút & Duy trì bài nói 2 phút (Part 2)',
    frequency: 'Rất cao (Luôn có)',
    difficultyLevel: 'Khó',
    descriptionVi: 'Giám khảo đưa một thẻ gợi ý (Cue card). Thí sinh có đúng 1 phút chuẩn bị và phải nói liên tục từ 1.5 đến 2 phút.',
    steps: [
      'Trong 1 phút chuẩn bị: Ghi nhanh từ khóa (Keywords) theo từng gạch đầu dòng của đề, tuyệt đối KHÔNG viết thành câu hoàn chỉnh vì sẽ không đủ giờ.',
      'Áp dụng phương pháp kể chuyện (Storytelling): Mở đầu bối cảnh (Thời gian, không gian, nhân vật), diễn biến cao trào, và cảm xúc cá nhân sâu sắc ở phần kết bài.',
      'Sử dụng đa dạng thì thời: Quá khứ đơn để kể diễn biến, hiện tại hoàn thành để liên hệ đến bây giờ, và câu điều kiện/giả định cho cảm nhận.'
    ],
    traps: [
      'Hết ý sau 1 phút nói và rơi vào im lặng.',
      'Cố nhìn chằm chằm vào tờ giấy nháp để đọc lại từng chữ thay vì giao tiếp ánh mắt tự nhiên với giám khảo.'
    ],
    tips: [
      'Dành phần lớn thời gian (khoảng 40-50 giây) cho gạch đầu dòng cuối cùng ("and explain why...") vì đây là phần đắt giá nhất để phô diễn từ vựng trừu tượng và ngữ pháp phức tạp.'
    ]
  },
  {
    id: 'speaking-part-3-discussion',
    skill: 'speaking',
    titleEn: 'Speaking Part 3: Abstract Discussion',
    titleVi: 'Thảo luận chuyên sâu & lập luận (Part 3)',
    frequency: 'Rất cao (Luôn có)',
    difficultyLevel: 'Khó',
    descriptionVi: 'Giám khảo hỏi các câu trừu tượng, mang tính xã hội, nối từ chủ đề Part 2. Thí sinh phải nêu quan điểm, so sánh, dự đoán và giải thích nguyên nhân – hệ quả.',
    steps: [
      'Trả lời thẳng quan điểm trong một câu ("I would say that...", "In my view...").',
      'Đưa lý do, rồi một ví dụ mang tính xã hội (không chỉ chuyện cá nhân).',
      'Mở rộng bằng so sánh (thế hệ, quốc gia, quá khứ – hiện tại) hoặc dự đoán tương lai.',
      'Kết bằng một câu ngắn khẳng định lại ý chính, dài khoảng 25-40 giây mỗi câu.'
    ],
    traps: [
      'Chỉ kể trải nghiệm bản thân trong khi câu hỏi hỏi về xã hội nói chung.',
      'Trả lời "It depends" rồi dừng, không giải thích phụ thuộc vào điều gì.'
    ],
    tips: [
      'Dùng cấu trúc đối lập: "On the one hand... on the other hand..." và các cụm giả định "If that were the case, ...".'
    ]
  }
];

export function getQuestionTypeById(id: string): IeltsQuestionTypeMeta | undefined {
  return IELTS_QUESTION_TYPES.find((t) => t.id === id);
}

export function getQuestionTypesBySkill(skill: IeltsSkill): IeltsQuestionTypeMeta[] {
  return IELTS_QUESTION_TYPES.filter((t) => t.skill === skill);
}
