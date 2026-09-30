import React, { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';

import { Icon } from '@/components/ui';
import { useWorldIslands } from '@/components/world/useWorldIslands';
import { mountWorld, type WorldHandle } from '@/components/world/world-engine';
import { useHotkeys } from '@/components/vocab/study/StudyKit';
import { islandPosition, nextMission, type Island } from '@/services/world/islands';
import { SealIcon } from '@/components/illust/HeroArt';
import { Label } from '@/components/illust/Sticker';
import { Motion } from '@/components/illust/CuteMore';

const INTRO_KEY = 'readup:world-intro';

const OWL_INTRO = [
  'Chào bạn, mình là Cú. Đây là bản đồ ReadUp: sáu hòn đảo, mỗi đảo là một mảng học.',
  'Giữ phím mũi tên (hoặc WASD) để đi trên sợi sáng, hay bấm thẳng vào một đảo. Tới cổng đảo, nhấn E để vào đảo.',
  'Nhiệm vụ là bài học thật của app. Học xong bài nào, sợi sáng nối tới đảo đó dài thêm. Lạc đường thì bấm "Hỏi Cú".',
];

/**
 * BẢN ĐỒ READUP — thế giới pixel đi lại được, mỗi đảo là một mảng học, nhiệm vụ
 * là bài học thật (`services/world/islands`). Vẽ bằng canvas (`world-engine`);
 * chữ tiếng Việt ở lớp React phía trên vì phông pixel không có dấu.
 */
export default function WorldScreen() {
  const islands = useWorldIslands();

  const host = useRef<View>(null);
  const world = useRef<WorldHandle | null>(null);
  const islandsRef = useRef(islands);
  const [arrived, setArrived] = useState<number | null>(null);
  const [owl, setOwl] = useState<string | null>(null);
  const [introStep, setIntroStep] = useState<number | null>(() => {
    try {
      return typeof localStorage !== 'undefined' && localStorage.getItem(INTRO_KEY) ? null : 0;
    } catch {
      return 0;
    }
  });
  // Tỉ lệ khung CANVAS (không phải cả cửa sổ: trên máy tính còn thanh rail bên trái) — cùng số với world-engine.
  const { width, height } = useWindowDimensions();
  const [box, setBox] = useState({ w: width, h: height });
  const aspect = Math.max(0.4, box.w / Math.max(1, box.h));
  // Số điểm ảnh màn hình cho một điểm ảnh của canvas (canvas cao 232 khi khung ngang, rộng 232 khi khung dọc).
  const scale = aspect >= 1 ? box.h / 232 : box.w / 232;

  useEffect(() => {
    islandsRef.current = islands;
    world.current?.update(islands.map((i) => ({ id: i.id, color: i.color, progress: i.progress })));
  }, [islands]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const el = host.current as unknown as HTMLElement | null;
    if (!el) return;
    const canvas = document.createElement('canvas');
    Object.assign(canvas.style, { width: '100%', height: '100%', display: 'block', imageRendering: 'pixelated', cursor: 'pointer' });
    el.appendChild(canvas);
    world.current = mountWorld(
      canvas,
      islandsRef.current.map((i) => ({ id: i.id, color: i.color, progress: i.progress })),
      { onArrive: (i) => setArrived(i) },
    );
    return () => {
      world.current?.dispose();
      world.current = null;
      canvas.remove();
    };
  }, []);

  const total = islands.reduce((n, i) => n + i.missions.length, 0);
  const done = islands.reduce((n, i) => n + i.done, 0);
  const here: Island | null = arrived === null ? null : islands[arrived] ?? null;

  const closeIntro = () => {
    setIntroStep(null);
    try {
      localStorage.setItem(INTRO_KEY, '1');
    } catch {
      // Trình duyệt chặn lưu: lần sau Cú chào lại, không sao.
    }
  };

  const askOwl = () => {
    const next = nextMission(islands);
    if (!next) {
      setOwl('Bạn đã thắp sáng cả bản đồ. Giỏi quá! Giờ ôn lại những bài còn sai trong Hồ sơ lỗi nhé.');
      return;
    }
    const idx = islands.indexOf(next.island);
    setOwl(`Đi ${next.island.name} nhé — đảo đó đang tối nhất. Nhiệm vụ nên làm: “${next.mission.title}”.`);
    world.current?.goTo(idx);
  };

  const enterIsland = () => {
    if (here) router.push(`/quest/world/${here.id}` as never);
  };

  useHotkeys((e) => {
    if (introStep !== null) {
      if (e.key === 'Enter' || e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        if (introStep + 1 < OWL_INTRO.length) setIntroStep(introStep + 1);
        else closeIntro();
      }
      return;
    }
    const k = e.key.toLowerCase();
    if ((k === 'e' || e.key === 'Enter') && here) enterIsland();
    else if (k === 'h') askOwl();
  });

  if (Platform.OS !== 'web') {
    return (
      <View className="flex-1 items-center justify-center bg-[#0b0b24] p-6">
        <Text className="text-center font-semi text-bodyLg text-white">Bản đồ ReadUp hiện chỉ chạy trên bản web.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, minHeight: 520, backgroundColor: '#0b0b24' }}>
      <View
        ref={host}
        onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
        style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }}
      />

      {/* Tên đảo + số nhiệm vụ, đặt theo đúng toạ độ đảo trên canvas. */}
      {islands.map((isl, i) => {
        const p = islandPosition(i, aspect);
        return (
          <Pressable
            key={isl.id}
            onPress={() => world.current?.goTo(i)}
            style={{ position: 'absolute', left: `${p.x * 100}%`, top: `${p.y * 100}%`, transform: [{ translateX: -70 }, { translateY: 19 * scale }], width: 140 }}
            className="items-center"
          >
            <Text className="text-center font-heavy text-label text-white" style={{ textShadowColor: 'rgba(0,0,0,0.8)', textShadowRadius: 4 }}>
              {isl.name}
            </Text>
            <Text className="font-semi text-label" style={{ color: isl.done ? isl.color : '#94A3B8', fontVariant: ['tabular-nums'] }}>
              {isl.done}/{isl.missions.length} nhiệm vụ
            </Text>
          </Pressable>
        );
      })}

      {/* Góc trên: đường về, tên bản đồ, tổng tiến độ, nút hỏi Cú. */}
      <View className="absolute left-3 right-3 top-3 flex-row flex-wrap items-center justify-between gap-2">
        <View className="flex-row items-center gap-2">
          <Pressable onPress={() => router.replace('/quest' as never)} className="flex-row items-center gap-1.5 rounded-pill px-3 py-2" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
            <Icon name="chevron-left" size={16} color="#E2E8F0" />
            <Text className="font-semi text-label text-white">Quest</Text>
          </Pressable>
          <View className="flex-row items-center gap-1.5 rounded-pill py-1 pl-1 pr-3" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
            <View aria-hidden>
              <SealIcon name="compass" color="#22A06B" size={28} />
            </View>
            <Text className="font-strong text-label text-white">
              Bản đồ ReadUp · <Text style={{ color: '#FDE047' }}>{done}</Text>/{total} nhiệm vụ
            </Text>
          </View>
        </View>
        <Pressable onPress={askOwl} className="flex-row items-center gap-1.5 rounded-pill px-3 py-2" style={{ backgroundColor: '#F59E0B' }}>
          <Icon name="sparkle" size={15} color="#1F1530" />
          <Text className="font-strong text-label" style={{ color: '#1F1530' }}>
            Hỏi Cú · H
          </Text>
        </Pressable>
      </View>

      {/* Bảng nhiệm vụ của đảo đang đứng. */}
      {here && introStep === null ? (
        <View className="absolute bottom-3 right-3 w-[340px] max-w-[92%] rounded-2xl p-4" style={{ backgroundColor: 'rgba(15,15,40,0.94)', borderWidth: 1.5, borderColor: here.color }}>
          <View className="flex-row flex-wrap items-center gap-2">
            <Text className="font-heavy text-cardTitle text-white">{here.name}</Text>
            <View aria-hidden>
              <Motion kind="pop">
                <Label text="Bạn đang ở đây 📍" color="#F2B632" ink="#2A1B02" tilt={-4} size={10} />
              </Motion>
            </View>
          </View>
          <Text className="mt-0.5 font-sans text-label" style={{ color: '#CBD5E1' }}>
            {here.tagline}
          </Text>
          <View className="mt-2.5 h-2 overflow-hidden rounded-pill" style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}>
            <View className="h-2 rounded-pill" style={{ width: `${Math.max(3, here.progress * 100)}%`, backgroundColor: here.color }} />
          </View>
          <Text className="mt-1 font-semi text-label" style={{ color: '#94A3B8' }}>
            Đã xong {here.done}/{here.missions.length}
          </Text>
          <ScrollView style={{ maxHeight: 190 }} className="mt-2">
            {[...here.missions.filter((m) => !m.done), ...here.missions.filter((m) => m.done)].slice(0, 12).map((m) => (
              <Pressable key={m.id} onPress={() => router.push(m.href as never)} className="flex-row items-center gap-2 rounded-lg px-2 py-1.5">
                <Icon name={m.done ? 'check' : 'arrow-right'} size={14} color={m.done ? '#4ADE80' : here.color} />
                <Text className="min-w-0 flex-1 font-semi text-label" style={{ color: m.done ? '#64748B' : '#F1F5F9' }} numberOfLines={1}>
                  {m.title}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          <Pressable onPress={enterIsland} className="mt-3 items-center rounded-xl py-2.5" style={{ backgroundColor: here.color }}>
            <Text className="font-strong text-body text-white">Vào đảo · E</Text>
          </Pressable>
        </View>
      ) : null}

      {/* Hộp thoại của Cú: lời chào lần đầu, hoặc lời khuyên khi bấm "Hỏi Cú". */}
      {introStep !== null || owl ? (
        <View className="absolute bottom-3 left-3 w-[380px] max-w-[92%] rounded-2xl p-4" style={{ backgroundColor: 'rgba(15,15,40,0.96)', borderWidth: 1.5, borderColor: '#F59E0B' }}>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <View aria-hidden>
                <Motion kind="wobble">
                  <SealIcon name="sparkle" color="#F2B632" size={28} />
                </Motion>
              </View>
              <Text className="font-heavy text-body" style={{ color: '#FBBF24' }}>
                Cú dẫn đường
              </Text>
            </View>
            {introStep !== null ? (
              <Text className="font-semi text-label" style={{ color: '#94A3B8' }}>
                {introStep + 1}/{OWL_INTRO.length}
              </Text>
            ) : null}
          </View>
          <Text className="mt-2 font-sans text-body text-white" style={{ lineHeight: 22 }}>
            {introStep !== null ? OWL_INTRO[introStep] : owl}
          </Text>
          <View className="mt-3 flex-row justify-end gap-2">
            {introStep !== null ? (
              <>
                <Pressable onPress={closeIntro} className="rounded-lg px-3 py-2">
                  <Text className="font-semi text-label" style={{ color: '#94A3B8' }}>
                    Bỏ qua
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => (introStep + 1 < OWL_INTRO.length ? setIntroStep(introStep + 1) : closeIntro())}
                  className="rounded-lg px-4 py-2"
                  style={{ backgroundColor: '#F59E0B' }}
                >
                  <Text className="font-strong text-label" style={{ color: '#1F1530' }}>
                    {introStep + 1 < OWL_INTRO.length ? 'Tiếp' : 'Lên đường'}
                  </Text>
                </Pressable>
              </>
            ) : (
              <Pressable onPress={() => setOwl(null)} className="rounded-lg px-4 py-2" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                <Text className="font-strong text-label text-white">Đã hiểu</Text>
              </Pressable>
            )}
          </View>
        </View>
      ) : null}
    </View>
  );
}
