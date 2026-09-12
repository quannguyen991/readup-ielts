/**
 * Lộ trình 60 tuần — DỮ LIỆU SINH RA, ĐỪNG SỬA TAY.
 *
 * Nguồn: `D:\Claude\tong-hop-sach\gen_lotrinh.py`, sinh lại ngày 12/09/2026.
 * Sửa lộ trình thì sửa ở file ấy rồi sinh lại, để trang web lộ trình và app
 * không bao giờ nói hai chuyện khác nhau.
 *
 * Tuần 1 bắt đầu thứ Hai 07/09/2026; thi SAT 06/11/2027.
 */

export type PlanBlock = { label: string; detail: string } | null;
export type PlanMilestoneKind = 'start' | 'note' | 'gate' | 'exam';
export type PlanMilestone = { kind: PlanMilestoneKind; label: string };

export type PlanWeek = {
  week: number;
  /** Slot sáng 90 phút — môn nặng nhất của chặng. */
  morning: PlanBlock;
  /** Tối A, cách ngày — SAT Math. */
  eveningA: PlanBlock;
  /** Tối B, cách ngày — kỹ năng viết hoặc nghe. */
  eveningB: PlanBlock;
  /** Khối từ vựng 08:50 mọi ngày. */
  vocab: string;
  milestone: PlanMilestone | null;
};

export type PlanStage = {
  id: string;
  name: string;
  fromWeek: number;
  toWeek: number;
  summary: string;
  slots: { when: string; what: string }[];
  books: string;
};

export type PlanCheckpoint = {
  no: number;
  week: number;
  targets: { skill: string; target: string; note: string }[];
  ifMissed: string;
};

export type PlanBook = {
  title: string;
  pages: string;
  when: string;
  exam: string;
  fromWeek: number;
  toWeek: number;
};

