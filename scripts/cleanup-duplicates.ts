import "dotenv/config";
import { db } from "../lib/db";
import { questions } from "../lib/db/schema";
import { sql } from "drizzle-orm";

async function main() {
  // Find questions with duplicate content
  const duplicates = await db.execute(sql`
    WITH RankedQuestions AS (
      SELECT 
        id,
        content,
        ROW_NUMBER() OVER (PARTITION BY content ORDER BY id) as rn
      FROM ${questions}
    )
    SELECT id
    FROM RankedQuestions
    WHERE rn > 1
  `);

  console.log(`Found ${duplicates.rows.length} duplicate questions to delete`);

  if (duplicates.rows.length > 0) {
    // Delete duplicates
    for (const row of duplicates.rows) {
      await db.execute(sql`
        DELETE FROM ${questions}
        WHERE id = ${row.id}
      `);
      console.log(`Deleted question ID: ${row.id}`);
    }
  }

  // Check final count
  const finalCount = await db.execute(sql`
    SELECT COUNT(*) as count FROM ${questions}
  `);

  console.log("\nFinal question count:", finalCount.rows[0].count);
}

main()
  .then(() => {
    console.log("Cleanup complete");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });
