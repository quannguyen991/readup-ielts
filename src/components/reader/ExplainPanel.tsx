import React, { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Icon } from '@/components/ui';
import { color } from '@/theme/tokens';

/**
 * Giải chi tiết MỘT câu, do AI viết, mở cho gói trả phí.
 *
 * VÌ SAO KHOÁ SAU GÓI. Mỗi lần bấm là một lời gọi model thật, và một lượt xem
 * lại 13 câu có thể là 13 lời gọi. Đây là chỗ tốn nhất trong cả app, nên nó là
 * chỗ hợp lý để đặt ranh giới — chứ không phải khoá nội dung đề, vốn sẽ biến
 * gói Free thành bản dùng thử.
 *
 * Bản Free vẫn thấy ĐÁP ÁN ĐÚNG và lời giải sẵn có của bộ đề. Thứ trả phí mua
 * thêm là lời giải viết riêng cho lượt làm của họ, có nhắc chỗ họ đã lệch.
 *
 * KHÔNG GỌI SẴN. Chỉ gọi khi người học bấm — bày sẵn lời giải ngay dưới mỗi câu
 * là mời họ đọc thay vì nghĩ, và đốt hạn mức cho những câu họ vốn đã làm đúng.
 */

export function ExplainPanel({
  paid,
  fetchExplanation,
}: {
  paid: boolean;
  fetchExplanation: () => Promise<string>;
}) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'failed'>('idle');
  const [text, setText] = useState('');

  if (!paid) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/upgrade' as never)}
        className="mt-3 flex-row items-center gap-2 rounded-panel border border-border bg-surfaceAlt px-3 py-2.5"
      >
        <Icon name="lock" size={14} color={color.muted} />
        <Text className="flex-1 font-sans text-label text-muted">
          Giải chi tiết từng bước cho đúng lượt làm của bạn — có ở gói trả phí.
        </Text>
        <Text className="font-semi text-label text-primary-700">Xem gói</Text>
      </Pressable>
    );
  }

  if (state === 'idle' || state === 'failed') {
    return (
      <View className="mt-3">
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setState('loading');
            fetchExplanation()
              .then((t) => {
                setText(t);
                setState('done');
              })
              .catch((err: unknown) => {
                // Nói ra lỗi thật: người học cần biết nên bấm lại hay nên thôi.
                setText(err instanceof Error ? err.message : 'Lỗi không xác định');
                setState('failed');
              });
          }}
          className="flex-row items-center gap-2 self-start rounded-panel border border-primary-200 bg-primary-50 px-3 py-2"
        >
          <Icon name="sparkle" size={14} color={color.primary} />
          <Text className="font-semi text-label text-primary-700">
            {state === 'failed' ? 'Thử lại' : 'Giải chi tiết bằng AI'}
          </Text>
        </Pressable>
        {state === 'failed' ? (
          <Text className="mt-1.5 font-sans text-label text-danger">{text}</Text>
        ) : null}
      </View>
    );
  }

  if (state === 'loading') {
    return (
      <View className="mt-3 flex-row items-center gap-2">
        <ActivityIndicator size="small" color={color.primary} />
        <Text className="font-sans text-label text-muted">Đang giải…</Text>
      </View>
    );
  }

  return (
    <View className="mt-3 rounded-panel border border-primary-200 bg-primary-50 p-3.5">
      <View className="flex-row items-center gap-2">
        <Icon name="sparkle" size={14} color={color.primary} />
        <Text className="font-heavy text-label text-primary-700" style={{ letterSpacing: 0.6 }}>
          GIẢI CHI TIẾT
        </Text>
      </View>

      {/*
        Mỗi bước một dòng, nhãn của bước in đậm.

        Prompt bắt model trả về đúng bốn dòng có nhãn, nên tách ở đây bằng dấu
        hai chấm đầu dòng là đủ — không cần bộ dựng markdown cho một cấu trúc mà
        chính ta đã ra đề.
      */}
      <View className="mt-2 gap-1.5">
        {text
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean)
          .map((line, i) => {
            const at = line.indexOf(':');
            const label = at > 0 && at <= 20 ? line.slice(0, at) : null;
            return (
              <Text key={i} className="font-sans text-body text-ink" style={{ lineHeight: 21 }}>
                {label ? (
                  <Text className="font-heavy text-primary-700">{label}: </Text>
                ) : null}
                {label ? line.slice(at + 1).trim() : line}
              </Text>
            );
          })}
      </View>
    </View>
  );
}
