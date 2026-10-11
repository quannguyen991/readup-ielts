import type { VocabEntry } from './vocab-types';

/** Từ vựng TOEIC bổ sung cho unit 11–20. Ví dụ do Band 9 tự soạn; mỗi ví dụ chứa đúng từ gốc. */
export const TOEIC_VOCAB_EXTRA: readonly VocabEntry[] = [
  // Unit 11 — thương mại quốc tế và hải quan
  { word: 'customs', pos: 'n', vi: 'hải quan', en: 'the government office that checks goods entering or leaving a country', example: 'Customs cleared the container after two days.' },
  { word: 'tariff', pos: 'n', vi: 'thuế nhập khẩu', en: 'a tax charged on goods brought into a country', example: 'The new tariff raised the price of imported steel.' },
  { word: 'import', pos: 'v', vi: 'nhập khẩu', en: 'to bring goods into a country from abroad', example: 'The company will import machinery from Germany.' },
  { word: 'freight', pos: 'n', vi: 'hàng hoá vận chuyển; cước vận chuyển', en: 'goods carried by ship, train, truck or plane, or the charge for carrying them', example: 'Freight charges rose sharply in the spring.' },
  { word: 'consignment', pos: 'n', vi: 'lô hàng gửi', en: 'a quantity of goods sent to a buyer or an agent', example: 'The consignment arrived with two damaged boxes.' },
  { word: 'clearance', pos: 'n', vi: 'thông quan', en: 'official permission for goods to pass through customs', example: 'Clearance usually takes two working days.' },
  { word: 'origin', pos: 'n', vi: 'xuất xứ', en: 'the country where a product was made or grown', example: 'Please state the country of origin on the form.' },
  { word: 'quota', pos: 'n', vi: 'hạn ngạch', en: 'a limit on the amount of a product that may be traded', example: 'The government set a quota on imported sugar.' },
  { word: 'declare', pos: 'v', vi: 'khai báo', en: 'to state officially the goods or money you are carrying', example: 'Travelers must declare all goods worth more than $500.' },
  { word: 'exchange', pos: 'n', vi: 'tỉ giá; sự trao đổi', en: 'the rate at which one currency can be changed into another', example: 'The exchange rate affects the cost of imported parts.' },

  // Unit 12 — tuyển dụng và sự nghiệp
  { word: 'applicant', pos: 'n', vi: 'ứng viên', en: 'a person who applies for a job', example: 'Each applicant completed an online test.' },
  { word: 'interview', pos: 'n', vi: 'buổi phỏng vấn', en: 'a meeting in which a candidate is questioned for a job', example: 'The interview lasted forty-five minutes.' },
  { word: 'hire', pos: 'v', vi: 'tuyển dụng', en: 'to employ someone', example: 'The firm plans to hire ten engineers next year.' },
  { word: 'resign', pos: 'v', vi: 'từ chức; nghỉ việc', en: 'to leave a job by choice', example: 'She will resign at the end of the month.' },
  { word: 'probation', pos: 'n', vi: 'thời gian thử việc', en: 'a trial period at the start of a job', example: 'New staff are on probation for three months.' },
  { word: 'salary', pos: 'n', vi: 'lương', en: 'a fixed payment for work, usually made every month', example: 'The salary is reviewed every January.' },
  { word: 'benefit', pos: 'n', vi: 'phúc lợi', en: 'something extra an employer provides, such as health insurance', example: 'Employees receive health benefits after one year.' },
  { word: 'mentor', pos: 'n', vi: 'người cố vấn', en: 'an experienced person who advises someone less experienced', example: 'Each new hire is paired with a mentor.' },
  { word: 'absence', pos: 'n', vi: 'sự vắng mặt', en: 'the fact of not being at work', example: 'Unexplained absence must be reported to HR.' },
  { word: 'workload', pos: 'n', vi: 'khối lượng công việc', en: 'the amount of work someone is expected to do', example: 'Her workload increased after the merger.' },

  // Unit 13 — sản xuất và chuỗi cung ứng
  { word: 'production', pos: 'n', vi: 'sản xuất', en: 'the making of goods in large quantities', example: 'Production stopped during the power outage.' },
  { word: 'capacity', pos: 'n', vi: 'công suất', en: 'the maximum amount a factory or system can produce or hold', example: 'The plant is running at full capacity.' },
  { word: 'assemble', pos: 'v', vi: 'lắp ráp', en: 'to put parts together to make a finished product', example: 'Workers assemble the engines by hand.' },
  { word: 'manufacture', pos: 'v', vi: 'sản xuất; chế tạo', en: 'to make goods in a factory', example: 'The company manufactures medical equipment.' },
  { word: 'warehouse', pos: 'n', vi: 'kho hàng', en: 'a large building for storing goods', example: 'The warehouse holds stock for three regions.' },
  { word: 'stock', pos: 'n', vi: 'hàng tồn kho', en: 'goods kept by a business to be sold', example: 'Stock levels are checked every Monday.' },
  { word: 'supplier', pos: 'n', vi: 'nhà cung cấp', en: 'a company that provides goods or materials', example: 'Our supplier delivers raw materials each week.' },
  { word: 'shortage', pos: 'n', vi: 'sự thiếu hụt', en: 'a situation in which there is not enough of something', example: 'A shortage of microchips delayed production.' },
  { word: 'specification', pos: 'n', vi: 'thông số kỹ thuật', en: 'a detailed description of the requirements for a product', example: 'The specification lists the size and weight of each part.' },
  { word: 'prototype', pos: 'n', vi: 'mẫu thử', en: 'the first working model of a new product', example: 'The prototype passed all safety tests.' },

  // Unit 14 — ngân hàng và đầu tư
  { word: 'invest', pos: 'v', vi: 'đầu tư', en: 'to put money into something in order to earn a return', example: 'The fund plans to invest in renewable energy.' },
  { word: 'loan', pos: 'n', vi: 'khoản vay', en: 'money borrowed that must be repaid with interest', example: 'The bank approved a loan for the expansion.' },
  { word: 'credit', pos: 'n', vi: 'tín dụng', en: 'the ability to borrow money or to pay for goods later', example: 'Customers with good credit receive lower rates.' },
  { word: 'dividend', pos: 'n', vi: 'cổ tức', en: 'a share of profit paid to shareholders', example: 'The company paid a dividend of two cents per share.' },
  { word: 'asset', pos: 'n', vi: 'tài sản', en: 'something valuable that a person or company owns', example: 'The company’s main asset is its office building.' },
  { word: 'liability', pos: 'n', vi: 'khoản nợ phải trả', en: 'a debt or obligation that a company owes', example: 'The firm’s liability exceeds its cash reserves.' },
  { word: 'shareholder', pos: 'n', vi: 'cổ đông', en: 'a person who owns shares in a company', example: 'Shareholders will vote on the proposal in May.' },
  { word: 'portfolio', pos: 'n', vi: 'danh mục đầu tư', en: 'the collection of investments held by one person or fund', example: 'Her portfolio includes bonds and property.' },
  { word: 'mortgage', pos: 'n', vi: 'khoản vay mua nhà', en: 'a loan used to buy property, repaid over many years', example: 'The mortgage is repaid over twenty-five years.' },
  { word: 'collateral', pos: 'n', vi: 'tài sản thế chấp', en: 'property pledged as security for a loan', example: 'The loan requires collateral worth at least half its value.' },

  // Unit 15 — tiếp thị số và truyền thông
  { word: 'website', pos: 'n', vi: 'trang web', en: 'a set of web pages belonging to one organization', example: 'The new website loads faster on mobile phones.' },
  { word: 'subscribe', pos: 'v', vi: 'đăng ký nhận tin', en: 'to sign up to receive regular updates', example: 'Visitors can subscribe to the monthly newsletter.' },
  { word: 'content', pos: 'n', vi: 'nội dung', en: 'the information or material published online or in print', example: 'The content team publishes two articles a week.' },
  { word: 'platform', pos: 'n', vi: 'nền tảng', en: 'a system or service used to publish or sell products', example: 'The platform allows sellers to reach millions of buyers.' },
  { word: 'engagement', pos: 'n', vi: 'mức độ tương tác', en: 'the amount of interaction users have with content', example: 'Engagement rose after the video was posted.' },
  { word: 'influencer', pos: 'n', vi: 'người có ảnh hưởng', en: 'a person who promotes products to a large online following', example: 'The brand hired an influencer to review its new phone.' },
  { word: 'impression', pos: 'n', vi: 'lượt hiển thị', en: 'one view of an advertisement', example: 'The ad received two million impressions in a week.' },
  { word: 'feature', pos: 'n', vi: 'tính năng', en: 'a special quality or function of a product', example: 'The new feature lets users save drafts offline.' },
  { word: 'newsletter', pos: 'n', vi: 'bản tin', en: 'a regular email or publication with news for subscribers', example: 'The newsletter goes out every Thursday.' },
  { word: 'endorse', pos: 'v', vi: 'tán thành; quảng bá', en: 'to publicly support a product or person', example: 'The athlete agreed to endorse the sports drink.' },

  // Unit 16 — hợp đồng và pháp lý
  { word: 'clause', pos: 'n', vi: 'điều khoản', en: 'a single provision within a contract or law', example: 'Clause 4 explains the payment schedule.' },
  { word: 'amend', pos: 'v', vi: 'sửa đổi', en: 'to change part of a contract or law', example: 'Both parties agreed to amend the delivery date.' },
  { word: 'terminate', pos: 'v', vi: 'chấm dứt', en: 'to end an agreement before it expires', example: 'Either party may terminate the contract with thirty days’ notice.' },
  { word: 'breach', pos: 'n', vi: 'vi phạm (hợp đồng)', en: 'failure to follow the terms of a contract', example: 'The supplier was in breach of the agreement.' },
  { word: 'arbitration', pos: 'n', vi: 'trọng tài', en: 'a way of settling a dispute outside the courts', example: 'The dispute was referred to arbitration.' },
  { word: 'jurisdiction', pos: 'n', vi: 'thẩm quyền pháp lý', en: 'the authority of a court to hear and decide a case', example: 'This contract falls under the jurisdiction of Singapore courts.' },
  { word: 'waive', pos: 'v', vi: 'từ bỏ (quyền, phí)', en: 'to give up a right or a claim voluntarily', example: 'The company agreed to waive the late fee.' },
  { word: 'indemnify', pos: 'v', vi: 'bồi thường', en: 'to compensate someone for loss or damage', example: 'The seller will indemnify the buyer against claims.' },
  { word: 'obligation', pos: 'n', vi: 'nghĩa vụ', en: 'a duty required by a contract or law', example: 'Each party has an obligation to keep accurate records.' },
  { word: 'violation', pos: 'n', vi: 'hành vi vi phạm', en: 'an act that breaks a rule or law', example: 'Any violation of the policy may lead to dismissal.' },

  // Unit 17 — khách sạn và dịch vụ
  { word: 'occupancy', pos: 'n', vi: 'tỉ lệ lấp đầy', en: 'the share of rooms or seats that are in use or booked', example: 'Occupancy reached ninety percent during the holiday.' },
  { word: 'amenity', pos: 'n', vi: 'tiện nghi', en: 'a useful or pleasant feature of a building or service', example: 'The hotel offers a rooftop pool, which is its most popular amenity.' },
  { word: 'concierge', pos: 'n', vi: 'nhân viên hỗ trợ khách', en: 'a staff member who helps guests with bookings and information', example: 'The concierge booked our taxi to the airport.' },
  { word: 'lodging', pos: 'n', vi: 'chỗ ở', en: 'a place to stay for a night or longer', example: 'Lodging near the venue sells out quickly.' },
  { word: 'valet', pos: 'n', vi: 'nhân viên giữ xe', en: 'a staff member who parks guests’ cars', example: 'A valet parking service is available at the main entrance.' },
  { word: 'complimentary', pos: 'adj', vi: 'miễn phí', en: 'provided free of charge', example: 'Breakfast is complimentary for all guests.' },
  { word: 'lounge', pos: 'n', vi: 'phòng chờ', en: 'a comfortable waiting area for passengers or guests', example: 'Business class passengers may use the airport lounge.' },
  { word: 'guest', pos: 'n', vi: 'khách', en: 'a person staying at a hotel or invited to an event', example: 'Each guest receives a welcome pack on arrival.' },
  { word: 'vacant', pos: 'adj', vi: 'trống', en: 'not occupied or in use', example: 'Three rooms on the fourth floor are still vacant.' },
  { word: 'hospitality', pos: 'n', vi: 'ngành khách sạn; lòng hiếu khách', en: 'the business of providing food, drink or lodging to guests', example: 'The hospitality industry is growing again.' },

  // Unit 18 — mua sắm và báo giá
  { word: 'quotation', pos: 'n', vi: 'báo giá', en: 'a written statement of the price for goods or services', example: 'Please send a quotation for 500 chairs.' },
  { word: 'bid', pos: 'n', vi: 'hồ sơ chào giá', en: 'an offer to supply goods or services at a stated price', example: 'Our bid was lower than the other two.' },
  { word: 'tender', pos: 'n', vi: 'gói thầu; hồ sơ dự thầu', en: 'a formal written offer to supply goods or services', example: 'The city invited tenders for road repairs.' },
  { word: 'procure', pos: 'v', vi: 'mua sắm', en: 'to obtain goods or services for an organization', example: 'The department will procure new laptops in June.' },
  { word: 'bulk', pos: 'n', vi: 'số lượng lớn', en: 'a large quantity bought or sold together', example: 'Discounts apply to orders bought in bulk.' },
  { word: 'wholesale', pos: 'n', vi: 'bán sỉ', en: 'the sale of goods in large amounts to retailers', example: 'The wholesale price is much lower than the retail price.' },
  { word: 'subscription', pos: 'n', vi: 'gói đăng ký', en: 'a regular payment for a service or product', example: 'The software subscription renews every year.' },
  { word: 'rebate', pos: 'n', vi: 'tiền hoàn lại', en: 'money returned to a buyer after a purchase', example: 'Customers receive a rebate of five percent on annual orders.' },
  { word: 'surcharge', pos: 'n', vi: 'phụ phí', en: 'an extra charge added to the usual price', example: 'A fuel surcharge applies to all deliveries.' },
  { word: 'backorder', pos: 'n', vi: 'đơn hàng chờ hàng', en: 'an order for goods that are not yet in stock', example: 'Several items are on backorder until March.' },

  // Unit 19 — báo cáo và phân tích
  { word: 'forecast', pos: 'n', vi: 'dự báo', en: 'an estimate of future results based on current data', example: 'The forecast predicts strong sales in the fourth quarter.' },
  { word: 'benchmark', pos: 'n', vi: 'chuẩn so sánh', en: 'a standard used to measure performance', example: 'Our prices are compared against industry benchmarks.' },
  { word: 'metric', pos: 'n', vi: 'chỉ số đo lường', en: 'a measure used to track performance', example: 'Customer satisfaction is the key metric for the team.' },
  { word: 'indicator', pos: 'n', vi: 'chỉ báo', en: 'a sign or measure that shows how something is progressing', example: 'Rising costs are an early indicator of trouble.' },
  { word: 'variance', pos: 'n', vi: 'độ chênh lệch', en: 'the difference between a planned figure and the actual result', example: 'The variance between budget and actual spending was small.' },
  { word: 'projection', pos: 'n', vi: 'dự kiến', en: 'an estimate of a future figure', example: 'The projection shows profits doubling by 2028.' },
  { word: 'summary', pos: 'n', vi: 'bản tóm tắt', en: 'a short statement of the main points', example: 'The summary on page one covers the key findings.' },
  { word: 'trend', pos: 'n', vi: 'xu hướng', en: 'a general direction in which something is developing', example: 'The trend shows steady growth since 2020.' },
  { word: 'appendix', pos: 'n', vi: 'phụ lục', en: 'extra material added at the end of a document', example: 'Detailed tables appear in the appendix.' },
  { word: 'statistic', pos: 'n', vi: 'số liệu thống kê', en: 'a single piece of numerical data', example: 'One statistic shows that sales grew by twelve percent.' },

  // Unit 20 — chăm sóc khách hàng
  { word: 'apologize', pos: 'v', vi: 'xin lỗi', en: 'to say you are sorry for a problem', example: 'We apologize for the delay in your order.' },
  { word: 'grievance', pos: 'n', vi: 'khiếu nại', en: 'a formal complaint about unfair treatment', example: 'Employees may file a grievance with HR.' },
  { word: 'courteous', pos: 'adj', vi: 'lịch sự', en: 'polite and considerate toward others', example: 'Our staff are courteous even when customers are upset.' },
  { word: 'resolve', pos: 'v', vi: 'giải quyết', en: 'to find a solution to a problem', example: 'The agent resolved the issue within an hour.' },
  { word: 'troubleshoot', pos: 'v', vi: 'khắc phục sự cố', en: 'to find and fix the cause of a technical problem', example: 'The technician will troubleshoot the network tonight.' },
  { word: 'escalate', pos: 'v', vi: 'chuyển lên cấp trên', en: 'to pass a problem on to a more senior person', example: 'Complex complaints are escalated to the manager.' },
  { word: 'inquiry', pos: 'n', vi: 'yêu cầu thông tin', en: 'a request for information', example: 'The office received thirty inquiries this morning.' },
  { word: 'notify', pos: 'v', vi: 'thông báo', en: 'to inform someone officially', example: 'We will notify you when the parcel is delivered.' },
  { word: 'reschedule', pos: 'v', vi: 'dời lịch', en: 'to change the time of an appointment or event', example: 'Please reschedule the call for Thursday.' },
  { word: 'compensate', pos: 'v', vi: 'bồi thường', en: 'to give money to make up for a loss or inconvenience', example: 'The airline will compensate passengers for the delay.' },
];
