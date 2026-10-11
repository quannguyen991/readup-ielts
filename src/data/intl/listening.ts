import type { Bi } from '@/i18n/useL';
import type { ReadingQuestion } from './reading-types';

/**
 * Kịch bản nghe do Band 9 tự soạn. Phát bằng giọng máy có sẵn của trình duyệt/thiết bị,
 * nên không gọi API và không tốn chi phí. Giọng máy khác nhau tuỳ thiết bị.
 */

export type QaItem = {
  id: string;
  question: string;
  responses: readonly string[];
  answer: number;
  explanation: Bi;
};

export type ListenPassage = {
  id: string;
  kind: 'conversation' | 'talk' | 'lecture';
  title: Bi;
  /** Mỗi dòng là một lượt nói; dòng bắt đầu bằng "M:" hoặc "W:" là lời của một người. */
  lines: readonly string[];
  questions: readonly ReadingQuestion[];
};

export const TOEIC_PART2: readonly QaItem[] = [
  {
    id: 'p2-1',
    question: 'When will the new software be installed?',
    responses: ['It was installed last week.', 'Sometime next Tuesday, I think.', 'The software is very easy to use.'],
    answer: 1,
    explanation: { vi: 'Câu hỏi về thời điểm. Đáp án nêu thời điểm trong tương lai.', en: 'The question asks when. The answer gives a future time.' },
  },
  {
    id: 'p2-2',
    question: 'Why was the meeting moved to Room 4?',
    responses: ['Because the projector in Room 2 is broken.', 'It starts at nine o’clock.', 'Yes, I attended it.'],
    answer: 0,
    explanation: { vi: 'Câu hỏi về lý do. Đáp án có "because" và nêu lý do.', en: 'The question asks why. The correct answer gives a reason.' },
  },
  {
    id: 'p2-3',
    question: 'Could you send me the invoice?',
    responses: ['I’ll send it this afternoon.', 'The invoice is too expensive.', 'No, I didn’t invoice them.'],
    answer: 0,
    explanation: { vi: 'Đây là lời đề nghị. Đáp án đúng nhận lời và nói khi nào làm.', en: 'This is a request. The correct reply accepts and says when.' },
  },
  {
    id: 'p2-4',
    question: 'Who is going to lead the new project?',
    responses: ['Sarah has agreed to take it on.', 'The project is due in May.', 'Yes, the project is big.'],
    answer: 0,
    explanation: { vi: 'Câu hỏi về người. Đáp án nêu tên hoặc người phụ trách.', en: 'The question asks who. The correct answer names a person.' },
  },
  {
    id: 'p2-5',
    question: 'Would you like the window seat or the aisle seat?',
    responses: ['The window seat, please.', 'The flight leaves at six.', 'I’m not sure about that.'],
    answer: 0,
    explanation: { vi: 'Câu hỏi lựa chọn. Đáp án chọn một trong hai.', en: 'This is a choice question. The correct answer picks one option.' },
  },
  {
    id: 'p2-6',
    question: 'Did you finish the quarterly report?',
    responses: ['Yes, I sent it to the director this morning.', 'The report is on the third floor.', 'No, I finished it last year.'],
    answer: 0,
    explanation: { vi: 'Câu hỏi có/không. Đáp án xác nhận và nêu thêm chi tiết.', en: 'A yes/no question. The correct answer confirms and adds a detail.' },
  },
  {
    id: 'p2-7',
    question: 'How much does the hotel room cost per night?',
    responses: ['Around 120 dollars, including breakfast.', 'Yes, the hotel is near the airport.', 'I’d like a room with a view.'],
    answer: 0,
    explanation: { vi: 'Câu hỏi về giá. Đáp án đưa ra một con số.', en: 'The question asks about a price. The answer gives a figure.' },
  },
  {
    id: 'p2-8',
    question: 'Where should I park my car?',
    responses: ['In the lot behind the building.', 'I parked it yesterday.', 'Your car is very nice.'],
    answer: 0,
    explanation: { vi: 'Câu hỏi về nơi chốn. Đáp án chỉ địa điểm.', en: 'The question asks where. The answer names a place.' },
  },
  {
    id: 'p2-9',
    question: 'Isn’t the conference starting at ten?',
    responses: ['It was moved to eleven.', 'Yes, I’m starting a new job.', 'The conference hall is very large.'],
    answer: 0,
    explanation: { vi: 'Câu hỏi xác nhận giờ. Đáp án cho biết giờ đã thay đổi.', en: 'The question checks a time. The answer says the time has changed.' },
  },
  {
    id: 'p2-10',
    question: 'Why didn’t you attend the training?',
    responses: ['I was sick that day.', 'The training is on Tuesday.', 'Yes, I attended it last week.'],
    answer: 0,
    explanation: { vi: 'Câu hỏi về lý do. Đáp án nêu lý do vắng mặt.', en: 'The question asks why. The answer gives a reason for being absent.' },
  },
];

