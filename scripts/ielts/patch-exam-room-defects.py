import re

path = 'src/components/ielts/SourceExamRoom.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# 1. ParsedQuestionItem type: add tfngOptions
assert 'export type ParsedQuestionItem = {' in code
code = code.replace(
    '  options?: { letter: string; text: string }[];\n};',
    '  options?: { letter: string; text: string }[];\n  tfngOptions?: string[];\n};'
)

# 2. tfng detection & options
old_tfng_block = re.search(r'// Kiểm tra TRUE / FALSE / NOT GIVEN[\s\S]*?groupQuestions\.push\({\s*number: num,\s*type: \'tfng\',\s*stem: qLine,\s*}\);', code)
if old_tfng_block:
    new_tfng_block = """// Kiểm tra TRUE / FALSE / NOT GIVEN hoặc YES / NO / NOT GIVEN
    const surroundingText = text.slice(Math.max(0, (qIndex - 8) * 50), (qIndex + 3) * 50);
    const isYesNo = /YES\\s*[/,]|claims|views/i.test(surroundingText) || /YES\\s*[/,]|claims|views/i.test(currentInstruction);
    const isTfng =
      /TRUE|FALSE|NOT GIVEN|YES|NO/i.test(surroundingText) ||
      /TRUE|FALSE|NOT GIVEN|YES|NO/i.test(qLine);

    if (choiceOptions.length >= 3) {
      groupQuestions.push({
        number: num,
        type: 'choice',
        stem: qLine,
        options: choiceOptions,
      });
    } else if (isTfng && !qLine.includes('____') && !qLine.includes('.....')) {
      groupQuestions.push({
        number: num,
        type: 'tfng',
        stem: qLine,
        tfngOptions: isYesNo ? ['YES', 'NO', 'NOT GIVEN'] : ['TRUE', 'FALSE', 'NOT GIVEN'],
      });"""
    code = code[:old_tfng_block.start()] + new_tfng_block + code[old_tfng_block.end():]
    print("Updated tfng detection")
else:
    print("WARNING: old_tfng_block not matched")

# 3. Default group instruction for tfng
old_inst = "else if (firstType === 'tfng') inst = 'Do the following statements agree with the information in the passage? Write TRUE, FALSE or NOT GIVEN.';"
new_inst = "else if (firstType === 'tfng') inst = chunk[0]?.tfngOptions?.[0] === 'YES' ? 'Do the following statements agree with the claims/views of the writer? Write YES, NO or NOT GIVEN.' : 'Do the following statements agree with the information in the passage? Write TRUE, FALSE or NOT GIVEN.';"
if old_inst in code:
    code = code.replace(old_inst, new_inst)
    print("Updated tfng instruction")

# 4. fontSizeLevel initial value
code = code.replace(
    'const [fontSizeLevel, setFontSizeLevel] = useState<15 | 17 | 19>(16 as 17);',
    'const [fontSizeLevel, setFontSizeLevel] = useState<15 | 17 | 19>(15);'
)

# 5. handleNextGroup
old_handle_next = re.search(r'const handleNextGroup = \(\) => \{\s*const nextQ = Math\.min\(qEnd, activeQuestion \+ 4\);\s*setActiveQuestion\(nextQ\);\s*\};', code)
if old_handle_next:
    new_handle_next = """const handleNextGroup = () => {
    const currentGroupIndex = questionGroups.findIndex(
      (g) => activeQuestion >= (g.questions[0]?.number ?? 0) && activeQuestion <= (g.questions[g.questions.length - 1]?.number ?? 0)
    );
    if (currentGroupIndex >= 0 && currentGroupIndex < questionGroups.length - 1) {
      const nextGroup = questionGroups[currentGroupIndex + 1];
      if (nextGroup && nextGroup.questions[0]) {
        setActiveQuestion(nextGroup.questions[0].number);
        return;
      }
    }
    if (activePartId < parts.length) {
      const nextPart = parts[activePartId];
      if (nextPart) {
        setActivePartId(activePartId + 1);
        setActiveQuestion(nextPart.questionStart);
        return;
      }
    }
    const nextQ = Math.min(qEnd, activeQuestion + 1);
    setActiveQuestion(nextQ);
  };"""
    code = code[:old_handle_next.start()] + new_handle_next + code[old_handle_next.end():]
    print("Updated handleNextGroup")
else:
    print("WARNING: handleNextGroup not matched")

# 6. Group question range banner pink pill
old_banner_pill = re.search(r'style=\{\{\s*backgroundColor:\s*\'#FEE2E2\',\s*paddingHorizontal:\s*10,\s*paddingVertical:\s*3,\s*borderRadius:\s*6,\s*\}\}\s*>\s*<Text style=\{\{\s*fontFamily:\s*\'BeVietnamPro_700Bold\',\s*fontSize:\s*12,\s*color:\s*\'#DC2626\'\s*\}\}>', code)
if old_banner_pill:
    new_banner_pill = """style={{
                      backgroundColor: themeStyles.border,
                      paddingHorizontal: 10,
                      paddingVertical: 3,
                      borderRadius: 6,
                    }}
                  >
                    <Text style={{ fontFamily: 'BeVietnamPro_700Bold', fontSize: 12, color: themeStyles.text }}>"""
    code = code[:old_banner_pill.start()] + new_banner_pill + code[old_banner_pill.end():]
    print("Updated group banner pill")
else:
    print("WARNING: group banner pill not matched")

