import React, { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Platform, Pressable, ScrollView, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { router, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/ui/Icon';
import { useL } from '@/i18n/useL';
import { isExamRoute } from '@/navigation/focus-routes';
import { getCatalog, getEntry, entrySubtitle, entryTitle, levelLabel } from '@/services/search/catalog';
import { groupHits, isSearchable, searchEntries } from '@/services/search/match';
import { shortlistIds } from '@/services/search/ai';
import { KIND_LABEL, type SearchEntry, type SearchKind } from '@/services/search/types';
import { useAuthStore } from '@/store/useAuthStore';
import { useSearchStore } from '@/store/useSearchStore';
import { isMac } from './keys';
import { clearRecent, loadRecent, saveRecent } from './recent';

/**
 * BẢNG TÌM BÀI — kiểu bảng lệnh (command palette): gõ là ra kết quả ngay từ chỉ
 * mục trên máy, kèm một dòng "Hỏi AI" cho câu hỏi bằng lời.
 *
 * Mở bằng nút ở thanh bên / thanh trên, Ctrl/⌘+K, hoặc "/" khi không gõ trong ô
 * nhập nào. Gắn MỘT lần trong khung app (`AppShell`), mọi nút mở chỉ bật cờ
 * trong `useSearchStore`.
 *
 * Dùng `Modal` của React Native: trên web nó là một portal ra `body`, bắt được
 * Esc, và trên điện thoại nó là một màn phủ đúng nghĩa.
 */

const C = {
  navy: '#0F1D33',
  navySoft: 'rgba(15,29,51,0.68)',
  navyMuted: 'rgba(15,29,51,0.5)',
  gold: '#B8955A',
  goldDeep: '#8F6E36',
  goldMid: '#A8843F',
  goldLight: '#E2C88F',
  hair: 'rgba(184,149,90,0.38)',
  paper: '#FDFBF3',
  active: '#F5ECD8',
  scrim: 'rgba(15,29,51,0.42)',
} as const;

const KIND_ICON: Record<SearchKind, IconName> = {
  page: 'grid',
  path: 'compass',
  lesson: 'note',
  practice: 'target',
  vocab: 'letters',
  reading: 'book',
  listening: 'volume',
  writing: 'pencil',
  speaking: 'mic',
  test: 'clock',
};

/** Lối tắt khi ô tìm còn trống — mục người mới hay tìm nhất. */
const POPULAR_IDS = [
  'page:sat-roadmap',
  'page:vocab-topics',
  'page:mock-tests',
  'page:write-tests',
  'page:dictation-sets',
  'speaking-mode:p2',
  'page:math-learn',
  'page:sat-full-test',
];

type AiState =
  | { status: 'idle' }
  | { status: 'loading'; query: string }
  | { status: 'done'; query: string; picks: { entry: SearchEntry; reason: string }[]; tip: string }
  | { status: 'fallback'; query: string; note: string }
  | { status: 'error'; query: string; message: string; quota?: boolean; signIn?: boolean };

/** Một dòng điều hướng được bằng phím. */
type NavRow =
  | { type: 'ai' }
  | { type: 'entry'; entry: SearchEntry; reason?: string }
  | { type: 'recent'; query: string };

function prefersReducedMotion(): boolean {
  try {
    return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el || !el.tagName) return false;
  const tag = el.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || tag === 'select' || el.isContentEditable;
}

/**
 * Phím tắt toàn cục (web): Ctrl/⌘+K bật/tắt, "/" mở khi không gõ trong ô nhập.
 * Tắt ở màn đang thi — một bảng bật lên giữa giờ làm bài là quấy rầy.
 */
function useGlobalShortcut() {
  const pathname = usePathname();
  const exam = isExamRoute(pathname);
  useEffect(() => {
    if (Platform.OS !== 'web' || exam) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        useSearchStore.getState().toggle();
        return;
      }
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey && !isTypingTarget(e.target)) {
        if (useSearchStore.getState().open) return;
        e.preventDefault();
        useSearchStore.getState().show();
      }
    };
    // Pha BẮT: ô nhập ẩn của react-native-web ở vài màn luyện (dịch câu, chép
    // chính tả) chặn phím lại, không cho nổi lên cửa sổ.
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [exam]);
}

export function SearchPalette() {
  useGlobalShortcut();
  const open = useSearchStore((s) => s.open);
  const hide = useSearchStore((s) => s.hide);
  const [reduced] = useState(prefersReducedMotion);

  return (
    <Modal visible={open} transparent animationType={reduced ? 'none' : 'fade'} onRequestClose={hide}>
      {open ? <PaletteBody onClose={hide} /> : null}
    </Modal>
  );
}

function PaletteBody({ onClose }: { onClose: () => void }) {
  const { L, locale } = useL();
  const { width } = useWindowDimensions();
  const sheet = width < 640;
  const insets = useSafeAreaInsets();
  const token = useAuthStore((s) => s.session?.access_token ?? null);

  const [query, setQuery] = useState('');
  const deferred = useDeferredValue(query);
  const [recent, setRecent] = useState<string[]>(() => loadRecent());
  // Dòng đang chọn gắn với MỘT danh sách cụ thể: danh sách đổi (gõ thêm chữ,
  // AI trả kết quả) thì tự về dòng mặc định, không cần effect đặt lại.
  const [sel, setSel] = useState<{ key: string; index: number }>({ key: '', index: 0 });
  const [ai, setAi] = useState<AiState>({ status: 'idle' });
  const inputRef = useRef<TextInput>(null);
  const aiSeq = useRef(0);
  /*
    Rê chuột chỉ đổi dòng đang chọn khi chuột THẬT SỰ di chuyển. Không có cờ này
    thì danh sách vẽ lại dưới con trỏ đang đứng yên cũng "rê" vào một dòng giữa
    chừng, và Enter mở nhầm bài.
  */
  const mouseMoved = useRef(false);
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onMove = () => {
      mouseMoved.current = true;
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  const catalog = useMemo(() => getCatalog(), []);
  const trimmed = deferred.trim();
  const searching = isSearchable(trimmed);

  const hits = useMemo(
    () => (searching ? searchEntries(trimmed, catalog, { limit: 60 }) : []),
    [searching, trimmed, catalog],
  );
  const groups = useMemo(() => groupHits(hits, 5), [hits]);
  const popular = useMemo(
    () => POPULAR_IDS.map((id) => getEntry(id)).filter((e): e is SearchEntry => !!e),
    [],
  );

  // AI chỉ đúng với câu đã hỏi; gõ tiếp thì kết quả AI cũ thôi hiện.
  const aiForQuery = ai.status !== 'idle' && ai.query === query.trim() ? ai : null;

  const rows: NavRow[] = useMemo(() => {
    if (!searching) {
      return [
        ...recent.map((q): NavRow => ({ type: 'recent', query: q })),
        ...popular.map((entry): NavRow => ({ type: 'entry', entry })),
      ];
    }
    const out: NavRow[] = [{ type: 'ai' }];
    const shown = new Set<string>();
    if (aiForQuery?.status === 'done') {
      for (const p of aiForQuery.picks) {
        out.push({ type: 'entry', entry: p.entry, reason: p.reason });
        shown.add(p.entry.id);
      }
    }
    for (const g of groups) for (const h of g.hits) if (!shown.has(h.entry.id)) out.push({ type: 'entry', entry: h.entry });
    return out;
  }, [searching, recent, popular, groups, aiForQuery]);

  // Ô đang chọn mặc định: kết quả đầu tiên (dòng "Hỏi AI" khi chưa có kết quả nào).
  const listKey = `${searching ? 1 : 0}|${trimmed}|${rows.length}|${aiForQuery?.status ?? ''}`;
  const active = sel.key === listKey ? Math.min(sel.index, Math.max(0, rows.length - 1)) : searching && rows.length > 1 ? 1 : 0;
  const setActive = useCallback((index: number) => setSel({ key: listKey, index }), [listKey]);
  const hoverTo = useCallback(
    (index: number) => {
      if (Platform.OS === 'web' && !mouseMoved.current) return;
      if (index >= 0) setActive(index);
    },
    [setActive],
  );

  const go = useCallback(
    (href: string) => {
      if (query.trim()) setRecent(saveRecent(query));
      onClose();
      router.push(href as never);
    },
    [query, onClose],
  );

  const askAi = useCallback(async () => {
    const q = query.trim();
    if (!isSearchable(q) || q.length < 2) return;
    const seq = ++aiSeq.current;
    setAi({ status: 'loading', query: q });
    setRecent(saveRecent(q));
    try {
      const ids = shortlistIds(q, catalog);
      const res = await fetch('/api/search/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ query: q, ids }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        picks?: { id: string; reason: string }[];
        tip?: string;
        fallback?: boolean;
        note?: string;
        error?: string;
        quota?: boolean;
        signIn?: boolean;
      };
      if (seq !== aiSeq.current) return;
      if (!res.ok) {
        setAi({
          status: 'error',
          query: q,
          message: body.error ?? L(`Lỗi ${res.status}. Thử lại sau.`, `Error ${res.status}. Please try again.`),
          quota: body.quota,
          signIn: body.signIn,
        });
        return;
      }
      const picks = (body.picks ?? [])
        .map((p) => ({ entry: getEntry(p.id), reason: p.reason ?? '' }))
        .filter((p): p is { entry: SearchEntry; reason: string } => !!p.entry);
      if (body.fallback || picks.length === 0) {
        setAi({
          status: 'fallback',
          query: q,
          note: body.note ?? L('AI chưa chọn được bài. Đây là kết quả tìm thường.', "The AI couldn't pick lessons. Showing regular results."),
        });
        return;
      }
      setAi({ status: 'done', query: q, picks, tip: body.tip ?? '' });
    } catch {
      if (seq !== aiSeq.current) return;
      setAi({
        status: 'fallback',
        query: q,
        note: L('Mất kết nối tới AI. Đây là kết quả tìm thường.', 'Lost connection to the AI. Showing regular results.'),
      });
    }
  }, [query, catalog, token, L]);

  const activate = useCallback(
    (row: NavRow | undefined) => {
      if (!row) return;
      if (row.type === 'ai') void askAi();
      else if (row.type === 'recent') {
        setQuery(row.query);
        inputRef.current?.focus();
      } else go(row.entry.href);
    },
    [askAi, go],
  );

  // Bàn phím (web): ↑ ↓ chọn, Enter mở, Ctrl/⌘+Enter hỏi AI, Esc đóng.
  const state = useRef({ rows, active, activate, askAi, onClose, setActive });
  useEffect(() => {
    state.current = { rows, active, activate, askAi, onClose, setActive };
  });
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onKey = (e: KeyboardEvent) => {
      const s = state.current;
      if (e.key === 'Escape') {
        e.preventDefault();
        s.onClose();
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const n = s.rows.length;
        if (n === 0) return;
        mouseMoved.current = false;
        s.setActive(e.key === 'ArrowDown' ? (s.active + 1) % n : (s.active - 1 + n) % n);
      } else if (e.key === 'Enter' && !e.isComposing) {
        e.preventDefault();
        if (e.ctrlKey || e.metaKey) void s.askAi();
        else s.activate(s.rows[s.active]);
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, []);

  // Giữ dòng đang chọn trong tầm nhìn khi đi bằng phím.
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    document.getElementById(`search-row-${active}`)?.scrollIntoView?.({ block: 'nearest' });
  }, [active]);

  const isActive = (row: NavRow) => rows[active] === row;
  const rowIndex = (row: NavRow) => rows.indexOf(row);

  const panelStyle = sheet
    ? { flex: 1, width: '100%' as const, borderRadius: 0, borderWidth: 0 }
    : { width: '100%' as const, maxWidth: 720, maxHeight: '78%' as const, borderRadius: 16, borderWidth: 1 };

  return (
    <View style={{ flex: 1 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={L('Đóng ô tìm kiếm', 'Close search')}
        onPress={onClose}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: C.scrim }}
      />
      <View
        pointerEvents="box-none"
        style={{ flex: 1, alignItems: 'center', paddingTop: sheet ? 0 : '9%', paddingHorizontal: sheet ? 0 : 16 }}
      >
        <View
          role="dialog"
          aria-modal
          aria-label={L('Tìm bài học', 'Find a lesson')}
          style={[
            panelStyle,
            {
              backgroundColor: C.paper,
              borderColor: C.goldLight,
              overflow: 'hidden',
            },
            Platform.OS === 'web' && !sheet
              ? ({ boxShadow: '0 24px 60px rgba(15,29,51,0.28), 0 0 0 4px rgba(226,200,143,0.18)' } as object)
              : null,
          ]}
        >
          {/* Ô nhập */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              paddingHorizontal: 16,
              paddingTop: (sheet ? 12 : 14) + (sheet ? insets.top : 0),
              paddingBottom: sheet ? 12 : 14,
              borderBottomWidth: 1,
              borderBottomColor: C.hair,
            }}
          >
            <Icon name="search" size={20} color={C.goldMid} strokeWidth={2.1} />
            <TextInput
              ref={inputRef}
              autoFocus
              value={query}
              onChangeText={(text) => {
                mouseMoved.current = false;
                setQuery(text);
              }}
              placeholder={L('Tìm bài: chủ đề môi trường, Task 2, hàm số…', 'Find a lesson: environment, Task 2, functions…')}
              placeholderTextColor={C.navyMuted}
              aria-label={L('Tìm bài học', 'Find a lesson')}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
              onSubmitEditing={Platform.OS === 'web' ? undefined : () => activate(rows[active])}
              className="font-semi"
              style={
                [
                  { flex: 1, minWidth: 0, fontSize: 17, color: C.navy, paddingVertical: 4 },
                  Platform.OS === 'web' ? { outlineStyle: 'none' } : null,
                ] as never
              }
            />
            {query ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={L('Xoá chữ đã gõ', 'Clear')}
                onPress={() => {
                  setQuery('');
                  inputRef.current?.focus();
                }}
                style={{ padding: 4 }}
              >
                <Icon name="close" size={16} color={C.navyMuted} strokeWidth={2} />
              </Pressable>
            ) : null}
            {sheet ? (
              <Pressable accessibilityRole="button" onPress={onClose} style={{ paddingVertical: 6, paddingLeft: 4 }}>
                <Text className="font-strong" style={{ fontSize: 15, color: C.goldDeep }}>
                  {L('Đóng', 'Close')}
                </Text>
              </Pressable>
            ) : (
              <Kbd label="Esc" />
            )}
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            style={sheet ? { flex: 1 } : undefined}
            contentContainerStyle={{ paddingHorizontal: sheet ? 16 : 10, paddingTop: 6, paddingBottom: 14 }}
          >
            {!searching ? (
              <>
                {recent.length > 0 ? (
                  <Section
                    title={L('Tìm gần đây', 'Recent searches')}
                    action={{
                      label: L('Xoá', 'Clear'),
                      onPress: () => {
                        clearRecent();
                        setRecent([]);
                      },
                    }}
                  >
                    {recent.map((q) => {
                      const row = rows.find((r) => r.type === 'recent' && r.query === q)!;
                      return (
                        <RecentRow
                          key={q}
                          query={q}
                          index={rowIndex(row)}
                          active={isActive(row)}
                          onHover={() => hoverTo(rowIndex(row))}
                          onPress={() => activate(row)}
                        />
                      );
                    })}
                  </Section>
                ) : null}
                <Section title={L('Hay được tìm', 'Popular')}>
                  {popular.map((entry) => {
                    const row = rows.find((r) => r.type === 'entry' && r.entry === entry)!;
                    return (
                      <EntryRow
                        key={entry.id}
                        entry={entry}
                        locale={locale}
                        index={rowIndex(row)}
                        active={isActive(row)}
                        onHover={() => hoverTo(rowIndex(row))}
                        onPress={() => activate(row)}
                      />
                    );
                  })}
                </Section>
                <Text className="font-sans" style={{ fontSize: 13, lineHeight: 19, color: C.navyMuted, paddingHorizontal: 8, paddingTop: 10 }}>
                  {L(
                    'Gõ tên bài, chủ đề hay kỹ năng — có dấu hay không dấu đều được. Muốn tả nhu cầu bằng lời thì dùng Hỏi AI.',
                    'Type a lesson, topic or skill — with or without Vietnamese accents. To describe what you need in your own words, use Ask AI.',
                  )}
                </Text>
              </>
            ) : (
              <>
                <AiRow
                  query={query.trim()}
                  index={0}
                  active={active === 0}
                  loading={aiForQuery?.status === 'loading'}
                  onHover={() => hoverTo(0)}
                  onPress={() => void askAi()}
                />

                {aiForQuery ? (
                  <AiBlock
                    state={aiForQuery}
                    locale={locale}
                    rows={rows}
                    active={active}
                    hoverTo={hoverTo}
                    activate={activate}
                    onNavigate={go}
                  />
                ) : null}

                {groups.length === 0 ? (
                  <Text className="font-sans" style={{ fontSize: 15, lineHeight: 22, color: C.navySoft, padding: 12 }}>
                    {L(
                      `Không thấy bài nào khớp “${trimmed}”. Thử từ khác, hoặc Hỏi AI để tả nhu cầu bằng lời.`,
                      `Nothing matches “${trimmed}”. Try other words, or Ask AI to describe what you need.`,
                    )}
                  </Text>
                ) : (
                  groups.map((g) => {
                    const visible = g.hits.filter(
                      (h) => !(aiForQuery?.status === 'done' && aiForQuery.picks.some((p) => p.entry.id === h.entry.id)),
                    );
                    if (visible.length === 0) return null;
                    return (
                      <Section key={g.kind} title={locale === 'en' ? KIND_LABEL[g.kind].en : KIND_LABEL[g.kind].vi}>
                        {visible.map((h) => {
                          const row = rows.find((r) => r.type === 'entry' && !r.reason && r.entry === h.entry);
                          const index = row ? rowIndex(row) : -1;
                          return (
                            <EntryRow
                              key={h.entry.id}
                              entry={h.entry}
                              locale={locale}
                              index={index}
                              active={index === active}
                              onHover={() => hoverTo(index)}
                              onPress={() => go(h.entry.href)}
                            />
                          );
                        })}
                      </Section>
                    );
                  })
                )}
              </>
            )}
          </ScrollView>

          {sheet ? null : (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 16,
                paddingHorizontal: 16,
                paddingVertical: 9,
                borderTopWidth: 1,
                borderTopColor: C.hair,
              }}
            >
              <Hint keys={['↑', '↓']} label={L('chọn', 'move')} />
              <Hint keys={['↵']} label={L('mở', 'open')} />
              <Hint keys={[isMac() ? '⌘' : 'Ctrl', '↵']} label={L('hỏi AI', 'ask AI')} />
              <View style={{ flex: 1 }} />
              <Text className="font-sans" style={{ fontSize: 12, color: C.navyMuted }}>
                {L(`${catalog.length.toLocaleString('vi-VN')} mục`, `${catalog.length.toLocaleString('en-US')} items`)}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Mảnh giao diện
