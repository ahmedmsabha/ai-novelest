-- Add new columns to stories table for novel publishing features

ALTER TABLE stories 
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS outline TEXT,
ADD COLUMN IF NOT EXISTS chapters_data JSONB;

-- Create index for published stories
CREATE INDEX IF NOT EXISTS idx_stories_published ON stories(is_published) WHERE is_published = true;

-- Update existing novels to be published by default
UPDATE stories SET is_published = true WHERE story_type = 'novel' OR story_type = 'story';
