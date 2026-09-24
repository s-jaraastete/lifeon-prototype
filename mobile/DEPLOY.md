# LifeOn Mobile en `/mobile` (mismo Vercel que la web)

El prototipo web se publica en la **misma** URL de LifeOn:

`https://lifeon-prototype.vercel.app/mobile`

## Cómo funciona

1. `npm run build` en la raíz ejecuta [`scripts/build-mobile-web.mjs`](../scripts/build-mobile-web.mjs), que exporta Expo Web a [`public/mobile/`](../public/mobile/) con `baseUrl: /mobile`.
2. `next build` incluye esos estáticos y [`next.config.ts`](../next.config.ts) reescribe rutas SPA bajo `/mobile/*` hacia `index.html`.

## Variables en Vercel (proyecto Next.js existente)

No hace falta un segundo proyecto. Asegúrate de tener (ya las usas para la web):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

El script de build copia esos valores a `EXPO_PUBLIC_*` durante el export si no existen por separado.

Opcional: `NEXT_PUBLIC_MOBILE_PROTOTYPE_URL` solo si quieres otro enlace en `/login` (por defecto apunta a `/mobile`).

## Build local

```bash
npm run mobile:build:web   # solo mobile → public/mobile
npm run build              # mobile + Next.js
```

Luego `npm start` y abre `http://localhost:3000/mobile`.

## Desarrollo del app nativo / Expo

```bash
cd mobile
npm run web    # localhost Expo (sin prefijo /mobile)
```
