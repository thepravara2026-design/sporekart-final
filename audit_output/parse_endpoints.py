import re
import glob
import os
import json

def parse_controllers():
    controllers = glob.glob('backend/src/main/java/com/sporekart/**/*Controller.java', recursive=True)
    endpoints = []
    
    for cpath in sorted(controllers):
        cname = os.path.basename(cpath)
        with open(cpath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Class level RequestMapping
        class_rm = re.search(r'@RequestMapping\((?:value\s*=\s*)?["\']([^"\']+)["\']\)', content)
        base_path = class_rm.group(1) if class_rm else ''
        
        # Class level PreAuthorize
        class_pa = re.search(r'@PreAuthorize\(["\']([^"\']+)["\']\)', content)
        class_auth = class_pa.group(1) if class_pa else None
        
        # Split methods by looking for mapping annotations
        lines = content.split('\n')
        i = 0
        while i < len(lines):
            line = lines[i].strip()
            if any(line.startswith(m) for m in ['@GetMapping', '@PostMapping', '@PutMapping', '@DeleteMapping', '@PatchMapping', '@RequestMapping']):
                mapping_block = []
                while i < len(lines) and not ('public ' in lines[i] or 'ResponseEntity' in lines[i] or 'ApiResponse' in lines[i]):
                    mapping_block.append(lines[i].strip())
                    i += 1
                if i < len(lines):
                    mapping_block.append(lines[i].strip()) # the method signature line
                
                full_block = ' '.join(mapping_block)
                
                # Extract HTTP method
                http_method = 'GET'
                if '@PostMapping' in full_block:
                    http_method = 'POST'
                elif '@PutMapping' in full_block:
                    http_method = 'PUT'
                elif '@DeleteMapping' in full_block:
                    http_method = 'DELETE'
                elif '@PatchMapping' in full_block:
                    http_method = 'PATCH'
                elif '@RequestMapping' in full_block:
                    m = re.search(r'method\s*=\s*RequestMethod\.(\w+)', full_block)
                    if m:
                        http_method = m.group(1)
                    else:
                        http_method = 'GET'
                        
                # Extract subpath
                subpath = ''
                path_match = re.search(r'@(?:GetMapping|PostMapping|PutMapping|DeleteMapping|PatchMapping|RequestMapping)\((?:(?:value|path)\s*=\s*)?["\']([^"\']+)["\']', full_block)
                if path_match:
                    subpath = path_match.group(1)
                elif re.search(r'@(?:GetMapping|PostMapping|PutMapping|DeleteMapping|PatchMapping|RequestMapping)\s*\(?\s*\)?', full_block):
                    subpath = ''
                    
                full_path = (base_path.rstrip('/') + '/' + subpath.lstrip('/')).rstrip('/')
                if not full_path:
                    full_path = '/'
                
                # Check method-level PreAuthorize
                method_pa_match = re.search(r'@PreAuthorize\(["\']([^"\']+)["\']\)', full_block)
                method_auth = method_pa_match.group(1) if method_pa_match else None
                
                auth = method_auth or class_auth or 'PERMIT_ALL_OR_CONFIG'
                
                # Method signature & params
                sig_match = re.search(r'public\s+([^\(]+)\s+(\w+)\s*\((.*?)\)', full_block)
                return_type = 'void'
                method_name = 'unknown'
                param_str = ''
                if sig_match:
                    return_type = sig_match.group(1).strip()
                    method_name = sig_match.group(2).strip()
                    param_str = sig_match.group(3).strip()
                
                endpoints.append({
                    'controller': cname,
                    'method': http_method,
                    'path': full_path,
                    'handler': method_name,
                    'return_type': return_type,
                    'params': param_str,
                    'auth': auth,
                    'class_auth': class_auth,
                    'method_auth': method_auth
                })
            i += 1
            
    print(f"Total endpoints discovered: {len(endpoints)}")
    with open('audit_output/endpoints_inventory.json', 'w', encoding='utf-8') as out:
        json.dump(endpoints, out, indent=2)
        
    for ep in endpoints:
        print(f"{ep['method']:<6} {ep['path']:<50} {ep['auth']:<35} {ep['controller']}")

if __name__ == '__main__':
    parse_controllers()
