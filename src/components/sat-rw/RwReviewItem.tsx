import React from 'react';
import { SolutionBlocks } from './QuestionCard';
import { Text, View } from 'react-native';

import { ItemBody } from './ItemBody';
import { Icon } from '@/components/ui';
import { color } from '@/theme/tokens';
import type { MockItem } from '@/services/sat-rw/mock/item';
import { useL } from '@/i18n/useL';

/**
 * Một câu R&W đã lộ đáp án, dùng ở màn xem lại sau khi thi.
 *
 * BA TRẠNG THÁI, KHÔNG PHẢI HAI. Đúng · chọn sai · bỏ trống. Gộp "bỏ trống" vào
 * "sai" là xoá mất thông tin đắt nhất của một bài thi có đồng hồ: sai vì hiểu
 * nhầm thì phải học lại kiến thức, còn bỏ trống hàng loạt ở cuối module thì phải
 * học lại cách chia thời gian. Hai chứng bệnh khác nhau, hai cách chữa khác nhau.
 *
 * ĐÁP ÁN ĐÚNG LUÔN ĐƯỢC TÔ, kể cả khi người học làm đúng. Người làm đúng vì đoán
 * mò cũng cần thấy phương án nào đúng và vì sao — mà màn hình thì không phân biệt
 * được đoán với biết.
 */
export function RwReviewItem({ item, answer }: { item: MockItem; answer: number | null }) {
  const blank = answer === null;
  const { L } = useL();

  return (
    <View>
      <ItemBody item={item} />

      <Text className="mt-4 font-strong text-body text-paper-ink" style={{ lineHeight: 23 }}>
        {item.stem}
      </Text>

      <View className="mt-3 gap-2">
        {item.options.map((option, i) => (
          <OptionRow
            key={option}
            letter={'ABCD'[i]!}
            text={option}
            isAnswer={i === item.answerIndex}
            isPicked={answer === i}
          />
        ))}
      </View>

      {blank ? (
        <Text className="mt-2 font-sans text-label text-paper-muted">
          {L('Câu này bạn chưa chọn phương án nào.', 'You didn’t choose an option for this question.')}
        </Text>
      ) : null}

      {/*
        Lời giải mang tông `info`, không phải xám. Đây là thứ DUY NHẤT trên thẻ
        dạy được điều gì — điểm số thì đã xong rồi — nên nó phải là khối bắt mắt
        thứ hai sau dải trạng thái, chứ không phải khối chìm nhất.
      */}
      <View className="mt-3 flex-row gap-3 rounded-panel bg-info-soft px-4 py-3">
        <View style={{ paddingTop: 1 }}>
          <Icon name="sparkle" size={17} color={color.info} strokeWidth={2} />
        </View>
        <View className="min-w-0 flex-1">
          <Text className="font-strong text-label uppercase text-info-ink">{L('Vì sao', 'Why')}</Text>
          <SolutionBlocks question={item} picked={null} />
        </View>
      </View>
    </View>
  );
}

/**
 * Một phương án ở màn xem lại.
 *
 * Chọn đúng thì CHỈ một viền xanh, không vừa xanh vừa đỏ: dòng ấy vừa là đáp án
 * vừa là lựa chọn, và tô hai lớp lên cùng một dòng chỉ làm người ta phải đoán
 * lớp nào nói gì.
 */
function OptionRow({
  letter,
  text,
  isAnswer,
  isPicked,
}: {
  letter: string;
  text: string;
  isAnswer: boolean;
  isPicked: boolean;
}) {
  const wrongPick = isPicked && !isAnswer;
  const { L } = useL();

  const box = isAnswer
    ? 'border-success bg-success-soft'
    : wrongPick
      ? 'border-danger bg-danger-soft'
      : 'border-brand-soft bg-paper';

  const chip = isAnswer
    ? 'border-success bg-success'
    : wrongPick
      ? 'border-danger bg-danger'
      : 'border-brand-soft bg-paper';

  return (
    <View className={`flex-row items-start gap-3 rounded-panel border px-3.5 py-3 ${box}`}>
      <View className={`h-6 w-6 items-center justify-center rounded-pill border ${chip}`}>
        <Text
          className={`font-strong text-label ${
            isAnswer || wrongPick ? 'text-white' : 'text-paper-muted'
          }`}
        >
          {letter}
        </Text>
      </View>

      <Text className="flex-1 font-sans text-body text-paper-ink" style={{ lineHeight: 23 }}>
        {text}
      </Text>

      {/*
        Nhãn chữ chứ không chỉ có màu: "đáp án đúng" và "bạn chọn" là hai điều
        khác nhau, mà xanh–đỏ thì khoảng 8% nam giới không phân biệt được.
      */}
      {isAnswer ? (
        <View className="flex-row items-center gap-1.5">
          <Icon name="check" size={15} color={color.success} strokeWidth={2.4} />
          <Text className="font-strong text-label text-success-ink">
            {isPicked ? L('Bạn chọn · đúng', 'Your pick · correct') : L('Đáp án đúng', 'Correct answer')}
          </Text>
        </View>
      ) : wrongPick ? (
        <View className="flex-row items-center gap-1.5">
          <Icon name="close" size={15} color={color.danger} strokeWidth={2.4} />
          <Text className="font-strong text-label text-danger-ink">{L('Bạn chọn', 'Your pick')}</Text>
        </View>
      ) : null}
    </View>
  );
}
