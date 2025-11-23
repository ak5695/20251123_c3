import "dotenv/config";
import { db } from "../lib/db";
import { questions } from "../lib/db/schema";
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

  console.log(`Found ${data.length} questions. Starting seed...`);

  const batchSize = 100;
  let batch = [];

  for (const item of data) {
    const options = [];
    if (item["Option A"]) options.push({ label: "A", value: item["Option A"] });
    if (item["Option B"]) options.push({ label: "B", value: item["Option B"] });
    if (item["Option C"]) options.push({ label: "C", value: item["Option C"] });
    if (item["Option D"]) options.push({ label: "D", value: item["Option D"] });
    if (item["Option E"]) options.push({ label: "E", value: item["Option E"] });

    batch.push({
      type: mapType(item["Type"]),
      content: item["Question"],
      options: JSON.stringify(options),
      answer: item["Answer"],
      explanation: item["答案解析"],
      mnemonic: item["记忆技巧"],
      category: item["类别关键词"],
      keywords: JSON.stringify(item["题目关键词"] || []),
    });

    if (batch.length >= batchSize) {
      await db.insert(questions).values(batch);
      batch = [];
      process.stdout.write(".");
    }
  }

  if (batch.length > 0) {
    await db.insert(questions).values(batch);
  }

  console.log("\nSeeding completed!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
