#!/usr/bin/env python3
import json

with open("audit_output/jscpd-report/jscpd-report.json", "r", encoding="utf-8") as f:
    d = json.load(f)

dupes = d.get("duplicates", [])
java_dupes = [x for x in dupes if x.get("format") == "java"]
jsx_dupes = [x for x in dupes if x.get("format") == "jsx"]

print(f"Total Clones: {len(dupes)} (Java: {len(java_dupes)}, JSX: {len(jsx_dupes)})\n")

print("=== Top 10 Java Clones ===")
for x in sorted(java_dupes, key=lambda y: y["lines"], reverse=True)[:10]:
    f1 = x['firstFile']['name'].replace('\\', '/')
    f2 = x['secondFile']['name'].replace('\\', '/')
    l = x['lines']
    tok = x['tokens']
    s1, e1 = x['firstFile']['start'], x['firstFile']['end']
    s2, e2 = x['secondFile']['start'], x['secondFile']['end']
    frag = x.get('fragment', '').strip().replace('\n', ' ')[:100]
    print(f"- [{l} lines, {tok} tokens] {f1}:{s1}-{e1} vs {f2}:{s2}-{e2}")
    print(f"  Snippet: {frag}...")

print("\n=== Top 10 JSX Clones ===")
for x in sorted(jsx_dupes, key=lambda y: y["lines"], reverse=True)[:10]:
    f1 = x['firstFile']['name'].replace('\\', '/')
    f2 = x['secondFile']['name'].replace('\\', '/')
    l = x['lines']
    tok = x['tokens']
    s1, e1 = x['firstFile']['start'], x['firstFile']['end']
    s2, e2 = x['secondFile']['start'], x['secondFile']['end']
    frag = x.get('fragment', '').strip().replace('\n', ' ')[:100]
    print(f"- [{l} lines, {tok} tokens] {f1}:{s1}-{e1} vs {f2}:{s2}-{e2}")
    print(f"  Snippet: {frag}...")
