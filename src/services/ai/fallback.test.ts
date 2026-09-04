import test from 'node:test';
import assert from 'node:assert/strict';

import { buildMessages, __fallbackInternals, type Purpose } from './fallback';

const { readEndpoints } = __fallbackInternals;

/**
 * Kiểm lớp chọn cửa và lớp dựng tin nhắn.
 *
 * Không gọi mạng: chỗ đáng hỏng ở đây là LOGIC CHỌN, không phải chất lượng model
 * (thứ đó đo bằng `scripts/bench-ai-routing.mjs`, chạy tay). Cụ thể là ba thứ đã
 * từng sai thật: cửa nuốt vai `system` mà không ai biết, cửa dự phòng thiếu model
 * thì bị loại im lặng, và thứ tự cửa không theo cấu hình.
 */

/** Đặt biến môi trường cho một lượt kiểm rồi trả lại nguyên trạng. */
function withEnv<T>(vars: Record<string, string | undefined>, run: () => T): T {
  const truoc = new Map<string, string | undefined>();
  for (const [k, v] of Object.entries(vars)) {
    truoc.set(k, process.env[k]);
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  try {
    return run();
  } finally {
    for (const [k, v] of truoc) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
}

/** Ba cửa đầy đủ, dùng làm nền cho từng ca kiểm. */
const BA_CUA = {
  AI_PRIMARY_BASE_URL: 'https://api.groq.com/openai/v1',
  AI_PRIMARY_API_KEY: 'k1',
  AI_PRIMARY_MODEL: 'model-1',
  AI_PRIMARY_FOLD_SYSTEM: undefined,
  AI_SECONDARY_BASE_URL: 'https://home.ai-box.vn/v1',
  AI_SECONDARY_API_KEY: 'k2',
  AI_SECONDARY_MODEL: 'model-2',
  AI_SECONDARY_FOLD_SYSTEM: undefined,
  AI_TERTIARY_BASE_URL: 'https://codex.hungnguyen.codes/v1',
  AI_TERTIARY_API_KEY: 'k3',
  AI_TERTIARY_MODEL: 'model-3',
  AI_TERTIARY_FOLD_SYSTEM: 'true',
} satisfies Record<string, string | undefined>;

/** Xoá mọi biến model theo từng việc để chúng không lẫn vào ca kiểm. */
const XOA_MODEL_RIENG: Record<string, undefined> = {
  WRITING_MODEL: undefined,
  COACH_MODEL: undefined,
  TRANSLATE_MODEL: undefined,
  QUESTIONS_MODEL: undefined,
  CHAT_MODEL: undefined,
  DEFINE_MODEL: undefined,
  WRITING_FALLBACK_MODEL: undefined,
  COACH_FALLBACK_MODEL: undefined,
  TRANSLATE_FALLBACK_MODEL: undefined,
  QUESTIONS_FALLBACK_MODEL: undefined,
  CHAT_FALLBACK_MODEL: undefined,
  DEFINE_FALLBACK_MODEL: undefined,
  AI_ORDER_WRITING: undefined,
  AI_ORDER_COACH: undefined,
  AI_ORDER_TRANSLATE: undefined,
  AI_ORDER_QUESTIONS: undefined,
  AI_ORDER_CHAT: undefined,
  AI_ORDER_DEFINE: undefined,
};

const NEN = { ...XOA_MODEL_RIENG, ...BA_CUA };

// ---------------------------------------------------------------- buildMessages

test('cửa bình thường: chỉ dẫn nằm ở vai system, dữ liệu nằm ở vai user', () => {
  const msgs = buildMessages({ foldSystemIntoUser: false }, { system: 'CHI-DAN', user: 'DU-LIEU' });
  assert.deepEqual(msgs, [
    { role: 'system', content: 'CHI-DAN' },
    { role: 'user', content: 'DU-LIEU' },
  ]);
});

test('cửa nuốt system: chỉ dẫn được gộp vào tin nhắn người dùng', () => {
  const msgs = buildMessages({ foldSystemIntoUser: true }, { system: 'CHI-DAN', user: 'DU-LIEU' });

  assert.equal(msgs.length, 2);
  const user = msgs[1];
  assert.equal(user?.role, 'user');
  assert.ok(user?.content.includes('CHI-DAN'), 'gộp rồi mà chỉ dẫn vẫn mất là hỏng cả cơ chế');
  assert.ok(user?.content.includes('DU-LIEU'), 'dữ liệu phải còn nguyên');
  assert.ok(
    user.content.indexOf('CHI-DAN') < user.content.indexOf('DU-LIEU'),
    'chỉ dẫn phải đứng TRƯỚC dữ liệu, không thì model đọc bài xong mới biết phải làm gì',
  );
});

test('cửa nuốt system vẫn được gửi kèm vai system', () => {
  // Gửi thừa thì vô hại, còn cửa nào đọc được vai system sẽ đọc đúng chỗ.
  const msgs = buildMessages({ foldSystemIntoUser: true }, { system: 'CHI-DAN', user: 'DU-LIEU' });
  assert.equal(msgs[0]?.role, 'system');
  assert.equal(msgs[0]?.content, 'CHI-DAN');
});

// ---------------------------------------------------------------- readEndpoints

test('đủ ba cửa thì trả về đủ ba, đúng thứ tự mặc định', () => {
  withEnv(NEN, () => {
    const eps = readEndpoints('writing');
    assert.deepEqual(
      eps.map((e) => e.key),
      ['primary', 'secondary', 'tertiary'],
    );
  });
});

test('cờ nuốt system chỉ bật đúng ở cửa được đánh dấu', () => {
  withEnv(NEN, () => {
    const eps = readEndpoints('writing');
    assert.deepEqual(
      eps.map((e) => e.foldSystemIntoUser),
      [false, false, true],
    );
  });
});

test('defaultModel lấp cho mọi việc chưa được chỉ định model riêng', () => {
  withEnv(NEN, () => {
    const viec: Purpose[] = ['writing', 'coach', 'translate', 'questions', 'chat', 'define'];
    for (const p of viec) {
      const eps = readEndpoints(p);
      assert.equal(eps.length, 3, `việc ${p} phải còn đủ ba cửa`);
      assert.equal(eps[2]?.models[p], 'model-3', `cửa ba của việc ${p} phải có model`);
    }
  });
});

test('model riêng của một việc thắng defaultModel', () => {
  withEnv({ ...NEN, WRITING_MODEL: 'model-cham-bai' }, () => {
    const eps = readEndpoints('writing');
    assert.equal(eps[0]?.models.writing, 'model-cham-bai');
    // Việc khác không bị ảnh hưởng.
    assert.equal(readEndpoints('chat')[0]?.models.chat, 'model-1');
  });
});

test('cửa thiếu khoá hoặc thiếu địa chỉ thì bị loại, không làm hỏng cả lượt gọi', () => {
  withEnv({ ...NEN, AI_SECONDARY_API_KEY: undefined }, () => {
    const eps = readEndpoints('writing');
    assert.deepEqual(
      eps.map((e) => e.key),
      ['primary', 'tertiary'],
    );
  });
});

test('không cửa nào dùng được thì ném lỗi cấu hình, không trả về mảng rỗng', () => {
  withEnv(
    {
      ...NEN,
      AI_PRIMARY_BASE_URL: undefined,
      AI_PRIMARY_API_KEY: undefined,
      AI_SECONDARY_BASE_URL: undefined,
      AI_TERTIARY_BASE_URL: undefined,
      OPENAI_BASE_URL: undefined,
      OPENAI_API_KEY: undefined,
    },
    () => {
      assert.throws(() => readEndpoints('writing'), /proxy AI/i);
    },
  );
});

test('AI_ORDER_<VIỆC> đảo được thứ tự cửa', () => {
  withEnv({ ...NEN, AI_ORDER_WRITING: 'tertiary,primary,secondary' }, () => {
    assert.deepEqual(
      readEndpoints('writing').map((e) => e.key),
      ['tertiary', 'primary', 'secondary'],
    );
    // Việc khác giữ nguyên thứ tự mặc định.
    assert.deepEqual(
      readEndpoints('chat').map((e) => e.key),
      ['primary', 'secondary', 'tertiary'],
    );
  });
});

test('cửa không có tên trong AI_ORDER thì xuống cuối chứ không bị loại', () => {
  withEnv({ ...NEN, AI_ORDER_WRITING: 'secondary' }, () => {
    const keys = readEndpoints('writing').map((e) => e.key);
    assert.equal(keys[0], 'secondary', 'cửa được gọi tên phải lên đầu');
    assert.equal(keys.length, 3, 'cấu hình thiếu sót không được làm mất đường dự phòng');
  });
});

test('nhãn cửa lấy từ tên miền, không phải tên viết tay', () => {
  withEnv(NEN, () => {
    const eps = readEndpoints('writing');
    assert.equal(eps[0]?.label, 'api.groq.com');
    assert.equal(eps[1]?.label, 'home.ai-box.vn');
    assert.equal(eps[2]?.label, 'codex.hungnguyen.codes');
  });
});

// --------------------------------------------------------------- ngân sách tổng

test('còn nhiều thời gian thì cửa được dùng trọn hạn chờ của nó', () => {
  const { remainingBudget } = __fallbackInternals;
  const deadline = Date.now() + 40_000;
  assert.equal(remainingBudget(deadline, 20_000), 20_000);
});

test('sắp hết ngân sách thì hạn chờ bị cắt xuống cho vừa', () => {
  const { remainingBudget } = __fallbackInternals;
  const deadline = Date.now() + 5_000;
  const con = remainingBudget(deadline, 45_000);
  assert.ok(con > 0 && con <= 5_000, `phải cắt còn <=5s, thực tế ${con}`);
});

test('hết giờ thì trả 0 để bỏ qua cửa, không mở request chắc chắn bị cắt', () => {
  const { remainingBudget } = __fallbackInternals;
  assert.equal(remainingBudget(Date.now() + 500, 45_000), 0, 'dưới 2s coi như hết');
  assert.equal(remainingBudget(Date.now() - 1_000, 45_000), 0, 'quá hạn cũng phải là 0');
});

test('ngân sách tổng phải nằm dưới trần 60s của Vercel', () => {
  const { TOTAL_BUDGET_MS } = __fallbackInternals;
  assert.ok(
    TOTAL_BUDGET_MS < 60_000,
    `ngân sách ${TOTAL_BUDGET_MS}ms không chừa chỗ nào để trả lời trước khi Vercel cắt`,
  );
});
