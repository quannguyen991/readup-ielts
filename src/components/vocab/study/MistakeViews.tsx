import React from "react";
import { Text, View } from "react-native";

import { GREEN } from "./StudyKit";
import { useStudyTheme } from "./useStudyTheme";
import { Appear } from "@/components/motion/Motion";
import { Icon } from "@/components/ui/Icon";
import {
  MISTAKE_ADVICE,
  summarizeMistakes,
  type Mistake,
  type MistakeKind,
} from "@/services/vocab/mistake";
import { useL } from "@/i18n/useL";

/** Tên lỗi và lời khuyên bản tiếng Anh — dữ liệu gốc ở services/vocab/mistake giữ tiếng Việt. */
const MISTAKE_TITLE_EN: Record<MistakeKind, string> = {
  blank: "Left blank",
  other_word: "Mixed up with another word",
  inflection: "Wrong word form",
  double_letter: "Double consonant",
  suffix: "Wrong suffix",
  transposition: "Swapped letters",
  missing_letter: "Missing letter",
  extra_letter: "Extra letter",
  wrong_letter: "One wrong letter",
  spelling: "Spelling",
  unknown: "Word not learned yet",
};

const MISTAKE_ADVICE_EN: Record<MistakeKind, string> = {
  blank: "A guess beats a blank — type the first letter to jog your memory.",
  other_word: "You're mixing up similar words. Turn on the Vietnamese → English direction and read each word's example carefully to tell them apart.",
  inflection: "You know the word, just not the form. Check for plural subjects and the tense before filling in.",
  double_letter: "Double consonants are the most common spelling slip. Say each syllable slowly: ac-com-mo-date.",
  suffix: "Pairs like -ance/-ence and -able/-ible have to be learned word by word — there's no reliable rule.",
  transposition: "Slow your typing down a beat; this is usually a finger slip, not a memory gap.",
  missing_letter: "Spell the word out loud as you type so no letter gets dropped.",
  extra_letter: "Spell the word out loud as you type so no extra letter sneaks in.",
  wrong_letter: "Just one letter off — look at the tricky part of the word and type it two or three times.",
  spelling: "You know the meaning but not the spelling yet. Dictation mode trains exactly this.",
  unknown: "These words haven't stuck yet. Review them with Flashcards first, then move on to Fill in the word.",
};

/*
  Hai khối hiển thị phân tích lỗi, dùng chung cho màn Học và màn Điền vào câu:
  hộp "vì sao sai" dưới mỗi câu, và phần tổng kết cuối vòng.
*/

/** Hộp "vì sao sai" ngay dưới câu hỏi. */
export function MistakeBox({ m }: { m: Mistake }) {
  const { L, en } = useL();
  return (
    <Appear>
      <View
        className="mt-4 flex-row gap-2.5"
        style={{ borderLeftWidth: 3, borderLeftColor: "#D9A441", paddingLeft: 12 }}
      >
        <Icon name="sparkle" size={18} color="#6A4BD9" />
        <View className="flex-1">
          <Text className="font-strong text-body" style={{ color: "#6A4BD9" }}>
            {L("Phân tích lỗi", "Mistake check")} · {en ? MISTAKE_TITLE_EN[m.kind] : m.title}
          </Text>
          {m.detail ? (
            <Text className="mt-0.5 font-sans text-body text-ink">
              {m.detail}
            </Text>
          ) : null}
        </View>
      </View>
    </Appear>
  );
}

/**
 * Phân tích cuối vòng: kiểu lỗi nào nhiều nhất, lời khuyên cho đúng kiểu đó,
 * và những từ còn yếu (sai ít nhất một lần) — vòng sau sẽ ưu tiên chúng.
 */
export function RoundAnalysis({
  mistakes,
}: {
  mistakes: { word: string; m: Mistake }[];
}) {
  const { L, en } = useL();
  const t = useStudyTheme();
  if (mistakes.length === 0) {
    return (
      <Text className="mt-4 font-semi text-bodyLg" style={{ color: GREEN }}>
        {L("Không sai câu nào trong vòng này.", "No mistakes this round.")}
      </Text>
    );
  }
  const kinds = summarizeMistakes(mistakes.map((x) => x.m));
  const weak = [...new Set(mistakes.map((x) => x.word))];
  const top = kinds[0]!;
  return (
    <View
      className="mt-5 rounded-2xl p-5"
      style={{
        backgroundColor: t.field,
        borderWidth: 1,
        borderColor: t.fieldBorder,
      }}
    >
      <Text className="font-strong text-cardTitle" style={{ color: t.ink }}>
        {L("Phân tích vòng học", "Round review")}
      </Text>
      <View className="mt-3 flex-row flex-wrap gap-2">
        {kinds.map((k) => {
          const isTop = k.kind === top.kind;
          return (
            <View
              key={k.kind}
              className="rounded-pill px-3 py-1.5"
              style={{
                backgroundColor: isTop ? "#F3F0FB" : t.chipBg,
              }}
            >
              <Text className="font-semi text-label" style={{ color: isTop ? "#2B2350" : t.chipInk }}>
                {en ? MISTAKE_TITLE_EN[k.kind] : k.title} × {k.count}
              </Text>
            </View>
          );
        })}
      </View>
      <Text className="mt-3 font-sans text-body" style={{ color: t.ink }}>
        <Text className="font-strong">
          {L("Lỗi hay gặp nhất:", "Most common mistake:")} {(en ? MISTAKE_TITLE_EN[top.kind] : top.title).toLowerCase()}.
        </Text>{" "}
        {en ? MISTAKE_ADVICE_EN[top.kind] : MISTAKE_ADVICE[top.kind]}
      </Text>
      <Text className="mt-3 font-sans text-body" style={{ color: t.muted }}>
        {L("Từ còn yếu", "Weak words")} ({weak.length}):{" "}
        <Text className="font-semi" style={{ color: t.ink }}>{weak.join(", ")}</Text>
        {L(". Vòng sau sẽ hỏi những từ này trước.", ". Next round will ask these first.")}
      </Text>
    </View>
  );
}
