import React from 'react';
import { HsaRunner } from '@/components/hsa/HsaRunner';
import { HSA_ADVANCED_SET } from '@/data/hsa-advanced';
import { useL } from '@/i18n/useL';

export default function HsaAdvancedScreen() {
  const { L } = useL();
  return <HsaRunner title={L('HSA · Thử thách tư duy nâng cao', 'HSA · Advanced reasoning challenge')} questions={HSA_ADVANCED_SET} activity="challenge:advanced-10" />;
}
