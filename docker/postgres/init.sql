-- Initialize PostgreSQL database for Corporate Task Management System
-- This file runs automatically when the postgres container starts

CREATE SCHEMA IF NOT EXISTS public;
<<<<<<< HEAD
CREATE DATABASE corporate_tasks;
CREATE DATABASE rewards_db;
=======

-- Create useful PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
CREATE EXTENSION IF NOT EXISTS pgstattuple;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172
-- You can add initial schema setup here
-- Example:
-- CREATE TABLE IF NOT EXISTS tasks (
--   id SERIAL PRIMARY KEY,
--   title VARCHAR(255) NOT NULL,
--   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );
