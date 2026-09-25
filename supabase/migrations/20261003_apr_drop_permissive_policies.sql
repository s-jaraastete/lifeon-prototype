-- Remove permissive APR policies so only service_role (and deny-all for clients) applies.

DROP POLICY IF EXISTS "apr_ai_usage_member" ON apr_ai_usage;
DROP POLICY IF EXISTS "apr_ai_cache_member" ON apr_ai_suggestion_cache;
DROP POLICY IF EXISTS "apr_ai_cache_write" ON apr_ai_suggestion_cache;

-- Keep deny policies from 20260931 (apr_ai_usage_service_only, apr_ai_cache_service_only).
