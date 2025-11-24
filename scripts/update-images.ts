import "dotenv/config";
import { db } from "../lib/db";
import { questions } from "../lib/db/schema";
import { eq } from "drizzle-orm";
import fs from "fs";
import path from "path";

async function main() {
  console.log("Starting image update...");
  let updatedCount = 0;

  for (let id = 1803; id <= 1852; id++) {
    const jpgPath = path.join(process.cwd(), "public", "img", `${id}.jpg`);
    const pngPath = path.join(process.cwd(), "public", "img", `${id}.png`);

    let imagePath = null;

    if (fs.existsSync(jpgPath)) {
      imagePath = `/img/${id}.jpg`;
    } else if (fs.existsSync(pngPath)) {
      imagePath = `/img/${id}.png`;
    }

    if (imagePath) {
      await db
        .update(questions)
        .set({ image: imagePath })
        .where(eq(questions.id, id));
      console.log(`Updated question ${id} with image ${imagePath}`);
      updatedCount++;
    } else {
      console.log(`No image found for question ${id}`);
    }
  }

  console.log(`\nUpdated ${updatedCount} questions with images.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
