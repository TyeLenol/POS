import dns from 'dns/promises'
import dotenv from 'dotenv'
import pg from 'pg'

dotenv.config()

const { Pool } = pg

const rawUrl = process.env.DATABASE_URL || ''

async function buildPoolConfig() {
  const isNeon = rawUrl.includes('neon.tech')

  if (!isNeon) {
    return {
      connectionString: rawUrl,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    }
  }

  // Neon on this machine: IPv6 is unreachable, so resolve to IPv4 explicitly
  // and pass the endpoint ID so Neon can route without SNI
  const parsed = new URL(rawUrl.replace(/^postgresql:\/\//, 'http://'))
  const hostname = parsed.hostname // e.g. ep-autumn-rain-ank0c07v.c-6.us-east-1.aws.neon.tech
  const endpointId = hostname.split('.')[0] // ep-autumn-rain-ank0c07v

  let host = hostname
  try {
    const addresses = await dns.resolve4(hostname)
    if (addresses.length > 0) host = addresses[0]
  } catch {
    // fall back to hostname if DNS fails
  }

  // Strip sslmode from URL params (we handle SSL ourselves)
  const cleanedSearch = parsed.search.replace(/[?&]sslmode=[^&]*/g, '').replace(/^\?$/, '')

  return {
    host,
    port: Number(parsed.port) || 5432,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.slice(1),
    ssl: { rejectUnauthorized: false },
    options: `endpoint=${endpointId}`,
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    // suppress the sslmode warning
    ...(cleanedSearch ? {} : {}),
  }
}

const config = await buildPoolConfig()
export const pool = new Pool(config)

pool.connect((err, client, release) => {
  if (err) {
    console.warn('DB warm-up failed:', err.message || err.code || 'connection error')
    return
  }
  client.query('SELECT 1', () => {
    release()
    console.log('DB connection ready')
  })
})
