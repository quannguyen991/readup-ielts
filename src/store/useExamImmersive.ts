import { create } from 'zustand';

/** Phòng thi IELTS đang mở: khung app ẩn thanh bên để người học tập trung; nút Home trong phòng thi là đường ra. */
export const useExamImmersive = create<{ on: boolean; set: (v: boolean) => void }>((set) => ({ on: false, set: (v) => set({ on: v }) }));
