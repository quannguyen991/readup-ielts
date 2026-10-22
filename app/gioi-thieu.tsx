/*
 * THESIS: Band 9 là một SẢNH VÀNG KIM. Không còn tranh: nền là bộ vàng kim mặc định của giao diện (kem ngà → champagne →
 *   vàng nhạt, như PhoneBackdrop), khung vàng đồng (Frame), thẻ kính ngà (GLASS của phone-theme), nút vàng kim
 *   (GOLD_BUTTON). Mỗi phần app treo như một khung vàng, có nhãn kính ngà ở chân phòng.
 * OWN-WORLD: nền sáng ấm, chữ mực nâu vàng #2B2350, từ nhấn vàng đồng đậm #6A4BD9 (tương phản đạt với nền kem). Ảnh
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
import { themedHex } from '@/theme/palette-state';
import React, { useEffect, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MeshBackdrop } from '@/components/layout/MeshBackdrop';
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
import { Confetti } from '@/components/motion/Confetti';
import { CuteBulb, CuteCalculator, CuteChat, CuteHeadphones, CuteMagnifier, CuteMic, CuteNotebook, CuteStar, CuteTrophy } from '@/components/illust/CuteMore';
import { CuteBook, CuteCalendar, CuteGlobe } from '@/components/illust/Cute';
import { FREE_SUMMARY, LOCKED_SUMMARY } from '@/lib/access/member-gate';
import { WELCOME_DAYS } from '@/lib/billing/welcome';
import { WELCOME_SEEN_KEY } from '@/lib/welcome-page';
import { useL } from '@/i18n/useL';
import { BOOKS, BOOK_TOTALS } from '@/services/books/catalog';
import { BOOK_BUNDLE_RULE } from '@/services/books/entitlement';

const LOGO = require('../assets/brand/band9-logo-mark.png');
const PARIS = { uri: '/travel/maps/paris.webp' };
const THUMBS = [
  ['tokyo', 'Tokyo'],
  ['london', 'London'],
  ['newyork', 'New York'],
  ['singapore', 'Singapore'],
  ['rome', 'Rome'],
] as const;
const thumb = (k: string) => ({ uri: k === 'tokyo' || k === 'newyork' ? `/travel/maps/${k}.webp` : `/travel/maps/${k}.small.webp` });

/** Chủ đề thật trong kho từ vựng (src/data/seed/vocab-topics). */
const TOPICS_VI = ['Du lịch', 'Thể thao', 'AI và tương lai', 'Ẩm thực', 'Công nghệ', 'Giải trí', 'Vũ trụ'];
const TOPICS_EN = ['Travel', 'Sport', 'AI & the future', 'Food', 'Technology', 'Entertainment', 'Space'];

