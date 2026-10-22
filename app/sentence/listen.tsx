import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Linking, Platform, Pressable, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { TaskShell } from '@/components/layout/TaskShell';
import { ListeningQuiz } from '@/components/sentence/ListeningQuiz';
import { Badge, Button, Card, Icon } from '@/components/ui';
import { AUDIO_NGUON, estimateMinutes, formatLength, getLibraryAudio } from '@/data/audio-library';
import { estimateSentences, getAudioTranscript } from '@/data/audio-repository';
import { paper } from '@/theme/tokens';
import { SealIcon } from '@/components/illust/HeroArt';
import { Label, Sticker } from '@/components/illust/Sticker';
import { Badge as BadgeSticker } from '@/components/illust/Cute';
import { CuteHeadphones, Motion } from '@/components/illust/CuteMore';
import { useL } from '@/i18n/useL';

/**
 * Nghe hiểu trên thư viện âm thanh — KHÔNG phải dán gì cả.
 *
 * Khác thư viện video ở đúng một chỗ, và đó là cả lý do màn này tồn tại: lời
 * đọc đã có sẵn trong app vì nguồn VOA Learning English thuộc phạm vi công
 * cộng. Người học bấm vào là làm được ngay.
 *
 * CHỈ MỞ PHẦN NGHE HIỂU, không mở chép chính tả. VOA công bố toàn văn nhưng
 * không công bố mốc thời gian từng câu, nên mốc ở đây là ước lượng theo số từ.
 * Ước lượng đủ tốt để bấm vào dẫn chứng rồi tua tới gần đúng chỗ, nhưng lệch
 * vài giây — mà chép chính tả thì lệch vài giây là nghe phải nửa câu trước, và
 * người học sẽ nghĩ app hỏng chứ không nghĩ là mốc lệch. Chép chính tả vẫn nằm
 * ở thư viện video, nơi phụ đề có mốc thật.
 */
export default function ListenScreen() {
  const { L } = useL();
  const { a } = useLocalSearchParams<{ a?: string }>();
  const id = typeof a === 'string' ? a : '';
  const meta = useMemo(() => (id ? getLibraryAudio(id) : undefined), [id]);
  const transcript = useMemo(
    () => (meta ? getAudioTranscript({ id: meta.id, chunk: meta.chunk }) : null),
    [meta],
  );

  const audioRef = useRef<HTMLAudioElement | null>(null);
  /**
   * Thời lượng THẬT, đọc từ chính tệp MP3.
   *
   * Bắt đầu bằng 0 chứ không đoán trước từ số từ: mốc câu tính từ thời lượng,
   * và mốc tính bằng số đoán sẽ lệch ngay từ câu đầu rồi không bao giờ sửa lại.
   * Chưa biết thì mọi mốc bằng 0 — bấm dẫn chứng chỉ tua về đầu, không sai chỗ.
   */
  const [duration, setDuration] = useState(0);

  const sentences = useMemo(
    () => (transcript ? estimateSentences(transcript.paragraphs, duration) : []),
    [transcript, duration],
  );

  const seek = useCallback((giay: number) => {
    const el = audioRef.current;
    if (!el || !Number.isFinite(giay)) return;
    el.currentTime = Math.max(0, giay - 0.3);
    void el.play?.();
  }, []);

  if (!meta || !transcript) {
    return (
      <TaskShell
        backHref="/sentence/audio"
        backLabel={L('Quay lại Thư viện nghe', 'Back to Listening library')}
        title={L('Không mở được bài này', "Couldn't open this track")}
        subtitle="Listening"
        icon="play"
        tone="paper"
      >
        <Card>
          <View aria-hidden className="mb-3">
            <Motion kind="wobble">
              <Sticker tilt={-6}>
                <CuteHeadphones size={60} />
              </Sticker>
            </Motion>
          </View>
          <Text className="font-sans text-body text-muted">
            {L(
              'Bài nghe không còn trong thư viện, hoặc phần lời đọc chưa tải được. Quay lại thư viện và chọn bài khác.',
              "This track is no longer in the library, or its transcript didn't load. Go back and pick another one.",
            )}
          </Text>
        </Card>
      </TaskShell>
    );
  }

  return (
    <TaskShell
      backHref="/sentence/audio"
      backLabel={L('Quay lại Thư viện nghe', 'Back to Listening library')}
      title={meta.title}
      subtitle={meta.program}
      icon="play"
      tone="paper"
      right={
        <View className="flex-row items-center gap-2">
          <Badge label={meta.level} tone="neutral" />
          <Badge label={L(formatLength(meta.words), `~${estimateMinutes(meta.words)} min`)} tone="neutral" />
        </View>
      }
    >
      <View aria-hidden className="mb-3 flex-row items-center gap-3">
        <Motion kind="float">
          <Sticker tilt={-6}>
            <CuteHeadphones size={48} />
          </Sticker>
        </Motion>
        <Label text={L('Nghe hết rồi trả lời 🎧', 'Listen through, then answer 🎧')} color="#6A4BD9" ink="#FFFFFF" tilt={-4} size={12} />
      </View>

      <AudioPlayer
        src={meta.audioUrl}
        sourceUrl={meta.sourceUrl}
        onDuration={setDuration}
        elementRef={audioRef}
      />

      <View className="mt-3 flex-row items-start gap-2.5 rounded-panel border border-border bg-surface p-3.5">
        <View aria-hidden>
          <BadgeSticker icon="question" color="#F2B632" size={26} />
        </View>
        <Text className="min-w-0 flex-1 font-sans text-label text-muted" style={{ lineHeight: 20 }}>
          {L('Nghe hết bài rồi trả lời. Khi chọn đáp án, app hỏi thêm', 'Listen to the whole track, then answer. When you pick an answer, the app also asks')}{' '}
          <Text className="font-strong">{L('bạn nghe thấy đáp án ở đoạn nào', 'where you heard it')}</Text>
          {L(' — đó mới là chỗ phân biệt nghe hiểu với đoán trúng. Chấm bài xong, bấm vào', ' — that is what separates understanding from a lucky guess. After grading, tap the')}{' '}
          <Text className="font-strong">{L('câu dẫn chứng', 'evidence sentence')}</Text>
          {L(' để nghe lại đúng chỗ đó; mốc tua là', ' to replay that exact spot; seek points are')}{' '}
          <Text className="font-strong">{L('ước lượng theo số từ', 'estimated from word counts')}</Text>
          {L(' nên có thể lệch vài giây.', ', so they may be off by a few seconds.')}
        </Text>
      </View>

      {sentences.length > 0 ? (
        <View className="mt-4">
          <ListeningQuiz videoId={meta.id} sentences={sentences} onSeek={seek} />
        </View>
      ) : (
        <Card className="mt-4">
          <Text className="font-sans text-body text-muted">{L('Chưa đọc được lời của bài này.', "Couldn't read this track's transcript.")}</Text>
        </Card>
      )}

      {transcript.glossary.length > 0 ? (
        <Card className="mt-5">
          <View className="flex-row items-center gap-2.5">
            <View aria-hidden>
              <SealIcon name="book" color="#22A06B" size={36} />
            </View>
            <Text className="min-w-0 flex-1 font-strong text-cardTitle text-ink">Words in This Story</Text>
          </View>
          <Text className="mt-1 font-sans text-label text-muted">
            {L('Chú giải do chính ban biên tập VOA soạn kèm bài, không phải app tự sinh.', 'Glossary written by the VOA editors with the story — not generated by the app.')}
          </Text>
          <View className="mt-3 gap-2">
            {transcript.glossary.map((g) => (
              <View key={g.term} className="flex-row flex-wrap gap-1.5">
                <Text className="font-strong text-body text-ink">{g.term}</Text>
                <Text className="min-w-0 flex-1 font-sans text-body text-muted">{g.definition}</Text>
              </View>
            ))}
          </View>
        </Card>
      ) : null}

      <NguonBai sourceUrl={meta.sourceUrl} publishedAt={meta.publishedAt} />
    </TaskShell>
  );
}

