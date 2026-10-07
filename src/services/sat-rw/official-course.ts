import type { SatRwCourseTier } from './curriculum';

/**
 * Band 9's original, public-facing alignment to Khan Academy's SAT R&W course.
 * Titles identify the assessed skill; the explanations and practice content in
 * Band 9 are independently written. Three core tiers + six challenge skills +
 * eight grammar-practice skills = 47 practice targets.
 */
export type OfficialSatRwSkill = {
  id: string;
  title: string;
  titleVi: string;
  domain: string;
  unit: number;
  legacySkill: string;
  strategy: string;
  trap: string;
  tier?: SatRwCourseTier;
  kind: 'tier' | 'challenge' | 'grammar';
};

type CoreSkill = Pick<OfficialSatRwSkill, 'id' | 'title' | 'titleVi' | 'domain' | 'unit' | 'legacySkill' | 'strategy' | 'trap'>;

const CORE: readonly CoreSkill[] = [
  { id: 'textual-evidence', title: 'Command of textual evidence', titleVi: 'Chọn bằng chứng trong văn bản', domain: 'Information and Ideas', unit: 15, legacySkill: 'evidence', strategy: 'Chốt luận điểm cần chứng minh trước; đối chiếu từng lựa chọn với đúng câu chữ trong đoạn.', trap: 'Một câu có thật trong đoạn nhưng không chứng minh đúng luận điểm vẫn là nhiễu.' },
  { id: 'quantitative-evidence', title: 'Command of quantitative evidence', titleVi: 'Đọc bằng chứng định lượng', domain: 'Information and Ideas', unit: 15, legacySkill: 'evidence', strategy: 'Đọc tiêu đề, đơn vị và nhóm so sánh; tự tính chênh lệch trước khi chọn câu diễn giải.', trap: 'Số liệu đúng nhưng sai nhóm, sai đơn vị hoặc không trả lời nhận định.' },
  { id: 'central-ideas', title: 'Central ideas and details', titleVi: 'Ý chính và chi tiết', domain: 'Information and Ideas', unit: 14, legacySkill: 'central', strategy: 'Tóm đoạn bằng một câu ngắn; câu hỏi chi tiết thì quay lại đúng dòng làm mốc.', trap: 'Đáp án chỉ đúng một chi tiết nhưng không bao quát ý chính.' },
  { id: 'inferences', title: 'Inferences', titleVi: 'Suy luận có căn cứ', domain: 'Information and Ideas', unit: 16, legacySkill: 'inference', strategy: 'Nối dữ kiện trong đoạn bằng đúng một bước suy luận; ưu tiên kết luận vừa đủ.', trap: 'Bổ sung kiến thức ngoài đoạn hoặc kết luận tuyệt đối hơn dữ kiện.' },
  { id: 'words-in-context', title: 'Words in context', titleVi: 'Nghĩa của từ trong ngữ cảnh', domain: 'Craft and Structure', unit: 11, legacySkill: 'words', strategy: 'Che đáp án, đoán nghĩa đơn giản từ cả câu, rồi thử từng lựa chọn vào chỗ trống.', trap: 'Chọn nghĩa quen thuộc nhất thay vì nghĩa hợp ngữ cảnh cụ thể.' },
  { id: 'text-structure', title: 'Text structure and purpose', titleVi: 'Cấu trúc và mục đích văn bản', domain: 'Craft and Structure', unit: 12, legacySkill: 'structure', strategy: 'Gọi tên chức năng bằng động từ: giới thiệu, đối chiếu, giải thích, phản biện hoặc minh họa.', trap: 'Nhắc lại nội dung câu nhưng không nêu vai trò của nó.' },
  { id: 'cross-text', title: 'Cross-text connections', titleVi: 'Liên hệ giữa hai văn bản', domain: 'Craft and Structure', unit: 13, legacySkill: 'crosstext', strategy: 'Viết quan điểm mỗi tác giả thành một dòng rồi xác định đồng ý, phản đối hay thu hẹp phạm vi.', trap: 'Chỉ đọc một văn bản hoặc gán cho tác giả kết luận họ không nêu.' },
  { id: 'transitions', title: 'Transitions', titleVi: 'Từ nối và quan hệ logic', domain: 'Expression of Ideas', unit: 9, legacySkill: 'transition', strategy: 'Tự gọi tên quan hệ giữa hai câu trước khi nhìn đáp án: tương phản, nguyên nhân, bổ sung hay ví dụ.', trap: 'Chọn từ nối cùng sắc thái thay vì đúng quan hệ logic.' },
  { id: 'rhetorical-synthesis', title: 'Rhetorical synthesis', titleVi: 'Tổng hợp ghi chú theo mục đích', domain: 'Expression of Ideas', unit: 10, legacySkill: 'structure', strategy: 'Gạch các ý bắt buộc trong mục tiêu; chỉ chọn câu dùng đúng ghi chú để hoàn thành mục tiêu ấy.', trap: 'Câu đúng sự thật nhưng không đáp ứng mục đích được yêu cầu.' },
  { id: 'form-structure-sense', title: 'Form, structure, and sense', titleVi: 'Dạng từ, cấu trúc và nghĩa', domain: 'Standard English Conventions', unit: 5, legacySkill: 'form', strategy: 'Xác định thành phần câu, chủ ngữ thật và quan hệ giữa các vế trước khi xét dạng từ.', trap: 'Chia theo danh từ gần chỗ trống hoặc chọn cấu trúc nghe xuôi nhưng sai cú pháp.' },
  { id: 'boundaries', title: 'Boundaries', titleVi: 'Ranh giới câu và dấu câu', domain: 'Standard English Conventions', unit: 1, legacySkill: 'boundaries', strategy: 'Đếm mệnh đề độc lập hai bên chỗ trống; chọn dấu hoặc liên từ nối chúng đúng quy tắc.', trap: 'Dùng dấu phẩy đơn để nối hai mệnh đề độc lập.' },
];

