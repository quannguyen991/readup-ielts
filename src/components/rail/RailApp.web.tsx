import React, { Suspense } from 'react';
import { ActivityIndicator, View } from 'react-native';

/** Bản web: nạp trang chuyến bay (bộ vẽ canvas + nhạc Web Audio) bằng import() động. */
const RailPage = React.lazy(() => import('./RailPage'));

export function RailApp() {
  return (
    <Suspense
      fallback={
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#17151F' }}>
          <ActivityIndicator color="#E8A87C" />
        </View>
      }
    >
      <RailPage />
    </Suspense>
  );
}
