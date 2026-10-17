import json,re,pathlib,unicodedata
ROOT=pathlib.Path('.local-private/destination')
G=json.loads(pathlib.Path('src/data/seed/bilingual/glossary.json').read_text(encoding='utf-8'))
APP_WORDS={}
for src in ['vocab-topics','vocab-global-success','vocab-for-ielts','vocab-for-ielts-advanced','vocab-listening']:
 for deck in json.loads(pathlib.Path(f'src/data/seed/{src}/index.json').read_text(encoding='utf-8')):
  for item in deck.get('words',[]): APP_WORDS.setdefault(item['word'].strip().lower(),item)
MANUAL_VI={
 'board game':'trò chơi bàn cờ','captain':'đội trưởng; thuyền trưởng','cheat':'gian lận','classical music':'nhạc cổ điển','folk music':'nhạc dân gian','have fun':'vui chơi','video game':'trò chơi điện tử',
 'instruction':'chỉ dẫn; hướng dẫn','make progress':'tiến bộ','make sure':'đảm bảo; chắc chắn','take an exam':'dự thi; làm bài kiểm tra',
 'apologise':'xin lỗi','boyfriend':'bạn trai','divorced':'đã ly hôn','girlfriend':'bạn gái','guest':'khách','loving':'giàu tình cảm','loyal':'trung thành','owe':'nợ',
 'mobile phone':'điện thoại di động','swear':'chửi thề; thề','whisper':'thì thầm','arrest':'bắt giữ','identity card':'căn cước; chứng minh thư','protest':'phản đối; biểu tình','rob':'cướp','steal':'trộm; ăn cắp',
 'ambition':'tham vọng; hoài bão','bank account':'tài khoản ngân hàng','impress':'gây ấn tượng','chew':'nhai','chop':'chặt; thái','cough':'ho','have an operation':'phẫu thuật','spicy':'cay; nhiều gia vị','stir':'khuấy','vitamin':'vi chất dinh dưỡng thiết yếu',
 'sleeve':'ống tay áo','striped':'có sọc','locate':'xác định vị trí','thunder':'sấm','amusing':'hài hước','annoy':'làm phiền; chọc tức','bad-tempered':'nóng tính','depressed':'chán nản','glad':'vui mừng','naughty':'nghịch ngợm','ridiculous':'nực cười','romantic':'lãng mạn','sense of humour':'khiếu hài hước','shy':'nhút nhát','tell a joke':'kể chuyện cười',
 'deny':'phủ nhận','insult':'xúc phạm','praise':'khen ngợi','pretend':'giả vờ',
 'rink':'sân trượt băng','racket':'vợt','athletics':'điền kinh','game':'trò chơi; trận đấu','half time':'giờ nghỉ giữa trận','finale':'màn cuối; phần kết','bat':'gậy (thể thao)','motor':'động cơ',
 'talk show':'chương trình trò chuyện','quiz show':'chương trình đố vui','game show':'chương trình trò chơi truyền hình','announcer':'phát thanh viên; người dẫn chương trình','commentator':'bình luận viên','fault':'lỗi; trách nhiệm','please':'làm hài lòng','likeable':'đáng mến','bulletin':'bản tin','newsflash':'tin khẩn',
 'persecute':'ngược đãi','infamous':'tai tiếng','robber':'kẻ cướp','thief':'kẻ trộm','vandal':'kẻ phá hoại','hooligan':'kẻ côn đồ','bystander':'người chứng kiến; người qua đường','solicitor':'luật sư',
 'plaster':'miếng băng dán y tế','bandage':'băng gạc','saucer':'đĩa lót tách',
 'grate':'nạo; bào','vegan':'người ăn thuần chay','bake':'nướng','fry':'chiên; rán','takeaway':'đồ ăn mua mang đi','roast':'quay; nướng','kettle':'ấm đun nước','teapot':'ấm trà','cook':'nấu ăn; đầu bếp','freezer':'ngăn đông; tủ đông','fridge':'tủ lạnh','frozen':'đông lạnh','hob':'bếp nấu','whisk':'đánh trứng; phới lồng','soft drink':'nước ngọt','fizzy drink':'nước có ga',
 'certificate':'chứng chỉ; giấy chứng nhận','classmate':'bạn cùng lớp','prefect':'lớp trưởng; học sinh phụ trách nề nếp','mist':'sương mù nhẹ','drizzle':'mưa phùn','checkout':'quầy thanh toán','bill':'hóa đơn','entertain':'giải trí','till':'máy tính tiền; quầy thu ngân','cartoon':'phim hoạt hình; tranh biếm họa','blouse':'áo kiểu nữ','glimpse':'thoáng thấy','sack':'sa thải; bao tải'
}
PAT=re.compile(r'^([A-Za-z][A-Za-z\'’&/ -]{1,48}?)\s*\(\s*(n\s+phr|v\s+phr|phr\s+v|n|v|adj|adv|ad|prep|conj|pron|det|exclam|aux)\s*\)\s*$',re.I)
B1={3:'Fun and games',6:'Learning and doing',9:'Coming and going',12:'Friends and relations',15:'Buying and selling',18:'Inventions and discoveries',21:'Sending and receiving',24:'People and daily life',27:'Working and earning',30:'Body and lifestyle',33:'Creating and building',36:'Nature and the universe',39:'Laughing and crying',42:'Problems and solutions'}
B2={2:'Travel and transport',4:'Hobbies, sport and games',6:'Science and technology',8:'The media',10:'People and society',12:'The law and crime',14:'Health and fitness',16:'Food and drink',18:'Education and learning',20:'Weather and the environment',22:'Money and shopping',24:'Entertainment',26:'Fashion and design',28:'Work and business'}

