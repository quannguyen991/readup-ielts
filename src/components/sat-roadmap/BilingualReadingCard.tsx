import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Icon } from '@/components/ui/Icon';
import { useL } from '@/i18n/useL';

export type BilingualPassageData = {
  id: string;
  title: string;
  category: 'sat_literature' | 'sat_science' | 'sat_history' | 'ielts_academic';
  categoryLabelVi: string;
  source: string;
  paragraphs: {
    en: string;
    vi: string;
  }[];
  keyTerms: {
    en: string;
    vi: string;
    phonetic?: string;
    partOfSpeech?: string;
  }[];
  comprehensionQuestion?: {
    stem: string;
    options: string[];
    answerIndex: number;
    explanationVi: string;
  };
};

export const SAMPLE_BILINGUAL_PASSAGES: BilingualPassageData[] = [
  {
    id: 'bilingual-sat-01',
    title: 'Edith Wharton: The House of Mirth (Văn học cổ điển SAT)',
    category: 'sat_literature',
    categoryLabelVi: 'SAT Reading · Văn học Cổ điển',
    source: 'The Critical Reader (Erica Meltzer) & 1905 Classic Novel',
    paragraphs: [
      {
        en: 'She was so evidently the victim of the civilization which had produced her, that the links of her own chain seemed to have been forged by the very hands that stroked her hair.',
        vi: 'Nàng rõ ràng là nạn nhân của chính nền văn minh đã tạo ra nàng, đến mức những mắt xích của xiềng xích ràng buộc nàng dường như được rèn bởi chính những bàn tay từng vuốt ve mái tóc nàng.',
      },
      {
        en: 'She had been brought up to be ornamental; her whole training had tended to make her a luxury, and she had never learned the practical art of living on a small income.',
        vi: 'Nàng đã được nuôi dạy chỉ để làm một món đồ trang sức; toàn bộ sự rèn giũa nàng chỉ hướng tới việc biến nàng thành một thứ xa xỉ phẩm, và nàng chưa từng học nghệ thuật thực tế để sinh tồn với một khoản thu nhập khiêm tốn.',
      },
      {
        en: 'The contemplation of small economies filled her with physical nausea; yet each day brought some fresh reminder of the precariousness of her independence.',
        vi: 'Ý nghĩ phải thắt lưng buộc bụng với những khoản tiết kiệm vụn vặt khiến nàng buồn nôn về mặt thể xác; dẫu vậy, mỗi ngày trôi qua lại mang đến một lời nhắc nhở mới về tính bấp bênh, mong manh của sự độc lập nơi nàng.',
      },
    ],
    keyTerms: [
      { en: 'ornamental', vi: 'mang tính trang trí, làm cảnh', phonetic: '/ˌɔːnəˈmentl/', partOfSpeech: 'adj' },
      { en: 'precariousness', vi: 'sự bấp bênh, hiểm nghèo', phonetic: '/prɪˈkeəriəsnəs/', partOfSpeech: 'noun' },
      { en: 'contemplation', vi: 'sự suy ngẫm, sự trù tính', phonetic: '/ˌkɒntəmˈpleɪʃn/', partOfSpeech: 'noun' },
      { en: 'forged', vi: 'được rèn đúc, tạo dựng', phonetic: '/fɔːdʒd/', partOfSpeech: 'verb' },
    ],
    comprehensionQuestion: {
      stem: 'Which choice best describes Lily Bart’s central conflict in the passage?',
      options: [
        'She wants to pursue a career in trade but lacks financial capital.',
        'Her luxurious upbringing makes her unable to cope with financial instability.',
        'She refuses to marry because of her intellectual superiority.',
        'She blames her family for preventing her from receiving higher education.',
      ],
      answerIndex: 1,
      explanationVi: 'Đoạn văn nêu rõ mâu thuẫn: nàng được nuôi dạy xa hoa ("brought up to be ornamental... a luxury") nhưng sự độc lập tài chính lại vô cùng bấp bênh ("precariousness of her independence"). Đáp án B là đáp án chính xác.',
    },
  },
  {
    id: 'bilingual-sat-02',
    title: 'Hệ thống sinh thái miệng phun thủy nhiệt (Khoa học tự nhiên SAT)',
    category: 'sat_science',
    categoryLabelVi: 'SAT Reading · Khoa học Tự nhiên',
    source: 'Deep-Sea Biology & College Board Question Bank 2024',
    paragraphs: [
      {
        en: 'In deep-sea hydrothermal vent communities, the primary producers are not photosynthetic plants but chemolithoautotrophic bacteria, which oxidize hydrogen sulfide emitting from the vents to synthesize organic compounds.',
        vi: 'Tại các quần xã miệng phun thủy nhiệt dưới đáy biển sâu, các sinh vật sản xuất sơ cấp không phải là thực vật quang hợp mà là vi khuẩn hóa dưỡng tự dưỡng vô cơ, chúng oxy hóa hydro sunfua phát ra từ miệng phun để tổng hợp các hợp chất hữu cơ.',
      },
      {
        en: 'Giant tube worms lack a digestive tract entirely; instead, their bodies house trillions of these symbiotic bacteria within a specialized organ called a trophosome.',
        vi: 'Giun ống khổng lồ hoàn toàn không có đường tiêu hóa; thay vào đó, cơ thể chúng chứa hàng nghìn tỷ vi khuẩn cộng sinh này bên trong một cơ quan chuyên biệt gọi là trophosome.',
      },
      {
        en: 'Consequently, the survival of the host tube worm is directly contingent upon the chemical substrate required by its bacterial symbionts.',
        vi: 'Do đó, sự sống còn của giun ống vật chủ phụ thuộc trực tiếp vào cơ chất hóa học mà các vi khuẩn cộng sinh của nó đòi hỏi.',
      },
    ],
    keyTerms: [
      { en: 'hydrothermal vent', vi: 'miệng phun thủy nhiệt đáy biển', phonetic: '/ˌhaɪdrəʊˈθɜːml vent/', partOfSpeech: 'noun' },
      { en: 'chemolithoautotrophic', vi: 'hóa tự dưỡng vô cơ', phonetic: '/ˌkiːməʊˌlɪθəʊˌɔːtəˈtrɒfɪk/', partOfSpeech: 'adj' },
      { en: 'symbiotic', vi: 'cộng sinh', phonetic: '/ˌsɪmbaɪˈɒtɪk/', partOfSpeech: 'adj' },
      { en: 'contingent upon', vi: 'phụ thuộc vào, tùy thuộc vào', phonetic: '/kənˈtɪndʒənt/', partOfSpeech: 'adj phr' },
    ],
  },
  {
    id: 'bilingual-ielts-03',
    title: 'Cambridge IELTS 18: Biến đổi khí hậu & Tái hoang dã (IELTS Reading)',
    category: 'ielts_academic',
    categoryLabelVi: 'IELTS Academic Reading',
    source: 'Cambridge IELTS 18 Academic Reading Test 2',
    paragraphs: [
      {
        en: "Rewilding is a progressive approach to conservation. It is about letting nature take care of itself, enabling natural processes to shape land and sea, repair damaged ecosystems and restore degraded landscapes.",
        vi: 'Tái hoang dã là một cách tiếp cận tiến bộ đối với công tác bảo tồn. Nó xoay quanh việc để tự nhiên tự chăm sóc chính nó, cho phép các tiến trình tự nhiên định hình đất liền và biển cả, phục hồi các hệ sinh thái bị tổn hại và tái tạo các cảnh quan bị suy thoái.',
      },
      {
        en: "Through rewilding, wild nature's own rhythm creates healthier, more diverse habitats that are more resilient to the impacts of global climate change.",
        vi: 'Thông qua tái hoang dã, nhịp điệu của chính thiên nhiên hoang dã tạo ra những sinh cảnh đa dạng và khỏe mạnh hơn, có khả năng chống chịu tốt hơn trước các tác động của biến đổi khí hậu toàn cầu.',
      },
    ],
    keyTerms: [
      { en: 'rewilding', vi: 'tái hoang dã hóa', phonetic: '/ˌriːˈwaɪldɪŋ/', partOfSpeech: 'noun' },
      { en: 'conservation', vi: 'bảo tồn thiên nhiên', phonetic: '/ˌkɒnsəˈveɪʃn/', partOfSpeech: 'noun' },
      { en: 'resilient', vi: 'kiên cường, có sức chống chịu', phonetic: '/rɪˈzɪliənt/', partOfSpeech: 'adj' },
      { en: 'degraded', vi: 'bị suy thoái, xuống cấp', phonetic: '/dɪˈɡreɪdɪd/', partOfSpeech: 'adj' },
    ],
  },
];

