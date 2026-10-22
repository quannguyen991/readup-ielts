import os, re

for root, dirs, files in os.walk('.'):
    if any(x in root for x in ['node_modules', '.git', '.local-private', '.gemini']):
        continue
    for f in files:
        if f.endswith(('.tsx', '.ts')):
            fp = os.path.join(root, f)
            with open(fp, 'r', encoding='utf-8', errors='ignore') as fl:
                c = fl.read()
                if re.search(r'[\'"`]/ielts[\'"`]', c):
                    print(fp)
