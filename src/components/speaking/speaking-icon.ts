import type { AnyIconId } from '@/components/catalog/night-art';

/** Icon pixel minh hoạ cho một chủ đề / cue card Speaking, chọn theo từ khoá trong tên tiếng Anh. Luật đứng trước thắng. */
const RULES: [RegExp, AnyIconId][] = [
  [/electricity|repair|fix\b/, 'bolt'],
  [/headphone/, 'headphones'],
  [/phone|app\b|apps\b|software|website|typing|technolog|messages|online|internet/, 'keyboard'],
  [/sleep|early|morning|routine|rhythm/, 'moon'],
  [/wait|time you had to|first-time|watch\b/, 'clock'],
  [/gift|cake|clothes|fashion/, 'gift'],
  [/special (food|occasion)|food|celebration|restaurant|meal/, 'flame'],
  [/music|song|singing|sing\b|film|movie|cinema|tv\b|video|programme|entertainment|jokes/, 'note'],
  [/paint|draw|imagination|creativ|art\b/, 'pencil'],
  [/read|book|memory/, 'book'],
  [/teacher|learn|education|language|school|study|work \/ study/, 'cap'],
  [/space|car\b|cars\b|motorbike|bicycle|transport|trip|travel|travelling/, 'rocket'],
  [/holiday|tourism|another country|faraway|international|place in another/, 'globe'],
  [/famous|fame|celebrity|advertis/, 'crown'],
  [/shopping|money|spending|paid|consumer/, 'coin'],
  [/business|career|job|work|entrepreneur|profession/, 'briefcase'],
  [/medicine|health|elderly|family|friend|child|childhood|helping|helps|community|smil|encourag|relationship|communicat|pets/, 'heart'],
  [/pets|animal|plant|garden|park|nature|environment|quiet|peace|walk|wild/, 'planet'],
  [/building|architecture|city|cities|urban|home|living|neighbour|live now|tidiness|house|tall/, 'house'],
  [/sport|game|match|free time|bored|boredom|leisure/, 'gamepad'],
  [/science|problem|solution|intelligen|clever|mirror/, 'magnifier'],
  [/news|media|social|tradition|product/, 'newspaper'],
  [/success|achiev|difficult decision|hard work/, 'trophy'],
  [/law|policy/, 'medal'],
  [/decision|plan|advice|guidance|opinion|adapt|flexib|change|stage of life/, 'stairs'],
  [/ambition|dream|goal|motivation|proud/, 'target'],
  [/stage|life/, 'sparkle'],
];

export function speakingIconFor(titleEn: string, titleVi = ''): AnyIconId {
  const hay = ` ${titleEn} ${titleVi} `.toLowerCase();
  for (const [re, icon] of RULES) if (re.test(hay)) return icon;
  return 'speaker';
}
