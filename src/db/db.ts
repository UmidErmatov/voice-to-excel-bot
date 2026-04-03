// src/db/db.ts
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../../drizzle/schema';

const connectionString = process.env.DATABASE_URL;

console.log('🔍 DATABASE_URL:', connectionString);
console.log('🔍 Type:', typeof connectionString);

if (!connectionString) {
  throw new Error('❌ DATABASE_URL is not defined');
}

// Qo'shtirnoqlarni olib tashlash (agar .env'da bo'lsa)
const cleanConnectionString = connectionString.replace(/['"]/g, '');

console.log('🔍 Clean URL:', cleanConnectionString);

export const pool = new Pool({
  connectionString: cleanConnectionString,
});

// Test connection
pool
  .connect()
  .then((client) => {
    console.log('✅ PostgreSQL connected successfully');
    client.release();
  })
  .catch((err) => {
    console.error('❌ PostgreSQL connection error:', err.message);
    console.error('Full error:', err);
  });

export const db = drizzle(pool, { schema });
export type Database = typeof db;
