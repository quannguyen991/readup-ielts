import React, { useMemo, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Speech from 'expo-speech';

import { TaskShell } from '@/components/layout/TaskShell';
import { Badge, Button, Icon, PaperCard } from '@/components/ui';
import {
  getBilingualArticleById,
  type BilingualGloss,
  type BilingualParagraph,
  type BilingualQuestion,
  type BilingualVocab,
} from '@/data/bilingual-repository';
import { splitByGloss } from '@/services/reading/gloss-split';
import { color, paper } from '@/theme/tokens';

/**
 * Màn đọc song ngữ Anh–Việt.
 *
 * GHÉP THEO TỪNG ĐOẠN, KHÔNG PHẢI HAI CỘT CUỘN RỜI NHAU. Cách hay gặp là đặt
 * hai khung cuộn độc lập cạnh nhau; đọc được vài đoạn là hai bên lệch nhau vì
 * bản dịch dài ngắn khác bản gốc, rồi người đọc phải tự dò xem đoạn này ứng với
 * đoạn nào. Ở đây mỗi đoạn là MỘT HÀNG có hai ô, nên hai bản luôn thẳng hàng
 * dù bản dịch dài hơn bao nhiêu.
 *
 * Màn hẹp thì hai ô xếp dọc: bản tiếng Anh trước, bản dịch ngay dưới nó.
 *
 * Nút "Ẩn bản dịch" có lý do sư phạm chứ không phải để trang trí: đọc song ngữ
 * mà lúc nào bản dịch cũng nằm sẵn trong tầm mắt thì mắt sẽ liếc sang trước khi
 * kịp đoán nghĩa, và bài đọc biến thành bài đọc tiếng Việt. Ẩn đi, đọc hết một
 * đoạn, rồi mới mở ra đối chiếu.
 */

/**
 * Mặt chữ CHỈ ÁP CHO PHẦN TIẾNG ANH.
 *
 * Georgia và các font có chân của hệ thống không dựng được dấu tiếng Việt: chữ
 * "phố" hiện ra thành "phô ́" vì dấu sắc rời khỏi nguyên âm. Bản tiếng Việt vì
 * vậy luôn dùng Plus Jakarta Sans — bộ chữ của app, có đủ ký tự tiếng Việt.
 * Đây không phải hạn chế đáng tiếc: hai cột hai mặt chữ khác nhau còn giúp mắt
 * biết ngay mình đang ở cột nào.
 */
const FONTS = [
  { key: 'sans', label: 'Jakarta', family: 'PlusJakartaSans_400Regular' },
  { key: 'serif', label: 'Có chân', family: Platform.select({ web: 'Georgia, serif', default: 'serif' }) },
] as const;

const SIZES = [15, 17, 19, 21] as const;

export default function BilingualReaderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const article = typeof id === 'string' ? getBilingualArticleById(id) : undefined;

  const [fontKey, setFontKey] = useState<(typeof FONTS)[number]['key']>('serif');
  const [fontSize, setFontSize] = useState<number>(17);
  const [showVi, setShowVi] = useState(true);
  const [openGloss, setOpenGloss] = useState<BilingualGloss | null>(null);

  if (!article) {
    return (
      <TaskShell
        backHref="/bilingual"
        backLabel="Về kho song ngữ"
        title="Không tìm thấy bài này"
        icon="book"
      >
        <PaperCard className="max-w-[520px]">
          <Text className="font-sans text-body text-paper-body">
            Bài bạn vừa mở không có trong kho. Quay lại danh sách để chọn bài khác.
          </Text>
          <Button
            className="mt-4"
            variant="brand"
            label="Về kho song ngữ"
            onPress={() => router.replace('/bilingual' as never)}
          />
        </PaperCard>
      </TaskShell>
    );
  }

  const fontFamily = FONTS.find((f) => f.key === fontKey)?.family;

  return (
    <TaskShell
      backHref="/bilingual"
      backLabel="Về kho song ngữ"
      title="Đọc song ngữ"
      subtitle={`Bài ${article.order} · ${article.level} · ${article.topic}`}
      icon="book"
      right={
        <View className="rounded-pill bg-white/20 px-3.5 py-1.5">
          <Text className="font-strong text-label text-white">
            {article.wordCount} từ · {article.estMinutes} phút
          </Text>
        </View>
      }
    >
      {/* ------------------------------------------------------- thanh chữ */}
      <PaperCard padded={false} className="mb-4">
        <View className="flex-row flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5">
          <View className="flex-row items-center gap-1.5">
            <Text className="font-semi uppercase tracking-wide text-paper-muted" style={{ fontSize: 9 }}>
              Font
            </Text>
            {FONTS.map((f) => (
              <Pressable
                key={f.key}
                accessibilityRole="button"
                accessibilityState={{ selected: fontKey === f.key }}
                onPress={() => setFontKey(f.key)}
                className="rounded-md px-2 py-1"
                style={{ backgroundColor: fontKey === f.key ? paper.brandMid : 'transparent' }}
              >
                <Text
                  className="text-label"
                  style={{ fontFamily: f.family, color: fontKey === f.key ? '#FFFFFF' : paper.muted }}
                >
                  {f.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <View className="flex-row items-center gap-1.5">
            <Text className="font-semi uppercase tracking-wide text-paper-muted" style={{ fontSize: 9 }}>
              Cỡ chữ
            </Text>
            {SIZES.map((s) => (
              <Pressable
                key={s}
                accessibilityRole="button"
                accessibilityState={{ selected: fontSize === s }}
                onPress={() => setFontSize(s)}
                className="rounded-md px-2 py-1"
                style={{ backgroundColor: fontSize === s ? paper.brandMid : 'transparent' }}
              >
                <Text
                  className="font-semi text-label"
                  style={{ color: fontSize === s ? '#FFFFFF' : paper.muted }}
                >
                  {s}
                </Text>
              </Pressable>
            ))}
          </View>

          <View className="flex-1" />

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: showVi }}
            onPress={() => setShowVi((v) => !v)}
            className="flex-row items-center gap-1.5 rounded-pill border border-brand-soft px-3 py-1.5"
            style={{ backgroundColor: showVi ? '#FFFFFF' : paper.brandTint }}
          >
            <Icon name={showVi ? 'close' : 'languages'} size={14} color={paper.body} strokeWidth={2} />
            <Text className="font-semi text-label text-paper-body">
              {showVi ? 'Ẩn bản dịch' : 'Hiện bản dịch'}
            </Text>
          </Pressable>
        </View>
      </PaperCard>

      {/* --------------------------------------------------------- tiêu đề */}
      <View className={showVi ? 'gap-4 lg:flex-row' : ''}>
        <PaperCard className={showVi ? 'lg:flex-1' : ''}>
          <Text className="font-semi uppercase tracking-wide text-paper-muted" style={{ fontSize: 10 }}>
            English
          </Text>
          <Text className="mt-1.5 font-heavy text-pageTitle text-paper-ink" style={{ fontFamily }}>
            {article.titleEn}
          </Text>
          <Text
            className="mt-2 font-mid text-paper-body"
            style={{ fontFamily, fontSize: fontSize + 1, lineHeight: (fontSize + 1) * 1.6 }}
          >
            {article.standfirstEn}
          </Text>
        </PaperCard>

        {showVi ? (
          <PaperCard className="lg:flex-1">
            <Text className="font-semi uppercase tracking-wide text-paper-muted" style={{ fontSize: 10 }}>
              Tiếng Việt
            </Text>
            <Text
              className="mt-1.5 font-heavy text-pageTitle text-paper-ink"
            >
              {article.titleVi}
            </Text>
            <Text
              className="mt-2 font-mid text-paper-body"
              style={{ fontSize: fontSize + 1, lineHeight: (fontSize + 1) * 1.6 }}
            >
              {article.standfirstVi}
            </Text>
          </PaperCard>
        ) : null}
      </View>

      {/* ---------------------------------------------------- từng đoạn một */}
      <View className="mt-4 gap-4">
        {article.paragraphs.map((paragraph, index) => (
          <ParagraphRow
            key={index}
            index={index}
            paragraph={paragraph}
            showVi={showVi}
            fontFamily={fontFamily}
            fontSize={fontSize}
          />
        ))}
      </View>

      <VocabPanel vocab={article.vocab} />
      <QuestionPanel questions={article.questions} />

      <View className="mt-5 flex-row flex-wrap gap-2">
        <Button
          variant="onDarkSolid"
          label="Về kho song ngữ"
          iconLeft="arrow-right"
          onPress={() => router.push('/bilingual' as never)}
        />
      </View>
    </TaskShell>
  );
}

function ParagraphRow({
  index,
  paragraph,
  showVi,
  fontFamily,
  fontSize,
}: {
  index: number;
  paragraph: BilingualParagraph;
  showVi: boolean;
  fontFamily: string | undefined;
  fontSize: number;
}) {
  /*
    Nghĩa của từ mở ra NGAY TRONG ĐOẠN vừa bấm, nên state nằm ở đây chứ không ở
    màn hình cha. Để ở cha thì thẻ nghĩa chỉ có một chỗ đứng duy nhất — cuối
    danh sách đoạn — và bấm một từ ở đoạn đầu sẽ mở ra thứ nằm ngoài tầm mắt.
  */
  const [openGloss, setOpenGloss] = useState<BilingualGloss | null>(null);

  const segments = useMemo(
    () => splitByGloss(paragraph.en, paragraph.gloss),
    [paragraph.en, paragraph.gloss],
  );

  const lineHeight = fontSize * 1.75;

  return (
    <View className={showVi ? 'gap-4 lg:flex-row' : ''}>
      <View className={showVi ? 'lg:flex-1' : ''}>
        <PaperCard>
          <Text className="mb-2 font-strong text-label text-paper-muted">{index + 1}</Text>
          <Text style={{ fontFamily, fontSize, lineHeight, color: paper.ink }}>
            {segments.map((segment, i) =>
              segment.gloss ? (
                <Text
                  key={i}
                  onPress={() =>
                    setOpenGloss((current) =>
                      current?.word === segment.gloss?.word ? null : segment.gloss,
                    )
                  }
                  style={{
                    color: paper.brandMid,
                    textDecorationLine: 'underline',
                    textDecorationStyle: 'dotted',
                  }}
                >
                  {segment.text}
                </Text>
              ) : (
                <Text key={i}>{segment.text}</Text>
              ),
            )}
          </Text>
        </PaperCard>

        {openGloss ? <GlossSheet gloss={openGloss} onClose={() => setOpenGloss(null)} /> : null}
      </View>

      {showVi ? (
        <PaperCard className="lg:flex-1">
          <Text className="mb-2 font-strong text-label text-paper-muted">{index + 1}</Text>
          <Text style={{ fontSize, lineHeight, color: paper.body }}>{paragraph.vi}</Text>
        </PaperCard>
      ) : null}
    </View>
  );
}

/** Thẻ nghĩa hiện ra khi bấm vào một từ được gạch chân. */
function GlossSheet({ gloss, onClose }: { gloss: BilingualGloss; onClose: () => void }) {
  return (
    <View className="mt-4 flex-row items-start gap-3 rounded-card border-2 bg-white p-4" style={{ borderColor: paper.brandMid }}>
      <View className="h-9 w-9 items-center justify-center rounded-pill" style={{ backgroundColor: paper.brandMid }}>
        <Icon name="letters" size={17} color="#FFFFFF" strokeWidth={2} />
      </View>
      <View className="min-w-0 flex-1">
        <View className="flex-row flex-wrap items-baseline gap-2">
          <Text className="font-heavy text-sectionTitle text-paper-ink">{gloss.word}</Text>
          <Text className="font-sans text-label text-paper-muted">{gloss.ipa}</Text>
          <Badge label={gloss.pos} tone="neutral" />
        </View>
        <Text className="mt-1 font-mid text-bodyLg text-paper-body">{gloss.meaningVi}</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Đóng nghĩa từ"
        onPress={onClose}
        className="h-8 w-8 items-center justify-center rounded-pill bg-brand-tint"
      >
        <Icon name="close" size={15} color={paper.body} strokeWidth={2} />
      </Pressable>
    </View>
  );
}

function VocabPanel({ vocab }: { vocab: BilingualVocab[] }) {
  const [open, setOpen] = useState(false);
  if (vocab.length === 0) return null;

  return (
    <PaperCard className="mt-5">
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((v) => !v)}
        className="flex-row items-center gap-2"
      >
        <Icon name={open ? 'chevron-down' : 'chevron-right'} size={17} color={paper.brandMid} strokeWidth={2} />
        <Text className="font-heavy text-cardTitle text-paper-ink">
          Từ vựng cuối bài · {vocab.length} từ
        </Text>
      </Pressable>

      {open ? (
        <View className="mt-3 gap-3">
          {vocab.map((entry, i) => (
            <View key={i} className="rounded-panel border border-brand-soft p-3">
              <View className="flex-row flex-wrap items-baseline gap-2">
                <Text className="font-strong text-bodyLg text-paper-ink">{entry.word}</Text>
                <Text className="font-sans text-label text-paper-muted">{entry.ipa}</Text>
                <Badge label={entry.pos} tone="neutral" />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Nghe đọc từ ${entry.word}`}
                  onPress={() => {
                    Speech.stop();
                    Speech.speak(entry.word, { language: 'en-US', rate: 0.9 });
                  }}
                >
                  <Icon name="volume" size={15} color={paper.brandMid} strokeWidth={2} />
                </Pressable>
              </View>
              <Text className="mt-1 font-mid text-body text-paper-body">{entry.meaningVi}</Text>
              {entry.collocation ? (
                <Text className="mt-1 font-sans text-label text-paper-muted">
                  Đi với: {entry.collocation}
                </Text>
              ) : null}
              {entry.example ? (
                <Text
                  className="mt-1 font-sans text-label text-paper-muted"
                  style={{ fontStyle: 'italic' }}
                >
                  {entry.example}
                </Text>
              ) : null}
              {entry.derivatives ? (
                <Text className="mt-1 font-sans text-label text-paper-muted">
                  Họ từ: {entry.derivatives}
                </Text>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}
    </PaperCard>
  );
}

function QuestionPanel({ questions }: { questions: BilingualQuestion[] }) {
  const [picked, setPicked] = useState<Record<number, number>>({});
  if (questions.length === 0) return null;

  return (
    <PaperCard className="mt-4">
      <Text className="font-heavy text-cardTitle text-paper-ink">
        Câu hỏi hiểu bài · {questions.length} câu
      </Text>
      <Text className="mt-1 font-sans text-label text-paper-muted">
        Chọn một phương án để xem vì sao đúng hoặc sai.
      </Text>

      <View className="mt-4 gap-4">
        {questions.map((question, qi) => {
          const chosen = picked[qi];
          const answered = chosen !== undefined;

          return (
            <View key={qi} className="rounded-panel border border-brand-soft p-3.5">
              <View className="flex-row flex-wrap items-center gap-2">
                <Text className="font-strong text-label text-paper-muted">Câu {qi + 1}</Text>
                {question.type ? <Badge label={question.type} tone="neutral" /> : null}
              </View>
              <Text className="mt-1.5 font-mid text-bodyLg text-paper-ink">{question.q}</Text>

              <View className="mt-2.5 gap-1.5">
                {question.options.map((option, oi) => {
                  const isAnswer = oi === question.answerIndex;
                  const isChosen = chosen === oi;
                  const tone = !answered
                    ? { border: paper.brandSoft, bg: '#FFFFFF' }
                    : isAnswer
                      ? { border: color.success, bg: color.successSoft }
                      : isChosen
                        ? { border: color.danger, bg: color.dangerSoft }
                        : { border: paper.brandSoft, bg: '#FFFFFF' };

                  return (
                    <Pressable
                      key={oi}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isChosen }}
                      onPress={() => setPicked((prev) => ({ ...prev, [qi]: oi }))}
                      className="flex-row items-start gap-2.5 rounded-md border px-3 py-2.5"
                      style={{ borderColor: tone.border, backgroundColor: tone.bg }}
                    >
                      <Text className="font-strong text-body text-paper-muted">
                        {'ABCD'[oi]}
                      </Text>
                      <Text className="min-w-0 flex-1 font-sans text-body text-paper-ink">
                        {option}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {answered && question.whyVi ? (
                <View className="mt-2.5 rounded-md bg-brand-tint p-3">
                  <Text className="font-sans text-body text-paper-body">{question.whyVi}</Text>
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
    </PaperCard>
  );
}
