/**
 * KHO ĐỀ CHUẨN: CAMBRIDGE IELTS (CAM 12 - 20) & ACTUAL TEST VOLUMES (VOL 1 - 6)
 *
 * Cung cấp đầy đủ cấu trúc 4 kỹ năng:
 * - Reading: 3 Passages, 40 câu hỏi chuẩn mọi dạng (TFNG, YNNG, MCQ, Matching Headings, Summary/Note Completion, Table/Diagram Labeling),
 *   Answer Keys, Giải thích chi tiết bằng tiếng Việt và Vị trí trích dẫn trong bài (Locate in passage).
 * - Listening: 4 Parts, Transcript chi tiết có đánh dấu vị trí đáp án, 40 câu hỏi.
 * - Writing: Task 1 (biểu đồ/quy trình) & Task 2, Bài mẫu Band 8.5 - 9.0.
 * - Speaking: Parts 1, 2, 3 kèm bài mẫu Band 8.5 - 9.0.
 */

export type IeltsSection = 'Reading' | 'Listening' | 'Writing' | 'Speaking';
export type IeltsCollection = 'cambridge' | 'vol';

export type IeltsQuestionType =
  | 'TRUE_FALSE_NOT_GIVEN'
  | 'YES_NO_NOT_GIVEN'
  | 'MULTIPLE_CHOICE'
  | 'MATCHING_HEADINGS'
  | 'MATCHING_INFORMATION'
  | 'MATCHING_FEATURES'
  | 'SUMMARY_COMPLETION'
  | 'NOTE_COMPLETION'
  | 'SENTENCE_COMPLETION'
  | 'DIAGRAM_LABELING'
  | 'SHORT_ANSWER';

export type IeltsQuestionDetail = {
  number: number;
  type: IeltsQuestionType;
  prompt: string;
  options?: string[];
  answer: string | string[];
  explanationVi: string;
  locateInPassage: string;
  paraphrase?: { keyword: string; inPassage: string };
};

export type IeltsPassage = {
  passageNumber: 1 | 2 | 3;
  title: string;
  subtitle?: string;
  text: string;
  questions: IeltsQuestionDetail[];
};

export type IeltsListeningPart = {
  part: 1 | 2 | 3 | 4;
  title: string;
  context: string;
  transcript: string;
  questions: IeltsQuestionDetail[];
};

export type IeltsWritingTask = {
  task1: {
    prompt: string;
    chartType: 'bar' | 'line' | 'pie' | 'table' | 'map' | 'process';
    chartDescription: string;
    modelAnswerBand9: string;
  };
  task2: {
    prompt: string;
    essayType: 'opinion' | 'discussion' | 'problem_solution' | 'two_part';
    modelAnswerBand9: string;
  };
};

export type IeltsSpeakingContent = {
  part1: Array<{ question: string; modelAnswerBand9: string }>;
  part2: {
    cueCardPrompt: string;
    bullets: string[];
    modelAnswerBand9: string;
  };
  part3: Array<{ question: string; modelAnswerBand9: string }>;
};

export type IeltsTestPackage = {
  id: string;
  title: string;
  collection: IeltsCollection;
  volume: number;
  testNumber: number;
  section: IeltsSection;
  questionCount: number;
  questionTypes: IeltsQuestionType[];
  topics: string[];
  passages?: IeltsPassage[];
  listeningParts?: IeltsListeningPart[];
  writingTask?: IeltsWritingTask;
  speakingContent?: IeltsSpeakingContent;
  answerKey: Record<string, string | string[]>;
  explanations: Record<string, { vi: string; locate: string; paraphrase?: string }>;
  /** false = đáp án chưa có bản in để đối chiếu; mặc định coi là đã xác minh. */
  answerKeyVerified?: boolean;
};

/**
 * Master catalog of Cambridge IELTS (Cam 12-20) and Actual Test Volumes (Vol 1-6).
 */
