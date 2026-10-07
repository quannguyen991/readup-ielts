import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import type { SectionAudio } from './useSectionAudio';
import { Icon } from '@/components/ui/Icon';
import { playSfx } from '@/services/audio/sfx-ui';
import { color } from '@/theme/tokens';
import { useL } from '@/i18n/useL';

export const SPEEDS = [0.75, 1, 1.25];

export const fmtTime = (sec: number) => {
  const s = Math.max(0, Math.floor(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

/** Thanh tiến độ: chỉ bấm để tua khi `seekable`. */
function Progress({ audio, seekable }: { audio: SectionAudio; seekable: boolean }) {
  const [w, setW] = useState(0);
  const pct = audio.duration > 0 ? Math.min(1, audio.current / audio.duration) : 0;
  return (
    <Pressable
      accessibilityRole={seekable ? 'adjustable' : undefined}
      accessibilityLabel="Audio progress"
      disabled={!seekable}
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
      onPress={(e) => {
        if (w > 0) audio.seek((e.nativeEvent.locationX / w) * audio.duration);
      }}
      style={{ flex: 1, height: 36, justifyContent: 'center' }}
    >
      <View style={{ height: 6, borderRadius: 3, backgroundColor: '#EFE3C8', overflow: 'hidden' }}>
        <View style={{ width: `${pct * 100}%`, height: 6, borderRadius: 3, backgroundColor: '#B8955A' }} />
      </View>
      {seekable ? (
        <View style={{ position: 'absolute', left: `${pct * 100}%`, marginLeft: -9, width: 18, height: 18, borderRadius: 9, backgroundColor: '#8F6E36' }} />
      ) : null}
    </Pressable>
  );
}

export function PlayButton({ audio, real, size = 56 }: { audio: SectionAudio; real: boolean; size?: number }) {
  const { L } = useL();
  const playing = audio.status === 'playing';
  // Thi thật: đã bắt đầu thì không tạm dừng, hết rồi thì không nghe lại.
  const locked = real && audio.started && (playing || audio.status === 'ended' || audio.status === 'paused');
  const disabled = locked && !(audio.status === 'paused' && audio.blocked);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={playing ? L('Tạm dừng', 'Pause') : L('Phát', 'Play')}
      disabled={disabled}
      onPress={() => {
        playSfx('tap');
        if (playing) audio.pause();
        else audio.play();
      }}
      style={{
        width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center',
        backgroundColor: disabled ? '#D9CDB4' : '#B8955A',
      }}
    >
      {playing && !disabled ? (
        <View style={{ flexDirection: 'row', gap: size * 0.1 }}>
          <View style={{ width: size * 0.1, height: size * 0.34, borderRadius: 2, backgroundColor: '#FFFFFF' }} />
          <View style={{ width: size * 0.1, height: size * 0.34, borderRadius: 2, backgroundColor: '#FFFFFF' }} />
        </View>
      ) : (
        <Icon name={disabled ? 'lock' : 'play'} size={size * 0.42} color="#FFFFFF" strokeWidth={2.2} />
      )}
    </Pressable>
  );
}

export function SpeedChips({ speed, onChange, disabled }: { speed: number; onChange: (v: number) => void; disabled?: boolean }) {
  return (
    <View className="flex-row gap-1.5">
      {SPEEDS.map((v) => {
        const on = speed === v;
        return (
          <Pressable
            key={v}
            accessibilityRole="button"
            aria-selected={on}
            disabled={disabled}
            onPress={() => {
              playSfx('tab');
              onChange(v);
            }}
            className="items-center justify-center rounded-pill border px-3.5"
            style={{ minHeight: 44, minWidth: 48, borderColor: on ? color.primary : color.borderStrong, backgroundColor: on ? '#FBF7EE' : '#FFFFFF', opacity: disabled ? 0.45 : 1 }}
          >
            <Text className="font-strong" style={{ fontSize: 14, color: on ? color.primary : color.muted }}>
              {v}x
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Thẻ âm thanh (máy tính): nút phát, thanh tiến độ, tốc độ, ghi chú chế độ. */
export function AudioCard({
  audio, real, speed, onSpeed, title, context, sourceNote, localAudioName, onPickAudio,
}: {
  audio: SectionAudio; real: boolean; speed: number; onSpeed: (v: number) => void; title: string; context?: string;
  sourceNote?: string;
  localAudioName?: string; onPickAudio?: () => void;
}) {
  const { L } = useL();
  const seekable = !real && (audio.mode === 'file' || audio.mode === 'aoede');
  return (
    <View className="rounded-card border border-border bg-surface p-5" style={{ minHeight: 420, justifyContent: 'center' }}>
      <View className="flex-row items-center gap-2">
        <Icon name="volume" size={17} color={color.primary} />
        <Text className="flex-1 font-heavy text-ink" style={{ fontSize: 18, lineHeight: 24 }} numberOfLines={2}>{title}</Text>
      </View>
      {context ? <Text className="mt-2 font-sans text-body text-muted" style={{ lineHeight: 21 }}>{context}</Text> : null}
      {sourceNote ? <Text className="mt-1 font-mid text-label text-muted" style={{ lineHeight: 18 }}>{sourceNote}</Text> : null}

      <View className="mt-4 items-center">
        <PlayButton audio={audio} real={real} size={76} />
        <Text className="mt-2 font-mid text-body text-muted">
          {audio.status === 'playing'
            ? L('Đang phát…', 'Playing…')
            : audio.status === 'ended'
              ? L('Đã phát xong', 'Finished')
              : audio.blocked
                ? L('Bấm Phát để nghe', 'Press Play to listen')
                : L('Bấm Phát hoặc phím Space', 'Press Play or Space')}
        </Text>
      </View>

      <View className="mt-3 flex-row items-center gap-3">
        <Text className="font-mid text-muted" style={{ fontSize: 12, width: 36 }}>{fmtTime(audio.current)}</Text>
        <Progress audio={audio} seekable={seekable} />
        <Text className="font-mid text-muted" style={{ fontSize: 12, width: 36, textAlign: 'right' }}>
          {audio.duration ? fmtTime(audio.duration) : '--:--'}
        </Text>
      </View>

      <View className="mt-3 flex-row flex-wrap items-center justify-between gap-2">
        <SpeedChips speed={real ? 1 : speed} onChange={onSpeed} disabled={real} />
        {seekable ? (
          <View className="flex-row gap-1.5">
            <Pressable accessibilityLabel="-10s" onPress={() => audio.seek(audio.current - 10)} className="items-center justify-center rounded-pill border border-border px-3" style={{ minHeight: 44, minWidth: 52 }}>
              <Text className="font-strong text-muted" style={{ fontSize: 14 }}>-10s</Text>
            </Pressable>
            <Pressable accessibilityLabel="+10s" onPress={() => audio.seek(audio.current + 10)} className="items-center justify-center rounded-pill border border-border px-3" style={{ minHeight: 44, minWidth: 52 }}>
              <Text className="font-strong text-muted" style={{ fontSize: 14 }}>+10s</Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      {onPickAudio ? (
        <View className="mt-4 rounded-panel border border-dashed border-borderStrong p-3">
          <Pressable accessibilityRole="button" onPress={onPickAudio} className="flex-row items-center justify-center gap-2 rounded-pill bg-canvas px-4" style={{ minHeight: 46 }}>
            <Icon name="volume" size={16} color={color.primary} />
            <Text className="font-strong text-primary-700" style={{ fontSize: 13 }}>
              {localAudioName ? L('Chọn tệp khác', 'Choose another file') : L('Nạp audio từ thiết bị', 'Load audio from device')}
            </Text>
          </Pressable>
          <Text className="mt-2 text-center font-sans text-label text-muted" numberOfLines={2}>
            {localAudioName ? `${L('Đã chọn', 'Selected')}: ${localAudioName}` : L('Tệp chỉ dùng trong phiên này, không tải lên máy chủ.', 'Used in this session only; the file is not uploaded.')}
          </Text>
        </View>
      ) : null}

      {real ? (
        <Text className="mt-3 font-mid text-label" style={{ color: '#B26A00' }}>
          {L('Thi thật: nghe một lần, không tạm dừng, không tua.', 'Real test: one listen, no pause, no seeking.')}
        </Text>
      ) : null}
      <FallbackNote audio={audio} />
    </View>
  );
}

export function FallbackNote({ audio }: { audio: SectionAudio }) {
  const { L } = useL();
  if (audio.mode === 'aoede') {
    return (
      <View className="mt-3 flex-row gap-2 rounded-panel p-2.5" style={{ backgroundColor: '#F0F5EB' }}>
        <Icon name="info" size={15} color="#537343" />
        <Text className="min-w-0 flex-1 font-sans text-label" style={{ color: '#405B35', lineHeight: 18 }}>
          {L('Đang dùng bản đọc học tập do AI tạo bằng giọng Aoede; đây không phải audio đề thi gốc.', 'AI study readout in the Aoede voice; this is not the original exam audio.')}
        </Text>
      </View>

    );
  }
  if (audio.mode !== 'tts') return null;
  return (
    <View className="mt-3 flex-row gap-2 rounded-panel p-2.5" style={{ backgroundColor: '#FEF4E6' }}>
      <Icon name="info" size={15} color="#B26A00" />
      <Text className="min-w-0 flex-1 font-sans text-label" style={{ color: '#7A4A00', lineHeight: 18 }}>
        {L(
          audio.ttsVoice === 'device'
            ? 'Chưa có audio gốc; đang đọc bản chữ bằng giọng máy của thiết bị. Chế độ này không tua được.'
            : 'Chưa có audio gốc. Bấm Phát để tạo bản đọc học tập bằng Aoede nếu máy chủ đã cấu hình; nếu không, app dùng giọng máy của thiết bị.',
          audio.ttsVoice === 'device'
            ? 'No original audio is available; reading the transcript with the device voice. This mode cannot seek.'
            : 'No original audio is available. Press Play for an Aoede study readout if configured; otherwise the device voice is used.',
        )}
      </Text>
    </View>
  );
}

/**
 * Thanh âm thanh dính đáy (điện thoại): nút phát/tạm dừng LỚN 56px bên trái trong
 * tầm ngón cái, thanh tua + giờ ở giữa, rồi -10s / +10s và tốc độ (chạm để đổi vòng).
 * Thi thật: không tua, không đổi tốc độ nên các nút phụ ẩn đi.
 */
export function AudioBar({
  audio, real, label, speed = 1, onSpeed,
}: { audio: SectionAudio; real: boolean; label: string; speed?: number; onSpeed?: (v: number) => void }) {
  const seekable = !real && (audio.mode === 'file' || audio.mode === 'aoede');
  const next = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length] ?? 1;
  const small = {
    minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22,
    borderWidth: 1, borderColor: color.borderStrong, backgroundColor: '#FFFFFF',
  } as const;
  return (
    <View className="border-t border-border bg-surface px-3 py-2">
      <View className="flex-row items-center gap-2.5">
        <PlayButton audio={audio} real={real} size={56} />
        <View className="min-w-0 flex-1">
          <View className="flex-row items-center justify-between">
            <Text className="font-strong text-ink" style={{ fontSize: 13 }} numberOfLines={1}>{label}</Text>
            <Text className="font-mid text-muted" style={{ fontSize: 13, fontVariant: ['tabular-nums'] }}>
              {fmtTime(audio.current)} / {audio.duration ? fmtTime(audio.duration) : '--:--'}
            </Text>
          </View>
          <Progress audio={audio} seekable={seekable} />
        </View>
        {seekable ? (
          <>
            <Pressable accessibilityRole="button" accessibilityLabel="-10s" onPress={() => audio.seek(audio.current - 10)} style={small}>
              <Text className="font-strong text-muted" style={{ fontSize: 13 }}>-10</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="+10s" onPress={() => audio.seek(audio.current + 10)} style={small}>
              <Text className="font-strong text-muted" style={{ fontSize: 13 }}>+10</Text>
            </Pressable>
          </>
        ) : null}
        {!real && onSpeed ? (
          <Pressable accessibilityRole="button" accessibilityLabel={`Speed ${speed}x`} onPress={() => onSpeed(next)} style={small}>
            <Text className="font-strong" style={{ fontSize: 13, color: color.primary }}>{speed}x</Text>
          </Pressable>
        ) : null}
      </View>
      {audio.mode === 'tts' ? (
        <Text className="mt-1 font-mid" style={{ fontSize: 12, color: '#B26A00' }}>
          {audio.ttsVoice === 'device' ? 'Giọng thiết bị · chưa có audio gốc' : 'Aoede dự phòng · chưa có audio gốc'}
        </Text>
      ) : null}
    </View>
  );
}
