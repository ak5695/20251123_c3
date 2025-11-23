import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db"; // Adjust path if needed
import * as schema from "./db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg", // or "mysql", "sqlite"
    schema: schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins: [
    "https://c3.dufran.cn",
    "https://www.c3.dufran.cn",
    "http://localhost:3000",
  ],
});
