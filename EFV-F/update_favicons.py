import os
import re

tag = '    <link rel="icon" type="image/svg+xml" href="/favicon.svg">\n'
root = r'C:\Users\USER\Desktop\VHA\EFV-F\public'
files = [os.path.join(root, 'index.html')]
pages_dir = os.path.join(root, 'pages')
if os.path.exists(pages_dir):
    files += [os.path.join(pages_dir, f) for f in os.listdir(pages_dir) if f.endswith('.html')]

count = 0
for file_path in files:
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        if 'rel="icon"' in content:
            continue
        new_content = re.sub(r'(<title>.*?</title>)', r'\1\n' + tag, content, flags=re.IGNORECASE)
        if new_content != content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            count += 1
            print(f'Updated: {file_path}')
    except Exception as e:
        print(f'Error updating {file_path}: {e}')

print(f'\nTotal updated: {count}')