export const CAM_VOL_TEST_PACKAGES: IeltsTestPackage[] = [
  {
    "id": "cambridge-17-reading-2",
    "title": "Cambridge IELTS 17 · Reading Test 2",
    "collection": "cambridge",
    "volume": 17,
    "testNumber": 2,
    "section": "Reading",
    "questionCount": 40,
    "topics": [
      "Dead Sea Scrolls",
      "Re-domesticating the Tomato (CRISPR)",
      "Insight vs Evolution in Innovation"
    ],
    "questionTypes": [
      "NOTE_COMPLETION",
      "TRUE_FALSE_NOT_GIVEN",
      "MATCHING_INFORMATION",
      "MATCHING_FEATURES",
      "SENTENCE_COMPLETION",
      "MULTIPLE_CHOICE",
      "YES_NO_NOT_GIVEN",
      "SUMMARY_COMPLETION"
    ],
    "answerKey": {
      "1": "rock",
      "2": "cave",
      "3": "clay",
      "4": "Essenes",
      "5": "Hebrew",
      "6": "NOT GIVEN",
      "7": "FALSE",
      "8": "TRUE",
      "9": "TRUE",
      "10": "FALSE",
      "11": "FALSE",
      "12": "TRUE",
      "13": "NOT GIVEN",
      "14": "C",
      "15": "B",
      "16": "E",
      "17": "A",
      "18": "C",
      "19": "B",
      "20": "D",
      "21": "A",
      "22": "C",
      "23": "A",
      "24": "flavour/flavor",
      "25": "size",
      "26": "salt",
      "27": "D",
      "28": "A",
      "29": "A",
      "30": "C",
      "31": "A",
      "32": "NO",
      "33": "NOT GIVEN",
      "34": "YES",
      "35": "NO",
      "36": "NOT GIVEN",
      "37": "F",
      "38": "D",
      "39": "E",
      "40": "B"
    },
    "explanations": {
      "1": {
        "vi": "Một cậu bé ném hòn đá vào miệng hang.",
        "locate": "Đoạn 1"
      },
      "2": {
        "vi": "Các thiếu niên đi vào hang và thấy nhiều bình.",
        "locate": "Đoạn 1"
      },
      "3": {
        "vi": "Các bình được làm bằng đất sét.",
        "locate": "Đoạn 1"
      },
      "4": {
        "vi": "Học giả cho rằng người viết thuộc nhóm Essenes.",
        "locate": "Đoạn 2"
      },
      "5": {
        "vi": "Phần lớn văn bản viết bằng tiếng Hebrew.",
        "locate": "Đoạn 3"
      },
      "6": {
        "vi": "Bài chỉ nói họ bán với giá nhỏ, không nói họ thất vọng.",
        "locate": "Đoạn 1 (không có thông tin)"
      },
      "7": {
        "vi": "Nguồn gốc cuộn giấy vẫn còn tranh luận, nên khẳng định có đồng thuận là sai.",
        "locate": "Đoạn 2"
      },
      "8": {
        "vi": "Chỉ sách Isaiah còn nguyên vẹn, các sách khác thiếu.",
        "locate": "Đoạn 4"
      },
      "9": {
        "vi": "Cuộn đồng dùng từ vựng và chính tả khác thường.",
        "locate": "Đoạn 5"
      },
      "10": {
        "vi": "Mar Samuel mua các cuộn giấy, không được tặng.",
        "locate": "Đoạn 6"
      },
      "11": {
        "vi": "Ông chào bán không thành công cho các trường đại học Mỹ.",
        "locate": "Đoạn 6"
      },
      "12": {
        "vi": "Cuộn phục dựng năm 2017 nêu các lễ hằng năm của cộng đồng.",
        "locate": "Đoạn 7"
      },
      "13": {
        "vi": "Bài chỉ nói còn một cuộn chưa dịch, không nói ai đang giải mã.",
        "locate": "Đoạn 7 (không có thông tin)"
      },
      "14": {
        "vi": "Nhóm Trung Quốc tạo giống kháng bệnh đốm vi khuẩn.",
        "locate": "Đoạn C"
      },
      "15": {
        "vi": "Chọn giống từ một cây đơn lẻ làm mất đa dạng di truyền và đôi khi kèm đặc tính xấu.",
        "locate": "Đoạn B"
      },
      "16": {
        "vi": "Đoạn E kể tên nhiều loài hoang dã có thể thành cây lương thực.",
        "locate": "Đoạn E"
      },
      "17": {
        "vi": "Đoạn A đặt mốc hàng nghìn năm so với chưa đầy ba năm.",
        "locate": "Đoạn A"
      },
      "18": {
        "vi": "Kudla nhận xét về vị đậm và thơm của cà chua chỉnh sửa.",
        "locate": "Đoạn C"
      },
      "19": {
        "vi": "Gao nói chọn cây chịu hạn, chịu nóng giúp thích nghi khi khí hậu ấm lên.",
        "locate": "Đoạn E (Gao)"
      },
      "20": {
        "vi": "Jones nghi ngờ cây lạ khó thành cây lương thực chủ lực.",
        "locate": "Đoạn E (Jones)"
      },
      "21": {
        "vi": "Kudla không muốn tiết lộ loài sắp nghiên cứu.",
        "locate": "Đoạn E (Kudla)"
      },
      "22": {
        "vi": "Van Eck nói chi phí giấy phép và phê duyệt cản trở việc mở rộng.",
        "locate": "Đoạn D (Van Eck)"
      },
      "23": {
        "vi": "Kudla nêu con số 50.000 loài ăn được nhưng chỉ 15 loại cho phần lớn năng lượng.",
        "locate": "Đoạn A (Kudla)"
      },
      "24": {
        "vi": "Cà chua siêu thị mất nhiều hương vị.",
        "locate": "Đoạn B"
      },
      "25": {
        "vi": "Kích thước quả tăng gấp ba khi chỉnh gen FRUITWEIGHT.",
        "locate": "Đoạn C"
      },
      "26": {
        "vi": "Giống mới chịu mặn tốt hơn và giàu vitamin C.",
        "locate": "Đoạn C"
      },
      "27": {
        "vi": "Đoạn 1 mô tả quan niệm phổ biến về thiên tài.",
        "locate": "Đoạn 1"
      },
      "28": {
        "vi": "Đoạn 2 phản bác quan điểm đó là đã bóp méo bản chất khám phá.",
        "locate": "Đoạn 2"
      },
      "29": {
        "vi": "Darwin và Einstein được nêu như ngoại lệ trước khi đề xuất thử nghiệm-sai sót.",
        "locate": "Đoạn 3"
      },
      "30": {
        "vi": "Ý tưởng của Nicholson trở thành nền cho mô hình của Bohr.",
        "locate": "Đoạn 4"
      },
      "31": {
        "vi": "Điểm đáng chú ý là lý do giản dị: chấn thương chân.",
        "locate": "Đoạn 6"
      },
      "32": {
        "vi": "Tác giả cho rằng gọi người là thiên tài chỉ dán nhãn chứ không giải thích.",
        "locate": "Đoạn 9"
      },
      "33": {
        "vi": "Bài không nêu bối cảnh các nhà tâm lý lúc đó có đang tìm lý do khoa học cho sáng tạo hay không.",
        "locate": "Đoạn 10 (không có thông tin)"
      },
      "34": {
        "vi": "Luật Hiệu quả là quá trình cơ học, không có mục đích định trước.",
        "locate": "Đoạn 10"
      },
      "35": {
        "vi": "Nguồn gốc nguyên liệu của ý tưởng mới vẫn chưa rõ.",
        "locate": "Đoạn 11"
      },
      "36": {
        "vi": "Bài không nói nhiều nhà khoa học đang bỏ quan niệm thiên tài.",
        "locate": "Đoạn 12 (không có thông tin)"
      },
      "37": {
        "vi": "Quan niệm truyền thống: đột phá đến từ cảm hứng bất chợt.",
        "locate": "Đoạn 1"
      },
      "38": {
        "vi": "Lý thuyết sai của Nicholson là ví dụ cho sai lầm.",
        "locate": "Đoạn 4"
      },
      "39": {
        "vi": "Phát minh Post-it xuất phát từ may mắn.",
        "locate": "Đoạn 7"
      },
      "40": {
        "vi": "Cả hai quy luật có thể không có mục tiêu rõ ràng.",
        "locate": "Đoạn 10"
      }
    }
  },
  {
    "id": "cambridge-18-reading-2",
    "title": "Cambridge IELTS 18 · Reading Test 2",
    "collection": "cambridge",
    "volume": 18,
    "testNumber": 2,
    "section": "Reading",
    "questionCount": 40,
    "topics": [
      "Stonehenge",
      "Living with Artificial Intelligence",
      "Leonardo da Vinci's Ideal City"
    ],
    "questionTypes": [
      "NOTE_COMPLETION",
      "TRUE_FALSE_NOT_GIVEN",
      "MULTIPLE_CHOICE",
      "YES_NO_NOT_GIVEN",
      "SUMMARY_COMPLETION"
    ],
    "answerKey": {
      "1": "(deer) antlers",
      "2": "(timber) posts",
      "3": "tree trunks",
      "4": "oxen",
      "5": "glaciers",
      "6": "druids",
      "7": "burial",
      "8": "calendar",
      "9": "TRUE",
      "10": "FALSE",
      "11": "FALSE",
      "12": "TRUE",
      "13": "NOT GIVEN",
      "14": "C",
      "15": "A",
      "16": "B",
      "17": "D",
      "18": "C",
      "19": "D",
      "20": "YES",
      "21": "NOT GIVEN",
      "22": "NO",
      "23": "YES",
      "24": "C",
      "25": "A",
      "26": "E",
      "27": "NOT GIVEN",
      "28": "NOT GIVEN",
      "29": "TRUE",
      "30": "FALSE",
      "31": "TRUE",
      "32": "NOT GIVEN",
      "33": "FALSE",
      "34": "transport",
      "35": "staircases",
      "36": "engineering",
      "37": "rule",
      "38": "Roman",
      "39": "Paris",
      "40": "outwards"
    },
    "explanations": {
      "1": {
        "vi": "Công cụ đào mương có thể làm từ gạc hươu.",
        "locate": "Đoạn 2"
      },
      "2": {
        "vi": "Các hố sâu có thể từng giữ cột gỗ.",
        "locate": "Đoạn 2"
      },
      "3": {
        "vi": "Thuyết cổ điển dùng thân cây làm xe trượt và con lăn.",
        "locate": "Đoạn 4"
      },
      "4": {
        "vi": "Bò kéo các giỏ lớn đặt trên bi và ván.",
        "locate": "Đoạn 4"
      },
      "5": {
        "vi": "Nhà địa chất cho rằng băng hà mang đá tới.",
        "locate": "Đoạn 5"
      },
      "6": {
        "vi": "Thế kỷ 17 có giả thuyết người xây là các druid Celt.",
        "locate": "Đoạn 7"
      },
      "7": {
        "vi": "Đa số học giả đồng ý nơi này từng là khu chôn cất.",
        "locate": "Đoạn 9"
      },
      "8": {
        "vi": "Thập niên 1960 có ý kiến nó hoạt động như lịch.",
        "locate": "Đoạn 10"
      },
      "9": {
        "vi": "Đá sa thạch đặt cả vòng ngoài lẫn ở giữa.",
        "locate": "Đoạn 6"
      },
      "10": {
        "vi": "Đá xanh được dời nhiều lần tới khoảng 1600 TCN, nên không chứng minh đứng yên.",
        "locate": "Đoạn 6"
      },
      "11": {
        "vi": "Niên đại phóng xạ cho thấy di tích cổ hơn người Celt, trái với giả thuyết Aubrey.",
        "locate": "Đoạn 7"
      },
      "12": {
        "vi": "Hiện vật gợi ý nhiều nhóm người cùng xây.",
        "locate": "Đoạn 8"
      },
      "13": {
        "vi": "Bài không nói giới thiên văn là người phê bình chính.",
        "locate": "Đoạn 10 (không có thông tin)"
      },
      "14": {
        "vi": "Nhiều chuyên gia cho rằng giới hạn của AI hẹp chỉ là tạm thời.",
        "locate": "Đoạn 1"
      },
      "15": {
        "vi": "Đoạn 2 giải thích máy không bị các giới hạn vật lý như não người.",
        "locate": "Đoạn 2"
      },
      "16": {
        "vi": "Chuyện vua Midas minh hoạ mục tiêu mơ hồ gây hậu quả.",
        "locate": "Đoạn 3"
      },
      "17": {
        "vi": "Thách thức là AI phải thân thiện hơn chính con người.",
        "locate": "Đoạn 4"
      },
      "18": {
        "vi": "Máy sẽ vượt trội hơn người về một số mặt, kể cả đạo đức.",
        "locate": "Đoạn 5"
      },
      "19": {
        "vi": "Khuyết điểm của con người khiến việc tạo ra máy phù hợp khó hơn.",
        "locate": "Đoạn 6"
      },
      "20": {
        "vi": "Máy đạo đức có thể ngăn ta thiên vị cộng đồng mình.",
        "locate": "Đoạn 8"
      },
      "21": {
        "vi": "Bài không nói về số lượng cảnh sát silicon.",
        "locate": "Đoạn 8 (không có thông tin)"
      },
      "22": {
        "vi": "Tác giả nói ít ai hoan nghênh viễn cảnh đó.",
        "locate": "Đoạn 8"
      },
      "23": {
        "vi": "Cần tinh thần hợp tác để hướng AI đúng hướng.",
        "locate": "Đoạn 10"
      },
      "24": {
        "vi": "AI hiện chỉ có vai trò nhỏ trong phân bổ nguồn lực y tế.",
        "locate": "Đoạn 9"
      },
      "25": {
        "vi": "Bác sĩ cấp cao sẽ mất một số quyền kiểm soát.",
        "locate": "Đoạn 9"
      },
      "26": {
        "vi": "Họ mất quyền hạn chuyên môn.",
        "locate": "Đoạn 9"
      },
      "27": {
        "vi": "Bài không nói ai là người đầu tiên gọi Leonardo là thiên tài cách đây 500 năm.",
        "locate": "Đoạn 1 (không có thông tin)"
      },
      "28": {
        "vi": "Bài không so sánh số người chết vì khủng hoảng khí hậu với dịch hạch.",
        "locate": "Đoạn 2 (không có thông tin)"
      },
      "29": {
        "vi": "Khủng hoảng khí hậu được so với dịch hạch thế kỷ 14.",
        "locate": "Đoạn 2"
      },
      "30": {
        "vi": "Thành phố lý tưởng không xây vì chi phí quá cao.",
        "locate": "Đoạn 3"
      },
      "31": {
        "vi": "Mô hình đô thị không bền vững là nguyên nhân chính của biến đổi khí hậu.",
        "locate": "Đoạn 3"
      },
      "32": {
        "vi": "Bài không nói người dân phản đối việc cải tạo Pienza và Ferrara.",
        "locate": "Đoạn 4 (không có thông tin)"
      },
      "33": {
        "vi": "Ghi chép của ông lộn xộn, trái với khẳng định.",
        "locate": "Đoạn 5"
      },
      "34": {
        "vi": "Thành phố cạnh sông Ticino thuận lợi cho vận chuyển hàng hoá.",
        "locate": "Đoạn 5"
      },
      "35": {
        "vi": "Cầu thang ngoài trời nối các tầng.",
        "locate": "Đoạn 6"
      },
      "36": {
        "vi": "Chuyên môn kỹ thuật thể hiện qua hệ thống kênh nhân tạo.",
        "locate": "Đoạn 7"
      },
      "37": {
        "vi": "Chiều rộng đường tương ứng chiều cao nhà, quy tắc còn dùng ở Ý.",
        "locate": "Đoạn 7"
      },
      "38": {
        "vi": "Một số đặc điểm đã tồn tại ở các thành phố La Mã.",
        "locate": "Đoạn 8"
      },
      "39": {
        "vi": "Paris được cải tạo thế kỷ 19 theo hướng tương tự.",
        "locate": "Đoạn 8"
      },
      "40": {
        "vi": "Phát triển hướng ra ngoài không còn là cách tốt nhất.",
        "locate": "Đoạn 9"
      }
    }
  },
  // ==========================================
  // CAMBRIDGE IELTS 19 - READING TEST 1
  // ==========================================
  {
    "id": "cambridge-19-reading-1",
    "title": "Cambridge IELTS 19 · Reading Test 1",
    "collection": "cambridge",
    "volume": 19,
    "testNumber": 1,
    "section": "Reading",
    "questionCount": 40,
    "topics": [
      "Tennis Racket Technology",
      "Ancient Mediterranean Piracy",
      "The Psychology of Misinformation"
    ],
    "questionTypes": [
      "TRUE_FALSE_NOT_GIVEN",
      "NOTE_COMPLETION",
      "MATCHING_INFORMATION",
      "MULTIPLE_CHOICE",
      "SUMMARY_COMPLETION",
      "YES_NO_NOT_GIVEN"
    ],
    "answerKey": {
      "1": "FALSE",
      "2": "FALSE",
      "3": "NOT GIVEN",
      "4": "FALSE",
      "5": "NOT GIVEN",
      "6": "TRUE",
      "7": "TRUE",
      "8": "paint",
      "9": "topspin",
      "10": "training",
      "11": "intestines/gut",
      "12": "weights",
      "13": "grips",
      "14": "D",
      "15": "G",
      "16": "C",
      "17": "A",
      "18": "G",
      "19": "B",
      "20": "B",
      "21": "D",
      "22": "C",
      "23": "E",
      "24": "grain",
      "25": "punishment",
      "26": "ransom",
      "27": "D",
      "28": "A",
      "29": "C",
      "30": "D",
      "31": "G",
      "32": "J",
      "33": "H",
      "34": "B",
      "35": "E",
      "36": "C",
      "37": "YES",
      "38": "NOT GIVEN",
      "39": "NO",
      "40": "NOT GIVEN"
    },
    "explanations": {
      "1": {
        "vi": "Năm năm trước 2016, Murray chỉ được coi là tay vợt tiềm năng nhưng chưa vô địch, nên không ai kỳ vọng sớm.",
        "locate": "Đoạn 1"
      },
      "2": {
        "vi": "Thay đổi dây của Murray tinh tế đến mức gần như không ai để ý.",
        "locate": "Đoạn 2"
      },
      "3": {
        "vi": "Bài không nói số đông tay vợt hàng đầu mang theo thợ căng dây.",
        "locate": "Đoạn về chỉnh vợt (không có thông tin)"
      },
      "4": {
        "vi": "Vợt của anh em Bryan nặng hơn mức trung bình.",
        "locate": "Đoạn về chỉnh vợt"
      },
      "5": {
        "vi": "Bài không nói Fischer tự thiết kế cây vợt.",
        "locate": "Đoạn về Fischer (không có thông tin)"
      },
      "6": {
        "vi": "Điều kiện thời tiết ảnh hưởng cách tay vợt chỉnh dây.",
        "locate": "Đoạn về căng dây"
      },
      "7": {
        "vi": "Sức giao bóng mạnh của Sampras được cho là nhờ thêm chì vào vợt.",
        "locate": "Đoạn về chỉnh khung vợt"
      },
      "8": {
        "vi": "Anh em Bryan thử nghiệm nhiều loại sơn trên khung vợt.",
        "locate": "Đoạn về chỉnh vợt"
      },
      "9": {
        "vi": "Vợt dây thưa bị cấm vì tạo quá nhiều xoáy.",
        "locate": "Đoạn về Fischer"
      },
      "10": {
        "vi": "Chỉnh vợt quan trọng ngang với dinh dưỡng và luyện tập.",
        "locate": "Đoạn về Fischer"
      },
      "11": {
        "vi": "Dây tự nhiên làm từ ruột cừu hoặc bò.",
        "locate": "Đoạn về dây tự nhiên"
      },
      "12": {
        "vi": "Sampras thêm các miếng chì vào khung vợt.",
        "locate": "Đoạn về chỉnh khung vợt"
      },
      "13": {
        "vi": "Oliveira thay cán vợt bằng loại mỏng hơn.",
        "locate": "Đoạn về cán vợt"
      },
      "14": {
        "vi": "Vua Alashiya phủ nhận mối liên hệ của dân mình với nhóm Lukka.",
        "locate": "Đoạn D"
      },
      "15": {
        "vi": "Pompey chia Địa Trung Hải thành 13 khu và dọn từng khu.",
        "locate": "Đoạn G"
      },
      "16": {
        "vi": "Chính quyền thuê hải tặc nhất là thời chiến.",
        "locate": "Đoạn C"
      },
      "17": {
        "vi": "Hình ảnh hải tặc trong mắt người ngày nay ở Caribe.",
        "locate": "Đoạn A"
      },
      "18": {
        "vi": "Hải tặc được cấp đất để không quay lại nghề cũ.",
        "locate": "Đoạn G"
      },
      "19": {
        "vi": "Tàu thời cổ phải đi sát bờ.",
        "locate": "Đoạn B"
      },
      "20": {
        "vi": "Cư dân biết rõ vùng biển nên thoát được trả đũa (B); 20 và 21 là B và D tuỳ thứ tự.",
        "locate": "Đoạn B"
      },
      "21": {
        "vi": "Cư dân vùng núi sống dựa vào biển (D).",
        "locate": "Đoạn B"
      },
      "22": {
        "vi": "Quan chức cao cấp Hy Lạp đôi khi tham gia cướp biển (C); 22 và 23 là C và E.",
        "locate": "Đoạn E"
      },
      "23": {
        "vi": "Các văn bản cổ Hy Lạp ca ngợi cướp biển (E).",
        "locate": "Đoạn E"
      },
      "24": {
        "vi": "Hải tặc tấn công tàu chở lúa mì.",
        "locate": "Đoạn F"
      },
      "25": {
        "vi": "Thượng viện đòi trừng phạt.",
        "locate": "Đoạn F"
      },
      "26": {
        "vi": "Hải tặc đòi tiền chuộc.",
        "locate": "Đoạn F"
      },
      "27": {
        "vi": "Đoạn 1 đưa ra nhiều lý do vì sao người ta nói dối hoặc lan truyền sai lệch.",
        "locate": "Đoạn 1"
      },
      "28": {
        "vi": "Cơ chế truyền thông đại chúng có thể giúp sửa sai về lâu dài.",
        "locate": "Đoạn 2"
      },
      "29": {
        "vi": "Đoạn 4 phác ra ba vấn đề đáng chú ý hiện nay.",
        "locate": "Đoạn 4"
      },
      "30": {
        "vi": "Cơ quan quản lý Mỹ không ngăn được tin sai xuất hiện.",
        "locate": "Đoạn 6"
      },
      "31": {
        "vi": "Con người thường xuyên tiếp xúc thông tin sai.",
        "locate": "Đoạn 5"
      },
      "32": {
        "vi": "Descartes và Spinoza có quan điểm khác nhau.",
        "locate": "Đoạn 5"
      },
      "33": {
        "vi": "Spinoza cho rằng cần một thao tác tâm trí riêng để kiểm chứng.",
        "locate": "Đoạn 5"
      },
      "34": {
        "vi": "Nghiên cứu gần đây bổ sung bằng chứng cho Spinoza.",
        "locate": "Đoạn 5"
      },
      "35": {
        "vi": "Thông tin được coi như thật dù chỉ trong thời gian ngắn.",
        "locate": "Đoạn 5"
      },
      "36": {
        "vi": "Hai nguồn lực nằm ở các vùng khác nhau của não.",
        "locate": "Đoạn 5"
      },
      "37": {
        "vi": "Chiến dịch sửa sai cần người nghe hiểu được thì mới hiệu quả.",
        "locate": "Đoạn 7"
      },
      "38": {
        "vi": "Bài đề xuất giáo dục sớm nhưng không nói có phản đối.",
        "locate": "Đoạn 7 (không có thông tin)"
      },
      "39": {
        "vi": "Tác giả nói hành trình dài và gian nan.",
        "locate": "Đoạn 8"
      },
      "40": {
        "vi": "Bài không bàn về việc cập nhật tin mới bị phóng đại.",
        "locate": "Không có thông tin"
      }
    }
  },

  // ==========================================
  // CAMBRIDGE IELTS 19 - READING TEST 2
  // ==========================================
  {
    "id": "cambridge-19-reading-2",
    "title": "Cambridge IELTS 19 · Reading Test 2",
    "collection": "cambridge",
    "volume": 19,
    "testNumber": 2,
    "section": "Reading",
    "questionCount": 40,
    "topics": [
      "The Industrial Revolution in Britain",
      "Athletes and Stress",
      "The Gifted Child Debate"
    ],
    "questionTypes": [
      "NOTE_COMPLETION",
      "TRUE_FALSE_NOT_GIVEN",
      "MATCHING_INFORMATION",
      "SENTENCE_COMPLETION",
      "MULTIPLE_CHOICE",
      "SUMMARY_COMPLETION",
      "YES_NO_NOT_GIVEN"
    ],
    "answerKey": {
      "1": "piston",
      "2": "coal",
      "3": "workshops",
      "4": "labour/labor",
      "5": "quality",
      "6": "railway(s)",
      "7": "sanitation",
      "8": "NOT GIVEN",
      "9": "FALSE",
      "10": "NOT GIVEN",
      "11": "TRUE",
      "12": "TRUE",
      "13": "NOT GIVEN",
      "14": "D",
      "15": "F",
      "16": "A",
      "17": "C",
      "18": "F",
      "19": "injury",
      "20": "serves",
      "21": "excitement",
      "22": "visualisation/visualization",
      "23": "B",
      "24": "D",
      "25": "A",
      "26": "E",
      "27": "H",
      "28": "A",
      "29": "C",
      "30": "B",
      "31": "J",
      "32": "I",
      "33": "YES",
      "34": "NOT GIVEN",
      "35": "YES",
      "36": "NOT GIVEN",
      "37": "NO",
      "38": "C",
      "39": "B",
      "40": "D"
    },
    "explanations": {
      "1": {
        "vi": "Thanh pít-tông nối với hệ bánh răng trong động cơ Watt và Boulton.",
        "locate": "Đoạn 2"
      },
      "2": {
        "vi": "Nhu cầu than tăng khi chạy máy hơi nước.",
        "locate": "Đoạn 3"
      },
      "3": {
        "vi": "Thợ kéo sợi, dệt làm việc tại nhà hoặc xưởng nhỏ.",
        "locate": "Đoạn 4"
      },
      "4": {
        "vi": "Ít sức lao động hơn nhờ máy kéo sợi và máy dệt.",
        "locate": "Đoạn 4"
      },
      "5": {
        "vi": "Luyện bằng than cốc cho kim loại chất lượng cao hơn.",
        "locate": "Đoạn 5"
      },
      "6": {
        "vi": "Nhu cầu sắt tăng theo mạng đường sắt.",
        "locate": "Đoạn 5"
      },
      "7": {
        "vi": "Thành phố mới ô nhiễm, chật và thiếu hệ thống vệ sinh.",
        "locate": "Đoạn 7"
      },
      "8": {
        "vi": "Kênh chỉ được nhắc cho tàu thuyền, không nói mạng lưới mở rộng nhanh.",
        "locate": "Đoạn 3 (không có thông tin)"
      },
      "9": {
        "vi": "Kỹ thuật dùng than cốc rẻ hơn, nên chi phí không tăng.",
        "locate": "Đoạn 5"
      },
      "10": {
        "vi": "Bài không so sánh độ tin cậy của hệ thống Morse với Cooke và Wheatstone.",
        "locate": "Đoạn 6 (không có thông tin)"
      },
      "11": {
        "vi": "Lợi ích kinh tế chủ yếu tới tầng lớp trung và thượng lưu, người nghèo vẫn khổ.",
        "locate": "Đoạn 8"
      },
      "12": {
        "vi": "Thợ dệt lành nghề sợ máy móc lấy mất việc.",
        "locate": "Đoạn 8"
      },
      "13": {
        "vi": "Bài không nói người dân địa phương thông cảm với những người bị bắt.",
        "locate": "Đoạn 9 (không có thông tin)"
      },
      "14": {
        "vi": "Đoạn D nêu adrenaline và cortisol.",
        "locate": "Đoạn D"
      },
      "15": {
        "vi": "Đoạn F nêu các cách giảm tác động của căng thẳng.",
        "locate": "Đoạn F"
      },
      "16": {
        "vi": "Raducanu giải thích trải nghiệm của mình bằng sự phấn khích.",
        "locate": "Đoạn A"
      },
      "17": {
        "vi": "Nghiên cứu cho thấy trạng thái thử thách dẫn tới thành tích tốt.",
        "locate": "Đoạn C"
      },
      "18": {
        "vi": "Huấn luyện viên, phụ huynh, nhà tâm lý ảnh hưởng cách vận động viên nhìn phản ứng cơ thể.",
        "locate": "Đoạn F"
      },
      "19": {
        "vi": "Một yêu cầu đối với vận động viên là nguy cơ chấn thương.",
        "locate": "Đoạn B"
      },
      "20": {
        "vi": "Cortisol gắn với nhiều cú giao bóng hỏng hơn.",
        "locate": "Đoạn D"
      },
      "21": {
        "vi": "Nhịp tim cao có thể được nhìn như sự phấn khích.",
        "locate": "Đoạn F"
      },
      "22": {
        "vi": "Hình dung là kỹ năng tâm lý giúp giảm phản ứng căng thẳng.",
        "locate": "Đoạn F"
      },
      "23": {
        "vi": "Bài nêu triệu chứng căng thẳng của cô (B); 23 và 24 là B và D.",
        "locate": "Đoạn A"
      },
      "24": {
        "vi": "Khán giả đông, kỳ vọng cao làm tăng áp lực (D).",
        "locate": "Đoạn C"
      },
      "25": {
        "vi": "Đoạn E nói mức độ lo âu phụ thuộc yêu cầu và nguồn lực (A); 25 và 26 là A và E.",
        "locate": "Đoạn E"
      },
      "26": {
        "vi": "Lo âu lặp lại có thể gây hại tim và tâm trạng (E).",
        "locate": "Đoạn E"
      },
      "27": {
        "vi": "Cô là người phụ nữ duy nhất đoạt Fields, nên được coi là độc nhất.",
        "locate": "Đoạn 1"
      },
      "28": {
        "vi": "Hồi nhỏ môn toán không hấp dẫn cô.",
        "locate": "Đoạn 2"
      },
      "29": {
        "vi": "Bài toán khó anh trai kể làm cô bị cuốn hút.",
        "locate": "Đoạn 2"
      },
      "30": {
        "vi": "Cô kiên định khi gặp trở ngại.",
        "locate": "Đoạn 3"
      },
      "31": {
        "vi": "Niềm thoả mãn lớn nhất đến từ phát hiện mới.",
        "locate": "Đoạn 3"
      },
      "32": {
        "vi": "Các nghiên cứu của cô mang tính đổi mới.",
        "locate": "Đoạn 3"
      },
      "33": {
        "vi": "Hầu hết người đoạt Nobel khi trẻ không nổi trội.",
        "locate": "Phần về giải Nobel (giữa bài)"
      },
      "34": {
        "vi": "Bài không nói thất bại của Einstein do thiếu tự tin.",
        "locate": "Đoạn về Einstein (không có thông tin)"
      },
      "35": {
        "vi": "Việc có trẻ sinh ra đã có năng khiếu hay không còn chưa ngã ngũ.",
        "locate": "Phần về năng khiếu bẩm sinh"
      },
      "36": {
        "vi": "Bài không nói Einstein buồn vì cách công chúng nhìn.",
        "locate": "Đoạn cuối (không có thông tin)"
      },
      "37": {
        "vi": "Einstein nói thành công nhờ kiên trì với vấn đề lâu hơn, không phải nhanh.",
        "locate": "Đoạn cuối"
      },
      "38": {
        "vi": "Eyre nhấn mạnh phát triển sự tò mò, kiên trì.",
        "locate": "Phần về Eyre"
      },
      "39": {
        "vi": "Nghiên cứu của Ericsson cho thấy năng khiếu bẩm sinh không phải yếu tố then chốt.",
        "locate": "Phần về Ericsson"
      },
      "40": {
        "vi": "Yếu tố then chốt là người lớn coi trọng việc học.",
        "locate": "Đoạn áp chót"
      }
    }
  },

  // ==========================================
  // CAMBRIDGE IELTS 20 - READING TEST 1
  // ==========================================
  {
    "id": "cambridge-20-reading-1",
    "title": "Cambridge IELTS 20 · Reading Test 1",
    "collection": "cambridge",
    "volume": 20,
    "testNumber": 1,
    "section": "Reading",
    "questionCount": 40,
    "topics": [
      "The kākāpō (parrot conservation)",
      "Bringing elms back to Britain",
      "How stress affects our judgement"
    ],
    "questionTypes": [
      "TRUE_FALSE_NOT_GIVEN",
      "NOTE_COMPLETION",
      "MATCHING_INFORMATION",
      "MATCHING_FEATURES",
      "SUMMARY_COMPLETION",
      "MULTIPLE_CHOICE",
      "SENTENCE_COMPLETION",
      "YES_NO_NOT_GIVEN"
    ],
    "answerKey": {
      "1": "FALSE",
      "2": "FALSE",
      "3": "FALSE",
      "4": "NOT GIVEN",
      "5": "TRUE",
      "6": "TRUE",
      "7": "bulbs",
      "8": "soil",
      "9": "feathers",
      "10": "deer",
      "11": "1980",
      "12": "funding",
      "13": "stakeholders",
      "14": "C",
      "15": "G",
      "16": "B",
      "17": "E",
      "18": "C",
      "19": "B",
      "20": "A",
      "21": "B",
      "22": "C",
      "23": "A",
      "24": "oak",
      "25": "flooring",
      "26": "keel",
      "27": "C",
      "28": "A",
      "29": "D",
      "30": "C",
      "31": "B",
      "32": "G",
      "33": "F",
      "34": "E",
      "35": "D",
      "36": "YES",
      "37": "NOT GIVEN",
      "38": "NO",
      "39": "YES",
      "40": "YES"
    },
    "explanations": {
      "1": {
        "vi": "Đoạn 1 nói kākāpō là loài vẹt duy nhất không bay được, nên không có loài vẹt nào khác giống vậy.",
        "locate": "Passage 1, đoạn 1"
      },
      "2": {
        "vi": "Đoạn 3 cho biết chúng chỉ sinh sản vào những năm thức ăn dồi dào, nên không phải năm nào cũng có chim non.",
        "locate": "Passage 1, đoạn 3"
      },
      "3": {
        "vi": "Đoạn 3: chim đực không tham gia ấp trứng hay nuôi con; chỉ chim cái lo việc này, nên khẳng định là sai.",
        "locate": "Passage 1, đoạn 3"
      },
      "4": {
        "vi": "Đoạn 4 chỉ nhắc chó và chuột của người Polynesia cũng săn kākāpō, không so sánh mức đe dọa với chính người định cư.",
        "locate": "Passage 1, đoạn 4"
      },
      "5": {
        "vi": "Đoạn 7: mèo hoang ở Rakiura làm số chim giảm nhanh nên đàn chim được chuyển sang các đảo khác.",
        "locate": "Passage 1, đoạn 7"
      },
      "6": {
        "vi": "Đoạn 8: một biện pháp của Kế hoạch Phục hồi là cứu và nuôi bằng tay những chim non yếu, góp phần làm đàn tăng.",
        "locate": "Passage 1, đoạn 8"
      },
      "7": {
        "vi": "Đoạn 2 liệt kê thức ăn thực vật của chúng; sau lá, rễ, vỏ cây là bulbs (củ).",
        "locate": "Passage 1, đoạn 2"
      },
      "8": {
        "vi": "Đoạn 3: trứng được đẻ trong soil (đất) được xới đi xới lại.",
        "locate": "Passage 1, đoạn 3"
      },
      "9": {
        "vi": "Đoạn 4: người Polynesia dùng feathers (lông) của chim để làm áo choàng mềm.",
        "locate": "Passage 1, đoạn 4"
      },
      "10": {
        "vi": "Đoạn 4: loài du nhập làm cạn thức ăn trong rừng là deer (hươu nai).",
        "locate": "Passage 1, đoạn 4"
      },
      "11": {
        "vi": "Đoạn 6: năm 1980 người ta xác nhận có chim mái ở Rakiura.",
        "locate": "Passage 1, đoạn 6"
      },
      "12": {
        "vi": "Đoạn 8: Kế hoạch Phục hồi 1996 đi kèm việc tăng funding (kinh phí).",
        "locate": "Passage 1, đoạn 8"
      },
      "13": {
        "vi": "Đoạn 10: một mục tiêu hiện nay là giữ cho stakeholders (các bên liên quan) tiếp tục tham gia bảo tồn.",
        "locate": "Passage 1, đoạn 10"
      },
      "14": {
        "vi": "Mục C: chỉ còn ít cây du lớn sống sót nên cơ hội nghiên cứu bị hạn chế.",
        "locate": "Passage 2, mục C"
      },
      "15": {
        "vi": "Mục G: hai bên bất đồng về việc có nên đưa cây du trở lại hay không.",
        "locate": "Passage 2, mục G"
      },
      "16": {
        "vi": "Mục B: dịch bệnh đợt hai bắt nguồn từ lô gỗ du nhập khẩu từ Canada.",
        "locate": "Passage 2, mục B"
      },
      "17": {
        "vi": "Mục E: gió biển mạnh khiến bọ khó tấn công cây du ở Brighton nên thành phố tránh được phần nào.",
        "locate": "Passage 2, mục E"
      },
      "18": {
        "vi": "Mục C: khi thân cây đạt một cỡ nhất định thì bọ nhắm tới; đó là giai đoạn cây non dễ bị nhiễm.",
        "locate": "Passage 2, mục C"
      },
      "19": {
        "vi": "Mục F (Russell): sau vài tuần, cây nhạy cảm với nấm lộ triệu chứng rụng lá rất nhanh.",
        "locate": "Passage 2, mục F"
      },
      "20": {
        "vi": "Mục G (Elliot): ông cho rằng nên cho tự nhiên thời gian, chờ xem cây sống sót có phát triển tiếp không.",
        "locate": "Passage 2, mục G"
      },
      "21": {
        "vi": "Mục C (Russell): bà cho rằng việc một số cây già còn sống chắc chắn có lý do, không chỉ là may rủi.",
        "locate": "Passage 2, mục C"
      },
      "22": {
        "vi": "Mục E (Bourne): ông cảnh báo bọ mang bệnh đang ở rất gần.",
        "locate": "Passage 2, mục E"
      },
      "23": {
        "vi": "Mục A (Elliot): chỉ khi nhìn ảnh cũ thấy cây từng nổi bật cỡ nào mới hiểu mức tàn phá.",
        "locate": "Passage 2, mục A"
      },
      "24": {
        "vi": "Mục D: chỉ có oak (sồi) được ưa chuộng hơn du trong nhiều thế kỷ.",
        "locate": "Passage 2, mục D"
      },
      "25": {
        "vi": "Mục D: ở thế kỷ 18, gỗ du dùng làm thùng đựng đồ và flooring (sàn nhà).",
        "locate": "Passage 2, mục D"
      },
      "26": {
        "vi": "Mục D: keel (sống tàu) của tàu Cutty Sark làm bằng gỗ du.",
        "locate": "Passage 2, mục D"
      },
      "27": {
        "vi": "Đoạn 1 mở bài bằng một thử thách ai cũng gặp: phải quyết định khi đang căng thẳng.",
        "locate": "Passage 3, đoạn 1"
      },
      "28": {
        "vi": "Đoạn 2: ngày nhàn ngày dồn dập của lính cứu hỏa khiến họ thành đối tượng nghiên cứu lý tưởng.",
        "locate": "Passage 3, đoạn 2"
      },
      "29": {
        "vi": "Đoạn 4 trình bày cách làm thí nghiệm: ước lượng rủi ro, nhận tin tốt hoặc xấu, rồi ước lượng lại.",
        "locate": "Passage 3, đoạn 4"
      },
      "30": {
        "vi": "Đoạn 7 mô tả cơ chế não khiến ta nhạy hơn với dấu hiệu nguy hiểm từ bên ngoài.",
        "locate": "Passage 3, đoạn 7"
      },
      "31": {
        "vi": "Đoạn 5: khi thư giãn, họ có xu hướng lơ tin xấu và chỉ đón tin tốt.",
        "locate": "Passage 3, đoạn 5"
      },
      "32": {
        "vi": "Đoạn 5: khi căng thẳng, họ chỉnh lại niềm tin theo tin xấu, tức cho rằng rủi ro của mình cao hơn.",
        "locate": "Passage 3, đoạn 5"
      },
      "33": {
        "vi": "Đoạn 5: phản ứng với tin tốt không đổi dù có căng thẳng hay không.",
        "locate": "Passage 3, đoạn 5"
      },
      "34": {
        "vi": "Đoạn 6: sinh viên bị đặt vào tình huống phải diễn thuyết bất ngờ nên cortisol và nhịp tim tăng.",
        "locate": "Passage 3, đoạn 6"
      },
      "35": {
        "vi": "Đoạn 5 và 6: ở cả hai thí nghiệm, tin xấu được xử lý tốt hơn khi đối tượng đang căng thẳng.",
        "locate": "Passage 3, đoạn 5-6"
      },
      "36": {
        "vi": "Đoạn 9: sắc thái bài mình đăng thường theo sắc thái bài mình thấy trên bảng tin.",
        "locate": "Passage 3, đoạn 9"
      },
      "37": {
        "vi": "Đoạn 10 nói điện thoại gây căng thẳng nhưng không so sánh nó với mọi thiết bị khác, nên không có thông tin.",
        "locate": "Passage 3, đoạn 10"
      },
      "38": {
        "vi": "Đoạn 11: đọc nhiều tin đáng lo khiến ta tiếp nhận tin tiêu cực nhiều hơn, không phải kém đi, nên khẳng định là sai.",
        "locate": "Passage 3, đoạn 11"
      },
      "39": {
        "vi": "Đoạn 11: căng thẳng lan qua mạng xã hội làm nỗi sợ bị thổi phồng, dẫn tới phản ứng quá mức cần thiết.",
        "locate": "Passage 3, đoạn 11"
      },
      "40": {
        "vi": "Đoạn 12: cảm xúc tích cực như hy vọng cũng lây và có thể dùng để thúc đẩy hành động.",
        "locate": "Passage 3, đoạn 12"
      }
    },
    "answerKeyVerified": false
  },

  // ==========================================
  // CAMBRIDGE IELTS 18 - READING TEST 1
  // ==========================================
  {
    "id": "cambridge-18-reading-1",
    "title": "Cambridge IELTS 18 · Reading Test 1",
    "collection": "cambridge",
    "volume": 18,
    "testNumber": 1,
    "section": "Reading",
    "questionCount": 40,
    "topics": [
      "Urban Rooftop Farming",
      "Forest Management in Pennsylvania",
      "Space Debris"
    ],
    "questionTypes": [
      "SENTENCE_COMPLETION",
      "NOTE_COMPLETION",
      "TRUE_FALSE_NOT_GIVEN",
      "MATCHING_INFORMATION",
      "MATCHING_FEATURES",
      "SUMMARY_COMPLETION"
    ],
    "answerKey": {
      "1": "lettuces",
      "2": "1,000 kg",
      "3": "(food) consumption",
      "4": "pesticides",
      "5": "journeys",
      "6": "producers",
      "7": "flavour/flavor",
      "8": "TRUE",
      "9": "NOT GIVEN",
      "10": "FALSE",
      "11": "TRUE",
      "12": "FALSE",
      "13": "NOT GIVEN",
      "14": "B",
      "15": "A",
      "16": "C",
      "17": "E",
      "18": "B",
      "19": "B",
      "20": "C",
      "21": "C",
      "22": "fire",
      "23": "nutrients",
      "24": "cavities",
      "25": "hawthorn",
      "26": "rare",
      "27": "C",
      "28": "F",
      "29": "A",
      "30": "E",
      "31": "B",
      "32": "sustainability",
      "33": "fuel",
      "34": "explosions",
      "35": "bankrupt",
      "36": "C",
      "37": "D",
      "38": "B",
      "39": "D",
      "40": "A"
    },
    "explanations": {
      "1": {
        "vi": "Ống đứng trồng dâu, xà lách và rau thơm.",
        "locate": "Đoạn A"
      },
      "2": {
        "vi": "Khi vận hành đủ, trang trại cho tới 1.000 kg mỗi ngày.",
        "locate": "Đoạn B"
      },
      "3": {
        "vi": "Mục tiêu là 5% đến 10% lượng tiêu thụ của thành phố.",
        "locate": "Đoạn B"
      },
      "4": {
        "vi": "Nông nghiệp thâm canh dùng nhiều thuốc trừ sâu.",
        "locate": "Đoạn C"
      },
      "5": {
        "vi": "Giống được chọn vì chịu được những chuyến vận chuyển dài.",
        "locate": "Đoạn C"
      },
      "6": {
        "vi": "Người sản xuất nhận rất ít trong giá bán.",
        "locate": "Đoạn C"
      },
      "7": {
        "vi": "Trồng khí canh chọn giống theo hương vị.",
        "locate": "Đoạn D"
      },
      "8": {
        "vi": "Trồng trên mái và trong bãi đỗ xe ngầm cho thấy làm được cả trên và dưới mặt đất.",
        "locate": "Đoạn E"
      },
      "9": {
        "vi": "Bài không nói thiết bị có thể tự làm thủ công.",
        "locate": "Đoạn E (không có thông tin)"
      },
      "10": {
        "vi": "Khí canh dùng rất ít điện, ngược với khẳng định.",
        "locate": "Đoạn E"
      },
      "11": {
        "vi": "Giá thường thấp hơn nông sản hữu cơ trồng đất.",
        "locate": "Đoạn F"
      },
      "12": {
        "vi": "Phần lớn sản phẩm chỉ hợp mùa hè.",
        "locate": "Đoạn F"
      },
      "13": {
        "vi": "Đậu chiếm nhiều diện tích; bài không so sánh thời gian sinh trưởng.",
        "locate": "Đoạn F (không có thông tin)"
      },
      "14": {
        "vi": "Đoạn B nói hậu quả của việc chỉ chăm chú vào giá trị gỗ chất lượng cao.",
        "locate": "Đoạn B"
      },
      "15": {
        "vi": "Đoạn A liệt kê các yếu tố tạo nên giá trị của cây.",
        "locate": "Đoạn A"
      },
      "16": {
        "vi": "Gỗ có thể thành nhiên liệu lỏng cho xe.",
        "locate": "Đoạn C"
      },
      "17": {
        "vi": "Các loài côn trùng gây hại được kể tên.",
        "locate": "Đoạn E"
      },
      "18": {
        "vi": "Cây gỗ kém giá trị còn gọi là cây rác.",
        "locate": "Đoạn B"
      },
      "19": {
        "vi": "Khai thác cứu hộ nhằm loại cây bệnh.",
        "locate": "Đoạn E"
      },
      "20": {
        "vi": "Khai thác ẩn che cho thu nhập trải nhiều năm.",
        "locate": "Đoạn F"
      },
      "21": {
        "vi": "Khai thác ẩn che tạo rừng đồng tuổi.",
        "locate": "Đoạn F"
      },
      "22": {
        "vi": "Dọn gỗ chết để phòng cháy.",
        "locate": "Đoạn G"
      },
      "23": {
        "vi": "Ngọn cây cắt bỏ trả chất dinh dưỡng cho đất.",
        "locate": "Đoạn G"
      },
      "24": {
        "vi": "Cây có nhiều hốc là nơi ở của nhiều loài.",
        "locate": "Đoạn G"
      },
      "25": {
        "vi": "Cây nhỏ như táo gai là nguồn thức ăn.",
        "locate": "Đoạn G"
      },
      "26": {
        "vi": "Cây hiếm nên được giữ lại để tăng đa dạng.",
        "locate": "Đoạn G"
      },
      "27": {
        "vi": "Các nhóm quốc tế hợp tác đề ra hướng dẫn.",
        "locate": "Đoạn C"
      },
      "28": {
        "vi": "Jah nêu mục tiêu của mình về không gian an toàn và tự do.",
        "locate": "Đoạn F"
      },
      "29": {
        "vi": "Vụ va chạm Iridium với vệ tinh Nga là vụ lớn.",
        "locate": "Đoạn A"
      },
      "30": {
        "vi": "Quản lý giao thông vũ trụ được so với kiểm soát không lưu.",
        "locate": "Đoạn E"
      },
      "31": {
        "vi": "Một số nhóm phát triển phân loại rác vũ trụ.",
        "locate": "Đoạn B"
      },
      "32": {
        "vi": "Uỷ ban hướng dẫn về tính bền vững của không gian.",
        "locate": "Đoạn C"
      },
      "33": {
        "vi": "Cần xả nhiên liệu thừa.",
        "locate": "Đoạn C"
      },
      "34": {
        "vi": "Nhiên liệu và vật liệu áp suất có thể gây nổ.",
        "locate": "Đoạn C"
      },
      "35": {
        "vi": "Nhà vận hành phá sản khó chi tiền gỡ vệ tinh.",
        "locate": "Đoạn C"
      },
      "36": {
        "vi": "Sorge: biết chính xác vị trí thì hầu như không còn rủi ro.",
        "locate": "Đoạn D"
      },
      "37": {
        "vi": "Jah muốn không gian tự do và hữu ích cho nhiều thế hệ.",
        "locate": "Đoạn F"
      },
      "38": {
        "vi": "Krag nói chỉ khoảng một nửa số sứ mệnh theo mục tiêu 25 năm.",
        "locate": "Đoạn C"
      },
      "39": {
        "vi": "Jah chỉ ra hai quỹ đạo khác nhau cho cùng một vật thể.",
        "locate": "Đoạn F"
      },
      "40": {
        "vi": "Frueh cảnh báo điểm không thể quay lại.",
        "locate": "Đoạn B"
      }
    }
  },

  // ==========================================
  // CAMBRIDGE IELTS 17 - READING TEST 1
  // ==========================================
  {
    "id": "cambridge-17-reading-1",
    "title": "Cambridge IELTS 17 · Reading Test 1",
    "collection": "cambridge",
    "volume": 17,
    "testNumber": 1,
    "section": "Reading",
    "questionCount": 40,
    "topics": [
      "Urban Transport History (London Underground)",
      "Stadium Architecture",
      "Biography Review (Charles II)"
    ],
    "questionTypes": [
      "NOTE_COMPLETION",
      "TRUE_FALSE_NOT_GIVEN",
      "MATCHING_INFORMATION",
      "SUMMARY_COMPLETION",
      "MULTIPLE_CHOICE",
      "YES_NO_NOT_GIVEN"
    ],
    "answerKey": {
      "1": "population",
      "2": "suburbs",
      "3": "businessmen",
      "4": "funding",
      "5": "press",
      "6": "soil",
      "7": "FALSE",
      "8": "NOT GIVEN",
      "9": "TRUE",
      "10": "TRUE",
      "11": "FALSE",
      "12": "FALSE",
      "13": "NOT GIVEN",
      "14": "A",
      "15": "F",
      "16": "E",
      "17": "D",
      "18": "fortress",
      "19": "bullfights",
      "20": "opera",
      "21": "salt",
      "22": "shops",
      "23": "C",
      "24": "D",
      "25": "B",
      "26": "E",
      "27": "H",
      "28": "J",
      "29": "F",
      "30": "B",
      "31": "D",
      "32": "NOT GIVEN",
      "33": "NO",
      "34": "NO",
      "35": "YES",
      "36": "B",
      "37": "C",
      "38": "A",
      "39": "B",
      "40": "D"
    },
    "explanations": {
      "1": {
        "vi": "Dân số London tăng nhanh là nguyên nhân gây ùn tắc ở trung tâm.",
        "locate": "Đoạn 1, câu mở đầu"
      },
      "2": {
        "vi": "Pearson muốn chuyển công nhân nghèo khỏi khu ổ chuột ra vùng ngoại ô mới xây.",
        "locate": "Phần về Mirzakhani (đầu bài)"
      },
      "3": {
        "vi": "Một số thương nhân ủng hộ ý tưởng của Pearson.",
        "locate": "Đoạn 2, cuối đoạn"
      },
      "4": {
        "vi": "Công ty gặp khó khăn trong việc huy động vốn cho dự án.",
        "locate": "Phần về Mirzakhani (đầu bài)"
      },
      "5": {
        "vi": "Báo chí đăng nhiều bài chỉ trích dự án.",
        "locate": "Phần về Mirzakhani (đầu bài)"
      },
      "6": {
        "vi": "Sau khi xây vòm gạch, người ta phủ một lớp đất lên trên đường hầm.",
        "locate": "Đoạn 5"
      },
      "7": {
        "vi": "Đoạn 6 gọi tuyến Metropolitan là tuyến tàu điện ngầm đầu tiên trên thế giới, nên khẳng định nước khác đã làm trước là sai.",
        "locate": "Đoạn 6"
      },
      "8": {
        "vi": "Bài chỉ nêu số hành khách ngày đầu, không nói họ nhiều hơn dự đoán.",
        "locate": "Đoạn 6 (không có thông tin)"
      },
      "9": {
        "vi": "Dù có thêm các giếng thông gió, khói và hơi độc vẫn còn.",
        "locate": "Đoạn 7, cuối đoạn"
      },
      "10": {
        "vi": "Ở khu trung tâm không dùng được phương pháp đào hở, phải đào hầm sâu.",
        "locate": "Đoạn 8"
      },
      "11": {
        "vi": "Cửa sổ nhỏ và đặt sát mái toa, không ngang tầm mắt.",
        "locate": "Đoạn 9"
      },
      "12": {
        "vi": "Tuyến City & South London không sinh lời.",
        "locate": "Đoạn 9"
      },
      "13": {
        "vi": "Bài không nói gì về việc tàu Tuppenny Tube có đúng giờ hay không.",
        "locate": "Đoạn 9 (không có thông tin)"
      },
      "14": {
        "vi": "Mở đầu bài nêu thái độ ngày càng hoài nghi đối với việc xây sân vận động vì chi phí và tình trạng bỏ hoang.",
        "locate": "Đoạn A"
      },
      "15": {
        "vi": "Số liệu về tấm pin và lượng CO2 giảm được thuộc sân Kaohsiung.",
        "locate": "Đoạn F"
      },
      "16": {
        "vi": "Đoạn E liệt kê khách sạn, cửa hàng, hội nghị, nhà hàng, sân chơi trẻ em.",
        "locate": "Đoạn E"
      },
      "17": {
        "vi": "Sân vận động thế kỷ 20 nằm ở ngoại ô, chỉ phục vụ thể thao, kém tiếp cận.",
        "locate": "Đoạn D"
      },
      "18": {
        "vi": "Đấu trường Arles từng được dùng làm pháo đài.",
        "locate": "Đoạn B"
      },
      "19": {
        "vi": "Thế kỷ 19 Arles trở lại làm nơi tổ chức đấu bò.",
        "locate": "Đoạn B"
      },
      "20": {
        "vi": "Đấu trường Verona nổi tiếng với opera nhờ âm học tốt.",
        "locate": "Đoạn B"
      },
      "21": {
        "vi": "Khu Lucca từng có kho muối.",
        "locate": "Đoạn C"
      },
      "22": {
        "vi": "Tàn tích Lucca nằm lẫn trong các cửa hàng và nhà ở quanh quảng trường.",
        "locate": "Đoạn C"
      },
      "23": {
        "vi": "Đoạn D so sánh sân hiện đại với đấu trường cổ: vị trí ngoại ô, kém thuận tiện (C); đáp án 23 và 24 là C và D theo thứ tự tuỳ ý.",
        "locate": "Đoạn D"
      },
      "24": {
        "vi": "Sân hiện đại mất bớt tính linh hoạt vì chỉ dùng cho thể thao (D).",
        "locate": "Đoạn D"
      },
      "25": {
        "vi": "Đoạn E nói sân có thể trở thành trung tâm đô thị đưa đời sống cộng đồng vào thành phố (B); 25 và 26 là B và E.",
        "locate": "Đoạn E"
      },
      "26": {
        "vi": "Mái sân rộng, cao, thích hợp đặt pin mặt trời và tua-bin gió nhỏ (E).",
        "locate": "Đoạn F"
      },
      "27": {
        "vi": "Charles II lập liên minh chiến lược với người Scotland.",
        "locate": "Đoạn 1 của bài review"
      },
      "28": {
        "vi": "Để làm vua Scotland, ông bỏ một nguyên tắc tôn giáo của cha mình.",
        "locate": "Phần về Mirzakhani (đầu bài)"
      },
      "29": {
        "vi": "Quân Nghị viện thắng áp đảo tại Worcester.",
        "locate": "Phần về Mirzakhani (đầu bài)"
      },
      "30": {
        "vi": "Chính quyền treo thưởng rất lớn để bắt ông.",
        "locate": "Phần về Mirzakhani (đầu bài)"
      },
      "31": {
        "vi": "Cuối cùng ông tìm được nơi ẩn náu tương đối an toàn ở nước Pháp.",
        "locate": "Đoạn 1"
      },
      "32": {
        "vi": "Bài chỉ nói ý định của nhà vua, không nói ông chọn Pepys vì tin cậy.",
        "locate": "Đoạn 2 (không có thông tin)"
      },
      "33": {
        "vi": "Nhà vua kể rất chi tiết, trái với nhận định thiếu chi tiết.",
        "locate": "Đoạn 2"
      },
      "34": {
        "vi": "Ông chỉ nghĩ cách thoát thân sau khi trận đánh đã thua hẳn.",
        "locate": "Đoạn 2"
      },
      "35": {
        "vi": "Người viết coi việc dùng lời kể của chính nhà vua là điểm hay của cuốn sách.",
        "locate": "Đoạn 3"
      },
      "36": {
        "vi": "Đoạn 1 tóm tắt bối cảnh dẫn tới cuộc trốn chạy.",
        "locate": "Đoạn 1"
      },
      "37": {
        "vi": "Các ví dụ cho thấy sáu tuần ấy được tái hiện sống động.",
        "locate": "Đoạn 3"
      },
      "38": {
        "vi": "Nhà vua tôn vinh một biến cố thực chất là thất bại.",
        "locate": "Đoạn 4"
      },
      "39": {
        "vi": "Tác giả sách thể hiện sự thông cảm công bằng với cả hai phía.",
        "locate": "Đoạn 5"
      },
      "40": {
        "vi": "Điểm chưa trọn vẹn là sách không làm rõ những tuần ấy có ảnh hưởng lâu dài tới nhà vua hay không.",
        "locate": "Đoạn 6"
      }
    }
  },







  // ==========================================
  // CAMBRIDGE IELTS 21 - READING TEST 1
  // ==========================================
  {
    "id": "cambridge-21-reading-1",
    "title": "Cambridge IELTS 21 · Reading Test 1",
    "collection": "cambridge",
    "volume": 21,
    "testNumber": 1,
    "section": "Reading",
    "questionCount": 40,
    "topics": [
      "The Davies sisters (art collectors)",
      "Why we need silence",
      "Book review: The World of Sugar"
    ],
    "questionTypes": [
      "NOTE_COMPLETION",
      "TRUE_FALSE_NOT_GIVEN",
      "MATCHING_INFORMATION",
      "SUMMARY_COMPLETION",
      "MATCHING_FEATURES",
      "MULTIPLE_CHOICE",
      "YES_NO_NOT_GIVEN"
    ],
    "answerKey": {
      "1": "mining",
      "2": "education",
      "3": "notes",
      "4": "journals",
      "5": "Venice",
      "6": "canteen",
      "7": "friends",
      "8": "TRUE",
      "9": "NOT GIVEN",
      "10": "FALSE",
      "11": "NOT GIVEN",
      "12": "TRUE",
      "13": "TRUE",
      "14": "C",
      "15": "B",
      "16": "A",
      "17": "G",
      "18": "breath",
      "19": "questionnaire",
      "20": "wellbeing",
      "21": "depression",
      "22": "C",
      "23": "A",
      "24": "B",
      "25": "D",
      "26": "C",
      "27": "B",
      "28": "A",
      "29": "C",
      "30": "A",
      "31": "H",
      "32": "E",
      "33": "I",
      "34": "A",
      "35": "G",
      "36": "C",
      "37": "YES",
      "38": "NOT GIVEN",
      "39": "NO",
      "40": "YES"
    },
    "explanations": {
      "1": {
        "vi": "Đoạn 1: tài sản của ông nội đến từ ngành vận tải biển và mining (khai mỏ).",
        "locate": "Passage 1, đoạn 1"
      },
      "2": {
        "vi": "Đoạn 2: chương trình education (học vấn) ở trường London được thiết kế hướng họ tới sưu tầm nghệ thuật.",
        "locate": "Passage 1, đoạn 2"
      },
      "3": {
        "vi": "Đoạn 2: họ đi dài ngày cùng gia sư và ghi notes (ghi chép) về các phòng tranh đã xem.",
        "locate": "Passage 1, đoạn 2"
      },
      "4": {
        "vi": "Đoạn 3: journals (nhật ký) cho thấy họ thích tranh Old Master nhưng giá quá cao.",
        "locate": "Passage 1, đoạn 3"
      },
      "5": {
        "vi": "Đoạn 4: các tranh Ấn tượng đầu tiên họ mua vẽ cảnh ở Venice.",
        "locate": "Passage 1, đoạn 4"
      },
      "6": {
        "vi": "Đoạn 5: họ tình nguyện làm việc ở một canteen (căng-tin) cho binh lính ở Pháp.",
        "locate": "Passage 1, đoạn 5"
      },
      "7": {
        "vi": "Đoạn 7: họ sống cô lập ở nông thôn và không có friends (bạn bè) là họa sĩ.",
        "locate": "Passage 1, đoạn 7"
      },
      "8": {
        "vi": "Đoạn 1: việc lớn lên trong môi trường tôn giáo khiến họ dùng tiền thừa kế cho văn hóa và từ thiện, nên đúng.",
        "locate": "Passage 1, đoạn 1"
      },
      "9": {
        "vi": "Đoạn 3 chỉ nói họ mua tranh của Corot; không nói mua ở phòng tranh nào hay ở đâu.",
        "locate": "Passage 1, đoạn 3"
      },
      "10": {
        "vi": "Đoạn 4: Blaker ủng hộ nghệ thuật Pháp đương đại và góp phần vào quyết định, nên không phản đối.",
        "locate": "Passage 1, đoạn 4"
      },
      "11": {
        "vi": "Đoạn 6 nói tranh Cezanne được trưng bày công khai lần đầu ở Anh nhưng không nói công chúng có hưởng ứng hay không.",
        "locate": "Passage 1, đoạn 6"
      },
      "12": {
        "vi": "Đoạn 8: đầu thập niên 1920, Gwendoline bắt đầu thấy khó chịu với việc mua tranh giữa cảnh nghèo đói sau chiến tranh.",
        "locate": "Passage 1, đoạn 8"
      },
      "13": {
        "vi": "Đoạn 9: họ sưu tầm phái Ấn tượng đúng lúc cả cá nhân lẫn tổ chức đều phớt lờ loại tranh này.",
        "locate": "Passage 1, đoạn 9"
      },
      "14": {
        "vi": "Mục C: các ví dụ về cách giảm tiếng ồn cho công chúng (xe buýt, mặt đường, quy định, xử phạt).",
        "locate": "Passage 2, mục C"
      },
      "15": {
        "vi": "Mục B: số liệu từ các tổ chức cho thấy quy mô vấn đề tiếng ồn.",
        "locate": "Passage 2, mục B"
      },
      "16": {
        "vi": "Mục A: mô tả thay đổi cơ thể (huyết áp, cơ bắp, hormone) khi nghe tiếng động đột ngột.",
        "locate": "Passage 2, mục A"
      },
      "17": {
        "vi": "Mục G: nghiên cứu cho thấy ngồi yên ở vườn ngoài trời dễ chịu hơn phòng im lặng tuyệt đối.",
        "locate": "Passage 2, mục G"
      },
      "18": {
        "vi": "Mục D: theo Feinstein, tập trung vào breath (hơi thở) giúp thư giãn và thiền.",
        "locate": "Passage 2, mục D"
      },
      "19": {
        "vi": "Mục E: người tham gia làm một questionnaire (bảng hỏi) trước và sau buổi thử.",
        "locate": "Passage 2, mục E"
      },
      "20": {
        "vi": "Mục E: cảm giác relaxation tăng cùng với wellbeing (sức khỏe tinh thần) nói chung.",
        "locate": "Passage 2, mục E"
      },
      "21": {
        "vi": "Mục E: vùng não giảm hoạt động liên quan đến depression (trầm cảm).",
        "locate": "Passage 2, mục E"
      },
      "22": {
        "vi": "Mục F (Ben-Soussan): im lặng ngoài ý muốn có thể rất khó chịu.",
        "locate": "Passage 2, mục F"
      },
      "23": {
        "vi": "Mục C (Antonio): ông dự đoán xu hướng thành phố yên tĩnh sẽ còn tăng.",
        "locate": "Passage 2, mục C"
      },
      "24": {
        "vi": "Mục D (Feinstein): thiếu kích thích giác quan thì não tự bù lại bằng hình ảnh và âm thanh.",
        "locate": "Passage 2, mục D"
      },
      "25": {
        "vi": "Mục G (Pfeifer): chỉ vài phút yên tĩnh mỗi lần cũng đã có lợi.",
        "locate": "Passage 2, mục G"
      },
      "26": {
        "vi": "Mục F (Ben-Soussan): yên lặng bên ngoài lẫn bên trong giúp ta nhận biết xung quanh và phản ứng đúng.",
        "locate": "Passage 2, mục F"
      },
      "27": {
        "vi": "Đoạn 1: đường củ cải được trợ giá và bán thấp nhân tạo, tức được làm cho cạnh tranh hơn trên thị trường thế giới.",
        "locate": "Passage 3, đoạn 1"
      },
      "28": {
        "vi": "Đoạn 2: tác giả nhấn mạnh nguồn đường của nước Anh thay đổi theo từng thời kỳ.",
        "locate": "Passage 3, đoạn 2"
      },
      "29": {
        "vi": "Đoạn 3: bác bỏ quan niệm sai rằng mía chỉ trồng ở các đồn điền lớn.",
        "locate": "Passage 3, đoạn 3"
      },
      "30": {
        "vi": "Đoạn 7: thông điệp chung là đường vừa có hại vừa không thiết yếu vì đã có nhiều nguồn ngọt khác.",
        "locate": "Passage 3, đoạn 7"
      },
      "31": {
        "vi": "Đoạn 4: sản xuất lớn ở Đức và Mỹ dựa vào lao động nhập cư (H, migrant workers).",
        "locate": "Passage 3, đoạn 4"
      },
      "32": {
        "vi": "Đoạn 4: ở Nam Á và Mỹ Latinh, canh tác quy mô nhỏ (E) vẫn tiếp tục.",
        "locate": "Passage 3, đoạn 4"
      },
      "33": {
        "vi": "Đoạn 5: các cá nhân và doanh nghiệp quyền lực (I) muốn bảo vệ thị trường của mình.",
        "locate": "Passage 3, đoạn 5"
      },
      "34": {
        "vi": "Đoạn 5: ảnh hưởng này tác động lên chính sách của chính phủ quốc gia (A).",
        "locate": "Passage 3, đoạn 5"
      },
      "35": {
        "vi": "Đoạn 5: hàng rào thương mại và trợ cấp tương ứng với các biện pháp tài chính (G).",
        "locate": "Passage 3, đoạn 5"
      },
      "36": {
        "vi": "Đoạn 5: kết quả là các nước kém giàu (C) chịu thiệt.",
        "locate": "Passage 3, đoạn 5"
      },
      "37": {
        "vi": "Đoạn 6: nhờ kỹ thuật, giống, phân bón, thủy lợi mà đường đã có với số lượng lớn.",
        "locate": "Passage 3, đoạn 6"
      },
      "38": {
        "vi": "Đoạn 6 nói đường từng là hàng xa xỉ rồi mới được quảng bá là nguồn năng lượng, nhưng không nói ai đã tiếp thị nó như hàng xa xỉ.",
        "locate": "Passage 3, đoạn 6"
      },
      "39": {
        "vi": "Đoạn 6: siro ngô fructose cao bị xem là nguyên nhân hàng đầu gây béo phì nên không phải tiến bộ tích cực.",
        "locate": "Passage 3, đoạn 6"
      },
      "40": {
        "vi": "Đoạn 6: siro ngô fructose cao có mặt trong nhiều loại thực phẩm chế biến.",
        "locate": "Passage 3, đoạn 6"
      }
    }
  },

];

