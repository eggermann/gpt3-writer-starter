# Date a Bot or Not

A consent-forward robo-human dating lab built on Next.js. Users can flirt, match, and unlock a 5-minute Jitsi test date when both opt in.

## Quick start (local dev)

1. Install dependencies

```bash
npm install
```

2. Configure environment variables

Create a `.env.local` with:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GEMINI_API_KEY=your_gemini_api_key
ADMIN_EMAILS=you@example.com,other@example.com
```

`SUPABASE_SERVICE_ROLE_KEY` is required for bot seeding and the admin console.

3. Apply the schema

Run the SQL in `supabase/schema.sql` inside the Supabase SQL editor.
Re-run this whenever new tables are added (including `match_flow_state` for guided replies).

4. Start the app

```bash
npm run dev
```

## Local start (step-by-step)

1. Install dependencies

```bash
npm install
```

2. Create `.env.local` (see above)

3. Apply the schema in Supabase

4. Start the dev server

```bash
npm run dev
```

Open `http://localhost:3000`.

## Live deployment (production)

1. Build

```bash
npm run build
```

2. Start the server

```bash
npm run start
```

Make sure the same environment variables from `.env.local` are set in your hosting provider.

## Uberspace deploy (production)

1. SSH in and create an app folder (not in docroot)

```bash
mkdir -p ~/apps/dabon
cd ~/apps/dabon
```

2. Select a Node.js version

```bash
uberspace tools version list node
uberspace tools version use node 22
```

3. Upload your code (example with git)

```bash
git clone <your-repo-url> .
```

4. Install dependencies and build

```bash
npm install
npm run build
```

5. Create `.env.local` in the app folder

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
GEMINI_API_KEY=...
ADMIN_EMAILS=you@example.com
```

6. Create a Supervisor service

Create `~/etc/services.d/dabon.ini`:

```
[program:dabon]
directory=/home/<USER>/apps/dabon
command=npm run start -- -p 3000 -H 0.0.0.0
autostart=true
autorestart=true
environment=NODE_ENV=production
```

Then load it:

```bash
supervisorctl reread
supervisorctl update
supervisorctl start dabon
```

7. Point the web backend to the Node port

```bash
uberspace web backend set / --http --port 3000
uberspace web backend list
```

Open your domain and confirm the app is running.

## Seed the bot roster (live mode)

1. Ensure `SUPABASE_SERVICE_ROLE_KEY` is set in `.env.local`.
2. Run:

```bash
npm run seed:bots
```

This creates or updates the starter bot roster (Robin Hood, Aria, Sol, Nova, Jade, Rio) with profiles marked `is_bot = true`.

## Demo mode

If Supabase is not configured, the app boots into demo mode with local data.

## Notes

- Bots are regular accounts marked with `is_bot = true`.
- Jitsi rooms are hosted on `meet.jit.si` for the 5-minute test date.
- Safety baseline includes age gating, report/block, and consent logging.
- Realtime chat and match updates use Supabase Realtime (enabled by default).
- Moderation console lives at `/admin/moderation` and is restricted by `ADMIN_EMAILS`.
- Spark line flow lets users reply to a starter prompt and ranks responders by text similarity.
- Guided reply flow narrows choices each round so two users converge into a match-ready state.
- Bots can initiate openers and send one gentle follow-up autonomously.
