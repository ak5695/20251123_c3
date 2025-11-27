import "dotenv/config";
import { db } from "../lib/db";
import { questions } from "../lib/db/schema";
import { sql } from "drizzle-orm";

async function main() {
  // Check for duplicate questions by content
  const duplicates = await db.execute(sql`
    SELECT content, COUNT(*) as count
    FROM ${questions}
    GROUP BY content
    HAVING COUNT(*) > 1
    ORDER BY count DESC
    LIMIT 20
  `);

  console.log("Duplicate questions by content:");
  console.log(duplicates.rows);

  // Get total count
  const totalCount = await db.execute(sql`
    SELECT COUNT(*) as count FROM ${questions}
  `);

  console.log("\nTotal questions in database:", totalCount.rows[0]);

  // Check ID range
  const idRange = await db.execute(sql`
    SELECT MIN(id) as min_id, MAX(id) as max_id FROM ${questions}
  `);

  console.log("\nID Range:", idRange.rows[0]);
}

main()
  .then(() => {
    console.log("Check complete");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });
