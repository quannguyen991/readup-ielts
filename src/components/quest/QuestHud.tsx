import React from 'react';
import { Text, View } from 'react-native';

export function QuestStat({ icon, value, label, tone = '#FFFFFF', light = false }: { icon: string; value: string | number; label: string; tone?: string; light?: boolean }) {
  return (
    <View className={`min-w-[74px] rounded-panel border px-3 py-2 ${light ? 'border-primary-200 bg-white/65' : 'border-white/15 bg-black/20'}`}>
      <Text className="font-strong text-body" style={{ color: tone }}>{icon} {value}</Text>
      <Text className={`mt-0.5 font-sans text-[10px] ${light ? 'text-slate-500' : 'text-white/55'}`}>{label}</Text>
    </View>
  );
}

export function HealthBar({ value, max, color, label }: { value: number; max: number; color: string; label: string }) {
  const percent = Math.max(0, Math.min(100, (value / Math.max(max, 1)) * 100));
  return (
    <View className="min-w-[130px] flex-1">
      <View className="mb-1 flex-row justify-between">
        <Text className="font-strong text-label text-white">{label}</Text>
        <Text className="font-sans text-label text-white/70">{Math.max(0, value)}/{max}</Text>
      </View>
      <View className="h-3 overflow-hidden rounded-pill bg-black/35">
        <View className="h-full rounded-pill" style={{ width: `${percent}%`, backgroundColor: color }} />
      </View>
    </View>
  );
}
