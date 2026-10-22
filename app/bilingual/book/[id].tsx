import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Speech from 'expo-speech';

import { Screen } from '@/components/layout/Screen';
import { HoverGlossText, type WordPick } from '@/components/reader/HoverGloss';
import { WordPopover } from '@/components/reader/WordPopover';
import { Icon } from '@/components/ui';
import { listPersonalBooks, updatePersonalBook, type PersonalBook } from '@/data/book-library';
import { useAuthStore } from '@/store/useAuthStore';
import { readingFont, useReadingFonts } from '@/lib/readingFonts';
import { englishVoice } from '@/services/audio/voice';
import { useL } from '@/i18n/useL';

const INK = '#1E2748';
const MUTED = '#68718A';
const GOLD = '#6A4BD9';

export default function PersonalBookReaderScreen() {
  useReadingFonts();
  const { L } = useL();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const token = useAuthStore((state) => state.session?.access_token ?? null);
  const [book, setBook] = useState<PersonalBook | null>(null);
  const [page, setPage] = useState(0);
  const [showParallel, setShowParallel] = useState(true);
  const [translating, setTranslating] = useState(false);
  const [notice, setNotice] = useState('');
  const [wordPick, setWordPick] = useState<WordPick | null>(null);

  const reload = useCallback(async () => {
    if (!id) return;
    const found = (await listPersonalBooks()).find((item) => item.id === id) ?? null;
    setBook(found);
    if (found) setPage(Math.max(0, Math.min(found.currentPage, found.pagesEn.length - 1)));
  }, [id]);

  useEffect(() => { void reload(); }, [reload]);
  useEffect(() => () => { Speech.stop(); }, []);

  const pageText = book?.pagesEn[page] ?? '';
  const translated = book?.translatedPages[page];
  const viPageIndex = useMemo(() => {
    if (!book?.pagesVi?.length) return -1;
    if (book.pagesEn.length <= 1 || book.pagesVi.length <= 1) return 0;
    return Math.round((page / (book.pagesEn.length - 1)) * (book.pagesVi.length - 1));
  }, [book, page]);
  const viText = viPageIndex >= 0 ? book?.pagesVi?.[viPageIndex] : undefined;
  const totalPages = book?.pagesEn.length ?? 0;

  const changePage = async (next: number) => {
    if (!book) return;
    const safe = Math.max(0, Math.min(next, book.pagesEn.length - 1));
    setPage(safe);
    setNotice('');
    const updated = await updatePersonalBook(book.id, (current) => ({ ...current, currentPage: safe }));
    if (updated) setBook(updated);
  };

  const speakPage = () => {
    if (!pageText) return;
    Speech.stop();
    Speech.speak(pageText, { language: 'en-GB', rate: 0.9, voice: englishVoice() });
  };

  const translateCurrentPage = async () => {
    if (!book || !pageText || translating) return;
    if (!token) {
      setNotice(L('Đăng nhập để dịch trang bằng AI.', 'Sign in to translate this page with AI.'));
      return;
    }
    setTranslating(true);
    setNotice(L('Đang dịch trang này…', 'Translating this page…'));
    try {
      const response = await fetch('/api/books/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: pageText }),
      });
      const payload = (await response.json()) as { text?: string; error?: string };
      if (!response.ok || !payload.text) throw new Error(payload.error ?? L('Không dịch được trang này.', 'Could not translate this page.'));
      const updated = await updatePersonalBook(book.id, (current) => ({
        ...current,
        translatedPages: { ...current.translatedPages, [page]: payload.text! },
      }));
      if (updated) setBook(updated);
      setNotice(L('Đã dịch xong. Bản dịch được lưu trên thiết bị này.', 'Done. The translation is saved on this device.'));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : L('Không dịch được trang này.', 'Could not translate this page.'));
    } finally {
      setTranslating(false);
    }
  };

  if (!book) {
    return (
      <Screen>
        <Text className="font-heavy" style={{ color: INK, fontSize: 22 }}>{L('Không tìm thấy sách', 'Book not found')}</Text>
        <Text className="mt-2 font-sans" style={{ color: MUTED, fontSize: 15, lineHeight: 23 }}>{L('Sách có thể đã bị xoá khỏi thư viện trên thiết bị này.', 'This book may have been removed from this device.')}</Text>
        <Pressable onPress={() => router.replace('/bilingual/books' as never)} className="mt-4 self-start rounded-pill px-4 py-3" style={{ backgroundColor: GOLD }}>
          <Text className="font-heavy" style={{ color: '#FFFFFF' }}>{L('Về kệ sách', 'Back to library')}</Text>
        </Pressable>
      </Screen>
    );
  }

  const parallelText = viText || translated;
  return (
    <Screen>
      <Pressable accessibilityRole="link" onPress={() => router.back()} className="mb-3 self-start flex-row items-center gap-1.5 py-1">
        <Icon name="chevron-left" size={16} color={INK} strokeWidth={2.2} />
        <Text className="font-semi" style={{ color: INK, fontSize: 14 }}>{L('Kệ sách', 'Bookshelf')}</Text>
      </Pressable>

      <View className="rounded-[22px] bg-white p-5" style={{ borderWidth: 1, borderColor: '#F3F0FB', ...(PlatformShadow as object) }}>
        <Text className="font-heavy" style={{ color: INK, fontSize: 25, lineHeight: 32 }}>{book.title}</Text>
        {book.author ? <Text className="mt-1 font-semi" style={{ color: MUTED, fontSize: 14 }}>{book.author}</Text> : null}
        <View className="mt-4 flex-row flex-wrap items-center justify-between gap-3">
          <Text className="font-mid" style={{ color: MUTED, fontSize: 13 }}>{L(`Trang ${page + 1} / ${totalPages}`, `Page ${page + 1} / ${totalPages}`)}</Text>
          <View className="flex-row rounded-pill p-1" style={{ backgroundColor: '#F3F0FB' }}>
            <ModeButton active={showParallel} label={L('Song song', 'Parallel')} onPress={() => setShowParallel(true)} />
            <ModeButton active={!showParallel} label={L('Chỉ tiếng Anh', 'English only')} onPress={() => setShowParallel(false)} />
          </View>
        </View>
      </View>

      <View className="mt-4 flex-row flex-wrap gap-4">
        <View className="rounded-[22px] bg-white p-5" style={{ flex: 1, minWidth: 290, borderWidth: 1, borderColor: '#F3F0FB', ...PlatformShadow }}>
          <View className="flex-row items-center justify-between gap-2">
            <Text className="font-heavy" style={{ color: GOLD, fontSize: 11, letterSpacing: 1.2 }}>{L('NGUYÊN TÁC · ENGLISH', 'ORIGINAL · ENGLISH')}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel={L('Nghe trang tiếng Anh', 'Listen to English page')} onPress={speakPage} className="h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: '#F3F0FB' }}>
              <Icon name="volume" size={17} color={GOLD} strokeWidth={1.9} />
            </Pressable>
          </View>
          <View className="mt-4">
            <HoverGlossText text={pageText} fontFamily={readingFont.body} fontSize={18} lineHeight={31} color={INK} onWordPress={setWordPick} />
          </View>
        </View>

        {showParallel ? (
          <View className="rounded-[22px] bg-white p-5" style={{ flex: 1, minWidth: 290, borderWidth: 1, borderColor: '#F3F0FB', ...PlatformShadow }}>
            <Text className="font-heavy" style={{ color: GOLD, fontSize: 11, letterSpacing: 1.2 }}>{L('BẢN ĐỌC TIẾNG VIỆT', 'VIETNAMESE')}</Text>
            {parallelText ? (
              <View className="mt-4">
                {viText ? <Text className="mb-2 font-mid" style={{ color: MUTED, fontSize: 11 }}>{L(`Trang Việt gần tương ứng ${viPageIndex + 1}/${book.pagesVi?.length}`, `Approximate matching Vietnamese page ${viPageIndex + 1}/${book.pagesVi?.length}`)}</Text> : null}
                <HoverGlossText text={parallelText} fontFamily={readingFont.body} fontSize={18} lineHeight={31} color={INK} />
              </View>
            ) : (
              <View className="mt-4 rounded-2xl p-4" style={{ backgroundColor: '#F3F0FB' }}>
                <Text className="font-sans" style={{ color: MUTED, fontSize: 14, lineHeight: 21 }}>
                  {L('Nhập bản PDF tiếng Việt của sách, hoặc dịch riêng trang đang đọc bằng AI.', 'Import the Vietnamese PDF edition, or translate the page you are reading with AI.')}
                </Text>
                <Pressable accessibilityRole="button" onPress={() => void translateCurrentPage()} disabled={translating} className="mt-4 self-start flex-row items-center gap-2 rounded-pill px-4 py-3" style={{ backgroundColor: GOLD, opacity: translating ? 0.6 : 1 }}>
                  <Icon name="sparkle" size={15} color="#FFFFFF" strokeWidth={2} />
                  <Text className="font-heavy" style={{ color: '#FFFFFF', fontSize: 13 }}>{translating ? L('Đang dịch…', 'Translating…') : L('Dịch trang này bằng AI', 'Translate this page with AI')}</Text>
                </Pressable>
                <Text className="mt-2 font-sans" style={{ color: MUTED, fontSize: 11.5, lineHeight: 17 }}>{L('Chỉ nội dung trang này được gửi đi khi bạn bấm nút. Bản dịch lưu trên thiết bị.', 'Only this page is sent when you tap the button. The translation stays on this device.')}</Text>
              </View>
            )}
          </View>
        ) : null}
      </View>

      {notice ? <Text accessibilityLiveRegion="polite" className="mt-3 font-semi" style={{ color: MUTED, fontSize: 13, lineHeight: 19 }}>{notice}</Text> : null}

      <View className="mt-4 flex-row items-center justify-between rounded-[20px] bg-white p-3" style={{ borderWidth: 1, borderColor: '#F3F0FB' }}>
        <ReaderNav disabled={page <= 0} label={L('Trang trước', 'Previous')} icon="chevron-left" onPress={() => void changePage(page - 1)} />
        <Text className="font-mid" style={{ color: MUTED, fontSize: 12 }}>{L(`${Math.round(((page + 1) / totalPages) * 100)}% đã đọc`, `${Math.round(((page + 1) / totalPages) * 100)}% read`)}</Text>
        <ReaderNav disabled={page >= totalPages - 1} label={L('Trang sau', 'Next page')} icon="chevron-right" onPress={() => void changePage(page + 1)} />
      </View>
      <WordPopover pick={wordPick} table={{}} articleId={`book:${book.id}`} articleTitle={book.title} paragraphIndex={page} onClose={() => setWordPick(null)} />
    </Screen>
  );
}

const PlatformShadow = Platform.OS === 'web'
  ? ({ boxShadow: '0 8px 24px rgba(71,54,27,0.06)' } as object)
  : { elevation: 2 };

function ModeButton({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="tab" aria-selected={active} onPress={onPress} className="rounded-pill px-3 py-1.5" style={{ backgroundColor: active ? GOLD : 'transparent' }}>
      <Text className="font-semi" style={{ color: active ? '#FFFFFF' : INK, fontSize: 12 }}>{label}</Text>
    </Pressable>
  );
}

function ReaderNav({ disabled, label, icon, onPress }: { disabled: boolean; label: string; icon: 'chevron-left' | 'chevron-right'; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} className="flex-row items-center gap-1 rounded-pill px-3 py-2" style={{ backgroundColor: disabled ? '#F3F0FB' : '#F3F0FB', opacity: disabled ? 0.45 : 1 }}>
      {icon === 'chevron-left' ? <Icon name={icon} size={16} color={INK} strokeWidth={2.1} /> : null}
      <Text className="font-semi" style={{ color: INK, fontSize: 12 }}>{label}</Text>
      {icon === 'chevron-right' ? <Icon name={icon} size={16} color={INK} strokeWidth={2.1} /> : null}
    </Pressable>
  );
}
