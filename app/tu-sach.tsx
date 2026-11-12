/*
 * Tủ sách PDF — 11 cuốn soạn riêng cho Band 9, bày như kệ sách trong "phòng tranh" (DESIGN.md).
 * Ai cũng đọc thử được 15 trang đầu mỗi cuốn (public/books/samples, dựng bằng scripts/books/prepare-books.py).
 * Mở sách: người có gói Max hoặc gói năm (services/books/entitlement) mở cả tủ; người khác mở dần theo
 * tiến độ học (services/books/gift). Máy chủ kiểm tra khi tải /api/books/pdf, in email + mã ở chân từng
 * trang rồi trả link ký 10 phút.
 */
import { themedHex } from '@/theme/palette-state';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Linking, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useFonts, PlayfairDisplay_700Bold, PlayfairDisplay_600SemiBold_Italic } from '@expo-google-fonts/playfair-display';

import { CREAM, GOLD, GOLD_DEEP, MIST, NAVY, SANS_4, SANS_5, SANS_6, SANS_7, SANS_8, SERIF, SERIF_I, isWeb } from '@/components/gallery/gallery';
import { Aurora, BODY_G, DEEP_G, FX_CSS, GOLD_SKY, GOLD_SKY_LOC, INK_G, MUTED_G, Plaque } from '@/components/gallery/glass';
import { Icon } from '@/components/ui';
import { BOOKS, BOOK_TOTALS, type Book, type BookId } from '@/services/books/catalog';
import { BOOK_REQUIREMENTS, GIFT_FIRST_BOOK, bookGap, type BookProgress } from '@/services/books/gift';
import { useGameStore } from '@/store/useGameStore';
import { useLessonStore } from '@/store/useLessonStore';
import { BOOK_BUNDLE_RULE } from '@/services/books/entitlement';
import { useAuthStore } from '@/store/useAuthStore';
import { useL } from '@/i18n/useL';

const SAMPLE_PAGES = 15;
const SHELVES: { exam: Book['exam']; vi: string; en: string }[] = [
  { exam: 'IELTS', vi: 'IELTS', en: 'IELTS' },
  { exam: 'SAT', vi: 'SAT', en: 'SAT' },
  { exam: 'Song ngữ', vi: 'Đọc thêm', en: 'Extra reading' },
];

type Member = {
  state: 'member';
  granted: boolean;
  order: string | null;
  downloaded: BookId[];
  /** Tiến độ máy chủ đếm (nhiệm vụ đã nhận thưởng, bài đã học). Null khi chưa đọc được. */
  progress: BookProgress | null;
  /** Các cuốn đã mở theo tiến độ. Người có gói trả tiền thì máy chủ trả đủ cả tủ. */
  unlocked: BookId[];
};
type Access = { state: 'loading' } | { state: 'guest' } | Member;

