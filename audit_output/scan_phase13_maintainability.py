#!/usr/bin/env python3
"""
Sporekart Phase 13 — Code Quality, Duplication, and Maintainability Scanner
Performs non-mutating deep static analysis across Backend (Java) and Frontend (React/JS/JSX)
Covering all 15 audit dimensions.
"""

import os
import re
import json
import xml.etree.ElementTree as ET
from pathlib import Path
from collections import defaultdict

BASE_DIR = Path("f:/sporekart-v1/sporekart-final")
BACKEND_SRC = BASE_DIR / "backend" / "src" / "main" / "java"
BACKEND_TEST = BASE_DIR / "backend" / "src" / "test" / "java"
FRONTEND_SRC = BASE_DIR / "frontend" / "src"
POM_XML = BASE_DIR / "backend" / "pom.xml"
PACKAGE_JSON = BASE_DIR / "frontend" / "package.json"
JSCPD_REPORT = BASE_DIR / "audit_output" / "jscpd-report" / "jscpd-report.json"

findings = {
    "1_exact_and_near_duplicate_code": [],
    "2_duplicate_business_rules": [],
    "3_duplicate_endpoints": [],
    "4_inconsistent_validation": [],
    "5_repeated_financial_calculations": [],
    "6_duplicate_state_transition_logic": [],
    "7_dead_code_and_unused_functions": [],
    "8_redundant_database_queries": [],
    "9_circular_dependencies": [],
    "10_missing_error_handling": [],
    "11_inconsistent_exception_mapping": [],
    "12_unused_dependencies": [],
    "13_hardcoded_configuration": [],
    "14_inconsistent_logging_and_monitoring": [],
    "15_unhandled_asynchronous_failures": []
}

def scan_all_files(root_dir, ext_list):
    file_list = []
    for root, _, files in os.walk(root_dir):
        for f in files:
            if any(f.endswith(ext) for ext in ext_list):
                file_list.append(Path(root) / f)
    return file_list

java_files = scan_all_files(BACKEND_SRC, [".java"])
frontend_files = scan_all_files(FRONTEND_SRC, [".js", ".jsx"])

print(f"Loaded {len(java_files)} Java files and {len(frontend_files)} Frontend files.")

# =========================================================================
# 1. EXACT AND NEAR-DUPLICATE CODE
# =========================================================================
if JSCPD_REPORT.exists():
    try:
        with open(JSCPD_REPORT, "r", encoding="utf-8") as f:
            jscpd_data = json.load(f)
        
        duplicates = jscpd_data.get("duplicates", [])
        print(f"JSCPD loaded {len(duplicates)} duplicate blocks.")
        for d in duplicates[:40]: # Top 40 representative clones
            findings["1_exact_and_near_duplicate_code"].append({
                "format": d.get("format"),
                "lines": d.get("lines"),
                "tokens": d.get("tokens"),
                "firstFile": d.get("firstFile", {}).get("name"),
                "firstLines": f"{d.get('firstFile', {}).get('start')}-{d.get('firstFile', {}).get('end')}",
                "secondFile": d.get("secondFile", {}).get("name"),
                "secondLines": f"{d.get('secondFile', {}).get('start')}-{d.get('secondFile', {}).get('end')}",
                "fragment": d.get("fragment", "")[:150]
            })
    except Exception as e:
        print(f"Error reading JSCPD report: {e}")

# =========================================================================
# 2. DUPLICATE BUSINESS RULES
# =========================================================================
gst_tax_pattern = re.compile(r'(\b0\.18\b|\b0\.05\b|\b18\b\s*\*\s*|\bGST\b)', re.IGNORECASE)
ship_fee_pattern = re.compile(r'(INR\s*70|70\.00?|shippingFee|SHIPPING_FEE)', re.IGNORECASE)

gst_occurrences = []
ship_fee_occurrences = []

