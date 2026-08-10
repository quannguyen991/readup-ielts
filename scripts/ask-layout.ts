/**
 * Hỏi ý kiến bố cục khi dựng UI (qua proxy tương thích OpenAI).
 *
 *   npm run ai:layout -- "Màn hình Test Review nên xếp panel evidence bên phải hay dưới?"
 */
import 'dotenv/config';

import { askLayoutAdvice } from '../src/services/ai/layout-advisor';

async function main(): Promise<void> {
  const question = process.argv.slice(2).join(' ').trim();

  if (!question) {
    console.error('Cách dùng: npm run ai:layout -- "câu hỏi về bố cục"');
    process.exit(1);
  }

  for (const name of ['OPENAI_API_KEY', 'OPENAI_BASE_URL']) {
    if (!process.env[name]) {
      console.error(`Thiếu ${name} trong .env.local.`);
      process.exit(1);
    }
  }

  console.log(await askLayoutAdvice(question));
}

main().catch((err: unknown) => {
  console.error('Lỗi:', err instanceof Error ? err.message : err);
  process.exit(1);
});
