import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Icon } from '@/components/ui';
import { SAT_RW_SKILL_LABEL } from '@/data/sat-rw-repository';
import { hashString, mulberry32, shuffle } from '@/services/questions/rng';
import { color, paper } from '@/theme/tokens';

/**
 * "Câu này kiểm luật gì?" — hỏi sau khi chọn đáp án, trước khi hiện lời giải.
 *
 * VÌ SAO ĐÂY LÀ TRỤC THỨ HAI ĐÚNG CHO SAT VERBAL. Ở mảng Đọc, trục thứ hai là
 * "khoanh đoạn chứa đáp án". Câu ngữ pháp SAT không có đoạn nào để khoanh —
 * đoạn văn chỉ dài một hai câu và đáp án nằm ngay tại chỗ trống. Nhưng có một
 * thứ khác tách được đúng hai nhóm người học ấy: BIẾT LUẬT NÀO ĐANG BỊ HỎI.
 *
 * Chọn đúng phương án "nghe cho xuôi tai" là chuyện rất thường ở SAT, và nó chạy
 * được khá xa — cho tới lúc gặp câu mà tai đánh lừa. Người biết luật thì không
 * phụ thuộc vào chuyện ấy. Hai nhóm này cho ra cùng một đáp án đúng, nên không
 * hỏi thì không có cách nào phân biệt.
 *
 * Vì vậy trả lời ĐÚNG mà gọi SAI tên luật rơi vào `misaligned-correct` — đúng
 * cái ô mà một bảng điểm không bao giờ nhìn thấy.
 *
 * KHÔNG CHẤM ĐIỂM BƯỚC NÀY, cùng lý do với bước tự chẩn đoán ở Toán: gắn điểm
 * vào đây sẽ khiến người học chọn theo kiểu an toàn thay vì chọn theo điều họ
 * thật sự nghĩ, và thế là mất luôn thứ cần đo.
 */

/** Ba phương án — đủ để lựa chọn có nghĩa mà không thành một bài đọc hiểu riêng. */
const CHOICES = 3;

const ALL_SKILLS = Object.keys(SAT_RW_SKILL_LABEL);

export function RuleCheck({
  questionId,
  actualSkill,
  onPick,
}: {
  questionId: string;
  actualSkill: string;
  onPick: (picked: string, correct: boolean) => void;
}) {
  const [picked, setPicked] = useState<string | null>(null);

  /**
   * Ba phương án, gieo hạt theo id câu.
   *
   * Gieo hạt để mở lại đúng câu ấy vẫn thấy đúng ba phương án cũ — đổi mồi nhử
   * mỗi lần render sẽ khiến người học tưởng mình nhớ nhầm.
   */
  const options = useMemo(() => {
    const rng = mulberry32(hashString(`rule-${questionId}`));
    const decoys = shuffle(
      ALL_SKILLS.filter((s) => s !== actualSkill),
      rng,
    ).slice(0, CHOICES - 1);
    return shuffle([actualSkill, ...decoys], mulberry32(hashString(`rule-order-${questionId}`)));
  }, [questionId, actualSkill]);

  return (
    <View className="mt-3 rounded-panel border border-brand-soft bg-white p-3.5">
      <View className="flex-row items-center gap-2">
        <Icon name="target" size={16} color={paper.brandMid} strokeWidth={2.2} />
        <Text className="font-strong text-body text-paper-ink">Câu này kiểm luật gì?</Text>
      </View>
      <Text className="mt-1 font-sans text-label text-paper-muted">
        Chọn xong mới hiện lời giải. Chọn sai không bị trừ gì — app chỉ cần biết bạn chọn đáp án theo
        luật hay theo cảm giác.
      </Text>

      <View className="mt-3 gap-2">
        {options.map((skill) => {
          const isPicked = picked === skill;
          const isActual = skill === actualSkill;
          const answered = picked !== null;

          const tone = !answered
            ? { border: paper.brandSoft, bg: '#FFFFFF' }
            : isActual
              ? { border: color.success, bg: color.successSoft }
              : isPicked
                ? { border: color.warning, bg: color.warningSoft }
                : { border: paper.brandSoft, bg: '#FFFFFF' };

          return (
            <Pressable
              key={skill}
              accessibilityRole="button"
              aria-selected={isPicked} aria-disabled={answered}
              disabled={answered}
              onPress={() => {
                setPicked(skill);
                onPick(skill, skill === actualSkill);
              }}
              className="rounded-panel border px-3 py-2.5"
              style={{ borderColor: tone.border, backgroundColor: tone.bg }}
            >
              <Text className="font-sans text-label text-paper-ink">
                {SAT_RW_SKILL_LABEL[skill] ?? skill}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {picked ? (
        <View className="mt-3 flex-row items-start gap-2">
          <Icon
            name={picked === actualSkill ? 'check' : 'info'}
            size={15}
            color={picked === actualSkill ? color.success : color.warning}
            strokeWidth={2.2}
          />
          <Text className="min-w-0 flex-1 font-sans text-label text-paper-body" style={{ lineHeight: 19 }}>
            {picked === actualSkill
              ? 'Bạn gọi đúng tên luật. Chọn đáp án theo luật thì gặp câu mà tai đánh lừa vẫn chọn được.'
              : `Luật đang bị hỏi là “${SAT_RW_SKILL_LABEL[actualSkill] ?? actualSkill}”. Gọi sai tên luật nghĩa là lần này bạn chọn theo cảm giác — cách ấy chạy được khá xa, cho tới lúc gặp câu mà tai không giúp được.`}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
