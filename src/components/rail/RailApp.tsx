import React from 'react';
import { Text, View } from 'react-native';

import { useL } from '@/i18n/useL';

/** Bản iOS/Android: cảnh bay vẽ bằng canvas của trình duyệt — chỉ có trên web. */
export function RailApp() {
  const { L } = useL();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <Text>{L('Chuyến bay từ vựng hiện chỉ có trên bản web.', 'Vocab Flight is only available on the web for now.')}</Text>
    </View>
  );
}
