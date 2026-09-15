import React, { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { TaskShell } from '@/components/layout/TaskShell';
import { VocabRunner } from '@/components/vocab/VocabRunner';
import { Badge, Button, Icon, PaperCard } from '@/components/ui';
import {
  VOCAB_MODES,
  entriesForMode,
  modeAvailability,
  type VocabModeId,
} from '@/services/vocab/modes';
import { useVocabStore } from '@/store/useVocabStore';
import { paper } from '@/theme/tokens';
import { PageTransition } from '@/components/motion/Motion';

/**
 * Cửa vào luyện từ vựng: chọn chế độ, rồi chạy.
 *
 * SÁU CHẾ ĐỘ CÙNG MỘT SỔ TỪ, không phải sáu kho riêng. Từ nào cũng vào được
 * mọi chế độ mà nó đủ liệu — và đúng chỗ ấy là lý do màn này tồn tại: một từ
 * nhìn thấy sáu kiểu thì nhớ chắc hơn nhiều so với nhìn sáu mươi lần cùng một
 * kiểu.
 *
 * MỖI THẺ HIỆN SỐ TỪ DÙNG ĐƯỢC, và mờ đi khi bằng 0. Một nút mờ không kèm lý
 * do thì người dùng tưởng app hỏng; "còn 0 từ có câu gốc" thì họ biết phải làm
 * gì để mở nó.
 *
 * NÓI RÕ MÁY CHẤM HAY TỰ CHẤM ngay trên thẻ. Hai thứ khác hẳn nhau về việc
 * buổi ôn ấy đáng tin tới đâu, và người học phải biết TRƯỚC khi bấm — biết sau
 * là đã mất mười lăm phút cho một thứ không phải cái họ tưởng.
 */
export default function VocabPracticeScreen() {
  const { mode: modeParam } = useLocalSearchParams<{ mode?: string }>();
  const entriesMap = useVocabStore((s) => s.entries);
  const entries = useMemo(() => Object.values(entriesMap), [entriesMap]);
  const counts = useMemo(() => modeAvailability(entries), [entries]);

  const [active, setActive] = useState<VocabModeId | null>(
    VOCAB_MODES.some((m) => m.id === modeParam) ? (modeParam as VocabModeId) : null,
  );

  if (active) {
    return (
      <PageTransition routeKey={`runner-${active}`}>
        <VocabRunner mode={active} onExit={() => setActive(null)} />
      </PageTransition>
    );
  }

  if (entries.length === 0) {
    return (
      <TaskShell
        backHref="/vocabulary"
        backLabel="Về sổ từ"
        title="Luyện từ vựng"
        subtitle="Chưa có từ nào để luyện"
        icon="letters"
      >
        {/*
          Trạng thái rỗng phải CHO MỘT ĐƯỜNG ĐI, không chỉ giải thích vì sao
          trống — cùng nguyên tắc đã áp ở màn sổ từ.
        */}
        <PaperCard className="max-w-[560px]">
          <Text className="font-strong text-cardTitle text-paper-ink">Sổ từ đang trống</Text>
          <Text className="mt-1.5 font-sans text-body text-paper-body" style={{ lineHeight: 22 }}>
            Từ được lưu khi bạn bấm vào một từ lạ trong lúc đọc bài — kèm luôn nguyên câu gặp nó.
            Câu ấy chính là thứ năm trong sáu chế độ dưới đây cần tới.
          </Text>
          <Button
            className="mt-4 self-start"
            variant="brand"
            label="Mở kho bài đọc"
            iconRight="arrow-right"
            onPress={() => router.push('/library' as never)}
          />
        </PaperCard>
      </TaskShell>
    );
  }

  return (
    <PageTransition routeKey="picker">
    <TaskShell
      backHref="/vocabulary"
      backLabel="Về sổ từ"
      title="Luyện từ vựng"
      subtitle={`${entries.length} từ trong sổ · ${VOCAB_MODES.length} cách ôn`}
      icon="letters"
    >
      <View className="gap-3">
        {VOCAB_MODES.map((mode) => {
          const count = counts[mode.id];
          const ready = count > 0;
          return (
            <PaperCard key={mode.id}>
              <View className="flex-row items-start gap-3">
                <View
                  className="h-11 w-11 items-center justify-center rounded-panel"
                  style={{ backgroundColor: ready ? paper.brandSoft : '#EFEFF4' }}
                >
                  <Icon
                    name={mode.icon}
                    size={20}
                    color={ready ? paper.brandMid : paper.muted}
                    strokeWidth={1.9}
                  />
                </View>

                <View className="min-w-0 flex-1">
                  <View className="flex-row flex-wrap items-center gap-2">
                    <Text className="font-strong text-cardTitle text-paper-ink">{mode.label}</Text>
                    <Badge
                      label={mode.grading === 'auto' ? 'Máy chấm' : 'Tự chấm'}
                      tone={mode.grading === 'auto' ? 'success' : 'neutral'}
                      shape="tag"
                    />
                  </View>
                  <Text
                    className="mt-1.5 font-sans text-body text-paper-body"
                    style={{ lineHeight: 22 }}
                  >
                    {mode.blurb}
                  </Text>

                  <View className="mt-3 flex-row flex-wrap items-center gap-3">
                    <Button
                      variant="brand"
                      label={ready ? 'Bắt đầu' : 'Chưa đủ từ'}
                      iconRight={ready ? 'arrow-right' : undefined}
                      disabled={!ready}
                      onPress={() => setActive(mode.id)}
                    />
                    <Text className="font-sans text-label text-paper-muted">
                      {ready
                        ? `${count}/${entries.length} từ dùng được`
                        : 'Không từ nào trong sổ đủ dữ liệu cho cách này'}
                    </Text>
                  </View>
                </View>
              </View>
            </PaperCard>
          );
        })}
      </View>

      {/*
        Nói thẳng cái KHÔNG có, ở ngay cửa vào. Người học bấm vào "Dịch câu" rồi
        mới phát hiện app không chấm hộ sẽ thấy mình bị lừa; đọc trước thì đó là
        một lựa chọn có hiểu biết.
      */}
      <PaperCard className="mt-4">
        <Text className="font-strong text-body text-paper-ink">Vì sao hai chế độ dịch là tự chấm</Text>
        <Text className="mt-1.5 font-sans text-body text-paper-body" style={{ lineHeight: 22 }}>
          App lưu nghĩa tiếng Việt của TỪ, không lưu bản dịch của cả câu — nên không có gì để máy
          đối chiếu. So chuỗi thô thì mười bản dịch đúng sẽ bị báo sai chín. Muốn có chấm thật thì
          dùng phần Luyện dịch, ở đó mỗi câu có sẵn bản mẫu để đối chiếu.
        </Text>
        <Button
          className="mt-3 self-start"
          variant="outline"
          label="Sang Luyện dịch"
          onPress={() => router.push('/write/translation' as never)}
        />
      </PaperCard>
    </TaskShell>
    </PageTransition>
  );
}

/** Dùng ở nơi khác muốn biết chế độ nào còn từ — giữ export để không mất khi refactor. */
export const __practiceHelpers = { entriesForMode };