export const TOEIC_PART3: readonly ListenPassage[] = [
  {
    id: 'p3-office-layout',
    kind: 'conversation',
    title: { vi: 'Hội thoại: thiết kế văn phòng', en: 'Conversation: office layout' },
    lines: [
      'M: Hi, Linh. Did you get a chance to look at the proposal for the new office layout?',
      'W: Yes, I did. I think the open area is too small for the design team.',
      'M: I agree. Could we move the meeting rooms to the north side?',
      'W: That would work. I’ll ask the architect to update the drawings by Friday.',
      'M: Great. Let’s review them together on Monday.',
    ],
    questions: [
      { id: 'p3-office-1', prompt: 'What is the woman’s concern?', choices: ['The budget', 'The open area is too small', 'The deadline', 'The architect'], answer: 1, explanation: { vi: 'Người phụ nữ nói khu mở quá nhỏ cho nhóm thiết kế.', en: 'The woman says the open area is too small for the design team.' } },
      { id: 'p3-office-2', prompt: 'What does the man suggest?', choices: ['Moving the meeting rooms', 'Hiring a new architect', 'Cancelling the meeting', 'Changing the budget'], answer: 0, explanation: { vi: 'Người đàn ông đề nghị chuyển phòng họp sang phía bắc.', en: 'The man suggests moving the meeting rooms to the north side.' } },
      { id: 'p3-office-3', prompt: 'When will they review the drawings?', choices: ['On Friday', 'On Monday', 'Next month', 'Today'], answer: 1, explanation: { vi: 'Họ sẽ cùng xem bản vẽ vào thứ Hai.', en: 'They will review the drawings together on Monday.' } },
      { id: 'p3-office-4', prompt: 'What will the woman most likely do next?', choices: ['Update the drawings', 'Cancel the meeting', 'Hire an architect', 'Call the budget office'], answer: 0, kind: { vi: 'Dự đoán hành động tiếp theo', en: 'Predicting the next action' }, level: 'medium', explanation: { vi: 'Người phụ nữ nói sẽ nhờ kiến trúc sư cập nhật bản vẽ trước thứ Sáu.', en: 'The woman says she will ask the architect to update the drawings by Friday.' } },
    ],
  },
  {
    id: 'p3-late-delivery',
    kind: 'conversation',
    title: { vi: 'Hội thoại: giao hàng trễ', en: 'Conversation: late delivery' },
    lines: [
      'M: Hello, this is Tom from Northwind Logistics. We received your call about the late shipment.',
      'W: Yes. The order was due on Monday, but it arrived on Thursday.',
      'M: I’m sorry about that. The truck broke down near Hue. We have rerouted the next shipment.',
      'W: Thank you. Can you guarantee it will arrive on time next week?',
      'M: Yes. I’ll give you a tracking number and a discount on the next order.',
    ],
    questions: [
      { id: 'p3-late-1', prompt: 'What was the problem?', choices: ['The order was damaged', 'The order arrived late', 'The order was wrong', 'The order was cancelled'], answer: 1, explanation: { vi: 'Đơn hàng đáng lẽ đến thứ Hai nhưng đến thứ Năm.', en: 'The order was due on Monday but arrived on Thursday.' } },
      { id: 'p3-late-2', prompt: 'What caused the delay?', choices: ['A broken truck', 'A strike', 'Bad weather', 'A wrong address'], answer: 0, explanation: { vi: 'Xe tải bị hỏng gần Huế.', en: 'The truck broke down near Hue.' } },
      { id: 'p3-late-3', prompt: 'What will the man give the woman?', choices: ['A refund', 'A tracking number and a discount', 'A new product', 'A meeting'], answer: 1, explanation: { vi: 'Người đàn ông hứa mã theo dõi và giảm giá đơn sau.', en: 'The man offers a tracking number and a discount on the next order.' } },
    ],
  },
  {
    id: 'p3-supplier',
    kind: 'conversation',
    title: { vi: 'Hội thoại: chọn nhà cung cấp', en: 'Conversation: choosing a supplier' },
    lines: [
      'W: Have you compared the three quotes for the packaging materials?',
      'M: Yes. Company A is the cheapest, but their delivery takes four weeks.',
      'W: We need the materials in two weeks. What about Company B?',
      'M: Company B is more expensive, but they can deliver within ten days.',
      'W: Then let’s choose Company B. Can you send them the purchase order today?',
    ],
    questions: [
      { id: 'p3-supplier-1', prompt: 'What are they choosing?', choices: ['A new office', 'A supplier for packaging materials', 'A new employee', 'A software program'], answer: 1, explanation: { vi: 'Họ so sánh báo giá vật liệu đóng gói.', en: 'They compare quotes for packaging materials.' } },
      { id: 'p3-supplier-2', prompt: 'Why is Company A not suitable?', choices: ['It is too expensive', 'Its delivery takes four weeks', 'It has no stock', 'It is far away'], answer: 1, explanation: { vi: 'Công ty A giao hàng mất bốn tuần, quá lâu so với hai tuần cần thiết.', en: 'Company A takes four weeks to deliver, too long for the two weeks needed.' } },
      { id: 'p3-supplier-3', prompt: 'What will the woman ask the man to do?', choices: ['Call the client', 'Send a purchase order', 'Visit the factory', 'Cancel the quote'], answer: 1, explanation: { vi: 'Người phụ nữ nhờ gửi đơn đặt hàng trong ngày.', en: 'The woman asks him to send the purchase order today.' } },
    ],
  },
];

