-- Odoo Database Initialization
-- This script creates the necessary role and database for Odoo

-- Create Odoo database if it doesn't exist
SELECT 'CREATE DATABASE odoo OWNER postgres'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'odoo')\gexec

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE odoo TO postgres;
ALTER DATABASE odoo OWNER TO postgres;

-- Create schema
\c odoo
CREATE SCHEMA IF NOT EXISTS public;
GRANT ALL PRIVILEGES ON SCHEMA public TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
