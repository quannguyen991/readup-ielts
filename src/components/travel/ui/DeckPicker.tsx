import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Icon } from '@/components/ui/Icon';
import { useFocusDecks } from '@/components/travel/useTravel';
import { GameButton, PixelPanel, T } from '@/components/travel/ui/kit';
import { bi, useL } from '@/i18n/useL';
import { deckCatalog } from '@/services/travel/deck-catalog';
import { MAX_CHOSEN_DECKS, toggleDeck } from '@/services/travel/decks';
import { useTravelStore } from '@/store/useTravelStore';

/**
 * Chọn bộ từ để học khi du ngoạn. `DeckBar` là một dòng tóm tắt + nút "Chọn bộ từ"; bấm mở
 * `DeckSheet` (chọn nhiều bộ, lưu ngay vào kho du ngoạn và đồng bộ theo tài khoản).
 * "Theo lộ trình" chọn một chạm các bộ từ vựng của trình độ trong Lộ trình học; chưa có lộ trình
 * thì nút tắt và hiện "—", không đoán trình độ.
 */
export function DeckBar({ compact = false }: { compact?: boolean }) {
  const { L, locale } = useL();
  const [open, setOpen] = useState(false);
  const focus = useFocusDecks();
  const names = useMemo(() => new Map(deckCatalog().map((d) => [d.slug, bi(d.name, locale)])), [locale]);

  const summary =
    focus.source === 'chosen'
      ? L(`${focus.decks.length} bộ bạn chọn`, `${focus.decks.length} deck${focus.decks.length > 1 ? 's' : ''} you picked`)
      : focus.source === 'path'
        ? L(`Theo lộ trình · ${focus.decks.length} bộ`, `Following your path · ${focus.decks.length} decks`)
        : L('Bộ từ của từng địa điểm', 'Each place’s own decks');
  const detail = focus.decks
    .slice(0, 3)
    .map((d) => names.get(d) ?? d)
    .join(', ');

  return (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <View style={{ flex: 1, minWidth: 160 }}>
          <Text className="font-strong" style={{ fontSize: compact ? 14 : 15, color: T.ink }}>
            {L('Từ vựng: ', 'Words: ')}
            {summary}
          </Text>
          {detail && !compact ? (
            <Text className="font-sans" numberOfLines={1} style={{ fontSize: 14, color: T.muted }}>
              {detail}
              {focus.decks.length > 3 ? '…' : ''}
            </Text>
          ) : null}
        </View>
        <GameButton small tone="paper" icon="book" label={L('Chọn bộ từ', 'Choose decks')} onPress={() => setOpen(true)} />
      </View>
      {open ? <DeckSheet onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function DeckSheet({ onClose }: { onClose: () => void }) {
  const { L, locale } = useL();
  const chosen = useTravelStore((s) => s.decks) ?? [];
  const setDecks = useTravelStore((s) => s.setDecks);
  const focus = useFocusDecks();
  const [group, setGroup] = useState<'topic' | 'listening'>('topic');
  const catalog = useMemo(() => deckCatalog(), []);
  const shown = catalog.filter((d) => d.group === group);
  const pathOn = focus.path.length > 0 && chosen.length === focus.path.length && focus.path.every((d) => chosen.includes(d));

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(15,29,51,0.6)', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <PixelPanel style={{ width: '100%', maxWidth: 640, maxHeight: '92%' }} inner={{ padding: 16, gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Text className="font-heavy" style={{ flex: 1, fontSize: 20, color: T.ink }} accessibilityRole="header">
              {L('Bộ từ để học', 'Decks to study')}
            </Text>
            <Text className="font-strong" style={{ fontSize: 14, color: T.muted }}>
              {chosen.length}/{MAX_CHOSEN_DECKS}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            <GameButton
              small
              tone={pathOn ? 'gold' : 'paper'}
              icon="compass"
              label={focus.path.length ? L('Theo lộ trình', 'Follow my path') : L('Theo lộ trình: —', 'Follow my path: —')}
              disabled={!focus.path.length}
              onPress={() => setDecks(focus.path)}
            />
            {chosen.length ? <GameButton small tone="ghost" label={L('Bỏ chọn hết', 'Clear')} onPress={() => setDecks([])} /> : null}
            {!focus.path.length ? (
              <GameButton small tone="ghost" label={L('Lập lộ trình', 'Set up a path')} onPress={() => { onClose(); router.push('/lo-trinh-hoc' as never); }} />
            ) : null}
          </View>
          {focus.path.length && focus.levelLabel ? (
            <Text className="font-sans" style={{ fontSize: 14, color: T.muted }}>
              {L(`Trình độ lộ trình: ${focus.levelLabel}`, `Path level: ${focus.levelLabel}`)}
            </Text>
          ) : null}

          <View style={{ flexDirection: 'row', gap: 8 }}>
            {(['topic', 'listening'] as const).map((g) => (
              <Pressable
                key={g}
                accessibilityRole="tab"
                accessibilityState={{ selected: group === g }}
                onPress={() => setGroup(g)}
                style={{ minHeight: 44, paddingHorizontal: 14, justifyContent: 'center', borderRadius: 6, borderWidth: 2, borderColor: group === g ? T.navy : T.line, backgroundColor: group === g ? T.goldLight : T.paper }}
              >
                <Text className="font-strong" style={{ fontSize: 14, color: T.ink }}>
                  {g === 'topic' ? L('Chủ đề', 'Topics') : L('Nghe', 'Listening')} ({catalog.filter((d) => d.group === g).length})
                </Text>
              </Pressable>
            ))}
          </View>

          <ScrollView style={{ maxHeight: 360 }} contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 4 }}>
            {shown.map((d) => {
              const on = chosen.includes(d.slug);
              const full = !on && chosen.length >= MAX_CHOSEN_DECKS;
              return (
                <Pressable
                  key={d.slug}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on, disabled: full }}
                  disabled={full}
                  onPress={() => setDecks(toggleDeck(chosen, d.slug))}
                  style={{ minHeight: 44, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 6, borderWidth: 2, borderColor: on ? T.navy : T.line, backgroundColor: on ? T.goldLight : T.paper, opacity: full ? 0.5 : 1 }}
                >
                  {on ? <Icon name="check" size={14} color={T.navy} strokeWidth={2.6} /> : null}
                  <Text className="font-strong" style={{ fontSize: 14, color: T.ink }}>
                    {bi(d.name, locale)}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Text className="font-sans" style={{ fontSize: 14, color: T.muted }}>
            {chosen.length ? L('Từ trong các bộ này được hỏi trước.', 'Words from these decks come first.') : L('Chưa chọn: dùng lộ trình, rồi bộ của từng địa điểm.', 'None picked: your path first, then each place’s decks.')}
          </Text>
          <GameButton label={L('Xong', 'Done')} onPress={onClose} />
        </PixelPanel>
      </View>
    </Modal>
  );
}
