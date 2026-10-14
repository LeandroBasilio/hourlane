-- Run as database administrator after creating the roles through your provider.
-- Replace these role names if required. Never add runtime to an owner/admin role.
-- Do not grant this schema to anon/authenticated roles or expose it through a Data API.
GRANT USAGE ON SCHEMA hourlane TO hourlane_runtime;
GRANT SELECT (request_id, payload_digest), INSERT ON hourlane.leads TO hourlane_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON hourlane.rate_limit_buckets TO hourlane_runtime;

GRANT USAGE ON SCHEMA hourlane TO hourlane_operator;
GRANT SELECT, UPDATE, DELETE ON hourlane.leads TO hourlane_operator;
GRANT DELETE ON hourlane.rate_limit_buckets TO hourlane_operator;
