CREATE TABLE hourlane.leads (
  id uuid PRIMARY KEY,
  request_id uuid NOT NULL UNIQUE,
  payload_digest char(64) NOT NULL CHECK (payload_digest ~ '^[0-9a-f]{64}$'),
  name varchar(120) NOT NULL CHECK (char_length(name) >= 2),
  email varchar(254) NOT NULL,
  company varchar(160) NOT NULL CHECK (char_length(company) >= 2),
  industry varchar(30) CHECK (industry IN ('shk', 'handwerk', 'dienstleistung', 'sonstiges')),
  challenge varchar(2000) NOT NULL CHECK (char_length(challenge) >= 10),
  privacy_notice_version varchar(80) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  status varchar(10) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  closed_at timestamptz,
  delete_after timestamptz,
  CONSTRAINT lead_retention_state CHECK (
    (status = 'open' AND closed_at IS NULL AND delete_after IS NULL)
    OR (status = 'closed' AND closed_at IS NOT NULL AND delete_after IS NOT NULL AND delete_after >= closed_at)
  )
);

CREATE INDEX leads_retention_idx ON hourlane.leads (delete_after) WHERE status = 'closed';

CREATE TABLE hourlane.rate_limit_buckets (
  bucket_key char(64) PRIMARY KEY CHECK (bucket_key ~ '^[0-9a-f]{64}$'),
  attempts integer NOT NULL CHECK (attempts > 0 AND attempts <= 5),
  expires_at timestamptz NOT NULL
);

CREATE INDEX rate_limit_expiry_idx ON hourlane.rate_limit_buckets (expires_at);

REVOKE ALL ON SCHEMA hourlane FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA hourlane FROM PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA hourlane FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA hourlane REVOKE ALL ON TABLES FROM PUBLIC;
