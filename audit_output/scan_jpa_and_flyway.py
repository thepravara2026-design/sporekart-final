#!/usr/bin/env python3
"""
Scanner for JPA Entities, Repositories, and Flyway Migrations.
Analyzes local Java source code and SQL migration files.
"""

import os
import re
import json

def scan_flyway_files(migration_dir):
    print(f"Scanning Flyway files in {migration_dir}...")
    files = sorted(os.listdir(migration_dir), key=lambda x: int(re.match(r'V(\d+)__', x).group(1)) if re.match(r'V(\d+)__', x) else 999)
    migrations = []
    created_tables = {}
    altered_tables = {}
    created_indexes = []

    for fname in files:
        if not fname.endswith('.sql'):
            continue
        m = re.match(r'V(\d+)__(.*)\.sql', fname)
        if not m:
            continue
        v_num = int(m.group(1))
        v_desc = m.group(2).replace('_', ' ')
        filepath = os.path.join(migration_dir, fname)
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # Find CREATE TABLE
        ct_matches = re.findall(r'CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_]+)\s*\((.*?)\);', content, re.DOTALL | re.IGNORECASE)
        tables_in_file = []
        for tname, body in ct_matches:
            tables_in_file.append(tname.lower())
            if tname.lower() not in created_tables:
                created_tables[tname.lower()] = {
                    "version": v_num,
                    "file": fname,
                    "raw_body": body.strip()
                }

        # Find ALTER TABLE
        alt_matches = re.findall(r'ALTER\s+TABLE\s+([a-zA-Z0-9_]+)\s+(.*?);', content, re.DOTALL | re.IGNORECASE)
        for tname, action in alt_matches:
            tname_lower = tname.lower()
            if tname_lower not in altered_tables:
                altered_tables[tname_lower] = []
            altered_tables[tname_lower].append({
                "version": v_num,
                "file": fname,
                "action": action.strip()
            })

        # Find CREATE INDEX
        idx_matches = re.findall(r'CREATE\s+(UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_]+)\s+ON\s+([a-zA-Z0-9_]+)\s*(?:USING\s+[a-zA-Z0-9_]+\s*)?\((.*?)\);', content, re.IGNORECASE)
        for is_unq, idx_name, tname, cols in idx_matches:
            created_indexes.append({
                "version": v_num,
                "file": fname,
                "index_name": idx_name.lower(),
                "table_name": tname.lower(),
                "unique": bool(is_unq),
                "columns": cols.strip()
            })

        migrations.append({
            "version": v_num,
            "filename": fname,
            "description": v_desc,
            "tables_created": tables_in_file
        })

    return migrations, created_tables, altered_tables, created_indexes

def scan_jpa_entities(java_root):
    print(f"Scanning JPA entities and repositories in {java_root}...")
    entities = {}
    repositories = {}
    enums = {}

    for root, _, files in os.walk(java_root):
        for f in files:
            if not f.endswith('.java'):
                continue
            path = os.path.join(root, f)
            with open(path, 'r', encoding='utf-8') as fh:
                content = fh.read()

            classname = f[:-5]
            pkg_m = re.search(r'package\s+([a-zA-Z0-9_.]+);', content)
            pkg = pkg_m.group(1) if pkg_m else ""

            # Check if Enum
            if re.search(r'public\s+enum\s+' + classname, content):
                # Extract enum values
                body_m = re.search(r'public\s+enum\s+' + classname + r'\s*\{([^;]+)', content)
                if body_m:
                    values = [v.strip().split('(')[0].strip() for v in body_m.group(1).split(',') if v.strip()]
                    enums[classname] = {
                        "package": pkg,
                        "values": values,
                        "file": path
                    }

            # Check if Entity
            if re.search(r'@Entity\b(?!\w)', content):
                # Find table name
                tname = None
                t_match = re.search(r'@Table\s*\(\s*name\s*=\s*\"([^\"]+)\"', content)
                if t_match:
                    tname = t_match.group(1).lower()
                else:
                    # Default table name in Spring/Hibernate is snake_case of class name
                    tname = re.sub(r'(?<!^)(?=[A-Z])', '_', classname).lower()

                # Extract fields
                fields = []
                for line in content.split('\n'):
                    line_s = line.strip()
                    if line_s.startswith('private ') and ';' in line_s and '(' not in line_s:
                        parts = line_s.replace(';', '').split()
                        if len(parts) >= 3:
                            ftype = parts[1]
                            fname = parts[2]
                            fields.append({"name": fname, "type": ftype})

                # Check Id type
                id_m = re.search(r'@Id[\s\S]*?private\s+([a-zA-Z0-9_<>]+)\s+([a-zA-Z0-9_]+);', content)
                pk_info = None
                if id_m:
                    pk_info = {"type": id_m.group(1), "field": id_m.group(2)}

                entities[classname] = {
                    "package": pkg,
                    "table_name": tname,
                    "file": path,
                    "primary_key": pk_info,
                    "fields_count": len(fields)
                }

            # Check if Repository
            if 'interface' in content and 'Repository' in classname and ('JpaRepository' in content or 'CrudRepository' in content):
                repo_match = re.search(r'extends\s+(?:JpaRepository|CrudRepository)\s*<\s*([a-zA-Z0-9_]+)\s*,\s*([a-zA-Z0-9_]+)\s*>', content)
                domain_entity = repo_match.group(1) if repo_match else None
                id_type = repo_match.group(2) if repo_match else None
                repositories[classname] = {
                    "package": pkg,
                    "file": path,
                    "domain_entity": domain_entity,
                    "id_type": id_type
                }

    return entities, repositories, enums

if __name__ == '__main__':
    mig_dir = "backend/src/main/resources/db/migration"
    java_dir = "backend/src/main/java/com/sporekart"
    
    migrations, created_tables, altered_tables, created_indexes = scan_flyway_files(mig_dir)
    entities, repositories, enums = scan_jpa_entities(java_dir)

    report = {
        "flyway_migrations_count": len(migrations),
        "flyway_migrations": migrations,
        "flyway_created_tables": created_tables,
        "flyway_altered_tables": altered_tables,
        "flyway_created_indexes": created_indexes,
        "jpa_entities_count": len(entities),
        "jpa_entities": entities,
        "jpa_repositories_count": len(repositories),
        "jpa_repositories": repositories,
        "domain_enums_count": len(enums),
        "domain_enums": enums
    }

    with open("audit_output/jpa_and_flyway_inventory.json", "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    print(f"JPA & Flyway scan complete: {len(entities)} entities, {len(repositories)} repositories, {len(enums)} enums, {len(migrations)} migrations.")
