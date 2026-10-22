import re

with open('src/data/ielts-cam-vol-bank.ts', 'r', encoding='utf-8') as f:
    text = f.read()

ids = re.findall(r'"id":\s*"([^"]+)"', text)
print('Total packages in CAM_VOL_TEST_PACKAGES:', len(ids))
for i in ids:
    print('  ', i)
