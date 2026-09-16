# APR Virtual IA — variables en Vercel (Production)

Configura estas variables en el proyecto de Vercel vinculado a tu rama personal. **No** incluyas valores reales en el repositorio.

## Secrets (Production **y Preview**)

Configura las mismas variables para **Production** y **Preview** si pruebas despliegues de rama personal.

| Variable | Tipo | Descripción |
|----------|------|-------------|
| `GROQ_API_KEY` | Secret | API key de Groq. Solo servidor. |
| `LIFEON_SESSION_SECRET` | Secret | Cadena aleatoria larga (32+ caracteres) para firmar la cookie `lifeon_session`. **Obligatoria** para APR Virtual IA. |

Tras agregar o cambiar variables: **Redeploy** del deployment.

## Si pide “iniciar sesión” para usar IA

1. El dashboard guarda usuario en el navegador; la IA usa cookie httpOnly aparte.
2. En el dashboard usa el banner **「Activar IA」** con tu contraseña, o cierra sesión y vuelve a entrar en `/login`.
3. Confirma que `LIFEON_SESSION_SECRET` existe en el entorno del deployment que estás probando.

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
