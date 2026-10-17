/**
 * Dữ liệu album sưu tầm theo tuần. Mỗi album có đúng 8 ô (sticker), xoay vòng theo
 * số tuần (`services/game/album.ts` → `albumForWeek`). Thêm album mới thì để ở cuối
 * mảng: đổi thứ tự là đổi album của mọi tuần đã qua.
 *
 * Mỗi ô: tên nhân vật (VI/EN), chủ đề IELTS (VI/EN) và màu chủ đề để tô ô khi mở.
 */

export type AlbumSticker = {
  id: string;
  name: string;
  nameEn: string;
  topic: string;
  topicEn: string;
  /** Màu chủ đề của ô (hex). */
  tone: string;
  /** Biểu tượng nhỏ của nhân vật. */
  glyph: string;
};

export type AlbumDef = {
  key: string;
  title: string;
  titleEn: string;
  stickers: readonly AlbumSticker[];
};

export const ALBUMS: readonly AlbumDef[] = [
  {
    key: 'du-lich',
    title: 'Bộ Du Lịch',
    titleEn: 'Travel Set',
    stickers: [
      { id: 'du-lich-1', name: 'Cún Sân Bay', nameEn: 'Airport Puppy', topic: 'Từ Vựng Du Lịch', topicEn: 'Travel Vocabulary', tone: '#F2B632', glyph: '🐶' },
      { id: 'du-lich-2', name: 'Thỏ Khách Sạn', nameEn: 'Hotel Bunny', topic: 'Đặt Phòng', topicEn: 'Booking a Room', tone: '#F472B6', glyph: '🐰' },
      { id: 'du-lich-3', name: 'Cú Bản Đồ', nameEn: 'Map Owl', topic: 'Chỉ Đường', topicEn: 'Giving Directions', tone: '#4F8FD8', glyph: '🦉' },
      { id: 'du-lich-4', name: 'Mèo Vé Tàu', nameEn: 'Ticket Cat', topic: 'Nghe Số Liệu', topicEn: 'Listening for Numbers', tone: '#22A06B', glyph: '🐱' },
      { id: 'du-lich-5', name: 'Gấu Hải Quan', nameEn: 'Customs Bear', topic: 'Câu Điều Kiện', topicEn: 'Conditionals', tone: '#E0533D', glyph: '🐻' },
      { id: 'du-lich-6', name: 'Ốc Biển', nameEn: 'Sea Snail', topic: 'Chính Tả', topicEn: 'Spelling', tone: '#0EA5A4', glyph: '🐚' },
      { id: 'du-lich-7', name: 'Hươu Ga Tàu', nameEn: 'Station Deer', topic: 'Phát Âm Âm Cuối', topicEn: 'Final Consonants', tone: '#A855F7', glyph: '🦌' },
      { id: 'du-lich-8', name: 'Sóc Hộ Chiếu', nameEn: 'Passport Squirrel', topic: 'Cụm Từ Cố Định', topicEn: 'Collocations', tone: '#F0703F', glyph: '🐿️' },
    ],
  },
  {
    key: 'hoc-thuat',
    title: 'Bộ Học Thuật',
    titleEn: 'Academic Set',
    stickers: [
      { id: 'hoc-thuat-1', name: 'Cú Biểu Đồ', nameEn: 'Chart Owl', topic: 'Mô Tả Biểu Đồ', topicEn: 'Describing Charts', tone: '#4F8FD8', glyph: '🦉' },
      { id: 'hoc-thuat-2', name: 'Rùa Số Liệu', nameEn: 'Data Turtle', topic: 'Số Liệu & Phần Trăm', topicEn: 'Numbers & Percentages', tone: '#22A06B', glyph: '🐢' },
      { id: 'hoc-thuat-3', name: 'Ong Từ Nối', nameEn: 'Linker Bee', topic: 'Từ Nối Lập Luận', topicEn: 'Linking Words', tone: '#F2B632', glyph: '🐝' },
      { id: 'hoc-thuat-4', name: 'Hải Ly Bài Luận', nameEn: 'Essay Beaver', topic: 'Viết Task 2', topicEn: 'Writing Task 2', tone: '#E0533D', glyph: '🦫' },
      { id: 'hoc-thuat-5', name: 'Cáo Diễn Đạt', nameEn: 'Paraphrase Fox', topic: 'Diễn Đạt Lại', topicEn: 'Paraphrasing', tone: '#F0703F', glyph: '🦊' },
      { id: 'hoc-thuat-6', name: 'Gà Mạo Từ', nameEn: 'Article Hen', topic: 'Mạo Từ A/An/The', topicEn: 'Articles', tone: '#F472B6', glyph: '🐔' },
      { id: 'hoc-thuat-7', name: 'Nai Thì', nameEn: 'Tense Deer', topic: 'Thì Hoàn Thành', topicEn: 'Perfect Tenses', tone: '#A855F7', glyph: '🦌' },
      { id: 'hoc-thuat-8', name: 'Thỏ Đọc Lướt', nameEn: 'Skim Rabbit', topic: 'Đọc Lướt Lấy Ý', topicEn: 'Skimming', tone: '#0EA5A4', glyph: '🐇' },
    ],
  },
  {
    key: 'doi-song',
    title: 'Bộ Đời Sống',
    titleEn: 'Daily Life Set',
    stickers: [
      { id: 'doi-song-1', name: 'Mèo Bếp', nameEn: 'Kitchen Cat', topic: 'Từ Vựng Ẩm Thực', topicEn: 'Food Vocabulary', tone: '#F2B632', glyph: '🐈' },
      { id: 'doi-song-2', name: 'Chó Gia Đình', nameEn: 'Family Dog', topic: 'Miêu Tả Người', topicEn: 'Describing People', tone: '#F472B6', glyph: '🐕' },
      { id: 'doi-song-3', name: 'Gấu Công Sở', nameEn: 'Office Bear', topic: 'Từ Vựng Công Việc', topicEn: 'Work Vocabulary', tone: '#4F8FD8', glyph: '🐻' },
      { id: 'doi-song-4', name: 'Ếch Thể Thao', nameEn: 'Sporty Frog', topic: 'Thể Thao & Sức Khoẻ', topicEn: 'Sport & Health', tone: '#22A06B', glyph: '🐸' },
      { id: 'doi-song-5', name: 'Cá Mập Nếu', nameEn: 'If Shark', topic: 'Câu Điều Kiện', topicEn: 'Conditionals', tone: '#E0533D', glyph: '🦈' },
      { id: 'doi-song-6', name: 'Cò Chính Tả', nameEn: 'Spelling Stork', topic: 'Chính Tả', topicEn: 'Spelling', tone: '#0EA5A4', glyph: '🦩' },
      { id: 'doi-song-7', name: 'Vẹt Phát Âm', nameEn: 'Pronunciation Parrot', topic: 'Trọng Âm Từ', topicEn: 'Word Stress', tone: '#A855F7', glyph: '🦜' },
      { id: 'doi-song-8', name: 'Lợn Đồng Nghĩa', nameEn: 'Synonym Pig', topic: 'Từ Đồng Nghĩa', topicEn: 'Synonyms', tone: '#F0703F', glyph: '🐷' },
    ],
  },
  {
    key: 'thanh-pho',
    title: 'Bộ Thành Phố',
    titleEn: 'City Set',
    stickers: [
      { id: 'thanh-pho-1', name: 'Chim Tàu Điện', nameEn: 'Tram Bird', topic: 'Nghe Hội Thoại', topicEn: 'Conversations', tone: '#4F8FD8', glyph: '🐦' },
      { id: 'thanh-pho-2', name: 'Chồn Chợ', nameEn: 'Market Ferret', topic: 'Mua Sắm', topicEn: 'Shopping', tone: '#F2B632', glyph: '🦦' },
      { id: 'thanh-pho-3', name: 'Hổ Công Viên', nameEn: 'Park Tiger', topic: 'Thời Tiết', topicEn: 'Weather', tone: '#22A06B', glyph: '🐯' },
      { id: 'thanh-pho-4', name: 'Hà Mã Phố Cổ', nameEn: 'Old Town Hippo', topic: 'Mô Tả Địa Điểm', topicEn: 'Describing Places', tone: '#F472B6', glyph: '🦛' },
      { id: 'thanh-pho-5', name: 'Khỉ Mạng', nameEn: 'Web Monkey', topic: 'Công Nghệ', topicEn: 'Technology', tone: '#A855F7', glyph: '🐵' },
      { id: 'thanh-pho-6', name: 'Ngựa Tiền Bạc', nameEn: 'Money Horse', topic: 'Tiền Bạc & Kinh Tế', topicEn: 'Money & Economy', tone: '#E0533D', glyph: '🐴' },
      { id: 'thanh-pho-7', name: 'Sư Tử Xanh', nameEn: 'Green Lion', topic: 'Môi Trường', topicEn: 'Environment', tone: '#0EA5A4', glyph: '🦁' },
      { id: 'thanh-pho-8', name: 'Vịt Tin Tức', nameEn: 'News Duck', topic: 'Đọc Tin Tức', topicEn: 'News Reading', tone: '#F0703F', glyph: '🦆' },
    ],
  },
];
