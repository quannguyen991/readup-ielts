/*
 * THESIS: Band 9 là một SẢNH VÀNG KIM. Không còn tranh: nền là bộ vàng kim mặc định của giao diện (kem ngà → champagne →
 *   vàng nhạt, như PhoneBackdrop), khung vàng đồng (Frame), thẻ kính ngà (GLASS của phone-theme), nút vàng kim
 *   (GOLD_BUTTON). Mỗi phần app treo như một khung vàng, có nhãn kính ngà ở chân phòng.
 * OWN-WORLD: nền sáng ấm, chữ mực nâu vàng #3B2A10, từ nhấn vàng đồng đậm #8C6A1F (tương phản đạt với nền kem). Ảnh
 *   pixel thành phố của Du ngoạn (public/travel/maps) và bìa sách vẫn là hình thật. Phông: Playfair Display cho tiêu đề
 *   (câu thứ hai nghiêng, ánh kim) + Plus Jakarta Sans cho mọi chữ còn lại.
 * STORY: hiểu Band 9 = luyện đề như thi thật + học tiếng Anh như đi du lịch → đi một vòng năm "phòng" (phòng thi, phòng
 *   luyện nói với AI, Du ngoạn, từ vựng và lộ trình, tủ sách) → biết phần nào mở ngay → bấm "Học thử ngay".
 * FIRST VIEWPORT: trái: tiêu đề 4 dòng (2 dòng sau ánh kim), câu phụ, 2 nút; phải: thẻ câu Reading đã chấm, nghiêng nhẹ.
 *   Điện thoại: chữ + 2 nút, KHÔNG thẻ câu (câu đó đã có ngay bên dưới ở "Phòng thi thật").
 * FORM: người dùng chọn hướng "phòng tranh" (08/10/2026); 15/10/2026 bỏ tranh Van Gogh, đổi sang phong cách vàng kim của dự án.
 * GLASS & MOTION: kính ngà, viền cầu vồng xoay, đèn theo chuột, tia vàng, sao và bụi vàng, hiện dần khi cuộn. Logic và
 *   hiệu ứng ở src/components/gallery/glass.tsx; luật ở DESIGN.md.
 * FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
 */
import React, { useEffect } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useFonts, PlayfairDisplay_700Bold, PlayfairDisplay_600SemiBold_Italic } from '@expo-google-fonts/playfair-display';

import {
  NAVY,
  NAVY_2,
  CREAM,
  MIST,
  GOLD,
  GOLD_DEEP,
  PAPER,
  INK,
  BODY,
  RED,
  GREEN,
  SERIF,
  SERIF_I,
  SANS_4,
  SANS_5,
  SANS_6,
  SANS_7,
  SANS_8,
  isWeb,
  Frame,
} from '@/components/gallery/gallery';
import {
  Aurora,
  BODY_G,
  DEEP_G,
  FX_CSS,
  GOLD_SKY,
  GOLD_SKY_DEEP,
  GOLD_SKY_LOC,
  GlassPanel,
  INK_G,
  LensDefs,
  MUTED_G,
  Motes,
  Plaque,
} from '@/components/gallery/glass';
import { Icon } from '@/components/ui';
import { FREE_SUMMARY, LOCKED_SUMMARY } from '@/lib/access/member-gate';
import { WELCOME_DAYS } from '@/lib/billing/welcome';
import { WELCOME_SEEN_KEY } from '@/lib/welcome-page';
import { useL } from '@/i18n/useL';
import { BOOKS, BOOK_TOTALS } from '@/services/books/catalog';
import { BOOK_BUNDLE_RULE } from '@/services/books/entitlement';

const LOGO = require('../assets/brand/band9-logo-mark.png');
const PARIS = { uri: '/travel/maps/paris.png' };
const THUMBS = [
  ['tokyo', 'Tokyo'],
  ['london', 'London'],
  ['newyork', 'New York'],
  ['singapore', 'Singapore'],
  ['rome', 'Rome'],
] as const;
const thumb = (k: string) => ({ uri: k === 'tokyo' || k === 'newyork' ? `/travel/maps/${k}.png` : `/travel/maps/${k}.small.png` });

/** Chủ đề thật trong kho từ vựng (src/data/seed/vocab-topics). */
const TOPICS_VI = ['Du lịch', 'Thể thao', 'AI và tương lai', 'Ẩm thực', 'Công nghệ', 'Giải trí', 'Vũ trụ'];
const TOPICS_EN = ['Travel', 'Sport', 'AI & the future', 'Food', 'Technology', 'Entertainment', 'Space'];

