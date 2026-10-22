import zipfile
import re

with zipfile.ZipFile('.local-private/ielts-ocr/cambridge-reference.xlsx') as z:
    rels = z.read('xl/worksheets/_rels/sheet1.xml.rels').decode('utf-8')
    targets = re.findall(r'Target="([^"]+)"', rels)
    print('Hyperlink targets count:', len(targets))
    for t in targets:
        if any(f'cambridge-{v}' in t for v in [10, 11, 12, 13, 16]):
            print(' ', t)
