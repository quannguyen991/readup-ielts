import React, { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { eaLevels, eaNodeHref, type EaLang } from '@/data/learning-path/east-asian';
import { useL } from '@/i18n/useL';

import { EA_FONT } from './EaParts';
import type { EaSkin } from './skins';

const MAX_SHOWN = 8;

function fold(value: string): string {
  const lower = value.toLowerCase();
  const nfd = typeof lower.normalize === 'function' ? lower.normalize('NFD').replace(/[̀-ͯ]/g, '') : lower;
  return nfd.replace(/đ/g, 'd').trim();
}

/** Ô tìm nhanh chủ đề / buổi học của mọi cấp: gõ "gia đình", "du lịch", "N3"… rồi bấm để vào thẳng buổi học. */
export function EaSearch({ lang, skin }: { lang: EaLang; skin: EaSkin }) {
  const { L, en } = useL();
  const c = skin.c;
  const [q, setQ] = useState('');
  const index = useMemo(
    () =>
      eaLevels(lang).flatMap((lv) =>
        lv.parts.flatMap((p) =>
          p.nodes.map((n) => ({
            node: n,
            level: lv.label,
            part: en ? p.title.en : p.title.vi,
            title: en ? n.title.en : n.title.vi,
            hay: fold(`${lv.label} ${lv.title.vi} ${lv.title.en} ${p.title.vi} ${p.title.en} ${n.title.vi} ${n.title.en}`),
          })),
        ),
      ),
    [lang, en],
  );
  const needle = fold(q);
  const hits = useMemo(() => (needle ? index.filter((r) => needle.split(/\s+/).every((w) => r.hay.includes(w))) : []), [needle, index]);

  return (
    <View style={{ gap: 8 }}>
      <TextInput
        value={q}
        onChangeText={setQ}
        accessibilityLabel={L('Tìm chủ đề hoặc buổi học', 'Search topics or lessons')}
        placeholder={L('Tìm chủ đề, buổi học hoặc cấp (vd. gia đình, du lịch, N3)…', 'Search topics, lessons or level (e.g. family, travel, N3)…')}
        placeholderTextColor={c.ink2}
        style={{ borderRadius: 16, borderWidth: 1.5, borderColor: c.border, backgroundColor: c.panelSolid, color: c.ink, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, fontFamily: EA_FONT.body } as never}
      />
      {needle ? (
        <View style={{ borderRadius: 16, borderWidth: 1, borderColor: c.border, backgroundColor: c.panelSolid, overflow: 'hidden' }}>
          {hits.length === 0 ? (
            <Text style={{ padding: 14, color: c.ink2, fontSize: 14, fontFamily: EA_FONT.body }}>{L('Không có chủ đề nào khớp.', 'Nothing matches.')}</Text>
          ) : (
            hits.slice(0, MAX_SHOWN).map((r, i) => (
              <Pressable
                key={r.node.id}
                accessibilityRole="button"
                onPress={() => router.push(eaNodeHref(r.node) as never)}
                style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 11, borderTopWidth: i ? 1 : 0, borderColor: c.border, opacity: pressed ? 0.8 : 1 })}
              >
                <View style={{ borderRadius: 999, borderWidth: 1, borderColor: c.accent, paddingHorizontal: 9, paddingVertical: 3 }}>
                  <Text style={{ color: c.accent, fontSize: 12, fontFamily: EA_FONT.heavy }}>{r.level}</Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text numberOfLines={1} style={{ color: c.ink, fontSize: 15, fontFamily: EA_FONT.strong }}>{r.title}</Text>
                  <Text numberOfLines={1} style={{ color: c.ink2, fontSize: 13, fontFamily: EA_FONT.body }}>{r.part}</Text>
                </View>
                <Text style={{ color: c.ink2, fontSize: 13, fontFamily: EA_FONT.mid }}>{`${r.node.words} ${L('từ', 'words')}`}</Text>
              </Pressable>
            ))
          )}
          {hits.length > MAX_SHOWN ? (
            <Text style={{ paddingHorizontal: 14, paddingVertical: 10, color: c.ink2, fontSize: 13, fontFamily: EA_FONT.body, borderTopWidth: 1, borderColor: c.border }}>
              {L(`Còn ${hits.length - MAX_SHOWN} kết quả nữa — gõ thêm để lọc.`, `${hits.length - MAX_SHOWN} more — type more to narrow down.`)}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
