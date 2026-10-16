/**
 * Dữ liệu cho các trò luyện trong tab Học: cặp âm tối thiểu và trọng âm từ.
 */

/** Hai từ chỉ khác nhau một âm. `answer` là từ đúng với âm được đọc. */
export type MinimalPair = { a: string; b: string; aIpa: string; bIpa: string; contrast: string };

export const MINIMAL_PAIRS: MinimalPair[] = [
  { a: 'sheep', b: 'ship', aIpa: '/ʃiːp/', bIpa: '/ʃɪp/', contrast: '/iː/ – /ɪ/' },
  { a: 'bad', b: 'bed', aIpa: '/bæd/', bIpa: '/bed/', contrast: '/æ/ – /e/' },
  { a: 'full', b: 'fool', aIpa: '/fʊl/', bIpa: '/fuːl/', contrast: '/ʊ/ – /uː/' },
  { a: 'cup', b: 'cop', aIpa: '/kʌp/', bIpa: '/kɒp/', contrast: '/ʌ/ – /ɒ/' },
  { a: 'think', b: 'sink', aIpa: '/θɪŋk/', bIpa: '/sɪŋk/', contrast: '/θ/ – /s/' },
  { a: 'then', b: 'den', aIpa: '/ðen/', bIpa: '/den/', contrast: '/ð/ – /d/' },
  { a: 'light', b: 'right', aIpa: '/laɪt/', bIpa: '/raɪt/', contrast: '/l/ – /r/' },
  { a: 'very', b: 'berry', aIpa: '/ˈveri/', bIpa: '/ˈberi/', contrast: '/v/ – /b/' },
  { a: 'chair', b: 'share', aIpa: '/tʃeə/', bIpa: '/ʃeə/', contrast: '/tʃ/ – /ʃ/' },
  { a: 'pan', b: 'pen', aIpa: '/pæn/', bIpa: '/pen/', contrast: '/æ/ – /e/' },
  { a: 'hat', b: 'hut', aIpa: '/hæt/', bIpa: '/hʌt/', contrast: '/æ/ – /ʌ/' },
  { a: 'coat', b: 'cot', aIpa: '/kəʊt/', bIpa: '/kɒt/', contrast: '/əʊ/ – /ɒ/' },
  { a: 'rice', b: 'lice', aIpa: '/raɪs/', bIpa: '/laɪs/', contrast: '/r/ – /l/' },
  { a: 'bet', b: 'bat', aIpa: '/bet/', bIpa: '/bæt/', contrast: '/e/ – /æ/' },
  { a: 'pull', b: 'pool', aIpa: '/pʊl/', bIpa: '/puːl/', contrast: '/ʊ/ – /uː/' },
];

/** Từ nhiều âm tiết với vị trí trọng âm chính (chỉ số âm tiết, bắt đầu từ 0). */
export type StressWord = { word: string; ipa: string; syllables: string[]; primary: number };

export const STRESS_WORDS: StressWord[] = [
  { word: 'photograph', ipa: '/ˈfəʊtəɡrɑːf/', syllables: ['pho', 'to', 'graph'], primary: 0 },
  { word: 'photographer', ipa: '/fəˈtɒɡrəfə(r)/', syllables: ['pho', 'to', 'gra', 'pher'], primary: 1 },
  { word: 'interesting', ipa: '/ˈɪntrəstɪŋ/', syllables: ['in', 'ter', 'est', 'ing'], primary: 0 },
  { word: 'important', ipa: '/ɪmˈpɔːtnt/', syllables: ['im', 'por', 'tant'], primary: 1 },
  { word: 'comfortable', ipa: '/ˈkʌmftəbl/', syllables: ['com', 'for', 'ta', 'ble'], primary: 0 },
  { word: 'develop', ipa: '/dɪˈveləp/', syllables: ['de', 'vel', 'op'], primary: 1 },
  { word: 'education', ipa: '/ˌedʒuˈkeɪʃn/', syllables: ['ed', 'u', 'ca', 'tion'], primary: 2 },
  { word: 'experience', ipa: '/ɪkˈspɪəriəns/', syllables: ['ex', 'pe', 'ri', 'ence'], primary: 1 },
  { word: 'economy', ipa: '/ɪˈkɒnəmi/', syllables: ['e', 'con', 'o', 'my'], primary: 1 },
  { word: 'available', ipa: '/əˈveɪləbl/', syllables: ['a', 'vail', 'a', 'ble'], primary: 1 },
];
