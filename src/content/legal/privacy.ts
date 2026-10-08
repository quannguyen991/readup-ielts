import { LEGAL_UPDATED_AT, contactVia, joinVi, type LegalContext, type LegalDoc } from './shared';

/**
 * Chính sách quyền riêng tư.
 *
 * Mỗi dòng ở mục "Dữ liệu đi đâu" ứng với một chỗ trong code thật sự gửi dữ liệu
 * ra ngoài — Supabase, Vercel, các cửa AI, dictionaryapi.dev và MyMemory ở
 * `/api/dictionary`, phụ đề YouTube ở `/api/youtube`. Thêm một nhà cung cấp mới
 * mà không thêm dòng ở đây là chính sách này nói sai.
 *
 * Phần công cụ đo lường chỉ hiện khi đã khai mã: chưa bật mà viết "chúng tôi dùng
 * Meta Pixel" cũng là nói sai, chỉ theo chiều ngược lại.
 */
export function privacyDoc(ctx: LegalContext): LegalDoc {
  const tracking = ctx.trackers.length > 0;
  const names = joinVi(ctx.trackers);

  return {
    id: 'privacy',
    title: 'Chính sách quyền riêng tư',
    lead: 'Band 9 (trước đây tên ReadUp) thu những gì, để làm gì, gửi cho ai và giữ bao lâu — kể cả những chỗ dữ liệu của bạn rời khỏi máy chủ của chúng tôi.',
    updatedAt: LEGAL_UPDATED_AT,
    sections: [
      {
        id: 'collect',
        heading: 'Dữ liệu chúng tôi thu',
        blocks: [
          {
            kind: 'list',
            items: [
              'Tài khoản: email đăng nhập, tên hiển thị và các mục tiêu bạn tự đặt (band mục tiêu, ngày thi, số phút học mỗi ngày).',
              'Dữ liệu học: tiến độ, câu trả lời, điểm, sổ từ và lịch ôn, ghi chú, đoạn tô sáng, bài viết bạn nộp chấm, tin nhắn với trợ giảng AI.',
              'Thanh toán: gói, số tiền, mã đối chiếu, thời điểm tạo và xác nhận đơn. Chúng tôi không nhận thông tin thẻ hay mật khẩu ngân hàng. Tên và số tài khoản của người chuyển chỉ hiện trong sao kê ngân hàng của chúng tôi, như với mọi giao dịch chuyển khoản.',
              'Mời bạn và mua nhóm: ai mời ai, ai thuộc nhóm mua chung nào.',
              'Tải sách: cuốn nào, lúc nào, thuộc đơn nào.',
              'Kỹ thuật: nhà cung cấp hạ tầng tự ghi nhật ký truy cập (địa chỉ IP, loại trình duyệt, thời điểm) để vận hành và chống lạm dụng.',
            ],
          },
          {
            kind: 'p',
            text: 'Chưa đăng nhập thì tiến độ học chỉ nằm trong trình duyệt của bạn. Riêng nội dung bạn gửi cho các tính năng tra từ, dịch và AI vẫn đi qua máy chủ để xử lý — xem mục “Dữ liệu đi đâu”.',
          },
        ],
      },
      {
        id: 'use',
        heading: 'Dùng để làm gì',
        blocks: [
          {
            kind: 'list',
            items: [
              'Chạy các tính năng bạn dùng: chấm bài, xếp lịch ôn, đồng bộ tiến độ giữa các máy.',
              'Bật gói, đối chiếu thanh toán, giải quyết khiếu nại và hoàn tiền.',
              'In email và mã đơn lên sách PDF bạn tải về, để mỗi bản sách truy được về đơn hàng.',
              'Đếm lượt dùng AI theo hạn mức của gói, phát hiện lượt mời gian lận và hành vi lạm dụng.',
              'Liên hệ với bạn về đơn hàng hoặc thay đổi quan trọng. Chúng tôi không gửi email quảng cáo.',
              ...(tracking ? ['Đo hiệu quả quảng cáo — chỉ khi bạn đồng ý ở thông báo cookie.'] : []),
            ],
          },
          { kind: 'p', text: 'Chúng tôi không bán dữ liệu cá nhân của bạn.' },
        ],
      },
      {
        id: 'share',
        heading: 'Dữ liệu đi đâu',
        blocks: [
          {
            kind: 'p',
            text: 'Band 9 dùng một số nhà cung cấp để vận hành. Mỗi bên chỉ nhận phần dữ liệu cần cho việc của mình:',
          },
          {
            kind: 'list',
            items: [
              'Supabase: lưu tài khoản, dữ liệu học, đơn hàng và file sách.',
              'Vercel: chạy máy chủ web của app.',
              'Nhà cung cấp mô hình AI, qua các cổng kết nối API: nhận nội dung bạn gửi cho tính năng AI — bài viết cần chấm, câu hỏi cho trợ giảng, đoạn cần dịch hay giải nghĩa. Chúng tôi không gửi kèm email hay tên của bạn.',
              'Từ điển dictionaryapi.dev và dịch vụ dịch MyMemory: nhận đúng từ hoặc đoạn bạn tra.',
              'YouTube: khi bạn chép chính tả theo video, máy chủ lấy phụ đề của video bạn chọn.',
              'Giọng đọc do trình duyệt của bạn cung cấp; một số giọng trực tuyến gửi câu cần đọc tới hãng làm trình duyệt.',
              ...(tracking
                ? [`${names}: chỉ khi bạn đồng ý — xem mục “Cookie và bộ nhớ trình duyệt”.`]
                : []),
            ],
          },
          {
            kind: 'p',
            text: 'Các nhà cung cấp này đặt máy chủ ở nước ngoài, nên dữ liệu của bạn có thể được lưu và xử lý ngoài Việt Nam.',
          },
        ],
      },
      {
        id: 'retention',
        heading: 'Giữ bao lâu',
        blocks: [
          {
            kind: 'list',
            items: [
              'Dữ liệu tài khoản và dữ liệu học: tới khi bạn xoá tài khoản.',
              'Xoá tài khoản ở trang Cài đặt là xoá ngay mọi dữ liệu gắn với tài khoản trên máy chủ, kể cả lịch sử đơn hàng và sổ tải sách. Cần giữ bằng chứng thanh toán thì hãy lưu ảnh chụp giao dịch trước khi xoá.',
              'Bản sách đã in tên bạn chỉ nằm trên máy chủ tới hết ngày hôm sau, để bạn tải lại khi rớt mạng, rồi tự xoá.',
              'Nhật ký truy cập của nhà cung cấp hạ tầng: theo thời hạn của họ, thường vài ngày tới vài tuần.',
            ],
          },
        ],
      },
      {
        id: 'cookies',
        heading: 'Cookie và bộ nhớ trình duyệt',
        blocks: [
          {
            kind: 'p',
            text: 'App lưu tiến độ và phiên đăng nhập trong bộ nhớ của trình duyệt (localStorage) để chạy được cả khi mạng chập chờn. Phần này cần cho app chạy, không dùng để quảng cáo.',
          },
          tracking
            ? {
                kind: 'p',
                text: `Nếu bạn bấm “Đồng ý” ở thông báo cookie, app tải thêm ${names} để đo quảng cáo nào đưa bạn tới Band 9 và bạn có mua gói hay không. Các công cụ này đặt cookie của riêng chúng. Bấm “Từ chối” thì chúng không được tải. Bạn đổi lựa chọn bất cứ lúc nào bằng nút “Cài đặt cookie” ở chân trang.`,
              }
            : {
                kind: 'p',
                text: 'Hiện Band 9 không dùng cookie quảng cáo hay công cụ đo lường nào của bên thứ ba.',
              },
        ],
      },
      {
        id: 'rights',
        heading: 'Quyền của bạn',
        blocks: [
          {
            kind: 'list',
            items: [
              'Xem và sửa thông tin tài khoản ở trang Cài đặt.',
              'Xoá tài khoản cùng toàn bộ dữ liệu học — tự làm được ở trang Cài đặt, không cần hỏi ai.',
              ...(tracking ? ['Rút lại đồng ý cho cookie đo lường bất cứ lúc nào.'] : []),
              `Yêu cầu bản sao dữ liệu, hỏi về cách chúng tôi xử lý dữ liệu, hoặc phản đối một cách xử lý: gửi qua ${contactVia(ctx.contact)}. Chúng tôi trả lời trong thời hạn pháp luật quy định.`,
            ],
          },
        ],
      },
      {
        id: 'security',
        heading: 'Bảo mật',
        blocks: [
          {
            kind: 'list',
            items: [
              'Mọi kết nối tới app đều được mã hoá (HTTPS).',
              'Mỗi tài khoản chỉ đọc được dữ liệu của chính mình — quy tắc này nằm ở tầng cơ sở dữ liệu, không chỉ ở giao diện.',
              'Khoá quản trị chỉ nằm trên máy chủ, không bao giờ gửi xuống trình duyệt.',
            ],
          },
          {
            kind: 'p',
            text: 'Không hệ thống nào an toàn tuyệt đối. Nếu xảy ra sự cố lộ dữ liệu ảnh hưởng tới bạn, chúng tôi sẽ báo cho bạn và cho cơ quan có thẩm quyền theo quy định.',
          },
        ],
      },
      {
        id: 'children',
        heading: 'Người dưới 16 tuổi',
        blocks: [
          {
            kind: 'p',
            text: 'Nếu bạn dưới 16 tuổi, cha mẹ hoặc người giám hộ cần đồng ý trước khi bạn tạo tài khoản, và nên là người thực hiện thanh toán.',
          },
        ],
      },
      {
        id: 'changes',
        heading: 'Thay đổi chính sách',
        blocks: [
          {
            kind: 'p',
            text: 'Khi đổi chính sách, chúng tôi cập nhật ngày ở đầu trang, và báo trong app nếu thay đổi làm dữ liệu của bạn được dùng theo cách mới.',
          },
        ],
      },
      {
        id: 'contact',
        heading: 'Liên hệ',
        blocks: [{ kind: 'p', text: `Câu hỏi về quyền riêng tư, gửi qua ${contactVia(ctx.contact)}.` }],
      },
    ],
  };
}
