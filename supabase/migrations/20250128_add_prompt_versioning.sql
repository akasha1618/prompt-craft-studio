-- Add parent_id column to prompts table for version control
ALTER TABLE prompts ADD COLUMN parent_id UUID REFERENCES prompts(id) ON DELETE CASCADE;

-- Create index for better performance when querying versions
CREATE INDEX idx_prompts_parent_id ON prompts(parent_id);

-- Create index for user_id + parent_id queries  
CREATE INDEX idx_prompts_user_parent ON prompts(user_id, parent_id);

-- Add a comment to document the versioning system
COMMENT ON COLUMN prompts.parent_id IS 'References the original prompt ID for versions. NULL for original prompts.'; 