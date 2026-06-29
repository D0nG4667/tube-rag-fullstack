-- Enable pgvector and pg_trgm extensions
create extension if not exists vector;
create extension if not exists pg_trgm;

-- Videos table
create table if not exists public.videos (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    youtube_id varchar(255) not null,
    title text,
    channel_name varchar(255),
    duration double precision,
    thumbnail_url text,
    status varchar(50) default 'pending', -- pending, downloading, transcribing, processing_frames, completed, failed
    current_offset double precision default 0.0,
    error_message text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(user_id, youtube_id)
);

-- Playlists table
create table if not exists public.playlists (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    name varchar(255) not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(user_id, name)
);

-- Playlist-Video Join table
create table if not exists public.playlist_videos (
    playlist_id uuid references public.playlists(id) on delete cascade not null,
    video_id uuid references public.videos(id) on delete cascade not null,
    primary key (playlist_id, video_id)
);

-- Video Chunk Embeddings (Hierarchical indexing for transcripts & slides)
create table if not exists public.video_chunks (
    id uuid default gen_random_uuid() primary key,
    video_id uuid references public.videos(id) on delete cascade not null,
    content text not null,
    fts_content tsvector generated always as (to_tsvector('english', content)) stored,
    embedding vector(768) not null,
    start_time double precision not null,
    end_time double precision not null,
    chunk_type varchar(50) not null, -- 'transcript' | 'visual_frame'
    metadata jsonb default '{}'::jsonb, -- e.g., slide title, OCR confidence, code block lines
    image_url text, -- Supabase Storage URL for visual_frame chunks
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for performance
create index if not exists video_chunks_embedding_hnsw_idx on public.video_chunks using hnsw (embedding vector_cosine_ops);
create index if not exists idx_chunks_video_id on public.video_chunks(video_id);
create index if not exists idx_chunks_fts on public.video_chunks using gin(fts_content);
create index if not exists idx_chunks_metadata on public.video_chunks using gin(metadata);

-- Hybrid Search Function with Reciprocal Rank Fusion (RRF)
create or replace function hybrid_search(
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
    with vector_search as (
        select 
            id,
            row_number() over (order by embedding <=> query_embedding) as rank
        from public.video_chunks
        where video_id = target_video_id
        limit match_count * 2
    ),
    fts_search as (
        select 
            id,
            row_number() over (order by ts_rank_cd(fts_content, plainto_tsquery('english', query_text)) desc) as rank
        from public.video_chunks
        where video_id = target_video_id and fts_content @@ plainto_tsquery('english', query_text)
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
        coalesce(1.0 / (rrf_k + vs.rank), 0.0) + coalesce(1.0 / (rrf_k + fs.rank), 0.0) as combined_score
    from public.video_chunks vc
    left join vector_search vs on vc.id = vs.id
    left join fts_search fs on vc.id = fs.id
    where vs.id is not null or fs.id is not null
    order by combined_score desc
    limit match_count;
end;
$$;
