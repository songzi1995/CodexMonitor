import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const srcRoot = path.join(root, "src");

export function detectLiteralStrings(source) {
  const matches = [];
  const textRegex = />[^<>{}][^<]*</g;
  let match;

  while ((match = textRegex.exec(source))) {
    const text = match[0].slice(1, -1).trim();
    if (!text) {
      continue;
    }
    matches.push({ type: "jsx-text", text, index: match.index });
  }

  const stringRegex = /(["'`])((?:\\.|(?!\1).)*?)\1/g;
  while ((match = stringRegex.exec(source))) {
    const text = match[2];
    if (!text.trim()) {
      continue;
    }
    const before = source.slice(Math.max(0, match.index - 12), match.index);
    if (/t\s*\($/.test(before)) {
      continue;
    }
    matches.push({ type: "string", text, index: match.index });
  }

  return matches;
}

async function listTsxFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name.startsWith(".")) {
      continue;
    }
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listTsxFiles(fullPath)));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".tsx")) {
      files.push(fullPath);
    }
  }
  return files;
}

async function scan() {
  const files = await listTsxFiles(srcRoot);
  const findings = [];

  for (const file of files) {
    const content = await readFile(file, "utf8");
    const matches = detectLiteralStrings(content);
    for (const item of matches) {
      findings.push({ file, ...item });
    }
  }

  if (findings.length === 0) {
    console.log("[i18n-scan] No literal strings found.");
    return;
  }

  console.log(`[i18n-scan] Found ${findings.length} literal strings:`);
  for (const item of findings) {
    const snippet = item.text.length > 80 ? `${item.text.slice(0, 77)}...` : item.text;
    console.log(`- ${path.relative(root, item.file)}:${item.index} (${item.type}) ${snippet}`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  scan().catch((error) => {
    console.error(`[i18n-scan] ${error.message ?? error}`);
    process.exit(1);
  });
}
