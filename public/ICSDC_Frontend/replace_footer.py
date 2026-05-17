import os, re, glob

ROOT = os.path.dirname(os.path.abspath(__file__))

# Match the entire <footer ...>...</footer> block (the site footer)
PATTERN = re.compile(
    r'<footer\s[^>]*class="[^"]*site-footer[^"]*"[^>]*>.*?</footer>',
    re.DOTALL
)

REPLACEMENT = '<footer class="site-footer" id="site-footer" role="contentinfo"></footer>'

html_files = glob.glob(os.path.join(ROOT, '*.html'))
changed, skipped = [], []

for path in html_files:
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    new_content, count = PATTERN.subn(REPLACEMENT, content)
    if count:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        changed.append(os.path.basename(path))
    else:
        skipped.append(os.path.basename(path))

print(f"Updated ({len(changed)}):")
for n in sorted(changed): print(f"  {n}")
print(f"\nSkipped / no match ({len(skipped)}):")
for n in sorted(skipped): print(f"  {n}")
