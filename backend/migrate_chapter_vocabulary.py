"""
Turso DB Migration Script
Migrate chapter_vocabulary table: change chapter_id from TEXT to INTEGER
"""
import os
import sys
from dotenv import load_dotenv

# UTF-8 encoding for Windows console
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

load_dotenv()

TURSO_DATABASE_URL = os.getenv("TURSO_DATABASE_URL")
TURSO_AUTH_TOKEN = os.getenv("TURSO_AUTH_TOKEN")

if not TURSO_DATABASE_URL or not TURSO_AUTH_TOKEN:
    print("[ERROR] TURSO_DATABASE_URL or TURSO_AUTH_TOKEN not set.")
    print("        Please check your .env file.")
    exit(1)

try:
    import libsql_client
except ImportError:
    print("[ERROR] libsql_client not installed.")
    print("        Run: pip install libsql-client")
    exit(1)

print(f"Connecting to Turso DB: {TURSO_DATABASE_URL}")

try:
    # Connect to Turso DB
    client = libsql_client.create_client_sync(
        url=TURSO_DATABASE_URL,
        auth_token=TURSO_AUTH_TOKEN
    )

    print("[OK] Connected to Turso DB!")
    print()

    # 1. Drop existing table
    print("[1/3] Dropping existing chapter_vocabulary table...")
    client.execute("DROP TABLE IF EXISTS chapter_vocabulary")
    print("[OK] Table dropped")
    print()

    # 2. Create new table
    print("[2/3] Creating new chapter_vocabulary table...")
    client.execute("""
        CREATE TABLE chapter_vocabulary (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            chapter_id INTEGER NOT NULL,
            word TEXT NOT NULL,
            definition TEXT NOT NULL,
            example TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(chapter_id, word),
            FOREIGN KEY (chapter_id) REFERENCES chapters(id)
        )
    """)
    print("[OK] Table created")
    print()

    # 3. Verify table
    print("[3/3] Verifying table schema...")
    result = client.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='chapter_vocabulary'")
    if result.rows:
        print("[OK] Table schema:")
        print(result.rows[0][0])
    print()

    print("=" * 70)
    print("MIGRATION COMPLETED!")
    print("=" * 70)
    print()
    print("[OK] chapter_vocabulary table updated successfully")
    print("[OK] Mobile app will now work correctly with vocabulary feature")
    print()
    print("Changes:")
    print("  - chapter_id: TEXT -> INTEGER")
    print("  - Added FOREIGN KEY to chapters(id)")
    print("  - Old data deleted (will be regenerated on first use)")

    client.close()

except Exception as e:
    print(f"[ERROR] {e}")
    print()
    print("Troubleshooting:")
    print("  1. Check TURSO_DATABASE_URL and TURSO_AUTH_TOKEN")
    print("  2. Verify Turso DB is running")
    print("  3. Check network connection")
    exit(1)
