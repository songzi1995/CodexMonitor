import { execSync } from "node:child_process";
import process from "node:process";
import { buildMergeBranchName, buildVerifyCommands } from "./i18n-sync-lib.mjs";

function run(cmd, options = {}) {
  execSync(cmd, { stdio: "inherit", ...options });
}

function output(cmd) {
  return execSync(cmd, { encoding: "utf8" }).trim();
}

function ensureCleanWorkingTree() {
  if (output("git status --porcelain") !== "") {
    throw new Error("Working tree is not clean. Commit or stash changes first.");
  }
}

function ensureRemote(remote) {
  try {
    output(`git remote get-url ${remote}`);
  } catch {
    throw new Error(`Missing git remote '${remote}'. Add it before continuing.`);
  }
}

function formatDate(date) {
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseArgs(args) {
  let dateOverride;
  let skipVerify = false;

  for (const arg of args) {
    if (arg === "--skip-verify" || arg === "--no-verify") {
      skipVerify = true;
      continue;
    }
    if (arg.startsWith("--date=")) {
      dateOverride = arg.slice("--date=".length);
    }
    if (arg === "--help") {
      return { help: true };
    }
  }

  return { dateOverride, skipVerify, help: false };
}

function showHelp() {
  console.log("Usage: node scripts/i18n-sync.mjs [--skip-verify] [--date=YYYY-MM-DD]");
}

const { dateOverride, skipVerify, help } = parseArgs(process.argv.slice(2));
if (help) {
  showHelp();
  process.exit(0);
}

const mainBranch = "main";
const i18nBranch = "i18n";
const upstreamRemote = "upstream";

try {
  ensureCleanWorkingTree();
  ensureRemote(upstreamRemote);

  const rerere = output("git config --global rerere.enabled");
  if (rerere !== "true") {
    console.warn("[i18n-sync] git rerere is disabled.");
    console.warn("Enable once with: git config --global rerere.enabled true");
  }

  run(`git fetch ${upstreamRemote} --prune`);
  run(`git checkout ${mainBranch}`);
  run(`git merge --ff-only ${upstreamRemote}/${mainBranch}`);

  run(`git checkout ${i18nBranch}`);

  const today = dateOverride ?? formatDate(new Date());
  const mergeBranch = buildMergeBranchName(today);

  const existing = output(`git show-ref --verify --quiet refs/heads/${mergeBranch} && echo yes || echo no`);
  if (existing === "yes") {
    throw new Error(`Branch '${mergeBranch}' already exists. Delete it or choose another date.`);
  }

  run(`git checkout -b ${mergeBranch} ${i18nBranch}`);
  run(`git merge ${mainBranch}`);

  if (!skipVerify) {
    for (const cmd of buildVerifyCommands()) {
      run(cmd);
    }
  } else {
    console.log("[i18n-sync] Verification skipped.");
  }

  console.log(`[i18n-sync] Merge branch ready: ${mergeBranch}`);
  console.log("Resolve conflicts if any, then merge back into i18n.");
} catch (error) {
  console.error(`[i18n-sync] ${error.message ?? error}`);
  process.exit(1);
}
