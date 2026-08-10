/**
 * Kiểu dữ liệu cho Supabase client.
 *
 * Viết tay theo migration 20260809000100_init.sql. Khi schema đổi, chạy lại:
 *   npx supabase gen types typescript --project-id <ref> > src/types/database.ts
 */

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export type LicenseType =
  | 'public_domain'
  | 'cc_by'
  | 'cc_by_sa'
  | 'gov_open'
  | 'user_pasted'
  | 'headline_only';

export type ArticleTrack = 'academic' | 'general_training';

/**
 * Tier bám cấu trúc Reading của IELTS: 3 passage tăng dần độ dài và độ khó,
 * cộng ba loại ngoài đề thi.
 *
 * Danh sách này phải khớp đúng enum `passage_tier` trong
 * supabase/migrations/20260810000100_passage_tier.sql (Task 8).
 */
export type PassageTier =
  | 'p1'
  | 'p2'
  | 'p3'
  | 'short_academic'
  | 'headline'
  | 'official_practice';

export type QuestionType =
  | 'true_false_not_given'
  | 'yes_no_not_given'
  | 'matching_headings'
  | 'matching_information'
  | 'multiple_choice'
  | 'sentence_completion'
  | 'summary_completion'
  | 'short_answer';

export type WordStatusKind = 'new' | 'learning' | 'familiar' | 'known' | 'ignored';

export type HighlightColor = 'yellow' | 'green' | 'blue' | 'purple' | 'pink';

export type FsrsState = 'new' | 'learning' | 'review' | 'relearning';

export type ChatRole = 'user' | 'assistant' | 'system';

export type StudyActivity = 'practice' | 'mock_test' | 'review' | 'reading_library';

/** Cột do DB tự sinh (id, created_at, ...) là optional khi insert. */
type Generated = 'id' | 'created_at' | 'updated_at';

type TableDef<Row, OptionalOnInsert extends keyof Row = never> = {
  Row: Row;
  Insert: Omit<Row, Extract<Generated | OptionalOnInsert, keyof Row>> &
    Partial<Pick<Row, Extract<Generated | OptionalOnInsert, keyof Row>>>;
  Update: Partial<Row>;
  Relationships: [];
};

export type Profile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  target_band: number | null;
  target_date: string | null;
  daily_goal_minutes: number;
  locale: string;
  created_at: string;
  updated_at: string;
};

export type Topic = {
  id: string;
  slug: string;
  name: string;
  name_vi: string | null;
  icon_url: string | null;
  color: string | null;
  sort_order: number;
  created_at: string;
};