for f in java_files + frontend_files:
    try:
        content = f.read_text(encoding="utf-8", errors="ignore")
        lines = content.splitlines()
        for idx, line in enumerate(lines, 1):
            if "0.18" in line or "18" in line and ("tax" in line.lower() or "gst" in line.lower()):
                gst_occurrences.append({
                    "file": str(f.relative_to(BASE_DIR)),
                    "line": idx,
                    "code": line.strip()
                })
            if ("70.0" in line or "70" in line) and ("shipping" in line.lower() or "delivery" in line.lower()):
                ship_fee_occurrences.append({
                    "file": str(f.relative_to(BASE_DIR)),
                    "line": idx,
                    "code": line.strip()
                })
    except Exception:
        pass

findings["2_duplicate_business_rules"].append({
    "rule": "GST Tax Rate Computation (18% / 5% hardcoded inline across modules)",
    "occurrencesCount": len(gst_occurrences),
    "sampleOccurrences": gst_occurrences[:10],
    "impact": "Decentralized tax calculation causes accounting drift if statutory GST slabs change.",
    "recommendation": "Encapsulate tax rules in a centralized TaxCalculationService / TaxPolicy enum."
})

findings["2_duplicate_business_rules"].append({
    "rule": "Flat Courier Shipping Fee (INR 70.00 hardcoded in multiple places)",
    "occurrencesCount": len(ship_fee_occurrences),
    "sampleOccurrences": ship_fee_occurrences[:10],
    "impact": "Inconsistent shipping fee waivers or rate revisions across frontend cart, checkout, and backend order calculation.",
    "recommendation": "Expose dynamic shipping rate from ShippingService/DeliveryConfig rather than hardcoding in OrderService and frontend."
})

# =========================================================================
# 3. DUPLICATE ENDPOINTS & ROUTING
# =========================================================================
endpoint_pattern = re.compile(r'@(GetMapping|PostMapping|PutMapping|DeleteMapping|PatchMapping|RequestMapping)\s*(\((.*?)\))?', re.DOTALL)
class_request_mapping = re.compile(r'@RequestMapping\s*\(\s*(?:value\s*=\s*)?["\']([^"\']+)["\']', re.DOTALL)

endpoints = []
for f in java_files:
    if "controller" in f.name.lower():
        try:
            content = f.read_text(encoding="utf-8", errors="ignore")
            base_path = ""
            cm = class_request_mapping.search(content)
            if cm:
                base_path = cm.group(1).rstrip("/")
            
            for m in endpoint_pattern.finditer(content):
                method = m.group(1)
                args = m.group(3) or ""
                path = ""
                pm = re.search(r'["\']([^"\']+)["\']', args)
                if pm:
                    path = pm.group(1)
                full_path = (base_path + "/" + path.lstrip("/")).replace("//", "/")
                endpoints.append({
                    "file": str(f.relative_to(BASE_DIR)),
                    "httpMethod": method.replace("Mapping", "").upper() if method != "RequestMapping" else "ALL",
                    "fullPath": full_path or base_path or "/"
                })
        except Exception:
            pass

endpoint_map = defaultdict(list)
for ep in endpoints:
    key = f"{ep['httpMethod']} {ep['fullPath']}"
    endpoint_map[key].append(ep)

duplicate_endpoints = [v for k, v in endpoint_map.items() if len(v) > 1]
findings["3_duplicate_endpoints"] = {
    "totalDiscoveredEndpoints": len(endpoints),
    "duplicateOrOverlappingEndpoints": duplicate_endpoints[:15],
    "analysis": "Identified endpoints with identical HTTP method and path signatures or overlapping path variables."
}

# =========================================================================
# 4. INCONSISTENT VALIDATION
# =========================================================================
phone_patterns = []
pincode_patterns = []
email_patterns = []

for f in java_files + frontend_files:
    try:
        content = f.read_text(encoding="utf-8", errors="ignore")
        for line_no, line in enumerate(content.splitlines(), 1):
            if "@Pattern" in line or "regex" in line or "test(" in line:
                if "phone" in line.lower() or "\\d{10}" in line or "6-9" in line:
                    phone_patterns.append({"file": str(f.relative_to(BASE_DIR)), "line": line_no, "snippet": line.strip()})
                if "pin" in line.lower() or "[1-9]" in line and "5" in line:
                    pincode_patterns.append({"file": str(f.relative_to(BASE_DIR)), "line": line_no, "snippet": line.strip()})
    except Exception:
        pass

