import re

with open('src/components/ielts/SourceExamRoom.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

has_crlf = '\r\n' in text
text = text.replace('\r\n', '\n')

# 1. Add audio state hooks for Listening mode in SourceExamRoom component
target_state = "const [themeMode, setThemeMode] = useState<'light' | 'warm' | 'dark'>('light');"

new_audio_state = """const [themeMode, setThemeMode] = useState<'light' | 'warm' | 'dark'>('light');

  // Audio control state for Listening Exam Room (Image 2)
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioGainRef = useRef<GainNode | null>(null);
  const audioSourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const [audioCurrentTime, setAudioCurrentTime] = useState<number>(0);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [audioIsPlaying, setAudioIsPlaying] = useState<boolean>(false);
  const [audioVolumeBoost, setAudioVolumeBoost] = useState<number>(1.8); // 180% default boost

  // Get active audio track URL
  const activeAudioTrackUrl = useMemo(() => {
    if (!test.audioFiles || test.audioFiles.length === 0) {
      return test.audioCloudUrl || '';
    }
    const idx = Math.max(0, Math.min(activePartId - 1, test.audioFiles.length - 1));
    return assetUrl(test.audioFiles[idx] || test.audioFiles[0]);
  }, [test.audioFiles, test.audioCloudUrl, activePartId]);

  // Audio volume amplifier setup
  const setupAudioGain = useCallback(() => {
    if (Platform.OS !== 'web' || !audioPlayerRef.current) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioContextRef.current) {
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;
        const gain = ctx.createGain();
        gain.gain.value = audioVolumeBoost;
        audioGainRef.current = gain;
        const src = ctx.createMediaElementSource(audioPlayerRef.current);
        audioSourceNodeRef.current = src;
        src.connect(gain);
        gain.connect(ctx.destination);
      }
      if (audioContextRef.current.state === 'suspended') {
        void audioContextRef.current.resume();
      }
    } catch {
      // Ignore if already connected
    }
  }, [audioVolumeBoost]);

  useEffect(() => {
    if (audioGainRef.current) {
      audioGainRef.current.gain.value = audioVolumeBoost;
    }
  }, [audioVolumeBoost]);

  const toggleAudioPlay = useCallback(() => {
    setupAudioGain();
    if (!audioPlayerRef.current) return;
    if (audioIsPlaying) {
      audioPlayerRef.current.pause();
      setAudioIsPlaying(false);
    } else {
      audioPlayerRef.current.volume = 1.0;
      audioPlayerRef.current.play().then(() => setAudioIsPlaying(true)).catch(() => setAudioIsPlaying(false));
    }
  }, [audioIsPlaying, setupAudioGain]);

  const handleSeekWaveform = useCallback((percent: number) => {
    if (!audioPlayerRef.current || !audioDuration) return;
    const newSec = Math.max(0, Math.min(audioDuration, percent * audioDuration));
    audioPlayerRef.current.currentTime = newSec;
    setAudioCurrentTime(newSec);
  }, [audioDuration]);

  const formatAudioTime = (sec: number) => {
    if (isNaN(sec) || sec < 0) return '00:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const WAVEFORM_HEIGHTS = useMemo(() => [
    10, 16, 24, 18, 14, 26, 32, 22, 16, 28, 36, 24, 18, 22, 30, 26, 14, 20, 32, 38,
    22, 16, 24, 34, 26, 18, 22, 30, 24, 14, 20, 28, 36, 22, 16, 24, 32, 28, 18, 22,
    30, 24, 14, 20, 32, 36, 22, 16, 24, 34, 26, 18, 20, 28, 22, 16, 24, 30, 26, 18,
    14, 22, 30, 24, 16, 20, 28, 22, 14, 18,
  ], []);"""

assert target_state in text, 'target_state not found'
text = text.replace(target_state, new_audio_state, 1)

print('Added audio state hooks!')

with open('src/components/ielts/SourceExamRoom.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print('Phase 1 SourceExamRoom saved')
