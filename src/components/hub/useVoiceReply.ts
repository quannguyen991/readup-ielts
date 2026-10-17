import { useEffect, useRef, useState } from 'react';

import { type Recorder, startRecorder, transcriptOf } from '@/services/speaking/recognizer';
import { matchChoice } from '@/services/hub/voice-match';

/**
 * Trả lời bằng giọng nói cho các màn nhập vai và gọi điện. Bấm micro, nói câu trả lời; máy
 * nghe xong thì ghép với phương án gần nhất. Không khớp thì báo để người học chạm chọn.
 */
export function useVoiceReply(options: { text: string }[] | null, onPick: (index: number) => void) {
  const [listening, setListening] = useState(false);
  const [live, setLive] = useState('');
  const [note, setNote] = useState<string | null>(null);
  const recorder = useRef<Recorder | null>(null);
  const optionsRef = useRef(options);
  const onPickRef = useRef(onPick);
  optionsRef.current = options;
  onPickRef.current = onPick;

  useEffect(() => () => recorder.current?.stop(), []);

  const start = () => {
    if (!options || recorder.current) return;
    const rec = startRecorder({
      onUpdate: (s) => setLive(transcriptOf(s)),
      onEnd: (_reason, s) => {
        recorder.current = null;
        setListening(false);
        setLive('');
        const said = transcriptOf(s);
        if (!said) {
          setNote('Chưa nghe thấy gì. Bấm micro rồi nói lại, hoặc chạm để chọn.');
          return;
        }
        const list = optionsRef.current ?? [];
        const hit = matchChoice(said, list);
        if (hit) {
          setNote(null);
          onPickRef.current(hit.index);
        } else {
          setNote(`Nghe được: "${said}". Chưa khớp phương án nào, hãy chạm để chọn.`);
        }
      },
    });
    if (!rec) {
      setNote('Trình duyệt này không nghe được. Dùng Chrome hoặc Edge, hoặc chạm để chọn.');
      return;
    }
    recorder.current = rec;
    setNote(null);
    setListening(true);
  };

  const stop = () => recorder.current?.stop();

  return { listening, live, note, start, stop, supported: typeof window !== 'undefined' };
}
