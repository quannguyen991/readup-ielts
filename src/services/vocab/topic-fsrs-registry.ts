/**
 * Cầu nối nhẹ giữa store học từ và `topic-fsrs`. `topic-fsrs` kéo theo cả kho từ vựng (hàng chục MB JSON), còn store
 * được nạp ở app/_layout.tsx cho MỌI trang — nên store không nhập tĩnh `topic-fsrs`. Trang nào đã nạp `topic-fsrs`
 * thì mô-đun tự đăng ký vào đây; store gọi qua đây (chưa đăng ký thì nạp lười một lần). Không phụ thuộc gì.
 */
export type TopicFsrsApi = {
  gradeTopicWord: typeof import('./topic-fsrs').gradeTopicWord;
  backupLeitner: typeof import('./topic-fsrs').backupLeitner;
  leitnerToFsrs: typeof import('./topic-fsrs').leitnerToFsrs;
};

let impl: TopicFsrsApi | null = null;

export function registerTopicFsrs(api: TopicFsrsApi): void {
  impl = api;
}

/** Chạy `fn` với bản cài đặt đã nạp; chưa nạp thì nạp lười rồi chạy. */
export function withTopicFsrs(fn: (api: TopicFsrsApi) => void): void {
  if (impl) fn(impl);
  else void import('./topic-fsrs').then((m) => fn(impl ?? m));
}
