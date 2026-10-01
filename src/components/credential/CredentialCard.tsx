import * as Clipboard from 'expo-clipboard';
import React, { useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import { Button, Card } from '@/components/ui';
import { buildCredential } from '@/services/credential/vc';
import type { Ledger } from '@/services/mastery/types';
import { useIdentityStore } from '@/store/useIdentityStore';
import { color } from '@/theme/tokens';

/**
 * Xuất sổ bằng chứng thành chứng chỉ ký số mà người học TỰ GIỮ.
 *
 * KHÁC GÌ NÚT XUẤT SẴN CÓ Ở TRÊN. Bản xuất cho giáo viên là JSON trần: ai mở ra
 * cũng sửa được một chữ rồi gửi đi, và không ai phát hiện. Bản này được ký bằng
 * khoá nằm trên máy người học, nên sửa một ký tự là chữ ký hỏng — và bất kỳ ai
 * cũng kiểm được điều đó bằng một lệnh, không cần Band 9 còn tồn tại.
 *
 * BỐN ĐIỀU PHẢI NÓI THẲNG TRÊN MẶT MÀN HÌNH, không giấu trong tài liệu:
 * chứng chỉ này TỰ CẤP; chữ ký chỉ chứng minh sổ không bị sửa; nó không chứng
 * minh người học không gian lận lúc làm bài; và mất khoá là mất, không khôi phục
 * được. Một tấm giấy trông như bằng cấp mà không nói bốn điều ấy là đúng loại
 * hiểu lầm mà cả cơ chế này sinh ra để chặn.
 */

const LIMITS: readonly string[] = [
  'Bạn tự cấp chứng chỉ này cho chính mình — không có tổ chức nào đứng sau nó.',
  'Chữ ký chứng minh sổ KHÔNG BỊ SỬA sau khi ký. Nó không chứng minh bạn không gian lận lúc làm bài.',
  'Khoá nằm trên máy này và không có bản sao. Mất máy là mất khoá, không khôi phục được.',
];

export function CredentialCard({ ledger }: { ledger: Ledger }) {
  const did = useIdentityStore((s) => s.did);
  const ensure = useIdentityStore((s) => s.ensure);
  const [json, setJson] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const issue = () => {
    const identity = ensure();
    const vc = buildCredential({ ledger, did: identity.did, privateKey: identity.privateKey });
    setJson(JSON.stringify(vc, null, 2));
    setCopied(false);
  };

  const copy = async () => {
    if (!json) return;
    await Clipboard.setStringAsync(json);
    setCopied(true);
  };

  const skillCount = Object.values(ledger).filter((r) => r.status !== 'unobserved').length;

  return (
    <Card>
      <Text className="font-sans text-h4 text-ink">Chứng chỉ năng lực bạn tự giữ</Text>
      <Text className="mt-1 font-sans text-body text-muted">
        Sổ bằng chứng ký thành một chứng chỉ chuẩn W3C. Khoá nằm trên máy bạn — không
        blockchain, không máy chủ, không cần mạng. Ai cũng kiểm được mà không cần tin Band 9.
      </Text>

      {skillCount === 0 ? (
        <Text className="mt-3 font-sans text-body text-subtle">
          Chưa có kỹ năng nào quan sát được, nên chưa có gì để chứng nhận. Làm vài bài có
          khoanh bằng chứng rồi quay lại.
        </Text>
      ) : (
        <>
          <View className="mt-3 flex-row items-center gap-3">
            <Button
              label={json ? 'Cấp lại' : `Cấp chứng chỉ (${skillCount} kỹ năng)`}
              onPress={issue}
            />
            {json ? (
              <Button variant="ghost" label={copied ? 'Đã chép' : 'Chép chứng chỉ'} onPress={copy} />
            ) : null}
          </View>

          {did ? (
            <Text className="mt-3 font-sans text-label text-muted" selectable>
              Danh tính của bạn: <Text style={{ color: color.ink }}>{did}</Text>
            </Text>
          ) : null}

          {json ? (
            <View className="mt-3">
              <Text className="font-sans text-label text-muted">
                Kiểm lại bằng một lệnh, không cần app:
              </Text>
              <Text
                selectable
                className="mt-1 font-sans text-label"
                style={{ color: color.ink, fontFamily: 'monospace' }}
              >
                npm run verify:credential -- chung-chi.json
              </Text>
              <TextInput
                value={json}
                editable={false}
                multiline
                numberOfLines={6}
                selectTextOnFocus
                className="mt-2 rounded-panel border border-border bg-surfaceAlt p-3 font-sans text-label text-body"
                style={{ minHeight: 120, fontFamily: 'monospace' }}
              />
            </View>
          ) : null}
        </>
      )}

      <View className="mt-4 rounded-panel border border-border p-3" style={{ backgroundColor: color.warningSoft }}>
        <Text className="font-sans text-label" style={{ color: color.ink, fontWeight: '700' }}>
          Chứng chỉ này KHÔNG nói gì về những điều sau
        </Text>
        {LIMITS.map((line) => (
          <Text key={line} className="mt-1 font-sans text-label" style={{ color: color.body }}>
            • {line}
          </Text>
        ))}
      </View>
    </Card>
  );
}
