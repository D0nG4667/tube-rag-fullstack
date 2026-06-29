from pathlib import Path


def test_migration_sql_exists():
    migration_file = Path(__file__).parent.parent / "migrations" / "01_init_schema.sql"
    assert migration_file.exists()
    sql_content = migration_file.read_text(encoding="utf-8")
    assert "create table if not exists public.videos" in sql_content
    assert "create table if not exists public.playlists" in sql_content
    assert "create table if not exists public.playlist_videos" in sql_content
    assert "create table if not exists public.video_chunks" in sql_content
    assert "hybrid_search" in sql_content
