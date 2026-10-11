import type { Bi } from '@/i18n/useL';
import type { ReadingQuestion } from './reading-types';

/**
 * Bộ mẫu Part 6 và Part 7 do Band 9 tự soạn. Đây không phải đề thi thật.
 * Chỗ trống trong Part 6 được đánh dấu {n} trong nội dung đoạn văn, tương ứng câu hỏi có cùng số thứ tự.
 */
export type Part6Text = {
  id: string;
  title: Bi;
  body: string;
  blanks: readonly ReadingQuestion[];
  /** Câu chèn: đoạn văn có các dấu [A]–[D]; `answer` là chỉ số vị trí đúng (0 = [A]). */
  insertion?: { sentence: string; answer: number; explanation: Bi };
};

export type Part7Set = {
  id: string;
  title: Bi;
  texts: readonly string[];
  questions: readonly ReadingQuestion[];
};

export const TOEIC_PART6: readonly Part6Text[] = [
  {
    id: 'p6-expense-policy',
    title: { vi: 'Thư: chính sách chi phí mới', en: 'Email: updated expense policy' },
    insertion: {
      sentence: 'Expenses without an original receipt cannot be reimbursed.',
      answer: 1,
      explanation: {
        vi: 'Câu này nói về điều kiện hoàn tiền, nên đặt ngay sau câu về yêu cầu hoàn tiền [B].',
        en: 'This sentence states a condition for reimbursement, so it belongs right after the sentence about reimbursement requests [B].',
      },
    },
    body: [
      'To: All staff',
      'From: Linh Tran, Human Resources',
      'Subject: Updated expense policy',
      '',
      'Starting 1 May, employees who travel on business must submit receipts within 14 days {1} their return. [A] Reimbursement requests {2} be approved by a line manager before they go to the finance office. [B]',
      '',
      'Please address questions about the new policy to Linh Tran, {3} contact details appear on the intranet. [C] This policy takes effect on 1 May, {4} all previous guidelines. [D]',
    ].join('\n'),
    blanks: [
      {
        id: 'p6-expense-1',
        prompt: 'Chỗ trống 1',
        choices: ['after', 'since', 'during', 'until'],
        answer: 0,
        explanation: {
          vi: '"Within 14 days after their return" nghĩa là hạn tính từ ngày về. "Since", "during", "until" không hợp với cách nói có "within".',
          en: '"Within 14 days after their return" sets the window from the return date. "Since", "during" and "until" do not fit a window stated with "within".',
        },
      },
      {
        id: 'p6-expense-2',
        prompt: 'Chỗ trống 2',
        choices: ['must', 'to', 'have', 'being'],
        answer: 0,
        explanation: {
          vi: 'Cấu trúc là động từ khuyết thiếu + be + quá khứ phân từ: "must be approved".',
          en: 'The structure is modal + be + past participle: "must be approved".',
        },
      },
      {
        id: 'p6-expense-3',
        prompt: 'Chỗ trống 3',
        choices: ['whose', 'who', 'which', 'whom'],
        answer: 0,
        explanation: {
          vi: 'Chỉ sở hữu cho người: "Linh Tran, whose contact details..." ("contact details" thuộc về chị Linh).',
          en: '"Whose" shows possession for a person: the contact details belong to Linh Tran.',
        },
      },
      {
        id: 'p6-expense-4',
        prompt: 'Chỗ trống 4',
        choices: ['replace', 'replaces', 'replacing', 'replaced'],
        answer: 2,
        explanation: {
          vi: 'Cụm phân từ hiện tại "replacing all previous guidelines" bổ nghĩa cho chính sách. Quá khứ phân từ sẽ mang nghĩa bị động và không hợp.',
          en: 'The present participle "replacing all previous guidelines" describes the policy. A past participle would imply the policy was replaced.',
        },
      },
    ],
  },
  {
    id: 'p6-office-move',
    title: { vi: 'Thông báo: chuyển văn phòng', en: 'Notice: office move' },
    body: [
      'Notice to all staff',
      '',
      'All staff are asked to {1} their personal belongings by Friday, 1 March. The accounting department will move to Floor 5 {2} the week of 3 March.',
      '',
      'Movers will be {3} to help with heavy boxes, so please label your items clearly. Desks and phones will be set up {4} the team arrives, so there should be no disruption to work.',
    ].join('\n'),
    blanks: [
      {
        id: 'p6-move-1',
        prompt: 'Chỗ trống 1',
        choices: ['pack', 'packs', 'packed', 'packing'],
        answer: 0,
        explanation: {
          vi: 'Sau "to" là động từ nguyên mẫu: "are asked to pack".',
          en: 'After "to" you need the base verb: "are asked to pack".',
        },
      },
      {
        id: 'p6-move-2',
        prompt: 'Chỗ trống 2',
        choices: ['during', 'while', 'since', 'whether'],
        answer: 0,
        explanation: {
          vi: '"During the week" là cụm giới từ chỉ thời gian. "While" cần một mệnh đề đi sau.',
          en: '"During the week" is a prepositional phrase of time. "While" needs a full clause after it.',
        },
      },
      {
        id: 'p6-move-3',
        prompt: 'Chỗ trống 3',
        choices: ['provided', 'providing', 'provider', 'provision'],
        answer: 0,
        explanation: {
          vi: '"Will be provided" là bị động. Sau "be" cần quá khứ phân từ.',
          en: '"Will be provided" is passive, so the past participle is needed after "be".',
        },
      },
      {
        id: 'p6-move-4',
        prompt: 'Chỗ trống 4',
        choices: ['before', 'during', 'until', 'if'],
        answer: 0,
        explanation: {
          vi: 'Bàn và điện thoại được lắp đặt trước khi nhóm đến. "Before the team arrives" là logic đúng.',
          en: 'Desks and phones are set up before the team arrives, so "before" is the logical link.',
        },
      },
    ],
  },
  {
    id: 'p6-training-notice',
    title: { vi: 'Thông báo: lịch tập huấn', en: 'Notice: training session' },
    body: [
      'To: Sales team',
      'Subject: Product training on 15 August',
      '',
      'Please note that the product training session has been moved to 15 August. The session will now take place in Room 3 instead of the main hall, {1} the new room can seat only 40 people.',
      '',
      'Staff who cannot attend {2} inform their team leader by 10 August. Lunch will be provided {3} the session. Thank you for your {4} cooperation.',
    ].join('\n'),
    blanks: [
      {
        id: 'p6-training-1',
        prompt: 'Chỗ trống 1',
        choices: ['although', 'as', 'despite', 'unless'],
        answer: 1,
        explanation: {
          vi: '"As" nêu lý do (vì phòng chỉ chứa 40 người). "Although" báo sự tương phản, "despite" cần danh từ, "unless" nêu điều kiện.',
          en: '"As" gives the reason. "Although" signals contrast, "despite" needs a noun phrase, and "unless" gives a condition.',
        },
      },
      {
        id: 'p6-training-2',
        prompt: 'Chỗ trống 2',
        choices: ['should', 'to', 'have', 'being'],
        answer: 0,
        explanation: {
          vi: 'Động từ khuyết thiếu "should" đi với động từ nguyên mẫu: "should inform".',
          en: 'The modal "should" is followed by the base verb: "should inform".',
        },
      },
      {
        id: 'p6-training-3',
        prompt: 'Chỗ trống 3',
        choices: ['during', 'while', 'until', 'since'],
        answer: 0,
        explanation: {
          vi: '"During the session" là cụm giới từ chỉ thời gian. Các lựa chọn còn lại cần mệnh đề hoặc không hợp nghĩa.',
          en: '"During the session" is a prepositional phrase of time. The other options need a clause or do not fit the meaning.',
        },
      },
      {
        id: 'p6-training-4',
        prompt: 'Chỗ trống 4',
        choices: ['prompt', 'promptly', 'promptness', 'prompting'],
        answer: 0,
        explanation: {
          vi: 'Tính từ đứng trước danh từ "cooperation": "prompt cooperation" nghĩa là sự hợp tác nhanh chóng.',
          en: 'An adjective comes before the noun "cooperation": "prompt cooperation".',
        },
      },
    ],
  },
  {
    id: 'p6-travel-policy',
    title: { vi: 'Thông báo: chính sách đi công tác', en: 'Memo: travel policy changes' },
    body: [
      'To: All employees',
      'Subject: Changes to the travel policy',
      '',
      'Starting next month, employees must book business flights {1} the company travel agency. Flights booked through other sites {2} be reimbursed. Hotel bookings should be made at least seven days in advance, {3} the prices are usually lower.',
      '',
      'Questions about the policy can be sent {4} the Finance Department.',
    ].join('\n'),
    blanks: [
      { id: 'p6-travel-1', prompt: 'Chỗ trống 1', choices: ['through', 'to', 'which', 'while'], answer: 0, explanation: { vi: '"Book ... through the company travel agency" là cách đặt vé qua đại lý.', en: '"Book ... through the company travel agency" describes the booking channel.' } },
      { id: 'p6-travel-2', prompt: 'Chỗ trống 2', choices: ['will not', 'not', 'to', 'do not'], answer: 0, explanation: { vi: 'Thì tương lai "will not be reimbursed" là đúng; "not be" hay "do not be" đều sai ngữ pháp.', en: 'The future form "will not be reimbursed" is correct; "not be" and "do not be" are ungrammatical.' } },
      { id: 'p6-travel-3', prompt: 'Chỗ trống 3', choices: ['because', 'despite', 'although', 'unless'], answer: 0, explanation: { vi: '"Because" nêu lý do đặt sớm: giá thường thấp hơn.', en: '"Because" gives the reason for booking early: prices are usually lower.' } },
      { id: 'p6-travel-4', prompt: 'Chỗ trống 4', choices: ['to', 'at', 'from', 'about'], answer: 0, explanation: { vi: '"Sent to" một bộ phận là cách nói đúng.', en: '"Sent to" a department is the correct phrase.' } },
    ],
  },
  {
    id: 'p6-library-notice',
    title: { vi: 'Thông báo: sửa chữa thư viện', en: 'Notice: library renovation' },
    body: [
      'Notice to members',
      '',
      'The main reading room will be closed for renovation from 3 March until 21 March. During this period, study tables {1} available on the second floor. Members are asked to return all borrowed books {2} the closure begins.',
      '',
      'The library catalogue {3} remain accessible online throughout the renovation. We {4} your patience and apologize for any inconvenience.',
    ].join('\n'),
    blanks: [
      { id: 'p6-library-1', prompt: 'Chỗ trống 1', choices: ['will be', 'be', 'being', 'to be'], answer: 0, explanation: { vi: '"Will be available" là dạng tương lai đúng.', en: '"Will be available" is the correct future form.' } },
      { id: 'p6-library-2', prompt: 'Chỗ trống 2', choices: ['before', 'during', 'since', 'until'], answer: 0, explanation: { vi: 'Trả sách trước khi đóng cửa: "before the closure begins".', en: 'Return the books before the closure begins.' } },
      { id: 'p6-library-3', prompt: 'Chỗ trống 3', choices: ['will', 'to', 'being', 'that'], answer: 0, explanation: { vi: 'Trợ động từ "will" đứng trước động từ "remain".', en: 'The auxiliary "will" comes before the verb "remain".' } },
      { id: 'p6-library-4', prompt: 'Chỗ trống 4', choices: ['appreciate', 'appreciated', 'appreciating', 'appreciation'], answer: 0, explanation: { vi: 'Chủ ngữ "We" cần động từ nguyên thể ở thì hiện tại: "We appreciate".', en: 'The subject "We" takes the base verb in the present tense: "We appreciate".' } },
    ],
  },
  {
    id: 'p6-hiring-notice',
    title: { vi: 'Thông báo: tuyển nhân viên kinh doanh', en: 'Notice: recruiting for the sales team' },
    insertion: {
      sentence: 'Candidates who are not shortlisted will be notified by email within a week.',
      answer: 1,
      explanation: {
        vi: 'Câu này nói về những ứng viên không vào vòng sau, nên đặt ngay sau câu về việc chọn ứng viên [B].',
        en: 'This sentence covers candidates who are not shortlisted, so it follows the sentence about shortlisting [B].',
      },
    },
    body: [
      'To: Department managers',
      'From: Minh Pham, Human Resources',
      'Subject: Recruitment for the sales team',
      '',
      'Three new positions in the sales team will open on 15 June. Managers should review the job descriptions {1} send them to HR by 30 May. [A] Applicants {2} be shortlisted by a panel that includes at least one senior manager. [B]',
      '',
      'Interviews will take place during the first week of July. Each candidate {3} a short written test before the final interview. [C] Successful applicants will be asked {4} their start date by 15 July. [D]',
    ].join('\n'),
    blanks: [
      {
        id: 'p6-hiring-1',
        prompt: 'Chỗ trống 1',
        choices: ['and', 'but', 'so', 'yet'],
        answer: 0,
        explanation: { vi: '"And" nối hai việc của quản lý: xem lại mô tả công việc và gửi cho HR.', en: '"And" joins two actions: reviewing the job descriptions and sending them to HR.' },
      },
      {
        id: 'p6-hiring-2',
        prompt: 'Chỗ trống 2',
        choices: ['will', 'to', 'being', 'have'],
        answer: 0,
        explanation: { vi: 'Thì tương lai bị động "will be shortlisted", vì việc chọn vòng sau sẽ diễn ra sau này.', en: 'The future passive "will be shortlisted" fits, because the shortlisting happens later.' },
      },
      {
        id: 'p6-hiring-3',
        prompt: 'Chỗ trống 3',
        choices: ['must complete', 'completed', 'completing', 'completion'],
        answer: 0,
        explanation: { vi: 'Động từ khuyết thiếu "must" đi với động từ nguyên thể: "must complete".', en: 'The modal "must" takes the base verb: "must complete".' },
      },
      {
        id: 'p6-hiring-4',
        prompt: 'Chỗ trống 4',
        choices: ['to confirm', 'confirm', 'confirming', 'confirmed'],
        answer: 0,
        explanation: { vi: 'Cấu trúc "be asked to + động từ nguyên thể": "will be asked to confirm".', en: 'The pattern "be asked to + base verb" fits: "will be asked to confirm".' },
      },
    ],
  },
  {
    id: 'p6-delivery-delay',
    title: { vi: 'Email: thông báo giao hàng chậm', en: 'Email: delayed delivery notice' },
    insertion: {
      sentence: 'The warehouse expects to resume normal operations by the end of March.',
      answer: 0,
      explanation: {
        vi: 'Câu này cho biết khi nào kho hoạt động trở lại, nên đặt ngay sau câu thông báo giao hàng bị chậm [A].',
        en: 'This sentence says when the warehouse returns to normal, so it follows the sentence about the delay [A].',
      },
    },
    body: [
      'To: Mr. David Chen',
      'From: Customer Service, Northwind Supplies',
      'Subject: Delay to your order',
      '',
      'Thank you for your order of 12 March. Unfortunately, the warehouse {1} a shortage of packaging materials, so your shipment will be delayed by five days. [A] We {2} for the inconvenience and have added a 10 percent credit to your account. [B]',
      '',
      'Your goods {3} be dispatched on 22 March. [C] If this date does not suit you, please let us know {4} we can change the delivery address. [D]',
    ].join('\n'),
    blanks: [
      {
        id: 'p6-delay-1',
        prompt: 'Chỗ trống 1',
        choices: ['has experienced', 'experiencing', 'experience', 'to experience'],
        answer: 0,
        explanation: { vi: 'Chủ ngữ "the warehouse" số ít và tình trạng thiếu hàng vẫn ảnh hưởng: thì hiện tại hoàn thành "has experienced".', en: 'The singular subject "the warehouse" and a shortage that still matters call for the present perfect "has experienced".' },
      },
      {
        id: 'p6-delay-2',
        prompt: 'Chỗ trống 2',
        choices: ['apologize', 'apologizes', 'apologizing', 'to apologize'],
        answer: 0,
        explanation: { vi: 'Chủ ngữ "We" đi với động từ nguyên thể ở thì hiện tại: "We apologize".', en: 'The subject "We" takes the base verb in the present tense: "We apologize".' },
      },
      {
        id: 'p6-delay-3',
        prompt: 'Chỗ trống 3',
        choices: ['will', 'to', 'being', 'have'],
        answer: 0,
        explanation: { vi: 'Ngày giao 22 tháng 3 là kế hoạch chắc chắn, nên dùng thì tương lai "will be dispatched".', en: 'The dispatch date is a firm plan, so the future "will be dispatched" fits.' },
      },
      {
        id: 'p6-delay-4',
        prompt: 'Chỗ trống 4',
        choices: ['whether', 'unless', 'despite', 'although'],
        answer: 0,
        explanation: { vi: '"Let us know whether" nghĩa là cho biết liệu có thể hay không; các từ còn lại không hợp nghĩa.', en: '"Let us know whether" means tell us if; the other linking words do not fit the meaning.' },
      },
    ],
  },
];

