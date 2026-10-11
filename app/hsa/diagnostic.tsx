import React from 'react';
import { HsaRunner } from '@/components/hsa/HsaRunner';
import { HSA_DIAGNOSTIC } from '@/data/hsa';
import { useL } from '@/i18n/useL';

export default function HsaDiagnosticScreen() {
  const { L } = useL();
  return <HsaRunner title={L('HSA · Chẩn đoán nhanh', 'HSA · Quick diagnostic')} questions={HSA_DIAGNOSTIC} activity="diagnostic:20" durationSeconds={24 * 60} />;
}
