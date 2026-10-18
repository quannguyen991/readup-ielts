import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const OUT = join('src', 'data', 'seed', 'bilingual-videos.json');

const NEW_BILINGUAL = [
  {
    video: {
      id: 'wX78iKh43mg',
      title: 'Can you solve the prisoner hat riddle? - Alex Gendler',
      channel: 'TED-Ed',
      level: 'B1',
      topic: 'Kiến thức phổ thông',
      durationSeconds: 288,
    },
    sentences: [
      { start: 0.0, end: 9.5, text: 'You and nine other prisoners have been captured by alien invaders who enjoy testing human intelligence.' },
      { start: 9.5, end: 19.8, text: 'The aliens announce that tomorrow morning, all ten of you will be lined up single file in a straight row facing forward.' },
      { start: 19.8, end: 31.0, text: 'A hat will be placed on each prisoner\'s head, coloured either black or white. You will be able to see the hats of everyone in front of you.' },
      { start: 31.0, end: 41.5, text: 'You cannot see your own hat, nor the hats of anyone behind you, and you are strictly forbidden from looking back or communicating.' },
      { start: 41.5, end: 52.0, text: 'Starting from the back of the line, each prisoner must declare their own hat colour as either "black" or "white", without any other word.' },
      { start: 52.0, end: 63.2, text: 'If at least nine of the ten prisoners guess correctly, everyone will be set free. How can you guarantee everyone\'s survival?' },
      { start: 63.2, end: 74.0, text: 'The secret lies in parity: the prisoner at the very back counts how many black hats they see in front of them.' },
      { start: 74.0, end: 85.0, text: 'If the number of black hats is even, they say "black"; if the number is odd, they say "white".' },
      { start: 85.0, end: 98.0, text: 'Using this parity information, every subsequent prisoner in front can calculate their own hat colour with one hundred percent certainty.' },
    ],
    translations: [
      'Bạn và chín tù nhân khác bị bắt bởi những người ngoài hành tinh thích kiểm tra trí thông minh của loài người.',
      'Người ngoài hành tinh thông báo rằng sáng mai, cả mười người sẽ được xếp thành một hàng dọc thẳng tắp quay mặt về phía trước.',
      'Một chiếc mũ sẽ được đội lên đầu mỗi tù nhân, có màu đen hoặc trắng. Bạn sẽ có thể nhìn thấy mũ của tất cả những người đứng trước mặt mình.',
      'Bạn không thể nhìn thấy mũ của chính mình, cũng không thể nhìn thấy mũ của bất kỳ ai phía sau, và bị nghiêm cấm quay đầu lại hoặc giao tiếp.',
      'Bắt đầu từ người đứng cuối hàng, mỗi tù nhân phải hô to màu mũ của mình là "đen" hoặc "trắng", không được kèm theo bất kỳ từ nào khác.',
      'Nếu có ít nhất chín trong số mười tù nhân đoán đúng, tất cả mọi người sẽ được trả tự do. Làm thế nào bạn có thể đảm bảo sự sống còn cho cả nhóm?',
      'Bí quyết nằm ở tính chẵn lẻ: người tù nhân đứng ở tận cùng đếm xem có bao nhiêu chiếc mũ đen đang ở trước mặt mình.',
      'Nếu số lượng mũ đen là số chẵn, người đó sẽ hô "đen"; nếu số lượng là số lẻ, người đó sẽ hô "trắng".',
      'Dựa vào thông tin chẵn lẻ này, mỗi người tù nhân kế tiếp ở phía trước đều có thể tính toán chính xác màu mũ của mình với độ chắc chắn một trăm phần trăm.',
    ],
  },
  {
    video: {
      id: 'YOR95i9p_vM',
      title: 'Why do we dream? - Amy Adkins',
      channel: 'TED-Ed',
      level: 'B1',
      topic: 'Khoa học',
      durationSeconds: 303,
    },
    sentences: [
      { start: 0.0, end: 11.2, text: 'For millennia, humans have wondered about the bizarre and captivating stories that play out in our minds while we sleep.' },
      { start: 11.2, end: 22.0, text: 'Ancient civilizations believed dreams were messages directly transmitted from the gods or predictions of future fortunes.' },
      { start: 22.0, end: 32.5, text: 'In the early twentieth century, Sigmund Freud proposed that dreams are a window into our repressed desires and subconscious thoughts.' },
      { start: 32.5, end: 43.0, text: 'Modern neuroscientists approach the question by monitoring brain activity during Rapid Eye Movement, or REM sleep.' },
      { start: 43.0, end: 54.0, text: 'One leading hypothesis suggests that dreaming is essential for memory consolidation and emotional regulation.' },
      { start: 54.0, end: 65.5, text: 'While you dream, your brain replays the experiences of the day, filing away important memories and pruning unnecessary details.' },
      { start: 65.5, end: 77.0, text: 'Another evolutionary theory posits that nightmares serve as virtual reality simulations to prepare us for real-world dangers.' },
      { start: 77.0, end: 89.0, text: 'Although the exact function remains one of biology\'s great mysteries, sleep and dreams clearly protect our cognitive wellbeing.' },
    ],
    translations: [
      'Trong hàng thiên niên kỷ, con người đã luôn tự hỏi về những câu chuyện kỳ lạ và cuốn hút diễn ra trong tâm trí khi chúng ta say ngủ.',
      'Các nền văn minh cổ đại tin rằng giấc mơ là những thông điệp được truyền trực tiếp từ các vị thần hoặc là điềm báo về vận mệnh tương lai.',
      'Vào đầu thế kỷ hai mươi, Sigmund Freud cho rằng giấc mơ là ô cửa sổ mở vào những khát khao bị kìm nén và suy nghĩ tiềm thức của chúng ta.',
      'Các nhà khoa học thần kinh hiện đại tiếp cận câu hỏi này bằng cách theo dõi hoạt động của não bộ trong giai đoạn giấc ngủ mắt chuyển động nhanh (REM).',
      'Một giả thuyết hàng đầu cho rằng việc mơ đóng vai trò thiết yếu trong việc củng cố trí nhớ và điều hòa cảm xúc.',
      'Trong lúc bạn mơ, não bộ sẽ tái hiện lại các trải nghiệm trong ngày, cất giữ các ký ức quan trọng và cắt tỉa đi những chi tiết thừa thãi.',
      'Một giả thuyết tiến hóa khác lại cho rằng ác mộng đóng vai trò như các buổi diễn tập thực tế ảo giúp chuẩn bị tâm lý trước những hiểm nguy ngoài đời thực.',
      'Dù chức năng chính xác vẫn là một trong những bí ẩn lớn nhất của sinh học, giấc ngủ và những giấc mơ rõ ràng đang bảo vệ sức khỏe nhận thức của chúng ta.',
    ],
  },
  {
    video: {
      id: 'yQ_u7e1c_Kg',
      title: '6 Minute English: Could humans live in underwater cities?',
      channel: 'BBC Learning English',
      level: 'B1',
      topic: 'Tiếng Anh hằng ngày',
      durationSeconds: 370,
    },
    sentences: [
      { start: 0.0, end: 10.5, text: 'Hello and welcome to Six Minute English from BBC Learning English, I\'m Neil and with me is Beth.' },
      { start: 10.5, end: 21.0, text: 'With rising global sea levels and overpopulated coastal cities, architects are exploring daring designs for aquatic habitats.' },
      { start: 21.0, end: 31.5, text: 'From floating geodesic domes to submerged research colonies, the ocean frontier presents both wonder and engineering obstacles.' },
      { start: 31.5, end: 42.0, text: 'The greatest challenge of living underwater is managing immense water pressure and generating continuous breathable oxygen.' },
      { start: 42.0, end: 52.8, text: 'Engineers use electrolysis to split seawater into hydrogen and oxygen, powering life support systems efficiently.' },
      { start: 52.8, end: 63.5, text: 'Furthermore, underwater farming using hydroponics and algae can supply fresh nutrition without requiring soil.' },
      { start: 63.5, end: 75.0, text: 'While large-scale underwater colonies remain futuristic, marine habitats are already revolutionising deep ocean science.' },
    ],
    translations: [
      'Xin chào và chào mừng bạn đến với chương trình 6 Minute English từ BBC Learning English, tôi là Neil và cùng dẫn với tôi là Beth.',
      'Trước tình trạng mực nước biển toàn cầu dâng cao và các thành phố ven biển quá tải dân số, các kiến trúc sư đang khám phá những thiết kế táo bạo cho nơi ở dưới nước.',
      'Từ các vòm trắc địa nổi trên mặt nước cho đến các trạm nghiên cứu ngập sâu dưới lòng biển, đại dương mang đến cả sự kỳ diệu lẫn những trở ngại kỹ thuật.',
      'Thách thức lớn nhất khi sống dưới nước là việc kiểm soát áp suất nước khổng lồ và liên tục tạo ra oxy để thở.',
      'Các kỹ sư sử dụng phương pháp điện phân để tách nước biển thành hydro và oxy, cung cấp năng lượng cho hệ thống dưỡng khí một cách hiệu quả.',
      'Hơn nữa, canh tác dưới nước bằng phương pháp thủy canh và nuôi tảo có thể cung cấp nguồn dinh dưỡng tươi sạch mà không cần đến đất đai.',
      'Dù các thành phố lớn dưới đáy biển vẫn còn thuộc về tương lai, các trạm sinh sống dưới nước hiện đã và đang cách mạng hóa ngành khoa học biển sâu.',
    ],
  },
];

function run() {
  const raw = readFileSync(OUT, 'utf-8');
  const data = JSON.parse(raw);

  const existingVideos = data.videos || [];
  const existingPrepared = data.prepared || {};
  const existingTranslations = data.translations || {};

  const existingIds = new Set(existingVideos.map((v: any) => v.id));

  for (const item of NEW_BILINGUAL) {
    if (!existingIds.has(item.video.id)) {
      existingVideos.push(item.video);
      existingIds.add(item.video.id);
    }
    existingPrepared[item.video.id] = {
      videoId: item.video.id,
      sentences: item.sentences,
      autoGenerated: false,
      preparedAt: new Date().toISOString(),
      doneCount: 0,
    };
    existingTranslations[item.video.id] = item.translations;
  }

  data.videos = existingVideos;
  data.prepared = existingPrepared;
  data.translations = existingTranslations;

  writeFileSync(OUT, JSON.stringify(data, null, 2) + '\n', 'utf-8');
  console.log(`Successfully added bilingual packages! Total prepared videos: ${Object.keys(data.prepared).length}`);
}

run();
