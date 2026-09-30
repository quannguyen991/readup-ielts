import React from 'react';
import { Text, View } from 'react-native';

/** Bản iOS/Android: chuyến tàu vẽ bằng canvas của trình duyệt — chỉ có trên web. */
export function RailApp() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <Text>Chuyến tàu từ vựng hiện chỉ có trên bản web.</Text>
    </View>
  );
}
