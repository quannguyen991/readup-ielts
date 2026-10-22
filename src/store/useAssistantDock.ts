import { create } from 'zustand';

/**
 * Trạng thái khung trợ lý AI, dùng chung giữa vỏ app (để chừa chỗ cho cột bên phải)
 * và chính khung chat:
 * - `full`: cột cố định bên phải (màn rộng từ 1280px; màn nhỏ hơn tự hiện như `pop`).
 * - `pop`:  khung nổi góc dưới bên phải.
 * - `min`:  chỉ còn viên thuốc "Hỏi AI".
 *
 * Không lưu xuống máy: mỗi lần mở app thì về `min`, chỉ hiện viên "Hỏi AI" cho đến khi người dùng bấm mở.
 */
export type AssistantDockMode = 'full' | 'pop' | 'min';

type AssistantDockState = {
  mode: AssistantDockMode;
  setMode: (mode: AssistantDockMode) => void;
};

export const useAssistantDock = create<AssistantDockState>()((set) => ({
  mode: 'min',
  setMode: (mode) => set({ mode }),
}));
