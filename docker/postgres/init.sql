-- Initialize PostgreSQL database for Corporate Task Management System
-- This file runs automatically when the postgres container starts

CREATE SCHEMA IF NOT EXISTS public;
CREATE DATABASE corporate_tasks;
CREATE DATABASE rewards_db;
-- You can add initial schema setup here
-- Example:
-- CREATE TABLE IF NOT EXISTS tasks (
--   id SERIAL PRIMARY KEY,
--   title VARCHAR(255) NOT NULL,
--   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );
