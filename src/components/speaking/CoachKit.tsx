import React, { useEffect } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';

import { useL } from '@/i18n/useL';
import type { VoiceCoach } from '@/services/audio/useVoiceCoach';
import { useAudioPrefs } from '@/store/useAudioPrefs';
import { color } from '@/theme/tokens';

const WAVE_ID = 'readup-coach-wave';

function ensureWaveKeyframes() {
  if (Platform.OS !== 'web' || typeof document === 'undefined' || document.getElementById(WAVE_ID)) return;
  const el = document.createElement('style');
  el.id = WAVE_ID;
  el.textContent = `@keyframes readup-coach-wave { from { transform: scaleY(0.3); } to { transform: scaleY(1); } }
@media (prefers-reduced-motion: reduce) { [data-coach-bar] { animation: none !important; } }`;
  document.head.appendChild(el);
}

/** Sóng âm nhỏ: nhảy khi huấn luyện viên đang nói, nằm yên khi im. */
function Wave({ on, tone }: { on: boolean; tone: string }) {
  return (
    <View aria-hidden className="flex-row items-center gap-[3px]" style={{ height: 22, width: 30 }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <View
          key={i}
          {...({ dataSet: { coachBar: '1' } } as object)}
          style={{
            width: 4,
            height: 20,
            borderRadius: 2,
            backgroundColor: tone,
            transform: [{ scaleY: on ? 1 : 0.3 + (i % 3) * 0.15 }],
            ...(Platform.OS === 'web' && on
              ? ({
                  animationName: 'readup-coach-wave',
                  animationDuration: `${0.4 + (i % 3) * 0.13}s`,
                  animationTimingFunction: 'ease-in-out',
                  animationIterationCount: 'infinite',
                  animationDirection: 'alternate',
                  animationDelay: `${i * 0.08}s`,
                } as object)
              : null),
          }}
        />
      ))}
    </View>
  );
}

/**
 * Bong bóng của huấn luyện viên: sóng âm + một dòng chú thích ngắn. Bấm vào khi
 * đang nói để cho im. Không hiện gì khi chưa có lượt nào.
 */
export function CoachBubble({ coach }: { coach: VoiceCoach }) {
  const { L, en } = useL();
  useEffect(ensureWaveKeyframes, []);
  if (!coach.caption) return null;
  const tone = coach.band === 'good' ? '#22A06B' : coach.band === 'ok' ? '#6A4BD9' : color.primary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={coach.speaking ? L('Tắt tiếng huấn luyện viên', 'Silence the coach') : L('Lời huấn luyện viên', 'Coach feedback')}
      onPress={coach.stop}
      className="mt-4 flex-row items-center gap-3 self-center rounded-pill px-4 py-2.5"
      style={{ backgroundColor: '#F3F0FB', borderWidth: 1, borderColor: '#F3F0FB', maxWidth: '100%' }}
    >
      <Wave on={coach.speaking} tone={tone} />
      <Text className="min-w-0 shrink font-semi text-label" style={{ color: '#475569' }}>
        {en ? coach.caption.en : coach.caption.vi}
      </Text>
    </Pressable>
  );
}

/** Công tắc nhỏ "Huấn luyện viên giọng nói" (mặc định bật). */
export function CoachToggle() {
  const { L } = useL();
  const on = useAudioPrefs((s) => s.coach);
  const setCoach = useAudioPrefs((s) => s.setCoach);
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: on }}
      accessibilityLabel={L('Huấn luyện viên giọng nói', 'Voice coach')}
      onPress={() => setCoach(!on)}
      className="flex-row items-center gap-2 rounded-pill py-1 pl-3 pr-1.5"
      style={{ backgroundColor: '#F3F0FB' }}
    >
      <Text className="font-semi text-label" style={{ color: on ? color.primary : '#64748B' }}>
        {L('Huấn luyện viên giọng nói', 'Voice coach')}
      </Text>
      <View className="h-5 w-9 justify-center rounded-pill px-0.5" style={{ backgroundColor: on ? color.primary : '#CBD5E1' }}>
        <View className="h-4 w-4 rounded-pill bg-white" style={{ alignSelf: on ? 'flex-end' : 'flex-start' }} />
      </View>
    </Pressable>
  );
}
