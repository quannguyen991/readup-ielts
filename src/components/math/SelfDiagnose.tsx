import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Icon } from '@/components/ui';
import { useT } from '@/i18n/useT';
import { MATH_ERROR_LABEL, type MathErrorTag } from '@/lib/math/types';
import { hashString, mulberry32, shuffle } from '@/services/questions/rng';
import { color } from '@/theme/tokens';

/**
 * "Bạn nghĩ mình sai ở đâu?" — hỏi TRƯỚC khi hiện lời giải.
 *
 * VÌ SAO BƯỚC NÀY TỒN TẠI. App đã biết người học sai lỗi gì: mỗi phương án nhiễu
 * được sinh ra bằng cách phá đúng MỘT luật có tên, nên chọn nhiễu nào là lộ ra
 * nhầm lẫn nào. Nhưng biết mà nói luôn thì người học chỉ đọc, gật, rồi quên.
 *
 * Bắt họ tự đoán trước biến một câu sai thành hai thông tin thay vì một:
 *
 *   · sai, mà tự gọi đúng tên lỗi   → biết mình hỏng ở đâu, chỉ cần luyện tay
 *   · sai, mà gọi sai tên lỗi       → chưa nhìn thấy chỗ hỏng; đọc lời giải xong
 *                                     vẫn sẽ lặp lại đúng lỗi ấy ở câu sau
 *
 * Hai ca đó cần hai cách can thiệp khác hẳn nhau, và không có bước này thì không
 * phân biệt được. Đây chính là trục thứ hai của sổ bằng chứng ở mảng Toán: nó
 * đóng vai trò mà "khoanh đoạn chứa đáp án" đóng ở mảng Đọc.
 *
 * KHÔNG CHẤM ĐIỂM BƯỚC NÀY. Đoán sai tên lỗi không bị trừ gì cả — nó chỉ được
 * ghi lại. Gắn điểm vào đây sẽ khiến người học chọn theo kiểu an toàn thay vì
 * chọn theo điều họ thật sự nghĩ, và thế là mất luôn thứ cần đo.
 */

/** Số phương án đưa ra. Ba là đủ để chọn có nghĩa mà không thành bài đọc hiểu. */
const CHOICES = 3;

export function SelfDiagnose({
  itemId,
  actualTag,
  allTags,
  onPick,
}: {
  itemId: string;
  /** Lỗi thật, suy ra từ phương án nhiễu người học đã chọn. */
  actualTag: MathErrorTag;
  /** Kho nhãn lỗi để bốc mồi nhử. */
  allTags: readonly MathErrorTag[];
  onPick: (picked: MathErrorTag, correct: boolean) => void;
}) {
  const [picked, setPicked] = useState<MathErrorTag | null>(null);
  const { t } = useT();

  /**
   * Ba phương án, gieo hạt theo id câu.
   *
   * Gieo hạt để mở lại đúng câu ấy vẫn thấy đúng ba phương án cũ — đổi mồi nhử
   * mỗi lần render sẽ khiến người học tưởng mình nhớ nhầm.
   */
  const options = useMemo(() => {
    const rng = mulberry32(hashString(`diagnose-${itemId}`));
    const decoys = shuffle(
      allTags.filter((t) => t !== actualTag),
      rng,
    ).slice(0, CHOICES - 1);
    return shuffle([actualTag, ...decoys], mulberry32(hashString(`order-${itemId}`)));
  }, [itemId, actualTag, allTags]);

  return (
    <View className="mt-3 rounded-panel border border-border bg-surface p-3.5">
      <View className="flex-row items-center gap-2">
        <Icon name="target" size={16} color={color.primary} strokeWidth={2.2} />
        <Text className="font-strong text-body text-ink">{t('diagnose.title')}</Text>
      </View>
      <Text className="mt-1 font-sans text-label text-muted">{t('diagnose.hint')}</Text>

      <View className="mt-3 gap-2">
        {options.map((tag) => {
          const isPicked = picked === tag;
          const isActual = tag === actualTag;
          const answered = picked !== null;

          const tone = !answered
            ? { border: color.border, bg: color.surface }
            : isActual
              ? { border: color.success, bg: color.successSoft }
              : isPicked
                ? { border: color.warning, bg: color.warningSoft }
                : { border: color.border, bg: color.surface };

          return (
            <Pressable
              key={tag}
              accessibilityRole="button"
              aria-selected={isPicked} aria-disabled={answered}
              disabled={answered}
              onPress={() => {
                setPicked(tag);
                onPick(tag, tag === actualTag);
              }}
              className="rounded-panel border px-3 py-2.5"
              style={{ borderColor: tone.border, backgroundColor: tone.bg }}
            >
              <Text className="font-sans text-label text-ink" style={{ lineHeight: 19 }}>
                {MATH_ERROR_LABEL[tag]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {picked ? (
        <View className="mt-3 flex-row items-start gap-2">
          <Icon
            name={picked === actualTag ? 'check' : 'info'}
            size={15}
            color={picked === actualTag ? color.success : color.warning}
            strokeWidth={2.2}
          />
          <Text className="min-w-0 flex-1 font-sans text-label text-muted" style={{ lineHeight: 19 }}>
            {t(picked === actualTag ? 'diagnose.rightTag' : 'diagnose.wrongTag')}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
