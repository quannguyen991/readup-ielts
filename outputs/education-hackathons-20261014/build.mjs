import fs from 'node:fs/promises';
import { SpreadsheetFile, Workbook } from '@oai/artifact-tool';

const outputDir = 'D:/Claude/readup-ielts/outputs/education-hackathons-20261014';
const rows = [
  {
    relevance: 'Gần chủ đề', title: 'Hack the Change 2026', start: '2026-11-07', end: '2026-11-08', status: 'Đang mở', location: 'University of Calgary, Canada; public', eligibility: 'Từ 13 tuổi; đội 2–5 người; một số quốc gia/khu vực theo quy định Devpost', prize: 'Trang đầu ghi CAD $5,000; trang giới thiệu ghi CAD $10,000 chia giữa tổ chức từ thiện và người thắng', participants: 28, host: 'Code the Change YYC', focus: 'Hackathon vì cộng đồng; Education là một tag, đề bài chung sẽ công bố trong ngày sự kiện.', readup: 'Có thể dự thi nếu ý tưởng học tập phù hợp với đề bài vì cộng đồng; không phải cuộc thi EdTech chuyên biệt.', note: '07–08/11/2026. Trang còn dùng phần mô tả sự kiện năm 2025 và có hai tổng giải khác nhau; kiểm tra lại với ban tổ chức trước khi lập ngân sách.', source: 'https://hack-the-change-2026.devpost.com/'
  },
  {
    relevance: 'Gián tiếp', title: 'IceHacks 2026', start: '2026-11-08', end: '2026-11-15', status: 'Đang mở', location: 'Online, public', eligibility: 'Học sinh/sinh viên từ 13 tuổi; cá nhân hoặc đội tối đa 4; các quốc gia/khu vực đủ điều kiện theo Devpost', prize: '$17,150 tổng giải theo trang Devpost', participants: 21, host: 'CodeStarters', focus: 'Hackathon học sinh tổng quát, khuyến khích người mới tạo website, app, AI tool hoặc game; không có track EdTech cụ thể.', readup: 'Có thể làm sản phẩm học tập nếu người dự thi đủ điều kiện; không phải chủ đề bắt buộc.', note: 'Hạn nộp 15/11/2026 18:00 PT; giải công bố 17/11. Thông tin prize total lấy theo trang Devpost.', source: 'https://icehacks.devpost.com/'
  },
  {
    relevance: 'Gần chủ đề', title: 'Bridge The Gap Hacks', start: '2026-11-15', end: '2026-11-20', status: 'Đang mở', location: 'Online, public', eligibility: 'Học sinh/sinh viên 13–21 tuổi; mọi quốc gia/khu vực đủ điều kiện', prize: '$0 tiền mặt theo trang Devpost', participants: 41, host: 'Hack the Gap', focus: 'Chủ đề có Education & accessibility, cùng AI, community impact, sustainability và health.', readup: 'Phù hợp nếu ReadUp trình bày khả năng tiếp cận, hỗ trợ người học hoặc bình đẳng cơ hội học tiếng Anh.', note: '15–20/11/2026. Sự kiện có mở đăng ký nhưng không công bố giải tiền mặt.', source: 'https://sq-hacks.devpost.com/'
  },
  {
    relevance: 'Gián tiếp', title: 'HackPSU Fall 2026', start: '2026-10-24', end: '2026-10-25', status: 'Đang mở', location: 'Penn State, USA; invite only', eligibility: 'Sinh viên đại học từ 18 tuổi; phải nộp đơn, được chấp nhận và RSVP', prize: '$3,500 tiền mặt cho giải chính; các track khác có thêm giải', participants: 42, host: 'HackPSU', focus: 'Hackathon sinh viên tổng quát, có tag Education và workshops; đề bài mở hoặc track bí ẩn.', readup: 'Có thể trình bày sản phẩm học tập, nhưng chỉ tham gia được nếu đã được nhận lời mời.', note: 'Hạn nộp Devpost 25/10/2026 12:00; không phải cơ hội đăng ký mở ngay cho tất cả.', source: 'https://hackpsu-fall-2026.devpost.com/'
  },
  {
    relevance: 'Trực tiếp', title: 'CSC Back-to-School Hackathon', start: '2026-09-04', end: '2026-10-05', status: 'Đã kết thúc', location: 'Online, public', eligibility: 'Học sinh 13–18 tuổi; không dành cho doanh nghiệp', prize: '$400 tiền mặt', participants: 553, host: 'The Webb Schools CSC', focus: 'Ứng dụng, công cụ, website hoặc thiết bị giải quyết vấn đề thực tế ở trường; gồm học tập, lịch học, tổ chức, tiếp cận và công cụ lớp học.', readup: 'Rất sát: phần mềm hỗ trợ học sinh, có thể làm công cụ luyện tiếng Anh hoặc học theo nhu cầu cá nhân.', note: 'Hackathon kết thúc 05/10/2026.', source: 'https://csc-back-to-school.devpost.com/'
  },
  {
    relevance: 'Trực tiếp', title: 'HackIT 2026', start: '2026-09-14', end: '2026-10-21', status: 'Đang mở', location: 'Ngee Ann Polytechnic, Singapore; invite only', eligibility: 'Chỉ sinh viên Ngee Ann Polytechnic, từ 16 tuổi', prize: 'Giải hiện vật; Best Project theo 3 track', participants: 10, host: 'NP Overflow', focus: 'Một đề bài AWS là tích hợp tiếng mẹ đẻ vào sinh hoạt thường ngày của người trẻ; các đề bài khác về chống lừa đảo và hành trình quyên góp.', readup: 'Có thể học hỏi về thiết kế trải nghiệm học ngôn ngữ; không đủ điều kiện nếu không thuộc trường.', note: 'Hạn nộp 21/10/2026 00:00 SGT; chỉ phù hợp nếu người dự thi thuộc Ngee Ann Polytechnic.', source: 'https://hackit-2026.devpost.com/'
  },
  {
    relevance: 'Gần chủ đề', title: 'Build With AI: Basics', start: null, end: '2026-10-26', status: 'Đang mở', location: 'Online, public', eligibility: 'Từ 18 tuổi; các quốc gia/khu vực đủ điều kiện theo quy định Devpost', prize: '$2,500 tiền mặt', participants: 3424, host: 'Devpost', focus: 'Học quy trình phát triển phần mềm có AI hỗ trợ bằng cách lập kế hoạch rồi xây một proof-of-concept hoàn chỉnh.', readup: 'Cơ hội học cách biến ý tưởng thành MVP; chủ đề sản phẩm do người tham gia tự chọn, không bắt buộc là giáo dục.', note: 'Hạn nộp 26/10/2026 17:00 EDT. Lượng tham gia là số hiển thị khi tra cứu.', source: 'https://learn-ai-basics.devpost.com/'
  },
  {
    relevance: 'Trực tiếp', title: 'General Learning Hacks', start: '2026-09-19', end: '2026-09-20', status: 'Đã kết thúc', location: 'Causeway Bay, Hong Kong; invite only', eligibility: 'Người đã được ban tổ chức chấp nhận; đủ tuổi trưởng thành tại nơi cư trú; bắt buộc theo đội', prize: '$25,000 tiền mặt', participants: 118, host: 'General Learning', focus: 'Hackathon 24 giờ về công nghệ giáo dục, giúp người học nghiên cứu, học tập và chuẩn bị tương lai.', readup: 'Rất sát sản phẩm học tập; hạn chế vì sự kiện mời riêng và đã kết thúc.', note: 'Trang hiển thị ngày 20/09/2026; phần giới thiệu mô tả chương trình 19–20/09.', source: 'https://general-learning-hacks.devpost.com/'
  },
  {
    relevance: 'Trực tiếp', title: 'AceSAT Education AI-Agent: Build for Impact', start: '2026-07-12', end: '2026-08-15', status: 'Đã kết thúc', location: 'Online', eligibility: 'Từ 16 tuổi; cá nhân hoặc đội tối đa 4 người', prize: '$100 tiền mặt cho giải nhất', participants: null, host: 'AceSAT', focus: 'Tác nhân AI giáo dục phục vụ học sinh trường công còn thiếu nguồn lực; yêu cầu vượt quá chatbot hỏi đáp đơn giản.', readup: 'Tham khảo cách xác định nhóm người học cụ thể, đo tác động và thiết kế để dùng được khi mạng/thiết bị hạn chế.', note: 'Hạn nộp 15/08/2026; công bố người thắng dự kiến 01/09/2026.', source: 'https://acesat-ai-agent.devpost.com/rules'
  },
  {
    relevance: 'Trực tiếp', title: 'HackLondon 2026 — Knowunity Track', start: '2026-02-21', end: '2026-02-22', status: 'Đã kết thúc', location: 'Bush House, London; invite only', eligibility: 'Sinh viên đại học từ 18 tuổi có vé; yêu cầu lập đội', prize: 'Giải nhất: chuyến đi Berlin thăm Knowunity; giải nhì: DJI Neo; giải ba: voucher £100/người', participants: 230, host: "King's College London", focus: 'Track Knowunity yêu cầu xây bạn đồng hành học tập hằng ngày cho sinh viên đại học.', readup: 'Rất sát: tập trung vào duy trì tiến độ, UX học tập và giải quyết vấn đề thật của sinh viên.', note: 'Hackathon tổng hợp nhiều track; số người tham dự là tổng sự kiện, không riêng track giáo dục.', source: 'https://hacklondon-2026.devpost.com/'
  },
  {
    relevance: 'Trực tiếp', title: 'Studiio Hacks', start: '2025-11-01', end: '2025-11-30', status: 'Đã kết thúc', location: 'Online, public', eligibility: 'Từ 13 tuổi; mọi quốc gia/khu vực đủ điều kiện theo quy định Devpost', prize: '$2,600+ tổng giải; có giải Studying Tool và giải tiếp cận / AI có trách nhiệm', participants: 201, host: 'Studiio', focus: 'Track AI học tập, tiếp cận và hòa nhập, tiết kiệm thời gian giáo viên, tập trung, nghề nghiệp và đại học.', readup: 'Rất sát phần mềm học tập; bộ track là mẫu tốt để phân loại hướng sản phẩm.', note: 'Trang mô tả giải Studying Tool và accessibility; giải tiền mặt được chia theo nhiều hạng mục.', source: 'https://studiio-hacks.devpost.com/'
  },
  {
    relevance: 'Trực tiếp', title: 'EduHacks AI Fest 2025', start: '2025-09-29', end: '2025-10-18', status: 'Đã kết thúc', location: 'Online, public', eligibility: 'Chỉ học sinh/sinh viên; từ 13 tuổi; mọi quốc gia/khu vực đủ điều kiện theo quy định', prize: '$22,500+ tổng giải', participants: 429, host: 'EduHacks AI Fest', focus: 'AI trong giáo dục: học cá nhân hóa, tiếp cận, công cụ cộng tác, game hóa và tăng tương tác.', readup: 'Rất sát ứng dụng học tập có cá nhân hóa và phản hồi cho người học.', note: 'Trang có mâu thuẫn lịch: phần Schedule ghi 29/09–18/10/2025, phần mô tả và hạn nộp ghi 27/09–11/10/2025.', source: 'https://eduhacks-ai-fest-2025.devpost.com/'
  },
  {
    relevance: 'Trực tiếp', title: 'FutureHacks 7', start: '2025-04-18', end: '2025-04-20', status: 'Đã kết thúc', location: 'Online, public', eligibility: 'Học sinh 13–18 tuổi; mọi quốc gia/khu vực đủ điều kiện theo quy định Devpost', prize: '$1,175 tổng giải', participants: 208, host: 'AiGoLearning', focus: 'AI có đạo đức trong giáo dục: học cá nhân hóa, tiếp cận cho người khuyết tật, trách nhiệm khi dùng AI trong trường và tăng tương tác.', readup: 'Rất sát; tiêu chí AI có trách nhiệm và tiếp cận là góc có thể đưa vào sản phẩm IELTS.', note: 'Sự kiện thường niên; cuộc thi năm 2025 đã kết thúc.', source: 'https://futurehacks-7.devpost.com/'
  },
  {
    relevance: 'Trực tiếp', title: 'The Mastery Mentors Hackathon', start: '2026-06-26', end: '2026-06-28', status: 'Đã kết thúc', location: 'Online', eligibility: 'Chỉ sinh viên; cá nhân hoặc đội tối đa 4 người', prize: 'Có giải; trang chưa công bố mức / loại giải cụ thể', participants: null, host: 'The Mastery Mentors', focus: 'Dùng STEM để cải thiện học tập, giảng dạy hoặc tiếp cận giáo dục; có thể làm ứng dụng, mô phỏng, phân tích hay công cụ nghiên cứu.', readup: 'Rất sát lĩnh vực, nhưng giải thưởng và số người tham gia chưa có dữ liệu công khai rõ ràng.', note: 'Trang rules nói hạng mục và giải sẽ công bố trên trang hackathon; chưa thấy con số cụ thể.', source: 'https://themasterymentorshackathon.devpost.com/rules'
  },
  {
    relevance: 'Trực tiếp', title: 'Jumpstart EdTech', start: '2020-08-28', end: '2020-08-30', status: 'Đã kết thúc', location: 'Online, public', eligibility: 'Học sinh từ trung học cơ sở đến đại học năm cuối', prize: '$2,740 tổng giải', participants: 186, host: 'Jumpstart EdTech', focus: 'Cuộc thi startup 3 ngày cải thiện giáo dục trực tuyến bằng sản phẩm công nghệ và kiểm chứng mô hình kinh doanh.', readup: 'Tham khảo góc trình bày vấn đề, kiểm chứng nhu cầu và pitching cho một sản phẩm học tập.', note: 'Dữ liệu lịch sử; không phải cơ hội dự thi hiện tại.', source: 'https://jumpstart-edtech.devpost.com/'
  },
  {
    relevance: 'Trực tiếp', title: 'EdTech Hackathon: Mobile Apps for the Classroom', start: '2016-05-07', end: '2016-05-08', status: 'Đã kết thúc', location: 'London, Founders and Coders; public', eligibility: 'Nhà phát triển, giáo viên, chuyên gia học ngôn ngữ và phụ huynh', prize: 'Giải hiện vật / mentoring; gồm vé EdTechXEurope, Quizalize Premium và mentoring', participants: 3, host: 'UK Education Technology Startups, Zzish, Founders and Coders, Educational App Store', focus: 'Sản phẩm giao tiếp và hỗ trợ học cho trẻ nhỏ; trọng tâm literacy và gắn kết phụ huynh.', readup: 'Tham khảo mô hình phối hợp người dạy, người học và phụ huynh; sự kiện rất cũ.', note: 'Tổ chức 07–08/05/2016.', source: 'https://edtech-hackathon-3752.devpost.com/'
  },
  {
    relevance: 'Gần chủ đề', title: 'Learning Hackathon: Spec Driven Development', start: '2026-03-31', end: '2026-04-29', status: 'Đã kết thúc', location: 'Online, public', eligibility: 'Đủ tuổi trưởng thành tại nơi cư trú; mọi quốc gia/khu vực đủ điều kiện theo quy định Devpost', prize: 'Huy hiệu hoàn thành Devpost; không có giải cạnh tranh', participants: 1251, host: 'Devpost, Inc.', focus: 'Học phương pháp spec-driven bằng cách cài plugin, lập kế hoạch và xây ứng dụng; đánh giá hoàn thành thay vì xếp hạng.', readup: 'Tham khảo định dạng học qua làm, hữu ích nếu muốn xây trải nghiệm học kỹ năng cho người mới.', note: 'Không phải cuộc thi EdTech; sản phẩm tự chọn và không có judging cạnh tranh.', source: 'https://learn-ai.devpost.com/'
  },
  {
    relevance: 'Gần chủ đề', title: 'BluePrint 2026', start: '2026-04-13', end: '2026-05-14', status: 'Đã kết thúc', location: 'Online, public (India)', eligibility: 'Chỉ sinh viên / fresher tại Ấn Độ', prize: 'Trang đầu ghi ₹18,000; breakdown trong trang ghi ₹6,000 tiền mặt cộng voucher', participants: 905, host: 'BluePms Software Solutions', focus: 'Nhiều lĩnh vực; track EdTech nêu học cá nhân hóa, tiếp cận và chi phí hợp lý.', readup: 'Có track học cá nhân hóa nhưng cuộc thi thiên về giải pháp nhiều ngành và yêu cầu đầu vào qua ConnectsBlue.', note: 'Mâu thuẫn tiền thưởng trên cùng trang; hạn thực tế được nêu là 30/04 trong phần yêu cầu, dù schedule Devpost ghi đến 14/05. Link đăng ký / nộp trỏ sang ConnectsBlue.', source: 'https://blueprint-2026.devpost.com/'
  },
  {
    relevance: 'Gần chủ đề', title: 'ImpactX 2025', start: '2025-12-12', end: '2025-12-17', status: 'Đã kết thúc', location: 'Online, public', eligibility: 'Học sinh 13–18 tuổi; chỉ sinh viên; mọi quốc gia/khu vực đủ điều kiện theo quy định', prize: '4 giải không tiền mặt; bộ quà có subscription, chứng nhận và quyền lợi đối tác', participants: 149, host: 'Code4Hope', focus: 'Một trong bốn track là giáo dục; các track khác là sức khỏe, tài chính và bền vững.', readup: 'Có thể phù hợp nếu đề xuất học tập giải quyết vấn đề xã hội cụ thể.', note: 'Trang ghi sự kiện 12–17/12/2025 nhưng phần giới thiệu nhắc cuối tuần 13/12; trạng thái đã kết thúc.', source: 'https://impactx2025.devpost.com/'
  },
  {
    relevance: 'Gián tiếp', title: 'CTP Hacks 2026', start: '2026-08-27', end: '2026-08-27', status: 'Đã kết thúc', location: 'New York, USA; invite only', eligibility: 'Chỉ CUNY Tech Prep Cohort 12; sinh viên từ 18 tuổi; đội 4 người', prize: '$1,180 tiền mặt', participants: 133, host: 'CUNY Tech Prep', focus: 'Hackathon AI học tập trước tiên cho học viên đầu vào; đề bài mở, có thể xây ứng dụng AI bất kỳ.', readup: 'Tham khảo mô hình learning-first, nhưng không yêu cầu sản phẩm phục vụ giáo dục.', note: 'Sự kiện nội bộ; không mở đăng ký công khai.', source: 'https://ctp-hacks-2026.devpost.com/'
  }
];

