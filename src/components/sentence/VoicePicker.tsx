import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import * as Speech from 'expo-speech';

import { Icon } from '@/components/ui';
import { paper } from '@/theme/tokens';

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

const REGION_LABEL: Record<string, string> = {
  'en-GB': 'Anh – Anh',
  'en-US': 'Anh – Mỹ',
  'en-AU': 'Anh – Úc',
  'en-IN': 'Anh – Ấn',
  'en-IE': 'Anh – Ireland',
  'en-ZA': 'Anh – Nam Phi',
  'en-NZ': 'Anh – New Zealand',
  'en-CA': 'Anh – Canada',
};

function regionOf(language: string): string {
  const normalized = language.replace('_', '-');
  return REGION_LABEL[normalized] ?? normalized;
}

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
 * Giọng nên chọn sẵn khi máy có nhiều lựa chọn.
 *
 * Giọng mặc định của hệ thống trên Windows và Android thường là giọng máy đọc
 * rất khô — người học mở bài lên, nghe câu đầu tiên, và tưởng bài khó trong khi
 * thật ra là giọng dở. Nên app tự chọn giúp một giọng nghe được, và vẫn để đổi.
 *
 * Thứ tự ưu tiên: giọng Anh-Anh của Google (rõ và đều nhất trong các giọng cài
 * sẵn), rồi tới bất kỳ giọng Anh-Anh nào, rồi Anh-Mỹ. Không có gì khớp thì trả
 * `null` để dùng giọng mặc định của máy.
 */
export function preferredVoice(voices: EnglishVoice[]): string | null {
  if (voices.length === 0) return null;

  const byName = (needle: string) =>
    voices.find((v) => v.name.toLowerCase().includes(needle.toLowerCase()));

  const byLang = (prefix: string) =>
    voices.find((v) => v.language.replace('_', '-').toLowerCase().startsWith(prefix));

  const pick =
    byName('Google UK English Female') ??
    byName('Google UK English') ??
    byLang('en-gb') ??
    byName('Google US English') ??
    byLang('en-us') ??
    voices[0];

  return pick?.identifier ?? null;
}

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
  const [open, setOpen] = useState(false);

  const current = useMemo(
    () => voices.find((v) => v.identifier === voiceId) ?? null,
    [voices, voiceId],
  );

  if (voices.length === 0) return null;

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Chọn giọng đọc"
        onPress={() => setOpen(true)}
        className="flex-row items-center gap-1.5 rounded-pill border border-brand-soft bg-white px-3 py-1.5"
      >
        <Icon name="volume" size={14} color={paper.body} strokeWidth={1.9} />
        <Text className="font-semi text-label text-paper-body" numberOfLines={1}>
          {current ? current.name : 'Giọng mặc định'}
        </Text>
        <Icon name="chevron-down" size={13} color={paper.muted} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Đóng danh sách giọng"
          onPress={() => setOpen(false)}
          style={{ flex: 1, backgroundColor: 'rgba(26,26,51,0.45)', justifyContent: 'center' }}
        >
          <Pressable
            onPress={(event) => event.stopPropagation()}
            className="w-full self-center px-4"
            style={{ maxWidth: 520 }}
          >
            <View className="max-h-[70vh] overflow-hidden rounded-card bg-white">
              <View className="flex-row items-center justify-between border-b border-brand-soft px-5 py-3.5">
                <View className="min-w-0 flex-1">
                  <Text className="font-heavy text-cardTitle text-paper-ink">Giọng đọc</Text>
                  <Text className="font-sans text-label text-paper-muted">
                    {voices.length} giọng tiếng Anh có trên máy này
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Đóng"
                  onPress={() => setOpen(false)}
                  className="h-8 w-8 items-center justify-center rounded-pill bg-brand-tint"
                >
                  <Icon name="close" size={15} color={paper.body} strokeWidth={2} />
                </Pressable>
              </View>

              <ScrollView contentContainerStyle={{ padding: 12, gap: 6 }}>
                <VoiceRow
                  label="Giọng mặc định của máy"
                  sub="Dùng giọng hệ thống đang đặt sẵn"
                  selected={voiceId === null}
                  onPress={() => {
                    onChange(null);
                    onPreview(null);
                  }}
                />
                {voices.map((voice) => (
                  <VoiceRow
                    key={voice.identifier}
                    label={voice.name}
                    sub={regionOf(voice.language)}
                    selected={voice.identifier === voiceId}
                    onPress={() => {
                      onChange(voice.identifier);
                      onPreview(voice.identifier);
                    }}
                  />
                ))}
              </ScrollView>

              <View className="border-t border-brand-soft px-5 py-3">
                <Text className="font-sans text-label text-paper-muted">
                  Chạm vào một giọng để nghe thử ngay. Chọn xong thì đóng bảng lại.
                </Text>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function VoiceRow({
  label,
  sub,
  selected,
  onPress,
}: {
  label: string;
  sub: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-panel border px-3.5 py-3"
      style={{
        borderColor: selected ? paper.brandMid : paper.brandSoft,
        backgroundColor: selected ? paper.brandTint : '#FFFFFF',
      }}
    >
      <View className="min-w-0 flex-1">
        <Text className="font-semi text-body text-paper-ink" numberOfLines={1}>
          {label}
        </Text>
        <Text className="font-sans text-label text-paper-muted">{sub}</Text>
      </View>
      {selected ? <Icon name="check" size={17} color={paper.brandMid} strokeWidth={2.4} /> : null}
    </Pressable>
  );
}
