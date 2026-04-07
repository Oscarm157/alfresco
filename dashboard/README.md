# Alfresco Dashboard

Dashboard web para seguimiento de tickets de soporte Alfresco y control de sprints de Appropia para ATISA.

## Stack

- Next.js 16
- React 19
- Tailwind CSS 4
- Supabase
- Recharts

## Funcionalidad

- Dashboard general de tickets
- Vista detallada de tickets
- Importacion de tickets desde Excel o CSV
- Seguimiento de tendencias mensuales
- Comparativa entre meses
- Control de horas y sprints de Appropia
- Importacion de horas de sprint

## Requisitos

- Node.js 20 o superior
- npm 10 o superior
- Un proyecto de Supabase con las tablas necesarias

## Variables de entorno

Crea un archivo `.env.local` con:

```bash
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
```

## Desarrollo local

```bash
npm install
npm run dev
```

La aplicacion queda disponible en `http://localhost:3000`.

## Verificacion antes de publicar

```bash
npm run lint
npm run build
```

## Despliegue

Puedes desplegarlo en Vercel o en cualquier entorno compatible con Next.js.

Checklist minimo:

- Variables de entorno configuradas
- Supabase accesible desde produccion
- `npm run build` exitoso
- Importaciones de tickets y horas validadas con datos reales

## Notas

- La ruta inicial redirige a `/dashboard`
- El proyecto esta pensado para uso publico o interno sin autenticacion fuerte
- El esquema SQL complementario de sprints esta en `sprint-schema.sql`
