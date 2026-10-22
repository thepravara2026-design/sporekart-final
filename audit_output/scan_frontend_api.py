import glob
import re
import json

def scan_frontend_api_calls():
    files = glob.glob('frontend/src/**/*.{js,jsx,ts,tsx}', recursive=True)
    calls = []
    
    # Pattern to detect api calls: api.get, api.post, api.put, api.delete, api.patch, axios...
    call_pattern = re.compile(r'(?:api|axios)\s*\.\s*(get|post|put|delete|patch)\s*\(\s*([`\'\"][^`\'\"]+[`\'\"])', re.IGNORECASE)
    fetch_pattern = re.compile(r'fetch\s*\(\s*([`\'\"][^`\'\"]+[`\'\"])', re.IGNORECASE)

    for fpath in files:
        with open(fpath, 'r', encoding='utf-8') as f:
            content = f.read()

        for m in call_pattern.finditer(content):
            method = m.group(1).upper()
            raw_url = m.group(2).strip('`\'"')
            calls.append({
                'file': fpath,
                'method': method,
                'raw_url': raw_url
            })

        for m in fetch_pattern.finditer(content):
            raw_url = m.group(1).strip('`\'"')
            calls.append({
                'file': fpath,
                'method': 'FETCH',
                'raw_url': raw_url
            })

    print(f"Total frontend API call invocations discovered: {len(calls)}")
    with open('audit_output/frontend_api_calls.json', 'w', encoding='utf-8') as out:
        json.dump(calls, out, indent=2)

    unique_urls = sorted(list(set(f"{c['method']} {c['raw_url']}" for c in calls)))
    print(f"Unique frontend API call patterns: {len(unique_urls)}")
    for u in unique_urls:
        print(u)

if __name__ == '__main__':
    scan_frontend_api_calls()
