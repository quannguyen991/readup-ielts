/**
 * NỀN HỌC đổi bằng sao — nền phía sau mọi màn học (đọc bài, làm bài, tra từ,
 * luyện nghe...). Thay cho nền lưới sáng mặc định của `LightGrid`.
 *
 * Mọi mẫu đều SÁNG và nhạt: thẻ nội dung vẫn là giấy trắng, nền chỉ đủ màu để
 * tách thẻ ra khỏi trang (lý do chọn nền sáng cho màn làm việc ghi ở
 * `LightGrid.tsx`). Không có mẫu nền tối cho màn học — một thẻ trắng giữa nền
 * đen là bắt mắt điều tiết suốt buổi.
 *
 * Chỉ là dữ liệu vẽ; giá và tên ở `services/gamification/shop.ts`.
 */
export type StudyBgLook =
  | 'mint'
  | 'peach'
  | 'lemon'
  | 'lavender'
  | 'sky'
  | 'kraft'
  | 'notebook'
  | 'sage'
  | 'sand'
  | 'rose'
  | 'aqua'
  | 'dusk';

/** Hoạ tiết phủ lên nền. */
export type StudyPattern = 'grid' | 'dots' | 'ruled' | 'diagonal' | 'plain';

export type StudyBackground = {
  /** Ba điểm màu của nền chuyển màu chéo (sáng). */
  stops: readonly [string, string, string];
  /** Màu nét hoạ tiết (rất mờ). */
  line: string;
  pattern: StudyPattern;
  /** Hai vệt loang mềm ở góc trên trái / dưới phải. */
  blobs: readonly [string, string];
  /** Vở học trò: đường lề đỏ bên trái. */
  margin?: string;
  cell?: number;
};

export const STUDY_BACKGROUNDS: Record<StudyBgLook, StudyBackground> = {
  mint: { stops: ['#E6F7EF', '#DDF3E8', '#E9F6F0'], line: 'rgba(20,110,80,0.11)', pattern: 'grid', blobs: ['#6EE7B7', '#A7F3D0'] },
  peach: { stops: ['#FFF1EA', '#FDE8DF', '#FCEBF1'], line: 'rgba(190,90,60,0.10)', pattern: 'grid', blobs: ['#FDBA74', '#F9A8D4'] },
  lemon: { stops: ['#FFFAE3', '#FDF4D2', '#FFF7E6'], line: 'rgba(160,120,20,0.18)', pattern: 'dots', blobs: ['#FDE047', '#FDBA74'], cell: 22 },
  lavender: { stops: ['#F2EDFD', '#ECE6FB', '#F5EFFC'], line: 'rgba(110,80,190,0.18)', pattern: 'dots', blobs: ['#C4B5FD', '#F0ABFC'], cell: 22 },
  sky: { stops: ['#E9F4FD', '#E1EFFB', '#EBF2FD'], line: 'rgba(40,110,190,0.13)', pattern: 'ruled', blobs: ['#7DD3FC', '#A5B4FC'], cell: 30 },
  kraft: { stops: ['#F5EDDF', '#EFE5D2', '#F3EADB'], line: 'rgba(120,90,40,0.16)', pattern: 'dots', blobs: ['#E7C9A0', '#D6B98C'], cell: 18 },
  notebook: { stops: ['#FDFDF8', '#FAFAF2', '#FCFCF6'], line: 'rgba(59,130,246,0.20)', pattern: 'ruled', blobs: ['#DBEAFE', '#FEF3C7'], margin: 'rgba(239,68,68,0.35)', cell: 28 },
  sage: { stops: ['#EEF4EA', '#E7EFE2', '#EEF3EC'], line: 'rgba(70,110,60,0.10)', pattern: 'diagonal', blobs: ['#BBF7D0', '#D9F99D'], cell: 26 },
  sand: { stops: ['#FBF4E8', '#F7EEDF', '#F9F2E7'], line: 'rgba(150,110,50,0.10)', pattern: 'plain', blobs: ['#FDE68A', '#FECACA'] },
  rose: { stops: ['#FCEFF4', '#F9E7EF', '#FBF0F6'], line: 'rgba(190,60,110,0.10)', pattern: 'grid', blobs: ['#F9A8D4', '#FDA4AF'] },
  aqua: { stops: ['#E7F8F9', '#DDF3F5', '#E8F5F9'], line: 'rgba(20,130,150,0.11)', pattern: 'diagonal', blobs: ['#67E8F9', '#93C5FD'], cell: 26 },
  dusk: { stops: ['#F4ECF9', '#F1E6F4', '#FCEDE8'], line: 'rgba(130,70,150,0.10)', pattern: 'grid', blobs: ['#D8B4FE', '#FDBA74'] },
};

export function studyBackground(look: string | null | undefined): StudyBackground | null {
  return look && look in STUDY_BACKGROUNDS ? STUDY_BACKGROUNDS[look as StudyBgLook] : null;
}
