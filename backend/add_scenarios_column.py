import os
from dotenv import load_dotenv
import libsql_client

load_dotenv()

TURSO_DATABASE_URL = os.getenv("TURSO_DATABASE_URL")
TURSO_AUTH_TOKEN = os.getenv("TURSO_AUTH_TOKEN")

if TURSO_DATABASE_URL and TURSO_AUTH_TOKEN:
    print(f"Connecting to Turso: {TURSO_DATABASE_URL}")
    client = libsql_client.create_client_sync(
        url=TURSO_DATABASE_URL,
        auth_token=TURSO_AUTH_TOKEN
    )

    try:
        # scenarios 컬럼 추가
        result = client.execute("ALTER TABLE heroes ADD COLUMN scenarios TEXT")
        print("Successfully added 'scenarios' column to heroes table")
        print(result)
    except Exception as e:
        print(f"Error (may already exist): {e}")
    finally:
        client.close()
else:
    print("Turso credentials not found")
