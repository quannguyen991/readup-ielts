import React, { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Icon } from '@/components/ui';
import { useHotkeys } from '@/components/vocab/study/StudyKit';
import { mountIsland, type IslandHandle } from '@/components/world/island-engine';
import { useWorldIslands } from '@/components/world/useWorldIslands';
import { SealIcon } from '@/components/illust/HeroArt';
import { Label, Sticker } from '@/components/illust/Sticker';
import { CuteGlobe } from '@/components/illust/Cute';
import { Motion } from '@/components/illust/CuteMore';

/**
 * MAP TRONG MỘT ĐẢO (`island-engine`): nhiệm vụ là các bệ đá dọc con đường,
 * nhân vật đi qua lại bằng ←/→ hoặc bấm vào bệ; đứng ở bệ nào thì bảng dưới hiện
 * đúng bài học đó, nhấn E để vào học.
 */
export default function IslandScreen() {
  const { island: id = '' } = useLocalSearchParams<{ island: string }>();
  const islands = useWorldIslands();
  const island = islands.find((i) => i.id === id);
  const host = useRef<View>(null);
  const engine = useRef<IslandHandle | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const islandRef = useRef(island);

  useEffect(() => {
    islandRef.current = island;
    if (island) engine.current?.update(island.missions.map((m) => m.done));
  }, [island]);

  useEffect(() => {
    const current = islandRef.current;
    if (Platform.OS !== 'web' || !current) return;
    const el = host.current as unknown as HTMLElement | null;
    if (!el) return;
    const canvas = document.createElement('canvas');
    Object.assign(canvas.style, { width: '100%', height: '100%', display: 'block', imageRendering: 'pixelated', cursor: 'pointer' });
    el.appendChild(canvas);
    const first = current.missions.findIndex((m) => !m.done);
    engine.current = mountIsland(
      canvas,
      current.id,
      current.missions.map((m) => m.done),
      { start: first < 0 ? 0 : first, onSelect: setSelected },
    );
    return () => {
      engine.current?.dispose();
      engine.current = null;
      canvas.remove();
    };
    // Dựng lại chỉ khi đổi đảo; tiến độ đổi thì `update` ở effect trên lo.
  }, [id]);

  const mission = island && selected !== null ? island.missions[selected] : undefined;

  useHotkeys((e) => {
    const k = e.key.toLowerCase();
    if ((k === 'e' || e.key === 'Enter') && mission) router.push(mission.href as never);
    else if (e.key === 'Escape') router.replace('/quest/world' as never);
  });

  if (!island) {
    return (
      <View className="flex-1 items-center justify-center bg-[#0b0b24] p-6">
        <View aria-hidden className="mb-3">
          <Motion kind="float">
            <Sticker tilt={-8}>
              <CuteGlobe size={64} />
            </Sticker>
          </Motion>
        </View>
        <Text className="font-semi text-bodyLg text-white">Không có đảo này.</Text>
        <Pressable onPress={() => router.replace('/quest/world' as never)} className="mt-3 rounded-pill bg-white/10 px-4 py-2">
          <Text className="font-semi text-body text-white">Về bản đồ</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, minHeight: 480, backgroundColor: '#0b0b24' }}>
      <View ref={host} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, zIndex: 0 }} />

      <View className="absolute left-3 right-3 top-3 flex-row flex-wrap items-center justify-between gap-2" style={{ zIndex: 5 }}>
        <View className="flex-row items-center gap-2">
          <Pressable onPress={() => router.replace('/quest/world' as never)} className="flex-row items-center gap-1.5 rounded-pill px-3 py-2" style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}>
            <Icon name="chevron-left" size={16} color="#F0EBE2" />
            <Text className="font-semi text-label text-white">Bản đồ</Text>
          </Pressable>
          <View className="flex-row items-center gap-1.5 rounded-pill py-1 pl-1 pr-3" style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}>
            <View aria-hidden>
              <SealIcon name="compass" color="#22A06B" size={28} />
            </View>
            <Text className="font-strong text-label text-white">
              {island.name} · <Text style={{ color: '#FDE047' }}>{island.done}</Text>/{island.missions.length}
            </Text>
          </View>
        </View>
        <Text className="font-semi text-label" style={{ color: 'rgba(240, 235, 226,0.75)' }}>
          ← → đi · E vào học · Esc về bản đồ
        </Text>
      </View>

      {mission && selected !== null ? (
        <View
          className="absolute bottom-4 self-center rounded-2xl px-4 py-3"
          style={{ zIndex: 5, width: 460, maxWidth: '94%', backgroundColor: 'rgba(12,12,32,0.92)', borderWidth: 1.5, borderColor: island.color }}
        >
          <View className="flex-row items-center gap-3">
            <View className="h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: mission.done ? '#FACC15' : island.color }}>
              {mission.done ? <Icon name="check" size={18} color="#1F1530" strokeWidth={2.6} /> : <Text className="font-heavy text-body text-white">{selected + 1}</Text>}
            </View>
            <View className="min-w-0 flex-1">
              <View className="flex-row flex-wrap items-center gap-2">
                <Text className="font-semi text-label" style={{ color: '#94A3B8' }}>
                  Nhiệm vụ {selected + 1}/{island.missions.length}
                  {mission.done ? ' · đã xong' : ''}
                </Text>
                {mission.done ? (
                  <View aria-hidden>
                    <Label text="Đã qua ⭐" color="#F2B632" ink="#2A1B02" tilt={-4} size={10} />
                  </View>
                ) : null}
              </View>
              <Text className="font-heavy text-body text-white" numberOfLines={2}>
                {mission.title}
              </Text>
            </View>
            <Pressable onPress={() => router.push(mission.href as never)} className="rounded-xl px-4 py-2.5" style={{ backgroundColor: island.color }}>
              <Text className="font-strong text-label text-white">{mission.done ? 'Làm lại' : 'Vào học'} · E</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}
