# APR Virtual IA — variables en Vercel (Production)

Configura estas variables en el proyecto de Vercel vinculado a tu rama personal. **No** incluyas valores reales en el repositorio.

## Secrets (Environment: Production)

| Variable | Tipo | Descripción |
|----------|------|-------------|
| `GROQ_API_KEY` | Secret | API key de Groq. Solo servidor. |
| `LIFEON_SESSION_SECRET` | Secret | Cadena aleatoria larga para firmar la cookie `lifeon_session` (httpOnly). |

## Opcionales

| Variable | Default | Descripción |
|----------|---------|-------------|
| `GROQ_MODEL` | `openai/gpt-oss-20b` | Modelo Groq. |

## Ya existentes (Supabase)

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Migración Supabase

Ejecuta en el SQL Editor de tu proyecto Supabase personal:

`supabase/migrations/20260917_apr_ai_usage_and_cache.sql`

Tablas: `apr_ai_usage`, `apr_ai_suggestion_cache`.

## Desarrollo local

Copia `.env.local.example` a `.env.local` y completa `GROQ_API_KEY` y `LIFEON_SESSION_SECRET`.

## Seguridad

- No uses `NEXT_PUBLIC_GROQ_API_KEY`.
- No commitees `.env.local`.
- La cookie de sesión del dashboard para IA es independiente de NextAuth (admin/comercio).
