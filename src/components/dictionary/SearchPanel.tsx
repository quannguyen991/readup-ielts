import React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { Icon } from '@/components/ui';
import { POS_VI, type DeepSuggestion } from '@/services/dictionary/deep-entry';
import { color, goldLeaf } from '@/theme/tokens';
import { readingFont } from '@/lib/readingFonts';
import { Card } from './dict-ui';

export const TRY_WORDS = ['coastline', 'resilient', 'sustainable', 'mitigate', 'deteriorate', 'take part'];

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (v: string) => void;
  suggestions: DeepSuggestion[];
  busy: boolean;
  showTry: boolean;
};

/** Ô tìm kiếm lớn đầu trang: gợi ý tức thì theo tiền tố, Enter hoặc nút "Tra từ" để tra. */
export function SearchPanel({ value, onChange, onSubmit, suggestions, busy, showTry }: Props) {
  const [focused, setFocused] = React.useState(false);
  const open = focused && suggestions.length > 0;

  return (
    <Card pad={18} style={{ zIndex: 5 }}>
      <View
        style={
          {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            borderRadius: 999,
            borderWidth: 2,
            borderColor: focused ? color.primaryDark : color.borderStrong,
            backgroundColor: color.surface,
            paddingLeft: 18,
            paddingRight: 6,
            minHeight: 60,
          } as object
        }
      >
        <Icon name="search" size={22} color={color.muted} strokeWidth={2} />
        <TextInput
          value={value}
          onChangeText={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 180)}
          onSubmitEditing={() => onSubmit(value)}
          placeholder="Gõ một từ hoặc cụm từ tiếng Anh…"
          placeholderTextColor={color.subtle}
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          returnKeyType="search"
          accessibilityLabel="Tìm từ"
          style={
            {
              flex: 1,
              minWidth: 0,
              fontFamily: readingFont.sansSemi,
              fontSize: 19,
              color: color.ink,
              paddingVertical: 12,
              outlineStyle: 'none',
            } as object
          }
        />
        {value ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Xoá ô tìm" onPress={() => onChange('')} style={{ padding: 8 }}>
            <Icon name="close" size={18} color={color.muted} strokeWidth={2.2} />
          </Pressable>
        ) : null}
        <Pressable
          accessibilityRole="button"
          onPress={() => onSubmit(value)}
          disabled={!value.trim() || busy}
          style={({ pressed }) =>
            ({
              backgroundColor: color.primaryDark,
              borderRadius: 999,
              paddingHorizontal: 24,
              paddingVertical: 13,
              opacity: !value.trim() ? 0.5 : pressed ? 0.85 : 1,
            }) as object
          }
        >
          <Text style={{ fontFamily: readingFont.sansBold, fontSize: 16, color: '#FFFFFF' }}>{busy ? 'Đang tra…' : 'Tra từ'}</Text>
        </Pressable>
      </View>

      {open ? (
        <View style={{ marginTop: 10, borderRadius: 16, borderWidth: 1, borderColor: color.border, overflow: 'hidden' }}>
          {suggestions.map((s, i) => (
            <Pressable
              key={s.word}
              accessibilityRole="button"
              onPress={() => onSubmit(s.word)}
              style={({ hovered, pressed }: { hovered?: boolean; pressed: boolean }) =>
                ({
                  flexDirection: 'row',
                  alignItems: 'baseline',
                  gap: 10,
                  paddingHorizontal: 16,
                  paddingVertical: 11,
                  borderTopWidth: i === 0 ? 0 : 1,
                  borderTopColor: color.border,
                  backgroundColor: hovered || pressed ? color.surfaceAlt : color.surface,
                }) as object
              }
            >
              <Text style={{ fontFamily: readingFont.sansBold, fontSize: 16, color: color.ink }}>{s.word}</Text>
              <Text style={{ fontFamily: readingFont.sans, fontSize: 13, color: color.muted }}>{s.pos === 'other' ? '' : POS_VI[s.pos]}</Text>
              <Text numberOfLines={1} style={{ flex: 1, minWidth: 0, fontFamily: readingFont.sans, fontSize: 14, color: color.body }}>
                {s.meaningVi}
              </Text>
              {s.cefr ? <Text style={{ fontFamily: readingFont.sansBold, fontSize: 13, color: goldLeaf.softInk }}>{s.cefr}</Text> : null}
            </Pressable>
          ))}
        </View>
      ) : null}

      {showTry ? (
        <View style={{ marginTop: 14, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontFamily: readingFont.sansSemi, fontSize: 14, color: color.muted }}>Thử tra:</Text>
          {TRY_WORDS.map((w) => (
            <Pressable
              key={w}
              accessibilityRole="button"
              onPress={() => onSubmit(w)}
              style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, backgroundColor: color.primarySoft }}
            >
              <Text style={{ fontFamily: readingFont.sansBold, fontSize: 14, color: color.primaryDark }}>{w}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </Card>
  );
}
