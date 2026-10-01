import React, { Suspense } from 'react';
import { View } from 'react-native';

/** Bản web: khung 3D nạp bằng import() động — chỉ khi hiện trên máy tính. */
const CityPreviewCanvas = React.lazy(() => import('./preview/CityPreviewCanvas'));

export function CityPreview({ height, sample, hub }: { height: number; sample?: boolean; hub?: boolean }) {
  return (
    <Suspense fallback={<View style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, backgroundColor: 'rgba(125,211,252,0.12)' }} />}>
      <CityPreviewCanvas key={hub ? 'hub' : sample ? 'mau' : 'minh'} height={height} sample={sample} hub={hub} />
    </Suspense>
  );
}
