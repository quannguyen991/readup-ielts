/**
 * Icon pixel minh hoạ cho một chủ đề / cue card Speaking, chọn theo từ khoá trong tên tiếng Anh.
 * Luật đứng trước thắng. Mọi icon đều là ảnh có trong `assets/neon3`, không có icon vẽ dự phòng.
 */

/** Mọi icon Speaking có ảnh pixel (xem `SpeakingIcon`). */
export const SPEAKING_ICON_IDS = [
  'abc', 'alarm', 'bag', 'ball', 'bed', 'bike', 'bird', 'board', 'books', 'briefcase2', 'browser', 'bulb',
  'burger', 'cake', 'calendar', 'camera', 'car', 'cart', 'cat', 'chat', 'clapper', 'coins', 'cross', 'cycle',
  'earth', 'envelope', 'family', 'flag', 'flower', 'frame', 'gift', 'hammer', 'headphones2', 'heart',
  'hourglass', 'lantern', 'laptop', 'leaf', 'megaphone', 'mic', 'microscope', 'mirror', 'note', 'pagoda',
  'palette', 'paw', 'people', 'phone', 'pill', 'plane', 'plug', 'popcorn', 'puzzle', 'rocket', 'shirt', 'shop',
  'signpost', 'skyline', 'smiley', 'star', 'suitcase', 'sun', 'tent', 'tower', 'tree', 'trophy2', 'watch',
  'wifi', 'wrench',
] as const;

export type SpeakingIconId = (typeof SPEAKING_ICON_IDS)[number];

/** Luật từ khoá → icon. Thứ tự quan trọng: luật trên thắng. */
const RULES: [RegExp, SpeakingIconId][] = [
  [/\bmusic\b|\bsong|singing|\bsing\b|jokes/, 'note'],
  [/\bcars?\b|motorbike|transport|driv/, 'car'],
  [/electricity|repair|fix\b|tools?\b/, 'wrench'],
  [/headphone/, 'headphones2'],
  [/online|internet|website|browser|social media/, 'browser'],
  [/software|typing|technolog|computer|laptop/, 'laptop'],
  [/phone|app\b|apps\b|messages/, 'phone'],
  [/sleep|bed\b|bedtime/, 'bed'],
  [/early|morning|routine|rhythm|alarm/, 'alarm'],
  [/wait\b|waiting|queue/, 'hourglass'],
  [/time you had to|first-time|watch\b/, 'watch'],
  [/gift|present/, 'gift'],
  [/cake|birthday|celebration/, 'cake'],
  [/clothes|fashion|shirt|dress/, 'shirt'],
  [/special (food|occasion)|food|restaurant|meal|cooking/, 'burger'],
  [/film|movie|cinema|theatre|theater/, 'clapper'],
  [/tv\b|video|programme|television/, 'camera'],
  [/entertainment|jokes|comedy/, 'popcorn'],
  [/paint|draw|imagination|creativ|\bart\b/, 'palette'],
  [/read|book|memory|novel/, 'books'],
  [/teacher|learn|education|language|school|study|university|exam/, 'board'],
  [/space|rocket|astronaut/, 'rocket'],
  [/bicycle|bike\b|cycling/, 'bike'],
  [/trip|travel|travelling|journey|flight|plane|airport/, 'plane'],
  [/holiday|tourism|another country|faraway|international|place in another|abroad/, 'earth'],
  [/camp|tent|outdoor|hiking/, 'tent'],
  [/famous|fame|celebrity|advertis/, 'star'],
  [/shopping|supermarket|grocer|cart/, 'cart'],
  [/\bshop\b|market|\bstore\b/, 'shop'],
  [/money|spending|paid|consumer|price|cost/, 'coins'],
  [/business|career|job|work|entrepreneur|profession|office/, 'briefcase2'],
  [/medicine|doctor|hospital/, 'pill'],
  [/health|illness|sick|wellbeing|fitness/, 'heart'],
  [/family|parent|children|child|childhood/, 'family'],
  [/friend|people|neighbour|community|helping|helps|encourag|relationship|communicat|team/, 'people'],
  [/pets?\b|animal|dog|cat\b/, 'paw'],
  [/plant|garden|tree|forest/, 'tree'],
  [/nature|environment|park|walk|wild|countryside/, 'leaf'],
  [/quiet|peace|calm|relax/, 'lantern'],
  [/building|architecture|city|cities|urban|home|living|house|tidiness|tall/, 'skyline'],
  [/sport|match|football|basketball/, 'ball'],
  [/\bgame\b|free time|bored|boredom|leisure/, 'puzzle'],
  [/science|problem|solution|intelligen|clever|research/, 'microscope'],
  [/news|media|newspaper|magazine|tradition|product/, 'megaphone'],
  [/success|achiev|difficult decision|hard work|win|prize/, 'trophy2'],
  [/law|policy|rule|government/, 'signpost'],
  [/decision|plan|advice|guidance|opinion|adapt|flexib|change|stage of life/, 'cycle'],
  [/ambition|dream|goal|motivation|proud/, 'flag'],
  [/calendar|schedule|timetable|week|date|month|year/, 'calendar'],
  [/idea|innovat|invent|bulb|inspir/, 'bulb'],
  [/mirror|appearance|look like|personality|yourself|self-/, 'mirror'],
  [/hammer|build|diy|craft|construct/, 'hammer'],
  [/letter|mail|post office|writing|envelope/, 'envelope'],
  [/bird|wildlife|nature sounds/, 'bird'],
  [/wifi|network|signal/, 'wifi'],
  [/plug|power|energy/, 'plug'],
  [/suitcase|luggage|packing/, 'suitcase'],
  [/tower|skyscraper|tall building/, 'tower'],
  [/cross|religio|faith|church|belief/, 'cross'],
  [/pagoda|temple|festival|tradition/, 'pagoda'],
  [/flower|bloom|blossom/, 'flower'],
  [/smile|smiley|happy|happiness|emotion|mood|feeling/, 'smiley'],
  [/frame|photo|photograph|picture/, 'frame'],
  [/backpack|bag/, 'bag'],
  [/cat|dogs?|pets?/, 'cat'],
  [/shop|store/, 'shop'],
  [/cook|kitchen|dinner|breakfast/, 'burger'],
  [/\blive\b|living|\bplace\b/, 'tower'],
  [/stage|life|sparkle/, 'sun'],
];

/** Mặc định khi không khớp luật nào. */
const DEFAULT_ICON: SpeakingIconId = 'chat';

export function speakingIconFor(titleEn: string, titleVi = ''): SpeakingIconId {
  const hay = ` ${titleEn} ${titleVi} `.toLowerCase();
  for (const [re, icon] of RULES) if (re.test(hay)) return icon;
  return DEFAULT_ICON;
}