export function BilingualReadingCard({ passage }: { passage: BilingualPassageData }) {
  const { L } = useL();
  const [mode, setMode] = useState<'bilingual' | 'en_only' | 'vi_only'>('bilingual');
  const [showVocab, setShowVocab] = useState(true);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  return (
    <View
      style={{
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        borderWidth: 1.5,
        borderColor: '#F3F0FB',
        padding: 20,
        gap: 16,
        shadowColor: '#2B2350',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 3 },
      }}
    >
      {/* Top Header */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <View style={{ gap: 4, flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <View
              style={{
                backgroundColor: passage.category === 'sat_literature' ? '#EDE9FE' : passage.category === 'sat_science' ? '#CCFBF1' : '#F3F0FB',
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 6,
              }}
            >
              <Text
                style={{
                  fontSize: 10.5,
                  fontWeight: '800',
                  color: passage.category === 'sat_literature' ? '#6D28D9' : passage.category === 'sat_science' ? '#0F766E' : '#6A4BD9',
                  textTransform: 'uppercase',
                }}
              >
                {passage.categoryLabelVi}
              </Text>
            </View>
            <Text style={{ fontSize: 11.5, color: '#64748B', fontWeight: '500' }}>
              {passage.source}
            </Text>
          </View>
          <Text style={{ fontSize: 17, fontWeight: '900', color: '#0F1D33', letterSpacing: -0.2 }}>
            {passage.title}
          </Text>
        </View>

        {/* View mode toggle pills */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F3F0FB', padding: 3, borderRadius: 10, borderWidth: 1, borderColor: '#E6DACB' }}>
          {[
            { id: 'bilingual' as const, label: L('Song ngữ', 'Bilingual') },
            { id: 'en_only' as const, label: 'English' },
            { id: 'vi_only' as const, label: 'Tiếng Việt' },
          ].map((m) => (
            <Pressable
              key={m.id}
              onPress={() => setMode(m.id)}
              style={{
                paddingHorizontal: 9,
                paddingVertical: 4,
                borderRadius: 7,
                backgroundColor: mode === m.id ? '#B94A70' : 'transparent',
              }}
            >
              <Text style={{ fontSize: 11.5, fontWeight: '700', color: mode === m.id ? '#FFFFFF' : '#6B6255' }}>
                {m.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Paragraphs Stream */}
      <View style={{ gap: 14 }}>
        {passage.paragraphs.map((p, idx) => (
          <View
            key={idx}
            style={{
              padding: 14,
              borderRadius: 14,
              backgroundColor: '#F3F0FB',
              borderWidth: 1,
              borderColor: '#F3F0FB',
              gap: 8,
            }}
          >
            {/* English text */}
            {mode !== 'vi_only' && (
              <Text
                style={{
                  fontSize: 14.5,
                  lineHeight: 23,
                  color: '#1E293B',
                  fontWeight: '500',
                  fontFamily: 'serif',
                }}
              >
                {p.en}
              </Text>
            )}

            {/* Vietnamese translation */}
            {mode !== 'en_only' && (
              <Text
                style={{
                  fontSize: 13.5,
                  lineHeight: 21,
                  color: '#2B2350',
                  fontWeight: '500',
                  borderTopWidth: mode === 'bilingual' ? 1 : 0,
                  borderTopColor: '#F3F0FB',
                  paddingTop: mode === 'bilingual' ? 6 : 0,
                }}
              >
                🇻🇳 {p.vi}
              </Text>
            )}
          </View>
        ))}
      </View>

      {/* Vocabulary Highlights */}
      {showVocab && passage.keyTerms.length > 0 && (
        <View style={{ gap: 8, paddingTop: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 12.5, fontWeight: '800', color: '#2B2350', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              📖 {L('Từ vựng học thuật quan trọng trong bài:', 'Key Academic Vocabulary:')}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {passage.keyTerms.map((term, tIdx) => (
              <View
                key={tIdx}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 8,
                  backgroundColor: '#F3F0FB',
                  borderWidth: 1,
                  borderColor: '#FDE68A',
                }}
              >
                <Text style={{ fontSize: 12.5, fontWeight: '800', color: '#6A4BD9' }}>
                  {term.en}
                </Text>
                {term.phonetic && (
                  <Text style={{ fontSize: 11, color: '#6A4BD9' }}>{term.phonetic}</Text>
                )}
                <Text style={{ fontSize: 12, color: '#2B2350', fontWeight: '500' }}>
                  : {term.vi}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Quick Check Question (if available) */}
      {passage.comprehensionQuestion && (
        <View
          style={{
            marginTop: 6,
            padding: 16,
            borderRadius: 14,
            backgroundColor: '#F8FAFC',
            borderWidth: 1,
            borderColor: '#E2E8F0',
            gap: 12,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 12, fontWeight: '800', color: '#2563EB', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              🎯 {L('Câu hỏi đọc hiểu kiểm tra:', 'Reading Comprehension Check:')}
            </Text>
          </View>
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F1D33' }}>
            {passage.comprehensionQuestion.stem}
          </Text>

          <View style={{ gap: 8 }}>
            {passage.comprehensionQuestion.options.map((opt, oIdx) => {
              const isSelected = selectedChoice === oIdx;
              const isCorrect = oIdx === passage.comprehensionQuestion?.answerIndex;
              const showResult = selectedChoice !== null;

              let bg = '#FFFFFF';
              let border = '#CBD5E1';
              let textC = '#334155';

              if (showResult) {
                if (isCorrect) {
                  bg = '#DCFCE7';
                  border = '#86EFAC';
                  textC = '#15803D';
                } else if (isSelected) {
                  bg = '#FEE2E2';
                  border = '#FCA5A5';
                  textC = '#B91C1C';
                }
              } else if (isSelected) {
                bg = '#EFF6FF';
                border = '#93C5FD';
              }

              return (
                <Pressable
                  key={oIdx}
                  onPress={() => {
                    setSelectedChoice(oIdx);
                    setShowExplanation(true);
                  }}
                  style={{
                    padding: 10,
                    borderRadius: 8,
                    backgroundColor: bg,
                    borderWidth: 1.5,
                    borderColor: border,
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: isSelected || (showResult && isCorrect) ? '700' : '500', color: textC }}>
                    {opt}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {showExplanation && (
            <View style={{ padding: 10, borderRadius: 8, backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE' }}>
              <Text style={{ fontSize: 12.5, color: '#1E40AF', lineHeight: 19 }}>
                💡 <Text style={{ fontWeight: '800' }}>{L('Giải thích:', 'Explanation:')}</Text> {passage.comprehensionQuestion.explanationVi}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
