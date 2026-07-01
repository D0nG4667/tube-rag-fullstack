import argparse
import json
import logging
import os
import sys

import psycopg2

from app.core.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("tuberag.restore")


def run():
    parser = argparse.ArgumentParser(
        description="Restore database state from a local JSON backup file."
    )
    parser.add_argument(
        "--file",
        help="Path to the backup JSON file. If not specified, the latest file from migrations_backups/ is used.",
    )
    args = parser.parse_args()

    db_url = os.environ.get("DATABASE_URL") or settings.DATABASE_URL
    if not db_url:
        logger.error("DATABASE_URL is not set.")
        sys.exit(1)

    backup_dir = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "migrations_backups",
    )

    filepath = args.file
    if not filepath:
        if not os.path.exists(backup_dir):
            logger.error(
                "No migrations_backups/ folder found. Run migrations to create a backup first."
            )
            sys.exit(1)

        files = [
            f
            for f in os.listdir(backup_dir)
            if f.startswith("backup_") and f.endswith(".json")
        ]
        if not files:
            logger.error("No backup files found in migrations_backups/.")
            sys.exit(1)

        files.sort()
        filepath = os.path.join(backup_dir, files[-1])

    if not os.path.exists(filepath):
        logger.error(f"Backup file not found at: {filepath}")
        sys.exit(1)

    logger.info(f"Loading database backup from {filepath}...")
    try:
        with open(filepath, encoding="utf-8") as f:
            data = json.load(f)
    except Exception as e:
        logger.error(f"Failed to read backup file: {e}")
        sys.exit(1)

    videos = data.get("videos", [])
    playlists = data.get("playlists", [])
    joins = data.get("playlist_videos", [])
    chunks = data.get("video_chunks", [])

    logger.info(
        f"Found {len(videos)} videos, {len(playlists)} playlists, {len(joins)} playlist joins, and {len(chunks)} chunks to restore."
    )

    logger.info("Connecting to database...")
    try:
        conn = psycopg2.connect(db_url)
        with conn.cursor() as cur:
            # 1. Restore Videos
            logger.info("Restoring videos...")
            for vid in videos:
                cur.execute(
                    """
                    INSERT INTO public.videos (id, user_id, youtube_id, title, channel_name, duration, thumbnail_url, status, current_offset, error_message, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (id) DO UPDATE SET
                        user_id = EXCLUDED.user_id,
                        youtube_id = EXCLUDED.youtube_id,
                        title = EXCLUDED.title,
                        channel_name = EXCLUDED.channel_name,
                        duration = EXCLUDED.duration,
                        thumbnail_url = EXCLUDED.thumbnail_url,
                        status = EXCLUDED.status,
                        current_offset = EXCLUDED.current_offset,
                        error_message = EXCLUDED.error_message,
                        created_at = EXCLUDED.created_at,
                        updated_at = EXCLUDED.updated_at;
                """,
                    (
                        vid["id"],
                        vid["user_id"],
                        vid["youtube_id"],
                        vid["title"],
                        vid["channel_name"],
                        vid["duration"],
                        vid["thumbnail_url"],
                        vid["status"],
                        vid["current_offset"],
                        vid["error_message"],
                        vid["created_at"],
                        vid["updated_at"],
                    ),
                )

            # 2. Restore Playlists
            logger.info("Restoring playlists...")
            for pl in playlists:
                cur.execute(
                    """
                    INSERT INTO public.playlists (id, user_id, name, created_at)
                    VALUES (%s, %s, %s, %s)
                    ON CONFLICT (id) DO UPDATE SET
                        user_id = EXCLUDED.user_id,
                        name = EXCLUDED.name,
                        created_at = EXCLUDED.created_at;
                """,
                    (pl["id"], pl["user_id"], pl["name"], pl["created_at"]),
                )

            # 3. Restore Playlist Joins
            logger.info("Restoring playlist-video joins...")
            for jn in joins:
                cur.execute(
                    """
                    INSERT INTO public.playlist_videos (playlist_id, video_id)
                    VALUES (%s, %s)
                    ON CONFLICT (playlist_id, video_id) DO NOTHING;
                """,
                    (jn["playlist_id"], jn["video_id"]),
                )

            # 4. Restore Chunks
            logger.info("Restoring video chunks...")
            for ch in chunks:
                cur.execute(
                    """
                    INSERT INTO public.video_chunks (id, video_id, content, embedding, start_time, end_time, chunk_type, metadata, image_url, created_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (id) DO UPDATE SET
                        video_id = EXCLUDED.video_id,
                        content = EXCLUDED.content,
                        embedding = EXCLUDED.embedding,
                        start_time = EXCLUDED.start_time,
                        end_time = EXCLUDED.end_time,
                        chunk_type = EXCLUDED.chunk_type,
                        metadata = EXCLUDED.metadata,
                        image_url = EXCLUDED.image_url,
                        created_at = EXCLUDED.created_at;
                """,
                    (
                        ch["id"],
                        ch["video_id"],
                        ch["content"],
                        ch["embedding"],
                        ch["start_time"],
                        ch["end_time"],
                        ch["chunk_type"],
                        json.dumps(ch["metadata"]),
                        ch["image_url"],
                        ch["created_at"],
                    ),
                )

        conn.commit()
        logger.info("Database state successfully restored from backup.")
    except Exception as e:
        logger.error(f"Failed to restore database from backup: {e}", exc_info=True)
        sys.exit(1)
    finally:
        conn.close()


if __name__ == "__main__":
    run()
