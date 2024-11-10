import { serverEnv } from '@/lib/data/env/server-env'
import 'dotenv/config'
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
    out: './src/drizzle/migrations',
    schema: './src/drizzle/schema.ts',
    dialect: 'postgresql',
    strict: true,
    verbose: true,
    dbCredentials: {
        url: serverEnv.DATABASE_URL,
    },
})
