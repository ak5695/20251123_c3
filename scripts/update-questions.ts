import "dotenv/config";
import { db } from "../lib/db";
import { questions } from "../lib/db/schema";
import { eq } from "drizzle-orm";
import fs from "fs";
import path from "path";

const mapType = (type: string) => {
  if (type.includes("单选")) return "SINGLE";
  if (type.includes("多选")) return "MULTIPLE";
  if (type.includes("判断")) return "JUDGE";
  return "SINGLE";
};

async function main() {
  const jsonPath = path.join(process.cwd(), "广东C3终极完美版.json");
  const fileContent = fs.readFileSync(jsonPath, "utf-8");
  const data = JSON.parse(fileContent);

  console.log(`Found ${data.length} questions. Starting update...`);

  let updatedCount = 0;

  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    const id = i + 1; // Assuming 1-based ID matches the Serial/Index

    const options = [];
    if (item["Option A"]) options.push({ label: "A", value: item["Option A"] });
    if (item["Option B"]) options.push({ label: "B", value: item["Option B"] });
    if (item["Option C"]) options.push({ label: "C", value: item["Option C"] });
    if (item["Option D"]) options.push({ label: "D", value: item["Option D"] });
    if (item["Option E"]) options.push({ label: "E", value: item["Option E"] });

    await db
      .update(questions)
      .set({
        type: mapType(item["Type"]),
        content: item["Question"],
        options: JSON.stringify(options),
        answer: item["Answer"],
        explanation: item["答案解析"],
        mnemonic: item["记忆技巧"],
        category: item["类别关键词"],
        keywords: JSON.stringify(item["题目关键词"] || []),
      })
      .where(eq(questions.id, id));

    updatedCount++;
    if (updatedCount % 100 === 0) {
      process.stdout.write(".");
    }
  }

  console.log(`\nUpdated ${updatedCount} questions.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
