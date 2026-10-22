import re

with open('src/components/ielts/SourceExamRoom.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace header logo to match Image 2
old_header_logo = """          {/* Logo Band 9 Gold Badge */}

          <View

            style={{

              paddingHorizontal: 8,

              paddingVertical: 3,

              borderRadius: 6,

              backgroundColor: '#8F6E36',

            }}

          >

            <Text style={{ fontFamily: 'BeVietnamPro_700Bold', fontSize: 11, color: '#FFFFFF' }}>

              BAND 9

            </Text>

          </View>"""

new_header_logo = """          {/* Logo IELTS Emblem Badge (Image 2) */}
          <View
            style={{
              width: 30,
              height: 30,
              borderRadius: 7,
              backgroundColor: '#DC2626',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(220, 38, 38, 0.3)',
            }}
          >
            <Text style={{ fontFamily: 'BeVietnamPro_900Black', fontSize: 14, color: '#FFFFFF' }}>
              R
            </Text>
          </View>"""

# Normalize spaces before searching
if old_header_logo in text:
    text = text.replace(old_header_logo, new_header_logo, 1)
    print("Replaced header logo successfully!")
else:
    # Use regex
    text = re.sub(r'\{/\*\s*Logo Band 9 Gold Badge\s*\*/\}[\s\S]*?</View>', new_header_logo, text, count=1)
    print("Replaced header logo via regex!")

# Replace the workspace from `{/* 2. MAIN WORKSPACE` down to `{/* 3. BOTTOM NAVIGATION BAR`
m_workspace = re.search(r'\{\s*/\*\s*2\.\s*MAIN WORKSPACE[\s\S]*?(?=\{\s*/\*\s*3\.\s*BOTTOM NAVIGATION BAR)', text)
assert m_workspace, 'm_workspace not found'

new_listening_workspace = """{/* 2. MAIN WORKSPACE (Authentic Computer-Delivered IELTS Image 2 Layout for Listening) */}
      {section === 'Listening' ? (
        <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
          <ScrollView
            showsVerticalScrollIndicator={true}
            contentContainerStyle={{
              paddingHorizontal: isDesktop ? 48 : 20,
              paddingTop: 32,
              paddingBottom: 150,
              maxWidth: 1040,
              width: '100%',
              alignSelf: 'center',
              gap: 20,
            }}
          >
            {/* Top Instruction Bar (Image 2) */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <View
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 5,
                  borderRadius: 20,
                  backgroundColor: '#FEE2E2',
                  borderWidth: 1,
                  borderColor: '#FECACA',
                }}
              >
                <Text style={{ fontFamily: 'BeVietnamPro_700Bold', fontSize: 13, color: '#DC2626' }}>
                  Question {qStart} - {qEnd}
                </Text>
              </View>
              <Text style={{ fontFamily: 'BeVietnamPro_700Bold', fontSize: 14, color: '#0F172A' }}>
                Write ONE WORD ONLY for each answer.
              </Text>
            </View>

            {/* Section Title (Image 2) */}
            <Text style={{ fontFamily: 'BeVietnamPro_800ExtraBold', fontSize: 20, color: '#0F172A', marginTop: 4 }}>
              {test.parts?.[activePartId - 1]?.title || `Section ${activePartId}`}
            </Text>

            {/* Questions Worksheet */}
            {questionWorksheetContent}

            {/* End of Section Notice (Image 2) */}
            <View style={{ alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 40, paddingVertical: 24 }}>
              <Text style={{ fontSize: 24, color: '#94A3B8', letterSpacing: 4 }}>• • •</Text>
              <Text style={{ fontFamily: 'BeVietnamPro_700Bold', fontSize: 16, color: '#0F172A' }}>
                Hết câu hỏi của Section {activePartId}
              </Text>
              <Text style={{ fontFamily: 'BeVietnamPro_400Regular', fontSize: 13, color: '#64748B' }}>
                Bạn còn {Math.max(0, partNumbers.length - answeredInPartCount)} câu chưa trả lời ở phần này. Hãy hoàn thành bài của mình nhé!
              </Text>
            </View>
          </ScrollView>

          {/* Hidden HTML5 Audio Element for Background Playback */}
          {Platform.OS === 'web' && activeAudioTrackUrl ? (
            React.createElement('audio', {
              ref: audioPlayerRef,
              src: activeAudioTrackUrl,
              preload: 'metadata',
              onPlay: () => {
                setupAudioGain();
                setAudioIsPlaying(true);
              },
              onPause: () => setAudioIsPlaying(false),
              onTimeUpdate: () => {
                if (audioPlayerRef.current) {
                  setAudioCurrentTime(audioPlayerRef.current.currentTime);
                }
              },
              onLoadedMetadata: () => {
                if (audioPlayerRef.current) {
                  setAudioDuration(audioPlayerRef.current.duration || 0);
                  audioPlayerRef.current.volume = 1.0;
                }
              },
              onEnded: () => {
                setAudioIsPlaying(false);
                if (activePartId < parts.length) {
                  setActivePartId(activePartId + 1);
                }
              },
              style: { display: 'none' },
            })
          ) : null}
        </View>
      ) : (
        <View style={{ flex: 1, flexDirection: isDesktop ? 'row' : 'column' }}>
          {/* CỘT TRÁI: BÀI ĐỌC (READING PASSAGE) */}
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

      """

text = text[:m_workspace.start()] + new_listening_workspace + text[m_workspace.end():]

# Replace bottom bar
m_bottom = re.search(r'\{\s*/\*\s*3\.\s*BOTTOM NAVIGATION BAR[\s\S]*?(?=\{\s*/\*\s*MODAL XÁC NHẬN NỘP BÀI)', text)
assert m_bottom, 'm_bottom not found'

new_bottom_bar = """{/* 3. BOTTOM FOOTER BAR (IMAGE 2 MATCHING FOR LISTENING; STANDARD FOR READING) */}
      {section === 'Listening' ? (
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: '#FFFFFF',
            borderTopWidth: 1,
            borderTopColor: '#E2E8F0',
            zIndex: 30,
            boxShadow: '0 -4px 16px rgba(0,0,0,0.06)',
          }}
        >
          {/* TIER 1: AUDIO WAVEFORM SCRUBBER BAR (IMAGE 2) */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderBottomWidth: 1,
              borderBottomColor: '#F1F5F9',
              gap: 12,
            }}
          >
            {/* Play/Pause Button */}
            <Pressable
              accessibilityRole="button"
              onPress={toggleAudioPlay}
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: audioIsPlaying ? '#0F172A' : '#DC2626',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 12, color: '#FFFFFF' }}>{audioIsPlaying ? '⏸' : '▶'}</Text>
            </Pressable>

            {/* Current Time in Red (Image 2) */}
            <Text style={{ fontFamily: 'BeVietnamPro_700Bold', fontSize: 12.5, color: '#DC2626', minWidth: 42 }}>
              {formatAudioTime(audioCurrentTime)}
            </Text>

            {/* Waveform Scrubber Bars (Image 2) */}
            <Pressable
              style={{ flex: 1, height: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 }}
              onPress={(e: any) => {
                if (Platform.OS !== 'web') return;
                const rect = e.currentTarget?.getBoundingClientRect?.();
                if (rect) {
                  const clickX = e.clientX - rect.left;
                  handleSeekWaveform(clickX / rect.width);
                }
              }}
            >
              {WAVEFORM_HEIGHTS.map((h, bIdx) => {
                const prog = bIdx / WAVEFORM_HEIGHTS.length;
                const curr = audioDuration > 0 ? audioCurrentTime / audioDuration : 0;
                const isPlayed = prog <= curr;
                return (
                  <View
                    key={bIdx}
                    style={{
                      width: 3,
                      height: h,
                      borderRadius: 1.5,
                      backgroundColor: isPlayed ? '#DC2626' : '#CBD5E1',
                    }}
                  />
                );
              })}
            </Pressable>

            {/* Total Duration in Gray (Image 2) */}
            <Text style={{ fontFamily: 'BeVietnamPro_500Medium', fontSize: 12.5, color: '#64748B', minWidth: 42 }}>
              {formatAudioTime(audioDuration || 1800)}
            </Text>
          </View>

          {/* TIER 2: SECTION STATUS & QUESTION NUMBERS NAVIGATION (IMAGE 2) */}
          <View
            style={{
              height: 56,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 16,
            }}
          >
            {/* Left: Section progress */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 140 }}>
              <Text style={{ fontSize: 18, color: '#64748B' }}>⠿</Text>
              <View>
                <Text style={{ fontFamily: 'BeVietnamPro_700Bold', fontSize: 13, color: '#0F172A' }}>
                  Section {activePartId}
                </Text>
                <Text style={{ fontFamily: 'BeVietnamPro_400Regular', fontSize: 11, color: '#64748B' }}>
                  Đã làm {answeredInPartCount} / {partNumbers.length}
                </Text>
              </View>
            </View>

            {/* Center: Question Pills & Section Tabs */}
            <ScrollView
              horizontal={true}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ alignItems: 'center', gap: 6, paddingHorizontal: 12 }}
            >
              {/* Active Section Badge (Red Pill matching Image 2) */}
              <View
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 6,
                  backgroundColor: '#DC2626',
                }}
              >
                <Text style={{ fontFamily: 'BeVietnamPro_700Bold', fontSize: 12, color: '#FFFFFF' }}>
                  Section {activePartId}
                </Text>
              </View>

              {/* Numbered Question Buttons */}
              {partNumbers.map((num) => {
                const hasAnswer = Boolean(answers[String(num)]?.trim());
                const isCurrent = activeQuestion === num;
                const isFlag = flagged.has(num);
                return (
                  <Pressable
                    key={num}
                    onPress={() => setActiveQuestion(num)}
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 6,
                      backgroundColor: hasAnswer ? '#0F172A' : '#FFFFFF',
                      borderWidth: isCurrent ? 2 : 1,
                      borderColor: isCurrent ? '#DC2626' : '#E2E8F0',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: 'BeVietnamPro_700Bold',
                        fontSize: 12,
                        color: hasAnswer ? '#FFFFFF' : '#334155',
                      }}
                    >
                      {num}
                    </Text>
                    {isFlag ? (
                      <View
                        style={{
                          position: 'absolute',
                          top: 2,
                          right: 2,
                          width: 5,
                          height: 5,
                          borderRadius: 2.5,
                          backgroundColor: '#EF4444',
                        }}
                      />
                    ) : null}
                  </Pressable>
                );
              })}

              {/* Other Section Pills (S1, S2, S3, S4 matching Image 2) */}
              {parts.map((p) => {
                if (p.id === activePartId) return null;
                return (
                  <Pressable
                    key={p.id}
                    onPress={() => {
                      setActivePartId(p.id);
                      setActiveQuestion(p.questionStart);
                    }}
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 6,
                      borderRadius: 6,
                      backgroundColor: '#F1F5F9',
                      borderWidth: 1,
                      borderColor: '#E2E8F0',
                    }}
                  >
                    <Text style={{ fontFamily: 'BeVietnamPro_600SemiBold', fontSize: 12, color: '#64748B' }}>
                      S{p.id}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Right: Red Section Next Button (matching Image 2) */}
            {activePartId < parts.length ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  const nextP = activePartId + 1;
                  setActivePartId(nextP);
                  const pObj = parts.find((p) => p.id === nextP);
                  if (pObj) setActiveQuestion(pObj.questionStart);
                }}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 9,
                  borderRadius: 8,
                  backgroundColor: '#DC2626',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Text style={{ fontFamily: 'BeVietnamPro_700Bold', fontSize: 13, color: '#FFFFFF' }}>
                  Section {activePartId + 1} →
                </Text>
              </Pressable>
            ) : (
              <Pressable
                accessibilityRole="button"
                disabled={loading}
                onPress={() => setConfirmSubmit(true)}
                style={{
                  paddingHorizontal: 18,
                  paddingVertical: 9,
                  borderRadius: 8,
                  backgroundColor: '#DC2626',
                }}
              >
                <Text style={{ fontFamily: 'BeVietnamPro_700Bold', fontSize: 13, color: '#FFFFFF' }}>
                  {submitted ? '✓ Đã nộp' : 'Nộp bài →'}
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      ) : (
        <View
          style={{
            height: 60,
            backgroundColor: themeStyles.toolbar,
            borderTopWidth: 1,
            borderTopColor: themeStyles.border,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
          }}
        >
          {/* Bên trái: Trạng thái tiến độ & chọn Passage */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View>
              <Text style={{ fontFamily: 'BeVietnamPro_700Bold', fontSize: 12, color: themeStyles.text }}>
                Practice
              </Text>
              <Text style={{ fontFamily: 'BeVietnamPro_500Medium', fontSize: 11, color: '#6B7280' }}>
                Đã làm {answeredInPartCount}/{partNumbers.length}
              </Text>
            </View>

            {parts.length > 1 && (
              <View style={{ flexDirection: 'row', gap: 4, marginLeft: 8 }}>
                {parts.map((p) => {
                  const active = p.id === activePartId;
                  return (
                    <Pressable
                      key={p.id}
                      onPress={() => setActivePartId(p.id)}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        borderRadius: 6,
                        backgroundColor: active ? '#8F6E36' : themeStyles.surface,
                        borderWidth: 1,
                        borderColor: active ? '#8F6E36' : themeStyles.border,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: 'BeVietnamPro_700Bold',
                          fontSize: 11,
                          color: active ? '#FFFFFF' : themeStyles.text,
                        }}
                      >
                        P{p.id}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>

          {/* Chính giữa: Dãy số câu hỏi */}
          <ScrollView
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ alignItems: 'center', gap: 6, paddingHorizontal: 12 }}
          >
            {partNumbers.map((num) => {
              const hasAnswer = Boolean(answers[String(num)]?.trim());
              const isCurrent = activeQuestion === num;
              const isFlag = flagged.has(num);
              let boxBg = themeStyles.surface;
              let textColor = themeStyles.text;
              let borderColor = themeStyles.border;
              if (hasAnswer) {
                boxBg = '#0F172A';
                textColor = '#FFFFFF';
                borderColor = '#0F172A';
              }
              if (isCurrent) {
                borderColor = '#8F6E36';
              }
              return (
                <Pressable
                  key={num}
                  onPress={() => setActiveQuestion(num)}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 8,
                    backgroundColor: boxBg,
                    borderWidth: isCurrent ? 2 : 1,
                    borderColor,
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                  }}
                >
                  <Text style={{ fontFamily: 'BeVietnamPro_700Bold', fontSize: 13, color: textColor }}>
                    {num}
                  </Text>
                  {isFlag ? (
                    <View
                      style={{
                        position: 'absolute',
                        top: 2,
                        right: 2,
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: '#F59E0B',
                      }}
                    />
                  ) : null}
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Bên phải: Nút chuyển nhóm & Nút NỘP BÀI VÀNG ÁNH KIM BAND 9 */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Pressable
              accessibilityRole="button"
              onPress={handleNextGroup}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: themeStyles.border,
                backgroundColor: themeStyles.surface,
              }}
            >
              <Text style={{ fontFamily: 'BeVietnamPro_600SemiBold', fontSize: 12, color: themeStyles.text }}>
                Tiếp →
              </Text>
            </Pressable>

            {!submitted ? (
              <Pressable
                accessibilityRole="button"
                disabled={loading}
                onPress={() => setConfirmSubmit(true)}
                style={({ pressed }) => ({
                  paddingHorizontal: 18,
                  paddingVertical: 8,
                  borderRadius: 10,
                  backgroundColor: '#8F6E36',
                  boxShadow: pressed ? '0 1px 2px rgba(143,110,54,0.3)' : '0 3px 8px rgba(143,110,54,0.4)',
                  transform: [{ translateY: pressed ? 1 : 0 }],
                })}
              >
                <Text style={{ fontFamily: 'BeVietnamPro_700Bold', fontSize: 13, color: '#FFFFFF' }}>
                  Nộp bài
                </Text>
              </Pressable>
            ) : (
              <View style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: '#DCFCE7' }}>
                <Text style={{ fontFamily: 'BeVietnamPro_700Bold', fontSize: 13, color: '#166534' }}>
                  ✓ Đã nộp
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      """

text = text[:m_bottom.start()] + new_bottom_bar + text[m_bottom.end():]

with open('src/components/ielts/SourceExamRoom.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print('Listening Image 2 layout successfully applied to SourceExamRoom.tsx!')