def norm(s):
 return unicodedata.normalize('NFKC',s).replace('’',"'").strip().lower()
def build(course, units, pages, start_unit):
 raw=json.loads((ROOT/f'{course}-reference-ocr.json').read_text(encoding='utf-8'))
 data={u:[] for u in units}; current=start_unit
 for p in sorted((int(k) for k in raw), key=int):
  if p not in pages: continue
  lines=raw[str(p)].splitlines()
  for line in lines:
   s=line.strip()
   um=re.fullmatch(r'Unit\s*(\d+)',s,re.I)
   if um and int(um.group(1)) in data: current=int(um.group(1)); continue
   m=PAT.fullmatch(s)
   if not m or current not in data: continue
   word=re.sub(r'\s+',' ',m.group(1)).strip(" '-’")
   key=norm(word)
   if not re.search(r'[a-z]',key) or len(key)<2 or len(key)>45: continue
   # Correct common OCR slips and discard isolated scanning artefacts.
   key={'qualfication':'qualification','sik':'silk','ink':'link' if 'link' in str(raw[str(p)]).lower() else 'ink'}.get(key,key)
   word=key
   pos=m.group(2).lower().replace('ad','adjective') if m.group(2).lower()=='ad' else m.group(2).lower()
   pos={'n':'noun','v':'verb','adj':'adjective','adv':'adverb','ad':'adjective','n phr':'noun phrase','v phr':'verb phrase','phr v':'phrasal verb','prep':'preposition','conj':'conjunction','pron':'pronoun','det':'determiner','exclam':'exclamation','aux':'auxiliary verb'}.get(pos,pos)
   data[current].append((word,pos))
 out=[]
 for u,title in units.items():
  words=[]; seen=set()
  for w,pos in data[u]:
   key=norm(w)
   if key in seen: continue
   seen.add(key)
   gloss=G.get(key); existing=APP_WORDS.get(key,{})
   vi=gloss[0].strip() if gloss and len(gloss)>0 else existing.get('meaningVi','').strip() or MANUAL_VI.get(key,'')
   if vi in ('',key): vi=''
   # A neutral, newly written practice sentence provides a usable context without copying workbook examples.
   topic=title.lower()
   if pos in ('noun','noun phrase'):
    example=f'The class discussed {w} while exploring {topic}.'
   elif pos=='adjective':
    example=f'The class used “{w}” to describe a situation connected with {topic}.'
   elif pos in ('adverb','preposition','conjunction','determiner','pronoun'):
    example=f'The class practised using “{w}” in a sentence about {topic}.'
   else:
    example=f'The class used “{w}” in a new sentence while exploring {topic}.'
   words.append({'word':w,'pos':pos,'ipa':existing.get('ipa',''),'meaningVi':vi or '','definitionEn':existing.get('definitionEn',''),'example':existing.get('example') or example,'collocation':existing.get('collocation',''),'band':'5-6' if course=='b1' else '6-7','synonyms':existing.get('synonyms',[]),'antonyms':existing.get('antonyms',[])})
  out.append({'slug':f'destination-{course}-unit-{u}','name':f'Destination {course.upper()} · Unit {u}: {title}','nameVi':f'Destination {course.upper()} · Bài {u}: {title}','blurb':f'{len(words)} headwords from the unit vocabulary reference.','unit':u,'course':course,'words':words})
 print(course, 'decks',len(out),'words',sum(len(x['words']) for x in out),'units',[(x['unit'],len(x['words'])) for x in out])
 return out
b1=build('b1',B1,set(range(183,201)),3)
b2=build('b2',B2,set(range(187,200)),2)
# OCR line order sometimes places a right-column headword just before its unit label.
# Keep these easily recognised items with the unit named by their surrounding section.
for source_unit, target_unit, terms in [(20,22,['checkout']),(14,16,['saucer','dish'])]:
 source=next(x for x in b2 if x['unit']==source_unit); target=next(x for x in b2 if x['unit']==target_unit)
 moved=[w for w in source['words'] if w['word'].lower() in terms]
 source['words']=[w for w in source['words'] if w['word'].lower() not in terms]
 target['words'].extend(moved)
# Preserve English definitions from the OCR glossary is intentionally deferred here; the compact offline glossary supplies Vietnamese meanings where available.
for course,rows in [('b1',b1),('b2',b2)]:
 (pathlib.Path('src/data/seed/destination')/f'{course}.json').parent.mkdir(parents=True,exist_ok=True)
 (pathlib.Path('src/data/seed/destination')/f'{course}.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding='utf-8')
