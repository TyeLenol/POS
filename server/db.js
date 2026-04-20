import dotenv from 'dotenv'
import pg from 'pg'

dotenv.config()

const { Pool } = pg

const connectionString = process.env.DATABASE_URL
const shouldUseSsl = Boolean(connectionString && connectionString.includes('neon.tech'))

export const pool = new Pool({
  connectionString,
  ssl: shouldUseSsl ? { rejectUnauthorized: false } : undefined,
})
