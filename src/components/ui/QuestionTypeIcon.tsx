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
  matching_features: 'grid',
  matching_sentence_endings: 'list',
  multiple_choice: 'grid',
  sentence_completion: 'pencil',
  summary_completion: 'note',
  short_answer: 'info',
  sat_words_in_context: 'letters',
  sat_central_idea: 'target',
  sat_command_of_evidence: 'search',
  sat_inference: 'trending',
  sat_text_structure: 'list',
  sat_transitions: 'arrow-right',
  sat_rhetorical_synthesis: 'sparkle',
  sat_boundaries: 'more',
  sat_form_structure_sense: 'letters',
};

const TONE_BY_TYPE: Record<QuestionType, IconTone> = {
  true_false_not_given: 'success',
  yes_no_not_given: 'info',
  matching_headings: 'primary',
  matching_information: 'accent',
  matching_features: 'primary',
  matching_sentence_endings: 'accent',
  multiple_choice: 'warning',
  sentence_completion: 'accent',
  summary_completion: 'primary',
  short_answer: 'info',
  sat_words_in_context: 'accent',
  sat_central_idea: 'primary',
  sat_command_of_evidence: 'success',
  sat_inference: 'warning',
  sat_text_structure: 'info',
  sat_transitions: 'primary',
  sat_rhetorical_synthesis: 'accent',
  sat_boundaries: 'warning',
  sat_form_structure_sense: 'success',
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
