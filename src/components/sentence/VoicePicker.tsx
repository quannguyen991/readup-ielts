import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import * as Speech from 'expo-speech';

import { Icon } from '@/components/ui';
import { bestVoiceFor, type Gender } from '@/services/audio/voice-pick';
import { voiceGender } from '@/services/audio/voice';
import { useTopicStudyStore } from '@/store/useTopicStudyStore';
import { paper } from '@/theme/tokens';
import { useL } from '@/i18n/useL';

/**
 * Chọn giọng đọc cho phần nghe.
 *
 * VÌ SAO CẦN: `expo-speech` mặc định dùng giọng hệ thống, mà giọng mặc định
 * trên Windows và Android thường là giọng máy đọc rất khô — nghe chép chính tả
 * bằng giọng ấy thì cái khó nằm ở chỗ giọng dở, không phải ở chỗ bắt âm. Máy
 * nào cũng cài sẵn vài giọng tiếng Anh khác nhau; việc duy nhất cần làm là cho
 * người học đổi.
 *
 * CHỈ LIỆT KÊ GIỌNG TIẾNG ANH. Máy tiếng Việt có hàng chục giọng của nhiều thứ
 * tiếng; đổ hết ra thì người dùng phải lội qua giọng Ả Rập và giọng Ba Lan để
 * tìm giọng Anh. Nhãn ghi rõ vùng (Anh–Anh, Anh–Mỹ, Anh–Úc) vì đó là điều thật
 * sự đáng chọn khi luyện thi.
 */

export type EnglishVoice = {
  identifier: string;
  name: string;
  language: string;
};

/**
 * Nạp danh sách giọng tiếng Anh có trên máy.
 *
 * Trả `[]` khi máy chưa cài giọng nào hoặc trình duyệt chưa nạp xong — màn hình
 * gọi hàm này phải chịu được danh sách rỗng và vẫn đọc được bằng giọng mặc
 * định. Trên web, danh sách giọng tới BẤT ĐỒNG BỘ sau khi trang đã tải, nên
 * phải hỏi lại vài lần chứ không thể hỏi một lần rồi kết luận là máy không có
 * giọng nào.
 */
export function useEnglishVoices(): EnglishVoice[] {
  const [voices, setVoices] = useState<EnglishVoice[]>([]);

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;

    const load = async () => {
      attempts += 1;
      try {
        const all = await Speech.getAvailableVoicesAsync();
        if (cancelled) return;

        const english = all
          .filter((v) => v.language?.toLowerCase().startsWith('en'))
          .map((v) => ({ identifier: v.identifier, name: v.name, language: v.language }))
          .sort((a, b) => a.language.localeCompare(b.language) || a.name.localeCompare(b.name));

        if (english.length > 0) {
          setVoices(english);
          return;
        }
      } catch {
        // Nền tảng không hỗ trợ liệt kê giọng — vẫn đọc được bằng giọng mặc định.
      }
      if (!cancelled && attempts < 5) setTimeout(load, 400);
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return voices;
}

/**
 * Giọng nên chọn sẵn: giọng tốt nhất của giới đang chọn (mặc định nữ), cùng luật
 * chấm với giọng chung của app (`services/audio/voice-pick`: nơ-ron / Google trước, giọng SAPI cũ sau).
 */
export function preferredVoice(voices: EnglishVoice[]): string | null {
  return (
    bestVoiceFor(voices, voiceGender())?.identifier ??
    bestVoiceFor(voices, 'f')?.identifier ??
    voices[0]?.identifier ??
    null
  );
}

/**
 * Chỉ HAI lựa chọn: một giọng nữ và một giọng nam tốt nhất của máy này (tự chọn,
 * không liệt kê cả chục giọng). Lựa chọn lưu chung với Cài đặt học từ nên mọi
 * chỗ đọc trong app dùng cùng một giọng.
 */
export function VoicePicker({
  voices,
  voiceId,
  onChange,
  onPreview,
}: {
  voices: EnglishVoice[];
  voiceId: string | null;
  onChange: (identifier: string | null) => void;
  /** Đọc thử một câu ngắn bằng giọng vừa chọn. */
  onPreview: (identifier: string | null) => void;
}) {
  const { L } = useL();
  const female = bestVoiceFor(voices, 'f');
  const male = bestVoiceFor(voices, 'm');
  const setSettings = useTopicStudyStore((s) => s.setLearnSettings);
  const stored = useTopicStudyStore((s) => s.learnSettings.voiceGender);
  const gender: Gender = stored === 'm' ? 'm' : 'f';

  if (voices.length === 0 || (!female && !male)) return null;

  const options: { g: Gender; label: string; voice: EnglishVoice | null }[] = [
    { g: 'f', label: L('Nữ', 'Female'), voice: female },
    { g: 'm', label: L('Nam', 'Male'), voice: male },
  ];
  return (
    <View
      accessibilityLabel={L('Giọng đọc', 'Voice')}
      className="flex-row items-center rounded-pill border border-brand-soft bg-white p-0.5"
    >
      {options.map(({ g, label, voice }) => {
        const on = gender === g;
        return (
          <Pressable
            key={g}
            accessibilityRole="button"
            aria-selected={on}
            disabled={!voice}
            onPress={() => {
              const st = useTopicStudyStore.getState();
              setSettings({ ...st.learnSettings, voiceGender: g });
              const id = voice?.identifier ?? null;
              onChange(id);
              onPreview(id);
            }}
            className="flex-row items-center gap-1 rounded-pill px-3 py-1.5"
            style={{ backgroundColor: on ? paper.brandTint : 'transparent', opacity: voice ? 1 : 0.4, minHeight: 32 }}
          >
            {on ? <Icon name="volume" size={13} color={paper.brandMid} strokeWidth={2} /> : null}
            <Text className="font-semi text-label" style={{ color: on ? paper.brandMid : paper.muted }}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
