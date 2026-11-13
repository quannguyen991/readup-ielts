import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { TappableSentence } from '@/components/lookup/TapWord';
import { Icon } from '@/components/ui/Icon';
import { useL } from '@/i18n/useL';
import { pronounce } from '@/services/audio/pronounce';
import { peekExampleVi, translateExample } from '@/services/vocab/sentence-translate';

import { useStudyTheme } from './study/useStudyTheme';

/**
 * Câu ví dụ với hai nút ngay bên cạnh: PHÁT ÂM (đọc cả câu) và DỊCH (hiện nghĩa tiếng Việt ngay dưới câu;
 * bấm lần đầu thì dịch, lần sau nhớ lại). Từ đang học vẫn in đậm, chạm vào từ nào cũng ra nghĩa như trước.
 */
export function ExampleSentence({ example, word, className, translation, reading, language, big }: { big?: boolean; example: string; word?: string; className?: string; /** Bản dịch có sẵn (bộ Trung/Nhật): bấm dịch là hiện ngay, không gọi AI. */ translation?: string; /** Phiên âm câu (pinyin). */ reading?: string; language?: 'en' | 'ja' | 'zh' }) {
  const { L } = useL();
  const theme = useStudyTheme();
  const [open, setOpen] = useState(false);
  const [vi, setVi] = useState<string | undefined>(() => translation ?? peekExampleVi(example));
  const [status, setStatus] = useState<'idle' | 'loading' | 'quota' | 'failed'>('idle');
  const alive = useRef(true);
  const current = useRef(example);

  useEffect(() => () => {
    alive.current = false;
  }, []);
  // Đổi thẻ / đổi câu thì đóng bản dịch cũ, để không hiện nghĩa của câu trước.
  useEffect(() => {
    current.current = example;
    setOpen(false);
    setVi(translation ?? peekExampleVi(example));
    setStatus('idle');
  }, [example, translation]);

  const toggle = () => {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    if (vi) return;
    setStatus('loading');
    const asked = example;
    void translateExample(asked).then((r) => {
      // Bản dịch đến muộn của câu đã rời thẻ thì bỏ qua.
      if (!alive.current || current.current !== asked) return;
      if ('vi' in r) {
        setVi(r.vi);
        setStatus('idle');
      } else {
        setStatus(r.error === 'quota' ? 'quota' : 'failed');
      }
    });
  };

  const iconColor = theme.dark ? '#E7C98A' : theme.accent;
  const buttonBg = (active: boolean) => ({
    backgroundColor: active
      ? theme.dark
        ? 'rgba(231,201,138,0.22)'
        : '#F3F0FB'
      : theme.dark
        ? theme.soft
        : '#F3F0FB',
  });

  return (
    <View>
      <View className="flex-row items-start gap-2">
        <View className="min-w-0 flex-1">
          {language === 'ja' || language === 'zh' ? (
            <>
              <Text className={className ?? `font-sans ${big ? 'text-sectionTitle' : 'text-bodyLg'} text-ink`} style={{ lineHeight: big ? 32 : 28 }}>{example}</Text>
              {reading ? <Text className={`mt-0.5 font-sans ${big ? 'text-body' : 'text-label'} text-muted`}>{reading}</Text> : null}
            </>
          ) : (
            <TappableSentence text={example} highlight={word} className={className ?? 'font-sans text-body text-muted'} />
          )}
        </View>
        <View className="flex-row gap-1.5">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={L('Phát âm câu ví dụ', 'Play example sentence')}
            onPress={() => void pronounce(example, { rate: 0.9, language: language === 'ja' ? 'ja-JP' : language === 'zh' ? 'zh-CN' : undefined })}
            hitSlop={6}
            className="h-8 w-8 items-center justify-center rounded-pill"
            style={buttonBg(false)}
          >
            <Icon name="volume" size={16} color={iconColor} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: open }}
            accessibilityLabel={open ? L('Ẩn bản dịch', 'Hide translation') : L('Dịch câu ví dụ', 'Translate example')}
            onPress={toggle}
            hitSlop={6}
            className="h-8 w-8 items-center justify-center rounded-pill"
            style={buttonBg(open)}
          >
            <Icon name="languages" size={16} color={iconColor} />
          </Pressable>
        </View>
      </View>
      {open ? (
        <View className="mt-1.5 flex-row items-center gap-2">
          {vi ? (
            <Text className={`flex-1 font-sans ${big ? 'text-bodyLg' : 'text-label'}`} style={{ color: theme.ink, lineHeight: big ? 26 : 20 }}>
              {vi}
            </Text>
          ) : status === 'loading' ? (
            <ActivityIndicator size="small" color={theme.accent} />
          ) : (
            <Text className="flex-1 font-sans text-label" style={{ color: theme.muted, lineHeight: 20 }}>
              {status === 'quota'
                ? L('Hôm nay đã hết lượt dịch miễn phí, thử lại sau.', 'Free translations are used up for today. Try again later.')
                : L('Chưa dịch được, thử lại sau.', "Couldn't translate it yet. Try again later.")}
            </Text>
          )}
        </View>
      ) : null}
    </View>
  );
}
