import os
import sys
import psycopg2


def run():
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        print("DATABASE_URL is not set.")
        return

    print("Connecting to database...")
    try:
        conn = psycopg2.connect(db_url)
        with conn.cursor() as cur:
            migration_path = os.path.join(
                os.path.dirname(os.path.dirname(__file__)),
                "migrations",
                "01_init_schema.sql",
            )
            print(f"Reading migration from {migration_path}...")
            with open(migration_path, "r", encoding="utf-8") as f:
                sql = f.read()
                print("Executing SQL migration script...")
                cur.execute(sql)
        conn.commit()
        conn.close()
        print("Migration executed successfully.")
    except Exception as e:
        print(f"Migration failed: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    run()