/**
 * Trình phát.
 *
 * Dùng thẻ `<audio>` gốc của trình duyệt thay vì dựng nút bấm riêng: nó có sẵn
 * thanh tua, chỉnh tốc độ và phím tắt của hệ điều hành, và người học nghe lại
 * một đoạn rất nhiều lần nên thanh tua là thứ họ cần nhất.
 *
 * Trên máy không phải web thì chưa dựng được (cần `expo-audio`, chưa cài) — mở
 * thẳng trang gốc của VOA để vẫn nghe được, thay vì để một ô trống.
 */
function AudioPlayer({
  src,
  sourceUrl,
  onDuration,
  elementRef,
}: {
  src: string;
  sourceUrl: string;
  onDuration: (giay: number) => void;
  elementRef: React.MutableRefObject<HTMLAudioElement | null>;
}) {
  const { L } = useL();
  useEffect(() => {
    // Đổi bài thì thời lượng cũ phải bỏ đi ngay, không thì mốc câu của bài mới
    // được tính bằng thời lượng của bài trước.
    onDuration(0);
  }, [src, onDuration]);

  if (Platform.OS !== 'web') {
    return (
      <Card>
        <View className="items-center py-4">
          <Icon name="play" size={24} color={paper.muted} />
          <Text className="mt-2 text-center font-sans text-body text-muted">
            {L('Trình phát trong app hiện chỉ chạy trên bản web.', 'The in-app player only works on the web for now.')}
          </Text>
          <Button
            className="mt-3"
            variant="brandOutline"
            size="sm"
            label={L('Mở bài trên trang VOA', 'Open on the VOA site')}
            onPress={() => void Linking.openURL(sourceUrl)}
          />
        </View>
      </Card>
    );
  }

  return React.createElement('audio', {
    ref: elementRef,
    src,
    controls: true,
    preload: 'metadata',
    style: { width: '100%', display: 'block' },
    onLoadedMetadata: (e: { currentTarget: HTMLAudioElement }) => {
      const d = e.currentTarget.duration;
      // MP3 phát trực tuyến có lúc báo Infinity cho tới khi tải xong phần đầu.
      onDuration(Number.isFinite(d) ? d : 0);
    },
  });
}

/** Ghi nguồn — bắt buộc theo điều khoản dùng lại của VOA. */
function NguonBai({ sourceUrl, publishedAt }: { sourceUrl: string; publishedAt: string | null }) {
  const { L } = useL();
  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => void Linking.openURL(sourceUrl)}
      className="mt-5 rounded-panel border border-border bg-surface p-3.5"
    >
      <Text className="font-semi uppercase tracking-wide text-subtle" style={{ fontSize: 12 }}>
        {L('Nguồn', 'Source')}
      </Text>
      <Text className="mt-1 font-sans text-label text-muted" style={{ lineHeight: 19 }}>
        {AUDIO_NGUON.ten} — {AUDIO_NGUON.trang}
        {publishedAt ? L(` · đăng ${publishedAt}`, ` · published ${publishedAt}`) : ''}
        {'\n'}
        {L(`${AUDIO_NGUON.giay_phep}. Bấm để mở bài gốc.`, 'Public domain (a work of the US federal government). Tap to open the original.')}
      </Text>
    </Pressable>
  );
}
