import type { SatTextType } from '@/types/database';

/**
 * Danh mục tác phẩm dùng làm nguồn passage SAT.
 *
 * SAT Reading and Writing lấy đề từ bốn loại văn bản: văn học, lịch sử / khoa
 * học xã hội (gồm nhóm văn kiện lập quốc và diễn văn thường gọi là "Great
 * Global Conversation"), nhân văn, và khoa học. Danh sách dưới đây bám đúng bốn
 * loại đó, chọn trong phần public domain của Project Gutenberg — cùng kho mà
 * bản thân đề thi hay trích.
 *
 * MỌI ID ĐÃ ĐỐI CHIẾU THẬT với catalogue (gutendex) ngày 10/08/2026. Thêm tác
 * phẩm mới thì phải đối chiếu lại: id Gutenberg không nói lên tên sách, đoán sai
 * một số là cào về nhầm cuốn khác mà không có gì báo lỗi.
 *
 * Đây là file DUY NHẤT phải sửa khi muốn thêm/bớt bài SAT.
 */
export type GutenbergWork = {
  /** Số hiệu ebook trên gutenberg.org. */
  id: number;
  /** Tên hiển thị, đã rút gọn khỏi tiêu đề dài dòng của catalogue. */
  title: string;
  author: string;
  /** Năm xuất bản bản gốc, để người học biết mình đang đọc văn thời nào. */
  year: number;
  topic: string;
  satTextType: SatTextType;
};

/** Nhãn tiếng Việt cho từng loại văn bản, dùng trong tóm tắt bài. */
export const SAT_TEXT_TYPE_LABEL: Record<SatTextType, string> = {
  literature: 'văn học',
  history_social: 'lịch sử & khoa học xã hội',
  humanities: 'nhân văn',
  science: 'khoa học',
};

