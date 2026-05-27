# IronForge Gym — Phase 2 Deployment Guide
## Drizzle ORM + Docker Postgres (Local Development)

---

## Prerequisites

- Node.js 18+
- Docker Desktop installed and running
- Project cloned from GitHub
- Phase 1 (Clerk auth) already complete

---

## Step 1 — Install Dependencies

```bash
npm install drizzle-orm pg
npm install -D drizzle-kit
npm install dotenv
```

---

## Step 2 — Docker Compose Setup

Create `docker-compose.yml` in project root:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16
    container_name: ironforge-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ironforge
      POSTGRES_PASSWORD: ironforge123
      POSTGRES_DB: ironforge_db
    ports:
      - "5433:5432"
    volumes:
      - ironforge_pgdata:/var/lib/postgresql/data

volumes:
  ironforge_pgdata:
```

> ⚠️ We use port `5433` (not `5432`) to avoid conflicts with other Postgres instances.

Start the container:

```bash
docker-compose up -d
```

Verify it's running:

```bash
docker ps
# Should show: ironforge-postgres → 0.0.0.0:5433->5432/tcp
```

---

## Step 3 — Environment Variables

Add to `.env` (for Drizzle Kit CLI):
```
DATABASE_URL=postgresql://ironforge:ironforge123@localhost:5433/ironforge_db
```

Add to `.env.local` (for Next.js app):
```
DATABASE_URL=postgresql://ironforge:ironforge123@localhost:5433/ironforge_db
```

> ⚠️ Both files must have port `5433`.

---

## Step 4 — Drizzle Config

Create `drizzle.config.js` in project root:

```js
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out:     './drizzle',
  schema:  './db/schema.js',
  dialect: 'postgresql',
  dbCredentials: {
    url: 'postgresql://ironforge:ironforge123@localhost:5433/ironforge_db',
  },
});
```

---

## Step 5 — DB Connection File

Create `db/index.js`:

```js
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool }    from 'pg';
import * as schema from './schema.js';

const pool = new Pool({
  connectionString:        process.env.DATABASE_URL,
  max:                     10,
  idleTimeoutMillis:       30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('[db] Pool error:', err.message);
});

pool.on('connect', () => {
  console.log('[db] Connected to Postgres:', process.env.DATABASE_URL?.slice(0, 50));
});

export const drizzleDb = drizzle(pool, { schema });
export { pool };
```

---

## Step 6 — Schema

Create `db/schema.js` with all table definitions.
Schema matches Supabase exactly with these key differences:

```
profiles.id     → text (Clerk user ID, not UUID)
renewed_by      → text (Clerk user ID)
recorded_by     → text (Clerk user ID)
marked_by       → text (Clerk user ID)
followed_by     → text (Clerk user ID)
assigned_by     → text (Clerk user ID)
```

All tables include indexes on frequently queried columns.

---

## Step 7 — Generate & Run Migration

Generate SQL migration file:
```bash
npx drizzle-kit generate
```

Run migration (creates all tables):
```bash
docker exec -i ironforge-postgres psql -U ironforge -d ironforge_db < ./drizzle/0000_*.sql
```

Verify tables created:
```bash
docker exec -it ironforge-postgres psql -U ironforge -d ironforge_db -c "\dt"
# Should show 22 rows
```

---

## Step 8 — Seed Initial Data

Enter psql:
```bash
docker exec -it ironforge-postgres psql -U ironforge -d ironforge_db
```

Insert branch:
```sql
INSERT INTO branches (id, name, currency, is_active)
VALUES (gen_random_uuid(), 'IronForge Gym', 'BZD', true)
RETURNING id;
```

Insert admin profile (use Clerk user ID and branch ID from above):
```sql
INSERT INTO profiles (id, branch_id, role, first_name, last_name, email, is_active)
VALUES (
  'YOUR_CLERK_USER_ID',
  'YOUR_BRANCH_ID',
  'admin',
  'First',
  'Last',
  'admin@email.com',
  true
);
```

Exit psql:
```bash
\q
```

---

## Step 9 — Test Connection

```bash
npm run dev
```

Check terminal for:
```
[db] Connected to Postgres: postgresql://ironforge:...
GET /api/branch         200
GET /api/admin/profile  200
```

---

## Docker Commands Reference

```bash
# Start containers
docker-compose up -d

# Stop containers (data preserved)
docker-compose stop

# Start stopped containers
docker-compose start

# Stop and remove containers (data preserved in volume)
docker-compose down

# Stop and remove everything including data ⚠️
docker-compose down -v

# View running containers
docker ps

# View container logs
docker logs ironforge-postgres

# Enter psql
docker exec -it ironforge-postgres psql -U ironforge -d ironforge_db
```

---

## For New Developers (Onboarding)

```bash
git pull                    # get latest code
docker-compose up -d        # start postgres
npm install                 # install packages
# Add DATABASE_URL to .env and .env.local (port 5433)
docker exec -i ironforge-postgres psql -U ironforge -d ironforge_db < ./drizzle/0000_*.sql
# Seed branch and profile (ask team lead for IDs)
npm run dev                 # start app
```

---

## Architecture Notes

```
Supabase Storage  → KEPT (profile photos, avatars)
Supabase DB       → REPLACED by Docker Postgres
Clerk             → Auth (replaces Supabase Auth)
Drizzle ORM       → DB queries (replaces supabase.from())
```

### Query Pattern (Client Components)

```
Client component
  → fetch('/api/route')
    → API route uses drizzleDb
      → queries local Postgres
        → returns JSON
```

Never use Drizzle directly in client components.
Always go through API routes.

---

## Troubleshooting

### `role "ironforge" does not exist`
Another Postgres is running on same port.
Solution: Use port 5433 in docker-compose.yml and DATABASE_URL.

### `No tables found` after migration
Migration file didn't run. Use direct psql command:
```bash
docker exec -i ironforge-postgres psql -U ironforge -d ironforge_db < ./drizzle/0000_*.sql
```

### `drizzle-kit push` does nothing
Use direct SQL migration instead of push command.

### Pool connection cached after port change
Hard restart Next.js — close terminal, open new one, run `npm run dev`.


## tunneling

Update Clerk webhook to: VPS IP