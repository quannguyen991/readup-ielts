/*
 * THESIS: Band 9 là một PHÒNG TRANH. Màn đầu là bức "Đêm đầy sao" (nền học mặc định trong app); mỗi phòng là một bức Van
 *   Gogh khác làm nền, phần app treo lên như tranh có khung vàng, kèm nhãn bảo tàng. Từ chối bố cục SaaS tối: tiêu đề + ô tính năng cùng cỡ.
 * OWN-WORLD: tranh thật trong kho nền của app (Van Gogh, phạm vi công cộng) + ảnh pixel thành phố của Du ngoạn; tường phòng
 *   tranh navy đêm #0E1530, vàng kim #E3BE6A/#B8955A cho khung và điểm nhấn, chữ kem #F3EDE1. Phông: Playfair Display cho
 *   tiêu đề (câu thứ hai nghiêng vàng) + Plus Jakarta Sans của app cho mọi chữ còn lại.
 * STORY: hiểu Band 9 = luyện đề như thi thật + học tiếng Anh như đi du lịch → đi một vòng năm "phòng" (phòng thi, phòng
 *   luyện nói với AI, Du ngoạn, từ vựng theo sở thích, lộ trình riêng) → biết phần nào mở ngay → bấm "Học thử ngay".
 * FIRST VIEWPORT: tranh phủ kín; trái: tiêu đề 4 dòng (2 dòng sau nghiêng vàng), câu phụ, 2 nút; phải dưới: thẻ câu Reading
 *   đã chấm, nghiêng nhẹ; góc phải dưới: nhãn tranh. Điện thoại: tranh (thấy trăng) + chữ + 2 nút, KHÔNG thẻ câu —
 *   câu đó đã có ngay bên dưới ở "Phòng thi thật", lặp lại hai lần liền nhau là thừa.
 * FORM: người dùng chọn hướng A "Tranh Van Gogh" (08/10/2026) trong 3 bản phác (.impeccable/build/state.json), sau khi
 *   chê bản "Một ngày học".
 * FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
 */
