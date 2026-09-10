import React from 'react';
import { Text, View } from 'react-native';

import { PassageText } from './PassageText';
import type { MockItem } from '@/services/sat-rw/mock/item';

/**
 * Phần "đọc" của một câu R&W: đoạn văn, ghi chú, bảng số.
 *
 * MỘT CHỖ VẼ CHO PHÒNG THI VÀ CHO MÀN XEM LẠI. Hai chỗ ấy hiện cùng một câu ở
 * hai thời điểm — lúc làm và lúc xem lại — nên khác nhau một chút là người học
 * phải đối chiếu hai bố cục để tìm lại chỗ mình đã đọc. Ba thứ này lúc trước nằm
 * riêng trong `RwRunner`, và màn xem lại thì chưa có gì để mà lệch; giờ có rồi.
 */
export function ItemBody({ item }: { item: MockItem }) {
  return (
    <View>
      <PassageText passage={item.passage} underline={item.underline} tone="paper" />
      {item.notes ? <NotesList notes={item.notes} /> : null}
      {item.table ? <EvidenceTable table={item.table} /> : null}
    </View>
  );
}

/** Danh sách ghi chú của câu Rhetorical Synthesis. */
function NotesList({ notes }: { notes: readonly string[] }) {
  return (
    <View className="mt-3 rounded-panel border border-brand-soft bg-brand-tint px-3.5 py-3">
      {notes.map((n) => (
        <View key={n} className="flex-row gap-2.5">
          <Text className="font-sans text-body text-brand">•</Text>
          <Text className="flex-1 font-sans text-body text-paper-body" style={{ lineHeight: 23 }}>
            {n}
          </Text>
        </View>
      ))}
    </View>
  );
}

/**
 * Bảng số của câu Command of Evidence.
 *
 * Cột số căn PHẢI, cột tên căn trái: mắt so hàng số bằng cách đọc dọc, mà số căn
 * trái thì hàng đơn vị không thẳng nhau nên phải đọc từng con một.
 */
function EvidenceTable({ table }: { table: NonNullable<MockItem['table']> }) {
  return (
    <View className="mt-3">
      <Text className="font-semi text-label text-paper-muted">{table.caption}</Text>
      <View className="mt-2 overflow-hidden rounded-panel border border-brand-soft">
        <View className="flex-row bg-brand-tint">
          <Cell text={table.entityHeader} header flex={2} />
          {table.columns.map((c) => (
            <Cell key={c} text={c} header flex={1} align="right" />
          ))}
        </View>
        {table.rows.map((row) => (
          <View key={row.entity} className="flex-row border-t border-brand-soft">
            <Cell text={row.entity} flex={2} />
            {row.values.map((v, i) => (
              <Cell key={`${row.entity}-${i}`} text={String(v)} flex={1} align="right" />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

function Cell({
  text,
  header,
  flex,
  align = 'left',
}: {
  text: string;
  header?: boolean;
  flex: number;
  align?: 'left' | 'right';
}) {
  return (
    <View style={{ flex }} className="px-3.5 py-2">
      <Text
        className={`${
          header ? 'font-semi text-label text-paper-muted' : 'font-sans text-body text-paper-ink'
        } ${
          align === 'right' ? 'text-right' : ''
        }`}
        style={align === 'right' ? { fontVariant: ['tabular-nums'] } : undefined}
      >
        {text}
      </Text>
    </View>
  );
}
