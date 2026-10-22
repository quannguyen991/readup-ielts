import re

with open('src/components/ielts/SourceExamRoom.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

has_crlf = '\r\n' in text
text = text.replace('\r\n', '\n')

# Check what imports are in SourceExamRoom
print('Has StyleSheet:', 'StyleSheet' in text)
print('Has Pressable:', 'Pressable' in text)
