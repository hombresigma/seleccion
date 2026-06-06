# Selección de Docentes

Software para **selección de docentes en concursos universitarios** mediante
criterios ponderados. Cada criterio tiene un **peso en %** (el total debe sumar
**100%**). Un **jurado múltiple** califica a cada participante (0–100) en cada
criterio y el sistema:

- promedia los puntajes del jurado por criterio,
- pondera cada promedio por el peso del criterio,
- arma un **cuadro** donde cada **columna es un criterio** y cada fila un
  participante, con una **columna/fila de acumulado**, y
- resalta al **docente con mayor calificación**.

Todo el cálculo ponderado se hace **en PostgreSQL** (función
`resultados_concurso`). Base de datos en **Supabase**, app **Next.js**
desplegable en **Vercel**.

---

## Stack

- **Next.js 14** (App Router, Server Actions) + TypeScript + Tailwind
- **Supabase**: PostgreSQL + Auth (email/contraseña) + Row Level Security
- **Vercel**: hosting del frontend/servidor

## Roles

- **admin**: crea concursos, criterios (con pesos) y participantes.
  El **primer usuario que se registra queda como admin** automáticamente.
- **jurado**: carga sus propias calificaciones. Todos ven el cuadro de resultados.

Para hacer admin a otro usuario, en Supabase SQL Editor:

```sql
update public.profiles set rol = 'admin' where email = 'persona@ejemplo.com';
```

---

## Puesta en marcha

### 1. Crear el proyecto en Supabase

1. Entrá a <https://supabase.com> → **New project**.
2. Cuando esté listo, abrí **SQL Editor → New query**, pegá el contenido de
   [`supabase/schema.sql`](supabase/schema.sql) y ejecutá (**Run**).
3. (Opcional) Para datos de demostración, ejecutá también
   [`supabase/seed.sql`](supabase/seed.sql): crea un concurso de ejemplo con
   criterios típicos (que suman 100%) y participantes.
4. En **Project Settings → API** copiá:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. (Opcional, para probar rápido sin confirmar emails) en
   **Authentication → Providers → Email** desactivá *Confirm email*.

### 2. Correr localmente

```bash
cp .env.local.example .env.local   # y completá las dos variables
npm install
npm run dev
```

Abrí <http://localhost:3000>, registrate (ese primer usuario será **admin**),
creá un concurso, cargá criterios con sus pesos (que sumen 100%), agregá
participantes y calificá.

### 3. Desplegar en Vercel

1. Subí el proyecto a un repositorio de GitHub.
2. En <https://vercel.com> → **Add New → Project** → importá el repo.
3. En **Environment Variables** agregá:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. **Deploy**. (Vercel usa Node 20+, recomendado por Supabase.)
5. En Supabase **Authentication → URL Configuration** agregá la URL de Vercel a
   *Site URL* / *Redirect URLs*.

---

## Modelo de datos (PostgreSQL)

| Tabla            | Descripción                                                    |
| ---------------- | -------------------------------------------------------------- |
| `profiles`       | Usuario + rol (`admin` / `jurado`). Se crea al registrarse.    |
| `concursos`      | Concurso docente.                                              |
| `criterios`      | Criterio de un concurso con su **peso %** (0–100).             |
| `participantes`  | Docentes que se presentan.                                     |
| `calificaciones` | Puntaje (0–100) de un jurado a un participante en un criterio. |

Función clave: `resultados_concurso(p_concurso_id uuid) → jsonb` calcula
promedios del jurado, aportes ponderados, acumulados y el ganador.

> **Aporte** de un criterio = `promedio_del_jurado × (peso ÷ 100)`
> **Acumulado** de un participante = suma de los aportes de todos los criterios.