export const TOEIC_PART4: readonly ListenPassage[] = [
  {
    id: 'p4-elevator',
    kind: 'talk',
    title: { vi: 'Thông báo: thang máy bảo trì', en: 'Announcement: elevator maintenance' },
    lines: [
      'Good morning, everyone. This is Robert from Facilities. Please note that the elevator on the east side will be closed for maintenance from Monday to Wednesday.',
      'During that time, please use the stairs or the elevator in the west wing. The maintenance team expects to finish earlier than planned, so the west elevator will stay open. Thank you for your patience.',
    ],
    questions: [
      { id: 'p4-elevator-1', prompt: 'Who is the speaker?', choices: ['A driver', 'A facilities staff member', 'An accountant', 'A visitor'], answer: 1, explanation: { vi: 'Người nói giới thiệu mình là Robert từ bộ phận Cơ sở vật chất.', en: 'The speaker introduces himself as Robert from Facilities.' } },
      { id: 'p4-elevator-2', prompt: 'Which elevator will be closed?', choices: ['The west elevator', 'The east elevator', 'Both elevators', 'Neither elevator'], answer: 1, explanation: { vi: 'Thang máy phía đông sẽ đóng để bảo trì.', en: 'The elevator on the east side will be closed.' } },
      { id: 'p4-elevator-3', prompt: 'What does the speaker say about the maintenance?', choices: ['It will finish earlier than planned', 'It will be cancelled', 'It started yesterday', 'It is very expensive'], answer: 0, explanation: { vi: 'Đội bảo trì dự kiến xong sớm hơn kế hoạch.', en: 'The maintenance team expects to finish earlier than planned.' } },
    ],
  },
  {
    id: 'p4-flight-delay',
    kind: 'talk',
    title: { vi: 'Thông báo: chuyến bay bị hoãn', en: 'Announcement: flight delay' },
    lines: [
      'Attention passengers on flight 302 to Singapore. Due to heavy fog at the airport, departure has been delayed until 14:30.',
      'Passengers who have connecting flights should speak to a staff member at Gate 12 for rebooking. Meals will be served in the waiting area. We apologize for the inconvenience and thank you for your patience.',
    ],
    questions: [
      { id: 'p4-flight-1', prompt: 'What is the announcement about?', choices: ['A change of gate', 'A flight delay', 'A lost bag', 'A security check'], answer: 1, explanation: { vi: 'Chuyến bay bị hoãn vì sương mù dày.', en: 'The flight is delayed because of heavy fog.' } },
      { id: 'p4-flight-2', prompt: 'What is the new departure time?', choices: ['13:00', '14:30', '15:00', '12:30'], answer: 1, explanation: { vi: 'Giờ khởi hành mới là 14:30.', en: 'The new departure time is 14:30.' } },
      { id: 'p4-flight-3', prompt: 'What should passengers with connecting flights do?', choices: ['Go home', 'Speak to a staff member at Gate 12', 'Wait in the lounge', 'Buy a new ticket'], answer: 1, explanation: { vi: 'Hành khách có chuyến nối cần gặp nhân viên ở cổng 12 để đổi vé.', en: 'Passengers with connecting flights should speak to staff at Gate 12 for rebooking.' } },
    ],
  },
  {
    id: 'p4-workshop',
    kind: 'talk',
    title: { vi: 'Bài giới thiệu khoá đào tạo', en: 'Introduction to a training workshop' },
    lines: [
      'Thank you for joining the customer service workshop. My name is Priya, and I will lead the sessions on Tuesday and Thursday.',
      'The first session focuses on handling complaints calmly. The second session covers using the new ticketing system. Please bring your laptop on Thursday, because you will practise with the system directly.',
    ],
    questions: [
      { id: 'p4-workshop-1', prompt: 'Who is the speaker?', choices: ['A trainer', 'A customer', 'A driver', 'A finance manager'], answer: 0, explanation: { vi: 'Priya là người dẫn dắt các buổi học.', en: 'Priya leads the training sessions.' } },
      { id: 'p4-workshop-2', prompt: 'What will the second session cover?', choices: ['Complaint handling', 'The new ticketing system', 'Budgeting', 'The travel policy'], answer: 1, explanation: { vi: 'Buổi thứ hai hướng dẫn dùng hệ thống ticket mới.', en: 'The second session covers the new ticketing system.' } },
      { id: 'p4-workshop-3', prompt: 'What should participants bring on Thursday?', choices: ['A laptop', 'A notebook only', 'A manual', 'Nothing'], answer: 0, explanation: { vi: 'Thứ Năm cần mang laptop để thực hành.', en: 'They should bring a laptop to practise on Thursday.' } },
    ],
  },
];

