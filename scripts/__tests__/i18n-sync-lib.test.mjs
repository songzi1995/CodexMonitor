import test from "node:test";
import assert from "node:assert/strict";
import { buildMergeBranchName, buildVerifyCommands } from "../i18n-sync-lib.mjs";

test("buildMergeBranchName uses YYYYMMDD suffix", () => {
  assert.equal(buildMergeBranchName("2026-01-20"), "merge/upstream-20260120");
});

test("buildVerifyCommands returns lint -> typecheck -> test:i18n", () => {
  assert.deepEqual(buildVerifyCommands(), [
    "npm run lint",
    "npm run typecheck",
    "npm run test:i18n",
  ]);
});
