import { useCallback, useRef, useState } from 'react';

import { startRecorder, transcriptOf, type Recorder } from '@/services/speaking/recognizer';
import type { RecognizedSegment } from '@/services/speaking/metrics';

/**
 * Nghe một câu nói qua bộ nhận giọng của trình duyệt (cùng bộ với phòng thi Speaking).
 * `supported` là false khi trình duyệt không có bộ nhận giọng (ví dụ điện thoại không
 * phải Chrome) — khi đó màn hình phải báo thẳng, không để nút bấm chết.
 */
export function useListen() {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const [text, setText] = useState('');
  const [segments, setSegments] = useState<RecognizedSegment[]>([]);
  const [times, setTimes] = useState<number[]>([]);
  const rec = useRef<Recorder | null>(null);
  const startedAt = useRef(0);

  const start = useCallback(() => {
    setText('');
    setSegments([]);
    setTimes([]);
    const r = startRecorder({
      onUpdate: (s) => {
        setText(transcriptOf(s));
        setSegments(s.segments);
        setTimes(s.eventTimes);
      },
      onEnd: (_reason, s) => {
        setText(transcriptOf(s));
        setSegments(s.segments);
        setTimes(s.eventTimes);
        setListening(false);
        rec.current = null;
      },
    });
    if (!r) {
      setSupported(false);
      return;
    }
    rec.current = r;
    startedAt.current = Date.now();
    setListening(true);
  }, []);

  const stop = useCallback(() => rec.current?.stop(), []);

  /** Thời lượng từ lúc bắt đầu tới lúc gọi hàm này (ms). */
  const elapsed = useCallback(() => (startedAt.current ? Date.now() - startedAt.current : 0), []);

  return { listening, supported, text, segments, times, start, stop, elapsed };
}
