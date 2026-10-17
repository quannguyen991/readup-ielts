import React, { useState } from 'react';
import { Image, Linking, Platform, Pressable, Text, View } from 'react-native';

import { Icon } from '@/components/ui/Icon';
import { CLIP_CATEGORIES, clipVideo, type ClipCategory, type ClipWord, type EnglishClip } from '@/data/english-clips';
import { formatDuration, thumbnailUrl } from '@/data/video-library';
import { useL } from '@/i18n/useL';
import { useGameStore } from '@/store/useGameStore';
import { useVocabStore } from '@/store/useVocabStore';

/** Mỗi nhóm một màu riêng, chữ trắng đủ tương phản trên nền. */
const CATEGORY_COLOR: Record<ClipCategory, string> = {
  inspire: '#8F6E36',
  people: '#24375A',
  life: '#0F766E',
  words: '#C2410C',
};

/**
 * Một clip trong feed: trình phát, hai từ nên nhớ (lưu được vào sổ từ), và một câu hỏi.
 *
 * Câu hỏi chấm ngay và gửi đúng MỘT lần vào `useGameStore.answer`. Khoá `key` chặn
 * việc chạm lại đáp án để cộng thêm XP.
 */
export function ClipCard({
  clip,
  active,
  onActivate,
}: {
  clip: EnglishClip;
  /** Chỉ clip đang xem mới nạp trình phát; các clip khác hiện ảnh bìa. */
  active: boolean;
  onActivate: () => void;
}) {
  const { L, en } = useL();
  const video = clipVideo(clip);
  const entries = useVocabStore((s) => s.entries);
  const saveWord = useVocabStore((s) => s.saveWord);
  const [picked, setPicked] = useState<number | null>(null);

  if (!video) return null;

  const category = CLIP_CATEGORIES.find((c) => c.key === clip.category);
  const seconds = video.durationSeconds;
  const duration =
    seconds === null ? null : en ? (seconds < 60 ? 'under 1 min' : `${Math.round(seconds / 60)} min`) : formatDuration(seconds);
  const savedTerms = new Set(Object.values(entries).map((e) => e.lemma));
  const answered = picked !== null;
  const correct = picked === clip.quiz.answer;
  const rightAnswer = clip.quiz.options[clip.quiz.answer];
  const openUrl = `https://www.youtube.com/watch?v=${clip.videoId}`;

  const choose = (i: number) => {
    if (answered) return;
    setPicked(i);
    useGameStore.getState().answer(i === clip.quiz.answer, 'listen', { key: `clip:${clip.videoId}` });
  };

  const save = (w: ClipWord) => {
    saveWord({
      word: w.term,
      lemma: w.term.toLowerCase(),
      phonetic: w.ipa,
      partOfSpeech: null,
      definitionContext: null,
      definitionGeneral: null,
      definitionVi: w.meaningVi,
      exampleSentence: w.example,
      sourceSentence: w.example,
      articleId: null,
      articleTitle: `Clip tiếng Anh · ${video.title}`,
      paragraphIndex: null,
      isCollocation: w.term.includes(' '),
    });
  };

  return (
    <View className="mb-5 overflow-hidden rounded-card border border-border bg-surface">
      <ClipPlayer videoId={clip.videoId} title={video.title} active={active} onActivate={onActivate} />

      <View className="gap-3 p-4">
        <View className="flex-row flex-wrap items-center gap-2">
          <Pill label={category ? L(category.vi, category.en) : ''} bg={CATEGORY_COLOR[clip.category]} fg="#FFFFFF" />
          <Pill label={video.level} bg="#EFE3C8" fg="#7D5E27" />
          {duration ? <Text className="font-sans text-label text-subtle">{duration}</Text> : null}
        </View>

        <Text className="font-strong text-cardTitle text-ink">{video.title}</Text>
        <Text className="font-sans text-label text-subtle">{video.channel}</Text>
        <Text className="font-sans text-body text-muted">{clip.gistVi}</Text>

        <View className="h-px bg-border" />

        <Text className="font-semi uppercase tracking-wide text-subtle" style={{ fontSize: 13 }}>
          {L('Từ nên nhớ', 'Words to remember')}
        </Text>
        {clip.words.map((w) => {
          const saved = savedTerms.has(w.term.toLowerCase());
          return (
            <View key={w.term} className="flex-row items-start gap-3 rounded-panel border border-border bg-canvas p-3">
              <View className="min-w-0 flex-1 gap-0.5">
                <Text className="font-strong text-cardTitle text-ink">{w.term}</Text>
                <Text className="font-sans text-label text-subtle">{w.ipa}</Text>
                <Text className="font-sans text-body text-ink">{w.meaningVi}</Text>
                <Text className="font-sans text-body text-muted" style={{ fontStyle: 'italic' }}>
                  {w.example}
                </Text>
              </View>
              <Pressable
                onPress={() => save(w)}
                disabled={saved}
                accessibilityRole="button"
                accessibilityState={{ disabled: saved }}
                className={`flex-row items-center gap-1 rounded-pill border px-3 py-1.5 ${
                  saved ? 'border-border bg-surface' : 'border-primary bg-surface'
                }`}
              >
                <Icon name={saved ? 'check' : 'bookmark'} size={14} color={saved ? '#64748B' : '#8F6E36'} />
                <Text className={`font-semi text-label ${saved ? 'text-muted' : 'text-primary'}`}>
                  {saved ? L('Đã lưu', 'Saved') : L('Lưu', 'Save')}
                </Text>
              </Pressable>
            </View>
          );
        })}

        <View className="h-px bg-border" />

        <Text className="font-semi uppercase tracking-wide text-subtle" style={{ fontSize: 13 }}>
          {L('Câu hỏi nhanh', 'Quick question')}
        </Text>
        <Text className="font-strong text-body text-ink">{clip.quiz.question}</Text>
        <View className="gap-2">
          {clip.quiz.options.map((opt, i) => {
            const isAnswer = i === clip.quiz.answer;
            const isPicked = picked === i;
            const tone = !answered
              ? 'border-border bg-surface'
              : isAnswer
                ? 'border-success bg-success-soft'
                : isPicked
                  ? 'border-danger bg-danger-soft'
                  : 'border-border bg-surface';
            return (
              <Pressable
                key={opt}
                onPress={() => choose(i)}
                accessibilityRole="button"
                className={`rounded-panel border px-3.5 py-2.5 ${tone}`}
                style={{ opacity: answered && !isAnswer && !isPicked ? 0.55 : 1 }}
              >
                <Text className="font-sans text-body text-ink">{opt}</Text>
              </Pressable>
            );
          })}
        </View>
        {answered ? (
          <Text className={`font-strong text-body ${correct ? 'text-success-ink' : 'text-danger-ink'}`}>
            {correct
              ? L('Đúng rồi.', 'Correct.')
              : L(`Chưa đúng. Đáp án là “${rightAnswer}”.`, `Not quite. The answer is “${rightAnswer}”.`)}
          </Text>
        ) : null}

        <Pressable
          onPress={() => Linking.openURL(openUrl)}
          accessibilityRole="link"
          className="flex-row items-center gap-1.5 self-start"
        >
          <Text className="font-semi text-label text-primary">{L('Mở trên YouTube', 'Open on YouTube')}</Text>
          <Icon name="arrow-right" size={14} color="#8F6E36" />
        </Pressable>
      </View>
    </View>
  );
}

