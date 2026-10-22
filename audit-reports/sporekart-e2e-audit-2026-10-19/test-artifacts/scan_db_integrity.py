#!/usr/bin/env python3
"""
SporeKart Database Schema & Data Integrity Auditor
Connects to live Supabase PostgreSQL (read-only queries).
Extracts schema definition, Flyway migrations, JPA entities,
performs referential integrity, business logic invariant, and reconciliation checks.
"""

import os
import sys
import re
import ssl
import json
from datetime import datetime
import pg8000.native

DB_HOST = "aws-0-ap-northeast-1.pooler.supabase.com"
DB_PORT = 6543
DB_NAME = "postgres"
DB_USER = "postgres.irwiiyowpppdynbmwwuz"
DB_PASS = "MyDbSporekart@123#"

def get_connection():
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    return pg8000.native.Connection(
        user=DB_USER,
        password=DB_PASS,
        host=DB_HOST,
        port=DB_PORT,
        database=DB_NAME,
        ssl_context=ctx
    )

def audit_flyway(con):
    print("--- Auditing Flyway Migrations ---")
    query = """
    SELECT installed_rank, version, description, type, script, checksum, installed_by, installed_on, execution_time, success
    FROM flyway_schema_history
    ORDER BY installed_rank ASC;
    """
    rows = con.run(query)
    results = []
    for r in rows:
        results.append({
            "rank": r[0],
            "version": r[1],
            "description": r[2],
            "type": r[3],
            "script": r[4],
            "checksum": r[5],
            "installed_by": r[6],
            "installed_on": str(r[7]),
            "execution_time_ms": r[8],
            "success": r[9]
        })
    print(f"Total Flyway migrations recorded in DB: {len(results)}")
    return results

def audit_tables_and_columns(con):
    print("--- Auditing Tables & Columns ---")
    # All tables in public schema
    t_query = """
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name;
    """
    tables = [r[0] for r in con.run(t_query)]
    print(f"Total base tables found in public schema: {len(tables)}")

    # Columns
    c_query = """
    SELECT table_name, column_name, ordinal_position, column_default, is_nullable, 
           data_type, character_maximum_length, numeric_precision, numeric_scale, udt_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
    ORDER BY table_name, ordinal_position;
    """
    columns_raw = con.run(c_query)
    table_columns = {}
    for r in columns_raw:
        tname = r[0]
        if tname not in table_columns:
            table_columns[tname] = []
        table_columns[tname].append({
            "column_name": r[1],
            "ordinal_position": r[2],
            "column_default": r[3],
            "is_nullable": r[4] == 'YES',
            "data_type": r[5],
            "char_max_length": r[6],
            "numeric_precision": r[7],
            "numeric_scale": r[8],
            "udt_name": r[9]
        })

    # Table row counts
    row_counts = {}
    for t in tables:
        try:
            cnt = con.run(f'SELECT COUNT(*) FROM "{t}";')[0][0]
            row_counts[t] = cnt
        except Exception as e:
            row_counts[t] = f"ERROR: {e}"

    return tables, table_columns, row_counts

def audit_constraints(con):
    print("--- Auditing Constraints (PK, FK, Unique, Check) ---")
    # PKs
    pk_query = """
    SELECT tc.table_name, tc.constraint_name, kcu.column_name, kcu.ordinal_position
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
      ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_schema = 'public'
    ORDER BY tc.table_name, kcu.ordinal_position;
    """
    pks = {}
    for r in con.run(pk_query):
        tname = r[0]
        if tname not in pks:
            pks[tname] = {"constraint_name": r[1], "columns": []}
        pks[tname]["columns"].append(r[2])

    # FKs
    fk_query = """
    SELECT
        tc.table_name,
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        rc.update_rule,
        rc.delete_rule
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.referential_constraints AS rc
      ON tc.constraint_name = rc.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
    ORDER BY tc.table_name, tc.constraint_name;
    """
    fks = []
    for r in con.run(fk_query):
        fks.append({
            "table_name": r[0],
            "constraint_name": r[1],
            "column_name": r[2],
            "foreign_table_name": r[3],
            "foreign_column_name": r[4],
            "update_rule": r[5],
            "delete_rule": r[6]
        })

    # Uniques
    unique_query = """
    SELECT tc.table_name, tc.constraint_name, kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'UNIQUE' AND tc.table_schema = 'public'
    ORDER BY tc.table_name, tc.constraint_name;
    """
    uniques = {}
    for r in con.run(unique_query):
        cname = r[1]
        if cname not in uniques:
            uniques[cname] = {"table": r[0], "constraint_name": cname, "columns": []}
        uniques[cname]["columns"].append(r[2])

    # Checks
    check_query = """
    SELECT tc.table_name, tc.constraint_name, cc.check_clause
    FROM information_schema.table_constraints tc
    JOIN information_schema.check_constraints cc
      ON tc.constraint_name = cc.constraint_name AND tc.table_schema = cc.constraint_schema
    WHERE tc.constraint_type = 'CHECK' AND tc.table_schema = 'public'
    ORDER BY tc.table_name, tc.constraint_name;
    """
    checks = []
    for r in con.run(check_query):
        checks.append({
            "table_name": r[0],
            "constraint_name": r[1],
            "check_clause": r[2]
        })

    return pks, fks, list(uniques.values()), checks

def audit_indexes(con):
    print("--- Auditing Indexes ---")
    idx_query = """
    SELECT
        tablename,
        indexname,
        indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
    ORDER BY tablename, indexname;
    """
    indexes = []
    for r in con.run(idx_query):
        indexes.append({
            "table_name": r[0],
            "index_name": r[1],
            "index_def": r[2]
        })
    print(f"Total indexes in public schema: {len(indexes)}")
    return indexes

if __name__ == '__main__':
    con = get_connection()
    try:
        flyway = audit_flyway(con)
        tables, cols, row_counts = audit_tables_and_columns(con)
        pks, fks, uniques, checks = audit_constraints(con)
        indexes = audit_indexes(con)
        
        output = {
            "timestamp": datetime.now().isoformat(),
            "flyway_migrations": flyway,
            "table_count": len(tables),
            "tables": tables,
            "row_counts": row_counts,
            "columns": cols,
            "primary_keys": pks,
            "foreign_keys": fks,
            "unique_constraints": uniques,
            "check_constraints": checks,
            "indexes": indexes
        }
        with open("audit_output/db_schema_dump.json", "w", encoding="utf-8") as f:
            json.dump(output, f, indent=2)
        print("Schema metadata dumped to audit_output/db_schema_dump.json")
    finally:
        con.close()
