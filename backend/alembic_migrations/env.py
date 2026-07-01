from logging.config import fileConfig

from alembic import context
from sqlalchemy import create_engine, pool

from app.core.config import settings

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
# Only configure logging if we are not instructed to skip it (e.g. during FastAPI startup).
if config.config_file_name is not None and config.attributes.get(
    "configure_logging", True
):
    fileConfig(config.config_file_name, disable_existing_loggers=False)

target_metadata = None


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = settings.DATABASE_URL
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def backup_database_state(connection) -> None:
    """Safely dumps the videos, playlists, playlist_videos, and video_chunks tables

    to a local JSON file prior to executing any database migration changes.
    """
    import json
    import os
    from datetime import datetime

    import psycopg2
    from psycopg2.extras import RealDictCursor

    try:
        db_url = settings.DATABASE_URL
        if not db_url:
            return

        # Create an isolated connection to perform the read-only backup,
        # leaving the Alembic SQLAlchemy connection's transaction state untouched.
        # This prevents transaction auto-start/rollback conflicts in SQLAlchemy 2.0.
        with psycopg2.connect(db_url) as conn:
            with conn.cursor() as cur:
                # 1. Check if the videos table exists (avoids error on fresh install)
                cur.execute(
                    "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'videos');"
                )
                if not cur.fetchone()[0]:
                    return

            with conn.cursor(cursor_factory=RealDictCursor) as dict_cur:
                # 2. Fetch all videos
                dict_cur.execute(
                    "SELECT id, user_id, youtube_id, title, channel_name, duration, thumbnail_url, status, current_offset, error_message, created_at, updated_at FROM public.videos;"
                )
                videos = [dict(row) for row in dict_cur.fetchall()]
                if not videos:
                    return

                # 3. Fetch all playlists
                dict_cur.execute(
                    "SELECT id, user_id, name, created_at FROM public.playlists;"
                )
                playlists = [dict(row) for row in dict_cur.fetchall()]

                # 4. Fetch all playlist_videos
                dict_cur.execute(
                    "SELECT playlist_id, video_id FROM public.playlist_videos;"
                )
                joins = [dict(row) for row in dict_cur.fetchall()]

                # 5. Fetch all video_chunks
                dict_cur.execute(
                    "SELECT id, video_id, content, embedding, start_time, end_time, chunk_type, metadata, image_url, created_at FROM public.video_chunks;"
                )
                chunks = []
                for row in dict_cur.fetchall():
                    row_dict = dict(row)
                    if row_dict.get("embedding") is not None:
                        # Handle potential pgvector string representation: e.g. "[0.1,0.2,...]"
                        if isinstance(row_dict["embedding"], str):
                            cleaned = row_dict["embedding"].strip("[]").strip()
                            row_dict["embedding"] = (
                                [float(x) for x in cleaned.split(",") if x.strip()]
                                if cleaned
                                else []
                            )
                        elif hasattr(row_dict["embedding"], "__iter__"):
                            row_dict["embedding"] = list(row_dict["embedding"])
                    chunks.append(row_dict)

        # 6. Format non-serializable fields (UUID, datetime)
        def default_serializer(o):
            from datetime import datetime
            from uuid import UUID

            if isinstance(o, UUID):
                return str(o)
            if isinstance(o, datetime):
                return o.isoformat()
            raise TypeError(f"Object of type {type(o)} is not JSON serializable")

        backup_data = {
            "videos": videos,
            "playlists": playlists,
            "playlist_videos": joins,
            "video_chunks": chunks,
        }

        # 7. Create backups directory
        backup_dir = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            "migrations_backups",
        )
        os.makedirs(backup_dir, exist_ok=True)

        filename = f"backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        filepath = os.path.join(backup_dir, filename)

        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(backup_data, f, default=default_serializer, indent=2)

        print(
            f"INFO  [alembic.runtime.migration] Database state successfully backed up to {filepath}"
        )
    except Exception as e:
        print(
            f"WARNING [alembic.runtime.migration] Failed to create database backup: {e}"
        )


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    url = settings.DATABASE_URL
    connectable = create_engine(
        url,
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        # Automatically back up existing data before executing migrations
        backup_database_state(connection)

        context.configure(connection=connection, target_metadata=target_metadata)

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
