/**
 * 44 âm vị tiếng Anh (Anh–Mỹ chung) cho lộ trình phát âm của Band 9.
 *
 * Mỗi âm có: nhóm, ví dụ (từ + phiên âm), một mẹo khẩu hình viết bằng tiếng Việt,
 * và `viTrap` khi người Việt hay mắc (`final`: quên bật âm cuối; `confuse`: lẫn với
 * một âm gần giống). Các mẹo là lời của Band 9, không chép từ nguồn nào.
 */

export type PhonemeGroup = 'monophthong' | 'diphthong' | 'consonant';

export type Phoneme = {
  symbol: string;
  group: PhonemeGroup;
  /** Nhãn chương trong bản đồ học. */
  chapter: 'short-long' | 'diphthong' | 'voiceless-voiced' | 'nasal-liquid';
  examples: [word: string, ipa: string][];
  tipVi: string;
  viTrap?: 'final' | 'confuse';
  /** Âm dễ nhầm để game cặp âm tối thiểu đối chiếu. */
  pairWith?: string;
};

export const PHONEMES: Phoneme[] = [
  // Nguyên âm đơn (12)
  { symbol: 'iː', group: 'monophthong', chapter: 'short-long', examples: [['sheep', '/ʃiːp/'], ['see', '/siː/']], tipVi: 'Hai khoé môi kéo sang hai bên, lưỡi cao và căng. Kéo dài âm, đừng rút ngắn.', pairWith: 'ɪ' },
  { symbol: 'ɪ', group: 'monophthong', chapter: 'short-long', examples: [['ship', '/ʃɪp/'], ['sit', '/sɪt/']], tipVi: 'Miệng hơi mở, lưỡi thả lỏng hơn /iː/. Âm ngắn, dứt khoát.', pairWith: 'iː' },
  { symbol: 'e', group: 'monophthong', chapter: 'short-long', examples: [['bed', '/bed/'], ['pen', '/pen/']], tipVi: 'Miệng mở vừa, lưỡi giữa hạ thấp hơn /ɪ/. Đừng biến thành "e" tiếng Việt kéo dài.', pairWith: 'æ' },
  { symbol: 'æ', group: 'monophthong', chapter: 'short-long', examples: [['cat', '/kæt/'], ['bad', '/bæd/']], tipVi: 'Hạ hàm xuống thấp, miệng mở rộng hơn /e/. Đừng đọc thành "e" hay "a".', pairWith: 'e' },
  { symbol: 'ɜː', group: 'monophthong', chapter: 'short-long', examples: [['bird', '/bɜːd/'], ['work', '/wɜːk/']], tipVi: 'Lưỡi ở giữa miệng, môi hơi tròn nhẹ. Đừng phát âm chữ r.' },
  { symbol: 'ə', group: 'monophthong', chapter: 'short-long', examples: [['about', '/əˈbaʊt/'], ['banana', '/bəˈnɑːnə/']], tipVi: 'Âm yếu nhất, miệng thư giãn. Chỉ xuất hiện ở âm tiết không nhấn.' },
  { symbol: 'ʌ', group: 'monophthong', chapter: 'short-long', examples: [['cup', '/kʌp/'], ['luck', '/lʌk/']], tipVi: 'Miệng mở vừa, lưỡi thấp, âm ngắn và mạnh. Không đọc thành "ơ" kéo dài.' },
  { symbol: 'ɑː', group: 'monophthong', chapter: 'short-long', examples: [['father', '/ˈfɑːðə/'], ['car', '/kɑː/']], tipVi: 'Miệng mở rộng, lưỡi thấp và lùi về phía sau. Kéo dài âm.' },
  { symbol: 'ɒ', group: 'monophthong', chapter: 'short-long', examples: [['hot', '/hɒt/'], ['lot', '/lɒt/']], tipVi: 'Môi hơi tròn, miệng mở, âm ngắn. Đừng kéo dài như /ɔː/.', pairWith: 'ʌ' },
  { symbol: 'ɔː', group: 'monophthong', chapter: 'short-long', examples: [['door', '/dɔː/'], ['law', '/lɔː/']], tipVi: 'Môi tròn, lưỡi lùi về sau, kéo dài âm.' },
  { symbol: 'ʊ', group: 'monophthong', chapter: 'short-long', examples: [['book', '/bʊk/'], ['good', '/ɡʊd/']], tipVi: 'Môi tròn nhẹ, âm ngắn, không kéo dài như /uː/.', pairWith: 'uː' },
  { symbol: 'uː', group: 'monophthong', chapter: 'short-long', examples: [['food', '/fuːd/'], ['blue', '/bluː/']], tipVi: 'Môi tròn chặt, lưỡi cao và lùi, kéo dài âm.', pairWith: 'ʊ' },
  // Nguyên âm đôi (8)
  { symbol: 'eɪ', group: 'diphthong', chapter: 'diphthong', examples: [['day', '/deɪ/'], ['make', '/meɪk/']], tipVi: 'Bắt đầu từ /e/ rồi trượt lên /ɪ/. Đừng tách thành hai âm rời.' },
  { symbol: 'aɪ', group: 'diphthong', chapter: 'diphthong', examples: [['time', '/taɪm/'], ['my', '/maɪ/']], tipVi: 'Bắt đầu từ /ɑː/ mở rộng rồi trượt lên /ɪ/.' },
  { symbol: 'ɔɪ', group: 'diphthong', chapter: 'diphthong', examples: [['boy', '/bɔɪ/'], ['voice', '/vɔɪs/']], tipVi: 'Từ /ɔː/ trượt sang /ɪ/. Môi tròn ở đầu rồi kéo dần sang hai bên.' },
  { symbol: 'aʊ', group: 'diphthong', chapter: 'diphthong', examples: [['now', '/naʊ/'], ['out', '/aʊt/']], tipVi: 'Từ /ɑː/ trượt sang /ʊ/. Môi tròn dần ở cuối.' },
  { symbol: 'əʊ', group: 'diphthong', chapter: 'diphthong', examples: [['go', '/ɡəʊ/'], ['phone', '/fəʊn/']], tipVi: 'Bắt đầu từ /ə/ rồi tròn môi dần thành /ʊ/. Đừng đọc thành "âu" tiếng Việt.' },
  { symbol: 'ɪə', group: 'diphthong', chapter: 'diphthong', examples: [['near', '/nɪə/'], ['here', '/hɪə/']], tipVi: 'Từ /ɪ/ trượt nhẹ sang /ə/. Âm kết thúc yếu.' },
  { symbol: 'eə', group: 'diphthong', chapter: 'diphthong', examples: [['air', '/eə/'], ['where', '/weə/']], tipVi: 'Từ /e/ trượt sang /ə/. Đừng kéo thành hai âm riêng.' },
  { symbol: 'ʊə', group: 'diphthong', chapter: 'diphthong', examples: [['tour', '/tʊə/'], ['sure', '/ʃʊə/']], tipVi: 'Từ /ʊ/ trượt sang /ə/. Âm này hiếm, dễ đọc thành /ɔː/.' },
  // Phụ âm (24)
  { symbol: 'p', group: 'consonant', chapter: 'voiceless-voiced', examples: [['pen', '/pen/'], ['park', '/pɑːk/']], tipVi: 'Bật hơi nhẹ từ môi. Ở cuối từ phải khép môi, đừng bỏ lửng.', viTrap: 'final', pairWith: 'b' },
  { symbol: 'b', group: 'consonant', chapter: 'voiceless-voiced', examples: [['bad', '/bæd/'], ['big', '/bɪɡ/']], tipVi: 'Giống /p/ nhưng có rung dây thanh. Môi khép rồi bật.' },
  { symbol: 't', group: 'consonant', chapter: 'voiceless-voiced', examples: [['tea', '/tiː/'], ['stop', '/stɒp/']], tipVi: 'Đầu lưỡi chạm lợi trên rồi bật. Ở cuối từ phải chặn hơi, không thêm âm "ơ".', viTrap: 'final', pairWith: 'd' },
  { symbol: 'd', group: 'consonant', chapter: 'voiceless-voiced', examples: [['dog', '/dɒɡ/'], ['red', '/red/']], tipVi: 'Giống /t/ nhưng có rung dây thanh.', viTrap: 'final', pairWith: 't' },
  { symbol: 'k', group: 'consonant', chapter: 'voiceless-voiced', examples: [['key', '/kiː/'], ['back', '/bæk/']], tipVi: 'Gốc lưỡi chạm vòm mềm rồi bật. Cuối từ phải khép, đừng bỏ âm.', viTrap: 'final' },
  { symbol: 'ɡ', group: 'consonant', chapter: 'voiceless-voiced', examples: [['game', '/ɡeɪm/'], ['big', '/bɪɡ/']], tipVi: 'Giống /k/ nhưng có rung dây thanh. Đừng đọc thành "ghì" tiếng Việt.' },
  { symbol: 'f', group: 'consonant', chapter: 'voiceless-voiced', examples: [['fish', '/fɪʃ/'], ['off', '/ɒf/']], tipVi: 'Răng trên chạm nhẹ môi dưới rồi thổi hơi. Không dùng môi hai bên như "ph" tiếng Việt.', pairWith: 'v' },
  { symbol: 'v', group: 'consonant', chapter: 'voiceless-voiced', examples: [['very', '/ˈveri/'], ['love', '/lʌv/']], tipVi: 'Giống /f/ nhưng có rung dây thanh. Đừng đọc thành /b/.', viTrap: 'confuse', pairWith: 'b' },
  { symbol: 'θ', group: 'consonant', chapter: 'voiceless-voiced', examples: [['think', '/θɪŋk/'], ['teeth', '/tiːθ/']], tipVi: 'Đặt đầu lưỡi giữa hai hàm răng rồi thổi hơi nhẹ. Không đọc thành /t/ hay /s/.', viTrap: 'confuse', pairWith: 's' },
  { symbol: 'ð', group: 'consonant', chapter: 'voiceless-voiced', examples: [['this', '/ðɪs/'], ['mother', '/ˈmʌðə/']], tipVi: 'Giống /θ/ nhưng có rung dây thanh. Không đọc thành /d/.', viTrap: 'confuse', pairWith: 'd' },
  { symbol: 's', group: 'consonant', chapter: 'voiceless-voiced', examples: [['sun', '/sʌn/'], ['bus', '/bʌs/']], tipVi: 'Lưỡi gần lợi trên, luồng hơi hẹp, không rung. Cuối từ phải có âm "x" nhẹ.', viTrap: 'final', pairWith: 'ʃ' },
  { symbol: 'z', group: 'consonant', chapter: 'voiceless-voiced', examples: [['zoo', '/zuː/'], ['buzz', '/bʌz/']], tipVi: 'Giống /s/ nhưng có rung dây thanh.', viTrap: 'final', pairWith: 's' },
  { symbol: 'ʃ', group: 'consonant', chapter: 'voiceless-voiced', examples: [['she', '/ʃiː/'], ['wash', '/wɒʃ/']], tipVi: 'Môi hơi tròn, lưỡi gần vòm trên, hơi xì ra. Không đọc thành "x" tiếng Việt.', pairWith: 's' },
  { symbol: 'ʒ', group: 'consonant', chapter: 'voiceless-voiced', examples: [['vision', '/ˈvɪʒn/'], ['measure', '/ˈmeʒə/']], tipVi: 'Giống /ʃ/ nhưng có rung dây thanh.', viTrap: 'confuse' },
  { symbol: 'h', group: 'consonant', chapter: 'voiceless-voiced', examples: [['hat', '/hæt/'], ['home', '/həʊm/']], tipVi: 'Thở nhẹ từ cổ họng, không ma sát mạnh.' },
  { symbol: 'tʃ', group: 'consonant', chapter: 'voiceless-voiced', examples: [['chair', '/tʃeə/'], ['watch', '/wɒtʃ/']], tipVi: 'Bắt đầu từ /t/ rồi xì nhẹ thành /ʃ/. Không đọc thành "ch" hay "tr" tiếng Việt.', viTrap: 'confuse', pairWith: 'ʃ' },
  { symbol: 'dʒ', group: 'consonant', chapter: 'voiceless-voiced', examples: [['job', '/dʒɒb/'], ['page', '/peɪdʒ/']], tipVi: 'Giống /tʃ/ nhưng có rung dây thanh.', viTrap: 'confuse' },
  { symbol: 'm', group: 'consonant', chapter: 'nasal-liquid', examples: [['man', '/mæn/'], ['home', '/həʊm/']], tipVi: 'Khép môi, hơi thoát qua mũi. Giữ âm cho đến khi hết hơi.' },
  { symbol: 'n', group: 'consonant', chapter: 'nasal-liquid', examples: [['no', '/nəʊ/'], ['sun', '/sʌn/']], tipVi: 'Đầu lưỡi chạm lợi trên, hơi thoát qua mũi.', viTrap: 'confuse', pairWith: 'l' },
  { symbol: 'ŋ', group: 'consonant', chapter: 'nasal-liquid', examples: [['sing', '/sɪŋ/'], ['long', '/lɒŋ/']], tipVi: 'Gốc lưỡi chạm vòm mềm, hơi thoát qua mũi. Không thêm âm "g" ở cuối.', viTrap: 'final' },
  { symbol: 'l', group: 'consonant', chapter: 'nasal-liquid', examples: [['light', '/laɪt/'], ['lie', '/laɪ/']], tipVi: 'Đầu lưỡi chạm lợi trên, hơi thoát hai bên. Cuối từ giữ lưỡi chạm, đừng đọc thành "ơ".', viTrap: 'confuse', pairWith: 'r' },
  { symbol: 'r', group: 'consonant', chapter: 'nasal-liquid', examples: [['red', '/red/'], ['right', '/raɪt/']], tipVi: 'Cuộn đầu lưỡi lên nhưng không chạm vòm. Đừng rung như "r" tiếng Việt.', viTrap: 'confuse', pairWith: 'l' },
  { symbol: 'w', group: 'consonant', chapter: 'nasal-liquid', examples: [['wet', '/wet/'], ['why', '/waɪ/']], tipVi: 'Tròn môi nhỏ rồi mở ra ngay sang nguyên âm sau. Không đọc thành "u" hay "qu".' },
  { symbol: 'j', group: 'consonant', chapter: 'nasal-liquid', examples: [['yes', '/jes/'], ['you', '/juː/']], tipVi: 'Lưỡi cao gần vòm trên, trượt nhanh sang nguyên âm sau. Không đọc thành "d" hay "gi".' },
];

export const PHONEME_COUNT = PHONEMES.length;

export function phonemeBySymbol(symbol: string): Phoneme | undefined {
  return PHONEMES.find((p) => p.symbol === symbol);
}

export const CHAPTERS: { key: Phoneme['chapter']; vi: string; en: string }[] = [
  { key: 'short-long', vi: 'Nguyên âm đơn', en: 'Monophthongs' },
  { key: 'diphthong', vi: 'Nguyên âm đôi', en: 'Diphthongs' },
  { key: 'voiceless-voiced', vi: 'Phụ âm: vô thanh & hữu thanh', en: 'Consonants: voiceless & voiced' },
  { key: 'nasal-liquid', vi: 'Phụ âm: mũi & lỏng', en: 'Consonants: nasal & liquid' },
];
