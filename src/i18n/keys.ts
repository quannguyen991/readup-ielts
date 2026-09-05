/**
 * Từ điển hai ngôn ngữ cho ReadUp.
 *
 * VÌ SAO TỰ VIẾT, KHÔNG THÊM THƯ VIỆN. Repo này có kỷ luật không thêm dependency
 * khi tự làm được, và phần i18n thật sự cần ở đây rất nhỏ: tra khoá, thay tham
 * số, đổi ngôn ngữ lúc chạy. Một thư viện đầy đủ mang theo số nhiều, giống, định
 * dạng ngày theo vùng — app này chưa dùng tới cái nào.
 *
 * VÌ SAO CÓ TIẾNG ANH. App phục vụ người học Việt Nam nên tiếng Việt là ngôn ngữ
 * gốc, và bản dịch tiếng Anh KHÔNG phải để đổi đối tượng người dùng. Nó để người
 * ngoài đọc được cơ chế: giám khảo, giáo viên nước ngoài, người muốn kiểm chứng
 * cách app kết luận "đã hiểu". Một hệ thống tự nhận là minh bạch mà chỉ nói được
 * một thứ tiếng thì chỉ minh bạch với một nhóm người.
 *
 * PHẠM VI CÓ CHỦ Ý. Từ điển này phủ những mặt QUYẾT ĐỊNH: điều hướng, sổ bằng
 * chứng, lời giải thích của bộ phân loại, và biên nhận kiểm chứng AI. Nội dung
 * học liệu (bài đọc, câu hỏi, lời giải) KHÔNG dịch — chúng là tiếng Anh sẵn hoặc
 * là lời giảng tiếng Việt do người soạn, và dịch máy chúng sẽ làm hỏng đúng phần
 * có giá trị nhất.
 */

export type Locale = 'vi' | 'en';

/**
 * Mọi khoá của từ điển.
 *
 * Khai báo tường minh chứ không suy từ một trong hai bản dịch: suy từ bản tiếng
 * Việt thì thêm khoá vào đó mà quên dịch sẽ không ai biết, còn ở đây trình biên
 * dịch bắt ngay cả hai bản phải đủ.
 */
export type MessageKey =
  // ---------------------------------------------------------------- chung
  | 'app.tagline'
  | 'common.back'
  | 'common.next'
  | 'common.retry'
  | 'common.showAnswer'
  | 'common.language'
  // ------------------------------------------------------------ điều hướng
  | 'nav.explore'
  | 'nav.progress'
  | 'nav.mastery'
  | 'nav.vocabulary'
  | 'nav.settings'
  // ------------------------------------------------------- sổ bằng chứng
  | 'mastery.eyebrow'
  | 'mastery.title'
  | 'mastery.intro'
  | 'mastery.whyStrictTitle'
  | 'mastery.whyStrictBody'
  | 'mastery.emptyTitle'
  | 'mastery.emptyBody'
  | 'mastery.whyThink'
  | 'mastery.nextStep'
  | 'mastery.observations'
  | 'mastery.transfers'
  // trạng thái
  | 'status.confirmed'
  | 'status.probing'
  | 'status.needsProbe'
  | 'status.unobserved'
  // bốn trạng thái quan sát được
  | 'state.unobserved'
  | 'state.alignedCorrect'
  | 'state.misalignedCorrect'
  | 'state.alignedWrong'
  | 'state.misalignedWrong'
  // phép thử
  | 'probe.transfer'
  | 'probe.evidenceReselect'
  | 'probe.entailment'
  | 'probe.locate'
  // các dòng cố định của lời giải thích
  | 'explain.domain'
  | 'explain.observed'
  | 'explain.probeChosen'
  | 'explain.condition'
  | 'explain.conditionBody'
  | 'explain.transfersDone'
  | 'explain.nextConfirmed'
  | 'explain.nextNoMark'
  | 'explain.nextTransfer'
  | 'explain.nextNarrow'
  // -------------------------------------------------- biên nhận kiểm chứng
  | 'verify.title'
  | 'verify.summary'
  | 'verify.summaryClean'
  | 'verify.howToCheckTitle'
  | 'verify.howToCheckBody'
  | 'verify.modelNote'
  | 'method.quoteMatch'
  | 'method.computed'
  | 'method.crossCheck'
  | 'method.unverifiable'
  // ----------------------------------------------------------- tự chẩn đoán
  | 'diagnose.title'
  | 'diagnose.hint'
  | 'diagnose.rightTag'
  | 'diagnose.wrongTag';

export type Dictionary = Readonly<Record<MessageKey, string>>;