/** CSS chỉ cho web: màu bôi chọn chữ, vòng sáng khi dùng bàn phím, và sóng giọng nói. */
const WEB_CSS = `
::selection{background:${GOLD};color:${INK_G}}
@keyframes b9wave{0%,100%{transform:scaleY(.35)}50%{transform:scaleY(1)}}
.b9-wave{transform-origin:50% 50%;animation:b9wave 1.1s cubic-bezier(.16,1,.3,1) infinite}
@media (prefers-reduced-motion: reduce){.b9-wave{animation:none}}
[role=button]:focus-visible,[role=link]:focus-visible{outline:2px solid ${DEEP_G};outline-offset:3px}
`;

type LFn = (vi: string, en: string) => string;

export default function WelcomeScreen() {
  const { L, en } = useL();
  const { width, height } = useWindowDimensions();
  const [fontsLoaded, fontError] = useFonts({ PlayfairDisplay_700Bold, PlayfairDisplay_600SemiBold_Italic });
  const wide = width >= 980;
  const mid = width >= 640;
  const pad = wide ? 72 : mid ? 40 : 20;

  useEffect(() => {
    try {
      localStorage.setItem(WELCOME_SEEN_KEY, '1');
    } catch {
      /* chế độ riêng tư: lần sau vẫn thấy trang này */
    }
  }, []);

  const start = () => router.replace('/intro' as never);
  const signup = () => router.push('/auth/sign-in?mode=signup&next=%2Fintro' as never);

  // Chờ phông tiêu đề để không nhảy chữ; lỗi tải phông thì vẫn hiện bằng phông dự phòng.
  if (!fontsLoaded && !fontError) return <View style={{ flex: 1, backgroundColor: GOLD_SKY[1] }} />;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: GOLD_SKY[1] }} contentContainerStyle={{ flexGrow: 1 }}>
      {isWeb ? <style>{WEB_CSS + FX_CSS}</style> : null}
      <LensDefs />

      {/* ===== MÀN ĐẦU: sảnh vàng kim ===== */}
      <View style={{ minHeight: wide ? Math.min(Math.max(720, height), 960) : undefined, overflow: 'hidden' }}>
        <LinearGradient colors={GOLD_SKY} locations={GOLD_SKY_LOC} start={{ x: 0.15, y: 0 }} end={{ x: 0.85, y: 1 }} style={StyleSheet.absoluteFill} />
        <Aurora variant="hero" />
        <Motes />
        <View style={{ flex: 1, paddingHorizontal: pad, paddingBottom: wide ? 40 : 28 }}>
          <GlassPanel
            lens={wide}
            className="b9-rise b9-blur"
            style={{
              marginTop: wide ? 28 : 20,
              marginBottom: wide ? 28 : 20,
              borderRadius: 999,
              paddingLeft: 18,
              paddingRight: 8,
              paddingVertical: 8,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View className="flex-row items-center" style={{ gap: 10 }}>
              <Image source={LOGO} style={{ width: 34, height: 34, borderRadius: 6 }} accessibilityIgnoresInvertColors />
              <Text style={{ color: INK_G, fontSize: 20, fontFamily: SANS_8, letterSpacing: -0.4 }}>Band 9</Text>
            </View>
            <Pressable
              accessibilityRole="link"
              onPress={() => router.push('/auth/sign-in?mode=signin' as never)}
              style={({ hovered }: { hovered?: boolean }) => ({
                paddingHorizontal: 18,
                paddingVertical: 9,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: 'rgba(140,106,31,0.45)',
                backgroundColor: hovered ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.4)',
              })}
            >
              <Text style={{ color: INK_G, fontSize: 15, fontFamily: SANS_7 }}>{L('Đăng nhập', 'Sign in')}</Text>
            </Pressable>
          </GlassPanel>

          <View style={{ flex: 1, flexDirection: wide ? 'row' : 'column', alignItems: wide ? 'flex-end' : 'stretch', gap: wide ? 40 : 36 }}>
            <View style={{ flex: wide ? 1 : undefined, maxWidth: 720, alignSelf: wide ? 'center' : 'auto', paddingTop: wide ? 0 : 20 }}>
              <Text
                accessibilityRole="header"
                className="b9-rise"
                style={{ color: INK_G, fontFamily: SERIF, fontSize: wide ? 84 : mid ? 64 : 46, lineHeight: wide ? 90 : mid ? 70 : 52, letterSpacing: wide ? -1.5 : -0.8 }}
              >
                {L('Luyện thi\nnhư thi thật.', 'Practise like\nthe real exam.')}
                {'\n'}
                <Text className="b9-gold" style={{ color: DEEP_G, fontFamily: SERIF_I }}>{L('Học tiếng Anh\nnhư đi du lịch.', 'Learn English\nlike you travel.')}</Text>
              </Text>
              <Text className="b9-rise b9-d2" style={{ marginTop: 24, color: BODY_G, fontSize: mid ? 20 : 17, lineHeight: mid ? 31 : 27, maxWidth: 540, fontFamily: SANS_5 }}>
                {L(
                  'IELTS và SAT trong một app. Đề như phòng thi, chấm ngay, và cả một thế giới để bạn nói tiếng Anh mỗi ngày.',
                  'IELTS and SAT in one app. Exam-room practice, instant marking, and a whole world to speak English in every day.',
                )}
              </Text>
              <View className="b9-rise b9-d3" style={{ flexDirection: mid ? 'row' : 'column', gap: 12, marginTop: 34 }}>
                <CTA label={L('Học thử ngay', 'Try it now')} onPress={start} solid />
                <CTA label={L('Tạo tài khoản', 'Create account')} onPress={signup} />
              </View>
              <Text style={{ marginTop: 16, color: MUTED_G, fontSize: 14, fontFamily: SANS_5 }}>
                {L(`Miễn phí để bắt đầu · tặng ${WELCOME_DAYS} ngày Plus`, `Free to start · ${WELCOME_DAYS} days of Plus included`)}
              </Text>
            </View>

            {/* Thẻ câu đã chấm chỉ ở màn rộng; điện thoại gặp ngay "Phòng thi thật" phía dưới. */}
            {wide ? (
              <View style={{ width: 420, alignSelf: 'flex-end', marginBottom: 64 }}>
                <View style={{ transform: [{ rotate: '1.5deg' }], ...({ boxShadow: '0 30px 60px rgba(120,80,20,0.28)' } as object), borderRadius: 24 }}>
                  <GlassPanel className="b9-lift b9-blur" style={{ padding: 10, borderRadius: 24 }}>
                    <ExamScreen L={L} compact />
                  </GlassPanel>
                </View>
              </View>
            ) : null}
          </View>

          <View style={{ marginTop: wide ? 0 : 40 }}>
            <Plaque title={L('Sảnh vàng kim', 'The gold hall')} meta={L('Nền mặc định của Band 9', 'The default Band 9 ground')} align={wide ? 'right' : 'left'} />
          </View>
        </View>
      </View>

      {/* ===== CÁC PHÒNG: mỗi phòng là một khung vàng trên nền vàng ===== */}
      <Room wide={wide} pad={pad} plaque={{ title: L('Phòng thi thật', 'The exam room'), meta: L('Phòng 1', 'Room 1') }}>
        <Text accessibilityRole="header" style={{ color: INK_G, fontFamily: SERIF, fontSize: wide ? 60 : mid ? 46 : 36, lineHeight: wide ? 68 : mid ? 54 : 44, textAlign: 'center' }}>
          {L('Đi một vòng Band 9.', 'A walk through Band 9.')}
        </Text>
        <Text style={{ fontFamily: SANS_4, marginTop: 14, color: BODY_G, fontSize: mid ? 18 : 16.5, lineHeight: 27, textAlign: 'center' }}>
          {L('Năm phòng, từ đề thi tới từng câu nói.', 'Five rooms, from the exam paper to every sentence you say.')}
        </Text>
        <View style={{ marginTop: wide ? 96 : 56 }}>
          <Exhibit
            wide={wide}
            frameWidth={560}
            frame={<ExamScreen L={L} />}
            title={L('Phòng thi thật', 'The exam room')}
            line={L('Đồng hồ đếm ngược, chấm ngay, chỉ đúng chỗ sai.', 'A countdown, instant marking, the exact line you missed.')}
            facts={L('IELTS Reading · Listening · Writing · SAT Math · SAT Reading & Writing', 'IELTS Reading · Listening · Writing · SAT Math · SAT Reading & Writing')}
          />
        </View>
      </Room>
      <Room wide={wide} pad={pad} plaque={{ title: L('Phòng luyện nói với AI', 'The AI speaking room'), meta: L('Phòng 2', 'Room 2') }}>
        <Exhibit
          wide={wide}
          flip
          frameWidth={500}
          frame={<SpeakScreen L={L} />}
          title={L('Phòng luyện nói với AI', 'The AI speaking room')}
          line={L('AI hỏi, bạn trả lời, nhận góp ý cho từng câu.', 'The AI asks, you answer, you get feedback on every sentence.')}
          facts={L('Speaking Part 1 · Part 2 · Part 3', 'Speaking Part 1 · Part 2 · Part 3')}
        />
      </Room>
      <Room wide={wide} pad={pad} plaque={{ title: L('Du ngoạn thế giới', 'Travel the world'), meta: L('Phòng 3', 'Room 3') }}>
        <View>
          <View style={{ position: 'relative' }}>
            <Frame>
              <View>
                <Image source={PARIS} style={{ width: '100%', aspectRatio: mid ? 1672 / 940 : 1.1 }} resizeMode="cover" accessibilityLabel={L('Paris trong Du ngoạn', 'Paris in Travel mode')} />
                <View
                  style={
                    mid
                      ? { position: 'absolute', left: '44%', right: 24, top: '30%', gap: 10, alignItems: 'flex-start' }
                      : { position: 'absolute', left: 12, right: 12, bottom: 14, gap: 8, alignItems: 'flex-start' }
                  }
                >
                  <Bubble text="Excuse me, how do I get to the Louvre?" />
                  <Bubble text="Take line 1. It's two stops from here." dark />
                </View>
              </View>
            </Frame>
          </View>
          <View style={{ flexDirection: wide ? 'row' : 'column', gap: wide ? 64 : 28, marginTop: wide ? 48 : 28, alignItems: wide ? 'flex-start' : 'stretch' }}>
            <View style={{ flex: wide ? 1 : undefined }}>
              <Placard
                wide={wide}
                title={L('Du ngoạn thế giới', 'Travel the world')}
                line={L('Hỏi đường, gọi món, nhập học: nói đúng tình huống thật.', 'Ask the way, order food, enrol: speak in real situations.')}
                facts={L('Học speaking qua ngữ cảnh', 'Speaking in context')}
              />
            </View>
            {wide ? (
              <View style={{ flex: 1.2, flexDirection: 'row', gap: 14 }}>
                {THUMBS.map(([k, name]) => (
                  <CityThumb key={k} k={k} name={name} L={L} style={{ flex: 1 }} />
                ))}
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14 }}>
                {THUMBS.map(([k, name]) => (
                  <CityThumb key={k} k={k} name={name} L={L} style={{ width: 150 }} />
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Room>
      <Room wide={wide} pad={pad} plaque={{ title: L('Từ vựng và lộ trình', 'Vocabulary and plan'), meta: L('Phòng 4', 'Room 4') }}>
        <View style={{ gap: wide ? 130 : 80 }}>
          <Exhibit
            wide={wide}
            frameWidth={500}
            frame={<VocabScreen L={L} en={en} />}
            title={L('Từ vựng theo sở thích', 'Vocabulary you care about')}
            line={L('Hơn 4.000 từ trong 111 bộ, chọn chủ đề bạn thích.', 'Over 4,000 words in 111 sets. Pick the topics you like.')}
            facts={L('Ôn lại đúng lúc sắp quên', 'Review right before you forget')}
          />
          <Exhibit
            wide={wide}
            flip
            frameWidth={460}
            frame={<PlanScreen L={L} />}
            title={L('Lộ trình của riêng bạn', 'A plan that is yours')}
            line={L('Đặt mục tiêu band, app xếp việc học mỗi ngày.', 'Set a target band; the app plans every day.')}
            facts={L('Học cá nhân hoá · IELTS và SAT', 'Personalised · IELTS and SAT')}
          />
        </View>
      </Room>
      <Room wide={wide} pad={pad} plaque={{ title: L('Tủ sách PDF', 'The PDF bookshelf'), meta: L('Phòng 5', 'Room 5') }}>
        <Placard
          wide={wide}
          title={L('Tủ sách PDF', 'The PDF bookshelf')}
          line={L(
            `${BOOK_TOTALS.count} cuốn, ${BOOK_TOTALS.pages.toLocaleString('vi-VN')} trang soạn riêng cho Band 9. Đọc thử miễn phí.`,
            `${BOOK_TOTALS.count} books, ${BOOK_TOTALS.pages.toLocaleString('en-US')} pages written for Band 9. Free previews.`,
          )}
          facts={L(`Bản đầy đủ kèm ${BOOK_BUNDLE_RULE}`, 'Full books come with Max or any yearly plan')}
        />
        <Shelf wide={wide} width={Math.min(width - 2 * pad, 1180)} L={L} />
        <View style={{ marginTop: 28, flexDirection: 'row' }}>
          <CTA label={L('Vào tủ sách', 'Open the bookshelf')} onPress={() => router.push('/tu-sach' as never)} />
        </View>
      </Room>

      {/* ===== KẾT: đoạn chốt trên nền vàng đậm hơn ===== */}
      <View style={{ overflow: 'hidden' }}>
        <LinearGradient colors={GOLD_SKY_DEEP} locations={GOLD_SKY_LOC} start={{ x: 0.15, y: 0 }} end={{ x: 0.85, y: 1 }} style={StyleSheet.absoluteFill} />
        <Aurora variant="close" />
        <View style={{ paddingHorizontal: pad, paddingTop: wide ? 150 : 96, paddingBottom: 36 }}>
          <View className="mx-auto w-full" style={{ maxWidth: 820 }}>
            <Text accessibilityRole="header" style={{ color: INK_G, fontFamily: SERIF, fontSize: wide ? 64 : mid ? 48 : 38, lineHeight: wide ? 72 : mid ? 56 : 46, textAlign: 'center' }}>
              {L('Bắt đầu ngay,\n', 'Start now,\n')}
              <Text className="b9-gold" style={{ color: DEEP_G, fontFamily: SERIF_I }}>{L('không cần thẻ.', 'no card needed.')}</Text>
            </Text>
            <GlassPanel className="b9-reveal b9-blur" style={{ marginTop: 40, gap: 20, padding: mid ? 28 : 20, borderRadius: 20 }}>
              <AccessRow label={L('Dùng ngay, không cần tài khoản', 'Open to everyone')} items={en ? FREE_SUMMARY.en : FREE_SUMMARY.vi} free />
              <AccessRow label={L('Cần tài khoản miễn phí', 'Needs a free account')} items={en ? LOCKED_SUMMARY.en : LOCKED_SUMMARY.vi} />
            </GlassPanel>
            <View style={{ flexDirection: mid ? 'row' : 'column', gap: 12, marginTop: 32, justifyContent: 'center' }}>
              <CTA label={L('Học thử ngay', 'Try it now')} onPress={start} solid />
              <CTA label={L(`Tạo tài khoản · tặng ${WELCOME_DAYS} ngày Plus`, `Create account · ${WELCOME_DAYS} days of Plus`)} onPress={signup} />
            </View>
          </View>
          <View style={{ marginTop: wide ? 120 : 72 }}>
            <Plaque title={L('Sảnh vàng kim', 'The gold hall')} meta={L('© Band 9', '© Band 9')} align="center" />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

/* ---------------- Nền, khung, nhãn ---------------- */

/** Một phòng: nền vàng kim liền mạch với đoạn trên và dưới; nhãn kính ngà ở chân phòng. */
function Room({
  wide,
  pad,
  plaque,
  children,
}: {
  wide: boolean;
  pad: number;
  plaque: { title: string; meta: string };
  children: React.ReactNode;
}) {
  return (
    <View className="b9-room" style={{ overflow: 'hidden' }}>
      <LinearGradient colors={GOLD_SKY} locations={GOLD_SKY_LOC} start={{ x: 0.15, y: 0 }} end={{ x: 0.85, y: 1 }} style={StyleSheet.absoluteFill} />
      <Aurora variant="close" />
      <View style={{ paddingHorizontal: pad, paddingTop: wide ? 130 : 80, paddingBottom: wide ? 56 : 40 }}>
        <View className="mx-auto w-full" style={{ maxWidth: 1180 }}>
          {children}
          <View style={{ marginTop: wide ? 110 : 64 }}>
            <Plaque title={plaque.title} meta={plaque.meta} align={wide ? 'right' : 'left'} />
          </View>
        </View>
      </View>
    </View>
  );
}

function Placard({ wide, title, line, facts }: { wide: boolean; title: string; line: string; facts: string }) {
  return (
    <GlassPanel className="b9-reveal" style={{ padding: wide ? 34 : 24, borderRadius: 22 }}>
      <Text accessibilityRole="header" style={{ color: INK_G, fontFamily: SERIF, fontSize: wide ? 44 : 32, lineHeight: wide ? 52 : 40 }}>{title}</Text>
      <Text style={{ fontFamily: SANS_4, marginTop: 14, color: BODY_G, fontSize: wide ? 18 : 16.5, lineHeight: wide ? 29 : 26, maxWidth: 480 }}>{line}</Text>
      <View className="b9-rule" style={{ marginTop: 22, height: isWeb ? 2 : 1, width: 56, backgroundColor: isWeb ? undefined : DEEP_G }} />
      <Text style={{ marginTop: 12, color: DEEP_G, fontSize: 14, lineHeight: 21, fontFamily: SANS_6 }}>{facts}</Text>
    </GlassPanel>
  );
}

function Exhibit({
  wide,
  flip = false,
  frameWidth,
  frame,
  title,
  line,
  facts,
}: {
  wide: boolean;
  flip?: boolean;
  frameWidth: number;
  frame: React.ReactNode;
  title: string;
  line: string;
  facts: string;
}) {
  return (
    <View style={{ flexDirection: wide ? (flip ? 'row-reverse' : 'row') : 'column', alignItems: wide ? 'center' : 'stretch', gap: wide ? 88 : 28 }}>
      <View style={{ flex: wide ? 1.15 : undefined, alignItems: wide ? (flip ? 'flex-start' : 'flex-end') : 'stretch' }}>
        <View className="b9-lift b9-reveal" style={{ width: '100%', maxWidth: frameWidth }}>
          <Frame>{frame}</Frame>
        </View>
      </View>
      <View style={{ flex: wide ? 1 : undefined }}>
        <Placard wide={wide} title={title} line={line} facts={facts} />
      </View>
    </View>
  );
}

function CityThumb({ k, name, L, style }: { k: string; name: string; L: LFn; style: object }) {
  return (
    <View style={style}>
      <GlassPanel style={{ padding: 6, borderRadius: 14 }} className="b9-lift b9-reveal">
        <View style={{ padding: 4, backgroundColor: GOLD_DEEP, borderRadius: 2 }}>
          <Image source={thumb(k)} style={{ width: '100%', aspectRatio: 4 / 3 }} resizeMode="cover" accessibilityLabel={L(`${name} trong Du ngoạn`, `${name} in Travel mode`)} />
        </View>
      </GlassPanel>
      <Text style={{ marginTop: 8, color: INK_G, fontSize: 14, fontFamily: SANS_7 }}>{name}</Text>
    </View>
  );
}

function Bubble({ text, dark = false }: { text: string; dark?: boolean }) {
  return (
    <View
      style={{
        alignSelf: dark ? 'flex-end' : 'flex-start',
        maxWidth: '92%',
        backgroundColor: dark ? NAVY : '#FFFFFF',
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 9,
        ...({ boxShadow: '0 8px 20px rgba(60,40,10,0.28)' } as object),
      }}
    >
      <Text style={{ color: dark ? CREAM : INK, fontSize: 15, fontFamily: SANS_7 }}>{text}</Text>
    </View>
  );
}

/** Kệ 11 bìa sách: máy tính một hàng trên tấm ván vàng, điện thoại vuốt ngang. Bấm bìa là mở Tủ sách. */
function Shelf({ wide, width, L }: { wide: boolean; width: number; L: LFn }) {
  const gap = wide ? 12 : 10;
  const coverW = wide ? Math.floor((width - gap * (BOOKS.length - 1)) / BOOKS.length) : 96;
  const covers = BOOKS.map((b) => (
    <Pressable
      key={b.id}
      accessibilityRole="link"
      accessibilityLabel={L(`${b.title} — mở Tủ sách`, `${b.title} — open the bookshelf`)}
      onPress={() => router.push('/tu-sach' as never)}
      style={{ width: coverW }}
    >
      <Image
        source={{ uri: `/books/covers/${b.id}.jpg` }}
        style={{ width: '100%', aspectRatio: 480 / 680, borderRadius: 2, ...({ boxShadow: '0 10px 22px rgba(60,40,10,.34)' } as object) }}
        resizeMode="cover"
      />
    </Pressable>
  ));
  return (
    <View style={{ marginTop: wide ? 40 : 28 }}>
      {wide ? (
        <View style={{ flexDirection: 'row', gap, alignItems: 'flex-end' }}>{covers}</View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap, alignItems: 'flex-end' }}>
          {covers}
        </ScrollView>
      )}
      <View style={{ height: 7, marginHorizontal: -8, backgroundColor: GOLD_DEEP, borderRadius: 1, ...({ boxShadow: '0 8px 16px rgba(60,40,10,.3)' } as object) }} />
    </View>
  );
}

/* ---------------- Nút ---------------- */

function CTA({ label, onPress, solid = false }: { label: string; onPress: () => void; solid?: boolean }) {
  // Lớp nền nằm ở View bọc ngoài (class kính/kim loại); Pressable chỉ giữ chữ, khoảng đệm và phản hồi bấm.
  // Đặt className lên Pressable có style kiểu hàm làm NativeWind bỏ mất nền, nên không làm vậy.
  const inner = (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }: { pressed?: boolean }) => ({
        paddingHorizontal: 30,
        paddingVertical: 17,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
        transform: [{ translateY: pressed ? 1 : 0 }],
      })}
    >
      <Text style={{ color: INK_G, fontSize: 17, fontFamily: SANS_8 }}>{label}</Text>
      {solid ? <Icon name="arrow-right" size={18} color={INK_G} /> : null}
    </Pressable>
  );
  if (!solid) return <GlassPanel style={{ borderRadius: 999 }}>{inner}</GlassPanel>;
  return (
    <View className="b9-sheen b9-cta-solid" style={{ borderRadius: 999, backgroundColor: isWeb ? undefined : '#EBC26A' }}>
      {inner}
    </View>
  );
}

