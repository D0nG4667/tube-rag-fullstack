"""fix_hybrid_search_ambiguity

Revision ID: ad91d2eef70b
Revises: db178c4b653b
Create Date: 2026-07-01 06:31:51.300340

"""

from collections.abc import Sequence

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "ad91d2eef70b"
down_revision: str | Sequence[str] | None = "db178c4b653b"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("""
    create or replace function public.hybrid_search(
        query_text text,
        query_embedding vector(768),
        target_video_id uuid,
        match_count int,
        rrf_k int default 60
    )
    returns table (
        chunk_id uuid,
        content text,
        start_time double precision,
        end_time double precision,
        chunk_type varchar(50),
        image_url text,
        metadata jsonb,
        combined_score double precision
    )
    language plpgsql
    as $$
    begin
        return query
        with filtered_chunks as materialized (
            select 
                vc.id, 
                vc.content, 
                vc.embedding, 
                vc.fts_content, 
                vc.start_time, 
                vc.end_time, 
                vc.chunk_type, 
                vc.image_url, 
                vc.metadata
            from public.video_chunks vc
            where vc.video_id = target_video_id
        ),
        vector_search as (
            select 
                id,
                row_number() over (order by embedding <=> query_embedding) as rank
            from filtered_chunks
            limit match_count * 2
        ),
        fts_search as (
            select 
                id,
                row_number() over (order by ts_rank_cd(fts_content, plainto_tsquery('english', query_text)) desc) as rank
            from filtered_chunks
            where fts_content @@ plainto_tsquery('english', query_text)
            limit match_count * 2
        )
        select 
            vc.id as chunk_id,
            vc.content,
            vc.start_time,
            vc.end_time,
            vc.chunk_type,
            vc.image_url,
            vc.metadata,
            (coalesce(1.0 / (rrf_k + vs.rank), 0.0) + coalesce(1.0 / (rrf_k + fs.rank), 0.0))::double precision as combined_score
        from filtered_chunks vc
        left join vector_search vs on vc.id = vs.id
        left join fts_search fs on vc.id = fs.id
        where vs.id is not null or fs.id is not null
        order by combined_score desc
        limit match_count;
    end;
    $$;
    """)


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("""
    create or replace function public.hybrid_search(
        query_text text,
        query_embedding vector(768),
        target_video_id uuid,
        match_count int,
        rrf_k int default 60
    )
    returns table (
        chunk_id uuid,
        content text,
        start_time double precision,
        end_time double precision,
        chunk_type varchar(50),
        image_url text,
        metadata jsonb,
        combined_score double precision
    )
    language plpgsql
    as $$
    begin
        return query
        with filtered_chunks as materialized (
            select id, embedding, fts_content, start_time, end_time, chunk_type, image_url, metadata
            from public.video_chunks
            where video_id = target_video_id
        ),
        vector_search as (
            select 
                id,
                row_number() over (order by embedding <=> query_embedding) as rank
            from filtered_chunks
            limit match_count * 2
        ),
        fts_search as (
            select 
                id,
                row_number() over (order by ts_rank_cd(fts_content, plainto_tsquery('english', query_text)) desc) as rank
            from filtered_chunks
            where fts_content @@ plainto_tsquery('english', query_text)
            limit match_count * 2
        )
        select 
            vc.id as chunk_id,
            vc.content,
            vc.start_time,
            vc.end_time,
            vc.chunk_type,
            vc.image_url,
            vc.metadata,
            (coalesce(1.0 / (rrf_k + vs.rank), 0.0) + coalesce(1.0 / (rrf_k + fs.rank), 0.0))::double precision as combined_score
        from filtered_chunks vc
        left join vector_search vs on vc.id = vs.id
        left join fts_search fs on vc.id = fs.id
        where vs.id is not null or fs.id is not null
        order by combined_score desc
        limit match_count;
    end;
    $$;
    """)