export default function BookshelfScreen() {
  const { L, en } = useL();
  const { width } = useWindowDimensions();
  const [fontsLoaded, fontError] = useFonts({ PlayfairDisplay_700Bold, PlayfairDisplay_600SemiBold_Italic });
  const token = useAuthStore((s) => s.session?.access_token ?? null);
  // Kết quả hỏi quyền, gắn với đúng phiên đã hỏi: đổi tài khoản thì quay về "đang tải" thay vì hiện quyền của người trước.
  const [member, setMember] = useState<(Member & { token: string }) | null>(null);
  const access: Access = !token ? { state: 'guest' } : member && member.token === token ? member : { state: 'loading' };
  const setAccess = (f: (m: Member) => Member) => setMember((m) => (m ? { ...f(m), token: m.token } : m));
  const [busy, setBusy] = useState<BookId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shelfW, setShelfW] = useState(0);
  const wide = width >= 980;
  const mid = width >= 640;
  const pad = wide ? 56 : mid ? 32 : 18;

  useEffect(() => {
    if (!token) return;
    let alive = true;
    fetch('/api/books/pdf', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d: { granted?: boolean; order?: string | null; downloaded?: BookId[]; progress?: BookProgress | null; unlocked?: BookId[] }) => {
        if (alive)
          setMember({
            state: 'member',
            granted: Boolean(d.granted),
            order: d.order ?? null,
            downloaded: d.downloaded ?? [],
            progress: d.progress ?? null,
            unlocked: d.unlocked ?? [],
            token,
          });
      })
      .catch(() => alive && setMember({ state: 'member', granted: false, order: null, downloaded: [], progress: null, unlocked: [], token }));
    return () => {
      alive = false;
    };
  }, [token]);

  const openSample = (book: Book) => {
    const url = `/books/samples/${book.id}.pdf`;
    if (isWeb) window.open(url, '_blank', 'noopener');
    else void Linking.openURL(url);
  };

  const download = async (book: Book) => {
    if (!token) return;
    setBusy(book.id);
    setError(null);
    try {
      const r = await fetch('/api/books/pdf', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId: book.id }),
      });
      const d = (await r.json()) as { url?: string; error?: string };
      if (!r.ok || !d.url) throw new Error(d.error ?? L('Không tải được, thử lại sau.', 'Download failed. Try again later.'));
      if (isWeb) window.location.assign(d.url);
      else void Linking.openURL(d.url);
      setAccess((m) => (m.downloaded.includes(book.id) ? m : { ...m, downloaded: [...m.downloaded, book.id] }));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  const questsDone = useGameStore((s) => s.questsClaimed ?? 0);
  const lessonsDone = useLessonStore((s) => Object.keys(s.done).length);
  if (!fontsLoaded && !fontError) return <View style={{ flex: 1, backgroundColor: GOLD_SKY[1] }} />;

  const granted = access.state === 'member' && access.granted;
  // Quà khi đăng ký: một cuốn tải được với mọi tài khoản đã đăng nhập.
  const giftBook = BOOKS.find((b) => b.id === GIFT_FIRST_BOOK);
  const giftGot = access.state === 'member' && access.downloaded.includes(GIFT_FIRST_BOOK);
  // Tiến độ: người đã đăng nhập xem số máy chủ đếm; khách xem số tạm trên máy này để hình dung.
  const shown: BookProgress = access.state === 'member' && access.progress ? access.progress : { quests: questsDone, lessons: lessonsDone };
  const openIds = new Set<BookId>(access.state === 'member' ? access.unlocked : []);
  const isOpen = (id: BookId) => granted || openIds.has(id);
  // Cuốn kế tiếp là cuốn đầu tiên trong tủ còn khoá, theo thứ tự kệ.
  const nextBook = BOOKS.find((b) => !isOpen(b.id)) ?? null;
  const nextGap = nextBook ? bookGap(nextBook.id, shown) : null;
  const nextNeed = nextBook ? BOOK_REQUIREMENTS[nextBook.id] : null;
  const nextRatio = nextBook && nextNeed
    ? Math.min(1, nextNeed.quests > 0 ? shown.quests / nextNeed.quests : 1, nextNeed.lessons > 0 ? shown.lessons / nextNeed.lessons : 1)
    : 1;
  // Bìa chia đều theo bề rộng THẬT của kệ (cửa sổ trừ thanh menu): bìa ≥ 140px, IELTS 6 cuốn nằm một hàng khi đủ chỗ.
  const gap = wide ? 24 : 16;
  const cols = shelfW > 0 ? Math.max(2, Math.min(6, Math.floor((shelfW + gap) / (140 + gap)))) : 2;
  const coverW = shelfW > 0 ? Math.floor((shelfW - gap * (cols - 1)) / cols) : 140;

  /** Dòng dưới bìa cuốn còn khoá: chỉ tiêu và phần còn thiếu, hoặc lời mời đăng nhập. */
  const lockText = (id: BookId): string => {
    if (access.state === 'guest') return L('Đăng nhập để mở sách này', 'Sign in to open this book');
    const need = BOOK_REQUIREMENTS[id];
    const left = bookGap(id, shown);
    return L(
      `Mở khi làm ${need.quests} nhiệm vụ và học ${need.lessons} bài. Còn ${left.quests} nhiệm vụ, ${left.lessons} bài.`,
      `Opens after ${need.quests} tasks and ${need.lessons} lessons. ${left.quests} tasks, ${left.lessons} lessons to go.`,
    );
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: GOLD_SKY[1] }} contentContainerStyle={{ paddingBottom: 48 }}>
      {isWeb ? <style>{FX_CSS}</style> : null}
      {/* Quà sách: đăng ký nhận một cuốn; học đủ thì mở toàn bộ tủ. */}
      <View style={{ marginHorizontal: 16, marginTop: 16, padding: 16, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.7)', borderWidth: 1, borderColor: 'rgba(139, 108, 240,0.35)', gap: 10 }}>
        <Text style={{ color: INK_G, fontFamily: SERIF, fontSize: 18 }}>{L('Quà khi học trên Band 9', 'Gifts for studying on Band 9')}</Text>
        <Text style={{ color: BODY_G, fontFamily: SANS_5, fontSize: 14, lineHeight: 20 }}>
          {access.state === 'guest'
            ? L(`Đăng ký tài khoản để nhận 1 cuốn quà: ${giftBook?.title ?? ''}.`, `Sign up to get one book as a gift: ${giftBook?.title ?? ''}.`)
            : giftGot
              ? L(`Bạn đã nhận quà: ${giftBook?.title ?? ''}.`, `You have received your gift: ${giftBook?.title ?? ''}.`)
              : L(`Quà của bạn: ${giftBook?.title ?? ''}. Bấm tải ở bìa sách.`, `Your gift: ${giftBook?.title ?? ''}. Tap download on its cover.`)}
        </Text>
        <Text style={{ color: INK_G, fontFamily: SANS_7, fontSize: 15 }}>{L('Mở dần tủ sách', 'Unlock the shelf step by step')}</Text>
        <Text style={{ color: BODY_G, fontFamily: SANS_5, fontSize: 14, lineHeight: 20 }}>
          {L(
            `Làm nhiệm vụ và học bài để mở từng cuốn. Hiện có ${shown.quests} nhiệm vụ và ${shown.lessons} bài đã học.`,
            `Finish tasks and lessons to open each book. You have ${shown.quests} tasks and ${shown.lessons} lessons.`,
          )}
        </Text>
        {nextBook && nextGap ? (
          <Text style={{ color: BODY_G, fontFamily: SANS_5, fontSize: 14, lineHeight: 20 }}>
            {L(
              `Cuốn kế tiếp: ${nextBook.title}. Còn ${nextGap.quests} nhiệm vụ và ${nextGap.lessons} bài.`,
              `Next book: ${nextBook.title}. ${nextGap.quests} tasks and ${nextGap.lessons} lessons to go.`,
            )}
          </Text>
        ) : (
          <Text style={{ color: BODY_G, fontFamily: SANS_5, fontSize: 14, lineHeight: 20 }}>{L('Bạn đã mở đủ cả tủ sách.', 'You have unlocked the whole shelf.')}</Text>
        )}
        <View style={{ height: 8, borderRadius: 4, backgroundColor: 'rgba(139, 108, 240,0.2)', overflow: 'hidden' }}>
          <View style={{ height: 8, width: `${Math.round(nextRatio * 100)}%`, backgroundColor: GOLD_DEEP, borderRadius: 4 }} />
        </View>
        {access.state === 'guest' ? (
          <Text style={{ color: BODY_G, fontFamily: SANS_5, fontSize: 13 }}>{L('Đăng nhập để tiến độ được lưu và mở sách.', 'Sign in so your progress is saved and books open.')}</Text>
        ) : null}
      </View>
      {/* Đầu trang: sảnh vàng kim + tên tủ + nhãn phòng */}
      <View style={{ overflow: 'hidden' }}>
        <LinearGradient colors={GOLD_SKY} locations={GOLD_SKY_LOC} start={{ x: 0.15, y: 0 }} end={{ x: 0.85, y: 1 }} style={StyleSheet.absoluteFill} />
        <Aurora variant="close" />
        <View style={{ paddingHorizontal: pad, paddingTop: wide ? 64 : 40, paddingBottom: wide ? 48 : 32 }}>
          <View className="mx-auto w-full" style={{ maxWidth: 1180 }}>
            <Text accessibilityRole="header" className="b9-rise" style={{ color: INK_G, fontFamily: SERIF, fontSize: wide ? 52 : 36, lineHeight: wide ? 60 : 44 }}>
              {L('Tủ sách ', 'The ')}
              <Text className="b9-gold" style={{ color: DEEP_G, fontFamily: SERIF_I }}>{L('Band 9', 'Band 9 shelf')}</Text>
            </Text>
            <Text className="b9-rise b9-d2" style={{ fontFamily: SANS_5, marginTop: 12, color: BODY_G, fontSize: mid ? 18 : 16, lineHeight: 27, maxWidth: 620 }}>
              {L(
                `${BOOK_TOTALS.count} cuốn PDF, ${BOOK_TOTALS.pages.toLocaleString('vi-VN')} trang soạn riêng cho Band 9. Đọc thử ${SAMPLE_PAGES} trang mỗi cuốn, miễn phí.`,
                `${BOOK_TOTALS.count} PDF books, ${BOOK_TOTALS.pages.toLocaleString('en-US')} pages written for Band 9. Read the first ${SAMPLE_PAGES} pages of each for free.`,
              )}
            </Text>
            <View style={{ marginTop: 22 }}>
              <Plaque title={L('Tủ sách PDF', 'The PDF bookshelf')} meta={L('Phòng 5 · Band 9', 'Room 5 · Band 9')} align="left" />
            </View>
          </View>
        </View>
      </View>

      {error ? (
        <View className="mx-auto w-full" style={{ maxWidth: 1180, paddingHorizontal: pad, marginTop: 8 }}>
          <View style={{ borderLeftWidth: 3, borderLeftColor: '#E5484D', paddingLeft: 12, paddingVertical: 6 }}>
            <Text style={{ fontFamily: SANS_6, color: '#9B2226', fontSize: 14.5 }}>{error}</Text>
          </View>
        </View>
      ) : null}

      {SHELVES.map((shelf) => {
        const books = BOOKS.filter((b) => b.exam === shelf.exam);
        return (
          <View key={shelf.exam} className="mx-auto w-full" style={{ maxWidth: 1180, paddingHorizontal: pad, marginTop: wide ? 48 : 36 }}>
            <Text accessibilityRole="header" style={{ color: INK_G, fontFamily: SERIF, fontSize: wide ? 30 : 24 }}>
              {L(shelf.vi, shelf.en)}
              <Text style={{ fontFamily: SANS_5, fontSize: 15, color: BODY_G }}>{`  ·  ${books.length} ${L('cuốn', books.length > 1 ? 'books' : 'book')}`}</Text>
            </Text>
            {/* Kệ: bìa đứng thành hàng trên tấm ván vàng */}
            <View style={{ marginTop: 20 }} onLayout={(e) => setShelfW(Math.round(e.nativeEvent.layout.width))}>
              <View className="flex-row flex-wrap" style={{ columnGap: gap, rowGap: 34 }}>
                {books.map((book) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    width={coverW}
                    en={en}
                    L={L}
                    available={isOpen(book.id)}
                    lockedText={isOpen(book.id) ? null : lockText(book.id)}
                    downloaded={access.state === 'member' && access.downloaded.includes(book.id)}
                    busy={busy === book.id}
                    onSample={() => openSample(book)}
                    onDownload={() => void download(book)}
                  />
                ))}
              </View>
            </View>
          </View>
        );
      })}

      <View className="mx-auto w-full" style={{ maxWidth: 1180, paddingHorizontal: pad, marginTop: 48 }}>
        <Text style={{ fontFamily: SANS_4, color: MUTED_G, fontSize: 13, lineHeight: 20, maxWidth: 720 }}>
          {L(
            'Mỗi bản tải về được in email của bạn và mã đơn ở chân từng trang. Sách chỉ để bạn tự học: không chia sẻ, đăng lại hay bán lại.',
            'Every downloaded copy carries your email and order code at the foot of each page. For your own study only: do not share, repost or resell.',
          )}
        </Text>
      </View>
    </ScrollView>
  );
}

