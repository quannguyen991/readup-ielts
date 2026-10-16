import test from 'node:test';
import assert from 'node:assert/strict';

import { isConfigured, parseAssessment, pronunciationHeader } from './pronunciation-service';

test('chưa có khoá thì không bật', () => {
  assert.equal(isConfigured({}), false);
  assert.equal(isConfigured({ AZURE_SPEECH_KEY: 'k' }), false);
  assert.equal(isConfigured({ AZURE_SPEECH_KEY: 'k', AZURE_SPEECH_REGION: 'southeastasia' }), true);
});

test('tiêu đề yêu cầu chứa câu chuẩn và cách chấm theo âm vị', () => {
  const decoded = JSON.parse(Buffer.from(pronunciationHeader('ship'), 'base64').toString('utf8'));
  assert.equal(decoded.ReferenceText, 'ship');
  assert.equal(decoded.Granularity, 'Phoneme');
  assert.equal(decoded.GradingSystem, 'HundredMark');
});

test('đọc phản hồi dạng chi tiết: điểm từng từ và từng âm', () => {
  const a = parseAssessment({
    RecognitionStatus: 'Success',
    NBest: [
      {
        PronunciationAssessment: { AccuracyScore: 72, FluencyScore: 80, CompletenessScore: 100, PronScore: 76 },
        Words: [
          {
            Word: 'ship',
            PronunciationAssessment: { AccuracyScore: 58, ErrorType: 'Mispronunciation' },
            Phonemes: [
              { Phoneme: 'sh', PronunciationAssessment: { AccuracyScore: 90 } },
              { Phoneme: 'ih', PronunciationAssessment: { AccuracyScore: 40 } },
              { Phoneme: 'p', PronunciationAssessment: { AccuracyScore: 20 } },
            ],
          },
        ],
      },
    ],
  });
  assert.equal(a.status, 'Success');
  assert.equal(a.overall.accuracy, 72);
  assert.equal(a.words[0]!.word, 'ship');
  assert.equal(a.words[0]!.errorType, 'Mispronunciation');
  assert.deepEqual(a.words[0]!.phonemes.map((p) => p.phoneme), ['sh', 'ih', 'p']);
  assert.equal(a.words[0]!.phonemes[2]!.accuracy, 20);
});

test('thiếu trường thì để null/0, không bịa điểm', () => {
  const a = parseAssessment({ RecognitionStatus: 'NoMatch' });
  assert.equal(a.status, 'NoMatch');
  assert.equal(a.overall.accuracy, null);
  assert.deepEqual(a.words, []);
});
