import React, { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { LightHero } from '@/components/layout/LightHero';
import { Screen } from '@/components/layout/Screen';
import { Appear } from '@/components/motion/Motion';
import { Button } from '@/components/ui';
import { SAT_VOCAB_LESSONS } from '@/data/lessons/vocab-lessons';
import { VOCAB_TOPICS } from '@/data/vocab-topics';
import { isRoomCode, makeRoomCode } from '@/services/duel/duel';
import { color } from '@/theme/tokens';
import { SealIcon } from '@/components/illust/HeroArt';
import { Label } from '@/components/illust/Sticker';
import { Motion } from '@/components/illust/CuteMore';
import { useL } from '@/i18n/useL';

const CARD = { boxShadow: '0 1px 2px rgba(15,23,42,0.05), 0 12px 30px rgba(94, 72, 35,0.08)' } as object;

const DECKS = [
  ...VOCAB_TOPICS.map((t) => ({ slug: t.slug, name: t.nameVi, nameEn: t.name })),
  ...SAT_VOCAB_LESSONS.map((l) => {
    const name = `${l.subject === 'math' ? 'SAT Math' : 'SAT Verbal'} · ${l.title}`;
    return { slug: l.slug, name, nameEn: name };
  }),
];

/**
 * Sảnh ĐẤU 1–1: chọn bộ từ rồi tạo phòng (nhận mã 5 ký tự để gửi bạn), hoặc
 * nhập mã bạn gửi để vào phòng.
 */
export default function DuelLobby() {
  const { L, en } = useL();
  const [deck, setDeck] = useState(DECKS[0]!.slug);
  const [filter, setFilter] = useState('');
  const [code, setCode] = useState('');
  const shown = useMemo(() => {
    const f = filter.trim().toLowerCase();
    return DECKS.filter((d) => !f || d.name.toLowerCase().includes(f) || d.nameEn.toLowerCase().includes(f)).slice(0, 24);
  }, [filter]);
  const joinCode = code.trim().toUpperCase();

  return (
    <Screen>
      <Appear>
        <LightHero
          scene="vocab"
          art="duel"
          badge={L('ĐẤU 1–1', '1-ON-1 DUEL')}
          line1={L('Thách bạn đấu từ vựng,', 'Challenge a friend to a word duel,')}
          line2={L('ai nhớ nhanh hơn', 'who remembers faster?')}
          subtitle={L('Hai người cùng làm 10 câu của một bộ từ, cùng lúc. Đúng được 100 điểm, trả lời càng nhanh càng được thưởng thêm. Thấy điểm của bạn mình chạy theo thời gian thực.', "Two players answer the same 10 questions from one word set at the same time. Each correct answer scores 100, with a bonus for speed. Watch your friend's score update live.")}
        />
      </Appear>

      <View className="mt-5 flex-row flex-wrap gap-4">
        <Appear index={1} style={{ flexGrow: 2, flexShrink: 1, flexBasis: 420 }}>
          <View className="rounded-[22px] bg-white p-5" style={CARD}>
            <View className="flex-row flex-wrap items-center gap-2.5">
              <View aria-hidden>
                <SealIcon name="plus" color="#F0703F" size={40} />
              </View>
              <Text className="font-heavy text-sectionTitle text-ink">{L('Tạo phòng', 'Create a room')}</Text>
              <View aria-hidden>
                <Motion kind="pop">
                  <Label text={L('Mời bạn ⚔️', 'Invite ⚔️')} color="#F0703F" ink="#FFFFFF" tilt={-4} size={12} />
                </Motion>
              </View>
            </View>
            <Text className="mt-1 font-sans text-body text-muted">{L('Chọn bộ từ để đấu:', 'Pick a word set:')}</Text>
            <TextInput
              value={filter}
              onChangeText={setFilter}
              placeholder={L('Tìm bộ từ…', 'Search word sets…')}
              placeholderTextColor="#94A3B8"
              className="mt-3 rounded-2xl px-4 py-2.5 font-sans text-body text-ink"
              style={{ borderWidth: 1.5, borderColor: '#F0EBE2', backgroundColor: '#FCFBF8' }}
            />
            <View className="mt-3 flex-row flex-wrap gap-2">
              {shown.map((d) => {
                const on = d.slug === deck;
                return (
                  <Pressable
                    key={d.slug}
                    onPress={() => setDeck(d.slug)}
                    className="rounded-pill px-3.5 py-2"
                    style={{ backgroundColor: on ? color.primary : '#F9F6F1' }}
                  >
                    <Text className="font-semi text-label" style={{ color: on ? '#FFFFFF' : color.ink }}>
                      {en ? d.nameEn : d.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Button
              className="mt-4 self-start"
              label={L('Tạo phòng và mời bạn', 'Create room & invite')}
              iconRight="arrow-right"
              onPress={() => router.push(`/duel/${makeRoomCode()}?deck=${deck}&host=1` as never)}
            />
          </View>
        </Appear>

        <Appear index={2} style={{ flexGrow: 1, flexShrink: 1, flexBasis: 280 }}>
          <View className="rounded-[22px] bg-white p-5" style={CARD}>
            <View className="flex-row flex-wrap items-center gap-2.5">
              <View aria-hidden>
                <SealIcon name="arrow-right" color="#B07A3A" size={40} />
              </View>
              <Text className="font-heavy text-sectionTitle text-ink">{L('Vào phòng', 'Join a room')}</Text>
              <View aria-hidden>
                <Motion kind="pop" delay={0.2}>
                  <Label text={L('Có mã? 🔑', 'Got a code? 🔑')} color="#F2B632" ink="#2A1B02" tilt={4} size={12} />
                </Motion>
              </View>
            </View>
            <Text className="mt-1 font-sans text-body text-muted">{L('Nhập mã 5 ký tự bạn của bạn gửi:', 'Enter the 5-character code your friend sent:')}</Text>
            <TextInput
              value={code}
              onChangeText={setCode}
              autoCapitalize="characters"
              maxLength={5}
              placeholder={L('VD: K7Q2M', 'e.g. K7Q2M')}
              placeholderTextColor="#94A3B8"
              className="mt-3 rounded-2xl px-4 py-3 text-center font-heavy text-sectionTitle text-ink"
              style={{ borderWidth: 1.5, borderColor: '#F0EBE2', backgroundColor: '#FCFBF8', letterSpacing: 6 }}
            />
            <Button className="mt-3 self-start" label={L('Vào phòng', 'Join')} disabled={!isRoomCode(joinCode)} onPress={() => router.push(`/duel/${joinCode}` as never)} />
          </View>
        </Appear>
      </View>
      <View className="h-8" />
    </Screen>
  );
}
