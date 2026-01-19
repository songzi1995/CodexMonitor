import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const enPath = path.join(root, "src/i18n/translations/en.json");
const zhPath = path.join(root, "src/i18n/translations/zh-CN.json");

function flattenKeys(node, prefix = "") {
  if (typeof node !== "object" || node === null) {
    return [];
  }
  return Object.entries(node).flatMap(([key, value]) => {
    const next = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") {
      return [next];
    }
    return flattenKeys(value, next);
  });
}

const [enRaw, zhRaw] = await Promise.all([
  readFile(enPath, "utf8"),
  readFile(zhPath, "utf8"),
]);
const en = JSON.parse(enRaw);
const zh = JSON.parse(zhRaw);

const enKeys = new Set(flattenKeys(en));
const zhKeys = new Set(flattenKeys(zh));

const missing = [...enKeys].filter((key) => !zhKeys.has(key));
const extra = [...zhKeys].filter((key) => !enKeys.has(key));

if (missing.length || extra.length) {
  if (missing.length) {
    console.error(`Missing zh-CN keys (${missing.length}):`);
    missing.forEach((key) => console.error(`  - ${key}`));
  }
  if (extra.length) {
    console.error(`Extra zh-CN keys (${extra.length}):`);
    extra.forEach((key) => console.error(`  - ${key}`));
  }
  process.exit(1);
}

console.log(`i18n OK: ${enKeys.size} keys`);
