import React, { useDeferredValue, useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { NeonWindow } from '@/components/neon/Neon';
import { Appear } from '@/components/motion/Motion';
import { SpeakingIcon } from '@/components/speaking/SpeakingIcon';
import { speakingIconFor, type SpeakingIconId } from '@/components/speaking/speaking-icon';
import { Icon } from '@/components/ui';
import { SPEAKING_REF_PART1 } from '@/data/speaking-reference/part1';
import { SPEAKING_REF_PART2 } from '@/data/speaking-reference/part2';
import { SPEAKING_REF_PART3 } from '@/data/speaking-reference/part3';
import type { SpeakingRefQuestion, SpeakingRefVocab } from '@/data/speaking-reference/types';
import { speak } from '@/services/hub/speak';
import { useL } from '@/i18n/useL';

type Part = 1 | 2 | 3;

const ACCENT = '#6A4BD9';
const INDIGO = '#2A22B5';
const ACCENT_BG = '#F1ECFF';
const INK = '#1F1A33';
const MUTED = '#5B6475';
const LINE = '#E4DDF7';

const PART_TABS: { part: Part; vi: string; en: string }[] = [
  { part: 1, vi: `Part 1 · ${SPEAKING_REF_PART1.length} chủ đề`, en: `Part 1 · ${SPEAKING_REF_PART1.length} topics` },
  { part: 2, vi: `Part 2 · ${SPEAKING_REF_PART2.length} cue card`, en: `Part 2 · ${SPEAKING_REF_PART2.length} cue cards` },
  { part: 3, vi: `Part 3 · ${SPEAKING_REF_PART3.length} chủ đề`, en: `Part 3 · ${SPEAKING_REF_PART3.length} topics` },
];

function normalise(value: string) {
  const lower = value.toLowerCase();
  const folded = typeof lower.normalize === 'function' ? lower.normalize('NFD').replace(/[̀-ͯ]/g, '') : lower;
  return folded.replace(/đ/g, 'd').trim();
}

function Chip({ label }: { label: string }) {
  return (
    <View style={{ borderRadius: 999, backgroundColor: ACCENT_BG, paddingHorizontal: 10, paddingVertical: 4 }}>
      <Text style={{ color: ACCENT, fontSize: 13 }}>{label}</Text>
    </View>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <Text className="font-heavy" style={{ color: ACCENT, fontSize: 13, letterSpacing: 0.8, textTransform: 'uppercase' }}>
      {children}
    </Text>
  );
}

function Disclosure({
  title,
  subtitle,
  children,
  defaultOpen = false,
  level = 'topic',
  icon,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  level?: 'topic' | 'item';
  icon?: SpeakingIconId;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const isTopic = level === 'topic';
  return (
    <View
      style={{
        borderRadius: isTopic ? 18 : 14,
        borderWidth: isTopic ? 2 : 1,
        borderColor: isTopic ? '#D9D2F5' : LINE,
        backgroundColor: isTopic ? '#FFFFFF' : '#FBFAFF',
        overflow: 'hidden',
        ...(isTopic ? ({ boxShadow: '0 3px 0 rgba(106,75,217,0.28)' } as object) : null),
      }}
    >
      <Pressable
        onPress={() => setOpen((value) => !value)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: isTopic ? 16 : 12 }}
      >
        {icon ? (
          <View style={{ width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1F1A6E', borderWidth: 2, borderColor: '#6A4BD9' }}>
            <SpeakingIcon name={icon} size={42} />
          </View>
        ) : null}
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text className="font-semi" style={{ color: INK, fontSize: isTopic ? 17 : 15, lineHeight: 22 }}>
            {title}
          </Text>
          {subtitle ? (
            <Text className="font-nun" style={{ color: MUTED, fontSize: 13, marginTop: 2, lineHeight: 18 }}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <Icon name={open ? 'chevron-up' : 'chevron-down'} size={18} color={MUTED} />
      </Pressable>
      {open ? (
        <View style={{ paddingHorizontal: isTopic ? 16 : 12, paddingBottom: isTopic ? 18 : 14, gap: 14 }}>{children}</View>
      ) : null}
    </View>
  );
}

function VocabList({ items }: { items: SpeakingRefVocab[] }) {
  return (
    <View style={{ gap: 12 }}>
      {items.map((item) => (
        <View key={item.word} style={{ borderLeftWidth: 3, borderLeftColor: '#B9A6F2', paddingLeft: 12, gap: 4 }}>
          <Text className="font-semi" style={{ color: INK, fontSize: 15 }}>
            {item.word}
          </Text>
          <Text className="font-nun" style={{ color: MUTED, fontSize: 14, lineHeight: 20 }}>
            {item.meaningVi}
          </Text>
          {item.synonyms.length ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
              {item.synonyms.map((synonym) => (
                <Chip key={synonym} label={synonym} />
              ))}
            </View>
          ) : null}
          <Text className="font-nun" style={{ color: ACCENT, fontSize: 13, marginTop: 2 }}>
            {item.collocation}
          </Text>
        </View>
      ))}
    </View>
  );
}

/** Bài mẫu kèm nút nghe: đọc to để bắt chước nhịp và ngữ điệu. */
function SampleText({ text, lineHeight = 24 }: { text: string; lineHeight?: number }) {
  return (
    <View style={{ gap: 8 }}>
      <Text className="font-nun" style={{ color: INK, fontSize: 15, lineHeight }}>
        {text}
      </Text>
      <Pressable
        onPress={() => speak(text)}
        accessibilityRole="button"
        accessibilityLabel="Nghe bài mẫu"
        style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, backgroundColor: ACCENT_BG, paddingHorizontal: 12, paddingVertical: 6 }}
      >
        <Icon name="volume" size={15} color={ACCENT} />
        <Text className="font-semi" style={{ color: ACCENT, fontSize: 14 }}>Nghe bài mẫu</Text>
      </Pressable>
    </View>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <View style={{ gap: 6 }}>
      {items.map((item, index) => (
        <View key={`${index}-${item}`} style={{ flexDirection: 'row', gap: 8 }}>
          <Text style={{ color: ACCENT, fontSize: 15, lineHeight: 22 }}>•</Text>
          <Text className="font-nun" style={{ color: INK, fontSize: 15, lineHeight: 22, flex: 1 }}>
            {item}
          </Text>
        </View>
      ))}
    </View>
  );
}

export default function SpeakingReferenceScreen() {
  const { L } = useL();
  const [part, setPart] = useState<Part>(1);
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const needle = normalise(deferredQuery);

  const matches = (fields: string[]) => !needle || normalise(fields.join(' ')).includes(needle);

  const part1Topics = useMemo(
    () =>
      SPEAKING_REF_PART1.filter((topic) =>
        matches([
          topic.topic,
          topic.topicVi,
          ...topic.questions.flatMap((item) => [item.q, item.qVi]),
          ...topic.extraQuestions.map((item) => item.q),
        ]),
      ),
    [needle],
  );

  const part2Cards = useMemo(
    () => SPEAKING_REF_PART2.filter((card) => matches([card.title, card.titleVi, card.cue, card.cueVi])),
    [needle],
  );

  const part3Topics = useMemo(
    () =>
      SPEAKING_REF_PART3.filter((topic) =>
        matches([topic.topic, topic.topicVi, ...topic.questions.flatMap((item) => [item.q, item.qVi])]),
      ),
    [needle],
  );

  const renderQuestion = (item: SpeakingRefQuestion) => (
    <Disclosure key={`q-${item.n}-${item.q}`} level="item" title={item.q} subtitle={item.qVi}>
      <View style={{ gap: 6 }}>
        <SectionLabel>{L('Bài mẫu Band 9', 'Band 9 sample')}</SectionLabel>
        <SampleText text={item.sampleAnswer} />
      </View>
      <View style={{ gap: 6 }}>
        <SectionLabel>{L('Paraphrase câu hỏi', 'Question paraphrase')}</SectionLabel>
        <Text className="font-nun" style={{ color: INK, fontSize: 15, lineHeight: 22 }}>
          {item.paraphrase}
        </Text>
      </View>
      <View style={{ gap: 8 }}>
        <SectionLabel>{L('Từ vựng · đồng nghĩa', 'Vocabulary · synonyms')}</SectionLabel>
        <VocabList items={item.vocab} />
      </View>
      <View style={{ gap: 6 }}>
        <SectionLabel>{L('Hướng trả lời khác', 'Alternative angle')}</SectionLabel>
        <Text className="font-nun" style={{ color: INK, fontSize: 15, lineHeight: 22 }}>
          {item.altDirectionVi}
        </Text>
      </View>
    </Disclosure>
  );

  const empty = (
    <View style={{ padding: 20, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: LINE }}>
      <Text className="font-nun" style={{ color: MUTED, fontSize: 15, textAlign: 'center' }}>
        {L('Không có nội dung khớp với tìm kiếm.', 'Nothing matches your search.')}
      </Text>
    </View>
  );

  return (
    <Screen>
      <Pressable onPress={() => router.push('/speaking' as never)} className="mb-3 flex-row items-center gap-1.5 self-start">
        <Icon name="chevron-left" size={16} color="#64748B" />
        <Text className="font-semi text-body text-muted">{L('Speaking', 'Speaking')}</Text>
      </Pressable>

      <Appear>
        <NeonWindow title={L('Bài mẫu Speaking', 'Speaking samples')} icon="speaker" badge="BAND 9">
          <View style={{ gap: 10 }}>
            <Text className="font-heavy" style={{ color: ACCENT, fontSize: 12, letterSpacing: 1.6 }}>
              IELTS SPEAKING · THAM CHIẾU
            </Text>
            <Text className="font-nun-heavy" style={{ color: INK, fontSize: 22, lineHeight: 28 }}>
              {L('Câu hỏi Part 1, 2, 3 kèm bài mẫu Band 9', 'Part 1, 2, 3 questions with Band 9 samples')}
            </Text>
            <Text className="font-nun" style={{ color: MUTED, fontSize: 15, lineHeight: 23 }}>
              {L(
                'Ý triển khai, từ vựng có đồng nghĩa, paraphrase và hướng trả lời khác.',
                'Ideas, synonyms, paraphrases and alternative angles.',
              )}
            </Text>
            <View style={{ borderRadius: 14, backgroundColor: '#FFF8E8', borderWidth: 1, borderColor: '#F0D9A8', padding: 12 }}>
              <Text className="font-nun" style={{ color: MUTED, fontSize: 13, lineHeight: 19 }}>
                {L(
                  'Câu hỏi là đề công khai. Bài mẫu do ReadUp tự viết để luyện, nhắm mức Band 9; đây không phải điểm chấm chính thức và không phải bài gốc của nguồn nào.',
                  'Questions are public prompts. Samples are written by ReadUp for practice at Band 9 level; they are not official scores or any source\'s original answers.',
                )}
              </Text>
            </View>
          </View>
        </NeonWindow>
      </Appear>

      <Appear index={1}>
      <NeonWindow
        style={{ marginTop: 18, marginBottom: 32 }}
        title={`PART ${part}`}
        badge={String(part === 1 ? part1Topics.length : part === 2 ? part2Cards.length : part3Topics.length)}
        icon="book"
        padded={false}
      >
      <View style={{ backgroundColor: '#F3F0FF', padding: 16, gap: 12 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {PART_TABS.map((tab) => {
          const active = part === tab.part;
          return (
            <Pressable
              key={tab.part}
              onPress={() => setPart(tab.part)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              style={{
                borderRadius: 999,
                borderWidth: 2,
                borderColor: active ? INDIGO : '#D8D2EA',
                backgroundColor: active ? INDIGO : '#FFFFFF',
                paddingHorizontal: 14,
                paddingVertical: 8,
              }}
            >
              <Text className="font-semi" style={{ color: active ? '#FFFFFF' : INK, fontSize: 14 }}>
                {L(tab.vi, tab.en)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder={L('Tìm chủ đề, câu hỏi, từ vựng…', 'Search topics, questions, vocabulary…')}
        placeholderTextColor="#8A90A0"
        style={{
          borderWidth: 2,
          borderColor: '#D8D2EA',
          borderRadius: 14,
          paddingHorizontal: 14,
          paddingVertical: 11,
          fontSize: 15,
          color: INK,
          backgroundColor: '#FFFFFF',
        }}
      />

      </View>

      <View style={{ gap: 12, padding: 16 }}>
        {part === 1 ? (
          part1Topics.length ? (
            (['compulsory', 'specific'] as const).map((section) => {
              const list = part1Topics.filter((topic) => topic.section === section);
              if (!list.length) return null;
              return (
                <View key={section} style={{ gap: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
                    <Text className="font-heavy" style={{ color: INK, fontSize: 17 }}>
                      {section === 'compulsory' ? L('Chủ đề cơ bản, hay gặp nhất', 'Core topics (most common)') : L('Chủ đề cụ thể', 'Specific topics')}
                    </Text>
                    <Text className="font-nun" style={{ color: MUTED, fontSize: 13 }}>
                      {list.length} {L('chủ đề', 'topics')}
                    </Text>
                  </View>
                  {list.map((topic) => (
                    <Disclosure
                      key={topic.id}
                      icon={speakingIconFor(topic.topic, topic.topicVi)}
                      title={`${topic.no}. ${topic.topicVi}`}
                      subtitle={`${topic.topic} · ${topic.questions.length} ${L('câu', 'questions')}`}
                    >
                      <View style={{ gap: 6 }}>
                        <SectionLabel>{L('Ý triển khai', 'Ideas')}</SectionLabel>
                        <Bullets items={topic.ideasVi} />
                      </View>
                      <View style={{ gap: 10 }}>{topic.questions.map(renderQuestion)}</View>
                      <View style={{ gap: 6 }}>
                        <SectionLabel>{L('Câu hỏi thêm', 'More questions')}</SectionLabel>
                        {topic.extraQuestions.map((item) => (
                          <View key={item.q} style={{ gap: 2, paddingVertical: 4 }}>
                            <Text className="font-semi" style={{ color: INK, fontSize: 15, lineHeight: 22 }}>
                              {item.q}
                            </Text>
                            <Text className="font-nun" style={{ color: MUTED, fontSize: 13, lineHeight: 19 }}>
                              {item.hintVi}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </Disclosure>
                  ))}
                </View>
              );
            })
          ) : (
            empty
          )
        ) : null}

        {part === 2 ? (
          part2Cards.length ? (
            part2Cards.map((card) => (
              <Disclosure
                key={card.id}
                icon={speakingIconFor(card.title, card.titleVi)}
                title={`${card.no}. ${card.title}`}
                subtitle={card.titleVi}
              >
                <View style={{ gap: 6 }}>
                  <SectionLabel>{L('Đề bài', 'Cue card')}</SectionLabel>
                  <Text className="font-semi" style={{ color: INK, fontSize: 15, lineHeight: 22 }}>
                    {card.cue}
                  </Text>
                  <Text className="font-nun" style={{ color: MUTED, fontSize: 13, lineHeight: 19 }}>
                    {card.cueVi}
                  </Text>
                  <View style={{ gap: 4, marginTop: 6 }}>
                    {card.bullets.map((bullet, index) => (
                      <Text key={`${index}-${bullet}`} className="font-nun" style={{ color: INK, fontSize: 15, lineHeight: 22 }}>
                        {`• ${bullet}${card.bulletsVi[index] ? ` (${card.bulletsVi[index]})` : ''}`}
                      </Text>
                    ))}
                  </View>
                </View>
                <View style={{ gap: 6 }}>
                  <SectionLabel>{L('Gợi ý triển khai', 'How to develop each point')}</SectionLabel>
                  {card.ideasVi.map((idea, index) => (
                    <Text key={`${index}-${idea}`} className="font-nun" style={{ color: INK, fontSize: 15, lineHeight: 22 }}>
                      {`${index + 1}. ${idea}`}
                    </Text>
                  ))}
                  <Text className="font-nun" style={{ color: MUTED, fontSize: 14, lineHeight: 20, marginTop: 4 }}>
                    {card.structureVi}
                  </Text>
                </View>
                <View style={{ gap: 6 }}>
                  <SectionLabel>{L('Bài mẫu Band 9 · khoảng 2 phút', 'Band 9 sample · about 2 minutes')}</SectionLabel>
                  <SampleText text={card.sampleAnswer} lineHeight={25} />
                </View>
                <View style={{ gap: 8 }}>
                  <SectionLabel>{L('Từ vựng · đồng nghĩa', 'Vocabulary · synonyms')}</SectionLabel>
                  <VocabList items={card.vocab} />
                </View>
                <View style={{ gap: 6 }}>
                  <SectionLabel>{L('Paraphrase đề bài', 'Cue card paraphrase')}</SectionLabel>
                  {card.paraphraseCue.map((line) => (
                    <Text key={line} className="font-nun" style={{ color: INK, fontSize: 15, lineHeight: 22 }}>
                      {`• ${line}`}
                    </Text>
                  ))}
                </View>
                <View style={{ gap: 6 }}>
                  <SectionLabel>{L('Cách diễn đạt khác', 'Alternative phrasing')}</SectionLabel>
                  {card.altPhrasing.map((pair) => (
                    <Text key={`${pair.from}-${pair.to}`} className="font-nun" style={{ color: INK, fontSize: 15, lineHeight: 22 }}>
                      {`${pair.from} → ${pair.to}`}
                    </Text>
                  ))}
                </View>
                <View style={{ gap: 10 }}>
                  <SectionLabel>{L('Hướng trả lời khác', 'Alternative storylines')}</SectionLabel>
                  {card.altDirections.map((direction) => (
                    <View key={direction.titleVi} style={{ gap: 4, borderRadius: 12, backgroundColor: '#FBFAFF', padding: 12 }}>
                      <Text className="font-semi" style={{ color: INK, fontSize: 15 }}>
                        {direction.titleVi}
                      </Text>
                      <Text className="font-nun" style={{ color: MUTED, fontSize: 14, lineHeight: 20 }}>
                        {direction.outlineVi}
                      </Text>
                      <Text className="font-nun" style={{ color: INK, fontSize: 14, lineHeight: 21 }}>
                        {direction.openerEn}
                      </Text>
                    </View>
                  ))}
                </View>
              </Disclosure>
            ))
          ) : (
            empty
          )
        ) : null}

        {part === 3 ? (
          part3Topics.length ? (
            part3Topics.map((topic) => (
              <Disclosure
                key={topic.id}
                icon={speakingIconFor(topic.topic, topic.topicVi)}
                title={`${topic.no}. ${topic.topicVi}`}
                subtitle={`${topic.topic} · ${topic.questions.length} ${L('câu', 'questions')}`}
              >
                <View style={{ gap: 6 }}>
                  <SectionLabel>{L('Ý triển khai', 'Ideas')}</SectionLabel>
                  <Bullets items={topic.ideasVi} />
                </View>
                <View style={{ gap: 10 }}>{topic.questions.map(renderQuestion)}</View>
              </Disclosure>
            ))
          ) : (
            empty
          )
        ) : null}
      </View>
      </NeonWindow>
      </Appear>
    </Screen>
  );
}
