import React, { useEffect, useRef } from 'react';
import { Platform, Text, View } from 'react-native';
import { handwritingFont } from './handwriting';

/**
 * Chữ viết tay theo nét thật (Hanzi Writer): từng nét được vẽ lần lượt, lặp lại.
 * Chữ Hán dùng dữ liệu tiếng Trung, kanji dùng dữ liệu tiếng Nhật; kana chưa có dữ liệu nét
 * nên rơi về phông viết tay. Chữ in hiện ngay bên cạnh.
 */
const isHan = (c: string) => /[㐀-鿿]/.test(c);

function loader(lang: 'ja' | 'zh') {
  const base = lang === 'zh' ? 'https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0.1/' : 'https://cdn.jsdelivr.net/npm/hanzi-writer-data-jp@0.0.1/';
  return (char: string, onLoad: (d: unknown) => void, onErr: () => void) => {
    fetch(base + encodeURIComponent(char) + '.json').then((r) => (r.ok ? r.json() : Promise.reject())).then(onLoad, onErr);
  };
}

function Glyph({ char, lang, size, color }: { char: string; lang: 'ja' | 'zh'; size: number; color: string }) {
  const host = useRef<HTMLElement | null>(null);
  const failed = useRef(false);
  const [bad, setBad] = React.useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web' || !host.current || !isHan(char)) return;
    let alive = true;
    let writer: { animateCharacter: (o: { onComplete?: () => void }) => void; hideCharacter: () => void } | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    host.current.innerHTML = '';
    import('hanzi-writer').then((mod) => {
      if (!alive || !host.current) return;
      const HanziWriter = mod.default;
      writer = HanziWriter.create(host.current, char, {
        width: size, height: size, padding: 6, strokeColor: color, radicalColor: color,
        outlineColor: 'rgba(128,128,160,0.28)', showOutline: true, strokeAnimationSpeed: 1.2, delayBetweenStrokes: 220,
        charDataLoader: loader(lang) as never,
        onLoadCharDataError: () => { failed.current = true; if (alive) setBad(true); },
      }) as never;
      const loop = () => {
        if (!alive || !writer) return;
        writer.animateCharacter({ onComplete: () => { timer = setTimeout(loop, 1400); } });
      };
      loop();
    });
    return () => { alive = false; if (timer) clearTimeout(timer); };
  }, [char, lang, size, color]);

  if (!isHan(char) || bad) {
    return <Text style={[{ width: size, textAlign: 'center', fontSize: size * 0.78, lineHeight: size, color }, handwritingFont(lang)]}>{char}</Text>;
  }
  return React.createElement('div', { ref: (el: HTMLElement | null) => { host.current = el; }, style: { width: size, height: size } });
}

export function StrokeWord({ word, language, color = '#e8e8ff', compact }: { word: string; language: 'ja' | 'zh'; color?: string; compact?: boolean }) {
  const chars = Array.from(word.replace(/[\s／/（）()～〜]/g, '')).slice(0, 6);
  const size = compact ? (chars.length > 3 ? 56 : chars.length > 1 ? 72 : 96) : chars.length > 3 ? 84 : chars.length > 1 ? 112 : 150;
  if (Platform.OS !== 'web') {
    return <Text style={[{ fontSize: 96, color }, handwritingFont(language)]}>{word}</Text>;
  }
  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
        {chars.map((c, i) => <Glyph key={i + c} char={c} lang={language} size={size} color={color} />)}
      </View>
      {compact ? null : <Text style={{ marginTop: 6, fontSize: 28, color, opacity: 0.75 }}>{word}</Text>}
    </View>
  );
}
