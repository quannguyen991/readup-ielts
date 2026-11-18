/**
 * Kiểu dữ liệu cho kho tham chiếu IELTS Speaking (Part 1, 2, 3).
 * Câu hỏi là đề thi công khai; bài mẫu, ý triển khai, từ vựng và paraphrase là nội dung tự viết.
 * Bài mẫu nhắm mức Band 9 để luyện, không phải điểm chấm chính thức.
 */

export type SpeakingRefVocab = {
  word: string;
  meaningVi: string;
  synonyms: string[];
  collocation: string;
};

export type SpeakingRefQuestion = {
  n: number;
  q: string;
  qVi: string;
  paraphrase: string;
  sampleAnswer: string;
  vocab: SpeakingRefVocab[];
  altDirectionVi: string;
};

export type SpeakingRefExtraQuestion = {
  q: string;
  hintVi: string;
};

export type SpeakingRefPart1Topic = {
  id: string;
  no: number;
  topic: string;
  topicVi: string;
  section: 'compulsory' | 'specific';
  ideasVi: string[];
  questions: SpeakingRefQuestion[];
  extraQuestions: SpeakingRefExtraQuestion[];
};

export type SpeakingRefPart2Card = {
  id: string;
  no: number;
  title: string;
  titleVi: string;
  cue: string;
  cueVi: string;
  bullets: string[];
  bulletsVi: string[];
  ideasVi: string[];
  structureVi: string;
  sampleAnswer: string;
  vocab: SpeakingRefVocab[];
  paraphraseCue: string[];
  altPhrasing: { from: string; to: string }[];
  altDirections: { titleVi: string; outlineVi: string; openerEn: string }[];
};

export type SpeakingRefPart3Topic = {
  id: string;
  no: number;
  topic: string;
  topicVi: string;
  ideasVi: string[];
  questions: SpeakingRefQuestion[];
};
