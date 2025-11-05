-- Drop all existing tables in reverse order (to handle foreign key constraints)
DROP TABLE IF EXISTS credits_transactions CASCADE;
DROP TABLE IF EXISTS user_credits CASCADE;
DROP TABLE IF EXISTS anonymous_usage CASCADE;
DROP TABLE IF EXISTS stories CASCADE;
DROP TABLE IF EXISTS users CASCADE;
