import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAudioPlayer } from 'expo-audio';
import { Platform, Pressable, Text, View } from 'react-native';

import { Icon } from '@/components/ui';
import { useL } from '@/i18n/useL';
import { readingFont } from '@/lib/readingFonts';
import type { SceneAmbience } from '@/services/history/types';

const WEB = Platform.OS === 'web';

// Static bundled assets keep the optional scene bed available on web, iOS, and Android.
const AMBIENCE_AUDIO: Record<SceneAmbience, number> = {
  water: require('../../../assets/history/ambience/water.wav'),
  city: require('../../../assets/history/ambience/city.wav'),
  mountain: require('../../../assets/history/ambience/mountain.wav'),
  room: require('../../../assets/history/ambience/room.wav'),
};

const TEXTURES: Record<SceneAmbience, { labelVi: string; labelEn: string }> = {
  water: { labelVi: 'Sóng nước nhẹ', labelEn: 'Soft water ambience' },
  city: { labelVi: 'Âm phố xa', labelEn: 'Distant city ambience' },
  mountain: { labelVi: 'Gió núi', labelEn: 'Mountain wind' },
  room: { labelVi: 'Không gian tĩnh', labelEn: 'Quiet room tone' },
};

function textureFor(sceneId: string, ambience?: SceneAmbience): SceneAmbience {
  if (ambience) return ambience;
  if (sceneId === 's01' || sceneId === 's08') return 'water';
  if (sceneId === 's02' || sceneId === 's03' || sceneId === 's04' || sceneId === 's05' || sceneId === 's12') return 'city';
  if (sceneId === 's11') return 'room';
  return 'mountain';
}

