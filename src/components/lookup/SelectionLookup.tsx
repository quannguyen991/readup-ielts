import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { usePathname } from 'expo-router';

import { Icon } from '@/components/ui/Icon';
import { speak } from '@/components/vocab/study/StudyKit';
import { isLookupBlocked } from '@/navigation/focus-routes';
import { findDeckWord } from '@/services/dictionary/deck-dictionary';
import { lemmatize, useWordLookup, type WordLookup } from '@/services/dictionary/lookup';
import { offlineGloss } from '@/services/dictionary/offline-glossary';
import { lookupable } from '@/services/dictionary/selection';
import { useVocabStore } from '@/store/useVocabStore';
import { color } from '@/theme/tokens';

/**
 * BÔI ĐEN LÀ TRA — ở mọi màn của app (chỉ trên web).
 *
 * Bôi một từ hay một cụm tiếng Anh ngắn: một nhãn nhỏ hiện ngay trên vùng bôi,
 * có sẵn nghĩa nhanh nếu từ điển trong máy có; bấm "Tra" thì mở thẻ đủ phiên âm,
 * loa, nghĩa tiếng Việt, nghĩa theo câu, ví dụ (không kèm nghĩa tiếng Anh — người
 * dùng bảo bỏ, 24/09/2026) và nút lưu vào
 * sổ từ (chung lịch ôn FSRS với từ lưu lúc đọc bài).
 *
 * KHÔNG CHẠY ở màn làm đề (thi thử, chẩn đoán, đề của tuần, đấu 1–1, kiểm tra
 * từ vựng) — tra được ở đó là lộ đáp án — và ở màn đọc bài / đọc song ngữ, nơi
 * đã có thẻ tra riêng theo đoạn văn (`isLookupBlocked`).
 *
 * Nhãn hiện khi nhả chuột, không phải trong lúc kéo: selectionchange bắn liên
 * tục khi đang kéo, mở nhãn từ chữ cái đầu thì không ai bôi hết cụm được.
 */

const HOST_ID = 'readup-selection-lookup';
const CARD_W = 330;

type Picked = { text: string; sentence: string; x: number; top: number; bottom: number };

