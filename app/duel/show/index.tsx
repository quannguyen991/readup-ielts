import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui';
import { VOCAB_TOPICS } from '@/data/vocab-topics';
import { isRoomCode, makeRoomCode } from '@/services/duel/duel';
import { useL } from '@/i18n/useL';

/**
 * Sảnh đấu chiếu lớp: giáo viên chọn bộ từ rồi mở phòng. Học sinh nhập mã trên
 * điện thoại; màn chiếu mở `?view=screen` trên máy chiếu với cùng mã.
 */
export default function ShowLobby() {
  const { L, en } = useL();
  const [deck, setDeck] = useState(VOCAB_TOPICS[0]?.slug ?? '');
  const [joinCode, setJoinCode] = useState('');

  const create = () => {
    const code = makeRoomCode();
    router.push(`/duel/show/${code}?host=1&deck=${encodeURIComponent(deck)}` as never);
  };

  return (
    <Screen>
      <View className="w-full self-center" style={{ maxWidth: 820 }}>
        <Text className="font-heavy text-pageTitle text-ink">{L('Đấu chiếu lớp', 'Class showdown')}</Text>
        <Text className="mt-1 font-sans text-bodyLg text-muted">
          {L(
            'Giáo viên mở phòng, học sinh vào bằng điện thoại, màn chiếu hiện câu hỏi và bảng điểm.',
            'The teacher opens a room, students join on their phones, and the big screen shows questions and standings.',
          )}
        </Text>

        <View className="mt-5 rounded-[22px] bg-white p-5">
          <Text className="font-heavy text-bodyLg text-ink">{L('1. Chọn bộ từ', '1. Pick a deck')}</Text>
          <View className="mt-3 flex-row flex-wrap gap-2">
            {VOCAB_TOPICS.map((t) => {
              const on = deck === t.slug;
              return (
                <Pressable
                  key={t.slug}
                  onPress={() => setDeck(t.slug)}
                  accessibilityRole="radio"
                  aria-checked={on}
                  className="rounded-pill px-4 py-2"
                  style={{ backgroundColor: on ? '#0F1D33' : '#F3F0FB' }}
                >
                  <Text className="font-strong text-label" style={{ color: on ? '#FFFFFF' : '#0F1D33' }}>{en ? t.name : t.nameVi}</Text>
                </Pressable>
              );
            })}
          </View>
          <Button className="mt-5 self-start" label={L('Mở phòng', 'Open room')} iconRight="arrow-right" disabled={!deck} onPress={create} />
        </View>

        <Pressable onPress={() => router.push('/duel/challenge' as never)} accessibilityRole="link" className="mt-4 self-start">
          <Text className="font-strong text-body" style={{ color: '#1368CE' }}>{L('Muốn thách bạn bè chơi không cùng lúc? Mở thách đấu →', 'Want a friend to play later? Open a challenge →')}</Text>
        </Pressable>
        <View className="mt-4 rounded-[22px] bg-white p-5">
          <Text className="font-heavy text-bodyLg text-ink">{L('Học sinh vào bằng mã', 'Students join with a code')}</Text>
          <View className="mt-3 flex-row flex-wrap items-center gap-2">
            <TextInput
              value={joinCode}
              onChangeText={(v) => setJoinCode(v.toUpperCase())}
              autoCapitalize="characters"
              maxLength={5}
              placeholder={L('Mã 5 ký tự', '5-character code')}
              placeholderTextColor="#8A8F98"
              className="min-w-[160px] rounded-xl border border-border px-4 py-3 font-heavy text-bodyLg text-ink"
              style={{ letterSpacing: 4 }}
            />
            <Button label={L('Vào phòng', 'Join')} disabled={!isRoomCode(joinCode)} onPress={() => router.push(`/duel/show/${joinCode}` as never)} />
          </View>
          <Text className="mt-3 font-sans text-label text-muted">
            {L('Màn chiếu: mở đường dẫn phòng thêm “?view=screen” trên máy chiếu.', 'Big screen: open the room link with “?view=screen” on the projector.')}
          </Text>
        </View>
      </View>
    </Screen>
  );
}
