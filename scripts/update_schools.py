#!/usr/bin/env python3
"""
update_schools.py
-----------------
Lädt die aktuelle Schuldaten-CSV von jedeschule.codefor.de
und importiert sie per Upsert in Neon PostgreSQL.
"""

import os
import sys
import logging
import requests
import pandas as pd
from io import StringIO
import psycopg2
from psycopg2.extras import execute_values

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)s  %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)

CSV_URL      = "https://jedeschule.codefor.de/csv-data/schools.csv"
BATCH_SIZE   = 500
DATABASE_URL = os.environ["DATABASE_URL"]

STATE_MAP = {
    "BB": "Brandenburg",    "BE": "Berlin",
    "BW": "Baden-Württemberg", "BY": "Bayern",
    "HB": "Bremen",         "HE": "Hessen",
    "HH": "Hamburg",        "MV": "Mecklenburg-Vorpommern",
    "NI": "Niedersachsen",  "NW": "Nordrhein-Westfalen",
    "RP": "Rheinland-Pfalz","SH": "Schleswig-Holstein",
    "SL": "Saarland",       "SN": "Sachsen",
    "ST": "Sachsen-Anhalt", "TH": "Thüringen",
}

def download_csv():
    log.info(f"Lade CSV von {CSV_URL} …")
    r = requests.get(CSV_URL, timeout=60)
    r.raise_for_status()
    df = pd.read_csv(StringIO(r.text), dtype=str)
    log.info(f"  → {len(df):,} Zeilen geladen")
    log.info(f"  → Spalten: {list(df.columns)}")
    return df

def transform(df):
    # Spalten-Mapping (passe an wenn CSV andere Namen hat)
    rename = {}
    for col in df.columns:
        lower = col.lower()
        if lower in ["id"]:           rename[col] = "id"
        elif lower in ["name"]:       rename[col] = "name"
        elif lower in ["address","adresse"]: rename[col] = "address"
        elif lower in ["zip","plz"]:  rename[col] = "zip"
        elif lower in ["city","ort"]: rename[col] = "city"
        elif lower in ["state","bundesland"]: rename[col] = "state"
        elif lower in ["school_type","schulart"]: rename[col] = "school_type"
        elif lower in ["website"]:    rename[col] = "website"
        elif lower in ["phone","telefon"]: rename[col] = "phone"

    df = df.rename(columns=rename)

    # Bundesland-Kürzel → Vollname
    if "state" in df.columns:
        df["state"] = df["state"].map(lambda s: STATE_MAP.get(str(s).strip(), str(s).strip()))

    # Nur vorhandene Felder
    fields = ["id","name","address","zip","city","state","school_type","website","phone"]
    available = [f for f in fields if f in df.columns]
    df = df[available].where(pd.notnull(df[available]), None)
    df["source"] = "jedeschule"

    return df, available + ["source"]

def upsert(df, columns):
    conn = psycopg2.connect(DATABASE_URL)
    cur  = conn.cursor()
    total   = len(df)
    batches = (total + BATCH_SIZE - 1) // BATCH_SIZE
    errors  = 0

    log.info(f"Starte Upsert ({total:,} Zeilen, {batches} Batches) …")

    # Update-Felder (alles außer id und source)
    update_cols = [c for c in columns if c not in ("id", "source")]
    update_sql  = ", ".join(f"{c} = EXCLUDED.{c}" for c in update_cols)

    insert_sql = f"""
        INSERT INTO schools ({", ".join(columns)})
        VALUES %s
        ON CONFLICT (id) DO UPDATE SET {update_sql}
        WHERE schools.source != 'manual'
    """

    for i in range(0, total, BATCH_SIZE):
        batch = df.iloc[i:i+BATCH_SIZE]
        rows  = [tuple(row) for row in batch[columns].values]
        try:
            execute_values(cur, insert_sql, rows)
            conn.commit()
            log.info(f"  Batch {i//BATCH_SIZE+1}/{batches} ✓")
        except Exception as e:
            conn.rollback()
            log.error(f"  Batch {i//BATCH_SIZE+1} FEHLER: {e}")
            errors += 1

    cur.close()
    conn.close()

    if errors:
        log.warning(f"Fertig mit {errors} Fehlern.")
        sys.exit(1)
    else:
        log.info(f"Alle {total:,} Schulen erfolgreich importiert ✓")

def main():
    df = download_csv()
    df, columns = transform(df)
    upsert(df, columns)

if __name__ == "__main__":
    main()