import React, { useEffect } from 'react';
import { Image, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { useFonts, PlayfairDisplay_700Bold, PlayfairDisplay_600SemiBold_Italic } from '@expo-google-fonts/playfair-display';

import {
  WALL,
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
  Painting,
  Frame,
  ArtLabel,
} from '@/components/gallery/gallery';
import { Icon } from '@/components/ui';
import { FREE_SUMMARY, LOCKED_SUMMARY } from '@/lib/access/member-gate';
import { WELCOME_DAYS } from '@/lib/billing/welcome';
import { WELCOME_SEEN_KEY } from '@/lib/welcome-page';
import { useL } from '@/i18n/useL';
import { BOOKS, BOOK_TOTALS } from '@/services/books/catalog';
import { BOOK_BUNDLE_RULE } from '@/services/books/entitlement';

const LOGO = require('../assets/brand/band9-logo-mark.png');
/** Tranh trong kho nền của app (public/backdrops/art) và ảnh pixel của Du ngoạn (public/travel/maps). */
const ART = { starry: '/landing/starry.jpg', rhone: '/landing/rhone.jpg' };
/** Tranh nền từng phòng: bản nén lại cho trang này (public/landing), gốc ở public/backdrops/art. */
type RoomArt = { src: string; pos: string; vi: string; en: string; year: string; tint?: string };
const ROOMS: Record<'cafe' | 'irises' | 'wheatcrows' | 'sunflowers' | 'village', RoomArt> = {
  cafe: { src: '/landing/cafe.jpg', pos: 'center 40%', vi: 'Hiên quán cà phê ban đêm', en: 'Café Terrace at Night', year: '1888' },
  irises: { src: '/landing/irises.jpg', pos: 'center 55%', vi: 'Hoa diên vĩ', en: 'Irises', year: '1889' },
  wheatcrows: { src: '/landing/wheatcrows.jpg', pos: 'center 40%', vi: 'Cánh đồng lúa mì và đàn quạ', en: 'Wheatfield with Crows', year: '1890' },
  sunflowers: { src: '/landing/sunflowers.jpg', pos: 'center 35%', vi: 'Hoa hướng dương', en: 'Sunflowers', year: '1888', tint: '34,22,8' },
  // Hết tranh Van Gogh chưa dùng: phòng Tủ sách treo CHI TIẾT làng dưới chân "Đêm đầy sao" — khác hẳn khung trăng ở màn đầu.
  village: { src: '/landing/starry.jpg', pos: 'center 96%', vi: 'Đêm đầy sao (chi tiết)', en: 'The Starry Night (detail)', year: '1889' },
};
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

/** CSS chỉ cho web: màu bôi chọn chữ, vòng sáng khi dùng bàn phím, và một chuyển động duy nhất (sóng giọng nói). */
const WEB_CSS = `
::selection{background:${GOLD};color:${NAVY}}
@keyframes b9wave{0%,100%{transform:scaleY(.35)}50%{transform:scaleY(1)}}
.b9-wave{transform-origin:50% 50%;animation:b9wave 1.1s cubic-bezier(.16,1,.3,1) infinite}
@media (prefers-reduced-motion: reduce){.b9-wave{animation:none}}
[role=button]:focus-visible,[role=link]:focus-visible{outline:2px solid ${GOLD};outline-offset:3px}
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
  if (!fontsLoaded && !fontError) return <View style={{ flex: 1, backgroundColor: WALL }} />;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: WALL }} contentContainerStyle={{ flexGrow: 1 }}>
      {isWeb ? <style>{WEB_CSS}</style> : null}

      {/* ===== MÀN ĐẦU: Đêm đầy sao ===== */}
      <View style={{ minHeight: wide ? Math.min(Math.max(720, height), 960) : undefined, overflow: 'hidden' }}>
        <Painting
          src={ART.starry}
          pos={wide ? 'center 38%' : '88% 0%'}
          scrim={
            wide
              ? 'linear-gradient(90deg,rgba(8,12,34,.92) 0%,rgba(8,12,34,.74) 36%,rgba(8,12,34,.18) 68%,rgba(8,12,34,.06) 100%)'
              : 'linear-gradient(180deg,rgba(8,12,34,.2) 0%,rgba(8,12,34,.6) 34%,rgba(8,12,34,.66) 70%,rgba(8,12,34,.9) 100%)'
          }
        />
        <View style={{ flex: 1, paddingHorizontal: pad, paddingBottom: wide ? 40 : 28 }}>
          <View className="flex-row items-center justify-between" style={{ paddingVertical: wide ? 28 : 20 }}>
            <View className="flex-row items-center" style={{ gap: 10 }}>
              <Image source={LOGO} style={{ width: 34, height: 34, borderRadius: 6 }} accessibilityIgnoresInvertColors />
              <Text style={{ color: CREAM, fontSize: 20, fontFamily: SANS_8, letterSpacing: -0.4 }}>Band 9</Text>
            </View>
            <Pressable
              accessibilityRole="link"
              onPress={() => router.push('/auth/sign-in?mode=signin' as never)}
              style={({ hovered }: { hovered?: boolean }) => ({
                paddingHorizontal: 18,
                paddingVertical: 9,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: 'rgba(243,237,225,0.4)',
                backgroundColor: hovered ? 'rgba(243,237,225,0.12)' : 'rgba(8,12,34,0.25)',
              })}
            >
              <Text style={{ color: CREAM, fontSize: 15, fontFamily: SANS_7 }}>{L('Đăng nhập', 'Sign in')}</Text>
            </Pressable>
          </View>

          <View style={{ flex: 1, flexDirection: wide ? 'row' : 'column', alignItems: wide ? 'flex-end' : 'stretch', gap: wide ? 40 : 36 }}>
            <View style={{ flex: wide ? 1 : undefined, maxWidth: 720, alignSelf: wide ? 'center' : 'auto', paddingTop: wide ? 0 : 20 }}>
              <Text
                accessibilityRole="header"
                style={{ color: CREAM, fontFamily: SERIF, fontSize: wide ? 84 : mid ? 64 : 46, lineHeight: wide ? 90 : mid ? 70 : 52, letterSpacing: wide ? -1.5 : -0.8 }}
              >
                {L('Luyện thi\nnhư thi thật.', 'Practise like\nthe real exam.')}
                {'\n'}
                <Text style={{ color: GOLD, fontFamily: SERIF_I }}>{L('Học tiếng Anh\nnhư đi du lịch.', 'Learn English\nlike you travel.')}</Text>
              </Text>
              <Text style={{ marginTop: 24, color: '#D4D9E8', fontSize: mid ? 20 : 17, lineHeight: mid ? 31 : 27, maxWidth: 540, fontFamily: SANS_5 }}>
                {L(
                  'IELTS và SAT trong một app. Đề như phòng thi, chấm ngay, và cả một thế giới để bạn nói tiếng Anh mỗi ngày.',
                  'IELTS and SAT in one app. Exam-room practice, instant marking, and a whole world to speak English in every day.',
                )}
              </Text>
              <View style={{ flexDirection: mid ? 'row' : 'column', gap: 12, marginTop: 34 }}>
                <CTA label={L('Học thử ngay', 'Try it now')} onPress={start} solid />
                <CTA label={L('Tạo tài khoản', 'Create account')} onPress={signup} />
              </View>
              <Text style={{ marginTop: 16, color: MIST, fontSize: 14, fontFamily: SANS_5 }}>
                {L(`Miễn phí để bắt đầu · tặng ${WELCOME_DAYS} ngày Plus`, `Free to start · ${WELCOME_DAYS} days of Plus included`)}
              </Text>
            </View>

            {/* Thẻ câu đã chấm chỉ ở màn rộng; điện thoại gặp ngay "Phòng thi thật" phía dưới. */}
            {wide ? (
              <View style={{ width: 420, alignSelf: 'flex-end', marginBottom: 64 }}>
                <View style={{ transform: [{ rotate: '1.5deg' }], ...({ boxShadow: '0 30px 70px rgba(0,0,0,0.5)' } as object), borderRadius: 16 }}>
                  <ExamScreen L={L} compact />
                </View>
              </View>
            ) : null}
          </View>

          <View style={{ marginTop: wide ? 0 : 40 }}>
            <ArtLabel title={L('Đêm đầy sao', 'The Starry Night')} meta={L('Vincent van Gogh, 1889 · nền học mặc định trong Band 9', 'Vincent van Gogh, 1889 · the default study backdrop in Band 9')} align={wide ? 'right' : 'left'} />
          </View>
        </View>
      </View>

      {/* ===== PHÒNG TRANH: mỗi phòng treo trên một bức Van Gogh ===== */}
      <Room art={ROOMS.cafe} placard="right" wide={wide} pad={pad} L={L} heavyTop>
        <Text accessibilityRole="header" style={{ color: CREAM, fontFamily: SERIF, fontSize: wide ? 60 : mid ? 46 : 36, lineHeight: wide ? 68 : mid ? 54 : 44, textAlign: 'center' }}>
          {L('Đi một vòng Band\u00A09.', 'A walk through Band\u00A09.')}
        </Text>
        <Text style={{ fontFamily: SANS_4, marginTop: 14, color: MIST, fontSize: mid ? 18 : 16.5, lineHeight: 27, textAlign: 'center' }}>
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
      <Room art={ROOMS.irises} placard="left" wide={wide} pad={pad} L={L}>
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
      <Room art={ROOMS.wheatcrows} placard="center" wide={wide} pad={pad} L={L}>
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
      <Room art={ROOMS.sunflowers} placard="center" wide={wide} pad={pad} L={L}>
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
      <Room art={ROOMS.village} placard="center" wide={wide} pad={pad} L={L}>
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

      {/* ===== KẾT: Đêm đầy sao trên sông Rhône ===== */}
      <View style={{ overflow: 'hidden' }}>
        <Painting
          src={ART.rhone}
          pos="center 45%"
          scrim="linear-gradient(180deg,rgba(14,21,48,1) 0%,rgba(8,12,34,.62) 22%,rgba(8,12,34,.55) 60%,rgba(8,12,34,.9) 100%)"
          lazy
        />
        <View style={{ paddingHorizontal: pad, paddingTop: wide ? 150 : 96, paddingBottom: 36 }}>
          <View className="mx-auto w-full" style={{ maxWidth: 820 }}>
            <Text accessibilityRole="header" style={{ color: CREAM, fontFamily: SERIF, fontSize: wide ? 64 : mid ? 48 : 38, lineHeight: wide ? 72 : mid ? 56 : 46, textAlign: 'center' }}>
              {L('Bắt đầu ngay,\n', 'Start now,\n')}
              <Text style={{ color: GOLD, fontFamily: SERIF_I }}>{L('không cần thẻ.', 'no card needed.')}</Text>
            </Text>
            <View
              style={{
                marginTop: 40,
                gap: 20,
                padding: mid ? 28 : 20,
                borderRadius: 20,
                backgroundColor: 'rgba(8,12,30,0.66)',
                borderWidth: 1,
                borderColor: 'rgba(227,190,106,0.25)',
                ...({ backdropFilter: 'blur(6px)' } as object),
              }}
            >
              <AccessRow label={L('Dùng ngay, không cần tài khoản', 'Open to everyone')} items={en ? FREE_SUMMARY.en : FREE_SUMMARY.vi} free />
              <AccessRow label={L('Cần tài khoản miễn phí', 'Needs a free account')} items={en ? LOCKED_SUMMARY.en : LOCKED_SUMMARY.vi} />
            </View>
            <View style={{ flexDirection: mid ? 'row' : 'column', gap: 12, marginTop: 32, justifyContent: 'center' }}>
              <CTA label={L('Học thử ngay', 'Try it now')} onPress={start} solid />
              <CTA label={L(`Tạo tài khoản · tặng ${WELCOME_DAYS} ngày Plus`, `Create account · ${WELCOME_DAYS} days of Plus`)} onPress={signup} />
            </View>
          </View>
          <View style={{ marginTop: wide ? 120 : 72 }}>
            <ArtLabel title={L('Đêm đầy sao trên sông Rhône', 'Starry Night Over the Rhône')} meta={L('Vincent van Gogh, 1888', 'Vincent van Gogh, 1888')} align="center" />
            <Text style={{ fontFamily: SANS_4, marginTop: 14, textAlign: 'center', color: '#9AA3BE', fontSize: 13 }}>© Band 9</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

/* ---------------- Tranh nền, khung, đèn rọi, nhãn ---------------- */

/** Một phòng: tranh phủ kín, mép trên/dưới hoà vào tường, phía tấm nhãn tối hơn để chữ đọc rõ; nhãn tranh ở chân phòng. */
function Room({
  art,
  placard,
  wide,
  pad,
  L,
  heavyTop = false,
  children,
}: {
  art: RoomArt;
  placard: 'left' | 'right' | 'center';
  wide: boolean;
  pad: number;
  L: LFn;
  heavyTop?: boolean;
  children: React.ReactNode;
}) {
  const edges = heavyTop
    ? `linear-gradient(180deg,${WALL} 0%,rgba(14,21,48,.82) 16%,rgba(14,21,48,0) 34%,rgba(14,21,48,0) 86%,${WALL} 100%)`
    : `linear-gradient(180deg,${WALL} 0%,rgba(14,21,48,0) 14%,rgba(14,21,48,0) 86%,${WALL} 100%)`;
  const t = art.tint ?? '8,12,34'; // màu lớp phủ: navy đêm; tranh nền vàng dùng nâu ấm để khỏi ngả xanh rêu
  const side = !wide
    ? `linear-gradient(rgba(${t},.7),rgba(${t},.7))`
    : placard === 'center'
      ? `linear-gradient(rgba(${t},.62),rgba(${t},.62))`
      : `linear-gradient(${placard === 'right' ? 90 : 270}deg,rgba(${t},.42) 0%,rgba(${t},.5) 42%,rgba(${t},.84) 66%,rgba(${t},.9) 100%)`;
  return (
    <View style={{ overflow: 'hidden' }}>
      <Painting src={art.src} pos={art.pos} scrim={`${edges},${side}`} lazy />
      <View style={{ paddingHorizontal: pad, paddingTop: wide ? 130 : 80, paddingBottom: wide ? 56 : 40 }}>
        <View className="mx-auto w-full" style={{ maxWidth: 1180 }}>
          {children}
          <View style={{ marginTop: wide ? 110 : 64 }}>
            <ArtLabel title={L(art.vi, art.en)} meta={`Vincent van Gogh, ${art.year}`} align={wide ? 'right' : 'left'} />
          </View>
        </View>
      </View>
    </View>
  );
}

function Placard({ wide, title, line, facts }: { wide: boolean; title: string; line: string; facts: string }) {
  return (
    <View>
      <Text accessibilityRole="header" style={{ color: CREAM, fontFamily: SERIF, fontSize: wide ? 44 : 32, lineHeight: wide ? 52 : 40 }}>{title}</Text>
      <Text style={{ fontFamily: SANS_4, marginTop: 14, color: MIST, fontSize: wide ? 18 : 16.5, lineHeight: wide ? 29 : 26, maxWidth: 480 }}>{line}</Text>
      <View style={{ marginTop: 22, height: 1, width: 56, backgroundColor: GOLD }} />
      <Text style={{ marginTop: 12, color: GOLD, fontSize: 14, lineHeight: 21, fontFamily: SANS_6 }}>{facts}</Text>
    </View>
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
        <View style={{ width: '100%', maxWidth: frameWidth }}>
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
      <View style={{ padding: 4, backgroundColor: GOLD_DEEP, borderRadius: 2 }}>
        <Image source={thumb(k)} style={{ width: '100%', aspectRatio: 4 / 3 }} resizeMode="cover" accessibilityLabel={L(`${name} trong Du ngoạn`, `${name} in Travel mode`)} />
      </View>
      <Text style={{ marginTop: 8, color: CREAM, fontSize: 14, fontFamily: SANS_7 }}>{name}</Text>
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
        ...({ boxShadow: '0 8px 20px rgba(8,12,34,0.35)' } as object),
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
        style={{ width: '100%', aspectRatio: 480 / 680, borderRadius: 2, ...({ boxShadow: '0 10px 22px rgba(0,0,0,.5)' } as object) }}
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
      <View style={{ height: 7, marginHorizontal: -8, backgroundColor: GOLD_DEEP, borderRadius: 1, ...({ boxShadow: '0 8px 16px rgba(0,0,0,.5)' } as object) }} />
    </View>
  );
}

/* ---------------- Nút ---------------- */

function CTA({ label, onPress, solid = false }: { label: string; onPress: () => void; solid?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ hovered, pressed }: { hovered?: boolean; pressed?: boolean }) => ({
        paddingHorizontal: 30,
        paddingVertical: 17,
        borderRadius: 999,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
        backgroundColor: solid ? (hovered ? '#EDCD84' : GOLD) : hovered ? 'rgba(243,237,225,0.12)' : 'rgba(8,12,34,0.25)',
        borderWidth: solid ? 0 : 1.5,
        borderColor: 'rgba(243,237,225,0.5)',
        transform: [{ translateY: pressed ? 1 : 0 }],
        ...(solid ? ({ boxShadow: '0 10px 30px rgba(227,190,106,0.35)' } as object) : null),
      })}
    >
      <Text style={{ color: solid ? NAVY : CREAM, fontSize: 17, fontFamily: SANS_8 }}>{label}</Text>
      {solid ? <Icon name="arrow-right" size={18} color={NAVY} /> : null}
    </Pressable>
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
        <Text style={{ color: '#7A5E24', fontSize: 13.5, fontFamily: SANS_8, fontVariant: ['tabular-nums'] }}>2 / 4</Text>
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
      <Text style={{ color: tone === 'gold' ? '#7A5E24' : BODY, fontSize: 12.5, fontFamily: SANS_7 }}>{text}</Text>
    </View>
  );
}

function AccessRow({ label, items, free = false }: { label: string; items: string[]; free?: boolean }) {
  return (
    <View style={{ alignItems: 'center', gap: 10 }}>
      <View className="flex-row items-center" style={{ gap: 7 }}>
        <Icon name={free ? 'check' : 'lock'} size={15} color={free ? '#5FD39B' : GOLD} />
        <Text style={{ color: CREAM, fontSize: 15, fontFamily: SANS_8 }}>{label}</Text>
      </View>
      <View className="flex-row flex-wrap justify-center" style={{ gap: 8 }}>
        {items.map((x) => (
          <View key={x} style={{ paddingHorizontal: 13, paddingVertical: 7, borderRadius: 999, borderWidth: 1, borderColor: free ? 'rgba(95,211,155,0.5)' : 'rgba(227,190,106,0.5)' }}>
            <Text style={{ color: free ? '#BFEFD6' : '#F1DDAE', fontSize: 14, fontFamily: SANS_6 }}>{x}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
