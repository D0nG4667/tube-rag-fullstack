import hashlib
import os
import sys

import psycopg2

from app.core.config import settings


def run():
    db_url = os.environ.get("DATABASE_URL") or settings.DATABASE_URL
    if not db_url:
        print("DATABASE_URL is not set.")
        return

    migration_path = os.path.join(
        os.path.dirname(os.path.dirname(__file__)),
        "migrations",
        "01_init_schema.sql",
    )
    if not os.path.exists(migration_path):
        print(f"Migration file not found at: {migration_path}")
        return

    # 1. Compute file SHA-256 hash to detect changes
    print("Computing migration file hash...")
    try:
        with open(migration_path, "rb") as f:
            file_bytes = f.read()
            sql_hash = hashlib.sha256(file_bytes).hexdigest()
    except Exception as e:
        print(f"Failed to read migration file: {e}", file=sys.stderr)
        sys.exit(1)

    print("Connecting to database...")
    try:
        conn = psycopg2.connect(db_url)
        with conn.cursor() as cur:
            # 2. Ensure migration tracking table exists
            cur.execute("""
                CREATE TABLE IF NOT EXISTS public.migration_history (
                    id SERIAL PRIMARY KEY,
                    migration_name VARCHAR(255) UNIQUE NOT NULL,
                    sha256_hash VARCHAR(64) NOT NULL,
                    applied_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
                );
            """)

            # 3. Check if hash matches previously applied hash
            cur.execute(
                "SELECT sha256_hash FROM public.migration_history WHERE migration_name = %s",
                ("01_init_schema.sql",),
            )
            row = cur.fetchone()
            if row and row[0] == sql_hash:
                print("Migration 01_init_schema.sql is already up to date. Skipping execution.")
                conn.close()
                return

            # 4. Apply changes if hash changed or missing
            print("Executing SQL migration script...")
            sql_text = file_bytes.decode("utf-8")
            cur.execute(sql_text)

            # 5. Record applied migration status
            cur.execute("""
                INSERT INTO public.migration_history (migration_name, sha256_hash, applied_at)
                VALUES (%s, %s, now())
                ON CONFLICT (migration_name) 
                DO UPDATE SET sha256_hash = EXCLUDED.sha256_hash, applied_at = now();
            """, ("01_init_schema.sql", sql_hash))

        conn.commit()
        conn.close()
        print("Migration executed and logged successfully.")
    except Exception as e:
        print(f"Migration failed: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    run()
