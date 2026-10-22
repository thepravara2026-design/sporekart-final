import json
import re

def audit_auth():
    with open('audit_output/endpoints_inventory_accurate.json', 'r', encoding='utf-8') as f:
        endpoints = json.load(f)

    findings = []
    
    for ep in endpoints:
        path = ep['path']
        method = ep['method']
        auth = ep['auth']
        ctrl = ep['controller']
        handler = ep['handler']

        # Check if path indicates admin, but auth is not ADMIN
        is_admin_path = '/admin' in path or 'Admin' in ctrl
        has_admin_role = 'ADMIN' in auth

        # Does SecurityConfig cover it?
        # In SecurityConfig:
        # .requestMatchers("/admin/**").hasRole("ADMIN")
        # .requestMatchers(HttpMethod.POST, "/shipping/create", "/shipping/cancel/**", "/shipping/simulate-event/**").hasRole("ADMIN")
        sec_config_has_admin = path.startswith('/admin/') or path == '/admin' or (
            method == 'POST' and (path.startswith('/shipping/create') or path.startswith('/shipping/cancel') or path.startswith('/shipping/simulate-event'))
        )

        # Check for potential anomalies:
        # 1. Admin in path or controller, but not protected by /admin/** in SecurityConfig AND not protected by hasRole('ADMIN') in method/class
        if 'admin' in path.lower() and not sec_config_has_admin and not has_admin_role:
            findings.append({
                'type': 'ADMIN_ROUTE_UNPROTECTED_BY_ROLE',
                'severity': 'HIGH',
                'endpoint': f"{method} {path}",
                'controller': f"{ctrl}.{handler}",
                'current_auth': auth,
                'explanation': f"Route contains 'admin' but path '{path}' does not match '/admin/**' and method has no @PreAuthorize('hasRole(\"ADMIN\")')."
            })

        # 2. Controller is named AdminX, but path does not start with /admin and lacks @PreAuthorize
        if 'Admin' in ctrl and not path.startswith('/admin') and not sec_config_has_admin and not has_admin_role:
            findings.append({
                'type': 'ADMIN_CONTROLLER_NON_ADMIN_PATH',
                'severity': 'MEDIUM',
                'endpoint': f"{method} {path}",
                'controller': f"{ctrl}.{handler}",
                'current_auth': auth,
                'explanation': f"Controller {ctrl} is an Admin controller but endpoint {path} does not start with /admin and lacks hasRole('ADMIN')."
            })

        # 3. Check for mutating methods (POST, PUT, DELETE, PATCH) on public paths
        is_public_get = path.startswith('/catalog') or path.startswith('/products') or path.startswith('/categories') or path.startswith('/reviews') or path.startswith('/content') or path.startswith('/training') or path.startswith('/seo')
        if is_public_get and method in ['POST', 'PUT', 'DELETE', 'PATCH']:
            # Check what protects it
            if auth == 'PERMIT_ALL_OR_CONFIG' and not sec_config_has_admin:
                findings.append({
                    'type': 'MUTATING_METHOD_UNDER_PUBLIC_PREFIX',
                    'severity': 'HIGH',
                    'endpoint': f"{method} {path}",
                    'controller': f"{ctrl}.{handler}",
                    'current_auth': auth,
                    'explanation': f"Mutating HTTP {method} under public prefix '{path}'. Relies on anyRequest().authenticated() without explicit role check or is public."
                })

    print(f"Total potential authorization anomalies flagged: {len(findings)}\n")
    for f in findings:
        print(f"[{f['severity']}] {f['type']}: {f['endpoint']} ({f['controller']})")
        print(f"     Current Auth: {f['current_auth']}")
        print(f"     Details: {f['explanation']}\n")

    with open('audit_output/auth_audit_findings.json', 'w', encoding='utf-8') as out:
        json.dump(findings, out, indent=2)

if __name__ == '__main__':
    audit_auth()