findings["4_inconsistent_validation"] = {
    "phoneValidationDiscrepancies": phone_patterns[:10],
    "pincodeValidationDiscrepancies": pincode_patterns[:10],
    "impact": "Differing validation criteria in frontend vs backend causes false-positive client rejections or unexpected 400 Bad Requests."
}

# =========================================================================
# 5. REPEATED FINANCIAL CALCULATIONS
# =========================================================================
float_in_financial = []
for f in java_files:
    if any(k in f.name.lower() for k in ["order", "wallet", "payment", "finance", "cart"]):
        try:
            content = f.read_text(encoding="utf-8", errors="ignore")
            for idx, line in enumerate(content.splitlines(), 1):
                if re.search(r'\b(double|float)\b', line) and any(w in line.lower() for w in ["amount", "balance", "price", "total", "tax"]):
                    float_in_financial.append({"file": str(f.relative_to(BASE_DIR)), "line": idx, "code": line.strip()})
        except Exception:
            pass

findings["5_repeated_financial_calculations"] = {
    "floatingPointInFinancialCode": float_in_financial[:15],
    "totalFound": len(float_in_financial),
    "recommendation": "Enforce BigDecimal everywhere for monetary transactions to prevent IEEE-754 precision loss."
}

# =========================================================================
# 6. DUPLICATE STATE TRANSITION LOGIC
# =========================================================================
set_status_calls = defaultdict(list)
for f in java_files:
    try:
        content = f.read_text(encoding="utf-8", errors="ignore")
        for idx, line in enumerate(content.splitlines(), 1):
            m = re.search(r'\.setStatus\(([^)]+)\)', line)
            if m:
                status_arg = m.group(1).strip()
                set_status_calls[f.name].append({"line": idx, "status": status_arg, "code": line.strip()})
    except Exception:
        pass

findings["6_duplicate_state_transition_logic"] = {
    "filesDirectlyMutatingStatus": len(set_status_calls),
    "topFiles": [{"file": k, "mutationsCount": len(v), "samples": v[:3]} for k, v in sorted(set_status_calls.items(), key=lambda x: len(x[1]), reverse=True)[:10]],
    "impact": "Uncentralized setStatus() invocations bypass state machine invariants and can cause invalid transitions if not guarded."
}

# =========================================================================
# 7. DEAD CODE AND UNUSED REPOSITORY QUERIES
# =========================================================================
repo_methods = []
for f in java_files:
    if "repository" in f.name.lower() and f.name.endswith(".java"):
        try:
            content = f.read_text(encoding="utf-8", errors="ignore")
            # find method signatures in interface
            matches = re.findall(r'(?:List<|Optional<|Page<|int |long |boolean |void |[A-Z]\w+<)\s*(\w+)\s*\(', content)
            for m in matches:
                if m not in ["equals", "hashCode", "toString"]:
                    repo_methods.append({"repo": f.name, "method": m})
        except Exception:
            pass

all_java_content = " ".join([f.read_text(encoding="utf-8", errors="ignore") for f in java_files])
unused_repo_methods = []
for rm in repo_methods:
    # count occurrences
    cnt = len(re.findall(r'\b' + re.escape(rm["method"]) + r'\b', all_java_content))
    if cnt <= 1: # only the definition itself
        unused_repo_methods.append(rm)

findings["7_dead_code_and_unused_functions"] = {
    "totalRepositoryMethods": len(repo_methods),
    "unusedOrSingleReferenceMethodsCount": len(unused_repo_methods),
    "samples": unused_repo_methods[:15]
}

