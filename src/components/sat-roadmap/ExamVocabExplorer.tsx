import React, { useState, useMemo } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Icon } from '@/components/ui/Icon';
import { useL } from '@/i18n/useL';
import {
  EXAM_EXTRACTED_VOCABULARY,
  type ExamVocabItem,
} from '@/data/exam-extracted-vocab';

export function ExamVocabExplorer() {
  const { L } = useL();
  const [domainFilter, setDomainFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [flashcardMode, setFlashcardMode] = useState<boolean>(false);
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());

  const toggleReveal = (id: string) => {
    setRevealedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredVocab = useMemo(() => {
    return EXAM_EXTRACTED_VOCABULARY.filter((item) => {
      if (domainFilter !== 'all' && item.domain !== domainFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          item.word.toLowerCase().includes(q) ||
          item.defVi.toLowerCase().includes(q) ||
          item.defEn.toLowerCase().includes(q) ||
          item.examSource.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [domainFilter, searchQuery]);

  return (
    <View
      style={{
        borderRadius: 24,
        backgroundColor: '#FFFFFF',
        borderWidth: 1.5,
        borderColor: '#EFE7DC',
        padding: 22,
        gap: 16,
        shadowColor: '#784415',
        shadowOpacity: 0.05,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 4 },
      }}
    >
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <View style={{ gap: 3 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                backgroundColor: '#EFF6FF',
                borderWidth: 1,
                borderColor: '#BFDBFE',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 16 }}>🔤</Text>
            </View>
            <Text style={{ fontSize: 18, fontWeight: '900', color: '#0F1D33', letterSpacing: -0.3 }}>
              {L('Từ Vựng Trích Xuất Từ Đề Thi Thật', 'Exam-Extracted Academic Vocabulary')}
            </Text>
          </View>
          <Text style={{ fontSize: 12.5, color: '#64748B', fontWeight: '500' }}>
            {L('Từ vựng xuất hiện trực tiếp trong bài đọc Digital SAT 2024–2025 & Cambridge IELTS 15–19', 'Extracted directly from real SAT & IELTS test passages')}
          </Text>
        </View>

        {/* Flashcard mode toggle button */}
        <Pressable
          onPress={() => setFlashcardMode(!flashcardMode)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 999,
            backgroundColor: flashcardMode ? '#B94A70' : '#FAF5EE',
            borderWidth: 1,
            borderColor: flashcardMode ? '#B94A70' : '#E6DACB',
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: '800', color: flashcardMode ? '#FFFFFF' : '#B94A70' }}>
            {flashcardMode ? L('✓ Chế độ Flashcard (Bật)', 'Flashcard Mode (On)') : L('🃏 Bật Flashcard', 'Flashcard Mode')}
          </Text>
        </Pressable>
      </View>

      {/* Search Input Bar */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          borderRadius: 12,
          backgroundColor: '#FAF8F5',
          borderWidth: 1,
          borderColor: '#EFE7DC',
          paddingHorizontal: 12,
          height: 42,
        }}
      >
        <Icon name="search" size={15} color="#B94A70" />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={L('Tìm từ vựng: qualify, refugia, intransigent...', 'Search words: qualify, refugia...')}
          placeholderTextColor="#94A3B8"
          style={{
            flex: 1,
            fontSize: 13,
            color: '#1E293B',
            outlineStyle: 'none' as never,
          }}
        />
        {searchQuery ? (
          <Pressable onPress={() => setSearchQuery('')}>
            <Icon name="close" size={14} color="#94A3B8" />
          </Pressable>
        ) : null}
      </View>

      {/* Domain Filter Pills */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {[
          { id: 'all', label: L('Tất cả', 'All') },
          { id: 'General Academic', label: L('Học thuật chung', 'General Academic') },
          { id: 'Natural Science', label: L('Khoa học Tự nhiên', 'Natural Science') },
          { id: 'Literature', label: L('Văn học', 'Literature') },
          { id: 'History & Politics', label: L('Lịch sử & Chính trị', 'History') },
          { id: 'Economics & Society', label: L('Kinh tế & Xã hội', 'Economics') },
        ].map((pill) => {
          const on = domainFilter === pill.id;
          return (
            <Pressable
              key={pill.id}
              onPress={() => setDomainFilter(pill.id)}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 4.5,
                borderRadius: 8,
                backgroundColor: on ? '#2A241A' : '#FAF5EE',
                borderWidth: 1,
                borderColor: on ? '#2A241A' : '#E6DACB',
              }}
            >
              <Text style={{ fontSize: 11.5, fontWeight: on ? '800' : '600', color: on ? '#FFFFFF' : '#6B6255' }}>
                {pill.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Vocab Cards List */}
      <View style={{ gap: 12 }}>
        {filteredVocab.map((item) => {
          const isRevealed = !flashcardMode || revealedIds.has(item.id);

          return (
            <Pressable
              key={item.id}
              onPress={() => flashcardMode && toggleReveal(item.id)}
              style={{
                borderRadius: 16,
                backgroundColor: '#FAF8F5',
                borderWidth: 1.5,
                borderColor: isRevealed ? '#E8E1D6' : '#FBBF24',
                padding: 16,
                gap: 10,
              }}
            >
              {/* Word & Source Header */}
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
                  <Text style={{ fontSize: 19, fontWeight: '900', color: '#0F1D33', letterSpacing: -0.2 }}>
                    {item.word}
                  </Text>
                  <Text style={{ fontSize: 13, color: '#64748B', fontWeight: '500' }}>
                    {item.phonetic}
                  </Text>
                  <View style={{ backgroundColor: '#E2E8F0', paddingHorizontal: 6, paddingVertical: 1.5, borderRadius: 4 }}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: '#475569' }}>
                      {item.partOfSpeech}
                    </Text>
                  </View>
                </View>

                {/* Source Badge */}
                <View
                  style={{
                    backgroundColor: '#FEF3C7',
                    paddingHorizontal: 8,
                    paddingVertical: 2.5,
                    borderRadius: 6,
                    borderWidth: 0.8,
                    borderColor: '#FDE68A',
                  }}
                >
                  <Text style={{ fontSize: 10.5, fontWeight: '800', color: '#92400E' }}>
                    📍 {item.examSource}
                  </Text>
                </View>
              </View>

              {/* Revealed Definition & Context */}
              {isRevealed ? (
                <View style={{ gap: 8 }}>
                  {/* Definition */}
                  <View style={{ gap: 2 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#854D0E', lineHeight: 20 }}>
                      🇻🇳 {item.defVi}
                    </Text>
                    <Text style={{ fontSize: 12.5, color: '#475569', lineHeight: 18, fontStyle: 'italic' }}>
                      {item.defEn}
                    </Text>
                  </View>

                  {/* Real Context Sentence from Exam */}
                  <View
                    style={{
                      padding: 10,
                      borderRadius: 10,
                      backgroundColor: '#FFFFFF',
                      borderLeftWidth: 3.5,
                      borderLeftColor: '#B94A70',
                      borderWidth: 1,
                      borderColor: '#EFE7DC',
                      gap: 4,
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '800', color: '#B94A70', textTransform: 'uppercase' }}>
                      Trích đoạn đề thi thật:
                    </Text>
                    <Text style={{ fontSize: 13, color: '#1E293B', lineHeight: 20, fontFamily: 'serif' }}>
                      "{item.realContextEn}"
                    </Text>
                    <Text style={{ fontSize: 12, color: '#64748B', lineHeight: 18 }}>
                      → {item.realContextVi}
                    </Text>
                  </View>

                  {/* SAT Trap Note (if any) */}
                  {item.satTrapVi && (
                    <View style={{ backgroundColor: '#FEF2F2', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#FECACA' }}>
                      <Text style={{ fontSize: 11.5, color: '#991B1B', fontWeight: '600' }}>
                        ⚠️ {item.satTrapVi}
                      </Text>
                    </View>
                  )}

                  {/* Synonyms Chips */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', paddingTop: 2 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B' }}>
                      Đồng nghĩa:
                    </Text>
                    {item.synonyms.map((syn, sIdx) => (
                      <View key={sIdx} style={{ backgroundColor: '#F1F5F9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                        <Text style={{ fontSize: 11, color: '#334155', fontWeight: '600' }}>{syn}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : (
                /* Flashcard Hidden State */
                <View style={{ paddingVertical: 12, alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#B45309' }}>
                    👆 {L('Nhấp để lật thẻ xem nghĩa & câu trích đề thi', 'Click to reveal definition & exam context')}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#78350F' }}>
                    {L('Hãy tự đoán nghĩa trước khi bấm', 'Test your recall before flipping')}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
