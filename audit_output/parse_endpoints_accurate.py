import re
import glob
import os
import json

def parse_controller_file(cpath):
    with open(cpath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Separate class header from class body
    class_match = re.search(r'(@RestController.*?public\s+class\s+(\w+)[^{]*)\{(.*)', content, re.DOTALL)
    if not class_match:
        class_match = re.search(r'(public\s+class\s+(\w+)[^{]*)\{(.*)', content, re.DOTALL)
        if not class_match:
            return []

    header = class_match.group(1)
    class_name = class_match.group(2)
    body = class_match.group(3)

    # Base path from header: check for single string or array of strings
    base_paths = []
    array_rm = re.search(r'@RequestMapping\((?:(?:value|path)\s*=\s*)?\{([^}]+)\}', header)
    if array_rm:
        base_paths = [s.strip().strip('"\'') for s in array_rm.group(1).split(',')]
    else:
        base_rm = re.search(r'@RequestMapping\((?:(?:value|path)\s*=\s*)?["\']([^"\']+)["\']', header)
        if base_rm:
            base_paths = [base_rm.group(1)]
        else:
            base_paths = ['']

    # Class-level PreAuthorize
    class_pa = re.search(r'@PreAuthorize\((["\'])(.*?)\1\)', header)
    class_auth = class_pa.group(2) if class_pa else None

    # Find method declaration blocks
    # Match from @Mapping through 'public ... methodName(...) ... {'
    method_blocks = re.findall(
        r'(@(?:GetMapping|PostMapping|PutMapping|DeleteMapping|PatchMapping|RequestMapping)[^{;]*?public\s+[^{]+?\{)',
        body,
        re.DOTALL
    )

    endpoints = []
    for full_decl in method_blocks:
        # Extract method signature
        sig_match = re.search(r'public\s+([^\(]+?)\s+(\w+)\s*\((.*?)\)\s*(?:throws\s+[\w,\s]+)?\s*\{', full_decl, re.DOTALL)
        if not sig_match:
            continue
        return_type = ' '.join(sig_match.group(1).split())
        method_name = sig_match.group(2).strip()
        params_raw = sig_match.group(3).strip()

        # Extract mapping annotations in this declaration
        # Could be multiple annotations or single
        mappings = re.findall(r'@(GetMapping|PostMapping|PutMapping|DeleteMapping|PatchMapping|RequestMapping)(?:\(([^\)]*(?:\([^\)]*\))*[^\)]*)\))?', full_decl)
        if not mappings:
            # Maybe @GetMapping with no parens
            no_parens = re.findall(r'@(GetMapping|PostMapping|PutMapping|DeleteMapping|PatchMapping|RequestMapping)(?!\()', full_decl)
            mappings = [(m, '') for m in no_parens]

        # Check method-level PreAuthorize
        method_pa = re.search(r'@PreAuthorize\((["\'])(.*?)\1\)', full_decl)
        effective_auth = method_pa.group(2) if method_pa else (class_auth if class_auth else 'PERMIT_ALL_OR_SECURITY_CONFIG')

        for annot_type, args in mappings:
            http_methods = ['GET']
            if annot_type == 'PostMapping':
                http_methods = ['POST']
            elif annot_type == 'PutMapping':
                http_methods = ['PUT']
            elif annot_type == 'DeleteMapping':
                http_methods = ['DELETE']
            elif annot_type == 'PatchMapping':
                http_methods = ['PATCH']
            elif annot_type == 'RequestMapping':
                # check method = {RequestMethod.PATCH, RequestMethod.PUT}
                methods_match = re.findall(r'RequestMethod\.(\w+)', args or '')
                if methods_match:
                    http_methods = methods_match
                else:
                    http_methods = ['GET']

            # Extract subpaths
            subpaths = ['']
            if args:
                arr_match = re.search(r'(?:(?:value|path)\s*=\s*)?\{([^}]+)\}', args)
                if arr_match:
                    subpaths = [s.strip().strip('"\'') for s in arr_match.group(1).split(',')]
                else:
                    path_match = re.search(r'(?:(?:value|path)\s*=\s*)?["\']([^"\']+)["\']', args)
                    if path_match:
                        subpaths = [path_match.group(1)]

            for bp in base_paths:
                for sp in subpaths:
                    bp_clean = bp.rstrip('/')
                    sp_clean = sp.lstrip('/')
                    full_path = (bp_clean + '/' + sp_clean).rstrip('/')
                    if not full_path:
                        full_path = '/'

                    # Parse parameters
                    params_list = []
                    if params_raw:
                        depth = 0
                        current = []
                        for char in params_raw:
                            if char in '<(':
                                depth += 1
                            elif char in '>)':
                                depth -= 1
                            if char == ',' and depth == 0:
                                params_list.append(''.join(current).strip())
                                current = []
                            else:
                                current.append(char)
                        if current:
                            params_list.append(''.join(current).strip())

                    has_request_body = any('@RequestBody' in p for p in params_list)
                    body_type = None
                    has_valid = any('@Valid' in p or '@Validated' in p for p in params_list)
                    
                    parsed_params = []
                    for p in params_list:
                        cleaned_p = ' '.join(p.split())
                        is_body = '@RequestBody' in cleaned_p
                        is_pv = '@PathVariable' in cleaned_p
                        is_rp = '@RequestParam' in cleaned_p
                        is_auth = '@AuthenticationPrincipal' in cleaned_p or 'Authentication' in cleaned_p
                        if is_body:
                            parts = cleaned_p.split()
                            body_type = parts[-2] if len(parts) >= 2 else parts[-1]
                        parsed_params.append({
                            'raw': cleaned_p,
                            'is_body': is_body,
                            'is_path_var': is_pv,
                            'is_request_param': is_rp,
                            'is_auth': is_auth
                        })

                    for hm in http_methods:
                        endpoints.append({
                            'controller': class_name,
                            'file': cpath,
                            'method': hm,
                            'path': full_path,
                            'handler': method_name,
                            'return_type': return_type,
                            'auth': effective_auth,
                            'has_request_body': has_request_body,
                            'body_type': body_type,
                            'has_valid': has_valid,
                            'params': parsed_params
                        })

    return endpoints

def main():
    controllers = glob.glob('backend/src/main/java/com/sporekart/**/*Controller.java', recursive=True)
    all_endpoints = []
    for c in sorted(controllers):
        eps = parse_controller_file(c)
        all_endpoints.extend(eps)

    print(f"Total Controller Endpoints Discovered: {len(all_endpoints)}")
    with open('audit_output/endpoints_inventory.json', 'w', encoding='utf-8') as f:
        json.dump(all_endpoints, f, indent=2)

    by_ctrl = {}
    for ep in all_endpoints:
        by_ctrl.setdefault(ep['controller'], []).append(ep)

    print(f"\n--- Summary by Controller ({len(by_ctrl)} controllers) ---")
    for ctrl, eps in sorted(by_ctrl.items()):
        print(f"{ctrl:<30}: {len(eps)} endpoints")

if __name__ == '__main__':
    main()
