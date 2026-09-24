import React from 'react';
import { Pressable, Text, View } from 'react-native';

/**
 * Phân trang có số.
 *
 * Dùng thay cho nút "Xem thêm". Nút xem thêm nối bài vào cuối danh sách mãi
 * mãi: cuộn tới bài thứ 60 rồi mở một bài, quay lại là mất sạch vị trí. Trang
 * có số thì quay lại vẫn đúng trang.
 *
 * Chỉ in tối đa 5 số quanh trang đang mở — kho có hơn 150 trang, in hết ra thì
 * hàng phân trang dài hơn cả lưới thẻ phía trên nó.
 */
export function Pagination({
  page,
  pageCount,
  onChange,
  className = 'mt-5',
}: {
  page: number;
  pageCount: number;
  onChange: (next: number) => void;
  className?: string;
}) {
  if (pageCount <= 1) return null;

  const start = Math.max(0, Math.min(page - 2, pageCount - 5));
  const numbers = Array.from({ length: Math.min(5, pageCount) }, (_, i) => start + i);

  return (
    <View className={`flex-row flex-wrap items-center justify-center gap-1.5 ${className}`}>
      <PageButton label="Trước" disabled={page === 0} onPress={() => onChange(page - 1)} />

      {numbers.map((n) => (
        <Pressable
          key={n}
          accessibilityRole="button"
          accessibilityLabel={`Trang ${n + 1}`}
          aria-selected={n === page}
          onPress={() => onChange(n)}
          className={[
            'h-9 min-w-[36px] items-center justify-center rounded-md border px-2',
            n === page ? 'border-primary-600 bg-primary-600' : 'border-border bg-surface',
          ].join(' ')}
        >
          <Text
            className={['font-semi text-label', n === page ? 'text-white' : 'text-muted'].join(' ')}
          >
            {n + 1}
          </Text>
        </Pressable>
      ))}

      <PageButton
        label="Sau"
        disabled={page >= pageCount - 1}
        onPress={() => onChange(page + 1)}
      />

      <Text className="ml-2 font-sans text-label text-subtle">
        Trang {page + 1} / {pageCount}
      </Text>
    </View>
  );
}

function PageButton({
  label,
  disabled,
  onPress,
}: {
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      className={[
        'h-9 items-center justify-center rounded-md border border-border bg-surface px-3',
        disabled ? 'opacity-40' : '',
      ].join(' ')}
    >
      <Text className="font-semi text-label text-muted">{label}</Text>
    </Pressable>
  );
}
