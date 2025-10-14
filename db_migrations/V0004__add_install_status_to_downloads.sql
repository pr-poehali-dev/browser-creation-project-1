-- Add is_installed and installed_at columns to downloads table
ALTER TABLE downloads 
ADD COLUMN IF NOT EXISTS is_installed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS installed_at TIMESTAMP;

-- Rename status to download_status for consistency
ALTER TABLE downloads 
RENAME COLUMN status TO download_status;