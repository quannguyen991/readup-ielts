import React from "react";
import { Text, View } from "react-native";

import { GREEN } from "./StudyKit";
import { Appear } from "@/components/motion/Motion";
import { Icon } from "@/components/ui/Icon";
import {
  MISTAKE_ADVICE,
  summarizeMistakes,
  type Mistake,
} from "@/services/vocab/mistake";

/*
  Hai khối hiển thị phân tích lỗi, dùng chung cho màn Học và màn Điền vào câu:
  hộp "vì sao sai" dưới mỗi câu, và phần tổng kết cuối vòng.
*/

/** Hộp "vì sao sai" ngay dưới câu hỏi. */
export function MistakeBox({ m }: { m: Mistake }) {
  return (
    <Appear>
      <View
        className="mt-5 flex-row gap-3 rounded-2xl p-4"
        style={{
          backgroundColor: "#FFFBEB",
          borderWidth: 1,
          borderColor: "#FDE68A",
        }}
      >
        <Icon name="sparkle" size={18} color="#B45309" />
        <View className="flex-1">
          <Text className="font-strong text-body" style={{ color: "#92400E" }}>
            Phân tích lỗi · {m.title}
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
  if (mistakes.length === 0) {
    return (
      <Text className="mt-4 font-semi text-bodyLg" style={{ color: GREEN }}>
        Không sai câu nào trong vòng này.
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
        backgroundColor: "#F8FAFC",
        borderWidth: 1,
        borderColor: "#E2E8F0",
      }}
    >
      <Text className="font-strong text-cardTitle text-ink">
        Phân tích vòng học
      </Text>
      <View className="mt-3 flex-row flex-wrap gap-2">
        {kinds.map((k) => (
          <View
            key={k.kind}
            className="rounded-pill px-3 py-1.5"
            style={{
              backgroundColor: k.kind === top.kind ? "#FEF3C7" : "#EEF2F7",
            }}
          >
            <Text className="font-semi text-label text-ink">
              {k.title} × {k.count}
            </Text>
          </View>
        ))}
      </View>
      <Text className="mt-3 font-sans text-body text-ink">
        <Text className="font-strong">
          Lỗi hay gặp nhất: {top.title.toLowerCase()}.
        </Text>{" "}
        {MISTAKE_ADVICE[top.kind]}
      </Text>
      <Text className="mt-3 font-sans text-body text-muted">
        Từ còn yếu ({weak.length}):{" "}
        <Text className="font-semi text-ink">{weak.join(", ")}</Text>. Vòng sau
        sẽ hỏi những từ này trước.
      </Text>
    </View>
  );
}