function AccessBar({ access, L }: { access: Access; L: (vi: string, en: string) => string }) {
  if (access.state === 'loading') {
    return (
      <View style={{ marginTop: 22, height: 44, justifyContent: 'center' }}>
        <ActivityIndicator color={GOLD} />
      </View>
    );
  }
  if (access.state === 'member' && access.granted) {
    return (
      <View className="flex-row items-center" style={{ marginTop: 22, gap: 10 }}>
        <Icon name="check" size={18} color="#5FD39B" />
        <Text style={{ flexShrink: 1, fontFamily: SANS_7, color: '#BFEFD6', fontSize: 15.5, lineHeight: 22 }}>
          {L('Bạn tải được bản đầy đủ của cả 11 cuốn', 'You can download all 11 full books')}
          {access.order ? <Text style={{ fontFamily: SANS_5, color: MIST }}>{L(` · mã đơn ${access.order}`, ` · order ${access.order}`)}</Text> : null}
        </Text>
      </View>
    );
  }
  const guest = access.state === 'guest';
  return (
    <View style={{ marginTop: 22, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
      <View className="flex-row items-center" style={{ gap: 8, flexShrink: 1 }}>
        <Icon name="lock" size={16} color={GOLD} />
        <Text style={{ flexShrink: 1, fontFamily: SANS_6, color: '#F1DDAE', fontSize: 15, lineHeight: 21 }}>{L(`Bản đầy đủ kèm ${BOOK_BUNDLE_RULE}`, 'Full books come with Max or any yearly plan')}</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push((guest ? '/auth/sign-in?mode=signin&next=%2Ftu-sach' : '/upgrade') as never)}
        style={({ hovered }: { hovered?: boolean }) => ({
          paddingHorizontal: 16,
          paddingVertical: 9,
          borderRadius: 999,
          borderWidth: 1.5,
          borderColor: 'rgba(243,237,225,0.5)',
          backgroundColor: hovered ? 'rgba(243,237,225,0.12)' : 'transparent',
        })}
      >
        <Text style={{ fontFamily: SANS_7, color: CREAM, fontSize: 14.5 }}>{guest ? L('Đăng nhập', 'Sign in') : L('Xem các gói', 'See plans')}</Text>
      </Pressable>
    </View>
  );
}

function BookCard({
  book,
  width,
  en,
  L,
  available,
  lockedText,
  downloaded,
  busy,
  onSample,
  onDownload,
}: {
  book: Book;
  width: number;
  en: boolean;
  L: (vi: string, en: string) => string;
  /** Cuốn đã mở (gói trả tiền, quà, hoặc đủ chỉ tiêu) thì mới hiện nút tải. */
  available: boolean;
  /** Dòng giải thích vì sao cuốn còn khoá. Null khi đã mở. */
  lockedText: string | null;
  downloaded: boolean;
  busy: boolean;
  onSample: () => void;
  onDownload: () => void;
}) {
  const size = en ? `${book.pages} pages · ${book.sizeMb.toFixed(1)} MB` : `${book.pages} trang · ${book.sizeMb.toFixed(1).replace('.', ',')} MB`;
  return (
    <View style={{ width }}>
      <Pressable accessibilityRole="button" accessibilityLabel={L(`Đọc thử ${book.title}`, `Preview ${book.title}`)} onPress={onSample}>
        {({ hovered }: { hovered?: boolean }) => (
          <View
            style={{
              borderRadius: 3,
              overflow: 'hidden',
              transform: [{ translateY: hovered ? -4 : 0 }],
              ...({ boxShadow: hovered ? '0 18px 34px rgba(43,35,80,.34)' : '0 12px 26px rgba(43,35,80,.28)', transition: 'transform .18s ease, box-shadow .18s ease' } as object),
            }}
          >
            <Image source={{ uri: `/books/covers/${book.id}.jpg` }} style={{ width: '100%', aspectRatio: 480 / 680 }} resizeMode="cover" accessibilityIgnoresInvertColors />
          </View>
        )}
      </Pressable>
      {/* tấm ván kệ dưới chân bìa */}
      <View style={{ height: 6, marginTop: 0, marginHorizontal: -10, backgroundColor: GOLD_DEEP, borderRadius: 1, ...({ boxShadow: '0 6px 12px rgba(43,35,80,.3)' } as object) }} />
      <Text numberOfLines={2} style={{ marginTop: 14, fontFamily: SANS_8, color: INK_G, fontSize: 15, lineHeight: 20 }}>
        {book.title}
      </Text>
      <Text numberOfLines={2} style={{ marginTop: 3, fontFamily: SANS_4, color: BODY_G, fontSize: 13, lineHeight: 18 }}>
        {book.subtitle}
      </Text>
      <Text style={{ marginTop: 6, fontFamily: SANS_5, color: MUTED_G, fontSize: 12.5 }}>{size}</Text>
      <View style={{ marginTop: 10, gap: 8 }}>
        <SmallButton label={L(`Đọc thử ${SAMPLE_PAGES} trang`, `Preview ${SAMPLE_PAGES} pages`)} onPress={onSample} />
        {available ? (
          <SmallButton
            solid
            busy={busy}
            label={downloaded ? L('Tải lại', 'Download again') : L('Tải bản đầy đủ', 'Download full book')}
            onPress={onDownload}
          />
        ) : lockedText ? (
          <View className="flex-row items-center" style={{ gap: 6, paddingHorizontal: 4 }}>
            <Icon name="lock" size={14} color={MUTED_G} />
            <Text style={{ flexShrink: 1, fontFamily: SANS_5, color: MUTED_G, fontSize: 12.5, lineHeight: 17 }}>{lockedText}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function SmallButton({ label, onPress, solid = false, busy = false }: { label: string; onPress: () => void; solid?: boolean; busy?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={busy}
      onPress={onPress}
      style={({ hovered }: { hovered?: boolean }) => ({
        paddingVertical: 9,
        paddingHorizontal: 12,
        borderRadius: 999,
        alignItems: 'center',
        backgroundColor: solid ? (hovered ? themedHex('#D9CCFF') : themedHex('#8B6CF0')) : hovered ? 'rgba(255,255,255,0.5)' : 'transparent',
        borderWidth: solid ? 0 : 1,
        borderColor: 'rgba(106,75,217,0.45)',
        opacity: busy ? 0.7 : 1,
      })}
    >
      {busy ? <ActivityIndicator size="small" color={INK_G} /> : <Text style={{ fontFamily: SANS_7, color: INK_G, fontSize: 13.5 }}>{label}</Text>}
    </Pressable>
  );
}
