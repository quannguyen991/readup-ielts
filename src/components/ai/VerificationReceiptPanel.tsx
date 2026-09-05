import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Icon } from '@/components/ui';
import {
  METHOD_LABEL,
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
export function VerificationReceiptPanel({ receipt }: { receipt: VerificationReceipt }) {
  const [open, setOpen] = useState(false);
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
          <Text className="font-strong text-body text-paper-ink">AI nói gì, app kiểm được đến đâu</Text>
          <Text className="mt-0.5 font-sans text-label text-paper-muted">
            {checked} khẳng định đã đối chiếu
            {rejected > 0 ? ` · ${rejected} bị loại vì không đúng` : ' · không cái nào bị loại'}
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
            <Row key={item.label} item={item} />
          ))}

          {receipt.model ? (
            <Text className="mt-3 font-sans text-label text-paper-muted">
              Bài này do model <Text className="font-strong">{receipt.model}</Text> chấm. App không
              giấu tên model: biết ai nói thì mới truy được khi có gì đó sai.
            </Text>
          ) : null}

          <View className="mt-3 rounded-panel bg-paper-canvas p-3">
            <Text className="font-strong text-label text-paper-ink">Tự kiểm thế nào</Text>
            <Text className="mt-1 font-sans text-label text-paper-body" style={{ lineHeight: 19 }}>
              Với mọi nhận xét AI đưa ra, hỏi một câu: “dựa vào đâu trong bài của tôi?”. Nhận xét chỉ
              ra được đúng một đoạn chữ thì kiểm được; nhận xét nói chung chung thì không — và cái
              không kiểm được là cái cần đọc bằng con mắt nghi ngờ.
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

function Row({ item }: { item: { label: string; method: CheckMethod; checked: number | null; rejected: number | null; noteVi: string } }) {
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
              {METHOD_LABEL[item.method]}
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
