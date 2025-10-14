CREATE TABLE IF NOT EXISTS downloads (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    file_name VARCHAR(500) NOT NULL,
    file_url TEXT NOT NULL,
    file_size BIGINT,
    file_type VARCHAR(100),
    status VARCHAR(50) DEFAULT 'completed',
    progress INTEGER DEFAULT 100,
    download_speed VARCHAR(50),
    time_remaining VARCHAR(50),
    created_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP
);

CREATE INDEX idx_downloads_user_id ON downloads(user_id);
CREATE INDEX idx_downloads_created_at ON downloads(created_at DESC);