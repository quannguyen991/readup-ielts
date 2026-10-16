/**
 * Nội dung luyện cho tab Khám phá: clip luyện nói ngắn, bộ học tập có sẵn, và
 * tra từ IPA từ kho từ vựng của app (các từ có phiên âm sẵn).
 */
import { DAILY_TALK_TOPICS } from '@/data/vocab-daily';
import { VOCAB_TOPICS } from '@/data/vocab-topics';

/** Một câu ngắn để nói theo, có mẹo phát âm và âm trọng tâm. Không có video: chữ + giọng đọc. */
export type Clip = {
  id: string;
  phrase: string;
  meaning: string;
  context: string;
  focus: string;
  tipVi: string;
};

export const CLIPS: Clip[] = [
  { id: 'c1', phrase: 'Could you say that again, please?', meaning: 'Bạn nói lại được không?', context: 'Khi không nghe rõ', focus: 'ʃ', tipVi: 'Chú ý /ʃ/ trong "say" không có; luyện lên giọng cuối câu hỏi.' },
  { id: 'c2', phrase: 'I think it\'s a great idea.', meaning: 'Tôi nghĩ đó là ý kiến tuyệt vời.', context: 'Khi đồng tình', focus: 'θ', tipVi: 'Đặt đầu lưỡi giữa răng khi nói "think", không đọc thành /t/.' },
  { id: 'c3', phrase: 'Let\'s meet at the bus stop.', meaning: 'Gặp nhau ở trạm xe buýt nhé.', context: 'Khi hẹn gặp', focus: 's', tipVi: 'Âm /s/ ở cuối "meet" và "bus stop" đừng bỏ.' },
  { id: 'c4', phrase: 'This is the right way.', meaning: 'Đây là đường đúng.', context: 'Khi chỉ đường', focus: 'r', tipVi: 'Cuộn nhẹ đầu lưỡi ở "right", không rung như tiếng Việt.' },
  { id: 'c5', phrase: 'I really like your new shoes.', meaning: 'Tôi rất thích đôi giày mới của bạn.', context: 'Khi khen', focus: 'l', tipVi: 'Đầu lưỡi chạm lợi ở "like" và "really".' },
  { id: 'c6', phrase: 'Thanks a lot for your help.', meaning: 'Cảm ơn bạn rất nhiều vì đã giúp.', context: 'Khi cảm ơn', focus: 't', tipVi: 'Âm /t/ cuối "lot" phải chặn hơi, không thêm "ơ".' },
  { id: 'c7', phrase: 'Where do you usually work?', meaning: 'Bạn thường làm việc ở đâu?', context: 'Khi hỏi nghề nghiệp', focus: 'w', tipVi: 'Tròn môi nhỏ ở "where" và "work".' },
  { id: 'c8', phrase: 'The weather is very nice today.', meaning: 'Hôm nay thời tiết rất đẹp.', context: 'Trò chuyện xã giao', focus: 'v', tipVi: 'Môi dưới chạm răng trên ở "very", đừng đọc thành /b/.' },
  { id: 'c9', phrase: 'Could I have a cup of tea?', meaning: 'Cho tôi xin một tách trà được không?', context: 'Khi gọi đồ uống', focus: 'ʌ', tipVi: 'Âm /ʌ/ trong "cup" ngắn và mạnh.' },
  { id: 'c10', phrase: 'Please take a seat over there.', meaning: 'Mời bạn ngồi đằng kia.', context: 'Khi đón khách', focus: 'eɪ', tipVi: 'Trượt từ /e/ sang /ɪ/ ở "take" và "seat".' },
  { id: 'c11', phrase: 'I need to finish this report by Friday.', meaning: 'Tôi cần hoàn thành báo cáo này trước thứ Sáu.', context: 'Khi nói về deadline', focus: 'ʃ', tipVi: 'Âm /ʃ/ trong "finish" và âm /f/ đầu từ.' },
  { id: 'c12', phrase: 'She works in a small office.', meaning: 'Cô ấy làm việc trong một văn phòng nhỏ.', context: 'Kể về công việc', focus: 'z', tipVi: 'Âm /z/ cuối "works" có rung dây thanh.' },
  { id: 'c13', phrase: 'Do you know where the station is?', meaning: 'Bạn có biết nhà ga ở đâu không?', context: 'Khi hỏi đường', focus: 'ɪ', tipVi: 'Âm /ɪ/ ngắn trong "is" và "know".' },
  { id: 'c14', phrase: 'It was a long day at work.', meaning: 'Hôm nay là một ngày dài ở chỗ làm.', context: 'Khi than mệt', focus: 'ɒ', tipVi: 'Âm /ɒ/ trong "long" tròn môi, ngắn.' },
  { id: 'c15', phrase: 'The children are playing in the garden.', meaning: 'Bọn trẻ đang chơi trong vườn.', context: 'Mô tả cảnh', focus: 'ɪə', tipVi: 'Trượt nhẹ sang /ə/ ở "here"-kiểu âm, đừng tách hai âm.' },
  { id: 'c16', phrase: 'I\'m sorry, I didn\'t catch that.', meaning: 'Xin lỗi, tôi không nghe rõ.', context: 'Khi không nghe rõ', focus: 'tʃ', tipVi: 'Âm /tʃ/ trong "catch" bắt đầu từ /t/ rồi xì nhẹ.' },
  { id: 'c17', phrase: 'We should leave before the rain starts.', meaning: 'Chúng ta nên đi trước khi mưa.', context: 'Khi lên kế hoạch', focus: 'ð', tipVi: 'Âm /ð/ trong "the" có rung dây thanh.' },
  { id: 'c19', phrase: 'Could you tell me how much it costs?', meaning: 'Bạn cho tôi biết món này giá bao nhiêu được không?', context: 'Khi hỏi giá', focus: 'ʌ', tipVi: 'Âm /ʌ/ trong "much" ngắn, không kéo dài.' },
  { id: 'c20', phrase: 'I have been living here for five years.', meaning: 'Tôi đã sống ở đây được năm năm.', context: 'Kể về bản thân', focus: 'v', tipVi: 'Âm /v/ trong "living" và "five": môi dưới chạm răng trên.' },
  { id: 'c21', phrase: 'The third option sounds more reasonable.', meaning: 'Phương án thứ ba nghe hợp lý hơn.', context: 'Khi so sánh ý kiến', focus: 'θ', tipVi: 'Âm /θ/ trong "third" nhẹ, lưỡi giữa hai hàm răng.' },
  { id: 'c22', phrase: 'Would you like to join us for lunch?', meaning: 'Bạn có muốn ăn trưa cùng chúng tôi không?', context: 'Khi mời', focus: 'dʒ', tipVi: 'Âm /dʒ/ trong "join" bắt đầu từ /d/ rồi rung nhẹ.' },
  { id: 'c23', phrase: 'Please keep your voice down in the library.', meaning: 'Làm ơn nói nhỏ lại trong thư viện.', context: 'Khi nhắc nhở', focus: 'k', tipVi: 'Âm /k/ ở cuối "keep" và "down" phải chặn hơi.' },
  { id: 'c24', phrase: 'We need to check the weather forecast first.', meaning: 'Chúng ta cần xem dự báo thời tiết trước.', context: 'Lên kế hoạch', focus: 'tʃ', tipVi: 'Âm /tʃ/ trong "check" và "weather" bắt đầu bằng /t/ rồi xì nhẹ.' },
  { id: 'c25', phrase: 'The shop opens at half past eight.', meaning: 'Cửa hàng mở cửa lúc tám rưỡi.', context: 'Hỏi giờ', focus: 'f', tipVi: 'Âm /f/ trong "half": môi dưới chạm răng trên rồi thổi hơi, đừng đọc thành /p/.' },
  { id: 'c26', phrase: 'I am really sorry for the mistake.', meaning: 'Tôi thực sự xin lỗi vì lỗi này.', context: 'Khi xin lỗi', focus: 's', tipVi: 'Âm /s/ trong "sorry" và "mistake" rõ, không đọc thành /ʃ/.' },
  { id: 'c27', phrase: 'Let me think about it and get back to you.', meaning: 'Để tôi suy nghĩ rồi sẽ trả lời bạn.', context: 'Khi chưa quyết định', focus: 'θ', tipVi: 'Âm /θ/ trong "think" và âm /k/ cuối "think" đều cần rõ.' },
  { id: 'c28', phrase: 'The bus was late because of the rain.', meaning: 'Xe buýt đến muộn vì trời mưa.', context: 'Giải thích', focus: 'ʌ', tipVi: 'Âm /ʌ/ trong "bus" và "was" ngắn, mạnh.' },
  { id: 'c29', phrase: 'Do you know any good restaurants nearby?', meaning: 'Bạn có biết nhà hàng ngon nào gần đây không?', context: 'Hỏi gợi ý', focus: 'ə', tipVi: 'Âm /ə/ trong "any" và "restaurants" yếu, không nhấn.' },
  { id: 'c30', phrase: 'It is going to be a long week.', meaning: 'Tuần này sẽ dài đây.', context: 'Than thở vui', focus: 'ŋ', tipVi: 'Âm /ŋ/ trong "long" và "going" không thêm âm /g/ ở cuối.' },
  { id: 'c31', phrase: 'Please wait here while I check.', meaning: 'Làm ơn đợi ở đây trong khi tôi kiểm tra.', context: 'Khi nhờ chờ', focus: 'w', tipVi: 'Âm /w/ ở "wait" và "while": tròn môi nhỏ rồi mở ra.' },
  { id: 'c32', phrase: 'Her job is very challenging but rewarding.', meaning: 'Công việc của cô ấy rất thử thách nhưng đáng giá.', context: 'Mô tả công việc', focus: 'dʒ', tipVi: 'Âm /dʒ/ trong "job" và "challenging" rung dây thanh.' },
];

