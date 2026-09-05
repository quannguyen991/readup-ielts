import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Icon } from '@/components/ui';
import { useT } from '@/i18n/useT';
import type { MessageKey } from '@/i18n/keys';
import {
  summarise,
  type CheckMethod,
  type VerificationReceipt,
} from '@/services/ai/verification';
import { color, paper } from '@/theme/tokens';

/**
 * "AI nói gì, app đã kiểm được đến đâu."
 *
 * ĐÂY LÀ MỘT PHẦN DẠY HỌC, không phải một khối thông tin kỹ thuật. Người học lớn
 * lên cùng AI cần một thói quen: gặp một khẳng định thì hỏi "kiểm bằng gì". Bảng
 * này tập đúng thói quen ấy trên chính bài của họ — nơi mà "AI bịa một dẫn chứng"
 * không còn là chuyện nghe kể, mà là dòng chữ đang nằm trước mặt.
 *
 * MẶC ĐỊNH THU GỌN. Người vừa nộp bài muốn xem điểm và lỗi trước; nhét cả bảng
 * kiểm chứng vào giữa dòng chảy đó là bắt họ đọc thứ chưa cần. Nhưng nhãn thu gọn
 * PHẢI mang con số — thấy "1 dẫn chứng bị loại" mới có lý do để mở ra.
 *
 * DÒNG "MÁY KHÔNG KIỂM ĐƯỢC" HIỂN THỊ KHÁC HẲN các dòng còn lại: không dấu tích,
 * màu trung tính, và nằm cuối. Cho nó cùng một hình dáng với các dòng đã kiểm sẽ
 * biến cả bảng thành giấy chứng nhận — đúng cái hiểu sai mà nó sinh ra để chống.
 */
/** Cách kiểm → khoá từ điển. Nhãn nằm trong `src/i18n`, không nằm rải trong mã. */
const METHOD_KEY: Record<CheckMethod, MessageKey> = {
  'quote-match': 'method.quoteMatch',
  computed: 'method.computed',
  'cross-check': 'method.crossCheck',
  unverifiable: 'method.unverifiable',
};

export function VerificationReceiptPanel({ receipt }: { receipt: VerificationReceipt }) {
  const [open, setOpen] = useState(false);
  const { t } = useT();
  const { checked, rejected } = summarise(receipt);

  return (
    <View className="mt-4 overflow-hidden rounded-panel border border-paper-line bg-white">
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((v) => !v)}
        className="flex-row items-center gap-2.5 px-3.5 py-3"
      >
        <Icon name="lock" size={16} color={paper.brandMid} strokeWidth={2} />
        <View className="min-w-0 flex-1">
          <Text className="font-strong text-body text-paper-ink">{t('verify.title')}</Text>
          <Text className="mt-0.5 font-sans text-label text-paper-muted">
            {rejected > 0
              ? t('verify.summary', { checked, rejected })
              : t('verify.summaryClean', { checked })}
          </Text>
        </View>
        <Icon
          name={open ? 'chevron-down' : 'chevron-right'}
          size={16}
          color={paper.muted}
          strokeWidth={2}
        />
      </Pressable>

      {open ? (
        <View className="border-t border-paper-line px-3.5 py-3">
          {receipt.items.map((item) => (
            <Row key={item.label} item={item} methodLabel={t(METHOD_KEY[item.method])} />
          ))}

          {receipt.model ? (
            <Text className="mt-3 font-sans text-label text-paper-muted">
              {t('verify.modelNote', { model: receipt.model })}
            </Text>
          ) : null}

          <View className="mt-3 rounded-panel bg-paper-canvas p-3">
            <Text className="font-strong text-label text-paper-ink">{t('verify.howToCheckTitle')}</Text>
            <Text className="mt-1 font-sans text-label text-paper-body" style={{ lineHeight: 19 }}>
              {t('verify.howToCheckBody')}
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

function Row({
  item,
  methodLabel,
}: {
  item: { label: string; method: CheckMethod; checked: number | null; rejected: number | null; noteVi: string };
  methodLabel: string;
}) {
  const unverifiable = item.method === 'unverifiable';
  const failed = (item.rejected ?? 0) > 0;

  const tone = unverifiable ? paper.muted : failed ? color.warning : color.success;
  const icon = unverifiable ? 'info' : failed ? 'info' : 'check';

  return (
    <View className="flex-row gap-2.5 py-2">
      <View className="pt-0.5">
        <Icon name={icon} size={15} color={tone} strokeWidth={2.2} />
      </View>
      <View className="min-w-0 flex-1">
        <View className="flex-row flex-wrap items-center gap-x-2 gap-y-0.5">
          <Text className="font-strong text-label text-paper-ink">{item.label}</Text>
          <View
            className="rounded-pill px-2 py-0.5"
            style={{ backgroundColor: unverifiable ? paper.brandTint : `${tone}22` }}
          >
            <Text className="font-semi" style={{ fontSize: 9, color: unverifiable ? paper.body : tone }}>
              {methodLabel}
            </Text>
          </View>
        </View>
        <Text className="mt-0.5 font-sans text-label text-paper-body" style={{ lineHeight: 19 }}>
          {item.noteVi}
        </Text>
      </View>
    </View>
  );
}
