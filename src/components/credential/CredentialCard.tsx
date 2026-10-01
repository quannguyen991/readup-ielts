import * as Clipboard from 'expo-clipboard';
import React, { useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import { Button, Card } from '@/components/ui';
import { buildCredential } from '@/services/credential/vc';
import type { Ledger } from '@/services/mastery/types';
import { useIdentityStore } from '@/store/useIdentityStore';
import { color } from '@/theme/tokens';
import { useL } from '@/i18n/useL';

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

const LIMITS: readonly { vi: string; en: string }[] = [
  { vi: 'Bạn tự cấp chứng chỉ này cho chính mình — không có tổ chức nào đứng sau nó.', en: 'You issue this credential to yourself — no organisation stands behind it.' },
  { vi: 'Chữ ký chứng minh sổ KHÔNG BỊ SỬA sau khi ký. Nó không chứng minh bạn không gian lận lúc làm bài.', en: "The signature proves the record was NOT CHANGED after signing. It doesn't prove you didn't cheat while doing the work." },
  { vi: 'Khoá nằm trên máy này và không có bản sao. Mất máy là mất khoá, không khôi phục được.', en: 'The key lives on this device with no backup. Lose the device and the key is gone for good.' },
];

export function CredentialCard({ ledger }: { ledger: Ledger }) {
  const { L } = useL();
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
      <Text className="font-sans text-h4 text-ink">{L('Chứng chỉ năng lực bạn tự giữ', 'A skills credential you hold yourself')}</Text>
      <Text className="mt-1 font-sans text-body text-muted">
        {L(
          'Sổ bằng chứng ký thành một chứng chỉ chuẩn W3C. Khoá nằm trên máy bạn — không blockchain, không máy chủ, không cần mạng. Ai cũng kiểm được mà không cần tin Band 9.',
          'Your evidence record, signed as a standard W3C credential. The key stays on your device — no blockchain, no server, no internet needed. Anyone can verify it without having to trust Band 9.',
        )}
      </Text>

      {skillCount === 0 ? (
        <Text className="mt-3 font-sans text-body text-subtle">
          {L(
            'Chưa có kỹ năng nào quan sát được, nên chưa có gì để chứng nhận. Làm vài bài có khoanh bằng chứng rồi quay lại.',
            'No skills observed yet, so there is nothing to certify. Do a few exercises where you mark your evidence, then come back.',
          )}
        </Text>
      ) : (
        <>
          <View className="mt-3 flex-row items-center gap-3">
            <Button
              label={json ? L('Cấp lại', 'Reissue') : L(`Cấp chứng chỉ (${skillCount} kỹ năng)`, `Issue credential (${skillCount} skills)`)}
              onPress={issue}
            />
            {json ? (
              <Button variant="ghost" label={copied ? L('Đã chép', 'Copied') : L('Chép chứng chỉ', 'Copy credential')} onPress={copy} />
            ) : null}
          </View>

          {did ? (
            <Text className="mt-3 font-sans text-label text-muted" selectable>
              {L('Danh tính của bạn:', 'Your identity:')} <Text style={{ color: color.ink }}>{did}</Text>
            </Text>
          ) : null}

          {json ? (
            <View className="mt-3">
              <Text className="font-sans text-label text-muted">
                {L('Kiểm lại bằng một lệnh, không cần app:', 'Verify with one command, no app needed:')}
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
          {L('Chứng chỉ này KHÔNG nói gì về những điều sau', 'What this credential does NOT tell you')}
        </Text>
        {LIMITS.map((line) => (
          <Text key={line.vi} className="mt-1 font-sans text-label" style={{ color: color.body }}>
            • {L(line.vi, line.en)}
          </Text>
        ))}
      </View>
    </Card>
  );
}