export const PLAN_WEEKS: PlanWeek[] = [
  {
    "week": 1,
    "morning": {
      "label": "Reading",
      "detail": "ch 1–5 · luật chơi, ba tốc độ đọc"
    },
    "eveningA": {
      "label": "Math",
      "detail": "ch 1–6 · nền toán"
    },
    "eveningB": {
      "label": "Listening",
      "detail": "ch 1–5 · luật viết đáp án, đánh vần"
    },
    "vocab": "Unit 1",
    "milestone": {
      "kind": "start",
      "label": "Bắt đầu"
    }
  },
  {
    "week": 2,
    "morning": {
      "label": "Reading",
      "detail": "ch 1–5 · luật chơi, ba tốc độ đọc"
    },
    "eveningA": {
      "label": "Math",
      "detail": "ch 1–6 · nền toán"
    },
    "eveningB": {
      "label": "Listening",
      "detail": "ch 1–5 · luật viết đáp án, đánh vần"
    },
    "vocab": "Unit 2",
    "milestone": null
  },
  {
    "week": 3,
    "morning": {
      "label": "Reading",
      "detail": "ch 6–9 · từ khoá, paraphrase, ngữ pháp để đọc"
    },
    "eveningA": {
      "label": "Math",
      "detail": "ch 1–6 · nền toán"
    },
    "eveningB": {
      "label": "Listening",
      "detail": "ch 6–7 · số và ngày giờ, 300 từ hay sai chính tả"
    },
    "vocab": "Unit 3",
    "milestone": null
  },
  {
    "week": 4,
    "morning": {
      "label": "Reading",
      "detail": "ch 6–9 · từ khoá, paraphrase, ngữ pháp để đọc"
    },
    "eveningA": {
      "label": "Math",
      "detail": "ch 7–10 · luật chơi, Desmos, test chẩn đoán 22 câu"
    },
    "eveningB": {
      "label": "Listening",
      "detail": "ch 6–7 · số và ngày giờ, 300 từ hay sai chính tả"
    },
    "vocab": "Unit 4",
    "milestone": null
  },
  {
    "week": 5,
    "morning": {
      "label": "Reading",
      "detail": "ch 10–12 · True/False/Not Given, Yes/No/Not Given · + Hacker Basic: cùng dạng"
    },
    "eveningA": {
      "label": "Math",
      "detail": "ch 11–14 · từ vựng toán tiếng Anh"
    },
    "eveningB": {
      "label": "Listening",
      "detail": "ch 8–10 · từ vựng Part 1 và Part 2"
    },
    "vocab": "Unit 5",
    "milestone": null
  },
  {
    "week": 6,
    "morning": {
      "label": "Reading",
      "detail": "ch 10–12 · True/False/Not Given, Yes/No/Not Given · + Hacker Basic: cùng dạng"
    },
    "eveningA": {
      "label": "Math",
      "detail": "ch 11–14 · từ vựng toán tiếng Anh"
    },
    "eveningB": {
      "label": "Listening",
      "detail": "ch 8–10 · từ vựng Part 1 và Part 2"
    },
    "vocab": "Unit 6",
    "milestone": null
  },
  {
    "week": 7,
    "morning": {
      "label": "Reading",
      "detail": "ch 13–15 · ba dạng Matching · + Hacker Basic: cùng dạng"
    },
    "eveningA": {
      "label": "Math",
      "detail": "ch 15–20 · Algebra · 30 Unit: U1–2"
    },
    "eveningB": {
      "label": "Listening",
      "detail": "ch 11–13 · Part 3, Part 4, 200 collocation"
    },
    "vocab": "Unit 7",
    "milestone": {
      "kind": "note",
      "label": "Mở cuốn 30 Unit"
    }
  },
  {
    "week": 8,
    "morning": {
      "label": "Reading",
      "detail": "ch 13–15 · ba dạng Matching · + Hacker Basic: cùng dạng"
    },
    "eveningA": {
      "label": "Math",
      "detail": "ch 15–20 · Algebra · 30 Unit: U3–4"
    },
    "eveningB": {
      "label": "Listening",
      "detail": "ch 11–13 · Part 3, Part 4, 200 collocation"
    },
    "vocab": "Unit 8",
    "milestone": null
  },
  {
    "week": 9,
    "morning": {
      "label": "Reading",
      "detail": "ch 16–18 · Sentence Endings, Multiple Choice, Sentence Completion · + Hacker Basic: cùng dạng"
    },
    "eveningA": {
      "label": "Math",
      "detail": "ch 15–20 · Algebra · 30 Unit: U5–6"
    },
    "eveningB": {
      "label": "Listening",
      "detail": "ch 14–16 · mẫu câu điều hướng, tự sửa, phủ định"
    },
    "vocab": "Unit 9",
    "milestone": null
  },
  {
    "week": 10,
    "morning": {
      "label": "Reading",
      "detail": "ch 16–18 · Sentence Endings, Multiple Choice, Sentence Completion · + Hacker Basic: cùng dạng"
    },
    "eveningA": {
      "label": "Math",
      "detail": "ch 15–20 · Algebra · 30 Unit: U7–8"
    },
    "eveningB": {
      "label": "Listening",
      "detail": "ch 14–16 · mẫu câu điều hướng, tự sửa, phủ định"
    },
    "vocab": "Unit 10",
    "milestone": null
  },
  {
    "week": 11,
    "morning": {
      "label": "Reading",
      "detail": "ch 19–21 · Summary, Note/Table/Diagram, Short Answer · + Hacker Basic: cùng dạng"
    },
    "eveningA": {
      "label": "Math",
      "detail": "ch 21–27 · Advanced Math · 30 Unit: U9–10"
    },
    "eveningB": {
      "label": "Listening",
      "detail": "ch 17–19 · từ chỉ lượng, 300 cặp paraphrase"
    },
    "vocab": "Unit 11",
    "milestone": null
  },
  {
    "week": 12,
    "morning": {
      "label": "Reading",
      "detail": "ch 22–24 · 150 từ học thuật lõi, họ từ"
    },
    "eveningA": {
      "label": "Math",
      "detail": "ch 21–27 · Advanced Math · 30 Unit: U11–12 · + 1 đề Kaplan để đo"
    },
    "eveningB": {
      "label": "Listening",
      "detail": "ch 20–24 · sáu nhóm dạng câu hỏi"
    },
    "vocab": "Unit 12",
    "milestone": {
      "kind": "gate",
      "label": "Cửa 1"
    }
  },
  {
    "week": 13,
    "morning": {
      "label": "Reading",
      "detail": "ch 25–30 · sáu chủ đề từ vựng đầu"
    },
    "eveningA": {
      "label": "Math",
      "detail": "ch 21–27 · Advanced Math · 30 Unit: U13–14"
    },
    "eveningB": {
      "label": "Task 1",
      "detail": "ch 1–7 · bốn tiêu chí, phân tích đề, overview"
    },
    "vocab": "Unit 13",
    "milestone": {
      "kind": "note",
      "label": "Task 1 vào lịch"
    }
  },
  {
    "week": 14,
    "morning": {
      "label": "Reading",
      "detail": "ch 31–38 · sáu chủ đề còn lại, 240 cặp paraphrase"
    },
    "eveningA": {
      "label": "Math",
      "detail": "ch 21–27 · Advanced Math · 30 Unit: U15–16"
    },
    "eveningB": {
      "label": "Task 1",
      "detail": "ch 1–7 · bốn tiêu chí, phân tích đề, overview"
    },
    "vocab": "Unit 14",
    "milestone": null
  },
  {
    "week": 15,
    "morning": {
      "label": "Reading",
      "detail": "ch 39 · 5 đề luyện có giải chi tiết"
    },
    "eveningA": {
      "label": "Math",
      "detail": "ch 21–27 · Advanced Math · 30 Unit: U17–18"
    },
    "eveningB": {
      "label": "Task 1",
      "detail": "ch 8–10 · grouping, ngôn ngữ số liệu, ngữ pháp lõi"
    },
    "vocab": "Unit 15",
    "milestone": null
  },
  {
    "week": 16,
    "morning": {
      "label": "Reading",
      "detail": "ch 41–46 · từ 7.0 lên 7.5+"
    },
    "eveningA": {
      "label": "Math",
      "detail": "ch 28–32 · Problem-Solving & Data · 30 Unit: U19–20"
    },
    "eveningB": {
      "label": "Task 1",
      "detail": "ch 11–14 · line, bar, pie, table"
    },
    "vocab": "Unit 16",
    "milestone": {
      "kind": "note",
      "label": "Xong Reading"
    }
  },
  {
    "week": 17,
    "morning": {
      "label": "Đề Listening",
      "detail": "ch 26 · 4 bộ + ch 29–32 · từ 7.0 lên 7.5+"
    },
    "eveningA": {
      "label": "Math",
      "detail": "ch 28–32 · Problem-Solving & Data · 30 Unit: U21–22"
    },
    "eveningB": {
      "label": "Task 1",
      "detail": "ch 11–14 · line, bar, pie, table"
    },
    "vocab": "Unit 17",
    "milestone": null
  },
  {
    "week": 18,
    "morning": {
      "label": "Đề Listening",
      "detail": "ch 26 · 4 bộ + ch 29–32 · từ 7.0 lên 7.5+"
    },
    "eveningA": {
      "label": "Math",
      "detail": "ch 28–32 · Problem-Solving & Data · 30 Unit: U23–24"
    },
    "eveningB": {
      "label": "Task 1",
      "detail": "ch 15–17 · mixed, process, map"
    },
    "vocab": "Unit 18",
    "milestone": null
  },
  {
    "week": 19,
    "morning": {
      "label": "Đề trộn R + L",
      "detail": "4 bộ Listening còn lại, làm lại 5 đề Reading có tính giờ"
    },
    "eveningA": {
      "label": "Math",
      "detail": "ch 28–32 · Problem-Solving & Data · 30 Unit: U25–26"
    },
    "eveningB": {
      "label": "Task 1",
      "detail": "ch 18–20, 22 · nâng cấp 7.0+, 68 bài tập kỹ năng"
    },
    "vocab": "Unit 19",
    "milestone": null
  },
  {
    "week": 20,
    "morning": {
      "label": "Đề trộn R + L",
      "detail": "4 bộ Listening còn lại, làm lại 5 đề Reading có tính giờ"
    },
    "eveningA": {
      "label": "Math",
      "detail": "ch 33–35 · góc, tam giác, lượng giác · 30 Unit: U27–28 · + 1 đề Kaplan để đo"
    },
    "eveningB": {
      "label": "Task 1",
      "detail": "ch 23–27 · 15 đề luyện, từ 7.0 lên 7.5+"
    },
    "vocab": "Unit 20",
    "milestone": {
      "kind": "gate",
      "label": "Cửa 2"
    }
  },
  {
    "week": 21,
    "morning": {
      "label": "Speaking",
      "detail": "ch 1–8 · luật chơi và nói trôi"
    },
    "eveningA": {
      "label": "Math",
      "detail": "ch 33–35 · góc, tam giác, lượng giác · 30 Unit: U29–30"
    },
    "eveningB": {
      "label": "Task 2",
      "detail": "ch 1–7 · bốn tiêu chí, sinh ý, thesis statement"
    },
    "vocab": "quiz + sổ từ",
    "milestone": {
      "kind": "note",
      "label": "Task 2 + Speaking vào lịch"
    }
  },
  {
    "week": 22,
    "morning": {
      "label": "Speaking",
      "detail": "ch 1–8 · luật chơi và nói trôi"
    },
    "eveningA": {
      "label": "Math",
      "detail": "ch 36–37 · đường tròn, diện tích và thể tích"
    },
    "eveningB": {
      "label": "Task 2",
      "detail": "ch 1–7 · bốn tiêu chí, sinh ý, thesis statement"
    },
    "vocab": "quiz + sổ từ",
    "milestone": null
  },
  {
    "week": 23,
    "morning": {
      "label": "Speaking",
      "detail": "ch 9–11 · Part 1, 20 bộ chủ đề"
    },
    "eveningA": {
      "label": "Math",
      "detail": "ch 36–37 · đường tròn, diện tích và thể tích"
    },
    "eveningB": {
      "label": "Task 2",
      "detail": "ch 8–10 · PEEL, ví dụ hợp lệ, ngữ pháp lõi"
    },
    "vocab": "quiz + sổ từ",
    "milestone": null
  },
  {
    "week": 24,
    "morning": {
      "label": "Speaking",
      "detail": "ch 9–11 · Part 1, 20 bộ chủ đề"
    },
    "eveningA": {
      "label": "Math",
      "detail": "ch 38–40 · bốn kỹ thuật cứu nguy, 5 bộ đề"
    },
    "eveningB": {
      "label": "Task 2",
      "detail": "ch 11–13 · Opinion, Discussion, Advantages"
    },
    "vocab": "quiz + sổ từ",
    "milestone": {
      "kind": "note",
      "label": "Xong giáo trình Math"
    }
  },
  {
    "week": 25,
    "morning": {
      "label": "Speaking",
      "detail": "ch 12–14 · Part 2, 30 cue card"
    },
    "eveningA": {
      "label": "Duy trì",
      "detail": "1 bộ đề mỗi tuần + làm lại câu sai"
    },
    "eveningB": {
      "label": "Task 2",
      "detail": "ch 11–13 · Opinion, Discussion, Advantages"
    },
    "vocab": "quiz + sổ từ",
    "milestone": null
  },
  {
    "week": 26,
    "morning": {
      "label": "Speaking",
      "detail": "ch 12–14 · Part 2, 30 cue card"
    },
    "eveningA": {
      "label": "Duy trì",
      "detail": "1 bộ đề mỗi tuần + làm lại câu sai"
    },
    "eveningB": {
      "label": "Task 2",
      "detail": "ch 14–15 · Problem & Solution, Two-part question"
    },
    "vocab": "quiz + sổ từ",
    "milestone": null
  },
  {
    "week": 27,
    "morning": {
      "label": "Speaking",
      "detail": "ch 15–17 · Part 3, 60 câu hỏi"
    },
    "eveningA": {
      "label": "Duy trì",
      "detail": "1 bộ đề mỗi tuần + làm lại câu sai"
    },
    "eveningB": {
      "label": "Task 2",
      "detail": "ch 16–19 · 16 cấu trúc, Coherence & Cohesion"
    },
    "vocab": "quiz + sổ từ",
    "milestone": null
  },
  {
    "week": 28,
    "morning": {
      "label": "Speaking",
      "detail": "ch 15–17 · Part 3, 60 câu hỏi"
    },
    "eveningA": {
      "label": "Duy trì",
      "detail": "1 bộ đề mỗi tuần + làm lại câu sai"
    },
    "eveningB": {
      "label": "Task 2",
      "detail": "ch 21–22 · ngân hàng ý tưởng, 70 bài tập"
    },
    "vocab": "quiz + sổ từ",
    "milestone": null
  },
  {
    "week": 29,
    "morning": {
      "label": "Speaking",
      "detail": "ch 18–20 · từ vựng, dải ngữ pháp, tự ghi âm chấm"
    },
    "eveningA": {
      "label": "Duy trì",
      "detail": "1 bộ đề mỗi tuần + làm lại câu sai"
    },
    "eveningB": {
      "label": "Task 2",
      "detail": "ch 23 · 20 đề luyện, 15 đề có bài mẫu Band 8"
    },
    "vocab": "quiz + sổ từ",
    "milestone": null
  },
  {
    "week": 30,
    "morning": {
      "label": "Speaking",
      "detail": "ch 24–28 · từ 7.0 lên 7.5+"
    },
    "eveningA": {
      "label": "Duy trì",
      "detail": "1 bộ đề mỗi tuần + làm lại câu sai"
    },
    "eveningB": {
      "label": "Task 2",
      "detail": "ch 24–27 · từ 7.0 lên 7.5+"
    },
    "vocab": "quiz + sổ từ",
    "milestone": {
      "kind": "gate",
      "label": "Cửa 3"
    }
  },
  {
    "week": 31,
    "morning": {
      "label": "Đề đầy đủ có tính giờ",
      "detail": "2 đề/tuần, chữa 100% câu sai"
    },
    "eveningA": {
      "label": "Duy trì",
      "detail": "1 bộ đề mỗi tuần + làm lại câu sai"
    },
    "eveningB": {
      "label": "Chữa đề và viết lại",
      "detail": "2 bài Writing tự chấm mỗi tuần"
    },
    "vocab": "quiz + sổ từ",
    "milestone": null
  },
  {
    "week": 32,
    "morning": {
      "label": "Đề đầy đủ có tính giờ",
      "detail": "2 đề/tuần, chữa 100% câu sai"
    },
    "eveningA": {
      "label": "Duy trì",
      "detail": "1 bộ đề mỗi tuần + làm lại câu sai"
    },
    "eveningB": {
      "label": "Chữa đề và viết lại",
      "detail": "2 bài Writing tự chấm mỗi tuần"
    },
    "vocab": "quiz + sổ từ",
    "milestone": null
  },
  {
    "week": 33,
    "morning": {
      "label": "Đề đầy đủ có tính giờ",
      "detail": "2 đề/tuần, chữa 100% câu sai"
    },
    "eveningA": {
      "label": "Duy trì",
      "detail": "1 bộ đề mỗi tuần + làm lại câu sai"
    },
    "eveningB": {
      "label": "Chữa đề và viết lại",
      "detail": "2 bài Writing tự chấm mỗi tuần"
    },
    "vocab": "quiz + sổ từ",
    "milestone": null
  },
  {
    "week": 34,
    "morning": {
      "label": "Đề đầy đủ có tính giờ",
      "detail": "2 đề/tuần, chữa 100% câu sai"
    },
    "eveningA": {
      "label": "Duy trì",
      "detail": "1 bộ đề mỗi tuần + làm lại câu sai"
    },
    "eveningB": {
      "label": "Chữa đề và viết lại",
      "detail": "2 bài Writing tự chấm mỗi tuần"
    },
    "vocab": "quiz + sổ từ",
    "milestone": null
  },
  {
    "week": 35,
    "morning": {
      "label": "Đề đầy đủ có tính giờ",
      "detail": "2 đề/tuần, chữa 100% câu sai"
    },
    "eveningA": {
      "label": "Duy trì",
      "detail": "1 bộ đề mỗi tuần + làm lại câu sai"
    },
    "eveningB": {
      "label": "Chữa đề và viết lại",
      "detail": "2 bài Writing tự chấm mỗi tuần"
    },
    "vocab": "quiz + sổ từ",
    "milestone": null
  },
  {
    "week": 36,
    "morning": {
      "label": "Đề đầy đủ có tính giờ",
      "detail": "2 đề/tuần, chữa 100% câu sai"
    },
    "eveningA": {
      "label": "Duy trì",
      "detail": "1 bộ đề mỗi tuần + làm lại câu sai · + 1 đề Kaplan để đo"
    },
    "eveningB": {
      "label": "Chữa đề và viết lại",
      "detail": "2 bài Writing tự chấm mỗi tuần"
    },
    "vocab": "quiz + sổ từ",
    "milestone": {
      "kind": "gate",
      "label": "Cửa 4 — điều kiện đi thi"
    }
  },
  {
    "week": 37,
    "morning": {
      "label": "Ôn nhẹ",
      "detail": "chỉ đọc sổ lỗi, không học nội dung mới"
    },
    "eveningA": {
      "label": "Dừng hẳn",
      "detail": "— dồn toàn bộ sức cho IELTS"
    },
    "eveningB": null,
    "vocab": "quiz + sổ từ",
    "milestone": {
      "kind": "exam",
      "label": "Cửa sổ thi IELTS mở"
    }
  },
  {
    "week": 38,
    "morning": {
      "label": "Ôn nhẹ",
      "detail": "chỉ đọc sổ lỗi, không học nội dung mới"
    },
    "eveningA": {
      "label": "Dừng hẳn",
      "detail": "— dồn toàn bộ sức cho IELTS"
    },
    "eveningB": null,
    "vocab": "quiz + sổ từ",
    "milestone": null
  },
  {
    "week": 39,
    "morning": {
      "label": "Dự phòng",
      "detail": "dùng nếu ngày thi rơi vào cuối cửa sổ"
    },
    "eveningA": {
      "label": "Dừng hẳn",
      "detail": "— dồn toàn bộ sức cho IELTS"
    },
    "eveningB": null,
    "vocab": "quiz + sổ từ",
    "milestone": null
  },
  {
    "week": 40,
    "morning": {
      "label": "Dự phòng",
      "detail": "dùng nếu ngày thi rơi vào cuối cửa sổ"
    },
    "eveningA": {
      "label": "Dừng hẳn",
      "detail": "— dồn toàn bộ sức cho IELTS"
    },
    "eveningB": null,
    "vocab": "quiz + sổ từ",
    "milestone": {
      "kind": "exam",
      "label": "Cửa sổ thi IELTS đóng"
    }
  },
  {
    "week": 41,
    "morning": {
      "label": "SAT R&W",
      "detail": "ch 1–4 · luật chơi, cơ chế adaptive"
    },
    "eveningA": {
      "label": "Duy trì",
      "detail": "1 unit của cuốn 30 Unit mỗi tuần"
    },
    "eveningB": {
      "label": "Bài tập R&W",
      "detail": "Unit 1"
    },
    "vocab": "quiz + sổ từ",
    "milestone": {
      "kind": "note",
      "label": "Chuyển sang SAT R&W"
    }
  },
  {
    "week": 42,
    "morning": {
      "label": "SAT R&W",
      "detail": "ch 21 · Boundaries — dấu câu"
    },
    "eveningA": {
      "label": "Duy trì",
      "detail": "1 unit của cuốn 30 Unit mỗi tuần"
    },
    "eveningB": {
      "label": "Bài tập R&W",
      "detail": "Unit 2–3"
    },
    "vocab": "quiz + sổ từ",
    "milestone": null
  },
  {
    "week": 43,
    "morning": {
      "label": "SAT R&W",
      "detail": "ch 22 · Form, Structure and Sense I"
    },
    "eveningA": {
      "label": "Duy trì",
      "detail": "1 unit của cuốn 30 Unit mỗi tuần"
    },
    "eveningB": {
      "label": "Bài tập R&W",
      "detail": "Unit 4–5"
    },
    "vocab": "quiz + sổ từ",
    "milestone": null
  },
  {
    "week": 44,
    "morning": {
      "label": "SAT R&W",
      "detail": "ch 23 · Form, Structure and Sense II"
    },
    "eveningA": {
      "label": "Duy trì",
      "detail": "1 unit của cuốn 30 Unit mỗi tuần"
    },
    "eveningB": {
      "label": "Bài tập R&W",
      "detail": "Unit 6–7"
    },
    "vocab": "quiz + sổ từ",
    "milestone": null
  },
  {
    "week": 45,
    "morning": {
      "label": "SAT R&W",
      "detail": "ch 24 · Transitions"
    },
    "eveningA": {
      "label": "Duy trì",
      "detail": "1 unit của cuốn 30 Unit mỗi tuần"
    },
    "eveningB": {
      "label": "Bài tập R&W",
      "detail": "Unit 8–9"
    },
    "vocab": "quiz + sổ từ",
    "milestone": null
  },
  {
    "week": 46,
    "morning": {
      "label": "SAT R&W",
      "detail": "ch 5–8 · giải phẫu đoạn văn, quy trình 5 bước"
    },
    "eveningA": {
      "label": "Duy trì",
      "detail": "1 unit của cuốn 30 Unit mỗi tuần"
    },
    "eveningB": {
      "label": "Bài tập R&W",
      "detail": "Unit 10 + làm lại câu sai Unit 1–9"
    },
    "vocab": "quiz + sổ từ",
    "milestone": null
  },
  {
    "week": 47,
    "morning": {
      "label": "SAT R&W",
      "detail": "ch 9–12 · ngữ pháp để đọc, đoán nghĩa, văn học, biểu đồ"
    },
    "eveningA": {
      "label": "Duy trì",
      "detail": "1 unit của cuốn 30 Unit mỗi tuần"
    },
    "eveningB": {
      "label": "Ôn — không unit mới, đọc lại lời giải đã sai",
      "detail": ""
    },
    "vocab": "quiz + sổ từ",
    "milestone": null
  },
  {
    "week": 48,
    "morning": {
      "label": "SAT R&W",
      "detail": "ch 13–14 · bản đồ 11 dạng, Words in Context"
    },
    "eveningA": {
      "label": "Duy trì",
      "detail": "1 unit của cuốn 30 Unit mỗi tuần"
    },
    "eveningB": {
      "label": "Bài tập R&W",
      "detail": "Unit 11"
    },
    "vocab": "quiz + sổ từ",
    "milestone": {
      "kind": "gate",
      "label": "Cửa 5"
    }
  },
  {
    "week": 49,
    "morning": {
      "label": "SAT R&W",
      "detail": "ch 15 · Text Structure and Purpose"
    },
    "eveningA": {
      "label": "Duy trì",
      "detail": "1 unit của cuốn 30 Unit mỗi tuần"
    },
    "eveningB": {
      "label": "Bài tập R&W",
      "detail": "Unit 12"
    },
    "vocab": "quiz + sổ từ",
    "milestone": null
  },
  {
    "week": 50,
    "morning": {
      "label": "SAT R&W",
      "detail": "ch 16 · Cross-Text Connections"
    },
    "eveningA": {
      "label": "Duy trì",
      "detail": "1 unit của cuốn 30 Unit mỗi tuần"
    },
    "eveningB": {
      "label": "Bài tập R&W",
      "detail": "Unit 13"
    },
    "vocab": "quiz + sổ từ",
    "milestone": null
  },
  {
    "week": 51,
    "morning": {
      "label": "SAT R&W",
      "detail": "ch 17 · Central Ideas and Details"
    },
    "eveningA": {
      "label": "Duy trì",
      "detail": "1 unit của cuốn 30 Unit mỗi tuần"
    },
    "eveningB": {
      "label": "Bài tập R&W",
      "detail": "Unit 14"
    },
    "vocab": "quiz + sổ từ",
    "milestone": null
  },
  {
    "week": 52,
    "morning": {
      "label": "SAT R&W",
      "detail": "ch 18–19 · Command of Evidence"
    },
    "eveningA": {
      "label": "Duy trì",
      "detail": "1 unit của cuốn 30 Unit mỗi tuần"
    },
    "eveningB": {
      "label": "Bài tập R&W",
      "detail": "Unit 15"
    },
    "vocab": "quiz + sổ từ",
    "milestone": null
  },
  {
    "week": 53,
    "morning": {
      "label": "SAT R&W",
      "detail": "ch 20 · Inferences"
    },
    "eveningA": {
      "label": "Duy trì",
      "detail": "1 unit của cuốn 30 Unit mỗi tuần"
    },
    "eveningB": {
      "label": "Bài tập R&W",
      "detail": "Unit 16"
    },
    "vocab": "quiz + sổ từ",
    "milestone": null
  },
  {
    "week": 54,
    "morning": {
      "label": "SAT R&W",
      "detail": "ch 25 · Rhetorical Synthesis · + chương cùng dạng của Kaplan"
    },
    "eveningA": {
      "label": "Duy trì",
      "detail": "1 unit của cuốn 30 Unit mỗi tuần"
    },
    "eveningB": {
      "label": "Làm lại toàn bộ câu sai của 16 unit",
      "detail": ""
    },
    "vocab": "quiz + sổ từ",
    "milestone": null
  },
  {
    "week": 55,
    "morning": {
      "label": "SAT R&W",
      "detail": "ch 26–30, 43–44 · từ vựng lõi và paraphrase"
    },
    "eveningA": {
      "label": "Duy trì",
      "detail": "1 unit của cuốn 30 Unit mỗi tuần"
    },
    "eveningB": {
      "label": "Đề R&W",
      "detail": "ch 46 · 2 bộ mỗi tuần"
    },
    "vocab": "quiz + sổ từ",
    "milestone": null
  },
  {
    "week": 56,
    "morning": {
      "label": "SAT R&W",
      "detail": "ch 31–42 · 12 chủ đề từ vựng"
    },
    "eveningA": {
      "label": "Duy trì",
      "detail": "1 unit của cuốn 30 Unit mỗi tuần · + 1 đề Kaplan để đo"
    },
    "eveningB": {
      "label": "Đề R&W",
      "detail": "ch 46 · 2 bộ mỗi tuần"
    },
    "vocab": "quiz + sổ từ",
    "milestone": {
      "kind": "gate",
      "label": "Cửa 6"
    }
  },
  {
    "week": 57,
    "morning": {
      "label": "Đề full-length Kaplan",
      "detail": "2 đề/tuần, đúng giờ giấc thi thật"
    },
    "eveningA": {
      "label": "Đề Math đầy đủ",
      "detail": "trộn cùng R&W"
    },
    "eveningB": {
      "label": "Sổ lỗi và chữa đề",
      "detail": ""
    },
    "vocab": "quiz + sổ từ",
    "milestone": null
  },
  {
    "week": 58,
    "morning": {
      "label": "Đề full-length Kaplan",
      "detail": "2 đề/tuần, đúng giờ giấc thi thật"
    },
    "eveningA": {
      "label": "Đề Math đầy đủ",
      "detail": "trộn cùng R&W"
    },
    "eveningB": {
      "label": "Sổ lỗi và chữa đề",
      "detail": ""
    },
    "vocab": "quiz + sổ từ",
    "milestone": null
  },
  {
    "week": 59,
    "morning": {
      "label": "Đề full-length Kaplan",
      "detail": "2 đề/tuần, đúng giờ giấc thi thật"
    },
    "eveningA": {
      "label": "Đề Math đầy đủ",
      "detail": "trộn cùng R&W"
    },
    "eveningB": {
      "label": "Sổ lỗi và chữa đề",
      "detail": ""
    },
    "vocab": "quiz + sổ từ",
    "milestone": null
  },
  {
    "week": 60,
    "morning": {
      "label": "Giảm tải",
      "detail": "chỉ đọc sổ lỗi và bảng công thức"
    },
    "eveningA": {
      "label": "Đề Math đầy đủ",
      "detail": "trộn cùng R&W"
    },
    "eveningB": {
      "label": "Sổ lỗi và chữa đề",
      "detail": ""
    },
    "vocab": "quiz + sổ từ",
    "milestone": {
      "kind": "exam",
      "label": "Thi SAT 06/11/2027"
    }
  }
];

