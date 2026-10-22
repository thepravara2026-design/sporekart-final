import json

def analyze():
    with open('audit_output/contract_correlation.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

    unconsumed = data['unconsumed_backend']
    print(f"Total unconsumed backend endpoints: {len(unconsumed)}\n")

    # Group by category
    categories = {
        'Webhooks': [],
        'SEO & Sitemaps': [],
        'Public Catalog / Content Aliases': [],
        'Admin Management / Operational': [],
        'Customer Alternative Endpoints': [],
        'Other': []
    }

    for u in unconsumed:
        path = u['path']
        ctrl = u['controller']
        if 'Webhook' in ctrl or 'webhook' in path:
            categories['Webhooks'].append(u)
        elif 'Seo' in ctrl or 'sitemap' in path or 'robots' in path:
            categories['SEO & Sitemaps'].append(u)
        elif path.startswith('/catalog/') or path.startswith('/products') or path.startswith('/content/'):
            categories['Public Catalog / Content Aliases'].append(u)
        elif path.startswith('/admin') or 'Admin' in ctrl:
            categories['Admin Management / Operational'].append(u)
        elif path.startswith('/customer') or path.startswith('/training') or path.startswith('/wallet') or path.startswith('/orders'):
            categories['Customer Alternative Endpoints'].append(u)
        else:
            categories['Other'].append(u)

    for cat, items in categories.items():
        print(f"=== {cat} ({len(items)}) ===")
        for it in items:
            print(f"  {it['method']:<6} {it['path']:<50} {it['controller']}.{it['handler']}")
        print()

if __name__ == '__main__':
    analyze()
