import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useL } from '@/i18n/useL';
import { readingFont } from '@/lib/readingFonts';
import { CLAIM_STATUS_LABEL, claimStatusCounts } from '@/services/history/gating';
import type { ClaimStatus, Scene, TopicBundle } from '@/services/history/types';

import { openLink } from './SceneExtras';
import { Card, Chip, H, SectionTitle } from './ui';

const TONE: Record<ClaimStatus, 'good' | 'warn' | 'bad' | 'plain'> = { verified: 'good', 'single-source': 'warn', disputed: 'bad', unverified: 'plain' };

/**
 * Panel "Nguồn & kiểm chứng" của cả chủ đề: mỗi khẳng định, trạng thái kiểm chứng THẬT (không tô hồng),
 * số nguồn độc lập và liên kết tới từng nguồn. Mặc định thu gọn, chỉ hiện tổng kết.
 */
export function VerificationPanel({ bundle, scenes }: { bundle: TopicBundle; scenes: Scene[] }) {
  const { L, en } = useL();
  const [open, setOpen] = useState(false);
  const ids = new Set(scenes.map((s) => s.id));
  const claims = bundle.claims.filter((c) => ids.has(c.sceneId));
  const counts = claimStatusCounts(claims);
  const srcById = new Map(bundle.sources.map((s) => [s.id, s]));
  if (claims.length === 0) return null;

  return (
    <Card id="history-verification">
      <Pressable accessibilityRole="button" aria-expanded={open} onPress={() => setOpen((o) => !o)} style={{ minHeight: 44, gap: 8 }}>
        <SectionTitle hint={L('Mỗi thông tin chính đều gắn với nguồn. Bấm để xem bảng đối chiếu.', 'Every key statement is tied to sources. Tap to see the cross-check table.')}>
          {L('Nguồn & kiểm chứng', 'Sources & verification')} {open ? '−' : '+'}
        </SectionTitle>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {(Object.keys(counts) as ClaimStatus[])
            .filter((k) => counts[k] > 0)
            .map((k) => (
              <Chip key={k} tone={TONE[k]} label={`${counts[k]} · ${en ? CLAIM_STATUS_LABEL[k].en : CLAIM_STATUS_LABEL[k].vi}`} />
            ))}
        </View>
      </Pressable>

      {open ? (
        <View style={{ marginTop: 12, gap: 18 }}>
          <Text style={{ fontFamily: readingFont.sans, fontSize: 13, lineHeight: 19, color: H.muted }}>
            {L(
              '“Đã đối chiếu” = ít nhất hai nguồn độc lập. “Nguồn đơn” = mới có một nguồn đáng tin cậy, chúng tôi không mở rộng kết luận. Hai trang chép cùng một bài chỉ tính một nguồn.',
              '“Cross-checked” = at least two independent sources. “Single source” = only one reliable source so far; we do not extend the conclusion. Two pages copying the same article count as one source.',
            )}
          </Text>
          {scenes.map((s) => {
            const rows = claims.filter((c) => c.sceneId === s.id);
            if (rows.length === 0) return null;
            return (
              <View key={s.id} style={{ gap: 8 }}>
                <Text style={{ fontFamily: readingFont.sansHeavy, fontSize: 15, color: H.ink }}>
                  {L('Cảnh', 'Scene')} {s.n} · {en ? s.titleEn : s.titleVi}
                </Text>
                {rows.map((c) => (
                  <View key={c.id} style={{ borderWidth: 1, borderColor: H.rule, borderRadius: 12, padding: 12, gap: 6 }}>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
                      <Text style={{ fontFamily: readingFont.mono, fontSize: 12, color: H.muted }}>{c.id}</Text>
                      <Chip tone={TONE[c.status]} label={en ? CLAIM_STATUS_LABEL[c.status].en : CLAIM_STATUS_LABEL[c.status].vi} />
                      <Text style={{ fontFamily: readingFont.sans, fontSize: 12.5, color: H.muted }}>
                        {L(`${c.independentSources} nguồn độc lập`, `${c.independentSources} independent source(s)`)}
                      </Text>
                    </View>
                    <Text style={{ fontFamily: readingFont.sans, fontSize: 14, lineHeight: 20, color: H.body }}>{en ? c.textEn : c.textVi}</Text>
                    {c.notes ? <Text style={{ fontFamily: readingFont.sans, fontSize: 12.5, lineHeight: 18, color: H.muted }}>{L('Ghi chú: ', 'Note: ')}{c.notes}</Text> : null}
                    {c.sources.map((cs) => {
                      const src = srcById.get(cs.sourceId);
                      if (!src) return null;
                      return (
                        <Pressable key={cs.sourceId} accessibilityRole="link" onPress={() => openLink(src.url)} style={{ minHeight: 36, justifyContent: 'center' }}>
                          <Text style={{ fontFamily: readingFont.sansSemi, fontSize: 13, color: H.accent }}>
                            {src.title} — {src.publisher} · {cs.locator} ↗
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                ))}
              </View>
            );
          })}
        </View>
      ) : null}
    </Card>
  );
}
