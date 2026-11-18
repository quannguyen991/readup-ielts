import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { Icon } from '@/components/ui';
import { pronounce, type Accent } from '@/services/audio/pronounce';
import { highlightParts, POS_VI, type DeepEntry, type DeepSense } from '@/services/dictionary/deep-entry';
import { translateExample } from '@/services/dictionary/deep-loader';
import { useVocabStore } from '@/store/useVocabStore';
import { color, goldLeaf } from '@/theme/tokens';
import { readingFont } from '@/lib/readingFonts';
import { Card, Pill, SectionTitle, WordChip } from './dict-ui';

type Props = { entry: DeepEntry; wide: boolean; onSearch: (w: string) => void };

/** Mục từ đầy đủ: thẻ chính + cột "Cụm từ kết hợp"; bên dưới là đồng/trái nghĩa và họ từ. */
export function EntryView({ entry, wide, onSearch }: Props) {
  const hasRelated = entry.synonyms.length > 0 || entry.antonyms.length > 0;
  const hasFamily = entry.family.length > 0;
  return (
    <View style={{ gap: 18 }}>
      <View style={{ flexDirection: wide ? 'row' : 'column', gap: 18, alignItems: 'flex-start' }}>
        <View style={{ flex: wide ? 1 : undefined, width: wide ? undefined : '100%', minWidth: 0 }}>
          <MainCard entry={entry} />
        </View>
        <View style={{ width: wide ? 340 : '100%' }}>
          <CollocationCard entry={entry} onSearch={onSearch} />
        </View>
      </View>
      {hasRelated || hasFamily ? (
        <View style={{ flexDirection: wide ? 'row' : 'column', gap: 18, alignItems: 'flex-start' }}>
          {hasRelated ? (
            <View style={{ flex: wide ? 1 : undefined, width: wide ? undefined : '100%', minWidth: 0 }}>
              <RelatedCard entry={entry} onSearch={onSearch} />
            </View>
          ) : null}
          {hasFamily ? (
            <View style={{ flex: wide ? 1 : undefined, width: wide ? undefined : '100%', minWidth: 0 }}>
              <FamilyCard entry={entry} onSearch={onSearch} />
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

/* ------------------------------------------------------------- thẻ chính */

function MainCard({ entry }: { entry: DeepEntry }) {
  const saveWord = useVocabStore((s) => s.saveWord);
  const entries = useVocabStore((s) => s.entries);
  const saved = React.useMemo(() => Object.values(entries).some((e) => e.lemma === entry.word), [entries, entry.word]);
  const [playing, setPlaying] = React.useState<Accent | null>(null);
  const translations = useExampleTranslations(entry);

  const play = (accent: Accent) => {
    setPlaying(accent);
    void pronounce(entry.word, { accent });
    setTimeout(() => setPlaying((p) => (p === accent ? null : p)), 1500);
  };

  const onSave = () => {
    const first = entry.senses[0];
    const sentence = first?.examples[0]?.en ?? entry.word;
    saveWord({
      word: entry.word,
      lemma: entry.word,
      phonetic: entry.ipaUk,
      partOfSpeech: entry.pos === 'other' ? null : entry.pos,
      definitionContext: null,
      definitionGeneral: first?.definitionEn || null,
      definitionVi: first?.meaningVi || null,
      exampleSentence: first?.examples[0]?.en ?? null,
      sourceSentence: sentence,
      articleId: null,
      articleTitle: 'Từ điển chuyên sâu',
      paragraphIndex: null,
      isCollocation: entry.word.includes(' '),
      synonyms: entry.synonyms.map((s) => s.word),
      antonyms: entry.antonyms.map((s) => s.word),
    });
  };

  const multiPos = entry.posList.length > 1;

  return (
    <Card pad={26}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 14 }}>
        <View style={{ flex: 1, minWidth: 220, gap: 10 }}>
          <Text
            selectable
            accessibilityRole="header"
            style={{ fontFamily: readingFont.sansHeavy, fontSize: 44, lineHeight: 50, letterSpacing: -1.2, color: color.ink }}
          >
            {entry.word}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {entry.cefr ? <Pill label={entry.cefr} tone="gold" /> : null}
            {entry.pos !== 'other' ? <Pill label={POS_VI[entry.pos]} tone="primary" /> : null}
            {entry.source === 'network' ? <Pill label="Từ điển trực tuyến" /> : null}
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={onSave}
          disabled={saved}
          style={({ pressed }) =>
            ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              paddingHorizontal: 18,
              paddingVertical: 12,
              borderRadius: 999,
              borderWidth: 2,
              borderColor: saved ? color.border : color.primaryDark,
              backgroundColor: saved ? color.surfaceAlt : color.surface,
              opacity: pressed ? 0.8 : 1,
            }) as object
          }
        >
          <Icon name={saved ? 'check' : 'bookmark'} size={18} color={saved ? color.success : color.primaryDark} strokeWidth={2.4} />
          <Text style={{ fontFamily: readingFont.sansBold, fontSize: 15, color: saved ? color.body : color.primaryDark }}>
            {saved ? 'Đã lưu vào sổ từ' : 'Lưu vào sổ từ'}
          </Text>
        </Pressable>
      </View>

      {entry.ipaUk || entry.ipaUs ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 20 }}>
          {entry.ipaUk ? (
            <IpaTile
              label={entry.ipaUs ? 'UK' : 'IPA'}
              ipa={entry.ipaUk}
              active={playing === (entry.ipaUs ? 'uk' : 'us')}
              onPlay={() => play(entry.ipaUs ? 'uk' : 'us')}
            />
          ) : null}
          {entry.ipaUs ? <IpaTile label="US" ipa={entry.ipaUs} active={playing === 'us'} onPlay={() => play('us')} /> : null}
        </View>
      ) : (
        <Pressable accessibilityRole="button" onPress={() => play('us')} style={{ marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Icon name="volume" size={18} color={color.primaryDark} strokeWidth={2} />
          <Text style={{ fontFamily: readingFont.sansSemi, fontSize: 15, color: color.primaryDark }}>Nghe phát âm</Text>
        </Pressable>
      )}

      {entry.summaryVi ? (
        <Text selectable style={{ marginTop: 20, fontFamily: readingFont.sansMedium, fontSize: 17, lineHeight: 27, color: color.body }}>
          {entry.summaryVi}
        </Text>
      ) : null}

      <View style={{ height: 1, backgroundColor: color.border, marginVertical: 22 }} />

      <SectionTitle hint={entry.senses.length > 1 ? `${entry.senses.length} nghĩa thường gặp` : undefined}>Nghĩa & ví dụ</SectionTitle>
      <View style={{ gap: 18 }}>
        {entry.senses.map((s, i) => (
          <SenseRow key={i} n={i + 1} sense={s} word={entry.word} showPos={multiPos} translations={translations} />
        ))}
      </View>

      {entry.notes.length ? (
        <View
          style={{
            marginTop: 24,
            backgroundColor: goldLeaf.soft,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: '#F0D58A',
            padding: 18,
            gap: 8,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icon name="sparkle" size={18} color={goldLeaf.softInk} strokeWidth={2.2} />
            <Text style={{ fontFamily: readingFont.sansHeavy, fontSize: 16, color: goldLeaf.softInk }}>Ghi chú</Text>
          </View>
          {entry.notes.map((n, i) => (
            <Text key={i} style={{ fontFamily: readingFont.sansMedium, fontSize: 15, lineHeight: 23, color: '#4A3500' }}>
              {n}
            </Text>
          ))}
        </View>
      ) : null}
    </Card>
  );
}

function IpaTile({ label, ipa, active, onPlay }: { label: string; ipa: string; active: boolean; onPlay: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Nghe giọng ${label}`}
      onPress={onPlay}
      style={({ hovered }: { hovered?: boolean }) =>
        ({
          flexGrow: 1,
          flexBasis: 180,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingVertical: 12,
          paddingLeft: 16,
          paddingRight: 12,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: active ? color.primaryDark : color.border,
          backgroundColor: active ? color.primarySoft : hovered ? color.surface : color.surfaceAlt,
        }) as object
      }
    >
      <Text style={{ fontFamily: readingFont.sansHeavy, fontSize: 14, color: color.muted, width: 26 }}>{label}</Text>
      <Text selectable style={{ flex: 1, minWidth: 0, fontFamily: readingFont.sansSemi, fontSize: 19, color: color.ink }}>
        {ipa}
      </Text>
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: active ? color.primaryDark : color.surface,
          borderWidth: 1,
          borderColor: active ? color.primaryDark : color.border,
        }}
      >
        <Icon name="volume" size={19} color={active ? '#FFFFFF' : color.primaryDark} strokeWidth={2.1} />
      </View>
    </Pressable>
  );
}

function SenseRow({
  n,
  sense,
  word,
  showPos,
  translations,
}: {
  n: number;
  sense: DeepSense;
  word: string;
  showPos: boolean;
  translations: Record<string, string | null>;
}) {
  return (
    <View style={{ flexDirection: 'row', gap: 14 }}>
      <View
        style={{
          width: 30,
          height: 30,
          borderRadius: 15,
          backgroundColor: color.primarySoft,
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 1,
        }}
      >
        <Text style={{ fontFamily: readingFont.sansHeavy, fontSize: 14, color: color.primaryDark }}>{n}</Text>
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 8 }}>
        <View style={{ gap: 3 }}>
          {showPos && sense.pos !== 'other' ? (
            <Text style={{ fontFamily: readingFont.sansBold, fontSize: 13, color: color.muted }}>{POS_VI[sense.pos]}</Text>
          ) : null}
          {sense.definitionEn ? (
            <Text selectable style={{ fontFamily: readingFont.sansSemi, fontSize: 16.5, lineHeight: 25, color: color.ink }}>
              {sense.definitionEn}
            </Text>
          ) : null}
          {sense.meaningVi ? (
            <Text selectable style={{ fontFamily: readingFont.sansBold, fontSize: 15.5, lineHeight: 23, color: color.primaryDark }}>
              {sense.meaningVi}
            </Text>
          ) : null}
        </View>
        {sense.examples.map((ex, i) => (
          <View key={i} style={{ borderLeftWidth: 3, borderLeftColor: '#E7C766', paddingLeft: 14, gap: 3 }}>
            <Text selectable style={{ fontFamily: readingFont.sansMedium, fontSize: 15.5, lineHeight: 24, color: color.body }}>
              {highlightParts(ex.en, word).map((p, k) =>
                p.hit ? (
                  <Text key={k} style={{ fontFamily: readingFont.sansBold, color: color.ink, textDecorationLine: 'underline', textDecorationColor: '#E0A21A' }}>
                    {p.text}
                  </Text>
                ) : (
                  p.text
                ),
              )}
            </Text>
            {translations[ex.en] ? (
              <Text selectable style={{ fontFamily: readingFont.sans, fontSize: 14.5, lineHeight: 22, color: color.muted }}>
                {translations[ex.en]}
              </Text>
            ) : translations[ex.en] === undefined ? (
              <Text style={{ fontFamily: readingFont.sans, fontSize: 13, color: color.subtle }}>Đang dịch…</Text>
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
}

/** Dịch Việt các câu ví dụ (dịch máy, nhớ lại trong máy). undefined = đang dịch, null = không dịch được. */
function useExampleTranslations(entry: DeepEntry): Record<string, string | null> {
  const [map, setMap] = React.useState<Record<string, string | null>>({});
  React.useEffect(() => {
    let cancelled = false;
    setMap({});
    const sentences = entry.senses.flatMap((s) => s.examples.map((e) => e.en)).slice(0, 5);
    void (async () => {
      for (const s of sentences) {
        const vi = await translateExample(s);
        if (cancelled) return;
        setMap((m) => ({ ...m, [s]: vi }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [entry]);
  return map;
}

/* ------------------------------------------------------ cụm từ kết hợp */

function CollocationCard({ entry, onSearch }: { entry: DeepEntry; onSearch: (w: string) => void }) {
  return (
    <Card pad={22}>
      <SectionTitle hint="Bấm vào cụm để tra tiếp">Cụm từ kết hợp</SectionTitle>
      {entry.collocations.length === 0 ? (
        <Text style={{ fontFamily: readingFont.sans, fontSize: 14, lineHeight: 21, color: color.muted }}>Chưa có cụm kết hợp của từ này trong kho.</Text>
      ) : (
        <View>
          {entry.collocations.map((c, i) => (
            <Pressable
              key={c}
              accessibilityRole="button"
              accessibilityLabel={`Tra cụm ${c}`}
              onPress={() => onSearch(c)}
              style={({ hovered, pressed }: { hovered?: boolean; pressed: boolean }) =>
                ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  paddingVertical: 12,
                  paddingHorizontal: 10,
                  marginHorizontal: -10,
                  borderRadius: 12,
                  borderTopWidth: 0,
                  borderBottomWidth: i === entry.collocations.length - 1 ? 0 : 1,
                  borderBottomColor: color.border,
                  backgroundColor: hovered || pressed ? color.surfaceAlt : 'transparent',
                }) as object
              }
            >
              <Text style={{ flex: 1, minWidth: 0, fontFamily: readingFont.sansMedium, fontSize: 16, lineHeight: 23, color: color.body }}>
                {highlightParts(c, entry.word).map((p, k) =>
                  p.hit ? (
                    <Text key={k} style={{ fontFamily: readingFont.sansHeavy, color: color.primaryDark }}>
                      {p.text}
                    </Text>
                  ) : (
                    p.text
                  ),
                )}
              </Text>
              <Icon name="chevron-right" size={16} color={color.subtle} strokeWidth={2.2} />
            </Pressable>
          ))}
        </View>
      )}
    </Card>
  );
}

/* ----------------------------------------------- đồng/trái nghĩa, họ từ */

function RelatedCard({ entry, onSearch }: { entry: DeepEntry; onSearch: (w: string) => void }) {
  return (
    <Card pad={22}>
      <SectionTitle>Đồng nghĩa & Trái nghĩa</SectionTitle>
      <View style={{ gap: 18 }}>
        {entry.synonyms.length ? (
          <Group label="Đồng nghĩa" accent="#15803D">
            {entry.synonyms.map((s) => (
              <WordChip key={s.word} word={s.word} gloss={s.meaningVi} tone="good" onPress={() => onSearch(s.word)} />
            ))}
          </Group>
        ) : null}
        {entry.antonyms.length ? (
          <Group label="Trái nghĩa" accent="#B91C1C">
            {entry.antonyms.map((s) => (
              <WordChip key={s.word} word={s.word} gloss={s.meaningVi} tone="bad" onPress={() => onSearch(s.word)} />
            ))}
          </Group>
        ) : null}
      </View>
    </Card>
  );
}

function Group({ label, accent, children }: { label: string; accent: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 10 }}>
      <Text style={{ fontFamily: readingFont.sansHeavy, fontSize: 14, color: accent }}>{label}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{children}</View>
    </View>
  );
}

function FamilyCard({ entry, onSearch }: { entry: DeepEntry; onSearch: (w: string) => void }) {
  return (
    <Card pad={22}>
      <SectionTitle hint="Các từ cùng gốc trong kho của app">Họ từ</SectionTitle>
      <View style={{ gap: 16 }}>
        {entry.family.map((g) => (
          <View key={g.pos} style={{ gap: 8 }}>
            <Text style={{ fontFamily: readingFont.sansHeavy, fontSize: 14, color: color.muted }}>{POS_VI[g.pos]}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {g.words.map((w) => (
                <WordChip key={w.word} word={w.word} gloss={w.meaningVi} current={w.current} onPress={() => onSearch(w.word)} />
              ))}
            </View>
          </View>
        ))}
      </View>
    </Card>
  );
}
