import { test } from 'node:test';
import assert from 'node:assert/strict';

import { lemmatize, pickBestTranslation } from './lookup';

/**
 * MyMemory trộn bản dịch máy với kho dịch cộng đồng, và trường `translatedText`
 * ở đầu phản hồi lấy bản có `match` cao nhất — kể cả khi đó là rác do người
 * dùng nào đó nhập vào.
 *
 * Đã gặp thật trên bản public: tra "coral" ra "tóc ngôcolor", trong khi ngay
 * dưới đó bản dịch máy ghi đúng "san hô".
 */

test('bỏ bản dịch rác của kho cộng đồng, lấy bản dịch máy', () => {
  const result = pickBestTranslation('coral', {
    responseData: { translatedText: 'tóc ngôcolor' },
    matches: [
      { translation: 'tóc ngôcolor', match: 1, 'created-by': 'Public_Corpora' },
      { translation: 'san hô', match: 0.99, 'created-by': 'MateCat' },
      { translation: 'San hô', match: 0.98, 'created-by': 'Public_Corpora' },
    ],
  });

  assert.equal(result, 'san hô');
});

test('không có bản dịch máy thì dùng trường chính', () => {
  const result = pickBestTranslation('reef', {
    responseData: { translatedText: 'ám tiêu' },
    matches: [{ translation: 'Ám tiều', match: 0.98, 'created-by': 'Wikipedia' }],
  });

  assert.equal(result, 'ám tiêu');
});

test('trong các bản dịch máy thì lấy bản khớp nhất', () => {
  const result = pickBestTranslation('bleaching', {
    responseData: { translatedText: 'sự làm trắng' },
    matches: [
      { translation: 'Tẩy trắng tóc', match: 0.85, 'created-by': 'MateCat' },
      { translation: 'sự làm trắng', match: 0.99, 'created-by': 'MateCat' },
    ],
  });

  assert.equal(result, 'sự làm trắng');
});

test('dịch ra đúng chữ tiếng Anh ban đầu thì coi như không dịch được', () => {
  // Hiện lại nguyên từ tiếng Anh dưới nhãn "Nghĩa tiếng Việt" là vô nghĩa.
  const result = pickBestTranslation('coral', {
    responseData: { translatedText: 'coral' },
    matches: [{ translation: 'Coral', match: 1, 'created-by': 'MateCat' }],
  });

  assert.equal(result, null);
});

test('phản hồi rỗng hoặc hỏng thì trả null, không ném lỗi', () => {
  assert.equal(pickBestTranslation('coral', {}), null);
  assert.equal(pickBestTranslation('coral', { matches: [] }), null);
});

test('lemmatize rút về dạng gốc để gom từ trong sổ từ', () => {
  assert.equal(lemmatize('reefs'), 'reef');
  assert.equal(lemmatize('studies'), 'study');
  assert.equal(lemmatize('running'), 'run');
  assert.equal(lemmatize('moved'), 'move');
});
