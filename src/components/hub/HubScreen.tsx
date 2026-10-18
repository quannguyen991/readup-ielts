import React, { useState, type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import { Icon } from '@/components/ui/Icon';
import { useHubStore, type ProgramMode } from '@/store/useHubStore';
import { useStreak } from '@/store/useStudyStore';
import { COSMIC, GLASS_CARD } from './theme';

const PROGRAMS: { id: ProgramMode; label: string; desc: string; icon: string }[] = [
  { id: 'academic', label: 'Band 9 IELTS Academic', desc: 'Luyện 4 kỹ năng chuyên sâu học thuật', icon: '🎓' },
  { id: 'speaking', label: 'Band 9 Real-Life Speaking', desc: 'Phản xạ giao tiếp & phát âm chuẩn ELSA', icon: '🎙️' },
  { id: 'sat', label: 'Band 9 Digital SAT', desc: 'Chiến thuật Reading & Writing 750+', icon: '⚡' },
];

/** Bề ngang tối đa của nội dung Hub: màn rộng thì giữ cột gọn ở giữa, không dãn hết màn. */
const CONTENT_MAX = 860;

/** Khung chung Cosmic Dark Mode: đầu trang Top Header với Program Switcher & 3 chỉ số Gamification. */
export function HubScreen({
  title,
  subtitle,
  children,
  back,
  scroll = true,
  padBottom = 120,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  back?: boolean;
  scroll?: boolean;
  padBottom?: number;
}) {
  const gems = useHubStore((s) => s.gems);
  const trophyScore = useHubStore((s) => s.trophyScore);
  const selectedProgram = useHubStore((s) => s.selectedProgram);
  const setProgram = useHubStore((s) => s.setProgram);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const displayStreak = useStreak().current;
  const displayTrophy = trophyScore >= 10000 ? '10000+' : String(trophyScore);

  const currentProgram = PROGRAMS.find((p) => p.id === selectedProgram) ?? PROGRAMS[1]!;

  const header = (
    <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12, gap: 10, width: '100%', maxWidth: CONTENT_MAX, alignSelf: 'center' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        {/* Góc trái: Nút back (nếu có) + Tiêu đề Tab & Program Switcher */}
        <View style={{ flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {back ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Quay lại"
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/hub' as never))}
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(120, 68, 21, 0.08)',
                borderWidth: 1,
                borderColor: 'rgba(120, 68, 21, 0.14)',
              }}
            >
              <Icon name="chevron-left" size={20} color={COSMIC.ink} />
            </Pressable>
          ) : null}

          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text numberOfLines={1} style={{ color: COSMIC.ink, fontSize: 22, fontWeight: '800', letterSpacing: -0.3 }}>
                {title}
              </Text>
            </View>

            {/* Dropdown Program Switcher */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Chuyển đổi chương trình học"
              onPress={() => setDropdownOpen(true)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                marginTop: 2,
                alignSelf: 'flex-start', maxWidth: '100%',
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 8,
                backgroundColor: 'rgba(56, 189, 248, 0.12)',
                borderWidth: 1,
                borderColor: 'rgba(56, 189, 248, 0.25)',
              }}
            >
              <Text style={{ fontSize: 11 }}>{currentProgram.icon}</Text>
              <Text numberOfLines={1} style={{ color: COSMIC.blue, fontSize: 11, fontWeight: '700', flexShrink: 1 }}>
                {currentProgram.label}
              </Text>
              <Icon name="chevron-down" size={12} color={COSMIC.blue} />
            </Pressable>
          </View>
        </View>

        {/* Góc phải: Cụm 3 chỉ số Gamification luôn hiển thị */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
          {/* 1. Streak 🔥 */}
          <View
            accessibilityLabel={`Chuỗi ${displayStreak} ngày`}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              paddingHorizontal: 8,
              paddingVertical: 5,
              borderRadius: 20,
              backgroundColor: 'rgba(249, 115, 22, 0.14)',
              borderWidth: 1,
              borderColor: 'rgba(249, 115, 22, 0.35)',
            }}
          >
            <Text style={{ fontSize: 13 }}>🔥</Text>
            <Text style={{ color: '#EA6A12', fontSize: 12, fontWeight: '800' }}>{displayStreak}</Text>
          </View>

          {/* 2. Gems 💎 */}
          <View
            accessibilityLabel={`${gems} đá quý`}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              paddingHorizontal: 8,
              paddingVertical: 5,
              borderRadius: 20,
              backgroundColor: 'rgba(168, 85, 247, 0.14)',
              borderWidth: 1,
              borderColor: 'rgba(168, 85, 247, 0.35)',
            }}
          >
            <Text style={{ fontSize: 13 }}>💎</Text>
            <Text style={{ color: '#7C3AED', fontSize: 12, fontWeight: '800' }}>{gems}</Text>
          </View>

          {/* 3. Trophy 🏆 */}
          <View
            accessibilityLabel={`Cúp ${displayTrophy}`}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              paddingHorizontal: 8,
              paddingVertical: 5,
              borderRadius: 20,
              backgroundColor: 'rgba(245, 158, 11, 0.14)',
              borderWidth: 1,
              borderColor: 'rgba(245, 158, 11, 0.35)',
            }}
          >
            <Text style={{ fontSize: 13 }}>🏆</Text>
            <Text style={{ color: '#B45309', fontSize: 12, fontWeight: '800' }}>{displayTrophy}</Text>
          </View>
        </View>
      </View>

      {subtitle ? <Text numberOfLines={2} style={{ color: COSMIC.muted, fontSize: 12, marginTop: -2 }}>{subtitle}</Text> : null}

      {/* Program Switcher Modal */}
      <Modal visible={dropdownOpen} transparent animationType="fade" onRequestClose={() => setDropdownOpen(false)}>
        <Pressable onPress={() => setDropdownOpen(false)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <View style={[GLASS_CARD, { backgroundColor: '#FFFFFF', padding: 20, gap: 14, width: '100%', maxWidth: 380, borderWidth: 1, borderColor: 'rgba(168, 85, 247, 0.3)' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ color: COSMIC.ink, fontSize: 17, fontWeight: '800' }}>Chọn chương trình học</Text>
              <Pressable onPress={() => setDropdownOpen(false)}>
                <Icon name="close" size={18} color={COSMIC.muted} />
              </Pressable>
            </View>

            <View style={{ gap: 10 }}>
              {PROGRAMS.map((p) => {
                const isSelected = p.id === selectedProgram;
                return (
                  <Pressable
                    key={p.id}
                    onPress={() => {
                      setProgram(p.id);
                      setDropdownOpen(false);
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      padding: 14,
                      borderRadius: 14,
                      backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.15)' : 'rgba(120, 68, 21, 0.05)',
                      borderWidth: 1,
                      borderColor: isSelected ? COSMIC.blue : 'rgba(120, 68, 21, 0.1)',
                    }}
                  >
                    <Text style={{ fontSize: 24 }}>{p.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: isSelected ? COSMIC.blue : COSMIC.ink, fontSize: 15, fontWeight: '700' }}>
                        {p.label}
                      </Text>
                      <Text style={{ color: COSMIC.muted, fontSize: 12, marginTop: 2 }}>{p.desc}</Text>
                    </View>
                    {isSelected ? <Icon name="check" size={18} color={COSMIC.blue} /> : null}
                  </Pressable>
                );
              })}
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );

  return (
    <LinearGradient colors={COSMIC.bg as never} start={{ x: 0, y: 0 }} end={{ x: 0.8, y: 1 }} style={{ flex: 1 }}>
      {header}
      {scroll ? (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: padBottom }} showsVerticalScrollIndicator={false}>
          <View style={{ width: '100%', maxWidth: CONTENT_MAX, alignSelf: 'center', gap: 16 }}>{children}</View>
        </ScrollView>
      ) : (
        <View style={{ flex: 1, paddingHorizontal: 16, paddingBottom: padBottom, width: '100%', maxWidth: CONTENT_MAX, alignSelf: 'center' }}>{children}</View>
      )}
    </LinearGradient>
  );
}
