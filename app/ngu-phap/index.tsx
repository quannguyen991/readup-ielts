import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { PC, SectionCard, useCourseFonts } from '@/components/hub/PhonemeCourse';
import { Screen } from '@/components/layout/Screen';
import { NeonPageHero } from '@/components/neon/NeonPageHero';
import { Icon } from '@/components/ui/Icon';
import { CEFR_LEVELS, GRAMMAR_LESSONS, lessonsOfLevel, type CefrLevel } from '@/data/grammar';
import { useL } from '@/i18n/useL';
import { isPassed, useGrammarProgressStore } from '@/store/useGrammarProgressStore';

/** Luyện ngữ pháp: chọn cấp A1 → C2, bấm bài để vào học. Ít chữ, tiến độ nhìn là thấy. */
const SOFT = { boxShadow: '0 6px 24px rgba(60, 40, 120, 0.08)' } as object;
const ACCENT = '#E0713B';

export default function GrammarIndex() {
  useCourseFonts();
  const { L } = useL();
  const best = useGrammarProgressStore((st) => st.best);
  const passed = (id: string) => isPassed(best, id);
  const total = GRAMMAR_LESSONS.length;
  const done = GRAMMAR_LESSONS.filter((l) => passed(l.id)).length;
  const next = GRAMMAR_LESSONS.find((l) => !passed(l.id));
  const passedIn = (lv: CefrLevel) => lessonsOfLevel(lv).filter((l) => passed(l.id)).length;
  const suggested = CEFR_LEVELS.find((lv) => passedIn(lv) < lessonsOfLevel(lv).length) ?? 'A1';
  const [level, setLevel] = useState<CefrLevel>(suggested);
  const lessons = lessonsOfLevel(level);

  return (
    <Screen>
      <NeonPageHero scene="path" title={L('Luyện ngữ pháp', 'Grammar')} subtitle={L('Chọn cấp, bấm bài để vào học.', 'Pick a level, tap a lesson.')} chips={[{ label: `${done}/${total} ${L('bài đạt', 'passed')}`, icon: 'star5' }]}>
        {next ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push(`/ngu-phap/${next.id}` as never)}
            style={{ minHeight: 52, maxWidth: 320, paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 26, backgroundColor: '#FFD84A', borderWidth: 2, borderColor: '#FFF1A8', boxShadow: '0 5px 0 #B88A00' } as object}
          >
            <Text numberOfLines={1} style={{ flexShrink: 1, fontFamily: 'Nunito_400Regular', fontSize: 17, color: '#2B1D00' }}>{L('Học tiếp', 'Continue')} · {next.level}</Text>
            <Icon name="chevron-right" size={18} color="#2B1D00" />
          </Pressable>
        ) : null}
      </NeonPageHero>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 18 }} accessibilityRole="tablist">
        {CEFR_LEVELS.map((lv) => {
          const active = lv === level;
          const n = lessonsOfLevel(lv).length;
          return (
            <Pressable
              key={lv}
              accessibilityRole="tab"
              aria-selected={active}
              onPress={() => setLevel(lv)}
              style={{ flexGrow: 1, flexBasis: 90, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 20, backgroundColor: active ? PC.purple : '#FFFFFF', ...SOFT }}
            >
              <Text style={{ fontFamily: PC.display, fontWeight: '400', fontSize: 22, color: active ? '#FFFFFF' : PC.ink }}>{lv}</Text>
              <Text style={{ fontFamily: PC.body, fontWeight: '600', fontSize: 13, color: active ? 'rgba(255,255,255,0.85)' : PC.muted }}>{passedIn(lv)}/{n}</Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        accessibilityRole="link"
        onPress={() => router.push(`/ngu-phap/tong-hop?level=${level}` as never)}
        style={({ hovered }: { hovered?: boolean }) => ({ marginTop: 14, minHeight: 64, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 20, backgroundColor: hovered ? '#FFE9DA' : '#FFF3EA', borderWidth: 1.5, borderColor: '#F7CFB5' }) as never}
      >
        <View style={{ width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: ACCENT }}>
          <Icon name="target" size={20} color="#FFFFFF" />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontFamily: PC.display, fontWeight: '400', fontSize: 17, color: PC.ink }}>{L(`Kiểm tra tổng hợp ${level}`, `${level} review test`)}</Text>
          <Text style={{ fontFamily: PC.body, fontSize: 13, color: PC.muted }}>{L('15 câu từ mọi bài của cấp', '15 questions from every lesson')}{best[`final-${level}`] !== undefined ? ` · ${best[`final-${level}`]}/15` : ''}</Text>
        </View>
        <Icon name="chevron-right" size={18} color={ACCENT} />
      </Pressable>

      <SectionCard title={`${level} · ${lessons.length} ${L('bài', 'lessons')}`}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {lessons.map((l) => {
            const ok = passed(l.id);
            return (
              <Pressable
                key={l.id}
                accessibilityRole="link"
                onPress={() => router.push(`/ngu-phap/${l.id}` as never)}
                style={{ flexGrow: 1, flexBasis: 250, minHeight: 72, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 18, backgroundColor: ok ? '#EAF9F0' : '#FBFAFF', borderWidth: 1.5, borderColor: ok ? '#BFEBD0' : PC.line }}
              >
                <View style={{ width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: ok ? '#22C55E' : '#EFEBFA' }}>
                  <Text style={{ fontFamily: PC.display, fontWeight: '400', fontSize: 16, color: ok ? '#FFFFFF' : PC.purple }}>{ok ? '✓' : l.order}</Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text numberOfLines={2} style={{ fontFamily: PC.display, fontWeight: '700', fontSize: 16, lineHeight: 20, color: PC.ink }}>{l.title}</Text>
                  <Text style={{ fontFamily: PC.body, fontWeight: '500', fontSize: 13, color: PC.muted }}>{l.minutes} {L('phút', 'min')}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </SectionCard>
    </Screen>
  );
}

