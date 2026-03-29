import os
import psycopg2
import psycopg2.extras
from contextlib import contextmanager

PG_DATABASE_URL = os.environ.get("PG_DATABASE_URL", "")


@contextmanager
def get_cursor():
    """Context manager that yields a RealDictCursor and handles cleanup."""
    conn = psycopg2.connect(PG_DATABASE_URL)
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    try:
        yield cur
        conn.commit()
    finally:
        cur.close()
        conn.close()
