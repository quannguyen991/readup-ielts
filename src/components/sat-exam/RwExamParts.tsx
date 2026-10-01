import React from 'react';
import { Text, View } from 'react-native';

import { EvidenceTable, NotesList } from '@/components/sat-rw/ItemBody';
import { ExamOption } from './ExamOption';
import { EXAM } from './exam-theme';
import { HighlightPassage } from './HighlightPassage';

/** Những trường R&W mà cả `SatRwQuestion` (bộ luyện) lẫn `MockItem` (bài thi) đều có. */
export type RwLike = {
  passage: string;
  underline?: string;
  notes?: readonly string[];
  table?: React.ComponentProps<typeof EvidenceTable>['table'];
  stem: string;
  options: readonly string[];
  /** Lý do ngắn vì sao từng phương án sai (chỉ bộ câu khó có), theo chỉ số phương án. */
  whyWrong?: readonly string[];
};

/** Cột trái: đoạn văn (tô / ghi chú được), ghi chú của đề, bảng số. */
export function RwPassagePane({ item }: { item: RwLike }) {
  return (
    <View>
      <HighlightPassage passage={item.passage} underline={item.underline} />
      {item.notes ? <NotesList notes={item.notes} /> : null}
      {item.table ? <EvidenceTable table={item.table} /> : null}
    </View>
  );
}

/**
 * Cột phải: câu hỏi và bốn phương án.
 *
 * `answerIndex` chỉ truyền khi đã chấm (đã bấm Kiểm tra) — lúc ấy dòng đúng tô
 * xanh, dòng chọn sai tô cam.
 */
export function RwQuestionPane({
  item,
  picked,
  onPick,
  locked,
  answerIndex,
  hidden = [],
}: {
  item: RwLike;
  picked: number | null;
  onPick: (i: number) => void;
  locked?: boolean;
  answerIndex?: number;
  hidden?: readonly number[];
}) {
  const revealed = answerIndex !== undefined;
  return (
    <View>
      <Text className="font-semi text-bodyLg" style={{ color: EXAM.ink, lineHeight: 27 }}>
        {item.stem}
      </Text>
      <View className="mt-4 gap-2.5">
        {item.options.map((option, i) => (
          <ExamOption
            key={i}
            index={i}
            selected={picked === i}
            state={!revealed ? 'idle' : i === answerIndex ? 'correct' : picked === i ? 'wrong' : 'idle'}
            disabled={locked}
            out={!revealed && hidden.includes(i) && i !== answerIndex}
            onPress={() => onPick(i)}
          >
            <Text className="font-sans text-body" style={{ color: EXAM.ink, lineHeight: 23 }}>
              {option}
            </Text>
          </ExamOption>
        ))}
      </View>
    </View>
  );
}
