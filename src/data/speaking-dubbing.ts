/**
 * DỮ LIỆU BÀI LUYỆN LỒNG TIẾNG (DUBBING WORKSPACE)
 * Chia theo Cảnh (Scenes), từng câu có mốc thời gian, phiên âm IPA quốc tế,
 * độ nhấn trọng âm (stress points), ngữ điệu (intonation) và bản dịch tiếng Việt.
 */

export type DubbingSentence = {
  id: string;
  sceneIndex: number;
  sentenceIndexInScene: number;
  start: number; // in seconds
  end: number;
  duration: number;
  text: string;
  ipa: string;
  translationVi: string;
  stressedWords: string[]; // Content words needing acoustic emphasis
  intonation: 'rising' | 'falling' | 'fall-rise';
  speaker?: string;
};

export type DubbingScene = {
  sceneIndex: number;
  title: string;
  titleVi: string;
  start: number;
  end: number;
  sentences: DubbingSentence[];
};

export type DubbingProject = {
  id: string;
  youtubeId: string;
  title: string;
  channel: string;
  level: 'A2' | 'B1' | 'B2' | 'C1';
  topic: string;
  thumbnailUrl: string;
  scenes: DubbingScene[];
};

export const DUBBING_PROJECTS: DubbingProject[] = [
  {
    id: 'dub-films',
    youtubeId: 'q4JyFF46528',
    title: 'Talking about films 🎬 🍿 | Real Easy English',
    channel: 'BBC Learning English',
    level: 'B1',
    topic: 'Văn hóa & Đời sống',
    thumbnailUrl: 'https://i.ytimg.com/vi/q4JyFF46528/mqdefault.jpg',
    scenes: [
      {
        sceneIndex: 1,
        title: 'Scene 1: Introduction & Greetings',
        titleVi: 'Cảnh 1: Giới thiệu & Chào hỏi',
        start: 0.5,
        end: 28.5,
        sentences: [
          {
            id: 'dub-f-1',
            sceneIndex: 1,
            sentenceIndexInScene: 1,
            start: 0.5,
            end: 4.2,
            duration: 3.7,
            text: 'Welcome to Real Easy English, the podcast',
            ipa: '/ˈwel.kəm tu rɪəl ˈiː.zi ˈɪŋ.ɡlɪʃ ðə ˈpɒd.kɑːst/',
            translationVi: 'Chào mừng các bạn đến với Real Easy English, kênh podcast',
            stressedWords: ['Welcome', 'Real', 'Easy', 'English', 'podcast'],
            intonation: 'falling',
            speaker: 'Georgie',
          },
          {
            id: 'dub-f-2',
            sceneIndex: 1,
            sentenceIndexInScene: 2,
            start: 4.2,
            end: 8.5,
            duration: 4.3,
            text: 'where we have real conversations in easy English to help you learn.',
            ipa: '/wɛər wi hæv rɪəl ˌkɒnvəˈseɪʃənz ɪn ˈiːzi ˈɪŋɡlɪʃ tu hɛlp ju lɜːn/',
            translationVi: 'nơi chúng tôi có những cuộc trò chuyện thực tế bằng tiếng Anh dễ hiểu để giúp bạn học tập.',
            stressedWords: ['real', 'conversations', 'easy', 'English', 'help', 'learn'],
            intonation: 'falling',
            speaker: 'Georgie',
          },
          {
            id: 'dub-f-3',
            sceneIndex: 1,
            sentenceIndexInScene: 3,
            start: 8.5,
            end: 11.2,
            duration: 2.7,
            text: "I'm Georgie. And I'm Neil.",
            ipa: '/aɪm ˈdʒɔː.dʒi ænd aɪm niːl/',
            translationVi: 'Tôi là Georgie. Và tôi là Neil.',
            stressedWords: ['Georgie', 'Neil'],
            intonation: 'fall-rise',
            speaker: 'Georgie & Neil',
          },
          {
            id: 'dub-f-4',
            sceneIndex: 1,
            sentenceIndexInScene: 4,
            start: 11.2,
            end: 16.0,
            duration: 4.8,
            text: 'To read along with this podcast, visit our website: BBC Learning English dot com.',
            ipa: '/tu riːd əˈlɒŋ wɪð ðɪs ˈpɒd.kɑːst ˈvɪz.ɪt ˈaʊər ˈweb.saɪt biː biː siː ˈlɜː.nɪŋ ˈɪŋ.ɡlɪʃ dɒt kɒm/',
            translationVi: 'Để đọc phụ đề kèm theo podcast này, hãy truy cập trang web của chúng tôi: BBC Learning English dot com.',
            stressedWords: ['read', 'podcast', 'visit', 'website', 'BBC', 'Learning', 'English'],
            intonation: 'falling',
            speaker: 'Neil',
          },
          {
            id: 'dub-f-5',
            sceneIndex: 1,
            sentenceIndexInScene: 5,
            start: 16.0,
            end: 18.2,
            duration: 2.2,
            text: 'How are you today, Neil?',
            ipa: '/haʊ ɑː ju təˈdeɪ niːl/',
            translationVi: 'Hôm nay anh thế nào, Neil?',
            stressedWords: ['How', 'today', 'Neil'],
            intonation: 'falling',
            speaker: 'Georgie',
          },
          {
            id: 'dub-f-6',
            sceneIndex: 1,
            sentenceIndexInScene: 6,
            start: 18.2,
            end: 20.1,
            duration: 1.9,
            text: "I'm very well, Georgie.",
            ipa: '/aɪm ˈver.i wel ˈdʒɔː.dʒi/',
            translationVi: 'Tôi rất khỏe, Georgie.',
            stressedWords: ['very', 'well', 'Georgie'],
            intonation: 'falling',
            speaker: 'Neil',
          },
          {
            id: 'dub-f-7',
            sceneIndex: 1,
            sentenceIndexInScene: 7,
            start: 20.1,
            end: 21.5,
            duration: 1.4,
            text: 'How are you?',
            ipa: '/haʊ ɑː juː/',
            translationVi: 'Còn cô thì sao?',
            stressedWords: ['How', 'you'],
            intonation: 'rising',
            speaker: 'Neil',
          },
          {
            id: 'dub-f-8',
            sceneIndex: 1,
            sentenceIndexInScene: 8,
            start: 21.5,
            end: 24.2,
            duration: 2.7,
            text: "I'm pretty good, thank you, as well.",
            ipa: '/aɪm ˈprɪt.i ɡʊd θæŋk ju æz wel/',
            translationVi: 'Tôi cũng khá ổn, cảm ơn anh.',
            stressedWords: ['pretty', 'good', 'thank'],
            intonation: 'falling',
            speaker: 'Georgie',
          },
          {
            id: 'dub-f-9',
            sceneIndex: 1,
            sentenceIndexInScene: 9,
            start: 24.2,
            end: 28.5,
            duration: 4.3,
            text: "So, Georgie, what are we talking about in today's episode?",
            ipa: '/səʊ ˈdʒɔː.dʒi wɒt ɑː wi ˈtɔː.kɪŋ əˈbaʊt ɪn təˈdeɪz ˈep.ɪ.səʊd/',
            translationVi: 'Vậy Georgie, hôm nay chúng ta sẽ thảo luận về chủ đề gì trong tập này?',
            stressedWords: ['Georgie', 'what', 'talking', 'today', 'episode'],
            intonation: 'falling',
            speaker: 'Neil',
          },
        ],
      },
      {
        sceneIndex: 2,
        title: 'Scene 2: Cinema vs Streaming',
        titleVi: 'Cảnh 2: Rạp chiếu phim hay Xem trực tuyến',
        start: 28.5,
        end: 55.0,
        sentences: [
          {
            id: 'dub-f-10',
            sceneIndex: 2,
            sentenceIndexInScene: 1,
            start: 28.5,
            end: 32.8,
            duration: 4.3,
            text: 'Well, today we are going to explore our all-time favourite films.',
            ipa: '/wel təˈdeɪ wi ɑː ˈɡəʊ.ɪŋ tu ɪkˈsplɔːr ˈaʊər ɔːl.taɪm ˈfeɪ.vər.ɪt fɪlmz/',
            translationVi: 'Hôm nay chúng ta sẽ khám phá những bộ phim yêu thích nhất mọi thời đại.',
            stressedWords: ['explore', 'all-time', 'favourite', 'films'],
            intonation: 'falling',
            speaker: 'Georgie',
          },
          {
            id: 'dub-f-11',
            sceneIndex: 2,
            sentenceIndexInScene: 2,
            start: 32.8,
            end: 37.0,
            duration: 4.2,
            text: 'Do you prefer watching movies on the big screen or at home on your couch?',
            ipa: '/du ju prɪˈfɜːr ˈwɒtʃ.ɪŋ ˈmuː.viz ɒn ðə bɪɡ skriːn ɔːr æt həʊm ɒn jɔːr kaʊtʃ/',
            translationVi: 'Anh thích xem phim trên màn ảnh rộng ngoài rạp hay ở nhà trên chiếc ghế sofa?',
            stressedWords: ['prefer', 'watching', 'movies', 'big', 'screen', 'home', 'couch'],
            intonation: 'fall-rise',
            speaker: 'Georgie',
          },
          {
            id: 'dub-f-12',
            sceneIndex: 2,
            sentenceIndexInScene: 3,
            start: 37.0,
            end: 41.5,
            duration: 4.5,
            text: 'Nothing beats the cinematic atmosphere and the smell of fresh popcorn in a cinema.',
            ipa: '/ˈnʌθ.ɪŋ biːts ðə ˌsɪn.əˈmæt.ɪk ˈæt.məs.fɪər ænd ðə smel ɒv freʃ ˈpɒp.kɔːn ɪn ə ˈsɪn.ə.mə/',
            translationVi: 'Không gì sánh bằng bầu không khí điện ảnh và mùi bắp rang bơ thơm phức trong rạp chiếu.',
            stressedWords: ['Nothing', 'beats', 'cinematic', 'atmosphere', 'fresh', 'popcorn', 'cinema'],
            intonation: 'falling',
            speaker: 'Neil',
          },
        ],
      },
    ],
  },
  {
    id: 'dub-climate',
    youtubeId: 'pEO9-iPZQWA',
    title: 'Climate and extreme weather ⏲️ 6 Minute English',
    channel: 'BBC Learning English',
    level: 'B1',
    topic: 'Khoa học & Môi trường',
    thumbnailUrl: 'https://i.ytimg.com/vi/pEO9-iPZQWA/mqdefault.jpg',
    scenes: [
      {
        sceneIndex: 1,
        title: 'Scene 1: Introduction to Climate Extremes',
        titleVi: 'Cảnh 1: Mở đầu về Thời tiết Cực đoan',
        start: 0.5,
        end: 22.0,
        sentences: [
          {
            id: 'dub-c-1',
            sceneIndex: 1,
            sentenceIndexInScene: 1,
            start: 0.5,
            end: 4.8,
            duration: 4.3,
            text: 'Hello and welcome to 6 Minute English from BBC Learning English.',
            ipa: '/həˈləʊ ænd ˈwel.kəm tu sɪks ˈmɪn.ɪt ˈɪŋ.ɡlɪʃ frɒm biː biː siː ˈlɜː.nɪŋ ˈɪŋ.ɡlɪʃ/',
            translationVi: 'Xin chào và chào mừng bạn đến với 6 Minute English từ BBC Learning English.',
            stressedWords: ['Hello', 'welcome', '6 Minute English', 'BBC'],
            intonation: 'falling',
            speaker: 'Presenter',
          },
          {
            id: 'dub-c-2',
            sceneIndex: 1,
            sentenceIndexInScene: 2,
            start: 4.8,
            end: 11.2,
            duration: 6.4,
            text: 'From intense heatwaves to unprecedented flash floods, extreme weather is reshaping our planet.',
            ipa: '/frɒm ɪnˈtens ˈhiːt.weɪvz tu ʌnˈpres.ɪ.den.tɪd flæʃ flʌdz ɪkˈstriːm ˈweð.ər ɪz ˌriːˈʃeɪ.pɪŋ ˈaʊər ˈplæn.ɪt/',
            translationVi: 'Từ các đợt nắng nóng gay gắt đến những trận lũ quét chưa từng có, thời tiết cực đoan đang định hình lại hành tinh của chúng ta.',
            stressedWords: ['intense', 'heatwaves', 'unprecedented', 'flash floods', 'extreme', 'weather', 'reshaping', 'planet'],
            intonation: 'falling',
            speaker: 'Presenter',
          },
        ],
      },
    ],
  },
];

export function getDubbingProject(id: string): DubbingProject | undefined {
  return DUBBING_PROJECTS.find((p) => p.id === id) ?? DUBBING_PROJECTS[0];
}
