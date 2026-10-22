import React, { Suspense } from 'react';
import { ActivityIndicator, View } from 'react-native';

/**
 * Gallery soát hình (dev): nạp three.js bằng import() động như thành phố. Bọc
 * trong `__DEV__` để bản production loại hẳn chunk này (Metro gập hằng số
 * trước khi gom phụ thuộc).
 */
const CityGallery = __DEV__ ? React.lazy(() => import('./gallery/CityGallery')) : null;

export function CityGalleryApp() {
  if (!CityGallery) return null;
  return (
    <Suspense
      fallback={
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#CFE8F7' }}>
          <ActivityIndicator color="#6A4BD9" />
        </View>
      }
    >
      <CityGallery />
    </Suspense>
  );
}
