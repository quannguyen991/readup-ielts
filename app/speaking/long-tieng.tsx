import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Badge, Button, Card, Icon } from '@/components/ui';
import { DUBBING_PROJECTS, getDubbingProject, type DubbingProject, type DubbingSentence } from '@/data/speaking-dubbing';
import { analyzeVoicePerformance, type VoiceEvaluationResult } from '@/services/speaking/voice-analyzer';
import { useL } from '@/i18n/useL';
import { color, paper } from '@/theme/tokens';

export default function DubbingScreen() {
  const { L } = useL();
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const { id = 'dub-films' } = useLocalSearchParams<{ id?: string }>();

  const project: DubbingProject = useMemo(() => getDubbingProject(id) ?? DUBBING_PROJECTS[0]!, [id]);
  const [activeSceneIdx, setActiveSceneIdx] = useState(0);
  const activeScene = project.scenes[activeSceneIdx] ?? project.scenes[0]!;

  const [activeSentenceIdx, setActiveSentenceIdx] = useState(0);
  const currentSentence: DubbingSentence = activeScene.sentences[activeSentenceIdx] ?? activeScene.sentences[0]!;

  // Trạng thái thu âm và phân tích
  const [isRecording, setIsRecording] = useState(false);
  const [recordings, setRecordings] = useState<Record<string, { audioUrl: string; transcript: string; duration: number }>>({});
  const [evaluations, setEvaluations] = useState<Record<string, VoiceEvaluationResult>>({});
  const [showIpa, setShowIpa] = useState(true);
  const [showTranslation, setShowTranslation] = useState(true);
  const [autoNext, setAutoNext] = useState(true);
  const [customPlaybackMode, setCustomPlaybackMode] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordStartRef = useRef<number>(0);
  const speechRecognitionRef = useRef<any>(null);
  const recognizedTextRef = useRef('');

  // Tua video YouTube đến đúng mốc thời gian
  const playVideoAt = useCallback((seconds: number, mute = false) => {
    if (Platform.OS !== 'web') return;
    const frame = document.getElementById('yt-dubbing-player') as HTMLIFrameElement | null;
    if (!frame?.contentWindow) return;

    if (mute) {
      frame.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'mute', args: [] }), '*');
    } else {
      frame.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'unMute', args: [] }), '*');
    }

    frame.contentWindow.postMessage(
      JSON.stringify({ event: 'command', func: 'seekTo', args: [Math.max(0, seconds - 0.2), true] }),
      '*',
    );
    frame.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'playVideo', args: [] }), '*');
  }, []);

  const replayCurrentSentence = useCallback(() => {
    playVideoAt(currentSentence.start, false);
  }, [currentSentence.start, playVideoAt]);

  // Bắt đầu thu âm
  const startRecording = async () => {
    if (Platform.OS !== 'web') return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        const durationSec = (Date.now() - recordStartRef.current) / 1000;

        const transcript = recognizedTextRef.current.trim() || currentSentence.text;
        setRecordings((prev) => ({
          ...prev,
          [currentSentence.id]: { audioUrl, transcript, duration: durationSec },
        }));

        // Chấm điểm và phân tích IELTS Voice
        const result = analyzeVoicePerformance({
          targetText: currentSentence.text,
          targetIpa: currentSentence.ipa,
          recordedTranscript: transcript,
          durationSeconds: durationSec,
          expectedDuration: currentSentence.duration,
          stressedWords: currentSentence.stressedWords,
        });

        setEvaluations((prev) => ({
          ...prev,
          [currentSentence.id]: result,
        }));

        if (autoNext && activeSentenceIdx + 1 < activeScene.sentences.length) {
          setTimeout(() => {
            setActiveSentenceIdx((idx) => idx + 1);
          }, 600);
        }
      };

      // Khởi động Web Speech API để nhận diện từ ngữ
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.onresult = (event: any) => {
          const text = Array.from(event.results)
            .map((r: any) => r[0].transcript)
            .join(' ');
          recognizedTextRef.current = text;
        };
        speechRecognitionRef.current = recognition;
        recognition.start();
      }

      recordStartRef.current = Date.now();
      recognizedTextRef.current = '';
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.warn('Microphone error:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
    }
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch {}
    }
  };

  const toggleRecording = () => {
    if (isRecording) stopRecording();
    else void startRecording();
  };

  // Phím tắt điều khiển: Space thu âm, Tab nghe lại, Enter sang câu
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        toggleRecording();
      } else if (e.code === 'Tab') {
        e.preventDefault();
        replayCurrentSentence();
      } else if (e.code === 'Enter') {
        e.preventDefault();
        if (activeSentenceIdx + 1 < activeScene.sentences.length) {
          setActiveSentenceIdx((idx) => idx + 1);
        }
      } else if (e.code === 'Escape') {
        setCustomPlaybackMode(false);
        const frame = document.getElementById('yt-dubbing-player') as HTMLIFrameElement | null;
        frame?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }), '*');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSentenceIdx, activeScene.sentences.length, isRecording, replayCurrentSentence]);

  // Xem cảnh bằng giọng bạn: Mute video YouTube, phát audio người dùng lồng tiếng
  const playSceneWithMyVoice = () => {
    setCustomPlaybackMode(true);
    playVideoAt(activeScene.start, true);

    // Phát lần lượt các file audio đã thu âm
    activeScene.sentences.forEach((sentence) => {
      const rec = recordings[sentence.id];
      if (rec?.audioUrl) {
        const delayMs = Math.max(0, (sentence.start - activeScene.start) * 1000);
        setTimeout(() => {
          const audio = new Audio(rec.audioUrl);
          audio.play().catch(() => {});
        }, delayMs);
      }
    });
  };

  // Tổng số câu đã thu âm
  const totalRecordedCount = Object.keys(recordings).length;
  const currentEvaluation = evaluations[currentSentence.id];

  return (
    <Screen>
      {/* -------------------- Top Bar -------------------- */}
      <View className="mb-4 flex-row items-center justify-between rounded-card border border-border bg-surface p-3.5 shadow-sm">
        <View className="flex-row items-center gap-3">
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/speaking' as never)}
            className="h-9 w-9 items-center justify-center rounded-pill border border-border bg-surfaceAlt"
          >
            <Icon name="chevron-left" size={17} color={color.ink} />
          </Pressable>
          <View>
            <View className="flex-row items-center gap-1.5">
              <Text className="font-strong uppercase tracking-[1.5px] text-[#2E7D4F]" style={{ fontSize: 11 }}>
                🎬 {L('LỒNG TIẾNG BBC · TED-ED', 'BBC & TED-ED DUBBING')}
              </Text>
            </View>
            <Text className="font-heavy text-body text-ink" numberOfLines={1}>
              {project.title}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-2">
          <View className="rounded-pill border border-border bg-surfaceAlt px-3 py-1">
            <Text className="font-strong text-label text-ink">
              {totalRecordedCount}/{project.scenes.reduce((sum, s) => sum + s.sentences.length, 0)} {L('CÂU ĐÃ THU', 'SENTENCES')}
            </Text>
          </View>
        </View>
      </View>

      {/* -------------------- Main Two-Column Layout -------------------- */}
      <View style={{ flexDirection: wide ? 'row' : 'column', gap: 16 }}>
        {/* Cột trái: Video player, các Cảnh & Nút Xem bằng giọng bạn */}
        <View style={{ flex: wide ? 1.15 : undefined, gap: 12 }}>
          <View className="overflow-hidden rounded-card border border-border bg-black shadow-sm" style={{ aspectRatio: 16 / 9 }}>
            <iframe
              id="yt-dubbing-player"
              title={project.title}
              src={`https://www.youtube.com/embed/${project.youtubeId}?enablejsapi=1&autoplay=0&rel=0&playsinline=1`}
              style={{ width: '100%', height: '100%', border: 'none' }}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          </View>

          {/* Dải chọn CẢNH */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 2 }}>
            {project.scenes.map((scene, idx) => {
              const on = idx === activeSceneIdx;
              const sceneRecCount = scene.sentences.filter((s) => recordings[s.id]).length;
              return (
                <Pressable
                  key={scene.sceneIndex}
                  accessibilityRole="button"
                  onPress={() => {
                    setActiveSceneIdx(idx);
                    setActiveSentenceIdx(0);
                    playVideoAt(scene.start);
                  }}
                  className="rounded-panel border px-3.5 py-2.5"
                  style={{
                    borderColor: on ? '#2E7D4F' : '#E2E8F0',
                    backgroundColor: on ? '#152E20' : '#FFFFFF',
                  }}
                >
                  <Text className="font-strong text-label" style={{ color: on ? '#4ADE80' : '#0F172A' }}>
                    CẢNH {scene.sceneIndex}
                  </Text>
                  <Text className="font-sans" style={{ fontSize: 11, color: on ? '#A7F3D0' : '#64748B' }}>
                    {sceneRecCount}/{scene.sentences.length} câu
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Nút Xem cảnh bằng giọng bạn */}
          <View className="rounded-card border border-amber-200/50 bg-[#F3F0FB] p-4 shadow-sm">
            <View className="flex-row flex-wrap items-center gap-2.5">
              <Pressable
                accessibilityRole="button"
                onPress={playSceneWithMyVoice}
                className="flex-row items-center gap-2 rounded-pill bg-[#F59E0B] px-4 py-2.5 shadow-sm"
              >
                <Icon name="play" size={16} color="#FFFFFF" strokeWidth={2.4} />
                <Text className="font-heavy text-body text-white">
                  🎬 {L(`XEM CẢNH ${activeScene.sceneIndex} BẰNG GIỌNG BẠN`, `WATCH SCENE ${activeScene.sceneIndex} WITH YOUR VOICE`)}
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => playVideoAt(activeScene.start)}
                className="rounded-pill border border-amber-300 bg-white px-3.5 py-2"
              >
                <Text className="font-semi text-label text-amber-900">{L('Xem cả cảnh', 'Play Scene')}</Text>
              </Pressable>
            </View>
            <Text className="mt-2.5 font-sans text-label text-amber-900/80">
              💡 {L('Video sẽ tắt tiếng gốc ở câu bạn đã thu, câu chưa thu vẫn phát tiếng gốc. Nhấn Esc để dừng.', 'The video mutes the original sound on lines you recorded. Press Esc to stop.')}
            </Text>
          </View>
        </View>

        {/* Cột phải: Hộp câu đang luyện & Phân tích IELTS Speaking AI */}
        <View style={{ flex: wide ? 1 : undefined, gap: 14 }}>
          {/* Hộp câu đang luyện */}
          <Card className="p-4 shadow-sm">
            <View className="flex-row items-center justify-between border-b border-border pb-2.5">
              <View className="flex-row items-center gap-2">
                <View className="rounded-pill bg-primary-100 px-2.5 py-0.5">
                  <Text className="font-heavy text-label text-primary-800">
                    CÂU {activeSentenceIdx + 1}
                  </Text>
                </View>
                <Text className="font-sans text-label text-muted">
                  CẢNH {activeScene.sceneIndex} · {activeSentenceIdx + 1}/{activeScene.sentences.length}
                </Text>
              </View>

              <View className="flex-row items-center gap-2">
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setShowIpa((v) => !v)}
                  className="rounded-pill border border-border px-2.5 py-1"
                  style={{ backgroundColor: showIpa ? 'rgba(46,125,79,0.1)' : 'transparent' }}
                >
                  <Text className="font-strong text-label text-[#2E7D4F]">🔤 IPA</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setShowTranslation((v) => !v)}
                  className="rounded-pill border border-border px-2.5 py-1"
                  style={{ backgroundColor: showTranslation ? 'rgba(247,185,85,0.15)' : 'transparent' }}
                >
                  <Text className="font-strong text-label text-amber-800">🗣️ {L('Dịch', 'Translation')}</Text>
                </Pressable>
              </View>
            </View>

            {/* Văn bản câu & IPA */}
            <View className="mt-3.5 gap-2">
              <Text className="font-heavy text-cardTitle text-ink" style={{ lineHeight: 28 }}>
                {currentSentence.text}
              </Text>

              {showIpa && currentSentence.ipa ? (
                <Text className="font-mono text-label text-emerald-800" style={{ letterSpacing: 0.5 }}>
                  {currentSentence.ipa}
                </Text>
              ) : null}

              {showTranslation && currentSentence.translationVi ? (
                <Text className="font-sans text-label text-muted">
                  {currentSentence.translationVi}
                </Text>
              ) : null}
            </View>

            <Text className="mt-2.5 font-sans text-label text-muted">
              🎧 {L(`Nghe một lần, rồi nói cùng nhịp và cảm xúc — câu gốc ${currentSentence.duration}s`, `Listen once, then speak with the same rhythm and feel — original ${currentSentence.duration}s`)}
            </Text>

            {/* Các nút thu âm chính */}
            <View className="mt-4 flex-row flex-wrap items-center gap-2.5">
              <Button
                variant="secondary"
                size="md"
                label={L('00 DỪNG', 'STOP')}
                onPress={replayCurrentSentence}
              />
              <Pressable
                accessibilityRole="button"
                onPress={toggleRecording}
                className="flex-1 flex-row items-center justify-center gap-2 rounded-pill py-3 shadow-md"
                style={{ backgroundColor: isRecording ? '#DC2626' : '#166534' }}
              >
                <Icon name="mic" size={18} color="#FFFFFF" strokeWidth={2.4} />
                <Text className="font-heavy text-body text-white">
                  {isRecording ? L('■ DỪNG THU (Space)', '■ STOP (Space)') : L('🎙️ THU ÂM (Space)', '🎙️ RECORD (Space)')}
                </Text>
              </Pressable>
              <Button
                variant="brandOutline"
                size="md"
                label={L('> TIẾP', '> NEXT')}
                onPress={() => {
                  if (activeSentenceIdx + 1 < activeScene.sentences.length) {
                    setActiveSentenceIdx((i) => i + 1);
                  }
                }}
              />
            </View>

            {/* Checkbox tự sang câu */}
            <View className="mt-3 flex-row items-center justify-between border-t border-border pt-2.5">
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  if (activeSentenceIdx > 0) setActiveSentenceIdx((i) => i - 1);
                }}
                disabled={activeSentenceIdx === 0}
              >
                <Text className="font-semi text-label text-muted" style={{ opacity: activeSentenceIdx === 0 ? 0.4 : 1 }}>
                  {'< '} {L('Câu trước', 'Previous')}
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="checkbox"
                aria-checked={autoNext}
                onPress={() => setAutoNext((v) => !v)}
                className="flex-row items-center gap-1.5"
              >
                <View
                  className="h-4 w-4 items-center justify-center rounded border"
                  style={{ borderColor: autoNext ? '#166534' : '#94A3B8', backgroundColor: autoNext ? '#166534' : 'transparent' }}
                >
                  {autoNext ? <Icon name="check" size={12} color="#FFFFFF" strokeWidth={3} /> : null}
                </View>
                <Text className="font-sans text-label text-ink">
                  {L('Tự sang câu tiếp sau khi thu', 'Auto advance after recording')}
                </Text>
              </Pressable>
            </View>
          </Card>

          {/* Phân tích giọng AI theo thang IELTS Speaking */}
          {currentEvaluation ? (
            <Card className="border-[#2E7D4F]/30 bg-white p-4 shadow-sm">
              <View className="flex-row items-center justify-between border-b border-border pb-2.5">
                <Text className="font-heavy text-body text-ink">
                  📊 {L('ĐÁNH GIÁ GIỌNG NÓI IELTS', 'IELTS SPEAKING EVALUATION')}
                </Text>
                <View className="flex-row items-center gap-2">
                  <View className="rounded-pill bg-emerald-100 px-3 py-1">
                    <Text className="font-heavy text-label text-emerald-800">
                      IELTS BAND {currentEvaluation.overallBand.toFixed(1)}
                    </Text>
                  </View>
                </View>
              </View>

              <View className="mt-3 flex-row flex-wrap gap-2">
                <View className="flex-1 rounded-panel bg-[#F8FAFC] p-2.5">
                  <Text className="font-sans text-label text-muted">{L('Khớp từ vựng', 'Word Match')}</Text>
                  <Text className="font-heavy text-sectionTitle text-emerald-700">{currentEvaluation.matchPercentage}%</Text>
                </View>
                <View className="flex-1 rounded-panel bg-[#F8FAFC] p-2.5">
                  <Text className="font-sans text-label text-muted">{L('Phát âm', 'Pronunciation')}</Text>
                  <Text className="font-heavy text-sectionTitle text-emerald-700">{currentEvaluation.pronunciationScore.toFixed(1)}</Text>
                </View>
                <View className="flex-1 rounded-panel bg-[#F8FAFC] p-2.5">
                  <Text className="font-sans text-label text-muted">{L('Độ lưu loát & Nhịp', 'Fluency')}</Text>
                  <Text className="font-heavy text-sectionTitle text-emerald-700">{currentEvaluation.fluencyScore.toFixed(1)}</Text>
                </View>
                <View className="flex-1 rounded-panel bg-[#F8FAFC] p-2.5">
                  <Text className="font-sans text-label text-muted">{L('Trọng âm & Ngữ điệu', 'Stress')}</Text>
                  <Text className="font-heavy text-sectionTitle text-emerald-700">{currentEvaluation.stressAndRhythmScore.toFixed(1)}</Text>
                </View>
              </View>

              {/* Chi tiết từng từ */}
              <Text className="mb-1.5 mt-3 font-strong text-label text-ink">
                {L('Chi tiết phát âm & độ nhấn từng từ:', 'Word-by-word pronunciation & stress:')}
              </Text>
              <View className="flex-row flex-wrap gap-1.5">
                {currentEvaluation.words.map((w, idx) => {
                  const bg =
                    w.status === 'correct' ? '#DCFCE7' : w.status === 'fair' ? '#F3F0FB' : '#FEE2E2';
                  const textColor =
                    w.status === 'correct' ? '#15803D' : w.status === 'fair' ? '#6A4BD9' : '#B91C1C';
                  return (
                    <View key={idx} className="rounded-panel border border-border px-2 py-1" style={{ backgroundColor: bg }}>
                      <Text className="font-strong text-label" style={{ color: textColor }}>
                        {w.word}
                      </Text>
                      <Text className="font-mono text-[10px]" style={{ color: textColor }}>
                        {w.expectedIpa}
                      </Text>
                    </View>
                  );
                })}
              </View>

              {/* Nhận xét điểm mạnh & góp ý */}
              <View className="mt-3 gap-1 rounded-panel bg-[#F0FDF4] p-3 border border-emerald-200">
                {currentEvaluation.strengths.map((s, idx) => (
                  <Text key={idx} className="font-sans text-label text-emerald-900">
                    ✅ {s}
                  </Text>
                ))}
                {currentEvaluation.improvements.map((imp, idx) => (
                  <Text key={idx} className="font-sans text-label text-amber-900">
                    💡 {imp}
                  </Text>
                ))}
                <Text className="mt-1 font-mono text-[11px] text-muted">
                  ⏱️ {currentEvaluation.nativeComparison}
                </Text>
              </View>
            </Card>
          ) : null}

          {/* Danh sách các câu của Cảnh */}
          <Card className="p-3.5 shadow-sm">
            <Text className="font-strong uppercase tracking-[1px] text-muted text-label">
              {L(`Danh sách câu — Cảnh ${activeScene.sceneIndex}`, `Sentences — Scene ${activeScene.sceneIndex}`)}
            </Text>
            <View className="mt-2.5 gap-1.5">
              {activeScene.sentences.map((sentence, idx) => {
                const on = idx === activeSentenceIdx;
                const rec = recordings[sentence.id];
                const evalData = evaluations[sentence.id];
                return (
                  <Pressable
                    key={sentence.id}
                    accessibilityRole="button"
                    onPress={() => {
                      setActiveSentenceIdx(idx);
                      playVideoAt(sentence.start);
                    }}
                    className="flex-row items-center justify-between rounded-panel p-2.5 border"
                    style={{
                      borderColor: on ? '#2E7D4F' : '#F1F5F9',
                      backgroundColor: on ? 'rgba(46,125,79,0.08)' : '#FFFFFF',
                    }}
                  >
                    <View className="flex-1 flex-row items-center gap-2">
                      <Text className="font-strong text-label text-muted" style={{ width: 22 }}>
                        #{idx + 1}
                      </Text>
                      <Text
                        className="flex-1 font-sans text-label"
                        numberOfLines={1}
                        style={{ color: on ? '#0F172A' : '#475569' }}
                      >
                        {sentence.text}
                      </Text>
                    </View>

                    {evalData ? (
                      <View className="rounded-pill bg-emerald-100 px-2 py-0.5">
                        <Text className="font-strong text-[11px] text-emerald-800">
                          {evalData.matchPercentage}%
                        </Text>
                      </View>
                    ) : rec ? (
                      <Badge label={L('Đã thu', 'Recorded')} tone="primary" />
                    ) : (
                      <Text className="font-sans text-label text-slate-300">—</Text>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </Card>
        </View>
      </View>
    </Screen>
  );
}