const LITERATURE: GutenbergWork[] = [
  { id: 1342, title: 'Pride and Prejudice', author: 'Jane Austen', year: 1813, topic: 'literature', satTextType: 'literature' },
  { id: 158, title: 'Emma', author: 'Jane Austen', year: 1815, topic: 'literature', satTextType: 'literature' },
  { id: 161, title: 'Sense and Sensibility', author: 'Jane Austen', year: 1811, topic: 'literature', satTextType: 'literature' },
  { id: 105, title: 'Persuasion', author: 'Jane Austen', year: 1817, topic: 'literature', satTextType: 'literature' },
  { id: 1260, title: 'Jane Eyre', author: 'Charlotte Brontë', year: 1847, topic: 'literature', satTextType: 'literature' },
  { id: 768, title: 'Wuthering Heights', author: 'Emily Brontë', year: 1847, topic: 'literature', satTextType: 'literature' },
  { id: 145, title: 'Middlemarch', author: 'George Eliot', year: 1872, topic: 'literature', satTextType: 'literature' },
  { id: 550, title: 'Silas Marner', author: 'George Eliot', year: 1861, topic: 'literature', satTextType: 'literature' },
  { id: 1400, title: 'Great Expectations', author: 'Charles Dickens', year: 1861, topic: 'literature', satTextType: 'literature' },
  { id: 98, title: 'A Tale of Two Cities', author: 'Charles Dickens', year: 1859, topic: 'literature', satTextType: 'literature' },
  { id: 786, title: 'Hard Times', author: 'Charles Dickens', year: 1854, topic: 'literature', satTextType: 'literature' },
  { id: 110, title: "Tess of the d'Urbervilles", author: 'Thomas Hardy', year: 1891, topic: 'literature', satTextType: 'literature' },
  { id: 122, title: 'The Return of the Native', author: 'Thomas Hardy', year: 1878, topic: 'literature', satTextType: 'literature' },
  { id: 174, title: 'The Picture of Dorian Gray', author: 'Oscar Wilde', year: 1890, topic: 'literature', satTextType: 'literature' },
  { id: 219, title: 'Heart of Darkness', author: 'Joseph Conrad', year: 1899, topic: 'literature', satTextType: 'literature' },
  { id: 2226, title: 'Kim', author: 'Rudyard Kipling', year: 1901, topic: 'literature', satTextType: 'literature' },
  { id: 84, title: 'Frankenstein', author: 'Mary Shelley', year: 1818, topic: 'literature', satTextType: 'literature' },
  { id: 33, title: 'The Scarlet Letter', author: 'Nathaniel Hawthorne', year: 1850, topic: 'literature', satTextType: 'literature' },
  { id: 2701, title: 'Moby-Dick', author: 'Herman Melville', year: 1851, topic: 'literature', satTextType: 'literature' },
  { id: 76, title: 'Adventures of Huckleberry Finn', author: 'Mark Twain', year: 1884, topic: 'literature', satTextType: 'literature' },
  { id: 160, title: 'The Awakening', author: 'Kate Chopin', year: 1899, topic: 'literature', satTextType: 'literature' },
  { id: 541, title: 'The Age of Innocence', author: 'Edith Wharton', year: 1920, topic: 'literature', satTextType: 'literature' },
  { id: 284, title: 'The House of Mirth', author: 'Edith Wharton', year: 1905, topic: 'literature', satTextType: 'literature' },
  { id: 4517, title: 'Ethan Frome', author: 'Edith Wharton', year: 1911, topic: 'literature', satTextType: 'literature' },
  { id: 242, title: 'My Ántonia', author: 'Willa Cather', year: 1918, topic: 'literature', satTextType: 'literature' },
  { id: 24, title: 'O Pioneers!', author: 'Willa Cather', year: 1913, topic: 'literature', satTextType: 'literature' },
  { id: 233, title: 'Sister Carrie', author: 'Theodore Dreiser', year: 1900, topic: 'literature', satTextType: 'literature' },
  { id: 2833, title: 'The Portrait of a Lady', author: 'Henry James', year: 1881, topic: 'literature', satTextType: 'literature' },
  { id: 73, title: 'The Red Badge of Courage', author: 'Stephen Crane', year: 1895, topic: 'literature', satTextType: 'literature' },
  { id: 215, title: 'The Call of the Wild', author: 'Jack London', year: 1903, topic: 'literature', satTextType: 'literature' },
  { id: 416, title: 'Winesburg, Ohio', author: 'Sherwood Anderson', year: 1919, topic: 'literature', satTextType: 'literature' },
  { id: 543, title: 'Main Street', author: 'Sinclair Lewis', year: 1920, topic: 'literature', satTextType: 'literature' },
  { id: 1156, title: 'Babbitt', author: 'Sinclair Lewis', year: 1922, topic: 'literature', satTextType: 'literature' },
  { id: 64317, title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', year: 1925, topic: 'literature', satTextType: 'literature' },
  { id: 2814, title: 'Dubliners', author: 'James Joyce', year: 1914, topic: 'literature', satTextType: 'literature' },
  { id: 140, title: 'The Jungle', author: 'Upton Sinclair', year: 1906, topic: 'literature', satTextType: 'literature' },
  { id: 514, title: 'Little Women', author: 'Louisa May Alcott', year: 1868, topic: 'literature', satTextType: 'literature' },
  { id: 32, title: 'Herland', author: 'Charlotte Perkins Gilman', year: 1915, topic: 'literature', satTextType: 'literature' },
  // Nhóm tác giả da màu và tác giả nhập cư — SAT lấy đề rất nhiều từ mảng này,
  // và đây cũng là phần thiếu nhất trong các danh mục "kinh điển" mặc định.
  { id: 11666, title: 'The Conjure Woman', author: 'Charles W. Chesnutt', year: 1899, topic: 'literature', satTextType: 'literature' },
  { id: 11228, title: 'The Marrow of Tradition', author: 'Charles W. Chesnutt', year: 1901, topic: 'literature', satTextType: 'literature' },
  { id: 62940, title: 'Mrs. Spring Fragrance', author: 'Sui Sin Far', year: 1912, topic: 'literature', satTextType: 'literature' },
  { id: 12352, title: 'Iola Leroy', author: 'Frances E. W. Harper', year: 1892, topic: 'literature', satTextType: 'literature' },
  { id: 60093, title: 'Cane', author: 'Jean Toomer', year: 1923, topic: 'literature', satTextType: 'literature' },
  { id: 10376, title: 'American Indian Stories', author: 'Zitkala-Ša', year: 1921, topic: 'literature', satTextType: 'literature' },
  { id: 15265, title: 'The Quest of the Silver Fleece', author: 'W. E. B. Du Bois', year: 1911, topic: 'literature', satTextType: 'literature' },
];

/**
 * "Great Global Conversation": văn kiện lập quốc, diễn văn, hồi ký nô lệ và
 * luận thuyết chính trị — nhóm mà SAT gọi là founding documents.
 */
const HISTORY_SOCIAL: GutenbergWork[] = [
  { id: 1, title: 'The Declaration of Independence', author: 'Thomas Jefferson', year: 1776, topic: 'history', satTextType: 'history_social' },
  { id: 5, title: 'The United States Constitution', author: 'Hội nghị Lập hiến Hoa Kỳ', year: 1787, topic: 'history', satTextType: 'history_social' },
  { id: 1404, title: 'The Federalist Papers', author: 'Hamilton, Madison & Jay', year: 1788, topic: 'history', satTextType: 'history_social' },
  { id: 147, title: 'Common Sense', author: 'Thomas Paine', year: 1776, topic: 'history', satTextType: 'history_social' },
  { id: 3420, title: 'A Vindication of the Rights of Woman', author: 'Mary Wollstonecraft', year: 1792, topic: 'society', satTextType: 'history_social' },
  { id: 34901, title: 'On Liberty', author: 'John Stuart Mill', year: 1859, topic: 'society', satTextType: 'history_social' },
  { id: 815, title: 'Democracy in America', author: 'Alexis de Tocqueville', year: 1835, topic: 'society', satTextType: 'history_social' },
  { id: 3207, title: 'Leviathan', author: 'Thomas Hobbes', year: 1651, topic: 'society', satTextType: 'history_social' },
  { id: 2130, title: 'Utopia', author: 'Thomas More', year: 1516, topic: 'society', satTextType: 'history_social' },
  { id: 23, title: 'Narrative of the Life of Frederick Douglass', author: 'Frederick Douglass', year: 1845, topic: 'history', satTextType: 'history_social' },
  { id: 202, title: 'My Bondage and My Freedom', author: 'Frederick Douglass', year: 1855, topic: 'history', satTextType: 'history_social' },
  { id: 11030, title: 'Incidents in the Life of a Slave Girl', author: 'Harriet Jacobs', year: 1861, topic: 'history', satTextType: 'history_social' },
  { id: 15399, title: 'The Interesting Narrative of the Life of Olaudah Equiano', author: 'Olaudah Equiano', year: 1789, topic: 'history', satTextType: 'history_social' },
  { id: 408, title: 'The Souls of Black Folk', author: 'W. E. B. Du Bois', year: 1903, topic: 'society', satTextType: 'history_social' },
  { id: 2376, title: 'Up from Slavery', author: 'Booker T. Washington', year: 1901, topic: 'history', satTextType: 'history_social' },
  { id: 14721, title: 'Speeches & Letters, 1832–1865', author: 'Abraham Lincoln', year: 1865, topic: 'history', satTextType: 'history_social' },
  { id: 1325, title: 'Twenty Years at Hull House', author: 'Jane Addams', year: 1910, topic: 'society', satTextType: 'history_social' },
  { id: 57913, title: 'Women and Economics', author: 'Charlotte Perkins Gilman', year: 1898, topic: 'society', satTextType: 'history_social' },
  { id: 833, title: 'The Theory of the Leisure Class', author: 'Thorstein Veblen', year: 1899, topic: 'business', satTextType: 'history_social' },
  { id: 3300, title: 'The Wealth of Nations', author: 'Adam Smith', year: 1776, topic: 'business', satTextType: 'history_social' },
];

const SCIENCE: GutenbergWork[] = [
  { id: 1228, title: 'On the Origin of Species', author: 'Charles Darwin', year: 1859, topic: 'science', satTextType: 'science' },
  { id: 2300, title: 'The Descent of Man', author: 'Charles Darwin', year: 1871, topic: 'science', satTextType: 'science' },
  { id: 944, title: 'The Voyage of the Beagle', author: 'Charles Darwin', year: 1839, topic: 'science', satTextType: 'science' },
  { id: 2530, title: 'The Malay Archipelago', author: 'Alfred Russel Wallace', year: 1869, topic: 'science', satTextType: 'science' },
  { id: 2940, title: 'Evolution and Ethics', author: 'Thomas Henry Huxley', year: 1893, topic: 'science', satTextType: 'science' },
  { id: 30155, title: 'Relativity: The Special and General Theory', author: 'Albert Einstein', year: 1916, topic: 'science', satTextType: 'science' },
  { id: 14474, title: 'The Chemical History of a Candle', author: 'Michael Faraday', year: 1861, topic: 'science', satTextType: 'science' },
  { id: 15491, title: 'Micrographia', author: 'Robert Hooke', year: 1665, topic: 'science', satTextType: 'science' },
  { id: 4511, title: 'The Life of the Bee', author: 'Maurice Maeterlinck', year: 1901, topic: 'science', satTextType: 'science' },
  { id: 18350, title: 'Social Life in the Insect World', author: 'Jean-Henri Fabre', year: 1911, topic: 'science', satTextType: 'science' },
];

const HUMANITIES: GutenbergWork[] = [
  { id: 16643, title: 'Essays: First and Second Series', author: 'Ralph Waldo Emerson', year: 1841, topic: 'culture', satTextType: 'humanities' },
  { id: 205, title: 'Walden, and On the Duty of Civil Disobedience', author: 'Henry David Thoreau', year: 1854, topic: 'culture', satTextType: 'humanities' },
  { id: 1497, title: 'The Republic', author: 'Plato', year: -375, topic: 'culture', satTextType: 'humanities' },
  { id: 2680, title: 'Meditations', author: 'Marcus Aurelius', year: 180, topic: 'culture', satTextType: 'humanities' },
  { id: 20203, title: 'Autobiography of Benjamin Franklin', author: 'Benjamin Franklin', year: 1791, topic: 'culture', satTextType: 'humanities' },
  { id: 2397, title: 'The Story of My Life', author: 'Helen Keller', year: 1903, topic: 'education', satTextType: 'humanities' },
  { id: 20885, title: 'The Promised Land', author: 'Mary Antin', year: 1912, topic: 'culture', satTextType: 'humanities' },
  { id: 16287, title: 'Talks to Teachers on Psychology', author: 'William James', year: 1899, topic: 'psychology', satTextType: 'humanities' },
];

export const GUTENBERG_WORKS: readonly GutenbergWork[] = [
  ...LITERATURE,
  ...HISTORY_SOCIAL,
  ...SCIENCE,
  ...HUMANITIES,
];