export type Article = {
  id: string;
  title: string;
  slug: string | null;
  source_name: string | null;
  source_url: string | null;
  topic_id: string | null;
  topic: string | null;
  track: ArticleTrack;
  cefr_level: CefrLevel | null;
  band_range: string | null;
  word_count: number | null;
  est_minutes: number | null;
  /** null với bài Loại B (headline_only) — không lưu toàn văn báo có bản quyền. */
  body_text: string | null;
  summary: string | null;
  thumbnail_url: string | null;
  license_type: LicenseType;
  attribution: string | null;
  readability_score: number | null;
  rare_word_ratio: number | null;
  created_by: string | null;
  is_private: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ArticleSimplification = {
  id: string;
  article_id: string;
  target_level: CefrLevel;
  body_text: string;
  model: string | null;
  created_at: string;
};

export type ArticleProgress = {
  id: string;
  user_id: string;
  article_id: string;
  percent_completed: number;
  last_position: number;
  last_read_at: string;
  created_at: string;
  updated_at: string;
};

export type VocabEntry = {
  id: string;
  user_id: string;
  word: string;
  lemma: string;
  definition_context: string | null;
  definition_general: string | null;
  definition_vi: string | null;
  phonetic: string | null;
  part_of_speech: string | null;
  example_sentence: string | null;
  /** Bắt buộc: nguyên câu gốc nơi gặp từ. */
  source_sentence: string;
  article_id: string | null;
  paragraph_index: number | null;
  mastery_percent: number;
  is_collocation: boolean;
  created_at: string;
  updated_at: string;
};

export type FsrsCard = {
  id: string;
  user_id: string;
  vocab_id: string;
  card_kind: string;
  due: string;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  reps: number;
  lapses: number;
  state: FsrsState;
  last_review: string | null;
  created_at: string;
  updated_at: string;
};

export type FsrsReview = {
  id: string;
  user_id: string;
  card_id: string;
  rating: 1 | 2 | 3 | 4;
  state: FsrsState;
  due: string | null;
  stability: number | null;
  difficulty: number | null;
  elapsed_days: number | null;
  last_elapsed_days: number | null;
  scheduled_days: number | null;
  review_at: string;
  duration_ms: number | null;
};

export type WordStatus = {
  id: string;
  user_id: string;
  lemma: string;
  status: WordStatusKind;
  times_seen: number;
  first_seen_at: string;
  last_seen_at: string;
  updated_at: string;
};

export type QuestionSet = {
  id: string;
  article_id: string;
  user_id: string | null;
  title: string | null;
  track: ArticleTrack;
  difficulty: string | null;
  total_questions: number;
  est_minutes: number | null;
  generated_by: string | null;
  model: string | null;
  created_at: string;
  updated_at: string;
};

export type Question = {
  id: string;
  question_set_id: string;
  order_index: number;
  type: QuestionType;
  prompt: string;
  instruction: string | null;
  options: Json | null;
  correct_answer: string;
  evidence_text: string;
  evidence_paragraph_index: number;
  explanation: string;
  lesson_tip: string | null;
  created_at: string;
};

export type TestSession = {
  id: string;
  user_id: string;
  article_id: string | null;
  question_set_id: string | null;
  mode: string;
  raw_score: number;
  total: number;
  estimated_band: number | null;
  accuracy: number | null;
  duration_ms: number | null;
  started_at: string;
  finished_at: string | null;
  created_at: string;
};

export type Attempt = {
  id: string;
  user_id: string;
  test_session_id: string | null;
  question_id: string;
  user_answer: string | null;
  is_correct: boolean;
  time_spent_ms: number | null;
  marked_for_review: boolean;
  created_at: string;
};

export type Highlight = {
  id: string;
  user_id: string;
  article_id: string;
  text: string;
  paragraph_index: number;
  start_offset: number | null;
  end_offset: number | null;
  color: HighlightColor;
  note: string | null;
  is_evidence_for_question_id: string | null;
  created_at: string;
  updated_at: string;
};

export type ChatMessage = {
  id: string;
  user_id: string;
  article_id: string | null;
  role: ChatRole;
  content: string;
  model: string | null;
  token_usage: Json | null;
  created_at: string;
};

export type CustomPrompt = {
  id: string;
  user_id: string;
  title: string;
  body: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type ReadingSession = {
  id: string;
  user_id: string;
  article_id: string | null;
  words_read: number;
  wpm: number | null;
  duration_ms: number;
  activity: StudyActivity;
  started_at: string;
  ended_at: string | null;
  created_at: string;
};

export type Note = {
  id: string;
  user_id: string;
  article_id: string | null;
  question_id: string | null;
  paragraph_index: number | null;
  title: string | null;
  body: string;
  created_at: string;
  updated_at: string;
};

export type Bookmark = {
  id: string;
  user_id: string;
  article_id: string | null;
  question_id: string | null;
  vocab_id: string | null;
  note: string | null;
  created_at: string;
};

export type DailyGoal = {
  id: string;
  user_id: string;
  goal_date: string;
  target_minutes: number;
  minutes_studied: number;
  questions_answered: number;
  words_reviewed: number;
  completed: boolean;
  created_at: string;
  updated_at: string;
};

export type Streak = {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_active_date: string | null;
  updated_at: string;
};

export type StudyTimeEntry = {
  id: string;
  user_id: string;
  activity: StudyActivity;
  minutes: number;
  entry_date: string;
  created_at: string;
};

export type GeneratedAsset = {
  id: string;
  kind: string;
  cache_key: string;
  prompt: string | null;
  model: string | null;
  storage_path: string;
  public_url: string | null;
  width: number | null;
  height: number | null;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: TableDef<Profile, 'display_name' | 'avatar_url' | 'target_band' | 'target_date' | 'daily_goal_minutes' | 'locale'>;
      topics: TableDef<Topic, 'name_vi' | 'icon_url' | 'color' | 'sort_order'>;
      articles: TableDef<
        Article,
        | 'slug' | 'source_name' | 'source_url' | 'topic_id' | 'topic' | 'track' | 'cefr_level'
        | 'band_range' | 'word_count' | 'est_minutes' | 'body_text' | 'summary' | 'thumbnail_url'
        | 'license_type' | 'attribution' | 'readability_score' | 'rare_word_ratio'
        | 'created_by' | 'is_private' | 'published_at'
      >;
      article_simplifications: TableDef<ArticleSimplification, 'model'>;
      article_progress: TableDef<
        ArticleProgress,
        'percent_completed' | 'last_position' | 'last_read_at'
      >;
      vocab_entries: TableDef<
        VocabEntry,
        | 'definition_context' | 'definition_general' | 'definition_vi' | 'phonetic'
        | 'part_of_speech' | 'example_sentence' | 'article_id' | 'paragraph_index'
        | 'mastery_percent' | 'is_collocation'
      >;
      fsrs_cards: TableDef<
        FsrsCard,
        | 'card_kind' | 'due' | 'stability' | 'difficulty' | 'elapsed_days' | 'scheduled_days'
        | 'reps' | 'lapses' | 'state' | 'last_review'
      >;
      fsrs_reviews: TableDef<
        FsrsReview,
        | 'due' | 'stability' | 'difficulty' | 'elapsed_days' | 'last_elapsed_days'
        | 'scheduled_days' | 'review_at' | 'duration_ms'
      >;
      word_status: TableDef<
        WordStatus,
        'status' | 'times_seen' | 'first_seen_at' | 'last_seen_at'
      >;
      question_sets: TableDef<
        QuestionSet,
        | 'user_id' | 'title' | 'track' | 'difficulty' | 'total_questions' | 'est_minutes'
        | 'generated_by' | 'model'
      >;
      questions: TableDef<Question, 'instruction' | 'options' | 'lesson_tip'>;
      test_sessions: TableDef<
        TestSession,
        | 'article_id' | 'question_set_id' | 'mode' | 'raw_score' | 'total' | 'estimated_band'
        | 'accuracy' | 'duration_ms' | 'started_at' | 'finished_at'
      >;
      attempts: TableDef<
        Attempt,
        'test_session_id' | 'user_answer' | 'is_correct' | 'time_spent_ms' | 'marked_for_review'
      >;
      highlights: TableDef<
        Highlight,
        'start_offset' | 'end_offset' | 'color' | 'note' | 'is_evidence_for_question_id'
      >;
      chat_messages: TableDef<ChatMessage, 'article_id' | 'model' | 'token_usage'>;
      custom_prompts: TableDef<CustomPrompt, 'sort_order'>;
      reading_sessions: TableDef<
        ReadingSession,
        'article_id' | 'words_read' | 'wpm' | 'duration_ms' | 'activity' | 'started_at' | 'ended_at'
      >;
      notes: TableDef<Note, 'article_id' | 'question_id' | 'paragraph_index' | 'title'>;
      bookmarks: TableDef<Bookmark, 'article_id' | 'question_id' | 'vocab_id' | 'note'>;
      daily_goals: TableDef<
        DailyGoal,
        | 'goal_date' | 'target_minutes' | 'minutes_studied' | 'questions_answered'
        | 'words_reviewed' | 'completed'
      >;
      streaks: TableDef<
        Streak,
        'current_streak' | 'longest_streak' | 'last_active_date' | 'updated_at'
      >;
      study_time_entries: TableDef<StudyTimeEntry, 'minutes' | 'entry_date'>;
      generated_assets: TableDef<
        GeneratedAsset,
        'prompt' | 'model' | 'public_url' | 'width' | 'height'
      >;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      cefr_level: CefrLevel;
      license_type: LicenseType;
      article_track: ArticleTrack;
      question_type: QuestionType;
      word_status_kind: WordStatusKind;
      highlight_color: HighlightColor;
      fsrs_state: FsrsState;
      chat_role: ChatRole;
      study_activity: StudyActivity;
    };
    CompositeTypes: Record<string, never>;
  };
};
