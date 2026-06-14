# Real Estate Agent Portal

A reusable React + Vite + Supabase template for a real estate agent's
private listings portal. Each deployment is for **one agent** (one
Supabase auth user) who manages their own listings.

The companion public website (where buyers browse listings) lives in a
separate repo and reads from the same Supabase project.

---

## Stack

- **React 18 + Vite + TypeScript**
- **Tailwind** for styling
- **React Router** for routing
- **Supabase** for auth, database, and storage
- Deployed on **Vercel**

---

## Quick start (local)

```bash
git clone <repo-url> my-client-portal
cd my-client-portal
cp .env.example .env
# fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm install
npm run dev
```

Open `http://localhost:5173`.

---

## Customizing for a new client

All per-client values live in **one file**: [`src/config.ts`](src/config.ts).

```ts
export const AGENT_CONFIG = {
  name: 'Jarvis Mendez',
  tagline: 'Encontrando el hogar que mereces',
  bio: '',
  whatsapp: '50372018215',
  website: 'https://jarvisrealty.thecitadl.com',
  portal:  'https://portal.thecitadl.com',
  primaryColor: '#C9A84C',
  logo: '/logo.svg',
};

export const BRAND_CONFIG = {
  name: 'The Citadl',          // platform brand (the company running the portals)
  supportUrl: 'mailto:hello@thecitadl.com',
  storagePrefix: 'thecitadl',  // namespaces localStorage keys per deployment
};
```

To fork for a new agent:

1. Duplicate this repo (GitHub → *Use this template* or `git clone` then
   re-init).
2. Edit `src/config.ts` with the new agent's values.
3. (Optional) drop a new logo at `public/logo.svg`.
4. Spin up a fresh Supabase project (see below).
5. Deploy to Vercel.

`primaryColor` is injected as the `--color-brand-accent` CSS variable at
boot, so the whole UI re-skins from that one value — no Tailwind config
edit needed.

---

## Environment variables

Only two are required:

| Variable                  | Where to find it                                |
| ------------------------- | ----------------------------------------------- |
| `VITE_SUPABASE_URL`       | Supabase → *Project Settings* → *API* → URL     |
| `VITE_SUPABASE_ANON_KEY`  | Same screen, the **anon public** key            |

Locally: copy `.env.example` to `.env`. On Vercel: add them under
*Project Settings → Environment Variables* (Production + Preview).

---

## Supabase setup (per client)

Each client gets their own Supabase project so data, auth users, and
storage are fully isolated.

1. **Create project** at [supabase.com](https://supabase.com).
2. **Schema** — create a `listings` table with at least:
   - `id uuid primary key default gen_random_uuid()`
   - `agent_id uuid not null` (will store `auth.users.id`)
   - `titulo, precio, ubicacion, descripcion, habitaciones, banos, metros, whatsapp text`
   - `tipo text` (`venta` | `alquiler`)
   - `status text default 'publicado'`
   - `featured boolean default false`
   - `property_type text` (`casa` | `apartamento` | `terreno` | `local comercial` | `oficina`)
   - `negociable boolean default false`
   - `sold_status text default 'disponible'` (`disponible` | `vendido` | `alquilado`)
   - `agent_name, website_url, video_url text`
   - `created_at timestamptz default now()`

   And a `listing_images` table:
   - `listing_id uuid references listings(id) on delete cascade`
   - `url text`
   - `order_index int`

3. **Row Level Security** — enable RLS on both tables and add policies
   that restrict access to `auth.uid() = agent_id`.

4. **Storage** — create a public bucket named `property-images`.

5. **Auth → URL Configuration** — set:
   - **Site URL**: `https://portal.YOURCLIENT.com`
   - **Redirect URLs**: add `https://portal.YOURCLIENT.com/set-password`
     (and `http://localhost:5173/set-password` for dev).

6. **Email templates → Invite user** — confirm the action link points
   at `{{ .SiteURL }}/set-password`.

---

## Inviting the agent

Once the Supabase project is provisioned:

1. Supabase Dashboard → **Authentication → Users → Invite user**.
2. Enter the agent's email.
3. The agent receives an email, clicks the link, lands on
   `/set-password`, picks a password, and is dropped into `/dashboard`.

That's the only auth method — there's no signup form. If the agent
forgets their password, they use **¿Olvidaste tu contraseña?** on the
login screen and get a `recovery` link that also routes through
`/set-password`.

---

## Deploying to Vercel

1. Push the repo to GitHub.
2. Vercel → *New Project* → import the repo.
3. Framework preset: **Vite** (auto-detected).
4. Add the two env vars from above to Production *and* Preview.
5. Deploy.

`vercel.json` is already set up to rewrite all routes to `index.html`,
so deep links like `/dashboard` and `/set-password` survive a refresh.

After the first deploy, add the production domain back into Supabase's
**Redirect URLs** list and update **Site URL**.

---

## Project layout

```
src/
  config.ts            ← edit me per client
  main.tsx             ← injects primaryColor + document title
  App.tsx              ← routes
  components/
    Layout.tsx         ← sidebar shell (welcome, nav, sign-out)
    PropertyForm.tsx   ← add/edit listing (with 30s draft autosave)
  pages/
    Login.tsx          ← email/password + forgot-password toggle
    SetPassword.tsx    ← invite / recovery / signup token handler
    Dashboard.tsx      ← listing table + stat cards + status toggles
    AddProperty.tsx
    EditProperty.tsx
    Profile.tsx        ← agent updates full_name + phone
  lib/
    supabase.ts        ← client (persistSession + detectSessionInUrl)
    auth.tsx           ← AuthProvider, sign-out, expired-session redirect
    authErrors.ts      ← Supabase error → Spanish copy
    api.ts             ← listings CRUD + image upload
    utils.ts
  types.ts             ← Property shape
```