/**
 * Helper to convert an IeltsTestPackage into a SourceTest object compatible with the existing API.
 */
export function testPackageToSourceTest(pkg: IeltsTestPackage) {
  const explanationLines = Object.entries(pkg.explanations).map(([num, exp]) => {
    return `[Câu ${num}] Đáp án: ${Array.isArray(pkg.answerKey[num]) ? (pkg.answerKey[num] as string[]).join(' / ') : pkg.answerKey[num]}\n- Giải thích chi tiết: ${exp.vi}\n- Vị trí trích dẫn bài đọc (Locate in passage): ${exp.locate}${exp.paraphrase ? `\n- Từ đồng nghĩa (Paraphrase): ${exp.paraphrase}` : ''}`;
  });

  const supportText = `# ĐÁP ÁN & GIẢI THÍCH CHI TIẾT (VIETNAMESE EXPLANATION & CITATION)\n\nBộ đề: ${pkg.title}\nPhân loại: ${pkg.collection === 'cambridge' ? 'Cambridge IELTS' : 'Actual Test Volume'}\nKỹ năng: ${pkg.section}\nTổng số câu: ${pkg.questionCount}\n\n${explanationLines.join('\n\n---\n\n')}`;

  const pages = (pkg.passages ?? []).map((p, idx) => ({
    page: idx + 1,
    text: `PASSAGE ${p.passageNumber}: ${p.title}\n${p.subtitle ? p.subtitle + '\n\n' : '\n'}${p.text}\n\nQUESTIONS FOR PASSAGE ${p.passageNumber}:\n` +
      p.questions.map((q) => `Câu ${q.number} [${q.type}]: ${q.prompt}${q.options ? '\n' + q.options.join('\n') : ''}`).join('\n\n'),
    reviewLines: [],
  }));

  // Bài đọc gốc có bản quyền nên không đăng công khai: chỉ hiện thông báo, KHÔNG sinh bài đọc giả.
  if (pages.length === 0) {
    pages.push({
      page: 1,
      text: `${pkg.title}\n\nBài đọc gốc không được đăng công khai trên bản web. Bạn vẫn xem được đáp án và giải thích từng câu; để làm cả đề, hãy dùng sách giấy hoặc bản đề riêng của bạn.`,
      reviewLines: [],
    });
  }

  return {
    id: pkg.id,
    title: pkg.title,
    source: pkg.collection === 'cambridge' ? `Cambridge IELTS ${pkg.volume}` : `Actual Test Vol ${pkg.volume}`,
    section: pkg.section,
    questionCount: pkg.questionCount,
    answerMode: (pkg.section === 'Writing' || pkg.section === 'Speaking') ? ('long' as const) : ('short' as const),
    pages,
    supportPages: [
      {
        page: 1,
        text: supportText,
        reviewLines: [],
      },
    ],
    answerKey: pkg.answerKey,
    answerKeyVerified: Boolean(pkg.answerKeyVerified),
    externalOnly: false,
    audioFiles: [],
  };
}