# 7. Answer textinput placeholder
old_textinput = 'placeholder="Nhập đáp án..."\n\n                              placeholderTextColor="#9CA3AF"'
if old_textinput in code:
    code = code.replace(old_textinput, '')
    print("Removed answer placeholder")
else:
    # Try with \r\n
    old_textinput_crlf = 'placeholder="Nhập đáp án..."\r\n\r\n                              placeholderTextColor="#9CA3AF"'
    if old_textinput_crlf in code:
        code = code.replace(old_textinput_crlf, '')
        print("Removed answer placeholder (CRLF)")
    else:
        print("WARNING: textinput placeholder not matched")

# 8. TFNG options renderer
old_tfng_render = "{['TRUE', 'FALSE', 'NOT GIVEN'].map((opt, idx) => {"
new_tfng_render = "{(q.tfngOptions || ['TRUE', 'FALSE', 'NOT GIVEN']).map((opt, idx) => {"
if old_tfng_render in code:
    code = code.replace(old_tfng_render, new_tfng_render)
    print("Updated tfng options renderer")

# 9. Top bar: remove 'R' emblem badge and fix title/subtitle
old_r_badge = re.search(r'\{\s*/\*\s*Logo IELTS Emblem Badge[^\}]*?\*/\s*\}\s*<View\s*style=\{\{\s*width:\s*30,\s*height:\s*30,\s*borderRadius:\s*7,\s*backgroundColor:\s*\'#DC2626\'[\s\S]*?</Text>\s*</View>', code)
if old_r_badge:
    code = code[:old_r_badge.start()] + code[old_r_badge.end():]
    print("Removed R emblem badge")
else:
    print("WARNING: R emblem badge not matched")

# Header title & subtitle
old_header_title = "{passageDisplayData.title}"
new_header_title = "{test.title || passageDisplayData.title}"
# Only replace the top bar occurrence
code = re.sub(
    r'<Text\s+numberOfLines=\{1\}\s+style=\{\{\s*fontFamily:\s*\'BeVietnamPro_700Bold\',\s*fontSize:\s*15,\s*color:\s*themeStyles\.text,\s*\}\}\s*>\s*\{passageDisplayData\.title\}\s*</Text>',
    r'<Text numberOfLines={1} style={{ fontFamily: \'BeVietnamPro_700Bold\', fontSize: 15, color: themeStyles.text }}>{test.title || passageDisplayData.title}</Text>',
    code
)
code = re.sub(
    r'\{currentPart\?\.label \|\| `Passage \$\{activePartId\}`\} · Câu \{qStart\}–\{qEnd\}',
    r'{currentPart?.label || `${section === \'Reading\' ? \'Reading Passage\' : \'Part\'} ${activePartId}`} · Questions {qStart}–{qEnd}',
    code
)

# 10. Reading Passage N above passage title
old_passage_title = re.search(r'\{\s*/\*\s*Tiêu đề bài đọc lớn & phụ đề dẫn dắt\s*\*/\s*\}\s*<View className="gap-2 border-b border-border/60 pb-4">\s*<Text\s*style=\{\{\s*fontFamily:\s*\'BeVietnamPro_800ExtraBold\',', code)
if old_passage_title:
    new_passage_title = """{/* Tiêu đề bài đọc lớn & phụ đề dẫn dắt */}
              <View className="gap-2 border-b border-border/60 pb-4">
                <Text
                  style={{
                    fontFamily: 'BeVietnamPro_700Bold',
                    fontSize: 13,
                    letterSpacing: 1.2,
                    textTransform: 'uppercase',
                    color: '#8F6E36',
                  }}
                >
                  READING PASSAGE {activePartId}
                </Text>
                <Text
                  style={{
                    fontFamily: 'BeVietnamPro_800ExtraBold',"""
    code = code[:old_passage_title.start()] + new_passage_title + code[old_passage_title.end():]
    print("Added READING PASSAGE header")
else:
    print("WARNING: passage title not matched")

# 11. Listening header pill & labels
code = re.sub(
    r'Question \{qStart\} - \{qEnd\}',
    r'Questions {qStart}–{qEnd}',
    code
)
code = re.sub(
    r'Hết câu hỏi của Section \{activePartId\}',
    r'Hết câu hỏi của Part {activePartId}',
    code
)
code = code.replace(
    '{formatAudioTime(audioDuration || 1800)}',
    "{audioDuration > 0 ? formatAudioTime(audioDuration) : '--:--'}"
)
code = re.sub(
    r'Section \{activePartId \+ 1\} →',
    r'Part {activePartId + 1} →',
    code
)
code = re.sub(
    r'\{test\.parts\?\.\[activePartId - 1\]\?\.label \|\| `Section \$\{activePartId\}`\}',
    r'{test.parts?.[activePartId - 1]?.label || `Part ${activePartId}`}',
    code
)

# 12. Bottom navigator Reading toolbar
code = re.sub(
    r'<Text style=\{\{\s*fontFamily:\s*\'BeVietnamPro_700Bold\',\s*fontSize:\s*12,\s*color:\s*themeStyles\.text\s*\}\}>\s*Practice\s*</Text>',
    r'<Text style={{ fontFamily: \'BeVietnamPro_700Bold\', fontSize: 12, color: themeStyles.text }}>{currentPart?.label || `Reading Passage ${activePartId}`}</Text>',
    code
)
code = re.sub(
    r'P\{p\.id\}',
    r'Passage {p.id}',
    code
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("Saved SourceExamRoom.tsx successfully!")
