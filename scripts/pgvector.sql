-- ============================================================
-- SGRWDH PGVECTOR EXTENSION FOR RAG
-- Run this in Supabase SQL Editor AFTER schema.sql
-- ============================================================

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding columns (BGE-M3 produces 1024-dim vectors)
ALTER TABLE authors ADD COLUMN IF NOT EXISTS embedding vector(1024);
ALTER TABLE works ADD COLUMN IF NOT EXISTS embedding vector(1024);

-- Create HNSW indexes for fast similarity search
CREATE INDEX IF NOT EXISTS idx_authors_embedding ON authors
  USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_works_embedding ON works
  USING hnsw (embedding vector_cosine_ops);

-- Function: semantic search over authors
CREATE OR REPLACE FUNCTION match_authors(
  query_embedding vector(1024),
  match_count int DEFAULT 5,
  match_threshold float DEFAULT 0.0
)
RETURNS TABLE(
  id text,
  author_name text,
  life text,
  language text,
  tm_id text,
  tm_uri text,
  ciris_url text,
  similarity float
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.author_name,
    a.life,
    a.language,
    a.tm_id,
    a.tm_uri,
    a.ciris_url,
    1 - (a.embedding <=> query_embedding) AS similarity
  FROM authors a
  WHERE a.embedding IS NOT NULL
    AND 1 - (a.embedding <=> query_embedding) > match_threshold
  ORDER BY a.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Function: semantic search over works
CREATE OR REPLACE FUNCTION match_works(
  query_embedding vector(1024),
  match_count int DEFAULT 5,
  match_threshold float DEFAULT 0.0
)
RETURNS TABLE(
  id text,
  work_title text,
  synopsis text,
  author_id text,
  genre text,
  is_fragmentary boolean,
  author_name text,
  similarity float
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    w.id,
    w.work_title,
    w.synopsis,
    w.author_id,
    w.genre,
    w.is_fragmentary,
    a.author_name,
    1 - (w.embedding <=> query_embedding) AS similarity
  FROM works w
  LEFT JOIN authors a ON w.author_id = a.id
  WHERE w.embedding IS NOT NULL
    AND 1 - (w.embedding <=> query_embedding) > match_threshold
  ORDER BY w.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
