import os, re

preauths = {}
for root, dirs, files in os.walk('backend/src/main/java'):
    for f in files:
        if f.endswith('.java'):
            p = os.path.join(root, f)
            with open(p, encoding='utf-8') as fh:
                content = fh.read()
                matches = re.findall(r'@PreAuthorize\s*\(\s*\"([^\"]+)\"\s*\)', content)
                if matches:
                    preauths[f] = matches

print("Found @PreAuthorize in files:")
for f, ms in sorted(preauths.items()):
    print(f"  {f:35}: {set(ms)}")
