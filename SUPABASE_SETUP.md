# Supabase setup for Luna

This wires up Tier 3 (accounts) for Luna. The vault encryption (cycle data) stays entirely on-device; this layer only handles login, email, and (later) billing.

## 1. Create the project

1. Go to https://supabase.com and sign up (free tier is fine to start)
2. New project → name it "luna" (or anything) → choose a region near you → set a database password (you won't need it day-to-day)
3. Wait for the project to provision (~2 min)

## 2. Run the schema

1. In the Supabase dashboard, go to **SQL Editor**
2. Open the file `supabase-schema.sql` from this repo
3. Paste it in and click **Run**
4. You should see "Success. No rows returned."

## 3. Configure auth

1. **Authentication → Providers → Email**: make sure "Enable Email provider" is on. Decide whether to require email confirmation (recommended yes).
2. **Authentication → URL Configuration**:
   - Site URL: `https://jodi1time.github.io/Luna/`
   - Redirect URLs: add `https://jodi1time.github.io/Luna/#reset` and `http://localhost:5173/#reset` for local dev

## 4. Get your keys

1. **Project Settings → API**
2. Copy the **Project URL** (e.g. `https://abcd1234.supabase.co`)
3. Copy the **anon public** key (the long JWT — this is safe to expose; it's gated by Row Level Security)

## 5. Add to local dev

Create `.env.local` in the project root (already gitignored):

```
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiI...
```

Restart `npm run dev`.

## 6. Add to GitHub Pages deploy

In the GitHub repo: **Settings → Secrets and variables → Actions → New repository secret**:
- `VITE_SUPABASE_URL` → your project URL
- `VITE_SUPABASE_ANON_KEY` → your anon key

The deploy workflow already reads these at build time once you add them.

## 7. Deploy the delete-account Edge Function

The in-app "Delete my account" flow calls a Supabase Edge Function
(`supabase/functions/delete-account/index.ts`) that uses the
service-role key to actually remove the user from `auth.users` (which
cascades to `profiles`). The function needs to be deployed once to
your Supabase project.

1. **Install the Supabase CLI**
   - Mac: `brew install supabase/tap/supabase`
   - Other platforms: `npm install -g supabase` (or see the
     [official install docs](https://supabase.com/docs/guides/cli/getting-started))

2. **Log in from the repo root**
   ```
   supabase login
   ```
   This opens a browser to authorize the CLI.

3. **Link the local repo to your Supabase project**
   ```
   supabase link --project-ref <PROJECT-REF>
   ```
   Your project ref is the subdomain part of your Supabase dashboard
   URL (e.g. `abcd1234` for `https://supabase.com/dashboard/project/abcd1234`).

4. **Deploy the function**
   ```
   supabase functions deploy delete-account --no-verify-jwt
   ```
   `--no-verify-jwt` is intentional: the function does its own JWT
   verification (it reads the user from the token using the anon
   client, then deletes that specific user via the service-role
   client). Supabase doesn't need to verify before invoking.

5. **Environment variables — nothing to set manually**
   The function uses `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and
   `SUPABASE_SERVICE_ROLE_KEY`. These are auto-populated as
   environment variables by Supabase for Edge Functions, so you do
   **not** need to configure them yourself.

After deployment, the in-app delete button hits
`<PROJECT-URL>/functions/v1/delete-account`, the function deletes
the `auth.users` row (cascading to `profiles`), and the client wipes
the local vault and reloads.

## 8. Done

Sign up in the app should now work end-to-end. The vault passcode remains separate — your cycle data still never leaves the device.
