import glob
import os
import re
import json

def analyze_dto_validations():
    dto_files = glob.glob('backend/src/main/java/com/sporekart/**/dto/*.java', recursive=True) + \
                glob.glob('backend/src/main/java/com/sporekart/**/*Dtos.java', recursive=True)

    dtos = {}

    for fpath in dto_files:
        with open(fpath, 'r', encoding='utf-8') as f:
            lines = f.readlines()

        current_class = None
        current_annotations = []

        for line in lines:
            line_s = line.strip()
            if not line_s or line_s.startswith('//') or line_s.startswith('/*') or line_s.startswith('*'):
                continue

            # Class or record definition
            cm = re.search(r'public\s+(?:static\s+)?(class|record)\s+(\w+)', line_s)
            if cm:
                current_class = cm.group(2)
                dtos[current_class] = {
                    'kind': cm.group(1),
                    'file': fpath,
                    'fields': []
                }
                current_annotations = []
                continue

            # Annotation line
            if line_s.startswith('@'):
                annots = re.findall(r'@\w+(?:\([^)]*\))?', line_s)
                current_annotations.extend(annots)
                continue

            # Field definition
            fm = re.search(r'(?:private|protected|public)\s+([\w<>, ?\[\]]+)\s+(\w+)\s*;', line_s)
            if fm and current_class:
                ftype = fm.group(1).strip()
                fname = fm.group(2).strip()
                dtos[current_class]['fields'].append({
                    'name': fname,
                    'type': ftype,
                    'annotations': list(current_annotations)
                })
                current_annotations = []
                continue

            # If line doesn't match annotation or field, clear annotations if it looks like method or constructor
            if '(' in line_s or '{' in line_s or '}' in line_s:
                current_annotations = []

    print(f"Total DTO definitions identified: {len(dtos)}")

    # Check endpoints inventory to see which endpoints accept @RequestBody without @Valid
    with open('audit_output/endpoints_inventory_accurate.json', 'r', encoding='utf-8') as f:
        endpoints = json.load(f)

    missing_valid = []
    has_valid_count = 0
    body_count = 0

    for ep in endpoints:
        if ep['has_request_body']:
            body_count += 1
            if ep['has_valid']:
                has_valid_count += 1
            else:
                missing_valid.append(ep)

    print(f"Endpoints accepting @RequestBody: {body_count}")
    print(f"Endpoints with @Valid/@Validated: {has_valid_count}")
    print(f"Endpoints MISSING @Valid on @RequestBody: {len(missing_valid)}\n")

    if missing_valid:
        print("Endpoints accepting @RequestBody WITHOUT @Valid:")
        for m in missing_valid:
            print(f"  {m['method']:<6} {m['path']:<45} ({m['controller']}.{m['handler']})")

    # Check request DTOs without validation constraints
    request_dtos_unvalidated = []
    for dname, dinfo in dtos.items():
        if any(dname.endswith(suffix) for suffix in ['Request', 'Payload', 'Command', 'Req']):
            constraints = [f for f in dinfo['fields'] if any(a.startswith(('@Not', '@Min', '@Max', '@Size', '@Pattern', '@Valid', '@Email')) for a in f['annotations'])]
            if not constraints and dinfo['fields']:
                request_dtos_unvalidated.append({
                    'dto': dname,
                    'file': dinfo['file'],
                    'field_count': len(dinfo['fields']),
                    'fields': [f['name'] for f in dinfo['fields']]
                })

    print(f"\nRequest DTOs without any validation constraints: {len(request_dtos_unvalidated)}")
    for r in request_dtos_unvalidated:
        print(f"  {r['dto']:<30} ({r['file']}) -> Fields: {r['fields']}")

    with open('audit_output/dto_validation_audit.json', 'w', encoding='utf-8') as out:
        json.dump({
            'total_dtos': len(dtos),
            'body_endpoints_count': body_count,
            'has_valid_count': has_valid_count,
            'missing_valid_endpoints': missing_valid,
            'unvalidated_request_dtos': request_dtos_unvalidated,
            'dtos': dtos
        }, out, indent=2)

if __name__ == '__main__':
    analyze_dto_validations()
