import React, { useMemo, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Appear, CrossFade } from '@/components/motion/Motion';
import { Garden3D } from '@/components/three/Garden3D';
import { Button } from '@/components/ui';
import { gardenSummary, plantsFrom, type Plant, type PlantState } from '@/services/vocab/garden';
import { useVocabStore } from '@/store/useVocabStore';
import { color } from '@/theme/tokens';
import { PageStickers, SealIcon } from '@/components/illust/HeroArt';
import { Label, Sticker } from '@/components/illust/Sticker';
import { Badge, type BadgeIcon } from '@/components/illust/Cute';
import { CutePlant, CuteStar, Motion } from '@/components/illust/CuteMore';
import { useL } from '@/i18n/useL';

const STATE_BADGE: Record<PlantState, BadgeIcon> = { thriving: 'star', ok: 'check', wilting: 'clock', dying: 'bolt', seed: 'plus' };

const STATE_UI: Record<PlantState, { label: string; labelEn: string; dot: string; note: string; noteEn: string }> = {
  thriving: { label: 'Xanh tốt', labelEn: 'Thriving', dot: '#22C55E', note: 'Nhớ rất chắc — chưa cần ôn.', noteEn: 'Firmly remembered — no review needed yet.' },
  ok: { label: 'Khoẻ', labelEn: 'Healthy', dot: '#84CC16', note: 'Còn nhớ tốt, sắp tới lượt ôn.', noteEn: 'Still well remembered; review coming up soon.' },
  wilting: { label: 'Sắp héo', labelEn: 'Wilting', dot: '#EAB308', note: 'Độ nhớ đang tụt — ôn trong hôm nay.', noteEn: 'Memory is slipping — review it today.' },
  dying: { label: 'Héo', labelEn: 'Withered', dot: '#B45309', note: 'Gần như đã quên — ôn ngay để cứu cây.', noteEn: 'Almost forgotten — review now to save the plant.' },
  seed: { label: 'Hạt giống', labelEn: 'Seed', dot: '#A3E635', note: 'Mới lưu, chưa ôn lần nào.', noteEn: 'Just saved, not reviewed yet.' },
};

const CARD = { boxShadow: '0 1px 2px rgba(15,23,42,0.05), 0 12px 30px rgba(94, 72, 35,0.1)' } as object;

/**
 * VƯỜN TỪ — sổ từ hiện thành một hòn đảo 3D, mỗi từ một cây. Cây khoẻ hay héo
 * đúng bằng độ nhớ hiện tại của từ đó theo FSRS (`services/vocab/garden.ts`).
 * Không ôn thì cây héo dần — "tưới" = ôn từ ở màn Luyện từ vựng.
 */
