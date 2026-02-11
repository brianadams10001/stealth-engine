
-- StealthCloak Industrial D1 Schema
CREATE TABLE IF NOT EXISTS traffic_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp BIGINT,
    ip_address TEXT,
    asn INTEGER,
    bot_score INTEGER,
    action_taken TEXT,
    subdomain TEXT,
    detection_reason TEXT,
    tls_cipher TEXT
);

CREATE INDEX IF NOT EXISTS idx_timestamp ON traffic_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_subdomain ON traffic_logs(subdomain);
CREATE INDEX IF NOT EXISTS idx_action ON traffic_logs(action_taken);