const headers = ['Mức liên quan', 'Tên cuộc thi', 'Ngày bắt đầu', 'Ngày kết thúc / hạn', 'Trạng thái', 'Hình thức / địa điểm', 'Đối tượng dự thi', 'Giải thưởng công bố', 'Người tham gia', 'Đơn vị tổ chức', 'Chủ đề / hướng sản phẩm', 'Liên hệ với ReadUp IELTS', 'Ghi chú dữ liệu', 'Nguồn Devpost'];
const date = (s) => s ? new Date(`${s}T00:00:00.000Z`) : null;
const sortedRows = [
  ...rows.filter(r => r.status === 'Đang mở').sort((a, b) => a.end.localeCompare(b.end)),
  ...rows.filter(r => r.status !== 'Đang mở').sort((a, b) => b.start.localeCompare(a.start)),
];
const data = sortedRows.map(r => [r.relevance, r.title, date(r.start), date(r.end), r.status, r.location, r.eligibility, r.prize, r.participants, r.host, r.focus, r.readup, r.note, r.source]);

const workbook = Workbook.create();
const sheet = workbook.worksheets.add('Hackathons');
sheet.showGridLines = false;
sheet.getRange('A1').values = [['Devpost: cuộc thi giáo dục và phần mềm học tập']];
sheet.getRange('A1').format.font = { name: 'Arial', size: 15, bold: true, color: '#17365D' };
sheet.getRange('A2').values = [['Dữ liệu công khai được tra cứu ngày 14/10/2026. Ưu tiên cuộc thi giáo dục/học tập; hackathon đa chủ đề có track ngôn ngữ được đánh dấu riêng.']];
sheet.getRange('A2').format.font = { name: 'Arial', size: 10, italic: true, color: '#555555' };
sheet.getRangeByIndexes(3, 0, 1, headers.length).values = [headers];
sheet.getRangeByIndexes(4, 0, data.length, headers.length).values = data;
const table = sheet.tables.add(`A4:N${4 + data.length}`, true, 'DevpostEducationChallenges');
table.style = 'TableStyleMedium2';
sheet.getRange(`C5:D${4 + data.length}`).setNumberFormat('yyyy-mm-dd');
sheet.getRange(`I5:I${4 + data.length}`).setNumberFormat('#,##0');
sheet.getRange(`A4:N${4 + data.length}`).format.verticalAlignment = 'center';
sheet.getRange(`F5:N${4 + data.length}`).format.wrapText = true;
sheet.getRange(`A5:N${4 + data.length}`).format.font = { name: 'Arial', size: 10, color: '#1F2937' };
sheet.getRange('A1:N2').format.wrapText = false;
sheet.getRange('A1:A24').format.columnWidth = 16;
sheet.getRange('B1:B24').format.columnWidth = 36;
sheet.getRange('C1:D24').format.columnWidth = 18;
sheet.getRange('E1:E24').format.columnWidth = 15;
sheet.getRange('F1:F24').format.columnWidth = 31;
sheet.getRange('G1:G24').format.columnWidth = 36;
sheet.getRange('H1:H24').format.columnWidth = 32;
sheet.getRange('I1:I24').format.columnWidth = 14;
sheet.getRange('J1:J24').format.columnWidth = 36;
sheet.getRange('K1:L24').format.columnWidth = 52;
sheet.getRange('M1:M24').format.columnWidth = 64;
sheet.getRange('N1:N24').format.columnWidth = 56;
sheet.getRange(`A5:N${4 + data.length}`).format.rowHeight = 64;
sheet.getRange(`D4:D${4 + data.length}`).format.borders = { right: { style: 'thin', color: '#D9E2F3' } };
sheet.getRange('A1').format.rowHeight = 26;
sheet.getRange('A2').format.rowHeight = 22;
sheet.freezePanes.freezeRows(4);
workbook.recalculate();

