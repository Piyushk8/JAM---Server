// db/index.ts - Direct configuration approach
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// Direct configuration matching your Docker setup
const dbConfig = {
  host: 'localhost',
  port: 5432,
  user: 'myuser',
  password: 'mypassword',
  database: 'mydb',
};

const pool = new Pool(dbConfig);

// Test connection
pool.on("connect", () => {
  console.log("✅ Connected to PostgreSQL database");
});

pool.on("error", (err) => {
  console.error("❌ PostgreSQL pool error:", err);
});

// Immediate connection test
async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log("✅ Database connection successful, current time:", result.rows[0].now);
    client.release();
  } catch (err) {
    console.error("❌ Database connection failed:", err);
    throw err;
  }
}

testConnection().catch(console.error);

export const db = drizzle(pool, { schema });