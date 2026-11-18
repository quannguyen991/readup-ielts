import React from 'react';
import { ActivityIndicator, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { NightHero } from '@/components/catalog/NightHero';
import { Screen } from '@/components/layout/Screen';
import { suggestDeep, type DeepIndex, type DeepSuggestion } from '@/services/dictionary/deep-entry';
import { loadDeepIndex, resolveDeep, type DeepResult } from '@/services/dictionary/deep-loader';
import { color } from '@/theme/tokens';
import { readingFont } from '@/lib/readingFonts';
import { Card } from './dict-ui';
import { EntryView } from './EntryView';
import { SearchPanel } from './SearchPanel';

type View_ = { kind: 'idle' } | { kind: 'loading'; query: string } | { kind: 'done'; result: DeepResult };

/** Trang "Từ điển chuyên sâu" (/tu-dien?q=từ). */
export function DeepDictionary() {
  const params = useLocalSearchParams<{ q?: string | string[] }>();
  const query = (Array.isArray(params.q) ? params.q[0] : params.q)?.trim() ?? '';
  const { width } = useWindowDimensions();
  const wide = width >= 1180;

  const [text, setText] = React.useState(query);
  const [state, setState] = React.useState<View_>(query ? { kind: 'loading', query } : { kind: 'idle' });
  const [index, setIndex] = React.useState<DeepIndex | null>(null);
  const [nonce, setNonce] = React.useState(0);

  React.useEffect(() => {
    let alive = true;
    loadDeepIndex().then(
      (i) => alive && setIndex(i),
      () => undefined,
    );
    return () => {
      alive = false;
    };
  }, []);

  React.useEffect(() => {
    // Đồng bộ ô nhập và trạng thái tra với ?q= trên đường dẫn (nguồn sự thật nằm ngoài component).
    /* eslint-disable react-hooks/set-state-in-effect */
    setText(query);
    if (!query) {
      setState({ kind: 'idle' });
      return;
    }
    let alive = true;
    setState({ kind: 'loading', query });
    resolveDeep(query).then((result) => alive && setState({ kind: 'done', result }));
    return () => {
      alive = false;
    };
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [query, nonce]);

  const go = React.useCallback(
    (word: string) => {
      const w = word.trim();
      if (!w) return;
      setText(w);
      if (w === query) setNonce((n) => n + 1);
      else router.setParams({ q: w });
    },
    [query],
  );

  const suggestions = React.useMemo<DeepSuggestion[]>(() => {
    if (!index || !text.trim() || text.trim() === query) return [];
    return suggestDeep(index, text, 7);
  }, [index, text, query]);

  const busy = state.kind === 'loading';

  return (
    <Screen>
      <View style={{ marginBottom: 18 }}>
        <NightHero
          compact
          scene="path"
          title="Từ điển chuyên sâu"
          sub="Nghĩa, phiên âm Anh–Mỹ, cụm kết hợp và họ từ trong một trang."
          pills={[
            { icon: 'book', label: 'Nghĩa + ví dụ' },
            { icon: 'speaker', label: 'UK · US' },
            { icon: 'gem', label: 'Cụm kết hợp' },
          ]}
        />
      </View>

      <SearchPanel value={text} onChange={setText} onSubmit={go} suggestions={suggestions} busy={busy} showTry={state.kind === 'idle'} />

      <View style={{ marginTop: 20 }}>
        {state.kind === 'loading' ? <Loading query={state.query} /> : null}
        {state.kind === 'done' && state.result.status === 'found' ? <EntryView entry={state.result.entry} wide={wide} onSearch={go} /> : null}
        {state.kind === 'done' && state.result.status !== 'found' ? (
          <Missing result={state.result} onPick={go} onRetry={() => setNonce((n) => n + 1)} />
        ) : null}
      </View>
    </Screen>
  );
}

function Loading({ query }: { query: string }) {
  return (
    <Card pad={26} style={{ alignItems: 'center', gap: 12 }}>
      <ActivityIndicator color={color.primaryDark} />
      <Text style={{ fontFamily: readingFont.sansSemi, fontSize: 16, color: color.body }}>Đang tra “{query}”…</Text>
    </Card>
  );
}

function Missing({ result, onPick, onRetry }: { result: Extract<DeepResult, { status: 'notfound' | 'error' }>; onPick: (w: string) => void; onRetry: () => void }) {
  const isError = result.status === 'error';
  return (
    <Card pad={26} style={{ gap: 14 }}>
      <Text style={{ fontFamily: readingFont.sansHeavy, fontSize: 22, letterSpacing: -0.4, color: color.ink }}>
        {isError ? 'Chưa kết nối được từ điển' : `Không tìm thấy “${result.query}”`}
      </Text>
      <Text style={{ fontFamily: readingFont.sansMedium, fontSize: 15.5, lineHeight: 24, color: color.body }}>
        {isError
          ? 'Từ này chưa có trong kho của app, và từ điển trực tuyến không trả lời. Kiểm tra mạng rồi thử lại.'
          : 'Từ này không có trong kho của app lẫn từ điển trực tuyến. Kiểm tra chính tả, hoặc thử dạng gốc của từ.'}
      </Text>
      {isError ? (
        <Pressable
          accessibilityRole="button"
          onPress={onRetry}
          style={{ alignSelf: 'flex-start', backgroundColor: color.primaryDark, borderRadius: 999, paddingHorizontal: 22, paddingVertical: 11 }}
        >
          <Text style={{ fontFamily: readingFont.sansBold, fontSize: 15, color: '#FFFFFF' }}>Thử lại</Text>
        </Pressable>
      ) : null}
      {result.suggestions.length ? (
        <View style={{ gap: 10 }}>
          <Text style={{ fontFamily: readingFont.sansBold, fontSize: 14, color: color.muted }}>Có phải bạn muốn tìm:</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {result.suggestions.map((s) => (
              <Pressable
                key={s.word}
                accessibilityRole="button"
                onPress={() => onPick(s.word)}
                style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: color.primarySoft }}
              >
                <Text style={{ fontFamily: readingFont.sansBold, fontSize: 15, color: color.primaryDark }}>{s.word}</Text>
                {s.meaningVi ? <Text style={{ fontFamily: readingFont.sans, fontSize: 13, color: color.muted }}>{s.meaningVi}</Text> : null}
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}
    </Card>
  );
}