/** CSS chỉ cho web: màu bôi chọn chữ, vòng sáng khi dùng bàn phím, và sóng giọng nói. */
const WEB_CSS = `
::selection{background:${GOLD};color:${INK_G}}
@keyframes b9wave{0%,100%{transform:scaleY(.35)}50%{transform:scaleY(1)}}
.b9-wave{transform-origin:50% 50%;animation:b9wave 1.1s cubic-bezier(.16,1,.3,1) infinite}
@media (prefers-reduced-motion: reduce){.b9-wave{animation:none}}
@keyframes b9bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
.b9-bob{animation:b9bob 4.2s ease-in-out infinite}
.b9-bob2{animation:b9bob 5.4s ease-in-out -1.8s infinite}
@keyframes b9marq{to{transform:translateX(-50%)}}
.b9-marquee-track{display:flex;width:max-content;animation:b9marq 40s linear infinite}
.b9-slow{animation-duration:80s!important}
.b9-marquee:hover .b9-marquee-track{animation-play-state:paused}
@keyframes b9pulse{0%{box-shadow:0 0 0 0 rgba(139,108,240,.6),0 10px 30px -12px rgba(106,75,217,.5)}70%{box-shadow:0 0 0 18px rgba(139,108,240,0),0 10px 30px -12px rgba(106,75,217,.5)}100%{box-shadow:0 0 0 0 rgba(139,108,240,0),0 10px 30px -12px rgba(106,75,217,.5)}}
.b9-pulse{animation:b9pulse 2.6s ease-out infinite}
@keyframes b9shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-6px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(3px)}}
.b9-shake{animation:b9shake .5s ease}
.b9-par{overflow:hidden;border-radius:16px}
.b9-caro{background-image:conic-gradient(rgba(106,75,217,.085) 25%,transparent 0 50%,rgba(106,75,217,.085) 0 75%,transparent 0);background-size:64px 64px;-webkit-mask-image:radial-gradient(ellipse 80% 75% at 50% 45%,#000 30%,transparent 100%);mask-image:radial-gradient(ellipse 80% 75% at 50% 45%,#000 30%,transparent 100%)}
@supports (animation-timeline: view()){.b9-par > *{animation:b9par linear both;animation-timeline:view();animation-range:entry 0% exit 100%}}
@keyframes b9par{from{transform:translateY(-7%) scale(1.06)}to{transform:translateY(7%) scale(1.06)}}
@keyframes b9drift{0%{transform:translateX(-36px)}100%{transform:translateX(56px)}}
.b9-drift{animation:b9drift 14s ease-in-out infinite alternate}
.b9-drift2{animation:b9drift 18s ease-in-out -6s infinite alternate}
@keyframes b9walk{from{left:-140px}to{left:100%}}
.b9-walk{animation:b9walk 16s linear infinite}
@keyframes b9tw{0%,100%{opacity:.25;transform:scale(.7) rotate(0deg)}50%{opacity:1;transform:scale(1.12) rotate(22deg)}}
.b9-tw{animation:b9tw 3.2s ease-in-out infinite}
.b9-tw2{animation:b9tw 4.1s ease-in-out -1.5s infinite}
@keyframes b9orbit{to{transform:rotate(360deg)}}
.b9-orbit{animation:b9orbit 26s linear infinite}
@keyframes b9float{0%,100%{translate:0 0}50%{translate:0 -12px}}
.b9-float{animation:b9float 6s ease-in-out infinite}
.b9-float2{animation:b9float 7.5s ease-in-out -2.5s infinite}
@keyframes b9orb{0%,100%{transform:scale(1)}50%{transform:scale(1.07)}}
.b9-orb{animation:b9orb 9s ease-in-out infinite}
@media (prefers-reduced-motion: reduce){.b9-bob,.b9-bob2,.b9-marquee-track,.b9-pulse,.b9-shake,.b9-orbit,.b9-float,.b9-float2,.b9-orb,.b9-drift,.b9-drift2,.b9-walk,.b9-tw,.b9-tw2,.b9-par > *{animation:none!important}}
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
  const [prog, setProg] = useState(0);
  const [burst, setBurst] = useState(0);

  useEffect(() => {
    try {
      localStorage.setItem(WELCOME_SEEN_KEY, '1');
    } catch {
      /* chế độ riêng tư: lần sau vẫn thấy trang này */
    }
  }, []);

  const start = () => {
    setBurst((b) => b + 1);
    setTimeout(() => router.replace('/intro' as never), 900);
  };
  const signup = () => router.push('/auth/sign-in?mode=signup&next=%2Fintro' as never);

  // Chờ phông tiêu đề để không nhảy chữ; lỗi tải phông thì vẫn hiện bằng phông dự phòng.
  if (!fontsLoaded && !fontError) return <View style={{ flex: 1, backgroundColor: GOLD_SKY[1] }} />;

  return (
    <View style={{ flex: 1 }}>
    <ScrollView
      style={{ flex: 1, backgroundColor: GOLD_SKY[1] }}
      contentContainerStyle={{ flexGrow: 1 }}
      scrollEventThrottle={32}
      onScroll={(e) => {
        const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
        const max = contentSize.height - layoutMeasurement.height;
        setProg(max > 0 ? contentOffset.y / max : 0);
      }}
    >
      {isWeb ? <style>{WEB_CSS + FX_CSS}</style> : null}
      <LensDefs />

      {/* ===== MÀN ĐẦU: sảnh vàng kim ===== */}
      <View style={{ minHeight: wide ? Math.min(Math.max(720, height), 960) : undefined, overflow: 'hidden' }}>
        <MeshBackdrop stickers />
        <Aurora variant="hero" />
        <Motes />
        <View style={{ flex: 1, paddingHorizontal: pad, paddingBottom: wide ? 40 : 28, zIndex: 2 }}>
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
                borderColor: 'rgba(106,75,217,0.45)',
                backgroundColor: hovered ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.4)',
              })}
            >
              <Text style={{ color: INK_G, fontSize: 15, fontFamily: SANS_7 }}>{L('Đăng nhập', 'Sign in')}</Text>
            </Pressable>
          </GlassPanel>

          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ width: '100%', maxWidth: 920, alignItems: 'center', paddingTop: wide ? 24 : 12 }}>
              <View className="b9-rise" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: 20 }}>
                <View className="b9-rule" style={{ width: 44, height: 2 }} />
                <Text style={{ color: DEEP_G, fontFamily: SANS_7, fontSize: 13, letterSpacing: 2.2 }}>{'IELTS · SAT · SPEAKING'}</Text>
              </View>
              <Text
                accessibilityRole="header"
                className="b9-rise"
                style={{ textAlign: 'center', color: INK_G, fontFamily: SERIF, fontSize: wide ? 92 : mid ? 66 : 46, lineHeight: wide ? 96 : mid ? 72 : 52, letterSpacing: wide ? -1.8 : -0.8 }}
              >
                {L('Luyện thi\nnhư thi thật.', 'Practise like\nthe real exam.')}
                {'\n'}
                <Text className="b9-gold" style={{ color: DEEP_G, fontFamily: SERIF_I }}>{L('Học tiếng Anh\nnhư đi du lịch.', 'Learn English\nlike you travel.')}</Text>
              </Text>
              <Text className="b9-rise b9-d2" style={{ marginTop: wide ? 64 : 32, textAlign: 'center', color: BODY_G, fontSize: mid ? 20 : 17, lineHeight: mid ? 31 : 27, maxWidth: 640, fontFamily: SANS_5 }}>
                {L(
                  'IELTS và SAT trong một app. Đề như phòng thi, chấm ngay, và cả một thế giới để bạn nói tiếng Anh mỗi ngày.',
                  'IELTS and SAT in one app. Exam-room practice, instant marking, and a whole world to speak English in every day.',
                )}
              </Text>
              <View className="b9-rise b9-d3" style={{ flexDirection: mid ? 'row' : 'column', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 34 }}>
                <CTA label={L('Học thử ngay', 'Try it now')} onPress={start} solid />
                <CTA label={L('Tạo tài khoản', 'Create account')} onPress={signup} />
              </View>
              <Text style={{ marginTop: 16, textAlign: 'center', color: MUTED_G, fontSize: 14, fontFamily: SANS_5 }}>
                {L(`Miễn phí để bắt đầu · tặng ${WELCOME_DAYS} ngày Plus`, `Free to start · ${WELCOME_DAYS} days of Plus included`)}
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginTop: 26 }}>
                {(en ? HERO_TAGS_EN : HERO_TAGS_VI).map((t) => (
                  <Pill key={t} text={t} tone="gold" />
                ))}
              </View>
            </View>

            <HeroStage L={L} card={mid ? 250 : 156} />
          </View>

          <View style={{ marginTop: 48, alignItems: 'center' }}>
            <Plaque title={L('Sảnh Band 9', 'The Band 9 hall')} meta={L('Nền chính của Band 9', 'The main Band 9 ground')} align="center" />
          </View>
        </View>
      </View>

      {isWeb ? <Marquee en={en} /> : null}
      {/* ===== CÁC PHÒNG: mỗi phòng là một khung vàng trên nền vàng ===== */}
      <Room wide={wide} pad={pad} plaque={{ title: L('Phòng đọc', 'The reading room'), meta: L('Phòng 1', 'Room 1') }}>
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
            frame={<AppImage src="/intro/app-reading.jpg" ratio={446 / 1144} />}
            title={L('Kho bài đọc', 'The reading library')}
            line={L('Đọc song ngữ, tra từ chạm là hiểu, ôn lại đúng lúc sắp quên.', 'Bilingual reading, tap a word to look it up, review just before you forget.')}
            facts={L('1.909 bài đọc · 1.081 passage IELTS · 836 passage SAT', '1,909 readings · 1,081 IELTS passages · 836 SAT passages')}
          />
        </View>
      </Room>
      <Room wide={wide} pad={pad} plaque={{ title: L('Phòng luyện nói với AI', 'The AI speaking room'), meta: L('Phòng 2', 'Room 2') }}>
        <Exhibit
          wide={wide}
          frameWidth={500}
          frame={<AppImage src="/intro/app-roleplay.jpg" ratio={398 / 760} />}
          title={L('Phòng luyện nói với AI', 'The AI speaking room')}
          line={L('Nhập vai đời sống, gọi điện và hội thoại, mỗi tình huống có nhiều cách đáp.', 'Role-play daily life, phone calls and dialogues, with several ways to reply.')}
          facts={L('Nhập vai · Gọi điện · Hội thoại', 'Role-play · Phone calls · Dialogues')}
        />
        <SpeakFeatures wide={wide} mid={mid} L={L} />
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
          <View style={{ alignItems: 'center', gap: wide ? 40 : 28, marginTop: wide ? 48 : 28 }}>
            <View style={{ width: '100%', maxWidth: 640 }}>
              <Placard
                wide={wide}
                title={L('Du ngoạn thế giới', 'Travel the world')}
                line={L('Hỏi đường, gọi món, nhập học: nói đúng tình huống thật.', 'Ask the way, order food, enrol: speak in real situations.')}
                facts={L('Học speaking qua ngữ cảnh', 'Speaking in context')}
              />
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 14, width: '100%' }}>
              {THUMBS.map(([k, name]) => (
                <CityThumb key={k} k={k} name={name} L={L} style={{ width: wide ? 170 : 150 }} />
              ))}
            </View>
          </View>
        </View>
      </Room>
      <Room wide={wide} pad={pad} plaque={{ title: L('Từ vựng và lộ trình', 'Vocabulary and plan'), meta: L('Phòng 4', 'Room 4') }}>
        <View style={{ gap: wide ? 130 : 80 }}>
          <Exhibit
            wide={wide}
            frameWidth={500}
            frame={<AppImage src="/intro/app-vocab.jpg" ratio={312 / 760} />}
            title={L('Từ vựng theo sở thích', 'Vocabulary you care about')}
            line={L('Hơn 4.000 từ trong 111 bộ, chọn chủ đề bạn thích.', 'Over 4,000 words in 111 sets. Pick the topics you like.')}
            facts={L('Ôn lại đúng lúc sắp quên', 'Review right before you forget')}
          />
          <Exhibit
            wide={wide}
              frameWidth={460}
            frame={<AppImage src="/intro/app-plan.jpg" ratio={667 / 760} />}
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

      {/* ===== BÊN TRONG APP: dải màn hình thật, chạy ngang (web) ===== */}
      <View style={{ overflow: 'hidden' }}>
        <MeshBackdrop stickers />
      {isWeb ? (
        <View style={{ paddingTop: wide ? 40 : 24, paddingBottom: wide ? 24 : 16 }}>
          <View style={{ paddingHorizontal: pad, marginBottom: 34 }}>
            <Text accessibilityRole="header" style={{ color: INK_G, fontFamily: SERIF, fontSize: wide ? 52 : 38, lineHeight: wide ? 60 : 46, textAlign: 'center' }}>
              {L('Bên trong app', 'Inside the app')}
            </Text>
            <Text style={{ fontFamily: SANS_4, marginTop: 10, color: BODY_G, fontSize: 16.5, lineHeight: 26, textAlign: 'center' }}>
              {L('Đây là những màn hình thật, không phải ảnh dựng.', 'These are real screens, not mockups.')}
            </Text>
          </View>
          <GalleryStrip en={en} />
        </View>
      ) : null}
      <ContentBlocks wide={wide} mid={mid} pad={pad} en={en} L={L} />
      <ExamSets wide={wide} pad={pad} L={L} />
      </View>
      {/* ===== KẾT: đoạn chốt trên nền vàng đậm hơn ===== */}
      <View style={{ overflow: 'hidden' }}>
        <MeshBackdrop stickers />
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
            <Plaque title={L('Sảnh Band 9', 'The Band 9 hall')} meta={L('© Band 9', '© Band 9')} align="center" />
          </View>
        </View>
      </View>
    </ScrollView>
    {isWeb ? (
      <LinearGradient
        colors={['#8B6CF0', '#D9CCFF', '#A38BFA']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ position: 'absolute', top: 0, left: 0, height: 3, width: `${Math.round(prog * 100)}%`, zIndex: 60 }}
        pointerEvents="none"
      />
    ) : null}
    {burst > 0 ? (
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Confetti key={burst} seed={`start-${burst}`} pieces={120} />
      </View>
    ) : null}
    </View>
  );
}

/** Phòng luyện nói: bốn tính năng có icon, căn giữa; điện thoại xếp hai cột, rộng hơn thì một hàng. */
function SpeakFeatures({ wide, mid, L }: { wide: boolean; mid: boolean; L: LFn }) {
  const items = [
    {
      art: (s: number) => <CuteMic size={s} />,
      vi: ['Chấm phát âm', 'Điểm phát âm, ngữ điệu và độ trôi chảy theo thang IELTS, sau mỗi câu nói.'],
      en: ['Pronunciation scoring', 'Pronunciation, stress and fluency scored on the IELTS scale after each answer.'],
    },
    {
      art: (s: number) => <CuteChat size={s} />,
      vi: ['Gọi điện và hội thoại', 'Nghe, nói và đáp lại như trong cuộc gọi thật, với nhiều cách đáp để chọn.'],
      en: ['Phone calls and dialogues', 'Listen, speak and reply as on a real call, with several ways to answer.'],
    },
    {
      art: (s: number) => <CuteStar size={s} />,
      vi: ['Rút thẻ đề', 'Rút ngẫu nhiên một thẻ Part 1, 2 hoặc 3 rồi trả lời như phòng thi.'],
      en: ['Random exam card', 'Draw a Part 1, 2 or 3 card at random and answer as in the exam room.'],
    },
    {
      art: (s: number) => <CuteHeadphones size={s} />,
      vi: ['Shadowing và lồng tiếng', 'Nhại theo video BBC, TED-Ed và thu giọng từng câu để nghe lại.'],
      en: ['Shadowing and dubbing', 'Repeat after BBC and TED-Ed clips and record each line to hear it back.'],
    },
  ];
  const itemWidth = wide ? '23%' : '47%';
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 14, marginTop: wide ? 64 : 40 }}>
      {items.map((it) => (
        <GlassPanel key={it.vi[0]} className="b9-lift" style={{ width: itemWidth, padding: 22, borderRadius: 22, alignItems: 'center', gap: 8 }}>
          {it.art(72)}
          <Text style={{ color: INK_G, fontFamily: SERIF, fontSize: 20, lineHeight: 26, textAlign: 'center', marginTop: 4 }}>{L(it.vi[0] ?? '', it.en[0] ?? '')}</Text>
          <Text style={{ color: BODY_G, fontFamily: SANS_4, fontSize: 14.5, lineHeight: 22, textAlign: 'center' }}>{L(it.vi[1] ?? '', it.en[1] ?? '')}</Text>
        </GlassPanel>
      ))}
    </View>
  );
}

/** Bộ đề CAM: ảnh bìa thật của app cạnh phần giới thiệu; điện thoại xếp dọc. Không có số liệu dựng. */
function ExamSets({ wide, pad, L }: { wide: boolean; pad: number; L: LFn }) {
  const chips = ['Reading', 'Listening', 'Writing', 'Speaking'];
  return (
    <View style={{ paddingHorizontal: pad, paddingVertical: wide ? 120 : 72 }}>
      <View className="mx-auto w-full" style={{ maxWidth: 1100 }}>
        <GlassPanel className="b9-reveal" style={{ flexDirection: wide ? 'row' : 'column', alignItems: 'center', gap: wide ? 56 : 28, padding: wide ? 40 : 22, borderRadius: 28 }}>
          <View style={{ width: wide ? 440 : '100%' }}>
            <AppImage src="/intro/app-covers.jpg" ratio={800 / 720} />
          </View>
          <View style={{ flex: wide ? 1 : undefined, alignItems: 'center', gap: 14 }}>
            <Text accessibilityRole="header" style={{ color: INK_G, fontFamily: SERIF, fontSize: wide ? 44 : 32, lineHeight: wide ? 52 : 40, textAlign: 'center' }}>
              {L('Bộ đề CAM thật', 'Real CAM exam sets')}
            </Text>
            <Text style={{ color: BODY_G, fontFamily: SANS_4, fontSize: wide ? 18 : 16.5, lineHeight: wide ? 29 : 26, textAlign: 'center', maxWidth: 480 }}>
              {L('Làm đề từ các cuốn CAM IELTS như thi thật, chấm ngay và xem lại giải thích từng câu.', 'Sit CAM IELTS sets as in the real exam, get them marked at once and review every explanation.')}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 6 }}>
              {chips.map((c) => (
                <Pill key={c} text={c} tone="gold" />
              ))}
            </View>
          </View>
        </GlassPanel>
      </View>
    </View>
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
      <MeshBackdrop blobs />
      <View style={{ paddingHorizontal: pad, paddingTop: wide ? 130 : 80, paddingBottom: wide ? 56 : 40 }}>
        <View className="mx-auto w-full" style={{ maxWidth: 1180 }}>
          {children}
          <View style={{ marginTop: wide ? 110 : 64, alignItems: 'center' }}>
            <Plaque title={plaque.title} meta={plaque.meta} align="center" />
          </View>
        </View>
      </View>
    </View>
  );
}

function Placard({ wide, title, line, facts }: { wide: boolean; title: string; line: string; facts: string }) {
  return (
    <GlassPanel className="b9-reveal" style={{ padding: wide ? 34 : 24, borderRadius: 22 }}>
      <Text accessibilityRole="header" style={{ textAlign: 'center', color: INK_G, fontFamily: SERIF, fontSize: wide ? 44 : 32, lineHeight: wide ? 52 : 40 }}>{title}</Text>
      <Text style={{ fontFamily: SANS_4, marginTop: 14, textAlign: 'center', alignSelf: 'center', color: BODY_G, fontSize: wide ? 18 : 16.5, lineHeight: wide ? 29 : 26, maxWidth: 480 }}>{line}</Text>
      <View className="b9-rule" style={{ marginTop: 22, alignSelf: 'center', height: isWeb ? 2 : 1, width: 56, backgroundColor: isWeb ? undefined : DEEP_G }} />
      <Text style={{ marginTop: 12, textAlign: 'center', color: DEEP_G, fontSize: 14, lineHeight: 21, fontFamily: SANS_6 }}>{facts}</Text>
    </GlassPanel>
  );
}

function Exhibit({
  wide,
  frameWidth,
  frame,
  title,
  line,
  facts,
}: {
  wide: boolean;
  frameWidth: number;
  frame: React.ReactNode;
  title: string;
  line: string;
  facts: string;
}) {
  return (
    <View style={{ alignItems: 'center', gap: wide ? 44 : 28 }}>
      <View style={{ width: '100%', alignItems: 'center' }}>
        <View className="b9-lift b9-reveal" style={{ width: '100%', maxWidth: frameWidth }}>
          <Frame>{frame}</Frame>
        </View>
      </View>
      <View style={{ width: '100%', maxWidth: 640 }}>
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
        ...({ boxShadow: '0 8px 20px rgba(43,35,80,0.28)' } as object),
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
        style={{ width: '100%', aspectRatio: 480 / 680, borderRadius: 2, ...({ boxShadow: '0 10px 22px rgba(43,35,80,.34)' } as object) }}
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
      <View style={{ height: 7, marginHorizontal: -8, backgroundColor: GOLD_DEEP, borderRadius: 1, ...({ boxShadow: '0 8px 16px rgba(43,35,80,.3)' } as object) }} />
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
    <View className="b9-sheen b9-cta-solid b9-pulse" style={{ borderRadius: 999, backgroundColor: isWeb ? undefined : themedHex('#8B6CF0') }}>
      {inner}
    </View>
  );
}

/* ---------------- Màn app (dựng bằng mã, không ảnh chụp) ---------------- */

/** Lớp họa tiết caro mờ đặt lên nền vàng kim (chỉ web). */
function CaroLayer() {
  return <View pointerEvents="none" className="b9-caro" style={StyleSheet.absoluteFill} />;
}

const MARQUEE_VI = ['IELTS Reading', 'Listening', 'Writing', 'Speaking', 'SAT Math', 'SAT Reading & Writing', 'Từ vựng', 'Chép chính tả', 'Phát âm từng âm', 'Du ngoạn thế giới'];
const MARQUEE_EN = ['IELTS Reading', 'Listening', 'Writing', 'Speaking', 'SAT Math', 'SAT Reading & Writing', 'Vocabulary', 'Dictation', 'Sound-by-sound pronunciation', 'Travel through the world'];

function Marquee({ en }: { en: boolean }) {
  const items = en ? MARQUEE_EN : MARQUEE_VI;
  const row = items.map((t) => (
    <Text key={t} style={{ fontFamily: SANS_7, color: DEEP_G, fontSize: 18, letterSpacing: 0.3, paddingHorizontal: 24 }}>
      {t}
      <Text style={{ color: GOLD }}>{'   ✦   '}</Text>
    </Text>
  ));
  return (
    <View className="b9-marquee" style={{ overflow: 'hidden', paddingVertical: 18, borderTopWidth: 1, borderBottomWidth: 1, borderColor: 'rgba(139, 108, 240,0.35)', backgroundColor: 'rgba(255,255,255,0.6)' }}>
      <View className="b9-marquee-track" style={{ flexDirection: 'row' }}>
        <View style={{ flexDirection: 'row' }}>{row}</View>
        <View style={{ flexDirection: 'row' }}>{row}</View>
      </View>
    </View>
  );
}

const HERO_TAGS_VI = ['IELTS Reading & Listening', 'Chấm ngay từng câu', 'Nói với AI mỗi ngày'];
const HERO_TAGS_EN = ['IELTS Reading & Listening', 'Instant marking', 'Speak daily with AI'];

const STEPS = [
  {
    n: '01',
    art: (s: number) => <CuteMagnifier size={s} />,
    vi: ['Chọn điều muốn học', 'Tick kỹ năng và tính năng IELTS, SAT hoặc từ vựng. Thanh bên chỉ hiện những gì bạn chọn.'],
    en: ['Pick what to learn', 'Tick the skills and tools for IELTS, SAT or vocabulary. The sidebar shows only what you choose.'],
  },
  {
    n: '02',
    art: (s: number) => <CuteCalculator size={s} />,
    vi: ['Làm như thi thật', 'Đọc theo dạng đề thật, nói với AI trong tình huống thật, ôn từ vựng theo lịch.'],
    en: ['Practise like the real thing', 'Read in real exam formats, speak with AI in real situations, review words on a schedule.'],
  },
  {
    n: '03',
    art: (s: number) => <CuteTrophy size={s} />,
    vi: ['Xem đúng chỗ sai', 'Chấm ngay, giải thích từng câu, rồi ôn lại đúng lúc bạn sắp quên.'],
    en: ['See exactly where you slipped', 'Marked instantly, each line explained, then reviewed just before you forget.'],
  },
];

const FEATURES = [
  {
    art: (s: number) => <CuteBook size={s} />,
    vi: ['Kho bài đọc', '1.909 bài đọc đầy đủ, 245 bài song ngữ Anh–Việt. Tra từ chạm là hiểu.'],
    en: ['Reading library', '1,909 full readings and 245 bilingual Eng–Vi texts. Tap a word to look it up.'],
  },
  {
    art: (s: number) => <CuteBulb size={s} />,
    vi: ['Từ vựng theo FSRS', 'Mỗi từ kèm nguyên câu gặp nó. Ôn đúng lúc sắp quên, không ôn dàn trải.'],
    en: ['Vocabulary with FSRS', 'Each word comes with the sentence you met it in, and returns just before you forget.'],
  },
  {
    art: (s: number) => <CuteChat size={s} />,
    vi: ['Tình huống nói', 'Nhập vai đời sống, gọi điện và hội thoại. Mỗi tình huống có nhiều cách đáp để chọn.'],
    en: ['Speaking scenarios', 'Daily-life role-play, phone calls and dialogues, with several ways to reply.'],
  },
  {
    art: (s: number) => <CuteNotebook size={s} />,
    vi: ['Bộ đề CAM thật', 'Làm đề từ các cuốn CAM IELTS, có đáp án và giải thích từng câu.'],
    en: ['Real CAM sets', 'Work through CAM IELTS sets, with answers and an explanation for each question.'],
  },
  {
    art: (s: number) => <CuteCalendar size={s} />,
    vi: ['Lập lộ trình', 'Chọn kỳ thi, band mục tiêu, thời lượng mỗi buổi và các ngày học trong tuần.'],
    en: ['A study plan', 'Pick your exam, target band, session length and study days each week.'],
  },
  {
    art: (s: number) => <CuteGlobe size={s} />,
    vi: ['Thi thử đủ dạng', 'Thi thử Reading đủ 3 passage trong 60 phút, có đáp án và giải thích.'],
    en: ['Full mock tests', 'A full 3-passage Reading mock in 60 minutes, with answers and explanations.'],
  },
];

/** Hai khối nội dung: ba bước và lưới tính năng thật của app. Hiện dần khi cuộn tới. */
function ContentBlocks({ wide, mid, pad, en, L }: { wide: boolean; mid: boolean; pad: number; en: boolean; L: LFn }) {
  return (
    <>
      <View style={{ paddingHorizontal: pad, paddingTop: wide ? 40 : 24, paddingBottom: wide ? 110 : 64 }}>
        <View className="mx-auto w-full" style={{ maxWidth: 1100 }}>
          <Text accessibilityRole="header" style={{ color: INK_G, fontFamily: SERIF, fontSize: wide ? 52 : 38, lineHeight: wide ? 60 : 46, textAlign: 'center' }}>
            {L('Ba bước mỗi ngày', 'Three steps, every day')}
          </Text>
          <View style={{ marginTop: 56, flexDirection: wide ? 'row' : 'column', gap: 28 }}>
            {wide ? <View className="b9-rule" style={{ position: 'absolute', left: '17%', width: '66%', top: 84, height: 2 }} /> : null}
            {STEPS.map((st) => (
              <GlassPanel key={st.n} className="b9-lift b9-blur b9-reveal" style={{ flex: 1, padding: 26, borderRadius: 24, gap: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: DEEP_G, fontFamily: SERIF, fontSize: 44, lineHeight: 50 }}>{st.n}</Text>
                  <View className="b9-bob">{st.art(70)}</View>
                </View>
                <Text style={{ color: INK_G, fontFamily: SERIF, fontSize: 26, lineHeight: 32 }}>{en ? st.en[0] : st.vi[0]}</Text>
                <Text style={{ color: BODY_G, fontFamily: SANS_4, fontSize: 15.5, lineHeight: 24 }}>{en ? st.en[1] : st.vi[1]}</Text>
              </GlassPanel>
            ))}
          </View>
        </View>
      </View>

      <View style={{ paddingHorizontal: pad, paddingBottom: wide ? 120 : 72 }}>
        <View className="mx-auto w-full" style={{ maxWidth: 1100 }}>
          <Text accessibilityRole="header" style={{ color: INK_G, fontFamily: SERIF, fontSize: wide ? 52 : 38, lineHeight: wide ? 60 : 46, textAlign: 'center' }}>
            {L('Trong app có gì', 'What is inside')}
          </Text>
          <Text style={{ fontFamily: SANS_4, marginTop: 12, color: BODY_G, fontSize: mid ? 17 : 16, lineHeight: 26, textAlign: 'center' }}>
            {L('Mỗi mục là một màn hình bạn đã thấy ở trên.', 'Each item is a screen you have already seen above.')}
          </Text>
          <View style={{ marginTop: 44, flexDirection: 'row', flexWrap: 'wrap', gap: 20 }}>
            {FEATURES.map((ft) => (
              <GlassPanel
                key={ft.vi[0]}
                className="b9-lift b9-blur"
                style={{ flexBasis: wide ? '31%' : mid ? '47%' : '100%', flexGrow: 1, padding: 22, borderRadius: 22, flexDirection: 'row', gap: 18, alignItems: 'center' }}
              >
                <View className="b9-bob2" style={{ width: 88, height: 88, borderRadius: 24, backgroundColor: 'rgba(246,242,255,0.85)', alignItems: 'center', justifyContent: 'center' }}>
                  {ft.art(66)}
                </View>
                <View style={{ flex: 1, gap: 6 }}>
                  <Text style={{ color: INK_G, fontFamily: SERIF, fontSize: 22, lineHeight: 28 }}>{en ? ft.en[0] : ft.vi[0]}</Text>
                  <Text style={{ color: BODY_G, fontFamily: SANS_4, fontSize: 14.5, lineHeight: 22 }}>{en ? ft.en[1] : ft.vi[1]}</Text>
                </View>
              </GlassPanel>
            ))}
          </View>
        </View>
      </View>
    </>
  );
}

const GALLERY = [
  { src: '/intro/app-reading.jpg', ratio: 446 / 1144, vi: 'Kho bài đọc', en: 'Reading library' },
  { src: '/intro/app-vocab.jpg', ratio: 312 / 760, vi: 'Từ vựng theo FSRS', en: 'Vocabulary with FSRS' },
  { src: '/intro/app-roleplay.jpg', ratio: 398 / 760, vi: 'Quest du ngoạn', en: 'Travel quests' },
  { src: '/intro/app-plan.jpg', ratio: 667 / 760, vi: 'Lập lộ trình', en: 'Study plan' },
  { src: '/intro/app-hub.jpg', ratio: 261 / 720, vi: 'Trang chủ', en: 'Home' },
  { src: '/intro/app-practice.jpg', ratio: 407 / 720, vi: 'Tin tiếng Anh theo ngày', en: 'Daily English news' },
  { src: '/intro/app-covers.jpg', ratio: 800 / 720, vi: 'Luyện đề Digital SAT', en: 'Digital SAT practice tests' },
];

/** Dải màn hình thật chạy ngang, lặp vô hạn; rê chuột vào thì dừng. Chỉ web. */
function GalleryStrip({ en }: { en: boolean }) {
  const card = (g: (typeof GALLERY)[number], k: string) => (
    <View key={k} style={{ width: 340, marginRight: 24 }}>
      <AppImage src={g.src} ratio={0.62} />
      <Text style={{ marginTop: 10, color: DEEP_G, fontFamily: SANS_7, fontSize: 15 }}>{en ? g.en : g.vi}</Text>
    </View>
  );
  return (
    <View className="b9-marquee" style={{ overflow: 'hidden', paddingVertical: 12 }}>
      <View className="b9-marquee-track b9-slow" style={{ flexDirection: 'row' }}>
        <View style={{ flexDirection: 'row' }}>{GALLERY.map((g) => card(g, `a-${g.src}`))}</View>
        <View style={{ flexDirection: 'row' }}>{GALLERY.map((g) => card(g, `b-${g.src}`))}</View>
      </View>
    </View>
  );
}

/** Ảnh chụp màn hình thật của app, bo góc, trượt nhẹ theo cuộn (CSS b9-par). */
function AppImage({ src, ratio }: { src: string; ratio: number }) {
  return (
    <View className="b9-par" style={{ borderRadius: 16, backgroundColor: '#F8F5FF' }}>
      <Image source={{ uri: src }} style={{ width: '100%', aspectRatio: 1 / ratio }} resizeMode="cover" />
    </View>
  );
}

/** Số đếm lên từ 0 khi khối hiện ra màn hình (web). Native hiện ngay số đích. */
function CountUp({ to, style }: { to: number; style?: object }) {
  const [v, setV] = useState(isWeb ? 0 : to);
  const ref = useRef<View>(null);
  useEffect(() => {
    if (!isWeb || typeof IntersectionObserver === 'undefined') {
      setV(to);
      return;
    }
    const node = ref.current as unknown as HTMLElement | null;
    if (!node) return;
    let raf = 0;
    let started = false;
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry || !entry.isIntersecting || started) return;
        started = true;
        const t0 = performance.now();
        const step = (now: number) => {
          const p = Math.min(1, (now - t0) / 1600);
          setV(Math.round(to * (1 - Math.pow(1 - p, 3))));
          if (p < 1) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
      },
      { threshold: 0.5 },
    );
    io.observe(node);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [to]);
  return (
    <View ref={ref}>
      <Text style={style}>{v.toLocaleString('vi-VN')}</Text>
    </View>
  );
}

/** Một ảnh chụp màn hình thật của app trong khung cửa sổ giả; mọi ảnh cùng chiều cao để hàng đều. */
function ShotCard({ src, title, width }: { src: string; title: string; width: number }) {
  return (
    <View
      style={{
        width,
        borderRadius: 18,
        overflow: 'hidden',
        backgroundColor: '#FFFFFF',
        ...({ boxShadow: '0 30px 56px -28px rgba(60,40,120,0.45), 0 0 0 1px rgba(255,255,255,0.9)' } as object),
      }}
    >
      <View
        style={{
          height: 30,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingHorizontal: 12,
          backgroundColor: '#F1ECFF',
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(106,75,217,0.14)',
        }}
      >
        <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: '#E9A59A' }} />
        <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: '#C9B8FF' }} />
        <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: '#A9D5A0' }} />
        <Text numberOfLines={1} style={{ marginLeft: 8, color: MUTED_G, fontFamily: SANS_7, fontSize: 12 }}>
          {title}
        </Text>
      </View>
      <Image source={{ uri: src }} style={{ width, height: Math.round(width * 0.7) }} resizeMode="cover" accessibilityLabel={title} />
    </View>
  );
}

/** Bốn ảnh app xếp hàng ngang, căn giữa, cách đều và không chồng lên nhau; màn hẹp tự xuống dòng. */
function HeroStage({ L, card }: { L: LFn; card: number }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: card > 200 ? 24 : 12, marginTop: card > 200 ? 56 : 36, maxWidth: 1180, alignSelf: 'center' }}>
      <ShotCard src="/intro/app-hub.jpg" title={L('Trang chủ', 'Home')} width={card} />
      <ShotCard src="/intro/app-reading.jpg" title={L('Kho bài đọc', 'Reading library')} width={card} />
      <ShotCard src="/intro/app-vocab.jpg" title={L('Từ vựng', 'Vocabulary')} width={card} />
      <ShotCard src="/intro/app-roleplay.jpg" title={L('Quest du ngoạn', 'Travel quests')} width={card} />
    </View>
  );
}

function Pill({ text, tone = 'plain' }: { text: string; tone?: 'plain' | 'gold' }) {
  return (
    <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: tone === 'gold' ? 'rgba(139,108,240,0.24)' : 'rgba(15,29,51,0.06)' }}>
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
              borderColor: free ? 'rgba(34,160,107,0.55)' : 'rgba(139, 108, 240,0.7)',
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
