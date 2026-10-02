import React, { useState } from 'react';
import { Platform, Pressable, Text, View, useWindowDimensions } from 'react-native';

import { Icon } from '@/components/ui';
import { useL } from '@/i18n/useL';
import { readingFont } from '@/lib/readingFonts';
import { formatClock, nextSpeed, SEEK_STEP } from '@/services/history/audio-core';
import type { NarrationLang, Scene } from '@/services/history/types';
import { playSfx } from '@/services/audio/sfx-ui';

import type { Narration } from './useNarration';

const WEB = Platform.OS === 'web';
const INK = '#1A1A17';
const MUTED = '#85837A';
const RULE = '#E8E5DC';
const ACCENT = '#957846';
const CHIP = '#F3F1EA';

type Props = {
  nar: Narration;
  scene: Scene;
  total: number;
  speed: number;
  onSpeed: (s: number) => void;
  lang: NarrationLang;
  onLang: (l: NarrationLang) => void;
  autoAdvance: boolean;
  onAutoAdvance: (on: boolean) => void;
  onPrev: (() => void) | null;
  onNext: (() => void) | null;
};

/**
 * Thanh thuyết minh gọn, dính đáy khung đọc (trên điện thoại nằm NGAY TRÊN thanh tab dưới nhờ biến `--bb-h`).
 * Ngôn ngữ nghe độc lập với ngôn ngữ hiển thị; chỉ hiện "VI" khi cảnh có audio tiếng Việt thật.
 * Lỗi audio → báo rõ + nút đọc bằng giọng thiết bị (không đồng bộ từng câu).
 */
