#!/usr/bin/env python3
"""
Entity-to-Schema Mapping Verifier.
Compares Java JPA Entity annotations and definitions against PostgreSQL 17.6 information_schema.
"""

import os
import re
import json

def load_json(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def run_mapping_comparison():
    schema = load_json("audit_output/db_schema_dump.json")
    jpa = load_json("audit_output/jpa_and_flyway_inventory.json")

    db_tables = set(schema["tables"])
    jpa_entities = jpa["jpa_entities"]

    entity_to_table = {}
    table_to_entity = {}
    for cname, info in jpa_entities.items():
        tname = info["table_name"]
        entity_to_table[cname] = tname
        table_to_entity[tname] = cname

    # 1. Table Existence Checks
    missing_tables_in_db = []
    for cname, tname in entity_to_table.items():
        if tname not in db_tables:
            missing_tables_in_db.append({"entity": cname, "table": tname})

    tables_without_entity = []
    for tname in db_tables:
        if tname not in table_to_entity:
            tables_without_entity.append(tname)

    # 2. Detailed Field & Column Mappings
    field_mappings = {}
    column_discrepancies = []

    for cname, einfo in jpa_entities.items():
        tname = einfo["table_name"]
        if tname not in db_tables:
            continue

        db_cols = {c["column_name"]: c for c in schema["columns"].get(tname, [])}
        fpath = einfo["file"]
        with open(fpath, 'r', encoding='utf-8') as fh:
            content = fh.read()

        # Parse fields with annotations
        # Match annotations + private Type fieldName;
        field_blocks = re.findall(r'((?:@\w+(?:\([^)]*\))?\s*)*)\s*private\s+([A-Za-z0-9_<>]+)\s+([a-zA-Z0-9_]+);', content)
        
        parsed_fields = []
        for annos, ftype, fname in field_blocks:
            # Determine mapped column name
            col_name = None
            is_transient = '@Transient' in annos
            if is_transient:
                continue

            col_match = re.search(r'@Column\s*\(\s*(?:[^)]*?name\s*=\s*\"([^\"]+)\")?', annos)
            join_col_match = re.search(r'@JoinColumn\s*\(\s*(?:[^)]*?name\s*=\s*\"([^\"]+)\")?', annos)
            
            if col_match and col_match.group(1):
                col_name = col_match.group(1).lower()
            elif join_col_match and join_col_match.group(1):
                col_name = join_col_match.group(1).lower()
            elif '@OneToMany' in annos or '@ManyToMany' in annos:
                # Collection relationship, not a direct column on this table
                continue
            else:
                # Spring default: camelCase to snake_case
                col_name = re.sub(r'(?<!^)(?=[A-Z])', '_', fname).lower()

            is_nullable_declared = True
            if 'nullable = false' in annos:
                is_nullable_declared = False
            if '@NotNull' in annos or '@NotEmpty' in annos or '@NotBlank' in annos:
                is_nullable_declared = False

            # Check existence in DB
            exists_in_db = col_name in db_cols
            db_col_info = db_cols.get(col_name)

            nullability_mismatch = False
            type_mismatch = False
            notes = []

            if exists_in_db:
                db_null = db_col_info["is_nullable"] # boolean: True if YES
                # If JPA says nullable=false, but DB is nullable=YES (or vice versa)
                if not is_nullable_declared and db_null:
                    nullability_mismatch = True
                    notes.append("JPA nullable=false but DB is nullable")
                
                # Type checking heuristic
                udt = db_col_info["udt_name"]
                if ftype in ['Long', 'long'] and udt not in ['int8', 'int4']:
                    type_mismatch = True
                    notes.append(f"Java {ftype} vs DB {udt}")
                elif ftype in ['Integer', 'int'] and udt not in ['int4', 'int2']:
                    type_mismatch = True
                    notes.append(f"Java {ftype} vs DB {udt}")
                elif ftype in ['BigDecimal'] and udt not in ['numeric']:
                    type_mismatch = True
                    notes.append(f"Java BigDecimal vs DB {udt}")
                elif ftype in ['Boolean', 'boolean'] and udt not in ['bool']:
                    type_mismatch = True
                    notes.append(f"Java Boolean vs DB {udt}")
                elif ftype in ['Instant', 'LocalDateTime', 'ZonedDateTime'] and 'timestamp' not in udt:
                    type_mismatch = True
                    notes.append(f"Java {ftype} vs DB {udt}")
                elif ftype in ['UUID'] and udt not in ['uuid']:
                    type_mismatch = True
                    notes.append(f"Java UUID vs DB {udt}")
            else:
                notes.append("Column NOT found in DB table!")

            field_entry = {
                "field_name": fname,
                "field_type": ftype,
                "column_name": col_name,
                "exists_in_db": exists_in_db,
                "nullability_mismatch": nullability_mismatch,
                "type_mismatch": type_mismatch,
                "notes": notes
            }
            parsed_fields.append(field_entry)
            if not exists_in_db or nullability_mismatch or type_mismatch:
                column_discrepancies.append({
                    "entity": cname,
                    "table": tname,
                    "field": fname,
                    "column": col_name,
                    "issue": "; ".join(notes)
                })

        field_mappings[cname] = parsed_fields

    report = {
        "total_jpa_entities": len(jpa_entities),
        "total_db_tables": len(db_tables),
        "missing_tables_in_db": missing_tables_in_db,
        "tables_without_entity": sorted(tables_without_entity),
        "column_discrepancies_count": len(column_discrepancies),
        "column_discrepancies": column_discrepancies,
        "field_mappings": field_mappings
    }

    with open("audit_output/entity_schema_mapping_audit.json", "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    print("\n=== ENTITY TO SCHEMA MAPPING AUDIT RESULT ===")
    print(f"JPA Entities analyzed: {len(jpa_entities)}")
    print(f"Database Tables: {len(db_tables)}")
    print(f"Entities missing table in DB: {len(missing_tables_in_db)}")
    for m in missing_tables_in_db:
        print(f"  [MISSING TABLE] Entity: {m['entity']} -> Table: {m['table']}")
    print(f"Database tables without explicit JPA Entity: {len(tables_without_entity)}")
    for t in sorted(tables_without_entity):
        print(f"  [UNMAPPED DB TABLE] {t}")
    print(f"Column discrepancies found: {len(column_discrepancies)}")
    for d in column_discrepancies[:20]:
        print(f"  [DISCREPANCY] {d['entity']}.{d['field']} (col: {d['column']}): {d['issue']}")

if __name__ == '__main__':
    run_mapping_comparison()
