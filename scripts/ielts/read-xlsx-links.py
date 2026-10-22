import zipfile
import re

with zipfile.ZipFile('.local-private/ielts-ocr/cambridge-reference.xlsx') as z:
    rels = z.read('xl/worksheets/_rels/sheet1.xml.rels').decode('utf-8')
    targets = re.findall(r'Target="([^"]+)"', rels)
    print('Hyperlink targets count:', len(targets))
    for t in targets[:15]:
        print(' ', t)
