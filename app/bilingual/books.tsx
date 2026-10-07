import React, { useCallback, useEffect, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { LightHero } from '@/components/layout/LightHero';
import { Screen } from '@/components/layout/Screen';
import { Appear } from '@/components/motion/Motion';
import { Icon } from '@/components/ui';
import { BILINGUAL_STORIES } from '@/data/bilingual-stories';
import {
  deletePersonalBook,
  listPersonalBooks,
  savePersonalBook,
  updatePersonalBook,
  type PersonalBook,
} from '@/data/book-library';
import { extractBookPages, type BrowserBookFile } from '@/services/books/import-book';
import { useReadingFonts } from '@/lib/readingFonts';
import { color } from '@/theme/tokens';
import { useL } from '@/i18n/useL';

const INK = '#1E2748';
const MUTED = '#68718A';
const CARD = {
  borderWidth: 1,
  borderColor: '#EEE7DB',
  ...(Platform.OS === 'web' ? ({ boxShadow: '0 8px 24px rgba(71,54,27,0.07)' } as object) : { elevation: 2 }),
};

type ImportTarget = { personalId?: string; catalogId?: string; title?: string; author?: string; language: 'en' | 'vi' };

const COMMERCIAL_BOOKS = [
  { id: 'sapiens', title: 'Sapiens: A Brief History of Humankind', author: 'Yuval Noah Harari', note: 'Lịch sử loài người qua góc nhìn liên ngành.' },
  { id: 'homo-deus', title: 'Homo Deus: A Brief History of Tomorrow', author: 'Yuval Noah Harari', note: 'Những câu hỏi về tương lai của con người.' },
  { id: '21-lessons', title: '21 Lessons for the 21st Century', author: 'Yuval Noah Harari', note: 'Các vấn đề xã hội và công nghệ đương đại.' },
  { id: 'nexus', title: 'Nexus: A Brief History of Information Networks', author: 'Yuval Noah Harari', note: 'Câu chuyện về thông tin và các mạng lưới.' },
  { id: 'anthropocene-reviewed', title: 'The Anthropocene Reviewed', author: 'John Green', note: 'Các bài tiểu luận về con người và thế giới hiện đại.' },
  { id: 'henrietta-lacks', title: 'The Immortal Life of Henrietta Lacks', author: 'Rebecca Skloot', note: 'Khoa học, y đức và câu chuyện của tế bào HeLa.' },
  { id: 'short-history', title: 'A Short History of Nearly Everything', author: 'Bill Bryson', note: 'Lịch sử khám phá khoa học và vũ trụ.' },
  { id: 'demon-haunted-world', title: 'The Demon-Haunted World', author: 'Carl Sagan', note: 'Tư duy khoa học và cách đánh giá bằng chứng.' },
  { id: 'righteous-mind', title: 'The Righteous Mind', author: 'Jonathan Haidt', note: 'Tâm lý đạo đức, chính trị và niềm tin.' },
];

function newPersonalBookId(): string {
  return `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export default function BilingualBooksScreen() {
  useReadingFonts();
  const { L } = useL();
  const [books, setBooks] = useState<PersonalBook[]>([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const personalBooks = books.filter((book) => !book.catalogId?.startsWith('guide:'));

  const refresh = useCallback(async () => setBooks(await listPersonalBooks()), []);
  useEffect(() => {
    let active = true;
    void listPersonalBooks().then((loaded) => { if (active) setBooks(loaded); });
    return () => { active = false; };
  }, []);
  const chooseFile = (next: ImportTarget = { language: 'en' }) => {
    if (Platform.OS !== 'web') {
      setNotice(L('Tính năng nhập sách hiện dùng trên trình duyệt web. Sách đã nhập vẫn nằm trong thư viện trên thiết bị này.', 'Book import is available in a web browser. Existing books remain in this device library.'));
      return;
    }
    setNotice('');
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.txt,.md,application/pdf,text/plain,text/markdown';
    input.onchange = () => { void handleFile(input.files?.[0] ?? null, next); };
    input.click();
  };

  const handleFile = async (file: BrowserBookFile | null, selected: ImportTarget) => {
    if (!file) return;
    setBusy(true);
    setNotice(L('Đang trích xuất chữ từ sách trên thiết bị…', 'Extracting book text on this device…'));
    try {
      const pages = await extractBookPages(file);
      if (selected.language === 'vi' && selected.personalId) {
        await updatePersonalBook(selected.personalId, (book) => ({ ...book, pagesVi: pages }));
        setNotice(L(`Đã thêm bản tiếng Việt (${pages.length} trang).`, `Vietnamese edition added (${pages.length} pages).`));
      } else {
        const existing = selected.personalId
          ? books.find((book) => book.id === selected.personalId)
          : selected.catalogId ? books.find((book) => book.catalogId === selected.catalogId) : undefined;
        await savePersonalBook({
          id: existing?.id ?? newPersonalBookId(),
          catalogId: selected.catalogId ?? existing?.catalogId,
          title: selected.title ?? file.name.replace(/\.(pdf|txt|md)$/i, ''),
          author: selected.author ?? existing?.author,
          importedAt: existing?.importedAt ?? new Date().toISOString(),
          pagesEn: pages,
          pagesVi: existing?.pagesVi,
          translatedPages: existing?.translatedPages ?? {},
          currentPage: existing?.currentPage ?? 0,
        });
        setNotice(L(`Đã thêm “${file.name}” vào kệ riêng (${pages.length} trang văn bản).`, `Added “${file.name}” to your private shelf (${pages.length} text pages).`));
      }
      await refresh();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : L('Không đọc được tệp này.', 'Could not read this file.'));
    } finally {
      setBusy(false);
    }
  };

  const removeBook = async (book: PersonalBook) => {
    await deletePersonalBook(book.id);
    await refresh();
    setNotice(L(`Đã xoá “${book.title}” khỏi thiết bị này.`, `Removed “${book.title}” from this device.`));
  };

  return (
    <Screen>
      <Pressable accessibilityRole="link" onPress={() => router.back()} className="mb-3 self-start flex-row items-center gap-1.5 py-1">
        <Icon name="chevron-left" size={16} color={INK} strokeWidth={2.2} />
        <Text className="font-semi" style={{ color: INK, fontSize: 14 }}>{L('Đọc báo song ngữ', 'Bilingual reading')}</Text>
      </Pressable>

      <Appear>
        <LightHero
          scene="home"
          badge={L('THƯ VIỆN ĐỌC SONG NGỮ', 'BILINGUAL READING LIBRARY')}
          line1={L('Nguyên tác', 'Read the')}
          line2={L('cạnh bản dịch', 'original beside its translation')}
          subtitle={L('Đọc trọn bài dài ngay trên Band 9: từng đoạn tiếng Anh đặt cạnh bản Việt tương ứng, không bị chuyển sang trang PDF. Sách cá nhân được chuyển thành văn bản trong trình đọc và lưu riêng trên thiết bị.', 'Read complete texts inside Band 9: each English passage sits beside its Vietnamese translation. Personal books are converted into readable text and stored privately on this device.')}
        />
      </Appear>

      <View className="mt-5 rounded-[22px] bg-white p-5" style={CARD}>
        <View className="flex-row flex-wrap items-center justify-between gap-4">
          <View style={{ flex: 1, minWidth: 220 }}>
            <Text className="font-heavy" style={{ color: INK, fontSize: 19 }}>{L('Đọc sách bạn đang sở hữu', 'Read a book you already own')}</Text>
            <Text className="mt-1 font-sans" style={{ color: MUTED, fontSize: 14, lineHeight: 21 }}>
              {L('Nhập tệp PDF có lớp chữ hoặc TXT. Band 9 trích nội dung thành các trang văn bản để bạn đọc ngay trong web; tệp gốc không được tải lên.', 'Import a text-based PDF or TXT. Band 9 extracts it into readable text pages in the web reader; the original file is not uploaded.')}
            </Text>
          </View>
          <Pressable accessibilityRole="button" onPress={() => chooseFile({ language: 'en' })} disabled={busy} className="flex-row items-center gap-2 rounded-pill px-4 py-3" style={{ backgroundColor: color.primary, opacity: busy ? 0.65 : 1 }}>
            <Icon name="plus" size={16} color="#FFFFFF" strokeWidth={2.4} />
            <Text className="font-heavy" style={{ color: '#FFFFFF', fontSize: 13 }}>{busy ? L('Đang chuyển thành văn bản…', 'Converting to text…') : L('Đọc sách của tôi', 'Read my book')}</Text>
          </Pressable>
        </View>
        <Text className="mt-3 font-sans" style={{ color: '#7B6541', fontSize: 12.5, lineHeight: 19 }}>
          {L('Bấm “Dịch trang” trong trình đọc chỉ gửi trang đó cho AI; bản dịch không được lưu trên máy chủ.', 'Tapping “Translate page” in the reader sends only that page to AI; the translation is not stored on the server.')}
        </Text>
        {notice ? <Text accessibilityLiveRegion="polite" className="mt-3 font-semi" style={{ color: busy ? MUTED : INK, fontSize: 13 }}>{notice}</Text> : null}
      </View>

      {personalBooks.length > 0 ? (
        <View className="mt-7">
          <ShelfHeading title={L('Thư viện riêng trên thiết bị này', 'Your on-device library')} note={L(`${personalBooks.length} sách đã nhập`, `${personalBooks.length} imported`)} />
          <View className="mt-3 gap-3">
            {personalBooks.map((book) => (
              <PersonalBookCard key={book.id} book={book} onOpen={() => router.push(`/bilingual/book/${book.id}` as never)} onRemove={() => void removeBook(book)} onAddVietnamese={() => chooseFile({ language: 'vi', personalId: book.id })} />
            ))}
          </View>
        </View>
      ) : null}

      <View className="mt-7">
        <ShelfHeading title={L('Đọc trọn trong Band 9', 'Read in full on Band 9')} note={L('Văn bản nguyên bản · các đoạn dài song song Anh–Việt', 'Original texts · long English and Vietnamese passages')} />
        <View className="mt-3 flex-row flex-wrap gap-4">
          {BILINGUAL_STORIES.map((story) => (
            <Pressable key={story.id} accessibilityRole="link" onPress={() => router.push(`/bilingual/story/${story.id}` as never)} className="rounded-[22px] bg-white p-5" style={[CARD, { flexGrow: 1, flexBasis: 420, maxWidth: 760 }]}>
              <View className="flex-row items-center justify-between gap-3">
                <Text className="font-heavy" style={{ color: '#0C8F86', fontSize: 11, letterSpacing: 1.1 }}>{L(`TÁC PHẨM NGUYÊN BẢN · ${story.level}`, `BAND 9 ORIGINAL · ${story.level}`)}</Text>
                <Icon name="arrow-right" size={17} color="#8A6C39" strokeWidth={2} />
              </View>
              <View className="mt-3 rounded-[15px] px-4 py-3" style={{ backgroundColor: '#E7F5F2' }}>
                <Text className="font-heavy" style={{ color: '#087F78', fontSize: 11, letterSpacing: 1 }}>{L('ĐỌC SONG SONG', 'PARALLEL READING')}</Text>
                <Text className="mt-1 font-sans" style={{ color: '#55827F', fontSize: 12, lineHeight: 18 }}>{L('Từng đoạn nguyên tác có bản dịch tương ứng ngay bên cạnh.', 'Every original passage is paired with its translation.')}</Text>
              </View>
              <Text className="mt-4 font-heavy" style={{ color: INK, fontSize: 21, lineHeight: 28 }}>{story.titleEn}</Text>
              <Text className="mt-1 font-semi" style={{ color: '#8A6C39', fontSize: 15 }}>{story.titleVi}</Text>
              <Text className="mt-2 font-sans" style={{ color: MUTED, fontSize: 14, lineHeight: 22 }}>{story.summaryVi}</Text>
              <Text className="mt-4 font-mid" style={{ color: MUTED, fontSize: 12 }}>{story.paragraphs.length} {L('đoạn dài', 'passages')} · {story.paragraphs.reduce((sum, paragraph) => sum + paragraph.en.trim().split(/\s+/).length, 0)} {L('từ', 'words')} · {L('đọc trên web', 'in-web reader')}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View className="mt-7">
        <ShelfHeading title={L('Sách thật · đọc bản bạn có', 'Published books · bring your copy')} note={L('Nhập xong sẽ đọc ngay trong Band 9', 'Import once, read inside Band 9')} />
        <Text className="mt-1 font-sans" style={{ color: MUTED, fontSize: 13, lineHeight: 20 }}>
          {L('Đây là sách có bản quyền, không phải nội dung có sẵn trong Band 9. Chọn bản tiếng Anh bạn sở hữu để đưa chữ vào trình đọc; sau đó ghép bản dịch tiếng Việt hoặc dịch theo từng trang.', 'These are copyrighted titles, not hosted texts. Import your English copy to read it here, then pair your Vietnamese edition or translate page by page.')}
        </Text>
        <View className="mt-3 gap-3">
          {COMMERCIAL_BOOKS.map((book) => {
            const imported = books.find((item) => item.catalogId === book.id);
            return (
              <View key={book.id} className="flex-row flex-wrap items-center justify-between gap-3 rounded-[20px] bg-white p-4" style={CARD}>
                <View style={{ flex: 1, minWidth: 240 }}>
                  <Text className="font-heavy" style={{ color: INK, fontSize: 16, lineHeight: 22 }}>{book.title}</Text>
                  <Text className="mt-0.5 font-semi" style={{ color: MUTED, fontSize: 12.5 }}>{book.author}</Text>
                  <Text className="mt-1 font-sans" style={{ color: MUTED, fontSize: 12.5, lineHeight: 19 }}>{book.note}</Text>
                </View>
                {imported ? (
                  <SmallAction icon="book" label={L('Tiếp tục đọc', 'Continue reading')} onPress={() => router.push(`/bilingual/book/${imported.id}` as never)} />
                ) : (
                  <SmallAction icon="plus" label={L('Nhập bản của tôi', 'Import my copy')} onPress={() => chooseFile({ catalogId: book.id, title: book.title, author: book.author, language: 'en' })} />
                )}
              </View>
            );
          })}
        </View>
      </View>

      <Text className="mt-5 font-sans" style={{ color: MUTED, fontSize: 12, lineHeight: 18 }}>
        {L('Sách thương mại không được hiển thị bằng đường dẫn PDF bên ngoài. Hãy nhập bản bạn có để đọc thành văn bản song ngữ ngay trong Band 9; tệp vẫn chỉ lưu trên thiết bị.', 'Commercial books are not sent to external PDF links. Import your own copy to read as bilingual text inside Band 9; files remain on this device.')}
      </Text>
    </Screen>
  );
}

function ShelfHeading({ title, note }: { title: string; note: string }) {
  return (
    <View className="flex-row flex-wrap items-end justify-between gap-2">
      <Text className="font-heavy" style={{ color: INK, fontSize: 20 }}>{title}</Text>
      <Text className="font-mid" style={{ color: MUTED, fontSize: 12.5 }}>{note}</Text>
    </View>
  );
}

function PersonalBookCard({ book, onOpen, onRemove, onAddVietnamese }: { book: PersonalBook; onOpen: () => void; onRemove: () => void; onAddVietnamese: () => void }) {
  const { L } = useL();
  return (
    <View className="rounded-[20px] bg-white p-4" style={CARD}>
      <View className="flex-row items-start justify-between gap-3">
        <View style={{ flex: 1 }}>
          <Text className="font-heavy" style={{ color: INK, fontSize: 16.5 }}>{book.title}</Text>
          <Text className="mt-1 font-sans" style={{ color: MUTED, fontSize: 12.5 }}>{book.author ?? L('Sách cá nhân', 'Personal book')} · {book.pagesEn.length} {L('trang', 'pages')}</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={L(`Xoá ${book.title}`, `Remove ${book.title}`)} onPress={onRemove} className="h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: '#F8F4EC' }}>
          <Icon name="close" size={15} color={MUTED} strokeWidth={1.9} />
        </Pressable>
      </View>
      <View className="mt-3 flex-row flex-wrap gap-2">
        <SmallAction icon="book" label={L('Mở trình đọc', 'Open reader')} onPress={onOpen} />
        {!book.pagesVi?.length ? <SmallAction icon="plus" label={L('Thêm bản dịch tiếng Việt', 'Add Vietnamese edition')} onPress={onAddVietnamese} /> : <Text className="self-center font-mid" style={{ color: '#58816D', fontSize: 12 }}>{L(`Đã ghép ${book.pagesVi.length} trang tiếng Việt`, `${book.pagesVi.length} Vietnamese pages paired`)}</Text>}
      </View>
    </View>
  );
}

function SmallAction({ icon, label, onPress }: { icon: 'book' | 'plus'; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} className="flex-row items-center gap-1.5 rounded-pill px-3 py-2" style={{ backgroundColor: '#FAF7F0', borderWidth: 1, borderColor: '#EEE7DB' }}>
      <Icon name={icon} size={14} color="#8A6C39" strokeWidth={2} />
      <Text className="font-semi" style={{ color: INK, fontSize: 12 }}>{label}</Text>
    </Pressable>
  );
}