export const PLAN_STAGES: PlanStage[] = [
  {
    "id": "I",
    "name": "Dựng nền",
    "fromWeek": 1,
    "toWeek": 12,
    "summary": "Hai kỹ năng đọc và nghe đi trước, vì chúng cho điểm sớm nhất và không cần ai chấm. SAT Math chạy nền ở slot tối cách ngày.",
    "slots": [
      {
        "when": "Sáng · 90 phút",
        "what": "Reading — giáo trình, hết 11 dạng câu hỏi"
      },
      {
        "when": "Tối A · cách ngày",
        "what": "SAT Math — nền toán, từ vựng toán, Algebra"
      },
      {
        "when": "Tối B · cách ngày",
        "what": "Listening — hết sáu nhóm dạng câu hỏi"
      }
    ],
    "books": "Reading · Listening · SAT Math 20 tuần · 30 Unit (từ T7) · Từ vựng 20 Unit"
  },
  {
    "id": "II",
    "name": "Đủ bộ bốn kỹ năng",
    "fromWeek": 13,
    "toWeek": 20,
    "summary": "Writing Task 1 vào lịch ở slot tối B — Listening vừa xong nên chỗ ấy trống. Reading kết thúc ở tuần 16, sau đó buổi sáng chuyển sang làm đề có tính giờ.",
    "slots": [
      {
        "when": "Sáng · 90 phút",
        "what": "Reading tới hết T16, rồi đề Reading + Listening"
      },
      {
        "when": "Tối A · cách ngày",
        "what": "SAT Math — Advanced Math và Problem-Solving"
      },
      {
        "when": "Tối B · cách ngày",
        "what": "Writing Task 1 — trọn 45 ngày của cuốn sách"
      }
    ],
    "books": "Reading · Writing Task 1 · SAT Math 20 tuần · 30 Unit · Từ vựng 20 Unit"
  },
  {
    "id": "III",
    "name": "Viết và nói",
    "fromWeek": 21,
    "toWeek": 30,
    "summary": "Task 2 và Speaking chạy song song được vì một cái viết, một cái nói — không tranh nhau cùng một loại mệt. Reading và Listening rút về mức duy trì.",
    "slots": [
      {
        "when": "Sáng · 90 phút",
        "what": "Speaking — trọn 60 ngày, có ghi âm và tự chấm"
      },
      {
        "when": "Tối A · cách ngày",
        "what": "SAT Math xong giáo trình ở T24, rồi duy trì"
      },
      {
        "when": "Tối B · cách ngày",
        "what": "Writing Task 2 — trọn 60 ngày"
      }
    ],
    "books": "Speaking · Writing Task 2 · SAT Math 20 tuần · 30 Unit"
  },
  {
    "id": "IV",
    "name": "Đề trộn và thi IELTS",
    "fromWeek": 31,
    "toWeek": 40,
    "summary": "Sáu tuần luyện đề đầy đủ có tính giờ, rồi bốn tuần cửa sổ thi. SAT Math dừng hẳn từ tuần 37 — ngày thi IELTS không dời được, ngày thi SAT thì dời được.",
    "slots": [
      {
        "when": "Sáng · 90 phút",
        "what": "2 đề đầy đủ mỗi tuần, chữa 100% câu sai"
      },
      {
        "when": "Tối A · cách ngày",
        "what": "SAT Math duy trì tới T36, sau đó dừng"
      },
      {
        "when": "Tối B · cách ngày",
        "what": "Chữa đề, viết lại 2 bài Writing mỗi tuần"
      }
    ],
    "books": "Toàn bộ ngân hàng đề của năm cuốn IELTS"
  },
  {
    "id": "V",
    "name": "SAT Reading & Writing",
    "fromWeek": 41,
    "toWeek": 56,
    "summary": "Mười sáu tuần cho phần verbal, và thứ tự đọc cố tình khác thứ tự in trong giáo trình: ngữ pháp trước, đọc hiểu sau. Ngữ pháp chạy theo luật nên cho điểm nhanh nhất, và cuốn bài tập cũng xếp đúng thứ tự ấy.",
    "slots": [
      {
        "when": "Sáng · 90 phút",
        "what": "Giáo trình 16 tuần — ch 21–24 trước, rồi ch 5–20"
      },
      {
        "when": "Tối A · cách ngày",
        "what": "SAT Math giữ tay: 1 unit của cuốn 30 Unit mỗi tuần"
      },
      {
        "when": "Tối B · cách ngày",
        "what": "Sách bài tập 16 Unit — mỗi unit ăn khớp một chương"
      }
    ],
    "books": "SAT R&W 16 tuần · SAT R&W 16 Unit · 30 Unit · Đọc song ngữ 20 phút/ngày"
  },
  {
    "id": "VI",
    "name": "Về đích SAT",
    "fromWeek": 57,
    "toWeek": 60,
    "summary": "Bốn tuần đề trộn cả hai phần thi, rồi giảm tải ở tuần cuối. Thi ngày 06/11/2027.",
    "slots": [
      {
        "when": "Sáng · 90 phút",
        "what": "2 đề SAT đầy đủ mỗi tuần"
      },
      {
        "when": "Tối A · cách ngày",
        "what": "Đề Math riêng cho phần còn yếu"
      },
      {
        "when": "Tối B · cách ngày",
        "what": "Sổ lỗi — chỉ đọc lại, không học mới"
      }
    ],
    "books": "Cả bốn cuốn SAT"
  }
];

