import fs from "fs";
import path from "path";

const jsonPath = path.join(process.cwd(), "广东C3终极完美版.json");
const fileContent = fs.readFileSync(jsonPath, "utf-8");
const data = JSON.parse(fileContent);
console.log("Count in JSON:", data.length);
