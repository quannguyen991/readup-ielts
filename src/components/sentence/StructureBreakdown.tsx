import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Icon, type IconName } from '@/components/ui';
import { ROLE_LABEL, type Role } from '@/services/sentence/sentence-analyze';
import { explainSentence } from '@/services/sentence/sentence-explain';
import type { StructureDef } from '@/services/sentence/structure-bank';
import { pronounce } from '@/services/audio/pronounce';
import { useL } from '@/i18n/useL';

/**
 * Phần GIẢI CHI TIẾT một câu — hiện dưới câu sau khi người học làm xong.
 *
 * Năm khối, mỗi khối trả lời một câu hỏi: câu này gồm những phần nào, dùng cấu
 * trúc gì và dùng khi nào, còn câu nào cùng khuôn, từ khoá nói được cách nào
 * khác, và cả câu nói lại được ra sao. Nguồn dữ liệu: ghi chú soạn sẵn theo mã
 * câu, rơi về luật khi câu chưa có (xem `sentence-explain.ts`).
 */

const ROLE_STYLE: Record<Role, { bg: string; ink: string }> = {
  subject: { bg: '#E0ECFF', ink: '#1D4ED8' },
  verb: { bg: '#FFE4E6', ink: '#BE123C' },
  object: { bg: '#DCFCE7', ink: '#15803D' },
  indirect: { bg: '#CFFAFE', ink: '#0E7490' },
  complement: { bg: '#FEF3C7', ink: '#B45309' },
  time: { bg: '#EDE9FE', ink: '#6D28D9' },
  place: { bg: '#FCE7F3', ink: '#BE185D' },
  manner: { bg: '#E0F2FE', ink: '#0369A1' },
  reason: { bg: '#FFEDD5', ink: '#C2410C' },
  purpose: { bg: '#ECFCCB', ink: '#4D7C0F' },
  adverbial: { bg: '#F1F5F9', ink: '#475569' },
  connector: { bg: '#F5F5F4', ink: '#57534E' },
  relative: { bg: '#FEF9C3', ink: '#A16207' },
  rest: { bg: '#F1F5F9', ink: '#475569' },
};

function Section({ icon, title, children, open: openInit = true }: { icon: IconName; title: string; children: React.ReactNode; open?: boolean }) {
  const [open, setOpen] = useState(openInit);
  return (
    <View className="mt-3 rounded-panel border border-brand-soft bg-white">
      <Pressable accessibilityRole="button" aria-expanded={open} onPress={() => setOpen((v) => !v)} className="flex-row items-center gap-2 px-3.5 py-2.5">
        <Icon name={icon} size={16} color="#6A4BD9" strokeWidth={2.2} />
        <Text className="flex-1 font-strong text-body text-paper-ink">{title}</Text>
        <Icon name={open ? 'chevron-up' : 'chevron-down'} size={16} color="#94A3B8" />
      </Pressable>
      {open ? <View className="px-3.5 pb-3.5">{children}</View> : null}
    </View>
  );
}

function SpeakLine({ text, textClass = 'font-sans text-body text-paper-ink' }: { text: string; textClass?: string }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={text} onPress={() => void pronounce(text, { rate: 1 })} className="flex-row items-start gap-2">
      <View className="mt-1">
        <Icon name="volume" size={14} color="#8B6CF0" />
      </View>
      <Text className={`flex-1 ${textClass}`}>{text}</Text>
    </Pressable>
  );
}

