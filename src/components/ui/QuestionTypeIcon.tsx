import React from 'react';
import { View } from 'react-native';

import { AssetImage } from './AssetImage';
import { IconCircle, type IconTone } from './IconCircle';
import type { IconName } from './Icon';
import { assetKeys, useAssetUrl } from '@/services/assets/useAssets';
import type { QuestionType } from '@/types/database';

/** Icon vector dự phòng khi tài nguyên sinh bằng AI chưa có. */
const FALLBACK_ICON: Record<QuestionType, IconName> = {
  true_false_not_given: 'check',
  yes_no_not_given: 'chat',
  matching_headings: 'list',
  matching_information: 'search',
  multiple_choice: 'grid',
  sentence_completion: 'pencil',
  summary_completion: 'note',
  short_answer: 'info',
};

const TONE_BY_TYPE: Record<QuestionType, IconTone> = {
  true_false_not_given: 'success',
  yes_no_not_given: 'info',
  matching_headings: 'primary',
  matching_information: 'accent',
  multiple_choice: 'warning',
  sentence_completion: 'accent',
  summary_completion: 'primary',
  short_answer: 'info',
};

/**
 * Icon dạng câu hỏi: ưu tiên icon sinh bằng AI trong Supabase Storage,
 * chưa có thì dùng icon vector nội bộ nên UI không bao giờ trống.
 */
export function QuestionTypeIcon({
  type,
  size = 38,
  tone,
}: {
  type: QuestionType;
  size?: number;
  tone?: IconTone;
}) {
  const url = useAssetUrl(assetKeys.questionIcon(type));
  const resolvedTone = tone ?? TONE_BY_TYPE[type];

  if (!url) return <IconCircle name={FALLBACK_ICON[type]} tone={resolvedTone} size={size} />;

  return (
    <View
      className="items-center justify-center overflow-hidden rounded-pill bg-surfaceAlt"
      style={{ width: size, height: size }}
    >
      <AssetImage
        assetKey={assetKeys.questionIcon(type)}
        width={size}
        height={size}
        contentFit="contain"
        radius={0}
      />
    </View>
  );
}
