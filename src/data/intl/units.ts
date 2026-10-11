import type { Bi } from '@/i18n/useL';
import { TOEFL_VOCAB } from './toefl-vocab';
import { TOEFL_VOCAB_EXTRA } from './toefl-vocab-extra';
import { TOEFL_VOCAB_MORE } from './toefl-vocab-more';
import { TOEIC_VOCAB } from './toeic-vocab';
import { TOEIC_VOCAB_EXTRA } from './toeic-vocab-extra';
import { TOEIC_VOCAB_MORE } from './toeic-vocab-more';
import type { VocabEntry } from './vocab-types';

export const ALL_TOEIC_VOCAB: readonly VocabEntry[] = [...TOEIC_VOCAB, ...TOEIC_VOCAB_MORE, ...TOEIC_VOCAB_EXTRA];
export const ALL_TOEFL_VOCAB: readonly VocabEntry[] = [...TOEFL_VOCAB, ...TOEFL_VOCAB_MORE, ...TOEFL_VOCAB_EXTRA];

export type IntlExamKey = 'toeic' | 'toefl';
export type VocabUnit = { id: string; exam: IntlExamKey; index: number; title: Bi; words: readonly string[] };

/** Mỗi unit là một chủ đề, 10 từ. Mỗi từ thuộc đúng một unit. Unit 1–10 là nền, unit 11–20 mở rộng. */
export const VOCAB_UNITS: readonly VocabUnit[] = [
  {
    id: 'toeic-1', exam: 'toeic', index: 1, title: { vi: 'Nhân sự văn phòng', en: 'Office and HR' },
    words: ['recruit', 'retain', 'attend', 'vacancy', 'qualified', 'promote', 'personnel', 'eligible', 'comply', 'incentive'],
  },
  {
    id: 'toeic-2', exam: 'toeic', index: 2, title: { vi: 'Tiền bạc và ngân sách', en: 'Money and budgets' },
    words: ['budget', 'invoice', 'revenue', 'profit', 'commission', 'reimburse', 'outstanding', 'approve', 'expense', 'bonus'],
  },
  {
    id: 'toeic-3', exam: 'toeic', index: 3, title: { vi: 'Kinh doanh và đàm phán', en: 'Business and negotiation' },
    words: ['negotiate', 'merger', 'subsidiary', 'proposal', 'launch', 'expand', 'surpass', 'quarterly', 'feedback', 'decline'],
  },
  {
    id: 'toeic-4', exam: 'toeic', index: 4, title: { vi: 'Vận chuyển và cơ sở vật chất', en: 'Shipping and facilities' },
    words: ['shipment', 'dispatch', 'inventory', 'merchandise', 'vendor', 'warranty', 'itinerary', 'accommodate', 'cancellation', 'facility'],
  },
  {
    id: 'toeic-5', exam: 'toeic', index: 5, title: { vi: 'Lịch trình và thời hạn', en: 'Schedules and deadlines' },
    words: ['deadline', 'ensure', 'confirm', 'extend', 'consecutive', 'schedule', 'delay', 'priority', 'agenda', 'milestone'],
  },
  {
    id: 'toefl-1', exam: 'toefl', index: 1, title: { vi: 'Phân tích và nghiên cứu', en: 'Analysis and research' },
    words: ['analyze', 'assess', 'data', 'method', 'evident', 'derive', 'significant', 'indicate', 'interpret', 'identify'],
  },
  {
    id: 'toefl-2', exam: 'toefl', index: 2, title: { vi: 'Xã hội và kinh tế', en: 'Society and economy' },
    words: ['economy', 'income', 'policy', 'role', 'issue', 'percent', 'individual', 'distribute', 'establish', 'contract'],
  },
  {
    id: 'toefl-3', exam: 'toefl', index: 3, title: { vi: 'Thiên nhiên và khoa học', en: 'Nature and science' },
    words: ['environment', 'process', 'occur', 'vary', 'similar', 'factor', 'function', 'formula', 'theory', 'source'],
  },
  {
    id: 'toefl-4', exam: 'toefl', index: 4, title: { vi: 'Khái niệm và cấu trúc', en: 'Concepts and structure' },
    words: ['concept', 'define', 'context', 'structure', 'consist', 'involve', 'create', 'approach', 'assume', 'constrain'],
  },
  {
    id: 'toefl-5', exam: 'toefl', index: 5, title: { vi: 'Đo lường và giả thuyết', en: 'Measurement and hypotheses' },
    words: ['estimate', 'require', 'research', 'hypothesis', 'variable', 'sample', 'trend', 'bias', 'conduct', 'evaluate'],
  },
  {
    id: 'toeic-6', exam: 'toeic', index: 6, title: { vi: 'Tiếp thị và khách hàng', en: 'Marketing and customers' },
    words: ['campaign', 'brand', 'discount', 'promotion', 'survey', 'audience', 'target', 'advertise', 'retail', 'loyalty'],
  },
  {
    id: 'toeic-7', exam: 'toeic', index: 7, title: { vi: 'Hội nghị và đi lại', en: 'Conferences and travel' },
    words: ['conference', 'reservation', 'departure', 'arrival', 'luggage', 'registration', 'attendee', 'venue', 'transfer', 'invitation'],
  },
  {
    id: 'toeic-8', exam: 'toeic', index: 8, title: { vi: 'Hoạt động văn phòng', en: 'Office operations' },
    words: ['supplies', 'equipment', 'maintenance', 'document', 'memo', 'procedure', 'guideline', 'correspondence', 'archive', 'submit'],
  },
  {
    id: 'toeic-9', exam: 'toeic', index: 9, title: { vi: 'Chất lượng và hiệu suất', en: 'Quality and performance' },
    words: ['quality', 'performance', 'improve', 'productivity', 'inspection', 'defect', 'standard', 'review', 'accurate', 'reliable'],
  },
  {
    id: 'toeic-10', exam: 'toeic', index: 10, title: { vi: 'Tài chính và hợp đồng', en: 'Finance and contracts' },
    words: ['contract', 'payment', 'deposit', 'tax', 'audit', 'interest', 'fund', 'rate', 'balance', 'refund'],
  },
  {
    id: 'toefl-6', exam: 'toefl', index: 6, title: { vi: 'Sinh học và sức khoẻ', en: 'Biology and health' },
    words: ['organism', 'species', 'gene', 'disease', 'nutrition', 'tissue', 'cell', 'metabolism', 'mutation', 'symptom'],
  },
  {
    id: 'toefl-7', exam: 'toefl', index: 7, title: { vi: 'Công nghệ và hệ thống', en: 'Technology and systems' },
    words: ['system', 'network', 'device', 'software', 'algorithm', 'protocol', 'component', 'module', 'interface', 'mechanism'],
  },
  {
    id: 'toefl-8', exam: 'toefl', index: 8, title: { vi: 'Lịch sử và văn hoá', en: 'History and culture' },
    words: ['tradition', 'culture', 'ritual', 'heritage', 'civilization', 'ancient', 'colonial', 'region', 'era', 'revolution'],
  },
  {
    id: 'toefl-9', exam: 'toefl', index: 9, title: { vi: 'Tâm lý và nhận thức', en: 'Psychology and cognition' },
    words: ['cognitive', 'behavior', 'motivation', 'perception', 'memory', 'stimulus', 'response', 'attitude', 'intelligence', 'emotion'],
  },
  {
    id: 'toefl-10', exam: 'toefl', index: 10, title: { vi: 'Kinh tế và xã hội', en: 'Economics and society' },
    words: ['market', 'trade', 'labour', 'wage', 'inflation', 'resource', 'supply', 'demand', 'export', 'growth'],
  },
  {
    id: 'toeic-11', exam: 'toeic', index: 11, title: { vi: 'Thương mại quốc tế và hải quan', en: 'International trade and customs' },
    words: ['customs', 'tariff', 'import', 'freight', 'consignment', 'clearance', 'origin', 'quota', 'declare', 'exchange'],
  },
  {
    id: 'toeic-12', exam: 'toeic', index: 12, title: { vi: 'Tuyển dụng và sự nghiệp', en: 'Recruiting and careers' },
    words: ['applicant', 'interview', 'hire', 'resign', 'probation', 'salary', 'benefit', 'mentor', 'absence', 'workload'],
  },
  {
    id: 'toeic-13', exam: 'toeic', index: 13, title: { vi: 'Sản xuất và chuỗi cung ứng', en: 'Production and supply chain' },
    words: ['production', 'capacity', 'assemble', 'manufacture', 'warehouse', 'stock', 'supplier', 'shortage', 'specification', 'prototype'],
  },
  {
    id: 'toeic-14', exam: 'toeic', index: 14, title: { vi: 'Ngân hàng và đầu tư', en: 'Banking and investment' },
    words: ['invest', 'loan', 'credit', 'dividend', 'asset', 'liability', 'shareholder', 'portfolio', 'mortgage', 'collateral'],
  },
  {
    id: 'toeic-15', exam: 'toeic', index: 15, title: { vi: 'Tiếp thị số và truyền thông', en: 'Digital marketing and media' },
    words: ['website', 'subscribe', 'content', 'platform', 'engagement', 'influencer', 'impression', 'feature', 'newsletter', 'endorse'],
  },
  {
    id: 'toeic-16', exam: 'toeic', index: 16, title: { vi: 'Hợp đồng và pháp lý', en: 'Contracts and legal terms' },
    words: ['clause', 'amend', 'terminate', 'breach', 'arbitration', 'jurisdiction', 'waive', 'indemnify', 'obligation', 'violation'],
  },
  {
    id: 'toeic-17', exam: 'toeic', index: 17, title: { vi: 'Khách sạn và dịch vụ', en: 'Hospitality services' },
    words: ['occupancy', 'amenity', 'concierge', 'lodging', 'valet', 'complimentary', 'lounge', 'guest', 'vacant', 'hospitality'],
  },
  {
    id: 'toeic-18', exam: 'toeic', index: 18, title: { vi: 'Mua sắm và báo giá', en: 'Procurement and pricing' },
    words: ['quotation', 'bid', 'tender', 'procure', 'bulk', 'wholesale', 'subscription', 'rebate', 'surcharge', 'backorder'],
  },
  {
    id: 'toeic-19', exam: 'toeic', index: 19, title: { vi: 'Báo cáo và phân tích', en: 'Reports and analysis' },
    words: ['forecast', 'benchmark', 'metric', 'indicator', 'variance', 'projection', 'summary', 'trend', 'appendix', 'statistic'],
  },
  {
    id: 'toeic-20', exam: 'toeic', index: 20, title: { vi: 'Chăm sóc khách hàng', en: 'Customer service' },
    words: ['apologize', 'grievance', 'courteous', 'resolve', 'troubleshoot', 'escalate', 'inquiry', 'notify', 'reschedule', 'compensate'],
  },
  {
    id: 'toefl-11', exam: 'toefl', index: 11, title: { vi: 'Địa chất và khí hậu', en: 'Geology and climate' },
    words: ['sediment', 'erosion', 'glacier', 'volcano', 'atmosphere', 'climate', 'fossil', 'mineral', 'rainfall', 'tectonic'],
  },
  {
    id: 'toefl-12', exam: 'toefl', index: 12, title: { vi: 'Thiên văn và vật lý', en: 'Astronomy and physics' },
    words: ['galaxy', 'orbit', 'radiation', 'gravity', 'particle', 'energy', 'density', 'momentum', 'telescope', 'celestial'],
  },
  {
    id: 'toefl-13', exam: 'toefl', index: 13, title: { vi: 'Hoá học và vật liệu', en: 'Chemistry and materials' },
    words: ['compound', 'molecule', 'element', 'reaction', 'catalyst', 'solvent', 'polymer', 'alloy', 'acid', 'oxidation'],
  },
  {
    id: 'toefl-14', exam: 'toefl', index: 14, title: { vi: 'Sinh thái và động vật', en: 'Ecology and animals' },
    words: ['habitat', 'predator', 'prey', 'migration', 'ecosystem', 'camouflage', 'population', 'herbivore', 'carnivore', 'pollinate'],
  },
  {
    id: 'toefl-15', exam: 'toefl', index: 15, title: { vi: 'Chính trị và quản trị', en: 'Politics and governance' },
    words: ['legislation', 'democracy', 'constitution', 'election', 'citizen', 'sovereignty', 'diplomacy', 'reform', 'authority', 'regulation'],
  },
  {
    id: 'toefl-16', exam: 'toefl', index: 16, title: { vi: 'Giáo dục và học tập', en: 'Education and learning' },
    words: ['curriculum', 'scholarship', 'literacy', 'seminar', 'graduate', 'assignment', 'instruction', 'lecture', 'academic', 'tutorial'],
  },
  {
    id: 'toefl-17', exam: 'toefl', index: 17, title: { vi: 'Nghệ thuật và văn học', en: 'Arts and literature' },
    words: ['novel', 'poetry', 'sculpture', 'painting', 'composition', 'narrative', 'symbolism', 'genre', 'critic', 'manuscript'],
  },
  {
    id: 'toefl-18', exam: 'toefl', index: 18, title: { vi: 'Ngôn ngữ và giao tiếp', en: 'Language and communication' },
    words: ['dialect', 'vocabulary', 'syntax', 'grammar', 'pronunciation', 'linguistic', 'phrase', 'metaphor', 'translation', 'dialogue'],
  },
  {
    id: 'toefl-19', exam: 'toefl', index: 19, title: { vi: 'Đô thị và kiến trúc', en: 'Cities and architecture' },
    words: ['urban', 'infrastructure', 'architecture', 'skyline', 'construction', 'district', 'zoning', 'transit', 'landmark', 'monument'],
  },
  {
    id: 'toefl-20', exam: 'toefl', index: 20, title: { vi: 'Truyền thông và thông tin', en: 'Media and information' },
    words: ['journalism', 'broadcast', 'publication', 'editor', 'circulation', 'headline', 'documentary', 'encyclopedia', 'censorship', 'propaganda'],
  },
];

export function unitsFor(exam: IntlExamKey): VocabUnit[] {
  return VOCAB_UNITS.filter((u) => u.exam === exam);
}

export function unitEntries(unit: VocabUnit): VocabEntry[] {
  const source = unit.exam === 'toeic' ? ALL_TOEIC_VOCAB : ALL_TOEFL_VOCAB;
  return unit.words.map((w) => {
    const entry = source.find((e) => e.word === w);
    if (!entry) throw new Error(`unit ${unit.id}: missing word ${w}`);
    return entry;
  });
}
