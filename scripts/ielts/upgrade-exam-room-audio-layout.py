import re

with open('src/components/ielts/SourceExamRoom.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Normalize line endings
has_crlf = '\r\n' in text
text = text.replace('\r\n', '\n')

# 1. New upgraded SourceAudio component with Web Audio GainNode amplification & Band 9 gold theme
new_source_audio = '''/** Audio player cho phần thi Listening với Web Audio API GainNode khuếch đại âm lượng to rõ */
function SourceAudio({
  files,
  simulation,
  activePartId = 1,
  onPartChange,
  showTranscript,
  onToggleTranscript,
  hasTranscript = true,
}: {
  files: string[];
  simulation: boolean;
  activePartId?: number;
  onPartChange?: (partId: number) => void;
  showTranscript?: boolean;
  onToggleTranscript?: () => void;
  hasTranscript?: boolean;
}) {
  const player = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);

  const [manualTrack, setManualTrack] = useState<number | null>(null);
  const [started, setStarted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const [error, setError] = useState('');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Mức khuếch đại âm lượng: 1.0 (100%), 1.4 (140%), 1.8 (180% - To rõ mặc định), 2.2 (220% Siêu to)
  const [volumeBoost, setVolumeBoost] = useState<number>(1.8);

  const track = files.length > 1 && manualTrack === null
    ? Math.max(0, Math.min(activePartId - 1, files.length - 1))
    : (manualTrack ?? 0);

  const src = files[track] || files[0];

  const ensureWebAudioBoost = useCallback(() => {
    if (Platform.OS !== 'web' || !player.current) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current) {
        const ctx = new AudioCtx();
        audioCtxRef.current = ctx;
        const gain = ctx.createGain();
        gain.gain.value = volumeBoost;
        gainNodeRef.current = gain;
        const srcNode = ctx.createMediaElementSource(player.current);
        sourceNodeRef.current = srcNode;
        srcNode.connect(gain);
        gain.connect(ctx.destination);
      }
      if (audioCtxRef.current.state === 'suspended') {
        void audioCtxRef.current.resume();
      }
    } catch {
      // Ignored if already connected
    }
  }, [volumeBoost]);

  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = volumeBoost;
    }
    if (player.current) {
      player.current.volume = 1.0;
    }
  }, [volumeBoost]);

  useEffect(() => {
    if (started && !ended && player.current) {
      ensureWebAudioBoost();
      player.current.play().then(() => setIsPlaying(true)).catch(() => {
        setIsPlaying(false);
        setError('Bấm phát để tiếp tục audio.');
      });
    }
  }, [track, started, ended, ensureWebAudioBoost]);

  const togglePlay = () => {
    ensureWebAudioBoost();
    if (!player.current) return;
    if (isPlaying) {
      player.current.pause();
      setIsPlaying(false);
    } else {
      player.current.volume = 1.0;
      player.current.play().then(() => {
        setIsPlaying(true);
        setStarted(true);
        setError('');
      }).catch(() => {
        setError('Bấm phát để cho phép phát audio.');
      });
    }
  };

  const formatAudioTime = (sec: number) => {
    if (isNaN(sec) || sec < 0) return '00:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  if (!src) {
    return (
      <View style={{ borderRadius: 14, borderWidth: 1, borderColor: '#F59E0B', backgroundColor: '#FFFBEB', padding: 16, gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Icon name="volume" size={18} color="#D97706" />
          <Text style={{ fontFamily: 'BeVietnamPro_700Bold', fontSize: 14, color: '#92400E' }}>IELTS Listening Audio</Text>
        </View>
        <Text style={{ fontFamily: 'BeVietnamPro_400Regular', fontSize: 13, color: '#78350F' }}>
          Đang chuẩn bị file audio cho bài này. Bạn có thể mở bản chép lời transcript để luyện nghe đọc song song.
        </Text>
      </View>
    );
  }

  return (
    <View
      style={{
        borderRadius: 18,
        borderWidth: 1.5,
        borderColor: '#E6D7C3',
        backgroundColor: '#FFFFFF',
        padding: 18,
        gap: 14,
        boxShadow: '0 4px 16px rgba(143, 110, 54, 0.08)',
      }}
    >
      {/* Header Bar */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#FAF3E7', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="volume" size={16} color="#8F6E36" />
          </View>
          <View>
            <Text style={{ fontFamily: 'BeVietnamPro_800ExtraBold', fontSize: 14, color: '#2A1808', letterSpacing: 0.2 }}>
              {files.length > 1 ? `IELTS LISTENING · PART ${track + 1}/${files.length}` : 'IELTS LISTENING · TOÀN BÀI THI'}
            </Text>
            <Text style={{ fontFamily: 'BeVietnamPro_400Regular', fontSize: 11.5, color: '#7C6552' }}>
              {simulation ? 'Thi thử như thi thật · Audio chuẩn CD IELTS' : 'Luyện tập tự do · Có thể tạm dừng và tua lại'}
            </Text>
          </View>
        </View>

        {onToggleTranscript && hasTranscript ? (
          <Pressable
            accessibilityRole="button"
            onPress={onToggleTranscript}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: showTranscript ? '#8F6E36' : '#E6DACB',
              backgroundColor: showTranscript ? '#8F6E36' : '#FAF7F2',
            }}
          >
            <Text style={{ fontFamily: 'BeVietnamPro_600SemiBold', fontSize: 12, color: showTranscript ? '#FFFFFF' : '#8F6E36' }}>
              {showTranscript ? '✕ Ẩn Transcript' : '👁️ Mở Transcript tham khảo'}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {/* Part Switcher Pills */}
      {files.length > 1 && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {files.map((_, pIdx) => {
            const active = pIdx === track;
            return (
              <Pressable
                key={pIdx}
                accessibilityRole="button"
                onPress={() => {
                  setManualTrack(pIdx);
                  setError('');
                  if (onPartChange) onPartChange(pIdx + 1);
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: active ? '#8F6E36' : '#E6DACB',
                  backgroundColor: active ? '#8F6E36' : '#FAF7F2',
                }}
              >
                {active && <Text style={{ fontSize: 12 }}>🔊</Text>}
                <Text
                  style={{
                    fontFamily: 'BeVietnamPro_700Bold',
                    fontSize: 12.5,
                    color: active ? '#FFFFFF' : '#2A1808',
                  }}
                >
                  Part {pIdx + 1}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {/* Player Console: Play/Pause, Progress Bar, Time, and Volume Booster */}
      <View
        style={{
          borderRadius: 14,
          backgroundColor: '#FAF7F2',
          borderWidth: 1,
          borderColor: '#EFE7DC',
          padding: 14,
          gap: 12,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          {/* Play/Pause Button */}
          <Pressable
            accessibilityRole="button"
            onPress={togglePlay}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              paddingHorizontal: 18,
              height: 40,
              borderRadius: 10,
              backgroundColor: isPlaying ? '#2A1808' : '#8F6E36',
              shadowColor: '#8F6E36',
              shadowOpacity: 0.18,
              shadowRadius: 5,
            }}
          >
            <Text style={{ fontSize: 14, color: '#FFFFFF' }}>{isPlaying ? '⏸' : '▶'}</Text>
            <Text style={{ fontFamily: 'BeVietnamPro_700Bold', fontSize: 13, color: '#FFFFFF' }}>
              {isPlaying ? 'Tạm dừng' : started ? 'Tiếp tục phát' : 'Bắt đầu nghe'}
            </Text>
          </Pressable>

          {/* Time indicator */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={{ fontFamily: 'BeVietnamPro_700Bold', fontSize: 13.5, color: '#2A1808' }}>
              {formatAudioTime(currentTime)}
            </Text>
            <Text style={{ fontFamily: 'BeVietnamPro_400Regular', fontSize: 13, color: '#7C6552' }}>
              / {formatAudioTime(duration)}
            </Text>
          </View>

          {/* Volume Booster Console (Khuếch đại âm lượng to hơn) */}
          <View style={{ marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginRight: 2 }}>
              <Text style={{ fontSize: 13 }}>🔊</Text>
              <Text style={{ fontFamily: 'BeVietnamPro_700Bold', fontSize: 12, color: '#2A1808' }}>
                Âm lượng:
              </Text>
            </View>

            {[
              { label: '100%', val: 1.0 },
              { label: '140%', val: 1.4 },
              { label: '180% To rõ ★', val: 1.8 },
              { label: '220% Cực đại', val: 2.2 },
            ].map((v) => {
              const active = volumeBoost === v.val;
              return (
                <Pressable
                  key={v.val}
                  accessibilityRole="button"
                  onPress={() => setVolumeBoost(v.val)}
                  style={{
                    paddingHorizontal: 9,
                    paddingVertical: 5,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: active ? '#8F6E36' : '#DDD2C3',
                    backgroundColor: active ? '#8F6E36' : '#FFFFFF',
                  }}
                >
                  <Text
                    style={{
                      fontFamily: active ? 'BeVietnamPro_700Bold' : 'BeVietnamPro_500Medium',
                      fontSize: 11.5,
                      color: active ? '#FFFFFF' : '#4B5563',
                    }}
                  >
                    {v.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Progress Bar */}
        <View
          style={{
            height: 6,
            borderRadius: 3,
            backgroundColor: '#E6DACB',
            overflow: 'hidden',
            width: '100%',
          }}
        >
          <View
            style={{
              height: '100%',
              width: `${duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0}%`,
              backgroundColor: '#8F6E36',
              borderRadius: 3,
            }}
          />
        </View>
      </View>

      {/* Hidden audio element for browser playback */}
      {Platform.OS === 'web' ? (
        React.createElement('audio', {
          ref: player,
          src,
          preload: 'metadata',
          onPlay: () => {
            ensureWebAudioBoost();
            setIsPlaying(true);
            setStarted(true);
          },
          onPause: () => setIsPlaying(false),
          onTimeUpdate: () => {
            if (player.current) {
              setCurrentTime(player.current.currentTime);
            }
          },
          onLoadedMetadata: () => {
            if (player.current) {
              setDuration(player.current.duration || 0);
              player.current.volume = 1.0;
            }
          },
          onEnded: () => {
            setIsPlaying(false);
            if (track + 1 < files.length) {
              setManualTrack(track + 1);
              if (onPartChange) onPartChange(track + 2);
            } else {
              setEnded(true);
            }
          },
          onError: () => setError('Không tải được audio nguồn. Vui lòng kiểm tra lại kết nối.'),
          style: { display: 'none' },
        })
      ) : null}

      {error ? (
        <Text style={{ fontFamily: 'BeVietnamPro_500Medium', fontSize: 12.5, color: '#DC2626' }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}'''

# Replace old SourceAudio
m_audio = re.search(r'/\*\* Audio player cho phần thi Listening \*/[\s\S]*?(?=/\*\* Tách văn bản trang)', text)
assert m_audio, 'SourceAudio block not found'
text = text[:m_audio.start()] + new_source_audio + '\n\n' + text[m_audio.end():]

print('Replaced SourceAudio successfully!')

# Now replace the workspace layout:
# Let's locate the question worksheet content from `{/* CỘT PHẢI: PHIẾU CÂU HỎI` down to end of that View
m_right_col = re.search(r'\{\s*/\*\s*CỘT PHẢI: PHIẾU CÂU HỎI[\s\S]*?\{\s*/\*\s*3\.\s*BOTTOM NAVIGATION BAR', text)
assert m_right_col, 'm_right_col not found'
print('Found right col block! Length:', len(m_right_col.group(0)))

# In right col, extract the ScrollView content
m_scroll_content = re.search(r'<ScrollView[\s\S]*?contentContainerStyle=\{\{[^\}]*\}\}\s*>([\s\S]*?)</ScrollView>', m_right_col.group(0))
assert m_scroll_content, 'm_scroll_content not found'
worksheet_inner = m_scroll_content.group(1).strip()

# Now find where the return starts in SourceExamRoom
m_return = re.search(r'return\s*\(\s*<View\s*style=\{\{\s*flex:\s*1,\s*backgroundColor:\s*themeStyles\.bg', text)
assert m_return, 'return View not found'

# Insert `const questionWorksheetContent = (` before return
worksheet_var = f'''  const questionWorksheetContent = (
    <View style={{{{ gap: 24 }}}}>
      {worksheet_inner}
    </View>
  );

  '''

text = text[:m_return.start()] + worksheet_var + text[m_return.start():]

# Now let's replace the whole workspace block (from `{/* 2. MAIN 2-COLUMN SPLIT WORKSPACE` to `{/* 3. BOTTOM NAVIGATION BAR`)
m_workspace = re.search(r'\{\s*/\*\s*2\.\s*MAIN 2-COLUMN SPLIT WORKSPACE[\s\S]*?(?=\{\s*/\*\s*3\.\s*BOTTOM NAVIGATION BAR)', text)
assert m_workspace, 'm_workspace not found'

new_workspace = '''{/* 2. MAIN WORKSPACE (Single-column CD IELTS for Listening without transcript; 2-column split for Reading or Listening with transcript) */}
      {section === 'Listening' && !showTranscript && !submitted ? (
        <View style={{ flex: 1, backgroundColor: themeStyles.bg }}>
          <ScrollView
            showsVerticalScrollIndicator={true}
            contentContainerStyle={{
              paddingHorizontal: isDesktop ? 40 : 18,
              paddingVertical: 26,
              maxWidth: 1040,
              width: '100%',
              alignSelf: 'center',
              gap: 22,
            }}
          >
            {/* Top IELTS CD Audio Console */}
            <SourceAudio
              files={test.audioFiles.length ? test.audioFiles.map(assetUrl) : test.audioCloudUrl ? [test.audioCloudUrl] : []}
              simulation={simulation}
              activePartId={activePartId}
              onPartChange={(p) => setActivePartId(p)}
              showTranscript={showTranscript}
              onToggleTranscript={() => setShowTranscript(true)}
              hasTranscript={Boolean(passageDisplayData.paragraphs.length)}
            />

            {/* IELTS Part Instruction Card */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 18,
                paddingVertical: 14,
                borderRadius: 14,
                backgroundColor: themeStyles.surface,
                borderWidth: 1,
                borderColor: themeStyles.border,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#FAF3E7', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 16 }}>📋</Text>
                </View>
                <View>
                  <Text style={{ fontFamily: 'BeVietnamPro_700Bold', fontSize: 15, color: themeStyles.text }}>
                    {test.parts?.[activePartId - 1]?.title || `Part ${activePartId}`} · Questions {qStart} – {qEnd}
                  </Text>
                  <Text style={{ fontFamily: 'BeVietnamPro_400Regular', fontSize: 13, color: '#6B7280' }}>
                    Nghe bài nói và trả lời trực tiếp các câu hỏi bên dưới theo chuẩn Computer-Delivered IELTS.
                  </Text>
                </View>
              </View>
            </View>

            {/* Questions Worksheet */}
            {questionWorksheetContent}
          </ScrollView>
        </View>
      ) : (
        <View style={{ flex: 1, flexDirection: isDesktop ? 'row' : 'column' }}>
          {/* CỘT TRÁI: BÀI ĐỌC (HOẶC TRANSCRIPT NGHE) */}
          <View
            style={{
              flex: isDesktop ? leftWidthPercent / 100 : 1,
              borderRightWidth: isDesktop ? 1 : 0,
              borderRightColor: themeStyles.border,
              backgroundColor: themeStyles.surface,
            }}
          >
            <ScrollView
              showsVerticalScrollIndicator={true}
              contentContainerStyle={{ paddingHorizontal: isDesktop ? 36 : 20, paddingVertical: 28, gap: 16 }}
            >
              {section === 'Listening' && (
                <SourceAudio
                  files={test.audioFiles.length ? test.audioFiles.map(assetUrl) : test.audioCloudUrl ? [test.audioCloudUrl] : []}
                  simulation={simulation}
                  activePartId={activePartId}
                  onPartChange={(p) => setActivePartId(p)}
                  showTranscript={showTranscript}
                  onToggleTranscript={() => setShowTranscript(false)}
                  hasTranscript={Boolean(passageDisplayData.paragraphs.length)}
                />
              )}

              {/* Tiêu đề bài đọc lớn & phụ đề dẫn dắt */}
              <View className="gap-2 border-b border-border/60 pb-4">
                <Text
                  style={{
                    fontFamily: 'BeVietnamPro_800ExtraBold',
                    fontSize: 24,
                    lineHeight: 32,
                    color: themeStyles.text,
                  }}
                >
                  {passageDisplayData.title}
                </Text>
                {passageDisplayData.subtitle ? (
                  <Text
                    style={{
                      fontFamily: 'BeVietnamPro_500Medium',
                      fontSize: 14,
                      lineHeight: 22,
                      color: '#4B5563',
                    }}
                  >
                    {passageDisplayData.subtitle}
                  </Text>
                ) : null}
              </View>

              {section === 'Listening' ? (
                <View style={{ gap: 16 }}>
                  {passageDisplayData.paragraphs.map((para, pIdx) => (
                    <Text
                      key={pIdx}
                      selectable={true}
                      style={{
                        fontFamily: 'BeVietnamPro_400Regular',
                        fontSize: fontSizeLevel,
                        lineHeight: fontSizeLevel * 1.7,
                        color: themeStyles.text,
                        textAlign: 'justify',
                      }}
                    >
                      {para}
                    </Text>
                  ))}
                </View>
              ) : (
                <View style={{ gap: 16 }}>
                  {passageDisplayData.paragraphs.map((para, pIdx) => (
                    <Text
                      key={pIdx}
                      selectable={true}
                      style={{
                        fontFamily: 'BeVietnamPro_400Regular',
                        fontSize: fontSizeLevel,
                        lineHeight: fontSizeLevel * 1.7,
                        color: themeStyles.text,
                        textAlign: 'justify',
                      }}
                    >
                      {para}
                    </Text>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>

          {/* CỘT PHẢI: PHIẾU CÂU HỎI (QUESTION WORKSHEET) */}
          <View
            style={{
              flex: isDesktop ? (100 - leftWidthPercent) / 100 : 1,
              backgroundColor: themeStyles.bg,
            }}
          >
            <ScrollView
              showsVerticalScrollIndicator={true}
              contentContainerStyle={{ paddingHorizontal: isDesktop ? 28 : 16, paddingVertical: 24 }}
            >
              {questionWorksheetContent}
            </ScrollView>
          </View>
        </View>
      )}

      '''

text = text[:m_workspace.start()] + new_workspace + text[m_workspace.end():]

if has_crlf:
    text = text.replace('\n', '\r\n')

with open('src/components/ielts/SourceExamRoom.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print('SourceExamRoom.tsx updated successfully!')