export const PLAN_CHECKPOINTS: PlanCheckpoint[] = [
  {
    "no": 1,
    "week": 12,
    "targets": [
      {
        "skill": "IELTS Reading",
        "target": "26/40",
        "note": "band 6.5"
      },
      {
        "skill": "IELTS Listening",
        "target": "23/40",
        "note": "band 6.0"
      },
      {
        "skill": "SAT Math",
        "target": "550",
        "note": "đề trong ch 40"
      }
    ],
    "ifMissed": "Chưa đạt thì không sang chặng II. Lùi một tuần, cắt slot SAT Math, dùng cả tuần đó chữa lại những dạng câu sai nhiều nhất."
  },
  {
    "no": 2,
    "week": 20,
    "targets": [
      {
        "skill": "IELTS Reading",
        "target": "30/40",
        "note": "band 7.0"
      },
      {
        "skill": "IELTS Listening",
        "target": "28/40",
        "note": "band 6.5"
      },
      {
        "skill": "Writing Task 1",
        "target": "6.5",
        "note": "tự chấm theo ch 20"
      },
      {
        "skill": "SAT Math",
        "target": "620",
        "note": ""
      }
    ],
    "ifMissed": "Reading hoặc Listening chưa tới thì lùi Task 2 lại một tuần chứ không rút ngắn Task 1 — Task 1 chỉ có 45 ngày và không nén được."
  },
  {
    "no": 3,
    "week": 30,
    "targets": [
      {
        "skill": "IELTS Reading",
        "target": "33/40",
        "note": "band 7.5"
      },
      {
        "skill": "IELTS Listening",
        "target": "31/40",
        "note": "band 7.0"
      },
      {
        "skill": "Writing",
        "target": "7.0",
        "note": "Task 1 và Task 2"
      },
      {
        "skill": "Speaking",
        "target": "6.5",
        "note": "tự ghi âm chấm theo ch 20"
      }
    ],
    "ifMissed": "Đây là cửa quan trọng nhất. Chưa đạt thì bỏ hẳn SAT Math trong chặng IV và dồn sáu tuần luyện đề cho kỹ năng đang thấp nhất."
  },
  {
    "no": 4,
    "week": 36,
    "targets": [
      {
        "skill": "Đề đầy đủ có tính giờ",
        "target": "R 33 · L 32",
        "note": "band 7.5 mỗi kỹ năng"
      },
      {
        "skill": "Writing",
        "target": "7.0",
        "note": ""
      },
      {
        "skill": "Speaking",
        "target": "7.0",
        "note": ""
      },
      {
        "skill": "Tổng dự kiến",
        "target": "7.0 – 7.5",
        "note": "trung bình bốn kỹ năng"
      }
    ],
    "ifMissed": "Đây là điều kiện đi thi. Chưa đạt ở một kỹ năng thì vẫn thi — nhưng đăng ký ngày muộn nhất trong cửa sổ, tuần 40, để có thêm bốn tuần."
  },
  {
    "no": 5,
    "week": 48,
    "targets": [
      {
        "skill": "Bài tập R&W Unit 1–10",
        "target": "≥ 21/24",
        "note": "mỗi unit"
      },
      {
        "skill": "SAT Math",
        "target": "giữ 620+",
        "note": "1 unit/tuần"
      }
    ],
    "ifMissed": "Mười unit này là phần chạy theo luật. Chưa đạt nghĩa là chưa thuộc luật, không phải chưa đủ luyện — quay lại ch 21–24 của giáo trình."
  },
  {
    "no": 6,
    "week": 56,
    "targets": [
      {
        "skill": "SAT Math",
        "target": "700",
        "note": "đề đầy đủ"
      },
      {
        "skill": "SAT R&W",
        "target": "650",
        "note": "đề đầy đủ"
      },
      {
        "skill": "Tổng",
        "target": "1350",
        "note": ""
      }
    ],
    "ifMissed": "Chưa đạt thì dời sang kỳ thi tháng 12/2027 hoặc tháng 3/2028. Điểm SAT không có hạn nộp gấp như IELTS."
  }
];

