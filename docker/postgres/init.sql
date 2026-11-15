-- Initialize PostgreSQL database for Corporate Task Management System
-- This file runs automatically when the postgres container starts

CREATE SCHEMA IF NOT EXISTS public;

-- Create useful PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
CREATE EXTENSION IF NOT EXISTS pgstattuple;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- You can add initial schema setup here
-- Example:
-- CREATE TABLE IF NOT EXISTS tasks (
--   id SERIAL PRIMARY KEY,
--   title VARCHAR(255) NOT NULL,
--   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );
