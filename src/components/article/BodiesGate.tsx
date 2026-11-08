import React from 'react';
import { Text } from 'react-native';

import { Screen } from '@/components/layout/Screen';
import type { ArticleMeta } from '@/data/article-repository';
import { useBodiesReady } from '@/data/use-chunk-version';
import { useL } from '@/i18n/useL';

/**
 * Chờ toàn văn các bài đã cho tải xong trước khi dựng màn hình con. Dùng cho màn
 * quét cả kho (sinh câu, bộ đề): trên web toàn văn tải lười, nên quét sớm sẽ ra bộ
 * câu thiếu rồi đổi khi tải xong.
 */
export function BodiesGate({
  metas,
  children,
}: {
  metas: ReadonlyArray<Pick<ArticleMeta, 'chunk'>>;
  children: React.ReactNode;
}) {
  const ready = useBodiesReady(metas);
  const { L } = useL();
  if (!ready) {
    return (
      <Screen>
        <Text className="mt-10 text-center font-sans text-body text-muted">
          {L('Đang tải bộ bài…', 'Loading passages…')}
        </Text>
      </Screen>
    );
  }
  return <>{children}</>;
}