export const PLAN_BOOKS: PlanBook[] = [
  {
    "title": "IELTS Reading — Đường tới 7.5+",
    "pages": "479 trang",
    "when": "Tuần 1–16",
    "exam": "ielts",
    "fromWeek": 1,
    "toWeek": 16
  },
  {
    "title": "IELTS Listening",
    "pages": "317 trang",
    "when": "Tuần 1–12, đề ở T17–20",
    "exam": "ielts",
    "fromWeek": 1,
    "toWeek": 20
  },
  {
    "title": "IELTS Writing Task 1",
    "pages": "316 trang",
    "when": "Tuần 13–20",
    "exam": "ielts",
    "fromWeek": 13,
    "toWeek": 20
  },
  {
    "title": "IELTS Writing Task 2",
    "pages": "261 trang",
    "when": "Tuần 21–30",
    "exam": "ielts",
    "fromWeek": 21,
    "toWeek": 30
  },
  {
    "title": "IELTS Speaking",
    "pages": "349 trang",
    "when": "Tuần 21–30",
    "exam": "ielts",
    "fromWeek": 21,
    "toWeek": 30
  },
  {
    "title": "IELTS Từ vựng — 20 Unit",
    "pages": "419 trang",
    "when": "Tuần 1–20, khối 08:50 mỗi ngày",
    "exam": "ielts",
    "fromWeek": 1,
    "toWeek": 20
  },
  {
    "title": "SAT Math — 20 tuần",
    "pages": "150 trang",
    "when": "Tuần 1–24",
    "exam": "sat",
    "fromWeek": 1,
    "toWeek": 24
  },
  {
    "title": "SAT Math — 30 Unit luyện tập",
    "pages": "386 trang",
    "when": "Tuần 7–21, rồi duy trì tới T56",
    "exam": "sat",
    "fromWeek": 7,
    "toWeek": 56
  },
  {
    "title": "SAT Reading & Writing — 16 tuần",
    "pages": "321 trang",
    "when": "Tuần 41–56",
    "exam": "sat",
    "fromWeek": 41,
    "toWeek": 56
  },
  {
    "title": "SAT R&W — 16 Unit luyện tập",
    "pages": "251 trang",
    "when": "Tuần 41–56",
    "exam": "sat",
    "fromWeek": 41,
    "toWeek": 56
  },
  {
    "title": "Đọc song ngữ Anh–Việt",
    "pages": "624 trang",
    "when": "Tuần 41–60, 20 phút mỗi ngày",
    "exam": "extra",
    "fromWeek": 41,
    "toWeek": 60
  },
  {
    "title": "IELTS Reading Hacker Basic · ngoài tủ",
    "pages": "—",
    "when": "Tuần 5–11, kho bài đọc dễ",
    "exam": "extra",
    "fromWeek": 5,
    "toWeek": 11
  },
  {
    "title": "Kaplan Digital SAT Total Prep · ngoài tủ",
    "pages": "—",
    "when": "T12·20·36·56 để đo, rồi T57–60",
    "exam": "sat",
    "fromWeek": 12,
    "toWeek": 60
  }
];
