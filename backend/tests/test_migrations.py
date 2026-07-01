import os
from pathlib import Path


def test_migration_sql_exists():
    versions_dir = Path(__file__).parent.parent / "alembic_migrations" / "versions"
    assert versions_dir.exists()

    # Find the init_schema python migration file
    migration_files = [
        f for f in os.listdir(versions_dir) if f.endswith("_init_schema.py")
    ]
    assert len(migration_files) == 1

    migration_file = versions_dir / migration_files[0]
    py_content = migration_file.read_text(encoding="utf-8")

    assert "create table if not exists public.videos" in py_content
    assert "create table if not exists public.playlists" in py_content
    assert "create table if not exists public.playlist_videos" in py_content
    assert "create table if not exists public.video_chunks" in py_content
    assert "hybrid_search" in py_content
