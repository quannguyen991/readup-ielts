import OpenAI from 'openai';

import { AiError } from './errors';
import { serverEnv } from '@/lib/env';

/**
 * SERVER-ONLY. Không import file này từ code client — key sẽ bị lộ trong bundle.
 * Endpoint OpenAI là proxy tự host tương thích chuẩn OpenAI (OPENAI_BASE_URL).
 */

let openaiClient: OpenAI | null = null;

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
  image: process.env.OPENAI_IMAGE_MODEL ?? 'gpt-image-1',
  layoutAdvisor: process.env.OPENAI_TEXT_MODEL ?? 'gpt-4.1-mini',
  claude: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6',
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
