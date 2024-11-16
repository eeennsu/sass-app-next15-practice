import { serverEnv } from '@/lib/data/env/server-env'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

const sql = neon(serverEnv.DATABASE_URL)
export const db = drizzle({ client: sql, schema, logger: true })
