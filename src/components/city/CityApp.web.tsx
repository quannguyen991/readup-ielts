import React, { Suspense } from 'react';
import { ActivityIndicator, View } from 'react-native';

/**
 * Bản web: nạp phần 3D (three + @react-three/fiber + drei) bằng import() động —
 * chỉ tải khi người học thật sự mở thành phố trên máy tính.
 */
const CityGame = React.lazy(() => import('./CityGame'));

export function CityApp() {
  return (
    <Suspense
      fallback={
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#CFE8F7' }}>
          <ActivityIndicator color="#6A4BD9" />
        </View>
      }
    >
      <CityGame />
    </Suspense>
  );
}