function StructureCard({ s, first, level }: { s: StructureDef; first: boolean; level: 'vi' | 'en' }) {
  const [open, setOpen] = useState(first);
  const L2 = (vi: string, en: string) => (level === 'en' ? en : vi);
  return (
    <View className="mt-2 rounded-panel bg-paper-canvas p-3">
      <Pressable accessibilityRole="button" aria-expanded={open} onPress={() => setOpen((v) => !v)} className="flex-row items-center gap-2">
        <View className="rounded-pill px-2.5 py-0.5" style={{ backgroundColor: first ? '#0F1D33' : '#E4DEFB' }}>
          <Text className="font-strong" style={{ fontSize: 12, color: first ? '#FFFFFF' : '#3B2E8A' }}>
            {first ? L2('Chính', 'Main') : L2('Thêm', 'Also')}
          </Text>
        </View>
        <Text className="flex-1 font-strong text-body text-paper-ink">{level === 'en' ? s.en : s.vi}</Text>
        <Icon name={open ? 'chevron-up' : 'chevron-down'} size={15} color="#94A3B8" />
      </Pressable>
      <Text className="mt-1.5 font-mid text-label" style={{ color: '#6A4BD9' }}>{s.formula}</Text>
      {open ? (
        <View className="mt-2 gap-1.5">
          <Text className="font-sans text-body text-paper-body">{s.usage}</Text>
          <Text className="font-sans text-label text-paper-muted">
            {L2('Lưu ý', 'Watch out')}: {s.pitfall}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export function StructureBreakdown({ text, id, vi, showRewrites = true }: { text: string; id?: string; vi?: string; showRewrites?: boolean }) {
  const { L, en } = useL();
  const info = useMemo(() => explainSentence(text, id), [text, id]);
  const lang = en ? 'en' : 'vi';

  return (
    <View className="mt-4" testID="structure-breakdown">
      <View className="flex-row items-center gap-2">
        <Icon name="sparkle" size={17} color="#8B6CF0" strokeWidth={2.2} />
        <Text className="flex-1 font-strong text-bodyLg text-paper-ink">{L('Giải chi tiết câu này', 'Sentence breakdown')}</Text>
        {info.tenseLabel ? (
          <View className="rounded-pill px-2.5 py-0.5" style={{ backgroundColor: '#EEE9FF' }}>
            <Text className="font-strong" style={{ fontSize: 12, color: '#3B2E8A' }}>{info.tenseLabel}</Text>
          </View>
        ) : null}
      </View>
      {vi ? <Text className="mt-1 font-sans text-body text-paper-muted">{vi}</Text> : null}

      {/* 1. Thành phần */}
      <Section icon="list" title={L('Thành phần câu', 'Sentence parts')}>
        {info.chunks && info.chunks.length > 0 ? (
          <View>
            <View className="flex-row flex-wrap" style={{ gap: 6 }}>
              {info.chunks.map((c, i) => {
                const st = ROLE_STYLE[c.role];
                return (
                  <View key={i} className="rounded-lg px-2.5 py-1.5" style={{ backgroundColor: st.bg }}>
                    <Text className="font-strong" style={{ fontSize: 15, color: st.ink }}>{c.text}</Text>
                    <Text className="font-sans" style={{ fontSize: 11, color: st.ink, opacity: 0.85 }}>{en ? ROLE_LABEL[c.role].en : ROLE_LABEL[c.role].vi}</Text>
                  </View>
                );
              })}
            </View>
            {info.source === 'rules' ? (
              <Text className="mt-2 font-sans text-label text-paper-muted">{L('Phân tích tự động.', 'Auto-analysed.')}</Text>
            ) : null}
          </View>
        ) : (
          <Text className="font-sans text-body text-paper-muted">{L('Câu dài nhiều tầng — xem cấu trúc bên dưới.', 'A layered sentence — see the structures below.')}</Text>
        )}
        {info.note ? <Text className="mt-2.5 font-sans text-body text-paper-body">{info.note}</Text> : null}
      </Section>

      {/* 2. Cấu trúc */}
      {info.structures.length > 0 ? (
        <Section icon="book" title={L('Cấu trúc & cách dùng', 'Structure & usage')}>
          {info.structures.map((s, i) => (
            <StructureCard key={s.id} s={s} first={i === 0} level={lang} />
          ))}
        </Section>
      ) : null}

      {/* 3. Câu cùng khuôn */}
      {info.similar.length > 0 ? (
        <Section icon="clipboard" title={L('Câu cùng khuôn', 'Same pattern')}>
          <View className="gap-2.5">
            {info.similar.map((x, i) => (
              <View key={i}>
                <SpeakLine text={x.en} />
                <Text className="ml-6 font-sans text-label text-paper-muted">{x.vi}</Text>
              </View>
            ))}
          </View>
        </Section>
      ) : null}

      {/* 4. Từ đồng nghĩa */}
      {info.synonyms.length > 0 ? (
        <Section icon="languages" title={L('Từ & cụm tương đương', 'Equivalent words')}>
          <View className="gap-2">
            {info.synonyms.map((s, i) => (
              <View key={i} className="flex-row flex-wrap items-center" style={{ columnGap: 6, rowGap: 4 }}>
                <View className="rounded-md px-2 py-0.5" style={{ backgroundColor: '#E0ECFF' }}>
                  <Text className="font-strong" style={{ fontSize: 14, color: '#1D4ED8' }}>{s.phrase}</Text>
                </View>
                <Icon name="arrow-right" size={13} color="#94A3B8" />
                {s.alts.map((a) => (
                  <View key={a} className="rounded-md px-2 py-0.5" style={{ backgroundColor: '#DCFCE7' }}>
                    <Text className="font-strong" style={{ fontSize: 14, color: '#15803D' }}>{a}</Text>
                  </View>
                ))}
                <Text className="font-sans text-label text-paper-muted">· {s.vi}</Text>
              </View>
            ))}
          </View>
        </Section>
      ) : null}

      {/* 5. Cách diễn đạt khác */}
      {showRewrites && info.rewrites.length > 0 ? (
        <Section icon="refresh" title={L('Cách diễn đạt khác', 'Another way to say it')}>
          <View className="gap-3">
            {info.rewrites.map((r, i) => (
              <View key={i}>
                <SpeakLine text={r.en} textClass="font-strong text-body text-paper-ink" />
                <Text className="ml-6 font-sans text-label" style={{ color: '#6A4BD9' }}>{r.label}</Text>
              </View>
            ))}
          </View>
        </Section>
      ) : null}
    </View>
  );
}