/** Part 1: không có ảnh thật nên mô tả cảnh bằng chữ và đọc to; người học chọn câu mô tả đúng. */
export const TOEIC_PART1: readonly QaItem[] = [
  {
    id: 'p1-1',
    question: 'Scene: a woman sits at a desk beside a window, writing notes with a pen while a laptop is open in front of her.',
    responses: ['She is typing on a laptop.', 'She is writing notes by hand.', 'She is sitting in a car.', 'She is talking on the phone.'],
    answer: 1,
    explanation: { vi: 'Người phụ nữ đang viết tay. Laptop mở nhưng không phải là hành động chính.', en: 'The woman is writing by hand. The laptop is open but not the main action.' },
  },
  {
    id: 'p1-2',
    question: 'Scene: several workers stand around a table covered with blueprints.',
    responses: ['They are looking at blueprints together.', 'They are cleaning the windows.', 'They are riding bicycles.', 'They are eating lunch outdoors.'],
    answer: 0,
    explanation: { vi: 'Các công nhân cùng xem bản vẽ trên bàn.', en: 'The workers are looking at the blueprints together.' },
  },
  {
    id: 'p1-3',
    question: 'Scene: a delivery van is parked beside a warehouse, and boxes are being loaded onto it.',
    responses: ['Boxes are being unloaded from a truck.', 'A van is parked near a warehouse.', 'The warehouse doors are closed.', 'A man is driving a bus.'],
    answer: 1,
    explanation: { vi: 'Chiếc xe tải giao hàng đậu cạnh kho. Đáp án nói về việc dỡ hàng xuống chứ không phải bốc lên.', en: 'The delivery van is parked near the warehouse. The first option describes unloading, not loading.' },
  },
];

