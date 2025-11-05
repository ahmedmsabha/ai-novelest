-- Add unique constraint to session_id in anonymous_usage table
ALTER TABLE anonymous_usage ADD CONSTRAINT unique_session_id UNIQUE (session_id);
