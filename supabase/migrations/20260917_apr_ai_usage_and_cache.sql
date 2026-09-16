-- APR Virtual IA: rate limiting and suggestion cache

CREATE TABLE IF NOT EXISTS apr_ai_usage (
    org_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    window_type TEXT NOT NULL CHECK (window_type IN ('minute', 'day')),
    window_start TIMESTAMPTZ NOT NULL,
    request_count INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (org_id, user_id, window_type, window_start)
);

CREATE INDEX IF NOT EXISTS idx_apr_ai_usage_org_day
    ON apr_ai_usage (org_id, window_type, window_start);

CREATE TABLE IF NOT EXISTS apr_ai_suggestion_cache (
    cache_key TEXT PRIMARY KEY,
    org_id TEXT NOT NULL,
    payload JSONB NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_apr_ai_suggestion_cache_expires
    ON apr_ai_suggestion_cache (expires_at);

CREATE INDEX IF NOT EXISTS idx_apr_ai_suggestion_cache_org
    ON apr_ai_suggestion_cache (org_id);
