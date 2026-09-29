import { CITY_VI } from './city';
import type { Dictionary } from './keys';

/** Bản gốc. Mọi câu ở đây được viết trước, bản tiếng Anh dịch theo. */
export const vi: Dictionary = {
  'app.tagline': 'Luyện thi bằng đề thật, sai chỗ nào biết chỗ đó',
  'common.back': 'Quay lại',
  'common.next': 'Tiếp theo',
  'common.retry': 'Thử lại',
  'common.showAnswer': 'Xem đáp án',
  'common.language': 'Ngôn ngữ',

  'nav.explore': 'Khám phá',
  'nav.progress': 'Tiến độ',
  'nav.mastery': 'Sổ bằng chứng',
  'nav.vocabulary': 'Sổ từ',
  'nav.settings': 'Cài đặt',

  'mastery.eyebrow': 'Evidence ledger',
  'mastery.title': 'Sổ bằng chứng',
  'mastery.intro':
    'App không chấm bạn bằng phần trăm. Nó ghi lại từng lượt quan sát được — bạn trả lời đúng hay sai, và bạn dựa vào chỗ nào — rồi chỉ công nhận một kỹ năng khi bạn làm được nó trên một bài khác.',
  'mastery.whyStrictTitle': 'Vì sao lại khắt khe như vậy',
  'mastery.whyStrictBody':
    'Làm đúng một câu có thể là đã hiểu, mà cũng có thể là nhớ đáp án hoặc đoán trúng. Chỉ khi gặp một bài chưa từng thấy mà vẫn làm được thì mới tách được hai khả năng đó ra. Vì thế công nhận ở đây không phải huy chương: gặp lại kỹ năng ấy mà trượt thì nó bị gỡ.',
  'mastery.emptyTitle': 'Sổ còn trống',
  'mastery.emptyBody':
    'Làm một bài đọc hoặc một đề toán, và nhớ đánh dấu chỗ bạn dựa vào để trả lời. Không có dấu đó thì app chỉ biết bạn đúng hay sai, chứ không đối chiếu được gì — và nó sẽ ghi là “chưa quan sát được” chứ không đoán thay bạn.',
  'mastery.whyThink': 'Vì sao app nghĩ như vậy',
  'mastery.nextStep': 'Bước tiếp theo',
  'mastery.observations': '{n} lượt quan sát',
  'mastery.transfers': '{n} lần làm được trên bài khác',

  'status.confirmed': 'Đã làm được trên bài khác',
  'status.probing': 'Chưa đủ căn cứ',
  'status.needsProbe': 'Có chỗ cần làm rõ',
  'status.unobserved': 'Chưa quan sát được',

  'state.unobserved':
    'Bạn chưa đánh dấu chỗ mình dựa vào, nên chưa có gì để đối chiếu. Chưa đo được khác với đo rồi thấy sai — app không suy đoán vào chỗ trống này.',
  'state.alignedCorrect': 'Bạn trả lời đúng, và chỗ bạn đánh dấu đúng là chỗ đỡ đáp án.',
  'state.misalignedCorrect':
    'Bạn trả lời đúng, nhưng chỗ bạn đánh dấu không phải chỗ đỡ đáp án. Đúng đáp án mà dựa vào chỗ khác thì chưa kết luận được gì.',
  'state.alignedWrong':
    'Bạn tìm đúng chỗ nhưng trả lời sai. Vậy chỗ vướng nằm ở bước suy ra, không nằm ở bước đi tìm.',
  'state.misalignedWrong': 'Bạn trả lời sai và chỗ đánh dấu cũng không phải chỗ đỡ đáp án.',

  'probe.transfer':
    'Một câu tương tự trên MỘT BÀI KHÁC. Đây là phép thử duy nhất tạo ra công nhận, vì nó là phép thử duy nhất tách được “đã hiểu” khỏi “nhớ đáp án bài này”.',
  'probe.evidenceReselect':
    'Cho bạn đánh dấu lại, và cố ý KHÔNG giải thích trước — giải thích trước là mớm đáp án, và sau đó thì không đo được gì nữa.',
  'probe.entailment':
    'Bỏ hẳn bước đi tìm, chỉ hỏi bài có đỡ mệnh đề này không. Cô lập đúng bước suy ra.',
  'probe.locate': 'Bỏ hẳn bước suy luận, chỉ hỏi chỗ nào trong bài. Cô lập đúng bước định vị.',

  'explain.domain': 'Mảng kỹ năng',
  'explain.observed': 'App đã quan sát {n} lượt',
  'explain.probeChosen': 'Phép thử được chọn',
  'explain.condition': 'Điều kiện để được công nhận',
  'explain.conditionBody':
    'Làm được một câu cùng kỹ năng trên MỘT BÀI KHÁC. Làm đúng nhiều lần trên cùng một bài không tính, và công nhận sẽ bị gỡ lại nếu sau đó bạn trượt.',
  'explain.transfersDone': 'Đã đạt chuyển giao',
  'explain.nextConfirmed':
    'Không cần làm gì thêm lúc này. App vẫn theo dõi: gặp lại kỹ năng này mà trượt thì công nhận sẽ được gỡ.',
  'explain.nextNoMark':
    'Lần tới khi làm bài thuộc kỹ năng này, hãy đánh dấu chỗ bạn dựa vào — không có dấu đó thì app không đối chiếu được gì.',
  'explain.nextTransfer':
    'App sẽ đưa một câu cùng kỹ năng trên một bài khác. Qua được thì kỹ năng này được công nhận.',
  'explain.nextNarrow':
    'App sẽ đưa một phép thử hẹp hơn để khoanh đúng chỗ vướng, rồi mới tới bước chuyển giao.',

  'verify.title': 'AI nói gì, app kiểm được đến đâu',
  'verify.summary': '{checked} khẳng định đã đối chiếu · {rejected} bị loại vì không đúng',
  'verify.summaryClean': '{checked} khẳng định đã đối chiếu · không cái nào bị loại',
  'verify.howToCheckTitle': 'Tự kiểm thế nào',
  'verify.howToCheckBody':
    'Với mọi nhận xét AI đưa ra, hỏi một câu: “dựa vào đâu trong bài của tôi?”. Nhận xét chỉ ra được đúng một đoạn chữ thì kiểm được; nhận xét nói chung chung thì không — và cái không kiểm được là cái cần đọc bằng con mắt nghi ngờ.',
  'verify.modelNote':
    'Bài này do model {model} chấm. App không giấu tên model: biết ai nói thì mới truy được khi có gì đó sai.',
  'method.quoteMatch': 'Đối chiếu nguyên văn',
  'method.computed': 'Tính bằng code',
  'method.crossCheck': 'So với dữ liệu đề',
  'method.unverifiable': 'Máy không kiểm được',

  'diagnose.title': 'Bạn nghĩ mình sai ở đâu?',
  'diagnose.hint':
    'Đoán trước rồi mới xem lời giải. Đoán sai không bị trừ gì — app chỉ cần biết bạn đã nhìn thấy chỗ hỏng hay chưa.',
  'diagnose.rightTag':
    'Bạn gọi đúng tên lỗi của mình. Chỗ vướng là ở thao tác, không phải ở chỗ nhận ra vấn đề — luyện thêm vài câu cùng dạng là được.',
  'diagnose.wrongTag':
    'Lỗi thật nằm ở dòng được tô xanh. Gọi sai tên lỗi nghĩa là chưa nhìn thấy chỗ hỏng, nên đọc lời giải xong vẫn dễ lặp lại — app sẽ đưa thêm một câu cùng dạng để kiểm.',

  ...CITY_VI,
};