const inspection = await workbook.inspect({ kind: 'table,sheet', maxChars: 6000, tableMaxRows: 4, tableMaxCols: 14 });
console.log(inspection.ndjson);
const sample = await workbook.inspect({ kind: 'region', sheetId: 'Hackathons', range: 'A4:N10', maxChars: 5000 });
console.log(sample.ndjson);
const preview = await workbook.render({ sheetName: 'Hackathons', range: 'A1:H9', scale: 1, format: 'png' });
await fs.writeFile(`${outputDir}/preview.png`, new Uint8Array(await preview.arrayBuffer()));
const xlsx = await SpreadsheetFile.exportXlsx(workbook);
await xlsx.save(`${outputDir}/devpost_education_hackathons.xlsx`);

const csvQuote = (v) => {
  if (v === null || v === undefined) return '';
  const s = v instanceof Date ? v.toISOString().slice(0, 10) : String(v);
  return /[",\r\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
};
const csv = [headers, ...sortedRows.map(r => [r.relevance, r.title, r.start, r.end, r.status, r.location, r.eligibility, r.prize, r.participants, r.host, r.focus, r.readup, r.note, r.source])]
  .map(row => row.map(csvQuote).join(',')).join('\r\n');
await fs.writeFile(`${outputDir}/devpost_education_hackathons.csv`, '\uFEFF' + csv, 'utf8');