/**
 * Trình phát của một clip. Web: trình nhúng chính thức của YouTube, chỉ nạp khi clip
 * được chọn (một feed mà mỗi clip là một iframe thì nặng). Native: ảnh bìa, chạm để
 * mở video trên YouTube, vì app chưa có trình phát native.
 */
function ClipPlayer({
  videoId,
  title,
  active,
  onActivate,
}: {
  videoId: string;
  title: string;
  active: boolean;
  onActivate: () => void;
}) {
  const { L } = useL();
  const frame = { aspectRatio: 16 / 9, backgroundColor: '#0F172A' };

  if (active && Platform.OS === 'web') {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const src = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1&origin=${encodeURIComponent(origin)}`;
    return (
      <View style={frame}>
        {React.createElement('iframe', {
          src,
          title,
          allow: 'accelerometer; encrypted-media; picture-in-picture',
          allowFullScreen: true,
          style: { position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' },
        })}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={L('Phát video', 'Play video')}
      onPress={() => {
        if (Platform.OS === 'web') onActivate();
        else void Linking.openURL(`https://www.youtube.com/watch?v=${videoId}`);
      }}
      style={frame}
    >
      <Image
        source={{ uri: thumbnailUrl(videoId) }}
        resizeMode="cover"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(15,23,42,0.6)',
          }}
        >
          <Icon name="play" size={22} color="#FFFFFF" />
        </View>
      </View>
    </Pressable>
  );
}

function Pill({ label, bg, fg }: { label: string; bg: string; fg: string }) {
  return (
    <View style={{ borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, backgroundColor: bg }}>
      <Text className="font-strong" style={{ color: fg, fontSize: 13, lineHeight: 18 }}>
        {label}
      </Text>
    </View>
  );
}
