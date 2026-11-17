import { useEffect } from 'react';
import { Platform } from 'react-native';

/**
 * Phông riêng của phòng thi và báo cáo chấm điểm: Nunito (có đủ dấu tiếng Việt), không dùng phông chung của app.
 * Chỉ web: nạp phông từ Google Fonts một lần và ép mọi chữ trong vùng `#ielts-exam` dùng nó; chữ có chân của bài đọc
 * đặt bằng style nội tuyến nên vẫn thắng.
 */
export const EXAM_ROOT_ID = 'ielts-exam';
const STYLE_ID = 'ielts-exam-font';

export function useExamFont(): void {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined' || document.getElementById(STYLE_ID)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&display=swap&subset=vietnamese';
    document.head.appendChild(link);
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `#${EXAM_ROOT_ID}, #${EXAM_ROOT_ID} *, #ielts-exam-modal, #ielts-exam-modal * { font-family: 'Nunito', 'Segoe UI', Arial, sans-serif; }`;
    document.head.appendChild(style);
  }, []);
}
