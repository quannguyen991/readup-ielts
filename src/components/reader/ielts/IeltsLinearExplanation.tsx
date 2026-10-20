import React from 'react';
import { Switch, Text, View } from 'react-native';

import type { GeneratedQuestion } from '@/services/questions/types';
import { buildLinearExplanation } from '@/services/questions/linear-explanation';

type Props = {
  question: GeneratedQuestion;
  questionNumber: number;
  userAnswer?: string | null;
  isCorrect: boolean;
  paragraphs: string[];
  locateEvidence: boolean;
  onToggleLocateEvidence: (value: boolean) => void;
};

export function IeltsLinearExplanation({
  question,
  questionNumber,
  userAnswer,
  isCorrect,
  paragraphs,
  locateEvidence,
  onToggleLocateEvidence,
}: Props) {
  const expl = buildLinearExplanation(question, userAnswer, isCorrect, paragraphs);

  return (
    <View className="mt-4 pt-4 border-t border-gray-100 gap-3.5">
      {/* Top Header of Explanation */}
      <View className="flex-row items-center justify-between">
        <Text className="text-[13.5px] font-bold text-gray-800">
          Giải thích chi tiết theo Linear
        </Text>

        {/* Toggle Định vị đáp án */}
        <View className="flex-row items-center gap-2">
          <Text className="text-xs text-gray-600 font-medium">
            Định vị đáp án
          </Text>
          <Switch
            value={locateEvidence}
            onValueChange={onToggleLocateEvidence}
            trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
            thumbColor="#FFFFFF"
            style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
          />
        </View>
      </View>

      {/* Step 01: Simplify với Linearthinking */}
      <View className="rounded-xl border border-gray-200 bg-white p-4">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-[13.5px] font-bold text-[#E11D48]">
            Step 01: Simplify với Linearthinking
          </Text>
          <Text className="text-xs text-gray-400 font-medium">1/4</Text>
        </View>

        {/* Chips translation of prompt components (matching Screenshot 4) */}
        <View className="flex-row flex-wrap gap-3 mb-3">
          {expl.step1.chips.map((chip, idx) => (
            <View key={idx} className="items-start">
              {/* Top gray pill translation */}
              <View className="rounded-full bg-gray-100 border border-gray-200 px-2 py-0.5 mb-1">
                <Text className="text-[11px] text-gray-600 font-medium">{chip.vi}</Text>
              </View>
              {/* English text below */}
              <Text className="text-[13px] font-bold text-gray-800">{chip.en}</Text>
            </View>
          ))}
        </View>

        {/* Ý câu hỏi */}
        <Text className="text-[13px] text-gray-800 leading-relaxed">
          <Text className="font-bold text-gray-900">Ý câu hỏi: </Text>
          {expl.step1.intent}
        </Text>
      </View>

      {/* Step 02: Locate bằng chứng */}
      <View className="rounded-xl border border-gray-200 bg-white p-4">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-[13.5px] font-bold text-[#E11D48]">
            Step 02: Locate bằng chứng
          </Text>
          <Text className="text-xs text-gray-400 font-medium">2/4</Text>
        </View>

        <Text className="text-[13px] text-gray-700 leading-relaxed mb-3">
          {expl.step2.strategy}
        </Text>

        {/* Badge dẫn chứng: [Đoạn 1] No other parrot */}
        <View className="flex-row items-center gap-2">
          <View className="rounded-md border border-blue-300 bg-blue-50 px-2 py-0.5">
            <Text className="text-[11px] font-bold text-blue-600">
              Đoạn {expl.step2.paragraphIndex + 1}
            </Text>
          </View>
          <Text className="text-[13px] font-semibold text-gray-800 italic">
            "{expl.step2.evidenceQuote}"
          </Text>
        </View>
      </View>

      {/* Step 03: Đọc câu bằng chứng theo Linearthinking */}
      <View className="rounded-xl border border-gray-200 bg-white p-4">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-[13.5px] font-bold text-[#E11D48]">
            Step 03: Đọc câu bằng chứng theo Linearthinking
          </Text>
          <Text className="text-xs text-gray-400 font-medium">3/4</Text>
        </View>

        <View className="gap-2 text-[13px]">
          <Text className="text-[13px] text-gray-800 leading-relaxed">
            <Text className="font-bold text-gray-900">Phân tích: </Text>
            {expl.step3.analysis}
          </Text>

          <Text className="text-[13px] text-gray-800 leading-relaxed">
            <Text className="font-bold text-gray-900">Đối chiếu: </Text>
            {expl.step3.comparison}
          </Text>

          <View className="mt-1 pt-2 border-t border-gray-100 flex-row items-center gap-1.5">
            <Text className="text-[13px] font-bold text-emerald-700">
              ➔ {expl.step3.conclusion}
            </Text>
          </View>

          {expl.step3.trapNote ? (
            <View className="mt-2 rounded-lg bg-rose-50 border border-rose-200 p-2.5">
              <Text className="text-[12px] text-rose-800 leading-relaxed">
                {expl.step3.trapNote}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}
