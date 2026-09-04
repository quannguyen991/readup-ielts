/**
 * Lọc đề Writing theo lựa chọn ở màn Luyện tập.
 *
 * Tách khỏi component vì phần khó nằm ở LUẬT KẾT HỢP chứ không ở giao diện, và
 * luật đó sai thì triệu chứng là "danh sách trống" — không có gì để nhìn mà đoán
 * ra nguyên nhân.
 */

export type WritingFilter = {
  /** 'task1' | 'task2' | 'sat' | undefined (chưa chọn thì gồm cả hai task). */
  child?: string | null | undefined;
  chartKinds: string[];
  essayKinds: string[];
  bands: string[];
};

export type FilterablePrompt = {
  task: string;
  chartKind?: string | null;
  essayKind?: string | null;
  difficultyBand: number | string;
};

export function matchesWritingFilter(p: FilterablePrompt, f: WritingFilter): boolean {
  if (f.child === 'sat') return false;
  if (f.child === 'task1' && p.task !== 'ielts_task1') return false;
  if (f.child === 'task2' && p.task !== 'ielts_task2') return false;

  if (f.bands.length > 0 && !f.bands.includes(String(p.difficultyBand))) return false;

  /*
    Dạng biểu đồ và dạng đề là hai trục THUỘC HAI TASK KHÁC NHAU, nên chọn cả
    hai bên phải hiểu là HOẶC.

    Hiểu là VÀ thì mọi đề đều rớt: đề Task 1 không có `essayKind`, đề Task 2
    không có `chartKind`, nên không đề nào thoả được cả hai. Người dùng bấm thêm
    một ô lọc rồi thấy sạch trơn màn hình sẽ nghĩ app hỏng — và họ có lý, vì
    không tổ hợp nào lẽ ra được ra kết quả rỗng.
  */
  const chartPicked = f.chartKinds.length > 0;
  const essayPicked = f.essayKinds.length > 0;
  const chartOk = f.chartKinds.includes(p.chartKind ?? '');
  const essayOk = f.essayKinds.includes(p.essayKind ?? '');

  if (chartPicked && essayPicked) return chartOk || essayOk;
  if (chartPicked) return chartOk;
  if (essayPicked) return essayOk;
  return true;
}
