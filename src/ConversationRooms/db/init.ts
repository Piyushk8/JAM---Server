import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const isProd = process.env.NODE_ENV === "production";

let pool: Pool;

if (isProd) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }, // required for Neon
  });
} else {
  pool = new Pool({
    host: "localhost",
    port: 5432,
    user: "myuser",
    password: "mypassword",
    database: "mydb",
  });
}

pool.on("connect", () => {
  console.log("✅ Connected to PostgreSQL database");
});

pool.on("error", (err) => {
  console.error("❌ PostgreSQL pool error:", err);
});

(async () => {
  try {
    const client = await pool.connect();
    const result = await client.query("SELECT NOW()");
    console.log("✅ Database connection successful, current time:", result.rows[0].now);
    client.release();
  } catch (err) {
    console.error("❌ Database connection failed:", err);
  }
})();

export const db = drizzle(pool, { schema });