/** Âm nền tổng hợp nhẹ; luôn tắt khi vào cảnh và chỉ chạy sau thao tác người dùng. */
export function SceneAtmosphereToggle({ sceneId, ambience, compact = false, screenActive = true }: { sceneId: string; ambience?: SceneAmbience; compact?: boolean; screenActive?: boolean }) {
  const { L, en } = useL();
  const [enabled, setEnabled] = useState(false);
  const [volume, setVolume] = useState(0.34);
  const player = useAudioPlayer(null);
  const activeAmbience = useRef<SceneAmbience | null>(null);
  const currentVolume = useRef(0);
  const fadeTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const soundscape = textureFor(sceneId, ambience);

  const fadeTo = useCallback((target: number, duration: number, onEnd?: () => void) => {
    if (fadeTimer.current) clearInterval(fadeTimer.current);
    const from = currentVolume.current;
    const startedAt = Date.now();
    const tick = () => {
      const progress = Math.min(1, (Date.now() - startedAt) / duration);
      const next = from + (target - from) * progress;
      player.volume = next;
      currentVolume.current = next;
      if (progress >= 1) {
        if (fadeTimer.current) clearInterval(fadeTimer.current);
        fadeTimer.current = null;
        onEnd?.();
      }
    };
    tick();
    if (duration > 0 && currentVolume.current !== target) fadeTimer.current = setInterval(tick, 30);
  }, [player]);

  const start = useCallback(() => {
    activeAmbience.current = soundscape;
    player.replace(AMBIENCE_AUDIO[soundscape]);
    player.loop = true;
    player.volume = 0;
    currentVolume.current = 0;
    void player.seekTo(0);
    player.play();
    setEnabled(true);
  }, [player, soundscape]);

  const stop = useCallback(() => {
    fadeTo(0, 190, () => player.pause());
    setEnabled(false);
  }, [fadeTo, player]);

  // Change the ambience bed with a short fade-out, source swap, and fade-in.
  useEffect(() => {
    if (!enabled || activeAmbience.current === soundscape) return;
    fadeTo(0, 210, () => {
      activeAmbience.current = soundscape;
      player.pause();
      player.replace(AMBIENCE_AUDIO[soundscape]);
      player.loop = true;
      player.volume = 0;
      currentVolume.current = 0;
      void player.seekTo(0);
      player.play();
      fadeTo(volume, 320);
    });
  }, [enabled, fadeTo, player, sceneId, soundscape, volume]);

  useEffect(() => {
    if (screenActive || !enabled) return;
    fadeTo(0, 190, () => player.pause());
    setEnabled(false);
  }, [enabled, fadeTo, player, screenActive]);

  useEffect(() => {
    if (!enabled || activeAmbience.current !== soundscape) return;
    fadeTo(volume, 140);
  }, [enabled, fadeTo, soundscape, volume]);

  useEffect(() => () => {
    if (fadeTimer.current) clearInterval(fadeTimer.current);
    player.pause();
  }, [player]);

  const preset = TEXTURES[soundscape];
  const title = en ? preset.labelEn : preset.labelVi;

  return (
    <View style={{ alignItems: 'flex-end', gap: 4, padding: 5, borderRadius: 15, backgroundColor: 'rgba(249,246,238,.91)', borderWidth: 1, borderColor: 'rgba(255,255,255,.68)', ...(WEB ? ({ backdropFilter: 'blur(14px)', boxShadow: '0 10px 28px rgba(9,12,10,.2)' } as object) : {}) }}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: enabled }}
        accessibilityLabel={L(`Âm thanh không gian minh họa: ${preset.labelVi}. ${enabled ? 'Đang bật' : 'Đang tắt'}.`, `Illustrative atmosphere: ${preset.labelEn}. ${enabled ? 'On' : 'Off'}.`)}
        onPress={() => enabled ? stop() : start()}
        style={{ minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 8, borderRadius: 11 }}
      >
        <Icon name="volume" size={16} color="#957846" strokeWidth={2.2} />
        <Text style={{ fontFamily: readingFont.sansBold, fontSize: 12, color: '#302D25' }}>{enabled ? L('Tắt âm nền', 'Mute ambience') : L('Bật âm nền', 'Play ambience')}</Text>
        {!compact ? <Text numberOfLines={1} style={{ fontFamily: readingFont.sans, fontSize: 11, color: '#777267' }}>{title}</Text> : null}
      </Pressable>
      {enabled ? (
        <View style={{ minHeight: 28, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 8 }}>
          <Icon name="volume" size={13} color="#777267" strokeWidth={2} />
          <Text style={{ fontFamily: readingFont.sans, fontSize: 10.5, color: '#777267' }}>{L('Âm lượng', 'Volume')}</Text>
          {WEB ? (
            <input
              aria-label={L('Âm lượng âm nền', 'Ambience volume')}
              type="range"
              min="0"
              max="70"
              step="5"
              value={Math.round(volume * 100)}
              onChange={(event) => setVolume(Number(event.currentTarget.value) / 100)}
              style={{ width: compact ? 52 : 84, height: 18, margin: 0, accentColor: '#957846', cursor: 'pointer' }}
            />
          ) : (
            <>
              <Pressable accessibilityRole="button" accessibilityLabel={L('Giảm âm lượng nền', 'Lower ambience volume')} onPress={() => setVolume((v) => Math.max(0, Math.round((v - 0.1) * 10) / 10))} style={{ width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F0FB' }}>
                <Text style={{ fontFamily: readingFont.sansBold, fontSize: 16, color: '#302D25' }}>−</Text>
              </Pressable>
              <Text accessibilityLiveRegion="polite" style={{ minWidth: 29, textAlign: 'center', fontFamily: readingFont.sansSemi, fontSize: 10.5, color: '#777267' }}>{Math.round(volume * 100)}%</Text>
              <Pressable accessibilityRole="button" accessibilityLabel={L('Tăng âm lượng nền', 'Raise ambience volume')} onPress={() => setVolume((v) => Math.min(0.7, Math.round((v + 0.1) * 10) / 10))} style={{ width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F0FB' }}>
                <Text style={{ fontFamily: readingFont.sansBold, fontSize: 16, color: '#302D25' }}>+</Text>
              </Pressable>
            </>
          )}
        </View>
      ) : null}
    </View>
  );
}
