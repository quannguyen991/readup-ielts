with open('app/practice.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

target = 'color="#2563EB"'
replacement = 'color="#8F6E36"'

assert target in text, "Target not found in practice.tsx"
updated = text.replace(target, replacement, 1)

with open('app/practice.tsx', 'w', encoding='utf-8') as f:
    f.write(updated)

print("Updated app/practice.tsx arrow color to Band 9 primary gold!")
