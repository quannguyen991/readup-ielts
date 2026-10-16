import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { HubScreen } from '@/components/hub/HubScreen';
import { GLASS_CARD, HUB } from '@/components/hub/theme';
import { buildVoiceReport, type VoiceReport } from '@/services/hub/voice-report';

/**
 * Trợ lý cuộc họp (phần làm được): dán phần BẠN đã nói trong cuộc họp, nhập thời lượng
 * bạn nói, rồi xem báo cáo từ đệm, lặp từ và đa dạng từ. Chưa tách giọng nhiều người
 * và chưa ghi âm cuộc họp: làm vậy cần dịch vụ xử lý âm thanh riêng và sự đồng ý của
 * mọi người trong cuộc họp.
 */
export default function MeetingAssistant() {
  const [text, setText] = useState('');
  const [minutes, setMinutes] = useState('2');
  const [report, setReport] = useState<VoiceReport | null>(null);

  const analyse = () => {
    const mins = Math.max(0.1, Number(minutes) || 0);
    const clean = text.trim();
    if (!clean) return;
    // Không có độ tin cậy từ máy nghe khi dán chữ, nên chiều phát âm để null, các chiều khác vẫn đo.
    const segments = clean
      .split(/(?<=[.!?])\s+/)
      .filter(Boolean)
      .map((t) => ({ text: t, confidence: null }));
    setReport(
      buildVoiceReport({
        transcript: clean,
        segments,
        eventTimes: [],
        durationMs: mins * 60_000,
      }),
    );
  };

  return (
    <HubScreen title="Trợ lý cuộc họp" subtitle="Dán phần bạn đã nói trong cuộc họp để xem phản hồi" back>
      <View style={[GLASS_CARD, { padding: 16, gap: 10 }]}>
        <Text style={{ color: HUB.ink, fontSize: 14, fontWeight: '800' }}>Phần bạn đã nói</Text>
        <TextInput
          value={text}
          onChangeText={setText}
          multiline
          placeholder="Dán nguyên văn những gì bạn nói trong cuộc họp (chỉ phần của bạn)."
          placeholderTextColor={HUB.muted}
          style={{ minHeight: 140, borderRadius: 12, padding: 12, color: HUB.ink, backgroundColor: HUB.glassStrong, textAlignVertical: 'top' }}
        />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Text style={{ color: HUB.body, fontSize: 13 }}>Bạn nói khoảng</Text>
          <TextInput value={minutes} onChangeText={setMinutes} keyboardType="numeric" style={{ width: 60, height: 40, borderRadius: 10, textAlign: 'center', color: HUB.ink, backgroundColor: HUB.glassStrong }} />
          <Text style={{ color: HUB.body, fontSize: 13 }}>phút</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={analyse} style={{ height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: HUB.blue }}>
          <Text style={{ color: '#fff', fontWeight: '800' }}>Xem phản hồi</Text>
        </Pressable>
        <Text style={{ color: HUB.muted, fontSize: 11, lineHeight: 16 }}>
          Chưa tách giọng nhiều người và chưa ghi âm cuộc họp. Chỉ phân tích đoạn bạn tự dán.
        </Text>
      </View>

      {report ? (
        <View style={[GLASS_CARD, { padding: 16, gap: 8 }]}>
          <Text style={{ color: HUB.ink, fontSize: 15, fontWeight: '800' }}>Phản hồi</Text>
          <Text style={{ color: HUB.body, fontSize: 14, lineHeight: 21 }}>
            {`${report.wordCount} từ, khoảng ${report.wpm ?? '—'} từ/phút. Từ đệm: ${report.fillers.total}. Đa dạng từ: ${report.variety === null ? 'chưa đủ dữ liệu' : `${Math.round(report.variety * 100)}%`}.`}
          </Text>
          {report.repeated.length > 0 ? (
            <Text style={{ color: HUB.body, fontSize: 14 }}>Từ lặp nhiều: {report.repeated.map((r) => `${r.word} (${r.count})`).join(' · ')}</Text>
          ) : null}
          {report.fillers.total > 0 ? (
            <Text style={{ color: HUB.amber, fontSize: 13 }}>Thử thay từ đệm bằng một khoảng lặng ngắn: dừng một nhịp thay vì nói "uh" hay "like".</Text>
          ) : null}
          <Text style={{ color: HUB.muted, fontSize: 11 }}>Phản hồi chỉ dựa trên bản chữ bạn dán, không đánh giá ngữ pháp hay phát âm.</Text>
        </View>
      ) : null}
    </HubScreen>
  );
}
