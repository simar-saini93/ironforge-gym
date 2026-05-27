
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out:    './drizzle',
  schema: './db/schema.js',
  dialect: 'postgresql',
  dbCredentials: {
    url: 'postgresql://ironforge:ironforge123@localhost:5432/ironforge_db',
  },
});