export const TOEFL_LISTENING: readonly ListenPassage[] = [
  {
    id: 'toefl-coral-bleaching',
    kind: 'lecture',
    title: { vi: 'Bài giảng: san hô bị tẩy trắng', en: 'Lecture: coral bleaching' },
    lines: [
      'Today we’ll look at coral bleaching. Corals live in a close partnership with tiny algae called zooxanthellae, which give the coral most of its colour and much of its food.',
      'When water temperatures rise even a few degrees above normal for several weeks, the coral expels these algae. Without them, the coral loses its colour and turns white, and it begins to starve.',
      'Bleaching is not always fatal. If conditions cool quickly, the algae can return and the coral can recover. However, repeated bleaching events leave little time for recovery, so reefs in warm regions are increasingly at risk.',
    ],
    questions: [
      {
        id: 'toefl-coral-1',
        prompt: 'What is the main topic of the lecture?',
        choices: ['How coral reefs form', 'Why coral loses its colour in warm water', 'How algae are harvested', 'The history of marine biology'],
        answer: 1,
        explanation: { vi: 'Bài giảng giải thích vì sao san hô mất màu khi nước quá ấm.', en: 'The lecture explains why corals lose colour when the water gets too warm.' },
      },
      {
        id: 'toefl-coral-2',
        prompt: 'What does the professor say about the zooxanthellae?',
        choices: ['They are harmful to the coral', 'They provide the coral with colour and food', 'They only live in cold water', 'They replace the coral each year'],
        answer: 1,
        explanation: { vi: 'Tảo cộng sinh cung cấp phần lớn màu sắc và thức ăn cho san hô.', en: 'The algae give the coral most of its colour and much of its food.' },
      },
      {
        id: 'toefl-coral-3',
        prompt: 'What can be inferred about coral reefs that bleach often?',
        choices: ['They recover more quickly than other reefs', 'They have less time to recover between events', 'They are no longer found in warm regions', 'They produce more algae'],
        answer: 1,
        explanation: { vi: 'Giáo sư nói các đợt tẩy trắng lặp lại để lại ít thời gian phục hồi.', en: 'The professor says repeated bleaching events leave little time to recover.' },
        kind: { vi: 'Suy luận', en: 'Inference' },
        level: 'hard',
      },
    ],
  },
  {
    id: 'toefl-campus-shuttle',
    kind: 'conversation',
    title: { vi: 'Hội thoại: thay đổi tuyến xe đưa đón', en: 'Conversation: a shuttle route change' },
    lines: [
      'M: Did you hear that the campus shuttle is changing its route next semester?',
      'W: No, I didn’t. Which stops are being removed?',
      'M: The stop at the science building is closing for repairs, so the shuttle will go straight from the library to the dormitories.',
      'W: That’s going to make my lab sessions harder. I usually take the shuttle from the science building in the morning.',
      'M: You could try the new bike rental station near the library. The university is offering the first month free for students.',
      'W: That might work. I’ll check whether the bikes have lights, since my classes end after dark.',
    ],
    questions: [
      {
        id: 'toefl-shuttle-1',
        prompt: 'What change is being made to the shuttle?',
        choices: ['It will run more often', 'It will skip the science building stop', 'It will stop running in winter', 'It will carry bicycles'],
        answer: 1,
        explanation: { vi: 'Điểm dừng ở toà nhà khoa học sẽ đóng để sửa chữa.', en: 'The stop at the science building is closing for repairs.' },
      },
      {
        id: 'toefl-shuttle-2',
        prompt: 'Why does the woman say her lab sessions will be harder?',
        choices: ['She has no other transport', 'She usually takes the shuttle from the science building', 'The lab is far from the library', 'Her classes start late'],
        answer: 1,
        explanation: { vi: 'Cô ấy thường đi xe đưa đón từ toà nhà khoa học vào buổi sáng.', en: 'She usually takes the shuttle from the science building in the morning.' },
      },
      {
        id: 'toefl-shuttle-3',
        prompt: 'What does the woman plan to check about the bikes?',
        choices: ['Their price', 'Whether they have lights', 'Their colour', 'Whether they can be rented in winter'],
        answer: 1,
        explanation: { vi: 'Cô ấy muốn xem xe có đèn không vì lớp học kết thúc sau khi trời tối.', en: 'She wants to know whether the bikes have lights, because her classes end after dark.' },
      },
    ],
  },
  {
    id: 'toefl-pottery',
    kind: 'lecture',
    title: { vi: 'Bài giảng: mảnh gốm và thương mại cổ', en: 'Lecture: pottery fragments and ancient trade' },
    lines: [
      'In this session, we’ll discuss how archaeologists use pottery fragments to reconstruct ancient trade. Pottery is common at excavation sites because it breaks easily but survives in the soil for thousands of years.',
      'Researchers often analyze the clay itself. Each region has a distinctive mineral composition, so a fragment can sometimes be traced back to its place of origin. When a piece made in one region is found far away, it suggests that people or goods traveled between the two places.',
      'However, we should be careful about drawing conclusions from a single fragment. Pottery can be copied, and people may have carried vessels with them when they moved. That is why archaeologists usually look for many fragments before they claim that a trade route existed.',
    ],
    questions: [
      {
        id: 'toefl-pottery-1',
        prompt: 'What is the main purpose of the lecture?',
        choices: [
          'To explain how pottery is manufactured today',
          'To describe how pottery helps reveal trade in the past',
          'To compare clay from different rivers',
          'To argue that pottery is not useful',
        ],
        answer: 1,
        explanation: { vi: 'Bài giảng nói cách đồ gốm giúp tìm lại hoạt động buôn bán trong quá khứ.', en: 'The lecture describes how pottery helps reconstruct past trade.' },
        kind: { vi: 'Ý chính', en: 'Main idea' },
        level: 'easy',
      },
      {
        id: 'toefl-pottery-2',
        prompt: 'According to the professor, why can a clay fragment sometimes be traced to its origin?',
        choices: ['It contains gold', 'Each region has a distinctive mineral composition', 'It is always stamped with a name', 'It was made by the same potter'],
        answer: 1,
        explanation: { vi: 'Mỗi vùng có thành phần khoáng chất riêng, nên có thể truy ngược nguồn gốc của mảnh gốm.', en: 'Each region has its own mineral composition, so a fragment can sometimes be traced to its origin.' },
        kind: { vi: 'Chi tiết', en: 'Detail' },
        level: 'medium',
      },
      {
        id: 'toefl-pottery-3',
        prompt: 'Why does the professor say that archaeologists look for many fragments?',
        choices: [
          'To count the number of potters in the past',
          'To avoid mistaking a single object for evidence of a trade route',
          'To prove that pottery was made in only one place',
          'To reduce the cost of excavation',
        ],
        answer: 1,
        explanation: { vi: 'Giáo sư nhấn mạnh cần nhiều mảnh để tránh kết luận sai từ một mảnh duy nhất.', en: 'The professor stresses that many fragments are needed to avoid a wrong conclusion from a single piece.' },
        kind: { vi: 'Mục đích của tác giả', en: 'Author’s purpose' },
        level: 'hard',
      },
    ],
  },
  {
    id: 'toefl-pollinators',
    kind: 'lecture',
    title: { vi: 'Bài giảng: loài thụ phấn', en: 'Lecture: pollinators' },
    lines: [
      'Today we’re talking about pollinators. Many plants depend on animals to move pollen from one flower to another.',
      'Bees are the most familiar, but birds, bats, and even some beetles also pollinate plants. Scientists have observed that when pollinator populations decline, crop yields can fall sharply.',
      'One way to support pollinators is to plant flowers that bloom at different times of the year, so that food is available throughout the season.',
    ],
    questions: [
      { id: 'toefl-poll-1', prompt: 'What is the main topic of the lecture?', choices: ['How plants grow', 'The role of pollinators', 'The history of bees', 'How to build a garden'], answer: 1, explanation: { vi: 'Bài giảng bàn về vai trò của loài thụ phấn.', en: 'The lecture is about the role of pollinators.' } },
      { id: 'toefl-poll-2', prompt: 'Why does the professor mention crop yields?', choices: ['To explain why flowers have colours', 'To show that pollinators affect food production', 'To describe how bats fly', 'To explain the colour of pollen'], answer: 1, explanation: { vi: 'Sản lượng cây trồng cho thấy loài thụ phấn ảnh hưởng đến lương thực.', en: 'Crop yields show that pollinators affect food production.' } },
      { id: 'toefl-poll-3', prompt: 'According to the lecture, how can people help pollinators?', choices: ['By removing all flowers', 'By planting flowers that bloom at different times', 'By buying more bees', 'By using more pesticides'], answer: 1, explanation: { vi: 'Trồng hoa nở vào các thời điểm khác nhau giúp có thức ăn quanh năm.', en: 'Planting flowers that bloom at different times keeps food available all season.' } },
      { id: 'toefl-poll-4', prompt: 'What does the professor imply about the future of pollinators?', choices: ['They will disappear completely next year', 'Their decline could reduce food production', 'They are not important for farming', 'They only live near cities'], answer: 1, kind: { vi: 'Suy luận', en: 'Inference' }, level: 'hard', explanation: { vi: 'Giáo sư nhấn mạnh việc loài thụ phấn giảm sẽ ảnh hưởng đến sản lượng cây trồng.', en: 'The professor stresses that a decline in pollinators affects crop yields.' } },
    ],
  },
  {
    id: 'toefl-major-change',
    kind: 'conversation',
    title: { vi: 'Hội thoại: đổi ngành học', en: 'Conversation: changing a major' },
    lines: [
      'S: Hi, I’m thinking about changing my major from chemistry to environmental science. Is it too late?',
      'A: Not at all. Most of your chemistry credits will count towards the new degree.',
      'S: That’s good to hear. But I’m worried about the lab requirements.',
      'A: The environmental program has fewer lab hours, but you’ll need to take a fieldwork course in the summer.',
    ],
    questions: [
      { id: 'toefl-major-1', prompt: 'Why does the student visit the advisor?', choices: ['To register for summer classes', 'To ask about changing majors', 'To request a new lab', 'To apply for a job'], answer: 1, explanation: { vi: 'Sinh viên hỏi về việc đổi ngành.', en: 'The student asks about changing majors.' } },
      { id: 'toefl-major-2', prompt: 'What does the advisor say about the credits?', choices: ['They will not count', 'Most will count towards the new degree', 'They must be repeated', 'Only half will count'], answer: 1, explanation: { vi: 'Phần lớn tín chỉ hoá học sẽ được tính vào ngành mới.', en: 'Most chemistry credits will count towards the new degree.' } },
      { id: 'toefl-major-3', prompt: 'What is the student worried about?', choices: ['The cost', 'The lab requirements', 'The schedule', 'The advisor'], answer: 1, explanation: { vi: 'Sinh viên lo về yêu cầu thực hành trong phòng thí nghiệm.', en: 'The student is worried about the lab requirements.' } },
    ],
  },
  {
    id: 'toefl-earthquake',
    kind: 'lecture',
    title: { vi: 'Bài giảng: cảnh báo động đất sớm', en: 'Lecture: earthquake early warning' },
    lines: [
      'Today we’ll discuss earthquake early warning systems. These systems detect the first, less damaging seismic waves and send alerts before the stronger shaking arrives.',
      'The warning can give people a few seconds to stop trains, open doors or move away from windows. However, the warning time depends on distance from the earthquake centre. People close to the epicentre may receive little or no warning. Engineers are working to make detection faster and more accurate.',
    ],
    questions: [
      { id: 'toefl-quake-1', prompt: 'What is the main topic of the lecture?', choices: ['How earthquakes form', 'How early warning systems work', 'The history of seismology', 'How to build houses'], answer: 1, explanation: { vi: 'Bài giảng giải thích cách hệ thống cảnh báo sớm hoạt động.', en: 'The lecture explains how early warning systems work.' } },
      { id: 'toefl-quake-2', prompt: 'Why might people near the epicentre receive little warning?', choices: ['The shaking arrives before the warning reaches them', 'The sensors are turned off', 'They are far from the sea', 'The waves are weaker there'], answer: 0, explanation: { vi: 'Gần tâm chấn, rung lắc đến trước khi cảnh báo kịp truyền tới.', en: 'Near the epicentre, shaking arrives before the warning can travel there.' } },
      { id: 'toefl-quake-3', prompt: 'According to the lecture, what can a few seconds of warning allow people to do?', choices: ['Stop trains and move away from windows', 'Build new houses', 'Measure the depth of the earthquake', 'Predict the next earthquake'], answer: 0, explanation: { vi: 'Vài giây có thể đủ để dừng tàu hoặc tránh xa cửa sổ.', en: 'A few seconds can be enough to stop trains or move away from windows.' } },
    ],
  },
  {
    id: 'toefl-library-request',
    kind: 'conversation',
    title: { vi: 'Hội thoại: sách đặt trước ở thư viện', en: 'Conversation: a requested library book' },
    lines: [
      'S: Excuse me, I requested a book from the storage section three days ago, but it still isn’t on the shelf.',
      'A: Let me check the system. What is the title?',
      'S: It’s a history of urban planning. I was told it would be ready after two days.',
      'A: I see it. It was returned yesterday, but it hasn’t been shelved yet. You can collect it at the desk in ten minutes.',
      'S: Thank you. Could I also renew my other book? It’s due tomorrow.',
      'A: Of course. Renewals can be made online or here at the desk.',
    ],
    questions: [
      { id: 'toefl-library-1', prompt: 'Why does the student visit the desk?', choices: ['To return a book', 'To find a requested book', 'To pay a fine', 'To join a course'], answer: 1, explanation: { vi: 'Sinh viên hỏi về cuốn sách đã đặt trước.', en: 'The student asks about a book they requested.' } },
      { id: 'toefl-library-2', prompt: 'What happened to the book?', choices: ['It was lost', 'It was returned but not yet shelved', 'It was sold', 'It is being repaired'], answer: 1, explanation: { vi: 'Sách đã được trả hôm qua nhưng chưa được xếp lên kệ.', en: 'The book was returned yesterday but has not been shelved yet.' } },
      { id: 'toefl-library-3', prompt: 'What else does the student ask about?', choices: ['Renewing another book', 'Buying a new library card', 'Booking a room', 'Reporting a lost item'], answer: 0, explanation: { vi: 'Sinh viên muốn gia hạn cuốn sách khác sắp đến hạn.', en: 'The student wants to renew another book that is due tomorrow.' } },
    ],
  },
];
