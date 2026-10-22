import os
import re

def search_direct_calls():
    target_dir = 'frontend/src'
    pattern = re.compile(r'(?:fetch|axios\.\w+|api\.\w+)\s*\(', re.IGNORECASE)
    results = []
    for root, dirs, files in os.walk(target_dir):
        for file in files:
            if file.endswith(('.js', '.jsx', '.ts', '.tsx')):
                full_path = os.path.join(root, file)
                if full_path.replace('\\', '/') == 'frontend/src/api.js':
                    continue
                with open(full_path, 'r', encoding='utf-8') as f:
                    for line_num, line in enumerate(f, 1):
                        if pattern.search(line):
                            results.append(f"{full_path}:{line_num}: {line.strip()}")

    print(f"Direct API calls found outside api.js: {len(results)}")
    for r in results[:30]:
        print(r)

if __name__ == '__main__':
    search_direct_calls()