# =========================================================================
# 8. REDUNDANT DATABASE QUERIES (N+1 in loops)
# =========================================================================
n_plus_one_findings = []
for f in java_files:
    try:
        content = f.read_text(encoding="utf-8", errors="ignore")
        lines = content.splitlines()
        in_loop = False
        loop_line = 0
        for idx, line in enumerate(lines, 1):
            if re.search(r'\bfor\s*\(', line) or re.search(r'\bwhile\s*\(', line) or '.forEach(' in line:
                in_loop = True
                loop_line = idx
            if in_loop:
                if re.search(r'\w+Repository\.find|\w+Repository\.get', line):
                    n_plus_one_findings.append({
                        "file": str(f.relative_to(BASE_DIR)),
                        "loopLine": loop_line,
                        "queryLine": idx,
                        "code": line.strip()
                    })
            if in_loop and ('}' in line or ');' in line) and idx > loop_line + 15:
                in_loop = False
    except Exception:
        pass

findings["8_redundant_database_queries"] = {
    "potentialNPlusOneQueriesCount": len(n_plus_one_findings),
    "samples": n_plus_one_findings[:15],
    "recommendation": "Use batch queries (findAllById, WHERE IN (...)) or JPA entity graphs to eliminate query amplification."
}

# =========================================================================
# 9. CIRCULAR DEPENDENCIES & @LAZY INJECTIONS
# =========================================================================
lazy_injections = []
for f in java_files:
    try:
        content = f.read_text(encoding="utf-8", errors="ignore")
        for idx, line in enumerate(content.splitlines(), 1):
            if "@Lazy" in line:
                lazy_injections.append({
                    "file": str(f.relative_to(BASE_DIR)),
                    "line": idx,
                    "code": line.strip()
                })
    except Exception:
        pass

findings["9_circular_dependencies"] = {
    "lazyInjectionsFound": len(lazy_injections),
    "locations": lazy_injections,
    "analysis": "@Lazy is often used as a workaround for tight circular coupling between domain services (e.g. OrderService <-> ShippingService, OrderService <-> PaymentService)."
}

# =========================================================================
# 10. MISSING ERROR HANDLING & EMPTY CATCH BLOCKS
# =========================================================================
empty_catches = []
swallowed_exceptions = []
for f in java_files:
    try:
        content = f.read_text(encoding="utf-8", errors="ignore")
        lines = content.splitlines()
        for idx, line in enumerate(lines, 1):
            if re.search(r'catch\s*\([^)]+\)\s*\{\s*\}', line):
                empty_catches.append({"file": str(f.relative_to(BASE_DIR)), "line": idx, "code": line.strip()})
            elif "catch" in line and idx < len(lines):
                # check next 2 lines
                block = " ".join([lines[i].strip() for i in range(idx, min(idx + 3, len(lines)))])
                if re.search(r'catch\s*\([^)]+\)\s*\{\s*\}', block) or re.search(r'catch\s*\([^)]+\)\s*\{\s*//', block):
                    empty_catches.append({"file": str(f.relative_to(BASE_DIR)), "line": idx, "code": block[:80]})
    except Exception:
        pass

findings["10_missing_error_handling"] = {
    "emptyCatchBlocksCount": len(empty_catches),
    "samples": empty_catches[:15],
    "impact": "Swallowed exceptions prevent root cause diagnostic and cause silent partial failures."
}

# =========================================================================
# 11. INCONSISTENT EXCEPTION MAPPING
# =========================================================================
raw_runtime_exceptions = []
for f in java_files:
    try:
        content = f.read_text(encoding="utf-8", errors="ignore")
        for idx, line in enumerate(content.splitlines(), 1):
            if "throw new RuntimeException(" in line:
                raw_runtime_exceptions.append({"file": str(f.relative_to(BASE_DIR)), "line": idx, "code": line.strip()})
    except Exception:
        pass

findings["11_inconsistent_exception_mapping"] = {
    "rawRuntimeExceptionThrowsCount": len(raw_runtime_exceptions),
    "samples": raw_runtime_exceptions[:15],
    "recommendation": "Replace generic RuntimeException with specific domain exceptions (e.g., DomainValidationException, ResourceNotFoundException, PaymentGatewayException) for structured error mapping."
}

