import React from 'react';
import { Linking, Pressable, Text, View } from 'react-native';

import { Icon } from '@/components/ui';
import { useL } from '@/i18n/useL';
import { readingFont } from '@/lib/readingFonts';
import { pronounce } from '@/services/audio/pronounce';
import { playSfx } from '@/services/audio/sfx-ui';
import { lemmatize } from '@/services/dictionary/lookup';
import { sceneHasSingleSource } from '@/services/history/gating';
import type { Claim, DisplayLang, Scene, Source } from '@/services/history/types';
import { useVocabStore } from '@/store/useVocabStore';

import { Card, Chip, H, SectionTitle, pickLang } from './ui';

/* ------------------------------------------------------------------ từ vựng */

/** Từ vựng của cảnh. Lưu vào Sổ từ qua đúng kho `useVocabStore` mà màn đọc song ngữ dùng. */
export function VocabCard({ scene }: { scene: Scene }) {
  const { L } = useL();
  const saveWord = useVocabStore((s) => s.saveWord);
  const entries = useVocabStore((s) => s.entries);
  const articleId = `history:${scene.id}`;
  if (scene.vocab.length === 0) return null;

  return (
    <Card>
      <SectionTitle hint={L('Bấm loa để nghe, bấm “Thêm vào từ mới” để đưa vào Sổ từ.', 'Tap the speaker to listen, “Add to my words” to save it.')}>
        {L('Từ vựng của cảnh', 'Scene vocabulary')}
      </SectionTitle>
      <View style={{ marginTop: 8 }}>
        {scene.vocab.map((v, i) => {
          const lemma = lemmatize(v.word);
          const saved = Object.values(entries).some((e) => e.lemma === lemma && e.articleId === articleId);
          return (
            <View key={v.word} style={{ paddingVertical: 12, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: H.rule, gap: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <Text style={{ fontFamily: readingFont.sansHeavy, fontSize: 19, color: H.ink }}>{v.word}</Text>
                <Text style={{ fontFamily: readingFont.mono, fontSize: 12, color: H.muted }}>{v.ipa}</Text>
                <Text style={{ fontFamily: readingFont.sansBold, fontSize: 12, color: H.accent }}>{v.pos}</Text>
                <View style={{ flex: 1 }} />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={L(`Nghe từ ${v.word}`, `Hear “${v.word}”`)}
                  onPress={() => void pronounce(v.word)}
                  style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Icon name="volume" size={18} color={H.muted} strokeWidth={2} />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  disabled={saved}
                  onPress={() => {
                    playSfx('select');
                    saveWord({
                      word: v.word,
                      lemma,
                      phonetic: v.ipa,
                      partOfSpeech: v.pos,
                      definitionContext: null,
                      definitionGeneral: null,
                      definitionVi: v.meaningVi,
                      exampleSentence: null,
                      sourceSentence: scene.paragraphs.find((p) => new RegExp(`\\b${v.word}`, 'i').test(p.en))?.en ?? v.word,
                      articleId,
                      articleTitle: scene.titleEn,
                      paragraphIndex: null,
                      isCollocation: v.word.includes(' '),
                    });
                  }}
                  style={{ minHeight: 44, borderRadius: 22, paddingHorizontal: 14, justifyContent: 'center', backgroundColor: saved ? H.tint : H.accent }}
                >
                  <Text style={{ fontFamily: readingFont.sansBold, fontSize: 13, color: saved ? H.muted : '#FFFFFF' }}>{saved ? L('✓ Đã lưu', '✓ Saved') : L('Thêm vào từ mới', 'Add to my words')}</Text>
                </Pressable>
              </View>
              <Text style={{ fontFamily: readingFont.sansSemi, fontSize: 15, color: H.body }}>{v.meaningVi}</Text>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

/* ----------------------------------------------------------------- câu hỏi */

/**
 * Nhiệm vụ hiểu nội dung: trắc nghiệm. Chọn đáp án là có kết quả ngay + lời giải chỉ ra ĐOẠN BẰNG CHỨNG (đoạn
 * được tô vàng trong bài). Không chặn bước nào — bỏ qua phần này vẫn đọc / nghe tiếp được.
 */
export function QuestionsCard({
  scene,
  lang,
  answers,
  onAnswer,
  onEvidence,
}: {
  scene: Scene;
  lang: DisplayLang;
  answers: Record<string, number>;
  onAnswer: (questionId: string, choice: number) => void;
  onEvidence: (paragraphId: string | null) => void;
}) {
  const { L } = useL();
  if (scene.questions.length === 0) return null;
  const done = scene.questions.filter((q) => answers[q.id] === q.answerIndex).length;
  return (
    <Card>
      <SectionTitle hint={L('Chọn một đáp án để xem lời giải và đoạn chứa bằng chứng. Không bắt buộc.', 'Pick an answer to see the explanation and the evidence paragraph. Optional.')}>
        {L('Bạn đã hiểu cảnh này chưa?', 'Did you follow this scene?')}
      </SectionTitle>
      <View style={{ marginTop: 12, gap: 22 }}>
        {scene.questions.map((q, qi) => {
          const chosen = answers[q.id];
          const answered = chosen !== undefined;
          return (
            <View key={q.id} style={{ gap: 8 }}>
              <Text style={{ fontFamily: readingFont.sansBold, fontSize: 12.5, color: H.accent }}>
                {L('Câu', 'Question')} {qi + 1}
              </Text>
              <Text style={{ fontFamily: readingFont.sansBold, fontSize: 16.5, lineHeight: 24, color: H.ink }}>{pickLang(lang, q.promptVi, q.promptEn)}</Text>
              {lang === 'both' ? <Text style={{ fontFamily: readingFont.literata, fontStyle: 'italic', fontSize: 15, color: H.muted }}>{q.promptEn}</Text> : null}
              <View accessibilityRole="radiogroup" style={{ gap: 6 }}>
                {q.options.map((o, oi) => {
                  const isChosen = chosen === oi;
                  const right = answered && oi === q.answerIndex;
                  const wrong = answered && isChosen && oi !== q.answerIndex;
                  return (
                    <Pressable
                      key={oi}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: isChosen }}
                      onPress={() => {
                        playSfx(oi === q.answerIndex ? 'success' : 'wrong');
                        onAnswer(q.id, oi);
                        onEvidence(q.evidenceParagraphId);
                      }}
                      style={{
                        minHeight: 48,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                        borderRadius: 14,
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        borderWidth: 1,
                        borderColor: right ? H.good : wrong ? H.bad : isChosen ? H.accent : H.rule,
                        backgroundColor: right ? H.goodBg : wrong ? H.badBg : isChosen ? H.tint : 'transparent',
                      }}
                    >
                      <Text style={{ fontFamily: readingFont.sansBold, fontSize: 14, color: H.muted }}>{'ABCDEF'[oi]}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: readingFont.sans, fontSize: 15, lineHeight: 22, color: H.body }}>{pickLang(lang, o.vi, o.en)}</Text>
                        {lang === 'both' ? <Text style={{ fontFamily: readingFont.sans, fontSize: 13, lineHeight: 18, color: H.muted }}>{o.en}</Text> : null}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
              {answered ? (
                <View style={{ gap: 6, backgroundColor: H.tint, borderRadius: 12, padding: 12 }}>
                  <Text style={{ fontFamily: readingFont.sansBold, fontSize: 14, color: chosen === q.answerIndex ? H.good : H.bad }}>
                    {chosen === q.answerIndex ? L('Đúng.', 'Correct.') : L('Chưa đúng.', 'Not quite.')}
                  </Text>
                  <Text style={{ fontFamily: readingFont.sans, fontSize: 14, lineHeight: 21, color: H.body }}>{pickLang(lang, q.explainVi, q.explainEn)}</Text>
                  {lang === 'both' ? <Text style={{ fontFamily: readingFont.sans, fontSize: 13, lineHeight: 19, color: H.muted }}>{q.explainEn}</Text> : null}
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                      onEvidence(q.evidenceParagraphId);
                      scrollToParagraph(q.evidenceParagraphId);
                    }}
                    style={{ minHeight: 44, justifyContent: 'center' }}
                  >
                    <Text style={{ fontFamily: readingFont.sansBold, fontSize: 13.5, color: H.accent }}>{L('Xem đoạn bằng chứng ↑', 'Show the evidence paragraph ↑')}</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
      {Object.keys(answers).length > 0 ? (
        <Text style={{ marginTop: 14, fontFamily: readingFont.sansSemi, fontSize: 13, color: H.muted }}>
          {L(`Đúng ${done}/${scene.questions.length} câu`, `${done}/${scene.questions.length} correct`)}
        </Text>
      ) : null}
    </Card>
  );
}

/** Cuộn tới một đoạn trong bài (web). Tôn trọng yêu cầu giảm chuyển động. */
export function scrollToParagraph(paragraphId: string): void {
  if (typeof document === 'undefined') return;
  const el = document.getElementById(`hp-${paragraphId}`);
  const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  el?.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
}

/* -------------------------------------------------------------------- nguồn */

const KIND_LABEL: Record<Source['kind'], { vi: string; en: string }> = {
  museum: { vi: 'Bảo tàng', en: 'Museum' },
  archive: { vi: 'Lưu trữ', en: 'Archive' },
  'primary-document': { vi: 'Văn kiện gốc', en: 'Primary document' },
  book: { vi: 'Sách', en: 'Book' },
  academic: { vi: 'Nghiên cứu', en: 'Academic' },
  government: { vi: 'Cơ quan nhà nước', en: 'Government' },
  encyclopedia: { vi: 'Bách khoa', en: 'Encyclopedia' },
  news: { vi: 'Báo chí', en: 'News' },
  other: { vi: 'Khác', en: 'Other' },
};

export function openLink(url: string): void {
  void Linking.openURL(url);
}

/** Nguồn của cảnh: tên, cơ quan, vị trí đoạn / trang, liên kết. Có khẳng định chỉ dựa một nguồn thì nói thẳng. */
export function SceneSources({ scene, sources, claims }: { scene: Scene; sources: Source[]; claims: ReadonlyMap<string, Claim> }) {
  const { L, en } = useL();
  const single = sceneHasSingleSource(scene, claims);
  if (sources.length === 0) return null;
  return (
    <Card>
      <SectionTitle>{L('Nguồn của cảnh này', 'Sources for this scene')}</SectionTitle>
      {single ? (
        <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: H.warnBg, borderRadius: 12, padding: 10 }}>
          <Chip label={L('Nguồn đơn', 'Single source')} tone="warn" />
          <Text style={{ flex: 1, fontFamily: readingFont.sans, fontSize: 13, lineHeight: 19, color: H.warn }}>
            {L('Có thông tin trong cảnh này mới được một nguồn đáng tin cậy xác nhận; chúng tôi không mở rộng kết luận ngoài nguồn đó.', 'Some details in this scene rest on one reliable source; we do not extend the conclusion beyond it.')}
          </Text>
        </View>
      ) : null}
      <View style={{ marginTop: 8 }}>
        {sources.map((s, i) => (
          <Pressable
            key={s.id}
            accessibilityRole="link"
            accessibilityLabel={`${s.title} — ${s.publisher}`}
            onPress={() => openLink(s.url)}
            style={{ paddingVertical: 12, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: H.rule, gap: 3, minHeight: 44 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
              <Text style={{ flex: 1, fontFamily: readingFont.sansBold, fontSize: 14.5, lineHeight: 20, color: H.ink }}>{s.title}</Text>
              <Icon name="external" size={14} color={H.accent} strokeWidth={2.2} />
            </View>
            <Text style={{ fontFamily: readingFont.sans, fontSize: 13, color: H.muted }}>
              {s.publisher} · {en ? KIND_LABEL[s.kind].en : KIND_LABEL[s.kind].vi}
              {s.locator ? ` · ${s.locator}` : ''}
            </Text>
          </Pressable>
        ))}
      </View>
    </Card>
  );
}
