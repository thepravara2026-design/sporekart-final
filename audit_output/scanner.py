import glob
import os
import re
import json

def clean_paths(val_str):
    if not val_str:
        return ['']
    val_str = val_str.strip()
    if val_str.startswith('{') and val_str.endswith('}'):
        inner = val_str[1:-1]
        paths = []
        for s in inner.split(','):
            s_clean = s.strip().strip('"\'')
            if s_clean:
                paths.append(s_clean)
        return paths if paths else ['']
    m = re.search(r'["\']([^"\']+)["\']', val_str)
    if m:
        return [m.group(1)]
    return ['']

def parse_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    in_class = False
    class_name = ''
    base_paths = ['']
    class_auth = None
    
    current_annotations = []
    endpoints = []
    
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        i += 1
        
        # Check class declaration
        if not in_class:
            if line.startswith('@RequestMapping'):
                if '(' in line:
                    full_annot = line
                    while not full_annot.endswith(')') and i < len(lines):
                        full_annot += ' ' + lines[i].strip()
                        i += 1
                    m = re.search(r'@RequestMapping\((.*)\)', full_annot)
                    if m:
                        base_paths = clean_paths(m.group(1))
                else:
                    base_paths = ['']
            elif line.startswith('@PreAuthorize'):
                full_annot = line
                while not full_annot.endswith(')') and i < len(lines):
                    full_annot += ' ' + lines[i].strip()
                    i += 1
                m = re.search(r'@PreAuthorize\((["\'])(.*?)\1\)', full_annot)
                if m:
                    class_auth = m.group(2)
            elif 'class ' in line and ('public ' in line or '@RestController' in line or True):
                m = re.search(r'class\s+(\w+)', line)
                if m:
                    class_name = m.group(1)
                    in_class = True
            continue
            
        # Inside class
        if line.startswith('@GetMapping') or line.startswith('@PostMapping') or line.startswith('@PutMapping') or \
           line.startswith('@DeleteMapping') or line.startswith('@PatchMapping') or line.startswith('@RequestMapping'):
            full_annot = line
            paren_count = full_annot.count('(') - full_annot.count(')')
            while paren_count > 0 and i < len(lines):
                next_line = lines[i].strip()
                i += 1
                full_annot += ' ' + next_line
                paren_count += next_line.count('(') - next_line.count(')')
            current_annotations.append(full_annot)
            continue
            
        if line.startswith('@PreAuthorize') or line.startswith('@ResponseStatus') or line.startswith('@Secured'):
            full_annot = line
            paren_count = full_annot.count('(') - full_annot.count(')')
            while paren_count > 0 and i < len(lines):
                next_line = lines[i].strip()
                i += 1
                full_annot += ' ' + next_line
                paren_count += next_line.count('(') - next_line.count(')')
            current_annotations.append(full_annot)
            continue
            
        if current_annotations and ('public ' in line):
            full_sig = line
            paren_count = full_sig.count('(') - full_sig.count(')')
            while (paren_count > 0 or not ('{' in full_sig or ';' in full_sig)) and i < len(lines):
                next_line = lines[i].strip()
                i += 1
                full_sig += ' ' + next_line
                paren_count += next_line.count('(') - next_line.count(')')
                if '{' in next_line or ';' in next_line:
                    break
            
            # parse method name and return type
            m_sig = re.search(r'public\s+([^\(]+?)\s+(\w+)\s*\((.*)\)', full_sig, re.DOTALL)
            if m_sig:
                ret_type = ' '.join(m_sig.group(1).split())
                m_name = m_sig.group(2).strip()
                params = ' '.join(m_sig.group(3).split())
                
                # Check method auth
                m_auth = class_auth or 'PERMIT_ALL_OR_CONFIG'
                for a in current_annotations:
                    if a.startswith('@PreAuthorize'):
                        m = re.search(r'@PreAuthorize\((["\'])(.*?)\1\)', a)
                        if m:
                            m_auth = m.group(2)
                
                for a in current_annotations:
                    if any(a.startswith(p) for p in ['@GetMapping', '@PostMapping', '@PutMapping', '@DeleteMapping', '@PatchMapping', '@RequestMapping']):
                        annot_name = re.match(r'@(\w+)', a).group(1)
                        arg_str = ''
                        m_arg = re.search(r'@\w+\((.*)\)', a, re.DOTALL)
                        if m_arg:
                            arg_str = m_arg.group(1).strip()
                        
                        methods = ['GET']
                        if annot_name == 'PostMapping':
                            methods = ['POST']
                        elif annot_name == 'PutMapping':
                            methods = ['PUT']
                        elif annot_name == 'DeleteMapping':
                            methods = ['DELETE']
                        elif annot_name == 'PatchMapping':
                            methods = ['PATCH']
                        elif annot_name == 'RequestMapping':
                            m_methods = re.findall(r'RequestMethod\.(\w+)', arg_str)
                            methods = m_methods if m_methods else ['GET']
                        
                        subpaths = ['']
                        if arg_str:
                            path_part = re.sub(r'method\s*=\s*[^,]+,?', '', arg_str).strip()
                            path_part = re.sub(r'(?:value|path)\s*=\s*', '', path_part).strip()
                            subpaths = clean_paths(path_part)
                        
                        for bp in base_paths:
                            for sp in subpaths:
                                bp_c = bp.rstrip('/')
                                sp_c = sp.lstrip('/')
                                full_p = (bp_c + '/' + sp_c).rstrip('/')
                                if not full_p:
                                    full_p = '/'
                                for meth in methods:
                                    endpoints.append({
                                        'controller': class_name,
                                        'file': filepath,
                                        'method': meth,
                                        'path': full_p,
                                        'handler': m_name,
                                        'auth': m_auth,
                                        'ret': ret_type,
                                        'params': params,
                                        'has_request_body': '@RequestBody' in params,
                                        'has_valid': '@Valid' in params or '@Validated' in params
                                    })
            current_annotations = []

    return endpoints

def main():
    controllers = glob.glob('backend/src/main/java/com/sporekart/**/*Controller.java', recursive=True)
    all_eps = []
    for c in sorted(controllers):
        eps = parse_file(c)
        all_eps.extend(eps)
        print(f'{os.path.basename(c):<32}: {len(eps)} endpoints')

    print(f'\nTotal endpoints discovered across {len(controllers)} controllers: {len(all_eps)}')
    with open('audit_output/endpoints_inventory_accurate.json', 'w', encoding='utf-8') as out:
        json.dump(all_eps, out, indent=2)

if __name__ == '__main__':
    main()
