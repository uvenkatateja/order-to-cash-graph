import json
import sqlite3
import os
import glob

DATA_DIR = os.path.join(os.path.dirname(__file__), "sap-o2c-data")
DB_PATH = os.path.join(os.path.dirname(__file__), "o2c.db")

TABLES = [
    "sales_order_headers",
    "sales_order_items",
    "sales_order_schedule_lines",
    "outbound_delivery_headers",
    "outbound_delivery_items",
    "billing_document_headers",
    "billing_document_items",
    "billing_document_cancellations",
    "journal_entry_items_accounts_receivable",
    "payments_accounts_receivable",
    "business_partners",
    "business_partner_addresses",
    "customer_company_assignments",
    "customer_sales_area_assignments",
    "products",
    "product_descriptions",
    "product_plants",
    "product_storage_locations",
    "plants",
]

def flatten(obj, prefix=""):
    """Flatten nested JSON into flat dict"""
    result: dict = {}
    for k, v in obj.items():
        key = f"{prefix}{k}" if not prefix else f"{prefix}_{k}"
        if isinstance(v, dict):
            result.update(flatten(v, key))
        elif v is None:
            result[key] = None
        else:
            result[key] = str(v) if not isinstance(v, (int, float, bool)) else v
    return result

def ingest_table(conn, table_name):
    folder = os.path.join(DATA_DIR, table_name)
    files = glob.glob(f"{folder}/*.jsonl")
    if not files:
        print(f"  No files found for {table_name}")
        return 0

    rows = []
    for f in files:
        with open(f) as fh:
            for line in fh:
                line = line.strip()
                if line:
                    try:
                        obj = json.loads(line)
                        rows.append(flatten(obj))
                    except:
                        pass

    if not rows:
        return 0

    # Get all columns across all rows
    cols = set()
    for r in rows:
        cols.update(r.keys())
    cols = sorted(cols)

    # Create table
    col_defs = ", ".join([f'"{c}" TEXT' for c in cols])
    conn.execute(f'DROP TABLE IF EXISTS "{table_name}"')
    conn.execute(f'CREATE TABLE "{table_name}" ({col_defs})')

    # Insert rows
    placeholders = ", ".join(["?" for _ in cols])
    col_list = ", ".join([f'"{c}"' for c in cols])
    for row in rows:
        vals = [row.get(c, None) for c in cols]
        conn.execute(f'INSERT INTO "{table_name}" ({col_list}) VALUES ({placeholders})', vals)

    conn.commit()
    print(f"  {table_name}: {len(rows)} rows, {len(cols)} cols")
    return len(rows)

def main():
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)
    conn = sqlite3.connect(DB_PATH)
    print("Ingesting tables...")
    total = 0
    for t in TABLES:
        total += ingest_table(conn, t)
    conn.close()
    print(f"\nDone! Total rows: {total}")
    print(f"DB saved to: {DB_PATH}")

if __name__ == "__main__":
    main()
