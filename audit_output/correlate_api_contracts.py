import re
import json
import os

def load_backend_endpoints():
    with open('audit_output/endpoints_inventory_accurate.json', 'r', encoding='utf-8') as f:
        return json.load(f)

def parse_frontend_api_calls():
    with open('frontend/src/api.js', 'r', encoding='utf-8') as f:
        lines = f.readlines()

    fe_endpoints = []
    current_obj = 'api'

    for line in lines:
        line_s = line.strip()
        m_obj = re.search(r'export const (\w+) = \{', line_s)
        if m_obj:
            current_obj = m_obj.group(1)

        # Look for method definitions:
        # e.g.: getProducts: (...) => api.get('/path', ...)
        # or createOrder: (...) => api.post('/orders', ...)
        # or downloadInvoice: (id) => api.get(`/orders/${id}/invoice`, ...)
        m_call = re.search(r'(\w+)\s*:\s*\(([^)]*)\)\s*=>\s*(?:api\.(get|post|put|delete|patch)\(([^,\)]+)|.*api\.(get|post|put|delete|patch)\(([^,\)]+))', line_s)
        if m_call:
            fn_name = m_call.group(1)
            fn_args = m_call.group(2).strip()
            http_method = (m_call.group(3) or m_call.group(5)).upper()
            raw_url_expr = (m_call.group(4) or m_call.group(6)).strip()
            
            clean_url = raw_url_expr.strip('`\'"')
            norm_url = re.sub(r'\$\{[^}]+\}', '{var}', clean_url)
            fe_endpoints.append({
                'api_object': current_obj,
                'client_method': fn_name,
                'client_params': fn_args,
                'method': http_method,
                'raw_url': clean_url,
                'normalized_url': norm_url
            })
        else:
            # Maybe multiline api call
            m_single = re.search(r'api\.(get|post|put|delete|patch)\(\s*([`\'\"][^`\'\"]+[`\'\"])', line_s)
            if m_single and not any(ep['raw_url'] in line_s for ep in fe_endpoints[-1:] if fe_endpoints):
                http_method = m_single.group(1).upper()
                clean_url = m_single.group(2).strip('`\'"')
                norm_url = re.sub(r'\$\{[^}]+\}', '{var}', clean_url)
                fe_endpoints.append({
                    'api_object': current_obj,
                    'client_method': 'unknown',
                    'client_params': '',
                    'method': http_method,
                    'raw_url': clean_url,
                    'normalized_url': norm_url
                })

    return fe_endpoints

def normalize_backend_path(path):
    norm = re.sub(r'\{[^}]+\}', '{var}', path)
    return norm

def correlate():
    be_eps = load_backend_endpoints()
    fe_eps = parse_frontend_api_calls()

    print(f"Loaded {len(be_eps)} backend endpoint entries.")
    print(f"Loaded {len(fe_eps)} frontend API definitions from api.js.\n")

    be_map = {}
    for be in be_eps:
        norm_p = normalize_backend_path(be['path'])
        key = (be['method'], norm_p)
        be_map.setdefault(key, []).append(be)

    matched = []
    unmatched_fe = []

    for fe in fe_eps:
        key = (fe['method'], fe['normalized_url'])
        if key in be_map:
            matched.append((fe, be_map[key]))
        else:
            # Check alternative method or without leading /
            alt_matches = []
            for (bm, bp), b_list in be_map.items():
                if bp == fe['normalized_url']:
                    alt_matches.append((bm, bp, b_list))
                elif bp.rstrip('/') == fe['normalized_url'].rstrip('/'):
                    alt_matches.append((bm, bp, b_list))
            if alt_matches:
                unmatched_fe.append((fe, 'METHOD_OR_SLASH_MISMATCH', alt_matches))
            else:
                unmatched_fe.append((fe, 'NOT_FOUND_IN_BACKEND', []))

    print(f"--- MATCH RESULTS ---")
    print(f"Directly Matched Frontend Calls: {len(matched)}")
    print(f"Unmatched / Potential Discrepancies in Frontend Calls: {len(unmatched_fe)}\n")

    if unmatched_fe:
        print("Detail of Unmatched Frontend Calls:")
        for fe, reason, alts in unmatched_fe:
            print(f"  [{reason}] {fe['api_object']}.{fe['client_method']}: {fe['method']} {fe['raw_url']}")
            if alts:
                for alt_m, alt_p, _ in alts:
                    print(f"      -> Backend has: {alt_m} {alt_p}")

    consumed_be_keys = set()
    for fe, be_list in matched:
        for b in be_list:
            consumed_be_keys.add((b['method'], b['path']))

    unconsumed_be = []
    for be in be_eps:
        if (be['method'], be['path']) not in consumed_be_keys:
            unconsumed_be.append(be)

    print(f"\nTotal Backend Endpoints Unconsumed by frontend/api.js: {len(unconsumed_be)}")

    report = {
        'total_backend_endpoints': len(be_eps),
        'total_frontend_api_calls': len(fe_eps),
        'matched_count': len(matched),
        'unmatched_frontend': [
            {
                'api_object': fe['api_object'],
                'client_method': fe['client_method'],
                'method': fe['method'],
                'url': fe['raw_url'],
                'reason': reason,
                'alternatives': [{'method': a[0], 'path': a[1]} for a in alts]
            }
            for fe, reason, alts in unmatched_fe
        ],
        'unconsumed_backend': [
            {
                'method': b['method'],
                'path': b['path'],
                'controller': b['controller'],
                'handler': b['handler'],
                'auth': b['auth']
            }
            for b in unconsumed_be
        ]
    }

    with open('audit_output/contract_correlation.json', 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2)

if __name__ == '__main__':
    correlate()
