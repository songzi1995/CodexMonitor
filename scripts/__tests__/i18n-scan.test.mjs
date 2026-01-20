import test from "node:test";
import assert from "node:assert/strict";
import { detectLiteralStrings } from "../i18n-scan.mjs";

test("detectLiteralStrings finds JSX text nodes", () => {
  const input = "<div>Hello</div>";
  assert.ok(detectLiteralStrings(input).length > 0);
});