# =========================================================================
# 12. UNUSED DEPENDENCIES
# =========================================================================
# Check package.json
unused_npm_packages = []
if PACKAGE_JSON.exists():
    try:
        with open(PACKAGE_JSON, "r", encoding="utf-8") as f:
            pkg_data = json.load(f)
        deps = list(pkg_data.get("dependencies", {}).keys())
        fe_content = " ".join([f.read_text(encoding="utf-8", errors="ignore") for f in frontend_files])
        for d in deps:
            if not re.search(r'from\s*["\']' + re.escape(d) + r'["\']', fe_content) and not re.search(r'require\(["\']' + re.escape(d) + r'["\']\)', fe_content):
                # ignore well-known meta packages
                if d not in ["react", "react-dom", "react-router-dom"]:
                    unused_npm_packages.append(d)
    except Exception as e:
        print(f"Error checking package.json: {e}")

findings["12_unused_dependencies"] = {
    "potentialUnusedNpmPackages": unused_npm_packages
}

# =========================================================================
# 13. HARDCODED CONFIGURATION & MAGIC NUMBERS
# =========================================================================
hardcoded_secrets_or_urls = []
for f in java_files:
    try:
        content = f.read_text(encoding="utf-8", errors="ignore")
        for idx, line in enumerate(content.splitlines(), 1):
            if any(k in line for k in ["http://localhost", "https://api", "http://api"]) and "@Value" not in line and "import " not in line:
                hardcoded_secrets_or_urls.append({"file": str(f.relative_to(BASE_DIR)), "line": idx, "code": line.strip()})
    except Exception:
        pass

findings["13_hardcoded_configuration"] = {
    "hardcodedUrlsOrHostsCount": len(hardcoded_secrets_or_urls),
    "samples": hardcoded_secrets_or_urls[:15]
}

# =========================================================================
# 14. INCONSISTENT LOGGING AND SYSTEM.OUT USAGE
# =========================================================================
sysout_findings = []
for f in java_files:
    try:
        content = f.read_text(encoding="utf-8", errors="ignore")
        for idx, line in enumerate(content.splitlines(), 1):
            if "System.out.print" in line or "System.err.print" in line or ".printStackTrace(" in line:
                sysout_findings.append({"file": str(f.relative_to(BASE_DIR)), "line": idx, "code": line.strip()})
    except Exception:
        pass

findings["14_inconsistent_logging_and_monitoring"] = {
    "systemOutOrPrintStackTraceCount": len(sysout_findings),
    "samples": sysout_findings[:15]
}

# =========================================================================
# 15. UNHANDLED ASYNCHRONOUS FAILURES
# =========================================================================
async_void_methods = []
for f in java_files:
    try:
        content = f.read_text(encoding="utf-8", errors="ignore")
        lines = content.splitlines()
        for idx, line in enumerate(lines, 1):
            if "@Async" in line:
                # inspect following lines for signature
                sig = ""
                for j in range(idx, min(idx + 4, len(lines))):
                    sig += " " + lines[j].strip()
                    if "{" in lines[j]:
                        break
                if "void " in sig:
                    async_void_methods.append({"file": str(f.relative_to(BASE_DIR)), "line": idx, "signature": sig.strip()})
    except Exception:
        pass

findings["15_unhandled_asynchronous_failures"] = {
    "asyncVoidMethodsCount": len(async_void_methods),
    "samples": async_void_methods,
    "analysis": "@Async void methods bypass standard Spring ControllerAdvice exception handling. Any unhandled exception will only be logged if an AsyncUncaughtExceptionHandler is configured."
}

# Write output json
output_path = BASE_DIR / "audit_output" / "13_code_quality_and_duplication_findings.json"
with open(output_path, "w", encoding="utf-8") as f:
    json.dump(findings, f, indent=2)

print(f"\nAnalysis complete! Findings exported to {output_path}")
