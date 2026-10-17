import React, { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';

import { LightHero } from '@/components/layout/LightHero';
import { Screen } from '@/components/layout/Screen';
import { DESTINATION_B1_DECKS, DESTINATION_B2_DECKS, type DestinationCourse } from '@/data/destination-vocab';
import { useL } from '@/i18n/useL';
import { color } from '@/theme/tokens';
import type { VocabTopicWord } from '@/data/vocab-topics';

type ReviewQuestion = { word: VocabTopicWord; choices: string[]; answer: string };
const LETTERS = ['A', 'B', 'C', 'D'];

function shuffled<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

function buildQuestions(course: DestinationCourse): ReviewQuestion[] {
  const decks = course === 'b1' ? DESTINATION_B1_DECKS : DESTINATION_B2_DECKS;
  const pool = decks.flatMap((deck) => deck.words).filter((word) => Boolean(word.meaningVi?.trim() || word.definitionEn?.trim()));
  const selected = shuffled(pool).slice(0, Math.min(50, pool.length));
  return selected.map((word) => {
    const answer = word.meaningVi?.trim() || word.definitionEn.trim();
    const distractors = shuffled(pool
      .filter((item) => item.word !== word.word)
      .map((item) => item.meaningVi?.trim() || item.definitionEn.trim())
      .filter((meaning) => meaning && meaning !== answer))
      .filter((meaning, index, all) => all.indexOf(meaning) === index)
      .slice(0, 3);
    const choices = shuffled([answer, ...distractors]);
    return { word, choices, answer };
  });
}

function highlightReading(text: string, terms: string[]) {
  const escaped = [...terms]
    .filter((term) => /^[a-z][a-z' -]*$/i.test(term))
    .sort((a, b) => b.length - a.length)
    .map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (!escaped.length) return text;
  const pattern = new RegExp(`\\b(${escaped.join('|')})\\b`, 'gi');
  const parts = text.split(pattern);
  const lookup = new Set(terms.map((term) => term.toLowerCase()));
  return parts.map((part, index) => lookup.has(part.toLowerCase())
    ? <Text key={`${part}-${index}`} style={{ fontWeight: '800', color: color.primary, backgroundColor: '#FFF1F5' }}>{part}</Text>
    : part);
}

const READINGS: Record<DestinationCourse, Array<{ title: string; text: string; questions: string[] }>> = {
  b1: [
    {
      title: 'A club that brings people together',
      text: 'When Linh moved to a new neighbourhood, she did not know anyone. A classmate invited her to join the local music club. At first, Linh felt nervous, but the other members were patient and generous. They helped her practise for a small concert and encouraged her to take part in a team game afterwards. The project became a pleasant challenge: everyone had to organise one activity, listen to suggestions and support the group. By the end of the month, Linh had made several loyal friends. She learned that a new experience can change your mood and help you feel part of a community.',
      questions: ['What made Linh feel more comfortable in the club?', 'Which two activities did the members prepare?', 'What did Linh learn from the project?'],
    },
    {
      title: 'A safer journey to school',
      text: 'The students noticed that traffic near their school was becoming crowded. They searched for a practical solution and interviewed people who lived nearby. Their report showed that many families travelled by car because the crossing was difficult to see. The students asked the local council to improve the signs and create a safer route. They also made a simple map showing the distance from nearby streets. A month later, the council had installed new signs. The students were pleased that their research had produced a useful result.',
      questions: ['What problem did the students investigate?', 'Why did families often use a car?', 'What changed after the students sent their report?'],
    },
  ],
  b2: [
    {
      title: 'The shared garden experiment',
      text: 'A group of residents turned an unused piece of land into a community garden. Their first aim was to reduce waste: neighbours brought food scraps for compost and reused wooden boxes as planters. The project also had an unexpected effect on local life. People who had only exchanged polite greetings began to share tools, recipes and advice. The volunteers measured how much food they could grow and recorded the results. Although the garden could not supply every household, it gave residents a practical way to learn about the environment and work together.',
      questions: ['How did the residents reuse materials?', 'What unexpected effect did the garden have?', 'Why did the volunteers record their results?'],
    },
    {
      title: 'Choosing reliable news',
      text: 'A school media group wanted to understand why rumours spread so quickly online. The students compared headlines from several websites and checked whether each report named its sources. They discovered that an attractive headline did not always describe the full story. Before sharing an article, the group now looks for evidence, checks the publication date and compares the information with another report. Their teacher explained that a responsible viewer should distinguish opinion from fact. The students concluded that a few minutes of careful research can prevent a misleading claim from reaching a much wider audience.',
      questions: ['What did the media group compare?', 'What checks do they make before sharing an article?', 'What can careful research prevent?'],
    },
  ],
};

export default function DestinationReviewScreen() {
  const { L } = useL();
  const [course, setCourse] = useState<DestinationCourse>('b1');
  const [version, setVersion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const questions = useMemo(() => buildQuestions(course), [course, version]);
  const readings = READINGS[course];
  const readingTerms = useMemo(() => {
    const decks = course === 'b1' ? DESTINATION_B1_DECKS : DESTINATION_B2_DECKS;
    return decks.flatMap((deck) => deck.words.map((word) => word.word));
  }, [course]);
  const score = questions.filter((question, index) => answers[index] === question.answer).length;
  const answered = Object.keys(answers).length;

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const style = document.createElement('style');
    style.id = 'destination-review-print-css';
    style.textContent = `@media print { body * { visibility:hidden !important; } #destination-review-sheet, #destination-review-sheet * { visibility:visible !important; } #destination-review-sheet { position:absolute !important; inset:0 auto auto 0 !important; width:100% !important; height:auto !important; max-height:none !important; overflow:visible !important; padding:0 !important; background:#fff !important; } #destination-review-sheet * { overflow:visible !important; max-height:none !important; } .destination-no-print { display:none !important; } .destination-question { break-inside:avoid; page-break-inside:avoid; } .destination-answer-key { break-before:page; page-break-before:always; } }`;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  const printSheet = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') window.print();
  };

  return (
    <Screen>
      <View className="destination-no-print">
        <LightHero
          scene="vocab"
          badge="DESTINATION · ÔN TẬP"
          line1={L('Ôn từ vựng theo ngữ cảnh', 'Review vocabulary in context')}
          line2={L('50 câu trắc nghiệm + bài đọc', '50 multiple-choice questions + readings')}
          subtitle={L('Chọn trình độ, làm đề mới hoặc in phiếu ôn tập. Các unit cũng có quiz kiểu THPT riêng.', 'Choose a level, generate a fresh set, or print a worksheet. Each unit also has its own high-school exam quiz.')}
        />
        <View className="mt-4 flex-row flex-wrap gap-2">
          {(['b1', 'b2'] as const).map((value) => {
            const active = course === value;
            return (
              <Pressable key={value} accessibilityRole="button" onPress={() => { setCourse(value); setAnswers({}); }} style={{ paddingVertical: 11, paddingHorizontal: 18, borderRadius: 14, backgroundColor: active ? color.primary : '#fff', borderWidth: 1, borderColor: active ? color.primary : '#E8DFD4' }}>
                <Text style={{ color: active ? '#fff' : color.ink, fontWeight: '700' }}>{value.toUpperCase()} · Destination</Text>
              </Pressable>
            );
          })}
          <Pressable accessibilityRole="button" onPress={() => { setAnswers({}); setVersion((x) => x + 1); }} style={{ paddingVertical: 11, paddingHorizontal: 18, borderRadius: 14, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E8DFD4' }}>
            <Text style={{ color: color.ink, fontWeight: '700' }}>{L('Tạo đề mới', 'New set')}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={printSheet} style={{ paddingVertical: 11, paddingHorizontal: 18, borderRadius: 14, backgroundColor: color.ink, borderWidth: 1, borderColor: color.ink }}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>{L('In phiếu ôn tập', 'Print worksheet')}</Text>
          </Pressable>
        </View>
        <Text className="mt-3 font-sans text-label text-muted">
          {answered ? L(`Đã làm ${answered}/${questions.length} · đúng ${score}`, `${answered}/${questions.length} answered · ${score} correct`) : L(`${questions.length} câu · chọn một đáp án mỗi câu`, `${questions.length} questions · choose one answer each`)}
        </Text>
      </View>

      <ScrollView nativeID="destination-review-sheet" className="mt-4" contentContainerStyle={{ gap: 10, paddingBottom: 36 }}>
        <View style={{ padding: 18, borderRadius: 18, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E8DFD4' }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: color.ink }}>Destination {course.toUpperCase()} · Vocabulary review</Text>
          <Text style={{ marginTop: 4, color: '#64748B' }}>{L('Tên: ____________________     Ngày: ______________', 'Name: ____________________     Date: ______________')}</Text>
        </View>
        {questions.map((question, index) => {
          const selected = answers[index];
          return (
            <View key={`${version}-${course}-${index}`} className="destination-question" style={{ padding: 15, borderRadius: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E8DFD4' }}>
              <Text style={{ fontWeight: '800', color: color.ink }}>{index + 1}. {L('Chọn nghĩa phù hợp nhất với', 'Choose the best meaning for')} “{question.word.word}”</Text>
              <View style={{ marginTop: 8, gap: 6 }}>
                {question.choices.map((choice, optionIndex) => {
                  const isSelected = selected === choice;
                  const isCorrect = selected && choice === question.answer;
                  return (
                    <Pressable key={`${optionIndex}-${choice}`} accessibilityRole="button" onPress={() => setAnswers((prev) => ({ ...prev, [index]: choice }))} style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start', padding: 8, borderRadius: 9, backgroundColor: isCorrect ? '#EAF7EE' : isSelected ? '#FFF3E8' : '#FAF8F4' }}>
                      <Text style={{ minWidth: 20, fontWeight: '700', color: color.primary }}>{LETTERS[optionIndex]}.</Text>
                      <Text style={{ flex: 1, color: color.ink }}>{choice}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          );
        })}
        <View className="destination-answer-key" style={{ padding: 18, borderRadius: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E8DFD4' }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: color.ink }}>{L('Đáp án', 'Answer key')}</Text>
          <Text style={{ marginTop: 8, lineHeight: 24, color: color.ink }}>
            {questions.map((q, index) => `${index + 1}. ${LETTERS[q.choices.indexOf(q.answer)]}`).join('    ')}
          </Text>
        </View>
        <View className="destination-no-print" style={{ padding: 18, gap: 14 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: color.ink }}>{L('Luyện từ trong bài đọc', 'Practise vocabulary in readings')}</Text>
          {readings.map((reading) => (
            <View key={reading.title} style={{ padding: 18, borderRadius: 18, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E8DFD4' }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: color.ink }}>{reading.title}</Text>
              <Text style={{ marginTop: 8, lineHeight: 24, color: color.ink }}>{highlightReading(reading.text, readingTerms)}</Text>
              <Text style={{ marginTop: 10, fontWeight: '700', color: color.primary }}>{L('Đọc hiểu', 'Reading check')}</Text>
              {reading.questions.map((q, i) => <Text key={q} style={{ marginTop: 5, lineHeight: 22, color: color.ink }}>{i + 1}. {q}</Text>)}
            </View>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}