export default function GardenScreen() {
  const entries = useVocabStore((s) => s.entries);
  const cards = useVocabStore((s) => s.cards);
  const { L } = useL();
  const [now] = useState(() => new Date());
  const [selected, setSelected] = useState<string | null>(null);

  const plants = useMemo(() => {
    const list = Object.values(entries).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return plantsFrom(list.map((e) => ({ id: e.id, word: e.word, definitionVi: e.definitionVi })), cards, now);
  }, [entries, cards, now]);
  const sum = gardenSummary(plants);
  const picked = plants.find((p) => p.id === selected) ?? null;
  const thirsty = plants.filter((p) => p.state === 'wilting' || p.state === 'dying').sort((a, b) => a.memory - b.memory);

  return (
    <Screen>
      <Appear>
        <View className="flex-row flex-wrap items-end justify-between gap-3">
          <View style={{ minWidth: 240, flexShrink: 1 }}>
            <View className="flex-row items-center gap-3">
              <Text className="min-w-0 flex-1 font-heavy text-pageTitle text-ink">{L('Vườn từ', 'Word garden')}</Text>
              <View aria-hidden>
                <PageStickers scene="garden" />
              </View>
            </View>
            <Text className="mt-1 font-sans text-bodyLg text-muted">
              {L('Mỗi từ là một cây. Không ôn là héo.', 'Each word is a plant. Skip reviews and it wilts.')}
            </Text>
          </View>
          {sum.needWater > 0 ? (
            <Button label={L(`Tưới ${sum.needWater} cây sắp héo`, `Water ${sum.needWater} wilting plants`)} iconLeft="refresh" onPress={() => router.push('/vocabulary/topic/so-tu/learn' as never)} />
          ) : null}
        </View>
      </Appear>

      <Appear index={1}>
        <View className="mt-4 flex-row flex-wrap gap-2">
          {(['thriving', 'ok', 'wilting', 'dying', 'seed'] as const).map((k) => (
            <View key={k} className="flex-row items-center gap-2 rounded-pill bg-white/90 px-3.5 py-2">
              <View aria-hidden>
                <Badge icon={STATE_BADGE[k]} color={STATE_UI[k].dot} size={22} />
              </View>
              <Text className="font-heavy text-body text-ink">{sum[k]}</Text>
              <Text className="font-sans text-label text-muted">{L(STATE_UI[k].label, STATE_UI[k].labelEn)}</Text>
            </View>
          ))}
        </View>
      </Appear>

      {plants.length === 0 ? (
        <Appear index={2}>
          <View className="mt-5 rounded-[22px] bg-white p-6" style={CARD}>
            <View aria-hidden className="mb-3 flex-row items-center gap-3">
              <Motion kind="float">
                <Sticker tilt={-6}>
                  <CutePlant size={64} />
                </Sticker>
              </Motion>
              <Label text={L('Gieo hạt đầu tiên 🌱', 'Plant your first seed 🌱')} color="#22A06B" ink="#FFFFFF" tilt={-4} size={13} />
            </View>
            <Text className="font-heavy text-sectionTitle text-ink">{L('Vườn đang trống', 'Your garden is empty')}</Text>
            <Text className="mt-1 font-sans text-bodyLg text-muted">
              {L('Lưu từ khi đọc để gieo hạt.', 'Save words while reading to plant seeds.')}
            </Text>
            <View className="mt-4 flex-row flex-wrap gap-2">
              <Button label={L('Từ vựng chủ đề', 'Topic vocabulary')} onPress={() => router.push('/vocabulary/topics' as never)} />
              <Button variant="outline" label={L('Đọc bài', 'Read a passage')} onPress={() => router.push('/library' as never)} />
            </View>
          </View>
        </Appear>
      ) : (
        <View className="mt-5 flex-row flex-wrap gap-4">
          <Appear index={2} style={{ flexGrow: 3, flexShrink: 1, flexBasis: 480 }}>
            <View
              className="overflow-hidden rounded-[26px]"
              style={[{ height: 480, backgroundColor: '#F9F2E5', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.9)' }, CARD]}
            >
              {Platform.OS === 'web' ? (
                <Garden3D plants={plants} selected={selected} onPick={setSelected} style={{ flex: 1 }} />
              ) : (
                <FlatGarden plants={plants} onPick={setSelected} />
              )}
              <Text className="absolute bottom-3 left-4 font-sans text-label text-muted">{L('Kéo để xoay đảo · bấm vào cây để xem từ', 'Drag to rotate the island · tap a plant to see its word')}</Text>
            </View>
          </Appear>

          <Appear index={3} style={{ flexGrow: 2, flexShrink: 1, flexBasis: 280 }}>
            <View className="rounded-[22px] bg-white p-5" style={CARD}>
              <CrossFade swapKey={picked?.id ?? 'none'}>
                {picked ? (
                  <PlantPanel plant={picked} />
                ) : (
                  <View>
                    <View className="flex-row items-center gap-2.5">
                      <View aria-hidden>
                        <SealIcon name="leaf" color="#F0703F" size={36} />
                      </View>
                      <Text className="min-w-0 flex-1 font-heavy text-cardTitle text-ink">{L('Cây cần tưới trước', 'Water these first')}</Text>
                      {thirsty.length > 0 ? (
                        <View aria-hidden>
                          <Label text={L('Ôn hôm nay', 'Review today')} color="#F2B632" tilt={4} size={12} />
                        </View>
                      ) : null}
                    </View>
                    <Text className="mt-1 font-sans text-body text-muted">{L('Những từ độ nhớ thấp nhất. Bấm để xem trên đảo.', 'Your least-remembered words. Tap to find them on the island.')}</Text>
                    <View className="mt-3 gap-2">
                      {thirsty.slice(0, 8).map((p) => (
                        <Pressable key={p.id} onPress={() => setSelected(p.id)} className="flex-row items-center gap-3 rounded-2xl px-3 py-2.5" style={{ backgroundColor: '#FFFBEB' }}>
                          <View className="h-3 w-3 rounded-pill" style={{ backgroundColor: STATE_UI[p.state].dot }} />
                          <Text className="min-w-0 flex-1 font-semi text-body text-ink" numberOfLines={1}>
                            {p.word}
                          </Text>
                          <Text className="font-sans text-label text-muted">{Math.round(p.memory * 100)}%</Text>
                        </Pressable>
                      ))}
                      {thirsty.length === 0 ? (
                        <View className="flex-row items-center gap-3">
                          <View aria-hidden>
                            <Motion kind="wobble">
                              <Sticker tilt={6}>
                                <CuteStar size={40} />
                              </Sticker>
                            </Motion>
                          </View>
                          <Text className="min-w-0 flex-1 font-semi text-body" style={{ color: '#15803D' }}>
                            {L('Không cây nào sắp héo. Vườn đang rất tươi!', 'No plants are wilting. Your garden is thriving!')}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                )}
              </CrossFade>
            </View>
          </Appear>
        </View>
      )}
      <View className="h-8" />
    </Screen>
  );
}

function PlantPanel({ plant }: { plant: Plant }) {
  const ui = STATE_UI[plant.state];
  const { L } = useL();
  const due = plant.nextDue ? new Date(plant.nextDue) : null;
  return (
    <View>
      <View className="flex-row items-center gap-2">
        <View className="h-3.5 w-3.5 rounded-pill" style={{ backgroundColor: ui.dot }} />
        <Text className="font-strong text-label uppercase tracking-[1.2px]" style={{ color: color.muted }}>
          {L(ui.label, ui.labelEn)}
        </Text>
      </View>
      <Text className="mt-2 font-heavy text-pageTitle text-ink">{plant.word}</Text>
      <Text className="mt-0.5 font-semi text-bodyLg text-ink">{plant.meaningVi}</Text>
      <Text className="mt-2 font-sans text-body text-muted">{L(ui.note, ui.noteEn)}</Text>
      <View className="mt-4 h-3 overflow-hidden rounded-pill" style={{ backgroundColor: '#F0EBE2' }}>
        <View className="h-3 rounded-pill" style={{ width: `${Math.round(plant.memory * 100)}%`, backgroundColor: ui.dot }} />
      </View>
      <Text className="mt-1.5 font-sans text-label text-muted">
        {L(
          `Độ nhớ ${Math.round(plant.memory * 100)}% · nhớ bền khoảng ${Math.max(0, Math.round(plant.stability))} ngày`,
          `Memory ${Math.round(plant.memory * 100)}% · stable for about ${Math.max(0, Math.round(plant.stability))} days`,
        )}
        {due ? L(` · ôn lần tới ${due.getDate()}/${due.getMonth() + 1}`, ` · next review ${due.getMonth() + 1}/${due.getDate()}`) : ''}
        {plant.flower ? L(' · đã nở hoa 🌸', ' · in bloom 🌸') : ''}
      </Text>
      <Button className="mt-4 self-start" label={L('Tưới (ôn ngay)', 'Water (review now)')} iconRight="arrow-right" onPress={() => router.push('/vocabulary/topic/so-tu/learn' as never)} />
    </View>
  );
}

/** Bản phẳng cho app native: lưới chấm màu, bấm để xem từ. */
function FlatGarden({ plants, onPick }: { plants: readonly Plant[]; onPick: (id: string) => void }) {
  return (
    <View className="flex-1 flex-row flex-wrap content-start gap-2 p-5">
      {plants.map((p) => (
        <Pressable key={p.id} onPress={() => onPick(p.id)} className="items-center justify-center rounded-pill" style={{ width: 34, height: 34, backgroundColor: STATE_UI[p.state].dot }}>
          <Text className="font-heavy text-label text-white">{p.word[0]}</Text>
        </Pressable>
      ))}
    </View>
  );
}