// ---------------------------------------------------------------------------

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: { label: string; onPress: () => void };
  children: React.ReactNode;
}) {
  return (
    <View style={{ marginTop: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 8, marginBottom: 4 }}>
        <Text className="font-strong" style={{ fontSize: 12, letterSpacing: 1.4, textTransform: 'uppercase', color: C.goldDeep }}>
          {title}
        </Text>
        <View style={{ flex: 1, height: 1, backgroundColor: C.hair }} />
        {action ? (
          <Pressable accessibilityRole="button" onPress={action.onPress}>
            <Text className="font-semi" style={{ fontSize: 12, color: C.navyMuted }}>
              {action.label}
            </Text>
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}

function RowShell({
  index,
  active,
  onHover,
  onPress,
  label,
  children,
}: {
  index: number;
  active: boolean;
  onHover: () => void;
  onPress: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      nativeID={index >= 0 ? `search-row-${index}` : undefined}
      accessibilityRole="link"
      accessibilityLabel={label}
      aria-selected={active}
      onHoverIn={onHover}
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 8,
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: active ? C.active : 'transparent',
        borderLeftWidth: 2,
        borderLeftColor: active ? C.gold : 'transparent',
      }}
    >
      {children}
    </Pressable>
  );
}

function KindGlyph({ name, tone = 'plain' }: { name: IconName; tone?: 'plain' | 'ai' }) {
  return (
    <View
      style={{
        width: 34,
        height: 34,
        borderRadius: 9,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: tone === 'ai' ? C.gold : C.hair,
        backgroundColor: tone === 'ai' ? C.navy : '#FFFDF7',
        flexShrink: 0,
      }}
    >
      <Icon name={name} size={17} color={tone === 'ai' ? C.goldLight : C.goldMid} strokeWidth={1.9} />
    </View>
  );
}

function Tag({ label }: { label: string }) {
  return (
    <View style={{ borderWidth: 1, borderColor: C.hair, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 }}>
      <Text className="font-strong" style={{ fontSize: 12, letterSpacing: 0.6, color: C.goldDeep }} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function EntryRow({
  entry,
  locale,
  index,
  active,
  reason,
  onHover,
  onPress,
}: {
  entry: SearchEntry;
  locale: 'vi' | 'en';
  index: number;
  active: boolean;
  reason?: string;
  onHover: () => void;
  onPress: () => void;
}) {
  const title = entryTitle(entry, locale);
  const sub = entrySubtitle(entry, locale);
  const exam = entry.exam === 'both' ? null : entry.exam.toUpperCase();
  return (
    <RowShell index={index} active={active} onHover={onHover} onPress={onPress} label={title}>
      <KindGlyph name={KIND_ICON[entry.kind]} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text className="font-semi" numberOfLines={1} style={{ fontSize: 15.5, lineHeight: 21, color: C.navy }}>
          {title}
        </Text>
        {reason ? (
          <Text className="font-sans" numberOfLines={2} style={{ fontSize: 13.5, lineHeight: 19, color: C.navySoft }}>
            {reason}
          </Text>
        ) : sub ? (
          <Text className="font-sans" numberOfLines={1} style={{ fontSize: 13, lineHeight: 18, color: C.navyMuted }}>
            {sub}
          </Text>
        ) : null}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 0 }}>
        {entry.level ? <Tag label={levelLabel(entry.level, locale)} /> : null}
        {exam ? <Tag label={exam} /> : null}
      </View>
    </RowShell>
  );
}

function RecentRow({
  query,
  index,
  active,
  onHover,
  onPress,
}: {
  query: string;
  index: number;
  active: boolean;
  onHover: () => void;
  onPress: () => void;
}) {
  return (
    <RowShell index={index} active={active} onHover={onHover} onPress={onPress} label={query}>
      <KindGlyph name="clock" />
      <Text className="font-semi" numberOfLines={1} style={{ flex: 1, fontSize: 15.5, color: C.navy }}>
        {query}
      </Text>
    </RowShell>
  );
}

function AiRow({
  query,
  index,
  active,
  loading,
  onHover,
  onPress,
}: {
  query: string;
  index: number;
  active: boolean;
  loading: boolean;
  onHover: () => void;
  onPress: () => void;
}) {
  const { L } = useL();
  return (
    <View style={{ marginTop: 8 }}>
      <RowShell
        index={index}
        active={active}
        onHover={onHover}
        onPress={onPress}
        label={L(`Hỏi AI: ${query}`, `Ask AI: ${query}`)}
      >
        <KindGlyph name="sparkle" tone="ai" />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text className="font-strong" numberOfLines={1} style={{ fontSize: 15.5, lineHeight: 21, color: C.navy }}>
            {L('Hỏi AI', 'Ask AI')}
            <Text className="font-semi" style={{ color: C.goldDeep }}>{`  “${query}”`}</Text>
          </Text>
          <Text className="font-sans" numberOfLines={1} style={{ fontSize: 13, lineHeight: 18, color: C.navyMuted }}>
            {L('AI chọn 3–6 phần hợp nhất trong app và nói vì sao', 'The AI picks the 3–6 best-fitting parts of the app and says why')}
          </Text>
        </View>
        {loading ? <ActivityIndicator size="small" color={C.gold} /> : <Icon name="arrow-right" size={16} color={C.goldMid} strokeWidth={2} />}
      </RowShell>
    </View>
  );
}

function AiBlock({
  state,
  locale,
  rows,
  active,
  hoverTo,
  activate,
  onNavigate,
}: {
  state: Exclude<AiState, { status: 'idle' }>;
  locale: 'vi' | 'en';
  rows: NavRow[];
  active: number;
  hoverTo: (i: number) => void;
  activate: (row: NavRow | undefined) => void;
  onNavigate: (href: string) => void;
}) {
  const { L } = useL();

  const frame = (children: React.ReactNode) => (
    <View
      aria-live="polite"
      style={{
        marginTop: 8,
        marginHorizontal: 2,
        paddingVertical: 8,
        paddingHorizontal: 6,
        borderWidth: 1,
        borderColor: C.goldLight,
        borderRadius: 12,
        backgroundColor: '#FFFDF6',
      }}
    >
      {children}
    </View>
  );

  if (state.status === 'loading') {
    return frame(
      <Text className="font-semi" style={{ fontSize: 14, color: C.navySoft, padding: 8 }}>
        {L('AI đang đọc nhu cầu và chọn bài…', 'The AI is reading your request and picking lessons…')}
      </Text>,
    );
  }

  if (state.status === 'fallback') {
    return frame(
      <Text className="font-sans" style={{ fontSize: 14, lineHeight: 20, color: C.navySoft, padding: 8 }}>
        {state.note}
      </Text>,
    );
  }

  if (state.status === 'error') {
    return frame(
      <View style={{ padding: 8, gap: 8 }}>
        <Text className="font-sans" style={{ fontSize: 14, lineHeight: 20, color: C.navySoft }}>
          {state.message}
        </Text>
        {state.quota || state.signIn ? (
          <Pressable
            accessibilityRole="link"
            onPress={() => onNavigate(state.signIn ? '/auth/sign-in' : '/upgrade')}
            style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6 }}
          >
            <Text className="font-strong" style={{ fontSize: 14, color: C.goldDeep, textDecorationLine: 'underline' }}>
              {state.signIn ? L('Đăng nhập', 'Sign in') : L('Xem các gói học', 'See plans')}
            </Text>
            <Icon name="arrow-right" size={14} color={C.goldDeep} strokeWidth={2} />
          </Pressable>
        ) : null}
      </View>,
    );
  }

  return frame(
    <>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, paddingBottom: 4 }}>
        <Icon name="sparkle" size={13} color={C.goldMid} strokeWidth={2} />
        <Text className="font-strong" style={{ fontSize: 12, letterSpacing: 1.4, textTransform: 'uppercase', color: C.goldDeep }}>
          {L('AI gợi ý cho bạn', 'AI picks for you')}
        </Text>
      </View>
      {state.picks.map((p) => {
        const row = rows.find((r) => r.type === 'entry' && r.reason !== undefined && r.entry === p.entry);
        const index = row ? rows.indexOf(row) : -1;
        return (
          <EntryRow
            key={p.entry.id}
            entry={p.entry}
            locale={locale}
            reason={p.reason || undefined}
            index={index}
            active={index === active}
            onHover={() => hoverTo(index)}
            onPress={() => activate(row ?? { type: 'entry', entry: p.entry })}
          />
        );
      })}
      {state.tip ? (
        <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 10, paddingTop: 8, marginTop: 4, borderTopWidth: 1, borderTopColor: C.hair }}>
          <Text className="font-strong" style={{ fontSize: 13.5, lineHeight: 19, color: C.goldDeep }}>
            {L('Mẹo', 'Tip')}
          </Text>
          <Text className="font-sans" style={{ flex: 1, fontSize: 13.5, lineHeight: 19, color: C.navySoft }}>
            {state.tip}
          </Text>
        </View>
      ) : null}
    </>,
  );
}

function Kbd({ label }: { label: string }) {
  return (
    <View style={{ borderWidth: 1, borderColor: C.hair, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2, backgroundColor: '#FFFDF7' }}>
      <Text className="font-semi" style={{ fontSize: 11.5, color: C.navyMuted }}>
        {label}
      </Text>
    </View>
  );
}

function Hint({ keys, label }: { keys: string[]; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      {keys.map((k) => (
        <Kbd key={k} label={k} />
      ))}
      <Text className="font-sans" style={{ fontSize: 12, color: C.navyMuted }}>
        {label}
      </Text>
    </View>
  );
}
