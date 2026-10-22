with open('src/components/ielts/SourceExamRoom.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

old_block = """                <Text style={{ fontFamily: 'BeVietnamPro_500Medium', fontSize: 13, color: '#6B7280' }}>

                  Số từ đã viết: {words(answers[String(activePartId)] ?? '')} từ

                </Text>"""

# Replace with CRLF or LF matching
new_block = """                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <Text style={{ fontFamily: 'BeVietnamPro_500Medium', fontSize: 13, color: '#6B7280' }}>
                    Số từ đã viết: <Text style={{ fontFamily: 'BeVietnamPro_700Bold', color: themeStyles.text }}>{words(answers[String(activePartId)] ?? '')}</Text> từ
                  </Text>
                  {currentPart?.minimumWords ? (
                    <View style={{
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 6,
                      backgroundColor: words(answers[String(activePartId)] ?? '') >= currentPart.minimumWords ? '#DCFCE7' : '#FEF3C7',
                      borderWidth: 1,
                      borderColor: words(answers[String(activePartId)] ?? '') >= currentPart.minimumWords ? '#86EFAC' : '#FCD34D',
                    }}>
                      <Text style={{
                        fontFamily: 'BeVietnamPro_600SemiBold',
                        fontSize: 12,
                        color: words(answers[String(activePartId)] ?? '') >= currentPart.minimumWords ? '#15803D' : '#B45309',
                      }}>
                        {words(answers[String(activePartId)] ?? '') >= currentPart.minimumWords
                          ? `✓ Đã đạt yêu cầu tối thiểu (${currentPart.minimumWords} từ)`
                          : `⚠️ Chưa đủ số từ tối thiểu (${words(answers[String(activePartId)] ?? '')}/${currentPart.minimumWords} từ)`}
                      </Text>
                    </View>
                  ) : null}
                </View>"""

if old_block in text:
    text = text.replace(old_block, new_block, 1)
    print("Replaced LF version")
elif old_block.replace('\n', '\r\n') in text:
    text = text.replace(old_block.replace('\n', '\r\n'), new_block.replace('\n', '\r\n'), 1)
    print("Replaced CRLF version")
else:
    print("Block not found!")

with open('src/components/ielts/SourceExamRoom.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
print("Updated SourceExamRoom.tsx")
