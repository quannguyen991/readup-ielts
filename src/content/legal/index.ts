import { CONTACT } from '@/lib/contact';
import { TRACKERS, trackerNames } from '@/services/analytics/config';

import { privacyDoc } from './privacy';
import { refundDoc } from './refund';
import type { LegalContext, LegalDoc, LegalDocId } from './shared';
import { termsDoc } from './terms';

export * from './shared';

/** Cấu hình thật của bản đang chạy: kênh liên hệ và công cụ đo lường đã khai. */
export const LEGAL_CONTEXT: LegalContext = { contact: CONTACT, trackers: trackerNames(TRACKERS) };

export function buildLegalDoc(id: LegalDocId, ctx: LegalContext = LEGAL_CONTEXT): LegalDoc {
  switch (id) {
    case 'terms':
      return termsDoc(ctx);
    case 'privacy':
      return privacyDoc(ctx);
    case 'refund':
      return refundDoc(ctx);
  }
}
