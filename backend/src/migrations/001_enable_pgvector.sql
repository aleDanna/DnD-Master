-- Migration: 001_enable_pgvector
-- Description: Enable pgvector extension for semantic search embeddings
-- Date: 2026-01-30

-- Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Also enable uuid-ossp for UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