/* ---------------- Màn app (dựng bằng mã, không ảnh chụp) ---------------- */

function ExamScreen({ L, compact = false }: { L: LFn; compact?: boolean }) {
  const opts: [string, 'wrong' | 'right' | 'none'][] = [
    ['TRUE', 'wrong'],
    ['FALSE', 'none'],
    ['NOT GIVEN', 'right'],
  ];
  return (
    <View style={{ backgroundColor: PAPER, borderRadius: compact ? 16 : 4, overflow: 'hidden' }}>
      <View style={{ backgroundColor: NAVY_2, paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ color: CREAM, fontSize: 13, fontFamily: SANS_7 }}>IELTS Reading · Passage 2</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <Icon name="clock" size={13} color={GOLD} />
          <Text style={{ color: GOLD, fontSize: 13, fontFamily: SANS_7, fontVariant: ['tabular-nums'] }}>18:42</Text>
        </View>
      </View>
      {compact ? null : (
        <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(20,26,51,0.08)' }}>
          <Text style={{ fontFamily: SANS_4, color: BODY, fontSize: 14, lineHeight: 22 }}>
            <Text style={{ fontFamily: SANS_8, color: INK }}>C{'  '}</Text>
            <Text style={{ backgroundColor: 'rgba(241,199,91,0.5)', color: INK }}>Many city parks</Text>
            {' were laid out in the late 19th century, often on land that had once been farms or marshes.'}
          </Text>
        </View>
      )}
      <View style={{ padding: 16 }}>
        <Text style={{ color: INK, fontSize: 15.5, lineHeight: 22, fontFamily: SANS_6 }}>14. Most city parks were designed by engineers.</Text>
        <View style={{ flexDirection: 'row', gap: 7, marginTop: 12, flexWrap: 'wrap' }}>
          {opts.map(([t, s]) => (
            <View
              key={t}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                paddingHorizontal: 11,
                paddingVertical: 7,
                borderRadius: 9,
                borderWidth: 1.5,
                borderColor: s === 'wrong' ? RED : s === 'right' ? GREEN : 'rgba(20,26,51,0.15)',
                backgroundColor: s === 'wrong' ? 'rgba(229,72,77,0.08)' : s === 'right' ? 'rgba(34,160,107,0.10)' : 'transparent',
              }}
            >
              {s !== 'none' ? <Icon name={s === 'right' ? 'check' : 'close'} size={12} color={s === 'right' ? GREEN : RED} /> : null}
              <Text style={{ color: INK, fontSize: 13, fontFamily: SANS_8 }}>{t}</Text>
            </View>
          ))}
        </View>
        <View style={{ marginTop: 12, borderLeftWidth: 3, borderLeftColor: RED, paddingLeft: 10 }}>
          <Text style={{ fontFamily: SANS_4, color: BODY, fontSize: 13.5, lineHeight: 20 }}>
            {L('Đoạn C chỉ nói "nhiều công viên", không nói ai thiết kế. Bạn hay nhầm dạng này.', 'Paragraph C only says "many parks", not who designed them. You often miss this type.')}
          </Text>
        </View>
      </View>
    </View>
  );
}