export type StudySet = {
  id: string;
  title: string;
  author: string;
  /** Lượt thả tim khởi đầu, chỉ để hiển thị. */
  likes: number;
  items: string[];
};

/** Bộ học có sẵn do Band 9 soạn. Người học tự tạo bộ mới ở màn Khám phá. */
export const SEED_SETS: StudySet[] = [
  { id: 'set-p-t-k', title: 'Âm cuối /p/ /t/ /k/', author: 'Band 9', likes: 1280, items: ['stop', 'cap', 'back', 'cat', 'map', 'look', 'book', 'set', 'hot', 'wait'] },
  { id: 'set-interview', title: 'Từ vựng phỏng vấn', author: 'Band 9', likes: 940, items: ['experience', 'responsibility', 'achievement', 'strength', 'challenge', 'teamwork', 'deadline', 'promotion'] },
  { id: 'set-tongue', title: 'Tongue twisters nhẹ', author: 'Band 9', likes: 760, items: ['sheep', 'ship', 'thought', 'thick', 'very', 'berry', 'light', 'right'] },
  { id: 'set-office', title: 'Công sở hằng ngày', author: 'Band 9', likes: 610, items: ['colleague', 'meeting', 'report', 'schedule', 'workload', 'agenda', 'supervisor', 'overtime'] },
  { id: 'set-travel', title: 'Đi lại & sân bay', author: 'Band 9', likes: 420, items: ['boarding pass', 'gate', 'delay', 'luggage', 'passport', 'customs', 'departure', 'layover'] },
];

/** Thông tin một từ lấy từ kho từ vựng của app. */
export type WordInfo = { word: string; ipa: string; pos: string; meaningVi: string; example: string };

let index: Map<string, WordInfo> | null = null;

function buildIndex(): Map<string, WordInfo> {
  const map = new Map<string, WordInfo>();
  const add = (w: { word: string; ipa: string; pos: string; meaningVi: string; example: string }) => {
    const key = w.word.toLowerCase();
    if (!w.ipa || map.has(key)) return;
    map.set(key, { word: w.word, ipa: w.ipa, pos: w.pos, meaningVi: w.meaningVi, example: w.example });
  };
  for (const t of VOCAB_TOPICS) for (const w of t.words) add(w);
  for (const t of DAILY_TALK_TOPICS) for (const w of t.words) add(w);
  return map;
}

/** Tra một từ (không phân biệt hoa thường). Không có trong kho thì trả về null. */
export function lookupWord(raw: string): WordInfo | null {
  index ??= buildIndex();
  const key = raw.trim().toLowerCase();
  return index.get(key) ?? null;
}

/** Số từ đang tra được — để hiển thị trong màn từ điển. */
export function dictionarySize(): number {
  index ??= buildIndex();
  return index.size;
}
