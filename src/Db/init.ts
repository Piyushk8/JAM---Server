import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const pool = new Pool({
  host: "localhost",
  port: 5432,
  user: "myuser",
  password: "mypassword",
  database: "kumospace",
});

export const db = drizzle(pool);
