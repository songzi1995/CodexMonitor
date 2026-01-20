import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const srcRoot = path.join(root, "src");

export function detectLiteralStrings(source) {
  const matches = [];
  const allowedAttributes = new Set([
    "aria-label",
    "title",
    "placeholder",
    "label",
    "alt",
    "data-label",
    "data-tooltip",
    "data-value",
  ]);
  const hasLetters = /[A-Za-z\u4e00-\u9fff]/;
  const sourceFile = ts.createSourceFile("scan.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

  const record = (type, text, index) => {
    if (!text || !hasLetters.test(text)) {
      return;
    }
    matches.push({ type, text, index });
  };

  const walk = (node) => {
    if (ts.isJsxText(node)) {
      const text = node.getText(sourceFile).trim();
      record("jsx-text", text, node.getStart(sourceFile));
    }

    if (ts.isJsxAttribute(node)) {
      const name = node.name.getText(sourceFile);
      if (allowedAttributes.has(name) && node.initializer) {
        if (ts.isStringLiteral(node.initializer)) {
          record("jsx-attr", node.initializer.text.trim(), node.initializer.getStart(sourceFile));
        } else if (ts.isJsxExpression(node.initializer) && node.initializer.expression) {
          const expr = node.initializer.expression;
          if (ts.isStringLiteral(expr) || ts.isNoSubstitutionTemplateLiteral(expr)) {
            record("jsx-attr", expr.text.trim(), expr.getStart(sourceFile));
          }
        }
      }
    }

    ts.forEachChild(node, walk);
  };

  walk(sourceFile);

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
      if (entry.name.endsWith(".test.tsx")) {
        continue;
      }
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
