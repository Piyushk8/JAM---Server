import { defineConfig } from "drizzle-kit";

if(!process.env.DATABASE_URL){
  console.log("no db url provided")
}
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL || "",
  },
});
