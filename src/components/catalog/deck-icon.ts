import type { AnyIconId } from './night-art';
import { foldVi } from './catalog-model';

/**
 * Chọn icon pixel minh hoạ CHỦ ĐỀ cho một bộ từ, theo từ khoá trong tên (tiếng Việt hoặc tiếng Anh).
 * Luật xếp theo thứ tự: luật đứng trước thắng. Không khớp luật nào thì dùng icon mặc định của nguồn bộ.
 */
const RULES: [RegExp, AnyIconId][] = [
  [/kien truc|architect|building|cong trinh/, 'house'],
  [/thoi trang|fashion|cloth|trang phuc/, 'gift'],
  [/tre em|child|thanh nien|youth|young|nguoi cao tuoi|elder|ageing|aging/, 'heart'],
  [/hanh phuc|happ|ky uc/, 'sparkle'],
  [/thanh cong|success|fail|achiev|ket qua|result/, 'trophy'],
  [/thay doi|change|nguyen nhan|cause|effect|tuong lai|future/, 'bolt'],
  [/so sanh|compar|contrast/, 'podium'],
  [/rui ro|risk|an toan|safety|danger|dao duc|ethic|moral/, 'medal'],
  [/toan cau|global|ta noi chon|describ|nuoc ngoai/, 'globe'],
  [/giao tiep|communicat|talk/, 'speaker'],
  [/hanh dong|action|verb|movement|chuyen dong/, 'bolt'],
  [/thoi tiet|weather|khi hau|climate/, 'cloud'],
  [/cam xuc|emotion|feeling|tinh cach|personality|character|tam ly|psycholog|memory|tri nho/, 'sparkle'],
  [/gia dinh|family|con nguoi|people|quan he|relationship|friend|ban be|love|tinh yeu|hen ho/, 'heart'],
  [/co the|body|suc khoe|health|medic|y te|y hoc|benh|disease|sleep|giac ngu/, 'heart'],
  [/phap luat|law|government|chinh phu|crime|toi pham|politic|chinh tri|justice/, 'medal'],
  [/thien nhien|nature|moi truong|environment|animal|dong vat|plant|thuc vat|ocean|bien|agricultur|nong|forest|rung|energy|nang luong|pollution/, 'planet'],
  [/giao duc|education|school|truong|hoc tap|study|university|dai hoc|language|ngon ngu|grammar/, 'cap'],
  [/kinh te|economy|economic|tien|money|finance|bank|ngan hang|business|thuong mai|market|shopping|mua sam|price/, 'coin'],
  [/cong viec|work|career|nghe nghiep|office|van phong|job|interview|phong van|meeting|hop hanh|startup|khoi nghiep/, 'briefcase'],
  [/cong nghe|technology|computer|may tinh|internet|digital|ai|robot|software|phan mem/, 'keyboard'],
  [/khoa hoc|science|research|nghien cuu|experiment|physics|chemistry|biology/, 'magnifier'],
  [/truyen thong|media|news|bao chi|tin tuc|advertis|quang cao|social network|mang xa hoi/, 'newspaper'],
  [/van hoa|culture|nghe thuat|art|music|am nhac|film|phim|festival|le hoi|theatre|dance|lich su|history|museum|bao tang|tradition/, 'note'],
  [/du lich|travel|tourism|holiday|ky nghi|dia ly|geograph|country|quoc gia|abroad|du hoc/, 'globe'],
  [/giao thong|transport|vehicle|phuong tien|airport|san bay|space|vu tru/, 'rocket'],
  [/an uong|food|drink|nha hang|restaurant|cook|nau an|kitchen|diet|dinh duong/, 'flame'],
  [/do thi|city|urban|noi chon|nha cua|home|house|housing|noi o|living|doi song|daily|hang ngay|everyday|neighbo/, 'house'],
  [/the thao|sport|giai tri|leisure|game|hobby|so thich|entertain/, 'gamepad'],
  [/thoi gian|time|so luong|quantity|number|size|measure|kich thuoc|frequency|tan suat/, 'clock'],
  [/writing|essay|bai luan/, 'pencil'],
  [/nghe|listening|section|part \d/, 'headphones'],
  [/speaking|pronunc|phat am|conversation|hoi thoai|dialogue/, 'speaker'],
  [/xa hoi|society|social|community|cong dong|population|dan so/, 'podium'],
  [/math|toan|number|equation|geometry|hinh hoc/, 'target'],
];

export const SOURCE_DEFAULT_ICON: Record<string, AnyIconId> = {
  oxford: 'book',
  ielts: 'target',
  vfi: 'book',
  vfia: 'crown',
  destination: 'stairs',
  globalSuccess: 'cap',
  listening: 'headphones',
};

export function deckIconFor(titleVi: string, titleEn: string, source: string): AnyIconId {
  // Bỏ phần đầu "Global Success 10 · Unit 3:" — chữ "Success" ở đó không phải chủ đề.
  const strip = (t: string) => t.replace(/^.*?unit\s*\d+\s*[:.\-–]\s*/i, '');
  const hay = ` ${foldVi(strip(titleVi))} ${foldVi(strip(titleEn))} `;
  for (const [re, icon] of RULES) if (re.test(hay)) return icon;
  return SOURCE_DEFAULT_ICON[source] ?? 'star5';
}