function SpeakScreen({ L }: { L: LFn }) {
  const bars = [10, 18, 28, 16, 34, 22, 12, 26, 38, 20, 14, 30, 18, 24, 10, 22, 30, 14];
  return (
    <View style={{ backgroundColor: '#0A1428', borderRadius: 4, padding: 18, gap: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ color: MIST, fontSize: 13, fontFamily: SANS_7 }}>Speaking · Part 2</Text>
        <Text style={{ color: GOLD, fontSize: 13, fontFamily: SANS_7, fontVariant: ['tabular-nums'] }}>01:24</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: GOLD_DEEP, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="chat" size={16} color={NAVY} />
        </View>
        <Text style={{ flex: 1, color: CREAM, fontSize: 16, lineHeight: 23, fontFamily: SANS_6 }}>Describe a place you would like to visit in the future.</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: RED, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="mic" size={16} color="#FFFFFF" />
        </View>
        <View style={{ flex: 1, height: 42, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          {bars.map((h, i) => {
            const style = { width: 4, height: h, borderRadius: 2, backgroundColor: GOLD, ...(isWeb ? ({ animationDelay: `${i * 70}ms` } as object) : null) };
            return isWeb ? React.createElement('div', { key: i, className: 'b9-wave', style: { ...style, display: 'block' } }) : <View key={i} style={style} />;
          })}
        </View>
      </View>
      <View style={{ backgroundColor: 'rgba(243,237,225,0.07)', borderRadius: 12, padding: 14, gap: 9 }}>
        <Text style={{ color: CREAM, fontSize: 13.5, fontFamily: SANS_8 }}>{L('Góp ý của AI', 'AI feedback')}</Text>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
          <Icon name="check" size={15} color="#5FD39B" />
          <Text style={{ fontFamily: SANS_4, flex: 1, color: MIST, fontSize: 13.5, lineHeight: 20 }}>{L('Nói liền mạch, ít ngập ngừng.', 'Fluent, with few pauses.')}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
          <Icon name="sparkle" size={15} color={GOLD} />
          <Text style={{ fontFamily: SANS_4, flex: 1, color: MIST, fontSize: 13.5, lineHeight: 20 }}>
            {L('Thử "breathtaking" thay cho "very beautiful".', 'Try "breathtaking" instead of "very beautiful".')}
          </Text>
        </View>
      </View>
    </View>
  );
}

function VocabScreen({ L, en }: { L: LFn; en: boolean }) {
  return (
    <View style={{ backgroundColor: PAPER, borderRadius: 4, padding: 18 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: INK, fontSize: 26, fontFamily: SANS_8 }}>mitigate</Text>
          <Text style={{ fontFamily: SANS_4, color: BODY, fontSize: 14, marginTop: 2 }}>/ˈmɪtɪɡeɪt/ · {L('giảm nhẹ', 'to reduce')}</Text>
        </View>
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: NAVY, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="volume" size={18} color={GOLD} />
        </View>
      </View>
      <Text style={{ fontFamily: SANS_4, marginTop: 12, color: INK, fontSize: 14.5, lineHeight: 22, fontStyle: 'italic' }}>Trees help mitigate the heat in big cities.</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
        <Pill text={L('Môi trường', 'Environment')} />
        <Pill text={L('Ôn lại sau 3 ngày', 'Review in 3 days')} tone="gold" />
      </View>
      <View style={{ height: 1, backgroundColor: 'rgba(20,26,51,0.08)', marginVertical: 16 }} />
      <Text style={{ color: INK, fontSize: 13.5, fontFamily: SANS_8 }}>{L('Chủ đề bạn chọn', 'Your topics')}</Text>
      <View className="flex-row flex-wrap" style={{ gap: 7, marginTop: 10 }}>
        {(en ? TOPICS_EN : TOPICS_VI).map((t, i) => {
          const on = i < 3;
          return (
            <View key={t} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: on ? NAVY : 'rgba(15,29,51,0.06)' }}>
              {on ? <Icon name="check" size={12} color={GOLD} /> : null}
              <Text style={{ color: on ? CREAM : INK, fontSize: 13, fontFamily: SANS_6 }}>{t}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

type IconKey = 'target' | 'refresh' | 'book' | 'mic' | 'pencil';

function PlanScreen({ L }: { L: LFn }) {
  const rows: [IconKey, string, boolean][] = [
    ['target', L('Mục tiêu IELTS 7.0 · SAT 1400', 'Target IELTS 7.0 · SAT 1400'), false],
    ['refresh', L('12 từ cần ôn hôm nay', '12 words to review today'), true],
    ['book', L('1 bài Reading: True / False / Not Given', '1 Reading: True / False / Not Given'), true],
    ['mic', L('5 phút Speaking Part 2', '5 minutes of Speaking Part 2'), false],
    ['pencil', L('10 câu SAT Math', '10 SAT Math questions'), false],
  ];
  return (
    <View style={{ backgroundColor: '#FFFFFF', borderRadius: 4, padding: 20 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ color: INK, fontSize: 15, fontFamily: SANS_8 }}>{L('Hôm nay của bạn', 'Your day')}</Text>
        <Text style={{ color: DEEP_G, fontSize: 13.5, fontFamily: SANS_8, fontVariant: ['tabular-nums'] }}>2 / 4</Text>
      </View>
      <View style={{ marginTop: 10, height: 6, borderRadius: 3, backgroundColor: 'rgba(15,29,51,0.08)' }}>
        <View style={{ width: '50%', height: 6, borderRadius: 3, backgroundColor: GOLD_DEEP }} />
      </View>
      <View style={{ marginTop: 16, gap: 12 }}>
        {rows.map(([icon, text, done], i) => (
          <View key={text} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 32, height: 32, borderRadius: 9, backgroundColor: i === 0 ? NAVY : 'rgba(15,29,51,0.06)', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={icon} size={15} color={i === 0 ? GOLD : NAVY} />
            </View>
            <Text style={{ flex: 1, color: done ? '#8A8FA3' : INK, fontSize: 15, fontFamily: i === 0 ? SANS_7 : SANS_5, textDecorationLine: done ? 'line-through' : 'none' }}>
              {text}
            </Text>
            {done ? <Icon name="check" size={16} color={GREEN} /> : null}
          </View>
        ))}
      </View>
    </View>
  );
}

function Pill({ text, tone = 'plain' }: { text: string; tone?: 'plain' | 'gold' }) {
  return (
    <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: tone === 'gold' ? 'rgba(227,190,106,0.24)' : 'rgba(15,29,51,0.06)' }}>
      <Text style={{ color: tone === 'gold' ? DEEP_G : BODY, fontSize: 12.5, fontFamily: SANS_7 }}>{text}</Text>
    </View>
  );
}

function AccessRow({ label, items, free = false }: { label: string; items: string[]; free?: boolean }) {
  return (
    <View style={{ alignItems: 'center', gap: 10 }}>
      <View className="flex-row items-center" style={{ gap: 7 }}>
        <Icon name={free ? 'check' : 'lock'} size={15} color={free ? '#22A06B' : DEEP_G} />
        <Text style={{ color: INK_G, fontSize: 15, fontFamily: SANS_8 }}>{label}</Text>
      </View>
      <View className="flex-row flex-wrap justify-center" style={{ gap: 8 }}>
        {items.map((x) => (
          <View
            key={x}
            style={{
              paddingHorizontal: 13,
              paddingVertical: 7,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: free ? 'rgba(34,160,107,0.55)' : 'rgba(184,149,90,0.7)',
              backgroundColor: 'rgba(255,255,255,0.45)',
            }}
          >
            <Text style={{ color: free ? '#1E6B4A' : BODY_G, fontSize: 14, fontFamily: SANS_6 }}>{x}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
