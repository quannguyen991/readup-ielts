import re

with open('app/ielts-source-practice.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Normalize line endings in memory to \n
has_crlf = '\r\n' in text
text = text.replace('\r\n', '\n')

old_state = """export default function IeltsSourcePracticeScreen() {
  const { L } = useL();

  // Top level views: 'catalog' | 'collections' | 'detail'
  const [viewMode, setViewMode] = useState<'catalog' | 'collections' | 'detail'>('catalog');

  const [tests, setTests] = useState<TestMeta[]>([]);
  const openTest = (id: string) => void loadTest(id);"""

new_state = """export default function IeltsSourcePracticeScreen() {
  const { L } = useL();
  const mainScrollRef = useRef<ScrollView>(null);

  const scrollToTop = useCallback(() => {
    mainScrollRef.current?.scrollTo({ y: 0, animated: false });
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }
  }, []);

  // Top level views: 'catalog' | 'collections' | 'detail'
  const [viewMode, setViewMode] = useState<'catalog' | 'collections' | 'detail'>('catalog');

  const [tests, setTests] = useState<TestMeta[]>([]);
  const openTest = (id: string) => {
    scrollToTop();
    void loadTest(id);
  };"""

assert old_state in text, 'old_state not found'
text = text.replace(old_state, new_state, 1)

# Add useEffect for viewMode
sub_target = """  const [loading, setLoading] = useState(false);"""
sub_replace = """  const [loading, setLoading] = useState(false);

  useEffect(() => {
    scrollToTop();
  }, [viewMode, scrollToTop]);"""

assert sub_target in text, 'sub_target not found'
text = text.replace(sub_target, sub_replace, 1)

# 2. Add scrollToTop to loadTest
old_load = """    setViewMode('detail');
    setIsExamStarted(startPractice);"""

new_load = """    setViewMode('detail');
    scrollToTop();
    setIsExamStarted(startPractice);"""

assert old_load in text, 'old_load not found'
text = text.replace(old_load, new_load, 1)

# 3. Add ref={mainScrollRef} to ScrollView
old_scroll = """      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 20, paddingBottom: 80 }}>"""
new_scroll = """      <ScrollView ref={mainScrollRef} contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 20, paddingBottom: 80 }}>"""

assert old_scroll in text, 'old_scroll not found'
text = text.replace(old_scroll, new_scroll, 1)

# 4. Fix Cambridge 21 -> 20 in recommended card
text = text.replace('Cambridge IELTS 21 · Reading Test 1', 'Cambridge IELTS 20 · Reading Test 1')
text = text.replace('<FlatCover kind="CAMBRIDGE" num="21"', '<FlatCover kind="CAMBRIDGE" num="20"')
text = text.replace("loadTest('cambridge-21-reading-1')", "loadTest('cambridge-20-reading-1')")

# 5. Fix related tests IDs (cambridge-20-test-N -> cambridge-20-reading-N)
text = text.replace("'cambridge-20-test-1'", "'cambridge-20-reading-1'")
text = text.replace("'cambridge-20-test-2'", "'cambridge-20-reading-2'")
text = text.replace("'cambridge-20-test-3'", "'cambridge-20-reading-3'")
text = text.replace("'cambridge-20-test-4'", "'cambridge-20-reading-4'")

if has_crlf:
    text = text.replace('\n', '\r\n')

with open('app/ielts-source-practice.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print('app/ielts-source-practice.tsx successfully updated!')