export const SAT_RW_OFFICIAL_SKILLS: readonly OfficialSatRwSkill[] = [
  ...CORE.flatMap((skill) => (['foundation', 'medium', 'advanced'] as const).map((tier) => ({
    ...skill,
    id: `${skill.id}-${tier}`,
    tier,
    kind: 'tier' as const,
  }))),
  ...([
    ['challenge-command-of-evidence', 'Command of evidence', 'Kết hợp bằng chứng văn bản và số liệu', 'Information and Ideas', 15, 'evidence', 'Xác định luận điểm, tìm bằng chứng trực tiếp rồi kiểm tra số liệu có đúng chiều so sánh.', 'Dữ kiện có liên quan nhưng không chứng minh được kết luận.'],
    ['challenge-central-inference', 'Central ideas and details + inferences', 'Ý chính kết hợp suy luận', 'Information and Ideas', 16, 'inference', 'Tóm ý bao quát trước, sau đó suy ra kết luận hẹp nhất được dữ kiện bảo đảm.', 'Đáp án suy luận vượt quá phạm vi đoạn.'],
    ['challenge-words', 'Words in context', 'Từ vựng trong đoạn học thuật', 'Craft and Structure', 11, 'words', 'Dùng mệnh đề đối lập, giải thích và ví dụ để khóa sắc thái của từ.', 'Nghĩa từ điển đúng nhưng lệch sắc thái của câu.'],
    ['challenge-structure-cross-text', 'Text structure and purpose + cross-text connections', 'Cấu trúc văn bản và liên hệ hai tác giả', 'Craft and Structure', 13, 'crosstext', 'Tóm mỗi văn bản trong vài từ, rồi giải thích văn bản sau thay đổi cách hiểu văn bản trước ra sao.', 'Gộp hai quan điểm thành một hoặc nhầm ví dụ với luận điểm.'],
    ['challenge-transitions-synthesis', 'Transitions + rhetorical synthesis', 'Từ nối và tổng hợp theo mục tiêu', 'Expression of Ideas', 10, 'transition', 'Giữ nguyên mục tiêu giao tiếp, xác định quan hệ logic rồi chọn câu nối đúng và đủ.', 'Câu trôi chảy nhưng làm đổi mục tiêu hoặc quan hệ lập luận.'],
    ['challenge-boundaries-form', 'Boundaries + form, structure, and sense', 'Dấu câu và cấu trúc câu nâng cao', 'Standard English Conventions', 1, 'boundaries', 'Tách cấu trúc thành mệnh đề chính, phần chêm và mệnh đề phụ; kiểm tra từng ranh giới.', 'Một dấu câu đúng cục bộ nhưng làm câu hoàn chỉnh sai cấu trúc.'],
  ] as const).map(([id, title, titleVi, domain, unit, legacySkill, strategy, trap]) => ({
    id, title, titleVi, domain, unit, legacySkill, strategy, trap, kind: 'challenge' as const,
  })),
  ...([
    ['grammar-subject-verb', 'Subject-verb agreement', 'Hòa hợp chủ ngữ – động từ', 5, 'form', 'Tìm chủ ngữ chính, bỏ cụm chen giữa rồi đối chiếu số ít/số nhiều.', 'Chia theo danh từ đứng sát động từ.'],
    ['grammar-pronoun', 'Pronoun-antecedent agreement', 'Đại từ và từ được thay thế', 6, 'pronoun', 'Khoanh danh từ đại diện và kiểm tra số, nghĩa cùng danh từ mà đại từ chỉ tới.', 'Đại từ mơ hồ hoặc không hòa hợp với tiền ngữ.'],
    ['grammar-plurals-possessives', 'Plurals and possessives', 'Danh từ số nhiều và sở hữu cách', 8, 'possessive', 'Hỏi danh từ chỉ số lượng hay quyền sở hữu, rồi mới đặt dấu nháy.', 'Thêm dấu nháy vào số nhiều thường.'],
    ['grammar-verb-forms', 'Verb forms', 'Thì và dạng động từ', 7, 'tense', 'Đánh dấu mốc thời gian; kiểm tra thì, thể và dạng song song trong danh sách.', 'Chọn thì theo từ gần nhất hoặc đổi cấu trúc song song.'],
    ['grammar-modifier-placement', 'Subject-modifier placement', 'Vị trí cụm bổ nghĩa', 5, 'form', 'Đặt cụm mô tả sát đối tượng được mô tả; kiểm tra chủ thể thực hiện hành động.', 'Cụm mở đầu bổ nghĩa nhầm danh từ ngay sau nó.'],
    ['grammar-linking-clauses', 'Boundaries: linking clauses', 'Nối mệnh đề', 1, 'boundaries', 'Phân biệt hai mệnh đề độc lập với mệnh đề phụ; chọn dấu chấm, chấm phẩy hoặc liên từ.', 'Comma splice hoặc thiếu liên từ cần thiết.'],
    ['grammar-supplements', 'Boundaries: supplements', 'Dấu cho phần chêm', 3, 'boundaries', 'Thử bỏ phần chêm; nếu câu còn nguyên, dùng cặp dấu cùng loại để đóng khung.', 'Mở bằng một dấu nhưng đóng bằng dấu khác.'],
    ['grammar-punctuation', 'Boundaries: punctuation', 'Dấu câu và danh sách', 4, 'boundaries', 'Kiểm tra vế đứng trước dấu hai chấm có là câu hoàn chỉnh; dùng chấm phẩy cho mục có dấu phẩy.', 'Dùng hai chấm sau mảnh câu hoặc phân tách danh sách đơn giản quá mức.'],
  ] as const).map(([id, title, titleVi, unit, legacySkill, strategy, trap]) => ({
    id, title, titleVi, domain: 'Standard English Conventions', unit, legacySkill, strategy, trap, kind: 'grammar' as const,
  })),
];

export function officialSkillPracticeHref(skill: OfficialSatRwSkill): string {
  if (skill.kind === 'grammar') return `/sat-rw/${skill.unit}`;
  if (skill.id.startsWith('rhetorical-synthesis')) return '/sat-rw/set/satrw-u10-generated';
  if (skill.kind === 'tier') {
    const set = skill.tier === 'foundation' ? 'learn' : skill.tier === 'medium' ? 'drill' : 'hard';
    return `/sat-rw/set/satrw-u${skill.unit}-${set}`;
  }
  return `/sat-rw/skill/${skill.legacySkill}`;
}
