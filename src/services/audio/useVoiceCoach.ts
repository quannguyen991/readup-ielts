import { useCallback, useEffect, useRef, useState } from 'react';

import { useAudioPrefs } from '@/store/useAudioPrefs';
import { useGameStore } from '@/store/useGameStore';
import { planCoach, type CoachBand, type CoachInput, type CoachMemory, type CoachPlan } from './coach-core';
import { speakLines, stopPronounce } from './pronounce';
import { playSfx } from './sfx-ui';
import { speakWithAoede } from '@/services/speaking/voice';

/**
 * HUẤN LUYỆN VIÊN GIỌNG NÓI dùng chung cho mọi màn luyện nói có chấm điểm (kiểu ELSA).
 *
 * Sau mỗi lượt đọc, `feedback()` NÓI to lời nhận xét ngắn: khen, hoặc gọi tên từ
 * cần sửa + đọc mẫu chậm, rồi mời đọc lại. Lời nói do khuôn dựng sẵn (`coach-core`),
 * đọc bằng giọng máy chung (`pronounce.speakLines` → giọng Nữ/Nam đã chọn) — không
 * gọi mạng / AI nên ngoại tuyến vẫn chạy.
 *
 * KHÔNG ĐÈ LÊN MICRO: màn phải gọi `stop()` ngay trước khi bật micro (hook không
 * bao giờ tự bật micro, kể cả sau khi nói "Try again"). `stop()` cũng huỷ lời đang
 * chờ nói.
 *
 * Tôn trọng: công tắc "Huấn luyện viên giọng nói" (mặc định bật) và nút tắt tiếng chung.
 * Khi game học đang bật, tiếng "trúng đòn" của game đã là tiếng báo điểm; chỉ khi game
 * tắt mới thêm tiếng báo mức điểm riêng.
 */

/** Nhớ câu vừa dùng của cả phiên để không lặp (dùng chung mọi màn). */
const memory: CoachMemory = {};

/** Chờ tiếng báo điểm kêu xong rồi mới nói. */
const LEAD_IN_MS = 550;

/** Lời nhận xét do AI soạn: chú thích ngắn hai ngôn ngữ, và câu tiếng Anh huấn luyện viên đọc to. */
export type TipCaption = { band: CoachBand; captionVi: string; captionEn: string; say: string };

export type VoiceCoach = {
  /** Công tắc đang bật (đã tính cả tắt tiếng chung). */
  active: boolean;
  /** Đang nói — dùng để hiện sóng âm. */
  speaking: boolean;
  /** Dòng chú thích ngắn trên màn (null = chưa có lượt nào). */
  caption: { vi: string; en: string } | null;
  band: CoachPlan['band'] | null;
  feedback: (input: CoachInput) => CoachPlan;
  /**
   * Thay lời nhận xét khuôn bằng lời của AI: hiện chú thích rồi NÓI `say` bằng giọng Aoede.
   * Không lấy được Aoede (chưa đăng nhập, hết lượt giọng) thì đọc bằng giọng máy để vẫn nghe được.
   */
  showTip: (tip: TipCaption) => void;
  /** Im ngay lập tức và huỷ lời đang chờ. Gọi TRƯỚC khi bật micro hoặc đổi câu. */
  stop: () => void;
  /** Xoá chú thích (đổi câu). */
  reset: () => void;
};

export function useVoiceCoach(): VoiceCoach {
  const coachOn = useAudioPrefs((s) => s.coach);
  const sound = useGameStore((s) => s.sound);
  const active = coachOn && sound;
  const [speaking, setSpeaking] = useState(false);
  const [caption, setCaption] = useState<VoiceCoach['caption']>(null);
  const [band, setBand] = useState<VoiceCoach['band']>(null);
  const stopRef = useRef<(() => void) | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const turn = useRef(0);

  const stop = useCallback(() => {
    turn.current += 1;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    const was = stopRef.current;
    stopRef.current = null;
    if (was) was();
    else stopPronounce();
    setSpeaking(false);
  }, []);

  const reset = useCallback(() => {
    stop();
    setCaption(null);
    setBand(null);
  }, [stop]);

  useEffect(
    () => () => {
      turn.current += 1;
      if (timerRef.current) clearTimeout(timerRef.current);
      stopRef.current?.();
    },
    [],
  );

  const feedback = useCallback(
    (input: CoachInput): CoachPlan => {
      const plan = planCoach(input, memory);
      setBand(plan.band);
      setCaption({ vi: plan.captionVi, en: plan.captionEn });
      if (!useGameStore.getState().enabled) playSfx(plan.band === 'good' ? 'perfect' : plan.band === 'ok' ? 'good' : 'retry');
      if (!active) return plan;
      turn.current += 1;
      const mine = turn.current;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        if (mine !== turn.current) return;
        setSpeaking(true);
        stopRef.current = speakLines(plan.lines, {
          onEnd: () => {
            if (mine !== turn.current) return;
            stopRef.current = null;
            setSpeaking(false);
          },
        });
      }, LEAD_IN_MS);
      return plan;
    },
    [active],
  );

  const showTip = useCallback(
    (tip: TipCaption) => {
      // Lời khuôn đang nói (nếu còn) phải im trước, để hai giọng không chồng lên nhau.
      stop();
      setBand(tip.band);
      setCaption({ vi: tip.captionVi, en: tip.captionEn });
      if (!active) return;
      const mine = turn.current;
      setSpeaking(true);
      const finish = () => {
        if (mine !== turn.current) return;
        stopRef.current = null;
        setSpeaking(false);
      };
      const deviceVoice = () => {
        if (mine !== turn.current) return;
        stopRef.current = speakLines([{ text: tip.say, rate: 0.9 }], { onEnd: finish });
      };
      stopRef.current = speakWithAoede(tip.say, { onDone: finish, onError: deviceVoice });
    },
    [active, stop],
  );

  return { active, speaking, caption, band, feedback, showTip, stop, reset };
}
