import "dotenv/config";
import { db } from "../lib/db";
import { questions } from "../lib/db/schema";
import { sql } from "drizzle-orm";

async function main() {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(questions);
  console.log("Count in DB:", result[0].count);
}

main().catch(console.error);
