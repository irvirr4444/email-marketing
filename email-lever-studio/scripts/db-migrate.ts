#!/usr/bin/env npx tsx
/**
 * Apply a SQL migration file to the database referenced by DATABASE_URL.
 *
 * Usage:
 *   npm run db:migrate -- ../db/migrations/004_workspace_campaign_style.sql
 */
import { readFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { config as loadEnv } from 'dotenv'
import { Client } from 'pg'

const __dirname = dirname(fileURLToPath(import.meta.url))

loadEnv({ path: resolve(__dirname, '../../.env') })

// Supabase direct connections (db.<ref>.supabase.co:5432) are IPv6-only.
// On IPv4 networks we fall back to the Supavisor session pooler, which needs
// the project's AWS region. These are the common regions to probe.
const POOLER_REGIONS = [
  'eu-central-1', 'eu-west-1', 'eu-west-2', 'eu-west-3', 'eu-central-2',
  'eu-north-1', 'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
  'ap-southeast-1', 'ap-southeast-2', 'ap-south-1', 'ap-northeast-1',
  'ap-northeast-2', 'sa-east-1', 'ca-central-1',
]

type Conn = { host: string; port: number; user: string; password: string; database: string }

/** Parse a postgres URL into its parts. */
function parseUrl(url: string): { ref: string; password: string; database: string } {
  const u = new URL(url)
  const ref = u.hostname.replace(/^db\./, '').replace(/\.supabase\.co$/, '')
  return {
    ref,
    password: decodeURIComponent(u.password),
    database: u.pathname.replace(/^\//, '') || 'postgres',
  }
}

async function tryConnect(conn: Conn): Promise<Client | null> {
  const client = new Client({
    ...conn,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 8000,
    statement_timeout: 120000,
  })
  try {
    await client.connect()
    return client
  } catch {
    await client.end().catch(() => {})
    return null
  }
}

/** Resolve a live client: direct connection first, then pooler region probing. */
async function resolveClient(connectionString: string): Promise<Client> {
  const direct = await tryConnect({
    host: new URL(connectionString).hostname,
    port: Number(new URL(connectionString).port) || 5432,
    user: decodeURIComponent(new URL(connectionString).username) || 'postgres',
    password: decodeURIComponent(new URL(connectionString).password),
    database: new URL(connectionString).pathname.replace(/^\//, '') || 'postgres',
  })
  if (direct) {
    console.log('Connected via direct connection.')
    return direct
  }

  const { ref, password, database } = parseUrl(connectionString)
  for (const prefix of ['aws-1', 'aws-0']) {
    for (const region of POOLER_REGIONS) {
      const host = `${prefix}-${region}.pooler.supabase.com`
      const client = await tryConnect({
        host,
        port: 5432, // session pooler
        user: `postgres.${ref}`,
        password,
        database,
      })
      if (client) {
        console.log(`Connected via pooler: ${host}`)
        return client
      }
    }
  }
  throw new Error('Could not connect via direct connection or any pooler region.')
}

async function main() {
  const fileArg = process.argv[2]
  if (!fileArg) {
    console.error('Usage: npm run db:migrate -- <path-to-sql-file>')
    process.exit(1)
  }

  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.error('DATABASE_URL is not set in .env')
    process.exit(1)
  }

  const sqlPath = resolve(process.cwd(), fileArg)
  const sql = await readFile(sqlPath, 'utf8')

  const client = await resolveClient(connectionString)
  try {
    await client.query('begin')
    await client.query(sql)
    await client.query('commit')
    console.log(`Applied migration: ${sqlPath}`)
  } catch (err) {
    await client.query('rollback')
    throw err
  } finally {
    await client.end()
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