export function NarrationPlayer({ nar, scene, total, speed, onSpeed, lang, onLang, autoAdvance, onAutoAdvance, onPrev, onNext }: Props) {
  const { L } = useL();
  const [more, setMore] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const title = `${L('Cảnh', 'Scene')} ${scene.n}/${total}`;
  const failed = nar.error && !nar.tts;
  const noAudio = !nar.hasAudio;
  const dur = nar.duration || 0;

  const winW = useWindowDimensions().width;
  const wideBar = winW >= 1280;

  const playBtn = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={nar.playing ? L('Dừng', 'Pause') : L('Phát thuyết minh', 'Play narration')}
      onPress={() => {
        playSfx('tap');
        if (noAudio) nar.startTts();
        else nar.toggle();
      }}
      style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center' }}
    >
      {nar.loading && !nar.playing ? (
        <Text style={{ color: '#fff', fontFamily: readingFont.sansBold, fontSize: 18 }}>…</Text>
      ) : nar.playing ? (
        <View style={{ flexDirection: 'row', gap: 4 }}>
          <View style={{ width: 5, height: 18, borderRadius: 2, backgroundColor: '#fff' }} />
          <View style={{ width: 5, height: 18, borderRadius: 2, backgroundColor: '#fff' }} />
        </View>
      ) : (
        <Icon name="play" size={22} color="#FFFFFF" strokeWidth={2.2} />
      )}
    </Pressable>
  );
  const info = (
    <View style={{ flex: 1, minWidth: 0 }}>
      <Text numberOfLines={1} style={{ fontFamily: readingFont.sansBold, fontSize: 14, color: INK }}>
        {title} · {scene.titleEn}
      </Text>
      <Text numberOfLines={1} style={{ fontFamily: readingFont.sans, fontSize: 12.5, color: MUTED }}>
        {nar.tts
          ? L('Giọng thiết bị · không đồng bộ từng câu', 'Device voice · not synced sentence by sentence')
          : nar.sentenceText
            ? `“${nar.sentenceText}”`
            : noAudio
              ? L('Cảnh này chưa có audio', 'No audio for this scene yet')
              : `${formatClock(nar.time)} / ${formatClock(dur)}`}
      </Text>
    </View>
  );
  const speedBtn = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={L(`Tốc độ ${speed}×. Bấm để đổi`, `Speed ${speed}×. Tap to change`)}
      onPress={() => {
        playSfx('tap');
        onSpeed(nextSpeed(speed));
      }}
      style={{ minWidth: 52, height: 40, borderRadius: 20, backgroundColor: CHIP, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 }}
    >
      <Text style={{ fontFamily: readingFont.sansBold, fontSize: 13.5, color: INK }}>{speed}×</Text>
    </Pressable>
  );
  const controls = (
    <>
        <Round label={L('Cảnh trước', 'Previous scene')} disabled={!onPrev} onPress={() => onPrev?.()}>
          <Icon name="chevron-left" size={20} color={onPrev ? INK : '#BDBAAE'} strokeWidth={2.2} />
        </Round>
        <Round label={L(`Lùi ${SEEK_STEP} giây`, `Back ${SEEK_STEP} seconds`)} disabled={noAudio} onPress={() => nar.skip(-SEEK_STEP)}>
          <Text style={{ fontFamily: readingFont.sansBold, fontSize: 12.5, color: noAudio ? '#BDBAAE' : INK }}>−{SEEK_STEP}</Text>
        </Round>
        <Round label={L(`Tới ${SEEK_STEP} giây`, `Forward ${SEEK_STEP} seconds`)} disabled={noAudio} onPress={() => nar.skip(SEEK_STEP)}>
          <Text style={{ fontFamily: readingFont.sansBold, fontSize: 12.5, color: noAudio ? '#BDBAAE' : INK }}>+{SEEK_STEP}</Text>
        </Round>
        <Round label={L('Cảnh sau', 'Next scene')} disabled={!onNext} onPress={() => onNext?.()}>
          <Icon name="chevron-right" size={20} color={onNext ? INK : '#BDBAAE'} strokeWidth={2.2} />
        </Round>
        <Pill onPress={() => (noAudio ? nar.startTts() : nar.replay())} label={L('Nghe lại cảnh', 'Replay scene')} icon="refresh" />
    </>
  );

  return (
    <View
      accessibilityRole="toolbar"
      accessibilityLabel={L('Thuyết minh', 'Narration')}
      style={
        {
          marginTop: 16,
          borderRadius: 18,
          backgroundColor: '#FFFFFF',
          borderWidth: 1,
          borderColor: RULE,
          paddingLeft: 12,
          // chừa chỗ cho nút trợ lý AI nổi ở góc phải dưới
          paddingRight: WEB && winW >= 640 ? 64 : 12,
          paddingVertical: 10,
          gap: 8,
          ...(WEB
            ? { position: 'sticky', bottom: 'calc(var(--bb-h, 0px) + 10px)', zIndex: 30, transition: 'bottom 200ms ease', boxShadow: '0 8px 28px rgba(20,20,10,0.16)' }
            : { elevation: 6 }),
        } as object
      }
    >
      {wideBar ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {playBtn}
          <View style={{ width: 210, minWidth: 0 }}>{info}</View>
          <View style={{ flex: 1, minWidth: 140 }}>{!noAudio ? <Seek nar={nar} dur={dur} /> : null}</View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>{controls}</View>
          {speedBtn}
          <Pill onPress={() => setMore((m) => !m)} label={more ? L('Thu gọn', 'Less') : L('Tuỳ chọn', 'Options')} pressed={more} />
        </View>
      ) : (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {playBtn}
            {info}
            {speedBtn}
            <Pressable
              accessibilityRole="button"
              aria-expanded={expanded}
              accessibilityLabel={expanded ? L('Thu gọn điều khiển', 'Hide controls') : L('Mở thêm điều khiển', 'More controls')}
              onPress={() => setExpanded((e) => !e)}
              style={{ width: 40, height: 44, alignItems: 'center', justifyContent: 'center' }}
            >
              <Icon name={expanded ? 'chevron-down' : 'arrow-up'} size={20} color={INK} strokeWidth={2.2} />
            </Pressable>
          </View>
          {!noAudio ? <Seek nar={nar} dur={dur} /> : null}
        </>
      )}

      {failed ? (
        <View style={{ backgroundColor: '#FBEFEA', borderRadius: 12, padding: 10, gap: 8 }}>
          <Text style={{ fontFamily: readingFont.sansSemi, fontSize: 13, lineHeight: 19, color: '#8A3B1F' }}>
            {nar.error === 'tts'
              ? L('Thiết bị này không có giọng đọc tiếng Anh khả dụng.', 'This device has no usable English voice.')
              : nar.error === 'blocked'
              ? L('Trình duyệt chặn tự phát. Bấm nút phát để nghe.', 'The browser blocked playback. Press play to listen.')
              : nar.error === 'network'
                ? L('Mất kết nối nên chưa tải được audio của cảnh này.', 'You seem to be offline, so this scene’s audio did not load.')
                : nar.error === 'decode'
                  ? L('Tệp audio của cảnh này bị lỗi.', 'This scene’s audio file is damaged.')
                  : L('Không tìm thấy audio của cảnh này.', 'This scene’s audio could not be found.')}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {nar.error !== 'tts' ? <Pill onPress={() => nar.startTts()} label={L('Đọc bằng giọng thiết bị', 'Read aloud with device voice')} strong /> : null}
            <Pill onPress={() => nar.replay()} label={L('Thử lại', 'Try again')} />
          </View>
          <Text style={{ fontFamily: readingFont.sans, fontSize: 12, color: '#8A5A44' }}>{L('Giọng thiết bị, không đồng bộ từng câu.', 'Device voice, not synced sentence by sentence.')}</Text>
        </View>
      ) : null}

      {!wideBar && expanded ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {controls}
          <View style={{ flex: 1 }} />
          <Pill onPress={() => setMore((m) => !m)} label={more ? L('Thu gọn', 'Less') : L('Tuỳ chọn', 'Options')} pressed={more} />
        </View>
      ) : null}

      {more && (wideBar || expanded) ? (
        <View style={{ gap: 8, paddingTop: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Text style={{ fontFamily: readingFont.sansSemi, fontSize: 12.5, color: MUTED }}>{L('Ngôn ngữ nghe', 'Narration language')}</Text>
            <Pill label="English" pressed={lang === 'en'} onPress={() => onLang('en')} />
            {nar.langs.includes('vi') ? <Pill label="Tiếng Việt" pressed={lang === 'vi'} onPress={() => onLang('vi')} /> : null}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Text style={{ fontFamily: readingFont.sansSemi, fontSize: 12.5, color: MUTED }}>{L('Tự chuyển sang cảnh sau', 'Auto-play next scene')}</Text>
            <Pill label={L('Tắt', 'Off')} pressed={!autoAdvance} onPress={() => onAutoAdvance(false)} />
            <Pill label={L('Bật', 'On')} pressed={autoAdvance} onPress={() => onAutoAdvance(true)} />
          </View>
          <Text style={{ fontFamily: readingFont.sans, fontSize: 12, color: MUTED }}>
            {L('Phím tắt: Space phát/dừng · ← → lùi/tiến 10 giây.', 'Shortcuts: Space play/pause · ← → skip 10 seconds.')}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function Seek({ nar, dur }: { nar: Narration; dur: number }) {
  const { L } = useL();
  if (!WEB) {
    const pct = dur > 0 ? Math.min(100, (nar.time / dur) * 100) : 0;
    return (
      <View style={{ height: 6, borderRadius: 3, backgroundColor: CHIP }}>
        <View style={{ width: `${pct}%`, height: 6, borderRadius: 3, backgroundColor: ACCENT }} />
      </View>
    );
  }
  const pct = dur > 0 ? Math.min(100, (nar.time / dur) * 100) : 0;
  return (
    <input
      type="range"
      aria-label={L('Tua', 'Seek')}
      min={0}
      max={Math.max(1, Math.round(dur * 10))}
      value={Math.round(nar.time * 10)}
      onChange={(e) => nar.seek(Number(e.target.value) / 10)}
      style={{
        width: '100%',
        height: 28,
        margin: 0,
        accentColor: ACCENT,
        cursor: 'pointer',
        background: `linear-gradient(to right, ${ACCENT} ${pct}%, ${RULE} ${pct}%) center / 100% 6px no-repeat`,
      }}
    />
  );
}

function Round({ children, label, disabled, onPress }: { children: React.ReactNode; label: string; disabled?: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={() => {
        playSfx('tap');
        onPress();
      }}
      style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: CHIP, alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.55 : 1 }}
    >
      {children}
    </Pressable>
  );
}

function Pill({ label, onPress, pressed, strong, icon }: { label: string; onPress: () => void; pressed?: boolean; strong?: boolean; icon?: 'refresh' }) {
  const on = pressed || strong;
  return (
    <Pressable
      accessibilityRole="button"
      aria-pressed={pressed}
      onPress={() => {
        playSfx('tap');
        onPress();
      }}
      style={{ minHeight: 44, borderRadius: 22, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', backgroundColor: on ? ACCENT : CHIP }}
    >
      {icon ? <Icon name={icon} size={15} color={on ? '#FFFFFF' : INK} strokeWidth={2.1} /> : null}
      <Text style={{ fontFamily: readingFont.sansBold, fontSize: 13, color: on ? '#FFFFFF' : INK }}>{label}</Text>
    </Pressable>
  );
}
