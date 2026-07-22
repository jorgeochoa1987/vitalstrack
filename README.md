# VitalsTrack

App de seguimiento de tensión arterial (Vite + React + Supabase + Google Auth).

## Desarrollo local

```bash
npm install
cp .env.example .env.local
# Completa VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY
npm run dev
```

## Supabase

1. En SQL Editor ejecuta `supabase/setup_all.sql` (una vez).
2. Authentication → Providers → **Google** → Enable (Client ID / Secret de Google Cloud).
3. Redirect URI de Google Cloud:
   `https://YOUR_PROJECT.supabase.co/auth/v1/callback`
4. Authentication → URL Configuration:
   - Site URL: `http://localhost:5173` (y luego tu dominio Vercel)
   - Redirect URLs: `http://localhost:5173/auth/callback` y `https://TU-APP.vercel.app/auth/callback`

## Vercel

1. Importa este repo (framework Vite, root del proyecto).
2. Variables de entorno:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
3. Redeploy tras guardar las variables.
4. Añade en Supabase el redirect de producción: `https://TU-APP.vercel.app/auth/callback`

## Funciones

- Login con Google
- Perfil, citas médicas y tomas programadas
- Historial, gráficos y clasificación AHA/ACC 2025
- Tips de salud educativos