export const TOEIC_PART7: readonly Part7Set[] = [
  {
    id: 'p7-meeting-rooms',
    title: { vi: 'Quảng cáo: thuê phòng họp', en: 'Advertisement: meeting room rental' },
    texts: [
      'Riverside Business Center offers meeting rooms for hourly or full-day hire. Rooms A and B seat up to 12 people and include a projector and whiteboard. Room C seats 30 and includes a sound system.',
      'Bookings must be made at least 48 hours in advance. Cancellations made more than 24 hours before the start time receive a full refund; later cancellations are charged 50 percent of the fee. Members of the center receive a 15 percent discount on all bookings.',
    ],
    questions: [
      {
        id: 'p7-rooms-1',
        prompt: 'How many people can Room C seat?',
        choices: ['12', '24', '30', '48'],
        answer: 2,
        explanation: { vi: 'Đoạn đầu ghi phòng C chứa được 30 người.', en: 'The first text says Room C seats 30.' },
      },
      {
        id: 'p7-rooms-2',
        prompt: 'How much notice is required to make a booking?',
        choices: ['24 hours', '48 hours', 'one week', 'the same day'],
        answer: 1,
        explanation: { vi: 'Đoạn sau: đặt phòng trước ít nhất 48 giờ.', en: 'The second text: bookings need at least 48 hours of notice.' },
      },
      {
        id: 'p7-rooms-3',
        prompt: 'A customer cancels 20 hours before the start time. What happens?',
        choices: ['A full refund is given.', '50 percent of the fee is charged.', 'No fee is charged.', 'A 15 percent discount is given.'],
        answer: 1,
        explanation: {
          vi: 'Hủy trước ít hơn 24 giờ thì bị tính 50% phí. Hoàn đủ chỉ áp dụng khi hủy trước hơn 24 giờ.',
          en: 'Cancelling less than 24 hours ahead means 50 percent of the fee is charged. A full refund needs more than 24 hours of notice.',
        },
      },
      {
        id: 'p7-rooms-4',
        prompt: 'What benefit do members of the center receive?',
        choices: ['A free room each month', 'A 15 percent discount', 'Extra hours at no cost', 'A free projector'],
        answer: 1,
        explanation: { vi: 'Hội viên được giảm 15% cho mọi lần đặt phòng.', en: 'Members receive a 15 percent discount on all bookings.' },
      },
      {
        id: 'p7-rooms-5',
        prompt: 'Which item is included in Room C but NOT in Rooms A and B?',
        choices: ['A projector', 'A whiteboard', 'A sound system', 'A seat for 12 people'],
        answer: 2,
        kind: { vi: 'Chi tiết (loại trừ)', en: 'Detail (exclusion)' },
        level: 'medium',
        explanation: { vi: 'Phòng C có hệ thống âm thanh. Phòng A và B có máy chiếu và bảng trắng.', en: 'Room C includes a sound system. Rooms A and B have a projector and whiteboard.' },
      },
    ],
  },
  {
    id: 'p7-workshop-email',
    title: { vi: 'Email và lịch làm việc', en: 'Email and draft schedule' },
    texts: [
      'From: Hoa Nguyen\nTo: Duc Pham\nSubject: Workshop on 12 June\n\nDear Duc, thank you for organizing the workshop. I would like to add a 30-minute session on budgeting and move the lunch break to 12:30. Could you also confirm whether the projector in Room B is available? Best, Hoa',
      'Draft schedule, 12 June, Room B\n9:00  Welcome\n9:30  Market trends\n11:30 Lunch (12:00)\n13:00 Questions and answers',
    ],
    questions: [
      {
        id: 'p7-workshop-1',
        prompt: 'What does Hoa want to change?',
        choices: ['The venue', 'The date', 'A budgeting session and the lunch time', 'The number of attendees'],
        answer: 2,
        explanation: {
          vi: 'Hoa muốn thêm một buổi về ngân sách và chuyển giờ ăn trưa sang 12:30.',
          en: 'Hoa wants to add a budgeting session and move lunch to 12:30.',
        },
      },
      {
        id: 'p7-workshop-2',
        prompt: 'Which room is planned for the workshop?',
        choices: ['Room A', 'Room B', 'Room C', 'Room D'],
        answer: 1,
        explanation: { vi: 'Lịch làm việc ghi tiêu đề Room B.', en: 'The draft schedule is for Room B.' },
      },
      {
        id: 'p7-workshop-3',
        prompt: 'What does Hoa ask Duc to do?',
        choices: ['Book a new room', 'Confirm whether the projector is available', 'Send an invoice', 'Pay a deposit'],
        answer: 1,
        explanation: { vi: 'Hoa nhờ Duc xác nhận máy chiếu phòng B có sẵn không.', en: 'Hoa asks Duc to confirm whether the projector in Room B is available.' },
      },
    ],
  },
  {
    id: 'p7-invoice-dispute',
    title: { vi: 'Email: hóa đơn đã thanh toán', en: 'Email chain: invoice already paid' },
    texts: [
      'From: Accounts Office\nTo: Minh Tran\nSubject: Invoice INV-2281\n\nDear Mr Tran, our records show that invoice INV-2281 for 4,200 dollars has not been paid. The payment was due on 30 June. Please send a copy of the bank transfer so we can update our records.',
      'From: Minh Tran\nTo: Accounts Office\nSubject: RE: Invoice INV-2281\n\nDear Accounts Office, I paid this invoice on 28 June through our usual bank. I have attached the transfer receipt. I apologize for the delay in confirming this. Regards, Minh Tran',
    ],
    questions: [
      {
        id: 'p7-invoice-1',
        prompt: 'Why did the Accounts Office write the first email?',
        choices: ['To request a new invoice', 'To say the invoice has not been paid', 'To confirm a meeting', 'To offer a discount'],
        answer: 1,
        explanation: { vi: 'Email đầu cho biết hóa đơn chưa được thanh toán theo hồ sơ.', en: 'The first email says the invoice is not recorded as paid.' },
      },
      {
        id: 'p7-invoice-2',
        prompt: 'When did Mr Tran pay the invoice?',
        choices: ['On 28 June', 'On 30 June', 'On 4 July', 'On 1 June'],
        answer: 0,
        explanation: { vi: 'Email trả lời: anh Tran thanh toán ngày 28 tháng 6. Ngày 30 tháng 6 là hạn thanh toán.', en: 'Mr Tran says he paid on 28 June. 30 June was the due date.' },
      },
      {
        id: 'p7-invoice-3',
        prompt: 'What did Mr Tran attach to his reply?',
        choices: ['An invoice', 'A bank transfer receipt', 'A contract', 'A list of payments'],
        answer: 1,
        explanation: { vi: 'Anh Tran đính kèm biên lai chuyển khoản.', en: 'Mr Tran attached the transfer receipt.' },
      },
      {
        id: 'p7-invoice-4',
        prompt: 'In the second email, the word "receipt" is closest in meaning to:',
        choices: ['A proof of payment', 'A bill', 'A contract', 'A refund'],
        answer: 0,
        kind: { vi: 'Từ trong ngữ cảnh', en: 'Vocabulary in context' },
        level: 'medium',
        explanation: { vi: '"Transfer receipt" là biên lai chứng minh đã chuyển tiền.', en: 'A "transfer receipt" is a document proving that the money was transferred.' },
      },
    ],
  },
  {
    id: 'p7-language-school',
    title: { vi: 'Quảng cáo và đánh giá: lớp tiếng Anh', en: 'Advertisement and review: English classes' },
    texts: [
      'Brightway Language School offers evening classes for working adults. Classes meet twice a week for ten weeks. The fee is 2,400,000 dong, including textbooks. Students who enrol before 31 May receive a 10 percent discount.',
      'Review by Hoang Anh, 12 April: I joined the Monday and Wednesday class last term. The teachers adjusted lessons to my schedule, and the textbooks were excellent. The only drawback is that the classrooms can be crowded.',
    ],
    questions: [
      { id: 'p7-school-1', prompt: 'How long does a course last?', choices: ['Five weeks', 'Ten weeks', 'One year', 'Twelve weeks'], answer: 1, explanation: { vi: 'Lớp học kéo dài mười tuần, hai buổi mỗi tuần.', en: 'Classes run for ten weeks, twice a week.' } },
      { id: 'p7-school-2', prompt: 'What is included in the fee?', choices: ['Transport', 'Textbooks', 'Meals', 'Exam fees'], answer: 1, explanation: { vi: 'Học phí đã gồm sách giáo khoa.', en: 'The fee includes textbooks.' } },
      { id: 'p7-school-3', prompt: 'What discount do students receive for enrolling early?', choices: ['5 percent', '10 percent', '15 percent', '20 percent'], answer: 1, explanation: { vi: 'Ghi danh trước 31 tháng 5 được giảm 10%.', en: 'Enrolling before 31 May gives a 10 percent discount.' } },
      { id: 'p7-school-4', prompt: 'What does Hoang Anh say about the classrooms?', choices: ['They are too large', 'They can be crowded', 'They are new', 'They are far away'], answer: 1, explanation: { vi: 'Hoàng Anh nói nhược điểm là lớp học có thể đông.', en: 'Hoang Anh says the classrooms can be crowded.' } },
      {
        id: 'p7-school-5',
        prompt: 'What can be inferred about Brightway Language School?',
        choices: ['It only teaches children', 'It offers classes after work hours', 'It has no textbooks', 'It is located outside the city'],
        answer: 1,
        kind: { vi: 'Suy luận', en: 'Inference' },
        level: 'hard',
        explanation: { vi: 'Trường mở lớp buổi tối cho người đi làm, nên có thể suy ra là có lớp sau giờ làm.', en: 'The school offers evening classes for working adults, so classes after work hours can be inferred.' },
      },
    ],
  },
  {
    id: 'p7-team-schedule',
    title: { vi: 'Lịch làm việc và email', en: 'Team schedule and email' },
    texts: [
      'Team schedule, week of 9 June\nMon: Client visit (Mai)\nTue: Budget meeting, Room 2\nWed: Training for all staff, Room 4\nThu: Off-site event (Linh)\nFri: Report deadline',
      'From: Linh\nTo: Mai\nSubject: Budget meeting\n\nHi Mai, can we move the budget meeting to Thursday afternoon? I will be at the off-site event in the morning. Thanks, Linh',
    ],
    questions: [
      { id: 'p7-schedule-1', prompt: 'Why does Linh want to move the budget meeting?', choices: ['She has a training session', 'She will be at an off-site event in the morning', 'The room is booked', 'She is ill'], answer: 1, explanation: { vi: 'Linh sẽ dự sự kiện ngoài văn phòng vào buổi sáng thứ Năm.', en: 'Linh will be at the off-site event on Thursday morning.' } },
      { id: 'p7-schedule-2', prompt: 'What is scheduled for Wednesday?', choices: ['The budget meeting', 'Training for all staff', 'The client visit', 'The off-site event'], answer: 1, explanation: { vi: 'Thứ Tư là buổi đào tạo cho toàn bộ nhân viên.', en: 'Wednesday is training for all staff.' } },
      { id: 'p7-schedule-3', prompt: 'When is the report due?', choices: ['Monday', 'Wednesday', 'Thursday', 'Friday'], answer: 3, explanation: { vi: 'Hạn nộp báo cáo là thứ Sáu.', en: 'The report deadline is Friday.' } },
    ],
  },
  {
    id: 'p7-hotel-booking',
    title: { vi: 'Email xác nhận và chính sách khách sạn', en: 'Booking email and hotel policy' },
    texts: [
      'From: Grand Harbor Hotel Reservations\nTo: Anna Kim\nSubject: Your reservation (ref. GH-4471)\n\nDear Ms. Kim, thank you for booking a deluxe room for three nights, from Friday 9 May to Monday 12 May. Breakfast is complimentary for all guests. Check-in begins at 2 p.m.',
      'Hotel policy: Free cancellation is available until 48 hours before arrival. Later cancellations are charged the first night’s rate. Early check-in is possible for a fee of 25 dollars, subject to availability. The airport shuttle runs every hour from 6 a.m. to 10 p.m. and must be booked at least one day in advance.',
    ],
    questions: [
      {
        id: 'p7-hotel-1',
        prompt: 'How many nights has Ms. Kim booked?',
        choices: ['Two', 'Three', 'Four', 'Five'],
        answer: 1,
        explanation: { vi: 'Từ thứ Sáu 9 đến thứ Hai 12 tháng 5 là ba đêm.', en: 'From Friday 9 May to Monday 12 May is three nights.' },
      },
      {
        id: 'p7-hotel-2',
        prompt: 'What is included in the room price?',
        choices: ['Airport transfer', 'Breakfast', 'Early check-in', 'Parking'],
        answer: 1,
        explanation: { vi: 'Email ghi bữa sáng miễn phí cho mọi khách.', en: 'The email says breakfast is complimentary for all guests.' },
      },
      {
        id: 'p7-hotel-3',
        prompt: 'When must Ms. Kim cancel to avoid a charge?',
        choices: ['Before 2 p.m. on the day of arrival', 'At least 48 hours before arrival', 'At least one day before departure', 'Before check-in'],
        answer: 1,
        explanation: { vi: 'Được huỷ miễn phí đến 48 giờ trước khi đến.', en: 'Cancellation is free until 48 hours before arrival.' },
      },
      {
        id: 'p7-hotel-4',
        prompt: 'What is true about the airport shuttle?',
        choices: ['It runs all day and needs no booking', 'It must be booked at least one day in advance', 'It costs 25 dollars', 'It leaves only at 6 a.m.'],
        answer: 1,
        explanation: { vi: 'Xe đưa đón sân bay phải đặt trước ít nhất một ngày.', en: 'The shuttle must be booked at least one day in advance.' },
      },
    ],
  },
  {
    id: 'p7-product-recall',
    title: { vi: 'Thông báo thu hồi sản phẩm', en: 'Product recall notice' },
    texts: [
      'Notice to customers: Harmony Kitchen is recalling the H2 electric kettle, serial numbers 40100 to 41500, produced in January and February. A faulty switch may cause the kettle to overheat. Customers should stop using the kettle immediately and unplug it.',
      'Customers can return the kettle to any Harmony store or send it to our service center free of charge. A full refund or a replacement will be provided. Please keep your receipt if you have one. Questions can be sent to recall@harmonykitchen.example.',
    ],
    questions: [
      {
        id: 'p7-recall-1',
        prompt: 'Which kettles are affected?',
        choices: ['All H2 kettles', 'Kettles with serial numbers 40100 to 41500 made in January and February', 'Kettles sold after March', 'All Harmony kitchen products'],
        answer: 1,
        explanation: { vi: 'Chỉ các máy có số sê-ri 40100 đến 41500, sản xuất tháng 1 và tháng 2.', en: 'Only kettles with serial numbers 40100 to 41500, made in January and February.' },
      },
      {
        id: 'p7-recall-2',
        prompt: 'What problem may occur?',
        choices: ['The kettle may leak water', 'The kettle may overheat', 'The kettle may stop working in winter', 'The kettle may become too loud'],
        answer: 1,
        explanation: { vi: 'Công tắc bị lỗi có thể khiến ấm quá nóng.', en: 'A faulty switch may cause the kettle to overheat.' },
      },
      {
        id: 'p7-recall-3',
        prompt: 'What should customers do first?',
        choices: ['Return the kettle to a store', 'Stop using it and unplug it', 'Call the service center to request a refund', 'Keep using it until a replacement arrives'],
        answer: 1,
        explanation: { vi: 'Thông báo yêu cầu ngừng dùng và rút phích cắm ngay lập tức.', en: 'The notice says to stop using the kettle and unplug it immediately.' },
      },
      {
        id: 'p7-recall-4',
        prompt: 'Which of the following is NOT mentioned?',
        choices: ['A full refund is available', 'A replacement may be provided', 'Returning the kettle by post is free', 'A repair fee must be paid'],
        answer: 3,
        explanation: { vi: 'Thông báo không nhắc đến phí sửa chữa.', en: 'The notice does not mention any repair fee.' },
      },
    ],
  },
  {
    id: 'p7-job-posting',
    title: { vi: 'Tin tuyển dụng và email phản hồi', en: 'Job posting and reply email' },
    texts: [
      'Job posting: Marketing Assistant (full-time), Ho Chi Minh City. The assistant will support the marketing team with social media content, event planning and weekly reports. Candidates need at least one year of experience and good written English. Applications close on 30 April.',
      'From: Lan Nguyen, Hiring Manager\nSubject: Re: Your application\n\nThank you for applying. We were impressed by your portfolio and would like to invite you to a 30-minute interview on 6 May at 10 a.m. A short writing test will be given during the interview. If you cannot attend, please reply by 3 May so that we can arrange another time.',
    ],
    questions: [
      {
        id: 'p7-job-1',
        prompt: 'What is the main responsibility of the position?',
        choices: ['Managing the company’s accounts', 'Supporting the marketing team', 'Organizing the office move', 'Training new employees'],
        answer: 1,
        explanation: { vi: 'Vị trí này hỗ trợ đội marketing về nội dung mạng xã hội, sự kiện và báo cáo.', en: 'The role supports the marketing team with social media content, events and reports.' },
      },
      {
        id: 'p7-job-2',
        prompt: 'What experience do candidates need?',
        choices: ['None', 'At least one year', 'Three years', 'A design degree'],
        answer: 1,
        explanation: { vi: 'Ứng viên cần ít nhất một năm kinh nghiệm.', en: 'Candidates need at least one year of experience.' },
      },
      {
        id: 'p7-job-3',
        prompt: 'Why is Lan Nguyen writing to the applicant?',
        choices: ['To reject the application', 'To ask for a portfolio', 'To invite the applicant to an interview', 'To change the job location'],
        answer: 2,
        explanation: { vi: 'Email mời ứng viên đến buổi phỏng vấn ngày 6 tháng 5.', en: 'The email invites the applicant to an interview on 6 May.' },
      },
      {
        id: 'p7-job-4',
        prompt: 'What should the applicant do if they cannot attend on 6 May?',
        choices: ['Send a portfolio by email', 'Reply by 3 May', 'Call the office after the interview', 'Take the writing test at home'],
        answer: 1,
        explanation: { vi: 'Nếu không tham dự được, ứng viên cần trả lời trước ngày 3 tháng 5.', en: 'If the applicant cannot attend, they should reply by 3 May.' },
      },
    ],
  },
];