export function SelectionLookup() {
  const pathname = usePathname();
  const blocked = isLookupBlocked(pathname);
  const [picked, setPicked] = useState<Picked | null>(null);
  const [open, setOpen] = useState(false);
  const { width: winW, height: winH } = useWindowDimensions();

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined' || blocked) return;
    const inside = (node: Node | null) => {
      const host = document.getElementById(HOST_ID);
      return !!(host && node && host.contains(node));
    };
    const onUp = (e: Event) => {
      if (inside(e.target as Node)) return;
      // Đợi trình duyệt chốt xong vùng bôi (Safari trả vùng cũ ngay trong mouseup).
      setTimeout(() => {
        const sel = window.getSelection();
        const text = sel && sel.rangeCount > 0 ? lookupable(sel.toString()) : null;
        const anchor = sel?.anchorNode ?? null;
        const el = anchor instanceof Element ? anchor : anchor?.parentElement;
        if (!text || !sel || !el || inside(anchor) || el.closest('input, textarea, [contenteditable="true"]')) {
          setPicked(null);
          setOpen(false);
          return;
        }
        const rect = sel.getRangeAt(0).getBoundingClientRect();
        if (!rect.width && !rect.height) return;
        const context = (el.closest('p, li, div')?.textContent ?? el.textContent ?? '').replace(/\s+/g, ' ').trim();
        setPicked({ text, sentence: context.slice(0, 300), x: rect.left + rect.width / 2, top: rect.top, bottom: rect.bottom });
        setOpen(false);
      }, 0);
    };
    const onDown = (e: Event) => {
      if (!inside(e.target as Node)) {
        setPicked(null);
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPicked(null);
        setOpen(false);
      }
    };
    const onScroll = () => setPicked((p) => (p ? null : p));
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchend', onUp);
    document.addEventListener('mousedown', onDown, true);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('touchend', onUp);
      document.removeEventListener('mousedown', onDown, true);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [blocked]);

  // Đổi màn là đóng.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setPicked(null);
    setOpen(false);
  }

  if (Platform.OS !== 'web' || blocked || !picked) return null;

  const quick = picked.text.includes(' ') ? null : offlineGloss(picked.text.toLowerCase()) ?? offlineGloss(lemmatize(picked.text));
  const chipLeft = Math.min(Math.max(8, picked.x - 110), winW - 228);
  const chipTop = Math.max(8, picked.top - 48);
  const below = picked.bottom + 10;
  const cardTop = below + 320 > winH ? Math.max(8, picked.top - 330) : below;
  const cardLeft = Math.min(Math.max(8, picked.x - CARD_W / 2), winW - CARD_W - 8);

  return (
    <View nativeID={HOST_ID} pointerEvents="box-none" style={{ position: 'fixed' as never, left: 0, top: 0, zIndex: 9999 }}>
      {open ? (
        <LookupCard picked={picked} left={cardLeft} top={cardTop} onClose={() => setPicked(null)} />
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Tra “${picked.text}”`}
          onPress={() => setOpen(true)}
          style={{
            position: 'fixed' as never,
            left: chipLeft,
            top: chipTop,
            width: 220,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            borderRadius: 14,
            paddingHorizontal: 12,
            paddingVertical: 8,
            backgroundColor: '#1E1B4B',
            ...({ boxShadow: '0 10px 28px rgba(15,23,42,0.28)' } as object),
          }}
        >
          <Icon name="search" size={15} color="#FBBF24" strokeWidth={2.4} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text numberOfLines={1} className="font-strong" style={{ fontSize: 13, color: '#FFFFFF' }}>
              {picked.text}
            </Text>
            {quick ? (
              <Text numberOfLines={1} className="font-sans" style={{ fontSize: 12, color: 'rgba(255,255,255,0.78)' }}>
                {quick.meaningVi}
              </Text>
            ) : null}
          </View>
          <Text className="font-strong" style={{ fontSize: 12, color: '#FBBF24' }}>
            Tra
          </Text>
        </Pressable>
      )}
    </View>
  );
}

function LookupCard({ picked, left, top, onClose }: { picked: Picked; left: number; top: number; onClose: () => void }) {
  // Từ có trong các bộ từ của app thì có sẵn đủ nghĩa — hiện ngay, không gọi mạng.
  const local = useMemo<WordLookup | null>(() => {
    const w = findDeckWord(picked.text);
    return w
      ? { word: w.word, lemma: w.word.toLowerCase(), phonetic: w.ipa || null, partOfSpeech: w.pos || null, definitionGeneral: w.definitionEn || null, definitionVi: w.meaningVi || null, definitionContext: null, examples: w.example ? [w.example] : [], audioUrl: null }
      : null;
  }, [picked.text]);
  const remote = useWordLookup(local ? null : picked.text, picked.sentence);
  const data = local ?? remote.data;
  const isLoading = !local && remote.isLoading;
  const isError = !local && remote.isError;
  const saveWord = useVocabStore((s) => s.saveWord);
  const entries = useVocabStore((s) => s.entries);
  const lemma = picked.text.includes(' ') ? picked.text.toLowerCase() : lemmatize(picked.text);
  const saved = useMemo(() => Object.values(entries).some((e) => e.lemma.toLowerCase() === lemma), [entries, lemma]);
  const scroll = useRef<ScrollView>(null);

  const save = () => {
    if (!data || saved) return;
    saveWord({
      word: data.word,
      lemma: data.lemma,
      phonetic: data.phonetic,
      partOfSpeech: data.partOfSpeech,
      definitionContext: data.definitionContext,
      definitionGeneral: data.definitionGeneral,
      definitionVi: data.definitionVi,
      exampleSentence: data.examples[0] ?? null,
      sourceSentence: picked.sentence || data.examples[0] || picked.text,
      articleId: null,
      articleTitle: 'Tra khi bôi đen',
      paragraphIndex: null,
      isCollocation: picked.text.includes(' '),
    });
  };

  return (
    <View
      style={{
        position: 'fixed' as never,
        left,
        top,
        width: CARD_W,
        maxHeight: 320,
        borderRadius: 18,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#F0EBE2',
        ...({ boxShadow: '0 18px 44px rgba(15,23,42,0.24)' } as object),
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingTop: 12 }}>
        <Text className="font-heavy" numberOfLines={2} style={{ flex: 1, fontSize: 18, color: '#0F172A' }}>
          {picked.text}
        </Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Nghe phát âm" onPress={() => speak(picked.text, { rate: 0.85 })} style={{ width: 32, height: 32, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FCF8F1' }}>
          <Icon name="volume" size={16} color={color.primary} />
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Đóng" onPress={onClose} style={{ width: 32, height: 32, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9F6F1' }}>
          <Icon name="close" size={15} color="#475569" />
        </Pressable>
      </View>
      <ScrollView ref={scroll} style={{ paddingHorizontal: 14 }} contentContainerStyle={{ paddingBottom: 12 }}>
        {data?.phonetic || data?.partOfSpeech ? (
          <Text className="font-sans" style={{ marginTop: 2, fontSize: 13, color: '#64748B' }}>
            {[data.partOfSpeech, data.phonetic].filter(Boolean).join(' · ')}
          </Text>
        ) : null}
        {isLoading ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 14 }}>
            <ActivityIndicator color={color.primary} />
            <Text className="font-sans" style={{ fontSize: 13, color: '#64748B' }}>
              Đang tra…
            </Text>
          </View>
        ) : null}
        {isError ? (
          <Text className="font-sans" style={{ marginTop: 8, fontSize: 13, color: '#B91C1C' }}>
            Không tra được. Kiểm tra mạng rồi thử lại.
          </Text>
        ) : null}
        {data ? (
          <View style={{ marginTop: 8, gap: 8 }}>
            {data.definitionVi ? <Line label="Nghĩa" value={data.definitionVi} strong /> : null}
            {data.definitionContext ? <Line label="Trong câu này" value={data.definitionContext} /> : null}
            {data.examples[0] ? <Line label="Ví dụ" value={data.examples[0]} italic /> : null}
          </View>
        ) : null}
        {data ? (
          <Pressable
            accessibilityRole="button"
            disabled={saved}
            onPress={save}
            style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 12, paddingVertical: 9, backgroundColor: saved ? '#DCFCE7' : color.primary }}
          >
            <Icon name={saved ? 'check' : 'bookmark'} size={15} color={saved ? '#15803D' : '#FFFFFF'} strokeWidth={2.2} />
            <Text className="font-strong" style={{ fontSize: 13, color: saved ? '#15803D' : '#FFFFFF' }}>
              {saved ? 'Đã có trong sổ từ' : 'Lưu vào sổ từ'}
            </Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
}

function Line({ label, value, strong, italic }: { label: string; value: string; strong?: boolean; italic?: boolean }) {
  return (
    <View>
      <Text className="font-strong" style={{ fontSize: 11, letterSpacing: 0.6, color: '#94A3B8' }}>
        {label.toUpperCase()}
      </Text>
      <Text className={strong ? 'font-strong' : 'font-sans'} style={{ fontSize: strong ? 15 : 13, lineHeight: strong ? 21 : 19, color: '#0F172A', fontStyle: italic ? 'italic' : 'normal' }}>
        {value}
      </Text>
    </View>
  );
}
