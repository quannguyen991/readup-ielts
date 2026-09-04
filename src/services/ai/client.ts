import OpenAI from 'openai';

import { AiError } from './errors';
import { serverEnv } from '@/lib/env';

/**
 * SERVER-ONLY. Không import file này từ code client — key sẽ bị lộ trong bundle.
 * Endpoint OpenAI là proxy tự host tương thích chuẩn OpenAI (OPENAI_BASE_URL).
 */

let openaiClient: OpenAI | null = null;

let imageClient: OpenAI | null = null;

/**
 * Client RIÊNG cho việc sinh ảnh, trỏ vào proxy khác proxy chữ.
 *
 * Cần tách vì hai proxy có danh mục không giao nhau: proxy codex chỉ phục vụ
 * model chữ (Claude + Codex) — hỏi `gpt-image-1` hay `dall-e-3` đều nhận
 * `model_not_found`, đã thử cả hai. Model ảnh chỉ có ở ai-box.
 *
 * Mặc định rơi về đúng biến của proxy chính, nên không phải khai thêm gì nếu
 * không muốn tách riêng.
 */
export function getOpenAIImages(): OpenAI {
  assertServer();

  if (!imageClient) {
    imageClient = new OpenAI({
      apiKey:
        process.env.IMAGE_API_KEY ?? process.env.AI_PRIMARY_API_KEY ?? serverEnv('OPENAI_API_KEY'),
      baseURL:
        process.env.IMAGE_BASE_URL ?? process.env.AI_PRIMARY_BASE_URL ?? serverEnv('OPENAI_BASE_URL'),
      maxRetries: 0,
      // Sinh ảnh chậm hơn hẳn sinh chữ: đo thật là 45,8s một tấm.
      timeout: 240_000,
    });
  }

  return imageClient;
}

export function getOpenAI(): OpenAI {
  assertServer();

  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: serverEnv('OPENAI_API_KEY'),
      baseURL: serverEnv('OPENAI_BASE_URL'),
      maxRetries: 0, // retry do withRetry() quản lý để log được từng lần
      timeout: 120_000,
    });
  }

  return openaiClient;
}

/** Model mặc định, đổi được qua env mà không phải sửa code. */
export const AI_MODELS = {
  image: process.env.OPENAI_IMAGE_MODEL ?? 'qwen-image-3.0',
  layoutAdvisor: process.env.OPENAI_TEXT_MODEL ?? 'gpt-4.1-mini',
  claude: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6',
  /** Dịch song ngữ. Haiku đủ tốt cho việc dịch sát nghĩa, và rẻ hơn hẳn. */
  translate: process.env.TRANSLATE_MODEL ?? 'claude-haiku-4-5-20251001',
} as const;

function assertServer(): void {
  // Bundle client của Expo Web chạy trong trình duyệt → có window.
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    throw new AiError(
      'missing_config',
      'services/ai/client chỉ được gọi ở server (API route / Edge Function / script).',
    );
  }
}
