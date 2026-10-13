import React from 'react';
import { Platform, Text, View } from 'react-native';

/** Cửa sổ học pastel cho thanh bên, điểm ba nhân vật Chiikawa đang bám mép. */
export function SidebarStickerWindow() {
  return (
    <View
      pointerEvents="none"
      className="mb-2 overflow-hidden rounded-2xl"
      style={{
        borderWidth: 1,
        borderColor: '#E9A9BD',
        backgroundColor: '#FFFDFD',
        ...(Platform.OS === 'web' ? { boxShadow: '0 4px 12px rgba(169,83,111,0.12)' } : null),
      }}
    >
      <View className="h-6 flex-row items-center justify-between px-2.5" style={{ backgroundColor: '#F7C6D5' }}>
        <Text className="font-strong text-[9px] tracking-[1.1px]" style={{ color: '#754854' }}>BAND 9  ·  STUDY CLUB</Text>
        <View className="flex-row gap-1">
          {['#FFF3B0', '#FFD8E4', '#F08EAD'].map((dot) => <View key={dot} className="h-2 w-2 rounded-full" style={{ backgroundColor: dot, borderWidth: 0.6, borderColor: '#C87992' }} />)}
        </View>
      </View>
      <View className="h-[58px] flex-row items-center justify-between px-2.5" style={{ backgroundColor: '#FFF8FA' }}>
        <View className="min-w-0 flex-1">
          <Text className="font-strong text-[12px]" style={{ color: '#70424F' }}>Góc học xinh xắn</Text>
          <Text className="mt-0.5 font-medium text-[10px]" style={{ color: '#A17E8A' }}>Học một chút, giỏi hơn một chút ♡</Text>
          <Text style={{ color: '#E78CA8', fontSize: 9 }}>♥  ✦  ♥  ✦  ♥</Text>
        </View>
      </View>
      <View className="h-5 flex-row items-center gap-1.5 px-2.5" style={{ backgroundColor: '#FBE7ED' }}>
        <Text className="font-strong text-[8px]" style={{ color: '#A8647A' }}>♡ XP</Text>
        <View className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ backgroundColor: '#F2CAD6' }}>
          <View className="h-full w-2/3 rounded-full" style={{ backgroundColor: '#E78CA8' }} />
        </View>
        <Text className="text-[8px]" style={{ color: '#C47790' }}>✦ ♡</Text>
      </View>
    </View>
  );
}
